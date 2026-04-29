// Build vitrine — levelstudios.ca
// Contient : landing page, portail Pathé (neo), contact, réservation publique
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  build: {
    outDir: 'dist-public',
    emptyOutDir: true,
    rollupOptions: {
      input: './index.public.html',
    },
  },
  root: '.',
  publicDir: 'public',
})
