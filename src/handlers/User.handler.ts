import { NextFunction, Request, Response } from 'express';
import { createUser, findUserByEmail } from '../services/User.service';
import { CreateUserInput } from '../database/schemas/User.schema';
import { sendUnaryData, ServerUnaryCall } from '@grpc/grpc-js';
import { GetUserForLoginRequest, GetUserForLoginResponse } from '../proto/user_pb';

export const indexHandler = async (req: Request, res: Response, next: NextFunction) => {
    return res.status(200).json({ message: 'User service online!' });
}

export const registerUserHandler = async (req: Request<{}, {}, CreateUserInput>, res: Response, next: NextFunction) => {
  const { email, password, artistName } = req.body;
  console.log('artistName: ', artistName);
  try {
    const user = await createUser({
      email,
      artistName,
      password,
    });

    console.log(`  --- user registered : ${artistName}  ---  `);
    // this needs to call the auth service and generate tokens for the new user here
    return res.status(200).json({ message: 'user registered succesfully', user });
  } catch (err: any) {
    if (err.code === '23505') {
      return res.status(403).json({ message: 'A user with this email / username already exists.' });
    }
    console.error(err);
    return res.status(500).json({ message: 'failed to create the user', err });
  }
};

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
