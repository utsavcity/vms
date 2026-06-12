import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifest: false, // static public/manifest.json is the source of truth
      includeAssets: ['icons/icon-192.png', 'icons/icon-512.png'],
      devOptions: { enabled: false },
    }),
  ],
  server: { port: 5173 },
});
