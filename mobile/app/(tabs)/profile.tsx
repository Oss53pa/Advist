import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store';
import { Card, Avatar, Button, ConfirmModal, ActionSheet, ActionSheetOption } from '@/components/ui';
import { colors, spacing, typography, borderRadius } from '@/theme';

interface MenuItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  danger?: boolean;
  rightContent?: React.ReactNode;
}

const MenuItem: React.FC<MenuItemProps> = ({
  icon,
  label,
  onPress,
  danger,
  rightContent,
}) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <View style={styles.menuItemLeft}>
      <View style={[styles.menuIcon, danger && styles.menuIconDanger]}>
        <Ionicons
          name={icon}
          size={20}
          color={danger ? colors.error : colors.textSecondary}
        />
      </View>
      <Text style={[styles.menuLabel, danger && styles.menuLabelDanger]}>
        {label}
      </Text>
    </View>
    {rightContent || (
      <Ionicons name="chevron-forward" size={20} color={colors.placeholder} />
    )}
  </TouchableOpacity>
);

export default function ProfileScreen() {
  const { user, logout, isLoading } = useAuthStore();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showAvatarSheet, setShowAvatarSheet] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      setShowLogoutModal(false);
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleAvatarPress = () => {
    setShowAvatarSheet(true);
  };

  const avatarActions: ActionSheetOption[] = [
    {
      label: 'Prendre une photo',
      icon: 'camera-outline',
      onPress: () => {
        // TODO: Implement camera capture
        console.log('Take photo');
      },
    },
    {
      label: 'Choisir dans la galerie',
      icon: 'images-outline',
      onPress: () => {
        // TODO: Implement gallery picker
        console.log('Pick from gallery');
      },
    },
    {
      label: 'Supprimer la photo',
      icon: 'trash-outline',
      destructive: true,
      onPress: () => {
        // TODO: Implement avatar removal
        console.log('Remove avatar');
      },
    },
  ];

  const menuSections = [
    {
      title: 'Compte',
      items: [
        {
          icon: 'person-outline' as const,
          label: 'Informations personnelles',
          onPress: () => router.push('/settings/profile'),
        },
        {
          icon: 'lock-closed-outline' as const,
          label: 'Securite',
          onPress: () => router.push('/settings/security'),
        },
        {
          icon: 'create-outline' as const,
          label: 'Mes signatures',
          onPress: () => router.push('/settings/signatures'),
        },
      ],
    },
    {
      title: 'Preferences',
      items: [
        {
          icon: 'notifications-outline' as const,
          label: 'Notifications',
          onPress: () => router.push('/settings/notifications'),
        },
        {
          icon: 'language-outline' as const,
          label: 'Langue',
          onPress: () => router.push('/settings/language'),
        },
        {
          icon: 'color-palette-outline' as const,
          label: 'Apparence',
          onPress: () => router.push('/settings/appearance'),
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          icon: 'help-circle-outline' as const,
          label: 'Aide',
          onPress: () => router.push('/help'),
        },
        {
          icon: 'information-circle-outline' as const,
          label: 'A propos',
          onPress: () => router.push('/about'),
        },
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Header */}
        <Card style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <TouchableOpacity onPress={handleAvatarPress}>
              <Avatar
                source={user?.avatar}
                name={`${user?.firstName} ${user?.lastName}`}
                size="xl"
              />
              <View style={styles.editAvatarBadge}>
                <Ionicons name="camera" size={12} color={colors.surface} />
              </View>
            </TouchableOpacity>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>
                {user?.firstName} {user?.lastName}
              </Text>
              <Text style={styles.profileEmail}>{user?.email}</Text>
              {user?.role && (
                <View style={styles.roleBadge}>
                  <Text style={styles.roleText}>{user.role.name}</Text>
                </View>
              )}
            </View>
          </View>
          {user?.organization && (
            <View style={styles.organizationInfo}>
              <Ionicons name="business" size={16} color={colors.textSecondary} />
              <Text style={styles.organizationName}>
                {user.organization.name}
              </Text>
            </View>
          )}
        </Card>

        {/* Menu Sections */}
        {menuSections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Card style={styles.menuCard}>
              {section.items.map((item, index) => (
                <React.Fragment key={item.label}>
                  <MenuItem {...item} />
                  {index < section.items.length - 1 && (
                    <View style={styles.separator} />
                  )}
                </React.Fragment>
              ))}
            </Card>
          </View>
        ))}

        {/* Logout */}
        <View style={styles.section}>
          <Card style={styles.menuCard}>
            <MenuItem
              icon="log-out-outline"
              label="Deconnexion"
              onPress={() => setShowLogoutModal(true)}
              danger
            />
          </Card>
        </View>

        {/* Version */}
        <Text style={styles.version}>Advist Mobile v1.0.0</Text>
      </ScrollView>

      {/* Avatar Action Sheet */}
      <ActionSheet
        visible={showAvatarSheet}
        onClose={() => setShowAvatarSheet(false)}
        title="Photo de profil"
        options={avatarActions}
      />

      {/* Logout Confirmation Modal */}
      <ConfirmModal
        visible={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
        title="Deconnexion"
        message="Etes-vous sur de vouloir vous deconnecter ?"
        confirmLabel="Deconnexion"
        cancelLabel="Annuler"
        variant="danger"
        loading={isLoggingOut}
        icon="log-out"
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
  profileCard: {
    marginBottom: spacing.lg,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editAvatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.textPrimary,
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  profileInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  profileName: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  profileEmail: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  roleBadge: {
    backgroundColor: colors.accentLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
  },
  roleText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  organizationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.xs,
  },
  organizationName: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  section: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  menuCard: {
    padding: 0,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  menuIconDanger: {
    backgroundColor: `${colors.error}15`,
  },
  menuLabel: {
    ...typography.body,
    color: colors.textPrimary,
  },
  menuLabelDanger: {
    color: colors.error,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 60,
  },
  version: {
    ...typography.caption,
    color: colors.placeholder,
    textAlign: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
});
