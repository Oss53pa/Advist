import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderConfigErrorScreen } from './configErrorScreen';

describe('renderConfigErrorScreen', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>';
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('remplace le contenu de #root par un message lisible', () => {
    renderConfigErrorScreen(['VITE_SUPABASE_URL est absente ou vide.']);

    const root = document.getElementById('root')!;
    expect(root.innerHTML).not.toBe('');
    expect(root.textContent).toContain('Application indisponible');
  });

  it('détaille les problèmes hors production', () => {
    renderConfigErrorScreen(['VITE_SUPABASE_URL est absente ou vide.']);

    expect(document.getElementById('root')!.textContent).toContain('VITE_SUPABASE_URL');
  });

  it('expose le rôle alert pour les lecteurs d’écran', () => {
    renderConfigErrorScreen(['peu importe']);

    expect(document.querySelector('[role="alert"]')).not.toBeNull();
  });

  it('journalise le diagnostic complet', () => {
    const problems = ['souci A', 'souci B'];
    renderConfigErrorScreen(problems);

    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('advist'), problems);
  });

  // Le contenu vient de la configuration : il doit être inséré en texte, jamais
  // interprété comme du balisage.
  it('n’interprète pas le contenu comme du HTML', () => {
    renderConfigErrorScreen(['<img src=x onerror="alert(1)">']);

    const root = document.getElementById('root')!;
    expect(root.querySelector('img')).toBeNull();
    expect(root.textContent).toContain('<img src=x onerror="alert(1)">');
  });

  it('ne casse pas si #root est absent', () => {
    document.body.innerHTML = '';
    expect(() => renderConfigErrorScreen(['souci'])).not.toThrow();
  });

  it('remplace tout contenu déjà présent dans #root', () => {
    document.getElementById('root')!.innerHTML = '<span>contenu précédent</span>';
    renderConfigErrorScreen(['souci']);

    expect(document.getElementById('root')!.textContent).not.toContain('contenu précédent');
  });
});
