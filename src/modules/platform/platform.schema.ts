import { z } from 'zod';

const paginationFields = {
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  search: z.string().trim().min(1).max(100).optional(),
};

export const listPlatformTeamsSchema = z.object({
  ...paginationFields,
  status: z.enum(['active', 'suspended']).optional(),
});

export const listPlatformUsersSchema = z.object({
  ...paginationFields,
  status: z.enum(['active', 'suspended']).optional(),
});

export const updatePlatformTeamSchema = z
  .object({
    status: z.enum(['active', 'suspended']).optional(),
    planName: z.enum(['free', 'pro', 'enterprise']).optional(),
  })
  .refine((value) => value.status !== undefined || value.planName !== undefined, {
    message: 'At least one team field is required',
  });

export const updatePlatformUserSchema = z.object({
  status: z.enum(['active', 'suspended']),
});

export type ListPlatformTeamsInput = z.infer<typeof listPlatformTeamsSchema>;
export type ListPlatformUsersInput = z.infer<typeof listPlatformUsersSchema>;
export type UpdatePlatformTeamInput = z.infer<typeof updatePlatformTeamSchema>;
export type UpdatePlatformUserInput = z.infer<typeof updatePlatformUserSchema>;
