import { Request, Response } from 'express';
import { userHasLicense } from '../../../services/License.service';
import { UNLIMITED_LICENSE_COST, LIMITED_LICENSE_COST } from '../../../config';
import { AppDataSource } from '../../../database/dataSource';
import User from '../../../database/models/User.entity';
import Transaction from '../../../database/models/Transaction.model';
import License from '../../../database/models/License.entity';
import { p } from '../../../utils/Rabbitmq';

export const purchaseBeatHandler = async (
  req: Request<{}, {}, { userId: string; beat: string; seller: string; licenseType: 'limited' | 'unlimited' }>,
  res: Response
) => {
  const { userId, beat, seller, licenseType } = req.body;
  if (!userId || !beat || !seller || !licenseType) {
    return res.status(400).json({ message: 'Missing a required value in the request' });
  }

  try {
    // see if user already owns a license for this beat
    const hasLicense = await userHasLicense(userId, beat);
    if (hasLicense) {
      // user already owns the beat, return 200 to beat service
      return res.status(200).json({ message: 'User already owns a license to this beat' });
    }
    // determine amount of credits to spend based on license type
    let beatCost: number;
    switch (licenseType) {
      case 'unlimited':
        beatCost = UNLIMITED_LICENSE_COST;
        break;
      case 'limited':
        beatCost = LIMITED_LICENSE_COST;
        break;
      default:
        return res.status(400).json({ message: 'Invalid license type specified in request' });
    }
    // database transaction
    await AppDataSource.manager.transaction(async (txManager) => {
      // get the repository needed
      const userRepo = txManager.getRepository(User);
      const txRepo = txManager.getRepository(Transaction);
      const licenseRepo = txManager.getRepository(License);
      try {
        // get the buyer and seller entities
        const buyerObj = await userRepo.findOneBy({ _id: userId });
        const sellerObj = await userRepo.findOneBy({ _id: seller });
        if (!buyerObj || !sellerObj) {
          return Promise.reject('No users found with provided ids while querying buyer / seller');
        }
        // subtract credits from buyers balance
        if (buyerObj.creditsToSpend - beatCost < 0) {
          return Promise.reject('Not enough credits for this purchase');
        }
        buyerObj.creditsToSpend -= beatCost;
        // add credits to sellers balance
        sellerObj.creditsAcquired += beatCost;
        // create the transaction
        const tx = new Transaction();
        tx.beatId = beat;
        tx.creditAmount = beatCost;
        tx.purchasingUser = buyerObj;
        tx.sellingUser = sellerObj;
        // create the license
        const license = new License();
        license.type = licenseType;
        license.user = buyerObj;
        license.beat = beat;
        license.transaction = tx;
        // save all entities asynchronously
        const saveBuyerPromise = userRepo.save(buyerObj);
        const saveSellerPromise = userRepo.save(sellerObj);
        const saveTxPromse = txRepo.save(tx);
        const saveLicensePromise = licenseRepo.save(license);
        await Promise.all([saveBuyerPromise, saveSellerPromise, saveTxPromse, saveLicensePromise]);
        // send notification to seller
        p.publishNotification({
          ctx: 'download',
          user_id: sellerObj._id,
          message: `${buyerObj.artistName} just downloaded one of your beats`,
        });
        return res.status(200).json({ message: 'Transaction completed successfully' });
      } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'An error occurred processing your transaction', err });
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'An error occurred purchasing a beat', err });
  }
};
