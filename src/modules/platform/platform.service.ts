import { Types } from 'mongoose';
import { AccountStatus } from '../../types';
import { Identity } from '../../models/identity.model';
import { Image } from '../../models/image.model';
import { Plan } from '../../models/plan.model';
import { Team } from '../../models/team.model';
import { User } from '../../models/user.model';
import { ForbiddenError, NotFoundError } from '../../lib/errors';
import {
  ListPlatformTeamsInput,
  ListPlatformUsersInput,
  UpdatePlatformTeamInput,
  UpdatePlatformUserInput,
} from './platform.schema';

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function pageOffset(page: number, limit: number): number {
  return (page - 1) * limit;
}

export async function getPlatformOverview() {
  const [teamStatsResult, userStatsResult, resourceStatsResult] = await Promise.all([
    Team.aggregate<{ total: number; suspended: number }>([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          suspended: { $sum: { $cond: [{ $eq: ['$status', 'suspended'] }, 1, 0] } },
        },
      },
    ]),
    User.aggregate<{ total: number; suspended: number; superadmins: number }>([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          suspended: { $sum: { $cond: [{ $eq: ['$status', 'suspended'] }, 1, 0] } },
          superadmins: { $sum: { $cond: ['$isSuperadmin', 1, 0] } },
        },
      },
    ]),
    Promise.all([Identity.countDocuments(), Image.countDocuments()]),
  ]);

  const teamStats = teamStatsResult[0] ?? { total: 0, suspended: 0 };
  const userStats = userStatsResult[0] ?? { total: 0, suspended: 0, superadmins: 0 };
  const [identities, images] = resourceStatsResult;

  return {
    teams: {
      total: teamStats.total,
      active: teamStats.total - teamStats.suspended,
      suspended: teamStats.suspended,
    },
    users: {
      total: userStats.total,
      active: userStats.total - userStats.suspended,
      suspended: userStats.suspended,
      superadmins: userStats.superadmins,
    },
    resources: { identities, images },
  };
}

export async function listPlatformTeams(input: ListPlatformTeamsInput) {
  const filter: Record<string, unknown> = {};
  if (input.status) filter.status = input.status;
  if (input.search) filter.name = { $regex: escapeRegex(input.search), $options: 'i' };

  const [teams, total] = await Promise.all([
    Team.find(filter).sort({ createdAt: -1 }).skip(pageOffset(input.page, input.limit)).limit(input.limit),
    Team.countDocuments(filter),
  ]);

  const teamIds = teams.map((team) => team._id);
  const ownerIds = teams.map((team) => team.ownerId);
  const planIds = teams.map((team) => team.planId);
  const [owners, plans, memberCounts] = await Promise.all([
    User.find({ _id: { $in: ownerIds } }).select('firstName lastName email'),
    Plan.find({ _id: { $in: planIds } }).select('name'),
    User.aggregate<{ _id: Types.ObjectId; count: number }>([
      { $match: { teamId: { $in: teamIds } } },
      { $group: { _id: '$teamId', count: { $sum: 1 } } },
    ]),
  ]);

  const ownersById = new Map(owners.map((owner) => [owner._id.toString(), owner]));
  const plansById = new Map(plans.map((plan) => [plan._id.toString(), plan]));
  const memberCountsByTeam = new Map(memberCounts.map((count) => [count._id.toString(), count.count]));

  return {
    items: teams.map((team) => {
      const owner = ownersById.get(team.ownerId.toString());
      const plan = plansById.get(team.planId.toString());
      return {
        id: team._id.toString(),
        name: team.name,
        status: team.status ?? 'active',
        planName: plan?.name ?? 'free',
        owner: owner
          ? { id: owner._id.toString(), firstName: owner.firstName, lastName: owner.lastName, email: owner.email }
          : null,
        memberCount: memberCountsByTeam.get(team._id.toString()) ?? 0,
        usage: team.usage,
        createdAt: team.createdAt,
      };
    }),
    total,
    page: input.page,
    totalPages: Math.max(1, Math.ceil(total / input.limit)),
  };
}

export async function listPlatformUsers(input: ListPlatformUsersInput) {
  const filter: Record<string, unknown> = {};
  if (input.status) filter.status = input.status;
  if (input.search) {
    const query = { $regex: escapeRegex(input.search), $options: 'i' };
    filter.$or = [{ firstName: query }, { lastName: query }, { email: query }];
  }

  const [users, total] = await Promise.all([
    User.find(filter).select('firstName lastName email teamId role isSuperadmin status createdAt').sort({ createdAt: -1 }).skip(pageOffset(input.page, input.limit)).limit(input.limit),
    User.countDocuments(filter),
  ]);
  const teams = await Team.find({ _id: { $in: users.map((user) => user.teamId) } }).select('name');
  const teamsById = new Map(teams.map((team) => [team._id.toString(), team]));

  return {
    items: users.map((user) => {
      const team = teamsById.get(user.teamId.toString());
      return {
        id: user._id.toString(),
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        isSuperadmin: user.isSuperadmin,
        status: user.status ?? 'active',
        team: team ? { id: team._id.toString(), name: team.name } : null,
        createdAt: user.createdAt,
      };
    }),
    total,
    page: input.page,
    totalPages: Math.max(1, Math.ceil(total / input.limit)),
  };
}

export async function updatePlatformTeam(teamId: string, input: UpdatePlatformTeamInput) {
  const update: { status?: AccountStatus; planId?: Types.ObjectId } = {};
  if (input.status) update.status = input.status;

  let selectedPlanName: string | undefined;
  if (input.planName) {
    const plan = await Plan.findOne({ name: input.planName, active: true });
    if (!plan) throw new NotFoundError('Plan');
    update.planId = plan._id;
    selectedPlanName = plan.name;
  }

  const team = await Team.findByIdAndUpdate(teamId, update, { new: true });
  if (!team) throw new NotFoundError('Team', teamId);

  if (!selectedPlanName) {
    const plan = await Plan.findById(team.planId).select('name');
    selectedPlanName = plan?.name ?? 'free';
  }

  return {
    id: team._id.toString(),
    status: team.status ?? 'active',
    planName: selectedPlanName,
  };
}

export async function updatePlatformUser(
  userId: string,
  input: UpdatePlatformUserInput,
  actorUserId: string,
) {
  if (userId === actorUserId) {
    throw new ForbiddenError('Cannot change your own account status');
  }

  const user = await User.findById(userId).select('isSuperadmin');
  if (!user) throw new NotFoundError('User', userId);
  if (user.isSuperadmin) {
    throw new ForbiddenError('Cannot change a superadmin account status');
  }

  const updatedUser = await User.findByIdAndUpdate(userId, { status: input.status }, { new: true })
    .select('firstName lastName email status');
  if (!updatedUser) throw new NotFoundError('User', userId);

  return {
    id: updatedUser._id.toString(),
    firstName: updatedUser.firstName,
    lastName: updatedUser.lastName,
    email: updatedUser.email,
    status: updatedUser.status ?? 'active',
  };
}
