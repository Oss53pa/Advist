import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Bell,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  Clock,
  Filter,
  RefreshCw,
  Settings,
  Trash2,
  Eye,
  _EyeOff,
  Building2,
  _Users,
  _HardDrive,
  CreditCard,
  Shield,
  Server,
  Activity,
  _Mail,
  _MessageSquare,
  Plus,
  Check,
  _X,
} from 'lucide-react';
import { Card, Button, Badge, Modal } from '../../components/ui';

// Types
interface Alert {
  id: string;
  type: 'error' | 'warning' | 'info' | 'success';
  category: 'system' | 'security' | 'billing' | 'usage' | 'tenant';
  title: string;
  message: string;
  tenant?: string;
  timestamp: Date;
  isRead: boolean;
  isResolved: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

interface AlertRule {
  id: string;
  name: string;
  condition: string;
  action: string;
  enabled: boolean;
  lastTriggered?: Date;
}

// Mock data
const alertStats = [
  { label: 'Non lues', value: 12, icon: Bell, color: 'blue' },
  { label: 'Critiques', value: 3, icon: AlertTriangle, color: 'red' },
  { label: 'En attente', value: 8, icon: Clock, color: 'orange' },
  { label: 'Resolues (24h)', value: 45, icon: CheckCircle, color: 'green' },
];

const alerts: Alert[] = [
  {
    id: '1',
    type: 'error',
    category: 'system',
    title: 'Echec du backup automatique',
    message: 'Le backup quotidien de la base de donnees a echoue. Erreur: Timeout exceeded.',
    timestamp: new Date(Date.now() - 1000 * 60 * 15),
    isRead: false,
    isResolved: false,
    priority: 'critical',
  },
  {
    id: '2',
    type: 'warning',
    category: 'usage',
    title: 'Quota stockage proche de la limite',
    message: 'L\'organisation "Orange CI" a atteint 85% de son quota de stockage.',
    tenant: "Orange Cote d'Ivoire",
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    isRead: false,
    isResolved: false,
    priority: 'high',
  },
  {
    id: '3',
    type: 'warning',
    category: 'billing',
    title: 'Paiement en retard',
    message: 'Le paiement de "Cabinet Juridique Kouassi" est en retard de 15 jours.',
    tenant: 'Cabinet Juridique Kouassi',
    timestamp: new Date(Date.now() - 1000 * 60 * 60),
    isRead: true,
    isResolved: false,
    priority: 'high',
  },
  {
    id: '4',
    type: 'error',
    category: 'security',
    title: 'Tentative de connexion suspecte',
    message: 'Multiple tentatives de connexion echouees detectees depuis 45.33.32.156',
    timestamp: new Date(Date.now() - 1000 * 60 * 90),
    isRead: true,
    isResolved: true,
    priority: 'critical',
  },
  {
    id: '5',
    type: 'info',
    category: 'tenant',
    title: 'Nouvelle organisation inscrite',
    message: 'L\'organisation "Test Organisation" a complete son inscription.',
    tenant: 'Test Organisation',
    timestamp: new Date(Date.now() - 1000 * 60 * 120),
    isRead: true,
    isResolved: false,
    priority: 'low',
  },
  {
    id: '6',
    type: 'success',
    category: 'system',
    title: 'Mise a jour terminee',
    message: 'La mise a jour v2.4.1 a ete deployee avec succes sur tous les serveurs.',
    timestamp: new Date(Date.now() - 1000 * 60 * 180),
    isRead: true,
    isResolved: true,
    priority: 'medium',
  },
  {
    id: '7',
    type: 'warning',
    category: 'usage',
    title: 'Activite inhabituelle detectee',
    message: 'Volume de signatures anormalement eleve detecte pour "SGCI" (+300%).',
    tenant: 'Societe Generale CI',
    timestamp: new Date(Date.now() - 1000 * 60 * 240),
    isRead: false,
    isResolved: false,
    priority: 'medium',
  },
  {
    id: '8',
    type: 'info',
    category: 'billing',
    title: 'Upgrade de plan',
    message: '"Ecobank Mali" a mis a niveau son plan de Business a Enterprise.',
    tenant: 'Ecobank Mali',
    timestamp: new Date(Date.now() - 1000 * 60 * 300),
    isRead: true,
    isResolved: true,
    priority: 'low',
  },
];

const alertRules: AlertRule[] = [
  {
    id: '1',
    name: 'Quota stockage > 80%',
    condition: 'storage_used > 80%',
    action: 'Email + Dashboard',
    enabled: true,
    lastTriggered: new Date(Date.now() - 1000 * 60 * 30),
  },
  {
    id: '2',
    name: 'Echec backup',
    condition: 'backup_status = failed',
    action: 'Email + SMS',
    enabled: true,
    lastTriggered: new Date(Date.now() - 1000 * 60 * 15),
  },
  {
    id: '3',
    name: 'Paiement en retard > 7j',
    condition: 'payment_overdue > 7 days',
    action: 'Email',
    enabled: true,
    lastTriggered: new Date(Date.now() - 1000 * 60 * 60),
  },
  {
    id: '4',
    name: 'Tentatives login > 5',
    condition: 'failed_logins > 5',
    action: 'Email + Block IP',
    enabled: true,
    lastTriggered: new Date(Date.now() - 1000 * 60 * 90),
  },
  {
    id: '5',
    name: 'CPU > 90%',
    condition: 'cpu_usage > 90%',
    action: 'Email + Slack',
    enabled: true,
  },
  {
    id: '6',
    name: 'Nouvelle inscription',
    condition: 'new_tenant = true',
    action: 'Email',
    enabled: false,
  },
];

export const SuperAdminAlertsPage: React.FC = () => {
  const { _t } = useTranslation();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1500);
  };

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return "A l'instant";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `Il y a ${minutes}min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Il y a ${hours}h`;
    return `Il y a ${Math.floor(hours / 24)}j`;
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <XCircle size={20} className="text-advist-error" />;
      case 'warning':
        return <AlertTriangle size={20} className="text-advist-gold-dark" />;
      case 'success':
        return <CheckCircle size={20} className="text-advist-success" />;
      case 'info':
        return <Info size={20} className="text-advist-gray900" />;
      default:
        return <Bell size={20} className="text-advist-text-secondary" />;
    }
  };

  const getAlertBg = (type: string, isRead: boolean) => {
    if (!isRead) {
      switch (type) {
        case 'error':
          return 'bg-advist-gold-light border-advist-gold';
        case 'warning':
          return 'bg-advist-gold-light border-advist-gold';
        case 'success':
          return 'bg-green-50 border-advist-success';
        case 'info':
          return 'bg-advist-gold-light border-advist-gold';
        default:
          return 'bg-advist-surface-dark border-advist-border';
      }
    }
    return 'bg-white border-advist-bg';
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'critical':
        return <Badge variant="danger">Critique</Badge>;
      case 'high':
        return <Badge variant="warning">Eleve</Badge>;
      case 'medium':
        return <Badge variant="default">Moyen</Badge>;
      case 'low':
        return <Badge variant="default">Faible</Badge>;
      default:
        return <Badge>Inconnu</Badge>;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'system':
        return <Server size={14} />;
      case 'security':
        return <Shield size={14} />;
      case 'billing':
        return <CreditCard size={14} />;
      case 'usage':
        return <Activity size={14} />;
      case 'tenant':
        return <Building2 size={14} />;
      default:
        return <Bell size={14} />;
    }
  };

  const filteredAlerts = alerts.filter((alert) => {
    if (filterCategory !== 'all' && alert.category !== filterCategory) return false;
    if (filterPriority !== 'all' && alert.priority !== filterPriority) return false;
    if (showUnreadOnly && alert.isRead) return false;
    return true;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-advist-gray900">Alertes & Notifications</h1>
          <p className="text-advist-gray900 mt-1">Centre de gestion des alertes de la plateforme</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw size={16} className={`mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button variant="outline" onClick={() => setShowRulesModal(true)}>
            <Settings size={16} className="mr-2" />
            Regles
          </Button>
          <Button>
            <Check size={16} className="mr-2" />
            Tout marquer lu
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {alertStats.map((stat, index) => (
          <Card key={index} className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-advist-gray900">{stat.label}</p>
                <p className="text-3xl font-bold text-advist-gray900 mt-1">{stat.value}</p>
              </div>
              <div
                className={`p-3 rounded-xl ${
                  stat.color === 'blue'
                    ? 'bg-advist-gold-light'
                    : stat.color === 'red'
                      ? 'bg-advist-gold-light'
                      : stat.color === 'orange'
                        ? 'bg-advist-gold-light'
                        : 'bg-green-50'
                }`}
              >
                <stat.icon
                  size={24}
                  className={`${
                    stat.color === 'blue'
                      ? 'text-advist-gray900'
                      : stat.color === 'red'
                        ? 'text-advist-error'
                        : stat.color === 'orange'
                          ? 'text-advist-gold-dark'
                          : 'text-advist-success'
                  }`}
                />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-advist-gray900" />
            <span className="text-sm font-medium text-advist-gray900">Filtres:</span>
          </div>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-1.5 text-sm border border-advist-bg rounded-xl focus:outline-none"
          >
            <option value="all">Toutes categories</option>
            <option value="system">Systeme</option>
            <option value="security">Securite</option>
            <option value="billing">Facturation</option>
            <option value="usage">Utilisation</option>
            <option value="tenant">Organisations</option>
          </select>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-3 py-1.5 text-sm border border-advist-bg rounded-xl focus:outline-none"
          >
            <option value="all">Toutes priorites</option>
            <option value="critical">Critique</option>
            <option value="high">Elevee</option>
            <option value="medium">Moyenne</option>
            <option value="low">Faible</option>
          </select>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showUnreadOnly}
              onChange={(e) => setShowUnreadOnly(e.target.checked)}
              className="w-4 h-4 rounded border-advist-bg text-advist-gray900 focus:ring-advist-gold"
            />
            <span className="text-sm text-advist-gray900">Non lues uniquement</span>
          </label>

          <div className="flex-1" />

          <span className="text-sm text-advist-gray900">
            {filteredAlerts.length} alerte{filteredAlerts.length > 1 ? 's' : ''}
          </span>
        </div>
      </Card>

      {/* Alerts List */}
      <div className="space-y-3">
        {filteredAlerts.map((alert) => (
          <Card
            key={alert.id}
            className={`p-4 border cursor-pointer hover:shadow-md transition-all ${getAlertBg(alert.type, alert.isRead)}`}
            onClick={() => setSelectedAlert(alert)}
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">{getAlertIcon(alert.type)}</div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3
                    className={`font-medium ${alert.isRead ? 'text-advist-gray900' : 'text-advist-gray900 font-semibold'}`}
                  >
                    {alert.title}
                  </h3>
                  {!alert.isRead && <span className="w-2 h-2 bg-advist-dark rounded-full" />}
                </div>

                <p className="text-sm text-advist-gray900 mb-2">{alert.message}</p>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1 text-xs text-advist-gray900">
                    {getCategoryIcon(alert.category)}
                    <span className="capitalize">{alert.category}</span>
                  </div>

                  {alert.tenant && (
                    <div className="flex items-center gap-1 text-xs text-advist-gray900">
                      <Building2 size={12} />
                      {alert.tenant}
                    </div>
                  )}

                  <div className="flex items-center gap-1 text-xs text-advist-gray900">
                    <Clock size={12} />
                    {formatTimeAgo(alert.timestamp)}
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2">
                {getPriorityBadge(alert.priority)}
                {alert.isResolved && <Badge variant="success">Resolu</Badge>}
              </div>
            </div>
          </Card>
        ))}

        {filteredAlerts.length === 0 && (
          <Card className="p-12 text-center">
            <Bell size={48} className="mx-auto text-advist-bg mb-4" />
            <p className="text-advist-gray900">Aucune alerte correspondant aux filtres</p>
          </Card>
        )}
      </div>

      {/* Alert Rules Modal */}
      <Modal
        isOpen={showRulesModal}
        onClose={() => setShowRulesModal(false)}
        title="Regles d'alertes"
        size="lg"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-advist-gray900">
              Configurez les regles de declenchement des alertes automatiques.
            </p>
            <Button size="sm">
              <Plus size={14} className="mr-2" />
              Nouvelle regle
            </Button>
          </div>

          <div className="space-y-3">
            {alertRules.map((rule) => (
              <div
                key={rule.id}
                className="flex items-center justify-between p-4 bg-advist-bg rounded-xl"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-advist-gray900">{rule.name}</span>
                    <Badge variant={rule.enabled ? 'success' : 'default'}>
                      {rule.enabled ? 'Actif' : 'Inactif'}
                    </Badge>
                  </div>
                  <p className="text-xs text-advist-gray900">
                    Condition: <code className="bg-white px-1 rounded">{rule.condition}</code>
                  </p>
                  <p className="text-xs text-advist-gray900 mt-1">
                    Action: {rule.action}
                    {rule.lastTriggered && (
                      <span className="ml-2">
                        • Dernier declenchement: {formatTimeAgo(rule.lastTriggered)}
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm">
                    <Settings size={14} />
                  </Button>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rule.enabled}
                      className="sr-only peer"
                      readOnly
                    />
                    <div className="w-11 h-6 bg-advist-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-advist-success"></div>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {/* Alert Detail Modal */}
      <Modal
        isOpen={!!selectedAlert}
        onClose={() => setSelectedAlert(null)}
        title={selectedAlert?.title || ''}
        size="md"
      >
        {selectedAlert && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              {getAlertIcon(selectedAlert.type)}
              {getPriorityBadge(selectedAlert.priority)}
              {selectedAlert.isResolved && <Badge variant="success">Resolu</Badge>}
            </div>

            <p className="text-advist-gray900">{selectedAlert.message}</p>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-advist-bg rounded-xl">
                <p className="text-xs text-advist-gray900">Categorie</p>
                <p className="font-medium text-advist-gray900 capitalize">
                  {selectedAlert.category}
                </p>
              </div>
              <div className="p-3 bg-advist-bg rounded-xl">
                <p className="text-xs text-advist-gray900">Date</p>
                <p className="font-medium text-advist-gray900">
                  {selectedAlert.timestamp.toLocaleString('fr-FR')}
                </p>
              </div>
              {selectedAlert.tenant && (
                <div className="p-3 bg-advist-bg rounded-xl col-span-2">
                  <p className="text-xs text-advist-gray900">Organisation</p>
                  <p className="font-medium text-advist-gray900">{selectedAlert.tenant}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4 border-t border-advist-bg">
              {!selectedAlert.isRead && (
                <Button variant="outline" className="flex-1">
                  <Eye size={16} className="mr-2" />
                  Marquer comme lu
                </Button>
              )}
              {!selectedAlert.isResolved && (
                <Button className="flex-1">
                  <CheckCircle size={16} className="mr-2" />
                  Marquer resolu
                </Button>
              )}
              <Button variant="ghost" className="text-advist-error">
                <Trash2 size={16} />
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SuperAdminAlertsPage;
