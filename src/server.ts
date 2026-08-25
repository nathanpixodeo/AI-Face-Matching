import Fastify, { FastifyError, FastifyInstance } from 'fastify';
import { ZodError } from 'zod';
import mongoose from 'mongoose';
import { env } from './config/env';
import { AppError } from './lib/errors';
import { translateLegacyError } from './i18n/messages';

import corsPlugin from './plugins/cors';
import helmetPlugin from './plugins/helmet';
import rateLimitPlugin from './plugins/rate-limit';
import multipartPlugin from './plugins/multipart';
import swaggerPlugin from './plugins/swagger';
import staticPlugin from './plugins/static';
import authPlugin from './plugins/auth';
import i18nPlugin from './plugins/i18n';
import authRoutes from './modules/auth/auth.routes';
import teamRoutes from './modules/team/team.routes';
import identityRoutes from './modules/identity/identity.routes';
import uploadRoutes from './modules/upload/upload.routes';
import faceRoutes from './modules/face/face.routes';
import workspaceRoutes from './modules/area/workspace.routes';
import platformRoutes from './modules/platform/platform.routes';

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
  await app.register(i18nPlugin);
  await app.register(authPlugin);

  app.setErrorHandler((error: FastifyError | AppError | ZodError | mongoose.Error.CastError, request, reply) => {
    if ('validation' in error && Array.isArray(error.validation)) {
      return reply.status(400).send({
        success: false,
        data: null,
        message: request.t('error.validation'),
        details: error.validation.map((issue) => {
          const field = typeof issue.instancePath === 'string'
            ? issue.instancePath.replace(/^\//, '').replace(/\//g, '.') || 'request'
            : 'request';
          return { field, message: request.t('error.invalidField', { field }) };
        }),
      });
    }

    if (error instanceof ZodError) {
      return reply.status(400).send({
        success: false,
        data: null,
        message: request.t('error.validation'),
        details: error.errors.map((e) => ({
          field: e.path.join('.'),
          message: request.t('error.invalidField', { field: e.path.join('.') || 'request' }),
        })),
      });
    }

    if (error instanceof mongoose.Error.CastError) {
      return reply.status(400).send({
        success: false,
        data: null,
        message: request.t('error.invalidValue', { field: error.path, value: String(error.value) }),
      });
    }

    const statusCode = 'statusCode' in error ? (error.statusCode ?? 500) : 500;
    const errorCode = 'code' in error && typeof error.code === 'string' ? error.code : undefined;
    const message = statusCode >= 500
      ? request.t('error.internal')
      : translateLegacyError(request.locale, error.message, errorCode);

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

  // Route modules
  await app.register(authRoutes);
  await app.register(teamRoutes);
  await app.register(identityRoutes);
  await app.register(uploadRoutes);
  await app.register(faceRoutes);
  await app.register(workspaceRoutes);
  await app.register(platformRoutes);

  app.get('/api/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  return app;
}
