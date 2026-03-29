import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Zap, ArrowRight, Sparkles, Star, Shield, Building2 } from 'lucide-react';
import { useScrollAnimation } from '../hooks/useScrollAnimation';

export const PricingSection: React.FC = () => {
  const { ref, isVisible } = useScrollAnimation();
  const [annual, setAnnual] = useState(true);

  const plans = [
    {
      name: 'Business',
      description: 'PME',
      monthlyPrice: 59000,
      annualPrice: 49000,
      icon: Building2,
      features: [
        '50 utilisateurs',
        '250 Go stockage',
        '15 000 documents',
        '1 500 signatures/mois',
        'SSO (SAML/OAuth)',
        'API illimitee + Webhooks',
        'Assistant IA',
        'Support telephonique',
      ],
      cta: 'Commencer',
      popular: true,
    },
    {
      name: 'Entreprise',
      description: 'Grandes entreprises',
      monthlyPrice: null,
      annualPrice: null,
      icon: Shield,
      features: [
        'Tout illimite',
        'Signatures biometriques',
        'White label complet',
        'Integrations personnalisees',
        'IA complete',
        'Manager dedie 24/7',
        'SLA 99.9%',
      ],
      cta: 'Nous contacter',
      popular: false,
    },
  ];

  return (
    <section ref={ref} id="pricing" className="py-32 bg-gray-50 relative overflow-hidden">
      <div className="relative max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className={`text-center mb-16 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-gray-200 mb-6">
            <Zap className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-500">Tarifs transparents</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Choisissez votre plan
          </h2>
          <p className="text-xl text-gray-400 mb-8">
            14 jours d'essai gratuit sur tous les plans. Sans engagement.
          </p>

          {/* Toggle */}
          <div className="inline-flex items-center gap-4 p-1.5 bg-white rounded-full border border-gray-200">
            <button
              onClick={() => setAnnual(false)}
              className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all ${
                !annual
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              Mensuel
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                annual
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              Annuel
              <span className="px-2 py-0.5 bg-gray-700 text-white text-xs rounded-full font-bold">
                -20%
              </span>
            </button>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-2 max-w-3xl mx-auto gap-4 lg:gap-6">
          {plans.map((plan, i) => (
            <div
              key={i}
              className={`relative rounded-3xl transition-all duration-500 ${
                plan.popular
                  ? 'bg-gray-900 text-white shadow-2xl shadow-gray-900/10 md:scale-105 z-10'
                  : 'bg-white border border-gray-200 hover:border-gray-300 hover:shadow-lg'
              } ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              {/* Popular badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="flex items-center gap-1.5 px-4 py-1.5 bg-white rounded-full shadow-lg">
                    <Star className="w-4 h-4 text-gray-900 fill-gray-900" />
                    <span className="text-sm font-bold text-gray-900">Plus populaire</span>
                  </div>
                </div>
              )}

              <div className="p-6">
                {/* Plan header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    plan.popular ? 'bg-white/10' : 'bg-gray-100'
                  }`}>
                    <plan.icon className={`w-5 h-5 ${plan.popular ? 'text-white' : 'text-gray-700'}`} />
                  </div>
                  <div>
                    <h3 className={`text-lg font-bold ${plan.popular ? 'text-white' : 'text-gray-900'}`}>
                      {plan.name}
                    </h3>
                    <p className={`text-xs ${plan.popular ? 'text-gray-400' : 'text-gray-400'}`}>
                      {plan.description}
                    </p>
                  </div>
                </div>

                {/* Price */}
                <div className="mb-6">
                  {plan.monthlyPrice === 0 ? (
                    <>
                      <span className={`text-3xl font-bold ${plan.popular ? 'text-white' : 'text-gray-900'}`}>
                        Gratuit
                      </span>
                      <p className={`text-sm ${plan.popular ? 'text-gray-400' : 'text-gray-400'}`}>
                        Pour toujours
                      </p>
                    </>
                  ) : plan.monthlyPrice ? (
                    <>
                      <div className="flex items-baseline gap-1">
                        <span className={`text-3xl font-bold ${plan.popular ? 'text-white' : 'text-gray-900'}`}>
                          {(annual ? plan.annualPrice : plan.monthlyPrice)?.toLocaleString()}
                        </span>
                        <span className={`text-sm ${plan.popular ? 'text-gray-400' : 'text-gray-400'}`}>
                          FCFA
                        </span>
                      </div>
                      <p className={`text-xs ${plan.popular ? 'text-gray-400' : 'text-gray-400'}`}>
                        /mois {annual ? '(annuel)' : ''}
                      </p>
                    </>
                  ) : (
                    <>
                      <span className={`text-3xl font-bold ${plan.popular ? 'text-white' : 'text-gray-900'}`}>
                        Sur mesure
                      </span>
                      <p className={`text-sm ${plan.popular ? 'text-gray-400' : 'text-gray-400'}`}>
                        Tarification personnalisee
                      </p>
                    </>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-start gap-2">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        plan.popular ? 'bg-white/10' : 'bg-gray-100'
                      }`}>
                        <Check className={`w-2.5 h-2.5 ${plan.popular ? 'text-white' : 'text-gray-700'}`} />
                      </div>
                      <span className={`text-xs ${plan.popular ? 'text-gray-300' : 'text-gray-500'}`}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Link to={plan.monthlyPrice !== null ? '/register' : '/contact'}>
                  <button className={`w-full py-3 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-2 group ${
                    plan.popular
                      ? 'bg-white text-gray-900 hover:bg-gray-100'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}>
                    {plan.cta}
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </button>
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom note - Add-on IA */}
        <div className={`mt-16 text-center transition-all duration-700 delay-400 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="inline-flex flex-col sm:flex-row items-center gap-4 p-4 bg-white rounded-2xl border border-gray-200">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-500">
                <span className="font-semibold text-gray-900">Add-on IA Proph3t</span>
              </span>
            </div>
            <span className="text-sm text-gray-300 hidden sm:block">|</span>
            <div className="flex flex-wrap justify-center gap-3 text-xs">
              <span className="px-2 py-1 bg-gray-100 rounded-full text-gray-600">
                <span className="font-medium">Essentiel</span> 25 000 FCFA
              </span>
              <span className="px-2 py-1 bg-gray-100 rounded-full text-gray-600">
                <span className="font-medium">Avance</span> 50 000 FCFA
              </span>
              <span className="px-2 py-1 bg-gray-100 rounded-full text-gray-600">
                <span className="font-medium">Entreprise</span> 99 000 FCFA
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
