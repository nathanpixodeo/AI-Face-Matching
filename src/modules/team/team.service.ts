import { Team } from '../../models/team.model';
import { User } from '../../models/user.model';
import { Plan } from '../../models/plan.model';
import { NotFoundError, ConflictError, ForbiddenError } from '../../lib/errors';
import { checkPlanLimit } from './plan-limit';
import {
  UpdateTeamInput,
  AddMemberInput,
  UpdateMemberInput,
  UpgradePlanInput,
} from './team.schema';

export async function getTeam(teamId: string) {
  const team = await Team.findById(teamId);
  if (!team) throw new NotFoundError('Team', teamId);

  const plan = await Plan.findById(team.planId);
  const memberCount = await User.countDocuments({ teamId: team._id });

  return {
    id: team._id.toString(),
    name: team.name,
    ownerId: team.ownerId.toString(),
    plan: plan ? { name: plan.name, limits: plan.limits, price: plan.price } : null,
    usage: team.usage,
    memberCount,
    createdAt: team.createdAt,
  };
}

export async function updateTeam(teamId: string, input: UpdateTeamInput) {
  const team = await Team.findByIdAndUpdate(teamId, { name: input.name }, { new: true });
  if (!team) throw new NotFoundError('Team', teamId);
  return { id: team._id.toString(), name: team.name };
}

export async function getMembers(teamId: string) {
  const members = await User.find({ teamId }).select('-password');
  return members.map((m) => ({
    id: m._id.toString(),
    firstName: m.firstName,
    lastName: m.lastName,
    email: m.email,
    role: m.role,
    createdAt: m.createdAt,
  }));
}

export async function addMember(teamId: string, input: AddMemberInput) {
  const memberCount = await User.countDocuments({ teamId });
  await checkPlanLimit(teamId, 'maxTeamMembers', memberCount);

  const existing = await User.findOne({ email: input.email });
  if (existing) {
    if (existing.teamId.toString() === teamId) {
      throw new ConflictError('User is already a member of this team');
    }
    throw new ConflictError('User is already a member of another team');
  }

  const user = await User.create({
    firstName: '',
    lastName: '',
    email: input.email,
    password: 'pending-invite',
    teamId,
    role: input.role,
  });

  return {
    id: user._id.toString(),
    email: user.email,
    role: user.role,
  };
}

export async function updateMember(
  teamId: string,
  memberId: string,
  input: UpdateMemberInput,
  requesterId: string,
) {
  const member = await User.findOne({ _id: memberId, teamId });
  if (!member) throw new NotFoundError('Member', memberId);

  if (member.role === 'owner') {
    throw new ForbiddenError('Cannot change the role of the team owner');
  }

  if (member._id.toString() === requesterId) {
    throw new ForbiddenError('Cannot change your own role');
  }

  member.role = input.role;
  await member.save();

  return {
    id: member._id.toString(),
    email: member.email,
    role: member.role,
  };
}

export async function removeMember(teamId: string, memberId: string, requesterId: string) {
  const member = await User.findOne({ _id: memberId, teamId });
  if (!member) throw new NotFoundError('Member', memberId);

  if (member.role === 'owner') {
    throw new ForbiddenError('Cannot remove the team owner');
  }

  if (member._id.toString() === requesterId) {
    throw new ForbiddenError('Cannot remove yourself from the team');
  }

  await User.deleteOne({ _id: memberId });
}

export async function upgradePlan(teamId: string, input: UpgradePlanInput) {
  const plan = await Plan.findOne({ name: input.planName, active: true });
  if (!plan) throw new NotFoundError('Plan');

  const team = await Team.findByIdAndUpdate(teamId, { planId: plan._id }, { new: true });
  if (!team) throw new NotFoundError('Team', teamId);

  return {
    id: team._id.toString(),
    name: team.name,
    plan: { name: plan.name, limits: plan.limits, price: plan.price },
  };
}
