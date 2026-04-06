import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Layout,
  Type,
  Image,
  Palette,
  Eye,
  Save,
  RotateCcw,
  Monitor,
  Smartphone,
  Tablet,
  Plus,
  Trash2,
  GripVertical,
  ExternalLink,
  Loader2,
  AlertCircle,
  CheckCircle,
  History,
  _Settings,
  Globe,
  Users,
  Search,
  Mail,
} from 'lucide-react';
import { Button, Modal } from '../../components/ui';
import {
  landingConfigApi,
  type LandingPageConfig,
  type LandingPageConfigHistory,
} from '../../services/landingConfig';

type PreviewMode = 'desktop' | 'tablet' | 'mobile';

// Default config for when API is not available
const defaultConfig: LandingPageConfig = {
  id: '',
  hero_title: 'Simplifiez la gestion de vos documents juridiques',
  hero_subtitle:
    'ADVIST centralise, sécurise et automatise tous vos documents contractuels en un seul endroit.',
  hero_cta_text: 'Commencer gratuitement',
  hero_cta_secondary_text: 'Voir la démo',
  hero_show_stats: true,
  stats: [
    { value: '10K+', label: 'Documents gérés' },
    { value: '500+', label: 'Entreprises' },
    { value: '99.9%', label: 'Disponibilité' },
    { value: '24/7', label: 'Support' },
  ],
  features: [
    {
      id: '1',
      title: 'Gestion documentaire',
      description: 'Centralisez tous vos contrats',
      icon: 'FileText',
      enabled: true,
    },
    {
      id: '2',
      title: 'Signature électronique',
      description: 'Signez vos documents',
      icon: 'PenTool',
      enabled: true,
    },
    {
      id: '3',
      title: 'Workflows automatisés',
      description: 'Automatisez vos processus',
      icon: 'GitBranch',
      enabled: true,
    },
    {
      id: '4',
      title: 'Alertes intelligentes',
      description: 'Ne manquez aucune échéance',
      icon: 'Bell',
      enabled: true,
    },
  ],
  testimonials: [
    {
      id: '1',
      name: 'Marie Dupont',
      role: 'Directrice Juridique',
      company: 'TechCorp CI',
      content: 'ADVIST a transformé notre gestion documentaire.',
      avatar: '',
      enabled: true,
    },
    {
      id: '2',
      name: 'Konan Bédié',
      role: 'CEO',
      company: 'Cosmos Group',
      content: 'Une solution complète et intuitive.',
      avatar: '',
      enabled: true,
    },
  ],
  trusted_companies: [],
  how_it_works_steps: [],
  footer_company_name: 'ADVIST',
  footer_description: 'La solution de gestion documentaire pour les entreprises africaines.',
  footer_show_socials: true,
  footer_show_newsletter: true,
  social_facebook: '',
  social_twitter: '',
  social_linkedin: '',
  social_instagram: '',
  social_youtube: '',
  contact_email: 'contact@advist.com',
  contact_phone: '',
  contact_address: '',
  color_primary: '#252D44',
  color_secondary: '#7EAED9',
  color_accent: '#F59E0B',
  color_background: '#E8EAEC',
  seo_title: 'ADVIST - Gestion Documentaire',
  seo_description: 'Plateforme de gestion documentaire et signatures électroniques.',
  seo_keywords: '',
  cta_title: 'Prêt à transformer votre gestion documentaire ?',
  cta_subtitle: "Rejoignez des centaines d'entreprises qui font confiance à ADVIST.",
  cta_button_text: 'Démarrer maintenant',
  show_trusted_companies: true,
  show_features: true,
  show_how_it_works: true,
  show_testimonials: true,
  show_pricing: true,
  show_blog: true,
  show_newsletter: true,
  show_cta: true,
  is_active: true,
  created_at: '',
  updated_at: '',
};

export const LandingPageEditorPage: React.FC = () => {
  const { _t } = useTranslation();
  const [config, setConfig] = useState<LandingPageConfig>(defaultConfig);
  const [originalConfig, setOriginalConfig] = useState<LandingPageConfig>(defaultConfig);
  const [activeSection, setActiveSection] = useState<string>('hero');
  const [previewMode, setPreviewMode] = useState<PreviewMode>('desktop');
  const [hasChanges, setHasChanges] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<LandingPageConfigHistory[]>([]);

  // Loading and error states
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load configuration on mount
  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await landingConfigApi.getConfig();
      setConfig(data);
      setOriginalConfig(data);
    } catch (err) {
      console.error('Erreur lors du chargement de la configuration:', err);
      setError('Impossible de charger la configuration. Mode hors ligne activé.');
      // Keep default config in case of error
    } finally {
      setIsLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      const data = await landingConfigApi.getHistory();
      setHistory(data);
      setShowHistory(true);
    } catch (err) {
      console.error("Erreur lors du chargement de l'historique:", err);
    }
  };

  const updateConfig = (section: string, data: unknown) => {
    setConfig((prev) => ({ ...prev, [section]: data }));
    setHasChanges(true);
    setSuccessMessage(null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      const updatedConfig = await landingConfigApi.updateConfig(config);
      setConfig(updatedConfig);
      setOriginalConfig(updatedConfig);
      setHasChanges(false);
      setSuccessMessage('Configuration enregistrée avec succès !');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("Erreur lors de l'enregistrement:", err);
      setError("Erreur lors de l'enregistrement. Veuillez réessayer.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir réinitialiser la configuration par défaut ?')) {
      setIsSaving(true);
      try {
        const result = await landingConfigApi.resetConfig();
        setConfig(result.config);
        setOriginalConfig(result.config);
        setHasChanges(false);
        setSuccessMessage('Configuration réinitialisée !');
        setTimeout(() => setSuccessMessage(null), 3000);
      } catch (err) {
        console.error('Erreur lors de la réinitialisation:', err);
        setError('Erreur lors de la réinitialisation.');
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleCancelChanges = () => {
    setConfig(originalConfig);
    setHasChanges(false);
  };

  const handleImageUpload = async (type: 'hero_background' | 'seo_og', file: File) => {
    try {
      const result = await landingConfigApi.uploadImage(type, file);
      setConfig(result.config);
      setOriginalConfig(result.config);
      setSuccessMessage('Image téléchargée avec succès !');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Erreur lors du téléchargement:', err);
      setError("Erreur lors du téléchargement de l'image.");
    }
  };

  const sections = [
    { id: 'hero', label: 'Hero Section', icon: Layout },
    { id: 'stats', label: 'Statistiques', icon: Type },
    { id: 'features', label: 'Fonctionnalités', icon: Layout },
    { id: 'testimonials', label: 'Témoignages', icon: Users },
    { id: 'footer', label: 'Footer', icon: Layout },
    { id: 'social', label: 'Réseaux sociaux', icon: Globe },
    { id: 'contact', label: 'Contact', icon: Mail },
    { id: 'colors', label: 'Couleurs', icon: Palette },
    { id: 'seo', label: 'SEO', icon: Search },
    { id: 'visibility', label: 'Visibilité', icon: Eye },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-advist-surface-dark flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-advist-dark mx-auto mb-4" />
          <p className="text-advist-gray900">Chargement de la configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-advist-surface-dark">
      {/* Header */}
      <div className="bg-white border-b border-advist-border sticky top-16 z-40">
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-bold text-advist-gray900">Éditeur de Landing Page</h1>
            <p className="text-sm text-advist-blue-light">
              Personnalisez la page d'accueil de votre plateforme
              {config.updated_at && (
                <span className="ml-2 text-xs">
                  (Dernière modification: {new Date(config.updated_at).toLocaleDateString('fr-FR')})
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Success/Error Messages */}
            {successMessage && (
              <div className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-lg">
                <CheckCircle size={16} />
                <span className="text-sm">{successMessage}</span>
              </div>
            )}
            {error && (
              <div className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-700 rounded-lg">
                <AlertCircle size={16} />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Preview Mode Toggle */}
            <div className="flex items-center bg-advist-surface-dark rounded-xl p-1">
              <button
                onClick={() => setPreviewMode('desktop')}
                className={`p-2 rounded-lg transition-all ${previewMode === 'desktop' ? 'bg-white shadow-sm' : ''}`}
              >
                <Monitor size={18} className="text-advist-gray900" />
              </button>
              <button
                onClick={() => setPreviewMode('tablet')}
                className={`p-2 rounded-lg transition-all ${previewMode === 'tablet' ? 'bg-white shadow-sm' : ''}`}
              >
                <Tablet size={18} className="text-advist-gray900" />
              </button>
              <button
                onClick={() => setPreviewMode('mobile')}
                className={`p-2 rounded-lg transition-all ${previewMode === 'mobile' ? 'bg-white shadow-sm' : ''}`}
              >
                <Smartphone size={18} className="text-advist-gray900" />
              </button>
            </div>

            <Button variant="outline" onClick={() => setShowPreview(true)}>
              <Eye size={16} className="mr-2" />
              Prévisualiser
            </Button>

            <Button variant="outline" onClick={loadHistory}>
              <History size={16} className="mr-2" />
              Historique
            </Button>

            {hasChanges && (
              <Button variant="outline" onClick={handleCancelChanges}>
                Annuler
              </Button>
            )}

            <Button variant="outline" onClick={handleReset} disabled={isSaving}>
              <RotateCcw size={16} className="mr-2" />
              Réinitialiser
            </Button>

            <Button onClick={handleSave} disabled={!hasChanges || isSaving}>
              {isSaving ? (
                <Loader2 size={16} className="mr-2 animate-spin" />
              ) : (
                <Save size={16} className="mr-2" />
              )}
              Enregistrer
            </Button>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar - Sections */}
        <div className="w-64 bg-white border-r border-advist-border min-h-[calc(100vh-8rem)] p-4">
          <p className="text-xs font-semibold text-advist-blue-light uppercase tracking-wider mb-4">
            Sections
          </p>
          <div className="space-y-1">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  activeSection === section.id
                    ? 'bg-advist-dark text-white'
                    : 'text-advist-gray900 hover:bg-advist-surface-dark'
                }`}
              >
                <section.icon size={18} />
                <span className="font-medium">{section.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Editor Panel */}
        <div className="flex-1 p-6">
          <div className="bg-white rounded-2xl border border-advist-border p-6">
            {/* Hero Section Editor */}
            {activeSection === 'hero' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-advist-gray900">Hero Section</h2>

                <div>
                  <label className="block text-sm font-medium text-advist-gray900 mb-2">
                    Titre principal
                  </label>
                  <input
                    type="text"
                    value={config.hero_title}
                    onChange={(e) => updateConfig('hero_title', e.target.value)}
                    className="w-full px-4 py-3 border border-advist-border rounded-xl focus:ring-2 focus:ring-advist-blue-light/30 focus:border-advist-blue-light"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-advist-gray900 mb-2">
                    Sous-titre
                  </label>
                  <textarea
                    value={config.hero_subtitle}
                    onChange={(e) => updateConfig('hero_subtitle', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border border-advist-border rounded-xl focus:ring-2 focus:ring-advist-blue-light/30 focus:border-advist-blue-light"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-advist-gray900 mb-2">
                      Bouton principal
                    </label>
                    <input
                      type="text"
                      value={config.hero_cta_text}
                      onChange={(e) => updateConfig('hero_cta_text', e.target.value)}
                      className="w-full px-4 py-3 border border-advist-border rounded-xl focus:ring-2 focus:ring-advist-blue-light/30 focus:border-advist-blue-light"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-advist-gray900 mb-2">
                      Bouton secondaire
                    </label>
                    <input
                      type="text"
                      value={config.hero_cta_secondary_text}
                      onChange={(e) => updateConfig('hero_cta_secondary_text', e.target.value)}
                      className="w-full px-4 py-3 border border-advist-border rounded-xl focus:ring-2 focus:ring-advist-blue-light/30 focus:border-advist-blue-light"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-advist-gray900 mb-2">
                    Image de fond (optionnel)
                  </label>
                  <div className="border-2 border-dashed border-advist-border rounded-xl p-8 text-center hover:border-advist-blue-light transition-colors">
                    {config.hero_background_image_url ? (
                      <div className="relative">
                        <img
                          src={config.hero_background_image_url}
                          alt="Hero background"
                          className="max-h-32 mx-auto rounded-lg"
                        />
                        <button
                          onClick={() => updateConfig('hero_background_image', null)}
                          className="absolute top-0 right-0 p-1 bg-red-500 text-white rounded-full"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer">
                        <Image size={32} className="mx-auto text-advist-blue-light mb-2" />
                        <p className="text-sm text-advist-blue-light">
                          Cliquez ou déposez une image
                        </p>
                        <p className="text-xs text-advist-blue-light/60 mt-1">
                          PNG, JPG jusqu'à 5MB
                        </p>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageUpload('hero_background', file);
                          }}
                        />
                      </label>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="showStats"
                    checked={config.hero_show_stats}
                    onChange={(e) => updateConfig('hero_show_stats', e.target.checked)}
                    className="w-5 h-5 rounded border-advist-border text-advist-gray900 focus:ring-advist-blue-light"
                  />
                  <label htmlFor="showStats" className="text-sm font-medium text-advist-gray900">
                    Afficher les statistiques sous le hero
                  </label>
                </div>
              </div>
            )}

            {/* Stats Editor */}
            {activeSection === 'stats' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-advist-gray900">Statistiques</h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newStats = [...config.stats, { value: '0', label: 'Nouveau' }];
                      updateConfig('stats', newStats);
                    }}
                  >
                    <Plus size={16} className="mr-1" />
                    Ajouter
                  </Button>
                </div>

                <div className="space-y-3">
                  {config.stats.map((stat, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-4 bg-advist-surface-dark/30 rounded-xl"
                    >
                      <GripVertical size={18} className="text-advist-blue-light cursor-grab" />
                      <input
                        type="text"
                        value={stat.value}
                        onChange={(e) => {
                          const newStats = [...config.stats];
                          newStats[index].value = e.target.value;
                          updateConfig('stats', newStats);
                        }}
                        className="w-24 px-3 py-2 border border-advist-border rounded-lg text-center font-bold"
                        placeholder="Valeur"
                      />
                      <input
                        type="text"
                        value={stat.label}
                        onChange={(e) => {
                          const newStats = [...config.stats];
                          newStats[index].label = e.target.value;
                          updateConfig('stats', newStats);
                        }}
                        className="flex-1 px-3 py-2 border border-advist-border rounded-lg"
                        placeholder="Label"
                      />
                      <button
                        onClick={() => {
                          const newStats = config.stats.filter((_, i) => i !== index);
                          updateConfig('stats', newStats);
                        }}
                        className="p-2 text-advist-red hover:bg-advist-red/10 rounded-lg"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Features Editor */}
            {activeSection === 'features' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-advist-gray900">Fonctionnalités</h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newFeatures = [
                        ...config.features,
                        {
                          id: String(Date.now()),
                          title: 'Nouvelle fonctionnalité',
                          description: 'Description de la fonctionnalité',
                          icon: 'Star',
                          enabled: true,
                        },
                      ];
                      updateConfig('features', newFeatures);
                    }}
                  >
                    <Plus size={16} className="mr-1" />
                    Ajouter
                  </Button>
                </div>

                <div className="space-y-3">
                  {config.features.map((feature, index) => (
                    <div key={feature.id} className="p-4 bg-advist-surface-dark/30 rounded-xl">
                      <div className="flex items-start gap-3">
                        <GripVertical
                          size={18}
                          className="text-advist-blue-light cursor-grab mt-3"
                        />
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-3">
                            <input
                              type="text"
                              value={feature.icon}
                              onChange={(e) => {
                                const newFeatures = [...config.features];
                                newFeatures[index].icon = e.target.value;
                                updateConfig('features', newFeatures);
                              }}
                              className="w-24 px-3 py-2 border border-advist-border rounded-lg text-sm"
                              placeholder="Icône"
                            />
                            <input
                              type="text"
                              value={feature.title}
                              onChange={(e) => {
                                const newFeatures = [...config.features];
                                newFeatures[index].title = e.target.value;
                                updateConfig('features', newFeatures);
                              }}
                              className="flex-1 px-3 py-2 border border-advist-border rounded-lg font-medium"
                              placeholder="Titre"
                            />
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={feature.enabled}
                                onChange={(e) => {
                                  const newFeatures = [...config.features];
                                  newFeatures[index].enabled = e.target.checked;
                                  updateConfig('features', newFeatures);
                                }}
                                className="w-4 h-4 rounded border-advist-border text-advist-gray900"
                              />
                              <span className="text-sm text-advist-blue-light">Actif</span>
                            </label>
                          </div>
                          <textarea
                            value={feature.description}
                            onChange={(e) => {
                              const newFeatures = [...config.features];
                              newFeatures[index].description = e.target.value;
                              updateConfig('features', newFeatures);
                            }}
                            rows={2}
                            className="w-full px-3 py-2 border border-advist-border rounded-lg text-sm"
                            placeholder="Description"
                          />
                        </div>
                        <button
                          onClick={() => {
                            const newFeatures = config.features.filter((_, i) => i !== index);
                            updateConfig('features', newFeatures);
                          }}
                          className="p-2 text-advist-red hover:bg-advist-red/10 rounded-lg"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Testimonials Editor */}
            {activeSection === 'testimonials' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-advist-gray900">Témoignages</h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newTestimonials = [
                        ...config.testimonials,
                        {
                          id: String(Date.now()),
                          name: 'Nouveau client',
                          role: 'Poste',
                          company: 'Entreprise',
                          content: 'Témoignage...',
                          avatar: '',
                          enabled: true,
                        },
                      ];
                      updateConfig('testimonials', newTestimonials);
                    }}
                  >
                    <Plus size={16} className="mr-1" />
                    Ajouter
                  </Button>
                </div>

                <div className="space-y-4">
                  {config.testimonials.map((testimonial, index) => (
                    <div
                      key={testimonial.id}
                      className="p-4 bg-advist-surface-dark/30 rounded-xl space-y-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-advist-dark rounded-full flex items-center justify-center text-white font-bold">
                          {testimonial.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <input
                            type="text"
                            value={testimonial.name}
                            onChange={(e) => {
                              const newTestimonials = [...config.testimonials];
                              newTestimonials[index].name = e.target.value;
                              updateConfig('testimonials', newTestimonials);
                            }}
                            className="w-full px-3 py-1 border border-advist-border rounded-lg font-medium"
                            placeholder="Nom"
                          />
                          <div className="flex gap-2 mt-1">
                            <input
                              type="text"
                              value={testimonial.role}
                              onChange={(e) => {
                                const newTestimonials = [...config.testimonials];
                                newTestimonials[index].role = e.target.value;
                                updateConfig('testimonials', newTestimonials);
                              }}
                              className="flex-1 px-3 py-1 border border-advist-border rounded-lg text-sm"
                              placeholder="Poste"
                            />
                            <input
                              type="text"
                              value={testimonial.company}
                              onChange={(e) => {
                                const newTestimonials = [...config.testimonials];
                                newTestimonials[index].company = e.target.value;
                                updateConfig('testimonials', newTestimonials);
                              }}
                              className="flex-1 px-3 py-1 border border-advist-border rounded-lg text-sm"
                              placeholder="Entreprise"
                            />
                          </div>
                        </div>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={testimonial.enabled}
                            onChange={(e) => {
                              const newTestimonials = [...config.testimonials];
                              newTestimonials[index].enabled = e.target.checked;
                              updateConfig('testimonials', newTestimonials);
                            }}
                            className="w-4 h-4 rounded border-advist-border text-advist-gray900"
                          />
                          <span className="text-sm text-advist-blue-light">Actif</span>
                        </label>
                        <button
                          onClick={() => {
                            const newTestimonials = config.testimonials.filter(
                              (_, i) => i !== index
                            );
                            updateConfig('testimonials', newTestimonials);
                          }}
                          className="p-2 text-advist-red hover:bg-advist-red/10 rounded-lg"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <textarea
                        value={testimonial.content}
                        onChange={(e) => {
                          const newTestimonials = [...config.testimonials];
                          newTestimonials[index].content = e.target.value;
                          updateConfig('testimonials', newTestimonials);
                        }}
                        rows={2}
                        className="w-full px-3 py-2 border border-advist-border rounded-lg text-sm"
                        placeholder="Témoignage"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer Editor */}
            {activeSection === 'footer' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-advist-gray900">Footer</h2>

                <div>
                  <label className="block text-sm font-medium text-advist-gray900 mb-2">
                    Nom de l'entreprise
                  </label>
                  <input
                    type="text"
                    value={config.footer_company_name}
                    onChange={(e) => updateConfig('footer_company_name', e.target.value)}
                    className="w-full px-4 py-3 border border-advist-border rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-advist-gray900 mb-2">
                    Description
                  </label>
                  <textarea
                    value={config.footer_description}
                    onChange={(e) => updateConfig('footer_description', e.target.value)}
                    rows={2}
                    className="w-full px-4 py-3 border border-advist-border rounded-xl"
                  />
                </div>

                <div className="space-y-3">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={config.footer_show_socials}
                      onChange={(e) => updateConfig('footer_show_socials', e.target.checked)}
                      className="w-5 h-5 rounded border-advist-border text-advist-gray900"
                    />
                    <span className="text-sm font-medium text-advist-gray900">
                      Afficher les réseaux sociaux
                    </span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={config.footer_show_newsletter}
                      onChange={(e) => updateConfig('footer_show_newsletter', e.target.checked)}
                      className="w-5 h-5 rounded border-advist-border text-advist-gray900"
                    />
                    <span className="text-sm font-medium text-advist-gray900">
                      Afficher le formulaire newsletter
                    </span>
                  </label>
                </div>
              </div>
            )}

            {/* Social Links Editor */}
            {activeSection === 'social' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-advist-gray900">Réseaux Sociaux</h2>
                <p className="text-sm text-advist-blue-light">
                  Configurez les liens vers vos réseaux sociaux
                </p>

                <div className="space-y-4">
                  {[
                    {
                      key: 'social_facebook',
                      label: 'Facebook',
                      placeholder: 'https://facebook.com/...',
                    },
                    {
                      key: 'social_twitter',
                      label: 'Twitter/X',
                      placeholder: 'https://twitter.com/...',
                    },
                    {
                      key: 'social_linkedin',
                      label: 'LinkedIn',
                      placeholder: 'https://linkedin.com/company/...',
                    },
                    {
                      key: 'social_instagram',
                      label: 'Instagram',
                      placeholder: 'https://instagram.com/...',
                    },
                    {
                      key: 'social_youtube',
                      label: 'YouTube',
                      placeholder: 'https://youtube.com/@...',
                    },
                  ].map((social) => (
                    <div key={social.key}>
                      <label className="block text-sm font-medium text-advist-gray900 mb-2">
                        {social.label}
                      </label>
                      <input
                        type="url"
                        value={((config as Record<string, unknown>)[social.key] as string) || ''}
                        onChange={(e) => updateConfig(social.key, e.target.value)}
                        className="w-full px-4 py-3 border border-advist-border rounded-xl"
                        placeholder={social.placeholder}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Contact Editor */}
            {activeSection === 'contact' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-advist-gray900">Contact</h2>

                <div>
                  <label className="block text-sm font-medium text-advist-gray900 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={config.contact_email}
                    onChange={(e) => updateConfig('contact_email', e.target.value)}
                    className="w-full px-4 py-3 border border-advist-border rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-advist-gray900 mb-2">
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    value={config.contact_phone}
                    onChange={(e) => updateConfig('contact_phone', e.target.value)}
                    className="w-full px-4 py-3 border border-advist-border rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-advist-gray900 mb-2">
                    Adresse
                  </label>
                  <textarea
                    value={config.contact_address}
                    onChange={(e) => updateConfig('contact_address', e.target.value)}
                    rows={2}
                    className="w-full px-4 py-3 border border-advist-border rounded-xl"
                  />
                </div>
              </div>
            )}

            {/* Colors Editor */}
            {activeSection === 'colors' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-advist-gray900">Couleurs</h2>
                <p className="text-sm text-advist-blue-light">
                  Personnalisez les couleurs de votre landing page
                </p>

                <div className="grid grid-cols-2 gap-6">
                  {[
                    { key: 'color_primary', label: 'Couleur principale' },
                    { key: 'color_secondary', label: 'Couleur secondaire' },
                    { key: 'color_accent', label: "Couleur d'accent" },
                    { key: 'color_background', label: 'Fond' },
                  ].map((color) => (
                    <div key={color.key}>
                      <label className="block text-sm font-medium text-advist-gray900 mb-2">
                        {color.label}
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={(config as Record<string, unknown>)[color.key] as string}
                          onChange={(e) => updateConfig(color.key, e.target.value)}
                          className="w-12 h-12 rounded-xl border border-advist-border cursor-pointer"
                        />
                        <input
                          type="text"
                          value={(config as Record<string, unknown>)[color.key] as string}
                          onChange={(e) => updateConfig(color.key, e.target.value)}
                          className="flex-1 px-4 py-3 border border-advist-border rounded-xl font-mono uppercase"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-4 bg-advist-surface-dark/30 rounded-xl">
                  <p className="text-sm font-medium text-advist-gray900 mb-3">
                    Aperçu des couleurs
                  </p>
                  <div className="flex gap-3">
                    <div
                      className="w-16 h-16 rounded-xl"
                      style={{ backgroundColor: config.color_primary }}
                    />
                    <div
                      className="w-16 h-16 rounded-xl"
                      style={{ backgroundColor: config.color_secondary }}
                    />
                    <div
                      className="w-16 h-16 rounded-xl"
                      style={{ backgroundColor: config.color_accent }}
                    />
                    <div
                      className="w-16 h-16 rounded-xl border border-advist-border"
                      style={{ backgroundColor: config.color_background }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* SEO Editor */}
            {activeSection === 'seo' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-advist-gray900">SEO & Métadonnées</h2>

                <div>
                  <label className="block text-sm font-medium text-advist-gray900 mb-2">
                    Titre SEO{' '}
                    <span className="text-advist-blue-light">({config.seo_title.length}/70)</span>
                  </label>
                  <input
                    type="text"
                    value={config.seo_title}
                    onChange={(e) => updateConfig('seo_title', e.target.value)}
                    maxLength={70}
                    className="w-full px-4 py-3 border border-advist-border rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-advist-gray900 mb-2">
                    Description SEO{' '}
                    <span className="text-advist-blue-light">
                      ({config.seo_description.length}/160)
                    </span>
                  </label>
                  <textarea
                    value={config.seo_description}
                    onChange={(e) => updateConfig('seo_description', e.target.value)}
                    maxLength={160}
                    rows={2}
                    className="w-full px-4 py-3 border border-advist-border rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-advist-gray900 mb-2">
                    Mots-clés (séparés par des virgules)
                  </label>
                  <input
                    type="text"
                    value={config.seo_keywords}
                    onChange={(e) => updateConfig('seo_keywords', e.target.value)}
                    className="w-full px-4 py-3 border border-advist-border rounded-xl"
                    placeholder="gestion documentaire, signature électronique, workflow..."
                  />
                </div>
              </div>
            )}

            {/* Visibility Editor */}
            {activeSection === 'visibility' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-advist-gray900">
                  Visibilité des Sections
                </h2>
                <p className="text-sm text-advist-blue-light">
                  Activez ou désactivez les sections de la landing page
                </p>

                <div className="space-y-3">
                  {[
                    { key: 'show_trusted_companies', label: 'Entreprises partenaires' },
                    { key: 'show_features', label: 'Fonctionnalités' },
                    { key: 'show_how_it_works', label: 'Comment ça marche' },
                    { key: 'show_testimonials', label: 'Témoignages' },
                    { key: 'show_pricing', label: 'Tarifs' },
                    { key: 'show_blog', label: 'Blog' },
                    { key: 'show_newsletter', label: 'Newsletter' },
                    { key: 'show_cta', label: 'Call-to-Action final' },
                  ].map((item) => (
                    <label
                      key={item.key}
                      className="flex items-center gap-3 p-3 bg-advist-surface-dark/30 rounded-xl cursor-pointer hover:bg-advist-surface-dark/50"
                    >
                      <input
                        type="checkbox"
                        checked={(config as Record<string, unknown>)[item.key] as boolean}
                        onChange={(e) => updateConfig(item.key, e.target.checked)}
                        className="w-5 h-5 rounded border-advist-border text-advist-gray900"
                      />
                      <span className="text-sm font-medium text-advist-gray900">{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      <Modal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        title="Prévisualisation"
        size="xl"
      >
        <div className="text-center py-12">
          <ExternalLink size={48} className="mx-auto text-advist-blue-light mb-4" />
          <p className="text-advist-gray900 font-medium">
            La prévisualisation s'ouvre dans un nouvel onglet
          </p>
          <Button className="mt-4" onClick={() => window.open('/', '_blank')}>
            Ouvrir la landing page
          </Button>
        </div>
      </Modal>

      {/* History Modal */}
      <Modal
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        title="Historique des modifications"
        size="lg"
      >
        <div className="max-h-96 overflow-y-auto">
          {history.length === 0 ? (
            <p className="text-center text-advist-blue-light py-8">Aucun historique disponible</p>
          ) : (
            <div className="space-y-3">
              {history.map((entry) => (
                <div key={entry.id} className="p-4 bg-advist-surface-dark/30 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-advist-gray900">{entry.changed_by_name}</span>
                    <span className="text-sm text-advist-blue-light">
                      {new Date(entry.timestamp).toLocaleString('fr-FR')}
                    </span>
                  </div>
                  <p className="text-sm text-advist-blue-light">{entry.changed_by_email}</p>
                  <div className="mt-2 text-xs text-advist-blue-light/80">
                    {Object.keys(entry.changes).length} champ(s) modifié(s)
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default LandingPageEditorPage;
