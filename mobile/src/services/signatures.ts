import * as Crypto from 'expo-crypto';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import api from './api';
import { cacheStorage, secureStorage, storage } from '@/utils/storage';
import {
  authenticateWithBiometrics,
  authenticateForSignature,
  checkBiometricAvailability,
} from '@/utils/biometric';
import {
  getCurrentLocationWithAddress,
  getLocationForSignature,
  LocationData,
} from '@/utils/location';
import { UserSignature, DocumentSignature, Document } from '@/types';
import { SIGNATURE_CONFIG, CACHE_CONFIG } from '@/constants/config';

// Types
export interface SignDocumentData {
  signatureId: string;
  page: number;
  position: { x: number; y: number };
  size?: { width: number; height: number };
  location?: LocationData;
  reason?: string;
}

export interface SignatureAuthResult {
  success: boolean;
  method: 'biometric' | 'pin';
  timestamp: string;
  error?: string;
}

export interface SignatureVerification {
  valid: boolean;
  signer: {
    name: string;
    email: string;
  };
  timestamp: string;
  location?: LocationData;
  certificate: {
    issuer: string;
    serial: string;
    validFrom: string;
    validTo: string;
  };
  integrity: {
    documentHash: string;
    signatureHash: string;
    matched: boolean;
  };
}

export interface SignaturePosition {
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SignatureField {
  id: string;
  label: string;
  required: boolean;
  type: 'signature' | 'initials' | 'date' | 'text';
  position: SignaturePosition;
  signedBy?: {
    userId: string;
    signatureId: string;
    timestamp: string;
  };
}

export interface SigningSession {
  id: string;
  documentId: string;
  document: Document;
  fields: SignatureField[];
  status: 'pending' | 'in_progress' | 'completed' | 'expired';
  expiresAt: string;
  createdAt: string;
}

// Generate signature hash
async function generateSignatureHash(
  signatureId: string,
  documentId: string,
  timestamp: string
): Promise<string> {
  const data = `${signatureId}:${documentId}:${timestamp}`;
  return await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, data);
}

export const signaturesService = {
  // User signatures management
  async getUserSignatures(): Promise<UserSignature[]> {
    const cacheKey = 'user_signatures';
    const cached = await cacheStorage.get<UserSignature[]>(cacheKey);

    if (cached) {
      return cached;
    }

    const signatures = await api.get<UserSignature[]>('/user-signatures/');
    await cacheStorage.set(cacheKey, signatures, CACHE_CONFIG.USER_TTL);
    return signatures;
  },

  async getSignature(id: string): Promise<UserSignature> {
    return await api.get<UserSignature>(`/user-signatures/${id}/`);
  },

  async createSignature(
    type: 'formal' | 'initials' | 'paraph',
    imageData: string,
    options?: { setAsDefault?: boolean }
  ): Promise<UserSignature> {
    const signature = await api.post<UserSignature>('/user-signatures/', {
      type,
      image_data: imageData,
      set_as_default: options?.setAsDefault ?? false,
    });

    await cacheStorage.invalidate('user_signatures');
    return signature;
  },

  async updateSignature(id: string, imageData: string): Promise<UserSignature> {
    const signature = await api.patch<UserSignature>(`/user-signatures/${id}/`, {
      image_data: imageData,
    });

    await cacheStorage.invalidate('user_signatures');
    return signature;
  },

  async deleteSignature(id: string): Promise<void> {
    await api.delete(`/user-signatures/${id}/`);
    await cacheStorage.invalidate('user_signatures');
  },

  async setDefaultSignature(id: string): Promise<UserSignature> {
    const signature = await api.post<UserSignature>(`/user-signatures/${id}/set-default/`);
    await cacheStorage.invalidate('user_signatures');
    return signature;
  },

  async getDefaultSignature(): Promise<UserSignature | null> {
    const signatures = await this.getUserSignatures();
    return signatures.find((s) => s.isDefault) || signatures[0] || null;
  },

  // Authentication for signing
  async authenticateForSigning(): Promise<SignatureAuthResult> {
    const timestamp = new Date().toISOString();

    // Try biometric first
    const biometricStatus = await checkBiometricAvailability();

    if (biometricStatus.isAvailable && biometricStatus.isEnrolled) {
      const result = await authenticateForSignature();

      if (result.success) {
        return {
          success: true,
          method: 'biometric',
          timestamp,
        };
      }

      // If biometric failed but not cancelled, fall through to PIN
      if (result.errorCode === 'USER_CANCEL') {
        return {
          success: false,
          method: 'biometric',
          timestamp,
          error: result.error,
        };
      }
    }

    // Biometric not available or failed, return pending for PIN
    return {
      success: false,
      method: 'pin',
      timestamp,
      error: 'PIN required',
    };
  },

  // Document signing
  async signDocument(
    documentId: string,
    data: SignDocumentData,
    authResult: SignatureAuthResult
  ): Promise<DocumentSignature> {
    // Get location if not provided
    let location = data.location;
    if (!location) {
      location = await getLocationForSignature(10000) || undefined;
    }

    // Generate signature hash
    const hash = await generateSignatureHash(
      data.signatureId,
      documentId,
      authResult.timestamp
    );

    const signature = await api.post<DocumentSignature>(`/documents/${documentId}/sign/`, {
      signature_id: data.signatureId,
      page: data.page,
      position: data.position,
      size: data.size || {
        width: SIGNATURE_CONFIG.MIN_WIDTH,
        height: SIGNATURE_CONFIG.MIN_HEIGHT,
      },
      location: location
        ? {
            latitude: location.latitude,
            longitude: location.longitude,
            accuracy: location.accuracy,
            address: location.address,
            city: location.city,
            country: location.country,
          }
        : undefined,
      reason: data.reason,
      auth_method: authResult.method,
      auth_timestamp: authResult.timestamp,
      signature_hash: hash,
    });

    // Invalidate document cache
    await cacheStorage.invalidate(`document_${documentId}`);
    await cacheStorage.invalidate('documents_');

    return signature;
  },

  // Batch signing for multiple fields
  async signMultipleFields(
    documentId: string,
    fields: Array<{
      fieldId: string;
      signatureId: string;
      position: SignaturePosition;
    }>,
    authResult: SignatureAuthResult
  ): Promise<DocumentSignature[]> {
    const location = await getLocationForSignature(10000) || undefined;

    const signatures = await api.post<DocumentSignature[]>(
      `/documents/${documentId}/sign-multiple/`,
      {
        fields: fields.map((field) => ({
          field_id: field.fieldId,
          signature_id: field.signatureId,
          page: field.position.page,
          position: { x: field.position.x, y: field.position.y },
          size: { width: field.position.width, height: field.position.height },
        })),
        location: location
          ? {
              latitude: location.latitude,
              longitude: location.longitude,
              address: location.address,
            }
          : undefined,
        auth_method: authResult.method,
        auth_timestamp: authResult.timestamp,
      }
    );

    await cacheStorage.invalidate(`document_${documentId}`);
    return signatures;
  },

  // Get document signatures
  async getDocumentSignatures(documentId: string): Promise<DocumentSignature[]> {
    return await api.get<DocumentSignature[]>(`/documents/${documentId}/signatures/`);
  },

  // Verify signature
  async verifySignature(signatureId: string): Promise<SignatureVerification> {
    return await api.get<SignatureVerification>(`/signatures/${signatureId}/verify/`);
  },

  // Get signature fields for a document
  async getSignatureFields(documentId: string): Promise<SignatureField[]> {
    return await api.get<SignatureField[]>(`/documents/${documentId}/signature-fields/`);
  },

  // Signing sessions
  async getSigningSession(sessionId: string): Promise<SigningSession> {
    return await api.get<SigningSession>(`/signing-sessions/${sessionId}/`);
  },

  async getMySigningSessions(): Promise<SigningSession[]> {
    const response = await api.get<{ results: SigningSession[] }>('/signing-sessions/my/');
    return response.results;
  },

  async completeSigningSession(sessionId: string): Promise<void> {
    await api.post(`/signing-sessions/${sessionId}/complete/`);
  },

  // Signature PIN management
  async hasSignaturePin(): Promise<boolean> {
    const pin = await secureStorage.getItem('signature_pin_hash');
    return !!pin;
  },

  async setSignaturePin(pin: string): Promise<void> {
    // Hash the PIN locally for quick verification
    const pinHash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      pin
    );
    await secureStorage.setItem('signature_pin_hash', pinHash);

    // Also register on server
    await api.post('/user-signatures/set-pin/', { pin });
  },

  async verifyPin(pin: string): Promise<boolean> {
    // Quick local verification first
    const storedHash = await secureStorage.getItem('signature_pin_hash');
    if (storedHash) {
      const inputHash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        pin
      );
      return storedHash === inputHash;
    }

    // Fallback to server verification
    try {
      await api.post('/user-signatures/verify-pin/', { pin });
      return true;
    } catch {
      return false;
    }
  },

  async changeSignaturePin(oldPin: string, newPin: string): Promise<boolean> {
    const isValid = await this.verifyPin(oldPin);
    if (!isValid) {
      return false;
    }

    await this.setSignaturePin(newPin);
    return true;
  },

  // Signature certificate
  async getSignatureCertificate(signatureId: string): Promise<string> {
    const blob = await api.downloadFile(`/signatures/${signatureId}/certificate/`);

    // Save to file
    const fileName = `signature_certificate_${signatureId}.pdf`;
    const fileUri = `${FileSystem.documentDirectory}${fileName}`;

    // Convert blob to base64 and save
    const reader = new FileReader();
    return new Promise((resolve, reject) => {
      reader.onload = async () => {
        try {
          const base64 = (reader.result as string).split(',')[1];
          await FileSystem.writeAsStringAsync(fileUri, base64, {
            encoding: FileSystem.EncodingType.Base64,
          });
          resolve(fileUri);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  },

  async shareSignatureCertificate(signatureId: string): Promise<void> {
    const fileUri = await this.getSignatureCertificate(signatureId);

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Certificat de signature',
      });
    }
  },

  // Audit trail
  async getSignatureAuditTrail(
    documentId: string
  ): Promise<
    Array<{
      action: string;
      user: { name: string; email: string };
      timestamp: string;
      details: Record<string, unknown>;
    }>
  > {
    return await api.get(`/documents/${documentId}/signature-audit/`);
  },

  // Signature image utilities
  async saveSignatureLocally(
    signatureId: string,
    imageData: string
  ): Promise<string> {
    const fileName = `signature_${signatureId}.png`;
    const fileUri = `${FileSystem.documentDirectory}${fileName}`;

    // Remove data URL prefix if present
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');

    await FileSystem.writeAsStringAsync(fileUri, base64Data, {
      encoding: FileSystem.EncodingType.Base64,
    });

    return fileUri;
  },

  async loadLocalSignature(signatureId: string): Promise<string | null> {
    const fileName = `signature_${signatureId}.png`;
    const fileUri = `${FileSystem.documentDirectory}${fileName}`;

    try {
      const exists = await FileSystem.getInfoAsync(fileUri);
      if (exists.exists) {
        const base64 = await FileSystem.readAsStringAsync(fileUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        return `data:image/png;base64,${base64}`;
      }
    } catch {
      // File doesn't exist
    }

    return null;
  },

  // Signature validation
  validateSignatureImage(imageData: string): { valid: boolean; error?: string } {
    if (!imageData) {
      return { valid: false, error: 'Image de signature requise' };
    }

    // Check if it's a valid base64 image
    const isBase64 = /^data:image\/(png|jpeg|jpg);base64,/.test(imageData);
    if (!isBase64) {
      return { valid: false, error: 'Format d\'image invalide' };
    }

    // Check approximate size (base64 is ~33% larger than binary)
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
    const sizeInBytes = (base64Data.length * 3) / 4;
    const maxSize = 500 * 1024; // 500KB

    if (sizeInBytes > maxSize) {
      return { valid: false, error: 'Image trop volumineuse (max 500KB)' };
    }

    return { valid: true };
  },
};

export default signaturesService;
