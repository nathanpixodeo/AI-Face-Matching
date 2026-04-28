import { z } from 'zod';

export const listBatchesSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  status: z.enum(['uploading', 'processing', 'review', 'completed', 'failed']).optional(),
});

export const reviewMappingSchema = z.object({
  mappings: z.array(
    z.discriminatedUnion('action', [
      z.object({
        faceId: z.string(),
        action: z.literal('confirm'),
        identityId: z.string(),
      }),
      z.object({
        faceId: z.string(),
        action: z.literal('reassign'),
        identityId: z.string(),
      }),
      z.object({
        faceId: z.string(),
        action: z.literal('create'),
        name: z.string().min(1).max(100).trim(),
        description: z.string().max(500).trim().optional(),
      }),
      z.object({
        faceId: z.string(),
        action: z.literal('skip'),
      }),
    ]),
  ),
});

export type ListBatchesQuery = z.infer<typeof listBatchesSchema>;
export type ReviewMappingInput = z.infer<typeof reviewMappingSchema>;
