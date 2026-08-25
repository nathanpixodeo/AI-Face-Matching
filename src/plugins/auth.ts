import fp from 'fastify-plugin';
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { ForbiddenError, UnauthorizedError } from '../lib/errors';
import { Team } from '../models/team.model';
import { User } from '../models/user.model';
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
  const payload = verifyToken(token);
  const user = await User.findById(payload.userId).select('status').lean();
  if (!user || user.status === 'suspended') {
    throw new ForbiddenError('Account is suspended');
  }
  request.user = payload;
}

export function getAuthUser(request: FastifyRequest): JwtPayload {
  if (!request.user) {
    throw new UnauthorizedError('Not authenticated');
  }
  return request.user;
}

export async function requireSuperadmin(request: FastifyRequest, _reply: FastifyReply) {
  if (!getAuthUser(request).isSuperadmin) {
    throw new ForbiddenError('Superadmin access required');
  }
}

export async function requireActiveTeam(request: FastifyRequest, _reply: FastifyReply) {
  const { teamId } = getAuthUser(request);
  const team = await Team.findById(teamId).select('status').lean();
  if (!team || team.status === 'suspended') {
    throw new ForbiddenError('Team is suspended');
  }
}

export default fp(async (app: FastifyInstance) => {
  app.decorateRequest('user', null);
});
