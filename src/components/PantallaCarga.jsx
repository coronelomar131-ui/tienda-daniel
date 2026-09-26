import React from 'react';

// LA PANTALLA DE CARGA
//
// Mientras el servidor confirma que la sesión vale, antes no se pintaba nada:
// pantalla negra. En una red lenta eso parece que la tienda se murió.
//
// En vez de una ruedita girando —que no dice nada y las hay iguales en todas
// partes— esto dibuja el esqueleto de lo que está por llegar: la cabecera y
// tres renglones de repisa, del mismo tamaño y en el mismo lugar donde van a
// aparecer tus pares. Así la pantalla no "salta" cuando cargan.
//
// Encima pasa UNA luz, despacio, de arriba a abajo. Es la linterna cruzando
// los estantes de una bodega a oscuras, que es literalmente lo que está
// pasando: se está buscando tu mercancía. Es el único movimiento de toda la
// pantalla, y se apaga solo si el teléfono pide menos animación.

const Renglon = () => (
    <div className="carga-renglon">
        <span className="carga-foto" />
        <span className="carga-lineas">
            <span className="carga-linea larga" />
            <span className="carga-linea corta" />
        </span>
    </div>
);

// La misma pantalla sirve para las dos esperas: mientras carga, y cuando no
// hay señal. Antes, sin señal se pintaba el panel completo "por si acaso", y
// salia vacio de todos modos porque todo viene del servidor: parecia que la
// tienda se habia quedado sin nada. Mejor decir lo que pasa.
const PantallaCarga = ({ texto = 'Abriendo tu bodega', sinRed = false, onReintentar }) => (
    <div className="admin-page carga-pagina" role="status" aria-live="polite">
        <div className="wrap">
            {!sinRed && <div className="carga-luz" aria-hidden="true" />}

            <div className="carga-cabecera">
                <span className="carga-marca">Prothe Shop</span>
                <span className="carga-boton" />
            </div>

            {sinRed ? (
                <div className="carga-sinred">
                    <p className="carga-titulo">No hay conexión</p>
                    <p className="carga-detalle">
                        Tu panel vive en el servidor, así que sin señal no hay nada que
                        enseñarte. Revisa tus datos o tu wifi y vuelve a intentar.
                    </p>
                    <button type="button" className="btn-ghost" onClick={onReintentar}>
                        Reintentar
                    </button>
                </div>
            ) : (
                <p className="carga-texto">{texto}</p>
            )}

            <div className="carga-repisa" aria-hidden="true">
                <Renglon />
                <Renglon />
                <Renglon />
            </div>
        </div>
    </div>
);

export default PantallaCarga;
