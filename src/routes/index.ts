import Router from 'express';
import { indexHandler, registerUserHandler } from '../handlers/User.handler';

const router = Router();

router.get('/', indexHandler);
router.post('/register', registerUserHandler);

export default router;
