import { Request, Response } from 'express';
import { findVerifyEmailCode, findUserById } from '../../../services/User.service';
import { deleteVerifyEmailCode } from '../../../services/User.service';

export const verifyEmailHandler = async (req: Request, res: Response) => {
  const user = req.query.user;
  const code = req.query.code;
  console.log(req);
  // query db to see if the secret code exists
  if (!user) {
    return res.status(500).json({ message: 'No user found' });
  }
  try {
    const verifyEmail = await findVerifyEmailCode(code as string);
    if (verifyEmail?.user._id == (user as string)) {
      const userFromDB = await findUserById(user as string);
      if (!userFromDB) {
        return res.status(500).json({ message: 'No user found ' });
      } else {
        userFromDB.verified = true;
        await deleteVerifyEmailCode(verifyEmail._id);
        await userFromDB.save();
        return res.status(200).json({ verified: true });
      }
    }
  } catch (err) {
    console.error(err);
    return res.status(503).json({ message: 'An error occured ' });
  }
};
