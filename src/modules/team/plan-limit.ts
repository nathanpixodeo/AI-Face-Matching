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

type UsageField = 'identitiesCount' | 'imagesCount' | 'matchesToday' | 'apiCallsToday' | 'storageUsedMB';

const usageMap: Partial<Record<LimitKey, UsageField>> = {
  maxIdentities: 'identitiesCount',
  maxImages: 'imagesCount',
  maxMatchesPerDay: 'matchesToday',
  maxApiCallsPerDay: 'apiCallsToday',
  maxStorageMB: 'storageUsedMB',
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
    const usageField = usageMap[limitKey];
    if (!usageField) return;
    usage = (team.usage[usageField] as number) ?? 0;
  }

  if (usage >= limit) {
    throw new PlanLimitError(labelMap[limitKey], limit);
  }
}

export async function incrementUsage(
  teamId: string,
  field: LimitKey,
  amount = 1,
): Promise<void> {
  const usageField = usageMap[field];
  if (!usageField) return;
  await Team.findByIdAndUpdate(teamId, { $inc: { [`usage.${usageField}`]: amount } });
}

export async function decrementUsage(
  teamId: string,
  field: LimitKey,
  amount = 1,
): Promise<void> {
  const usageField = usageMap[field];
  if (!usageField) return;
  await Team.findByIdAndUpdate(teamId, { $inc: { [`usage.${usageField}`]: -amount } });
}

export async function resetDailyUsage(): Promise<void> {
  await Team.updateMany(
    {},
    { $set: { 'usage.matchesToday': 0, 'usage.apiCallsToday': 0 } },
  );
}
