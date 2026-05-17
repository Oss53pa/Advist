import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { TopNavBar } from './TopNavBar';
import { useAuthStore, useNotificationStore } from '../../store';
import { ChatWidget } from '../ai/ChatWidget';
import { UpgradePrompt } from '../subscription';
import { PlanBadge } from '../dev/PlanSwitcher';
import { usePlanTheme } from '../../hooks/usePlanTheme';
import { OnboardingTour } from '../onboarding/OnboardingTour';
import { HelpFab } from '../help/HelpFab';

export type LayoutVariant = 'user' | 'admin';

interface BaseLayoutProps {
  variant: LayoutVariant;
}

/**
 * Detects if the app is running inside the /demo iframe preview.
 * When true, hides chat widget, plan badge, upgrade prompt, and collapses
 * sidebars to maximize the visible interface area (gain ~472px).
 */
function useDemoMode(): boolean {
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    const check = () => {
      const fromStorage = sessionStorage.getItem('advist-demo-mode') === '1';
      const fromIframe = window.self !== window.top;
      const fromUrl = new URLSearchParams(window.location.search).get('demo') === '1';
      setIsDemo(fromStorage || fromIframe || fromUrl);
    };
    check();
    window.addEventListener('storage', check);
    return () => window.removeEventListener('storage', check);
  }, []);

  return isDemo;
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
  const isDemo = useDemoMode();

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100">
      {/* Plan Color Bar - Barre colorée en haut indiquant le plan */}
      <div
        className={`fixed top-0 left-0 right-0 h-1 ${planClasses.bgGradient} z-[60] print:hidden`}
      />

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

      {/* Upgrade Prompt Banner — hidden in demo mode */}
      {!isDemo && (
        <div className="print:hidden">
          <UpgradePrompt variant="banner" />
        </div>
      )}

      {/* Main content - reduced padding in demo to maximize space (gain ~472px) */}
      <main
        id="main-content"
        className={`${isDemo ? 'pt-[56px] px-0' : 'pt-[60px]'} min-h-screen print:pt-0`}
        role="main"
      >
        <div className={`${isDemo ? 'p-2' : 'p-4 md:p-6 lg:p-8'} print:p-0`}>
          <Outlet />
        </div>
      </main>

      {/* Plan Badge — hidden in demo mode */}
      {!isDemo && (
        <div className="fixed bottom-4 right-4 z-40 print:hidden">
          <PlanBadge className="shadow-lg" />
        </div>
      )}

      {/* AI Chat Widget — hidden in demo mode */}
      {!isDemo && <ChatWidget />}

      {/* Help FAB — hidden in demo mode */}
      {!isDemo && <HelpFab />}

      {/* Onboarding tour — auto-shows on first login, hidden in demo mode */}
      {!isDemo && <OnboardingTour />}
    </div>
  );
};

export default BaseLayout;
