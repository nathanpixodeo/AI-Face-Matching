import { Queue } from 'bullmq';
import { getRedisConnection } from '../config/redis';

let faceProcessQueue: Queue | null = null;

export function getFaceProcessQueue(): Queue {
  if (!faceProcessQueue) {
    faceProcessQueue = new Queue('face-process', {
      connection: getRedisConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 500 },
      },
    });
  }
  return faceProcessQueue;
}

export async function addFaceDetectJob(batchId: string, teamId: string): Promise<string> {
  const queue = getFaceProcessQueue();
  const job = await queue.add(
    'detect-batch',
    { batchId, teamId },
    { jobId: `batch-${batchId}` },
  );
  return job.id ?? batchId;
}
