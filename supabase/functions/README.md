# Funciones del servidor (Supabase Edge Functions)

Estas cuatro funciones son el código que corre en el servidor, no en el
navegador. Aquí es donde vive lo que no se le puede confiar al celular del
cliente: los precios, el cobro y las llaves.

| Función | Qué hace | `verify_jwt` |
|---|---|---|
| `crear-pago` | Arma el cobro con tarjeta en Mercado Pago. **El precio siempre sale de la base**, nunca del navegador. | sí |
| `aviso-pago` | Recibe el aviso de Mercado Pago cuando alguien paga. Valida la firma, **le vuelve a preguntar a Mercado Pago** y exige que el monto cuadre. | no (lo llama Mercado Pago) |
| `permiso-foto` | Da un permiso temporal para subir una foto, solo con la clave del panel. | sí |
| `permiso-video` | Igual, para un video. | sí |
| `passkey` | Face ID / huella para entrar al panel. | sí |

## Secretos que necesitan (se ponen en Supabase, nunca en el código)

- `MP_ACCESS_TOKEN` — el token de Mercado Pago. Sin esto no se cobra con tarjeta.
- `MP_WEBHOOK_SECRET` — para comprobar que el aviso de pago viene de verdad de
  Mercado Pago. Si no está puesto, la firma no se valida (el pago igual se
  verifica preguntándole a Mercado Pago, pero conviene ponerlo).
- `ORIGENES_PERMITIDOS` — los dominios desde los que se acepta trabajar,
  separados por comas. Si no se pone, el único permitido es el de la tienda.
  **No metas localhost aquí en producción**: una passkey dada de alta en
  localhost quedaría amarrada a ese "dominio" y cualquier página local podría
  pedirse una sesión de admin de la tienda de verdad.

`SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` los pone Supabase solo.

## Para subir un cambio

Estas funciones se despliegan aparte del sitio (Vercel no las toca). Lo que
está en esta carpeta es lo que debe estar desplegado: si editas aquí, súbelo.
