import { Request } from "express";

export enum LeaveType {
  VACATION = 'annual',
  SICK = 'sick',
  PERSONAL = 'personal',
  MATERNITY = 'maternity',
  PATERNITY = 'paternity',
  BEREAVEMENT = 'bereavement',
  OTHER = 'other'
}


export enum LeaveStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

export interface ILeave {
  id: number;
  leaveType: LeaveType;
  duration: number; 
  startDate: Date;
  endDate: Date;
  reason: string;
  documents?: IDocument[]; 
  status: LeaveStatus;
  employeeId: number;
  position : string;
  createdAt?: Date;
  updatedAt?: Date;
}
export interface IDocument {
  publicId: string;
  url: string;
}

export interface RequestWithFile extends Request {
  file: Express.Multer.File;
}
