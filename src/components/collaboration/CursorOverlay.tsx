/**
 * Cursor Overlay Component
 * Shows other users' cursors on the document canvas
 */
import React, { useEffect, useState } from 'react';
import { CursorPosition } from '../../hooks/useDocumentCollaboration';

interface CursorOverlayProps {
  cursors: Map<string, CursorPosition>;
  currentPage: number;
  containerRef: React.RefObject<HTMLElement>;
  scale?: number;
}

export const CursorOverlay: React.FC<CursorOverlayProps> = ({
  cursors,
  currentPage,
  _containerRef,
  scale = 1,
}) => {
  // Filter cursors to only show those on the current page
  const visibleCursors = Array.from(cursors.values()).filter(
    (cursor) => cursor.page === currentPage
  );

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {visibleCursors.map((cursor) => (
        <CursorPointer key={cursor.userId} cursor={cursor} scale={scale} />
      ))}
    </div>
  );
};

interface CursorPointerProps {
  cursor: CursorPosition;
  scale: number;
}

const CursorPointer: React.FC<CursorPointerProps> = ({ cursor, scale }) => {
  const [isVisible, setIsVisible] = useState(true);

  // Hide cursor after inactivity
  useEffect(() => {
    setIsVisible(true);
    const timeout = setTimeout(() => {
      setIsVisible(false);
    }, 5000);
    return () => clearTimeout(timeout);
  }, [cursor.x, cursor.y]);

  if (!isVisible) return null;

  return (
    <div
      className="absolute transition-all duration-75 ease-out"
      style={{
        left: cursor.x * scale,
        top: cursor.y * scale,
        transform: 'translate(-2px, -2px)',
      }}
    >
      {/* Cursor SVG */}
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-md"
      >
        <path
          d="M5.65685 4.92893L19.0711 11.6066L12.3934 14.0503L9.94975 20.7279L5.65685 4.92893Z"
          fill={cursor.userColor}
          stroke="white"
          strokeWidth="1.5"
        />
      </svg>

      {/* User label */}
      <div
        className="absolute left-4 top-4 px-2 py-0.5 rounded text-xs font-medium text-white whitespace-nowrap shadow-md"
        style={{ backgroundColor: cursor.userColor }}
      >
        {cursor.userName}
      </div>

      {/* Selection highlight */}
      {cursor.selection && (
        <SelectionHighlight selection={cursor.selection} color={cursor.userColor} scale={scale} />
      )}
    </div>
  );
};

interface SelectionHighlightProps {
  selection: {
    start: { x: number; y: number };
    end: { x: number; y: number };
  };
  color: string;
  scale: number;
}

const SelectionHighlight: React.FC<SelectionHighlightProps> = ({ selection, color, scale }) => {
  const width = Math.abs(selection.end.x - selection.start.x) * scale;
  const height = Math.abs(selection.end.y - selection.start.y) * scale;
  const left = Math.min(selection.start.x, selection.end.x) * scale;
  const top = Math.min(selection.start.y, selection.end.y) * scale;

  return (
    <div
      className="absolute opacity-20 pointer-events-none"
      style={{
        left,
        top,
        width,
        height,
        backgroundColor: color,
      }}
    />
  );
};

/**
 * Hook to track cursor position and send updates
 */
export function useCursorTracking(
  containerRef: React.RefObject<HTMLElement>,
  currentPage: number,
  onCursorMove: (page: number, x: number, y: number, selection?: any) => void,
  throttleMs: number = 50
) {
  const lastUpdate = React.useRef<number>(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now();
      if (now - lastUpdate.current < throttleMs) return;
      lastUpdate.current = now;

      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      onCursorMove(currentPage, x, y);
    };

    container.addEventListener('mousemove', handleMouseMove);
    return () => container.removeEventListener('mousemove', handleMouseMove);
  }, [containerRef, currentPage, onCursorMove, throttleMs]);
}

export default CursorOverlay;
