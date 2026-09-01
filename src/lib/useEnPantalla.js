import { useEffect, useRef, useState } from 'react';

// Dice si el elemento se esta viendo. Sirve para apagar lo que se mueve
// cuando ya no esta en pantalla: las animaciones y los relojes seguian
// corriendo aunque el visitante estuviera hasta abajo de la pagina, y eso se
// come bateria en el celular sin que nadie lo vea.
export function useEnPantalla() {
    const caja = useRef(null);
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const el = caja.current;
        if (!el || typeof IntersectionObserver === 'undefined') return;
        const io = new IntersectionObserver(
            ([e]) => setVisible(e.isIntersecting),
            { rootMargin: '120px' }
        );
        io.observe(el);
        return () => io.disconnect();
    }, []);

    return [caja, visible];
}
