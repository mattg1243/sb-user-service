import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import 'reflect-metadata';
import { AppDataSource } from './database/dataSource';
// grpc modules
import { Server, ServerCredentials } from '@grpc/grpc-js';
import { UserService } from './proto/user_grpc_pb';
import { getUserForLogin } from './handlers/User.handler';
// routes
import indexRouter from './routes';

dotenv.config();

let PORT_GRPC = 4080;
let PORT_HTTP = 8080;

AppDataSource.initialize().then(() => {
  // create express app
  const app = express();
  // middleware
  app.use(cors());
  app.use(express.json());
  app.use(cookieParser());
  // routes
  app.use(indexRouter);
  // start server
  app.listen(PORT_HTTP, () => {
    console.log(`HTTP User server listening on port ${PORT_HTTP}...`);
  });

  // testing out grpc server here
  startGrpcServer(PORT_GRPC);
});

const startGrpcServer = (port: number) => {
  const server = new Server();
  server.addService(UserService, { getUserForLogin });
  server.bindAsync(`localhost:${port}`, ServerCredentials.createInsecure(), (err, port) => {
    if (err) {
      console.error(err);
    } else {
      server.start();
      console.log(`gRPC User server listening on port ${port}...`);
    }
  });
};
