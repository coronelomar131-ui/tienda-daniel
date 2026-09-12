import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// Crea el cobro con tarjeta en Mercado Pago.
//
// REGLA DE ORO: el navegador solo dice QUE par quiere y en que talla.
// El precio SIEMPRE sale de la base de datos aqui en el servidor. Si el
// precio viajara desde el celular del cliente, cualquiera podria cambiar
// un par de $5,600 a $1 y pagar eso.

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// A donde se puede mandar al cliente cuando termina de pagar. Antes se tomaba
// tal cual lo que mandara el navegador, asi que la pantalla de Mercado Pago
// podia acabar devolviendo a una pagina cualquiera: un buen disfraz para un
// fraude. Ahora tiene que estar en la lista o no se pone back_url.
const ORIGENES = (Deno.env.get("ORIGENES_PERMITIDOS") ??
  "https://tienda-daniel-pearl.vercel.app")
  .split(",").map((o) => o.trim().replace(/\/$/, "")).filter(Boolean);

const responder = (cuerpo: unknown, status = 200) =>
  new Response(JSON.stringify(cuerpo), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });

type Pedido = { id: string; size: number | null; qty: number };

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return responder({ error: "Método no permitido" }, 405);

  const TOKEN = Deno.env.get("MP_ACCESS_TOKEN");

  let cuerpo: {
    items?: Pedido[];
    nombre?: string;
    telefono?: string;
    email?: string;
    direccion?: string;
    nota?: string;
    anticipo?: boolean;
    origen?: string;
    ping?: boolean;
  };
  try {
    cuerpo = await req.json();
  } catch {
    return responder({ error: "Petición inválida" }, 400);
  }

  // La tienda pregunta "¿ya se puede cobrar con tarjeta?" antes de enseñar el
  // boton. Sin esto, si no hay token cargado el cliente se iria a una pantalla
  // que truena. Solo contesta si o no: no suelta el token ni nada de la cuenta.
  if (cuerpo.ping === true) return responder({ listo: !!TOKEN });

  if (!TOKEN) {
    return responder({ error: "Los pagos con tarjeta todavía no están activados" }, 503);
  }

  const pedidos = Array.isArray(cuerpo.items) ? cuerpo.items.slice(0, 20) : [];
  if (pedidos.length === 0) return responder({ error: "El carrito está vacío" }, 400);

  // Los mismos minimos que pide el pedido por transferencia: sin nombre y
  // telefono no hay a quien entregarle ni a quien buscar.
  const nombre = (cuerpo.nombre || "").trim();
  const telefono = (cuerpo.telefono || "").trim();
  if (nombre.length < 2) return responder({ error: "Necesitamos tu nombre" }, 400);
  if (telefono.replace(/[^0-9]/g, "").length < 10) {
    return responder({ error: "Necesitamos un teléfono de 10 dígitos" }, 400);
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Freno igual al del pedido por transferencia: que un mismo telefono no
  // pueda llenar la lista de pedidos basura.
  const haceUnaHora = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count: recientes } = await admin
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("telefono", telefono)
    .gt("created_at", haceUnaHora);
  if ((recientes ?? 0) >= 10) {
    return responder({ error: "Ya hay varios pedidos con ese teléfono. Escríbenos por WhatsApp." }, 429);
  }

  // --- Precios reales, desde la base ---
  const ids = [...new Set(pedidos.map((p) => p.id))];
  const { data: productos, error: errorProd } = await admin
    .from("products")
    .select("id, brand, name, price, status, sizes")
    .in("id", ids);

  if (errorProd) return responder({ error: "No se pudo leer el catálogo" }, 500);

  const porId = new Map((productos || []).map((p) => [p.id, p]));
  const lineas: { product_id: string; brand: string; name: string; size: number | null; qty: number; unit_price: number }[] = [];

  for (const linea of pedidos) {
    const prod = porId.get(linea.id);
    if (!prod) return responder({ error: "Uno de los pares ya no está disponible" }, 409);
    if (prod.status === "agotado") {
      return responder({ error: `${prod.brand} ${prod.name} ya se agotó` }, 409);
    }

    const cantidad = Math.min(Math.max(Math.floor(Number(linea.qty) || 1), 1), 10);
    const talla = linea.size === null || linea.size === undefined ? null : Number(linea.size);

    // La talla tambien se valida: no vale pedir una que no existe. Con la baja
    // automatica esto ademas cubre el par que se acaba de vender: si otro
    // cliente iba a medio pagar esa talla, ya no la encuentra.
    const tallas = (prod.sizes || []).map(Number);
    if (tallas.length > 0) {
      if (talla === null || !tallas.includes(talla)) {
        return responder({ error: `Esa talla ya no está en ${prod.brand} ${prod.name}` }, 409);
      }
    }

    lineas.push({
      product_id: prod.id,
      brand: prod.brand,
      name: prod.name,
      size: talla,
      qty: cantidad,
      unit_price: Number(prod.price),
    });
  }

  const total = lineas.reduce((suma, l) => suma + l.unit_price * l.qty, 0);
  if (total <= 0) return responder({ error: "El total no es válido" }, 400);

  // --- Anticipo, si el dueno lo tiene activado ---
  const { data: ajustes } = await admin
    .from("site_settings").select("anticipo_pct").maybeSingle();
  const pct = Number(ajustes?.anticipo_pct ?? 0);
  const quiereAnticipo = cuerpo.anticipo === true && pct > 0 && pct < 100;
  const montoCobrado = quiereAnticipo ? Math.max(1, Math.round(total * pct / 100)) : total;

  // --- Se guarda el pedido antes de mandar a pagar ---
  const { data: orden, error: errorOrden } = await admin
    .from("orders")
    .insert({
      total,
      monto_cobrado: montoCobrado,
      es_anticipo: quiereAnticipo,
      nombre: nombre.slice(0, 120),
      telefono: telefono.slice(0, 30),
      email: (cuerpo.email || "").trim().slice(0, 160),
      direccion: (cuerpo.direccion || "").trim().slice(0, 400) || null,
      nota: (cuerpo.nota || "").trim().slice(0, 500) || null,
      metodo_entrega: "tarjeta",
    })
    .select("id, numero")
    .single();

  if (errorOrden || !orden) return responder({ error: "No se pudo crear el pedido" }, 500);

  const { error: errorItems } = await admin
    .from("order_items")
    .insert(lineas.map((l) => ({ ...l, order_id: orden.id })));
  if (errorItems) return responder({ error: "No se pudo guardar el pedido" }, 500);

  // --- Cobro en Mercado Pago ---
  const pedido = (cuerpo.origen || "").replace(/\/$/, "");
  const origen = ORIGENES.includes(pedido) ? pedido : "";
  // El nombre de la tienda va PRIMERO en el concepto. Esa linea es lo que el
  // cliente lee en la pantalla donde decide si teclea su tarjeta: reconocer
  // la tienda ahi es lo que quita la desconfianza.
  const descripcion = quiereAnticipo
    ? `Prothe Shop · Anticipo ${pct}% del pedido #${orden.numero}`
    : `Prothe Shop · Pedido #${orden.numero}`;

  const preferencia = {
    items: [{
      id: String(orden.numero),
      title: descripcion,
      description: lineas.map((l) => `${l.qty}x ${l.brand} ${l.name}${l.size ? ` T${l.size}` : ""}`).join(", ").slice(0, 250),
      quantity: 1,
      currency_id: "MXN",
      unit_price: montoCobrado,
    }],
    payer: {
      name: nombre.slice(0, 120),
      email: (cuerpo.email || "").trim().slice(0, 160) || undefined,
    },
    // Esto es lo que amarra el pago con el pedido cuando llegue el aviso.
    external_reference: orden.id,
    notification_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/aviso-pago`,
    back_urls: origen
      ? {
        success: `${origen}/pago/${orden.id}`,
        pending: `${origen}/pago/${orden.id}`,
        failure: `${origen}/pago/${orden.id}`,
      }
      : undefined,
    auto_return: origen ? "approved" : undefined,
    statement_descriptor: "PROTHE SHOP",
  };

  const respuesta = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(preferencia),
  });

  const datos = await respuesta.json();

  if (!respuesta.ok) {
    console.error("Mercado Pago rechazó la preferencia", datos);
    await admin.from("orders").update({ estado: "cancelado" }).eq("id", orden.id);
    return responder({ error: "Mercado Pago no aceptó el cobro. Revisa tus credenciales." }, 502);
  }

  await admin.from("orders").update({ mp_preference: datos.id || "" }).eq("id", orden.id);

  return responder({
    orden: orden.id,
    numero: orden.numero,
    total,
    monto_cobrado: montoCobrado,
    es_anticipo: quiereAnticipo,
    pagar_en: datos.init_point || datos.sandbox_init_point,
  });
});
