import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { notificationsService, NotificationPreferences } from '@/services/notifications';
import { Card, Loading, Button, Input } from '@/components/ui';
import { colors, spacing, typography, borderRadius } from '@/theme';

interface NotificationSwitchProps {
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}

const NotificationSwitch: React.FC<NotificationSwitchProps> = ({
  label,
  description,
  value,
  onValueChange,
  disabled,
}) => (
  <View style={styles.switchRow}>
    <View style={styles.switchContent}>
      <Text style={[styles.switchLabel, disabled && styles.textDisabled]}>{label}</Text>
      {description && (
        <Text style={styles.switchDescription}>{description}</Text>
      )}
    </View>
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: colors.border, true: colors.success }}
      thumbColor={colors.surface}
      disabled={disabled}
    />
  </View>
);

export default function NotificationSettingsScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [quietHoursStart, setQuietHoursStart] = useState('22:00');
  const [quietHoursEnd, setQuietHoursEnd] = useState('07:00');

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    setIsLoading(true);
    try {
      const prefs = await notificationsService.getPreferences();
      setPreferences(prefs);
      if (prefs.quietHours) {
        setQuietHoursStart(prefs.quietHours.startTime);
        setQuietHoursEnd(prefs.quietHours.endTime);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
      Alert.alert('Erreur', 'Impossible de charger les preferences');
    } finally {
      setIsLoading(false);
    }
  };

  const updatePreferences = async (updates: Partial<NotificationPreferences>) => {
    if (!preferences) return;

    setIsSaving(true);
    try {
      const updated = await notificationsService.updatePreferences(updates);
      setPreferences(updated);
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Une erreur est survenue');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChannelToggle = (
    channel: 'email' | 'push' | 'inApp',
    setting: keyof NotificationPreferences['email'],
    value: boolean
  ) => {
    if (!preferences) return;

    const updatedChannel = {
      ...preferences[channel],
      [setting]: value,
    };

    updatePreferences({
      [channel]: updatedChannel,
    });
  };

  const handleQuietHoursToggle = (enabled: boolean) => {
    updatePreferences({
      quietHours: enabled
        ? {
            enabled: true,
            startTime: quietHoursStart,
            endTime: quietHoursEnd,
          }
        : {
            enabled: false,
            startTime: quietHoursStart,
            endTime: quietHoursEnd,
          },
    });
  };

  const handleQuietHoursUpdate = () => {
    if (!preferences?.quietHours?.enabled) return;

    updatePreferences({
      quietHours: {
        enabled: true,
        startTime: quietHoursStart,
        endTime: quietHoursEnd,
      },
    });
  };

  if (isLoading || !preferences) {
    return <Loading fullScreen message="Chargement..." />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Push Notifications */}
        <Card style={styles.card}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <Ionicons name="phone-portrait-outline" size={20} color={colors.textSecondary} />
            </View>
            <Text style={styles.sectionTitle}>Notifications push</Text>
          </View>

          <NotificationSwitch
            label="Taches assignees"
            description="Nouvelle tache ou demande d'action"
            value={preferences.push.taskAssigned}
            onValueChange={(v) => handleChannelToggle('push', 'taskAssigned', v)}
          />
          <NotificationSwitch
            label="Document approuve"
            description="Un document a ete approuve"
            value={preferences.push.documentApproved}
            onValueChange={(v) => handleChannelToggle('push', 'documentApproved', v)}
          />
          <NotificationSwitch
            label="Document rejete"
            description="Un document a ete rejete"
            value={preferences.push.documentRejected}
            onValueChange={(v) => handleChannelToggle('push', 'documentRejected', v)}
          />
          <NotificationSwitch
            label="Document signe"
            description="Un document a ete signe"
            value={preferences.push.documentSigned}
            onValueChange={(v) => handleChannelToggle('push', 'documentSigned', v)}
          />
          <NotificationSwitch
            label="Workflow termine"
            description="Un workflow est complete"
            value={preferences.push.workflowCompleted}
            onValueChange={(v) => handleChannelToggle('push', 'workflowCompleted', v)}
          />
          <NotificationSwitch
            label="Rappel d'echeance"
            description="Rappel avant la date limite"
            value={preferences.push.deadlineReminder}
            onValueChange={(v) => handleChannelToggle('push', 'deadlineReminder', v)}
          />
          <NotificationSwitch
            label="Mentions"
            description="Quelqu'un vous a mentionne"
            value={preferences.push.mentions}
            onValueChange={(v) => handleChannelToggle('push', 'mentions', v)}
          />
        </Card>

        {/* Email Notifications */}
        <Card style={styles.card}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <Ionicons name="mail-outline" size={20} color={colors.textSecondary} />
            </View>
            <Text style={styles.sectionTitle}>Notifications email</Text>
          </View>

          <NotificationSwitch
            label="Taches assignees"
            value={preferences.email.taskAssigned}
            onValueChange={(v) => handleChannelToggle('email', 'taskAssigned', v)}
          />
          <NotificationSwitch
            label="Document approuve"
            value={preferences.email.documentApproved}
            onValueChange={(v) => handleChannelToggle('email', 'documentApproved', v)}
          />
          <NotificationSwitch
            label="Document rejete"
            value={preferences.email.documentRejected}
            onValueChange={(v) => handleChannelToggle('email', 'documentRejected', v)}
          />
          <NotificationSwitch
            label="Document signe"
            value={preferences.email.documentSigned}
            onValueChange={(v) => handleChannelToggle('email', 'documentSigned', v)}
          />
          <NotificationSwitch
            label="Workflow termine"
            value={preferences.email.workflowCompleted}
            onValueChange={(v) => handleChannelToggle('email', 'workflowCompleted', v)}
          />
          <NotificationSwitch
            label="Rappel d'echeance"
            value={preferences.email.deadlineReminder}
            onValueChange={(v) => handleChannelToggle('email', 'deadlineReminder', v)}
          />
          <NotificationSwitch
            label="Mentions"
            value={preferences.email.mentions}
            onValueChange={(v) => handleChannelToggle('email', 'mentions', v)}
          />
        </Card>

        {/* Quiet Hours */}
        <Card style={styles.card}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <Ionicons name="moon-outline" size={20} color={colors.textSecondary} />
            </View>
            <Text style={styles.sectionTitle}>Mode silencieux</Text>
          </View>

          <NotificationSwitch
            label="Activer le mode silencieux"
            description="Suspendre les notifications pendant certaines heures"
            value={preferences.quietHours?.enabled || false}
            onValueChange={handleQuietHoursToggle}
          />

          {preferences.quietHours?.enabled && (
            <View style={styles.quietHoursConfig}>
              <View style={styles.timeInputRow}>
                <View style={styles.timeInput}>
                  <Text style={styles.timeLabel}>De</Text>
                  <Input
                    value={quietHoursStart}
                    onChangeText={setQuietHoursStart}
                    placeholder="22:00"
                    keyboardType="numbers-and-punctuation"
                    onBlur={handleQuietHoursUpdate}
                  />
                </View>
                <View style={styles.timeInput}>
                  <Text style={styles.timeLabel}>A</Text>
                  <Input
                    value={quietHoursEnd}
                    onChangeText={setQuietHoursEnd}
                    placeholder="07:00"
                    keyboardType="numbers-and-punctuation"
                    onBlur={handleQuietHoursUpdate}
                  />
                </View>
              </View>
              <Text style={styles.quietHoursHint}>
                Aucune notification push ne sera envoyee pendant ces heures
              </Text>
            </View>
          )}
        </Card>

        {/* In-App Notifications */}
        <Card style={styles.card}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <Ionicons name="notifications-outline" size={20} color={colors.textSecondary} />
            </View>
            <Text style={styles.sectionTitle}>Notifications in-app</Text>
          </View>

          <NotificationSwitch
            label="Taches assignees"
            value={preferences.inApp.taskAssigned}
            onValueChange={(v) => handleChannelToggle('inApp', 'taskAssigned', v)}
          />
          <NotificationSwitch
            label="Document approuve"
            value={preferences.inApp.documentApproved}
            onValueChange={(v) => handleChannelToggle('inApp', 'documentApproved', v)}
          />
          <NotificationSwitch
            label="Document rejete"
            value={preferences.inApp.documentRejected}
            onValueChange={(v) => handleChannelToggle('inApp', 'documentRejected', v)}
          />
          <NotificationSwitch
            label="Document signe"
            value={preferences.inApp.documentSigned}
            onValueChange={(v) => handleChannelToggle('inApp', 'documentSigned', v)}
          />
          <NotificationSwitch
            label="Workflow termine"
            value={preferences.inApp.workflowCompleted}
            onValueChange={(v) => handleChannelToggle('inApp', 'workflowCompleted', v)}
          />
          <NotificationSwitch
            label="Rappel d'echeance"
            value={preferences.inApp.deadlineReminder}
            onValueChange={(v) => handleChannelToggle('inApp', 'deadlineReminder', v)}
          />
          <NotificationSwitch
            label="Mentions"
            value={preferences.inApp.mentions}
            onValueChange={(v) => handleChannelToggle('inApp', 'mentions', v)}
          />
        </Card>
      </ScrollView>

      {isSaving && (
        <View style={styles.savingOverlay}>
          <Loading message="Enregistrement..." />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.md,
  },
  card: {
    marginBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.textPrimary,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  switchContent: {
    flex: 1,
    marginRight: spacing.md,
  },
  switchLabel: {
    ...typography.body,
    color: colors.textPrimary,
  },
  switchDescription: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  textDisabled: {
    color: colors.disabled,
  },
  quietHoursConfig: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  timeInputRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  timeInput: {
    flex: 1,
  },
  timeLabel: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  quietHoursHint: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },
  savingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
