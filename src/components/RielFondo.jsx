import React from 'react';
import SneakerArt from './SneakerArt';
import { useFotos } from '../lib/useFotos';
import { useEnPantalla } from '../lib/useEnPantalla';

// La cinta de fotos que corre por detras del vidrio. Es lo que le da color a
// las capsulas, por eso va bien difuminada: no se trata de reconocer las
// fotos, sino de que haya manchas de color pasando.
const RielFondo = ({ pares = [] }) => {
    // Solo 3: es fondo decorativo, no vale la pena bajar el catalogo entero
    // para que se vean manchas de color detras del vidrio.
    const [fotos, caja] = useFotos(pares, 3);
    const [mirilla, visible] = useEnPantalla();

    // Se repiten hasta llenar el ancho: con uno o dos pares quedarian huecos.
    const cinta = [];
    if (fotos.length) {
        while (cinta.length < 12) cinta.push(...fotos);
    }

    return (
        <div ref={caja} className="riel-fotos" aria-hidden="true">
            <div ref={mirilla} className={`riel-cinta${visible ? '' : ' quieta'}`}>
                {cinta.length === 0
                    ? Array.from({ length: 8 }, (_, n) => (
                        <span className="riel-foto" key={n}><SneakerArt /></span>
                      ))
                    : cinta.slice(0, 12).map((src, n) => (
                        <span className="riel-foto" key={n}><img src={src} alt="" loading="lazy" decoding="async" fetchPriority="low" /></span>
                      ))}
            </div>
        </div>
    );
};

export default RielFondo;
