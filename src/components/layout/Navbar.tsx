import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, Bell, Menu, LogOut, User, Settings } from 'lucide-react';
import { useAuthStore, useNotificationStore } from '../../store';
import { Avatar } from '../ui/Avatar';
import { LanguageSwitcher } from '../ui/LanguageSwitcher';
import { OfflineIndicator } from '../offline';
import { PlanSwitcher } from '../dev/PlanSwitcher';

interface NavbarProps {
  onMenuClick: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onMenuClick }) => {
  const { t } = useTranslation();
  const { user, logout } = useAuthStore();
  const { unreadCount } = useNotificationStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className="fixed top-0 right-0 left-0 z-30 h-16 bg-white/70 backdrop-blur-xl border-b border-[#E8E2D6]/60">
      <div className="flex items-center justify-between h-full px-5">
        {/* Left */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-xl hover:bg-[#FAF7F1] transition-colors"
          >
            <Menu size={20} className="text-[#78716A]" />
          </button>

          {/* Search */}
          <div className="hidden md:flex items-center">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A39B8F]"
              />
              <input
                type="text"
                placeholder={t('navbar.search', 'Rechercher...')}
                className="w-64 lg:w-80 pl-10 pr-4 py-2 bg-[#FAF7F1] rounded-xl text-[#131C2E] text-sm placeholder-[#A39B8F] border border-transparent focus:outline-none focus:ring-2 focus:ring-[#B9975B]/30 focus:border-[#B9975B]/40 focus:bg-white transition-all"
              />
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden lg:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold text-[#A39B8F] bg-white border border-[#E8E2D6]">
                Ctrl K
              </kbd>
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-1.5">
          <PlanSwitcher />
          <OfflineIndicator />
          <LanguageSwitcher showLabel={false} />

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2.5 rounded-xl hover:bg-[#FAF7F1] transition-colors"
            >
              <Bell size={18} className="text-[#78716A]" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-[#B9975B] text-[#131C2E] text-[9px] font-bold rounded-full flex items-center justify-center shadow-sm">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            {showNotifications && (
              <NotificationDropdown onClose={() => setShowNotifications(false)} />
            )}
          </div>

          {/* User */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2.5 p-1.5 pr-3 rounded-xl hover:bg-[#FAF7F1] transition-colors"
            >
              <Avatar
                name={user ? `${user.first_name} ${user.last_name}` : 'User'}
                src={user?.avatar}
                size="sm"
              />
              <span className="hidden md:block text-sm font-semibold text-[#131C2E]">
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
      <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.12)] border border-[#E8E2D6] overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#E8E2D6]">
          <h3 className="font-bold text-[#131C2E] text-sm">
            {t('navbar.notifications', 'Notifications')}
          </h3>
          <button
            onClick={() => markAllAsRead()}
            className="text-xs text-[#B9975B] hover:text-[#8A6C34] font-semibold"
          >
            {t('navbar.markAllRead', 'Tout marquer lu')}
          </button>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-[#A39B8F] text-sm">
              {t('navbar.noNotifications', 'Aucune notification')}
            </div>
          ) : (
            notifications.slice(0, 5).map((notif) => (
              <div
                key={notif.id}
                onClick={() => markAsRead(notif.id)}
                className={`px-4 py-3 border-b border-[#FAF7F1] cursor-pointer hover:bg-[#FAF7F1] transition-colors ${notif.status !== 'read' ? 'bg-[#B9975B]/[0.04]' : ''}`}
              >
                <p className="text-sm font-semibold text-[#131C2E]">{notif.subject}</p>
                <p className="text-xs text-[#78716A] mt-1 line-clamp-2">{notif.body}</p>
              </div>
            ))
          )}
        </div>
        <Link
          to="/app/notifications"
          className="block px-4 py-3 text-center text-xs text-[#B9975B] hover:bg-[#FAF7F1] font-semibold transition-colors"
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
      <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.12)] border border-[#E8E2D6] overflow-hidden">
        <div className="px-4 py-3 border-b border-[#E8E2D6] bg-[#FAF7F1]">
          <p className="font-bold text-[#131C2E] text-sm">
            {user?.first_name} {user?.last_name}
          </p>
          <p className="text-xs text-[#78716A] mt-0.5">{user?.email}</p>
        </div>
        <div className="py-1">
          <Link
            to="/app/profile"
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#78716A] hover:bg-[#FAF7F1] hover:text-[#131C2E] transition-colors"
            onClick={onClose}
          >
            <User size={16} />
            <span>{t('navbar.myProfile', 'Mon profil')}</span>
          </Link>
          <Link
            to="/app/settings"
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#78716A] hover:bg-[#FAF7F1] hover:text-[#131C2E] transition-colors"
            onClick={onClose}
          >
            <Settings size={16} />
            <span>{t('navbar.settings', 'Parametres')}</span>
          </Link>
        </div>
        <div className="border-t border-[#E8E2D6] py-1">
          <button
            onClick={onLogout}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
          >
            <LogOut size={16} />
            <span>{t('navbar.logout', 'Deconnexion')}</span>
          </button>
        </div>
      </div>
    </>
  );
};
