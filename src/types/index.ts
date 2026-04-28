import { Types } from 'mongoose';

export type ObjectId = Types.ObjectId;

export type UserRole = 'owner' | 'admin' | 'member';

export type PlanName = 'free' | 'pro' | 'enterprise';

export type MappingStatus = 'auto' | 'confirmed' | 'manual' | 'unmatched';

export type UploadBatchStatus = 'uploading' | 'processing' | 'review' | 'completed' | 'failed';

export type ImageStatus = 'pending' | 'processing' | 'processed' | 'failed';

export type ModelUsed = 'adaface' | 'deepface';

export interface JwtPayload {
  userId: string;
  email: string;
  teamId: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PlanLimits {
  maxIdentities: number;
  maxImages: number;
  maxMatchesPerDay: number;
  maxApiCallsPerDay: number;
  maxStorageMB: number;
  maxTeamMembers: number;
  maxFilesPerUpload: number;
}

export interface TeamUsage {
  identitiesCount: number;
  imagesCount: number;
  matchesToday: number;
  apiCallsToday: number;
  storageUsedMB: number;
}
