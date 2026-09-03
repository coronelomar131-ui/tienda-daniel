import React from 'react';
import SneakerArt from './SneakerArt';
import { useFotos } from '../lib/useFotos';

// La miniatura del par en la lista del panel.
//
// Antes salia un icono generico de "imagen" aunque el par SI tuviera foto, asi
// que la lista era una fila de cuadritos iguales y no se distinguia un par de
// otro. Ahora se ve la foto de verdad.
//
// Usa la misma carga compartida que el resto: las fotos ya vienen pedidas en
// un solo viaje, no una por par.
const MiniFoto = ({ par }) => {
    const [fotos, caja] = useFotos([par], 1);

    return (
        <div ref={caja} className="thumb">
            {fotos[0]
                ? <img src={fotos[0]} alt="" loading="lazy" decoding="async" />
                : <SneakerArt />}
        </div>
    );
};

export default MiniFoto;
