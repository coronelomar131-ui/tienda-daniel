# PROTHE SHOPS

Tienda de tenis (sneakers) hecha con React + Vite, con catálogo en base de datos
y pedidos por WhatsApp. El dueño administra la tienda desde el celular, sin tocar código.

## Cómo se ve

Fondo blanco, letras negras y azul marino (#1B2A52) para iconos y acentos.
El rojo se reserva para avisos: el sello AGOTADO y los errores del panel.
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
- **Galería por par.** Varias fotos por producto; en el catálogo la segunda
  aparece al pasar el cursor, y en la ficha hay miniaturas para cambiarlas.
- **Página propia de cada par** en `/tenis/:id`, con fotos grandes. Sirve para
  mandarle a un cliente el link de un modelo concreto.
- **Video propio.** Subes el archivo desde el panel y se reproduce dentro de
  la tienda, sin logos de nadie más. También sirve pegar un link: YouTube se
  incrusta, y TikTok e Instagram salen como tarjeta que lleva al post porque
  no permiten reproducirse fuera de su app.
- **Video de portada** que arranca solo, en bucle y sin sonido detrás del
  título, con un velo que mantiene las letras legibles.
- **Fotos comprimidas** al subirlas (máx. 1200 px, JPEG) para que la tienda no
  pese; cada tarjeta pide sus fotos solo cuando aparece en pantalla.

## Panel de administración

Está en `/admin`.

- **La primera vez que entras, tú creas la clave.** No hay clave de fábrica y no
  está escrita en el código: se guarda como hash en la base.
- Desde ahí subes pares (marca, modelo, precio, tallas, etiqueta, video y
  varias fotos de un jalón), **editas** los que ya están sin borrarlos,
  **reordenas** con flechas para decidir qué ve primero el cliente, marcas
  **agotado con un switch** y cambias tu clave.
- La sesión dura una semana: no te pide la clave cada vez que cierras la pestaña.
- Tras 10 intentos fallidos, el acceso se bloquea 15 minutos.

## Videos

Viven en el almacenamiento de Supabase (bodega `videos`, pública para leer,
tope de 30 MB por archivo). Subir no se puede directo: el panel le pide un
permiso temporal a la función `permiso-video`, que revisa la clave del dueño
antes de darlo. Así la bodega nunca queda abierta a que cualquiera suba cosas.

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
