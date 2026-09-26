import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// Recibe el aviso de Mercado Pago cuando alguien paga.
//
// verify_jwt va en false a proposito: quien llama es Mercado Pago, no la
// tienda, y no puede mandar una credencial de Supabase. La seguridad NO se
// apoya en el contenido del aviso:
//
//   1. Se valida la firma que manda Mercado Pago (si hay secreto configurado)
//   2. Se le vuelve a PREGUNTAR a Mercado Pago por ese pago con nuestro token
//   3. Solo si Mercado Pago dice "approved" Y el monto coincide con lo que
//      guardamos, el pedido se marca pagado
//
// Asi, aunque alguien descubra esta direccion y mande avisos falsos, no puede
// marcar nada como pagado.

const responder = (texto: string, status = 200) =>
  new Response(texto, { status, headers: { "Content-Type": "text/plain" } });

// Estados que ya decidio una persona desde el panel. Mercado Pago reintenta
// sus avisos varias veces, y sin esto un aviso repetido que llega DESPUES de
// que marcaste "ya lo mande" regresaba el pedido a "pagado" solito: perdias el
// dato de que ya lo habias enviado sin enterarte.
const YA_DECIDIDOS = ["pagado", "enviado", "cancelado"];

async function firmaValida(req: Request, idPago: string): Promise<boolean> {
  const secreto = Deno.env.get("MP_WEBHOOK_SECRET");
  if (!secreto) return true; // sin secreto configurado no se puede validar

  const firma = req.headers.get("x-signature") || "";
  const requestId = req.headers.get("x-request-id") || "";

  const partes = Object.fromEntries(
    firma.split(",").map((p) => p.split("=").map((s) => s.trim())).filter((p) => p.length === 2),
  );
  const ts = partes["ts"];
  const hash = partes["v1"];
  if (!ts || !hash) return false;

  const plantilla = `id:${idPago};request-id:${requestId};ts:${ts};`;
  const llave = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secreto),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const firmado = await crypto.subtle.sign("HMAC", llave, new TextEncoder().encode(plantilla));
  const esperado = [...new Uint8Array(firmado)]
    .map((b) => b.toString(16).padStart(2, "0")).join("");

  return esperado === hash;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return responder("ok");

  const TOKEN = Deno.env.get("MP_ACCESS_TOKEN");
  if (!TOKEN) return responder("sin configurar", 200);

  // Mercado Pago manda el id del pago por cuerpo o por la direccion.
  let idPago = "";
  let tipo = "";
  try {
    const cuerpo = await req.json();
    idPago = String(cuerpo?.data?.id || cuerpo?.id || "");
    tipo = String(cuerpo?.type || cuerpo?.topic || "");
  } catch { /* puede venir vacio */ }

  const url = new URL(req.url);
  idPago = idPago || url.searchParams.get("data.id") || url.searchParams.get("id") || "";
  tipo = tipo || url.searchParams.get("type") || url.searchParams.get("topic") || "";

  // Se contesta 200 aunque no sea de pago, para que Mercado Pago no reintente.
  if (!idPago) return responder("sin id");
  if (tipo && !tipo.includes("payment")) return responder("no es un pago");

  if (!(await firmaValida(req, idPago))) {
    console.error("Firma invalida en el aviso", idPago);
    return responder("firma invalida", 401);
  }

  // Le preguntamos a Mercado Pago directamente. Esto es lo que hace confiable
  // el aviso: no creemos lo que nos mandan, lo verificamos en la fuente.
  const consulta = await fetch(`https://api.mercadopago.com/v1/payments/${idPago}`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });

  if (!consulta.ok) {
    console.error("No se pudo consultar el pago", idPago, consulta.status);
    return responder("no se pudo verificar", 200);
  }

  const pago = await consulta.json();
  const ordenId = String(pago.external_reference || "");
  if (!ordenId) return responder("pago sin pedido");

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: orden } = await admin
    .from("orders")
    .select("id, estado, monto_cobrado")
    .eq("id", ordenId)
    .maybeSingle();

  if (!orden) return responder("pedido no encontrado");

  // Lo que ya decidiste tu en el panel manda sobre un aviso repetido.
  if (YA_DECIDIDOS.includes(orden.estado)) {
    return responder(`ya estaba en ${orden.estado}, no se toca`);
  }

  const aprobado = pago.status === "approved";
  const montoPagado = Number(pago.transaction_amount || 0);

  // Que el monto cuadre con lo que pedimos cobrar.
  if (aprobado && Math.abs(montoPagado - Number(orden.monto_cobrado)) > 0.5) {
    console.error("Monto distinto al esperado", { ordenId, montoPagado, esperado: orden.monto_cobrado });
    return responder("monto no coincide", 200);
  }

  const estado = aprobado
    ? "pagado"
    : (pago.status === "rejected" || pago.status === "cancelled")
      ? "rechazado"
      : "pendiente";

  await admin.from("orders").update({
    estado,
    mp_payment: String(idPago),
    mp_metodo: String(pago.payment_method_id || ""),
    paid_at: aprobado ? new Date().toISOString() : null,
  }).eq("id", ordenId);

  return responder(`pedido ${estado}`);
});
