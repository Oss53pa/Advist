/**
 * CGU Guard — Verifie l'acceptation des CGU courantes
 * Module 8 — Mentions legales et CGU
 *
 * Affiche un modal blocant si l'utilisateur n'a pas accepte
 * la version courante des CGU.
 */
import React, { useState, useEffect } from 'react';
import { FileText, Check, ExternalLink, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface CguGuardProps {
  children: React.ReactNode;
}

export const CguGuard: React.FC<CguGuardProps> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [currentVersion, setCurrentVersion] = useState<{ id: string; version: string } | null>(
    null
  );

  useEffect(() => {
    checkCguAcceptance();
  }, []);

  const checkCguAcceptance = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Get current CGU version
      const { data: version } = await supabase
        .from('cgu_versions')
        .select('id, version')
        .eq('is_current', true)
        .maybeSingle();

      if (!version) {
        // No CGU version defined yet — skip guard
        setLoading(false);
        return;
      }

      setCurrentVersion(version);

      // Check if user has accepted this version
      const { data: acceptance } = await supabase
        .from('cgu_acceptances')
        .select('id')
        .eq('user_id', user.id)
        .eq('cgu_version_id', version.id)
        .maybeSingle();

      if (!acceptance) {
        setShowModal(true);
      }
    } catch {
      // On error, don't block the user
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!currentVersion) return;

    setAccepting(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('cgu_acceptances').insert({
        user_id: user.id,
        email: user.email || '',
        cgu_version_id: currentVersion.id,
        user_agent: navigator.userAgent,
      });

      setAccepted(true);
      setTimeout(() => setShowModal(false), 500);
    } catch {
      // Silently fail — don't block
      setShowModal(false);
    } finally {
      setAccepting(false);
    }
  };

  if (loading) return <>{children}</>;

  return (
    <>
      {children}

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-xl w-full max-w-lg overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary-700" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Conditions Generales d'Utilisation
                  </h3>
                  <p className="text-xs text-gray-500">
                    Version {currentVersion?.version} — Acceptation requise
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {accepted ? (
                <div className="text-center py-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Check className="w-6 h-6 text-green-600" />
                  </div>
                  <p className="text-green-700 font-medium">CGU acceptees</p>
                </div>
              ) : (
                <>
                  <p className="text-gray-600 text-sm mb-4">
                    Pour continuer a utiliser ADVIST, veuillez accepter les Conditions Generales
                    d'Utilisation en vigueur.
                  </p>

                  <p className="text-gray-600 text-sm mb-4">Les CGU encadrent notamment :</p>
                  <ul className="text-sm text-gray-600 space-y-1 mb-6 list-disc pl-5">
                    <li>La valeur juridique de la signature electronique (Loi CI 2013-546)</li>
                    <li>La duree de conservation des donnees (10 ans pour les contrats)</li>
                    <li>Les droits RGPD des signataires</li>
                    <li>La politique de retention et archivage</li>
                  </ul>

                  <a
                    href="/legal/cgu"
                    target="_blank"
                    className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 text-sm mb-6"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Lire les CGU completes
                  </a>
                </>
              )}
            </div>

            {/* Footer */}
            {!accepted && (
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end">
                <button
                  onClick={handleAccept}
                  disabled={accepting}
                  className="px-6 py-2.5 bg-primary-900 text-white rounded-lg font-medium hover:bg-primary-800 disabled:opacity-50 transition-all flex items-center gap-2"
                >
                  {accepting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      J'accepte les CGU
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default CguGuard;
