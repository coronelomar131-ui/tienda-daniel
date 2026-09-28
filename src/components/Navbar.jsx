import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShopContext } from '../context/shop-context';
import { config } from '../config';
import { waPlain } from '../lib/whatsapp';
import InstagramIcon from './InstagramIcon';

// Las anclas (#coleccion, #comoapartar) solo existen en la portada. Desde la
// ficha o la pantalla de pago hay que ir primero a la portada: si no, el logo
// y el menú no hacían nada ahí.
const Ancla = ({ id, className, children }) => {
    const enPortada = useLocation().pathname === '/';
    return enPortada
        ? <a href={`#${id}`} className={className}>{children}</a>
        : <Link to={`/#${id}`} className={className}>{children}</Link>;
};

const Navbar = ({ onOpenCart }) => {
    const { cartCount } = useContext(ShopContext);

    return (
        <header className="site-header">
            <nav className="nav wrap">
                <Ancla id="top" className="logo">Prothe <em>Shop</em></Ancla>
                <div className="navlinks">
                    <Ancla id="coleccion">Catálogo</Ancla>
                    <Ancla id="comoapartar">Cómo apartar</Ancla>
                    <a href={config.instagramLink} target="_blank" rel="noreferrer">Instagram</a>
                    <a href={waPlain()} target="_blank" rel="noreferrer">Contacto</a>
                </div>
                <div className="nav-acciones">
                    {/* En celular el menú de texto se esconde; este botón deja
                        Instagram a la vista junto al carrito. */}
                    <a href={config.instagramLink} target="_blank" rel="noreferrer"
                       className="ig-nav" aria-label="Instagram de Prothe Shop">
                        <InstagramIcon size={20} />
                    </a>
                    <button
                        className={`cart-toggle${cartCount > 0 ? ' has-items' : ''}`}
                        onClick={onOpenCart}
                    >
                        Carrito ({cartCount})
                    </button>
                </div>
            </nav>
        </header>
    );
};

export default Navbar;
