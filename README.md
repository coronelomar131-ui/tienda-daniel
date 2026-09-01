# PROTHE SHOP

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

### Si se te olvida la clave

La clave **no se puede leer**: se guarda como hash bcrypt, que va en un solo
sentido. Lo único que se puede hacer es volver a crearla, y para eso se abre
una ventana con hora de cierre:

```sql
update public.admin_secret set reset_until = now() + interval '30 minutes';
delete from public.admin_attempts;  -- por si quedaste bloqueado
```

Mientras la ventana está abierta, `/admin` vuelve a decir "Crea tu clave" y la
clave vieja deja de entrar. En cuanto pones la nueva, la ventana se cierra
sola: no sirve dos veces.

Se hace así, y no borrando el renglón, porque sin renglón la tienda queda **sin
dueño** y el primero que entre a `/admin` se queda con ella. Con la ventana, si
nadie la usa, caduca y la clave vieja sigue mandando.

### Cuidado al escribir funciones que escriben

La API entra a Postgres con el rol `authenticator`, que precarga `safeupdate`.
Ese guardia **rechaza cualquier `UPDATE` o `DELETE` sin `WHERE`**, incluso
dentro de una función `SECURITY DEFINER`. En una tabla de un solo renglón el
`WHERE` se siente de más, pero sin él la función truena en producción con
`UPDATE requires a WHERE clause`.

Ojo: probar la función desde el SQL editor **no lo detecta**, porque ahí se
corre como `postgres`, que no trae el guardia. Para revisarlo, listar las
sentencias de todas las funciones y comprobar que traigan `WHERE`.

## Videos

Viven en el almacenamiento de Supabase (bodega `videos`, pública para leer,
tope de 30 MB por archivo). Subir no se puede directo: el panel le pide un
permiso temporal a la función `permiso-video`, que revisa la clave del dueño
antes de darlo. Así la bodega nunca queda abierta a que cualquiera suba cosas.

## Pagos con Mercado Pago

Dos botones en el carrito: **Pagar ahora** (Mercado Pago) y **apartar por
WhatsApp**, porque en reventa de tenis la plática suele cerrar la venta.
Opcionalmente el cliente puede **apartar con anticipo** (el porcentaje se
elige desde el panel).

Cómo está armado, y por qué:

- **El precio nunca viaja desde el navegador.** El cliente solo manda qué par
  y qué talla; `crear-pago` busca el precio en la base y arma el cobro con
  ese. Si el precio viniera del celular del cliente, cualquiera podría
  cambiar un par de $5,600 a $1.
- **Checkout Pro**: el cliente mete su tarjeta en la pantalla de Mercado
  Pago, no en la tienda. Así los datos bancarios nunca pasan por aquí.
- **El pago se confirma por aviso del servidor, no porque el cliente
  regrese.** `aviso-pago` valida la firma, le vuelve a preguntar a Mercado
  Pago por ese pago, y compara el monto contra lo que se pidió cobrar. Solo
  entonces marca el pedido como pagado.
- **`orders` y `order_items` tienen RLS sin policies**: llevan nombre y
  teléfono de clientes, así que nadie los lee desde el navegador. Solo salen
  por `admin_orders`, que exige la clave del dueño.

Para encender los pagos hace falta una variable en Supabase (Edge Functions →
Secrets): `MP_ACCESS_TOKEN` con el token de producción de Mercado Pago, y
opcionalmente `MP_WEBHOOK_SECRET` para validar la firma de los avisos. Sin
`MP_ACCESS_TOKEN`, el botón de pagar responde que los pagos no están
configurados y la tienda sigue funcionando por WhatsApp.

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
