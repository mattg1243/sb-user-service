import CreditAllocation from '../database/models/CreditAllocation.model';
import { AppDataSource } from '../database/dataSource';
import { Between } from 'typeorm';
import Transaction from '../database/models/Transaction.model';
import { TransactionServices } from './Transaction.service';

const creditRepository = AppDataSource.getRepository(CreditAllocation);
const txRepository = AppDataSource.getRepository(Transaction);

const today = new Date();
const firstOfThisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

export const getMonthlyIssuedCreditCount = async () => {
  return await creditRepository.count({ where: { created_at: Between(firstOfThisMonth, today) } });
};

export const getMonthlyCreditPercentageSpent = async () => {
  let creditsSpentThisMonth = 0;
  try {
    const creditsIssuedThisMonthPromise = getMonthlyIssuedCreditCount();
    const txThisMonthPromise = TransactionServices.getTransactionsThisMonth();
    const [txThisMonth, creditsIssuedThisMonth] = await Promise.all([
      txThisMonthPromise,
      creditsIssuedThisMonthPromise,
    ]);
    txThisMonth.map((tx) => {
      creditsSpentThisMonth += tx.creditAmount;
    });
    return creditsSpentThisMonth / creditsIssuedThisMonth;
  } catch (err) {
    console.error(err);
  }
};