// Equipo completo Shimadzu IRSpirit (390 × 250 × 210 mm, 8,5 kg) con el accesorio QATR-S montado, según las fotografías del equipo
// del laboratorio y las del fabricante: cuerpo blanco sobre un zócalo negro, cubierta superior negra de canto redondeado con la esquina
// delantera izquierda curva, pulsador START arriba a la izquierda, indicador de humedad (ranura) en el frontal izquierdo y en el lateral
// derecho, panel frontal del compartimento con franja inferior, bloque derecho elevado con el logotipo y el rótulo «IRSpirit», ventana de
// mantenimiento trasera (cartucho de gel de sílice) y toma de red. Con el QATR-S instalado, su placa negra ocupa la abertura del
// compartimento a ras de la cubierta, por lo que la tapa del compartimento queda apoyada en la mesa, a la izquierda.
// Dentro: compartimento de muestras con ventanas de KBr, placa electrónica principal bajo el compartimento, fuente de alimentación y
// cableado (cableFlex) que sigue a las piezas al explosionar. La disposición interna es aproximada.
import * as THREE from 'three';
import { M } from '../../materials.js';
import { mesh, rbox, box, cylY, placaPasos, pasamuros, grilleTexture, plateTexture, screws, tubePath } from '../../geom.js';
import { makePart, cableFlex } from '../../parts.js';
import { buildAnalizador } from './analizador.js';
import { CAJA, COMP, Y0, ZH, S } from './geometria.js';

const L1 = (offset, extra = {}) => ({ level: 1, offset, mode: 'equipo', ...extra });
const { X0, X1, ZB, ZF, YZ, YC, YT, YR, XL, XR, RC, E } = CAJA;
const CX = -16.5, CZ = ZF - RC;                 // eje de la esquina delantera izquierda (planta)

/* ---------- texturas propias (fondo transparente) ---------- */
function lienzo(w, h, dibujo) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; dibujo(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
function decal(tex, w, h, pos, rot = [0, 0, 0], extra = {}) {
  const m = new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: 0.45, metalness: 0, ...extra });
  const d = mesh(new THREE.PlaneGeometry(w, h), m, pos, rot); d.castShadow = false; return d;
}
/** Logotipo SHIMADZU (emblema de círculo con cruz y letras espaciadas). */
const logoTex = (col) => lienzo(1024, 128, (g) => {
  g.strokeStyle = col; g.fillStyle = col; g.lineWidth = 8;
  g.strokeRect(14, 22, 84, 84);
  g.beginPath(); g.arc(56, 64, 30, 0, Math.PI * 2); g.stroke();
  g.fillRect(50, 34, 12, 60); g.fillRect(26, 58, 60, 12);
  g.font = '700 76px Arial, Segoe UI'; g.textBaseline = 'middle';
  let x = 130; for (const ch of 'SHIMADZU') { g.fillText(ch, x, 68); x += g.measureText(ch).width + 13; }
});
const modeloTex = () => lienzo(1024, 160, (g) => {
  g.fillStyle = '#2b3036'; g.textBaseline = 'alphabetic';
  g.font = '700 92px Segoe UI, Arial'; g.fillText('IRSpirit', 6, 96);
  g.font = '500 25px Segoe UI, Arial'; g.fillStyle = '#4a5058'; g.fillText('FOURIER TRANSFORM INFRARED SPECTROPHOTOMETER', 8, 142);
});
const serieTex = () => lienzo(512, 128, (g) => {
  const gr = g.createLinearGradient(0, 0, 512, 128); gr.addColorStop(0, '#d9dcdf'); gr.addColorStop(1, '#b9bdc2');
  g.fillStyle = gr; g.fillRect(0, 0, 512, 128);
  g.fillStyle = '#23282e'; g.font = '600 30px Arial'; g.textBaseline = 'middle';
  g.fillText('SERIAL NO.', 20, 36); g.fillText('SHIMADZU CORP.', 230, 36);
  g.font = '500 40px Consolas, monospace'; g.fillText('A2241 · · · · ·', 20, 92);
});
const avisoTex = () => lienzo(1024, 160, (g) => {
  g.strokeStyle = '#d8dbe0'; g.lineWidth = 3; g.strokeRect(4, 4, 1016, 152);
  g.fillStyle = '#e4e7eb'; g.font = '500 25px Arial'; g.textBaseline = 'middle';
  g.fillText('"HUMIDITY" lamp turns on when the AC power cable is connected', 18, 34);
  g.fillText('and the humidity in the interferometer is low.', 18, 66);
  g.font = '500 22px Arial'; g.fillStyle = '#b9bec5';
  g.fillText('AC電源接続時に干渉計内部の湿度が低いと「HUMIDITY」ランプが点灯します。', 18, 112);
});
const rotuloTex = (t, { bg = 'rgba(0,0,0,0)', fg = '#3a4048', font = '600 34px Segoe UI' } = {}) => lienzo(512, 96, (g, w, h) => {
  g.fillStyle = bg; g.fillRect(0, 0, w, h); g.fillStyle = fg; g.font = font; g.textBaseline = 'middle'; g.textAlign = 'center'; g.fillText(t, w / 2, h / 2 + 2);
});

/** Planta horizontal biselada: el contorno (x, z) se extruye en vertical entre y0 e y0 + h; b = radio del canto. */
function plantaBisel(dibujar, y0, h, b, mat) {
  const s = new THREE.Shape(); dibujar(s);
  const g = new THREE.ExtrudeGeometry(s, { depth: h - 2 * b, bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: 4, curveSegments: 18 });
  return mesh(g, mat, [0, y0 + b, 0], [-Math.PI / 2, 0, 0]);
}

export function buildEquipo(root) {
  const refs = {};
  const blanco = M.carcasa.clone(); blanco.color.setHex(0xf1f2f3);
  const negroTop = M.negroBrillante.clone(); negroTop.color.setHex(0x1d2023); negroTop.roughness = 0.5; negroTop.clearcoat = 0.35; negroTop.clearcoatRoughness = 0.4;
  const zocalo = M.plasticoNegro.clone(); zocalo.color.setHex(0x1b1d21);
  const franja = M.carcasa.clone(); franja.color.setHex(0xd5d9dd);
  const interior = M.carcasaOsc.clone(); interior.color.setHex(0x2d3137);
  const naranja = new THREE.MeshStandardMaterial({ color: 0xffa23a, emissive: 0xff8a1a, emissiveIntensity: 1.3, roughness: 0.3 });
  const grille = grilleTexture(30, 3);

  /* ---------------- ZÓCALO Y CHASIS ---------------- */
  {
    const g = makePart(root, 'chasis', L1([0, 0, 0]));
    const b = 0.25, xa = X0 + 0.25 + b, xb = X1 - 0.25 - b, za = ZB + 0.25 + b, zf = ZF - 0.25 - b, r = 0.55;
    g.add(plantaBisel((s) => {
      s.moveTo(CX, -zf); s.lineTo(xb - r, -zf); s.absarc(xb - r, -zf + r, r, -Math.PI / 2, 0, false);
      s.lineTo(xb, -za - r); s.absarc(xb - r, -za - r, r, 0, Math.PI / 2, false);
      s.lineTo(xa + r, -za); s.absarc(xa + r, -za - r, r, Math.PI / 2, Math.PI, false);
      s.lineTo(xa, -CZ); s.absarc(CX, -CZ, CX - xa, Math.PI, Math.PI * 1.5, false);
    }, CAJA.YP, YZ - CAJA.YP, b, zocalo));
    for (const [x, z] of [[-16, -10], [16, -10], [-15.5, 9.5], [16, 10]]) g.add(mesh(cylY(1.0, CAJA.YP, 24), M.goma, [x, CAJA.YP / 2, z]));
    // bandeja interior de aluminio sobre el zócalo
    g.add(mesh(box(X1 - X0 - 0.8, 0.2, 24.0), M.aluminio, [0, YZ + 0.1, -0.1]));
    // rótulo del indicador de humedad, en blanco sobre el zócalo
    g.add(decal(avisoTex(), 6.4, 1.0, [-13.6, 1.95, ZF - 0.245]));
  }

  /* ---------------- CARCASA ---------------- */
  {
    // cubierta superior negra: canto redondeado, esquina delantera izquierda curva y abertura del compartimento
    const g = makePart(root, 'cubierta_superior', L1([0, 16, 0], { shell: true, label: 'equipo' }));
    const b = 0.45, xa = X0 + b, xr = XR - b, za = ZB + b + 0.08, zf = ZF - b, nx0 = XL - b, nz = -5.0 - b, r = 0.6;
    g.add(plantaBisel((s) => {
      s.moveTo(nx0, -zf); s.lineTo(CX, -zf);
      s.absarc(CX, -CZ, RC - b, -Math.PI / 2, -Math.PI, true);
      s.lineTo(xa, -za - r); s.absarc(xa + r, -za - r, r, Math.PI, Math.PI / 2, true);
      s.lineTo(xr, -za); s.lineTo(xr, -nz); s.lineTo(nx0, -nz); s.lineTo(nx0, -zf);
    }, YC, YT - YC, b, negroTop));
    // pulsador START (encendido) arriba a la izquierda
    const p = makePart(g, 'pulsador_start', L1([0, 0, 0], { label: 'equipo' }));
    p.add(mesh(cylY(0.95, 0.12, 40), M.aceroPulido, [-16.2, YT + 0.06, -8.6]));
    p.add(mesh(cylY(0.7, 0.22, 40), M.plasticoNegro, [-16.2, YT + 0.23, -8.6]));
    p.add(mesh(cylY(0.25, 0.03, 24), naranja.clone(), [-16.2, YT + 0.355, -8.6]));
  }
  {
    // envolvente izquierda: frontal izquierdo, esquina curva y lateral izquierdo
    const g = makePart(root, 'carcasa_izq', L1([-16, 0, 0], { info: 'carcasa', shell: true, label: 'equipo' }));
    const h = YC - YZ, cy = (YZ + YC) / 2;
    const prof = [[RC - E, YZ], [RC, YZ], [RC, YC], [RC - E, YC], [RC - E, YZ]].map(([r, y]) => new THREE.Vector2(r, y));
    const esq = blanco.clone(); esq.side = THREE.DoubleSide;
    g.add(mesh(new THREE.LatheGeometry(prof, 28, -Math.PI / 2, Math.PI / 2), esq, [CX, 0, CZ]));
    g.add(mesh(box(XL - 0.05 - CX, h, E), blanco, [(CX + XL - 0.05) / 2, cy, ZF - E / 2]));
    g.add(mesh(box(E, h, CZ - (ZB + E)), blanco, [X0 + E / 2, cy, (CZ + ZB + E) / 2]));
    g.add(decal(serieTex(), 3.6, 0.9, [-14.3, 4.45, ZF + 0.005]));
    const l = makePart(g, 'lampara_izq', L1([0, 0, 0], { info: 'indicador_humedad' }));
    l.add(mesh(rbox(1.7, 0.42, 0.2, 0.08), M.plasticoNegro, [-15.1, 16.95, ZF - 0.02]));
    l.add(decal(lienzo(64, 16, (c) => { c.fillStyle = '#ffb04a'; c.fillRect(0, 0, 64, 16); }), 1.5, 0.24, [-15.1, 16.95, ZF + 0.085], [0, 0, 0],
      { emissive: new THREE.Color(0xff8a1a), emissiveIntensity: 1.2 }));
  }
  {
    // panel frontal del compartimento (algo retranqueado) y franja inferior
    const g = makePart(root, 'panel_compartimento', L1([0, 0, 16], { shell: true, label: 'equipo' }));
    const x0 = XL + 0.05, x1 = XR - 0.05, cx = (x0 + x1) / 2, z = ZF - 0.1 - E / 2;
    g.add(mesh(rbox(x1 - x0, COMP.yPlaca - 4.5, E, 0.1), blanco, [cx, (COMP.yPlaca + 4.5) / 2, z]));
    g.add(mesh(rbox(x1 - x0, 4.4 - YZ, E, 0.1), franja, [cx, (YZ + 4.4) / 2, z]));
  }
  {
    // bloque derecho elevado: frontal con logotipo y rótulo, lateral con indicador de humedad y rejilla, techo blanco
    const g = makePart(root, 'bloque_derecho', L1([16, 0, 0], { shell: true, label: 'equipo' }));
    const h = YT - YZ, cy = (YZ + YT) / 2;
    g.add(mesh(rbox(X1 - E - XR - 0.05, h, E, 0.12), blanco, [(XR + 0.05 + X1 - E) / 2, cy, ZF - E / 2]));
    g.add(mesh(rbox(E, h, ZF - (ZB + E), 0.12), blanco, [X1 - E / 2, cy, (ZF + ZB + E) / 2]));
    g.add(mesh(rbox(X1 - XR, YR - YT, ZF - ZB, 0.45), blanco, [(XR + X1) / 2, (YT + YR) / 2, 0]));
    g.add(mesh(box(E, YT - YC, ZF - ZB - 0.35 - E), negroTop, [XR + 0.05 + E / 2, (YC + YT) / 2, (ZF - 0.35 + ZB + E) / 2]));
    g.add(decal(logoTex('#3b4047'), 6.2, 0.78, [14.35, 13.2, ZF + 0.005]));
    g.add(decal(modeloTex(), 7.4, 1.16, [14.7, 5.5, ZF + 0.005]));
    const gm = new THREE.MeshStandardMaterial({ map: grille, color: 0xbfc3c8, roughness: 0.6 });
    g.add(mesh(new THREE.PlaneGeometry(5.6, 3.6), gm, [X1 + 0.005, 6.6, -8.0], [0, Math.PI / 2, 0]));
    const l = makePart(g, 'lampara_der', L1([0, 0, 0], { info: 'indicador_humedad' }));
    l.add(mesh(rbox(0.2, 0.42, 1.7, 0.08), M.plasticoNegro, [X1 + 0.02, 18.75, -10.3]));
    l.add(decal(lienzo(64, 16, (c) => { c.fillStyle = '#ffb04a'; c.fillRect(0, 0, 64, 16); }), 1.5, 0.24, [X1 + 0.125, 18.75, -10.3], [0, Math.PI / 2, 0],
      { emissive: new THREE.Color(0xff8a1a), emissiveIntensity: 1.2 }));
  }
  {
    // panel trasero: abertura de la ventana de mantenimiento (abajo a la derecha), toma de red, rejilla de ventilación y placa
    const g = makePart(root, 'panel_trasero', L1([0, 0, -16], { info: 'carcasa', shell: true }));
    const s = new THREE.Shape();
    s.moveTo(X0, YZ); s.lineTo(X1, YZ); s.lineTo(X1, YT); s.lineTo(XR, YT); s.lineTo(XR, YC); s.lineTo(X0, YC); s.lineTo(X0, YZ);
    const rect = (x0, x1, y0, y1) => { const p = new THREE.Path(); p.moveTo(x0, y0); p.lineTo(x0, y1); p.lineTo(x1, y1); p.lineTo(x1, y0); p.lineTo(x0, y0); return p; };
    s.holes.push(rect(13.0, 18.4, 6.5, 14.8), rect(-16.3, -13.7, 5.0, 7.0));
    g.add(mesh(new THREE.ExtrudeGeometry(s, { depth: E, bevelEnabled: false }), blanco, [0, 0, ZB]));
    // toma de red (IEC) que atraviesa el panel y cable de alimentación hasta la mesa
    g.add(mesh(rbox(2.6, 2.0, 0.8, 0.15), M.plasticoNegro, [-15, 6.0, ZB + 0.15]));
    g.add(decal(rotuloTex('AC IN', { fg: '#c9ced4' }), 1.6, 0.3, [-15, 7.35, ZB - 0.01], [0, Math.PI, 0]));
    g.add(mesh(tubePath([[-15, 6.0, ZB - 0.15], [-15, 6.0, ZB - 2.2], [-14.6, 4.2, ZB - 5], [-13.5, 0.6, ZB - 9], [-8, 0.6, ZB - 16]], 0.35, 60, 10), M.cable));
    const gm = new THREE.MeshStandardMaterial({ map: grille, color: 0xbfc3c8, roughness: 0.6 });
    g.add(mesh(new THREE.PlaneGeometry(16, 1.2), gm, [-1.5, 16.6, ZB - 0.005], [0, Math.PI, 0]));
    const plate = new THREE.MeshStandardMaterial({ map: plateTexture(['IRSpirit', 'FTIR · Shimadzu Corp.', 'Modelo didáctico', 'Visor técnico 3D']), metalness: 0.5, roughness: 0.4 });
    g.add(mesh(new THREE.PlaneGeometry(5.4, 2.7), plate, [-4.5, 10.5, ZB - 0.005], [0, Math.PI, 0]));
    screws(g, M.tornillo, M.tornilloNegro, 0.22, '-z', [[X0 + 1.2, YC - 1.2, ZB], [XR - 1.5, YC - 1.2, ZB], [X0 + 1.2, YZ + 1.2, ZB], [X1 - 1.2, YZ + 1.2, ZB]]);
  }
  {
    // ventana de mantenimiento: se empuja hacia arriba y se extrae para cambiar el gel de sílice del interferómetro
    const g = makePart(root, 'ventana_mantenimiento', L1([0, 0, -20], { shell: true, label: 'equipo' }));
    const cx = 15.7, cy = 10.65, z = ZB - 0.125;
    g.add(mesh(rbox(5.8, 8.7, 0.25, 0.1), blanco, [cx, cy, z]));
    for (let i = 0; i < 7; i++) g.add(mesh(new THREE.PlaneGeometry(4.3, 0.34), M.plasticoNegro, [cx, cy - 3.0 + i * 0.95, ZB - 0.255], [0, Math.PI, 0]));
    screws(g, M.tornillo, M.tornilloNegro, 0.2, '-z', [[cx - 1.8, cy - 3.95, ZB - 0.25], [cx + 1.8, cy - 3.95, ZB - 0.25]]);
  }
  {
    // tapa del compartimento: se retira al montar el QATR-S (su placa queda a la misma altura que la cubierta)
    const g = makePart(root, 'tapa_compartimento', L1([0, 0, 0], { label: 'equipo' }));
    const w = ZF - (-5.0), d = XR - XL, cx = -33.5, cz = 1.0;
    g.add(mesh(rbox(w, 0.9, d, 0.3), negroTop, [cx, 0.45, cz]));
    g.add(mesh(rbox(w - 1.6, 0.06, d - 1.6, 0.03), zocalo, [cx, 0.97, cz]));
  }

  /* ---------------- COMPARTIMENTO DE MUESTRAS ---------------- */
  {
    const g = makePart(root, 'compartimento', L1([0, 0, 0], { shell: true, label: 'equipo' }));
    const y0 = YZ + 0.2, y1 = COMP.yPlaca, cy = (y0 + y1) / 2, zb = COMP.paredT[0], zf = COMP.z1, cz = (zb + zf) / 2;
    const hI = [[ZH - cz, Y0 - cy, 1.35], [-1.0 - cz, 4.3 - cy, 0.4]], hD = [[ZH - cz, Y0 - cy, 1.35], [0.5 - cz, 4.3 - cy, 0.4]];
    g.add(placaPasos(zf - zb, y1 - y0, 0.4, hI, interior, [(COMP.paredI[0] + COMP.paredI[1]) / 2, cy, cz], 'zy', 0.1));
    g.add(placaPasos(zf - zb, y1 - y0, 0.4, hD, interior, [(COMP.paredD[0] + COMP.paredD[1]) / 2, cy, cz], 'zy', 0.1));
    const cx = (COMP.x0 + COMP.x1) / 2;
    g.add(placaPasos(COMP.x1 - COMP.x0, y1 - y0, 0.4, [[7.5 - cx, 4.3 - cy, 0.4], [-10.3 - cx, 4.3 - cy, 0.4]], interior, [cx, cy, (COMP.paredT[0] + COMP.paredT[1]) / 2], 'xy', 0.1));
    g.add(mesh(box(COMP.x1 - COMP.x0, COMP.suelo[1] - COMP.suelo[0], zf - COMP.z0), interior, [cx, (COMP.suelo[0] + COMP.suelo[1]) / 2, (zf + COMP.z0) / 2]));
    for (const [x, z] of [[COMP.paredI[0] - 0.02, -1.0], [COMP.paredI[1] + 0.02, -1.0]]) g.add(pasamuros(0.4, M.goma, [x, 4.3, z], 'x', 0.18));
    for (const [x, z] of [[COMP.paredD[0] - 0.02, 0.5], [COMP.paredD[1] + 0.02, 0.5]]) g.add(pasamuros(0.4, M.goma, [x, 4.3, z], 'x', 0.18));
    for (const x of [7.5, -10.3]) for (const z of [COMP.paredT[0] - 0.02, COMP.paredT[1] + 0.02]) g.add(pasamuros(0.4, M.goma, [x, 4.3, z], 'z', 0.18));
  }

  /* ---------------- ELECTRÓNICA ---------------- */
  const CON = { psu: [-10.0, -3.6], fuente: [7.5, -3.6], det: [-10.2, -1.0], interf: [8.2, 0.5] };
  {
    const g = makePart(root, 'electronica', L1([0, 0, 0], { label: 'equipo' }));
    // placa principal bajo el suelo del compartimento: control del espejo móvil y de la alineación, conversión A/D, USB
    const x0 = -11.1, x1 = 8.9, z0 = -4.3, z1 = 11.5, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
    g.add(mesh(rbox(x1 - x0, 0.15, z1 - z0, 0.05), M.pcb, [cx, 3.625, cz]));
    for (const x of [x0 + 0.6, x1 - 0.6]) for (const z of [z0 + 0.6, z1 - 0.6]) g.add(mesh(cylY(0.16, 0.15, 12), M.aceroPulido, [x, 3.475, z]));
    for (const [x, z, w, d] of [[-4, 3, 2.2, 2.2], [1.5, 6, 1.6, 1.0], [-7, 8, 1.4, 1.4], [4.5, 2.5, 2.4, 1.2], [-1.5, 9.5, 1.0, 1.8]]) g.add(mesh(box(w, 0.2, d), M.chip, [x, 3.8, z]));
    for (let i = 0; i < 4; i++) g.add(mesh(cylY(0.3, 0.7, 16), M.condensador, [5.5 + i * 0.75, 4.05, 8.5]));
    for (const [x, z] of Object.values(CON)) g.add(mesh(rbox(1.0, 0.5, 0.8, 0.08), M.plasticoNegro, [x, 3.95, z]));
  }
  {
    const g = makePart(root, 'fuente_alimentacion', L1([0, 0, 0], { label: 'equipo' }));
    const x0 = -18.8, x1 = -9.6, y0 = YZ + 0.2, y1 = 10.4, z0 = -11.9, z1 = -6.2;
    g.add(mesh(rbox(x1 - x0, y1 - y0, z1 - z0, 0.2), M.anodizado, [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2]));
    const gm = new THREE.MeshStandardMaterial({ map: grille, color: 0x8d949c, roughness: 0.6 });
    g.add(mesh(new THREE.PlaneGeometry(7, 2.2), gm, [(x0 + x1) / 2, y1 + 0.005, (z0 + z1) / 2], [-Math.PI / 2, 0, 0]));
    g.add(decal(rotuloTex('POWER SUPPLY', { fg: '#e8ebef', font: '600 30px Segoe UI' }), 3.4, 0.64, [(x0 + x1) / 2 - 1.5, 8.6, z1 + 0.005]));
    g.add(mesh(rbox(1.0, 0.6, 0.4, 0.06), M.plasticoNegro, [-10.3, 4.6, z1 + 0.2]));
  }
  refs.analyzer = buildAnalizador(root);
  {
    // cableado interior: fuente de alimentación, fuente IR, detector e interferómetro hasta la placa principal
    const g = makePart(root, 'cableado', L1([0, 0, 0], { info: 'electronica' }));
    const c = (k, y = 4.15) => [CON[k][0], y, CON[k][1], 'electronica'];
    cableFlex(g, [[-10.3, 4.6, -5.85, 'fuente_alimentacion'], [-10.3, 4.5, -5.4], [-10.3, 4.3, -4.8, 'compartimento'], [-10.2, 4.25, -4.15], c('psu')], 0.17, M.cable, { seg: 30, radial: 8 });
    cableFlex(g, [[S.x + 1.05, 4.6, S.z, 'fuente_ir'], [7.6, 4.45, -6.0], [7.5, 4.3, -5.4], [7.5, 4.3, -4.8, 'compartimento'], [7.5, 4.25, -4.2], c('fuente')], 0.15, M.cable, { seg: 40, radial: 8 });
    const pre = refs.analyzer.conPre, ci = refs.analyzer.conInterf;
    cableFlex(g, [[pre.x, pre.y, pre.z + 0.05, 'preamplificador'], [pre.x, pre.y - 0.3, pre.z - 0.35], [-13.3, 7.0, -3.0], [-12.6, 4.6, -1.4], [-11.8, 4.3, -1.0, 'compartimento'],
      [-10.9, 4.25, -1.0], c('det')], 0.15, M.cableGris, { seg: 60, radial: 8 });
    cableFlex(g, [[ci.x, ci.y + 0.05, ci.z, 'banco_interf'], [ci.x, ci.y - 0.6, ci.z + 0.2], [12.0, 6.5, -1.2], [10.6, 4.6, 0.2], [9.5, 4.3, 0.5, 'compartimento'], [8.8, 4.25, 0.5], c('interf')],
      0.17, M.cable, { seg: 60, radial: 8 });
  }
  refs.update = () => {};
  return refs;
}
