// Build gestion — app.levelstudios.ca
// Contient : admin, employé, chef de projet, client classique, freelance
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  build: {
    outDir: 'dist-app',
    emptyOutDir: true,
    rollupOptions: {
      input: './index.app.html',
    },
  },
  root: '.',
  publicDir: 'public',
})
