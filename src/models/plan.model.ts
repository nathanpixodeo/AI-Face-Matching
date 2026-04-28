import { Schema, model, Document, Types } from 'mongoose';
import { PlanName, PlanLimits } from '../types';

export interface IPlan extends Document {
  _id: Types.ObjectId;
  name: PlanName;
  limits: PlanLimits;
  price: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const planSchema = new Schema<IPlan>(
  {
    name: { type: String, enum: ['free', 'pro', 'enterprise'], required: true, unique: true },
    limits: {
      maxIdentities: { type: Number, required: true },
      maxImages: { type: Number, required: true },
      maxMatchesPerDay: { type: Number, required: true },
      maxApiCallsPerDay: { type: Number, required: true },
      maxStorageMB: { type: Number, required: true },
      maxTeamMembers: { type: Number, required: true },
      maxFilesPerUpload: { type: Number, required: true },
    },
    price: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const Plan = model<IPlan>('Plan', planSchema);
