import { Face } from '../models/face.model';
import { Identity } from '../models/identity.model';

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

function similarityToPercent(similarity: number): number {
  return Math.round(Math.max(0, Math.min(100, similarity * 100)));
}

const MATCH_THRESHOLD = 0.4;

export async function autoMapFaces(
  batchId: string,
  teamId: string,
): Promise<{ autoMapped: number; unmatched: number }> {
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

  const newFaces = await Face.find({
    teamId,
    imageId: { $in: await getImageIdsForBatch(batchId) },
    mappingStatus: 'unmatched',
  });

  let autoMapped = 0;
  let unmatched = 0;

  for (const face of newFaces) {
    let bestIdentityId: string | null = null;
    let bestSimilarity = 0;

    for (const [identityId, embeddings] of identityEmbeddings) {
      for (const emb of embeddings) {
        const sim = cosineSimilarity(face.embedding, emb);
        if (sim > bestSimilarity) {
          bestSimilarity = sim;
          bestIdentityId = identityId;
        }
      }
    }

    if (bestIdentityId && bestSimilarity >= MATCH_THRESHOLD) {
      await Face.findByIdAndUpdate(face._id, {
        identityId: bestIdentityId,
        mappingStatus: 'auto',
        mappingConfidence: similarityToPercent(bestSimilarity),
      });

      await Identity.findByIdAndUpdate(bestIdentityId, { $inc: { facesCount: 1 } });
      autoMapped++;
    } else {
      unmatched++;
    }
  }

  return { autoMapped, unmatched };
}

async function getImageIdsForBatch(batchId: string): Promise<string[]> {
  const { Image } = await import('../models/image.model');
  const images = await Image.find({ uploadBatchId: batchId }).select('_id');
  return images.map((img) => img._id.toString());
}
