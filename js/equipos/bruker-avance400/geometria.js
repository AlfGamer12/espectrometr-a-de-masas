// Geometría común del Bruker AVANCE NEO 400 (cm, mundo). Eje del imán vertical en x = z = 0; suelo en y = 0.
// Bruker no publica planos del criostato: radios y alturas interiores son aproximados, con proporciones de un imán Ascend 400
// de bore estándar (54 mm) sobre su soporte, cuya parte alta queda a la altura de una persona.
import * as THREE from 'three';

/** Une geometrías no indexadas con posición, normal y uv (sin dependencias de los addons). */
function mergeGeometries(gs) {
  const out = new THREE.BufferGeometry();
  for (const [k, n] of [['position', 3], ['normal', 3], ['uv', 2]]) {
    const len = gs.reduce((s, g) => s + g.attributes[k].array.length, 0), arr = new Float32Array(len);
    let o = 0; for (const g of gs) { arr.set(g.attributes[k].array, o); o += g.attributes[k].array.length; }
    out.setAttribute(k, new THREE.BufferAttribute(arr, n));
  }
  out.computeBoundingBox(); out.computeBoundingSphere();
  return out;
}

/** Criostato y centro magnético. */
export const MAG = {
  R: 33, Y0: 62, Y1: 160,          // vaso exterior (cámara de vacío): radio y alturas de la base y de la tapa
  YC: 104,                         // centro magnético (centro de la bobina y de la bobina de RF)
  BORE: 2.7,                       // bore a temperatura ambiente: 54 mm de diámetro
};
/** Capas del criostato, de fuera adentro: [radio interior, radio exterior, y0, y1, espesor de pared]. */
export const CAPAS = {
  ovc: [MAG.BORE, MAG.R, MAG.Y0, MAG.Y1, 0.5],
  escudoN2: [3.5, 31.6, 64.8, 157.2, 0.2],      // pantalla a 77 K unida al depósito de nitrógeno
  depositoN2: [25.5, 31.0, 108, 156.5, 0.35],   // depósito anular de nitrógeno líquido (parte alta)
  escudoHe: [3.8, 24.7, 67, 154.2, 0.2],        // pantalla de radiación enfriada por el vapor de helio
  depositoHe: [4.2, 22.0, 69, 151, 0.4],        // depósito de helio líquido a 4,2 K
};
export const NIVEL = { He: 142, N2: 150 };       // nivel de los líquidos dibujado
export const BOBINA = { ri: 5.4, ro: 9.0, y0: 84, y1: 124 };          // solenoide principal de NbTi
export const APANT = { ri: 15.0, ro: 16.6, y0: 89, y1: 119 };         // bobina de apantallamiento activo
/** Cuellos de helio (2) y de nitrógeno (3): [x, z]. */
export const CUELLOS_HE = [[-11, -7], [-11, 7]];
export const CUELLOS_N2 = [[-13.5, -23.4], [-27, 0], [-13.5, 23.4]];
/** Inserciones del bore. */
export const SHIM = { ri: 2.05, ro: 2.6, y0: 57, y1: 150, brida: [8.5, 56, 58.4] };   // brida: radio, y0, y1
export const SONDA = { r: 1.95, y0: 55.5, yCab: 84, y1: 107.5, base: { w: 12, h: 22, y0: 33.5 } };
export const BOB_RF = { r1: 0.36, h1: 1.8, r2: 0.58, h2: 2.3 };
export const TUBO = { r: 0.25, ri: 0.21, y0: 101.8, y1: 119.6, liq: [102.0, 106.0] };   // tubo de 5 mm, 4 cm de disolución
export const SPINNER = { r: 1.25, y0: 108.3, y1: 112.3 };
export const ELEV = { ri: 1.6, ro: 1.95, y0: 112, y1: 168, turbina: [1.35, 108, 112], collar: [3.6, 162, 168] };
/** Soporte: anillo bajo el imán y tres patas con amortiguador. Ángulos medidos desde +z hacia +x. */
export const SOPORTE = { ri: 20, ro: 34, y0: 59.2, rPata: 30, ang: [100, 220, 340] };
export const pataXZ = (a) => [SOPORTE.rPata * Math.sin((a * Math.PI) / 180), SOPORTE.rPata * Math.cos((a * Math.PI) / 180)];
/** Preamplificador HPPR/2 sobre el suelo, junto al imán (frontal hacia +z). */
export const HPPR = { x0: 50, x1: 72, z0: 14, z1: 40, y0: 6, y1: 40 };
/** Consola AVANCE NEO (armario de una bahía, frontal hacia +z) y módulos interiores [nombre, y0, y1]. */
export const CONS = { x0: 160, x1: 220, z0: -95, z1: -15, y0: 6, y1: 140, mx0: 164, mx1: 216, mz0: -85, mz1: -25 };
/** Coordenada x de los carriles de cables dentro de la consola, definidos para un armario con x0 = 190. */
export const XC = (x) => x + CONS.x0 - 190;
export const MODULOS = { fuente: [9, 28], amplificadores: [30, 56], transceptores: [58, 86], bsms: [88, 106], lock: [88, 106], vtu: [108, 120], servidor: [122, 134] };
/** Mesa del puesto de control. */
export const MESA = { x0: -175, x1: -60, z0: 50, z1: 118, y: 74 };
/** Ordenador bajo la mesa (centro, tamaño) y punta de su conector de red, en la cara trasera (−z). */
export const PC = { x: -76, y: 23.5, z: 72, w: 18, h: 44, d: 32 };
export const PC_RED = [PC.x + 4, 34, PC.z - PC.d / 2 - 1.2];

/* ---------------- corte didáctico ---------------- */
// Las piezas interiores se dibujan con un cuarto de revolución retirado (el que mira a +x, +z): φ ∈ [π/2, 2π].
export const PHI0 = Math.PI / 2, PHIL = (3 * Math.PI) / 2;

/** Superficie de revolución de un polígono (r, y) sin suavizar las aristas: un torneado por lado. */
export function torno(loop, { phi0 = PHI0, phiL = PHIL, seg = 72 } = {}) {
  const gs = [];
  for (let i = 0; i < loop.length - 1; i++) {
    const [a, b] = [loop[i], loop[i + 1]];
    if (Math.abs(a[0] - b[0]) < 1e-6 && Math.abs(a[1] - b[1]) < 1e-6) continue;
    if (a[0] < 1e-4 && b[0] < 1e-4) continue;
    gs.push(new THREE.LatheGeometry([new THREE.Vector2(a[0], a[1]), new THREE.Vector2(b[0], b[1])], seg, phi0, phiL));
  }
  return mergeGeometries(gs.map((g) => g.toNonIndexed()));
}
const rect = (r0, r1, y0, y1) => [[r0, y0], [r1, y0], [r1, y1], [r0, y1], [r0, y0]];

/** Tapas del corte (en los planos φ = π/2 y φ = 0) para un contorno y sus huecos. */
export function tapas(loop, huecos, mat) {
  const s = new THREE.Shape(loop.map(([r, y]) => new THREE.Vector2(r, y)));
  for (const h of huecos) s.holes.push(new THREE.Path(h.map(([r, y]) => new THREE.Vector2(r, y))));
  const geo = new THREE.ShapeGeometry(s, 8);
  const a = new THREE.Mesh(geo, mat), b = new THREE.Mesh(geo, mat);
  b.rotation.y = -Math.PI / 2;
  for (const m of [a, b]) { m.castShadow = true; m.receiveShadow = true; m.userData.decal = false; }
  return [a, b];
}
/** Vaso anular de pared delgada, cortado: paredes interior y exterior, tapa y fondo. */
export function vaso(g, [ri, ro, y0, y1, t], mat, matCorte, { seg = 72 } = {}) {
  const ext = rect(ri, ro, y0, y1), int = rect(ri + t, ro - t, y0 + t, y1 - t);
  const m1 = new THREE.Mesh(torno(ext, { seg }), mat), m2 = new THREE.Mesh(torno(int, { seg }), mat);
  for (const m of [m1, m2]) { m.castShadow = true; m.receiveShadow = true; g.add(m); }
  for (const m of tapas(ext, [int.slice(0, 4)], matCorte)) g.add(m);
  return [m1, m2];
}
/** Volumen anular macizo, cortado (bobinas, líquidos). */
export function anillo(g, ri, ro, y0, y1, mat, matCorte, { seg = 72, phi0 = PHI0, phiL = PHIL } = {}) {
  const loop = rect(ri, ro, y0, y1);
  const m = new THREE.Mesh(torno(loop, { seg, phi0, phiL }), mat); m.castShadow = true; m.receiveShadow = true; g.add(m);
  if (phiL < Math.PI * 2 - 1e-3) for (const c of tapas(loop, [], matCorte)) g.add(c);
  return m;
}

/* ---------------- texturas ---------------- */
export function lienzo(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
/** Logotipo de Bruker recreado (órbitas + palabra). */
export function logoBruker(color, { palabra = true } = {}) {
  return lienzo(512, 256, (g) => {
    g.strokeStyle = color; g.lineWidth = 7;
    const cy = palabra ? 92 : 128;
    for (const a of [0, Math.PI / 3, -Math.PI / 3]) { g.save(); g.translate(256, cy); g.rotate(a); g.beginPath(); g.ellipse(0, 0, 88, 30, 0, 0, Math.PI * 2); g.stroke(); g.restore(); }
    g.fillStyle = color; g.beginPath(); g.arc(256, cy, 11, 0, Math.PI * 2); g.fill();
    if (palabra) { g.font = '800 74px Arial, Segoe UI'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('BRUKER', 256, 206); }
  });
}
