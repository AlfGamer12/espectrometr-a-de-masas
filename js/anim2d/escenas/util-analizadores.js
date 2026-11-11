// Utilidades compartidas por las escenas de analizadores (TOF, reflectrón, sectores, ICR).
// No es una escena: el motor solo carga los ficheros que se le piden por nombre.
import { clamp } from '../dibujo.js';

/** Constantes físicas (SI). */
export const FIS = { u: 1.66053907e-27, e: 1.602176634e-19 };

/** Número en formato español: coma decimal y espacio de millares a partir de 10 000 (como en el resto del sitio). */
export function num(x, dec = 0) {
  const s = Math.abs(x).toFixed(dec);
  let [ent, frac] = s.split('.');
  if (ent.length > 4) ent = ent.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return (x < 0 ? '−' : '') + ent + (frac ? ',' + frac : '');
}

export const gauss = (x, mu, sig) => Math.exp(-0.5 * ((x - mu) / sig) ** 2);

/**
 * Panel de señal: picos gaussianos de colores sobre un eje (u de 0 a 1), dibujado solo hasta u1 (la señal «se va registrando»).
 * picos: [{ u, s, a, color }] · ticks: [[u, texto]] · cursor: dibuja la línea del instante actual.
 */
export function panelSenal(g, x, y, w, h, { titulo, ejeX, ticks = [], picos = [], u1 = 1, cursor = false, alpha = 1, n = 220, escala = 1, nota } = {}) {
  const C = g.C;
  g.rect(x, y, w, h, { fill: C.panel, stroke: C.linea, r: 5 });
  const x0 = x + 10, x1 = x + w - 10, yb = y + h - 18, yt = y + 24;
  const X = (u) => x0 + u * (x1 - x0), Y = (v) => yb - clamp(v * escala, 0, 1.08) * (yb - yt);
  if (titulo) g.texto(titulo, x + 8, y + 11, { size: 11, color: C.texto2, weight: 600 });
  if (nota) g.texto(nota, x + w - 8, y + 11, { size: 10, color: C.tenue, align: 'right' });
  const uf = clamp(u1);
  // relleno de cada pico con su color
  for (const p of picos) {
    const a = p.u - 4 * p.s, b = Math.min(uf, p.u + 4 * p.s);
    if (b <= Math.max(0, a)) continue;
    const pts = [[X(Math.max(0, a)), yb]];
    for (let k = 0; k <= 40; k++) { const u = Math.max(0, a) + ((b - Math.max(0, a)) * k) / 40; pts.push([X(u), Y(p.a * gauss(u, p.u, p.s))]); }
    pts.push([X(b), yb]);
    g.linea(pts, { fill: p.color, alpha: 0.28 * alpha, cerrar: true });
  }
  // traza total
  const pts = [];
  for (let k = 0; k <= n; k++) {
    const u = (k / n) * uf;
    let v = 0;
    for (const p of picos) if (Math.abs(u - p.u) < 5 * p.s) v += p.a * gauss(u, p.u, p.s);
    pts.push([X(u), Y(v)]);
  }
  g.linea(pts, { color: C.texto2, lw: 1.3, alpha });
  g.linea([[x0, yb], [x1, yb]], { color: C.tenue, lw: 0.9 });
  for (const [u, txt] of ticks) {
    g.linea([[X(u), yb], [X(u), yb + 3]], { color: C.tenue, lw: 0.9 });
    g.texto(txt, X(u), yb + 9, { size: 10, color: C.tenue, align: 'center' });
  }
  if (ejeX) g.texto(ejeX, x1, y + h - 26, { size: 9, color: C.tenue, align: 'right' });
  if (cursor && uf > 0 && uf < 1) g.linea([[X(uf), yt - 4], [X(uf), yb]], { color: C.acento, lw: 1, dash: [3, 3], alpha: 0.8 });
  return { X, Y, yb, yt };
}

/** Leyenda con estilos de línea: [[color, texto, dash?]]. */
export function leyendaTrazos(g, items, x, y, { size = 10 } = {}) {
  const C = g.C;
  let cx = x;
  for (const [col, txt, dash] of items) {
    g.linea([[cx, y], [cx + 16, y]], { color: col, lw: 2, dash });
    g.texto(txt, cx + 21, y + 0.5, { size, color: C.texto2 });
    g.ctx.save(); g.ctx.font = `500 ${size}px 'Segoe UI', Inter, system-ui, sans-serif`; cx += g.ctx.measureText(txt).width + 36; g.ctx.restore();
  }
}

/** Destello circular breve (impacto en un detector o en una pared). k: 0…1 del destello. */
export function destello(g, x, y, k, { color, r = 12 } = {}) {
  if (k <= 0 || k >= 1) return;
  g.circulo(x, y, 3 + r * k, { stroke: color || g.C.foton, lw: 1.6, alpha: 1 - k });
  g.circulo(x, y, 3 * (1 - k) + 1, { fill: color || g.C.foton, alpha: 1 - k });
}
