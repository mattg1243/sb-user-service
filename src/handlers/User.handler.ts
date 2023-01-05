import { NextFunction, Request, Response } from 'express';
import { createUser, findUserByEmail, findUserById, updateUserById } from '../services/User.service';
import { CreateUserInput } from '../database/schemas/User.schema';
import { sendUnaryData, ServerUnaryCall } from '@grpc/grpc-js';
import { GetUserForLoginRequest, GetUserForLoginResponse } from '../proto/user_pb';
import { verifyJwt } from '../jwt';
import axios from 'axios';
import { uploadFileToS3 } from '../bucket/upload';

const BEATS_HOST = process.env.BEATS_HOST || 'http://localhost:8082';

export const indexHandler = async (req: Request, res: Response, next: NextFunction) => {
  return res.status(200).json({ message: 'User service online!' });
};

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

export const getUserHandler = async (req: Request, res: Response) => {
  const userId = req.query.id as string;

  if (!userId) {
    return res.status(401).json({ message: 'No user ID provided upon server request' });
  } else {
    try {
      const user = await findUserById(userId);
      res.status(200).json(user?.toJSON());
    } catch (err) {
      console.error(err);
      res.status(503).json({ message: 'error getting user:\n', err });
    }
  }
};
// TODO: make a zod schema for this request body
export const updateUserHandler = async (req: Request, res: Response) => {
  const { artistName, bio, linkedSocials } = req.body;
  // check if the avatar field contains a new file
  const token = req.cookies['sb-access-token'];
  const userInfo = verifyJwt(token);

  if (!userInfo) {
    return res.status(401).json({ message: 'Invalid/missing user credentials provided with request' });
  } else {
    try {
      const updatedUser = await updateUserById(userInfo.user.id, { artistName, bio, linkedSocials });
      // check if artistName has been updated and if so, update their beats
      if (artistName !== userInfo.user.artistName) {
        const updatedBeatsResponse = await axios.put(`${BEATS_HOST}/update-artist-name/${userInfo.user.id}`, {
          artistName,
        });
      }
      return res.status(200).json({ message: 'user info successfully updated' });
    } catch (err) {
      console.error(err);
      return res.status(503).json(err);
    }
  }
};

export const uploadAvatarHandler = async (req: Request, res: Response) => {
  const token = req.cookies['sb-access-token'];
  const userInfo = verifyJwt(token);
  const userId = userInfo?.user.id;

  if (!userId || !userInfo) {
    return res.status(401).json({ message: 'no auth token detected' });
  }

  const newAvatar = req.file;
  if (!newAvatar) {
    return res.status(400).json({ message: 'no file detecting while updating avatar' });
  }

  try {
    const uploadAvatarRes = await uploadFileToS3(newAvatar);
    if (!uploadAvatarRes) {
      console.log('error uploading image file');
      return res.status(500).json('error uploading image');
    }
    const avatarKey = uploadAvatarRes.Key;
    const updateUserRes = updateUserById(userId, { avatar: avatarKey });
    console.log(updateUserRes);
    return res.status(200).json({ message: 'avatar update successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'an error occured while uploading your new avatar to storage' });
  }
};

// temp function for using http instead of gRPC for the free deployments
export const getUserForLoginHTTP = async (req: Request, res: Response) => {
  const { email } = req.body;
  try {
    const user = await findUserByEmail(email);
    console.log(user);
    if (!user) {
      return res.status(401).json({ message: 'No user found with that email address' });
    }
    const userResponse = {
      id: user._id,
      email: user.email,
      artistName: user.artistName,
      password: user.password,
    };
    return res.status(200).json(userResponse);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'error finding user by email' });
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
