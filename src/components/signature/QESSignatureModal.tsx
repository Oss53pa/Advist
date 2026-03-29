import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Shield,
  Video,
  CreditCard,
  Check,
  X,
  ChevronRight,
  Lock,
  Smartphone,
  Mail,
  AlertTriangle,
  Clock,
  FileText,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { qesService } from '../../services/qesService';
import type {
  QualifiedCertificate,
  VerificationMethod,
  OTPChannel,
} from '../../types/qes';

export interface QESSignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
  documentName: string;
  signatureId: string;
  onSuccess?: (signatureResult: unknown) => void;
}

type Step =
  | 'check-certificate'
  | 'no-certificate'
  | 'verification'
  | 'verification-pending'
  | 'otp'
  | 'signing'
  | 'success'
  | 'error';

export const QESSignatureModal: React.FC<QESSignatureModalProps> = ({
  isOpen,
  onClose,
  documentId,
  documentName,
  signatureId,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState<Step>('check-certificate');
  const [certificate, setCertificate] = useState<QualifiedCertificate | null>(null);
  const [verificationUrl, setVerificationUrl] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [otpChannel, setOtpChannel] = useState<OTPChannel>('sms');
  const [otpExpiresIn, setOtpExpiresIn] = useState(300);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signatureResult, setSignatureResult] = useState<unknown>(null);

  // Check certificate status on modal open
  useEffect(() => {
    if (isOpen) {
      checkCertificate();
    }
  }, [isOpen]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setCurrentStep('check-certificate');
      setCertificate(null);
      setVerificationUrl(null);
      setOtpCode('');
      setError(null);
      setSignatureResult(null);
    }
  }, [isOpen]);

  // OTP countdown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (currentStep === 'otp' && otpExpiresIn > 0) {
      timer = setInterval(() => {
        setOtpExpiresIn((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [currentStep, otpExpiresIn]);

  const checkCertificate = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const status = await qesService.getCertificateStatus();

      if (status.status === 'no_certificate') {
        setCurrentStep('no-certificate');
      } else if (status.status === 'pending' && status.certificate) {
        setCertificate(status.certificate);
        setCurrentStep('verification-pending');
      } else if (status.certificate?.is_valid) {
        setCertificate(status.certificate);
        // Send OTP and go to OTP step
        await sendOTP('sms');
      } else {
        setCurrentStep('no-certificate');
      }
    } catch (err) {
      console.error('Error checking certificate:', err);
      setError(t('qes.errorCheckingCertificate', 'Erreur lors de la vérification du certificat'));
      setCurrentStep('error');
    } finally {
      setIsLoading(false);
    }
  };

  const requestCertificate = async (method: VerificationMethod) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await qesService.requestCertificate(method);

      if (result.verification_url) {
        setVerificationUrl(result.verification_url);
        setCurrentStep('verification');
      } else if (result.status === 'active') {
        // Certificate already exists and active
        await checkCertificate();
      } else {
        setCurrentStep('verification-pending');
      }
    } catch (err) {
      console.error('Error requesting certificate:', err);
      setError(t('qes.errorRequestingCertificate', 'Erreur lors de la demande de certificat'));
      setCurrentStep('error');
    } finally {
      setIsLoading(false);
    }
  };

  const sendOTP = async (channel: OTPChannel) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await qesService.sendOTP(channel);
      setOtpChannel(channel);
      setOtpExpiresIn(result.expires_in);
      setCurrentStep('otp');
    } catch (err) {
      console.error('Error sending OTP:', err);
      setError(t('qes.errorSendingOTP', 'Erreur lors de l\'envoi du code OTP'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSign = async () => {
    if (otpCode.length !== 6) {
      setError(t('qes.invalidOTP', 'Le code OTP doit contenir 6 chiffres'));
      return;
    }

    setIsLoading(true);
    setError(null);
    setCurrentStep('signing');

    try {
      const result = await qesService.signDocument(
        documentId,
        signatureId,
        [],
        otpCode
      );

      setSignatureResult(result);
      setCurrentStep('success');
      onSuccess?.(result);
    } catch (err: unknown) {
      console.error('Error signing document:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la signature';
      setError(errorMessage);
      setCurrentStep('otp'); // Go back to OTP step to retry
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'check-certificate':
        return (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-12 h-12 text-primary-600 animate-spin mb-4" />
            <p className="text-gray-600">
              {t('qes.checkingCertificate', 'Vérification du certificat...')}
            </p>
          </div>
        );

      case 'no-certificate':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-yellow-50 rounded-full flex items-center justify-center">
                <Shield className="w-8 h-8 text-yellow-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                {t('qes.noCertificate', 'Certificat qualifié requis')}
              </h3>
              <p className="text-gray-600 mt-2">
                {t('qes.certificateRequired', 'Pour signer avec une signature qualifiée, vous devez d\'abord obtenir un certificat.')}
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => requestCertificate('video_id')}
                disabled={isLoading}
                className="w-full p-4 border border-gray-200 rounded-xl hover:bg-primary-50 hover:border-primary-300 transition-colors flex items-center gap-4 text-left"
              >
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                  <Video className="w-6 h-6 text-primary-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">
                    {t('qes.videoIdentification', 'Vidéo-identification')}
                  </p>
                  <p className="text-sm text-gray-500">
                    {t('qes.videoDesc', 'Vérification en direct avec un agent (5-10 min)')}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>

              <button
                onClick={() => requestCertificate('id_scan')}
                disabled={isLoading}
                className="w-full p-4 border border-gray-200 rounded-xl hover:bg-primary-50 hover:border-primary-300 transition-colors flex items-center gap-4 text-left"
              >
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-primary-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">
                    {t('qes.idScan', 'Scan de pièce d\'identité')}
                  </p>
                  <p className="text-sm text-gray-500">
                    {t('qes.idScanDesc', 'Photo de votre pièce d\'identité + selfie')}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
              <div className="flex gap-3">
                <Lock className="w-5 h-5 text-blue-600 shrink-0" />
                <p className="text-sm text-blue-800">
                  {t('qes.securityNote', 'La vérification d\'identité est requise par le règlement eIDAS pour garantir la valeur juridique maximale de votre signature.')}
                </p>
              </div>
            </div>
          </div>
        );

      case 'verification':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t('qes.verification', 'Vérification d\'identité')}
              </h3>
              <p className="text-gray-600">
                {t('qes.verificationInProgress', 'Veuillez compléter la vérification d\'identité ci-dessous.')}
              </p>
            </div>

            {verificationUrl && (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <iframe
                  src={verificationUrl}
                  className="w-full h-[500px]"
                  allow="camera; microphone"
                  title="Identity Verification"
                />
              </div>
            )}

            <Button variant="ghost" onClick={onClose} className="w-full">
              {t('common.cancel', 'Annuler')}
            </Button>
          </div>
        );

      case 'verification-pending':
        return (
          <div className="space-y-6 text-center">
            <div className="w-16 h-16 mx-auto bg-yellow-50 rounded-full flex items-center justify-center">
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {t('qes.verificationPending', 'Vérification en cours')}
              </h3>
              <p className="text-gray-600 mt-2">
                {t('qes.verificationPendingDesc', 'Votre demande de certificat est en cours de traitement. Vous recevrez une notification lorsqu\'elle sera approuvée.')}
              </p>
            </div>

            {certificate && (
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-left">
                <p className="text-sm text-gray-600">
                  <strong>{t('qes.status', 'Statut')}:</strong>{' '}
                  <Badge variant="warning">
                    {t('qes.pendingReview', 'En attente de validation')}
                  </Badge>
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="ghost" onClick={onClose} className="flex-1">
                {t('common.close', 'Fermer')}
              </Button>
              <Button onClick={checkCertificate} className="flex-1">
                <RefreshCw className="w-4 h-4 mr-2" />
                {t('qes.refresh', 'Actualiser')}
              </Button>
            </div>
          </div>
        );

      case 'otp':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-primary-50 rounded-full flex items-center justify-center">
                {otpChannel === 'sms' ? (
                  <Smartphone className="w-8 h-8 text-primary-600" />
                ) : (
                  <Mail className="w-8 h-8 text-primary-600" />
                )}
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                {t('qes.enterOTP', 'Entrez le code de vérification')}
              </h3>
              <p className="text-gray-600 mt-2">
                {otpChannel === 'sms'
                  ? t('qes.otpSentSMS', 'Un code a été envoyé à votre téléphone.')
                  : t('qes.otpSentEmail', 'Un code a été envoyé à votre adresse email.')}
              </p>
            </div>

            {/* Document info */}
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-600 truncate">{documentName}</span>
              </div>
            </div>

            {/* OTP Input */}
            <div className="max-w-[250px] mx-auto">
              <Input
                type="text"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="text-center text-2xl tracking-[0.5em] font-mono"
                autoFocus
              />

              {/* Timer */}
              <div className="flex items-center justify-center gap-2 mt-3">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className={`text-sm ${otpExpiresIn < 60 ? 'text-red-600' : 'text-gray-500'}`}>
                  {formatTime(otpExpiresIn)}
                </span>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600 text-center">{error}</p>
              </div>
            )}

            {/* Resend options */}
            <div className="flex items-center justify-center gap-4 text-sm">
              <button
                onClick={() => sendOTP('sms')}
                disabled={isLoading}
                className="text-primary-600 hover:underline"
              >
                {t('qes.resendSMS', 'Renvoyer par SMS')}
              </button>
              <span className="text-gray-300">|</span>
              <button
                onClick={() => sendOTP('email')}
                disabled={isLoading}
                className="text-primary-600 hover:underline"
              >
                {t('qes.resendEmail', 'Renvoyer par email')}
              </button>
            </div>

            <div className="flex gap-3">
              <Button variant="ghost" onClick={onClose} className="flex-1">
                {t('common.cancel', 'Annuler')}
              </Button>
              <Button
                onClick={handleSign}
                disabled={otpCode.length !== 6 || isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t('qes.signing', 'Signature en cours...')}
                  </>
                ) : (
                  t('qes.sign', 'Signer le document')
                )}
              </Button>
            </div>
          </div>
        );

      case 'signing':
        return (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-12 h-12 text-primary-600 animate-spin mb-4" />
            <p className="text-gray-900 font-medium">
              {t('qes.signingInProgress', 'Signature en cours...')}
            </p>
            <p className="text-gray-500 text-sm mt-2">
              {t('qes.pleaseWait', 'Veuillez patienter, cela peut prendre quelques secondes.')}
            </p>
          </div>
        );

      case 'success':
        return (
          <div className="space-y-6 text-center">
            <div className="w-20 h-20 mx-auto bg-green-50 rounded-full flex items-center justify-center">
              <Check className="w-10 h-10 text-green-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                {t('qes.success', 'Document signé !')}
              </h3>
              <p className="text-gray-600 mt-2">
                {t('qes.successDesc', 'Votre signature qualifiée a été appliquée avec succès.')}
              </p>
            </div>

            {/* Certificate info */}
            {certificate && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-left">
                <h4 className="font-medium text-green-800 mb-2">
                  {t('qes.signatureDetails', 'Détails de la signature')}
                </h4>
                <div className="space-y-1 text-sm text-green-700">
                  <p><strong>{t('qes.level', 'Niveau')}:</strong> Signature Qualifiée (QES)</p>
                  <p><strong>{t('qes.provider', 'Fournisseur')}:</strong> {certificate.qtsp_provider}</p>
                  <p><strong>{t('qes.timestamp', 'Horodatage')}:</strong> {new Date().toLocaleString('fr-FR')}</p>
                </div>
              </div>
            )}

            <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
              <div className="flex gap-3">
                <Shield className="w-5 h-5 text-blue-600 shrink-0" />
                <p className="text-sm text-blue-800">
                  {t('qes.legalValue', 'Cette signature qualifiée a la même valeur juridique qu\'une signature manuscrite conformément au règlement eIDAS.')}
                </p>
              </div>
            </div>

            <Button onClick={onClose} className="w-full">
              {t('common.close', 'Fermer')}
            </Button>
          </div>
        );

      case 'error':
        return (
          <div className="space-y-6 text-center">
            <div className="w-16 h-16 mx-auto bg-red-50 rounded-full flex items-center justify-center">
              <X className="w-8 h-8 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {t('qes.error', 'Une erreur est survenue')}
              </h3>
              <p className="text-gray-600 mt-2">
                {error || t('qes.genericError', 'Veuillez réessayer plus tard.')}
              </p>
            </div>

            <div className="flex gap-3">
              <Button variant="ghost" onClick={onClose} className="flex-1">
                {t('common.close', 'Fermer')}
              </Button>
              <Button onClick={checkCertificate} className="flex-1">
                {t('common.retry', 'Réessayer')}
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const getModalTitle = () => {
    switch (currentStep) {
      case 'check-certificate':
        return t('qes.title', 'Signature Qualifiée');
      case 'no-certificate':
        return t('qes.getCertificate', 'Obtenir un certificat');
      case 'verification':
        return t('qes.verification', 'Vérification d\'identité');
      case 'verification-pending':
        return t('qes.pendingTitle', 'En attente');
      case 'otp':
        return t('qes.otpTitle', 'Code de vérification');
      case 'signing':
        return t('qes.signingTitle', 'Signature en cours');
      case 'success':
        return t('qes.successTitle', 'Succès');
      case 'error':
        return t('qes.errorTitle', 'Erreur');
      default:
        return '';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={currentStep === 'success' ? onClose : undefined}
      title={getModalTitle()}
      size={currentStep === 'verification' ? 'xl' : 'md'}
    >
      <div className="py-2">
        {/* QES Badge */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <Badge className="bg-primary-100 text-primary-800 border border-primary-200">
            <Shield className="w-3 h-3 mr-1" />
            eIDAS QES
          </Badge>
        </div>

        {renderStepContent()}
      </div>
    </Modal>
  );
};

export default QESSignatureModal;
