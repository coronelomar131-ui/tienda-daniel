# Encender el cobro con tarjeta (Mercado Pago)

Todo el código ya está listo y desplegado. **Lo único que falta es tu cuenta de
Mercado Pago**: un token y una clave, que se guardan en Supabase (nunca en el
código, nunca en el chat, nunca en `config.js`).

Mientras no lo hagas, la tienda funciona igual: pedido con transferencia y
WhatsApp. El botón "Pagar con tarjeta" no aparece hasta que el servidor
confirma que ya tiene el token.

## Cómo funciona (para que sepas qué estás prendiendo)

1. El cliente da "Pagar con tarjeta". La tienda manda **sólo qué par y qué talla**;
   el precio lo pone el servidor desde la base (`crear-pago`).
2. Se guarda el pedido como pendiente y el cliente se va a la pantalla de
   Mercado Pago, donde teclea su tarjeta. Los datos bancarios **nunca pasan por
   la tienda**.
3. Cuando el pago se aprueba, Mercado Pago avisa a `aviso-pago`. Esa función
   **no cree en el aviso**: valida la firma, le vuelve a preguntar a Mercado
   Pago por ese pago y compara el monto contra lo que se pidió cobrar.
4. Sólo entonces el pedido pasa a **Pagado** y la base baja sola la talla
   vendida (si era la última, el par queda agotado). Si el pedido se cancela,
   la talla regresa.
5. El cliente vuelve a `/pago/<pedido>` y ve su resultado.

## Paso a paso

Haz primero todo con las **credenciales de prueba** y hasta el final cambias a
las de producción.

### 1. Tu cuenta

Necesitas una cuenta de Mercado Pago **verificada** (identidad y cuenta
bancaria a donde te van a depositar). Sin eso no puedes cobrar de verdad.

### 2. Crear la aplicación

1. Entra a Mercado Pago Developers (mercadopago.com.mx/developers) con tu cuenta.
2. **Tus integraciones → Crear aplicación.**
3. Producto: **Checkout Pro**. Modelo de integración: **online payments / tienda**.
4. Ponle de nombre "Prothe Shop".

### 3. Copiar el token de prueba

En tu aplicación: **Credenciales de prueba → Access Token** (empieza con `TEST-`).
Solo necesitas ese, no la Public Key.

### 4. Guardarlo en Supabase

1. Supabase → tu proyecto → **Edge Functions → Secrets** (o *Project Settings → Edge Functions*).
2. Agrega el secreto **`MP_ACCESS_TOKEN`** con el token.
3. No hace falta volver a desplegar nada: las funciones lo leen al arrancar.

En cuanto lo guardes, el panel (**Tienda → Cobro con tarjeta**) debe cambiar a
"activado" y el carrito empieza a ofrecer "Pagar con tarjeta".

### 5. Avisar a la tienda cuando alguien pague (Webhook)

1. En tu aplicación de Mercado Pago: **Webhooks → Configurar notificaciones**.
2. En **URL de producción** (y también la de pruebas) pega la dirección que te da
   el panel en **Tienda → Cobro con tarjeta → Copiar dirección**. Es:
   `https://buzzupacpoljliobzyip.supabase.co/functions/v1/aviso-pago`
3. Activa el evento **Pagos**.
4. Mercado Pago te da una **clave secreta** para ese webhook. Guárdala en
   Supabase como **`MP_WEBHOOK_SECRET`**.

Sin `MP_WEBHOOK_SECRET` todo funciona igual (el pago se sigue verificando
contra Mercado Pago), pero con ella además se rechazan avisos falsos desde la
puerta. Ponla.

### 6. Probar con dinero de mentira

1. Abre la tienda, agrega un par, "Hacer mi pedido", llena tus datos y da
   **Pagar con tarjeta**.
2. En la pantalla de Mercado Pago paga con una tarjeta de prueba. Están en la
   documentación de Mercado Pago, sección **Tarjetas de prueba** (por país).
   Para México suelen ser una Mastercard y una Visa de prueba, con nombre del
   titular **APRO** para que el pago salga aprobado y **OTHE** para que salga
   rechazado. Revísalas ahí, porque Mercado Pago las puede cambiar.
3. Al terminar debes volver a `/pago/...` y ver **"¡Listo, pagado!"**.
4. En el panel → **Pedidos**: el pedido debe salir **Pagado**, y en el
   catálogo la talla vendida ya no debe aparecer.
5. Repite con el nombre **OTHE** para ver el rechazo: el pedido queda
   "Rechazado" y la talla no se toca.

### 7. Pasar a producción

1. En Mercado Pago: **Credenciales de producción → Access Token** (empieza con
   `APP_USR-`). Tu aplicación tiene que estar activada para producción.
2. Cambia el secreto **`MP_ACCESS_TOKEN`** en Supabase por ese token.
3. Revisa que el Webhook esté configurado también en **producción** y que
   `MP_WEBHOOK_SECRET` sea la clave del webhook de producción.
4. Haz **una compra real chiquita** (el par más barato, o pon un precio de
   prueba) con tu propia tarjeta, comprueba que sale "Pagado" y devuélvela
   desde Mercado Pago.

## Si algo no sale

| Qué ves | Qué pasa | Qué hacer |
|---|---|---|
| No sale "Pagar con tarjeta" | El servidor no tiene `MP_ACCESS_TOKEN` | Revisa el nombre exacto del secreto |
| "Mercado Pago no aceptó el cobro" | El token es inválido, o es de otra cuenta | Copia de nuevo el token; que sea el de la misma aplicación |
| Pagas y el pedido sigue en Pendiente | El aviso no está llegando | Revisa la URL del webhook y los registros de `aviso-pago` (Supabase → Edge Functions → aviso-pago → Logs) |
| En los registros: "Firma invalida" | `MP_WEBHOOK_SECRET` no es la clave de ese webhook | Copia la clave del webhook correcto (prueba y producción tienen cada una la suya) |
| En los registros: "Monto distinto al esperado" | Alguien pagó un monto que no es el del pedido | El pedido no se marca pagado; revísalo en Mercado Pago |
| Después de pagar te regresa a una página rara | El dominio de la tienda no está en la lista | Si cambias de dominio, agrega el nuevo en el secreto `ORIGENES_PERMITIDOS` (separados por comas) |

Un cobro con tarjeta que el cliente abandona sin pagar queda como pedido
pendiente; después de una hora el panel lo marca **"No terminó el pago"** y ya
no lo cuenta como dinero que te deben.

## Con el MCP de Mercado Pago (opcional)

Mercado Pago tiene un servidor MCP para que Claude consulte tu cuenta:

```bash
claude mcp add --transport http mercadopago https://mcp.mercadopago.com/mcp
```

Para usarlo hacen falta dos cosas: que el entorno de la sesión permita el
dominio `mcp.mercadopago.com` (Network access del entorno) y iniciar sesión con
tu cuenta cuando te lo pida. Las herramientas nuevas sólo aparecen en una
sesión nueva. **No es necesario para que la tienda cobre**: la tienda habla
directo con la API de Mercado Pago desde las funciones de Supabase.
