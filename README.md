# PROTHE SHOPS

Tienda de tenis (sneakers) hecha con React + Vite, con catálogo en base de datos
y pedidos por WhatsApp. El dueño administra la tienda desde el celular, sin tocar código.

## Cómo se ve

Bandas de tinta y papel: barra y portada en negro, catálogo en blanco para que
manden las fotos de los tenis, y naranja de caja de tenis como único acento.
Tipografía Big Shoulders Display + Barlow.

## Qué hace

- **Catálogo en la nube.** Los pares viven en Supabase, así que lo que subes
  desde `/admin` lo ven todos tus clientes al instante.
- **Filtro por marca**, generado solo desde el catálogo: si subes un par de una
  marca nueva, su botón aparece sin tocar nada.
- **Tallas por par.** El cliente escoge su talla MX antes de agregar al carrito,
  y la talla viaja en el pedido de WhatsApp.
- **Etiquetas NUEVO y AGOTADO.** Los agotados se atenúan y su botón cambia a
  "Restock".
- **Carrito** que junta varios pares (cada talla cuenta aparte) y manda el pedido
  completo con total por WhatsApp.
- **Fotos comprimidas** al subirlas (máx. 1200 px, JPEG) para que la tienda no
  pese; cada tarjeta pide su foto solo cuando aparece en pantalla.

## Panel de administración

Está en `/admin`.

- **La primera vez que entras, tú creas la clave.** No hay clave de fábrica y no
  está escrita en el código: se guarda como hash en la base.
- Desde ahí subes pares (marca, modelo, precio, tallas, etiqueta, foto), borras
  los que ya vendiste y cambias tu clave.
- Tras 10 intentos fallidos, el acceso se bloquea 15 minutos.

## Seguridad del catálogo

Cualquiera puede **leer** el catálogo (es una tienda). Para **escribir** no basta
la llave pública: las reglas de la base (RLS) no permiten escribir directo. Solo
se puede a través de funciones del servidor que exigen tu clave. Si alguien saca
la llave publicable del código, no puede alterar tu tienda.

## Configuración

1. `src/config.js`: número de WhatsApp, Instagram, TikTok y Mercado Libre.
2. `src/lib/supabase.js`: URL y llave publicable del proyecto de Supabase.

Si la tienda no logra conectarse con la base, muestra un catálogo de muestra
**avisando en pantalla** que son pares de ejemplo, para no engañar a nadie.

## Desarrollo

```bash
npm install
npm run dev      # servidor local
npm run build    # build de producción
npm run lint     # revisión de código
```

Se publica en Vercel (ver `vercel.json`).
