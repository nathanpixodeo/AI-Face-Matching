import Fastify, { FastifyError, FastifyInstance } from 'fastify';
import { env } from './config/env';
import { AppError } from './lib/errors';

import corsPlugin from './plugins/cors';
import helmetPlugin from './plugins/helmet';
import rateLimitPlugin from './plugins/rate-limit';
import multipartPlugin from './plugins/multipart';
import swaggerPlugin from './plugins/swagger';
import staticPlugin from './plugins/static';
import authPlugin from './plugins/auth';
import authRoutes from './modules/auth/auth.routes';
import teamRoutes from './modules/team/team.routes';
import identityRoutes from './modules/identity/identity.routes';
import uploadRoutes from './modules/upload/upload.routes';
import faceRoutes from './modules/face/face.routes';
import workspaceRoutes from './modules/area/workspace.routes';

export async function buildServer(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: env.NODE_ENV === 'production' ? 'info' : 'debug',
      transport:
        env.NODE_ENV === 'development'
          ? { target: 'pino-pretty', options: { colorize: true } }
          : undefined,
    },
  });

  // Plugins
  await app.register(corsPlugin);
  await app.register(helmetPlugin);
  await app.register(rateLimitPlugin);
  await app.register(multipartPlugin);
  await app.register(swaggerPlugin);
  await app.register(staticPlugin);
  await app.register(authPlugin);

  // Route modules
  await app.register(authRoutes);
  await app.register(teamRoutes);
  await app.register(identityRoutes);
  await app.register(uploadRoutes);
  await app.register(faceRoutes);
  await app.register(workspaceRoutes);

  app.get('/api/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  app.setErrorHandler((error: FastifyError | AppError, request, reply) => {
    const statusCode = 'statusCode' in error ? (error.statusCode ?? 500) : 500;
    const message = statusCode >= 500 ? 'Internal server error' : error.message;

    if (statusCode >= 500) {
      app.log.error(error);
    } else {
      app.log.warn({ err: error.message, url: request.url }, 'Client error');
    }

    reply.status(statusCode).send({
      success: false,
      data: null,
      message,
    });
  });

  return app;
}
