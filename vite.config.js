import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  // ─── Multi-entry build ───────────────────────────────────────────────────
  // public site · admin dashboard · contributor form are separate HTML pages
  build: {
    rollupOptions: {
      input: {
        main:       resolve(__dirname, 'index.html'),
        admin:      resolve(__dirname, 'admin/index.html'),
        contribute: resolve(__dirname, 'contribute/index.html'),
      },
      output: {
        // Supabase is the only large dependency — give it a stable vendor chunk name
        manualChunks(id) {
          if (id.includes('@supabase')) return 'vendor-supabase';
        },
      },
    },
    // Strip file paths from chunk names — no personal data leaks via filenames
    chunkFileNames: 'assets/[hash].js',
    assetFileNames: 'assets/[hash][extname]',
    sourcemap: false, // no source maps in production
  },

  // ─── Dev server ──────────────────────────────────────────────────────────
  server: {
    port: 5173,
    open: true,
  },

  // ─── Path alias for cleaner imports ──────────────────────────────────────
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});
