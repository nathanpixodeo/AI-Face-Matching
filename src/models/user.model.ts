import { Schema, model, Document, Types } from 'mongoose';
import { AccountStatus, UserRole } from '../types';

export interface IUser extends Document {
  _id: Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  teamId: Types.ObjectId;
  role: UserRole;
  isSuperadmin: boolean;
  status: AccountStatus;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    teamId: { type: Schema.Types.ObjectId, ref: 'Team', index: true },
    role: { type: String, enum: ['owner', 'admin', 'member'], default: 'member' },
    isSuperadmin: { type: Boolean, default: false, index: true },
    status: { type: String, enum: ['active', 'suspended'], default: 'active', index: true },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
  },
  { timestamps: true },
);

export const User = model<IUser>('User', userSchema);
