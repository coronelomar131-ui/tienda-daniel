import React, { useContext, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ShopContext } from '../context/shop-context';
import { CATEGORIAS, enRebajas } from '../lib/categorias';
import { verDescuento, pesos } from '../lib/descuento';
import { estiloTono } from '../lib/tono';
import ProductPhoto from './ProductPhoto';
import { marcarFoto } from '../lib/transicion';

// LA REJILLA DE LA PORTADA.
//
// Debajo del titular van tres bloques que responden a lo que de verdad hay en
// la tienda: el par destacado, la categoría con más pares, y la promesa.
// Ninguno es decoración: los tres llevan a algún lado.
//
// Un bloque que no tiene con qué llenarse NO se dibuja. Un cuadro vacío en la
// portada se ve peor que no tenerlo.

// El sello que da vueltas, como el de las tiendas de muebles. Es texto de
// verdad en un círculo, no una imagen: se ve nítido en cualquier pantalla.
// OJO con el separador: SVG se come los espacios del final, asi que un texto
// que termine en " · " llega al aro SIN el punto y la ultima palabra se pega
// con la primera. Por eso el punto va al PRINCIPIO: en la costura del circulo
// queda "…MÉXICO" seguido de "· APARTA" y se lee limpio.
const Sello = ({ texto = '· APARTA POR WHATSAPP · ENVÍOS A TODO MÉXICO' }) => (
    <span className="sello" aria-hidden="true">
        <svg viewBox="0 0 100 100">
            <defs>
                <path id="aro" d="M50,50 m-34,0 a34,34 0 1,1 68,0 a34,34 0 1,1 -68,0" />
            </defs>
            <text><textPath href="#aro">{texto}</textPath></text>
        </svg>
        <span className="sello-centro" />
    </span>
);

const Bento = ({ onFiltrar }) => {
    const { products } = useContext(ShopContext);

    // Filtrar sin bajar al catálogo deja al cliente arriba viendo lo mismo,
    // creyendo que el botón no hizo nada. Igual que las bandas de filtros.
    const filtrarYBajar = (filtro) => {
        onFiltrar?.(filtro);
        document.getElementById('coleccion')?.scrollIntoView({ behavior: 'smooth' });
    };

    const destacado = useMemo(() => {
        const vivos = (products || []).filter(p => p.photoCount > 0 && p.status !== 'agotado');
        // primero el que el dueño marcó; si no marcó ninguno, el de mejor oferta
        return vivos.find(p => p.destacado)
            || vivos.filter(enRebajas).sort((a, b) => verDescuento(b).pct - verDescuento(a).pct)[0]
            || vivos[0]
            || null;
    }, [products]);

    const categoria = useMemo(() => {
        const cuenta = new Map();
        for (const p of products || []) {
            const k = p.categoria || 'calzado';
            cuenta.set(k, (cuenta.get(k) || 0) + 1);
        }
        const [llave, cuantos] = [...cuenta.entries()].sort((a, b) => b[1] - a[1])[0] || [];
        if (!llave) return null;
        return { llave, cuantos, texto: CATEGORIAS.find(c => c.llave === llave)?.texto || 'Calzado' };
    }, [products]);

    const rebajados = (products || []).filter(enRebajas).length;

    // Sin catálogo todavía no hay nada que enseñar.
    if (!destacado && !categoria) return null;

    const oferta = destacado ? verDescuento(destacado) : null;

    return (
        <div className="bento">
            {destacado && (
                <Link
                    to={`/tenis/${destacado.id}`}
                    className="bento-par reveal"
                    style={estiloTono(destacado.id)}
                    viewTransition
                    onClick={(e) => marcarFoto(e.currentTarget)}
                >
                    <span className="bento-eti">{oferta ? `-${oferta.pct}% hoy` : 'El que se está llevando'}</span>
                    <span className="bento-par-foto">
                        <ProductPhoto product={destacado} />
                    </span>
                    <Sello />
                    <span className="bento-par-pie">
                        <span className="bento-par-nombre">
                            <small>{destacado.brand}</small>
                            {destacado.name}
                        </span>
                        <span className="bento-par-precio">
                            {pesos(destacado.price)}
                            {oferta && <s>{pesos(oferta.antes)}</s>}
                        </span>
                    </span>
                </Link>
            )}

            <div className="bento-chicos">
                {categoria && (
                    <button
                        className="bento-cat reveal"
                        style={estiloTono(categoria.llave)}
                        onClick={() => filtrarYBajar({ tipo: 'categoria', valor: categoria.llave })}
                    >
                        <span className="bento-eti">Lo que más hay</span>
                        <span className="bento-cat-nombre">{categoria.texto}</span>
                        <span className="bento-cat-cuenta">
                            {categoria.cuantos} {categoria.cuantos === 1 ? 'par' : 'pares'}
                        </span>
                    </button>
                )}

                {rebajados > 0 ? (
                    <button className="bento-promesa reveal bento-rebajas" onClick={() => filtrarYBajar({ tipo: 'rebajas', valor: null })}>
                        <span className="bento-eti">Rebajas</span>
                        <strong>{rebajados} {rebajados === 1 ? 'par bajó' : 'pares bajaron'} de precio</strong>
                        <span className="bento-nota">Mientras duren. Los precios de antes van tachados.</span>
                    </button>
                ) : (
                    <div className="bento-promesa reveal">
                        <span className="bento-eti">Cómo funciona</span>
                        <strong>Originales, no réplicas</strong>
                        <span className="bento-nota">Apartas por WhatsApp y te llega a donde estés, a todo México.</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Bento;
