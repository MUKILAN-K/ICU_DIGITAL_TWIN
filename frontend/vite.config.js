import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('three')) {
            return 'three';
          }
          if (id.includes('chart.js') || id.includes('react-chartjs-2')) {
            return 'charts';
          }
          if (id.includes('lucide-react')) {
            return 'icons';
          }
        },
      },
    },
  },
});
