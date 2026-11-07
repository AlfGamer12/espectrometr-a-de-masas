// Analizador del Agilent 7900 ICP-MS: nebulizador MicroMist, cámara de pulverización de Scott refrigerada por Peltier, conector,
// antorcha de cuarzo con ShieldTorch y bobina de RF, plasma, conos de muestreo y de separación, lentes de extracción,
// lente Omega fuera de eje, celda de colisión/reacción ORS⁴ (octopolo), lente de polarización, cuadrupolo hiperbólico
// y detector ortogonal de dínodos discretos.
// Coordenadas LOCALES (cm): eje iónico = +X, origen en la punta del cono de muestreo (ver geometria.js).
import * as THREE from 'three';
import { M } from '../../materials.js';
import { mesh, rbox, box, washerX, cylX, cylY, cylZ, tubeX, latheX, tubePath, placaPasos } from '../../geom.js';
import { makePart, cableFlex } from '../../parts.js';
import { AX, ORIGEN } from './geometria.js';

const L2 = (offset, label = true, extra = {}) =>
  ({ level: 2, offset, mode: 'analizador', label: label ? 'analizador' : null, ...extra });

/** Barra hiperbólica del cuadrupolo (eje X). */
function hypRod(r0, half, depth, len) {
  const s = new THREE.Shape(), N = 16, pts = [];
  for (let i = 0; i <= N; i++) { const v = -half + (2 * half * i) / N; pts.push([Math.sqrt(r0 * r0 + v * v), v]); }
  s.moveTo(...pts[0]); pts.forEach((p) => s.lineTo(...p));
  s.lineTo(r0 + depth, half); s.absarc(r0 + depth, 0, half, Math.PI / 2, -Math.PI / 2, true); s.lineTo(...pts[0]);
  const g = new THREE.ExtrudeGeometry(s, { depth: len, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.03, bevelSegments: 2, curveSegments: 12 });
  g.rotateY(Math.PI / 2); return g;
}

export function buildAnalizador(parent) {
  const refs = {};
  const A = makePart(parent, 'analizador', { level: 1, offset: [0, 0, 0], mode: 'analizador', label: 'equipo' });
  A.position.copy(ORIGEN);
  const cuarzo = M.cuarzo, Y2 = AX.Y2;
  // los perfiles torneados de los conos se ven por ambas caras
  const niquel = M.aceroPulido.clone(); niquel.color.setHex(0xd4d6d8); niquel.side = THREE.DoubleSide;
  const cobre2 = M.cobre.clone(); cobre2.side = THREE.DoubleSide;

  /* ---------------- INTRODUCCIÓN DE MUESTRA ---------------- */
  {
    const g = makePart(A, 'nebulizador', L2([-8, -6, 6]));
    const x = AX.SC_X, y = AX.SC_Y;
    // nebulizador concéntrico de vidrio: cuerpo, punta cónica, brazo lateral del gas y entrada del capilar de muestra
    g.add(mesh(cylZ(0.45, AX.NEB_Z1 - AX.NEB_Z0 - 0.8, 36), M.vidrio, [x, y, (AX.NEB_Z0 + 0.8 + AX.NEB_Z1) / 2]));
    g.add(mesh(cylZ(0.45, 1.4, 36, 0.2), M.vidrio, [x, y, AX.NEB_Z0 + 0.1]));
    g.add(mesh(cylZ(0.12, AX.NEB_Z1 - AX.NEB_Z0 + 0.4, 12), M.vidrio, [x, y, (AX.NEB_Z0 + AX.NEB_Z1) / 2 - 0.2]));
    g.add(mesh(cylX(0.2, 1.6, 16), M.vidrio, [x + 1.2, y, AX.NEB_Z1 - 2]));
    g.add(mesh(cylX(0.28, 0.6, 16), M.ptfe, [x + 2.0, y, AX.NEB_Z1 - 2]));
    g.add(mesh(cylZ(0.3, 0.8, 20), M.peekBeige, [x, y, AX.NEB_Z1 + 0.4]));
    refs.nebTip = new THREE.Vector3(x, y, AX.NEB_Z0 - 0.6);
  }
  {
    const g = makePart(A, 'camara_nebulizacion', L2([-8, -6, 0]));
    const x = AX.SC_X, y = AX.SC_Y, z0 = AX.SC_Z0, z1 = AX.SC_Z1, r = AX.SC_R;
    // cámara de Scott de doble paso (cuarzo): tubo exterior, tubo interior, fondo redondeado, tapa con el nebulizador
    g.add(mesh(new THREE.CylinderGeometry(r, r, z1 - z0 - r, 48, 1, true).rotateX(Math.PI / 2), cuarzo, [x, y, (z0 + r + z1) / 2]));
    const fondo = new THREE.SphereGeometry(r, 40, 20, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2).rotateX(Math.PI / 2);
    g.add(mesh(fondo, cuarzo, [x, y, z0 + r]));
    g.add(mesh(new THREE.CylinderGeometry(0.9, 0.9, z1 + 0.25 - z0 - 1.6, 36, 1, true).rotateX(Math.PI / 2), cuarzo, [x, y, (z0 + 1.6 + z1 + 0.25) / 2]));
    g.add(mesh(cylZ(r + 0.05, 0.6, 48), M.ptfe, [x, y, z1 + 0.3]));
    g.add(mesh(cylZ(0.62, 0.7, 24), M.ptfe, [x, y, z1 + 0.95]));
    // salida del aerosol (parte delantera superior) y drenaje (parte trasera inferior)
    g.add(mesh(cylY(0.5, 1.7, 24), cuarzo, [x, y + r + 0.55, z1 - 1.5]));
    g.add(mesh(cylY(0.62, 0.5, 24), M.ptfe, [x, y + r + 1.45, z1 - 1.5]));
    g.add(mesh(cylY(0.32, 1.6, 20), cuarzo, [x, y - r - 0.5, z0 + 0.8]));
    g.add(mesh(cylY(0.42, 0.5, 20), M.ptfe, [x, y - r - 1.2, z0 + 0.8]));                       // racor del drenaje
    refs.scOut = new THREE.Vector3(x, y + r + 1.7, z1 - 1.5);
    refs.scDrain = new THREE.Vector3(x, y - r - 1.3, z0 + 0.8);
  }
  {
    const g = makePart(A, 'peltier', L2([-8, -10, 0]));
    const x = AX.SC_X, yb = AX.SC_Y - AX.SC_R - 0.12;
    // cuna de aluminio refrigerada por Peltier con disipador de aletas
    const s = new THREE.Shape(); s.moveTo(-2.6, -3.6); s.lineTo(2.6, -3.6); s.lineTo(2.6, 0); s.lineTo(2.0, 0);
    s.absarc(0, AX.SC_R + 0.12, AX.SC_R + 0.12, -Math.PI * 0.2, -Math.PI * 0.8, true); s.lineTo(-2.6, 0); s.lineTo(-2.6, -3.6);
    const cuna = new THREE.ExtrudeGeometry(s, { depth: 10, bevelEnabled: false, curveSegments: 24 });
    g.add(mesh(cuna, M.aluminio, [x, yb, 0.3]));
    for (let i = 0; i < 5; i++) g.add(mesh(box(5.2, 0.2, 9.6), M.anodizado, [x, yb - 4.25 - i * 0.42, 5.3]));
    g.add(mesh(box(5.4, 0.5, 9.8), M.ceramica, [x, yb - 3.85 + 0.0, 5.3]));
    g.add(mesh(rbox(1.6, 1.0, 1.2, 0.2), M.plasticoNegro, [x + 3.4, yb - 2.2, 1.2]));
  }
  {
    // conector de cuarzo con rótula entre la salida de la cámara y el inyector de la antorcha
    const g = makePart(A, 'conector_antorcha', L2([0, 0, 0], false, { info: 'antorcha' }));
    const o = refs.scOut;
    refs.conector = cableFlex(g, [[o.x, o.y - 0.1, o.z, 'camara_nebulizacion'], [o.x, o.y + 1.0, o.z - 1.2, 'camara_nebulizacion'], [o.x + 2.2, 0.15, 3.4],
      [AX.T_0 - 5.2, 0, 0.5, 'antorcha'], [AX.T_0 - 3.2, 0, 0, 'antorcha'], [AX.T_0 - 0.65, 0, 0, 'antorcha']], 0.42, cuarzo, { seg: 80, radial: 16 });
  }

  /* ---------------- ANTORCHA Y PLASMA ---------------- */
  {
    const g = makePart(A, 'antorcha', L2([-16, 0, 0]));
    const L = AX.T_1 - AX.T_0, cx = (AX.T_0 + AX.T_1) / 2;
    g.add(mesh(tubeX(AX.T_R, AX.T_R - 0.1, L, 56), cuarzo, [cx, 0, 0]));                       // tubo exterior (gas de plasma)
    g.add(mesh(tubeX(0.78, 0.7, L - 2.4, 48), cuarzo, [AX.T_0 + (L - 2.4) / 2, 0, 0]));       // tubo intermedio (gas auxiliar)
    g.add(mesh(tubeX(0.22, 0.125, L - 2.6, 24), cuarzo, [AX.T_0 + (L - 2.6) / 2 - 0.3, 0, 0])); // inyector de 2,5 mm
    g.add(mesh(cylX(1.05, 0.6, 48), M.ptfe, [AX.T_0 - 0.3, 0, 0]));                            // base
    g.add(mesh(cylX(0.5, 0.35, 24), cuarzo, [AX.T_0 - 0.78, 0, 0]));
    for (const [x, h] of [[AX.T_0 + 2.0, 0.95], [AX.T_0 + 0.8, 0.95]]) {
      g.add(mesh(cylY(0.18, h, 16), cuarzo, [x, AX.T_R + h / 2 - 0.02, 0]));
      g.add(mesh(cylY(0.27, 0.5, 16), M.ptfe, [x, AX.T_R + 1.0, 0]));                       // racor del tubo de gas
    }
    refs.torchInlets = [new THREE.Vector3(AX.T_0 + 2.0, AX.T_R + 0.93, 0), new THREE.Vector3(AX.T_0 + 0.8, AX.T_R + 0.93, 0)];
  }
  {
    const g = makePart(A, 'escudo_antorcha', L2([-8, 0, 0], true, { info: 'escudo_antorcha' }));
    g.add(mesh(tubeX(1.16, 1.07, 2.0, 48), M.plata, [AX.COIL_0 + 0.8, 0, 0]));
    g.add(mesh(box(0.5, 0.06, 0.25), M.plata, [AX.COIL_0 - 0.15, -1.13, 0]));
  }
  {
    const g = makePart(A, 'bobina', L2([-12, 0, 0]));
    // bobina de carga: 3 espiras de tubo de cobre plateado; empieza y termina en la parte inferior
    const pts = [], N = 160, R = AX.COIL_R;
    for (let i = 0; i <= N; i++) {
      const u = i / N, th = -Math.PI / 2 + u * 6 * Math.PI;
      pts.push([AX.COIL_0 + 0.1 + u * (AX.COIL_1 - AX.COIL_0 - 0.2), R * Math.sin(th), R * Math.cos(th)]);
    }
    const ends = [AX.COIL_0 + 0.1, AX.COIL_1 - 0.1];
    pts.unshift([ends[0], -R - 0.6, 0]); pts.push([ends[1], -R - 0.6, 0]);
    g.add(mesh(tubePath(pts, 0.17, 320, 10), M.cobre));
    for (const x of ends) g.add(mesh(cylY(0.26, 1.3, 16), M.cobre, [x, -R - 1.2, 0]));
    refs.coilEnds = ends.map((x) => new THREE.Vector3(x, -R - 1.85, 0));
  }
  {
    const g = makePart(A, 'plasma', L2([-12, 0, 0], false, { info: 'plasma' }));
    const mat = M.haz.clone(); mat.color.setHex(0xffb56b); mat.side = THREE.DoubleSide;
    const prof = [[0.01, -6.2], [0.55, -5.4], [0.92, -4.4], [0.95, -3.3], [0.8, -2.2], [0.5, -1.1], [0.18, -0.3], [0.01, -0.15]];
    const p = mesh(latheX(prof, 48), mat); p.userData.noClone = true; p.castShadow = false; p.raycast = () => {};
    const core = M.haz.clone(); core.color.setHex(0xfff0d0);
    const c = mesh(latheX([[0.01, -5.0], [0.42, -4.3], [0.5, -3.4], [0.3, -2.2], [0.01, -1.6]], 36), core); c.userData.noClone = true; c.castShadow = false; c.raycast = () => {};
    g.add(p, c); refs.plasma = [p, c];
  }

  /* ---------------- INTERFAZ ---------------- */
  {
    const g = makePart(A, 'cono_muestreo', L2([-6, 0, 0]));
    const prof = [[0.05, 0], [0.32, 0], [2.5, 1.35], [2.75, 1.35], [2.75, 1.78], [2.2, 1.78], [2.2, 1.45], [0.05, 0.16], [0.05, 0]];
    g.add(mesh(latheX(prof, 72), niquel));
    g.add(mesh(latheX([[0.05, -0.005], [0.34, -0.005], [0.62, 0.17], [0.05, 0.17]], 48), cobre2));   // inserto de la punta
  }
  {
    const g = makePart(A, 'interfaz', L2([0, 0, 0]));
    // placa de interfaz refrigerada por agua: sostiene el cono de muestreo; detrás, la región de interfaz (≈ 300 Pa)
    g.add(placaPasos(14, 14, AX.IF_1 - AX.IF_0, [[0, 0, 2.0]], M.aluminio, [(AX.IF_0 + AX.IF_1) / 2, 0, 0], 'zy', 0.6));
    for (const y of [-3, 4]) g.add(mesh(cylZ(0.42, 1.2, 20), M.aceroPulido, [2.4, y, -7.6]));
    g.add(mesh(cylY(0.75, 1.2, 28), M.aceroPulido, [2.4, -7.6, 0]));
    g.add(mesh(cylY(1.0, 0.25, 28), M.aceroPulido, [2.4, -8.3, 0]));
    for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; g.add(mesh(cylX(0.16, 0.2, 12), M.tornilloNegro, [AX.IF_0 - 0.1, Math.cos(a) * 3.4, Math.sin(a) * 3.4])); }
    refs.ifWater = [new THREE.Vector3(2.4, -3, -8.2), new THREE.Vector3(2.4, 4, -8.2)];
    refs.ifRough = new THREE.Vector3(2.4, -8.45, 0);
  }
  {
    const g = makePart(A, 'cono_separador', L2([3, 0, 0]));
    const prof = [[0.05, 0.9], [0.22, 0.9], [1.8, 3.05], [2.1, 3.05], [2.1, 3.28], [1.5, 3.28], [1.5, 3.05], [0.05, 1.05], [0.05, 0.9]];
    g.add(mesh(latheX(prof, 72), niquel));
  }

  /* ---------------- ÓPTICA ---------------- */
  {
    const g = makePart(A, 'lentes_extraccion', L2([6, 0, 0]));
    for (const x of [AX.EXT1, AX.EXT2]) g.add(mesh(washerX(1.4, 0.3, 0.15, 48), M.aceroPulido, [x, 0, 0]));
    g.add(mesh(tubeX(1.45, 1.2, 0.6, 48), M.ceramica, [(AX.EXT1 + AX.EXT2) / 2, 0, 0]));
  }
  {
    const g = makePart(A, 'lente_omega', L2([9, 0, 0], true, { shell: true }));
    const yc = Y2 / 2, x0 = AX.OM_0, x1 = AX.OM_1;
    g.add(mesh(tubeX(2.6, 2.45, x1 - x0, 56), M.acero, [(x0 + x1) / 2, yc, 0]));
    g.add(mesh(washerX(1.6, 0.35, 0.12, 48), M.aceroPulido, [x0 + 0.15, 0, 0]));
    g.add(mesh(washerX(1.6, 0.35, 0.12, 48), M.aceroPulido, [x1 - 0.15, Y2, 0]));
    // dos pares de electrodos desplazan el haz 1,3 cm: los fotones y los neutros siguen recto y no llegan a la celda
    const slope = 0.38;
    for (const [xc, yy] of [[7.45, 0.33], [9.0, 0.97]]) for (const s of [1, -1]) {
      g.add(mesh(rbox(1.4, 0.12, 2.6, 0.04), M.aceroPulido, [xc - s * Math.sin(slope) * 0.85, yy + s * Math.cos(slope) * 0.85, 0], [0, 0, slope]));
    }
    for (const z of [1.5, -1.5]) g.add(mesh(box(3.2, 0.25, 0.25), M.ceramica, [(x0 + x1) / 2, yc - 1.65, z]));
  }

  /* ---------------- CELDA ORS4 ---------------- */
  {
    const g = makePart(A, 'celda_ors', L2([12, 0, 0], true, { shell: true }));
    g.add(mesh(tubeX(1.75, 1.6, AX.C_1 - AX.C_0, 56), M.acero, [(AX.C_0 + AX.C_1) / 2, Y2, 0]));
    for (const x of [AX.C_0 - 0.05, AX.C_1 + 0.05]) g.add(mesh(washerX(1.75, 0.32, 0.1, 48), M.aceroPulido, [x, Y2, 0]));
    g.add(mesh(cylY(0.2, 5.2 - (Y2 + 1.7), 16), M.aceroPulido, [AX.C_0 + 1.5, (Y2 + 1.7 + 5.2) / 2, 0]));
    g.add(mesh(cylY(0.32, 0.5, 16), M.aceroPulido, [AX.C_0 + 1.5, Y2 + 1.95, 0]));
  }
  {
    const g = makePart(A, 'octopolo', L2([12, 0, 0], false, { info: 'celda_ors' }));
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2 + Math.PI / 8;
      g.add(mesh(cylX(0.12, AX.C_1 - AX.C_0 - 0.8, 16), M.molibdeno, [(AX.C_0 + AX.C_1) / 2, Y2 + Math.cos(a) * 0.62, Math.sin(a) * 0.62]));
    }
    for (const x of [AX.C_0 + 0.9, AX.C_1 - 0.9]) g.add(mesh(tubeX(1.5, 0.82, 0.4, 48), M.ceramica, [x, Y2, 0]));
  }
  {
    const g = makePart(A, 'lente_kd', L2([14, 0, 0]));
    g.add(mesh(washerX(1.5, 0.35, 0.15, 48), M.aceroPulido, [AX.PB, Y2, 0]));
  }

  /* ---------------- CUADRUPOLO ---------------- */
  {
    const g = makePart(A, 'cuadrupolo', L2([18, 0, 0]));
    for (let k = 0; k < 4; k++) {
      const geo = hypRod(AX.R0, 0.42, 0.55, AX.Q_1 - AX.Q_0); geo.rotateX((k * Math.PI) / 2 + Math.PI / 4);
      g.add(mesh(geo, M.molibdeno, [AX.Q_0, Y2, 0]));
    }
    for (const x of [AX.Q_0 + 1.1, AX.Q_1 - 1.1]) g.add(mesh(tubeX(2.1, 1.45, 0.9, 56), M.ceramica, [x, Y2, 0]));
  }

  /* ---------------- DETECTOR ---------------- */
  {
    const g = makePart(A, 'detector', L2([22, 0, 0]));
    const e = AX.EM;
    g.add(mesh(washerX(1.6, 0.45, 0.15, 48), M.aceroPulido, [AX.DEF - 0.4, Y2, 0]));
    g.add(mesh(rbox(2.8, 0.15, 2.6, 0.05), M.aceroPulido, [e.x - 0.2, Y2 + 1.3, 0], [0, 0, -0.35]));       // deflector
    g.add(mesh(rbox(2.8, 3.2, 2.2, 0.25), M.ceramica, [e.x, e.y - 1.6, 0]));                              // multiplicador
    g.add(mesh(rbox(1.6, 0.12, 1.2, 0.04), M.aceroOscuro, [e.x, e.y + 0.06, 0]));                         // rendija de entrada
    for (let i = 0; i < 9; i++) g.add(mesh(box(0.12, 2.4, 0.15), M.aceroPulido, [e.x - 1.1 + i * 0.27, e.y - 1.7, 1.17]));
    g.add(mesh(cylY(0.32, 3.3, 16), M.aceroOscuro, [e.x, e.y - 3.2 - 1.6, 0]));                          // paso de alta tensión
    g.add(mesh(cylY(0.6, 0.6, 24), M.plasticoNegro, [e.x, e.y - 6.6, 0]));
    refs.detPin = new THREE.Vector3(e.x, e.y - 6.95, 0);
  }

  refs.group = A;
  return refs;
}
