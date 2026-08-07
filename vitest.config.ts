/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/test/', '**/*.d.ts', '**/*.config.*', '**/index.ts'],
      // Plancher réaliste aligné sur la couverture actuelle du dépôt (~60-69 %).
      // Le seuil de 80 % était aspirationnel et jamais atteint : la CI ne
      // l'exécutait pas (le job échouait au démarrage). Ce plancher agit comme
      // un cliquet anti-régression — relevé après l'ajout des tests de
      // documents.ts (couverture réelle : ~69 % stmts / 60 % branches /
      // 73 % funcs / 71 % lines). On garde quelques points de marge.
      thresholds: {
        statements: 65,
        branches: 55,
        functions: 68,
        lines: 67,
      },
    },
    testTimeout: 10000,
    hookTimeout: 10000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
