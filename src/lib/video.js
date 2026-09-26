import { urlSegura } from './supabase';

// Reconoce de donde viene el video para mostrarlo como toca.
//   propio   -> archivo que subiste tu; se reproduce dentro de la pagina
//   youtube  -> se incrusta
//   enlace   -> TikTok e Instagram no dejan reproducirse fuera de su app,
//               asi que para esos se muestra una tarjeta que lleva al post
// Solo se reproduce dentro de la pagina lo que esta en nuestra propia bodega.
// Las reglas de seguridad del sitio (la CSP) bloquean cualquier otro servidor,
// y lo hacen EN SILENCIO: se veria un reproductor vacio sin explicacion. Lo de
// fuera se muestra como enlace, que si funciona.
const NUESTRO = /^https:\/\/[\w-]+\.supabase\.co\/storage\/v1\/object\/public\/videos\//i;

export function leerVideo(url) {
    const limpia = urlSegura(url);
    if (!limpia) return null;

    if (NUESTRO.test(limpia)) {
        return { tipo: 'propio', url: limpia, sitio: 'Video' };
    }

    const yt = limpia.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{6,})/i);
    if (yt) return { tipo: 'youtube', id: yt[1], url: limpia, sitio: 'YouTube' };

    if (/tiktok\.com/i.test(limpia)) return { tipo: 'enlace', url: limpia, sitio: 'TikTok' };
    if (/instagram\.com/i.test(limpia)) return { tipo: 'enlace', url: limpia, sitio: 'Instagram' };

    return { tipo: 'enlace', url: limpia, sitio: 'Ver video' };
}
