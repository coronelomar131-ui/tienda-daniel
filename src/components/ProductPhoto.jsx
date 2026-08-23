import React, { useEffect, useRef, useState } from 'react';
import { fetchPhotos } from '../lib/shopApi';
import SneakerArt from './SneakerArt';

// La foto se pide apenas la tarjeta se asoma en pantalla, para que el catalogo
// abra rapido aunque haya cien pares. Si el par tiene varias, la segunda
// aparece al pasar el dedo o el cursor encima.
const ProductPhoto = ({ product }) => {
    const [fotos, setFotos] = useState([]);
    const holder = useRef(null);

    useEffect(() => {
        if (!product.photoCount) return;
        const el = holder.current;
        if (!el) return;

        let cancelado = false;
        const io = new IntersectionObserver(async (entries) => {
            if (!entries[0].isIntersecting) return;
            io.disconnect();
            try {
                const data = await fetchPhotos(product.id);
                if (!cancelado) setFotos(data.slice(0, 2));
            } catch { /* si falla, se queda el dibujo */ }
        }, { rootMargin: '300px' });

        io.observe(el);
        return () => { cancelado = true; io.disconnect(); };
    }, [product.id, product.photoCount]);

    const alt = `${product.brand} ${product.name}`;

    return (
        <span ref={holder} className={`photo-holder${fotos.length > 1 ? ' con-vuelta' : ''}`}>
            {fotos.length > 0 ? (
                <>
                    <img className="foto-1" src={fotos[0].data} alt={alt} />
                    {fotos[1] && <img className="foto-2" src={fotos[1].data} alt="" aria-hidden="true" />}
                </>
            ) : <SneakerArt />}
        </span>
    );
};

export default ProductPhoto;
