// Disociación inducida por colisión (CID) en una celda de colisión de RF. Vista lateral: el precursor llega del cuadrupolo, la diferencia
// de potencial de entrada (energía de colisión, CE) lo acelera, choca muchas veces con el gas, su energía interna sube hasta romper un
// enlace y el campo axial (o el pseudopotencial de una celda estrechada) vacía la celda. Debajo, el perfil de potencial a lo largo del
// eje (el ion «cae» por el escalón CE), la energía interna frente al umbral y el espectro de salida; al final, el efecto de la CE.
// Todo se dibuja como función de t.
// Parámetros:
//   p.gas      'argón' (por defecto; Shimadzu) | 'nitrógeno' (Agilent 6546) | 'helio' | 'generico' (sin nombrar el gas) | otro texto
//   p.salida   'barrido' (pseudopotencial que acelera los iones hacia la salida, Shimadzu UFsweeper; no se dibuja la geometría interna, que el fabricante no detalla) | 'campo-axial' (varillas con recubrimiento
//              resistivo, Agilent) | 'pulsos' (acumula y libera en paquetes: UFaccumulation, celdas de FT-ICR) | 'generico' (por defecto)
//   p.multipolo rótulo de la guía de RF de la celda (por defecto según p.salida)
//   p.nombre    rótulo de la celda (por defecto 'Celda de colisión')
//   p.origen    rótulo del filtro anterior (por defecto 'Q1')   ·   p.destino  rótulo del analizador siguiente (por defecto 'Q3')
import { tramo, suave, easeOut, lerp, clamp, azar } from '../dibujo.js';
import { gasRect } from './util-guiado.js';

const GASES = {
  'argón': { sim: 'Ar', m: 40, atomo: true, txt: 'átomos de argón' },
  'nitrógeno': { sim: 'N₂', m: 28, atomo: false, txt: 'moléculas de nitrógeno' },
  helio: { sim: 'He', m: 4, atomo: true, txt: 'átomos de helio' },
  generico: { sim: 'gas', m: null, atomo: true, txt: 'las moléculas del gas de colisión' },
};

export default function crear(p = {}) {
  const gas = GASES[p.gas || 'argón'] || { sim: p.gas, m: null, atomo: true, txt: `moléculas de ${p.gas}` };
  const salida = p.salida || 'generico';
  const multipolo = p.multipolo || { barrido: 'Multipolo de RF', 'campo-axial': 'Hexapolo con recubrimiento resistivo', pulsos: 'Hexapolo', generico: 'Multipolo de RF' }[salida];
  const nombre = p.nombre || 'Celda de colisión';
  const origen = p.origen || 'Q1', destino = p.destino || 'Q3';
  const destinoFiltro = /^Q/.test(destino);

  const T1 = 3.4, T2 = 7.6, T3 = 10.6, T4 = 13.6, DUR = 18;
  const textoSalida = {
    barrido: 'El diseño de la celda crea una superficie de pseudopotencial que acelera los iones hacia la salida sin dejar que se frenen. La celda se vacía en muy poco tiempo, así que los iones de una transición no se mezclan con los de la siguiente.',
    'campo-axial': 'El recubrimiento resistivo de las varillas crea un campo eléctrico axial que arrastra hacia la salida a los iones frenados por los choques. La celda se vacía enseguida y un espectro no contamina al siguiente.',
    pulsos: 'Un potencial en la salida retiene los iones, que los choques enfrían y concentran en el eje. Al bajarlo, salen todos juntos en un paquete compacto, sincronizado con el analizador que los recibe.',
    generico: 'Un campo eléctrico axial empuja hacia la salida a los iones frenados por los choques, de modo que la celda se vacía con rapidez. El fragmento neutro no siente la RF ni el campo y el bombeo lo retira.',
  }[salida];
  const fases = [
    { t: 0, texto: `${origen} deja pasar solo el ion precursor. A la entrada de la celda, una diferencia de potencial, la energía de colisión (CE), lo acelera: un ion de carga z gana z·CE electronvoltios de energía cinética.` },
    { t: T1, texto: `Dentro de la celda choca muchas veces con ${gas.txt}. En cada choque solo la energía del centro de masas puede convertirse en energía interna: el ion se frena y se calienta paso a paso, mientras la RF lo mantiene cerca del eje.` },
    { t: T2, texto: 'Cuando la energía interna acumulada basta para romper un enlace, el ion se disocia en un ion producto y un fragmento neutro. Suelen romperse los enlaces más débiles, y los productos aún excitados pueden fragmentarse de nuevo.' },
    { t: T3, texto: textoSalida },
    { t: T4, texto: 'Con una CE baja el precursor sale casi intacto; al subirla aparecen fragmentos y, con valores altos, fragmentos cada vez más pequeños. Por eso cada compuesto, o cada transición MRM, tiene su energía de colisión óptima.' },
  ];

  /* --- geometría --- */
  const EJE = 104, XC0 = 140, XC1 = 500;           // eje y límites de la celda
  const rodY = (x, sg) => {                          // semiseparación de las varillas
    const k = clamp((x - XC0) / (XC1 - XC0));
    const h = 30; void k;
    return EJE + sg * h;
  };
  /* --- recorrido del precursor (fases 1–4) --- */
  const TC = [3.9, 4.6, 5.3, 6.0, 6.7, 7.3];        // choques
  const EINT = [0, 0.21, 0.39, 0.54, 0.67, 0.79, 0.93]; // energía interna tras cada choque (umbral 0,86)
  const DESV = [0, -7, 6, -5, 6, -4, 3];            // desviación lateral tras cada choque (la RF la reenfoca)
  const TROT = 7.95;                                 // disociación
  function precursor(t) {
    if (t < 2.6) return { x: lerp(18, 118, t / 2.6), y: EJE + Math.sin(t * 9) * 1.5 };
    if (t < T1) return { x: lerp(118, 160, easeOut(tramo(t, 2.6, T1)) ** 0.8), y: EJE };
    let x = 160, tt = T1, v = 100, n = 0;
    for (const tc of TC) { if (t < tc) break; x += v * (tc - tt); tt = tc; v *= Math.sqrt(0.62); n++; }
    x += v * (Math.min(t, 9) - tt);
    const dy = DESV[n] * Math.exp(-(t - (TC[n - 1] || T1)) * 2.2) * Math.cos((t - (TC[n - 1] || T1)) * 9);
    return { x, y: EJE + dy, n };
  }
  const xRot = precursor(TROT).x;
  // productos tras la disociación: deriva lenta y, con el campo axial, salida
  function producto(t) {
    const x0 = xRot + 6;
    const deriva = x0 + 9 * Math.max(0, Math.min(t, T3 + 0.2) - TROT);
    if (salida === 'pulsos') {
      if (t < T3 + 1.4) return { x: Math.min(deriva + 40 * suave(tramo(t, T3 + 0.2, T3 + 1.2)), 482), y: EJE };
      return { x: lerp(482, 650, easeOut(tramo(t, T3 + 1.4, T3 + 2.6))), y: EJE };
    }
    const k = tramo(t, T3 + 0.2, T3 + 2.6);
    return { x: lerp(deriva, 650, k ** 1.6), y: EJE + Math.sin(t * 7) * 1.2 * (1 - k) };
  }

  /* --- fase 5: chorro de precursores con tres CE --- */
  const NIV = [{ nom: 'CE baja', ce: 0.25 }, { nom: 'CE media', ce: 0.6 }, { nom: 'CE alta', ce: 1 }];
  const nivel = (t) => Math.min(2, Math.floor((t - T4) / ((DUR - T4) / 3)));
  const ESPECTRO = [ // [precursor, producto grande, producto pequeño] — alturas ilustrativas
    [1, 0.12, 0], [0.35, 0.85, 0.3], [0.04, 0.4, 0.95]];
  const R = azar(19);
  const chorro = Array.from({ length: 6 }, (_, i) => ({ f: i / 6, s: R() }));

  return {
    titulo: 'Celda de colisión (CID)',
    dur: DUR,
    fases,
    dibujar(g, t) {
      const C = g.C;
      const fase5 = t >= T4;
      const niv = fase5 ? nivel(t) : 1;
      const ce = fase5 ? NIV[niv].ce : 0.75;

      /* ===== piezas ===== */
      // filtro anterior
      for (const sg of [-1, 1]) g.electrodo(12, EJE + sg * 22 - 4, 100, 8, {});
      g.rotulo(origen, 62, EJE - 44, { size: 10.5 });
      // celda: carcasa, entrada de gas, varillas
      g.camara(XC0 - 14, 46, XC1 - XC0 + 28, 116, { titulo: nombre });
      g.electrodo(XC0 - 14, EJE - 50, 6, 38, { color: C.metalOsc }); g.electrodo(XC0 - 14, EJE + 12, 6, 38, { color: C.metalOsc });
      g.electrodo(XC1 + 8, EJE - 50, 6, 38, { color: C.metalOsc }); g.electrodo(XC1 + 8, EJE + 12, 6, 38, { color: C.metalOsc });
      if (salida === 'pulsos') {
        const alto = t < T3 + 1.4 || t > T3 + 2.8;
        if (alto && t >= T3) g.texto('+', XC1 + 11, EJE - 56, { size: 12, color: C.ion, align: 'center', weight: 800 });
      }
      g.linea([[300, 18], [300, 46]], { color: C.metalOsc, lw: 5 }); g.linea([[300, 18], [300, 46]], { color: C.metal, lw: 2.5 });
      g.rotulo(gas.sim === 'gas' ? 'Gas de colisión' : `Gas de colisión: ${gas.sim}`, 300, 14, { size: 10 });
      for (const sg of [-1, 1]) {
        const pts = [];
        for (let x = XC0; x <= XC1; x += 20) pts.push([x, rodY(x, sg)]);
        const yo = sg < 0 ? -7 : 0;
        g.linea([...pts.map(([x, y]) => [x, y + yo]), ...pts.slice().reverse().map(([x, y]) => [x, y + yo + 7])], { fill: C.metal, color: C.metalOsc, lw: 0.8, cerrar: true });
        if (salida === 'campo-axial') for (let i = 0; i < 9; i++) g.rect(XC0 + i * 40, rodY(0, sg) + yo, 40, 7, { fill: C.acento, alpha: 0.06 + i * 0.03 });
      }
      g.rotulo(multipolo, 320, 176 - 6, { size: 9.5 });
      // gas
      gasRect(g, XC0 - 6, 54, XC1 - XC0 + 12, 100, t, { n: 34, semilla: 7, alpha: 0.5, r: gas.atomo ? 2.2 : 1.7 });
      if (!gas.atomo) gasRect(g, XC0 - 3, 56, XC1 - XC0 + 12, 100, t, { n: 34, semilla: 7, alpha: 0.5, r: 1.7 });
      // analizador siguiente
      if (destinoFiltro) for (const sg of [-1, 1]) g.electrodo(528, EJE + sg * 22 - 4, 100, 8, {});
      g.rotulo(destinoFiltro ? destino : `Hacia ${destino}`, 578, EJE - 44, { size: 10.5 });

      /* ===== perfil de potencial a lo largo del eje ===== */
      const PY0 = 182, PY1 = 252;
      g.rect(10, PY0, 620, PY1 - PY0, { fill: C.panel, stroke: C.linea, r: 4 });
      g.texto('Potencial en el eje', 18, PY0 + 10, { size: 9.5, color: C.texto2, weight: 600 });
      const yCel = PY1 - 22, yQ1 = yCel - 14 - ce * 30;
      const barrera = salida === 'pulsos' && t >= T3 && (t < T3 + 1.4 || t > T3 + 2.8) ? 16 : 0;
      const perfil = (x) => {
        if (x < 120) return yQ1;
        if (x < 140) return lerp(yQ1, yCel, suave(tramo(x, 120, 140)));
        const plano = salida === 'pulsos' || salida === 'barrido';
        if (x < XC1) return plano ? yCel + 2 : lerp(yCel, yCel + 6, (x - XC0) / (XC1 - XC0));
        if (x < 520) return (plano ? yCel + 2 : yCel + 6) - barrera * Math.sin(tramo(x, XC1, 520) * Math.PI);
        return plano ? yCel + 4 : yCel + 8;
      };
      const pp = [];
      for (let x = 14; x <= 626; x += 3) pp.push([x, perfil(x)]);
      g.linea(pp, { color: C.acento, lw: 1.8 });
      g.flecha(108, yQ1, 108, yCel, { color: C.calor, lw: 1.4, punta: 6 });
      g.texto(fase5 ? NIV[niv].nom : 'CE', 102, (yQ1 + yCel) / 2, { size: 10, color: C.calor, align: 'right', weight: 700 });

      /* ===== partículas ===== */
      const colP = C.m[2], colA = C.m[1], colB = C.m[0];
      const bola = (x, col) => { if (x > 14 && x < 626) g.circulo(x, perfil(x) - 4, 4, { fill: col }); };
      if (!fase5) {
        const P = precursor(t);
        if (t < TROT) {
          const vib = P.n ? Math.sin(t * 50) * EINT[P.n] * 1.6 : 0;
          g.molecula(P.x + vib, P.y, { r: 4.2, n: 5, rot: t * 0.6, semilla: 7, color: colP });
          g.ion(P.x + 11, P.y - 11, { r: 5, color: colP });
          bola(P.x, colP);
          // choque: átomo de gas que rebota y destello
          for (let i = 0; i < TC.length; i++) {
            const k = tramo(t, TC[i] - 0.25, TC[i] + 0.5);
            if (k <= 0 || k >= 1) continue;
            const xc = precursor(TC[i]).x + 7, yc = EJE + (i % 2 ? 9 : -9);
            const kk = tramo(t, TC[i], TC[i] + 0.5);
            const gx = k < 0.33 ? lerp(xc + 18, xc, k / 0.33) : xc + kk * 22, gy = k < 0.33 ? lerp(yc + (i % 2 ? 16 : -16), yc, k / 0.33) : yc + (i % 2 ? 1 : -1) * kk * 26;
            g.circulo(gx, gy, gas.atomo ? 3.6 : 3, { fill: C.gas });
            if (!gas.atomo) g.circulo(gx + 4, gy + 1, 3, { fill: C.gas });
            if (kk > 0) g.circulo(xc - 2, (yc + EJE) / 2, 5 + 14 * kk, { stroke: C.calor, lw: 1.4, alpha: 1 - kk });
          }
          if (t > T1 + 0.4 && t < T2) g.rotulo('choque', precursor(TC[1]).x + 4, EJE - 30, { size: 9.5, color: C.calor, alpha: tramo(t, 4.5, 4.8) * (1 - tramo(t, 7.2, 7.6)) });
        } else {
          const k = easeOut(tramo(t, TROT, TROT + 0.8));
          const Pr = producto(t);
          if (Pr.x < 640) {
            g.molecula(Pr.x, Pr.y - 4 * k, { r: 4.2, n: 3, rot: t * 0.8, semilla: 4, color: colA });
            g.ion(Pr.x + 10, Pr.y - 4 * k - 10, { r: 5, color: colA });
            bola(Pr.x, colA);
          }
          // fragmento neutro: sigue recto (no lo guía la RF) y se pierde
          const nx = xRot - 4 + (t - TROT) * 22, ny = EJE + 6 + (t - TROT) * 17;
          if (ny < 168) g.molecula(nx, ny, { r: 4, n: 2, rot: -t, semilla: 9, alpha: 1 - tramo(ny, 140, 168) });
          if (t < T3) {
            g.rotulo('Ion producto', xRot + 20, EJE - 30, { size: 9.5, color: colA, alpha: tramo(t, TROT + 0.3, TROT + 0.7) });
            g.rotulo('Fragmento neutro', xRot - 50, 138, { size: 9.5, alpha: tramo(t, TROT + 0.3, TROT + 0.7) });
          }
          if (t < TROT + 0.5) g.circulo(xRot, EJE, 6 + 20 * tramo(t, TROT, TROT + 0.5), { stroke: C.calor, lw: 1.6, alpha: 1 - tramo(t, TROT, TROT + 0.5) });
        }
        // campo axial
        if (t >= T3 && t < T4) {
          const a = tramo(t, T3, T3 + 0.4) * (1 - tramo(t, T4 - 0.4, T4));
          if (salida === 'pulsos') {
            if (t < T3 + 1.4) g.rotulo('Barrera: los iones se acumulan', 446, 176 - 6, { size: 9.5, color: C.ion, alpha: a });
            else g.rotulo('Barrera abajo: sale el paquete', 446, 176 - 6, { size: 9.5, color: C.ok, alpha: a });
          } else {
            for (const dy of [-12, 12]) g.flecha(XC0 + 30, EJE + dy, XC1 - 20, EJE + dy, { color: C.campo, lw: 1.2, punta: 6, alpha: a });
            g.texto(salida === 'barrido' ? 'pseudopotencial: empuje hacia la salida' : 'campo axial', 320, EJE + 24, { size: 9.5, color: C.acento, align: 'center', weight: 600, alpha: a });
          }
        }
      } else {
        // chorro de precursores; según la CE se rompen antes, después o nunca
        const ciclo = 1.6;
        for (const c of chorro) {
          const u = ((t - T4) / ciclo + c.f) % 1;
          const x = lerp(18, 640, u);
          const xr = niv === 0 ? 9999 : niv === 1 ? 330 + c.s * 90 : 190 + c.s * 50;
          const rompe = niv > 0 && (niv === 2 || c.s < 0.75) && x > xr;
          if (!rompe) {
            g.molecula(x, EJE, { r: 3.6, n: 5, rot: u * 6 + c.s * 5, semilla: 7, color: colP });
            g.ion(x + 9, EJE - 9, { r: 4.6, color: colP });
            if (niv === 0 && x > XC0 && x < XC1 && c.s > 0.85) g.circulo(x - 8, EJE + 8, 3, { fill: C.gas });
          } else {
            const d = x - xr;
            const pequeño = niv === 2 && c.s > 0.3;
            g.molecula(x, EJE - Math.min(6, d * 0.1), { r: 3.6, n: pequeño ? 2 : 3, rot: u * 8, semilla: 4, color: pequeño ? colB : colA });
            g.ion(x + 8, EJE - Math.min(6, d * 0.1) - 8, { r: 4.6, color: pequeño ? colB : colA });
            const ny = EJE + 6 + d * 0.5;
            if (ny < 160) g.molecula(xr + d * 0.7, ny, { r: 3.4, n: 2, rot: -u * 6, semilla: 9, alpha: 0.85 });
          }
        }
        g.rotulo(NIV[niv].nom, 214, 30, { size: 10.5, color: C.calor });
      }

      /* ===== energía interna ===== */
      const BY = 262;
      g.rect(10, BY, 236, 84, { fill: C.panel, stroke: C.linea, r: 4 });
      g.texto('Energía interna del precursor', 18, BY + 11, { size: 9.5, color: C.texto2, weight: 600 });
      let ei = 0;
      if (!fase5 && t < TROT + 0.6) { const n = precursor(Math.min(t, TROT)).n || 0; ei = EINT[n]; if (n) ei = lerp(EINT[n - 1], EINT[n], tramo(t, TC[n - 1], TC[n - 1] + 0.25)); }
      if (fase5) ei = [0.5, 0.9, 1][niv];
      const xu = 18 + 0.86 * 210;
      g.medidor(18, BY + 34, 210, ei, { color: ei >= 0.86 ? C.calor : C.foton });
      g.linea([[xu, BY + 24], [xu, BY + 48]], { color: C.calor, lw: 1.2, dash: [3, 2] });
      g.texto('umbral de disociación', xu, BY + 56, { size: 9, color: C.calor, align: 'center' });
      g.texto(gas.m ? `E_cm = E_lab · m_gas/(m_gas + m_ion);  m(${gas.sim}) = ${gas.m} u` : 'E_cm = E_lab · m_gas/(m_gas + m_ion)', 18, BY + 73, { size: 9, color: C.tenue });

      /* ===== espectro de salida ===== */
      const SX = 254, SW = 376;
      if (t >= T3 + 1.4 || fase5) {
        const al = fase5 ? 1 : tramo(t, T3 + 1.4, T3 + 1.8);
        g.grafico(SX, BY, SW, 84, () => 0, { titulo: `Iones que salen hacia ${destino}`, ejeX: 'm/z', alpha: al, fill: false });
        const H = fase5 ? ESPECTRO[niv] : [0, 1, 0];
        const xs = [SX + SW * 0.8, SX + SW * 0.52, SX + SW * 0.24], cols = [colP, colA, colB], noms = ['precursor', 'producto', 'producto'];
        for (let i = 0; i < 3; i++) {
          const h = H[i] * 48;
          if (h > 0.5) g.rect(xs[i] - 6, BY + 70 - h, 12, h, { fill: cols[i], alpha: 0.9 * al, r: 1.5 });
          if (fase5 || i === 1) g.texto(noms[i], xs[i], BY + 79, { size: 8.5, color: C.tenue, align: 'center', alpha: al });
        }
      }

      g.leyenda([[colP, 'precursor'], [colA, 'ion producto'], [colB, 'producto menor'], [C.neutro, 'neutro'], [C.gas, gas.sim]], 14, 353, { size: 9.5 });
    },
  };
}
