// Equipo completo LCMS-9050: mueble de pie esbelto (≈ 670 × 1250 × 1450 mm, dato del LCMS-9030), unidad de ionización en la parte
// alta del frontal, cámara de vacío, tubo de vuelo vertical termostatizado, turbos, bomba rotatoria, electrónica y Nexera (contexto).
import * as THREE from 'three';
import { M, ribTexture } from '../../materials.js';
import { mesh, rbox, box, cylX, cylY, cylZ, washerX, tubePath, grilleTexture, textTexture, screws, screenTexture, plateTexture, warningTexture, placaPasos } from '../../geom.js';
import { makePart, cableFlex } from '../../parts.js';
import { buildAnalizador } from './analizador.js';
import { ORIGEN, AX } from './geometria.js';

const L1 = (offset, extra = {}) => ({ level: 1, offset, mode: 'equipo', ...extra });
const XW = 33.5, ZF = 62.5, ZB = -62.5, H = 145;
/** Punto local del analizador → mundo (giro de 90° en Y: x local → −z mundo, z local → +x mundo). */
const W = (x, y, z = 0) => new THREE.Vector3(ORIGEN.x + z, ORIGEN.y + y, ORIGEN.z - x);
const KF = [4, 9.5, 15], KY = 10;                    // pasos KF de vacío previo en el panel trasero (x) y su altura
const YH = 134;                                      // suelo del alojamiento de la sonda (parte alta de la unidad de ionización)

export function buildEquipo(root) {
  const refs = {};
  const grille = grilleTexture(24, 8);
  const blanco = M.grisClaro.clone(); blanco.color.setHex(0xe6e8eb);
  const gris = M.carcasaOsc.clone(); gris.color.setHex(0x3a3f46);

  /* ---------------- MUEBLE ---------------- */
  {
    const g = makePart(root, 'chasis', L1([0, 0, 0]));
    g.add(mesh(rbox(XW * 2 - 0.3, 5, ZF - ZB - 0.3, 0.5), gris, [0, 2.5, 0]));   // algo menor que la envolvente: sin caras coplanares con los paneles
    for (const x of [-XW + 5, XW - 5]) for (const z of [ZB + 6, ZF - 6]) g.add(mesh(cylY(2, 1.2, 24), M.goma, [x, 0.6, z]));
    for (const x of [-XW + 2.5, XW - 2.5]) for (const z of [ZB + 3, ZF - 3]) g.add(mesh(box(3, H - 6, 3), M.aluminio, [x, H / 2, z]));
  }
  {
    const g = makePart(root, 'panel_frontal', L1([0, 0, 40], { shell: true, label: 'equipo' }));
    g.add(mesh(rbox(XW * 2 - 0.4, 92, 1.2, 0.6), blanco, [0, 48, ZF - 0.6]));
    g.add(mesh(rbox(XW * 2 - 0.9, 6, 1.7, 0.5), gris, [0, 9, ZF - 0.45]));
    const lab = new THREE.MeshStandardMaterial({ map: textTexture(['LCMS-9050'], { bg: '#e6e8eb', fg: '#2a3038', font: '600 64px Segoe UI' }), roughness: 0.45 });
    g.add(mesh(new THREE.PlaneGeometry(16, 4), lab, [12, 86, ZF + 0.03]));
    const lab2 = new THREE.MeshStandardMaterial({ map: textTexture(['Q-TOF LC/MS'], { bg: '#e6e8eb', fg: '#6b7480', font: '500 44px Segoe UI' }), roughness: 0.45 });
    g.add(mesh(new THREE.PlaneGeometry(14, 3.5), lab2, [12, 81.5, ZF + 0.03]));
    [M.ledVerde, M.ledVerde, M.ledVerde, M.ledVerde, M.ledAmbar].forEach((mt, i) => g.add(mesh(cylZ(0.35, 0.3, 16), mt, [-26 + i * 3.2, 88, ZF + 0.15])));
    const gm = blanco.clone(); gm.map = grille; gm.color.setHex(0xa9aeb5);
    g.add(mesh(new THREE.PlaneGeometry(56, 14), gm, [0, 24, ZF + 0.03]));
    // panel superior con hueco para la unidad de ionización
    const up = new THREE.Shape(); up.moveTo(-XW + 0.2, 94.6); up.lineTo(XW - 0.2, 94.6); up.lineTo(XW - 0.2, H - 0.6); up.lineTo(-XW + 0.2, H - 0.6);
    const hu = new THREE.Path(); hu.moveTo(-24.3, 96.6); hu.lineTo(-24.3, H - 1.6); hu.lineTo(4.3, H - 1.6); hu.lineTo(4.3, 96.6); up.holes.push(hu);
    g.add(mesh(new THREE.ExtrudeGeometry(up, { depth: 1.0, bevelEnabled: true, bevelThickness: 0.1, bevelSize: 0.1, bevelSegments: 1 }), blanco, [0, 0, ZF - 1.1]));
    g.add(mesh(box(XW * 2 - 0.6, 0.5, 0.4), gris, [0, 94.3, ZF - 0.2]));
  }
  for (const [id, s] of [['panel_izq', -1], ['panel_der', 1]]) {
    const g = makePart(root, id, L1([s * 28, 0, 0], { info: 'carcasa', shell: true }));
    g.add(mesh(rbox(1.0, H - 6, ZF - ZB - 2.4, 0.4), blanco, [s * (XW - 0.5), H / 2 + 0.5, 0]));
    g.add(mesh(box(0.2, 1.4, ZF - ZB - 3), gris, [s * (XW + 0.02), 96, 0]));
    const gm = blanco.clone(); gm.map = grille; gm.color.setHex(0xa9aeb5);
    g.add(mesh(new THREE.PlaneGeometry(60, 16), gm, [s * (XW + 0.03), 30, -20], [0, s * Math.PI / 2, 0]));
    screws(g, M.tornillo, M.tornilloNegro, 0.3, s > 0 ? 'x' : '-x', [[s * (XW + 0.02), H - 6, ZB + 5], [s * (XW + 0.02), H - 6, ZF - 5], [s * (XW + 0.02), 10, ZB + 5], [s * (XW + 0.02), 10, ZF - 5]]);
  }
  {
    const g = makePart(root, 'tapa_superior', L1([0, 34, 0], { info: 'carcasa', shell: true }));
    g.add(mesh(rbox(XW * 2 + 0.2, 1.4, ZF - ZB + 0.2, 0.6), gris, [0, H + 0.2, 0]));
  }
  {
    const g = makePart(root, 'panel_trasero', L1([0, 0, -40], { info: 'carcasa', shell: true }));
    // panel con tres pasos KF (vacío previo de la 1.ª cámara y de las dos turbos)
    g.add(placaPasos(XW * 2 - 0.4, H - 6, 1.0, KF.map((x) => [x, KY - (H / 2 + 0.5), 1.4]), blanco, [0, H / 2 + 0.5, ZB + 0.5], 'xy', 0.4));
    const kf = new THREE.LatheGeometry([[1.0, -1.2], [2.2, -1.2], [2.2, -0.45], [1.35, -0.45], [1.35, 0.45], [2.0, 0.45], [2.0, 1.0], [1.0, 1.0], [1.0, -1.2]]
      .map(([r, y]) => new THREE.Vector2(r, y)), 40);
    kf.rotateX(Math.PI / 2);
    for (const x of KF) {
      g.add(mesh(kf, M.aceroPulido, [x, KY, ZB + 0.5]));
      g.add(mesh(cylZ(0.9, 3.5, 28), M.aceroPulido, [x, KY, ZB - 1.15]));          // manguito pasante hasta el colector
      g.add(mesh(new THREE.TorusGeometry(1.0, 0.24, 8, 24), M.aceroPulido, [x, KY, ZB - 2.2]));
    }
    // colector exterior: une los tres pasos y sale hacia la bomba rotatoria
    g.add(mesh(cylX(1.25, KF[2] - KF[0] + 3.3, 32), M.aceroPulido, [(KF[0] + KF[2]) / 2 + 0.05, KY, ZB - 4]));
    g.add(mesh(new THREE.TorusGeometry(1.35, 0.26, 8, 24), M.aceroPulido, [KF[2] + 1.5, KY, ZB - 4], [0, Math.PI / 2, 0]));
    const plate = new THREE.MeshStandardMaterial({ map: plateTexture(['LCMS Q-TOF', '230 V~ 50/60 Hz 15 A', 'Modelo didáctico', 'Explorador 3D']), metalness: 0.6, roughness: 0.4 });
    g.add(mesh(new THREE.PlaneGeometry(9, 4.5), plate, [10, 70, ZB - 0.03], [0, Math.PI, 0]));
    g.add(mesh(rbox(4, 3, 1.2, 0.3), M.plasticoNegro, [-16, 16, ZB - 0.6]));
    g.add(mesh(tubePath([[-16, 16, ZB - 1.2], [-16, 16, ZB - 5], [-18, 10, ZB - 10], [-21, 0.7, ZB - 16], [-30, 0.7, ZB - 34]], 0.45, 40, 10), M.cable));
    for (const [x, lbl] of [[0, 'N2'], [6, 'Air'], [12, 'Ar']]) {
      g.add(mesh(cylZ(0.7, 2.4, 24), M.aceroPulido, [x, 40, ZB - 1.2]));
      g.add(mesh(cylZ(0.6, 0.6, 6), M.aceroPulido, [x, 40, ZB + 1.3]));            // tuerca interior
      const t = new THREE.MeshStandardMaterial({ map: textTexture([lbl], { w: 128, h: 64, bg: '#e6e8eb', fg: '#2a3038', font: '600 40px Segoe UI' }) });
      g.add(mesh(new THREE.PlaneGeometry(2.4, 1.2), t, [x, 37.6, ZB - 0.03], [0, Math.PI, 0]));
    }
  }

  /* ---------------- UNIDAD DE IONIZACIÓN ---------------- */
  {
    const g = makePart(root, 'unidad_ionizacion', L1([-24, 0, 0], { shell: true, label: 'equipo' }));
    // cuerpo inferior y, encima, alojamiento de la sonda abierto por delante (techo, laterales y fondo):
    // el cabezal de la sonda y su conexión PEEK quedan accesibles desde el frontal
    const ux = ORIGEN.x + 2, uz = ZF - 5;
    g.add(mesh(rbox(28, YH - 97, 18, 0.8), gris, [ux, (YH + 97) / 2, uz]));
    g.add(mesh(rbox(28, 1.0, 18, 0.3), gris, [ux, 142.5, uz]));
    for (const s of [-1, 1]) g.add(mesh(rbox(1.0, 142.2 - YH + 0.2, 18, 0.3), gris, [ux + s * 13.5, (142.2 + YH - 0.2) / 2, uz]));
    g.add(mesh(rbox(26.4, 142.2 - YH + 0.2, 1.0, 0.3), gris, [ux, (142.2 + YH - 0.2) / 2, uz - 8.5]));
    // colector de entrada de N₂ (nebulizador, calentamiento y secado) en la cara posterior
    g.add(mesh(rbox(4, 3.6, 1.2, 0.2), M.aceroPulido, [ux - 11, 128, uz - 9.55]));
    g.add(mesh(cylZ(0.4, 0.6, 6), M.aceroPulido, [ux - 11, 128, uz - 10.4]));
    const fr = new THREE.Shape(); fr.moveTo(-8, -8); fr.lineTo(8, -8); fr.lineTo(8, 8); fr.lineTo(-8, 8);
    const hl = new THREE.Path(); hl.moveTo(-6.5, -6.5); hl.lineTo(-6.5, 6.5); hl.lineTo(6.5, 6.5); hl.lineTo(6.5, -6.5); fr.holes.push(hl);
    g.add(mesh(new THREE.ExtrudeGeometry(fr, { depth: 0.6, bevelEnabled: true, bevelThickness: 0.15, bevelSize: 0.15, bevelSegments: 2 }), M.aceroOscuro, [ORIGEN.x + 2, ORIGEN.y - 2, ZF + 4]));
    // paso de la sonda en el suelo del alojamiento
    g.add(mesh(cylY(2.8, 1.2, 36), M.aceroPulido, [W(AX.SPRAY.x, 0).x, YH + 0.4, W(AX.SPRAY.x, 0).z]));
    const w = new THREE.MeshStandardMaterial({ map: warningTexture('ALTA TENSIÓN · CALIENTE'), roughness: 0.45 });
    g.add(mesh(new THREE.PlaneGeometry(9, 3.4), w, [ORIGEN.x + 2, 128, ZF + 4.05]));
  }
  {
    const g = makePart(root, 'ventana_fuente', L1([0, 0, 16], { shell: true, label: 'equipo' }));
    const gl = M.vidrio.clone(); gl.opacity = 0.22;
    g.add(mesh(rbox(13.4, 13.4, 0.5, 0.2), gl, [ORIGEN.x + 2, ORIGEN.y - 2, ZF + 4.4]));
    g.add(mesh(rbox(2.2, 4, 1.2, 0.4), M.aceroPulido, [ORIGEN.x + 11.3, ORIGEN.y - 2, ZF + 4.8]));
  }

  /* ---------------- VACÍO ---------------- */
  {
    const g = makePart(root, 'camara_vacio', L1([0, 0, 0], { shell: true, label: 'equipo' }));
    const a = W(AX.CAP0 + 9, 0), b = W(AX.TR_1 + 2, 0);
    g.add(mesh(rbox(12, 12, a.z - b.z, 0.6), M.aluminio, [ORIGEN.x, ORIGEN.y, (a.z + b.z) / 2]));
    const t0 = W(AX.TOF_X0 - 1, 0), t1 = W(AX.TOF_X1 + 1, 0);
    // cámara del TOF algo más estrecha y baja que la principal (sin caras coplanares en el solape)
    g.add(mesh(rbox(11.6, 9.6, t0.z - t1.z, 0.6), M.aluminio, [ORIGEN.x, ORIGEN.y + 0.8, (t0.z + t1.z) / 2]));
    const rp = W(AX.QA_0 + 3, -7.5);
    g.add(mesh(cylY(1.3, 3.4, 32), M.aceroPulido, [rp.x, rp.y + 1.5, rp.z]));
    // paso del gas de colisión (Ar) en la tapa, sobre la entrada de la celda
    const pa = W(AX.C_0 + 2, 6);
    g.add(mesh(cylY(0.5, 1.0, 6), M.aceroPulido, [pa.x, pa.y + 0.4, pa.z]));
  }
  {
    const g = makePart(root, 'bombas_turbo', L1([24, 0, 0], { label: 'equipo' }));
    // turbo de tres entradas bajo la óptica y turbo simple junto al tubo de vuelo
    const y = ORIGEN.y - 17, za = W(AX.UL_0, 0).z, zb = W(AX.C_1, 0).z;
    g.add(mesh(cylZ(5.4, za - zb, 48), M.aluminio, [ORIGEN.x, y, (za + zb) / 2]));
    // entradas: del techo de la turbo hasta la base de la cámara (ligeramente embutidas en ambas)
    for (const lx of [AX.UL_0 + 4, AX.Q_0 + 8, AX.C_0 + 4]) { const p = W(lx, 0); g.add(mesh(cylY(2.2, 7.7, 32), M.aceroPulido, [p.x, ORIGEN.y - 9.75, p.z])); }
    g.add(mesh(rbox(8, 6, 10, 0.5), M.anodizado, [ORIGEN.x, y - 8.3, 4]));            // controlador, bajo la turbo
    g.add(mesh(cylY(1.2, 3.0, 28), M.aceroPulido, [ORIGEN.x, y - 6.7, za - 4.2]));      // salida de vacío previo
    // turbo del TOF: embridada en el costado del tubo de vuelo
    const tz = W(AX.TOF_X1 - 3, 0).z;
    g.add(mesh(cylX(4.2, 12, 40), M.aluminio, [ORIGEN.x + 12, ORIGEN.y - 8, tz]));
    g.add(mesh(cylX(4.6, 1.4, 40), M.aceroOscuro, [ORIGEN.x + 5.1, ORIGEN.y - 8, tz]));
    g.add(mesh(cylX(1.0, 2.5, 28), M.aceroPulido, [ORIGEN.x + 19.2, ORIGEN.y - 9.5, tz]));   // salida de vacío previo
  }
  {
    const g = makePart(root, 'bomba_rotatoria', L1([14, 0, -10], { label: 'equipo' }));
    const cx = 52, cz = -78;
    g.add(mesh(rbox(16, 18, 20, 0.8), blanco, [cx + 4, 10, cz]));
    g.add(mesh(cylX(9, 20, 48), M.anodizado, [cx - 11, 11, cz]));
    for (let i = 0; i < 10; i++) g.add(mesh(washerX(9.6, 8.8, 0.35), M.anodizado, [cx - 20 + i * 2, 11, cz]));
    g.add(mesh(cylY(1.6, 3.4, 32), M.aceroPulido, [cx + 4, 20.6, cz]));
    for (const x of [cx - 16, cx + 9]) for (const z of [cz - 8, cz + 8]) g.add(mesh(cylY(1.0, 1.0, 16), M.goma, [x, 0.5, z]));
    g.add(mesh(cylY(2.4, 0.6, 32), M.aceroPulido, [cx + 4, 22.4, cz]));               // brida KF de entrada
  }
  {
    // Mangueras KF: 1.ª cámara y salidas de las dos turbos → bajan por el hueco frontal inferior → suelo → pasos del panel trasero
    // → colector exterior → bomba rotatoria. Cada tramo sigue a la pieza a la que va unido al desmontar.
    const g = makePart(root, 'linea_vacio', L1([0, 0, 0], { info: 'bomba_rotatoria' }));
    const mat = M.aceroOscuro.clone(); mat.color.setHex(0xb3b8be); mat.roughness = 0.32; mat.roughnessMap = null; mat.bumpMap = ribTexture(160); mat.bumpScale = 3;
    const T = 'bombas_turbo', P = 'panel_trasero', R = 'bomba_rotatoria', o = { seg: 140, radial: 12 };
    const fin = (x) => [[x, KY - 0.5, -52], [x, KY, ZB + 2.5, P], [x, KY, ZB + 0.3, P]];
    cableFlex(g, [[-12, 108.4, 37.4], [-12, 104, 38.6], [-11, 96, 39.2], [-6, 60, 40], [2, 20, 36], [KF[0], KY - 1, 20], [KF[0], KY - 1.5, -20], ...fin(KF[0])], 0.8, mat, o);
    cableFlex(g, [[-12, 91, 27, T], [-12, 88.5, 27.6, T], [-4, 60, 34, T], [8, 20, 32], [KF[1], KY - 1, 18], [KF[1], KY - 1.5, -20], ...fin(KF[1])], 0.8, mat, o);
    cableFlex(g, [[8.3, 106.5, -36, T], [10.5, 106, -36, T], [14, 95, -44, T], [15, 50, -50], [15, 20, -52], [KF[2], KY, -56], [KF[2], KY, ZB + 2.5, P], [KF[2], KY, ZB + 0.3, P]], 0.8, mat, o);
    cableFlex(g, [[KF[2] + 1.6, KY, ZB - 4, P], [KF[2] + 4.5, KY, ZB - 4, P], [25, 12, ZB - 4.5, P], [36, 24, ZB - 4.5, P], [43, 30, -71, R], [52, 27.5, -75, R], [56, 26.5, -77.2, R], [56, 22.5, -78, R]], 0.9, mat, o);
  }

  /* ---------------- ELECTRÓNICA ---------------- */
  {
    const g = makePart(root, 'control_termico', L1([30, 0, 0], { label: 'equipo' }));
    g.add(mesh(rbox(12, 26, 18, 0.5), M.anodizado, [20, 60, -30]));
    for (let i = 0; i < 8; i++) g.add(mesh(box(0.6, 0.35, 16), M.aluminio, [26.3, 50 + i * 2.6, -30]));
    // cables a los sensores de temperatura de la camisa del UF-FlightTube (siguen al tubo de vuelo)
    const sx = W(AX.TOF_X1 + 1.2, 0, 3).x + 0.55, sz = W(AX.TOF_X1 + 1.2, 0).z;
    [[50, 38], [60, 65], [70, 92]].forEach(([y0, yy]) => cableFlex(g, [[14.2, y0, -30], [11, y0 - 0.5, -31.5], [4, (y0 + yy) / 2, -38], [-4, yy + 0.3, -41.6, 'tubo_vuelo'],
      [sx + 0.9, yy, sz - 0.2, 'tubo_vuelo'], [sx - 0.1, yy, sz, 'tubo_vuelo']], 0.18, M.cable, { seg: 48, radial: 8 }));
  }
  {
    // separada del tubo de vuelo (antes lo invadía)
    const g = makePart(root, 'electronica', L1([-28, 0, 0], { label: 'equipo' }));
    g.add(mesh(rbox(10, 50, 40, 0.5), M.anodizado, [-23.5, 40, -30]));
    const w = new THREE.MeshStandardMaterial({ map: warningTexture('ALTA TENSIÓN'), roughness: 0.45 });
    g.add(mesh(new THREE.PlaneGeometry(9, 3.4), w, [-18.45, 52, -30], [0, Math.PI / 2, 0]));
    g.add(mesh(rbox(0.3, 30, 34, 0.06), M.pcb, [-18.3, 30, -30]));
  }
  {
    const g = makePart(root, 'linea_gases', L1([0, 14, 0], { label: 'equipo' }));
    const P = 'panel_trasero', U = 'unidad_ionizacion', C = 'camara_vacio', pa = W(AX.C_0 + 2, 6);
    // N₂: sube por detrás, cruza por encima de la cámara de vacío y entra por el colector posterior de la unidad de ionización
    cableFlex(g, [[0, 40, ZB + 1.4, P], [0, 40.5, ZB + 3.2, P], [0, 80, -55], [0, 126, -53], [-2, 130, -20], [-14, 131, 20],
      [-20.5, 129, 44, U], [-21, 128, 46.9, U]], 0.25, M.ptfe, { seg: 80, radial: 8 });
    // Ar: hasta el paso de la tapa de la cámara, encima de la entrada de la celda de colisión
    cableFlex(g, [[12, 40, ZB + 1.4, P], [12, 40.5, ZB + 3.2, P], [12, 70, -54], [12, 104, -48], [4, 120, -30], [-3, 125, pa.z - 1.5, C],
      [pa.x + 0.6, 124.2, pa.z, C], [pa.x, 123.4, pa.z, C], [pa.x, 122.8, pa.z, C]], 0.15, M.cobre, { seg: 80, radial: 8 });
  }

  /* ---------------- NEXERA (contexto) ---------------- */
  {
    const g0 = makePart(root, 'lc', L1([30, 0, 0], { shell: true, label: 'equipo' }));
    // torre Nexera a la derecha del espectrómetro, alineada con el frontal
    const cx = 66, Wd = 26, D = 50, zc = ZF - D / 2;
    const g = new THREE.Group(); g.position.z = zc; g0.add(g);
    const mod = (y0, h, extra) => {
      g.add(mesh(rbox(Wd, h - 0.4, D, 0.6), M.grisClaro, [cx, y0 + h / 2, 0]));
      g.add(mesh(rbox(Wd - 1, 1.2, 0.5, 0.2), M.carcasaOsc, [cx, y0 + h - 1.6, D / 2 + 0.1]));
      g.add(mesh(box(1.6, 0.35, 0.2), M.ledVerde, [cx + Wd / 2 - 3.2, y0 + h - 1.6, D / 2 + 0.42]));
      if (extra) extra(y0, h);
    };
    mod(0, 40, (y0, h) => g.add(mesh(rbox(Wd - 3, h - 9, 0.6, 0.4), M.carcasaOsc, [cx, y0 + h / 2 - 2, D / 2 + 0.2])));
    mod(40, 22, (y0, h) => { g.add(mesh(rbox(Wd - 3, h - 6, 0.8, 0.4), M.grisClaro, [cx, y0 + h / 2 - 1, D / 2 + 0.3])); g.add(mesh(cylX(0.55, 12, 24), M.aceroPulido, [cx, y0 + h / 2, D / 2 - 6])); });
    mod(62, 14, (y0, h) => { for (const x of [cx - 6, cx + 6]) g.add(mesh(cylZ(1.4, 1.2, 24), M.aceroPulido, [x, y0 + h / 2 - 1, D / 2 + 0.4])); });
    mod(76, 14, null);
    g.add(mesh(rbox(Wd, 1.2, D - 6, 0.4), M.grisClaro, [cx, 90.6, 0]));
    for (let i = 0; i < 4; i++) { const x = cx - 8.4 + i * 5.6;
      g.add(mesh(cylY(2.4, 17, 32), M.vidrio, [x, 99.7, 4])); g.add(mesh(cylY(2.25, 11, 32), M.disolvente, [x, 96.8, 4])); g.add(mesh(cylY(1.2, 2.2, 24), M.peekBeige, [x, 109.2, 4])); }
    // racor de salida de la columna en el lateral izquierdo del horno
    g.add(mesh(cylX(0.45, 0.9, 6), M.aceroPulido, [cx - Wd / 2 - 0.35, 51, D / 2 - 6]));
  }
  {
    // PEEK: lateral del horno → sube por el hueco entre LC y espectrómetro → cruza el frontal (va con el panel frontal al
    // desmontar, y pasa por su hueco) → entra por la abertura del alojamiento de la sonda → entrada del cabezal de la sonda
    const g = makePart(root, 'tubo_muestra', L1([0, 0, 0], { info: 'lc' }));
    const F = 'panel_frontal', S = 'sonda_esi', p = W(AX.SPRAY.x, 0), zo = ZF - 25 + 19;
    cableFlex(g, [[52.4, 51, zo, 'lc'], [51.2, 51.4, zo + 0.7, 'lc'], [45, 56, 62, 'lc'], [43.5, 70, 64.2, 'lc'], [43, 124, 65, 'lc'],
      [36, 131, 67.8, F], [8, 134, 68.5, F], [-6, 138.5, 67.5, F], [-11, 139.6, 62, F],
      [p.x + 0.4, 140.6, p.z + 4.9, S], [p.x, 140.6, p.z + 1.6, S], [p.x, 139.9, p.z, S], [p.x, 139.15, p.z, S]], 0.12, M.peekRojo, { seg: 160, radial: 8 });
  }

  refs.analyzer = buildAnalizador(root);

  // los cables flexibles (cableFlex) se recalculan solos al desmontar
  refs.update = () => {};
  return refs;
}
