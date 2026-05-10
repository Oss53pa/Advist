import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Bell, Menu, LogOut, User, Settings } from 'lucide-react';
import { useAuthStore, useNotificationStore } from '../../store';
import { Avatar } from '../ui/Avatar';
import { LanguageSwitcher } from '../ui/LanguageSwitcher';
import { OfflineIndicator } from '../offline';
import { ThemeToggle } from '../theme';
import { PlanSwitcher } from '../dev/PlanSwitcher';
import { usePlanTheme } from '../../hooks/usePlanTheme';

interface UserNavbarProps {
  onMenuClick: () => void;
}

export const UserNavbar: React.FC<UserNavbarProps> = ({ onMenuClick }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { unreadCount } = useNotificationStore();
  const { theme: planTheme } = usePlanTheme();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className="fixed top-0 right-0 left-0 z-30 h-16 bg-white/80 backdrop-blur-xl border-b border-advist-border shadow-sm">
      <div className="flex items-center justify-between h-full px-6">
        {/* Left section */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-xl hover:bg-advist-surface-dark transition-all duration-300"
          >
            <Menu size={20} className="text-advist-gray900" />
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
                placeholder="Rechercher..."
                className="w-64 lg:w-80 pl-10 pr-4 py-2.5 bg-advist-surface-dark border border-advist-border rounded-xl text-advist-gray900 placeholder-primary-400 focus:outline-none focus:ring-2 focus:ring-advist-gold focus:border-transparent focus:bg-white transition-all duration-300"
              />
            </div>
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-3">
          {/* Plan Switcher (Dev only) */}
          <PlanSwitcher />

          {/* Offline Indicator */}
          <OfflineIndicator />

          {/* Language Switcher */}
          <LanguageSwitcher showLabel={false} />

          {/* Theme Toggle */}
          <ThemeToggle variant="switch" showLabel={false} />

          {/* Notifications - couleur du plan */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className={`relative p-2.5 rounded-xl ${planTheme.navHover} transition-all duration-300`}
            >
              <Bell size={20} className="text-advist-gray900" />
              {unreadCount > 0 && (
                <span
                  className={`absolute top-1.5 right-1.5 w-4 h-4 ${planTheme.bg} ${planTheme.textOnBg} text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg`}
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <UserNotificationDropdown
                onClose={() => setShowNotifications(false)}
                planTheme={planTheme}
              />
            )}
          </div>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-3 p-2 rounded-xl hover:bg-advist-surface-dark transition-all duration-300"
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
              <UserDropdownMenu
                onClose={() => setShowUserMenu(false)}
                onLogout={handleLogout}
                planTheme={planTheme}
              />
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

const UserNotificationDropdown: React.FC<{
  onClose: () => void;
  planTheme: ReturnType<typeof usePlanTheme>['theme'];
}> = ({ onClose, planTheme }) => {
  const { notifications, markAsRead, markAllAsRead } = useNotificationStore();

  return (
    <>
      <div className="fixed inset-0" onClick={onClose} />
      <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-advist-border overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-advist-border bg-gradient-to-r from-advist-gold/5 to-transparent">
          <h3 className="font-semibold text-advist-gray900">Notifications</h3>
          <button
            onClick={() => markAllAsRead()}
            className="text-sm text-advist-gold hover:text-advist-gold-dark font-medium transition-colors"
          >
            Tout marquer comme lu
          </button>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-advist-text-muted">Aucune notification</div>
          ) : (
            notifications.slice(0, 5).map((notif) => (
              <div
                key={notif.id}
                onClick={() => markAsRead(notif.id)}
                className={`
                  px-4 py-3 border-b border-advist-border cursor-pointer
                  hover:bg-advist-surface-dark transition-all duration-300
                  ${notif.status !== 'read' ? planTheme.bgLight : ''}
                `}
              >
                <p className="text-sm font-medium text-advist-gray900">{notif.subject}</p>
                <p className="text-xs text-advist-text-secondary mt-1 line-clamp-2">{notif.body}</p>
              </div>
            ))
          )}
        </div>
        <Link
          to="/user/notifications"
          className={`block px-4 py-3 text-center text-sm ${planTheme.text} hover:bg-advist-surface-dark transition-all duration-300 font-medium`}
          onClick={onClose}
        >
          Voir toutes les notifications
        </Link>
      </div>
    </>
  );
};

const UserDropdownMenu: React.FC<{
  onClose: () => void;
  onLogout: () => void;
  planTheme: ReturnType<typeof usePlanTheme>['theme'];
}> = ({ onClose, onLogout, planTheme }) => {
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
            to="/user/profile"
            className="flex items-center gap-3 px-4 py-2.5 text-advist-text-secondary hover:bg-advist-surface-dark hover:text-advist-gray900 transition-all duration-300"
            onClick={onClose}
          >
            <User size={18} />
            <span>Mon profil</span>
          </Link>
          <Link
            to="/user/settings"
            className="flex items-center gap-3 px-4 py-2.5 text-advist-text-secondary hover:bg-advist-surface-dark hover:text-advist-gray900 transition-all duration-300"
            onClick={onClose}
          >
            <Settings size={18} />
            <span>Paramètres</span>
          </Link>
        </div>
        <div className="border-t border-advist-border py-1">
          <button
            onClick={onLogout}
            className={`flex items-center gap-3 w-full px-4 py-2.5 text-advist-error hover:${planTheme.bgLight} transition-all duration-300`}
          >
            <LogOut size={18} />
            <span>Déconnexion</span>
          </button>
        </div>
      </div>
    </>
  );
};
