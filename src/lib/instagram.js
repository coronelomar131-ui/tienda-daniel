import { config } from '../config';

// El usuario sale del link que está en config.js, así que si cambias el link
// ahí, el @ que se ve en la página cambia solo.
export function igUsuario() {
    const m = /instagram\.com\/([^/?#]+)/i.exec(config.instagramLink || '');
    return m ? m[1] : '';
}
