// El color de fondo de cada par.
//
// En el catálogo cada tarjeta va sobre su propio tono, como en las tiendas de
// muebles: una reja de un solo gris se ve a catálogo de refacciones; con color
// se ve a tienda. Los tonos son lavados a propósito, porque lo que tiene que
// resaltar es el tenis, no el fondo.
//
// El tono NO es al azar: sale del id del par. Así el mismo par trae el mismo
// color siempre — en el catálogo, en la ficha y en el carrito — y no parpadea
// de color cada vez que se recarga la página.

const TONOS = [
    { fondo: '#EFE8D8', borde: '#E2D8C2' },   // arena
    { fondo: '#E2EAE4', borde: '#CFDCD3' },   // salvia
    { fondo: '#DFE6F1', borde: '#CBD6E8' },   // cielo
    { fondo: '#F0E3DB', borde: '#E3D0C4' },   // barro
    { fondo: '#E9E7E3', borde: '#D9D6D0' },   // piedra
    { fondo: '#E7E4F0', borde: '#D6D1E5' },   // lavanda
];

// Suma de letras: no necesita ser criptográfico, solo repartir parejo y dar
// siempre el mismo número para el mismo texto.
const numeroDe = (texto) => {
    let n = 0;
    for (let i = 0; i < texto.length; i++) n = (n * 31 + texto.charCodeAt(i)) >>> 0;
    return n;
};

export const tonoDe = (id) => TONOS[numeroDe(String(id ?? '')) % TONOS.length];

// Lo que se le pone al style de la tarjeta.
export const estiloTono = (id) => {
    const t = tonoDe(id);
    return { '--tono': t.fondo, '--tono-borde': t.borde };
};

export const CUANTOS_TONOS = TONOS.length;
