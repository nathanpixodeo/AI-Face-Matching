import 'fastify';
import { JwtPayload } from './index';

declare module 'fastify' {
  interface FastifyRequest {
    user: JwtPayload | null;
  }
}
