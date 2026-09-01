import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

// El filtro de marcas: capsulas de vidrio en una fila que corre de lado, con
// un indicador que se DESLIZA de una a otra. Que se mueva en vez de solo
// prenderse es lo que hace que se sienta de app y no de pagina.
const BrandFilter = ({ brands, active, onSelect }) => {
    const pista = useRef(null);
    const botones = useRef({});
    const [marca, setMarca] = useState(null);   // posicion y ancho del indicador
    const [listo, setListo] = useState(false);  // para no animar en el primer dibujo

    const medir = useCallback(() => {
        const nodo = botones.current[String(active)];
        if (!nodo || !pista.current) return;
        setMarca({ x: nodo.offsetLeft, w: nodo.offsetWidth });
    }, [active]);

    useLayoutEffect(() => {
        medir();
        // La primera medida no se anima: si no, el indicador entra volando
        // desde la esquina cada vez que carga la pagina.
        const t = requestAnimationFrame(() => setListo(true));
        return () => cancelAnimationFrame(t);
    }, [medir, brands.length]);

    // Las tipografias cargan despues y cambian el ancho de los botones, asi
    // que hay que volver a medir cuando la fila cambie de tamaño.
    useEffect(() => {
        if (!pista.current || typeof ResizeObserver === 'undefined') return;
        const ro = new ResizeObserver(medir);
        ro.observe(pista.current);
        return () => ro.disconnect();
    }, [medir]);

    const elegir = (brand) => {
        onSelect(brand);
        botones.current[String(brand)]?.scrollIntoView({
            behavior: 'smooth', block: 'nearest', inline: 'nearest',
        });
        document.getElementById('coleccion')?.scrollIntoView({ behavior: 'smooth' });
    };

    const opciones = [{ valor: null, texto: 'Todas' }, ...brands.map(b => ({ valor: b, texto: b }))];

    return (
        <div className="brands">
            <div className="wrap">
                <div className="brands-fila">
                    <span className="row-label">Marca</span>
                    <div className="brand-pista" ref={pista} role="tablist" aria-label="Filtrar por marca">
                        {marca && (
                            <span
                                className={`brand-indicador${listo ? ' anda' : ''}`}
                                style={{ transform: `translateX(${marca.x}px)`, width: `${marca.w}px` }}
                                aria-hidden="true"
                            />
                        )}
                        {opciones.map(({ valor, texto }) => (
                            <button
                                key={String(valor)}
                                ref={(el) => { botones.current[String(valor)] = el; }}
                                role="tab"
                                aria-selected={active === valor}
                                className={`brand-chip${active === valor ? ' active' : ''}`}
                                onClick={() => elegir(valor)}
                            >
                                {texto}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BrandFilter;
