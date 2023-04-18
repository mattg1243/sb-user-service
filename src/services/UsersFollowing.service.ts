import UsersFollowing from '../database/models/UsersFollowing.entity';
import { AppDataSource } from '../database/dataSource';

// load userfollowing repository
const usersFollowingRepository = AppDataSource.getRepository(UsersFollowing);

const getRowFromRepository = async (userId: string) => {
  return await usersFollowingRepository.findOne({ where: { user_id: userId } });
};

export const addFollower = async (userId: string, followerId: string) => {
  // get user
  const user = await getRowFromRepository(userId);
  // if the user doesnt follow anyone yet, create their row in the table
  if (!user || !user.following) {
    usersFollowingRepository.insert({ user_id: userId, following: [followerId] });
  } else {
    user.following.push(followerId);
    user.save();
  }
  return;
};

export const removeFollower = async (userId: string, followerIdToRemove: string) => {
  const user = await getRowFromRepository(userId);
  if (!user || !user.following) {
    throw new Error('This user does not exist in the users_followig table');
  } else {
    const followerIndex = user.following.indexOf(followerIdToRemove);
    if (followerIndex === -1) {
      throw new Error('The user does not appear to currently be following this user');
    } else {
      // remove the user from the following array
      user.following.splice(followerIndex, 1);
      user.save();
    }
  }
};

export const isFollowing = async (userId: string, followedUserId: string) => {
  const user = await getRowFromRepository(userId);
  if (!user) {
    throw new Error('This user does not exist in the users_followig table');
  } else {
    const followerIndex = user.following.indexOf(followedUserId);
    if (followerIndex === -1) {
      return false;
    } else {
      return true;
    }
  }
};

export const getFollowers = async (userId: string) => {
  try {
    const queryResult = await usersFollowingRepository
      .createQueryBuilder()
      .where('UsersFollowing.following like :following', { following: `%${userId}%` })
      .select('UsersFollowing.following')
      .getOne();
    // extract only the IDs of followers to return
    const followers = queryResult?.following;
    return followers;
  } catch (err) {
    console.error(err);
    return Promise.reject('An error occured getting follower count');
  }
};

export const getFollowing = async (userId: string) => {
  try {
    const user = await getRowFromRepository(userId);
    if (!user) {
      throw new Error('This user does not exist in the user_following table');
    } else {
      return user.following;
    }
  } catch (err) {
    console.error(err);
    return Promise.reject('An error occured getting follower count');
  }
};
