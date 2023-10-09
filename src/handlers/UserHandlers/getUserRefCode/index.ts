import { Request, Response } from 'express';
import { createUserSubRefCode, findUserSubRefCode } from '../../../services/User.service';

export const getUserRefCode = async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ message: 'No user provided with request' });
  }

  try {
    // check if user has a promo code already generated and if not, make one
    let refCode = await findUserSubRefCode(userId);
    if (!refCode) {
      refCode = await createUserSubRefCode(userId);
    }

    return res.status(200).send(refCode);
  } catch (err) {
    console.error(err);
    return res.status(500).json(err);
  }
};
