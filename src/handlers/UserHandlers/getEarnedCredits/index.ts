import { Request, Response } from 'express';
import { getCreditsEarned } from '../../../services/User.service';

export const getEarnedCreditsHandler = async (req: Request, res: Response) => {
  const user = req.user;
  if (!user) {
    return res.status(400).json({ message: 'Missing user in request' });
  }
  try {
    const earnedCredits = await getCreditsEarned(user.id);
    return res.status(200).json({ earnedCredits });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'An error occured getting your earned credits', err });
  }
};
