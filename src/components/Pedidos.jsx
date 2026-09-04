import React, { useCallback, useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { adminOrders, adminOrdersResumen, adminSetAnticipo, fetchAnticipo,
         datosPago, adminSetDatosPago, adminEstadoPedido } from '../lib/pagos';

const pesos = (n) => '$' + Number(n || 0).toLocaleString('es-MX');

const ETIQUETA = {
    pagado: { texto: 'Pagado', clase: 'ok' },
    // Faltaba 'enviado': como abajo hay un "|| ETIQUETA.pendiente" de respaldo,
    // un pedido ya mandado se enseñaba como "Pendiente".
    enviado: { texto: 'Enviado', clase: 'ok' },
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

    // Datos de tu cuenta, que es a donde le van a depositar
    const [cuenta, setCuenta] = useState({ clabe: '', banco: '', titular: '' });
    const [guardandoCuenta, setGuardandoCuenta] = useState(false);

    useEffect(() => {
        datosPago().then(d => d && setCuenta({
            clabe: d.clabe || '', banco: d.banco || '', titular: d.titular || '',
        })).catch(() => {});
    }, []);

    const guardarCuenta = async (e) => {
        e.preventDefault();
        setGuardandoCuenta(true);
        setError(null);
        try {
            await adminSetDatosPago(pass, cuenta.clabe, cuenta.banco, cuenta.titular);
        } catch (err) { setError(err.message); }
        finally { setGuardandoCuenta(false); }
    };

    const cambiarEstado = async (pedido, estado) => {
        try { await adminEstadoPedido(pass, pedido.id, estado); cargar(); }
        catch (err) { setError(err.message); }
    };

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

            {/* Sin esto la tienda no puede enseñarle al cliente a donde depositar,
                y el pedido se queda a medias. */}
            <details className="admin-card plegable cuenta-card" open={!cuenta.clabe}>
                <summary>Tu cuenta para transferencias {cuenta.clabe ? '✓' : '— falta'}</summary>
                <form className="admin-form" onSubmit={guardarCuenta}>
                    <p className="hint">
                        Esto es lo que ve el cliente cuando termina su pedido. Si lo dejas
                        vacío, solo le decimos que te escriba por WhatsApp.
                    </p>
                    <input type="text" placeholder="CLABE (18 dígitos)" value={cuenta.clabe}
                        onChange={(e) => setCuenta(c => ({ ...c, clabe: e.target.value }))}
                        inputMode="numeric" maxLength={18} />
                    <input type="text" placeholder="Banco (BBVA, Banorte…)" value={cuenta.banco}
                        onChange={(e) => setCuenta(c => ({ ...c, banco: e.target.value }))} />
                    <input type="text" placeholder="A nombre de" value={cuenta.titular}
                        onChange={(e) => setCuenta(c => ({ ...c, titular: e.target.value }))} />
                    <button type="submit" className="btn-ghost" disabled={guardandoCuenta}>
                        {guardandoCuenta ? 'Guardando…' : 'Guardar mi cuenta'}
                    </button>
                </form>
            </details>

            {error && <div className="admin-status error">{error}</div>}

            {cargando && pedidos.length === 0 && <p className="hint">Cargando pedidos…</p>}

            {!cargando && pedidos.length === 0 && !error && (
                <div className="pedidos-vacio">
                    Todavía no hay pedidos.
                    <span>Aquí van a caer los que hagan desde la tienda, con su folio.</span>
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
                            {p.direccion && <div className="pedido-envio">{p.direccion}</div>}
                            {p.nota && <div className="pedido-nota">“{p.nota}”</div>}

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

                            {/* Mover el pedido conforme avanza. Antes solo se podia mirar. */}
                            <div className="pedido-acciones">
                                {p.estado !== 'pagado' && (
                                    <button className="btn-ghost" onClick={() => cambiarEstado(p, 'pagado')}>
                                        Ya me pagó
                                    </button>
                                )}
                                {p.estado !== 'enviado' && (
                                    <button className="btn-ghost" onClick={() => cambiarEstado(p, 'enviado')}>
                                        Ya lo mandé
                                    </button>
                                )}
                                {p.estado !== 'cancelado' && (
                                    <button className="btn-ghost pedido-cancelar"
                                        onClick={() => window.confirm(`¿Cancelar el pedido #${p.numero}?`) && cambiarEstado(p, 'cancelado')}>
                                        Cancelar
                                    </button>
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
