import { Request, Response } from 'express';
import StripeClient from '../../../utils/StripeClient';

const stripeClient = new StripeClient();

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
