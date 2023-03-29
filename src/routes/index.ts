import Router from 'express';
import path from 'path';
import multer from 'multer';
import { verifyUser } from '../middleware/verifyUser';
import {
  registerUserHandler,
  getFollowersHandler,
  getFollowingHandler,
  followUserHandler,
  unfollowUserHandler,
  isFollowingHandler,
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
router.get('/followers', getFollowersHandler);
router.get('/following', getFollowingHandler);
router.get('/isfollowing', isFollowingHandler)
// PROTECTED
router.post('/update', verifyUser, updateUserHandler);
router.post('/avatar', verifyUser, upload.single('newAvatar'), uploadAvatarHandler);
router.post('/follow', verifyUser, followUserHandler);
router.post('/unfollow', verifyUser, unfollowUserHandler);

router.get(
  '*',
  (res, response, next) => {
    console.log('random route hit, all others missed');
    next();
  },
  getUserHandler
);

export default router;
