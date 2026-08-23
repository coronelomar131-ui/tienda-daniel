// La sesion del panel dura una semana, para no pedir la clave cada vez que
// se cierra la pestana. Se guarda con fecha de caducidad y se limpia sola.
const LLAVE = 'protheAdmin';
const DURACION = 7 * 24 * 60 * 60 * 1000;

export function guardarSesion(pass) {
    try {
        localStorage.setItem(LLAVE, JSON.stringify({ pass, vence: Date.now() + DURACION }));
    } catch { /* almacenamiento no disponible */ }
}

export function leerSesion() {
    try {
        const crudo = localStorage.getItem(LLAVE);
        if (!crudo) return null;
        const { pass, vence } = JSON.parse(crudo);
        if (!pass || !vence || Date.now() > vence) {
            localStorage.removeItem(LLAVE);
            return null;
        }
        return pass;
    } catch {
        return null;
    }
}

export function cerrarSesion() {
    try { localStorage.removeItem(LLAVE); } catch { /* no disponible */ }
}
