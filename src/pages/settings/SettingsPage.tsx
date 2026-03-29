import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Settings,
  Bell,
  Lock,
  Globe,
  Palette,
  Moon,
  Sun,
  Monitor,
  Save,
  Mail,
  MessageSquare,
  FileText,
  GitBranch,
  Building,
  Users,
  HardDrive,
  Database,
  Download,
  Upload,
  Trash2,
  AlertTriangle,
  Check,
  Clock,
  Shield,
  CreditCard,
  BarChart3,
  Package,
  Activity,
  Zap,
  RefreshCw,
  FileArchive,
  CloudOff,
  UserPlus,
  UserMinus,
  Key,
  Eye,
  EyeOff,
  Wifi,
  WifiOff,
  ExternalLink,
  Paintbrush,
  Brain,
  Plug,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { useAuthStore } from '../../store';
import { OfflineManager } from '../../components/offline';
import { ThemeCustomizer } from '../../components/theme';
import { NotificationPreferences } from '../../components/notifications';
import { AISettings } from '../../components/settings/AISettings';
import { IntegrationSettings } from '../../components/integrations';

interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: {
    email: boolean;
    push: boolean;
    documents: boolean;
    workflows: boolean;
    signatures: boolean;
    weekly_digest: boolean;
  };
  privacy: {
    show_online_status: boolean;
    show_last_seen: boolean;
    allow_analytics: boolean;
  };
}

// v2: Organization quotas
interface OrganizationQuotas {
  max_users: number;
  current_users: number;
  max_storage_gb: number;
  current_storage_gb: number;
  max_documents: number;
  current_documents: number;
  max_active_workflows: number;
  current_active_workflows: number;
}

// v2: Data export request
interface DataExportRequest {
  id: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  export_format: 'zip' | 'json' | 'xml';
  include_documents: boolean;
  include_versions: boolean;
  include_metadata: boolean;
  include_audit_logs: boolean;
  include_signatures: boolean;
  download_url?: string;
  expires_at?: string;
  created_at: string;
  completed_at?: string;
  file_size?: number;
}

export const SettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<
    | 'general'
    | 'appearance'
    | 'notifications'
    | 'security'
    | 'privacy'
    | 'offline'
    | 'organization'
    | 'export'
    | 'accounts'
    | 'mail'
    | 'ai'
    | 'integrations'
  >('general');
  const [settings, setSettings] = useState<AppSettings>({
    theme: 'light',
    language: 'fr',
    notifications: {
      email: true,
      push: true,
      documents: true,
      workflows: true,
      signatures: true,
      weekly_digest: false,
    },
    privacy: {
      show_online_status: true,
      show_last_seen: true,
      allow_analytics: true,
    },
  });
  const [isSaving, setIsSaving] = useState(false);

  const isOrgAdmin = user?.is_org_admin ?? false;

  const tabs = [
    {
      id: 'general' as const,
      label: t('settings.general', 'Général'),
      icon: Settings,
      adminOnly: false,
    },
    {
      id: 'appearance' as const,
      label: t('settings.appearance', 'Apparence'),
      icon: Paintbrush,
      adminOnly: false,
    },
    {
      id: 'notifications' as const,
      label: t('settings.notifications', 'Notifications'),
      icon: Bell,
      adminOnly: false,
    },
    {
      id: 'security' as const,
      label: t('settings.security', 'Sécurité'),
      icon: Shield,
      adminOnly: false,
    },
    {
      id: 'privacy' as const,
      label: t('settings.privacy', 'Confidentialité'),
      icon: Lock,
      adminOnly: false,
    },
    {
      id: 'offline' as const,
      label: t('settings.offline', 'Mode hors-ligne'),
      icon: WifiOff,
      adminOnly: false,
    },
    {
      id: 'organization' as const,
      label: t('settings.organization', 'Organisation'),
      icon: Building,
      adminOnly: true,
    },
    {
      id: 'accounts' as const,
      label: t('settings.accounts', 'Comptes'),
      icon: Users,
      adminOnly: true,
    },
    {
      id: 'mail' as const,
      label: t('settings.mail', 'Paramétrage mail'),
      icon: Mail,
      adminOnly: true,
    },
    {
      id: 'ai' as const,
      label: t('settings.ai', 'Intelligence Artificielle'),
      icon: Brain,
      adminOnly: true,
    },
    {
      id: 'integrations' as const,
      label: t('settings.integrations', 'Intégrations'),
      icon: Plug,
      adminOnly: true,
    },
    {
      id: 'export' as const,
      label: t('settings.dataExport', 'Export données'),
      icon: Download,
      adminOnly: true,
    },
  ];

  const visibleTabs = tabs.filter((tab) => !tab.adminOnly || isOrgAdmin);

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-advist-gray900">
          {t('settings.title', 'Paramètres')}
        </h1>
        <p className="text-advist-gray900 mt-1">
          {t('settings.subtitle', 'Personnalisez votre expérience ADVIST')}
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-64 flex-shrink-0">
          <Card className="p-2">
            <nav className="space-y-1">
              {visibleTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-3 w-full px-3 py-2 rounded-xl text-left transition-all duration-240
                    ${
                      activeTab === tab.id
                        ? 'bg-advist-dark text-white'
                        : 'text-advist-gray900 hover:bg-advist-bg'
                    }
                  `}
                >
                  <tab.icon size={18} />
                  {tab.label}
                  {tab.adminOnly && (
                    <Badge variant="secondary" size="sm" className="ml-auto">
                      Admin
                    </Badge>
                  )}
                </button>
              ))}
            </nav>
          </Card>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-6">
          {activeTab === 'general' && (
            <GeneralSettings settings={settings} setSettings={setSettings} />
          )}
          {activeTab === 'appearance' && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-advist-gray900 mb-2">
                {t('settings.appearance', 'Apparence')}
              </h2>
              <p className="text-advist-gray900/60 mb-6">
                {t(
                  'settings.appearanceDesc',
                  'Personnalisez les couleurs, polices et la mise en page de votre interface'
                )}
              </p>
              <ThemeCustomizer />
            </Card>
          )}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <NotificationSettings settings={settings} setSettings={setSettings} />
              <NotificationPreferences />
            </div>
          )}
          {/* v2: Security settings */}
          {activeTab === 'security' && <SecuritySettings />}
          {activeTab === 'privacy' && (
            <PrivacySettings settings={settings} setSettings={setSettings} />
          )}
          {/* v2: Offline settings */}
          {activeTab === 'offline' && <OfflineSettings />}
          {/* v2: Admin sections */}
          {activeTab === 'organization' && isOrgAdmin && <OrganizationSettings />}
          {activeTab === 'accounts' && isOrgAdmin && <AccountsManagement />}
          {activeTab === 'mail' && isOrgAdmin && <MailSettings />}
          {activeTab === 'ai' && isOrgAdmin && <AISettings />}
          {activeTab === 'integrations' && isOrgAdmin && <IntegrationSettings />}
          {activeTab === 'export' && isOrgAdmin && <DataExportSettings />}

          {/* Save Button - only for settings tabs */}
          {['general', 'notifications', 'privacy'].includes(activeTab) && (
            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={isSaving}>
                <Save size={16} className="mr-2" />
                {isSaving
                  ? t('settings.saving', 'Enregistrement...')
                  : t('settings.save', 'Enregistrer les modifications')}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// General Settings (same as before with translations)
const GeneralSettings: React.FC<{
  settings: AppSettings;
  setSettings: (settings: AppSettings) => void;
}> = ({ settings, setSettings }) => {
  const { t } = useTranslation();

  const themes = [
    { id: 'light' as const, label: t('settings.themes.light', 'Clair'), icon: Sun },
    { id: 'dark' as const, label: t('settings.themes.dark', 'Sombre'), icon: Moon },
    { id: 'system' as const, label: t('settings.themes.system', 'Système'), icon: Monitor },
  ];

  return (
    <>
      {/* Theme */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Palette size={20} className="text-advist-gray900" />
          <h2 className="text-lg font-semibold text-advist-gray900">
            {t('settings.appearance', 'Apparence')}
          </h2>
        </div>
        <p className="text-sm text-advist-gray900 mb-4">
          {t('settings.chooseTheme', "Choisissez le thème de l'application")}
        </p>
        <div className="grid grid-cols-3 gap-4">
          {themes.map((theme) => (
            <button
              key={theme.id}
              onClick={() => setSettings({ ...settings, theme: theme.id })}
              className={`
                flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-240
                ${
                  settings.theme === theme.id
                    ? 'border-advist-dark bg-advist-bg'
                    : 'border-advist-bg hover:border-advist-blue-light'
                }
              `}
            >
              <theme.icon
                size={24}
                className={
                  settings.theme === theme.id ? 'text-advist-gray900' : 'text-advist-gray900'
                }
              />
              <span
                className={`text-sm font-medium ${
                  settings.theme === theme.id ? 'text-advist-gray900' : 'text-advist-gray900'
                }`}
              >
                {theme.label}
              </span>
            </button>
          ))}
        </div>
      </Card>
    </>
  );
};

// Notification Settings
const NotificationSettings: React.FC<{
  settings: AppSettings;
  setSettings: (settings: AppSettings) => void;
}> = ({ settings, setSettings }) => {
  const { t } = useTranslation();

  const updateNotification = (key: keyof typeof settings.notifications, value: boolean) => {
    setSettings({
      ...settings,
      notifications: { ...settings.notifications, [key]: value },
    });
  };

  const notificationOptions = [
    {
      key: 'email' as const,
      label: t('settings.notif.email', 'Notifications par email'),
      description: t(
        'settings.notif.emailDesc',
        'Recevoir des notifications importantes par email'
      ),
      icon: Mail,
    },
    {
      key: 'push' as const,
      label: t('settings.notif.push', 'Notifications push'),
      description: t('settings.notif.pushDesc', 'Recevoir des notifications dans le navigateur'),
      icon: Bell,
    },
    {
      key: 'documents' as const,
      label: t('settings.notif.documents', 'Documents'),
      description: t(
        'settings.notif.documentsDesc',
        'Notifications pour les mises à jour de documents'
      ),
      icon: FileText,
    },
    {
      key: 'workflows' as const,
      label: t('settings.notif.workflows', 'Workflows'),
      description: t('settings.notif.workflowsDesc', 'Notifications pour les étapes de validation'),
      icon: GitBranch,
    },
    {
      key: 'signatures' as const,
      label: t('settings.notif.signatures', 'Signatures'),
      description: t(
        'settings.notif.signaturesDesc',
        'Notifications pour les demandes de signature'
      ),
      icon: MessageSquare,
    },
    {
      key: 'weekly_digest' as const,
      label: t('settings.notif.weekly', 'Résumé hebdomadaire'),
      description: t('settings.notif.weeklyDesc', "Recevoir un résumé d'activité chaque semaine"),
      icon: Mail,
    },
  ];

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <Bell size={20} className="text-advist-gray900" />
        <h2 className="text-lg font-semibold text-advist-gray900">
          {t('settings.notifPrefs', 'Préférences de notification')}
        </h2>
      </div>
      <div className="space-y-4">
        {notificationOptions.map((option) => (
          <div
            key={option.key}
            className="flex items-center justify-between p-4 bg-advist-bg/30 rounded-xl"
          >
            <div className="flex items-center gap-3">
              <option.icon size={20} className="text-advist-gray900" />
              <div>
                <p className="font-medium text-advist-gray900">{option.label}</p>
                <p className="text-sm text-advist-gray900">{option.description}</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notifications[option.key]}
                onChange={(e) => updateNotification(option.key, e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-advist-border peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-advist-gold rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-advist-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-advist-dark"></div>
            </label>
          </div>
        ))}
      </div>
    </Card>
  );
};

// Privacy Settings
const PrivacySettings: React.FC<{
  settings: AppSettings;
  setSettings: (settings: AppSettings) => void;
}> = ({ settings, setSettings }) => {
  const { t } = useTranslation();

  const updatePrivacy = (key: keyof typeof settings.privacy, value: boolean) => {
    setSettings({
      ...settings,
      privacy: { ...settings.privacy, [key]: value },
    });
  };

  const privacyOptions = [
    {
      key: 'show_online_status' as const,
      label: t('settings.privacy.online', 'Afficher le statut en ligne'),
      description: t(
        'settings.privacy.onlineDesc',
        'Les autres utilisateurs peuvent voir quand vous êtes connecté'
      ),
    },
    {
      key: 'show_last_seen' as const,
      label: t('settings.privacy.lastSeen', 'Afficher la dernière activité'),
      description: t(
        'settings.privacy.lastSeenDesc',
        'Les autres utilisateurs peuvent voir votre dernière connexion'
      ),
    },
    {
      key: 'allow_analytics' as const,
      label: t('settings.privacy.analytics', 'Analyses anonymes'),
      description: t(
        'settings.privacy.analyticsDesc',
        "Aider à améliorer ADVIST en partageant des données d'utilisation anonymes"
      ),
    },
  ];

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <Lock size={20} className="text-advist-gray900" />
        <h2 className="text-lg font-semibold text-advist-gray900">
          {t('settings.confidentiality', 'Confidentialité')}
        </h2>
      </div>
      <div className="space-y-4">
        {privacyOptions.map((option) => (
          <div
            key={option.key}
            className="flex items-center justify-between p-4 bg-advist-bg/30 rounded-xl"
          >
            <div>
              <p className="font-medium text-advist-gray900">{option.label}</p>
              <p className="text-sm text-advist-gray900">{option.description}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.privacy[option.key]}
                onChange={(e) => updatePrivacy(option.key, e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-advist-border peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-advist-gold rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-advist-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-advist-dark"></div>
            </label>
          </div>
        ))}
      </div>
    </Card>
  );
};

// v2: Organization Settings with Quotas
const OrganizationSettings: React.FC = () => {
  const { t } = useTranslation();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Mock quotas data
  const quotas: OrganizationQuotas = {
    max_users: 25,
    current_users: 18,
    max_storage_gb: 100,
    current_storage_gb: 67.5,
    max_documents: 5000,
    current_documents: 3247,
    max_active_workflows: 50,
    current_active_workflows: 12,
  };

  const subscriptionPlan = 'business';
  const planLabels = {
    starter: { label: 'Starter', color: 'bg-advist-surface-dark text-advist-gray900' },
    business: { label: 'Business', color: 'bg-advist-gold-light text-advist-gray900' },
    enterprise: { label: 'Enterprise', color: 'bg-advist-surface-dark text-advist-gray900' },
  };

  const getUsagePercentage = (current: number, max: number) => Math.round((current / max) * 100);
  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-advist-error';
    if (percentage >= 75) return 'bg-advist-gold';
    return 'bg-advist-success';
  };

  const quotaItems = [
    {
      label: t('settings.quotas.users', 'Utilisateurs'),
      current: quotas.current_users,
      max: quotas.max_users,
      unit: '',
      icon: Users,
    },
    {
      label: t('settings.quotas.storage', 'Stockage'),
      current: quotas.current_storage_gb,
      max: quotas.max_storage_gb,
      unit: 'GB',
      icon: HardDrive,
    },
    {
      label: t('settings.quotas.documents', 'Documents'),
      current: quotas.current_documents,
      max: quotas.max_documents,
      unit: '',
      icon: FileText,
    },
    {
      label: t('settings.quotas.workflows', 'Workflows actifs'),
      current: quotas.current_active_workflows,
      max: quotas.max_active_workflows,
      unit: '',
      icon: Activity,
    },
  ];

  return (
    <>
      {/* Subscription Plan */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <CreditCard size={20} className="text-advist-gray900" />
            <h2 className="text-lg font-semibold text-advist-gray900">
              {t('settings.subscription', 'Abonnement')}
            </h2>
          </div>
          <Badge className={planLabels[subscriptionPlan].color} size="lg">
            {planLabels[subscriptionPlan].label}
          </Badge>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-advist-bg/30 rounded-xl text-center">
            <Zap size={24} className="mx-auto text-advist-gold mb-2" />
            <p className="text-2xl font-bold text-advist-gray900">25</p>
            <p className="text-sm text-advist-gray900">
              {t('settings.plan.maxUsers', 'Utilisateurs max')}
            </p>
          </div>
          <div className="p-4 bg-advist-bg/30 rounded-xl text-center">
            <Database size={24} className="mx-auto text-advist-gray900 mb-2" />
            <p className="text-2xl font-bold text-advist-gray900">100 GB</p>
            <p className="text-sm text-advist-gray900">{t('settings.plan.storage', 'Stockage')}</p>
          </div>
          <div className="p-4 bg-advist-bg/30 rounded-xl text-center">
            <Shield size={24} className="mx-auto text-advist-success mb-2" />
            <p className="text-2xl font-bold text-advist-gray900">OHADA</p>
            <p className="text-sm text-advist-gray900">
              {t('settings.plan.compliance', 'Conformité')}
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setShowUpgradeModal(true)}>
            <Package size={16} className="mr-2" />
            {t('settings.upgradePlan', "Changer d'offre")}
          </Button>
          <Button variant="ghost">
            <BarChart3 size={16} className="mr-2" />
            {t('settings.viewUsage', "Voir l'utilisation détaillée")}
          </Button>
        </div>
      </Card>

      {/* Quotas & Limits */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <BarChart3 size={20} className="text-advist-gray900" />
          <h2 className="text-lg font-semibold text-advist-gray900">
            {t('settings.quotasLimits', 'Quotas et Limites')}
          </h2>
        </div>

        <div className="space-y-6">
          {quotaItems.map((item) => {
            const percentage = getUsagePercentage(item.current, item.max);
            const colorClass = getUsageColor(percentage);

            return (
              <div key={item.label} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <item.icon size={16} className="text-advist-gray900" />
                    <span className="font-medium text-advist-gray900">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-advist-gray900">
                      {item.current}
                      {item.unit} / {item.max}
                      {item.unit}
                    </span>
                    {percentage >= 90 && <AlertTriangle size={16} className="text-advist-error" />}
                  </div>
                </div>
                <div className="h-3 bg-advist-bg rounded-full overflow-hidden">
                  <div
                    className={`h-full ${colorClass} rounded-full transition-all`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                {percentage >= 90 && (
                  <p className="text-xs text-advist-error">
                    {t(
                      'settings.quotaWarning',
                      'Attention: Quota presque atteint. Envisagez une mise à niveau.'
                    )}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Regional Settings */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Globe size={20} className="text-advist-gray900" />
          <h2 className="text-lg font-semibold text-advist-gray900">
            {t('settings.regional', 'Paramètres Régionaux')}
          </h2>
        </div>
        <p className="text-sm text-advist-gray900 mb-6">
          {t(
            'settings.regionalDesc',
            'Configurez le pays, la devise et les formats pour votre organisation'
          )}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Country */}
          <div>
            <label className="block text-sm font-medium text-advist-gray900 mb-2">
              {t('settings.country', 'Pays')}
            </label>
            <select
              className="w-full px-3 py-2 border border-advist-bg rounded-xl focus:outline-none focus:ring-2 focus:ring-advist-gold"
              defaultValue="SN"
            >
              <optgroup label="Afrique de l'Ouest (UEMOA)">
                <option value="SN">Sénégal</option>
                <option value="CI">Côte d'Ivoire</option>
                <option value="ML">Mali</option>
                <option value="BF">Burkina Faso</option>
                <option value="NE">Niger</option>
                <option value="TG">Togo</option>
                <option value="BJ">Bénin</option>
                <option value="GW">Guinée-Bissau</option>
              </optgroup>
              <optgroup label="Afrique Centrale (CEMAC)">
                <option value="CM">Cameroun</option>
                <option value="GA">Gabon</option>
                <option value="CG">Congo</option>
                <option value="TD">Tchad</option>
                <option value="CF">Centrafrique</option>
                <option value="GQ">Guinée équatoriale</option>
              </optgroup>
              <optgroup label="Autres pays africains">
                <option value="MA">Maroc</option>
                <option value="DZ">Algérie</option>
                <option value="TN">Tunisie</option>
                <option value="GN">Guinée</option>
                <option value="MR">Mauritanie</option>
                <option value="CD">RD Congo</option>
                <option value="RW">Rwanda</option>
                <option value="BI">Burundi</option>
                <option value="MG">Madagascar</option>
                <option value="MU">Maurice</option>
                <option value="SC">Seychelles</option>
                <option value="KM">Comores</option>
                <option value="DJ">Djibouti</option>
              </optgroup>
              <optgroup label="Europe">
                <option value="FR">France</option>
                <option value="BE">Belgique</option>
                <option value="CH">Suisse</option>
                <option value="LU">Luxembourg</option>
                <option value="MC">Monaco</option>
              </optgroup>
              <optgroup label="Amérique">
                <option value="CA">Canada</option>
                <option value="HT">Haïti</option>
              </optgroup>
            </select>
          </div>

          {/* Currency */}
          <div>
            <label className="block text-sm font-medium text-advist-gray900 mb-2">
              {t('settings.currency', 'Devise')}
            </label>
            <select
              className="w-full px-3 py-2 border border-advist-bg rounded-xl focus:outline-none focus:ring-2 focus:ring-advist-gold"
              defaultValue="XOF"
            >
              <optgroup label="Devises principales">
                <option value="XOF">FCFA (XOF) - Afrique de l'Ouest</option>
                <option value="XAF">FCFA (XAF) - Afrique Centrale</option>
                <option value="EUR">Euro (EUR)</option>
              </optgroup>
              <optgroup label="Autres devises">
                <option value="USD">Dollar US (USD)</option>
                <option value="MAD">Dirham marocain (MAD)</option>
                <option value="DZD">Dinar algérien (DZD)</option>
                <option value="TND">Dinar tunisien (TND)</option>
                <option value="GNF">Franc guinéen (GNF)</option>
                <option value="MRU">Ouguiya (MRU)</option>
                <option value="CDF">Franc congolais (CDF)</option>
                <option value="RWF">Franc rwandais (RWF)</option>
                <option value="BIF">Franc burundais (BIF)</option>
                <option value="MGA">Ariary (MGA)</option>
                <option value="MUR">Roupie mauricienne (MUR)</option>
                <option value="KMF">Franc comorien (KMF)</option>
                <option value="CHF">Franc suisse (CHF)</option>
                <option value="CAD">Dollar canadien (CAD)</option>
                <option value="HTG">Gourde (HTG)</option>
              </optgroup>
            </select>
          </div>

          {/* Timezone */}
          <div>
            <label className="block text-sm font-medium text-advist-gray900 mb-2">
              {t('settings.timezone', 'Fuseau horaire')}
            </label>
            <select
              className="w-full px-3 py-2 border border-advist-bg rounded-xl focus:outline-none focus:ring-2 focus:ring-advist-gold"
              defaultValue="Africa/Dakar"
            >
              <optgroup label="Afrique">
                <option value="Africa/Dakar">Dakar, Bamako, Conakry (GMT+0)</option>
                <option value="Africa/Abidjan">Abidjan, Ouagadougou, Accra (GMT+0)</option>
                <option value="Africa/Lagos">Lagos, Douala, Kinshasa (GMT+1)</option>
                <option value="Africa/Libreville">Libreville, Brazzaville (GMT+1)</option>
                <option value="Africa/Casablanca">Casablanca, Rabat (GMT+1)</option>
                <option value="Africa/Algiers">Alger, Tunis (GMT+1)</option>
                <option value="Africa/Cairo">Le Caire (GMT+2)</option>
                <option value="Africa/Johannesburg">Johannesburg, Kigali (GMT+2)</option>
                <option value="Africa/Nairobi">Nairobi, Addis-Abeba (GMT+3)</option>
                <option value="Indian/Antananarivo">Antananarivo (GMT+3)</option>
                <option value="Indian/Mauritius">Port-Louis (GMT+4)</option>
              </optgroup>
              <optgroup label="Europe">
                <option value="Europe/Paris">Paris, Bruxelles (GMT+1/+2)</option>
                <option value="Europe/London">Londres (GMT+0/+1)</option>
                <option value="Europe/Zurich">Zurich, Genève (GMT+1/+2)</option>
              </optgroup>
              <optgroup label="Amérique">
                <option value="America/New_York">New York, Montréal (GMT-5/-4)</option>
                <option value="America/Port-au-Prince">Port-au-Prince (GMT-5/-4)</option>
              </optgroup>
            </select>
          </div>
        </div>

        {/* Date & Number Format */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-advist-gray900 mb-2">
              {t('settings.dateFormat', 'Format de date')}
            </label>
            <select
              className="w-full px-3 py-2 border border-advist-bg rounded-xl focus:outline-none focus:ring-2 focus:ring-advist-gold"
              defaultValue="DD/MM/YYYY"
            >
              <option value="DD/MM/YYYY">31/12/2024 (DD/MM/YYYY)</option>
              <option value="MM/DD/YYYY">12/31/2024 (MM/DD/YYYY)</option>
              <option value="YYYY-MM-DD">2024-12-31 (YYYY-MM-DD)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-advist-gray900 mb-2">
              {t('settings.numberFormat', 'Format des nombres')}
            </label>
            <select
              className="w-full px-3 py-2 border border-advist-bg rounded-xl focus:outline-none focus:ring-2 focus:ring-advist-gold"
              defaultValue="fr"
            >
              <option value="fr">1 234 567,89 (Français)</option>
              <option value="en">1,234,567.89 (Anglais)</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Upgrade Modal */}
      <Modal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        title={t('settings.upgradePlan', "Changer d'offre")}
        size="lg"
      >
        <div className="grid md:grid-cols-2 gap-4">
          {[
            {
              id: 'business',
              label: 'Business',
              price: '25 000/emetteur',
              users: '1-5 emetteurs',
              storage: '10 Go',
              features: ['1-5 emetteurs', '50 docs/mois', 'Signature simple', 'Support email'],
            },
            {
              id: 'enterprise',
              label: 'Entreprise',
              price: '150 000',
              users: 'Illimite',
              storage: 'Illimite',
              features: [
                'Tout illimite',
                'eIDAS & OHADA',
                'API & SSO',
                'Support prioritaire',
                'SLA 99,9%',
              ],
            },
          ].map((plan) => (
            <div
              key={plan.id}
              className={`p-4 border-2 rounded-xl ${
                plan.id === subscriptionPlan
                  ? 'border-advist-dark bg-advist-bg/30'
                  : 'border-advist-bg'
              }`}
            >
              <h3 className="text-lg font-bold text-advist-gray900">{plan.label}</h3>
              <p className="text-2xl font-bold text-advist-gray900 mt-2">
                {plan.price}
                {plan.price !== 'Sur mesure' && (
                  <span className="text-sm font-normal text-advist-gray900">€/mois</span>
                )}
              </p>
              <ul className="mt-4 space-y-2">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm text-advist-gray900">
                    <Check size={14} className="text-advist-success" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button
                variant={plan.id === subscriptionPlan ? 'outline' : 'primary'}
                className="w-full mt-4"
                disabled={plan.id === subscriptionPlan}
              >
                {plan.id === subscriptionPlan
                  ? t('settings.currentPlan', 'Plan actuel')
                  : t('settings.select', 'Sélectionner')}
              </Button>
            </div>
          ))}
        </div>
      </Modal>
    </>
  );
};

// v2: Accounts Management
const AccountsManagement: React.FC = () => {
  const { t } = useTranslation();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  // Mock users
  const users = [
    {
      id: 1,
      first_name: 'Jean',
      last_name: 'Dupont',
      email: 'jean@example.com',
      role: 'admin',
      is_active: true,
      last_login: '2024-11-28T10:00:00Z',
    },
    {
      id: 2,
      first_name: 'Marie',
      last_name: 'Martin',
      email: 'marie@example.com',
      role: 'manager',
      is_active: true,
      last_login: '2024-11-27T15:30:00Z',
    },
    {
      id: 3,
      first_name: 'Pierre',
      last_name: 'Durand',
      email: 'pierre@example.com',
      role: 'user',
      is_active: true,
      last_login: '2024-11-25T09:00:00Z',
    },
    {
      id: 4,
      first_name: 'Sophie',
      last_name: 'Laurent',
      email: 'sophie@example.com',
      role: 'user',
      is_active: false,
      last_login: '2024-10-15T11:00:00Z',
    },
  ];

  const pendingInvites = [
    {
      id: 1,
      email: 'nouveau@example.com',
      role: 'user',
      invited_at: '2024-11-26T10:00:00Z',
      expires_at: '2024-12-03T10:00:00Z',
    },
  ];

  const roleLabels: Record<string, { label: string; color: string }> = {
    admin: {
      label: t('settings.roles.admin', 'Administrateur'),
      color: 'bg-advist-surface-dark text-advist-gray900',
    },
    manager: {
      label: t('settings.roles.manager', 'Manager'),
      color: 'bg-advist-gold-light text-advist-gray900',
    },
    user: {
      label: t('settings.roles.user', 'Utilisateur'),
      color: 'bg-advist-surface-dark text-advist-gray900',
    },
  };

  return (
    <>
      {/* Active Users */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Users size={20} className="text-advist-gray900" />
            <h2 className="text-lg font-semibold text-advist-gray900">
              {t('settings.activeUsers', 'Utilisateurs actifs')}
            </h2>
            <Badge variant="secondary">{users.filter((u) => u.is_active).length} / 25</Badge>
          </div>
          <Button onClick={() => setShowInviteModal(true)} leftIcon={<UserPlus size={16} />}>
            {t('settings.inviteUser', 'Inviter un utilisateur')}
          </Button>
        </div>

        <div className="space-y-3">
          {users.map((user) => (
            <div
              key={user.id}
              className={`flex items-center justify-between p-4 rounded-xl ${
                user.is_active ? 'bg-advist-bg/30' : 'bg-advist-gold-light'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${
                    user.is_active
                      ? 'bg-advist-dark text-white'
                      : 'bg-advist-surface-dark text-advist-text-secondary'
                  }`}
                >
                  {user.first_name[0]}
                  {user.last_name[0]}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-advist-gray900">
                      {user.first_name} {user.last_name}
                    </p>
                    <Badge className={roleLabels[user.role].color} size="sm">
                      {roleLabels[user.role].label}
                    </Badge>
                    {!user.is_active && (
                      <Badge variant="danger" size="sm">
                        {t('settings.deactivated', 'Désactivé')}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-advist-gray900">{user.email}</p>
                  <p className="text-xs text-advist-blue-light">
                    {t('settings.lastLogin', 'Dernière connexion')}:{' '}
                    {new Date(user.last_login).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm">
                  <Key size={14} className="mr-1" />
                  {t('settings.resetPassword', 'Réinitialiser MDP')}
                </Button>
                {user.is_active ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-advist-error hover:bg-advist-gold-light"
                    onClick={() => {
                      setSelectedUser(user);
                      setShowDeactivateModal(true);
                    }}
                  >
                    <UserMinus size={14} className="mr-1" />
                    {t('settings.deactivate', 'Désactiver')}
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-advist-success hover:bg-green-50"
                  >
                    <Check size={14} className="mr-1" />
                    {t('settings.reactivate', 'Réactiver')}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Pending Invitations */}
      {pendingInvites.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Clock size={20} className="text-advist-gray900" />
            <h2 className="text-lg font-semibold text-advist-gray900">
              {t('settings.pendingInvites', 'Invitations en attente')}
            </h2>
          </div>
          <div className="space-y-3">
            {pendingInvites.map((invite) => (
              <div
                key={invite.id}
                className="flex items-center justify-between p-4 bg-advist-gold-light rounded-xl border border-advist-gold"
              >
                <div>
                  <p className="font-medium text-advist-gray900">{invite.email}</p>
                  <p className="text-sm text-advist-gray900">
                    {t('settings.invitedOn', 'Invité le')}{' '}
                    {new Date(invite.invited_at).toLocaleDateString('fr-FR')} •
                    {t('settings.expiresOn', 'Expire le')}{' '}
                    {new Date(invite.expires_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm">
                    <RefreshCw size={14} className="mr-1" />
                    {t('settings.resend', 'Renvoyer')}
                  </Button>
                  <Button variant="ghost" size="sm" className="text-advist-error">
                    <Trash2 size={14} className="mr-1" />
                    {t('settings.cancel', 'Annuler')}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Invite Modal */}
      <Modal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        title={t('settings.inviteUser', 'Inviter un utilisateur')}
        size="md"
      >
        <div className="space-y-4">
          <Input
            label={t('settings.email', 'Adresse email')}
            placeholder="email@example.com"
            type="email"
          />
          <div>
            <label className="block text-sm font-medium text-advist-gray900 mb-1">
              {t('settings.role', 'Rôle')}
            </label>
            <select className="w-full px-4 py-2 border border-advist-blue-light rounded-xl text-advist-gray900 focus:outline-none focus:ring-2 focus:ring-advist-gold">
              <option value="user">{t('settings.roles.user', 'Utilisateur')}</option>
              <option value="manager">{t('settings.roles.manager', 'Manager')}</option>
              <option value="admin">{t('settings.roles.admin', 'Administrateur')}</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setShowInviteModal(false)}>
              {t('common.cancel', 'Annuler')}
            </Button>
            <Button leftIcon={<Mail size={16} />}>
              {t('settings.sendInvite', "Envoyer l'invitation")}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Deactivate Modal */}
      <Modal
        isOpen={showDeactivateModal}
        onClose={() => {
          setShowDeactivateModal(false);
          setSelectedUser(null);
        }}
        title={t('settings.deactivateUser', 'Désactiver un utilisateur')}
        size="md"
      >
        <div className="space-y-4">
          <div className="p-4 bg-advist-gold-light rounded-xl border border-advist-gold">
            <div className="flex items-start gap-3">
              <AlertTriangle size={24} className="text-advist-error shrink-0" />
              <div>
                <p className="font-medium text-advist-gray900">
                  {t('settings.deactivateWarning', 'Attention')}
                </p>
                <p className="text-sm text-advist-error mt-1">
                  {t(
                    'settings.deactivateDesc',
                    "L'utilisateur ne pourra plus se connecter. Ses documents et workflows seront préservés."
                  )}
                </p>
              </div>
            </div>
          </div>
          {selectedUser && (
            <div className="p-4 bg-advist-bg/50 rounded-xl">
              <p className="font-medium text-advist-gray900">
                {selectedUser.first_name} {selectedUser.last_name}
              </p>
              <p className="text-sm text-advist-gray900">{selectedUser.email}</p>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setShowDeactivateModal(false)}>
              {t('common.cancel', 'Annuler')}
            </Button>
            <Button variant="danger" leftIcon={<UserMinus size={16} />}>
              {t('settings.confirmDeactivate', 'Confirmer la désactivation')}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

// v2: Security Settings
const SecuritySettings: React.FC = () => {
  const { t } = useTranslation();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [showSessionsModal, setShowSessionsModal] = useState(false);
  const [showPINModal, setShowPINModal] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [pinEnabled] = useState(true);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Mock active sessions
  const activeSessions = [
    {
      id: 1,
      device: 'Windows 10 - Chrome',
      location: 'Paris, France',
      ip: '192.168.1.xxx',
      last_activity: '2024-11-28T10:30:00Z',
      is_current: true,
    },
    {
      id: 2,
      device: 'iPhone 14 - Safari',
      location: 'Paris, France',
      ip: '192.168.1.xxx',
      last_activity: '2024-11-27T18:00:00Z',
      is_current: false,
    },
    {
      id: 3,
      device: 'MacBook Pro - Firefox',
      location: 'Lyon, France',
      ip: '10.0.0.xxx',
      last_activity: '2024-11-25T09:00:00Z',
      is_current: false,
    },
  ];

  return (
    <>
      {/* Password Section */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Key size={20} className="text-advist-gray900" />
          <h2 className="text-lg font-semibold text-advist-gray900">
            {t('settings.security.password', 'Mot de passe')}
          </h2>
        </div>
        <p className="text-sm text-advist-gray900 mb-4">
          {t(
            'settings.security.passwordDesc',
            'Modifiez votre mot de passe régulièrement pour sécuriser votre compte'
          )}
        </p>
        <div className="flex items-center justify-between p-4 bg-advist-bg/30 rounded-xl">
          <div>
            <p className="font-medium text-advist-gray900">
              {t('settings.security.lastChanged', 'Dernier changement')}
            </p>
            <p className="text-sm text-advist-gray900">
              {t('settings.security.daysAgo', 'Il y a 45 jours')}
            </p>
          </div>
          <Button variant="outline" onClick={() => setShowPasswordModal(true)}>
            {t('settings.security.changePassword', 'Changer le mot de passe')}
          </Button>
        </div>
      </Card>

      {/* Two-Factor Authentication */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Shield size={20} className="text-advist-gray900" />
          <h2 className="text-lg font-semibold text-advist-gray900">
            {t('settings.security.twoFactor', 'Authentification à deux facteurs')}
          </h2>
        </div>
        <p className="text-sm text-advist-gray900 mb-4">
          {t(
            'settings.security.twoFactorDesc',
            'Ajoutez une couche de sécurité supplémentaire en activant la 2FA'
          )}
        </p>
        <div className="flex items-center justify-between p-4 bg-advist-bg/30 rounded-xl">
          <div className="flex items-center gap-3">
            {twoFactorEnabled ? (
              <div className="p-2 bg-green-50 rounded-xl">
                <Check size={20} className="text-advist-success" />
              </div>
            ) : (
              <div className="p-2 bg-advist-gold-light rounded-xl">
                <AlertTriangle size={20} className="text-advist-gold-dark" />
              </div>
            )}
            <div>
              <p className="font-medium text-advist-gray900">
                {twoFactorEnabled
                  ? t('settings.security.2faEnabled', '2FA activée')
                  : t('settings.security.2faDisabled', '2FA désactivée')}
              </p>
              <p className="text-sm text-advist-gray900">
                {twoFactorEnabled
                  ? t(
                      'settings.security.2faEnabledDesc',
                      'Votre compte est protégé par une authentification à deux facteurs'
                    )
                  : t(
                      'settings.security.2faDisabledDesc',
                      "Nous recommandons d'activer la 2FA pour plus de sécurité"
                    )}
              </p>
            </div>
          </div>
          <Button
            variant={twoFactorEnabled ? 'outline' : 'primary'}
            onClick={() => setShow2FAModal(true)}
          >
            {twoFactorEnabled
              ? t('settings.security.manage2FA', 'Gérer')
              : t('settings.security.enable2FA', 'Activer')}
          </Button>
        </div>
      </Card>

      {/* Signature PIN */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Lock size={20} className="text-advist-gray900" />
          <h2 className="text-lg font-semibold text-advist-gray900">
            {t('settings.security.signaturePIN', 'Code PIN de signature')}
          </h2>
        </div>
        <p className="text-sm text-advist-gray900 mb-4">
          {t(
            'settings.security.pinDesc',
            'Protégez vos signatures électroniques avec un code PIN personnel'
          )}
        </p>
        <div className="flex items-center justify-between p-4 bg-advist-bg/30 rounded-xl">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-xl ${pinEnabled ? 'bg-green-50' : 'bg-advist-surface-dark'}`}
            >
              <Lock
                size={20}
                className={pinEnabled ? 'text-advist-success' : 'text-advist-text-muted'}
              />
            </div>
            <div>
              <p className="font-medium text-advist-gray900">
                {pinEnabled
                  ? t('settings.security.pinEnabled', 'PIN activé')
                  : t('settings.security.pinDisabled', 'PIN désactivé')}
              </p>
              <p className="text-sm text-advist-gray900">
                {t(
                  'settings.security.pinStatusDesc',
                  "Votre PIN protège l'utilisation de vos signatures"
                )}
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={() => setShowPINModal(true)}>
            {t('settings.security.changePIN', 'Modifier le PIN')}
          </Button>
        </div>
      </Card>

      {/* Active Sessions */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Monitor size={20} className="text-advist-gray900" />
            <h2 className="text-lg font-semibold text-advist-gray900">
              {t('settings.security.sessions', 'Sessions actives')}
            </h2>
            <Badge variant="secondary">{activeSessions.length}</Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-advist-error"
            onClick={() => setShowSessionsModal(true)}
          >
            {t('settings.security.terminateAll', 'Terminer toutes les sessions')}
          </Button>
        </div>
        <div className="space-y-3">
          {activeSessions.slice(0, 3).map((session) => (
            <div
              key={session.id}
              className={`flex items-center justify-between p-4 rounded-xl ${
                session.is_current ? 'bg-green-50 border border-advist-success' : 'bg-advist-bg/30'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-xl ${session.is_current ? 'bg-green-50' : 'bg-white'}`}
                >
                  <Monitor
                    size={20}
                    className={session.is_current ? 'text-advist-success' : 'text-advist-gray900'}
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-advist-gray900">{session.device}</p>
                    {session.is_current && (
                      <Badge variant="success" size="sm">
                        {t('settings.security.currentSession', 'Session actuelle')}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-advist-gray900">
                    {session.location} • {session.ip}
                  </p>
                  <p className="text-xs text-advist-blue-light">
                    {t('settings.security.lastActivity', 'Dernière activité')}:{' '}
                    {new Date(session.last_activity).toLocaleString('fr-FR')}
                  </p>
                </div>
              </div>
              {!session.is_current && (
                <Button variant="ghost" size="sm" className="text-advist-error">
                  {t('settings.security.terminate', 'Terminer')}
                </Button>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Change Password Modal */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        title={t('settings.security.changePassword', 'Changer le mot de passe')}
        size="md"
      >
        <div className="space-y-4">
          <div className="relative">
            <Input
              label={t('settings.security.currentPassword', 'Mot de passe actuel')}
              type={showCurrentPassword ? 'text' : 'password'}
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              className="absolute right-3 top-9 text-advist-blue-light"
            >
              {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <div className="relative">
            <Input
              label={t('settings.security.newPassword', 'Nouveau mot de passe')}
              type={showNewPassword ? 'text' : 'password'}
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3 top-9 text-advist-blue-light"
            >
              {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <Input
            label={t('settings.security.confirmPassword', 'Confirmer le nouveau mot de passe')}
            type="password"
            placeholder="••••••••"
          />
          <div className="p-3 bg-advist-bg/30 rounded-xl">
            <p className="text-sm font-medium text-advist-gray900 mb-2">
              {t('settings.security.requirements', 'Exigences du mot de passe')}
            </p>
            <ul className="space-y-1 text-sm text-advist-gray900">
              <li className="flex items-center gap-2">
                <Check size={14} className="text-advist-success" />{' '}
                {t('settings.security.minChars', 'Au moins 8 caractères')}
              </li>
              <li className="flex items-center gap-2">
                <Check size={14} className="text-advist-success" />{' '}
                {t('settings.security.uppercase', 'Une majuscule')}
              </li>
              <li className="flex items-center gap-2">
                <Check size={14} className="text-advist-success" />{' '}
                {t('settings.security.lowercase', 'Une minuscule')}
              </li>
              <li className="flex items-center gap-2">
                <Check size={14} className="text-advist-success" />{' '}
                {t('settings.security.number', 'Un chiffre')}
              </li>
              <li className="flex items-center gap-2">
                <Check size={14} className="text-advist-blue-light" />{' '}
                {t('settings.security.special', 'Un caractère spécial (recommandé)')}
              </li>
            </ul>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setShowPasswordModal(false)}>
              {t('common.cancel', 'Annuler')}
            </Button>
            <Button>
              {t('settings.security.updatePassword', 'Mettre à jour le mot de passe')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* 2FA Modal */}
      <Modal
        isOpen={show2FAModal}
        onClose={() => setShow2FAModal(false)}
        title={
          twoFactorEnabled
            ? t('settings.security.manage2FA', 'Gérer la 2FA')
            : t('settings.security.setup2FA', 'Configurer la 2FA')
        }
        size="md"
      >
        <div className="space-y-4">
          {!twoFactorEnabled ? (
            <>
              <div className="p-4 bg-advist-gold-light rounded-xl border border-advist-gold">
                <p className="text-sm text-advist-gray900">
                  {t(
                    'settings.security.2faInstructions',
                    "Scannez le QR code avec votre application d'authentification (Google Authenticator, Authy, etc.)"
                  )}
                </p>
              </div>
              <div className="flex justify-center p-6 bg-white border border-advist-bg rounded-xl">
                <div className="w-40 h-40 bg-advist-bg rounded-xl flex items-center justify-center">
                  <span className="text-advist-blue-light">QR Code</span>
                </div>
              </div>
              <Input
                label={t('settings.security.verificationCode', 'Code de vérification')}
                placeholder="000000"
                maxLength={6}
              />
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="ghost" onClick={() => setShow2FAModal(false)}>
                  {t('common.cancel', 'Annuler')}
                </Button>
                <Button
                  onClick={() => {
                    setTwoFactorEnabled(true);
                    setShow2FAModal(false);
                  }}
                >
                  {t('settings.security.verify', 'Vérifier et activer')}
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="p-4 bg-green-50 rounded-xl border border-advist-success">
                <div className="flex items-center gap-2">
                  <Check size={20} className="text-advist-success" />
                  <p className="font-medium text-advist-success">
                    {t('settings.security.2faActive', 'Authentification à deux facteurs active')}
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <RefreshCw size={16} className="mr-2" />
                  {t('settings.security.regenerateCodes', 'Régénérer les codes de secours')}
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start text-advist-error hover:bg-advist-gold-light"
                  onClick={() => {
                    setTwoFactorEnabled(false);
                    setShow2FAModal(false);
                  }}
                >
                  <Shield size={16} className="mr-2" />
                  {t('settings.security.disable2FA', 'Désactiver la 2FA')}
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* PIN Modal */}
      <Modal
        isOpen={showPINModal}
        onClose={() => setShowPINModal(false)}
        title={t('settings.security.changePIN', 'Modifier le code PIN')}
        size="md"
      >
        <div className="space-y-4">
          <Input
            label={t('settings.security.currentPIN', 'Code PIN actuel')}
            type="password"
            placeholder="••••"
            maxLength={4}
          />
          <Input
            label={t('settings.security.newPIN', 'Nouveau code PIN')}
            type="password"
            placeholder="••••"
            maxLength={4}
          />
          <Input
            label={t('settings.security.confirmPIN', 'Confirmer le nouveau PIN')}
            type="password"
            placeholder="••••"
            maxLength={4}
          />
          <div className="p-3 bg-advist-gold-light rounded-xl border border-advist-gold">
            <p className="text-sm text-advist-gold-dark">
              {t(
                'settings.security.pinWarning',
                'Ce code PIN sera requis chaque fois que vous utiliserez une signature électronique.'
              )}
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setShowPINModal(false)}>
              {t('common.cancel', 'Annuler')}
            </Button>
            <Button>{t('settings.security.updatePIN', 'Mettre à jour le PIN')}</Button>
          </div>
        </div>
      </Modal>

      {/* Terminate Sessions Modal */}
      <Modal
        isOpen={showSessionsModal}
        onClose={() => setShowSessionsModal(false)}
        title={t('settings.security.terminateAllSessions', 'Terminer toutes les sessions')}
        size="md"
      >
        <div className="space-y-4">
          <div className="p-4 bg-advist-gold-light rounded-xl border border-advist-gold">
            <div className="flex items-start gap-3">
              <AlertTriangle size={24} className="text-advist-error shrink-0" />
              <div>
                <p className="font-medium text-advist-gray900">
                  {t('settings.security.terminateWarning', 'Attention')}
                </p>
                <p className="text-sm text-advist-error mt-1">
                  {t(
                    'settings.security.terminateDesc',
                    'Cette action déconnectera tous les appareils sauf celui-ci. Vous devrez vous reconnecter sur vos autres appareils.'
                  )}
                </p>
              </div>
            </div>
          </div>
          <div className="p-4 bg-advist-bg/30 rounded-xl">
            <p className="text-sm text-advist-gray900">
              {t('settings.security.sessionsToTerminate', '{{count}} session(s) seront terminées', {
                count: activeSessions.filter((s) => !s.is_current).length,
              })}
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setShowSessionsModal(false)}>
              {t('common.cancel', 'Annuler')}
            </Button>
            <Button variant="danger">
              {t('settings.security.confirmTerminate', 'Terminer les sessions')}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

// v2: Offline Settings
const OfflineSettings: React.FC = () => {
  const { t } = useTranslation();

  return (
    <>
      {/* Offline Manager Component */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <WifiOff size={20} className="text-advist-gray900" />
          <h2 className="text-lg font-semibold text-advist-gray900">
            {t('settings.offline.title', 'Mode hors-ligne')}
          </h2>
        </div>
        <p className="text-sm text-advist-gray900 mb-6">
          {t(
            'settings.offline.description',
            'Gérez vos données en mode hors-ligne et synchronisez-les lorsque vous êtes connecté'
          )}
        </p>

        {/* Use the existing OfflineManager component */}
        <OfflineManager />
      </Card>

      {/* Offline Features Info */}
      <Card className="p-6 bg-advist-gold-light border-advist-gold">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-advist-gold-light rounded-xl">
            <Wifi size={24} className="text-advist-gray900" />
          </div>
          <div>
            <h3 className="font-semibold text-advist-gray900">
              {t('settings.offline.features', 'Fonctionnalités hors-ligne')}
            </h3>
            <ul className="mt-2 space-y-1 text-sm text-advist-gray900">
              <li className="flex items-center gap-2">
                <Check size={14} className="text-advist-gray900" />
                {t('settings.offline.feature1', 'Consultation des documents téléchargés')}
              </li>
              <li className="flex items-center gap-2">
                <Check size={14} className="text-advist-gray900" />
                {t('settings.offline.feature2', 'Création de brouillons de documents')}
              </li>
              <li className="flex items-center gap-2">
                <Check size={14} className="text-advist-gray900" />
                {t(
                  'settings.offline.feature3',
                  "File d'attente des actions (synchronisation automatique)"
                )}
              </li>
              <li className="flex items-center gap-2">
                <Check size={14} className="text-advist-gray900" />
                {t('settings.offline.feature4', 'Notification de changement de statut réseau')}
              </li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Offline Limitations */}
      <Card className="p-6 bg-advist-gold-light border-advist-gold">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-advist-gold-light rounded-xl">
            <AlertTriangle size={24} className="text-advist-gold-dark" />
          </div>
          <div>
            <h3 className="font-semibold text-advist-gold-dark">
              {t('settings.offline.limitations', 'Limitations')}
            </h3>
            <ul className="mt-2 space-y-1 text-sm text-advist-gold-dark">
              <li className="flex items-center gap-2">
                <CloudOff size={14} className="text-advist-gold-dark" />
                {t(
                  'settings.offline.limitation1',
                  'Les signatures électroniques nécessitent une connexion'
                )}
              </li>
              <li className="flex items-center gap-2">
                <CloudOff size={14} className="text-advist-gold-dark" />
                {t(
                  'settings.offline.limitation2',
                  "Les validations de workflow sont mises en file d'attente"
                )}
              </li>
              <li className="flex items-center gap-2">
                <CloudOff size={14} className="text-advist-gold-dark" />
                {t(
                  'settings.offline.limitation3',
                  'Les nouveaux documents ne sont pas disponibles hors-ligne'
                )}
              </li>
            </ul>
          </div>
        </div>
      </Card>
    </>
  );
};

// v2: Mail Settings (Admin only)
const MailSettings: React.FC = () => {
  const { t } = useTranslation();
  const [activeMailTab, setActiveMailTab] = useState<'config' | 'templates'>('config');
  const [showTestModal, setShowTestModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [smtpConfig, setSmtpConfig] = useState({
    host: 'smtp.example.com',
    port: '587',
    encryption: 'tls' as 'tls' | 'ssl' | 'none',
    username: 'notifications@advist.com',
    password: '',
    from_name: 'ADVIST',
    from_email: 'notifications@advist.com',
    reply_to: 'support@advist.com',
  });

  const [emailTemplates, setEmailTemplates] = useState({
    welcome: true,
    password_reset: true,
    document_shared: true,
    workflow_notification: true,
    signature_request: true,
    weekly_digest: true,
    external_invitation: true,
  });

  // HTML Templates for each email type
  const htmlTemplates: Record<string, { subject: string; html: string }> = {
    welcome: {
      subject: 'Bienvenue sur ADVIST',
      html: `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bienvenue sur ADVIST</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color: advist-navy; padding: 30px; text-align: center;">
              <h1 style="color: #F8F868; margin: 0; font-size: 32px; font-family: 'Grand Hotel', cursive;">Advist</h1>
              <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 14px;">Gestion Électronique de Documents</p>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: advist-navy; margin: 0 0 20px 0;">Bienvenue {{user_name}} !</h2>
              <p style="color: advist-navy; line-height: 1.6; margin: 0 0 20px 0;">
                Votre compte ADVIST a été créé avec succès. Vous pouvez maintenant accéder à toutes les fonctionnalités de gestion documentaire.
              </p>
              <p style="color: advist-navy; line-height: 1.6; margin: 0 0 30px 0;">
                <strong>Vos identifiants :</strong><br>
                Email : {{user_email}}<br>
                Organisation : {{organization_name}}
              </p>
              <table cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                <tr>
                  <td style="background-color: advist-navy; border-radius: 6px;">
                    <a href="{{login_url}}" style="display: inline-block; padding: 14px 30px; color: #ffffff; text-decoration: none; font-weight: bold;">
                      Accéder à mon compte
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: advist-bg; padding: 20px 30px; text-align: center;">
              <p style="color: advist-blue-light; font-size: 12px; margin: 0;">
                © 2024 ADVIST. Tous droits réservés.<br>
                Cet email a été envoyé automatiquement, merci de ne pas y répondre.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    },
    password_reset: {
      subject: 'Réinitialisation de votre mot de passe',
      html: `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Réinitialisation de mot de passe</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color: advist-navy; padding: 30px; text-align: center;">
              <h1 style="color: #F8F868; margin: 0; font-size: 32px; font-family: 'Grand Hotel', cursive;">Advist</h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <div style="width: 60px; height: 60px; background-color: #FEF3C7; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;">
                  <span style="font-size: 30px;">🔐</span>
                </div>
              </div>
              <h2 style="color: advist-navy; margin: 0 0 20px 0; text-align: center;">Réinitialisation de mot de passe</h2>
              <p style="color: advist-navy; line-height: 1.6; margin: 0 0 20px 0;">
                Bonjour {{user_name}},
              </p>
              <p style="color: advist-navy; line-height: 1.6; margin: 0 0 20px 0;">
                Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous pour définir un nouveau mot de passe.
              </p>
              <table cellpadding="0" cellspacing="0" style="margin: 30px auto;">
                <tr>
                  <td style="background-color: advist-navy; border-radius: 6px;">
                    <a href="{{reset_url}}" style="display: inline-block; padding: 14px 30px; color: #ffffff; text-decoration: none; font-weight: bold;">
                      Réinitialiser mon mot de passe
                    </a>
                  </td>
                </tr>
              </table>
              <p style="color: advist-blue-light; font-size: 13px; line-height: 1.6; margin: 20px 0 0 0; padding: 15px; background-color: advist-bg; border-radius: 6px;">
                ⚠️ Ce lien expire dans 24 heures. Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: advist-bg; padding: 20px 30px; text-align: center;">
              <p style="color: advist-blue-light; font-size: 12px; margin: 0;">
                © 2024 ADVIST. Tous droits réservés.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    },
    document_shared: {
      subject: 'Un document a été partagé avec vous',
      html: `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document partagé</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color: advist-navy; padding: 30px; text-align: center;">
              <h1 style="color: #F8F868; margin: 0; font-size: 32px; font-family: 'Grand Hotel', cursive;">Advist</h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <div style="width: 60px; height: 60px; background-color: #DBEAFE; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;">
                  <span style="font-size: 30px;">📄</span>
                </div>
              </div>
              <h2 style="color: advist-navy; margin: 0 0 20px 0; text-align: center;">Nouveau document partagé</h2>
              <p style="color: advist-navy; line-height: 1.6; margin: 0 0 20px 0;">
                Bonjour {{user_name}},
              </p>
              <p style="color: advist-navy; line-height: 1.6; margin: 0 0 20px 0;">
                <strong>{{shared_by}}</strong> a partagé un document avec vous.
              </p>
              <!-- Document Card -->
              <div style="border: 1px solid advist-bg; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td width="50" style="vertical-align: top;">
                      <div style="width: 40px; height: 40px; background-color: advist-navy; border-radius: 6px; text-align: center; line-height: 40px;">
                        <span style="color: #ffffff; font-size: 18px;">📁</span>
                      </div>
                    </td>
                    <td style="vertical-align: top; padding-left: 15px;">
                      <p style="margin: 0; font-weight: bold; color: advist-navy;">{{document_name}}</p>
                      <p style="margin: 5px 0 0 0; color: advist-blue-light; font-size: 13px;">
                        {{document_type}} • {{document_size}} • Partagé le {{share_date}}
                      </p>
                    </td>
                  </tr>
                </table>
              </div>
              <table cellpadding="0" cellspacing="0" style="margin: 30px auto;">
                <tr>
                  <td style="background-color: advist-navy; border-radius: 6px;">
                    <a href="{{document_url}}" style="display: inline-block; padding: 14px 30px; color: #ffffff; text-decoration: none; font-weight: bold;">
                      Voir le document
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: advist-bg; padding: 20px 30px; text-align: center;">
              <p style="color: advist-blue-light; font-size: 12px; margin: 0;">
                © 2024 ADVIST. Tous droits réservés.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    },
    workflow_notification: {
      subject: 'Action requise sur un workflow',
      html: `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Notification de workflow</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color: advist-navy; padding: 30px; text-align: center;">
              <h1 style="color: #F8F868; margin: 0; font-size: 32px; font-family: 'Grand Hotel', cursive;">Advist</h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <div style="width: 60px; height: 60px; background-color: #FDE68A; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;">
                  <span style="font-size: 30px;">⚡</span>
                </div>
              </div>
              <h2 style="color: advist-navy; margin: 0 0 20px 0; text-align: center;">Action requise</h2>
              <p style="color: advist-navy; line-height: 1.6; margin: 0 0 20px 0;">
                Bonjour {{user_name}},
              </p>
              <p style="color: advist-navy; line-height: 1.6; margin: 0 0 20px 0;">
                Une étape de validation nécessite votre attention.
              </p>
              <!-- Workflow Card -->
              <div style="border: 2px solid #F59E0B; border-radius: 8px; padding: 20px; margin: 20px 0; background-color: #FFFBEB;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td>
                      <p style="margin: 0 0 10px 0; font-weight: bold; color: advist-navy;">{{workflow_name}}</p>
                      <p style="margin: 0 0 5px 0; color: advist-navy; font-size: 14px;">
                        📄 Document : {{document_name}}
                      </p>
                      <p style="margin: 0 0 5px 0; color: advist-navy; font-size: 14px;">
                        👤 Demandeur : {{requester_name}}
                      </p>
                      <p style="margin: 0; color: advist-navy; font-size: 14px;">
                        🎯 Étape actuelle : {{current_step}}
                      </p>
                    </td>
                  </tr>
                </table>
              </div>
              <table cellpadding="0" cellspacing="0" style="margin: 30px auto;">
                <tr>
                  <td style="background-color: #10B981; border-radius: 6px; margin-right: 10px;">
                    <a href="{{approve_url}}" style="display: inline-block; padding: 14px 25px; color: #ffffff; text-decoration: none; font-weight: bold;">
                      ✓ Approuver
                    </a>
                  </td>
                  <td width="10"></td>
                  <td style="background-color: #F59E0B; border-radius: 6px;">
                    <a href="{{reject_url}}" style="display: inline-block; padding: 14px 25px; color: #ffffff; text-decoration: none; font-weight: bold;">
                      ✗ Rejeter
                    </a>
                  </td>
                </tr>
              </table>
              <p style="text-align: center; margin-top: 20px;">
                <a href="{{workflow_url}}" style="color: advist-navy; text-decoration: underline;">Voir les détails du workflow</a>
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: advist-bg; padding: 20px 30px; text-align: center;">
              <p style="color: advist-blue-light; font-size: 12px; margin: 0;">
                © 2024 ADVIST. Tous droits réservés.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    },
    signature_request: {
      subject: 'Demande de signature électronique',
      html: `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Demande de signature</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color: advist-navy; padding: 30px; text-align: center;">
              <h1 style="color: #F8F868; margin: 0; font-size: 32px; font-family: 'Grand Hotel', cursive;">Advist</h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <div style="width: 60px; height: 60px; background-color: #E0E7FF; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;">
                  <span style="font-size: 30px;">✍️</span>
                </div>
              </div>
              <h2 style="color: advist-navy; margin: 0 0 20px 0; text-align: center;">Signature requise</h2>
              <p style="color: advist-navy; line-height: 1.6; margin: 0 0 20px 0;">
                Bonjour {{user_name}},
              </p>
              <p style="color: advist-navy; line-height: 1.6; margin: 0 0 20px 0;">
                <strong>{{requester_name}}</strong> vous demande de signer un document.
              </p>
              <!-- Signature Request Card -->
              <div style="border: 1px solid advist-bg; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td width="50" style="vertical-align: top;">
                      <div style="width: 40px; height: 40px; background-color: #6366F1; border-radius: 6px; text-align: center; line-height: 40px;">
                        <span style="color: #ffffff; font-size: 18px;">📝</span>
                      </div>
                    </td>
                    <td style="vertical-align: top; padding-left: 15px;">
                      <p style="margin: 0; font-weight: bold; color: advist-navy;">{{document_name}}</p>
                      <p style="margin: 5px 0 0 0; color: advist-blue-light; font-size: 13px;">
                        {{document_type}} • {{page_count}} pages
                      </p>
                      <p style="margin: 10px 0 0 0; color: #F59E0B; font-size: 13px; font-weight: bold;">
                        ⏰ Date limite : {{deadline}}
                      </p>
                    </td>
                  </tr>
                </table>
              </div>
              <table cellpadding="0" cellspacing="0" style="margin: 30px auto;">
                <tr>
                  <td style="background-color: #6366F1; border-radius: 6px;">
                    <a href="{{signature_url}}" style="display: inline-block; padding: 14px 30px; color: #ffffff; text-decoration: none; font-weight: bold;">
                      ✍️ Signer le document
                    </a>
                  </td>
                </tr>
              </table>
              <p style="color: advist-blue-light; font-size: 13px; line-height: 1.6; margin: 20px 0 0 0; padding: 15px; background-color: advist-bg; border-radius: 6px; text-align: center;">
                🔒 Signature sécurisée conforme OHADA
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: advist-bg; padding: 20px 30px; text-align: center;">
              <p style="color: advist-blue-light; font-size: 12px; margin: 0;">
                © 2024 ADVIST. Tous droits réservés.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    },
    weekly_digest: {
      subject: 'Votre résumé hebdomadaire ADVIST',
      html: `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Résumé hebdomadaire</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color: advist-navy; padding: 30px; text-align: center;">
              <h1 style="color: #F8F868; margin: 0; font-size: 32px; font-family: 'Grand Hotel', cursive;">Advist</h1>
              <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 14px;">Résumé de la semaine</p>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: advist-navy; margin: 0 0 20px 0;">Bonjour {{user_name}},</h2>
              <p style="color: advist-navy; line-height: 1.6; margin: 0 0 30px 0;">
                Voici le résumé de votre activité pour la semaine du {{week_start}} au {{week_end}}.
              </p>

              <!-- Stats Grid -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                <tr>
                  <td width="48%" style="background-color: advist-bg; border-radius: 8px; padding: 20px; text-align: center;">
                    <p style="margin: 0; font-size: 32px; font-weight: bold; color: advist-navy;">{{documents_count}}</p>
                    <p style="margin: 5px 0 0 0; color: advist-navy; font-size: 14px;">Documents créés</p>
                  </td>
                  <td width="4%"></td>
                  <td width="48%" style="background-color: advist-bg; border-radius: 8px; padding: 20px; text-align: center;">
                    <p style="margin: 0; font-size: 32px; font-weight: bold; color: advist-navy;">{{signatures_count}}</p>
                    <p style="margin: 5px 0 0 0; color: advist-navy; font-size: 14px;">Signatures effectuées</p>
                  </td>
                </tr>
                <tr><td colspan="3" height="15"></td></tr>
                <tr>
                  <td width="48%" style="background-color: advist-bg; border-radius: 8px; padding: 20px; text-align: center;">
                    <p style="margin: 0; font-size: 32px; font-weight: bold; color: advist-navy;">{{workflows_completed}}</p>
                    <p style="margin: 5px 0 0 0; color: advist-navy; font-size: 14px;">Workflows complétés</p>
                  </td>
                  <td width="4%"></td>
                  <td width="48%" style="background-color: #FEF3C7; border-radius: 8px; padding: 20px; text-align: center;">
                    <p style="margin: 0; font-size: 32px; font-weight: bold; color: #F59E0B;">{{pending_actions}}</p>
                    <p style="margin: 5px 0 0 0; color: advist-navy; font-size: 14px;">Actions en attente</p>
                  </td>
                </tr>
              </table>

              <!-- Pending Actions -->
              <h3 style="color: advist-navy; margin: 0 0 15px 0; font-size: 16px;">📋 À faire cette semaine</h3>
              <div style="border: 1px solid advist-bg; border-radius: 8px; overflow: hidden; margin-bottom: 30px;">
                <div style="padding: 12px 15px; border-bottom: 1px solid advist-bg; background-color: advist-surface;">
                  <span style="color: #F59E0B;">●</span>
                  <span style="color: advist-navy; margin-left: 10px;">3 documents en attente de signature</span>
                </div>
                <div style="padding: 12px 15px; border-bottom: 1px solid advist-bg; background-color: advist-surface;">
                  <span style="color: #F59E0B;">●</span>
                  <span style="color: advist-navy; margin-left: 10px;">2 workflows nécessitent votre validation</span>
                </div>
                <div style="padding: 12px 15px; background-color: advist-surface;">
                  <span style="color: #10B981;">●</span>
                  <span style="color: advist-navy; margin-left: 10px;">5 documents partagés avec vous</span>
                </div>
              </div>

              <table cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                <tr>
                  <td style="background-color: advist-navy; border-radius: 6px;">
                    <a href="{{dashboard_url}}" style="display: inline-block; padding: 14px 30px; color: #ffffff; text-decoration: none; font-weight: bold;">
                      Accéder à mon tableau de bord
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: advist-bg; padding: 20px 30px; text-align: center;">
              <p style="color: advist-blue-light; font-size: 12px; margin: 0 0 10px 0;">
                Vous recevez cet email car les résumés hebdomadaires sont activés.
              </p>
              <p style="color: advist-blue-light; font-size: 12px; margin: 0;">
                <a href="{{unsubscribe_url}}" style="color: advist-blue-light;">Se désabonner</a> •
                <a href="{{settings_url}}" style="color: advist-blue-light;">Gérer les préférences</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    },
    external_invitation: {
      subject: 'Vous êtes invité à consulter un document sur ADVIST',
      html: `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invitation externe ADVIST</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color: advist-navy; padding: 30px; text-align: center;">
              <h1 style="color: #F8F868; margin: 0; font-size: 32px; font-family: 'Grand Hotel', cursive;">Advist</h1>
              <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 14px;">Accès externe sécurisé</p>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <div style="width: 70px; height: 70px; background-color: #DBEAFE; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;">
                  <span style="font-size: 35px;">🔗</span>
                </div>
              </div>
              <h2 style="color: advist-navy; margin: 0 0 20px 0; text-align: center;">Invitation à consulter un document</h2>
              <p style="color: advist-navy; line-height: 1.6; margin: 0 0 20px 0;">
                Bonjour,
              </p>
              <p style="color: advist-navy; line-height: 1.6; margin: 0 0 20px 0;">
                <strong>{{inviter_name}}</strong> de l'organisation <strong>{{organization_name}}</strong> vous invite à accéder à un document via ADVIST.
              </p>

              <!-- Document Card -->
              <div style="border: 1px solid advist-bg; border-radius: 8px; padding: 20px; margin: 20px 0; background-color: advist-surface;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td width="50" style="vertical-align: top;">
                      <div style="width: 45px; height: 45px; background-color: #6366F1; border-radius: 8px; text-align: center; line-height: 45px;">
                        <span style="color: #ffffff; font-size: 20px;">📄</span>
                      </div>
                    </td>
                    <td style="vertical-align: top; padding-left: 15px;">
                      <p style="margin: 0; font-weight: bold; color: advist-navy; font-size: 16px;">{{document_name}}</p>
                      <p style="margin: 5px 0 0 0; color: advist-blue-light; font-size: 13px;">
                        {{document_type}}
                      </p>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Permissions Card -->
              <div style="border: 2px solid #10B981; border-radius: 8px; padding: 20px; margin: 20px 0; background-color: #ECFDF5;">
                <p style="margin: 0 0 15px 0; font-weight: bold; color: #065F46;">Vos permissions :</p>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding: 5px 0;">
                      <span style="color: #10B981; margin-right: 10px;">✓</span>
                      <span style="color: #065F46;">{{permission_view}}</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0;">
                      <span style="color: #10B981; margin-right: 10px;">✓</span>
                      <span style="color: #065F46;">{{permission_annotate}}</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0;">
                      <span style="color: #10B981; margin-right: 10px;">✓</span>
                      <span style="color: #065F46;">{{permission_sign}}</span>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Expiration Warning -->
              <div style="border: 1px solid #F59E0B; border-radius: 8px; padding: 15px; margin: 20px 0; background-color: #FFFBEB;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td width="30" style="vertical-align: top;">
                      <span style="font-size: 20px;">⏰</span>
                    </td>
                    <td style="vertical-align: top;">
                      <p style="margin: 0; font-weight: bold; color: #F59E0B;">Accès temporaire</p>
                      <p style="margin: 5px 0 0 0; color: #F59E0B; font-size: 13px;">
                        Ce lien expire le <strong>{{expiration_date}}</strong> à {{expiration_time}}.<br>
                        Après cette date, vous ne pourrez plus accéder au document.
                      </p>
                    </td>
                  </tr>
                </table>
              </div>

              <table cellpadding="0" cellspacing="0" style="margin: 30px auto;">
                <tr>
                  <td style="background-color: #6366F1; border-radius: 6px;">
                    <a href="{{secure_link}}" style="display: inline-block; padding: 16px 40px; color: #ffffff; text-decoration: none; font-weight: bold; font-size: 16px;">
                      🔐 Accéder au document
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Security Notice -->
              <div style="padding: 15px; background-color: advist-bg; border-radius: 6px; margin-top: 20px;">
                <p style="margin: 0; color: advist-navy; font-size: 13px; text-align: center;">
                  <strong>🔒 Accès sécurisé</strong><br>
                  Ce lien est unique et personnel. Ne le partagez pas.<br>
                  Aucun compte n'est requis pour accéder au document.
                </p>
              </div>

              <!-- What you can do section -->
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid advist-bg;">
                <p style="margin: 0 0 15px 0; font-weight: bold; color: advist-navy;">Que pouvez-vous faire ?</p>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding: 8px 0; color: advist-navy; font-size: 14px;">
                      <span style="margin-right: 10px;">👁️</span> Consulter le document
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: advist-navy; font-size: 14px;">
                      <span style="margin-right: 10px;">💬</span> Ajouter des commentaires et annotations
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: advist-navy; font-size: 14px;">
                      <span style="margin-right: 10px;">✍️</span> Signer électroniquement si demandé
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: advist-navy; padding: 25px 30px; text-align: center;">
              <p style="color: #ffffff; font-size: 13px; margin: 0 0 10px 0;">
                Cet email a été envoyé par {{inviter_name}} via ADVIST.
              </p>
              <p style="color: advist-blue-light; font-size: 12px; margin: 0;">
                © 2024 ADVIST. Tous droits réservés.<br>
                Si vous n'attendiez pas cet email, vous pouvez l'ignorer en toute sécurité.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    },
  };

  const handleTestEmail = async () => {
    setIsTesting(true);
    setTestResult(null);
    // Simulate test
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsTesting(false);
    setTestResult('success');
  };

  const encryptionOptions = [
    { value: 'tls', label: 'TLS (Recommandé)', description: 'Port 587' },
    { value: 'ssl', label: 'SSL', description: 'Port 465' },
    { value: 'none', label: 'Aucun', description: 'Port 25 (Non sécurisé)' },
  ];

  return (
    <>
      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveMailTab('config')}
          className={`px-4 py-2 rounded-xl font-medium transition-all ${
            activeMailTab === 'config'
              ? 'bg-advist-dark text-white'
              : 'bg-advist-bg text-advist-gray900 hover:bg-[#E0E0D8]'
          }`}
        >
          {t('settings.mail.tabConfig', 'Configuration')}
        </button>
        <button
          onClick={() => setActiveMailTab('templates')}
          className={`px-4 py-2 rounded-xl font-medium transition-all ${
            activeMailTab === 'templates'
              ? 'bg-advist-dark text-white'
              : 'bg-advist-bg text-advist-gray900 hover:bg-[#E0E0D8]'
          }`}
        >
          {t('settings.mail.tabTemplates', 'Templates & Interface')}
        </button>
      </div>

      {/* Tab: Configuration */}
      {activeMailTab === 'config' && (
        <>
          {/* SMTP Configuration */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Mail size={20} className="text-advist-gray900" />
              <h2 className="text-lg font-semibold text-advist-gray900">
                {t('settings.mail.smtpConfig', 'Configuration SMTP')}
              </h2>
            </div>
            <p className="text-sm text-advist-gray900 mb-6">
              {t(
                'settings.mail.smtpDesc',
                "Configurez le serveur SMTP pour l'envoi des emails de notification"
              )}
            </p>

            <div className="grid md:grid-cols-2 gap-4">
              <Input
                label={t('settings.mail.host', 'Serveur SMTP')}
                value={smtpConfig.host}
                onChange={(e) => setSmtpConfig({ ...smtpConfig, host: e.target.value })}
                placeholder="smtp.example.com"
              />
              <Input
                label={t('settings.mail.port', 'Port')}
                value={smtpConfig.port}
                onChange={(e) => setSmtpConfig({ ...smtpConfig, port: e.target.value })}
                placeholder="587"
              />
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-advist-gray900 mb-2">
                {t('settings.mail.encryption', 'Chiffrement')}
              </label>
              <div className="grid grid-cols-3 gap-3">
                {encryptionOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() =>
                      setSmtpConfig({ ...smtpConfig, encryption: option.value as any })
                    }
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      smtpConfig.encryption === option.value
                        ? 'border-advist-dark bg-advist-dark/5'
                        : 'border-advist-bg hover:border-advist-blue-light'
                    }`}
                  >
                    <p
                      className={`font-medium text-sm ${
                        smtpConfig.encryption === option.value
                          ? 'text-advist-gray900'
                          : 'text-advist-gray900'
                      }`}
                    >
                      {option.label}
                    </p>
                    <p className="text-xs text-advist-blue-light">{option.description}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <Input
                label={t('settings.mail.username', "Nom d'utilisateur")}
                value={smtpConfig.username}
                onChange={(e) => setSmtpConfig({ ...smtpConfig, username: e.target.value })}
                placeholder="user@example.com"
              />
              <div className="relative">
                <Input
                  label={t('settings.mail.password', 'Mot de passe')}
                  type={showPassword ? 'text' : 'password'}
                  value={smtpConfig.password}
                  onChange={(e) => setSmtpConfig({ ...smtpConfig, password: e.target.value })}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-9 text-advist-blue-light hover:text-advist-gray900"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </Card>

          {/* Sender Configuration */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Upload size={20} className="text-advist-gray900" />
              <h2 className="text-lg font-semibold text-advist-gray900">
                {t('settings.mail.senderConfig', "Paramètres d'envoi")}
              </h2>
            </div>
            <p className="text-sm text-advist-gray900 mb-6">
              {t(
                'settings.mail.senderDesc',
                "Configurez les informations de l'expéditeur pour tous les emails sortants"
              )}
            </p>

            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <Input
                  label={t('settings.mail.fromName', "Nom de l'expéditeur")}
                  value={smtpConfig.from_name}
                  onChange={(e) => setSmtpConfig({ ...smtpConfig, from_name: e.target.value })}
                  placeholder="ADVIST"
                />
                <Input
                  label={t('settings.mail.fromEmail', "Email de l'expéditeur")}
                  type="email"
                  value={smtpConfig.from_email}
                  onChange={(e) => setSmtpConfig({ ...smtpConfig, from_email: e.target.value })}
                  placeholder="notifications@advist.com"
                />
              </div>
              <Input
                label={t('settings.mail.replyTo', 'Email de réponse (Reply-To)')}
                type="email"
                value={smtpConfig.reply_to}
                onChange={(e) => setSmtpConfig({ ...smtpConfig, reply_to: e.target.value })}
                placeholder="support@advist.com"
              />
            </div>

            {/* Test Email Button */}
            <div className="mt-6 p-4 bg-advist-bg/30 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-advist-gray900">
                    {t('settings.mail.testConnection', 'Tester la connexion')}
                  </p>
                  <p className="text-sm text-advist-gray900">
                    {t(
                      'settings.mail.testDesc',
                      'Envoyez un email de test pour vérifier la configuration'
                    )}
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowTestModal(true)}
                  leftIcon={<Mail size={16} />}
                >
                  {t('settings.mail.sendTest', 'Envoyer un test')}
                </Button>
              </div>
            </div>
          </Card>

          {/* Save Button for Config tab */}
          <div className="flex justify-end">
            <Button leftIcon={<Save size={16} />}>
              {t('settings.mail.save', 'Enregistrer la configuration')}
            </Button>
          </div>
        </>
      )}

      {/* Tab: Templates & Interface */}
      {activeMailTab === 'templates' && (
        <>
          {/* Email Templates */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <FileText size={20} className="text-advist-gray900" />
              <h2 className="text-lg font-semibold text-advist-gray900">
                {t('settings.mail.templates', "Templates d'email")}
              </h2>
            </div>
            <p className="text-sm text-advist-gray900 mb-6">
              {t(
                'settings.mail.templatesDesc',
                'Activez ou désactivez les types de notifications par email'
              )}
            </p>

            <div className="space-y-3">
              {[
                {
                  key: 'welcome',
                  label: t('settings.mail.template.welcome', 'Email de bienvenue'),
                  description: t(
                    'settings.mail.template.welcomeDesc',
                    'Envoyé aux nouveaux utilisateurs lors de leur inscription'
                  ),
                  icon: UserPlus,
                },
                {
                  key: 'password_reset',
                  label: t(
                    'settings.mail.template.passwordReset',
                    'Réinitialisation de mot de passe'
                  ),
                  description: t(
                    'settings.mail.template.passwordResetDesc',
                    'Envoyé lors des demandes de réinitialisation'
                  ),
                  icon: Key,
                },
                {
                  key: 'document_shared',
                  label: t('settings.mail.template.documentShared', 'Document partagé'),
                  description: t(
                    'settings.mail.template.documentSharedDesc',
                    "Notifie les utilisateurs lorsqu'un document leur est partagé"
                  ),
                  icon: FileText,
                },
                {
                  key: 'workflow_notification',
                  label: t('settings.mail.template.workflow', 'Notification de workflow'),
                  description: t(
                    'settings.mail.template.workflowDesc',
                    'Alertes pour les étapes de validation en attente'
                  ),
                  icon: GitBranch,
                },
                {
                  key: 'signature_request',
                  label: t('settings.mail.template.signature', 'Demande de signature'),
                  description: t(
                    'settings.mail.template.signatureDesc',
                    "Envoyé lorsqu'une signature est requise"
                  ),
                  icon: MessageSquare,
                },
                {
                  key: 'weekly_digest',
                  label: t('settings.mail.template.digest', 'Résumé hebdomadaire'),
                  description: t(
                    'settings.mail.template.digestDesc',
                    "Récapitulatif de l'activité de la semaine"
                  ),
                  icon: Mail,
                },
                {
                  key: 'external_invitation',
                  label: t('settings.mail.template.external', 'Invitation externe'),
                  description: t(
                    'settings.mail.template.externalDesc',
                    'Invitation par lien sécurisé pour utilisateurs externes (consultation, annotation, signature)'
                  ),
                  icon: ExternalLink,
                },
              ].map((template) => (
                <div
                  key={template.key}
                  className="flex items-center justify-between p-4 bg-advist-bg/30 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-xl">
                      <template.icon size={18} className="text-advist-gray900" />
                    </div>
                    <div>
                      <p className="font-medium text-advist-gray900">{template.label}</p>
                      <p className="text-sm text-advist-gray900">{template.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedTemplate(template.key);
                        setShowTemplateModal(true);
                      }}
                      leftIcon={<Eye size={14} />}
                    >
                      {t('settings.mail.preview', 'Prévisualiser')}
                    </Button>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={(emailTemplates as any)[template.key]}
                        onChange={(e) =>
                          setEmailTemplates({ ...emailTemplates, [template.key]: e.target.checked })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-advist-border peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-advist-gold rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-advist-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-advist-dark"></div>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* External Interface Link */}
          <Card className="p-6 bg-gradient-to-r from-primary-50 to-primary-50 border-advist-dark">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-advist-surface-dark rounded-xl">
                  <ExternalLink size={24} className="text-advist-gray900" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-advist-gray900">
                    {t('settings.mail.externalInterface', 'Interface Utilisateur Externe')}
                  </h2>
                  <p className="text-sm text-advist-gray900">
                    {t(
                      'settings.mail.externalInterfaceDesc',
                      "Consultez l'interface que vos utilisateurs externes voient lors de la réception d'un document"
                    )}
                  </p>
                </div>
              </div>
              <Button
                onClick={() => (window.location.href = '/external?from=settings')}
                leftIcon={<ExternalLink size={16} />}
                className="bg-advist-dark hover:bg-advist-dark"
              >
                {t('settings.mail.viewExternalInterface', "Voir l'interface")}
              </Button>
            </div>
          </Card>
        </>
      )}

      {/* Test Email Modal */}
      <Modal
        isOpen={showTestModal}
        onClose={() => {
          setShowTestModal(false);
          setTestResult(null);
        }}
        title={t('settings.mail.testEmail', "Test d'envoi d'email")}
        size="md"
      >
        <div className="space-y-4">
          <Input
            label={t('settings.mail.testRecipient', 'Email de destination')}
            type="email"
            placeholder="test@example.com"
          />

          {testResult === 'success' && (
            <div className="p-4 bg-green-50 rounded-xl border border-advist-success">
              <div className="flex items-center gap-3">
                <Check size={20} className="text-advist-success" />
                <div>
                  <p className="font-medium text-advist-success">
                    {t('settings.mail.testSuccess', 'Email envoyé avec succès')}
                  </p>
                  <p className="text-sm text-advist-success">
                    {t(
                      'settings.mail.testSuccessDesc',
                      'La configuration SMTP fonctionne correctement'
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}

          {testResult === 'error' && (
            <div className="p-4 bg-advist-gold-light rounded-xl border border-advist-gold">
              <div className="flex items-center gap-3">
                <AlertTriangle size={20} className="text-advist-error" />
                <div>
                  <p className="font-medium text-advist-gray900">
                    {t('settings.mail.testError', "Échec de l'envoi")}
                  </p>
                  <p className="text-sm text-advist-error">
                    {t('settings.mail.testErrorDesc', 'Vérifiez vos paramètres SMTP et réessayez')}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="p-3 bg-advist-bg/30 rounded-xl">
            <p className="text-sm text-advist-gray900">
              <strong>{t('settings.mail.currentConfig', 'Configuration actuelle')}:</strong>
              <br />
              {smtpConfig.host}:{smtpConfig.port} ({smtpConfig.encryption.toUpperCase()})<br />
              {t('settings.mail.from', 'De')}: {smtpConfig.from_name} &lt;{smtpConfig.from_email}
              &gt;
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setShowTestModal(false)}>
              {t('common.cancel', 'Annuler')}
            </Button>
            <Button
              onClick={handleTestEmail}
              disabled={isTesting}
              leftIcon={
                isTesting ? <RefreshCw size={16} className="animate-spin" /> : <Mail size={16} />
              }
            >
              {isTesting
                ? t('settings.mail.sending', 'Envoi en cours...')
                : t('settings.mail.send', 'Envoyer')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Template Preview Modal */}
      <Modal
        isOpen={showTemplateModal}
        onClose={() => {
          setShowTemplateModal(false);
          setSelectedTemplate(null);
        }}
        title={
          selectedTemplate
            ? htmlTemplates[selectedTemplate]?.subject ||
              t('settings.mail.templatePreview', 'Aperçu du template')
            : t('settings.mail.templatePreview', 'Aperçu du template')
        }
        size="lg"
      >
        <div className="space-y-4">
          {/* Template Info */}
          {selectedTemplate && (
            <div className="p-3 bg-advist-bg/30 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-advist-gray900">
                    {t('settings.mail.subject', 'Sujet')}:{' '}
                    {htmlTemplates[selectedTemplate]?.subject}
                  </p>
                  <p className="text-xs text-advist-blue-light mt-1">
                    {t(
                      'settings.mail.variablesInfo',
                      "Les variables comme {{user_name}} seront remplacées par les vraies valeurs lors de l'envoi"
                    )}
                  </p>
                </div>
                <Badge variant="secondary" size="sm">
                  HTML
                </Badge>
              </div>
            </div>
          )}

          {/* HTML Preview in iframe */}
          {selectedTemplate && htmlTemplates[selectedTemplate] && (
            <div className="border border-advist-bg rounded-xl overflow-hidden">
              <div className="bg-advist-dark text-white px-4 py-2 flex items-center justify-between">
                <span className="text-sm">
                  {t('settings.mail.emailPreview', "Aperçu de l'email")}
                </span>
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-advist-error"></div>
                  <div className="w-3 h-3 rounded-full bg-advist-gold"></div>
                  <div className="w-3 h-3 rounded-full bg-advist-success"></div>
                </div>
              </div>
              <iframe
                srcDoc={htmlTemplates[selectedTemplate].html}
                className="w-full h-[500px] bg-white"
                title={t('settings.mail.templatePreview', 'Aperçu du template')}
                sandbox="allow-same-origin"
              />
            </div>
          )}

          {/* Variables List */}
          {selectedTemplate && (
            <div className="p-4 bg-advist-gold-light rounded-xl border border-advist-gold">
              <p className="text-sm font-medium text-advist-gray900 mb-2">
                {t('settings.mail.availableVariables', 'Variables disponibles')}:
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedTemplate === 'welcome' && (
                  <>
                    <Badge variant="outline" size="sm">
                      {'{{user_name}}'}
                    </Badge>
                    <Badge variant="outline" size="sm">
                      {'{{user_email}}'}
                    </Badge>
                    <Badge variant="outline" size="sm">
                      {'{{organization_name}}'}
                    </Badge>
                    <Badge variant="outline" size="sm">
                      {'{{login_url}}'}
                    </Badge>
                  </>
                )}
                {selectedTemplate === 'password_reset' && (
                  <>
                    <Badge variant="outline" size="sm">
                      {'{{user_name}}'}
                    </Badge>
                    <Badge variant="outline" size="sm">
                      {'{{reset_url}}'}
                    </Badge>
                  </>
                )}
                {selectedTemplate === 'document_shared' && (
                  <>
                    <Badge variant="outline" size="sm">
                      {'{{user_name}}'}
                    </Badge>
                    <Badge variant="outline" size="sm">
                      {'{{shared_by}}'}
                    </Badge>
                    <Badge variant="outline" size="sm">
                      {'{{document_name}}'}
                    </Badge>
                    <Badge variant="outline" size="sm">
                      {'{{document_type}}'}
                    </Badge>
                    <Badge variant="outline" size="sm">
                      {'{{document_size}}'}
                    </Badge>
                    <Badge variant="outline" size="sm">
                      {'{{share_date}}'}
                    </Badge>
                    <Badge variant="outline" size="sm">
                      {'{{document_url}}'}
                    </Badge>
                  </>
                )}
                {selectedTemplate === 'workflow_notification' && (
                  <>
                    <Badge variant="outline" size="sm">
                      {'{{user_name}}'}
                    </Badge>
                    <Badge variant="outline" size="sm">
                      {'{{workflow_name}}'}
                    </Badge>
                    <Badge variant="outline" size="sm">
                      {'{{document_name}}'}
                    </Badge>
                    <Badge variant="outline" size="sm">
                      {'{{requester_name}}'}
                    </Badge>
                    <Badge variant="outline" size="sm">
                      {'{{current_step}}'}
                    </Badge>
                    <Badge variant="outline" size="sm">
                      {'{{approve_url}}'}
                    </Badge>
                    <Badge variant="outline" size="sm">
                      {'{{reject_url}}'}
                    </Badge>
                  </>
                )}
                {selectedTemplate === 'signature_request' && (
                  <>
                    <Badge variant="outline" size="sm">
                      {'{{user_name}}'}
                    </Badge>
                    <Badge variant="outline" size="sm">
                      {'{{requester_name}}'}
                    </Badge>
                    <Badge variant="outline" size="sm">
                      {'{{document_name}}'}
                    </Badge>
                    <Badge variant="outline" size="sm">
                      {'{{document_type}}'}
                    </Badge>
                    <Badge variant="outline" size="sm">
                      {'{{page_count}}'}
                    </Badge>
                    <Badge variant="outline" size="sm">
                      {'{{deadline}}'}
                    </Badge>
                    <Badge variant="outline" size="sm">
                      {'{{signature_url}}'}
                    </Badge>
                  </>
                )}
                {selectedTemplate === 'weekly_digest' && (
                  <>
                    <Badge variant="outline" size="sm">
                      {'{{user_name}}'}
                    </Badge>
                    <Badge variant="outline" size="sm">
                      {'{{week_start}}'}
                    </Badge>
                    <Badge variant="outline" size="sm">
                      {'{{week_end}}'}
                    </Badge>
                    <Badge variant="outline" size="sm">
                      {'{{documents_count}}'}
                    </Badge>
                    <Badge variant="outline" size="sm">
                      {'{{signatures_count}}'}
                    </Badge>
                    <Badge variant="outline" size="sm">
                      {'{{workflows_completed}}'}
                    </Badge>
                    <Badge variant="outline" size="sm">
                      {'{{pending_actions}}'}
                    </Badge>
                  </>
                )}
                {selectedTemplate === 'external_invitation' && (
                  <>
                    <Badge variant="outline" size="sm">
                      {'{{inviter_name}}'}
                    </Badge>
                    <Badge variant="outline" size="sm">
                      {'{{organization_name}}'}
                    </Badge>
                    <Badge variant="outline" size="sm">
                      {'{{document_name}}'}
                    </Badge>
                    <Badge variant="outline" size="sm">
                      {'{{document_type}}'}
                    </Badge>
                    <Badge variant="outline" size="sm">
                      {'{{permission_view}}'}
                    </Badge>
                    <Badge variant="outline" size="sm">
                      {'{{permission_annotate}}'}
                    </Badge>
                    <Badge variant="outline" size="sm">
                      {'{{permission_sign}}'}
                    </Badge>
                    <Badge variant="outline" size="sm">
                      {'{{expiration_date}}'}
                    </Badge>
                    <Badge variant="outline" size="sm">
                      {'{{expiration_time}}'}
                    </Badge>
                    <Badge variant="outline" size="sm">
                      {'{{secure_link}}'}
                    </Badge>
                  </>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setShowTemplateModal(false)}>
              {t('common.close', 'Fermer')}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

// v2: Data Export Settings
const DataExportSettings: React.FC = () => {
  const { t } = useTranslation();
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportOptions, setExportOptions] = useState({
    format: 'zip' as 'zip' | 'json' | 'xml',
    include_documents: true,
    include_versions: true,
    include_metadata: true,
    include_audit_logs: true,
    include_signatures: true,
  });

  // Mock export history
  const exportHistory: DataExportRequest[] = [
    {
      id: 1,
      status: 'completed',
      export_format: 'zip',
      include_documents: true,
      include_versions: true,
      include_metadata: true,
      include_audit_logs: true,
      include_signatures: true,
      download_url: '/exports/export-001.zip',
      expires_at: '2024-12-05T10:00:00Z',
      created_at: '2024-11-25T10:00:00Z',
      completed_at: '2024-11-25T10:30:00Z',
      file_size: 1536000000, // 1.5 GB
    },
    {
      id: 2,
      status: 'processing',
      export_format: 'json',
      include_documents: false,
      include_versions: false,
      include_metadata: true,
      include_audit_logs: true,
      include_signatures: false,
      created_at: '2024-11-28T09:00:00Z',
    },
  ];

  const formatFileSize = (bytes: number) => {
    if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(2)} GB`;
    if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(2)} MB`;
    return `${(bytes / 1024).toFixed(2)} KB`;
  };

  const statusLabels: Record<string, { label: string; color: string; icon: any }> = {
    pending: {
      label: t('settings.export.pending', 'En attente'),
      color: 'bg-advist-surface-dark text-advist-gray900',
      icon: Clock,
    },
    processing: {
      label: t('settings.export.processing', 'En cours'),
      color: 'bg-advist-gold-light text-advist-gray900',
      icon: RefreshCw,
    },
    completed: {
      label: t('settings.export.completed', 'Terminé'),
      color: 'bg-green-50 text-advist-success',
      icon: Check,
    },
    failed: {
      label: t('settings.export.failed', 'Échoué'),
      color: 'bg-advist-gold-light text-advist-error',
      icon: AlertTriangle,
    },
  };

  return (
    <>
      {/* Data Portability Info */}
      <Card className="p-6 bg-advist-gold-light border-advist-gold">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-advist-gold-light rounded-xl">
            <Shield size={24} className="text-advist-gray900" />
          </div>
          <div>
            <h3 className="font-semibold text-advist-gray900">
              {t('settings.export.dataPortability', 'Portabilité des données')}
            </h3>
            <p className="text-sm text-advist-gray900 mt-1">
              {t(
                'settings.export.portabilityDesc',
                'Conformément au RGPD, vous pouvez exporter toutes vos données dans un format structuré et couramment utilisé.'
              )}
            </p>
          </div>
        </div>
      </Card>

      {/* Request Export */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Download size={20} className="text-advist-gray900" />
            <h2 className="text-lg font-semibold text-advist-gray900">
              {t('settings.export.requestExport', 'Demander un export')}
            </h2>
          </div>
          <Button onClick={() => setShowExportModal(true)} leftIcon={<FileArchive size={16} />}>
            {t('settings.export.newExport', 'Nouvel export')}
          </Button>
        </div>

        <p className="text-sm text-advist-gray900 mb-4">
          {t(
            'settings.export.exportDesc',
            "Exportez vos données d'organisation pour archivage ou migration. Les exports sont disponibles pendant 7 jours."
          )}
        </p>

        {/* What's included */}
        <div className="grid md:grid-cols-2 gap-4 p-4 bg-advist-bg/30 rounded-xl">
          <div>
            <h4 className="font-medium text-advist-gray900 mb-2">
              {t('settings.export.includedData', 'Données incluses')}
            </h4>
            <ul className="space-y-1 text-sm text-advist-gray900">
              <li className="flex items-center gap-2">
                <Check size={14} className="text-advist-success" />{' '}
                {t('settings.export.allDocuments', 'Tous les documents')}
              </li>
              <li className="flex items-center gap-2">
                <Check size={14} className="text-advist-success" />{' '}
                {t('settings.export.allVersions', 'Historique des versions')}
              </li>
              <li className="flex items-center gap-2">
                <Check size={14} className="text-advist-success" />{' '}
                {t('settings.export.metadata', 'Métadonnées')}
              </li>
              <li className="flex items-center gap-2">
                <Check size={14} className="text-advist-success" />{' '}
                {t('settings.export.auditLogs', "Journaux d'audit")}
              </li>
              <li className="flex items-center gap-2">
                <Check size={14} className="text-advist-success" />{' '}
                {t('settings.export.signatures', 'Certificats de signature')}
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-advist-gray900 mb-2">
              {t('settings.export.formats', 'Formats disponibles')}
            </h4>
            <ul className="space-y-1 text-sm text-advist-gray900">
              <li className="flex items-center gap-2">
                <FileArchive size={14} className="text-advist-gray900" /> ZIP (documents +
                métadonnées JSON)
              </li>
              <li className="flex items-center gap-2">
                <FileText size={14} className="text-advist-gray900" /> JSON (métadonnées uniquement)
              </li>
              <li className="flex items-center gap-2">
                <FileText size={14} className="text-advist-gray900" /> XML (métadonnées uniquement)
              </li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Export History */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Clock size={20} className="text-advist-gray900" />
          <h2 className="text-lg font-semibold text-advist-gray900">
            {t('settings.export.history', 'Historique des exports')}
          </h2>
        </div>

        <div className="space-y-3">
          {exportHistory.map((exportReq) => {
            const status = statusLabels[exportReq.status];
            const StatusIcon = status.icon;

            return (
              <div
                key={exportReq.id}
                className="flex items-center justify-between p-4 border border-advist-bg rounded-xl"
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-xl ${status.color}`}>
                    <StatusIcon
                      size={20}
                      className={exportReq.status === 'processing' ? 'animate-spin' : ''}
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-advist-gray900">Export #{exportReq.id}</p>
                      <Badge className={status.color} size="sm">
                        {status.label}
                      </Badge>
                      <Badge variant="outline" size="sm">
                        {exportReq.export_format.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-sm text-advist-gray900">
                      {t('settings.export.requested', 'Demandé le')}{' '}
                      {new Date(exportReq.created_at).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      {exportReq.file_size && ` • ${formatFileSize(exportReq.file_size)}`}
                    </p>
                    {exportReq.expires_at && exportReq.status === 'completed' && (
                      <p className="text-xs text-advist-gold-dark">
                        {t('settings.export.expiresOn', 'Expire le')}{' '}
                        {new Date(exportReq.expires_at).toLocaleDateString('fr-FR')}
                      </p>
                    )}
                  </div>
                </div>
                {exportReq.status === 'completed' && exportReq.download_url && (
                  <Button variant="outline" size="sm" leftIcon={<Download size={14} />}>
                    {t('settings.export.download', 'Télécharger')}
                  </Button>
                )}
              </div>
            );
          })}

          {exportHistory.length === 0 && (
            <div className="text-center py-8 text-advist-blue-light">
              <FileArchive size={48} className="mx-auto mb-2 opacity-50" />
              <p>{t('settings.export.noHistory', 'Aucun export effectué')}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Export Modal */}
      <Modal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        title={t('settings.export.newExport', 'Nouvel export')}
        size="md"
      >
        <div className="space-y-4">
          {/* Format selection */}
          <div>
            <label className="block text-sm font-medium text-advist-gray900 mb-2">
              {t('settings.export.format', 'Format')}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['zip', 'json', 'xml'].map((format) => (
                <button
                  key={format}
                  onClick={() => setExportOptions({ ...exportOptions, format: format as any })}
                  className={`p-3 rounded-xl border-2 text-center transition-all ${
                    exportOptions.format === format
                      ? 'border-advist-dark bg-advist-dark/5'
                      : 'border-advist-bg hover:border-advist-blue-light'
                  }`}
                >
                  <FileArchive
                    size={20}
                    className={`mx-auto mb-1 ${
                      exportOptions.format === format
                        ? 'text-advist-gray900'
                        : 'text-advist-blue-light'
                    }`}
                  />
                  <span
                    className={`text-sm font-medium ${
                      exportOptions.format === format
                        ? 'text-advist-gray900'
                        : 'text-advist-gray900'
                    }`}
                  >
                    {format.toUpperCase()}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Options */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-advist-gray900">
              {t('settings.export.options', 'Options')}
            </label>
            {[
              {
                key: 'include_documents',
                label: t('settings.export.includeDocuments', 'Inclure les documents'),
              },
              {
                key: 'include_versions',
                label: t('settings.export.includeVersions', 'Inclure les versions'),
              },
              {
                key: 'include_metadata',
                label: t('settings.export.includeMetadata', 'Inclure les métadonnées'),
              },
              {
                key: 'include_audit_logs',
                label: t('settings.export.includeAuditLogs', "Inclure les journaux d'audit"),
              },
              {
                key: 'include_signatures',
                label: t(
                  'settings.export.includeSignatures',
                  'Inclure les certificats de signature'
                ),
              },
            ].map((option) => (
              <label
                key={option.key}
                className="flex items-center gap-3 p-3 bg-advist-bg/30 rounded-xl cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={(exportOptions as any)[option.key]}
                  onChange={(e) =>
                    setExportOptions({ ...exportOptions, [option.key]: e.target.checked })
                  }
                  className="rounded border-advist-border text-advist-gray900 focus:ring-advist-gold"
                  disabled={
                    option.key !== 'include_documents' &&
                    option.key !== 'include_versions' &&
                    exportOptions.format !== 'zip'
                  }
                />
                <span className="text-sm text-advist-gray900">{option.label}</span>
              </label>
            ))}
          </div>

          {/* Warning */}
          <div className="p-3 bg-advist-gold-light rounded-xl border border-advist-gold">
            <p className="text-sm text-advist-gold-dark">
              {t(
                'settings.export.warning',
                "L'export peut prendre plusieurs minutes selon la quantité de données. Vous recevrez une notification lorsqu'il sera prêt."
              )}
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setShowExportModal(false)}>
              {t('common.cancel', 'Annuler')}
            </Button>
            <Button leftIcon={<Download size={16} />}>
              {t('settings.export.startExport', "Démarrer l'export")}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default SettingsPage;
