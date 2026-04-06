import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  PenTool,
  Eraser,
  _RotateCcw,
  Upload,
  Type,
  _Palette,
  Check,
  X,
  _Download,
  _Trash2,
  Image,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

export interface SignatureData {
  type: 'draw' | 'type' | 'upload';
  data: string; // Base64 encoded image
  timestamp: string;
  hash?: string;
}

export interface SignaturePadProps {
  onSave: (signature: SignatureData) => void;
  onCancel: () => void;
  existingSignature?: string;
  width?: number;
  height?: number;
  title?: string;
  showTypeOption?: boolean;
  showUploadOption?: boolean;
}

type SignatureMode = 'draw' | 'type' | 'upload';

const SIGNATURE_COLORS = ['#000000', '#1E3A8A', '#1F2937', '#4B5563'];
const SIGNATURE_FONTS = [
  { name: 'Dancing Script', style: 'cursive' },
  { name: 'Great Vibes', style: 'cursive' },
  { name: 'Pacifico', style: 'cursive' },
  { name: 'Satisfy', style: 'cursive' },
];

export const SignaturePad: React.FC<SignaturePadProps> = ({
  onSave,
  onCancel,
  existingSignature,
  width = 500,
  height = 200,
  _title,
  showTypeOption = true,
  showUploadOption = true,
}) => {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<SignatureMode>('draw');
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedColor, setSelectedColor] = useState(SIGNATURE_COLORS[0]);
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [hasDrawn, setHasDrawn] = useState(false);

  // Type mode state
  const [typedName, setTypedName] = useState('');
  const [selectedFont, setSelectedFont] = useState(SIGNATURE_FONTS[0]);

  // Upload mode state
  const [_uploadedImage, setUploadedImage] = useState<string | null>(null);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = width;
    canvas.height = height;

    // Set white background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw signature line
    ctx.strokeStyle = '#E5E7EB';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(30, height - 40);
    ctx.lineTo(width - 30, height - 40);
    ctx.stroke();

    // Add "Sign here" text
    ctx.fillStyle = '#9CA3AF';
    ctx.font = '12px sans-serif';
    ctx.fillText(t('signature.signHere', 'Signez ici'), 30, height - 20);

    // Load existing signature if any
    if (existingSignature) {
      const img = new window.Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        setHasDrawn(true);
      };
      img.src = existingSignature;
    }
  }, [width, height, existingSignature, t]);

  // Drawing handlers
  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (mode !== 'draw') return;
    setIsDrawing(true);
    setHasDrawn(true);

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let clientX: number, clientY: number;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = (clientX - rect.left) * (canvas.width / rect.width);
    const y = (clientY - rect.top) * (canvas.height / rect.height);

    ctx.strokeStyle = selectedColor;
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || mode !== 'draw') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let clientX: number, clientY: number;

    if ('touches' in e) {
      e.preventDefault();
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = (clientX - rect.left) * (canvas.width / rect.width);
    const y = (clientY - rect.top) * (canvas.height / rect.height);

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  // Clear canvas
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Redraw signature line
    ctx.strokeStyle = '#E5E7EB';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(30, height - 40);
    ctx.lineTo(width - 30, height - 40);
    ctx.stroke();

    ctx.fillStyle = '#9CA3AF';
    ctx.font = '12px sans-serif';
    ctx.fillText(t('signature.signHere', 'Signez ici'), 30, height - 20);

    setHasDrawn(false);
    setUploadedImage(null);
    setTypedName('');
  };

  // Render typed signature
  const renderTypedSignature = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !typedName) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear and set background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw typed signature
    ctx.fillStyle = selectedColor;
    ctx.font = `48px "${selectedFont.name}", ${selectedFont.style}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(typedName, canvas.width / 2, canvas.height / 2);

    // Draw signature line
    ctx.strokeStyle = '#E5E7EB';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(30, height - 40);
    ctx.lineTo(width - 30, height - 40);
    ctx.stroke();

    setHasDrawn(true);
  }, [typedName, selectedColor, selectedFont, width, height]);

  useEffect(() => {
    if (mode === 'type') {
      renderTypedSignature();
    }
  }, [mode, typedName, selectedColor, selectedFont, renderTypedSignature]);

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert(t('signature.invalidFileType', 'Veuillez sélectionner une image'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageData = event.target?.result as string;
      setUploadedImage(imageData);

      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const img = new window.Image();
      img.onload = () => {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Calculate scale to fit
        const scale = Math.min((canvas.width - 60) / img.width, (canvas.height - 60) / img.height);
        const x = (canvas.width - img.width * scale) / 2;
        const y = (canvas.height - img.height * scale) / 2;

        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
        setHasDrawn(true);
      };
      img.src = imageData;
    };
    reader.readAsDataURL(file);
  };

  // Save signature
  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasDrawn) return;

    const signatureData = canvas.toDataURL('image/png');

    // Generate simple hash for integrity
    const hash = btoa(signatureData.slice(-50));

    onSave({
      type: mode,
      data: signatureData,
      timestamp: new Date().toISOString(),
      hash,
    });
  };

  return (
    <div className="space-y-4">
      {/* Mode selector */}
      <div className="flex gap-2 border-b border-[#EAEAEA] pb-4">
        <button
          onClick={() => setMode('draw')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            mode === 'draw'
              ? 'bg-[#383733] text-white'
              : 'bg-[#EAEAEA] text-[#383733] hover:bg-[#D5D5D5]'
          }`}
        >
          <PenTool size={18} />
          {t('signature.draw', 'Dessiner')}
        </button>

        {showTypeOption && (
          <button
            onClick={() => {
              setMode('type');
              clearCanvas();
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              mode === 'type'
                ? 'bg-[#383733] text-white'
                : 'bg-[#EAEAEA] text-[#383733] hover:bg-[#D5D5D5]'
            }`}
          >
            <Type size={18} />
            {t('signature.type', 'Taper')}
          </button>
        )}

        {showUploadOption && (
          <button
            onClick={() => {
              setMode('upload');
              clearCanvas();
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              mode === 'upload'
                ? 'bg-[#383733] text-white'
                : 'bg-[#EAEAEA] text-[#383733] hover:bg-[#D5D5D5]'
            }`}
          >
            <Upload size={18} />
            {t('signature.upload', 'Importer')}
          </button>
        )}
      </div>

      {/* Drawing options */}
      {mode === 'draw' && (
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-[#3A4654]">{t('signature.color', 'Couleur')}:</span>
            <div className="flex gap-1">
              {SIGNATURE_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`w-6 h-6 rounded-full border-2 transition-transform ${
                    selectedColor === color ? 'border-[#383733] scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-[#3A4654]">{t('signature.thickness', 'Épaisseur')}:</span>
            <input
              type="range"
              min="1"
              max="5"
              value={strokeWidth}
              onChange={(e) => setStrokeWidth(Number(e.target.value))}
              className="w-20"
            />
          </div>

          <button
            onClick={clearCanvas}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-advist-error hover:bg-advist-gold-light rounded"
          >
            <Eraser size={16} />
            {t('signature.clear', 'Effacer')}
          </button>
        </div>
      )}

      {/* Type options */}
      {mode === 'type' && (
        <div className="space-y-4">
          <Input
            label={t('signature.yourName', 'Votre nom')}
            value={typedName}
            onChange={(e) => setTypedName(e.target.value)}
            placeholder={t('signature.enterName', 'Entrez votre nom')}
          />

          <div className="flex items-center gap-4">
            <span className="text-sm text-[#3A4654]">{t('signature.font', 'Police')}:</span>
            <div className="flex gap-2 flex-wrap">
              {SIGNATURE_FONTS.map((font) => (
                <button
                  key={font.name}
                  onClick={() => setSelectedFont(font)}
                  className={`px-3 py-1.5 rounded border transition-colors ${
                    selectedFont.name === font.name
                      ? 'border-[#383733] bg-[#383733] text-white'
                      : 'border-[#EAEAEA] hover:border-[#383733]'
                  }`}
                  style={{ fontFamily: `"${font.name}", ${font.style}` }}
                >
                  {typedName || 'Signature'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-[#3A4654]">{t('signature.color', 'Couleur')}:</span>
            <div className="flex gap-1">
              {SIGNATURE_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`w-6 h-6 rounded-full border-2 transition-transform ${
                    selectedColor === color ? 'border-[#383733] scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Upload options */}
      {mode === 'upload' && (
        <div className="space-y-4">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-[#EAEAEA] rounded-lg p-8 text-center cursor-pointer hover:border-[#383733] transition-colors"
          >
            <Image size={40} className="mx-auto mb-3 text-[#A29790]" />
            <p className="text-[#3A4654]">
              {t('signature.clickToUpload', 'Cliquez pour importer une image')}
            </p>
            <p className="text-sm text-[#A29790] mt-1">
              {t('signature.supportedFormats', 'PNG, JPG, GIF - Fond transparent recommandé')}
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      )}

      {/* Canvas */}
      <div className="border border-[#EAEAEA] rounded-lg overflow-hidden bg-white">
        <canvas
          ref={canvasRef}
          className={`w-full ${mode === 'draw' ? 'cursor-crosshair' : ''}`}
          style={{ touchAction: 'none' }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
      </div>

      {/* Security notice */}
      <div className="p-3 bg-advist-gold-light rounded-lg border border-advist-gold">
        <p className="text-sm text-advist-gray900">
          🔒{' '}
          {t(
            'signature.securityNotice',
            'Votre signature sera chiffrée et stockée de manière sécurisée. Elle ne pourra être utilisée que par vous.'
          )}
        </p>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-[#EAEAEA]">
        <Button variant="ghost" onClick={onCancel}>
          <X size={16} className="mr-2" />
          {t('common.cancel', 'Annuler')}
        </Button>
        <Button onClick={handleSave} disabled={!hasDrawn}>
          <Check size={16} className="mr-2" />
          {t('signature.save', 'Enregistrer la signature')}
        </Button>
      </div>
    </div>
  );
};

export default SignaturePad;
