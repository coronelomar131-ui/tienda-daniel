import React, { useMemo } from 'react';
import ProductPhoto from './ProductPhoto';
import { CATEGORIAS, enRebajas, mismoFiltro } from '../lib/categorias';

// Las bandas al estilo de la app de Nike: capsulas de vidrio con el nombre
// grande y un par asomandose. Una banda solo existe si de verdad tiene pares
// adentro; si no, seria un callejon sin salida para el cliente.
const BrandFilter = ({ products = [], brands = [], active, onSelect }) => {
    const bandas = useMemo(() => {
        const primero = (lista) => lista[0] || null;
        const lista = [{ filtro: { tipo: 'todos', valor: null }, texto: 'Todos los pares', par: products[0] || null }];

        for (const { llave, texto } of CATEGORIAS) {
            const dentro = products.filter(p => (p.categoria || 'calzado') === llave);
            if (dentro.length === 0) continue;   // sin pares, no hay banda
            lista.push({ filtro: { tipo: 'categoria', valor: llave }, texto, par: primero(dentro) });
        }

        const rebajados = products.filter(enRebajas);
        if (rebajados.length > 0) {
            lista.push({ filtro: { tipo: 'rebajas', valor: null }, texto: 'Rebajas', par: primero(rebajados) });
        }
        return lista;
    }, [products]);

    const elegir = (filtro) => {
        onSelect(filtro);
        document.getElementById('coleccion')?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <div className="brands">
            <div className="bandas">
                {bandas.map(({ filtro, texto, par }, i) => (
                    <button
                        key={`${filtro.tipo}-${filtro.valor}`}
                        className={`banda reveal${mismoFiltro(active, filtro) ? ' activa' : ''}${filtro.tipo === 'rebajas' ? ' banda-rebajas' : ''}`}
                        style={{ '--retraso': `${i * 70}ms` }}
                        onClick={() => elegir(filtro)}
                        aria-pressed={mismoFiltro(active, filtro)}
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

            {/* La marca sigue siendo el filtro que mas se usa en una tienda de
                tenis, asi que se queda; nomas en chico, para no competir con
                las bandas. */}
            {brands.length > 1 && (
                <div className="wrap">
                    <div className="marcas-mini">
                        <span className="row-label">Marca</span>
                        <div className="marcas-mini-fila">
                            {brands.map(b => {
                                const filtro = { tipo: 'marca', valor: b };
                                return (
                                    <button
                                        key={b}
                                        className={`mini-chip${mismoFiltro(active, filtro) ? ' on' : ''}`}
                                        onClick={() => elegir(filtro)}
                                    >{b}</button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BrandFilter;
