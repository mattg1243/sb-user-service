import { Request, Response } from 'express';
import { CreateUserInput } from '../../../database/schemas/User.schema';
import { createUser, createVerifyEmailCode } from '../../../services/User.service';
import { notifyMeOnNewUser, sendVerificationEmail } from '../../../utils/sendgridConfig';
import StripeClient from '../../../utils/StripeClient';

const stripeClient = new StripeClient();

export const registerUserHandler = async (req: Request<{}, {}, CreateUserInput>, res: Response) => {
  const { email, password, artistName, dateOfBirth } = req.body;
  const emailRe = /^[a-zA-Z0-9+_.-]+@[a-zA-Z0-9.-]+$/;
  if (!emailRe.test(email)) {
    return res.status(400).json({ message: 'Invalid email address provided.' });
  }
  console.log('artistName: ', artistName);
  try {
    // check if user is older than 13
    const today = new Date();
    const dateOfBirthD = new Date(dateOfBirth);
    let age = today.getFullYear() - dateOfBirthD.getFullYear();
    const m = today.getMonth() - dateOfBirthD.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dateOfBirthD.getDate())) {
      age--;
    }
    if (age <= 13) {
      return res.status(401).json({ message: 'You must be at least 13 years of age to create an account with us.' });
    }
    const stripeCustomer = await stripeClient.createCustomer(email);
    const user = await createUser({
      email,
      artistName,
      dateOfBirth: dateOfBirthD,
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
    notifyMeOnNewUser(user.artistName, user.email);
    return res.status(200).json({ message: 'user registered succesfully', user });
  } catch (err: any) {
    if (err.code === '23505') {
      return res.status(403).json({ message: 'A user with this email or username already exists.' });
    }
    console.error(err);
    return res.status(500).json({ message: 'Failed to create the user', err });
  }
};
