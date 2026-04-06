/**
 * Schémas de validation partagés - ADVIST
 * Ces règles doivent être cohérentes entre Web et Mobile
 */
import { z } from 'zod';

// ============================================
// CONSTANTES DE VALIDATION
// ============================================

export const VALIDATION_RULES = {
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBER: true,
    REQUIRE_SPECIAL: true,
  },
  PHONE: {
    // Formats supportés : Côte d'Ivoire (+225), Sénégal (+221), France (+33), etc.
    PATTERNS: {
      CI: /^\+225[0-9]{10}$/, // Côte d'Ivoire: +225 XX XX XX XX XX
      SN: /^\+221[0-9]{9}$/, // Sénégal: +221 XX XXX XX XX
      ML: /^\+223[0-9]{8}$/, // Mali: +223 XX XX XX XX
      BF: /^\+226[0-9]{8}$/, // Burkina Faso: +226 XX XX XX XX
      BJ: /^\+229[0-9]{8}$/, // Bénin: +229 XX XX XX XX
      TG: /^\+228[0-9]{8}$/, // Togo: +228 XX XX XX XX
      NE: /^\+227[0-9]{8}$/, // Niger: +227 XX XX XX XX
      GN: /^\+224[0-9]{9}$/, // Guinée: +224 XXX XX XX XX
      CM: /^\+237[0-9]{9}$/, // Cameroun: +237 X XX XX XX XX
      FR: /^\+33[0-9]{9}$/, // France: +33 X XX XX XX XX
      BE: /^\+32[0-9]{8,9}$/, // Belgique: +32 XXX XX XX XX
      CH: /^\+41[0-9]{9}$/, // Suisse: +41 XX XXX XX XX
      CA: /^\+1[0-9]{10}$/, // Canada: +1 XXX XXX XXXX
    },
    // Pattern global qui accepte tous les formats africains et européens
    GLOBAL: /^\+[0-9]{1,4}[0-9]{8,12}$/,
  },
  NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 50,
    PATTERN: /^[a-zA-ZÀ-ÿ\s\-']+$/,
  },
  FILE: {
    MAX_SIZE_MB: 100,
    MAX_SIZE_BYTES: 100 * 1024 * 1024,
    ALLOWED_TYPES: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
    ],
    ALLOWED_EXTENSIONS: [
      '.pdf',
      '.doc',
      '.docx',
      '.xls',
      '.xlsx',
      '.ppt',
      '.pptx',
      '.jpg',
      '.jpeg',
      '.png',
      '.gif',
      '.webp',
    ],
  },
} as const;

// ============================================
// MESSAGES D'ERREUR (avec accents corrects)
// ============================================

export const VALIDATION_MESSAGES = {
  // Email
  EMAIL_REQUIRED: "L'email est requis",
  EMAIL_INVALID: "Format d'email invalide",

  // Mot de passe
  PASSWORD_REQUIRED: 'Le mot de passe est requis',
  PASSWORD_MIN_LENGTH: `Le mot de passe doit contenir au moins ${VALIDATION_RULES.PASSWORD.MIN_LENGTH} caractères`,
  PASSWORD_UPPERCASE: 'Le mot de passe doit contenir au moins une majuscule',
  PASSWORD_LOWERCASE: 'Le mot de passe doit contenir au moins une minuscule',
  PASSWORD_NUMBER: 'Le mot de passe doit contenir au moins un chiffre',
  PASSWORD_SPECIAL: 'Le mot de passe doit contenir au moins un caractère spécial (!@#$%^&*)',
  PASSWORD_MISMATCH: 'Les mots de passe ne correspondent pas',
  PASSWORD_DIFFERENT: "Le nouveau mot de passe doit être différent de l'ancien",

  // Nom/Prénom
  FIRST_NAME_REQUIRED: 'Le prénom est requis',
  LAST_NAME_REQUIRED: 'Le nom est requis',
  NAME_MIN_LENGTH: `Doit contenir au moins ${VALIDATION_RULES.NAME.MIN_LENGTH} caractères`,
  NAME_MAX_LENGTH: `Ne peut pas dépasser ${VALIDATION_RULES.NAME.MAX_LENGTH} caractères`,
  NAME_INVALID_CHARS: 'Ne peut contenir que des lettres, espaces et tirets',

  // Téléphone
  PHONE_INVALID: 'Format de téléphone invalide. Utilisez le format international (+225...)',

  // Fichiers
  FILE_TOO_LARGE: `La taille du fichier ne peut pas dépasser ${VALIDATION_RULES.FILE.MAX_SIZE_MB} Mo`,
  FILE_TYPE_INVALID: 'Type de fichier non supporté',

  // Général
  FIELD_REQUIRED: 'Ce champ est requis',
  TERMS_REQUIRED: "Vous devez accepter les conditions d'utilisation",
} as const;

// ============================================
// SCHÉMAS DE VALIDATION
// ============================================

/**
 * Validation d'email
 */
export const emailSchema = z
  .string({ required_error: VALIDATION_MESSAGES.EMAIL_REQUIRED })
  .min(1, VALIDATION_MESSAGES.EMAIL_REQUIRED)
  .email(VALIDATION_MESSAGES.EMAIL_INVALID);

/**
 * Validation de mot de passe (stricte - pour inscription/changement)
 */
export const passwordSchema = z
  .string({ required_error: VALIDATION_MESSAGES.PASSWORD_REQUIRED })
  .min(VALIDATION_RULES.PASSWORD.MIN_LENGTH, VALIDATION_MESSAGES.PASSWORD_MIN_LENGTH)
  .max(
    VALIDATION_RULES.PASSWORD.MAX_LENGTH,
    `Le mot de passe ne peut pas dépasser ${VALIDATION_RULES.PASSWORD.MAX_LENGTH} caractères`
  )
  .regex(/[A-Z]/, VALIDATION_MESSAGES.PASSWORD_UPPERCASE)
  .regex(/[a-z]/, VALIDATION_MESSAGES.PASSWORD_LOWERCASE)
  .regex(/[0-9]/, VALIDATION_MESSAGES.PASSWORD_NUMBER)
  // eslint-disable-next-line no-useless-escape
  .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, VALIDATION_MESSAGES.PASSWORD_SPECIAL);

/**
 * Validation de mot de passe (simple - pour connexion)
 */
export const passwordLoginSchema = z
  .string({ required_error: VALIDATION_MESSAGES.PASSWORD_REQUIRED })
  .min(1, VALIDATION_MESSAGES.PASSWORD_REQUIRED);

/**
 * Validation de téléphone international (optionnel)
 */
export const phoneSchema = z
  .string()
  .refine(
    (val) => {
      if (!val || val === '') return true; // Optionnel
      return VALIDATION_RULES.PHONE.GLOBAL.test(val);
    },
    { message: VALIDATION_MESSAGES.PHONE_INVALID }
  )
  .optional()
  .or(z.literal(''));

/**
 * Validation de prénom
 */
export const firstNameSchema = z
  .string({ required_error: VALIDATION_MESSAGES.FIRST_NAME_REQUIRED })
  .min(VALIDATION_RULES.NAME.MIN_LENGTH, VALIDATION_MESSAGES.NAME_MIN_LENGTH)
  .max(VALIDATION_RULES.NAME.MAX_LENGTH, VALIDATION_MESSAGES.NAME_MAX_LENGTH)
  .regex(VALIDATION_RULES.NAME.PATTERN, VALIDATION_MESSAGES.NAME_INVALID_CHARS);

/**
 * Validation de nom
 */
export const lastNameSchema = z
  .string({ required_error: VALIDATION_MESSAGES.LAST_NAME_REQUIRED })
  .min(VALIDATION_RULES.NAME.MIN_LENGTH, VALIDATION_MESSAGES.NAME_MIN_LENGTH)
  .max(VALIDATION_RULES.NAME.MAX_LENGTH, VALIDATION_MESSAGES.NAME_MAX_LENGTH)
  .regex(VALIDATION_RULES.NAME.PATTERN, VALIDATION_MESSAGES.NAME_INVALID_CHARS);

// ============================================
// SCHÉMAS COMPOSÉS
// ============================================

/**
 * Schéma de connexion
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: passwordLoginSchema,
});

/**
 * Schéma d'inscription - Étape 1 (Informations personnelles)
 */
export const registerStep1Schema = z.object({
  first_name: firstNameSchema,
  last_name: lastNameSchema,
  email: emailSchema,
  phone: phoneSchema,
});

/**
 * Schéma d'inscription - Étape 3 (Mot de passe)
 */
export const registerStep3Schema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string({ required_error: 'La confirmation du mot de passe est requise' }),
    plan: z.enum(['business', 'enterprise']),
    acceptTerms: z.boolean().refine((val) => val === true, {
      message: VALIDATION_MESSAGES.TERMS_REQUIRED,
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: VALIDATION_MESSAGES.PASSWORD_MISMATCH,
    path: ['confirmPassword'],
  });

/**
 * Schéma de changement de mot de passe
 */
export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string({ required_error: 'Le mot de passe actuel est requis' })
      .min(1, 'Le mot de passe actuel est requis'),
    newPassword: passwordSchema,
    confirmNewPassword: z
      .string({ required_error: 'La confirmation du mot de passe est requise' })
      .min(1, 'La confirmation du mot de passe est requise'),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: VALIDATION_MESSAGES.PASSWORD_MISMATCH,
    path: ['confirmNewPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: VALIDATION_MESSAGES.PASSWORD_DIFFERENT,
    path: ['newPassword'],
  });

/**
 * Schéma de réinitialisation de mot de passe
 */
export const resetPasswordSchema = z
  .object({
    code: z
      .string({ required_error: 'Le code est requis' })
      .length(6, 'Le code doit contenir 6 caractères'),
    password: passwordSchema,
    confirmPassword: z
      .string({ required_error: 'La confirmation du mot de passe est requise' })
      .min(1, 'La confirmation du mot de passe est requise'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: VALIDATION_MESSAGES.PASSWORD_MISMATCH,
    path: ['confirmPassword'],
  });

/**
 * Schéma de mot de passe oublié
 */
export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

/**
 * Schéma de mise à jour du profil
 */
export const profileUpdateSchema = z.object({
  firstName: firstNameSchema.optional(),
  lastName: lastNameSchema.optional(),
  phone: phoneSchema,
  avatar: z.string().url().optional().or(z.literal('')),
  language: z.enum(['fr', 'en']).optional(),
  timezone: z.string().optional(),
});

// ============================================
// TYPES EXPORTÉS
// ============================================

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterStep1FormData = z.infer<typeof registerStep1Schema>;
export type RegisterStep3FormData = z.infer<typeof registerStep3Schema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ProfileUpdateFormData = z.infer<typeof profileUpdateSchema>;
