import cron from 'node-cron';
import User from '../database/models/User.entity';
import { getUsers } from '../services/User.service';
import axios from 'axios';
import { BEATS_HOST } from '../handlers/User.handler';
import { TransactionServices } from '../services/Transaction.service';

const CREDIT_VAL = 6.50;

export const payoutTask = cron.schedule('0 0 1 * *', () => {});

interface ISummaryRow {
  title: string;
  uploadDate: string;
  downloads: number;
  owed: string;
}

const calculatePayouts = async () => {
  try {
    // get ALL users
    const allUsers = await getUsers();
    // get all beats uplaoded by user
    allUsers.forEach(async (u) => {
      const summaryMap = new Map<string, ISummaryRow>();
      // date ranges
      const today = new Date();
      const lastOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      const firstOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const beatsResProm = axios.get(`${BEATS_HOST}/beats?userId=${u._id}`);
      const transactionsProm = TransactionServices.getTransactionsBySellingUser(u._id, {
        start: firstOfLastMonth,
        end: lastOfLastMonth,
      });
      const [beatsRes, transactions] = await Promise.all([beatsResProm, transactionsProm]);

      const beats = beatsRes.data as any[];
      // create empty summary rows
      beats.forEach((b) => {
        summaryMap.set(b._id as string, {
          title: b.title as string,
          uploadDate: new Date(b.created_at).toLocaleDateString(),
          downloads: 0,
          owed: '',
        });
      });
      // populate data
      transactions.forEach((tx) => {
        // const beat
      });
    });
  } catch (err) {
    console.error(err);
  }
};
