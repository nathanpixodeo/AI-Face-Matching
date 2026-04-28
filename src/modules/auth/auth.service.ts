import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { User, IUser } from '../../models/user.model';
import { Team } from '../../models/team.model';
import { Plan } from '../../models/plan.model';
import { ConflictError, UnauthorizedError } from '../../lib/errors';
import { JwtPayload } from '../../types';
import { RegisterInput, LoginInput } from './auth.schema';

function signToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  const options: jwt.SignOptions = {
    algorithm: 'HS256',
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  };
  return jwt.sign(payload, env.JWT_SECRET, options);
}

interface AuthResult {
  token: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
  team: {
    id: string;
    name: string;
    plan: string;
  };
}

export async function register(input: RegisterInput): Promise<AuthResult> {
  const existing = await User.findOne({ email: input.email });
  if (existing) {
    throw new ConflictError('Email already registered');
  }

  const freePlan = await Plan.findOne({ name: 'free', active: true });
  if (!freePlan) {
    throw new Error('Free plan not found — run seed first');
  }

  const hashedPassword = await bcrypt.hash(input.password, 12);

  const user = await User.create({
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email,
    password: hashedPassword,
    role: 'owner',
  });

  const team = await Team.create({
    name: input.teamName,
    ownerId: user._id,
    planId: freePlan._id,
  });

  user.teamId = team._id;
  await user.save();

  const token = signToken({
    userId: user._id.toString(),
    email: user.email,
    teamId: team._id.toString(),
    role: user.role,
  });

  return {
    token,
    user: {
      id: user._id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
    },
    team: {
      id: team._id.toString(),
      name: team.name,
      plan: freePlan.name,
    },
  };
}

export async function login(input: LoginInput): Promise<AuthResult> {
  const user = await User.findOne({ email: input.email }).select('+password') as IUser | null;
  if (!user) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const valid = await bcrypt.compare(input.password, user.password);
  if (!valid) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const team = await Team.findById(user.teamId);
  if (!team) {
    throw new Error('User team not found');
  }

  const plan = await Plan.findById(team.planId);

  const token = signToken({
    userId: user._id.toString(),
    email: user.email,
    teamId: team._id.toString(),
    role: user.role,
  });

  return {
    token,
    user: {
      id: user._id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
    },
    team: {
      id: team._id.toString(),
      name: team.name,
      plan: plan?.name ?? 'free',
    },
  };
}
