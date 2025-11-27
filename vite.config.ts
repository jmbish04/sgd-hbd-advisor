import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import cloudflare from 'vite-plugin-cloudflare'
import path from 'path'

// This is the Vite config for the React SPA (frontend)
export default defineConfig({
  plugins: [
    // This plugin manages the dev server, proxies API calls
    // to the worker, and handles HMR.
    cloudflare({
      scriptPath: './worker/index.ts',
    }),
    react(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: './dist', // Build the SPA to /dist
    // Optimize for Cloudflare Workers
    minify: 'esbuild', // Fast, efficient minification
    target: 'esnext', // Modern JS for Workers runtime
    rollupOptions: {
      output: {
        // Optimize chunk splitting for faster loads
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': ['lucide-react', 'recharts'],
        },
      },
    },
  },
  server: {
    // Proxy is handled by vite-plugin-cloudflare
    port: 5173,
  }
})
