import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [
      react(),
      tailwindcss()
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 4002,
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'https://devcollab-production-f16f.up.railway.app',
          changeOrigin: true,
        },
        '/socket.io': {
          target: env.VITE_API_URL || 'https://devcollab-production-f16f.up.railway.app',
          ws: true,
          changeOrigin: true
        }
      }
    }
  }
})
