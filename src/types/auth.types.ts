import {Request} from "express";

export type TokenData = {

    accessToken : string;
    refreshToken : string;
    expiresAt : Date
}

export interface RequestWithUser extends Request {
    user : DataStoreInToken;
}

// types/user.interface.ts
export type IUser = {
    id?: number;
    email: string;
    password: string;
    role: string;
    fullName : string;
    phoneNumber?: string;
    employeeId?:string;
    position?:string;
    createdAt?: Date;
    updatedAt?: Date;
    otp?:string
  }
  
  // types/auth.interface.ts
  export type DataStoreInToken = {
    id: number;
    email: string;
    fullName: string
    role:string;
    phoneNumber:string;
    employeeId : string;
    position:string;
  }


  export type IUserLogin = {
    email: string;
    password: string
  }