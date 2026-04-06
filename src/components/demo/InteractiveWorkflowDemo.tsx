/**
 * Interactive Workflow Demo Component
 * Professional simulation of document approval workflow
 */
import React, { useState, useEffect } from 'react';
import {
  FileText,
  _User,
  Check,
  X,
  _Clock,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Sparkles,
  Building2,
  Calendar,
  Euro,
  _ArrowRight,
  Play,
  Timer,
  Eye,
  Download,
  Shield,
} from 'lucide-react';

type WorkflowStatus = 'pending' | 'current' | 'approved' | 'rejected';

interface Approver {
  id: number;
  name: string;
  role: string;
  avatar: string;
  status: WorkflowStatus;
  comment?: string;
  date?: string;
}

const initialApprovers: Approver[] = [
  { id: 1, name: 'Sophie Martin', role: 'Responsable Achats', avatar: 'SM', status: 'pending' },
  { id: 2, name: 'Pierre Durand', role: 'Directeur Financier', avatar: 'PD', status: 'pending' },
  { id: 3, name: 'Marie Leclerc', role: 'Directrice Générale', avatar: 'ML', status: 'pending' },
];

const documentInfo = {
  name: 'Contrat_Prestataire_TechCorp_2025.pdf',
  type: 'Contrat de service',
  amount: '45 000 €',
  vendor: 'TechCorp Solutions',
  date: '15 janvier 2025',
  pages: 12,
};

export const InteractiveWorkflowDemo: React.FC = () => {
  const [approvers, setApprovers] = useState<Approver[]>(initialApprovers);
  const [currentStep, setCurrentStep] = useState(0);
  const [comment, setComment] = useState('');
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [wasRejected, setWasRejected] = useState(false);
  const [showIntro, setShowIntro] = useState(true);

  const currentApprover = approvers[currentStep];

  useEffect(() => {
    if (!isComplete && !showIntro) {
      setApprovers((prev) =>
        prev.map((a, i) => ({
          ...a,
          status: i < currentStep ? a.status : i === currentStep ? 'current' : 'pending',
        }))
      );
    }
  }, [currentStep, isComplete, showIntro]);

  const handleApprove = async () => {
    setIsProcessing(true);
    await new Promise((r) => setTimeout(r, 1000));

    const now = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    setApprovers((prev) =>
      prev.map((a, i) =>
        i === currentStep
          ? { ...a, status: 'approved', comment: comment || 'Approuvé', date: now }
          : a
      )
    );

    setComment('');
    setShowCommentBox(false);
    setIsProcessing(false);

    if (currentStep < approvers.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      setIsComplete(true);
    }
  };

  const handleReject = async () => {
    setIsProcessing(true);
    await new Promise((r) => setTimeout(r, 1000));

    const now = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    setApprovers((prev) =>
      prev.map((a, i) =>
        i === currentStep
          ? { ...a, status: 'rejected', comment: comment || 'Modifications requises', date: now }
          : a
      )
    );

    setComment('');
    setShowCommentBox(false);
    setIsProcessing(false);
    setIsComplete(true);
    setWasRejected(true);
  };

  const handleRestart = () => {
    setApprovers(
      initialApprovers.map((a) => ({
        ...a,
        status: 'pending',
        comment: undefined,
        date: undefined,
      }))
    );
    setCurrentStep(0);
    setComment('');
    setShowCommentBox(false);
    setIsComplete(false);
    setWasRejected(false);
    setShowIntro(true);
  };

  // Introduction Screen
  if (showIntro) {
    return (
      <div className="max-w-2xl mx-auto py-4">
        {/* Hero */}
        <div className="text-center mb-8">
          <div className="relative inline-block mb-4">
            <div className="w-20 h-20 bg-gray-900 rounded-2xl flex items-center justify-center shadow-xl shadow-gray-200">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center shadow-lg">
              <Check className="w-5 h-5 text-white" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Workflow de validation</h2>
          <p className="text-gray-500 max-w-md mx-auto">
            Simulez un circuit d'approbation multi-niveaux. Vous incarnerez chaque approbateur.
          </p>
        </div>

        {/* Document Card */}
        <div className="bg-gray-900 rounded-2xl p-6 mb-6 text-white">
          <div className="flex items-start gap-4">
            <div className="w-16 h-20 bg-white rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg">
              <FileText className="w-8 h-8 text-red-500" />
            </div>
            <div className="flex-1">
              <p className="text-white/60 text-xs uppercase tracking-wider mb-1">
                Document à valider
              </p>
              <h3 className="font-semibold text-lg mb-3">{documentInfo.name}</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-white/40" />
                  <span className="text-sm text-white/80">{documentInfo.vendor}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Euro className="w-4 h-4 text-white/40" />
                  <span className="text-sm text-white/80 font-semibold">{documentInfo.amount}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-white/40" />
                  <span className="text-sm text-white/80">{documentInfo.date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-white/40" />
                  <span className="text-sm text-white/80">{documentInfo.pages} pages</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Workflow Preview */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6">
          <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4 text-gray-900" />
            Circuit de validation (3 étapes)
          </h4>
          <div className="relative">
            {/* Connection Line */}
            <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-gray-200" />

            <div className="space-y-4">
              {initialApprovers.map((approver, index) => (
                <div key={approver.id} className="relative flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-100 border-2 border-gray-200 rounded-full flex items-center justify-center text-sm font-bold text-gray-600 z-10">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{approver.name}</p>
                    <p className="text-sm text-gray-500">{approver.role}</p>
                  </div>
                  <div className="px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-500">
                    En attente
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={() => setShowIntro(false)}
          className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition-all shadow-xl shadow-gray-200 hover:shadow-2xl hover:shadow-gray-300 hover:-translate-y-0.5"
        >
          <Play className="w-5 h-5" />
          Démarrer la simulation
        </button>

        <p className="text-center text-xs text-gray-400 mt-4">Durée estimée : 1 minute</p>
      </div>
    );
  }

  // Completion Screen
  if (isComplete) {
    return (
      <div className="max-w-2xl mx-auto py-4 text-center">
        <div
          className={`w-24 h-24 ${wasRejected ? 'bg-red-100' : 'bg-gray-100'} rounded-full flex items-center justify-center mx-auto mb-6`}
        >
          {wasRejected ? (
            <XCircle className="w-12 h-12 text-red-600" />
          ) : (
            <CheckCircle2 className="w-12 h-12 text-gray-900" />
          )}
        </div>

        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          {wasRejected ? 'Document refusé' : 'Validation terminée !'}
        </h3>
        <p className="text-gray-500 mb-8 max-w-sm mx-auto">
          {wasRejected
            ? 'Le document a été renvoyé pour modifications au demandeur.'
            : 'Toutes les approbations ont été obtenues. Le document peut être signé.'}
        </p>

        {/* Summary Card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6 text-left">
          <h4 className="text-sm font-semibold text-gray-900 mb-4">Récapitulatif</h4>
          <div className="space-y-3">
            {approvers.map((approver) => (
              <div key={approver.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                    approver.status === 'approved'
                      ? 'bg-gray-100 text-green-600'
                      : approver.status === 'rejected'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {approver.status === 'approved' ? (
                    <Check className="w-5 h-5" />
                  ) : approver.status === 'rejected' ? (
                    <X className="w-5 h-5" />
                  ) : (
                    approver.avatar
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{approver.name}</p>
                  <p className="text-xs text-gray-500">{approver.comment || 'En attente'}</p>
                </div>
                {approver.date && <span className="text-xs text-gray-400">{approver.date}</span>}
              </div>
            ))}
          </div>
        </div>

        {!wasRejected && (
          <div className="flex gap-3 mb-6">
            <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors">
              <Download className="w-4 h-4" />
              Télécharger
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-900 transition-colors">
              <FileText className="w-4 h-4" />
              Signer
            </button>
          </div>
        )}

        <button
          onClick={handleRestart}
          className="inline-flex items-center gap-2 px-6 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Recommencer
        </button>
      </div>
    );
  }

  // Main Workflow Screen
  return (
    <div className="max-w-2xl mx-auto py-4">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-medium text-gray-900">
              Étape {currentStep + 1} sur {approvers.length}
            </p>
            <p className="text-xs text-gray-500">Validation en cours</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900">
              {Math.round((currentStep / approvers.length) * 100)}%
            </p>
          </div>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gray-900 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${(currentStep / approvers.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Workflow Visual */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {approvers.map((approver, index) => (
          <React.Fragment key={approver.id}>
            <div className="flex flex-col items-center">
              <div
                className={`relative w-14 h-14 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500 ${
                  approver.status === 'approved'
                    ? 'bg-gray-900 text-white shadow-lg shadow-gray-200 scale-100'
                    : approver.status === 'rejected'
                      ? 'bg-red-500 text-white shadow-lg shadow-red-200'
                      : approver.status === 'current'
                        ? 'bg-gray-900 text-white shadow-lg shadow-gray-200 scale-110 ring-4 ring-gray-100'
                        : 'bg-gray-100 text-gray-400'
                }`}
              >
                {approver.status === 'approved' ? (
                  <Check className="w-6 h-6" />
                ) : approver.status === 'rejected' ? (
                  <X className="w-6 h-6" />
                ) : approver.status === 'current' ? (
                  <Timer className="w-6 h-6 animate-pulse" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
              <span
                className={`text-xs mt-2 font-medium truncate max-w-[60px] ${
                  approver.status === 'current' ? 'text-gray-900' : 'text-gray-500'
                }`}
              >
                {approver.name.split(' ')[0]}
              </span>
            </div>
            {index < approvers.length - 1 && (
              <div
                className={`w-12 h-1 rounded-full transition-all duration-500 ${
                  approver.status === 'approved' ? 'bg-green-400' : 'bg-gray-200'
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Current Approver Card */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        {/* Header */}
        <div className="bg-gray-900 px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-white font-bold text-lg">
              {currentApprover?.avatar}
            </div>
            <div className="flex-1">
              <p className="text-gray-100 text-xs uppercase tracking-wider">Vous êtes</p>
              <p className="text-white font-semibold text-lg">{currentApprover?.name}</p>
              <p className="text-gray-400 text-sm">{currentApprover?.role}</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Document Preview */}
          <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl mb-6">
            <div className="w-12 h-16 bg-white border border-gray-200 rounded-lg flex items-center justify-center shadow-sm">
              <FileText className="w-6 h-6 text-red-500" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-gray-900 truncate">{documentInfo.name}</h4>
              <p className="text-sm text-gray-500 mt-1">
                {documentInfo.vendor} • {documentInfo.amount}
              </p>
              <button className="inline-flex items-center gap-1 text-xs text-gray-900 hover:text-gray-800 mt-2">
                <Eye className="w-3 h-3" />
                Prévisualiser
              </button>
            </div>
          </div>

          {/* Comment Box */}
          {showCommentBox ? (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Votre commentaire
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Ex: Document conforme aux conditions négociées..."
                className="w-full p-4 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all"
                rows={3}
                autoFocus
              />
            </div>
          ) : (
            <button
              onClick={() => setShowCommentBox(true)}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              Ajouter un commentaire (optionnel)
            </button>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleReject}
              disabled={isProcessing}
              className="flex-1 flex items-center justify-center gap-2 px-5 py-4 border-2 border-red-200 text-red-600 rounded-xl font-semibold hover:bg-red-50 hover:border-red-300 transition-all disabled:opacity-50"
            >
              {isProcessing ? (
                <div className="w-5 h-5 border-2 border-red-200 border-t-red-500 rounded-full animate-spin" />
              ) : (
                <>
                  <X className="w-5 h-5" />
                  Refuser
                </>
              )}
            </button>
            <button
              onClick={handleApprove}
              disabled={isProcessing}
              className="flex-[2] flex items-center justify-center gap-2 px-5 py-4 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition-all disabled:opacity-50 shadow-lg shadow-gray-200"
            >
              {isProcessing ? (
                <div className="w-5 h-5 border-2 border-green-300 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  Approuver
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <p className="text-center text-xs text-gray-400 mt-4 flex items-center justify-center gap-1">
        <AlertCircle className="w-3 h-3" />
        Simulation interactive • Aucun document réel
      </p>
    </div>
  );
};

export default InteractiveWorkflowDemo;
