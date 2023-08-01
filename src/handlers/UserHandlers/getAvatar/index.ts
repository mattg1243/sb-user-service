import { Request, Response } from 'express';
import { findUserById } from '../../../services/User.service';

export const getAvatarHandler = async (req: Request, res: Response) => {
  const userId = req.query.id as string;

  if (!userId) {
    return res.status(400).json({ message: 'No user ID provided upon server request' });
  } else {
    try {
      const user = await findUserById(userId);
      if (!user) {
        return res.status(404).json({ message: 'No user found with this ID' });
      }
      return res.status(200).json(user.avatar);
    } catch (err) {
      console.error(err);
      res.status(503).json({ message: 'error getting user avatar:\n', err });
    }
  }
};
