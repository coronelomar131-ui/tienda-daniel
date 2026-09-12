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
  try {
    const u = new URL(evento?.url || '', window.location.origin);

    // Tus vueltas por el panel no son trafico de clientes. Va sin distinguir
    // mayusculas porque el router tampoco distingue: /ADMIN abre el panel.
    if (/^\/admin(\/|$)/i.test(u.pathname)) return null;

    // Al aprobar el pago, Mercado Pago te regresa con la direccion llena de
    // parametros... y uno de ellos (external_reference) es OTRA VEZ el numero
    // del pedido. Tapar solo la ruta dejaba la llave saliendo por la puerta de
    // atras. Se tira todo lo que va despues del '?': para contar visitas no
    // sirve de nada, y ahi es donde se cuelan los datos.
    u.search = '';
    u.hash = '';
    u.pathname = u.pathname.replace(/^\/pago\/[^/]+/i, '/pago/[pedido]');
    return { ...evento, url: u.toString() };
  } catch {
    return null;   // si no se entiende la direccion, mejor no mandar nada
  }
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ShopProvider>
      <App />
      <Analytics beforeSend={filtrarVisita} />
    </ShopProvider>
  </StrictMode>,
)
