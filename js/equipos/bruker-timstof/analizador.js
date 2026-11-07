// Analizador del timsTOF Pro: CaptiveSpray, capilar de vidrio con deflexión de 90°, embudo de entrada, túnel TIMS doble
// (acumulación + análisis, electrodos de circuito impreso), embudo de salida, guía de transferencia, cuadrupolo, celda de colisión,
// óptica de transferencia, acelerador ortogonal, TOF con reflectrón de dos etapas (trayectoria en V) y detector MCP.
// Coordenadas LOCALES (cm): eje iónico = +X; el TOF sube por +Y.
import * as THREE from 'three';
import { M } from '../../materials.js';
import { mesh, rbox, box, washerX, cylX, cylY, cylZ, tubeX, tubePath, screws } from '../../geom.js';
import { makePart } from '../../parts.js';
import { AX, ORIGEN } from './geometria.js';

const L2 = (offset, label = true, extra = {}) =>
  ({ level: 2, offset, mode: 'analizador', label: label ? 'analizador' : null, ...extra });

/** Placa cuadrada con orificio circular (electrodo de circuito impreso del TIMS), normal a X. */
function pcbPlate(size, hole, t) {
  const s = new THREE.Shape(); const a = size / 2;
  s.moveTo(-a, -a); s.lineTo(a, -a); s.lineTo(a, a); s.lineTo(-a, a); s.lineTo(-a, -a);
  const h = new THREE.Path(); h.absarc(0, 0, hole, 0, Math.PI * 2, true); s.holes.push(h);
  const g = new THREE.ExtrudeGeometry(s, { depth: t, bevelEnabled: false, curveSegments: 24 });
  g.translate(0, 0, -t / 2); g.rotateY(Math.PI / 2);
  return g;
}
/** Embudo de anillos apilados con radio interior variable. */
function funnel(g, x0, x1, n, rA, rB, rOut, mat) {
  for (let i = 0; i < n; i++) {
    const u = i / (n - 1);
    g.add(mesh(washerX(rOut, rA + (rB - rA) * u, 0.08, 40), i % 2 ? M.aceroPulido : mat, [x0 + (x1 - x0) * u, 0, 0]));
  }
  for (let k = 0; k < 3; k++) { const a = (k / 3) * Math.PI * 2 + 0.5;
    g.add(mesh(cylX(0.12, x1 - x0, 10), M.ceramica, [(x0 + x1) / 2, Math.cos(a) * (rOut - 0.2), Math.sin(a) * (rOut - 0.2)])); }
}

export function buildAnalizador(parent) {
  const refs = {};
  const A = makePart(parent, 'analizador', { level: 1, offset: [0, 0, 0], mode: 'analizador', label: 'equipo' });
  A.position.copy(ORIGEN);
  A.rotation.y = Math.PI / 2; // +X local -> -Z mundo (del frente hacia el fondo)

  /* ---------------- FUENTE Y ENTRADA ---------------- */
  {
    const g = makePart(A, 'captivespray', L2([-8, 0, 0]));
    const p = AX.SPRAY;
    g.add(mesh(cylX(0.06, 2.6, 10), M.vidrio, [p.x - 1.0, p.y, 0]));                // emisor de sílice
    g.add(mesh(cylX(0.5, 2.2, 24, 0.3), M.aceroPulido, [p.x - 3.2, p.y, 0]));
    g.add(mesh(rbox(3.6, 3.2, 3.2, 0.5), M.negroBrillante, [p.x - 5.6, p.y, 0]));    // cuerpo del CaptiveSpray
    // racores: tuerca PEEK de la línea de muestra (atrás) y entrada de gas (arriba); los tubos los pone el equipo
    g.add(mesh(cylX(0.35, 0.6, 16), M.peekRojo, [p.x - 7.7, p.y, 0]));
    g.add(mesh(cylY(0.3, 0.6, 16), M.aceroPulido, [p.x - 5.0, p.y + 1.9, -0.8]));
    const sprayMat = M.haz.clone(); sprayMat.color.setHex(0x8fd3ff);
    const spray = mesh(new THREE.ConeGeometry(0.35, 1.6, 20, 1, true), sprayMat, [p.x + 0.6, p.y, 0], [0, 0, -Math.PI / 2]);
    spray.userData.noClone = true; spray.castShadow = false; spray.raycast = () => {};
    g.add(spray); refs.spray = spray;
  }
  {
    const g = makePart(A, 'capilar', L2([-4, 3, 0]));
    const gl = M.vidrio.clone(); gl.opacity = 0.45;
    g.add(mesh(cylX(0.32, AX.CAP1 - AX.CAP0, 32), gl, [(AX.CAP0 + AX.CAP1) / 2, AX.CAP_Y, 0]));
    g.add(mesh(cylX(0.08, AX.CAP1 - AX.CAP0, 12), M.aceroOscuro, [(AX.CAP0 + AX.CAP1) / 2, AX.CAP_Y, 0]));
    for (const x of [AX.CAP0 + 0.3, AX.CAP1 - 0.3]) g.add(mesh(cylX(0.45, 0.6, 24), M.aceroPulido, [x, AX.CAP_Y, 0]));
    g.add(mesh(washerX(1.4, 0.35, 0.25, 40), M.aceroPulido, [AX.CAP0 - 0.3, AX.CAP_Y, 0]));    // capuchón de entrada
  }
  {
    const g = makePart(A, 'deflector', L2([0, 5, 0]));
    g.add(mesh(rbox(0.3, 3.0, 2.6, 0.06), M.aceroPulido, [AX.DEFL.x + 0.8, AX.DEFL.y - 0.2, 0]));
    g.add(mesh(rbox(1.8, 0.2, 2.6, 0.06), M.aceroPulido, [AX.DEFL.x, AX.DEFL.y + 1.1, 0]));
    g.add(mesh(cylY(0.25, 1.5, 12), M.ceramica, [AX.DEFL.x + 0.8, AX.DEFL.y + 2, 0]));
  }
  {
    const g = makePart(A, 'embudo_entrada', L2([2, 0, 0]));
    funnel(g, AX.F1_0, AX.F1_1, 22, 1.4, 0.35, 2.0, M.acero);
  }

  /* ---------------- TIMS ---------------- */
  for (const [id, x0, x1, off] of [['tims_acumulacion', AX.T_0, AX.T_MID, [3, 0, 4]], ['tims_analisis', AX.T_MID, AX.T_1, [5, 0, -4]]]) {
    const g = makePart(A, id, L2(off, id === 'tims_analisis', { info: 'tims' }));
    const n = 24;
    const gold = M.oro;
    for (let i = 0; i < n; i++) {
      const x = x0 + 0.1 + (x1 - x0 - 0.2) * (i / (n - 1));
      g.add(mesh(pcbPlate(3.2, AX.TIMS_R + 0.05, 0.08), M.pcb, [x, 0, 0]));
      g.add(mesh(washerX(AX.TIMS_R + 0.18, AX.TIMS_R + 0.03, 0.26, 24), gold, [x, 0, 0]));   // más grueso que la placa: sin parpadeo
    }
    for (const [y, z] of [[1.35, 1.35], [-1.35, 1.35], [1.35, -1.35], [-1.35, -1.35]]) g.add(mesh(cylX(0.1, x1 - x0, 10), M.aceroPulido, [(x0 + x1) / 2, y, z]));
    g.add(mesh(box(x1 - x0, 0.6, 0.12), M.pcb, [(x0 + x1) / 2, -1.9, 1.5]));            // tarjeta de resistencias del gradiente
  }
  {
    const g = makePart(A, 'carcasa_tims', L2([0, 7, 0], false, { info: 'tims', shell: true }));
    g.add(mesh(rbox(AX.T_1 - AX.T_0 + 1.4, 4.4, 4.4, 0.3), M.aluminio, [(AX.T_0 + AX.T_1) / 2, 0, 0]));
  }
  {
    const g = makePart(A, 'embudo_salida', L2([7, 0, 0]));
    funnel(g, AX.F2_0, AX.F2_1, 16, 0.9, 0.3, 1.8, M.acero);
  }
  {
    const g = makePart(A, 'guia_transferencia', L2([9, 0, 0]));
    for (let i = 0; i < 26; i++) g.add(mesh(washerX(0.9, 0.35, 0.06, 32), i % 2 ? M.acero : M.aceroPulido, [AX.MP_0 + (AX.MP_1 - AX.MP_0) * (i / 25), 0, 0]));
    for (let k = 0; k < 3; k++) { const a = (k / 3) * Math.PI * 2 + 0.2;
      g.add(mesh(cylX(0.08, AX.MP_1 - AX.MP_0, 10), M.ceramica, [(AX.MP_0 + AX.MP_1) / 2, Math.cos(a) * 0.75, Math.sin(a) * 0.75])); }
  }

  /* ---------------- CUADRUPOLO Y CELDA ---------------- */
  {
    const g = makePart(A, 'cuadrupolo', L2([11, 0, 0]));
    for (let k = 0; k < 4; k++) { const a = (k / 4) * Math.PI * 2 + Math.PI / 4;
      g.add(mesh(cylX(0.42, AX.Q_1 - AX.Q_0, 32), M.molibdeno, [(AX.Q_0 + AX.Q_1) / 2, Math.cos(a) * 0.82, Math.sin(a) * 0.82])); }
    for (const x of [AX.Q_0 + 1, AX.Q_1 - 1]) g.add(mesh(tubeX(1.9, 1.35, 0.8, 48), M.ceramica, [x, 0, 0]));
  }
  {
    const g = makePart(A, 'celda_colision', L2([13, 6, 0], true, { shell: true }));
    g.add(mesh(tubeX(1.5, 1.38, AX.C_1 - AX.C_0, 48), M.acero, [(AX.C_0 + AX.C_1) / 2, 0, 0]));
    for (const x of [AX.C_0, AX.C_1]) g.add(mesh(washerX(1.55, 0.3, 0.15, 40), M.aceroPulido, [x, 0, 0]));
    g.add(mesh(cylY(0.18, 2.4, 12), M.acero, [AX.C_0 + 2, 2.6, 0]));
  }
  {
    const g = makePart(A, 'celda_multipolo', L2([13, 0, 0], false, { info: 'celda_colision' }));
    for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2;
      g.add(mesh(cylX(0.14, AX.C_1 - AX.C_0 - 1, 12), M.aceroPulido, [(AX.C_0 + AX.C_1) / 2, Math.cos(a) * 0.6, Math.sin(a) * 0.6])); }
  }
  {
    const g = makePart(A, 'optica_transferencia', L2([15, 0, 0]));
    for (let i = 0; i < 5; i++) g.add(mesh(washerX(1.2, 0.3, 0.12, 32), M.aceroPulido, [AX.TR_0 + i * 1.5, 0, 0]));
  }

  /* ---------------- TOF ORTOGONAL ---------------- */
  {
    const g = makePart(A, 'pusher', L2([18, -6, 0]));
    const p = AX.PUSH;
    for (let i = 0; i < 6; i++) g.add(mesh(rbox(5, 0.12, 3.2, 0.03), i ? M.aceroPulido : M.acero, [p.x + 0.5, p.y - 0.8 + i * 0.6, 0]));
    for (const x of [p.x - 1.8, p.x + 2.8]) g.add(mesh(box(0.25, 3.6, 0.25), M.ceramica, [x, p.y + 0.7, 1.4]));
  }
  {
    const g = makePart(A, 'tubo_tof', L2([0, 0, -14], true, { shell: true }));
    const cx = (AX.TOF_X0 + AX.TOF_X1) / 2, cy = (AX.TOF_Y0 + AX.TOF_Y1) / 2;
    const w = AX.TOF_X1 - AX.TOF_X0, hgt = AX.TOF_Y1 - AX.TOF_Y0;
    g.add(mesh(rbox(w, hgt, 0.4, 0.15), M.acero, [cx, cy, 4]));
    g.add(mesh(rbox(w, hgt, 0.4, 0.15), M.acero, [cx, cy, -4]));
    g.add(mesh(rbox(0.4, hgt, 8.4, 0.15), M.acero, [AX.TOF_X0, cy, 0]));
    g.add(mesh(rbox(0.4, hgt, 8.4, 0.15), M.acero, [AX.TOF_X1, cy, 0]));
    g.add(mesh(rbox(w + 0.4, 0.4, 8.4, 0.15), M.acero, [cx, AX.TOF_Y1, 0]));
    for (const y of [AX.TOF_Y0 + 15, AX.TOF_Y0 + 40]) g.add(mesh(rbox(w + 1.4, 1.0, 9.4, 0.3), M.aceroPulido, [cx, y, 0]));
  }
  {
    const g = makePart(A, 'reflectron', L2([0, 12, 0]));
    const cx = (AX.TOF_X0 + AX.TOF_X1) / 2, w = AX.TOF_X1 - AX.TOF_X0 - 2;
    const n = 18;
    for (let i = 0; i < n; i++) {
      const y = AX.REF0 + (AX.REF1 - AX.REF0) * (i / (n - 1));
      const s = new THREE.Shape(); s.moveTo(-w / 2, -3.2); s.lineTo(w / 2, -3.2); s.lineTo(w / 2, 3.2); s.lineTo(-w / 2, 3.2);
      const h = new THREE.Path(); h.moveTo(-w / 2 + 0.8, -2.4); h.lineTo(-w / 2 + 0.8, 2.4); h.lineTo(w / 2 - 0.8, 2.4); h.lineTo(w / 2 - 0.8, -2.4); s.holes.push(h);
      const geo = new THREE.ExtrudeGeometry(s, { depth: 0.1, bevelEnabled: false }); geo.rotateX(Math.PI / 2);
      g.add(mesh(geo, i < 5 ? M.aceroPulido : M.acero, [cx, y, 0]));
    }
    for (const [x, z] of [[-w / 2 + 0.4, -2.8], [w / 2 - 0.4, -2.8], [-w / 2 + 0.4, 2.8], [w / 2 - 0.4, 2.8]]) g.add(mesh(cylY(0.15, AX.REF1 - AX.REF0, 10), M.ceramica, [cx + x, (AX.REF0 + AX.REF1) / 2, z]));
  }
  {
    const g = makePart(A, 'detector_mcp', L2([6, -8, 0]));
    const p = AX.DET;
    g.add(mesh(cylY(1.6, 0.08, 40), M.vidrioPlomo, [p.x, p.y + 0.3, 0]));
    g.add(mesh(cylY(1.6, 0.08, 40), M.vidrioPlomo, [p.x, p.y + 0.18, 0]));
    g.add(mesh(cylY(2.0, 0.35, 40), M.ceramica, [p.x, p.y - 0.1, 0]));
    g.add(mesh(cylY(0.4, 2.0, 16), M.aceroOscuro, [p.x, p.y - 1.4, 0]));
    g.add(mesh(cylY(0.3, 0.5, 16), M.aceroPulido, [p.x, p.y - 2.65, 0]));            // conector de señal (el cable va a la electrónica)
  }

  refs.group = A;
  return refs;
}
