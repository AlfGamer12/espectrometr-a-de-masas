// Analizador del scimaX: fuente dual ESI/MALDI, capilar, embudo de dos etapas, multipolo, cuadrupolo analítico (CASI),
// celda de colisión (hexapolo), óptica de transferencia a través del bore del imán y celda ICR ParaCell con preamplificador.
// Coordenadas LOCALES (cm): eje iónico = +X.
import * as THREE from 'three';
import { M } from '../../materials.js';
import { mesh, rbox, box, washerX, cylX, cylY, cylZ, tubeX, latheX, tubePath, screws } from '../../geom.js';
import { makePart } from '../../parts.js';
import { AX, ORIGEN } from './geometria.js';

const L2 = (offset, label = true, extra = {}) =>
  ({ level: 2, offset, mode: 'analizador', label: label ? 'analizador' : null, ...extra });

function funnel(g, x0, x1, n, rA, rB, rOut) {
  for (let i = 0; i < n; i++) { const u = i / (n - 1);
    g.add(mesh(washerX(rOut, rA + (rB - rA) * u, 0.1, 40), i % 2 ? M.aceroPulido : M.acero, [x0 + (x1 - x0) * u, 0, 0])); }
  for (let k = 0; k < 3; k++) { const a = (k / 3) * Math.PI * 2 + 0.4;
    g.add(mesh(cylX(0.14, x1 - x0, 10), M.ceramica, [(x0 + x1) / 2, Math.cos(a) * (rOut - 0.25), Math.sin(a) * (rOut - 0.25)])); }
}
function rodSet(g, x0, x1, n, r0, rr, mat) {
  for (let k = 0; k < n; k++) { const a = (k / n) * Math.PI * 2 + Math.PI / n;
    g.add(mesh(cylX(rr, x1 - x0, 24), mat, [(x0 + x1) / 2, Math.cos(a) * (r0 + rr), Math.sin(a) * (r0 + rr)])); }
}

export function buildAnalizador(parent) {
  const refs = {};
  const A = makePart(parent, 'analizador', { level: 1, offset: [0, 0, 0], mode: 'analizador', label: 'equipo' });
  A.position.copy(ORIGEN);

  /* ---------------- FUENTE DUAL ESI/MALDI ---------------- */
  {
    const g = makePart(A, 'fuente_dual', L2([-10, 0, 0]));
    const p = AX.SPRAY;
    g.add(mesh(cylX(0.05, 3, 10), M.aceroPulido, [p.x - 1.2, 0, 0]));                 // aguja ESI
    g.add(mesh(cylX(0.5, 3.4, 24, 0.25), M.acero, [p.x - 4.4, 0, 0]));
    g.add(mesh(rbox(4, 4, 4, 0.5), M.negroBrillante, [p.x - 7.6, 0, 0]));
    const camMat = M.acero.clone(); camMat.transparent = true; camMat.opacity = 0.25; camMat.depthWrite = false;
    g.add(mesh(rbox(9, 9, 9, 0.6), camMat, [-2.5, 0, 0]));                             // cámara de pulverización
    // módulo MALDI: diana sobre mesa XY y entrada del láser
    g.add(mesh(rbox(1.0, 5.4, 3.6, 0.1), M.aceroPulido, [-0.5, -7.5, 0]));
    g.add(mesh(rbox(1.6, 7, 6, 0.3), M.anodizado, [-1.6, -7.5, 0]));
    g.add(mesh(cylY(0.5, 6, 20), M.aceroOscuro, [2.5, -9, 3]));
    g.add(mesh(cylX(0.35, 0.6, 16), M.peekRojo, [p.x - 9.9, 0, 0]));                 // tuerca PEEK de la línea de muestra
  }
  {
    const g = makePart(A, 'capilar', L2([-5, 3, 0]));
    const gl = M.vidrio.clone(); gl.opacity = 0.45;
    g.add(mesh(cylX(0.32, AX.CAP1 - AX.CAP0, 32), gl, [(AX.CAP0 + AX.CAP1) / 2, 0, 0]));
    g.add(mesh(cylX(0.08, AX.CAP1 - AX.CAP0, 12), M.aceroOscuro, [(AX.CAP0 + AX.CAP1) / 2, 0, 0]));
    for (const x of [AX.CAP0 + 0.3, AX.CAP1 - 0.3]) g.add(mesh(cylX(0.48, 0.6, 24), M.aceroPulido, [x, 0, 0]));
  }
  {
    const g = makePart(A, 'embudos', L2([0, 6, 0]));
    funnel(g, AX.F1_0, AX.F1_1, 26, 2.2, 0.5, 3.2);
    g.add(mesh(latheX([[0.15, 0], [0.22, 0], [1.6, -1.2], [2.4, -1.3], [2.4, -1.15], [1.6, -1.05], [0.15, 0.02]], 40), M.aceroPulido, [AX.F2_0 - 0.3, 0, 0]));
    funnel(g, AX.F2_0, AX.F2_1, 18, 1.2, 0.35, 2.2);
  }
  {
    const g = makePart(A, 'multipolo', L2([3, 0, 0]));
    rodSet(g, AX.MP_0, AX.MP_1, 6, 0.4, 0.15, M.aceroPulido);
    for (const x of [AX.MP_0 + 0.5, AX.MP_1 - 0.5]) g.add(mesh(tubeX(1.3, 0.95, 0.4, 40), M.ceramica, [x, 0, 0]));
  }
  {
    const g = makePart(A, 'cuadrupolo', L2([6, 0, 0]));
    rodSet(g, AX.Q_0, AX.Q_1, 4, 0.42, 0.475, M.molibdeno);
    for (const x of [AX.Q_0 + 1, AX.Q_1 - 1]) g.add(mesh(tubeX(2.2, 1.65, 0.8, 48), M.ceramica, [x, 0, 0]));
  }
  {
    const g = makePart(A, 'celda_colision', L2([9, 6, 0], true, { shell: true }));
    g.add(mesh(tubeX(1.6, 1.45, AX.C_1 - AX.C_0, 48), M.acero, [(AX.C_0 + AX.C_1) / 2, 0, 0]));
    for (const x of [AX.C_0, AX.C_1]) g.add(mesh(washerX(1.65, 0.3, 0.15, 40), M.aceroPulido, [x, 0, 0]));
    g.add(mesh(cylY(0.2, 3, 12), M.acero, [AX.C_0 + 2, 3, 0]));
  }
  {
    const g = makePart(A, 'hexapolo', L2([9, 0, 0], false, { info: 'celda_colision' }));
    rodSet(g, AX.C_0 + 0.5, AX.C_1 - 0.5, 6, 0.45, 0.16, M.aceroPulido);
  }

  /* ---------------- TRANSFERENCIA ---------------- */
  {
    const g = makePart(A, 'optica_transferencia', L2([0, -8, 0]));
    const n = 14;
    for (let i = 0; i < n; i++) {
      const x = AX.TR_0 + (AX.TR_1 - AX.TR_0) * (i / (n - 1));
      g.add(mesh(tubeX(1.0, 0.75, i % 3 === 0 ? 2.4 : 1.2, 40), M.aceroPulido, [x, 0, 0]));
    }
    for (let k = 0; k < 3; k++) { const a = (k / 3) * Math.PI * 2 + 0.3;
      g.add(mesh(cylX(0.1, AX.TR_1 - AX.TR_0, 10), M.ceramica, [(AX.TR_0 + AX.TR_1) / 2, Math.cos(a) * 1.15, Math.sin(a) * 1.15])); }
  }
  {
    const g = makePart(A, 'tubo_uhv', L2([0, 0, -12], true, { shell: true }));
    // atraviesa todo el bore y sale por el extremo del imán
    g.add(mesh(tubeX(AX.BORE_R - 1.2, AX.BORE_R - 1.6, AX.UHV_END - AX.TR_0, 64), M.acero, [(AX.TR_0 + AX.UHV_END) / 2, 0, 0]));
    for (const x of [AX.TR_0 + 1, AX.UHV_END - 1]) g.add(mesh(tubeX(AX.BORE_R + 0.5, AX.BORE_R - 1.6, 1.4, 64), M.aceroPulido, [x, 0, 0]));
  }

  /* ---------------- PARACELL ---------------- */
  {
    const g = makePart(A, 'paracell', L2([0, 9, 0]));
    const r = AX.CELL_R, x0 = AX.CELL_0, x1 = AX.CELL_1, a = (x1 - x0) / 2, xc = (x0 + x1) / 2;
    const N = 8, b = 0.22;
    // segmentos con bordes parabólicos: α = 2πn/N ± b(1 − (z/a)²)
    for (let n = 0; n < N; n++) {
      const pos = [], idx = [];
      const S = 24, T = 6;
      for (let i = 0; i <= S; i++) {
        const z = -a + (2 * a * i) / S, w = b * (1 - (z / a) ** 2);
        const a0 = (2 * Math.PI * n) / N - (Math.PI / N - 0.03) + w, a1 = (2 * Math.PI * n) / N + (Math.PI / N - 0.03) - w;
        for (let j = 0; j <= T; j++) { const t = a0 + (a1 - a0) * (j / T); pos.push(xc + z, Math.cos(t) * r, Math.sin(t) * r); }
      }
      for (let i = 0; i < S; i++) for (let j = 0; j < T; j++) { const p = i * (T + 1) + j; idx.push(p, p + 1, p + T + 1, p + 1, p + T + 2, p + T + 1); }
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeVertexNormals();
      const mat = (n % 4 === 0 ? M.oro : M.aceroPulido).clone(); mat.side = THREE.DoubleSide;
      if (n === 0) { mat.emissive = new THREE.Color(0x4a8cff); mat.emissiveIntensity = 0; }
      const m = mesh(geo, mat); g.add(m);
      if (n === 0) refs.exc = m;
    }
    // electrodos de atrapamiento casi esféricos con orificio de entrada
    for (const s of [-1, 1]) {
      const dome = new THREE.SphereGeometry(r * 1.05, 40, 20, 0, Math.PI * 2, 0, 0.62);
      dome.rotateZ(s > 0 ? -Math.PI / 2 : Math.PI / 2);
      const mm = M.aceroPulido.clone(); mm.side = THREE.DoubleSide;
      g.add(mesh(dome, mm, [xc - s * (a - r * 1.05 * Math.cos(0.62)) - s * 0.2, 0, 0]));
    }
    for (const x of [x0 - 0.4, x1 + 0.4]) g.add(mesh(tubeX(r + 0.4, r + 0.1, 0.4, 48), M.ceramica, [x, 0, 0]));
    for (let k = 0; k < 4; k++) { const ang = (k / 4) * Math.PI * 2 + Math.PI / 4;
      g.add(mesh(cylX(0.18, x1 - x0 + 1.4, 12), M.ceramica, [xc, Math.cos(ang) * (r + 0.3), Math.sin(ang) * (r + 0.3)])); }
  }
  {
    const g = makePart(A, 'preamplificador', L2([12, 0, 0]));
    const x = AX.UHV_END + 1.5;                                                              // fuera del imán, al final del tubo UHV
    g.add(mesh(cylX(AX.BORE_R + 1.2, 1.2, 64), M.aceroPulido, [x, 0, 0]));                 // brida del extremo
    g.add(mesh(rbox(6, 6, 6, 0.4), M.aluminio, [x + 3.6, 0, 0]));
    for (let i = 0; i < 4; i++) g.add(mesh(cylX(0.3, 2.4, 12), M.ceramica, [x + 0.6, -2 + i * 1.3, 2.6]));
    g.add(mesh(cylY(0.45, 1.0, 16), M.aceroPulido, [x + 3.6, -3.5, 0]));                   // conector de salida (cable a la electrónica)
  }

  refs.group = A;
  return refs;
}
