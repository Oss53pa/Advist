import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  FileText,
  GitBranch,
  PenTool,
  Users,
  Building2,
  Archive,
  History,
  BarChart3,
  Settings,
  Bell,
  Search,
  ChevronDown,
  LogOut,
  User,
  ArrowLeftRight,
  Sparkles,
  Shield,
  CreditCard,
  Folder,
  Menu,
  X,
  Globe,
} from 'lucide-react';
import { useAuthStore, useNotificationStore } from '../../store';
import { Avatar } from '../ui/Avatar';
import { languages, changeLanguage, getCurrentLanguage } from '../../i18n';
import { TrialBadge } from '../subscription';
import { PlanSwitcher } from '../dev/PlanSwitcher';
import { usePlanTheme } from '../../hooks/usePlanTheme';

interface TopNavBarProps {
  variant: 'user' | 'admin';
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  path: string;
  badgeKey?: 'pendingWorkflows' | 'pendingSignatures';
}

// Mock counts - à remplacer par les vraies données du store
const pendingCounts = {
  pendingWorkflows: 3,
  pendingSignatures: 5,
};

// Navigation items with translation keys
const getUserNavItems = (t: (key: string) => string): NavItem[] => [
  { id: 'dashboard', label: t('nav.dashboard'), icon: LayoutDashboard, path: '/user' },
  { id: 'documents', label: t('nav.documents'), icon: FileText, path: '/user/documents' },
  { id: 'projects', label: t('nav.projects'), icon: Folder, path: '/user/projects' },
  { id: 'workflows', label: t('nav.workflows'), icon: GitBranch, path: '/user/workflows', badgeKey: 'pendingWorkflows' },
  { id: 'signatures', label: t('nav.signatures'), icon: PenTool, path: '/user/signatures', badgeKey: 'pendingSignatures' },
  { id: 'analytics', label: t('nav.reports'), icon: BarChart3, path: '/user/analytics/reports' },
];

const getAdminNavItems = (t: (key: string) => string): NavItem[] => [
  { id: 'dashboard', label: t('nav.dashboard'), icon: LayoutDashboard, path: '/admin' },
  { id: 'projects', label: t('nav.projects'), icon: Folder, path: '/admin/projects' },
  { id: 'users', label: t('nav.users'), icon: Users, path: '/admin/users' },
  { id: 'organization', label: t('nav.organization'), icon: Building2, path: '/admin/organization' },
  { id: 'archives', label: t('nav.archives'), icon: Archive, path: '/admin/archives' },
  { id: 'audit', label: t('nav.audit'), icon: History, path: '/admin/audit' },
  { id: 'analytics', label: t('nav.reports'), icon: BarChart3, path: '/admin/analytics/reports' },
  { id: 'settings', label: t('nav.settings'), icon: Settings, path: '/admin/settings' },
];

export const TopNavBar: React.FC<TopNavBarProps> = ({ variant }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { unreadCount } = useNotificationStore();
  const { classes: planClasses, plan } = usePlanTheme();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);

  const navItems = variant === 'user' ? getUserNavItems(t) : getAdminNavItems(t);
  const basePath = variant === 'user' ? '/user' : '/admin';

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleSwitchProfile = () => {
    navigate('/select-profile');
  };

  const isActive = (path: string) => {
    if (path === basePath) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const currentLanguage = languages.find(l => l.code === i18n.language) || languages[0];

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-advist-bg border-b border-advist-border shadow-sm" role="banner">
        <div className="flex items-center h-14 px-4">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="lg:hidden p-2 text-advist-text-secondary hover:text-advist-gray900 hover:bg-advist-surface-dark rounded-xl transition-colors mr-2"
            aria-expanded={showMobileMenu}
            aria-label={showMobileMenu ? t('accessibility.closeMenu', 'Fermer le menu') : t('accessibility.openMenu', 'Ouvrir le menu')}
          >
            {showMobileMenu ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
          </button>

          {/* Logo */}
          <div className="flex items-center gap-2 mr-4 lg:mr-8">
            <span className="font-decorative text-advist-gray900 text-2xl lg:text-3xl font-bold">Advist</span>
            {variant === 'admin' && (
              <span className={`hidden sm:inline px-2 py-1 ${planClasses.bg} ${planClasses.textOnBg} text-[10px] font-bold rounded-lg uppercase shadow-lg`}>
                Admin
              </span>
            )}
          </div>

          {/* Navigation Tabs - Desktop - avec couleurs du plan */}
          <nav id="main-navigation" className="hidden lg:flex items-center gap-1 flex-1" aria-label={t('accessibility.skipToNavigation', 'Navigation principale')}>
            {navItems.map((item) => {
              const active = isActive(item.path);
              const badgeCount = item.badgeKey ? pendingCounts[item.badgeKey] : 0;
              return (
                <NavLink
                  key={item.id}
                  to={item.path}
                  className={`
                    relative flex items-center gap-2 px-3 xl:px-4 py-2 rounded-xl text-sm xl:text-base font-medium transition-all
                    ${active
                      ? `${planClasses.bg} ${planClasses.textOnBg} shadow-lg`
                      : `text-advist-text-secondary hover:text-advist-gray900 ${planClasses.navHover}`
                    }
                  `}
                >
                  <item.icon size={18} />
                  <span className="hidden xl:inline">{item.label}</span>
                  {badgeCount > 0 && (
                    <span className={`
                      min-w-[18px] h-[18px] px-1 text-[10px] font-bold rounded-full flex items-center justify-center
                      ${active
                        ? 'bg-white/30 text-white'
                        : `${planClasses.bg} ${planClasses.textOnBg}`
                      }
                    `}>
                      {badgeCount > 9 ? '9+' : badgeCount}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* Right Section */}
          <div className="flex items-center gap-1 sm:gap-2 ml-auto">
            {/* Plan Switcher (Dev only) */}
            <PlanSwitcher />

            {/* Trial Badge - Shows remaining trial days */}
            <TrialBadge />

            {/* Search - Hidden on mobile */}
            <button
              className="hidden sm:flex p-2 text-advist-text-secondary hover:text-advist-gray900 hover:bg-advist-surface-dark rounded-lg transition-colors"
              aria-label={t('common.search', 'Rechercher')}
            >
              <Search size={18} aria-hidden="true" />
            </button>

            {/* Language Switcher */}
            <div className="relative">
              <button
                onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                className="flex items-center gap-1 p-2 text-advist-text-secondary hover:text-advist-gray900 hover:bg-advist-surface-dark rounded-lg transition-colors"
              >
                <Globe size={18} />
                <span className="hidden sm:inline text-xs font-medium">{currentLanguage.code.toUpperCase()}</span>
              </button>

              {showLanguageMenu && (
                <>
                  <div className="fixed inset-0" onClick={() => setShowLanguageMenu(false)} />
                  <div className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-xl border border-advist-border overflow-hidden z-50">
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          changeLanguage(lang.code);
                          setShowLanguageMenu(false);
                        }}
                        className={`
                          flex items-center gap-3 w-full px-4 py-2.5 text-left transition-colors
                          ${i18n.language === lang.code
                            ? 'bg-advist-gold/20 text-advist-gray900'
                            : 'text-advist-text-secondary hover:bg-advist-surface-dark hover:text-advist-gray900'
                          }
                        `}
                      >
                        <span className="text-base">{lang.flag}</span>
                        <span className="text-sm">{lang.name}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Switch Profile - Hidden on small mobile */}
            <button
              onClick={handleSwitchProfile}
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 text-advist-text-secondary hover:text-advist-gray900 hover:bg-advist-surface-dark rounded-lg transition-colors text-sm"
            >
              <ArrowLeftRight size={14} />
              <span className="hidden lg:inline">{t('common.switch')}</span>
            </button>

            {/* Notifications - avec couleur du plan */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className={`relative p-2 text-advist-text-secondary hover:text-advist-gray900 ${planClasses.navHover} rounded-xl transition-colors`}
                aria-expanded={showNotifications}
                aria-haspopup="true"
                aria-label={t('accessibility.notifications', 'Notifications') + (unreadCount > 0 ? ` (${unreadCount} ${t('notifications.unread', 'non lues')})` : '')}
              >
                <Bell size={18} aria-hidden="true" />
                {unreadCount > 0 && (
                  <span className={`absolute top-1 right-1 w-4 h-4 ${planClasses.bg} ${planClasses.textOnBg} text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg`} aria-hidden="true">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <NotificationDropdown
                  variant={variant}
                  onClose={() => setShowNotifications(false)}
                />
              )}
            </div>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1.5 hover:bg-advist-surface-dark rounded-lg transition-colors"
                aria-expanded={showUserMenu}
                aria-haspopup="true"
                aria-label={t('accessibility.userMenu', 'Menu utilisateur')}
              >
                <Avatar
                  name={user ? `${user.first_name} ${user.last_name}` : 'User'}
                  src={user?.avatar}
                  size="sm"
                />
                <div className="hidden md:block text-left">
                  <span className="text-sm font-medium text-advist-gray900 block leading-tight">
                    {user?.first_name}
                  </span>
                </div>
                <ChevronDown size={14} className="hidden sm:block text-advist-text-secondary" />
              </button>

              {showUserMenu && (
                <UserMenuDropdown
                  variant={variant}
                  onClose={() => setShowUserMenu(false)}
                  onLogout={handleLogout}
                />
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Menu - avec couleurs du plan */}
      {showMobileMenu && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setShowMobileMenu(false)}
          />
          <div className="fixed top-14 left-0 right-0 bg-advist-bg border-t border-advist-border z-40 lg:hidden max-h-[70vh] overflow-y-auto shadow-lg">
            <nav className="p-4 space-y-1">
              {navItems.map((item) => {
                const active = isActive(item.path);
                const badgeCount = item.badgeKey ? pendingCounts[item.badgeKey] : 0;
                return (
                  <NavLink
                    key={item.id}
                    to={item.path}
                    onClick={() => setShowMobileMenu(false)}
                    className={`
                      flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-base font-medium transition-all
                      ${active
                        ? `${planClasses.bg} ${planClasses.textOnBg} shadow-lg`
                        : `text-advist-text-secondary hover:text-advist-gray900 ${planClasses.navHover}`
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon size={20} />
                      <span>{item.label}</span>
                    </div>
                    {badgeCount > 0 && (
                      <span className={`
                        min-w-[22px] h-[22px] px-1.5 text-xs font-bold rounded-full flex items-center justify-center
                        ${active
                          ? 'bg-white/30 text-white'
                          : `${planClasses.bg} ${planClasses.textOnBg}`
                        }
                      `}>
                        {badgeCount > 9 ? '9+' : badgeCount}
                      </span>
                    )}
                  </NavLink>
                );
              })}

              {/* Mobile-only items */}
              <div className="border-t border-advist-border mt-4 pt-4 space-y-1">
                <button
                  onClick={() => {
                    setShowMobileMenu(false);
                    handleSwitchProfile();
                  }}
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-advist-text-secondary hover:text-advist-gray900 hover:bg-advist-surface-dark transition-all"
                >
                  <ArrowLeftRight size={20} />
                  <span>{t('profile.switchProfile')}</span>
                </button>
              </div>
            </nav>
          </div>
        </>
      )}
    </>
  );
};

// Notification Dropdown
const NotificationDropdown: React.FC<{ variant: 'user' | 'admin'; onClose: () => void }> = ({
  variant,
  onClose,
}) => {
  const { t } = useTranslation();
  const { notifications, markAsRead, markAllAsRead } = useNotificationStore();
  const basePath = variant === 'user' ? '/user' : '/admin';

  return (
    <>
      <div className="fixed inset-0" onClick={onClose} />
      <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-80 max-w-80 bg-white rounded-2xl shadow-2xl border border-advist-border overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-advist-border bg-gradient-to-r from-advist-gold/5 to-transparent">
          <h3 className="font-semibold text-advist-gray900">{t('notifications.title')}</h3>
          <button
            onClick={() => markAllAsRead()}
            className="text-xs text-advist-gold hover:text-advist-gold-dark font-medium"
          >
            {t('notifications.markAllAsRead')}
          </button>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-advist-text-muted text-sm">
              {t('notifications.noNotifications')}
            </div>
          ) : (
            notifications.slice(0, 5).map((notif) => (
              <div
                key={notif.id}
                onClick={() => markAsRead(notif.id)}
                className={`
                  px-4 py-3 border-b border-primary-50 cursor-pointer
                  hover:bg-advist-surface-dark transition-colors
                  ${notif.status !== 'read' ? 'bg-advist-gold/5' : ''}
                `}
              >
                <p className="text-sm font-medium text-advist-gray900">{notif.subject}</p>
                <p className="text-xs text-advist-text-secondary mt-1 line-clamp-2">{notif.body}</p>
              </div>
            ))
          )}
        </div>
        <NavLink
          to={`${basePath}/notifications`}
          className="block px-4 py-3 text-center text-sm text-advist-gold hover:bg-advist-gold/5 font-medium transition-colors"
          onClick={onClose}
        >
          {t('notifications.viewAll', 'Voir toutes les notifications')}
        </NavLink>
      </div>
    </>
  );
};

// User Menu Dropdown
const UserMenuDropdown: React.FC<{
  variant: 'user' | 'admin';
  onClose: () => void;
  onLogout: () => void;
}> = ({ variant, onClose, onLogout }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const basePath = variant === 'user' ? '/user' : '/admin';

  return (
    <>
      <div className="fixed inset-0" onClick={onClose} />
      <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-56 max-w-56 bg-white rounded-2xl shadow-2xl border border-advist-border overflow-hidden">
        <div className="px-4 py-3 border-b border-advist-border bg-gradient-to-r from-advist-gold/5 to-transparent">
          <p className="font-medium text-advist-gray900">
            {user?.first_name} {user?.last_name}
          </p>
          <p className="text-sm text-advist-text-secondary">{user?.email}</p>
          {variant === 'admin' && (
            <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 bg-advist-gold text-advist-gray900 text-xs rounded-lg font-semibold shadow-sm">
              <Shield size={10} />
              {t('users.role.admin')}
            </span>
          )}
        </div>
        <div className="py-1">
          <NavLink
            to={`${basePath}/profile`}
            className="flex items-center gap-3 px-4 py-2.5 text-advist-text-secondary hover:bg-advist-surface-dark hover:text-advist-gray900 transition-colors"
            onClick={onClose}
          >
            <User size={16} />
            <span className="text-sm">{t('profile.title')}</span>
          </NavLink>
          <NavLink
            to={`${basePath}/billing`}
            className="flex items-center gap-3 px-4 py-2.5 text-advist-text-secondary hover:bg-advist-surface-dark hover:text-advist-gray900 transition-colors"
            onClick={onClose}
          >
            <CreditCard size={16} />
            <span className="text-sm">{t('organization.billing')}</span>
          </NavLink>
          {variant === 'admin' && (
            <NavLink
              to={`${basePath}/settings`}
              className="flex items-center gap-3 px-4 py-2.5 text-advist-text-secondary hover:bg-advist-surface-dark hover:text-advist-gray900 transition-colors"
              onClick={onClose}
            >
              <Settings size={16} />
              <span className="text-sm">{t('nav.settings')}</span>
            </NavLink>
          )}
          <button
            onClick={() => {
              onClose();
              navigate('/select-profile');
            }}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-advist-text-secondary hover:bg-advist-surface-dark hover:text-advist-gray900 transition-colors"
          >
            <ArrowLeftRight size={16} />
            <span className="text-sm">{t('profile.switchProfile')}</span>
          </button>
        </div>
        <div className="border-t border-advist-border py-1">
          <button
            onClick={onLogout}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-advist-error hover:bg-advist-gold-light transition-colors"
          >
            <LogOut size={16} />
            <span className="text-sm">{t('auth.logout')}</span>
          </button>
        </div>
      </div>
    </>
  );
};
