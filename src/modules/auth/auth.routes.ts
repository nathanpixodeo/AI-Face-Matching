import { FastifyInstance } from 'fastify';
import { registerHandler, loginHandler } from './auth.controller';

export default async function authRoutes(app: FastifyInstance) {
  app.post('/api/auth/register', {
    schema: {
      tags: ['Auth'],
      summary: 'Register a new user and team',
      body: {
        type: 'object',
        required: ['firstName', 'lastName', 'email', 'password', 'teamName'],
        properties: {
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8 },
          teamName: { type: 'string' },
        },
      },
    },
    handler: registerHandler,
  });

  app.post('/api/auth/login', {
    schema: {
      tags: ['Auth'],
      summary: 'Login with email and password',
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' },
        },
      },
    },
    handler: loginHandler,
  });
}
