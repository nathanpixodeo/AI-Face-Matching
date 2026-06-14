import { FastifyInstance } from 'fastify';
import { registerHandler, loginHandler, forgotPasswordHandler, resetPasswordHandler } from './auth.controller';

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

  app.post('/api/auth/forgot-password', {
    schema: {
      tags: ['Auth'],
      summary: 'Request password reset token',
      body: {
        type: 'object',
        required: ['email'],
        properties: {
          email: { type: 'string', format: 'email' },
        },
      },
    },
    handler: forgotPasswordHandler,
  });

  app.post('/api/auth/reset-password', {
    schema: {
      tags: ['Auth'],
      summary: 'Reset password using token',
      body: {
        type: 'object',
        required: ['token', 'password'],
        properties: {
          token: { type: 'string' },
          password: { type: 'string', minLength: 8 },
        },
      },
    },
    handler: resetPasswordHandler,
  });
}
