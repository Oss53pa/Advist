import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Modal } from './Modal';
import { Button } from './Button';
import { colors, spacing, typography } from '@/theme';

type ConfirmVariant = 'default' | 'danger' | 'warning' | 'success';

interface ConfirmModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
  loading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  visible,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  variant = 'default',
  loading = false,
  icon,
}) => {
  const getIconColor = () => {
    switch (variant) {
      case 'danger':
        return colors.error;
      case 'warning':
        return colors.warning;
      case 'success':
        return colors.success;
      default:
        return colors.textPrimary;
    }
  };

  const getIconName = (): keyof typeof Ionicons.glyphMap => {
    if (icon) return icon;
    switch (variant) {
      case 'danger':
        return 'warning';
      case 'warning':
        return 'alert-circle';
      case 'success':
        return 'checkmark-circle';
      default:
        return 'help-circle';
    }
  };

  const getButtonVariant = (): 'primary' | 'danger' => {
    return variant === 'danger' ? 'danger' : 'primary';
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      showCloseButton={false}
      size="sm"
      closeOnBackdrop={!loading}
    >
      <View style={styles.container}>
        <View style={[styles.iconContainer, { backgroundColor: `${getIconColor()}15` }]}>
          <Ionicons name={getIconName()} size={32} color={getIconColor()} />
        </View>

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>

        <View style={styles.buttons}>
          <Button
            title={cancelLabel}
            variant="outline"
            onPress={onClose}
            disabled={loading}
            style={styles.button}
          />
          <Button
            title={confirmLabel}
            variant={getButtonVariant()}
            onPress={onConfirm}
            loading={loading}
            style={styles.button}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h3,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  message: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  buttons: {
    flexDirection: 'row',
    gap: spacing.sm,
    width: '100%',
  },
  button: {
    flex: 1,
  },
});

export default ConfirmModal;
