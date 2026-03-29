import { TextStyle } from 'react-native';

/**
 * Advist Typography System
 * Using Quicksand font family
 */
export const fontFamily = {
  regular: 'Quicksand-Regular',
  medium: 'Quicksand-Medium',
  semibold: 'Quicksand-SemiBold',
  bold: 'Quicksand-Bold',
} as const;

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const typography: Record<string, TextStyle> = {
  h1: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xxxl,
    lineHeight: 40,
  },
  h2: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.xxl,
    lineHeight: 32,
  },
  h3: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.xl,
    lineHeight: 28,
  },
  h4: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.lg,
    lineHeight: 24,
  },
  body: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.md,
    lineHeight: 24,
  },
  bodySmall: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
  caption: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    lineHeight: 16,
  },
  button: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.md,
    lineHeight: 24,
  },
  label: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
};
