import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  signaturesService,
  SignDocumentData,
  SignatureAuthResult,
  SignaturePosition,
} from '@/services/signatures';
import { UserSignature, DocumentSignature } from '@/types';

// Query keys
export const signatureKeys = {
  all: ['signatures'] as const,
  userSignatures: () => [...signatureKeys.all, 'user'] as const,
  userSignature: (id: string) => [...signatureKeys.userSignatures(), id] as const,
  documentSignatures: (documentId: string) => [...signatureKeys.all, 'document', documentId] as const,
  signatureFields: (documentId: string) => [...signatureKeys.all, 'fields', documentId] as const,
  verification: (signatureId: string) => [...signatureKeys.all, 'verification', signatureId] as const,
  auditTrail: (documentId: string) => [...signatureKeys.all, 'audit', documentId] as const,
  signingSessions: () => [...signatureKeys.all, 'sessions'] as const,
  signingSession: (sessionId: string) => [...signatureKeys.signingSessions(), sessionId] as const,
};

// User signatures
export function useUserSignatures() {
  return useQuery({
    queryKey: signatureKeys.userSignatures(),
    queryFn: () => signaturesService.getUserSignatures(),
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}

export function useUserSignature(id: string, enabled = true) {
  return useQuery({
    queryKey: signatureKeys.userSignature(id),
    queryFn: () => signaturesService.getSignature(id),
    enabled: enabled && !!id,
  });
}

export function useDefaultSignature() {
  return useQuery({
    queryKey: [...signatureKeys.userSignatures(), 'default'],
    queryFn: () => signaturesService.getDefaultSignature(),
    staleTime: 30 * 60 * 1000,
  });
}

// Document signatures
export function useDocumentSignatures(documentId: string, enabled = true) {
  return useQuery({
    queryKey: signatureKeys.documentSignatures(documentId),
    queryFn: () => signaturesService.getDocumentSignatures(documentId),
    enabled: enabled && !!documentId,
  });
}

export function useSignatureFields(documentId: string, enabled = true) {
  return useQuery({
    queryKey: signatureKeys.signatureFields(documentId),
    queryFn: () => signaturesService.getSignatureFields(documentId),
    enabled: enabled && !!documentId,
  });
}

export function useSignatureVerification(signatureId: string, enabled = true) {
  return useQuery({
    queryKey: signatureKeys.verification(signatureId),
    queryFn: () => signaturesService.verifySignature(signatureId),
    enabled: enabled && !!signatureId,
  });
}

export function useSignatureAuditTrail(documentId: string, enabled = true) {
  return useQuery({
    queryKey: signatureKeys.auditTrail(documentId),
    queryFn: () => signaturesService.getSignatureAuditTrail(documentId),
    enabled: enabled && !!documentId,
  });
}

// Signing sessions
export function useMySigningSessions() {
  return useQuery({
    queryKey: signatureKeys.signingSessions(),
    queryFn: () => signaturesService.getMySigningSessions(),
  });
}

export function useSigningSession(sessionId: string, enabled = true) {
  return useQuery({
    queryKey: signatureKeys.signingSession(sessionId),
    queryFn: () => signaturesService.getSigningSession(sessionId),
    enabled: enabled && !!sessionId,
  });
}

// Create signature mutation
export function useCreateSignature() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      type,
      imageData,
      setAsDefault,
    }: {
      type: 'formal' | 'initials' | 'paraph';
      imageData: string;
      setAsDefault?: boolean;
    }) => signaturesService.createSignature(type, imageData, { setAsDefault }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: signatureKeys.userSignatures() });
    },
  });
}

// Update signature mutation
export function useUpdateSignature() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, imageData }: { id: string; imageData: string }) =>
      signaturesService.updateSignature(id, imageData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: signatureKeys.userSignatures() });
    },
  });
}

// Delete signature mutation
export function useDeleteSignature() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => signaturesService.deleteSignature(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: signatureKeys.userSignatures() });
    },
  });
}

// Set default signature mutation
export function useSetDefaultSignature() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => signaturesService.setDefaultSignature(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: signatureKeys.userSignatures() });
    },
  });
}

// Sign document mutation
export function useSignDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      documentId,
      data,
    }: {
      documentId: string;
      data: SignDocumentData;
    }) => {
      // First authenticate
      const authResult = await signaturesService.authenticateForSigning();

      if (!authResult.success && authResult.method === 'pin') {
        // Return the auth result so the UI can prompt for PIN
        throw { type: 'PIN_REQUIRED', authResult };
      }

      if (!authResult.success) {
        throw new Error(authResult.error || 'Echec de l\'authentification');
      }

      // Then sign
      return signaturesService.signDocument(documentId, data, authResult);
    },
    onSuccess: (_, { documentId }) => {
      queryClient.invalidateQueries({ queryKey: signatureKeys.documentSignatures(documentId) });
      queryClient.invalidateQueries({ queryKey: signatureKeys.signatureFields(documentId) });
      // Also invalidate document queries
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
}

// Sign document with PIN mutation
export function useSignDocumentWithPin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      documentId,
      data,
      pin,
    }: {
      documentId: string;
      data: SignDocumentData;
      pin: string;
    }) => {
      // Verify PIN first
      const isValid = await signaturesService.verifyPin(pin);
      if (!isValid) {
        throw new Error('PIN invalide');
      }

      const authResult: SignatureAuthResult = {
        success: true,
        method: 'pin',
        timestamp: new Date().toISOString(),
      };

      return signaturesService.signDocument(documentId, data, authResult);
    },
    onSuccess: (_, { documentId }) => {
      queryClient.invalidateQueries({ queryKey: signatureKeys.documentSignatures(documentId) });
      queryClient.invalidateQueries({ queryKey: signatureKeys.signatureFields(documentId) });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
}

// Sign multiple fields mutation
export function useSignMultipleFields() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      documentId,
      fields,
    }: {
      documentId: string;
      fields: Array<{
        fieldId: string;
        signatureId: string;
        position: SignaturePosition;
      }>;
    }) => {
      const authResult = await signaturesService.authenticateForSigning();

      if (!authResult.success) {
        throw new Error(authResult.error || 'Echec de l\'authentification');
      }

      return signaturesService.signMultipleFields(documentId, fields, authResult);
    },
    onSuccess: (_, { documentId }) => {
      queryClient.invalidateQueries({ queryKey: signatureKeys.documentSignatures(documentId) });
      queryClient.invalidateQueries({ queryKey: signatureKeys.signatureFields(documentId) });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
}

// Complete signing session mutation
export function useCompleteSigningSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: string) => signaturesService.completeSigningSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: signatureKeys.signingSessions() });
    },
  });
}

// Set signature PIN mutation
export function useSetSignaturePin() {
  return useMutation({
    mutationFn: (pin: string) => signaturesService.setSignaturePin(pin),
  });
}

// Change signature PIN mutation
export function useChangeSignaturePin() {
  return useMutation({
    mutationFn: ({ oldPin, newPin }: { oldPin: string; newPin: string }) =>
      signaturesService.changeSignaturePin(oldPin, newPin),
  });
}

// Verify signature PIN
export function useVerifySignaturePin() {
  return useMutation({
    mutationFn: (pin: string) => signaturesService.verifyPin(pin),
  });
}

// Share signature certificate mutation
export function useShareSignatureCertificate() {
  return useMutation({
    mutationFn: (signatureId: string) =>
      signaturesService.shareSignatureCertificate(signatureId),
  });
}

// Check if user has signature PIN
export function useHasSignaturePin() {
  return useQuery({
    queryKey: [...signatureKeys.all, 'hasPin'],
    queryFn: () => signaturesService.hasSignaturePin(),
  });
}
