// Concepto de MRM en un triple cuadrupolo (QqQ), pensado para el Shimadzu LCMS-8060NX. Un chorro continuo de iones de la fuente
// (tres compuestos y otros iones de la matriz) atraviesa Q1, q2 y Q3: Q1 deja pasar solo el precursor de la transición activa, q2 lo
// fragmenta con el gas de colisión y guía todos los productos, Q3 deja pasar un único producto y el detector (dínodo de conversión
// fuera de eje + multiplicador) lo cuenta. Después el equipo alterna entre transiciones (tiempo de permanencia y pausa) y se construyen
// los cromatogramas de cada transición. Todo es función de t (las partículas se lanzan con una semilla fija).
// Parámetros:
//   p.transiciones [{ nombre, q1, q3 }…] (máx. 3; m/z como texto). Por defecto, ejemplos conocidos en ESI(+):
//                  reserpina 609,3 → 195,1 · verapamilo 455,3 → 165,1 · sulfadimetoxina 311,1 → 156,0
//   p.gas          gas de colisión (por defecto 'argón')
//   p.dwell, p.pausa  tiempo de permanencia mínimo y pausa entre transiciones, en ms (por defecto 0,8 y 1, LCMS-8060NX)
//   p.equipo       nombre del equipo para el texto (por defecto 'LCMS-8060NX')
import { tramo, suave, easeOut, lerp, clamp, azar } from '../dibujo.js';
import { gasRect } from './_util-guiado.js';

const fmt = (x) => String(x).replace('.', ',');

export default function crear(p = {}) {
  const TR = (p.transiciones || [
    { nombre: 'reserpina', q1: '609,3', q3: '195,1' },
    { nombre: 'verapamilo', q1: '455,3', q3: '165,1' },
    { nombre: 'sulfadimetoxina', q1: '311,1', q3: '156,0' },
  ]).slice(0, 3);
  const NT = TR.length;
  const gas = p.gas || 'argón';
  const gasSim = { 'argón': 'Ar', 'nitrógeno': 'N₂' }[gas] || gas;
  const dwell = p.dwell ?? 0.8, pausa = p.pausa ?? 1;
  const equipo = p.equipo || 'LCMS-8060NX';

  const T1 = 3.6, T2 = 7.2, T3 = 10.6, T4 = 14.2, DUR = 18;
  const VENT = 1.25; // duración (visual) de cada transición en las fases 4–5: cámara muy lenta
  const fases = [
    { t: 0, texto: `De la fuente llega una mezcla de iones. Q1 trabaja como filtro fijo y solo deja pasar el ion precursor elegido, aquí el [M+H]⁺ de la ${TR[0].nombre}, de m/z ${TR[0].q1}. Los demás iones se vuelven inestables y chocan con las barras.` },
    { t: T1, texto: `En q2, la celda de colisión, el precursor choca con ${gas} y se fragmenta (CID). q2 no selecciona masas: su RF guía hacia Q3 todos los iones producto, mientras los fragmentos neutros se pierden.` },
    { t: T2, texto: `Q3 deja pasar un solo ion producto, el más característico (m/z ${TR[0].q3}), y el detector cuenta los iones que han superado los dos filtros. La pareja ${TR[0].q1} → ${TR[0].q3} es una transición MRM: dos filtros de masa en serie, muy selectivos.` },
    { t: T3, texto: `Cada pocos milisegundos el equipo cambia de transición: ajusta Q1, la energía de colisión y Q3 para otro compuesto. En el ${equipo} el tiempo de permanencia en cada transición puede bajar a ${fmt(dwell)} ms, con pausas de ${fmt(pausa)} ms.` },
    { t: T4, texto: 'El recuento de cada transición frente al tiempo de retención forma su cromatograma. Como casi ningún otro compuesto comparte a la vez el precursor y el producto, el ruido químico es muy bajo y se cuantifican trazas en matrices complejas.' },
  ];

  /* --- geometría --- */
  const EJE = 112, Q1 = [46, 196], Q2 = [216, 390], Q3 = [414, 564], HA = 24;
  const V = 230; // px/s
  const trans = (t) => (t < T3 ? 0 : Math.floor((t - T3) / VENT) % NT);
  const pausaVis = (t) => t >= T3 && ((t - T3) % VENT) < 0.25; // pausa al cambiar de transición (sin iones lanzados)

  // chorro de iones: lanzados desde t = −3 s para que la escena empiece llena
  const R = azar(31), IONES = [];
  for (let tl = -3; tl < DUR; tl += 0.1) {
    const u = R();
    const esp = u < 0.22 ? 0 : u < 0.4 ? 1 : u < 0.56 ? 2 : -1; // −1 = otro ion de la matriz
    IONES.push({ tl, esp, a: R(), b: R(), c: R(), d: R() });
  }

  return {
    titulo: 'Triple cuadrupolo: MRM',
    dur: DUR,
    fases,
    dibujar(g, t) {
      const C = g.C;
      const COL = [C.m[2], C.m[3], C.m[1]];
      const k = trans(t);
      const tr = TR[k], col = COL[k];

      /* ===== piezas ===== */
      const dibQuad = (x0, x1, nom, ajuste, foco) => {
        for (const sg of [-1, 1]) {
          g.electrodo(x0, EJE + sg * (HA + 4) - 4, x1 - x0, 8, {});
        }
        g.rotulo(nom, (x0 + x1) / 2, 70, { size: 11 });
        g.rotulo(ajuste, (x0 + x1) / 2, 46, { size: 10, color: col, alpha: foco });
      };
      dibQuad(Q1[0], Q1[1], 'Q1', `m/z ${tr.q1}`, 1);
      g.camara(Q2[0], 82, Q2[1] - Q2[0], 60, {});
      for (const sg of [-1, 1]) g.electrodo(Q2[0] + 8, EJE + sg * 20 - 3, Q2[1] - Q2[0] - 16, 6, { color: C.metal });
      gasRect(g, Q2[0] + 4, 86, Q2[1] - Q2[0] - 8, 52, t, { n: 22, semilla: 3, alpha: 0.5, r: 1.9 });
      g.rotulo('q2 · celda de colisión', (Q2[0] + Q2[1]) / 2, 70, { size: 11 });
      g.rotulo(`CID con ${gasSim}`, (Q2[0] + Q2[1]) / 2, 46, { size: 10 });
      g.linea([[303, 142], [303, 166]], { color: C.metalOsc, lw: 5 }); g.linea([[303, 142], [303, 166]], { color: C.metal, lw: 2.5 });
      g.texto(gasSim, 312, 160, { size: 10, color: C.texto2, weight: 600 });
      dibQuad(Q3[0], Q3[1], 'Q3', `m/z ${tr.q3}`, 1);
      // detector: dínodo de conversión fuera de eje + multiplicador
      g.electrodo(574, 160, 26, 6, { color: C.metalOsc });
      g.rect(608, 120, 22, 52, { fill: C.panel, stroke: C.metalOsc, lw: 1.2, r: 3 });
      g.rotulo('Detector', 600, 70, { size: 11 });
      g.texto('dínodo', 587, 177, { size: 9, color: C.tenue, align: 'center' });
      g.flecha(4, EJE, 36, EJE, { color: C.tenue, lw: 1.2, punta: 6 });
      g.texto('Fuente', 6, EJE - 16, { size: 9.5, color: C.tenue });

      /* ===== iones ===== */
      const flash = (x, y, kk, c) => { if (kk > 0 && kk < 1) g.circulo(x, y, 3 + 10 * kk, { stroke: c, lw: 1.4, alpha: 1 - kk }); };
      for (const io of IONES) {
        const x = 30 + V * (t - io.tl);
        if (x < 30 || x > 640) continue;
        const kTr = trans(Math.max(0, io.tl + (Q1[0] - 30) / V)); // transición activa cuando el ion entra en Q1
        if (pausaVis(io.tl + (Q1[0] - 30) / V)) continue;
        const colIon = io.esp < 0 ? C.tenue : COL[io.esp];
        const pasa = io.esp === kTr;
        // --- Q1 ---
        if (!pasa) {
          const xh = Q1[0] + 20 + io.a * 110;
          const sg = io.b < 0.5 ? -1 : 1;
          if (x < xh) {
            const A = Q1[0] < x ? HA * ((x - Q1[0]) / (xh - Q1[0])) ** 2 : 0;
            g.ion(x, EJE + Math.sin(x * 0.25 + io.c * 6) * A * sg, { r: 4.2, color: colIon, signo: false });
          } else flash(xh, EJE + sg * HA * Math.sin(xh * 0.25 + io.c * 6), (x - xh) / 40, colIon);
          continue;
        }
        if (x < Q2[0] + 30 + io.a * 70) { g.ion(x, EJE + Math.sin(x * 0.2 + io.c * 6) * 3, { r: 4.6, color: colIon }); continue; }
        // --- q2: fragmentación (el 15 % sobrevive intacto y Q3 lo rechaza) ---
        const xf = Q2[0] + 30 + io.a * 70, d = x - xf;
        if (d < 12) flash(xf, EJE, d / 12, C.calor);
        const intacto = io.d < 0.15;
        const prods = intacto ? [{ c: colIon, r: 4.6, bueno: false, dy: 0 }] : [{ c: colIon, r: 3.6, bueno: true, dy: -1 }, { c: C.m[4], r: 3.6, bueno: false, dy: 1 }];
        if (!intacto) { const ny = EJE + 4 + d * 0.45; if (ny < 140) g.circulo(xf + d * 0.7, ny, 2.6, { fill: C.neutro, alpha: 1 - tramo(ny, 120, 140) }); }
        for (const pr of prods) {
          const y0 = EJE + pr.dy * 8 * Math.exp(-d / 60) * (x < Q2[1] ? 1 : 0);
          if (x < Q3[0]) { g.ion(x, y0 + Math.sin(x * 0.3 + pr.dy) * 2, { r: pr.r, color: pr.c, signo: pr.r > 4 }); continue; }
          if (!pr.bueno) {
            const xh = Q3[0] + 16 + io.b * 100, sg = io.c < 0.5 ? -1 : 1;
            if (x < xh) g.ion(x, EJE + Math.sin(x * 0.27) * HA * ((x - Q3[0]) / (xh - Q3[0])) ** 2 * sg, { r: pr.r, color: pr.c, signo: false });
            else flash(xh, EJE + sg * HA * Math.sin(xh * 0.27), (x - xh) / 40, pr.c);
            continue;
          }
          if (x < Q3[1]) { g.ion(x, EJE + Math.sin(x * 0.3) * 2.5, { r: 3.8, color: pr.c, signo: false }); continue; }
          // hacia el dínodo fuera de eje
          const kk = clamp((x - Q3[1]) / 34);
          if (kk < 1) g.ion(lerp(Q3[1], 587, kk), lerp(EJE, 158, kk * kk), { r: 3.8, color: pr.c, signo: false });
          else {
            const ke = clamp((x - Q3[1] - 34) / 40);
            flash(587, 158, ke * 2, pr.c);
            if (ke < 1) for (let j = 0; j < 3; j++) g.electron(lerp(592, 612, ke), lerp(156, 142 - j * 6, ke), { r: 2 });
          }
        }
      }

      /* ===== rótulos de las fases 1–3 ===== */
      const r1 = tramo(t, 0.3, 0.8) * (1 - tramo(t, T1 - 0.3, T1));
      if (r1 > 0) g.rotulo('Solo pasa el precursor', (Q1[0] + Q1[1]) / 2, 162, { size: 10, color: col, alpha: r1 });
      const r2 = tramo(t, T1, T1 + 0.4) * (1 - tramo(t, T2 - 0.3, T2));
      if (r2 > 0) g.rotulo('Fragmentación: todos los productos siguen', (Q2[0] + Q2[1]) / 2, 182, { size: 10, alpha: r2 });
      const r3 = tramo(t, T2, T2 + 0.4) * (1 - tramo(t, T3 - 0.3, T3));
      if (r3 > 0) g.rotulo('Solo pasa el producto elegido', (Q3[0] + Q3[1]) / 2, 162, { size: 10, color: col, alpha: r3 });

      /* ===== transición activa ===== */
      const BY = 196;
      g.rect(10, BY, 236, 150, { fill: C.panel, stroke: C.linea, r: 4 });
      g.texto('Transición MRM activa', 20, BY + 13, { size: 10, color: C.texto2, weight: 600 });
      const cambio = t >= T3 ? tramo((t - T3) % VENT, 0, 0.25) : 1;
      g.texto(`${tr.q1} → ${tr.q3}`, 128, BY + 52, { size: 22, color: col, align: 'center', weight: 700, alpha: cambio });
      g.texto(tr.nombre, 128, BY + 80, { size: 12, color: C.texto2, align: 'center', alpha: cambio });
      g.texto('precursor (Q1) → producto (Q3)', 128, BY + 100, { size: 9.5, color: C.tenue, align: 'center' });
      if (t >= T3 && pausaVis(t)) g.texto('pausa: cambian Q1, CE y Q3', 128, BY + 124, { size: 10, color: C.calor, align: 'center', weight: 600 });
      else if (t >= T3) g.texto(`permanencia (dwell) en ${tr.nombre}`, 128, BY + 124, { size: 10, color: C.ok, align: 'center', weight: 600 });

      /* ===== ciclo MRM ===== */
      const CX = 258, CW = 372;
      if (t >= T3 - 0.3) {
        const al = tramo(t, T3 - 0.3, T3);
        g.rect(CX, BY, CW, 62, { fill: C.panel, stroke: C.linea, r: 4, alpha: al });
        g.texto('Ciclo MRM (cámara muy lenta)', CX + 8, BY + 11, { size: 9.5, color: C.texto2, weight: 600, alpha: al });
        const x0 = CX + 12, w = CW - 24, per = (dwell + pausa) * NT, esc = w / (per * 1.5);
        let xx = x0;
        for (let c = 0; c < 1.5 * NT; c++) {
          const j = c % NT;
          const wD = dwell * esc, wP = pausa * esc;
          if (xx + wP + wD > x0 + w) break;
          g.rect(xx + wP, BY + 24, wD, 16, { fill: COL[j], alpha: 0.85 * al, r: 2 });
          g.linea([[xx + 2, BY + 32], [xx + wP - 2, BY + 32]], { color: C.tenue, lw: 1, dash: [2, 2], alpha: al });
          xx += wP + wD;
        }
        g.texto(`dwell ${fmt(dwell)} ms · pausa ${fmt(pausa)} ms`, CX + CW - 8, BY + 11, { size: 9, color: C.tenue, align: 'right', alpha: al });
        if (t >= T3) {
          const u = ((t - T3) % (VENT * NT)) / (VENT * NT);
          const xc = x0 + u * per * esc;
          g.linea([[xc, BY + 20], [xc, BY + 44]], { color: C.texto, lw: 1.6, alpha: al });
        }
        g.texto('t', CX + CW - 10, BY + 50, { size: 9, color: C.tenue, align: 'right', italic: true, alpha: al });
      }

      /* ===== cromatogramas ===== */
      if (t >= T4 - 0.3) {
        const al = tramo(t, T4 - 0.3, T4);
        const GY = BY + 70, GH = 80;
        g.rect(CX, GY, CW, GH, { fill: C.panel, stroke: C.linea, r: 4, alpha: al });
        g.texto('Cromatograma de cada transición', CX + 8, GY + 11, { size: 9.5, color: C.texto2, weight: 600, alpha: al });
        g.texto('tiempo de retención', CX + CW - 8, GY + GH - 6, { size: 8.5, color: C.tenue, align: 'right', alpha: al });
        const hecho = suave(tramo(t, T4, DUR - 0.4));
        const xa = CX + 8, xb = CX + CW - 8, yb = GY + GH - 16;
        g.linea([[xa, yb], [xb, yb]], { color: C.tenue, lw: 0.8, alpha: al });
        const RT = [0.62, 0.38, 0.2], H = [0.8, 1, 0.6];
        for (let j = 0; j < NT; j++) {
          const pts = [];
          for (let i = 0; i <= 140 * hecho; i++) {
            const u = i / 140;
            pts.push([lerp(xa, xb, u), yb - (H[j] * Math.exp(-(((u - RT[j]) / 0.03) ** 2)) + 0.015 * Math.sin(u * 90 + j * 2) ** 2) * (GH - 32)]);
          }
          g.linea(pts, { color: COL[j], lw: 1.5, alpha: al });
        }
      }

      g.leyenda([...TR.map((x, i) => [COL[i], x.nombre]), [C.m[4], 'otros fragmentos'], [C.tenue, 'otros iones'], [C.neutro, 'neutro']], 14, 354, { size: 9.5 });
      void easeOut;
    },
  };
}
