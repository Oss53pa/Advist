import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { profileService, AppSettings, StorageInfo } from '@/services/profile';
import { Card, Loading, Button, ConfirmModal } from '@/components/ui';
import { colors, spacing, typography, borderRadius } from '@/theme';

interface ThemeOption {
  value: AppSettings['theme'];
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  description: string;
}

interface ViewOption {
  value: AppSettings['defaultDocumentView'];
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

interface QualityOption {
  value: AppSettings['downloadQuality'];
  label: string;
  description: string;
}

const THEMES: ThemeOption[] = [
  { value: 'light', label: 'Clair', icon: 'sunny-outline', description: 'Theme lumineux' },
  { value: 'dark', label: 'Sombre', icon: 'moon-outline', description: 'Theme fonce' },
  { value: 'system', label: 'Systeme', icon: 'phone-portrait-outline', description: 'Suivre le systeme' },
];

const VIEW_OPTIONS: ViewOption[] = [
  { value: 'list', label: 'Liste', icon: 'list-outline' },
  { value: 'grid', label: 'Grille', icon: 'grid-outline' },
];

const QUALITY_OPTIONS: QualityOption[] = [
  { value: 'low', label: 'Basse', description: 'Economise les donnees' },
  { value: 'medium', label: 'Moyenne', description: 'Equilibre qualite/taille' },
  { value: 'high', label: 'Haute', description: 'Meilleure qualite' },
  { value: 'original', label: 'Originale', description: 'Qualite maximale' },
];

export default function AppearanceSettingsScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);
  const [showClearCacheModal, setShowClearCacheModal] = useState(false);
  const [showClearDataModal, setShowClearDataModal] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const [appSettings, storage] = await Promise.all([
        profileService.getAppSettings(),
        profileService.getStorageInfo(),
      ]);
      setSettings(appSettings);
      setStorageInfo(storage);
    } catch (error) {
      console.error('Error loading settings:', error);
      Alert.alert('Erreur', 'Impossible de charger les parametres');
    } finally {
      setIsLoading(false);
    }
  };

  const updateSetting = async <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K]
  ) => {
    if (!settings) return;

    setIsSaving(true);
    try {
      const updated = await profileService.updateAppSettings({ [key]: value });
      setSettings(updated);
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Une erreur est survenue');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearCache = async () => {
    try {
      await profileService.clearCache();
      const storage = await profileService.getStorageInfo();
      setStorageInfo(storage);
      Alert.alert('Succes', 'Cache vide avec succes');
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Une erreur est survenue');
    } finally {
      setShowClearCacheModal(false);
    }
  };

  const handleClearOfflineData = async () => {
    try {
      await profileService.clearOfflineData();
      const storage = await profileService.getStorageInfo();
      setStorageInfo(storage);
      Alert.alert('Succes', 'Donnees hors ligne supprimees');
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Une erreur est survenue');
    } finally {
      setShowClearDataModal(false);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))  } ${  sizes[i]}`;
  };

  const getStoragePercentage = (): number => {
    if (!storageInfo) return 0;
    return Math.round((storageInfo.used / storageInfo.total) * 100);
  };

  if (isLoading || !settings) {
    return <Loading fullScreen message="Chargement..." />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Theme Selection */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Theme</Text>

          <View style={styles.themeGrid}>
            {THEMES.map((theme) => (
              <TouchableOpacity
                key={theme.value}
                style={[
                  styles.themeOption,
                  settings.theme === theme.value && styles.themeOptionSelected,
                ]}
                onPress={() => updateSetting('theme', theme.value)}
                disabled={isSaving}
              >
                <View
                  style={[
                    styles.themeIcon,
                    settings.theme === theme.value && styles.themeIconSelected,
                  ]}
                >
                  <Ionicons
                    name={theme.icon}
                    size={24}
                    color={settings.theme === theme.value ? colors.surface : colors.textSecondary}
                  />
                </View>
                <Text
                  style={[
                    styles.themeLabel,
                    settings.theme === theme.value && styles.themeLabelSelected,
                  ]}
                >
                  {theme.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Document View */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Affichage des documents</Text>

          <View style={styles.viewOptions}>
            {VIEW_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.viewOption,
                  settings.defaultDocumentView === option.value && styles.viewOptionSelected,
                ]}
                onPress={() => updateSetting('defaultDocumentView', option.value)}
                disabled={isSaving}
              >
                <Ionicons
                  name={option.icon}
                  size={20}
                  color={
                    settings.defaultDocumentView === option.value
                      ? colors.surface
                      : colors.textSecondary
                  }
                />
                <Text
                  style={[
                    styles.viewOptionText,
                    settings.defaultDocumentView === option.value && styles.viewOptionTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Interface Options */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Interface</Text>

          <View style={styles.switchRow}>
            <View style={styles.switchContent}>
              <Text style={styles.switchLabel}>Mode compact</Text>
              <Text style={styles.switchDescription}>
                Affiche plus de contenu a l'ecran
              </Text>
            </View>
            <Switch
              value={settings.compactMode}
              onValueChange={(v) => updateSetting('compactMode', v)}
              trackColor={{ false: colors.border, true: colors.success }}
              thumbColor={colors.surface}
              disabled={isSaving}
            />
          </View>

          <View style={styles.separator} />

          <View style={styles.switchRow}>
            <View style={styles.switchContent}>
              <Text style={styles.switchLabel}>Retour haptique</Text>
              <Text style={styles.switchDescription}>
                Vibration lors des interactions
              </Text>
            </View>
            <Switch
              value={settings.hapticFeedback}
              onValueChange={(v) => updateSetting('hapticFeedback', v)}
              trackColor={{ false: colors.border, true: colors.success }}
              thumbColor={colors.surface}
              disabled={isSaving}
            />
          </View>
        </Card>

        {/* Download Quality */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Qualite de telechargement</Text>
          <Text style={styles.sectionDescription}>
            Qualite des documents telecharges
          </Text>

          <View style={styles.qualityOptions}>
            {QUALITY_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.qualityOption,
                  settings.downloadQuality === option.value && styles.qualityOptionSelected,
                ]}
                onPress={() => updateSetting('downloadQuality', option.value)}
                disabled={isSaving}
              >
                <View style={styles.qualityContent}>
                  <Text style={styles.qualityLabel}>{option.label}</Text>
                  <Text style={styles.qualityDescription}>{option.description}</Text>
                </View>
                {settings.downloadQuality === option.value && (
                  <Ionicons name="checkmark-circle" size={24} color={colors.success} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Sync Settings */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Synchronisation</Text>

          <View style={styles.switchRow}>
            <View style={styles.switchContent}>
              <Text style={styles.switchLabel}>Synchronisation automatique</Text>
              <Text style={styles.switchDescription}>
                Synchroniser les documents automatiquement
              </Text>
            </View>
            <Switch
              value={settings.autoSync}
              onValueChange={(v) => updateSetting('autoSync', v)}
              trackColor={{ false: colors.border, true: colors.success }}
              thumbColor={colors.surface}
              disabled={isSaving}
            />
          </View>

          {settings.autoSync && (
            <>
              <View style={styles.separator} />
              <View style={styles.switchRow}>
                <View style={styles.switchContent}>
                  <Text style={styles.switchLabel}>Wi-Fi uniquement</Text>
                  <Text style={styles.switchDescription}>
                    Synchroniser uniquement en Wi-Fi
                  </Text>
                </View>
                <Switch
                  value={settings.syncOnWifiOnly}
                  onValueChange={(v) => updateSetting('syncOnWifiOnly', v)}
                  trackColor={{ false: colors.border, true: colors.success }}
                  thumbColor={colors.surface}
                  disabled={isSaving}
                />
              </View>
            </>
          )}
        </Card>

        {/* Storage */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Stockage</Text>

          {storageInfo && (
            <View style={styles.storageInfo}>
              <View style={styles.storageHeader}>
                <Text style={styles.storageUsed}>
                  {formatBytes(storageInfo.used)} utilises
                </Text>
                <Text style={styles.storageTotal}>
                  sur {formatBytes(storageInfo.total)}
                </Text>
              </View>
              <View style={styles.storageBar}>
                <View
                  style={[
                    styles.storageBarFill,
                    { width: `${getStoragePercentage()}%` },
                  ]}
                />
              </View>

              <View style={styles.storageBreakdown}>
                <View style={styles.storageItem}>
                  <View style={[styles.storageItemDot, { backgroundColor: colors.info }]} />
                  <Text style={styles.storageItemLabel}>Documents</Text>
                  <Text style={styles.storageItemValue}>
                    {formatBytes(storageInfo.breakdown.documents)}
                  </Text>
                </View>
                <View style={styles.storageItem}>
                  <View style={[styles.storageItemDot, { backgroundColor: colors.signed }]} />
                  <Text style={styles.storageItemLabel}>Signatures</Text>
                  <Text style={styles.storageItemValue}>
                    {formatBytes(storageInfo.breakdown.signatures)}
                  </Text>
                </View>
                <View style={styles.storageItem}>
                  <View style={[styles.storageItemDot, { backgroundColor: colors.warning }]} />
                  <Text style={styles.storageItemLabel}>Cache</Text>
                  <Text style={styles.storageItemValue}>
                    {formatBytes(storageInfo.breakdown.cache)}
                  </Text>
                </View>
              </View>
            </View>
          )}

          <View style={styles.storageActions}>
            <Button
              title="Vider le cache"
              onPress={() => setShowClearCacheModal(true)}
              variant="outline"
              size="sm"
              style={styles.storageButton}
            />
            <Button
              title="Supprimer hors ligne"
              onPress={() => setShowClearDataModal(true)}
              variant="outline"
              size="sm"
              style={styles.storageButton}
            />
          </View>
        </Card>
      </ScrollView>

      {/* Clear Cache Modal */}
      <ConfirmModal
        visible={showClearCacheModal}
        onClose={() => setShowClearCacheModal(false)}
        onConfirm={handleClearCache}
        title="Vider le cache"
        message="Cela supprimera les fichiers temporaires. Les documents devront etre retelecharges."
        confirmLabel="Vider"
        cancelLabel="Annuler"
        variant="warning"
        icon="trash"
      />

      {/* Clear Offline Data Modal */}
      <ConfirmModal
        visible={showClearDataModal}
        onClose={() => setShowClearDataModal(false)}
        onConfirm={handleClearOfflineData}
        title="Supprimer les donnees hors ligne"
        message="Cela supprimera tous les documents telecharges pour consultation hors ligne."
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        variant="danger"
        icon="trash"
      />

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
  sectionTitle: {
    ...typography.h4,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  sectionDescription: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  themeGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  themeOption: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  themeOptionSelected: {
    borderColor: colors.textPrimary,
  },
  themeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  themeIconSelected: {
    backgroundColor: colors.textPrimary,
  },
  themeLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  themeLabelSelected: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  viewOptions: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.xs,
  },
  viewOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  viewOptionSelected: {
    backgroundColor: colors.textPrimary,
  },
  viewOptionText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  viewOptionTextSelected: {
    color: colors.surface,
    fontWeight: '600',
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
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  qualityOptions: {
    gap: spacing.sm,
  },
  qualityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  qualityOptionSelected: {
    borderColor: colors.success,
    backgroundColor: `${colors.success}10`,
  },
  qualityContent: {
    flex: 1,
  },
  qualityLabel: {
    ...typography.body,
    color: colors.textPrimary,
  },
  qualityDescription: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  storageInfo: {
    marginBottom: spacing.md,
  },
  storageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  storageUsed: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  storageTotal: {
    ...typography.body,
    color: colors.textSecondary,
  },
  storageBar: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  storageBarFill: {
    height: '100%',
    backgroundColor: colors.info,
    borderRadius: 4,
  },
  storageBreakdown: {
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  storageItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  storageItemDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: spacing.sm,
  },
  storageItemLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    flex: 1,
  },
  storageItemValue: {
    ...typography.bodySmall,
    color: colors.textPrimary,
  },
  storageActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  storageButton: {
    flex: 1,
  },
  savingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
