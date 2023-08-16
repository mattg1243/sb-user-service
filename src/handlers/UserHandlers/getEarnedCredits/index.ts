import { Request, Response } from 'express';
import { getCreditsEarned } from '../../../services/User.service';
import { TransactionServices } from '../../../services/Transaction.service';

/**
 * Returns all earned credits by user or an object containing monthly earned credit amounts
 * for the last 6 months if provided with the monthly query.
 * @param req
 * @param res
 * @returns
 */
export const getEarnedCreditsHandler = async (req: Request, res: Response) => {
  const user = req.user;
  const monthly = req.query.monthly as string;
  if (!user) {
    return res.status(400).json({ message: 'Missing user in request' });
  }
  try {
    if (monthly == 'true') {
      // create an array of the last 6 months
      const currentMonth = new Date().getMonth();
      const months = Array.from({ length: 12 }, (item, i) => {
        return new Date(0, i).toLocaleString('en-US', { month: 'long' });
      });
      months.slice(currentMonth - 6).concat(months.slice(0, currentMonth));
      // get all transactions where the user profited for the last 6 months
      const today = new Date();
      const sellTxs = await TransactionServices.getTransactionsBySellingUser(user.id, {
        start: new Date(new Date().setMonth(today.getMonth() - 6)),
        end: today,
      });
      return res.status(200).json({ sellTxs });
    } else {
      const earnedCredits = await getCreditsEarned(user.id);
      return res.status(200).json({ earnedCredits });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'An error occured getting your earned credits', err });
  }
};
