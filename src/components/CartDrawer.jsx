import React, { useContext, useEffect, useState } from 'react';
import { ShopContext } from '../context/shop-context';
import { waLink } from '../lib/whatsapp';
import { fetchAnticipo, crearPedido, datosPago } from '../lib/pagos';
import { useBloquearScroll } from '../lib/bloquearScroll';

const WhatsAppIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.38 5.07L2 22l5.07-1.33A9.94 9.94 0 0012 22c5.52 0 10-4.48 10-10S17.52 2 12 2z" />
    </svg>
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

    useBloquearScroll(open);

    useEffect(() => {
        if (!open) return;
        fetchAnticipo().then(setPct).catch(() => setPct(0));
        datosPago().then(setCuenta).catch(() => setCuenta(null));
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

    // Se vacía el carrito hasta después de que el navegador abrió WhatsApp.
    const handleOrder = () => {
        setTimeout(() => { clearCart(); onClose(); }, 400);
    };

    // Guardar el pedido con folio. Antes el pedido solo existia en el chat de
    // WhatsApp: si el mensaje se perdia entre otras conversaciones, se perdia
    // la venta y no quedaba de que agarrarse.
    const hacerPedido = async (e) => {
        e.preventDefault();
        if (!datos.nombre.trim() || !datos.telefono.trim()) {
            setError('Necesitamos tu nombre y teléfono');
            return;
        }
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

    // El cobro con tarjeta (crearPago, en lib/pagos.js) sigue armado pero no se
    // ofrece: no hay token de Mercado Pago cargado, asi que enseñar el boton
    // seria mandar al cliente a una pantalla que truena. Cuando se active, aqui
    // vuelve el boton.
    const conAnticipo = pct > 0 && pct < 100;

    return (
        <>
            <div className="cart-overlay" onClick={onClose} />
            <aside className="cart-drawer">
                <div className="cart-head">
                    <h3>{hecho ? `Pedido #${hecho.folio}` : pagando ? 'Tus datos' : 'Tu pedido'}</h3>
                    <button className="cart-close" onClick={onClose} aria-label="Cerrar">×</button>
                </div>

                <div className="cart-items">
                    {hecho ? (
                        <div className="listo">
                            <div className="listo-folio">
                                <span>Tu folio</span>
                                <strong>#{hecho.folio}</strong>
                            </div>
                            <p className="listo-texto">
                                Ya guardamos tu pedido. Apúntale el folio: con ese número
                                le damos seguimiento.
                            </p>

                            <div className="listo-total">
                                <span>{hecho.esAnticipo ? `Anticipo (${pct}%)` : 'A pagar'}</span>
                                <strong>${hecho.aPagar.toLocaleString('es-MX')} MXN</strong>
                            </div>
                            {hecho.esAnticipo && (
                                <p className="hint">
                                    Total del pedido ${hecho.total.toLocaleString('es-MX')} MXN.
                                    El resto lo pagas al recibir.
                                </p>
                            )}

                            {cuenta?.clabe ? (
                                <div className="listo-cuenta">
                                    <p className="listo-titulo">Transfiere a:</p>
                                    {cuenta.banco && <div><span>Banco</span><strong>{cuenta.banco}</strong></div>}
                                    {cuenta.titular && <div><span>A nombre de</span><strong>{cuenta.titular}</strong></div>}
                                    <div><span>CLABE</span><strong className="clabe">{cuenta.clabe}</strong></div>
                                    <button type="button" className="link-btn"
                                        onClick={() => navigator.clipboard?.writeText(cuenta.clabe)}>
                                        Copiar CLABE
                                    </button>
                                    <p className="hint">
                                        Pon <strong>#{hecho.folio}</strong> en el concepto y mándanos
                                        tu comprobante por WhatsApp.
                                    </p>
                                </div>
                            ) : (
                                <p className="listo-texto">
                                    Escríbenos por WhatsApp con tu folio y te decimos cómo pagar.
                                </p>
                            )}
                        </div>
                    ) : cart.length === 0 ? (
                        <div className="cart-empty">Tu carrito está vacío</div>
                    ) : pagando ? (
                        <form id="form-pago" className="pago-form" onSubmit={hacerPedido}>
                            <p className="pago-intro">
                                Para mandarte tu pedido necesitamos saber a quién y a dónde.
                            </p>
                            <input type="text" placeholder="Tu nombre" value={datos.nombre}
                                onChange={(e) => setDatos(d => ({ ...d, nombre: e.target.value }))}
                                autoComplete="name" />
                            <input type="tel" placeholder="Tu WhatsApp" value={datos.telefono}
                                onChange={(e) => setDatos(d => ({ ...d, telefono: e.target.value }))}
                                autoComplete="tel" />
                            <input type="text" placeholder="Dirección de entrega" value={datos.direccion}
                                onChange={(e) => setDatos(d => ({ ...d, direccion: e.target.value }))}
                                autoComplete="street-address" />
                            <input type="email" placeholder="Tu correo (opcional)" value={datos.email}
                                onChange={(e) => setDatos(d => ({ ...d, email: e.target.value }))}
                                autoComplete="email" />
                            <textarea placeholder="¿Algo que debamos saber? (opcional)" rows="2"
                                value={datos.nota}
                                onChange={(e) => setDatos(d => ({ ...d, nota: e.target.value }))} />

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
                                <div className="qty-controls">
                                    <button onClick={() => updateQty(item.key, -1)} aria-label="Quitar uno">−</button>
                                    <span className="qty">{item.qty}</span>
                                    <button onClick={() => updateQty(item.key, 1)} aria-label="Agregar uno">+</button>
                                </div>
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
                                <button type="submit" form="form-pago" className="cart-wa" disabled={enviando}>
                                    {enviando ? 'Guardando…' : 'Hacer mi pedido'}
                                </button>
                                <button className="cart-volver" onClick={() => { setPagando(false); setError(null); }}>
                                    Volver al carrito
                                </button>
                            </>
                        ) : (
                            <>
                                <button className="cart-wa" onClick={() => setPagando(true)}>
                                    Hacer mi pedido
                                </button>
                                <a href={link} target="_blank" rel="noreferrer" className="cart-whats" onClick={handleOrder}>
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
                                    <div className="qty-controls">
                                        <button onClick={() => updateQty(linea.key, -1)} aria-label="Quitar uno">−</button>
                                        <span className="qty">{linea.qty}</span>
                                        <button onClick={() => updateQty(linea.key, 1)} aria-label="Agregar uno">+</button>
                                    </div>
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
