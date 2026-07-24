import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Shield,
  Plus,
  Edit2,
  Trash2,
  Copy,
  Users,
  ChevronDown,
  ChevronRight,
  Lock,
  FileText,
  GitBranch,
  PenTool,
  Settings,
  Archive,
} from 'lucide-react';
import { Button, Card, Modal, Input } from '../../components/ui';

// Permission categories
const PERMISSION_CATEGORIES = {
  documents: {
    label: 'Documents',
    icon: FileText,
    permissions: [
      {
        key: 'documents.view',
        label: 'Voir les documents',
        description: 'Accéder et lire les documents',
      },
      {
        key: 'documents.create',
        label: 'Créer des documents',
        description: 'Importer ou créer de nouveaux documents',
      },
      {
        key: 'documents.edit',
        label: 'Modifier les documents',
        description: 'Modifier les métadonnées et contenu',
      },
      {
        key: 'documents.delete',
        label: 'Supprimer les documents',
        description: 'Supprimer définitivement les documents',
      },
      {
        key: 'documents.share',
        label: 'Partager les documents',
        description: "Partager avec d'autres utilisateurs",
      },
      {
        key: 'documents.export',
        label: 'Exporter les documents',
        description: 'Télécharger les documents',
      },
      {
        key: 'documents.annotate',
        label: 'Annoter les documents',
        description: 'Ajouter des annotations et commentaires',
      },
      {
        key: 'documents.versions',
        label: 'Gérer les versions',
        description: 'Voir et restaurer les versions',
      },
    ],
  },
  workflows: {
    label: 'Workflows',
    icon: GitBranch,
    permissions: [
      { key: 'workflows.view', label: 'Voir les workflows', description: 'Accéder aux workflows' },
      {
        key: 'workflows.create',
        label: 'Créer des workflows',
        description: 'Créer de nouveaux templates de workflow',
      },
      {
        key: 'workflows.edit',
        label: 'Modifier les workflows',
        description: 'Modifier les templates existants',
      },
      {
        key: 'workflows.delete',
        label: 'Supprimer les workflows',
        description: 'Supprimer des workflows',
      },
      {
        key: 'workflows.launch',
        label: 'Lancer des workflows',
        description: 'Démarrer un workflow sur un document',
      },
      {
        key: 'workflows.cancel',
        label: 'Annuler des workflows',
        description: 'Annuler un workflow en cours',
      },
      {
        key: 'workflows.reassign',
        label: 'Réassigner des tâches',
        description: "Déléguer des tâches à d'autres",
      },
    ],
  },
  signatures: {
    label: 'Signatures',
    icon: PenTool,
    permissions: [
      {
        key: 'signatures.view',
        label: 'Voir les signatures',
        description: 'Voir les demandes de signature',
      },
      {
        key: 'signatures.sign',
        label: 'Signer',
        description: 'Apposer sa signature sur les documents',
      },
      {
        key: 'signatures.request',
        label: 'Demander des signatures',
        description: 'Créer des demandes de signature',
      },
      {
        key: 'signatures.manage',
        label: 'Gérer les signatures',
        description: 'Administrer toutes les signatures',
      },
      {
        key: 'signatures.certificates',
        label: 'Voir les certificats',
        description: 'Accéder aux certificats de signature',
      },
    ],
  },
  users: {
    label: 'Utilisateurs',
    icon: Users,
    permissions: [
      {
        key: 'users.view',
        label: 'Voir les utilisateurs',
        description: 'Voir la liste des utilisateurs',
      },
      {
        key: 'users.create',
        label: 'Créer des utilisateurs',
        description: 'Ajouter de nouveaux utilisateurs',
      },
      {
        key: 'users.edit',
        label: 'Modifier les utilisateurs',
        description: 'Modifier les profils utilisateur',
      },
      {
        key: 'users.delete',
        label: 'Désactiver les utilisateurs',
        description: 'Désactiver ou supprimer des comptes',
      },
      {
        key: 'users.roles',
        label: 'Gérer les rôles',
        description: 'Attribuer des rôles aux utilisateurs',
      },
    ],
  },
  admin: {
    label: 'Administration',
    icon: Settings,
    permissions: [
      {
        key: 'admin.settings',
        label: 'Paramètres',
        description: "Accéder aux paramètres de l'organisation",
      },
      {
        key: 'admin.billing',
        label: 'Facturation',
        description: "Gérer l'abonnement et la facturation",
      },
      { key: 'admin.audit', label: "Journal d'audit", description: "Voir les logs d'activité" },
      {
        key: 'admin.export',
        label: 'Export données',
        description: "Exporter les données de l'organisation",
      },
      {
        key: 'admin.integrations',
        label: 'Intégrations',
        description: 'Configurer les intégrations tierces',
      },
    ],
  },
  archives: {
    label: 'Archives',
    icon: Archive,
    permissions: [
      {
        key: 'archives.view',
        label: 'Voir les archives',
        description: 'Accéder aux documents archivés',
      },
      { key: 'archives.archive', label: 'Archiver', description: 'Archiver des documents' },
      {
        key: 'archives.restore',
        label: 'Restaurer',
        description: 'Restaurer des documents archivés',
      },
      {
        key: 'archives.delete',
        label: 'Purger',
        description: 'Supprimer définitivement des archives',
      },
    ],
  },
};

// Default roles
const DEFAULT_ROLES = [
  {
    id: 1,
    name: 'Administrateur',
    description: 'Accès complet à toutes les fonctionnalités',
    color: '#F59E0B',
    isSystem: true,
    usersCount: 2,
    permissions: Object.values(PERMISSION_CATEGORIES).flatMap((cat) =>
      cat.permissions.map((p) => p.key)
    ),
  },
  {
    id: 2,
    name: 'Manager',
    description: 'Gestion des équipes et validation des documents',
    color: '#7C3AED',
    isSystem: true,
    usersCount: 5,
    permissions: [
      'documents.view',
      'documents.create',
      'documents.edit',
      'documents.share',
      'documents.export',
      'documents.annotate',
      'workflows.view',
      'workflows.create',
      'workflows.launch',
      'workflows.reassign',
      'signatures.view',
      'signatures.sign',
      'signatures.request',
      'users.view',
      'archives.view',
      'archives.archive',
    ],
  },
  {
    id: 3,
    name: 'Validateur',
    description: 'Validation et signature des documents',
    color: '#2563EB',
    isSystem: true,
    usersCount: 8,
    permissions: [
      'documents.view',
      'documents.annotate',
      'documents.export',
      'workflows.view',
      'signatures.view',
      'signatures.sign',
      'archives.view',
    ],
  },
  {
    id: 4,
    name: 'Utilisateur',
    description: 'Accès de base pour consulter et soumettre des documents',
    color: '#6B7280',
    isSystem: true,
    usersCount: 25,
    permissions: [
      'documents.view',
      'documents.create',
      'documents.export',
      'workflows.view',
      'workflows.launch',
      'signatures.view',
      'signatures.sign',
    ],
  },
  {
    id: 5,
    name: 'Comptabilité',
    description: 'Rôle personnalisé pour le département comptabilité',
    color: '#059669',
    isSystem: false,
    usersCount: 4,
    permissions: [
      'documents.view',
      'documents.create',
      'documents.edit',
      'documents.export',
      'documents.annotate',
      'workflows.view',
      'workflows.launch',
      'signatures.view',
      'signatures.sign',
      'signatures.request',
      'archives.view',
      'archives.archive',
    ],
  },
];

interface Role {
  id: number;
  name: string;
  description: string;
  color: string;
  isSystem: boolean;
  usersCount: number;
  permissions: string[];
}

export const RolesPage: React.FC = () => {
  const { t } = useTranslation();
  const [roles, setRoles] = useState<Role[]>(DEFAULT_ROLES);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<string[]>(
    Object.keys(PERMISSION_CATEGORIES)
  );

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    );
  };

  const handleEditRole = (role: Role) => {
    setSelectedRole(role);
    setShowEditModal(true);
  };

  const handleDeleteRole = (roleId: number) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce rôle ?')) {
      setRoles((prev) => prev.filter((r) => r.id !== roleId));
    }
  };

  const handleDuplicateRole = (role: Role) => {
    const newRole: Role = {
      ...role,
      id: Date.now(),
      name: `${role.name} (copie)`,
      isSystem: false,
      usersCount: 0,
    };
    setRoles((prev) => [...prev, newRole]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-advist-gray900">
            {t('roles.title', 'Rôles & Permissions')}
          </h1>
          <p className="text-advist-gray900 mt-1">
            {t('roles.subtitle', 'Gérez les rôles et leurs permissions')}
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus size={16} className="mr-2" />
          {t('roles.create', 'Nouveau rôle')}
        </Button>
      </div>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {roles.map((role) => (
          <Card key={role.id} className="p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${role.color}20` }}
                >
                  <Shield size={20} style={{ color: role.color }} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-advist-gray900">{role.name}</h3>
                    {role.isSystem && (
                      <Lock size={12} className="text-advist-blue-light" title="Rôle système" />
                    )}
                  </div>
                  <p className="text-xs text-advist-blue-light">{role.usersCount} utilisateur(s)</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleDuplicateRole(role)}
                  className="p-1.5 rounded hover:bg-advist-bg"
                  title="Dupliquer"
                >
                  <Copy size={14} className="text-advist-gray900" />
                </button>
                <button
                  onClick={() => handleEditRole(role)}
                  className="p-1.5 rounded hover:bg-advist-bg"
                  title="Modifier"
                >
                  <Edit2 size={14} className="text-advist-gray900" />
                </button>
                {!role.isSystem && (
                  <button
                    onClick={() => handleDeleteRole(role.id)}
                    className="p-1.5 rounded hover:bg-advist-gold-light"
                    title="Supprimer"
                  >
                    <Trash2 size={14} className="text-advist-error" />
                  </button>
                )}
              </div>
            </div>

            <p className="text-sm text-advist-gray900 mb-4">{role.description}</p>

            <div className="border-t border-advist-bg pt-4">
              <p className="text-xs text-advist-blue-light mb-2">
                {role.permissions.length} permission(s) actives
              </p>
              <div className="flex flex-wrap gap-1">
                {Object.entries(PERMISSION_CATEGORIES)
                  .slice(0, 4)
                  .map(([key, cat]) => {
                    const count = role.permissions.filter((p) => p.startsWith(key)).length;
                    const total = cat.permissions.length;
                    if (count === 0) return null;
                    return (
                      <span
                        key={key}
                        className="px-2 py-0.5 bg-advist-bg text-advist-gray900 text-xs rounded"
                      >
                        {cat.label}: {count}/{total}
                      </span>
                    );
                  })}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Permissions Reference */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-advist-gray900 mb-4">
          {t('roles.permissionsReference', 'Référence des permissions')}
        </h2>

        <div className="space-y-4">
          {Object.entries(PERMISSION_CATEGORIES).map(([key, category]) => {
            const Icon = category.icon;
            const isExpanded = expandedCategories.includes(key);

            return (
              <div key={key} className="border border-advist-bg rounded-xl overflow-hidden">
                <button
                  onClick={() => toggleCategory(key)}
                  className="w-full flex items-center justify-between p-4 bg-advist-bg hover:bg-advist-bg transition-all duration-240"
                >
                  <div className="flex items-center gap-3">
                    <Icon size={20} className="text-advist-gray900" />
                    <span className="font-medium text-advist-gray900">{category.label}</span>
                    <span className="text-xs text-advist-blue-light">
                      ({category.permissions.length} permissions)
                    </span>
                  </div>
                  {isExpanded ? (
                    <ChevronDown size={16} className="text-advist-blue-light" />
                  ) : (
                    <ChevronRight size={16} className="text-advist-blue-light" />
                  )}
                </button>

                {isExpanded && (
                  <div className="p-4 divide-y divide-advist-bg">
                    {category.permissions.map((permission) => (
                      <div key={permission.key} className="py-3 first:pt-0 last:pb-0">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-advist-gray900">{permission.label}</p>
                            <p className="text-sm text-advist-blue-light">
                              {permission.description}
                            </p>
                          </div>
                          <code className="px-2 py-1 bg-advist-bg text-xs text-advist-gray900 rounded">
                            {permission.key}
                          </code>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Create Role Modal */}
      <RoleFormModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSave={(role) => {
          setRoles((prev) => [...prev, { ...role, id: Date.now() }]);
          setShowCreateModal(false);
        }}
      />

      {/* Edit Role Modal */}
      {selectedRole && (
        <RoleFormModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedRole(null);
          }}
          role={selectedRole}
          onSave={(role) => {
            setRoles((prev) => prev.map((r) => (r.id === role.id ? role : r)));
            setShowEditModal(false);
            setSelectedRole(null);
          }}
        />
      )}
    </div>
  );
};

// Role Form Modal
const RoleFormModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  role?: Role;
  onSave: (role: Role) => void;
}> = ({ isOpen, onClose, role, onSave }) => {
  const { t } = useTranslation();
  const isEditing = !!role;

  const [formData, setFormData] = useState({
    id: role?.id || 0,
    name: role?.name || '',
    description: role?.description || '',
    color: role?.color || '#6B7280',
    isSystem: role?.isSystem || false,
    usersCount: role?.usersCount || 0,
    permissions: role?.permissions || [],
  });

  const [expandedCategories, setExpandedCategories] = useState<string[]>(
    Object.keys(PERMISSION_CATEGORIES)
  );

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    );
  };

  const togglePermission = (permissionKey: string) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permissionKey)
        ? prev.permissions.filter((p) => p !== permissionKey)
        : [...prev.permissions, permissionKey],
    }));
  };

  const toggleAllInCategory = (categoryKey: string, checked: boolean) => {
    const category = PERMISSION_CATEGORIES[categoryKey as keyof typeof PERMISSION_CATEGORIES];
    const categoryPermissions = category.permissions.map((p) => p.key);

    setFormData((prev) => ({
      ...prev,
      permissions: checked
        ? [...new Set([...prev.permissions, ...categoryPermissions])]
        : prev.permissions.filter((p) => !categoryPermissions.includes(p)),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData as Role);
  };

  const COLORS = [
    '#F59E0B',
    '#EA580C',
    '#CA8A04',
    '#16A34A',
    '#059669',
    '#0891B2',
    '#2563EB',
    '#7C3AED',
    '#C026D3',
    '#6B7280',
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? t('roles.edit', 'Modifier le rôle') : t('roles.create', 'Nouveau rôle')}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            label={t('roles.name', 'Nom du rôle')}
            value={formData.name}
            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="Ex: Chef de projet"
            required
            disabled={formData.isSystem}
          />
          <div>
            <label className="block text-sm font-medium text-advist-gray900 mb-1.5">
              {t('roles.color', 'Couleur')}
            </label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, color }))}
                  className={`w-8 h-8 rounded-xl border-2 transition-transform ${
                    formData.color === color ? 'border-advist-dark scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-advist-gray900 mb-1.5">
            {t('roles.description', 'Description')}
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="Description du rôle..."
            className="w-full px-3 py-2 border border-advist-bg rounded-xl focus:ring-2 focus:ring-advist-gold resize-none"
            rows={2}
          />
        </div>

        {/* Permissions */}
        <div>
          <label className="block text-sm font-medium text-advist-gray900 mb-3">
            {t('roles.permissions', 'Permissions')}
          </label>

          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
            {Object.entries(PERMISSION_CATEGORIES).map(([key, category]) => {
              const Icon = category.icon;
              const isExpanded = expandedCategories.includes(key);
              const categoryPermissions = category.permissions.map((p) => p.key);
              const selectedCount = formData.permissions.filter((p) =>
                categoryPermissions.includes(p)
              ).length;
              const allSelected = selectedCount === categoryPermissions.length;

              return (
                <div key={key} className="border border-advist-bg rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between p-3 bg-advist-bg">
                    <button
                      type="button"
                      onClick={() => toggleCategory(key)}
                      className="flex items-center gap-2 text-left flex-1"
                    >
                      {isExpanded ? (
                        <ChevronDown size={16} className="text-advist-blue-light" />
                      ) : (
                        <ChevronRight size={16} className="text-advist-blue-light" />
                      )}
                      <Icon size={18} className="text-advist-gray900" />
                      <span className="font-medium text-advist-gray900">{category.label}</span>
                      <span className="text-xs text-advist-blue-light">
                        ({selectedCount}/{categoryPermissions.length})
                      </span>
                    </button>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={(e) => toggleAllInCategory(key, e.target.checked)}
                        className="w-4 h-4 rounded border-advist-bg text-advist-gray900"
                      />
                      <span className="text-xs text-advist-blue-light">Tous</span>
                    </label>
                  </div>

                  {isExpanded && (
                    <div className="p-3 space-y-2">
                      {category.permissions.map((permission) => (
                        <label
                          key={permission.key}
                          className="flex items-start gap-3 p-2 rounded hover:bg-advist-bg cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={formData.permissions.includes(permission.key)}
                            onChange={() => togglePermission(permission.key)}
                            className="w-4 h-4 mt-0.5 rounded border-advist-bg text-advist-gray900"
                          />
                          <div>
                            <p className="text-sm font-medium text-advist-gray900">
                              {permission.label}
                            </p>
                            <p className="text-xs text-advist-blue-light">
                              {permission.description}
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center pt-4 border-t border-advist-bg">
          <p className="text-sm text-advist-blue-light">
            {formData.permissions.length} permission(s) sélectionnée(s)
          </p>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              {t('common.cancel', 'Annuler')}
            </Button>
            <Button type="submit">
              {isEditing ? t('common.save', 'Enregistrer') : t('roles.create', 'Créer le rôle')}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default RolesPage;
