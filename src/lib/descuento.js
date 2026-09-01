// El descuento no se guarda: se calcula del precio anterior contra el actual.
// Asi el porcentaje nunca puede contradecir al precio que se cobra.
//
// price sigue siendo lo unico que se cobra; priceBefore es solo para enseñar
// el tachado, por eso el carrito y los pagos no tocan nada de esto.
export function verDescuento(par) {
    const antes = Number(par?.priceBefore) || 0;
    const ahora = Number(par?.price) || 0;
    if (!antes || !ahora || antes <= ahora) return null;

    const pct = Math.round((1 - ahora / antes) * 100);
    if (pct < 1) return null;           // "-0%" no es una oferta

    return { antes, ahora, pct };
}

export const pesos = (n) => `$${Number(n).toLocaleString('es-MX')}`;

// Los dos lados de la cuenta, para que el dueño pueda escribir cualquiera de
// los dos y el otro se llene solo.
//
// Lo que se GUARDA siempre es el precio anterior; el porcentaje es nomas una
// forma comoda de capturarlo. Guardar el porcentaje seria peor: si luego
// cambia el precio, la etiqueta quedaria mintiendo.

export function antesDesdePct(precio, pct) {
    const p = Number(precio);
    const d = Number(pct);
    if (!p || !Number.isFinite(d) || d <= 0 || d >= 100) return null;

    const exacto = Math.round(p / (1 - d / 100));
    // Un "antes" de $3,870 se ve mas de tienda que uno de $3,867. Solo se
    // redondea si el porcentaje sigue siendo el mismo que escribio.
    const redondo = Math.round(exacto / 10) * 10;
    const pctDe = (antes) => Math.round((1 - p / antes) * 100);
    if (redondo > p && pctDe(redondo) === Math.round(d)) return redondo;
    return exacto > p ? exacto : null;
}

export function pctDesdeAntes(precio, antes) {
    const p = Number(precio);
    const a = Number(antes);
    if (!p || !a || a <= p) return null;
    const pct = Math.round((1 - p / a) * 100);
    return pct >= 1 ? pct : null;
}
