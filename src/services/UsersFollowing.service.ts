import UsersFollowing from '../database/models/UsersFollowing.entity';
import { AppDataSource } from '../database/dataSource';

// load userfollowing repository
const usersFollowingRepository = AppDataSource.getRepository(UsersFollowing);

export const addFollower = async (userId: string, followerId: string) => {
  // get user
  const user = await usersFollowingRepository.findOne({ where: { user_id: userId } });
  // if the user doesnt follow anyone yet, create their row in the table
  if (!user) {
    usersFollowingRepository.insert({ user_id: userId, following: [followerId] });
  } else {
    user.following.push(followerId);
    user.save();
  }
  return;
};

export const removeFollower = async (userId: string, followerIdToRemove: string) => {
  const user = await usersFollowingRepository.findOne({ where: { user_id: userId } });
  if (!user) {
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
