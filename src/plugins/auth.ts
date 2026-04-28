import fp from 'fastify-plugin';
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { UnauthorizedError } from '../lib/errors';
import { JwtPayload } from '../types';

function extractToken(request: FastifyRequest): string | null {
  const header = request.headers.authorization;
  if (!header) return null;
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) return null;
  return token;
}

function verifyToken(token: string): JwtPayload {
  try {
    return jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] }) as JwtPayload;
  } catch {
    throw new UnauthorizedError('Invalid or expired token');
  }
}

export async function authenticate(request: FastifyRequest, _reply: FastifyReply) {
  const token = extractToken(request);
  if (!token) {
    throw new UnauthorizedError('Missing authorization token');
  }
  request.user = verifyToken(token);
}

export function getAuthUser(request: FastifyRequest): JwtPayload {
  if (!request.user) {
    throw new UnauthorizedError('Not authenticated');
  }
  return request.user;
}

export default fp(async (app: FastifyInstance) => {
  app.decorateRequest('user', null);
});
