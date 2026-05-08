/**
 * AtlasStudioRedirect — Redirection vers Atlas Studio
 *
 * Les paiements, inscriptions et abonnements sont gérés exclusivement
 * sur Atlas Studio (atlas-studio.org). Cette page redirige les utilisateurs
 * qui tentent d'accéder aux anciennes routes de checkout/register/billing.
 */
import React, { useEffect } from 'react';
import { ExternalLink } from 'lucide-react';

interface AtlasStudioRedirectProps {
  destination?: 'pricing' | 'signup' | 'portal' | 'billing' | 'forgot-password' | 'reset-password';
  message?: string;
}

const DESTINATIONS = {
  pricing: 'https://atlas-studio.org/applications/advist',
  signup: 'https://atlas-studio.org/portal/signup',
  portal: 'https://atlas-studio.org/portal',
  billing: 'https://atlas-studio.org/portal',
  'forgot-password': 'https://atlas-studio.org/portal/forgot-password',
  'reset-password': 'https://atlas-studio.org/portal/reset-password',
};

export const AtlasStudioRedirect: React.FC<AtlasStudioRedirectProps> = ({
  destination = 'pricing',
  message,
}) => {
  const url = DESTINATIONS[destination];

  useEffect(() => {
    const timer = setTimeout(() => {
      window.location.href = url;
    }, 1500);
    return () => clearTimeout(timer);
  }, [url]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0A0B] p-4">
      <div className="bg-[#1A1A1D] border border-white/5 rounded-xl shadow-2xl p-8 max-w-md text-center">
        <div className="w-16 h-16 bg-[#C8A961]/15 rounded-full flex items-center justify-center mx-auto mb-4 border border-[#C8A961]/30">
          <ExternalLink className="w-8 h-8 text-[#C8A961]" />
        </div>
        <h1 className="text-2xl font-light text-white mb-2">Redirection vers Atlas Studio</h1>
        <p className="text-white/60 mb-6">
          {message || 'La gestion de compte est centralisée sur le portail Atlas Studio.'}
        </p>
        <div className="space-y-3">
          <a
            href={url}
            className="block w-full px-6 py-3 bg-[#C8A961] text-[#0A0A0B] rounded-xl font-semibold hover:bg-[#C8A961]/90 transition-all"
          >
            Continuer
          </a>
          <p className="text-xs text-white/40">Redirection automatique…</p>
        </div>
      </div>
    </div>
  );
};

export default AtlasStudioRedirect;
