// Utilidades compartidas por las escenas de fuentes de iones e introducción de muestra
// (electrospray, MALDI, extracción retardada, nebulizador, plasma e interfaz ICP).
// Todas son funciones puras: no guardan estado y dibujan con el pincel `g` de dibujo.js.

/** Parte fraccionaria (siempre en 0…1, también para negativos). */
export const frac = (x) => x - Math.floor(x);

/** Longitudes acumuladas de una polilínea. */
function acumular(pts) {
  const L = [0];
  for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  return L;
}

/** Punto de la polilínea a la fracción k (0…1) de su longitud. Devuelve [x, y, ángulo]. */
export function puntoEn(pts, k) {
  const L = acumular(pts), tot = L[L.length - 1];
  const d = Math.max(0, Math.min(1, k)) * tot;
  for (let i = 1; i < pts.length; i++) {
    if (d <= L[i] || i === pts.length - 1) {
      const s = L[i] - L[i - 1] || 1, u = (d - L[i - 1]) / s;
      const [x1, y1] = pts[i - 1], [x2, y2] = pts[i];
      return [x1 + (x2 - x1) * u, y1 + (y2 - y1) * u, Math.atan2(y2 - y1, x2 - x1)];
    }
  }
  return [pts[0][0], pts[0][1], 0];
}

/** Bézier cuadrática p0 → p2 con control p1, en k. */
export function bezier(p0, p1, p2, k) {
  const a = (1 - k) * (1 - k), b = 2 * k * (1 - k), c = k * k;
  return [a * p0[0] + b * p1[0] + c * p2[0], a * p0[1] + b * p1[1] + c * p2[1]];
}

/**
 * Corriente de gas: trazos cortos que avanzan por la polilínea `pts` (cíclica en el tiempo, sin saltos).
 * `n` trazos, `vel` en vueltas por segundo, `largo` del trazo en fracción de la longitud.
 */
export function flujo(g, pts, t, { color, n = 6, vel = 0.25, largo = 0.06, lw = 1.4, alpha = 0.8, punta = true } = {}) {
  for (let i = 0; i < n; i++) {
    const k = frac(t * vel + i / n);
    const a = puntoEn(pts, k), b = puntoEn(pts, Math.min(1, k + largo));
    const al = alpha * Math.min(1, k * 8, (1 - k) * 8);
    if (al <= 0.01) continue;
    if (punta) g.flecha(a[0], a[1], b[0], b[1], { color: color || g.C.gas, lw, punta: 5, alpha: al });
    else g.linea([[a[0], a[1]], [b[0], b[1]]], { color: color || g.C.gas, lw, alpha: al });
  }
}

/** Rótulo con una línea guía fina hasta el punto (px, py) que nombra. */
export function rotuloGuia(g, txt, x, y, px, py, op = {}) {
  g.linea([[x, y], [px, py]], { color: g.C.tenue, lw: 0.8, alpha: (op.alpha ?? 1) * 0.8 });
  g.circulo(px, py, 1.6, { fill: g.C.tenue, alpha: op.alpha ?? 1 });
  g.rotulo(txt, x, y, op);
}

/** Ondulaciones de aire caliente (indican gas calefactado) que suben en la dirección (dx, dy). */
export function calor(g, x, y, t, { dx = 0, dy = -1, largo = 18, alpha = 0.6, color } = {}) {
  const pts = [], nx = -dy, ny = dx;
  const f = frac(t * 0.8);
  for (let s = 0; s <= largo; s += 2) {
    const w = Math.sin((s / largo) * Math.PI * 2 + t * 6) * 2.2;
    pts.push([x + dx * s + nx * w, y + dy * s + ny * w]);
  }
  g.linea(pts, { color: color || g.C.calor, lw: 1.3, alpha: alpha * (0.6 + 0.4 * Math.sin(f * Math.PI)) });
}

/** Opacidad para cerrar el bucle sin saltos: 1 en el centro de la escena, 0 al principio y al final. */
export const bucle = (t, dur, borde = 0.6) => Math.min(1, t / borde, (dur - t) / borde);
