import Router from 'express';
import {
  indexHandler,
  registerUserHandler,
  getUserHandler,
  updateUserHandler,
  getUserForLoginHTTP,
} from '../handlers/User.handler';

const router = Router();

router.get('/', getUserHandler);
router.post('/login', getUserForLoginHTTP);
router.post('/register', registerUserHandler);
router.post('/update', updateUserHandler);
router.get(
  '*',
  (res, response, next) => {
    console.log('random route hit, all others missed');
    next();
  },
  getUserHandler
);

export default router;
