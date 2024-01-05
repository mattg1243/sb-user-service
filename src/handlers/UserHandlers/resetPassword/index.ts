import { Request, Response } from 'express';
import { findUserPasswordResetToken } from '../../../services/User.service';
import { sendResetPasswordEmail } from '../../../utils/sendgridConfig';

export const resetPasswordHandler = async (req: Request, res: Response) => {
  const userEmail = req.query.email;
  if (!userEmail) {
    return res.status(400).json({ message: 'No userId provided with request' });
  }
  try {
    const user = await findUserPasswordResetToken(userEmail as string);
    if (!user) {
      return res.status(404).json({ message: 'No user found with that email address' });
    }
    user.setPasswordResetToken();
    const { token: resetToken, exp } = user.getPasswordResetToken();
    await user.save();
    const sendEmailRes = await sendResetPasswordEmail(resetToken, user.email);
    return res.status(200).send();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'an err occured', err });
  }
};
