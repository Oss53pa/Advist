import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mail, Phone, MapPin, Linkedin, Twitter, ArrowUpRight, Shield } from 'lucide-react';

const SOCIAL_LINKS = [
  { icon: Linkedin, href: 'https://linkedin.com/company/advist', label: 'LinkedIn' },
  { icon: Twitter, href: 'https://twitter.com/advist_app', label: 'Twitter' },
];

export const Footer: React.FC = () => {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  const PRODUCT_LINKS = [
    { label: t('footer.product.features', 'Fonctionnalites'), href: '#features' },
    { label: 'Application mobile', href: '#mobile-app' },
    { label: t('footer.product.pricing', 'Tarifs'), href: '#pricing' },
    { label: t('footer.product.integrations', 'Integrations'), href: '#integrations' },
    { label: 'Proph3t IA', href: '#proph3t' },
  ];

  const RESOURCE_LINKS = [
    { label: t('footer.resources.documentation', 'Documentation'), href: '/docs' },
    { label: t('footer.resources.helpCenter', "Centre d'aide"), href: '/help' },
    { label: t('footer.resources.blog', 'Blog'), href: '/blog' },
    { label: t('footer.resources.status', 'Statut'), href: '/status', external: true },
  ];

  const LEGAL_LINKS = [
    { label: t('footer.legal.legalNotice', 'Mentions legales'), href: '/legal/mentions' },
    { label: t('footer.legal.privacy', 'Confidentialite'), href: '/legal/privacy' },
    { label: t('footer.legal.terms', 'CGU'), href: '/legal/cgu' },
    { label: 'Cookies', href: '/legal/cookies' },
  ];

  return (
    <footer id="contact" className="bg-[#131C2E]">
      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand column */}
          <div className="col-span-2">
            <Link to="/" className="inline-flex items-center mb-3">
              <span className="font-decorative text-2xl text-[#B9975B]">Advist</span>
            </Link>
            <a
              href="https://atlas-studio.org"
              className="inline-flex items-center gap-2 mb-6 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all group"
            >
              <span className="font-decorative text-sm" style={{ color: '#EF9F27' }}>
                Atlas
              </span>
              <span className="text-xs text-gray-400 group-hover:text-gray-300">Studio</span>
              <ArrowUpRight className="w-3 h-3 text-gray-500 group-hover:text-white transition-colors" />
            </a>
            <p className="text-white/40 text-sm leading-relaxed mb-6 max-w-xs">
              {t(
                'footer.description',
                'La plateforme tout-en-un pour digitaliser vos circuits de validation et signer electroniquement en toute securite.'
              )}
            </p>

            {/* Contact info */}
            <div className="space-y-3 mb-6">
              <a
                href="mailto:contact@advist.com"
                className="flex items-center gap-3 text-white/40 hover:text-[#B9975B] transition-colors"
              >
                <Mail className="w-4 h-4" />
                <span className="text-sm">contact@advist.com</span>
              </a>
              <a
                href="tel:+2250102030405"
                className="flex items-center gap-3 text-white/40 hover:text-[#B9975B] transition-colors"
              >
                <Phone className="w-4 h-4" />
                <span className="text-sm">+225 01 02 03 04 05</span>
              </a>
              <div className="flex items-center gap-3 text-white/40">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">Abidjan, Cote d'Ivoire</span>
              </div>
            </div>

            {/* Social links */}
            <div className="flex items-center gap-3">
              {SOCIAL_LINKS.map((social, i) => (
                <a
                  key={i}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="w-10 h-10 bg-white/5 hover:bg-[#B9975B]/10 rounded-xl flex items-center justify-center transition-colors group"
                >
                  <social.icon className="w-5 h-5 text-white/40 group-hover:text-[#B9975B] transition-colors" />
                </a>
              ))}
            </div>
          </div>

          {/* Links columns */}
          <div>
            <h4 className="font-medium text-[#B9975B] mb-4">
              {t('footer.sections.product', 'Produit')}
            </h4>
            <ul className="space-y-3">
              {PRODUCT_LINKS.map((link, i) => (
                <li key={i}>
                  {link.href.startsWith('#') ? (
                    <a
                      href={link.href}
                      className="text-sm text-white/40 hover:text-[#B9975B] transition-colors"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link
                      to={link.href}
                      className="text-sm text-white/40 hover:text-[#B9975B] transition-colors"
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-[#B9975B] mb-4">
              {t('footer.sections.resources', 'Ressources')}
            </h4>
            <ul className="space-y-3">
              {RESOURCE_LINKS.map((link, i) => (
                <li key={i}>
                  <a
                    href={link.href}
                    target={(link as any).external ? '_blank' : undefined}
                    rel={(link as any).external ? 'noopener noreferrer' : undefined}
                    className="inline-flex items-center gap-1 text-sm text-white/40 hover:text-[#B9975B] transition-colors"
                  >
                    {link.label}
                    {(link as any).external && <ArrowUpRight className="w-3 h-3" />}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-[#B9975B] mb-4">Legal</h4>
            <ul className="space-y-3">
              {LEGAL_LINKS.map((link, i) => (
                <li key={i}>
                  <Link
                    to={link.href}
                    className="text-sm text-white/40 hover:text-[#B9975B] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
              <p className="text-sm text-white/30">
                © {currentYear} <span className="font-decorative text-[#B9975B]">Advist</span> by{' '}
                <a
                  href="https://atlas-studio.org/applications/advist"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-decorative text-[#B9975B]/60 hover:text-[#B9975B] transition-colors"
                >
                  Atlas Studio
                </a>
              </p>
              {/* Certifications */}
              <div className="flex items-center gap-3">
                {['ISO 27001', 'eIDAS', 'RGPD', 'OHADA'].map((cert, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-1.5 px-2 py-1 bg-white/5 rounded-md"
                  >
                    <Shield className="w-3 h-3 text-[#B9975B]/50" />
                    <span className="text-xs text-white/40">{cert}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-center md:text-right">
              <div className="text-xs text-white/40">
                <span className="font-medium text-[#B9975B]">A</span>
                <span>pprobation</span>
                <span className="mx-1">·</span>
                <span className="font-medium text-[#B9975B]">D</span>
                <span>ocumentaire</span>
                <span className="mx-1">·</span>
                <span className="font-medium text-[#B9975B]">V</span>
                <span>alidation</span>
                <span className="mx-1">·</span>
                <span className="font-medium text-[#B9975B]">I</span>
                <span>ntégrité</span>
                <span className="mx-1">·</span>
                <span className="font-medium text-[#B9975B]">S</span>
                <span>écurité</span>
                <span className="mx-1">·</span>
                <span className="font-medium text-[#B9975B]">T</span>
                <span>raçabilité</span>
              </div>
              <p className="text-[11px] text-[#B9975B]/40 mt-1 italic">
                « L'avis de confiance, la trace qui sécurise. »
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
