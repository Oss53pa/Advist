/**
 * ADVIST Design System - Premium
 * ==========================================
 * Palette : Obsidian + Indigo accent
 * Fonts : Inter, Plus Jakarta Sans, JetBrains Mono
 */

// =============================================================================
// PALETTE PRINCIPALE — Midnight Banking
// Inspired by Stripe, Goldman Sachs, institutional finance
// =============================================================================

export const palette = {
  // Ivoire & Laiton — ivoire chaud → navy chaud
  primary50: '#FAF7F1', // Fond de page (ivoire)
  primary100: '#F1ECE1', // Fond de cartes alt, scrollbar
  primary200: '#E8E2D6', // Bordures, separateurs
  primary300: '#D8CFBF', // Scrollbar thumb
  primary400: '#A39B8F', // Texte placeholder, icones desactivees
  primary500: '#78716A', // Texte secondaire, descriptions
  primary600: '#57534E', // Texte intermediaire, labels
  primary700: '#26314A', // Texte boutons ghost
  primary800: '#1B2740', // Boutons hover
  primary900: '#131C2E', // Texte principal, boutons primaires (navy chaud)
  primary950: '#0D1424', // Boutons actifs

  // Laiton (brass) accent
  gold: '#B9975B', // Accent laiton institutionnel
  goldLight: '#D4B87E',
  goldDark: '#8A6C34',

  // White
  white: '#FFFFFF',
} as const;

// =============================================================================
// COULEURS DE SEVERITE (Anomalies)
// =============================================================================

export const severity = {
  low: '#6b7280', // Gris
  medium: '#f59e0b', // Ambre/Orange
  high: '#ef4444', // Rouge
  critical: '#7f1d1d', // Rouge fonce
} as const;

// =============================================================================
// COULEURS DE STATUT
// =============================================================================

export const status = {
  success: '#10b981', // Emerald
  warning: '#f59e0b', // Ambre
  error: '#ef4444', // Rouge
  info: '#6366f1', // Indigo
} as const;

// =============================================================================
// COULEURS SEMANTIQUES
// =============================================================================

export const colors = {
  background: {
    page: palette.primary50,
    card: palette.white,
    subtle: palette.primary100,
    dark: palette.primary900,
  },

  text: {
    primary: palette.primary900,
    secondary: palette.primary500,
    muted: palette.primary400,
    label: palette.primary600,
    inverse: palette.white,
  },

  border: {
    light: palette.primary200,
    medium: palette.primary300,
    dark: palette.primary600,
  },

  button: {
    primary: palette.primary900,
    primaryHover: palette.primary800,
    primaryActive: palette.primary950,
    ghost: palette.primary700,
  },

  state: {
    success: status.success,
    successLight: '#f0fdf4',
    warning: status.warning,
    warningLight: '#fffbeb',
    error: status.error,
    errorLight: '#fef2f2',
    info: status.info,
    infoLight: '#eff6ff',
  },

  severity: {
    low: severity.low,
    lowLight: '#f3f4f6',
    medium: severity.medium,
    mediumLight: '#fffbeb',
    high: severity.high,
    highLight: '#fef2f2',
    critical: severity.critical,
    criticalLight: '#fef2f2',
  },
} as const;

// =============================================================================
// CONFIGURATION TAILWIND
// =============================================================================

// Echelle de gris CHAUDE (ivoire → navy chaud). Redefinit les palettes froides
// intégrées de Tailwind (gray/slate/neutral/zinc) pour que les centaines de
// classes `bg-gray-*`, `text-slate-*`, etc. déjà présentes dans l'app adoptent
// automatiquement l'identité Ivoire & Laiton, sans éditer chaque composant.
const warmGray = {
  50: '#FAF7F1',
  100: '#F1ECE1',
  200: '#E8E2D6',
  300: '#D8CFBF',
  400: '#A39B8F',
  500: '#78716A',
  600: '#57534E',
  700: '#44403A',
  800: '#2A2620',
  900: '#1C1917',
  950: '#131C2E',
} as const;

export const tailwindColors = {
  // Palettes froides de Tailwind redefinies en chaud (voir warmGray)
  gray: warmGray,
  slate: warmGray,
  neutral: warmGray,
  zinc: warmGray,
  stone: warmGray,

  // Primary Grayscale
  primary: {
    50: palette.primary50,
    100: palette.primary100,
    200: palette.primary200,
    300: palette.primary300,
    400: palette.primary400,
    500: palette.primary500,
    600: palette.primary600,
    700: palette.primary700,
    800: palette.primary800,
    900: palette.primary900,
    950: palette.primary950,
  },

  // Severity
  severity: {
    low: severity.low,
    medium: severity.medium,
    high: severity.high,
    critical: severity.critical,
  },

  // Status
  status: {
    success: status.success,
    warning: status.warning,
    error: status.error,
    info: status.info,
  },

  // Advist namespace (pour compatibilite)
  advist: {
    // Palette directe
    white: palette.white,
    gray50: palette.primary50,
    gray100: palette.primary100,
    gray200: palette.primary200,
    gray300: palette.primary300,
    gray400: palette.primary400,
    gray500: palette.primary500,
    gray600: palette.primary600,
    gray700: palette.primary700,
    gray800: palette.primary800,
    gray900: palette.primary900,
    black: palette.primary950,

    // Mapping semantique
    dark: palette.primary900,
    'dark-hover': palette.primary800,

    // Gold accent institutionnel
    gold: palette.gold,
    'gold-dark': palette.goldDark,
    'gold-light': palette.goldLight,
    'gold-muted': '#F5EDDD',

    bg: palette.primary50,
    surface: palette.white,
    'surface-dark': palette.primary100,

    'text-primary': palette.primary900,
    'text-secondary': palette.primary500,
    'text-muted': palette.primary400,

    border: palette.primary200,
    'border-dark': palette.primary300,

    success: status.success,
    'success-light': colors.state.successLight,
    warning: status.warning,
    'warning-light': colors.state.warningLight,
    error: status.error,
    'error-light': colors.state.errorLight,
    info: status.info,
    'info-light': colors.state.infoLight,

    // Legacy (compatibilite)
    onyx: palette.primary900,
    slate: palette.primary500,
    snow: palette.white,
    ice: palette.primary50,
    fossil: palette.primary300,
    sand: palette.primary400,
    drab: palette.primary800,
    rust: palette.primary900,
    sage: status.success,

    navy: palette.primary900,
    'blue-light': status.info,
    'gray-cold': palette.primary100,
    red: status.error,
    earth: palette.primary600,

    'ui-active': palette.primary900,
    'ui-inactive': palette.primary100,
    'ui-label': palette.primary900,
    'ui-placeholder': palette.primary400,

    // Accent (anciennement orange/rust)
    accent: palette.primary900,
    'accent-hover': palette.primary800,
    'accent-light': palette.primary100,
  },
};

// =============================================================================
// VARIABLES CSS
// =============================================================================

export const cssVariables = {
  light: {
    '--color-background': palette.primary50,
    '--color-background-rgb': '250 247 241',
    '--color-surface': palette.white,
    '--color-surface-rgb': '255 255 255',
    '--color-surface-alt': palette.primary100,
    '--color-primary': palette.primary900,
    '--color-primary-rgb': '19 28 46',
    '--color-gold': palette.gold,
    '--color-text-primary': palette.primary900,
    '--color-text-secondary': palette.primary500,
    '--color-text-muted': palette.primary400,
    '--color-text-label': palette.primary600,
    '--color-border': palette.primary200,
    '--color-border-dark': palette.primary300,
    '--color-success': status.success,
    '--color-warning': status.warning,
    '--color-error': status.error,
    '--color-info': status.info,
  },
  dark: {
    '--color-background': palette.primary950,
    '--color-background-rgb': '8 14 27',
    '--color-surface': palette.primary900,
    '--color-surface-rgb': '15 23 42',
    '--color-surface-alt': palette.primary700,
    '--color-primary': palette.primary50,
    '--color-primary-rgb': '247 248 250',
    '--color-gold': palette.goldLight,
    '--color-text-primary': palette.primary50,
    '--color-text-secondary': palette.primary400,
    '--color-text-muted': palette.primary500,
    '--color-text-label': palette.primary300,
    '--color-border': palette.primary700,
    '--color-border-dark': '#44403A',
    '--color-success': status.success,
    '--color-warning': status.warning,
    '--color-error': status.error,
    '--color-info': status.info,
  },
};

// =============================================================================
// OMBRES
// =============================================================================

export const shadows = {
  card: '0 1px 2px rgba(0, 0, 0, 0.04)',
  cardHover: '0 4px 12px rgba(0, 0, 0, 0.08)',
  soft: '0 1px 2px rgba(0, 0, 0, 0.02)',
  dark: '0 4px 12px rgba(0, 0, 0, 0.12)',
  focus: '0 0 0 3px rgba(23, 23, 23, 0.1)',
};

// =============================================================================
// FONTS
// =============================================================================

export const fonts = {
  body: "'Dosis', system-ui, -apple-system, sans-serif",
  display: "'Dosis', system-ui, sans-serif",
  decorative: "'Grand Hotel', cursive",
  mono: "'JetBrains Mono', ui-monospace, monospace",
  weights: {
    light: 300,
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },
} as const;

// =============================================================================
// EXPORT
// =============================================================================

const theme = {
  palette,
  severity,
  status,
  colors,
  shadows,
  fonts,
  tailwindColors,
  cssVariables,
};

export default theme;
