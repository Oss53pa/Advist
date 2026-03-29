/**
 * SignatureCanvas — SVG-based signature drawing using perfect-freehand
 *
 * Two modes: signature (180px tall) and paraphe/initials (100px tall).
 * Supports mouse, touch, and stylus (with real pressure detection).
 * Renders smooth SVG quadratic curves. Exports PNG via SVG → Canvas → dataURL.
 */
import React, { useState, useRef, useCallback, useMemo } from 'react';
import { getStroke } from 'perfect-freehand';
import { RotateCcw, Trash2, Check } from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SignatureCanvasMode = 'signature' | 'paraphe';

export interface SignatureCanvasProps {
  mode?: SignatureCanvasMode;
  width?: number;
  onValidate: (dataUrl: string) => void;
  onCancel?: () => void;
  strokeColor?: string;
  className?: string;
}

interface Point {
  x: number;
  y: number;
  pressure: number;
}

type Stroke = Point[];

// ---------------------------------------------------------------------------
// Helpers — convert perfect-freehand output to SVG path
// ---------------------------------------------------------------------------

function average(a: number, b: number) {
  return (a + b) / 2;
}

/** Build an SVG <path> `d` attribute from perfect-freehand outline points. */
function getSvgPathFromStroke(points: number[][]): string {
  if (points.length === 0) return '';

  const len = points.length;

  if (len < 3) {
    // Dot — draw a tiny circle
    const [x, y] = points[0];
    return `M ${x} ${y} L ${x + 0.01} ${y + 0.01}`;
  }

  let d = `M ${points[0][0]} ${points[0][1]} `;

  for (let i = 1; i < len - 1; i++) {
    const [x0, y0] = points[i];
    const [x1, y1] = points[i + 1];
    d += `Q ${x0} ${y0} ${average(x0, x1)} ${average(y0, y1)} `;
  }

  // Close back to start for filled shape
  d += 'Z';
  return d;
}

// ---------------------------------------------------------------------------
// perfect-freehand options per mode
// ---------------------------------------------------------------------------

const FREEHAND_OPTIONS = {
  signature: {
    size: 6,
    thinning: 0.5,
    smoothing: 0.5,
    streamline: 0.5,
    easing: (t: number) => t,
    start: { taper: 0, cap: true },
    end: { taper: 25, cap: true },
    simulatePressure: false, // will be overridden at runtime
  },
  paraphe: {
    size: 4,
    thinning: 0.4,
    smoothing: 0.5,
    streamline: 0.4,
    easing: (t: number) => t,
    start: { taper: 0, cap: true },
    end: { taper: 15, cap: true },
    simulatePressure: false,
  },
} as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const SignatureCanvas: React.FC<SignatureCanvasProps> = ({
  mode = 'signature',
  width = 500,
  onValidate,
  onCancel,
  strokeColor = '#171717',
  className,
}) => {
  const height = mode === 'signature' ? 180 : 100;

  const svgRef = useRef<SVGSVGElement>(null);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
  const [hasPressure, setHasPressure] = useState(false);

  // ------- Pointer helpers -------

  const getPoint = useCallback(
    (e: React.PointerEvent<SVGSVGElement>): Point => {
      const svg = svgRef.current;
      if (!svg) return { x: 0, y: 0, pressure: 0.5 };

      const rect = svg.getBoundingClientRect();
      const scaleX = width / rect.width;
      const scaleY = height / rect.height;

      const pressure = e.pressure !== undefined && e.pressure > 0 ? e.pressure : 0.5;
      if (pressure !== 0.5) setHasPressure(true);

      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
        pressure,
      };
    },
    [width, height],
  );

  // ------- Pointer events -------

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      e.preventDefault();
      (e.target as Element).setPointerCapture(e.pointerId);
      setCurrentStroke([getPoint(e)]);
    },
    [getPoint],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (!currentStroke) return;
      e.preventDefault();
      setCurrentStroke(prev => (prev ? [...prev, getPoint(e)] : null));
    },
    [currentStroke, getPoint],
  );

  const handlePointerUp = useCallback(() => {
    if (currentStroke && currentStroke.length > 0) {
      setStrokes(prev => [...prev, currentStroke]);
    }
    setCurrentStroke(null);
  }, [currentStroke]);

  // ------- Render strokes -------

  const freehandOptions = useMemo(
    () => ({
      ...FREEHAND_OPTIONS[mode],
      simulatePressure: !hasPressure,
    }),
    [mode, hasPressure],
  );

  const renderedPaths = useMemo(() => {
    return strokes.map((stroke) => {
      const inputPoints = stroke.map(p => [p.x, p.y, p.pressure]);
      const outlinePoints = getStroke(inputPoints, freehandOptions);
      return getSvgPathFromStroke(outlinePoints);
    });
  }, [strokes, freehandOptions]);

  const currentPath = useMemo(() => {
    if (!currentStroke || currentStroke.length === 0) return '';
    const inputPoints = currentStroke.map(p => [p.x, p.y, p.pressure]);
    const outlinePoints = getStroke(inputPoints, freehandOptions);
    return getSvgPathFromStroke(outlinePoints);
  }, [currentStroke, freehandOptions]);

  const isEmpty = strokes.length === 0 && !currentStroke;

  // ------- Actions -------

  const handleUndo = useCallback(() => {
    setStrokes(prev => prev.slice(0, -1));
  }, []);

  const handleClear = useCallback(() => {
    setStrokes([]);
    setCurrentStroke(null);
  }, []);

  const handleValidate = useCallback(async () => {
    const svg = svgRef.current;
    if (!svg || isEmpty) return;

    // Serialize SVG to string
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svg);
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    // Draw on canvas for PNG export
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      // Export at 2x for retina sharpness
      canvas.width = width * 2;
      canvas.height = height * 2;
      const ctx = canvas.getContext('2d')!;
      ctx.scale(2, 2);
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);

      const dataUrl = canvas.toDataURL('image/png');
      onValidate(dataUrl);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }, [isEmpty, width, height, onValidate]);

  // ------- Render -------

  return (
    <div className={className}>
      {/* Label */}
      <p className="text-xs font-medium text-gray-500 mb-2">
        {mode === 'signature' ? 'Signature' : 'Paraphe'}
      </p>

      {/* SVG drawing area */}
      <div className="relative rounded-xl border-2 border-dashed border-gray-300 bg-white overflow-hidden">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          width="100%"
          style={{ touchAction: 'none', display: 'block' }}
          className="cursor-crosshair"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* White background for export */}
          <rect width={width} height={height} fill="white" />

          {/* Baseline guide */}
          <line
            x1={20}
            y1={height - 30}
            x2={width - 20}
            y2={height - 30}
            stroke="#e5e5e5"
            strokeWidth={1}
            strokeDasharray="4 4"
          />

          {/* Committed strokes */}
          {renderedPaths.map((d, i) => (
            <path key={i} d={d} fill={strokeColor} stroke="none" />
          ))}

          {/* Current (live) stroke */}
          {currentPath && (
            <path d={currentPath} fill={strokeColor} stroke="none" />
          )}
        </svg>

        {/* Empty placeholder */}
        {isEmpty && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-gray-300 text-sm select-none">
              {mode === 'signature' ? 'Signez ici' : 'Paraphez ici'}
            </p>
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mt-3">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleUndo}
            disabled={strokes.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Annuler
          </button>
          <button
            type="button"
            onClick={handleClear}
            disabled={isEmpty}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Effacer
          </button>
        </div>

        <div className="flex gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
          )}
          <button
            type="button"
            onClick={handleValidate}
            disabled={isEmpty}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
            Valider
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignatureCanvas;
