import { Request, Response, NextFunction } from 'express';
import {
  addFollower,
  removeFollower,
  getFollowers,
  getFollowing,
  isFollowing,
} from '../services/UsersFollowing.service';

// TODO: implement CustomErr class for all thrown errors

export const followUserHandler = async (req: Request, res: Response) => {
  console.log('follow route hit');
  const user = req.user;
  const { userToFollow } = req.body;
  console.log('req.body: ', req.body);

  if (user && userToFollow) {
    try {
      await addFollower(user.id, userToFollow);
      res.status(200).json({ message: 'Follower added' });
    } catch (err: any) {
      console.error(err);
      return res.status(500).json({ message: 'An error occured' });
    }
  } else {
    res.status(400).json({ message: 'Invalid request' });
  }
};

export const unfollowUserHandler = async (req: Request, res: Response) => {
  console.log('unfollow user route hit');
  const user = req.user;
  const { userToUnfollow } = req.body;
  console.log('req.body', req.body);

  if (user && userToUnfollow) {
    try {
      await removeFollower(user.id, userToUnfollow);
      res.status(200).json({ message: 'Follower removed' });
    } catch (err: any) {
      console.error(err);
      return res.status(500).json({ message: err.message });
    }
  } else {
    res.status(400).json({ message: 'Invalid request' });
  }
};

export const getFollowersHandler = async (req: Request, res: Response) => {
  const { user } = req.query;
  if (!user) {
    return res.status(400).json({ message: 'No userID found in query string' });
  }
  try {
    const followers = await getFollowers(user as string);
    console.log('followers from service fn:\n', followers);
    return res.status(200).json({ followers });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'An error occured.' });
  }
};

export const getFollowingHandler = async (req: Request, res: Response) => {
  const { user } = req.query;
  if (!user) {
    return res.status(400).json({ message: 'No userID found in query string' });
  }
  try {
    const following = await getFollowing(user as string);
    return res.status(200).json({ following });
  } catch (err: any) {
    console.error(err.message);
    return res.status(500).json({ message: err.message });
  }
};

export const isFollowingHandler = async (req: Request, res: Response) => {
  const { user, userToCheck } = req.query;
  console.log('is following route hit ');
  console.log(user, userToCheck);
  try {
    const following = await isFollowing(user as string, userToCheck as string);
    return res.status(200).json({ isFollowing: following });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'An error occured' });
  }
};
