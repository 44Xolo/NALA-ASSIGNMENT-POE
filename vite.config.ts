import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const disableHmr =
  (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.DISABLE_HMR === 'true';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: true,
    hmr: !disableHmr,
    watch: disableHmr ? null : {},
  },
  preview: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: true,
  },
});
