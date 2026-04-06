import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  GitBranch,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  MoreVertical,
  FileText,
  Users,
  AlertTriangle,
  Zap,
  RotateCcw,
  UserPlus,
  GitMerge,
  Settings,
  History,
  ArrowRight,
  ArrowRightLeft,
  RefreshCw,
  Ban,
  Filter,
  Eye,
  Edit2,
  Trash2,
  Tag,
  PenTool,
  Save,
} from 'lucide-react';
import { Card, Button, Badge, AvatarGroup, Modal, Input } from '../../components/ui';
import { PrintButton } from '../../shared/PrintEngine';
import { WorkflowEditor, type WorkflowStep } from '../../components/workflows/WorkflowEditor';
import {
  ConditionalRules,
  type ConditionalRule,
} from '../../components/workflows/ConditionalRules';
import { AddValidatorModal } from '../../components/workflows/AddValidatorModal';
import { UpgradeGate } from '../../components/subscription/UpgradeGate';

export const WorkflowsPage: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'tasks' | 'instances' | 'templates'>('tasks');
  const [showNewTemplateModal, setShowNewTemplateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const location = useLocation();
  const basePath = location.pathname.startsWith('/admin') ? '/admin' : '/user';

  const handleNewTemplate = () => {
    setEditingTemplate(null);
    setShowNewTemplateModal(true);
  };

  const handleEditTemplate = (template: any) => {
    setEditingTemplate(template);
    setShowNewTemplateModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-advist-gray900">{t('workflows.title')}</h1>
          <p className="text-advist-gray900/80 mt-1">{t('workflows.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <PrintButton config={{ title: 'Circuits de validation', appName: 'Advist' }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 8 }}>{t('workflows.title')}</h2>
              <p>{t('workflows.subtitle')}</p>
            </div>
          </PrintButton>
          <Button leftIcon={<Plus size={18} />} onClick={handleNewTemplate}>
            {t('workflows.newTemplate')}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-advist-border">
        <nav className="flex gap-4">
          {[
            { key: 'tasks', label: t('workflows.myTasks'), count: 5 },
            { key: 'instances', label: t('workflows.activeWorkflows'), count: 12 },
            { key: 'templates', label: t('workflows.templates') },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`
                pb-3 px-1 text-sm font-medium transition-all duration-240 relative
                ${
                  activeTab === tab.key
                    ? 'text-advist-gray900 border-b-2 border-advist-dark'
                    : 'text-advist-gray900/80 hover:text-advist-gray900'
                }
              `}
            >
              {tab.label}
              {tab.count && (
                <span className="ml-2 px-2 py-0.5 bg-advist-surface-dark rounded-full text-xs">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'tasks' && <MyTasksSection basePath={basePath} />}
      {activeTab === 'instances' && <WorkflowInstancesSection basePath={basePath} />}
      {activeTab === 'templates' && (
        <WorkflowTemplatesSection
          onEditTemplate={handleEditTemplate}
          onNewTemplate={handleNewTemplate}
        />
      )}

      {/* New/Edit Template Modal */}
      <NewWorkflowTemplateModal
        isOpen={showNewTemplateModal}
        onClose={() => {
          setShowNewTemplateModal(false);
          setEditingTemplate(null);
        }}
        template={editingTemplate}
      />
    </div>
  );
};

const MyTasksSection: React.FC<{ basePath: string }> = ({ basePath }) => {
  const { t } = useTranslation();
  const [showDelegateModal, setShowDelegateModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [showRefuseModal, setShowRefuseModal] = useState(false);

  // Mock data for demo with v2 features
  const mockTasks = [
    {
      id: 1,
      document: { title: 'Contrat de prestation Q4 2024', id: 1, amount: 50000 },
      step: { name: 'Approbation Direction', type: 'approval' },
      workflow: {
        id: 1,
        is_fast_track: true,
        fast_track_reason: 'Urgence client',
        signature_mode: 'sequential',
      },
      deadline: '2024-11-29T18:00:00',
      assignedBy: { name: 'Marie Dupont' },
      canDelegate: true,
      isParallelSignature: false,
    },
    {
      id: 2,
      document: { title: 'Budget previsionnel 2025', id: 2, amount: 500000 },
      step: { name: 'Signature', type: 'signature', requires_paraph: true },
      workflow: { id: 2, is_fast_track: false, signature_mode: 'parallel' },
      deadline: '2024-11-30T18:00:00',
      assignedBy: { name: 'Pierre Martin' },
      canDelegate: false,
      isParallelSignature: true,
      parallelSigners: [
        { name: 'Jean Dupont', signed: true },
        { name: 'Vous', signed: false },
        { name: 'Sophie Bernard', signed: false },
      ],
    },
    {
      id: 3,
      document: { title: 'Procedure qualite v2', id: 3 },
      step: { name: 'Revue technique', type: 'review' },
      workflow: { id: 3, is_fast_track: false, signature_mode: 'sequential' },
      deadline: '2024-12-01T18:00:00',
      assignedBy: { name: 'Sophie Bernard' },
      canDelegate: true,
      isParallelSignature: false,
    },
  ];

  const handleDelegate = (task: any) => {
    setSelectedTask(task);
    setShowDelegateModal(true);
  };

  const handleRefuseDefinitive = (task: any) => {
    setSelectedTask(task);
    setShowRefuseModal(true);
  };

  return (
    <div className="space-y-4">
      {mockTasks.map((task: any) => (
        <Card key={task.id} hoverable>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4 flex-1">
              <div className="p-3 bg-advist-surface-dark rounded-xl relative">
                <FileText size={24} className="text-advist-gray900/80" />
                {task.workflow.is_fast_track && (
                  <div className="absolute -top-1 -right-1 p-1 bg-advist-red rounded-full">
                    <Zap size={10} className="text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Link
                    to={`${basePath}/documents/${task.document.id}`}
                    className="font-semibold text-advist-gray900 hover:underline"
                  >
                    {task.document.title}
                  </Link>
                  {task.workflow.is_fast_track && (
                    <Badge variant="warning" size="sm">
                      <Zap size={10} className="mr-1" />
                      URGENT
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-advist-gray900/80 mt-1">
                  {task.step.name} • Assigne par {task.assignedBy.name}
                </p>

                {/* v2: Parallel signature indicator */}
                {task.isParallelSignature && task.parallelSigners && (
                  <div className="mt-2 p-2 bg-advist-bg rounded-xl">
                    <div className="flex items-center gap-2 text-sm text-advist-gray900/80">
                      <ArrowRightLeft size={14} />
                      <span className="font-medium">Signature parallele</span>
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      {task.parallelSigners.map((signer: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-1">
                          <div
                            className={`w-2 h-2 rounded-full ${signer.signed ? 'bg-advist-red' : 'bg-advist-surface-dark'}`}
                          />
                          <span className="text-xs text-advist-gray900/80">{signer.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* v2: Paraph requirement indicator */}
                {task.step.requires_paraph && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-advist-gray900/80">
                    <Edit2 size={14} />
                    <span>{t('workflows.paraphRequired')}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="warning" size="sm">
                    <Clock size={12} className="mr-1" />
                    {new Date(task.deadline).toLocaleDateString('fr-FR')}
                  </Badge>
                  {task.document.amount && (
                    <Badge variant="gray" size="sm">
                      {task.document.amount.toLocaleString('fr-FR')} €
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                {task.step.type === 'signature' ? (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRefuseDefinitive(task)}
                    >
                      <Ban size={14} className="mr-1" />
                      {t('common.refuse')}
                    </Button>
                    <Button size="sm">
                      <Edit2 size={14} className="mr-1" />
                      {t('signatures.sign')}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button size="sm" variant="outline">
                      <XCircle size={14} className="mr-1" />
                      {t('workflows.reject')}
                    </Button>
                    <Button size="sm">
                      <CheckCircle size={14} className="mr-1" />
                      {t('workflows.approve')}
                    </Button>
                  </>
                )}
              </div>
              {task.canDelegate && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-advist-gray900/80"
                  onClick={() => handleDelegate(task)}
                >
                  <UserPlus size={14} className="mr-1" />
                  {t('workflows.delegate')}
                </Button>
              )}
            </div>
          </div>
        </Card>
      ))}

      {mockTasks.length === 0 && (
        <Card>
          <div className="text-center py-12">
            <CheckCircle size={48} className="mx-auto text-advist-gray900 mb-4" />
            <h3 className="text-lg font-medium text-advist-gray900">
              {t('dashboard.allCaughtUp')}
            </h3>
            <p className="text-advist-gray900/80 mt-1">{t('workflows.noTasksPending')}</p>
          </div>
        </Card>
      )}

      {/* v2: Delegate Modal */}
      <DelegateModal
        isOpen={showDelegateModal}
        onClose={() => setShowDelegateModal(false)}
        task={selectedTask}
      />

      {/* v2: Definitive Refusal Modal */}
      <RefuseSignatureModal
        isOpen={showRefuseModal}
        onClose={() => setShowRefuseModal(false)}
        task={selectedTask}
      />
    </div>
  );
};

const WorkflowInstancesSection: React.FC<{ basePath: string }> = ({ basePath }) => {
  const { t } = useTranslation();
  const [showRecallModal, setShowRecallModal] = useState(false);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [showAddValidatorModal, setShowAddValidatorModal] = useState(false);
  const [selectedInstance, setSelectedInstance] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // v2: Mock data with enhanced features
  const instances = [
    {
      id: 1,
      template: { name: 'Validation contrat', version: 3 },
      document: { title: 'Contrat de prestation Q4 2024', id: 1 },
      status: 'in_progress',
      current_step: 2,
      total_steps: 4,
      started_at: '2024-11-25T10:00:00',
      is_fast_track: true,
      fast_track_reason: 'Urgence client',
      signature_mode: 'sequential',
      template_version: 3,
      can_recall: true,
      assignees: [
        { name: 'Marie Dupont', status: 'approved' },
        { name: 'Pierre Martin', status: 'pending' },
        { name: 'Sophie Bernard', status: 'pending' },
      ],
    },
    {
      id: 2,
      template: { name: 'Approbation budget', version: 2 },
      document: { title: 'Budget previsionnel 2025', id: 2 },
      status: 'pending',
      current_step: 1,
      total_steps: 3,
      started_at: '2024-11-26T14:00:00',
      is_fast_track: false,
      signature_mode: 'parallel',
      template_version: 2,
      can_recall: true,
      assignees: [
        { name: 'Jean Durand', status: 'pending' },
        { name: 'Alice Martin', status: 'pending' },
      ],
    },
    {
      id: 3,
      template: { name: 'Validation procedure', version: 1 },
      document: { title: 'Procedure qualite v2', id: 3 },
      status: 'completed',
      current_step: 3,
      total_steps: 3,
      started_at: '2024-11-20T09:00:00',
      completed_at: '2024-11-22T16:30:00',
      is_fast_track: false,
      signature_mode: 'sequential',
      template_version: 1,
      can_recall: false,
      assignees: [{ name: 'Sophie Bernard', status: 'approved' }],
    },
    {
      id: 4,
      template: { name: 'Validation contrat', version: 2 },
      document: { title: 'Contrat fournisseur ABC', id: 4 },
      status: 'recalled',
      current_step: 2,
      total_steps: 4,
      started_at: '2024-11-18T10:00:00',
      recalled_at: '2024-11-19T14:00:00',
      recall_reason: 'Erreur dans les montants',
      is_fast_track: false,
      signature_mode: 'sequential',
      template_version: 2,
      can_recall: false,
      assignees: [{ name: 'Marie Dupont', status: 'approved' }],
    },
    {
      id: 5,
      template: { name: 'Signature contrat', version: 1 },
      document: { title: 'NDA Client XYZ', id: 5 },
      status: 'signature_refused',
      current_step: 3,
      total_steps: 3,
      started_at: '2024-11-15T10:00:00',
      is_fast_track: false,
      signature_mode: 'sequential',
      template_version: 1,
      can_recall: false,
      refusal_reason: 'Desaccord sur les clauses de confidentialite',
      assignees: [{ name: 'Client XYZ', status: 'refused' }],
    },
  ];

  const filteredInstances =
    filterStatus === 'all' ? instances : instances.filter((i) => i.status === filterStatus);

  const handleRecall = (instance: any) => {
    setSelectedInstance(instance);
    setShowRecallModal(true);
  };

  const handleReassign = (instance: any) => {
    setSelectedInstance(instance);
    setShowReassignModal(true);
  };

  const handleAddValidator = (instance: any) => {
    setSelectedInstance(instance);
    setShowAddValidatorModal(true);
  };

  const getStatusBadge = (status: string, is_fast_track: boolean, _refusal_reason?: string) => {
    switch (status) {
      case 'in_progress':
        return (
          <div className="flex items-center gap-2">
            <Badge variant="blue" size="sm">
              {t('workflows.statusInProgress')}
            </Badge>
            {is_fast_track && (
              <Badge variant="warning" size="sm">
                <Zap size={10} className="mr-1" />
                {t('workflows.urgent')}
              </Badge>
            )}
          </div>
        );
      case 'pending':
        return (
          <Badge variant="gray" size="sm">
            {t('workflows.statusPending')}
          </Badge>
        );
      case 'completed':
        return (
          <Badge variant="green" size="sm">
            {t('workflows.statusCompleted')}
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="red" size="sm">
            {t('workflows.statusRejected')}
          </Badge>
        );
      case 'recalled':
        return (
          <Badge variant="yellow" size="sm">
            {t('workflows.statusRecalled')}
          </Badge>
        );
      case 'signature_refused':
        return (
          <div className="flex flex-col gap-1">
            <Badge variant="red" size="sm">
              {t('workflows.statusSignatureRefused')}
            </Badge>
          </div>
        );
      default:
        return (
          <Badge variant="gray" size="sm">
            {status}
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* v2: Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-advist-gray900/80" />
            <span className="text-sm text-advist-gray900/80">{t('common.filter')}:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'all', label: t('common.all') },
              { value: 'in_progress', label: t('workflows.statusInProgress') },
              { value: 'pending', label: t('workflows.statusPending') },
              { value: 'completed', label: t('workflows.statusCompletedPlural') },
              { value: 'recalled', label: t('workflows.statusRecalledPlural') },
              { value: 'signature_refused', label: t('workflows.statusSignatureRefused') },
            ].map((filter) => (
              <button
                key={filter.value}
                onClick={() => setFilterStatus(filter.value)}
                className={`px-3 py-1.5 rounded-xl text-sm transition-all duration-240 ${
                  filterStatus === filter.value
                    ? 'bg-advist-dark text-white'
                    : 'bg-advist-surface-dark text-advist-gray900/80 hover:bg-advist-dark/10'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {filteredInstances.map((instance) => (
        <Card key={instance.id}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-advist-gold-light/20 rounded-xl relative">
                  <GitBranch size={20} className="text-advist-gray900/80" />
                  {instance.is_fast_track && (
                    <div className="absolute -top-1 -right-1 p-0.5 bg-advist-red rounded-full">
                      <Zap size={8} className="text-white" />
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Link
                      to={`${basePath}/documents/${instance.document.id}`}
                      className="font-semibold text-advist-gray900 hover:underline"
                    >
                      {instance.template.name}
                    </Link>
                    {/* v2: Version badge */}
                    <Badge variant="gray" size="sm">
                      v{instance.template_version}
                    </Badge>
                  </div>
                  <p className="text-sm text-advist-gray900/80">{instance.document.title}</p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-advist-gray900/80">
                    {t('workflows.stepProgress', {
                      current: instance.current_step,
                      total: instance.total_steps,
                    })}
                  </span>
                  <div className="flex items-center gap-2">
                    {/* v2: Signature mode indicator */}
                    {instance.signature_mode === 'parallel' && (
                      <span className="flex items-center gap-1 text-xs text-advist-gray900/80">
                        <ArrowRightLeft size={12} />
                        {t('workflows.parallel')}
                      </span>
                    )}
                    <span className="text-advist-gray900/80">
                      {Math.round((instance.current_step / instance.total_steps) * 100)}%
                    </span>
                  </div>
                </div>
                <div className="h-2 bg-advist-surface-dark rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      instance.status === 'completed'
                        ? 'bg-advist-red'
                        : instance.status === 'rejected' || instance.status === 'signature_refused'
                          ? 'bg-advist-bg0'
                          : instance.status === 'recalled'
                            ? 'bg-advist-red/100'
                            : 'bg-advist-bg0'
                    }`}
                    style={{
                      width: `${(instance.current_step / instance.total_steps) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {/* v2: Recall/Refusal reason */}
              {instance.recall_reason && (
                <div className="mt-3 p-2 bg-advist-red/10 rounded-xl">
                  <p className="text-sm text-advist-gray900">
                    <strong>{t('workflows.recallReason')}:</strong> {instance.recall_reason}
                  </p>
                </div>
              )}
              {instance.refusal_reason && (
                <div className="mt-3 p-2 bg-advist-bg rounded-xl">
                  <p className="text-sm text-advist-gray900/70">
                    <strong>{t('workflows.refusalReason')}:</strong> {instance.refusal_reason}
                  </p>
                </div>
              )}

              <div className="flex items-center gap-4 mt-3">
                {getStatusBadge(instance.status, instance.is_fast_track, instance.refusal_reason)}
                <span className="text-sm text-advist-blue-light">
                  {t('workflows.startedOn')}{' '}
                  {new Date(instance.started_at).toLocaleDateString('fr-FR')}
                </span>
                <div className="flex items-center gap-2">
                  <Users size={14} className="text-advist-blue-light" />
                  <AvatarGroup
                    users={instance.assignees.map((a) => ({ name: a.name }))}
                    max={3}
                    size="xs"
                  />
                </div>
              </div>
            </div>

            {/* v2: Actions menu */}
            <div className="relative group">
              <button className="p-2 rounded-xl hover:bg-advist-surface-dark transition-all duration-240">
                <MoreVertical size={18} className="text-advist-gray900/80" />
              </button>
              <div className="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-lg border border-advist-border py-1 z-10 hidden group-hover:block">
                <Link
                  to={`${basePath}/documents/${instance.document.id}`}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-advist-gray900/80 hover:bg-advist-surface-dark"
                >
                  <Eye size={14} />
                  {t('documents.viewDocument')}
                </Link>
                {instance.can_recall && (
                  <button
                    onClick={() => handleRecall(instance)}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-advist-gray900 hover:bg-advist-red/10"
                  >
                    <RotateCcw size={14} />
                    {t('workflows.recallDocument')}
                  </button>
                )}
                {instance.status === 'in_progress' && (
                  <>
                    <button
                      onClick={() => handleReassign(instance)}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-advist-gray900/80 hover:bg-advist-surface-dark"
                    >
                      <RefreshCw size={14} />
                      {t('workflows.reassign')}
                    </button>
                    <button
                      onClick={() => handleAddValidator(instance)}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-advist-gray900/80 hover:bg-advist-surface-dark"
                    >
                      <UserPlus size={14} />
                      {t('workflows.addValidator')}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </Card>
      ))}

      {/* v2: Recall Modal */}
      <RecallWorkflowModal
        isOpen={showRecallModal}
        onClose={() => setShowRecallModal(false)}
        instance={selectedInstance}
      />

      {/* v2: Reassign Modal */}
      <ReassignModal
        isOpen={showReassignModal}
        onClose={() => setShowReassignModal(false)}
        instance={selectedInstance}
      />

      {/* Add Validator Modal */}
      {selectedInstance && (
        <AddValidatorModal
          isOpen={showAddValidatorModal}
          onClose={() => setShowAddValidatorModal(false)}
          workflowId={selectedInstance.id}
          currentSteps={
            selectedInstance.assignees?.map((a: any, idx: number) => ({
              id: `step-${idx + 1}`,
              order: idx + 1,
              name: `Étape ${idx + 1}`,
              type: 'validation' as const,
              status:
                a.status === 'approved'
                  ? ('completed' as const)
                  : a.status === 'pending'
                    ? ('pending' as const)
                    : ('in_progress' as const),
              assignee: {
                id: idx + 1,
                name: a.name,
                email: `${a.name.toLowerCase().replace(' ', '.')}@example.com`,
              },
            })) || []
          }
          onValidatorAdded={() => {
            setShowAddValidatorModal(false);
          }}
        />
      )}
    </div>
  );
};

const WorkflowTemplatesSection: React.FC<{
  onEditTemplate: (template: any) => void;
  onNewTemplate: () => void;
}> = ({ onEditTemplate, onNewTemplate }) => {
  const { t } = useTranslation();
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);

  // v2: Templates with version and conditional rules
  const templates = [
    {
      id: 1,
      name: 'Validation contrat',
      description: 'Workflow standard pour la validation des contrats',
      steps: 4,
      usageCount: 45,
      isActive: true,
      version: 3,
      versionHistory: [
        {
          version: 3,
          date: '2024-11-20',
          by: 'Jean Dupont',
          changes: 'Ajout etape validation juridique',
        },
        { version: 2, date: '2024-10-15', by: 'Marie Martin', changes: 'Modification delais' },
        { version: 1, date: '2024-09-01', by: 'Jean Dupont', changes: 'Creation initiale' },
      ],
      conditionalRules: [
        { condition: 'Montant > 100 000 €', action: 'Ajout Directeur Financier' },
        { condition: 'Confidentiel', action: 'Double approbation requise' },
      ],
      fastTrackEnabled: true,
      parallelSignatureEnabled: true,
    },
    {
      id: 2,
      name: 'Approbation budget',
      description: "Circuit d'approbation pour les budgets",
      steps: 3,
      usageCount: 23,
      isActive: true,
      version: 2,
      versionHistory: [
        { version: 2, date: '2024-11-01', by: 'Pierre Bernard', changes: 'Ajout seuils' },
        { version: 1, date: '2024-08-15', by: 'Jean Dupont', changes: 'Creation initiale' },
      ],
      conditionalRules: [{ condition: 'Budget > 500 000 €', action: 'Escalade DG' }],
      fastTrackEnabled: false,
      parallelSignatureEnabled: false,
    },
    {
      id: 3,
      name: 'Validation procedure',
      description: 'Validation des procedures qualite',
      steps: 3,
      usageCount: 12,
      isActive: false,
      version: 1,
      versionHistory: [
        { version: 1, date: '2024-07-01', by: 'Sophie Petit', changes: 'Creation initiale' },
      ],
      conditionalRules: [],
      fastTrackEnabled: false,
      parallelSignatureEnabled: false,
    },
  ];

  const handleShowVersions = (template: any) => {
    setSelectedTemplate(template);
    setShowVersionHistory(true);
  };

  const handleShowRules = (template: any) => {
    setSelectedTemplate(template);
    setShowRulesModal(true);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {templates.map((template) => (
        <Card key={template.id} hoverable>
          <div className="flex items-start justify-between mb-3">
            <div className="p-2 bg-advist-gold-light/20 rounded-xl">
              <GitBranch size={20} className="text-advist-gray900/80" />
            </div>
            <div className="flex items-center gap-2">
              {/* v2: Version badge */}
              <Badge variant="gray" size="sm">
                v{template.version}
              </Badge>
              <Badge variant={template.isActive ? 'green' : 'gray'} size="sm">
                {template.isActive ? t('common.active') : t('common.inactive')}
              </Badge>
            </div>
          </div>
          <h3 className="font-semibold text-advist-gray900">{template.name}</h3>
          <p className="text-sm text-advist-gray900/80 mt-1 line-clamp-2">{template.description}</p>

          {/* v2: Features badges */}
          <div className="flex flex-wrap gap-1 mt-3">
            {template.fastTrackEnabled && (
              <Badge variant="warning" size="sm">
                <Zap size={10} className="mr-1" />
                Fast-track
              </Badge>
            )}
            {template.parallelSignatureEnabled && (
              <Badge variant="blue" size="sm">
                <ArrowRightLeft size={10} className="mr-1" />
                Parallele
              </Badge>
            )}
            {template.conditionalRules.length > 0 && (
              <Badge variant="purple" size="sm">
                <GitMerge size={10} className="mr-1" />
                {template.conditionalRules.length} regle(s)
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-4 mt-4 text-sm text-advist-blue-light">
            <span>{template.steps} etapes</span>
            <span>•</span>
            <span>{template.usageCount} utilisations</span>
          </div>

          {/* v2: Action buttons */}
          <div className="flex gap-2 mt-4 pt-4 border-t border-advist-border">
            <Button
              size="sm"
              variant="ghost"
              className="flex-1"
              onClick={() => handleShowVersions(template)}
            >
              <History size={14} className="mr-1" />
              {t('workflows.versions')}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="flex-1"
              onClick={() => handleShowRules(template)}
            >
              <Settings size={14} className="mr-1" />
              {t('workflows.rules')}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={() => onEditTemplate(template)}
            >
              <Edit2 size={14} className="mr-1" />
              {t('common.edit')}
            </Button>
          </div>
        </Card>
      ))}

      {/* Add new template card */}
      <Card
        className="border-2 border-dashed border-advist-blue-light hover:border-advist-dark transition-all duration-240 cursor-pointer"
        onClick={onNewTemplate}
      >
        <div className="flex flex-col items-center justify-center h-full text-center py-8">
          <div className="p-3 bg-advist-surface-dark rounded-full mb-3">
            <Plus size={24} className="text-advist-gray900/80" />
          </div>
          <p className="font-medium text-advist-gray900">{t('workflows.newTemplate')}</p>
          <p className="text-sm text-advist-gray900/80 mt-1">
            {t('workflows.createCustomWorkflow')}
          </p>
        </div>
      </Card>

      {/* v2: Version History Modal */}
      <VersionHistoryModal
        isOpen={showVersionHistory}
        onClose={() => setShowVersionHistory(false)}
        template={selectedTemplate}
      />

      {/* v2: Conditional Rules Modal */}
      <ConditionalRulesModal
        isOpen={showRulesModal}
        onClose={() => setShowRulesModal(false)}
        template={selectedTemplate}
      />
    </div>
  );
};

// v2: Delegate Modal Component
const DelegateModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  task: any;
}> = ({ isOpen, onClose, task }) => {
  const { t } = useTranslation();
  const [selectedUser, setSelectedUser] = useState('');
  const [reason, setReason] = useState('');

  const users = [
    { id: 1, name: 'Marie Martin', department: 'Direction' },
    { id: 2, name: 'Pierre Bernard', department: 'Finance' },
    { id: 3, name: 'Sophie Petit', department: 'Juridique' },
  ];

  const handleDelegate = () => {
    console.info('Delegating to:', selectedUser, 'Reason:', reason);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('workflows.delegateTask')}>
      <div className="space-y-4">
        {task && (
          <div className="p-3 bg-advist-surface-dark/50 rounded-xl">
            <p className="text-sm text-advist-gray900/80">
              {t('documents.document')}: {task.document?.title}
            </p>
            <p className="text-sm text-advist-gray900/80">
              {t('workflows.step')}: {task.step?.name}
            </p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-advist-gray900 mb-1">
            {t('workflows.delegateTo')}
          </label>
          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="w-full px-3 py-2 border border-advist-border rounded-xl focus:outline-none focus:ring-2 focus:ring-advist-gold"
          >
            <option value="">{t('workflows.selectUser')}</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name} - {user.department}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-advist-gray900 mb-1">
            {t('workflows.delegationReason')}
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-advist-border rounded-xl focus:outline-none focus:ring-2 focus:ring-advist-gold resize-none"
            placeholder={t('workflows.delegationReasonPlaceholder')}
          />
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-advist-border">
          <Button variant="outline" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleDelegate} disabled={!selectedUser || !reason}>
            <UserPlus size={16} className="mr-2" />
            {t('workflows.delegate')}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// v2: Recall Workflow Modal
const RecallWorkflowModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  instance: any;
}> = ({ isOpen, onClose, instance }) => {
  const { t } = useTranslation();
  const [reason, setReason] = useState('');

  const handleRecall = () => {
    console.info('Recalling workflow:', instance?.id, 'Reason:', reason);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('workflows.recallDocument')}>
      <div className="space-y-4">
        <div className="p-4 bg-advist-red/10 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="text-advist-gray900 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-advist-gray900">{t('common.warning')}</p>
              <p className="text-sm text-advist-gray900 mt-1">{t('workflows.recallWarning')}</p>
            </div>
          </div>
        </div>

        {instance && (
          <div className="p-3 bg-advist-surface-dark/50 rounded-xl">
            <p className="text-sm text-advist-gray900/80">
              {t('documents.document')}: {instance.document?.title}
            </p>
            <p className="text-sm text-advist-gray900/80">Workflow: {instance.template?.name}</p>
            <p className="text-sm text-advist-gray900/80">
              Progression: {t('workflows.step')} {instance.current_step}/{instance.total_steps}
            </p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-advist-gray900 mb-1">
            {t('workflows.recallReasonLabel')}
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-advist-border rounded-xl focus:outline-none focus:ring-2 focus:ring-advist-gold resize-none"
            placeholder={t('workflows.recallReasonPlaceholder')}
            required
          />
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-advist-border">
          <Button variant="outline" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button variant="warning" onClick={handleRecall} disabled={!reason}>
            <RotateCcw size={16} className="mr-2" />
            {t('workflows.recall')}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// v2: Reassign Modal
const ReassignModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  instance: any;
}> = ({ isOpen, onClose, instance }) => {
  const { t } = useTranslation();
  const [selectedStep, setSelectedStep] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [reason, setReason] = useState('');
  const [reassignType, setReassignType] = useState<'delegation' | 'emergency' | 'departure'>(
    'emergency'
  );

  const users = [
    { id: 1, name: 'Marie Martin', department: 'Direction' },
    { id: 2, name: 'Pierre Bernard', department: 'Finance' },
    { id: 3, name: 'Sophie Petit', department: 'Juridique' },
  ];

  const handleReassign = () => {
    console.info('Reassigning:', {
      instance: instance?.id,
      step: selectedStep,
      user: selectedUser,
      reason,
      type: reassignType,
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('workflows.reassignValidator')} size="lg">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-advist-gray900 mb-1">
            {t('workflows.reassignType')}
          </label>
          <div className="flex gap-2">
            {[
              { value: 'emergency', label: t('workflows.emergency'), icon: Zap },
              { value: 'departure', label: t('workflows.employeeDeparture'), icon: Users },
              { value: 'delegation', label: t('workflows.delegation'), icon: UserPlus },
            ].map((type) => (
              <button
                key={type.value}
                onClick={() => setReassignType(type.value as typeof reassignType)}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl border transition-all duration-240 ${
                  reassignType === type.value
                    ? 'border-advist-dark bg-advist-dark text-white'
                    : 'border-advist-border text-advist-gray900/80 hover:border-advist-dark'
                }`}
              >
                <type.icon size={16} />
                {type.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-advist-gray900 mb-1">
            {t('workflows.concernedStep')}
          </label>
          <select
            value={selectedStep}
            onChange={(e) => setSelectedStep(e.target.value)}
            className="w-full px-3 py-2 border border-advist-border rounded-xl focus:outline-none focus:ring-2 focus:ring-advist-gold"
          >
            <option value="">{t('workflows.selectStep')}</option>
            <option value="1">Etape 1 - Approbation Manager</option>
            <option value="2">Etape 2 - Validation Direction (en cours)</option>
            <option value="3">Etape 3 - Signature</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-advist-gray900 mb-1">
            {t('workflows.newValidator')}
          </label>
          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="w-full px-3 py-2 border border-advist-border rounded-xl focus:outline-none focus:ring-2 focus:ring-advist-gold"
          >
            <option value="">{t('workflows.selectUser')}</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name} - {user.department}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-advist-gray900 mb-1">
            {t('workflows.reasonLabel')}
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-advist-border rounded-xl focus:outline-none focus:ring-2 focus:ring-advist-gold resize-none"
            placeholder={t('workflows.reassignReasonPlaceholder')}
            required
          />
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-advist-border">
          <Button variant="outline" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleReassign} disabled={!selectedStep || !selectedUser || !reason}>
            <RefreshCw size={16} className="mr-2" />
            {t('workflows.reassign')}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// v2: Refuse Signature Modal (Definitive refusal)
const RefuseSignatureModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  task: any;
}> = ({ isOpen, onClose, task }) => {
  const { t } = useTranslation();
  const [reason, setReason] = useState('');
  const [isDefinitive, setIsDefinitive] = useState(false);

  const handleRefuse = () => {
    console.info('Refusing signature:', { task: task?.id, reason, isDefinitive });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('signatures.refuseTitle')}>
      <div className="space-y-4">
        {task && (
          <div className="p-3 bg-advist-surface-dark/50 rounded-xl">
            <p className="text-sm text-advist-gray900/80">
              {t('documents.document')}: {task.document?.title}
            </p>
          </div>
        )}

        <div className="p-4 bg-advist-bg rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <input
              type="checkbox"
              id="definitive"
              checked={isDefinitive}
              onChange={(e) => setIsDefinitive(e.target.checked)}
              className="w-4 h-4 rounded border-advist-border text-advist-gray900/70 focus:ring-advist-gold"
            />
            <label htmlFor="definitive" className="font-medium text-advist-gray900/70">
              {t('signatures.definitiveRefusal')}
            </label>
          </div>
          <p className="text-sm text-advist-gray900/70">
            {isDefinitive
              ? t('signatures.definitiveRefusalWarning')
              : t('signatures.simpleRejectInfo')}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-advist-gray900 mb-1">
            {t('signatures.refusalReasonLabel')}
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-advist-border rounded-xl focus:outline-none focus:ring-2 focus:ring-advist-gold resize-none"
            placeholder={t('signatures.refusalReasonPlaceholder')}
            required
          />
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-advist-border">
          <Button variant="outline" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button
            variant={isDefinitive ? 'danger' : 'outline'}
            onClick={handleRefuse}
            disabled={!reason}
          >
            <Ban size={16} className="mr-2" />
            {isDefinitive
              ? t('signatures.refuseDefinitively')
              : t('signatures.rejectAndRequestChanges')}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// v2: Version History Modal
const VersionHistoryModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  template: any;
}> = ({ isOpen, onClose, template }) => {
  const { t } = useTranslation();
  if (!template) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${t('workflows.versionHistory')} - ${template.name}`}
    >
      <div className="space-y-4">
        <p className="text-sm text-advist-gray900/80">{t('workflows.versionHistoryInfo')}</p>

        <div className="space-y-3">
          {template.versionHistory?.map((version: any, index: number) => (
            <div
              key={version.version}
              className={`p-4 rounded-xl border ${
                index === 0
                  ? 'border-advist-dark bg-advist-surface-dark/30'
                  : 'border-advist-border'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Badge variant={index === 0 ? 'blue' : 'gray'} size="sm">
                    Version {version.version}
                  </Badge>
                  {index === 0 && (
                    <Badge variant="green" size="sm">
                      {t('common.current')}
                    </Badge>
                  )}
                </div>
                <span className="text-sm text-advist-blue-light">
                  {new Date(version.date).toLocaleDateString('fr-FR')}
                </span>
              </div>
              <p className="text-sm text-advist-gray900">{version.changes}</p>
              <p className="text-xs text-advist-blue-light mt-1">
                {t('common.by')} {version.by}
              </p>
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-4 border-t border-advist-border">
          <Button variant="outline" onClick={onClose}>
            {t('common.close')}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// v2: Conditional Rules Modal
const ConditionalRulesModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  template: any;
}> = ({ isOpen, onClose, template }) => {
  const { t } = useTranslation();
  if (!template) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Regles conditionnelles - ${template.name}`}
      size="lg"
    >
      <div className="space-y-4">
        <p className="text-sm text-advist-gray900/80">
          Les regles conditionnelles permettent d'adapter automatiquement le workflow selon le
          contenu du document.
        </p>

        {template.conditionalRules?.length > 0 ? (
          <div className="space-y-3">
            {template.conditionalRules.map((rule: any, index: number) => (
              <div key={index} className="p-4 border border-advist-border rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-advist-surface-dark rounded-xl">
                    <GitMerge size={16} className="text-advist-gray900/80" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-advist-gray900">Si</span>
                      <Badge variant="blue" size="sm">
                        {rule.condition}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <ArrowRight size={14} className="text-advist-blue-light" />
                      <span className="text-sm text-advist-gray900/80">{rule.action}</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm">
                      <Edit2 size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-advist-gray900/70 hover:bg-advist-bg"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-advist-blue-light">
            <GitMerge size={32} className="mx-auto mb-2 opacity-50" />
            <p>{t('workflows.noConditionalRules')}</p>
          </div>
        )}

        <Button variant="outline" className="w-full">
          <Plus size={16} className="mr-2" />
          Ajouter une regle
        </Button>

        <div className="p-4 bg-advist-surface-dark/30 rounded-xl">
          <h4 className="font-medium text-advist-gray900 mb-2">
            {t('workflows.conditionTypesAvailable')}
          </h4>
          <ul className="text-sm text-advist-gray900/80 space-y-1">
            <li>
              • <strong>Montant:</strong> Si montant {'>'} X
            </li>
            <li>
              • <strong>{t('workflows.confidentiality')}</strong> {t('workflows.ifConfidential')}
            </li>
            <li>
              • <strong>{t('workflows.documentType')}</strong> {t('workflows.ifContractInvoice')}
            </li>
            <li>
              • <strong>{t('workflows.department')}</strong> {t('workflows.byDepartment')}
            </li>
            <li>
              • <strong>{t('workflows.metadata')}</strong> {t('workflows.byCustomField')}
            </li>
          </ul>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-advist-border">
          <Button variant="outline" onClick={onClose}>
            {t('common.close')}
          </Button>
          <Button>{t('common.save')}</Button>
        </div>
      </div>
    </Modal>
  );
};

// Interface for metadata field
interface MetadataField {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'select' | 'checkbox';
  required: boolean;
  options?: string[];
  defaultValue?: string;
}

// New Workflow Template Modal - Full featured modal for creating/editing templates
const NewWorkflowTemplateModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  template?: any;
}> = ({ isOpen, onClose, template }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'info' | 'steps' | 'rules' | 'metadata' | 'settings'>(
    'info'
  );

  // Template state
  const [templateName, setTemplateName] = useState(template?.name || '');
  const [templateDescription, setTemplateDescription] = useState(template?.description || '');
  const [steps, setSteps] = useState<WorkflowStep[]>(template?.steps || []);
  const [rules, setRules] = useState<ConditionalRule[]>(
    template?.conditionalRules?.map((r: any, i: number) => ({
      id: `rule_${i}`,
      name: r.condition,
      isActive: true,
      priority: i + 1,
      condition: { type: 'amount', operator: 'greater_than', value: 100000 },
      action: { type: 'add_step', config: { stepName: r.action } },
    })) || []
  );
  const [metadataFields, setMetadataFields] = useState<MetadataField[]>([]);

  // Settings state
  const [fastTrackEnabled, setFastTrackEnabled] = useState(template?.fastTrackEnabled || false);
  const [parallelSignatureEnabled, setParallelSignatureEnabled] = useState(
    template?.parallelSignatureEnabled || false
  );
  const [requireParaphAllPages, setRequireParaphAllPages] = useState(false);
  const [defaultDeadlineDays, setDefaultDeadlineDays] = useState(3);
  const [notifyOnCompletion, setNotifyOnCompletion] = useState(true);
  const [allowDelegation, setAllowDelegation] = useState(true);

  const handleSave = () => {
    console.info('Saving template:', {
      name: templateName,
      description: templateDescription,
      steps,
      rules,
      metadataFields,
      settings: {
        fastTrackEnabled,
        parallelSignatureEnabled,
        requireParaphAllPages,
        defaultDeadlineDays,
        notifyOnCompletion,
        allowDelegation,
      },
    });
    onClose();
  };

  const addMetadataField = () => {
    const newField: MetadataField = {
      id: `field_${Date.now()}`,
      name: '',
      type: 'text',
      required: false,
    };
    setMetadataFields([...metadataFields, newField]);
  };

  const updateMetadataField = (id: string, updates: Partial<MetadataField>) => {
    setMetadataFields(metadataFields.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  };

  const removeMetadataField = (id: string) => {
    setMetadataFields(metadataFields.filter((f) => f.id !== id));
  };

  const tabs = [
    { key: 'info', label: t('common.information'), icon: FileText },
    { key: 'steps', label: t('workflows.steps'), icon: GitBranch, badge: steps.length },
    { key: 'rules', label: t('workflows.rules'), icon: GitMerge, badge: rules.length },
    { key: 'metadata', label: t('workflows.metadata'), icon: Tag, badge: metadataFields.length },
    { key: 'settings', label: t('common.settings'), icon: Settings },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        template ? `${t('common.edit')}: ${template.name}` : t('workflows.newWorkflowTemplate')
      }
      size="xl"
    >
      <div className="flex flex-col h-[70vh]">
        {/* Tabs */}
        <div className="border-b border-advist-border flex-shrink-0">
          <nav className="flex gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as typeof activeTab)}
                  className={`
                    flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all duration-240 relative
                    ${
                      activeTab === tab.key
                        ? 'text-advist-gray900 border-b-2 border-advist-dark'
                        : 'text-advist-gray900/80 hover:text-advist-gray900'
                    }
                  `}
                >
                  <Icon size={16} />
                  {tab.label}
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 bg-advist-surface-dark rounded-full text-xs">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Info Tab */}
          {activeTab === 'info' && (
            <div className="space-y-6">
              <Input
                label={t('workflows.templateName')}
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder={t('workflows.templateNamePlaceholder')}
                required
              />

              <div>
                <label className="block text-sm font-medium text-advist-gray900/80 mb-1.5">
                  {t('common.description')}
                </label>
                <textarea
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                  placeholder={t('workflows.templateDescriptionPlaceholder')}
                  className="w-full px-3 py-2 border border-advist-bg rounded-xl focus:ring-2 focus:ring-advist-gold resize-none"
                  rows={4}
                />
              </div>

              <div className="p-4 bg-advist-bg rounded-xl">
                <h4 className="font-medium text-advist-gray900/80 mb-3">
                  {t('workflows.workflowPreview')}
                </h4>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="px-3 py-1.5 bg-green-50 text-advist-success rounded-full text-sm flex items-center gap-1">
                    <Zap size={14} />
                    {t('workflows.start')}
                  </div>
                  {steps.length > 0 ? (
                    steps.map((step, _index) => (
                      <React.Fragment key={step.id}>
                        <ArrowRight size={16} className="text-advist-blue-light" />
                        <div className="px-3 py-1.5 bg-white border border-advist-bg rounded-full text-sm">
                          {step.name}
                        </div>
                      </React.Fragment>
                    ))
                  ) : (
                    <>
                      <ArrowRight size={16} className="text-advist-blue-light" />
                      <div className="px-3 py-1.5 bg-white border border-dashed border-advist-blue-light rounded-full text-sm text-advist-blue-light">
                        {t('workflows.noSteps')}
                      </div>
                    </>
                  )}
                  <ArrowRight size={16} className="text-advist-blue-light" />
                  <div className="px-3 py-1.5 bg-advist-gold-light text-advist-error rounded-full text-sm flex items-center gap-1">
                    <CheckCircle size={14} />
                    {t('workflows.end')}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Steps Tab */}
          {activeTab === 'steps' && (
            <div className="space-y-4">
              <div className="p-3 bg-advist-gold-light rounded-xl text-sm text-advist-gray900">
                <strong>{t('common.tip')}</strong> {t('workflows.defineValidatorsTip')}
              </div>
              <WorkflowEditor steps={steps} onChange={setSteps} />
            </div>
          )}

          {/* Rules Tab */}
          {activeTab === 'rules' && (
            <UpgradeGate feature="conditionalRules">
              <div className="space-y-4">
                <div className="p-3 bg-advist-surface-dark rounded-xl text-sm text-advist-gray900">
                  <strong>{t('workflows.conditionalRules')}</strong>{' '}
                  {t('workflows.adaptWorkflowTip')}
                </div>
                <ConditionalRules rules={rules} onChange={setRules} />
              </div>
            </UpgradeGate>
          )}

          {/* Metadata Tab */}
          {activeTab === 'metadata' && (
            <div className="space-y-4">
              <div className="p-3 bg-advist-gold-light rounded-xl text-sm text-advist-gold-dark">
                <strong>{t('workflows.metadata')}</strong> {t('workflows.defineCustomFields')}
              </div>

              {metadataFields.length > 0 ? (
                <div className="space-y-3">
                  {metadataFields.map((field) => (
                    <Card key={field.id} className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="flex-1 grid grid-cols-3 gap-4">
                          <Input
                            label={t('workflows.fieldName')}
                            value={field.name}
                            onChange={(e) =>
                              updateMetadataField(field.id, { name: e.target.value })
                            }
                            placeholder={t('workflows.fieldNamePlaceholder')}
                          />
                          <div>
                            <label className="block text-sm font-medium text-advist-gray900/80 mb-1.5">
                              {t('common.type')}
                            </label>
                            <select
                              value={field.type}
                              onChange={(e) =>
                                updateMetadataField(field.id, {
                                  type: e.target.value as MetadataField['type'],
                                })
                              }
                              className="w-full px-3 py-2 border border-advist-bg rounded-xl focus:ring-2 focus:ring-advist-gold"
                            >
                              <option value="text">{t('workflows.fieldTypeText')}</option>
                              <option value="number">{t('workflows.fieldTypeNumber')}</option>
                              <option value="date">{t('common.date')}</option>
                              <option value="select">{t('workflows.fieldTypeSelect')}</option>
                              <option value="checkbox">{t('workflows.checkbox')}</option>
                            </select>
                          </div>
                          <div className="flex items-end gap-4">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id={`required_${field.id}`}
                                checked={field.required}
                                onChange={(e) =>
                                  updateMetadataField(field.id, { required: e.target.checked })
                                }
                                className="w-4 h-4 rounded border-advist-bg text-advist-gray900/80"
                              />
                              <label
                                htmlFor={`required_${field.id}`}
                                className="text-sm text-advist-gray900/80"
                              >
                                {t('common.required')}
                              </label>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => removeMetadataField(field.id)}
                          className="p-2 rounded hover:bg-advist-gold-light"
                        >
                          <Trash2 size={16} className="text-advist-error" />
                        </button>
                      </div>

                      {field.type === 'select' && (
                        <div className="mt-3">
                          <Input
                            label={t('workflows.optionsLabel')}
                            value={field.options?.join(', ') || ''}
                            onChange={(e) =>
                              updateMetadataField(field.id, {
                                options: e.target.value
                                  .split(',')
                                  .map((o) => o.trim())
                                  .filter(Boolean),
                              })
                            }
                            placeholder={t('workflows.optionsPlaceholder')}
                          />
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="p-8 text-center">
                  <Tag size={40} className="mx-auto text-advist-blue-light mb-3" />
                  <h4 className="font-medium text-advist-gray900/80">
                    {t('workflows.noMetadata')}
                  </h4>
                  <p className="text-sm text-advist-blue-light mt-1 mb-4">
                    {t('workflows.addCustomFieldsInfo')}
                  </p>
                </Card>
              )}

              <Button variant="outline" onClick={addMetadataField} className="w-full">
                <Plus size={16} className="mr-2" />
                {t('workflows.addField')}
              </Button>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              {/* Fast Track */}
              <div className="p-4 border border-advist-bg rounded-xl">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-advist-gold-light rounded-xl">
                      <Zap size={20} className="text-advist-gold-dark" />
                    </div>
                    <div>
                      <h4 className="font-medium text-advist-gray900/80">
                        {t('workflows.fastTrackMode')}
                      </h4>
                      <p className="text-sm text-advist-blue-light mt-1">
                        {t('workflows.fastTrackDescription')}
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={fastTrackEnabled}
                      onChange={(e) => setFastTrackEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-advist-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-advist-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-advist-dark"></div>
                  </label>
                </div>
              </div>

              {/* Parallel Signature */}
              <div className="p-4 border border-advist-bg rounded-xl">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-advist-gold-light rounded-xl">
                      <ArrowRightLeft size={20} className="text-advist-gray900" />
                    </div>
                    <div>
                      <h4 className="font-medium text-advist-gray900/80">
                        {t('workflows.parallelSignature')}
                      </h4>
                      <p className="text-sm text-advist-blue-light mt-1">
                        {t('workflows.parallelSignatureDescription')}
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={parallelSignatureEnabled}
                      onChange={(e) => setParallelSignatureEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-advist-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-advist-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-advist-dark"></div>
                  </label>
                </div>
              </div>

              {/* Paraph Settings */}
              <div className="p-4 border border-advist-bg rounded-xl">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-advist-gold-light rounded-xl">
                      <PenTool size={20} className="text-advist-gold-dark" />
                    </div>
                    <div>
                      <h4 className="font-medium text-advist-gray900/80">
                        {t('workflows.requiredParaph')}
                      </h4>
                      <p className="text-sm text-advist-blue-light mt-1">
                        {t('workflows.requiredParaphDescription')}
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={requireParaphAllPages}
                      onChange={(e) => setRequireParaphAllPages(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-advist-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-advist-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-advist-dark"></div>
                  </label>
                </div>
              </div>

              {/* Default Deadline */}
              <div className="grid grid-cols-2 gap-4">
                <Input
                  type="number"
                  label={t('workflows.defaultDeadline')}
                  value={defaultDeadlineDays}
                  onChange={(e) => setDefaultDeadlineDays(Number(e.target.value))}
                  min={1}
                />
              </div>

              {/* Notification & Delegation */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="notifyOnCompletion"
                    checked={notifyOnCompletion}
                    onChange={(e) => setNotifyOnCompletion(e.target.checked)}
                    className="w-4 h-4 rounded border-advist-bg text-advist-gray900/80"
                  />
                  <label htmlFor="notifyOnCompletion" className="text-sm text-advist-gray900/80">
                    {t('workflows.notifyOnCompletion')}
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="allowDelegation"
                    checked={allowDelegation}
                    onChange={(e) => setAllowDelegation(e.target.checked)}
                    className="w-4 h-4 rounded border-advist-bg text-advist-gray900/80"
                  />
                  <label htmlFor="allowDelegation" className="text-sm text-advist-gray900/80">
                    {t('workflows.allowDelegation')}
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-4 border-t border-advist-border flex-shrink-0 px-4 pb-4">
          <div className="text-sm text-advist-blue-light">
            {t('workflows.footerSummary', {
              steps: steps.length,
              rules: rules.length,
              fields: metadataFields.length,
            })}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSave} disabled={!templateName || steps.length === 0}>
              <Save size={16} className="mr-2" />
              {template ? t('common.update') : t('workflows.createTemplate')}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default WorkflowsPage;
