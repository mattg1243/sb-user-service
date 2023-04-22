import UsersFollowing from '../database/models/UsersFollowing.entity';
import { AppDataSource } from '../database/dataSource';
import { CustomErr, CustomErrCodes } from '../utils/CustomErr';

// TODO: implement CustomErr class for all thrown errors

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
    throw new CustomErr('This user does not exist in the users_followig table', CustomErrCodes.DNE);
  } else {
    const followerIndex = user.following.indexOf(followedUserId);
    if (followerIndex === -1) {
      return false;
    } else {
      return true;
    }
  }
};

export const getFollowers = async (userId: string): Promise<Array<string | null>> => {
  try {
    const queryResult = await usersFollowingRepository
      .createQueryBuilder('user')
      .select('user.user_id')
      .where('following like :following', { following: `%${userId}%` })
      // .select('UsersFollowing.user_id')
      .getRawMany();
    console.log('Raw query results:\n', queryResult);
    // extract only the IDs of followers to return
    let followers: Array<string | null>;
    if (!queryResult) {
      followers = [];
    } else {
      followers = queryResult.map((row) => row.user_user_id);
    }
    return followers;
  } catch (err) {
    console.error(err);
    return Promise.reject('An error occured getting follower count');
  }
};

export const getFollowing = async (userId: string): Promise<Array<string | null>> => {
  try {
    const user = await getRowFromRepository(userId);
    if (!user) {
      return [];
    } else {
      return user.following;
    }
  } catch (err) {
    console.error(err);
    return Promise.reject('An error occured getting follower count');
  }
};
