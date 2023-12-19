import * as express from 'express';
import path from 'path';
import multer from 'multer';
import { verifyUser } from '../middleware/verifyUser';
import { testNotifyHandler, testQueueHandler } from '../handlers/User.handler';
import {
  followUserHandler,
  unfollowUserHandler,
  getFollowersHandler,
  getFollowingHandler,
  isFollowingHandler,
} from '../handlers/UserFollowing.handler';
import {
  getUserHandler,
  searchUsersHandlers,
  getAvatarHandler,
  registerUserHandler,
  verifyEmailHandler,
  resendVerificationEmailHandler,
  resetPasswordHandler,
  changePasswordHandler,
  updateUserHandler,
  uploadAvatarHandler,
  createSubscriptionHandler,
  createStripePortalSessionHandler,
  getEarnedCreditsHandler,
  purchaseBeatHandler,
  getLicensedBeatshandler,
  getCreditsBalanceHandler,
  getUserForLoginHTTP,
} from '../handlers/UserHandlers';
import { createStripeConnectAcctHandler, stripeCustomerPortalHandler } from '../handlers/Stripe.handler';
import { getUserRefCode } from '../handlers/UserHandlers/getUserRefCode';
import { setUserRefCode } from '../handlers/UserHandlers/setUserRefCode';
import { getUsersHandler } from '../handlers/UserHandlers/getUsers';
import { adminSearchUsersHandlers } from '../handlers/UserHandlers/adminSearchUsers';
import { getConnectAccountUrlHandler, saveMerchantIdHandler } from '../handlers/PayPal.handler';
import { generatePayoutSummaries } from '../cron/payout';

const router = express.Router();

const upload = multer({
  dest: path.join(__dirname, '../uploads'),
});

// TESTING
router.get('/payouts', async (req: express.Request, res: express.Response) => {
  const ret = await generatePayoutSummaries();
  if (ret) {
    console.log('transactions: ', JSON.stringify(ret.transactionMap));
    console.log('summaries: ', JSON.stringify(ret.summaryMap));
  } else {
    console.log('undefined return values');
  }
  return res.status(200).send();
});

router.get('/', getUserHandler);
router.get('/users', getUsersHandler);
router.get('/notify-test', testNotifyHandler);
router.get('/rabbit-test', testQueueHandler);
// router.get('/rabbit-consume-test', testConsumeQueueHandler);
router.get('/search', searchUsersHandlers);
router.get('/avatar', getAvatarHandler);
router.post('/login', getUserForLoginHTTP);
router.post('/register', registerUserHandler);
router.get('/followers', getFollowersHandler);
router.get('/following', getFollowingHandler);
router.get('/isfollowing', isFollowingHandler);
router.get('/verify-email', verifyEmailHandler);
router.get('/resend-verification-email', resendVerificationEmailHandler);
router.get('/stripe-portal', createStripePortalSessionHandler);
router.get('/paypal-connect-link', verifyUser, getConnectAccountUrlHandler);
router.post('/paypal-connect', verifyUser, saveMerchantIdHandler);
router.post('/reset-password', resetPasswordHandler);
router.post('/change-password', changePasswordHandler);
router.post('/create-subscription', createSubscriptionHandler);
router.get('/customer-portal', stripeCustomerPortalHandler);
// for internal use only
router.get('/payout-spreadsheets');
// PROTECTED
router.post('/update', verifyUser, updateUserHandler);
router.post('/avatar', verifyUser, upload.single('newAvatar'), uploadAvatarHandler);
router.post('/follow', verifyUser, followUserHandler);
router.post('/unfollow', verifyUser, unfollowUserHandler);
// this route is only hit from the beats service
router.post('/purchase-beat', purchaseBeatHandler);
router.post('/create-stripe-connect-acct', verifyUser, createStripeConnectAcctHandler);
router.get('/credits-balance', verifyUser, getCreditsBalanceHandler);
router.get('/credits-earned', verifyUser, getEarnedCreditsHandler);
router.get('/licenses', getLicensedBeatshandler);
router.get('/sub-ref-code', verifyUser, getUserRefCode);
router.post('/sub-ref-code', verifyUser, setUserRefCode);
// only hit from cntrl admin panel
router.get('/admin-search', adminSearchUsersHandlers);
router.get(
  '*',
  (res, response, next) => {
    console.log('random route hit, all others missed');
    next();
  },
  getUserHandler
);

export default router;
