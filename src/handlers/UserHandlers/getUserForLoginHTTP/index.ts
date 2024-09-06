import { Request, Response } from 'express';
import StripeClient from '../../../utils/StripeClient';
import { getUser, getStripeCustomerId, createResponse } from './utils';

const stripeClient = new StripeClient();

/**
 * Called from the API gateway to get a user for login. The gateway then
 * checks the users password matches before signing and attaching an access token.
 */
export const getUserForLoginHTTP = async (req: Request, res: Response) => {
  const { email } = req.body;
  try {
    const user = await getUser(email);
    if (!user) {
      return res.status(401).json({ message: 'No user found with that email address' });
    }
    const customerId = await getStripeCustomerId(stripeClient, user);
    const userResponse = createResponse(user, customerId);
    return res.status(200).json(userResponse);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'error finding user by email' });
  }
};
