// Utilidades de las escenas de espectrofotometría UV-Vis (uv-*.js). No es una escena: el motor solo carga lo que se le pide por nombre.
import { clamp } from '../dibujo.js';

/** Color CSS aproximado de una longitud de onda (nm). El UV y el IR cercano se pintan con un color simbólico. */
export function colorNm(l, alpha = 1) {
  let r = 0, g = 0, b = 0;
  if (l < 380) return `rgba(150, 110, 255, ${alpha})`;
  if (l > 780) return `rgba(150, 40, 40, ${alpha})`;
  if (l < 440) { r = -(l - 440) / 60; b = 1; } else if (l < 490) { g = (l - 440) / 50; b = 1; } else if (l < 510) { g = 1; b = -(l - 510) / 20; }
  else if (l < 580) { r = (l - 510) / 70; g = 1; } else if (l < 645) { r = 1; g = -(l - 645) / 65; } else r = 1;
  const k = l < 420 ? 0.45 + 0.55 * (l - 380) / 40 : l > 700 ? 0.45 + 0.55 * (780 - l) / 80 : 1;
  return `rgba(${Math.round(255 * r * k)}, ${Math.round(255 * g * k)}, ${Math.round(255 * b * k)}, ${alpha})`;
}

const gs = (x, m, s) => Math.exp(-0.5 * ((x - m) / s) ** 2);
/** Energía relativa que aporta cada lámpara al haz (forma aproximada; se igualan hacia 300–350 nm, como indica Shimadzu). */
const contD2 = (l) => (l < 188 ? 0 : (1 - Math.exp(-(l - 188) / 6)) * Math.exp(-(l - 188) / 55));
let maxD2 = 0; for (let l = 188; l < 300; l += 0.5) maxD2 = Math.max(maxD2, contD2(l));
export const energiaD2 = (l) => (0.92 * contD2(l)) / maxD2 + 0.12 * gs(l, 486, 2.2) + 0.22 * gs(l, 656.1, 2.4);
export const energiaWI = (l) => (1 / (1 + Math.exp(-(l - 340) / 20))) * Math.exp(-(((l - 650) / 380) ** 2));

/** Dibuja una cubeta vista de lado (rectángulo con paredes) con líquido de un color dado. */
export function cubeta(g, x, y, w, h, { liquido, alpha = 1, etiqueta } = {}) {
  const C = g.C;
  if (liquido) g.rect(x + 3, y + 10, w - 6, h - 13, { fill: liquido, alpha: 0.55 * alpha });
  g.rect(x, y, w, h, { stroke: C.texto2, lw: 1.6, r: 3, alpha });
  g.linea([[x + 3, y + 10], [x + w - 3, y + 10]], { color: C.liquido, lw: 1, alpha: 0.6 * alpha });
  if (etiqueta) g.texto(etiqueta, x + w / 2, y + h + 12, { size: 10, color: C.texto2, align: 'center', weight: 600, alpha });
}

/** Número con coma decimal. */
export const coma = (v, d = 2) => v.toFixed(d).replace('.', ',').replace('-', '−');
export { clamp };
