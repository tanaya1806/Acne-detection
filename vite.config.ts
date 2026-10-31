import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Dev (npm run dev): talks to the backend on :8000 through the /api proxy.
// Build (npm run build): served by FaceVeda under /acne-lab/, which also proxies /acne-lab/api to the backend.
//   Set ACNE_LAB_OUT to build straight into FaceVeda's static/acne-lab folder.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/acne-lab/' : '/',
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    outDir: process.env.ACNE_LAB_OUT || 'dist',
    emptyOutDir: true,
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
}))
