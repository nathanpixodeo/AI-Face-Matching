import { FastifyRequest, FastifyReply } from 'fastify';
import { successResponse } from '../../lib/response';
import { getAuthUser } from '../../plugins/auth';
import { createWorkspaceSchema, updateWorkspaceSchema, listWorkspacesSchema } from './workspace.schema';
import * as workspaceService from './workspace.service';

export async function createWorkspaceHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = getAuthUser(request);
  const input = createWorkspaceSchema.parse(request.body);
  const workspace = await workspaceService.createWorkspace(user.teamId, input);
  return reply.status(201).send(successResponse(workspace, 'Workspace created'));
}

export async function listWorkspacesHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = getAuthUser(request);
  const query = listWorkspacesSchema.parse(request.query);
  const result = await workspaceService.listWorkspaces(user.teamId, query);
  return reply.send(successResponse(result));
}

export async function getWorkspaceHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const user = getAuthUser(request);
  const workspace = await workspaceService.getWorkspace(user.teamId, request.params.id);
  return reply.send(successResponse(workspace));
}

export async function updateWorkspaceHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const user = getAuthUser(request);
  const input = updateWorkspaceSchema.parse(request.body);
  const workspace = await workspaceService.updateWorkspace(user.teamId, request.params.id, input);
  return reply.send(successResponse(workspace, 'Workspace updated'));
}

export async function deleteWorkspaceHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const user = getAuthUser(request);
  await workspaceService.deleteWorkspace(user.teamId, request.params.id);
  return reply.send(successResponse(null, 'Workspace deleted'));
}
