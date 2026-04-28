import { FastifyRequest, FastifyReply } from 'fastify';
import { successResponse } from '../../lib/response';
import { getAuthUser } from '../../plugins/auth';
import { listBatchesSchema, reviewMappingSchema } from './upload.schema';
import * as uploadService from './upload.service';

export async function uploadHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = getAuthUser(request);
  const files = request.files();
  const result = await uploadService.uploadImages(user.teamId, user.userId, files);
  return reply.status(201).send(successResponse(result, 'Upload started'));
}

export async function listBatchesHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = getAuthUser(request);
  const query = listBatchesSchema.parse(request.query);
  const result = await uploadService.listBatches(user.teamId, query);
  return reply.send(successResponse(result));
}

export async function getBatchHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const user = getAuthUser(request);
  const result = await uploadService.getBatch(user.teamId, request.params.id);
  return reply.send(successResponse(result));
}

export async function getReviewHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const user = getAuthUser(request);
  const result = await uploadService.getReviewData(user.teamId, request.params.id);
  return reply.send(successResponse(result));
}

export async function submitReviewHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const user = getAuthUser(request);
  const input = reviewMappingSchema.parse(request.body);
  const result = await uploadService.submitReview(user.teamId, request.params.id, input);
  return reply.send(successResponse(result, 'Review submitted'));
}

export async function progressHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const user = getAuthUser(request);
  const batchId = request.params.id;

  reply.raw.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });

  const interval = setInterval(async () => {
    try {
      const progress = await uploadService.getBatchProgress(user.teamId, batchId);
      reply.raw.write(`data: ${JSON.stringify(progress)}\n\n`);

      if (progress.status === 'review' || progress.status === 'completed' || progress.status === 'failed') {
        reply.raw.write(`event: done\ndata: ${JSON.stringify(progress)}\n\n`);
        clearInterval(interval);
        reply.raw.end();
      }
    } catch {
      clearInterval(interval);
      reply.raw.end();
    }
  }, 1000);

  request.raw.on('close', () => {
    clearInterval(interval);
  });
}
