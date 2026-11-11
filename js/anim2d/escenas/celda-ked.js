// Celda de colisión de ICP-MS en modo helio con discriminación por energía cinética (KED), como la celda ORS⁴ (octopolo) del Agilent 7900.
// ⁷⁵As⁺ y el poliatómico ⁴⁰Ar³⁵Cl⁺ (ambos m/z 75) entran con la misma energía; el ArCl⁺, de mayor sección eficaz, choca más veces con el
// He, pierde más energía y la barrera de salida lo rechaza, mientras el As⁺ la supera. No hay reacción química: solo choques y frenado.
// Las trayectorias se precalculan una vez (función de t, sin estado).
// Parámetros:
//   p.celda    rótulo de la celda (por defecto 'Celda ORS⁴')      ·  p.guia  rótulo de la guía de RF (por defecto 'Octopolo')
//   p.origen   de dónde llegan los iones (por defecto 'la lente Omega')
//   p.escudo   true (por defecto) → menciona la distribución estrecha de energía del ShieldTorch
import { tramo, suave, easeOut, lerp, clamp } from '../dibujo.js';
import { gasRect } from './_util-guiado.js';

export default function crear(p = {}) {
  const celda = p.celda || 'Celda ORS⁴';
  const guia = p.guia || 'Octopolo';
  const origen = p.origen || 'la lente Omega';
  const escudo = p.escudo !== false;

  const T1 = 3.6, T2 = 7, T3 = 10.4, T4 = 13.8, DUR = 17.5;
  const fases = [
    { t: 0, texto: 'El plasma de argón y la matriz forman iones poliatómicos con la misma masa nominal que algunos analitos: el ⁴⁰Ar³⁵Cl⁺ (m/z 75) coincide con el único isótopo del arsénico, ⁷⁵As⁺. Un cuadrupolo de resolución unitaria no puede separarlos.' },
    { t: T1, texto: `Los dos iones entran en la ${celda.replace(/^Celda /i, 'celda ')} con casi la misma energía cinética${escudo ? ', porque el ShieldTorch estrecha la distribución de energía de los iones' : ''}. La celda está llena de helio y el ${guia.toLowerCase()} de RF los mantiene cerca del eje.` },
    { t: T2, texto: 'El ArCl⁺, formado por dos átomos, es más voluminoso que el As⁺: su sección eficaz de colisión es mayor y choca más veces con el helio. Como en cada choque pierde energía, sale de la celda más lento que el As⁺.' },
    { t: T3, texto: 'A la salida hay una barrera de potencial: el sesgo del cuadrupolo es unos voltios más positivo que el del octopolo. El As⁺ conserva energía suficiente y la supera; el ArCl⁺, frenado, es rechazado. Es discriminación por energía, no una reacción.' },
    { t: T4, texto: 'En m/z 75 desaparece casi toda la señal del ArCl⁺ y queda la del arsénico, que también pierde algo de señal, aunque mucho menos. Las mismas condiciones de helio eliminan a la vez otras interferencias poliatómicas, como ArO⁺ sobre ⁵⁶Fe o Ar₂⁺ sobre ⁸⁰Se.' },
  ];

  /* --- geometría --- */
  const EJE = 102, XC0 = 150, XC1 = 470, XB = 482; // celda y barrera
  const EBAR = 0.58;                               // altura de la barrera (fracción de la energía de entrada)
  const KEEP = 0.9;                                // energía que conserva el ion en cada choque con He (M = 75, m = 4: pérdida media ≈ 10 %)
  // posiciones de los choques: el poliatómico choca más veces (mayor sección eficaz)
  const CH = { as: [235, 330, 425], arcl: [176, 208, 246, 284, 318, 352, 392, 428] };
  function simular(choques, y) {
    const pts = []; let x = 40, E = 1, t = T1 - 1.2, i = 0, vuelta = false;
    while (t < DUR + 0.1) {
      pts.push({ t, x, E, n: i, vuelta });
      const v = 92 * Math.sqrt(Math.max(E, 0.02));
      if (!vuelta) {
        x += v * 0.01;
        if (i < choques.length && x >= choques[i]) { E *= KEEP; i++; pts[pts.length - 1].choque = true; }
        if (x >= XB - 6 && E < EBAR) vuelta = true;
      } else { x -= 22 * 0.01; E = Math.max(0.05, E - 0.004); }
      t += 0.01;
    }
    return { pts, y };
  }
  const SIM = { as: simular(CH.as, EJE), arcl: simular(CH.arcl, EJE) };
  const en = (s, t) => { const P = SIM[s].pts; const i = clamp(Math.round((t - P[0].t) / 0.01), 0, P.length - 1); return P[i]; };
  const Efin = { as: KEEP ** CH.as.length, arcl: KEEP ** CH.arcl.length };

  return {
    titulo: 'Celda de colisión con He (KED)',
    dur: DUR,
    fases,
    dibujar(g, t) {
      const C = g.C;
      const cAs = C.m[2], cArCl = C.m[4];

      /* ===== piezas ===== */
      g.flecha(6, EJE, 34, EJE, { color: C.tenue, lw: 1.2, punta: 6 });
      g.texto(`Desde ${origen}`, 8, EJE - 40, { size: 9.5, color: C.tenue });
      g.camara(XC0 - 12, 44, XC1 - XC0 + 24, 116, { titulo: `${celda} · ${guia.toLowerCase()} con He` });
      for (const sg of [-1, 1]) g.electrodo(XC0, EJE + sg * 30 - 4, XC1 - XC0, 8, {});
      g.electrodo(XC0 - 12, EJE - 54, 6, 44, { color: C.metalOsc }); g.electrodo(XC0 - 12, EJE + 10, 6, 44, { color: C.metalOsc });
      gasRect(g, XC0 - 4, 52, XC1 - XC0 + 8, 100, t, { n: 30, semilla: 9, alpha: 0.5, r: 1.9 });
      g.linea([[310, 16], [310, 44]], { color: C.metalOsc, lw: 5 }); g.linea([[310, 16], [310, 44]], { color: C.metal, lw: 2.5 });
      g.texto('He', 318, 22, { size: 10, color: C.texto2, weight: 700 });
      // lente de salida / barrera
      const kBar = tramo(t, T3 - 0.3, T3 + 0.2);
      g.electrodo(XB, EJE - 54, 7, 44, { color: kBar > 0 ? C.calor : C.metalOsc, alpha: 0.6 + 0.4 * (kBar > 0 ? 1 : 0) });
      g.electrodo(XB, EJE + 10, 7, 44, { color: kBar > 0 ? C.calor : C.metalOsc, alpha: 0.6 + 0.4 * (kBar > 0 ? 1 : 0) });
      if (kBar > 0) g.texto('+', XB + 3.5, EJE - 62, { size: 13, color: C.calor, align: 'center', weight: 800, alpha: kBar });
      g.rotulo('Barrera de salida', XB + 4, 172, { size: 9.5, color: kBar > 0 ? C.calor : C.texto2 });
      for (const sg of [-1, 1]) g.electrodo(504, EJE + sg * 22 - 4, 136, 8, {});
      g.rotulo('Cuadrupolo', 572, EJE - 46, { size: 10 });

      /* ===== iones ===== */
      const dibIon = (s, P, dy) => {
        const x = P.x, y = EJE + dy + (x > XC0 && x < XC1 ? Math.sin(x * 0.11 + dy) * 3 : 0);
        const al = P.vuelta ? 1 - tramo(P.x, XC1 - 10, XC1 - 90) * 0 - tramo(t, T3 + 1.6, T3 + 3) : 1;
        if (al <= 0 || x > 645) return null;
        if (s === 'as') g.ion(x, y, { r: 6.5, color: cAs, alpha: al });
        else {
          g.circulo(x - 5, y, 6.2, { fill: cArCl, alpha: al });
          g.circulo(x + 5.5, y, 5.6, { fill: cArCl, alpha: al * 0.85 });
          g.texto('+', x, y + 0.5, { size: 9, color: '#fff', align: 'center', weight: 800, alpha: al });
        }
        return [x, y, al];
      };
      const tIon = Math.max(t, T1 - 1.2);
      const Pa = en('as', tIon), Pc = en('arcl', tIon);
      const ia = dibIon('as', Pa, -14), ic = dibIon('arcl', Pc, 14);
      // destellos de choque con He
      for (const [s, P0, dy, col] of [['as', Pa, -14, cAs], ['arcl', Pc, 14, cArCl]]) {
        for (const xc of CH[s]) {
          const pts = SIM[s].pts; let tc = null;
          for (const q of pts) if (q.choque && Math.abs(q.x - xc) < 3) { tc = q.t; break; }
          if (tc == null) continue;
          const k = tramo(t, tc, tc + 0.45);
          if (k > 0 && k < 1) {
            g.circulo(xc + 6, EJE + dy + (dy < 0 ? -8 : 8) - k * (dy < 0 ? 16 : -16), 2.6, { fill: C.gas, alpha: 1 - k });
            g.circulo(xc, EJE + dy, 5 + 12 * k, { stroke: col, lw: 1.3, alpha: 1 - k });
          }
        }
        void P0;
      }
      if (t < T2 + 1) {
        const a = tramo(t, 0.4, 0.9) * (1 - tramo(t, T2 + 0.5, T2 + 1));
        if (ia) g.rotulo('⁷⁵As⁺  (m/z 74,92)', Math.max(ia[0], 92), EJE - 38, { size: 10, color: cAs, alpha: a });
        if (ic) g.rotulo('⁴⁰Ar³⁵Cl⁺  (m/z 74,93)', Math.max(ic[0], 100), EJE + 40, { size: 10, color: cArCl, alpha: a });
      }
      if (t >= T3 + 0.4 && t < T4) {
        const a = tramo(t, T3 + 0.4, T3 + 0.8) * (1 - tramo(t, T4 - 0.3, T4));
        g.rotulo('As⁺ supera la barrera', 572, EJE + 42, { size: 9.5, color: cAs, alpha: a });
        g.rotulo('ArCl⁺ rechazado', 410, 140, { size: 9.5, color: cArCl, alpha: a });
      }

      /* ===== energía cinética a lo largo de la celda ===== */
      const GY = 186, GH = 76, gx = (x) => x, gy = (E) => GY + GH - 12 - E * (GH - 26);
      g.rect(10, GY, 620, GH, { fill: C.panel, stroke: C.linea, r: 4 });
      g.texto('Energía cinética de cada ion', 18, GY + 10, { size: 9.5, color: C.texto2, weight: 600 });
      g.linea([[XC0, gy(0)], [600, gy(0)]], { color: C.tenue, lw: 0.8 });
      g.texto('entrada', XC0, GY + GH - 4, { size: 8.5, color: C.tenue, align: 'center' });
      g.texto('salida', XB, GY + GH - 4, { size: 8.5, color: C.tenue, align: 'center' });
      // barrera
      g.linea([[XC0, gy(EBAR)], [XB - 4, gy(EBAR)]], { color: C.calor, lw: 1, dash: [4, 3], alpha: 0.4 + 0.6 * kBar });
      g.rect(XB - 4, gy(EBAR), 16, gy(0) - gy(EBAR), { fill: C.calor, alpha: 0.18 + 0.3 * kBar });
      g.texto('barrera', XB + 16, gy(EBAR) + 2, { size: 9, color: C.calor, weight: 600 });
      for (const [s, col] of [['as', cAs], ['arcl', cArCl]]) {
        const pts = [];
        for (const q of SIM[s].pts) { if (q.t > tIon) break; if (q.x >= XC0 - 20 && q.x <= 590 && !q.vuelta) pts.push([gx(Math.max(q.x, XC0 - 20)), gy(q.E)]); }
        g.linea(pts, { color: col, lw: 1.8 });
      }
      g.texto('As⁺', 596, gy(Efin.as), { size: 9.5, color: cAs, weight: 700, alpha: tramo(t, T3, T3 + 0.3) });
      g.texto('ArCl⁺', 466, gy(Efin.arcl) + 9, { size: 9.5, color: cArCl, weight: 700, align: 'right', alpha: tramo(t, T3 - 0.5, T3) });

      /* ===== distribuciones de energía a la salida ===== */
      const BY = 270, BH = 76;
      g.rect(10, BY, 300, BH, { fill: C.panel, stroke: C.linea, r: 4 });
      g.texto('Distribución de energía', 18, BY + 10, { size: 9.5, color: C.texto2, weight: 600 });
      const dx0 = 22, dx1 = 298, dyb = BY + BH - 14, ex = (E) => lerp(dx0, dx1, E / 1.15);
      g.linea([[dx0, dyb], [dx1, dyb]], { color: C.tenue, lw: 0.8 });
      g.texto('E', dx1, dyb + 8, { size: 9, color: C.tenue, align: 'right', italic: true });
      const prog = (s) => { const q = en(s, Math.min(tIon, T3)); return q.vuelta ? Efin[s] : q.E; };
      for (const [s, col] of [['as', cAs], ['arcl', cArCl]]) {
        const m = prog(s), pts = [];
        for (let i = 0; i <= 80; i++) { const E = (i / 80) * 1.15; pts.push([ex(E), dyb - Math.exp(-(((E - m) / 0.06) ** 2)) * (BH - 32)]); }
        g.linea([[ex(0), dyb], ...pts, [ex(1.15), dyb]], { fill: col + '30' });
        g.linea(pts, { color: col, lw: 1.6 });
      }
      g.linea([[ex(EBAR), BY + 18], [ex(EBAR), dyb]], { color: C.calor, lw: 1.2, dash: [3, 2], alpha: 0.4 + 0.6 * kBar });
      g.texto('barrera', ex(EBAR) + 4, BY + 22, { size: 9, color: C.calor, alpha: 0.4 + 0.6 * kBar });

      /* ===== espectro en m/z 75 ===== */
      const SX = 320, SW = 310;
      g.rect(SX, BY, SW, BH, { fill: C.panel, stroke: C.linea, r: 4 });
      g.texto('Señal en m/z 75', SX + 8, BY + 10, { size: 9.5, color: C.texto2, weight: 600 });
      const a5 = tramo(t, T4, T4 + 0.4);
      const yb = BY + BH - 14, hmax = BH - 32;
      const barra = (x, hAs, hCl, nom, al) => {
        g.rect(x - 14, yb - hAs * hmax, 28, hAs * hmax, { fill: cAs, alpha: 0.9 * al });
        if (hCl > 0) g.rect(x - 14, yb - (hAs + hCl) * hmax, 28, hCl * hmax, { fill: cArCl, alpha: 0.9 * al });
        g.texto(nom, x, yb + 8, { size: 9, color: C.tenue, align: 'center', alpha: al });
      };
      g.linea([[SX + 10, yb], [SX + SW - 10, yb]], { color: C.tenue, lw: 0.8 });
      barra(SX + 80, 0.25, 0.75, 'sin gas', 1);
      if (a5 > 0) barra(SX + 210, 0.17, 0.012, 'modo He', a5);
      else g.texto('modo He: …', SX + 210, yb - 20, { size: 9.5, color: C.tenue, align: 'center' });

      g.leyenda([[cAs, '⁷⁵As⁺'], [cArCl, '⁴⁰Ar³⁵Cl⁺'], [C.gas, 'He']], 14, 354, { size: 9.5 });
      void suave; void easeOut;
    },
  };
}
