// Banco óptico del Shimadzu IRSpirit con el accesorio QATR-S: fuente cerámica, espejo colimador, interferómetro de Michelson sellado
// con incidencia de 30° (divisor de KBr recubierto de Ge + compensador, espejo fijo con actuadores piezoeléctricos de la alineación
// dinámica, espejo móvil con su accionamiento, láser de referencia de semiconductor y su detector), cartucho de gel de sílice,
// espejo de transferencia, ventanas de KBr del compartimento, QATR-S (cuerpo, placa con platina, prisma de diamante, cuatro espejos
// y abrazadera de presión), espejo elipsoidal y detector DLATGS con su preamplificador.
// Coordenadas del mundo (cm): el grupo del analizador está en el origen y sin giro (ver geometria.js). Disposición aproximada.
import * as THREE from 'three';
import { M } from '../../materials.js';
import { mesh, rbox, box, cylX, cylY, cylZ, placaPasos, screws, textTexture } from '../../geom.js';
import { makePart } from '../../parts.js';
import { Y0, ZH, YL, T, R, NBS, B, MF, MM, P, S, FM, INT, XC, YPR, QA, EM, DET, COMP, CAMINO } from './geometria.js';

const L2 = (offset, label = true, extra = {}) => ({ level: 2, offset, mode: 'analizador', label: label ? 'analizador' : null, ...extra });
const UP = new THREE.Vector3(0, 1, 0);

/** Cilindro de radio r y espesor t con su eje según la dirección n (normal de un espejo o de una lámina). */
function disco(r, t, mat, pos, n, seg = 40) {
  const m = mesh(cylY(r, t, seg), mat);
  m.quaternion.setFromUnitVectors(UP, n.clone().normalize());
  m.position.copy(pos);
  return m;
}
/** Espejo plano o curvo esquemático: cara reflectante (frente en `pos`, mirando hacia `n`) y montura oscura detrás. */
function espejo(g, pos, n, r, cara, montura = M.anodizado) {
  const u = n.clone().normalize();
  g.add(disco(r, 0.12, cara, pos.clone().addScaledVector(u, -0.06), u, 48));
  g.add(disco(r + 0.12, 0.3, montura, pos.clone().addScaledVector(u, -0.27), u, 48));
}
/** Poste vertical entre dos alturas. */
const poste = (g, x, z, y0, y1, r = 0.22, mat = M.aceroOscuro) => g.add(mesh(cylY(r, y1 - y0, 20), mat, [x, (y0 + y1) / 2, z]));
/** Aro de sujeción (toro) alrededor de una lámina de normal n. */
function aro(g, pos, n, r, t = 0.12, mat = M.anodizado) {
  const m = mesh(new THREE.TorusGeometry(r, t, 10, 40), mat);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), n.clone().normalize());
  m.position.copy(pos); g.add(m);
}
/** Anillo horizontal (extrusión de una corona) entre y0 e y0 + h. */
function anillo(rOut, rIn, h, mat, x, y0, z) {
  const s = new THREE.Shape(); s.absarc(0, 0, rOut, 0, Math.PI * 2, false);
  const hp = new THREE.Path(); hp.absarc(0, 0, rIn, 0, Math.PI * 2, true); s.holes.push(hp);
  return mesh(new THREE.ExtrudeGeometry(s, { depth: h, bevelEnabled: false, curveSegments: 48 }), mat, [x, y0, z], [-Math.PI / 2, 0, 0]);
}
/** Segmento de haz (cilindro abierto) entre dos puntos. */
function segHaz(a, b, r, mat) {
  const d = b.clone().sub(a), L = d.length();
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, L, 16, 1, true), mat);
  m.quaternion.setFromUnitVectors(UP, d.normalize());
  m.position.copy(a).add(b).multiplyScalar(0.5);
  m.userData.noClone = true; m.castShadow = false; m.raycast = () => {};
  return m;
}

export function buildAnalizador(parent) {
  const refs = {};
  const A = makePart(parent, 'analizador', { level: 1, offset: [0, 0, 0], mode: 'analizador', label: 'equipo' });
  const cara = M.aceroPulido.clone(); cara.color.setHex(0xeef1f4); cara.roughness = 0.06;       // espejos de aluminio
  const oro = M.oro.clone(); oro.roughness = 0.12;                                                // espejos curvos recubiertos de oro
  const alu = M.aluminio.clone(); alu.color.setHex(0xc4c9cf);                                     // fundición de la carcasa
  const kbr = M.cuarzo.clone(); kbr.color.setHex(0xf4f1e6); kbr.opacity = 0.38;                   // KBr (ventanas, compensador)
  const ge = new THREE.MeshPhysicalMaterial({ color: 0x7f858f, metalness: 0.55, roughness: 0.14, transparent: true, opacity: 0.78,
    clearcoat: 1, clearcoatRoughness: 0.1 });                                                     // lámina de KBr con recubrimiento de Ge
  const diamante = new THREE.MeshPhysicalMaterial({ color: 0xe7f6ff, metalness: 0, roughness: 0.02, transparent: true, opacity: 0.62,
    ior: 2.4, clearcoat: 1, clearcoatRoughness: 0.02, specularIntensity: 1 });
  const blancoQ = M.carcasa.clone(); blancoQ.color.setHex(0xeceef0);                              // cuerpo del QATR-S
  const negro = M.negroBrillante.clone(); negro.color.setHex(0x1a1c1f); negro.roughness = 0.45; negro.clearcoat = 0.3;
  const yBase = INT.base[1];                                                                      // cara superior del banco del interferómetro

  /* ---------------- FUENTE Y COLIMACIÓN ---------------- */
  {
    const g = makePart(A, 'fuente_ir', L2([-9, 0, 0]));
    // elemento cerámico incandescente dentro de una pantalla cilíndrica con abertura hacia el colimador
    const cer = M.ceramica.clone(); cer.color.setHex(0xf3e6d8); cer.emissive = new THREE.Color(0xff5a14); cer.emissiveIntensity = 0.85;
    g.add(mesh(cylY(0.26, 1.5, 24), cer, [S.x, Y0, S.z]));
    g.add(mesh(cylY(0.42, 0.3, 24), M.ceramica, [S.x, Y0 - 0.9, S.z]));
    const pant = alu.clone(); pant.side = THREE.DoubleSide;
    g.add(mesh(new THREE.CylinderGeometry(1.05, 1.05, 3.2, 40, 1, true, Math.PI / 2 + 0.55, Math.PI * 2 - 1.1), pant, [S.x, Y0, S.z]));
    g.add(mesh(cylY(1.15, 0.25, 40), alu, [S.x, Y0 + 1.72, S.z]));
    g.add(mesh(cylY(1.15, 0.25, 40), alu, [S.x, Y0 - 1.72, S.z]));
    // soporte hasta el chasis y bornes del cable
    g.add(mesh(rbox(1.6, Y0 - 1.85 - 3.4, 1.6, 0.15), M.anodizado, [S.x, (Y0 - 1.85 + 3.4) / 2, S.z]));
    for (const y of [4.6, 5.3]) g.add(mesh(cylX(0.14, 0.3, 12), M.cobre, [S.x + 0.95, y, S.z]));
    refs.fuente = g;
    refs.elemento = cer;
  }
  {
    const g = makePart(A, 'colimador', L2([-1, 2, -1]));
    const n = new THREE.Vector3(1, 0, 0).negate().add(T).normalize();      // bisectriz: fuente (+X) → divisor (T)
    espejo(g, P, n, 1.15, oro);
    poste(g, P.x - n.x * 0.3, P.z - n.z * 0.3, yBase, Y0 - 1.15);
    g.add(mesh(rbox(1.2, 0.3, 1.2, 0.08), M.anodizado, [P.x - n.x * 0.3, yBase + 0.15, P.z - n.z * 0.3]));
  }

  /* ---------------- INTERFERÓMETRO ---------------- */
  {
    // banco (placa base de la carcasa sellada) y patas hasta el chasis
    const g = makePart(A, 'banco_interf', L2([0, -3, 0], false, { info: 'interferometro' }));
    const cx = (INT.x0 + INT.x1) / 2, cz = (INT.z0 + INT.z1) / 2;
    g.add(mesh(rbox(INT.x1 - INT.x0, INT.base[1] - INT.base[0], INT.z1 - INT.z0, 0.1), alu, [cx, (INT.base[0] + INT.base[1]) / 2, cz]));
    for (const x of [INT.x0 + 0.5, INT.x1 - 0.5]) for (const z of [INT.z0 + 0.5, INT.z1 - 0.5]) poste(g, x, z, 3.4, INT.base[0], 0.3, M.anodizado);
    g.add(mesh(rbox(1.6, 0.6, 1.0, 0.1), M.plasticoNegro, [13.0, INT.base[0] - 0.3, -2.5]));     // conector del interferómetro
    refs.conInterf = new THREE.Vector3(13.0, INT.base[0] - 0.6, -2.5);
  }
  {
    // paredes de fundición de aluminio: cada una se retira hacia fuera en el explosionado
    const e = INT.e, cx = (INT.x0 + INT.x1) / 2, cz = (INT.z0 + INT.z1) / 2, cy = (INT.y0 + INT.y1) / 2, hy = INT.y1 - INT.y0;
    const pared = (id, off) => makePart(A, id, L2(off, id === 'interf_tapa', { info: 'interferometro', shell: true }));
    // frontal: salida del haz modulado hacia el espejo de transferencia
    pared('interf_frontal', [0, 0, 6]).add(placaPasos(INT.x1 - INT.x0, hy, e, [[B.x - cx, Y0 - cy, 1.2]], alu, [cx, cy, INT.z1 - e / 2], 'xy', 0.12));
    // trasera: rejilla de comunicación con el cartucho desecante
    const rej = [];
    for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) rej.push([16.4 + i * 0.6 - cx, Y0 - 1.3 + j * 0.9 - cy, 0.2]);
    pared('interf_trasera', [0, 0, -6]).add(placaPasos(INT.x1 - INT.x0, hy, e, rej, alu, [cx, cy, INT.z0 + e / 2], 'xy', 0.12));
    // izquierda: entrada del haz colimado
    pared('interf_izq', [-6, 0, 0]).add(placaPasos(INT.z1 - INT.z0 - 2 * e, hy, e, [[S.z - cz, Y0 - cy, 1.2]], alu, [INT.x0 + e / 2, cy, cz], 'zy', 0.12));
    pared('interf_der', [6, 0, 0]).add(mesh(rbox(e, hy, INT.z1 - INT.z0 - 2 * e, 0.1), alu, [INT.x1 - e / 2, cy, cz]));
    const tapa = pared('interf_tapa', [0, 8, 0]);
    tapa.add(mesh(rbox(INT.x1 - INT.x0 - 2 * e, e, INT.z1 - INT.z0 - 2 * e, 0.1), alu, [cx, INT.y1 - e / 2, cz]));
    screws(tapa, M.tornillo, M.tornilloNegro, 0.18, 'y', [[INT.x0 + 0.9, INT.y1, INT.z0 + 0.9], [INT.x1 - 0.9, INT.y1, INT.z0 + 0.9], [INT.x0 + 0.9, INT.y1, INT.z1 - 0.9], [INT.x1 - 0.9, INT.y1, INT.z1 - 0.9]]);
    const lab = new THREE.MeshStandardMaterial({ map: textTexture(['SEALED  ·  KBr/Ge'], { w: 512, h: 96, bg: '#c4c9cf', fg: '#2c3138', font: '600 44px Segoe UI' }) });
    tapa.add(mesh(new THREE.PlaneGeometry(4.2, 0.8), lab, [cx, INT.y1 + 0.005, cz + 1.6], [-Math.PI / 2, 0, 0]));
  }
  {
    const g = makePart(A, 'divisor_haz', L2([0, 5, 0]));
    // divisor de KBr con recubrimiento de Ge (cara hacia la entrada) y compensador de KBr paralelo, en el lado del brazo transmitido
    g.add(disco(1.4, 0.25, ge, B, NBS, 48));
    const C = B.clone().addScaledVector(NBS, -0.5);
    g.add(disco(1.4, 0.25, kbr, C, NBS, 48));
    aro(g, B, NBS, 1.47); aro(g, C, NBS, 1.47);
    const m = B.clone().addScaledVector(NBS, -0.25);
    g.add(mesh(rbox(0.5, Y0 - 1.5 - yBase, 0.5, 0.08), M.anodizado, [m.x, (Y0 - 1.5 + yBase) / 2, m.z]));
    g.add(mesh(rbox(1.4, 0.3, 1.4, 0.08), M.anodizado, [m.x, yBase + 0.15, m.z]));
    refs.divisor = g;
  }
  {
    const g = makePart(A, 'espejo_fijo', L2([0, 2, -2]));
    espejo(g, MF, R.clone().negate(), 1.25, cara);
    // tres actuadores piezoeléctricos (alineación dinámica) entre el espejo y su placa de montaje
    for (let k = 0; k < 3; k++) {
      const a = Math.PI / 2 + (k * 2 * Math.PI) / 3;
      g.add(mesh(cylZ(0.17, 0.38, 16), M.ceramica, [MF.x + Math.cos(a) * 0.8, Y0 + Math.sin(a) * 0.8, MF.z - 0.42 - 0.19]));
    }
    g.add(mesh(rbox(3.0, 3.0, 0.3, 0.1), M.anodizado, [MF.x, Y0, MF.z - 0.8 - 0.15]));
    g.add(mesh(rbox(0.6, Y0 - 1.5 - yBase, 0.3, 0.08), M.anodizado, [MF.x, (Y0 - 1.5 + yBase) / 2, MF.z - 0.95]));
    refs.espejoFijo = g;
  }
  {
    const g = makePart(A, 'espejo_movil', L2([2.5, 2, 1.5]));
    // carro móvil: espejo, montura y eje que entra en la bobina del accionamiento electromagnético
    const carro = new THREE.Group(); g.add(carro);
    espejo(carro, MM, T.clone().negate(), 1.25, cara);
    const eje = (s0, s1, r, mat) => { const c = MM.clone().addScaledVector(T, (s0 + s1) / 2); carro.add(disco(r, s1 - s0, mat, c, T, 20)); };
    eje(0.42, 1.7, 0.2, M.aceroPulido);
    refs.carro = carro;
    // accionamiento (bobina móvil) fijo
    const c = MM.clone().addScaledVector(T, 1.49);
    g.add(disco(0.85, 0.82, M.anodizado, c, T, 40));
    g.add(disco(0.9, 0.08, M.cobre, MM.clone().addScaledVector(T, 1.12), T, 40));
    g.add(mesh(rbox(0.6, Y0 - 0.85 - yBase, 0.6, 0.08), M.anodizado, [c.x, (Y0 - 0.85 + yBase) / 2, c.z]));
    g.add(mesh(rbox(1.4, 0.3, 1.4, 0.08), M.anodizado, [c.x, yBase + 0.15, c.z]));
  }
  {
    const g = makePart(A, 'laser_ref', L2([0, 3, -1]));
    // diodo láser de semiconductor: emite paralelo al haz IR, 1 cm por encima, desde delante del colimador
    const c = P.clone().addScaledVector(T, 1.45).add(new THREE.Vector3(0, YL, 0));
    g.add(disco(0.3, 0.9, M.aceroPulido, c, T, 24));
    g.add(disco(0.22, 0.08, M.plasticoNegro, P.clone().addScaledVector(T, 1.94).add(new THREE.Vector3(0, YL, 0)), T, 24));
    g.add(mesh(rbox(0.5, INT.y1 - INT.e - (Y0 + YL + 0.25), 0.5, 0.08), M.anodizado, [c.x, (INT.y1 - INT.e + Y0 + YL + 0.25) / 2, c.z]));
    refs.laserIni = P.clone().addScaledVector(T, 2.0).add(new THREE.Vector3(0, YL, 0));
  }
  {
    const g = makePart(A, 'detector_laser', L2([0, 3, 0]));
    // fotodiodos del láser: cuentan las franjas (posición del espejo) y miden la inclinación para la alineación dinámica
    const z = B.z + 2.0, y = Y0 + YL;
    g.add(mesh(rbox(1.3, 1.0, 0.18, 0.05), M.pcb, [B.x, y, z]));
    g.add(mesh(cylZ(0.28, 0.16, 24), M.plasticoNegro, [B.x, y, z - 0.17]));
    g.add(mesh(rbox(0.4, INT.y1 - INT.e - (y + 0.5), 0.3, 0.06), M.anodizado, [B.x, (INT.y1 - INT.e + y + 0.5) / 2, z + 0.02]));
    refs.laserDet = new THREE.Vector3(B.x, y, z - 0.26);
  }
  {
    // cartucho de gel de sílice en la cara trasera de la carcasa (accesible por la ventana de mantenimiento)
    const g = makePart(A, 'desecante', L2([0, 0, -9]));
    const x0 = 15.8, x1 = 18.6, cx = (x0 + x1) / 2, y0 = 10.3, y1 = 14.1, cy = (y0 + y1) / 2;
    g.add(mesh(rbox(x1 - x0, y1 - y0, 1.85, 0.12), M.plasticoNegro, [cx, cy, -9.95 - 0.925]));
    g.add(mesh(rbox(x1 - x0 + 0.4, y1 - y0 + 0.4, 0.2, 0.08), M.anodizado, [cx, cy, -11.9]));
    screws(g, M.tornillo, M.tornilloNegro, 0.15, '-z', [[x0 + 0.05, y0 + 0.05, -12.0], [x1 - 0.05, y0 + 0.05, -12.0], [x0 + 0.05, y1 - 0.05, -12.0], [x1 - 0.05, y1 - 0.05, -12.0]]);
    const ind = new THREE.MeshStandardMaterial({ map: textTexture(['INDICADOR'], { w: 256, h: 96, bg: '#2f6fd6', fg: '#e8f0ff', font: '600 34px Segoe UI' }), roughness: 0.5 });
    g.add(mesh(new THREE.PlaneGeometry(1.8, 0.7), ind, [cx, cy, -12.005], [0, Math.PI, 0]));
  }
  {
    const g = makePart(A, 'espejo_transferencia', L2([0, 0, 8]));
    const n = new THREE.Vector3(-1, 0, -1).normalize();
    espejo(g, FM, n, 1.3, cara);
    poste(g, FM.x - n.x * 0.3, FM.z - n.z * 0.3, 3.4, Y0 - 1.3, 0.28);
    g.add(mesh(rbox(1.6, 0.3, 1.6, 0.08), M.anodizado, [FM.x - n.x * 0.3, 3.55, FM.z - n.z * 0.3]));
  }

  /* ---------------- VENTANAS DEL COMPARTIMENTO ---------------- */
  for (const [id, x, s] of [['ventana_der', (COMP.paredD[0] + COMP.paredD[1]) / 2, 1], ['ventana_izq', (COMP.paredI[0] + COMP.paredI[1]) / 2, -1]]) {
    const g = makePart(A, id, L2([0, 2.5, 0], id === 'ventana_der', { info: 'ventanas' }));
    g.add(mesh(cylX(1.3, 0.2, 40), kbr, [x, Y0, ZH]));
    const r = mesh(new THREE.TorusGeometry(1.42, 0.12, 10, 40), M.anodizado, [x + s * 0.32, Y0, ZH], [0, Math.PI / 2, 0]);
    g.add(r);
  }

  /* ---------------- QATR-S ---------------- */
  const Q = QA.caja, qcx = (Q.x0 + Q.x1) / 2, qcz = (Q.z0 + Q.z1) / 2, qh = Q.y1 - Q.y0, qcy = (Q.y0 + Q.y1) / 2, e = 0.3;
  {
    const g = makePart(A, 'qatr_cuerpo', L2([0, -8, 0], true, { info: 'qatr_s', shell: true }));
    // caja con las bocas de entrada y salida del haz en los laterales
    for (const [x, s] of [[Q.x1 - e / 2, 1], [Q.x0 + e / 2, -1]]) {
      g.add(placaPasos(Q.z1 - Q.z0, qh, e, [[ZH - qcz, Y0 - qcy, 1.1]], blancoQ, [x, qcy, qcz], 'zy', 0.1));
      const boca = M.plasticoNegro.clone(); boca.side = THREE.DoubleSide;
      g.add(mesh(new THREE.CylinderGeometry(1.15, 1.15, 1.0, 40, 1, true), boca, [x + s * 0.65, Y0, ZH], [0, 0, Math.PI / 2]));
      g.add(mesh(new THREE.TorusGeometry(1.2, 0.1, 10, 40), M.plasticoNegro, [x + s * 1.15, Y0, ZH], [0, Math.PI / 2, 0]));
    }
    for (const z of [Q.z0 + e / 2, Q.z1 - e / 2]) g.add(mesh(rbox(Q.x1 - Q.x0 - 2 * e, qh, e, 0.08), blancoQ, [qcx, qcy, z]));
    g.add(mesh(rbox(Q.x1 - Q.x0 - 2 * e, e, Q.z1 - Q.z0 - 2 * e, 0.08), blancoQ, [qcx, Q.y0 + e / 2, qcz]));
    const lab = new THREE.MeshStandardMaterial({ map: textTexture(['QATR-S'], { w: 256, h: 64, bg: '#eceef0', fg: '#3a4048', font: '600 36px Segoe UI' }), roughness: 0.5 });
    g.add(mesh(new THREE.PlaneGeometry(2.6, 0.65), lab, [qcx, Q.y0 + 2.2, Q.z1 + 0.005]));
    g.add(mesh(new THREE.PlaneGeometry(3.2, 0.06), M.plasticoNegro, [qcx, Q.y0 + 3.0, Q.z1 + 0.005]));
  }
  {
    const g = makePart(A, 'qatr_placa', L2([0, 7, 0], false, { info: 'qatr_s', shell: true }));
    // placa superior negra que sustituye a la tapa del compartimento; platina metálica con el prisma en el centro
    const x0 = COMP.paredI[0] + 0.05, x1 = 10.38, z0 = COMP.paredT[0] + 0.05, z1 = 12.38, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
    g.add(placaPasos(x1 - x0, z1 - z0, 0.9, [[XC - cx, ZH - cz, 1.4]], negro, [cx, 19.05, cz], 'xz', 0.3));
    g.add(anillo(2.1, 0.75, 0.2, M.aceroPulido, XC, 19.5, ZH));
    refs.placa = g;
  }
  {
    const g = makePart(A, 'prisma_diamante', L2([0, 4, 0]));
    // prisma de diamante (trapecio invertido): el haz entra perpendicular a una cara inclinada a 45°, llega a la cara superior (en
    // contacto con la muestra) con 45° de incidencia, se refleja totalmente y sale perpendicular a la cara opuesta
    const s = new THREE.Shape(), h = 0.45, a = 0.15;
    s.moveTo(-a, -h); s.lineTo(a, -h); s.lineTo(a + h, 0); s.lineTo(-a - h, 0); s.lineTo(-a, -h);
    const geo = new THREE.ExtrudeGeometry(s, { depth: 0.6, bevelEnabled: false }); geo.translate(0, 0, -0.3);
    g.add(mesh(geo, diamante, [XC, YPR, ZH]));
    // asiento del prisma (soldado a la platina)
    const asiento = M.aceroOscuro.clone(); asiento.side = THREE.DoubleSide;
    g.add(mesh(new THREE.CylinderGeometry(0.72, 0.72, 0.4, 40, 1, true), asiento, [XC, 19.2, ZH]));
  }
  {
    const g = makePart(A, 'optica_atr', L2([0, 1.5, 0]));
    // M1 y M4: planos a 45°; M2 y M3: espejos de enfoque que concentran el haz en el prisma
    const n1 = new THREE.Vector3(1, 1, 0).normalize(), n4 = new THREE.Vector3(-1, 1, 0).normalize();
    const n2 = new THREE.Vector3(-0.924, -0.383, 0).normalize(), n3 = new THREE.Vector3(0.924, -0.383, 0).normalize();
    espejo(g, QA.M1, n1, 0.8, cara); espejo(g, QA.M4, n4, 0.8, cara);
    espejo(g, QA.M2, n2, 0.8, oro); espejo(g, QA.M3, n3, 0.8, oro);
    // M1 y M4 apoyados en el fondo de la caja; M2 y M3 colgados de la placa superior (postes en el centro de la montura)
    const cm = (p, n) => p.clone().addScaledVector(n, -0.27);
    for (const [p, n] of [[QA.M1, n1], [QA.M4, n4]]) { const c = cm(p, n); poste(g, c.x, ZH, Q.y0 + e, c.y - 0.2, 0.18); }
    for (const [p, n] of [[QA.M2, n2], [QA.M3, n3]]) { const c = cm(p, n); poste(g, c.x, ZH, c.y + 0.36, Q.y1, 0.18); }
  }
  {
    const g = makePart(A, 'abrazadera', L2([0, 13, 0]));
    // abrazadera de presión: columna trasera, brazo, husillo con pomo moleteado y yunque sobre el prisma
    const zc = ZH - 4.0, yT = 19.5;
    g.add(mesh(cylY(0.85, 0.3, 32), M.aceroPulido, [XC, yT + 0.15, zc]));
    g.add(mesh(cylY(0.42, 3.4, 24), M.aceroPulido, [XC, yT + 0.3 + 1.7, zc]));
    g.add(mesh(rbox(1.4, 0.8, 5.1, 0.2), M.aceroPulido, [XC, 23.0, (zc + ZH) / 2 + 0.05]));
    g.add(mesh(cylY(0.17, 2.4, 16), M.acero, [XC, 20.4 + 1.2, ZH]));
    g.add(mesh(cylY(0.42, 0.36, 24), M.aceroPulido, [XC, 20.22, ZH]));
    g.add(mesh(cylY(0.25, 0.2, 24), M.aceroOscuro, [XC, 23.5, ZH]));
    const pomo = M.plasticoNegro.clone(); pomo.roughness = 0.6;
    g.add(mesh(cylY(1.15, 1.5, 40), pomo, [XC, 23.6 + 0.75, ZH]));
    for (let k = 0; k < 18; k++) {
      const a = (k / 18) * Math.PI * 2;
      g.add(mesh(box(0.16, 1.2, 0.16), pomo, [XC + Math.cos(a) * 1.17, 24.35, ZH + Math.sin(a) * 1.17], [0, -a, 0]));
    }
    g.add(mesh(cylY(0.9, 0.08, 40), M.aceroPulido, [XC, 25.14, ZH]));
  }

  /* ---------------- DETECCIÓN ---------------- */
  {
    const g = makePart(A, 'espejo_elipsoidal', L2([-2, 1, 2]));
    const n = new THREE.Vector3(1, 0, -1).normalize();
    espejo(g, EM, n, 1.3, oro);
    poste(g, EM.x - n.x * 0.3, EM.z - n.z * 0.3, 3.4, Y0 - 1.3, 0.28);
    g.add(mesh(rbox(1.6, 0.3, 1.6, 0.08), M.anodizado, [EM.x - n.x * 0.3, 3.55, EM.z - n.z * 0.3]));
  }
  {
    const g = makePart(A, 'detector', L2([-1, 0, -2]));
    // cápsula del DLATGS con ventana, módulo Peltier y disipador; escuadra hasta el chasis
    g.add(mesh(cylZ(0.6, 0.8, 32), M.aceroPulido, [DET.x, Y0, DET.z - 0.4]));
    g.add(mesh(cylZ(0.72, 0.12, 32), M.aceroPulido, [DET.x, Y0, DET.z - 0.62]));
    const ven = kbr.clone(); ven.opacity = 0.5; ven.color.setHex(0xd8e2ea);
    g.add(mesh(cylZ(0.34, 0.06, 32), ven, [DET.x, Y0, DET.z + 0.03]));
    g.add(mesh(rbox(2.0, 2.0, 0.8, 0.12), M.anodizado, [DET.x, Y0, DET.z - 1.2]));
    g.add(mesh(box(1.9, 0.12, 0.7), M.ceramica, [DET.x, Y0 - 1.06, DET.z - 1.2]));
    g.add(mesh(rbox(1.0, Y0 - 1.12 - 3.4, 0.8, 0.1), M.anodizado, [DET.x, (Y0 - 1.12 + 3.4) / 2, DET.z - 1.2]));
    g.add(mesh(rbox(1.8, 0.3, 1.6, 0.08), M.anodizado, [DET.x, 3.55, DET.z - 1.2]));
    refs.detVentana = new THREE.Vector3(DET.x, Y0, DET.z + 0.06);
    refs.detector = g;
  }
  {
    const g = makePart(A, 'preamplificador', L2([-1, 0, -4]));
    const z = DET.z - 1.875;
    g.add(mesh(rbox(5.4, 5.8, 0.15, 0.05), M.pcb, [DET.x, Y0, z]));
    for (const [dx, dy] of [[-0.75, -0.75], [0.75, -0.75], [-0.75, 0.75], [0.75, 0.75]]) g.add(mesh(cylZ(0.1, 0.2, 10), M.aceroPulido, [DET.x + dx, Y0 + dy, z + 0.175]));
    for (const [dx, dy, w, h] of [[-1.6, 1.6, 1.0, 1.0], [1.2, 1.4, 1.4, 0.8], [-1.0, -1.5, 0.8, 0.8], [1.4, -1.0, 0.7, 1.2]]) g.add(mesh(box(w, h, 0.18), M.chip, [DET.x + dx, Y0 + dy, z - 0.165]));
    for (let i = 0; i < 3; i++) g.add(mesh(cylZ(0.22, 0.6, 16), M.condensador, [DET.x - 1.9 + i * 0.6, Y0 - 2.1, z - 0.375]));
    g.add(mesh(rbox(1.2, 0.5, 0.4, 0.06), M.plasticoNegro, [-13.5, Y0 - 2.6, z - 0.275]));
    refs.conPre = new THREE.Vector3(-13.5, Y0 - 2.6, z - 0.475);
  }

  /* ---------------- HACES (efecto de simulación) ---------------- */
  const hazIR = M.haz.clone(); hazIR.color.setHex(0xff6a3d);
  const hazMod = M.haz.clone(); hazMod.color.setHex(0xff4d2e);
  const hazL = M.haz.clone(); hazL.color.setHex(0xd81b3a);
  const tramos = (pts, r, mat) => { const out = []; for (let i = 0; i < pts.length - 1; i++) { const m = segHaz(pts[i], pts[i + 1], r, mat); A.add(m); out.push(m); } return out; };
  refs.haces = {
    entrada: tramos(CAMINO.entrada, 0.42, hazIR),
    brazos: [...tramos(CAMINO.brazoFijo, 0.42, hazIR), ...tramos(CAMINO.brazoMovil, 0.42, hazIR)],
    salida: tramos(CAMINO.salida, 0.38, hazMod),
    transmision: tramos(CAMINO.transmision, 0.38, hazMod),
    laser: [
      ...tramos([refs.laserIni, B.clone().add(new THREE.Vector3(0, YL, 0))], 0.05, hazL),
      ...tramos([B.clone().add(new THREE.Vector3(0, YL, 0)), MF.clone().add(new THREE.Vector3(0, YL, 0))], 0.05, hazL),
      ...tramos([B.clone().add(new THREE.Vector3(0, YL, 0)), MM.clone().add(new THREE.Vector3(0, YL, 0))], 0.05, hazL),
      ...tramos([B.clone().add(new THREE.Vector3(0, YL, 0)), refs.laserDet], 0.05, hazL),
    ],
  };
  refs.matHaz = { ir: hazIR, mod: hazMod, laser: hazL };
  // muestra en el portamuestras de transmisión (solo se ve en la simulación, con la técnica de transmisión)
  {
    const pel = new THREE.MeshStandardMaterial({ color: 0xd9c9a3, transparent: true, opacity: 0.85, roughness: 0.4 });
    const soporte = M.anodizado.clone();
    const t = new THREE.Group(); A.add(t);
    const y1 = Y0 + 2.6, cy = (COMP.y0 + y1) / 2;
    t.add(placaPasos(5.0, y1 - COMP.y0, 0.4, [[0, Y0 - cy, 1.2]], soporte, [XC, cy, ZH], 'zy', 0.15));
    t.add(mesh(cylX(1.6, 0.12, 40), pel, [XC + 0.26, Y0, ZH]));
    t.traverse((o) => { if (o.isMesh) { o.userData.noClone = true; o.raycast = () => {}; } });
    t.visible = false;
    refs.portaTrans = t;
  }
  refs.group = A;
  return refs;
}
