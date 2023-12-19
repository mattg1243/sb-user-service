// not using zod here because this is strictly internal; no validation necessayr

export interface ICreatePayoutArgs {
  userId: string;
  downloads: number;
  amount: number;
  creditValue: number;
}
