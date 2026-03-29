import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Filter,
  Search,
  FileText,
  GitBranch,
  PenTool,
  Users,
  AlertCircle,
  Info,
  Settings,
  Mail,
  Clock,
  MoreVertical,
  BellOff,
  BellRing,
  Smartphone,
  Monitor,
  Volume2,
  VolumeX,
  Calendar,
  ArrowRight,
  Eye,
  Zap,
  Archive,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  X,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';

interface Notification {
  id: number;
  type: 'document' | 'workflow' | 'signature' | 'user' | 'system';
  priority: 'low' | 'medium' | 'high';
  subject: string;
  body: string;
  status: 'unread' | 'read' | 'archived';
  created_at: string;
  action_url?: string;
  metadata?: Record<string, unknown>;
  // v2: Enhanced notification data
  sender?: {
    id: number;
    name: string;
    avatar?: string;
  };
  is_actionable?: boolean;
  action_type?: 'approve' | 'sign' | 'review' | 'view';
  deadline?: string;
  document_title?: string;
  workflow_name?: string;
}

// v2: Notification preferences interface
interface NotificationPreferences {
  email: {
    enabled: boolean;
    digest: 'instant' | 'daily' | 'weekly';
    types: {
      document: boolean;
      workflow: boolean;
      signature: boolean;
      user: boolean;
      system: boolean;
    };
  };
  push: {
    enabled: boolean;
    types: {
      document: boolean;
      workflow: boolean;
      signature: boolean;
      user: boolean;
      system: boolean;
    };
  };
  inApp: {
    sound: boolean;
    desktop: boolean;
  };
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
}

// Mock data with v2 enhanced fields
const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 1,
    type: 'signature',
    priority: 'high',
    subject: 'Nouvelle demande de signature urgente',
    body: 'Vous avez reçu une demande de signature pour le document "Contrat de prestation - Client ABC"',
    status: 'unread',
    created_at: '2024-11-28T10:30:00',
    action_url: '/app/signatures',
    sender: { id: 2, name: 'Marie Dupont' },
    is_actionable: true,
    action_type: 'sign',
    deadline: '2024-11-29T18:00:00',
    document_title: 'Contrat de prestation - Client ABC',
  },
  {
    id: 2,
    type: 'workflow',
    priority: 'high',
    subject: 'Workflow en attente de votre validation',
    body: 'Le workflow "Validation contrat Q4" nécessite votre approbation à l\'étape 2',
    status: 'unread',
    created_at: '2024-11-28T09:15:00',
    action_url: '/app/workflows/1',
    sender: { id: 3, name: 'Pierre Martin' },
    is_actionable: true,
    action_type: 'approve',
    deadline: '2024-11-29T12:00:00',
    workflow_name: 'Validation contrat Q4',
  },
  {
    id: 3,
    type: 'document',
    priority: 'medium',
    subject: 'Document mis à jour',
    body: 'Marie Martin a modifié le document "Rapport financier novembre 2024"',
    status: 'unread',
    created_at: '2024-11-28T08:45:00',
    action_url: '/app/documents/1',
    sender: { id: 2, name: 'Marie Martin' },
    is_actionable: true,
    action_type: 'review',
    document_title: 'Rapport financier novembre 2024',
  },
  {
    id: 4,
    type: 'signature',
    priority: 'medium',
    subject: 'Rappel: Signature en attente',
    body: 'Le document "Budget prévisionnel 2025" attend votre signature depuis 2 jours',
    status: 'unread',
    created_at: '2024-11-28T07:00:00',
    action_url: '/app/signatures',
    is_actionable: true,
    action_type: 'sign',
    deadline: '2024-11-28T18:00:00',
    document_title: 'Budget prévisionnel 2025',
  },
  {
    id: 5,
    type: 'user',
    priority: 'low',
    subject: 'Nouvel utilisateur ajouté',
    body: 'Lucas Robert a rejoint votre organisation avec le rôle Utilisateur',
    status: 'read',
    created_at: '2024-11-27T14:30:00',
    action_url: '/app/users',
    sender: { id: 1, name: 'Système' },
  },
  {
    id: 6,
    type: 'workflow',
    priority: 'low',
    subject: 'Workflow terminé',
    body: 'Le workflow "Approbation budget 2025" a été complété avec succès',
    status: 'read',
    created_at: '2024-11-27T11:00:00',
    action_url: '/app/workflows/2',
    workflow_name: 'Approbation budget 2025',
  },
  {
    id: 7,
    type: 'system',
    priority: 'low',
    subject: 'Maintenance planifiée',
    body: 'Une maintenance est prévue le 30 novembre de 02h00 à 04h00 (heure de Paris)',
    status: 'read',
    created_at: '2024-11-26T09:00:00',
  },
  {
    id: 8,
    type: 'signature',
    priority: 'low',
    subject: 'Signature complétée',
    body: 'Pierre Bernard a signé le document "Accord de confidentialité"',
    status: 'read',
    created_at: '2024-11-26T08:30:00',
    action_url: '/app/documents/3',
    sender: { id: 4, name: 'Pierre Bernard' },
    document_title: 'Accord de confidentialité',
  },
  {
    id: 9,
    type: 'document',
    priority: 'low',
    subject: 'Document partagé',
    body: 'Sophie Petit a partagé le document "Présentation commerciale" avec vous',
    status: 'read',
    created_at: '2024-11-25T17:20:00',
    action_url: '/app/documents/4',
    sender: { id: 5, name: 'Sophie Petit' },
    is_actionable: true,
    action_type: 'view',
    document_title: 'Présentation commerciale',
  },
  {
    id: 10,
    type: 'workflow',
    priority: 'medium',
    subject: 'Workflow rappelé',
    body: 'Le workflow "Validation procédure qualité" a été rappelé par son initiateur',
    status: 'archived',
    created_at: '2024-11-24T16:00:00',
    workflow_name: 'Validation procédure qualité',
  },
];

// v2: Default notification preferences
const DEFAULT_PREFERENCES: NotificationPreferences = {
  email: {
    enabled: true,
    digest: 'instant',
    types: {
      document: true,
      workflow: true,
      signature: true,
      user: true,
      system: false,
    },
  },
  push: {
    enabled: true,
    types: {
      document: true,
      workflow: true,
      signature: true,
      user: false,
      system: false,
    },
  },
  inApp: {
    sound: true,
    desktop: true,
  },
  quietHours: {
    enabled: false,
    start: '22:00',
    end: '08:00',
  },
};

const TYPE_CONFIG = {
  document: { icon: FileText, color: 'blue', label: 'Document' },
  workflow: { icon: GitBranch, color: 'purple', label: 'Workflow' },
  signature: { icon: PenTool, color: 'green', label: 'Signature' },
  user: { icon: Users, color: 'yellow', label: 'Utilisateur' },
  system: { icon: Settings, color: 'gray', label: 'Systeme' },
} as const;

const PRIORITY_CONFIG = {
  low: { color: 'gray' as const, label: 'Basse' },
  medium: { color: 'yellow' as const, label: 'Moyenne' },
  high: { color: 'red' as const, label: 'Haute' },
};

export const NotificationsPage: React.FC = () => {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedNotifications, setSelectedNotifications] = useState<number[]>([]);
  // v2: New states
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const [groupByDate, setGroupByDate] = useState(true);
  const [showArchived, setShowArchived] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['today', 'yesterday', 'thisWeek']);

  const filteredNotifications = notifications.filter((notif) => {
    const matchesSearch =
      notif.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notif.body.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'all' || notif.type === selectedType;
    const matchesStatus = selectedStatus === 'all' || notif.status === selectedStatus;
    const matchesArchived = showArchived || notif.status !== 'archived';
    return matchesSearch && matchesType && matchesStatus && matchesArchived;
  });

  const unreadCount = notifications.filter((n) => n.status === 'unread').length;
  const archivedCount = notifications.filter((n) => n.status === 'archived').length;
  const actionableCount = notifications.filter((n) => n.status === 'unread' && n.is_actionable).length;

  // v2: Group notifications by date
  const groupNotificationsByDate = (notifs: Notification[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 86400000);
    const weekAgo = new Date(today.getTime() - 7 * 86400000);

    const groups: { key: string; label: string; notifications: Notification[] }[] = [
      { key: 'today', label: t('notifications.today', "Aujourd'hui"), notifications: [] },
      { key: 'yesterday', label: t('notifications.yesterday', 'Hier'), notifications: [] },
      { key: 'thisWeek', label: t('notifications.thisWeek', 'Cette semaine'), notifications: [] },
      { key: 'older', label: t('notifications.older', 'Plus ancien'), notifications: [] },
    ];

    notifs.forEach((notif) => {
      const notifDate = new Date(notif.created_at);
      if (notifDate >= today) {
        groups[0].notifications.push(notif);
      } else if (notifDate >= yesterday) {
        groups[1].notifications.push(notif);
      } else if (notifDate >= weekAgo) {
        groups[2].notifications.push(notif);
      } else {
        groups[3].notifications.push(notif);
      }
    });

    return groups.filter((g) => g.notifications.length > 0);
  };

  const groupedNotifications = groupByDate ? groupNotificationsByDate(filteredNotifications) : null;

  const toggleGroup = (key: string) => {
    setExpandedGroups((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleMarkAsRead = (id: number) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, status: 'read' as const } : n))
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, status: 'read' as const })));
  };

  const handleDelete = (id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // v2: Archive notification instead of delete
  const handleArchive = (id: number) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, status: 'archived' as const } : n))
    );
  };

  // v2: Archive selected notifications
  const handleArchiveSelected = () => {
    setNotifications((prev) =>
      prev.map((n) =>
        selectedNotifications.includes(n.id) ? { ...n, status: 'archived' as const } : n
      )
    );
    setSelectedNotifications([]);
  };

  const handleDeleteSelected = () => {
    setNotifications((prev) =>
      prev.filter((n) => !selectedNotifications.includes(n.id))
    );
    setSelectedNotifications([]);
  };

  // v2: Mark selected as read
  const handleMarkSelectedAsRead = () => {
    setNotifications((prev) =>
      prev.map((n) =>
        selectedNotifications.includes(n.id) ? { ...n, status: 'read' as const } : n
      )
    );
    setSelectedNotifications([]);
  };

  const handleSelectAll = () => {
    if (selectedNotifications.length === filteredNotifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(filteredNotifications.map((n) => n.id));
    }
  };

  const handleToggleSelect = (id: number) => {
    setSelectedNotifications((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // v2: Quick action handler
  const handleQuickAction = (notification: Notification) => {
    // Navigate to action URL and mark as read
    handleMarkAsRead(notification.id);
    if (notification.action_url) {
      window.location.href = notification.action_url;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `Il y a ${diffMins} min`;
    } else if (diffHours < 24) {
      return `Il y a ${diffHours}h`;
    } else if (diffDays < 7) {
      return `Il y a ${diffDays}j`;
    } else {
      return date.toLocaleDateString('fr-FR');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-advist-gray900">{t('notifications.title', 'Notifications')}</h1>
          <p className="text-advist-gray900 mt-1">
            {unreadCount > 0 ? (
              <>
                {t('notifications.unreadCount', 'Vous avez {{count}} notification(s) non lue(s)', { count: unreadCount })}
                {actionableCount > 0 && (
                  <span className="ml-2 text-advist-gold-dark">
                    ({t('notifications.actionRequired', '{{count}} action(s) requise(s)', { count: actionableCount })})
                  </span>
                )}
              </>
            ) : (
              t('notifications.allRead', 'Toutes les notifications sont lues')
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* v2: Settings button */}
          <Button variant="outline" size="sm" onClick={() => setShowPreferencesModal(true)}>
            <Settings size={16} className="mr-2" />
            {t('notifications.preferences', 'Préférences')}
          </Button>
          <Button variant="outline" size="sm" onClick={handleMarkAllAsRead} disabled={unreadCount === 0}>
            <CheckCheck size={16} className="mr-2" />
            {t('notifications.markAllRead', 'Tout marquer comme lu')}
          </Button>
          {selectedNotifications.length > 0 && (
            <>
              <Button variant="outline" size="sm" onClick={handleMarkSelectedAsRead}>
                <Check size={16} className="mr-2" />
                {t('notifications.markRead', 'Marquer lu')} ({selectedNotifications.length})
              </Button>
              <Button variant="outline" size="sm" onClick={handleArchiveSelected}>
                <Archive size={16} className="mr-2" />
                {t('notifications.archive', 'Archiver')} ({selectedNotifications.length})
              </Button>
              <Button variant="danger" size="sm" onClick={handleDeleteSelected}>
                <Trash2 size={16} className="mr-2" />
                {t('notifications.delete', 'Supprimer')} ({selectedNotifications.length})
              </Button>
            </>
          )}
        </div>
      </div>

      {/* v2: Enhanced Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <StatsCard
          icon={Bell}
          label={t('notifications.stats.total', 'Total')}
          value={notifications.filter((n) => n.status !== 'archived').length}
          color="blue"
        />
        <StatsCard
          icon={Mail}
          label={t('notifications.stats.unread', 'Non lues')}
          value={unreadCount}
          color="red"
          highlight={unreadCount > 0}
        />
        <StatsCard
          icon={Zap}
          label={t('notifications.stats.actions', 'Actions')}
          value={actionableCount}
          color="yellow"
          highlight={actionableCount > 0}
        />
        <StatsCard
          icon={PenTool}
          label={t('notifications.stats.signatures', 'Signatures')}
          value={notifications.filter((n) => n.type === 'signature' && n.status === 'unread').length}
          color="green"
        />
        <StatsCard
          icon={GitBranch}
          label={t('notifications.stats.workflows', 'Workflows')}
          value={notifications.filter((n) => n.type === 'workflow' && n.status === 'unread').length}
          color="purple"
        />
        <StatsCard
          icon={Archive}
          label={t('notifications.stats.archived', 'Archivées')}
          value={archivedCount}
          color="gray"
          onClick={() => setShowArchived(!showArchived)}
          active={showArchived}
        />
      </div>

      {/* v2: Urgent notifications banner */}
      {actionableCount > 0 && (
        <Card className="bg-advist-gold-light border-advist-gold">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-advist-gold-light rounded-xl">
                <AlertCircle size={20} className="text-advist-gold-dark" />
              </div>
              <div>
                <p className="font-medium text-advist-gold-dark">
                  {t('notifications.urgentActions', 'Actions urgentes requises')}
                </p>
                <p className="text-sm text-advist-gold-dark">
                  {t('notifications.urgentActionsDesc', 'Vous avez {{count}} notification(s) nécessitant une action', { count: actionableCount })}
                </p>
              </div>
            </div>
            <Button
              size="sm"
              className="bg-advist-gold-light hover:bg-advist-gold-light"
              onClick={() => {
                setSelectedStatus('unread');
                setSelectedType('all');
              }}
            >
              {t('notifications.viewUrgent', 'Voir les actions')}
              <ArrowRight size={16} className="ml-2" />
            </Button>
          </div>
        </Card>
      )}

      {/* v2: Enhanced Filters */}
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-advist-blue-light"
              />
              <input
                type="text"
                placeholder={t('notifications.searchPlaceholder', 'Rechercher une notification...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-advist-bg rounded-xl text-advist-gray900 placeholder-advist-blue-light focus:outline-none focus:ring-2 focus:ring-advist-gold"
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 bg-advist-bg rounded-xl text-advist-gray900 focus:outline-none focus:ring-2 focus:ring-advist-gold"
            >
              <option value="all">{t('notifications.filters.allTypes', 'Tous les types')}</option>
              <option value="document">{t('notifications.filters.documents', 'Documents')}</option>
              <option value="workflow">{t('notifications.filters.workflows', 'Workflows')}</option>
              <option value="signature">{t('notifications.filters.signatures', 'Signatures')}</option>
              <option value="user">{t('notifications.filters.users', 'Utilisateurs')}</option>
              <option value="system">{t('notifications.filters.system', 'Système')}</option>
            </select>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 bg-advist-bg rounded-xl text-advist-gray900 focus:outline-none focus:ring-2 focus:ring-advist-gold"
            >
              <option value="all">{t('notifications.filters.allStatuses', 'Tous les statuts')}</option>
              <option value="unread">{t('notifications.filters.unread', 'Non lues')}</option>
              <option value="read">{t('notifications.filters.read', 'Lues')}</option>
              {showArchived && <option value="archived">{t('notifications.filters.archived', 'Archivées')}</option>}
            </select>
            {/* v2: Group by date toggle */}
            <button
              onClick={() => setGroupByDate(!groupByDate)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-240 ${
                groupByDate ? 'bg-advist-dark text-white' : 'bg-advist-bg text-advist-gray900'
              }`}
            >
              <Calendar size={16} />
              {t('notifications.groupByDate', 'Grouper')}
            </button>
            {/* v2: Refresh button */}
            <button
              className="p-2 bg-advist-bg rounded-xl text-advist-gray900 hover:bg-advist-dark hover:text-white transition-all duration-240"
              title={t('notifications.refresh', 'Actualiser')}
            >
              <RefreshCw size={18} />
            </button>
          </div>
        </div>
      </Card>

      {/* v2: Notifications List with grouping */}
      <Card className="overflow-hidden">
        {/* Select All Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-advist-bg/50 border-b border-advist-bg">
          <div className="flex items-center gap-4">
            <input
              type="checkbox"
              checked={
                selectedNotifications.length === filteredNotifications.length &&
                filteredNotifications.length > 0
              }
              onChange={handleSelectAll}
              className="w-4 h-4 rounded border-advist-bg text-advist-gray900 focus:ring-advist-gold"
            />
            <span className="text-sm text-advist-gray900">
              {selectedNotifications.length > 0
                ? t('notifications.selected', '{{count}} sélectionnée(s)', { count: selectedNotifications.length })
                : t('notifications.selectAll', 'Sélectionner tout')}
            </span>
          </div>
          <span className="text-sm text-advist-blue-light">
            {t('notifications.showing', '{{count}} notification(s)', { count: filteredNotifications.length })}
          </span>
        </div>

        {/* v2: Grouped or flat notifications */}
        {groupByDate && groupedNotifications ? (
          <div>
            {groupedNotifications.map((group) => (
              <div key={group.key}>
                {/* Group header */}
                <button
                  onClick={() => toggleGroup(group.key)}
                  className="w-full flex items-center justify-between px-4 py-2 bg-advist-bg/30 hover:bg-advist-bg/50 transition-all duration-240"
                >
                  <div className="flex items-center gap-2">
                    {expandedGroups.includes(group.key) ? (
                      <ChevronDown size={16} className="text-advist-gray900" />
                    ) : (
                      <ChevronUp size={16} className="text-advist-gray900" />
                    )}
                    <span className="font-medium text-advist-gray900">{group.label}</span>
                    <Badge variant="secondary" size="sm">
                      {group.notifications.length}
                    </Badge>
                    {group.notifications.filter((n) => n.status === 'unread').length > 0 && (
                      <Badge variant="danger" size="sm">
                        {group.notifications.filter((n) => n.status === 'unread').length} {t('notifications.new', 'nouvelle(s)')}
                      </Badge>
                    )}
                  </div>
                </button>
                {/* Group content */}
                {expandedGroups.includes(group.key) && (
                  <div className="divide-y divide-advist-bg">
                    {group.notifications.map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        isSelected={selectedNotifications.includes(notification.id)}
                        onSelect={() => handleToggleSelect(notification.id)}
                        onMarkAsRead={() => handleMarkAsRead(notification.id)}
                        onArchive={() => handleArchive(notification.id)}
                        onDelete={() => handleDelete(notification.id)}
                        onQuickAction={() => handleQuickAction(notification)}
                        formatDate={formatDate}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="divide-y divide-advist-bg">
            {filteredNotifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                isSelected={selectedNotifications.includes(notification.id)}
                onSelect={() => handleToggleSelect(notification.id)}
                onMarkAsRead={() => handleMarkAsRead(notification.id)}
                onArchive={() => handleArchive(notification.id)}
                onDelete={() => handleDelete(notification.id)}
                onQuickAction={() => handleQuickAction(notification)}
                formatDate={formatDate}
              />
            ))}
          </div>
        )}

        {filteredNotifications.length === 0 && (
          <div className="text-center py-12">
            <Bell size={48} className="mx-auto text-advist-blue-light mb-4" />
            <h3 className="text-lg font-medium text-advist-gray900">
              {showArchived
                ? t('notifications.noArchivedNotifications', 'Aucune notification archivée')
                : t('notifications.noNotifications', 'Aucune notification')}
            </h3>
            <p className="text-advist-gray900 mt-1">
              {t('notifications.allUpToDate', 'Vous êtes à jour avec toutes vos notifications')}
            </p>
          </div>
        )}
      </Card>

      {/* v2: Quick Settings Summary */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Settings size={20} className="text-advist-gray900" />
            <div>
              <p className="font-medium text-advist-gray900">
                {t('notifications.preferencesTitle', 'Préférences de notification')}
              </p>
              <p className="text-sm text-advist-gray900">
                {preferences.email.enabled && preferences.push.enabled
                  ? t('notifications.preferencesActive', 'Email et notifications push activés')
                  : preferences.email.enabled
                  ? t('notifications.emailOnly', 'Email activé uniquement')
                  : preferences.push.enabled
                  ? t('notifications.pushOnly', 'Push activé uniquement')
                  : t('notifications.allDisabled', 'Notifications désactivées')}
                {preferences.quietHours.enabled && (
                  <span className="ml-2 text-advist-gold-dark">
                    • {t('notifications.quietHoursActive', 'Heures calmes actives')}
                  </span>
                )}
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowPreferencesModal(true)}>
            {t('notifications.configure', 'Configurer')}
          </Button>
        </div>
      </Card>

      {/* v2: Preferences Modal */}
      <NotificationPreferencesModal
        isOpen={showPreferencesModal}
        onClose={() => setShowPreferencesModal(false)}
        preferences={preferences}
        onSave={setPreferences}
      />
    </div>
  );
};

// v2: Enhanced Stats Card Component
const StatsCard: React.FC<{
  icon: React.ElementType;
  label: string;
  value: number;
  color: 'blue' | 'red' | 'green' | 'purple' | 'yellow' | 'gray';
  highlight?: boolean;
  onClick?: () => void;
  active?: boolean;
}> = ({ icon: Icon, label, value, color, highlight, onClick, active }) => {
  const colorClasses = {
    blue: 'bg-advist-gold-light text-advist-gray900',
    red: 'bg-advist-gold-light text-advist-error',
    green: 'bg-green-50 text-advist-success',
    purple: 'bg-advist-surface-dark text-advist-gray900',
    yellow: 'bg-advist-gold-light text-advist-gold-dark',
    gray: 'bg-advist-surface-dark text-advist-text-secondary',
  };

  const Component = onClick ? 'button' : 'div';

  return (
    <Card
      className={`p-4 transition-all ${onClick ? 'cursor-pointer hover:shadow-md' : ''} ${
        active ? 'ring-2 ring-advist-navy' : ''
      } ${highlight ? 'ring-2 ring-offset-2 ring-advist-gold' : ''}`}
    >
      <Component onClick={onClick} className="flex items-center gap-3 w-full">
        <div className={`p-2 rounded-xl ${colorClasses[color]} ${highlight ? 'animate-pulse' : ''}`}>
          <Icon size={18} />
        </div>
        <div className="text-left">
          <p className={`text-xl font-bold ${highlight ? 'text-advist-error' : 'text-advist-gray900'}`}>{value}</p>
          <p className="text-xs text-advist-gray900">{label}</p>
        </div>
      </Component>
    </Card>
  );
};

// v2: Enhanced Notification Item Component
const NotificationItem: React.FC<{
  notification: Notification;
  isSelected: boolean;
  onSelect: () => void;
  onMarkAsRead: () => void;
  onArchive: () => void;
  onDelete: () => void;
  onQuickAction: () => void;
  formatDate: (date: string) => string;
}> = ({
  notification,
  isSelected,
  onSelect,
  onMarkAsRead,
  onArchive,
  onDelete,
  onQuickAction,
  formatDate,
}) => {
  const { t } = useTranslation();
  const [showMenu, setShowMenu] = useState(false);
  const typeConfig = TYPE_CONFIG[notification.type];
  const Icon = typeConfig.icon;

  // v2: Get action button config
  const getActionButton = () => {
    if (!notification.is_actionable || notification.status !== 'unread') return null;

    const actionConfig = {
      approve: { label: t('notifications.actions.approve', 'Approuver'), icon: Check, color: 'bg-advist-success hover:bg-green-50' },
      sign: { label: t('notifications.actions.sign', 'Signer'), icon: PenTool, color: 'bg-advist-dark hover:bg-advist-dark' },
      review: { label: t('notifications.actions.review', 'Réviser'), icon: Eye, color: 'bg-advist-dark hover:bg-advist-dark' },
      view: { label: t('notifications.actions.view', 'Voir'), icon: Eye, color: 'bg-advist-surface-dark hover:bg-advist-dark' },
    };

    return notification.action_type ? actionConfig[notification.action_type] : null;
  };

  const actionButton = getActionButton();

  // v2: Calculate deadline urgency
  const getDeadlineUrgency = () => {
    if (!notification.deadline) return null;
    const now = new Date();
    const deadline = new Date(notification.deadline);
    const hoursLeft = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursLeft < 0) return { status: 'overdue', label: t('notifications.overdue', 'En retard'), color: 'text-advist-error bg-advist-gold-light' };
    if (hoursLeft < 4) return { status: 'urgent', label: t('notifications.veryUrgent', 'Très urgent'), color: 'text-advist-error bg-advist-gold-light' };
    if (hoursLeft < 24) return { status: 'soon', label: t('notifications.dueSoon', 'Bientôt'), color: 'text-advist-gold-dark bg-advist-gold-light' };
    return null;
  };

  const deadlineUrgency = getDeadlineUrgency();

  return (
    <div
      className={`
        flex items-start gap-4 px-4 py-4 transition-all duration-240
        ${notification.status === 'unread' ? 'bg-advist-gold-light/50' : notification.status === 'archived' ? 'bg-advist-surface-dark/50' : 'hover:bg-advist-bg/30'}
        ${deadlineUrgency?.status === 'overdue' ? 'border-l-4 border-advist-gold' : deadlineUrgency?.status === 'urgent' ? 'border-l-4 border-advist-gold' : ''}
      `}
    >
      {/* Checkbox */}
      <input
        type="checkbox"
        checked={isSelected}
        onChange={onSelect}
        className="mt-1 w-4 h-4 rounded border-advist-bg text-advist-gray900 focus:ring-advist-gold"
      />

      {/* Icon */}
      <div
        className={`
          flex-shrink-0 p-2 rounded-xl relative
          ${notification.status === 'unread' ? `bg-${typeConfig.color}-100` : 'bg-advist-bg'}
        `}
      >
        <Icon
          size={18}
          className={notification.status === 'unread' ? `text-${typeConfig.color}-600` : 'text-advist-gray900'}
        />
        {notification.priority === 'high' && notification.status === 'unread' && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-advist-error rounded-full animate-pulse" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3
                className={`
                  text-sm
                  ${notification.status === 'unread' ? 'font-semibold text-advist-gray900' : 'font-medium text-advist-gray900'}
                `}
              >
                {notification.subject}
              </h3>
              {notification.priority === 'high' && (
                <Badge variant="danger" size="sm">
                  <AlertCircle size={10} className="mr-1" />
                  {t('notifications.urgent', 'Urgent')}
                </Badge>
              )}
              {deadlineUrgency && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${deadlineUrgency.color}`}>
                  {deadlineUrgency.label}
                </span>
              )}
            </div>
            <p className="text-sm text-advist-gray900 mt-1 line-clamp-2">
              {notification.body}
            </p>

            {/* v2: Additional info row */}
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <Badge variant={typeConfig.color as 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'purple'} size="sm">
                {typeConfig.label}
              </Badge>
              {notification.sender && (
                <span className="text-xs text-advist-blue-light">
                  {t('notifications.from', 'de')} {notification.sender.name}
                </span>
              )}
              <span className="flex items-center gap-1 text-xs text-advist-blue-light">
                <Clock size={12} />
                {formatDate(notification.created_at)}
              </span>
              {notification.deadline && (
                <span className={`flex items-center gap-1 text-xs ${deadlineUrgency ? deadlineUrgency.color.split(' ')[0] : 'text-advist-blue-light'}`}>
                  <Calendar size={12} />
                  {t('notifications.deadline', 'Échéance')}: {new Date(notification.deadline).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
          </div>

          {/* v2: Action buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Quick action button */}
            {actionButton && (
              <Button
                size="sm"
                className={actionButton.color}
                onClick={onQuickAction}
              >
                <actionButton.icon size={14} className="mr-1" />
                {actionButton.label}
              </Button>
            )}

            {/* More actions menu */}
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1.5 rounded hover:bg-advist-bg"
              >
                <MoreVertical size={16} className="text-advist-gray900" />
              </button>

              {showMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                  <div className="absolute right-0 mt-1 w-52 bg-white rounded-xl shadow-lg border border-advist-bg py-1 z-20">
                    {notification.status === 'unread' && (
                      <button
                        onClick={() => {
                          onMarkAsRead();
                          setShowMenu(false);
                        }}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-advist-gray900 hover:bg-advist-bg"
                      >
                        <Check size={14} />
                        {t('notifications.menu.markRead', 'Marquer comme lu')}
                      </button>
                    )}
                    {notification.action_url && (
                      <a
                        href={notification.action_url}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-advist-gray900 hover:bg-advist-bg"
                        onClick={() => setShowMenu(false)}
                      >
                        <Eye size={14} />
                        {t('notifications.menu.viewDetails', 'Voir les détails')}
                      </a>
                    )}
                    {notification.status !== 'archived' && (
                      <button
                        onClick={() => {
                          onArchive();
                          setShowMenu(false);
                        }}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-advist-gray900 hover:bg-advist-bg"
                      >
                        <Archive size={14} />
                        {t('notifications.menu.archive', 'Archiver')}
                      </button>
                    )}
                    <hr className="my-1 border-advist-bg" />
                    <button
                      onClick={() => {
                        onDelete();
                        setShowMenu(false);
                      }}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-advist-error hover:bg-advist-gold-light"
                    >
                      <Trash2 size={14} />
                      {t('notifications.menu.delete', 'Supprimer')}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Unread indicator */}
      {notification.status === 'unread' && (
        <div className="w-2 h-2 rounded-full bg-advist-dark flex-shrink-0 mt-2" />
      )}
      {/* Archived indicator */}
      {notification.status === 'archived' && (
        <Archive size={14} className="text-advist-blue-light flex-shrink-0 mt-2" />
      )}
    </div>
  );
};

// v2: Notification Preferences Modal Component
const NotificationPreferencesModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  preferences: NotificationPreferences;
  onSave: (preferences: NotificationPreferences) => void;
}> = ({ isOpen, onClose, preferences, onSave }) => {
  const { t } = useTranslation();
  const [localPrefs, setLocalPrefs] = useState(preferences);
  const [activeTab, setActiveTab] = useState<'email' | 'push' | 'inApp' | 'quietHours'>('email');

  const handleSave = () => {
    onSave(localPrefs);
    onClose();
  };

  const toggleEmailType = (type: keyof typeof localPrefs.email.types) => {
    setLocalPrefs((prev) => ({
      ...prev,
      email: {
        ...prev.email,
        types: {
          ...prev.email.types,
          [type]: !prev.email.types[type],
        },
      },
    }));
  };

  const togglePushType = (type: keyof typeof localPrefs.push.types) => {
    setLocalPrefs((prev) => ({
      ...prev,
      push: {
        ...prev.push,
        types: {
          ...prev.push.types,
          [type]: !prev.push.types[type],
        },
      },
    }));
  };

  const typeLabels = {
    document: { label: t('notifications.types.document', 'Documents'), icon: FileText },
    workflow: { label: t('notifications.types.workflow', 'Workflows'), icon: GitBranch },
    signature: { label: t('notifications.types.signature', 'Signatures'), icon: PenTool },
    user: { label: t('notifications.types.user', 'Utilisateurs'), icon: Users },
    system: { label: t('notifications.types.system', 'Système'), icon: Settings },
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('notifications.preferencesModalTitle', 'Préférences de notification')} size="lg">
      <div className="space-y-6">
        {/* Tabs */}
        <div className="flex gap-2 border-b border-advist-bg pb-3">
          {[
            { key: 'email', label: t('notifications.prefs.email', 'Email'), icon: Mail },
            { key: 'push', label: t('notifications.prefs.push', 'Push'), icon: Smartphone },
            { key: 'inApp', label: t('notifications.prefs.inApp', 'Application'), icon: Monitor },
            { key: 'quietHours', label: t('notifications.prefs.quietHours', 'Heures calmes'), icon: BellOff },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-240 ${
                activeTab === tab.key
                  ? 'bg-advist-dark text-white'
                  : 'bg-advist-bg text-advist-gray900 hover:bg-[#d4d4d4]'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Email preferences */}
        {activeTab === 'email' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-advist-gray900">{t('notifications.prefs.emailNotifications', 'Notifications par email')}</p>
                <p className="text-sm text-advist-gray900">{t('notifications.prefs.emailDesc', 'Recevez des notifications par email')}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={localPrefs.email.enabled}
                  onChange={() => setLocalPrefs((prev) => ({ ...prev, email: { ...prev.email, enabled: !prev.email.enabled } }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-advist-border peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-advist-border rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-advist-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-advist-dark"></div>
              </label>
            </div>

            {localPrefs.email.enabled && (
              <>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-advist-gray900">
                    {t('notifications.prefs.frequency', 'Fréquence')}
                  </label>
                  <select
                    value={localPrefs.email.digest}
                    onChange={(e) => setLocalPrefs((prev) => ({ ...prev, email: { ...prev.email, digest: e.target.value as 'instant' | 'daily' | 'weekly' } }))}
                    className="w-full px-3 py-2 bg-advist-bg rounded-xl text-advist-gray900 focus:outline-none focus:ring-2 focus:ring-advist-gold"
                  >
                    <option value="instant">{t('notifications.prefs.instant', 'Instantané')}</option>
                    <option value="daily">{t('notifications.prefs.daily', 'Résumé quotidien')}</option>
                    <option value="weekly">{t('notifications.prefs.weekly', 'Résumé hebdomadaire')}</option>
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-medium text-advist-gray900">
                    {t('notifications.prefs.notificationTypes', 'Types de notifications')}
                  </label>
                  {Object.entries(typeLabels).map(([key, { label, icon: TypeIcon }]) => (
                    <div key={key} className="flex items-center justify-between py-2 border-b border-advist-bg last:border-0">
                      <div className="flex items-center gap-3">
                        <TypeIcon size={18} className="text-advist-gray900" />
                        <span className="text-sm text-advist-gray900">{label}</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={localPrefs.email.types[key as keyof typeof localPrefs.email.types]}
                          onChange={() => toggleEmailType(key as keyof typeof localPrefs.email.types)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-advist-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-advist-border after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-advist-dark"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Push preferences */}
        {activeTab === 'push' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-advist-gray900">{t('notifications.prefs.pushNotifications', 'Notifications push')}</p>
                <p className="text-sm text-advist-gray900">{t('notifications.prefs.pushDesc', 'Recevez des notifications sur votre appareil')}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={localPrefs.push.enabled}
                  onChange={() => setLocalPrefs((prev) => ({ ...prev, push: { ...prev.push, enabled: !prev.push.enabled } }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-advist-border peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-advist-border rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-advist-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-advist-dark"></div>
              </label>
            </div>

            {localPrefs.push.enabled && (
              <div className="space-y-3">
                <label className="block text-sm font-medium text-advist-gray900">
                  {t('notifications.prefs.notificationTypes', 'Types de notifications')}
                </label>
                {Object.entries(typeLabels).map(([key, { label, icon: TypeIcon }]) => (
                  <div key={key} className="flex items-center justify-between py-2 border-b border-advist-bg last:border-0">
                    <div className="flex items-center gap-3">
                      <TypeIcon size={18} className="text-advist-gray900" />
                      <span className="text-sm text-advist-gray900">{label}</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={localPrefs.push.types[key as keyof typeof localPrefs.push.types]}
                        onChange={() => togglePushType(key as keyof typeof localPrefs.push.types)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-advist-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-advist-border after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-advist-dark"></div>
                    </label>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* In-app preferences */}
        {activeTab === 'inApp' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <Volume2 size={18} className="text-advist-gray900" />
                <div>
                  <p className="font-medium text-advist-gray900">{t('notifications.prefs.sound', 'Son')}</p>
                  <p className="text-sm text-advist-gray900">{t('notifications.prefs.soundDesc', 'Jouer un son lors de nouvelles notifications')}</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={localPrefs.inApp.sound}
                  onChange={() => setLocalPrefs((prev) => ({ ...prev, inApp: { ...prev.inApp, sound: !prev.inApp.sound } }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-advist-border peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-advist-border rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-advist-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-advist-dark"></div>
              </label>
            </div>

            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <Monitor size={18} className="text-advist-gray900" />
                <div>
                  <p className="font-medium text-advist-gray900">{t('notifications.prefs.desktop', 'Notifications bureau')}</p>
                  <p className="text-sm text-advist-gray900">{t('notifications.prefs.desktopDesc', 'Afficher les notifications sur le bureau')}</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={localPrefs.inApp.desktop}
                  onChange={() => setLocalPrefs((prev) => ({ ...prev, inApp: { ...prev.inApp, desktop: !prev.inApp.desktop } }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-advist-border peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-advist-border rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-advist-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-advist-dark"></div>
              </label>
            </div>
          </div>
        )}

        {/* Quiet hours */}
        {activeTab === 'quietHours' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-advist-gray900">{t('notifications.prefs.quietHoursTitle', 'Heures calmes')}</p>
                <p className="text-sm text-advist-gray900">{t('notifications.prefs.quietHoursDesc', 'Désactivez les notifications pendant certaines heures')}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={localPrefs.quietHours.enabled}
                  onChange={() => setLocalPrefs((prev) => ({ ...prev, quietHours: { ...prev.quietHours, enabled: !prev.quietHours.enabled } }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-advist-border peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-advist-border rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-advist-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-advist-dark"></div>
              </label>
            </div>

            {localPrefs.quietHours.enabled && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-advist-gray900 mb-2">
                    {t('notifications.prefs.startTime', 'Début')}
                  </label>
                  <input
                    type="time"
                    value={localPrefs.quietHours.start}
                    onChange={(e) => setLocalPrefs((prev) => ({ ...prev, quietHours: { ...prev.quietHours, start: e.target.value } }))}
                    className="w-full px-3 py-2 bg-advist-bg rounded-xl text-advist-gray900 focus:outline-none focus:ring-2 focus:ring-advist-gold"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-advist-gray900 mb-2">
                    {t('notifications.prefs.endTime', 'Fin')}
                  </label>
                  <input
                    type="time"
                    value={localPrefs.quietHours.end}
                    onChange={(e) => setLocalPrefs((prev) => ({ ...prev, quietHours: { ...prev.quietHours, end: e.target.value } }))}
                    className="w-full px-3 py-2 bg-advist-bg rounded-xl text-advist-gray900 focus:outline-none focus:ring-2 focus:ring-advist-gold"
                  />
                </div>
              </div>
            )}

            {localPrefs.quietHours.enabled && (
              <div className="p-4 bg-advist-gold-light rounded-xl">
                <div className="flex items-center gap-2 text-advist-gold-dark">
                  <BellOff size={18} />
                  <p className="text-sm">
                    {t('notifications.prefs.quietHoursInfo', 'Les notifications seront désactivées de {{start}} à {{end}}', {
                      start: localPrefs.quietHours.start,
                      end: localPrefs.quietHours.end,
                    })}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-4 border-t border-advist-bg">
          <Button variant="ghost" onClick={onClose}>
            {t('common.cancel', 'Annuler')}
          </Button>
          <Button onClick={handleSave}>
            {t('common.save', 'Enregistrer')}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default NotificationsPage;
