import React, { useContext, useEffect, useState } from 'react';
import { ShopContext } from '../context/shop-context';
import { waLink } from '../lib/whatsapp';
import { fetchAnticipo, crearPedido, datosPago, crearPago, pagosTarjetaListos } from '../lib/pagos';
import { useBloquearScroll } from '../lib/bloquearScroll';
import { useDeslizarParaCerrar } from '../lib/deslizarParaCerrar';
import WhatsAppIcon from './WhatsAppIcon';
import Ticket from './Ticket';

// Bote: con cantidad 1, el "−" quita el par del carrito; que se vea antes de tocarlo.
const BoteIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 002 2h6a2 2 0 002-2l1-12M9 7V4h6v3" />
    </svg>
);
const VolverIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M15 5l-7 7 7 7" />
    </svg>
);

// El "−" / "+" de un renglón. El número lleva key para que su brinquito se
// repita cada vez que cambia: así se nota qué sí cambió.
const Cantidad = ({ qty, onMenos, onMas }) => (
    <div className="qty-controls">
        <button onClick={onMenos} className={qty === 1 ? 'qty-quitar' : undefined}
                aria-label={qty === 1 ? 'Quitar del carrito' : 'Quitar uno'}>
            {qty === 1 ? <BoteIcon /> : '−'}
        </button>
        <span className="qty" key={qty}>{qty}</span>
        <button onClick={onMas} aria-label="Agregar uno">+</button>
    </div>
);

const CartDrawer = ({ open, onClose }) => {
    const {
        cart, updateQty, clearCart, cartTotal, products,
        removeLine, changeSize,
        guardados, guardarParaDespues, regresarAlCarrito, borrarGuardado,
    } = useContext(ShopContext);

    // key del renglon cuyo menu esta abierto, y en que vista va ese menu
    const [menu, setMenu] = useState(null);
    const [vistaMenu, setVistaMenu] = useState('opciones');

    const [pagando, setPagando] = useState(false);   // mostrando el formulario
    const [enviando, setEnviando] = useState(false);
    const [error, setError] = useState(null);
    const [datos, setDatos] = useState({ nombre: '', telefono: '', direccion: '', email: '', nota: '' });
    // Cuando el pedido ya quedo guardado: folio, total y a donde depositar
    const [hecho, setHecho] = useState(null);
    const [cuenta, setCuenta] = useState(null);
    const [anticipo, setAnticipo] = useState(false);
    const [pct, setPct] = useState(0);
    // El cobro con tarjeta solo se ofrece si el servidor ya trae el token de
    // Mercado Pago cargado. Ver pagosTarjetaListos en lib/pagos.js.
    const [tarjetaLista, setTarjetaLista] = useState(false);
    const [yendoATarjeta, setYendoATarjeta] = useState(false);

    useBloquearScroll(open);
    const { hoja, velo, agarradera, cerrar } = useDeslizarParaCerrar(onClose);

    useEffect(() => {
        if (!open) return;
        fetchAnticipo().then(setPct).catch(() => setPct(0));
        datosPago().then(setCuenta).catch(() => setCuenta(null));
        pagosTarjetaListos().then(setTarjetaLista).catch(() => setTarjetaLista(false));
    }, [open]);

    if (!open) return null;

    const linea = menu ? cart.find(item => item.key === menu) : null;
    const cerrarMenu = () => { setMenu(null); setVistaMenu('opciones'); };
    // Las tallas salen del catalogo, no del renglon: el carrito solo guarda
    // la talla elegida, no todas las que maneja el par.
    const tallasDelPar = linea
        ? (products.find(p => String(p.id) === String(linea.id))?.sizes || [])
        : [];

    const orderLines = cart.map(item =>
        `• ${item.qty}x ${item.brand} ${item.name}${item.size ? ` — Talla ${item.size}` : ''} — $${(item.price * item.qty).toLocaleString('es-MX')} MXN`
    );
    const message = `Hola, quiero apartar estos pares:\n\n${orderLines.join('\n')}\n\nTotal: $${cartTotal.toLocaleString('es-MX')} MXN`;
    const link = waLink(message);

    // "Preguntar" no es "pedir": el carrito se queda como está. Antes se
    // vaciaba y el cliente regresaba de WhatsApp sin sus pares.
    const alPreguntar = () => { setTimeout(onClose, 400); };

    // Guardar el pedido con folio. Antes el pedido solo existia en el chat de
    // WhatsApp: si el mensaje se perdia entre otras conversaciones, se perdia
    // la venta y no quedaba de que agarrarse.
    // El aviso rojo se quitaba hasta que volvias a darle al boton, asi que se
    // quedaba ahi diciendo "falta tu telefono" cuando ya lo habias escrito.
    const cambiar = (campo) => (e) => {
        const valor = e.target.value;
        setDatos(d => ({ ...d, [campo]: valor }));
        if (error) setError(null);
    };

    const conAnticipo = pct > 0 && pct < 100;

    // Los dos caminos de pago piden lo mismo, asi que la revision es una sola.
    const faltanDatos = () => {
        if (!datos.nombre.trim() || !datos.telefono.trim()) {
            setError('Necesitamos tu nombre y teléfono');
            return true;
        }
        return false;
    };

    const hacerPedido = async (e) => {
        e.preventDefault();
        if (faltanDatos()) return;
        setEnviando(true);
        setError(null);
        try {
            const r = await crearPedido({ cart, ...datos, anticipo: anticipo && conAnticipo });
            setHecho({ ...r, lineas: [...cart] });
            clearCart();
        } catch (err) {
            setError(err.message);
        } finally {
            setEnviando(false);
        }
    };

    // El mensaje que se manda ya lleva el folio, para que ambos hablen del
    // mismo pedido en vez de describirlo otra vez.
    const avisoWhats = hecho && waLink(
        `Hola, acabo de hacer el pedido #${hecho.folio} por $${hecho.aPagar.toLocaleString('es-MX')} MXN` +
        (hecho.esAnticipo ? ' (anticipo).' : '.') +
        (cuenta?.clabe ? '\n\nYa hice la transferencia, aquí va mi comprobante:' : '\n\n¿Cómo le hago para pagar?')
    );

    // Cobro con tarjeta. El carrito NO se vacia aqui: si el cliente se arrepiente
    // en la pantalla de Mercado Pago y le da para atras, tiene que encontrar sus
    // pares donde los dejo. Quien lo vacia es /pago/:id cuando el pago ya quedo.
    const pagarConTarjeta = async () => {
        if (faltanDatos()) return;
        setYendoATarjeta(true);
        setError(null);
        try {
            const r = await crearPago({ cart, ...datos, anticipo: anticipo && conAnticipo });
            window.location.assign(r.pagar_en);
        } catch (err) {
            setError(err.message);
            setYendoATarjeta(false);
        }
    };

    return (
        <>
            <div className="cart-overlay" ref={velo} onClick={cerrar} />
            <aside className="cart-drawer" ref={hoja}>
                <div className="cart-head" {...agarradera}>
                    <h3>{hecho ? `Pedido #${hecho.folio}` : pagando ? 'Tus datos' : 'Tu pedido'}</h3>
                    <button className="cart-close" onClick={cerrar} aria-label="Cerrar">×</button>
                </div>

                <div className="cart-items">
                    {hecho ? (
                        <div className="listo">
                            <Ticket
                                folio={hecho.folio}
                                lineas={hecho.lineas}
                                total={hecho.total}
                                aPagar={hecho.aPagar}
                                esAnticipo={hecho.esAnticipo}
                                pct={pct}
                                cuenta={cuenta}
                                onCopiarClabe={() => navigator.clipboard?.writeText(cuenta.clabe)}
                            />
                        </div>
                    ) : cart.length === 0 ? (
                        <div className="cart-empty">Tu carrito está vacío</div>
                    ) : pagando ? (
                        <form id="form-pago" className="pago-form" onSubmit={hacerPedido}>
                            <p className="pago-intro">
                                Para mandarte tu pedido necesitamos saber a quién y a dónde.
                            </p>
                            <input type="text" placeholder="Tu nombre" value={datos.nombre}
                                onChange={cambiar('nombre')}
                                autoComplete="name" />
                            <input type="tel" placeholder="Tu WhatsApp" value={datos.telefono}
                                onChange={cambiar('telefono')}
                                autoComplete="tel" />
                            <input type="text" placeholder="Dirección de entrega" value={datos.direccion}
                                onChange={cambiar('direccion')}
                                autoComplete="street-address" />
                            <input type="email" placeholder="Tu correo (opcional)" value={datos.email}
                                onChange={cambiar('email')}
                                autoComplete="email" />
                            <textarea placeholder="¿Algo que debamos saber? (opcional)" rows="2"
                                value={datos.nota}
                                onChange={cambiar('nota')} />

                            {conAnticipo && (
                                <label className="pago-anticipo">
                                    <input type="checkbox" checked={anticipo}
                                        onChange={(e) => setAnticipo(e.target.checked)} />
                                    <span>
                                        Apartar con {pct}% ahora
                                        <small>Pagas ${Math.round(cartTotal * pct / 100).toLocaleString('es-MX')} y el resto al recibir</small>
                                    </span>
                                </label>
                            )}

                            {error && <div className="login-error">{error}</div>}
                            {/* En pestaña aparte: si se fueran en esta, se perdería lo que
                                lleva escrito en el formulario. */}
                            <p className="pago-legal">
                                Al apartar aceptas los <a href="/terminos" target="_blank" rel="noreferrer">términos</a> y
                                el <a href="/aviso-de-privacidad" target="_blank" rel="noreferrer">aviso de privacidad</a>.
                            </p>
                        </form>
                    ) : (
                        cart.map(item => (
                            <div className="cart-item" key={item.key}>
                                <div className="cart-item-info">
                                    <div className="meta">
                                        {item.brand}{item.size ? ` · Talla ${item.size}` : ''}
                                    </div>
                                    <h4>{item.name}</h4>
                                    <span className="p">${item.price.toLocaleString('es-MX')} MXN c/u</span>
                                </div>
                                <Cantidad qty={item.qty}
                                    onMenos={() => updateQty(item.key, -1)}
                                    onMas={() => updateQty(item.key, 1)} />
                                <button
                                    className="item-menu"
                                    onClick={() => { setMenu(item.key); setVistaMenu('opciones'); }}
                                    aria-label={`Opciones de ${item.name}`}
                                >⋮</button>
                            </div>
                        ))
                    )}

                    {!pagando && guardados.length > 0 && (
                        <div className="guardados">
                            <h4 className="guardados-titulo">Guardados para después</h4>
                            <p className="guardados-nota">
                                Se quedan en este celular. No apartan el par.
                            </p>
                            {guardados.map(item => (
                                <div className="cart-item guardado" key={item.key}>
                                    <div className="cart-item-info">
                                        <div className="meta">
                                            {item.brand}{item.size ? ` · Talla ${item.size}` : ''}
                                        </div>
                                        <h4>{item.name}</h4>
                                        <span className="p">${item.price.toLocaleString('es-MX')} MXN c/u</span>
                                    </div>
                                    <div className="guardado-acciones">
                                        <button className="link-btn" onClick={() => regresarAlCarrito(item.key)}>
                                            Regresar al carrito
                                        </button>
                                        <button className="link-btn link-mal" onClick={() => borrarGuardado(item.key)}>
                                            Quitar
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {hecho ? (
                    <div className="cart-foot">
                        <a href={avisoWhats} target="_blank" rel="noreferrer" className="cart-wa"
                           onClick={() => setTimeout(onClose, 400)}>
                            {cuenta?.clabe ? 'Mandar comprobante' : 'Escribirnos'} <WhatsAppIcon />
                        </a>
                        <button className="cart-volver" onClick={() => { setHecho(null); setPagando(false); onClose(); }}>
                            Seguir viendo
                        </button>
                    </div>
                ) : cart.length > 0 && (
                    <div className="cart-foot">
                        <div className="cart-total">
                            <span>Total</span>
                            <strong>${cartTotal.toLocaleString('es-MX')} MXN</strong>
                        </div>

                        {pagando ? (
                            <>
                                {tarjetaLista && (
                                    <button type="button" className="cart-wa cart-tarjeta"
                                        onClick={pagarConTarjeta}
                                        disabled={enviando || yendoATarjeta}>
                                        {yendoATarjeta ? 'Abriendo el pago…' : 'Pagar con tarjeta'}
                                    </button>
                                )}
                                <button type="submit" form="form-pago"
                                    className={tarjetaLista ? 'cart-volver cart-transfer' : 'cart-wa'}
                                    disabled={enviando || yendoATarjeta}>
                                    {enviando
                                        ? 'Guardando…'
                                        : tarjetaLista ? 'O pagar por transferencia' : 'Hacer mi pedido'}
                                </button>
                                <button className="cart-volver" type="button"
                                    onClick={() => { setPagando(false); setError(null); }}
                                    disabled={yendoATarjeta}>
                                    <VolverIcon /> Volver al carrito
                                </button>
                            </>
                        ) : (
                            <>
                                <button className="cart-wa" onClick={() => setPagando(true)}>
                                    Hacer mi pedido
                                </button>
                                <a href={link} target="_blank" rel="noreferrer" className="cart-whats" onClick={alPreguntar}>
                                    O preguntar por WhatsApp <WhatsAppIcon />
                                </a>
                            </>
                        )}
                    </div>
                )}
            </aside>

            {/* Hoja de opciones del renglon, como en las apps de las marcas */}
            {linea && (
                <>
                    <div className="menu-velo" onClick={cerrarMenu} />
                    <div className="menu-hoja" role="dialog" aria-label="Opciones del par">
                        <div className="menu-cabeza">
                            <h4>{vistaMenu === 'talla' ? 'Cambiar talla' : 'Opciones'}</h4>
                            <button className="cart-close" onClick={cerrarMenu} aria-label="Cerrar">×</button>
                        </div>

                        {vistaMenu === 'opciones' ? (
                            <div className="menu-lista">
                                <div className="menu-fila menu-cantidad">
                                    <span>Cantidad</span>
                                    <Cantidad qty={linea.qty}
                                        onMenos={() => updateQty(linea.key, -1)}
                                        onMas={() => updateQty(linea.key, 1)} />
                                </div>

                                <button
                                    className="menu-fila"
                                    onClick={() => setVistaMenu('talla')}
                                    disabled={tallasDelPar.length === 0}
                                >
                                    <span>Cambiar talla</span>
                                    <small>{tallasDelPar.length ? (linea.size ?? '—') : 'Este par no maneja tallas'}</small>
                                </button>

                                <button className="menu-fila" onClick={() => { guardarParaDespues(linea.key); cerrarMenu(); }}>
                                    <span>Guardar para después</span>
                                </button>

                                <button className="menu-fila menu-borrar" onClick={() => { removeLine(linea.key); cerrarMenu(); }}>
                                    <span>Eliminar del carrito</span>
                                </button>
                            </div>
                        ) : (
                            <div className="menu-lista">
                                <div className="size-row menu-tallas">
                                    {tallasDelPar.map(t => (
                                        <button
                                            key={t}
                                            className={`size-chip${linea.size === t ? ' selected' : ''}`}
                                            onClick={() => { changeSize(linea.key, t); cerrarMenu(); }}
                                        >{t}</button>
                                    ))}
                                </div>
                                <button className="menu-fila" onClick={() => setVistaMenu('opciones')}>
                                    <span>← Regresar</span>
                                </button>
                            </div>
                        )}
                    </div>
                </>
            )}
        </>
    );
};

export default CartDrawer;
