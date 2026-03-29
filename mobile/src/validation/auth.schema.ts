import { z } from 'zod';

// Login validation schema
export const loginSchema = z.object({
  email: z
    .string({ required_error: 'L\'email est requis' })
    .min(1, 'L\'email est requis')
    .email('Format d\'email invalide'),
  password: z
    .string({ required_error: 'Le mot de passe est requis' })
    .min(1, 'Le mot de passe est requis')
    .min(8, 'Le mot de passe doit contenir au moins 8 caracteres'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// Register validation schema
export const registerSchema = z.object({
  firstName: z
    .string({ required_error: 'Le prenom est requis' })
    .min(1, 'Le prenom est requis')
    .min(2, 'Le prenom doit contenir au moins 2 caracteres')
    .max(50, 'Le prenom ne peut pas depasser 50 caracteres')
    .regex(/^[a-zA-ZÀ-ÿ\s-]+$/, 'Le prenom ne peut contenir que des lettres'),
  lastName: z
    .string({ required_error: 'Le nom est requis' })
    .min(1, 'Le nom est requis')
    .min(2, 'Le nom doit contenir au moins 2 caracteres')
    .max(50, 'Le nom ne peut pas depasser 50 caracteres')
    .regex(/^[a-zA-ZÀ-ÿ\s-]+$/, 'Le nom ne peut contenir que des lettres'),
  email: z
    .string({ required_error: 'L\'email est requis' })
    .min(1, 'L\'email est requis')
    .email('Format d\'email invalide'),
  password: z
    .string({ required_error: 'Le mot de passe est requis' })
    .min(8, 'Le mot de passe doit contenir au moins 8 caracteres')
    .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
    .regex(/[a-z]/, 'Le mot de passe doit contenir au moins une minuscule')
    .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre')
    .regex(/[^A-Za-z0-9]/, 'Le mot de passe doit contenir au moins un caractere special'),
  confirmPassword: z
    .string({ required_error: 'La confirmation du mot de passe est requise' })
    .min(1, 'La confirmation du mot de passe est requise'),
  organizationCode: z
    .string()
    .optional(),
  acceptTerms: z
    .boolean()
    .refine((val) => val === true, 'Vous devez accepter les conditions d\'utilisation'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
});

export type RegisterFormData = z.infer<typeof registerSchema>;

// Forgot password validation schema
export const forgotPasswordSchema = z.object({
  email: z
    .string({ required_error: 'L\'email est requis' })
    .min(1, 'L\'email est requis')
    .email('Format d\'email invalide'),
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

// Reset password validation schema
export const resetPasswordSchema = z.object({
  code: z
    .string({ required_error: 'Le code est requis' })
    .min(6, 'Le code doit contenir 6 caracteres')
    .max(6, 'Le code doit contenir 6 caracteres'),
  password: z
    .string({ required_error: 'Le mot de passe est requis' })
    .min(8, 'Le mot de passe doit contenir au moins 8 caracteres')
    .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
    .regex(/[a-z]/, 'Le mot de passe doit contenir au moins une minuscule')
    .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre')
    .regex(/[^A-Za-z0-9]/, 'Le mot de passe doit contenir au moins un caractere special'),
  confirmPassword: z
    .string({ required_error: 'La confirmation du mot de passe est requise' })
    .min(1, 'La confirmation du mot de passe est requise'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
});

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

// Change password validation schema
export const changePasswordSchema = z.object({
  currentPassword: z
    .string({ required_error: 'Le mot de passe actuel est requis' })
    .min(1, 'Le mot de passe actuel est requis'),
  newPassword: z
    .string({ required_error: 'Le nouveau mot de passe est requis' })
    .min(8, 'Le mot de passe doit contenir au moins 8 caracteres')
    .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
    .regex(/[a-z]/, 'Le mot de passe doit contenir au moins une minuscule')
    .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre')
    .regex(/[^A-Za-z0-9]/, 'Le mot de passe doit contenir au moins un caractere special'),
  confirmNewPassword: z
    .string({ required_error: 'La confirmation du mot de passe est requise' })
    .min(1, 'La confirmation du mot de passe est requise'),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmNewPassword'],
}).refine((data) => data.currentPassword !== data.newPassword, {
  message: 'Le nouveau mot de passe doit etre different de l\'ancien',
  path: ['newPassword'],
});

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
