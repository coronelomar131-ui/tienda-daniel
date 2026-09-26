import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// Da un permiso temporal para subir UNA foto, y solo si la clave del panel es
// correcta. La bodega nunca queda abierta a que cualquiera suba archivos.
//
// Se piden varias a la vez (un par puede llevar 5 fotos), por eso acepta un
// numero de permisos en la misma llamada: pedirlos de uno en uno serian cinco
// viajes al servidor antes de empezar a subir.

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const TIPOS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const MAX_PERMISOS = 8;

const responder = (cuerpo: unknown, status = 200) =>
  new Response(JSON.stringify(cuerpo), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return responder({ error: "Método no permitido" }, 405);

  let cuerpo: { pass?: string; tipo?: string; cuantas?: number };
  try {
    cuerpo = await req.json();
  } catch {
    return responder({ error: "Petición inválida" }, 400);
  }

  const pass = (cuerpo.pass || "").trim();
  const tipo = (cuerpo.tipo || "image/jpeg").trim();
  const cuantas = Math.min(Math.max(Number(cuerpo.cuantas) || 1, 1), MAX_PERMISOS);

  if (!pass) return responder({ error: "Falta la clave" }, 400);

  const extension = TIPOS[tipo];
  if (!extension) {
    return responder({ error: "Ese archivo no es una foto (usa JPG, PNG o WebP)" }, 400);
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: correcta, error: errorClave } = await admin.rpc("admin_ok", { pass });
  if (errorClave) return responder({ error: "No se pudo verificar la clave" }, 500);
  if (!correcta) return responder({ error: "Clave incorrecta" }, 401);

  const permisos = [];
  for (let i = 0; i < cuantas; i++) {
    const ruta = `${crypto.randomUUID()}.${extension}`;
    const { data, error } = await admin.storage.from("fotos").createSignedUploadUrl(ruta);
    if (error || !data) return responder({ error: "No se pudo preparar la subida" }, 500);
    const { data: publico } = admin.storage.from("fotos").getPublicUrl(ruta);
    permisos.push({ ruta: data.path, token: data.token, url: publico.publicUrl });
  }

  return responder({ permisos });
});
