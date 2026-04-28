import { Schema, model, Document, Types } from 'mongoose';
import { UploadBatchStatus } from '../types';

export interface IUploadBatch extends Document {
  _id: Types.ObjectId;
  teamId: Types.ObjectId;
  uploadedBy: Types.ObjectId;
  totalImages: number;
  processedImages: number;
  totalFacesDetected: number;
  autoMapped: number;
  unmatched: number;
  status: UploadBatchStatus;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const uploadBatchSchema = new Schema<IUploadBatch>(
  {
    teamId: { type: Schema.Types.ObjectId, ref: 'Team', required: true, index: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    totalImages: { type: Number, required: true },
    processedImages: { type: Number, default: 0 },
    totalFacesDetected: { type: Number, default: 0 },
    autoMapped: { type: Number, default: 0 },
    unmatched: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['uploading', 'processing', 'review', 'completed', 'failed'],
      default: 'uploading',
    },
    completedAt: { type: Date },
  },
  { timestamps: true },
);

export const UploadBatch = model<IUploadBatch>('UploadBatch', uploadBatchSchema);
