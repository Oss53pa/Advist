import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Building2,
  Users,
  Shield,
  Globe,
  Mail,
  Phone,
  MapPin,
  Clock,
  Save,
  Upload,
  Key,
  Lock,
  Bell,
  FileText,
  Settings,
  CreditCard,
  CheckCircle,
  Loader2,
  AlertTriangle,
  Check,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

interface OrganizationSettings {
  name: string;
  slug: string;
  logo?: string;
  description: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  timezone: string;
  language: string;
  website?: string;
}

interface SecuritySettings {
  two_factor_enabled: boolean;
  password_min_length: number;
  password_require_special: boolean;
  session_timeout: number;
  ip_whitelist: string[];
}

interface NotificationSettings {
  email_notifications: boolean;
  workflow_updates: boolean;
  document_updates: boolean;
  signature_requests: boolean;
  weekly_summary: boolean;
}

export const OrganizationPage: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'general' | 'security' | 'notifications' | 'billing'>('general');

  const tabs = [
    { id: 'general', label: t('organization.general'), icon: Building2 },
    { id: 'security', label: t('organization.security'), icon: Shield },
    { id: 'notifications', label: t('organization.notifications'), icon: Bell },
    { id: 'billing', label: t('organization.billing'), icon: CreditCard },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-advist-gray900">{t('organization.title')}</h1>
        <p className="text-advist-gray900 mt-1">
          {t('organization.subtitle')}
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-advist-bg">
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all duration-240
                ${activeTab === tab.id
                  ? 'border-advist-dark text-advist-gray900'
                  : 'border-transparent text-advist-gray900 hover:text-advist-gray900'
                }
              `}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'general' && <GeneralSettings />}
      {activeTab === 'security' && <SecuritySettingsTab />}
      {activeTab === 'notifications' && <NotificationSettingsTab />}
      {activeTab === 'billing' && <BillingSettings />}
    </div>
  );
};

// General Settings Tab
const GeneralSettings: React.FC = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<OrganizationSettings>({
    name: 'ADVIST Demo',
    slug: 'advist-demo',
    description: 'Entreprise de demonstration pour la plateforme ADVIST',
    email: 'contact@advist-demo.com',
    phone: '+33 1 23 45 67 89',
    address: '123 Avenue des Champs-Elysees',
    city: 'Paris',
    country: 'France',
    timezone: 'Europe/Paris',
    language: 'fr',
    website: 'https://advist-demo.com',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);
    try {
      // Simulate API call - replace with actual API
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSaveMessage({ type: 'success', text: t('common.saveSuccess') });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      setSaveMessage({ type: 'error', text: t('common.saveError') });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Logo and Basic Info */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-advist-gray900 mb-4">
          {t('organization.generalInfo')}
        </h2>
        <div className="flex flex-col md:flex-row gap-6">
          {/* Logo Upload */}
          <div className="flex-shrink-0">
            <div className="w-32 h-32 bg-advist-bg rounded-xl flex items-center justify-center border-2 border-dashed border-advist-blue-light">
              <div className="text-center">
                <Building2 size={32} className="mx-auto text-advist-blue-light" />
                <p className="text-xs text-advist-blue-light mt-1">Logo</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="w-full mt-2">
              <Upload size={14} className="mr-1" />
              {t('common.change')}
            </Button>
          </div>

          {/* Form Fields */}
          <div className="flex-1 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label={t('organization.info.name')}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              <Input
                label={t('organization.slug')}
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                disabled
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-advist-gray900 mb-1">
                {t('organization.info.description')}
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-advist-bg rounded-xl focus:outline-none focus:ring-2 focus:ring-advist-gold resize-none"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Contact Information */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-advist-gray900 mb-4">
          {t('organization.contactInfo')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Mail size={16} className="absolute left-3 top-9 text-advist-blue-light" />
            <Input
              label={t('organization.info.email')}
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="pl-10"
            />
          </div>
          <div className="relative">
            <Phone size={16} className="absolute left-3 top-9 text-advist-blue-light" />
            <Input
              label={t('organization.info.phone')}
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="pl-10"
            />
          </div>
          <div className="relative">
            <Globe size={16} className="absolute left-3 top-9 text-advist-blue-light" />
            <Input
              label={t('organization.info.website')}
              type="url"
              value={formData.website || ''}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              className="pl-10"
            />
          </div>
          <div className="relative">
            <MapPin size={16} className="absolute left-3 top-9 text-advist-blue-light" />
            <Input
              label={t('organization.info.address')}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="pl-10"
            />
          </div>
          <Input
            label={t('organization.city')}
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
          />
          <div>
            <label className="block text-sm font-medium text-advist-gray900 mb-1">
              {t('settings.regional.country')}
            </label>
            <select
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              className="w-full px-3 py-2 border border-advist-bg rounded-xl focus:outline-none focus:ring-2 focus:ring-advist-gold"
            >
              <optgroup label="Afrique de l'Ouest (UEMOA)">
                <option value="Senegal">Senegal</option>
                <option value="Cote d'Ivoire">Cote d'Ivoire</option>
                <option value="Mali">Mali</option>
                <option value="Burkina Faso">Burkina Faso</option>
                <option value="Niger">Niger</option>
                <option value="Togo">Togo</option>
                <option value="Benin">Benin</option>
                <option value="Guinee-Bissau">Guinee-Bissau</option>
              </optgroup>
              <optgroup label="Afrique Centrale (CEMAC)">
                <option value="Cameroun">Cameroun</option>
                <option value="Gabon">Gabon</option>
                <option value="Congo">Congo</option>
                <option value="Tchad">Tchad</option>
                <option value="Centrafrique">Centrafrique</option>
                <option value="Guinee equatoriale">Guinee equatoriale</option>
              </optgroup>
              <optgroup label="Autres pays africains">
                <option value="Maroc">Maroc</option>
                <option value="Algerie">Algerie</option>
                <option value="Tunisie">Tunisie</option>
                <option value="Guinee">Guinee</option>
                <option value="Mauritanie">Mauritanie</option>
                <option value="RD Congo">RD Congo</option>
                <option value="Rwanda">Rwanda</option>
                <option value="Burundi">Burundi</option>
                <option value="Madagascar">Madagascar</option>
                <option value="Maurice">Maurice</option>
                <option value="Seychelles">Seychelles</option>
                <option value="Comores">Comores</option>
                <option value="Djibouti">Djibouti</option>
              </optgroup>
              <optgroup label="Europe">
                <option value="France">France</option>
                <option value="Belgique">Belgique</option>
                <option value="Suisse">Suisse</option>
                <option value="Luxembourg">Luxembourg</option>
                <option value="Monaco">Monaco</option>
              </optgroup>
              <optgroup label="Amerique">
                <option value="Canada">Canada</option>
                <option value="Haiti">Haiti</option>
              </optgroup>
            </select>
          </div>
        </div>
      </Card>

      {/* Regional Settings */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-advist-gray900 mb-4">
          {t('settings.regional.title')}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Currency */}
          <div>
            <label className="block text-sm font-medium text-advist-gray900 mb-1">
              {t('settings.regional.currency')}
            </label>
            <select
              value={(formData as any).currency || 'XOF'}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value } as any)}
              className="w-full px-3 py-2 border border-advist-bg rounded-xl focus:outline-none focus:ring-2 focus:ring-advist-gold"
            >
              <optgroup label="Devises principales">
                <option value="XOF">FCFA (XOF) - Afrique de l'Ouest</option>
                <option value="XAF">FCFA (XAF) - Afrique Centrale</option>
                <option value="EUR">Euro (EUR)</option>
              </optgroup>
              <optgroup label="Autres devises">
                <option value="USD">Dollar US (USD)</option>
                <option value="MAD">Dirham marocain (MAD)</option>
                <option value="DZD">Dinar algerien (DZD)</option>
                <option value="TND">Dinar tunisien (TND)</option>
                <option value="GNF">Franc guineen (GNF)</option>
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

          {/* Language */}
          <div>
            <label className="block text-sm font-medium text-advist-gray900 mb-1">
              {t('settings.regional.language')}
            </label>
            <select
              value={formData.language}
              onChange={(e) => setFormData({ ...formData, language: e.target.value })}
              className="w-full px-3 py-2 border border-advist-bg rounded-xl focus:outline-none focus:ring-2 focus:ring-advist-gold"
            >
              <option value="fr">Francais</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Timezone */}
          <div>
            <label className="block text-sm font-medium text-advist-gray900 mb-1">
              {t('settings.regional.timezone')}
            </label>
            <select
              value={formData.timezone}
              onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
              className="w-full px-3 py-2 border border-advist-bg rounded-xl focus:outline-none focus:ring-2 focus:ring-advist-gold"
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
                <option value="Europe/Zurich">Zurich, Geneve (GMT+1/+2)</option>
              </optgroup>
              <optgroup label="Amerique">
                <option value="America/New_York">New York, Montreal (GMT-5/-4)</option>
                <option value="America/Port-au-Prince">Port-au-Prince (GMT-5/-4)</option>
              </optgroup>
            </select>
          </div>

          {/* Date Format */}
          <div>
            <label className="block text-sm font-medium text-advist-gray900 mb-1">
              {t('settings.regional.dateFormat')}
            </label>
            <select
              value={(formData as any).dateFormat || 'DD/MM/YYYY'}
              onChange={(e) => setFormData({ ...formData, dateFormat: e.target.value } as any)}
              className="w-full px-3 py-2 border border-advist-bg rounded-xl focus:outline-none focus:ring-2 focus:ring-advist-gold"
            >
              <option value="DD/MM/YYYY">31/12/2024 (DD/MM/YYYY)</option>
              <option value="MM/DD/YYYY">12/31/2024 (MM/DD/YYYY)</option>
              <option value="YYYY-MM-DD">2024-12-31 (YYYY-MM-DD)</option>
            </select>
          </div>
        </div>

        {/* Number Format */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-advist-gray900 mb-1">
              {t('organization.numberFormat')}
            </label>
            <select
              value={(formData as any).numberFormat || 'fr'}
              onChange={(e) => setFormData({ ...formData, numberFormat: e.target.value } as any)}
              className="w-full px-3 py-2 border border-advist-bg rounded-xl focus:outline-none focus:ring-2 focus:ring-advist-gold"
            >
              <option value="fr">1 234 567,89 (Francais)</option>
              <option value="en">1,234,567.89 (Anglais)</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Save Message */}
      {saveMessage && (
        <div className={`p-4 rounded-xl flex items-center gap-3 ${
          saveMessage.type === 'success'
            ? 'bg-green-50 border border-advist-success text-advist-success'
            : 'bg-advist-gold-light border border-advist-gold text-advist-error'
        }`}>
          {saveMessage.type === 'success' ? <Check size={18} /> : <AlertTriangle size={18} />}
          {saveMessage.text}
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 size={16} className="mr-2 animate-spin" />
              {t('documents.saving')}
            </>
          ) : (
            <>
              <Save size={16} className="mr-2" />
              {t('users.saveChanges')}
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

// Security Settings Tab
const SecuritySettingsTab: React.FC = () => {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<SecuritySettings>({
    two_factor_enabled: true,
    password_min_length: 12,
    password_require_special: true,
    session_timeout: 30,
    ip_whitelist: [],
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);
    try {
      // Simulate API call - replace with actual API
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSaveMessage({ type: 'success', text: t('organization.securitySaved') });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      setSaveMessage({ type: 'error', text: t('common.saveError') });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Two-Factor Authentication */}
      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-green-50 rounded-xl">
              <Shield size={24} className="text-advist-success" />
            </div>
            <div>
              <h3 className="font-semibold text-advist-gray900">
                {t('settings.security.twoFactor')}
              </h3>
              <p className="text-sm text-advist-gray900 mt-1">
                {t('organization.twoFactorRequire')}
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.two_factor_enabled}
              onChange={(e) =>
                setSettings({ ...settings, two_factor_enabled: e.target.checked })
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-advist-border peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-advist-gold rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-advist-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-advist-dark"></div>
          </label>
        </div>
      </Card>

      {/* Password Policy */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-advist-gray900 mb-4 flex items-center gap-2">
          <Key size={20} />
          {t('organization.passwordPolicy')}
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-advist-gray900 mb-1">
              {t('organization.minLength')}
            </label>
            <select
              value={settings.password_min_length}
              onChange={(e) =>
                setSettings({ ...settings, password_min_length: parseInt(e.target.value) })
              }
              className="w-full md:w-64 px-3 py-2 border border-advist-bg rounded-xl focus:outline-none focus:ring-2 focus:ring-advist-gold"
            >
              <option value={8}>{t('organization.characters', { count: 8 })}</option>
              <option value={10}>{t('organization.characters', { count: 10 })}</option>
              <option value={12}>{t('organization.characters', { count: 12 })}</option>
              <option value={16}>{t('organization.characters', { count: 16 })}</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="special_chars"
              checked={settings.password_require_special}
              onChange={(e) =>
                setSettings({ ...settings, password_require_special: e.target.checked })
              }
              className="w-4 h-4 rounded border-advist-bg text-advist-gray900 focus:ring-advist-gold"
            />
            <label htmlFor="special_chars" className="text-sm text-advist-gray900">
              {t('organization.requireSpecialChars')}
            </label>
          </div>
        </div>
      </Card>

      {/* Session Settings */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-advist-gray900 mb-4 flex items-center gap-2">
          <Clock size={20} />
          {t('organization.session')}
        </h2>
        <div>
          <label className="block text-sm font-medium text-advist-gray900 mb-1">
            {t('organization.sessionTimeout')}
          </label>
          <select
            value={settings.session_timeout}
            onChange={(e) =>
              setSettings({ ...settings, session_timeout: parseInt(e.target.value) })
            }
            className="w-full md:w-64 px-3 py-2 border border-advist-bg rounded-xl focus:outline-none focus:ring-2 focus:ring-advist-gold"
          >
            <option value={15}>{t('organization.minutes', { count: 15 })}</option>
            <option value={30}>{t('organization.minutes', { count: 30 })}</option>
            <option value={60}>{t('organization.hour', { count: 1 })}</option>
            <option value={120}>{t('organization.hours', { count: 2 })}</option>
            <option value={480}>{t('organization.hours', { count: 8 })}</option>
          </select>
          <p className="text-xs text-advist-blue-light mt-1">
            {t('organization.sessionTimeoutDesc')}
          </p>
        </div>
      </Card>

      {/* IP Whitelist */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-advist-gray900 mb-4 flex items-center gap-2">
          <Lock size={20} />
          {t('organization.ipWhitelist')}
        </h2>
        <p className="text-sm text-advist-gray900 mb-4">
          {t('organization.ipWhitelistDesc')}
        </p>
        <div className="flex gap-2">
          <Input placeholder="Ex: 192.168.1.0/24" className="flex-1" />
          <Button variant="outline">{t('common.add')}</Button>
        </div>
        {settings.ip_whitelist.length === 0 && (
          <p className="text-sm text-advist-blue-light mt-3">
            {t('organization.noIpRestriction')}
          </p>
        )}
      </Card>

      {/* Save Message */}
      {saveMessage && (
        <div className={`p-4 rounded-xl flex items-center gap-3 ${
          saveMessage.type === 'success'
            ? 'bg-green-50 border border-advist-success text-advist-success'
            : 'bg-advist-gold-light border border-advist-gold text-advist-error'
        }`}>
          {saveMessage.type === 'success' ? <Check size={18} /> : <AlertTriangle size={18} />}
          {saveMessage.text}
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 size={16} className="mr-2 animate-spin" />
              {t('documents.saving')}
            </>
          ) : (
            <>
              <Save size={16} className="mr-2" />
              {t('users.saveChanges')}
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

// Notification Settings Tab
const NotificationSettingsTab: React.FC = () => {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<NotificationSettings>({
    email_notifications: true,
    workflow_updates: true,
    document_updates: true,
    signature_requests: true,
    weekly_summary: false,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);
    try {
      // Simulate API call - replace with actual API
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSaveMessage({ type: 'success', text: t('organization.notificationsSaved') });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      setSaveMessage({ type: 'error', text: t('common.saveError') });
    } finally {
      setIsSaving(false);
    }
  };

  const notificationOptions = [
    {
      key: 'email_notifications',
      label: t('organization.emailNotifications'),
      description: t('organization.emailNotificationsDesc'),
      icon: Mail,
    },
    {
      key: 'workflow_updates',
      label: t('organization.workflowUpdates'),
      description: t('organization.workflowUpdatesDesc'),
      icon: Settings,
    },
    {
      key: 'document_updates',
      label: t('organization.documentUpdates'),
      description: t('organization.documentUpdatesDesc'),
      icon: FileText,
    },
    {
      key: 'signature_requests',
      label: t('organization.signatureRequests'),
      description: t('organization.signatureRequestsDesc'),
      icon: CheckCircle,
    },
    {
      key: 'weekly_summary',
      label: t('organization.weeklySummary'),
      description: t('organization.weeklySummaryDesc'),
      icon: Clock,
    },
  ] as const;

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-advist-gray900 mb-4">
          {t('notifications.settings')}
        </h2>
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
                  checked={settings[option.key]}
                  onChange={(e) =>
                    setSettings({ ...settings, [option.key]: e.target.checked })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-advist-border peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-advist-gold rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-advist-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-advist-dark"></div>
              </label>
            </div>
          ))}
        </div>
      </Card>

      {/* Save Message */}
      {saveMessage && (
        <div className={`p-4 rounded-xl flex items-center gap-3 ${
          saveMessage.type === 'success'
            ? 'bg-green-50 border border-advist-success text-advist-success'
            : 'bg-advist-gold-light border border-advist-gold text-advist-error'
        }`}>
          {saveMessage.type === 'success' ? <Check size={18} /> : <AlertTriangle size={18} />}
          {saveMessage.text}
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 size={16} className="mr-2 animate-spin" />
              {t('documents.saving')}
            </>
          ) : (
            <>
              <Save size={16} className="mr-2" />
              {t('users.saveChanges')}
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

// Billing Settings Tab
const BillingSettings: React.FC = () => {
  const { t } = useTranslation();
  const currentPlan = {
    name: 'Business',
    price: 49,
    period: t('organization.perMonth'),
    features: [
      t('organization.features.unlimitedUsers'),
      t('organization.features.storage100gb'),
      t('organization.features.advancedWorkflows'),
      t('organization.features.eSignatures'),
      t('organization.features.prioritySupport'),
      t('organization.features.apiAccess'),
    ],
  };

  const invoices = [
    { id: 'INV-2024-011', date: '2024-11-01', amount: 49, status: 'paid' },
    { id: 'INV-2024-010', date: '2024-10-01', amount: 49, status: 'paid' },
    { id: 'INV-2024-009', date: '2024-09-01', amount: 49, status: 'paid' },
  ];

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-advist-gray900">{t('settings.plan.current')}</h2>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-bold text-advist-gray900">
                {currentPlan.price}€
              </span>
              <span className="text-advist-gray900">/ {currentPlan.period}</span>
            </div>
            <Badge variant="green" className="mt-2">
              {currentPlan.name}
            </Badge>
          </div>
          <Button variant="outline">{t('organization.changePlan')}</Button>
        </div>

        <div className="mt-6">
          <h3 className="text-sm font-medium text-advist-gray900 mb-3">
            {t('organization.includedFeatures')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {currentPlan.features.map((feature, index) => (
              <div key={index} className="flex items-center gap-2 text-sm text-advist-gray900">
                <CheckCircle size={16} className="text-advist-success" />
                {feature}
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Payment Method */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-advist-gray900 mb-4">
          {t('organization.paymentMethod')}
        </h2>
        <div className="flex items-center justify-between p-4 bg-advist-bg/30 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-12 h-8 bg-gradient-to-r from-primary-900 to-primary-800 rounded flex items-center justify-center">
              <span className="text-white text-xs font-bold">VISA</span>
            </div>
            <div>
              <p className="font-medium text-advist-gray900">**** **** **** 4242</p>
              <p className="text-sm text-advist-gray900">{t('organization.expires')} 12/2025</p>
            </div>
          </div>
          <Button variant="outline" size="sm">
            {t('common.edit')}
          </Button>
        </div>
      </Card>

      {/* Invoices */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-advist-gray900 mb-4">
          {t('organization.invoiceHistory')}
        </h2>
        <div className="space-y-2">
          {invoices.map((invoice) => (
            <div
              key={invoice.id}
              className="flex items-center justify-between p-3 hover:bg-advist-bg/30 rounded-xl transition-all duration-240"
            >
              <div className="flex items-center gap-4">
                <FileText size={20} className="text-advist-gray900" />
                <div>
                  <p className="font-medium text-advist-gray900">{invoice.id}</p>
                  <p className="text-sm text-advist-gray900">
                    {new Date(invoice.date).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-medium text-advist-gray900">{invoice.amount}€</span>
                <Badge variant="green" size="sm">
                  {t('organization.paid')}
                </Badge>
                <Button variant="ghost" size="sm">
                  {t('common.download')}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default OrganizationPage;
