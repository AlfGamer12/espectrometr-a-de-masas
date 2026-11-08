// Equipo completo microflex LRF tal como es el real (≈ 52 × 69 × 135 cm): torre blanca con una cubierta azul marino de frente curvo y
// remate redondeado que aloja el tubo de vuelo vertical y el reflector, tira de mandos blanca a la derecha (logotipo, rótulo vertical
// "microflex", llave, indicadores y pulsador TARGET IN/OUT), zócalo blanco saliente con el puerto de carga de la diana y puerta trasera
// azul con la regleta de conexiones. Dentro: fuente en la base, esclusa, láser de nitrógeno con fibra óptica, bomba turbomolecular,
// bomba de membrana y electrónica. PC con monitor, teclado y torre a la izquierda, sobre la mesa.
// Coordenadas de mundo en cm. Frente hacia +Z. Mesa en y = 0.
import * as THREE from 'three';
import { M } from '../../materials.js';
import { mesh, rbox, box, cylX, cylY, cylZ, tubePath, placaPasos, grilleTexture, textTexture, screws, warningTexture, plateTexture } from '../../geom.js';
import { makePart, cableFlex } from '../../parts.js';
import { buildAnalizador } from './analizador.js';
import { ORIGEN, AX } from './geometria.js';

const L1 = (offset, extra = {}) => ({ level: 1, offset, mode: 'equipo', ...extra });
const XW = 26.5, ZB = -35, ZF = 16, ZP = 34.2;          // semiancho, cara trasera, plano frontal del cuerpo, frente del zócalo
const YP = 28, YB = 106, HT = 135;                     // cara superior del zócalo, altura del cuerpo blanco, altura total (torre)
const OX = ORIGEN.x, OY = ORIGEN.y, OZ = ORIGEN.z;
const CW = 18, CH = 17, CD = 16, YC = OY + 4;          // cámara de la fuente: anchura, altura, fondo y centro
const LX = -3, LZ = 23.5;                              // puerto de carga y esclusa (bajo la tapa del zócalo)
const NX0 = -14, NX1 = 10, NY = 48;                    // escotadura de la cubierta azul sobre el puerto de carga

/* ---------------- Cubierta azul: superficie de frente curvo con remate redondeado ---------------- */
/** Desplaza un polígono convexo P (sentido antihorario en el plano x–z) una distancia s hacia fuera, con arcos en los vértices.
 *  El número de puntos no depende de s, de modo que todas las filas de la superficie se pueden unir entre sí. */
function offsetConvex(P, s) {
  const n = P.length, out = [];
  const nrm = (a, b) => { const dx = b.p[0] - a.p[0], dz = b.p[1] - a.p[1], l = Math.hypot(dx, dz); return [dz / l, -dx / l]; };
  for (let i = 0; i < n; i++) {
    const a = P[(i - 1 + n) % n], b = P[i], c = P[(i + 1) % n];
    const n0 = nrm(a, b), n1 = nrm(b, c);
    const a0 = Math.atan2(n0[1], n0[0]); let a1 = Math.atan2(n1[1], n1[0]);
    while (a1 < a0 - 1e-9) a1 += Math.PI * 2;
    const da = a1 - a0, m = da < 1e-6 ? 0 : Math.max(1, Math.ceil(da / (Math.PI / 20)));
    for (let k = 0; k <= m; k++) { const t = a0 + (m ? (da * k) / m : 0); out.push({ x: b.p[0] + s * Math.cos(t), z: b.p[1] + s * Math.sin(t), tag: b.tag }); }
  }
  return out;
}
/** Envolvente cerrada por arriba: paredes verticales desde y0(tag) hasta yT − rc y remate de radio rc hasta la tapa plana en yT. */
function capotaGeo(P, rc, y0, yT, nRoll = 9) {
  const rows = [];
  const base = offsetConvex(P, rc), L = base.length;
  rows.push(base.map((q) => [q.x, y0(q), q.z]));
  rows.push(base.map((q) => [q.x, yT - rc, q.z]));
  for (let k = 1; k <= nRoll; k++) {
    const th = (k / nRoll) * (Math.PI / 2);
    rows.push(offsetConvex(P, rc * Math.cos(th)).map((q) => [q.x, yT - rc + rc * Math.sin(th), q.z]));
  }
  const pos = []; for (const r of rows) for (const v of r) pos.push(...v);
  let cx = 0, cz = 0; for (const q of P) { cx += q.p[0]; cz += q.p[1]; } cx /= P.length; cz /= P.length;
  const ci = pos.length / 3; pos.push(cx, yT, cz);
  const idx = [];
  for (let r = 0; r < rows.length - 1; r++) for (let i = 0; i < L; i++) {
    const j = (i + 1) % L; idx.push(r * L + i, (r + 1) * L + j, r * L + j, r * L + i, (r + 1) * L + i, (r + 1) * L + j);
  }
  const last = (rows.length - 1) * L;
  for (let i = 0; i < L; i++) idx.push(last + i, last + ((i + 1) % L), ci);
  // orientación hacia fuera (respecto a un punto interior)
  const V = (k) => new THREE.Vector3(pos[3 * k], pos[3 * k + 1], pos[3 * k + 2]), inner = new THREE.Vector3(cx, (yT + 60) / 2, cz);
  for (let t = 0; t < idx.length; t += 3) {
    const a = V(idx[t]), b = V(idx[t + 1]), c = V(idx[t + 2]);
    const nn = b.clone().sub(a).cross(c.clone().sub(a)); if (nn.lengthSq() < 1e-12) continue;
    const ce = a.add(b).add(c).multiplyScalar(1 / 3);
    if (nn.dot(ce.sub(inner)) < 0) { const tmp = idx[t + 1]; idx[t + 1] = idx[t + 2]; idx[t + 2] = tmp; }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}

/* ---------------- Texturas ---------------- */
function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; }
function tex(c) { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }

/** Cara de la tira de mandos (11,7 × 76,7 cm): logotipo, rótulo vertical "microflex", rótulos de la llave, los LED y el pulsador. */
const STRIP = { x0: 14.4, w: 11.7, y1: 105.6, h: 76.7, k: 32 };
const SY = { llave: 66.2, sys: [62.2, 60.4, 58.6, 56.8, 55.0], tgt: [51.0, 49.2, 47.4], boton: 43.4 };
const LEDX = 16.9;
function stripTexture() {
  const { w, h, k } = STRIP; const [c, g] = canvas(Math.round(w * k), Math.round(h * k));
  const Y = (y) => (STRIP.y1 - y) * k, X = (x) => (x - STRIP.x0) * k;
  const gr = g.createLinearGradient(0, 0, c.width, 0); gr.addColorStop(0, '#e3e6e9'); gr.addColorStop(0.5, '#eef0f2'); gr.addColorStop(1, '#e6e8eb');
  g.fillStyle = gr; g.fillRect(0, 0, c.width, c.height);
  // logotipo (recreación esquemática: emblema y nombre)
  const lx = c.width / 2, ly = Y(102.6);
  g.strokeStyle = '#3d434b'; g.lineWidth = 7; g.lineCap = 'round';
  for (const s of [-1, 1]) { g.beginPath(); g.moveTo(lx - 34, ly - 30 * s); g.quadraticCurveTo(lx, ly - 4 * s, lx + 34, ly - 30 * s); g.stroke(); }
  g.beginPath(); g.arc(lx, ly, 9, 0, Math.PI * 2); g.fillStyle = '#3d434b'; g.fill();
  g.font = '700 40px Arial, Helvetica, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#3d434b';
  g.fillText('B R U K E R', lx, Y(100.2));
  // rótulo vertical, de abajo arriba
  g.save(); g.translate(c.width / 2 + 6, Y(84.6)); g.rotate(-Math.PI / 2);
  g.font = '600 168px "Segoe UI", Arial, sans-serif'; g.fillStyle = '#a4aab1'; g.fillText('microflex', 0, 0); g.restore();
  // rótulos de mandos e indicadores
  g.textAlign = 'left'; g.fillStyle = '#5a616a';
  const lab = (t, y, dx = 1.0, f = '500 21px Arial') => { g.font = f; g.fillText(t, X(LEDX + dx), Y(y)); };
  lab('Standby · Operate', SY.llave, 1.6);
  g.fillStyle = '#7d848c'; g.font = '700 19px Arial'; g.fillText('SYSTEM', X(LEDX - 0.9), Y(SY.sys[0] + 1.4)); g.fillText('TARGET', X(LEDX - 0.9), Y(SY.tgt[0] + 1.4));
  g.fillStyle = '#5a616a';
  ['Mains', 'Error', 'Warm Up', 'Ready', 'Automode'].forEach((t, i) => lab(t, SY.sys[i]));
  ['Error', 'In Progress', 'Access'].forEach((t, i) => lab(t, SY.tgt[i]));
  lab('Target In/Out', SY.boton, 2.0);
  // rótulos de grupo: finas líneas guía
  g.strokeStyle = '#c3c8ce'; g.lineWidth = 2;
  for (const y of [SY.sys[0] + 2.4, SY.tgt[0] + 2.4, SY.boton + 2.2]) { g.beginPath(); g.moveTo(X(LEDX - 1.2), Y(y)); g.lineTo(X(LEDX + 7.5), Y(y)); g.stroke(); }
  return tex(c);
}
/** Pantalla del PC con el programa de adquisición: vídeo de la diana, mapa de 96 posiciones, espectro y pestañas de parámetros. */
function pcScreen() {
  const [c, g] = canvas(1280, 800);
  g.fillStyle = '#f0f0f0'; g.fillRect(0, 0, 1280, 800);
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, 1280, 28); g.fillStyle = '#1e1e1e'; g.font = '15px Segoe UI, Arial'; g.fillText('flexControl - microflex - [RP_PepMix.par]', 12, 19);
  g.fillStyle = '#e9e9e9'; g.fillRect(0, 28, 1280, 22); g.fillStyle = '#333'; g.font = '13px Segoe UI, Arial';
  ['File', 'Display', 'View', 'Tools', 'Compass', 'Help'].forEach((t, i) => g.fillText(t, 10 + i * 58, 44));
  g.fillStyle = '#e2e2e2'; g.fillRect(0, 50, 1280, 30);
  for (let i = 0; i < 34; i++) { g.fillStyle = i % 5 ? '#7c8794' : '#3f6fb3'; g.fillRect(10 + i * 26, 56, 18, 18); }
  // vídeo de la diana
  g.fillStyle = '#606060'; g.fillRect(8, 88, 240, 190);
  for (let i = 0; i < 9000; i++) { const v = 70 + Math.random() * 120 | 0; g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(8 + Math.random() * 238, 88 + Math.random() * 188, 2, 2); }
  g.strokeStyle = '#ffffff'; g.lineWidth = 1; g.beginPath(); g.moveTo(128, 88); g.lineTo(128, 278); g.moveTo(8, 183); g.lineTo(248, 183); g.stroke();
  g.fillStyle = '#2d6fd0'; g.fillRect(252, 230, 8, 22);
  for (let i = 0; i < 6; i++) { g.fillStyle = '#dcdcdc'; g.fillRect(8 + (i % 2) * 124, 290 + (i >> 1) * 28, 116, 22); g.fillStyle = '#333'; g.font = '13px Segoe UI'; g.fillText(['Clear Sum', 'Start', 'Undo', 'Add', 'Shots 500', 'Freq 60 Hz'][i], 16 + (i % 2) * 124, 306 + (i >> 1) * 28); }
  // mapa de 96 posiciones
  g.fillStyle = '#ffffff'; g.fillRect(8, 380, 258, 220);
  g.font = '15px Times New Roman'; g.fillStyle = '#222';
  for (let col = 0; col < 12; col += 2) g.fillText(String(col + 1), 36 + col * 19, 398);
  for (let r = 0; r < 8; r++) { g.fillText('ABCDEFGH'[r], 12, 420 + r * 23); for (let col = 0; col < 12; col++) {
    g.fillStyle = r === 2 && col === 3 ? '#4c88e0' : (r * 12 + col) % 9 < 4 ? '#9a9a9a' : '#c4c4c4';
    g.beginPath(); g.arc(40 + col * 19, 415 + r * 23, 8, 0, Math.PI * 2); g.fill(); g.fillStyle = '#222'; } }
  // espectro
  g.fillStyle = '#ffffff'; g.fillRect(276, 88, 996, 470); g.strokeStyle = '#b02020'; g.lineWidth = 1; g.strokeRect(276, 88, 996, 470);
  g.strokeStyle = '#999'; g.beginPath(); g.moveTo(320, 100); g.lineTo(320, 530); g.lineTo(1260, 530); g.stroke();
  g.fillStyle = '#555'; g.font = '12px Arial';
  for (let i = 0; i < 9; i++) g.fillText(String(1000 + i * 250), 330 + i * 110, 548);
  g.strokeStyle = '#1b2f8f'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(322, 528);
  const peaks = [[0.06, 0.45], [0.19, 0.9], [0.24, 0.36], [0.31, 0.7], [0.45, 1.0], [0.47, 0.42], [0.62, 0.55], [0.79, 0.38], [0.94, 0.22]];
  for (let i = 0; i <= 930; i++) { const u = i / 930; let v = 0.012 * Math.random(); for (const [p, a] of peaks) v += a * Math.exp(-((u - p) ** 2) / (2 * 0.0018 ** 2)); g.lineTo(322 + i, 528 - v * 400); }
  g.stroke();
  g.fillStyle = '#333'; g.font = '12px Arial'; [['1046.54', 0.19], ['1296.68', 0.31], ['1619.82', 0.45], ['2093.09', 0.62], ['2465.20', 0.79]].forEach(([t, p]) => g.fillText(t, 300 + p * 930, 112));
  // pestañas y parámetros
  g.fillStyle = '#ececec'; g.fillRect(276, 566, 996, 210);
  ['AutoXecute', 'Sample Carrier', 'Detection', 'Spectrometer', 'Processing', 'Calibration', 'Setup', 'Status'].forEach((t, i) => {
    g.fillStyle = i === 3 ? '#ffffff' : '#dadada'; g.fillRect(280 + i * 104, 568, 100, 22); g.fillStyle = '#222'; g.font = '13px Segoe UI'; g.fillText(t, 286 + i * 104, 584); });
  g.fillStyle = '#ffffff'; g.fillRect(282, 594, 984, 176);
  g.fillStyle = '#222'; g.font = '14px Segoe UI';
  [['Ion Source 1', '19,00 kV'], ['Ion Source 2', '16,55 kV'], ['Lens', '9,30 kV'], ['Reflector', '20,00 kV']].forEach(([a, b], i) => { g.fillText(a, 300, 640 + i * 30); g.fillText(b, 420, 640 + i * 30); });
  g.fillStyle = '#3cb44b'; g.fillRect(420, 604, 100, 22); g.fillStyle = '#fff'; g.font = '700 13px Segoe UI'; g.fillText('READY', 448, 620);
  g.fillStyle = '#222'; g.font = '14px Segoe UI'; g.fillText('Pulsed Ion Extraction   150 ns', 620, 640); g.fillText('Polarity   Positive', 620, 670); g.fillText('Matrix Suppression   Deflection  500 Da', 620, 700);
  g.fillStyle = '#dcdcdc'; g.fillRect(0, 776, 1280, 24); g.fillStyle = '#333'; g.font = '13px Segoe UI'; g.fillText('Reflector', 900, 793);
  g.fillStyle = '#3cb44b'; g.fillRect(1120, 778, 70, 20); g.fillRect(1196, 778, 70, 20); g.fillStyle = '#fff'; g.fillText('READY', 1132, 793); g.fillText('IN', 1222, 793);
  return tex(c);
}
/** Teclado: teclas sobre fondo negro. */
function keyboardTexture() {
  const [c, g] = canvas(1024, 320); g.fillStyle = '#17191c'; g.fillRect(0, 0, 1024, 320);
  const rows = [15, 15, 14, 13, 12];
  rows.forEach((n, r) => { for (let i = 0; i < n; i++) { g.fillStyle = '#2c3036'; g.beginPath(); g.roundRect(20 + i * (720 / n), 30 + r * 54, 720 / n - 6, 46, 5); g.fill(); } });
  g.fillStyle = '#2c3036'; g.beginPath(); g.roundRect(200, 300 - 12, 330, 0, 4); g.fill();
  for (let r = 0; r < 5; r++) for (let i = 0; i < 4; i++) { g.beginPath(); g.roundRect(780 + i * 58, 30 + r * 54, 50, 46, 5); g.fill(); }
  return tex(c);
}
/** Rejilla de ventilación hexagonal del filtro trasero. */
function hexTexture() {
  const [c, g] = canvas(256, 256); g.fillStyle = '#9aa0a6'; g.fillRect(0, 0, 256, 256);
  g.fillStyle = '#1b1e22';
  for (let r = 0; r < 8; r++) for (let i = 0; i < 8; i++) {
    const x = 18 + i * 31 + (r % 2) * 15.5, y = 18 + r * 29; g.beginPath();
    for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2 + Math.PI / 6; g.lineTo(x + Math.cos(a) * 13, y + Math.sin(a) * 13); } g.fill();
  }
  return tex(c);
}
const etiqueta = (t, w, h, { bg = '#24395c', fg = '#e8ecf1', font = '600 40px Arial' } = {}) =>
  new THREE.MeshStandardMaterial({ map: textTexture([t], { w: 512, h: Math.round(512 * h / w), bg, fg, font }), roughness: 0.5 });

export function buildEquipo(root) {
  const refs = {};
  // pintura de la carcasa: blanco roto satinado y azul marino de la cubierta
  const BLANCO = M.carcasa.clone(); BLANCO.color.setHex(0xe6e8eb);
  const NAVY = new THREE.MeshPhysicalMaterial({ color: 0x24395c, metalness: 0.15, roughness: 0.42, clearcoat: 0.35, clearcoatRoughness: 0.35, side: THREE.DoubleSide });
  const NAVY2 = NAVY.clone(); NAVY2.color.setHex(0x2d4670); NAVY2.side = THREE.FrontSide;
  const LEDOFF = new THREE.MeshStandardMaterial({ color: 0x41464d, metalness: 0.1, roughness: 0.35 });
  const VERDE = new THREE.MeshPhysicalMaterial({ color: 0x2f9e5b, emissive: 0x0c4a24, emissiveIntensity: 0.6, roughness: 0.3, clearcoat: 0.6 });

  /* ---------------- BASTIDOR ---------------- */
  {
    const g = makePart(root, 'chasis', L1([0, 0, 0]));
    g.add(mesh(rbox(XW * 2 - 0.4, 2.2, ZP - ZB - 0.4, 0.4), M.carcasaOsc, [0, 1.6, (ZP + ZB) / 2 - 0.2]));   // zócalo oscuro (base)
    for (const x of [-XW + 4, XW - 4]) for (const z of [ZB + 4, ZP - 4]) g.add(mesh(cylY(1.8, 0.8, 24), M.goma, [x, 0.4, z]));
    for (const x of [-XW + 3, XW - 3]) for (const z of [ZB + 2.5, 8]) g.add(mesh(box(1.6, 100, 1.6), M.aluminio, [x, 53, z]));
  }

  /* ---------------- CUBIERTA AZUL DE LA TORRE ---------------- */
  {
    const g = makePart(root, 'cubierta_tubo', L1([0, 55, 25], { shell: true, label: 'equipo' }));
    // polígono interior P (offset rc = 6 → contorno exterior): frente en arco convexo, laterales y fondo rectos
    const rc = 6, XL = -25.4, XR = 13.8, ZBk = -33.8, P = [];
    const xm = (XL + XR) / 2, c = (XR - XL) / 2 - rc, sag = 3, Rp = (c * c + sag * sag) / (2 * sag), zc = 15 - Rp, ae = Math.asin(c / Rp);
    const lin = (a, b, tag, n) => { for (let i = 0; i < n; i++) { const t = i / n; P.push({ p: [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t], tag }); } };
    const zf = zc + Rp * Math.cos(ae);
    lin([XL + rc, ZBk + rc], [XR - rc, ZBk + rc], 'lado', 24);
    lin([XR - rc, ZBk + rc], [XR - rc, zf], 'lado', 34);
    // arco frontal (de derecha a izquierda), con vértices exactos en los bordes de la escotadura
    const aN1 = Math.asin((NX1 - xm) / (Rp + rc)), aN0 = Math.asin((NX0 - xm) / (Rp + rc)), NA = 40;
    for (let i = 0; i <= NA; i++) {
      let a = ae - (2 * ae * i) / NA;
      const push = (al, tag) => P.push({ p: [xm + Rp * Math.sin(al), zc + Rp * Math.cos(al)], tag });
      const prev = ae - (2 * ae * (i - 1)) / NA;
      if (i > 0 && prev > aN1 && a <= aN1) { push(aN1 + 1e-4, 'frente'); push(aN1 - 1e-4, 'escot'); }
      if (i > 0 && prev > aN0 && a <= aN0) { push(aN0 + 1e-4, 'escot'); push(aN0 - 1e-4, 'frente'); }
      push(a, a < aN1 && a > aN0 ? 'escot' : 'frente');
    }
    lin([XL + rc, zf], [XL + rc, ZBk + rc], 'lado', 34);
    P.forEach((q) => { if (q.tag === 'lado' && q.p[1] > 10.5) q.tag = 'frente'; });
    // dedup de vértices consecutivos coincidentes
    for (let i = P.length - 1; i > 0; i--) if (Math.hypot(P[i].p[0] - P[i - 1].p[0], P[i].p[1] - P[i - 1].p[1]) < 1e-5) P.splice(i, 1);
    const y0 = (q) => (q.tag === 'lado' ? YB - 2 : q.tag === 'escot' ? NY : YP);
    g.add(mesh(capotaGeo(P, rc, y0, HT), NAVY));
    // escotadura sobre el puerto de carga: fondo rehundido, costados y techo
    const zArc = (x) => zc + Math.sqrt((Rp + rc) ** 2 - (x - xm) ** 2);
    g.add(mesh(rbox(NX1 - NX0, NY - YP, 0.8, 0.25), NAVY2, [(NX0 + NX1) / 2, (YP + NY) / 2, 9.6]));
    for (const [x, s] of [[NX0, -1], [NX1, 1]]) {
      const z1 = zArc(x) - (s > 0 ? 0.7 : 0.25);
      g.add(mesh(box(0.8, NY - YP, z1 - 10), NAVY2, [x + s * 0.4, (YP + NY) / 2, (10 + z1) / 2]));
    }
    const sh = new THREE.Shape(); sh.moveTo(NX0, -10);
    for (let i = 0; i <= 24; i++) { const x = NX0 + ((NX1 - NX0) * i) / 24; sh.lineTo(x, -(zArc(x) - 0.15)); }
    sh.lineTo(NX1, -10); sh.lineTo(NX0, -10);
    const tg = new THREE.ExtrudeGeometry(sh, { depth: 0.8, bevelEnabled: false }); tg.translate(0, 0, -0.4);
    g.add(mesh(tg, NAVY2, [0, NY - 0.4, 0], [-Math.PI / 2, 0, 0]));
  }

  /* ---------------- TIRA DE MANDOS (PANEL FRONTAL) ---------------- */
  {
    const g = makePart(root, 'panel_frontal', L1([0, 0, 50], { shell: true, label: 'equipo' }));
    const h = YB - (YP + 0.5), yc = (YB + YP + 0.5) / 2;
    g.add(mesh(rbox(XW - 14, h, 1.2, 0.4), BLANCO, [(14 + XW) / 2, yc, ZF + 0.1]));
    g.add(mesh(rbox(0.8, h, 5.5, 0.2), BLANCO, [14.4, yc, ZF - 3.25]));                       // retorno hacia la cubierta azul
    const fm = new THREE.MeshPhysicalMaterial({ map: stripTexture(), roughness: 0.5, clearcoat: 0.2 });
    g.add(mesh(new THREE.PlaneGeometry(STRIP.w, STRIP.h), fm, [STRIP.x0 + STRIP.w / 2, STRIP.y1 - STRIP.h / 2, ZF + 0.72]));
    // llave Standby/Operate
    g.add(mesh(cylZ(1.05, 0.5, 32), M.aceroPulido, [LEDX, SY.llave, ZF + 0.95]));
    g.add(mesh(box(0.28, 1.3, 0.3), M.aceroOscuro, [LEDX, SY.llave, ZF + 1.3]));
    // indicadores: con el equipo listo lucen Mains, Ready y Access
    const on = [true, false, false, true, false], onT = [false, false, true];
    SY.sys.forEach((y, i) => g.add(mesh(cylZ(0.32, 0.3, 16), on[i] ? M.ledVerde : LEDOFF, [LEDX, y, ZF + 0.85])));
    SY.tgt.forEach((y, i) => g.add(mesh(cylZ(0.32, 0.3, 16), onT[i] ? M.ledVerde : LEDOFF, [LEDX, y, ZF + 0.85])));
    g.add(mesh(rbox(2.4, 2.4, 0.8, 0.3), VERDE, [LEDX + 0.2, SY.boton, ZF + 0.5]));            // pulsador TARGET IN/OUT
  }
  {
    const g = makePart(root, 'tapa_superior', L1([0, 30, 0], { info: 'carcasa', shell: true }));
    g.add(mesh(rbox(XW - 13.95 + 0.2, 1.2, ZF - ZB + 0.9, 0.4), BLANCO, [(13.95 + XW + 0.2) / 2, YB + 0.6, (ZF + ZB) / 2 + 0.45]));
    const gm = BLANCO.clone(); gm.map = grilleTexture(6, 20); gm.color.setHex(0xa6acb3);
    g.add(mesh(new THREE.PlaneGeometry(8, 30), gm, [20.3, YB + 1.23, -12], [-Math.PI / 2, 0, 0]));
  }
  {
    const g = makePart(root, 'panel_izq', L1([-34, 0, 0], { info: 'carcasa', shell: true }));
    g.add(mesh(rbox(1.0, YB - 2.8, ZF - (ZB + 1), 0.4), BLANCO, [-XW + 0.5, (YB + 2.8) / 2, (ZF + ZB + 1) / 2]));
    const ln = new THREE.MeshStandardMaterial({ color: 0xb9bec4, roughness: 0.6 });
    for (const z of [6, -30]) g.add(mesh(new THREE.PlaneGeometry(0.25, YB - 8), ln, [-XW - 0.02, YB / 2 + 1.5, z], [0, -Math.PI / 2, 0]));
  }
  {
    const g = makePart(root, 'panel_der', L1([34, 0, 0], { info: 'carcasa', shell: true }));
    g.add(mesh(rbox(1.0, YB - 2.8, ZF - 0.5 - (ZB + 1), 0.4), BLANCO, [XW - 0.5, (YB + 2.8) / 2, (ZF - 0.5 + ZB + 1) / 2]));
    const ln = new THREE.MeshStandardMaterial({ color: 0xb9bec4, roughness: 0.6 });
    for (const z of [6, -30]) g.add(mesh(new THREE.PlaneGeometry(0.25, YB - 8), ln, [XW + 0.02, YB / 2 + 1.5, z], [0, Math.PI / 2, 0]));
    const warn = new THREE.MeshStandardMaterial({ map: warningTexture('ALTA TENSIÓN · LÁSER'), roughness: 0.45 });
    g.add(mesh(new THREE.PlaneGeometry(9, 3.4), warn, [XW + 0.03, 92, -12], [0, Math.PI / 2, 0]));
  }
  {
    // puerta trasera azul con bisagras, regleta de conexiones y placas
    const g = makePart(root, 'panel_trasero', L1([0, 0, -40], { shell: true, label: 'equipo' }));
    const back = NAVY.clone(); back.side = THREE.FrontSide;
    g.add(mesh(rbox(XW * 2, YB - 2.8, 1.0, 0.4), back, [0, (YB + 2.8) / 2, ZB + 0.5]));
    for (const x of [-XW + 1.3, XW - 1.3]) for (const y of [18, 92]) g.add(mesh(rbox(1.6, 5, 1.2, 0.3), M.plasticoNegro, [x, y, ZB - 0.5]));
    const xs = -17;
    g.add(mesh(rbox(6, 50, 0.4, 0.2), M.plasticoNegro, [xs, 68, ZB - 0.15]));
    g.add(mesh(rbox(2.0, 4.4, 0.8, 0.3), M.condensador, [xs, 88, ZB - 0.6]));                  // J1001 SIGNAL
    g.add(mesh(rbox(1.6, 3.0, 0.7, 0.3), M.aceroPulido, [xs, 80, ZB - 0.55]));                 // J1002 COM
    g.add(mesh(rbox(2.6, 3.4, 0.9, 0.3), M.ledAmbar, [xs, 72, ZB - 0.65]));                    // interruptor general
    g.add(mesh(rbox(2.8, 2.2, 1.0, 0.3), M.plasticoNegro, [xs, 64, ZB - 0.7]));                // entrada IEC
    g.add(mesh(cylZ(0.6, 1.8, 20), M.aceroPulido, [xs, 56, ZB - 1.25]));                       // EXHAUST
    g.add(mesh(cylZ(1.1, 4.2, 24), M.ptfe, [xs, 56, ZB - 4.25]));                              // filtro del escape
    g.add(mesh(cylZ(0.45, 1.4, 16), M.aceroPulido, [xs, 49, ZB - 1.05]));                      // VENT INLET
    [['J1001  SIGNAL', 88], ['J1002  COM', 80], ['POWER  10 A', 72], ['J1003', 64], ['EXHAUST', 56], ['VENT INLET', 49]].forEach(([t, y]) =>
      g.add(mesh(new THREE.PlaneGeometry(7, 1.4), etiqueta(t, 7, 1.4), [xs + 7.2, y, ZB - 0.03], [0, Math.PI, 0])));
    const plate = new THREE.MeshStandardMaterial({ map: plateTexture(['BRUKER  ·  MICROFLEX', 'MALDI-TOF MS · modelo didáctico', '100–240 V~ 50/60 Hz', 'Explorador 3D']), metalness: 0.6, roughness: 0.4 });
    g.add(mesh(new THREE.PlaneGeometry(9, 4.5), plate, [-6, 40, ZB - 0.03], [0, Math.PI, 0]));
    g.add(mesh(new THREE.PlaneGeometry(9, 1.8), etiqueta('CLASS 1 LASER PRODUCT', 9, 1.8, { bg: '#f2c230', fg: '#111', font: '700 44px Arial' }), [-6, 35.6, ZB - 0.03], [0, Math.PI, 0]));
    // cable de alimentación hasta la mesa
    g.add(mesh(tubePath([[xs, 64, ZB - 1.15], [xs, 63.6, ZB - 4.5], [xs - 1, 52, ZB - 8.5], [xs - 2, 22, ZB - 10.5], [xs - 3, 4, ZB - 11.5], [xs - 5, 0.7, ZB - 16], [xs - 13, 0.7, ZB - 34]], 0.45, 60, 10), M.cable));
  }
  {
    const g = makePart(root, 'filtro_aire', L1([0, 0, -58], { label: 'equipo' }));
    g.add(mesh(rbox(18, 18, 1.2, 0.5), M.anodizado, [4, 16, ZB - 0.6]));
    const hm = new THREE.MeshStandardMaterial({ map: hexTexture(), metalness: 0.4, roughness: 0.5 });
    g.add(mesh(new THREE.PlaneGeometry(15, 15), hm, [4, 16, ZB - 1.22], [0, Math.PI, 0]));
  }

  /* ---------------- ZÓCALO CON EL PUERTO DE CARGA ---------------- */
  {
    const g = makePart(root, 'zocalo', L1([0, 0, 45], { info: 'carcasa', shell: true }));
    const z0 = 9.5, zc = (z0 + ZP) / 2;
    g.add(placaPasos(50, ZP - z0, 1.2, [[LX, LZ - zc, 4.2]], BLANCO, [0, YP - 0.6, zc], 'xz', 0.6));
    g.add(mesh(rbox(50, YP - 1.2 - 2.8, 1.0, 0.45), BLANCO, [0, (YP - 1.2 + 2.8) / 2, ZP - 0.5]));
    for (const s of [-1, 1]) g.add(mesh(rbox(1.0, YP - 1.2 - 2.8, ZP - 1 - z0, 0.35), BLANCO, [s * 24.5, (YP - 1.2 + 2.8) / 2, (z0 + ZP - 1) / 2]));
    // plataforma de carga elevada delante de la escotadura
    const pz0 = 16, pz1 = 32.5, pzc = (pz0 + pz1) / 2;
    g.add(placaPasos(16, pz1 - pz0, 2, [[LX - (LX), LZ - pzc, 4.2]], BLANCO, [LX, YP + 1, pzc], 'xz', 1.2));
    const lab = new THREE.MeshStandardMaterial({ map: textTexture(['MALDI-TOF'], { w: 512, h: 112, bg: '#cfd3d8', fg: '#3b4250', font: '600 64px Segoe UI, Arial' }), roughness: 0.5 });
    g.add(mesh(new THREE.PlaneGeometry(10, 2.2), lab, [-15, 7, ZP + 0.02]));
  }
  {
    const g = makePart(root, 'tapa_carga', L1([0, 22, 10], { label: 'equipo' }));
    g.add(mesh(cylY(4.6, 1.2, 48), M.negroBrillante, [LX, YP + 2.6, LZ]));
    const hd = mesh(rbox(7.6, 1.1, 1.6, 0.45), M.plasticoNegro, [LX, YP + 3.75, LZ]); hd.rotation.y = 0.5; g.add(hd);
    g.add(mesh(cylY(0.6, 0.4, 20), M.aceroPulido, [LX, YP + 4.5, LZ]));
  }

  /* ---------------- ESCLUSA Y CÁMARA DE LA FUENTE ---------------- */
  {
    const g = makePart(root, 'esclusa', L1([0, 0, 0], { label: 'equipo' }));
    g.add(mesh(rbox(12, 9, 13, 0.5), M.acero, [LX, 21.5, LZ]));                              // cámara de la esclusa (y 17–26)
    g.add(mesh(rbox(10, 6, 9.8, 0.3), M.acero, [LX + 0, 21.5, 12.4]));                       // túnel hasta la cámara de la fuente
    const oring = mesh(new THREE.TorusGeometry(4.5, 0.18, 10, 64), M.goma, [LX, 26.16, LZ], [Math.PI / 2, 0, 0]); g.add(oring);
    g.add(mesh(rbox(6, 0.3, 4, 0.1), M.aceroPulido, [LX, 26.15, LZ]));                       // plataforma de la diana
    g.add(mesh(cylX(0.6, 2.4, 24), M.acero, [LX + 7.2, 21.5, LZ - 3]));                      // válvula de bombeo de la esclusa
  }
  {
    const g = makePart(root, 'camara_fuente', L1([0, 0, 0], { shell: true, label: 'equipo' }));
    const yc = YC, h = CH, w = CW, d = CD;
    for (const s of [-1, 1]) {
      g.add(mesh(rbox(w, h, 0.9, 0.2), M.acero, [OX, yc, OZ + s * d / 2]));
      g.add(mesh(rbox(0.9, h, d, 0.2), M.acero, [OX + s * w / 2, yc, OZ]));
    }
    g.add(mesh(rbox(w, 0.9, d, 0.2), M.acero, [OX, yc - h / 2, OZ]));                        // fondo, bajo la mesa XY
    g.add(mesh(cylX(0.5, 0.8, 20), M.aceroPulido, [OX + w / 2 + 0.85, OY + 7.6, OZ]));        // conector SMA de la fibra óptica
    g.add(mesh(cylX(0.45, 0.9, 16), M.aceroPulido, [OX + w / 2 + 0.9, OY + 5, OZ - 4.8]));    // pasamuros del pulso de extracción
    for (const z of [OZ - 4, OZ, OZ + 4]) {                                                    // pasamuros de alta tensión
      g.add(mesh(cylX(0.9, 2.2, 24), M.ceramica, [OX - w / 2 - 1.1, OY + 1, z]));
      g.add(mesh(cylX(0.5, 1.2, 16), M.aceroPulido, [OX - w / 2 - 2.6, OY + 1, z]));
    }
    g.add(mesh(cylZ(1.6, 0.6, 32), M.aceroPulido, [OX - 6, OY + 7, OZ + d / 2 + 0.4]));        // mirilla
    g.add(mesh(cylZ(1.2, 0.65, 32), M.vidrio, [OX - 6, OY + 7, OZ + d / 2 + 0.5]));
    screws(g, M.tornillo, M.tornilloNegro, 0.3, 'z', [[OX - 8, yc + 7.5, OZ + d / 2 + 0.45], [OX + 8, yc + 7.5, OZ + d / 2 + 0.45], [OX - 8, yc - 7.5, OZ + d / 2 + 0.45]]);
  }

  /* ---------------- LÁSER ---------------- */
  {
    const g = makePart(root, 'laser', L1([28, 0, 0], { label: 'equipo' }));
    g.add(mesh(rbox(9, 22, 20, 0.5), M.anodizado, [19.5, 44, -12]));
    g.add(mesh(rbox(9.2, 2, 20.2, 0.3), M.azulBruker, [19.5, 53.9, -12]));
    const lw = new THREE.MeshStandardMaterial({ map: warningTexture('RADIACIÓN LÁSER'), roughness: 0.45 });
    g.add(mesh(new THREE.PlaneGeometry(8, 3), lw, [19.5, 44, -1.97]));
    g.add(mesh(rbox(5, 5, 6, 0.4), M.aceroOscuro, [19.5, 57.6, -6]));                        // atenuador variable
    g.add(mesh(cylX(0.9, 2, 24), M.aceroPulido, [15.9, 57.6, -6]));
  }
  {
    // fibra: atenuador → por delante del generador de pulsos → conector SMA de la pared derecha de la cámara
    const g = makePart(root, 'fibra_optica', L1([0, 0, 0], { label: null }));
    cableFlex(g, [[14.85, 57.6, -6, 'laser'], [12.5, 57.6, -5.4, 'laser'], [8.5, 55, -1.5, 'camara_fuente'], [6.2, 46, 1, 'camara_fuente'], [5.5, 37, 1, 'camara_fuente'],
      [5.2, 32, 0.2, 'camara_fuente'], [5.0, OY + 7.6, OZ, 'camara_fuente'], [OX + CW / 2 + 1.3, OY + 7.6, OZ, 'camara_fuente']], 0.22, M.cable, { seg: 90, radial: 10 });
  }

  /* ---------------- SISTEMA DE VACÍO ---------------- */
  const yT = OY + 30, z0 = OZ - AX.TUBE_R - 3.3;            // bomba turbo en el puerto trasero del tubo de vuelo
  {
    const g = makePart(root, 'bomba_turbo', L1([0, 0, -22], { label: 'equipo' }));
    g.add(mesh(cylZ(4.4, 1.0, 48), M.aceroPulido, [OX, yT, z0 - 0.5]));
    g.add(mesh(cylZ(4.0, 10, 48), M.aluminio, [OX, yT, z0 - 6]));
    for (const dz of [3, 8]) g.add(mesh(cylZ(4.08, 0.4, 48), M.aceroOscuro, [OX, yT, z0 - dz]));
    g.add(mesh(rbox(7, 5, 3, 0.4), M.anodizado, [OX, yT - 1, z0 - 12.4]));
    for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2;
      screws(g, M.tornillo, M.tornilloNegro, 0.25, '-z', [[OX + Math.cos(a) * 3.7, yT + Math.sin(a) * 3.7, z0 - 1.0]]); }
    g.add(mesh(cylX(0.7, 2.4, 24), M.aceroPulido, [OX + 4.8, yT - 2, z0 - 9]));
  }
  const PM = [13, -22];                                       // bomba de membrana (x, z)
  {
    const g = makePart(root, 'bomba_membrana', L1([24, 0, 0], { label: 'equipo' }));
    g.add(mesh(rbox(14, 10, 16, 0.6), M.carcasaOsc, [PM[0], 9.1, PM[1]]));
    for (const dz of [-5, 5]) { g.add(mesh(cylY(3.4, 2.2, 40), M.aluminio, [PM[0], 15.2, PM[1] + dz])); g.add(mesh(cylY(3.0, 0.6, 40), M.aceroOscuro, [PM[0], 16.6, PM[1] + dz])); }
    g.add(mesh(cylZ(3.6, 6, 40), M.anodizado, [PM[0], 8, PM[1] + 11.1]));
    for (const dx of [-6, 6]) for (const dz of [-7, 7]) g.add(mesh(cylY(0.8, 1.4, 16), M.goma, [PM[0] + dx, 3.4, PM[1] + dz]));
    g.add(mesh(cylY(0.7, 3, 20), M.aceroPulido, [PM[0], 15.6, PM[1]]));                       // tubuladura de aspiración
  }
  {
    // T sobre la aspiración de la bomba (se desplaza con ella) y las dos mangueras: escape de la turbo y bombeo de la esclusa
    const g = makePart(root, 'linea_vacio_previo', L1([24, 0, 0]));
    g.add(mesh(rbox(2.2, 2.2, 2.2, 0.4), M.aceroPulido, [PM[0], 18.2, PM[1]]));
    g.add(mesh(rbox(1.4, 2.0, 1.6, 0.3), M.plasticoNegro, [PM[0] + 1.8, 18.2, PM[1]]));     // válvula controlada (rama de la esclusa)
    const tz = z0 - 9, ty = yT - 2;
    cableFlex(g, [[OX + 6.05, ty, tz, 'bomba_turbo'], [OX + 8.6, ty - 0.4, tz, 'bomba_turbo'], [6, 46, tz - 1, 'bomba_turbo'], [9, 38, -19], [10.5, 30, -20.5],
      [12.4, 23.5, -21.6], [PM[0], 21, PM[1]], [PM[0], 19.35, PM[1]]], 0.4, M.ptfe, { seg: 100, radial: 10 });
    cableFlex(g, [[LX + 8.45, 21.5, LZ - 3, 'esclusa'], [LX + 11, 21, LZ - 4.5, 'esclusa'], [15, 20.2, 12], [18, 19.6, 0], [18, 19.2, -12], [17.4, 18.6, PM[1] + 1.5],
      [PM[0] + 3.6, 18.2, PM[1]], [PM[0] + 2.55, 18.2, PM[1]]], 0.32, M.ptfe, { seg: 110, radial: 10 });
  }

  /* ---------------- ELECTRÓNICA ---------------- */
  {
    const g = makePart(root, 'fuentes_alta_tension', L1([-24, 0, 0], { label: 'equipo' }));
    g.add(mesh(rbox(10, 30, 26, 0.6), M.anodizado, [-17, 55, -8]));
    for (const z of [OZ + 4, OZ, OZ - 4, OZ - 8]) g.add(mesh(cylY(0.7, 1.4, 24), M.ceramica, [-17, 39.3, z]));   // conectores de AT
    const w = new THREE.MeshStandardMaterial({ map: warningTexture('ALTA TENSIÓN 20 kV'), roughness: 0.45 });
    g.add(mesh(new THREE.PlaneGeometry(8, 3), w, [-11.97, 60, -8], [0, Math.PI / 2, 0]));
    // cables de AT: bajan junto a la cámara hasta los pasamuros de su pared izquierda (en paralelo, separados 4 cm)
    for (let i = 0; i < 3; i++) {
      const z = OZ + 4 - i * 4, xf = OX - CW / 2 - 3.25;
      cableFlex(g, [[-17, 38.55, z], [-17, 36, z], [-18.2, 31, z, 'camara_fuente'], [-19.6, 26, z, 'camara_fuente'], [-19.6, OY + 1.4, z, 'camara_fuente'],
        [-18.9, OY + 1, z, 'camara_fuente'], [xf, OY + 1, z, 'camara_fuente']], 0.28, M.ptfe, { seg: 80, radial: 8 });
    }
  }
  {
    const g = makePart(root, 'generador_pulsos', L1([16, 0, 0], { label: 'equipo' }));
    g.add(mesh(rbox(7, 8, 10, 0.5), M.aluminio, [9.8, 40, -9]));
    for (let i = 0; i < 5; i++) g.add(mesh(box(5.6, 0.3, 0.5), M.aceroOscuro, [9.8, 37.4 + i * 1.3, -3.85]));
    g.add(mesh(cylX(0.5, 1.0, 16), M.aceroPulido, [5.8, 38, -8.5]));                         // salida BNC
    cableFlex(g, [[5.25, 38, -8.5], [4.9, 35, -7.6], [5.0, 29, -6.2, 'camara_fuente'], [5.0, OY + 5, OZ - 4.8, 'camara_fuente'], [OX + CW / 2 + 1.4, OY + 5, OZ - 4.8, 'camara_fuente']],
      0.14, M.cable, { seg: 40, radial: 8 });
  }
  {
    const g = makePart(root, 'placa_control', L1([0, 0, -26], { label: 'equipo' }));
    g.add(mesh(rbox(34, 26, 0.25, 0.05), M.pcb, [0, 83, ZB + 3.5]));
    const rnd = (() => { let a = 5; return () => ((a = (a * 16807) % 2147483647) / 2147483647); })();
    for (let i = 0; i < 38; i++) {
      const x = -15 + rnd() * 30, y = 72 + rnd() * 22;
      if (rnd() < 0.65) g.add(mesh(box(0.8 + rnd(), 0.8 + rnd(), 0.25), M.chip, [x, y, ZB + 3.75]));
      else g.add(mesh(cylZ(0.35, 0.9, 16), M.condensador, [x, y, ZB + 4.1]));
    }
    screws(g, M.tornillo, M.tornilloNegro, 0.25, 'z', [[-16, 95, ZB + 3.65], [16, 95, ZB + 3.65], [-16, 71, ZB + 3.65], [16, 71, ZB + 3.65]]);
    g.add(mesh(rbox(16, 8, 14, 0.4), M.anodizado, [-14, 7, -23]));          // fuente de alimentación de baja tensión
  }

  /* ---------------- PC DE ADQUISICIÓN (a la izquierda, sobre la mesa) ---------------- */
  {
    const g = makePart(root, 'pc', L1([-40, 0, 0], { label: 'equipo' }));
    const x = -64, zm = 0;
    // monitor de 24" con pie
    g.add(mesh(rbox(22, 1.0, 15, 0.5), M.plasticoNegro, [x, 0.5, zm + 2]));
    g.add(mesh(rbox(5, 24, 2.2, 0.8), M.plata, [x, 13, zm - 2.6]));
    g.add(mesh(rbox(55, 33.5, 2.0, 0.6), M.negroBrillante, [x, 34.5, zm - 0.4]));
    g.add(mesh(rbox(20, 12, 1.6, 0.6), M.plasticoNegro, [x, 34.5, zm - 1.9]));
    const sc = new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0xffffff, emissiveIntensity: 0.78, emissiveMap: pcScreen(), roughness: 0.25 });
    g.add(mesh(new THREE.PlaneGeometry(52.6, 31.2), sc, [x, 34.9, zm + 0.62]));
    // teclado y ratón
    g.add(mesh(rbox(44, 1.6, 14, 0.5), M.plasticoNegro, [x, 0.8, 22]));
    const km = new THREE.MeshStandardMaterial({ map: keyboardTexture(), roughness: 0.6 });
    g.add(mesh(new THREE.PlaneGeometry(42.5, 12.8), km, [x, 1.62, 22], [-Math.PI / 2, 0, 0]));
    g.add(mesh(rbox(6, 2.2, 10, 1.0), M.plasticoNegro, [x + 30, 1.1, 22]));
    // torre del PC (con la tarjeta digitalizadora)
    const xt = x - 40;
    g.add(mesh(rbox(18, 42, 44, 0.6), M.plasticoNegro, [xt, 21, -4]));
    g.add(mesh(rbox(16, 39, 0.8, 0.4), M.carcasaOsc, [xt, 21.5, 18.3]));
    for (let i = 0; i < 8; i++) g.add(mesh(box(12, 0.35, 0.2), M.plasticoNegro, [xt, 26 + i * 1.6, 18.78]));
    g.add(mesh(cylZ(0.9, 0.4, 24), M.plata, [xt, 37, 18.8]));
    g.add(mesh(cylZ(0.35, 0.2, 16), M.ledVerde, [xt, 37, 19.05]));
    g.add(mesh(rbox(10, 1.4, 0.4, 0.15), M.carcasaOsc, [xt, 33, 18.9]));
  }

  refs.analyzer = buildAnalizador(root);

  // fibra, mangueras y cables son cableFlex: siguen a sus piezas al despiezar
  refs.update = () => {};
  return refs;
}
