/* Prothe Shop · anuncio vertical ~25 s
 * HOOK → PROBLEMA → SOLUCIÓN → CÓMO → CIERRE → CTA. Ver STORYBOARD.md.
 * Mascota: "la Caja", una caja de tenis blanca con tapa azul marino (sale del logo).
 */
const NAVY = '#1B2A52', PAPEL = '#F8F7F4', CELESTE = '#A9B8DE';

// La Caja: cuerpo de caja, bracitos y dos tenis de perfil como pies (pies en y = 196).
const CAJA = {
  body: 'M14,44 Q110,41 206,44 Q210,44 210,48 L208,150 Q208,154 204,154 L16,155 Q12,155 12,151 L10,48 Q10,44 14,44 Z',
  armL: 'M12,92 L-14,92 Q-20,92 -20,98 L-20,112 Q-20,118 -14,118 L12,118 Z',
  armR: 'M208,92 L234,92 Q240,92 240,98 L240,112 Q240,118 234,118 L208,118 Z',
  legs: [0, 90].map(dx => `M${56 + dx},154 L${72 + dx},154 L${72 + dx},172 Q${88 + dx},174 ${94 + dx},182 Q${98 + dx},188 ${94 + dx},194 Q${92 + dx},196 ${86 + dx},196 L${38 + dx},196 Q${32 + dx},196 ${32 + dx},190 L${32 + dx},182 Q${32 + dx},174 ${42 + dx},172 L${56 + dx},172 Z`),
  eyes: [[78, 94], [142, 94]], mouth: [110, 128],
  pivotL: [12, 105], pivotR: [208, 105], handL: [-20, 105], handR: [240, 105],
  width: 220, height: 196, offsetX: 0, emoteAt: [236, 14],
};
// La tapa va aparte para que pueda brincar y salir volando.
const TAPA = 'M-4,12 Q110,8 224,12 Q230,12 230,18 L230,38 Q230,44 224,44 L-4,44 Q-10,44 -10,38 L-10,18 Q-10,12 -4,12 Z';

bootVideo(async (V) => {
  const { el, P, T, H, PAL, INK, draw, done, write, pop, comic, stamp, mover, jump, sfx,
          face, emote, arms, wave, blink, wink, hop, wiggle,
          mascot, drawMascot, popMascot, newScene, show, BG, TR, finale, setTool, onFrame, tl, S } = V;
  const { green: GREEN, red: RED, chalk: CHALK, chalkB: CHALK_B } = PAL;
  document.querySelector('#finaleBg rect').setAttribute('fill', NAVY);   // el mosaico final, en azul de la marca
  let t = 0;

  // ---- la Caja ----
  function caja(g, x, y, s, { ink = NAVY, theme = 'white', lidFill = H('navy'), lidInk = ink, ground = null, shadow = 'shadow' } = {}) {
    const m = mover(g, x, y, s);
    const c = mascot(m.g, 0, 0, 1, { theme, ink, ground, shadow });
    const lidG = el('g', {}, c.sq);
    c.lid = P(lidG, TAPA, { color: lidInk, w: 7.5, fill: lidFill });
    c.lidP = { x: 0, y: 0, r: 0 };
    onFrame(() => lidG.setAttribute('transform', `translate(${c.lidP.x.toFixed(2)} ${c.lidP.y.toFixed(2)}) rotate(${c.lidP.r.toFixed(2)} 110 28)`));
    c.m = m; c.s = s; c.x = x; c.y = y;
    return c;
  }
  const drawCaja = (c, at, dur = 1.0) => { drawMascot(c, at, dur); draw(c.lid, at + dur * 0.55, dur * 0.3, { sound: false }); };
  const popCaja = (c, at, o) => { done(c.lid); popMascot(c, at, o); };
  function brincaTapa(c, at, alto = 70, giro = -10) {
    tl.to(c.lidP, { y: -alto, r: giro, duration: S(0.16), ease: 'power2.out' }, S(at));
    tl.to(c.lidP, { y: 0, r: 0, duration: S(0.4), ease: 'bounce.out' }, S(at + 0.16));
    sfx('pop', at, { gain: 0.7 });
  }
  const ojoDer = c => ({ x: c.x + c.s * 142, y: c.y + c.s * 94 });

  // un tenis de perfil (≈306 × 122 a escala 1, esquina de arriba a la izquierda en x, y)
  function tenis(g, x, y, k, at, { color = INK, fill = 'none' } = {}) {
    const q = el('g', { transform: `translate(${x},${y}) scale(${k})` }, g);
    const w = 7 / k;
    const upper = P(q, 'M10,100 L10,40 Q10,28 24,28 L70,28 Q84,28 92,40 L120,62 Q170,70 230,74 Q290,78 296,100 Z', { color, w, fill });
    const sole = P(q, 'M4,100 L300,100 Q306,100 306,108 L306,114 Q306,122 298,122 L10,122 Q4,122 4,116 Z', { color, w, fill });
    const laces = P(q, 'M104,52 L128,44 M122,62 L148,52 M142,67 L166,58', { color, w });
    draw(upper, at, 0.45); draw(sole, at + 0.4, 0.2, { sound: false }); draw(laces, at + 0.55, 0.2, { sound: false });
    return q;
  }

  /* 1 · HOOK (papel + plumón) */
  const s1 = newScene('paper'); show(s1, 0); setTool('marker');
  let c1;
  { const g = s1.g, a = 0.1;
    write(T(g, 540, 480, '¿RÉPLICAS?', { size: 200, cls: 'bs' }), a + 0.1, 0.6);
    c1 = caja(g, 287, 600, 2.3);
    drawCaja(c1, a + 0.6, 0.9);
    face(c1, a + 1.8, 'lookU', { mouth: 'o', emote: '?' });
    face(c1, a + 2.7, 'determined', { mouth: 'flat' });
    stamp(g, 540, 1350, 'AQUÍ NO', a + 2.8, { color: RED, rot: -8, size: 170 });
    wiggle(c1, a + 3.1, 3);
    brincaTapa(c1, a + 3.7);
    t = a + 4.6;
  }
  const s2 = newScene('chalk', { filter: 'url(#chalk)' });
  t = TR.zoomInto(s1, s2, t, ojoDer(c1));

  /* 2 · PROBLEMA (pizarrón + gis) */
  setTool('chalk');
  { const g = s2.g, a = t;
    write(T(g, 540, 400, '¿Y SI TE LLEGA', { size: 130, color: CHALK, cls: 'bs' }), a + 0.2, 0.6);
    write(T(g, 540, 560, 'UNA RÉPLICA?', { size: 160, color: CHALK_B, cls: 'bs' }), a + 0.8, 0.6);
    tenis(g, 80, 700, 1.3, a + 1.5, { color: CHALK });
    tenis(g, 600, 700, 1.3, a + 1.9, { color: CHALK });
    comic(g, 280, 690, '?', a + 2.6, { color: CHALK_B, size: 150, rot: -8, life: 3.2, sound: 'boing' });
    comic(g, 800, 690, '?', a + 2.9, { color: CHALK_B, size: 150, rot: 8, life: 3.0, sound: false });
    const c = caja(g, 386, 1060, 1.4, { ink: CHALK, theme: null, lidFill: 'none', shadow: 'shadowW' });
    popCaja(c, a + 2.4);
    face(c, a + 3.0, 'sad', { mouth: 'frown', emote: 'sweat' });
    write(T(g, 540, 1560, 'así da miedo comprar en línea', { size: 64, color: CHALK, cls: 'kalam' }), a + 3.4, 1.0);
    face(c, a + 4.7, 'wide', { mouth: 'O' });
    t = a + 5.6;
  }
  const s3 = newScene('kraft');
  t = TR.eraser(s2, s3, t);

  /* 3 · SOLUCIÓN (cartón kraft + pincel) */
  setTool('brush');
  { const g = s3.g, a = t;
    write(T(g, 540, 450, 'AQUÍ SOLO HAY', { size: 130, cls: 'bs' }), a + 0.2, 0.6);
    write(T(g, 540, 690, 'ORIGINALES', { size: 210, cls: 'bs' }), a + 0.8, 0.7);
    const c = caja(g, 320, 800, 2.0);
    popCaja(c, a + 1.3);
    face(c, a + 1.8, 'happy', { mouth: 'smile' });
    // la tapa sale volando: la caja se abre
    tl.to(c.lidP, { x: 190, y: 70, r: 40, duration: S(0.25), ease: 'power2.out' }, S(a + 2.4));
    sfx('whoosh', a + 2.35, { gain: 0.8 });
    face(c, a + 2.5, 'star', { mouth: 'grin' });
    arms(c, a + 2.5, { L: 70, R: -70, dur: 0.2 });
    tl.to(c.lidP, { x: 0, y: 0, r: 0, duration: S(0.45), ease: 'bounce.out' }, S(a + 3.6));
    arms(c, a + 3.6, { L: 0, R: 0, dur: 0.25 });
    write(T(g, 540, 1400, 'pares originales, no réplicas', { size: 66, cls: 'kalam' }), a + 3.0, 1.0);
    hop(c, a + 4.3, 2);
    t = a + 5.3;
  }
  const s4 = newScene('notebook');
  t = TR.flip(s3, s4, t);

  /* 4 · CÓMO (cuaderno + lápiz): los tres pasos de la página */
  setTool('pencil');
  let ultimo;
  { const g = s4.g, a = t;
    write(T(g, 560, 330, 'ASÍ DE FÁCIL', { size: 140, cls: 'bs' }), a + 0.2, 0.6);
    const c = caja(g, 364, 1170, 1.6);
    popCaja(c, a + 0.7);
    ['Escoges tu talla', 'Apartas por WhatsApp', 'Te llega a donde estés'].forEach((w, k) => {
      const y = 610 + k * 170;
      draw(P(g, `M140,${y - 56} L198,${y - 56} L198,${y + 2} L140,${y + 2} Z`, { w: 6 }), a + 0.9 + k * 0.45, 0.14, { sound: false });
      write(T(g, 236, y, w, { size: 78, anchor: 'start', cls: 'kalam' }), a + 1.0 + k * 0.45, 0.4);
      draw(P(g, `M147,${y - 26} L168,${y - 3} L212,${y - 66}`, { color: GREEN, w: 12 }), a + 2.7 + k * 0.5, 0.16, { sound: false });
      sfx('tick', a + 2.7 + k * 0.5); hop(c, a + 2.75 + k * 0.5, 1);
      if (k === 2) ultimo = { x: 170, y: y - 27 };
    });
    face(c, a + 2.6, 'happy', { mouth: 'grin' });
    face(c, a + 4.3, 'star', { mouth: 'grin', emote: 'sparkle' });
    t = a + 5.2;
  }
  const s5 = newScene(BG.sunburst('#2C4278', '#35508F'));
  t = TR.iris(s4, s5, t, ultimo);

  /* 5 · CIERRE (rayos azules, texto que rebota): la Caja sale corriendo a la calle */
  setTool(null);
  { const g = s5.g, a = t;
    pop(T(g, 540, 520, 'DE LA CAJA', { size: 190, color: PAPEL, cls: 'bs' }), a + 0.1);
    pop(T(g, 540, 730, 'A LA CALLE', { size: 210, color: CELESTE, cls: 'bs' }), a + 0.6, { rot: -4 });
    const c = caja(g, -520, 880, 2.0);
    popCaja(c, a + 0.9, { sound: false });
    face(c, a + 0.9, 'determined', { mouth: 'grin', take: false });
    tl.to(c.m, { x: 320, duration: S(0.7), ease: 'power3.out' }, S(a + 1.0));
    sfx('steps', a + 1.0, { dur: 0.7 });
    comic(g, 230, 1000, '¡FIUUU!', a + 1.2, { color: PAPEL, size: 110, rot: -10, sound: 'whoosh' });
    face(c, a + 1.9, 'happy', { mouth: 'grin', emote: 'sparkle' });
    brincaTapa(c, a + 2.1, 60, 8);
    pop(T(g, 540, 1480, 'envíos a todo México', { size: 72, color: PAPEL, cls: 'kalam' }), a + 2.2, { rot: 0, sound: 'ding' });
    hop(c, a + 3.0, 2);
    t = a + 4.2;
  }

  /* FINAL + CTA */
  t = finale(t, {
    cta: (layer, at) => {
      const c = caja(layer, 770, 1322, 0.8, { shadow: 'shadowW', lidFill: H('celeste') });
      popCaja(c, at + 1.6); face(c, at + 2.2, 'happy', { mouth: 'grin' }); hop(c, at + 2.5, 5, false);
      brincaTapa(c, at + 3.2, 40, -8);
      pop(T(layer, 450, 1480, 'SÍGUENOS EN', { size: 104, color: PAPEL, cls: 'bs' }), at + 1.9, { sound: 'ding' });
      pop(T(layer, 540, 1620, '@theprotheshop', { size: 124, color: CELESTE, cls: 'bs' }), at + 2.4, { rot: -2, sound: 'blip' });
    },
  });
  return t;
}, {
  speed: 0.75,
  palette: { ink: NAVY, blue: '#2C4278' },
  hatches: { navy: ['#1B2A52', '#2C4278'], celeste: ['#A9B8DE', '#7F93C6'] },
  mascotShape: CAJA,
  mascotTheme: 'white',
  fontLoads: ['700 100px Caveat', '400 60px Kalam', '500 40px "JetBrains Mono"', '900 100px "Big Shoulders Display"'],
});
