import { Request, Response } from 'express';
import Transaction from '../database/models/Transaction.model';
import { TransactionServices as TS } from '../services/Transaction.service';

export const createTransactionHandler = async (req: Request, res: Response) => {
  const { beatId, creditAmount, purchasingUser, sellingUser } = req.body;
  try {
    const tx = await TS.createTransaction(req.body);
    return res.status(200).json(tx);
  } catch (err) {
    console.error(err);
    return res.status(500).json(err);
  }
};

export const getTransactionsHandler = async (req: Request, res: Response) => {
  const lastMonth = req.query.lastMonth as string;

  try {
    let transactions: Transaction[] = [];
    if (lastMonth) {
      const today = new Date();
      const lastOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      const firstOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      transactions = await TS.getTransactionsInDateRange(firstOfLastMonth, lastOfLastMonth);
    } else {
      transactions = await TS.getTransactions();
    }
    return res.status(200).json(transactions);
  } catch (err) {
    console.error(err);
    return res.status(500).json(err);
  }
};
