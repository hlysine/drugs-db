import dotenv from 'dotenv';
dotenv.config();

import { defineConfig } from 'vite';
import reactRefresh from '@vitejs/plugin-react-refresh';
import { VitePWA } from 'vite-plugin-pwa';

const { PORT = 7860 } = process.env;

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [reactRefresh(), VitePWA({ registerType: 'autoUpdate' })],
  server: {
    proxy: {
      '/api': {
        target: `http://localhost:${PORT}`,
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist/app',
  },
});
