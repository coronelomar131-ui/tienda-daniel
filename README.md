# PROTHE SHOPS

Tienda en línea de tenis (sneakers) construida con React + Vite. Look oscuro streetwear, pedidos por WhatsApp y catálogo administrable sin tocar código.

## Características

- **Catálogo con filtro por marca** — los filtros salen solos del catálogo: si agregas un par de una marca nueva, su botón aparece automáticamente.
- **Tallas por producto** — el cliente escoge su talla MX antes de agregar al carrito, y la talla viaja en el pedido de WhatsApp.
- **Etiquetas NUEVO y AGOTADO** — los pares agotados se ven atenuados y su botón cambia a "Restock".
- **Carrito** — junta varios pares (cada talla cuenta por separado) y manda el pedido completo con total por WhatsApp.
- **Apartar por WhatsApp** desde cada producto, con marca, modelo, talla y precio ya escritos.
- **Enlaces a Mercado Libre** por producto o a tu eshop general.
- **Panel de administración** en `/admin` para añadir y borrar pares (contraseña en `src/components/AdminLogin.jsx`).
- **Fotos opcionales** — sin foto se muestra un dibujo de tenis.

## Configuración rápida

1. Edita `src/config.js`: número de WhatsApp, Instagram, TikTok y Mercado Libre.
2. Carga tu catálogo desde `/admin`, o edita `src/data/products.js`.
3. Sube tus fotos a `public/images/` (ver `public/images/INSTRUCCIONES.txt`).

## Desarrollo

```bash
npm install
npm run dev      # servidor local
npm run build    # build de producción
npm run lint     # revisión de código
```

Desplegado en Vercel (ver `vercel.json`).
