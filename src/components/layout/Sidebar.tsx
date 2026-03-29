import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  FileText,
  GitBranch,
  PenTool,
  Users,
  Settings,
  Archive,
  ChevronDown,
  Plus,
  Bell,
  Inbox,
  Send,
  Clock,
  CheckCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { usePlanTheme } from '../../hooks/usePlanTheme';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  path?: string;
  badge?: number;
  hasAdd?: boolean;
  children?: NavItem[];
}

const getMainNavItems = (t: (key: string, fallback?: string) => string): NavItem[] => [
  {
    id: 'dashboard',
    label: t('nav.dashboard', 'Dashboard'),
    icon: LayoutDashboard,
    path: '/app',
  },
  {
    id: 'documents',
    label: t('nav.documents', 'Documents'),
    icon: FileText,
    path: '/app/documents',
    badge: 12,
  },
  {
    id: 'workflows',
    label: t('nav.workflows', 'Workflows'),
    icon: GitBranch,
    hasAdd: true,
    children: [
      {
        id: 'workflows-active',
        label: t('nav.workflowsActive', 'Actifs'),
        icon: Clock,
        path: '/app/workflows',
      },
      {
        id: 'workflows-pending',
        label: t('nav.workflowsPending', 'En attente'),
        icon: Inbox,
        path: '/app/workflows?status=pending',
        badge: 3,
      },
      {
        id: 'workflows-completed',
        label: t('nav.workflowsCompleted', 'Terminés'),
        icon: CheckCircle,
        path: '/app/workflows?status=completed',
      },
    ],
  },
  {
    id: 'signatures',
    label: t('nav.signatures', 'Signatures'),
    icon: PenTool,
    badge: 5,
    children: [
      {
        id: 'signatures-pending',
        label: t('nav.signaturesToSign', 'À signer'),
        icon: AlertCircle,
        path: '/app/signatures',
        badge: 5,
      },
      {
        id: 'signatures-sent',
        label: t('nav.signaturesSent', 'Envoyées'),
        icon: Send,
        path: '/app/signatures?tab=sent',
      },
      {
        id: 'signatures-completed',
        label: t('nav.signaturesCompleted', 'Complétées'),
        icon: CheckCircle,
        path: '/app/signatures?tab=completed',
      },
    ],
  },
];

const getAdminNavItems = (t: (key: string, fallback?: string) => string): NavItem[] => [
  {
    id: 'users',
    label: t('nav.users', 'Utilisateurs'),
    icon: Users,
    path: '/app/users',
    hasAdd: true,
  },
  {
    id: 'archives',
    label: t('nav.archives', 'Archives'),
    icon: Archive,
    path: '/app/archives',
  },
];

const getBottomNavItems = (t: (key: string, fallback?: string) => string): NavItem[] => [
  {
    id: 'notifications',
    label: t('nav.notifications', 'Notifications'),
    icon: Bell,
    path: '/app/notifications',
    badge: 8,
  },
  {
    id: 'settings',
    label: t('nav.settings', 'Paramètres'),
    icon: Settings,
    path: '/app/settings',
  },
];

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle }) => {
  const { t } = useTranslation();
  const location = useLocation();
  const { theme: planTheme } = usePlanTheme();
  const [expandedItems, setExpandedItems] = useState<string[]>(['workflows', 'signatures']);

  // Get translated nav items
  const mainNavItems = getMainNavItems(t);
  const adminNavItems = getAdminNavItems(t);
  const bottomNavItems = getBottomNavItems(t);

  const toggleExpand = (id: string) => {
    setExpandedItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const isItemActive = (item: NavItem): boolean => {
    if (item.path && location.pathname === item.path) return true;
    if (item.children) {
      return item.children.some(
        (child) => child.path && location.pathname.startsWith(child.path?.split('?')[0] || '')
      );
    }
    return false;
  };

  return (
    <aside
      className={`
        fixed left-0 top-0 z-40 h-screen
        bg-white border-r border-advist-border
        flex flex-col
        transition-all duration-300 ease-in-out
        ${isCollapsed ? 'w-[72px]' : 'w-[260px]'}
      `}
    >
      {/* Header with Logo - couleur du plan */}
      <div
        className={`
        h-16 flex items-center border-b border-advist-border
        ${isCollapsed ? 'justify-center px-3' : 'justify-between px-4'}
      `}
      >
        <div className="flex items-center gap-3">
          {isCollapsed ? (
            <span className={`font-decorative text-xl ${planTheme.text}`}>A</span>
          ) : (
            <span className={`font-decorative text-xl ${planTheme.text}`}>Advist</span>
          )}
        </div>
        {!isCollapsed && (
          <button
            onClick={onToggle}
            className="p-1.5 rounded-lg hover:bg-advist-surface-dark transition-colors"
          >
            <ChevronLeft size={18} className="text-advist-text-muted" />
          </button>
        )}
      </div>

      {/* Toggle button when collapsed */}
      {isCollapsed && (
        <button
          onClick={onToggle}
          className="mx-auto mt-3 p-1.5 rounded-lg hover:bg-advist-surface-dark transition-colors"
        >
          <ChevronRight size={18} className="text-advist-text-muted" />
        </button>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {/* Main items */}
        <div className="space-y-1">
          {mainNavItems.map((item) => (
            <NavMenuItem
              key={item.id}
              item={item}
              isCollapsed={isCollapsed}
              expanded={expandedItems.includes(item.id)}
              onToggle={() => toggleExpand(item.id)}
              isActive={isItemActive(item)}
            />
          ))}
        </div>

        {/* Separator */}
        {!isCollapsed && (
          <div className="my-4 flex items-center gap-3 px-3">
            <div className="flex-1 h-px bg-advist-surface-dark" />
          </div>
        )}
        {isCollapsed && <div className="my-4 mx-auto w-8 h-px bg-advist-surface-dark" />}

        {/* Admin items */}
        <div className="space-y-1">
          {adminNavItems.map((item) => (
            <NavMenuItem
              key={item.id}
              item={item}
              isCollapsed={isCollapsed}
              expanded={expandedItems.includes(item.id)}
              onToggle={() => toggleExpand(item.id)}
              isActive={isItemActive(item)}
            />
          ))}
        </div>
      </nav>

      {/* Bottom section */}
      <div className="border-t border-advist-border py-4 px-3 space-y-1">
        {bottomNavItems.map((item) => (
          <NavMenuItem
            key={item.id}
            item={item}
            isCollapsed={isCollapsed}
            expanded={false}
            onToggle={() => {}}
            isActive={isItemActive(item)}
          />
        ))}
      </div>

      {/* Scroll indicator (only when collapsed) - couleur du plan */}
      {isCollapsed && (
        <div className="pb-4 flex justify-center">
          <div className="w-1 h-12 bg-advist-surface-dark rounded-full overflow-hidden">
            <div className={`w-full h-1/3 ${planTheme.bgGradient} rounded-full`} />
          </div>
        </div>
      )}
    </aside>
  );
};

// Nav Menu Item Component - avec couleurs du plan
const NavMenuItem: React.FC<{
  item: NavItem;
  isCollapsed: boolean;
  expanded: boolean;
  onToggle: () => void;
  isActive: boolean;
}> = ({ item, isCollapsed, expanded, onToggle, isActive }) => {
  const location = useLocation();
  const { theme: planTheme } = usePlanTheme();
  const Icon = item.icon;
  const hasChildren = item.children && item.children.length > 0;

  // Collapsed view - just icon
  if (isCollapsed) {
    return (
      <div className="relative group">
        <NavLink
          to={item.path || '#'}
          onClick={(e) => {
            if (hasChildren) {
              e.preventDefault();
            }
          }}
          className={`
            w-full flex items-center justify-center p-3 rounded-xl transition-all duration-200
            ${
              isActive
                ? `${planTheme.bgGradient} ${planTheme.textOnBg} shadow-lg`
                : 'text-advist-text-secondary hover:bg-advist-surface-dark hover:text-advist-gray900'
            }
          `}
        >
          <Icon size={20} />
          {item.badge && (
            <span
              className={`absolute -top-1 -right-1 w-5 h-5 ${planTheme.bg} ${planTheme.textOnBg} text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg`}
            >
              {item.badge > 9 ? '9+' : item.badge}
            </span>
          )}
        </NavLink>

        {/* Tooltip on hover */}
        <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-advist-dark text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-lg">
          {item.label}
          {item.badge && (
            <span className={`ml-2 px-1.5 py-0.5 ${planTheme.bgMedium} rounded text-xs`}>
              {item.badge}
            </span>
          )}
        </div>
      </div>
    );
  }

  // Expanded view with children
  if (hasChildren) {
    return (
      <div>
        <button
          onClick={onToggle}
          className={`
            w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200
            ${
              isActive
                ? `${planTheme.bgGradient} ${planTheme.textOnBg} shadow-lg`
                : 'text-advist-text-secondary hover:bg-advist-surface-dark'
            }
          `}
        >
          <Icon size={18} />
          <span className="flex-1 font-medium text-sm">{item.label}</span>
          {item.badge && (
            <span
              className={`
              px-1.5 py-0.5 text-[10px] font-bold rounded-full
              ${isActive ? 'bg-white/20 text-white' : `${planTheme.bgMedium} ${planTheme.text}`}
            `}
            >
              {item.badge}
            </span>
          )}
          {item.hasAdd && (
            <button
              onClick={(e) => {
                e.stopPropagation();
              }}
              className={`p-1 rounded-lg transition-colors ${isActive ? 'hover:bg-white/10' : 'hover:bg-advist-border'}`}
            >
              <Plus size={14} />
            </button>
          )}
          <ChevronDown
            size={16}
            className={`transition-transform duration-200 ${expanded ? 'rotate-0' : '-rotate-90'}`}
          />
        </button>

        {/* Children - bordure colorée */}
        {expanded && (
          <div className={`ml-4 mt-1 pl-4 border-l-2 ${planTheme.border} space-y-1`}>
            {item.children?.map((child) => {
              const ChildIcon = child.icon;
              const childActive =
                child.path && location.pathname.startsWith(child.path.split('?')[0]);

              return (
                <NavLink
                  key={child.id}
                  to={child.path || '#'}
                  className={`
                    flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200
                    ${
                      childActive
                        ? `${planTheme.bgLight} text-advist-gray900 font-medium`
                        : 'text-advist-text-secondary hover:bg-advist-surface-dark hover:text-advist-gray900'
                    }
                  `}
                >
                  <ChildIcon size={16} />
                  <span className="flex-1 text-sm">{child.label}</span>
                  {child.badge && (
                    <span
                      className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full ${planTheme.bgMedium} ${planTheme.text}`}
                    >
                      {child.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Simple item without children
  return (
    <NavLink
      to={item.path || '#'}
      className={`
        flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
        ${
          isActive
            ? `${planTheme.bgGradient} ${planTheme.textOnBg} shadow-lg`
            : 'text-advist-text-secondary hover:bg-advist-surface-dark'
        }
      `}
    >
      <Icon size={18} />
      <span className="flex-1 font-medium text-sm">{item.label}</span>
      {item.badge && (
        <span
          className={`
          px-1.5 py-0.5 text-[10px] font-bold rounded-full
          ${isActive ? 'bg-white/20 text-white' : `${planTheme.bgMedium} ${planTheme.text}`}
        `}
        >
          {item.badge}
        </span>
      )}
      {item.hasAdd && (
        <button
          onClick={(e) => {
            e.stopPropagation();
          }}
          className={`p-1 rounded-lg transition-colors ${isActive ? 'hover:bg-white/10' : 'hover:bg-advist-border'}`}
        >
          <Plus size={14} />
        </button>
      )}
    </NavLink>
  );
};
