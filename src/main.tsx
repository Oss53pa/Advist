import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './i18n';
import { initSentry } from './utils/logger';
import { captureError, initAtlasErrorMonitor } from './lib/atlasErrorMonitor';
import { supabaseConfigProblems } from './lib/supabase';
import { renderConfigErrorScreen } from './lib/configErrorScreen';

// Initialize error monitoring before rendering
initSentry();
// + remontée vers la console Atlas Studio (Error Monitor + Bug-Triage ASVC).
initAtlasErrorMonitor('advist');

// Garde-fou de démarrage : sans configuration Supabase exploitable, l'app ne
// peut rien faire d'utile. On affiche un diagnostic lisible plutôt que de la
// monter sur un client inopérant — et surtout plutôt que la page blanche muette
// que produisait l'ancienne exception au chargement du module.
if (supabaseConfigProblems.length > 0) {
  renderConfigErrorScreen(supabaseConfigProblems);
  // Un déploiement mal configuré doit être visible côté exploitant, pas
  // seulement côté visiteur.
  void captureError(`Configuration Supabase invalide : ${supabaseConfigProblems.join(' | ')}`, {
    component: 'main',
    context: 'startup',
    severity: 'critical',
  });
} else {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}
