import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import compression from 'vite-plugin-compression';
import { checkSupabaseEnv } from './src/lib/env';

/**
 * Sans configuration Supabase, `npm run build` réussissait sans le moindre
 * avertissement tout en produisant une application entièrement blanche : la
 * panne n'était découverte qu'en production. On échoue donc au build.
 *
 * Uniquement sur `build` : `vite dev` reste utilisable sans .env (l'écran de
 * diagnostic de main.tsx prend alors le relais).
 */
function assertBuildEnv(mode: string): void {
  const fromFiles = loadEnv(mode, process.cwd(), 'VITE_');
  // Une variable peut venir du .env OU de l'environnement du CI / de Vercel.
  const source: Record<string, unknown> = {};
  for (const key of ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY']) {
    source[key] = fromFiles[key] || process.env[key] || '';
  }

  const check = checkSupabaseEnv(source);
  if (check.ok) return;

  throw new Error(
    [
      'Build interrompu — configuration Supabase invalide :',
      ...check.problems.map((p) => `  - ${p}`),
      '',
      "Renseignez ces variables (voir .env.example) avant de construire, sinon l'application se rendrait en page blanche.",
    ].join('\n')
  );
}

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  if (command === 'build') assertBuildEnv(mode);

  return {
    plugins: [
      react(),
      // Gzip compression for production
      compression({
        algorithm: 'gzip',
        ext: '.gz',
        threshold: 1024, // Only compress files > 1KB
      }),
      // Brotli compression (better than gzip)
      compression({
        algorithm: 'brotliCompress',
        ext: '.br',
        threshold: 1024,
      }),
    ],
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            // Core React + React DOM + i18n in ONE chunk (avoids createContext race condition)
            if (
              id.includes('node_modules/react/') ||
              id.includes('node_modules/react-dom') ||
              id.includes('node_modules/i18next') ||
              id.includes('node_modules/react-i18next') ||
              id.includes('node_modules/i18next-browser-languagedetector')
            ) {
              return 'vendor-react';
            }
            // Routing
            if (id.includes('node_modules/react-router')) {
              return 'vendor-router';
            }
            // Icons (lucide is large)
            if (id.includes('node_modules/lucide-react')) {
              return 'vendor-icons';
            }
            // State & Data
            if (id.includes('node_modules/zustand') || id.includes('node_modules/@tanstack')) {
              return 'vendor-state';
            }
            // Forms
            if (
              id.includes('node_modules/react-hook-form') ||
              id.includes('node_modules/@hookform') ||
              id.includes('node_modules/zod')
            ) {
              return 'vendor-forms';
            }
            // PDF generation (lazy load only when needed)
            if (
              id.includes('node_modules/html2pdf') ||
              id.includes('node_modules/html2canvas') ||
              id.includes('node_modules/jspdf')
            ) {
              return 'vendor-pdf';
            }
            // QR Code
            if (id.includes('node_modules/qrcode')) {
              return 'vendor-qrcode';
            }
            // Other utilities
            if (id.includes('node_modules/dompurify')) {
              return 'vendor-security';
            }
          },
        },
      },
      chunkSizeWarningLimit: 600,
      // Enable minification with terser for better compression
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true, // Remove console.log in production
          drop_debugger: true,
        },
      },
      // Optimize CSS
      cssCodeSplit: true,
      // Source maps only in dev
      sourcemap: false,
    },
    // Optimize dev server
    server: {
      warmup: {
        clientFiles: ['./src/main.tsx', './src/App.tsx'],
      },
    },
  };
});
