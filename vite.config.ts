import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    // Cloudflare Tunnel (trycloudflare.com or your custom hostname)
    allowedHosts: true,
  },
  preview: {
    host: true,
    allowedHosts: true,
  },
})
