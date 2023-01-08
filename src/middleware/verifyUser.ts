import { Request, Response, NextFunction } from 'express';
import { verifyJwt } from '../jwt';

/**
 * A middleware function that verifies auth tokens and passes
 * the decoded user data to the route handler.
 */
export const verifyUser = (req: Request, res: Response, next: NextFunction) => {
  const token = req.header('Authorization') as string;
  if (!token) {
    return res.status(401).json({ message: 'No token detected.' });
  }

  const decodedToken = verifyJwt(token);
  if (!decodedToken) {
    return res.status(401).json({ message: 'Invalid/missing user credentials provided with request' });
  } else {
    req.user = decodedToken.user;
    req.token = token;
    next();
  }
};
