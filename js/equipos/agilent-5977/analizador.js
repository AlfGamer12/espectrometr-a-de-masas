// Conjunto analizador: fuente de iones EI + filtro cuadrupolar hiperbólico + detector de triple eje.
// Coordenadas LOCALES del analizador (cm): el eje iónico es +X.
//   x 0–4.2  fuente de iones | x 4.4–24.4 cuadrupolo | x 25–32 detector
//   +z local apunta hacia la placa lateral; -z local hacia la interfaz del GC.
import * as THREE from 'three';
import { M } from '../../materials.js';
import { mesh, rbox, box, washerX, cylX, cylY, cylZ, tubeX, helix, tubePath, screws } from '../../geom.js';
import { makePart, cableFlex } from '../../parts.js';

export const AX = {
  SRC_X: 1.4, Q0: 4.4, Q1: 24.4, R0: 0.45,
  HED: new THREE.Vector3(28.4, 0, 2.12),
  EM: new THREE.Vector3(28.4, 0, -1.55),
};

const L2 = (offset, label = true, extra = {}) =>
  ({ level: 2, offset, mode: 'analizador', label: label ? 'analizador' : null, ...extra });

export function buildAnalizador(parent) {
  const refs = {};
  // El grupo analizador cuelga de la placa lateral (sale con ella al abrirla).
  const A = makePart(parent, 'analizador', { level: 1, offset: [0, 0, 0], mode: 'analizador', label: 'equipo' });
  A.position.set(-1, 28, 14);
  A.rotation.y = Math.PI / 2; // +X local -> -Z mundo (de delante hacia atrás)

  /* ---------------- FUENTE DE IONES ---------------- */
  // Repulsor
  {
    const g = makePart(A, 'repulsor', L2([-5, 0, 0]));
    g.add(mesh(washerX(0.5, 0, 0.12), M.aceroPulido, [0.62, 0, 0]));
    g.add(mesh(cylX(0.08, 1.5), M.acero, [-0.05, 0, 0]));
    g.add(mesh(washerX(0.36, 0.09, 0.3), M.ceramica, [0.05, 0, 0]));
    g.add(mesh(cylX(0.22, 0.16, 6), M.aceroOscuro, [-0.65, 0, 0]));
  }
  // Cuerpo de la fuente (cámara de ionización)
  {
    const g = makePart(A, 'cuerpo_fuente', L2([0, 0, 0]));
    g.add(mesh(tubeX(1.5, 0.62, 2.0), M.acero, [1.4, 0, 0]));
    g.add(mesh(washerX(1.7, 0.2, 0.16), M.acero, [0.32, 0, 0]));
    // ventanas de los filamentos (±y) y puerto de la columna (-z)
    for (const s of [1, -1]) {
      g.add(mesh(cylY(0.34, 0.06), M.plasticoNegro, [1.4, s * 1.5, 0]));
      g.add(mesh(rbox(1.0, 0.12, 1.0, 0.04), M.acero, [1.4, s * 1.52, 0]));
    }
    g.add(mesh(cylZ(0.42, 0.5), M.acero, [1.4, 0, -1.6]));
    g.add(mesh(cylZ(0.12, 0.52), M.plasticoNegro, [1.4, 0, -1.62]));
    // tornillos del flange trasero
    for (let i = 0; i < 4; i++) {
      const a = Math.PI / 4 + (i * Math.PI) / 2;
      g.add(mesh(cylX(0.12, 0.12, 12), M.aceroOscuro, [0.2, Math.cos(a) * 1.35, Math.sin(a) * 1.35]));
    }
  }
  // Filamentos 1 (arriba) y 2 (abajo)
  for (const [id, s] of [['filamento1', 1], ['filamento2', -1]]) {
    const g = makePart(A, id, L2([0, s * 4, 0], id === 'filamento1', { info: 'filamento' }));
    g.add(mesh(rbox(1.4, 0.26, 1.25, 0.06), M.ceramica, [1.4, s * 2.2, 0]));
    for (const z of [-0.36, 0.36]) g.add(mesh(cylY(0.05, 0.42), M.acero, [1.4, s * 1.98, z]));
    const coil = mesh(helix(0.06, 0.6, 9, 0.018), M.tungsteno, [1.4, s * 1.8, 0]);
    g.add(coil);
    refs[id] = coil;
    // pinzas de conexión
    for (const z of [-0.45, 0.45]) {
      g.add(mesh(box(0.2, 0.1, 0.2), M.cobre, [1.4, s * 2.38, z]));
      g.add(mesh(tubePath([[1.4, s * 2.42, z], [1.9, s * 2.7, z * 1.4], [2.6, s * 2.9, z * 1.6 + 1.2]], 0.025, 20, 6), M.cobre));
      for (let i = 0; i < 3; i++) g.add(mesh(cylX(0.06, 0.16, 10), M.ceramica, [1.95 + i * 0.22, s * (2.72 + i * 0.06), z * 1.45 + i * 0.35]));
    }
  }
  // Imanes de la fuente
  for (const [id, s] of [['iman1', 1], ['iman2', -1]]) {
    const g = makePart(A, id, L2([0, s * 7, 0], id === 'iman1', { info: 'imanes' }));
    g.add(mesh(cylY(0.55, 0.45), M.iman, [1.4, s * 2.85, 0]));
    g.add(mesh(cylY(0.62, 0.12), M.acero, [1.4, s * 3.12, 0]));
  }
  // Bloque calefactor + sensor
  {
    const g = makePart(A, 'calefactor_fuente', L2([0, 0, 5]));
    g.add(mesh(rbox(1.9, 1.4, 0.7, 0.08), M.acero, [1.4, 0, 2.0]));
    for (const y of [-0.35, 0.35]) {
      g.add(mesh(cylX(0.15, 2.3), M.aceroOscuro, [1.55, y, 2.0]));
      g.add(mesh(cylX(0.03, 1.2), M.cobre, [3.1, y, 2.0]));
    }
    g.add(mesh(cylZ(0.1, 0.9), M.aceroPulido, [0.75, 0.0, 2.6]));
    g.add(mesh(cylZ(0.03, 1.0), M.cobre, [0.75, 0.0, 3.4]));
  }
  // Placa + cilindro extractor (drawout)
  {
    const g = makePart(A, 'extractor', L2([2, 0, 0]));
    g.add(mesh(washerX(1.5, 0.22, 0.12), M.aceroPulido, [2.55, 0, 0]));
    g.add(mesh(tubeX(0.62, 0.5, 0.6), M.acero, [2.92, 0, 0]));
  }
  // Aislante 1
  {
    const g = makePart(A, 'aislante1', L2([3.25, 0, 0], false, { info: 'aislantes' }));
    g.add(mesh(washerX(1.3, 0.85, 0.16), M.ceramica, [3.3, 0, 0]));
  }
  // Lente de enfoque iónico
  {
    const g = makePart(A, 'lente_enfoque', L2([4.5, 0, 0]));
    g.add(mesh(washerX(1.35, 0.28, 0.14), M.aceroPulido, [3.5, 0, 0]));
    g.add(mesh(box(0.14, 0.7, 0.3), M.acero, [3.5, 1.6, 0]));
  }
  // Aislante 2
  {
    const g = makePart(A, 'aislante2', L2([5.25, 0, 0], false, { info: 'aislantes' }));
    g.add(mesh(washerX(1.3, 0.85, 0.16), M.ceramica, [3.7, 0, 0]));
  }
  // Lente de entrada
  {
    const g = makePart(A, 'lente_entrada', L2([6, 0, 0]));
    g.add(mesh(washerX(1.2, 0.25, 0.14), M.aceroPulido, [3.9, 0, 0]));
    g.add(mesh(tubeX(0.4, 0.28, 0.42), M.acero, [4.15, 0, 0]));
    g.add(mesh(box(0.14, 0.7, 0.3), M.acero, [3.9, -1.45, 0]));
  }
  // Extremo de la columna dentro de la fuente (sólo visible en modo analizador)
  {
    const g = makePart(A, 'columna_extremo', L2([0, 0, -4], true, { info: 'columna', onlyAnalyzer: true }));
    g.add(mesh(cylZ(0.3, 3.0), M.acero, [1.4, 0, -6.2]));
    g.add(mesh(cylZ(0.06, 4.0), M.poliimida, [1.4, 0, -2.75]));
    g.add(mesh(cylZ(0.55, 0.5, 6), M.aceroOscuro, [1.4, 0, -4.6]));
  }

  /* ---------------- CUADRUPOLO ---------------- */
  {
    const g = makePart(A, 'cuadrupolo', L2([4, 0, 0]));
    const len = AX.Q1 - AX.Q0, r0 = AX.R0, s = 0.85;
    const hyp = (v) => Math.sqrt(r0 * r0 + v * v);
    // Cuerpo monolítico de cuarzo con 4 lóbulos hiperbólicos
    const outer = new THREE.Shape();
    outer.absarc(0, 0, 1.55, 0, Math.PI * 2, false);
    const pts = [];
    const N = 16;
    for (let k = 0; k < 4; k++) {
      const rot = (k * Math.PI) / 2, c = Math.cos(rot), sn = Math.sin(rot);
      for (let i = 0; i <= N; i++) {
        const v = -s + (2 * s * i) / N, u = hyp(v);
        pts.push(new THREE.Vector2(u * c - v * sn, u * sn + v * c));
      }
      const a = rot + Math.PI / 4; // ranura entre electrodos
      pts.push(new THREE.Vector2(Math.cos(a) * 1.25, Math.sin(a) * 1.25));
    }
    const hole = new THREE.Path(pts.reverse());
    outer.holes.push(hole);
    const qg = new THREE.ExtrudeGeometry(outer, { depth: len, bevelEnabled: false, curveSegments: 48 });
    qg.rotateY(Math.PI / 2);
    g.add(mesh(qg, M.cuarzo, [AX.Q0, 0, 0]));
    // Electrodos de oro depositados sobre las superficies hiperbólicas
    for (let k = 0; k < 4; k++) {
      const sh = new THREE.Shape();
      const inner = [], outerC = [];
      for (let i = 0; i <= N; i++) {
        const v = -s + (2 * s * i) / N;
        inner.push([hyp(v) - 0.012, v]);
        outerC.push([hyp(v) + 0.04, v]);
      }
      sh.moveTo(...inner[0]);
      inner.forEach((p) => sh.lineTo(...p));
      outerC.reverse().forEach((p) => sh.lineTo(...p));
      const eg = new THREE.ExtrudeGeometry(sh, { depth: len - 0.2, bevelEnabled: false });
      eg.rotateZ((k * Math.PI) / 2);
      eg.rotateY(Math.PI / 2);
      g.add(mesh(eg, M.oro, [AX.Q0 + 0.1, 0, 0]));
    }
    // Contactos de RF/DC (oro) en el exterior
    for (let k = 0; k < 4; k++) {
      const a = (k * Math.PI) / 2;
      g.add(mesh(box(0.8, 0.35, 0.12), M.oro, [AX.Q0 + 10, Math.sin(a) * 1.57, Math.cos(a) * 1.57], [-a, 0, 0]));
    }
    // anillos de sujeción en los extremos
    for (const x of [AX.Q0 + 0.6, AX.Q1 - 0.6]) g.add(mesh(tubeX(1.68, 1.54, 0.5), M.acero, [x, 0, 0]));
  }
  // Radiador / calefactor del cuadrupolo (dos medias carcasas)
  for (const [id, up] of [['radiador_sup', true], ['radiador_inf', false]]) {
    const g = makePart(A, id, L2([0, up ? 5 : -5, 0], up, { info: 'radiador', shell: true }));
    const len = 18.6, x0 = AX.Q0 + 0.7;
    const prof = [[1.78, 0], [2.2, 0], [2.2, len], [1.78, len], [1.78, 0]].map(([r, y]) => new THREE.Vector2(r, y));
    const lg = new THREE.LatheGeometry(prof, 32, up ? Math.PI : 0, Math.PI);
    lg.rotateZ(-Math.PI / 2);
    const mat = M.anodizado.clone(); mat.side = THREE.DoubleSide;
    g.add(mesh(lg, mat, [x0, 0, 0]));
    // aletas de disipación
    for (let i = 0; i < 9; i++) {
      const fg = new THREE.LatheGeometry([[2.2, 0], [2.55, 0], [2.55, 0.18], [2.2, 0.18], [2.2, 0]].map(([r, y]) => new THREE.Vector2(r, y)),
        32, up ? Math.PI : 0, Math.PI);
      fg.rotateZ(-Math.PI / 2);
      g.add(mesh(fg, mat, [x0 + 1.2 + i * 2.0, 0, 0]));
    }
    for (const x of [x0 + 0.4, x0 + len - 0.4]) for (const z of [-2.0, 2.0])
      screws(g, M.tornillo, M.tornilloNegro, 0.14, up ? 'y' : '-y', [[x, up ? 0.9 : -0.9, z]]);
    if (up) { // resistencia calefactora y sensor
      g.add(mesh(box(14, 0.12, 0.6), M.cobre, [AX.Q0 + 10, 2.25, 0]));
      g.add(mesh(cylY(0.12, 0.6), M.aceroPulido, [AX.Q0 + 3, 2.5, 0.6]));
    }
  }

  /* ---------------- DETECTOR ---------------- */
  {
    const g = makePart(A, 'lente_detector', L2([3, 0, 0]));
    g.add(mesh(washerX(1.2, 0.35, 0.12), M.aceroPulido, [25.0, 0, 0]));
    g.add(mesh(box(0.12, 0.6, 0.3), M.acero, [25.0, 1.4, 0]));
  }
  {
    // la carcasa se retira deslizando hacia +x (lado abierto hacia el cuadrupolo): no atraviesa el HED ni el multiplicador.
    // Las paredes ±z llevan una ranura abierta hacia x0 por la que pasan el pasamuros del HED y los hilos del multiplicador.
    const g = makePart(A, 'carcasa_detector', L2([18, 0, 0], true, { shell: true }));
    const x0 = 25.6, x1 = 31.6, cx = (x0 + x1) / 2, w = x1 - x0, zA = 4.95, zB = -5.7, D = zA - zB + 0.12, zc = (zA + zB) / 2;
    g.add(mesh(rbox(w, 0.12, D, 0.04), M.acero, [cx, 1.95, zc]));
    g.add(mesh(rbox(w, 0.12, D, 0.04), M.acero, [cx, -1.95, zc]));
    g.add(mesh(rbox(0.12, 3.9, D, 0.04), M.acero, [x1, 0, zc]));
    const pared = (z, h) => {                 // pared con ranura de semialtura h desde x0 hasta xr
      const xr = AX.EM.x + 0.25, hy = (1.95 - h) / 2;
      for (const s of [1, -1]) g.add(mesh(box(w, 1.95 - h, 0.12), M.acero, [cx, s * (h + hy), z]));
      g.add(mesh(box(x1 - xr, 2 * h, 0.12), M.acero, [(xr + x1) / 2, 0, z]));
    };
    pared(zA, 0.22); pared(zB, 0.55);
    // regletas cerámicas de conexión (exterior de las paredes)
    g.add(mesh(rbox(0.8, 1.6, 0.5, 0.08), M.ceramica, [26.6, 0, zA + 0.31]));
    g.add(mesh(rbox(0.8, 1.8, 0.5, 0.08), M.ceramica, [26.6, 0, zB - 0.31]));
    screws(g, M.tornillo, M.tornilloNegro, 0.12, 'y', [[x0 + 0.4, 2.0, 4.5], [x1 - 0.4, 2.0, 4.5], [x0 + 0.4, 2.0, -5.25], [x1 - 0.4, 2.0, -5.25]]);
  }
  {
    const g = makePart(A, 'hed', L2([9, 0, 0]));
    g.add(mesh(cylZ(0.75, 0.15), M.aceroPulido, [AX.HED.x, 0, AX.HED.z + 0.08]));
    g.add(mesh(cylZ(0.35, 2.0), M.ceramica, [AX.HED.x, 0, AX.HED.z + 1.15]));
    g.add(mesh(cylZ(0.5, 0.35), M.acero, [AX.HED.x, 0, AX.HED.z + 2.3]));
    g.add(mesh(cylZ(0.12, 1.0), M.cobre, [AX.HED.x, 0, AX.HED.z + 2.9]));
    // hilo de alta tensión: sale por la ranura y acaba en la regleta exterior
    const z = AX.HED.z;
    cableFlex(g, [[AX.HED.x, 0, z + 3.2], [AX.HED.x, 0.05, z + 3.65], [AX.HED.x - 0.5, 0.3, z + 3.95, 'carcasa_detector'],
      [27.3, 0.45, z + 3.9, 'carcasa_detector'], [26.85, 0.45, z + 3.45, 'carcasa_detector']], 0.1, M.ptfe, { seg: 32, radial: 8 });
  }
  {
    const g = makePart(A, 'multiplicador', L2([9, 0, 0]));
    const prof = [];
    for (let i = 0; i <= 20; i++) {
      const t = i / 20;
      prof.push(new THREE.Vector2(0.14 + 0.78 * (1 - t) ** 2.2, -2.6 * t));
    }
    const hg = new THREE.LatheGeometry(prof, 40);
    hg.rotateX(Math.PI / 2); // eje Y -> Z, boca mirando a +z
    const mat = M.vidrioPlomo.clone(); mat.side = THREE.DoubleSide;
    g.add(mesh(hg, mat, [AX.EM.x, 0, AX.EM.z]));
    g.add(mesh(rbox(1.3, 1.3, 1.4, 0.12), M.vidrioPlomo, [AX.EM.x, 0, AX.EM.z - 3.2]));
    g.add(mesh(rbox(1.9, 1.9, 0.15, 0.05), M.acero, [AX.EM.x, 0, AX.EM.z - 2.4]));
    g.add(mesh(cylZ(0.1, 1.0), M.cobre, [AX.EM.x, 0.4, AX.EM.z - 4.3]));
    g.add(mesh(cylZ(0.1, 1.0), M.cobre, [AX.EM.x, -0.4, AX.EM.z - 4.3]));
    // hilos: salen por la ranura de la pared −z de la carcasa y acaban en la regleta exterior
    for (const y of [0.4, -0.4]) cableFlex(g, [[AX.EM.x, y, -5.2], [AX.EM.x, y, -5.55], [AX.EM.x, y, -5.95, 'carcasa_detector'],
      [AX.EM.x - 0.4, y * 1.1, -6.3, 'carcasa_detector'], [27.3, y * 1.2, -6.35, 'carcasa_detector'], [26.9, y * 1.2, -6.05, 'carcasa_detector']], 0.07, M.ptfe, { seg: 32, radial: 8 });
  }

  /* ---------------- SOPORTES ---------------- */
  {
    const g = makePart(A, 'soportes', L2([0, 0, 4], false));
    g.add(mesh(rbox(1.6, 0.5, 5.4, 0.08), M.aluminio, [1.4, -1.25, 5.0]));
    for (const x of [7.5, 21.5]) g.add(mesh(rbox(0.9, 0.6, 5.6, 0.08), M.aluminio, [x, -1.3, 5.1]));
    g.add(mesh(rbox(1.2, 0.6, 2.6, 0.08), M.aluminio, [28.4, -1.3, 6.4]));
    g.add(mesh(rbox(31, 0.7, 0.7, 0.1), M.aluminio, [15.3, -1.3, 7.6]));
    screws(g, M.tornillo, M.tornilloNegro, 0.13, 'y', [[1.4, -1.0, 6.8], [7.5, -1.0, 7.0], [21.5, -1.0, 7.0], [28.4, -1.0, 7.2]]);
  }

  /* ---------------- Haz de electrones (efecto de simulación) ---------------- */
  const beam = mesh(cylY(0.06, 3.5), M.haz, [AX.SRC_X, 0, 0]);
  beam.userData.noClone = true; beam.castShadow = false;
  beam.raycast = () => {};
  A.add(beam);
  refs.beam = beam;
  refs.group = A;
  return refs;
}
