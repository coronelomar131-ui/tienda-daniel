import { useEffect, useRef, useState } from 'react';
import { fetchPhotos } from '../lib/shopApi';

// Baja la primera foto de cada par, UNA sola vez, y cuando el elemento se
// asoma en pantalla.
//
// Antes cada tarjeta pedia por su cuenta: la cinta del fondo repite los mismos
// pares para llenar el ancho, asi que con 4 pares hacia 12 llamadas a la base
// por la misma foto.
// Se llama useFotos y no usarFotos porque React exige que los hooks
// empiecen con "use"; el linter no deja pasar otra cosa.
export function useFotos(pares, tope = 6) {
    const [fotos, setFotos] = useState([]);
    const caja = useRef(null);
    const ids = pares.map(p => p.id).join(',');

    useEffect(() => {
        const el = caja.current;
        if (!el || pares.length === 0) return;

        let cancelado = false;
        const io = new IntersectionObserver(async (entradas) => {
            if (!entradas[0].isIntersecting) return;
            io.disconnect();

            const unicos = [];
            const vistos = new Set();
            for (const p of pares) {
                if (vistos.has(p.id) || !p.photoCount) continue;
                vistos.add(p.id);
                unicos.push(p);
                if (unicos.length >= tope) break;
            }

            const bajadas = await Promise.all(unicos.map(async (p) => {
                try {
                    const f = await fetchPhotos(p.id);
                    return f[0]?.data || null;
                } catch { return null; }
            }));
            if (!cancelado) setFotos(bajadas.filter(Boolean));
        }, { rootMargin: '300px' });

        io.observe(el);
        return () => { cancelado = true; io.disconnect(); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ids, tope]);

    return [fotos, caja];
}
