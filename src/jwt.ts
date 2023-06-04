import jwt, { SignOptions } from 'jsonwebtoken';

interface IDecodedToken {
  user: {
    id: string;
    email: string;
    artistName: string;
    isVerified: boolean;
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

// sign tokens
// USED FOR TESTING ONLY
export const signJwt = (
  payload: Object,
  keyName: 'ACCESS_PRIVATE_KEY' | 'REFRESH_PRIVATE_KEY',
  options: SignOptions
) => {
  // this needs optimization
  let key = keyName === 'ACCESS_PRIVATE_KEY' ? process.env.ACCESS_PRIVATE_KEY : process.env.REFRESH_PRIVATE_KEY;
  if (!key) key = '';

  const privateKey = Buffer.from(key, 'base64').toString('ascii');
  return jwt.sign(payload, privateKey, {
    ...(options && options),
    algorithm: 'HS256',
  });
};
