/**
 * Vitest Test Setup
 * Configuration for the test environment.
 */
import '@testing-library/jest-dom';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

/**
 * Storage en memoire, reellement fonctionnel.
 *
 * Auparavant localStorage/sessionStorage etaient de simples `vi.fn()` sans
 * implementation : `setItem` n'ecrivait rien et `getItem` renvoyait toujours
 * `undefined`. Tout code dependant du stockage etait donc silencieusement
 * intestable — un test pouvait ecrire une valeur, la relire, obtenir `null`
 * et « passer » pour la mauvaise raison.
 *
 * Utiliser `vi.spyOn(localStorage, 'setItem')` dans un test si un espion est
 * necessaire ; le comportement reel reste disponible.
 */
function createStorageMock(): Storage {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => (key in store ? store[key] : null),
    setItem: (key: string, value: string) => {
      store[key] = String(value);
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    key: (index: number) => Object.keys(store)[index] ?? null,
    get length() {
      return Object.keys(store).length;
    },
  } as Storage;
}

Object.defineProperty(window, 'localStorage', { value: createStorageMock() });
Object.defineProperty(window, 'sessionStorage', { value: createStorageMock() });

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
class ResizeObserverMock {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
Object.defineProperty(window, 'ResizeObserver', { value: ResizeObserverMock });

// Mock IntersectionObserver
class IntersectionObserverMock {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  root = null;
  rootMargin = '';
  thresholds = [];
}
Object.defineProperty(window, 'IntersectionObserver', { value: IntersectionObserverMock });

// Suppress console errors in tests (optional - uncomment if needed)
// vi.spyOn(console, 'error').mockImplementation(() => {});
// vi.spyOn(console, 'warn').mockImplementation(() => {});
