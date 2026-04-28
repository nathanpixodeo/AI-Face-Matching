import { FastifyInstance } from 'fastify';
import { authenticate } from '../../plugins/auth';
import {
  getTeamHandler,
  updateTeamHandler,
  getMembersHandler,
  addMemberHandler,
  updateMemberHandler,
  removeMemberHandler,
  upgradePlanHandler,
} from './team.controller';

export default async function teamRoutes(app: FastifyInstance) {
  app.addHook('onRequest', authenticate);

  app.get('/api/team', {
    schema: { tags: ['Team'], summary: 'Get current team info', security: [{ Bearer: [] }] },
    handler: getTeamHandler,
  });

  app.put('/api/team', {
    schema: {
      tags: ['Team'],
      summary: 'Update team name',
      security: [{ Bearer: [] }],
      body: {
        type: 'object',
        required: ['name'],
        properties: { name: { type: 'string' } },
      },
    },
    handler: updateTeamHandler,
  });

  app.get('/api/team/members', {
    schema: { tags: ['Team'], summary: 'List team members', security: [{ Bearer: [] }] },
    handler: getMembersHandler,
  });

  app.post('/api/team/members', {
    schema: {
      tags: ['Team'],
      summary: 'Add team member',
      security: [{ Bearer: [] }],
      body: {
        type: 'object',
        required: ['email'],
        properties: {
          email: { type: 'string', format: 'email' },
          role: { type: 'string', enum: ['admin', 'member'] },
        },
      },
    },
    handler: addMemberHandler,
  });

  app.put('/api/team/members/:id', {
    schema: {
      tags: ['Team'],
      summary: 'Update member role',
      security: [{ Bearer: [] }],
      params: {
        type: 'object',
        properties: { id: { type: 'string' } },
      },
      body: {
        type: 'object',
        required: ['role'],
        properties: { role: { type: 'string', enum: ['admin', 'member'] } },
      },
    },
    handler: updateMemberHandler,
  });

  app.delete('/api/team/members/:id', {
    schema: {
      tags: ['Team'],
      summary: 'Remove team member',
      security: [{ Bearer: [] }],
      params: {
        type: 'object',
        properties: { id: { type: 'string' } },
      },
    },
    handler: removeMemberHandler,
  });

  app.put('/api/team/plan', {
    schema: {
      tags: ['Team'],
      summary: 'Upgrade or change plan',
      security: [{ Bearer: [] }],
      body: {
        type: 'object',
        required: ['planName'],
        properties: { planName: { type: 'string', enum: ['free', 'pro', 'enterprise'] } },
      },
    },
    handler: upgradePlanHandler,
  });
}
