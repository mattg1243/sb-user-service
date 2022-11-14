import Router from 'express';
import { indexHandler } from '../handlers';

const router = Router();

router.get('/', indexHandler);

export default router;