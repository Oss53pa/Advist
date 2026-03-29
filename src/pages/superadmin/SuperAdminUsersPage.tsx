import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Users,
  Search,
  Filter,
  Download,
  RefreshCw,
  MoreVertical,
  Mail,
  Phone,
  Building2,
  Shield,
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  UserX,
  UserCog,
  Eye,
  Ban,
  Key,
  Clock,
  Calendar,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Smartphone,
  Globe,
  LogIn,
  Trash2,
  Edit,
  Send,
} from 'lucide-react';
import { Card, Button, Badge, Modal, Avatar } from '../../components/ui';

// Types
interface GlobalUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'user' | 'admin' | 'super_admin';
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  tenant: {
    id: string;
    name: string;
    plan: string;
  };
  mfaEnabled: boolean;
  lastLogin?: Date;
  createdAt: Date;
  loginCount: number;
  documentsCreated: number;
  signaturesCount: number;
}

// Mock data
const mockUsers: GlobalUser[] = [
  {
    id: '1',
    email: 'admin@sgci.com',
    firstName: 'Amadou',
    lastName: 'Diallo',
    phone: '+225 07 08 09 10 11',
    role: 'admin',
    status: 'active',
    tenant: { id: 't1', name: 'Société Générale CI', plan: 'Enterprise' },
    mfaEnabled: true,
    lastLogin: new Date(Date.now() - 1000 * 60 * 30),
    createdAt: new Date('2024-01-15'),
    loginCount: 234,
    documentsCreated: 156,
    signaturesCount: 89,
  },
  {
    id: '2',
    email: 'dg@orange-ci.com',
    firstName: 'Fatou',
    lastName: 'Koné',
    phone: '+225 01 02 03 04 05',
    role: 'admin',
    status: 'active',
    tenant: { id: 't2', name: 'Orange Côte d\'Ivoire', plan: 'Enterprise' },
    mfaEnabled: true,
    lastLogin: new Date(Date.now() - 1000 * 60 * 120),
    createdAt: new Date('2024-02-20'),
    loginCount: 189,
    documentsCreated: 98,
    signaturesCount: 67,
  },
  {
    id: '3',
    email: 'finance@bceao.int',
    firstName: 'Moussa',
    lastName: 'Traoré',
    role: 'user',
    status: 'active',
    tenant: { id: 't3', name: 'BCEAO', plan: 'Enterprise' },
    mfaEnabled: true,
    lastLogin: new Date(Date.now() - 1000 * 60 * 60),
    createdAt: new Date('2024-03-10'),
    loginCount: 145,
    documentsCreated: 78,
    signaturesCount: 45,
  },
  {
    id: '4',
    email: 'user@ecobank.ml',
    firstName: 'Ibrahim',
    lastName: 'Sanogo',
    role: 'user',
    status: 'active',
    tenant: { id: 't4', name: 'Ecobank Mali', plan: 'Business' },
    mfaEnabled: false,
    lastLogin: new Date(Date.now() - 1000 * 60 * 45),
    createdAt: new Date('2024-04-05'),
    loginCount: 67,
    documentsCreated: 34,
    signaturesCount: 23,
  },
  {
    id: '5',
    email: 'juridique@nsia.ci',
    firstName: 'Aïcha',
    lastName: 'Coulibaly',
    phone: '+225 05 06 07 08 09',
    role: 'admin',
    status: 'inactive',
    tenant: { id: 't5', name: 'NSIA Assurances', plan: 'Business' },
    mfaEnabled: true,
    lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15),
    createdAt: new Date('2024-05-12'),
    loginCount: 45,
    documentsCreated: 23,
    signaturesCount: 12,
  },
  {
    id: '6',
    email: 'contact@startup.ci',
    firstName: 'Jean',
    lastName: 'Kouassi',
    role: 'admin',
    status: 'suspended',
    tenant: { id: 't6', name: 'Startup XYZ', plan: 'Starter' },
    mfaEnabled: false,
    lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
    createdAt: new Date('2024-06-01'),
    loginCount: 12,
    documentsCreated: 5,
    signaturesCount: 2,
  },
  {
    id: '7',
    email: 'nouveau@test.com',
    firstName: 'Marie',
    lastName: 'Bamba',
    role: 'user',
    status: 'pending',
    tenant: { id: 't7', name: 'Test Organisation', plan: 'Starter' },
    mfaEnabled: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
    loginCount: 0,
    documentsCreated: 0,
    signaturesCount: 0,
  },
];

const userStats = [
  { label: 'Total utilisateurs', value: '1,234', icon: Users, color: 'bg-primary-50 text-primary-900' },
  { label: 'Actifs (30j)', value: '892', icon: UserCheck, color: 'bg-green-50 text-primary-900' },
  { label: 'Suspendus', value: '23', icon: UserX, color: 'bg-red-50 text-red-600' },
  { label: '2FA activé', value: '89%', icon: Smartphone, color: 'bg-primary-50 text-primary-900' },
];

export const SuperAdminUsersPage: React.FC = () => {
  const { t } = useTranslation();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTenant, setFilterTenant] = useState('all');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedUser, setSelectedUser] = useState<GlobalUser | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1500);
  };

  const formatTimeAgo = (date?: Date) => {
    if (!date) return 'Jamais';
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return 'À l\'instant';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `Il y a ${minutes}min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Il y a ${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `Il y a ${days}j`;
    return date.toLocaleDateString('fr-FR');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">Actif</Badge>;
      case 'inactive':
        return <Badge variant="default">Inactif</Badge>;
      case 'suspended':
        return <Badge variant="danger">Suspendu</Badge>;
      case 'pending':
        return <Badge variant="warning">En attente</Badge>;
      default:
        return <Badge>Inconnu</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'super_admin':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary-100 text-primary-800 rounded-full text-xs font-medium">
            <ShieldCheck size={12} />
            Super Admin
          </span>
        );
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary-100 text-primary-800 rounded-full text-xs font-medium">
            <Shield size={12} />
            Admin
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full text-xs font-medium">
            <Users size={12} />
            Utilisateur
          </span>
        );
    }
  };

  const getPlanBadge = (plan: string) => {
    switch (plan) {
      case 'Enterprise':
        return <Badge variant="primary">Enterprise</Badge>;
      case 'Business':
        return <Badge variant="warning">Business</Badge>;
      default:
        return <Badge variant="default">Starter</Badge>;
    }
  };

  // Filter users
  const filteredUsers = mockUsers.filter((user) => {
    const matchesSearch =
      searchQuery === '' ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.tenant.name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTenant = filterTenant === 'all' || user.tenant.id === filterTenant;
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;

    return matchesSearch && matchesTenant && matchesRole && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Get unique tenants for filter
  const uniqueTenants = Array.from(new Set(mockUsers.map((u) => JSON.stringify(u.tenant)))).map(
    (t) => JSON.parse(t)
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary-900">Utilisateurs globaux</h1>
          <p className="text-primary-600 mt-1">
            Gestion de tous les utilisateurs de la plateforme ADVIST
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw size={16} className={`mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button variant="outline">
            <Download size={16} className="mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {userStats.map((stat, index) => (
          <Card key={index} className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-primary-600">{stat.label}</p>
                <p className="text-2xl font-bold text-primary-900 mt-1">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-xl ${stat.color}`}>
                <stat.icon size={24} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 min-w-[250px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-400" />
            <input
              type="text"
              placeholder="Rechercher par nom, email ou organisation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-primary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-900"
            />
          </div>

          {/* Tenant filter */}
          <select
            value={filterTenant}
            onChange={(e) => setFilterTenant(e.target.value)}
            className="px-3 py-2 border border-primary-200 rounded-xl focus:outline-none text-sm"
          >
            <option value="all">Toutes les organisations</option>
            {uniqueTenants.map((tenant) => (
              <option key={tenant.id} value={tenant.id}>
                {tenant.name}
              </option>
            ))}
          </select>

          {/* Role filter */}
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-3 py-2 border border-primary-200 rounded-xl focus:outline-none text-sm"
          >
            <option value="all">Tous les rôles</option>
            <option value="admin">Administrateurs</option>
            <option value="user">Utilisateurs</option>
          </select>

          {/* Status filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-primary-200 rounded-xl focus:outline-none text-sm"
          >
            <option value="all">Tous les statuts</option>
            <option value="active">Actifs</option>
            <option value="inactive">Inactifs</option>
            <option value="suspended">Suspendus</option>
            <option value="pending">En attente</option>
          </select>

          <span className="text-sm text-primary-500">
            {filteredUsers.length} utilisateur{filteredUsers.length > 1 ? 's' : ''}
          </span>
        </div>
      </Card>

      {/* Users Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-primary-50 border-b border-primary-200">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-medium text-primary-600">
                  Utilisateur
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-primary-600">
                  Organisation
                </th>
                <th className="text-center py-3 px-4 text-sm font-medium text-primary-600">Rôle</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-primary-600">Statut</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-primary-600">2FA</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-primary-600">
                  Dernière connexion
                </th>
                <th className="text-center py-3 px-4 text-sm font-medium text-primary-600">
                  Activité
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-primary-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary-100">
              {paginatedUsers.map((user) => (
                <tr key={user.id} className="hover:bg-primary-50 transition-colors">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={`${user.firstName} ${user.lastName}`} size="sm" />
                      <div>
                        <p className="font-medium text-primary-900">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-sm text-primary-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <Building2 size={14} className="text-primary-400" />
                      <span className="text-sm text-primary-900">{user.tenant.name}</span>
                    </div>
                    <div className="mt-1">{getPlanBadge(user.tenant.plan)}</div>
                  </td>
                  <td className="py-4 px-4 text-center">{getRoleBadge(user.role)}</td>
                  <td className="py-4 px-4 text-center">{getStatusBadge(user.status)}</td>
                  <td className="py-4 px-4 text-center">
                    {user.mfaEnabled ? (
                      <CheckCircle size={18} className="mx-auto text-primary-900" />
                    ) : (
                      <XCircle size={18} className="mx-auto text-primary-300" />
                    )}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-1.5 text-sm text-primary-600">
                      <Clock size={14} />
                      {formatTimeAgo(user.lastLogin)}
                    </div>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <div className="text-xs text-primary-500">
                      <span className="font-medium text-primary-900">{user.loginCount}</span> connexions
                      <br />
                      <span className="font-medium text-primary-900">{user.documentsCreated}</span> docs
                    </div>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedUser(user);
                          setShowActionModal(true);
                        }}
                      >
                        <Eye size={14} />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <MoreVertical size={14} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between p-4 border-t border-primary-100">
          <p className="text-sm text-primary-500">
            Affichage {(currentPage - 1) * itemsPerPage + 1} -{' '}
            {Math.min(currentPage * itemsPerPage, filteredUsers.length)} sur {filteredUsers.length}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft size={14} />
            </Button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      </Card>

      {/* User Detail Modal */}
      <Modal
        isOpen={showActionModal && !!selectedUser}
        onClose={() => {
          setShowActionModal(false);
          setSelectedUser(null);
        }}
        title="Détails utilisateur"
        size="lg"
      >
        {selectedUser && (
          <div className="space-y-6">
            {/* User header */}
            <div className="flex items-start gap-4 p-4 bg-primary-50 rounded-xl">
              <Avatar name={`${selectedUser.firstName} ${selectedUser.lastName}`} size="lg" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-primary-900">
                    {selectedUser.firstName} {selectedUser.lastName}
                  </h3>
                  {getStatusBadge(selectedUser.status)}
                </div>
                <p className="text-primary-600">{selectedUser.email}</p>
                {selectedUser.phone && (
                  <p className="text-sm text-primary-500 flex items-center gap-1 mt-1">
                    <Phone size={12} />
                    {selectedUser.phone}
                  </p>
                )}
              </div>
              {getRoleBadge(selectedUser.role)}
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-primary-50 rounded-xl text-center">
                <p className="text-2xl font-bold text-primary-900">{selectedUser.loginCount}</p>
                <p className="text-xs text-primary-500">Connexions</p>
              </div>
              <div className="p-4 bg-primary-50 rounded-xl text-center">
                <p className="text-2xl font-bold text-primary-900">{selectedUser.documentsCreated}</p>
                <p className="text-xs text-primary-500">Documents</p>
              </div>
              <div className="p-4 bg-primary-50 rounded-xl text-center">
                <p className="text-2xl font-bold text-primary-900">{selectedUser.signaturesCount}</p>
                <p className="text-xs text-primary-500">Signatures</p>
              </div>
            </div>

            {/* Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-primary-50 rounded-xl">
                <p className="text-xs text-primary-500">Organisation</p>
                <p className="font-medium text-primary-900">{selectedUser.tenant.name}</p>
                <div className="mt-1">{getPlanBadge(selectedUser.tenant.plan)}</div>
              </div>
              <div className="p-3 bg-primary-50 rounded-xl">
                <p className="text-xs text-primary-500">Dernière connexion</p>
                <p className="font-medium text-primary-900">{formatTimeAgo(selectedUser.lastLogin)}</p>
              </div>
              <div className="p-3 bg-primary-50 rounded-xl">
                <p className="text-xs text-primary-500">Date création</p>
                <p className="font-medium text-primary-900">
                  {selectedUser.createdAt.toLocaleDateString('fr-FR')}
                </p>
              </div>
              <div className="p-3 bg-primary-50 rounded-xl">
                <p className="text-xs text-primary-500">2FA</p>
                <p className="font-medium text-primary-900">
                  {selectedUser.mfaEnabled ? (
                    <span className="flex items-center gap-1 text-primary-900">
                      <CheckCircle size={14} />
                      Activé
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-primary-500">
                      <XCircle size={14} />
                      Désactivé
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2 pt-4 border-t">
              <Button variant="outline" size="sm">
                <LogIn size={14} className="mr-1" />
                Impersonner
              </Button>
              <Button variant="outline" size="sm">
                <Key size={14} className="mr-1" />
                Reset MDP
              </Button>
              <Button variant="outline" size="sm">
                <Send size={14} className="mr-1" />
                Envoyer email
              </Button>
              {selectedUser.status === 'active' ? (
                <Button variant="outline" size="sm" className="text-primary-900 border-primary-200">
                  <Ban size={14} className="mr-1" />
                  Suspendre
                </Button>
              ) : (
                <Button variant="outline" size="sm" className="text-primary-900 border-green-200">
                  <UserCheck size={14} className="mr-1" />
                  Activer
                </Button>
              )}
              <Button variant="outline" size="sm" className="text-red-600 border-red-200">
                <Trash2 size={14} className="mr-1" />
                Supprimer
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SuperAdminUsersPage;
