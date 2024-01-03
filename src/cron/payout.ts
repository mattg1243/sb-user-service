import cron from 'node-cron';
import User from '../database/models/User.entity';
import { findUserByArtistName, findUserById, findUsers, getUsers } from '../services/User.service';
import axios from 'axios';
import { BEATS_HOST } from '../handlers/User.handler';
import { TransactionServices } from '../services/Transaction.service';
import Transaction from '../database/models/Transaction.model';
import path from 'path';
import fs from 'fs';
import { createPayout, getPayouts } from '../services/Payout.service';
import Payout from '../database/models/Payout.entity';
import StripeClient from '../utils/StripeClient';
import PayPalClient from '../utils/PayPalClient';
import { FindOptionsWhere, In } from 'typeorm';
import { sendPayoutErrorEmail, sendPayoutSuccessfulEmail } from '../utils/sendgridConfig';

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

// global date and money stuff
const today = new Date();
const lastOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
const firstOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
const dateSuffix = `${today.getMonth() + 1}-${today.getFullYear()}`;
const moneyFormatter = new Intl.NumberFormat('en-us', {
  style: 'currency',
  currency: 'USD',
});
let totalOwedToAll = 0;

// payment processor clients
const stripeClient = new StripeClient();
const paypalClient = new PayPalClient();

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
      const line = `${beat.id},${beat.title},${new Date(beat.uploadDate).toISOString().split('T')[0]},${
        beat.downloads
      },${moneyFormatter.format(beat.owed)}\n`;
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

/**
 * Attempts to send out any unpaid payouts if supplied with no args
 * and specified payouts if supplied with an array of Ids
 * @param ids - Array of payout db Ids
 */
export const sendPayouts = async (ids?: string[]) => {
  try {
    let whereArgs: FindOptionsWhere<Payout> = {
      paid: false,
    };
    // check if ids have been supplied
    if (ids) {
      whereArgs._id = In(ids);
    }
    // query payouts
    const payouts = await getPayouts({
      where: { paid: false },
    });
    console.log(payouts[0].user);
    for (const payout of payouts) {
      try {
        // determine payout method
        const method = payout.user.payoutMethod;
        if (!method) {
          // send email telling them they have funds waiting
          continue;
        }
        // send payment
        switch (method) {
          case 'paypal':
            const paypalId = payout.user.paypalMerchantId;
            if (!paypalId) {
              console.error(
                `error paying out user ${payout.user.artistName}: no paypalMerchantId, paymentMethod == paypal`
              );
              // send error email
              // sendPayoutErrorEmail(
              //   payout.user.artistName,
              //   payout.user.email,
              //   `We see you prefer to be paid out via PayPal but we don't seem to have your PayPal account on file. Please try connecting from the account page.`
              // );
              continue;
            }
            // send
            // send success email - "Your funds are on the way!"
            break;
          case 'stripe':
            const stripeId = payout.user.stripeConnectId;
            if (!stripeId) {
              console.error(
                `error paying out user ${payout.user.artistName}: no stripeConnectId, paymentMethod == stripe`
              );
              // send error email
              // sendPayoutErrorEmail(
              //   payout.user.artistName,
              //   payout.user.email,
              //   `We see you prefer to be paid out via Stripe but we don't seem to have your Stripe account on file. Please try connecting from the account page.`
              // );
              continue;
            }
            const payoutRes = await stripeClient.sendPayout(
              Math.floor(payout.amount * 100),
              stripeId,
              `Sweatshop Beats payout / ${payout.user.artistName} / ${new Date().toISOString().split('T')[0]}`
            );
            console.log(
              `payment of ${payout.amount} successfully sent to user ${payout.user.artistName}:\npayout ID: ${payoutRes?.id}`
            );
            // mark as paid
            payout.paid = true;
            await payout.save();
            // send success email
            // sendPayoutSuccessfulEmail(payout.user.artistName, payout.user.email);

            break;

          default:
            console.error(
              `error: invalid payment method detected when making payouts:\nmethod == ${method} for user ${payout.user.artistName}`
            );
            // sendPayoutErrorEmail(payout.user.artistName, payout.user.email, `We're looking into it`);
            break;
        }
        // send email with summary attached
      } catch (err) {
        console.error(err);
        // sendPayoutErrorEmail(payout.user.artistName, payout.user.email, `We're looking into it`);
      }
    }
    return await getPayouts();
  } catch (err) {
    console.error(err);
    return Promise.reject(err);
  }
};
