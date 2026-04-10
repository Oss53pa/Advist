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
  destination?: 'pricing' | 'register' | 'portal' | 'billing';
  message?: string;
}

const DESTINATIONS = {
  pricing: 'https://atlas-studio.org/applications/advist',
  register: 'https://atlas-studio.org/register',
  portal: 'https://atlas-studio.org/portal',
  billing: 'https://atlas-studio.org/portal/billing',
};

export const AtlasStudioRedirect: React.FC<AtlasStudioRedirectProps> = ({
  destination = 'pricing',
  message,
}) => {
  const url = DESTINATIONS[destination];

  useEffect(() => {
    const timer = setTimeout(() => {
      window.location.href = url;
    }, 2000);
    return () => clearTimeout(timer);
  }, [url]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
        <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <ExternalLink className="w-8 h-8 text-primary-700" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Redirection vers Atlas Studio</h1>
        <p className="text-gray-600 mb-6">
          {message || 'Les abonnements et paiements sont gérés sur le portail Atlas Studio.'}
        </p>
        <div className="space-y-3">
          <a
            href={url}
            className="block w-full px-6 py-3 bg-primary-900 text-white rounded-lg font-medium hover:bg-primary-800 transition-all"
          >
            Accéder au portail
          </a>
          <p className="text-xs text-gray-400">Redirection automatique dans 2 secondes...</p>
        </div>
      </div>
    </div>
  );
};

export default AtlasStudioRedirect;
