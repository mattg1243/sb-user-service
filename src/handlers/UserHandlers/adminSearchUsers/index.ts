import { Request, Response } from 'express';
import { searchAllUsersAdmin } from '../../../services/User.service';

export const adminSearchUsersHandlers = async (req: Request, res: Response) => {
  const query = req.query.search as string;
  if (query) {
    try {
      const users = await searchAllUsersAdmin(query);
      return res.status(200).json({ users });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'an error occured', err });
    }
  } else {
    return res.status(400).json({ message: 'No search query provided' });
  }
};
