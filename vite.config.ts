import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  // Use relative paths for Electron compatibility
  // In production, index.html is loaded via file:// protocol from ASAR
  base: './',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
    include: ['papaparse'],
  },
  server: {
    port: 5173,
    strictPort: true,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    // Ensure assets are in a subdirectory with relative paths
    assetsDir: 'assets',
    // Generate sourcemaps for debugging production builds
    sourcemap: false,
    rollupOptions: {
      output: {
        // Disable code splitting to avoid path resolution issues in Electron
        manualChunks: undefined,
        // Ensure consistent asset naming
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
      },
    },
  },
});
