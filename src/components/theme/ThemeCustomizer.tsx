/**
 * Theme Customizer Component
 * Allows users to customize fonts and colors
 */
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Palette, Type, RotateCcw, Square, Sun, Moon, Monitor } from 'lucide-react';
import { Card, Button, Toggle, SelectionButton, ColorPicker } from '../ui';
import {
  useThemeStore,
  FONT_FAMILIES,
  FONT_SIZES,
  COLOR_PRESETS,
  BORDER_RADIUS_OPTIONS,
  ThemeMode,
} from '../../store';

type TabId = 'theme' | 'colors' | 'typography' | 'layout';

const TABS = [
  { id: 'theme' as TabId, labelKey: 'theme.themeMode', defaultLabel: 'Theme', icon: Sun },
  { id: 'colors' as TabId, labelKey: 'theme.colors', defaultLabel: 'Couleurs', icon: Palette },
  { id: 'typography' as TabId, labelKey: 'theme.typography', defaultLabel: 'Typographie', icon: Type },
  { id: 'layout' as TabId, labelKey: 'theme.layout', defaultLabel: 'Mise en page', icon: Square },
];

const THEME_MODES: { id: ThemeMode; icon: React.ElementType; labelKey: string; defaultLabel: string; descKey: string; defaultDesc: string }[] = [
  {
    id: 'light',
    icon: Sun,
    labelKey: 'theme.lightMode',
    defaultLabel: 'Clair',
    descKey: 'theme.lightModeDesc',
    defaultDesc: 'Interface claire pour un usage en journee'
  },
  {
    id: 'dark',
    icon: Moon,
    labelKey: 'theme.darkMode',
    defaultLabel: 'Sombre',
    descKey: 'theme.darkModeDesc',
    defaultDesc: 'Interface sombre pour reduire la fatigue oculaire'
  },
  {
    id: 'system',
    icon: Monitor,
    labelKey: 'theme.systemMode',
    defaultLabel: 'Systeme',
    descKey: 'theme.systemModeDesc',
    defaultDesc: 'Suit les preferences de votre systeme'
  },
];

const COLOR_FIELDS = [
  { key: 'primary' as const, labelKey: 'theme.colorPrimary', defaultLabel: 'Couleur principale' },
  { key: 'secondary' as const, labelKey: 'theme.colorSecondary', defaultLabel: 'Couleur secondaire' },
  { key: 'accent' as const, labelKey: 'theme.colorAccent', defaultLabel: "Couleur d'accent" },
  { key: 'background' as const, labelKey: 'theme.colorBackground', defaultLabel: 'Arriere-plan' },
  { key: 'surface' as const, labelKey: 'theme.colorSurface', defaultLabel: 'Surface' },
];

export const ThemeCustomizer: React.FC = () => {
  const { t } = useTranslation();
  const {
    settings,
    setFontFamily,
    setFontSize,
    setColorPreset,
    setCustomColor,
    setUseCustomColors,
    setBorderRadius,
    setCompactMode,
    setThemeMode,
    resetToDefaults,
    getCurrentColors,
    isDarkMode,
  } = useThemeStore();

  const [activeTab, setActiveTab] = useState<TabId>('theme');
  const currentColors = getCurrentColors();

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-2 p-1 bg-advist-bg rounded-xl">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all duration-240 ${
              activeTab === tab.id
                ? 'bg-advist-dark text-white shadow-sm'
                : 'text-advist-gray900 hover:bg-white/50'
            }`}
          >
            <tab.icon size={18} />
            {t(tab.labelKey, tab.defaultLabel)}
          </button>
        ))}
      </div>

      {/* Theme Mode Tab */}
      {activeTab === 'theme' && (
        <div className="space-y-6">
          {/* Theme Mode Selection */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-advist-gray900 mb-2">
              {t('theme.selectThemeMode', 'Mode d\'affichage')}
            </h3>
            <p className="text-sm text-advist-gray900/60 mb-6">
              {t('theme.selectThemeModeDesc', 'Choisissez le mode d\'affichage de votre interface')}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {THEME_MODES.map((mode) => {
                const isSelected = settings.themeMode === mode.id;
                return (
                  <SelectionButton
                    key={mode.id}
                    selected={isSelected}
                    onClick={() => setThemeMode(mode.id)}
                    showCheck
                    className="!p-6"
                  >
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 mx-auto transition-colors ${
                      isSelected
                        ? 'bg-advist-dark text-white'
                        : 'bg-advist-surface-dark text-advist-gray900'
                    }`}>
                      <mode.icon size={28} />
                    </div>
                    <span className="text-base font-semibold text-advist-gray900 block mb-1">
                      {t(mode.labelKey, mode.defaultLabel)}
                    </span>
                    <span className="text-xs text-advist-gray900/60">
                      {t(mode.descKey, mode.defaultDesc)}
                    </span>
                  </SelectionButton>
                );
              })}
            </div>
          </Card>

          {/* Current Mode Preview */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-advist-gray900 mb-4">
              {t('theme.preview', 'Apercu')}
            </h3>
            <div className={`p-6 rounded-xl transition-colors ${isDarkMode() ? 'bg-[#1A1D24]' : 'bg-advist-surface-dark'}`}>
              <div className={`p-4 rounded-lg mb-4 transition-colors ${isDarkMode() ? 'bg-[#252D44]' : 'bg-white'}`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDarkMode() ? 'bg-advist-gold-light' : 'bg-advist-dark'}`}>
                    {isDarkMode() ? <Moon size={20} className="text-white" /> : <Sun size={20} className="text-white" />}
                  </div>
                  <div>
                    <p className={`font-semibold transition-colors ${isDarkMode() ? 'text-white' : 'text-advist-gray900'}`}>
                      {isDarkMode() ? t('theme.darkModeActive', 'Mode sombre actif') : t('theme.lightModeActive', 'Mode clair actif')}
                    </p>
                    <p className={`text-sm transition-colors ${isDarkMode() ? 'text-advist-text-muted' : 'text-advist-gray900/60'}`}>
                      {settings.themeMode === 'system'
                        ? t('theme.systemModeInfo', 'Base sur les preferences systeme')
                        : t('theme.manualModeInfo', 'Mode selectionne manuellement')
                      }
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className={`px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors ${isDarkMode() ? 'bg-advist-gold-light' : 'bg-advist-dark'}`}>
                    {t('theme.sampleButton', 'Bouton exemple')}
                  </button>
                  <button className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isDarkMode() ? 'bg-advist-dark text-white' : 'bg-advist-surface-dark text-advist-gray900'}`}>
                    {t('theme.sampleSecondary', 'Secondaire')}
                  </button>
                </div>
              </div>
              <div className="flex gap-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`flex-1 h-8 rounded-lg transition-colors ${
                      isDarkMode()
                        ? i === 1 ? 'bg-advist-gold-light' : i === 2 ? 'bg-[#3D4556]' : 'bg-[#2D3548]'
                        : i === 1 ? 'bg-advist-dark' : i === 2 ? 'bg-advist-gold-light' : 'bg-white'
                    }`}
                  />
                ))}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Colors Tab */}
      {activeTab === 'colors' && (
        <div className="space-y-6">
          {/* Preset Themes */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-advist-gray900 mb-4">
              {t('theme.presetThemes', 'Themes predefinis')}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {COLOR_PRESETS.map((preset) => {
                const isSelected = settings.colorPreset === preset.id && !settings.useCustomColors;
                return (
                  <SelectionButton
                    key={preset.id}
                    selected={isSelected}
                    onClick={() => setColorPreset(preset.id)}
                    showCheck
                    className="!border-transparent hover:!border-advist-border"
                  >
                    <div className="flex gap-1 mb-3">
                      {['primary', 'secondary', 'accent'].map((colorKey) => (
                        <div
                          key={colorKey}
                          className="w-8 h-8 rounded-lg"
                          style={{ backgroundColor: preset.colors[colorKey as keyof typeof preset.colors] }}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-medium text-advist-gray900">{preset.name}</span>
                  </SelectionButton>
                );
              })}
            </div>
          </Card>

          {/* Custom Colors */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-advist-gray900">
                {t('theme.customColors', 'Couleurs personnalisees')}
              </h3>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.useCustomColors}
                  onChange={(e) => setUseCustomColors(e.target.checked)}
                  className="w-4 h-4 rounded border-advist-border text-advist-blue-light focus:ring-advist-blue-light"
                />
                <span className="text-sm text-advist-gray900">
                  {t('theme.useCustom', 'Utiliser mes couleurs')}
                </span>
              </label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {COLOR_FIELDS.map((field) => (
                <ColorPicker
                  key={field.key}
                  label={t(field.labelKey, field.defaultLabel)}
                  value={settings.customColors[field.key]}
                  onChange={(value) => setCustomColor(field.key, value)}
                />
              ))}
            </div>
          </Card>

          {/* Color Preview */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-advist-gray900 mb-4">
              {t('theme.preview', 'Apercu')}
            </h3>
            <div className="p-6 rounded-xl" style={{ backgroundColor: currentColors.background }}>
              <div className="p-4 rounded-lg mb-4" style={{ backgroundColor: currentColors.surface }}>
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: currentColors.primary }}
                  >
                    <span className="text-white font-bold">A</span>
                  </div>
                  <div>
                    <p style={{ color: currentColors.primary }} className="font-semibold">
                      {t('theme.previewTitle', 'Titre exemple')}
                    </p>
                    <p style={{ color: currentColors.secondary }} className="text-sm">
                      {t('theme.previewDescription', 'Description secondaire')}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    className="px-4 py-2 rounded-lg text-white text-sm font-medium"
                    style={{ backgroundColor: currentColors.primary }}
                  >
                    {t('theme.previewButton', 'Bouton principal')}
                  </button>
                  <button
                    className="px-4 py-2 rounded-lg text-white text-sm font-medium"
                    style={{ backgroundColor: currentColors.accent }}
                  >
                    {t('theme.previewAction', 'Action')}
                  </button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Typography Tab */}
      {activeTab === 'typography' && (
        <div className="space-y-6">
          {/* Font Family */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-advist-gray900 mb-4">
              {t('theme.fontFamily', 'Police de caracteres')}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {FONT_FAMILIES.map((font) => (
                <SelectionButton
                  key={font.id}
                  selected={settings.fontFamily === font.id}
                  onClick={() => setFontFamily(font.id)}
                >
                  <span className="text-lg text-advist-gray900 block mb-1" style={{ fontFamily: font.value }}>
                    Aa
                  </span>
                  <span className="text-xs text-advist-gray900/60">{font.name}</span>
                </SelectionButton>
              ))}
            </div>
          </Card>

          {/* Font Size */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-advist-gray900 mb-4">
              {t('theme.fontSize', 'Taille du texte')}
            </h3>
            <div className="flex gap-3">
              {FONT_SIZES.map((size) => (
                <SelectionButton
                  key={size.id}
                  selected={settings.fontSize === size.id}
                  onClick={() => setFontSize(size.id)}
                  className="flex-1"
                >
                  <span className="text-advist-gray900 block mb-1" style={{ fontSize: `${size.scale * 16}px` }}>
                    Texte
                  </span>
                  <span className="text-xs text-advist-gray900/60">{size.name}</span>
                </SelectionButton>
              ))}
            </div>
          </Card>

          {/* Typography Preview */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-advist-gray900 mb-4">
              {t('theme.preview', 'Apercu')}
            </h3>
            <div
              className="p-4 bg-advist-bg rounded-lg space-y-2"
              style={{
                fontFamily: FONT_FAMILIES.find((f) => f.id === settings.fontFamily)?.value,
                fontSize: `${(FONT_SIZES.find((s) => s.id === settings.fontSize)?.scale || 1) * 16}px`,
              }}
            >
              <h4 className="text-xl font-bold text-advist-gray900">
                {t('theme.previewDocTitle', 'Titre de document')}
              </h4>
              <p className="text-advist-gray900/80">
                {t('theme.previewDocText', 'Voici un exemple de texte avec la police et la taille selectionnees.')}
              </p>
              <p className="text-sm text-advist-gray900/60">
                {t('theme.previewDocSmall', 'Texte secondaire plus petit pour les details.')}
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* Layout Tab */}
      {activeTab === 'layout' && (
        <div className="space-y-6">
          {/* Border Radius */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-advist-gray900 mb-4">
              {t('theme.borderRadius', 'Arrondi des coins')}
            </h3>
            <div className="flex gap-3">
              {BORDER_RADIUS_OPTIONS.map((option) => (
                <SelectionButton
                  key={option.id}
                  selected={settings.borderRadius === option.id}
                  onClick={() => setBorderRadius(option.id)}
                  className="flex-1"
                  style={{ borderRadius: option.value }}
                >
                  <div
                    className="w-12 h-8 bg-advist-dark mx-auto mb-2"
                    style={{ borderRadius: option.value }}
                  />
                  <span className="text-xs text-advist-gray900/60">
                    {t(`theme.radius${option.id.charAt(0).toUpperCase() + option.id.slice(1)}`, option.label)}
                  </span>
                </SelectionButton>
              ))}
            </div>
          </Card>

          {/* Compact Mode */}
          <Card className="p-6">
            <Toggle
              checked={settings.compactMode}
              onChange={setCompactMode}
              label={t('theme.compactMode', 'Mode compact')}
              description={t('theme.compactModeDesc', "Reduit l'espacement pour afficher plus de contenu")}
            />
          </Card>

          {/* Layout Preview */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-advist-gray900 mb-4">
              {t('theme.preview', 'Apercu')}
            </h3>
            <div className={`p-4 bg-advist-bg rounded-lg ${settings.compactMode ? 'space-y-2' : 'space-y-4'}`}>
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className={`bg-white ${settings.compactMode ? 'p-2' : 'p-4'}`}
                  style={{
                    borderRadius: BORDER_RADIUS_OPTIONS.find((r) => r.id === settings.borderRadius)?.value,
                  }}
                >
                  <div className="h-3 w-3/4 bg-advist-dark/20 rounded mb-2" />
                  <div className="h-2 w-1/2 bg-advist-dark/10 rounded" />
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Reset Button */}
      <div className="flex justify-end">
        <Button variant="outline" onClick={resetToDefaults} leftIcon={<RotateCcw size={16} />}>
          {t('theme.resetDefaults', 'Reinitialiser par defaut')}
        </Button>
      </div>
    </div>
  );
};

export default ThemeCustomizer;
