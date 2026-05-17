/**
 * usePlanTheme - Hook et constantes pour les couleurs des plans
 * SOURCE UNIQUE pour toutes les couleurs par plan dans l'application
 */
import { useEffect } from 'react';
import { Crown, Building2 } from 'lucide-react';
import { useTenantStore, PlanType } from '../stores/tenantStore';

// ============================================
// ICÔNES PAR PLAN
// ============================================
export const PLAN_ICONS: Record<PlanType, React.ElementType> = {
  business: Crown,
  enterprise: Building2,
};

// ============================================
// COULEURS UNIFIÉES PAR PLAN
// ============================================
export const PLAN_THEME: Record<
  PlanType,
  {
    // Couleurs de base
    primary: string; // Couleur principale (500)
    primaryLight: string; // Couleur claire (400)
    primaryDark: string; // Couleur foncée (600)

    // Classes Tailwind
    bg: string; // bg-{color}-500
    bgLight: string; // bg-{color}-50
    bgMedium: string; // bg-{color}-100
    bgGradient: string; // gradient
    text: string; // text-{color}-600
    textLight: string; // text-{color}-500
    textOnBg: string; // text sur fond coloré
    border: string; // border-{color}-300
    borderLight: string; // border-{color}-200
    ring: string; // ring-{color}-500/30

    // Combinaisons prêtes à l'emploi
    badge: string; // Badge léger (bg light + text)
    badgeSolid: string; // Badge solide (bg + text on bg)
    button: string; // Bouton principal
    buttonOutline: string; // Bouton outline
    navActive: string; // Navigation active
    navHover: string; // Navigation hover
    cardBorder: string; // Bordure de carte mise en avant
  }
> = {
  business: {
    primary: '#8B5CF6',
    primaryLight: '#A78BFA',
    primaryDark: '#7C3AED',
    bg: 'bg-primary-900',
    bgLight: 'bg-primary-50',
    bgMedium: 'bg-primary-100',
    bgGradient: 'bg-gradient-to-r from-primary-900 to-primary-900',
    text: 'text-primary-900',
    textLight: 'text-primary-900',
    textOnBg: 'text-white',
    border: 'border-primary-300',
    borderLight: 'border-primary-200',
    ring: 'ring-primary-500/30',
    badge: 'bg-primary-100 text-primary-800',
    badgeSolid: 'bg-primary-900 text-white',
    button: 'bg-primary-900 hover:bg-primary-900 text-white',
    buttonOutline: 'border-2 border-primary-900 text-primary-900 hover:bg-primary-50',
    navActive: 'bg-primary-900 text-white shadow-lg shadow-primary-500/30',
    navHover: 'hover:bg-primary-50',
    cardBorder: 'border-primary-700 shadow-primary-500/20',
  },
  enterprise: {
    primary: '#F59E0B',
    primaryLight: '#FBBF24',
    primaryDark: '#D97706',
    bg: 'bg-primary-900',
    bgLight: 'bg-primary-50',
    bgMedium: 'bg-primary-100',
    bgGradient: 'bg-gradient-to-r from-primary-500 to-primary-900',
    text: 'text-primary-900',
    textLight: 'text-primary-900',
    textOnBg: 'text-white',
    border: 'border-primary-300',
    borderLight: 'border-primary-200',
    ring: 'ring-primary-500/30',
    badge: 'bg-primary-100 text-primary-700',
    badgeSolid: 'bg-primary-900 text-white',
    button: 'bg-primary-900 hover:bg-primary-900 text-white',
    buttonOutline: 'border-2 border-primary-500 text-primary-900 hover:bg-primary-50',
    navActive: 'bg-primary-900 text-white shadow-lg shadow-primary-500/30',
    navHover: 'hover:bg-primary-50',
    cardBorder: 'border-primary-400 shadow-primary-500/20',
  },
};

// ============================================
// HOOK usePlanTheme
// ============================================
/** Coerce any incoming plan string to a valid PlanType so PLAN_THEME /
 *  PLAN_ICONS lookups never return undefined. Defensive against tenants
 *  built from upstream sources (Atlas Studio) that may use other names. */
function safePlan(raw: unknown): PlanType {
  if (raw === 'enterprise' || raw === 'business') return raw;
  if (typeof raw === 'string') {
    const lc = raw.toLowerCase();
    if (lc.includes('entreprise') || lc.includes('enterprise') || lc.includes('premium')) {
      return 'enterprise';
    }
  }
  return 'business';
}

export const usePlanTheme = () => {
  const { currentTenant } = useTenantStore();
  const plan = safePlan(currentTenant?.plan);
  const theme = PLAN_THEME[plan];
  const Icon = PLAN_ICONS[plan];

  // Appliquer les variables CSS au document
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--plan-primary', theme.primary);
    root.style.setProperty('--plan-primary-light', theme.primaryLight);
    root.style.setProperty('--plan-primary-dark', theme.primaryDark);

    // Classe sur le body pour le CSS global
    document.body.classList.remove('plan-business', 'plan-enterprise');
    document.body.classList.add(`plan-${plan}`);
  }, [plan, theme]);

  return {
    plan,
    theme,
    Icon,
    // Alias pour compatibilité
    classes: theme,
    // Helpers
    isPlan: (p: PlanType) => plan === p,
    isAtLeast: (p: PlanType) => {
      const order: PlanType[] = ['business', 'enterprise'];
      return order.indexOf(plan) >= order.indexOf(p);
    },
  };
};

// ============================================
// HELPER: Obtenir le thème d'un plan spécifique
// ============================================
export const getPlanTheme = (plan: PlanType) => PLAN_THEME[plan];
export const getPlanIcon = (plan: PlanType) => PLAN_ICONS[plan];

export default usePlanTheme;
