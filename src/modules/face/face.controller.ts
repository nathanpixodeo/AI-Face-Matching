import { FastifyRequest, FastifyReply } from 'fastify';
import { successResponse } from '../../lib/response';
import { getAuthUser } from '../../plugins/auth';
import { ValidationError } from '../../lib/errors';
import { listFacesSchema, listImagesSchema } from './face.schema';
import * as faceService from './face.service';

export async function matchHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = getAuthUser(request);
  const file = await request.file();
  if (!file) throw new ValidationError('No image file provided');
  const result = await faceService.matchFace(user.teamId, file);
  return reply.send(successResponse(result));
}

export async function listFacesHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = getAuthUser(request);
  const query = listFacesSchema.parse(request.query);
  const result = await faceService.listFaces(user.teamId, query);
  return reply.send(successResponse(result));
}

export async function getFaceHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const user = getAuthUser(request);
  const result = await faceService.getFace(user.teamId, request.params.id);
  return reply.send(successResponse(result));
}

export async function statsHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = getAuthUser(request);
  const result = await faceService.getFaceStats(user.teamId);
  return reply.send(successResponse(result));
}

export async function listImagesHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = getAuthUser(request);
  const query = listImagesSchema.parse(request.query);
  const result = await faceService.listImages(user.teamId, query);
  return reply.send(successResponse(result));
}

export async function getImageHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const user = getAuthUser(request);
  const result = await faceService.getImage(user.teamId, request.params.id);
  return reply.send(successResponse(result));
}

export async function deleteImageHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const user = getAuthUser(request);
  await faceService.deleteImage(user.teamId, request.params.id);
  return reply.send(successResponse(null, 'Image deleted'));
}
