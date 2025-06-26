import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron';
import renderer from 'vite-plugin-electron-renderer';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// https://vitejs.dev/config/
export default defineConfig({
  root: __dirname,
  plugins: [
    react(),
    electron([
      {
        // Main process entry file of the Electron app
        entry: resolve(__dirname, 'packages/app/main/main.ts'),
        onstart(args) {
          // Start Electron app
          args.startup();
        },
        vite: {
          build: {
            sourcemap: true,
            minify: process.env.NODE_ENV === 'production',
            outDir: resolve(__dirname, 'packages/app/dist-electron'),
            rollupOptions: {
              external: ['electron', 'node-pty', 'ws', 'bufferutil', 'utf-8-validate'],
            },
          },
          resolve: {
            alias: {
              '@app': resolve(__dirname, 'packages/app'),
              '@app-main': resolve(__dirname, 'packages/app/main'),
              '@app-renderer': resolve(__dirname, 'packages/app/renderer'),
              '@domains': resolve(__dirname, 'packages/domains'),
              '@features': resolve(__dirname, 'packages/features'), 
              '@shared': resolve(__dirname, 'packages/shared'),
            },
          },
        },
      },
      {
        entry: resolve(__dirname, 'packages/app/preload/preload.ts'),
        onstart(args) {
          // Reload page when preload is built
          args.reload();
        },
        vite: {
          build: {
            sourcemap: true,
            minify: process.env.NODE_ENV === 'production',
            outDir: resolve(__dirname, 'packages/app/dist-electron'),
            rollupOptions: {
              external: ['electron', 'node-pty', 'ws', 'bufferutil', 'utf-8-validate'],
            },
          },
          resolve: {
            alias: {
              '@app': resolve(__dirname, 'packages/app'),
              '@app-main': resolve(__dirname, 'packages/app/main'),
              '@app-renderer': resolve(__dirname, 'packages/app/renderer'),
              '@domains': resolve(__dirname, 'packages/domains'),
              '@features': resolve(__dirname, 'packages/features'), 
              '@shared': resolve(__dirname, 'packages/shared'),
            },
          },
        },
      },
    ]),
    renderer(),
  ],
  resolve: {
    alias: {
      '@app': resolve(__dirname, 'packages/app'),
      '@app-main': resolve(__dirname, 'packages/app/main'),
      '@app-renderer': resolve(__dirname, 'packages/app/renderer'),
      '@domains': resolve(__dirname, 'packages/domains'),
      '@features': resolve(__dirname, 'packages/features'), 
      '@shared': resolve(__dirname, 'packages/shared'),
    },
  },
  server: {
    port: 5173,
  },
  optimizeDeps: {
    exclude: ['electron', 'node-pty', 'ws', 'bufferutil', 'utf-8-validate', 'child_process', 'path', 'http'],
    include: ['react', 'react-dom', 'lucide-react', 'zustand', '@monaco-editor/react'],
  },
  build: {
    outDir: resolve(__dirname, 'packages/app/dist'),
    sourcemap: true,
  },
}); 