import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// This is the Vite config for the React SPA (frontend)
export default defineConfig({
  root: 'frontend',
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './frontend'),
    },
  },
  build: {
    outDir: './dist', // Build the SPA to /frontend/dist
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
    port: 5173,
  }
})