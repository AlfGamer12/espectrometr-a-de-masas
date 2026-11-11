// Utilidades compartidas por las escenas de transporte, filtrado y celdas (cuadrupolo, guías de RF, celdas de colisión, TIMS…).
// No es una escena: el nombre empieza por «_» para distinguirlo.
import { azar, clamp } from '../dibujo.js';

/** ¿Tema oscuro activo? (la paleta oscura tiene el fondo oscuro). */
export const esOscuro = (g) => g.C.fondo === '#1b1f25';
/** Color dorado de los recubrimientos de oro (no está en la paleta común). */
export const oro = (g) => (esOscuro(g) ? '#e0b44c' : '#c8961c');

/* ===== Filtro cuadrupolar: ecuaciones de Mathieu ===== */
/** Frontera izquierda de la 1.ª región de estabilidad (β_y = 0), en el semiplano a ≥ 0. */
export const fronteraA0 = (q) => q * q / 2 - 7 * q ** 4 / 128 + 29 * q ** 6 / 2304 - 68687 * q ** 8 / 18874368;
/** Frontera derecha (β_x = 1). */
export const fronteraB1 = (q) => 1 - q - q * q / 8 + q ** 3 / 64 - q ** 4 / 1536 - 11 * q ** 5 / 36864;
/** a máximo estable para un q dado (0 si queda fuera). */
export const aMax = (q) => (q <= 0 || q >= 0.908 ? 0 : Math.max(0, Math.min(fronteraA0(q), fronteraB1(q))));

/**
 * Integra las ecuaciones de Mathieu  d²x/dξ² + (a − 2q cos 2ξ)x = 0,  d²y/dξ² − (a − 2q cos 2ξ)y = 0  (ξ = Ωt/2),
 * en unidades de r₀. El par x lleva +(U + V cos Ωt) y el par y, −(U + V cos Ωt). Se detiene al tocar la superficie de un electrodo
 * hiperbólico (x² − y² = r₀² → par x; y² − x² = r₀² → par y). Devuelve { pts: [[ξ, x, y]…], choque: 'x' | 'y' | null }.
 */
export function mathieu(a, q, { x0 = 0.12, y0 = 0.1, vx0 = 0.02, vy0 = -0.03, xiMax = 50, h = 0.01, cada = 4 } = {}) {
  let x = x0, y = y0, u = vx0, w = vy0, xi = 0, n = 0, choque = null;
  const pts = [[0, x, y]];
  const f = (s, X, Y) => { const k = a - 2 * q * Math.cos(2 * s); return [-k * X, k * Y]; };
  while (xi < xiMax) {
    const k1 = f(xi, x, y);
    const k2 = f(xi + h / 2, x + h / 2 * u, y + h / 2 * w);
    const u2 = u + h / 2 * k1[0], w2 = w + h / 2 * k1[1];
    const k3 = f(xi + h / 2, x + h / 2 * u2, y + h / 2 * w2);
    const u3 = u + h / 2 * k2[0], w3 = w + h / 2 * k2[1];
    const k4 = f(xi + h, x + h * u3, y + h * w3);
    const u4 = u + h * k3[0], w4 = w + h * k3[1];
    x += h / 6 * (u + 2 * u2 + 2 * u3 + u4);
    y += h / 6 * (w + 2 * w2 + 2 * w3 + w4);
    u += h / 6 * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]);
    w += h / 6 * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]);
    xi += h; n++;
    if (x * x - y * y >= 1) { choque = 'x'; pts.push([xi, x, y]); break; }
    if (y * y - x * x >= 1) { choque = 'y'; pts.push([xi, x, y]); break; }
    if (n % cada === 0) pts.push([xi, x, y]);
  }
  return { pts, choque, xiFin: xi };
}
/** Posición interpolada de una trayectoria de mathieu() en ξ. Devuelve null si ξ supera el final. */
export function enXi(tr, xi) {
  const P = tr.pts;
  if (xi > P[P.length - 1][0]) return null;
  let lo = 0, hi = P.length - 1;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (P[m][0] <= xi) lo = m; else hi = m; }
  const A = P[lo], B = P[hi], k = B[0] > A[0] ? (xi - A[0]) / (B[0] - A[0]) : 0;
  return [A[1] + (B[1] - A[1]) * k, A[2] + (B[2] - A[2]) * k];
}

/* ===== Piezas ===== */
/**
 * Sección de un electrodo de perfil hiperbólico: cara interior x = √(r0² + y²) en el sistema propio, girada `ang`.
 * cx, cy: eje del filtro; r0 en px; `ancho` semialtura de la cara; `fondo` profundidad radial.
 */
export function barraHiperbolica(g, cx, cy, r0, ang, { ancho, fondo, fill, stroke, lw = 1, alpha = 1, cara } = {}) {
  ancho = ancho || r0 * 0.95; fondo = fondo || r0 * 0.9;
  const ca = Math.cos(ang), sa = Math.sin(ang), pts = [];
  const rot = (u, v) => [cx + u * ca - v * sa, cy + u * sa + v * ca];
  for (let i = 0; i <= 16; i++) { const v = -ancho + (2 * ancho * i) / 16; pts.push(rot(Math.sqrt(r0 * r0 + v * v), v)); }
  const xb = Math.sqrt(r0 * r0 + ancho * ancho) + fondo;
  const cont = [...pts, rot(xb, ancho), rot(xb, -ancho)];
  g.linea(cont, { fill, color: stroke, lw, alpha, cerrar: true });
  if (cara) g.linea(pts, { color: cara, lw: 3, alpha });
  return pts;
}

/** Varilla cilíndrica vista de frente. */
export function barraRedonda(g, cx, cy, d, ang, R, op = {}) {
  g.circulo(cx + Math.cos(ang) * d, cy + Math.sin(ang) * d, R, op);
}

/** Partículas de gas deterministas dentro de un rectángulo, con agitación térmica. n partículas; t en s. */
export function gasRect(g, x, y, w, h, t, { n = 30, semilla = 5, alpha = 0.5, r = 1.8, deriva = 0, color, evita } = {}) {
  const R = azar(semilla);
  for (let i = 0; i < n; i++) {
    const px = R(), py = R(), ph = R() * 6.28, v = 0.6 + R();
    let u = (px + deriva * t * v / w) % 1; if (u < 0) u += 1;
    const xx = x + u * w + Math.sin(t * 2.3 * v + ph) * 3, yy = y + py * h + Math.cos(t * 1.9 * v + ph * 1.3) * 3;
    if (evita && evita(xx, yy)) continue;
    g.circulo(xx, yy, r, { fill: color || g.C.gas, alpha });
  }
}

/** Pequeño cartel de valor: «nombre  valor». */
export function cartel(g, txt, x, y, { color, size = 10, align = 'left', alpha = 1 } = {}) {
  g.texto(txt, x, y, { size, color: color || g.C.texto2, align, weight: 600, alpha });
}

/** Rampa periódica 0→1 en [a, b] con vuelta suave. */
export const pulso = (t, a, b) => clamp((t - a) / (b - a));
