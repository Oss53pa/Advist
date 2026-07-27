import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Image,
  Switch,
} from 'react-native';
import { Link, router } from 'expo-router';
import * as Linking from 'expo-linking';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '@/store';
import { Button, Input } from '@/components/ui';
import { colors, spacing, typography } from '@/theme';
import { loginSchema } from '@/validation/auth.schema';
import { getBiometricTypeName } from '@/utils/biometric';

type FieldErrors = {
  email?: string;
  password?: string;
};

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [rememberDevice, setRememberDevice] = useState(false);
  const [enableBiometric, setEnableBiometric] = useState(false);

  const {
    login,
    loginWithBiometrics,
    isLoading,
    error,
    clearError,
    biometricStatus,
    checkBiometricStatus,
  } = useAuthStore();

  // Check biometric availability on mount
  useEffect(() => {
    checkBiometricStatus();
  }, [checkBiometricStatus]);

  // Validate form using Zod
  const validate = useCallback((): boolean => {
    const result = loginSchema.safeParse({ email, password });

    if (!result.success) {
      const fieldErrors: FieldErrors = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof FieldErrors;
        if (!fieldErrors[field]) {
          fieldErrors[field] = issue.message;
        }
      });
      setErrors(fieldErrors);
      return false;
    }

    setErrors({});
    return true;
  }, [email, password]);

  // Handle login with email/password
  const handleLogin = async () => {
    clearError();
    if (!validate()) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    try {
      await login(email, password, {
        rememberDevice,
        biometricEnabled: enableBiometric && biometricStatus?.available,
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(tabs)');
    } catch {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  // Handle biometric login
  const handleBiometricLogin = async () => {
    clearError();

    try {
      const result = await loginWithBiometrics();
      if (result.success) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace('/(tabs)');
      } else {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  // Get biometric icon based on type
  const getBiometricIcon = (): keyof typeof Ionicons.glyphMap => {
    if (biometricStatus?.type === 'facial') {
      return 'scan-outline';
    }
    return 'finger-print-outline';
  };

  const canUseBiometric = biometricStatus?.available && biometricStatus?.enabled;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Image
              source={require('../../assets/icon.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>Bienvenue</Text>
            <Text style={styles.subtitle}>
              Connectez-vous pour acceder a vos documents
            </Text>
          </View>

          {/* Biometric Login Button */}
          {canUseBiometric && (
            <TouchableOpacity
              style={styles.biometricButton}
              onPress={handleBiometricLogin}
              disabled={isLoading}
              activeOpacity={0.7}
            >
              <Ionicons
                name={getBiometricIcon()}
                size={48}
                color={colors.textPrimary}
              />
              <Text style={styles.biometricText}>
                Se connecter avec {getBiometricTypeName(biometricStatus.type as 'fingerprint' | 'facial' | 'iris' | 'none')}
              </Text>
            </TouchableOpacity>
          )}

          {canUseBiometric && (
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>ou</Text>
              <View style={styles.dividerLine} />
            </View>
          )}

          <View style={styles.form}>
            {error && (
              <View style={styles.errorContainer}>
                <Ionicons
                  name="alert-circle-outline"
                  size={20}
                  color={colors.error}
                  style={styles.errorIcon}
                />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <Input
              label="Email"
              placeholder="votre@email.com"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
              }}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              leftIcon="mail-outline"
              editable={!isLoading}
            />

            <Input
              label="Mot de passe"
              placeholder="Votre mot de passe"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
              }}
              error={errors.password}
              secureTextEntry
              autoComplete="password"
              leftIcon="lock-closed-outline"
              editable={!isLoading}
            />

            <View style={styles.options}>
              <View style={styles.optionRow}>
                <TouchableOpacity
                  style={styles.optionLeft}
                  onPress={() => setRememberDevice(!rememberDevice)}
                  activeOpacity={0.7}
                >
                  <Switch
                    value={rememberDevice}
                    onValueChange={setRememberDevice}
                    trackColor={{ false: colors.border, true: colors.textPrimary }}
                    thumbColor={colors.background}
                    disabled={isLoading}
                  />
                  <Text style={styles.optionText}>Se souvenir de moi</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.forgotPassword}
                  onPress={() =>
                    Linking.openURL(
                      'https://atlas-studio.org/portal/forgot-password'
                    )
                  }
                >
                  <Text style={styles.forgotPasswordText}>
                    Mot de passe oublie ?
                  </Text>
                </TouchableOpacity>
              </View>

              {biometricStatus?.available && !biometricStatus?.enabled && (
                <TouchableOpacity
                  style={styles.optionRow}
                  onPress={() => setEnableBiometric(!enableBiometric)}
                  activeOpacity={0.7}
                >
                  <Switch
                    value={enableBiometric}
                    onValueChange={setEnableBiometric}
                    trackColor={{ false: colors.border, true: colors.textPrimary }}
                    thumbColor={colors.background}
                    disabled={isLoading}
                  />
                  <Text style={styles.optionText}>
                    Activer {getBiometricTypeName(biometricStatus.type as 'fingerprint' | 'facial' | 'iris' | 'none')}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <Button
              title="Se connecter"
              onPress={handleLogin}
              loading={isLoading}
              fullWidth
              size="lg"
            />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Pas encore de compte ?</Text>
            <Link href="/(auth)/register" asChild>
              <TouchableOpacity disabled={isLoading}>
                <Text style={styles.registerLink}>S'inscrire</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  biometricButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    marginBottom: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  biometricText: {
    ...typography.body,
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginHorizontal: spacing.md,
  },
  form: {
    marginBottom: spacing.xl,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.error}15`,
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  errorIcon: {
    marginRight: spacing.sm,
  },
  errorText: {
    ...typography.bodySmall,
    color: colors.error,
    flex: 1,
  },
  options: {
    marginBottom: spacing.lg,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  forgotPassword: {},
  forgotPasswordText: {
    ...typography.bodySmall,
    color: colors.accent,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
  },
  footerText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  registerLink: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
  },
});
