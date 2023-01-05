import Router from 'express';
import path from 'path';
import multer from 'multer';
import {
  indexHandler,
  registerUserHandler,
  getUserHandler,
  updateUserHandler,
  getUserForLoginHTTP,
  uploadAvatarHandler,
} from '../handlers/User.handler';

const router = Router();

const upload = multer({
  dest: path.join(__dirname, '../uploads'),
});

router.get('/', getUserHandler);
router.post('/login', getUserForLoginHTTP);
router.post('/register', registerUserHandler);
router.post('/update', updateUserHandler);
router.post('/avatar', upload.single('newAvatar'), uploadAvatarHandler);

router.get(
  '*',
  (res, response, next) => {
    console.log('random route hit, all others missed');
    next();
  },
  getUserHandler
);

export default router;
