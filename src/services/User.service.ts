import User from '../database/models/User.entity';
import { CreateUserInput } from '../database/schemas/User.schema';
import { AppDataSource } from '../database/dataSource';

// TODO: implement CustomErr class for all thrown errors

// load user repository
const userRepository = AppDataSource.getRepository(User);

export const createUser = async (input: CreateUserInput) => {
  return (await AppDataSource.manager.save(AppDataSource.manager.create(User, input))) as User;
};
// NOTE: this does return the password has while selecting by ID does NOT
export const findUserByEmail = async (email: string, select?: {}) => {
  return await userRepository.findOne({
    where: { email: email },
    select: { _id: true, email: true, artistName: true, password: true },
  });
};

export const findUserById = async (userId: string) => {
  return await userRepository.findOneBy({ _id: userId });
};

export const findUser = async (query: Object) => {
  return await userRepository.findOneBy(query);
};

export const updateUserById = async (userId: string, updatedFields: {}) => {
  return await userRepository.update({ _id: userId }, updatedFields);
};

export const addCredits = async (userId: string, creditsToAdd: number) => {
  const user = await findUserById(userId);
  if (!user) {
    return Promise.reject('No user found with this ID');
  }
  console.log('Current credit balance: ', user.creditsToSpend);
  user.creditsToSpend += creditsToAdd;
  console.log('New credit balance: ', user.creditsToSpend);
  await userRepository.save(user);
  return Promise.resolve(user.creditsToSpend);
};

export const subCredits = async (userId: string, creditsToSub: number) => {
  const user = await findUserById(userId);
  if (!user) {
    return Promise.reject('No user found with this ID');
  }
  console.log('Current credit balance: ', user.creditsToSpend);
  if (user.creditsToSpend - creditsToSub < 0) {
    return Promise.reject('User does not have enough credits for this transaction');
  }
  user.creditsToSpend -= creditsToSub;
  console.log('New credit balance: ', user.creditsToSpend);
  await userRepository.save(user);
  return Promise.resolve(user.creditsToSpend);
};

export const getCreditsBalance = async (userId: string) => {
  const user = await findUserById(userId);
  if (!user) {
    return Promise.reject('No user found with this ID');
  }
  const creditsBalance = user.creditsToSpend;
  return Promise.resolve(creditsBalance);
};
