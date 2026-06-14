import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { env } from '../../config/env';
import { User, IUser } from '../../models/user.model';
import { Team } from '../../models/team.model';
import { Plan } from '../../models/plan.model';
import { ConflictError, UnauthorizedError } from '../../lib/errors';
import { JwtPayload } from '../../types';
import { RegisterInput, LoginInput, ForgotPasswordInput, ResetPasswordInput } from './auth.schema';

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

  // Pre-generate IDs and create team first to avoid race condition
  // where user exists without a teamId
  const userId = new mongoose.Types.ObjectId();
  const teamId = new mongoose.Types.ObjectId();

  const team = await Team.create({
    _id: teamId,
    name: input.teamName,
    ownerId: userId,
    planId: freePlan._id,
  });

  const user = await User.create({
    _id: userId,
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email,
    password: hashedPassword,
    role: 'owner',
    teamId: team._id,
  });

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

export async function forgotPassword(input: ForgotPasswordInput): Promise<{ token: string; message: string }> {
  const user = await User.findOne({ email: input.email });
  if (!user) {
    return { token: '', message: 'If that email is registered, a reset link has been sent.' };
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

  user.resetPasswordToken = hashedToken;
  user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  await user.save();

  return { token: resetToken, message: 'If that email is registered, a reset link has been sent.' };
}

export async function resetPassword(input: ResetPasswordInput): Promise<void> {
  const hashedToken = crypto.createHash('sha256').update(input.token).digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: new Date() },
  });

  if (!user) {
    throw new UnauthorizedError('Invalid or expired reset token');
  }

  user.password = await bcrypt.hash(input.password, 12);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();
}
