import { Schema, model, Document, Types } from 'mongoose';
import { BoundingBox, MappingStatus, ModelUsed } from '../types';

export interface IFace extends Document {
  _id: Types.ObjectId;
  teamId: Types.ObjectId;
  imageId: Types.ObjectId;
  identityId: Types.ObjectId | null;
  embedding: number[];
  bbox: BoundingBox;
  gender: 'male' | 'female';
  genderProbability: number;
  age: number;
  qualityScore: number;
  modelUsed: ModelUsed;
  mappingStatus: MappingStatus;
  mappingConfidence: number;
  createdAt: Date;
  updatedAt: Date;
}

const faceSchema = new Schema<IFace>(
  {
    teamId: { type: Schema.Types.ObjectId, ref: 'Team', required: true, index: true },
    imageId: { type: Schema.Types.ObjectId, ref: 'Image', required: true, index: true },
    identityId: { type: Schema.Types.ObjectId, ref: 'Identity', default: null, index: true },
    embedding: { type: [Number], required: true },
    bbox: {
      x: { type: Number, required: true },
      y: { type: Number, required: true },
      width: { type: Number, required: true },
      height: { type: Number, required: true },
    },
    gender: { type: String, enum: ['male', 'female'] },
    genderProbability: { type: Number },
    age: { type: Number },
    qualityScore: { type: Number },
    modelUsed: { type: String, enum: ['adaface', 'deepface'], required: true },
    mappingStatus: {
      type: String,
      enum: ['auto', 'confirmed', 'manual', 'unmatched'],
      default: 'unmatched',
    },
    mappingConfidence: { type: Number, default: 0 },
  },
  { timestamps: true },
);

faceSchema.index({ teamId: 1, identityId: 1 });
faceSchema.index({ teamId: 1, mappingStatus: 1 });

export const Face = model<IFace>('Face', faceSchema);
