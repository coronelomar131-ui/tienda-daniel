// Lo que comparten los tickets de la tienda.

export const fechaCorta = () =>
    new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }).replace('.', '');

// Cada dígito del folio es un patrón fijo de barras (los del EAN): así el
// mismo folio siempre dibuja el mismo código.
const PATRONES = ['0001101', '0011001', '0010011', '0111101', '0100011', '0110001', '0101111', '0111011', '0110111', '0001011'];
export const bitsDeBarras = (codigo) =>
    '101' + [...codigo].map(d => PATRONES[Number(d)] || PATRONES[0]).join('') + '101';
