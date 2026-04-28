import { FastifyRequest, FastifyReply } from 'fastify';
import { successResponse } from '../../lib/response';
import { getAuthUser } from '../../plugins/auth';
import { createIdentitySchema, updateIdentitySchema, listIdentitiesSchema } from './identity.schema';
import * as identityService from './identity.service';

export async function createIdentityHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = getAuthUser(request);
  const input = createIdentitySchema.parse(request.body);
  const identity = await identityService.createIdentity(user.teamId, input);
  return reply.status(201).send(successResponse(identity, 'Identity created'));
}

export async function listIdentitiesHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = getAuthUser(request);
  const query = listIdentitiesSchema.parse(request.query);
  const result = await identityService.listIdentities(user.teamId, query);
  return reply.send(successResponse(result));
}

export async function getIdentityHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const user = getAuthUser(request);
  const identity = await identityService.getIdentity(user.teamId, request.params.id);
  return reply.send(successResponse(identity));
}

export async function updateIdentityHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const user = getAuthUser(request);
  const input = updateIdentitySchema.parse(request.body);
  const identity = await identityService.updateIdentity(user.teamId, request.params.id, input);
  return reply.send(successResponse(identity, 'Identity updated'));
}

export async function deleteIdentityHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const user = getAuthUser(request);
  await identityService.deleteIdentity(user.teamId, request.params.id);
  return reply.send(successResponse(null, 'Identity deleted'));
}

export async function getIdentityFacesHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const user = getAuthUser(request);
  const faces = await identityService.getIdentityFaces(user.teamId, request.params.id);
  return reply.send(successResponse(faces));
}
