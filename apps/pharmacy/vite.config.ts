import path from 'path';
import { fileURLToPath } from 'url';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    dedupe: ['react', 'react-dom'],
  },
  server: {
    port: 5173,
    open: true,
    // 强制 HMR 使用 WebSocket 并关闭任意代理，避免 token 或代理异常
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 5173,
    },
  },
  build: {
    target: 'es2020',
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false, // Vercel 优化
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // 生产环境移除console
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.debug', 'console.info'],
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          // React核心
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // Supabase
          supabase: ['@supabase/supabase-js'],
          // 表单相关
          form: ['react-hook-form', '@hookform/resolvers', 'zod'],
          // 图表库
          chart: ['recharts'],
          // UI组件库 - 分割成更小的chunk
          'ui-core': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-popover',
            '@radix-ui/react-select',
          ],
          'ui-form': [
            '@radix-ui/react-checkbox',
            '@radix-ui/react-radio-group',
            '@radix-ui/react-switch',
            '@radix-ui/react-label',
          ],
          'ui-feedback': [
            '@radix-ui/react-alert-dialog',
            '@radix-ui/react-toast',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-progress',
          ],
          'ui-layout': [
            '@radix-ui/react-accordion',
            '@radix-ui/react-collapsible',
            '@radix-ui/react-tabs',
            '@radix-ui/react-scroll-area',
            '@radix-ui/react-separator',
          ],
          // 状态管理和数据获取
          state: ['zustand', '@tanstack/react-query'],
          // 工具库
          utils: [
            'date-fns',
            'clsx',
            'tailwind-merge',
            'class-variance-authority',
          ],
        },
        // 优化chunk命名
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
    chunkSizeWarningLimit: 800, // 降低警告阈值以促进更好的分割
    cssCodeSplit: true, // CSS代码分割
    reportCompressedSize: false, // 加快构建速度
  },
  // 确保静态资源正确处理
  publicDir: 'public',
  // Vercel 部署优化
  base: '/',
  // 确保静态资源路径正确
  assetsInclude: ['**/*.png', '**/*.ico', '**/*.svg'],
});
