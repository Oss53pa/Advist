import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Settings,
  Archive,
  ChevronDown,
  Plus,
  Bell,
  ChevronLeft,
  ChevronRight,
  Building2,
  History,
  BarChart3,
  ShieldCheck,
  FileCheck,
  AlertTriangle,
  ClipboardCheck,
  Target,
  FileText,
} from 'lucide-react';
import { usePlanTheme } from '../../hooks/usePlanTheme';

interface AdminSidebarProps {
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

const adminNavItems: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    path: '/admin',
  },
  {
    id: 'users',
    label: 'Utilisateurs',
    icon: Users,
    path: '/admin/settings/team',
    hasAdd: true,
  },
  {
    id: 'organization',
    label: 'Organisation',
    icon: Building2,
    path: '/admin/organization',
  },
  {
    id: 'iso27001',
    label: 'ISO 27001',
    icon: ShieldCheck,
    children: [
      {
        id: 'iso-dashboard',
        label: 'Tableau de bord',
        icon: LayoutDashboard,
        path: '/admin/iso27001',
      },
      { id: 'iso-soa', label: 'Déclaration (SoA)', icon: FileCheck, path: '/admin/iso27001/soa' },
      { id: 'iso-risks', label: 'Risques', icon: AlertTriangle, path: '/admin/iso27001/risks' },
      { id: 'iso-audits', label: 'Audits', icon: ClipboardCheck, path: '/admin/iso27001/audits' },
      {
        id: 'iso-objectives',
        label: 'Objectifs',
        icon: Target,
        path: '/admin/iso27001/objectives',
      },
      { id: 'iso-policies', label: 'Politiques', icon: FileText, path: '/admin/iso27001/policies' },
    ],
  },
  {
    id: 'archives',
    label: 'Archives',
    icon: Archive,
    path: '/admin/archives',
  },
  {
    id: 'audit',
    label: 'Audit Trail',
    icon: History,
    path: '/admin/audit',
  },
  {
    id: 'analytics',
    label: 'Reporting',
    icon: BarChart3,
    path: '/admin/analytics',
  },
];

const bottomNavItems: NavItem[] = [
  {
    id: 'notifications',
    label: 'Notifications',
    icon: Bell,
    path: '/admin/notifications',
    badge: 8,
  },
  {
    id: 'settings',
    label: 'Paramètres',
    icon: Settings,
    path: '/admin/settings',
  },
];

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ isCollapsed, onToggle }) => {
  const location = useLocation();
  const { theme: planTheme } = usePlanTheme();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

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
        bg-advist-bg border-r border-advist-border
        flex flex-col
        transition-all duration-300 ease-in-out
        ${isCollapsed ? 'w-[72px]' : 'w-[240px]'}
      `}
    >
      {/* Header with Logo - couleur du plan */}
      <div
        className={`
        h-16 flex items-center border-b border-advist-border
        ${isCollapsed ? 'justify-center px-3' : 'justify-between px-5'}
      `}
      >
        <div className="flex items-center gap-3">
          {isCollapsed ? (
            <span className="font-decorative text-xl text-advist-gray900">A</span>
          ) : (
            <div>
              <span className="font-decorative text-xl text-advist-gray900 block">Advist</span>
              <span className={`text-[10px] ${planTheme.text} uppercase tracking-wider`}>
                Admin
              </span>
            </div>
          )}
        </div>
        {!isCollapsed && (
          <button
            onClick={onToggle}
            className="p-1.5 rounded-lg hover:bg-advist-surface-dark transition-colors"
          >
            <ChevronLeft size={18} className="text-advist-text-secondary" />
          </button>
        )}
      </div>

      {/* Toggle button when collapsed */}
      {isCollapsed && (
        <button
          onClick={onToggle}
          className="mx-auto mt-4 p-1.5 rounded-lg hover:bg-advist-surface-dark transition-colors"
        >
          <ChevronRight size={18} className="text-advist-text-secondary" />
        </button>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-6 px-3">
        <div className="space-y-1">
          {adminNavItems.map((item) => (
            <AdminNavMenuItem
              key={item.id}
              item={item}
              isCollapsed={isCollapsed}
              expanded={expandedItems.includes(item.id)}
              onToggle={() => toggleExpand(item.id)}
              isActive={isItemActive(item)}
              planTheme={planTheme}
            />
          ))}
        </div>
      </nav>

      {/* Bottom section */}
      <div className="border-t border-advist-border py-4 px-3 space-y-1">
        {bottomNavItems.map((item) => (
          <AdminNavMenuItem
            key={item.id}
            item={item}
            isCollapsed={isCollapsed}
            expanded={false}
            onToggle={() => {}}
            isActive={isItemActive(item)}
            planTheme={planTheme}
          />
        ))}
      </div>
    </aside>
  );
};

// Admin Nav Menu Item Component - avec couleurs du plan
const AdminNavMenuItem: React.FC<{
  item: NavItem;
  isCollapsed: boolean;
  expanded: boolean;
  onToggle: () => void;
  isActive: boolean;
  planTheme: ReturnType<typeof usePlanTheme>['theme'];
}> = ({ item, isCollapsed, expanded, onToggle, isActive, planTheme }) => {
  const location = useLocation();
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
            w-full flex items-center justify-center p-3 rounded-xl transition-all duration-300
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
        <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-2 bg-advist-dark text-white text-sm rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 whitespace-nowrap z-50 shadow-lg">
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
            w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-300
            ${
              isActive
                ? `${planTheme.bgGradient} ${planTheme.textOnBg} shadow-lg`
                : 'text-advist-text-secondary hover:bg-advist-surface-dark hover:text-advist-gray900'
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
            : 'text-advist-text-secondary hover:bg-advist-surface-dark hover:text-advist-gray900'
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
