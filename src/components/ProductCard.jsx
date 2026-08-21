import React, { useContext, useState } from 'react';
import { ShopContext } from '../context/shop-context';
import { config } from '../config';
import SneakerArt from './SneakerArt';

const WhatsAppIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.38 5.07L2 22l5.07-1.33A9.94 9.94 0 0012 22c5.52 0 10-4.48 10-10S17.52 2 12 2z" />
    </svg>
);

const ProductCard = ({ product }) => {
    const { addToCart } = useContext(ShopContext);
    const [size, setSize] = useState(null);

    const soldOut = product.status === 'agotado';
    const sizes = product.sizes || [];
    const needsSize = sizes.length > 0;
    const canAdd = !soldOut && (!needsSize || size !== null);

    const waText = soldOut
        ? `Hola, ¿tendrán restock de los ${product.brand} ${product.name}?`
        : `Hola, me interesan los ${product.brand} ${product.name}${size ? ` en talla ${size}` : ''} ($${product.price} MXN). ¿Siguen disponibles?`;
    const waLink = `https://wa.me/${config.whatsappNumber}?text=${encodeURIComponent(waText)}`;
    const mlLink = product.mlLink || config.mercadoLibreGeneralLink;

    const handleAdd = () => {
        if (!canAdd) return;
        addToCart(product, size);
        setSize(null);
    };

    return (
        <div className={`card reveal${soldOut ? ' sold-out' : ''}`}>
            <div className="card-photo">
                <div className="badges">
                    {product.status === 'nuevo' && <span className="badge badge-new">Nuevo</span>}
                    {soldOut && <span className="badge badge-out">Agotado</span>}
                </div>
                {product.image
                    ? <img src={product.image} alt={`${product.brand} ${product.name}`} loading="lazy" />
                    : <SneakerArt />}
            </div>

            <div className="card-body">
                <span className="tag">{product.brand}</span>
                <h3>{product.name}</h3>
                {product.desc && <p className="desc">{product.desc}</p>}

                {needsSize && (
                    <div className="sizes">
                        <span className="sizes-label">
                            Talla MX {size !== null && <>· <strong>{size}</strong></>}
                        </span>
                        <div className="size-row">
                            {sizes.map(s => (
                                <button
                                    key={s}
                                    className={`size-chip${size === s ? ' selected' : ''}`}
                                    onClick={() => setSize(size === s ? null : s)}
                                    disabled={soldOut}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="card-foot">
                    <span className="price">
                        ${product.price.toLocaleString('es-MX')}<small>MXN</small>
                    </span>
                    <div className="card-actions">
                        <button
                            className="add-btn"
                            onClick={handleAdd}
                            disabled={!canAdd}
                            title={needsSize && size === null && !soldOut ? 'Elige una talla primero' : undefined}
                        >
                            {soldOut ? 'Agotado' : (needsSize && size === null ? 'Elige talla' : '+ Carrito')}
                        </button>
                        <a href={waLink} target="_blank" rel="noreferrer" className="wa-btn">
                            {soldOut ? 'Restock' : 'Apartar'} <WhatsAppIcon />
                        </a>
                    </div>
                </div>

                {mlLink && (
                    <a href={mlLink} target="_blank" rel="noreferrer" className="ml-link">
                        Ver en Mercado Libre
                    </a>
                )}
            </div>
        </div>
    );
};

export default ProductCard;
