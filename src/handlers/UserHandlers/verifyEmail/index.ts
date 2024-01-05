import { Request, Response } from 'express';
import { findVerifyEmailCode, findUserById } from '../../../services/User.service';
import { deleteVerifyEmailCode } from '../../../services/User.service';

export const verifyEmailHandler = async (req: Request, res: Response) => {
  const user = req.query.user;
  const code = req.query.code;

  // query db to see if the secret code exists
  if (!user) {
    return res.status(500).json({ message: 'No user found' });
  }
  try {
    // first check is user is already verified
    const userFromDB = await findUserById(user as string);
    if (!userFromDB) {
      return res.status(500).json({ message: 'No user found ' });
    }
    if (userFromDB.verified) {
      return res.status(200).json({ verified: true });
    }
    // user is not verified yet, verify them
    if (code) {
      const verifyEmail = await findVerifyEmailCode(code as string);
      if (verifyEmail?.user._id == (user as string)) {
        userFromDB.verified = true;
        await deleteVerifyEmailCode(verifyEmail._id);
        await userFromDB.save();
        return res.status(200).json({ verified: true });
      }
    } else {
      return res.status(400).json({ message: 'no code supplied with request' });
    }
  } catch (err) {
    console.error(err);
    return res.status(503).json({ message: 'An error occured ' });
  }
};
