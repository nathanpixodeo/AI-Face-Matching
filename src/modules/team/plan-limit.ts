import { Team } from '../../models/team.model';
import { Plan } from '../../models/plan.model';
import { PlanLimitError, NotFoundError } from '../../lib/errors';

type LimitKey =
  | 'maxIdentities'
  | 'maxImages'
  | 'maxMatchesPerDay'
  | 'maxApiCallsPerDay'
  | 'maxStorageMB'
  | 'maxTeamMembers'
  | 'maxFilesPerUpload';

const usageMap: Record<LimitKey, string> = {
  maxIdentities: 'identitiesCount',
  maxImages: 'imagesCount',
  maxMatchesPerDay: 'matchesToday',
  maxApiCallsPerDay: 'apiCallsToday',
  maxStorageMB: 'storageUsedMB',
  maxTeamMembers: 'members',
  maxFilesPerUpload: 'filesPerUpload',
};

const labelMap: Record<LimitKey, string> = {
  maxIdentities: 'identities',
  maxImages: 'images',
  maxMatchesPerDay: 'matches per day',
  maxApiCallsPerDay: 'API calls per day',
  maxStorageMB: 'storage (MB)',
  maxTeamMembers: 'team members',
  maxFilesPerUpload: 'files per upload',
};

export async function checkPlanLimit(
  teamId: string,
  limitKey: LimitKey,
  currentCount?: number,
): Promise<void> {
  const team = await Team.findById(teamId);
  if (!team) throw new NotFoundError('Team', teamId);

  const plan = await Plan.findById(team.planId);
  if (!plan) throw new NotFoundError('Plan');

  const limit = plan.limits[limitKey];
  if (limit === -1) return;

  let usage: number;
  if (currentCount !== undefined) {
    usage = currentCount;
  } else {
    const usageField = usageMap[limitKey] as keyof typeof team.usage;
    usage = (team.usage[usageField] as number) ?? 0;
  }

  if (usage >= limit) {
    throw new PlanLimitError(labelMap[limitKey], limit);
  }
}

export async function incrementUsage(
  teamId: string,
  field: keyof typeof usageMap,
  amount = 1,
): Promise<void> {
  const usageField = `usage.${usageMap[field]}`;
  await Team.findByIdAndUpdate(teamId, { $inc: { [usageField]: amount } });
}

export async function decrementUsage(
  teamId: string,
  field: keyof typeof usageMap,
  amount = 1,
): Promise<void> {
  const usageField = `usage.${usageMap[field]}`;
  await Team.findByIdAndUpdate(teamId, { $inc: { [usageField]: -amount } });
}

export async function resetDailyUsage(): Promise<void> {
  await Team.updateMany(
    {},
    { $set: { 'usage.matchesToday': 0, 'usage.apiCallsToday': 0 } },
  );
}
