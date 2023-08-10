import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { createClient } from 'redis';
import 'reflect-metadata';
import { stripeWebhookHandler } from './handlers/Stripe.handler';
// grpc modules
import { Server, ServerCredentials } from '@grpc/grpc-js';
import { UserService } from './proto/user_grpc_pb';
import { getUserForLogin } from './handlers/User.handler';
// routes
import indexRouter from './routes';

dotenv.config();

export const CLIENT_HOST = process.env.CLIENT_HOST || 'http://localhost:3000';
// create redis client
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const redisClient = createClient({ url: redisUrl });
redisClient.on('error', (err) => console.error('Redis client error: ', err));
export { redisClient };
// connect to q

// create Express app
const app = express();
// middleware
app.use(cors({ credentials: true, origin: CLIENT_HOST }));
// webhook route before json middleware
app.post('/stripe-webhook', express.raw({ type: '*/*' }), stripeWebhookHandler);
app.use(express.json());
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cookieParser());
// routes
app.use(indexRouter);

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
