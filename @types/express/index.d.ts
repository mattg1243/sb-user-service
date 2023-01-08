type UserReqObj = {
  id: string;
  email: string;
  artistName: string;
};

declare global {
  namespace Express {
    export interface Request {
      user?: UserReqObj;
      token?: string;
    }
  }
}

export {};
