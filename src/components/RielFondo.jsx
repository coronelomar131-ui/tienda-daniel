import React from 'react';
import SneakerArt from './SneakerArt';
import { useFotos } from '../lib/useFotos';

// La cinta de fotos que corre por detras del vidrio. Es lo que le da color a
// las capsulas, por eso va bien difuminada: no se trata de reconocer las
// fotos, sino de que haya manchas de color pasando.
const RielFondo = ({ pares = [] }) => {
    const [fotos, caja] = useFotos(pares);

    // Se repiten hasta llenar el ancho: con uno o dos pares quedarian huecos.
    const cinta = [];
    if (fotos.length) {
        while (cinta.length < 12) cinta.push(...fotos);
    }

    return (
        <div ref={caja} className="riel-fotos" aria-hidden="true">
            <div className="riel-cinta">
                {cinta.length === 0
                    ? Array.from({ length: 8 }, (_, n) => (
                        <span className="riel-foto" key={n}><SneakerArt /></span>
                      ))
                    : cinta.slice(0, 12).map((src, n) => (
                        <span className="riel-foto" key={n}><img src={src} alt="" /></span>
                      ))}
            </div>
        </div>
    );
};

export default RielFondo;
