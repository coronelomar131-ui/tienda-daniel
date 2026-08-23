// Reconoce de donde viene el video para mostrarlo como toca.
// YouTube se puede incrustar directo; Instagram y TikTok necesitan sus
// propios scripts, asi que para esos mostramos una tarjeta que lleva al post.
export function leerVideo(url) {
    const limpia = (url || '').trim();
    if (!limpia) return null;

    const yt = limpia.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{6,})/i);
    if (yt) return { tipo: 'youtube', id: yt[1], url: limpia, sitio: 'YouTube' };

    if (/tiktok\.com/i.test(limpia)) return { tipo: 'enlace', url: limpia, sitio: 'TikTok' };
    if (/instagram\.com/i.test(limpia)) return { tipo: 'enlace', url: limpia, sitio: 'Instagram' };

    return { tipo: 'enlace', url: limpia, sitio: 'Ver video' };
}
