import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import 'reflect-metadata';
import { initDBConnection } from './database/dataSource';
// grpc modules
import { Server, ServerCredentials } from '@grpc/grpc-js';
import { UserService } from './proto/user_grpc_pb';
import { getUserForLogin } from './handlers/User.handler';
// routes
import indexRouter from './routes';

dotenv.config();

let PORT_GRPC = process.env.PORT_GRPC || '4080';
let PORT_HTTP = process.env.PORT_HTTP || '8080';

const CLIENT_HOST = process.env.CLIENT_HOST || 'http://localhost:3000';
// connect to database
initDBConnection();
// create Express app
const app = express();
// middleware
app.use(cors({ credentials: true, origin: CLIENT_HOST }));
app.use(express.json());
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cookieParser());
// routes
app.use(indexRouter);
// start server
app.listen(PORT_HTTP, () => {
  console.log(`HTTP User server listening on port ${PORT_HTTP}...`);
});

const startGrpcServer = (port: string) => {
  const server = new Server();
  server.addService(UserService, { getUserForLogin });
  server.bindAsync('localhost:' + port, ServerCredentials.createInsecure(), (err, port) => {
    if (err) {
      console.error(err);
    } else {
      server.start();
      console.log(`gRPC User server listening on port ${port}...`);
    }
  });
};
// export app for testing
export { app };
