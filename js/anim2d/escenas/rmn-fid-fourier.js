// RMN: del FID al espectro. Cada grupo de protones aporta una oscilación amortiguada a su frecuencia (respecto a la portadora); el
// receptor registra la suma, el FID. La transformada de Fourier da líneas lorentzianas en esas frecuencias, con área ∝ número de H y
// anchura Δν½ = 1/(πT₂*). Un shim deficiente acorta T₂* y ensancha las líneas; promediar NS transitorios mejora la S/R como √NS.
// Por simplicidad, las tres señales se dibujan sin acoplamiento (singletes) y con pocas oscilaciones.
// Parámetros: p.grupos ([[δ, nH, etiqueta]…], acetato de etilo por defecto).
import { tramo, suave, lerp, azar } from '../dibujo.js';
import { num } from './util-analizadores.js';

export default function crear(p = {}) {
  const G = p.grupos || [[4.12, 2, 'OCH₂'], [2.05, 3, 'CH₃CO'], [1.26, 3, 'CH₃']];
  const ppmA = 5, ppmB = 0;                                    // ventana del espectro
  const fr = G.map(([d]) => 4 + (ppmA - d) * 4.2);              // ciclos en la ventana del FID (esquema)
  const amp = G.map(([, n]) => n / 3);
  const R = azar(5), ruido = Array.from({ length: 401 }, () => (R() + R() + R() - 1.5) * 0.9);
  const ruidoS = Array.from({ length: 401 }, () => (R() + R() + R() - 1.5) * 0.9);
  const T1a = 4.2, T2a = 8.2, TS = 12.4, TN = 16.6, dur = 22;
  const T2 = (t) => lerp(0.45, 0.13, suave(tramo(t, TS, TS + 1.6)) * (1 - suave(tramo(t, TN - 0.6, TN))));
  const NS = (t) => (t < TN ? 1 : t < TN + 1.8 ? 4 : 16);

  return {
    titulo: 'Del FID al espectro: la transformada de Fourier',
    dur,
    fases: [
      { t: 0, texto: 'Tras el pulso, cada grupo de protones químicamente equivalentes precesa a su propia frecuencia e induce en la bobina una oscilación que se amortigua. Su amplitud es proporcional al número de protones del grupo.' },
      { t: T1a, texto: 'El receptor no puede separarlas: registra la suma, el FID, en función del tiempo. Se digitaliza en cuadratura (dos componentes, real e imaginaria) respecto a la frecuencia de la portadora.' },
      { t: T2a, texto: 'La transformada de Fourier descompone el FID en las frecuencias que contiene: cada oscilación da una línea en su desplazamiento químico, y el área de la línea es proporcional a su amplitud inicial, es decir, al número de H.' },
      { t: TS, texto: 'Si el campo no es homogéneo (mal shim), las señales se desfasan antes: el FID se apaga más deprisa y las líneas se ensanchan, porque Δν½ = 1/(πT₂*). Las alturas bajan y los multipletes se confunden.' },
      { t: TN, texto: 'El ruido es aleatorio y la señal se repite igual en cada transitorio: al sumar NS transitorios, la señal crece como NS y el ruido como √NS. Con 16 transitorios, la relación señal/ruido es cuatro veces mayor.' },
    ],
    dibujar(g, t) {
      const C = g.C;
      const ns = NS(t), kr = 1 / Math.sqrt(ns), T = T2(t);
      /* --- componentes --- */
      const X0 = 14, W = 300, x0 = X0 + 12, w = W - 24;
      g.rect(X0, 10, W, 340, { fill: C.panel, stroke: C.linea, r: 8 });
      g.texto('Señal de cada grupo', X0 + 12, 24, { size: 11, color: C.texto2, weight: 700 });
      const kC = 1 - 0.55 * suave(tramo(t, T1a, T1a + 1));
      G.forEach(([d, n, lab], i) => {
        const yc = 64 + i * 48, a = suave(tramo(t, 0.4 + i * 0.9, 1.4 + i * 0.9));
        const q = [];
        for (let k = 0; k <= 300; k++) { const u = k / 300; q.push([x0 + u * w, yc - 16 * amp[i] * Math.exp(-u / T) * Math.cos(2 * Math.PI * fr[i] * u)]); }
        g.linea(q, { color: C.m[i], lw: 1.2, alpha: a * kC });
        g.texto(`${lab} · ${num(d, 2)} ppm · ${n} H`, x0 + w, yc - 20, { size: 9.5, color: C.m[i], align: 'right', weight: 600, alpha: a * kC });
      });
      // FID suma (con ruido)
      const kF = suave(tramo(t, T1a, T1a + 1));
      const yF = 268;
      g.texto('FID = suma', X0 + 12, yF - 62, { size: 11, color: C.texto2, weight: 700, alpha: kF });
      g.linea([[x0, yF], [x0 + w, yF]], { color: C.rejilla, lw: 1, alpha: kF });
      const q = [];
      for (let k = 0; k <= 400; k++) {
        const u = k / 400; let v = 0;
        G.forEach((_, i) => { v += amp[i] * Math.exp(-u / T) * Math.cos(2 * Math.PI * fr[i] * u); });
        q.push([x0 + u * w, yF - 17 * v - 4 * ruido[k] * kr]);
      }
      g.linea(q, { color: C.e, lw: 1.1, alpha: kF });
      g.linea(Array.from({ length: 41 }, (_, k) => { const u = k / 40; return [x0 + u * w, yF - 17 * 2.67 * Math.exp(-u / T)]; }), { color: C.tenue, lw: 1, dash: [3, 3], alpha: kF });
      g.texto('t →', x0 + w, yF + 62, { size: 9.5, color: C.tenue, align: 'right', alpha: kF });
      g.texto(`T₂* ${T < 0.3 ? 'corto (shim deficiente)' : 'largo (buen shim)'}`, X0 + 12, 336, { size: 10, color: T < 0.3 ? C.mal : C.ok, weight: 600, alpha: kF });
      if (t >= TN) g.texto(`NS = ${ns}`, X0 + W - 12, 336, { size: 11, color: C.acento, weight: 700, align: 'right' });

      /* --- transformada y espectro --- */
      const kE = suave(tramo(t, T2a, T2a + 1.2));
      g.flecha(X0 + W + 6, 180, X0 + W + 36, 180, { color: C.acento, lw: 2, punta: 8, alpha: kE });
      g.texto('FT', X0 + W + 21, 166, { size: 11, color: C.acento, weight: 700, align: 'center', alpha: kE });
      const S0 = 354, SW = 272, sx0 = S0 + 12, sw = SW - 24, yb = 300;
      g.rect(S0, 10, SW, 340, { fill: C.panel, stroke: C.linea, r: 8, alpha: Math.max(0.35, kE) });
      g.texto('Espectro', S0 + 12, 24, { size: 11, color: C.texto2, weight: 700, alpha: kE });
      const X = (pp) => sx0 + ((ppmA - pp) / (ppmA - ppmB)) * sw;
      // anchura en ppm del esquema: proporcional a 1/T₂*
      const gam = 0.022 / (T / 0.45);
      const hmax = 3 / gam;
      const pts = [];
      for (let k = 0; k <= 400; k++) {
        const pp = ppmA - (k / 400) * (ppmA - ppmB); let v = 0;
        G.forEach(([d, n]) => { v += (n / gam) / (1 + ((pp - d) / gam) ** 2); });
        pts.push([X(pp), yb - (v / (3 / 0.022)) * 220 - 6 * ruidoS[k] * kr]);
      }
      if (kE > 0) {
        g.linea([[sx0, yb], [sx0 + sw, yb]], { color: C.tenue, lw: 1, alpha: kE });
        g.linea(pts, { color: C.texto2, lw: 1.3, alpha: kE });
        for (let pp = 0; pp <= 5; pp++) g.texto(String(pp), X(pp), yb + 12, { size: 10, color: C.tenue, align: 'center', alpha: kE });
        g.texto('δ (ppm)', sx0 + sw, yb + 28, { size: 9.5, color: C.tenue, align: 'right', alpha: kE });
        G.forEach(([d, n, lab], i) => {
          const h = ((n / gam) / (3 / 0.022)) * 220;
          g.texto(lab, X(d), Math.max(44, yb - h - 10), { size: 10, color: C.m[i], weight: 700, align: 'center', alpha: kE });
          g.texto(`${n} H`, X(d), yb + 26, { size: 9.5, color: C.m[i], align: 'center', alpha: kE });
        });
        void hmax;
        if (t > TS + 0.8 && t < TN) {
          const d = G[1][0], hw = gam, ym = yb - (((G[1][1] / gam) / (3 / 0.022)) * 220) / 2;
          g.flecha(X(d + hw) - 18, ym, X(d + hw), ym, { color: C.mal, lw: 1.2, punta: 5 });
          g.flecha(X(d - hw) + 18, ym, X(d - hw), ym, { color: C.mal, lw: 1.2, punta: 5 });
          g.texto('Δν½ = 1/(πT₂*)', X(d + hw) - 22, ym, { size: 10, color: C.mal, weight: 700, align: 'right' });
        }
        if (t >= TN) g.texto(`S/R ∝ √NS = ${num(Math.sqrt(ns), 0)}`, S0 + SW - 12, 24, { size: 11, color: C.acento, weight: 700, align: 'right' });
      }
    },
  };
}
