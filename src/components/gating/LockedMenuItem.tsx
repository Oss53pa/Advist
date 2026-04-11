/**
 * LockedMenuItem — Item de menu grisé non-cliquable avec badge "Entreprise"
 *
 * Usage:
 *   <LockedMenuItem
 *     icon={Key}
 *     label="API & Clés d'accès"
 *     description="Gérez vos clés d'API REST"
 *   />
 *
 * Ou pour wrapper un item existant:
 *   <LockedMenuItem feature="api_rest">
 *     <YourMenuItemContent />
 *   </LockedMenuItem>
 */
import React from 'react';
import { Lock } from 'lucide-react';
import { useTenantPlan } from '../../hooks/useTenantPlan';
import { type PlanFeature } from '../../config/planFeatures';

interface LockedMenuItemProps {
  feature?: PlanFeature;
  icon?: React.ElementType;
  label?: string;
  description?: string;
  children?: React.ReactNode;
  onClick?: () => void;
  className?: string;
  /** Force l'état locked même si la feature est autorisée */
  forceLocked?: boolean;
}

export const LockedMenuItem: React.FC<LockedMenuItemProps> = ({
  feature,
  icon: Icon,
  label,
  description,
  children,
  onClick,
  className = '',
  forceLocked = false,
}) => {
  const plan = useTenantPlan();
  const allowed = feature ? plan.features_included.includes(feature) : true;
  const locked = forceLocked || !allowed;

  if (!locked && children) {
    return (
      <div onClick={onClick} className={className}>
        {children}
      </div>
    );
  }

  if (!locked) {
    return (
      <button
        onClick={onClick}
        className={`flex items-center gap-3 w-full p-3 rounded-lg hover:bg-gray-50 transition-colors ${className}`}
      >
        {Icon && <Icon className="w-5 h-5 text-gray-600" />}
        <div className="flex-1 text-left">
          <p className="text-sm font-medium text-gray-900">{label}</p>
          {description && <p className="text-xs text-gray-500">{description}</p>}
        </div>
      </button>
    );
  }

  // Locked state
  return (
    <div
      className={`relative flex items-center gap-3 w-full p-3 rounded-lg bg-gray-50 cursor-not-allowed opacity-60 ${className}`}
      role="button"
      aria-disabled="true"
      title="Disponible en plan Entreprise"
    >
      {children ? (
        <div className="flex-1 pointer-events-none">{children}</div>
      ) : (
        <>
          {Icon && <Icon className="w-5 h-5 text-gray-400" />}
          <div className="flex-1 text-left">
            <p className="text-sm font-medium text-gray-500">{label}</p>
            {description && <p className="text-xs text-gray-400">{description}</p>}
          </div>
        </>
      )}
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
    </div>
  );
};

export default LockedMenuItem;
