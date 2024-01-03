import * as express from 'express';
import { generatePayoutSummaries } from '../cron/payout';
import { clearPayoutsHandler, getPayoutsHandler, sendPayoutsHandler } from '../handlers/PayoutHandlers';
import { getPayouts } from '../services/Payout.service';

const router = express.Router();

router.post('/payouts', async (req: express.Request, res: express.Response) => {
  try {
    await generatePayoutSummaries();
    const allPayouts = await getPayouts();
    return res.status(200).json(allPayouts);
  } catch (err) {
    console.error(err);
    return res.status(500).json(err);
  }
});
router.post('/send-payouts', sendPayoutsHandler);
router.get('/payouts', getPayoutsHandler);
router.delete('/payouts', clearPayoutsHandler);

export default router;
