import { Request, Response } from 'express';
import { findUserById, createVerifyEmailCode } from '../../../services/User.service';
import { findVerifyEmailCodeByUser } from '../../../services/User.service';
import { sendVerificationEmail } from '../../../utils/sendgridConfig';

export const resendVerificationEmailHandler = async (req: Request, res: Response) => {
  const user = req.query.user;

  if (!user) {
    return res.status(500).json({ message: 'No user found' });
  }
  try {
    const userEntitiy = await findUserById(user as string);
    if (!userEntitiy) {
      return res.status(500).json({ message: 'No user found in the database' });
    }
    let verifyEmail = await findVerifyEmailCodeByUser(user as string);
    if (!verifyEmail) {
      verifyEmail = await createVerifyEmailCode(userEntitiy);
    }

    const sendEmailRes = await sendVerificationEmail(verifyEmail.hash, userEntitiy.email, user as string);
    console.log(sendEmailRes);
    return res.status(200).json({ message: 'Verification email resent' });
  } catch (err: any) {
    console.error(err);
    return res.status(503).json({ message: 'An error occured ' });
  }
};
