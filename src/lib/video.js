// Reconoce de donde viene el video para mostrarlo como toca.
//   propio   -> archivo que subiste tu; se reproduce dentro de la pagina
//   youtube  -> se incrusta
//   enlace   -> TikTok e Instagram no dejan reproducirse fuera de su app,
//               asi que para esos se muestra una tarjeta que lleva al post
export function leerVideo(url) {
    const limpia = (url || '').trim();
    if (!limpia) return null;

    if (/\.(mp4|webm|mov)(\?|$)/i.test(limpia) || /\/storage\/v1\/object\/public\/videos\//.test(limpia)) {
        return { tipo: 'propio', url: limpia, sitio: 'Video' };
    }

    const yt = limpia.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{6,})/i);
    if (yt) return { tipo: 'youtube', id: yt[1], url: limpia, sitio: 'YouTube' };

    if (/tiktok\.com/i.test(limpia)) return { tipo: 'enlace', url: limpia, sitio: 'TikTok' };
    if (/instagram\.com/i.test(limpia)) return { tipo: 'enlace', url: limpia, sitio: 'Instagram' };

    return { tipo: 'enlace', url: limpia, sitio: 'Ver video' };
}
