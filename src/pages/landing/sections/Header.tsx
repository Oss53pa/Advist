import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowRight,
  Sparkles,
  Menu,
  X,
  ChevronDown,
  Smartphone,
  Shield,
  BookOpen,
  Play,
  Zap,
  FileText,
  GitBranch,
  BarChart3,
} from 'lucide-react';
import { LanguageSwitcher } from '../../../components/ui/LanguageSwitcher';

export const Header: React.FC = () => {
  const { t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  // Main nav items (visible in navbar)
  const NAV_ITEMS = [
    { href: '#features', label: t('landingNav.features', 'Fonctionnalités'), icon: FileText },
    { href: '#how-it-works', label: t('landingNav.howItWorks', 'Comment ça marche'), icon: Zap },
    { href: '#demo', label: t('landingNav.demo', 'Démo'), icon: Play },
    { href: '#proph3t', label: 'Proph3t', isNew: true, icon: Sparkles },
    { href: '#pricing', label: t('landingNav.pricing', 'Tarifs'), icon: BarChart3 },
  ];

  // More dropdown items
  const MORE_ITEMS = [
    {
      href: '#mobile-app',
      label: t('landingNav.mobileApp', 'Application Mobile'),
      icon: Smartphone,
      desc: 'iOS & Android',
    },
    {
      href: '#integrations',
      label: t('landingNav.integrations', 'Intégrations'),
      icon: GitBranch,
      desc: 'M365, Sage, SAP...',
    },
    {
      href: '#compliance',
      label: t('landingNav.compliance', 'Conformité'),
      icon: Shield,
      desc: 'RGPD, eIDAS, OHADA',
    },
    {
      href: '#blog',
      label: t('landingNav.blog', 'Blog'),
      icon: BookOpen,
      desc: 'Articles & Guides',
    },
  ];

  // All items for section detection
  const ALL_SECTIONS = [...NAV_ITEMS, ...MORE_ITEMS].map((item) => item.href.replace('#', ''));

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);

      // Active section detection
      for (const section of [...ALL_SECTIONS].reverse()) {
        const el = document.getElementById(section);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 100) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setIsMoreOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled
            ? 'bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center group">
              <span
                className={`font-decorative text-2xl lg:text-3xl transition-colors duration-300 ${
                  isScrolled ? 'text-gray-900' : 'text-white'
                }`}
              >
                Advist
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center">
              <div
                className={`flex items-center gap-1 p-1.5 rounded-full transition-all duration-300 ${
                  isScrolled ? 'bg-gray-100' : 'bg-white/5 backdrop-blur-lg border border-white/10'
                }`}
              >
                {NAV_ITEMS.map((item) => {
                  const isActive = activeSection === item.href.replace('#', '');
                  const isProph3t = item.href === '#proph3t';

                  return (
                    <a
                      key={item.href}
                      href={item.href}
                      className={`relative px-4 py-2 text-sm font-medium rounded-full transition-all duration-300 ${
                        isActive
                          ? isScrolled
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'bg-white/20 text-white'
                          : isScrolled
                            ? 'text-gray-600 hover:text-gray-900 hover:bg-white/80'
                            : 'text-white/70 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        {isProph3t ? (
                          <>
                            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                            <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent font-semibold">
                              {item.label}
                            </span>
                          </>
                        ) : (
                          item.label
                        )}
                        {item.isNew && !isProph3t && (
                          <span className="px-1.5 py-0.5 text-[10px] font-bold bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-full">
                            NEW
                          </span>
                        )}
                      </span>
                    </a>
                  );
                })}

                {/* More dropdown */}
                <div ref={moreRef} className="relative">
                  <button
                    onClick={() => setIsMoreOpen(!isMoreOpen)}
                    className={`flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-full transition-all duration-300 ${
                      MORE_ITEMS.some((item) => activeSection === item.href.replace('#', ''))
                        ? isScrolled
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'bg-white/20 text-white'
                        : isScrolled
                          ? 'text-gray-600 hover:text-gray-900 hover:bg-white/80'
                          : 'text-white/70 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    Plus
                    <ChevronDown
                      className={`w-4 h-4 transition-transform duration-200 ${isMoreOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {/* Dropdown menu */}
                  <div
                    className={`absolute top-full right-0 mt-2 w-64 py-2 bg-white rounded-2xl shadow-xl border border-gray-100 transition-all duration-200 ${
                      isMoreOpen
                        ? 'opacity-100 translate-y-0 pointer-events-auto'
                        : 'opacity-0 -translate-y-2 pointer-events-none'
                    }`}
                  >
                    {MORE_ITEMS.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeSection === item.href.replace('#', '');

                      return (
                        <a
                          key={item.href}
                          href={item.href}
                          onClick={() => setIsMoreOpen(false)}
                          className={`flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${
                            isActive ? 'bg-gray-50' : ''
                          }`}
                        >
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                              isActive ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            <Icon className="w-5 h-5" />
                          </div>
                          <div>
                            <p
                              className={`text-sm font-medium ${isActive ? 'text-gray-900' : 'text-gray-700'}`}
                            >
                              {item.label}
                            </p>
                            <p className="text-xs text-gray-400">{item.desc}</p>
                          </div>
                        </a>
                      );
                    })}
                  </div>
                </div>
              </div>
            </nav>

            {/* Right side actions */}
            <div className="hidden lg:flex items-center gap-3">
              <LanguageSwitcher />

              <Link to="/select-profile">
                <button
                  className={`px-5 py-2.5 text-sm font-medium rounded-xl transition-all duration-300 ${
                    isScrolled
                      ? 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {t('auth.login', 'Connexion')}
                </button>
              </Link>

              <Link to="/register">
                <button
                  className={`group relative px-5 py-2.5 text-sm font-semibold rounded-xl overflow-hidden transition-all duration-300 ${
                    isScrolled
                      ? 'bg-gray-900 text-white hover:bg-gray-800'
                      : 'bg-white text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <span className="relative z-10 flex items-center gap-2">
                    {t('landingNav.freeTrial', 'Essai gratuit')}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </button>
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              className={`lg:hidden p-2.5 rounded-xl transition-all duration-300 ${
                isScrolled ? 'text-gray-900 hover:bg-gray-100' : 'text-white hover:bg-white/10'
              }`}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu overlay */}
      <div
        className={`fixed inset-0 z-40 lg:hidden transition-all duration-300 ${
          isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={() => setIsMenuOpen(false)}
        />

        {/* Menu panel */}
        <div
          className={`absolute top-0 right-0 w-full max-w-sm h-full bg-white shadow-2xl transition-transform duration-300 overflow-y-auto ${
            isMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="p-6">
            {/* Close button */}
            <div className="flex justify-end mb-6">
              <button
                onClick={() => setIsMenuOpen(false)}
                className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            {/* Main navigation links */}
            <div className="mb-6">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Navigation
              </p>
              <nav className="space-y-1">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isProph3t = item.href === '#proph3t';
                  const isActive = activeSection === item.href.replace('#', '');

                  return (
                    <a
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMenuOpen(false)}
                      className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                        isActive ? 'bg-gray-100' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          isProph3t
                            ? 'bg-gradient-to-br from-amber-500 to-orange-500'
                            : isActive
                              ? 'bg-gray-900 text-white'
                              : 'bg-gray-100'
                        }`}
                      >
                        <Icon
                          className={`w-5 h-5 ${isProph3t || isActive ? 'text-white' : 'text-gray-600'}`}
                        />
                      </div>
                      <span
                        className={`font-medium ${
                          isProph3t
                            ? 'bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent'
                            : isActive
                              ? 'text-gray-900'
                              : 'text-gray-700'
                        }`}
                      >
                        {item.label}
                      </span>
                      {item.isNew && (
                        <span className="ml-auto px-2 py-0.5 text-[10px] font-bold bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-full">
                          NEW
                        </span>
                      )}
                    </a>
                  );
                })}
              </nav>
            </div>

            {/* More sections */}
            <div className="mb-6">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Découvrir
              </p>
              <nav className="space-y-1">
                {MORE_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSection === item.href.replace('#', '');

                  return (
                    <a
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMenuOpen(false)}
                      className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                        isActive ? 'bg-gray-100' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          isActive ? 'bg-gray-900 text-white' : 'bg-gray-100'
                        }`}
                      >
                        <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-600'}`} />
                      </div>
                      <div>
                        <p
                          className={`font-medium ${isActive ? 'text-gray-900' : 'text-gray-700'}`}
                        >
                          {item.label}
                        </p>
                        <p className="text-xs text-gray-400">{item.desc}</p>
                      </div>
                    </a>
                  );
                })}
              </nav>
            </div>

            {/* Action buttons */}
            <div className="space-y-3 pt-4 border-t border-gray-100">
              <Link to="/select-profile" className="block" onClick={() => setIsMenuOpen(false)}>
                <button className="w-full py-3.5 text-gray-700 font-medium border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                  {t('auth.login', 'Connexion')}
                </button>
              </Link>
              <Link to="/register" className="block" onClick={() => setIsMenuOpen(false)}>
                <button className="w-full py-3.5 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 transition-colors flex items-center justify-center gap-2">
                  {t('landingNav.freeTrial', 'Essai gratuit')}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            </div>

            {/* Language switcher */}
            <div className="mt-6 pt-6 border-t border-gray-100">
              <LanguageSwitcher variant="inline" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Header;
