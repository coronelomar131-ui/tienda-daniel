// Las categorias al estilo Nike. La llave es lo que se guarda en la base;
// el texto es lo que ve el cliente.
export const CATEGORIAS = [
    { llave: 'calzado',    texto: 'Calzado' },
    { llave: 'ropa',       texto: 'Ropa' },
    { llave: 'deportes',   texto: 'Deportes' },
    { llave: 'accesorios', texto: 'Accesorios y equipo' },
];

export const nombreCategoria = (llave) =>
    CATEGORIAS.find(c => c.llave === llave)?.texto || 'Calzado';

export const enRebajas = (p) => Number(p?.priceBefore) > Number(p?.price);

// Que pares pasan el filtro. Un solo lugar para decidirlo, para que el
// catalogo y el encabezado nunca se contradigan.
export function filtrar(productos, filtro) {
    if (!filtro || filtro.tipo === 'todos') return productos;
    if (filtro.tipo === 'rebajas') return productos.filter(enRebajas);
    if (filtro.tipo === 'categoria') return productos.filter(p => (p.categoria || 'calzado') === filtro.valor);
    if (filtro.tipo === 'marca') return productos.filter(p => p.brand === filtro.valor);
    return productos;
}

export function tituloFiltro(filtro) {
    if (!filtro || filtro.tipo === 'todos') return 'Lo que hay';
    if (filtro.tipo === 'rebajas') return 'Rebajas';
    if (filtro.tipo === 'categoria') return nombreCategoria(filtro.valor);
    return filtro.valor;
}

export const mismoFiltro = (a, b) =>
    (a?.tipo ?? 'todos') === (b?.tipo ?? 'todos') && (a?.valor ?? null) === (b?.valor ?? null);
