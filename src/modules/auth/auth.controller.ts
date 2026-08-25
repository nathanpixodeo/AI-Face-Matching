import { FastifyRequest, FastifyReply } from 'fastify';
import { successResponse } from '../../lib/response';
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from './auth.schema';
import * as authService from './auth.service';

export async function registerHandler(request: FastifyRequest, reply: FastifyReply) {
  const input = registerSchema.parse(request.body);
  const result = await authService.register(input);
  return reply.status(201).send(successResponse(result, request.t('response.registrationSuccessful')));
}

export async function loginHandler(request: FastifyRequest, reply: FastifyReply) {
  const input = loginSchema.parse(request.body);
  const result = await authService.login(input);
  return reply.send(successResponse(result, request.t('response.loginSuccessful')));
}

export async function forgotPasswordHandler(request: FastifyRequest, reply: FastifyReply) {
  const input = forgotPasswordSchema.parse(request.body);
  const result = await authService.forgotPassword(input);
  const message = request.t('response.passwordResetRequested');
  return reply.send(successResponse({ ...result, message }, message));
}

export async function resetPasswordHandler(request: FastifyRequest, reply: FastifyReply) {
  const input = resetPasswordSchema.parse(request.body);
  await authService.resetPassword(input);
  return reply.send(successResponse(null, request.t('response.passwordResetSuccessful')));
}
