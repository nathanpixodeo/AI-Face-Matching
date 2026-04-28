import { FastifyRequest, FastifyReply } from 'fastify';
import { successResponse } from '../../lib/response';
import { registerSchema, loginSchema } from './auth.schema';
import * as authService from './auth.service';

export async function registerHandler(request: FastifyRequest, reply: FastifyReply) {
  const input = registerSchema.parse(request.body);
  const result = await authService.register(input);
  return reply.status(201).send(successResponse(result, 'Registration successful'));
}

export async function loginHandler(request: FastifyRequest, reply: FastifyReply) {
  const input = loginSchema.parse(request.body);
  const result = await authService.login(input);
  return reply.send(successResponse(result, 'Login successful'));
}
