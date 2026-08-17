import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],
  build: {
    rollupOptions: {
      output: {
        // Split the big eager vendor libs out of the app chunk so index-*.js stays
        // small and the browser can cache vendor chunks across deploys (they only
        // change when the dependency does). dompurify is deliberately NOT grouped
        // here - it is only reachable from the lazy ReaderPage chunk.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (['react', 'react-dom', 'react-router', 'react-redux', '@reduxjs/toolkit', 'use-sync-external-store']
            .some(name => id.includes(`node_modules/${name}`) || id.includes(`node_modules/${name}/`))) return 'react-vendor'
          if (id.includes('node_modules/framer-motion')) return 'motion'
          if (id.includes('node_modules/react-icons') || id.includes('node_modules/lucide-react')) return 'icons'
          if (id.includes('node_modules/lexical') || id.includes('node_modules/@lexical')) return 'lexical'
          return undefined
        },
      },
    },
  },
})
