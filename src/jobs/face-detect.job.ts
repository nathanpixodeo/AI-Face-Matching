import { Worker, Job } from 'bullmq';
import fs from 'fs/promises';
import path from 'path';
import { getRedisConnection } from '../config/redis';
import { Image } from '../models/image.model';
import { Face } from '../models/face.model';
import { UploadBatch } from '../models/upload-batch.model';
import * as mlClient from '../lib/ml-client';
import { autoMapFaces } from './face-match.job';

interface DetectBatchData {
  batchId: string;
  teamId: string;
}

async function processBatch(job: Job<DetectBatchData>) {
  const { batchId, teamId } = job.data;

  await UploadBatch.findByIdAndUpdate(batchId, { status: 'processing' });

  const images = await Image.find({ uploadBatchId: batchId, status: 'pending' });
  let totalFaces = 0;

  for (let i = 0; i < images.length; i++) {
    const image = images[i];

    try {
      await Image.findByIdAndUpdate(image._id, { status: 'processing' });

      const imageBuffer = await fs.readFile(path.resolve(image.filePath));
      const result = await mlClient.analyze(imageBuffer);

      const faceDocs = result.faces.map((face) => ({
        teamId,
        imageId: image._id,
        identityId: null,
        embedding: face.embedding,
        bbox: {
          x: face.bbox.x1,
          y: face.bbox.y1,
          width: face.bbox.x2 - face.bbox.x1,
          height: face.bbox.y2 - face.bbox.y1,
        },
        gender: face.gender as 'male' | 'female',
        genderProbability: face.gender_probability,
        age: face.age,
        qualityScore: face.quality_score,
        modelUsed: face.model_used === 'adaface' ? 'adaface' as const : 'deepface' as const,
        mappingStatus: 'unmatched' as const,
        mappingConfidence: 0,
      }));

      if (faceDocs.length > 0) {
        await Face.insertMany(faceDocs);
      }

      totalFaces += result.count;

      await Image.findByIdAndUpdate(image._id, {
        status: 'processed',
        facesDetected: result.count,
      });

      await UploadBatch.findByIdAndUpdate(batchId, {
        $inc: { processedImages: 1, totalFacesDetected: result.count },
      });

      await job.updateProgress(Math.round(((i + 1) / images.length) * 100));
    } catch (err) {
      console.error(`Failed to process image ${image._id}:`, err);
      await Image.findByIdAndUpdate(image._id, { status: 'failed' });
      await UploadBatch.findByIdAndUpdate(batchId, { $inc: { processedImages: 1 } });
    }
  }

  const { autoMapped, unmatched } = await autoMapFaces(batchId, teamId);

  await UploadBatch.findByIdAndUpdate(batchId, {
    status: 'review',
    autoMapped,
    unmatched,
  });

  return { batchId, totalFaces, autoMapped, unmatched };
}

let worker: Worker | null = null;

export function startFaceDetectWorker(): Worker {
  if (worker) return worker;

  worker = new Worker<DetectBatchData>('face-process', processBatch, {
    connection: getRedisConnection(),
    concurrency: 2,
  });

  worker.on('completed', (job) => {
    console.log(`Batch ${job.data.batchId} processing completed`);
  });

  worker.on('failed', async (job, err) => {
    console.error(`Batch ${job?.data.batchId} processing failed:`, err);
    if (job) {
      await UploadBatch.findByIdAndUpdate(job.data.batchId, { status: 'failed' });
    }
  });

  return worker;
}

export async function stopFaceDetectWorker(): Promise<void> {
  if (worker) {
    await worker.close();
    worker = null;
  }
}
