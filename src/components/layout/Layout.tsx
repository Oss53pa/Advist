import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { useAuthStore, useNotificationStore } from '../../store';
import { PlanBadge } from '../dev/PlanSwitcher';
import { usePlanTheme } from '../../hooks/usePlanTheme';

export const Layout: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { fetchUser } = useAuthStore();
  const { fetchNotifications, fetchUnreadCount } = useNotificationStore();
  const { theme: planTheme } = usePlanTheme();

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

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const toggleMobileSidebar = () => {
    setMobileSidebarOpen(!mobileSidebarOpen);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100">
      {/* Plan Color Bar */}
      <div
        className={`fixed top-0 left-0 right-0 h-1 ${planTheme.bgGradient} z-[60] print:hidden`}
      />

      {/* Desktop Sidebar */}
      <div className="hidden lg:block print:hidden">
        <Sidebar isCollapsed={sidebarCollapsed} onToggle={toggleSidebar} />
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/50 print:hidden"
          onClick={toggleMobileSidebar}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <Sidebar isCollapsed={false} onToggle={toggleMobileSidebar} />
          </div>
        </div>
      )}

      {/* Main content */}
      <div
        className={`
          transition-all duration-300 print:ml-0
          ${sidebarCollapsed ? 'lg:ml-[72px]' : 'lg:ml-[260px]'}
        `}
      >
        <div className="print:hidden pt-1">
          <Navbar onMenuClick={toggleMobileSidebar} />
        </div>

        <main className="pt-[68px] min-h-screen print:pt-0">
          <div className="p-4 md:p-6 lg:p-8 print:p-0">
            <Outlet />
          </div>
        </main>

        {/* Plan Badge - Fixed bottom right */}
        <div className="fixed bottom-4 right-4 z-40 print:hidden">
          <PlanBadge className="shadow-lg" />
        </div>
      </div>
    </div>
  );
};
