// Utilidades geométricas para construir piezas de forma procedural.
// Unidades: 1 unidad = 1 cm.
import * as THREE from 'three';

export function mesh(geo, mat, pos = [0, 0, 0], rot = [0, 0, 0]) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(...pos);
  m.rotation.set(...rot);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

export function rrShape(w, h, r) {
  const s = new THREE.Shape();
  const x = -w / 2, y = -h / 2;
  r = Math.max(0.001, Math.min(r, w / 2, h / 2));
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

/** Caja con aristas redondeadas (w en X, h en Y, d en Z), centrada. */
export function rbox(w, h, d, b = 0.2) {
  b = Math.min(b, w / 4, h / 4, d / 4);
  const g = new THREE.ExtrudeGeometry(rrShape(w - 2 * b, h - 2 * b, b), {
    depth: Math.max(0.001, d - 2 * b), bevelEnabled: true, bevelThickness: b, bevelSize: b,
    bevelSegments: 4, curveSegments: 8,
  });
  g.translate(0, 0, -(d - 2 * b) / 2);
  g.computeVertexNormals();
  return g;
}

export const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);

/**
 * Placa con agujeros para el paso de cables y mangueras. Devuelve la malla ya orientada y colocada
 * (la orientación va en la malla, no en la geometría, para que la herramienta de inspección reconozca los huecos).
 * plano 'xz': horizontal (w en X, d en Z, espesor en Y), huecos [x, z, r] relativos al centro.
 * plano 'xy': vertical frontal/trasera (w en X, d en Y, espesor en Z), huecos [x, y, r].
 * plano 'zy': vertical lateral (w en Z, d en Y, espesor en X), huecos [z, y, r].
 */
export function placaPasos(w, d, t, huecos, mat, pos = [0, 0, 0], plano = 'xz', b = 0.4) {
  const s = rrShape(w, d, b);
  for (const [u, v, r] of huecos) {
    const h = new THREE.Path();
    const [x, y] = plano === 'xz' ? [u, -v] : plano === 'zy' ? [-u, v] : [u, v];
    h.absarc(x, y, r, 0, Math.PI * 2, true); s.holes.push(h);
  }
  const g = new THREE.ExtrudeGeometry(s, { depth: t, bevelEnabled: false, curveSegments: 24 });
  g.translate(0, 0, -t / 2);
  const rot = plano === 'xz' ? [-Math.PI / 2, 0, 0] : plano === 'zy' ? [0, Math.PI / 2, 0] : [0, 0, 0];
  return mesh(g, mat, pos, rot);
}

/** Pasamuros de goma (anillo) para un agujero de radio r; eje 'x', 'y' o 'z'. */
export function pasamuros(r, mat, pos, eje = 'y', t = 0.5) {
  const g = new THREE.TorusGeometry(r, t / 2, 10, 32);
  const rot = eje === 'y' ? [Math.PI / 2, 0, 0] : eje === 'x' ? [0, Math.PI / 2, 0] : [0, 0, 0];
  return mesh(g, mat, pos, rot);
}

/** Arandela/disco con agujero. Eje a lo largo de X. */
export function washerX(rOut, rIn, t, seg = 56) {
  const s = new THREE.Shape();
  s.absarc(0, 0, rOut, 0, Math.PI * 2, false);
  if (rIn > 0) {
    const h = new THREE.Path();
    h.absarc(0, 0, rIn, 0, Math.PI * 2, true);
    s.holes.push(h);
  }
  const g = new THREE.ExtrudeGeometry(s, { depth: t, bevelEnabled: false, curveSegments: seg });
  g.translate(0, 0, -t / 2);
  g.rotateY(Math.PI / 2); // Z -> X
  return g;
}

/** Cilindro macizo con eje en X. */
export function cylX(r, len, seg = 40, r2 = r) {
  const g = new THREE.CylinderGeometry(r2, r, len, seg);
  g.rotateZ(-Math.PI / 2);
  return g;
}
/** Cilindro con eje en Y. */
export const cylY = (r, len, seg = 40, r2 = r) => new THREE.CylinderGeometry(r2, r, len, seg);
/** Cilindro con eje en Z. */
export function cylZ(r, len, seg = 40, r2 = r) {
  const g = new THREE.CylinderGeometry(r2, r, len, seg);
  g.rotateX(Math.PI / 2);
  return g;
}

/** Tubo hueco (eje X) vía torneado. */
export function tubeX(rOut, rIn, len, seg = 48) {
  const pts = [
    new THREE.Vector2(rIn, -len / 2), new THREE.Vector2(rOut, -len / 2),
    new THREE.Vector2(rOut, len / 2), new THREE.Vector2(rIn, len / 2),
    new THREE.Vector2(rIn, -len / 2),
  ];
  const g = new THREE.LatheGeometry(pts, seg);
  g.rotateZ(-Math.PI / 2);
  return g;
}

/** Tubo a lo largo de una lista de puntos. */
export function tubePath(points, r, seg = 64, radial = 12) {
  const c = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
  return new THREE.TubeGeometry(c, seg, r, radial, false);
}

/** Hélice (filamento, bobina) con eje en Z. */
export function helix(radius, length, turns, wire, seg = 200) {
  class H extends THREE.Curve {
    getPoint(t) {
      const a = t * turns * Math.PI * 2;
      return new THREE.Vector3(Math.cos(a) * radius, Math.sin(a) * radius, (t - 0.5) * length);
    }
  }
  return new THREE.TubeGeometry(new H(), seg, wire, 8, false);
}

/** Revolución de un perfil [[r, x], ...] alrededor del eje X. */
export function latheX(profile, seg = 48) {
  const g = new THREE.LatheGeometry(profile.map(([r, x]) => new THREE.Vector2(r, x)), seg);
  g.rotateZ(-Math.PI / 2);
  return g;
}

/** Textura de rejilla de ventilación generada por canvas. */
export function grilleTexture(cols = 24, rows = 8) {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#e9ebee'; g.fillRect(0, 0, 512, 256);
  g.fillStyle = '#2a2e34';
  const w = 512 / cols, h = 256 / rows;
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
    g.beginPath();
    g.roundRect(i * w + w * 0.2, j * h + h * 0.18, w * 0.6, h * 0.64, 3);
    g.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Textura de etiqueta/texto plano. */
export function textTexture(lines, { w = 512, h = 128, bg = '#3a3f47', fg = '#ffffff', font = 'bold 54px Segoe UI' } = {}) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  g.fillStyle = fg; g.font = font; g.textBaseline = 'middle';
  const arr = Array.isArray(lines) ? lines : [lines];
  arr.forEach((l, i) => g.fillText(l, 24, (h / (arr.length + 1)) * (i + 1)));
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* ---------------- Tornillería ---------------- */
const _screwCache = new Map();
/**
 * Tornillo de cabeza cilíndrica con hexágono interior (tipo DIN 912), eje a lo largo de +Y
 * (la cabeza queda en y ∈ [0, h]). Devuelve un Group listo para posicionar/rotar.
 */
export function screw(mat, recessMat, r = 0.25, axis = 'y') {
  const key = r.toFixed(3);
  if (!_screwCache.has(key)) {
    const h = r * 0.9;
    const head = new THREE.LatheGeometry([
      new THREE.Vector2(0, 0), new THREE.Vector2(r, 0), new THREE.Vector2(r, h * 0.82),
      new THREE.Vector2(r * 0.9, h), new THREE.Vector2(0, h)], 20);
    const hex = new THREE.CylinderGeometry(r * 0.42, r * 0.42, h * 0.5, 6);
    hex.translate(0, h * 0.78, 0);
    _screwCache.set(key, { head, hex });
  }
  const { head, hex } = _screwCache.get(key);
  const g = new THREE.Group();
  const a = new THREE.Mesh(head, mat); a.castShadow = true; a.receiveShadow = true;
  const b = new THREE.Mesh(hex, recessMat);
  g.add(a, b);
  if (axis === 'x') g.rotation.z = -Math.PI / 2;
  else if (axis === '-x') g.rotation.z = Math.PI / 2;
  else if (axis === 'z') g.rotation.x = Math.PI / 2;
  else if (axis === '-z') g.rotation.x = -Math.PI / 2;
  else if (axis === '-y') g.rotation.x = Math.PI;
  return g;
}
/** Coloca tornillos en una lista de posiciones. */
export function screws(parent, mat, recessMat, r, axis, positions) {
  for (const p of positions) { const s = screw(mat, recessMat, r, axis); s.position.set(...p); parent.add(s); }
}

/* ---------------- Rótulos y pantallas ---------------- */
function canvas2d(w, h) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  return [c, c.getContext('2d')];
}
function toTex(c) { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }

/** Pantalla de estado (texto claro sobre fondo oscuro). */
export function screenTexture(rows, { w = 512, h = 200, title = '' } = {}) {
  const [c, g] = canvas2d(w, h);
  g.fillStyle = '#0a1216'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#7fd7ff'; g.font = '600 26px Segoe UI, Arial'; g.textBaseline = 'top';
  if (title) g.fillText(title, 22, 16);
  g.font = '22px Consolas, monospace';
  rows.forEach(([k, v, ok], i) => {
    const y = (title ? 58 : 20) + i * 32;
    g.fillStyle = '#9fb3bd'; g.fillText(k, 22, y);
    g.fillStyle = ok === false ? '#ffb21a' : '#d8f3ff'; g.textAlign = 'right'; g.fillText(v, w - 22, y); g.textAlign = 'left';
  });
  return toTex(c);
}
/** Etiqueta de advertencia de superficie caliente (triángulo ISO 7010 W017, simplificado). */
export function warningTexture(text = 'SUPERFICIE CALIENTE') {
  const [c, g] = canvas2d(512, 192);
  g.fillStyle = '#f2c230'; g.fillRect(0, 0, 512, 192);
  g.strokeStyle = '#111'; g.lineWidth = 6; g.strokeRect(6, 6, 500, 180);
  g.beginPath(); g.moveTo(96, 30); g.lineTo(166, 160); g.lineTo(26, 160); g.closePath();
  g.fillStyle = '#111'; g.fill();
  g.beginPath(); g.moveTo(96, 50); g.lineTo(150, 150); g.lineTo(42, 150); g.closePath();
  g.fillStyle = '#f2c230'; g.fill();
  g.strokeStyle = '#111'; g.lineWidth = 5;
  for (const x of [80, 96, 112]) { g.beginPath(); g.moveTo(x, 138); g.bezierCurveTo(x - 8, 120, x + 8, 108, x, 90); g.stroke(); }
  g.fillStyle = '#111'; g.font = 'bold 34px Arial'; g.textBaseline = 'middle';
  g.fillText('PRECAUCIÓN', 190, 70); g.font = '26px Arial'; g.fillText(text, 190, 118);
  return toTex(c);
}
/** Placa de características (fondo metalizado, texto oscuro). */
export function plateTexture(lines) {
  const [c, g] = canvas2d(512, 256);
  const gr = g.createLinearGradient(0, 0, 512, 256);
  gr.addColorStop(0, '#d9dcdf'); gr.addColorStop(1, '#bfc3c8');
  g.fillStyle = gr; g.fillRect(0, 0, 512, 256);
  g.strokeStyle = '#555'; g.lineWidth = 3; g.strokeRect(8, 8, 496, 240);
  g.fillStyle = '#1e2227'; g.textBaseline = 'top';
  lines.forEach((l, i) => { g.font = i === 0 ? 'bold 30px Arial' : '22px Arial'; g.fillText(l, 26, 24 + i * 36); });
  // código de barras ficticio
  for (let i = 0; i < 60; i++) if ((i * 7919) % 3) g.fillRect(320 + i * 3, 196, (i % 4) + 1, 38);
  return toTex(c);
}