import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { generateSecureId } from '../../utils/encryption';
import { supabase } from '../../lib/supabase';
import {
  Plus,
  Trash2,
  Edit2,
  Copy,
  ChevronDown,
  ChevronRight,
  GitBranch,
  DollarSign,
  Shield,
  FileText,
  Building2,
  Tag,
  Zap,
  User,
  AlertTriangle,
  Check,
  X,
  _Settings,
} from 'lucide-react';
import { Button, Card, Modal, Input, Badge } from '../ui';
import { useTenantStore } from '../../stores/tenantStore';

export interface ConditionalRule {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  priority: number;
  condition: RuleCondition;
  action: RuleAction;
}

export interface RuleCondition {
  type: 'amount' | 'confidentiality' | 'document_type' | 'department' | 'metadata';
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'in';
  value: string | number | string[];
  field?: string; // For metadata conditions
}

export interface RuleAction {
  type: 'add_step' | 'add_assignee' | 'skip_step' | 'escalate' | 'require_double_approval';
  config: {
    stepName?: string;
    stepType?: string;
    assigneeUserId?: number;
    assigneeRoleId?: number;
    stepToSkip?: number;
    escalationUserId?: number;
  };
}

export interface ConditionalRulesProps {
  rules: ConditionalRule[];
  onChange: (rules: ConditionalRule[]) => void;
  readOnly?: boolean;
}

// Condition type configurations
const CONDITION_TYPES = [
  {
    value: 'amount',
    label: 'Montant',
    icon: DollarSign,
    description: 'Basé sur le montant du document',
  },
  {
    value: 'confidentiality',
    label: 'Confidentialité',
    icon: Shield,
    description: 'Selon le niveau de confidentialité',
  },
  {
    value: 'document_type',
    label: 'Type de document',
    icon: FileText,
    description: 'Selon la catégorie du document',
  },
  {
    value: 'department',
    label: 'Département',
    icon: Building2,
    description: 'Selon le département concerné',
  },
  {
    value: 'metadata',
    label: 'Métadonnée',
    icon: Tag,
    description: 'Basé sur une métadonnée personnalisée',
  },
];

const OPERATORS = {
  amount: [
    { value: 'equals', label: 'Égal à' },
    { value: 'not_equals', label: 'Différent de' },
    { value: 'greater_than', label: 'Supérieur à' },
    { value: 'less_than', label: 'Inférieur à' },
  ],
  confidentiality: [
    { value: 'equals', label: 'Est' },
    { value: 'not_equals', label: "N'est pas" },
    { value: 'in', label: 'Parmi' },
  ],
  document_type: [
    { value: 'equals', label: 'Est' },
    { value: 'not_equals', label: "N'est pas" },
    { value: 'in', label: 'Parmi' },
  ],
  department: [
    { value: 'equals', label: 'Est' },
    { value: 'not_equals', label: "N'est pas" },
    { value: 'in', label: 'Parmi' },
  ],
  metadata: [
    { value: 'equals', label: 'Égal à' },
    { value: 'not_equals', label: 'Différent de' },
    { value: 'contains', label: 'Contient' },
  ],
};

const CONFIDENTIALITY_LEVELS = [
  { value: 'public', label: 'Public' },
  { value: 'internal', label: 'Interne' },
  { value: 'confidential', label: 'Confidentiel' },
  { value: 'secret', label: 'Secret' },
];

const ACTION_TYPES = [
  {
    value: 'add_step',
    label: 'Ajouter une étape',
    icon: Plus,
    description: 'Ajoute une étape supplémentaire au workflow',
  },
  {
    value: 'add_assignee',
    label: 'Ajouter un validateur',
    icon: User,
    description: 'Ajoute un validateur supplémentaire',
  },
  {
    value: 'skip_step',
    label: 'Ignorer une étape',
    icon: X,
    description: 'Saute une étape du workflow',
  },
  {
    value: 'escalate',
    label: 'Escalader',
    icon: AlertTriangle,
    description: 'Escalade vers un responsable',
  },
  {
    value: 'require_double_approval',
    label: 'Double validation',
    icon: Check,
    description: 'Requiert une double approbation',
  },
];

export const ConditionalRules: React.FC<ConditionalRulesProps> = ({
  rules,
  onChange,
  readOnly = false,
}) => {
  const { t } = useTranslation();
  const checkFeature = useTenantStore((s) => s.checkFeature);
  const allowed = checkFeature('conditionalRules');
  const [selectedRule, setSelectedRule] = useState<ConditionalRule | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [expandedRules, setExpandedRules] = useState<string[]>([]);

  const [availableUsers, setAvailableUsers] = useState<Array<{ id: number; name: string }>>([]);
  const [_availableRoles, setAvailableRoles] = useState<Array<{ id: number; name: string }>>([]);
  const [availableDocTypes, setAvailableDocTypes] = useState<Array<{ id: number; name: string }>>(
    []
  );
  const [availableDepartments, setAvailableDepartments] = useState<
    Array<{ id: number; name: string }>
  >([]);

  useEffect(() => {
    const loadData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();
      if (!profile) return;
      const orgId = profile.organization_id;

      const [usersRes, rolesRes, docTypesRes, deptsRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .eq('organization_id', orgId)
          .eq('is_active', true),
        supabase.from('roles').select('id, name').eq('organization_id', orgId),
        supabase.from('document_types').select('id, name').eq('organization_id', orgId),
        supabase.from('departments').select('id, name').eq('organization_id', orgId),
      ]);
      setAvailableUsers(
        (usersRes.data || []).map((u) => ({
          id: Number(u.id) || u.id,
          name: `${u.first_name} ${u.last_name}`,
        })) as Array<{ id: number; name: string }>
      );
      setAvailableRoles(
        (rolesRes.data || []).map((r) => ({ id: Number(r.id) || r.id, name: r.name })) as Array<{
          id: number;
          name: string;
        }>
      );
      setAvailableDocTypes(
        (docTypesRes.data || []).map((d) => ({ id: Number(d.id) || d.id, name: d.name })) as Array<{
          id: number;
          name: string;
        }>
      );
      setAvailableDepartments(
        (deptsRes.data || []).map((d) => ({ id: Number(d.id) || d.id, name: d.name })) as Array<{
          id: number;
          name: string;
        }>
      );
    };
    loadData();
  }, []);

  const generateId = () => generateSecureId('rule');

  const toggleRuleExpand = (ruleId: string) => {
    setExpandedRules((prev) =>
      prev.includes(ruleId) ? prev.filter((id) => id !== ruleId) : [...prev, ruleId]
    );
  };

  const handleAddRule = () => {
    const newRule: ConditionalRule = {
      id: generateId(),
      name: 'Nouvelle règle',
      isActive: true,
      priority: rules.length + 1,
      condition: {
        type: 'amount',
        operator: 'greater_than',
        value: 1000000,
      },
      action: {
        type: 'add_step',
        config: {},
      },
    };
    setSelectedRule(newRule);
    setShowEditModal(true);
  };

  const handleEditRule = (rule: ConditionalRule) => {
    if (readOnly) return;
    setSelectedRule({ ...rule });
    setShowEditModal(true);
  };

  const handleDeleteRule = (ruleId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette règle ?')) {
      onChange(rules.filter((r) => r.id !== ruleId));
    }
  };

  const handleDuplicateRule = (rule: ConditionalRule) => {
    const newRule: ConditionalRule = {
      ...rule,
      id: generateId(),
      name: `${rule.name} (copie)`,
      priority: rules.length + 1,
    };
    onChange([...rules, newRule]);
  };

  const handleToggleActive = (ruleId: string) => {
    onChange(rules.map((r) => (r.id === ruleId ? { ...r, isActive: !r.isActive } : r)));
  };

  const handleSaveRule = (rule: ConditionalRule) => {
    const existingIndex = rules.findIndex((r) => r.id === rule.id);
    if (existingIndex >= 0) {
      const newRules = [...rules];
      newRules[existingIndex] = rule;
      onChange(newRules);
    } else {
      onChange([...rules, rule]);
    }
    setShowEditModal(false);
    setSelectedRule(null);
  };

  const getConditionTypeConfig = (type: string) => {
    return CONDITION_TYPES.find((t) => t.value === type) || CONDITION_TYPES[0];
  };

  const getActionTypeConfig = (type: string) => {
    return ACTION_TYPES.find((t) => t.value === type) || ACTION_TYPES[0];
  };

  const formatConditionValue = (condition: RuleCondition) => {
    switch (condition.type) {
      case 'amount':
        return `${Number(condition.value).toLocaleString()} FCFA`;
      case 'confidentiality': {
        const level = CONFIDENTIALITY_LEVELS.find((l) => l.value === condition.value);
        return level?.label || condition.value;
      }
      case 'document_type': {
        const docType = availableDocTypes.find((d) => d.id === Number(condition.value));
        return docType?.name || condition.value;
      }
      case 'department': {
        const dept = availableDepartments.find((d) => d.id === Number(condition.value));
        return dept?.name || condition.value;
      }
      default:
        return String(condition.value);
    }
  };

  const formatOperator = (operator: string) => {
    const ops: Record<string, string> = {
      equals: '=',
      not_equals: '≠',
      greater_than: '>',
      less_than: '<',
      contains: '∋',
      in: '∈',
    };
    return ops[operator] || operator;
  };

  if (!allowed) {
    return (
      <div className="p-6 text-center bg-advist-surface-dark rounded-xl border border-advist-border">
        <p className="text-advist-text-secondary">
          Cette fonctionnalité n'est pas disponible dans votre plan actuel.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap size={20} className="text-[#1A1A2E]" />
          <h3 className="font-semibold text-[#1A1A2E]">
            {t('workflows.conditionalRules', 'Règles conditionnelles')}
          </h3>
          <Badge variant="gray" size="sm">
            {rules.length} règle(s)
          </Badge>
        </div>
        {!readOnly && (
          <Button size="sm" onClick={handleAddRule}>
            <Plus size={14} className="mr-1" />
            Ajouter une règle
          </Button>
        )}
      </div>

      {/* Rules List */}
      {rules.length > 0 ? (
        <div className="space-y-3">
          {rules.map((rule) => {
            const conditionConfig = getConditionTypeConfig(rule.condition.type);
            const actionConfig = getActionTypeConfig(rule.action.type);
            const ConditionIcon = conditionConfig.icon;
            const ActionIcon = actionConfig.icon;
            const isExpanded = expandedRules.includes(rule.id);

            return (
              <Card
                key={rule.id}
                className={`overflow-hidden transition-all ${!rule.isActive ? 'opacity-60' : ''}`}
              >
                {/* Rule Header */}
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-[#F8FAFC]"
                  onClick={() => toggleRuleExpand(rule.id)}
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <ChevronDown size={16} className="text-[#6B7280]" />
                    ) : (
                      <ChevronRight size={16} className="text-[#6B7280]" />
                    )}
                    <div
                      className={`w-2 h-2 rounded-full ${rule.isActive ? 'bg-advist-success' : 'bg-advist-surface-dark'}`}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-[#1A1A2E]">{rule.name}</h4>
                        <Badge variant="gray" size="sm">
                          Priorité {rule.priority}
                        </Badge>
                      </div>
                      {rule.description && (
                        <p className="text-sm text-[#6B7280]">{rule.description}</p>
                      )}
                    </div>
                  </div>

                  {!readOnly && (
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleToggleActive(rule.id)}
                        className={`px-2 py-1 text-xs rounded ${
                          rule.isActive
                            ? 'bg-green-50 text-advist-success'
                            : 'bg-advist-surface-dark text-advist-text-secondary'
                        }`}
                      >
                        {rule.isActive ? 'Actif' : 'Inactif'}
                      </button>
                      <button
                        onClick={() => handleEditRule(rule)}
                        className="p-1.5 rounded hover:bg-[#F1F5F9]"
                        title="Modifier"
                      >
                        <Edit2 size={14} className="text-[#6B7280]" />
                      </button>
                      <button
                        onClick={() => handleDuplicateRule(rule)}
                        className="p-1.5 rounded hover:bg-[#F1F5F9]"
                        title="Dupliquer"
                      >
                        <Copy size={14} className="text-[#6B7280]" />
                      </button>
                      <button
                        onClick={() => handleDeleteRule(rule.id)}
                        className="p-1.5 rounded hover:bg-advist-gold-light"
                        title="Supprimer"
                      >
                        <Trash2 size={14} className="text-advist-error" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Rule Details */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 border-t border-[#E5E7EB]">
                    <div className="flex flex-col md:flex-row gap-4">
                      {/* Condition */}
                      <div className="flex-1 p-3 bg-advist-gold-light rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <ConditionIcon size={16} className="text-advist-gray900" />
                          <span className="text-sm font-medium text-advist-gray900">SI</span>
                        </div>
                        <div className="text-sm text-advist-gray900">
                          <span className="font-medium">{conditionConfig.label}</span>
                          <span className="mx-2 px-2 py-0.5 bg-advist-surface-dark rounded">
                            {formatOperator(rule.condition.operator)}
                          </span>
                          <span className="font-semibold">
                            {formatConditionValue(rule.condition)}
                          </span>
                        </div>
                      </div>

                      {/* Arrow */}
                      <div className="flex items-center justify-center">
                        <GitBranch size={20} className="text-[#6B7280] rotate-90 md:rotate-0" />
                      </div>

                      {/* Action */}
                      <div className="flex-1 p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <ActionIcon size={16} className="text-advist-success" />
                          <span className="text-sm font-medium text-advist-success">ALORS</span>
                        </div>
                        <div className="text-sm text-advist-success">
                          <span className="font-medium">{actionConfig.label}</span>
                          {rule.action.config.stepName && (
                            <span className="ml-2">: {rule.action.config.stepName}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="p-8 text-center">
          <Zap size={40} className="mx-auto text-[#6B7280] mb-3" />
          <h4 className="font-medium text-[#1A1A2E]">Aucune règle conditionnelle</h4>
          <p className="text-sm text-[#6B7280] mt-1 mb-4">
            Les règles conditionnelles permettent d'adapter automatiquement le workflow selon les
            caractéristiques du document
          </p>
          {!readOnly && (
            <Button size="sm" onClick={handleAddRule}>
              <Plus size={14} className="mr-1" />
              Créer une règle
            </Button>
          )}
        </Card>
      )}

      {/* Edit Modal */}
      {selectedRule && (
        <RuleEditModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedRule(null);
          }}
          rule={selectedRule}
          onSave={handleSaveRule}
          availableUsers={availableUsers}
          availableDocTypes={availableDocTypes}
          availableDepartments={availableDepartments}
        />
      )}
    </div>
  );
};

// Rule Edit Modal
const RuleEditModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  rule: ConditionalRule;
  onSave: (rule: ConditionalRule) => void;
  availableUsers: Array<{ id: number; name: string }>;
  availableDocTypes: Array<{ id: number; name: string }>;
  availableDepartments: Array<{ id: number; name: string }>;
}> = ({
  isOpen,
  onClose,
  rule,
  onSave,
  availableUsers,
  availableDocTypes,
  availableDepartments,
}) => {
  const { _t } = useTranslation();
  const [formData, setFormData] = useState<ConditionalRule>(rule);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const operators =
    OPERATORS[formData.condition.type as keyof typeof OPERATORS] || OPERATORS.amount;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Configurer la règle conditionnelle" size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Nom de la règle"
            value={formData.name}
            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="Ex: Validation DG si montant > 10M"
            required
          />
          <Input
            type="number"
            label="Priorité"
            value={formData.priority}
            onChange={(e) => setFormData((prev) => ({ ...prev, priority: Number(e.target.value) }))}
            min={1}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#1A1A2E] mb-1.5">
            Description (optionnel)
          </label>
          <textarea
            value={formData.description || ''}
            onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="Description de cette règle..."
            className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:ring-2 focus:ring-[#FBBF24] resize-none"
            rows={2}
          />
        </div>

        {/* Condition */}
        <div className="p-4 bg-advist-gold-light rounded-lg space-y-4">
          <h4 className="font-medium text-advist-gray900">Condition (SI...)</h4>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-advist-gray900 mb-1.5">
                Type de condition
              </label>
              <select
                value={formData.condition.type}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    condition: {
                      ...prev.condition,
                      type: e.target.value as RuleCondition['type'],
                      value: '',
                    },
                  }))
                }
                className="w-full px-3 py-2 border border-advist-gold rounded-lg focus:ring-2 focus:ring-primary-500 bg-white"
              >
                {CONDITION_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-advist-gray900 mb-1.5">
                Opérateur
              </label>
              <select
                value={formData.condition.operator}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    condition: {
                      ...prev.condition,
                      operator: e.target.value as RuleCondition['operator'],
                    },
                  }))
                }
                className="w-full px-3 py-2 border border-advist-gold rounded-lg focus:ring-2 focus:ring-primary-500 bg-white"
              >
                {operators.map((op) => (
                  <option key={op.value} value={op.value}>
                    {op.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-advist-gray900 mb-1.5">Valeur</label>
              {formData.condition.type === 'amount' ? (
                <Input
                  type="number"
                  value={formData.condition.value as number}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      condition: { ...prev.condition, value: Number(e.target.value) },
                    }))
                  }
                  placeholder="1000000"
                />
              ) : formData.condition.type === 'confidentiality' ? (
                <select
                  value={formData.condition.value as string}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      condition: { ...prev.condition, value: e.target.value },
                    }))
                  }
                  className="w-full px-3 py-2 border border-advist-gold rounded-lg focus:ring-2 focus:ring-primary-500 bg-white"
                >
                  <option value="">Sélectionner...</option>
                  {CONFIDENTIALITY_LEVELS.map((level) => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
              ) : formData.condition.type === 'document_type' ? (
                <select
                  value={formData.condition.value as string}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      condition: { ...prev.condition, value: e.target.value },
                    }))
                  }
                  className="w-full px-3 py-2 border border-advist-gold rounded-lg focus:ring-2 focus:ring-primary-500 bg-white"
                >
                  <option value="">Sélectionner...</option>
                  {availableDocTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              ) : formData.condition.type === 'department' ? (
                <select
                  value={formData.condition.value as string}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      condition: { ...prev.condition, value: e.target.value },
                    }))
                  }
                  className="w-full px-3 py-2 border border-advist-gold rounded-lg focus:ring-2 focus:ring-primary-500 bg-white"
                >
                  <option value="">Sélectionner...</option>
                  {availableDepartments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              ) : (
                <Input
                  value={formData.condition.value as string}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      condition: { ...prev.condition, value: e.target.value },
                    }))
                  }
                  placeholder="Valeur..."
                />
              )}
            </div>
          </div>
        </div>

        {/* Action */}
        <div className="p-4 bg-green-50 rounded-lg space-y-4">
          <h4 className="font-medium text-advist-success">Action (ALORS...)</h4>

          <div>
            <label className="block text-sm font-medium text-advist-success mb-1.5">
              Type d'action
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {ACTION_TYPES.map((action) => {
                const Icon = action.icon;
                const isSelected = formData.action.type === action.value;
                return (
                  <button
                    key={action.value}
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        action: { type: action.value as RuleAction['type'], config: {} },
                      }))
                    }
                    className={`
                      flex items-center gap-2 p-3 rounded-lg border-2 transition-all text-left
                      ${
                        isSelected
                          ? 'border-advist-success bg-white'
                          : 'border-advist-success hover:border-advist-success bg-white/50'
                      }
                    `}
                  >
                    <Icon
                      size={18}
                      className={isSelected ? 'text-advist-success' : 'text-advist-success'}
                    />
                    <div>
                      <p className="text-sm font-medium text-advist-success">{action.label}</p>
                      <p className="text-xs text-advist-success">{action.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action specific config */}
          {formData.action.type === 'add_step' && (
            <Input
              label="Nom de l'étape à ajouter"
              value={formData.action.config.stepName || ''}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  action: {
                    ...prev.action,
                    config: { ...prev.action.config, stepName: e.target.value },
                  },
                }))
              }
              placeholder="Ex: Validation Direction Générale"
            />
          )}

          {(formData.action.type === 'add_assignee' || formData.action.type === 'escalate') && (
            <div>
              <label className="block text-sm font-medium text-advist-success mb-1.5">
                Utilisateur
              </label>
              <select
                value={formData.action.config.assigneeUserId || ''}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    action: {
                      ...prev.action,
                      config: { ...prev.action.config, assigneeUserId: Number(e.target.value) },
                    },
                  }))
                }
                className="w-full px-3 py-2 border border-advist-success rounded-lg focus:ring-2 focus:ring-green-500 bg-white"
              >
                <option value="">Sélectionner...</option>
                {availableUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Active toggle */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isActive"
            checked={formData.isActive}
            onChange={(e) => setFormData((prev) => ({ ...prev, isActive: e.target.checked }))}
            className="w-4 h-4 rounded border-[#E5E7EB] text-[#1A1A2E]"
          />
          <label htmlFor="isActive" className="text-sm text-[#6B7280]">
            Règle active
          </label>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t border-[#E5E7EB]">
          <Button type="button" variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit">Enregistrer la règle</Button>
        </div>
      </form>
    </Modal>
  );
};

export default ConditionalRules;
