import { Request, Response } from 'express';
import { findUserBySubRefCode, findUserSubReferrer, saveUserSubReferral } from '../../../services/User.service';

export const setUserRefCode = async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { refCode } = req.body;
  if (!userId) {
    return res.status(401).json({ message: 'No user provided with request' });
  }

  try {
    // make sure user doesnt already have a ref code saved
    const referrer = await findUserSubReferrer(userId);
    if (referrer) {
      return res.status(400).json({ message: 'You may only enter one referral code per subscription' });
    }
    // make sure the ref code is valid
    const referringUser = await findUserBySubRefCode(refCode);
    if (referringUser) {
      await saveUserSubReferral(userId, referringUser._id);
      return res.status(200).json({ referringUser: referringUser.artistName });
    } else {
      return res.status(400).json({ message: 'The referral code you entered was not valid' });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json(err);
  }
};
