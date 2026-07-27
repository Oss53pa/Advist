/**
 * Theme Provider Component
 * Applies the user's theme settings to the application
 */
import React, { useEffect } from 'react';
import { useThemeStore, FONT_FAMILIES, BORDER_RADIUS_OPTIONS } from '../../store';

interface ThemeProviderProps {
  children: React.ReactNode;
}

// Helper function to convert hex to RGB values for Tailwind opacity support
const hexToRgb = (hex: string): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(result[3], 16)}`
    : '0 0 0';
};

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const { settings, getCurrentColors, getCurrentFont, getCurrentFontScale } = useThemeStore();
  const colors = getCurrentColors();
  const font = getCurrentFont();
  const fontScale = getCurrentFontScale();

  // Apply theme styles to document
  useEffect(() => {
    const root = document.documentElement;

    // Apply dark mode class
    const isDark =
      settings.themeMode === 'dark' ||
      (settings.themeMode === 'system' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches);
    root.classList.toggle('dark', isDark);

    // Apply font
    root.style.setProperty('--font-family', font.value);
    document.body.style.fontFamily = font.value;

    // Apply font scale
    root.style.setProperty('--font-scale', String(fontScale));
    root.style.fontSize = `${fontScale * 100}%`;

    // Apply colors (hex + RGB for Tailwind opacity support)
    const colorKeys = ['primary', 'secondary', 'accent', 'background', 'surface'] as const;
    colorKeys.forEach((key) => {
      root.style.setProperty(`--color-${key}`, colors[key]);
      root.style.setProperty(`--color-${key}-rgb`, hexToRgb(colors[key]));
    });

    // Apply border radius
    const radius =
      BORDER_RADIUS_OPTIONS.find((r) => r.id === settings.borderRadius)?.value || '8px';
    root.style.setProperty('--border-radius', radius);
    root.style.setProperty('--border-radius-lg', `calc(${radius} * 1.5)`);
    root.style.setProperty('--border-radius-xl', `calc(${radius} * 2)`);

    // Apply compact mode
    root.classList.toggle('compact-mode', settings.compactMode);
    root.style.setProperty('--spacing-scale', settings.compactMode ? '0.75' : '1');
  }, [settings, colors, font, fontScale]);

  // Load Google Fonts dynamically
  useEffect(() => {
    const currentFont = FONT_FAMILIES.find((f) => f.id === settings.fontFamily);
    if (!currentFont?.googleFont) return;

    const linkId = 'google-font-link';
    let link = document.getElementById(linkId) as HTMLLinkElement;

    if (!link) {
      link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }

    link.href = `https://fonts.googleapis.com/css2?family=${currentFont.googleFont}&display=swap`;
  }, [settings.fontFamily]);

  return <>{children}</>;
};

export default ThemeProvider;
