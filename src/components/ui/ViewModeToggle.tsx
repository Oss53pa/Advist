import React from 'react';
import { LayoutGrid, List } from 'lucide-react';

type ViewMode = 'grid' | 'table';

interface ViewModeToggleProps {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
  className?: string;
}

export const ViewModeToggle: React.FC<ViewModeToggleProps> = ({
  value,
  onChange,
  className = '',
}) => {
  return (
    <div
      className={`flex items-center border border-advist-border rounded-xl overflow-hidden ${className}`}
    >
      <button
        type="button"
        onClick={() => onChange('grid')}
        className={`p-2 transition-all duration-240 ${
          value === 'grid' ? 'bg-advist-dark text-white' : 'text-advist-gray900 hover:bg-advist-bg'
        }`}
        title="Vue grille"
      >
        <LayoutGrid size={20} />
      </button>
      <button
        type="button"
        onClick={() => onChange('table')}
        className={`p-2 transition-all duration-240 ${
          value === 'table' ? 'bg-advist-dark text-white' : 'text-advist-gray900 hover:bg-advist-bg'
        }`}
        title="Vue liste"
      >
        <List size={20} />
      </button>
    </div>
  );
};

export default ViewModeToggle;
