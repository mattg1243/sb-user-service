import { NextFunction, Request, Response } from 'express';
import {
  addCredits,
  createUser,
  findUserByEmail,
  findUserById,
  getCreditsBalance,
  subCredits,
  updateUserById,
} from '../services/User.service';
import { CreateUserInput } from '../database/schemas/User.schema';
import { sendUnaryData, ServerUnaryCall } from '@grpc/grpc-js';
import { GetUserForLoginRequest, GetUserForLoginResponse } from '../proto/user_pb';
import axios from 'axios';
import { uploadFileToS3 } from '../bucket/upload';

const BEATS_HOST = process.env.BEATS_HOST || 'http://localhost:8082';

export const indexHandler = async (req: Request, res: Response, next: NextFunction) => {
  return res.status(200).json({ message: 'User service online!' });
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

export const getAvatarHandler = async (req: Request, res: Response) => {
  const userId = req.query.id as string;

  if (!userId) {
    return res.status(401).json({ message: 'No user ID provided upon server request' });
  } else {
    try {
      const user = await findUserById(userId);
      return res.status(200).json(user?.avatar);
    } catch (err) {
      console.error(err);
      res.status(503).json({ message: 'error getting user avatar:\n', err });
    }
  }
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
      return res.status(403).json({ message: 'A user with this email or username already exists.' });
    }
    console.error(err);
    return res.status(500).json({ message: 'Failed to create the user', err });
  }
};
// TODO: make a zod schema for this request body
export const updateUserHandler = async (req: Request, res: Response) => {
  const user = req.user;
  const token = req.token;
  if (!user) {
    console.log('Middleware failed to attach user to request ');
    return res.status(400).json({ message: 'Middleware failed to attach user to request' });
  }

  const { artistName, bio, linkedSocials } = req.body;
  try {
    const updatedUser = await updateUserById(user.id, { artistName, bio, linkedSocials });
    // check if artistName has been updated and if so, update their beats
    if (artistName !== user.artistName) {
      // this axios request will be made a gRPC remote function call
      const updatedBeatsResponse = await axios.post(
        `${BEATS_HOST}/update-artist-name/${user.id}`,
        {
          artistName,
        },
        {
          withCredentials: true,
          headers: {
            Cookie: `sb-access-token=${token}`,
          },
        }
      );
    }
    console.log(updatedUser);
    return res.status(200).json({ message: 'user info successfully updated' });
  } catch (err) {
    console.error(err);
    return res.status(503).json(err);
  }
};

export const uploadAvatarHandler = async (req: Request, res: Response) => {
  const user = req.user;
  if (!user) {
    console.log('Middleware failed to attach user to request ');
    return res.status(400).json({ message: 'Middleware failed to attach user to request' });
  }

  const newAvatar = req.file;
  if (!newAvatar) {
    return res.status(400).json({ message: 'no file detected while updating avatar' });
  }

  try {
    const uploadAvatarRes = await uploadFileToS3(newAvatar);
    if (!uploadAvatarRes) {
      console.log('error uploading image file');
      return res.status(500).json('error uploading image');
    }
    const avatarKey = uploadAvatarRes.Key;
    const updateUserRes = updateUserById(user.id, { avatar: avatarKey });
    console.log(updateUserRes);
    return res.status(200).json({ message: 'avatar updated successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'an error occured while uploading your new avatar to storage' });
  }
};

// FOR TESTING PURPOSES ONLY - should be made a chron job
export const addCreditsHandler = async (req: Request, res: Response) => {
  const { creditsToAdd } = req.body;
  const userId = req.user?.id;
  if (!userId || !creditsToAdd) {
    return res.status(400);
  }
  try {
    const newBalance = await addCredits(userId, creditsToAdd);
    return res.status(200).json({ message: 'User credits added successfully', creditBalance: newBalance });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: err });
  }
};

export const subCreditsHandler = async (req: Request, res: Response) => {
  const { userId, creditsToSub } = req.body;
  if (!creditsToSub || !userId) {
    return res.status(400);
  }
  try {
    const newBalance = await subCredits(userId, creditsToSub);
    return res.status(200).json({ message: 'User credits subtracted successfully', creditBalance: newBalance });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err });
  }
};

export const getCreditsBalanceHandler = async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(400).json({ message: 'Middelware failed to attach user to request / there is no ID' });
  }
  const creditBalance = await getCreditsBalance(userId as string);
  return res.status(200).json({ creditBalance });
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
