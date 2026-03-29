import { z } from 'zod';

// Workflow step action validation schema
export const workflowActionSchema = z.object({
  action: z.enum(['approve', 'reject', 'delegate', 'sign']),
  comment: z
    .string()
    .max(1000, 'Le commentaire ne peut pas depasser 1000 caracteres')
    .optional(),
  delegateToUserId: z.string().optional(),
}).refine(
  (data) => {
    if (data.action === 'reject') {
      return data.comment && data.comment.length >= 10;
    }
    return true;
  },
  {
    message: 'Un commentaire d\'au moins 10 caracteres est requis pour un rejet',
    path: ['comment'],
  }
).refine(
  (data) => {
    if (data.action === 'delegate') {
      return !!data.delegateToUserId;
    }
    return true;
  },
  {
    message: 'Selectionnez un utilisateur pour la delegation',
    path: ['delegateToUserId'],
  }
);

export type WorkflowActionFormData = z.infer<typeof workflowActionSchema>;

// Start workflow validation schema
export const startWorkflowSchema = z.object({
  documentId: z.string({ required_error: 'Le document est requis' }),
  templateId: z.string({ required_error: 'Le template de workflow est requis' }),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  dueDate: z.string().optional(),
  message: z
    .string()
    .max(500, 'Le message ne peut pas depasser 500 caracteres')
    .optional(),
});

export type StartWorkflowFormData = z.infer<typeof startWorkflowSchema>;

// Workflow step assignee validation
export const workflowAssigneeSchema = z.object({
  stepId: z.string(),
  assigneeType: z.enum(['user', 'role', 'department']),
  assigneeId: z.string(),
});

export type WorkflowAssigneeFormData = z.infer<typeof workflowAssigneeSchema>;

// Batch workflow action
export const batchWorkflowActionSchema = z.object({
  taskIds: z
    .array(z.string())
    .min(1, 'Selectionnez au moins une tache'),
  action: z.enum(['approve', 'reject']),
  comment: z
    .string()
    .max(1000, 'Le commentaire ne peut pas depasser 1000 caracteres')
    .optional(),
}).refine(
  (data) => {
    if (data.action === 'reject') {
      return data.comment && data.comment.length >= 10;
    }
    return true;
  },
  {
    message: 'Un commentaire d\'au moins 10 caracteres est requis pour un rejet',
    path: ['comment'],
  }
);

export type BatchWorkflowActionFormData = z.infer<typeof batchWorkflowActionSchema>;
