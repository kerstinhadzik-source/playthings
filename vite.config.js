import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    target: 'esnext',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        privacy: resolve(__dirname, 'privacy.html'),
        products: resolve(__dirname, 'products.html'),
        login: resolve(__dirname, 'login.html'),
        crm: resolve(__dirname, 'crm.html')
      }
    }
  },
  server: {
    port: 3000,
    open: true
  },
  preview: {
    port: 4173
  }
});
