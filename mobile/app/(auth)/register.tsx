import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { Link, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '@/store';
import { Button, Input } from '@/components/ui';
import { colors, spacing, typography } from '@/theme';
import { registerSchema } from '@/validation/auth.schema';

type FieldErrors = {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  organizationCode?: string;
};

export default function RegisterScreen() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [organizationCode, setOrganizationCode] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [acceptTerms, setAcceptTerms] = useState(false);

  const { register, isLoading, error, clearError } = useAuthStore();

  // Validate using Zod schema
  const validate = useCallback((): boolean => {
    const result = registerSchema.safeParse({
      firstName,
      lastName,
      email,
      password,
      confirmPassword,
      organizationCode: organizationCode || undefined,
      acceptTerms,
    });

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

    if (!acceptTerms) {
      setErrors({ ...errors });
      return false;
    }

    setErrors({});
    return true;
  }, [firstName, lastName, email, password, confirmPassword, organizationCode, acceptTerms, errors]);

  // Clear field error on change
  const clearFieldError = (field: keyof FieldErrors) => {
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleRegister = async () => {
    clearError();
    if (!validate()) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    try {
      await register({
        email,
        password,
        firstName,
        lastName,
        organizationCode: organizationCode || undefined,
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(tabs)');
    } catch {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>Créer un compte</Text>
            <Text style={styles.subtitle}>
              Rejoignez Advist pour gérer vos documents
            </Text>
          </View>

          <View style={styles.form}>
            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Input
                  label="Prenom"
                  placeholder="John"
                  value={firstName}
                  onChangeText={(text) => {
                    setFirstName(text);
                    clearFieldError('firstName');
                  }}
                  error={errors.firstName}
                  autoComplete="given-name"
                  editable={!isLoading}
                />
              </View>
              <View style={styles.halfInput}>
                <Input
                  label="Nom"
                  placeholder="Doe"
                  value={lastName}
                  onChangeText={(text) => {
                    setLastName(text);
                    clearFieldError('lastName');
                  }}
                  error={errors.lastName}
                  autoComplete="family-name"
                  editable={!isLoading}
                />
              </View>
            </View>

            <Input
              label="Email"
              placeholder="votre@email.com"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                clearFieldError('email');
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
              placeholder="Minimum 8 caracteres"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                clearFieldError('password');
              }}
              error={errors.password}
              secureTextEntry
              autoComplete="new-password"
              leftIcon="lock-closed-outline"
              editable={!isLoading}
            />

            <Input
              label="Confirmer le mot de passe"
              placeholder="Repetez le mot de passe"
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                clearFieldError('confirmPassword');
              }}
              error={errors.confirmPassword}
              secureTextEntry
              autoComplete="new-password"
              leftIcon="lock-closed-outline"
              editable={!isLoading}
            />

            <Input
              label="Code organisation (optionnel)"
              placeholder="CODE-ORG"
              value={organizationCode}
              onChangeText={(text) => {
                setOrganizationCode(text);
                clearFieldError('organizationCode');
              }}
              hint="Fourni par votre administrateur"
              leftIcon="business-outline"
              editable={!isLoading}
            />

            {/* Terms and conditions checkbox */}
            <TouchableOpacity
              style={styles.termsRow}
              onPress={() => setAcceptTerms(!acceptTerms)}
              activeOpacity={0.7}
              disabled={isLoading}
            >
              <View style={[styles.checkbox, acceptTerms && styles.checkboxChecked]}>
                {acceptTerms && (
                  <Ionicons name="checkmark" size={16} color={colors.background} />
                )}
              </View>
              <Text style={styles.termsText}>
                J'accepte les{' '}
                <Text style={styles.termsLink}>conditions d'utilisation</Text>
                {' '}et la{' '}
                <Text style={styles.termsLink}>politique de confidentialite</Text>
              </Text>
            </TouchableOpacity>

            <Button
              title="S'inscrire"
              onPress={handleRegister}
              loading={isLoading}
              fullWidth
              size="lg"
              style={styles.registerButton}
              disabled={!acceptTerms}
            />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Déjà un compte ?</Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text style={styles.loginLink}>Se connecter</Text>
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
  },
  backButton: {
    marginBottom: spacing.md,
  },
  header: {
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  form: {
    marginBottom: spacing.xl,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  halfInput: {
    flex: 1,
  },
  errorContainer: {
    backgroundColor: `${colors.error}15`,
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  errorText: {
    ...typography.bodySmall,
    color: colors.error,
    textAlign: 'center',
  },
  registerButton: {
    marginTop: spacing.md,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.xs,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.border,
    marginRight: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.textPrimary,
    borderColor: colors.textPrimary,
  },
  termsText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
  termsLink: {
    color: colors.accent,
    fontWeight: '500',
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
  loginLink: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
  },
});
