import { FastifyInstance } from 'fastify';
import { authenticate } from '../../plugins/auth';
import {
  createWorkspaceHandler,
  listWorkspacesHandler,
  getWorkspaceHandler,
  updateWorkspaceHandler,
  deleteWorkspaceHandler,
} from './workspace.controller';

const paramSchema = {
  type: 'object' as const,
  properties: { id: { type: 'string' as const } },
};

export default async function workspaceRoutes(app: FastifyInstance) {
  app.addHook('onRequest', authenticate);

  app.post('/api/workspaces', {
    schema: {
      tags: ['Workspace'],
      summary: 'Create a new workspace',
      security: [{ Bearer: [] }],
      body: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string' },
          notes: { type: 'string' },
        },
      },
    },
    handler: createWorkspaceHandler,
  });

  app.get('/api/workspaces', {
    schema: {
      tags: ['Workspace'],
      summary: 'List workspaces in team',
      security: [{ Bearer: [] }],
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', default: 1 },
          limit: { type: 'integer', default: 20 },
          status: { type: 'string', enum: ['true', 'false'] },
        },
      },
    },
    handler: listWorkspacesHandler,
  });

  app.get('/api/workspaces/:id', {
    schema: {
      tags: ['Workspace'],
      summary: 'Get workspace detail',
      security: [{ Bearer: [] }],
      params: paramSchema,
    },
    handler: getWorkspaceHandler,
  });

  app.put('/api/workspaces/:id', {
    schema: {
      tags: ['Workspace'],
      summary: 'Update workspace',
      security: [{ Bearer: [] }],
      params: paramSchema,
      body: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          notes: { type: 'string' },
          status: { type: 'boolean' },
        },
      },
    },
    handler: updateWorkspaceHandler,
  });

  app.delete('/api/workspaces/:id', {
    schema: {
      tags: ['Workspace'],
      summary: 'Delete workspace',
      security: [{ Bearer: [] }],
      params: paramSchema,
    },
    handler: deleteWorkspaceHandler,
  });
}
