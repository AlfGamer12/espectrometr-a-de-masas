// Equipo completo: cromatógrafo de gases Agilent 7890B (59 × 50 × 54 cm) con inyector automático 7693A, según las fotografías
// del equipo del laboratorio: cuerpo blanco, módulo izquierdo con plataforma negra sobre la que gira la torreta, puerta del horno
// en el centro, columna negra de teclado y pantalla a la derecha. En la trasera, los pasamuros de gases; en la pared, el panel de
// reguladores (helio, aire, nitrógeno, hidrógeno) y, sobre la mesa, los filtros de gas. Frente hacia +Z, mesa en y = 0.
// Las piezas del inyector, la columna, el FID y la neumática interna están en analizador.js (modo 2).
import * as THREE from 'three';
import { M } from '../../materials.js';
import { mesh, rbox, box, cylX, cylY, cylZ, grilleTexture, screws, plateTexture, placaPasos, pasamuros } from '../../geom.js';
import { makePart, cableFlex } from '../../parts.js';
import { buildAnalizador } from './analizador.js';
import { GC, OV, INY, DET, LAB, ALS, FAN, FY } from './geometria.js';

const L1 = (offset, extra = {}) => ({ level: 1, offset, mode: 'equipo', ...extra });

/* ---------------- texturas de canvas ---------------- */
function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}
const decalMat = (tex, extra = {}) => new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: 0.45, metalness: 0, ...extra });
function decal(g, tex, w, h, pos, rot = [0, 0, 0], extra) {
  const d = mesh(new THREE.PlaneGeometry(w, h), decalMat(tex, extra), pos, rot); d.castShadow = false; g.add(d); return d;
}
/** Logotipo «chispa» de Agilent simplificado: puntos en rayos que menguan hacia fuera. */
export function chispa(g, cx, cy, s, color) {
  g.fillStyle = color;
  g.beginPath(); g.arc(cx, cy, s * 0.12, 0, Math.PI * 2); g.fill();
  for (let k = 0; k < 12; k++) {
    const a = (k * Math.PI) / 6 + (k % 2) * 0.12, n = k % 2 ? 3 : 4;
    for (let i = 1; i <= n; i++) {
      const r = s * (0.12 + i * 0.21), d = s * (0.09 - i * 0.016);
      g.beginPath(); g.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r, Math.max(1.1, d), 0, Math.PI * 2); g.fill();
    }
  }
}
function txt(g, s, x, y, font, color, align = 'left') { g.font = font; g.fillStyle = color; g.textAlign = align; g.textBaseline = 'middle'; g.fillText(s, x, y); }

/** Rótulo superior de la columna del teclado: chispa, «Agilent Technologies» y «7890B GC System». */
function logoTex() {
  return canvasTex(700, 430, (g) => {
    chispa(g, 92, 150, 58, '#eef1f4');
    txt(g, 'Agilent Technologies', 176, 152, '600 50px "Segoe UI", Arial', '#eef1f4');
    txt(g, '7890B', 178, 246, '700 52px "Segoe UI", Arial', '#eef1f4');
    txt(g, 'GC System', 352, 250, '600 36px "Segoe UI", Arial', '#eef1f4');
  });
}
/** Pantalla fluorescente de vacío (VFD) de cuatro líneas. */
function displayTex() {
  return canvasTex(680, 250, (g, w, h) => {
    g.fillStyle = '#05080a'; g.fillRect(0, 0, w, h);
    const L = [['OVEN', '40', '40'], ['FRONT INLET  S/SL', '250', '250'], ['FRONT DET  FID', '300', '300'], ['FLAME  ON', '6.3 pA', '']];
    L.forEach(([k, a, s], i) => {
      const y = 40 + i * 56;
      txt(g, k, 22, y, '500 30px Consolas, monospace', '#4ad3c4');
      txt(g, a, 470, y, '500 30px Consolas, monospace', '#4ad3c4', 'right');
      txt(g, s, 640, y, '500 30px Consolas, monospace', '#4ad3c4', 'right');
    });
  });
}
/** Teclado del 7890B (según las fotografías): gráfico de la rampa del horno, pilotos de estado y teclas. */
function tecladoTex() {
  const S = 40; // px por cm; plano de 14 × 33,6 cm
  return canvasTex(14 * S, 33.6 * S, (g, w, h) => {
    g.fillStyle = '#2a2d31'; g.beginPath(); g.roundRect(0, 0, w, h, 18); g.fill();
    g.fillStyle = '#34383d'; g.beginPath(); g.roundRect(14, 14, w - 28, 300, 12); g.fill();
    // rótulos «Actual / Setpoint» bajo la pantalla
    // gráfico de la rampa del horno
    txt(g, 'Oven Ramp', 40, 48, '600 19px "Segoe UI", Arial', '#d9dde2');
    g.strokeStyle = '#c9ced4'; g.lineWidth = 2; g.beginPath(); g.moveTo(40, 64); g.lineTo(230, 64); g.stroke();
    g.lineWidth = 3; g.beginPath(); g.moveTo(52, 170); g.lineTo(110, 170); g.lineTo(170, 116); g.lineTo(232, 116); g.stroke();
    for (const [x, y, s] of [[44, 170, 'Pre\nRun'], [110, 170, 'Initial\nTemp'], [140, 143, 'Rate'], [200, 116, 'Final\nTemp'], [250, 116, 'Post\nRun']]) {
      g.fillStyle = '#16181b'; g.beginPath(); g.arc(x, y, 7, 0, 7); g.fill();
      s.split('\n').forEach((l, i) => txt(g, l, x, y + (y > 150 ? 26 : -40) + i * 18, '500 15px "Segoe UI", Arial', '#c9ced4', 'center'));
    }
    const leds = [['Not\nReady', 316, 50], ['Run', 470, 56], ['Remote', 316, 110], ['Clock\nTable', 316, 166], ['Run\nLog', 470, 166], ['Gas\nSaver', 316, 226], ['Service\nDue', 470, 226]];
    for (const [s, x, y] of leds) {
      g.fillStyle = s === 'Run' ? '#1d3b25' : '#16181b'; g.beginPath(); g.arc(x, y, 7, 0, 7); g.fill();
      s.split('\n').forEach((l, i, a) => txt(g, l, x + 18, y + (i - (a.length - 1) / 2) * 17, '500 15px "Segoe UI", Arial', '#c9ced4'));
    }
    // teclas
    const key = (x, y, kw, kh, label, col = '#d5d8dc', fg = '#22262a') => {
      g.fillStyle = 'rgba(0,0,0,0.55)'; g.beginPath(); g.roundRect(x + 2, y + 3, kw, kh, 5); g.fill();
      const gr = g.createLinearGradient(0, y, 0, y + kh); gr.addColorStop(0, col); gr.addColorStop(1, '#a9aeb4');
      g.fillStyle = col === '#d5d8dc' ? gr : col; g.beginPath(); g.roundRect(x, y, kw, kh, 5); g.fill();
      label.split('\n').forEach((l, i, a) => txt(g, l, x + 7, y + kh / 2 + (i - (a.length - 1) / 2) * 15, '600 13px "Segoe UI", Arial', fg));
    };
    key(40, 340, 170, 46, 'Stop'); key(300, 344, 52, 40, 'Prep\nRun'); key(366, 340, 150, 46, 'Start');
    const fil = [['Oven', 'Front\nInlet', 'Col 1', 'Front\nDet', 'Analog\nOut 1', 'Front\nInjector'], ['Valve #', 'Back\nInlet', 'Col 2', 'Back\nDet', 'Analog\nOut 2', 'Back\nInjector'],
      ['Aux\nTemp #', 'Aux\nEPC #', 'Aux\nCol #', 'MS/\nAux Det', 'Column\nComp', 'Service\nMode']];
    fil.forEach((f, j) => f.forEach((s, i) => key(36 + i * 82, 420 + j * 66, 64, 46, s, s === 'Service\nMode' ? '#2766b8' : '#d5d8dc', s === 'Service\nMode' ? '#fff' : '#22262a')));
    const izq = ['Status', 'Time', 'Post\nRun', 'Logs', 'Options', 'Config'], med = ['Mode/\nType', 'On/\nYes', 'Off/\nNo', 'Front', 'Back', 'Delete'];
    izq.forEach((s, j) => key(36, 640 + j * 60, 64, 42, s, '#aab0b6'));
    med.forEach((s, j) => key(160, 640 + j * 60, 64, 42, s));
    key(266, 640, 64, 42, 'Info', '#d5d8dc', '#1d63c9'); key(348, 640, 64, 42, 'Clear');
    key(266, 700, 150, 42, 'Enter');
    key(440, 640, 64, 42, '▲'); key(440, 700, 64, 42, '▼');
    const num = [['7', '8', '9'], ['4', '5', '6'], ['1', '2', '3'], ['0', '.', '−']];
    num.forEach((f, j) => f.forEach((s, i) => key(266 + i * 88, 760 + j * 60, 64, 42, s)));
    txt(g, 'Method Storage and Automation', 40, 1028, '600 15px "Segoe UI", Arial', '#c9ced4');
    const fin = [['Load', 'Method', 'Run\nTable', 'Seq\nControl', '', 'User\nKey 1'], ['Store', 'Seq', 'Clock\nTable', 'Sample\nTray', 'Prog', 'User\nKey 2']];
    fin.forEach((f, j) => f.forEach((s, i) => key(36 + i * 82, 1050 + j * 62, 64, 44, s, '#aab0b6')));
  });
}
/** Lateral del 7890B: bandas de ranuras de ventilación arriba y abajo y los arcos en relieve del lateral izquierdo. */
function lateralTex(arcos, w = 1060, h = 760) {
  return canvasTex(w, h, (g) => {
    g.clearRect(0, 0, w, h);
    g.fillStyle = 'rgba(40,44,50,0.82)';
    for (const [y0, x0, x1] of [[40, 70, 560], [620, 80, 980]]) for (let x = x0; x < x1; x += 18) { g.beginPath(); g.roundRect(x, y0, 6, 90, 3); g.fill(); }
    if (arcos) {
      g.strokeStyle = 'rgba(160,166,174,0.55)'; g.lineWidth = 3;
      for (const [cx, cy, r] of [[560, 420, 250], [560, 420, 190], [760, 500, 120], [380, 560, 70]]) { g.beginPath(); g.arc(cx, cy, r, 0.2, Math.PI * 1.6); g.stroke(); }
      g.beginPath(); g.moveTo(330, 470); g.lineTo(520, 470); g.stroke();
      g.fillStyle = 'rgba(60,64,70,0.7)'; g.beginPath(); g.moveTo(860, 640); g.lineTo(880, 606); g.lineTo(900, 640); g.closePath(); g.fill();
    }
  });
}
function etiquetaTex(s, { w = 256, h = 64, bg = '#e9ebee', fg = '#262b31', font = '600 34px "Segoe UI", Arial' } = {}) {
  return canvasTex(w, h, (g) => { g.fillStyle = bg; g.fillRect(0, 0, w, h); txt(g, s, w / 2, h / 2 + 2, font, fg, 'center'); });
}
function manometroTex() {
  return canvasTex(256, 256, (g) => {
    g.fillStyle = '#f4f4f0'; g.beginPath(); g.arc(128, 128, 124, 0, 7); g.fill();
    g.strokeStyle = '#1b1d20'; g.lineWidth = 3;
    for (let i = 0; i <= 20; i++) { const a = Math.PI * (0.75 + i * 0.075); g.beginPath(); g.moveTo(128 + Math.cos(a) * 100, 128 + Math.sin(a) * 100); g.lineTo(128 + Math.cos(a) * (i % 5 ? 90 : 80), 128 + Math.sin(a) * (i % 5 ? 90 : 80)); g.stroke(); }
    g.strokeStyle = '#c92a2a'; g.lineWidth = 6; g.beginPath(); g.arc(128, 128, 104, Math.PI * 2.0, Math.PI * 2.25); g.stroke();
    g.strokeStyle = '#111'; g.lineWidth = 5; g.beginPath(); g.moveTo(128, 128); g.lineTo(128 + Math.cos(Math.PI * 1.45) * 86, 128 + Math.sin(Math.PI * 1.45) * 86); g.stroke();
    g.fillStyle = '#111'; g.beginPath(); g.arc(128, 128, 10, 0, 7); g.fill();
  });
}
function filtroTex(col) {
  return canvasTex(256, 200, (g) => {
    g.fillStyle = '#f7f8f9'; g.fillRect(0, 0, 256, 200);
    chispa(g, 70, 56, 30, '#2f8fd8');
    txt(g, 'Gas Clean', 110, 50, '700 30px "Segoe UI", Arial', '#1d2329');
    txt(g, 'Filter', 110, 84, '500 24px "Segoe UI", Arial', '#4b5158');
    g.fillStyle = col; g.fillRect(40, 120, 176, 26);
    g.fillStyle = '#1d2329'; g.fillRect(40, 160, 176, 6);
  });
}

/** Placa horizontal de contorno libre [[x, z]…] con agujeros [x, z, r], centrada en la altura y. */
function planta(pts, holes, t, y, mat) {
  const s = new THREE.Shape(); pts.forEach(([x, z], i) => (i ? s.lineTo(x, -z) : s.moveTo(x, -z)));
  for (const [x, z, r] of holes) { const h = new THREE.Path(); h.absarc(x, -z, r, 0, Math.PI * 2, true); s.holes.push(h); }
  const g = new THREE.ExtrudeGeometry(s, { depth: t, bevelEnabled: false, curveSegments: 32 }); g.translate(0, 0, -t / 2);
  return mesh(g, mat, [0, y, 0], [-Math.PI / 2, 0, 0]);
}
function mulberry(a) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
/** Componentes sobre una PCB vertical (normal en ±X). */
function pcbChipsX(g, x, y0, z0, h, w, n, sign = 1) {
  // rejilla de celdas (sin solapes) con un componente por celda
  const R = mulberry(31 + n), nz = Math.ceil(Math.sqrt((n * w) / h)), ny = Math.ceil(n / nz), ch = h / ny, cw = w / nz;
  for (let i = 0; i < n; i++) {
    const y = y0 - h / 2 + ch * (Math.floor(i / nz) + 0.5), z = z0 - w / 2 + cw * ((i % nz) + 0.5), k = R(), s = Math.min(ch, cw / 1.6) * (0.45 + R() * 0.35);
    if (k < 0.55) g.add(mesh(box(0.25, s, s * 1.2), M.chip, [x + sign * 0.125, y, z]));
    else if (k < 0.8) g.add(mesh(cylX(0.35, 0.9), M.condensador, [x + sign * 0.45, y, z]));
    else g.add(mesh(box(0.6, 0.5, s * 1.6), M.plasticoNegro, [x + sign * 0.3, y, z]));
  }
}

export function buildEquipo(root) {
  const refs = {};
  const BL = M.carcasa.clone(); BL.color.setHex(0xeef0f2);                 // blanco cálido de las carcasas
  const BLG = M.carcasa.clone(); BLG.color.setHex(0xe2e5e8);               // laterales, algo más grises
  const BASE = M.grisClaro.clone(); BASE.color.setHex(0xc9cdd2);           // zócalo
  const NEG = M.negroBrillante.clone(); NEG.color.setHex(0x1b1d20); NEG.roughness = 0.4;
  const TECL = M.carcasaOsc.clone(); TECL.color.setHex(0x3a3e43);          // columna del teclado
  const VIDRIO_OSC = new THREE.MeshPhysicalMaterial({ color: 0x0a0c0e, metalness: 0.1, roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.04 });
  const PARED = M.grisClaro.clone(); PARED.color.setHex(0xe7e3da); PARED.clearcoat = 0;
  const COBRE = M.cobre.clone(); COBRE.roughness = 0.38;
  const grille = grilleTexture(24, 8);
  const rejilla = () => { const m = BL.clone(); m.map = grille; m.color.setHex(0xb5bac0); return m; };
  const { XL, XR, XA, XC, XD, ZB, ZF, YP, YDOOR, YDECK, YTOP } = GC;

  /* ================= ZÓCALO ================= */
  {
    const g = makePart(root, 'chasis', L1([0, 0, 0], { label: null, info: 'chasis' }));
    g.add(mesh(rbox(XD - XL - 0.3, YP - 0.4, 53.2, 0.4), BASE, [(XL + 0.2 + XD - 0.1) / 2, 2.4, -0.2]));
    g.add(mesh(rbox(XR - XD - 0.3, YP - 0.4, 51.8, 0.4), BASE, [(XD + XR) / 2, 2.4, -0.9]));
    for (const x of [XL + 4, XR - 4]) for (const z of [ZB + 4, ZF - 4]) g.add(mesh(cylY(1.4, 0.4, 20), M.goma, [x, 0.2, z]));
    // interruptor general (abajo a la izquierda) y pie semicircular bajo la puerta
    g.add(mesh(rbox(2.4, 1.3, 0.6, 0.2), BL, [-25, 2.4, 26.6]));
    g.add(mesh(box(1.4, 0.5, 0.1), M.plasticoNegro, [-25, 2.4, 26.95]));
    const pie = new THREE.CylinderGeometry(2.0, 2.0, 0.8, 28, 1, false, Math.PI / 2, Math.PI); pie.rotateX(Math.PI / 2);
    g.add(mesh(pie, M.plasticoNegro, [9, 0.45, 26.85]));
  }

  /* ================= HORNO (cámara aislada) ================= */
  {
    const g = makePart(root, 'horno', L1([0, 0, 0], { shell: true, label: 'equipo' }));
    const x0 = -18, x1 = 14.4, cx = (x0 + x1) / 2, z0 = OV.back, z1 = 24.4, cz = (z0 + z1) / 2;
    const INOX = M.acero;
    g.add(mesh(box(x1 - x0, 1.4, z1 - z0), INOX, [cx, 5.3, cz]));                                         // suelo
    g.add(placaPasos(x1 - x0, z1 - z0, 2.0, [[INY.x - cx, INY.z - cz, 1.2], [DET.x - cx, DET.z - cz, 1.2]], INOX, [cx, (OV.y1 + OV.roof) / 2, cz], 'xz', 0.2)); // techo
    g.add(mesh(box(OV.x0 - x0, OV.y1 - OV.y0, z1 - z0), INOX, [(x0 + OV.x0) / 2, (OV.y0 + OV.y1) / 2, cz]));      // pared izquierda
    g.add(mesh(box(x1 - OV.x1, OV.y1 - OV.y0, z1 - z0), INOX, [(OV.x1 + x1) / 2, (OV.y0 + OV.y1) / 2, cz]));      // pared derecha
    const bcx = (OV.x0 + OV.x1) / 2, bcy = (OV.y0 + OV.y1) / 2;
    g.add(placaPasos(OV.x1 - OV.x0, OV.y1 - OV.y0, OV.z0 - z0, [[FAN.x - bcx, FAN.y - bcy, 0.7]], INOX, [bcx, bcy, (z0 + OV.z0) / 2], 'xy', 0.1)); // pared trasera
  }

  /* ================= PUERTA DEL HORNO ================= */
  {
    const g = makePart(root, 'puerta_horno', L1([0, 0, 30], { shell: true, label: 'equipo' }));
    g.add(mesh(rbox(XD - XA - 0.2, YDOOR - 4.6, 2.2, 0.45), BL, [0, (4.6 + YDOOR) / 2, 25.9]));
    g.add(mesh(box(XD - XA - 3, YDOOR - 8, 0.3), M.aceroPulido, [0, (4.6 + YDOOR) / 2, 24.68]));           // chapa interior
  }

  /* ================= MÓDULO IZQUIERDO, PLATAFORMA DE INYECTORES Y CUBIERTA TRASERA ================= */
  {
    const g = makePart(root, 'frontal_izq', L1([-6, 0, 24], { info: 'carcasa', shell: true }));
    g.add(mesh(rbox(XA - XL - 0.2, 42.2, 0.8, 0.3), BL, [(XL + XA) / 2, 25.7, 26.4]));
  }
  {
    // plataforma negra: soporta la torre del 7693A y deja asomar la tuerca del septum del inyector delantero
    const g = makePart(root, 'tapa_inyectores', L1([-24, 0, 0], { label: 'equipo' }));
    const x0 = XL + 0.1, x1 = XC, z0 = -2.4, z1 = 26.8, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
    g.add(placaPasos(x1 - x0, z1 - z0, 0.6, [[INY.x - cx, INY.z - cz, 1.3]], NEG, [cx, YDECK - 0.3, cz], 'xz', 0.3));
    g.add(pasamuros(1.3, M.goma, [INY.x, YDECK + 0.02, INY.z], 'y', 0.2));
  }
  {
    // cubierta blanca elevada sobre los módulos neumáticos (atrás a la izquierda), con rejilla superior
    const g = makePart(root, 'cubierta_epc', L1([-8, 22, -8], { info: 'carcasa', shell: true }));
    const x0 = XL + 0.1, x1 = XC, z0 = ZB + 0.9, z1 = -2.2;
    g.add(mesh(rbox(x1 - x0, 4.6, z1 - z0, 0.6), BL, [(x0 + x1) / 2, 49.2, (z0 + z1) / 2]));
    g.add(mesh(new THREE.PlaneGeometry(12, 18), rejilla(), [(x0 + x1) / 2, 51.52, (z0 + z1) / 2], [-Math.PI / 2, 0, 0]));
  }

  /* ================= TAPA SUPERIOR ================= */
  {
    const g = makePart(root, 'tapa_superior', L1([0, 30, 0], { info: 'carcasa', shell: true, label: 'equipo' }));
    // placa superior con los pasos de las chimeneas de los detectores (delantero y trasero)
    g.add(planta([[XC, ZB + 0.2], [XR - 0.1, ZB + 0.2], [XR - 0.1, 25.2], [XD - 0.05, 25.2], [XD - 0.05, 27.0], [XC, 27.0]],
      [[DET.x, DET.z, 1.3], [DET.x, -1, 1.3]], 0.8, YTOP - 0.4, BL));
    g.add(mesh(rbox(XD - XC - 0.25, 7.9, 0.8, 0.3), BL, [(XC + XD) / 2 - 0.05, 44.95, 26.5]));          // frente sobre la puerta
    g.add(mesh(rbox(0.8, 1.2, 29.0, 0.2), BL, [XC + 0.55, 48.3, 12.2]));                               // faldón izquierdo sobre la plataforma
    // asidero semicircular del frente
    const asa = new THREE.CylinderGeometry(2.4, 2.4, 0.3, 28, 1, false, Math.PI / 2, Math.PI); asa.rotateX(Math.PI / 2);
    g.add(mesh(asa, M.grisClaro, [7.5, 41.1, 26.98]));
    for (const z of [DET.z, -1]) g.add(pasamuros(1.3, M.aceroOscuro, [DET.x, YTOP + 0.02, z], 'y', 0.18));
    g.add(mesh(new THREE.PlaneGeometry(12, 16), rejilla(), [22, YTOP + 0.02, -15], [-Math.PI / 2, 0, 0]));
  }

  /* ================= COLUMNA DEL TECLADO Y PANTALLA ================= */
  {
    const g = makePart(root, 'teclado', L1([14, 0, 24], { label: 'equipo' }));
    const cx = (XD + XR) / 2;
    g.add(mesh(rbox(XR - XD - 0.3, 49.2, 3.2, 0.6), TECL, [cx - 0.05, 25.6, 27.0]));
    decal(g, logoTex(), 13.0, 8.0, [cx, 45.6, 28.62]);
    g.add(mesh(rbox(13.6, 5.2, 0.4, 0.15), VIDRIO_OSC, [cx, 38.0, 28.75]));
    const dtx = displayTex();
    decal(g, dtx, 12.6, 4.6, [cx, 38.0, 28.96], [0, 0, 0], { emissive: 0xffffff, emissiveIntensity: 0.6, emissiveMap: dtx });
    decal(g, etiquetaTex('Actual        Setpoint', { w: 512, h: 48, bg: 'rgba(0,0,0,0)', fg: '#d9dde2', font: '500 26px "Segoe UI", Arial' }), 8.4, 0.8, [cx + 1.6, 34.9, 28.62]);
    decal(g, tecladoTex(), 14.0, 33.0, [cx, 17.9, 28.62]);
    // cable plano del teclado a la placa principal
    cableFlex(g, [[cx, 30, 25.6], [cx, 30, 24.6], [22.6, 30.2, 22.0, 'electronica'], [22.6, 30.2, 20.6, 'electronica']], 0.25, M.cableGris, { seg: 30, radial: 6 });
  }

  /* ================= LATERALES Y TRASERA ================= */
  {
    const g = makePart(root, 'panel_izq', L1([-28, 0, 0], { info: 'carcasa', shell: true }));
    g.add(mesh(rbox(0.8, 42.2, 52.6, 0.3), BLG, [XL + 0.4, 25.7, -0.5]));
    decal(g, lateralTex(true), 52, 37.4, [XL - 0.02, 26, -0.5], [0, -Math.PI / 2, 0], { transparent: true });
  }
  {
    const g = makePart(root, 'panel_der', L1([26, 0, 0], { info: 'carcasa', shell: true }));
    g.add(mesh(rbox(0.8, 43.5, 51.8, 0.3), BLG, [XR - 0.4, 26.35, -0.9]));
    decal(g, lateralTex(false), 51, 37.4, [XR + 0.02, 26, -0.9], [0, Math.PI / 2, 0], { transparent: true });
    screws(g, M.tornillo, M.tornilloNegro, 0.3, 'x', [[XR + 0.02, 45.5, -24], [XR + 0.02, 45.5, 22]]);
  }
  {
    const g = makePart(root, 'panel_trasero', L1([0, 0, -26], { info: 'carcasa', shell: true, label: 'equipo' }));
    const cy = (4.6 + 48.1) / 2, zc = ZB + 0.4;
    const pasos = Object.values(LAB.bulk).map(([x, y]) => [x, y - cy, 0.45]);
    g.add(placaPasos(XR - XL - 0.8, 48.1 - 4.6, 0.8, pasos, BLG, [0, cy, zc], 'xy', 0.3));
    // pasamuros de gases: cuerpo y tuercas a ambos lados de la chapa
    for (const [nom, [x, y]] of Object.entries(LAB.bulk)) {
      g.add(mesh(cylZ(0.4, 2.0, 16), M.aceroPulido, [x, y, zc]));
      for (const z of [ZB - 0.2, ZB + 1.0]) g.add(mesh(cylZ(0.62, 0.35, 6), M.acero, [x, y, z]));
      const et = { Helio: 'He', Aire: 'AIRE', 'Nitrógeno': 'N₂', 'Hidrógeno': 'H₂' }[nom];
      decal(g, etiquetaTex(et), 2.4, 0.6, [x, y - 1.5, ZB - 0.03], [0, Math.PI, 0]);
    }
    g.add(mesh(new THREE.PlaneGeometry(24, 12), rejilla(), [10, 24, ZB - 0.03], [0, Math.PI, 0]));
    g.add(mesh(rbox(4.4, 3.2, 1.0, 0.3), M.plasticoNegro, [22, 12, ZB - 0.5]));                // toma de red
    g.add(mesh(rbox(1.8, 1.4, 0.6, 0.15), M.plasticoNegro, [14, 12, ZB - 0.3]));               // LAN
    g.add(mesh(rbox(3.2, 1.6, 0.8, 0.2), M.plasticoNegro, [-26, 36, ZB - 0.4]));               // conector del inyector automático
    const plate = new THREE.MeshStandardMaterial({ map: plateTexture(['7890B GC System', '220–240 V~  50/60 Hz', 'Modelo didáctico', 'Explorador 3D']), metalness: 0.6, roughness: 0.4 });
    g.add(mesh(new THREE.PlaneGeometry(7.6, 3.8), plate, [-10, 14, ZB - 0.03], [0, Math.PI, 0]));
  }

  /* ================= ELECTRÓNICA ================= */
  {
    const g = makePart(root, 'electronica', L1([16, 0, -4], { label: 'equipo' }));
    g.add(mesh(box(0.25, 34, 40), M.pcb, [22.5, 26, 0]));
    pcbChipsX(g, 22.625, 26, 0, 34, 40, 46, 1);
    for (const y of [12, 22, 32]) g.add(mesh(rbox(1.2, 0.8, 3.6, 0.1), M.plasticoNegro, [21.8, y, -17]));
    // cable del encendedor del FID
    cableFlex(g, [[10.7, FY.ign, DET.z, 'fid_ignitor'], [11.6, FY.ign + 0.1, DET.z], [14, 45.3, 11.6], [18, 45.2, 9], [21.4, 43.8, 7], [22.3, 42.4, 6]], 0.14, M.cable, { seg: 50, radial: 8 });
    // alimentación desde la fuente (por detrás del horno)
    cableFlex(g, [[22.3, 28, -17], [21, 28, -17.6], [10, 28.4, -18.2, 'chasis'], [-12, 28.4, -18.2, 'chasis'], [-21.5, 24, -18, 'fuente_alimentacion'], [-22, 20.6, -17, 'fuente_alimentacion'], [-22, 19.8, -17, 'fuente_alimentacion']], 0.3, M.cable, { seg: 70, radial: 8 });
  }
  {
    const g = makePart(root, 'fuente_alimentacion', L1([-14, 0, 4], { label: 'equipo' }));
    g.add(mesh(rbox(9, 15, 30, 0.4), M.anodizado, [-23.9, 12.6, -8]));
    const gm = M.carcasa.clone(); gm.map = grille;
    g.add(mesh(new THREE.PlaneGeometry(7.4, 12), gm, [-23.9, 12.6, 7.02]));
    screws(g, M.tornillo, M.tornilloNegro, 0.25, 'z', [[-27.6, 19, 7.0], [-20.2, 19, 7.0], [-27.6, 6.2, 7.0], [-20.2, 6.2, 7.0]]);
  }

  /* ================= TORRE DEL INYECTOR AUTOMÁTICO 7693A ================= */
  {
    const g = makePart(root, 'als_torre', L1([0, 44, 0], { shell: true, label: 'equipo' }));
    const C = ALS.caja;
    g.add(mesh(rbox(8, 10.2, 6.2, 0.4), BL, [INY.x, 52.7, 1.5]));                                     // pie de la torre
    g.add(mesh(rbox(C.x1 - C.x0, C.y1 - C.y0, C.z1 - C.z0, 0.9), BL, [(C.x0 + C.x1) / 2, (C.y0 + C.y1) / 2, (C.z0 + C.z1) / 2]));
    // puerta negra tintada que envuelve la esquina delantera derecha
    g.add(mesh(rbox(6.6, 33.6, 0.8, 0.3), NEG, [-12.1, 75.4, C.z1 + 0.4]));
    g.add(mesh(rbox(0.8, 33.6, 13.6, 0.3), NEG, [C.x1 + 0.4, 75.4, 13.0]));
    [M.ledVerde, M.ledAmbar, M.ledVerde].forEach((m, i) => g.add(mesh(cylZ(0.2, 0.2, 12), m, [-19.6, 71.6 - i * 0.9, C.z1 + 0.08])));
    decal(g, canvasTex(256, 256, (c) => chispa(c, 128, 128, 90, '#2f8fd8')), 1.6, 1.6, [-19.2, 89.6, C.z1 + 0.03]);
    decal(g, etiquetaTex('7693A', { bg: 'rgba(0,0,0,0)', fg: '#6b737c', font: '600 36px "Segoe UI", Arial' }), 3.0, 0.75, [-17.6, 60.4, C.z1 + 0.03]);
    // cable de control: por el lateral izquierdo, por fuera del GC, hasta la trasera
    cableFlex(g, [[-20, 60, C.z0 + 0.6], [-20.6, 59.4, C.z0 - 0.8], [-27, 56.5, -4.5], [-31, 50.5, -7.5, 'panel_izq'], [-31.4, 40, -15, 'panel_izq'], [-31, 36.2, -27.6, 'panel_izq'],
      [-28.4, 36, -28.0, 'panel_trasero'], [-26.6, 36, -27.9, 'panel_trasero'], [-26, 36, -27.5, 'panel_trasero']], 0.35, M.cableGris, { seg: 90, radial: 10 });
  }

  /* ================= INSTALACIÓN DE GASES DEL LABORATORIO (contexto) ================= */
  {
    const g = makePart(root, 'panel_gases', L1([0, 0, 0], { label: 'equipo' }));
    g.add(mesh(rbox(54, 66, 0.8, 0.3), PARED, [60, 104, LAB.paredZ - 0.4]));
    g.add(mesh(rbox(50, 2.0, 1.6, 0.3), M.plasticoNegro, [60, 133, LAB.paredZ + 0.8]));             // regleta de sujeción de las bajantes
    const dial = new THREE.MeshStandardMaterial({ map: manometroTex(), roughness: 0.3 });
    const TEAL = M.peekBeige.clone(); TEAL.color.setHex(0x1f8a86);
    LAB.regX.forEach((x, i) => {
      const z = LAB.paredZ;
      g.add(mesh(rbox(10, 14, 0.4, 0.15), M.aceroPulido, [x, 99, z + 0.2]));
      g.add(mesh(cylZ(1.6, 2.6, 28), M.aceroPulido, [x, LAB.regY + 1.5, z + 1.7]));               // cuerpo del regulador
      g.add(mesh(cylZ(1.1, 2.2, 24), TEAL, [x, LAB.regY + 1.5, z + 4.1]));                        // pomo
      g.add(mesh(cylZ(2.0, 1.2, 32), M.aceroPulido, [x, LAB.regY + 6.2, z + 1.4]));                // manómetro
      g.add(mesh(new THREE.CircleGeometry(1.8, 32), dial, [x, LAB.regY + 6.2, z + 2.03]));
      g.add(mesh(cylY(0.45, 2.0, 16), M.aceroPulido, [x, LAB.regY - 1.2, z + 1.7]));               // salida
      g.add(mesh(cylX(0.45, 1.6, 16), M.aceroPulido, [x - 2.3, LAB.regY + 1.5, z + 1.7]));          // entrada
      decal(g, etiquetaTex(LAB.gases[i], { bg: '#d9dde1', fg: '#1d2329' }), 6, 1.5, [x, 93.5, z + 0.42]);
      // bajante de acero inoxidable desde la regleta
      cableFlex(g, [[x - 3, 133.2, z + 1.7], [x - 3, 128, z + 1.7], [x - 3, 104, z + 1.7], [x - 3.1, 102.4, z + 1.7], [x - 3.05, LAB.regY + 1.5, z + 1.7]], 0.3, M.aceroPulido, { seg: 40, radial: 8 });
    });
  }
  {
    const g = makePart(root, 'filtros_gas', L1([0, 0, 0], { label: 'equipo' }));
    g.add(mesh(rbox(36, 1.6, 9, 0.3), M.anodizado, [55, 0.9, LAB.filZ]));
    const rellenos = [0x2a2c30, 0x34373b, 0xd8d6cf, 0x26282b], bandas = ['#3aa757', '#e0b020', '#3aa757', '#2f8fd8'];
    LAB.filX.forEach((x, i) => {
      g.add(mesh(cylY(2.0, 2.8, 24), M.plasticoNegro, [x, 3.1, LAB.filZ]));
      const rel = M.plasticoNegro.clone(); rel.color.setHex(rellenos[i]); rel.roughness = 0.9;
      g.add(mesh(cylY(1.32, 22.2, 24), rel, [x, 15.7, LAB.filZ]));
      g.add(mesh(cylY(1.5, 22.6, 32), M.vidrio, [x, 15.8, LAB.filZ]));
      g.add(mesh(cylY(1.6, 3.2, 32), M.ptfe, [x, 28.7, LAB.filZ]));
      decal(g, filtroTex(bandas[i]), 2.1, 1.65, [x, 28.7, LAB.filZ + 1.64]);
      g.add(mesh(cylZ(0.4, 1.2, 12), M.aceroPulido, [x, 0.9, LAB.filZ - 5.1]));                  // entrada (detrás)
      g.add(mesh(cylZ(0.4, 1.2, 12), M.aceroPulido, [x, 0.9, LAB.filZ + 5.1]));                  // salida (delante)
    });
  }
  {
    // líneas de cobre: regulador → filtro → pasamuros de la trasera del GC → módulo EPC
    const g = makePart(root, 'lineas_gas', L1([0, 0, 0], { label: 'equipo' }));
    const runZ = { Helio: -29.2, Aire: -28.7, 'Nitrógeno': -28.2, 'Hidrógeno': -27.7 };
    LAB.gases.forEach((gas, i) => {
      const x = LAB.regX[i], fx = LAB.filX[i], z = LAB.paredZ + 1.7;
      // bajada desde el regulador con una vuelta de holgura
      const lazo = [];
      for (let k = 0; k <= 10; k++) { const a = -Math.PI / 2 + (k / 10) * Math.PI * 2; lazo.push([x + 2.6 + Math.cos(a) * 2.6, 86 + Math.sin(a) * 2.6, z + 0.15 + (k / 10) * 0.8]); }
      cableFlex(g, [[x, LAB.regY - 1.6, z], [x, LAB.regY - 3.5, z], [x + 0.2, 86.6 - 2.6, z + 0.1], ...lazo.slice(1, -1), [x + 0.4, 81, z + 1], [x + 0.6, 40, z + 1],
        [fx, 6, LAB.filZ - 7.6], [fx, 1.6, LAB.filZ - 6.4], [fx, 0.9, LAB.filZ - 5.0]], 0.2, COBRE, { seg: 140, radial: 8 });
      // del filtro al pasamuros (por la mesa, detrás del GC)
      const [bx, by] = LAB.bulk[gas], rz = runZ[gas];
      cableFlex(g, [[fx, 0.9, LAB.filZ + 5.2], [fx, 0.5, LAB.filZ + 5.9], [fx - 0.6, 0.25, rz - 0.1], [fx - 3, 0.25, rz], [bx + 3, 0.25, rz], [bx + 0.5, 0.4, rz],
        [bx, 3, rz, 'panel_trasero'], [bx, by - 2, rz, 'panel_trasero'], [bx, by - 0.4, rz + 0.3, 'panel_trasero'], [bx, by, ZB - 0.9, 'panel_trasero'], [bx, by, ZB - 0.2, 'panel_trasero']],
        0.18, COBRE, { seg: 160, radial: 8 });
      // tramo interior: pasamuros → módulo EPC
      const epc = gas === 'Helio' ? 'epc_inyector' : 'epc_detector';
      cableFlex(g, [[bx, by, ZB + 1.1, 'panel_trasero'], [bx, by, ZB + 1.8, 'panel_trasero'], [bx, by, -24.9, epc], [bx, by, -23.6, epc]], 0.16, M.aceroPulido, { seg: 20, radial: 8 });
    });
  }

  /* ================= INTERIOR (modo 2) ================= */
  Object.assign(refs, buildAnalizador(root));
  refs.root = root;
  refs.update = () => {};
  return refs;
}
