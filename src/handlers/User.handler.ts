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
  searchAllUsers,
  subCredits,
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
import Stripe from 'stripe';

const BEATS_HOST = process.env.BEATS_HOST || 'http://localhost:8082';

const stripeClient = new StripeClient();

export const indexHandler = async (req: Request, res: Response, next: NextFunction) => {
  return res.status(200).json({ message: 'User service online!' });
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
    const verificationCode = await createVerifyEmailCode(user._id);
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
  // query db to see if the secret code exists
  if (!user) {
    return res.status(500).json({ message: 'No user found' });
  }
  try {
    const verifyEmail = await findVerifyEmailCode(code as string);
    if (verifyEmail?.userId == (user as string)) {
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
    return res.status(503).json({ message: 'An error occured ' });
  }
};

export const resendVerificationEmailHandler = async (req: Request, res: Response) => {
  const user = req.query.user;

  if (!user) {
    return res.status(500).json({ message: 'No user found' });
  }
  try {
    let verifyEmail = await findVerifyEmailCodeByUser(user as string);
    if (!verifyEmail) {
      verifyEmail = await createVerifyEmailCode(user as string);
    }
    const userEntitiy = await findUserById(user as string);
    if (!userEntitiy) {
      return res.status(500).json({ message: 'No user found in the database' });
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
        sessionUrl = (await stripeClient.createBasicTierCheckout()).url as string;
        break;
      case 'std':
        sessionUrl = (await stripeClient.createStdTierCheckout()).url as string;
        break;
      case 'prem':
        sessionUrl = (await stripeClient.createPremTierCheckout()).url as string;
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
