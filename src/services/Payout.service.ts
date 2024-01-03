import { FindOptionsWhere, FindOptionsSelect, FindOptionsSelectByString, In, Between } from 'typeorm';
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

interface IGetPayoutsArg {
  where?: FindOptionsWhere<Payout> | FindOptionsWhere<Payout>[];
  select?: FindOptionsSelect<Payout> | FindOptionsSelectByString<Payout>;
}

export const getPayouts = async (args?: IGetPayoutsArg) => {
  return await payoutRepository.find({
    relations: { user: true },
    select: {
      ...args?.select,
      user: {
        _id: true,
        artistName: true,
        payoutMethod: true,
        email: true,
        stripeConnectId: true,
        paypalMerchantId: true,
      },
    },
    where: args?.where,
  });
};

export const getPayoutsInDateRange = async (start: Date, end: Date, query?: IGetPayoutsArg) => {
  return await payoutRepository.find({
    relations: { user: true },
    select: { ...query?.select, user: { _id: true, artistName: true, payoutMethod: true } },
    where: { ...query?.where, created_at: Between(start, end) },
  });
};

export const getPayoutsByUser = async (userId: string) => {
  return await payoutRepository.find({
    relations: { user: true },
    select: { user: { _id: true, artistName: true, payoutMethod: true } },
    where: { user: { _id: userId } },
  });
};

export const clearPayouts = async () => {
  const allPayouts = await getPayouts();
  const allIds = allPayouts.map((p) => p._id);
  return await payoutRepository.delete(allIds);
};
