import { number, object, string, TypeOf } from 'zod';

export const createTransactionSchema = object({
  body: object({
    // will need to add credit amount when we add more license options
    // it defaults to 1 for now for all downloads
    purchasingUser: string(),
    sellingUser: string(),
  }),
});

export type CreateTransactionSchema = TypeOf<typeof createTransactionSchema>['body'];
