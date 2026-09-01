import React, { useContext, useEffect, useState } from 'react';
import { ShopContext } from '../context/shop-context';
import { waLink } from '../lib/whatsapp';
import { crearPago, fetchAnticipo } from '../lib/pagos';
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
    const [datos, setDatos] = useState({ nombre: '', telefono: '', email: '' });
    const [anticipo, setAnticipo] = useState(false);
    const [pct, setPct] = useState(0);

    useBloquearScroll(open);

    useEffect(() => {
        if (!open) return;
        fetchAnticipo().then(setPct).catch(() => setPct(0));
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

    const conAnticipo = pct > 0 && pct < 100;
    const aCobrar = anticipo && conAnticipo ? Math.round(cartTotal * pct / 100) : cartTotal;

    const pagar = async (e) => {
        e.preventDefault();
        if (!datos.nombre.trim() || !datos.telefono.trim()) {
            setError('Necesitamos tu nombre y teléfono para el envío');
            return;
        }
        setEnviando(true);
        setError(null);
        try {
            const r = await crearPago({ cart, ...datos, anticipo: anticipo && conAnticipo });
            window.location.href = r.pagar_en;
        } catch (err) {
            setError(err.message);
            setEnviando(false);
        }
    };

    return (
        <>
            <div className="cart-overlay" onClick={onClose} />
            <aside className="cart-drawer">
                <div className="cart-head">
                    <h3>{pagando ? 'Tus datos' : 'Tu pedido'}</h3>
                    <button className="cart-close" onClick={onClose} aria-label="Cerrar">×</button>
                </div>

                <div className="cart-items">
                    {cart.length === 0 ? (
                        <div className="cart-empty">Tu carrito está vacío</div>
                    ) : pagando ? (
                        <form id="form-pago" className="pago-form" onSubmit={pagar}>
                            <p className="pago-intro">
                                Para mandarte tu pedido necesitamos saber a quién y a dónde.
                            </p>
                            <input type="text" placeholder="Tu nombre" value={datos.nombre}
                                onChange={(e) => setDatos(d => ({ ...d, nombre: e.target.value }))}
                                autoComplete="name" />
                            <input type="tel" placeholder="Tu WhatsApp" value={datos.telefono}
                                onChange={(e) => setDatos(d => ({ ...d, telefono: e.target.value }))}
                                autoComplete="tel" />
                            <input type="email" placeholder="Tu correo (opcional)" value={datos.email}
                                onChange={(e) => setDatos(d => ({ ...d, email: e.target.value }))}
                                autoComplete="email" />

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

                {cart.length > 0 && (
                    <div className="cart-foot">
                        <div className="cart-total">
                            <span>{anticipo && conAnticipo ? `Anticipo ${pct}%` : 'Total'}</span>
                            <strong>${aCobrar.toLocaleString('es-MX')} MXN</strong>
                        </div>

                        {pagando ? (
                            <>
                                <button type="submit" form="form-pago" className="cart-wa" disabled={enviando}>
                                    {enviando ? 'Abriendo Mercado Pago…' : 'Ir a pagar'}
                                </button>
                                <button className="cart-volver" onClick={() => { setPagando(false); setError(null); }}>
                                    Volver al carrito
                                </button>
                            </>
                        ) : (
                            <>
                                <button className="cart-wa" onClick={() => setPagando(true)}>
                                    Pagar ahora
                                </button>
                                <a href={link} target="_blank" rel="noreferrer" className="cart-whats" onClick={handleOrder}>
                                    O apartar por WhatsApp <WhatsAppIcon />
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
