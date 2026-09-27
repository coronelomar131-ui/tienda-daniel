import React, { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ProductPhoto from './ProductPhoto';

// El abanico de la portada: siempre se ven tres pares (uno al frente y dos
// atrás, inclinados), pero se desliza para ir pasando todos. Al arrastrar, la
// tarjeta del frente sigue al dedo; si se suelta pasando el umbral entra la
// siguiente, si no regresa. Nada se mueve solo: sólo responde al dedo.
//
// Tocar la del frente abre su ficha; tocar una de atrás la trae al frente.
// Subir la del frente con el dedo también abre su ficha: la tarjeta sube con
// el dedo y avisa "Suelta para ver el par". Ojo: subir el dedo es también como
// se baja por la página, por eso sólo la del frente lo atrapa (empezando en
// cualquier otro lado la página baja normal) y hay que subirla bastante; si se
// suelta antes, regresa y no abre nada.

const UMBRAL = 50;        // px de arrastre para cambiar de par
const UMBRAL_SUBIR = 110; // px hacia arriba para abrir el par
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
    const [dy, setDy] = useState(0);
    const inicio = useRef(null);
    const movio = useRef(false);
    const navigate = useNavigate();
    const n = pares.length;

    const ir = (i) => setActual(((i % n) + n) % n);

    const alBajar = (e) => {
        inicio.current = {
            x: e.clientX, y: e.clientY, id: e.pointerId, eje: null,
            enFrente: !!e.target.closest('.hero-par[data-lugar="frente"]'),
        };
        movio.current = false;
    };
    const alMover = (e) => {
        const a = inicio.current;
        if (!a || a.id !== e.pointerId) return;
        const mx = e.clientX - a.x, my = e.clientY - a.y;
        // Hasta saber hacia dónde va el dedo no se decide nada. De lado: pasar
        // de par. Hacia arriba empezando en la del frente: abrirla. Cualquier
        // otra cosa es scroll de la página y no se le estorba.
        if (a.eje === null && Math.hypot(mx, my) > TOLERANCIA) {
            if (Math.abs(mx) > Math.abs(my)) a.eje = n > 1 ? 'x' : 'nada';
            else a.eje = (my < 0 && a.enFrente) ? 'subir' : 'nada';
            if (a.eje !== 'nada') e.currentTarget.setPointerCapture?.(e.pointerId);
        }
        if (a.eje === 'x') { movio.current = true; setDx(mx); }
        else if (a.eje === 'subir') { movio.current = true; setDy(Math.min(0, my)); }
    };
    const alSoltar = () => {
        const a = inicio.current;
        inicio.current = null;
        if (a?.eje === 'x') {
            if (dx <= -UMBRAL) ir(actual + 1);
            else if (dx >= UMBRAL) ir(actual - 1);
        } else if (a?.eje === 'subir' && dy <= -UMBRAL_SUBIR) {
            navigate(`/tenis/${pares[actual].id}`);
        }
        setDx(0); setDy(0);
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
                className={`hero-pares hero-pares-${Math.min(n, 3)}${dx ? ' arrastrando' : ''}${dy ? ' subiendo' : ''}${dy <= -UMBRAL_SUBIR ? ' listo-abrir' : ''}`}
                onPointerDown={alBajar}
                onPointerMove={alMover}
                onPointerUp={alSoltar}
                onPointerCancel={alSoltar}
                onKeyDown={alTecla}
                style={{ '--dx': `${dx}px`, '--dxn': dx, '--dy': `${dy}px`, '--avance': Math.min(1, -dy / UMBRAL_SUBIR) }}
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
                            {lugar === 'frente' && (
                                <span className="hero-par-subir" aria-hidden="true">
                                    {dy <= -UMBRAL_SUBIR ? 'Suelta para ver el par' : 'Sube para ver el par'}
                                </span>
                            )}
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
            <p className="hero-gestos">
                {n > 1 ? 'Desliza de lado para ver más pares, o sube uno para abrirlo.' : 'Sube el par para abrirlo.'}
            </p>
        </div>
    );
};

export default AbanicoPares;
