import React, { useEffect, useRef, useState } from 'react';

// LA IMPRESORA. Saca el papel renglón por renglón, con las pausas desiguales
// de una térmica y una pausa antes del total (los renglones se marcan con
// data-renglon, y el del total con data-renglon="total"). Al terminar, el
// corte: el papel da un brinquito, la luz se pone verde y, si es para
// celebrar (un pago aprobado), sale el confeti de la ranura.
//
// Con el cursor encima, el papel se balancea colgado de la ranura, como en
// caja cuando le pasas la mano.
//
// Nada de esto pasa por React cuadro a cuadro: se miden los renglones y se va
// abriendo la ventana del papel directo en el DOM. Si el sistema pide menos
// animación, el ticket sale entero de una vez y sin confeti.

const PASO = 115;         // ms entre renglón y renglón
const VAIVEN = 90;        // ms de más, al azar: una térmica no es pareja
const PAUSA_TOTAL = 380;  // antes del total la impresora "piensa"
const AVANCE_MS = 170;    // lo que tarda el papel en avanzar un renglón
const CONFETI_MS = 2600;  // cuánto dura el confeti en pantalla

// Los colores de la marca: nada de arcoíris.
const COLORES = ['#1B2A52', '#2C4278', '#A9B8DE', '#DCE3F3', '#121212', '#FFFFFF'];

const sinMovimiento = () => !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const crearConfeti = () => Array.from({ length: 38 }, (_, i) => ({
    id: i,
    x: (Math.random() - 0.5) * 300,
    alto: -(70 + Math.random() * 120),
    caida: 60 + Math.random() * 190,
    giro: (Math.random() - 0.5) * 900,
    color: COLORES[i % COLORES.length],
    retraso: Math.random() * 120,
    largo: 6 + Math.random() * 6,
}));

const Impresora = ({ children, confeti = false, tituloListo = 'Tu ticket' }) => {
    const papel = useRef(null);
    const ventana = useRef(null);
    const inclina = useRef(null);
    // sin animación, el ticket ya nace impreso
    const [impreso, setImpreso] = useState(sinMovimiento);
    const [chispas, setChispas] = useState([]);

    useEffect(() => {
        const v = ventana.current, p = papel.current;
        if (!v || !p) return;
        const renglones = [...p.querySelectorAll('[data-renglon]')];
        let vivo = true, timer = 0, timerConfeti = 0;
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
            if (confeti) {
                setChispas(crearConfeti());
                timerConfeti = setTimeout(() => setChispas([]), CONFETI_MS);
            }
        })();

        return () => { vivo = false; clearTimeout(timer); clearTimeout(timerConfeti); };
    }, [confeti]);

    // balanceo: el papel gira un poco hacia donde va el cursor
    const seguir = (e) => {
        const el = inclina.current;
        if (!el || e.pointerType !== 'mouse' || sinMovimiento()) return;
        const r = el.getBoundingClientRect();
        const dx = ((e.clientX - r.left) / r.width - 0.5) * 2;
        const dy = ((e.clientY - r.top) / r.height - 0.5) * 2;
        el.classList.add('siguiendo');
        el.style.setProperty('--ry', `${dx * 7}deg`);
        el.style.setProperty('--rz', `${dx * 1.8}deg`);
        el.style.setProperty('--rx', `${-dy * 2.5}deg`);
    };
    const soltar = () => {
        const el = inclina.current;
        if (!el) return;
        el.classList.remove('siguiendo');
        ['--ry', '--rz', '--rx'].forEach(v => el.style.removeProperty(v));
    };

    return (
        <div className={`impresora${impreso ? ' impreso' : ''}`}>
            <div className="impresora-cabeza" aria-live="polite">
                <span className="impresora-luz" aria-hidden="true" />
                <span>{impreso ? tituloListo : 'Imprimiendo tu ticket…'}</span>
            </div>
            <div className="impresora-ranura" aria-hidden="true" />

            <div className="ticket-inclina" ref={inclina} onPointerMove={seguir} onPointerLeave={soltar}>
                <div className="ticket-ventana" ref={ventana}>
                    <div className="ticket" ref={papel}>{children}</div>
                </div>
            </div>

            {chispas.length > 0 && (
                <div className="confeti-caja" aria-hidden="true">
                    {chispas.map(c => (
                        <span key={c.id} className="confeti" style={{
                            '--x': `${c.x}px`, '--alto': `${c.alto}px`, '--caida': `${c.caida}px`,
                            '--giro': `${c.giro}deg`, '--color': c.color, '--retraso': `${c.retraso}ms`,
                            '--largo': `${c.largo}px`,
                        }} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default Impresora;
