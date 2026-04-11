/**
 * HelpFab — Bouton flottant d'aide (Floating Action Button)
 *
 * Affiché en bas à gauche sur toutes les pages authentifiées.
 * Ouvre un menu rapide avec :
 * - Centre d'aide
 * - Documentation
 * - Visite guidée (relancer)
 * - Demo interactive
 * - Contact support
 */
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { HelpCircle, X, Book, PlayCircle, Mail, Sparkles, ExternalLink } from 'lucide-react';

const STORAGE_KEY = 'advist-onboarding-completed';

export const HelpFab: React.FC = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  const restartTour = () => {
    localStorage.removeItem(STORAGE_KEY);
    setOpen(false);
    window.location.reload();
  };

  const items = [
    {
      icon: Book,
      label: "Centre d'aide",
      desc: 'FAQ, guides, contact',
      action: () => {
        setOpen(false);
        navigate('/help');
      },
      color: 'text-blue-600 bg-blue-50',
    },
    {
      icon: HelpCircle,
      label: 'Documentation',
      desc: 'Guides détaillés',
      action: () => {
        setOpen(false);
        navigate('/docs');
      },
      color: 'text-purple-600 bg-purple-50',
    },
    {
      icon: Sparkles,
      label: 'Visite guidée',
      desc: 'Relancer le tour',
      action: restartTour,
      color: 'text-amber-600 bg-amber-50',
    },
    {
      icon: PlayCircle,
      label: 'Démo interactive',
      desc: 'Tester les fonctions',
      action: () => {
        setOpen(false);
        window.open('/demo', '_blank');
      },
      color: 'text-green-600 bg-green-50',
    },
    {
      icon: Mail,
      label: 'Contacter le support',
      desc: 'support@advist.africa',
      action: () => {
        setOpen(false);
        window.location.href = 'mailto:support@advist.africa';
      },
      color: 'text-rose-600 bg-rose-50',
    },
  ];

  return (
    <div ref={ref} className="fixed bottom-6 left-6 z-40 print:hidden">
      {/* Menu */}
      {open && (
        <div className="absolute bottom-16 left-0 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in slide-in-from-bottom-2 fade-in duration-200">
          <div className="px-4 py-3 bg-gradient-to-br from-primary-900 to-primary-800 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-sm">Besoin d'aide ?</h3>
                <p className="text-xs text-white/70">Choisissez une option</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                aria-label="Fermer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="p-2">
            {items.map((item, i) => {
              const Icon = item.icon;
              return (
                <button
                  key={i}
                  onClick={item.action}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-all text-left group"
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${item.color}`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{item.label}</p>
                    <p className="text-xs text-gray-500 truncate">{item.desc}</p>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-500 transition-colors" />
                </button>
              );
            })}
          </div>
          <div className="px-4 py-2 border-t border-gray-100 text-center">
            <p className="text-[10px] text-gray-400">Conforme Loi CI 2013-546 · eIDAS · OHADA</p>
          </div>
        </div>
      )}

      {/* FAB button */}
      <button
        onClick={() => setOpen(!open)}
        className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all ${
          open
            ? 'bg-primary-700 text-white scale-95'
            : 'bg-primary-900 text-white hover:bg-primary-800 hover:scale-105'
        }`}
        aria-label="Centre d'aide"
        aria-expanded={open}
      >
        {open ? <X className="w-6 h-6" /> : <HelpCircle className="w-6 h-6" />}
      </button>
    </div>
  );
};

export default HelpFab;
