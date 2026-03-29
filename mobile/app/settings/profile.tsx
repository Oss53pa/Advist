import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store';
import { profileService, UpdateProfileData } from '@/services/profile';
import { Card, Input, Button, Avatar, Loading, ActionSheet, ActionSheetOption } from '@/components/ui';
import { colors, spacing, typography, borderRadius } from '@/theme';

export default function ProfileSettingsScreen() {
  const { user, updateUser, updateAvatar, isLoading: authLoading } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showAvatarSheet, setShowAvatarSheet] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const [formData, setFormData] = useState<UpdateProfileData>({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: '',
    department: '',
    position: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      const profile = await profileService.getProfile();
      setFormData({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        phone: profile.phone || '',
        department: profile.department || '',
        position: profile.position || '',
      });
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: keyof UpdateProfileData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName?.trim()) {
      newErrors.firstName = 'Le prenom est requis';
    }
    if (!formData.lastName?.trim()) {
      newErrors.lastName = 'Le nom est requis';
    }
    if (formData.phone && !/^[+]?[\d\s-]{8,}$/.test(formData.phone)) {
      newErrors.phone = 'Numero de telephone invalide';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setIsSaving(true);
    try {
      await updateUser(formData);
      setHasChanges(false);
      Alert.alert('Succes', 'Vos informations ont ete mises a jour');
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Une erreur est survenue');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarAction = async (action: 'camera' | 'gallery' | 'remove') => {
    setShowAvatarSheet(false);

    try {
      let imageUri: string | null = null;

      if (action === 'camera') {
        imageUri = await profileService.takeAvatarPhoto();
      } else if (action === 'gallery') {
        imageUri = await profileService.pickAvatar();
      } else if (action === 'remove') {
        await profileService.removeAvatar();
        Alert.alert('Succes', 'Photo de profil supprimee');
        return;
      }

      if (imageUri) {
        await profileService.uploadAvatar(imageUri);
        Alert.alert('Succes', 'Photo de profil mise a jour');
      }
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Une erreur est survenue');
    }
  };

  const avatarActions: ActionSheetOption[] = [
    {
      label: 'Prendre une photo',
      icon: 'camera-outline',
      onPress: () => handleAvatarAction('camera'),
    },
    {
      label: 'Choisir dans la galerie',
      icon: 'images-outline',
      onPress: () => handleAvatarAction('gallery'),
    },
    {
      label: 'Supprimer la photo',
      icon: 'trash-outline',
      destructive: true,
      onPress: () => handleAvatarAction('remove'),
    },
  ];

  if (isLoading) {
    return <Loading fullScreen message="Chargement du profil..." />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Avatar Section */}
          <Card style={styles.avatarCard}>
            <TouchableOpacity
              style={styles.avatarContainer}
              onPress={() => setShowAvatarSheet(true)}
            >
              <Avatar
                source={user?.avatar}
                name={`${formData.firstName} ${formData.lastName}`}
                size="xl"
              />
              <View style={styles.editAvatarBadge}>
                <Ionicons name="camera" size={16} color={colors.surface} />
              </View>
            </TouchableOpacity>
            <Text style={styles.avatarHint}>Appuyez pour modifier</Text>
          </Card>

          {/* Personal Info */}
          <Card style={styles.formCard}>
            <Text style={styles.sectionTitle}>Identite</Text>

            <Input
              label="Prenom"
              value={formData.firstName}
              onChangeText={(value) => handleChange('firstName', value)}
              error={errors.firstName}
              placeholder="Votre prenom"
              autoCapitalize="words"
            />

            <Input
              label="Nom"
              value={formData.lastName}
              onChangeText={(value) => handleChange('lastName', value)}
              error={errors.lastName}
              placeholder="Votre nom"
              autoCapitalize="words"
            />

            <Input
              label="Email"
              value={user?.email || ''}
              editable={false}
              leftIcon="mail-outline"
              hint="L'email ne peut pas etre modifie"
            />
          </Card>

          {/* Contact Info */}
          <Card style={styles.formCard}>
            <Text style={styles.sectionTitle}>Contact</Text>

            <Input
              label="Telephone"
              value={formData.phone}
              onChangeText={(value) => handleChange('phone', value)}
              error={errors.phone}
              placeholder="+33 6 12 34 56 78"
              keyboardType="phone-pad"
              leftIcon="call-outline"
            />
          </Card>

          {/* Professional Info */}
          <Card style={styles.formCard}>
            <Text style={styles.sectionTitle}>Informations professionnelles</Text>

            <Input
              label="Poste"
              value={formData.position}
              onChangeText={(value) => handleChange('position', value)}
              placeholder="Ex: Chef de projet"
              leftIcon="briefcase-outline"
            />

            <Input
              label="Departement"
              value={formData.department}
              onChangeText={(value) => handleChange('department', value)}
              placeholder="Ex: Marketing"
              leftIcon="business-outline"
            />

            {user?.organization && (
              <View style={styles.readOnlyField}>
                <View style={styles.readOnlyIcon}>
                  <Ionicons name="business" size={20} color={colors.textSecondary} />
                </View>
                <View style={styles.readOnlyContent}>
                  <Text style={styles.readOnlyLabel}>Organisation</Text>
                  <Text style={styles.readOnlyValue}>{user.organization.name}</Text>
                </View>
              </View>
            )}

            {user?.role && (
              <View style={styles.readOnlyField}>
                <View style={styles.readOnlyIcon}>
                  <Ionicons name="shield-outline" size={20} color={colors.textSecondary} />
                </View>
                <View style={styles.readOnlyContent}>
                  <Text style={styles.readOnlyLabel}>Role</Text>
                  <Text style={styles.readOnlyValue}>{user.role.name}</Text>
                </View>
              </View>
            )}
          </Card>

          {/* Save Button */}
          <View style={styles.buttonContainer}>
            <Button
              title="Enregistrer les modifications"
              onPress={handleSave}
              loading={isSaving}
              disabled={!hasChanges || isSaving}
              style={styles.saveButton}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <ActionSheet
        visible={showAvatarSheet}
        onClose={() => setShowAvatarSheet(false)}
        title="Photo de profil"
        options={avatarActions}
      />
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
    padding: spacing.md,
  },
  avatarCard: {
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingVertical: spacing.lg,
  },
  avatarContainer: {
    position: 'relative',
  },
  editAvatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.textPrimary,
    borderRadius: 16,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.surface,
  },
  avatarHint: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  formCard: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  readOnlyField: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing.sm,
  },
  readOnlyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  readOnlyContent: {
    flex: 1,
  },
  readOnlyLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  readOnlyValue: {
    ...typography.body,
    color: colors.textPrimary,
  },
  buttonContainer: {
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  saveButton: {
    width: '100%',
  },
});
