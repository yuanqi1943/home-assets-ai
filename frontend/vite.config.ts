import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://192.168.50.51:3001',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://192.168.50.51:3001',
        changeOrigin: true,
      },
    },
  },
})
