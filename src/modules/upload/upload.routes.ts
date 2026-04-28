import { FastifyInstance } from 'fastify';
import { authenticate } from '../../plugins/auth';
import {
  uploadHandler,
  listBatchesHandler,
  getBatchHandler,
  getReviewHandler,
  submitReviewHandler,
  progressHandler,
} from './upload.controller';

const paramSchema = {
  type: 'object' as const,
  properties: { id: { type: 'string' as const } },
};

export default async function uploadRoutes(app: FastifyInstance) {
  app.addHook('onRequest', authenticate);

  app.post('/api/uploads', {
    schema: {
      tags: ['Upload'],
      summary: 'Upload images and start background processing',
      security: [{ Bearer: [] }],
      consumes: ['multipart/form-data'],
    },
    handler: uploadHandler,
  });

  app.get('/api/uploads/batches', {
    schema: {
      tags: ['Upload'],
      summary: 'List upload batches',
      security: [{ Bearer: [] }],
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', default: 1 },
          limit: { type: 'integer', default: 10 },
          status: { type: 'string', enum: ['uploading', 'processing', 'review', 'completed', 'failed'] },
        },
      },
    },
    handler: listBatchesHandler,
  });

  app.get('/api/uploads/batches/:id', {
    schema: {
      tags: ['Upload'],
      summary: 'Get batch detail with images',
      security: [{ Bearer: [] }],
      params: paramSchema,
    },
    handler: getBatchHandler,
  });

  app.get('/api/uploads/batches/:id/review', {
    schema: {
      tags: ['Upload'],
      summary: 'Get review data: faces with auto-mappings',
      security: [{ Bearer: [] }],
      params: paramSchema,
    },
    handler: getReviewHandler,
  });

  app.put('/api/uploads/batches/:id/review', {
    schema: {
      tags: ['Upload'],
      summary: 'Submit review: confirm/adjust/create mappings',
      security: [{ Bearer: [] }],
      params: paramSchema,
    },
    handler: submitReviewHandler,
  });

  app.get('/api/uploads/batches/:id/progress', {
    schema: {
      tags: ['Upload'],
      summary: 'SSE: real-time batch processing progress',
      security: [{ Bearer: [] }],
      params: paramSchema,
    },
    handler: progressHandler,
  });
}
