import React, { useEffect, useRef, useState } from 'react';

// EL TICKET. Cuando el pedido ya quedó guardado, la tienda le imprime al
// cliente su ticket de apartado, como en una caja de verdad: el papel va
// saliendo de la impresora y cada renglón se entinta uno por uno, con las
// pausitas desiguales de una impresora térmica. Al final, el corte.
//
// Aquí vive lo que antes estaba repartido en varios recuadros: el folio,
// los pares, el total, el anticipo, a dónde transferir y el concepto. Todo
// en un solo papel, que es lo que el cliente va a querer guardar.
//
// La impresión no pasa por React: se miden los renglones y se va abriendo la
// ventana del papel a la altura de cada uno, directo en el DOM. Si el
// sistema pide menos animación, el ticket sale entero de una vez.

const PASO = 115;       // ms entre renglón y renglón
const VAIVEN = 90;      // ms de más, al azar: una térmica no es pareja
const PAUSA_TOTAL = 380; // antes del total la impresora "piensa"
const AVANCE_MS = 170;  // lo que tarda el papel en avanzar un renglón

const sinMovimiento = () => !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const pesos = (n) => `$${(Number(n) || 0).toLocaleString('es-MX')}`;
const fecha = () => new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }).replace('.', '');

// Código de barras con los dígitos del folio: cada dígito es un patrón fijo
// de barras (los del EAN), así el mismo folio siempre dibuja lo mismo.
const PATRONES = ['0001101', '0011001', '0010011', '0111101', '0100011', '0110001', '0101111', '0111011', '0110111', '0001011'];
const Barras = ({ codigo }) => {
    const bits = '101' + [...codigo].map(d => PATRONES[Number(d)] || PATRONES[0]).join('') + '101';
    const rects = [];
    for (let i = 0; i < bits.length; i++) if (bits[i] === '1') rects.push(<rect key={i} x={i} y="0" width="1" height="1" />);
    return (
        <svg className="ticket-barras" viewBox={`0 0 ${bits.length} 1`} preserveAspectRatio="none" aria-hidden="true">
            {rects}
        </svg>
    );
};

const Ticket = ({ folio, lineas, total, aPagar, esAnticipo, pct, cuenta, onCopiarClabe }) => {
    const papel = useRef(null);
    const ventana = useRef(null);
    // sin animación, el ticket ya nace impreso
    const [impreso, setImpreso] = useState(sinMovimiento);
    const [copiado, setCopiado] = useState(false);
    const codigo = String(folio).padStart(6, '0');

    useEffect(() => {
        const v = ventana.current, p = papel.current;
        if (!v || !p) return;
        const renglones = [...p.querySelectorAll('[data-renglon]')];
        let vivo = true, timer = 0;
        const pausa = (ms) => new Promise(res => { timer = setTimeout(res, ms); });

        if (sinMovimiento()) {
            renglones.forEach(r => r.classList.add('entintado'));
            v.style.height = 'auto';
            return;
        }

        v.style.height = '0px';
        (async () => {
            await pausa(220);   // la impresora arranca
            for (const r of renglones) {
                if (!vivo) return;
                if (r.dataset.renglon === 'total') await pausa(PAUSA_TOTAL);
                v.style.transition = `height ${AVANCE_MS}ms cubic-bezier(.3, .7, .4, 1)`;
                v.style.height = `${r.offsetTop + r.offsetHeight}px`;
                r.classList.add('entintado');
                await pausa(PASO + Math.random() * VAIVEN);
            }
            if (!vivo) return;
            v.style.height = `${p.offsetHeight}px`;
            await pausa(AVANCE_MS + 120);
            if (!vivo) return;
            v.style.height = 'auto';
            setImpreso(true);   // el corte
        })();

        return () => { vivo = false; clearTimeout(timer); };
    }, []);

    const copiar = () => {
        onCopiarClabe?.();
        setCopiado(true);
        setTimeout(() => setCopiado(false), 1800);
    };

    return (
        <div className={`impresora${impreso ? ' impreso' : ''}`}>
            <div className="impresora-cabeza" aria-live="polite">
                <span className="impresora-luz" aria-hidden="true" />
                <span>{impreso ? 'Tu ticket' : 'Imprimiendo tu ticket…'}</span>
            </div>
            <div className="impresora-ranura" aria-hidden="true" />

            <div className="ticket-ventana" ref={ventana}>
                <div className="ticket" ref={papel}>
                    <div className="ticket-marca" data-renglon>Prothe <em>Shop</em></div>
                    <div className="ticket-fila ticket-meta" data-renglon>
                        <span>Ticket de apartado</span><span>{fecha()}</span>
                    </div>
                    <div className="ticket-folio" data-renglon>
                        <span>Folio</span><strong>#{folio}</strong>
                    </div>
                    <div className="ticket-corte" data-renglon aria-hidden="true" />

                    {lineas.map(item => (
                        <div className="ticket-fila ticket-par" key={item.key} data-renglon>
                            <span className="ticket-cant">{item.qty}×</span>
                            <span className="ticket-nombre">
                                {item.name}
                                {item.size ? <small> T {item.size}</small> : null}
                            </span>
                            <span className="ticket-precio">{pesos(item.price * item.qty)}</span>
                        </div>
                    ))}

                    <div className="ticket-corte" data-renglon aria-hidden="true" />
                    {esAnticipo ? (
                        <>
                            <div className="ticket-fila" data-renglon><span>Total del pedido</span><span>{pesos(total)}</span></div>
                            <div className="ticket-fila ticket-total" data-renglon="total">
                                <span>Anticipo {pct}%</span><strong>{pesos(aPagar)}</strong>
                            </div>
                            <div className="ticket-fila ticket-suave" data-renglon><span>Resto al recibir</span><span>{pesos(total - aPagar)}</span></div>
                        </>
                    ) : (
                        <div className="ticket-fila ticket-total" data-renglon="total">
                            <span>Total</span><strong>{pesos(aPagar)}</strong>
                        </div>
                    )}

                    <div className="ticket-corte" data-renglon aria-hidden="true" />
                    {cuenta?.clabe ? (
                        <>
                            <div className="ticket-titulo" data-renglon>Transfiere a</div>
                            {(cuenta.banco || cuenta.titular) && (
                                <div className="ticket-fila" data-renglon>
                                    <span>{cuenta.banco}</span><span>{cuenta.titular}</span>
                                </div>
                            )}
                            <div className="ticket-fila ticket-clabe" data-renglon>
                                <span>CLABE {cuenta.clabe.replace(/(\d{4})(?=\d)/g, '$1 ')}</span>
                                <button type="button" onClick={copiar}>{copiado ? 'Copiada' : 'Copiar'}</button>
                            </div>
                            <div className="ticket-fila" data-renglon><span>Concepto</span><span>#{folio}</span></div>
                            <div className="ticket-nota" data-renglon>
                                Mándanos tu comprobante por WhatsApp con el folio.
                            </div>
                        </>
                    ) : (
                        <div className="ticket-nota" data-renglon>
                            Escríbenos por WhatsApp con tu folio y te decimos cómo pagar.
                        </div>
                    )}

                    <div className="ticket-corte" data-renglon aria-hidden="true" />
                    <div className="ticket-codigo" data-renglon>
                        <Barras codigo={codigo} />
                        <span>{codigo}</span>
                    </div>
                    <div className="ticket-gracias" data-renglon>Gracias por tu pedido</div>
                </div>
            </div>
        </div>
    );
};

export default Ticket;
