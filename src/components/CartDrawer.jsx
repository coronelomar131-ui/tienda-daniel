import React, { useContext } from 'react';
import { ShopContext } from '../context/shop-context';
import { config } from '../config';

const CartDrawer = ({ open, onClose }) => {
    const { cart, updateQty, clearCart, cartTotal } = useContext(ShopContext);

    if (!open) return null;

    const orderLines = cart.map(item =>
        `• ${item.qty}x ${item.brand} ${item.name}${item.size ? ` — Talla ${item.size}` : ''} — $${(item.price * item.qty).toLocaleString('es-MX')} MXN`
    );
    const message = `Hola, quiero apartar estos pares:\n\n${orderLines.join('\n')}\n\nTotal: $${cartTotal.toLocaleString('es-MX')} MXN`;
    const waLink = `https://wa.me/${config.whatsappNumber}?text=${encodeURIComponent(message)}`;

    return (
        <>
            <div className="cart-overlay" onClick={onClose} />
            <aside className="cart-drawer">
                <div className="cart-head">
                    <h3>Tu pedido</h3>
                    <button className="cart-close" onClick={onClose} aria-label="Cerrar">×</button>
                </div>

                <div className="cart-items">
                    {cart.length === 0 ? (
                        <div className="cart-empty">Tu carrito está vacío</div>
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
                            </div>
                        ))
                    )}
                </div>

                {cart.length > 0 && (
                    <div className="cart-foot">
                        <div className="cart-total">
                            <span>Total</span>
                            <strong>${cartTotal.toLocaleString('es-MX')} MXN</strong>
                        </div>
                        <a
                            href={waLink}
                            target="_blank"
                            rel="noreferrer"
                            className="cart-wa"
                            onClick={() => { clearCart(); onClose(); }}
                        >
                            Apartar por WhatsApp
                            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                <path d="M12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.38 5.07L2 22l5.07-1.33A9.94 9.94 0 0012 22c5.52 0 10-4.48 10-10S17.52 2 12 2z" />
                            </svg>
                        </a>
                    </div>
                )}
            </aside>
        </>
    );
};

export default CartDrawer;
