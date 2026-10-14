// Las cuentas del panel. Van aparte del dibujo a propósito: así se pueden
// probar solas, sin navegador, y una gráfica mal pintada nunca puede esconder
// una cuenta mal hecha.

export const DIAS = 30;

const DIA_MS = 86400000;
// El día local a medianoche. Con UTC, un pedido de las 8 de la noche en México
// caería en el día siguiente y la gráfica mentiría por un día entero.
export const aDia = (fecha) => {
    const d = new Date(fecha);
    if (Number.isNaN(d.getTime())) return null;
    return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
};

// Un pedido abandonado nunca fue una venta: no cuenta en ningún lado.
export const cuentaComoVenta = (p) => !p?.abandonado;

// Serie de DIAS días, terminando HOY. Siempre devuelve los 30 puntos, aunque
// muchos valgan cero: una gráfica con huecos se lee como "no hubo datos",
// cuando lo que hubo fue cero.
export function serieDiaria(pedidos = [], { dias = DIAS, hasta = Date.now() } = {}) {
    const finDia = aDia(hasta);
    const arranque = finDia - (dias - 1) * DIA_MS;

    const porDia = new Map();
    for (const p of pedidos) {
        if (!cuentaComoVenta(p)) continue;
        const d = aDia(p.created_at);
        if (d === null || d < arranque || d > finDia) continue;
        const antes = porDia.get(d) || { pedidos: 0, vendido: 0 };
        antes.pedidos += 1;
        antes.vendido += Number(p.total) || 0;
        porDia.set(d, antes);
    }

    const salida = [];
    for (let i = 0; i < dias; i++) {
        const d = arranque + i * DIA_MS;
        const v = porDia.get(d) || { pedidos: 0, vendido: 0 };
        salida.push({ dia: d, ...v });
    }
    return salida;
}

// Lo de los últimos N días contra los N anteriores, para el "subió/bajó".
export function resumen(pedidos = [], { dias = DIAS, hasta = Date.now() } = {}) {
    const finDia = aDia(hasta);
    const arranque = finDia - (dias - 1) * DIA_MS;
    const arranquePrevio = arranque - dias * DIA_MS;

    const vacio = () => ({ pedidos: 0, vendido: 0, cobrado: 0 });
    const ahora = vacio(), antes = vacio();
    let porCobrar = 0;

    for (const p of pedidos) {
        if (!cuentaComoVenta(p)) continue;
        const total = Number(p.total) || 0;
        const cobrado = Number(p.monto_cobrado) || 0;
        porCobrar += Math.max(0, total - cobrado);

        const d = aDia(p.created_at);
        if (d === null) continue;
        const caja = (d >= arranque && d <= finDia) ? ahora
                   : (d >= arranquePrevio && d < arranque) ? antes
                   : null;
        if (!caja) continue;
        caja.pedidos += 1;
        caja.vendido += total;
        caja.cobrado += cobrado;
    }

    const ticket = ahora.pedidos ? Math.round(ahora.vendido / ahora.pedidos) : 0;
    const ticketAntes = antes.pedidos ? Math.round(antes.vendido / antes.pedidos) : 0;

    return { ahora, antes, ticket, ticketAntes, porCobrar };
}

// El cambio en porcentaje. De cero a algo NO es "+∞ %": es estreno, y se
// dibuja distinto. Devolver null es lo honesto.
export function cambio(ahora, antes) {
    const a = Number(ahora) || 0, b = Number(antes) || 0;
    if (b === 0) return a === 0 ? { pct: 0, estreno: false } : { pct: null, estreno: true };
    return { pct: Math.round(((a - b) / b) * 100), estreno: false };
}

// Topes del eje: números redondos, nunca "7.3".
//
// enteros sirve para contar pedidos: sin él, con un máximo de 1 pedido al día
// el eje queda en 0 / 0.25 / 0.5 / 0.75 / 1, y "0.25 pedidos" no existe. Con
// él, el paso nunca baja de 1 y se usan menos marcas si hace falta.
export function topeEje(maximo, pasos = 4, { enteros = false } = {}) {
    const m = Math.max(1, Math.ceil(Number(maximo) || 0));
    const crudo = m / pasos;
    const magnitud = Math.pow(10, Math.floor(Math.log10(crudo)));
    const bonito = [1, 2, 2.5, 5, 10].find(x => x * magnitud >= crudo) ?? 10;
    let paso = bonito * magnitud;

    if (enteros) {
        paso = Math.max(1, Math.ceil(paso));
        // con el paso en 1, cuatro marcas para un maximo de 1 sobrarian: se
        // recortan las marcas en vez de inventar decimales.
        const cuantas = Math.max(1, Math.ceil(m / paso));
        return { tope: paso * cuantas, paso, pasos: cuantas };
    }
    return { tope: paso * pasos, paso, pasos };
}
