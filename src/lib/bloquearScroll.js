import { useEffect } from 'react';

// Cuando se abre el carrito, la página de atrás no debe moverse.
// En iOS no basta con overflow:hidden — Safari lo ignora. Hay que fijar el
// body y acordarse de dónde iba el scroll para devolverlo al cerrar.
export function useBloquearScroll(activo) {
    useEffect(() => {
        if (!activo) return;

        const y = window.scrollY;
        const body = document.body;
        const anterior = {
            position: body.style.position,
            top: body.style.top,
            width: body.style.width,
            overflow: body.style.overflow,
        };

        body.style.position = 'fixed';
        body.style.top = `-${y}px`;
        body.style.width = '100%';
        body.style.overflow = 'hidden';

        return () => {
            body.style.position = anterior.position;
            body.style.top = anterior.top;
            body.style.width = anterior.width;
            body.style.overflow = anterior.overflow;
            window.scrollTo(0, y);
        };
    }, [activo]);
}
