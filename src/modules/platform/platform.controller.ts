import { FastifyReply, FastifyRequest } from 'fastify';
import { successResponse } from '../../lib/response';
import { getAuthUser } from '../../plugins/auth';
import {
  listPlatformTeamsSchema,
  listPlatformUsersSchema,
  updatePlatformTeamSchema,
  updatePlatformUserSchema,
} from './platform.schema';
import * as platformService from './platform.service';

export async function getPlatformOverviewHandler(_request: FastifyRequest, reply: FastifyReply) {
  const overview = await platformService.getPlatformOverview();
  return reply.send(successResponse(overview));
}

export async function listPlatformTeamsHandler(request: FastifyRequest, reply: FastifyReply) {
  const input = listPlatformTeamsSchema.parse(request.query);
  const teams = await platformService.listPlatformTeams(input);
  return reply.send(successResponse(teams));
}

export async function updatePlatformTeamHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const input = updatePlatformTeamSchema.parse(request.body);
  const result = await platformService.updatePlatformTeam(request.params.id, input);
  const actor = getAuthUser(request);
  request.log.info(
    { action: 'platform.team.updated', actorUserId: actor.userId, targetTeamId: result.id, ...input },
    'Platform team updated',
  );
  return reply.send(successResponse(result, request.t('response.teamUpdated')));
}

export async function listPlatformUsersHandler(request: FastifyRequest, reply: FastifyReply) {
  const input = listPlatformUsersSchema.parse(request.query);
  const users = await platformService.listPlatformUsers(input);
  return reply.send(successResponse(users));
}

export async function updatePlatformUserHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const input = updatePlatformUserSchema.parse(request.body);
  const actor = getAuthUser(request);
  const result = await platformService.updatePlatformUser(request.params.id, input, actor.userId);
  request.log.info(
    { action: 'platform.user.status.updated', actorUserId: actor.userId, targetUserId: result.id, status: result.status },
    'Platform user status updated',
  );
  return reply.send(successResponse(result, request.t('response.userStatusUpdated')));
}
