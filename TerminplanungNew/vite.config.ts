import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    hmr: {
      overlay: false  // Verhindert den Fehler im Vite-Overlay
    }
  }
});
