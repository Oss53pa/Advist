/**
 * LockedToggle — Toggle désactivé avec badge "Entreprise"
 *
 * Affiche un toggle/switch grisé avec badge "Entreprise" inline.
 * Si la feature est disponible, rend un toggle normal.
 *
 * Usage:
 *   <LockedToggle
 *     feature="circuits_conditionnels"
 *     label="Étape conditionnelle"
 *     description="Activer les branchements selon les décisions"
 *     checked={value}
 *     onChange={setValue}
 *   />
 */
import React from 'react';
import { Lock } from 'lucide-react';
import { useHasFeature } from '../../hooks/useTenantPlan';
import { type PlanFeature } from '../../config/planFeatures';

interface LockedToggleProps {
  feature: PlanFeature;
  label: string;
  description?: string;
  checked?: boolean;
  onChange?: (value: boolean) => void;
  className?: string;
  /** Force l'état locked */
  forceLocked?: boolean;
}

export const LockedToggle: React.FC<LockedToggleProps> = ({
  feature,
  label,
  description,
  checked = false,
  onChange,
  className = '',
  forceLocked = false,
}) => {
  const allowed = useHasFeature(feature);
  const locked = forceLocked || !allowed;

  const handleClick = () => {
    if (locked || !onChange) return;
    onChange(!checked);
  };

  return (
    <div
      className={`flex items-start justify-between gap-4 p-4 rounded-xl border ${
        locked ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-200 hover:border-gray-300'
      } transition-colors ${className}`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <label
            htmlFor={`toggle-${feature}`}
            className={`text-sm font-semibold ${locked ? 'text-gray-400' : 'text-gray-900'}`}
          >
            {label}
          </label>
          {locked && (
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0"
              style={{
                backgroundColor: 'rgba(239, 159, 39, 0.12)',
                color: '#EF9F27',
              }}
            >
              <Lock className="w-3 h-3" />
              Entreprise
            </span>
          )}
        </div>
        {description && (
          <p className={`text-xs ${locked ? 'text-gray-400' : 'text-gray-500'}`}>{description}</p>
        )}
      </div>

      {/* Toggle switch */}
      <button
        type="button"
        id={`toggle-${feature}`}
        role="switch"
        aria-checked={locked ? false : checked}
        aria-disabled={locked}
        disabled={locked}
        onClick={handleClick}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
          locked
            ? 'bg-gray-200 cursor-not-allowed'
            : checked
              ? 'bg-primary-900 cursor-pointer'
              : 'bg-gray-300 cursor-pointer hover:bg-gray-400'
        }`}
        title={locked ? 'Disponible en plan Entreprise' : undefined}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform ${
            locked ? 'translate-x-0.5' : checked ? 'translate-x-[22px]' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  );
};

export default LockedToggle;
