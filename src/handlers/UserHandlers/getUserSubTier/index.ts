import { Request, Response } from 'express';
import { findUserById } from '../../../services/User.service';

export const getUserSubTierHandler = async (req: Request, res: Response) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ message: 'No user provided with request' });
  }

  try {
    const userObj = await findUserById(user.id);
    if (!userObj) {
      return res.status(404).json({ message: 'No user found with that ID' });
    }
    return res.status(200).json({ subTier: 'std' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'An error occurred getting your subscription tier', err });
  }
};
