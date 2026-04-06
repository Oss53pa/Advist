import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Users,
  Plus,
  MoreVertical,
  Mail,
  Phone,
  Shield,
  UserCheck,
  UserX,
  Edit2,
  Trash2,
  Download,
  Upload,
} from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';
import { Button, Input, Card, Badge, Modal, StatsCard, PageHeader, SearchInput, FilterSelect, ViewModeToggle } from '../../components/ui';

interface TeamMember {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'manager' | 'validator' | 'user';
  department?: string;
  status: 'active' | 'inactive' | 'pending';
  avatar?: string;
  created_at: string;
  last_login?: string;
}

// Mock data
const MOCK_USERS: TeamMember[] = [
  {
    id: 1,
    first_name: 'Jean',
    last_name: 'Dupont',
    email: 'jean.dupont@advist.com',
    phone: '+33 6 12 34 56 78',
    role: 'admin',
    department: 'Direction',
    status: 'active',
    created_at: '2024-01-15',
    last_login: '2024-11-27',
  },
  {
    id: 2,
    first_name: 'Marie',
    last_name: 'Martin',
    email: 'marie.martin@advist.com',
    phone: '+33 6 23 45 67 89',
    role: 'manager',
    department: 'Ressources Humaines',
    status: 'active',
    created_at: '2024-02-20',
    last_login: '2024-11-26',
  },
  {
    id: 3,
    first_name: 'Pierre',
    last_name: 'Bernard',
    email: 'pierre.bernard@advist.com',
    role: 'validator',
    department: 'Finance',
    status: 'active',
    created_at: '2024-03-10',
    last_login: '2024-11-25',
  },
  {
    id: 4,
    first_name: 'Sophie',
    last_name: 'Petit',
    email: 'sophie.petit@advist.com',
    role: 'user',
    department: 'Marketing',
    status: 'active',
    created_at: '2024-04-05',
    last_login: '2024-11-24',
  },
  {
    id: 5,
    first_name: 'Lucas',
    last_name: 'Robert',
    email: 'lucas.robert@advist.com',
    role: 'user',
    department: 'Technique',
    status: 'pending',
    created_at: '2024-11-20',
  },
  {
    id: 6,
    first_name: 'Emma',
    last_name: 'Moreau',
    email: 'emma.moreau@advist.com',
    role: 'user',
    department: 'Commercial',
    status: 'inactive',
    created_at: '2024-05-15',
    last_login: '2024-09-10',
  },
];

const ROLE_CONFIG = {
  admin: { label: 'Administrateur', color: 'red' as const, icon: Shield },
  manager: { label: 'Manager', color: 'purple' as const, icon: UserCheck },
  validator: { label: 'Validateur', color: 'blue' as const, icon: UserCheck },
  user: { label: 'Utilisateur', color: 'gray' as const, icon: Users },
};

const STATUS_CONFIG = {
  active: { label: 'Actif', color: 'green' as const },
  inactive: { label: 'Inactif', color: 'gray' as const },
  pending: { label: 'En attente', color: 'yellow' as const },
};

export const UsersPage: React.FC = () => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<TeamMember | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const filteredUsers = MOCK_USERS.filter((user) => {
    const matchesSearch =
      `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.department?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    const matchesStatus = selectedStatus === 'all' || user.status === selectedStatus;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const stats = {
    total: MOCK_USERS.length,
    active: MOCK_USERS.filter((u) => u.status === 'active').length,
    pending: MOCK_USERS.filter((u) => u.status === 'pending').length,
    admins: MOCK_USERS.filter((u) => u.role === 'admin').length,
  };

  const handleEditUser = (user: TeamMember) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={t('users.title')}
        subtitle={t('users.subtitle')}
        actions={
          <>
            <Button variant="outline" size="sm">
              <Upload size={16} className="mr-2" />
              {t('common.import')}
            </Button>
            <Button variant="outline" size="sm">
              <Download size={16} className="mr-2" />
              {t('common.export')}
            </Button>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus size={16} className="mr-2" />
              {t('users.newUser')}
            </Button>
          </>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          icon={Users}
          label={t('users.totalUsers', 'Total utilisateurs')}
          value={stats.total}
          color="blue"
        />
        <StatsCard
          icon={UserCheck}
          label={t('users.activeUsers', 'Utilisateurs actifs')}
          value={stats.active}
          color="green"
        />
        <StatsCard
          icon={UserX}
          label={t('users.pending')}
          value={stats.pending}
          color="yellow"
        />
        <StatsCard
          icon={Shield}
          label={t('users.administrators', 'Administrateurs')}
          value={stats.admins}
          color="red"
        />
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder={t('users.search')}
            className="flex-1"
          />
          <div className="flex flex-wrap items-center gap-2">
            <FilterSelect
              value={selectedRole}
              onChange={setSelectedRole}
              allLabel={t('users.allRoles', 'Tous les roles')}
              options={[
                { value: 'admin', label: t('users.role.admin') },
                { value: 'manager', label: t('users.role.manager') },
                { value: 'validator', label: t('users.role.validator') },
                { value: 'user', label: t('users.role.user') },
              ]}
            />
            <FilterSelect
              value={selectedStatus}
              onChange={setSelectedStatus}
              allLabel={t('users.allStatuses', 'Tous les statuts')}
              options={[
                { value: 'active', label: t('users.status.active') },
                { value: 'inactive', label: t('users.status.inactive') },
                { value: 'pending', label: t('users.status.pending') },
              ]}
            />
            <ViewModeToggle value={viewMode} onChange={setViewMode} />
          </div>
        </div>
      </Card>

      {/* Users List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map((user) => (
            <UserCard key={user.id} user={user} onEdit={handleEditUser} />
          ))}
        </div>
      ) : (
        <UsersTable users={filteredUsers} onEdit={handleEditUser} />
      )}

      {filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <Users size={48} className="mx-auto text-advist-blue-light mb-4" />
          <h3 className="text-lg font-medium text-advist-gray900">{t('users.noUsers')}</h3>
          <p className="text-advist-gray900 mt-1">
            {t('users.noUsersDescription', 'Modifiez vos filtres ou ajoutez un nouvel utilisateur')}
          </p>
        </div>
      )}

      {/* Create User Modal */}
      <CreateUserModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />

      {/* Edit User Modal */}
      {selectedUser && (
        <EditUserModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedUser(null);
          }}
          user={selectedUser}
        />
      )}
    </div>
  );
};

// User Card Component
const UserCard: React.FC<{
  user: TeamMember;
  onEdit: (user: TeamMember) => void;
}> = ({ user, onEdit }) => {
  const { t } = useTranslation();
  const [showMenu, setShowMenu] = useState(false);
  const roleConfig = ROLE_CONFIG[user.role];
  const statusConfig = STATUS_CONFIG[user.status];

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Avatar
            name={`${user.first_name} ${user.last_name}`}
            src={user.avatar}
            size="lg"
          />
          <div>
            <h3 className="font-semibold text-advist-gray900">
              {user.first_name} {user.last_name}
            </h3>
            <p className="text-sm text-advist-gray900">{user.department}</p>
          </div>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 rounded hover:bg-advist-bg"
          >
            <MoreVertical size={16} className="text-advist-gray900" />
          </button>
          {showMenu && (
            <>
              <div className="fixed inset-0" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-lg border border-advist-border py-1 z-10">
                <button
                  onClick={() => {
                    onEdit(user);
                    setShowMenu(false);
                  }}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-advist-gray900 hover:bg-advist-bg"
                >
                  <Edit2 size={14} />
                  {t('common.edit')}
                </button>
                <button className="flex items-center gap-2 w-full px-4 py-2 text-sm text-advist-gray900 hover:bg-advist-bg">
                  <Mail size={14} />
                  {t('users.sendEmail')}
                </button>
                <button className="flex items-center gap-2 w-full px-4 py-2 text-sm text-advist-error hover:bg-advist-gold-light">
                  <Trash2 size={14} />
                  {t('common.delete')}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex items-center gap-2 text-sm text-advist-gray900">
          <Mail size={14} />
          <span className="truncate">{user.email}</span>
        </div>
        {user.phone && (
          <div className="flex items-center gap-2 text-sm text-advist-gray900">
            <Phone size={14} />
            <span>{user.phone}</span>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <Badge variant={roleConfig.color} size="sm">
          {t(`users.role.${user.role}`)}
        </Badge>
        <Badge variant={statusConfig.color} size="sm">
          {t(`users.status.${user.status}`)}
        </Badge>
      </div>

      {user.last_login && (
        <div className="mt-3 pt-3 border-t border-advist-border">
          <p className="text-xs text-advist-blue-light">
            {t('users.lastLogin')}: {new Date(user.last_login).toLocaleDateString('fr-FR')}
          </p>
        </div>
      )}
    </Card>
  );
};

// Users Table Component
const UsersTable: React.FC<{
  users: TeamMember[];
  onEdit: (user: TeamMember) => void;
}> = ({ users, onEdit }) => {
  const { t } = useTranslation();
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-advist-bg">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-advist-gray900">
                {t('users.user')}
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-advist-gray900">
                {t('users.email')}
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-advist-gray900">
                {t('users.department')}
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-advist-gray900">
                {t('users.role')}
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-advist-gray900">
                {t('users.statusLabel')}
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-advist-gray900">
                {t('users.lastLogin')}
              </th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-advist-gray900">
                {t('common.actions')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-advist-bg">
            {users.map((user) => {
              const roleConfig = ROLE_CONFIG[user.role];
              const statusConfig = STATUS_CONFIG[user.status];

              return (
                <tr key={user.id} className="hover:bg-advist-bg/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar
                        name={`${user.first_name} ${user.last_name}`}
                        src={user.avatar}
                        size="sm"
                      />
                      <span className="font-medium text-advist-gray900">
                        {user.first_name} {user.last_name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-advist-gray900">{user.email}</td>
                  <td className="px-4 py-3 text-sm text-advist-gray900">
                    {user.department || '-'}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={roleConfig.color} size="sm">
                      {t(`users.role.${user.role}`)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={statusConfig.color} size="sm">
                      {t(`users.status.${user.status}`)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-advist-gray900">
                    {user.last_login
                      ? new Date(user.last_login).toLocaleDateString('fr-FR')
                      : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onEdit(user)}
                        className="p-1.5 rounded hover:bg-advist-bg"
                        title={t('common.edit')}
                      >
                        <Edit2 size={14} className="text-advist-gray900" />
                      </button>
                      <button
                        className="p-1.5 rounded hover:bg-advist-gold-light"
                        title={t('common.delete')}
                      >
                        <Trash2 size={14} className="text-advist-error" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

// Create User Modal
const CreateUserModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    role: 'user',
    department: '',
    send_invitation: true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log('Creating user:', formData);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('users.newUser')} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label={t('users.firstName')}
            value={formData.first_name}
            onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
            required
          />
          <Input
            label={t('users.lastName')}
            value={formData.last_name}
            onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
            required
          />
        </div>

        <Input
          label={t('users.email')}
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />

        <Input
          label={t('users.phone')}
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-advist-gray900 mb-1">
              {t('users.role')}
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-3 py-2 border border-advist-border rounded-xl focus:outline-none focus:ring-2 focus:ring-advist-gold"
            >
              <option value="user">{t('users.role.user')}</option>
              <option value="validator">{t('users.role.validator')}</option>
              <option value="manager">{t('users.role.manager')}</option>
              <option value="admin">{t('users.role.admin')}</option>
            </select>
          </div>
          <Input
            label={t('users.department')}
            value={formData.department}
            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="send_invitation"
            checked={formData.send_invitation}
            onChange={(e) =>
              setFormData({ ...formData, send_invitation: e.target.checked })
            }
            className="w-4 h-4 rounded border-advist-border text-advist-gray900 focus:ring-advist-gold"
          />
          <label htmlFor="send_invitation" className="text-sm text-advist-gray900">
            {t('users.sendInvitation')}
          </label>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-advist-border">
          <Button type="button" variant="outline" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button type="submit">
            <Plus size={16} className="mr-2" />
            {t('users.createUser')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// Edit User Modal
const EditUserModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  user: TeamMember;
}> = ({ isOpen, onClose, user }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    phone: user.phone || '',
    role: user.role,
    department: user.department || '',
    status: user.status,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log('Updating user:', formData);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('users.editUser')} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center gap-4 pb-4 border-b border-advist-border">
          <Avatar
            name={`${formData.first_name} ${formData.last_name}`}
            src={user.avatar}
            size="xl"
          />
          <div>
            <h3 className="font-semibold text-advist-gray900">
              {formData.first_name} {formData.last_name}
            </h3>
            <p className="text-sm text-advist-gray900">
              {t('users.memberSince')} {new Date(user.created_at).toLocaleDateString('fr-FR')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label={t('users.firstName')}
            value={formData.first_name}
            onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
            required
          />
          <Input
            label={t('users.lastName')}
            value={formData.last_name}
            onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
            required
          />
        </div>

        <Input
          label={t('users.email')}
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />

        <Input
          label={t('users.phone')}
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        />

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-advist-gray900 mb-1">
              {t('users.role')}
            </label>
            <select
              value={formData.role}
              onChange={(e) =>
                setFormData({ ...formData, role: e.target.value as TeamMember['role'] })
              }
              className="w-full px-3 py-2 border border-advist-border rounded-xl focus:outline-none focus:ring-2 focus:ring-advist-gold"
            >
              <option value="user">{t('users.role.user')}</option>
              <option value="validator">{t('users.role.validator')}</option>
              <option value="manager">{t('users.role.manager')}</option>
              <option value="admin">{t('users.role.admin')}</option>
            </select>
          </div>
          <Input
            label={t('users.department')}
            value={formData.department}
            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
          />
          <div>
            <label className="block text-sm font-medium text-advist-gray900 mb-1">
              {t('users.statusLabel')}
            </label>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value as TeamMember['status'] })
              }
              className="w-full px-3 py-2 border border-advist-border rounded-xl focus:outline-none focus:ring-2 focus:ring-advist-gold"
            >
              <option value="active">{t('users.status.active')}</option>
              <option value="inactive">{t('users.status.inactive')}</option>
              <option value="pending">{t('users.status.pending')}</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-advist-border">
          <Button type="button" variant="outline" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button type="submit">{t('common.saveChanges')}</Button>
        </div>
      </form>
    </Modal>
  );
};

export default UsersPage;
