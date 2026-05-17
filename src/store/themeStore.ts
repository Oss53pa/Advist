/**
 * Theme Customization Store using Zustand
 * Centralized theme configuration and state management
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Available font families with Google Fonts URL parameter
export const FONT_FAMILIES = [
  {
    id: 'dosis',
    name: 'Dosis',
    value: '"Dosis", system-ui, -apple-system, sans-serif',
    googleFont: null,
  }, // Loaded in index.css
  {
    id: 'system',
    name: 'Système',
    value: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    googleFont: null,
  },
  {
    id: 'inter',
    name: 'Inter',
    value: '"Inter", sans-serif',
    googleFont: 'Inter:wght@300;400;500;600;700',
  },
  {
    id: 'roboto',
    name: 'Roboto',
    value: '"Roboto", sans-serif',
    googleFont: 'Roboto:wght@300;400;500;700',
  },
  {
    id: 'poppins',
    name: 'Poppins',
    value: '"Poppins", sans-serif',
    googleFont: 'Poppins:wght@300;400;500;600;700',
  },
  {
    id: 'opensans',
    name: 'Open Sans',
    value: '"Open Sans", sans-serif',
    googleFont: 'Open+Sans:wght@300;400;500;600;700',
  },
  { id: 'lato', name: 'Lato', value: '"Lato", sans-serif', googleFont: 'Lato:wght@300;400;700' },
  {
    id: 'montserrat',
    name: 'Montserrat',
    value: '"Montserrat", sans-serif',
    googleFont: 'Montserrat:wght@300;400;500;600;700',
  },
  {
    id: 'sourcesans',
    name: 'Source Sans Pro',
    value: '"Source Sans Pro", sans-serif',
    googleFont: 'Source+Sans+Pro:wght@300;400;600;700',
  },
];

// Available font sizes
export const FONT_SIZES = [
  { id: 'small', name: 'Petit', scale: 0.875 },
  { id: 'medium', name: 'Moyen', scale: 1 },
  { id: 'large', name: 'Grand', scale: 1.125 },
  { id: 'xlarge', name: 'Très grand', scale: 1.25 },
];

// Border radius options (centralized)
export const BORDER_RADIUS_OPTIONS = [
  { id: 'none' as const, label: 'Aucun', value: '0' },
  { id: 'small' as const, label: 'Petit', value: '4px' },
  { id: 'medium' as const, label: 'Moyen', value: '8px' },
  { id: 'large' as const, label: 'Grand', value: '12px' },
];

// Theme mode
export type ThemeMode = 'light' | 'dark' | 'system';

// Default ADVIST colors (used as base for presets and defaults)
const DEFAULT_COLORS = {
  primary: '#252D44',
  secondary: '#7EAED9',
  accent: '#F59E0B',
  background: '#E8EAEC',
  surface: '#FDFDFD',
};

// Dark mode colors
const DARK_MODE_COLORS = {
  primary: '#E8EAEC',
  secondary: '#7EAED9',
  accent: '#FF6B6B',
  background: '#1A1D24',
  surface: '#252D44',
};

// Preset color themes with light and dark variants
export const COLOR_PRESETS = [
  {
    id: 'default',
    name: 'ADVIST Classique',
    colors: DEFAULT_COLORS,
    darkColors: DARK_MODE_COLORS,
  },
  {
    id: 'ocean',
    name: 'Océan',
    colors: {
      primary: '#1E3A5F',
      secondary: '#4A90D9',
      accent: '#FF6B35',
      background: '#E8F4F8',
      surface: '#FFFFFF',
    },
    darkColors: {
      primary: '#E8F4F8',
      secondary: '#4A90D9',
      accent: '#FF8B5C',
      background: '#0D1B2A',
      surface: '#1E3A5F',
    },
  },
  {
    id: 'forest',
    name: 'Forêt',
    colors: {
      primary: '#2D4739',
      secondary: '#6B9080',
      accent: '#A4C3B2',
      background: '#EAF4F4',
      surface: '#FFFFFF',
    },
    darkColors: {
      primary: '#EAF4F4',
      secondary: '#6B9080',
      accent: '#A4C3B2',
      background: '#1A2520',
      surface: '#2D4739',
    },
  },
  {
    id: 'sunset',
    name: 'Coucher de soleil',
    colors: {
      primary: '#4A3728',
      secondary: '#D4A373',
      accent: '#E76F51',
      background: '#FEFAE0',
      surface: '#FFFFFF',
    },
    darkColors: {
      primary: '#FEFAE0',
      secondary: '#D4A373',
      accent: '#FF8C69',
      background: '#1F1814',
      surface: '#4A3728',
    },
  },
  {
    id: 'lavender',
    name: 'Lavande',
    colors: {
      primary: '#4A4063',
      secondary: '#9D8EC7',
      accent: '#E07BE0',
      background: '#F3E8FF',
      surface: '#FFFFFF',
    },
    darkColors: {
      primary: '#F3E8FF',
      secondary: '#9D8EC7',
      accent: '#E07BE0',
      background: '#1A1625',
      surface: '#4A4063',
    },
  },
  {
    id: 'midnight',
    name: 'Minuit',
    colors: {
      primary: '#1A1A2E',
      secondary: '#4A4E69',
      accent: '#F72585',
      background: '#E8E8E8',
      surface: '#F8F8F8',
    },
    darkColors: {
      primary: '#E8E8E8',
      secondary: '#6B7094',
      accent: '#F72585',
      background: '#0F0F1A',
      surface: '#1A1A2E',
    },
  },
];

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
}

export interface ThemeSettings {
  fontFamily: string;
  fontSize: string;
  colorPreset: string;
  customColors: ThemeColors;
  customDarkColors: ThemeColors;
  useCustomColors: boolean;
  borderRadius: 'none' | 'small' | 'medium' | 'large';
  compactMode: boolean;
  themeMode: ThemeMode;
}

interface ThemeState {
  settings: ThemeSettings;
  resolvedMode: 'light' | 'dark'; // Actual mode after resolving 'system'

  // Actions
  setFontFamily: (fontFamily: string) => void;
  setFontSize: (fontSize: string) => void;
  setColorPreset: (presetId: string) => void;
  setCustomColor: (colorKey: keyof ThemeColors, value: string, isDark?: boolean) => void;
  setUseCustomColors: (useCustom: boolean) => void;
  setBorderRadius: (radius: 'none' | 'small' | 'medium' | 'large') => void;
  setCompactMode: (compact: boolean) => void;
  setThemeMode: (mode: ThemeMode) => void;
  toggleDarkMode: () => void;
  resetToDefaults: () => void;

  // Getters
  getCurrentColors: () => ThemeColors;
  getCurrentFont: () => { name: string; value: string };
  getCurrentFontScale: () => number;
  isDarkMode: () => boolean;
}

const defaultSettings: ThemeSettings = {
  fontFamily: 'exo2',
  fontSize: 'medium',
  colorPreset: 'default',
  customColors: { ...DEFAULT_COLORS },
  customDarkColors: { ...DARK_MODE_COLORS },
  useCustomColors: false,
  borderRadius: 'medium',
  compactMode: false,
  themeMode: 'system',
};

// Helper to detect system preference
const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
};

// Helper to resolve theme mode
const resolveThemeMode = (mode: ThemeMode): 'light' | 'dark' => {
  if (mode === 'system') {
    return getSystemTheme();
  }
  return mode;
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      settings: { ...defaultSettings },
      resolvedMode: resolveThemeMode(defaultSettings.themeMode),

      setFontFamily: (fontFamily: string) => {
        set((state) => ({
          settings: { ...state.settings, fontFamily },
        }));
      },

      setFontSize: (fontSize: string) => {
        set((state) => ({
          settings: { ...state.settings, fontSize },
        }));
      },

      setColorPreset: (presetId: string) => {
        set((state) => ({
          settings: { ...state.settings, colorPreset: presetId, useCustomColors: false },
        }));
      },

      setCustomColor: (colorKey: keyof ThemeColors, value: string, isDark = false) => {
        set((state) => ({
          settings: {
            ...state.settings,
            ...(isDark
              ? { customDarkColors: { ...state.settings.customDarkColors, [colorKey]: value } }
              : { customColors: { ...state.settings.customColors, [colorKey]: value } }),
            useCustomColors: true,
          },
        }));
      },

      setUseCustomColors: (useCustom: boolean) => {
        set((state) => ({
          settings: { ...state.settings, useCustomColors: useCustom },
        }));
      },

      setBorderRadius: (radius: 'none' | 'small' | 'medium' | 'large') => {
        set((state) => ({
          settings: { ...state.settings, borderRadius: radius },
        }));
      },

      setCompactMode: (compact: boolean) => {
        set((state) => ({
          settings: { ...state.settings, compactMode: compact },
        }));
      },

      setThemeMode: (mode: ThemeMode) => {
        const resolved = resolveThemeMode(mode);
        set((state) => ({
          settings: { ...state.settings, themeMode: mode },
          resolvedMode: resolved,
        }));
        // Apply dark mode class to document
        if (typeof document !== 'undefined') {
          document.documentElement.classList.toggle('dark', resolved === 'dark');
        }
      },

      toggleDarkMode: () => {
        const { settings } = get();
        const currentMode = resolveThemeMode(settings.themeMode);
        const newMode: ThemeMode = currentMode === 'dark' ? 'light' : 'dark';
        get().setThemeMode(newMode);
      },

      resetToDefaults: () => {
        set({
          settings: { ...defaultSettings },
          resolvedMode: resolveThemeMode(defaultSettings.themeMode),
        });
        if (typeof document !== 'undefined') {
          document.documentElement.classList.remove('dark');
        }
      },

      getCurrentColors: () => {
        const { settings, resolvedMode } = get();
        const isDark = resolvedMode === 'dark';

        if (settings.useCustomColors) {
          return isDark ? settings.customDarkColors : settings.customColors;
        }

        const preset = COLOR_PRESETS.find((p) => p.id === settings.colorPreset);
        if (!preset) {
          return isDark ? COLOR_PRESETS[0].darkColors : COLOR_PRESETS[0].colors;
        }

        return isDark ? preset.darkColors : preset.colors;
      },

      getCurrentFont: () => {
        const { settings } = get();
        const font = FONT_FAMILIES.find((f) => f.id === settings.fontFamily);
        return font || FONT_FAMILIES[0];
      },

      getCurrentFontScale: () => {
        const { settings } = get();
        const size = FONT_SIZES.find((s) => s.id === settings.fontSize);
        return size?.scale || 1;
      },

      isDarkMode: () => {
        return get().resolvedMode === 'dark';
      },
    }),
    {
      name: 'advist-theme',
      onRehydrateStorage: () => (state) => {
        // Apply theme mode on rehydration
        if (state && typeof document !== 'undefined') {
          const resolved = resolveThemeMode(state.settings.themeMode);
          state.resolvedMode = resolved;
          document.documentElement.classList.toggle('dark', resolved === 'dark');
        }
      },
    }
  )
);

// Listen for system theme changes
if (typeof window !== 'undefined' && window.matchMedia) {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    const state = useThemeStore.getState();
    if (state.settings.themeMode === 'system') {
      const newMode = e.matches ? 'dark' : 'light';
      useThemeStore.setState({ resolvedMode: newMode });
      document.documentElement.classList.toggle('dark', newMode === 'dark');
    }
  });
}
