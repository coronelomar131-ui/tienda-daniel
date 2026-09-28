import { useEffect } from 'react';

// Corre una carga al montar (y cada vez que cambia la función que se le pasa)
// como tarea aparte, no dentro del efecto: así el efecto no cambia estado de
// forma síncrona —React lo desaconseja porque provoca un redibujo en
// cascada— y, si el componente se desmonta antes de que arranque, ya no corre.
export function useCargar(cargar) {
    useEffect(() => {
        let vivo = true;
        Promise.resolve().then(() => { if (vivo) cargar(); });
        return () => { vivo = false; };
    }, [cargar]);
}
