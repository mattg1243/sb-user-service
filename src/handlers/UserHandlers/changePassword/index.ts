import { Request, Response } from 'express';
import { findUserPasswordResetToken, changeUserPassword } from '../../../services/User.service';
import User from '../../../database/models/User.entity';

export const changePasswordHandler = async (req: Request, res: Response) => {
  const userEmail = req.query.email;
  const resetToken = req.query.token;
  const newPassword = req.body.password;
  if (!userEmail || !resetToken || !newPassword) {
    return res.status(400).json({ message: 'Missing required query param' });
  }

  const user = await findUserPasswordResetToken(userEmail as string);
  if (!user) {
    return res.status(404).json({ message: 'no user found with that email' });
  }
  const { token, exp } = user.getPasswordResetToken();

  // check if expiry has past
  if (exp < new Date()) {
    return res.status(400).json({ message: 'Your reset token has expired, please reset password again' });
  }
  // chack if tokens match
  if ((resetToken as string) == token) {
    const newPasswordHash = await User.hashPassword(newPassword);
    await changeUserPassword(userEmail as string, newPasswordHash);
    return res.status(200).json({ message: 'password reset successfully ' });
  } else {
    return res.status(401).json({ message: 'The provided token doesnt match the database records' });
  }
};
