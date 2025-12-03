import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',  // Use relative paths for FiveM NUI
  root: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    chunkSizeWarningLimit: 800, // Increase limit since FiveM NUI loads locally
    // Use esbuild for minification (faster and included with Vite)
    minify: 'esbuild',
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        // Split vendor chunks for better caching and smaller main bundle
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'map-vendor': ['leaflet'],
          'animation-vendor': ['framer-motion'],
          'state-vendor': ['zustand'],
        }
      }
    }
  },
  // Remove console.log in production
  esbuild: {
    drop: ['console', 'debugger'],
  },
})
