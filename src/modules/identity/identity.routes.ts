import { FastifyInstance } from 'fastify';
import { authenticate } from '../../plugins/auth';
import {
  createIdentityHandler,
  listIdentitiesHandler,
  getIdentityHandler,
  updateIdentityHandler,
  deleteIdentityHandler,
  getIdentityFacesHandler,
} from './identity.controller';

const paramSchema = {
  type: 'object' as const,
  properties: { id: { type: 'string' as const } },
};

export default async function identityRoutes(app: FastifyInstance) {
  app.addHook('onRequest', authenticate);

  app.post('/api/identities', {
    schema: {
      tags: ['Identity'],
      summary: 'Create a new identity (known person)',
      security: [{ Bearer: [] }],
      body: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
        },
      },
    },
    handler: createIdentityHandler,
  });

  app.get('/api/identities', {
    schema: {
      tags: ['Identity'],
      summary: 'List identities in team',
      security: [{ Bearer: [] }],
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', default: 1 },
          limit: { type: 'integer', default: 20 },
          search: { type: 'string' },
        },
      },
    },
    handler: listIdentitiesHandler,
  });

  app.get('/api/identities/:id', {
    schema: {
      tags: ['Identity'],
      summary: 'Get identity detail',
      security: [{ Bearer: [] }],
      params: paramSchema,
    },
    handler: getIdentityHandler,
  });

  app.put('/api/identities/:id', {
    schema: {
      tags: ['Identity'],
      summary: 'Update identity',
      security: [{ Bearer: [] }],
      params: paramSchema,
      body: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
        },
      },
    },
    handler: updateIdentityHandler,
  });

  app.delete('/api/identities/:id', {
    schema: {
      tags: ['Identity'],
      summary: 'Delete identity and unlink faces',
      security: [{ Bearer: [] }],
      params: paramSchema,
    },
    handler: deleteIdentityHandler,
  });

  app.get('/api/identities/:id/faces', {
    schema: {
      tags: ['Identity'],
      summary: 'Get all faces linked to identity',
      security: [{ Bearer: [] }],
      params: paramSchema,
    },
    handler: getIdentityFacesHandler,
  });
}
