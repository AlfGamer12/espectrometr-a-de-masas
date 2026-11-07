// Analizador del Agilent 6546: fuente Dual AJS ESI (nebulizador Jet Stream + nebulizador de referencia), capilar dieléctrico,
// skimmer, octopolo, lentes, cuadrupolo, celda de colisión hexapolar, lente de enfoque, slicer, pulsador, tubo de vuelo con espejo
// de dos etapas y detector MCP + centelleador + fotomultiplicador. Coordenadas LOCALES (cm): eje iónico = +X; el TOF sube por +Y.
import * as THREE from 'three';
import { M } from '../../materials.js';
import { mesh, rbox, box, washerX, cylX, cylY, cylZ, tubeX, latheX, tubePath, screws } from '../../geom.js';
import { makePart } from '../../parts.js';
import { AX, ORIGEN } from './geometria.js';

const L2 = (offset, label = true, extra = {}) =>
  ({ level: 2, offset, mode: 'analizador', label: label ? 'analizador' : null, ...extra });
function rodSet(g, x0, x1, n, r0, rr, mat, phase = Math.PI / 4) {
  for (let k = 0; k < n; k++) { const a = (k / n) * Math.PI * 2 + phase;
    g.add(mesh(cylX(rr, x1 - x0, 24), mat, [(x0 + x1) / 2, Math.cos(a) * (r0 + rr), Math.sin(a) * (r0 + rr)])); }
}

export function buildAnalizador(parent) {
  const refs = {};
  const A = makePart(parent, 'analizador', { level: 1, offset: [0, 0, 0], mode: 'analizador', label: 'equipo' });
  A.position.copy(ORIGEN);

  /* ---------------- FUENTE DUAL AJS ---------------- */
  {
    const g = makePart(A, 'nebulizador_ajs', L2([-6, 10, 0]));
    const p = AX.SPRAY;
    g.add(mesh(cylY(0.9, 12, 32), M.acero, [p.x, p.y + 7.4, 0]));                      // cuerpo del nebulizador
    g.add(mesh(cylY(1.6, 2.2, 32), M.aceroPulido, [p.x, p.y + 2.2, 0]));              // boquilla del gas envolvente (sheath gas)
    g.add(mesh(cylY(0.35, 1.1, 20, 0.6), M.aceroPulido, [p.x, p.y + 0.6, 0]));        // punta del nebulizador
    g.add(mesh(rbox(3.4, 2.4, 3.4, 0.4), M.negroBrillante, [p.x, p.y + 14.4, 0]));
    // entrada de muestra (PEEK) y de gas, cada una terminada en su unión
    g.add(mesh(tubePath([[p.x, p.y + 15.6, 0], [p.x - 0.6, p.y + 17.2, 0.5], [p.x - 1.8, p.y + 18.25, 1.3], [p.x - 2.45, p.y + 18.4, 1.5]], 0.08, 24, 6), M.peekRojo));
    g.add(mesh(cylX(0.3, 0.9, 16), M.peekBeige, [p.x - 2.85, p.y + 18.4, 1.5]));
    g.add(mesh(tubePath([[p.x + 1.4, p.y + 15, 0.8], [p.x + 3, p.y + 17, 1.6], [p.x + 4.65, p.y + 18, 2.5]], 0.16, 20, 6), M.ptfe));
    g.add(mesh(cylX(0.35, 1.0, 16), M.aceroPulido, [p.x + 5.1, p.y + 18, 2.5]));
    const sprayMat = M.haz.clone(); sprayMat.color.setHex(0x8fd3ff);
    const spray = mesh(new THREE.ConeGeometry(1.1, 3.0, 24, 1, true), sprayMat, [p.x, p.y - 1.4, 0]);
    spray.userData.noClone = true; spray.castShadow = false; spray.raycast = () => {};
    g.add(spray); refs.spray = spray;
  }
  {
    const g = makePart(A, 'nebulizador_referencia', L2([-6, 8, 6]));
    const p = AX.SPRAY;
    g.add(mesh(cylY(0.5, 7, 24), M.acero, [p.x + 0.4, p.y + 5, 3.6], [0.35, 0, 0]));
    g.add(mesh(cylY(0.22, 1.2, 16, 0.4), M.aceroPulido, [p.x + 0.4, p.y + 1.0, 2.6], [0.35, 0, 0]));
    const a = 3.9;                                                                     // racor superior (llega la línea del CDS)
    g.add(mesh(cylY(0.55, 0.8, 16), M.aceroPulido, [p.x + 0.4, p.y + 5 + a * Math.cos(0.35), 3.6 + a * Math.sin(0.35)], [0.35, 0, 0]));
  }
  {
    const g = makePart(A, 'camara_spray', L2([-6, 0, 0], false, { shell: true }));
    const gl = M.vidrio.clone(); gl.opacity = 0.22;
    g.add(mesh(cylZ(7, 12, 48), gl, [-3, 2, 0]));                                      // cámara de pulverización con ventana
    g.add(mesh(washerX(3.2, 0.5, 0.25, 48), M.aceroPulido, [-0.6, 0, 0]));            // escudo de spray (spray shield)
    g.add(mesh(cylX(0.9, 1.2, 32), M.aceroPulido, [-0.2, 0, 0]));                     // capuchón del capilar
  }
  {
    const g = makePart(A, 'capilar', L2([-3, 4, 0]));
    const gl = M.vidrio.clone(); gl.opacity = 0.5;
    g.add(mesh(cylX(0.38, AX.CAP1 - AX.CAP0, 32), gl, [(AX.CAP0 + AX.CAP1) / 2, 0, 0]));
    g.add(mesh(cylX(0.09, AX.CAP1 - AX.CAP0, 12), M.aceroOscuro, [(AX.CAP0 + AX.CAP1) / 2, 0, 0]));
    for (const x of [AX.CAP0 + 0.3, AX.CAP1 - 0.3]) g.add(mesh(cylX(0.5, 0.6, 24), M.aceroPulido, [x, 0, 0]));
    g.add(mesh(rbox(1.6, 3.2, 3.2, 0.3), M.anodizado, [AX.CAP0 + 4, 0, 0]));          // válvula VacShield
  }
  {
    const g = makePart(A, 'skimmer', L2([1, 0, 0]));
    g.add(mesh(latheX([[0.12, 0], [0.2, 0], [1.4, -1.0], [2.4, -1.1], [2.4, -0.95], [1.4, -0.85], [0.12, 0.02]], 40), M.aceroPulido, [AX.SKIM, 0, 0]));
    g.add(mesh(washerX(3, 2.5, 0.25, 48), M.acero, [AX.SKIM - 1.05, 0, 0]));
  }

  /* ---------------- ÓPTICA, CUADRUPOLO Y CELDA ---------------- */
  {
    const g = makePart(A, 'octopolo', L2([3, 5, 0]));
    rodSet(g, AX.OCT_0, AX.OCT_1, 8, 0.4, 0.13, M.aceroPulido, Math.PI / 8);
    for (const x of [AX.OCT_0 + 0.6, AX.OCT_1 - 0.6]) g.add(mesh(tubeX(1.1, 0.75, 0.6, 40), M.ceramica, [x, 0, 0]));
    for (const x of AX.LENS) g.add(mesh(washerX(1.6, x === AX.LENS[1] ? 0.45 : 0.3, 0.15, 40), M.aceroPulido, [x, 0, 0]));
  }
  {
    const g = makePart(A, 'cuadrupolo', L2([6, 0, 0]));
    rodSet(g, AX.Q_0 + 1.6, AX.Q_1, 4, AX.R0, 0.5, M.molibdeno);
    rodSet(g, AX.Q_0, AX.Q_0 + 1.4, 4, AX.R0, 0.5, M.molibdeno);                    // prefiltro
    for (const x of [AX.Q_0 + 2.6, AX.Q_1 - 1]) g.add(mesh(tubeX(2.3, 1.7, 0.9, 48), M.ceramica, [x, 0, 0]));
  }
  {
    const g = makePart(A, 'celda_colision', L2([9, 6, 0], true, { shell: true }));
    g.add(mesh(tubeX(1.6, 1.45, AX.C_1 - AX.C_0, 48), M.acero, [(AX.C_0 + AX.C_1) / 2, 0, 0]));
    for (const x of [AX.C_0, AX.C_1]) g.add(mesh(washerX(1.65, 0.3, 0.15, 40), M.aceroPulido, [x, 0, 0]));
    g.add(mesh(cylY(0.2, 3, 12), M.acero, [AX.C_0 + 2, 3, 0]));                      // entrada de N₂
  }
  {
    const g = makePart(A, 'hexapolo', L2([9, 0, 0], false, { info: 'celda_colision' }));
    const mat = M.ceramica.clone(); mat.color.setHex(0x3c3f44);                        // varillas con recubrimiento resistivo
    rodSet(g, AX.C_0 + 0.6, AX.C_1 - 0.6, 6, 0.5, 0.17, mat, 0);
  }
  {
    const g = makePart(A, 'lente_enfoque', L2([12, 0, 0]));
    g.add(mesh(washerX(1.4, 0.3, 0.15, 40), M.aceroPulido, [AX.FOC_0, 0, 0]));
    rodSet(g, AX.FOC_0 + 1.2, AX.FOC_1, 4, 0.35, 0.18, M.aceroPulido);
  }
  {
    const g = makePart(A, 'slicer', L2([14, 0, 0]));
    for (let i = 0; i < 5; i++) for (const s of [1, -1]) g.add(mesh(box(0.12, 1.0, 2.4), M.aceroPulido, [AX.SL_0 + i * 0.6, s * 0.7, 0]));
    g.add(mesh(rbox(3.0, 0.2, 2.8, 0.05), M.ceramica, [(AX.SL_0 + AX.SL_1) / 2, 1.4, 0]));
  }

  /* ---------------- TOF ---------------- */
  {
    const g = makePart(A, 'pulsador', L2([18, -6, 0]));
    const p = AX.PUSH;
    for (let i = 0; i < 7; i++) g.add(mesh(rbox(5.4, 0.12, 3.4, 0.03), i ? M.aceroPulido : M.acero, [p.x + 0.5, p.y - 0.9 + i * 0.55, 0]));
    for (const x of [p.x - 2, p.x + 3]) g.add(mesh(box(0.25, 3.8, 0.25), M.ceramica, [x, p.y + 0.6, 1.5]));
  }
  {
    const g = makePart(A, 'tubo_vuelo', L2([0, 0, -14], true, { shell: true }));
    const cx = (AX.TOF_X0 + AX.TOF_X1) / 2, cy = (AX.TOF_Y0 + AX.TOF_Y1) / 2;
    const w = AX.TOF_X1 - AX.TOF_X0, hh = AX.TOF_Y1 - AX.TOF_Y0;
    for (const z of [4.4, -4.4]) g.add(mesh(rbox(w, hh, 0.4, 0.15), M.acero, [cx, cy, z]));
    for (const x of [AX.TOF_X0, AX.TOF_X1]) g.add(mesh(rbox(0.4, hh, 9.2, 0.15), M.acero, [x, cy, 0]));
    g.add(mesh(rbox(w + 0.4, 0.4, 9.2, 0.15), M.acero, [cx, AX.TOF_Y1, 0]));
    for (const y of [AX.TOF_Y0 + 25, AX.TOF_Y0 + 60, AX.TOF_Y0 + 95]) g.add(mesh(rbox(w + 1.4, 1.0, 10.2, 0.3), M.aceroPulido, [cx, y, 0]));
  }
  {
    const g = makePart(A, 'espejo_iones', L2([0, 12, 0]));
    const cx = (AX.TOF_X0 + AX.TOF_X1) / 2, w = AX.TOF_X1 - AX.TOF_X0 - 2;
    for (let i = 0; i < 20; i++) {
      const y = AX.MIR0 + (AX.MIR1 - AX.MIR0) * (i / 19);
      const s = new THREE.Shape(); s.moveTo(-w / 2, -3.6); s.lineTo(w / 2, -3.6); s.lineTo(w / 2, 3.6); s.lineTo(-w / 2, 3.6);
      const hl = new THREE.Path(); hl.moveTo(-w / 2 + 0.8, -2.8); hl.lineTo(-w / 2 + 0.8, 2.8); hl.lineTo(w / 2 - 0.8, 2.8); hl.lineTo(w / 2 - 0.8, -2.8); s.holes.push(hl);
      const geo = new THREE.ExtrudeGeometry(s, { depth: 0.1, bevelEnabled: false }); geo.rotateX(Math.PI / 2);
      g.add(mesh(geo, i < 6 ? M.aceroPulido : M.acero, [cx, y, 0]));
    }
    for (const [x, z] of [[-w / 2 + 0.4, -3.2], [w / 2 - 0.4, -3.2], [-w / 2 + 0.4, 3.2], [w / 2 - 0.4, 3.2]]) g.add(mesh(cylY(0.15, AX.MIR1 - AX.MIR0, 10), M.ceramica, [cx + x, (AX.MIR0 + AX.MIR1) / 2, z]));
  }
  {
    const g = makePart(A, 'detector', L2([6, -8, 0]));
    const p = AX.DET;
    g.add(mesh(cylY(1.7, 0.1, 40), M.vidrioPlomo, [p.x, p.y + 0.3, 0]));            // MCP
    g.add(mesh(cylY(1.5, 0.3, 40), M.vidrio, [p.x, p.y - 0.1, 0]));                   // centelleador
    g.add(mesh(cylY(1.2, 4.5, 32), M.aceroOscuro, [p.x, p.y - 2.6, 0]));             // fotomultiplicador
    g.add(mesh(cylY(1.35, 0.4, 32), M.aceroPulido, [p.x, p.y - 4.9, 0]));
    // cable de señal del PMT hasta su conector (el pasamuros está en la pared trasera de la carcasa)
    g.add(mesh(tubePath([[p.x, p.y - 5.1, 0], [p.x + 0.2, p.y - 6.3, -0.8], [p.x + 0.4, p.y - 6.8, -2.6], [p.x + 0.4, p.y - 6.8, -3.4]], 0.15, 24, 8), M.cable));
    g.add(mesh(cylZ(0.4, 1.0, 16), M.aceroPulido, [p.x + 0.4, p.y - 6.8, -3.9]));
  }

  refs.group = A;
  return refs;
}
