import { Request, Response } from 'express';
import User from '../../../database/models/User.entity';
import { getUsers } from '../../../services/User.service';
import { FindOptionsOrder } from 'typeorm';

type SortByOptions = 'name' | 'email' | 'date';
type OrderOptions = 'ASC' | 'DESC';

export const getUsersHandler = async (req: Request, res: Response) => {
  const take = req.query.take as string;
  const skip = req.query.skip as string;
  const sort = req.query.sort as SortByOptions;
  const order = req.query.order as OrderOptions;

  // check for required query params
  if (!take) {
    return res.status(400).json({ message: 'Please provide a take parameter (as int) with request' });
  }
  if (!skip) {
    return res.status(400).json({ message: 'Please provide a skip param with request' });
  }
  // serialize sort & order params if provided
  let users: User[];
  if (sort && order) {
    const sortAndOrder = serializeSort(sort, order);
    try {
      users = await getUsers(parseInt(take), parseInt(skip), sortAndOrder);
      return res.status(200).json(users);
    } catch (err) {
      return res.status(500).json({ message: 'An error occurred', err });
    }
  } else {
    try {
      users = await getUsers(parseInt(take), parseInt(skip), { artistName: 'DESC' });
      return res.status(200).json(users);
    } catch (err) {
      return res.status(500).json({ message: 'An error occurred', err });
    }
  }
};

// helper fn for serializing sort query param
const serializeSort = (sort: SortByOptions, order: OrderOptions): FindOptionsOrder<User> => {
  switch (sort) {
    case 'name':
      return { artistName: order };
    case 'email':
      return { email: order };
    case 'date':
      return { created_at: order };
  }
};
