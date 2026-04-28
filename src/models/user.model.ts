import { Schema, model, Document, Types } from 'mongoose';
import { UserRole } from '../types';

export interface IUser extends Document {
  _id: Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  teamId: Types.ObjectId;
  role: UserRole;
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
  },
  { timestamps: true },
);

export const User = model<IUser>('User', userSchema);
