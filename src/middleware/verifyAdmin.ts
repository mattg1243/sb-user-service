import { Request, Response, NextFunction } from 'express';
import { verifyJwt } from '../jwt';
/**
 * Middleware for verifying requesting user has admin
 * privileges.
 */
export const verifyAdmin = (req: Request, res: Response, next: NextFunction) => {
  const token = req.header('Authorization') as string;
  const decodedToken = verifyJwt(token as string);
  // check if the decoded data matches the user
  if (
    // montana
    decodedToken?.user.id === 'c690083b-4597-478a-9e15-68c61789807c' ||
    // matt - prod
    decodedToken?.user.id === 'ff4f5c71-f719-4455-8d54-8f4ff158acbb' ||
    // matt - dev
    decodedToken?.user.id === '2f4f569c-d3ec-4329-a7a9-e656028d3ed0'
  ) {
    req.user = decodedToken.user;
    req.token = token;
    next();
  } else {
    return res.status(401).send();
  }
};
