import { object, string, TypeOf, z } from 'zod';

export const createUserSchema = object({
  body: object({
    email: string({
      required_error: 'Email is required',
    })
      .trim()
      .email('Invalid email address')
      .max(320, { message: 'Email is too long to be valid' }),
    artistName: string({
      required_error: 'Artist name is required',
    })
      .trim()
      .min(6, { message: 'Artist Name must be at least 6 characters long' })
      .max(32, { message: 'Artist Name must be 32 characters or less' }),
    password: string({
      required_error: 'Password is required',
    })
      .trim()
      .min(8, 'Password must be more than 8 characters')
      .max(32, 'Password must be less than 32 characters'),
  }),
});

export const loginUserSchema = object({
  body: object({
    email: string({
      required_error: 'Email is required',
    })
      .trim()
      .email('Invalid email address')
      .max(320, { message: 'Email is too long to be valid' }),
    password: string({
      required_error: 'Please enter your password to login',
    })
      .trim()
      .min(8, 'Password must be more than 8 characters')
      .max(32, 'Password must be less than 32 characters'),
  }),
});

export const updateUserSchema = object({
  body: object({
    artistName: string()
      .trim()
      .min(6, { message: 'Artist Name must be at least 6 characters long' })
      .max(32, { message: 'Artist Name must be 32 characters or less' })
      .optional(),
    bio: string().trim().max(140, { message: 'Bio has a character limit of 128' }).optional(),
    linkedSocials: object({
      youtube: string().trim().max(1000).optional(),
      spotify: string().trim().max(1000).optional(),
      soundcloud: string().trim().max(1000).optional(),
      appleMusic: string().trim().max(1000).optional(),
      twitter: string().trim().max(25).optional(),
      instagram: string().trim().max(1000).optional(),
    }),
  }),
});

// TODO: add a schema for the upload avatar route

export const followSchema = object({
  body: object({
    userToFollow: string({ required_error: 'No userToFollow provided' }).max(300),
  }),
});

export const unfollowSchema = object({
  body: object({
    userToUnfollow: string({ required_error: 'No userToFollow provided' }).max(300),
  }),
});

export type CreateUserInput = TypeOf<typeof createUserSchema>['body'];
export type LoginUserInput = TypeOf<typeof loginUserSchema>['body'];
export type UpdateUserInput = TypeOf<typeof updateUserSchema>['body'];
export type FollowUserInput = TypeOf<typeof followSchema>['body'];
export type UnfollowUserInput = TypeOf<typeof unfollowSchema>['body'];
