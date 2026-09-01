import React, { useContext } from 'react';
import { ShopContext } from '../context/shop-context';
import { config } from '../config';
import { waPlain } from '../lib/whatsapp';

const Navbar = ({ onOpenCart }) => {
    const { cartCount } = useContext(ShopContext);

    return (
        <header className="site-header">
            <nav className="nav wrap">
                <a href="#top" className="logo">Prothe <em>Shop</em></a>
                <div className="navlinks">
                    <a href="#coleccion">Catálogo</a>
                    <a href="#comoapartar">Cómo apartar</a>
                    <a href={config.instagramLink} target="_blank" rel="noreferrer">Instagram</a>
                    <a href={waPlain()} target="_blank" rel="noreferrer">Contacto</a>
                </div>
                <button
                    className={`cart-toggle${cartCount > 0 ? ' has-items' : ''}`}
                    onClick={onOpenCart}
                >
                    Carrito ({cartCount})
                </button>
            </nav>
        </header>
    );
};

export default Navbar;
