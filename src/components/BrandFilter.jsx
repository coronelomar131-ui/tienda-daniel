import React, { useMemo } from 'react';
import ProductPhoto from './ProductPhoto';

// Las marcas como bandas de ancho completo, al estilo de la app de Nike:
// el nombre grande a la izquierda y un par de esa marca asomandose a la
// derecha. Se lee de un vistazo y se toca sin apuntar.
const BrandFilter = ({ brands, active, onSelect, products = [] }) => {
    // Cada banda enseña un par real de su marca, no una foto generica: la
    // primera del catalogo, que es la que el dueño puso hasta arriba.
    const muestra = useMemo(() => {
        const mapa = {};
        for (const p of products) {
            if (p.brand && !mapa[p.brand]) mapa[p.brand] = p;
        }
        return mapa;
    }, [products]);

    const elegir = (brand) => {
        onSelect(brand);
        document.getElementById('coleccion')?.scrollIntoView({ behavior: 'smooth' });
    };

    const bandas = [
        { valor: null, texto: 'Todos los pares', par: products[0] || null },
        ...brands.map(b => ({ valor: b, texto: b, par: muestra[b] || null })),
    ];

    return (
        <div className="brands">
            <div className="wrap">
                <span className="row-label">Marca</span>
            </div>
            <div className="bandas">
                {bandas.map(({ valor, texto, par }, i) => (
                    <button
                        key={String(valor)}
                        className={`banda reveal${active === valor ? ' activa' : ''}`}
                        // Entran escalonadas: una tras otra, no todas de golpe.
                        style={{ '--retraso': `${i * 70}ms` }}
                        onClick={() => elegir(valor)}
                        aria-pressed={active === valor}
                    >
                        <span className="banda-brillo" aria-hidden="true" />
                        <span className="banda-nombre">{texto}</span>
                        {par && (
                            <span className="banda-foto" aria-hidden="true">
                                <ProductPhoto product={par} />
                            </span>
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default BrandFilter;
