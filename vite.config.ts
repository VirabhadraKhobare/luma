import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'https://luma-eight-sepia.vercel.app/api',
      '/health': 'https://luma-eight-sepia.vercel.app/health',
    },
  },
})
