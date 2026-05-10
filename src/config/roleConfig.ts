import { Shield, UserCheck, User, Crown } from 'lucide-react';

// Atlas Studio Suite seat roles (source of truth: licence_seats.role).
export type RoleType = 'app_super_admin' | 'app_admin' | 'editor' | 'viewer';

export interface RoleConfig {
  label: string;
  color: 'red' | 'purple' | 'blue' | 'green' | 'gray' | 'yellow';
  icon: React.ElementType;
  description?: string;
}

export const ROLE_CONFIG: Record<RoleType, RoleConfig> = {
  app_super_admin: {
    label: 'Super-admin',
    color: 'red',
    icon: Crown,
    description: "Acces total, gere l'abonnement et l'equipe",
  },
  app_admin: {
    label: 'Admin',
    color: 'purple',
    icon: Shield,
    description: "Gere l'equipe et les parametres applicatifs",
  },
  editor: {
    label: 'Editeur',
    color: 'blue',
    icon: UserCheck,
    description: 'Peut creer et modifier les donnees',
  },
  viewer: {
    label: 'Lecteur',
    color: 'gray',
    icon: User,
    description: 'Consultation uniquement',
  },
};

export const getRoleConfig = (role: RoleType): RoleConfig => {
  return ROLE_CONFIG[role] || ROLE_CONFIG.viewer;
};

export const ROLE_OPTIONS = Object.entries(ROLE_CONFIG).map(([value, config]) => ({
  value,
  label: config.label,
}));
