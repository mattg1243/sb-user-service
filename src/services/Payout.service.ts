import { AppDataSource } from '../database/dataSource';
import Payout from '../database/models/Payout.entity';
import { ICreatePayoutArgs } from '../database/schemas/Payout.schema';

const payoutRepository = AppDataSource.getRepository(Payout);

export const createPayout = async (input: ICreatePayoutArgs) => {
  return (await AppDataSource.manager.save(AppDataSource.manager.create(Payout, input))) as Payout;
};

export const getPayout = async (id: string) => {
  return await payoutRepository.findOneBy({ _id: id });
};

export const getPayouts = async () => {
  return await payoutRepository.find();
};

export const getPayoutsByUser = async (userId: string) => {
  return await payoutRepository.findBy({ userId: userId });
};
