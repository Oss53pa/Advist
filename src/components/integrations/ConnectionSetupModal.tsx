/**
 * Connection Setup Modal Component
 * Modal for setting up a new integration connection with OAuth or credentials
 */
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Cloud,
  Database,
  Users,
  Key,
  Link2,
  Loader2,
  Check,
  X,
  AlertTriangle,
  Eye,
  EyeOff,
  ExternalLink,
  Server,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useIntegrationStore } from '../../stores';
import type { IntegrationProvider } from '../../services/integrations';

interface ConnectionSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  provider: IntegrationProvider;
  existingConnectionId?: string;
}

const PROVIDER_CONFIG: Record<IntegrationProvider, {
  name: string;
  icon: React.ElementType;
  color: string;
  authType: 'oauth' | 'credentials' | 'both';
  fields?: Array<{
    key: string;
    label: string;
    type: 'text' | 'password' | 'url';
    required: boolean;
    placeholder?: string;
  }>;
}> = {
  microsoft_365: {
    name: 'Microsoft 365',
    icon: Cloud,
    color: 'text-blue-600',
    authType: 'oauth',
  },
  google_workspace: {
    name: 'Google Workspace',
    icon: Cloud,
    color: 'text-red-500',
    authType: 'oauth',
  },
  sage_100: {
    name: 'Sage 100',
    icon: Database,
    color: 'text-green-600',
    authType: 'credentials',
    fields: [
      { key: 'api_url', label: 'URL du serveur', type: 'url', required: true, placeholder: 'https://sage100.example.com/api' },
      { key: 'username', label: 'Nom d\'utilisateur', type: 'text', required: true },
      { key: 'password', label: 'Mot de passe', type: 'password', required: true },
      { key: 'company_code', label: 'Code societe', type: 'text', required: false },
    ],
  },
  sage_x3: {
    name: 'Sage X3',
    icon: Database,
    color: 'text-green-700',
    authType: 'credentials',
    fields: [
      { key: 'api_url', label: 'URL OData', type: 'url', required: true, placeholder: 'https://sagex3.example.com/odata' },
      { key: 'username', label: 'Nom d\'utilisateur', type: 'text', required: true },
      { key: 'password', label: 'Mot de passe', type: 'password', required: true },
      { key: 'company_code', label: 'Code dossier', type: 'text', required: true },
    ],
  },
  sage_bc: {
    name: 'Sage Business Cloud',
    icon: Cloud,
    color: 'text-green-500',
    authType: 'oauth',
  },
  sap_b1: {
    name: 'SAP Business One',
    icon: Database,
    color: 'text-blue-800',
    authType: 'credentials',
    fields: [
      { key: 'api_url', label: 'URL Service Layer', type: 'url', required: true, placeholder: 'https://sapb1.example.com:50000/b1s/v1' },
      { key: 'username', label: 'Nom d\'utilisateur', type: 'text', required: true },
      { key: 'password', label: 'Mot de passe', type: 'password', required: true },
      { key: 'company_code', label: 'Base de donnees', type: 'text', required: true },
    ],
  },
  sap_s4: {
    name: 'SAP S/4HANA',
    icon: Database,
    color: 'text-blue-900',
    authType: 'both',
    fields: [
      { key: 'api_url', label: 'URL OData', type: 'url', required: true, placeholder: 'https://s4hana.example.com/sap/opu/odata/sap' },
      { key: 'username', label: 'Nom d\'utilisateur', type: 'text', required: true },
      { key: 'password', label: 'Mot de passe', type: 'password', required: true },
    ],
  },
  salesforce: {
    name: 'Salesforce',
    icon: Users,
    color: 'text-cyan-600',
    authType: 'oauth',
  },
};

export const ConnectionSetupModal: React.FC<ConnectionSetupModalProps> = ({
  isOpen,
  onClose,
  provider,
  existingConnectionId,
}) => {
  const { t } = useTranslation();
  const {
    isConnecting,
    error,
    createConnection,
    startOAuthFlow,
    completeOAuthFlow,
    connectWithCredentials,
    clearError,
  } = useIntegrationStore();

  const config = PROVIDER_CONFIG[provider];
  const Icon = config.icon;

  const [step, setStep] = useState<'name' | 'auth' | 'credentials' | 'success'>('name');
  const [connectionName, setConnectionName] = useState('');
  const [connectionId, setConnectionId] = useState(existingConnectionId || '');
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [isSandbox, setIsSandbox] = useState(false);

  const handleClose = () => {
    setStep('name');
    setConnectionName('');
    setConnectionId('');
    setCredentials({});
    clearError();
    onClose();
  };

  const handleCreateConnection = async () => {
    try {
      const connection = await createConnection(provider, connectionName);
      setConnectionId(connection.id);

      if (config.authType === 'oauth' || config.authType === 'both') {
        setStep('auth');
      } else {
        setStep('credentials');
      }
    } catch (err) {
      console.error('Failed to create connection:', err);
    }
  };

  const handleOAuthConnect = async () => {
    try {
      const redirectUri = `${window.location.origin}/integrations/oauth/callback`;
      const authUrl = await startOAuthFlow(connectionId, redirectUri);

      // Open OAuth popup
      const popup = window.open(
        authUrl,
        'oauth_popup',
        'width=600,height=700,scrollbars=yes'
      );

      // Listen for OAuth callback
      const handleMessage = async (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;

        if (event.data?.type === 'oauth_callback') {
          window.removeEventListener('message', handleMessage);
          popup?.close();

          const { code, state } = event.data;
          await completeOAuthFlow(connectionId, code, state, redirectUri);
          setStep('success');
        }
      };

      window.addEventListener('message', handleMessage);
    } catch (err) {
      console.error('OAuth flow failed:', err);
    }
  };

  const handleCredentialsConnect = async () => {
    try {
      const success = await connectWithCredentials(connectionId, {
        api_url: credentials.api_url || '',
        username: credentials.username || '',
        password: credentials.password || '',
        company_code: credentials.company_code,
      });

      if (success) {
        setStep('success');
      }
    } catch (err) {
      console.error('Credentials connection failed:', err);
    }
  };

  const togglePasswordVisibility = (key: string) => {
    setShowPasswords((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const renderNameStep = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-4 p-4 bg-advist-bg rounded-xl">
        <div className={`p-3 rounded-xl bg-white`}>
          <Icon className={`w-8 h-8 ${config.color}`} />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-advist-gray900">{config.name}</h3>
          <p className="text-sm text-advist-gray900/60">
            {t('integrations.setup.configureConnection', 'Configurer la connexion')}
          </p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-advist-gray900 mb-2">
          {t('integrations.setup.connectionName', 'Nom de la connexion')}
        </label>
        <Input
          value={connectionName}
          onChange={(e) => setConnectionName(e.target.value)}
          placeholder={t('integrations.setup.namePlaceholder', 'Ex: Production, Test, etc.')}
        />
        <p className="mt-2 text-sm text-advist-gray900/60">
          {t('integrations.setup.nameHelp', 'Un nom pour identifier cette connexion')}
        </p>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-advist-gray200">
        <Button variant="outline" onClick={handleClose}>
          {t('common.cancel', 'Annuler')}
        </Button>
        <Button
          onClick={handleCreateConnection}
          disabled={!connectionName.trim() || isConnecting}
        >
          {isConnecting ? (
            <Loader2 size={16} className="animate-spin mr-2" />
          ) : null}
          {t('common.continue', 'Continuer')}
        </Button>
      </div>
    </div>
  );

  const renderAuthStep = () => (
    <div className="space-y-6">
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-advist-primary/10 rounded-full mb-4">
          <Link2 size={32} className="text-advist-primary" />
        </div>
        <h3 className="text-lg font-semibold text-advist-gray900 mb-2">
          {t('integrations.setup.connectWith', 'Connecter avec')} {config.name}
        </h3>
        <p className="text-sm text-advist-gray900/60 max-w-sm mx-auto">
          {t('integrations.setup.oauthDescription', 'Vous allez etre redirige vers la page de connexion pour autoriser ADVIST')}
        </p>
      </div>

      {provider === 'salesforce' && (
        <div className="flex items-center justify-center gap-4 p-4 bg-advist-bg rounded-xl">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              checked={!isSandbox}
              onChange={() => setIsSandbox(false)}
              className="w-4 h-4 text-advist-primary"
            />
            <span className="text-sm text-advist-gray900">Production</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              checked={isSandbox}
              onChange={() => setIsSandbox(true)}
              className="w-4 h-4 text-advist-primary"
            />
            <span className="text-sm text-advist-gray900">Sandbox</span>
          </label>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
          <div className="flex items-center gap-2 text-red-700">
            <AlertTriangle size={18} />
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <Button
          onClick={handleOAuthConnect}
          disabled={isConnecting}
          className="w-full"
        >
          {isConnecting ? (
            <Loader2 size={16} className="animate-spin mr-2" />
          ) : (
            <ExternalLink size={16} className="mr-2" />
          )}
          {t('integrations.setup.authorize', 'Autoriser')} {config.name}
        </Button>

        {config.authType === 'both' && (
          <>
            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-advist-gray200" />
              <span className="text-sm text-advist-gray900/60">ou</span>
              <div className="flex-1 h-px bg-advist-gray200" />
            </div>
            <Button
              variant="outline"
              onClick={() => setStep('credentials')}
              className="w-full"
            >
              <Key size={16} className="mr-2" />
              {t('integrations.setup.useCredentials', 'Utiliser des identifiants')}
            </Button>
          </>
        )}
      </div>

      <div className="flex justify-start pt-4 border-t border-advist-gray200">
        <Button variant="ghost" onClick={() => setStep('name')}>
          {t('common.back', 'Retour')}
        </Button>
      </div>
    </div>
  );

  const renderCredentialsStep = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3 p-4 bg-advist-bg rounded-xl">
        <Server size={24} className="text-advist-gray900/60" />
        <div>
          <h3 className="font-medium text-advist-gray900">
            {t('integrations.setup.serverCredentials', 'Identifiants serveur')}
          </h3>
          <p className="text-sm text-advist-gray900/60">
            {t('integrations.setup.enterCredentials', 'Entrez les informations de connexion')}
          </p>
        </div>
      </div>

      {config.fields?.map((field) => (
        <div key={field.key}>
          <label className="block text-sm font-medium text-advist-gray900 mb-2">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <div className="relative">
            <Input
              type={field.type === 'password' && !showPasswords[field.key] ? 'password' : 'text'}
              value={credentials[field.key] || ''}
              onChange={(e) => setCredentials({ ...credentials, [field.key]: e.target.value })}
              placeholder={field.placeholder}
              className={field.type === 'password' ? 'pr-10' : ''}
            />
            {field.type === 'password' && (
              <button
                type="button"
                onClick={() => togglePasswordVisibility(field.key)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-advist-gray900/40 hover:text-advist-gray900"
              >
                {showPasswords[field.key] ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            )}
          </div>
        </div>
      ))}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
          <div className="flex items-center gap-2 text-red-700">
            <AlertTriangle size={18} />
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      <div className="flex justify-between pt-4 border-t border-advist-gray200">
        <Button
          variant="ghost"
          onClick={() => config.authType === 'both' ? setStep('auth') : setStep('name')}
        >
          {t('common.back', 'Retour')}
        </Button>
        <Button
          onClick={handleCredentialsConnect}
          disabled={isConnecting || !config.fields?.filter(f => f.required).every(f => credentials[f.key])}
        >
          {isConnecting ? (
            <Loader2 size={16} className="animate-spin mr-2" />
          ) : (
            <Check size={16} className="mr-2" />
          )}
          {t('integrations.setup.connect', 'Connecter')}
        </Button>
      </div>
    </div>
  );

  const renderSuccessStep = () => (
    <div className="space-y-6">
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
          <Check size={32} className="text-green-600" />
        </div>
        <h3 className="text-lg font-semibold text-advist-gray900 mb-2">
          {t('integrations.setup.success', 'Connexion reussie!')}
        </h3>
        <p className="text-sm text-advist-gray900/60 max-w-sm mx-auto">
          {t('integrations.setup.successDescription', 'Votre connexion a ete configuree avec succes. Vous pouvez maintenant configurer les mappings de synchronisation.')}
        </p>
      </div>

      <div className="flex justify-center">
        <Button onClick={handleClose}>
          {t('common.done', 'Terminer')}
        </Button>
      </div>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('integrations.setup.title', 'Configurer l\'integration')}
      size="md"
    >
      {step === 'name' && renderNameStep()}
      {step === 'auth' && renderAuthStep()}
      {step === 'credentials' && renderCredentialsStep()}
      {step === 'success' && renderSuccessStep()}
    </Modal>
  );
};

export default ConnectionSetupModal;
