/**
 * Integration Card Component
 * Displays a single integration provider with connection status and actions
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Cloud,
  Database,
  Users,
  Check,
  X,
  AlertTriangle,
  Loader2,
  Settings,
  RefreshCw,
  Plug,
  PlugZap,
  _ExternalLink,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import type { IntegrationConnection, IntegrationProvider } from '../../services/integrations';

interface IntegrationCardProps {
  provider: IntegrationProvider;
  connection?: IntegrationConnection;
  onConnect: () => void;
  onConfigure: () => void;
  onDisconnect: () => void;
  onSync: () => void;
  isConnecting?: boolean;
  isSyncing?: boolean;
  disabled?: boolean;
}

const PROVIDER_INFO: Record<
  IntegrationProvider,
  {
    name: string;
    description: string;
    icon: React.ElementType;
    color: string;
    bgColor: string;
    category: 'cloud' | 'erp' | 'crm';
  }
> = {
  microsoft_365: {
    name: 'Microsoft 365',
    description: 'SharePoint, OneDrive, Outlook, Teams',
    icon: Cloud,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    category: 'cloud',
  },
  google_workspace: {
    name: 'Google Workspace',
    description: 'Drive, Gmail, Calendar',
    icon: Cloud,
    color: 'text-red-500',
    bgColor: 'bg-red-100',
    category: 'cloud',
  },
  sage_100: {
    name: 'Sage 100',
    description: 'Gestion commerciale et comptable',
    icon: Database,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    category: 'erp',
  },
  sage_x3: {
    name: 'Sage X3',
    description: 'ERP entreprise',
    icon: Database,
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    category: 'erp',
  },
  sage_bc: {
    name: 'Sage Business Cloud',
    description: 'Comptabilite cloud',
    icon: Database,
    color: 'text-green-500',
    bgColor: 'bg-green-100',
    category: 'erp',
  },
  sap_b1: {
    name: 'SAP Business One',
    description: 'ERP pour PME',
    icon: Database,
    color: 'text-blue-800',
    bgColor: 'bg-blue-100',
    category: 'erp',
  },
  sap_s4: {
    name: 'SAP S/4HANA',
    description: 'ERP intelligent',
    icon: Database,
    color: 'text-blue-900',
    bgColor: 'bg-blue-100',
    category: 'erp',
  },
  salesforce: {
    name: 'Salesforce',
    description: 'CRM et gestion des ventes',
    icon: Users,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-100',
    category: 'crm',
  },
};

export const IntegrationCard: React.FC<IntegrationCardProps> = ({
  provider,
  connection,
  onConnect,
  onConfigure,
  onDisconnect,
  onSync,
  isConnecting = false,
  isSyncing = false,
  disabled = false,
}) => {
  const { t } = useTranslation();
  const info = PROVIDER_INFO[provider];
  const Icon = info.icon;

  const isConnected = connection?.status === 'connected';
  const hasError = connection?.status === 'error';

  const getStatusBadge = () => {
    if (!connection) {
      return (
        <Badge variant="secondary" className="flex items-center gap-1">
          <Plug size={12} />
          {t('integrations.status.notConfigured', 'Non configure')}
        </Badge>
      );
    }

    switch (connection.status) {
      case 'connected':
        return (
          <Badge variant="success" className="flex items-center gap-1">
            <Check size={12} />
            {t('integrations.status.connected', 'Connecte')}
          </Badge>
        );
      case 'disconnected':
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <X size={12} />
            {t('integrations.status.disconnected', 'Deconnecte')}
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertTriangle size={12} />
            {t('integrations.status.error', 'Erreur')}
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="warning" className="flex items-center gap-1">
            <Loader2 size={12} className="animate-spin" />
            {t('integrations.status.pending', 'En attente')}
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <Card className="p-6" hoverable>
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={`p-3 rounded-xl ${info.bgColor}`}>
          <Icon className={`w-6 h-6 ${info.color}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <h3 className="text-lg font-semibold text-advist-gray900 truncate">{info.name}</h3>
            {getStatusBadge()}
          </div>
          <p className="text-sm text-advist-gray900/60 mb-3">{info.description}</p>

          {/* Last sync info */}
          {connection?.last_sync_at && (
            <p className="text-xs text-advist-gray900/50 mb-3">
              {t('integrations.lastSync', 'Derniere sync')}:{' '}
              {new Date(connection.last_sync_at).toLocaleString('fr-FR')}
            </p>
          )}

          {/* Error message */}
          {hasError && connection?.error_message && (
            <div className="p-2 bg-red-50 rounded-lg mb-3">
              <p className="text-xs text-red-600">{connection.error_message}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            {!connection ? (
              <Button onClick={onConnect} disabled={disabled || isConnecting} size="sm">
                {isConnecting ? (
                  <Loader2 size={16} className="animate-spin mr-2" />
                ) : (
                  <PlugZap size={16} className="mr-2" />
                )}
                {t('integrations.connect', 'Connecter')}
              </Button>
            ) : isConnected ? (
              <>
                <Button variant="outline" size="sm" onClick={onSync} disabled={isSyncing}>
                  {isSyncing ? (
                    <Loader2 size={16} className="animate-spin mr-2" />
                  ) : (
                    <RefreshCw size={16} className="mr-2" />
                  )}
                  {t('integrations.sync', 'Synchroniser')}
                </Button>
                <Button variant="ghost" size="sm" onClick={onConfigure}>
                  <Settings size={16} className="mr-2" />
                  {t('integrations.configure', 'Configurer')}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDisconnect}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <X size={16} className="mr-2" />
                  {t('integrations.disconnect', 'Deconnecter')}
                </Button>
              </>
            ) : (
              <>
                <Button onClick={onConnect} disabled={isConnecting} size="sm">
                  {isConnecting ? (
                    <Loader2 size={16} className="animate-spin mr-2" />
                  ) : (
                    <RefreshCw size={16} className="mr-2" />
                  )}
                  {t('integrations.reconnect', 'Reconnecter')}
                </Button>
                <Button variant="ghost" size="sm" onClick={onConfigure}>
                  <Settings size={16} className="mr-2" />
                  {t('integrations.configure', 'Configurer')}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default IntegrationCard;
