import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // El backend (Express, puerto 3000) no tiene CORS configurado. En vez
      // de tocar un backend ya cerrado y con 57 tests en verde, el proxy de
      // Vite reenvia /api servidor-a-servidor: el navegador solo habla con
      // el origen de Vite, fuera del alcance de CORS.
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
