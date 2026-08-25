import { FastifyInstance } from 'fastify';
import { authenticate, requireSuperadmin } from '../../plugins/auth';
import {
  getPlatformOverviewHandler,
  listPlatformTeamsHandler,
  listPlatformUsersHandler,
  updatePlatformTeamHandler,
  updatePlatformUserHandler,
} from './platform.controller';

const idParams = {
  type: 'object' as const,
  required: ['id'],
  properties: { id: { type: 'string' as const } },
};

export default async function platformRoutes(app: FastifyInstance) {
  app.addHook('onRequest', authenticate);
  app.addHook('onRequest', requireSuperadmin);

  app.get('/api/platform/overview', {
    schema: { tags: ['Platform'], summary: 'Get platform administration overview', security: [{ Bearer: [] }] },
    handler: getPlatformOverviewHandler,
  });

  app.get('/api/platform/teams', {
    schema: {
      tags: ['Platform'],
      summary: 'List teams across the platform',
      security: [{ Bearer: [] }],
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', default: 1 },
          limit: { type: 'integer', default: 25 },
          search: { type: 'string' },
          status: { type: 'string', enum: ['active', 'suspended'] },
        },
      },
    },
    handler: listPlatformTeamsHandler,
  });

  app.put('/api/platform/teams/:id', {
    schema: {
      tags: ['Platform'],
      summary: 'Update team status or plan',
      security: [{ Bearer: [] }],
      params: idParams,
      body: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['active', 'suspended'] },
          planName: { type: 'string', enum: ['free', 'pro', 'enterprise'] },
        },
      },
    },
    handler: updatePlatformTeamHandler,
  });

  app.get('/api/platform/users', {
    schema: {
      tags: ['Platform'],
      summary: 'List users across the platform',
      security: [{ Bearer: [] }],
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', default: 1 },
          limit: { type: 'integer', default: 25 },
          search: { type: 'string' },
          status: { type: 'string', enum: ['active', 'suspended'] },
        },
      },
    },
    handler: listPlatformUsersHandler,
  });

  app.put('/api/platform/users/:id', {
    schema: {
      tags: ['Platform'],
      summary: 'Update user account status',
      security: [{ Bearer: [] }],
      params: idParams,
      body: {
        type: 'object',
        required: ['status'],
        properties: { status: { type: 'string', enum: ['active', 'suspended'] } },
      },
    },
    handler: updatePlatformUserHandler,
  });
}
