import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  Book,
  HelpCircle,
  FileText,
  Activity,
  Puzzle,
  Code,
  Search,
  ExternalLink,
  Clock,
  ChevronRight,
  Zap,
  Shield,
  Users,
  Mail,
} from 'lucide-react';

const resourceConfigs: Record<string, {
  title: string;
  description: string;
  icon: React.FC<{ className?: string }>;
  gradient: string;
  content: React.ReactNode;
}> = {
  docs: {
    title: 'Documentation',
    description: 'Guides complets et références techniques pour maîtriser ADVIST',
    icon: Book,
    gradient: 'from-primary-900 to-primary-900',
    content: <DocsContent />,
  },
  help: {
    title: "Centre d'aide",
    description: 'Trouvez des réponses à vos questions et contactez notre support',
    icon: HelpCircle,
    gradient: 'from-primary-900 to-primary-700',
    content: <HelpContent />,
  },
  blog: {
    title: 'Blog',
    description: 'Actualités, conseils et meilleures pratiques en gestion documentaire',
    icon: FileText,
    gradient: 'from-primary-500 to-orange-500',
    content: <BlogContent />,
  },
  status: {
    title: 'Statut du service',
    description: 'État en temps réel de nos systèmes et historique des incidents',
    icon: Activity,
    gradient: 'from-green-500 to-primary-900',
    content: <StatusContent />,
  },
  integrations: {
    title: 'Intégrations',
    description: 'Connectez ADVIST à vos outils préférés',
    icon: Puzzle,
    gradient: 'from-primary-900 to-primary-900',
    content: <IntegrationsContent />,
  },
  'api-docs': {
    title: 'Documentation API',
    description: 'Référence complète de notre API REST',
    icon: Code,
    gradient: 'from-primary-700 to-primary-900',
    content: <ApiDocsContent />,
  },
};

function DocsContent() {
  const categories = [
    {
      title: 'Démarrage rapide',
      icon: Zap,
      articles: [
        { title: 'Créer votre compte', time: '2 min' },
        { title: 'Importer vos premiers documents', time: '5 min' },
        { title: 'Configurer votre premier workflow', time: '10 min' },
        { title: 'Envoyer une demande de signature', time: '3 min' },
      ],
    },
    {
      title: 'Gestion documentaire',
      icon: FileText,
      articles: [
        { title: 'Organisation des dossiers', time: '5 min' },
        { title: 'Recherche avancée', time: '4 min' },
        { title: 'Versioning automatique', time: '3 min' },
        { title: 'Partage de documents', time: '4 min' },
      ],
    },
    {
      title: 'Workflows',
      icon: Users,
      articles: [
        { title: 'Types de workflows', time: '6 min' },
        { title: 'Approbations multi-niveaux', time: '8 min' },
        { title: 'Conditions et règles', time: '7 min' },
        { title: 'Notifications automatiques', time: '4 min' },
      ],
    },
    {
      title: 'Sécurité',
      icon: Shield,
      articles: [
        { title: 'Authentification à deux facteurs', time: '3 min' },
        { title: 'Gestion des permissions', time: '5 min' },
        { title: 'Audit trail', time: '4 min' },
        { title: 'Conformité RGPD', time: '6 min' },
      ],
    },
  ];

  return (
    <div className="space-y-8">
      {/* Search */}
      <div className="relative max-w-xl">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-400" />
        <input
          type="text"
          placeholder="Rechercher dans la documentation..."
          className="w-full pl-12 pr-4 py-3 border border-primary-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-900 transition-all"
        />
      </div>

      {/* Categories */}
      <div className="grid md:grid-cols-2 gap-6">
        {categories.map((category, i) => (
          <div key={i} className="bg-white rounded-xl border border-primary-200 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                <category.icon className="w-5 h-5 text-primary-900" />
              </div>
              <h3 className="font-semibold text-primary-900">{category.title}</h3>
            </div>
            <ul className="space-y-2">
              {category.articles.map((article, j) => (
                <li key={j}>
                  <a href="#" className="flex items-center justify-between py-2 text-primary-600 hover:text-primary-900 transition-colors group">
                    <span>{article.title}</span>
                    <div className="flex items-center gap-2 text-sm text-primary-400">
                      <Clock className="w-3.5 h-3.5" />
                      {article.time}
                      <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

function HelpContent() {
  const faqs = [
    { q: 'Comment réinitialiser mon mot de passe ?', a: 'Cliquez sur "Mot de passe oublié" sur la page de connexion.' },
    { q: 'Puis-je annuler une signature en cours ?', a: 'Oui, depuis la page Signatures, cliquez sur le menu contextuel du document.' },
    { q: 'Comment ajouter un nouvel utilisateur ?', a: 'Accédez à Paramètres > Utilisateurs > Inviter un utilisateur.' },
    { q: 'Les signatures sont-elles légalement valides ?', a: 'Oui, elles sont conformes au règlement eIDAS et au droit OHADA.' },
  ];

  return (
    <div className="space-y-8">
      {/* Contact options */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { icon: Mail, title: 'Email', desc: 'support@advist.com', action: 'mailto:support@advist.com' },
          { icon: HelpCircle, title: 'Chat en ligne', desc: 'Réponse en < 5 min', action: '#' },
          { icon: FileText, title: 'Ticket support', desc: 'Suivi personnalisé', action: '#' },
        ].map((option, i) => (
          <a
            key={i}
            href={option.action}
            className="flex items-center gap-4 p-4 bg-white rounded-xl border border-primary-200 hover:shadow-lg hover:border-primary-200 transition-all"
          >
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
              <option.icon className="w-6 h-6 text-primary-900" />
            </div>
            <div>
              <p className="font-semibold text-primary-900">{option.title}</p>
              <p className="text-sm text-primary-500">{option.desc}</p>
            </div>
          </a>
        ))}
      </div>

      {/* FAQ */}
      <div>
        <h3 className="text-lg font-semibold text-primary-900 mb-4">Questions fréquentes</h3>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <details key={i} className="group bg-white rounded-xl border border-primary-200 overflow-hidden">
              <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-primary-50">
                <span className="font-medium text-primary-900">{faq.q}</span>
                <ChevronRight className="w-5 h-5 text-primary-400 group-open:rotate-90 transition-transform" />
              </summary>
              <div className="px-4 pb-4 text-primary-600">{faq.a}</div>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}

function BlogContent() {
  const articles = [
    {
      title: 'Comment la signature électronique transforme les entreprises africaines',
      excerpt: 'Découvrez les avantages de la digitalisation des processus documentaires...',
      date: '20 Jan 2025',
      category: 'Tendances',
      image: 'bg-gradient-to-br from-primary-400 to-primary-900',
    },
    {
      title: '5 erreurs à éviter dans vos workflows de validation',
      excerpt: 'Optimisez vos circuits d\'approbation en évitant ces pièges courants...',
      date: '15 Jan 2025',
      category: 'Conseils',
      image: 'bg-gradient-to-br from-primary-400 to-orange-500',
    },
    {
      title: 'Conformité RGPD : ce que vous devez savoir',
      excerpt: 'Guide complet pour assurer la conformité de votre gestion documentaire...',
      date: '10 Jan 2025',
      category: 'Juridique',
      image: 'bg-gradient-to-br from-green-400 to-primary-900',
    },
    {
      title: 'Nouveautés ADVIST : Bilan du Q4 2024',
      excerpt: 'Toutes les nouvelles fonctionnalités déployées ce trimestre...',
      date: '5 Jan 2025',
      category: 'Produit',
      image: 'bg-gradient-to-br from-primary-400 to-primary-700',
    },
  ];

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {articles.map((article, i) => (
        <article key={i} className="bg-white rounded-xl border border-primary-200 overflow-hidden hover:shadow-lg transition-shadow group">
          <div className={`h-40 ${article.image} flex items-center justify-center`}>
            <FileText className="w-12 h-12 text-white/50" />
          </div>
          <div className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-medium text-primary-900 bg-primary-50 px-2 py-1 rounded-full">{article.category}</span>
              <span className="text-xs text-primary-400">{article.date}</span>
            </div>
            <h3 className="font-semibold text-primary-900 mb-2 group-hover:text-primary-900 transition-colors">{article.title}</h3>
            <p className="text-sm text-primary-600 line-clamp-2">{article.excerpt}</p>
            <a href="#" className="inline-flex items-center gap-1 mt-3 text-sm font-medium text-primary-900 hover:gap-2 transition-all">
              Lire la suite <ChevronRight className="w-4 h-4" />
            </a>
          </div>
        </article>
      ))}
    </div>
  );
}

function StatusContent() {
  const services = [
    { name: 'Application Web', status: 'operational', uptime: '99.99%' },
    { name: 'API REST', status: 'operational', uptime: '99.98%' },
    { name: 'Service de signature', status: 'operational', uptime: '100%' },
    { name: 'Stockage documents', status: 'operational', uptime: '99.99%' },
    { name: 'Notifications email', status: 'operational', uptime: '99.95%' },
  ];

  return (
    <div className="space-y-8">
      {/* Overall status */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
        <div className="w-16 h-16 bg-primary-900 rounded-full flex items-center justify-center mx-auto mb-4">
          <Activity className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-xl font-bold text-green-800">Tous les systèmes opérationnels</h3>
        <p className="text-green-600 mt-1">Dernière vérification : il y a 2 minutes</p>
      </div>

      {/* Services */}
      <div className="bg-white rounded-xl border border-primary-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-primary-200">
          <h3 className="font-semibold text-primary-900">État des services</h3>
        </div>
        <div className="divide-y divide-primary-100">
          {services.map((service, i) => (
            <div key={i} className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-primary-900 rounded-full" />
                <span className="font-medium text-primary-900">{service.name}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-primary-500">Uptime: {service.uptime}</span>
                <span className="text-xs font-medium text-primary-900 bg-green-50 px-2 py-1 rounded-full">
                  Opérationnel
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Incidents */}
      <div>
        <h3 className="font-semibold text-primary-900 mb-4">Historique des incidents</h3>
        <div className="bg-primary-50 rounded-xl p-8 text-center">
          <p className="text-primary-500">Aucun incident majeur ces 90 derniers jours</p>
        </div>
      </div>
    </div>
  );
}

function IntegrationsContent() {
  const integrations = [
    { name: 'Microsoft 365', desc: 'Word, Excel, Outlook, SharePoint', category: 'Productivité', available: true },
    { name: 'Google Workspace', desc: 'Drive, Docs, Gmail', category: 'Productivité', available: true },
    { name: 'Salesforce', desc: 'CRM et automatisation', category: 'CRM', available: true },
    { name: 'SAP', desc: 'ERP et gestion', category: 'ERP', available: true },
    { name: 'Slack', desc: 'Notifications et collaboration', category: 'Communication', available: true },
    { name: 'Zapier', desc: '5000+ applications', category: 'Automatisation', available: true },
    { name: 'HubSpot', desc: 'Marketing et ventes', category: 'CRM', available: false },
    { name: 'Notion', desc: 'Gestion de projets', category: 'Productivité', available: false },
  ];

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {integrations.map((integration, i) => (
        <div
          key={i}
          className={`p-5 bg-white rounded-xl border ${
            integration.available ? 'border-primary-200 hover:shadow-lg hover:border-primary-200' : 'border-primary-100 opacity-60'
          } transition-all`}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-100 to-primary-100 rounded-xl flex items-center justify-center">
              <Puzzle className="w-6 h-6 text-primary-900" />
            </div>
            {integration.available ? (
              <span className="text-xs font-medium text-primary-900 bg-green-50 px-2 py-1 rounded-full">Disponible</span>
            ) : (
              <span className="text-xs font-medium text-primary-500 bg-primary-100 px-2 py-1 rounded-full">Bientôt</span>
            )}
          </div>
          <h3 className="font-semibold text-primary-900">{integration.name}</h3>
          <p className="text-sm text-primary-500 mt-1">{integration.desc}</p>
          <span className="inline-block mt-3 text-xs text-primary-900 bg-primary-50 px-2 py-1 rounded-full">
            {integration.category}
          </span>
        </div>
      ))}
    </div>
  );
}

function ApiDocsContent() {
  const endpoints = [
    { method: 'GET', path: '/api/v1/documents', desc: 'Lister les documents' },
    { method: 'POST', path: '/api/v1/documents', desc: 'Créer un document' },
    { method: 'GET', path: '/api/v1/documents/:id', desc: 'Récupérer un document' },
    { method: 'POST', path: '/api/v1/signatures', desc: 'Initier une signature' },
    { method: 'GET', path: '/api/v1/workflows', desc: 'Lister les workflows' },
    { method: 'POST', path: '/api/v1/workflows/:id/approve', desc: 'Approuver une étape' },
  ];

  const methodColors: Record<string, string> = {
    GET: 'bg-primary-100 text-green-600',
    POST: 'bg-primary-100 text-primary-800',
    PUT: 'bg-primary-100 text-primary-700',
    DELETE: 'bg-red-100 text-red-700',
  };

  return (
    <div className="space-y-8">
      {/* Quick start */}
      <div className="bg-primary-900 rounded-xl p-6 text-white">
        <h3 className="font-semibold mb-4">Authentification</h3>
        <pre className="text-sm overflow-x-auto">
          <code>{`curl -X GET "https://api.advist.com/v1/documents" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"`}</code>
        </pre>
      </div>

      {/* Endpoints */}
      <div>
        <h3 className="font-semibold text-primary-900 mb-4">Endpoints principaux</h3>
        <div className="bg-white rounded-xl border border-primary-200 overflow-hidden">
          <div className="divide-y divide-primary-100">
            {endpoints.map((endpoint, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4 hover:bg-primary-50 transition-colors cursor-pointer group">
                <span className={`text-xs font-bold px-2 py-1 rounded ${methodColors[endpoint.method]}`}>
                  {endpoint.method}
                </span>
                <code className="text-sm font-mono text-primary-700 flex-1">{endpoint.path}</code>
                <span className="text-sm text-primary-500">{endpoint.desc}</span>
                <ExternalLink className="w-4 h-4 text-primary-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SDKs */}
      <div>
        <h3 className="font-semibold text-primary-900 mb-4">SDKs disponibles</h3>
        <div className="grid sm:grid-cols-3 gap-4">
          {['JavaScript/TypeScript', 'Python', 'PHP'].map((sdk, i) => (
            <div key={i} className="flex items-center gap-3 p-4 bg-white rounded-xl border border-primary-200 hover:shadow-lg transition-shadow">
              <Code className="w-6 h-6 text-primary-700" />
              <span className="font-medium text-primary-900">{sdk}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export const ResourcePage: React.FC = () => {
  const location = useLocation();
  const path = location.pathname.replace('/', '');
  const config = resourceConfigs[path];

  if (!config) {
    return (
      <div className="min-h-screen bg-primary-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-primary-900 mb-4">Page non trouvée</h1>
          <Link to="/" className="text-primary-900 hover:underline">Retour à l'accueil</Link>
        </div>
      </div>
    );
  }

  const Icon = config.icon;

  return (
    <div className="min-h-screen bg-primary-50">
      {/* Header */}
      <header className="bg-white border-b border-primary-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-900 to-primary-700 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold">A</span>
              </div>
              <span className="font-decorative text-2xl text-primary-900">Advist</span>
            </Link>
            <Link
              to="/"
              className="flex items-center gap-2 text-primary-600 hover:text-primary-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className={`bg-gradient-to-r ${config.gradient} py-16`}>
        <div className="max-w-6xl mx-auto px-6 text-center text-white">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Icon className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold mb-3">{config.title}</h1>
          <p className="text-lg text-white/80 max-w-xl mx-auto">{config.description}</p>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        {config.content}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-primary-200 py-8 mt-12">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-base text-primary-500">
            © 2025 <span className="font-decorative text-lg font-semibold">Advist</span> by <span className="font-decorative text-lg font-semibold">Atlas Studio</span>
          </p>
          <div className="flex gap-6 text-sm">
            <Link to="/legal/mentions" className="text-primary-500 hover:text-primary-900">Mentions légales</Link>
            <Link to="/legal/privacy" className="text-primary-500 hover:text-primary-900">Confidentialité</Link>
            <Link to="/legal/cgu" className="text-primary-500 hover:text-primary-900">CGU</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ResourcePage;
