import { useCallback, useRef } from 'react';

// En el celular el carrito es una hoja que sube desde abajo y lleva una
// agarradera arriba. La agarradera promete que se puede jalar hacia abajo para
// cerrar; esto hace que sí se pueda.
//
// Se agarra de la cabeza de la hoja (agarradera + título): ahí no hay nada que
// scrollear, así que el dedo no pelea con la lista. La hoja sigue al dedo, el
// fondo se aclara conforme baja y, al soltar, se cierra si bajó más de un
// cuarto o si se aventó rápido; si no, regresa a su lugar.
//
// En compu el carrito es un panel lateral: ahí no aplica y sólo se anima el
// cierre de lado.

const ES_HOJA = '(max-width: 900px)';
const SALIDA_MS = 260;

const sinMovimiento = () =>
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export function useDeslizarParaCerrar(onClose) {
    const hoja = useRef(null);
    const velo = useRef(null);
    const arrastre = useRef(null);
    const cerrando = useRef(false);

    const poner = (y, transicion) => {
        const h = hoja.current, v = velo.current;
        if (!h) return;
        h.style.transition = transicion || 'none';
        h.style.transform = y ? `translateY(${y}px)` : '';
        if (v) {
            v.style.transition = transicion ? 'opacity .26s ease' : 'none';
            v.style.opacity = y ? String(Math.max(0, 1 - y / h.offsetHeight)) : '';
        }
    };

    // Cierra deslizando la hoja fuera de la pantalla y después avisa.
    const cerrar = useCallback(() => {
        const h = hoja.current;
        if (!h || cerrando.current) return;
        cerrando.current = true;
        const esHoja = window.matchMedia(ES_HOJA).matches;
        const ms = sinMovimiento() ? 0 : SALIDA_MS;
        h.style.transition = `transform ${ms}ms cubic-bezier(.4, 0, 1, 1)`;
        h.style.transform = esHoja ? 'translateY(100%)' : 'translateX(100%)';
        if (velo.current) {
            velo.current.style.transition = `opacity ${ms}ms ease`;
            velo.current.style.opacity = '0';
        }
        setTimeout(() => { cerrando.current = false; onClose(); }, ms);
    }, [onClose]);

    const alBajar = (e) => {
        if (!window.matchMedia(ES_HOJA).matches) return;
        if (e.target.closest('button, a, input')) return;    // la X sigue siendo la X
        arrastre.current = { y0: e.clientY, t0: performance.now(), dy: 0 };
        e.currentTarget.setPointerCapture?.(e.pointerId);
    };

    const alMover = (e) => {
        const a = arrastre.current;
        if (!a) return;
        // Hacia arriba no se va (la hoja ya está completa): sólo un poco de
        // resistencia para que se sienta que ahí termina.
        const d = e.clientY - a.y0;
        a.dy = d > 0 ? d : d / 6;
        poner(a.dy);
    };

    const alSoltar = () => {
        const a = arrastre.current;
        arrastre.current = null;
        if (!a) return;
        const h = hoja.current;
        const velocidad = a.dy / Math.max(1, performance.now() - a.t0);   // px por ms
        if (h && (a.dy > h.offsetHeight * 0.25 || (a.dy > 40 && velocidad > 0.6))) {
            cerrar();
        } else {
            poner(0, 'transform .32s cubic-bezier(.22, 1.2, .36, 1)');
        }
    };

    const agarradera = {
        onPointerDown: alBajar,
        onPointerMove: alMover,
        onPointerUp: alSoltar,
        onPointerCancel: alSoltar,
    };

    return { hoja, velo, agarradera, cerrar };
}
