import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { generateSecureId } from '../../utils/encryption';
import {
  Shield,
  Plus,
  Edit2,
  Trash2,
  Clock,
  FileText,
  Calendar,
  AlertTriangle,
  Check,
  X,
  Settings,
  Archive,
  Zap,
  ChevronDown,
  ChevronRight,
  Lock,
  Unlock,
} from 'lucide-react';
import { Button, Card, Modal, Input, Badge } from '../ui';

export interface RetentionPolicy {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  isDefault: boolean;
  documentTypes: string[]; // Document type IDs this policy applies to
  retentionPeriod: {
    value: number;
    unit: 'days' | 'months' | 'years';
  };
  autoArchive: boolean;
  autoArchiveAfterDays: number;
  autoDelete: boolean;
  autoDeleteAfterRetention: boolean;
  legalHoldEnabled: boolean;
  notifyBeforeDeletion: boolean;
  notifyDaysBefore: number;
  createdAt: string;
  updatedAt: string;
}

export interface RetentionPoliciesProps {
  policies: RetentionPolicy[];
  onChange: (policies: RetentionPolicy[]) => void;
  readOnly?: boolean;
}

// Document types
const DOCUMENT_TYPES = [
  { id: 'contract', name: 'Contrats', defaultRetention: { value: 10, unit: 'years' } },
  { id: 'invoice', name: 'Factures', defaultRetention: { value: 10, unit: 'years' } },
  { id: 'hr', name: 'Documents RH', defaultRetention: { value: 5, unit: 'years' } },
  { id: 'legal', name: 'Documents juridiques', defaultRetention: { value: 10, unit: 'years' } },
  { id: 'report', name: 'Rapports', defaultRetention: { value: 5, unit: 'years' } },
  { id: 'correspondence', name: 'Correspondance', defaultRetention: { value: 3, unit: 'years' } },
  { id: 'internal', name: 'Documents internes', defaultRetention: { value: 2, unit: 'years' } },
  { id: 'other', name: 'Autres', defaultRetention: { value: 5, unit: 'years' } },
];

// Default policies
/**
 * Default policies — Module 7 (Valeur Probante)
 * La politique OHADA 10 ans est la politique par defaut pour les documents signes.
 * Un trigger PostgreSQL (migration 00028) empeche toute suppression pendant la retention.
 * Les documents signes via signatureService.signDocument() se voient automatiquement
 * appliquer la retention via documentRetentionService.applyDefaultRetention().
 */
const DEFAULT_POLICIES: RetentionPolicy[] = [
  {
    id: 'policy_1',
    name: 'Conservation légale OHADA',
    description: 'Politique conforme aux exigences OHADA pour les documents commerciaux. Trigger anti-suppression actif (migration 00028).',
    isActive: true,
    isDefault: true,
    documentTypes: ['contract', 'invoice', 'legal'],
    retentionPeriod: { value: 10, unit: 'years' },
    autoArchive: true,
    autoArchiveAfterDays: 365,
    autoDelete: false,
    autoDeleteAfterRetention: false,
    legalHoldEnabled: true,
    notifyBeforeDeletion: true,
    notifyDaysBefore: 90,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
  {
    id: 'policy_2',
    name: 'Documents RH',
    description: 'Conservation des documents relatifs aux ressources humaines',
    isActive: true,
    isDefault: false,
    documentTypes: ['hr'],
    retentionPeriod: { value: 5, unit: 'years' },
    autoArchive: true,
    autoArchiveAfterDays: 180,
    autoDelete: true,
    autoDeleteAfterRetention: true,
    legalHoldEnabled: false,
    notifyBeforeDeletion: true,
    notifyDaysBefore: 60,
    createdAt: '2024-02-15',
    updatedAt: '2024-02-15',
  },
  {
    id: 'policy_3',
    name: 'Documents temporaires',
    description: 'Pour les documents à courte durée de vie',
    isActive: true,
    isDefault: false,
    documentTypes: ['internal', 'correspondence'],
    retentionPeriod: { value: 2, unit: 'years' },
    autoArchive: false,
    autoArchiveAfterDays: 0,
    autoDelete: true,
    autoDeleteAfterRetention: true,
    legalHoldEnabled: false,
    notifyBeforeDeletion: true,
    notifyDaysBefore: 30,
    createdAt: '2024-03-01',
    updatedAt: '2024-03-01',
  },
];

export const RetentionPolicies: React.FC<RetentionPoliciesProps> = ({
  policies = DEFAULT_POLICIES,
  onChange,
  readOnly = false,
}) => {
  const { t } = useTranslation();
  const [selectedPolicy, setSelectedPolicy] = useState<RetentionPolicy | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [expandedPolicies, setExpandedPolicies] = useState<string[]>([]);

  const generateId = () => generateSecureId('policy');

  const togglePolicyExpand = (policyId: string) => {
    setExpandedPolicies((prev) =>
      prev.includes(policyId) ? prev.filter((id) => id !== policyId) : [...prev, policyId]
    );
  };

  const handleAddPolicy = () => {
    const newPolicy: RetentionPolicy = {
      id: generateId(),
      name: 'Nouvelle politique',
      isActive: true,
      isDefault: false,
      documentTypes: [],
      retentionPeriod: { value: 5, unit: 'years' },
      autoArchive: true,
      autoArchiveAfterDays: 365,
      autoDelete: false,
      autoDeleteAfterRetention: false,
      legalHoldEnabled: false,
      notifyBeforeDeletion: true,
      notifyDaysBefore: 30,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setSelectedPolicy(newPolicy);
    setShowEditModal(true);
  };

  const handleEditPolicy = (policy: RetentionPolicy) => {
    if (readOnly) return;
    setSelectedPolicy({ ...policy });
    setShowEditModal(true);
  };

  const handleDeletePolicy = (policyId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette politique ?')) {
      onChange(policies.filter((p) => p.id !== policyId));
    }
  };

  const handleToggleActive = (policyId: string) => {
    onChange(
      policies.map((p) =>
        p.id === policyId ? { ...p, isActive: !p.isActive, updatedAt: new Date().toISOString() } : p
      )
    );
  };

  const handleSetDefault = (policyId: string) => {
    onChange(
      policies.map((p) => ({
        ...p,
        isDefault: p.id === policyId,
        updatedAt: new Date().toISOString(),
      }))
    );
  };

  const handleSavePolicy = (policy: RetentionPolicy) => {
    const existingIndex = policies.findIndex((p) => p.id === policy.id);
    if (existingIndex >= 0) {
      const newPolicies = [...policies];
      newPolicies[existingIndex] = { ...policy, updatedAt: new Date().toISOString() };
      onChange(newPolicies);
    } else {
      onChange([...policies, policy]);
    }
    setShowEditModal(false);
    setSelectedPolicy(null);
  };

  const formatRetentionPeriod = (period: RetentionPolicy['retentionPeriod']) => {
    const unitLabels = { days: 'jour(s)', months: 'mois', years: 'an(s)' };
    return `${period.value} ${unitLabels[period.unit]}`;
  };

  const getDocumentTypeNames = (typeIds: string[]) => {
    return typeIds
      .map((id) => DOCUMENT_TYPES.find((t) => t.id === id)?.name || id)
      .join(', ');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[#1A1A2E]">
            {t('archives.retentionPolicies', 'Politiques de rétention')}
          </h2>
          <p className="text-sm text-[#6B7280] mt-1">
            Configurez les règles de conservation et d'archivage automatique des documents
          </p>
        </div>
        {!readOnly && (
          <Button onClick={handleAddPolicy}>
            <Plus size={16} className="mr-2" />
            Nouvelle politique
          </Button>
        )}
      </div>

      {/* Info Banner */}
      <div className="flex items-start gap-3 p-4 bg-advist-gold-light rounded-xl border border-advist-gold">
        <Shield size={20} className="text-advist-gray900 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-medium text-advist-gray900">Conformité OHADA</h4>
          <p className="text-sm text-advist-gray900 mt-1">
            Les politiques de rétention doivent respecter les exigences légales OHADA.
            Les documents commerciaux doivent être conservés pendant au moins 10 ans.
          </p>
        </div>
      </div>

      {/* Policies List */}
      <div className="space-y-4">
        {policies.map((policy) => {
          const isExpanded = expandedPolicies.includes(policy.id);

          return (
            <Card
              key={policy.id}
              className={`overflow-hidden transition-all ${!policy.isActive ? 'opacity-60' : ''}`}
            >
              {/* Policy Header */}
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-[#F8FAFC]"
                onClick={() => togglePolicyExpand(policy.id)}
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? (
                    <ChevronDown size={16} className="text-[#6B7280]" />
                  ) : (
                    <ChevronRight size={16} className="text-[#6B7280]" />
                  )}
                  <div className={`p-2 rounded-lg ${policy.isActive ? 'bg-green-50' : 'bg-advist-surface-dark'}`}>
                    <Archive size={18} className={policy.isActive ? 'text-advist-success' : 'text-advist-text-secondary'} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-[#1A1A2E]">{policy.name}</h4>
                      {policy.isDefault && (
                        <Badge variant="blue" size="sm">Par défaut</Badge>
                      )}
                      {policy.legalHoldEnabled && (
                        <Badge variant="red" size="sm">
                          <Lock size={10} className="mr-1" />
                          Conservation légale
                        </Badge>
                      )}
                    </div>
                    {policy.description && (
                      <p className="text-sm text-[#6B7280]">{policy.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                  <div className="text-right">
                    <p className="text-sm font-medium text-[#1A1A2E]">
                      {formatRetentionPeriod(policy.retentionPeriod)}
                    </p>
                    <p className="text-xs text-[#6B7280]">
                      {policy.documentTypes.length} type(s) de document
                    </p>
                  </div>

                  {!readOnly && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleToggleActive(policy.id)}
                        className={`px-2 py-1 text-xs rounded ${
                          policy.isActive
                            ? 'bg-green-50 text-advist-success'
                            : 'bg-advist-surface-dark text-advist-text-secondary'
                        }`}
                      >
                        {policy.isActive ? 'Actif' : 'Inactif'}
                      </button>
                      <button
                        onClick={() => handleEditPolicy(policy)}
                        className="p-1.5 rounded hover:bg-[#F1F5F9]"
                        title="Modifier"
                      >
                        <Edit2 size={14} className="text-[#6B7280]" />
                      </button>
                      {!policy.isDefault && (
                        <button
                          onClick={() => handleDeletePolicy(policy.id)}
                          className="p-1.5 rounded hover:bg-advist-gold-light"
                          title="Supprimer"
                        >
                          <Trash2 size={14} className="text-advist-error" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Policy Details */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-2 border-t border-[#E5E7EB]">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Document Types */}
                    <div className="p-3 bg-[#F8FAFC] rounded-lg">
                      <div className="flex items-center gap-2 text-sm text-[#6B7280] mb-2">
                        <FileText size={14} />
                        Types de documents
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {policy.documentTypes.length > 0 ? (
                          policy.documentTypes.map((typeId) => {
                            const docType = DOCUMENT_TYPES.find((t) => t.id === typeId);
                            return (
                              <span
                                key={typeId}
                                className="px-2 py-0.5 bg-white text-xs text-[#1A1A2E] rounded"
                              >
                                {docType?.name || typeId}
                              </span>
                            );
                          })
                        ) : (
                          <span className="text-sm text-[#6B7280]">Tous les types</span>
                        )}
                      </div>
                    </div>

                    {/* Auto Archive */}
                    <div className="p-3 bg-[#F8FAFC] rounded-lg">
                      <div className="flex items-center gap-2 text-sm text-[#6B7280] mb-2">
                        <Archive size={14} />
                        Archivage automatique
                      </div>
                      {policy.autoArchive ? (
                        <div className="flex items-center gap-2">
                          <Check size={14} className="text-advist-success" />
                          <span className="text-sm text-[#1A1A2E]">
                            Après {policy.autoArchiveAfterDays} jours
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <X size={14} className="text-advist-text-muted" />
                          <span className="text-sm text-[#6B7280]">Désactivé</span>
                        </div>
                      )}
                    </div>

                    {/* Auto Delete */}
                    <div className="p-3 bg-[#F8FAFC] rounded-lg">
                      <div className="flex items-center gap-2 text-sm text-[#6B7280] mb-2">
                        <Trash2 size={14} />
                        Suppression automatique
                      </div>
                      {policy.autoDelete ? (
                        <div className="flex items-center gap-2">
                          <AlertTriangle size={14} className="text-advist-gold-dark" />
                          <span className="text-sm text-[#1A1A2E]">
                            {policy.autoDeleteAfterRetention ? 'Après rétention' : 'Activé'}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <X size={14} className="text-advist-text-muted" />
                          <span className="text-sm text-[#6B7280]">Désactivé</span>
                        </div>
                      )}
                    </div>

                    {/* Notifications */}
                    <div className="p-3 bg-[#F8FAFC] rounded-lg">
                      <div className="flex items-center gap-2 text-sm text-[#6B7280] mb-2">
                        <Zap size={14} />
                        Notifications
                      </div>
                      {policy.notifyBeforeDeletion ? (
                        <div className="flex items-center gap-2">
                          <Check size={14} className="text-advist-success" />
                          <span className="text-sm text-[#1A1A2E]">
                            {policy.notifyDaysBefore} jours avant
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <X size={14} className="text-advist-text-muted" />
                          <span className="text-sm text-[#6B7280]">Désactivé</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  {!readOnly && !policy.isDefault && (
                    <div className="mt-4 pt-4 border-t border-[#E5E7EB]">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetDefault(policy.id)}
                      >
                        <Check size={14} className="mr-1" />
                        Définir par défaut
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {policies.length === 0 && (
        <Card className="p-8 text-center">
          <Archive size={40} className="mx-auto text-[#6B7280] mb-3" />
          <h4 className="font-medium text-[#1A1A2E]">Aucune politique de rétention</h4>
          <p className="text-sm text-[#6B7280] mt-1 mb-4">
            Créez des politiques pour automatiser l'archivage de vos documents
          </p>
          {!readOnly && (
            <Button size="sm" onClick={handleAddPolicy}>
              <Plus size={14} className="mr-1" />
              Créer une politique
            </Button>
          )}
        </Card>
      )}

      {/* Edit Modal */}
      {selectedPolicy && (
        <PolicyEditModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedPolicy(null);
          }}
          policy={selectedPolicy}
          onSave={handleSavePolicy}
        />
      )}
    </div>
  );
};

// Policy Edit Modal
const PolicyEditModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  policy: RetentionPolicy;
  onSave: (policy: RetentionPolicy) => void;
}> = ({ isOpen, onClose, policy, onSave }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<RetentionPolicy>(policy);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const toggleDocumentType = (typeId: string) => {
    setFormData((prev) => ({
      ...prev,
      documentTypes: prev.documentTypes.includes(typeId)
        ? prev.documentTypes.filter((t) => t !== typeId)
        : [...prev.documentTypes, typeId],
    }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Configurer la politique de rétention"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Nom de la politique"
            value={formData.name}
            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="Ex: Conservation légale"
            required
          />
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="number"
              label="Durée de rétention"
              value={formData.retentionPeriod.value}
              onChange={(e) => setFormData((prev) => ({
                ...prev,
                retentionPeriod: { ...prev.retentionPeriod, value: Number(e.target.value) },
              }))}
              min={1}
              required
            />
            <div>
              <label className="block text-sm font-medium text-[#1A1A2E] mb-1.5">Unité</label>
              <select
                value={formData.retentionPeriod.unit}
                onChange={(e) => setFormData((prev) => ({
                  ...prev,
                  retentionPeriod: {
                    ...prev.retentionPeriod,
                    unit: e.target.value as 'days' | 'months' | 'years',
                  },
                }))}
                className="w-full px-3 py-2.5 border border-[#E5E7EB] rounded-lg"
              >
                <option value="days">Jours</option>
                <option value="months">Mois</option>
                <option value="years">Années</option>
              </select>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#1A1A2E] mb-1.5">
            Description (optionnel)
          </label>
          <textarea
            value={formData.description || ''}
            onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="Description de cette politique..."
            className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg resize-none"
            rows={2}
          />
        </div>

        {/* Document Types */}
        <div>
          <label className="block text-sm font-medium text-[#1A1A2E] mb-2">
            Types de documents concernés
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {DOCUMENT_TYPES.map((type) => {
              const isSelected = formData.documentTypes.includes(type.id);
              return (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => toggleDocumentType(type.id)}
                  className={`
                    p-3 rounded-lg border-2 text-left transition-all
                    ${isSelected
                      ? 'border-[#1A1A2E] bg-[#F8FAFC]'
                      : 'border-[#E5E7EB] hover:border-[#1A1A2E]'
                    }
                  `}
                >
                  <p className="text-sm font-medium text-[#1A1A2E]">{type.name}</p>
                  <p className="text-xs text-[#6B7280] mt-0.5">
                    {type.defaultRetention.value} {type.defaultRetention.unit}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Auto Archive */}
        <div className="p-4 bg-[#F8FAFC] rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Archive size={18} className="text-[#1A1A2E]" />
              <span className="font-medium text-[#1A1A2E]">Archivage automatique</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.autoArchive}
                onChange={(e) => setFormData((prev) => ({ ...prev, autoArchive: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-advist-border peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#FBBF24] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-advist-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1A1A2E]"></div>
            </label>
          </div>
          {formData.autoArchive && (
            <Input
              type="number"
              label="Archiver après (jours d'inactivité)"
              value={formData.autoArchiveAfterDays}
              onChange={(e) => setFormData((prev) => ({ ...prev, autoArchiveAfterDays: Number(e.target.value) }))}
              min={1}
            />
          )}
        </div>

        {/* Auto Delete */}
        <div className="p-4 bg-advist-gold-light rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trash2 size={18} className="text-advist-error" />
              <span className="font-medium text-advist-error">Suppression automatique</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.autoDelete}
                onChange={(e) => setFormData((prev) => ({ ...prev, autoDelete: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-advist-border peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-advist-gold rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-advist-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-advist-error"></div>
            </label>
          </div>
          {formData.autoDelete && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="autoDeleteAfterRetention"
                checked={formData.autoDeleteAfterRetention}
                onChange={(e) => setFormData((prev) => ({ ...prev, autoDeleteAfterRetention: e.target.checked }))}
                className="w-4 h-4 rounded border-advist-gold text-advist-error"
              />
              <label htmlFor="autoDeleteAfterRetention" className="text-sm text-advist-error">
                Supprimer automatiquement après la période de rétention
              </label>
            </div>
          )}
        </div>

        {/* Legal Hold */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="legalHoldEnabled"
            checked={formData.legalHoldEnabled}
            onChange={(e) => setFormData((prev) => ({ ...prev, legalHoldEnabled: e.target.checked }))}
            className="w-4 h-4 rounded border-[#E5E7EB] text-[#1A1A2E]"
          />
          <label htmlFor="legalHoldEnabled" className="text-sm text-[#6B7280]">
            Activer la conservation légale (empêche la suppression)
          </label>
        </div>

        {/* Notifications */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="notifyBeforeDeletion"
              checked={formData.notifyBeforeDeletion}
              onChange={(e) => setFormData((prev) => ({ ...prev, notifyBeforeDeletion: e.target.checked }))}
              className="w-4 h-4 rounded border-[#E5E7EB] text-[#1A1A2E]"
            />
            <label htmlFor="notifyBeforeDeletion" className="text-sm text-[#6B7280]">
              Notifier avant suppression
            </label>
          </div>
          {formData.notifyBeforeDeletion && (
            <Input
              type="number"
              value={formData.notifyDaysBefore}
              onChange={(e) => setFormData((prev) => ({ ...prev, notifyDaysBefore: Number(e.target.value) }))}
              min={1}
              className="w-24"
              placeholder="30"
            />
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t border-[#E5E7EB]">
          <Button type="button" variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit">
            Enregistrer la politique
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default RetentionPolicies;
