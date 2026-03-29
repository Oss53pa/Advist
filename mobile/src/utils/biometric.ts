import * as LocalAuthentication from 'expo-local-authentication';
import * as Haptics from 'expo-haptics';
import { BIOMETRIC_CONFIG } from '@/constants/config';

export type BiometricType = 'fingerprint' | 'facial' | 'iris' | 'none';

export interface BiometricStatus {
  isAvailable: boolean;
  isEnrolled: boolean;
  biometricType: BiometricType;
  supportedTypes: LocalAuthentication.AuthenticationType[];
}

/**
 * Check if biometric authentication is available on the device
 */
export async function checkBiometricAvailability(): Promise<BiometricStatus> {
  try {
    const isAvailable = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

    let biometricType: BiometricType = 'none';

    if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      biometricType = 'facial';
    } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      biometricType = 'fingerprint';
    } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      biometricType = 'iris';
    }

    return {
      isAvailable,
      isEnrolled,
      biometricType,
      supportedTypes,
    };
  } catch (error) {
    console.error('Biometric availability check error:', error);
    return {
      isAvailable: false,
      isEnrolled: false,
      biometricType: 'none',
      supportedTypes: [],
    };
  }
}

/**
 * Get human-readable biometric type name
 */
export function getBiometricTypeName(type: BiometricType): string {
  const names: Record<BiometricType, string> = {
    fingerprint: 'Touch ID',
    facial: 'Face ID',
    iris: 'Iris',
    none: 'Non disponible',
  };

  return names[type];
}

export interface AuthenticateOptions {
  promptMessage?: string;
  cancelLabel?: string;
  fallbackLabel?: string;
  disableDeviceFallback?: boolean;
}

export interface AuthenticateResult {
  success: boolean;
  error?: string;
  errorCode?: string;
}

/**
 * Authenticate user using biometrics
 */
export async function authenticateWithBiometrics(
  options: AuthenticateOptions = {}
): Promise<AuthenticateResult> {
  try {
    const status = await checkBiometricAvailability();

    if (!status.isAvailable) {
      return {
        success: false,
        error: 'L\'authentification biometrique n\'est pas disponible sur cet appareil',
        errorCode: 'NOT_AVAILABLE',
      };
    }

    if (!status.isEnrolled) {
      return {
        success: false,
        error: 'Aucune donnee biometrique n\'est configuree sur cet appareil',
        errorCode: 'NOT_ENROLLED',
      };
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: options.promptMessage || BIOMETRIC_CONFIG.PROMPT_MESSAGE,
      cancelLabel: options.cancelLabel || BIOMETRIC_CONFIG.CANCEL_LABEL,
      fallbackLabel: options.fallbackLabel || BIOMETRIC_CONFIG.FALLBACK_LABEL,
      disableDeviceFallback: options.disableDeviceFallback || false,
    });

    if (result.success) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return { success: true };
    }

    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

    let error = 'Authentification echouee';
    let errorCode = 'UNKNOWN';

    if (result.error === 'user_cancel') {
      error = 'Authentification annulee';
      errorCode = 'USER_CANCEL';
    } else if (result.error === 'user_fallback') {
      error = 'Fallback vers code PIN';
      errorCode = 'USER_FALLBACK';
    } else if (result.error === 'system_cancel') {
      error = 'Authentification annulee par le systeme';
      errorCode = 'SYSTEM_CANCEL';
    } else if (result.error === 'lockout') {
      error = 'Trop de tentatives. Reessayez plus tard';
      errorCode = 'LOCKOUT';
    } else if (result.error === 'lockout_permanent') {
      error = 'Biometrie desactivee. Utilisez votre code PIN';
      errorCode = 'LOCKOUT_PERMANENT';
    }

    return { success: false, error, errorCode };
  } catch (error) {
    console.error('Biometric authentication error:', error);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    return {
      success: false,
      error: 'Une erreur est survenue lors de l\'authentification',
      errorCode: 'ERROR',
    };
  }
}

/**
 * Authenticate for sensitive actions (like signing)
 */
export async function authenticateForSignature(): Promise<AuthenticateResult> {
  return authenticateWithBiometrics({
    promptMessage: 'Authentifiez-vous pour signer le document',
    disableDeviceFallback: false,
  });
}

/**
 * Authenticate for app unlock
 */
export async function authenticateForUnlock(): Promise<AuthenticateResult> {
  return authenticateWithBiometrics({
    promptMessage: 'Deverrouillez Advist',
    disableDeviceFallback: false,
  });
}
