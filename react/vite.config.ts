import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Asset URL prefix. Keep this aligned with PUBLIC_BASE_PATH in src/basePath.ts.
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist'
  }
});