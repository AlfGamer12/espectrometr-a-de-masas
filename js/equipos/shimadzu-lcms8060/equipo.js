// Equipo completo LCMS-8060NX: unidad MS (1180 × 540 × 610 mm), torre de la unidad de ionización, cámara de vacío,
// bomba turbomolecular de tres entradas, bomba rotatoria, electrónica, gases y cromatógrafo de líquidos (contexto).
// Coordenadas de mundo en cm. Frente hacia +Z; LC a la izquierda (-X). Suelo (mesa) en y = 0.
import * as THREE from 'three';
import { M, ribTexture } from '../../materials.js';
import { mesh, rbox, box, washerX, cylX, cylY, cylZ, tubePath, grilleTexture, textTexture, screws, screenTexture, plateTexture, warningTexture, placaPasos, pasamuros } from '../../geom.js';
import { makePart, cableFlex } from '../../parts.js';
import { buildAnalizador } from './analizador.js';
import { ORIGEN, AX } from './geometria.js';

const L1 = (offset, extra = {}) => ({ level: 1, offset, mode: 'equipo', ...extra });
const X0 = -59, X1 = 59, ZB = -27, ZF = 27, H = 61;   // envolvente de la unidad MS
const XT = -37;                                       // límite derecho de la torre de la fuente
const KF = { x: 44, y: 9 };                           // pasamuros KF de vacío previo en el panel trasero
const PROBE = { x: ORIGEN.x + AX.SPRAY.x, z: ORIGEN.z }; // eje de la sonda ESI (mundo)

/** Panel frontal plateado con borde superior en "S" (separación bicolor). */
function swooshShape(x0, x1, yl, yr) {
  const s = new THREE.Shape();
  s.moveTo(x0, 1.5); s.lineTo(x1, 1.5); s.lineTo(x1, yr);
  s.bezierCurveTo(x1 - 30, yr, x0 + 50, yl, x0, yl);
  s.lineTo(x0, 1.5);
  return s;
}

export function buildEquipo(root) {
  const refs = {};
  const grille = grilleTexture(30, 9);

  /* ---------------- ESTRUCTURA Y CARCASA ---------------- */
  {
    const g = makePart(root, 'chasis', L1([0, 0, 0]));
    g.add(mesh(rbox(X1 - X0, 1.4, ZF - ZB, 0.3), M.carcasaOsc, [0, 1.9, 0]));
    for (const x of [X0 + 5, X1 - 5]) for (const z of [ZB + 5, ZF - 5]) {
      g.add(mesh(cylY(1.6, 0.8, 24), M.goma, [x, 0.4, z]));
      g.add(mesh(cylY(0.6, 1.0, 6), M.aceroOscuro, [x, 1.2, z]));
    }
  }
  {
    const g = makePart(root, 'carcasa_superior', L1([0, 55, 0], { info: 'carcasa', shell: true }));
    g.add(mesh(rbox(X1 - XT - 0.2, 1.2, ZF - ZB + 0.2, 0.5), M.negroBrillante, [(X1 + XT) / 2, H - 0.4, 0]));
    const gm = M.negroBrillante.clone(); gm.map = grille; gm.color.setHex(0x9aa0a8);
    g.add(mesh(new THREE.PlaneGeometry(30, 10), gm, [30, H + 0.02, -12], [-Math.PI / 2, 0, 0]));
  }
  {
    const g = makePart(root, 'panel_frontal', L1([62, 0, 38], { shell: true, label: 'equipo' }));
    g.add(mesh(rbox(X1 - XT - 1.2, H - 3, 1.0, 0.4), M.negroBrillante, [(X1 + XT - 1.2) / 2, (H - 3) / 2 + 2, ZF - 0.5]));
    const sw = new THREE.ExtrudeGeometry(swooshShape(XT + 0.3, X1 - 1.4, 20, 36), { depth: 0.6, bevelEnabled: true, bevelThickness: 0.15, bevelSize: 0.15, bevelSegments: 3, curveSegments: 32 });
    g.add(mesh(sw, M.plata, [0, 0.8, ZF]));
    const lab = new THREE.MeshStandardMaterial({ map: textTexture(['LCMS-8060NX'], { bg: '#141619', fg: '#e8eaec', font: '600 64px Segoe UI' }), roughness: 0.35 });
    g.add(mesh(new THREE.PlaneGeometry(14, 3.5), lab, [44, 52, ZF + 0.03]));
    const lab2 = new THREE.MeshStandardMaterial({ map: textTexture(['Triple Quadrupole LC/MS/MS'], { bg: '#141619', fg: '#9aa0a8', font: '400 40px Segoe UI' }), roughness: 0.35 });
    g.add(mesh(new THREE.PlaneGeometry(14, 3.5), lab2, [44, 48.4, ZF + 0.03]));
  }
  {
    const g = makePart(root, 'panel_der', L1([30, 0, 0], { info: 'carcasa', shell: true }));
    g.add(mesh(rbox(1.0, H - 3, ZF - ZB, 0.4), M.negroBrillante, [X1 - 0.5, (H - 3) / 2 + 2, 0]));
    const gm = M.negroBrillante.clone(); gm.map = grille; gm.color.setHex(0x8a9098);
    g.add(mesh(new THREE.PlaneGeometry(36, 14), gm, [X1 + 0.03, 18, 0], [0, Math.PI / 2, 0]));
  }
  {
    const g = makePart(root, 'panel_trasero', L1([0, 0, -55], { shell: true, label: 'equipo' }));
    // panel con el paso KF de la línea de vacío previo
    const cxp = (X1 + XT - 1.2) / 2, cyp = (H - 3) / 2 + 2;
    g.add(placaPasos(X1 - XT - 1.2, H - 3, 1.0, [[KF.x - cxp, KF.y - cyp, 1.6]], M.negroBrillante, [cxp, cyp, ZB + 0.5], 'xy', 0.4));
    // pasamuros KF (brida exterior, manguito y tuerca interior)
    const kf = new THREE.LatheGeometry([[1.05, -1.2], [2.4, -1.2], [2.4, -0.45], [1.45, -0.45], [1.45, 0.45], [2.2, 0.45], [2.2, 1.0], [1.05, 1.0], [1.05, -1.2]]
      .map(([r, y]) => new THREE.Vector2(r, y)), 40);
    kf.rotateX(Math.PI / 2);
    g.add(mesh(kf, M.aceroPulido, [KF.x, KF.y, ZB + 0.5]));
    g.add(mesh(new THREE.TorusGeometry(1.75, 0.3, 10, 32), M.aceroPulido, [KF.x, KF.y, ZB - 0.85]));
    // cruz KF interior: une la salida de la turbo y el puerto de la 1.ª cámara antes del pasamuros
    g.add(mesh(cylZ(1.15, 4.2, 32), M.aceroPulido, [KF.x, KF.y, ZB + 3.0]));
    g.add(mesh(cylX(1.0, 2.4, 32), M.aceroPulido, [KF.x - 1.4, KF.y, ZB + 3.2]));
    g.add(mesh(new THREE.TorusGeometry(1.2, 0.28, 10, 28), M.aceroPulido, [KF.x, KF.y, ZB + 5.0]));
    g.add(mesh(new THREE.TorusGeometry(1.05, 0.26, 10, 28), M.aceroPulido, [KF.x - 2.5, KF.y, ZB + 3.2], [0, Math.PI / 2, 0]));
    // entradas de gas (N₂, Ar), red eléctrica, LAN y escape
    const plate = new THREE.MeshStandardMaterial({ map: plateTexture(['LCMS · Triple Quadrupole', '230 V~ 50/60 Hz  15 A', 'Modelo didáctico', 'Explorador 3D']), metalness: 0.6, roughness: 0.4 });
    g.add(mesh(new THREE.PlaneGeometry(9, 4.5), plate, [30, 40, ZB - 0.02], [0, Math.PI, 0]));
    for (const [x, lbl] of [[-30, 'N2'], [-24, 'Ar']]) {
      g.add(mesh(cylZ(0.9, 2.2, 6), M.aceroPulido, [x, 30, ZB - 1.0]));
      g.add(mesh(cylZ(0.75, 0.6, 6), M.aceroPulido, [x, 30, ZB + 1.3]));          // tuerca interior
      g.add(mesh(cylZ(0.45, 1.2, 24), M.acero, [x, 30, ZB - 2.4]));
      const t = new THREE.MeshStandardMaterial({ map: textTexture([lbl], { w: 128, h: 64, bg: '#141619', fg: '#e8eaec', font: '600 40px Segoe UI' }) });
      g.add(mesh(new THREE.PlaneGeometry(2.4, 1.2), t, [x, 27.6, ZB - 0.02], [0, Math.PI, 0]));
    }
    g.add(mesh(rbox(4, 3, 1, 0.2), M.plasticoNegro, [10, 10, ZB - 0.6]));
    // cable de alimentación hasta el suelo
    g.add(mesh(tubePath([[10, 10, (ZB - 1.2)], [10, 10, (ZB - 1.2) - 4], [10 - 2, 4, (ZB - 1.2) - 9], [10 - 5, 0.7, (ZB - 1.2) - 16], [10 - 14, 0.7, (ZB - 1.2) - 34]], 0.45, 40, 10), M.cable));
    g.add(mesh(rbox(2, 1.5, 0.8, 0.1), M.plasticoNegro, [18, 10, ZB - 0.5]));
    screws(g, M.tornillo, M.tornilloNegro, 0.3, '-z', [[XT + 3, 56, ZB - 0.02], [X1 - 4, 56, ZB - 0.02], [XT + 3, 5, ZB - 0.02], [X1 - 4, 5, ZB - 0.02]]);
  }

  /* ---------------- UNIDAD DE IONIZACIÓN (torre de la fuente) ---------------- */
  {
    const g = makePart(root, 'torre_fuente', L1([-26, 0, 0], { shell: true, label: 'equipo' }));
    const HT = 72;
    g.add(mesh(rbox(XT - X0, HT - 2, ZF - ZB + 1, 0.8), M.negroBrillante, [(X0 + XT) / 2, HT / 2 + 1, 0.5]));
    // parte inferior plateada con los indicadores LED
    g.add(mesh(rbox(XT - X0 - 0.4, 18, 0.8, 0.3), M.plata, [(X0 + XT) / 2, 11, ZF + 1.25]));
    const LEDS = [M.ledVerde, M.ledVerde, M.ledVerde, M.ledAmbar, M.ledVerde];
    LEDS.forEach((mt, i) => g.add(mesh(cylZ(0.32, 0.25, 16), mt, [X0 + 5 + i * 3, 16, ZF + 1.75])));
    // marco de la ventana de la fuente (la ventana es una pieza aparte)
    const fr = new THREE.Shape(); fr.moveTo(-8, -8); fr.lineTo(8, -8); fr.lineTo(8, 8); fr.lineTo(-8, 8);
    const hl = new THREE.Path(); hl.moveTo(-6.5, -6.5); hl.lineTo(-6.5, 6.5); hl.lineTo(6.5, 6.5); hl.lineTo(6.5, -6.5); fr.holes.push(hl);
    g.add(mesh(new THREE.ExtrudeGeometry(fr, { depth: 0.6, bevelEnabled: true, bevelThickness: 0.15, bevelSize: 0.15, bevelSegments: 2 }), M.aceroOscuro, [(X0 + XT) / 2, 42, ZF + 1]));
    // cámara de ionización interior (acero) y desagüe
    g.add(mesh(rbox(16, 18, 14, 0.4), M.acero, [ORIGEN.x - 4, 41, ORIGEN.z + 2]));
    g.add(mesh(cylY(0.9, 22, 24), M.ptfe, [ORIGEN.x - 4, 20, ORIGEN.z + 4]));
    // paso superior de la sonda
    g.add(mesh(cylY(2.8, 1.2, 36), M.aceroPulido, [ORIGEN.x + AX.SPRAY.x, HT + 0.4, ORIGEN.z]));
    const warn = new THREE.MeshStandardMaterial({ map: warningTexture('ALTA TENSIÓN · CALIENTE'), roughness: 0.45 });
    g.add(mesh(new THREE.PlaneGeometry(9, 3.4), warn, [(X0 + XT) / 2, 58, ZF + 1.02]));
    // tapa: salida del gas nebulizador y conector de alta tensión de la sonda
    g.add(mesh(cylY(0.9, 0.4, 6), M.aceroPulido, [-50.5, HT + 0.1, -7]));
    g.add(mesh(cylY(0.5, 1.4, 6), M.aceroPulido, [-50.5, HT + 0.9, -7]));
    g.add(mesh(cylY(0.75, 1.8, 24), M.plasticoNegro, [-40.8, HT + 0.7, -5]));
    g.add(mesh(new THREE.TorusGeometry(0.75, 0.18, 8, 24), M.aceroPulido, [-40.8, HT + 0.25, -5], [Math.PI / 2, 0, 0]));
    // colector de entrada de gases (N₂ de calentamiento y secado) en la cara que da a la unidad MS
    g.add(mesh(rbox(1.5, 3.6, 5.6, 0.3), M.aceroPulido, [XT + 0.7, 56.5, -8]));
    for (const z of [-9.8, -8, -6.2]) g.add(mesh(cylX(0.35, 0.6, 6), M.aceroPulido, [XT + 1.7, 56.5, z]));
    // gas nebulizador y cable de alta tensión hasta el cabezal de la sonda (siguen a la sonda al desmontar)
    cableFlex(g, [[PROBE.x, 75.0, PROBE.z - 2.7, 'sonda_esi'], [PROBE.x, 74.9, PROBE.z - 4.0, 'sonda_esi'], [-49.5, 75.3, -5.5], [-50.5, 74.7, -7], [-50.5, HT + 1.5, -7]], 0.14, M.ptfe, { seg: 40 });
    cableFlex(g, [[PROBE.x + 3.0, 75.4, PROBE.z, 'sonda_esi'], [PROBE.x + 4.4, 75.4, PROBE.z, 'sonda_esi'], [PROBE.x + 5.6, 75.6, PROBE.z - 1.6, 'sonda_esi'],
      [-40.8, 75.2, -4.2], [-40.8, HT + 1.5, -5]], 0.22, M.cable, { seg: 40 });
  }
  {
    const g = makePart(root, 'ventana_fuente', L1([0, 0, 18], { label: 'equipo', shell: true }));
    const gl = M.vidrio.clone(); gl.opacity = 0.22;
    g.add(mesh(rbox(13.4, 13.4, 0.5, 0.2), gl, [(X0 + XT) / 2, 42, ZF + 1.4]));
    g.add(mesh(rbox(2.2, 4, 1.2, 0.4), M.aceroPulido, [(X0 + XT) / 2 + 9.3, 42, ZF + 1.8]));
  }
  {
    const g = makePart(root, 'valvula_desvio', L1([-34, 0, 10], { label: 'equipo' }));
    const x = X0 - 2.2, y = 54, z = 14;
    g.add(mesh(rbox(4.4, 6, 6, 0.5), M.grisClaro, [x, y, z]));
    g.add(mesh(cylX(1.7, 1.2, 36), M.aceroPulido, [x - 2.6, y, z]));
    for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2;
      g.add(mesh(cylX(0.32, 0.9, 6), M.peekBeige, [x - 3.5, y + Math.cos(a) * 1.15, z + Math.sin(a) * 1.15])); }
  }

  /* ---------------- SISTEMA DE VACÍO ---------------- */
  {
    const g = makePart(root, 'camara_vacio', L1([0, 0, 0], { shell: true, label: 'equipo' }));
    const x0 = ORIGEN.x + AX.WALL[0] - 0.4, x1 = ORIGEN.x + AX.DYN.x + 4, y = ORIGEN.y, z = ORIGEN.z;
    const len = x1 - x0;
    // paredes laterales y de fondo algo más bajas que tapa y base (sin caras coplanares)
    for (const s of [-1, 1]) {
      g.add(mesh(rbox(len, 0.9, 12.3, 0.2), M.aluminio, [x0 + len / 2, y + s * 5.5, z]));
      g.add(mesh(rbox(len, 11.6, 0.9, 0.2), M.aluminio, [x0 + len / 2, y, z + s * 5.5]));
    }
    g.add(mesh(rbox(0.9, 11.6, 11.6, 0.2), M.aluminio, [x1, y, z]));
    // pasos de vacío en la tapa: gas de colisión (Ar) y tres pasamuros cerámicos de alta tensión
    g.add(mesh(cylY(0.5, 1.0, 6), M.aceroPulido, [ORIGEN.x + AX.Q2_0 + 2, y + 6.4, z]));
    for (const dz of [-4.4, -2.8, -1.2]) {
      g.add(mesh(cylY(0.45, 1.2, 16), M.ceramica, [2, y + 6.5, z + dz]));
      g.add(mesh(cylY(0.7, 0.3, 16), M.aceroPulido, [2, y + 5.95, z + dz]));
    }
    // bridas de acceso en la tapa
    for (const x of [ORIGEN.x + 13, ORIGEN.x + 40, ORIGEN.x + 76]) {
      g.add(mesh(rbox(9, 0.8, 11, 0.3), M.aluminio, [x, y + 6.3, z]));
      for (const dx of [-3.8, 3.8]) for (const dz of [-4.6, 4.6]) screws(g, M.tornillo, M.tornilloNegro, 0.3, 'y', [[x + dx, y + 6.7, z + dz]]);
    }
    // puerto de vacío previo de la 1.ª cámara (a la rotatoria)
    g.add(mesh(cylY(1.3, 3.4, 32), M.aceroPulido, [ORIGEN.x + 13, y - 7.4, z - 3]));
    g.add(mesh(cylY(1.9, 0.5, 32), M.aceroPulido, [ORIGEN.x + 13, y - 9.0, z - 3]));
    // medidores de vacío (Pirani y de ionización)
    g.add(mesh(cylZ(1.1, 3, 32), M.acero, [ORIGEN.x + 20, y + 2, z - 7.5]));
    g.add(mesh(rbox(2.6, 2.6, 2.4, 0.3), M.plasticoNegro, [ORIGEN.x + 20, y + 2, z - 10]));
    g.add(mesh(cylZ(1.1, 3, 32), M.acero, [ORIGEN.x + 60, y + 2, z - 7.5]));
    g.add(mesh(rbox(2.6, 2.6, 2.4, 0.3), M.plasticoNegro, [ORIGEN.x + 60, y + 2, z - 10]));
  }
  {
    // Bomba turbomolecular de flujo dividido con tres entradas (40 + 260 + 210 L/s)
    const g = makePart(root, 'bomba_turbo', L1([0, 0, -32], { label: 'equipo' }));
    const y = 21.5, z = ORIGEN.z, xa = ORIGEN.x + 18, xb = ORIGEN.x + 86;
    g.add(mesh(cylX(6.2, xb - xa, 56), M.aluminio, [(xa + xb) / 2, y, z]));
    for (const x of [xa + 0.5, xb - 0.5]) g.add(mesh(cylX(6.8, 1.2, 56), M.aceroOscuro, [x, y, z]));   // bridas (sobresalen 0,1)
    for (const x of [xa + 18, xa + 40]) g.add(mesh(cylX(6.35, 0.5, 56), M.aceroOscuro, [x, y, z]));
    g.add(mesh(rbox(9, 6, 10, 0.5), M.anodizado, [xb + 4.5, y - 1, z]));           // controlador
    const PORTS = [[ORIGEN.x + 23, 3.2, '40'], [ORIGEN.x + 41, 4.2, '260'], [ORIGEN.x + 77, 4.0, '210']];
    for (const [x, r] of PORTS) {
      // tubo algo más corto que el tramo entre bridas: sus extremos quedan dentro de ellas
      g.add(mesh(cylY(r, ORIGEN.y - 6 - y - 5.5 - 0.3, 40), M.aceroPulido, [x, (ORIGEN.y - 6 + y + 5.5) / 2 + 0.05, z]));
      g.add(mesh(cylY(r + 0.9, 0.7, 40), M.aceroPulido, [x, ORIGEN.y - 6.3, z]));
      g.add(mesh(cylY(r + 0.9, 0.7, 40), M.aceroPulido, [x, y + 5.9, z]));
    }
    g.add(mesh(cylX(1.2, 3, 32), M.aceroPulido, [xa - 1.5, y - 2, z]));            // escape
    for (const x of [xa + 6, xb - 6]) g.add(mesh(rbox(3, 15, 10, 0.3), M.aluminio, [x, 9, z]));
  }
  {
    // se desplaza más que el panel derecho para no cruzarse con él al desmontar
    const g = makePart(root, 'bomba_rotatoria', L1([44, 0, 0], { label: 'equipo' }));
    const cx = 86, cz = -6;
    g.add(mesh(rbox(16, 18, 20, 0.8), M.grisClaro, [cx + 4, 10, cz]));
    g.add(mesh(cylX(9, 20, 48), M.anodizado, [cx - 11, 11, cz]));
    for (let i = 0; i < 10; i++) g.add(mesh(washerX(9.6, 8.8, 0.35), M.anodizado, [cx - 20 + i * 2, 11, cz]));
    g.add(mesh(cylX(4, 1.0, 36), M.plasticoNegro, [cx - 21.5, 11, cz]));
    g.add(mesh(cylY(1.6, 3.4, 32), M.aceroPulido, [cx + 4, 20.6, cz]));
    g.add(mesh(cylY(2.4, 0.6, 32), M.aceroPulido, [cx + 4, 22.4, cz]));
    // mirilla de aceite (aro, vidrio y nivel con caras escalonadas)
    g.add(mesh(cylZ(1.6, 0.4, 32), M.aceroOscuro, [cx - 2, 6, cz + 10.1]));
    g.add(mesh(cylZ(1.2, 0.45, 32), M.vidrio, [cx - 2, 6, cz + 10.325]));
    g.add(mesh(cylZ(1.1, 0.25, 32), M.liquido, [cx - 2, 5.6, cz + 10.325]));
    g.add(mesh(cylY(1.2, 2.5, 6), M.plasticoNegro, [cx + 8, 20.4, cz + 6]));       // gas ballast
    g.add(mesh(cylY(2.6, 9, 32), M.grisClaro, [cx + 4, 6, cz - 12]));             // filtro de escape
    for (const x of [cx - 16, cx + 9]) for (const z of [cz - 8, cz + 8]) g.add(mesh(cylY(1.0, 1.0, 16), M.goma, [x, 0.5, z]));
  }
  {
    // Mangueras KF de vacío previo: salida de la turbo y puerto de la 1.ª cámara → cruz del panel trasero → pasamuros → rotatoria.
    // Cada tramo sigue a la pieza a la que va unido al desmontar.
    const g = makePart(root, 'linea_vacio_previo', L1([0, 0, 0]));
    const mat = M.aceroOscuro.clone(); mat.color.setHex(0xb3b8be); mat.roughness = 0.32; mat.roughnessMap = null;
    mat.bumpMap = ribTexture(160); mat.bumpScale = 3;
    const T = 'bomba_turbo', P = 'panel_trasero', R = 'bomba_rotatoria', zx = ZB + 7.6;   // zx: recorrido junto al panel
    cableFlex(g, [[-28.8, 19.5, 2, T], [-31, 19.5, 2, T], [-32.5, 17.5, -4, T], [-32, 13, -14, P], [-27, KF.y + 0.5, zx, P], [0, KF.y, zx, P],
      [KF.x - 5, KF.y, zx, P], [KF.x - 0.6, KF.y, zx - 0.8, P], [KF.x, KF.y, ZB + 4.8, P]], 0.9, mat, { seg: 120, radial: 12 });
    cableFlex(g, [[-31, 30.8, -1], [-31, 28.5, -1.2], [-34, 25, -7], [-34.5, 16, -16], [-31, KF.y + 0.5, ZB + 3.4, P], [0, KF.y, ZB + 3.2, P],
      [KF.x - 5, KF.y, ZB + 3.2, P], [KF.x - 2.6, KF.y, ZB + 3.2, P]], 0.75, mat, { seg: 120, radial: 12 });
    cableFlex(g, [[KF.x, KF.y, ZB + 1.2, P], [KF.x, KF.y, ZB - 2.0, P], [KF.x + 2, KF.y + 0.5, ZB - 6, P], [62, 11, ZB - 7, P],
      [76, 17, ZB - 4, R], [86, 26.5, -11, R], [90, 26.3, -7, R], [90, 22.6, -6, R]], 0.9, mat, { seg: 120, radial: 12 });
  }

  /* ---------------- ELECTRÓNICA Y GASES ---------------- */
  {
    const g = makePart(root, 'generadores_rf', L1([0, 0, 26], { label: 'equipo' }));
    for (const [x, w] of [[ORIGEN.x + 41, 16], [ORIGEN.x + 77, 16]]) {
      g.add(mesh(rbox(w, 10, 8, 0.4), M.aluminio, [x, ORIGEN.y + 1, ORIGEN.z + 12]));
      for (let i = 0; i < 9; i++) g.add(mesh(box(w - 2, 0.25, 1.2), M.aluminio, [x, ORIGEN.y - 3 + i * 1, ORIGEN.z + 16.5]));
      g.add(mesh(cylX(0.35, 3, 12), M.cobre, [x - w / 2 - 1, ORIGEN.y + 3, ORIGEN.z + 9]));
    }
  }
  {
    const g = makePart(root, 'fuente_alta_tension', L1([0, 30, 0], { label: 'equipo' }));
    g.add(mesh(rbox(14, 7, 12, 0.4), M.anodizado, [ORIGEN.x + 60, 54, -14]));
    // cables a los pasamuros cerámicos de la tapa de la cámara de vacío
    [-17, -14, -11].forEach((z, k) => cableFlex(g, [[ORIGEN.x + 53.2, 53, z], [ORIGEN.x + 50.5, 52.4, z + 1.5], [3, ORIGEN.y + 9.5, -4.9 + 1.6 * k, 'camara_vacio'],
      [2, ORIGEN.y + 7.9, -2.4 + 1.6 * k, 'camara_vacio'], [2, ORIGEN.y + 7.0, -2.4 + 1.6 * k, 'camara_vacio']], 0.25, M.cable, { seg: 48, radial: 8 }));
    const warn = new THREE.MeshStandardMaterial({ map: warningTexture('ALTA TENSIÓN'), roughness: 0.45 });
    g.add(mesh(new THREE.PlaneGeometry(6, 2.2), warn, [ORIGEN.x + 60, 57.55, -14], [-Math.PI / 2, 0, 0]));
  }
  {
    const g = makePart(root, 'placa_principal', L1([0, 0, -22], { label: 'equipo' }));
    g.add(mesh(rbox(40, 22, 0.25, 0.05), M.pcb, [26, 40, ZB + 2.5]));
    const rnd = (() => { let a = 9; return () => ((a = (a * 16807) % 2147483647) / 2147483647); })();
    for (let i = 0; i < 40; i++) {
      const x = 8 + rnd() * 36, y = 31 + rnd() * 18, k = rnd();
      // alturas escalonadas: componentes solapados no comparten caras
      const q = i % 3, z0 = ZB + 2.625 - 0.07 * q;
      if (k < 0.6) { const t = 0.25 + 0.15 * q; g.add(mesh(box(0.8 + rnd(), 0.8 + rnd(), t), M.chip, [x, y, z0 + t / 2])); }
      else { const t = 0.9 + 0.15 * q; g.add(mesh(cylZ(0.35, t, 16), M.condensador, [x, y, z0 + t / 2])); }
    }
    screws(g, M.tornillo, M.tornilloNegro, 0.25, 'z', [[7, 50, ZB + 2.65], [45, 50, ZB + 2.65], [7, 30, ZB + 2.65], [45, 30, ZB + 2.65]]);
    g.add(mesh(rbox(22, 8, 14, 0.4), M.anodizado, [-12, 6, -10]));       // fuente de alimentación
    const gm = M.carcasa.clone(); gm.map = grille;
    g.add(mesh(new THREE.PlaneGeometry(18, 6), gm, [-12, 6, -2.98]));
  }
  {
    const g = makePart(root, 'linea_gases', L1([0, 18, 0], { label: 'equipo' }));
    // N₂ (nebulizador, calentamiento, secado) hacia la fuente y Ar hacia la celda de colisión
    g.add(mesh(rbox(8, 6, 8, 0.4), M.grisClaro, [-30, 52, -18]));
    const P = 'panel_trasero', C = 'camara_vacio';
    // N₂ desde la entrada del panel trasero hasta la unidad de control de gases
    cableFlex(g, [[-30, 30, ZB + 1.5, P], [-30, 30.4, ZB + 3.2, P], [-30, 40, -22], [-30, 48.4, -18.6], [-30, 49.3, -18]], 0.22, M.ptfe, { seg: 40, radial: 8 });
    // N₂ de calentamiento y secado hasta el colector de la unidad de ionización
    [-9.8, -8, -6.2].forEach((ze, k) => { const xs = -32.5 + 2.5 * k;
      cableFlex(g, [[xs, 52.5, -14.1], [xs, 52.7, -12.6], [xs - 1.2 - 0.6 * k, 54.6 + 0.5 * k, ze - 1.6], [XT + 3.2, 56.5, ze, 'torre_fuente'], [XT + 1.9, 56.5, ze, 'torre_fuente']],
        0.15, M.ptfe, { seg: 40, radial: 8 }); });
    // Ar desde el panel trasero hasta el paso de la tapa sobre la celda de colisión
    const xa = ORIGEN.x + AX.Q2_0 + 2;
    cableFlex(g, [[-24, 30, ZB + 1.5, P], [-23.5, 30.6, ZB + 3.4, P], [-20, 32.5, -21.5], [-4, 38.5, -19.5], [12, ORIGEN.y + 7.8, -12.5],
      [12.8, ORIGEN.y + 8.4, -3.5, C], [xa + 0.2, ORIGEN.y + 8.2, ORIGEN.z - 0.8, C], [xa, ORIGEN.y + 7.6, ORIGEN.z, C], [xa, ORIGEN.y + 6.8, ORIGEN.z, C]], 0.15, M.cobre, { seg: 64, radial: 8 });
  }

  /* ---------------- CROMATÓGRAFO DE LÍQUIDOS (contexto) ---------------- */
  {
    const g = makePart(root, 'lc', L1([-34, 0, 0], { shell: true, label: 'equipo' }));
    const cx = -84, W = 26, D = 50;
    const mod = (y0, h, id, extra) => {
      const s = makePart(g, id, L1([0, 0, 0], { info: { lc_mod: 'lc', lc_bomba2: 'lc_bomba' }[id] || id }));
      s.add(mesh(rbox(W, h - 0.4, D, 0.6), M.grisClaro, [cx, y0 + h / 2, 0]));
      s.add(mesh(rbox(W - 1, 1.2, 0.5, 0.2), M.carcasaOsc, [cx, y0 + h - 1.6, D / 2 + 0.1]));
      s.add(mesh(box(1.6, 0.35, 0.2), M.ledVerde, [cx + W / 2 - 3.2, y0 + h - 1.6, D / 2 + 0.42]));
      s.add(mesh(cylZ(0.45, 0.3, 20), M.plasticoNegro, [cx - W / 2 + 2.2, y0 + h - 1.6, D / 2 + 0.45]));
      s.add(mesh(box(W - 0.6, 0.12, 0.3), M.carcasaOsc, [cx, y0 + 0.25, D / 2 + 0.05]));
      if (extra) extra(s, y0, h);
      return s;
    };
    mod(0, 40, 'lc_inyector', (s, y0, h) => {
      s.add(mesh(rbox(W - 3, h - 9, 0.6, 0.4), M.carcasaOsc, [cx, y0 + h / 2 - 2, D / 2 + 0.2]));
      const gl = M.vidrio.clone(); gl.opacity = 0.35;
      s.add(mesh(rbox(W - 6, h - 15, 0.4, 0.3), gl, [cx, y0 + h / 2 - 2, D / 2 + 0.55]));
      for (let i = 0; i < 4; i++) for (let j = 0; j < 6; j++) s.add(mesh(cylY(0.6, 3.2, 16), M.vidrio, [cx - 7 + j * 2.8, y0 + 10, D / 2 - 6 - i * 3]));
    });
    mod(40, 22, 'lc_horno', (s, y0, h) => {
      s.add(mesh(rbox(W - 3, h - 6, 0.8, 0.4), M.grisClaro, [cx, y0 + h / 2 - 1, D / 2 + 0.3]));
      s.add(mesh(rbox(1.4, 7, 1.0, 0.4), M.aceroOscuro, [cx + 10, y0 + h / 2 - 1, D / 2 + 1.0]));
      s.add(mesh(cylX(0.55, 12, 24), M.aceroPulido, [cx, y0 + h / 2, D / 2 - 6]));    // columna UHPLC
      for (const x of [cx - 6.4, cx + 6.4]) s.add(mesh(cylX(0.85, 1.0, 6), M.aceroPulido, [x, y0 + h / 2, D / 2 - 6]));
      // racor pasamuros de salida en el lateral derecho del horno (hacia la válvula de desvío)
      s.add(mesh(cylX(0.45, 0.9, 6), M.aceroPulido, [cx + W / 2 + 0.35, y0 + h / 2, D / 2 - 6]));
    });
    mod(62, 14, 'lc_bomba', (s, y0, h) => {
      for (const x of [cx - 6, cx + 6]) s.add(mesh(cylZ(1.4, 1.2, 24), M.aceroPulido, [x, y0 + h / 2 - 1, D / 2 + 0.4]));
    });
    mod(76, 14, 'lc_bomba2', null);
    mod(90, 10, 'lc_mod', (s, y0, h) => {
      const sc = new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0xffffff, emissiveIntensity: 0.8,
        emissiveMap: screenTexture([['Flujo', '0,40 mL/min'], ['Presión', '42,5 MPa'], ['Horno', '40 °C']], { title: 'Nexera  Run' }) });
      s.add(mesh(new THREE.PlaneGeometry(8, 3.2), sc, [cx - 6, y0 + h / 2, D / 2 + 0.1]));
      // entradas de las líneas de disolvente en la tapa (bajo la bandeja)
      for (let i = 0; i < 4; i++) s.add(pasamuros(0.3, M.goma, [cx - 8.4 + i * 5.6, y0 + h - 0.15, -19], 'y', 0.16));
    });
    // bandeja de disolventes con botellas
    const t = makePart(g, 'lc_botellas', L1([0, 12, 0], { info: 'lc_botellas' }));
    // bandeja con pasos traseros para las líneas de disolvente
    const zh = -19, xs = [0, 1, 2, 3].map((i) => cx - 8.4 + i * 5.6);
    t.add(placaPasos(W, D - 6, 1.2, xs.map((x) => [x - cx, zh, 0.45]), M.grisClaro, [cx, 100.6, 0], 'xz', 0.4));
    for (const x of xs) {
      t.add(mesh(cylY(2.4, 17, 32), M.vidrio, [x, 109.7, 4]));
      t.add(mesh(cylY(2.25, 11, 32), M.disolvente, [x, 106.8, 4]));
      t.add(mesh(cylY(1.2, 2.2, 24), M.peekBeige, [x, 119.2, 4]));
      t.add(pasamuros(0.42, M.goma, [x, 101.25, zh], 'y', 0.16));
      // línea de disolvente: tapón → paso de la bandeja → entrada del desgasificador (lc_mod)
      cableFlex(t, [[x, 120.1, 4], [x, 121.7, 3], [x, 120.6, -1.5], [x, 111, -15], [x, 103.6, -18.7], [x, 101.9, zh], [x, 99.4, zh],
        [x, 98.4, zh, 'lc_mod']], 0.12, M.ptfe, { seg: 48, radial: 6 });
    }
  }
  {
    // Línea PEEK: salida del horno → válvula de desvío → por encima de la torre → entrada del cabezal de la sonda ESI
    const g = makePart(root, 'tubo_peek', L1([0, 0, 0], { info: 'tubo_peek' }));
    const V = 'valvula_desvio', T = 'torre_fuente', S = 'sonda_esi';
    const vx = X0 - 2.2 - 3.95, vy = 54, vz = 14, pr = 1.15;               // vía de la válvula de 6 vías (puertos 2 y 5)
    const p2 = [vy - pr * 0.5, vz + pr * 0.866], p5 = [vy + pr * 0.5, vz - pr * 0.866];
    cableFlex(g, [[-70.4, 51, 19, 'lc_horno'], [-69.2, 51.5, 18.4, 'lc_horno'], [-67.4, p2[0] - 0.2, p2[1] + 0.8, V], [vx - 1.3, p2[0], p2[1], V], [vx, p2[0], p2[1], V]],
      0.1, M.peekRojo, { seg: 48, radial: 8 });
    cableFlex(g, [[vx, p5[0], p5[1], V], [vx - 1.3, p5[0], p5[1], V], [-67.6, 57, 12.2, V], [-67.4, 65, 10, V], [-63.5, 74.5, 6, T],
      [-55, 78.6, 2.6, S], [PROBE.x - 1.9, 79.0, PROBE.z, S], [PROBE.x, 78.3, PROBE.z, S], [PROBE.x, 77.1, PROBE.z, S]], 0.1, M.peekRojo, { seg: 96, radial: 8 });
  }

  refs.analyzer = buildAnalizador(root);

  // los cables flexibles (cableFlex) se recalculan solos al desmontar
  refs.update = () => {};
  return refs;
}
