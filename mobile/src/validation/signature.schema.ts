import { z } from 'zod';

// Signature creation validation schema
export const signatureCreateSchema = z.object({
  type: z.enum(['formal', 'initials', 'paraph'], {
    required_error: 'Le type de signature est requis',
  }),
  imageData: z
    .string({ required_error: 'La signature est requise' })
    .min(1, 'La signature est requise'),
  isDefault: z.boolean().default(false),
});

export type SignatureCreateFormData = z.infer<typeof signatureCreateSchema>;

// Document signature validation schema
export const documentSignatureSchema = z.object({
  documentId: z.string({ required_error: 'Le document est requis' }),
  signatureId: z.string({ required_error: 'La signature est requise' }),
  page: z.number().min(1).default(1),
  position: z.object({
    x: z.number().min(0),
    y: z.number().min(0),
  }).optional(),
  reason: z
    .string()
    .max(500, 'La raison ne peut pas depasser 500 caracteres')
    .optional(),
});

export type DocumentSignatureFormData = z.infer<typeof documentSignatureSchema>;

// Signature with biometric validation
export const signatureWithBiometricSchema = z.object({
  signatureId: z.string({ required_error: 'La signature est requise' }),
  biometricVerified: z
    .boolean()
    .refine((val) => val === true, 'L\'authentification biometrique est requise'),
  location: z.object({
    latitude: z.number(),
    longitude: z.number(),
    accuracy: z.number().optional(),
    address: z.string().optional(),
  }).optional(),
  timestamp: z.string(),
  deviceInfo: z.object({
    deviceId: z.string(),
    deviceName: z.string().optional(),
    osName: z.string().optional(),
    osVersion: z.string().optional(),
  }).optional(),
});

export type SignatureWithBiometricFormData = z.infer<typeof signatureWithBiometricSchema>;

// Signature verification request
export const signatureVerificationSchema = z.object({
  signatureId: z.string(),
  documentId: z.string(),
  hash: z.string(),
});

export type SignatureVerificationFormData = z.infer<typeof signatureVerificationSchema>;
