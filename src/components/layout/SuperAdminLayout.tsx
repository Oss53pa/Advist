import React, { useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  Building2,
  Users,
  Settings,
  Shield,
  Server,
  BarChart3,
  Bell,
  LogOut,
  ChevronDown,
  ChevronRight,
  Globe,
  FileText,
  AlertTriangle,
  HelpCircle,
  CreditCard,
  Layout,
  Tag,
  Headphones,
  Megaphone,
  Menu,
  X,
  BookOpen,
  Mail,
  UserPlus,
  Calendar,
  type LucideIcon,
} from 'lucide-react';
import { useAuthStore } from '../../store';
import { Avatar } from '../ui/Avatar';

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  subItems?: { name: string; href: string; icon: LucideIcon }[];
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/superadmin', icon: LayoutDashboard },
  { name: 'Organisations', href: '/superadmin/tenants', icon: Building2 },
  { name: 'Utilisateurs globaux', href: '/superadmin/users', icon: Users },
  { name: 'Support Client', href: '/superadmin/support', icon: Headphones },
  {
    name: 'Marketing',
    href: '/superadmin/marketing',
    icon: Megaphone,
    subItems: [
      { name: 'Publications', href: '/superadmin/marketing/posts', icon: FileText },
      { name: 'Blog', href: '/superadmin/marketing/blog', icon: BookOpen },
      { name: 'Newsletters', href: '/superadmin/marketing/newsletters', icon: Mail },
      { name: 'Abonnés', href: '/superadmin/marketing/subscribers', icon: UserPlus },
      { name: 'Calendrier', href: '/superadmin/marketing/calendar', icon: Calendar },
      { name: 'Analytics', href: '/superadmin/marketing/analytics', icon: BarChart3 },
    ],
  },
  { name: 'Landing Page', href: '/superadmin/landing-page', icon: Layout },
  { name: 'Grille Tarifaire', href: '/superadmin/pricing', icon: Tag },
  { name: 'Facturation', href: '/superadmin/billing', icon: CreditCard },
  { name: 'Analytics', href: '/superadmin/analytics', icon: BarChart3 },
  { name: 'Système', href: '/superadmin/system', icon: Server },
  { name: 'Sécurité', href: '/superadmin/security', icon: Shield },
  { name: 'Logs & Audit', href: '/superadmin/logs', icon: FileText },
  { name: 'Alertes', href: '/superadmin/alerts', icon: AlertTriangle },
  { name: 'Configuration', href: '/superadmin/settings', icon: Settings },
];

export const SuperAdminLayout: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [showUserMenu, setShowUserMenu] = React.useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = React.useState(false);
  const [expandedMenus, setExpandedMenus] = React.useState<string[]>(() => {
    // Auto-expand menus if current path matches a subitem
    const expanded: string[] = [];
    navigation.forEach((item) => {
      if (item.subItems?.some((sub) => location.pathname.startsWith(sub.href))) {
        expanded.push(item.name);
      }
    });
    return expanded;
  });

  const toggleMenu = (menuName: string) => {
    setExpandedMenus((prev) =>
      prev.includes(menuName) ? prev.filter((name) => name !== menuName) : [...prev, menuName]
    );
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Apply the Midnight Bank theme on the SuperAdmin surface as well.
  useEffect(() => {
    document.body.classList.add('theme-midnight');
    return () => {
      document.body.classList.remove('theme-midnight');
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#0f172a]">
      {/* Skip Links for keyboard navigation */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-white focus:text-advist-gray900 focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-advist-gold"
      >
        {t('accessibility.skipToContent', 'Aller au contenu principal')}
      </a>
      <a
        href="#main-navigation"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-white focus:text-advist-gray900 focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-advist-gold"
      >
        {t('accessibility.skipToNavigation', 'Aller à la navigation')}
      </a>

      {/* Top Bar - Navy */}
      <header
        className="fixed top-0 left-0 right-0 h-16 bg-gradient-to-r from-advist-navy via-primary-800 to-advist-navy border-b border-white/10 z-50 shadow-lg print:hidden"
        role="banner"
      >
        <div className="flex items-center justify-between h-full px-4 lg:px-6">
          {/* Mobile menu button */}
          <button
            onClick={() => setShowMobileSidebar(!showMobileSidebar)}
            className="lg:hidden p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-colors mr-2"
            aria-label={showMobileSidebar ? 'Fermer le menu' : 'Ouvrir le menu'}
          >
            {showMobileSidebar ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* Logo */}
          <div className="flex items-center gap-4">
            <Link to="/superadmin" className="flex items-center gap-3">
              <span className="font-decorative text-2xl text-white">Advist</span>
              <span className="hidden sm:inline ml-2 px-2 py-0.5 bg-gradient-to-r from-advist-gold to-primary-500 text-white text-xs font-bold rounded-lg shadow-sm">
                SUPER ADMIN
              </span>
            </Link>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2 lg:gap-4">
            {/* Global search - Hidden on mobile */}
            <div className="relative hidden md:block">
              <input
                type="text"
                placeholder={t('superadmin.globalSearch', 'Recherche globale...')}
                className="w-48 lg:w-64 px-4 py-2 pl-10 bg-white/10 border border-white/10 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-advist-blue-light transition-all duration-240"
              />
              <Globe size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" />
            </div>

            {/* Alerts */}
            <button
              className="relative p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-300"
              aria-label={t('accessibility.notifications', 'Notifications')}
            >
              <Bell size={20} aria-hidden="true" />
              <span
                className="absolute top-1 right-1 w-2 h-2 bg-advist-gold rounded-full shadow-lg shadow-advist-gold/50"
                aria-hidden="true"
              />
              <span className="sr-only">{t('notifications.unread', 'Notifications non lues')}</span>
            </button>

            {/* Help */}
            <button
              className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-300"
              aria-label={t('nav.help', 'Aide')}
            >
              <HelpCircle size={20} aria-hidden="true" />
            </button>

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 lg:gap-3 px-2 lg:px-3 py-2 hover:bg-white/10 rounded-xl transition-all duration-300"
                aria-expanded={showUserMenu}
                aria-haspopup="true"
                aria-label={t('accessibility.userMenu', 'Menu utilisateur')}
              >
                <Avatar name={`${user?.first_name} ${user?.last_name}`} size="sm" />
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-white">
                    {user?.first_name} {user?.last_name}
                  </p>
                  <p className="text-xs text-advist-gold">Super Admin</p>
                </div>
                <ChevronDown size={16} className="hidden sm:block text-white/50" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-advist-border py-2 z-50">
                  <Link
                    to="/superadmin/settings"
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-advist-text-secondary hover:bg-advist-surface-dark hover:text-advist-gray900 transition-all"
                  >
                    <Settings size={16} />
                    Paramètres
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-advist-error hover:bg-advist-gold-light transition-all"
                  >
                    <LogOut size={16} />
                    Déconnexion
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {showMobileSidebar && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setShowMobileSidebar(false)}
        />
      )}

      {/* Sidebar - White */}
      <aside
        className={`
          fixed left-0 top-16 bottom-0 w-64 bg-white border-r border-advist-border overflow-y-auto shadow-sm print:hidden z-40
          transition-transform duration-300 ease-in-out
          ${showMobileSidebar ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
        role="complementary"
      >
        <nav
          id="main-navigation"
          className="p-4 space-y-1"
          aria-label={t('accessibility.skipToNavigation', 'Navigation principale')}
        >
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            const isSubItemActive = item.subItems?.some((sub) =>
              location.pathname.startsWith(sub.href)
            );
            const isExpanded = expandedMenus.includes(item.name);
            const hasSubItems = item.subItems && item.subItems.length > 0;

            return (
              <div key={item.name}>
                {hasSubItems ? (
                  <>
                    <button
                      onClick={() => toggleMenu(item.name)}
                      className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl transition-all duration-300 relative ${
                        isActive || isSubItemActive
                          ? 'bg-gradient-to-r from-advist-gold to-primary-500 text-white shadow-lg shadow-advist-gold/20'
                          : 'text-advist-text-secondary hover:bg-advist-surface-dark hover:text-advist-gray900'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {(isActive || isSubItemActive) && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white/50 rounded-r" />
                        )}
                        <item.icon size={20} />
                        <span className="font-medium">{item.name}</span>
                      </div>
                      <ChevronRight
                        size={16}
                        className={`transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                      />
                    </button>
                    {isExpanded && (
                      <div className="ml-4 mt-1 space-y-1 border-l-2 border-advist-border pl-2">
                        {item.subItems?.map((subItem) => {
                          const isSubActive = location.pathname === subItem.href;
                          return (
                            <Link
                              key={subItem.name}
                              to={subItem.href}
                              onClick={() => setShowMobileSidebar(false)}
                              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-300 ${
                                isSubActive
                                  ? 'bg-advist-gold/10 text-advist-gold-dark font-medium'
                                  : 'text-advist-text-secondary hover:bg-advist-surface-dark hover:text-advist-gray900'
                              }`}
                            >
                              <subItem.icon size={16} />
                              <span className="text-sm">{subItem.name}</span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </>
                ) : (
                  <Link
                    to={item.href}
                    onClick={() => setShowMobileSidebar(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 relative ${
                      isActive
                        ? 'bg-gradient-to-r from-advist-gold to-primary-500 text-white shadow-lg shadow-advist-gold/20'
                        : 'text-advist-text-secondary hover:bg-advist-surface-dark hover:text-advist-gray900'
                    }`}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white/50 rounded-r" />
                    )}
                    <item.icon size={20} />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                )}
              </div>
            );
          })}
        </nav>

        {/* System status */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-advist-border bg-gradient-to-t from-primary-50 to-white">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-advist-text-secondary">Statut système</span>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-advist-success rounded-full animate-pulse" />
              <span className="text-xs text-advist-success font-medium">Opérationnel</span>
            </div>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between text-advist-text-secondary">
              <span>API</span>
              <span className="text-advist-success font-medium">45ms</span>
            </div>
            <div className="flex items-center justify-between text-advist-text-secondary">
              <span>DB</span>
              <span className="text-advist-success font-medium">12ms</span>
            </div>
            <div className="flex items-center justify-between text-advist-text-secondary">
              <span>Storage</span>
              <span className="text-advist-gold-dark font-medium">120ms</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main
        id="main-content"
        className="lg:ml-64 pt-16 min-h-screen print:ml-0 print:pt-0"
        role="main"
      >
        <Outlet />
      </main>
    </div>
  );
};

export default SuperAdminLayout;
