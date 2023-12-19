import cron from 'node-cron';
import User from '../database/models/User.entity';
import { findUsers, getUsers } from '../services/User.service';
import axios from 'axios';
import { BEATS_HOST } from '../handlers/User.handler';
import { TransactionServices } from '../services/Transaction.service';
import Transaction from '../database/models/Transaction.model';
import path from 'path';
import fs from 'fs';

const CREDIT_VAL = 6.5;

export const payoutTask = cron.schedule('0 0 1 * *', () => {});

interface ISummaryRow {
  id: string;
  title: string;
  uploadDate: string;
  downloads: number;
  owed: number;
}

// const calculatePayouts = async () => {
//   try {
//     // get ALL users
//     const allUsers = await getUsers();
//     // get all beats uplaoded by user
//     allUsers.forEach(async (u) => {
//       const summaryMap = new Map<string, ISummaryRow>();
//       // date ranges
//       const today = new Date();
//       const lastOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
//       const firstOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
//       const beatsResProm = axios.get(`${BEATS_HOST}/beats?userId=${u._id}`);
//       const transactionsProm = TransactionServices.getTransactionsBySellingUser(u._id, {
//         start: firstOfLastMonth,
//         end: lastOfLastMonth,
//       });
//       const [beatsRes, transactions] = await Promise.all([beatsResProm, transactionsProm]);

//       const beats = beatsRes.data as any[];
//       // create empty summary rows
//       beats.forEach((b) => {
//         summaryMap.set(b._id as string, {
//           title: b.title as string,
//           uploadDate: new Date(b.created_at).toLocaleDateString(),
//           downloads: 0,
//           owed: '',
//         });
//       });
//       // populate data
//       transactions.forEach((tx) => {
//         // const beat
//       });
//     });
//   } catch (err) {
//     console.error(err);
//   }
// };

interface IBeatRes {
  _id: string;
  title: string;
  artistName: string;
  created_at: string;
}
// TODO break this function up
export const generatePayoutSummaries = async () => {
  // get required dates
  const today = new Date();
  const lastOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
  const firstOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const dateSuffix = `${today.getMonth() + 1}-${today.getFullYear()}`;
  // instantiate hash maps
  const summaryMap = new Map<string, ISummaryRow[]>();
  const transactionMap = new Map<string, Transaction[]>();

  try {
    // get all transactions that occurred in the last cycle
    const transactions = await TransactionServices.getTransactionsInDateRange(firstOfLastMonth, lastOfLastMonth);
    // insert them into a hash map for constant time referencing
    for (const tx of transactions) {
      if (transactionMap.has(tx.beatId)) {
        transactionMap.set(tx.beatId, [...(transactionMap.get(tx.beatId) as Transaction[]), tx]);
      } else {
        transactionMap.set(tx.beatId, [tx]);
      }
    }
    // create a set for all sellers to remove duplicates from the trasnactions array
    const sellersSet = new Set<string>(transactions.map((tx) => tx.sellingUser._id));
    const beatsFromSellers = await axios.get<IBeatRes[]>(
      `${BEATS_HOST}/beats?beatId=${[...transactions.map((tx) => tx.beatId)]}`
    );
    console.log(
      transactions.length,
      'transactions found for',
      sellersSet.size,
      'users and',
      beatsFromSellers.data.length,
      'beats'
    );
    // iterate over the sold beats and populate the summary row hash map
    for (const beat of beatsFromSellers.data) {
      // check if user exists in map
      const downloadCount = (transactionMap.get(beat._id) as Transaction[]).length;
      const summaryRow: ISummaryRow = {
        id: beat._id,
        title: beat.title,
        uploadDate: beat.created_at,
        downloads: downloadCount,
        owed: downloadCount * CREDIT_VAL,
      };
      // TODO handle multiple downloads of single beat
      if (summaryMap.has(beat.artistName)) {
        for (const summary of summaryMap.get(beat.artistName) as ISummaryRow[]) {
          if (summary.id === beat._id) {
            const summCopies = summaryMap.get(beat.artistName) as ISummaryRow[];
            const newSumms = summCopies.map((summ) => {
              if (summ.id === beat._id) {
                return { ...summ, downloads: summ.downloads++, owed: (summ.owed += CREDIT_VAL) };
              } else {
                return summ;
              }
            });
            summaryMap.set(beat.artistName, newSumms);
          }
        }
      } else {
        summaryMap.set(beat.artistName, [summaryRow]);
      }
      console.log('entry in summaryMap: ', summaryMap.get(beat.artistName));
      // write summaries to csv
      for (const summary of summaryMap) {
        let csv = '';
        const name = `${summary[0]}\n`;
        const header = 'BEAT ID,BEAT NAME,UPLOAD DATE,DOWNLOADS,BALANCE OWED\n';
        for (const beat of summary[1]) {
          const line = `${beat.id},${beat.title},${beat.uploadDate},${beat.downloads},${beat.owed}\n`;
          csv += line;
        }
        const fileName = path.join(__dirname, `../payouts/${name.trim()}-${dateSuffix}.csv`);
        fs.writeFileSync(fileName, `${name}${header}${csv}`);
      }
    }
    // check results
    return { transactionMap, summaryMap };
  } catch (err) {
    console.error(err);
  }
};

const calculatePayoutsV2 = async () => {};
