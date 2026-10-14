import React, { useMemo, useRef, useState } from 'react';
import { serieDiaria, resumen, cambio, topeEje, DIAS } from '../lib/metricas';
import { pesos } from '../lib/descuento';

// LAS GRÁFICAS DEL PANEL.
//
// Una sola serie a la vez, a propósito. Poner pedidos y dinero juntos pide dos
// escalas en el mismo dibujo, y dos escalas inventan relaciones que no están
// en los datos: la gráfica se vuelve mentira. Por eso hay un interruptor y
// nunca dos ejes.
//
// Los números se calculan en lib/metricas.js, que se prueba aparte. Aquí solo
// se dibuja.

const TINTA = '#1B2A52';
const SUBE = '#1B7A4B';
const BAJA = '#B3261E';

// Caja de dibujo. Los márgenes son para que quepan los números del eje y las
// fechas sin encimarse con la línea.
const AN = 760, AL = 240;
const M = { arriba: 16, derecha: 18, abajo: 26, izquierda: 44 };

const diaCorto = (ms) => new Date(ms).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }).replace('.', '');
const diaLargo = (ms) => new Date(ms).toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' }).replace('.', '');
const miles = (n) => Number(n || 0).toLocaleString('es-MX');
const compacto = (n) => (n >= 1000 ? `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k` : String(n));

// El cambio contra el periodo anterior. Nunca va solo de color: lleva flecha y
// signo, para quien no distingue verde de rojo.
const Delta = ({ ahora, antes, sufijo = '' }) => {
    const c = cambio(ahora, antes);
    if (c.estreno) return <span className="kpi-delta kpi-estreno">↑ nuevo</span>;
    if (c.pct === 0) return <span className="kpi-delta kpi-igual">— igual</span>;
    const sube = c.pct > 0;
    return (
        <span className="kpi-delta" style={{ color: sube ? SUBE : BAJA }}>
            {sube ? '↑' : '↓'} {sube ? '+' : ''}{c.pct}%{sufijo}
        </span>
    );
};

// La rayita de la tarjeta. Es contexto, no lectura fina: sin ejes ni números.
const Rayita = ({ valores }) => {
    const max = Math.max(1, ...valores);
    const paso = valores.length > 1 ? 100 / (valores.length - 1) : 0;
    const puntos = valores.map((v, i) => `${(i * paso).toFixed(2)},${(26 - (v / max) * 24).toFixed(2)}`).join(' ');
    return (
        <svg className="kpi-rayita" viewBox="0 0 100 28" preserveAspectRatio="none" aria-hidden="true">
            <polyline points={puntos} fill="none" stroke={TINTA} strokeWidth="2"
                      strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        </svg>
    );
};

const Tarjeta = ({ titulo, valor, ahora, antes, serie, sufijo }) => (
    <div className="kpi">
        <span className="kpi-titulo">{titulo}</span>
        <strong className="kpi-valor">{valor}</strong>
        <div className="kpi-pie">
            <Delta ahora={ahora} antes={antes} sufijo={sufijo} />
            {serie && <Rayita valores={serie} />}
        </div>
    </div>
);

const PanelGraficas = ({ pedidos = [] }) => {
    const [mide, setMide] = useState('pedidos');     // pedidos | vendido
    const [tabla, setTabla] = useState(false);
    const [encima, setEncima] = useState(null);      // índice del día señalado
    const caja = useRef(null);

    const serie = useMemo(() => serieDiaria(pedidos), [pedidos]);
    const res = useMemo(() => resumen(pedidos), [pedidos]);

    const valores = serie.map(d => d[mide]);
    const dinero = mide === 'vendido';
    const { tope, paso, pasos } = topeEje(Math.max(...valores, 0), 4, { enteros: !dinero });

    const anchoCaja = AN - M.izquierda - M.derecha;
    const altoCaja = AL - M.arriba - M.abajo;
    const x = (i) => M.izquierda + (serie.length > 1 ? (i / (serie.length - 1)) * anchoCaja : anchoCaja / 2);
    const y = (v) => M.arriba + altoCaja - (tope ? (v / tope) * altoCaja : 0);

    const linea = valores.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
    const area = `${linea} L${x(valores.length - 1).toFixed(1)},${y(0).toFixed(1)} L${x(0).toFixed(1)},${y(0).toFixed(1)} Z`;

    const conDatos = serie.filter(d => d.pedidos > 0).length;
    const ultimo = valores[valores.length - 1];

    const seguir = (e) => {
        const el = caja.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        const px = ((e.clientX - r.left) / r.width) * AN;
        const i = Math.round(((px - M.izquierda) / anchoCaja) * (serie.length - 1));
        setEncima(Math.max(0, Math.min(serie.length - 1, i)));
    };

    const marcas = Array.from({ length: (pasos ?? 4) + 1 }, (_, i) => i * paso);

    return (
        <div className="graficas">
            <div className="kpis">
                <Tarjeta titulo={`Pedidos · ${DIAS} días`} valor={miles(res.ahora.pedidos)}
                         ahora={res.ahora.pedidos} antes={res.antes.pedidos}
                         serie={serie.map(d => d.pedidos)} />
                <Tarjeta titulo={`Vendido · ${DIAS} días`} valor={pesos(res.ahora.vendido)}
                         ahora={res.ahora.vendido} antes={res.antes.vendido}
                         serie={serie.map(d => d.vendido)} />
                <Tarjeta titulo="Ticket promedio" valor={pesos(res.ticket)}
                         ahora={res.ticket} antes={res.ticketAntes} />
            </div>

            <div className="gr-caja">
                <div className="gr-cabeza">
                    <div>
                        <h3>{dinero ? 'Vendido' : 'Pedidos'} · últimos {DIAS} días</h3>
                        <span className="gr-sub">
                            {conDatos === 0
                                ? 'Todavía no hay pedidos en este periodo'
                                : `${conDatos} ${conDatos === 1 ? 'día con pedidos' : 'días con pedidos'} de ${DIAS}`}
                        </span>
                    </div>
                    <div className="gr-mandos">
                        <div className="gr-interruptor" role="group" aria-label="Qué medir">
                            <button className={mide === 'pedidos' ? 'on' : undefined}
                                    onClick={() => setMide('pedidos')} aria-pressed={mide === 'pedidos'}>Pedidos</button>
                            <button className={mide === 'vendido' ? 'on' : undefined}
                                    onClick={() => setMide('vendido')} aria-pressed={mide === 'vendido'}>Vendido</button>
                        </div>
                        <button className="gr-tabla-btn" onClick={() => setTabla(t => !t)} aria-pressed={tabla}>
                            {tabla ? 'Ver gráfica' : 'Ver tabla'}
                        </button>
                    </div>
                </div>

                {tabla ? (
                    <div className="gr-tabla">
                        <table>
                            <caption className="sr-solo">{dinero ? 'Vendido' : 'Pedidos'} por día, últimos {DIAS} días</caption>
                            <thead><tr><th scope="col">Día</th><th scope="col">Pedidos</th><th scope="col">Vendido</th></tr></thead>
                            <tbody>
                                {serie.filter(d => d.pedidos > 0).reverse().map(d => (
                                    <tr key={d.dia}>
                                        <td>{diaLargo(d.dia)}</td>
                                        <td>{d.pedidos}</td>
                                        <td>{pesos(d.vendido)}</td>
                                    </tr>
                                ))}
                                {conDatos === 0 && <tr><td colSpan={3} className="gr-nada">Sin pedidos en este periodo</td></tr>}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="gr-lienzo" ref={caja}
                         onPointerMove={seguir} onPointerLeave={() => setEncima(null)}>
                        <svg viewBox={`0 0 ${AN} ${AL}`} preserveAspectRatio="none"
                             role="img" aria-label={`${dinero ? 'Vendido' : 'Pedidos'} por día en los últimos ${DIAS} días`}>
                            {/* rejilla: hilo fino, sólido, discreto */}
                            {marcas.map(v => (
                                <line key={v} x1={M.izquierda} x2={AN - M.derecha} y1={y(v)} y2={y(v)}
                                      stroke="#E3E1DD" strokeWidth="1" vectorEffect="non-scaling-stroke" />
                            ))}
                            {/* el área es un lavado, no un bloque */}
                            <path d={area} fill={TINTA} fillOpacity="0.10" />
                            <path d={linea} fill="none" stroke={TINTA} strokeWidth="2"
                                  strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                            {/* solo se etiqueta la punta, no cada punto */}
                            <circle cx={x(valores.length - 1)} cy={y(ultimo)} r="5"
                                    fill={TINTA} stroke="#FFFFFF" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                            {encima !== null && (
                                <>
                                    <line x1={x(encima)} x2={x(encima)} y1={M.arriba} y2={AL - M.abajo}
                                          stroke={TINTA} strokeWidth="1" strokeOpacity="0.35" vectorEffect="non-scaling-stroke" />
                                    <circle cx={x(encima)} cy={y(valores[encima])} r="5"
                                            fill={TINTA} stroke="#FFFFFF" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                                </>
                            )}
                        </svg>

                        {/* Los números van en HTML y no dentro del SVG: con
                            preserveAspectRatio="none" el dibujo se estira y el
                            texto saldria deformado. */}
                        <div className="gr-eje-y" aria-hidden="true">
                            {[...marcas].reverse().map(v => (
                                <span key={v}>{dinero ? compacto(v) : v}</span>
                            ))}
                        </div>
                        <div className="gr-eje-x" aria-hidden="true">
                            <span>{diaCorto(serie[0].dia)}</span>
                            <span>{diaCorto(serie[Math.floor(serie.length / 2)].dia)}</span>
                            <span>Hoy</span>
                        </div>

                        {encima !== null && (
                            <div className="gr-globo" style={{ left: `${(x(encima) / AN) * 100}%` }}>
                                <span>{diaLargo(serie[encima].dia)}</span>
                                <strong>{dinero ? pesos(serie[encima].vendido) : `${serie[encima].pedidos} ${serie[encima].pedidos === 1 ? 'pedido' : 'pedidos'}`}</strong>
                                <small>{dinero
                                    ? `${serie[encima].pedidos} ${serie[encima].pedidos === 1 ? 'pedido' : 'pedidos'}`
                                    : pesos(serie[encima].vendido)}</small>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PanelGraficas;
