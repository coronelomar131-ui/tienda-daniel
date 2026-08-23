import React, { useCallback, useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { adminOrders, adminOrdersResumen, adminSetAnticipo, fetchAnticipo } from '../lib/pagos';

const pesos = (n) => '$' + Number(n || 0).toLocaleString('es-MX');

const ETIQUETA = {
    pagado: { texto: 'Pagado', clase: 'ok' },
    pendiente: { texto: 'Pendiente', clase: 'espera' },
    rechazado: { texto: 'Rechazado', clase: 'falla' },
    cancelado: { texto: 'Cancelado', clase: 'falla' },
};

const Pedidos = ({ pass }) => {
    const [pedidos, setPedidos] = useState([]);
    const [resumen, setResumen] = useState({});
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);
    const [pct, setPct] = useState(0);
    const [guardandoPct, setGuardandoPct] = useState(false);

    const cargar = useCallback(async () => {
        setCargando(true);
        setError(null);
        try {
            const [lista, res, anticipo] = await Promise.all([
                adminOrders(pass), adminOrdersResumen(pass), fetchAnticipo(),
            ]);
            setPedidos(lista);
            setResumen(res);
            setPct(anticipo);
        } catch (err) {
            setError(err.message);
        } finally {
            setCargando(false);
        }
    }, [pass]);

    useEffect(() => { cargar(); }, [cargar]);

    const guardarPct = async (valor) => {
        setGuardandoPct(true);
        try {
            await adminSetAnticipo(pass, valor);
            setPct(valor);
        } catch (err) {
            setError(err.message);
        } finally {
            setGuardandoPct(false);
        }
    };

    return (
        <div className="pedidos">
            <div className="pedidos-cifras">
                <div className="cifra">
                    <span>Cobrado este mes</span>
                    <strong>{pesos(resumen.cobrado_mes)}</strong>
                </div>
                <div className="cifra">
                    <span>Cobrado en total</span>
                    <strong>{pesos(resumen.cobrado_total)}</strong>
                </div>
                <div className="cifra">
                    <span>Pedidos pagados</span>
                    <strong>{resumen.pagados ?? 0}</strong>
                </div>
                <div className="cifra">
                    <span>Sin confirmar</span>
                    <strong>{resumen.pendientes ?? 0}</strong>
                </div>
            </div>

            <div className="pedidos-barra">
                <label className="anticipo-ajuste">
                    Apartado con anticipo
                    <select value={pct} onChange={(e) => guardarPct(Number(e.target.value))} disabled={guardandoPct}>
                        <option value={0}>Apagado (pago completo)</option>
                        <option value={30}>30% para apartar</option>
                        <option value={50}>50% para apartar</option>
                        <option value={70}>70% para apartar</option>
                    </select>
                </label>
                <button className="btn-ghost" onClick={cargar} disabled={cargando}>
                    <RefreshCw size={14} style={{ verticalAlign: '-2px' }} /> Actualizar
                </button>
            </div>

            {error && <div className="admin-status error">{error}</div>}

            {cargando && pedidos.length === 0 && <p className="hint">Cargando pedidos…</p>}

            {!cargando && pedidos.length === 0 && !error && (
                <div className="pedidos-vacio">
                    Todavía no hay pedidos pagados por la web.
                    <span>Los que te llegan por WhatsApp no aparecen aquí.</span>
                </div>
            )}

            <div className="pedidos-lista">
                {pedidos.map(p => {
                    const et = ETIQUETA[p.estado] || ETIQUETA.pendiente;
                    return (
                        <div className={`pedido ${et.clase}`} key={p.id}>
                            <div className="pedido-arriba">
                                <div>
                                    <span className="pedido-num">#{p.numero}</span>
                                    <span className={`pedido-estado ${et.clase}`}>{et.texto}</span>
                                    {p.es_anticipo && <span className="pedido-estado espera">Anticipo</span>}
                                </div>
                                <strong>{pesos(p.monto_cobrado)}</strong>
                            </div>

                            <div className="pedido-cliente">
                                {p.nombre || 'Sin nombre'}
                                {p.telefono && <> · <a href={`https://wa.me/${p.telefono.replace(/\D/g, '')}`} target="_blank" rel="noreferrer">{p.telefono}</a></>}
                            </div>

                            <ul className="pedido-items">
                                {(p.items || []).map((it, i) => (
                                    <li key={i}>
                                        {it.qty}× {it.brand} {it.name}
                                        {it.size ? ` · Talla ${it.size}` : ''}
                                        <span>{pesos(it.unit_price * it.qty)}</span>
                                    </li>
                                ))}
                            </ul>

                            <div className="pedido-abajo">
                                {new Date(p.created_at).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })}
                                {p.es_anticipo && p.estado === 'pagado' && (
                                    <span className="pedido-resta">Falta cobrar {pesos(p.total - p.monto_cobrado)}</span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Pedidos;
