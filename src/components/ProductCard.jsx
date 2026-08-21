import React, { useContext } from 'react';
import { ShopContext } from '../context/shop-context';
import { config } from '../config';
import GarmentArt from './GarmentArt';

const WhatsAppIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.38 5.07L2 22l5.07-1.33A9.94 9.94 0 0012 22c5.52 0 10-4.48 10-10S17.52 2 12 2z" />
    </svg>
);

const ProductCard = ({ product, index }) => {
    const { addToCart } = useContext(ShopContext);

    const message = `Hola, me interesa el modelo ${product.name} ($${product.price} MXN). ¿Sigue disponible?`;
    const waLink = `https://wa.me/${config.whatsappNumber}?text=${encodeURIComponent(message)}`;
    const mlLink = product.mlLink || config.mercadoLibreGeneralLink;

    return (
        <div className="card reveal">
            <div className="card-photo">
                <span className="num">N°{String(index + 1).padStart(2, '0')}</span>
                {product.image
                    ? <img src={product.image} alt={product.name} loading="lazy" />
                    : <GarmentArt category={product.category} />}
            </div>
            <div className="card-body">
                <span className="tag">{product.tag || product.category}</span>
                <h3>{product.name}</h3>
                <p className="desc">{product.desc}</p>
                <div className="card-foot">
                    <span className="price">${product.price.toLocaleString('es-MX')} MXN</span>
                    <div className="card-actions">
                        <button className="add-btn" onClick={() => addToCart(product)}>+ Carrito</button>
                        <a href={waLink} target="_blank" rel="noreferrer" className="wa-btn">
                            Pedir <WhatsAppIcon />
                        </a>
                    </div>
                </div>
                {mlLink && <a href={mlLink} target="_blank" rel="noreferrer" className="ml-link">Ver en Mercado Libre</a>}
            </div>
        </div>
    );
};

export default ProductCard;
