import { Request, Response } from 'express';
import { findUserByEmail } from '../../../services/User.service';
import StripeClient from '../../../utils/StripeClient';

const stripeClient = new StripeClient();

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
      subTier: user.subTier,
    };
    return res.status(200).json(userResponse);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'error finding user by email' });
  }
};
