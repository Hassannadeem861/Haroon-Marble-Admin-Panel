import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// /api -> local backend (live par yahi kaam vercel.json rewrite karta hai) — frontend aur backend
// same-origin lagte hain, is liye refresh token cookie chalta hai.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5080',
        changeOrigin: true,
      },
    },
  },
})
