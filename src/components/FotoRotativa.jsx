import React, { useEffect, useState } from 'react';
import SneakerArt from './SneakerArt';
import { useFotos } from '../lib/useFotos';

// La foto de la banda va cambiando entre los pares de esa categoria. Las
// fotos se bajan una sola vez y ya cargadas se turnan con un fundido; pedirlas
// en cada cambio parpadearia y seria una llamada a la base cada pocos
// segundos por cada banda.
const FotoRotativa = ({ pares = [], intervalo = 4200, desfase = 0 }) => {
    const [fotos, caja] = useFotos(pares);
    const [i, setI] = useState(0);

    useEffect(() => {
        if (fotos.length < 2) return;
        // El desfase evita que todas las bandas cambien al mismo tiempo, que
        // se ve como parpadeo de la pantalla entera.
        const arranque = setTimeout(() => setI(n => (n + 1) % fotos.length), desfase);
        const reloj = setInterval(() => setI(n => (n + 1) % fotos.length), intervalo);
        return () => { clearTimeout(arranque); clearInterval(reloj); };
    }, [fotos.length, intervalo, desfase]);

    return (
        <span ref={caja} className="rotativa">
            {fotos.length === 0 ? <SneakerArt /> : fotos.map((src, n) => (
                <img key={n} src={src} alt="" aria-hidden="true"
                     className={`rotativa-foto${n === i ? ' viendose' : ''}`} />
            ))}
        </span>
    );
};

export default FotoRotativa;
