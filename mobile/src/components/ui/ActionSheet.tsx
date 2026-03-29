import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Modal } from './Modal';
import { colors, spacing, typography, borderRadius } from '@/theme';

export interface ActionSheetOption {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  destructive?: boolean;
  disabled?: boolean;
}

interface ActionSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  options: ActionSheetOption[];
  showCancel?: boolean;
  cancelLabel?: string;
}

export const ActionSheet: React.FC<ActionSheetProps> = ({
  visible,
  onClose,
  title,
  message,
  options,
  showCancel = true,
  cancelLabel = 'Annuler',
}) => {
  const handleOptionPress = (option: ActionSheetOption) => {
    if (option.disabled) return;
    onClose();
    // Small delay to allow modal to close
    setTimeout(() => {
      option.onPress();
    }, 200);
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      showCloseButton={false}
      position="bottom"
      closeOnBackdrop={true}
    >
      <View style={styles.container}>
        {(title || message) && (
          <View style={styles.header}>
            {title && <Text style={styles.title}>{title}</Text>}
            {message && <Text style={styles.message}>{message}</Text>}
          </View>
        )}

        <View style={styles.options}>
          {options.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.option,
                index === 0 && styles.optionFirst,
                index === options.length - 1 && styles.optionLast,
                option.disabled && styles.optionDisabled,
              ]}
              onPress={() => handleOptionPress(option)}
              disabled={option.disabled}
              activeOpacity={0.7}
            >
              {option.icon && (
                <Ionicons
                  name={option.icon}
                  size={22}
                  color={
                    option.disabled
                      ? colors.disabled
                      : option.destructive
                      ? colors.error
                      : colors.textPrimary
                  }
                  style={styles.optionIcon}
                />
              )}
              <Text
                style={[
                  styles.optionLabel,
                  option.destructive && styles.optionLabelDestructive,
                  option.disabled && styles.optionLabelDisabled,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {showCancel && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelLabel}>{cancelLabel}</Text>
          </TouchableOpacity>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: spacing.sm,
  },
  header: {
    alignItems: 'center',
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.h4,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  message: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  options: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  optionFirst: {
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
  },
  optionLast: {
    borderBottomLeftRadius: borderRadius.lg,
    borderBottomRightRadius: borderRadius.lg,
    borderBottomWidth: 0,
  },
  optionDisabled: {
    opacity: 0.5,
  },
  optionIcon: {
    marginRight: spacing.sm,
  },
  optionLabel: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  optionLabelDestructive: {
    color: colors.error,
  },
  optionLabelDisabled: {
    color: colors.disabled,
  },
  cancelButton: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  cancelLabel: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
  },
});

export default ActionSheet;
