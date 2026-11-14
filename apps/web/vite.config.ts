import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Consume the core straight from source: no build step while developing.
      '@kobi-xray/core': fileURLToPath(
        new URL('../../packages/core/src/index.ts', import.meta.url),
      ),
    },
  },
  server: {
    port: 5173,
    // `kobi-xray --no-open` serves the snapshot; the dev server proxies to it.
    proxy: { '/api': 'http://localhost:4777' },
  },
  build: {
    chunkSizeWarningLimit: 1500,
  },
});
