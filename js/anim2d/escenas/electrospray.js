// Ionización por electrospray (ESI) en modo positivo. Corte esquemático, no a escala: las gotas se dibujan enormemente ampliadas.
// Se sigue una gota "protagonista": nace en el chorro del cono de Taylor, pierde disolvente con el gas caliente, alcanza el límite de
// Rayleigh, sufre una fisión coulombiana y sus gotitas hijas liberan iones [M+H]⁺ que el campo y el flujo de gas llevan a la entrada.
// Todo se dibuja como función de t (sin estado) y el fondo (spray continuo) es periódico en `dur`, así que el bucle no salta.
//
// Parámetros (p):
//   variante  'esi' (sonda ESI calefactada con pulverización ortogonal, Shimadzu) · 'jetstream' (Agilent Jet Stream, gas envolvente
//             de N₂ sobrecalentado) · 'nano' (nanoESI CaptiveSpray de Bruker, emisor en el eje) · 'esi-capilar' (nebulizador ESI
//             ortogonal frente a un capilar de vidrio, Bruker)
//   tension   texto de la diferencia de potencial entre emisor y entrada ('1–4 kV', '2–4 kV', '1,5–1,7 kV'…)
//   hv        'emisor' | 'entrada' | null: pieza que se rotula como «alta tensión» (null = solo se indica la diferencia ΔV)
//   sonda, entrada, pared, desague   rótulos de las piezas;  entradaTxt  la entrada en el texto («la línea de desolvatación»)
//   temp      temperatura del gas caliente para el rótulo (p. ej. '≈ 350 °C'); sin valor no se muestra ninguna cifra
//   gasCalor  rótulo del gas que calienta la pluma (solo 'esi'; por defecto «Gas de calentamiento (aire)»)
//   caudal    texto del caudal en 'nano' ('cientos de nL/min');  deflexion  true si tras el capilar hay una placa de deflexión de 90°
import { tramo, suave, easeOut, lerp, azar, clamp } from '../dibujo.js';
import { frac, bezier, flujo, rotuloGuia, calor } from './_util-fuentes.js';

const VARIANTES = {
  esi: {
    titulo: 'Ionización por electrospray', sonda: 'Sonda ESI', tension: '1–4 kV', hv: 'emisor',
    entrada: 'Línea de desolvatación (DL)', entradaTxt: 'la línea de desolvatación', pared: 'Bloque calefactor', desague: 'Desagüe', geo: 'orto',
  },
  jetstream: {
    titulo: 'Electrospray Agilent Jet Stream', sonda: 'Nebulizador Jet Stream', tension: '2–4 kV', hv: null, temp: '≈ 350 °C',
    entrada: 'Capilar', entradaTxt: 'el capilar de muestreo', pared: 'Escudo de spray', desague: 'Salida de gases', geo: 'orto',
  },
  nano: {
    titulo: 'Nanoelectrospray (CaptiveSpray)', sonda: 'Emisor CaptiveSpray', tension: '1,5–1,7 kV', hv: null, caudal: 'cientos de nL/min',
    entrada: 'Capilar de vidrio', entradaTxt: 'el capilar de vidrio', pared: 'Entrada del capilar', geo: 'axial',
  },
  'esi-capilar': {
    titulo: 'Ionización por electrospray', sonda: 'Nebulizador ESI', tension: 'varios kV', hv: null,
    entrada: 'Capilar de vidrio', entradaTxt: 'el capilar de vidrio', pared: 'Placa terminal', desague: 'Salida de gases', geo: 'orto',
  },
};

export default function crear(p = {}) {
  const tipo = VARIANTES[p.variante] ? p.variante : 'esi';
  const V = { ...VARIANTES[tipo], ...Object.fromEntries(Object.entries(p).filter(([, v]) => v !== undefined)) };
  const orto = V.geo === 'orto';
  const nano = tipo === 'nano';
  const dur = 18;

  /* ---------- geometría ---------- */
  // orto: la sonda pulveriza de arriba abajo y la entrada es horizontal, a 90°; axial: el emisor apunta a la entrada.
  const G = orto
    ? { TX: 190, TY: 104, OX: 450, OY: 200, s0: 118, sMax: 218, abre: tipo === 'jetstream' ? 0.25 : 0.36 }
    : { TX: 150, TY: 180, OX: 430, OY: 180, s0: 162, sMax: 252, abre: 0.3 };
  // punto de la pluma a una distancia s del vértice y desplazamiento lateral l
  const P = (s, l) => (orto ? [G.TX + l, G.s0 + s] : [G.s0 + s, G.TY + l]);
  const ancho = (s) => 4 + s * G.abre;

  /* ---------- gota protagonista ---------- */
  const Q0 = 10;                                  // cargas dibujadas
  const r0 = nano ? 13 : 18;                      // radio inicial (dibujo)
  const k0 = nano ? 0.7 : 0.544;                  // q/q_Rayleigh inicial: las gotas de nanoESI nacen más cerca del límite
  const rR = r0 * Math.pow(k0, 2 / 3);            // radio al que q = q_R (q_R ∝ r^1,5)
  const T = { nace: 1.2, ev: 2.6, fis: 7.2, fis2: 8.1, hijas: 10.4, ion: 10.7, suelta: 11.5, ori: 15.6, fin: 17.3 };
  const ruta = orto
    ? { a: [G.TX, 130], b: [G.TX + 12, 196], padre: [G.TX + 32, 334], h1: [G.TX + 74, 176], h2: [G.TX + 80, 204] }
    : { a: [168, G.TY], b: [290, G.TY], padre: [362, 290], h1: [342, G.TY - 24], h2: [350, G.TY + 20] };
  const dirFis = orto ? -0.25 : 0;               // ángulo en que la gota expulsa las gotitas hijas

  /* ---------- partículas de fondo (periódicas en dur) ---------- */
  const R = azar(31);
  const gotas = Array.from({ length: 36 }, () => ({ k: 3 + Math.floor(R() * 3), f: R(), l: R() - 0.5, r: 2 + R() * 2.6, w: R() * 6 }));
  const iones = Array.from({ length: 9 }, (_, i) => ({ k: 4 + (i % 3), f: i / 9 + R() * 0.05, s: 40 + R() * 70, l: (R() - 0.3) * 30 }));
  const vapor = Array.from({ length: 12 }, (_, i) => ({ k: 3 + (i % 2), f: i / 12, s: 20 + R() * 80, l: (R() - 0.5) * 30, rot: R() * 6 }));
  const evap = Array.from({ length: 12 }, (_, j) => ({ te: T.ev + j * 0.38, a: R() * Math.PI * 2 }));

  /* ---------- textos ---------- */
  const DV = `ΔV ≈ ${V.tension}`;
  const textos = {
    esi: [
      `El eluyente llega a la punta del capilar de la sonda, a alta tensión (${V.tension}). El campo deforma el líquido en un cono de Taylor; de su vértice sale un chorro fino que, ayudado por el gas nebulizador (N₂), se rompe en gotas con exceso de carga positiva.`,
      'El gas de calentamiento (aire seco) evapora el disolvente de las gotas. Al encogerse, la gota conserva su carga: la misma carga se reparte en una superficie cada vez menor y la repulsión entre las cargas aumenta.',
    ],
    jetstream: [
      `El eluyente sale por la aguja del nebulizador. Una diferencia de potencial de ${V.tension} entre la aguja y la entrada deforma el líquido en un cono de Taylor; su chorro, roto por el gas nebulizador (N₂), forma gotas con exceso de carga positiva.`,
      `Un gas envolvente de N₂ ${V.temp ? 'a ' + V.temp.replace('≈', 'unos').trim() + ' ' : 'sobrecalentado '}rodea el spray, lo confina en una zona caliente y acelera la evaporación del disolvente. La gota se encoge pero conserva su carga, así que la repulsión entre sus cargas aumenta.`,
    ],
    nano: [
      `El eluyente de la nano-LC, a ${V.caudal || 'nL/min'}, llega a un emisor muy fino. Con ${V.tension} entre el emisor y la entrada se forma un cono de Taylor diminuto, que emite gotas cargadas mucho más pequeñas que las del electrospray convencional.`,
      `El gas de secado (N₂)${V.temp ? ', a ' + V.temp + ',' : ''} evapora el disolvente; un flujo de gas en vórtice estabiliza el spray. La gota se encoge pero conserva su carga, de modo que la repulsión entre sus cargas aumenta.`,
    ],
    'esi-capilar': [
      `El eluyente sale por la aguja del nebulizador. Una diferencia de potencial de ${V.tension} entre la aguja y la entrada deforma el líquido en un cono de Taylor; su chorro, roto por el gas nebulizador (N₂), forma gotas con exceso de carga positiva.`,
      'El gas de secado caliente (N₂), que sale de la placa terminal hacia el spray, evapora el disolvente. La gota se encoge pero conserva su carga, de modo que la repulsión entre sus cargas aumenta.',
    ],
  }[tipo];
  const fisTxt = nano
    ? 'Al llegar al límite de Rayleigh, la repulsión entre cargas vence a la tensión superficial y la gota expulsa gotitas hijas: pierde en torno al 2 % de su masa y al 15 % de su carga. Como las gotas de nanoESI nacen pequeñas, bastan menos fisiones.'
    : 'Cuando la repulsión entre cargas iguala a la tensión superficial (límite de Rayleigh), la gota se vuelve inestable y expulsa gotitas hijas: pierde solo en torno al 2 % de su masa, pero cerca del 15 % de su carga. El proceso se repite en cada generación.';
  const entraTxt = orto
    ? `Los iones siguen el campo eléctrico y el flujo de gas hacia ${V.entradaTxt}, que los lleva al vacío. Como la pulverización es ortogonal y el gas de secado sale a contracorriente, las gotas grandes y casi todo el disolvente no entran.`
    : `Los iones, arrastrados por el campo y por el gas que aspira la entrada, pasan por ${V.entradaTxt} hacia el vacío, donde se completa la desolvatación.${V.deflexion ? ' Allí una placa desvía los iones 90°; las gotas y los neutros siguen recto.' : ''}`;

  return {
    titulo: V.titulo,
    dur,
    fases: [
      { t: 0, texto: textos[0] },
      { t: 3.2, texto: textos[1] },
      { t: 7, texto: fisTxt },
      { t: 10.4, texto: 'En las gotitas más pequeñas, de pocos nanómetros, el campo en la superficie es tan intenso que los iones del analito pasan a la fase gaseosa (evaporación iónica). Las proteínas quedan libres al evaporarse la gota entera. Predominan iones como [M+H]⁺.' },
      { t: 13.6, texto: entraTxt },
    ],
    dibujar(g, t) {
      const C = g.C;
      const ctx = g.ctx;

      /* ===== entrada del espectrómetro ===== */
      if (orto) {
        const calef = tipo === 'esi';
        g.rect(G.OX, 64, 20, G.OY - 6 - 64, { fill: calef ? C.calor : C.metal, alpha: calef ? 0.28 : 1, stroke: C.metalOsc, lw: 0.8, r: 2 });
        g.rect(G.OX, G.OY + 6, 20, 318 - G.OY - 6, { fill: calef ? C.calor : C.metal, alpha: calef ? 0.28 : 1, stroke: C.metalOsc, lw: 0.8, r: 2 });
        if (calef) { g.rect(G.OX + 3, 66, 14, G.OY - 74, { fill: C.metal, r: 2 }); g.rect(G.OX + 3, G.OY + 8, 14, 308 - G.OY, { fill: C.metal, r: 2 }); }
      } else {
        g.rect(G.OX, G.OY - 60, 12, 54, { fill: C.metal, stroke: C.metalOsc, lw: 0.8, r: 2 });
        g.rect(G.OX, G.OY + 6, 12, 54, { fill: C.metal, stroke: C.metalOsc, lw: 0.8, r: 2 });
      }
      const x0c = G.OX + (orto ? 20 : 12);
      g.rect(x0c, G.OY - 10, 640 - x0c, 20, { fill: C.metal, stroke: C.metalOsc, lw: 0.8 });
      g.rect(x0c, G.OY - 3.5, 640 - x0c, 7, { fill: C.vacio });
      g.flecha(570, G.OY - 22, 628, G.OY - 22, { color: C.tenue, lw: 1.2 });
      g.texto('Hacia el vacío', 628, G.OY - 34, { size: 11, color: C.tenue, align: 'right' });
      g.rotulo(V.entrada, 545, G.OY + 24, { size: 12 });
      g.rotulo(V.pared, orto ? G.OX + 10 : G.OX + 6, orto ? 52 : G.OY - 74, { size: 12 });
      if (V.hv === 'entrada') g.texto('Alta tensión', G.OX + 10, orto ? 330 : G.OY + 52, { size: 9.5, color: C.acento, align: 'center', weight: 700 });

      /* ===== líneas de campo y ΔV ===== */
      const tip = orto ? [G.TX, G.TY + 13] : [G.TX + 13, G.TY];
      const destinos = orto ? [[G.OX, G.OY - 70], [G.OX, G.OY], [G.OX, G.OY + 70]] : [[G.OX, G.OY - 50], [G.OX, G.OY], [G.OX, G.OY + 50]];
      const ctrls = orto ? [[330, 90], [320, 160], [300, 260]] : [[290, 70], [290, G.OY], [290, 290]];
      destinos.forEach((d, i) => {
        const pts = []; for (let k = 0; k <= 1.0001; k += 0.05) pts.push(bezier(tip, ctrls[i], d, k));
        g.linea(pts, { color: C.campo, lw: 1, dash: [4, 5], alpha: 0.8 });
      });
      g.rotulo(DV, orto ? 340 : 290, orto ? 104 : 98, { size: 12, color: C.acento });

      /* ===== gases ===== */
      if (orto) {
        // gas de secado a contracorriente desde la pared de entrada
        const sec = tipo === 'jetstream' || tipo === 'esi-capilar' || tipo === 'esi';
        if (sec) {
          flujo(g, [[G.OX - 2, G.OY - 12], [G.OX - 36, G.OY - 18], [G.OX - 62, G.OY - 48]], t, { color: C.gas, n: 3, vel: 0.5, largo: 0.18 });
          flujo(g, [[G.OX - 2, G.OY + 12], [G.OX - 36, G.OY + 18], [G.OX - 62, G.OY + 48]], t + 0.3, { color: C.gas, n: 3, vel: 0.5, largo: 0.18 });
          if (tipo !== 'esi') for (let i = 0; i < 2; i++) calor(g, G.OX - 30, G.OY + (i ? 26 : -26), t + i, { dx: -1, dy: 0, largo: 20, alpha: 0.5 });
          g.rotulo(tipo === 'esi' ? 'Gas de secado (N₂)' : 'Gas de secado (N₂) caliente', G.OX - 66, G.OY + 66, { size: 11 });
        }
      } else {
        for (let i = 0; i < 3; i++) calor(g, G.OX - 8, G.OY - 44 + i * 44, t + i * 0.7, { dx: -1, dy: 0, largo: 18, alpha: i === 1 ? 0 : 0.55 });
        g.rotulo('Gas de secado caliente', G.OX - 4, G.OY + 78, { size: 11 });
      }

      /* ===== pluma de fondo: gotas que se encogen ===== */
      const fondoPluma = [];
      for (let s = 0; s <= G.sMax; s += 12) fondoPluma.push(P(s, -ancho(s)));
      for (let s = G.sMax; s >= 0; s -= 12) fondoPluma.push(P(s, ancho(s)));
      g.linea(fondoPluma, { fill: C.liquido, alpha: 0.07, cerrar: true });
      for (const d of gotas) {
        const u = frac((t * d.k) / dur + d.f);
        const s = 14 + u * (G.sMax - 14);
        const [x, y] = P(s, d.l * 2 * ancho(s) * 0.85 + Math.sin(u * 9 + d.w) * 2);
        if (!orto && x > G.OX - 24) continue;
        g.gota(x, y, d.r * (1 - 0.6 * u), { alpha: 0.38 * Math.min(1, u * 6, (1 - u) * 6) });
      }
      // vapor de disolvente: se aleja de la pluma; en la geometría ortogonal el gas a contracorriente lo aparta de la entrada
      for (const m of vapor) {
        const u = frac((t * m.k) / dur + m.f);
        const a = P(m.s, m.l);
        let x, y;
        if (orto) { [x, y] = bezier(a, [G.OX - 30, a[1] - 10], [G.OX - 80, 320], u); } else { [x, y] = bezier(a, [G.OX - 70, a[1] + (m.l > 0 ? 50 : -50)], [G.OX - 40, m.l > 0 ? 300 : 70], u); }
        g.molecula(x, y, { r: 1.7, n: 2, rot: m.rot + u * 4, alpha: 0.45 * Math.min(1, u * 5, (1 - u) * 5) });
      }
      // iones de fondo: corriente continua hacia la entrada
      for (const q of iones) {
        const u = frac((t * q.k) / dur + q.f);
        const a = P(q.s, orto ? Math.abs(q.l) : q.l * 0.6);
        let x, y;
        if (u < 0.72) [x, y] = bezier(a, [lerp(a[0], G.OX, 0.6), lerp(a[1], G.OY, 0.85)], [G.OX + 2, G.OY], u / 0.72);
        else { x = lerp(G.OX + 2, 636, (u - 0.72) / 0.28); y = G.OY; }
        g.ion(x, y, { r: 3, alpha: 0.6 * Math.min(1, u * 6), signo: false });
      }

      /* ===== emisor ===== */
      if (orto) {
        if (tipo === 'jetstream') {
          // boquilla del gas envolvente, más ancha, y gas caliente que confina la pluma
          g.rect(G.TX - 34, -2, 68, 84, { fill: C.metal, stroke: C.metalOsc, lw: 0.8, r: 3 });
          g.rect(G.TX - 22, -2, 44, 86, { fill: C.vacio, alpha: 0.7 });
          for (const sg of [-1, 1]) {
            flujo(g, [[G.TX + sg * 28, 84], [G.TX + sg * 34, 200], [G.TX + sg * 46, 320]], t, { color: C.calor, n: 4, vel: 0.45, largo: 0.12, alpha: 0.75 });
          }
          g.rotulo(`Gas envolvente N₂${V.temp ? ' ' + V.temp : ''}`, 78, 112, { size: 11, color: C.calor });
        }
        g.rect(G.TX - 16, -2, 32, 82, { fill: C.metal, stroke: C.metalOsc, lw: 0.8, r: 3 });
        g.linea([[G.TX - 16, 80], [G.TX - 7, 96], [G.TX + 7, 96], [G.TX + 16, 80]], { fill: C.metal, color: C.metalOsc, lw: 0.8, cerrar: true });
        g.rect(G.TX - 3.5, -2, 7, G.TY + 2, { fill: C.metalOsc });
        g.rect(G.TX - 1.6, -2, 3.2, G.TY + 1, { fill: C.liquido, alpha: 0.9 });
        // gas nebulizador coaxial
        for (const sg of [-1, 1]) flujo(g, [[G.TX + sg * 5, 96], [G.TX + sg * 7, 124]], t, { color: C.gas, n: 2, vel: 1.2, largo: 0.4, lw: 1.2 });
        if (tipo === 'esi') {
          for (let i = 0; i < 4; i++) calor(g, G.TX + (i < 2 ? -1 : 1) * (26 + (i % 2) * 14), 104 + (i % 2) * 34, t + i * 0.6, { dx: 0, dy: 1, largo: 22, alpha: 0.55 });
          g.rotulo(V.gasCalor || 'Gas de calentamiento (aire)', 92, 82, { size: 11, color: C.calor });
        }
        const sx = G.TX + (tipo === 'jetstream' ? 108 : 78);
        g.rotulo(V.sonda, sx, 24, { size: 12 });
        if (V.hv === 'emisor') g.texto('Alta tensión', sx, 44, { size: 9.5, color: C.acento, align: 'center', weight: 700 });
        g.texto('Gas nebulizador (N₂)', G.TX + (tipo === 'jetstream' ? 40 : 24), 70, { size: 9.5, color: C.texto2 });
      } else {
        g.rect(-4, G.TY - 34, 104, 68, { fill: C.metal, stroke: C.metalOsc, lw: 0.8, r: 6 });
        g.rect(96, G.TY - 4, G.TX - 96, 8, { fill: C.metalOsc, r: 1 });
        g.rect(96, G.TY - 1.4, G.TX - 96 + 1, 2.8, { fill: C.liquido, alpha: 0.9 });
        // gas en vórtice alrededor de la punta
        for (let i = 0; i < 3; i++) {
          const ph = frac(t * 0.9 + i / 3);
          const cx = 104 + ph * 44;
          ctx.save(); ctx.globalAlpha = 0.7 * Math.sin(ph * Math.PI); ctx.strokeStyle = C.gas; ctx.lineWidth = 1.3;
          ctx.beginPath(); ctx.ellipse(cx, G.TY, 6, 22 - ph * 8, 0, -Math.PI / 2, Math.PI / 2); ctx.stroke(); ctx.restore();
        }
        g.rotulo(V.sonda, 62, G.TY - 52, { size: 12 });
        g.texto('Gas en vórtice', 126, G.TY + 44, { size: 9.5, color: C.texto2, align: 'center' });
        if (V.caudal) g.texto(V.caudal, 4, G.TY + 46, { size: 9.5, color: C.tenue });
      }

      /* ===== cono de Taylor y chorro ===== */
      const cono = orto
        ? [[G.TX - 3.5, G.TY], [G.TX - 1.5, G.TY + 7], [G.TX, G.TY + 13], [G.TX + 1.5, G.TY + 7], [G.TX + 3.5, G.TY]]
        : [[G.TX, G.TY - 3.5], [G.TX + 7, G.TY - 1.5], [G.TX + 13, G.TY], [G.TX + 7, G.TY + 1.5], [G.TX, G.TY + 3.5]];
      g.linea(cono, { fill: C.liquido, color: C.liquido, lw: 0.8, cerrar: true });
      const fin = orto ? [G.TX, G.TY + 26] : [G.TX + 26, G.TY];
      g.linea([tip, fin], { color: C.liquido, lw: 1.3 });
      for (let i = 0; i < 3; i++) {
        const u = frac(t * 1.6 + i / 3), d = 26 + u * 14;
        const [x, y] = orto ? [G.TX, G.TY + d] : [G.TX + d, G.TY];
        g.circulo(x, y, 1.6, { fill: C.liquido, alpha: 1 - u });
      }
      const aCono = tramo(t, 0.05, 0.5) * (1 - tramo(t, 3, 3.6));
      if (aCono > 0) rotuloGuia(g, 'Cono de Taylor', orto ? 104 : 152, orto ? 142 : G.TY + 62, orto ? G.TX - 2 : G.TX + 8, orto ? G.TY + 8 : G.TY + 3, { size: 11, alpha: aCono });

      /* ===== gota protagonista ===== */
      const ev = suave(tramo(t, T.ev, T.fis));           // evaporación hasta el límite
      const vida = t >= T.nace && t < T.hijas + 2.2;
      let gx, gy, gr = lerp(r0, rR, ev), gq = Q0;
      const kMov = tramo(t, T.nace, T.fis);
      gx = lerp(ruta.a[0], ruta.b[0], kMov); gy = lerp(ruta.a[1], ruta.b[1], kMov);
      const kDef = tramo(t, T.fis, T.fis2);               // deformación durante la fisión
      const estira = Math.sin(kDef * Math.PI);
      if (t >= T.fis + 0.45) gq = Q0 - 1;
      if (t >= T.fis + 0.7) gq = Q0 - 2;
      const kPadre = easeOut(tramo(t, T.fis2, T.hijas + 2.2));
      if (t > T.fis2) { gx = lerp(ruta.b[0], ruta.padre[0], kPadre); gy = lerp(ruta.b[1], ruta.padre[1], kPadre); gr = rR * (1 - 0.1 * kPadre); }
      // vapor que sale de la gota mientras se encoge
      for (const v of evap) {
        const dt = t - v.te;
        if (dt < 0 || dt > 1.6 || t > T.fis2 + 1) continue;
        const kk = tramo(t, v.te, v.te + 1.6);
        const [ex, ey] = [lerp(ruta.a[0], ruta.b[0], tramo(v.te, T.nace, T.fis)), lerp(ruta.a[1], ruta.b[1], tramo(v.te, T.nace, T.fis))];
        const rr = lerp(r0, rR, suave(tramo(v.te, T.ev, T.fis)));
        g.molecula(ex + Math.cos(v.a) * (rr + 4 + kk * 30), ey + Math.sin(v.a) * (rr + 4 + kk * 30), { r: 1.8, n: 2, rot: v.a + kk * 3, alpha: 0.8 * (1 - kk) });
      }
      if (vida) {
        const aP = Math.min(tramo(t, T.nace, T.nace + 0.4), 1 - tramo(t, T.hijas + 1.4, T.hijas + 2.2));
        dibujarGota(g, gx, gy, gr, gq, { alpha: aP, estira, ang: dirFis });
      }
      // gotitas hijas: dos, con una carga cada una
      const hijas = [[T.fis + 0.45, ruta.h1], [T.fis + 0.7, ruta.h2]];
      hijas.forEach(([t0, dest], i) => {
        if (t < t0 || t > T.suelta + 0.9) return;
        const salida = [ruta.b[0] + Math.cos(dirFis) * (rR * 1.45), ruta.b[1] + Math.sin(dirFis) * (rR * 1.45)];
        const k = easeOut(tramo(t, t0, T.hijas));
        const x = lerp(salida[0], dest[0], k), y = lerp(salida[1], dest[1], k);
        const r = lerp(3.6, 2.6, k) * (1 - tramo(t, T.suelta, T.suelta + 0.9));
        g.circulo(x, y, Math.max(0.3, r), { fill: C.liquido, alpha: 0.55, stroke: C.liquido, lw: 0.8 });
        if (t < T.ion + i * 0.2) g.texto('+', x, y + 0.5, { size: 7, color: C.ion, align: 'center', weight: 800 });
      });
      // iones liberados [M+H]⁺
      hijas.forEach(([, dest], i) => {
        const t1 = T.ion + i * 0.2;
        if (t < t1 || t > T.fin + 0.4) return;
        const kSep = easeOut(tramo(t, t1, T.suelta));
        let x = dest[0] + kSep * 9 * (orto ? 1 : 0.6), y = dest[1] - kSep * 7 * (i ? -1 : 1);
        const kV = tramo(t, T.suelta + 0.3 + i * 0.25, T.ori + i * 0.25);
        if (kV > 0) [x, y] = bezier([x, y], [lerp(x, G.OX, 0.55), lerp(y, G.OY, 0.9)], [G.OX + 4, G.OY + (i ? 1.5 : -1.5)], suave(kV));
        const kC = tramo(t, T.ori + i * 0.25, T.fin + i * 0.1);
        if (kC > 0) x = lerp(G.OX + 4, 618, kC);
        const a = 1 - tramo(t, T.fin, T.fin + 0.4);
        g.ion(x, y, { r: 5.5, alpha: a, brillo: t < T.suelta + 1 });
        if (i === 0 && t > T.ion + 0.2 && t < T.ori - 0.6) g.rotulo('[M+H]⁺', x + (orto ? 6 : 0), y - 22, { size: 11, color: C.ion, alpha: tramo(t, T.ion + 0.2, T.ion + 0.6) });
      });

      /* ===== rótulos de cada fase ===== */
      const aEv = tramo(t, 3.3, 3.8) * (1 - tramo(t, 6.8, 7.2));
      if (aEv > 0) g.rotulo('El disolvente se evapora', orto ? 86 : 236, orto ? 178 : G.TY + 64, { size: 11, alpha: aEv });
      const aFis = tramo(t, 7.1, 7.5) * (1 - tramo(t, 10.1, 10.5));
      if (aFis > 0) g.rotulo('Límite de Rayleigh: fisión', orto ? 300 : 225, orto ? 150 : G.TY + 66, { size: 11, color: C.mal, alpha: aFis });
      const aRes = tramo(t, 13.8, 14.3) * (1 - tramo(t, 17.4, 17.9));
      if (aRes > 0) {
        if (orto) {
          g.flecha(G.TX + 42, 300, G.TX + 26, 334, { color: C.tenue, lw: 1.2, alpha: aRes });
          g.rotulo(`Gotas y neutros → ${V.desague.toLowerCase()}`, G.TX + 120, 300, { size: 11, alpha: aRes });
        } else g.rotulo('Iones hacia el vacío', 545, G.OY + 52, { size: 11, color: C.ion, alpha: aRes });
      }

      /* ===== medidor de carga relativa al límite de Rayleigh ===== */
      const aMed = tramo(t, T.nace, T.nace + 0.5) * (1 - tramo(t, 12.6, 13.2));
      if (aMed > 0) {
        const kq = clamp((gq / Q0) * k0 * Math.pow(r0 / gr, 1.5) * (1 - 0.0 * estira));
        const mx = orto ? 300 : 40, my = orto ? 304 : 304;
        g.medidor(mx, my, 132, t < T.fis ? kq : t < T.fis2 ? 1 - 0.18 * tramo(t, T.fis + 0.4, T.fis + 0.75) : kq, { etiqueta: 'Carga / límite de Rayleigh', color: kq > 0.97 && t < T.fis2 ? C.mal : C.acento, alpha: aMed });
      }

      /* ===== desagüe y leyenda ===== */
      if (orto) {
        g.rect(G.TX - 40, 340, 80, 22, { fill: C.metal, alpha: 0.5, r: 3 });
        g.texto(V.desague, G.TX, 350, { size: 10, color: C.texto2, align: 'center', weight: 600 });
      }
      g.leyenda([[C.liquido, 'gota cargada'], [C.ion, 'ion'], [C.neutro, 'disolvente']], orto ? 404 : 300, 350, { size: 9.5 });
    },
  };
}

/** Gota con sus cargas superficiales; `estira` (0…1) la alarga hacia `ang` con una punta, como en la fisión de Rayleigh. */
function dibujarGota(g, x, y, r, q, { alpha = 1, estira = 0, ang = 0 } = {}) {
  const C = g.C, ctx = g.ctx;
  const ax = r * (1 + 0.32 * estira), by = r * (1 - 0.14 * estira);
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.globalAlpha = alpha;
  ctx.beginPath(); ctx.ellipse(0, 0, ax, by, 0, 0, Math.PI * 2);
  if (estira > 0.05) { ctx.moveTo(ax - 1, -by * 0.35); ctx.lineTo(ax + r * 0.5 * estira, 0); ctx.lineTo(ax - 1, by * 0.35); }
  ctx.fillStyle = C.liquido; ctx.globalAlpha = alpha * 0.5; ctx.fill();
  ctx.globalAlpha = alpha; ctx.strokeStyle = C.liquido; ctx.lineWidth = 1.1; ctx.stroke();
  ctx.restore();
  for (let i = 0; i < q; i++) {
    const a = (i / q) * Math.PI * 2 + 0.3;
    const ca = Math.cos(a) * ax * 0.74, sa = Math.sin(a) * by * 0.74;
    const px = x + ca * Math.cos(ang) - sa * Math.sin(ang), py = y + ca * Math.sin(ang) + sa * Math.cos(ang);
    g.texto('+', px, py + 0.5, { size: 7.5, color: C.ion, align: 'center', weight: 800, alpha });
  }
}
