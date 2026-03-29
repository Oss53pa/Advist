import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Server,
  Database,
  HardDrive,
  Cpu,
  Activity,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  Zap,
  Globe,
  Shield,
  Settings,
  Play,
  Pause,
  RotateCcw,
  Terminal,
  Cloud,
  Wifi,
  Lock,
  Key,
  FileText,
  Download,
  Upload,
  Trash2,
  Calendar,
} from 'lucide-react';
import { Card, Button, Badge, Modal } from '../../components/ui';

// Types
interface ServiceStatus {
  name: string;
  status: 'healthy' | 'warning' | 'critical' | 'maintenance';
  latency: string;
  uptime: string;
  lastCheck: string;
  version: string;
  icon: React.ElementType;
}

interface SystemMetric {
  label: string;
  value: number;
  max: number;
  unit: string;
  status: 'normal' | 'warning' | 'critical';
}

interface Job {
  id: string;
  name: string;
  status: 'running' | 'completed' | 'failed' | 'scheduled';
  lastRun: string;
  nextRun: string;
  duration: string;
}

// Mock data
const services: ServiceStatus[] = [
  { name: 'API Gateway', status: 'healthy', latency: '45ms', uptime: '99.99%', lastCheck: '30s', version: 'v2.4.1', icon: Globe },
  { name: 'PostgreSQL', status: 'healthy', latency: '12ms', uptime: '99.98%', lastCheck: '30s', version: '15.4', icon: Database },
  { name: 'Redis Cache', status: 'healthy', latency: '2ms', uptime: '100%', lastCheck: '30s', version: '7.2', icon: Zap },
  { name: 'Object Storage (S3)', status: 'warning', latency: '120ms', uptime: '99.5%', lastCheck: '30s', version: 'N/A', icon: HardDrive },
  { name: 'Queue Worker', status: 'healthy', latency: '8ms', uptime: '99.99%', lastCheck: '30s', version: 'v1.2.0', icon: Activity },
  { name: 'Email Service', status: 'healthy', latency: '250ms', uptime: '99.9%', lastCheck: '30s', version: 'v3.1.0', icon: Cloud },
  { name: 'PDF Generator', status: 'healthy', latency: '180ms', uptime: '99.95%', lastCheck: '30s', version: 'v2.0.5', icon: FileText },
  { name: 'Auth Service', status: 'healthy', latency: '35ms', uptime: '100%', lastCheck: '30s', version: 'v4.0.0', icon: Lock },
];

const systemMetrics: SystemMetric[] = [
  { label: 'CPU', value: 34, max: 100, unit: '%', status: 'normal' },
  { label: 'Memoire', value: 67, max: 100, unit: '%', status: 'normal' },
  { label: 'Disque', value: 45, max: 100, unit: '%', status: 'normal' },
  { label: 'Reseau', value: 23, max: 100, unit: 'Mbps', status: 'normal' },
];

const scheduledJobs: Job[] = [
  { id: '1', name: 'Backup Database', status: 'completed', lastRun: '2024-11-29 02:00', nextRun: '2024-11-30 02:00', duration: '15min' },
  { id: '2', name: 'Clean Temp Files', status: 'completed', lastRun: '2024-11-29 04:00', nextRun: '2024-11-30 04:00', duration: '2min' },
  { id: '3', name: 'Generate Reports', status: 'running', lastRun: '2024-11-29 06:00', nextRun: '2024-11-30 06:00', duration: '8min' },
  { id: '4', name: 'Sync External APIs', status: 'scheduled', lastRun: '2024-11-28 12:00', nextRun: '2024-11-29 12:00', duration: '5min' },
  { id: '5', name: 'Archive Old Documents', status: 'failed', lastRun: '2024-11-28 03:00', nextRun: '2024-11-29 03:00', duration: 'N/A' },
  { id: '6', name: 'Update Search Index', status: 'completed', lastRun: '2024-11-29 01:00', nextRun: '2024-11-30 01:00', duration: '12min' },
];

const recentLogs = [
  { time: '09:45:23', level: 'INFO', service: 'API', message: 'Request processed successfully - /api/v1/documents' },
  { time: '09:45:18', level: 'WARN', service: 'Storage', message: 'High latency detected on S3 bucket advist-prod' },
  { time: '09:45:12', level: 'INFO', service: 'Auth', message: 'User login successful - user@example.com' },
  { time: '09:45:08', level: 'ERROR', service: 'Queue', message: 'Job failed: archive_documents - Timeout exceeded' },
  { time: '09:45:01', level: 'INFO', service: 'Cache', message: 'Cache invalidated for tenant: advist-demo' },
  { time: '09:44:55', level: 'DEBUG', service: 'PDF', message: 'Document generated: contract_2024_001.pdf' },
];

const maintenanceWindows = [
  { date: '2024-12-01', time: '02:00 - 04:00 UTC', type: 'Database maintenance', impact: 'Low' },
  { date: '2024-12-15', time: '01:00 - 03:00 UTC', type: 'Security patches', impact: 'Medium' },
];

export const SuperAdminSystemPage: React.FC = () => {
  const { t } = useTranslation();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceStatus | null>(null);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1500);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-advist-success';
      case 'warning': return 'bg-advist-gold';
      case 'critical': return 'bg-advist-error';
      case 'maintenance': return 'bg-advist-dark';
      default: return 'bg-advist-text-secondary';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy': return <Badge variant="success">Operationnel</Badge>;
      case 'warning': return <Badge variant="warning">Attention</Badge>;
      case 'critical': return <Badge variant="danger">Critique</Badge>;
      case 'maintenance': return <Badge variant="default">Maintenance</Badge>;
      default: return <Badge>Inconnu</Badge>;
    }
  };

  const getJobStatusBadge = (status: string) => {
    switch (status) {
      case 'running': return <Badge variant="primary">En cours</Badge>;
      case 'completed': return <Badge variant="success">Termine</Badge>;
      case 'failed': return <Badge variant="danger">Echec</Badge>;
      case 'scheduled': return <Badge variant="default">Planifie</Badge>;
      default: return <Badge>Inconnu</Badge>;
    }
  };

  const getLogLevelClass = (level: string) => {
    switch (level) {
      case 'ERROR': return 'text-advist-error bg-advist-gold-light';
      case 'WARN': return 'text-advist-gold-dark bg-advist-gold-light';
      case 'INFO': return 'text-advist-gray900 bg-advist-gold-light';
      case 'DEBUG': return 'text-advist-text-secondary bg-advist-surface-dark';
      default: return 'text-advist-text-secondary bg-advist-surface-dark';
    }
  };

  const getMetricColor = (status: string) => {
    switch (status) {
      case 'normal': return 'bg-advist-success';
      case 'warning': return 'bg-advist-gold';
      case 'critical': return 'bg-advist-error';
      default: return 'bg-advist-text-secondary';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-advist-gray900">
            Systeme & Infrastructure
          </h1>
          <p className="text-advist-gray900 mt-1">
            Surveillance et gestion de l'infrastructure ADVIST
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw size={16} className={`mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button variant="outline" onClick={() => setShowMaintenanceModal(true)}>
            <Clock size={16} className="mr-2" />
            Maintenance
          </Button>
          <Button>
            <Terminal size={16} className="mr-2" />
            Console
          </Button>
        </div>
      </div>

      {/* System Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {systemMetrics.map((metric) => (
          <Card key={metric.label} className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-advist-gray900">{metric.label}</span>
              <span className="text-lg font-bold text-advist-gray900">{metric.value}{metric.unit}</span>
            </div>
            <div className="h-2 bg-advist-bg rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${getMetricColor(metric.status)}`}
                style={{ width: `${metric.value}%` }}
              />
            </div>
          </Card>
        ))}
      </div>

      {/* Services Grid */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Server size={20} className="text-advist-gray900" />
            <h2 className="text-lg font-semibold text-advist-gray900">Services</h2>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-advist-success rounded-full animate-pulse" />
              <span className="text-xs text-advist-success">7 operationnels</span>
            </div>
            <div className="flex items-center gap-1.5 ml-4">
              <div className="w-2 h-2 bg-advist-gold rounded-full" />
              <span className="text-xs text-advist-gold-dark">1 attention</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {services.map((service) => (
            <div
              key={service.name}
              onClick={() => setSelectedService(service)}
              className="p-4 bg-advist-bg rounded-xl hover:bg-advist-bg transition-all duration-240 cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${getStatusColor(service.status)}`} />
                  <service.icon size={16} className="text-advist-gray900" />
                </div>
                {getStatusBadge(service.status)}
              </div>
              <h3 className="font-medium text-advist-gray900 mb-2">{service.name}</h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-advist-gray900">Latence</p>
                  <p className="font-medium text-advist-gray900">{service.latency}</p>
                </div>
                <div>
                  <p className="text-advist-gray900">Uptime</p>
                  <p className="font-medium text-advist-success">{service.uptime}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Jobs & Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scheduled Jobs */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Clock size={20} className="text-advist-gray900" />
              <h2 className="text-lg font-semibold text-advist-gray900">Taches planifiees</h2>
            </div>
            <Button variant="outline" size="sm">
              <Play size={14} className="mr-2" />
              Executer
            </Button>
          </div>

          <div className="space-y-3">
            {scheduledJobs.map((job) => (
              <div key={job.id} className="flex items-center justify-between p-3 bg-advist-bg rounded-xl">
                <div className="flex items-center gap-3">
                  {job.status === 'running' && (
                    <RefreshCw size={14} className="text-advist-gray900 animate-spin" />
                  )}
                  {job.status === 'completed' && (
                    <CheckCircle size={14} className="text-advist-success" />
                  )}
                  {job.status === 'failed' && (
                    <XCircle size={14} className="text-advist-error" />
                  )}
                  {job.status === 'scheduled' && (
                    <Clock size={14} className="text-advist-text-secondary" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-advist-gray900">{job.name}</p>
                    <p className="text-xs text-advist-gray900">Prochaine: {job.nextRun}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-advist-gray900">{job.duration}</span>
                  {getJobStatusBadge(job.status)}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Logs */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Terminal size={20} className="text-advist-gray900" />
              <h2 className="text-lg font-semibold text-advist-gray900">Logs recents</h2>
            </div>
            <Button variant="outline" size="sm">
              Voir tout
            </Button>
          </div>

          <div className="space-y-2 font-mono text-xs">
            {recentLogs.map((log, index) => (
              <div key={index} className="flex items-start gap-2 p-2 bg-advist-bg rounded">
                <span className="text-advist-gray900 whitespace-nowrap">{log.time}</span>
                <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${getLogLevelClass(log.level)}`}>
                  {log.level}
                </span>
                <span className="text-advist-gray900">[{log.service}]</span>
                <span className="text-advist-gray900 flex-1 truncate">{log.message}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-advist-gray900 mb-6">Actions systeme</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[
            { icon: Database, label: 'Backup DB', color: 'blue' },
            { icon: Zap, label: 'Vider cache', color: 'orange' },
            { icon: RotateCcw, label: 'Restart services', color: 'purple' },
            { icon: Download, label: 'Export logs', color: 'green' },
            { icon: Trash2, label: 'Clean temp', color: 'red' },
            { icon: Shield, label: 'Scan securite', color: 'indigo' },
          ].map((action) => (
            <button
              key={action.label}
              className="flex flex-col items-center gap-3 p-4 bg-advist-bg rounded-xl hover:bg-advist-bg transition-all duration-240"
            >
              <action.icon size={24} className={`text-${action.color}-600`} />
              <span className="text-sm font-medium text-advist-gray900">{action.label}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* Maintenance Modal */}
      <Modal
        isOpen={showMaintenanceModal}
        onClose={() => setShowMaintenanceModal(false)}
        title="Fenetres de maintenance"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-advist-gray900">
            Prochaines maintenances planifiees pour la plateforme ADVIST.
          </p>

          {maintenanceWindows.map((window, index) => (
            <div key={index} className="p-4 bg-advist-bg rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-advist-gray900">{window.type}</span>
                <Badge variant={window.impact === 'Low' ? 'success' : 'warning'}>
                  Impact {window.impact}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-advist-gray900">
                <div className="flex items-center gap-1">
                  <Calendar size={14} />
                  {window.date}
                </div>
                <div className="flex items-center gap-1">
                  <Clock size={14} />
                  {window.time}
                </div>
              </div>
            </div>
          ))}

          <Button className="w-full mt-4">
            <Clock size={16} className="mr-2" />
            Planifier une maintenance
          </Button>
        </div>
      </Modal>

      {/* Service Detail Modal */}
      <Modal
        isOpen={!!selectedService}
        onClose={() => setSelectedService(null)}
        title={selectedService?.name || ''}
        size="md"
      >
        {selectedService && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-advist-bg rounded-xl">
              <span className="text-sm text-advist-gray900">Statut</span>
              {getStatusBadge(selectedService.status)}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-advist-bg rounded-xl">
                <p className="text-xs text-advist-gray900">Latence</p>
                <p className="text-lg font-bold text-advist-gray900">{selectedService.latency}</p>
              </div>
              <div className="p-4 bg-advist-bg rounded-xl">
                <p className="text-xs text-advist-gray900">Uptime</p>
                <p className="text-lg font-bold text-advist-success">{selectedService.uptime}</p>
              </div>
              <div className="p-4 bg-advist-bg rounded-xl">
                <p className="text-xs text-advist-gray900">Version</p>
                <p className="text-lg font-bold text-advist-gray900">{selectedService.version}</p>
              </div>
              <div className="p-4 bg-advist-bg rounded-xl">
                <p className="text-xs text-advist-gray900">Derniere verification</p>
                <p className="text-lg font-bold text-advist-gray900">{selectedService.lastCheck}</p>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1">
                <RotateCcw size={16} className="mr-2" />
                Redemarrer
              </Button>
              <Button variant="outline" className="flex-1">
                <Terminal size={16} className="mr-2" />
                Logs
              </Button>
              <Button variant="outline" className="flex-1">
                <Settings size={16} className="mr-2" />
                Config
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SuperAdminSystemPage;
