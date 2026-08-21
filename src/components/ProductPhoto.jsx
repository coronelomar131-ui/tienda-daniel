import React, { useEffect, useRef, useState } from 'react';
import { fetchPhoto } from '../lib/shopApi';
import SneakerArt from './SneakerArt';

// La foto se pide apenas la tarjeta se asoma en pantalla. Así el catálogo
// abre rápido aunque tengas cien pares cargados.
const ProductPhoto = ({ product }) => {
    const [src, setSrc] = useState(null);
    const holder = useRef(null);

    useEffect(() => {
        if (!product.hasPhoto) return;
        const el = holder.current;
        if (!el) return;

        let cancelado = false;
        const io = new IntersectionObserver(async (entries) => {
            if (!entries[0].isIntersecting) return;
            io.disconnect();
            try {
                const data = await fetchPhoto(product.id);
                if (!cancelado) setSrc(data);
            } catch { /* si falla, se queda el dibujo */ }
        }, { rootMargin: '300px' });

        io.observe(el);
        return () => { cancelado = true; io.disconnect(); };
    }, [product.id, product.hasPhoto]);

    return (
        <span ref={holder} className="photo-holder">
            {src
                ? <img src={src} alt={`${product.brand} ${product.name}`} />
                : <SneakerArt />}
        </span>
    );
};

export default ProductPhoto;
