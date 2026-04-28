import { z } from 'zod';

export const updateTeamSchema = z.object({
  name: z.string().min(1).max(100).trim(),
});

export const addMemberSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  role: z.enum(['admin', 'member']).default('member'),
});

export const updateMemberSchema = z.object({
  role: z.enum(['admin', 'member']),
});

export const upgradePlanSchema = z.object({
  planName: z.enum(['free', 'pro', 'enterprise']),
});

export type UpdateTeamInput = z.infer<typeof updateTeamSchema>;
export type AddMemberInput = z.infer<typeof addMemberSchema>;
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;
export type UpgradePlanInput = z.infer<typeof upgradePlanSchema>;
