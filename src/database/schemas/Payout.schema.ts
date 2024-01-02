// not using zod here because this is strictly internal; no validation necessayr

import User from '../models/User.entity';
import Transaction from '../models/Transaction.model';

export interface ICreatePayoutBody {
  userId: string;
  downloads: number;
  amount: number;
  creditValue: number;
}

export interface ICreatePayoutArgs {
  user: User;
  downloads: number;
  amount: number;
  creditValue: number;
  summary: string;
  transactions: Transaction[];
}
