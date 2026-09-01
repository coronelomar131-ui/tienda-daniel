import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchTopVendidos } from '../lib/shopApi';
import { useRefrescarAlVolver } from '../lib/alVolver';
import ProductPhoto from './ProductPhoto';

// Los que mas se venden, en rejilla limpia: foto y nombre, nada mas.
// Sin precio ni botones a proposito: aqui la funcion es que el ojo reconozca
// el modelo y entre. El precio ya vive en la ficha y en el catalogo.
const MasVendidos = () => {
    const [pares, setPares] = useState([]);

    const cargar = React.useCallback(() => {
        fetchTopVendidos(6).then(setPares).catch(() => setPares([]));
    }, []);

    useEffect(() => { cargar(); }, [cargar]);
    useRefrescarAlVolver(cargar);

    // Sin ventas ni pares fijados no se dibuja nada: una seccion de "lo mas
    // vendido" vacia, o rellenada con cualquier cosa, es peor que no tenerla.
    if (pares.length === 0) return null;

    return (
        <section className="section vendidos">
            <div className="wrap">
                <div className="section-head reveal">
                    <h2>Los que más se venden</h2>
                </div>
                <div className="vendidos-rejilla">
                    {pares.map(par => (
                        <Link key={par.id} to={`/tenis/${par.id}`} className="vendido reveal">
                            <div className="vendido-foto">
                                <ProductPhoto product={par} />
                            </div>
                            <span className="vendido-nombre">{par.name}</span>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default MasVendidos;
