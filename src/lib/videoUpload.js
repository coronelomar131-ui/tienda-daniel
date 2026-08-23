import { supabase } from './supabase';

export const LIMITE_MB = 30;

// Sube un video en dos pasos: primero le pide permiso al servidor (que revisa
// tu clave) y luego sube el archivo con ese permiso temporal. La bodega nunca
// queda abierta para que cualquiera suba cosas.
export async function subirVideo(pass, file, alAvanzar) {
    const mb = file.size / (1024 * 1024);
    if (mb > LIMITE_MB) {
        throw new Error(`El video pesa ${mb.toFixed(0)} MB y el límite son ${LIMITE_MB} MB. Recórtalo o bájale calidad.`);
    }

    alAvanzar?.('Pidiendo permiso…');
    const { data: permiso, error: errorPermiso } = await supabase.functions.invoke('permiso-video', {
        body: { pass, tipo: file.type },
    });

    if (errorPermiso) {
        // El detalle util viene en el cuerpo de la respuesta, no en el error.
        let detalle = '';
        try { detalle = (await errorPermiso.context?.json())?.error || ''; } catch { /* sin detalle */ }
        throw new Error(detalle || 'No se pudo preparar la subida del video');
    }
    if (permiso?.error) throw new Error(permiso.error);

    alAvanzar?.(`Subiendo ${mb.toFixed(1)} MB…`);
    const { error: errorSubida } = await supabase.storage
        .from('videos')
        .uploadToSignedUrl(permiso.ruta, permiso.token, file, { contentType: file.type });

    if (errorSubida) throw new Error('No se pudo subir el video: ' + errorSubida.message);

    alAvanzar?.('Listo');
    return permiso.url;
}
