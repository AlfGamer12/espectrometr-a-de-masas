// Utilidades comunes a las simulaciones de todos los equipos:
// nubes de partículas (iones, electrones, destellos), lienzos 2D y colores del tema.
import * as THREE from 'three';

function dotTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.35, 'rgba(255,255,255,0.8)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}
let _dot = null;

/** Conjunto de puntos dinámicos (iones, electrones...) dibujados con un único draw call. */
export class PointPool {
  constructor(parent, max, size) {
    this.max = max;
    this.pos = new Float32Array(max * 3);
    this.col = new Float32Array(max * 3);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute('color', new THREE.BufferAttribute(this.col, 3).setUsage(THREE.DynamicDrawUsage));
    geo.setDrawRange(0, 0);
    _dot = _dot || dotTexture();
    const mat = new THREE.PointsMaterial({ size, map: _dot, vertexColors: true, transparent: true,
      depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true });
    this.points = new THREE.Points(geo, mat);
    this.points.frustumCulled = false;
    this.points.renderOrder = 10;
    this.points.raycast = () => {};
    parent.add(this.points);
    this.n = 0;
  }
  begin() { this.n = 0; }
  push(p, c, k = 1) {
    if (this.n >= this.max) return;
    const i = this.n++ * 3;
    this.pos[i] = p.x; this.pos[i + 1] = p.y; this.pos[i + 2] = p.z;
    this.col[i] = c.r * k; this.col[i + 1] = c.g * k; this.col[i + 2] = c.b * k;
  }
  end() {
    const g = this.points.geometry;
    g.setDrawRange(0, this.n);
    g.attributes.position.needsUpdate = true;
    g.attributes.color.needsUpdate = true;
  }
  set visible(v) { this.points.visible = v; }
  /** En tema claro la mezcla aditiva se pierde sobre fondo blanco. */
  setTheme(light) {
    this.points.material.blending = light ? THREE.NormalBlending : THREE.AdditiveBlending;
    this.points.material.needsUpdate = true;
  }
}

/** Colores de las gráficas, leídos de las variables CSS del tema activo. */
export function chartColors() {
  const cs = getComputedStyle(document.documentElement);
  const v = (n) => cs.getPropertyValue(n).trim();
  return { axis: v('--ch-axis'), grid: v('--ch-grid'), text: v('--ch-text'), line: v('--ch-line'), fill0: v('--ch-fill0'),
    fill1: v('--ch-fill1'), peak: v('--ch-peak'), cursor: v('--ch-cursor'), region: v('--ch-region'), regionLine: v('--ch-region-line'),
    bad: v('--ch-bad') };
}

/** Prepara un canvas a la resolución del dispositivo y devuelve [ctx, ancho, alto] en px CSS. */
export function setupCanvas(cv) {
  const dpr = window.devicePixelRatio || 1;
  const w = cv.clientWidth, h = cv.clientHeight;
  if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
  const g = cv.getContext('2d');
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.clearRect(0, 0, w, h);
  return [g, w, h];
}

/** Ejes con rejilla horizontal (0–100 %) — usado por los espectros. */
export function axes(g, C, L, T, pw, ph, ylabels = true) {
  g.font = '11px Segoe UI, sans-serif';
  g.strokeStyle = C.axis; g.fillStyle = C.text; g.lineWidth = 1;
  g.beginPath(); g.moveTo(L, T); g.lineTo(L, T + ph); g.lineTo(L + pw, T + ph); g.stroke();
  if (!ylabels) return;
  g.textAlign = 'right';
  for (const v of [0, 50, 100]) {
    const y = T + ph - (v / 100) * ph; g.fillText(v + '%', L - 4, y + 4);
    g.strokeStyle = C.grid; g.beginPath(); g.moveTo(L, y); g.lineTo(L + pw, y); g.stroke();
  }
}

export const COL = {
  nuevo: new THREE.Color(0xffd28a), ok: new THREE.Color(0xffa424), bad: new THREE.Color(0xff3355),
  e: new THREE.Color(0x5fd8ff), flash: new THREE.Color(0xfff2c0), frag: new THREE.Color(0x7be495), gas: new THREE.Color(0x9fb3c8),
  laser: new THREE.Color(0x7d5cff), gota: new THREE.Color(0x8fd3ff),
};
