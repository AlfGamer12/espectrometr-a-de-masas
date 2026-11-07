// Analizador del LCMS-8060NX: sonda ESI (IonFocus), bloque calefactor, línea de desolvatación, UF-Qarray, skimmer,
// UF-Lens, Q1 con pre-barras, celda de colisión UFsweeper, Q3 con pre-barras y detector con dínodo de conversión.
// Coordenadas LOCALES (cm): eje iónico = +X (ver geometria.js).
import * as THREE from 'three';
import { M } from '../../materials.js';
import { mesh, rbox, box, washerX, cylX, cylY, cylZ, tubeX, latheX, tubePath, screws } from '../../geom.js';
import { makePart, cableFlex } from '../../parts.js';
import { AX, ORIGEN } from './geometria.js';

const L2 = (offset, label = true, extra = {}) =>
  ({ level: 2, offset, mode: 'analizador', label: label ? 'analizador' : null, ...extra });

/** Barra de cuadrupolo de perfil hiperbólico (extrusión a lo largo de X) en el ángulo `ang`. */
function hypRod(r0, half, depth, len) {
  const s = new THREE.Shape();
  const N = 18;
  const pts = [];
  for (let i = 0; i <= N; i++) { const v = -half + (2 * half * i) / N; pts.push([Math.sqrt(r0 * r0 + v * v), v]); }
  s.moveTo(...pts[0]); pts.forEach((p) => s.lineTo(...p));
  s.lineTo(r0 + depth, half); s.absarc(r0 + depth, 0, half, Math.PI / 2, -Math.PI / 2, true); s.lineTo(...pts[0]);
  const g = new THREE.ExtrudeGeometry(s, { depth: len, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.03, bevelSegments: 2, curveSegments: 16 });
  g.rotateY(Math.PI / 2); // Z -> X
  return g;
}
/** Conjunto de cuatro barras hiperbólicas con soportes cerámicos. */
function quad(g, x0, x1, r0, mat) {
  const len = x1 - x0;
  for (let k = 0; k < 4; k++) {
    const geo = hypRod(r0, 0.42, 0.55, len);
    geo.rotateX((k * Math.PI) / 2 + Math.PI / 4);
    g.add(mesh(geo, mat, [x0, 0, 0]));
  }
  for (const x of [x0 + 0.8, x1 - 0.8]) {
    g.add(mesh(tubeX(2.3, 1.75, 0.9, 48), M.ceramica, [x, 0, 0]));
  }
}
/** Multipolo de barras cilíndricas (n barras), con radio de inscripción r0a → r0b (convergente). */
function multipole(g, x0, x1, n, r0a, r0b, rr, mat, seg = 1) {
  const len = (x1 - x0) / seg;
  for (let s = 0; s < seg; s++) {
    const xa = x0 + s * len, xb = xa + len * 0.86;
    const ra = r0a + (r0b - r0a) * (s / seg), rb = r0a + (r0b - r0a) * ((s + 0.86) / seg);
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2 + Math.PI / n;
      const p0 = new THREE.Vector3(xa, Math.cos(a) * (ra + rr), Math.sin(a) * (ra + rr));
      const p1 = new THREE.Vector3(xb, Math.cos(a) * (rb + rr), Math.sin(a) * (rb + rr));
      const d = p1.clone().sub(p0);
      const m = mesh(new THREE.CylinderGeometry(rr, rr, d.length(), 16), mat);
      m.position.copy(p0).addScaledVector(d, 0.5);
      m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
      g.add(m);
    }
  }
}

export function buildAnalizador(parent) {
  const refs = {};
  const A = makePart(parent, 'analizador', { level: 1, offset: [0, 24, 0], mode: 'analizador', label: 'equipo' });
  A.position.copy(ORIGEN);

  /* ---------------- FUENTE / INTERFAZ ---------------- */
  // Sonda ESI (unidad IonFocus): cuerpo vertical que entra por la parte superior de la fuente
  {
    const g = makePart(A, 'sonda_esi', L2([-14, 12, 0]));
    const x = AX.SPRAY.x, y = AX.SPRAY.y;
    // la sonda atraviesa el paso superior de la torre: brida apoyada en él y cabezal por fuera (y mundo ≈ 73–77)
    const YB = 29.95;
    g.add(mesh(cylY(0.9, YB - 4.3, 36), M.acero, [x, y + (YB + 4.3) / 2, 0]));   // cuerpo de la sonda
    g.add(mesh(cylY(1.35, 2.2, 36), M.aceroPulido, [x, y + 3.2, 0]));          // boquilla del gas de calentamiento
    g.add(mesh(cylY(0.55, 1.6, 24, 0.9), M.acero, [x, y + 1.3, 0]));           // cono del nebulizador
    g.add(mesh(cylY(0.06, 1.1, 10), M.aceroPulido, [x, y + 0.2, 0]));         // capilar ESI
    g.add(mesh(rbox(3.6, 2.6, 3.6, 0.3), M.negroBrillante, [x, y + YB + 1.65, 0]));  // cabezal con conexiones
    g.add(mesh(rbox(4.4, 0.8, 4.4, 0.2), M.aceroOscuro, [x, y + YB, 0]));     // brida / palanca de anclaje
    g.add(mesh(box(4.5, 0.5, 0.8), M.aceroPulido, [x + 3.6, y + YB, 0]));     // palanca "one-touch"
    // conexiones del cabezal: entrada PEEK (arriba), gas nebulizador (detrás) y alta tensión (lateral)
    g.add(mesh(cylY(0.5, 1.0, 6), M.peekBeige, [x, y + YB + 3.35, 0]));
    g.add(mesh(cylZ(0.42, 1.0, 6), M.aceroPulido, [x, y + YB + 1.65, -2.2]));
    g.add(mesh(cylX(0.55, 1.4, 24), M.plasticoNegro, [x + 2.4, y + YB + 2.05, 0]));
    // electrodos de enfoque (IonFocus) a ambos lados de la pluma
    for (const z of [-1.5, 1.5]) g.add(mesh(rbox(0.25, 2.2, 1.6, 0.06), M.aceroPulido, [x + 0.6, y - 0.4, z]));
    // pluma de pulverización (visible durante la simulación)
    const sprayMat = M.haz.clone(); sprayMat.color.setHex(0x8fd3ff);
    const spray = mesh(new THREE.ConeGeometry(1.0, 3.0, 24, 1, true), sprayMat, [x, y - 1.3, 0]);
    spray.userData.noClone = true; spray.castShadow = false; spray.raycast = () => {};
    g.add(spray); refs.spray = spray;
  }
  // Bloque calefactor (heat block) con la entrada de la DL y el gas de secado a contracorriente
  {
    const g = makePart(A, 'bloque_calefactor', L2([-10, 0, 0]));
    g.add(mesh(cylX(3.2, 1.6, 48), M.acero, [-0.6, 0, 0]));
    g.add(mesh(washerX(2.2, 0.5, 0.25, 48), M.aceroPulido, [-1.45, 0, 0]));
    g.add(mesh(cylX(0.55, 0.6, 24, 0.75), M.aceroOscuro, [-1.75, 0, 0]));      // cono de entrada
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2;
      g.add(mesh(cylX(0.14, 0.3, 10), M.tornilloNegro, [-1.5, Math.cos(a) * 1.5, Math.sin(a) * 1.5])); } // salidas de gas de secado
    for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
      const s = new THREE.Group(); screws(s, M.tornillo, M.tornilloNegro, 0.22, '-x', [[-1.42, Math.cos(a) * 2.7, Math.sin(a) * 2.7]]); g.add(s); }
    g.add(mesh(cylZ(0.3, 3.0), M.aceroOscuro, [-0.6, -3.4, 1.0]));            // cartucho calefactor
    // terminal cerámico en la cara posterior del bloque y cable del cartucho hasta él
    g.add(mesh(rbox(0.8, 0.8, 0.8, 0.1), M.ceramica, [0.6, -1.8, 2.0]));
    g.add(mesh(tubePath([[-0.6, -3.4, 2.4], [-0.5, -3.6, 3.2], [0.4, -3.0, 3.3], [0.6, -2.4, 2.6], [0.6, -2.0, 2.2]], 0.06, 24, 6), M.cobre));
  }
  // Línea de desolvatación (DL): capilar metálico calefactado
  {
    const g = makePart(A, 'linea_desolvatacion', L2([-5, -3.2, 0]));
    g.add(mesh(cylX(0.32, AX.DL1 + 0.6, 32), M.aceroPulido, [AX.DL1 / 2 - 0.3, 0, 0]));
    g.add(mesh(tubeX(0.75, 0.32, 3.6, 32), M.cobre, [3.2, 0, 0]));            // calefactor de la DL
    g.add(mesh(cylX(0.65, 0.5, 6), M.acero, [0.7, 0, 0]));                    // perno terminal (DL Terminal Bolt)
    g.add(mesh(new THREE.TorusGeometry(0.42, 0.08, 8, 24), M.goma, [1.0, 0, 0], [0, Math.PI / 2, 0]));
  }

  /* ---------------- ÓPTICA IÓNICA ---------------- */
  {
    const g = makePart(A, 'uf_qarray', L2([3, 5, 0]));
    multipole(g, AX.QA_0, AX.QA_1, 4, 1.15, 0.45, 0.22, M.aceroPulido, 6);
    for (const x of [AX.QA_0 + 0.1, AX.QA_1 - 0.1]) g.add(mesh(tubeX(2.1, 1.75, 0.5, 40), M.ceramica, [x, 0, 0]));
    for (const x of [AX.QA_0 + 2.5, AX.QA_0 + 5]) g.add(mesh(box(0.25, 4.0, 0.25), M.ceramica, [x, 0, 1.9]));
  }
  {
    const g = makePart(A, 'skimmer', L2([6, 0, 0]));
    g.add(mesh(latheX([[0.12, 0], [0.18, 0], [1.6, -1.3], [2.6, -1.4], [2.6, -1.25], [1.6, -1.15], [0.12, 0.02]], 48), M.aceroPulido, [AX.SKIM, 0, 0]));
    g.add(mesh(washerX(3.0, 2.55, 0.25, 48), M.acero, [AX.SKIM - 1.35, 0, 0]));
  }
  {
    const g = makePart(A, 'uf_lens', L2([9, 5, 0]));
    multipole(g, AX.UL_0 + 0.5, AX.UL_1 - 0.5, 8, 0.6, 0.6, 0.14, M.aceroPulido, 1);
    for (const x of [AX.UL_0, AX.UL_1]) g.add(mesh(washerX(1.5, 0.3, 0.15, 40), M.aceroPulido, [x, 0, 0]));
    for (const x of [AX.UL_0 + 0.8, AX.UL_1 - 0.8]) g.add(mesh(tubeX(1.6, 1.1, 0.6, 40), M.ceramica, [x, 0, 0]));
  }
  // Tabiques de bombeo diferencial
  {
    const g = makePart(A, 'tabiques', L2([0, -9, 0], false, { shell: true }));
    for (const x of AX.WALL) {
      const s = new THREE.Shape(); s.moveTo(-4.4, -4.4); s.lineTo(4.4, -4.4); s.lineTo(4.4, 4.4); s.lineTo(-4.4, 4.4);
      const h = new THREE.Path(); h.absarc(0, 0, x === AX.WALL[0] ? 0.4 : 0.9, 0, Math.PI * 2, true); s.holes.push(h);
      const geo = new THREE.ExtrudeGeometry(s, { depth: 0.5, bevelEnabled: false, curveSegments: 32 }); geo.rotateY(Math.PI / 2);
      g.add(mesh(geo, M.aluminio, [x - 0.25, 0, 0]));
    }
  }

  /* ---------------- ANALIZADORES ---------------- */
  {
    const g = makePart(A, 'q1_prebarras', L2([12, 0, 0], false, { info: 'prebarras' }));
    quadShort(g, AX.Q1_0, AX.Q1P - 0.15);
  }
  {
    const g = makePart(A, 'q1', L2([14, 0, 0]));
    quad(g, AX.Q1P, AX.Q1_1, AX.R0, M.molibdeno);
    rfContacts(g, (AX.Q1P + AX.Q1_1) / 2);
  }
  // Celda de colisión UFsweeper III: carcasa cerrada con argón + multipolo estrechado
  {
    const g = makePart(A, 'celda_carcasa', L2([16, 7, 0], false, { info: 'celda_colision', shell: true }));
    g.add(mesh(tubeX(2.0, 1.85, AX.Q2_1 - AX.Q2_0, 56), M.acero, [(AX.Q2_0 + AX.Q2_1) / 2, 0, 0]));
    for (const x of [AX.Q2_0, AX.Q2_1]) g.add(mesh(washerX(2.05, 0.35, 0.2, 48), M.aceroPulido, [x, 0, 0]));
    g.add(mesh(cylY(0.22, 3.4, 16), M.acero, [AX.Q2_0 + 2, 3.5, 0]));          // entrada de argón
    g.add(mesh(cylY(0.4, 0.5, 6), M.aceroOscuro, [AX.Q2_0 + 2, 5.2, 0]));
  }
  {
    const g = makePart(A, 'celda_multipolo', L2([16, 0, 0], true, { info: 'celda_colision' }));
    multipole(g, AX.Q2_0 + 0.5, AX.Q2_1 - 0.5, 8, 0.8, 0.35, 0.13, M.aceroPulido, 1);
    for (const x of [AX.Q2_0 + 1.2, AX.Q2_1 - 1.2]) g.add(mesh(tubeX(1.6, 1.25, 0.5, 40), M.ceramica, [x, 0, 0]));
  }
  {
    const g = makePart(A, 'q3_prebarras', L2([18, 0, 0], false, { info: 'prebarras' }));
    quadShort(g, AX.Q3_0, AX.Q3P - 0.15);
  }
  {
    const g = makePart(A, 'q3', L2([20, 0, 0]));
    quad(g, AX.Q3P, AX.Q3_1, AX.R0, M.molibdeno);
    rfContacts(g, (AX.Q3P + AX.Q3_1) / 2);
  }

  /* ---------------- DETECTOR ---------------- */
  {
    const g = makePart(A, 'lente_salida', L2([21, 0, 0], false));
    g.add(mesh(washerX(1.6, 0.4, 0.15, 40), M.aceroPulido, [AX.Q3_1 + 0.8, 0, 0]));
  }
  {
    const g = makePart(A, 'dinodo_conversion', L2([24, 5, 0]));
    g.add(mesh(rbox(1.6, 0.25, 1.8, 0.06), M.aceroPulido, [AX.DYN.x, AX.DYN.y + 0.3, 0]));
    g.add(mesh(cylY(0.45, 2.2, 24), M.ceramica, [AX.DYN.x, AX.DYN.y + 1.6, 0]));
    g.add(mesh(cylY(0.6, 0.5, 24), M.acero, [AX.DYN.x, AX.DYN.y + 2.9, 0]));
    // cable de alta tensión hasta el pasamuros cerámico de la carcasa del detector (lo sigue al desmontar)
    cableFlex(g, [[AX.DYN.x, AX.DYN.y + 3.05, 0], [AX.DYN.x, AX.DYN.y + 3.9, 0], [AX.DYN.x + 1.2, AX.DYN.y + 4.3, 0],
      [AX.DYN.x + 2.5, AX.DYN.y + 3.6, 0, 'carcasa_detector'], [AX.DYN.x + 2.5, AX.DYN.y + 2.8, 0, 'carcasa_detector']], 0.12, M.ptfe, { seg: 32, radial: 8 });
  }
  {
    const g = makePart(A, 'multiplicador', L2([24, -5, 0]));
    const prof = []; for (let i = 0; i <= 18; i++) { const t = i / 18; prof.push(new THREE.Vector2(0.12 + 0.7 * (1 - t) ** 2, -2.4 * t)); }
    const hg = new THREE.LatheGeometry(prof, 36); // eje Y, boca hacia +y (hacia el dínodo)
    const mat = M.vidrioPlomo.clone(); mat.side = THREE.DoubleSide;
    g.add(mesh(hg, mat, [AX.EM.x, AX.EM.y + 0.6, 0]));
    g.add(mesh(rbox(1.8, 0.15, 1.8, 0.05), M.acero, [AX.EM.x, AX.EM.y - 1.9, 0]));
    g.add(mesh(rbox(1.2, 1.4, 1.2, 0.12), M.vidrioPlomo, [AX.EM.x, AX.EM.y - 2.7, 0]));
    for (const z of [-0.35, 0.35]) g.add(mesh(cylY(0.08, 1.4), M.cobre, [AX.EM.x, AX.EM.y - 4.0, z]));
  }
  {
    const g = makePart(A, 'carcasa_detector', L2([24, 0, 6], true, { shell: true }));
    const cx = AX.DYN.x, w = 5;
    g.add(mesh(rbox(w, 10.5, 0.15, 0.05), M.acero, [cx, -0.2, 3.4]));
    g.add(mesh(rbox(w, 10.5, 0.15, 0.05), M.acero, [cx, -0.2, -3.4]));
    g.add(mesh(rbox(0.15, 10.5, 6.8, 0.05), M.acero, [cx + w / 2, -0.2, 0]));
    g.add(mesh(cylY(0.3, 0.8, 16), M.ceramica, [cx + w / 2, 5.4, 0]));          // pasamuros del cable del dínodo
  }

  /* ---------------- SOPORTES ---------------- */
  {
    const g = makePart(A, 'soportes', L2([0, -6, 0], false));
    g.add(mesh(rbox(AX.Q3_1 - AX.Q1_0 + 6, 0.6, 3.2, 0.1), M.aluminio, [(AX.Q1_0 + AX.Q3_1) / 2, -2.9, 0]));
    for (const x of [AX.Q1P + 1, AX.Q1_1 - 1, AX.Q2_0 + 3, AX.Q2_1 - 3, AX.Q3P + 1, AX.Q3_1 - 1])
      g.add(mesh(rbox(1.0, 0.8, 2.8, 0.1), M.aluminio, [x, -2.35, 0]));
    screws(g, M.tornillo, M.tornilloNegro, 0.16, 'y', [[AX.Q1_0, -2.6, 1.2], [AX.Q2_0 + 5, -2.6, 1.2], [AX.Q3_1, -2.6, 1.2]]);
  }

  refs.group = A;
  return refs;
}

function quadShort(g, x0, x1) {
  const len = x1 - x0;
  for (let k = 0; k < 4; k++) {
    const geo = hypRod(AX.R0, 0.42, 0.55, len);
    geo.rotateX((k * Math.PI) / 2 + Math.PI / 4);
    g.add(mesh(geo, M.molibdeno, [x0, 0, 0]));
  }
  g.add(mesh(tubeX(2.3, 1.75, 0.6, 48), M.ceramica, [x0 + 0.5, 0, 0]));
}
function rfContacts(g, x) {
  for (let k = 0; k < 4; k++) {
    const a = (k * Math.PI) / 2 + Math.PI / 4;
    const r = AX.R0 + 1.0;
    g.add(mesh(box(0.8, 0.12, 0.5), M.oro, [x, Math.cos(a) * r, Math.sin(a) * r], [a, 0, 0]));
  }
}
