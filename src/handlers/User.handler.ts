import { NextFunction, Request, Response } from 'express';
import { createUser, findUserByEmail } from '../services/User.service';
import { CreateUserInput } from '../database/schemas/User.schema';

export const indexHandler = async (req: Request<{}, {}, {}, { email: string }>, res: Response, next: NextFunction) => {
  if (!req.query) {
    return res.status(200).json({ message: 'User service online!' });
  } else {
    const email = req.query.email;
    try {
      const user = await findUserByEmail(email);
      console.log(user);
      if (!user) {
        return res.status(401).json({ message: 'No user was found' });
      }
      // create the response variable with only needed fields
      const userResponse = { id: user._id, email: user.email, username: user.username, password: user.password };
      return res.status(200).json(userResponse);
    } catch (err: any) {
      console.error(err.code);
      return res.status(401).json({ message: 'Invalid credentials' });
    }
  }
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
