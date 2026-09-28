import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
  },
  build: {
    // La libreria de la base va en su propio archivo: cambia menos que la
    // tienda y asi el navegador no la vuelve a bajar con cada cambio.
    rollupOptions: { output: { manualChunks: { supabase: ['@supabase/supabase-js'] } } },
  },
})
