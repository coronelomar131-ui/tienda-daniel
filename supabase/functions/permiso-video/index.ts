import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// Da un permiso temporal para subir UN video, y solo si la clave del panel es
// correcta. Asi la bodega nunca queda abierta a que cualquiera suba archivos.

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const TIPOS: Record<string, string> = {
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
};

const responder = (cuerpo: unknown, status = 200) =>
  new Response(JSON.stringify(cuerpo), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return responder({ error: "Método no permitido" }, 405);

  let cuerpo: { pass?: string; tipo?: string };
  try {
    cuerpo = await req.json();
  } catch {
    return responder({ error: "Petición inválida" }, 400);
  }

  const pass = (cuerpo.pass || "").trim();
  const tipo = (cuerpo.tipo || "").trim();

  if (!pass) return responder({ error: "Falta la clave" }, 400);

  const extension = TIPOS[tipo];
  if (!extension) {
    return responder({ error: "Ese archivo no es un video (usa MP4, WebM o MOV)" }, 400);
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: correcta, error: errorClave } = await admin.rpc("admin_ok", { pass });
  if (errorClave) return responder({ error: "No se pudo verificar la clave" }, 500);
  if (!correcta) return responder({ error: "Clave incorrecta" }, 401);

  const ruta = `${crypto.randomUUID()}.${extension}`;
  const { data, error } = await admin.storage.from("videos").createSignedUploadUrl(ruta);
  if (error || !data) return responder({ error: "No se pudo preparar la subida" }, 500);

  const { data: publico } = admin.storage.from("videos").getPublicUrl(ruta);

  return responder({ ruta: data.path, token: data.token, url: publico.publicUrl });
});
