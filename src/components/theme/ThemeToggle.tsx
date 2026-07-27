import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useThemeStore, ThemeMode } from '../../store/themeStore';

interface ThemeToggleProps {
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'button' | 'dropdown' | 'switch';
}

const MODE_ICONS: Record<ThemeMode, React.ReactNode> = {
  light: <Sun />,
  dark: <Moon />,
  system: <Monitor />,
};

const MODE_LABELS: Record<ThemeMode, string> = {
  light: 'Clair',
  dark: 'Sombre',
  system: 'Système',
};

const ICON_SIZES = {
  sm: 16,
  md: 20,
  lg: 24,
};

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  showLabel = false,
  size = 'md',
  variant = 'button',
}) => {
  const { settings, setThemeMode, toggleDarkMode, isDarkMode } = useThemeStore();
  const iconSize = ICON_SIZES[size];

  // Simple toggle button (light/dark only)
  if (variant === 'switch') {
    return (
      <button
        onClick={toggleDarkMode}
        className={`
          relative inline-flex items-center justify-center
          p-2 rounded-lg transition-all duration-300
          ${
            isDarkMode()
              ? 'bg-advist-dark text-advist-gold hover:bg-advist-dark/80'
              : 'bg-advist-bg text-advist-gray900 hover:bg-advist-border'
          }
        `}
        title={isDarkMode() ? 'Passer en mode clair' : 'Passer en mode sombre'}
      >
        <div className="relative">
          <Sun
            size={iconSize}
            className={`
              absolute transition-all duration-300
              ${isDarkMode() ? 'opacity-0 rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100'}
            `}
          />
          <Moon
            size={iconSize}
            className={`
              transition-all duration-300
              ${isDarkMode() ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-0'}
            `}
          />
        </div>
        {showLabel && (
          <span className="ml-2 text-sm font-medium">{isDarkMode() ? 'Sombre' : 'Clair'}</span>
        )}
      </button>
    );
  }

  // Dropdown for all three modes
  if (variant === 'dropdown') {
    return (
      <div className="relative group">
        <button
          className={`
            flex items-center gap-2 px-3 py-2 rounded-lg transition-colors
            ${
              isDarkMode()
                ? 'bg-advist-dark text-white hover:bg-advist-dark'
                : 'bg-advist-bg text-advist-gray900 hover:bg-advist-border'
            }
          `}
        >
          {React.cloneElement(MODE_ICONS[settings.themeMode] as React.ReactElement, {
            size: iconSize,
          })}
          {showLabel && (
            <span className="text-sm font-medium">{MODE_LABELS[settings.themeMode]}</span>
          )}
        </button>

        <div
          className={`
          absolute right-0 mt-2 w-40 py-1 rounded-lg shadow-lg border z-50
          opacity-0 invisible group-hover:opacity-100 group-hover:visible
          transition-all duration-200
          ${isDarkMode() ? 'bg-advist-dark border-primary-700' : 'bg-white border-advist-bg'}
        `}
        >
          {(['light', 'dark', 'system'] as ThemeMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setThemeMode(mode)}
              className={`
                w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors
                ${
                  settings.themeMode === mode
                    ? isDarkMode()
                      ? 'bg-advist-dark text-white'
                      : 'bg-advist-bg text-advist-gray900'
                    : isDarkMode()
                      ? 'text-advist-text-muted hover:bg-advist-dark'
                      : 'text-advist-text-secondary hover:bg-advist-bg'
                }
              `}
            >
              {React.cloneElement(MODE_ICONS[mode] as React.ReactElement, { size: 16 })}
              <span>{MODE_LABELS[mode]}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Segmented button (default)
  return (
    <div
      className={`
      inline-flex items-center p-1 rounded-lg
      ${isDarkMode() ? 'bg-advist-dark' : 'bg-advist-bg'}
    `}
    >
      {(['light', 'dark', 'system'] as ThemeMode[]).map((mode) => (
        <button
          key={mode}
          onClick={() => setThemeMode(mode)}
          className={`
            flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-all
            ${
              settings.themeMode === mode
                ? isDarkMode()
                  ? 'bg-advist-dark text-white shadow-sm'
                  : 'bg-white text-advist-gray900 shadow-sm'
                : isDarkMode()
                  ? 'text-advist-text-muted hover:text-advist-text-muted'
                  : 'text-advist-text-secondary hover:text-advist-gray900'
            }
          `}
          title={MODE_LABELS[mode]}
        >
          {React.cloneElement(MODE_ICONS[mode] as React.ReactElement, { size: iconSize - 4 })}
          {showLabel && <span>{MODE_LABELS[mode]}</span>}
        </button>
      ))}
    </div>
  );
};

export default ThemeToggle;
