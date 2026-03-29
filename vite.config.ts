import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import compression from 'vite-plugin-compression';

// https://vitejs.dev/config/
export default defineConfig({
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
          // Core React
          if (id.includes('node_modules/react-dom')) {
            return 'vendor-react-dom';
          }
          if (id.includes('node_modules/react/')) {
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
          if (id.includes('node_modules/react-hook-form') || id.includes('node_modules/@hookform') || id.includes('node_modules/zod')) {
            return 'vendor-forms';
          }
          // i18n
          if (id.includes('node_modules/i18next') || id.includes('node_modules/react-i18next')) {
            return 'vendor-i18n';
          }
          // PDF generation (lazy load only when needed)
          if (id.includes('node_modules/html2pdf') || id.includes('node_modules/html2canvas') || id.includes('node_modules/jspdf')) {
            return 'vendor-pdf';
          }
          // QR Code
          if (id.includes('node_modules/qrcode')) {
            return 'vendor-qrcode';
          }
          // Other utilities
          if (id.includes('node_modules/date-fns')) {
            return 'vendor-date';
          }
          if (id.includes('node_modules/axios')) {
            return 'vendor-http';
          }
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
});
