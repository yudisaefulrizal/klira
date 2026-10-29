import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: process.env.KLIRA_DEV === '1' ? undefined : {
      '/auth/instagram': { target: `http://127.0.0.1:${process.env.PORT || '8074'}` },
      '/webhook/instagram': { target: `http://127.0.0.1:${process.env.PORT || '8074'}` },
      '/instagram': { target: `http://127.0.0.1:${process.env.PORT || '8074'}` },
      '/api': { target: `http://127.0.0.1:${process.env.PORT || '8074'}`, ws: true },
    },
  },
  resolve: {
    alias: { '@klira/shared': fileURLToPath(new URL('../../packages/shared/src/index.ts', import.meta.url)) },
  },
});
