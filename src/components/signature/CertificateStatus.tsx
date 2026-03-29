import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Clock,
  Calendar,
  Building,
  User,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { qesService } from '../../services/qesService';
import type { QualifiedCertificate } from '../../types/qes';

export interface CertificateStatusProps {
  onRequestCertificate?: () => void;
  showActions?: boolean;
  compact?: boolean;
}

export const CertificateStatus: React.FC<CertificateStatusProps> = ({
  onRequestCertificate,
  showActions = true,
  compact = false,
}) => {
  const { t } = useTranslation();
  const [certificate, setCertificate] = useState<QualifiedCertificate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCertificate();
  }, []);

  const loadCertificate = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const cert = await qesService.getActiveCertificate();
      setCertificate(cert);
    } catch (err) {
      console.error('Error loading certificate:', err);
      setError(t('qes.errorLoading', 'Erreur lors du chargement du certificat'));
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusConfig = () => {
    if (!certificate) {
      return {
        icon: ShieldAlert,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        label: t('qes.noCertificate', 'Aucun certificat'),
        description: t('qes.noCertificateDesc', 'Vous n\'avez pas de certificat qualifié actif'),
      };
    }

    switch (certificate.status) {
      case 'active':
        return {
          icon: ShieldCheck,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          label: t('qes.active', 'Actif'),
          description: t('qes.activeDesc', 'Votre certificat est valide et prêt à l\'emploi'),
        };
      case 'pending_verification':
      case 'verification_in_progress':
        return {
          icon: Clock,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          label: t('qes.pending', 'En cours'),
          description: t('qes.pendingDesc', 'Vérification d\'identité en cours'),
        };
      case 'pending_issuance':
        return {
          icon: Clock,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          label: t('qes.issuance', 'Émission'),
          description: t('qes.issuanceDesc', 'Votre certificat est en cours d\'émission'),
        };
      case 'expired':
        return {
          icon: ShieldX,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          label: t('qes.expired', 'Expiré'),
          description: t('qes.expiredDesc', 'Votre certificat a expiré'),
        };
      case 'revoked':
        return {
          icon: ShieldX,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          label: t('qes.revoked', 'Révoqué'),
          description: t('qes.revokedDesc', 'Votre certificat a été révoqué'),
        };
      case 'suspended':
        return {
          icon: ShieldAlert,
          color: 'text-orange-600',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          label: t('qes.suspended', 'Suspendu'),
          description: t('qes.suspendedDesc', 'Votre certificat est temporairement suspendu'),
        };
      default:
        return {
          icon: Shield,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          label: t('qes.unknown', 'Inconnu'),
          description: '',
        };
    }
  };

  if (isLoading) {
    return (
      <div className={`${compact ? 'p-3' : 'p-4'} bg-gray-50 border border-gray-200 rounded-lg animate-pulse`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-200 rounded-lg" />
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-24 mb-2" />
            <div className="h-3 bg-gray-200 rounded w-32" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${compact ? 'p-3' : 'p-4'} bg-red-50 border border-red-200 rounded-lg`}>
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <span className="text-sm text-red-600">{error}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={loadCertificate}
            className="ml-auto"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  const config = getStatusConfig();
  const StatusIcon = config.icon;

  if (compact) {
    return (
      <div className={`p-3 ${config.bgColor} border ${config.borderColor} rounded-lg`}>
        <div className="flex items-center gap-3">
          <StatusIcon className={`w-5 h-5 ${config.color}`} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900 text-sm">
                {t('qes.qesCertificate', 'Certificat QES')}
              </span>
              <Badge
                variant={certificate?.is_valid ? 'success' : 'warning'}
                className="text-xs"
              >
                {config.label}
              </Badge>
            </div>
          </div>
          {showActions && !certificate && onRequestCertificate && (
            <Button size="sm" onClick={onRequestCertificate}>
              {t('qes.getCertificate', 'Obtenir')}
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`${config.bgColor} border ${config.borderColor} rounded-xl overflow-hidden`}>
      {/* Header */}
      <div
        className="p-4 cursor-pointer"
        onClick={() => certificate && setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 ${config.bgColor} rounded-xl flex items-center justify-center border ${config.borderColor}`}>
            <StatusIcon className={`w-6 h-6 ${config.color}`} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900">
                {t('qes.qualifiedCertificate', 'Certificat Qualifié eIDAS')}
              </h3>
              <Badge
                variant={certificate?.is_valid ? 'success' : 'warning'}
              >
                {config.label}
              </Badge>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {config.description}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {showActions && !certificate && onRequestCertificate && (
              <Button onClick={onRequestCertificate}>
                {t('qes.requestCertificate', 'Demander un certificat')}
              </Button>
            )}
            {certificate && (
              <button className="p-2 hover:bg-white/50 rounded-lg transition-colors">
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Expanded details */}
      {certificate && isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-200/50">
          <div className="grid grid-cols-2 gap-4 mt-4">
            {/* Provider */}
            <div className="flex items-start gap-3">
              <Building className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  {t('qes.provider', 'Fournisseur')}
                </p>
                <p className="text-sm font-medium text-gray-900">
                  {certificate.qtsp_provider}
                </p>
              </div>
            </div>

            {/* Serial */}
            {certificate.certificate_serial && (
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">
                    {t('qes.serial', 'Numéro de série')}
                  </p>
                  <p className="text-sm font-medium text-gray-900 font-mono">
                    {certificate.certificate_serial.slice(0, 16)}...
                  </p>
                </div>
              </div>
            )}

            {/* Validity */}
            {certificate.valid_from && certificate.valid_until && (
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">
                    {t('qes.validity', 'Validité')}
                  </p>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(certificate.valid_from).toLocaleDateString('fr-FR')} -{' '}
                    {new Date(certificate.valid_until).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
            )}

            {/* Days remaining */}
            {certificate.days_until_expiry !== undefined && certificate.is_valid && (
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">
                    {t('qes.remaining', 'Jours restants')}
                  </p>
                  <p className={`text-sm font-medium ${
                    certificate.days_until_expiry <= 30 ? 'text-orange-600' : 'text-gray-900'
                  }`}>
                    {certificate.days_until_expiry} {t('qes.days', 'jours')}
                  </p>
                </div>
              </div>
            )}

            {/* Holder */}
            <div className="flex items-start gap-3">
              <User className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  {t('qes.holder', 'Titulaire')}
                </p>
                <p className="text-sm font-medium text-gray-900">
                  {certificate.user_name}
                </p>
                <p className="text-xs text-gray-500">
                  {certificate.user_email}
                </p>
              </div>
            </div>

            {/* Verification date */}
            {certificate.verification_date && (
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">
                    {t('qes.verifiedOn', 'Vérifié le')}
                  </p>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(certificate.verification_date).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Warning for expiring soon */}
          {certificate.days_until_expiry !== undefined && certificate.days_until_expiry <= 30 && certificate.is_valid && (
            <div className="mt-4 p-3 bg-orange-100 border border-orange-200 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                <p className="text-sm text-orange-800">
                  {t('qes.expiringWarning', 'Votre certificat expire bientôt. Pensez à le renouveler.')}
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          {showActions && (
            <div className="flex gap-3 mt-4 pt-4 border-t border-gray-200/50">
              <Button
                variant="ghost"
                size="sm"
                onClick={loadCertificate}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                {t('qes.refresh', 'Actualiser')}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CertificateStatus;
