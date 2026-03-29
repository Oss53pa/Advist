import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { profileService, AppSettings } from '@/services/profile';
import { Card, Loading, Button } from '@/components/ui';
import { colors, spacing, typography, borderRadius } from '@/theme';

interface LanguageOption {
  code: 'fr' | 'en' | 'ar';
  name: string;
  nativeName: string;
  flag: string;
}

interface DateFormatOption {
  value: AppSettings['dateFormat'];
  label: string;
  example: string;
}

interface TimeFormatOption {
  value: AppSettings['timeFormat'];
  label: string;
  example: string;
}

const LANGUAGES: LanguageOption[] = [
  { code: 'fr', name: 'French', nativeName: 'Francais', flag: '🇫🇷' },
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
];

const DATE_FORMATS: DateFormatOption[] = [
  { value: 'DD/MM/YYYY', label: 'Jour/Mois/Annee', example: '31/12/2024' },
  { value: 'MM/DD/YYYY', label: 'Mois/Jour/Annee', example: '12/31/2024' },
  { value: 'YYYY-MM-DD', label: 'Annee-Mois-Jour', example: '2024-12-31' },
];

const TIME_FORMATS: TimeFormatOption[] = [
  { value: '24h', label: '24 heures', example: '14:30' },
  { value: '12h', label: '12 heures', example: '2:30 PM' },
];

export default function LanguageSettingsScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<AppSettings | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const appSettings = await profileService.getAppSettings();
      setSettings(appSettings);
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

  if (isLoading || !settings) {
    return <Loading fullScreen message="Chargement..." />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Language Selection */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Langue de l'application</Text>
          <Text style={styles.sectionDescription}>
            Choisissez la langue d'affichage de l'application
          </Text>

          <View style={styles.optionsList}>
            {LANGUAGES.map((language) => (
              <TouchableOpacity
                key={language.code}
                style={[
                  styles.optionItem,
                  settings.language === language.code && styles.optionItemSelected,
                ]}
                onPress={() => updateSetting('language', language.code)}
                disabled={isSaving}
              >
                <Text style={styles.optionFlag}>{language.flag}</Text>
                <View style={styles.optionContent}>
                  <Text style={styles.optionLabel}>{language.nativeName}</Text>
                  <Text style={styles.optionSubLabel}>{language.name}</Text>
                </View>
                {settings.language === language.code && (
                  <Ionicons name="checkmark-circle" size={24} color={colors.success} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Date Format */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Format de date</Text>
          <Text style={styles.sectionDescription}>
            Comment les dates seront affichees
          </Text>

          <View style={styles.optionsList}>
            {DATE_FORMATS.map((format) => (
              <TouchableOpacity
                key={format.value}
                style={[
                  styles.optionItem,
                  settings.dateFormat === format.value && styles.optionItemSelected,
                ]}
                onPress={() => updateSetting('dateFormat', format.value)}
                disabled={isSaving}
              >
                <View style={styles.optionContent}>
                  <Text style={styles.optionLabel}>{format.label}</Text>
                  <Text style={styles.optionExample}>{format.example}</Text>
                </View>
                {settings.dateFormat === format.value && (
                  <Ionicons name="checkmark-circle" size={24} color={colors.success} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Time Format */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Format d'heure</Text>
          <Text style={styles.sectionDescription}>
            Comment les heures seront affichees
          </Text>

          <View style={styles.optionsList}>
            {TIME_FORMATS.map((format) => (
              <TouchableOpacity
                key={format.value}
                style={[
                  styles.optionItem,
                  settings.timeFormat === format.value && styles.optionItemSelected,
                ]}
                onPress={() => updateSetting('timeFormat', format.value)}
                disabled={isSaving}
              >
                <View style={styles.optionContent}>
                  <Text style={styles.optionLabel}>{format.label}</Text>
                  <Text style={styles.optionExample}>{format.example}</Text>
                </View>
                {settings.timeFormat === format.value && (
                  <Ionicons name="checkmark-circle" size={24} color={colors.success} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Info */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={20} color={colors.textSecondary} />
          <Text style={styles.infoText}>
            Certains changements peuvent necessiter un redemarrage de l'application pour prendre effet.
          </Text>
        </View>
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
  sectionTitle: {
    ...typography.h4,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  sectionDescription: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  optionsList: {
    gap: spacing.sm,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionItemSelected: {
    borderColor: colors.success,
    backgroundColor: `${colors.success}10`,
  },
  optionFlag: {
    fontSize: 28,
    marginRight: spacing.md,
  },
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    ...typography.body,
    color: colors.textPrimary,
  },
  optionSubLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  optionExample: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 2,
    fontFamily: 'monospace',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.accentLight,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  infoText: {
    ...typography.caption,
    color: colors.textSecondary,
    flex: 1,
  },
  savingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
