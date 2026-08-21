# PROTHE SHOPS

Tienda en línea de ropa deportiva construida con React + Vite. Diseño editorial en tonos hueso y latón, con pedidos por WhatsApp y catálogo administrable.

## Características

- **Catálogo con filtros por categoría**: Playeras, Shorts, Chamarras y Sets.
- **Carrito de compras**: arma el pedido y se envía completo por WhatsApp con un clic.
- **Pedidos directos por WhatsApp** desde cada producto (con el nombre y precio ya escritos).
- **Enlaces a Mercado Libre** por producto o a tu eshop general.
- **Panel de administración** en `/admin` para añadir y borrar productos sin tocar código (contraseña en `src/components/AdminLogin.jsx`).
- **Fotos opcionales**: si un producto no tiene foto, se muestra un dibujo elegante de la prenda.

## Configuración rápida

1. Edita `src/config.js` y pon tu número de WhatsApp, Instagram, TikTok y Mercado Libre.
2. Edita `src/data/products.js` para tu catálogo inicial (o usa el panel `/admin`).
3. Sube tus fotos a `public/images/` (ver `public/images/INSTRUCCIONES.txt`).

## Desarrollo

```bash
npm install
npm run dev      # servidor local
npm run build    # build de producción
```

Desplegado en Vercel (ver `vercel.json`).
