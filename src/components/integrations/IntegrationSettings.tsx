/**
 * Integration Settings Component
 * Main settings page for managing all external integrations
 */
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Plug,
  Cloud,
  Database,
  Users,
  Activity,
  Settings,
  RefreshCw,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { IntegrationCard } from './IntegrationCard';
import { ConnectionSetupModal } from './ConnectionSetupModal';
import { SyncMappingConfig } from './SyncMappingConfig';
import { SyncStatusDashboard } from './SyncStatusDashboard';
import { useIntegrationStore } from '../../stores';
import { useTenantStore } from '../../stores';
import type { IntegrationProvider, IntegrationConnection } from '../../services/integrations';
import { INTEGRATION_PROVIDERS } from '../../services/integrations';
import { FeatureGate, UpgradeBanner } from '../gating';

type TabId = 'connections' | 'sync' | 'logs';

const PROVIDER_CATEGORIES = {
  cloud: {
    label: 'Cloud Storage',
    icon: Cloud,
    providers: ['microsoft_365', 'google_workspace'] as IntegrationProvider[],
  },
  erp: {
    label: 'ERP',
    icon: Database,
    providers: ['sage_100', 'sage_x3', 'sage_bc', 'sap_b1', 'sap_s4'] as IntegrationProvider[],
  },
  crm: {
    label: 'CRM',
    icon: Users,
    providers: ['salesforce'] as IntegrationProvider[],
  },
};

export const IntegrationSettings: React.FC = () => {
  const { t } = useTranslation();
  const { features } = useTenantStore();
  const {
    connections,
    isLoading,
    isConnecting,
    isSyncing,
    error,
    fetchConnections,
    deleteConnection,
    syncNow,
    disconnect,
    clearError,
  } = useIntegrationStore();

  const [activeTab, setActiveTab] = useState<TabId>('connections');
  const [setupProvider, setSetupProvider] = useState<IntegrationProvider | null>(null);
  const [configureConnection, setConfigureConnection] = useState<IntegrationConnection | null>(
    null
  );

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  const getConnectionForProvider = (
    provider: IntegrationProvider
  ): IntegrationConnection | undefined => {
    return (connections ?? []).find((c) => c.provider === provider);
  };

  const handleConnect = (provider: IntegrationProvider) => {
    setSetupProvider(provider);
  };

  const handleConfigure = (connection: IntegrationConnection) => {
    setConfigureConnection(connection);
  };

  const handleDisconnect = async (connection: IntegrationConnection) => {
    if (
      window.confirm(
        t(
          'integrations.confirmDisconnect',
          'Etes-vous sur de vouloir deconnecter cette integration?'
        )
      )
    ) {
      await disconnect(connection.id);
    }
  };

  const handleSync = async (connection: IntegrationConnection) => {
    await syncNow(connection.id);
  };

  const _handleDelete = async (connection: IntegrationConnection) => {
    if (
      window.confirm(
        t('integrations.confirmDelete', 'Supprimer cette connexion? Cette action est irreversible.')
      )
    ) {
      await deleteConnection(connection.id);
    }
  };

  const isProviderEnabled = (provider: IntegrationProvider): boolean => {
    // Check tenant features
    if (provider === 'microsoft_365' || provider === 'google_workspace') {
      return features?.cloudIntegration ?? false;
    }
    if (provider.startsWith('sage_') || provider.startsWith('sap_')) {
      return features?.erpIntegration ?? false;
    }
    if (provider === 'salesforce') {
      return features?.crmIntegration ?? false;
    }
    return false;
  };

  const tabs = [
    {
      id: 'connections' as TabId,
      label: t('integrations.tabs.connections', 'Connexions'),
      icon: Plug,
    },
    { id: 'sync' as TabId, label: t('integrations.tabs.sync', 'Synchronisation'), icon: RefreshCw },
    { id: 'logs' as TabId, label: t('integrations.tabs.logs', 'Historique'), icon: Activity },
  ];

  const renderConnectionsTab = () => (
    <div className="space-y-8">
      {Object.entries(PROVIDER_CATEGORIES).map(([categoryKey, category]) => {
        const CategoryIcon = category.icon;
        const hasEnabledProvider = category.providers.some(isProviderEnabled);

        const categoryContent = (
          <div key={categoryKey}>
            <div className="flex items-center gap-3 mb-4">
              <CategoryIcon size={20} className="text-advist-gray900/60" />
              <h3 className="text-lg font-semibold text-advist-gray900">{category.label}</h3>
              {!hasEnabledProvider && (
                <Badge variant="secondary">
                  {t('integrations.upgradePlan', 'Plan superieur requis')}
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {category.providers.map((provider) => {
                const connection = getConnectionForProvider(provider);
                const isEnabled = isProviderEnabled(provider);

                return (
                  <IntegrationCard
                    key={provider}
                    provider={provider}
                    connection={connection}
                    onConnect={() => handleConnect(provider)}
                    onConfigure={() => connection && handleConfigure(connection)}
                    onDisconnect={() => connection && handleDisconnect(connection)}
                    onSync={() => connection && handleSync(connection)}
                    isConnecting={isConnecting}
                    isSyncing={isSyncing}
                    disabled={!isEnabled}
                  />
                );
              })}
            </div>
          </div>
        );

        // Gate ERP and CRM categories behind integrations_erp_crm feature
        if (categoryKey === 'erp' || categoryKey === 'crm') {
          return (
            <FeatureGate
              key={categoryKey}
              feature="integrations_erp_crm"
              fallback={
                <UpgradeBanner
                  feature="integrations_erp_crm"
                  requiredPlan="Entreprise"
                  title={`${category.label} (SAP, Sage, Salesforce…)`}
                  description="Connectez vos systèmes ERP et CRM dans le plan Entreprise."
                  size="sm"
                />
              }
            >
              {categoryContent}
            </FeatureGate>
          );
        }

        return categoryContent;
      })}
    </div>
  );

  const renderSyncTab = () => {
    const connectedConnections = (connections ?? []).filter((c) => c.status === 'connected');

    if (connectedConnections.length === 0) {
      return (
        <Card className="p-8">
          <div className="flex flex-col items-center text-center">
            <Plug size={48} className="text-advist-gray900/30 mb-4" />
            <h3 className="text-lg font-medium text-advist-gray900 mb-2">
              {t('integrations.noConnections', 'Aucune integration connectee')}
            </h3>
            <p className="text-sm text-advist-gray900/60 mb-4">
              {t(
                'integrations.noConnectionsDesc',
                'Connectez une integration pour configurer la synchronisation'
              )}
            </p>
            <Button onClick={() => setActiveTab('connections')}>
              {t('integrations.goToConnections', 'Voir les connexions')}
            </Button>
          </div>
        </Card>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-advist-gray900">
            {t('integrations.selectConnection', 'Selectionner une connexion')}:
          </label>
          <select
            value={configureConnection?.id || ''}
            onChange={(e) => {
              const conn = (connections ?? []).find((c) => c.id === e.target.value);
              setConfigureConnection(conn || null);
            }}
            className="px-4 py-2 bg-white border border-advist-gray200 rounded-xl focus:ring-2 focus:ring-advist-primary focus:border-advist-primary"
          >
            <option value="">{t('integrations.selectConnectionPlaceholder', 'Choisir...')}</option>
            {connectedConnections.map((conn) => (
              <option key={conn.id} value={conn.id}>
                {conn.name} ({INTEGRATION_PROVIDERS[conn.provider]})
              </option>
            ))}
          </select>
        </div>

        {configureConnection ? (
          <SyncMappingConfig
            connection={configureConnection}
            onClose={() => setConfigureConnection(null)}
          />
        ) : (
          <Card className="p-8">
            <div className="flex flex-col items-center text-center">
              <Settings size={48} className="text-advist-gray900/30 mb-4" />
              <p className="text-sm text-advist-gray900/60">
                {t(
                  'integrations.selectConnectionToConfig',
                  'Selectionnez une connexion pour configurer les mappings'
                )}
              </p>
            </div>
          </Card>
        )}
      </div>
    );
  };

  const renderLogsTab = () => <SyncStatusDashboard />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-gradient-to-br from-advist-primary to-advist-primary/80 rounded-xl">
            <Plug className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-advist-gray900">
              {t('integrations.title', 'Integrations')}
            </h2>
            <p className="text-advist-gray900/60 mt-1">
              {t(
                'integrations.description',
                "Connectez ADVIST a vos logiciels d'entreprise pour synchroniser documents et workflows"
              )}
            </p>
          </div>
          <Button variant="outline" onClick={() => fetchConnections()} disabled={isLoading}>
            <RefreshCw size={16} className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            {t('common.refresh', 'Actualiser')}
          </Button>
        </div>
      </Card>

      {/* Error Banner */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
          <AlertCircle size={20} className="text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-700 flex-1">{error}</p>
          <Button variant="ghost" size="sm" onClick={clearError}>
            {t('common.dismiss', 'Fermer')}
          </Button>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-advist-gray200">
        <nav className="flex gap-1">
          {tabs.map((tab) => {
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-3 text-sm font-medium
                  border-b-2 transition-colors
                  ${
                    activeTab === tab.id
                      ? 'border-advist-primary text-advist-primary'
                      : 'border-transparent text-advist-gray900/60 hover:text-advist-gray900'
                  }
                `}
              >
                <TabIcon size={18} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {isLoading && activeTab === 'connections' ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={32} className="animate-spin text-advist-primary" />
        </div>
      ) : (
        <>
          {activeTab === 'connections' && renderConnectionsTab()}
          {activeTab === 'sync' && renderSyncTab()}
          {activeTab === 'logs' && renderLogsTab()}
        </>
      )}

      {/* Setup Modal */}
      {setupProvider && (
        <ConnectionSetupModal
          isOpen={true}
          onClose={() => setSetupProvider(null)}
          provider={setupProvider}
        />
      )}
    </div>
  );
};

export default IntegrationSettings;
