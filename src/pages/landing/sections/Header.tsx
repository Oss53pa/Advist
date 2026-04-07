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
            ? 'bg-[#0A0A0B]/90 backdrop-blur-xl border-b border-white/10 shadow-lg shadow-black/20'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-20">
            {/* Logo + Atlas Studio badge */}
            <div className="flex items-center gap-3">
              <Link to="/" className="flex items-center group">
                <span className="font-decorative text-2xl lg:text-3xl text-white transition-colors duration-300">
                  Advist
                </span>
              </Link>
              <a
                href="https://atlas-studio.org"
                className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ${
                  isScrolled
                    ? 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700'
                    : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'
                }`}
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="15 18 9 12 15 6" />
                </svg>
                <span
                  className="font-decorative normal-case tracking-normal"
                  style={{ color: '#EF9F27' }}
                >
                  Atlas
                </span>
                Studio
              </a>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center">
              <div className="flex items-center gap-1 p-1.5 rounded-full bg-white/5 backdrop-blur-lg border border-white/10">
                {NAV_ITEMS.map((item) => {
                  const isActive = activeSection === item.href.replace('#', '');
                  const isProph3t = item.href === '#proph3t';

                  return (
                    <a
                      key={item.href}
                      href={item.href}
                      className={`relative px-4 py-2 text-sm font-medium rounded-full transition-all duration-300 ${
                        isActive
                          ? 'bg-[#C8A961]/20 text-[#C8A961]'
                          : 'text-white/70 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        {isProph3t ? (
                          <>
                            <Sparkles className="w-3.5 h-3.5 text-[#C8A961]" />
                            <span className="text-[#C8A961] font-semibold">{item.label}</span>
                          </>
                        ) : (
                          item.label
                        )}
                        {item.isNew && !isProph3t && (
                          <span className="px-1.5 py-0.5 text-[10px] font-bold bg-[#C8A961] text-[#0A0A0B] rounded-full">
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
                        ? 'bg-[#C8A961]/20 text-[#C8A961]'
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
                    className={`absolute top-full right-0 mt-2 w-64 py-2 bg-[#1A1A1D] rounded-2xl shadow-xl border border-white/10 transition-all duration-200 ${
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
                          className={`flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors ${
                            isActive ? 'bg-white/5' : ''
                          }`}
                        >
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                              isActive ? 'bg-[#C8A961] text-[#0A0A0B]' : 'bg-white/10 text-white/60'
                            }`}
                          >
                            <Icon className="w-5 h-5" />
                          </div>
                          <div>
                            <p
                              className={`text-sm font-medium ${isActive ? 'text-[#C8A961]' : 'text-white/80'}`}
                            >
                              {item.label}
                            </p>
                            <p className="text-xs text-white/40">{item.desc}</p>
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
                <button className="px-5 py-2.5 text-sm font-medium rounded-xl transition-all duration-300 text-white/80 hover:text-white hover:bg-white/10">
                  {t('auth.login', 'Connexion')}
                </button>
              </Link>

              <a href="https://atlas-studio.org/portal?app=advist">
                <button className="group relative px-5 py-2.5 text-sm font-semibold rounded-xl overflow-hidden transition-all duration-300 bg-[#C8A961] text-[#0A0A0B] hover:bg-[#D4B872]">
                  <span className="relative z-10 flex items-center gap-2">
                    {t('landingNav.subscribe', 'Souscrire')}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </button>
              </a>
            </div>

            {/* Mobile menu button */}
            <button
              className="lg:hidden p-2.5 rounded-xl transition-all duration-300 text-white hover:bg-white/10"
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
          className={`absolute top-0 right-0 w-full max-w-sm h-full bg-[#0A0A0B] shadow-2xl transition-transform duration-300 overflow-y-auto ${
            isMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="p-6">
            {/* Close button */}
            <div className="flex justify-end mb-6">
              <button
                onClick={() => setIsMenuOpen(false)}
                className="p-2 rounded-xl hover:bg-white/10 transition-colors"
              >
                <X className="w-6 h-6 text-white/60" />
              </button>
            </div>

            {/* Back to Atlas Studio */}
            <a
              href="https://atlas-studio.org"
              className="flex items-center gap-3 p-3 mb-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-all border border-gray-200"
            >
              <div className="w-10 h-10 rounded-xl bg-[#0A0A0B] flex items-center justify-center">
                <span className="font-decorative text-sm" style={{ color: '#EF9F27' }}>
                  A
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Atlas Studio</p>
                <p className="text-xs text-gray-500">Retour au portail</p>
              </div>
              <svg
                className="w-4 h-4 text-gray-400 ml-auto"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </a>

            {/* Main navigation links */}
            <div className="mb-6">
              <p className="text-xs font-semibold text-[#C8A961]/60 uppercase tracking-wider mb-3">
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
                        isActive ? 'bg-[#C8A961]/10' : 'hover:bg-white/5'
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          isProph3t
                            ? 'bg-[#C8A961]'
                            : isActive
                              ? 'bg-[#C8A961] text-[#0A0A0B]'
                              : 'bg-white/10'
                        }`}
                      >
                        <Icon
                          className={`w-5 h-5 ${isProph3t || isActive ? 'text-[#0A0A0B]' : 'text-white/60'}`}
                        />
                      </div>
                      <span
                        className={`font-medium ${
                          isProph3t
                            ? 'text-[#C8A961]'
                            : isActive
                              ? 'text-[#C8A961]'
                              : 'text-white/80'
                        }`}
                      >
                        {item.label}
                      </span>
                      {item.isNew && (
                        <span className="ml-auto px-2 py-0.5 text-[10px] font-bold bg-[#C8A961] text-[#0A0A0B] rounded-full">
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
              <p className="text-xs font-semibold text-[#C8A961]/60 uppercase tracking-wider mb-3">
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
                        isActive ? 'bg-[#C8A961]/10' : 'hover:bg-white/5'
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          isActive ? 'bg-[#C8A961] text-[#0A0A0B]' : 'bg-white/10'
                        }`}
                      >
                        <Icon
                          className={`w-5 h-5 ${isActive ? 'text-[#0A0A0B]' : 'text-white/60'}`}
                        />
                      </div>
                      <div>
                        <p
                          className={`font-medium ${isActive ? 'text-[#C8A961]' : 'text-white/80'}`}
                        >
                          {item.label}
                        </p>
                        <p className="text-xs text-white/40">{item.desc}</p>
                      </div>
                    </a>
                  );
                })}
              </nav>
            </div>

            {/* Action buttons */}
            <div className="space-y-3 pt-4 border-t border-white/10">
              <Link to="/select-profile" className="block" onClick={() => setIsMenuOpen(false)}>
                <button className="w-full py-3.5 text-white/80 font-medium border border-white/20 rounded-xl hover:bg-white/5 transition-colors">
                  {t('auth.login', 'Connexion')}
                </button>
              </Link>
              <a
                href="https://atlas-studio.org/portal?app=advist"
                className="block"
                onClick={() => setIsMenuOpen(false)}
              >
                <button className="w-full py-3.5 bg-[#C8A961] text-[#0A0A0B] font-semibold rounded-xl hover:bg-[#D4B872] transition-colors flex items-center justify-center gap-2">
                  {t('landingNav.subscribe', 'Souscrire')}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </a>
            </div>

            {/* Language switcher */}
            <div className="mt-6 pt-6 border-t border-white/10">
              <LanguageSwitcher variant="inline" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Header;
