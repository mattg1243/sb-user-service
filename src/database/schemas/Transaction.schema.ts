import { number, object, string, TypeOf, z } from 'zod';
import User from '../models/User.entity';

export interface ICreateTransactionSchema {
  beatId: string;
  purchasingUser: User;
  sellingUser: User;
  creditAmount: number;
}