import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { colors, spacing, borderRadius } from '@/theme';

interface CardProps {
  children: React.ReactNode;
  variant?: 'elevated' | 'outlined' | 'filled';
  padding?: keyof typeof spacing;
  onPress?: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
  style?: ViewStyle;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'elevated',
  padding = 'md',
  onPress,
  onLongPress,
  disabled = false,
  style,
}) => {
  const cardStyles: ViewStyle[] = [
    styles.base,
    styles[variant],
    { padding: spacing[padding] },
    disabled && styles.disabled,
    style,
  ].filter(Boolean) as ViewStyle[];

  if (onPress || onLongPress) {
    return (
      <TouchableOpacity
        style={cardStyles}
        onPress={onPress}
        onLongPress={onLongPress}
        activeOpacity={0.7}
        disabled={disabled}
        delayLongPress={300}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyles}>{children}</View>;
};

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
  },
  elevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  outlined: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  filled: {
    backgroundColor: colors.background,
  },
  disabled: {
    opacity: 0.5,
  },
});

export default Card;
