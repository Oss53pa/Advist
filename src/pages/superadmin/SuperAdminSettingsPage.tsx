import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Settings,
  Mail,
  _MessageSquare,
  Bell,
  Shield,
  _Globe,
  Database,
  Server,
  Key,
  _Lock,
  Webhook,
  _Cloud,
  _Palette,
  _Languages,
  _Clock,
  Save,
  RefreshCw,
  _CheckCircle,
  _AlertTriangle,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  Edit,
  Copy,
  _ExternalLink,
  ToggleLeft,
  ToggleRight,
  HardDrive,
  Zap,
  _Users,
  _Building2,
  FileText,
} from 'lucide-react';
import { Card, Button, Badge, Modal } from '../../components/ui';

// Types
interface ApiKey {
  id: string;
  name: string;
  key: string;
  permissions: string[];
  createdAt: Date;
  lastUsed?: Date;
  expiresAt?: Date;
  status: 'active' | 'expired' | 'revoked';
}

interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  events: string[];
  enabled: boolean;
  lastTriggered?: Date;
  failureCount: number;
}

// Mock data
const apiKeys: ApiKey[] = [
  {
    id: 'key-1',
    name: 'Production API',
    key: 'adv_live_xxxxxxxxxxxxxxxxxxxxxxxx',
    permissions: ['read', 'write', 'admin'],
    createdAt: new Date('2024-01-15'),
    lastUsed: new Date(Date.now() - 1000 * 60 * 5),
    status: 'active',
  },
  {
    id: 'key-2',
    name: 'Integration Test',
    key: 'adv_test_xxxxxxxxxxxxxxxxxxxxxxxx',
    permissions: ['read', 'write'],
    createdAt: new Date('2024-03-20'),
    lastUsed: new Date(Date.now() - 1000 * 60 * 60 * 24),
    status: 'active',
  },
  {
    id: 'key-3',
    name: 'Legacy API (deprecated)',
    key: 'sk_old_xxxxxxxxxxxxxxxxxxxxxxxx',
    permissions: ['read'],
    createdAt: new Date('2023-06-01'),
    expiresAt: new Date('2024-12-31'),
    status: 'expired',
  },
];

const webhooks: WebhookConfig[] = [
  {
    id: 'wh-1',
    name: 'Slack Notifications',
    url: 'https://hooks.slack.com/services/xxx',
    events: ['document.created', 'workflow.completed', 'signature.completed'],
    enabled: true,
    lastTriggered: new Date(Date.now() - 1000 * 60 * 30),
    failureCount: 0,
  },
  {
    id: 'wh-2',
    name: 'CRM Integration',
    url: 'https://api.crm.example.com/webhooks/advist',
    events: ['tenant.created', 'subscription.updated'],
    enabled: true,
    lastTriggered: new Date(Date.now() - 1000 * 60 * 60 * 2),
    failureCount: 2,
  },
  {
    id: 'wh-3',
    name: 'Analytics Service',
    url: 'https://analytics.internal/ingest',
    events: ['*'],
    enabled: false,
    failureCount: 0,
  },
];

const settingsSections = [
  { id: 'general', label: 'Général', icon: Settings },
  { id: 'email', label: 'Email', icon: Mail },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Sécurité', icon: Shield },
  { id: 'api', label: 'API & Webhooks', icon: Webhook },
  { id: 'storage', label: 'Stockage', icon: HardDrive },
  { id: 'maintenance', label: 'Maintenance', icon: Server },
];

export const SuperAdminSettingsPage: React.FC = () => {
  const { _t } = useTranslation();
  const [activeSection, setActiveSection] = useState('general');
  const [isSaving, setIsSaving] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [showWebhookModal, setShowWebhookModal] = useState(false);
  const [showKeyValue, setShowKeyValue] = useState<string | null>(null);

  // General settings state
  const [generalSettings, setGeneralSettings] = useState({
    platformName: 'ADVIST',
    supportEmail: 'support@advist.com',
    defaultLanguage: 'fr',
    defaultTimezone: 'Africa/Abidjan',
    maintenanceMode: false,
    registrationEnabled: true,
    maxOrganizations: 1000,
    maxUsersPerOrg: 500,
  });

  // Email settings state
  const [emailSettings, setEmailSettings] = useState({
    provider: 'smtp',
    smtpHost: 'smtp.sendgrid.net',
    smtpPort: 587,
    smtpUser: 'apikey',
    smtpPassword: '••••••••••••',
    fromEmail: 'noreply@advist.com',
    fromName: 'ADVIST Platform',
    replyTo: 'support@advist.com',
  });

  // Security settings state
  const [securitySettings, setSecuritySettings] = useState({
    mfaRequired: true,
    sessionTimeout: 30,
    passwordMinLength: 12,
    passwordRequireSpecial: true,
    maxLoginAttempts: 5,
    ipWhitelist: false,
    auditLogRetention: 365,
  });

  // Storage settings state
  const [storageSettings, setStorageSettings] = useState({
    provider: 's3',
    bucket: 'advist-production',
    region: 'eu-west-1',
    maxFileSize: 50,
    allowedTypes: 'pdf,doc,docx,xls,xlsx,ppt,pptx,jpg,png',
    encryptionEnabled: true,
  });

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSaving(false);
  };

  const formatTimeAgo = (date?: Date) => {
    if (!date) return 'Jamais';
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return "À l'instant";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `Il y a ${minutes}min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Il y a ${hours}h`;
    return date.toLocaleDateString('fr-FR');
  };

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-primary-900 mb-4">Paramètres généraux</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-primary-700 mb-1">
              Nom de la plateforme
            </label>
            <input
              type="text"
              value={generalSettings.platformName}
              onChange={(e) =>
                setGeneralSettings({ ...generalSettings, platformName: e.target.value })
              }
              className="w-full px-3 py-2 border border-primary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary-700 mb-1">Email support</label>
            <input
              type="email"
              value={generalSettings.supportEmail}
              onChange={(e) =>
                setGeneralSettings({ ...generalSettings, supportEmail: e.target.value })
              }
              className="w-full px-3 py-2 border border-primary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary-700 mb-1">
              Langue par défaut
            </label>
            <select
              value={generalSettings.defaultLanguage}
              onChange={(e) =>
                setGeneralSettings({ ...generalSettings, defaultLanguage: e.target.value })
              }
              className="w-full px-3 py-2 border border-primary-200 rounded-xl focus:outline-none"
            >
              <option value="fr">Français</option>
              <option value="en">English</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-primary-700 mb-1">
              Fuseau horaire
            </label>
            <select
              value={generalSettings.defaultTimezone}
              onChange={(e) =>
                setGeneralSettings({ ...generalSettings, defaultTimezone: e.target.value })
              }
              className="w-full px-3 py-2 border border-primary-200 rounded-xl focus:outline-none"
            >
              <option value="Africa/Abidjan">Africa/Abidjan (GMT+0)</option>
              <option value="Africa/Lagos">Africa/Lagos (GMT+1)</option>
              <option value="Africa/Dakar">Africa/Dakar (GMT+0)</option>
              <option value="Europe/Paris">Europe/Paris (GMT+1)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold text-primary-900 mb-4">Limites plateforme</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-primary-700 mb-1">
              Max organisations
            </label>
            <input
              type="number"
              value={generalSettings.maxOrganizations}
              onChange={(e) =>
                setGeneralSettings({
                  ...generalSettings,
                  maxOrganizations: parseInt(e.target.value),
                })
              }
              className="w-full px-3 py-2 border border-primary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary-700 mb-1">
              Max utilisateurs/org
            </label>
            <input
              type="number"
              value={generalSettings.maxUsersPerOrg}
              onChange={(e) =>
                setGeneralSettings({ ...generalSettings, maxUsersPerOrg: parseInt(e.target.value) })
              }
              className="w-full px-3 py-2 border border-primary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-900"
            />
          </div>
        </div>
      </div>

      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold text-primary-900 mb-4">Contrôles</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-primary-50 rounded-xl">
            <div>
              <p className="font-medium text-primary-900">Inscriptions ouvertes</p>
              <p className="text-sm text-primary-500">
                Permet aux nouvelles organisations de s'inscrire
              </p>
            </div>
            <button
              onClick={() =>
                setGeneralSettings({
                  ...generalSettings,
                  registrationEnabled: !generalSettings.registrationEnabled,
                })
              }
              className={`p-1 rounded-full transition-colors ${generalSettings.registrationEnabled ? 'bg-primary-900' : 'bg-primary-300'}`}
            >
              {generalSettings.registrationEnabled ? (
                <ToggleRight size={28} className="text-white" />
              ) : (
                <ToggleLeft size={28} className="text-white" />
              )}
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-red-50 rounded-xl border border-red-200">
            <div>
              <p className="font-medium text-red-900">Mode maintenance</p>
              <p className="text-sm text-red-600">
                Désactive l'accès pour tous les utilisateurs (sauf Super Admin)
              </p>
            </div>
            <button
              onClick={() =>
                setGeneralSettings({
                  ...generalSettings,
                  maintenanceMode: !generalSettings.maintenanceMode,
                })
              }
              className={`p-1 rounded-full transition-colors ${generalSettings.maintenanceMode ? 'bg-red-500' : 'bg-primary-300'}`}
            >
              {generalSettings.maintenanceMode ? (
                <ToggleRight size={28} className="text-white" />
              ) : (
                <ToggleLeft size={28} className="text-white" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderEmailSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-primary-900 mb-4">Configuration SMTP</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-primary-700 mb-1">Provider</label>
            <select
              value={emailSettings.provider}
              onChange={(e) => setEmailSettings({ ...emailSettings, provider: e.target.value })}
              className="w-full px-3 py-2 border border-primary-200 rounded-xl focus:outline-none"
            >
              <option value="smtp">SMTP personnalisé</option>
              <option value="sendgrid">SendGrid</option>
              <option value="mailgun">Mailgun</option>
              <option value="ses">Amazon SES</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-primary-700 mb-1">Hôte SMTP</label>
            <input
              type="text"
              value={emailSettings.smtpHost}
              onChange={(e) => setEmailSettings({ ...emailSettings, smtpHost: e.target.value })}
              className="w-full px-3 py-2 border border-primary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary-700 mb-1">Port</label>
            <input
              type="number"
              value={emailSettings.smtpPort}
              onChange={(e) =>
                setEmailSettings({ ...emailSettings, smtpPort: parseInt(e.target.value) })
              }
              className="w-full px-3 py-2 border border-primary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary-700 mb-1">Utilisateur</label>
            <input
              type="text"
              value={emailSettings.smtpUser}
              onChange={(e) => setEmailSettings({ ...emailSettings, smtpUser: e.target.value })}
              className="w-full px-3 py-2 border border-primary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-900"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-primary-700 mb-1">Mot de passe</label>
            <input
              type="password"
              value={emailSettings.smtpPassword}
              onChange={(e) => setEmailSettings({ ...emailSettings, smtpPassword: e.target.value })}
              className="w-full px-3 py-2 border border-primary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-900"
            />
          </div>
        </div>
      </div>

      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold text-primary-900 mb-4">Expéditeur</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-primary-700 mb-1">
              Email expéditeur
            </label>
            <input
              type="email"
              value={emailSettings.fromEmail}
              onChange={(e) => setEmailSettings({ ...emailSettings, fromEmail: e.target.value })}
              className="w-full px-3 py-2 border border-primary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary-700 mb-1">
              Nom expéditeur
            </label>
            <input
              type="text"
              value={emailSettings.fromName}
              onChange={(e) => setEmailSettings({ ...emailSettings, fromName: e.target.value })}
              className="w-full px-3 py-2 border border-primary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-900"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-primary-700 mb-1">Reply-To</label>
            <input
              type="email"
              value={emailSettings.replyTo}
              onChange={(e) => setEmailSettings({ ...emailSettings, replyTo: e.target.value })}
              className="w-full px-3 py-2 border border-primary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-900"
            />
          </div>
        </div>
      </div>

      <div className="border-t pt-6">
        <Button variant="outline">
          <Mail size={16} className="mr-2" />
          Envoyer un email de test
        </Button>
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-primary-900 mb-4">Authentification</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-primary-50 rounded-xl">
            <div>
              <p className="font-medium text-primary-900">2FA obligatoire</p>
              <p className="text-sm text-primary-500">
                Exiger l'authentification à deux facteurs pour tous les admins
              </p>
            </div>
            <button
              onClick={() =>
                setSecuritySettings({
                  ...securitySettings,
                  mfaRequired: !securitySettings.mfaRequired,
                })
              }
              className={`p-1 rounded-full transition-colors ${securitySettings.mfaRequired ? 'bg-primary-900' : 'bg-primary-300'}`}
            >
              {securitySettings.mfaRequired ? (
                <ToggleRight size={28} className="text-white" />
              ) : (
                <ToggleLeft size={28} className="text-white" />
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold text-primary-900 mb-4">Politique de mot de passe</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-primary-700 mb-1">
              Longueur minimum
            </label>
            <input
              type="number"
              value={securitySettings.passwordMinLength}
              onChange={(e) =>
                setSecuritySettings({
                  ...securitySettings,
                  passwordMinLength: parseInt(e.target.value),
                })
              }
              className="w-full px-3 py-2 border border-primary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary-700 mb-1">
              Tentatives max avant blocage
            </label>
            <input
              type="number"
              value={securitySettings.maxLoginAttempts}
              onChange={(e) =>
                setSecuritySettings({
                  ...securitySettings,
                  maxLoginAttempts: parseInt(e.target.value),
                })
              }
              className="w-full px-3 py-2 border border-primary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary-700 mb-1">
              Timeout session (minutes)
            </label>
            <input
              type="number"
              value={securitySettings.sessionTimeout}
              onChange={(e) =>
                setSecuritySettings({
                  ...securitySettings,
                  sessionTimeout: parseInt(e.target.value),
                })
              }
              className="w-full px-3 py-2 border border-primary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary-700 mb-1">
              Rétention logs audit (jours)
            </label>
            <input
              type="number"
              value={securitySettings.auditLogRetention}
              onChange={(e) =>
                setSecuritySettings({
                  ...securitySettings,
                  auditLogRetention: parseInt(e.target.value),
                })
              }
              className="w-full px-3 py-2 border border-primary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-900"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderApiSettings = () => (
    <div className="space-y-6">
      {/* API Keys */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-primary-900">Clés API</h3>
          <Button size="sm" onClick={() => setShowApiKeyModal(true)}>
            <Plus size={14} className="mr-2" />
            Nouvelle clé
          </Button>
        </div>

        <div className="space-y-3">
          {apiKeys.map((key) => (
            <div key={key.id} className="p-4 bg-primary-50 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Key size={16} className="text-primary-500" />
                  <span className="font-medium text-primary-900">{key.name}</span>
                  <Badge variant={key.status === 'active' ? 'success' : 'danger'}>
                    {key.status === 'active' ? 'Actif' : 'Expiré'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowKeyValue(showKeyValue === key.id ? null : key.id)}
                  >
                    {showKeyValue === key.id ? <EyeOff size={14} /> : <Eye size={14} />}
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Copy size={14} />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-red-500">
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
              <div className="font-mono text-sm text-primary-600 bg-white px-3 py-2 rounded-lg">
                {showKeyValue === key.id ? key.key : '••••••••••••••••••••••••••••'}
              </div>
              <div className="flex items-center gap-4 mt-2 text-xs text-primary-500">
                <span>Créée: {key.createdAt.toLocaleDateString('fr-FR')}</span>
                <span>Dernière utilisation: {formatTimeAgo(key.lastUsed)}</span>
                <span>Permissions: {key.permissions.join(', ')}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Webhooks */}
      <div className="border-t pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-primary-900">Webhooks</h3>
          <Button size="sm" onClick={() => setShowWebhookModal(true)}>
            <Plus size={14} className="mr-2" />
            Nouveau webhook
          </Button>
        </div>

        <div className="space-y-3">
          {webhooks.map((webhook) => (
            <div key={webhook.id} className="p-4 bg-primary-50 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Webhook size={16} className="text-primary-500" />
                  <span className="font-medium text-primary-900">{webhook.name}</span>
                  {webhook.enabled ? (
                    <Badge variant="success">Actif</Badge>
                  ) : (
                    <Badge variant="default">Désactivé</Badge>
                  )}
                  {webhook.failureCount > 0 && (
                    <Badge variant="warning">{webhook.failureCount} échecs</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm">
                    <Edit size={14} />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-red-500">
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
              <div className="font-mono text-sm text-primary-600 bg-white px-3 py-2 rounded-lg truncate">
                {webhook.url}
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {webhook.events.map((event) => (
                  <span
                    key={event}
                    className="px-2 py-0.5 bg-primary-200 text-primary-700 rounded text-xs"
                  >
                    {event}
                  </span>
                ))}
              </div>
              <div className="text-xs text-primary-500 mt-2">
                Dernier déclenchement: {formatTimeAgo(webhook.lastTriggered)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStorageSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-primary-900 mb-4">Configuration stockage</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-primary-700 mb-1">Provider</label>
            <select
              value={storageSettings.provider}
              onChange={(e) => setStorageSettings({ ...storageSettings, provider: e.target.value })}
              className="w-full px-3 py-2 border border-primary-200 rounded-xl focus:outline-none"
            >
              <option value="s3">Amazon S3</option>
              <option value="gcs">Google Cloud Storage</option>
              <option value="azure">Azure Blob Storage</option>
              <option value="local">Local (dev only)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-primary-700 mb-1">Bucket</label>
            <input
              type="text"
              value={storageSettings.bucket}
              onChange={(e) => setStorageSettings({ ...storageSettings, bucket: e.target.value })}
              className="w-full px-3 py-2 border border-primary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary-700 mb-1">Région</label>
            <input
              type="text"
              value={storageSettings.region}
              onChange={(e) => setStorageSettings({ ...storageSettings, region: e.target.value })}
              className="w-full px-3 py-2 border border-primary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary-700 mb-1">
              Taille max fichier (MB)
            </label>
            <input
              type="number"
              value={storageSettings.maxFileSize}
              onChange={(e) =>
                setStorageSettings({ ...storageSettings, maxFileSize: parseInt(e.target.value) })
              }
              className="w-full px-3 py-2 border border-primary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-900"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-primary-700 mb-1">
              Types autorisés
            </label>
            <input
              type="text"
              value={storageSettings.allowedTypes}
              onChange={(e) =>
                setStorageSettings({ ...storageSettings, allowedTypes: e.target.value })
              }
              className="w-full px-3 py-2 border border-primary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-900"
              placeholder="pdf,doc,docx,xls,xlsx"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between p-4 bg-primary-50 rounded-xl">
        <div>
          <p className="font-medium text-primary-900">Chiffrement au repos</p>
          <p className="text-sm text-primary-500">Chiffrer tous les fichiers stockés (AES-256)</p>
        </div>
        <button
          onClick={() =>
            setStorageSettings({
              ...storageSettings,
              encryptionEnabled: !storageSettings.encryptionEnabled,
            })
          }
          className={`p-1 rounded-full transition-colors ${storageSettings.encryptionEnabled ? 'bg-primary-900' : 'bg-primary-300'}`}
        >
          {storageSettings.encryptionEnabled ? (
            <ToggleRight size={28} className="text-white" />
          ) : (
            <ToggleLeft size={28} className="text-white" />
          )}
        </button>
      </div>
    </div>
  );

  const renderMaintenanceSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-primary-900 mb-4">Actions de maintenance</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { icon: Database, label: 'Backup base de données', desc: 'Créer un backup complet' },
            { icon: Zap, label: 'Vider le cache', desc: 'Purger Redis cache' },
            { icon: RefreshCw, label: 'Redémarrer workers', desc: 'Restart queue workers' },
            { icon: FileText, label: 'Réindexer recherche', desc: 'Rebuild search index' },
            {
              icon: Trash2,
              label: 'Nettoyer fichiers temp',
              desc: 'Supprimer fichiers temporaires',
            },
            { icon: Shield, label: 'Scan sécurité', desc: 'Lancer audit de sécurité' },
          ].map((action, i) => (
            <button
              key={i}
              className="flex items-start gap-3 p-4 bg-primary-50 rounded-xl hover:bg-primary-100 transition-colors text-left"
            >
              <action.icon size={20} className="text-primary-600 mt-0.5" />
              <div>
                <p className="font-medium text-primary-900">{action.label}</p>
                <p className="text-xs text-primary-500">{action.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold text-primary-900 mb-4">Statistiques système</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Organisations', value: '47' },
            { label: 'Utilisateurs', value: '1,234' },
            { label: 'Documents', value: '156,789' },
            { label: 'Stockage utilisé', value: '1.2 TB' },
          ].map((stat, i) => (
            <div key={i} className="p-4 bg-primary-50 rounded-xl text-center">
              <p className="text-2xl font-bold text-primary-900">{stat.value}</p>
              <p className="text-xs text-primary-500">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'general':
        return renderGeneralSettings();
      case 'email':
        return renderEmailSettings();
      case 'security':
        return renderSecuritySettings();
      case 'api':
        return renderApiSettings();
      case 'storage':
        return renderStorageSettings();
      case 'maintenance':
        return renderMaintenanceSettings();
      default:
        return renderGeneralSettings();
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary-900">Configuration</h1>
          <p className="text-primary-600 mt-1">Paramètres globaux de la plateforme ADVIST</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleSave} disabled={isSaving}>
            <RefreshCw size={16} className={`mr-2 ${isSaving ? 'animate-spin' : ''}`} />
            Réinitialiser
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            <Save size={16} className="mr-2" />
            {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <Card className="p-4 h-fit">
          <nav className="space-y-1">
            {settingsSections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-left ${
                  activeSection === section.id
                    ? 'bg-primary-900 text-white'
                    : 'text-primary-600 hover:bg-primary-100'
                }`}
              >
                <section.icon size={18} />
                <span className="font-medium">{section.label}</span>
              </button>
            ))}
          </nav>
        </Card>

        {/* Content */}
        <Card className="p-6 lg:col-span-3">{renderSectionContent()}</Card>
      </div>

      {/* API Key Modal */}
      <Modal
        isOpen={showApiKeyModal}
        onClose={() => setShowApiKeyModal(false)}
        title="Nouvelle clé API"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-primary-700 mb-1">Nom</label>
            <input
              type="text"
              placeholder="Ex: Production API"
              className="w-full px-3 py-2 border border-primary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary-700 mb-1">Permissions</label>
            <div className="space-y-2">
              {['read', 'write', 'admin'].map((perm) => (
                <label key={perm} className="flex items-center gap-2">
                  <input type="checkbox" className="rounded" />
                  <span className="capitalize">{perm}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-primary-700 mb-1">Expiration</label>
            <select className="w-full px-3 py-2 border border-primary-200 rounded-xl focus:outline-none">
              <option>Jamais</option>
              <option>30 jours</option>
              <option>90 jours</option>
              <option>1 an</option>
            </select>
          </div>
          <div className="flex gap-3 pt-4">
            <Button variant="outline" className="flex-1" onClick={() => setShowApiKeyModal(false)}>
              Annuler
            </Button>
            <Button className="flex-1">
              <Key size={16} className="mr-2" />
              Créer la clé
            </Button>
          </div>
        </div>
      </Modal>

      {/* Webhook Modal */}
      <Modal
        isOpen={showWebhookModal}
        onClose={() => setShowWebhookModal(false)}
        title="Nouveau webhook"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-primary-700 mb-1">Nom</label>
            <input
              type="text"
              placeholder="Ex: Slack Notifications"
              className="w-full px-3 py-2 border border-primary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary-700 mb-1">URL</label>
            <input
              type="url"
              placeholder="https://..."
              className="w-full px-3 py-2 border border-primary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary-700 mb-1">Événements</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                'document.created',
                'workflow.completed',
                'signature.completed',
                'tenant.created',
              ].map((event) => (
                <label key={event} className="flex items-center gap-2">
                  <input type="checkbox" className="rounded" />
                  <span className="text-sm">{event}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <Button variant="outline" className="flex-1" onClick={() => setShowWebhookModal(false)}>
              Annuler
            </Button>
            <Button className="flex-1">
              <Webhook size={16} className="mr-2" />
              Créer le webhook
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SuperAdminSettingsPage;
