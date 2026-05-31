import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { UserLayout, AdminLayout } from './components/layout';
import { ThemeProvider } from './components/theme';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useAuthStore } from './store';
import { useSubscriptionGuard } from './hooks/useSubscriptionGuard';

// Pages d'auth chargées immédiatement (small bundles)
import { LoginPage } from './pages';
import { AtlasStudioRedirect } from './pages/AtlasStudioRedirect';
const ExternalAuthPage = lazy(() => import('./pages/auth/ExternalAuthPage'));

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
const UsersPage = lazy(() => import('./pages/users/UsersPage'));
const RolesPage = lazy(() => import('./pages/users/RolesPage'));
const OrganizationPage = lazy(() => import('./pages/users/OrganizationPage'));
const ArchivesPage = lazy(() => import('./pages/archives/ArchivesPage'));
const AuditPage = lazy(() => import('./pages/archives/AuditPage'));
const AnalyticsPage = lazy(() => import('./pages/admin/AnalyticsPage'));

// Super admin pages removed — Atlas Studio is the platform console.
// Super-admin users authenticating into Advist are redirected to /user
// (see route catch-all and Login redirect logic) and should use Atlas
// Studio for tenant management, billing, marketing, system monitoring,
// support, etc.
const UserSupportPage = lazy(() => import('./pages/user/SupportPage'));

// Lazy loading des pages billing Client
// ClientBillingPage removed — billing handled by Atlas Studio portal

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

// Pages subscription/licence
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

  if (isAuthenticated) {
    return <Navigate to="/user" replace />;
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

  const isAdmin =
    user?.role === 'admin' ||
    user?.role === 'org_admin' ||
    user?.is_org_admin ||
    user?.is_super_admin;
  if (!isAdmin) {
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
                {/* Public landing page — always accessible (auth users
                    can reach it via the "Site vitrine" button in the
                    TopNavBar; unauth users land here by default). */}
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
                {/* Registration + checkout handled by Atlas Studio portal */}
                <Route path="/register" element={<AtlasStudioRedirect destination="register" />} />
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

                {/* Subscription Routes — licences managed on Atlas Studio */}
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
                  <Route path="users" element={<UsersPage />} />
                  <Route path="roles" element={<RolesPage />} />
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

                {/* Legacy /superadmin/* and /app/* routes — Atlas Studio
                    now owns platform-admin (tenants, billing, marketing,
                    system, support). Anyone landing on these old URLs
                    bounces to the user app. */}
                <Route path="/superadmin" element={<Navigate to="/user" replace />} />
                <Route path="/superadmin/*" element={<Navigate to="/user" replace />} />
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
