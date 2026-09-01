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
