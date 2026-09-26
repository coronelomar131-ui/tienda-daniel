import { createClient } from '@supabase/supabase-js';

// Estos dos datos son publicos a proposito: la llave "publishable" solo puede
// hacer lo que las reglas de la base permiten (leer el catalogo). Escribir
// requiere tu clave del panel, que se verifica del lado del servidor.
const SUPABASE_URL = 'https://buzzupacpoljliobzyip.supabase.co';
const SUPABASE_KEY = 'sb_publishable_3cNkW5MfBML-0CMsh8eh-w_gTzFuNtF';

// Sin este limite, una red caida deja la tienda en "Cargando..." un minuto
// entero antes de rendirse. Preferimos fallar rapido y mostrar el respaldo.
const TIEMPO_LIMITE = 9000;

// no-store: el catalogo cambia cuando el dueño sube o edita un par, y Safari
// en iPhone guarda las respuestas GET sin preguntar. Sin esto, subes tallas y
// el celular te sigue enseñando la version vieja hasta que caduque el cache.
const fetchConLimite = (input, init = {}) => {
    const ctrl = new AbortController();
    const corte = setTimeout(() => ctrl.abort(), TIEMPO_LIMITE);
    return fetch(input, { ...init, cache: 'no-store', signal: ctrl.signal })
        .finally(() => clearTimeout(corte));
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    // La tienda no usa el login de Supabase: el panel tiene el suyo. Pero por
    // defecto la libreria viene lista para "adoptar" una sesion que venga
    // escrita en la direccion (#access_token=...). O sea que un link armado
    // podia hacer que la tienda hablara con la base como otra persona. Como no
    // usamos nada de eso, se apaga.
    auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
    },
    global: { fetch: fetchConLimite },
});

const SIN_RED = /abort|timeout|failed to fetch|network|load failed/i;

// ¿El error fue porque no hubo red, o porque el servidor dijo que no?
// Distinguirlo importa: la puerta del panel se abre "a lo bueno" cuando no hay
// señal, para no sacar al dueño cada vez que se le cae el internet. Pero eso
// estaba decidiendose comparando el TEXTO en español del aviso, y un texto es
// para leerse, no para tomar decisiones de seguridad: el dia que se cambie esa
// frase, la puerta cambia de comportamiento sin que nadie se entere. Esta
// marca viaja pegada al error y no depende de como se escriba el mensaje.
export const esFallaDeRed = (err) => err?.sinRed === true;

// Para el panel: aqui si conviene el mensaje crudo de la base, porque quien lo
// lee es el dueño y le sirve para saber que paso.
export const mensajeDeError = (err) => {
    const texto = err?.message || '';
    if (SIN_RED.test(texto)) return 'No hay conexión con la tienda';
    return texto || 'Algo salió mal';
};

// Todo error que sale de una llamada nace ya con la marca puesta.
export const errorDe = (err, mensaje) => {
    const e = new Error(mensaje ?? mensajeDeError(err));
    if (SIN_RED.test(err?.message || '')) e.sinRed = true;
    return e;
};

// Para el cliente: NUNCA el mensaje crudo. Postgres suelta nombres de tablas,
// de columnas y de reglas, que es un mapa de la base servido en bandeja. Y
// ademas al cliente no le dice nada util.
export const mensajeParaCliente = (err) => {
    const texto = err?.message || '';
    if (SIN_RED.test(texto)) return 'No hay conexión con la tienda';
    return 'No se pudo completar. Vuelve a intentarlo o escríbenos por WhatsApp.';
};

// Un enlace que va a salir en un href tiene que ser http o https. Sin esto,
// cualquier cosa que se guarde en el campo del video o de Mercado Libre acaba
// siendo un enlace en la ficha del par.
export const urlSegura = (u) => {
    const texto = (u || '').trim();
    if (!texto) return '';
    try {
        const p = new URL(texto);
        return (p.protocol === 'https:' || p.protocol === 'http:') ? texto : '';
    } catch {
        return '';
    }
};
