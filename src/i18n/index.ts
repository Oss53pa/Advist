import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import fr from './locales/fr.json';
import en from './locales/en.json';
import es from './locales/es.json';
import pt from './locales/pt.json';
import ar from './locales/ar.json';

const resources = {
  fr: { translation: fr },
  en: { translation: en },
  es: { translation: es },
  pt: { translation: pt },
  ar: { translation: ar },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'fr',
    defaultNS: 'translation',
    supportedLngs: ['fr', 'en', 'es', 'pt', 'ar'],
    load: 'languageOnly', // This ensures 'fr-FR' becomes 'fr'

    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'advist_language',
    },

    interpolation: {
      escapeValue: false,
    },

    react: {
      useSuspense: false,
      bindI18n: 'languageChanged loaded',
      bindI18nStore: 'added removed',
    },
  });

export default i18n;

// Helper function to change language
export const changeLanguage = (lang: string) => {
  i18n.changeLanguage(lang);
  localStorage.setItem('advist_language', lang);
};

// Get current language
export const getCurrentLanguage = () => i18n.language;

// Available languages
export const languages = [
  { code: 'fr', name: 'Français', flag: '🇫🇷', region: 'International' },
  { code: 'en', name: 'English', flag: '🇬🇧', region: 'International' },
  { code: 'es', name: 'Español', flag: '🇪🇸', region: 'International' },
  { code: 'pt', name: 'Português', flag: '🇧🇷', region: 'International' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦', region: 'International', rtl: true },
];
