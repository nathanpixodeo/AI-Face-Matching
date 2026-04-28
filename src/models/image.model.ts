import { Schema, model, Document, Types } from 'mongoose';
import { ImageStatus } from '../types';

export interface IImage extends Document {
  _id: Types.ObjectId;
  teamId: Types.ObjectId;
  uploadBatchId: Types.ObjectId;
  filePath: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  facesDetected: number;
  status: ImageStatus;
  uploadedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const imageSchema = new Schema<IImage>(
  {
    teamId: { type: Schema.Types.ObjectId, ref: 'Team', required: true, index: true },
    uploadBatchId: { type: Schema.Types.ObjectId, ref: 'UploadBatch', required: true, index: true },
    filePath: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    sizeBytes: { type: Number, required: true },
    facesDetected: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['pending', 'processing', 'processed', 'failed'],
      default: 'pending',
    },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

export const Image = model<IImage>('Image', imageSchema);
