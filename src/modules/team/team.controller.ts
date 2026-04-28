import { FastifyRequest, FastifyReply } from 'fastify';
import { successResponse } from '../../lib/response';
import { getAuthUser } from '../../plugins/auth';
import {
  updateTeamSchema,
  addMemberSchema,
  updateMemberSchema,
  upgradePlanSchema,
} from './team.schema';
import * as teamService from './team.service';

export async function getTeamHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = getAuthUser(request);
  const team = await teamService.getTeam(user.teamId);
  return reply.send(successResponse(team));
}

export async function updateTeamHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = getAuthUser(request);
  const input = updateTeamSchema.parse(request.body);
  const team = await teamService.updateTeam(user.teamId, input);
  return reply.send(successResponse(team, 'Team updated'));
}

export async function getMembersHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = getAuthUser(request);
  const members = await teamService.getMembers(user.teamId);
  return reply.send(successResponse(members));
}

export async function addMemberHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = getAuthUser(request);
  const input = addMemberSchema.parse(request.body);
  const member = await teamService.addMember(user.teamId, input);
  return reply.status(201).send(successResponse(member, 'Member added'));
}

export async function updateMemberHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const user = getAuthUser(request);
  const input = updateMemberSchema.parse(request.body);
  const member = await teamService.updateMember(
    user.teamId,
    request.params.id,
    input,
    user.userId,
  );
  return reply.send(successResponse(member, 'Member updated'));
}

export async function removeMemberHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const user = getAuthUser(request);
  await teamService.removeMember(user.teamId, request.params.id, user.userId);
  return reply.send(successResponse(null, 'Member removed'));
}

export async function upgradePlanHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = getAuthUser(request);
  const input = upgradePlanSchema.parse(request.body);
  const result = await teamService.upgradePlan(user.teamId, input);
  return reply.send(successResponse(result, 'Plan updated'));
}
