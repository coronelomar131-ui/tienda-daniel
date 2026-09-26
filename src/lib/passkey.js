// ENTRAR CON FACE ID / HUELLA (passkeys)
//
// El telefono guarda una llave privada que NUNCA sale de el y que solo se
// desbloquea con la cara o la huella. El servidor solo guarda la llave publica.
// Por eso es mas seguro que una contraseña: no hay nada que adivinar, y quien
// se robe la base no encuentra con que entrar.
//
// Aqui no se verifica nada: eso lo hace el servidor. Este archivo solo traduce
// entre el formato que usa el navegador (ArrayBuffer) y el que viaja por la
// red (texto base64url), y le pide la firma al aparato.
import { supabase } from './supabase';

// --- traducciones entre texto y bytes ---
const aBytes = (txt) => {
    const base = txt.replace(/-/g, '+').replace(/_/g, '/');
    const relleno = base + '='.repeat((4 - (base.length % 4)) % 4);
    const crudo = atob(relleno);
    return Uint8Array.from(crudo, (c) => c.charCodeAt(0));
};

const aTexto = (buffer) => {
    const bytes = new Uint8Array(buffer);
    let s = '';
    for (const b of bytes) s += String.fromCharCode(b);
    return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const llamar = async (cuerpo) => {
    const { data, error } = await supabase.functions.invoke('passkey', {
        body: { ...cuerpo, origen: window.location.origin },
    });
    if (error) {
        let detalle = '';
        try { detalle = (await error.context?.json())?.error || ''; } catch { /* sin detalle */ }
        throw new Error(detalle || 'No se pudo usar la huella');
    }
    if (data?.error) throw new Error(data.error);
    return data;
};

// Safari solo deja abrir el Face ID dentro de los ~5 segundos siguientes al
// toque de la persona. Si primero vamos al servidor por el codigo de un solo
// uso, se acaba ese permiso —y una funcion que lleva rato dormida tarda varios
// segundos en despertar— y Safari contesta "cancelado" sin enseñar nada.
// Por eso el codigo se pide ANTES, mientras nadie ha picado todavia, y al picar
// ya lo tenemos en la mano.
const guardaCodigos = (pedir) => {
    let guardado = null;      // { opciones, cuando }
    let enVuelo = null;
    const FRESCO = 80 * 1000; // el servidor los tira a los 2 minutos

    const refrescar = (arg) => {
        if (enVuelo) return enVuelo;
        enVuelo = pedir(arg)
            .then((o) => { guardado = { opciones: o, cuando: Date.now() }; return o; })
            .catch(() => null)
            .finally(() => { enVuelo = null; });
        return enVuelo;
    };

    return {
        precalentar: refrescar,
        // OJO: esto tiene que ser SINCRONO. En cuanto metamos un await aqui,
        // Safari da por perdido el permiso del toque.
        tomar() {
            if (!guardado || Date.now() - guardado.cuando > FRESCO) return null;
            const o = guardado.opciones;
            guardado = null;
            return o;
        },
        olvidar() { guardado = null; },
    };
};

const codigosEntrar = guardaCodigos(async () =>
    (await llamar({ accion: 'opciones-entrar' })).opciones);

const codigosAlta = guardaCodigos(async ({ pass, nombre }) =>
    (await llamar({ accion: 'opciones-alta', pass, nombre })).opciones);

export const precalentarEntrada = () => codigosEntrar.precalentar();
export const precalentarAlta = (pass, nombre) => codigosAlta.precalentar({ pass, nombre });

// ¿Este aparato tiene Face ID, Touch ID o huella disponible para la web?
export async function hayFaceId() {
    try {
        if (!window.PublicKeyCredential) return false;
        if (!window.isSecureContext) return false;   // sin https no existe
        return await window.PublicKeyCredential
            .isUserVerifyingPlatformAuthenticatorAvailable();
    } catch {
        return false;
    }
}

// ¿Ya hay alguna passkey dada de alta? Si no, no tiene caso ofrecer el boton.
export async function hayAlgunaDadaDeAlta() {
    try {
        const { data, error } = await supabase.rpc('passkey_hay');
        if (error) return false;
        return data === true;
    } catch {
        return false;
    }
}

// Dar de alta este aparato. Hay que estar ya dentro del panel: la passkey se
// agrega a una sesion que ya se probo con la clave.
export async function darDeAltaFaceId(pass, nombre) {
    // Si ya lo traiamos precalentado, esto no espera nada y Safari alcanza a
    // abrir el Face ID con el permiso del toque todavia vivo.
    const opciones = codigosAlta.tomar()
        || (await llamar({ accion: 'opciones-alta', pass, nombre })).opciones;

    const credencial = await navigator.credentials.create({
        publicKey: {
            ...opciones,
            challenge: aBytes(opciones.challenge),
            user: { ...opciones.user, id: aBytes(opciones.user.id) },
            excludeCredentials: (opciones.excludeCredentials || [])
                .map((c) => ({ ...c, id: aBytes(c.id) })),
        },
    });
    if (!credencial) throw new Error('No se completó el registro');

    await llamar({
        accion: 'alta',
        pass,
        nombre,
        reto: opciones.challenge,
        respuesta: {
            id: credencial.id,
            rawId: aTexto(credencial.rawId),
            type: credencial.type,
            authenticatorAttachment: credencial.authenticatorAttachment,
            clientExtensionResults: credencial.getClientExtensionResults(),
            response: {
                clientDataJSON: aTexto(credencial.response.clientDataJSON),
                attestationObject: aTexto(credencial.response.attestationObject),
                transports: credencial.response.getTransports?.() || [],
            },
        },
    });
    return true;
}

// Entrar. Devuelve el token de la sesion, igual que el login con clave.
export async function entrarConFaceId() {
    const opciones = codigosEntrar.tomar()
        || (await llamar({ accion: 'opciones-entrar' })).opciones;

    const credencial = await navigator.credentials.get({
        publicKey: {
            ...opciones,
            challenge: aBytes(opciones.challenge),
            allowCredentials: (opciones.allowCredentials || [])
                .map((c) => ({ ...c, id: aBytes(c.id) })),
        },
    });
    if (!credencial) throw new Error('No se completó');

    const { token } = await llamar({
        accion: 'entrar',
        reto: opciones.challenge,
        respuesta: {
            id: credencial.id,
            rawId: aTexto(credencial.rawId),
            type: credencial.type,
            authenticatorAttachment: credencial.authenticatorAttachment,
            clientExtensionResults: credencial.getClientExtensionResults(),
            response: {
                clientDataJSON: aTexto(credencial.response.clientDataJSON),
                authenticatorData: aTexto(credencial.response.authenticatorData),
                signature: aTexto(credencial.response.signature),
                userHandle: credencial.response.userHandle
                    ? aTexto(credencial.response.userHandle) : undefined,
            },
        },
    });
    return token;
}
