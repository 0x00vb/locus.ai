import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron';
import renderer from 'vite-plugin-electron-renderer';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    electron([
      {
        // Main process entry file of the Electron app
        entry: 'electron/main.ts',
        onstart(args) {
          // Start Electron app
          args.startup();
        },
        vite: {
          build: {
            sourcemap: true,
            minify: process.env.NODE_ENV === 'production',
            outDir: 'dist-electron',
            rollupOptions: {
              external: ['electron', 'node-pty'],
            },
          },
          resolve: {
            alias: {
              '@': resolve(__dirname, 'src'),
              '@notty/core': resolve(__dirname, '../core/dist'),
              '@notty/core/main': resolve(__dirname, '../core/dist/main.js'),
              '@notty/ui': resolve(__dirname, '../ui/dist'),
            },
          },
        },
      },
      {
        entry: 'electron/preload.ts',
        onstart(args) {
          // Reload page when preload is built
          args.reload();
        },
        vite: {
          build: {
            sourcemap: true,
            minify: process.env.NODE_ENV === 'production',
            outDir: 'dist-electron',
            rollupOptions: {
              external: ['electron', 'node-pty'],
            },
          },
          resolve: {
            alias: {
              '@': resolve(__dirname, 'src'),
              '@notty/core': resolve(__dirname, '../core/dist'),
              '@notty/ui': resolve(__dirname, '../ui/dist'),
            },
          },
        },
      },
    ]),
    renderer(),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@notty/core': resolve(__dirname, '../core/src'),
      '@notty/ui': resolve(__dirname, '../ui/src'),
    },
  },
  server: {
    port: 5173,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
}); 