// Analizador del LCMS-9050: sonda ESI calefactada con sub-interfaz de calibrante, bloque calefactor, DL, UF-Qarray, skimmer, UF-Lens,
// Q1 con pre-barras, celda UFsweeper III con UFaccumulation, óptica de transferencia, acelerador ortogonal con UFgrating,
// UF-FlightTube termostatizado, reflectrón iRefTOF de placas apiladas y detector MCP.
// Coordenadas LOCALES (cm): eje iónico = +X; el TOF desciende por −Y.
import * as THREE from 'three';
import { M } from '../../materials.js';
import { mesh, rbox, box, washerX, cylX, cylY, cylZ, tubeX, latheX, tubePath } from '../../geom.js';
import { makePart } from '../../parts.js';
import { AX, ORIGEN } from './geometria.js';

const L2 = (offset, label = true, extra = {}) =>
  ({ level: 2, offset, mode: 'analizador', label: label ? 'analizador' : null, ...extra });

function hypRod(r0, half, depth, len) {
  const s = new THREE.Shape(), N = 16, pts = [];
  for (let i = 0; i <= N; i++) { const v = -half + (2 * half * i) / N; pts.push([Math.sqrt(r0 * r0 + v * v), v]); }
  s.moveTo(...pts[0]); pts.forEach((p) => s.lineTo(...p));
  s.lineTo(r0 + depth, half); s.absarc(r0 + depth, 0, half, Math.PI / 2, -Math.PI / 2, true); s.lineTo(...pts[0]);
  const g = new THREE.ExtrudeGeometry(s, { depth: len, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.03, bevelSegments: 2, curveSegments: 12 });
  g.rotateY(Math.PI / 2); return g;
}
function quad(g, x0, x1) {
  for (let k = 0; k < 4; k++) { const geo = hypRod(AX.R0, 0.42, 0.55, x1 - x0); geo.rotateX((k * Math.PI) / 2 + Math.PI / 4); g.add(mesh(geo, M.molibdeno, [x0, 0, 0])); }
}
function multipole(g, x0, x1, n, rA, rB, rr, seg = 1) {
  const len = (x1 - x0) / seg;
  for (let s = 0; s < seg; s++) {
    const xa = x0 + s * len, xb = xa + len * 0.86, ra = rA + (rB - rA) * (s / seg), rb = rA + (rB - rA) * ((s + 0.86) / seg);
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2 + Math.PI / n;
      const p0 = new THREE.Vector3(xa, Math.cos(a) * (ra + rr), Math.sin(a) * (ra + rr)), p1 = new THREE.Vector3(xb, Math.cos(a) * (rb + rr), Math.sin(a) * (rb + rr));
      const d = p1.clone().sub(p0), m = mesh(new THREE.CylinderGeometry(rr, rr, d.length(), 14), M.aceroPulido);
      m.position.copy(p0).addScaledVector(d, 0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); g.add(m);
    }
  }
}

export function buildAnalizador(parent) {
  const refs = {};
  const A = makePart(parent, 'analizador', { level: 1, offset: [0, 0, 0], mode: 'analizador', label: 'equipo' });
  A.position.copy(ORIGEN);
  A.rotation.y = Math.PI / 2; // +X local -> −Z mundo

  /* ---------------- FUENTE ---------------- */
  {
    const g = makePart(A, 'sonda_esi', L2([-12, 12, 0]));
    const x = AX.SPRAY.x, y = AX.SPRAY.y;
    // brida apoyada en el paso del suelo del alojamiento (y mundo ≈ 135) y cabezal con la entrada PEEK arriba
    const YB = 15.95;
    g.add(mesh(cylY(0.9, YB - 4.3, 36), M.acero, [x, y + (YB + 4.3) / 2, 0]));
    g.add(mesh(cylY(1.35, 2.2, 36), M.aceroPulido, [x, y + 3.2, 0]));
    g.add(mesh(cylY(0.55, 1.6, 24, 0.9), M.acero, [x, y + 1.3, 0]));
    g.add(mesh(cylY(0.06, 1.1, 10), M.aceroPulido, [x, y + 0.2, 0]));
    g.add(mesh(rbox(4.4, 0.8, 4.4, 0.2), M.aceroOscuro, [x, y + YB, 0]));
    g.add(mesh(rbox(3.6, 2.6, 3.6, 0.3), M.grisClaro, [x, y + YB + 1.65, 0]));
    g.add(mesh(cylY(0.5, 1.0, 6), M.peekBeige, [x, y + YB + 3.4, 0]));
    const sprayMat = M.haz.clone(); sprayMat.color.setHex(0x8fd3ff);
    const spray = mesh(new THREE.ConeGeometry(1.0, 3.0, 24, 1, true), sprayMat, [x, y - 1.3, 0]);
    spray.userData.noClone = true; spray.castShadow = false; spray.raycast = () => {};
    g.add(spray); refs.spray = spray;
  }
  {
    const g = makePart(A, 'sub_interfaz', L2([-10, 8, 6]));
    g.add(mesh(cylY(0.5, 9, 24), M.acero, [AX.SPRAY.x + 0.6, AX.SPRAY.y + 6, 3.4], [0.4, 0, 0]));
    g.add(mesh(cylY(0.2, 1.2, 16, 0.4), M.aceroPulido, [AX.SPRAY.x + 0.6, AX.SPRAY.y + 1.3, 1.8], [0.4, 0, 0]));
  }
  {
    const g = makePart(A, 'bloque_calefactor', L2([-8, 0, 0]));
    g.add(mesh(cylX(3.2, 1.6, 48), M.acero, [-0.6, 0, 0]));
    g.add(mesh(washerX(2.2, 0.5, 0.25, 48), M.aceroPulido, [-1.45, 0, 0]));
    g.add(mesh(cylX(0.55, 0.6, 24, 0.75), M.aceroOscuro, [-1.75, 0, 0]));
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; g.add(mesh(cylX(0.14, 0.3, 10), M.tornilloNegro, [-1.5, Math.cos(a) * 1.5, Math.sin(a) * 1.5])); }
  }
  {
    const g = makePart(A, 'linea_desolvatacion', L2([-4, -3, 0]));
    g.add(mesh(cylX(0.32, AX.DL1 + 0.6, 32), M.aceroPulido, [AX.DL1 / 2 - 0.3, 0, 0]));
    g.add(mesh(tubeX(0.75, 0.32, 3.6, 32), M.cobre, [3.2, 0, 0]));
  }

  /* ---------------- ÓPTICA, Q1 Y CELDA ---------------- */
  {
    const g = makePart(A, 'uf_qarray', L2([2, 5, 0]));
    multipole(g, AX.QA_0, AX.QA_1, 4, 1.15, 0.45, 0.22, 6);
    g.add(mesh(latheX([[0.12, 0], [0.18, 0], [1.6, -1.3], [2.6, -1.4], [2.6, -1.25], [1.6, -1.15], [0.12, 0.02]], 48), M.aceroPulido, [AX.SKIM, 0, 0]));
  }
  {
    const g = makePart(A, 'uf_lens', L2([5, 5, 0]));
    multipole(g, AX.UL_0 + 0.5, AX.UL_1 - 0.5, 8, 0.6, 0.6, 0.14);
    for (const x of [AX.UL_0, AX.UL_1]) g.add(mesh(washerX(1.5, 0.3, 0.15, 40), M.aceroPulido, [x, 0, 0]));
  }
  {
    const g = makePart(A, 'q1', L2([8, 0, 0]));
    quad(g, AX.Q_0, AX.Q1P - 0.15); quad(g, AX.Q1P, AX.Q_1);
    for (const x of [AX.Q1P + 0.8, AX.Q_1 - 0.8]) g.add(mesh(tubeX(2.3, 1.75, 0.9, 48), M.ceramica, [x, 0, 0]));
  }
  {
    const g = makePart(A, 'celda_colision', L2([10, 7, 0], true, { shell: true }));
    g.add(mesh(tubeX(2.0, 1.85, AX.C_1 - AX.C_0, 56), M.acero, [(AX.C_0 + AX.C_1) / 2, 0, 0]));
    for (const x of [AX.C_0, AX.C_1]) g.add(mesh(washerX(2.05, 0.35, 0.2, 48), M.aceroPulido, [x, 0, 0]));
    g.add(mesh(cylY(0.22, 3.4, 16), M.acero, [AX.C_0 + 2, 3.5, 0]));
  }
  {
    const g = makePart(A, 'celda_multipolo', L2([10, 0, 0], false, { info: 'celda_colision' }));
    multipole(g, AX.C_0 + 0.5, AX.C_1 - 0.5, 8, 0.8, 0.35, 0.13);
  }
  {
    const g = makePart(A, 'uf_accumulation', L2([12, 0, 0]));
    g.add(mesh(washerX(1.6, 0.35, 0.18, 40), M.oro, [AX.GATE, 0, 0]));
    g.add(mesh(washerX(1.6, 0.35, 0.12, 40), M.aceroPulido, [AX.GATE + 0.45, 0, 0]));
    for (let i = 0; i < 3; i++) g.add(mesh(washerX(1.2, 0.3, 0.12, 40), M.aceroPulido, [AX.TR_0 + i * 1.6, 0, 0]));
  }

  /* ---------------- TOF ---------------- */
  {
    const g = makePart(A, 'acelerador', L2([16, 6, 0]));
    const p = AX.PUSH;
    for (let i = 0; i < 7; i++) g.add(mesh(rbox(5.4, 0.12, 3.4, 0.03), i === 0 ? M.acero : M.aceroPulido, [p.x + 0.4, p.y + 0.9 - i * 0.55, 0]));
    // UFgrating: rejilla de alta resistencia mecánica
    for (let i = 0; i < 12; i++) g.add(mesh(box(0.06, 0.08, 3.2), M.oro, [p.x - 2.0 + i * 0.4, p.y - 2.6, 0]));
    for (const x of [p.x - 2.2, p.x + 2.8]) g.add(mesh(box(0.25, 3.8, 0.25), M.ceramica, [x, p.y - 0.8, 1.5]));
  }
  {
    const g = makePart(A, 'tubo_vuelo', L2([0, 0, -14], true, { shell: true }));
    const cx = (AX.TOF_X0 + AX.TOF_X1) / 2, cy = (AX.TOF_Y0 + AX.TOF_Y1) / 2, w = AX.TOF_X1 - AX.TOF_X0, hh = AX.TOF_Y1 - AX.TOF_Y0;
    for (const z of [4.4, -4.4]) g.add(mesh(rbox(w, hh, 0.4, 0.15), M.acero, [cx, cy, z]));
    for (const x of [AX.TOF_X0, AX.TOF_X1]) g.add(mesh(rbox(0.4, hh, 9.2, 0.15), M.acero, [x, cy, 0]));
    g.add(mesh(rbox(w + 0.4, 0.4, 9.2, 0.15), M.acero, [cx, AX.TOF_Y0, 0]));
    // camisa calefactora y sensores del UF-FlightTube
    for (const y of [AX.TOF_Y0 + 18, AX.TOF_Y0 + 45, AX.TOF_Y0 + 72]) {
      g.add(mesh(rbox(w + 1.4, 2.2, 10.2, 0.4), M.cobre, [cx, y, 0]));
      g.add(mesh(rbox(1.2, 1.0, 1.2, 0.2), M.plasticoNegro, [AX.TOF_X1 + 1.2, y, 3]));
    }
  }
  {
    const g = makePart(A, 'ireftof', L2([0, -14, 0]));
    const cx = (AX.TOF_X0 + AX.TOF_X1) / 2, w = AX.TOF_X1 - AX.TOF_X0 - 2;
    for (let i = 0; i < 24; i++) {
      const y = AX.REF0 + (AX.REF1 - AX.REF0) * (i / 23);
      const s = new THREE.Shape(); s.moveTo(-w / 2, -3.6); s.lineTo(w / 2, -3.6); s.lineTo(w / 2, 3.6); s.lineTo(-w / 2, 3.6);
      const ins = 0.8 + 0.5 * Math.sin((i / 23) * Math.PI);             // aberturas variables: perfil de campo calculado
      const hl = new THREE.Path(); hl.moveTo(-w / 2 + ins, -2.8); hl.lineTo(-w / 2 + ins, 2.8); hl.lineTo(w / 2 - ins, 2.8); hl.lineTo(w / 2 - ins, -2.8); s.holes.push(hl);
      const geo = new THREE.ExtrudeGeometry(s, { depth: 0.1, bevelEnabled: false }); geo.rotateX(Math.PI / 2);
      g.add(mesh(geo, i > 17 ? M.aceroPulido : M.acero, [cx, y, 0]));
    }
    for (const [x, z] of [[-w / 2 + 0.4, -3.2], [w / 2 - 0.4, -3.2], [-w / 2 + 0.4, 3.2], [w / 2 - 0.4, 3.2]]) g.add(mesh(cylY(0.15, AX.REF1 - AX.REF0, 10), M.ceramica, [cx + x, (AX.REF0 + AX.REF1) / 2, z]));
  }
  {
    const g = makePart(A, 'detector_mcp', L2([6, 8, 0]));
    const p = AX.DET;
    g.add(mesh(cylY(1.7, 0.1, 40), M.vidrioPlomo, [p.x, p.y - 0.3, 0]));
    g.add(mesh(cylY(1.7, 0.1, 40), M.vidrioPlomo, [p.x, p.y - 0.15, 0]));
    g.add(mesh(cylY(2.1, 0.35, 40), M.ceramica, [p.x, p.y + 0.15, 0]));
    g.add(mesh(cylY(0.4, 2, 16), M.aceroOscuro, [p.x, p.y + 1.4, 0]));
  }

  refs.group = A;
  return refs;
}
