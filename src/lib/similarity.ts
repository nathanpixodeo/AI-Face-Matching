import { Face } from '../models/face.model';

export function cosineSimilarity(a: number[], b: number[]): number {
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

export function similarityToPercent(similarity: number): number {
  return Math.round(Math.max(0, Math.min(100, similarity * 100)));
}

export const FACE_MATCH_THRESHOLD = 0.4;

export async function getConfirmedFaceEmbeddings(teamId: string) {
  const confirmedFaces = await Face.find({
    teamId,
    identityId: { $ne: null },
    mappingStatus: { $in: ['confirmed', 'manual'] },
  }).select('embedding identityId');

  const identityEmbeddings = new Map<string, number[][]>();
  for (const face of confirmedFaces) {
    const idStr = face.identityId!.toString();
    if (!identityEmbeddings.has(idStr)) {
      identityEmbeddings.set(idStr, []);
    }
    identityEmbeddings.get(idStr)!.push(face.embedding);
  }

  return identityEmbeddings;
}
