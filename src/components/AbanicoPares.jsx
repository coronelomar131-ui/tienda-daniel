import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ProductPhoto from './ProductPhoto';
import { hayTransicion, marcarFoto } from '../lib/transicion';

// El abanico de la portada: siempre se ven tres pares (uno al frente y dos
// atrás, inclinados), pero se desliza para ir pasando todos. Nada se mueve
// solo: sólo responde al dedo.
//
// Cómo se mueve: el abanico tiene una posición continua (pos, en pares) y cada
// tarjeta se pinta según qué tan lejos está del frente. Al arrastrar, pos va
// 1 a 1 con el dedo; al soltar, un resorte la lleva al par más cercano a donde
// iba a caer con la velocidad que traía, así que un aventón corto también pasa
// de par y el abanico llega con el impulso del dedo, no con una duración fija.
// Todo se escribe directo en el DOM en cada cuadro (sin volver a dibujar con
// React) y las tarjetas se inclinan con la velocidad y se levantan al
// agarrarlas: se sienten como cartas, no como diapositivas.
//
// Tocar la del frente abre su ficha; tocar una de atrás la trae al frente.
// Subir la del frente con el dedo también abre su ficha: la tarjeta sube con
// el dedo y avisa "Suelta para ver el par". Ojo: subir el dedo es también como
// se baja por la página, por eso sólo la del frente lo atrapa (empezando en
// cualquier otro lado la página baja normal) y hay que subirla bastante; si se
// suelta antes, regresa y no abre nada.
//
// Al abrir, la foto del par crece hasta ser la foto grande de su ficha (ver
// lib/transicion.js).

const RIGIDEZ = 210;       // el resorte: qué tan fuerte jala hacia su lugar
const FRICCION = 24;       // y qué tanto frena (poco menos que sin rebote: asienta con un solo vaivén chiquito)
const PROYECCION = 0.14;   // s: a dónde caería el abanico con la velocidad del aventón
const AVENTON = 2;         // pares/s (≈ 0.4 px/ms): más rápido que esto ya es aventón
const AVANCE_MIN = 0.3;    // fracción del recorrido para cambiar de par al soltar
const SALIDA_MS = 200;     // lo que tarda el par en salir volando antes de abrir su ficha
const UMBRAL_SUBIR = 110;  // px hacia arriba para abrir el par
const TOLERANCIA = 8;      // px a partir de los cuales ya es arrastre y no toque

// Los lugares del abanico (x, y en % de la tarjeta; g en grados). Las de en
// medio mezclan los dos lugares entre los que van.
const FRENTE = { x: 2,   y: 4,   g: -1.5, s: 1.04, a: 1 };
const IZQ    = { x: -58, y: -11, g: -10,  s: 0.96, a: 1 };
const DER    = { x: 56,  y: -25, g: 9,    s: 0.96, a: 1 };
const ATRAS  = { x: 0,   y: -8,  g: 0,    s: 0.82, a: 0 };
const FRENTE_DOS = { ...FRENTE, x: -22 };
const DER_DOS    = { ...DER, x: 34, y: -18 };
const SOLO       = { ...FRENTE, x: 0, s: 1.14 };

const mezclar = (a, b, p) => ({
    x: a.x + (b.x - a.x) * p, y: a.y + (b.y - a.y) * p, g: a.g + (b.g - a.g) * p,
    s: a.s + (b.s - a.s) * p, a: a.a + (b.a - a.a) * p,
});
const entre = (v, min, max) => Math.min(max, Math.max(min, v));
const modulo = (i, n) => ((i % n) + n) % n;
const sinMovimiento = () => !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// Dónde va una tarjeta que está a "o" pares del frente (negativo: a la izquierda).
function lugarEn(o, n) {
    if (n === 1) return SOLO;
    const a = Math.abs(o);
    if (n === 2) return mezclar(FRENTE_DOS, DER_DOS, Math.min(1, a));
    const lado = o < 0 ? IZQ : DER;
    if (a <= 1) return mezclar(FRENTE, lado, a);
    const oculto = Math.min(2, n / 2);   // a esta distancia ya va escondida atrás
    return mezclar(lado, ATRAS, Math.min(1, (a - 1) / (oculto - 1)));
}

// Para aria y el foco: qué lugar le toca a cada una con el par del frente.
function lugarDe(k, actual, n) {
    if (n === 1) return 'frente';
    const d = modulo(k - actual, n);
    if (d === 0) return 'frente';
    if (d === 1) return 'derecha';
    if (d === n - 1 && n > 2) return 'izquierda';
    return 'oculto';
}

const AbanicoPares = ({ pares }) => {
    const [actual, setActual] = useState(0);
    const caja = useRef(null);
    const tarjetas = useRef([]);
    const gesto = useRef(null);
    const movio = useRef(false);
    const salida = useRef(null);
    // El estado del movimiento vive fuera de React: cambia en cada cuadro.
    const m = useRef({
        pos: 0, vel: 0, meta: 0, levanta: 0, alzar: 0, encima: false,
        dy: 0, vdy: 0, sube: 0, sale: false, salio: 0, salioDesde: 0, raf: 0, ultimo: 0, actual: 0,
        congela: false,
    });
    const navigate = useNavigate();
    const n = pares.length;

    const pintar = () => {
        const s = m.current;
        const inclina = entre(s.vel / 6, -1, 1);
        const avance = Math.min(1, -s.dy / UMBRAL_SUBIR);
        const salio = s.salio;

        for (let k = 0; k < n; k++) {
            const el = tarjetas.current[k];
            if (!el) continue;
            const o = modulo(k - s.pos + n / 2, n) - n / 2;
            const a = Math.abs(o);
            const cerca = Math.max(0, 1 - a);
            const L = lugarEn(o, n);
            // al cruzarse, las dos que cambian de lugar se levantan y se
            // achican un poco: pasan una por encima de la otra, no se atraviesan
            const arco = n > 1 ? Math.sin(Math.PI * Math.min(1, a)) : 0;
            let y = L.y - arco * 3 - s.levanta * 1.5 * cerca;
            let g = L.g - inclina * 6 * (0.4 + 0.6 * cerca);
            let esc = L.s - arco * 0.025 + s.levanta * 0.035 * cerca;
            let alfa = L.a;
            let dy = 0, sombra = s.levanta * cerca;
            if (k === s.sube && (s.dy || s.sale)) {
                dy = s.dy * 0.5;   // sube a la mitad que el dedo: con resistencia
                g *= 1 - avance;
                esc += avance * 0.05;
                sombra = Math.max(sombra, avance);
                y -= salio * 55; esc += salio * 0.08; alfa *= 1 - salio;
            }
            el.style.transform = `translate(-50%, -50%) translate(${L.x}%, ${y}%) translateY(${dy}px) rotate(${g}deg) scale(${esc})`;
            el.style.opacity = alfa;
            el.style.zIndex = Math.round(50 - a * 10);
            el.style.pointerEvents = alfa < 0.1 ? 'none' : '';
            el.style.setProperty('--dato', entre(1 - a * 1.8, 0, 1));
            el.style.setProperty('--sombra', entre(sombra, 0, 1));

        }

        const c = caja.current;
        if (c) {
            c.classList.toggle('subiendo', s.dy < -1);
            c.classList.toggle('listo-abrir', s.dy <= -UMBRAL_SUBIR);
            c.style.setProperty('--avance', Math.max(0, avance));
        }
        const i = modulo(Math.round(s.pos), n);
        if (i !== s.actual) { s.actual = i; setActual(i); }
    };

    const cuadro = (t) => {
        const s = m.current, gs = gesto.current;
        if (s.congela) { s.raf = 0; return; }   // la foto ya va camino a su ficha: que nada la mueva
        const dt = s.ultimo ? Math.min(0.032, Math.max(0.001, (t - s.ultimo) / 1000)) : 1 / 60;
        s.ultimo = t;
        if (s.sale && !s.salioDesde) s.salioDesde = t;
        s.salio = s.sale ? Math.min(1, (t - s.salioDesde) / SALIDA_MS) ** 2 : 0;
        const arrastraX = gs?.eje === 'x', arrastraY = gs?.eje === 'subir';

        if (arrastraX) {
            // dedo quieto: la inclinación se va apagando
            if (t - gs.ultT > 40) s.vel *= Math.exp(-dt * 12);
        } else if (sinMovimiento()) {
            s.pos = s.meta; s.vel = 0;
        } else {
            // dos pasos por cuadro para que el resorte no dependa de los fps
            for (let j = 0; j < 2; j++) {
                const h = dt / 2;
                s.vel += (-RIGIDEZ * (s.pos - s.meta) - FRICCION * s.vel) * h;
                s.pos += s.vel * h;
            }
        }
        if (!arrastraY && !s.sale) {
            for (let j = 0; j < 2; j++) {
                const h = dt / 2;
                s.vdy += (-RIGIDEZ * s.dy - FRICCION * s.vdy) * h;
                s.dy += s.vdy * h;
            }
        }
        s.levanta += (s.alzar - s.levanta) * (1 - Math.exp(-dt * 16));
        pintar();

        const quieto = !gs && !s.sale
            && Math.abs(s.pos - s.meta) < 0.0005 && Math.abs(s.vel) < 0.005
            && Math.abs(s.dy) < 0.2 && Math.abs(s.vdy) < 1
            && Math.abs(s.levanta - s.alzar) < 0.002;
        if (quieto) {
            s.pos = s.meta; s.vel = 0; s.dy = 0; s.vdy = 0; s.levanta = s.alzar;
            pintar();
            s.raf = 0;
            return;
        }
        s.raf = requestAnimationFrame(cuadro);
    };

    const arrancar = () => {
        const s = m.current;
        if (s.raf) return;
        s.ultimo = 0;
        s.raf = requestAnimationFrame(cuadro);
    };

    const irA = (meta) => { m.current.meta = meta; arrancar(); };
    // al par k por el camino corto
    const irAlPar = (k) => {
        const s = m.current;
        const d = modulo(k - Math.round(s.meta) + Math.floor(n / 2), n) - Math.floor(n / 2);
        irA(Math.round(s.meta) + d);
    };

    useLayoutEffect(() => { pintar(); });   // cada vez que React dibuja, las tarjetas quedan en su lugar
    useEffect(() => () => { cancelAnimationFrame(m.current.raf); clearTimeout(salida.current); }, []);

    // Abre la ficha del par k. Con transición, su foto crece hasta ser la de la
    // ficha; sin ella (navegador viejo o "menos animación"), la página cambia.
    const abrir = (k) => {
        const ruta = `/tenis/${pares[k].id}`;
        if (!hayTransicion()) { navigate(ruta); return; }
        marcarFoto(tarjetas.current[k]?.querySelector('.hero-par-foto'));
        navigate(ruta, { viewTransition: true });
    };

    const alBajar = (e) => {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        gesto.current = {
            x: e.clientX, y: e.clientY, id: e.pointerId, eje: null,
            enFrente: !!e.target.closest('.hero-par[data-lugar="frente"]'),
            pos0: 0, paso: 200, ultX: 0, ultT: e.timeStamp,
        };
        movio.current = false;
    };

    const alMover = (e) => {
        const gs = gesto.current, s = m.current;
        if (!gs || gs.id !== e.pointerId) return;
        const mx = e.clientX - gs.x, my = e.clientY - gs.y;
        // Hasta saber hacia dónde va el dedo no se decide nada. De lado: pasar
        // de par. Hacia arriba empezando en la del frente: abrirla. Cualquier
        // otra cosa es scroll de la página y no se le estorba.
        if (gs.eje === null && Math.hypot(mx, my) > TOLERANCIA) {
            if (Math.abs(mx) > Math.abs(my)) gs.eje = n > 1 ? 'x' : 'nada';
            else gs.eje = (my < 0 && gs.enFrente) ? 'subir' : 'nada';
            if (gs.eje !== 'nada') e.currentTarget.setPointerCapture?.(e.pointerId);
            if (gs.eje === 'x') {
                // lo que recorre la del frente hasta el lugar de al lado, en px
                gs.paso = (tarjetas.current[0]?.offsetWidth || 200) * 0.57;
                // se agarra donde vaya el abanico, aunque venga moviéndose
                gs.pos0 = s.pos + mx / gs.paso;
                gs.ultX = mx; gs.ultT = e.timeStamp;
                s.vel = 0; s.alzar = 1;
            }
            if (gs.eje === 'subir') s.sube = modulo(Math.round(s.meta), n);
        }
        if (gs.eje === 'x') {
            const ahora = e.timeStamp, dt = Math.max(1, ahora - gs.ultT);
            const v = -((mx - gs.ultX) / gs.paso) / (dt / 1000);   // pares por segundo
            s.vel = s.vel * 0.3 + v * 0.7;
            gs.ultX = mx; gs.ultT = ahora;
            s.pos = gs.pos0 - mx / gs.paso;
            movio.current = true;
            arrancar();
        } else if (gs.eje === 'subir') {
            s.dy = Math.min(0, my);
            s.vdy = 0;
            movio.current = true;
            arrancar();
        }
    };

    const alSoltar = (e) => {
        const gs = gesto.current, s = m.current;
        if (!gs || gs.id !== e.pointerId) return;
        gesto.current = null;
        s.alzar = s.encima ? 0.5 : 0;
        if (gs.eje === 'x') {
            // dedo quieto antes de soltar: no hay aventón
            if (e.timeStamp - gs.ultT > 80) s.vel = 0;
            // sólo un aventón de verdad lleva impulso; arrastrar despacio no
            const impulso = Math.abs(s.vel) > AVENTON ? s.vel : 0;
            const cae = s.pos + impulso * PROYECCION;
            let meta = Math.round(cae);
            const desde = Math.round(gs.pos0);
            if (meta === desde && Math.abs(cae - gs.pos0) > AVANCE_MIN) meta = desde + Math.sign(cae - gs.pos0);
            s.meta = entre(meta, Math.floor(s.pos) - 1, Math.ceil(s.pos) + 1);
        } else if (gs.eje === 'subir' && s.dy <= -UMBRAL_SUBIR) {
            if (hayTransicion() || sinMovimiento()) {
                // la foto se queda donde el dedo la soltó y desde ahí crece hasta su ficha
                s.congela = true;
                cancelAnimationFrame(s.raf); s.raf = 0;
                abrir(s.sube);
                return;
            }
            // sin transición: sale volando hacia arriba y ya abre su ficha
            s.sale = true;
            salida.current = setTimeout(() => abrir(s.sube), SALIDA_MS + 20);
        }
        arrancar();
    };

    // En compu, la del frente se levanta un poco con el cursor encima
    const alEntrar = (e, k) => {
        if (e.pointerType !== 'mouse' || k !== m.current.actual) return;
        m.current.encima = true;
        if (!gesto.current) { m.current.alzar = 0.5; arrancar(); }
    };
    const alSalir = () => {
        m.current.encima = false;
        if (!gesto.current) { m.current.alzar = 0; arrancar(); }
    };

    const alTocar = (e, k) => {
        e.preventDefault();
        if (movio.current) { movio.current = false; return; }
        if (k === m.current.actual) abrir(k);
        else irAlPar(k);
    };

    const alTecla = (e) => {
        if (e.key === 'ArrowRight') { e.preventDefault(); irA(Math.round(m.current.meta) + 1); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); irA(Math.round(m.current.meta) - 1); }
    };

    return (
        <div className="hero-pares-wrap">
            <div
                className="hero-pares"
                ref={caja}
                onPointerDown={alBajar}
                onPointerMove={alMover}
                onPointerUp={alSoltar}
                onPointerCancel={alSoltar}
                onKeyDown={alTecla}
                aria-roledescription="carrusel"
                aria-label="Pares de la tienda"
            >
                {pares.map((par, k) => {
                    const lugar = lugarDe(k, actual, n);
                    return (
                        <Link
                            key={par.id}
                            ref={(el) => { tarjetas.current[k] = el; }}
                            to={`/tenis/${par.id}`}
                            className="hero-par"
                            data-lugar={lugar}
                            tabIndex={lugar === 'frente' ? 0 : -1}
                            aria-hidden={lugar === 'oculto' ? 'true' : undefined}
                            aria-label={lugar === 'frente' ? `${par.name}, $${par.price.toLocaleString('es-MX')}` : `Ver ${par.name}`}
                            onClick={(e) => alTocar(e, k)}
                            onPointerEnter={(e) => alEntrar(e, k)}
                            onPointerLeave={alSalir}
                            draggable={false}
                        >
                            <span className="hero-par-foto"><ProductPhoto product={par} completa /></span>
                            {lugar === 'frente' && (
                                <span className="hero-par-subir" aria-hidden="true">
                                    <span className="subir-antes">Sube para ver el par</span>
                                    <span className="subir-listo">Suelta para ver el par</span>
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
                            onClick={() => irAlPar(k)}
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
