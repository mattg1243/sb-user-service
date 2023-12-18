import { Request, Response } from 'express';
import PayPalClient from '../utils/PayPalClient';

const paypalClient = new PayPalClient();

export const connectAccountHandler = async (req: Request, res: Response) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ message: 'No user found with request' });
  }

  try {
    await paypalClient.getConnectAccountUrl(user.id, user.artistName);
    return res.status(200).send();
  } catch (err) {
    res.status(500).json(err);
  }
};
