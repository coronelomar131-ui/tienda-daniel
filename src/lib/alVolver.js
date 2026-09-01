import { useEffect } from 'react';

// Volver a pedir los datos cuando el visitante regresa a la pestaña.
//
// En iPhone, Safari guarda la pagina entera al salir (bfcache) y al volver la
// restaura tal cual: React no se vuelve a montar y nadie pide nada de nuevo.
// Para el dueño eso significa subir un par desde el panel, regresar a la
// tienda y verla igual que antes, creyendo que no se guardo.
export function useRefrescarAlVolver(recargar, msMinimos = 4000) {
    useEffect(() => {
        let ocultaDesde = null;

        const alCambiarVisibilidad = () => {
            if (document.visibilityState === 'hidden') {
                ocultaDesde = Date.now();
                return;
            }
            // Solo si estuvo fuera un rato: no recargamos por cada parpadeo.
            if (ocultaDesde && Date.now() - ocultaDesde > msMinimos) recargar();
            ocultaDesde = null;
        };

        // persisted = la pagina vino del bfcache, no se monto de cero.
        const alMostrar = (e) => { if (e.persisted) recargar(); };

        document.addEventListener('visibilitychange', alCambiarVisibilidad);
        window.addEventListener('pageshow', alMostrar);
        return () => {
            document.removeEventListener('visibilitychange', alCambiarVisibilidad);
            window.removeEventListener('pageshow', alMostrar);
        };
    }, [recargar, msMinimos]);
}
