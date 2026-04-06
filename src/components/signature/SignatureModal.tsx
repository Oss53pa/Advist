import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  PenTool,
  Shield,
  Clock,
  _MapPin,
  FileText,
  AlertTriangle,
  Check,
  X,
  ChevronRight,
  Lock,
  Fingerprint,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import SignaturePad, { SignatureData } from './SignaturePad';
import { ConsentScreen } from './ConsentScreen';

export interface SignatureRequest {
  id: string;
  documentId: string;
  documentName: string;
  requestedBy: string;
  requestedAt: string;
  deadline?: string;
  signatureType: 'simple' | 'advanced' | 'qualified';
  requiresParaphs?: boolean;
  pages?: number[];
  position?: { page: number; x: number; y: number };
}

export interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: SignatureRequest;
  onSign: (signatureData: SignatureData, pin?: string, consentId?: string) => Promise<void>;
  onRefuse: (reason: string) => Promise<void>;
  savedSignatures?: SignatureData[];
  requirePin?: boolean;
}

type Step =
  | 'overview'
  | 'consent'
  | 'select-signature'
  | 'create-signature'
  | 'confirm'
  | 'pin'
  | 'success'
  | 'refuse';

export const SignatureModal: React.FC<SignatureModalProps> = ({
  isOpen,
  onClose,
  request,
  onSign,
  onRefuse,
  savedSignatures = [],
  requirePin = true,
}) => {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState<Step>('overview');
  const [selectedSignature, setSelectedSignature] = useState<SignatureData | null>(null);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [refuseReason, setRefuseReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [consentId, setConsentId] = useState<string | null>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep('overview');
      setSelectedSignature(null);
      setPin('');
      setPinError('');
      setRefuseReason('');
      setConsentId(null);
    }
  }, [isOpen]);

  // Get signature type info
  const getSignatureTypeInfo = () => {
    switch (request.signatureType) {
      case 'simple':
        return {
          label: t('signature.type.simple', 'Signature simple'),
          description: t('signature.type.simpleDesc', 'Clic de confirmation avec horodatage'),
          color: 'bg-advist-surface-dark text-advist-gray900',
          icon: <PenTool size={16} />,
        };
      case 'advanced':
        return {
          label: t('signature.type.advanced', 'Signature avancée'),
          description: t('signature.type.advancedDesc', "Vérification d'identité renforcée"),
          color: 'bg-advist-gold-light text-advist-gray900',
          icon: <Shield size={16} />,
        };
      case 'qualified':
        return {
          label: t('signature.type.qualified', 'Signature qualifiée'),
          description: t(
            'signature.type.qualifiedDesc',
            'Valeur juridique maximale - Conforme OHADA'
          ),
          color: 'bg-advist-surface-dark text-advist-gray900',
          icon: <Lock size={16} />,
        };
    }
  };

  const signatureTypeInfo = getSignatureTypeInfo();

  // Handle signature selection
  const handleSelectSignature = (signature: SignatureData) => {
    setSelectedSignature(signature);
    if (requirePin) {
      setCurrentStep('pin');
    } else {
      setCurrentStep('confirm');
    }
  };

  // Handle new signature creation
  const handleCreateSignature = (signature: SignatureData) => {
    setSelectedSignature(signature);
    if (requirePin) {
      setCurrentStep('pin');
    } else {
      setCurrentStep('confirm');
    }
  };

  // Handle PIN validation
  const handlePinSubmit = () => {
    if (pin.length !== 4) {
      setPinError(t('signature.pinInvalid', 'Le code PIN doit contenir 4 chiffres'));
      return;
    }
    setPinError('');
    setCurrentStep('confirm');
  };

  // Handle final signature
  const handleConfirmSignature = async () => {
    if (!selectedSignature) return;

    setIsSubmitting(true);
    try {
      await onSign(selectedSignature, requirePin ? pin : undefined, consentId || undefined);
      setCurrentStep('success');
    } catch (error) {
      console.error('Signature failed:', error);
      setPinError(t('signature.error', 'Une erreur est survenue lors de la signature'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle refusal
  const handleRefuse = async () => {
    if (!refuseReason.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onRefuse(refuseReason);
      onClose();
    } catch (error) {
      console.error('Refusal failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 'overview':
        return (
          <div className="space-y-6">
            {/* Document info */}
            <div className="p-4 bg-[#EAEAEA]/50 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-white rounded-lg">
                  <FileText size={24} className="text-[#383733]" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#383733]">{request.documentName}</h3>
                  <p className="text-sm text-[#3A4654] mt-1">
                    {t('signature.requestedBy', 'Demandé par')} {request.requestedBy}
                  </p>
                  <p className="text-sm text-[#A29790]">
                    {t('signature.requestedAt', 'Le')}{' '}
                    {new Date(request.requestedAt).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
            </div>

            {/* Signature type */}
            <div className="p-4 border border-[#EAEAEA] rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                {signatureTypeInfo.icon}
                <Badge className={signatureTypeInfo.color}>{signatureTypeInfo.label}</Badge>
              </div>
              <p className="text-sm text-[#3A4654]">{signatureTypeInfo.description}</p>
            </div>

            {/* Deadline warning */}
            {request.deadline && (
              <div className="p-4 bg-advist-gold-light border border-advist-gold rounded-lg">
                <div className="flex items-center gap-2">
                  <Clock size={18} className="text-advist-gold-dark" />
                  <p className="text-sm text-advist-gold-dark">
                    {t('signature.deadline', 'Date limite')}:{' '}
                    {new Date(request.deadline).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
            )}

            {/* Paraph info */}
            {request.requiresParaphs && (
              <div className="p-4 bg-advist-gold-light border border-advist-gold rounded-lg">
                <p className="text-sm text-advist-gray900">
                  📝{' '}
                  {t(
                    'signature.paraphRequired',
                    'Des paraphes sont requis sur certaines pages de ce document'
                  )}
                </p>
              </div>
            )}

            {/* Legal notice */}
            <div className="p-4 bg-advist-surface-dark border border-advist-border rounded-lg">
              <p className="text-xs text-advist-text-secondary">
                {t(
                  'signature.legalNotice',
                  'En signant ce document, vous confirmez avoir lu et accepté son contenu. Cette signature a une valeur juridique conformément à la réglementation OHADA sur les signatures électroniques.'
                )}
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 text-advist-error border-advist-gold hover:bg-advist-gold-light"
                onClick={() => setCurrentStep('refuse')}
              >
                <X size={16} className="mr-2" />
                {t('signature.refuse', 'Refuser de signer')}
              </Button>
              <Button className="flex-1" onClick={() => setCurrentStep('consent')}>
                {t('signature.proceed', 'Procéder à la signature')}
                <ChevronRight size={16} className="ml-2" />
              </Button>
            </div>
          </div>
        );

      case 'consent':
        return (
          <ConsentScreen
            documentId={request.documentId}
            documentTitle={request.documentName}
            signerName=""
            signerEmail=""
            onConsent={(id) => {
              setConsentId(id);
              setCurrentStep('select-signature');
            }}
            onCancel={() => setCurrentStep('overview')}
          />
        );

      case 'select-signature':
        return (
          <div className="space-y-6">
            <p className="text-[#3A4654]">
              {t(
                'signature.selectOrCreate',
                'Sélectionnez une signature existante ou créez-en une nouvelle'
              )}
            </p>

            {/* Saved signatures */}
            {savedSignatures.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium text-[#383733]">
                  {t('signature.savedSignatures', 'Signatures enregistrées')}
                </h4>
                <div className="grid gap-3">
                  {savedSignatures.map((sig, index) => (
                    <button
                      key={index}
                      onClick={() => handleSelectSignature(sig)}
                      className="p-4 border border-[#EAEAEA] rounded-lg hover:border-[#383733] transition-colors text-left"
                    >
                      <img
                        src={sig.data}
                        alt={`Signature ${index + 1}`}
                        className="h-16 object-contain"
                      />
                      <p className="text-xs text-[#A29790] mt-2">
                        {t('signature.createdAt', 'Créée le')}{' '}
                        {new Date(sig.timestamp).toLocaleDateString('fr-FR')}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Create new signature button */}
            <Button
              variant="outline"
              className="w-full py-8"
              onClick={() => setCurrentStep('create-signature')}
            >
              <PenTool size={20} className="mr-2" />
              {t('signature.createNew', 'Créer une nouvelle signature')}
            </Button>

            <Button variant="ghost" onClick={() => setCurrentStep('overview')}>
              {t('common.back', 'Retour')}
            </Button>
          </div>
        );

      case 'create-signature':
        return (
          <div>
            <SignaturePad
              onSave={handleCreateSignature}
              onCancel={() => setCurrentStep('select-signature')}
            />
          </div>
        );

      case 'pin':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-[#EAEAEA] rounded-full flex items-center justify-center">
                <Fingerprint size={32} className="text-[#383733]" />
              </div>
              <h3 className="text-lg font-semibold text-[#383733]">
                {t('signature.enterPin', 'Entrez votre code PIN')}
              </h3>
              <p className="text-sm text-[#3A4654] mt-2">
                {t(
                  'signature.pinRequired',
                  'Pour des raisons de sécurité, veuillez entrer votre code PIN de signature'
                )}
              </p>
            </div>

            <div className="max-w-[200px] mx-auto">
              <Input
                type="password"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                placeholder="••••"
                className="text-center text-2xl tracking-widest"
                autoFocus
              />
              {pinError && <p className="text-sm text-advist-error mt-2 text-center">{pinError}</p>}
            </div>

            <div className="flex gap-3">
              <Button
                variant="ghost"
                onClick={() => setCurrentStep('select-signature')}
                className="flex-1"
              >
                {t('common.back', 'Retour')}
              </Button>
              <Button onClick={handlePinSubmit} className="flex-1">
                {t('common.continue', 'Continuer')}
              </Button>
            </div>
          </div>
        );

      case 'confirm':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-green-50 rounded-full flex items-center justify-center">
                <Check size={32} className="text-advist-success" />
              </div>
              <h3 className="text-lg font-semibold text-[#383733]">
                {t('signature.confirmTitle', 'Confirmer la signature')}
              </h3>
            </div>

            {/* Signature preview */}
            {selectedSignature && (
              <div className="p-4 bg-white border border-[#EAEAEA] rounded-lg text-center">
                <img
                  src={selectedSignature.data}
                  alt="Signature"
                  className="h-20 mx-auto object-contain"
                />
              </div>
            )}

            {/* Document summary */}
            <div className="p-4 bg-[#EAEAEA]/50 rounded-lg">
              <p className="text-sm text-[#3A4654]">
                <strong>{t('signature.document', 'Document')}:</strong> {request.documentName}
              </p>
              <p className="text-sm text-[#3A4654] mt-1">
                <strong>{t('signature.type', 'Type')}:</strong> {signatureTypeInfo.label}
              </p>
              <p className="text-sm text-[#3A4654] mt-1">
                <strong>{t('signature.date', 'Date')}:</strong> {new Date().toLocaleString('fr-FR')}
              </p>
            </div>

            {/* Legal confirmation */}
            <div className="p-4 bg-advist-gold-light border border-advist-gold rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle size={18} className="text-advist-gold-dark shrink-0 mt-0.5" />
                <p className="text-sm text-advist-gold-dark">
                  {t(
                    'signature.finalWarning',
                    'Cette action est définitive. En cliquant sur "Signer", vous apposez votre signature électronique sur ce document.'
                  )}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="ghost"
                onClick={() => setCurrentStep('select-signature')}
                className="flex-1"
              >
                {t('common.back', 'Retour')}
              </Button>
              <Button
                onClick={handleConfirmSignature}
                disabled={isSubmitting}
                className="flex-1 bg-advist-success hover:bg-green-50"
              >
                {isSubmitting
                  ? t('signature.signing', 'Signature en cours...')
                  : t('signature.sign', 'Signer le document')}
              </Button>
            </div>
          </div>
        );

      case 'success':
        return (
          <div className="space-y-6 text-center">
            <div className="w-20 h-20 mx-auto bg-green-50 rounded-full flex items-center justify-center">
              <Check size={40} className="text-advist-success" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-[#383733]">
                {t('signature.success', 'Document signé avec succès')}
              </h3>
              <p className="text-[#3A4654] mt-2">
                {t(
                  'signature.successDesc',
                  'Votre signature électronique a été apposée sur le document.'
                )}
              </p>
            </div>

            {/* Signature certificate info */}
            <div className="p-4 bg-green-50 border border-advist-success rounded-lg text-left">
              <h4 className="font-medium text-advist-success mb-2">
                {t('signature.certificate', 'Certificat de signature')}
              </h4>
              <div className="space-y-1 text-sm text-advist-success">
                <p>
                  <strong>ID:</strong> SIG-{Date.now()}
                </p>
                <p>
                  <strong>{t('signature.timestamp', 'Horodatage')}:</strong>{' '}
                  {new Date().toISOString()}
                </p>
                <p>
                  <strong>{t('signature.hash', 'Hash')}:</strong>{' '}
                  {selectedSignature?.hash?.slice(0, 16)}...
                </p>
              </div>
            </div>

            <Button onClick={onClose} className="w-full">
              {t('common.close', 'Fermer')}
            </Button>
          </div>
        );

      case 'refuse':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-advist-gold-light rounded-full flex items-center justify-center">
                <X size={32} className="text-advist-error" />
              </div>
              <h3 className="text-lg font-semibold text-[#383733]">
                {t('signature.refuseTitle', 'Refuser de signer')}
              </h3>
              <p className="text-sm text-[#3A4654] mt-2">
                {t(
                  'signature.refuseDesc',
                  'Veuillez indiquer le motif de votre refus. Cette action est définitive.'
                )}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#383733] mb-2">
                {t('signature.refuseReason', 'Motif du refus')} *
              </label>
              <textarea
                value={refuseReason}
                onChange={(e) => setRefuseReason(e.target.value)}
                placeholder={t(
                  'signature.refuseReasonPlaceholder',
                  'Expliquez pourquoi vous refusez de signer ce document...'
                )}
                className="w-full p-3 border border-[#EAEAEA] rounded-lg resize-none"
                rows={4}
              />
            </div>

            <div className="p-4 bg-advist-gold-light border border-advist-gold rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle size={18} className="text-advist-error shrink-0 mt-0.5" />
                <p className="text-sm text-advist-error">
                  {t(
                    'signature.refuseWarning',
                    'Attention : Le refus de signature bloquera le circuit de validation. Le Document Owner sera notifié.'
                  )}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => setCurrentStep('overview')} className="flex-1">
                {t('common.back', 'Retour')}
              </Button>
              <Button
                variant="danger"
                onClick={handleRefuse}
                disabled={!refuseReason.trim() || isSubmitting}
                className="flex-1"
              >
                {isSubmitting
                  ? t('common.loading', 'Chargement...')
                  : t('signature.confirmRefuse', 'Confirmer le refus')}
              </Button>
            </div>
          </div>
        );
    }
  };

  // Get modal title based on step
  const getModalTitle = () => {
    switch (currentStep) {
      case 'overview':
        return t('signature.modalTitle', 'Demande de signature');
      case 'consent':
        return 'Consentement obligatoire';
      case 'select-signature':
        return t('signature.selectSignature', 'Choisir une signature');
      case 'create-signature':
        return t('signature.createSignature', 'Créer une signature');
      case 'pin':
        return t('signature.verification', 'Vérification');
      case 'confirm':
        return t('signature.confirmation', 'Confirmation');
      case 'success':
        return t('signature.signed', 'Signé');
      case 'refuse':
        return t('signature.refusal', 'Refus de signature');
      default:
        return '';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={currentStep === 'success' ? onClose : undefined}
      title={getModalTitle()}
      size={currentStep === 'create-signature' ? 'lg' : 'md'}
    >
      {renderStepContent()}
    </Modal>
  );
};

export default SignatureModal;
