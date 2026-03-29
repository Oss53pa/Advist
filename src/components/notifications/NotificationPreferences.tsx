import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Bell,
  Mail,
  MessageCircle,
  Smartphone,
  Phone,
  Check,
  X,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  PenTool,
  Calendar,
  Shield,
  Moon,
  Send,
  Globe,
  ChevronDown,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { notificationsService } from '../../services/notifications';
import type { NotificationPreferences, NotificationChannel } from '../../types';
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '../../services/translation';

interface NotificationPreferencesProps {
  onSave?: () => void;
}

const CHANNEL_ICONS: Record<NotificationChannel, React.ReactNode> = {
  in_app: <Bell size={18} />,
  email: <Mail size={18} />,
  push: <Smartphone size={18} />,
  whatsapp: <MessageCircle size={18} className="text-advist-success" />,
  sms: <Phone size={18} />,
};

const CHANNEL_LABELS: Record<NotificationChannel, string> = {
  in_app: 'Application',
  email: 'Email',
  push: 'Push',
  whatsapp: 'WhatsApp',
  sms: 'SMS',
};

const DEFAULT_PREFERENCES: NotificationPreferences = {
  email_enabled: true,
  push_enabled: false,
  whatsapp_enabled: false,
  sms_enabled: false,
  workflow_updates: ['in_app', 'email'],
  document_comments: ['in_app'],
  signature_requests: ['in_app', 'email'],
  deadline_reminders: ['in_app', 'email'],
  system_alerts: ['in_app'],
  quiet_hours_enabled: false,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
};

export const NotificationPreferences: React.FC<NotificationPreferencesProps> = ({ onSave }) => {
  const { t } = useTranslation();
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [isVerifyingWhatsApp, setIsVerifyingWhatsApp] = useState(false);
  const [whatsappVerified, setWhatsappVerified] = useState(false);
  const [testingChannel, setTestingChannel] = useState<NotificationChannel | null>(null);
  const [notificationLanguage, setNotificationLanguage] = useState<SupportedLanguage>('fr');
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    setIsLoading(true);
    try {
      const prefs = await notificationsService.getPreferences();
      setPreferences(prefs);
      if (prefs.whatsapp_number) {
        setWhatsappNumber(prefs.whatsapp_number);
        setWhatsappVerified(true);
      }
    } catch (err) {
      console.error('Failed to load preferences:', err);
      // Use defaults on error
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(false);

    try {
      await notificationsService.updatePreferences({
        ...preferences,
        whatsapp_number: whatsappVerified ? whatsappNumber : undefined,
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      onSave?.();
    } catch (err) {
      console.error('Failed to save preferences:', err);
      setError('Impossible de sauvegarder les préférences');
    } finally {
      setIsSaving(false);
    }
  };

  const handleVerifyWhatsApp = async () => {
    if (!whatsappNumber) return;

    setIsVerifyingWhatsApp(true);
    try {
      const result = await notificationsService.whatsapp.verifyPhoneNumber(whatsappNumber);
      if (result.valid) {
        setWhatsappNumber(result.formatted);
        setWhatsappVerified(true);
        setPreferences(prev => ({ ...prev, whatsapp_enabled: true }));
      } else {
        setError('Numéro WhatsApp invalide');
      }
    } catch (err) {
      setError('Erreur de vérification WhatsApp');
    } finally {
      setIsVerifyingWhatsApp(false);
    }
  };

  const handleTestChannel = async (channel: NotificationChannel) => {
    setTestingChannel(channel);
    try {
      const result = await notificationsService.testChannel(channel);
      if (!result.success) {
        setError(result.error || `Échec du test ${CHANNEL_LABELS[channel]}`);
      }
    } catch (err) {
      setError(`Erreur lors du test ${CHANNEL_LABELS[channel]}`);
    } finally {
      setTestingChannel(null);
    }
  };

  const toggleChannelForType = (
    type: keyof Pick<NotificationPreferences, 'workflow_updates' | 'document_comments' | 'signature_requests' | 'deadline_reminders' | 'system_alerts'>,
    channel: NotificationChannel
  ) => {
    setPreferences(prev => {
      const current = prev[type] || [];
      const updated = current.includes(channel)
        ? current.filter(c => c !== channel)
        : [...current, channel];
      return { ...prev, [type]: updated };
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={32} className="animate-spin text-advist-blue-light" />
      </div>
    );
  }

  const notificationTypes = [
    {
      key: 'workflow_updates' as const,
      icon: <Clock size={20} />,
      title: 'Mises à jour workflows',
      description: 'Validations en attente, approbations, rejets',
    },
    {
      key: 'document_comments' as const,
      icon: <FileText size={20} />,
      title: 'Commentaires documents',
      description: 'Nouveaux commentaires et annotations',
    },
    {
      key: 'signature_requests' as const,
      icon: <PenTool size={20} />,
      title: 'Demandes de signature',
      description: 'Documents à signer',
    },
    {
      key: 'deadline_reminders' as const,
      icon: <Calendar size={20} />,
      title: 'Rappels échéances',
      description: 'J-90, J-30, J-7, J-1 avant échéance',
    },
    {
      key: 'system_alerts' as const,
      icon: <Shield size={20} />,
      title: 'Alertes système',
      description: 'Sécurité, maintenance, mises à jour',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Error/Success Messages */}
      {error && (
        <div className="p-4 bg-advist-gold-light border border-advist-gold rounded-xl flex items-center gap-3">
          <AlertCircle size={20} className="text-advist-error" />
          <p className="text-advist-error">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto">
            <X size={18} className="text-advist-error" />
          </button>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-advist-success rounded-xl flex items-center gap-3">
          <CheckCircle size={20} className="text-advist-success" />
          <p className="text-advist-success">Préférences sauvegardées avec succès</p>
        </div>
      )}

      {/* Channels Configuration */}
      <div className="bg-white rounded-xl border border-advist-bg p-6">
        <h3 className="text-lg font-semibold text-advist-gray900 mb-4">Canaux de notification</h3>

        <div className="space-y-4">
          {/* Email */}
          <div className="flex items-center justify-between p-4 bg-advist-bg rounded-xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-lg">
                <Mail size={20} className="text-advist-gray900" />
              </div>
              <div>
                <p className="font-medium text-advist-gray900">Email</p>
                <p className="text-sm text-advist-blue-light">{preferences.email_address || 'Non configuré'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleTestChannel('email')}
                disabled={testingChannel === 'email'}
              >
                {testingChannel === 'email' ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              </Button>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.email_enabled}
                  onChange={(e) => setPreferences(prev => ({ ...prev, email_enabled: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-advist-border peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-advist-blue-light/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-advist-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-advist-dark"></div>
              </label>
            </div>
          </div>

          {/* WhatsApp */}
          <div className="p-4 bg-advist-bg rounded-xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-advist-success rounded-lg">
                  <MessageCircle size={20} className="text-white" />
                </div>
                <div>
                  <p className="font-medium text-advist-gray900">WhatsApp</p>
                  <p className="text-sm text-advist-blue-light">
                    {whatsappVerified ? whatsappNumber : 'Recevoir des notifications WhatsApp'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {whatsappVerified && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleTestChannel('whatsapp')}
                    disabled={testingChannel === 'whatsapp'}
                  >
                    {testingChannel === 'whatsapp' ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  </Button>
                )}
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.whatsapp_enabled && whatsappVerified}
                    onChange={(e) => setPreferences(prev => ({ ...prev, whatsapp_enabled: e.target.checked }))}
                    disabled={!whatsappVerified}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-advist-border peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-green-500/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-advist-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-advist-success peer-disabled:opacity-50"></div>
                </label>
              </div>
            </div>

            {!whatsappVerified && (
              <div className="flex gap-2 mt-3">
                <div className="flex-1 relative">
                  <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-advist-blue-light" />
                  <input
                    type="tel"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    placeholder="+225 07 XX XX XX XX"
                    className="w-full pl-10 pr-4 py-2 bg-white border border-advist-border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/30"
                  />
                </div>
                <Button
                  onClick={handleVerifyWhatsApp}
                  disabled={isVerifyingWhatsApp || !whatsappNumber}
                  className="bg-advist-success hover:bg-advist-success"
                >
                  {isVerifyingWhatsApp ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <>
                      <Check size={16} className="mr-1" />
                      Vérifier
                    </>
                  )}
                </Button>
              </div>
            )}

            {whatsappVerified && (
              <div className="flex items-center gap-2 mt-2 text-sm text-advist-success">
                <CheckCircle size={14} />
                Numéro vérifié
                <button
                  onClick={() => {
                    setWhatsappVerified(false);
                    setPreferences(prev => ({ ...prev, whatsapp_enabled: false }));
                  }}
                  className="ml-auto text-advist-blue-light hover:text-advist-error"
                >
                  Modifier
                </button>
              </div>
            )}
          </div>

          {/* SMS */}
          <div className="flex items-center justify-between p-4 bg-advist-bg rounded-xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-lg">
                <Smartphone size={20} className="text-advist-gray900" />
              </div>
              <div>
                <p className="font-medium text-advist-gray900">SMS</p>
                <p className="text-sm text-advist-blue-light">{preferences.sms_number || 'Non configuré'}</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.sms_enabled}
                onChange={(e) => setPreferences(prev => ({ ...prev, sms_enabled: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-advist-border peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-advist-blue-light/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-advist-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-advist-dark"></div>
            </label>
          </div>

          {/* Push */}
          <div className="flex items-center justify-between p-4 bg-advist-bg rounded-xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-lg">
                <Bell size={20} className="text-advist-gray900" />
              </div>
              <div>
                <p className="font-medium text-advist-gray900">Notifications Push</p>
                <p className="text-sm text-advist-blue-light">Notifications navigateur</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.push_enabled}
                onChange={(e) => setPreferences(prev => ({ ...prev, push_enabled: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-advist-border peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-advist-blue-light/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-advist-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-advist-dark"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Notification Types Matrix */}
      <div className="bg-white rounded-xl border border-advist-bg p-6">
        <h3 className="text-lg font-semibold text-advist-gray900 mb-4">Types de notifications</h3>
        <p className="text-sm text-advist-blue-light mb-4">
          Choisissez comment recevoir chaque type de notification
        </p>

        <div className="space-y-4">
          {notificationTypes.map((type) => (
            <div key={type.key} className="p-4 bg-advist-bg rounded-xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-white rounded-lg text-advist-gray900">
                  {type.icon}
                </div>
                <div>
                  <p className="font-medium text-advist-gray900">{type.title}</p>
                  <p className="text-xs text-advist-blue-light">{type.description}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {(['in_app', 'email', 'whatsapp', 'sms'] as NotificationChannel[]).map((channel) => {
                  const isEnabled =
                    (channel === 'email' && preferences.email_enabled) ||
                    (channel === 'whatsapp' && preferences.whatsapp_enabled && whatsappVerified) ||
                    (channel === 'sms' && preferences.sms_enabled) ||
                    channel === 'in_app';

                  const isSelected = preferences[type.key]?.includes(channel);

                  return (
                    <button
                      key={channel}
                      onClick={() => isEnabled && toggleChannelForType(type.key, channel)}
                      disabled={!isEnabled}
                      className={`
                        flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all
                        ${isSelected
                          ? 'bg-advist-dark text-white'
                          : isEnabled
                            ? 'bg-white text-advist-gray900 hover:bg-advist-dark/10'
                            : 'bg-advist-surface-dark text-advist-text-muted cursor-not-allowed'
                        }
                      `}
                    >
                      {CHANNEL_ICONS[channel]}
                      {CHANNEL_LABELS[channel]}
                      {isSelected && <Check size={14} />}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quiet Hours */}
      <div className="bg-white rounded-xl border border-advist-bg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-advist-bg rounded-lg">
              <Moon size={20} className="text-advist-gray900" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-advist-gray900">Heures silencieuses</h3>
              <p className="text-sm text-advist-blue-light">Suspendre les notifications pendant certaines heures</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.quiet_hours_enabled}
              onChange={(e) => setPreferences(prev => ({ ...prev, quiet_hours_enabled: e.target.checked }))}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-advist-border peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-advist-blue-light/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-advist-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-advist-dark"></div>
          </label>
        </div>

        {preferences.quiet_hours_enabled && (
          <div className="flex gap-4 mt-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-advist-gray900 mb-1">Début</label>
              <input
                type="time"
                value={preferences.quiet_hours_start || '22:00'}
                onChange={(e) => setPreferences(prev => ({ ...prev, quiet_hours_start: e.target.value }))}
                className="w-full px-4 py-2 bg-advist-bg border border-advist-border rounded-lg focus:outline-none focus:ring-2 focus:ring-advist-blue-light/30"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-advist-gray900 mb-1">Fin</label>
              <input
                type="time"
                value={preferences.quiet_hours_end || '07:00'}
                onChange={(e) => setPreferences(prev => ({ ...prev, quiet_hours_end: e.target.value }))}
                className="w-full px-4 py-2 bg-advist-bg border border-advist-border rounded-lg focus:outline-none focus:ring-2 focus:ring-advist-blue-light/30"
              />
            </div>
          </div>
        )}
      </div>

      {/* Notification Language */}
      <div className="bg-white rounded-xl border border-advist-bg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-advist-bg rounded-lg">
              <Globe size={20} className="text-advist-gray900" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-advist-gray900">Langue des notifications</h3>
              <p className="text-sm text-advist-blue-light">Choisissez la langue de vos notifications</p>
            </div>
          </div>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowLanguageSelector(!showLanguageSelector)}
            className="w-full flex items-center justify-between p-4 bg-advist-bg rounded-xl hover:bg-advist-surface-dark transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">
                {SUPPORTED_LANGUAGES.find(l => l.code === notificationLanguage)?.flag}
              </span>
              <div className="text-left">
                <p className="font-medium text-advist-gray900">
                  {SUPPORTED_LANGUAGES.find(l => l.code === notificationLanguage)?.nativeName}
                </p>
                <p className="text-sm text-advist-blue-light">
                  {SUPPORTED_LANGUAGES.find(l => l.code === notificationLanguage)?.region}
                </p>
              </div>
            </div>
            <ChevronDown size={20} className={`text-advist-blue-light transition-transform ${showLanguageSelector ? 'rotate-180' : ''}`} />
          </button>

          {showLanguageSelector && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowLanguageSelector(false)} />
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-advist-bg z-20 max-h-64 overflow-y-auto">
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setNotificationLanguage(lang.code);
                      setShowLanguageSelector(false);
                    }}
                    className={`w-full flex items-center gap-3 p-4 hover:bg-advist-bg transition-colors ${
                      notificationLanguage === lang.code ? 'bg-advist-gold-light' : ''
                    }`}
                  >
                    <span className="text-2xl">{lang.flag}</span>
                    <div className="flex-1 text-left">
                      <p className="font-medium text-advist-gray900">{lang.nativeName}</p>
                      <p className="text-sm text-advist-blue-light">{lang.name} - {lang.region}</p>
                    </div>
                    {notificationLanguage === lang.code && (
                      <Check size={18} className="text-advist-gray900" />
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="mt-4 p-3 bg-advist-gold-light rounded-xl">
          <p className="text-sm text-advist-gray900">
            <strong>Exemple de notification en {SUPPORTED_LANGUAGES.find(l => l.code === notificationLanguage)?.nativeName}:</strong>
          </p>
          <p className="text-sm text-advist-gray900 mt-1">
            {notificationLanguage === 'fr' && 'Le document "Contrat Q4" attend votre signature'}
            {notificationLanguage === 'en' && 'Document "Contract Q4" is awaiting your signature'}
            {notificationLanguage === 'bm' && 'Sɛbɛn "Contrat Q4" bɛ i ka tɔgɔda makɔnɔ'}
            {notificationLanguage === 'wo' && 'Bataaxal "Contrat Q4" di xaar sa siiñ'}
          </p>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="min-w-[200px]"
        >
          {isSaving ? (
            <>
              <Loader2 size={16} className="animate-spin mr-2" />
              Sauvegarde...
            </>
          ) : (
            <>
              <Check size={16} className="mr-2" />
              Sauvegarder les préférences
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default NotificationPreferences;
