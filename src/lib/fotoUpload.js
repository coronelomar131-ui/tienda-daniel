import { supabase } from './supabase';

// Sube las fotos a la bodega de archivos, no a la base de datos.
//
// Antes se guardaban dentro de la base como texto base64. Eso funciona con
// unos cuantos pares y se cae con muchos: el texto pesa 33% mas que el
// archivo, viaja por la base en vez de por la red de entrega, y el navegador
// no lo puede guardar en cache como imagen (o sea, se vuelve a bajar cada vez).
//
// Igual que los videos: primero se piden permisos al servidor, que revisa la
// clave, y luego se suben los archivos con esos permisos. La bodega nunca
// queda abierta.
export async function subirFotos(pass, blobs, alAvanzar) {
    if (!blobs.length) return [];

    alAvanzar?.('Pidiendo permiso…');
    const { data: respuesta, error } = await supabase.functions.invoke('permiso-foto', {
        body: { pass, tipo: 'image/jpeg', cuantas: blobs.length },
    });

    if (error) {
        let detalle = '';
        try { detalle = (await error.context?.json())?.error || ''; } catch { /* sin detalle */ }
        throw new Error(detalle || 'No se pudo preparar la subida de las fotos');
    }
    if (respuesta?.error) throw new Error(respuesta.error);

    const permisos = respuesta?.permisos || [];
    if (permisos.length < blobs.length) throw new Error('No alcanzaron los permisos de subida');

    const urls = [];
    for (let i = 0; i < blobs.length; i++) {
        alAvanzar?.(`Subiendo foto ${i + 1} de ${blobs.length}…`);
        const { error: fallo } = await supabase.storage
            .from('fotos')
            .uploadToSignedUrl(permisos[i].ruta, permisos[i].token, blobs[i], { contentType: 'image/jpeg' });
        if (fallo) throw new Error('No se pudo subir la foto ' + (i + 1) + ': ' + fallo.message);
        urls.push(permisos[i].url);
    }

    alAvanzar?.(null);
    return urls;
}
