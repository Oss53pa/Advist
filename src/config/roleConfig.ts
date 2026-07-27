import { Shield, UserCheck, Users, User, Crown } from 'lucide-react';

export type RoleType = 'super_admin' | 'admin' | 'manager' | 'validator' | 'user' | 'external';

export interface RoleConfig {
  label: string;
  color: 'red' | 'purple' | 'blue' | 'green' | 'gray' | 'yellow';
  icon: React.ElementType;
  description?: string;
}

export const ROLE_CONFIG: Record<RoleType, RoleConfig> = {
  super_admin: {
    label: 'Super Admin',
    color: 'red',
    icon: Crown,
    description: 'Acces complet a toutes les organisations',
  },
  admin: {
    label: 'Administrateur',
    color: 'red',
    icon: Shield,
    description: "Gestion complete de l'organisation",
  },
  manager: {
    label: 'Manager',
    color: 'purple',
    icon: UserCheck,
    description: 'Gestion des equipes et workflows',
  },
  validator: {
    label: 'Validateur',
    color: 'blue',
    icon: UserCheck,
    description: 'Validation des documents',
  },
  user: {
    label: 'Utilisateur',
    color: 'gray',
    icon: User,
    description: 'Acces standard',
  },
  external: {
    label: 'Externe',
    color: 'yellow',
    icon: Users,
    description: 'Acces limite aux documents partages',
  },
};

export const getRoleConfig = (role: RoleType): RoleConfig => {
  return ROLE_CONFIG[role] || ROLE_CONFIG.user;
};

export const ROLE_OPTIONS = Object.entries(ROLE_CONFIG).map(([value, config]) => ({
  value,
  label: config.label,
}));
