import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@mediapipe/pose': path.resolve(__dirname, 'src/dummy-mediapipe-pose.js'),
    },
  },
  optimizeDeps: {
    exclude: ['@mediapipe/pose'],
  },
})