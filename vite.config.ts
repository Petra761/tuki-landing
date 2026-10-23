// vite.config.ts (raíz del proyecto)
// Configuración mínima de Vite para React. Separamos Three.js en su propio paquete
// para que solo se descargue cuando el hero ya está visible.
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    // Three.js pesa más de 500 kB, pero se descarga aparte y bajo demanda (ver Hero.tsx).
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/three')) return 'three'
        },
      },
    },
  },
})
