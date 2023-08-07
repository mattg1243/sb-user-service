import { Request, Response } from 'express';
import { findUserById } from '../../../services/User.service';
import { redisClient } from '../../../app';

export const getUserHandler = async (req: Request, res: Response) => {
  const userId = req.query.id as string;

  if (!userId) {
    return res.status(401).json({ message: 'No user ID provided upon server request' });
  } else {
    try {
      const user = await findUserById(userId);
      if (!user) {
        return res.status(404).json({ message: 'No user with this ID found' });
      }
      res.status(200).json(user.toJSON());
    } catch (err) {
      console.error(err);
      res.status(503).json({ message: 'error getting user:\n', err });
    }
  }
};
