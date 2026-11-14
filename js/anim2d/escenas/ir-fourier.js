// Del interferograma al espectro: el interferograma como suma de cosenoides, la transformada de Fourier que recupera la amplitud de
// cada número de onda, la resolución (dos líneas separadas Δσ necesitan un retardo máximo ≥ 1/Δσ), la apodización y el cociente
// muestra/fondo que da la transmitancia y la absorbancia. Escena sin estado (todas las curvas son analíticas).
// Parámetros opcionales: p.resolucion (texto de la resolución máxima del equipo), p.software (texto).
import { tramo, suave, lerp } from '../dibujo.js';

export default function crear(p = {}) {
  const res = p.resolucion || '0,9 cm⁻¹';
  const sw = p.software || 'el ordenador';
  const COMP = [[1.0, 1.0], [1.47, 0.55], [2.13, 0.8]];       // [número de onda relativo, amplitud]
  const sinc = (x) => (Math.abs(x) < 1e-6 ? 1 : Math.sin(x) / x);
  // forma de línea (ILS) de una línea en σ0 truncada a ±D: rectangular → sinc; Happ-Genzel → lóbulos menores y algo más ancha
  const ils = (ds, D, hg) => {
    if (!hg) return sinc(2 * Math.PI * ds * D);
    const a = 0.54, b = 0.46;   // ventana coseno elevado: suma de tres sinc desplazados
    const f = (s) => sinc(2 * Math.PI * s * D);
    return (a * f(ds) + (b / 2) * (f(ds - 1 / (2 * D)) + f(ds + 1 / (2 * D)))) / a;
  };

  return {
    titulo: 'Transformada de Fourier: del interferograma al espectro',
    dur: 25,
    fases: [
      { t: 0, texto: 'Cada número de onda σ que llega al detector aporta al interferograma una cosenoide cos(2πσδ), con una amplitud proporcional a su intensidad. El interferograma es la suma de todas ellas; con un espectro continuo solo se suman en fase en δ = 0.' },
      { t: 5, texto: `La transformada de Fourier, que calcula ${sw}, hace el camino inverso: mide cuánto hay de cada frecuencia en el interferograma. El resultado es el espectro de haz simple.` },
      { t: 10, texto: `Resolución: dos líneas separadas Δσ solo se distinguen si el espejo recorre un retardo máximo δmax del orden de 1/Δσ. Para ${res} hace falta un recorrido de algo más de 1 cm de retardo.` },
      { t: 15.5, texto: 'Cortar el interferograma en ±δmax produce lóbulos a los lados de cada banda. La apodización (Happ-Genzel, triangular…) atenúa los extremos del interferograma: los lóbulos casi desaparecen a cambio de una banda algo más ancha.' },
      { t: 20, texto: 'El haz simple incluye la emisión de la fuente, el divisor, el detector y el aire. Se mide primero sin muestra (fondo, I₀) y luego con ella (I): T = I/I₀ y A = −log T. Así solo queda la absorción de la muestra.' },
    ],
    dibujar(g, t) {
      const C = g.C;
      const col = [C.m[0], C.m[2], C.m[1]];
      const ifg = (d, k = 1) => COMP.reduce((s, [sg, a]) => s + a * k * Math.cos(2 * Math.PI * sg * d), 0) / COMP.reduce((s, [, a]) => s + a, 0);
      if (t < 10) {
        /* --- interferograma y cosenoides --- */
        const X0 = 20, X1 = 340, xd = (d) => lerp(X0 + 8, X1 - 8, (d + 3) / 6);
        g.rect(X0, 24, X1 - X0, 92, { fill: C.panel, stroke: C.linea, r: 6 });
        g.texto('Interferograma', X0 + 8, 36, { size: 10, color: C.texto2, weight: 600 });
        const y1 = (v) => 74 - v * 34;
        const pts = []; for (let d = -3; d <= 3; d += 0.01) pts.push([xd(d), y1(ifg(d))]);
        g.linea(pts, { color: C.acento, lw: 1.6 });
        g.texto('δ', X1 - 10, 108, { size: 9.5, color: C.tenue, align: 'right' });
        COMP.forEach(([sg, a], i) => {
          const yc = 150 + i * 62, kk = suave(tramo(t, 0.6 + i * 0.6, 1.6 + i * 0.6));
          g.rect(X0, yc - 26, X1 - X0, 52, { fill: C.panel, stroke: C.linea, r: 6, alpha: kk });
          const q = []; for (let d = -3; d <= 3; d += 0.01) q.push([xd(d), yc - a * 18 * Math.cos(2 * Math.PI * sg * d)]);
          g.linea(q, { color: col[i], lw: 1.4, alpha: kk });
          g.rotulo(`σ${'₁₂₃'[i]}`, X0 + 4, yc - 13, { size: 10, color: col[i], align: 'left', alpha: kk });
          if (i < 2) g.texto('+', (X0 + X1) / 2, yc + 31, { size: 13, color: C.tenue, align: 'center', weight: 700, alpha: kk });
        });
        /* --- espectro --- */
        const S0 = 368, S1 = 626, SY = 290, kS = tramo(t, 5, 6);
        g.rect(S0, 24, S1 - S0, 300, { fill: C.panel, stroke: C.linea, r: 6, alpha: Math.max(0.3, kS) });
        g.texto('Espectro (haz simple)', S0 + 8, 36, { size: 10, color: C.texto2, weight: 600 });
        const xs = (s) => lerp(S0 + 20, S1 - 16, (s - 0.6) / 1.9);
        g.linea([[S0 + 14, SY], [S1 - 10, SY]], { color: C.tenue, lw: 0.8 });
        g.texto('número de onda σ →', S1 - 10, SY + 14, { size: 9, color: C.tenue, align: 'right' });
        COMP.forEach(([sg, a], i) => {
          const kk = suave(tramo(t, 5.6 + i * 0.9, 6.6 + i * 0.9));
          if (!kk) return;
          g.linea([[xs(sg), SY], [xs(sg), SY - a * 210 * kk]], { color: col[i], lw: 5, cap: 'butt' });
          g.texto(`σ${'₁₂₃'[i]}`, xs(sg), SY - a * 210 * kk - 10, { size: 10, color: col[i], align: 'center', weight: 700 });
          const yc = 150 + i * 62;
          g.flecha(X1 + 4, yc, xs(sg) - 8, SY - a * 105, { color: col[i], lw: 1, punta: 6, alpha: 0.5 * kk });
        });
        if (kS > 0) g.rotulo('FT', 354, 186, { size: 11, color: C.acento, alpha: kS });
      } else if (t < 20) {
        /* --- resolución y apodización: dos líneas próximas --- */
        const apod = t >= 15.5;
        const kD = apod ? 1 : suave(tramo(t, 10.4, 14.6));
        const D = lerp(0.35, 2.2, kD);                 // retardo máximo (en unidades de 1/Δσ: las líneas se separan Δσ = 1)
        const X0 = 20, X1 = 300;
        g.rect(X0, 24, X1 - X0, 300, { fill: C.panel, stroke: C.linea, r: 6 });
        g.texto('Interferograma de dos líneas', X0 + 8, 36, { size: 10, color: C.texto2, weight: 600 });
        const xd = (d) => lerp(X0 + 10, X1 - 10, (d + 2.4) / 4.8), yi = (v) => 130 - v * 70;
        // dos líneas en σ = 6 y 7 (unidades arbitrarias): batido de periodo 1/Δσ
        const f2 = (d) => (Math.cos(2 * Math.PI * 6 * d) + Math.cos(2 * Math.PI * 7 * d)) / 2;
        const w = (d) => (apod ? 0.54 + 0.46 * Math.cos((Math.PI * d) / D) : 1);
        const pg = [], pa = [];
        for (let d = -2.4; d <= 2.4; d += 0.004) { pg.push([xd(d), yi(f2(d))]); if (Math.abs(d) <= D) pa.push([xd(d), yi(f2(d) * w(d))]); }
        g.linea(pg, { color: C.tenue, lw: 0.8, alpha: 0.5 });
        g.linea(pa, { color: C.acento, lw: 1.4 });
        g.rect(xd(-D), 66, xd(D) - xd(-D), 128, { stroke: C.acento, lw: 1, r: 3, alpha: 0.7 });
        g.texto(`−δmax`, xd(-D), 206, { size: 9.5, color: C.acento, align: 'center' });
        g.texto(`+δmax`, xd(D), 206, { size: 9.5, color: C.acento, align: 'center' });
        g.texto(`δmax = ${D.toFixed(2).replace('.', ',')} / Δσ`, (X0 + X1) / 2, 236, { size: 12, weight: 700, align: 'center' });
        g.texto(D < 0.6 ? 'Las dos líneas salen fundidas' : 'Las dos líneas quedan separadas', (X0 + X1) / 2, 258, { size: 10.5, color: D < 0.6 ? C.mal : C.ok, align: 'center', weight: 600 });
        if (apod) g.texto('Ventana de Happ-Genzel aplicada', (X0 + X1) / 2, 280, { size: 10, color: C.texto2, align: 'center' });
        // espectro calculado
        const S0 = 318, S1 = 626;
        g.rect(S0, 24, S1 - S0, 300, { fill: C.panel, stroke: C.linea, r: 6 });
        g.texto('Espectro calculado', S0 + 8, 36, { size: 10, color: C.texto2, weight: 600 });
        const xs = (s) => lerp(S0 + 14, S1 - 14, (s - 3.5) / 6), ys = (v) => 262 - v * 170;
        g.linea([[S0 + 10, ys(0)], [S1 - 10, ys(0)]], { color: C.tenue, lw: 0.8 });
        const curva = (hg, color, lw, dash) => {
          const q = []; for (let s = 3.5; s <= 9.5; s += 0.01) q.push([xs(s), ys(((ils(s - 6, D, hg) + ils(s - 7, D, hg)) / 2) * 0.95)]);
          g.linea(q, { color, lw, dash });
        };
        if (apod) { curva(false, C.tenue, 1, [4, 3]); curva(true, C.acento, 1.8); g.texto('- - rectangular (lóbulos)', S1 - 12, 50, { size: 9.5, color: C.tenue, align: 'right' }); g.texto('Happ-Genzel', S1 - 12, 64, { size: 9.5, color: C.acento, align: 'right' }); }
        else curva(false, C.acento, 1.8);
        for (const s of [6, 7]) { g.linea([[xs(s), ys(0) + 2], [xs(s), ys(0) + 8]], { color: C.texto2, lw: 1 }); }
        g.texto('Δσ', xs(6.5), ys(0) + 18, { size: 10, color: C.texto2, align: 'center', weight: 700 });
      } else {
        /* --- fondo, muestra, transmitancia y absorbancia --- */
        const k = tramo(t, 20, 21);
        const xs = (s, A, B) => lerp(A, B, (4000 - s) / 3600);
        const fondo = (s) => Math.exp(-(((s - 1700) / 1500) ** 2)) * (1 - 0.35 * Math.exp(-(((s - 2350) / 25) ** 2)));
        const bandas = (s) => 0.85 * Math.exp(-(((s - 1715) / 18) ** 2)) + 0.5 * Math.exp(-(((s - 1365) / 16) ** 2)) + 0.45 * Math.exp(-(((s - 1220) / 18) ** 2)) + 0.15 * Math.exp(-(((s - 2960) / 30) ** 2));
        const panel = (x0, y0, w, h, tit, f, color, max = 1, eti) => {
          g.rect(x0, y0, w, h, { fill: C.panel, stroke: C.linea, r: 6, alpha: k });
          g.texto(tit, x0 + 8, y0 + 12, { size: 10, color: C.texto2, weight: 600, alpha: k });
          const q = []; for (let s = 4000; s >= 400; s -= 8) q.push([xs(s, x0 + 10, x0 + w - 10), y0 + h - 12 - (f(s) / max) * (h - 34)]);
          g.linea(q, { color, lw: 1.5, alpha: k });
          if (eti) g.texto(eti, x0 + w - 10, y0 + 12, { size: 9, color: C.tenue, align: 'right', alpha: k });
        };
        panel(20, 26, 296, 140, 'Fondo I₀ (sin muestra)', fondo, C.tenue, 1, 'CO₂ ≈ 2350 cm⁻¹');
        panel(20, 180, 296, 140, 'Muestra I', (s) => fondo(s) * 10 ** -bandas(s), C.acento);
        const k2 = tramo(t, 21.5, 22.5);
        if (k2 > 0) {
          panel(330, 26, 296, 140, 'T = I / I₀', (s) => 10 ** -bandas(s), C.ok, 1.05, '%T');
          panel(330, 180, 296, 140, 'A = −log T', (s) => bandas(s), C.ion, 0.95, 'absorbancia');
          g.texto('C=O', xs(1715, 340, 616) - 6, 222, { size: 9.5, color: C.ion, align: 'right', weight: 700, alpha: k2 });
        }
        g.flecha(318, 96, 330, 96, { color: C.tenue, lw: 1.2, alpha: k2 });
      }
    },
  };
}
