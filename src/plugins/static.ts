import fp from 'fastify-plugin';
import fastifyStatic from '@fastify/static';
import path from 'path';
import { env } from '../config/env';

export default fp(async (app) => {
  const uploadsDir = path.resolve(env.UPLOAD_DIR);

  await app.register(fastifyStatic, {
    root: uploadsDir,
    prefix: '/api/uploads/file/',
    decorateReply: false,
  });
});
