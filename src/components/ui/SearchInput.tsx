import React from 'react';
import { Search, X } from 'lucide-react';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  showClearButton?: boolean;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  placeholder = 'Rechercher...',
  className = '',
  showClearButton = true,
}) => {
  return (
    <div className={`relative ${className}`}>
      <Search
        size={18}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-advist-text-muted"
      />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-10 pr-10 py-2 bg-advist-surface-dark border border-advist-border rounded-xl text-advist-gray900 placeholder-primary-400 focus:outline-none focus:ring-2 focus:ring-advist-gold focus:bg-white transition-all duration-300"
      />
      {showClearButton && value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-advist-border transition-all duration-300"
        >
          <X size={14} className="text-advist-text-muted" />
        </button>
      )}
    </div>
  );
};
