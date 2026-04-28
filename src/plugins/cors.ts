import fp from 'fastify-plugin';
import cors, { FastifyCorsOptions } from '@fastify/cors';
import { env } from '../config/env';

export default fp(async (app) => {
  const options: FastifyCorsOptions =
    env.CORS_ORIGINS[0] === '*'
      ? { origin: true }
      : { origin: env.CORS_ORIGINS, credentials: true };

  await app.register(cors, options);
});
