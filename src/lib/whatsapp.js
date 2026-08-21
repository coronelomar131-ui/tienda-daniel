import { config } from '../config';

// Arma un enlace de WhatsApp con el mensaje ya escrito.
// Se usa siempre dentro de un <a href> normal: window.open() lo bloquean
// muchos navegadores de celular y los visores en iframe.
export const waLink = (text) =>
    `https://wa.me/${config.whatsappNumber}?text=${encodeURIComponent(text)}`;

export const waPlain = () => `https://wa.me/${config.whatsappNumber}`;
