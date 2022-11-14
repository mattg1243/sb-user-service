import { NextFunction, Request, Response } from 'express';
import { createUser } from '../services/User.service';
import { CreateUserInput } from '../database/schemas/User.schema';

export const indexHandler = (req: Request, res: Response, next: NextFunction) => {
  return res.status(200).json({ message: 'User service online!' });
};

export const registerUserHandler = async (req: Request<{}, {}, CreateUserInput>, res: Response, next: NextFunction) => {
  const { email, username, password } = req.body;

  try {
    const user = await createUser({
      email: email.toLowerCase(),
      username,
      password,
    });

    console.log(`  --- user registered : ${username}  ---  `);
    return res.status(200).json({ message: 'user registered succesfully', user });
  } catch (err: any) {
    if (err.code === '23505') {
      return res.status(403).json({ message: 'A user with this email / username already exists.' });
    }
    console.error(err);
    return res.status(500).json({ message: 'failed to create the user', err });
  }
};