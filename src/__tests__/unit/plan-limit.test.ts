import { checkPlanLimit, incrementUsage, resetDailyUsage } from '../../modules/team/plan-limit';
import { createTestUser } from '../helpers/fixtures';
import { Team } from '../../models/team.model';

process.env.JWT_SECRET = 'test-secret-minimum-16-chars';
process.env.MONGO_URI = 'mongodb://localhost:27017/test';
process.env.ML_SERVICE_URL = 'http://localhost:8000';

describe('Plan limits', () => {
  test('passes when under limit', async () => {
    const { team } = await createTestUser();
    await expect(checkPlanLimit(team._id.toString(), 'maxIdentities')).resolves.not.toThrow();
  });

  test('throws when at limit', async () => {
    const { team } = await createTestUser();
    await Team.findByIdAndUpdate(team._id, { 'usage.identitiesCount': 50 });

    await expect(checkPlanLimit(team._id.toString(), 'maxIdentities')).rejects.toThrow(
      'Plan limit reached',
    );
  });

  test('accepts custom currentCount', async () => {
    const { team } = await createTestUser();
    await expect(checkPlanLimit(team._id.toString(), 'maxTeamMembers', 1)).resolves.not.toThrow();
    await expect(checkPlanLimit(team._id.toString(), 'maxTeamMembers', 2)).rejects.toThrow(
      'Plan limit reached',
    );
  });

  test('incrementUsage updates counter', async () => {
    const { team } = await createTestUser();
    await incrementUsage(team._id.toString(), 'maxImages', 5);

    const updated = await Team.findById(team._id);
    expect(updated!.usage.imagesCount).toBe(5);
  });

  test('resetDailyUsage clears daily counters', async () => {
    const { team } = await createTestUser();
    await Team.findByIdAndUpdate(team._id, {
      'usage.matchesToday': 30,
      'usage.apiCallsToday': 50,
    });

    await resetDailyUsage();

    const updated = await Team.findById(team._id);
    expect(updated!.usage.matchesToday).toBe(0);
    expect(updated!.usage.apiCallsToday).toBe(0);
  });
});
