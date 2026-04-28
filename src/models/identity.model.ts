import { Schema, model, Document, Types } from 'mongoose';

export interface IIdentity extends Document {
  _id: Types.ObjectId;
  teamId: Types.ObjectId;
  name: string;
  description?: string;
  avatarFaceId?: Types.ObjectId;
  facesCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const identitySchema = new Schema<IIdentity>(
  {
    teamId: { type: Schema.Types.ObjectId, ref: 'Team', required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    avatarFaceId: { type: Schema.Types.ObjectId, ref: 'Face' },
    facesCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

identitySchema.index({ teamId: 1, name: 1 });

export const Identity = model<IIdentity>('Identity', identitySchema);
