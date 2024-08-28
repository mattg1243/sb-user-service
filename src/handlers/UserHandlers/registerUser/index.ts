import { Request, Response } from 'express';
import { CreateUserInput } from '../../../database/schemas/User.schema';
import { createUser, createVerifyEmailCode } from '../../../services/User.service';
import { notifyMeOnNewUser, sendVerificationEmail } from '../../../utils/sendgridConfig';
import StripeClient from '../../../utils/StripeClient';
import { BASIC_SUB_MONTHLY_CREDITS, PREM_SUB_MONTHLY_CREDITS, STD_SUB_MONTHLY_CREDITS } from '../../../config';

const stripeClient = new StripeClient();

export const registerUserHandler = async (req: Request<{}, {}, CreateUserInput>, res: Response) => {
  const { email, password, artistName, dateOfBirth } = req.body;
  // Validate email address
  const emailValid = emailIsValid(email);
  if (!emailValid) return res.json({ message: 'Invalid email address.' });
  // Ensure user is of age
  const dateOfBirthD = new Date(dateOfBirth);
  const ofAge = userIsOfAge(dateOfBirthD);
  if (!ofAge) return res.json({ message: 'You must be at least 13 years of age to create an account with us.' });

  try {
    // Create or retrieve Stripe customer for new user and see if they already purchased a subscription
    const stripeCustomer = await stripeClient.createCustomer(email);
    const subTier = await stripeClient.getSubTier(stripeCustomer.id);
    const creditsToSpend = determineStartingCredits(subTier);

    const user = await createUser({
      email,
      artistName,
      dateOfBirth: dateOfBirthD,
      password,
      stripeCustomerId: stripeCustomer.id,
      subTier: subTier ? subTier : undefined,
      stripeSubStatus: subTier ? 'active' : undefined,
      creditsToSpend: creditsToSpend,
    });
    // create a verification code and save it to the table
    const verificationCode = await createVerifyEmailCode(user);
    // send the email
    const emailSendInfo = await sendVerificationEmail(verificationCode.hash, user.email, user._id);

    res.cookie('sb-customer', stripeCustomer.id);
    notifyMeOnNewUser(user.artistName, user.email);
    return res.status(200).json({ message: 'user registered succesfully', user });
  } catch (err: any) {
    if (err.code === '23505') {
      return res.status(403).json({ message: 'A user with this email or username already exists.' });
    }
    console.error(err);
    console.error(err.response.body?.errors);
    return res.status(500).json({ message: 'Failed to create the user', err });
  }
};

const emailIsValid = (email: string): boolean => {
  const emailRe = /^[a-zA-Z0-9+_.-]+@[a-zA-Z0-9.-]+$/;
  if (!emailRe.test(email)) {
    return false;
  } else {
    return true;
  }
};

const userIsOfAge = (dob: Date): boolean => {
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  if (age <= 13) {
    return false;
  } else {
    return true;
  }
};

const determineStartingCredits = (subTier: string | void): number => {
  switch (subTier) {
    case 'basic':
      return BASIC_SUB_MONTHLY_CREDITS;
    case 'std':
      return STD_SUB_MONTHLY_CREDITS;
    case 'prem':
      return PREM_SUB_MONTHLY_CREDITS;
    default:
      return 0;
  }
};
