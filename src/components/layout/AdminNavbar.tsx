import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Bell, Menu, LogOut, User, Settings, ArrowLeftRight, Shield } from 'lucide-react';
import { useAuthStore, useNotificationStore } from '../../store';
import { Avatar } from '../ui/Avatar';
import { LanguageSwitcher } from '../ui/LanguageSwitcher';
import { OfflineIndicator } from '../offline';

interface AdminNavbarProps {
  onMenuClick: () => void;
}

export const AdminNavbar: React.FC<AdminNavbarProps> = ({ onMenuClick }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { unreadCount } = useNotificationStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleSwitchProfile = () => {
    navigate('/select-profile');
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
          {/* Offline Indicator */}
          <OfflineIndicator />

          {/* Switch Profile */}
          <button
            onClick={handleSwitchProfile}
            className="hidden sm:flex items-center gap-2 px-3 py-2 text-sm text-advist-gray900 hover:bg-advist-surface-dark rounded-xl transition-all duration-300"
            title="Changer de profil"
          >
            <ArrowLeftRight size={16} />
            <span className="hidden lg:inline">Changer</span>
          </button>

          {/* Language Switcher */}
          <LanguageSwitcher showLabel={false} />

          {/* Notifications - couleur du plan */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2.5 rounded-xl hover:bg-advist-gold/10 transition-all duration-300"
            >
              <Bell size={20} className="text-advist-gray900" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-advist-gold text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <AdminNotificationDropdown onClose={() => setShowNotifications(false)} />
            )}
          </div>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-3 p-2 rounded-xl hover:bg-advist-surface-dark transition-all duration-300"
            >
              <div className="relative">
                <Avatar
                  name={user ? `${user.first_name} ${user.last_name}` : 'Admin'}
                  src={user?.avatar}
                  size="sm"
                />
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-gradient-to-r from-advist-gold to-primary-500 rounded-full border-2 border-white flex items-center justify-center shadow-lg">
                  <Shield size={7} className="text-white" />
                </div>
              </div>
              <div className="hidden md:block text-left">
                <span className="text-sm font-medium text-advist-gray900 block">
                  {user?.first_name}
                </span>
                <span className="text-[10px] text-advist-gold font-medium">Admin</span>
              </div>
            </button>

            {showUserMenu && (
              <AdminDropdownMenu onClose={() => setShowUserMenu(false)} onLogout={handleLogout} />
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

const AdminNotificationDropdown: React.FC<{
  onClose: () => void;
}> = ({ onClose }) => {
  const { notifications, markAsRead, markAllAsRead } = useNotificationStore();

  return (
    <>
      <div className="fixed inset-0" onClick={onClose} />
      <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-advist-border overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-advist-border bg-gradient-to-r from-advist-gold to-primary-500">
          <h3 className="font-semibold text-white">Notifications Admin</h3>
          <button
            onClick={() => markAllAsRead()}
            className="text-sm text-white/70 hover:text-white transition-colors"
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
                  ${notif.status !== 'read' ? 'bg-advist-gold/10' : ''}
                `}
              >
                <p className="text-sm font-medium text-advist-gray900">{notif.subject}</p>
                <p className="text-xs text-advist-text-secondary mt-1 line-clamp-2">{notif.body}</p>
              </div>
            ))
          )}
        </div>
        <Link
          to="/admin/notifications"
          className="block px-4 py-3 text-center text-sm text-advist-gold hover:bg-advist-gold/10 transition-all duration-300 font-medium"
          onClick={onClose}
        >
          Voir toutes les notifications
        </Link>
      </div>
    </>
  );
};

const AdminDropdownMenu: React.FC<{
  onClose: () => void;
  onLogout: () => void;
}> = ({ onClose, onLogout }) => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  return (
    <>
      <div className="fixed inset-0" onClick={onClose} />
      <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-advist-border overflow-hidden">
        <div className="px-4 py-3 border-b border-advist-border bg-gradient-to-r from-advist-gold to-primary-500">
          <p className="font-medium text-white">
            {user?.first_name} {user?.last_name}
          </p>
          <p className="text-sm text-white/70">{user?.email}</p>
          <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 bg-white/20 text-white text-xs rounded font-semibold">
            <Shield size={10} />
            Administrateur
          </span>
        </div>
        <div className="py-1">
          <Link
            to="/admin/profile"
            className="flex items-center gap-3 px-4 py-2.5 text-advist-text-secondary hover:bg-advist-surface-dark hover:text-advist-gray900 transition-all duration-300"
            onClick={onClose}
          >
            <User size={18} />
            <span>Mon profil</span>
          </Link>
          <Link
            to="/admin/settings"
            className="flex items-center gap-3 px-4 py-2.5 text-advist-text-secondary hover:bg-advist-surface-dark hover:text-advist-gray900 transition-all duration-300"
            onClick={onClose}
          >
            <Settings size={18} />
            <span>Paramètres</span>
          </Link>
          <button
            onClick={() => {
              onClose();
              navigate('/select-profile');
            }}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-advist-text-secondary hover:bg-advist-surface-dark hover:text-advist-gray900 transition-all duration-300"
          >
            <ArrowLeftRight size={18} />
            <span>Changer de profil</span>
          </button>
        </div>
        <div className="border-t border-advist-border py-1">
          <button
            onClick={onLogout}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-advist-error hover:bg-advist-gold/10 transition-all duration-300"
          >
            <LogOut size={18} />
            <span>Déconnexion</span>
          </button>
        </div>
      </div>
    </>
  );
};
