import React from 'react';
import { Link } from 'react-router-dom';
import { Check, X, Zap, ArrowRight, Star, Shield, Building2, Clock } from 'lucide-react';
import { useScrollAnimation } from '../hooks/useScrollAnimation';

export const PricingSection: React.FC = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section ref={ref} id="pricing" className="py-32 bg-gray-50 relative overflow-hidden">
      <div className="relative max-w-7xl mx-auto px-6">
        {/* Header */}
        <div
          className={`text-center mb-16 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-gray-200 mb-6">
            <Zap className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-500">Tarifs transparents</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Choisissez votre plan
          </h2>
          <p className="text-xl text-gray-400 mb-2">
            1 mois d'essai gratuit sur tous les plans. Droit de retractation inclus.
          </p>
          <p className="text-sm text-gray-400">
            Signataires et validateurs externes illimites sur tous les plans.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-2 max-w-5xl mx-auto gap-6 lg:gap-8">
          {/* Business Plan */}
          <div
            className={`relative rounded-3xl bg-gray-900 text-white shadow-2xl shadow-gray-900/10 transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
          >
            {/* Popular badge */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <div className="flex items-center gap-1.5 px-4 py-1.5 bg-white rounded-full shadow-lg">
                <Star className="w-4 h-4 text-gray-900 fill-gray-900" />
                <span className="text-sm font-bold text-gray-900">Plus populaire</span>
              </div>
            </div>

            <div className="p-8">
              {/* Plan header */}
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <Building2 className="w-5 h-5 text-white/60" />
                  <h3 className="text-xl font-bold text-white">Business</h3>
                </div>
                <p className="text-sm text-gray-400">PME, directions juridiques, services achats</p>
              </div>

              {/* Price */}
              <div className="mb-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-white">25 000</span>
                  <span className="text-sm text-gray-400">FCFA/mois</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  ~38 € · par utilisateur emetteur · signataires illimites
                </p>
              </div>

              {/* DocuSign comparison */}
              <div className="mb-6 px-3 py-2 bg-white/5 rounded-xl border border-white/10">
                <p className="text-xs text-gray-400">
                  DocuSign Standard = 45 $/mois/utilisateur.{' '}
                  <span className="text-white font-semibold">ADVIST = 2x moins cher</span>, concu
                  pour l'Afrique.
                </p>
              </div>

              {/* Section title */}
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Workflow documentaire complet
              </p>

              {/* Features */}
              <ul className="space-y-2 mb-6">
                {[
                  '1 a 5 utilisateurs emetteurs',
                  'Signataires/validateurs externes illimites',
                  'Import documents (PDF, images)',
                  'Circuits de validation configurables',
                  'Validation sequentielle & parallele',
                  "Jusqu'a 10 intervenants par circuit",
                  'Annotations & commentaires (sidebar)',
                  'Surlignage avec identification auteur',
                  'Signature electronique simple',
                  'Notification email a chaque etape',
                  'Lien securise pour intervenants externes',
                  "Suivi en temps reel de l'avancement",
                  'Historique & tracabilite complete',
                  'Hash SHA-256 par document',
                  'Export du dossier complet (PDF + audit trail)',
                  '50 documents/mois',
                  'Support email',
                ].map((feature, j) => (
                  <li key={j} className="flex items-start gap-2">
                    <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 bg-white/10">
                      <Check className="w-2.5 h-2.5 text-white" />
                    </div>
                    <span className="text-xs text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* Add-ons */}
              <div className="mb-6 space-y-2">
                <div className="flex items-center justify-between px-3 py-2 bg-white/5 rounded-lg">
                  <span className="text-xs text-gray-400">Emetteur supplementaire</span>
                  <span className="text-xs font-semibold text-white">15 000 FCFA/mois</span>
                </div>
                <div className="flex items-center justify-between px-3 py-2 bg-white/5 rounded-lg">
                  <span className="text-xs text-gray-400">Pack 100 documents suppl.</span>
                  <span className="text-xs font-semibold text-white">10 000 FCFA/mois</span>
                </div>
              </div>

              {/* CTA */}
              <Link to="/register">
                <button className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 group bg-white text-gray-900 hover:bg-gray-100">
                  Commencer l'essai gratuit
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
            </div>
          </div>

          {/* Entreprise Plan */}
          <div
            className={`relative rounded-3xl bg-white border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-500 delay-100 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
          >
            {/* Premium badge */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <div className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full shadow-lg">
                <Shield className="w-4 h-4 text-white" />
                <span className="text-sm font-bold text-white">Premium</span>
              </div>
            </div>

            <div className="p-8">
              {/* Plan header */}
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <Shield className="w-5 h-5 text-gray-400" />
                  <h3 className="text-xl font-bold text-gray-900">Entreprise</h3>
                </div>
                <p className="text-sm text-gray-400">Grands comptes, groupes, administrations</p>
              </div>

              {/* Price */}
              <div className="mb-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-gray-900">150 000</span>
                  <span className="text-sm text-gray-400">FCFA/mois</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  ~230 € · utilisateurs illimites · documents illimites
                </p>
              </div>

              {/* DocuSign comparison */}
              <div className="mb-6 px-3 py-2 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-xs text-gray-500">
                  DocuSign Business Pro = 40 $/mois/utilisateur.{' '}
                  <span className="text-gray-900 font-semibold">ADVIST Entreprise : prix fixe</span>
                  , pas de surprise.
                </p>
              </div>

              {/* Section title */}
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Tout Business, plus :
              </p>

              {/* Features */}
              <ul className="space-y-2 mb-6">
                {[
                  'Utilisateurs emetteurs illimites',
                  'Documents illimites',
                  'Circuits conditionnels (si/alors)',
                  'Signature electronique avancee (eIDAS)',
                  'Cachet electronique (personne morale)',
                  'Horodatage qualifie',
                  "Verification d'identite du signataire",
                  'Templates de workflow reutilisables',
                  'Multi-departements / multi-sites',
                  'Gestion des roles & permissions (RBAC)',
                  'Conformite OHADA (archivage 10 ans)',
                  'API REST pour integrations',
                  'Rappels automatiques aux signataires',
                  'Tableau de bord analytique',
                  'Archivage legal SHA-256 chaine',
                  'SSO / SAML',
                  'Support prioritaire & account manager',
                  'Formation incluse',
                  'SLA 99.5%',
                ].map((feature, j) => (
                  <li key={j} className="flex items-start gap-2">
                    <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 bg-gray-100">
                      <Check className="w-2.5 h-2.5 text-gray-700" />
                    </div>
                    <span className="text-xs text-gray-500">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* Add-on */}
              <div className="mb-6">
                <div className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg">
                  <span className="text-xs text-gray-400">Multi-filiales (5+ entites)</span>
                  <span className="text-xs font-semibold text-gray-700">Sur devis</span>
                </div>
              </div>

              {/* CTA */}
              <Link to="/contact">
                <button className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 group bg-gray-900 text-white hover:bg-gray-800">
                  Nous contacter
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* DocuSign Comparison */}
        <div
          className={`mt-20 max-w-4xl mx-auto transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
        >
          <h3 className="text-2xl font-bold text-gray-900 text-center mb-10">
            Pourquoi ADVIST vs DocuSign en Afrique ?
          </h3>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Ce que DocuSign ne fait pas */}
            <div className="p-6 bg-white rounded-2xl border border-gray-200">
              <p className="text-sm font-semibold text-red-500 uppercase tracking-wider mb-4">
                Ce que DocuSign ne fait pas
              </p>
              <ul className="space-y-3">
                {[
                  'Interface en francais adaptee Afrique',
                  'Conformite OHADA native',
                  'Lien securise pour signataires sans compte',
                  'Mode offline / connectivite degradee',
                  'Facturation en FCFA',
                  'Support en fuseau horaire Afrique',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <X className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-600">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* L'avantage ADVIST */}
            <div className="p-6 bg-gray-900 rounded-2xl">
              <p className="text-sm font-semibold text-emerald-400 uppercase tracking-wider mb-4">
                L'avantage ADVIST
              </p>
              <ul className="space-y-3">
                {[
                  'Prix fixe, pas de facturation par enveloppe',
                  'Signataires externes illimites (pas de cout cache)',
                  'Workflow avec annotations et commentaires',
                  'Concu pour les realites juridiques OHADA',
                  'Donnees hebergees en conformite locale',
                  '2 a 3x moins cher que DocuSign',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-300">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Coming Soon */}
        <div
          className={`mt-16 text-center transition-all duration-700 delay-400 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
        >
          <div className="inline-flex flex-col items-center gap-3 p-6 bg-white rounded-2xl border border-gray-200">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-400" />
              <span className="text-sm font-semibold text-gray-900">Bientot disponible</span>
            </div>
            <div className="flex flex-wrap justify-center gap-3 text-xs">
              <span className="px-3 py-1.5 bg-gray-100 rounded-full text-gray-600">
                Signature qualifiee (QES)
              </span>
              <span className="px-3 py-1.5 bg-gray-100 rounded-full text-gray-600">
                Integration Mobile Money
              </span>
              <span className="px-3 py-1.5 bg-gray-100 rounded-full text-gray-600">
                PWA offline
              </span>
              <span className="px-3 py-1.5 bg-gray-100 rounded-full text-gray-600">
                Collaboration temps reel
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
