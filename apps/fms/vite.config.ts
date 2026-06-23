import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

const normalizeBasePath = (basePath = '/') => {
  if (basePath === '/') return '/'
  const withLeadingSlash = basePath.startsWith('/') ? basePath : `/${basePath}`
  return withLeadingSlash.endsWith('/') ? withLeadingSlash : `${withLeadingSlash}/`
}

const basePath = normalizeBasePath(process.env.VITE_BASE_PATH)

// https://vitejs.dev/config/
export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png', 'icon-192-maskable.png', 'icon-512-maskable.png'],
      manifest: {
        name: '红医师训练伤防治',
        short_name: '训练伤防治',
        description: '红医师功能性动作筛查与训练伤防治系统',
        theme_color: '#a51f18',
        background_color: '#f4ecdc',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: basePath,
        scope: basePath,
        icons: [
          {
            src: 'favicon.ico',
            type: 'image/x-icon',
            sizes: '16x16 32x32',
            purpose: 'any'
          },
          {
            src: 'apple-touch-icon.png',
            type: 'image/png',
            sizes: '180x180',
            purpose: 'any'
          },
          {
            src: 'icon-192.png',
            type: 'image/png',
            sizes: '192x192',
            purpose: 'any'
          },
          {
            src: 'icon-512.png',
            type: 'image/png',
            sizes: '512x512',
            purpose: 'any'
          },
          {
            src: 'icon-192-maskable.png',
            type: 'image/png',
            sizes: '192x192',
            purpose: 'maskable'
          },
          {
            src: 'icon-512-maskable.png',
            type: 'image/png',
            sizes: '512x512',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB limit
        runtimeCaching: [
          {
            urlPattern: ({ request, sameOrigin }) => sameOrigin && request.destination === 'video',
            handler: 'CacheFirst',
            options: {
              cacheName: 'fms-runtime-video-cache',
              expiration: {
                maxEntries: 8,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          },
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
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined

          if (id.includes('lucide-react')) {
            return 'vendor-icons'
          }

          if (id.includes('react-dom')) {
            return 'vendor-react-dom'
          }

          if (id.includes('react-router') || id.includes('@remix-run')) {
            return 'vendor-router'
          }

          if (id.includes('framer-motion') || id.includes('recharts') || id.includes('/d3-')) {
            return 'vendor-visualization'
          }

          if (id.includes('dexie') || id.includes('zustand') || id.includes('date-fns')) {
            return 'vendor-data'
          }

          return 'vendor'
        },
      },
    },
  },
})
