import React from 'react';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
  label?: string;
  description?: string;
}

export const Toggle: React.FC<ToggleProps> = ({
  checked,
  onChange,
  disabled = false,
  size = 'md',
  label,
  description,
}) => {
  const sizeStyles = {
    sm: { track: 'w-9 h-5', thumb: 'h-4 w-4', translate: 'peer-checked:translate-x-4' },
    md: { track: 'w-11 h-6', thumb: 'h-5 w-5', translate: 'peer-checked:translate-x-full' },
  };

  const styles = sizeStyles[size];

  const toggle = (
    <label
      className={`relative inline-flex items-center ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => !disabled && onChange(e.target.checked)}
        disabled={disabled}
        className="sr-only peer"
      />
      <div
        className={`
          ${styles.track} bg-advist-surface-dark rounded-full peer
          peer-checked:bg-advist-gold
          peer-focus:ring-2 peer-focus:ring-advist-gold/50
          after:content-[''] after:absolute after:top-0.5 after:left-[2px]
          after:bg-white after:rounded-full after:${styles.thumb}
          after:transition-all ${styles.translate}
        `}
      />
    </label>
  );

  if (!label) return toggle;

  return (
    <div className="flex items-center justify-between">
      <div>
        <span className="text-sm font-medium text-advist-gray900">{label}</span>
        {description && <p className="text-sm text-advist-gray900/60 mt-0.5">{description}</p>}
      </div>
      {toggle}
    </div>
  );
};

export default Toggle;
