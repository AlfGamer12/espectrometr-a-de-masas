// Utilidades compartidas por las escenas de detección, vacío y cromatografía (no es una escena: no exporta crear()).
import { azar, clamp } from '../dibujo.js';

/** Punto de una curva de Bézier cuadrática. */
export const bez = (p0, p1, p2, k) => {
  const a = (1 - k) * (1 - k), b = 2 * (1 - k) * k, c = k * k;
  return [a * p0[0] + b * p1[0] + c * p2[0], a * p0[1] + b * p1[1] + c * p2[1]];
};

/** Polilínea muestreada con longitud acumulada: devuelve f(s 0…1) → { x, y, nx, ny } (punto y normal unitaria). */
export function recorrido(pts, n = 200) {
  const ks = [];
  // densifica con Catmull-Rom para que la normal varíe suave
  const P = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    for (let k = 0; k < 12; k++) {
      const u = k / 12, u2 = u * u, u3 = u2 * u;
      P.push([0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * u + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * u2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * u3),
        0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * u + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * u2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * u3)]);
    }
  }
  P.push(pts[pts.length - 1]);
  let L = 0; ks.push(0);
  for (let i = 1; i < P.length; i++) { L += Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]); ks.push(L); }
  return (s) => {
    const d = clamp(s) * L;
    let i = 1; while (i < ks.length - 1 && ks[i] < d) i++;
    const a = P[i - 1], b = P[i], f = (d - ks[i - 1]) / Math.max(1e-6, ks[i] - ks[i - 1]);
    const dx = b[0] - a[0], dy = b[1] - a[1], m = Math.hypot(dx, dy) || 1;
    return { x: a[0] + dx * f, y: a[1] + dy * f, nx: -dy / m, ny: dx / m };
  };
}

/**
 * Reparto cromatográfico: cada molécula alterna entre la fase móvil (avanza a velocidad u) y la estacionaria (quieta).
 * El tiempo medio en la fase estacionaria es k veces el de la móvil, así que la banda avanza a u/(1 + k), como en la teoría.
 * comps: [{ k(t) }]. Devuelve tablas precalculadas (la escena se dibuja como función pura de t).
 */
export function simularReparto({ comps, n = 22, dur, tIny, x0, x1, u, dwell = 0.12, ancho = 10, semilla = 5, regular = 6 }) {
  const paso = 1 / 30, sub = 4, h = paso / sub, N = Math.ceil(dur / paso) + 2;
  const R = azar(semilla), mols = [];
  // Duración de cada estancia: media × Gamma(regular)/regular. Con regular = 1 sería exponencial (proceso real, millones de saltos);
  // aquí, con pocas decenas de saltos visibles, se regulariza para que el ensanchamiento de las bandas no sea exagerado.
  const estancia = (media) => { let s = 0; for (let i = 0; i < regular; i++) s -= Math.log(1 - R()); return (media * s) / regular; };
  for (let c = 0; c < comps.length; c++) {
    for (let j = 0; j < n; j++) {
      const xs = new Float32Array(N), est = new Uint8Array(N);
      let x = x0 + (R() - 0.5) * ancho, movil = R() < 0.5, llegada = null;
      let resto = R() * dwell * (movil ? 1 : comps[c].k(tIny));
      for (let i = 0; i < N; i++) {
        for (let k = 0; k < sub; k++) {
          const t = i * paso + k * h;
          if (t < tIny) continue;
          if (llegada == null) {
            resto -= h;
            if (resto <= 0) { movil = !movil; resto = estancia(dwell * (movil ? 1 : comps[c].k(t))); }
            if (movil) x += u * h;
            if (x >= x1) llegada = t;
          } else { x += u * h; movil = true; }
        }
        xs[i] = x; est[i] = movil ? 1 : 0;
      }
      mols.push({ c, xs, est, llegada, sy: R(), sz: R(), lado: R() < 0.5 ? -1 : 1 });
    }
  }
  const pos = (m, t) => {
    const f = clamp(t / paso, 0, N - 1.001), i = Math.floor(f), r = f - i;
    return { x: m.xs[i] + (m.xs[i + 1] - m.xs[i]) * r, movil: m.est[i] === 1 };
  };
  // señal del detector: suma de gaussianas centradas en el instante de llegada de cada molécula
  const senal = (c, tt, sig = 0.22) => {
    let s = 0;
    for (const m of mols) if ((c == null || m.c === c) && m.llegada != null) { const d = (tt - m.llegada) / sig; if (d > -4 && d < 4) s += Math.exp(-0.5 * d * d); }
    return s;
  };
  return { mols, pos, senal, n };
}

/** Recorrido libre medio del aire (N₂) a 20 °C: λ = kT/(√2·π·d²·p) ≈ 6,6·10⁻³ Pa·m / p (d ≈ 0,37 nm). */
export const lambdaN2 = (pPa) => 6.6e-3 / pPa;

/** Formatea una longitud en metros con una cifra significativa y la unidad adecuada (coma decimal). */
export function fmtLong(m) {
  const u = [[1e3, 'km'], [1, 'm'], [1e-2, 'cm'], [1e-3, 'mm'], [1e-6, 'µm'], [1e-9, 'nm']];
  for (const [f, s] of u) if (m >= f * 0.95) { let v = m / f; v = v >= 10 ? Math.round(v / 10 ** Math.floor(Math.log10(v))) * 10 ** Math.floor(Math.log10(v)) : Math.round(v); return `${v.toLocaleString('es-ES')} ${s}`; }
  return `${m.toExponential(0)} m`;
}

/** Número en notación 10ⁿ con superíndices. */
const SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
export const pot10 = (n) => '10' + String(n).split('').map((c) => SUP[c]).join('');
