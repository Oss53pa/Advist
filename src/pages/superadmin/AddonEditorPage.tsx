import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Sparkles,
  Plus,
  Trash2,
  Check,
  X,
  Save,
  RotateCcw,
  Edit,
  Eye,
  ToggleLeft,
  ToggleRight,
  AlertCircle,
  Package,
} from 'lucide-react';
import { Button, Modal, Badge } from '../../components/ui';
import { addonsService, Addon, AddonCreateRequest } from '../../services/subscriptions';

interface AddonFormData {
  id?: string;
  code: string;
  name: string;
  description: string;
  features: string[];
  pricing: Record<string, number>;
  currency: string;
  icon: string;
  is_active: boolean;
  available_plan_codes: string[];
}

const AVAILABLE_PLANS = [
  { code: 'business', name: 'Business' },
  { code: 'enterprise', name: 'Enterprise' },
];

const DEFAULT_ADDON: AddonFormData = {
  code: '',
  name: '',
  description: '',
  features: [],
  pricing: { business: 0, enterprise: 0 },
  currency: 'XOF',
  icon: 'sparkles',
  is_active: true,
  available_plan_codes: ['business', 'enterprise'],
};

export const AddonEditorPage: React.FC = () => {
  const { t } = useTranslation();
  const [addons, setAddons] = useState<Addon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAddon, setSelectedAddon] = useState<AddonFormData | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [addonToDelete, setAddonToDelete] = useState<Addon | null>(null);
  const [saving, setSaving] = useState(false);
  const [newFeature, setNewFeature] = useState('');

  useEffect(() => {
    loadAddons();
  }, []);

  const loadAddons = async () => {
    try {
      setLoading(true);
      const data = await addonsService.list();
      setAddons(data);
    } catch (err) {
      setError('Erreur lors du chargement des addons');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    setSelectedAddon({ ...DEFAULT_ADDON });
    setShowModal(true);
  };

  const handleEdit = (addon: Addon) => {
    setSelectedAddon({
      id: addon.id,
      code: addon.code,
      name: addon.name,
      description: addon.description || '',
      features: addon.features || [],
      pricing: addon.pricing || { business: 0, enterprise: 0 },
      currency: addon.currency || 'XOF',
      icon: addon.icon || 'sparkles',
      is_active: addon.is_active,
      available_plan_codes: addon.available_plans || ['business', 'enterprise'],
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!selectedAddon) return;

    try {
      setSaving(true);
      const data: AddonCreateRequest = {
        code: selectedAddon.code,
        name: selectedAddon.name,
        description: selectedAddon.description,
        features: selectedAddon.features,
        pricing: selectedAddon.pricing,
        currency: selectedAddon.currency,
        icon: selectedAddon.icon,
        is_active: selectedAddon.is_active,
      };

      if (selectedAddon.id) {
        await addonsService.update(selectedAddon.id, data);
      } else {
        await addonsService.create(data);
      }

      await loadAddons();
      setShowModal(false);
      setSelectedAddon(null);
    } catch (err) {
      console.error('Error saving addon:', err);
      setError('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!addonToDelete) return;

    try {
      await addonsService.delete(addonToDelete.id);
      await loadAddons();
      setShowDeleteConfirm(false);
      setAddonToDelete(null);
    } catch (err) {
      console.error('Error deleting addon:', err);
      setError('Erreur lors de la suppression');
    }
  };

  const handleToggleActive = async (addon: Addon) => {
    try {
      await addonsService.update(addon.id, { is_active: !addon.is_active });
      await loadAddons();
    } catch (err) {
      console.error('Error toggling addon:', err);
    }
  };

  const handleAddFeature = () => {
    if (!selectedAddon || !newFeature.trim()) return;
    setSelectedAddon({
      ...selectedAddon,
      features: [...selectedAddon.features, newFeature.trim()],
    });
    setNewFeature('');
  };

  const handleRemoveFeature = (index: number) => {
    if (!selectedAddon) return;
    setSelectedAddon({
      ...selectedAddon,
      features: selectedAddon.features.filter((_, i) => i !== index),
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR').format(price);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Gestion des Add-ons
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Configurez les options payantes disponibles pour les abonnements
          </p>
        </div>
        <Button onClick={handleCreateNew}>
          <Plus size={18} className="mr-2" />
          Nouvel Add-on
        </Button>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="text-red-500" size={20} />
          <span className="text-red-700 dark:text-red-400">{error}</span>
          <button onClick={() => setError(null)} className="ml-auto">
            <X size={18} />
          </button>
        </div>
      )}

      {/* Addons Grid */}
      {addons.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <Package className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
            Aucun add-on
          </h3>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            Commencez par creer votre premier add-on payant.
          </p>
          <Button onClick={handleCreateNew} className="mt-6">
            <Plus size={18} className="mr-2" />
            Creer un add-on
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {addons.map((addon) => (
            <div
              key={addon.id}
              className={`bg-white dark:bg-gray-800 rounded-xl border-2 overflow-hidden transition-all ${
                addon.is_active
                  ? 'border-primary-200 dark:border-primary-800'
                  : 'border-gray-200 dark:border-gray-700 opacity-60'
              }`}
            >
              {/* Card Header */}
              <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-6 text-white">
                <div className="flex items-start justify-between">
                  <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                    <Sparkles className="w-7 h-7" />
                  </div>
                  <div className="flex gap-2">
                    {addon.is_active ? (
                      <Badge variant="success" size="sm">Actif</Badge>
                    ) : (
                      <Badge variant="default" size="sm">Inactif</Badge>
                    )}
                  </div>
                </div>
                <h3 className="text-xl font-bold mt-4">{addon.name}</h3>
                <p className="text-white/80 text-sm mt-1">{addon.code}</p>
              </div>

              {/* Card Body */}
              <div className="p-6 space-y-4">
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  {addon.description || 'Aucune description'}
                </p>

                {/* Pricing */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase">
                    Tarification
                  </h4>
                  <div className="space-y-1">
                    {Object.entries(addon.pricing || {}).map(([plan, price]) => (
                      <div key={plan} className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400 capitalize">
                          {plan}
                        </span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {formatPrice(price as number)} {addon.currency}/mois
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Features */}
                {addon.features && addon.features.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase">
                      Fonctionnalites
                    </h4>
                    <ul className="space-y-1">
                      {addon.features.slice(0, 3).map((feature, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                          <Check size={14} className="text-green-500 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                      {addon.features.length > 3 && (
                        <li className="text-sm text-gray-400">
                          +{addon.features.length - 3} autres...
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>

              {/* Card Actions */}
              <div className="px-6 pb-6 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleEdit(addon)}
                >
                  <Edit size={16} className="mr-1" />
                  Modifier
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleToggleActive(addon)}
                >
                  {addon.is_active ? (
                    <ToggleRight size={20} className="text-green-500" />
                  ) : (
                    <ToggleLeft size={20} className="text-gray-400" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setAddonToDelete(addon);
                    setShowDeleteConfirm(true);
                  }}
                >
                  <Trash2 size={16} className="text-red-500" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit/Create Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedAddon(null);
        }}
        title={selectedAddon?.id ? 'Modifier l\'add-on' : 'Nouvel add-on'}
        size="lg"
      >
        {selectedAddon && (
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Code unique
                </label>
                <input
                  type="text"
                  value={selectedAddon.code}
                  onChange={(e) => setSelectedAddon({ ...selectedAddon, code: e.target.value })}
                  placeholder="ia_option"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  disabled={!!selectedAddon.id}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nom
                </label>
                <input
                  type="text"
                  value={selectedAddon.name}
                  onChange={(e) => setSelectedAddon({ ...selectedAddon, name: e.target.value })}
                  placeholder="Offre IA"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                value={selectedAddon.description}
                onChange={(e) => setSelectedAddon({ ...selectedAddon, description: e.target.value })}
                placeholder="Description de l'add-on..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {/* Pricing per plan */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tarification par plan (FCFA/mois)
              </label>
              <div className="grid grid-cols-2 gap-4">
                {AVAILABLE_PLANS.map((plan) => (
                  <div key={plan.code}>
                    <label className="block text-xs text-gray-500 mb-1">
                      {plan.name}
                    </label>
                    <input
                      type="number"
                      value={selectedAddon.pricing[plan.code] || 0}
                      onChange={(e) => setSelectedAddon({
                        ...selectedAddon,
                        pricing: {
                          ...selectedAddon.pricing,
                          [plan.code]: parseInt(e.target.value) || 0,
                        },
                      })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Features */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Fonctionnalites incluses
              </label>
              <div className="space-y-2">
                {selectedAddon.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Check size={16} className="text-green-500 flex-shrink-0" />
                    <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">
                      {feature}
                    </span>
                    <button
                      onClick={() => handleRemoveFeature(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newFeature}
                    onChange={(e) => setNewFeature(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddFeature()}
                    placeholder="Nouvelle fonctionnalite..."
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  />
                  <Button variant="outline" size="sm" onClick={handleAddFeature}>
                    <Plus size={16} />
                  </Button>
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Statut
              </label>
              <button
                onClick={() => setSelectedAddon({ ...selectedAddon, is_active: !selectedAddon.is_active })}
                className="flex items-center gap-2"
              >
                {selectedAddon.is_active ? (
                  <>
                    <ToggleRight size={24} className="text-green-500" />
                    <span className="text-sm text-green-600">Actif</span>
                  </>
                ) : (
                  <>
                    <ToggleLeft size={24} className="text-gray-400" />
                    <span className="text-sm text-gray-500">Inactif</span>
                  </>
                )}
              </button>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="outline"
                onClick={() => {
                  setShowModal(false);
                  setSelectedAddon(null);
                }}
              >
                Annuler
              </Button>
              <Button onClick={handleSave} disabled={saving || !selectedAddon.code || !selectedAddon.name}>
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save size={18} className="mr-2" />
                    Enregistrer
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setAddonToDelete(null);
        }}
        title="Confirmer la suppression"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-300">
            Etes-vous sur de vouloir supprimer l'add-on <strong>{addonToDelete?.name}</strong> ?
            Cette action est irreversible.
          </p>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteConfirm(false);
                setAddonToDelete(null);
              }}
            >
              Annuler
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              <Trash2 size={16} className="mr-2" />
              Supprimer
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AddonEditorPage;
