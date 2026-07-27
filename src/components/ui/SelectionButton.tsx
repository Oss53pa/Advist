import React from 'react';
import { Check } from 'lucide-react';

interface SelectionButtonProps {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  showCheck?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * A selectable button component used for theme customization options.
 * Shows a selected/unselected state with consistent styling.
 */
export const SelectionButton: React.FC<SelectionButtonProps> = ({
  selected,
  onClick,
  children,
  showCheck = false,
  className = '',
  style,
}) => {
  return (
    <button
      onClick={onClick}
      className={`
        relative p-4 rounded-xl border-2 text-center transition-all duration-240
        ${
          selected
            ? 'border-advist-blue-light bg-advist-gold-light/10 shadow-sm'
            : 'border-advist-border hover:border-advist-blue-light/50'
        }
        ${className}
      `}
      style={style}
    >
      {children}
      {showCheck && selected && (
        <div className="absolute top-2 right-2 w-5 h-5 bg-advist-gold-light rounded-full flex items-center justify-center">
          <Check size={12} className="text-white" />
        </div>
      )}
    </button>
  );
};

export default SelectionButton;
