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
  { id: 'dashboard', label: t('nav.dashboard', 'Dashboard'), icon: LayoutDashboard, path: '/app' },
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
        label: t('nav.workflowsCompleted', 'Termines'),
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
        label: t('nav.signaturesToSign', 'A signer'),
        icon: AlertCircle,
        path: '/app/signatures',
        badge: 5,
      },
      {
        id: 'signatures-sent',
        label: t('nav.signaturesSent', 'Envoyees'),
        icon: Send,
        path: '/app/signatures?tab=sent',
      },
      {
        id: 'signatures-completed',
        label: t('nav.signaturesCompleted', 'Completees'),
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
  { id: 'archives', label: t('nav.archives', 'Archives'), icon: Archive, path: '/app/archives' },
];

const getBottomNavItems = (t: (key: string, fallback?: string) => string): NavItem[] => [
  {
    id: 'notifications',
    label: t('nav.notifications', 'Notifications'),
    icon: Bell,
    path: '/app/notifications',
    badge: 8,
  },
  { id: 'settings', label: t('nav.settings', 'Parametres'), icon: Settings, path: '/app/settings' },
];

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle }) => {
  const { t } = useTranslation();
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<string[]>(['workflows', 'signatures']);

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
        bg-[#0f172a] text-white
        flex flex-col
        transition-all duration-300 ease-in-out
        ${isCollapsed ? 'w-[72px]' : 'w-[260px]'}
      `}
    >
      {/* Logo */}
      <div
        className={`h-16 flex items-center border-b border-white/[0.06] ${isCollapsed ? 'justify-center px-3' : 'justify-between px-5'}`}
      >
        <div className="flex items-center gap-3">
          {isCollapsed ? (
            <span className="font-decorative text-xl text-[#b8a47e]">A</span>
          ) : (
            <span className="font-decorative text-xl text-[#b8a47e]">Advist</span>
          )}
        </div>
        {!isCollapsed && (
          <button
            onClick={onToggle}
            className="p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors"
          >
            <ChevronLeft size={16} className="text-white/30" />
          </button>
        )}
      </div>

      {isCollapsed && (
        <button
          onClick={onToggle}
          className="mx-auto mt-3 p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors"
        >
          <ChevronRight size={16} className="text-white/30" />
        </button>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <div className="space-y-0.5">
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

        {!isCollapsed ? (
          <div className="my-5 mx-3 h-px bg-white/[0.06]" />
        ) : (
          <div className="my-4 mx-auto w-8 h-px bg-white/[0.06]" />
        )}

        <div className="space-y-0.5">
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

      {/* Bottom */}
      <div className="border-t border-white/[0.06] py-4 px-3 space-y-0.5">
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
    </aside>
  );
};

const NavMenuItem: React.FC<{
  item: NavItem;
  isCollapsed: boolean;
  expanded: boolean;
  onToggle: () => void;
  isActive: boolean;
}> = ({ item, isCollapsed, expanded, onToggle, isActive }) => {
  const location = useLocation();
  const Icon = item.icon;
  const hasChildren = item.children && item.children.length > 0;

  if (isCollapsed) {
    return (
      <div className="relative group">
        <NavLink
          to={item.path || '#'}
          onClick={(e) => {
            if (hasChildren) e.preventDefault();
          }}
          className={`
            w-full flex items-center justify-center p-3 rounded-xl transition-all duration-200
            ${
              isActive
                ? 'bg-[#b8a47e] text-[#0f172a] shadow-lg shadow-[#b8a47e]/20'
                : 'text-white/40 hover:bg-white/[0.06] hover:text-white/70'
            }
          `}
        >
          <Icon size={20} />
          {item.badge && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#b8a47e] text-[#0f172a] text-[10px] font-bold rounded-full flex items-center justify-center">
              {item.badge > 9 ? '9+' : item.badge}
            </span>
          )}
        </NavLink>
        <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-[#1e293b] text-white text-xs font-medium rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-xl border border-white/[0.06]">
          {item.label}
        </div>
      </div>
    );
  }

  if (hasChildren) {
    return (
      <div>
        <button
          onClick={onToggle}
          className={`
            w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200
            ${
              isActive
                ? 'bg-[#b8a47e] text-[#0f172a] shadow-lg shadow-[#b8a47e]/20'
                : 'text-white/50 hover:bg-white/[0.06] hover:text-white/80'
            }
          `}
        >
          <Icon size={18} />
          <span className="flex-1 font-medium text-sm">{item.label}</span>
          {item.badge && (
            <span
              className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full ${isActive ? 'bg-[#0f172a]/20 text-[#0f172a]' : 'bg-[#b8a47e]/15 text-[#b8a47e]'}`}
            >
              {item.badge}
            </span>
          )}
          {item.hasAdd && (
            <button
              onClick={(e) => e.stopPropagation()}
              className={`p-1 rounded-lg transition-colors ${isActive ? 'hover:bg-[#0f172a]/10' : 'hover:bg-white/[0.06]'}`}
            >
              <Plus size={14} />
            </button>
          )}
          <ChevronDown
            size={14}
            className={`transition-transform duration-200 ${expanded ? 'rotate-0' : '-rotate-90'}`}
          />
        </button>

        {expanded && (
          <div className="ml-4 mt-1 pl-4 border-l border-[#b8a47e]/20 space-y-0.5">
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
                        ? 'bg-white/[0.08] text-white font-medium'
                        : 'text-white/40 hover:bg-white/[0.04] hover:text-white/60'
                    }
                  `}
                >
                  <ChildIcon size={15} />
                  <span className="flex-1 text-[13px]">{child.label}</span>
                  {child.badge && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-[#b8a47e]/15 text-[#b8a47e]">
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

  return (
    <NavLink
      to={item.path || '#'}
      className={`
        flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
        ${
          isActive
            ? 'bg-[#b8a47e] text-[#0f172a] shadow-lg shadow-[#b8a47e]/20'
            : 'text-white/50 hover:bg-white/[0.06] hover:text-white/80'
        }
      `}
    >
      <Icon size={18} />
      <span className="flex-1 font-medium text-sm">{item.label}</span>
      {item.badge && (
        <span
          className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full ${isActive ? 'bg-[#0f172a]/20 text-[#0f172a]' : 'bg-[#b8a47e]/15 text-[#b8a47e]'}`}
        >
          {item.badge}
        </span>
      )}
      {item.hasAdd && (
        <button
          onClick={(e) => e.stopPropagation()}
          className={`p-1 rounded-lg transition-colors ${isActive ? 'hover:bg-[#0f172a]/10' : 'hover:bg-white/[0.06]'}`}
        >
          <Plus size={14} />
        </button>
      )}
    </NavLink>
  );
};
