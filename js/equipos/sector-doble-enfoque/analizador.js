// Analizador de doble enfoque (geometría Nier–Johnson inversa, BE): fuente EI con lentes y rendija de entrada, imán laminado en H
// de 65° y r = 350 mm, rendija intermedia, analizador electrostático toroidal, rendija de salida y detector con dínodo de conversión.
// Coordenadas LOCALES (cm) en el plano X–Z (ver geometria.js); el entrehierro del imán es la dirección Y.
import * as THREE from 'three';
import { M } from '../../materials.js';
import { mesh, rbox, box, washerX, cylX, cylY, cylZ, tubeX, tubePath, screws, textTexture } from '../../geom.js';
import { makePart } from '../../parts.js';
import { AX, ORIGEN } from './geometria.js';

/** Puntos locales donde entran los cables del equipo: borne de las bobinas y pasamuros de alta tensión de la fuente. */
const AB = (AX.AM0 + AX.AM1) / 2, RB = AX.RM + 7.5 + 6 + 1.35;
export const BORNE_IMAN = new THREE.Vector3(AX.CM.x + Math.cos(AB) * RB, 3.9, AX.CM.z + Math.sin(AB) * RB);
export const PASO_AT = new THREE.Vector3(-6.5, 3.2, 0);

const L2 = (offset, label = true, extra = {}) =>
  ({ level: 2, offset, mode: 'analizador', label: label ? 'analizador' : null, ...extra });

/** Losa con forma de sector anular (centro c, radios r0–r1, ángulos a0–a1) de espesor h, con su cara superior en y = y0. */
function sectorSlab(c, r0, r1, a0, a1, h, y0, seg = 48) {
  const s = new THREE.Shape();
  for (let i = 0; i <= seg; i++) { const a = a0 + (a1 - a0) * (i / seg); const p = [c.x + Math.cos(a) * r1, c.z + Math.sin(a) * r1]; i ? s.lineTo(...p) : s.moveTo(...p); }
  for (let i = seg; i >= 0; i--) { const a = a0 + (a1 - a0) * (i / seg); s.lineTo(c.x + Math.cos(a) * r0, c.z + Math.sin(a) * r0); }
  const g = new THREE.ExtrudeGeometry(s, { depth: h, bevelEnabled: true, bevelThickness: 0.25, bevelSize: 0.25, bevelSegments: 2, curveSegments: 8 });
  g.rotateX(Math.PI / 2); // forma (x, z), extrusión hacia -y
  g.translate(0, y0, 0);
  return g;
}
/** Pared cilíndrica curva (placas del ESA, paredes del tubo en el imán). */
function arcWall(c, r, a0, a1, h, y = 0, seg = 48) {
  const g = new THREE.CylinderGeometry(r, r, h, seg, 1, true, Math.PI / 2 - a1, a1 - a0);
  g.translate(c.x, y, c.z);
  return g;
}
/** Caja orientada a lo largo de un tramo recto p0 → p1. */
function segBox(p0, p1, w, h, mat) {
  const d = p1.clone().sub(p0), L = d.length();
  const m = mesh(rbox(L, h, w, 0.2), mat);
  m.position.copy(p0).addScaledVector(d, 0.5);
  m.rotation.y = -Math.atan2(d.z, d.x);
  return m;
}

export function buildAnalizador(parent) {
  const refs = {};
  const A = makePart(parent, 'analizador', { level: 1, offset: [0, 26, 0], mode: 'analizador', label: 'equipo' });
  A.position.copy(ORIGEN);
  A.rotation.x = Math.PI; // la trayectoria avanza hacia el fondo del equipo

  /* ---------------- FUENTE ---------------- */
  {
    const g = makePart(A, 'fuente_ei', L2([-10, 0, 0]));
    g.add(mesh(rbox(3.6, 3.6, 3.6, 0.3), M.acero, [-2.2, 0, 0]));                     // bloque de la fuente
    g.add(mesh(rbox(1.6, 1.4, 1.4, 0.1), M.aceroPulido, [-2.2, 0, 0]));                 // volumen de ionización
    for (const s of [1, -1]) {
      g.add(mesh(rbox(1.4, 0.3, 1.2, 0.06), M.ceramica, [-2.2, s * 2.0, 0]));          // soporte del filamento
      g.add(mesh(cylY(0.5, 0.5, 20), M.iman, [-2.2, s * 2.6, 0]));                      // imanes colimadores
    }
    g.add(mesh(cylX(0.5, 5, 20), M.aceroPulido, [-6.5, 0, 0]));                         // varilla del interlock
    g.add(mesh(cylX(1.4, 1.2, 32), M.aceroOscuro, [-9.4, 0, 0]));
    g.add(mesh(cylZ(0.3, 4, 16), M.aceroPulido, [-2.2, 0, 3.6]));                       // capilar del GC
    g.add(mesh(cylZ(0.25, 3, 16), M.aceroPulido, [-2.2, 0.9, -3.4]));                   // entrada de referencia (PFK)
    g.add(mesh(cylY(1.2, 3.1, 24), M.ceramica, [PASO_AT.x, 1.95, PASO_AT.z]));           // pasamuros de alta tensión
  }
  {
    const g = makePart(A, 'lentes_enfoque', L2([-5, 4, 0]));
    for (let i = 0; i < 4; i++) g.add(mesh(washerX(2.0, 0.35, 0.15, 40), i % 2 ? M.acero : M.aceroPulido, [0.4 + i * 0.7, 0, 0]));
    for (const s of [1, -1]) { g.add(mesh(box(1.6, 0.15, 1.6), M.aceroPulido, [3.6, s * 0.7, 0])); g.add(mesh(box(1.6, 1.6, 0.15), M.aceroPulido, [4.6, 0, s * 0.7])); }
    for (let k = 0; k < 4; k++) { const a = (k / 4) * Math.PI * 2 + Math.PI / 4;
      g.add(mesh(cylX(0.22, 2.0, 16), M.molibdeno, [5.6, Math.cos(a) * 0.65, Math.sin(a) * 0.65])); }    // lente cuadrupolar
  }
  {
    const g = makePart(A, 'rendija_entrada', L2([-2, 0, 4]));
    for (const s of [1, -1]) g.add(mesh(box(0.2, 2.6, 1.3), M.tungsteno, [AX.ENT_SLIT, 0, s * 0.72]));
    g.add(mesh(rbox(0.6, 4.4, 4.4, 0.15), M.aceroOscuro, [AX.ENT_SLIT - 0.4, 0, 0]));
    g.add(mesh(cylZ(0.25, 4, 16), M.aceroPulido, [AX.ENT_SLIT, 0, 3.2]));               // accionamiento motorizado
    g.add(mesh(rbox(1.2, 1.2, 1.6, 0.2), M.plasticoNegro, [AX.ENT_SLIT, 0, 5.6]));
  }

  /* ---------------- SECTOR MAGNÉTICO ---------------- */
  {
    // se retira en el plano, hacia fuera de su centro de curvatura: el tubo de vuelo sale por el entrehierro sin tocar los polos
    const g = makePart(A, 'iman', L2([Math.cos(AB) * 34, 0, Math.sin(AB) * 34]));
    const w = 7.5, pa0 = AX.AM0 - 0.04, pa1 = AX.AM1 + 0.04;
    // piezas polares (superior e inferior) y culata en H
    g.add(mesh(sectorSlab(AX.CM, AX.RM - w, AX.RM + w, pa0, pa1, 6, 7.5), M.aceroOscuro));
    g.add(mesh(sectorSlab(AX.CM, AX.RM - w, AX.RM + w, pa0, pa1, 6, -1.5), M.aceroOscuro));
    g.add(mesh(sectorSlab(AX.CM, AX.RM - w - 3, AX.RM + w + 6, pa0 - 0.03, pa1 + 0.03, 3.5, 11.0), M.anodizado));    // culata superior
    g.add(mesh(sectorSlab(AX.CM, AX.RM - w - 3, AX.RM + w + 6, pa0 - 0.03, pa1 + 0.03, 3.5, -7.5), M.anodizado));   // culata inferior
    g.add(mesh(sectorSlab(AX.CM, AX.RM + w + 3.2, AX.RM + w + 6, pa0 - 0.03, pa1 + 0.03, 14.6, 7.3), M.anodizado));   // retorno (exterior), encastrado en las culatas
    // laminado: ranuras radiales
    const nLam = 22;
    for (let i = 1; i < nLam; i++) {
      const a = pa0 + (pa1 - pa0) * (i / nLam);
      for (const y of [11.05, -11.05]) {
        const m = mesh(box(2 * w + 6, 0.08, 0.08), M.tornilloNegro, [AX.CM.x + Math.cos(a) * AX.RM, y, AX.CM.z + Math.sin(a) * AX.RM]);
        m.rotation.y = -a; g.add(m);
      }
    }
    // bobinas de cobre alrededor de las piezas polares: contorno de la pieza polar desplazado d hacia fuera (también en los extremos)
    const R0 = AX.RM - w - 0.25, R1 = AX.RM + w + 0.25, d = 1.35;
    const P = (y, r, a, t) => new THREE.Vector3(AX.CM.x + Math.cos(a) * r - Math.sin(a) * t, y, AX.CM.z + Math.sin(a) * r + Math.cos(a) * t);
    for (const y of [4.4, -4.4]) {
      const pts = [];
      for (let i = 0; i < 30; i++) pts.push(P(y, R1 + d, pa0 + (pa1 - pa0) * (i / 30), 0));
      for (let k = 0; k < 6; k++) { const f = (k / 6) * Math.PI / 2; pts.push(P(y, R1 + d * Math.cos(f), pa1, d * Math.sin(f))); }
      for (let k = 0; k < 6; k++) { const f = Math.PI / 2 + (k / 6) * Math.PI / 2; pts.push(P(y, R0 + d * Math.cos(f), pa1, d * Math.sin(f))); }
      for (let i = 30; i > 0; i--) pts.push(P(y, R0 - d, pa0 + (pa1 - pa0) * (i / 30), 0));
      for (let k = 0; k < 6; k++) { const f = Math.PI + (k / 6) * Math.PI / 2; pts.push(P(y, R0 + d * Math.cos(f), pa0, d * Math.sin(f))); }
      for (let k = 0; k < 6; k++) { const f = 1.5 * Math.PI + (k / 6) * Math.PI / 2; pts.push(P(y, R1 + d * Math.cos(f), pa0, d * Math.sin(f))); }
      const curve = new THREE.CatmullRomCurve3(pts, true, 'centripetal');
      g.add(mesh(new THREE.TubeGeometry(curve, 240, 1.2, 12, true), M.cobre));
    }
    // borne de conexión de las bobinas (cara exterior del retorno, hacia abajo en el mundo)
    {
      const m = mesh(rbox(2.4, 4, 4.4, 0.3), M.plasticoNegro, [AX.CM.x + Math.cos(AB) * (RB - 0.1), 0, AX.CM.z + Math.sin(AB) * (RB - 0.1)]);
      m.rotation.y = -AB; g.add(m);
      g.add(mesh(cylY(0.9, 2.2, 24), M.aceroOscuro, [BORNE_IMAN.x, 3.1, BORNE_IMAN.z]));
    }
    // sonda Hall en el entrehierro
    const ha = (AX.AM0 + AX.AM1) / 2;
    g.add(mesh(rbox(1.2, 0.5, 2.2, 0.1), M.plasticoNegro, [AX.CM.x + Math.cos(ha) * (AX.RM + 5.5), 0, AX.CM.z + Math.sin(ha) * (AX.RM + 5.5)]));
  }
  {
    const g = makePart(A, 'tubo_vuelo', L2([0, 0, 0], true, { shell: true }));       // fijo: el imán y el ESA se apartan de él
    const H = 2.2, W = 3.6;
    // tramos rectos: fuente → imán, imán → ESA, ESA → detector
    g.add(segBox(new THREE.Vector3(AX.ENT_SLIT + 0.6, 0, 0), AX.M_IN, W, H, M.acero));
    g.add(segBox(AX.M_OUT, AX.E_IN, W, H, M.acero));
    g.add(segBox(AX.E_OUT, AX.SLIT, W, H, M.acero));
    // cámara curva dentro del entrehierro del imán
    for (const r of [AX.RM - W / 2, AX.RM + W / 2]) g.add(mesh(arcWall(AX.CM, r, AX.AM0, AX.AM1, H), M.acero));
    g.add(mesh(sectorSlab(AX.CM, AX.RM - W / 2, AX.RM + W / 2, AX.AM0, AX.AM1, 0.2, H / 2), M.acero));
    g.add(mesh(sectorSlab(AX.CM, AX.RM - W / 2, AX.RM + W / 2, AX.AM0, AX.AM1, 0.2, -H / 2 + 0.2), M.acero));
    // puertos de bombeo
    for (const p of [AX.M_IN.clone().add(new THREE.Vector3(-8, 0, 0)), AX.BETA_SLIT, AX.SLIT.clone().addScaledVector(AX.H2, -6)]) {
      g.add(mesh(cylY(1.5, 6, 32), M.aceroPulido, [p.x, 4, p.z]));
      g.add(mesh(cylY(2.6, 0.6, 32), M.aceroPulido, [p.x, 7.2, p.z]));
    }
  }
  {
    const g = makePart(A, 'rendija_intermedia', L2([0, 0, 0], false));
    const p = AX.BETA_SLIT, n = AX.left(AX.H1);
    for (const s of [1, -1]) { const m = mesh(box(0.2, 2.6, 1.1), M.tungsteno, [p.x + n.x * s * 0.75, 0, p.z + n.z * s * 0.75]); m.rotation.y = -Math.atan2(AX.H1.z, AX.H1.x); g.add(m); }
  }

  /* ---------------- SECTOR ELÉCTRICO ---------------- */
  {
    const g = makePart(A, 'esa', L2([0, 14, 0]));
    const d = 1.1, h = 4.2;
    g.add(mesh(arcWall(AX.CE, AX.RE - d, AX.AE0, AX.AE1, h), M.aceroPulido));      // placa interior (−V)
    g.add(mesh(arcWall(AX.CE, AX.RE + d, AX.AE0, AX.AE1, h), M.aceroPulido));      // placa exterior (+V)
    for (const r of [AX.RE - d - 0.35, AX.RE + d + 0.35]) g.add(mesh(arcWall(AX.CE, r, AX.AE0, AX.AE1, h), M.acero));
    // aisladores y placas de campo de los extremos
    for (const a of [AX.AE0 + 0.08, (AX.AE0 + AX.AE1) / 2, AX.AE1 - 0.08]) for (const y of [2.4, -2.4]) {
      g.add(mesh(cylY(0.35, 0.6, 16), M.ceramica, [AX.CE.x + Math.cos(a) * (AX.RE - d), y, AX.CE.z + Math.sin(a) * (AX.RE - d)]));
      g.add(mesh(cylY(0.35, 0.6, 16), M.ceramica, [AX.CE.x + Math.cos(a) * (AX.RE + d), y, AX.CE.z + Math.sin(a) * (AX.RE + d)]));
    }
  }
  {
    // carcasa partida en dos mitades que se separan en sentidos opuestos (ninguna atraviesa las placas del ESA)
    const g = makePart(A, 'carcasa_esa', L2([0, 26, 0], false, { info: 'esa', shell: true }));
    const g2 = makePart(A, 'carcasa_esa_inf', L2([0, -12, 0], false, { info: 'esa', shell: true }));
    g.add(mesh(sectorSlab(AX.CE, AX.RE - 4, AX.RE + 4, AX.AE0 - 0.05, AX.AE1 + 0.05, 0.6, 3.6), M.aluminio));
    g2.add(mesh(sectorSlab(AX.CE, AX.RE - 4, AX.RE + 4, AX.AE0 - 0.05, AX.AE1 + 0.05, 0.6, -3.0), M.aluminio));
    for (const r of [AX.RE - 4, AX.RE + 4]) {
      g.add(mesh(arcWall(AX.CE, r, AX.AE0 - 0.05, AX.AE1 + 0.05, 3.6, 1.8), M.aluminio));
      g2.add(mesh(arcWall(AX.CE, r, AX.AE0 - 0.05, AX.AE1 + 0.05, 3.6, -1.8), M.aluminio));
    }
    for (let i = 0; i < 6; i++) { const a = AX.AE0 + (AX.AE1 - AX.AE0) * (i + 0.5) / 6;
      screws(g2, M.tornillo, M.tornilloNegro, 0.3, '-y', [[AX.CE.x + Math.cos(a) * (AX.RE + 3), -3.6, AX.CE.z + Math.sin(a) * (AX.RE + 3)]]); }
  }

  /* ---------------- SALIDA Y DETECTOR ---------------- */
  {
    const g = makePart(A, 'rendija_salida', L2([0, 0, -4], false));
    const p = AX.SLIT, n = AX.left(AX.H2);
    for (const s of [1, -1]) { const m = mesh(box(0.2, 2.6, 1.1), M.tungsteno, [p.x + n.x * s * 0.75, 0, p.z + n.z * s * 0.75]); m.rotation.y = -Math.atan2(AX.H2.z, AX.H2.x); g.add(m); }
  }
  {
    // el dínodo (y local +) y el multiplicador (y local −) se separan entre sí, no se cruzan
    const g = makePart(A, 'dinodo_conversion', L2([0, 8, 0]));
    const p = AX.DYN;
    g.add(mesh(rbox(2.2, 0.3, 2.2, 0.08), M.aceroPulido, [p.x, p.y - 0.4, p.z]));
    g.add(mesh(cylY(0.6, 3, 24), M.ceramica, [p.x, p.y + 1.4, p.z]));
    g.add(mesh(cylY(0.9, 0.6, 24), M.acero, [p.x, p.y + 2.95, p.z]));                  // queda bajo la tapa de la cámara (sin cara coplanar)
  }
  {
    const g = makePart(A, 'multiplicador', L2([0, -8, 0]));
    const p = AX.EM;
    const prof = []; for (let i = 0; i <= 18; i++) { const t = i / 18; prof.push(new THREE.Vector2(0.15 + 0.8 * (1 - t) ** 2, 2.6 * t)); }
    const hg = new THREE.LatheGeometry(prof, 36); const mat = M.vidrioPlomo.clone(); mat.side = THREE.DoubleSide;
    g.add(mesh(hg, mat, [p.x, p.y - 0.6, p.z], [Math.PI, 0, 0]));
    g.add(mesh(rbox(2.4, 0.3, 2.4, 0.08), M.acero, [p.x, p.y - 3.4, p.z]));
    g.add(mesh(cylY(1.6, 1.2, 32), M.aceroPulido, [p.x, p.y - 4.3, p.z]));            // brida de cambio rápido
  }
  {
    const g = makePart(A, 'carcasa_detector', L2([0, 0, -10], false, { shell: true }));
    const p = AX.SLIT.clone().addScaledVector(AX.H2, 4);
    g.add(mesh(rbox(9, 12, 9, 0.6), M.acero, [p.x, 0, p.z]));
  }

  refs.group = A;
  return refs;
}
