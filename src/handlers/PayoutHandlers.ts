import { Request, Response } from 'express';
import Payout from '../database/models/Payout.entity';
import { getPayouts, getPayoutsInDateRange } from '../services/Payout.service';
import { In } from 'typeorm';
import { sendPayouts } from '../cron/payout';

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

export const sendPayoutsHandler = async (req: Request, res: Response) => {
  const user = req.user;
  if (!user) {
    console.error('No amdin user found in send-payout request');
    return res.status(401).json({ message: 'No amdin user found in send-payout request' });
  }
  console.log('payouts initiated by admin user ' + user?.email);
  try {
    const payouts = await sendPayouts();
    return res.status(200).json({ message: 'Payouts sent out successfully', payouts });
  } catch (err) {
    console.error(err);
    return res.status(500).json(err);
  }
};
