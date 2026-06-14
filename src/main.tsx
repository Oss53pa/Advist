import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './i18n';
import { initSentry } from './utils/logger';
import { initAtlasErrorMonitor } from './lib/atlasErrorMonitor';

// Initialize error monitoring before rendering
initSentry();
// + remontée vers la console Atlas Studio (Error Monitor + Bug-Triage ASVC).
initAtlasErrorMonitor('advist');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
