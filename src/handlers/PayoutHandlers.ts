import { Request, Response } from 'express';
import Payout from '../database/models/Payout.entity';
import { createPayout, getPayouts, getPayoutsInDateRange } from '../services/Payout.service';
import { ICreatePayoutArgs, ICreatePayoutBody } from '../database/schemas/Payout.schema';
import { FindOptionsWhere, In } from 'typeorm';
import { findUserById } from '../services/User.service';

// export const createPayoutHandler = async (req: Request<{}, {}, ICreatePayoutBody>, res: Response) => {
//   const { amount, creditValue, downloads, userId } = req.body;
//   try {
//     const userObj = await findUserById(userId);
//     if (!userObj) {
//       return res.status(400).json({ message: 'No user found from request' });
//     }
//     const payout = await createPayout({ amount, creditValue, downloads, user: userObj });
//     return res.status(200).json(payout);
//   } catch (err) {
//     console.error(err);
//     return res.status(500).json(err);
//   }
// };

export const getPayoutsHandler = async (req: Request, res: Response) => {
  const ids = req.query.ids as string;
  const start = req.query.start as string;
  const end = req.query.end as string;
  let payouts: Payout | Payout[] = [];

  try {
    const startDate = new Date(start);
    const endDate = new Date(end);
    // no params
    if (!ids && !start && !end) {
      payouts = await getPayouts();
    }
    // ids with no date range
    else if (ids && !start && !end) {
      payouts = await getPayouts({ where: { _id: In(ids.split(',')) } });
    }
    // no ids with date range
    else if (!ids && start && end) {
      payouts = await getPayoutsInDateRange(startDate, endDate);
    }
    // ids with date range
    else if (ids && start && end) {
      payouts = await getPayoutsInDateRange(startDate, endDate, { where: { _id: In(ids.split(',')) } });
    }

    return res.status(200).json(payouts);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ err });
  }
};
