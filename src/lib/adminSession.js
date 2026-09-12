// La sesion del panel.
//
// Antes aqui se guardaba LA CONTRASEÑA en texto plano. Eso tenia tres
// problemas: no habia forma de revocarla, la caducidad se decidia en este
// mismo archivo (o sea, se podia reescribir a mano desde la consola del
// navegador), y si algun dia hubiera un XSS se llevaban la credencial de
// verdad en vez de una sesion que se pueda tirar.
//
// Ahora se guarda un token que emite el servidor al entrar. El servidor
// tiene la ultima palabra sobre si sigue valiendo, asi que tocar lo que
// hay aqui no sirve de nada.
const LLAVE = 'protheAdmin';

export function guardarSesion(token) {
    try {
        if (token) localStorage.setItem(LLAVE, token);
    } catch { /* almacenamiento no disponible */ }
}

export function leerSesion() {
    try {
        // Se limpia el formato viejo ({pass, vence}): esa clave ya no sirve
        // para entrar y lo que menos queremos es dejarla ahi tirada.
        const crudo = localStorage.getItem(LLAVE);
        if (!crudo) return null;
        if (crudo.startsWith('{')) {
            localStorage.removeItem(LLAVE);
            return null;
        }
        return crudo;
    } catch {
        return null;
    }
}

export function cerrarSesion() {
    try { localStorage.removeItem(LLAVE); } catch { /* no disponible */ }
}
