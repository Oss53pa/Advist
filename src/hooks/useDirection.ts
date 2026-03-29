/**
 * RTL (Right-to-Left) Direction Hook
 *
 * This hook manages text direction based on the current language.
 * It automatically updates the HTML dir attribute when the language changes.
 *
 * @module hooks/useDirection
 */
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { languages } from '../i18n';

/**
 * Languages that require RTL (Right-to-Left) direction
 */
const RTL_LANGUAGES = languages.filter((lang) => lang.rtl).map((lang) => lang.code);

/**
 * Check if a language code requires RTL direction
 */
export function isRTL(languageCode: string): boolean {
  return RTL_LANGUAGES.includes(languageCode);
}

/**
 * Hook that manages document direction based on current language
 *
 * @returns Current direction ('ltr' | 'rtl')
 *
 * @example
 * ```tsx
 * function App() {
 *   const direction = useDirection();
 *   return <div className={direction === 'rtl' ? 'rtl-layout' : ''}>...</div>;
 * }
 * ```
 */
export function useDirection(): 'ltr' | 'rtl' {
  const { i18n } = useTranslation();
  const currentLanguage = i18n.language;
  const direction = isRTL(currentLanguage) ? 'rtl' : 'ltr';

  useEffect(() => {
    // Update HTML element attributes
    const html = document.documentElement;

    // Set direction
    html.setAttribute('dir', direction);
    html.setAttribute('lang', currentLanguage);

    // Update body classes for Tailwind RTL support
    if (direction === 'rtl') {
      document.body.classList.add('rtl');
      document.body.classList.remove('ltr');
    } else {
      document.body.classList.add('ltr');
      document.body.classList.remove('rtl');
    }

    // Cleanup on unmount
    return () => {
      document.body.classList.remove('rtl', 'ltr');
    };
  }, [direction, currentLanguage]);

  return direction;
}

/**
 * Get the appropriate text alignment class based on direction
 */
export function getTextAlign(direction: 'ltr' | 'rtl'): string {
  return direction === 'rtl' ? 'text-right' : 'text-left';
}

/**
 * Get margin/padding direction classes
 */
export function getDirectionalClasses(direction: 'ltr' | 'rtl') {
  return {
    marginStart: direction === 'rtl' ? 'mr' : 'ml',
    marginEnd: direction === 'rtl' ? 'ml' : 'mr',
    paddingStart: direction === 'rtl' ? 'pr' : 'pl',
    paddingEnd: direction === 'rtl' ? 'pl' : 'pr',
    left: direction === 'rtl' ? 'right' : 'left',
    right: direction === 'rtl' ? 'left' : 'right',
  };
}

export default useDirection;
