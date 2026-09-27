import React, { useEffect, useRef, useState } from 'react';
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

const AVANCE_MIN = 0.35;  // fracción del recorrido para cambiar de par al soltar
const VELOCIDAD = 0.4;    // px/ms: un aventón así de rápido cambia de par aunque sea corto
const SALIDA_MS = 200;    // lo que tarda el par en salir volando antes de abrir su ficha
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

// Los mismos lugares que en el CSS (.hero-par[data-lugar=...]). Aquí se usan
// para mezclar el lugar de cada tarjeta con el siguiente mientras el dedo
// arrastra: así todo el abanico se mueve con el dedo, no sólo la del frente.
const LUGARES = {
    3: {
        frente:    { x: 2,   y: 4,   g: -1.5, s: 1.04, o: 1, z: 3 },
        izquierda: { x: -58, y: -11, g: -10,  s: 0.96, o: 1, z: 2 },
        derecha:   { x: 56,  y: -25, g: 9,    s: 0.96, o: 1, z: 2 },
        oculto:    { x: 0,   y: -8,  g: 0,    s: 0.82, o: 0, z: 1 },
    },
    2: {
        frente:  { x: -22, y: 4,   g: -1.5, s: 1.04, o: 1, z: 3 },
        derecha: { x: 34,  y: -18, g: 9,    s: 0.96, o: 1, z: 2 },
    },
};
const mezclar = (a, b, p) => a + (b - a) * p;
const sinMovimiento = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const AbanicoPares = ({ pares }) => {
    const [actual, setActual] = useState(0);
    const [dx, setDx] = useState(0);
    const [dy, setDy] = useState(0);
    const [abriendo, setAbriendo] = useState(false);
    const [paso, setPaso] = useState(200);   // px que recorre la del frente a su lado; se mide al empezar a arrastrar
    const inicio = useRef(null);
    const caja = useRef(null);
    const salida = useRef(null);
    const movio = useRef(false);
    const navigate = useNavigate();
    const n = pares.length;

    const ir = (i) => setActual(((i % n) + n) % n);

    useEffect(() => () => clearTimeout(salida.current), []);

    // Qué tanto del camino lleva el arrastre (0 a 1). paso = lo que recorre la
    // del frente de su lugar al de al lado: así el arrastre va 1 a 1 con el dedo.
    const avanceDe = (d) => Math.min(1, Math.abs(d) / paso);

    // Lugar mezclado de la tarjeta k mientras se arrastra: entre donde está y
    // a donde va. La capa cambia a la mitad del camino.
    const estiloArrastre = (k) => {
        if (!dx || n < 2) return undefined;
        const tabla = LUGARES[n >= 3 ? 3 : 2];
        const dir = dx < 0 ? 1 : -1;
        const p = avanceDe(dx);
        const a = tabla[lugarDe(k, actual, n)], b = tabla[lugarDe(k, actual + dir, n)];
        const m = key => mezclar(a[key], b[key], p);
        return {
            transform: `translate(-50%, -50%) translate(${m('x')}%, ${m('y')}%) rotate(${m('g')}deg) scale(${m('s')})`,
            opacity: m('o'),
            zIndex: p < 0.5 ? a.z : b.z,
        };
    };

    const alBajar = (e) => {
        inicio.current = {
            x: e.clientX, y: e.clientY, id: e.pointerId, eje: null,
            enFrente: !!e.target.closest('.hero-par[data-lugar="frente"]'),
            ultX: 0, ultT: performance.now(), vel: 0,
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
            if (a.eje === 'x') setPaso((caja.current?.offsetWidth || 400) * 0.48 * 0.6);
        }
        if (a.eje === 'x') {
            // velocidad suavizada de los últimos movimientos, para el aventón
            const ahora = performance.now(), dt = Math.max(1, ahora - a.ultT);
            const v = (mx - a.ultX) / dt;
            a.vel = a.vel ? a.vel * 0.3 + v * 0.7 : v;
            a.ultX = mx; a.ultT = ahora;
            movio.current = true; setDx(mx);
        }
        else if (a.eje === 'subir') { movio.current = true; setDy(Math.min(0, my)); }
    };
    const alSoltar = () => {
        const a = inicio.current;
        inicio.current = null;
        if (a?.eje === 'x') {
            const aventon = Math.abs(a.vel) > VELOCIDAD && Math.sign(a.vel) === Math.sign(dx) && Math.abs(dx) > 15;
            if (avanceDe(dx) >= AVANCE_MIN || aventon) ir(actual + (dx < 0 ? 1 : -1));
        } else if (a?.eje === 'subir' && dy <= -UMBRAL_SUBIR) {
            // sale volando hacia arriba y ya abre su ficha
            const id = pares[actual].id;
            if (sinMovimiento()) navigate(`/tenis/${id}`);
            else { setAbriendo(true); salida.current = setTimeout(() => navigate(`/tenis/${id}`), SALIDA_MS); }
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
                className={`hero-pares hero-pares-${Math.min(n, 3)}${dx ? ' arrastrando' : ''}${dy ? ' subiendo' : ''}${dy <= -UMBRAL_SUBIR ? ' listo-abrir' : ''}${abriendo ? ' abriendo' : ''}`}
                ref={caja}
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
                            style={estiloArrastre(k)}
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
