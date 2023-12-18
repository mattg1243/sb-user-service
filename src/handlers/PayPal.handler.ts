import { Request, Response } from 'express';
import PayPalClient from '../utils/PayPalClient';
import { findUserById } from '../services/User.service';

const paypalClient = new PayPalClient();

export const getConnectAccountUrlHandler = async (req: Request, res: Response) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ message: 'No user found with request' });
  }

  try {
    // check if the user already has paypal connected
    const userObj = await findUserById(user.id);
    if (userObj) {
      if (userObj.paypalMerchantId) {
        return res.status(200).json({ merchantId: userObj.paypalMerchantId });
      }
    } else {
      return res.status(404).json({ message: 'Unable to find a user with that ID' });
    }
    const paypalRes = await paypalClient.getConnectAccountUrl(user.id, user.artistName);
    return res.status(200).json(paypalRes);
  } catch (err) {
    res.status(500).json(err);
  }
};

export const saveMerchantIdHandler = async (req: Request<{}, {}, { merchantId: string }>, res: Response) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ message: 'No user found with request' });
  }

  try {
    const userObj = await findUserById(user.id);
    if (!userObj) {
      return res.status(404).json({ message: 'No user found matching that id' });
    }

    if (userObj.paypalMerchantId) {
      return res.status(200).json({ message: 'User already has PayPal connected' });
    }

    userObj.payoutMethod = 'paypal';
    userObj.paypalMerchantId = req.body.merchantId;
    await userObj.save();
    return res.status(200).json({ message: 'User PayPal connection successful' });
  } catch (err) {
    console.error(err);
    return res.status(500).json(err);
  }
};

export const paypalIsConnectedHandlers = async (req: Request, res: Response) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ message: 'No user found with request' });
  }
};
