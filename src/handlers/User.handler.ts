import { NextFunction, Request, Response } from 'express';
import { findUserByEmail } from '../services/User.service';
import { p, c } from '../utils/Rabbitmq';

import { sendUnaryData, ServerUnaryCall } from '@grpc/grpc-js';
import { GetUserForLoginRequest, GetUserForLoginResponse } from '../proto/user_pb';
import axios from 'axios';
export const BEATS_HOST = process.env.BEATS_HOST || 'http://localhost:8082';
export const NOTIF_HOST = process.env.NOTIF_HOST || 'http://0.0.0.0:8083';

export const indexHandler = async (req: Request, res: Response, next: NextFunction) => {
  return res.status(200).json({ message: 'User service online!' });
};

export const testNotifyHandler = async (req: Request, res: Response) => {
  try {
    const notifRes = await axios.post(`${NOTIF_HOST}/notify`, {
      user_id: '127a79a2-bcc9-4e9e-8e46-6284f57e7420',
      message: 'hello mothafucka',
    });
    console.log(notifRes.status);
    return res.status(200).send();
  } catch (err) {
    console.error(err);
    return res.status(500).send();
  }
};

export const testQueueHandler = async (
  req: Request<{}, {}, { notification: { type: 'error' | 'success' | 'info'; msg: string } }>,
  res: Response
) => {
  console.log(req.body);
  const { notification } = req.body;
  if (!notification) {
    return res.status(400).json({ message: 'No notification found in request body' });
  }

  try {
    const pubRes = await p.publishNotification({ ctx: 'follow', message: 'a new user just followed you', user_id: '1234asdf' });
    console.log(pubRes);
    return res.status(200).send();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ err });
  }
};

// export const testConsumeQueueHandler = async (req: Request, res: Response) => {
//   try {
//     c.consumeNotifications();
//     return res.status(200).send();
//   } catch (err) {
//     console.error(err);
//   }
// };

// TODO: create a directory dedicated to all gRPC mapped handler functions
export const getUserForLogin = async (
  call: ServerUnaryCall<GetUserForLoginRequest, GetUserForLoginResponse>,
  callback: sendUnaryData<GetUserForLoginResponse>
) => {
  const email = call.request.getEmail();
  try {
    const user = await findUserByEmail(email);
    console.log(user);
    if (!user) {
      return callback({
        code: 5,
        message: 'No user found with that email',
      });
    }
    // create the response variable with only needed fields
    const userResponse = new GetUserForLoginResponse();
    userResponse.setId(user._id);
    userResponse.setEmail(user.email);
    userResponse.setArtistName(user.artistName);
    userResponse.setPassword(user.password);
    return callback(null, userResponse);
  } catch (err: any) {
    console.error(err.code);
    callback(err.code);
  }
};
