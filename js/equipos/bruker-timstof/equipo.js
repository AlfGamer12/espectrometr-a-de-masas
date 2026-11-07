// Equipo completo timsTOF Pro: mueble de suelo con frontal claro y laterales azul oscuro, torre posterior del TOF,
// fuente CaptiveSpray en el frontal, nano-LC en la repisa, cámaras de vacío, bombas turbomoleculares, bomba rotatoria y electrónica.
// Coordenadas de mundo en cm. Frente hacia +Z. Dimensiones aproximadas.
import * as THREE from 'three';
import { M } from '../../materials.js';
import { mesh, rbox, rrShape, box, washerX, cylX, cylY, cylZ, tubeX, tubePath, placaPasos, pasamuros, grilleTexture, textTexture, screws, screenTexture, plateTexture, warningTexture } from '../../geom.js';
import { makePart, cableFlex } from '../../parts.js';
import { buildAnalizador } from './analizador.js';
import { ORIGEN, AX } from './geometria.js';

const L1 = (offset, extra = {}) => ({ level: 1, offset, mode: 'equipo', ...extra });
const XW = 49, ZF = 70.5, ZB = -70.5, H = 125;
/** Punto local del analizador → mundo (rotación de 90° en Y: x local → −z, z local → +x). */
const W = (x, y, z = 0) => new THREE.Vector3(ORIGEN.x + z, ORIGEN.y + y, ORIGEN.z - x);
const SX = ORIGEN.x, SY = ORIGEN.y + AX.SPRAY.y;      // eje de la fuente en el frontal
/** Pasos de la bandeja (y = 78): [x, z, r] — manguera de la fuente, salidas de las dos turbos y cable del detector. */
/** Huella de la torre del TOF sobre la tapa. */
const TX0 = ORIGEN.x - 16, TX1 = ORIGEN.x + 16, TZC = ORIGEN.z - (AX.TOF_X0 + AX.TOF_X1) / 2, TZ0 = TZC - 19, TZ1 = TZC + 19;
const PASOS =[[-15, 40.5, 1.0], [-9, 12.5, 1.0], [-9, -18.5, 1.0], [0, -52, 0.5]];

export function buildEquipo(root) {
  const refs = {};
  const grille = grilleTexture(26, 8);
  const navy = M.azulBruker.clone(); navy.color.setHex(0x1c2b44);

  /* ---------------- MUEBLE ---------------- */
  {
    const g = makePart(root, 'chasis', L1([0, 0, 0]));
    // zócalo algo más estrecho que la carcasa: sus caras no coinciden con las de los paneles
    g.add(mesh(rbox(XW * 2 - 0.8, 5, ZF - ZB - 0.8, 0.5), M.carcasaOsc, [0, 2.5, 0]));
    for (const x of [-XW + 6, XW - 6]) for (const z of [ZB + 6, ZF - 6]) g.add(mesh(cylY(2.2, 1.2, 24), M.goma, [x, 0.6, z]));
    for (const x of [-XW + 3, XW - 3]) for (const z of [ZB + 3, ZF - 3]) g.add(mesh(box(3, H - 6, 3), M.aluminio, [x, H / 2, z]));
    // bandeja del analizador con pasos para las mangueras de vacío y el cable del detector
    g.add(placaPasos(XW * 2 - 6, ZF - ZB - 6, 2, PASOS, M.aluminio, [0, 78, 0], 'xz', 0.3));
    for (const [x, z, r] of PASOS) g.add(pasamuros(r, M.goma, [x, 79, z], 'y', r < 0.8 ? 0.3 : 0.5));
  }
  {
    const g = makePart(root, 'panel_frontal', L1([0, 0, 44], { shell: true, label: 'equipo' }));
    // frontal con la abertura de la fuente CaptiveSpray
    g.add(placaPasos(XW * 2 - 0.4, H - 6, 1.4, [[SX, SY - (H / 2 + 0.5), 6.5]], M.grisClaro, [0, H / 2 + 0.5, ZF - 0.7], 'xy', 0.6));
    // rótulo vertical
    const c = document.createElement('canvas'); c.width = 128; c.height = 640;
    const cg = c.getContext('2d'); cg.fillStyle = '#d9dcdf'; cg.fillRect(0, 0, 128, 640);
    cg.save(); cg.translate(84, 610); cg.rotate(-Math.PI / 2); cg.fillStyle = '#1c2b44'; cg.font = '600 64px Segoe UI'; cg.fillText('timsTOF Pro', 0, 0); cg.restore();
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    g.add(mesh(new THREE.PlaneGeometry(6, 30), new THREE.MeshStandardMaterial({ map: t, roughness: 0.45 }), [XW - 8, 70, ZF + 0.04]));
    // aro de la fuente
    g.add(mesh(new THREE.TorusGeometry(7.0, 0.75, 16, 64), M.aceroPulido, [SX, SY, ZF + 0.3]));
    // repisa a la derecha de la fuente (soporta toda la base del nano-LC)
    g.add(mesh(rbox(44, 1.6, 31.6, 0.5), navy, [22, 88, ZF + 15.9]));
    g.add(mesh(rbox(44, 6, 1.2, 0.4), navy, [22, 85, ZF + 0.6]));
    const gm = M.grisClaro.clone(); gm.map = grille;
    g.add(mesh(new THREE.PlaneGeometry(70, 12), gm, [0, 14, ZF + 0.05]));
    [M.ledVerde, M.ledVerde, M.ledAmbar].forEach((mt, i) => g.add(mesh(cylZ(0.4, 0.3, 16), mt, [-38 + i * 3, 110, ZF + 0.15])));
  }
  for (const [id, s] of [['panel_izq', -1], ['panel_der', 1]]) {
    const g = makePart(root, id, L1([s * 34, 0, 0], { info: 'carcasa', shell: true }));
    g.add(mesh(rbox(1.2, H - 6, ZF - ZB - 2.6, 0.5), navy, [s * (XW - 0.6), H / 2 + 0.5, 0]));
    const gm = navy.clone(); gm.map = grille; gm.color.setHex(0x52617a);
    g.add(mesh(new THREE.PlaneGeometry(60, 14), gm, [s * (XW + 0.04), 30, 0], [0, s * Math.PI / 2, 0]));
  }
  {
    const g = makePart(root, 'tapa_superior', L1([0, 40, 0], { info: 'carcasa', shell: true }));
    // tapa con abertura para el pie de la torre del TOF (al explosionar no corta el tubo de vuelo)
    const b = 0.3, hx0 = TX0 - 0.3, hx1 = TX1 + 0.3, hz0 = TZ0 - 0.3, hz1 = TZ1 + 0.3;
    const s = rrShape(XW * 2 + 0.2 - 2 * b, ZF - ZB + 0.2 - 2 * b, 0.6);
    const h = new THREE.Path();     // forma en (x, −z)
    h.moveTo(hx0 - b, -hz0 + b); h.lineTo(hx0 - b, -hz1 - b); h.lineTo(hx1 + b, -hz1 - b); h.lineTo(hx1 + b, -hz0 + b); h.lineTo(hx0 - b, -hz0 + b);
    s.holes.push(h);
    const geo = new THREE.ExtrudeGeometry(s, { depth: 1.4 - 2 * b, bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: 3, curveSegments: 8 });
    geo.translate(0, 0, -(1.4 - 2 * b) / 2);
    g.add(mesh(geo, navy, [0, H + 0.2, 0], [-Math.PI / 2, 0, 0]));
  }
  {
    const g = makePart(root, 'panel_trasero', L1([0, 0, -40], { info: 'carcasa', shell: true }));
    g.add(mesh(rbox(XW * 2 - 0.4, H - 6, 1.2, 0.5), M.grisClaro, [0, H / 2 + 0.5, ZB + 0.6]));
    const plate = new THREE.MeshStandardMaterial({ map: plateTexture(['TIMS-QTOF', '208–230 V~ 50/60 Hz', 'Modelo didáctico', 'Explorador 3D']), metalness: 0.6, roughness: 0.4 });
    g.add(mesh(new THREE.PlaneGeometry(9, 4.5), plate, [25, 60, ZB - 0.03], [0, Math.PI, 0]));
    g.add(mesh(rbox(4, 3, 1.2, 0.3), M.plasticoNegro, [-30, 16, ZB - 0.6]));
    // cable de alimentación hasta el suelo
    g.add(mesh(tubePath([[-30, 16, (ZB - 1.2)], [-30, 16, (ZB - 1.2) - 4], [-30 - 2, 10, (ZB - 1.2) - 9], [-30 - 5, 0.7, (ZB - 1.2) - 16], [-30 - 14, 0.7, (ZB - 1.2) - 34]], 0.45, 40, 10), M.cable));
    // pasamuros de la entrada de nitrógeno
    g.add(mesh(cylZ(0.5, 3.0, 16), M.aceroPulido, [-38, 110, ZB + 0.6]));
    g.add(mesh(cylZ(0.9, 0.5, 6), M.aceroPulido, [-38, 110, ZB - 0.25]));
  }
  {
    // sube lo bastante para dejar a la vista el tubo de vuelo completo
    const g = makePart(root, 'torre_tof', L1([0, 66, -8], { shell: true, label: 'equipo' }));
    g.add(mesh(rbox(32, 76, 38, 1.0), navy, [ORIGEN.x, H + 38, ORIGEN.z - (AX.TOF_X0 + AX.TOF_X1) / 2]));
    const gm = navy.clone(); gm.map = grille; gm.color.setHex(0x52617a);
    g.add(mesh(new THREE.PlaneGeometry(24, 10), gm, [ORIGEN.x, H + 76.05, ORIGEN.z - (AX.TOF_X0 + AX.TOF_X1) / 2], [-Math.PI / 2, 0, 0]));
  }

  /* ---------------- VACÍO ---------------- */
  {
    const g = makePart(root, 'camara_vacio', L1([0, 0, 0], { shell: true, label: 'equipo' }));
    const a = W(AX.F1_0 - 1, 0), b = W(AX.TR_1 + 1, 0);
    g.add(mesh(rbox(9, 9, a.z - b.z, 0.6), M.aluminio, [ORIGEN.x, ORIGEN.y, (a.z + b.z) / 2]));
    // tabiques de bombeo diferencial (bridas)
    for (const x of [AX.T_0 - 0.5, AX.F2_1 + 0.5, AX.Q_0 - 0.5]) { const p = W(x, 0); g.add(mesh(rbox(11, 11, 0.8, 0.3), M.aceroPulido, [p.x, p.y, p.z])); }
    for (const x of [AX.F1_0 + 3, AX.MP_0 + 4, AX.C_0 + 6]) { const p = W(x, 0); g.add(mesh(cylY(2.2, 8, 32), M.aceroPulido, [p.x, p.y - 8, p.z])); }
    refs.ports = [AX.F1_0 + 3, AX.MP_0 + 4, AX.C_0 + 6].map((x) => W(x, -12));
    // reductor de la toma de vacío previo de la fuente
    const p0 = refs.ports[0];
    g.add(mesh(cylY(0.8, 3, 20), M.aceroPulido, [p0.x, p0.y - 1.5, p0.z]));
    // alojamiento de la fuente tras la abertura del frontal: fondo (con pasos del capilar y del gas) y camisa
    g.add(placaPasos(14.4, 14.4, 0.5, [[0, 0, 0.7], [-3.6, 2.4, 0.5]], navy, [SX, SY, 58.3], 'xy', 0.5));
    g.add(pasamuros(0.5, M.goma, [SX - 3.6, SY + 2.4, 58.55], 'z', 0.3));
    g.add(mesh(tubeX(6.75, 6.5, 10.4, 64), navy, [SX, SY, 63.8], [0, Math.PI / 2, 0]));
  }
  {
    // se separan de lado (hacia abajo atravesarían la bandeja)
    const g = makePart(root, 'bombas_turbo', L1([-20, 0, 0], { label: 'equipo' }));
    refs.ports.slice(1).forEach((p) => {
      g.add(mesh(cylY(3.4, 0.7, 40), M.aceroPulido, [p.x, p.y + 0.2, p.z]));
      g.add(mesh(cylY(3.1, 12, 40), M.aluminio, [p.x, p.y - 6, p.z]));
      g.add(mesh(cylY(3.2, 0.4, 40), M.aceroOscuro, [p.x, p.y - 3, p.z]));
      g.add(mesh(rbox(6, 3, 6, 0.4), M.anodizado, [p.x, p.y - 11.5, p.z]));          // pie apoyado sobre la bandeja
      g.add(mesh(cylX(0.6, 1.4, 16), M.aceroPulido, [p.x + 3.6, p.y - 8, p.z]));      // salida de vacío previo
    });
  }
  {
    const g = makePart(root, 'bomba_rotatoria', L1([0, 0, 40], { label: 'equipo' }));
    g.add(mesh(rbox(16, 18, 24, 0.8), M.anodizado, [-24, 14, 30]));
    g.add(mesh(cylZ(7, 16, 40), M.carcasaOsc, [-24, 13, 12]));
    g.add(mesh(cylY(1.2, 3, 20), M.aceroPulido, [-24, 24.5, 30]));
    // colector de aspiración con tres tomas
    g.add(mesh(cylX(1.0, 11, 24), M.aceroPulido, [-24, 26.8, 30]));
    for (const x of [-28, -24, -20]) g.add(mesh(cylY(0.75, 2, 16), M.aceroPulido, [x, 28.6, 30]));
  }
  {
    const g = makePart(root, 'lineas_vacio', L1([0, 0, 0], { info: 'bomba_rotatoria' }));
    // cada manguera: toma → paso de la bandeja (anclado al chasis) → colector de la rotatoria
    const baja = (hx, hz, sx) => [[hx, 80.3, hz, 'chasis'], [hx, 75.7, hz, 'chasis'], [hx, 64, hz, 'chasis'], [sx, 40, 30, 'bomba_rotatoria'], [sx, 29.8, 30, 'bomba_rotatoria']];
    const p0 = refs.ports[0];
    cableFlex(g, [[p0.x, p0.y - 3, p0.z, 'camara_vacio'], [p0.x, p0.y - 6, p0.z, 'camara_vacio'], ...baja(PASOS[0][0], PASOS[0][1], -24)], 0.5, M.ptfe);
    refs.ports.slice(1).forEach((p, i) => {
      const [hx, hz] = PASOS[i + 1];
      cableFlex(g, [[p.x + 4.3, p.y - 8, p.z, 'bombas_turbo'], [p.x + 5.6, p.y - 8.6, p.z, 'bombas_turbo'], [hx, 81.6, hz, 'chasis'], ...baja(hx, hz, i ? -28 : -20)], 0.5, M.ptfe);
    });
  }

  /* ---------------- ELECTRÓNICA Y GASES ---------------- */
  {
    const g = makePart(root, 'electronica', L1([30, 0, 0], { label: 'equipo' }));
    for (const [y, w] of [[40, 30], [62, 30]]) {
      g.add(mesh(rbox(w, 18, 50, 0.5), M.anodizado, [26, y, -20]));
      for (let i = 0; i < 8; i++) g.add(mesh(box(0.6, 0.35, 46), M.aluminio, [10.8, y - 7 + i * 2, -20]));
    }
    g.add(mesh(rbox(0.3, 26, 40, 0.06), M.pcb, [40, 40, 25]));
    const w = new THREE.MeshStandardMaterial({ map: warningTexture('ALTA TENSIÓN'), roughness: 0.45 });
    g.add(mesh(new THREE.PlaneGeometry(10, 3.8), w, [10.9, 62, 0], [0, -Math.PI / 2, 0]));
    // coaxial de señal del detector MCP: baja por su paso de la bandeja hasta el conector del módulo superior
    g.add(mesh(cylY(0.45, 1.0, 16), M.aceroPulido, [16, 71.5, -40]));
    cableFlex(g, [[-15, 103.95, -50, 'detector_mcp'], [-15, 101.5, -50.3, 'detector_mcp'], [-8, 89, -52, 'chasis'], [0, 80.3, -52, 'chasis'],
      [0, 75.7, -52, 'chasis'], [9, 74.4, -45], [16, 73.8, -40], [16, 72.1, -40]], 0.15, M.cable);
  }
  {
    const g = makePart(root, 'digitalizador', L1([0, 0, -30], { label: 'equipo' }));
    g.add(mesh(rbox(26, 18, 0.3, 0.06), M.pcb, [ORIGEN.x, 150, ORIGEN.z - AX.TOF_X1 - 8]));
    for (let i = 0; i < 10; i++) g.add(mesh(box(2, 1.6, 0.3), M.chip, [ORIGEN.x - 10 + i * 2.2, 150 + (i % 2) * 4 - 2, ORIGEN.z - AX.TOF_X1 - 7.7]));
    g.add(mesh(rbox(5, 5, 0.6, 0.2), M.aluminio, [ORIGEN.x + 6, 155.6, ORIGEN.z - AX.TOF_X1 - 7.55]));   // apoyado en la placa, sin tocar los chips
  }
  {
    const g = makePart(root, 'linea_gas', L1([0, 12, 0], { label: 'equipo' }));
    g.add(mesh(rbox(10, 6, 8, 0.4), M.grisClaro, [-35, 116, 20]));
    // gas de la fuente: entra en el alojamiento por su paso del fondo y llega al racor superior del CaptiveSpray
    cableFlex(g, [[-35, 113.1, 20], [-34, 110.5, 30], [-24, 109.6, 50, 'camara_vacio'], [SX - 3.6, SY + 2.4, 56.4, 'camara_vacio'], [SX - 3.6, SY + 2.4, 58.3, 'camara_vacio'],
      [SX - 2.6, SY + 3.3, 61.5, 'captivespray'], [SX - 0.8, SY + 3.6, 64.6, 'captivespray'], [SX - 0.8, SY + 2.35, 66.2, 'captivespray']], 0.25, M.ptfe, { seg: 96 });
    // suministro de nitrógeno desde el pasamuros del panel trasero
    cableFlex(g, [[-35, 118.9, 20], [-36.5, 121.5, 8], [-38, 121.5, -30], [-38, 118, -56], [-38, 111.6, ZB + 4.6, 'panel_trasero'], [-38, 110, ZB + 2.2, 'panel_trasero']], 0.25, M.ptfe);
  }

  /* ---------------- NANO-LC (contexto) ---------------- */
  {
    // apoyado en la repisa y separado del frontal; al explosionar sale por delante del panel (no lo atraviesa)
    const g = makePart(root, 'nanolc', L1([0, 12, 60], { label: 'equipo' }));
    const zf = ZF + 30.6;                                                    // cara frontal
    g.add(mesh(rbox(38, 24, 30, 0.8), M.grisClaro, [22, 100.85, zf - 15]));
    g.add(mesh(rbox(36, 2, 0.6, 0.3), navy, [22, 111, zf + 0.2]));
    const sc = new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0xffffff, emissiveIntensity: 0.8, emissiveMap: screenTexture([['Flujo', '400 nL/min'], ['Presión', '820 bar']], { title: 'nano-LC' }) });
    g.add(mesh(rbox(11, 6, 0.4, 0.2), M.plasticoNegro, [12, 100, zf + 0.1]));
    g.add(mesh(new THREE.PlaneGeometry(10, 5), sc, [12, 100, zf + 0.4]));
    g.add(mesh(cylX(0.5, 18, 20), M.aceroPulido, [26, 95, zf + 0.6]));     // columna analítica
  }
  {
    // línea PEEK: columna → por la izquierda del nano-LC → abertura del frontal → tuerca trasera del CaptiveSpray
    const g = makePart(root, 'tubo_muestra', L1([0, 0, 0], { info: 'nanolc' }));
    const zc = ZF + 31.2;
    cableFlex(g, [[16.5, 95, zc, 'nanolc'], [14.6, 95.3, zc + 0.9, 'nanolc'], [6, 96.5, zc + 1.5, 'nanolc'], [1.0, 99, zc - 2.2, 'nanolc'], [-1.5, 101.5, ZF + 17.5, 'nanolc'],
      [SX + 5.5, SY - 1.4, ZF + 2.7, 'panel_frontal'], [SX + 1.2, SY - 0.1, ZF + 0.8, 'panel_frontal'], [SX + 0.2, SY, ZF - 0.6, 'panel_frontal'], [SX, SY, ZF - 1.25, 'captivespray']], 0.12, M.peekRojo, { seg: 120 });
  }

  refs.analyzer = buildAnalizador(root);

  // los cables y mangueras son cableFlex: siguen solos a sus piezas al explosionar
  refs.update = () => {};
  return refs;
}
