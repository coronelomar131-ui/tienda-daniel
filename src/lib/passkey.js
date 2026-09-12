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
    const { opciones } = await llamar({ accion: 'opciones-alta', pass, nombre });

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
    const { opciones } = await llamar({ accion: 'opciones-entrar' });

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
