import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Check } from 'lucide-react';
import { languages, changeLanguage } from '../../i18n';

interface LanguageSwitcherProps {
  variant?: 'dropdown' | 'inline';
  showLabel?: boolean;
  className?: string;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  variant = 'dropdown',
  showLabel = true,
  className = '',
}) => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const currentLanguage = languages.find((lang) => lang.code === i18n.language) || languages[0];

  const handleLanguageChange = (langCode: string) => {
    changeLanguage(langCode);
    setIsOpen(false);
  };

  if (variant === 'inline') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className={`
              px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
              ${
                i18n.language === lang.code
                  ? 'bg-advist-dark text-white'
                  : 'text-advist-gray900 hover:bg-advist-bg'
              }
            `}
          >
            <span className="mr-1.5">{lang.flag}</span>
            {lang.code.toUpperCase()}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-advist-bg transition-colors"
      >
        <Globe size={18} className="text-advist-gray900" />
        {showLabel && (
          <>
            <span className="text-sm font-medium text-advist-gray900">
              {currentLanguage.flag} {currentLanguage.code.toUpperCase()}
            </span>
          </>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-advist-bg overflow-hidden z-50">
            <div className="py-1">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`
                    flex items-center justify-between w-full px-4 py-2.5 text-left transition-colors
                    ${
                      i18n.language === lang.code
                        ? 'bg-advist-bg text-advist-gray900'
                        : 'text-advist-gray900 hover:bg-advist-bg/50'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{lang.flag}</span>
                    <span className="text-sm font-medium">{lang.name}</span>
                  </div>
                  {i18n.language === lang.code && (
                    <Check size={16} className="text-advist-gray900" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
