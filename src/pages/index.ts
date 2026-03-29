/**
 * Pages index
 * Only export pages that are NOT lazy-loaded in App.tsx
 * All other pages are loaded via React.lazy() for code splitting
 */

// Critical pages loaded immediately (not lazy)
export { LandingPage } from './LandingPage';
export { LoginPage, RegisterPage, ProfileSelectPage } from './auth';

// Legacy exports (kept for backwards compatibility if needed elsewhere)
export { Dashboard } from './Dashboard';
