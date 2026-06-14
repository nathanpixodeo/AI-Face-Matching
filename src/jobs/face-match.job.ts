import { Face } from '../models/face.model';
import { Identity } from '../models/identity.model';
import { Image } from '../models/image.model';
import { cosineSimilarity, similarityToPercent, FACE_MATCH_THRESHOLD, getConfirmedFaceEmbeddings } from '../lib/similarity';

export async function autoMapFaces(
  batchId: string,
  teamId: string,
): Promise<{ autoMapped: number; unmatched: number }> {
  const identityEmbeddings = await getConfirmedFaceEmbeddings(teamId);

  const imageIds = await getImageIdsForBatch(batchId);
  const newFaces = await Face.find({
    teamId,
    imageId: { $in: imageIds },
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

    if (bestIdentityId && bestSimilarity >= FACE_MATCH_THRESHOLD) {
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
  const images = await Image.find({ uploadBatchId: batchId }).select('_id');
  return images.map((img) => img._id.toString());
}
