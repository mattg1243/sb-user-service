import Router from 'express';
import path from 'path';
import multer from 'multer';
import { verifyUser } from '../middleware/verifyUser';
import {
  changePasswordHandler,
  getCreditsBalanceHandler,
  resendVerificationEmailHandler,
  resetPasswordHandler,
  subCreditsHandler,
  verifyEmailHandler,
} from '../handlers/User.handler';
import {
  followUserHandler,
  unfollowUserHandler,
  getFollowersHandler,
  getFollowingHandler,
  isFollowingHandler,
} from '../handlers/UserFollowing.handler';
import {
  registerUserHandler,
  getUserHandler,
  getAvatarHandler,
  updateUserHandler,
  getUserForLoginHTTP,
  uploadAvatarHandler,
  addCreditsHandler,
} from '../handlers/User.handler';

const router = Router();

const upload = multer({
  dest: path.join(__dirname, '../uploads'),
});

router.get('/', getUserHandler);
router.get('/avatar', getAvatarHandler);
router.post('/login', getUserForLoginHTTP);
router.post('/register', registerUserHandler);
router.get('/followers', getFollowersHandler);
router.get('/following', getFollowingHandler);
router.get('/isfollowing', isFollowingHandler);
router.get('/verify-email', verifyEmailHandler);
router.get('/resend-verification-email', resendVerificationEmailHandler);
router.post('/reset-password', resetPasswordHandler);
router.post('/change-password', changePasswordHandler);
// PROTECTED
router.post('/update', verifyUser, updateUserHandler);
router.post('/avatar', verifyUser, upload.single('newAvatar'), uploadAvatarHandler);
router.post('/follow', verifyUser, followUserHandler);
router.post('/unfollow', verifyUser, unfollowUserHandler);
router.post('/add-credits', verifyUser, addCreditsHandler);
router.post('/sub-credits', subCreditsHandler);
router.get('/credits-balance', verifyUser, getCreditsBalanceHandler);

router.get(
  '*',
  (res, response, next) => {
    console.log('random route hit, all others missed');
    next();
  },
  getUserHandler
);

export default router;
