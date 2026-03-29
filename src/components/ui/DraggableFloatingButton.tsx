/**
 * Draggable Floating Button Component
 * A reusable floating button that can be dragged around the screen
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';

interface Position {
  x: number;
  y: number;
}

interface DraggableFloatingButtonProps {
  children: React.ReactNode;
  defaultPosition?: Position;
  storageKey?: string;
  className?: string;
  zIndex?: number;
  onPositionChange?: (position: Position) => void;
}

export const DraggableFloatingButton: React.FC<DraggableFloatingButtonProps> = ({
  children,
  defaultPosition = { x: window.innerWidth - 80, y: window.innerHeight - 80 },
  storageKey,
  className = '',
  zIndex = 50,
  onPositionChange,
}) => {
  const [position, setPosition] = useState<Position>(() => {
    if (storageKey) {
      const saved = localStorage.getItem(`floating-btn-${storageKey}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          // Validate position is within viewport
          return {
            x: Math.min(Math.max(0, parsed.x), window.innerWidth - 60),
            y: Math.min(Math.max(0, parsed.y), window.innerHeight - 60),
          };
        } catch {
          return defaultPosition;
        }
      }
    }
    return defaultPosition;
  });

  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const buttonRef = useRef<HTMLDivElement>(null);
  const dragStartTime = useRef<number>(0);
  const hasMoved = useRef(false);

  // Save position to localStorage
  useEffect(() => {
    if (storageKey && !isDragging) {
      localStorage.setItem(`floating-btn-${storageKey}`, JSON.stringify(position));
    }
  }, [position, storageKey, isDragging]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setPosition(prev => ({
        x: Math.min(prev.x, window.innerWidth - 60),
        y: Math.min(prev.y, window.innerHeight - 60),
      }));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
      setIsDragging(true);
      dragStartTime.current = Date.now();
      hasMoved.current = false;
    }
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (buttonRef.current && e.touches.length === 1) {
      const touch = e.touches[0];
      const rect = buttonRef.current.getBoundingClientRect();
      setDragOffset({
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      });
      setIsDragging(true);
      dragStartTime.current = Date.now();
      hasMoved.current = false;
    }
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        hasMoved.current = true;
        const newX = Math.min(Math.max(0, e.clientX - dragOffset.x), window.innerWidth - 60);
        const newY = Math.min(Math.max(0, e.clientY - dragOffset.y), window.innerHeight - 60);
        setPosition({ x: newX, y: newY });
        onPositionChange?.({ x: newX, y: newY });
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isDragging && e.touches.length === 1) {
        hasMoved.current = true;
        const touch = e.touches[0];
        const newX = Math.min(Math.max(0, touch.clientX - dragOffset.x), window.innerWidth - 60);
        const newY = Math.min(Math.max(0, touch.clientY - dragOffset.y), window.innerHeight - 60);
        setPosition({ x: newX, y: newY });
        onPositionChange?.({ x: newX, y: newY });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, dragOffset, onPositionChange]);

  return (
    <div
      ref={buttonRef}
      className={`fixed ${className}`}
      style={{
        left: position.x,
        top: position.y,
        zIndex,
        cursor: isDragging ? 'grabbing' : 'grab',
        touchAction: 'none',
        userSelect: 'none',
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      {children}
    </div>
  );
};

/**
 * Hook to check if a drag occurred vs a click
 * Use this to prevent click events after dragging
 */
export const useDragDetection = () => {
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);
  const wasDragged = useRef(false);

  const onDragStart = (x: number, y: number) => {
    dragStartPos.current = { x, y };
    wasDragged.current = false;
  };

  const onDragMove = (x: number, y: number) => {
    if (dragStartPos.current) {
      const dx = Math.abs(x - dragStartPos.current.x);
      const dy = Math.abs(y - dragStartPos.current.y);
      if (dx > 5 || dy > 5) {
        wasDragged.current = true;
      }
    }
  };

  const onDragEnd = () => {
    dragStartPos.current = null;
    const dragged = wasDragged.current;
    setTimeout(() => {
      wasDragged.current = false;
    }, 100);
    return dragged;
  };

  return { wasDragged, onDragStart, onDragMove, onDragEnd };
};

export default DraggableFloatingButton;
