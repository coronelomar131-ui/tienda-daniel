import React, { useEffect, useRef, useState } from 'react';
import { fetchPhotos } from '../lib/shopApi';
import SneakerArt from './SneakerArt';

// Si la foto tarda más que esto, el cristal se quita igual y enseña el dibujo:
// una tarjeta cubierta para siempre parece tienda descompuesta.
const ESPERA_MAXIMA = 3500;

// La foto se pide apenas la tarjeta se asoma en pantalla, para que el catalogo
// abra rapido aunque haya cien pares. Si el par tiene varias, la segunda
// aparece al pasar el dedo o el cursor encima.
//
// conTapa: la foto arranca cubierta por un cristal esmerilado (el mismo
// vidrio de la barra de arriba) que se levanta y se aclara cuando la foto ya
// cargó. Así el cristal es el "cargando" y quitarlo es el "listo". Sólo en el
// catálogo: fuera de .card.reveal nadie le avisaría que ya entró en pantalla
// y se quedaría cubierta.
// completa: el tenis entero (contain) y lo que sobra lo llena la misma foto
// difuminada, sin cristal. Para la portada.
const ProductPhoto = ({ product, conTapa = false, completa = false }) => {
    const [fotos, setFotos] = useState([]);
    const [cargada, setCargada] = useState(false);
    const [rendida, setRendida] = useState(false);
    const holder = useRef(null);

    useEffect(() => {
        if (!product.photoCount) return;
        const el = holder.current;
        if (!el) return;

        let cancelado = false, espera;
        const io = new IntersectionObserver(async (entries) => {
            if (!entries[0].isIntersecting) return;
            io.disconnect();
            espera = setTimeout(() => { if (!cancelado) setRendida(true); }, ESPERA_MAXIMA);
            try {
                const data = await fetchPhotos(product.id);
                if (!cancelado) setFotos(data.slice(0, 2));
                if (!cancelado && !data.length) setRendida(true);
            } catch {
                if (!cancelado) setRendida(true);   // si falla, se queda el dibujo
            }
        }, { rootMargin: '300px' });

        io.observe(el);
        return () => { cancelado = true; io.disconnect(); clearTimeout(espera); };
    }, [product.id, product.photoCount]);

    const alt = `${product.brand} ${product.name}`;
    const lista = !product.photoCount || cargada || rendida;
    const clases = ['photo-holder'];
    if (fotos.length > 1) clases.push('con-vuelta');
    if (conTapa) clases.push('con-tapa');
    if (completa) clases.push('completa');
    if (conTapa && lista) clases.push('destapada');

    return (
        <span ref={holder} className={clases.join(' ')}>
            {fotos.length > 0 ? (
                <>
                    {(conTapa || completa) && <img className="foto-fondo" src={fotos[0].data} alt="" aria-hidden="true" />}
                    <img className="foto-1" src={fotos[0].data} alt={alt}
                         onLoad={() => setCargada(true)} onError={() => setRendida(true)} />
                    {fotos[1] && <img className="foto-2" src={fotos[1].data} alt="" aria-hidden="true" />}
                </>
            ) : <SneakerArt />}
            {conTapa && <span className="cristal" aria-hidden="true" />}
        </span>
    );
};

export default ProductPhoto;
