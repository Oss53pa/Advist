import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Shield,
  Lock,
  Key,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  Users,
  Globe,
  Clock,
  Activity,
  FileText,
  RefreshCw,
  Settings,
  Smartphone,
  Mail,
  MapPin,
  Ban,
  UserX,
  ShieldAlert,
  ShieldCheck,
  Fingerprint,
  KeyRound,
  History,
  Download,
  Filter,
} from 'lucide-react';
import { Card, Button, Badge, Modal } from '../../components/ui';

// Types
interface SecurityEvent {
  id: string;
  type: 'login_failed' | 'suspicious_activity' | 'password_reset' | 'mfa_disabled' | 'ip_blocked' | 'permission_change';
  severity: 'low' | 'medium' | 'high' | 'critical';
  user: string;
  tenant: string;
  ip: string;
  location: string;
  timestamp: Date;
  details: string;
}

interface BlockedIP {
  ip: string;
  reason: string;
  blockedAt: Date;
  attempts: number;
  country: string;
}

interface ActiveSession {
  id: string;
  user: string;
  tenant: string;
  device: string;
  ip: string;
  location: string;
  startedAt: Date;
  lastActivity: Date;
}

// Mock data
const securityMetrics = [
  { label: 'Tentatives bloquees (24h)', value: '156', change: -12, icon: Ban, color: 'red' },
  { label: 'Sessions actives', value: '234', change: 5, icon: Users, color: 'blue' },
  { label: '2FA actif', value: '89%', change: 3, icon: Smartphone, color: 'green' },
  { label: 'Score securite', value: '94/100', change: 2, icon: ShieldCheck, color: 'purple' },
];

const securityEvents: SecurityEvent[] = [
  { id: '1', type: 'login_failed', severity: 'medium', user: 'unknown', tenant: 'sgci', ip: '192.168.1.100', location: 'Abidjan, CI', timestamp: new Date(Date.now() - 1000 * 60 * 5), details: '5 tentatives echouees consecutives' },
  { id: '2', type: 'suspicious_activity', severity: 'high', user: 'admin@orange-ci.com', tenant: 'orange-ci', ip: '10.0.0.45', location: 'Lagos, NG', timestamp: new Date(Date.now() - 1000 * 60 * 15), details: 'Connexion depuis un nouvel emplacement' },
  { id: '3', type: 'mfa_disabled', severity: 'medium', user: 'finance@advist.com', tenant: 'advist-demo', ip: '172.16.0.12', location: 'Dakar, SN', timestamp: new Date(Date.now() - 1000 * 60 * 30), details: 'MFA desactive par l\'utilisateur' },
  { id: '4', type: 'password_reset', severity: 'low', user: 'user@bceao.int', tenant: 'bceao', ip: '192.168.10.5', location: 'Dakar, SN', timestamp: new Date(Date.now() - 1000 * 60 * 45), details: 'Reinitialisation mot de passe demandee' },
  { id: '5', type: 'ip_blocked', severity: 'high', user: 'N/A', tenant: 'N/A', ip: '45.33.32.156', location: 'Unknown', timestamp: new Date(Date.now() - 1000 * 60 * 60), details: 'Tentative de brute force detectee' },
  { id: '6', type: 'permission_change', severity: 'medium', user: 'admin@example.com', tenant: 'example-org', ip: '192.168.1.1', location: 'Abidjan, CI', timestamp: new Date(Date.now() - 1000 * 60 * 90), details: 'Role admin attribue a nouveau user' },
];

const blockedIPs: BlockedIP[] = [
  { ip: '45.33.32.156', reason: 'Brute force attack', blockedAt: new Date(Date.now() - 1000 * 60 * 60), attempts: 150, country: 'Unknown' },
  { ip: '103.21.244.0', reason: 'SQL injection attempt', blockedAt: new Date(Date.now() - 1000 * 60 * 120), attempts: 45, country: 'CN' },
  { ip: '185.220.101.1', reason: 'Suspicious scanning', blockedAt: new Date(Date.now() - 1000 * 60 * 180), attempts: 89, country: 'RU' },
  { ip: '91.121.87.10', reason: 'Multiple failed logins', blockedAt: new Date(Date.now() - 1000 * 60 * 240), attempts: 23, country: 'FR' },
];

const activeSessions: ActiveSession[] = [
  { id: '1', user: 'admin@sgci.com', tenant: 'Societe Generale CI', device: 'Chrome / Windows', ip: '192.168.1.50', location: 'Abidjan, CI', startedAt: new Date(Date.now() - 1000 * 60 * 30), lastActivity: new Date(Date.now() - 1000 * 60 * 2) },
  { id: '2', user: 'dg@orange-ci.com', tenant: 'Orange Cote d\'Ivoire', device: 'Safari / macOS', ip: '10.0.0.100', location: 'Abidjan, CI', startedAt: new Date(Date.now() - 1000 * 60 * 120), lastActivity: new Date(Date.now() - 1000 * 60 * 5) },
  { id: '3', user: 'finance@bceao.int', tenant: 'BCEAO', device: 'Firefox / Ubuntu', ip: '172.16.0.25', location: 'Dakar, SN', startedAt: new Date(Date.now() - 1000 * 60 * 60), lastActivity: new Date(Date.now() - 1000 * 60 * 10) },
  { id: '4', user: 'user@ecobank.ml', tenant: 'Ecobank Mali', device: 'Chrome / Android', ip: '192.168.50.12', location: 'Bamako, ML', startedAt: new Date(Date.now() - 1000 * 60 * 45), lastActivity: new Date(Date.now() - 1000 * 60 * 1) },
];

const securityPolicies = [
  { name: 'Longueur mot de passe minimum', value: '12 caracteres', status: 'active' },
  { name: 'Caracteres speciaux requis', value: 'Oui', status: 'active' },
  { name: 'Expiration mot de passe', value: '90 jours', status: 'active' },
  { name: 'Historique mot de passe', value: '5 derniers', status: 'active' },
  { name: '2FA obligatoire (admins)', value: 'Oui', status: 'active' },
  { name: 'Timeout session', value: '30 minutes', status: 'active' },
  { name: 'Blocage apres echecs', value: '5 tentatives', status: 'active' },
  { name: 'Whitelist IP', value: 'Desactive', status: 'inactive' },
];

export const SuperAdminSecurityPage: React.FC = () => {
  const { t } = useTranslation();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showBlockIPModal, setShowBlockIPModal] = useState(false);
  const [showPoliciesModal, setShowPoliciesModal] = useState(false);
  const [filterSeverity, setFilterSeverity] = useState<string>('all');

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1500);
  };

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return 'A l\'instant';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `Il y a ${minutes}min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Il y a ${hours}h`;
    return `Il y a ${Math.floor(hours / 24)}j`;
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical': return <Badge variant="danger">Critique</Badge>;
      case 'high': return <Badge variant="danger">Eleve</Badge>;
      case 'medium': return <Badge variant="warning">Moyen</Badge>;
      case 'low': return <Badge variant="default">Faible</Badge>;
      default: return <Badge>Inconnu</Badge>;
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'login_failed': return <XCircle size={16} className="text-advist-error" />;
      case 'suspicious_activity': return <AlertTriangle size={16} className="text-advist-gold-dark" />;
      case 'password_reset': return <Key size={16} className="text-advist-gray900" />;
      case 'mfa_disabled': return <Smartphone size={16} className="text-advist-gold-dark" />;
      case 'ip_blocked': return <Ban size={16} className="text-advist-error" />;
      case 'permission_change': return <Users size={16} className="text-advist-gray900" />;
      default: return <Activity size={16} className="text-advist-text-secondary" />;
    }
  };

  const filteredEvents = filterSeverity === 'all'
    ? securityEvents
    : securityEvents.filter(e => e.severity === filterSeverity);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-advist-gray900">
            Securite & Audit
          </h1>
          <p className="text-advist-gray900 mt-1">
            Surveillance et gestion de la securite de la plateforme
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw size={16} className={`mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button variant="outline" onClick={() => setShowPoliciesModal(true)}>
            <Settings size={16} className="mr-2" />
            Politiques
          </Button>
          <Button>
            <Download size={16} className="mr-2" />
            Rapport
          </Button>
        </div>
      </div>

      {/* Security Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {securityMetrics.map((metric, index) => (
          <Card key={index} className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-advist-gray900 mb-1">{metric.label}</p>
                <p className="text-2xl font-bold text-advist-gray900">{metric.value}</p>
                <div className="flex items-center gap-1 mt-2">
                  <span className={`text-sm font-medium ${metric.change >= 0 ? 'text-advist-success' : 'text-advist-error'}`}>
                    {metric.change >= 0 ? '+' : ''}{metric.change}%
                  </span>
                  <span className="text-xs text-advist-gray900">vs hier</span>
                </div>
              </div>
              <div className={`p-3 rounded-xl ${
                metric.color === 'red' ? 'bg-advist-gold-light' :
                metric.color === 'blue' ? 'bg-advist-gold-light' :
                metric.color === 'green' ? 'bg-green-50' :
                'bg-advist-surface-dark'
              }`}>
                <metric.icon size={24} className={`${
                  metric.color === 'red' ? 'text-advist-error' :
                  metric.color === 'blue' ? 'text-advist-gray900' :
                  metric.color === 'green' ? 'text-advist-success' :
                  'text-advist-gray900'
                }`} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Security Events */}
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <ShieldAlert size={20} className="text-advist-gray900" />
              <h2 className="text-lg font-semibold text-advist-gray900">Evenements de securite</h2>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
                className="px-3 py-1.5 text-sm border border-advist-bg rounded-xl focus:outline-none"
              >
                <option value="all">Tous</option>
                <option value="critical">Critique</option>
                <option value="high">Eleve</option>
                <option value="medium">Moyen</option>
                <option value="low">Faible</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            {filteredEvents.map((event) => (
              <div key={event.id} className="flex items-start gap-4 p-4 bg-advist-bg rounded-xl hover:bg-advist-bg transition-all duration-240">
                <div className="p-2 bg-white rounded-xl">
                  {getEventIcon(event.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-advist-gray900">{event.details}</span>
                    {getSeverityBadge(event.severity)}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-advist-gray900">
                    <span className="flex items-center gap-1">
                      <Users size={12} />
                      {event.user}
                    </span>
                    <span className="flex items-center gap-1">
                      <Globe size={12} />
                      {event.ip}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin size={12} />
                      {event.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {formatTimeAgo(event.timestamp)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Button variant="outline" className="w-full mt-4">
            Voir tous les evenements
          </Button>
        </Card>

        {/* Blocked IPs */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Ban size={20} className="text-advist-error" />
              <h2 className="text-lg font-semibold text-advist-gray900">IPs bloquees</h2>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowBlockIPModal(true)}>
              Bloquer IP
            </Button>
          </div>

          <div className="space-y-3">
            {blockedIPs.map((ip) => (
              <div key={ip.ip} className="p-3 bg-advist-gold-light border border-advist-gold rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-sm font-medium text-advist-error">{ip.ip}</span>
                  <Badge variant="danger">{ip.country}</Badge>
                </div>
                <p className="text-xs text-advist-error mb-1">{ip.reason}</p>
                <div className="flex items-center justify-between text-xs text-advist-error">
                  <span>{ip.attempts} tentatives</span>
                  <span>{formatTimeAgo(ip.blockedAt)}</span>
                </div>
              </div>
            ))}
          </div>

          <Button variant="ghost" className="w-full mt-4 text-advist-error">
            Gerer les IPs bloquees
          </Button>
        </Card>
      </div>

      {/* Active Sessions */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Activity size={20} className="text-advist-gray900" />
            <h2 className="text-lg font-semibold text-advist-gray900">Sessions actives</h2>
          </div>
          <Button variant="danger" size="sm">
            <UserX size={14} className="mr-2" />
            Terminer toutes
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-advist-bg">
                <th className="text-left py-3 px-4 text-sm font-medium text-advist-gray900">Utilisateur</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-advist-gray900">Organisation</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-advist-gray900">Appareil</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-advist-gray900">IP / Location</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-advist-gray900">Derniere activite</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-advist-gray900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {activeSessions.map((session) => (
                <tr key={session.id} className="border-b border-advist-bg hover:bg-advist-bg">
                  <td className="py-4 px-4">
                    <span className="font-medium text-advist-gray900">{session.user}</span>
                  </td>
                  <td className="py-4 px-4 text-advist-gray900">{session.tenant}</td>
                  <td className="py-4 px-4 text-advist-gray900">{session.device}</td>
                  <td className="py-4 px-4">
                    <div>
                      <span className="font-mono text-sm text-advist-gray900">{session.ip}</span>
                      <p className="text-xs text-advist-gray900">{session.location}</p>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-sm text-advist-gray900">{formatTimeAgo(session.lastActivity)}</span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <Button variant="ghost" size="sm" className="text-advist-error hover:bg-advist-gold-light">
                      <XCircle size={14} />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Security Policies Modal */}
      <Modal
        isOpen={showPoliciesModal}
        onClose={() => setShowPoliciesModal(false)}
        title="Politiques de securite"
        size="md"
      >
        <div className="space-y-3">
          {securityPolicies.map((policy) => (
            <div key={policy.name} className="flex items-center justify-between p-3 bg-advist-bg rounded-xl">
              <div>
                <span className="font-medium text-advist-gray900">{policy.name}</span>
                <p className="text-sm text-advist-gray900">{policy.value}</p>
              </div>
              <Badge variant={policy.status === 'active' ? 'success' : 'default'}>
                {policy.status === 'active' ? 'Actif' : 'Inactif'}
              </Badge>
            </div>
          ))}

          <Button className="w-full mt-4">
            <Settings size={16} className="mr-2" />
            Modifier les politiques
          </Button>
        </div>
      </Modal>

      {/* Block IP Modal */}
      <Modal
        isOpen={showBlockIPModal}
        onClose={() => setShowBlockIPModal(false)}
        title="Bloquer une adresse IP"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-advist-gray900 mb-1">
              Adresse IP
            </label>
            <input
              type="text"
              placeholder="192.168.1.1"
              className="w-full px-3 py-2 border border-advist-bg rounded-xl focus:outline-none focus:ring-2 focus:ring-advist-gold"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-advist-gray900 mb-1">
              Raison
            </label>
            <select className="w-full px-3 py-2 border border-advist-bg rounded-xl focus:outline-none focus:ring-2 focus:ring-advist-gold">
              <option>Tentative de brute force</option>
              <option>Activite suspecte</option>
              <option>Injection SQL</option>
              <option>Scanning</option>
              <option>Autre</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-advist-gray900 mb-1">
              Duree
            </label>
            <select className="w-full px-3 py-2 border border-advist-bg rounded-xl focus:outline-none focus:ring-2 focus:ring-advist-gold">
              <option>24 heures</option>
              <option>7 jours</option>
              <option>30 jours</option>
              <option>Permanent</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" className="flex-1" onClick={() => setShowBlockIPModal(false)}>
              Annuler
            </Button>
            <Button variant="danger" className="flex-1">
              <Ban size={16} className="mr-2" />
              Bloquer
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SuperAdminSecurityPage;
