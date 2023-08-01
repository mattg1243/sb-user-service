import { Request, Response } from 'express';
import { getCreditsBalance } from '../../../services/User.service';

export const getCreditsBalanceHandler = async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(400).json({ message: 'Middelware failed to attach user to request / there is no ID' });
  }
  const creditBalance = await getCreditsBalance(userId as string);
  return res.status(200).json({ creditBalance });
};
