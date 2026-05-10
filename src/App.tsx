import React, { Suspense, lazy, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { UserLayout, AdminLayout } from './components/layout';
import { SuperAdminLayout } from './components/layout/SuperAdminLayout';
import { ThemeProvider } from './components/theme';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useAuthStore } from './store';
import { useSubscriptionGuard } from './hooks/useSubscriptionGuard';
import { getPostLoginRoute } from './services/postLoginRoute';
import { isAdminUser } from './types';

// Pages d'auth chargées immédiatement (small bundles)
import { LoginPage } from './pages';
import { AtlasStudioRedirect } from './pages/AtlasStudioRedirect';
const ExternalAuthPage = lazy(() => import('./pages/auth/ExternalAuthPage'));
const AcceptInvite = lazy(() => import('./pages/auth/AcceptInvite'));

// Atlas Studio external URL for redirects to billing/pricing/subscription pages
const ATLAS_STUDIO_BILLING = (
  <AtlasStudioRedirect
    destination="billing"
    message="La gestion de la facturation et des abonnements est centralisée sur le portail Atlas Studio."
  />
);
const ATLAS_STUDIO_PRICING = <AtlasStudioRedirect destination="pricing" />;

// LandingPage lazy loaded (large bundle)
const LandingPage = lazy(() => import('./pages/LandingPage'));

// Demo page (public, no auth required)
const DemoPage = lazy(() => import('./pages/DemoPage'));

// Lazy loading des pages utilisateur
const UserDashboard = lazy(() => import('./pages/UserDashboard'));
const DocumentsPage = lazy(() => import('./pages/documents/DocumentsPage'));
const DocumentDetailPage = lazy(() => import('./pages/documents/DocumentDetailPage'));
const WorkflowsPage = lazy(() => import('./pages/workflows/WorkflowsPage'));
const SignaturesPage = lazy(() => import('./pages/signatures/SignaturesPage'));
const SignDocumentPage = lazy(() => import('./pages/signatures/SignDocumentPage'));
const SettingsPage = lazy(() => import('./pages/settings/SettingsPage'));
const ProfilePage = lazy(() => import('./pages/settings/ProfilePage'));
const TeamSettingsPage = lazy(() => import('./pages/settings/TeamSettingsPage'));
const NotificationsPage = lazy(() => import('./pages/notifications/NotificationsPage'));
const CalendarPage = lazy(() => import('./pages/calendar/CalendarPage'));
const ProjectsPage = lazy(() => import('./pages/projects/ProjectsPage'));
const ProjectDetailPage = lazy(() => import('./pages/projects/ProjectDetailPage'));
const ExecutiveReportPage = lazy(() => import('./pages/analytics/ExecutiveReportPage'));

// Lazy loading des pages admin
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const OrganizationPage = lazy(() => import('./pages/users/OrganizationPage'));
const ArchivesPage = lazy(() => import('./pages/archives/ArchivesPage'));
const AuditPage = lazy(() => import('./pages/archives/AuditPage'));
const AnalyticsPage = lazy(() => import('./pages/admin/AnalyticsPage'));

// Lazy loading des pages super admin
const SuperAdminDashboard = lazy(() => import('./pages/superadmin/SuperAdminDashboard'));
const TenantsPage = lazy(() => import('./pages/superadmin/TenantsPage'));
const SuperAdminUsersPage = lazy(() => import('./pages/superadmin/SuperAdminUsersPage'));
const SuperAdminAnalyticsPage = lazy(() => import('./pages/superadmin/SuperAdminAnalyticsPage'));
const SuperAdminSystemPage = lazy(() => import('./pages/superadmin/SuperAdminSystemPage'));
const SuperAdminSecurityPage = lazy(() => import('./pages/superadmin/SuperAdminSecurityPage'));
const SuperAdminLogsPage = lazy(() => import('./pages/superadmin/SuperAdminLogsPage'));
const SuperAdminAlertsPage = lazy(() => import('./pages/superadmin/SuperAdminAlertsPage'));
const SuperAdminSettingsPage = lazy(() => import('./pages/superadmin/SuperAdminSettingsPage'));
const LandingPageEditorPage = lazy(() => import('./pages/superadmin/LandingPageEditorPage'));
// Billing/pricing/addons management is owned by Atlas Studio — no super-admin pages in Advist.

// Lazy loading des pages support
const SuperAdminSupportPage = lazy(() => import('./pages/superadmin/SupportPage'));
const UserSupportPage = lazy(() => import('./pages/user/SupportPage'));

// Lazy loading des pages marketing
const MarketingPage = lazy(() => import('./pages/superadmin/marketing/MarketingPage'));
const MarketingPublicationsPage = lazy(
  () => import('./pages/superadmin/marketing/MarketingPublicationsPage')
);
const MarketingCalendarPage = lazy(
  () => import('./pages/superadmin/marketing/MarketingCalendarPage')
);
const MarketingTemplatesPage = lazy(
  () => import('./pages/superadmin/marketing/MarketingTemplatesPage')
);
const MarketingAccountsPage = lazy(
  () => import('./pages/superadmin/marketing/MarketingAccountsPage')
);
const MarketingAnalyticsPage = lazy(
  () => import('./pages/superadmin/marketing/MarketingAnalyticsPage')
);
const MarketingBlogPage = lazy(() => import('./pages/superadmin/marketing/MarketingBlogPage'));
const MarketingSubscribersPage = lazy(
  () => import('./pages/superadmin/marketing/MarketingSubscribersPage')
);
const MarketingNewslettersPage = lazy(
  () => import('./pages/superadmin/marketing/MarketingNewslettersPage')
);

// Pages externes
const ExternalUserPage = lazy(() => import('./pages/external/ExternalUserPage'));
const ValidationReportPage = lazy(() => import('./pages/reports/ValidationReportPage'));

// Page de verification publique (Module 4)
const VerifyPage = lazy(() => import('./pages/verify/VerifyPage'));

// Pages légales et ressources
const LegalPage = lazy(() => import('./pages/legal/LegalPage'));
const ResourcePage = lazy(() => import('./pages/resources/ResourcePage'));
const BlogPage = lazy(() => import('./pages/blog/BlogPage'));
const BlogArticlePage = lazy(() => import('./pages/blog/BlogArticlePage'));

const SubscriptionBlockedPage = lazy(() => import('./pages/subscription/SubscriptionBlockedPage'));

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

// Loading fallback
const PageLoader: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-advist-dark border-t-transparent rounded-full animate-spin" />
        <p className="text-advist-gray900 text-sm">{t('common.loading', 'Chargement...')}</p>
      </div>
    </div>
  );
};

// Subscription Protected Route - vérifie l'abonnement en plus de l'auth
const SubscriptionProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  const { isLoading, canAccess, blockReason } = useSubscriptionGuard();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (isLoading) {
    return <PageLoader />;
  }

  if (!canAccess && blockReason) {
    return <Navigate to={`/subscription-blocked?reason=${blockReason}`} replace />;
  }

  return <>{children}</>;
};

// Public Route wrapper (redirect to app if already logged in)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  const [target, setTarget] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      getPostLoginRoute().then(setTarget);
    }
  }, [isAuthenticated]);

  if (isAuthenticated) {
    if (!target) return <PageLoader />;
    return <Navigate to={target} replace />;
  }

  return <>{children}</>;
};

// Admin Route wrapper - checks auth + subscription + admin/org_admin role
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();
  const { isLoading, canAccess, blockReason } = useSubscriptionGuard();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (isLoading) {
    return <PageLoader />;
  }

  if (!canAccess && blockReason) {
    return <Navigate to={`/subscription-blocked?reason=${blockReason}`} replace />;
  }

  if (!isAdminUser(user) && !user?.is_atlas_super_admin) {
    return <Navigate to="/user" replace />;
  }

  return <>{children}</>;
};

// Super Admin Route wrapper - checks auth + super_admin role
const SuperAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!user?.is_atlas_super_admin) {
    return <Navigate to="/user" replace />;
  }

  return <>{children}</>;
};

function App() {
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    initialize().then((unsub) => {
      unsubscribe = unsub;
    });
    return () => {
      unsubscribe?.();
    };
  }, [initialize]);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Public landing page */}
                <Route path="/" element={<LandingPage />} />

                {/* Auth routes */}
                <Route
                  path="/login"
                  element={
                    <PublicRoute>
                      <LoginPage />
                    </PublicRoute>
                  }
                />
                {/* Format unifié Atlas Studio Suite — auth centralisée */}
                <Route path="/signup" element={<AtlasStudioRedirect destination="signup" />} />
                <Route
                  path="/forgot-password"
                  element={<AtlasStudioRedirect destination="forgot-password" />}
                />
                <Route
                  path="/reset-password"
                  element={<AtlasStudioRedirect destination="reset-password" />}
                />
                {/* Alias rétro-compatibles vers /signup */}
                <Route path="/register" element={<Navigate to="/signup" replace />} />
                <Route
                  path="/register/success"
                  element={<AtlasStudioRedirect destination="portal" />}
                />
                <Route path="/checkout" element={<AtlasStudioRedirect destination="pricing" />} />
                <Route path="/pricing" element={<AtlasStudioRedirect destination="pricing" />} />
                <Route
                  path="/auth"
                  element={
                    <Suspense fallback={<div />}>
                      <ExternalAuthPage />
                    </Suspense>
                  }
                />
                <Route
                  path="/auth/accept-invite"
                  element={
                    <Suspense fallback={<div />}>
                      <AcceptInvite />
                    </Suspense>
                  }
                />

                {/* Public Demo Page (no auth required) */}
                <Route path="/demo" element={<DemoPage />} />

                {/* External User Interface (no auth required) */}
                <Route path="/external/:token" element={<ExternalUserPage />} />
                <Route path="/external" element={<ExternalUserPage />} />

                {/* Public Verification Portal (Module 4 — no auth required) */}
                <Route path="/verify/:code" element={<VerifyPage />} />
                <Route path="/verify" element={<VerifyPage />} />

                {/* Public Validation Report (shareable, no auth required) */}
                <Route path="/reports/validation/:reportId" element={<ValidationReportPage />} />

                {/* Legal Pages */}
                <Route path="/legal/:type" element={<LegalPage />} />

                {/* Resource Pages */}
                <Route path="/docs" element={<ResourcePage />} />
                <Route path="/help" element={<ResourcePage />} />
                <Route path="/blog" element={<BlogPage />} />
                <Route path="/blog/:slug" element={<BlogArticlePage />} />
                <Route path="/status" element={<ResourcePage />} />
                <Route path="/integrations" element={<ResourcePage />} />
                <Route path="/api-docs" element={<ResourcePage />} />

                {/* License activation is handled by Atlas Studio. The legacy
                    /activate-license route redirects to the Atlas portal. */}
                <Route path="/activate-license" element={ATLAS_STUDIO_PRICING} />
                <Route path="/subscription-blocked" element={<SubscriptionBlockedPage />} />

                {/* User Interface Routes */}
                <Route
                  path="/user"
                  element={
                    <SubscriptionProtectedRoute>
                      <ErrorBoundary>
                        <UserLayout />
                      </ErrorBoundary>
                    </SubscriptionProtectedRoute>
                  }
                >
                  <Route index element={<UserDashboard />} />
                  <Route path="documents" element={<DocumentsPage />} />
                  <Route path="documents/:id" element={<DocumentDetailPage />} />
                  <Route path="workflows" element={<WorkflowsPage />} />
                  <Route path="workflows/:id" element={<WorkflowsPage />} />
                  <Route path="signatures" element={<SignaturesPage />} />
                  <Route path="signatures/:id" element={<SignDocumentPage />} />
                  <Route path="settings" element={<SettingsPage />} />
                  <Route path="settings/team" element={<TeamSettingsPage />} />
                  <Route path="profile" element={<ProfilePage />} />
                  <Route path="notifications" element={<NotificationsPage />} />
                  <Route path="calendar" element={<CalendarPage />} />
                  <Route path="billing" element={<AtlasStudioRedirect destination="billing" />} />
                  <Route path="projects" element={<ProjectsPage />} />
                  <Route path="projects/:id" element={<ProjectDetailPage />} />
                  <Route path="analytics/reports" element={<ExecutiveReportPage />} />
                  <Route path="analytics/benchmark" element={<ExecutiveReportPage />} />
                  <Route path="analytics/roi" element={<ExecutiveReportPage />} />
                  <Route path="analytics/best-practices" element={<ExecutiveReportPage />} />
                  <Route path="support" element={<UserSupportPage />} />
                </Route>

                {/* Admin Interface Routes */}
                <Route
                  path="/admin"
                  element={
                    <AdminRoute>
                      <ErrorBoundary>
                        <AdminLayout />
                      </ErrorBoundary>
                    </AdminRoute>
                  }
                >
                  <Route index element={<AdminDashboard />} />
                  <Route path="documents" element={<DocumentsPage />} />
                  <Route path="documents/:id" element={<DocumentDetailPage />} />
                  <Route path="workflows" element={<WorkflowsPage />} />
                  <Route path="workflows/:id" element={<WorkflowsPage />} />
                  <Route path="signatures" element={<SignaturesPage />} />
                  <Route path="signatures/:id" element={<SignDocumentPage />} />
                  {/* Team & roles management is owned by Atlas Studio Suite (licence_seats).
                      Redirect legacy paths to the unified /admin/settings/team page. */}
                  <Route path="users" element={<Navigate to="/admin/settings/team" replace />} />
                  <Route path="roles" element={<Navigate to="/admin/settings/team" replace />} />
                  <Route path="settings/team" element={<TeamSettingsPage />} />
                  <Route path="organization" element={<OrganizationPage />} />
                  <Route path="archives" element={<ArchivesPage />} />
                  <Route path="audit" element={<AuditPage />} />
                  <Route path="analytics" element={<AnalyticsPage />} />
                  <Route path="settings" element={<SettingsPage />} />
                  <Route path="profile" element={<ProfilePage />} />
                  <Route path="notifications" element={<NotificationsPage />} />
                  <Route path="calendar" element={<CalendarPage />} />
                  <Route path="billing" element={<AtlasStudioRedirect destination="billing" />} />
                  <Route path="projects" element={<ProjectsPage />} />
                  <Route path="projects/:id" element={<ProjectDetailPage />} />
                  <Route path="analytics/reports" element={<ExecutiveReportPage />} />
                  <Route path="analytics/benchmark" element={<ExecutiveReportPage />} />
                  <Route path="analytics/roi" element={<ExecutiveReportPage />} />
                  <Route path="analytics/best-practices" element={<ExecutiveReportPage />} />
                  <Route path="support" element={<UserSupportPage />} />
                </Route>

                {/* Super Admin Interface Routes */}
                <Route
                  path="/superadmin"
                  element={
                    <SuperAdminRoute>
                      <ErrorBoundary>
                        <SuperAdminLayout />
                      </ErrorBoundary>
                    </SuperAdminRoute>
                  }
                >
                  <Route index element={<SuperAdminDashboard />} />
                  <Route path="tenants" element={<TenantsPage />} />
                  <Route path="tenants/new" element={<TenantsPage />} />
                  <Route path="users" element={<SuperAdminUsersPage />} />
                  <Route path="analytics" element={<SuperAdminAnalyticsPage />} />
                  <Route path="system" element={<SuperAdminSystemPage />} />
                  <Route path="security" element={<SuperAdminSecurityPage />} />
                  <Route path="logs" element={<SuperAdminLogsPage />} />
                  <Route path="alerts" element={<SuperAdminAlertsPage />} />
                  <Route path="landing-page" element={<LandingPageEditorPage />} />
                  <Route path="settings" element={<SuperAdminSettingsPage />} />
                  {/* Billing/pricing/addons → Atlas Studio portal */}
                  <Route path="pricing" element={ATLAS_STUDIO_PRICING} />
                  <Route path="addons" element={ATLAS_STUDIO_PRICING} />
                  <Route path="billing" element={ATLAS_STUDIO_BILLING} />
                  <Route path="billing/*" element={ATLAS_STUDIO_BILLING} />
                  {/* Support */}
                  <Route path="support" element={<SuperAdminSupportPage />} />
                  {/* Marketing */}
                  <Route path="marketing" element={<MarketingPage />} />
                  <Route path="marketing/posts" element={<MarketingPublicationsPage />} />
                  <Route path="marketing/posts/new" element={<MarketingPublicationsPage />} />
                  <Route path="marketing/calendar" element={<MarketingCalendarPage />} />
                  <Route path="marketing/templates" element={<MarketingTemplatesPage />} />
                  <Route path="marketing/accounts" element={<MarketingAccountsPage />} />
                  <Route path="marketing/analytics" element={<MarketingAnalyticsPage />} />
                  <Route path="marketing/blog" element={<MarketingBlogPage />} />
                  <Route path="marketing/subscribers" element={<MarketingSubscribersPage />} />
                  <Route path="marketing/newsletters" element={<MarketingNewslettersPage />} />
                </Route>

                {/* Legacy /app routes - redirect to /user */}
                <Route path="/app" element={<Navigate to="/user" replace />} />
                <Route path="/app/*" element={<Navigate to="/user" replace />} />

                {/* Catch all - redirect to home */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
