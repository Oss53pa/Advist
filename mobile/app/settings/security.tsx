import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store';
import { profileService, SecuritySettings, TrustedDevice } from '@/services/profile';
import {
  Card,
  Button,
  Loading,
  ConfirmModal,
  InputModal,
} from '@/components/ui';
import { colors, spacing, typography, borderRadius } from '@/theme';

interface SettingRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  value?: boolean;
  onValueChange?: (value: boolean) => void;
  onPress?: () => void;
  loading?: boolean;
  disabled?: boolean;
  rightContent?: React.ReactNode;
}

const SettingRow: React.FC<SettingRowProps> = ({
  icon,
  title,
  description,
  value,
  onValueChange,
  onPress,
  loading,
  disabled,
  rightContent,
}) => {
  const content = (
    <View style={styles.settingRow}>
      <View style={styles.settingIcon}>
        <Ionicons name={icon} size={20} color={colors.textSecondary} />
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, disabled && styles.textDisabled]}>
          {title}
        </Text>
        {description && (
          <Text style={styles.settingDescription}>{description}</Text>
        )}
      </View>
      {loading ? (
        <Loading />
      ) : rightContent ? (
        rightContent
      ) : onValueChange !== undefined ? (
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: colors.border, true: colors.success }}
          thumbColor={colors.surface}
          disabled={disabled}
        />
      ) : (
        <Ionicons name="chevron-forward" size={20} color={colors.placeholder} />
      )}
    </View>
  );

  if (onPress && !onValueChange) {
    return (
      <TouchableOpacity onPress={onPress} disabled={disabled || loading}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

export default function SecuritySettingsScreen() {
  const { user, changePassword, biometricStatus, enableBiometricLogin, disableBiometricLogin } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState<SecuritySettings | null>(null);
  const [devices, setDevices] = useState<TrustedDevice[]>([]);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showRemoveDeviceModal, setShowRemoveDeviceModal] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<TrustedDevice | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    loadSecuritySettings();
  }, []);

  const loadSecuritySettings = async () => {
    setIsLoading(true);
    try {
      const [securitySettings, trustedDevices] = await Promise.all([
        profileService.getSecuritySettings(),
        profileService.getTrustedDevices(),
      ]);
      setSettings(securitySettings);
      setDevices(trustedDevices);
    } catch (error) {
      console.error('Error loading security settings:', error);
      Alert.alert('Erreur', 'Impossible de charger les parametres de securite');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBiometricToggle = async (enabled: boolean) => {
    setUpdating('biometric');
    try {
      if (enabled) {
        const success = await enableBiometricLogin();
        if (!success) {
          Alert.alert('Erreur', 'Impossible d\'activer l\'authentification biometrique');
          return;
        }
      } else {
        await disableBiometricLogin();
      }
      setSettings((prev) => prev ? { ...prev, biometricEnabled: enabled } : null);
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Une erreur est survenue');
    } finally {
      setUpdating(null);
    }
  };

  const handleLoginNotificationsToggle = async (enabled: boolean) => {
    setUpdating('loginNotifications');
    try {
      const updated = await profileService.updateSecuritySettings({
        loginNotifications: enabled,
      });
      setSettings(updated);
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Une erreur est survenue');
    } finally {
      setUpdating(null);
    }
  };

  const handleChangePassword = async (currentPassword: string) => {
    setShowPasswordModal(false);
    router.push({
      pathname: '/settings/change-password',
      params: { currentPassword },
    });
  };

  const handleRemoveDevice = async () => {
    if (!selectedDevice) return;

    try {
      await profileService.removeTrustedDevice(selectedDevice.id);
      setDevices((prev) => prev.filter((d) => d.id !== selectedDevice.id));
      Alert.alert('Succes', 'Appareil supprime');
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Une erreur est survenue');
    } finally {
      setShowRemoveDeviceModal(false);
      setSelectedDevice(null);
    }
  };

  const handleRemoveAllDevices = async () => {
    Alert.alert(
      'Deconnexion de tous les appareils',
      'Vous serez deconnecte de tous les autres appareils. Continuer ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Deconnecter',
          style: 'destructive',
          onPress: async () => {
            try {
              await profileService.removeAllOtherDevices();
              const updatedDevices = await profileService.getTrustedDevices();
              setDevices(updatedDevices);
              Alert.alert('Succes', 'Tous les autres appareils ont ete deconnectes');
            } catch (error: any) {
              Alert.alert('Erreur', error.message || 'Une erreur est survenue');
            }
          },
        },
      ]
    );
  };

  const handleSetup2FA = () => {
    router.push('/settings/two-factor');
  };

  const formatDeviceDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return <Loading fullScreen message="Chargement..." />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Password Section */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Mot de passe</Text>
          <SettingRow
            icon="lock-closed-outline"
            title="Changer le mot de passe"
            description="Dernier changement: il y a 30 jours"
            onPress={() => setShowPasswordModal(true)}
          />
        </Card>

        {/* Biometric Section */}
        {biometricStatus?.available && (
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Authentification biometrique</Text>
            <SettingRow
              icon="finger-print-outline"
              title={`Utiliser ${biometricStatus.type === 'facial' ? 'Face ID' : 'Touch ID'}`}
              description="Connexion rapide avec votre empreinte ou visage"
              value={settings?.biometricEnabled || false}
              onValueChange={handleBiometricToggle}
              loading={updating === 'biometric'}
            />
          </Card>
        )}

        {/* Two-Factor Authentication */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Authentification a deux facteurs</Text>
          <SettingRow
            icon="shield-checkmark-outline"
            title="Configuration 2FA"
            description={
              settings?.twoFactorEnabled
                ? `Active via ${settings.twoFactorMethod === '2fa_app' ? 'Application' : settings.twoFactorMethod}`
                : 'Non configure'
            }
            onPress={handleSetup2FA}
            rightContent={
              <View style={styles.statusBadge}>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: settings?.twoFactorEnabled ? colors.success : colors.warning },
                  ]}
                />
                <Text style={styles.statusText}>
                  {settings?.twoFactorEnabled ? 'Actif' : 'Inactif'}
                </Text>
              </View>
            }
          />
        </Card>

        {/* Notifications */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Alertes de securite</Text>
          <SettingRow
            icon="notifications-outline"
            title="Notifications de connexion"
            description="Recevoir une alerte lors d'une nouvelle connexion"
            value={settings?.loginNotifications || false}
            onValueChange={handleLoginNotificationsToggle}
            loading={updating === 'loginNotifications'}
          />
        </Card>

        {/* Connected Devices */}
        <Card style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Appareils connectes</Text>
            {devices.length > 1 && (
              <TouchableOpacity onPress={handleRemoveAllDevices}>
                <Text style={styles.removeAllText}>Tout supprimer</Text>
              </TouchableOpacity>
            )}
          </View>

          {devices.map((device, index) => (
            <View key={device.id}>
              {index > 0 && <View style={styles.separator} />}
              <TouchableOpacity
                style={styles.deviceRow}
                onPress={() => {
                  if (!device.isCurrent) {
                    setSelectedDevice(device);
                    setShowRemoveDeviceModal(true);
                  }
                }}
                disabled={device.isCurrent}
              >
                <View style={styles.deviceIcon}>
                  <Ionicons
                    name={device.platform === 'ios' ? 'phone-portrait' : device.platform === 'android' ? 'phone-portrait-outline' : 'desktop-outline'}
                    size={20}
                    color={device.isCurrent ? colors.success : colors.textSecondary}
                  />
                </View>
                <View style={styles.deviceInfo}>
                  <View style={styles.deviceHeader}>
                    <Text style={styles.deviceName}>{device.name}</Text>
                    {device.isCurrent && (
                      <View style={styles.currentBadge}>
                        <Text style={styles.currentBadgeText}>Actuel</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.deviceMeta}>
                    {device.location && `${device.location} • `}
                    {formatDeviceDate(device.lastUsed)}
                  </Text>
                </View>
                {!device.isCurrent && (
                  <Ionicons name="close-circle" size={24} color={colors.error} />
                )}
              </TouchableOpacity>
            </View>
          ))}

          {devices.length === 0 && (
            <Text style={styles.emptyText}>Aucun appareil connecte</Text>
          )}
        </Card>

        {/* Activity Log */}
        <Card style={styles.card}>
          <SettingRow
            icon="time-outline"
            title="Historique d'activite"
            description="Consulter les dernieres connexions"
            onPress={() => router.push('/settings/activity')}
          />
        </Card>
      </ScrollView>

      {/* Password Modal */}
      <InputModal
        visible={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSubmit={handleChangePassword}
        title="Changer le mot de passe"
        message="Entrez votre mot de passe actuel pour continuer"
        placeholder="Mot de passe actuel"
        submitLabel="Continuer"
        cancelLabel="Annuler"
        required
      />

      {/* Remove Device Modal */}
      <ConfirmModal
        visible={showRemoveDeviceModal}
        onClose={() => {
          setShowRemoveDeviceModal(false);
          setSelectedDevice(null);
        }}
        onConfirm={handleRemoveDevice}
        title="Supprimer l'appareil"
        message={`Voulez-vous deconnecter "${selectedDevice?.name}" ? Cet appareil devra se reconnecter.`}
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        variant="danger"
        icon="trash"
      />
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  removeAllText: {
    ...typography.bodySmall,
    color: colors.error,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    ...typography.body,
    color: colors.textPrimary,
  },
  settingDescription: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  textDisabled: {
    color: colors.disabled,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accentLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.xs,
  },
  statusText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 56,
  },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  deviceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  deviceName: {
    ...typography.body,
    color: colors.textPrimary,
  },
  currentBadge: {
    backgroundColor: colors.success,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  currentBadgeText: {
    ...typography.caption,
    color: colors.surface,
    fontSize: 10,
  },
  deviceMeta: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
});
