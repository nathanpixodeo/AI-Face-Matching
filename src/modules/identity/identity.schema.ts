import { z } from 'zod';

export const createIdentitySchema = z.object({
  name: z.string().min(1).max(100).trim(),
  description: z.string().max(500).trim().optional(),
});

export const updateIdentitySchema = z.object({
  name: z.string().min(1).max(100).trim().optional(),
  description: z.string().max(500).trim().optional(),
});

export const listIdentitiesSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
});

export type CreateIdentityInput = z.infer<typeof createIdentitySchema>;
export type UpdateIdentityInput = z.infer<typeof updateIdentitySchema>;
export type ListIdentitiesQuery = z.infer<typeof listIdentitiesSchema>;
