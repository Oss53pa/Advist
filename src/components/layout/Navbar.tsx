import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, Bell, Menu, LogOut, User, Settings } from 'lucide-react';
import { useAuthStore, useNotificationStore } from '../../store';
import { Avatar } from '../ui/Avatar';
import { LanguageSwitcher } from '../ui/LanguageSwitcher';
import { OfflineIndicator } from '../offline';
import { PlanSwitcher } from '../dev/PlanSwitcher';
import { usePlanTheme } from '../../hooks/usePlanTheme';

interface NavbarProps {
  onMenuClick: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onMenuClick }) => {
  const { t } = useTranslation();
  const { user, logout } = useAuthStore();
  const { unreadCount } = useNotificationStore();
  const { theme: planTheme } = usePlanTheme();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className="fixed top-0 right-0 left-0 z-30 h-16 bg-white/80 backdrop-blur-xl border-b border-advist-border shadow-sm">
      <div className="flex items-center justify-between h-full px-4">
        {/* Left section */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-xl hover:bg-advist-surface-dark transition-colors"
          >
            <Menu size={20} className="text-advist-text-secondary" />
          </button>

          {/* Search */}
          <div className="hidden md:flex items-center">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-advist-text-muted"
              />
              <input
                type="text"
                placeholder={t('navbar.search', 'Rechercher...')}
                className="w-64 lg:w-80 pl-10 pr-4 py-2 bg-advist-surface-dark rounded-xl text-advist-gray900 placeholder-primary-400 focus:outline-none focus:ring-2 focus:ring-advist-gold/50 focus:bg-white transition-all"
              />
            </div>
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2">
          {/* Plan Switcher (Dev only) */}
          <PlanSwitcher />

          {/* Offline Indicator */}
          <OfflineIndicator />

          {/* Language Switcher */}
          <LanguageSwitcher showLabel={false} />

          {/* Notifications - avec couleur du plan */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className={`relative p-2 rounded-xl ${planTheme.navHover} transition-colors`}
            >
              <Bell size={20} className="text-advist-text-secondary" />
              {unreadCount > 0 && (
                <span className={`absolute top-1 right-1 w-4 h-4 ${planTheme.bg} ${planTheme.textOnBg} text-xs rounded-full flex items-center justify-center shadow-lg`}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <NotificationDropdown onClose={() => setShowNotifications(false)} />
            )}
          </div>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-3 p-2 rounded-xl hover:bg-advist-surface-dark transition-colors"
            >
              <Avatar
                name={user ? `${user.first_name} ${user.last_name}` : 'User'}
                src={user?.avatar}
                size="sm"
              />
              <span className="hidden md:block text-sm font-medium text-advist-gray900">
                {user?.first_name}
              </span>
            </button>

            {showUserMenu && (
              <UserDropdown onClose={() => setShowUserMenu(false)} onLogout={handleLogout} />
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

const NotificationDropdown: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { t } = useTranslation();
  const { notifications, markAsRead, markAllAsRead } = useNotificationStore();

  return (
    <>
      <div className="fixed inset-0" onClick={onClose} />
      <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-advist-border overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-advist-border bg-gradient-to-r from-advist-gold/5 to-transparent">
          <h3 className="font-semibold text-advist-gray900">{t('navbar.notifications', 'Notifications')}</h3>
          <button
            onClick={() => markAllAsRead()}
            className="text-sm text-advist-gold hover:text-advist-gold-dark font-medium"
          >
            {t('navbar.markAllRead', 'Tout marquer comme lu')}
          </button>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-advist-text-muted">
              {t('navbar.noNotifications', 'Aucune notification')}
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
        <Link
          to="/app/notifications"
          className="block px-4 py-3 text-center text-sm text-advist-gold hover:bg-advist-gold/5 font-medium transition-colors"
          onClick={onClose}
        >
          {t('navbar.viewAllNotifications', 'Voir toutes les notifications')}
        </Link>
      </div>
    </>
  );
};

const UserDropdown: React.FC<{ onClose: () => void; onLogout: () => void }> = ({
  onClose,
  onLogout,
}) => {
  const { t } = useTranslation();
  const { user } = useAuthStore();

  return (
    <>
      <div className="fixed inset-0" onClick={onClose} />
      <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-advist-border overflow-hidden">
        <div className="px-4 py-3 border-b border-advist-border bg-gradient-to-r from-advist-gold/5 to-transparent">
          <p className="font-medium text-advist-gray900">
            {user?.first_name} {user?.last_name}
          </p>
          <p className="text-sm text-advist-text-secondary">{user?.email}</p>
        </div>
        <div className="py-1">
          <Link
            to="/app/profile"
            className="flex items-center gap-3 px-4 py-2.5 text-advist-text-secondary hover:bg-advist-surface-dark hover:text-advist-gray900 transition-colors"
            onClick={onClose}
          >
            <User size={18} />
            <span>{t('navbar.myProfile', 'Mon profil')}</span>
          </Link>
          <Link
            to="/app/settings"
            className="flex items-center gap-3 px-4 py-2.5 text-advist-text-secondary hover:bg-advist-surface-dark hover:text-advist-gray900 transition-colors"
            onClick={onClose}
          >
            <Settings size={18} />
            <span>{t('navbar.settings', 'Paramètres')}</span>
          </Link>
        </div>
        <div className="border-t border-advist-border py-1">
          <button
            onClick={onLogout}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-advist-error hover:bg-advist-gold-light transition-colors"
          >
            <LogOut size={18} />
            <span>{t('navbar.logout', 'Déconnexion')}</span>
          </button>
        </div>
      </div>
    </>
  );
};
