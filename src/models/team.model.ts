import { Schema, model, Document, Types } from 'mongoose';
import { TeamUsage } from '../types';

export interface ITeam extends Document {
  _id: Types.ObjectId;
  name: string;
  ownerId: Types.ObjectId;
  planId: Types.ObjectId;
  usage: TeamUsage;
  createdAt: Date;
  updatedAt: Date;
}

const teamSchema = new Schema<ITeam>(
  {
    name: { type: String, required: true, trim: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    planId: { type: Schema.Types.ObjectId, ref: 'Plan', required: true },
    usage: {
      identitiesCount: { type: Number, default: 0 },
      imagesCount: { type: Number, default: 0 },
      matchesToday: { type: Number, default: 0 },
      apiCallsToday: { type: Number, default: 0 },
      storageUsedMB: { type: Number, default: 0 },
    },
  },
  { timestamps: true },
);

export const Team = model<ITeam>('Team', teamSchema);
