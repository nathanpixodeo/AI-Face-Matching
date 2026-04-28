import { z } from 'zod';

export const createWorkspaceSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  notes: z.string().max(500).trim().optional(),
});

export const updateWorkspaceSchema = z.object({
  name: z.string().min(1).max(100).trim().optional(),
  notes: z.string().max(500).trim().optional(),
  status: z.boolean().optional(),
});

export const listWorkspacesSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.preprocess((v) => (v === 'true' ? true : v === 'false' ? false : v), z.boolean().optional()),
});

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;
export type ListWorkspacesQuery = z.infer<typeof listWorkspacesSchema>;
