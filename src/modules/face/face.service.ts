import { MultipartFile } from '@fastify/multipart';
import { Face } from '../../models/face.model';
import { Image } from '../../models/image.model';
import { Identity } from '../../models/identity.model';
import { Team } from '../../models/team.model';
import { NotFoundError } from '../../lib/errors';
import { checkPlanLimit, incrementUsage } from '../team/plan-limit';
import * as mlClient from '../../lib/ml-client';
import { deleteFile } from '../../lib/file-storage';
import { ListFacesQuery, ListImagesQuery } from './face.schema';

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

const MATCH_THRESHOLD = 0.4;

export async function matchFace(teamId: string, file: MultipartFile) {
  await checkPlanLimit(teamId, 'maxMatchesPerDay');

  const buffer = await file.toBuffer();
  const embedResult = await mlClient.analyze(buffer);

  if (embedResult.count === 0) {
    return { query: null, matches: [] };
  }

  const queryFace = embedResult.faces[0];
  const queryEmbedding = queryFace.embedding;

  const confirmedFaces = await Face.find({
    teamId,
    identityId: { $ne: null },
    mappingStatus: { $in: ['confirmed', 'manual'] },
  }).select('embedding identityId');

  const identityScores = new Map<string, number>();

  for (const face of confirmedFaces) {
    const sim = cosineSimilarity(queryEmbedding, face.embedding);
    const idStr = face.identityId!.toString();
    const current = identityScores.get(idStr) ?? 0;
    if (sim > current) {
      identityScores.set(idStr, sim);
    }
  }

  const matchEntries = [...identityScores.entries()]
    .filter(([, sim]) => sim >= MATCH_THRESHOLD)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const matches = await Promise.all(
    matchEntries.map(async ([identityId, similarity]) => {
      const identity = await Identity.findById(identityId).select('name description facesCount');
      return {
        identity: identity
          ? {
              id: identity._id.toString(),
              name: identity.name,
              description: identity.description,
              facesCount: identity.facesCount,
            }
          : null,
        similarity: Math.round(similarity * 100),
      };
    }),
  );

  await incrementUsage(teamId, 'maxMatchesPerDay');

  return {
    query: {
      bbox: {
        x: queryFace.bbox.x1,
        y: queryFace.bbox.y1,
        width: queryFace.bbox.x2 - queryFace.bbox.x1,
        height: queryFace.bbox.y2 - queryFace.bbox.y1,
      },
      age: queryFace.age,
      gender: queryFace.gender,
    },
    matches: matches.filter((m) => m.identity !== null),
  };
}

export async function listFaces(teamId: string, query: ListFacesQuery) {
  const filter: Record<string, unknown> = { teamId };
  if (query.identityId) filter.identityId = query.identityId;
  if (query.mappingStatus) filter.mappingStatus = query.mappingStatus;

  const skip = (query.page - 1) * query.limit;
  const [faces, total] = await Promise.all([
    Face.find(filter)
      .select('-embedding')
      .populate('imageId', 'filePath originalName')
      .populate('identityId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(query.limit),
    Face.countDocuments(filter),
  ]);

  return {
    items: faces.map((f) => ({
      id: f._id.toString(),
      image: f.imageId,
      identity: f.identityId,
      bbox: f.bbox,
      gender: f.gender,
      age: f.age,
      qualityScore: f.qualityScore,
      modelUsed: f.modelUsed,
      mappingStatus: f.mappingStatus,
      mappingConfidence: f.mappingConfidence,
      createdAt: f.createdAt,
    })),
    total,
    page: query.page,
    totalPages: Math.ceil(total / query.limit),
  };
}

export async function getFace(teamId: string, faceId: string) {
  const face = await Face.findOne({ _id: faceId, teamId })
    .select('-embedding')
    .populate('imageId', 'filePath originalName')
    .populate('identityId', 'name description');
  if (!face) throw new NotFoundError('Face', faceId);

  return {
    id: face._id.toString(),
    image: face.imageId,
    identity: face.identityId,
    bbox: face.bbox,
    gender: face.gender,
    genderProbability: face.genderProbability,
    age: face.age,
    qualityScore: face.qualityScore,
    modelUsed: face.modelUsed,
    mappingStatus: face.mappingStatus,
    mappingConfidence: face.mappingConfidence,
    createdAt: face.createdAt,
  };
}

export async function getFaceStats(teamId: string) {
  const [totalFaces, totalIdentities, totalImages, statusCounts, team] = await Promise.all([
    Face.countDocuments({ teamId }),
    Identity.countDocuments({ teamId }),
    Image.countDocuments({ teamId }),
    Face.aggregate([
      { $match: { teamId: { $exists: true } } },
      { $group: { _id: '$mappingStatus', count: { $sum: 1 } } },
    ]),
    Team.findById(teamId).select('usage'),
  ]);

  const byStatus: Record<string, number> = {};
  for (const s of statusCounts) {
    byStatus[s._id] = s.count;
  }

  return {
    totalFaces,
    totalIdentities,
    totalImages,
    storageUsedMB: team?.usage.storageUsedMB ?? 0,
    byMappingStatus: {
      auto: byStatus['auto'] ?? 0,
      confirmed: byStatus['confirmed'] ?? 0,
      manual: byStatus['manual'] ?? 0,
      unmatched: byStatus['unmatched'] ?? 0,
    },
  };
}

export async function listImages(teamId: string, query: ListImagesQuery) {
  const filter: Record<string, unknown> = { teamId };
  if (query.status) filter.status = query.status;

  const skip = (query.page - 1) * query.limit;
  const [images, total] = await Promise.all([
    Image.find(filter).sort({ createdAt: -1 }).skip(skip).limit(query.limit),
    Image.countDocuments(filter),
  ]);

  return {
    items: images.map((img) => ({
      id: img._id.toString(),
      filePath: img.filePath,
      originalName: img.originalName,
      mimeType: img.mimeType,
      sizeBytes: img.sizeBytes,
      facesDetected: img.facesDetected,
      status: img.status,
      createdAt: img.createdAt,
    })),
    total,
    page: query.page,
    totalPages: Math.ceil(total / query.limit),
  };
}

export async function getImage(teamId: string, imageId: string) {
  const image = await Image.findOne({ _id: imageId, teamId });
  if (!image) throw new NotFoundError('Image', imageId);

  const faces = await Face.find({ imageId: image._id })
    .select('-embedding')
    .populate('identityId', 'name');

  return {
    id: image._id.toString(),
    filePath: image.filePath,
    originalName: image.originalName,
    mimeType: image.mimeType,
    sizeBytes: image.sizeBytes,
    facesDetected: image.facesDetected,
    status: image.status,
    createdAt: image.createdAt,
    faces: faces.map((f) => ({
      id: f._id.toString(),
      identity: f.identityId,
      bbox: f.bbox,
      gender: f.gender,
      age: f.age,
      mappingStatus: f.mappingStatus,
      mappingConfidence: f.mappingConfidence,
    })),
  };
}

export async function deleteImage(teamId: string, imageId: string) {
  const image = await Image.findOne({ _id: imageId, teamId });
  if (!image) throw new NotFoundError('Image', imageId);

  const faces = await Face.find({ imageId: image._id });
  for (const face of faces) {
    if (face.identityId) {
      await Identity.findByIdAndUpdate(face.identityId, { $inc: { facesCount: -1 } });
    }
  }

  await Face.deleteMany({ imageId: image._id });
  await deleteFile(image.filePath);
  await Image.deleteOne({ _id: image._id });
}
