import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { generateSecureId } from '../../utils/encryption';
import { supabase } from '../../lib/supabase';
import {
  Plus,
  Trash2,
  GripVertical,
  User,
  Users,
  Building2,
  CheckCircle,
  PenTool,
  Eye,
  _MessageSquare,
  GitBranch,
  ArrowDown,
  ArrowRight,
  _Settings,
  Copy,
  X,
  _ChevronDown,
  Clock,
  Zap,
  Shield,
  _AlertTriangle,
  Mail,
  UserPlus,
  RefreshCw,
  _Phone,
} from 'lucide-react';
import { Button, Modal, Input, Badge } from '../ui';

export interface ExternalAssignee {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  company?: string;
  phone?: string;
}

export interface BackupAssignee {
  type: 'user' | 'external';
  userId?: number;
  userName?: string;
  external?: ExternalAssignee;
}

export interface WorkflowStep {
  id: string;
  order: number;
  name: string;
  type: 'consultation' | 'validation' | 'approval' | 'signature' | 'paraph';
  assigneeType: 'user' | 'role' | 'department';
  assigneeId: number;
  assigneeName?: string;
  assignees?: Array<{ id: number; name: string; type: 'user' | 'role' | 'department' }>;
  externalAssignees?: ExternalAssignee[];
  backupAssignee?: BackupAssignee;
  validationRule: 'all' | 'any' | 'majority';
  deadlineDays?: number;
  canDelegate: boolean;
  signatureMode: 'sequential' | 'parallel' | 'mixed';
  parallelGroup?: number;
  requiresParaphAllPages?: boolean;
  description?: string;
  isRequired?: boolean;
  reminderDays?: number;
}

export interface WorkflowEditorProps {
  steps: WorkflowStep[];
  onChange: (steps: WorkflowStep[]) => void;
  onSave?: () => void;
  readOnly?: boolean;
}

const STEP_TYPES = [
  {
    value: 'consultation',
    label: 'Consultation',
    icon: Eye,
    color: 'bg-advist-surface-dark text-advist-gray900',
    description: 'Pour information uniquement',
  },
  {
    value: 'validation',
    label: 'Validation',
    icon: CheckCircle,
    color: 'bg-green-50 text-advist-success',
    description: 'Approuve ou rejette',
  },
  {
    value: 'approval',
    label: 'Approbation',
    icon: CheckCircle,
    color: 'bg-green-50 text-advist-success',
    description: 'Approbation formelle',
  },
  {
    value: 'signature',
    label: 'Signature',
    icon: PenTool,
    color: 'bg-advist-gold-light text-advist-gray900',
    description: 'Signature electronique',
  },
  {
    value: 'paraph',
    label: 'Paraphe',
    icon: PenTool,
    color: 'bg-advist-gold-light text-advist-gold-dark',
    description: 'Paraphe sur chaque page',
  },
];

export const WorkflowEditor: React.FC<WorkflowEditorProps> = ({
  steps,
  onChange,
  _onSave,
  readOnly = false,
}) => {
  const { _t } = useTranslation();
  const [selectedStep, setSelectedStep] = useState<WorkflowStep | null>(null);
  const [showStepModal, setShowStepModal] = useState(false);
  const [draggedStep, setDraggedStep] = useState<string | null>(null);
  const [showAddStepMenu, setShowAddStepMenu] = useState(false);

  const [availableUsers, setAvailableUsers] = useState<
    Array<{ id: number; name: string; role: string }>
  >([]);
  const [availableRoles, setAvailableRoles] = useState<Array<{ id: number; name: string }>>([]);
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

      const [usersRes, rolesRes, deptsRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, first_name, last_name, email, role')
          .eq('organization_id', orgId)
          .eq('is_active', true),
        supabase.from('roles').select('id, name').eq('organization_id', orgId),
        supabase.from('departments').select('id, name').eq('organization_id', orgId),
      ]);
      setAvailableUsers(
        (usersRes.data || []).map((u) => ({
          id: Number(u.id) || u.id,
          name: `${u.first_name} ${u.last_name}`,
          role: u.role || '',
        })) as Array<{ id: number; name: string; role: string }>
      );
      setAvailableRoles(
        (rolesRes.data || []).map((r) => ({ id: Number(r.id) || r.id, name: r.name })) as Array<{
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

  // Generate unique ID
  const generateId = () => generateSecureId('step');

  // Add new step
  const handleAddStep = (type: WorkflowStep['type']) => {
    const typeConfig = STEP_TYPES.find((t) => t.value === type);
    const newStep: WorkflowStep = {
      id: generateId(),
      order: steps.length + 1,
      name: typeConfig?.label || 'Nouvelle etape',
      type,
      assigneeType: 'user',
      assigneeId: 0,
      assignees: [],
      validationRule: 'all',
      deadlineDays: 3,
      canDelegate: type !== 'signature' && type !== 'paraph',
      signatureMode: 'sequential',
      isRequired: true,
      requiresParaphAllPages: type === 'paraph',
    };

    setSelectedStep(newStep);
    setShowStepModal(true);
    setShowAddStepMenu(false);
  };

  // Edit step
  const handleEditStep = (step: WorkflowStep) => {
    if (readOnly) return;
    setSelectedStep({ ...step });
    setShowStepModal(true);
  };

  // Delete step
  const handleDeleteStep = (stepId: string) => {
    const newSteps = steps
      .filter((s) => s.id !== stepId)
      .map((s, index) => ({ ...s, order: index + 1 }));
    onChange(newSteps);
  };

  // Duplicate step
  const handleDuplicateStep = (step: WorkflowStep) => {
    const newStep: WorkflowStep = {
      ...step,
      id: generateId(),
      name: `${step.name} (copie)`,
      order: steps.length + 1,
    };
    onChange([...steps, newStep]);
  };

  // Save step
  const handleSaveStep = (step: WorkflowStep) => {
    const existingIndex = steps.findIndex((s) => s.id === step.id);
    if (existingIndex >= 0) {
      const newSteps = [...steps];
      newSteps[existingIndex] = step;
      onChange(newSteps);
    } else {
      onChange([...steps, step]);
    }
    setShowStepModal(false);
    setSelectedStep(null);
  };

  // Drag and drop handlers
  const handleDragStart = (stepId: string) => {
    setDraggedStep(stepId);
  };

  const handleDragOver = (e: React.DragEvent, targetStepId: string) => {
    e.preventDefault();
    if (!draggedStep || draggedStep === targetStepId) return;
  };

  const handleDrop = (targetStepId: string) => {
    if (!draggedStep || draggedStep === targetStepId) return;

    const draggedIndex = steps.findIndex((s) => s.id === draggedStep);
    const targetIndex = steps.findIndex((s) => s.id === targetStepId);

    const newSteps = [...steps];
    const [removed] = newSteps.splice(draggedIndex, 1);
    newSteps.splice(targetIndex, 0, removed);

    // Update order numbers
    onChange(newSteps.map((s, index) => ({ ...s, order: index + 1 })));
    setDraggedStep(null);
  };

  const getStepTypeConfig = (type: string) => {
    return STEP_TYPES.find((t) => t.value === type) || STEP_TYPES[0];
  };

  const getAssigneeName = (step: WorkflowStep) => {
    if (step.assigneeName) return step.assigneeName;

    switch (step.assigneeType) {
      case 'user':
        return availableUsers.find((u) => u.id === step.assigneeId)?.name || 'Non assigné';
      case 'role':
        return availableRoles.find((r) => r.id === step.assigneeId)?.name || 'Non assigné';
      case 'department':
        return availableDepartments.find((d) => d.id === step.assigneeId)?.name || 'Non assigné';
      default:
        return 'Non assigné';
    }
  };

  return (
    <div className="space-y-4">
      {/* Workflow Canvas */}
      <div className="relative min-h-[400px] p-6 bg-[#F8FAFC] rounded-xl border-2 border-dashed border-[#E5E7EB]">
        {/* Start Node */}
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 bg-advist-success rounded-full flex items-center justify-center text-white shadow-lg">
            <Zap size={24} />
          </div>
          <p className="text-sm font-medium text-[#1A1A2E] mt-2">Début</p>
          {steps.length > 0 && <div className="w-0.5 h-8 bg-[#E5E7EB] mt-2" />}
        </div>

        {/* Steps */}
        <div className="mt-4 space-y-4">
          {steps.map((step, index) => {
            const typeConfig = getStepTypeConfig(step.type);
            const Icon = typeConfig.icon;
            const isDragging = draggedStep === step.id;

            return (
              <div key={step.id} className="flex flex-col items-center">
                {/* Step Card */}
                <div
                  draggable={!readOnly}
                  onDragStart={() => handleDragStart(step.id)}
                  onDragOver={(e) => handleDragOver(e, step.id)}
                  onDrop={() => handleDrop(step.id)}
                  className={`
                    w-full max-w-md bg-white rounded-xl border-2 transition-all cursor-pointer
                    ${isDragging ? 'opacity-50 border-dashed' : 'border-[#E5E7EB]'}
                    ${!readOnly ? 'hover:border-[#1A1A2E] hover:shadow-lg' : ''}
                  `}
                  onClick={() => handleEditStep(step)}
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        {!readOnly && (
                          <div className="mt-1 cursor-grab">
                            <GripVertical size={16} className="text-[#6B7280]" />
                          </div>
                        )}
                        <div className={`p-2 rounded-lg ${typeConfig.color}`}>
                          <Icon size={20} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-[#1A1A2E]">{step.name}</h4>
                            <Badge variant="gray" size="sm">
                              Étape {step.order}
                            </Badge>
                          </div>
                          <p className="text-sm text-[#6B7280] mt-1">{typeConfig.label}</p>
                        </div>
                      </div>

                      {!readOnly && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDuplicateStep(step);
                            }}
                            className="p-1.5 rounded hover:bg-[#F1F5F9]"
                            title="Dupliquer"
                          >
                            <Copy size={14} className="text-[#6B7280]" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteStep(step.id);
                            }}
                            className="p-1.5 rounded hover:bg-advist-gold-light"
                            title="Supprimer"
                          >
                            <Trash2 size={14} className="text-advist-error" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Step Details */}
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      {/* Assignee */}
                      <div className="flex items-center gap-1.5 px-2 py-1 bg-[#F1F5F9] rounded text-sm">
                        {step.assigneeType === 'user' && <User size={14} />}
                        {step.assigneeType === 'role' && <Shield size={14} />}
                        {step.assigneeType === 'department' && <Building2 size={14} />}
                        <span className="text-[#6B7280]">{getAssigneeName(step)}</span>
                      </div>

                      {/* Deadline */}
                      {step.deadlineDays && (
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-[#F1F5F9] rounded text-sm">
                          <Clock size={14} />
                          <span className="text-[#6B7280]">{step.deadlineDays}j</span>
                        </div>
                      )}

                      {/* Validation Rule */}
                      <div className="flex items-center gap-1.5 px-2 py-1 bg-[#F1F5F9] rounded text-sm">
                        <Users size={14} />
                        <span className="text-[#6B7280]">
                          {step.validationRule === 'all' && 'Tous'}
                          {step.validationRule === 'any' && 'Un seul'}
                          {step.validationRule === 'majority' && 'Majorité'}
                        </span>
                      </div>

                      {/* Signature Mode */}
                      {(step.type === 'signature' || step.type === 'paraph') && (
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-advist-gold-light rounded text-sm">
                          <GitBranch size={14} className="text-advist-gray900" />
                          <span className="text-advist-gray900">
                            {step.signatureMode === 'sequential' && 'Séquentiel'}
                            {step.signatureMode === 'parallel' && 'Parallèle'}
                            {step.signatureMode === 'mixed' && 'Mixte'}
                          </span>
                        </div>
                      )}

                      {/* Delegation */}
                      {step.canDelegate && (
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-green-50 rounded text-sm">
                          <ArrowRight size={14} className="text-advist-success" />
                          <span className="text-advist-success">Délégation</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Connector */}
                {index < steps.length - 1 && (
                  <div className="flex flex-col items-center">
                    <div className="w-0.5 h-4 bg-[#E5E7EB]" />
                    <ArrowDown size={16} className="text-[#6B7280]" />
                    <div className="w-0.5 h-4 bg-[#E5E7EB]" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Add Step Button */}
        {!readOnly && (
          <div className="flex flex-col items-center mt-6">
            {steps.length > 0 && <div className="w-0.5 h-8 bg-[#E5E7EB]" />}
            <div className="relative">
              <Button
                variant="outline"
                onClick={() => setShowAddStepMenu(!showAddStepMenu)}
                className="rounded-full"
              >
                <Plus size={16} className="mr-2" />
                Ajouter une étape
              </Button>

              {showAddStepMenu && (
                <>
                  <div className="fixed inset-0" onClick={() => setShowAddStepMenu(false)} />
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-56 bg-white rounded-xl shadow-lg border border-[#E5E7EB] py-2 z-10">
                    {STEP_TYPES.map((type) => {
                      const Icon = type.icon;
                      return (
                        <button
                          key={type.value}
                          onClick={() => handleAddStep(type.value as WorkflowStep['type'])}
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#F8FAFC] transition-colors"
                        >
                          <div className={`p-1.5 rounded-lg ${type.color}`}>
                            <Icon size={16} />
                          </div>
                          <span className="text-sm font-medium text-[#1A1A2E]">{type.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* End Node */}
        {steps.length > 0 && (
          <div className="flex flex-col items-center mt-6">
            <div className="w-0.5 h-8 bg-[#E5E7EB]" />
            <div className="w-12 h-12 bg-advist-error rounded-full flex items-center justify-center text-white shadow-lg">
              <CheckCircle size={24} />
            </div>
            <p className="text-sm font-medium text-[#1A1A2E] mt-2">Fin</p>
          </div>
        )}

        {/* Empty State */}
        {steps.length === 0 && !showAddStepMenu && (
          <div className="text-center py-12">
            <GitBranch size={48} className="mx-auto text-[#6B7280] mb-4" />
            <h3 className="text-lg font-medium text-[#1A1A2E]">Aucune étape</h3>
            <p className="text-[#6B7280] mt-1 mb-4">Ajoutez des étapes pour créer votre workflow</p>
          </div>
        )}
      </div>

      {/* Step Edit Modal */}
      {selectedStep && (
        <StepEditModal
          isOpen={showStepModal}
          onClose={() => {
            setShowStepModal(false);
            setSelectedStep(null);
          }}
          step={selectedStep}
          onSave={handleSaveStep}
          availableUsers={availableUsers}
          availableRoles={availableRoles}
          availableDepartments={availableDepartments}
        />
      )}
    </div>
  );
};

// External Person Form Component
const ExternalPersonForm: React.FC<{
  onAdd: (person: ExternalAssignee) => void;
}> = ({ onAdd }) => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    phone: '',
  });

  const handleSubmit = () => {
    if (!formData.email || !formData.firstName || !formData.lastName) return;

    onAdd({
      id: generateSecureId('ext'),
      ...formData,
    });

    setFormData({ firstName: '', lastName: '', email: '', company: '', phone: '' });
    setShowForm(false);
  };

  if (!showForm) {
    return (
      <button
        type="button"
        onClick={() => setShowForm(true)}
        className="w-full flex items-center justify-center gap-2 px-3 py-2.5 border-2 border-dashed border-[#E5E7EB] rounded-lg text-sm text-[#6B7280] hover:border-[#1A1A2E] hover:text-[#1A1A2E] transition-colors"
      >
        <UserPlus size={16} />
        Ajouter une personne externe
      </button>
    );
  }

  return (
    <div className="p-3 bg-white rounded-lg border border-[#E5E7EB] space-y-3">
      <div className="flex items-center justify-between">
        <h5 className="text-sm font-medium text-[#1A1A2E]">Nouvelle personne externe</h5>
        <button
          type="button"
          onClick={() => setShowForm(false)}
          className="p-1 hover:bg-[#F8FAFC] rounded"
        >
          <X size={14} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Input
          placeholder="Prénom *"
          value={formData.firstName}
          onChange={(e) => setFormData((prev) => ({ ...prev, firstName: e.target.value }))}
        />
        <Input
          placeholder="Nom *"
          value={formData.lastName}
          onChange={(e) => setFormData((prev) => ({ ...prev, lastName: e.target.value }))}
        />
      </div>

      <Input
        type="email"
        placeholder="Adresse email *"
        value={formData.email}
        onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
      />

      <div className="grid grid-cols-2 gap-2">
        <Input
          placeholder="Société (optionnel)"
          value={formData.company}
          onChange={(e) => setFormData((prev) => ({ ...prev, company: e.target.value }))}
        />
        <Input
          placeholder="Téléphone (optionnel)"
          value={formData.phone}
          onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>
          Annuler
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={handleSubmit}
          disabled={!formData.email || !formData.firstName || !formData.lastName}
        >
          <Plus size={14} className="mr-1" />
          Ajouter
        </Button>
      </div>
    </div>
  );
};

// Step Edit Modal
const StepEditModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  step: WorkflowStep;
  onSave: (step: WorkflowStep) => void;
  availableUsers: Array<{ id: number; name: string; role: string }>;
  availableRoles: Array<{ id: number; name: string }>;
  availableDepartments: Array<{ id: number; name: string }>;
}> = ({ isOpen, onClose, step, onSave, availableUsers, availableRoles, availableDepartments }) => {
  const { _t } = useTranslation();
  const [formData, setFormData] = useState<WorkflowStep>(step);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const _typeConfig = STEP_TYPES.find((t) => t.value === formData.type);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Configurer l'étape: ${formData.name}`}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step Type - Role Selection */}
        <div>
          <label className="block text-sm font-medium text-[#1A1A2E] mb-2">
            Role de l'intervenant
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {STEP_TYPES.map((type) => {
              const Icon = type.icon;
              const isSelected = formData.type === type.value;
              return (
                <button
                  key={type.value}
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, type: type.value as WorkflowStep['type'] }))
                  }
                  className={`
                    flex items-start gap-3 p-3 rounded-lg border-2 transition-all text-left
                    ${isSelected ? 'border-[#1A1A2E] bg-[#F8FAFC]' : 'border-[#E5E7EB] hover:border-[#1A1A2E]'}
                  `}
                >
                  <div className={`p-2 rounded-lg ${type.color} flex-shrink-0`}>
                    <Icon size={18} />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-[#1A1A2E] block">{type.label}</span>
                    <span className="text-xs text-[#6B7280]">{type.description}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step Name */}
        <Input
          label="Nom de l'étape"
          value={formData.name}
          onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
          placeholder="Ex: Validation Direction"
          required
        />

        {/* Intervenants Section */}
        <div className="p-4 bg-advist-surface-dark rounded-lg space-y-4">
          <h4 className="font-medium text-[#1A1A2E] flex items-center gap-2">
            <Users size={16} />
            Intervenants
          </h4>

          {/* Assignee Type Selection */}
          <div>
            <label className="block text-sm font-medium text-[#1A1A2E] mb-1.5">
              Type d'assignation
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'user', label: 'Utilisateurs', icon: User },
                { value: 'role', label: 'Rôle', icon: Shield },
                { value: 'department', label: 'Département', icon: Building2 },
              ].map((type) => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        assigneeType: type.value as WorkflowStep['assigneeType'],
                        assigneeId: 0,
                        assignees: [],
                      }))
                    }
                    className={`p-2 rounded-lg border-2 flex items-center gap-2 transition-all ${
                      formData.assigneeType === type.value
                        ? 'border-[#1A1A2E] bg-white'
                        : 'border-[#E5E7EB] hover:border-[#1A1A2E]'
                    }`}
                  >
                    <Icon size={16} />
                    <span className="text-sm">{type.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Registered Users Multi-Select */}
          {formData.assigneeType === 'user' && (
            <div>
              <label className="block text-sm font-medium text-[#1A1A2E] mb-1.5">
                Utilisateurs enregistrés
              </label>
              <div className="border border-[#E5E7EB] rounded-lg bg-white">
                {/* Selected users */}
                {(formData.assignees?.length || 0) > 0 && (
                  <div className="flex flex-wrap gap-2 p-2 border-b border-[#E5E7EB]">
                    {formData.assignees
                      ?.filter((a) => a.type === 'user')
                      .map((assignee) => (
                        <div
                          key={assignee.id}
                          className="flex items-center gap-1.5 px-2 py-1 bg-[#1A1A2E] text-white rounded-full text-sm"
                        >
                          <User size={12} />
                          <span>{assignee.name}</span>
                          <button
                            type="button"
                            onClick={() =>
                              setFormData((prev) => ({
                                ...prev,
                                assignees:
                                  prev.assignees?.filter((a) => a.id !== assignee.id) || [],
                              }))
                            }
                            className="ml-1 hover:bg-white/20 rounded-full p-0.5"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                  </div>
                )}
                {/* Dropdown to add users */}
                <select
                  value=""
                  onChange={(e) => {
                    const userId = Number(e.target.value);
                    const user = availableUsers.find((u) => u.id === userId);
                    if (user && !formData.assignees?.some((a) => a.id === userId)) {
                      setFormData((prev) => ({
                        ...prev,
                        assignees: [
                          ...(prev.assignees || []),
                          { id: user.id, name: user.name, type: 'user' },
                        ],
                        assigneeId: user.id,
                      }));
                    }
                  }}
                  className="w-full px-3 py-2.5 border-0 focus:ring-0 text-sm"
                >
                  <option value="">+ Ajouter un utilisateur...</option>
                  {availableUsers
                    .filter((u) => !formData.assignees?.some((a) => a.id === u.id))
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role})
                      </option>
                    ))}
                </select>
              </div>
            </div>
          )}

          {/* Role Selection */}
          {formData.assigneeType === 'role' && (
            <div>
              <label className="block text-sm font-medium text-[#1A1A2E] mb-1.5">Rôle</label>
              <select
                value={formData.assigneeId}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, assigneeId: Number(e.target.value) }))
                }
                className="w-full px-3 py-2.5 border border-[#E5E7EB] rounded-lg focus:ring-2 focus:ring-[#FBBF24]"
              >
                <option value={0}>Sélectionner un rôle...</option>
                {availableRoles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-[#6B7280] mt-1">
                Tous les utilisateurs avec ce rôle seront notifiés
              </p>
            </div>
          )}

          {/* Department Selection */}
          {formData.assigneeType === 'department' && (
            <div>
              <label className="block text-sm font-medium text-[#1A1A2E] mb-1.5">Département</label>
              <select
                value={formData.assigneeId}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, assigneeId: Number(e.target.value) }))
                }
                className="w-full px-3 py-2.5 border border-[#E5E7EB] rounded-lg focus:ring-2 focus:ring-[#FBBF24]"
              >
                <option value={0}>Sélectionner un département...</option>
                {availableDepartments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-[#6B7280] mt-1">
                Tous les membres du département seront notifiés
              </p>
            </div>
          )}

          {/* External Persons */}
          <div className="pt-4 border-t border-[#E5E7EB]">
            <label className="block text-sm font-medium text-[#1A1A2E] mb-2 flex items-center gap-2">
              <Mail size={14} />
              Personnes externes (par email)
            </label>

            {/* List of external assignees */}
            {(formData.externalAssignees?.length || 0) > 0 && (
              <div className="space-y-2 mb-3">
                {formData.externalAssignees?.map((ext) => (
                  <div
                    key={ext.id}
                    className="flex items-center justify-between p-2 bg-white rounded-lg border border-[#E5E7EB]"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-advist-gold-light rounded-full flex items-center justify-center">
                        <Mail size={14} className="text-advist-gray900" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#1A1A2E]">
                          {ext.firstName} {ext.lastName}
                        </p>
                        <p className="text-xs text-[#6B7280]">{ext.email}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          externalAssignees:
                            prev.externalAssignees?.filter((e) => e.id !== ext.id) || [],
                        }))
                      }
                      className="p-1 hover:bg-advist-gold-light rounded"
                    >
                      <Trash2 size={14} className="text-advist-error" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add external person form */}
            <ExternalPersonForm
              onAdd={(person) => {
                setFormData((prev) => ({
                  ...prev,
                  externalAssignees: [...(prev.externalAssignees || []), person],
                }));
              }}
            />
          </div>
        </div>

        {/* Backup/Replacement Person */}
        <div className="p-4 bg-advist-gold-light rounded-lg space-y-3">
          <h4 className="font-medium text-advist-gold-dark flex items-center gap-2">
            <RefreshCw size={16} />
            Remplaçant en cas d'absence
          </h4>
          <p className="text-xs text-advist-gold-dark">
            Cette personne sera notifiée si l'intervenant principal est absent
          </p>

          <div>
            <label className="block text-sm font-medium text-advist-gold-dark mb-1.5">
              Type de remplaçant
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    backupAssignee: { type: 'user' },
                  }))
                }
                className={`p-2 rounded-lg border-2 flex items-center gap-2 transition-all ${
                  formData.backupAssignee?.type === 'user'
                    ? 'border-advist-gold bg-white'
                    : 'border-advist-gold hover:border-advist-gold bg-white/50'
                }`}
              >
                <User size={16} className="text-advist-gold-dark" />
                <span className="text-sm text-advist-gold-dark">Utilisateur interne</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    backupAssignee: { type: 'external' },
                  }))
                }
                className={`p-2 rounded-lg border-2 flex items-center gap-2 transition-all ${
                  formData.backupAssignee?.type === 'external'
                    ? 'border-advist-gold bg-white'
                    : 'border-advist-gold hover:border-advist-gold bg-white/50'
                }`}
              >
                <Mail size={16} className="text-advist-gold-dark" />
                <span className="text-sm text-advist-gold-dark">Personne externe</span>
              </button>
            </div>
          </div>

          {formData.backupAssignee?.type === 'user' && (
            <div>
              <select
                value={formData.backupAssignee.userId || 0}
                onChange={(e) => {
                  const userId = Number(e.target.value);
                  const user = availableUsers.find((u) => u.id === userId);
                  setFormData((prev) => ({
                    ...prev,
                    backupAssignee: {
                      type: 'user',
                      userId,
                      userName: user?.name,
                    },
                  }));
                }}
                className="w-full px-3 py-2.5 border border-advist-gold rounded-lg focus:ring-2 focus:ring-primary-400 bg-white"
              >
                <option value={0}>Sélectionner un remplaçant...</option>
                {availableUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </div>
          )}

          {formData.backupAssignee?.type === 'external' && (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Prénom"
                  value={formData.backupAssignee.external?.firstName || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      backupAssignee: {
                        ...prev.backupAssignee!,
                        external: {
                          ...prev.backupAssignee?.external,
                          id: prev.backupAssignee?.external?.id || `ext_backup_${Date.now()}`,
                          firstName: e.target.value,
                          lastName: prev.backupAssignee?.external?.lastName || '',
                          email: prev.backupAssignee?.external?.email || '',
                        },
                      },
                    }))
                  }
                />
                <Input
                  placeholder="Nom"
                  value={formData.backupAssignee.external?.lastName || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      backupAssignee: {
                        ...prev.backupAssignee!,
                        external: {
                          ...prev.backupAssignee?.external,
                          id: prev.backupAssignee?.external?.id || `ext_backup_${Date.now()}`,
                          firstName: prev.backupAssignee?.external?.firstName || '',
                          lastName: e.target.value,
                          email: prev.backupAssignee?.external?.email || '',
                        },
                      },
                    }))
                  }
                />
              </div>
              <Input
                type="email"
                placeholder="Adresse email"
                value={formData.backupAssignee.external?.email || ''}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    backupAssignee: {
                      ...prev.backupAssignee!,
                      external: {
                        ...prev.backupAssignee?.external,
                        id: prev.backupAssignee?.external?.id || `ext_backup_${Date.now()}`,
                        firstName: prev.backupAssignee?.external?.firstName || '',
                        lastName: prev.backupAssignee?.external?.lastName || '',
                        email: e.target.value,
                      },
                    },
                  }))
                }
              />
            </div>
          )}

          {!formData.backupAssignee?.type && (
            <p className="text-xs text-advist-gold-dark italic">Aucun remplaçant configuré</p>
          )}
        </div>

        {/* Validation Rule and Deadline */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#1A1A2E] mb-1.5">
              Règle de validation
            </label>
            <select
              value={formData.validationRule}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  validationRule: e.target.value as WorkflowStep['validationRule'],
                }))
              }
              className="w-full px-3 py-2.5 border border-[#E5E7EB] rounded-lg focus:ring-2 focus:ring-[#FBBF24]"
            >
              <option value="all">Tous doivent valider</option>
              <option value="any">Un seul suffit</option>
              <option value="majority">Majorité requise</option>
            </select>
          </div>
          <Input
            type="number"
            label="Délai (jours)"
            value={formData.deadlineDays || ''}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                deadlineDays: e.target.value ? Number(e.target.value) : undefined,
              }))
            }
            min={1}
            placeholder="3"
          />
        </div>

        {/* Order/Mode of passage for all step types */}
        <div className="p-4 bg-advist-surface-dark rounded-lg space-y-4">
          <h4 className="font-medium text-[#1A1A2E] flex items-center gap-2">
            <ArrowDown size={16} />
            Ordre de passage
          </h4>

          <div>
            <label className="block text-sm font-medium text-[#1A1A2E] mb-1.5">
              Mode d'execution
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'sequential', label: 'Sequentiel', desc: "Un apres l'autre" },
                { value: 'parallel', label: 'Parallele', desc: 'Tous en meme temps' },
                { value: 'mixed', label: 'Mixte', desc: 'Groupes paralleles' },
              ].map((mode) => (
                <button
                  key={mode.value}
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      signatureMode: mode.value as WorkflowStep['signatureMode'],
                    }))
                  }
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    formData.signatureMode === mode.value
                      ? 'border-[#1A1A2E] bg-white'
                      : 'border-[#E5E7EB] hover:border-[#1A1A2E]'
                  }`}
                >
                  <span className="text-sm font-medium text-[#1A1A2E] block">{mode.label}</span>
                  <span className="text-xs text-[#6B7280]">{mode.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {formData.signatureMode === 'mixed' && (
            <Input
              type="number"
              label="Numero du groupe parallele"
              value={formData.parallelGroup || 1}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  parallelGroup: Number(e.target.value),
                }))
              }
              min={1}
              helperText="Les etapes du meme groupe s'executent en parallele"
            />
          )}
        </div>

        {/* Signature/Paraph specific options */}
        {(formData.type === 'signature' || formData.type === 'paraph') && (
          <div className="p-4 bg-advist-gold-light rounded-lg space-y-4">
            <h4 className="font-medium text-advist-gray900 flex items-center gap-2">
              <PenTool size={16} />
              Options de {formData.type === 'signature' ? 'signature' : 'paraphe'}
            </h4>

            {formData.type === 'paraph' && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="requiresParaphAllPages"
                  checked={formData.requiresParaphAllPages}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      requiresParaphAllPages: e.target.checked,
                    }))
                  }
                  className="w-4 h-4 rounded border-advist-dark text-advist-gray900"
                />
                <label htmlFor="requiresParaphAllPages" className="text-sm text-advist-gray900">
                  Paraphe requis sur toutes les pages
                </label>
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isRequired"
                checked={formData.isRequired !== false}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    isRequired: e.target.checked,
                  }))
                }
                className="w-4 h-4 rounded border-advist-dark text-advist-gray900"
              />
              <label htmlFor="isRequired" className="text-sm text-advist-gray900">
                Etape obligatoire
              </label>
            </div>
          </div>
        )}

        {/* Additional Options */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="canDelegate"
              checked={formData.canDelegate}
              onChange={(e) => setFormData((prev) => ({ ...prev, canDelegate: e.target.checked }))}
              className="w-4 h-4 rounded border-[#E5E7EB] text-[#1A1A2E]"
            />
            <label htmlFor="canDelegate" className="text-sm text-[#6B7280]">
              Autoriser la délégation
            </label>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-[#1A1A2E] mb-1.5">
            Description (optionnel)
          </label>
          <textarea
            value={formData.description || ''}
            onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="Instructions pour cette étape..."
            className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:ring-2 focus:ring-[#FBBF24] resize-none"
            rows={2}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t border-[#E5E7EB]">
          <Button type="button" variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit">Enregistrer l'étape</Button>
        </div>
      </form>
    </Modal>
  );
};

export default WorkflowEditor;
