export { colors, darkColors } from './colors';
export { spacing, borderRadius, iconSize } from './spacing';
export { fontFamily, fontSize, typography } from './typography';

import { colors, darkColors } from './colors';
import { spacing, borderRadius, iconSize } from './spacing';
import { fontFamily, fontSize, typography } from './typography';

export const lightTheme = {
  colors,
  spacing,
  borderRadius,
  iconSize,
  fontFamily,
  fontSize,
  typography,
};

export const darkTheme = {
  colors: darkColors,
  spacing,
  borderRadius,
  iconSize,
  fontFamily,
  fontSize,
  typography,
};

export type Theme = typeof lightTheme;
