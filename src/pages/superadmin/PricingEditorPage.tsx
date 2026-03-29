import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Plus,
  Trash2,
  Check,
  X,
  Save,
  RotateCcw,
  Eye,
  Star,
  Zap,
  Building2,
  Crown,
  Edit,
  Copy,
} from 'lucide-react';
import { Button, Modal } from '../../components/ui';

interface PricingFeature {
  id: string;
  name: string;
  included: boolean;
  limit?: string;
}

interface PricingPlan {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  currency: string;
  icon: string;
  color: string;
  isPopular: boolean;
  isEnterprise: boolean;
  features: PricingFeature[];
  maxUsers: number | null;
  maxDocuments: number | null;
  maxStorage: number | null;
  enabled: boolean;
}

// Mock pricing plans - 4 plans: Free, Starter, Business, Enterprise
const mockPlans: PricingPlan[] = [
  {
    id: '1',
    name: 'Free',
    description: 'Découvrez ADVIST gratuitement',
    monthlyPrice: 0,
    yearlyPrice: 0,
    currency: 'XOF',
    icon: 'Zap',
    color: 'bg-primary-600',
    isPopular: false,
    isEnterprise: false,
    maxUsers: 2,
    maxDocuments: 50,
    maxStorage: 1,
    enabled: true,
    features: [
      { id: 'f1', name: 'Gestion documentaire', included: true },
      { id: 'f2', name: 'Signature électronique', included: true, limit: '10/mois' },
      { id: 'f3', name: 'Workflows basiques', included: true, limit: '1 workflow' },
      { id: 'f4', name: '2FA', included: true },
      { id: 'f5', name: 'Support communauté', included: true },
      { id: 'f6', name: 'Audit logs', included: true, limit: '7 jours' },
      { id: 'f7', name: 'API Access', included: false },
      { id: 'f8', name: 'Intégration cloud', included: false },
    ],
  },
  {
    id: '2',
    name: 'Starter',
    description: 'Pour les petites équipes',
    monthlyPrice: 29000,
    yearlyPrice: 290000,
    currency: 'XOF',
    icon: 'Zap',
    color: 'bg-primary-700',
    isPopular: false,
    isEnterprise: false,
    maxUsers: 10,
    maxDocuments: 1000,
    maxStorage: 25,
    enabled: true,
    features: [
      { id: 'f1', name: 'Gestion documentaire', included: true },
      { id: 'f2', name: 'Signature électronique', included: true, limit: '100/mois' },
      { id: 'f3', name: 'Workflows basiques', included: true, limit: '10 workflows' },
      { id: 'f4', name: '2FA', included: true },
      { id: 'f5', name: 'Support email', included: true },
      { id: 'f6', name: 'Audit logs', included: true, limit: '90 jours' },
      { id: 'f7', name: 'Intégration cloud', included: true },
      { id: 'f8', name: 'OCR', included: true },
      { id: 'f9', name: 'API Access', included: false },
    ],
  },
  {
    id: '3',
    name: 'Business',
    description: 'Pour les PME (par emetteur)',
    monthlyPrice: 25000,
    yearlyPrice: 240000,
    currency: 'XOF',
    icon: 'Star',
    color: 'bg-primary-900',
    isPopular: true,
    isEnterprise: false,
    maxUsers: 5,
    maxDocuments: 50,
    maxStorage: 10,
    enabled: true,
    features: [
      { id: 'f1', name: 'Gestion documentaire', included: true },
      { id: 'f2', name: 'Signature simple', included: true, limit: '50/mois' },
      { id: 'f3', name: 'Workflows configurables', included: true, limit: '10 workflows' },
      { id: 'f4', name: '2FA', included: true },
      { id: 'f5', name: 'Support email', included: true },
      { id: 'f6', name: 'Audit logs', included: true, limit: '1 an' },
      { id: 'f7', name: 'Annotations & commentaires', included: true },
      { id: 'f8', name: 'OCR', included: true },
      { id: 'f9', name: 'API Access', included: false },
      { id: 'f10', name: 'SSO / SAML', included: false },
      { id: 'f11', name: 'OHADA / eIDAS', included: false },
      { id: 'f12', name: 'Branding personnalise', included: false },
    ],
  },
  {
    id: '4',
    name: 'Entreprise',
    description: 'Tout illimite',
    monthlyPrice: 150000,
    yearlyPrice: 1440000,
    currency: 'XOF',
    icon: 'Crown',
    color: 'bg-status-error',
    isPopular: false,
    isEnterprise: true,
    maxUsers: null,
    maxDocuments: null,
    maxStorage: null,
    enabled: true,
    features: [
      { id: 'f1', name: 'Gestion documentaire', included: true },
      { id: 'f2', name: 'Signature électronique', included: true, limit: 'Illimité' },
      { id: 'f3', name: 'Workflows personnalisés', included: true, limit: 'Illimité' },
      { id: 'f4', name: '2FA', included: true },
      { id: 'f5', name: 'Support dédié 24/7', included: true },
      { id: 'f6', name: 'Audit logs', included: true, limit: 'Illimité' },
      { id: 'f7', name: 'Intégration cloud', included: true },
      { id: 'f8', name: 'OCR', included: true },
      { id: 'f9', name: 'API Access', included: true },
      { id: 'f10', name: 'Webhooks', included: true },
      { id: 'f11', name: 'Assistant IA complet', included: true },
      { id: 'f12', name: 'White label', included: true },
      { id: 'f13', name: 'SSO & SAML', included: true },
      { id: 'f14', name: 'Signature biométrique', included: true },
      { id: 'f15', name: 'Manager dédié', included: true },
    ],
  },
];

const ICON_OPTIONS = [
  { value: 'Zap', label: 'Éclair', icon: Zap },
  { value: 'Star', label: 'Étoile', icon: Star },
  { value: 'Crown', label: 'Couronne', icon: Crown },
  { value: 'Building2', label: 'Entreprise', icon: Building2 },
];

const COLOR_OPTIONS = [
  { value: 'bg-primary-600', label: 'Gris' },
  { value: 'bg-primary-700', label: 'Gris foncé' },
  { value: 'bg-primary-800', label: 'Charbon' },
  { value: 'bg-primary-900', label: 'Noir' },
  { value: 'bg-status-success', label: 'Vert' },
  { value: 'bg-status-info', label: 'Bleu' },
];

export const PricingEditorPage: React.FC = () => {
  useTranslation();
  const [plans, setPlans] = useState<PricingPlan[]>(mockPlans);
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan | null>(null);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const handleSave = () => {
    setHasChanges(false);
  };

  const handleReset = () => {
    setPlans(mockPlans);
    setHasChanges(false);
  };

  const openPlanEditor = (plan: PricingPlan) => {
    setSelectedPlan({ ...plan });
    setShowPlanModal(true);
  };

  const createNewPlan = () => {
    const newPlan: PricingPlan = {
      id: `new-${Date.now()}`,
      name: 'Nouveau Plan',
      description: 'Description du plan',
      monthlyPrice: 0,
      yearlyPrice: 0,
      currency: 'XOF',
      icon: 'Zap',
      color: 'bg-primary-700',
      isPopular: false,
      isEnterprise: false,
      maxUsers: 10,
      maxDocuments: 500,
      maxStorage: 10,
      enabled: false,
      features: [
        { id: 'f1', name: 'Gestion documentaire', included: true },
        { id: 'f2', name: 'Signature électronique', included: true },
      ],
    };
    setSelectedPlan(newPlan);
    setShowPlanModal(true);
  };

  const savePlan = () => {
    if (!selectedPlan) return;

    const existingIndex = plans.findIndex((p) => p.id === selectedPlan.id);
    if (existingIndex >= 0) {
      const newPlans = [...plans];
      newPlans[existingIndex] = selectedPlan;
      setPlans(newPlans);
    } else {
      setPlans([...plans, selectedPlan]);
    }
    setShowPlanModal(false);
    setHasChanges(true);
  };

  const deletePlan = (planId: string) => {
    setPlans(plans.filter((p) => p.id !== planId));
    setHasChanges(true);
  };

  const duplicatePlan = (plan: PricingPlan) => {
    const newPlan = {
      ...plan,
      id: `copy-${Date.now()}`,
      name: `${plan.name} (copie)`,
      isPopular: false,
    };
    setPlans([...plans, newPlan]);
    setHasChanges(true);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR').format(price);
  };

  const getIconComponent = (iconName: string) => {
    const iconOption = ICON_OPTIONS.find((opt) => opt.value === iconName);
    return iconOption?.icon || Zap;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary-900">Grille Tarifaire</h1>
          <p className="text-primary-500 mt-1">Gérez vos plans et tarifs</p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => setShowPreview(true)}>
            <Eye size={16} className="mr-2" />
            Prévisualiser
          </Button>
          <Button variant="outline" onClick={handleReset} disabled={!hasChanges}>
            <RotateCcw size={16} className="mr-2" />
            Réinitialiser
          </Button>
          <Button onClick={handleSave} disabled={!hasChanges}>
            <Save size={16} className="mr-2" />
            Enregistrer
          </Button>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const IconComponent = getIconComponent(plan.icon);

          return (
            <div
              key={plan.id}
              className={`relative bg-white rounded-2xl border-2 overflow-hidden transition-all hover:shadow-card ${
                plan.isPopular ? 'border-primary-900' : 'border-primary-200'
              } ${!plan.enabled ? 'opacity-60' : ''}`}
            >
              {plan.isPopular && (
                <div className="absolute top-0 right-0 bg-primary-900 text-white text-xs font-bold px-3 py-1 rounded-bl-xl">
                  POPULAIRE
                </div>
              )}

              {/* Header */}
              <div className={`${plan.color} p-6`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-white/20 rounded-xl">
                    <IconComponent size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                    <p className="text-sm text-white/80">{plan.description}</p>
                  </div>
                </div>

                {plan.isEnterprise ? (
                  <p className="text-2xl font-bold text-white">Sur devis</p>
                ) : (
                  <div>
                    <p className="text-3xl font-bold text-white">
                      {formatPrice(plan.monthlyPrice)}{' '}
                      <span className="text-lg font-normal text-white">FCFA/mois</span>
                    </p>
                    <p className="text-sm text-white/70">
                      ou {formatPrice(plan.yearlyPrice)} FCFA/an
                    </p>
                  </div>
                )}
              </div>

              {/* Limits */}
              <div className="p-4 bg-primary-100/30 border-b border-primary-200">
                <div className="grid grid-cols-3 gap-2 text-center text-sm">
                  <div>
                    <p className="font-bold text-primary-900">
                      {plan.maxUsers === null ? '∞' : plan.maxUsers}
                    </p>
                    <p className="text-xs text-primary-500">Utilisateurs</p>
                  </div>
                  <div>
                    <p className="font-bold text-primary-900">
                      {plan.maxDocuments === null ? '∞' : plan.maxDocuments}
                    </p>
                    <p className="text-xs text-primary-500">Documents</p>
                  </div>
                  <div>
                    <p className="font-bold text-primary-900">
                      {plan.maxStorage === null ? '∞' : `${plan.maxStorage}GB`}
                    </p>
                    <p className="text-xs text-primary-500">Stockage</p>
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="p-4">
                <ul className="space-y-2">
                  {plan.features.slice(0, 5).map((feature) => (
                    <li key={feature.id} className="flex items-center gap-2 text-sm">
                      {feature.included ? (
                        <Check size={16} className="text-status-success" />
                      ) : (
                        <X size={16} className="text-primary-500/40" />
                      )}
                      <span
                        className={feature.included ? 'text-primary-900' : 'text-primary-500/60'}
                      >
                        {feature.name}
                        {feature.limit && <span className="text-xs ml-1">({feature.limit})</span>}
                      </span>
                    </li>
                  ))}
                  {plan.features.length > 5 && (
                    <li className="text-xs text-primary-500">
                      +{plan.features.length - 5} autres fonctionnalités
                    </li>
                  )}
                </ul>
              </div>

              {/* Actions */}
              <div className="p-4 border-t border-primary-200 flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => openPlanEditor(plan)}
                >
                  <Edit size={14} className="mr-1" />
                  Modifier
                </Button>
                <button
                  onClick={() => duplicatePlan(plan)}
                  className="p-2 hover:bg-primary-100 rounded-lg text-primary-500"
                >
                  <Copy size={16} />
                </button>
                <button
                  onClick={() => deletePlan(plan.id)}
                  className="p-2 hover:bg-status-error/10 rounded-lg text-status-error"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          );
        })}

        {/* Add New Plan Card */}
        <button
          onClick={createNewPlan}
          className="flex flex-col items-center justify-center min-h-[400px] bg-white rounded-2xl border-2 border-dashed border-primary-200 hover:border-primary-400 hover:bg-primary-100/20 transition-all"
        >
          <div className="p-4 bg-primary-100 rounded-full mb-4">
            <Plus size={32} className="text-primary-500" />
          </div>
          <p className="text-lg font-medium text-primary-900">Ajouter un plan</p>
          <p className="text-sm text-primary-500">Créer un nouveau plan tarifaire</p>
        </button>
      </div>

      {/* Plan Editor Modal */}
      <Modal
        isOpen={showPlanModal}
        onClose={() => setShowPlanModal(false)}
        title={selectedPlan?.id.startsWith('new') ? 'Nouveau plan' : 'Modifier le plan'}
        size="xl"
      >
        {selectedPlan && (
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-primary-900 mb-2">
                  Nom du plan
                </label>
                <input
                  type="text"
                  value={selectedPlan.name}
                  onChange={(e) => setSelectedPlan({ ...selectedPlan, name: e.target.value })}
                  className="w-full px-4 py-3 border border-primary-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-900 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={selectedPlan.description}
                  onChange={(e) =>
                    setSelectedPlan({ ...selectedPlan, description: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-primary-200 rounded-xl"
                />
              </div>
            </div>

            {/* Pricing */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-primary-900 mb-2">
                  Prix mensuel (FCFA)
                </label>
                <input
                  type="number"
                  value={selectedPlan.monthlyPrice}
                  onChange={(e) =>
                    setSelectedPlan({
                      ...selectedPlan,
                      monthlyPrice: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full px-4 py-3 border border-primary-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-900 mb-2">
                  Prix annuel (FCFA)
                </label>
                <input
                  type="number"
                  value={selectedPlan.yearlyPrice}
                  onChange={(e) =>
                    setSelectedPlan({ ...selectedPlan, yearlyPrice: parseInt(e.target.value) || 0 })
                  }
                  className="w-full px-4 py-3 border border-primary-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-900 mb-2">Devise</label>
                <select
                  value={selectedPlan.currency}
                  onChange={(e) => setSelectedPlan({ ...selectedPlan, currency: e.target.value })}
                  className="w-full px-4 py-3 border border-primary-200 rounded-xl"
                >
                  <option value="XOF">XOF (FCFA)</option>
                  <option value="EUR">EUR</option>
                  <option value="USD">USD</option>
                </select>
              </div>
            </div>

            {/* Limits */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-primary-900 mb-2">
                  Max utilisateurs
                </label>
                <input
                  type="number"
                  value={selectedPlan.maxUsers || ''}
                  onChange={(e) =>
                    setSelectedPlan({
                      ...selectedPlan,
                      maxUsers: e.target.value ? parseInt(e.target.value) : null,
                    })
                  }
                  placeholder="Illimité"
                  className="w-full px-4 py-3 border border-primary-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-900 mb-2">
                  Max documents
                </label>
                <input
                  type="number"
                  value={selectedPlan.maxDocuments || ''}
                  onChange={(e) =>
                    setSelectedPlan({
                      ...selectedPlan,
                      maxDocuments: e.target.value ? parseInt(e.target.value) : null,
                    })
                  }
                  placeholder="Illimité"
                  className="w-full px-4 py-3 border border-primary-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-900 mb-2">
                  Stockage (GB)
                </label>
                <input
                  type="number"
                  value={selectedPlan.maxStorage || ''}
                  onChange={(e) =>
                    setSelectedPlan({
                      ...selectedPlan,
                      maxStorage: e.target.value ? parseInt(e.target.value) : null,
                    })
                  }
                  placeholder="Illimité"
                  className="w-full px-4 py-3 border border-primary-200 rounded-xl"
                />
              </div>
            </div>

            {/* Appearance */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-primary-900 mb-2">Icône</label>
                <div className="flex gap-2">
                  {ICON_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setSelectedPlan({ ...selectedPlan, icon: opt.value })}
                      className={`p-3 rounded-xl border-2 transition-all ${
                        selectedPlan.icon === opt.value
                          ? 'border-primary-900 bg-primary-900/5'
                          : 'border-primary-200 hover:border-primary-400'
                      }`}
                    >
                      <opt.icon size={20} className="text-primary-900" />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-900 mb-2">Couleur</label>
                <div className="flex gap-2">
                  {COLOR_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setSelectedPlan({ ...selectedPlan, color: opt.value })}
                      className={`w-10 h-10 rounded-xl ${opt.value} ${
                        selectedPlan.color === opt.value
                          ? 'ring-2 ring-offset-2 ring-primary-900'
                          : ''
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Options */}
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedPlan.isPopular}
                  onChange={(e) =>
                    setSelectedPlan({ ...selectedPlan, isPopular: e.target.checked })
                  }
                  className="w-5 h-5 rounded border-primary-200 text-primary-900"
                />
                <span className="text-sm font-medium text-primary-900">Plan populaire</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedPlan.isEnterprise}
                  onChange={(e) =>
                    setSelectedPlan({ ...selectedPlan, isEnterprise: e.target.checked })
                  }
                  className="w-5 h-5 rounded border-primary-200 text-primary-900"
                />
                <span className="text-sm font-medium text-primary-900">
                  Plan Enterprise (sur devis)
                </span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedPlan.enabled}
                  onChange={(e) => setSelectedPlan({ ...selectedPlan, enabled: e.target.checked })}
                  className="w-5 h-5 rounded border-primary-200 text-primary-900"
                />
                <span className="text-sm font-medium text-primary-900">Actif</span>
              </label>
            </div>

            {/* Features */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-primary-900">Fonctionnalités</label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newFeature = {
                      id: `f-${Date.now()}`,
                      name: 'Nouvelle fonctionnalité',
                      included: true,
                    };
                    setSelectedPlan({
                      ...selectedPlan,
                      features: [...selectedPlan.features, newFeature],
                    });
                  }}
                >
                  <Plus size={14} className="mr-1" />
                  Ajouter
                </Button>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {selectedPlan.features.map((feature, index) => (
                  <div
                    key={feature.id}
                    className="flex items-center gap-2 p-2 bg-primary-100/30 rounded-lg"
                  >
                    <input
                      type="checkbox"
                      checked={feature.included}
                      onChange={(e) => {
                        const newFeatures = [...selectedPlan.features];
                        newFeatures[index].included = e.target.checked;
                        setSelectedPlan({ ...selectedPlan, features: newFeatures });
                      }}
                      className="w-4 h-4 rounded border-primary-200 text-primary-900"
                    />
                    <input
                      type="text"
                      value={feature.name}
                      onChange={(e) => {
                        const newFeatures = [...selectedPlan.features];
                        newFeatures[index].name = e.target.value;
                        setSelectedPlan({ ...selectedPlan, features: newFeatures });
                      }}
                      className="flex-1 px-2 py-1 bg-transparent border-0 focus:ring-0"
                    />
                    <input
                      type="text"
                      value={feature.limit || ''}
                      onChange={(e) => {
                        const newFeatures = [...selectedPlan.features];
                        newFeatures[index].limit = e.target.value;
                        setSelectedPlan({ ...selectedPlan, features: newFeatures });
                      }}
                      placeholder="Limite"
                      className="w-24 px-2 py-1 text-xs bg-white border border-primary-200 rounded"
                    />
                    <button
                      onClick={() => {
                        const newFeatures = selectedPlan.features.filter((_, i) => i !== index);
                        setSelectedPlan({ ...selectedPlan, features: newFeatures });
                      }}
                      className="p-1 text-status-error hover:bg-status-error/10 rounded"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-primary-200">
              <Button variant="outline" className="flex-1" onClick={() => setShowPlanModal(false)}>
                Annuler
              </Button>
              <Button className="flex-1" onClick={savePlan}>
                <Save size={16} className="mr-2" />
                Enregistrer
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Preview Modal */}
      <Modal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        title="Aperçu de la grille tarifaire"
        size="xl"
      >
        <div className="grid grid-cols-3 gap-4">
          {plans
            .filter((p) => p.enabled)
            .map((plan) => {
              const IconComponent = getIconComponent(plan.icon);
              return (
                <div
                  key={plan.id}
                  className={`rounded-2xl border-2 overflow-hidden ${
                    plan.isPopular ? 'border-primary-900' : 'border-primary-200'
                  }`}
                >
                  <div className={`${plan.color} p-4 text-center`}>
                    <IconComponent size={28} className="mx-auto mb-2 text-white" />
                    <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                    {plan.isEnterprise ? (
                      <p className="text-xl font-bold mt-2 text-white">Sur devis</p>
                    ) : (
                      <p className="text-xl font-bold mt-2 text-white">
                        {formatPrice(plan.monthlyPrice)} FCFA/mois
                      </p>
                    )}
                  </div>
                  <div className="p-4">
                    <ul className="space-y-2 text-sm">
                      {plan.features
                        .filter((f) => f.included)
                        .slice(0, 4)
                        .map((feature) => (
                          <li key={feature.id} className="flex items-center gap-2">
                            <Check size={14} className="text-status-success" />
                            {feature.name}
                          </li>
                        ))}
                    </ul>
                  </div>
                </div>
              );
            })}
        </div>
      </Modal>
    </div>
  );
};

export default PricingEditorPage;
