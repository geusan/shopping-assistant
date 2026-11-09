import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
export default defineConfig({
  root: 'apps/web',
  plugins: [react()],
  resolve: { alias: { '@fits/core': path.resolve('packages/core/src/index.ts'), '@fits/ui': path.resolve('packages/ui/index.tsx') } },
  server: { host: '127.0.0.1', port: 5173, strictPort: true, proxy: { '/api': 'http://127.0.0.1:4317' } },
  build: { outDir: '../../dist/web', emptyOutDir: true },
});
