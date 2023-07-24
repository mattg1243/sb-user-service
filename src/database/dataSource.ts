import { DataSource } from 'typeorm';
import User from './models/User.entity';
import dotenv from 'dotenv';
import UsersFollowing from './models/UsersFollowing.entity';
import EmailVerify from './models/EmailVerify.entity';
import Transaction from './models/Transaction.model';
import License from './models/License.entity';
import CreditAllocation from './models/CreditAllocation.model';

dotenv.config();

const dev = process.env.NODE_ENV !== 'production';

const DB_URL = process.env.DB_URL;
const DB_USERNAME = process.env.DB_USERNAME;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_NAME = process.env.DB_NAME;

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: dev ? undefined : DB_URL,
  host: dev ? 'localhost' : undefined,
  port: 5432,
  username: DB_USERNAME,
  password: DB_PASSWORD,
  database: DB_NAME,
  synchronize: true,
  logging: false,
  entities: [User, UsersFollowing, EmailVerify, Transaction, License, CreditAllocation],
  subscribers: [],
  migrations: [],
  ssl: dev ? false : true,
});

export const initDBConnection = async () => {
  await AppDataSource.initialize();
};

export const closeConnection = async () => {
  await AppDataSource.destroy();
};
