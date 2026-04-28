import { z } from 'zod';

export const listFacesSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  identityId: z.string().optional(),
  mappingStatus: z.enum(['auto', 'confirmed', 'manual', 'unmatched']).optional(),
});

export const listImagesSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['pending', 'processing', 'processed', 'failed']).optional(),
});

export type ListFacesQuery = z.infer<typeof listFacesSchema>;
export type ListImagesQuery = z.infer<typeof listImagesSchema>;
