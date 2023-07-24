import User from '../database/models/User.entity';
import EmailVerify from '../database/models/EmailVerify.entity';
import { CreateUserInput } from '../database/schemas/User.schema';
import { AppDataSource } from '../database/dataSource';
import CreditAllocation from '../database/models/CreditAllocation.model';

// TODO: implement CustomErr class for all thrown errors

// load user repository
const userRepository = AppDataSource.getRepository(User);
const emailVerifyRepository = AppDataSource.getRepository(EmailVerify);

export const createUser = async (input: CreateUserInput) => {
  return (await AppDataSource.manager.save(AppDataSource.manager.create(User, input))) as User;
};

export const createVerifyEmailCode = async (user: User) => {
  return await AppDataSource.manager.save(AppDataSource.manager.create(EmailVerify, { user }));
};

export const findVerifyEmailCode = async (code: string) => {
  return await emailVerifyRepository.findOne({ where: { hash: code }, select: { user: { _id: true } } });
};

export const findVerifyEmailCodeByUser = async (userId: string) => {
  return await emailVerifyRepository.findOne({ where: { user: { _id: userId } } });
};

export const deleteVerifyEmailCode = async (id: string) => {
  return await emailVerifyRepository.delete({ _id: id });
};
// NOTE: this does return the password has while selecting by ID does NOT
export const findUserByEmail = async (email: string, select?: {}) => {
  return await userRepository.findOne({
    where: { email: email },
    select: { _id: true, email: true, artistName: true, password: true, verified: true, stripeCustomerId: true },
  });
};

export const findUserById = async (userId: string) => {
  return await userRepository.findOneBy({ _id: userId });
};

export const findUser = async (query: Object) => {
  return await userRepository.findOneBy(query);
};

export const searchAllUsers = async (query: string) => {
  const formattedQuery = query.trim().replace(/ /g, ' & ');
  return await userRepository
    .createQueryBuilder('user')
    .where(`to_tsvector('simple', user.artistName) @@ to_tsquery('simple', :query)`, { query: `${formattedQuery}:*` })
    .getMany();
};

export const updateUserById = async (userId: string, updatedFields: {}) => {
  return await userRepository.update({ _id: userId }, updatedFields);
};

export const findUserPasswordResetToken = async (userEmail: string) => {
  const user = userRepository
    .createQueryBuilder('user')
    .where('user.email = :userEmail', { userEmail: userEmail })
    .addSelect('user.password')
    .addSelect('user.passwordResetToken')
    .addSelect('user.passwordResetTokenExp')
    .getOne();
  return user;
};

export const changeUserPassword = async (email: string, newPasswordHash: string) => {
  return await userRepository.update({ email: email }, { password: newPasswordHash });
};

export const addCredits = async (userId: string, creditsToAdd: number) => {
  AppDataSource.transaction(async (txManager) => {
    const userRepo = txManager.getRepository(User);
    const creditRepo = txManager.getRepository(CreditAllocation);
    const user = await userRepo.findOne({ where: { _id: userId } });
    if (!user) {
      return Promise.reject('No user found with this ID');
    }
    const creditAllocation = new CreditAllocation();
    creditAllocation.user = user;
    creditAllocation.amount = creditsToAdd;
    user.creditsToSpend += creditsToAdd;
    const saveUserPromise = userRepo.save(user);
    const saveCreditAllocationPromise = creditRepo.save(creditAllocation);
    await Promise.all([saveUserPromise, saveCreditAllocationPromise]);
    return user.creditsToSpend;
  });
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

export const getCreditsEarned = async (userId: string) => {
  const user = await findUserById(userId);
  if (!user) {
    return Promise.reject('No user found with this ID');
  }
  const creditsEarned = user.creditsAcquired;
  return creditsEarned;
};

export const getUserByStripeCustomerId = async (customerId: string, eventType?: string) => {
  const user = await userRepository.findOne({ where: { stripeCustomerId: customerId } });
  if (!user) {
    return Promise.reject('No user found with Stripe customer ID ' + customerId + 'for event type ' + eventType);
  } else {
    return user;
  }
};

export const getUserByStripeConnectId = async (connectId: string) => {
  const user = await userRepository.findOne({ where: { stripeConnectId: connectId } });
  if (!user) {
    return Promise.reject('No user found with Stripe Connect Id ' + connectId);
  } else {
    return user;
  }
};
