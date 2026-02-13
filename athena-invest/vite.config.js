import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
    target: 'esnext'
  },
  server: {
    port: 3001,
    open: true
  },
  preview: {
    port: 4174
  }
});
