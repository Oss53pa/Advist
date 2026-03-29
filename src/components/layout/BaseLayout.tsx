import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { TopNavBar } from './TopNavBar';
import { useAuthStore, useNotificationStore } from '../../store';
import { ChatWidget } from '../ai/ChatWidget';
import { UpgradePrompt } from '../subscription';
import { PlanBadge } from '../dev/PlanSwitcher';
import { usePlanTheme } from '../../hooks/usePlanTheme';

export type LayoutVariant = 'user' | 'admin';

interface BaseLayoutProps {
  variant: LayoutVariant;
}

// Skip Link component for accessibility
const SkipLink: React.FC<{ href: string; children: React.ReactNode }> = ({ href, children }) => (
  <a
    href={href}
    className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-advist-dark focus:text-white focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-advist-gold"
  >
    {children}
  </a>
);

export const BaseLayout: React.FC<BaseLayoutProps> = ({ variant }) => {
  const { t } = useTranslation();
  const { fetchUser } = useAuthStore();
  const { fetchNotifications, fetchUnreadCount } = useNotificationStore();
  const { classes: planClasses } = usePlanTheme();

  // Fetch user data and notifications on mount
  useEffect(() => {
    fetchUser();
    fetchNotifications();
    fetchUnreadCount();

    // Poll for notifications every minute
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 60000);

    return () => clearInterval(interval);
  }, [fetchUser, fetchNotifications, fetchUnreadCount]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100">
      {/* Plan Color Bar - Barre colorée en haut indiquant le plan */}
      <div className={`fixed top-0 left-0 right-0 h-1 ${planClasses.bgGradient} z-[60] print:hidden`} />

      {/* Skip Links for keyboard navigation */}
      <SkipLink href="#main-content">
        {t('accessibility.skipToContent', 'Aller au contenu principal')}
      </SkipLink>
      <SkipLink href="#main-navigation">
        {t('accessibility.skipToNavigation', 'Aller à la navigation')}
      </SkipLink>

      {/* Top Navigation Bar */}
      <div className="print:hidden pt-1">
        <TopNavBar variant={variant} />
      </div>

      {/* Upgrade Prompt Banner (shown when trial ending or quota near limit) */}
      <div className="print:hidden">
        <UpgradePrompt variant="banner" />
      </div>

      {/* Main content - pt-15 pour la barre de couleur + navbar */}
      <main id="main-content" className="pt-[60px] min-h-screen print:pt-0" role="main">
        <div className="p-4 md:p-6 lg:p-8 print:p-0">
          <Outlet />
        </div>
      </main>

      {/* Plan Badge - Fixed bottom right */}
      <div className="fixed bottom-4 right-4 z-40 print:hidden">
        <PlanBadge className="shadow-lg" />
      </div>

      {/* AI Chat Widget */}
      <ChatWidget />
    </div>
  );
};

export default BaseLayout;
