/**
 * Interactive Signature Demo Component
 * Professional electronic signature simulation
 */
import React, { useState, useRef, useEffect } from 'react';
import {
  FileText,
  PenTool,
  CheckCircle,
  Shield,
  Download,
  RotateCcw,
  _Sparkles,
  _Lock,
  _Calendar,
  User,
  AlertCircle,
  Play,
  Type,
  Pencil,
  _Check,
  _X,
  _Clock,
  Award,
  Eye,
  ChevronRight,
  Fingerprint,
} from 'lucide-react';

type SignatureMode = 'draw' | 'type';
type Step = 'intro' | 'preview' | 'position' | 'sign' | 'confirm' | 'complete';

export const InteractiveSignatureDemo: React.FC = () => {
  const [step, setStep] = useState<Step>('intro');
  const [signatureMode, setSignatureMode] = useState<SignatureMode>('draw');
  const [typedSignature, setTypedSignature] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [_signaturePosition, _setSignaturePosition] = useState({ x: 50, y: 75 });
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const documentInfo = {
    name: 'Contrat_Service_Premium_2026.pdf',
    type: 'Contrat de service',
    client: 'Groupe Diakité & Associés',
    pages: 8,
    signatureRequired: 'Page 8 - Zone de signature',
  };

  // Canvas setup
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = '#1a365d';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, [step]);

  const getCanvasCoordinates = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    e.preventDefault();
    setIsDrawing(true);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCanvasCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCanvasCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      setSignatureData(canvas.toDataURL());
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureData(null);
  };

  const handleConfirmSignature = async () => {
    setIsProcessing(true);
    await new Promise((r) => setTimeout(r, 2000));
    setStep('complete');
    setIsProcessing(false);
  };

  const resetDemo = () => {
    setStep('intro');
    setSignatureMode('draw');
    setTypedSignature('');
    setSignatureData(null);
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  const hasSignature = signatureMode === 'draw' ? signatureData : typedSignature.length > 2;

  // Intro Screen
  if (step === 'intro') {
    return (
      <div className="max-w-2xl mx-auto py-4">
        <div className="text-center mb-8">
          <div className="relative inline-block mb-4">
            <div className="w-20 h-20 bg-[#131C2E] rounded-2xl flex items-center justify-center shadow-xl shadow-[#E8E2D6]">
              <PenTool className="w-10 h-10 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-[#131C2E] rounded-lg flex items-center justify-center shadow-lg">
              <Shield className="w-4 h-4 text-white" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-[#131C2E] mb-3">Signature électronique</h2>
          <p className="text-[#78716A] max-w-md mx-auto">
            Signez un document en toute légalité avec certificat et horodatage automatique.
          </p>
        </div>

        {/* Document Card */}
        <div className="bg-[#131C2E] rounded-2xl p-6 mb-6 text-white">
          <div className="flex items-start gap-4">
            <div className="w-16 h-20 bg-white rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg">
              <FileText className="w-8 h-8 text-red-500" />
            </div>
            <div className="flex-1">
              <p className="text-white/60 text-xs uppercase tracking-wider mb-1">
                Document à signer
              </p>
              <h3 className="font-semibold text-lg mb-3">{documentInfo.name}</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-white/40" />
                  <span className="text-sm text-white/80">{documentInfo.client}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-white/40" />
                  <span className="text-sm text-white/80">{documentInfo.pages} pages</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Process Preview */}
        <div className="bg-white border border-[#E8E2D6] rounded-2xl p-6 mb-6">
          <h4 className="text-sm font-semibold text-[#131C2E] mb-4">Étapes de signature</h4>
          <div className="space-y-3">
            {[
              { icon: Eye, label: 'Prévisualiser le document', desc: 'Vérifiez le contenu' },
              { icon: PenTool, label: 'Créer votre signature', desc: 'Dessinez ou tapez' },
              { icon: Shield, label: 'Validation sécurisée', desc: 'Certificat + horodatage' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-10 h-10 bg-[#FAF7F1] rounded-xl flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-5 h-5 text-[#131C2E]" />
                </div>
                <div>
                  <p className="font-medium text-[#131C2E]">{item.label}</p>
                  <p className="text-sm text-[#78716A]">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={() => setStep('preview')}
          className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-[#131C2E] text-white rounded-xl font-semibold hover:bg-[#1B2740] transition-all shadow-xl shadow-[#E8E2D6]"
        >
          <Play className="w-5 h-5" />
          Commencer
        </button>
      </div>
    );
  }

  // Document Preview
  if (step === 'preview') {
    return (
      <div className="max-w-2xl mx-auto py-4">
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-[#78716A] mb-2">
            <span className="w-6 h-6 bg-[#131C2E] text-white rounded-full flex items-center justify-center text-xs font-bold">
              1
            </span>
            <span>Prévisualisation du document</span>
          </div>
          <h3 className="text-xl font-bold text-[#131C2E]">Vérifiez le contenu</h3>
        </div>

        {/* Document Preview */}
        <div className="bg-white border border-[#E8E2D6] rounded-2xl overflow-hidden mb-6 shadow-sm">
          <div className="bg-[#FAF7F1] px-4 py-3 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-red-500" />
              <span className="text-sm font-medium text-[#131C2E]">{documentInfo.name}</span>
            </div>
            <span className="text-xs text-[#78716A]">Page 1 / {documentInfo.pages}</span>
          </div>
          <div className="p-6 bg-white">
            <div className="prose prose-sm max-w-none">
              <h4 className="text-lg font-bold text-[#131C2E] mb-4">CONTRAT DE SERVICE PREMIUM</h4>
              <p className="text-[#57534E] mb-3">
                <strong>Entre les soussignés :</strong>
              </p>
              <p className="text-[#57534E] mb-2 ml-4">
                • <strong>ADVIST SARL</strong>, société à responsabilité limitée au capital de 65
                000 000 FCFA, dont le siège social est situé à Abidjan, Côte d'Ivoire, immatriculée
                au RCCM...
              </p>
              <p className="text-[#57534E] mb-4 ml-4">
                • <strong>Groupe Diakité &amp; Associés</strong>, représenté par Monsieur Moussa
                Diakité, Directeur Général...
              </p>
              <p className="text-[#57534E] mb-3">
                <strong>Article 1 - Objet du contrat</strong>
              </p>
              <p className="text-[#57534E] mb-3">
                Le présent contrat a pour objet de définir les conditions dans lesquelles ADVIST
                fournira ses services de gestion documentaire et de signature électronique...
              </p>
              <p className="text-[#57534E]">
                <strong>Article 2 - Durée</strong>
              </p>
              <p className="text-[#57534E]">
                Le contrat est conclu pour une durée de 12 mois à compter de sa signature...
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-dashed border-[#E8E2D6]">
              <p className="text-xs text-[#A39B8F] text-center">
                Faites défiler pour voir le reste du document...
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setStep('intro')}
            className="px-6 py-3 border border-[#E8E2D6] rounded-xl hover:bg-[#FAF7F1] transition-colors"
          >
            Retour
          </button>
          <button
            onClick={() => setStep('sign')}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-[#131C2E] text-white rounded-xl hover:bg-[#1B2740] transition-colors"
          >
            J'ai lu, passer à la signature
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // Signature Step
  if (step === 'sign') {
    return (
      <div className="max-w-2xl mx-auto py-4">
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-[#78716A] mb-2">
            <span className="w-6 h-6 bg-[#131C2E] text-white rounded-full flex items-center justify-center text-xs font-bold">
              2
            </span>
            <span>Création de votre signature</span>
          </div>
          <h3 className="text-xl font-bold text-[#131C2E]">Signez le document</h3>
        </div>

        {/* Signature Mode Selector */}
        <div className="flex gap-2 p-1 bg-[#F1ECE1] rounded-xl mb-6">
          <button
            onClick={() => {
              setSignatureMode('draw');
              clearCanvas();
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all ${
              signatureMode === 'draw'
                ? 'bg-white text-[#131C2E] shadow-sm'
                : 'text-[#78716A] hover:text-[#44403A]'
            }`}
          >
            <Pencil className="w-4 h-4" />
            Dessiner
          </button>
          <button
            onClick={() => {
              setSignatureMode('type');
              setTypedSignature('');
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all ${
              signatureMode === 'type'
                ? 'bg-white text-[#131C2E] shadow-sm'
                : 'text-[#78716A] hover:text-[#44403A]'
            }`}
          >
            <Type className="w-4 h-4" />
            Taper
          </button>
        </div>

        {/* Signature Area */}
        <div className="bg-white border border-[#E8E2D6] rounded-2xl overflow-hidden mb-6">
          <div className="bg-[#FAF7F1] px-4 py-3 border-b">
            <p className="text-sm text-[#57534E]">
              {signatureMode === 'draw'
                ? 'Dessinez votre signature avec la souris ou le doigt'
                : 'Tapez votre nom complet'}
            </p>
          </div>

          {signatureMode === 'draw' ? (
            <div className="p-4">
              <div className="relative bg-[#fafafa] rounded-xl border-2 border-dashed border-[#D8CFBF] overflow-hidden">
                <canvas
                  ref={canvasRef}
                  width={500}
                  height={180}
                  className="w-full cursor-crosshair touch-none"
                  style={{ touchAction: 'none' }}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                />
                {!signatureData && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <PenTool className="w-8 h-8 text-[#D8CFBF] mb-2" />
                    <p className="text-[#A39B8F] text-sm">Signez ici</p>
                  </div>
                )}
                {/* Signature line */}
                <div className="absolute bottom-8 left-8 right-8 border-b border-[#D8CFBF]" />
                <div className="absolute bottom-4 left-8 text-xs text-[#A39B8F]">Signature</div>
              </div>
              {signatureData && (
                <button
                  onClick={clearCanvas}
                  className="mt-3 flex items-center gap-1 text-sm text-[#78716A] hover:text-red-500 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  Effacer et recommencer
                </button>
              )}
            </div>
          ) : (
            <div className="p-6">
              <input
                type="text"
                value={typedSignature}
                onChange={(e) => setTypedSignature(e.target.value)}
                placeholder="Votre nom complet..."
                className="w-full px-4 py-4 text-center text-2xl border-b-2 border-[#E8E2D6] focus:border-[#131C2E] outline-none transition-colors"
                style={{ fontFamily: "'Dancing Script', cursive" }}
              />
              {typedSignature && (
                <div className="mt-6 p-6 bg-[#FAF7F1] rounded-xl border border-[#E8E2D6]">
                  <p className="text-xs text-[#78716A] text-center mb-2">
                    Aperçu de votre signature
                  </p>
                  <p
                    className="text-3xl text-center text-[#131C2E]"
                    style={{ fontFamily: "'Dancing Script', cursive" }}
                  >
                    {typedSignature}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Legal Notice */}
        <div className="bg-[#FAF7F1] border border-[#E8E2D6] rounded-xl p-4 mb-6">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-[#131C2E] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-[#1B2740] mb-1">Engagement légal</p>
              <p className="text-sm text-[#44403A]">
                En signant, vous acceptez que cette signature électronique ait la même valeur
                juridique qu'une signature manuscrite (règlement eIDAS).
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => setStep('preview')}
            className="px-6 py-3 border border-[#E8E2D6] rounded-xl hover:bg-[#FAF7F1] transition-colors"
          >
            Retour
          </button>
          <button
            onClick={() => setStep('confirm')}
            disabled={!hasSignature}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-[#131C2E] text-white rounded-xl hover:bg-[#1B2740] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continuer
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // Confirmation Step
  if (step === 'confirm') {
    return (
      <div className="max-w-2xl mx-auto py-4">
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-[#78716A] mb-2">
            <span className="w-6 h-6 bg-[#131C2E] text-white rounded-full flex items-center justify-center text-xs font-bold">
              3
            </span>
            <span>Validation finale</span>
          </div>
          <h3 className="text-xl font-bold text-[#131C2E]">Confirmez votre signature</h3>
        </div>

        {/* Summary Card */}
        <div className="bg-white border border-[#E8E2D6] rounded-2xl overflow-hidden mb-6">
          <div className="p-6 border-b">
            <div className="flex items-start gap-4">
              <div className="w-12 h-16 bg-[#F1ECE1] rounded-lg flex items-center justify-center flex-shrink-0">
                <FileText className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h4 className="font-medium text-[#131C2E]">{documentInfo.name}</h4>
                <p className="text-sm text-[#78716A] mt-1">
                  {documentInfo.client} • {documentInfo.pages} pages
                </p>
              </div>
            </div>
          </div>

          {/* Signature Preview */}
          <div className="p-6 bg-[#FAF7F1]">
            <p className="text-sm text-[#57534E] mb-3">Votre signature :</p>
            <div className="bg-white border border-[#E8E2D6] rounded-xl p-4">
              {signatureMode === 'draw' && signatureData ? (
                <img src={signatureData} alt="Signature" className="max-h-20 mx-auto" />
              ) : (
                <p
                  className="text-2xl text-center text-[#131C2E]"
                  style={{ fontFamily: "'Dancing Script', cursive" }}
                >
                  {typedSignature}
                </p>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="p-6 space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-[#F1ECE1]">
              <span className="text-sm text-[#78716A]">Signataire</span>
              <span className="text-sm font-medium text-[#131C2E]">Jean-Baptiste Mensah</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-[#F1ECE1]">
              <span className="text-sm text-[#78716A]">Date et heure</span>
              <span className="text-sm font-medium text-[#131C2E]">
                {new Date().toLocaleString('fr-FR')}
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-[#78716A]">Certification</span>
              <div className="flex items-center gap-1 text-[#131C2E]">
                <Shield className="w-4 h-4" />
                <span className="text-sm font-medium">eIDAS Qualifié</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => setStep('sign')}
            className="px-6 py-4 border border-[#E8E2D6] rounded-xl hover:bg-[#FAF7F1] transition-colors"
          >
            Modifier
          </button>
          <button
            onClick={handleConfirmSignature}
            disabled={isProcessing}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-[#131C2E] text-white rounded-xl font-semibold hover:bg-[#1B2740] transition-all disabled:opacity-70 shadow-lg shadow-[#E8E2D6]"
          >
            {isProcessing ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Signature en cours...
              </>
            ) : (
              <>
                <Fingerprint className="w-5 h-5" />
                Signer définitivement
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // Complete Step
  if (step === 'complete') {
    return (
      <div className="max-w-2xl mx-auto py-4 text-center">
        <div className="w-24 h-24 bg-[#F1ECE1] rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-12 h-12 text-[#131C2E]" />
        </div>

        <h3 className="text-2xl font-bold text-[#131C2E] mb-2">Document signé !</h3>
        <p className="text-[#78716A] mb-8 max-w-sm mx-auto">
          Votre signature électronique a été appliquée avec succès. Le document est légalement
          valide.
        </p>

        {/* Certificate Card */}
        <div className="bg-[#131C2E] rounded-2xl p-6 mb-6 text-left text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-[#131C2E] rounded-xl flex items-center justify-center">
              <Award className="w-6 h-6 text-white" />
            </div>
            <div>
              <h4 className="font-semibold">Certificat de signature</h4>
              <p className="text-sm text-white/60">Document certifié conforme</p>
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-white/10">
              <span className="text-white/60">Document</span>
              <span className="font-medium">{documentInfo.name}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-white/10">
              <span className="text-white/60">Signataire</span>
              <span className="font-medium">Jean-Baptiste Mensah</span>
            </div>
            <div className="flex justify-between py-2 border-b border-white/10">
              <span className="text-white/60">Date de signature</span>
              <span className="font-medium">{new Date().toLocaleString('fr-FR')}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-white/10">
              <span className="text-white/60">Niveau de certification</span>
              <span className="text-green-500 font-medium">eIDAS Qualifié</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-white/60">Empreinte SHA-256</span>
              <span className="font-mono text-xs">a7f3...8d4e</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={resetDemo}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 border border-[#E8E2D6] rounded-xl hover:bg-[#FAF7F1] transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Recommencer
          </button>
          <button className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-[#131C2E] text-white rounded-xl hover:bg-[#1B2740] transition-colors">
            <Download className="w-4 h-4" />
            Télécharger
          </button>
        </div>

        <p className="text-xs text-[#A39B8F] mt-6 flex items-center justify-center gap-1">
          <AlertCircle className="w-3 h-3" />
          Simulation interactive • Aucun document réel signé
        </p>
      </div>
    );
  }

  return null;
};

export default InteractiveSignatureDemo;
