import { Types } from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Plan } from '../../models/plan.model';
import { Team } from '../../models/team.model';
import { User } from '../../models/user.model';
import { Identity } from '../../models/identity.model';

const JWT_SECRET = 'test-secret-minimum-16-chars';

export async function seedFreePlan() {
  return Plan.create({
    name: 'free',
    limits: {
      maxIdentities: 50,
      maxImages: 500,
      maxMatchesPerDay: 50,
      maxApiCallsPerDay: 100,
      maxStorageMB: 500,
      maxTeamMembers: 2,
      maxFilesPerUpload: 10,
    },
    price: 0,
    active: true,
  });
}

export async function createTestUser(overrides: Record<string, unknown> = {}) {
  const plan = await seedFreePlan();

  const team = await Team.create({
    name: 'Test Team',
    ownerId: new Types.ObjectId(),
    planId: plan._id,
  });

  const hashedPassword = await bcrypt.hash('password123', 4);
  const user = await User.create({
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    password: hashedPassword,
    teamId: team._id,
    role: 'owner',
    ...overrides,
  });

  team.ownerId = user._id;
  await team.save();

  const token = jwt.sign(
    {
      userId: user._id.toString(),
      email: user.email,
      teamId: team._id.toString(),
      role: user.role,
    },
    JWT_SECRET,
    { algorithm: 'HS256', expiresIn: '1h' },
  );

  return { user, team, plan, token };
}

export async function createTestIdentity(teamId: Types.ObjectId, name = 'John Doe') {
  return Identity.create({
    teamId,
    name,
    description: 'Test identity',
  });
}

export { JWT_SECRET };
