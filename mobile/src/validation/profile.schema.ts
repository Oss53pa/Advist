import { z } from 'zod';

// Profile update validation schema
export const profileUpdateSchema = z.object({
  firstName: z
    .string()
    .min(2, 'Le prenom doit contenir au moins 2 caracteres')
    .max(50, 'Le prenom ne peut pas depasser 50 caracteres')
    .regex(/^[a-zA-ZÀ-ÿ\s-]+$/, 'Le prenom ne peut contenir que des lettres')
    .optional(),
  lastName: z
    .string()
    .min(2, 'Le nom doit contenir au moins 2 caracteres')
    .max(50, 'Le nom ne peut pas depasser 50 caracteres')
    .regex(/^[a-zA-ZÀ-ÿ\s-]+$/, 'Le nom ne peut contenir que des lettres')
    .optional(),
  phone: z
    .string()
    .refine(
      (val) => {
        if (!val || val === '') return true; // Optionnel
        // Format international: +225 (CI), +221 (SN), +33 (FR), etc.
        return /^\+[0-9]{1,4}[0-9]{8,12}$/.test(val);
      },
      { message: 'Format de telephone invalide. Utilisez le format international (+225...)' }
    )
    .optional()
    .or(z.literal('')),
  avatar: z.string().url().optional().or(z.literal('')),
  language: z.enum(['fr', 'en']).optional(),
  timezone: z.string().optional(),
});

export type ProfileUpdateFormData = z.infer<typeof profileUpdateSchema>;

// Notification preferences validation schema
export const notificationPreferencesSchema = z.object({
  email: z.object({
    taskAssigned: z.boolean().default(true),
    documentApproved: z.boolean().default(true),
    documentRejected: z.boolean().default(true),
    workflowCompleted: z.boolean().default(true),
    deadlineReminder: z.boolean().default(true),
    mentions: z.boolean().default(true),
    weeklyDigest: z.boolean().default(false),
  }),
  push: z.object({
    taskAssigned: z.boolean().default(true),
    documentApproved: z.boolean().default(true),
    documentRejected: z.boolean().default(true),
    workflowCompleted: z.boolean().default(true),
    deadlineReminder: z.boolean().default(true),
    mentions: z.boolean().default(true),
  }),
  quietHours: z.object({
    enabled: z.boolean().default(false),
    start: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).default('22:00'),
    end: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).default('07:00'),
  }),
});

export type NotificationPreferencesFormData = z.infer<typeof notificationPreferencesSchema>;

// Security settings validation schema
export const securitySettingsSchema = z.object({
  biometricEnabled: z.boolean().default(false),
  autoLockTimeout: z.enum(['1', '5', '15', '30', 'never']).default('5'),
  requireBiometricForSignature: z.boolean().default(true),
  twoFactorEnabled: z.boolean().default(false),
});

export type SecuritySettingsFormData = z.infer<typeof securitySettingsSchema>;

// Feedback validation schema
export const feedbackSchema = z.object({
  type: z.enum(['bug', 'feature', 'improvement', 'other']),
  subject: z
    .string({ required_error: 'Le sujet est requis' })
    .min(5, 'Le sujet doit contenir au moins 5 caracteres')
    .max(100, 'Le sujet ne peut pas depasser 100 caracteres'),
  message: z
    .string({ required_error: 'Le message est requis' })
    .min(20, 'Le message doit contenir au moins 20 caracteres')
    .max(2000, 'Le message ne peut pas depasser 2000 caracteres'),
  attachments: z
    .array(z.string())
    .max(5, 'Vous ne pouvez pas joindre plus de 5 fichiers')
    .optional(),
});

export type FeedbackFormData = z.infer<typeof feedbackSchema>;
