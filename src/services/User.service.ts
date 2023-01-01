import User from '../database/models/User.entity';
import { CreateUserInput } from '../database/schemas/User.schema';
import { AppDataSource } from '../database/dataSource';

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
