import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing, borderRadius, typography } from '@/theme';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'pending' | 'approved' | 'rejected' | 'signed';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

const variantColors: Record<BadgeVariant, { bg: string; text: string }> = {
  default: { bg: colors.accentLight, text: colors.textPrimary },
  success: { bg: `${colors.success}20`, text: colors.success },
  warning: { bg: `${colors.warning}20`, text: colors.warning },
  error: { bg: `${colors.error}20`, text: colors.error },
  info: { bg: `${colors.info}20`, text: colors.info },
  pending: { bg: `${colors.pending}20`, text: colors.pending },
  approved: { bg: `${colors.approved}20`, text: colors.approved },
  rejected: { bg: `${colors.rejected}20`, text: colors.rejected },
  signed: { bg: `${colors.signed}20`, text: colors.signed },
};

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'default',
  size = 'md',
  style,
}) => {
  const colorScheme = variantColors[variant];

  return (
    <View
      style={[
        styles.base,
        size === 'sm' && styles.sm,
        { backgroundColor: colorScheme.bg },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          size === 'sm' && styles.textSm,
          { color: colorScheme.text },
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
  sm: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  text: {
    ...typography.caption,
    fontWeight: '600',
  },
  textSm: {
    fontSize: 10,
  },
});

export default Badge;
