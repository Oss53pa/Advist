import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { useCallback } from 'react';
import {
  profileService,
  UpdateProfileData,
  ChangePasswordData,
  SecuritySettings,
  AppSettings,
  TwoFactorSetup,
} from '@/services/profile';

// Query keys
export const profileKeys = {
  all: ['profile'] as const,
  user: () => [...profileKeys.all, 'user'] as const,
  security: () => [...profileKeys.all, 'security'] as const,
  devices: () => [...profileKeys.all, 'devices'] as const,
  activity: () => [...profileKeys.all, 'activity'] as const,
  appSettings: () => [...profileKeys.all, 'appSettings'] as const,
  storage: () => [...profileKeys.all, 'storage'] as const,
  biometric: () => [...profileKeys.all, 'biometric'] as const,
  helpArticles: (query?: string) => [...profileKeys.all, 'help', query] as const,
};

// Profile queries
export function useProfile() {
  return useQuery({
    queryKey: profileKeys.user(),
    queryFn: () => profileService.getProfile(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useSecuritySettings() {
  return useQuery({
    queryKey: profileKeys.security(),
    queryFn: () => profileService.getSecuritySettings(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useTrustedDevices() {
  return useQuery({
    queryKey: profileKeys.devices(),
    queryFn: () => profileService.getTrustedDevices(),
  });
}

export function useActivityLog() {
  return useInfiniteQuery({
    queryKey: profileKeys.activity(),
    queryFn: ({ pageParam = 1 }) => profileService.getActivityLog(pageParam),
    getNextPageParam: (lastPage) => {
      if (!lastPage.next) return undefined;
      const url = new URL(lastPage.next);
      return Number(url.searchParams.get('page'));
    },
    initialPageParam: 1,
  });
}

export function useAppSettings() {
  return useQuery({
    queryKey: profileKeys.appSettings(),
    queryFn: () => profileService.getAppSettings(),
    staleTime: Infinity, // Local settings don't become stale
  });
}

export function useStorageInfo() {
  return useQuery({
    queryKey: profileKeys.storage(),
    queryFn: () => profileService.getStorageInfo(),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

export function useBiometricStatus() {
  return useQuery({
    queryKey: profileKeys.biometric(),
    queryFn: () => profileService.getBiometricStatus(),
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useHelpArticles(query?: string) {
  return useQuery({
    queryKey: profileKeys.helpArticles(query),
    queryFn: () => profileService.getHelpArticles(query),
    enabled: true,
  });
}

// Profile mutations
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateProfileData) => profileService.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.user() });
    },
  });
}

export function usePickAvatar() {
  return useMutation({
    mutationFn: () => profileService.pickAvatar(),
  });
}

export function useTakeAvatarPhoto() {
  return useMutation({
    mutationFn: () => profileService.takeAvatarPhoto(),
  });
}

export function useUploadAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (imageUri: string) => profileService.uploadAvatar(imageUri),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.user() });
    },
  });
}

export function useRemoveAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => profileService.removeAvatar(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.user() });
    },
  });
}

// Password mutations
export function useChangePassword() {
  return useMutation({
    mutationFn: (data: ChangePasswordData) => profileService.changePassword(data),
  });
}

export function useValidatePassword() {
  const validate = useCallback((password: string) => {
    return profileService.validatePassword(password);
  }, []);

  return { validate };
}

// Security mutations
export function useUpdateSecuritySettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (settings: Partial<Omit<SecuritySettings, 'trustedDevices'>>) =>
      profileService.updateSecuritySettings(settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.security() });
    },
  });
}

export function useSetupTwoFactor() {
  return useMutation({
    mutationFn: (method: '2fa_app' | 'sms' | 'email') => profileService.setupTwoFactor(method),
  });
}

export function useVerifyTwoFactorSetup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (code: string) => profileService.verifyTwoFactorSetup(code),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.security() });
    },
  });
}

export function useDisableTwoFactor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (password: string) => profileService.disableTwoFactor(password),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.security() });
    },
  });
}

export function useRegenerateBackupCodes() {
  return useMutation({
    mutationFn: (password: string) => profileService.regenerateBackupCodes(password),
  });
}

// Device mutations
export function useRemoveTrustedDevice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (deviceId: string) => profileService.removeTrustedDevice(deviceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.devices() });
      queryClient.invalidateQueries({ queryKey: profileKeys.security() });
    },
  });
}

export function useRemoveAllOtherDevices() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => profileService.removeAllOtherDevices(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.devices() });
      queryClient.invalidateQueries({ queryKey: profileKeys.security() });
    },
  });
}

// App settings mutations
export function useUpdateAppSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (settings: Partial<AppSettings>) => profileService.updateAppSettings(settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.appSettings() });
    },
  });
}

export function useResetAppSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => profileService.resetAppSettings(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.appSettings() });
    },
  });
}

// Storage mutations
export function useClearCache() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => profileService.clearCache(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.storage() });
    },
  });
}

export function useClearOfflineData() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => profileService.clearOfflineData(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.storage() });
    },
  });
}

// Biometric mutations
export function useEnableBiometric() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => profileService.enableBiometric(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.biometric() });
      queryClient.invalidateQueries({ queryKey: profileKeys.security() });
    },
  });
}

export function useDisableBiometric() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => profileService.disableBiometric(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.biometric() });
      queryClient.invalidateQueries({ queryKey: profileKeys.security() });
    },
  });
}

// Data export mutations
export function useRequestDataExport() {
  return useMutation({
    mutationFn: () => profileService.requestDataExport(),
  });
}

export function useDataExportStatus(requestId: string, enabled = true) {
  return useQuery({
    queryKey: [...profileKeys.all, 'export', requestId],
    queryFn: () => profileService.getDataExportStatus(requestId),
    enabled: enabled && !!requestId,
    refetchInterval: (data) => {
      // Poll every 5 seconds if still processing
      if (data?.status === 'pending' || data?.status === 'processing') {
        return 5000;
      }
      return false;
    },
  });
}

// Account deletion mutation
export function useRequestAccountDeletion() {
  return useMutation({
    mutationFn: ({ password, reason }: { password: string; reason?: string }) =>
      profileService.requestAccountDeletion(password, reason),
  });
}

// Email verification mutations
export function useResendVerificationEmail() {
  return useMutation({
    mutationFn: () => profileService.resendVerificationEmail(),
  });
}

export function useVerifyEmail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (token: string) => profileService.verifyEmail(token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.user() });
    },
  });
}

// Feedback mutation
export function useSubmitFeedback() {
  return useMutation({
    mutationFn: (data: { type: 'bug' | 'feature' | 'general'; message: string; attachments?: string[] }) =>
      profileService.submitFeedback(data),
  });
}

// Combined hooks
export function useProfileWithSettings() {
  const profile = useProfile();
  const appSettings = useAppSettings();
  const securitySettings = useSecuritySettings();

  return {
    profile: profile.data,
    appSettings: appSettings.data,
    securitySettings: securitySettings.data,
    isLoading: profile.isLoading || appSettings.isLoading || securitySettings.isLoading,
    isError: profile.isError || appSettings.isError || securitySettings.isError,
    refetch: () => {
      profile.refetch();
      appSettings.refetch();
      securitySettings.refetch();
    },
  };
}

export function useAvatarActions() {
  const pickAvatar = usePickAvatar();
  const takePhoto = useTakeAvatarPhoto();
  const uploadAvatar = useUploadAvatar();
  const removeAvatar = useRemoveAvatar();

  const handlePickAndUpload = async () => {
    const imageUri = await pickAvatar.mutateAsync();
    if (imageUri) {
      return uploadAvatar.mutateAsync(imageUri);
    }
    return null;
  };

  const handleTakePhotoAndUpload = async () => {
    const imageUri = await takePhoto.mutateAsync();
    if (imageUri) {
      return uploadAvatar.mutateAsync(imageUri);
    }
    return null;
  };

  return {
    pickAndUpload: handlePickAndUpload,
    takePhotoAndUpload: handleTakePhotoAndUpload,
    remove: removeAvatar.mutate,
    isPicking: pickAvatar.isPending,
    isTakingPhoto: takePhoto.isPending,
    isUploading: uploadAvatar.isPending,
    isRemoving: removeAvatar.isPending,
    isLoading: pickAvatar.isPending || takePhoto.isPending || uploadAvatar.isPending || removeAvatar.isPending,
  };
}
