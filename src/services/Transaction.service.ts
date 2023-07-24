import { AppDataSource } from '../database/dataSource';
import Transaction from '../database/models/Transaction.model';
import { ICreateTransactionSchema } from '../database/schemas/Transaction.schema';
import { Between } from 'typeorm';
import User from '../database/models/User.entity';

export namespace TransactionServices {
  const transactionRepository = AppDataSource.getRepository(Transaction);
  /**
   * Creates a new transaction and saves it to the database.
   */
  export const createTransaction = async (input: ICreateTransactionSchema) => {
    const tx = new Transaction();
    tx.beatId = input.beatId;
    tx.creditAmount = input.creditAmount;
    tx.purchasingUser = input.purchasingUser;
    tx.sellingUser = input.sellingUser;
    return await transactionRepository.save(tx);
  };
  /**
   * Gets all transactions in which the provided user is the buyer of the beat. If
   * a date range is provided, the returned transactions will be within that range only.
   * If not, all are returned
   */
  export const getTransactionsByPurchasingUser = async (userId: string, dateRange?: { start: Date; end: Date }) => {
    if (!dateRange) {
      return await transactionRepository.find({
        relations: { purchasingUser: true },
        where: { purchasingUser: { _id: userId } },
      });
    } else {
      return await transactionRepository.find({
        relations: { purchasingUser: true },
        where: { purchasingUser: { _id: userId }, created_at: Between(dateRange.start, dateRange.end) },
      });
    }
  };
  /**
   * Gets all transactions in which the provided user is the seller of the beat. If
   * a date range is provided, the returned transactions will be within that range only.
   * If not, all are returned
   */
  export const getTransactionsBySellingUser = async (userId: string, dateRange?: { start: Date; end: Date }) => {
    if (!dateRange) {
      return await transactionRepository.find({
        relations: { sellingUser: true },
        where: { sellingUser: { _id: userId } },
      });
    } else {
      return await transactionRepository.find({
        relations: { sellingUser: true },
        where: { sellingUser: { _id: userId }, created_at: Between(dateRange.start, dateRange.end) },
      });
    }
  };
  /**
   * Gets all transactions that have taken place from the 1st - current day
   * of the current month
   */
  export const getTransactionsThisMonth = async () => {
    const today = new Date();
    const firstOfThisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    return await transactionRepository.find({ where: { created_at: Between(firstOfThisMonth, today) } });
  };
  /**
   * Gets all transactions that fall within a given date range
   */
  export const getTransactionsInDateRange = async (start: Date, end: Date) => {
    return await transactionRepository.find({ where: { created_at: Between(start, end) } });
  };
}
