import { Request, Response } from 'express';
import StripeClient from '../../../utils/StripeClient';

const stripeClient = new StripeClient();

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
