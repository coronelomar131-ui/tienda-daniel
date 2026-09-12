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

// QUE SE MANDA Y QUE NO.
//
// El contador de visitas reporta la direccion tal cual, y la pantalla de "ya
// pagaste" es /pago/<numero largo del pedido>. Ese numero es la LLAVE de ese
// pedido: quien lo tenga puede consultar su folio, su estado y su monto. No
// tiene por que salir de tu tienda y acabar en los registros de nadie mas,
// aunque ese "nadie mas" sea Vercel. Aqui se tapa antes de salir.
//
// Y de paso: tus propias vueltas por el panel no son visitas de clientes.
// Contarlas te ensucia el unico numero que si te importa, asi que no se mandan.
const filtrarVisita = (evento) => {
  const donde = evento?.url || '';
  if (/\/admin(\/|$|\?|#)/.test(donde)) return null;        // lo tuyo no es trafico
  return { ...evento, url: donde.replace(/\/pago\/[^/?#]+/, '/pago/[pedido]') };
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ShopProvider>
      <App />
      <Analytics beforeSend={filtrarVisita} />
    </ShopProvider>
  </StrictMode>,
)
