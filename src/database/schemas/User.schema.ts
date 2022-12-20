import { object, string, TypeOf, z } from 'zod';

export const createUserSchema = object({
  body: object({
    email: string({
      required_error: 'Email is required',
    }).email('Invalid email address'),
    artistName: string({
      required_error: 'Artist name is required',
    }),
    password: string({
      required_error: 'Password is required',
    })
      .min(8, 'Password must be more than 8 characters')
      .max(32, 'Password must be less than 32 characters'),
  }),
});

export const loginUserSchema = object({
  body: object({
    email: string({
      required_error: 'Email is required',
    }).email('Invalid email address'),
    password: string({
      required_error: 'Please enter your password to login',
    }),
  }),
});

export type CreateUserInput = TypeOf<typeof createUserSchema>['body'];

export type LoginUserInput = TypeOf<typeof loginUserSchema>['body'];
