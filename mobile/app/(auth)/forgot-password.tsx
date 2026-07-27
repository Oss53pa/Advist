import React, { useEffect, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import * as Linking from 'expo-linking';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui';
import { colors, spacing, typography } from '@/theme';

// D5 — Password recovery is centralized on the Atlas Studio portal.
// This screen no longer collects the email locally; it redirects the user
// to the portal's central "forgot password" page in the system browser.
const PORTAL_FORGOT_PASSWORD_URL =
  'https://atlas-studio.org/portal/forgot-password';

export default function ForgotPasswordScreen() {
  const openPortal = useCallback(() => {
    Linking.openURL(PORTAL_FORGOT_PASSWORD_URL);
  }, []);

  // Redirect to the portal as soon as the screen mounts.
  useEffect(() => {
    openPortal();
  }, [openPortal]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.icon}>
          <Ionicons name="open-outline" size={64} color={colors.accent} />
        </View>
        <Text style={styles.title}>Redirection vers Atlas Studio…</Text>
        <Text style={styles.text}>
          La réinitialisation du mot de passe se fait sur le portail Atlas
          Studio. Votre navigateur devrait s'ouvrir automatiquement.
        </Text>
        <Button
          title="Ouvrir le portail"
          onPress={openPortal}
          fullWidth
          size="lg"
          style={styles.button}
        />
        <Button
          title="Retour à la connexion"
          onPress={() => router.replace('/(auth)/login')}
          variant="secondary"
          fullWidth
          size="lg"
          style={styles.backButton}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  text: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  button: {
    marginTop: spacing.md,
  },
  backButton: {
    marginTop: spacing.md,
  },
});
