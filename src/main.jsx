import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ShopProvider } from './context/ShopContext'
// Las visitas de Vercel. En produccion el script sale de tu propio dominio
// (/_vercel/insights/), asi que las reglas de seguridad del sitio lo dejan
// pasar sin abrirle la mano a nadie mas.
// Ojo: la ruta es /react, no /next — esta tienda es React con Vite.
import { Analytics } from '@vercel/analytics/react'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ShopProvider>
      <App />
      <Analytics />
    </ShopProvider>
  </StrictMode>,
)
