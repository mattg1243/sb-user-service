import jwt from 'jsonwebtoken';

interface IDecodedToken {
  user: {
    id: string;
    email: string;
    artistName: string;
  };
  iat: number;
  exp: number;
}

// verify tokens
export const verifyJwt = (token: string): IDecodedToken | null => {
  if (!token) {
    console.log('No access token detected.');
    return null;
  }
  // this needs optimization
  let key = process.env.ACCESS_SECRET;
  // console.log('jwt key: \n', key);
  if (!key) key = '';
  try {
    const key64 = Buffer.from(key, 'base64').toString('ascii');
    const decoded = jwt.verify(token, key64) as IDecodedToken;

    return decoded;
  } catch (error) {
    console.log(error);
    return null;
  }
};
