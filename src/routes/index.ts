import Router from 'express';
import path from 'path';
import multer from 'multer';
import { verifyUser } from '../middleware/verifyUser';
import {
  indexHandler,
  registerUserHandler,
  getUserHandler,
  getAvatarHandler,
  updateUserHandler,
  getUserForLoginHTTP,
  uploadAvatarHandler,
} from '../handlers/User.handler';

const router = Router();

const upload = multer({
  dest: path.join(__dirname, '../uploads'),
});

router.get('/', getUserHandler);
router.get('/avatar', getAvatarHandler);
router.post('/login', getUserForLoginHTTP);
router.post('/register', registerUserHandler);
// PROTECTED
router.post('/update', verifyUser, updateUserHandler);
router.post('/avatar', verifyUser, upload.single('newAvatar'), uploadAvatarHandler);


router.get(
  '*',
  (res, response, next) => {
    console.log('random route hit, all others missed');
    next();
  },
  getUserHandler
);

export default router;
