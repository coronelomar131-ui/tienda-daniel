import React, { useContext } from 'react';
import { ShopContext } from '../context/shop-context';
import { config } from '../config';

const Navbar = ({ onOpenCart }) => {
    const { cartCount } = useContext(ShopContext);

    return (
        <header className="site-header">
            <nav className="nav wrap">
                <a href="#top" className="logo">PROTHE SHOPS</a>
                <div className="navlinks">
                    <a href="#coleccion">Colección</a>
                    <a href="#categorias">Categorías</a>
                    <a href={config.instagramLink} target="_blank" rel="noreferrer">Instagram</a>
                    <a href={`https://wa.me/${config.whatsappNumber}`} target="_blank" rel="noreferrer">Contacto</a>
                </div>
                <button className="cart-toggle" onClick={onOpenCart}>
                    Carrito <span className="count">({cartCount})</span>
                </button>
            </nav>
        </header>
    );
};

export default Navbar;
