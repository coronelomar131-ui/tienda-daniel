import React, { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ProductPhoto from './ProductPhoto';

// El abanico de la portada: siempre se ven tres pares (uno al frente y dos
// atrás, inclinados), pero se desliza para ir pasando todos. Al arrastrar, la
// tarjeta del frente sigue al dedo; si se suelta pasando el umbral entra la
// siguiente, si no regresa. Nada se mueve solo: sólo responde al dedo.
//
// Tocar la del frente abre su ficha; tocar una de atrás la trae al frente.

const UMBRAL = 50;        // px de arrastre para cambiar de par
const TOLERANCIA = 8;     // px a partir de los cuales ya es arrastre y no toque

function lugarDe(k, actual, n) {
    if (n === 1) return 'frente';
    const d = (k - actual + n) % n;
    if (d === 0) return 'frente';
    if (d === 1) return 'derecha';
    if (d === n - 1 && n > 2) return 'izquierda';
    return 'oculto';
}

const AbanicoPares = ({ pares }) => {
    const [actual, setActual] = useState(0);
    const [dx, setDx] = useState(0);
    const inicio = useRef(null);
    const movio = useRef(false);
    const navigate = useNavigate();
    const n = pares.length;

    const ir = (i) => setActual(((i % n) + n) % n);

    const alBajar = (e) => {
        if (n < 2) return;
        inicio.current = { x: e.clientX, y: e.clientY, id: e.pointerId, horizontal: null };
        movio.current = false;
    };
    const alMover = (e) => {
        const a = inicio.current;
        if (!a || a.id !== e.pointerId) return;
        const mx = e.clientX - a.x, my = e.clientY - a.y;
        // Hasta saber si el dedo va de lado o para abajo, no se decide nada:
        // para abajo es scroll de la página y no se le estorba.
        if (a.horizontal === null && Math.hypot(mx, my) > TOLERANCIA) {
            a.horizontal = Math.abs(mx) > Math.abs(my);
            if (a.horizontal) e.currentTarget.setPointerCapture?.(e.pointerId);
        }
        if (!a.horizontal) return;
        movio.current = true;
        setDx(mx);
    };
    const alSoltar = () => {
        const a = inicio.current;
        inicio.current = null;
        if (!a || !a.horizontal) { setDx(0); return; }
        if (dx <= -UMBRAL) ir(actual + 1);
        else if (dx >= UMBRAL) ir(actual - 1);
        setDx(0);
    };

    const alTocar = (e, k) => {
        e.preventDefault();
        if (movio.current) { movio.current = false; return; }
        if (k === actual) navigate(`/tenis/${pares[k].id}`);
        else ir(k);
    };

    const alTecla = (e) => {
        if (e.key === 'ArrowRight') { e.preventDefault(); ir(actual + 1); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); ir(actual - 1); }
    };

    return (
        <div className="hero-pares-wrap">
            <div
                className={`hero-pares hero-pares-${Math.min(n, 3)}${dx ? ' arrastrando' : ''}`}
                onPointerDown={alBajar}
                onPointerMove={alMover}
                onPointerUp={alSoltar}
                onPointerCancel={alSoltar}
                onKeyDown={alTecla}
                style={{ '--dx': `${dx}px`, '--dxn': dx }}
                aria-roledescription="carrusel"
                aria-label="Pares de la tienda"
            >
                {pares.map((par, k) => {
                    const lugar = lugarDe(k, actual, n);
                    return (
                        <Link
                            key={par.id}
                            to={`/tenis/${par.id}`}
                            className="hero-par"
                            data-lugar={lugar}
                            tabIndex={lugar === 'frente' ? 0 : -1}
                            aria-hidden={lugar === 'oculto' ? 'true' : undefined}
                            aria-label={lugar === 'frente' ? `${par.name}, $${par.price.toLocaleString('es-MX')}` : `Ver ${par.name}`}
                            onClick={(e) => alTocar(e, k)}
                            draggable={false}
                        >
                            <span className="hero-par-foto"><ProductPhoto product={par} completa /></span>
                            <span className="hero-par-dato">
                                <span className="hero-par-nombre">{par.name}</span>
                                <span className="hero-par-precio">${par.price.toLocaleString('es-MX')}</span>
                            </span>
                        </Link>
                    );
                })}
            </div>

            {n > 1 && (
                <div className="hero-puntos" role="tablist" aria-label="Elegir par">
                    {pares.map((par, k) => (
                        <button
                            key={par.id}
                            type="button"
                            role="tab"
                            aria-selected={k === actual}
                            aria-label={`Ver ${par.name} (${k + 1} de ${n})`}
                            className={k === actual ? 'activo' : undefined}
                            onClick={() => ir(k)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default AbanicoPares;
