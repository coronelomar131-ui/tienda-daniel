import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "npm:@simplewebauthn/server@13";

// ENTRAR CON FACE ID / HUELLA (passkeys)
//
// La passkey ES la credencial. El telefono guarda una llave privada que nunca
// sale de el y que solo se desbloquea con la cara o la huella; aqui solo vive
// la llave PUBLICA. Por eso es mas seguro que una contraseña: no hay nada que
// adivinar, y quien se robe la base no encuentra nada con que entrar.
//
// La verificacion de firmas la hace @simplewebauthn/server. Escribir a mano el
// parseo de CBOR/COSE y la comprobacion de firmas seria la peor forma de hacer
// esto: es justo donde se cuelan los errores que rompen toda la seguridad.

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const responder = (cuerpo: unknown, status = 200) =>
  new Response(JSON.stringify(cuerpo), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });

// De donde se acepta que venga la peticion. El navegador mete el origen real
// dentro de lo que se firma, asi que esto NO se puede falsificar desde el
// cliente: si no esta en la lista, la firma no cuadra y se rechaza.
// La lista sale de una variable de entorno (ORIGENES_PERMITIDOS, separados por
// comas). Antes traía localhost aquí escrito: una passkey dada de alta en
// localhost queda amarrada al "dominio" localhost, y cualquier página corriendo
// en localhost de esa computadora podía pedirse una sesión de admin DE LA
// TIENDA DE VERDAD. En producción la lista es un solo dominio.
const ORIGENES = (Deno.env.get("ORIGENES_PERMITIDOS") ??
  "https://tienda-daniel-pearl.vercel.app")
  .split(",").map((o) => o.trim().replace(/\/$/, "")).filter(Boolean);

const rpIdDe = (origen: string) => new URL(origen).hostname;

// OJO, aqui estuvo un error que costo caro: si a la libreria se le pasa el reto
// como TEXTO, lo trata como si fueran letras sueltas y lo vuelve a codificar,
// asi que lo que le llega al telefono NO es lo que guardamos en la base. Al
// volver nunca cuadraba y siempre contestaba "el codigo expiro". Pasandolo como
// bytes, la libreria lo devuelve identico.
const retoEnBytes = (reto: string) => {
  const base = reto.replace(/-/g, "+").replace(/_/g, "/");
  const relleno = base + "=".repeat((4 - (base.length % 4)) % 4);
  return Uint8Array.from(atob(relleno), (c) => c.charCodeAt(0));
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return responder({ error: "Método no permitido" }, 405);

  let cuerpo: {
    accion?: string;
    pass?: string;
    nombre?: string;
    respuesta?: unknown;
    reto?: string;
    origen?: string;
  };
  try {
    cuerpo = await req.json();
  } catch {
    return responder({ error: "Petición inválida" }, 400);
  }

  const origen = (cuerpo.origen || "").replace(/\/$/, "");
  if (!ORIGENES.includes(origen)) {
    return responder({ error: "Origen no permitido" }, 403);
  }
  const rpID = rpIdDe(origen);

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    // ---- 1. Preparar el alta de una passkey (hay que estar dentro del panel) ----
    if (cuerpo.accion === "opciones-alta") {
      const { data: ok } = await admin.rpc("admin_ok", { pass: cuerpo.pass || "" });
      if (!ok) return responder({ error: "Clave incorrecta" }, 401);

      const { data: quien } = await admin.rpc("admin_quien", { pass: cuerpo.pass || "" });
      const fila = Array.isArray(quien) ? quien[0] : quien;
      const usuarioId: string | null = fila?.id ?? null;

      const { data: reto } = await admin.rpc("passkey_reto", {
        p_proposito: "alta", p_usuario: usuarioId,
      });
      if (!reto) return responder({ error: "No se pudo preparar el registro" }, 500);

      const opciones = await generateRegistrationOptions({
        rpName: "Prothe Shop",
        rpID,
        userName: fila?.nombre || "Prothe Shop",
        userDisplayName: fila?.nombre || "Prothe Shop",
        attestationType: "none",
        challenge: retoEnBytes(reto as string),
        authenticatorSelection: {
          // "platform" = el sensor del propio aparato: Face ID, Touch ID, huella.
          authenticatorAttachment: "platform",
          residentKey: "preferred",
          userVerification: "required",
        },
      });
      return responder({ opciones });
    }

    // ---- 2. Guardar la passkey despues de verificar su firma ----
    if (cuerpo.accion === "alta") {
      const { data: ok } = await admin.rpc("admin_ok", { pass: cuerpo.pass || "" });
      if (!ok) return responder({ error: "Clave incorrecta" }, 401);

      const { data: valeReto } = await admin.rpc("passkey_usar_reto", {
        p_reto: cuerpo.reto || "", p_proposito: "alta",
      });
      if (!valeReto) return responder({ error: "El código expiró, inténtalo de nuevo" }, 400);

      const v = await verifyRegistrationResponse({
        response: cuerpo.respuesta as never,
        expectedChallenge: cuerpo.reto || "",
        expectedOrigin: origen,
        expectedRPID: rpID,
        requireUserVerification: true,
      });
      if (!v.verified || !v.registrationInfo) {
        return responder({ error: "No se pudo verificar la huella" }, 400);
      }

      const { data: quien } = await admin.rpc("admin_quien", { pass: cuerpo.pass || "" });
      const fila = Array.isArray(quien) ? quien[0] : quien;

      const cred = v.registrationInfo.credential;
      const { error } = await admin.rpc("passkey_guardar", {
        p_usuario: fila?.id ?? null,
        p_credential_id: cred.id,
        p_llave: btoa(String.fromCharCode(...cred.publicKey)),
        p_contador: cred.counter ?? 0,
        p_nombre: (cuerpo.nombre || "").slice(0, 60),
        p_rp_id: rpID,
      });
      if (error) return responder({ error: "Esa llave ya estaba dada de alta" }, 409);

      return responder({ listo: true });
    }

    // ---- 3. Preparar la entrada ----
    if (cuerpo.accion === "opciones-entrar") {
      const { data: reto } = await admin.rpc("passkey_reto", {
        p_proposito: "entrar", p_usuario: null,
      });
      if (!reto) return responder({ error: "No se pudo preparar la entrada" }, 500);

      const opciones = await generateAuthenticationOptions({
        rpID,
        challenge: retoEnBytes(reto as string),
        userVerification: "required",
      });
      return responder({ opciones });
    }

    // ---- 4. Entrar: se verifica la firma y se abre sesion ----
    if (cuerpo.accion === "entrar") {
      const { data: valeReto } = await admin.rpc("passkey_usar_reto", {
        p_reto: cuerpo.reto || "", p_proposito: "entrar",
      });
      if (!valeReto) return responder({ error: "El código expiró, inténtalo de nuevo" }, 400);

      const resp = cuerpo.respuesta as { id?: string };
      const { data: guardada } = await admin.rpc("passkey_buscar", {
        p_credential_id: resp?.id || "",
        p_rp_id: rpID,
      });
      const pk = Array.isArray(guardada) ? guardada[0] : guardada;
      if (!pk) return responder({ error: "No se pudo verificar la huella" }, 401);

      const llave = Uint8Array.from(atob(pk.llave_publica), (c) => c.charCodeAt(0));

      const v = await verifyAuthenticationResponse({
        response: cuerpo.respuesta as never,
        expectedChallenge: cuerpo.reto || "",
        expectedOrigin: origen,
        expectedRPID: rpID,
        credential: {
          id: resp!.id!,
          publicKey: llave,
          counter: Number(pk.contador ?? 0),
        },
        requireUserVerification: true,
      });
      if (!v.verified) return responder({ error: "No se pudo verificar la huella" }, 401);

      const { data: token } = await admin.rpc("passkey_entrar", {
        p_credential_id: resp!.id!,
        p_contador: v.authenticationInfo.newCounter ?? 0,
      });
      if (!token) return responder({ error: "No se pudo abrir la sesión" }, 500);

      return responder({ token });
    }

    return responder({ error: "Acción desconocida" }, 400);
  } catch (e) {
    console.error("passkey", cuerpo.accion, e);
    return responder({ error: "No se pudo completar la operación" }, 500);
  }
});
