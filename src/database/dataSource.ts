import { DataSource } from 'typeorm';
import User from './models/User.entity';
import dotenv from 'dotenv';
import UsersFollowing from './models/UsersFollowing.entity';

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
  entities: [User, UsersFollowing],
  subscribers: [],
  migrations: [],
  ssl: true,
});
