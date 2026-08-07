// ============================================================================
// Écran d'erreur de configuration.
// ----------------------------------------------------------------------------
// Filet de sécurité de dernier recours : si l'application ne peut pas démarrer
// faute de configuration valide, on affiche un message lisible plutôt qu'une
// page blanche muette. Volontairement sans dépendance (ni React, ni CSS du
// bundle) : ce code doit fonctionner même quand rien d'autre n'a pu être
// chargé.
// ============================================================================

const BACKGROUND = '#131C2E';
const ACCENT = '#B9975B';

/**
 * Remplace le contenu de #root par un diagnostic lisible.
 *
 * Le détail des problèmes n'est affiché que hors production : en production il
 * n'apporte rien à l'utilisateur final et décrirait la configuration serveur.
 * Le détail complet part dans la console dans tous les cas, pour l'exploitant.
 */
export function renderConfigErrorScreen(problems: string[]): void {
  console.error('[advist] Démarrage impossible — configuration invalide :', problems);

  if (typeof document === 'undefined') return;

  const root = document.getElementById('root');
  if (!root) return;

  const isProd = Boolean((import.meta as unknown as { env?: { PROD?: boolean } }).env?.PROD);

  const container = document.createElement('div');
  container.setAttribute('role', 'alert');
  container.style.cssText = `min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;background:${BACKGROUND};color:#fff;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;`;

  const card = document.createElement('div');
  card.style.cssText =
    'max-width:520px;width:100%;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:32px;';

  const title = document.createElement('h1');
  title.textContent = 'Application indisponible';
  title.style.cssText = `margin:0 0 12px;font-size:20px;font-weight:600;color:${ACCENT};`;

  const message = document.createElement('p');
  message.textContent = isProd
    ? "L'application n'a pas pu démarrer en raison d'un problème de configuration côté serveur. L'équipe technique a été notifiée — merci de réessayer dans quelques minutes."
    : "L'application n'a pas pu démarrer : la configuration Supabase est incomplète ou invalide.";
  message.style.cssText = 'margin:0;font-size:14px;line-height:1.6;color:rgba(255,255,255,0.7);';

  card.append(title, message);

  if (!isProd && problems.length > 0) {
    const list = document.createElement('ul');
    list.style.cssText =
      'margin:16px 0 0;padding-left:20px;font-size:13px;line-height:1.7;color:rgba(255,255,255,0.55);';
    for (const problem of problems) {
      const item = document.createElement('li');
      // textContent (et non innerHTML) : le contenu vient de la configuration.
      item.textContent = problem;
      list.appendChild(item);
    }

    const hint = document.createElement('p');
    hint.textContent = 'Renseignez ces variables dans .env (voir .env.example), puis relancez.';
    hint.style.cssText = 'margin:16px 0 0;font-size:12px;color:rgba(255,255,255,0.35);';

    card.append(list, hint);
  }

  container.appendChild(card);
  root.replaceChildren(container);
}
