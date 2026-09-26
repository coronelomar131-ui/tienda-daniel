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
    // Si le pasamos open={!cuenta.clabe} la ficha se CIERRA sola en cuanto
    // escribes el primer digito de la CLABE, en plena cara. La ficha se abre
    // sola solo la primera vez, cuando vemos que todavia no hay cuenta; de ahi
    // en adelante la abre y la cierra quien la usa.
    const [cuentaAbierta, setCuentaAbierta] = useState(false);

    useEffect(() => {
        datosPago().then(d => {
            if (!d) return;
            setCuenta({ clabe: d.clabe || '', banco: d.banco || '', titular: d.titular || '' });
            if (!d.clabe) setCuentaAbierta(true);
        }).catch(() => {});
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

    // Lo que falta por cobrar sale de los pedidos que ya estan en pantalla.
    const porCobrar = pedidos
        .filter(o => o.estado === 'pendiente')
        .reduce((suma, o) => suma + Number(o.monto_cobrado || o.total || 0), 0);
    const sinConfirmar = pedidos.filter(o => o.estado === 'pendiente').length;

    return (
        <div className="pedidos">
            {/* Aqui habia cuatro recuadros con cuatro numeros. Dos decian lo
                mismo ("cobrado este mes" y "cobrado en total" son iguales
                mientras solo lleves un mes) y los otros dos eran conteos que
                ya se ven contando los renglones de abajo. Cuatro recuadros
                para dos datos.

                Lo unico que te hace levantarte a hacer algo es cuanto te
                deben. Esa cifra manda; lo demas se lee como una frase. */}
            <div className="tablero">
                <p className="tablero-cifra">
                    <b>{pesos(porCobrar)}</b>
                    <span>{porCobrar > 0 ? 'te deben' : 'nadie te debe'}</span>
                </p>
                <p className="tablero-nota">
                    {sinConfirmar > 0
                        ? `${sinConfirmar} ${sinConfirmar === 1 ? 'pedido' : 'pedidos'} sin confirmar. `
                        : 'Todo confirmado. '}
                    Llevas {pesos(resumen.cobrado_mes)} cobrados este mes.
                </p>
            </div>

            <div className="pedidos-barra">
                <label className="anticipo-ajuste">
                    <span>Los clientes pueden apartar con</span>
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
            <details className="admin-card plegable cuenta-card" open={cuentaAbierta}
                     onToggle={(e) => setCuentaAbierta(e.currentTarget.open)}>
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
