import { createClient } from '@supabase/supabase-js';

// Estos dos datos son publicos a proposito: la llave "publishable" solo puede
// hacer lo que las reglas de la base permiten (leer el catalogo). Escribir
// requiere tu clave del panel, que se verifica del lado del servidor.
const SUPABASE_URL = 'https://buzzupacpoljliobzyip.supabase.co';
const SUPABASE_KEY = 'sb_publishable_3cNkW5MfBML-0CMsh8eh-w_gTzFuNtF';

// Sin este limite, una red caida deja la tienda en "Cargando..." un minuto
// entero antes de rendirse. Preferimos fallar rapido y mostrar el respaldo.
const TIEMPO_LIMITE = 9000;

const fetchConLimite = (input, init = {}) => {
    const ctrl = new AbortController();
    const corte = setTimeout(() => ctrl.abort(), TIEMPO_LIMITE);
    return fetch(input, { ...init, signal: ctrl.signal })
        .finally(() => clearTimeout(corte));
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false },
    global: { fetch: fetchConLimite },
});

// Los errores de red salen con mensajes tecnicos; los traducimos.
export const mensajeDeError = (err) => {
    const texto = err?.message || '';
    if (/abort|timeout|failed to fetch|network|load failed/i.test(texto)) {
        return 'No hay conexión con la tienda';
    }
    return texto || 'Algo salió mal';
};
