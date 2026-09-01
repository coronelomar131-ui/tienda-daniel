import React, { useEffect, useState } from 'react';
import SneakerArt from './SneakerArt';
import { useFotos } from '../lib/useFotos';
import { useEnPantalla } from '../lib/useEnPantalla';

// La foto de la banda va cambiando entre los pares de esa categoria. Las
// fotos se bajan una sola vez y ya cargadas se turnan con un fundido; pedirlas
// en cada cambio parpadearia y seria una llamada a la base cada pocos
// segundos por cada banda.
const FotoRotativa = ({ pares = [], intervalo = 4200, desfase = 0 }) => {
    const [fotos, caja] = useFotos(pares);
    const [mirilla, visible] = useEnPantalla();
    // Se guarda cual sale ademas de cual entra: son las dos unicas que se
    // animan. Las demas esperan abajo sin transicion, para que no se vea
    // pasar media docena de fotos en el cambio.
    const [turno, setTurno] = useState({ actual: 0, previa: -1 });

    useEffect(() => {
        // Si la banda no se esta viendo, no tiene caso seguir cambiando fotos.
        if (fotos.length < 2 || !visible) return;
        const paso = () => setTurno(({ actual }) => ({
            actual: (actual + 1) % fotos.length,
            previa: actual,
        }));
        const arranque = setTimeout(paso, desfase);
        const reloj = setInterval(paso, intervalo);
        return () => { clearTimeout(arranque); clearInterval(reloj); };
    }, [fotos.length, intervalo, desfase, visible]);

    const clase = (n) => {
        if (n === turno.actual) return ' viendose';
        if (n === turno.previa) return ' saliendo';
        return '';                      // esperando abajo, quieta
    };

    return (
        <span ref={caja} className="rotativa">
            <span ref={mirilla} className="mirilla" aria-hidden="true" />
            {fotos.length === 0 ? <SneakerArt /> : fotos.map((src, n) => (
                <img key={n} src={src} alt="" aria-hidden="true"
                     className={`rotativa-foto${clase(n)}`} />
            ))}
        </span>
    );
};

export default FotoRotativa;
