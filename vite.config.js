import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  // --- Server & Env settings ---
  plugins: [],
  envDir: './',           // look for .env files in project root
  envPrefix: 'PAYPAL',

  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
    },
  },

  // --- Multi-page build settings ---
  build: {
    rollupOptions: {
      input: {
        // HTML pages that should become entry points
        main:       resolve(__dirname, 'public/index.html'),
        playground: resolve(__dirname, 'public/automation-playground.html'),
        hebrew:     resolve(__dirname, 'public/index-he.html'),
        payment:    resolve(__dirname, 'public/payment.html'),   // ← fixed path
      },
    },
  },
})
