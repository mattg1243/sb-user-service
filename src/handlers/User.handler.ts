import { NextFunction, Request, Response } from 'express';
import {
  addCredits,
  changeUserPassword,
  createUser,
  createVerifyEmailCode,
  deleteVerifyEmailCode,
  findUserByEmail,
  findUserById,
  findUserPasswordResetToken,
  findVerifyEmailCode,
  findVerifyEmailCodeByUser,
  getCreditsBalance,
  getCreditsEarned,
  searchAllUsers,
  updateUserById,
} from '../services/User.service';
import { CreateUserInput, UpdateUserInput, validSocialLinkDomains } from '../database/schemas/User.schema';
import { sendUnaryData, ServerUnaryCall } from '@grpc/grpc-js';
import { GetUserForLoginRequest, GetUserForLoginResponse } from '../proto/user_pb';
import axios from 'axios';
import { uploadFileToS3 } from '../bucket/upload';
import { sendResetPasswordEmail, sendVerificationEmail } from '../utils/sendgridConfig';
import User from '../database/models/User.entity';
import { makeValidUrl } from '../utils/stringMatchers';
import StripeClient from '../utils/StripeClient';
import { LIMITED_LICENSE_COST, UNLIMITED_LICENSE_COST } from '../config';
import { subCredits } from '../services/User.service';
import { AppDataSource } from '../database/dataSource';
import Transaction from '../database/models/Transaction.model';
import License from '../database/models/License.entity';
import { getAllLicensesByUser, userHasLicense } from '../services/License.service';

export const BEATS_HOST = process.env.BEATS_HOST || 'http://localhost:8082';
export const NOTIF_HOST = process.env.NOTIF_HOST || 'http://0.0.0.0:8083';

const stripeClient = new StripeClient();

export const indexHandler = async (req: Request, res: Response, next: NextFunction) => {
  return res.status(200).json({ message: 'User service online!' });
};

export const testNotifyHandler = async (req: Request, res: Response) => {
  try {
    const notifRes = await axios.post(`${NOTIF_HOST}/notify`, {
      user_id: '127a79a2-bcc9-4e9e-8e46-6284f57e7420',
      message: 'hello mothafucka',
    });
    console.log(notifRes.status);
    return res.status(200).send();
  } catch (err) {
    console.error(err);
    return res.status(500).send();
  }
};

export const getUserHandler = async (req: Request, res: Response) => {
  const userId = req.query.id as string;

  if (!userId) {
    return res.status(401).json({ message: 'No user ID provided upon server request' });
  } else {
    try {
      const user = await findUserById(userId);
      if (!user) {
        return res.status(404).json({ message: 'No user with this ID found' });
      }
      res.status(200).json(user.toJSON());
    } catch (err) {
      console.error(err);
      res.status(503).json({ message: 'error getting user:\n', err });
    }
  }
};

export const searchUsersHandlers = async (req: Request, res: Response) => {
  const query = req.query.search as string;
  if (query) {
    try {
      const users = await searchAllUsers(query);
      return res.status(200).json({ users });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'an error occured', err });
    }
  } else {
    return res.status(400).json({ message: 'No search query provided' });
  }
};

export const getAvatarHandler = async (req: Request, res: Response) => {
  const userId = req.query.id as string;

  if (!userId) {
    return res.status(401).json({ message: 'No user ID provided upon server request' });
  } else {
    try {
      const user = await findUserById(userId);
      return res.status(200).json(user?.avatar);
    } catch (err) {
      console.error(err);
      res.status(503).json({ message: 'error getting user avatar:\n', err });
    }
  }
};

export const registerUserHandler = async (req: Request<{}, {}, CreateUserInput>, res: Response, next: NextFunction) => {
  const { email, password, artistName } = req.body;
  const emailRe = /^[a-zA-Z0-9+_.-]+@[a-zA-Z0-9.-]+$/;
  if (!emailRe.test(email)) {
    return res.status(400).json({ message: 'Invalid email address provided.' });
  }
  console.log('artistName: ', artistName);
  try {
    const stripeCustomer = await stripeClient.createCustomer(email);
    const user = await createUser({
      email,
      artistName,
      password,
      stripeCustomerId: stripeCustomer.id,
    });
    // create a verification code and save it to the table
    const verificationCode = await createVerifyEmailCode(user);
    // send the email
    const emailSendInfo = await sendVerificationEmail(verificationCode.hash, user.email, user._id);
    console.log(emailSendInfo);
    // redirect user to to verify page
    console.log(`  --- user registered : ${artistName}  ---  `);
    // create Stripe customer

    // this needs to call the auth service and generate tokens for the new user here
    res.cookie('sb-customer', stripeCustomer.id);
    return res.status(200).json({ message: 'user registered succesfully', user });
  } catch (err: any) {
    if (err.code === '23505') {
      return res.status(403).json({ message: 'A user with this email or username already exists.' });
    }
    console.error(err);
    return res.status(500).json({ message: 'Failed to create the user', err });
  }
};

export const verifyEmailHandler = async (req: Request, res: Response) => {
  const user = req.query.user;
  const code = req.query.code;
  console.log(req);
  // query db to see if the secret code exists
  if (!user) {
    return res.status(500).json({ message: 'No user found' });
  }
  try {
    const verifyEmail = await findVerifyEmailCode(code as string);
    if (verifyEmail?.user._id == (user as string)) {
      const userFromDB = await findUserById(user as string);
      if (!userFromDB) {
        return res.status(500).json({ message: 'No user found ' });
      } else {
        userFromDB.verified = true;
        await deleteVerifyEmailCode(verifyEmail._id);
        await userFromDB.save();
        return res.status(200).json({ verified: true });
      }
    }
  } catch (err) {
    console.error(err);
    return res.status(503).json({ message: 'An error occured ' });
  }
};

export const resendVerificationEmailHandler = async (req: Request, res: Response) => {
  const user = req.query.user;

  if (!user) {
    return res.status(500).json({ message: 'No user found' });
  }
  try {
    const userEntitiy = await findUserById(user as string);
    if (!userEntitiy) {
      return res.status(500).json({ message: 'No user found in the database' });
    }
    let verifyEmail = await findVerifyEmailCodeByUser(user as string);
    if (!verifyEmail) {
      verifyEmail = await createVerifyEmailCode(userEntitiy);
    }

    const sendEmailRes = await sendVerificationEmail(verifyEmail.hash, userEntitiy.email, user as string);
    console.log(sendEmailRes);
    return res.status(200).json({ message: 'Verification email resent' });
  } catch (err: any) {
    console.error(err.response.body);
    return res.status(503).json({ message: 'An error occured ' });
  }
};

export const resetPasswordHandler = async (req: Request, res: Response) => {
  const userEmail = req.query.email;
  if (!userEmail) {
    return res.status(400).json({ message: 'No userId provided with request' });
  }
  try {
    const user = await findUserPasswordResetToken(userEmail as string);
    if (!user) {
      return res.status(404).json({ message: 'No user found with that email address' });
    }
    user.setPasswordResetToken();
    const { token: resetToken, exp } = user.getPasswordResetToken();
    console.log('token made:\n', resetToken);
    await user.save();
    const sendEmailRes = await sendResetPasswordEmail(resetToken, user.email);
    console.log(sendEmailRes);
    return res.status(200).send();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'an err occured', err });
  }
};

export const changePasswordHandler = async (req: Request, res: Response) => {
  const userEmail = req.query.email;
  const resetToken = req.query.token;
  const newPassword = req.body.password;
  if (!userEmail || !resetToken || !newPassword) {
    return res.status(400).json({ message: 'Missing required query param' });
  }

  const user = await findUserPasswordResetToken(userEmail as string);
  console.log(user);
  if (!user) {
    return res.status(404).json({ message: 'no user found with that email' });
  }
  const { token, exp } = user.getPasswordResetToken();
  console.log('resetToken form req:\n', resetToken, '\nfrom db:\n', token);

  // check if expiry has past
  if (exp < new Date()) {
    return res.status(400).json({ message: 'Your reset token has expired, please reset password again' });
  }
  // chack if tokens match
  if ((resetToken as string) == token) {
    const newPasswordHash = await User.hashPassword(newPassword);
    await changeUserPassword(userEmail as string, newPasswordHash);
    return res.status(200).json({ message: 'password reset successfully ' });
  } else {
    return res.status(401).json({ message: 'The provided token doesnt match the database records' });
  }
};

// TODO: make a zod schema for this request body
export const updateUserHandler = async (req: Request<{}, {}, UpdateUserInput>, res: Response) => {
  const user = req.user;
  const token = req.token;
  if (!user) {
    console.log('Middleware failed to attach user to request ');
    return res.status(400).json({ message: 'Middleware failed to attach user to request' });
  }

  const { artistName, bio, socialLink } = req.body;
  try {
    // validate the socialLink
    let socialLinkValidUrl: URL | undefined;
    if (socialLink) {
      socialLinkValidUrl = makeValidUrl(socialLink);
      console.log('social link domain:', socialLinkValidUrl.hostname);
      if (!validSocialLinkDomains.includes(socialLinkValidUrl.host)) {
        return res.status(400).json({ message: 'Invalid social link' });
      }
    } else {
      socialLinkValidUrl = undefined;
    }

    const updatedUser = await updateUserById(user.id, {
      artistName,
      bio,
      socialLink: socialLinkValidUrl ? socialLinkValidUrl.toString() : undefined,
    });

    // check if artistName has been updated and if so, update their beats
    if (artistName !== user.artistName) {
      // this axios request will be made a gRPC remote function call
      const updatedBeatsResponse = await axios.post(
        `${BEATS_HOST}/update-artist-name/${user.id}`,
        {
          artistName,
        },
        {
          withCredentials: true,
          headers: {
            Cookie: `sb-access-token=${token}`,
          },
        }
      );
    }
    console.log(updatedUser);
    return res.status(200).json({ message: 'user info successfully updated' });
  } catch (err) {
    console.error(err);
    return res.status(503).json(err);
  }
};

export const uploadAvatarHandler = async (req: Request, res: Response) => {
  const user = req.user;
  if (!user) {
    console.log('Middleware failed to attach user to request ');
    return res.status(400).json({ message: 'Middleware failed to attach user to request' });
  }

  const newAvatar = req.file;
  if (!newAvatar) {
    return res.status(400).json({ message: 'no file detected while updating avatar' });
  }

  try {
    const uploadAvatarRes = await uploadFileToS3(newAvatar);
    if (!uploadAvatarRes) {
      console.log('error uploading image file');
      return res.status(500).json('error uploading image');
    }
    const avatarKey = uploadAvatarRes.Key;
    const updateUserRes = updateUserById(user.id, { avatar: avatarKey });
    console.log(updateUserRes);
    return res.status(200).json({ message: 'avatar updated successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'an error occured while uploading your new avatar to storage' });
  }
};

// FOR TESTING PURPOSES ONLY - should be made a chron job
export const addCreditsHandler = async (req: Request, res: Response) => {
  const { creditsToAdd } = req.body;
  const userId = req.user?.id;
  if (!userId || !creditsToAdd) {
    return res.status(400);
  }
  try {
    const newBalance = await addCredits(userId, creditsToAdd);
    return res.status(200).json({ message: 'User credits added successfully', creditBalance: newBalance });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: err });
  }
};
// TODO move these into the stripe handler module
export const createSubscriptionHandler = async (
  req: Request<{}, {}, { subTier: 'basic' | 'std' | 'prem'; customerId: string }>,
  res: Response
) => {
  const { subTier, customerId } = req.body;
  let sessionUrl: string;
  try {
    // match to subTier
    switch (subTier) {
      case 'basic':
        sessionUrl = (await stripeClient.createBasicTierCheckout(customerId)).url as string;
        break;
      case 'std':
        sessionUrl = (await stripeClient.createStdTierCheckout(customerId)).url as string;
        break;
      case 'prem':
        sessionUrl = (await stripeClient.createPremTierCheckout(customerId)).url as string;
        break;
      default:
        console.error(`Invalid sub tier requested by customer ${customerId}`);
        return res.status(500).json({ message: `Invalid sub tier requested by customer ${customerId}` });
    }
    // send checkoutSessionUrl to client
    res.json({ checkoutUrl: sessionUrl });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'An error occurred creating your subscription', err });
  }
};

export const createStripePortalSessionHandler = async (req: Request, res: Response) => {
  const customerId = req.query.customerId as string;
  try {
    const session = await stripeClient.createPortalSession(customerId);
    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'An error occured creating a Stripe portal session', err });
  }
};

export const subCreditsHandler = async (req: Request, res: Response) => {
  const { userId, creditsToSub } = req.body;
  if (!creditsToSub || !userId) {
    return res.status(400);
  }
  try {
    const newBalance = await subCredits(userId, creditsToSub);
    return res.status(200).json({ message: 'User credits subtracted successfully', creditBalance: newBalance });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err });
  }
};

export const getEarnedCreditsHandler = async (req: Request, res: Response) => {
  const user = req.user;
  if (!user) {
    return res.status(400).json({ message: 'Missing user in request' });
  }
  try {
    const earnedCredits = await getCreditsEarned(user.id);
    return res.status(200).json({ earnedCredits });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'An error occured getting your earned credits', err });
  }
};

export const purchaseBeatHandler = async (
  req: Request<{}, {}, { userId: string; beat: string; seller: string; licenseType: 'limited' | 'unlimited' }>,
  res: Response
) => {
  const { userId, beat, seller, licenseType } = req.body;
  if (!userId || !beat || !seller || !licenseType) {
    return res.status(400).json({ message: 'Missing a required value in the request' });
  }

  try {
    // see if user already owns a license for this beat
    const hasLicense = await userHasLicense(userId, beat);
    if (hasLicense) {
      // user already owns the beat, return 200 to beat service
      return res.status(200).json({ message: 'User already owns a license to this beat' });
    }
    // determine amount of credits to spend based on license type
    let beatCost: number;
    switch (licenseType) {
      case 'unlimited':
        beatCost = UNLIMITED_LICENSE_COST;
        break;
      case 'limited':
        beatCost = LIMITED_LICENSE_COST;
        break;
      default:
        return res.status(400).json({ message: 'Invalid license type specified in request' });
    }
    // database transaction
    await AppDataSource.manager.transaction(async (txManager) => {
      // get the repository needed
      const userRepo = txManager.getRepository(User);
      const txRepo = txManager.getRepository(Transaction);
      const licenseRepo = txManager.getRepository(License);
      try {
        // get the buyer and seller entities
        const buyerObj = await userRepo.findOneBy({ _id: userId });
        const sellerObj = await userRepo.findOneBy({ _id: seller });
        if (!buyerObj || !sellerObj) {
          return Promise.reject('No users found with provided ids while querying buyer / seller');
        }
        // subtract credits from buyers balance
        if (buyerObj.creditsToSpend - beatCost < 0) {
          return Promise.reject('Not enough credits for this purchase');
        }
        buyerObj.creditsToSpend -= beatCost;
        // add credits to sellers balance
        sellerObj.creditsAcquired += beatCost;
        // create the transaction
        const tx = new Transaction();
        tx.beatId = beat;
        tx.creditAmount = beatCost;
        tx.purchasingUser = buyerObj;
        tx.sellingUser = sellerObj;
        // create the license
        const license = new License();
        license.type = licenseType;
        license.user = buyerObj;
        license.beat = beat;
        license.transaction = tx;
        // save all entities asynchronously
        const saveBuyerPromise = userRepo.save(buyerObj);
        const saveSellerPromise = userRepo.save(sellerObj);
        const saveTxPromse = txRepo.save(tx);
        const saveLicensePromise = licenseRepo.save(license);
        await Promise.all([saveBuyerPromise, saveSellerPromise, saveTxPromse, saveLicensePromise]);
        return res.status(200).json({ message: 'Transaction completed successfully' });
      } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'An error occurred processing your transaction', err });
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'An error occurred purchasing a beat', err });
  }
};

export const getLicensedBeatshandler = async (req: Request, res: Response) => {
  const user = req.query.user as string;
  console.log('getting licenses...');
  try {
    const licenses = await getAllLicensesByUser(user, ['license.beat']);
    let beatIds: Array<string> = [];
    licenses.map((license) => beatIds.push(license.beat));
    return res.status(200).json({ beatIds });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'An error occured getting licensed beats', err });
  }
};

export const getCreditsBalanceHandler = async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(400).json({ message: 'Middelware failed to attach user to request / there is no ID' });
  }
  const creditBalance = await getCreditsBalance(userId as string);
  return res.status(200).json({ creditBalance });
};

// temp function for using http instead of gRPC for the free deployments
export const getUserForLoginHTTP = async (req: Request, res: Response) => {
  const { email } = req.body;
  try {
    const user = await findUserByEmail(email);
    console.log(user);
    if (!user) {
      return res.status(401).json({ message: 'No user found with that email address' });
    }
    // check if user has stripe customer id
    let customerId: string;
    // this can be optimized
    if (user.stripeCustomerId.length < 6) {
      const stripeCustomer = await stripeClient.createCustomer(email);
      user.setCustomerId(stripeCustomer.id);
      await user.save();
      customerId = stripeCustomer.id;
    } else {
      customerId = user.stripeCustomerId;
    }
    const userResponse = {
      id: user._id,
      email: user.email,
      artistName: user.artistName,
      stripeCustomerId: customerId,
      password: user.password,
      isVerified: user.verified,
    };
    return res.status(200).json(userResponse);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'error finding user by email' });
  }
};

// TODO: create a directory dedicated to all gRPC mapped handler functions
export const getUserForLogin = async (
  call: ServerUnaryCall<GetUserForLoginRequest, GetUserForLoginResponse>,
  callback: sendUnaryData<GetUserForLoginResponse>
) => {
  const email = call.request.getEmail();
  try {
    const user = await findUserByEmail(email);
    console.log(user);
    if (!user) {
      return callback({
        code: 5,
        message: 'No user found with that email',
      });
    }
    // create the response variable with only needed fields
    const userResponse = new GetUserForLoginResponse();
    userResponse.setId(user._id);
    userResponse.setEmail(user.email);
    userResponse.setArtistName(user.artistName);
    userResponse.setPassword(user.password);
    return callback(null, userResponse);
  } catch (err: any) {
    console.error(err.code);
    callback(err.code);
  }
};
