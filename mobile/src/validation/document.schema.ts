import { z } from 'zod';
import { FILE_UPLOAD } from '@/constants/config';

// Document upload validation schema
export const documentUploadSchema = z.object({
  title: z
    .string({ required_error: 'Le titre est requis' })
    .min(1, 'Le titre est requis')
    .min(3, 'Le titre doit contenir au moins 3 caracteres')
    .max(200, 'Le titre ne peut pas depasser 200 caracteres'),
  description: z
    .string()
    .max(1000, 'La description ne peut pas depasser 1000 caracteres')
    .optional(),
  typeId: z
    .string({ required_error: 'Le type de document est requis' })
    .min(1, 'Le type de document est requis'),
  tags: z
    .array(z.string())
    .max(10, 'Vous ne pouvez pas ajouter plus de 10 tags')
    .optional(),
  file: z.object({
    uri: z.string(),
    name: z.string(),
    type: z.string(),
    size: z.number(),
  }).refine(
    (file) => file.size <= FILE_UPLOAD.MAX_SIZE_BYTES,
    `La taille du fichier ne peut pas depasser ${FILE_UPLOAD.MAX_SIZE_MB}MB`
  ).refine(
    (file) => FILE_UPLOAD.ALLOWED_TYPES.includes(file.type),
    'Type de fichier non supporte'
  ),
  metadata: z.record(z.unknown()).optional(),
});

export type DocumentUploadFormData = z.infer<typeof documentUploadSchema>;

// Document update validation schema
export const documentUpdateSchema = z.object({
  title: z
    .string()
    .min(3, 'Le titre doit contenir au moins 3 caracteres')
    .max(200, 'Le titre ne peut pas depasser 200 caracteres')
    .optional(),
  description: z
    .string()
    .max(1000, 'La description ne peut pas depasser 1000 caracteres')
    .optional(),
  tags: z
    .array(z.string())
    .max(10, 'Vous ne pouvez pas ajouter plus de 10 tags')
    .optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type DocumentUpdateFormData = z.infer<typeof documentUpdateSchema>;

// Document search validation schema
export const documentSearchSchema = z.object({
  query: z.string().optional(),
  status: z.enum([
    'draft',
    'pending_review',
    'in_workflow',
    'approved',
    'rejected',
    'signed',
    'archived',
  ]).optional(),
  typeId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  createdBy: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.number().min(1).default(1),
  pageSize: z.number().min(1).max(100).default(20),
  sortBy: z.enum(['title', 'createdAt', 'updatedAt', 'status']).default('updatedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type DocumentSearchParams = z.infer<typeof documentSearchSchema>;

// Document share validation schema
export const documentShareSchema = z.object({
  documentId: z.string(),
  userIds: z
    .array(z.string())
    .min(1, 'Selectionnez au moins un utilisateur'),
  permission: z.enum(['view', 'edit', 'sign']),
  message: z.string().max(500).optional(),
  expiresAt: z.string().optional(),
});

export type DocumentShareFormData = z.infer<typeof documentShareSchema>;
