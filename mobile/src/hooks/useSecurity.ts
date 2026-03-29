import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import {
  securityService,
  SecurityConfig,
  SecurityAuditLog,
} from '@/services/security';

// Query keys
export const securityKeys = {
  all: ['security'] as const,
  config: () => [...securityKeys.all, 'config'] as const,
  tokenStatus: () => [...securityKeys.all, 'tokenStatus'] as const,
  sessionStatus: () => [...securityKeys.all, 'sessionStatus'] as const,
  lockoutStatus: () => [...securityKeys.all, 'lockoutStatus'] as const,
  biometricStatus: () => [...securityKeys.all, 'biometricStatus'] as const,
  pinStatus: () => [...securityKeys.all, 'pinStatus'] as const,
  deviceInfo: () => [...securityKeys.all, 'deviceInfo'] as const,
  auditLogs: () => [...securityKeys.all, 'auditLogs'] as const,
};

// Security configuration
export function useSecurityConfig() {
  return useQuery({
    queryKey: securityKeys.config(),
    queryFn: () => securityService.getConfig(),
    staleTime: Infinity,
  });
}

export function useUpdateSecurityConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updates: Partial<SecurityConfig>) =>
      securityService.updateConfig(updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: securityKeys.config() });
    },
  });
}

// Token management
export function useTokenStatus() {
  return useQuery({
    queryKey: securityKeys.tokenStatus(),
    queryFn: async () => {
      const accessValid = await securityService.validateAccessToken();
      const refreshValid = await securityService.validateRefreshToken();
      const accessToken = await securityService.getAccessToken();
      const expiresAt = accessToken
        ? securityService.getTokenExpirationTime(accessToken)
        : null;
      const timeUntilExpiration = accessToken
        ? securityService.getTimeUntilExpiration(accessToken)
        : 0;

      return {
        accessValid,
        refreshValid,
        expiresAt,
        timeUntilExpiration,
        isExpiringSoon: timeUntilExpiration < 300, // Less than 5 minutes
      };
    },
    refetchInterval: 60000, // Check every minute
  });
}

export function useStoreTokens() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      accessToken,
      refreshToken,
    }: {
      accessToken: string;
      refreshToken: string;
    }) => securityService.storeTokens(accessToken, refreshToken),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: securityKeys.tokenStatus() });
    },
  });
}

export function useClearTokens() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => securityService.clearTokens(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: securityKeys.tokenStatus() });
    },
  });
}

// Session management
export function useSessionStatus() {
  return useQuery({
    queryKey: securityKeys.sessionStatus(),
    queryFn: () => securityService.isSessionValid(),
    refetchInterval: 30000, // Check every 30 seconds
  });
}

export function useStartSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => securityService.startSession(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: securityKeys.sessionStatus() });
    },
  });
}

export function useEndSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => securityService.endSession(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: securityKeys.sessionStatus() });
    },
  });
}

export function useUpdateActivity() {
  return useMutation({
    mutationFn: () => securityService.updateLastActivity(),
  });
}

// Auto activity update hook
export function useAutoActivityTracking(enabled = true) {
  const updateActivity = useUpdateActivity();
  const lastUpdate = useRef(Date.now());

  useEffect(() => {
    if (!enabled) return;

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // Only update if more than 1 minute since last update
        if (Date.now() - lastUpdate.current > 60000) {
          updateActivity.mutate();
          lastUpdate.current = Date.now();
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Update activity on mount
    updateActivity.mutate();

    // Update every 5 minutes while active
    const interval = setInterval(() => {
      if (AppState.currentState === 'active') {
        updateActivity.mutate();
        lastUpdate.current = Date.now();
      }
    }, 5 * 60 * 1000);

    return () => {
      subscription.remove();
      clearInterval(interval);
    };
  }, [enabled, updateActivity]);
}

// Lockout status
export function useLockoutStatus() {
  return useQuery({
    queryKey: securityKeys.lockoutStatus(),
    queryFn: () => securityService.isAccountLocked(),
    refetchInterval: (data) => {
      // Poll every second if locked
      if (data?.locked) return 1000;
      return false;
    },
  });
}

export function useRecordLoginAttempt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (success: boolean) => securityService.recordLoginAttempt(success),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: securityKeys.lockoutStatus() });
    },
  });
}

// Biometric authentication
export function useBiometricStatus() {
  return useQuery({
    queryKey: securityKeys.biometricStatus(),
    queryFn: async () => {
      const available = await securityService.isBiometricAvailable();
      const type = available ? await securityService.getBiometricType() : null;

      return {
        available,
        type,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useAuthenticateWithBiometric() {
  return useMutation({
    mutationFn: (reason?: string) => securityService.authenticateWithBiometric(reason),
  });
}

// PIN management
export function usePinStatus() {
  return useQuery({
    queryKey: securityKeys.pinStatus(),
    queryFn: () => securityService.hasPIN(),
    staleTime: Infinity,
  });
}

export function useSetPIN() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (pin: string) => securityService.setPIN(pin),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: securityKeys.pinStatus() });
    },
  });
}

export function useVerifyPIN() {
  return useMutation({
    mutationFn: (pin: string) => securityService.verifyPIN(pin),
  });
}

export function useRemovePIN() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => securityService.removePIN(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: securityKeys.pinStatus() });
    },
  });
}

// Device security info
export function useDeviceSecurityInfo() {
  return useQuery({
    queryKey: securityKeys.deviceInfo(),
    queryFn: () => securityService.getDeviceSecurityInfo(),
    staleTime: Infinity,
  });
}

// Audit logs
export function useSecurityAuditLogs(limit = 50) {
  return useQuery({
    queryKey: [...securityKeys.auditLogs(), limit],
    queryFn: () => securityService.getSecurityAuditLogs(limit),
  });
}

export function useClearSecurityAuditLogs() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => securityService.clearSecurityAuditLogs(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: securityKeys.auditLogs() });
    },
  });
}

// Sensitive action protection
export function useRequireAuthForSensitiveAction() {
  return useMutation({
    mutationFn: (action: string) => securityService.requireAuthForSensitiveAction(action),
  });
}

// Encryption utilities
export function useEncryption() {
  const encrypt = useCallback(async (data: string) => {
    return securityService.encryptSensitiveData(data);
  }, []);

  const decrypt = useCallback(async (encryptedData: string) => {
    return securityService.decryptSensitiveData(encryptedData);
  }, []);

  const hash = useCallback(async (data: string) => {
    return securityService.hashData(data);
  }, []);

  const generateRandom = useCallback(async (byteCount = 32) => {
    return securityService.generateSecureRandom(byteCount);
  }, []);

  return { encrypt, decrypt, hash, generateRandom };
}

// Clear all security data
export function useClearAllSecurityData() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => securityService.clearAllSecurityData(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: securityKeys.all });
    },
  });
}

// Combined security status hook
export function useSecurityStatus() {
  const { data: tokenStatus } = useTokenStatus();
  const { data: sessionStatus } = useSessionStatus();
  const { data: lockoutStatus } = useLockoutStatus();
  const { data: biometricStatus } = useBiometricStatus();
  const { data: hasPIN } = usePinStatus();
  const { data: deviceInfo } = useDeviceSecurityInfo();

  return {
    tokenStatus,
    sessionStatus,
    lockoutStatus,
    biometricStatus,
    hasPIN,
    deviceInfo,
    isSecure:
      !lockoutStatus?.locked &&
      sessionStatus &&
      tokenStatus?.accessValid &&
      deviceInfo?.securityLevel !== 'low',
  };
}

// Session timeout handler
export function useSessionTimeoutHandler(onTimeout: () => void) {
  const { data: isValid } = useSessionStatus();

  useEffect(() => {
    if (isValid === false) {
      onTimeout();
    }
  }, [isValid, onTimeout]);
}

// Token expiration handler
export function useTokenExpirationHandler(onExpiring: () => void, onExpired: () => void) {
  const { data: tokenStatus } = useTokenStatus();

  useEffect(() => {
    if (!tokenStatus) return;

    if (!tokenStatus.accessValid && !tokenStatus.refreshValid) {
      onExpired();
    } else if (tokenStatus.isExpiringSoon) {
      onExpiring();
    }
  }, [tokenStatus, onExpiring, onExpired]);
}
