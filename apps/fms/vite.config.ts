import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'fms-icon.svg', 'apple-touch-icon.svg'],
      manifest: {
        name: 'FMS Assessment System',
        short_name: 'FMS',
        description: 'Professional Functional Movement Screen Assessment System',
        theme_color: '#2563eb',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: '/',
        icons: [
          {
            src: '/favicon.svg',
            type: 'image/svg+xml',
            sizes: 'any',
            purpose: 'any'
          },
          {
            src: '/fms-icon.svg',
            type: 'image/svg+xml',
            sizes: '64x64',
            purpose: 'any'
          },
          {
            src: '/apple-touch-icon.svg',
            type: 'image/svg+xml',
            sizes: '180x180',
            purpose: 'any'
          },
          {
            src: '/icon-192.svg',
            type: 'image/svg+xml',
            sizes: '192x192',
            purpose: 'any'
          },
          {
            src: '/icon-512.svg',
            type: 'image/svg+xml',
            sizes: '512x512',
            purpose: 'any'
          }
        ]
      },
            workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webm,gif}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB limit
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: true
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
