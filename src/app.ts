import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import 'reflect-metadata';

import indexRouter from './routes';
import { AppDataSource } from './database/dataSource';

dotenv.config();

AppDataSource.initialize().then(async () => {
  const PORT = process.env.PORT || 8080;
  // create express app
  const app = express();
  // middleware
  app.use(cors());
  app.use(express.json());
  app.use(cookieParser());
  // routes
  app.use(indexRouter);
  // start server
  app.listen(PORT, () => {
    console.log(`User server listening on port ${PORT}...`);
  });
});
