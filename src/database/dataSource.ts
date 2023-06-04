import { DataSource } from 'typeorm';
import User from './models/User.entity';
import dotenv from 'dotenv';
import UsersFollowing from './models/UsersFollowing.entity';
import EmailVerify from './models/EmailVerify.entity';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DB_URL,
  port: 5432,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: 'sweatshop_calabasas',
  synchronize: true,
  logging: false,
  entities: [User, UsersFollowing, EmailVerify],
  subscribers: [],
  migrations: [],
  ssl: true,
});

export const initDBConnection = async () => {
  await AppDataSource.initialize();
};

export const closeConnection = async () => {
  await AppDataSource.destroy();
};
