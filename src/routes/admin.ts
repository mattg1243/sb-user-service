import * as express from 'express';
import { generatePayoutSummaries } from '../cron/payout';
import { getPayoutsHandler } from '../handlers/PayoutHandlers';
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

router.get('/payouts', getPayoutsHandler);

export default router;
