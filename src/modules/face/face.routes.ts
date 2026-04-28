import { FastifyInstance } from 'fastify';
import { authenticate } from '../../plugins/auth';
import {
  matchHandler,
  listFacesHandler,
  getFaceHandler,
  statsHandler,
  listImagesHandler,
  getImageHandler,
  deleteImageHandler,
} from './face.controller';

const paramSchema = {
  type: 'object' as const,
  properties: { id: { type: 'string' as const } },
};

export default async function faceRoutes(app: FastifyInstance) {
  app.addHook('onRequest', authenticate);

  // Face match
  app.post('/api/faces/match', {
    schema: {
      tags: ['Face Match'],
      summary: 'Upload photo and find matching identities',
      security: [{ Bearer: [] }],
      consumes: ['multipart/form-data'],
    },
    handler: matchHandler,
  });

  // Face listing
  app.get('/api/faces', {
    schema: {
      tags: ['Face'],
      summary: 'List all faces in team',
      security: [{ Bearer: [] }],
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', default: 1 },
          limit: { type: 'integer', default: 20 },
          identityId: { type: 'string' },
          mappingStatus: { type: 'string', enum: ['auto', 'confirmed', 'manual', 'unmatched'] },
        },
      },
    },
    handler: listFacesHandler,
  });

  app.get('/api/faces/stats', {
    schema: {
      tags: ['Face'],
      summary: 'Get team face statistics',
      security: [{ Bearer: [] }],
    },
    handler: statsHandler,
  });

  app.get('/api/faces/:id', {
    schema: {
      tags: ['Face'],
      summary: 'Get face detail',
      security: [{ Bearer: [] }],
      params: paramSchema,
    },
    handler: getFaceHandler,
  });

  // Image library
  app.get('/api/images', {
    schema: {
      tags: ['Image Library'],
      summary: 'List images in team library',
      security: [{ Bearer: [] }],
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', default: 1 },
          limit: { type: 'integer', default: 20 },
          status: { type: 'string', enum: ['pending', 'processing', 'processed', 'failed'] },
        },
      },
    },
    handler: listImagesHandler,
  });

  app.get('/api/images/:id', {
    schema: {
      tags: ['Image Library'],
      summary: 'Get image detail with detected faces',
      security: [{ Bearer: [] }],
      params: paramSchema,
    },
    handler: getImageHandler,
  });

  app.delete('/api/images/:id', {
    schema: {
      tags: ['Image Library'],
      summary: 'Delete image and unlink faces',
      security: [{ Bearer: [] }],
      params: paramSchema,
    },
    handler: deleteImageHandler,
  });
}
