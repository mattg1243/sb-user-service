import cron from 'node-cron';
import User from '../database/models/User.entity';
import { findUserByArtistName, findUserById, findUsers, getUsers } from '../services/User.service';
import axios from 'axios';
import { BEATS_HOST } from '../handlers/User.handler';
import { TransactionServices } from '../services/Transaction.service';
import Transaction from '../database/models/Transaction.model';
import path from 'path';
import fs from 'fs';
import { createPayout } from '../services/Payout.service';
import Payout from '../database/models/Payout.entity';

const CREDIT_VAL = 6.5;

export const payoutTask = cron.schedule('0 0 1 * *', () => {});

interface ISummaryRow {
  id: string;
  title: string;
  uploadDate: string;
  downloads: number;
  owed: number;
  transactions: Transaction[];
}

interface IBeatRes {
  _id: string;
  title: string;
  created_at: string;
  artistName: string;
}


const today = new Date();
const lastOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
const firstOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
const dateSuffix = `${today.getMonth() + 1}-${today.getFullYear()}`;
const moneyFormatter = new Intl.NumberFormat('en-us', {
  style: 'currency',
  currency: 'USD',
});
let totalOwedToAll = 0;

// TODO break this function up
export const generatePayoutSummaries = async () => {
  // instantiate hash maps
  const transactionMap = new Map<string, Transaction[]>();
  const summaryMap = new Map<string, ISummaryRow[]>();
  const payouts: Payout[] = [];

  try {
    // get all transactions that occurred in the last cycle
    const transactions = await TransactionServices.getTransactionsInDateRange(firstOfLastMonth, lastOfLastMonth, {
      where: { payout: { _id: undefined } },
    });
    const sellersSet = new Set<string>();
    // insert them into a hash map for constant time referencing
    for (const tx of transactions) {
      // only insert of the transaction has not been used to calculate a payout
      if (!tx.payout) {
        sellersSet.add(tx.sellingUser._id);
        if (transactionMap.has(tx.beatId)) {
          transactionMap.set(tx.beatId, [...(transactionMap.get(tx.beatId) as Transaction[]), tx]);
        } else {
          transactionMap.set(tx.beatId, [tx]);
        }
      }
    }
    // if theres no new transactions, return
    if (sellersSet.size == 0) {
      return payouts;
    }
    // create a set for all sellers to remove duplicates from the trasnactions array
    // const sellersSet = new Set<string>(transactions.map((tx) => tx.sellingUser._id));
    // get all beats from users who got downloads
    const beatsFromSellers = await axios.get<IBeatRes[]>(`${BEATS_HOST}/beats?userId=${[...sellersSet].join(',')}`);
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
      console.log('beat from ' + beat.artistName + ' being processed...');
      const downloadCount = transactionMap.has(beat._id) ? (transactionMap.get(beat._id) as Transaction[]).length : 0;
      const summaryRow: ISummaryRow = {
        id: beat._id,
        title: beat.title,
        uploadDate: beat.created_at,
        downloads: downloadCount,
        owed: downloadCount * CREDIT_VAL,
        transactions: transactionMap.get(beat._id) || [],
      };
      // check if user exists in map
      if (summaryMap.has(beat.artistName)) {
        // iterate over the summary rows in the map
        for (const summary of summaryMap.get(beat.artistName) as ISummaryRow[]) {
          if (summary.id === beat._id) {
            // if the summary matches the beat, add to the sum owed
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
        // no summary found for this beat, set one
        summaryMap.set(beat.artistName, [...(summaryMap.get(beat.artistName) as ISummaryRow[]), summaryRow]);
      } else {
        // no entry for the user in the map, create a new one
        summaryMap.set(beat.artistName, [summaryRow]);
      }
    }
    // write summaries to csv and save payout to database
    for (const summary of summaryMap) {
      const payout = await writeSummaryFile(summary);
      if (payout) {
        payouts.push(payout);
      }
    }
    console.log('total amount owed to producers: ', moneyFormatter.format(totalOwedToAll));
    // check results
    return payouts;
  } catch (err) {
    console.error(err);
  }
};

/**
 * Writes payout summary files to disk and saves payouts to the database
 * @param summary
 * @returns summaryStr
 */
const writeSummaryFile = async (summary: [string, ISummaryRow[]]) => {
  try {
    let csv = '';
    let totalOwed = 0;
    let totalDownloads = 0;
    const name = `${summary[0]}\n`;
    const header = 'BEAT ID,BEAT NAME,UPLOAD DATE,DOWNLOADS,BALANCE OWED\n';
    const transactions: Transaction[] = [];
    // loop through each beat in summary row
    for (const beat of summary[1]) {
      totalOwed += beat.owed;
      totalDownloads += beat.downloads;
      const line = `${beat.id},${beat.title},${beat.uploadDate},${beat.downloads},${beat.owed}\n`;
      csv += line;
      transactions.push(...beat.transactions);
    }
    //
    csv += 'Total payout:\n$' + totalOwed;
    totalOwedToAll += totalOwed;
    const fileName = path.join(__dirname, `../payouts/${name.trim()}-${dateSuffix}.csv`);
    const fileStr = `${name}${header}${csv}`;
    // write to db
    const user = await findUserByArtistName(summary[0]);
    if (!user) {
      console.error('No user found from the summary key');
      return;
    }
    const payout = await createPayout({
      amount: totalOwed,
      downloads: totalDownloads,
      creditValue: CREDIT_VAL,
      summary: fileStr,
      user: user,
      transactions: transactions,
    });
    // write to disc
    fs.writeFileSync(fileName, fileStr);
    return payout;
  } catch (err) {
    console.error(err);
  }
};

export const sendPayouts = async (payoutDir: string) => {
  // loop over the files
  // calculate total amount owed to user
  // determine payout method
  // send payment
  // send email with summary attached
};

// export default class SummaryGenerator {
//   private CREDIT_VALUE = 6.5;
//   private transactionsMap: Map<string, Transaction[]>;
//   private summaryMap: Map<string, ISummaryRow[]>;

//   constructor() {
//     this.transactionsMap = new Map<string, Transaction[]>();
//     this.summaryMap = new Map<string, ISummaryRow[]>();
//   }

//   public mapTransactions(transactions: Transaction[]) {
//     for (const tx of transactions) {
//       if (this.transactionsMap.has(tx.beatId)) {
//         this.transactionsMap.set(tx.beatId, [...(this.transactionsMap.get(tx.beatId) as Transaction[]), tx]);
//       } else {
//         this.transactionsMap.set(tx.beatId, [tx]);
//       }
//     }
//   }

//   public mapBeatToSummaryRow(beat: IBeatRes) {
//     for (const summary of this.summaryMap.get(beat.artistName) as ISummaryRow[]) {
//       if (summary.id === beat._id) {
//         const summCopies = this.summaryMap.get(beat.artistName) as ISummaryRow[];
//         const newSumms = summCopies.map((summ) => {
//           if (summ.id === beat._id) {
//             return { ...summ, downloads: summ.downloads++, owed: (summ.owed += CREDIT_VAL) };
//           } else {
//             return summ;
//           }
//         });
//         this.summaryMap.set(beat.artistName, newSumms);
//       }
//     }
//   }

//   public generateSummaries() {}
// }
