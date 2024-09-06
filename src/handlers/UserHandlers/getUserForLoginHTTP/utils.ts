import { findUserByEmail, findUserByArtistName } from '../../../services/User.service';
import type StripeClient from '../../../utils/StripeClient';
import type User from '../../../database/models/User.entity';
import { FindOptionsSelect } from 'typeorm';

export const isEmail = (emailOrUsername: string): boolean => {
  const emailRe = /^[a-zA-Z0-9+_.-]+@[a-zA-Z0-9.-]+$/;
  if (emailRe.test(emailOrUsername)) {
    return true;
  } else {
    return false;
  }
};

export const getUser = async (emailOrUsername: string): Promise<User | null> => {
  let user: User | null;
  const selectConfig: FindOptionsSelect<User> = {
    _id: true,
    email: true,
    artistName: true,
    password: true,
    verified: true,
    stripeCustomerId: true,
    subTier: true,
  };

  const usingEmail = isEmail(emailOrUsername);
  if (usingEmail) {
    user = await findUserByEmail(emailOrUsername);
  } else {
    user = await findUserByArtistName(emailOrUsername, selectConfig);
  }
  return user;
};

export const getStripeCustomerId = async (stripeClient: StripeClient, user: User): Promise<string> => {
  if (user.stripeCustomerId.length < 6) {
    const stripeCustomer = await stripeClient.createCustomer(user.email);
    user.setCustomerId(stripeCustomer.id);
    await user.save();
    return stripeCustomer.id;
  } else {
    return user.stripeCustomerId;
  }
};

export const createResponse = (user: User, customerId: string) => {
  return {
    id: user._id,
    email: user.email,
    artistName: user.artistName,
    stripeCustomerId: customerId,
    password: user.password,
    isVerified: user.verified,
    subTier: user.subTier,
  };
};
