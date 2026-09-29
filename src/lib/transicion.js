// La foto del par que crece hasta ser su ficha (View Transitions).
//
// Al tocar un par, su foto no desaparece para que aparezca otra página: se
// agranda y se vuelve la foto grande de la ficha. Para que el navegador sepa
// que son la MISMA foto, las dos llevan el mismo nombre (foto-par), y un
// nombre sólo puede estar en un elemento a la vez. Por eso la ficha lo trae
// fijo en el CSS y la foto que se toca lo recibe justo antes de navegar.
//
// Si el navegador no sabe hacerlo, o el sistema pide menos animación, todo
// sigue como antes: la página cambia sin más.

const NOMBRE = 'foto-par';

export const hayTransicion = () =>
    typeof document !== 'undefined'
    && typeof document.startViewTransition === 'function'
    && !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// Le pone el nombre a la foto que se va a agrandar y se lo quita al rato,
// por si la navegación no se hizo (así no estorba a la siguiente).
export function marcarFoto(el) {
    if (!el || !hayTransicion()) return;
    el.style.viewTransitionName = NOMBRE;
    setTimeout(() => { el.style.viewTransitionName = ''; }, 1500);
}
