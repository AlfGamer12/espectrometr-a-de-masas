// Equipo completo LCMS-8060NX: unidad MS (1180 × 540 × 610 mm: ancho × alto × fondo), unidad de ionización sobre el
// zócalo izquierdo, cámara de vacío, bomba turbomolecular de tres entradas, bomba rotatoria, electrónica, gases y
// cromatógrafo de líquidos Nexera (contexto). Coordenadas de mundo en cm. Frente hacia +Z; LC a la izquierda (-X). Suelo (mesa) en y = 0.
// Acabado como el equipo comercial: negro brillante, banda inferior plateada con barrido en "S", tira de acero cepillado
// con los pilotos de estado, logotipo SHIMADZU a la izquierda y rótulo LCMS-8060NX a la derecha.
import * as THREE from 'three';
import { M, ribTexture } from '../../materials.js';
import { mesh, rbox, box, washerX, cylX, cylY, cylZ, tubePath, grilleTexture, screws, screenTexture, plateTexture, warningTexture, placaPasos, pasamuros } from '../../geom.js';
import { makePart, cableFlex } from '../../parts.js';
import { buildAnalizador } from './analizador.js';
import { ORIGEN, AX } from './geometria.js';

const L1 = (offset, extra = {}) => ({ level: 1, offset, mode: 'equipo', ...extra });
const X0 = -59, X1 = 59, ZB = -30.5, ZF = 30.5, H = 45.5;   // envolvente de la unidad MS (cuerpo principal hasta H)
const XT = -37.4, XI = -52;                                 // caras derecha e izquierda de la unidad de ionización
const YP = 26.5, HT = 52;                                   // zócalo izquierdo y techo de la unidad de ionización
const KF = { x: 44, y: 9 };                                 // pasamuros KF de vacío previo en el panel trasero
const PROBE = { x: ORIGEN.x + AX.SPRAY.x, z: ORIGEN.z };    // eje de la sonda ESI (mundo)
const RAN = { z0: -1.8, z1: 5.8 };                          // ranura de la unidad de ionización (sonda, bloque calefactor y DL)

/* ---------------- Rótulos (canvas con fondo transparente) ---------------- */
function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}
function decal(tex, w, h, pos, rot = [0, 0, 0]) {
  const m = new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: 0.4, metalness: 0 });
  const d = mesh(new THREE.PlaneGeometry(w, h), m, pos, rot); d.castShadow = false;
  return d;
}
/** Marca SHIMADZU: emblema (círculo con cruz) y letras espaciadas, en blanco. */
function logoTex() {
  return canvasTex(1024, 128, (g) => {
    g.strokeStyle = '#f2f3f5'; g.fillStyle = '#f2f3f5'; g.lineWidth = 9;
    g.beginPath(); g.arc(64, 64, 44, 0, Math.PI * 2); g.stroke();
    g.fillRect(56, 30, 16, 68); g.fillRect(30, 56, 68, 16);
    g.font = '700 78px Arial, Segoe UI'; g.textBaseline = 'middle';
    let x = 140; for (const ch of 'SHIMADZU') { g.fillText(ch, x, 68); x += g.measureText(ch).width + 14; }
  });
}
function modeloTex() {
  return canvasTex(1024, 96, (g) => {
    g.textBaseline = 'middle';
    g.fillStyle = '#eceef0'; g.font = '600 56px Segoe UI, Arial'; g.fillText('LCMS-8060NX', 8, 50);
    g.fillStyle = '#9aa0a8'; g.font = '400 26px Segoe UI, Arial'; g.fillText('LIQUID CHROMATOGRAPH MASS SPECTROMETER', 396, 54);
  });
}
function pilotosTex() {
  return canvasTex(1024, 64, (g) => {
    g.fillStyle = '#3c4148'; g.font = '600 26px Arial'; g.textBaseline = 'middle'; g.textAlign = 'center';
    ['POWER', 'VACUUM', 'READY', 'STATUS', 'ERROR'].forEach((t, i) => g.fillText(t, 102 + i * 205, 34));
  });
}
function nexeraTex(texto) {
  return canvasTex(512, 64, (g) => {
    g.fillStyle = '#c9cdd2'; g.font = '500 30px Segoe UI, Arial'; g.textBaseline = 'middle'; g.fillText(texto, 6, 34);
  });
}

/** Perfil en L con esquina redondeada (frente + reborde superior), extruido a lo largo de X entre xa y xb. */
function perfilFrontal(xa, xb, zBack, zFront, yBot, yTop, R, tF, tT, mat) {
  const s = new THREE.Shape(), ri = Math.max(0.05, R - Math.max(tF, tT));
  s.moveTo(zBack, yTop);
  s.lineTo(zFront - R, yTop);
  s.absarc(zFront - R, yTop - R, R, Math.PI / 2, 0, true);
  s.lineTo(zFront, yBot);
  s.lineTo(zFront - tF, yBot);
  s.lineTo(zFront - tF, yTop - tT - ri);
  s.absarc(zFront - tF - ri, yTop - tT - ri, ri, 0, Math.PI / 2, false);
  s.lineTo(zBack, yTop - tT);
  s.lineTo(zBack, yTop);
  const g = new THREE.ExtrudeGeometry(s, { depth: xb - xa, bevelEnabled: false, curveSegments: 18 });
  g.rotateY(-Math.PI / 2);
  g.computeVertexNormals();
  return mesh(g, mat, [xb, 0, 0]);
}
/** Zona clara del frontal: recta a la izquierda bajo la tira cepillada y barrido en "S" hasta la franja inferior derecha. */
function swooshShape(x0, x1, yb, ys, yr, xs, xe) {
  const s = new THREE.Shape();
  s.moveTo(x0, yb); s.lineTo(x1, yb); s.lineTo(x1, yr); s.lineTo(xe, yr);
  s.bezierCurveTo(xe - 10, yr, xs + 8, ys, xs, ys);
  s.lineTo(x0, ys); s.lineTo(x0, yb);
  return s;
}

export function buildEquipo(root) {
  const refs = {};
  const grille = grilleTexture(30, 9);
  const NEGRO = M.negroBrillante;
  const CLARO = new THREE.MeshPhysicalMaterial({ color: 0xd9dce0, metalness: 0.35, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.08 });
  const CEPILLADO = M.acero.clone(); CEPILLADO.color.setHex(0xc9cdd2); CEPILLADO.roughness = 0.3;
  const LED = new THREE.MeshStandardMaterial({ color: 0x35d6c6, emissive: 0x35d6c6, emissiveIntensity: 1.4 });
  const LATERAL_LC = M.grisClaro.clone(); LATERAL_LC.color.setHex(0xc0c4c9);

  /* ---------------- ESTRUCTURA Y CARCASA ---------------- */
  {
    const g = makePart(root, 'chasis', L1([0, 0, 0]));
    g.add(mesh(rbox(X1 - X0 - 2, 1.4, ZF - ZB - 2, 0.3), M.carcasaOsc, [0, 1.9, 0]));
    for (const x of [X0 + 23, X1 - 11]) for (const z of [ZB + 6, ZF - 6]) {
      g.add(mesh(cylY(2.0, 0.9, 32), M.goma, [x, 0.45, z]));
      g.add(mesh(cylY(0.6, 1.0, 6), M.aceroOscuro, [x, 1.3, z]));
    }
  }
  {
    // tapa superior del cuerpo principal (el borde delantero redondeado pertenece al frontal) con trampilla de servicio
    const g = makePart(root, 'carcasa_superior', L1([0, 55, 0], { info: 'carcasa', shell: true }));
    const z0 = ZB - 0.1, z1 = ZF - 3.05;
    g.add(mesh(rbox(X1 - XT - 0.2, 1.2, z1 - z0, 0.5), NEGRO, [(X1 + XT) / 2, H - 0.6, (z0 + z1) / 2]));
    g.add(mesh(rbox(15.7, 0.25, 11, 0.12), M.carcasaOsc, [-20.6, H + 0.1, 20]));
    const gm = NEGRO.clone(); gm.map = grille; gm.color.setHex(0x9aa0a8);
    g.add(mesh(new THREE.PlaneGeometry(30, 10), gm, [30, H + 0.02, -14], [-Math.PI / 2, 0, 0]));
  }
  {
    const g = makePart(root, 'panel_frontal', L1([62, 0, 38], { shell: true, label: 'equipo' }));
    const xa = XT + 0.05, xb = X1 - 1.2;
    g.add(mesh(rbox(xb - xa, H - 8, 1.0, 0.4), NEGRO, [(xa + xb) / 2, 2 + (H - 8) / 2, ZF - 0.5]));
    g.add(perfilFrontal(xa, xb, ZF - 3, ZF, H - 6.2, H, 3, 1.0, 1.2, NEGRO));
    // banda clara con barrido en "S", tira cepillada y línea que continúa hasta el extremo derecho
    const xs = -8, xe = 14, ys = 20.3;
    const sw = new THREE.ExtrudeGeometry(swooshShape(XT + 0.2, xb - 0.2, 2.4, ys, 4.0, xs, xe),
      { depth: 0.6, bevelEnabled: true, bevelThickness: 0.15, bevelSize: 0.15, bevelSegments: 3, curveSegments: 40 });
    g.add(mesh(sw, CLARO, [0, 0, ZF]));
    g.add(mesh(rbox(xs + 1 - (XT + 0.2), 2.8, 0.7, 0.2), CEPILLADO, [(xs + 1 + XT + 0.2) / 2, ys + 1.4, ZF + 0.35]));
    g.add(mesh(rbox(xb - 0.2 - xs, 0.5, 0.6, 0.15), CEPILLADO, [(xb - 0.2 + xs) / 2, ys + 2.55, ZF + 0.3]));
    g.add(decal(logoTex(), 11, 1.38, [-30.0, 26.6, ZF + 0.03]));
    g.add(decal(modeloTex(), 19, 1.78, [47.0, 25.2, ZF + 0.03]));
  }
  {
    const g = makePart(root, 'panel_der', L1([30, 0, 0], { info: 'carcasa', shell: true }));
    g.add(mesh(rbox(1.0, H - 3, ZF - ZB, 0.4), NEGRO, [X1 - 0.5, (H - 3) / 2 + 2, 0]));
    const gm = NEGRO.clone(); gm.map = grille; gm.color.setHex(0x8a9098);
    g.add(mesh(new THREE.PlaneGeometry(36, 14), gm, [X1 + 0.03, 16, 0], [0, Math.PI / 2, 0]));
  }
  {
    const g = makePart(root, 'panel_trasero', L1([0, 0, -55], { shell: true, label: 'equipo' }));
    // panel con el paso KF de la línea de vacío previo
    const cxp = (X1 + XT - 1.2) / 2, cyp = (H - 3) / 2 + 2;
    g.add(placaPasos(X1 - XT - 1.2, H - 3, 1.0, [[KF.x - cxp, KF.y - cyp, 1.6]], NEGRO, [cxp, cyp, ZB + 0.5], 'xy', 0.4));
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
    const plate = new THREE.MeshStandardMaterial({ map: plateTexture(['LCMS-8060NX · Triple Quadrupole', '230 V~ 50/60 Hz  15 A', 'Modelo didáctico', 'Explorador 3D']), metalness: 0.6, roughness: 0.4 });
    g.add(mesh(new THREE.PlaneGeometry(9, 4.5), plate, [30, 30, ZB - 0.02], [0, Math.PI, 0]));
    for (const [x, lbl] of [[-30, 'N2'], [-24, 'Ar']]) {
      g.add(mesh(cylZ(0.9, 2.2, 6), M.aceroPulido, [x, 24, ZB - 1.0]));
      g.add(mesh(cylZ(0.75, 0.6, 6), M.aceroPulido, [x, 24, ZB + 1.3]));          // tuerca interior
      g.add(mesh(cylZ(0.45, 1.2, 24), M.acero, [x, 24, ZB - 2.4]));
      g.add(decal(canvasTex(128, 64, (c) => { c.fillStyle = '#e8eaec'; c.font = '600 40px Segoe UI'; c.textBaseline = 'middle'; c.fillText(lbl, 30, 34); }),
        2.4, 1.2, [x, 21.6, ZB - 0.02], [0, Math.PI, 0]));
    }
    g.add(mesh(rbox(4, 3, 1, 0.2), M.plasticoNegro, [10, 10, ZB - 0.6]));
    // cable de alimentación hasta el suelo
    g.add(mesh(tubePath([[10, 10, (ZB - 1.2)], [10, 10, (ZB - 1.2) - 4], [10 - 2, 4, (ZB - 1.2) - 9], [10 - 5, 0.7, (ZB - 1.2) - 16], [10 - 14, 0.7, (ZB - 1.2) - 34]], 0.45, 40, 10), M.cable));
    g.add(mesh(rbox(2, 1.5, 0.8, 0.1), M.plasticoNegro, [18, 10, ZB - 0.5]));
    screws(g, M.tornillo, M.tornilloNegro, 0.3, '-z', [[XT + 3, H - 5, ZB - 0.02], [X1 - 4, H - 5, ZB - 0.02], [XT + 3, 5, ZB - 0.02], [X1 - 4, 5, ZB - 0.02]]);
  }

  /* ---------------- UNIDAD DE IONIZACIÓN (zócalo izquierdo + carcasa IonFocus) ---------------- */
  {
    const g = makePart(root, 'torre_fuente', L1([-26, 0, 0], { shell: true, label: 'equipo' }));
    // zócalo: frente negro con banda clara, tira cepillada y pilotos de estado
    g.add(mesh(rbox(XT - X0, YP - 2.6, ZF - ZB, 0.8), NEGRO, [(X0 + XT) / 2, (YP + 2.6) / 2, 0]));
    const xl = -55, xr = XT - 0.1;
    g.add(mesh(rbox(xr - xl, 17.4, 0.6, 0.2), CLARO, [(xl + xr) / 2, 11.6, ZF + 0.3]));
    g.add(mesh(rbox(xr - xl, 2.8, 0.7, 0.2), CEPILLADO, [(xl + xr) / 2, 21.7, ZF + 0.35]));
    for (let i = 0; i < 5; i++) g.add(mesh(cylZ(0.26, 0.25, 16), LED, [-51.4 + i * 2.0, 21.2, ZF + 0.8]));
    g.add(decal(pilotosTex(), 10.4, 0.65, [-47.4, 22.55, ZF + 0.72]));
    // carcasa hueca de la cámara de pulverización: ventana frontal y ranura (techo y cara derecha) por la que salen la sonda,
    // el bloque calefactor y la DL cuando la unidad se retira hacia la izquierda
    const yw0 = YP, yw1 = HT - 1, hw = yw1 - yw0, ym = (yw0 + yw1) / 2, cxI = (XI + XT) / 2;
    g.add(mesh(box(1.0, hw, ZF - ZB), NEGRO, [XI + 0.5, ym, 0]));                                        // pared izquierda
    g.add(mesh(box(XT - XI - 2.0, hw, 1.0), NEGRO, [cxI, ym, ZB + 0.5]));                                 // pared trasera
    const fr = new THREE.Shape(); fr.moveTo(XI + 1, yw0); fr.lineTo(XT - 1, yw0); fr.lineTo(XT - 1, yw1); fr.lineTo(XI + 1, yw1); fr.lineTo(XI + 1, yw0);
    const W0 = { x: cxI, y: 33, h: 3.5 };
    const hole = new THREE.Path(); hole.moveTo(W0.x - W0.h, W0.y - W0.h); hole.lineTo(W0.x - W0.h, W0.y + W0.h); hole.lineTo(W0.x + W0.h, W0.y + W0.h); hole.lineTo(W0.x + W0.h, W0.y - W0.h);
    fr.holes.push(hole);
    g.add(mesh(new THREE.ExtrudeGeometry(fr, { depth: 1.0, bevelEnabled: false }), NEGRO, [0, 0, ZF - 1.0]));   // pared frontal con ventana
    for (const [z0, z1] of [[ZB, RAN.z0], [RAN.z1, ZF]]) g.add(mesh(box(1.0, hw, z1 - z0), NEGRO, [XT - 0.5, ym, (z0 + z1) / 2]));   // cara derecha (ranura)
    for (const [z0, z1] of [[ZB, RAN.z0], [RAN.z1, ZF]]) g.add(mesh(rbox(XT - XI, 1.0, z1 - z0, 0.3), NEGRO, [cxI, HT - 0.5, (z0 + z1) / 2]));   // techo
    g.add(mesh(rbox(PROBE.x - 1.4 - XI, 1.0, RAN.z1 - RAN.z0, 0.3), NEGRO, [(XI + PROBE.x - 1.4) / 2, HT - 0.5, (RAN.z0 + RAN.z1) / 2]));
    g.add(mesh(box(XT - XI - 2.0, 0.6, 0.25), M.plasticoNegro, [cxI, 45, ZF + 0.12]));                     // junta de la tapa
    g.add(mesh(box(XT - XI - 2.0, 16, 0.2), M.acero, [cxI, 36, ZB + 1.1]));                                 // fondo interior de acero
    // marco de la ventana (la ventana es una pieza aparte)
    const mf = new THREE.Shape(); mf.moveTo(-4.5, -4.5); mf.lineTo(4.5, -4.5); mf.lineTo(4.5, 4.5); mf.lineTo(-4.5, 4.5);
    const hl = new THREE.Path(); hl.moveTo(-3.5, -3.5); hl.lineTo(-3.5, 3.5); hl.lineTo(3.5, 3.5); hl.lineTo(3.5, -3.5); mf.holes.push(hl);
    g.add(mesh(new THREE.ExtrudeGeometry(mf, { depth: 0.6, bevelEnabled: true, bevelThickness: 0.15, bevelSize: 0.15, bevelSegments: 2 }), M.aceroOscuro, [W0.x, W0.y, ZF + 0.15]));
    // collar abierto del paso de la sonda (deja salir la sonda por la ranura) y conexiones de la tapa
    g.add(mesh(new THREE.TorusGeometry(2.0, 0.45, 12, 32, Math.PI), M.aceroPulido, [PROBE.x, HT + 0.45, PROBE.z], [Math.PI / 2, 0, Math.PI / 2]));
    const warn = new THREE.MeshStandardMaterial({ map: warningTexture('ALTA TENSIÓN · CALIENTE'), roughness: 0.45 });
    g.add(mesh(new THREE.PlaneGeometry(6.4, 2.4), warn, [cxI, 48.4, ZF + 0.02]));
    g.add(mesh(cylY(0.9, 0.4, 6), M.aceroPulido, [-50.5, HT + 0.1, -7]));
    g.add(mesh(cylY(0.5, 1.4, 6), M.aceroPulido, [-50.5, HT + 0.9, -7]));
    g.add(mesh(cylY(0.75, 1.8, 24), M.plasticoNegro, [-40.8, HT + 0.7, -5]));
    g.add(mesh(new THREE.TorusGeometry(0.75, 0.18, 8, 24), M.aceroPulido, [-40.8, HT + 0.25, -5], [Math.PI / 2, 0, 0]));
    // colector de entrada de gases (N₂ de calentamiento y secado) en la cara que da a la unidad MS
    g.add(mesh(rbox(1.5, 3.6, 5.6, 0.3), M.aceroPulido, [XT + 0.7, 44, -8]));
    for (const z of [-9.8, -8, -6.2]) g.add(mesh(cylX(0.35, 0.6, 6), M.aceroPulido, [XT + 1.7, 44, z]));
    // gas nebulizador y cable de alta tensión hasta el cabezal de la sonda (siguen a la sonda al desmontar)
    cableFlex(g, [[PROBE.x, 55.0, PROBE.z - 2.7, 'sonda_esi'], [PROBE.x, 54.9, PROBE.z - 4.0, 'sonda_esi'], [-49.5, 55.3, -5.5], [-50.5, 54.7, -7], [-50.5, HT + 1.5, -7]], 0.14, M.ptfe, { seg: 40 });
    cableFlex(g, [[PROBE.x + 3.0, 55.4, PROBE.z, 'sonda_esi'], [PROBE.x + 4.4, 55.4, PROBE.z, 'sonda_esi'], [PROBE.x + 5.6, 55.6, PROBE.z - 1.6, 'sonda_esi'],
      [-40.8, 55.2, -4.2], [-40.8, HT + 1.5, -5]], 0.22, M.cable, { seg: 40 });
  }
  {
    const g = makePart(root, 'ventana_fuente', L1([0, 0, 18], { label: 'equipo', shell: true }));
    const gl = M.vidrio.clone(); gl.opacity = 0.22;
    g.add(mesh(rbox(7.4, 7.4, 0.5, 0.2), gl, [(XI + XT) / 2, 33, ZF + 0.45]));
    g.add(mesh(rbox(1.2, 3.2, 1.0, 0.3), M.aceroPulido, [(XI + XT) / 2 + 5.3, 33, ZF + 0.75]));
  }
  {
    // válvula de desvío de 6 vías sobre el zócalo, junto al horno de columnas
    const g = makePart(root, 'valvula_desvio', L1([-34, 0, 10], { label: 'equipo' }));
    const x = -55.5, y = 29.6, z = 14;
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
    // base y paredes laterales; la tapa es una pieza aparte (sale hacia arriba antes que el analizador)
    g.add(mesh(rbox(len, 0.9, 12.3, 0.2), M.aluminio, [x0 + len / 2, y - 5.5, z]));
    for (const s of [-1, 1]) g.add(mesh(rbox(len, 11.6, 0.9, 0.2), M.aluminio, [x0 + len / 2, y, z + s * 5.5]));
    g.add(mesh(rbox(0.9, 11.6, 11.6, 0.2), M.aluminio, [x1, y, z]));
    // puerto de vacío previo de la 1.ª cámara (a la rotatoria)
    g.add(mesh(cylY(1.3, 3.4, 32), M.aceroPulido, [ORIGEN.x + 13, y - 7.4, z - 3]));
    g.add(mesh(cylY(1.9, 0.5, 32), M.aceroPulido, [ORIGEN.x + 13, y - 9.0, z - 3]));
    // medidores de vacío (Pirani y de ionización)
    g.add(mesh(cylZ(1.1, 3, 32), M.acero, [ORIGEN.x + 20, y + 2, z - 7.5]));
    g.add(mesh(rbox(2.6, 2.6, 2.4, 0.3), M.plasticoNegro, [ORIGEN.x + 20, y + 2, z - 10]));
    g.add(mesh(cylZ(1.1, 3, 32), M.acero, [ORIGEN.x + 60, y + 2, z - 7.5]));
    g.add(mesh(rbox(2.6, 2.6, 2.4, 0.3), M.plasticoNegro, [ORIGEN.x + 60, y + 2, z - 10]));
    // tapa con pasos de vacío: gas de colisión (Ar), tres pasamuros cerámicos de alta tensión y bridas de acceso
    const t = makePart(g, 'camara_vacio_tapa', L1([0, 40, 0], { info: 'camara_vacio', shell: true }));
    t.add(mesh(rbox(len, 0.9, 12.3, 0.2), M.aluminio, [x0 + len / 2, y + 5.5, z]));
    t.add(mesh(cylY(0.5, 1.0, 6), M.aceroPulido, [ORIGEN.x + AX.Q2_0 + 2, y + 6.4, z]));
    for (const dz of [-4.4, -2.8, -1.2]) {
      t.add(mesh(cylY(0.45, 1.2, 16), M.ceramica, [2, y + 6.5, z + dz]));
      t.add(mesh(cylY(0.7, 0.3, 16), M.aceroPulido, [2, y + 5.95, z + dz]));
    }
    for (const x of [ORIGEN.x + 13, ORIGEN.x + 40, ORIGEN.x + 76]) {
      t.add(mesh(rbox(9, 0.8, 11, 0.3), M.aluminio, [x, y + 6.3, z]));
      for (const dx of [-3.8, 3.8]) for (const dz of [-4.6, 4.6]) screws(t, M.tornillo, M.tornilloNegro, 0.3, 'y', [[x + dx, y + 6.7, z + dz]]);
    }
  }
  {
    // Bomba turbomolecular de flujo dividido con tres entradas (40 + 260 + 210 L/s)
    const g = makePart(root, 'bomba_turbo', L1([0, 0, -32], { label: 'equipo' }));
    const y = ORIGEN.y - 18.5, z = ORIGEN.z, xa = ORIGEN.x + 18, xb = ORIGEN.x + 86;
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
    for (const x of [xa + 6, xb - 6]) g.add(mesh(rbox(3, 8, 10, 0.3), M.aluminio, [x, 6.6, z]));
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
    const T = 'bomba_turbo', P = 'panel_trasero', R = 'bomba_rotatoria', zx = ZB + 7.6, yt = ORIGEN.y - 20.5;   // yt: escape de la turbo
    cableFlex(g, [[-28.8, yt, 2, T], [-31, yt, 2, T], [-32.5, yt - 0.3, -4, T], [-32, 9.6, -14, P], [-27, KF.y + 0.4, zx, P], [0, KF.y, zx, P],
      [KF.x - 5, KF.y, zx, P], [KF.x - 0.6, KF.y, zx - 0.8, P], [KF.x, KF.y, ZB + 4.8, P]], 0.9, mat, { seg: 120, radial: 12 });
    const yp = ORIGEN.y - 9.2;
    cableFlex(g, [[-31, yp, -1], [-31, yp - 2.3, -1.2], [-34, yp - 5.8, -7], [-34.5, 12, -16, P], [-31, KF.y + 0.5, ZB + 3.4, P], [0, KF.y, ZB + 3.2, P],
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
    const yh = 40.5;
    g.add(mesh(rbox(14, 7, 12, 0.4), M.anodizado, [ORIGEN.x + 60, yh, -16]));
    // cables a los pasamuros cerámicos de la tapa de la cámara de vacío
    [-19, -16, -13].forEach((z, k) => cableFlex(g, [[ORIGEN.x + 53.2, yh - 1, z], [ORIGEN.x + 50.5, yh - 1.6, z + 1.5], [3, ORIGEN.y + 9.5, -4.9 + 1.6 * k, 'camara_vacio_tapa'],
      [2, ORIGEN.y + 7.9, -2.4 + 1.6 * k, 'camara_vacio_tapa'], [2, ORIGEN.y + 7.0, -2.4 + 1.6 * k, 'camara_vacio_tapa']], 0.25, M.cable, { seg: 48, radial: 8 }));
    const warn = new THREE.MeshStandardMaterial({ map: warningTexture('ALTA TENSIÓN'), roughness: 0.45 });
    g.add(mesh(new THREE.PlaneGeometry(6, 2.2), warn, [ORIGEN.x + 60, yh + 3.55, -16], [-Math.PI / 2, 0, 0]));
  }
  {
    const g = makePart(root, 'placa_principal', L1([0, 0, -22], { label: 'equipo' }));
    g.add(mesh(rbox(40, 22, 0.25, 0.05), M.pcb, [26, 26, ZB + 2.5]));
    const rnd = (() => { let a = 9; return () => ((a = (a * 16807) % 2147483647) / 2147483647); })();
    for (let i = 0; i < 40; i++) {
      const x = 8 + rnd() * 36, y = 17 + rnd() * 18, k = rnd();
      // alturas escalonadas: componentes solapados no comparten caras
      const q = i % 3, z0 = ZB + 2.625 - 0.07 * q;
      if (k < 0.6) { const t = 0.25 + 0.15 * q; g.add(mesh(box(0.8 + rnd(), 0.8 + rnd(), t), M.chip, [x, y, z0 + t / 2])); }
      else { const t = 0.9 + 0.15 * q; g.add(mesh(cylZ(0.35, t, 16), M.condensador, [x, y, z0 + t / 2])); }
    }
    screws(g, M.tornillo, M.tornilloNegro, 0.25, 'z', [[7, 36, ZB + 2.65], [45, 36, ZB + 2.65], [7, 16, ZB + 2.65], [45, 16, ZB + 2.65]]);
    g.add(mesh(rbox(22, 8, 14, 0.4), M.anodizado, [-12, 6, -13]));       // fuente de alimentación
    const gm = M.carcasa.clone(); gm.map = grille;
    g.add(mesh(new THREE.PlaneGeometry(18, 6), gm, [-12, 6, -5.98]));
  }
  {
    const g = makePart(root, 'linea_gases', L1([0, 18, 0], { label: 'equipo' }));
    // N₂ (nebulizador, calentamiento, secado) hacia la fuente y Ar hacia la celda de colisión
    g.add(mesh(rbox(8, 6, 8, 0.4), M.grisClaro, [-30, 38, -18]));
    const P = 'panel_trasero', C = 'camara_vacio_tapa';
    // N₂ desde la entrada del panel trasero hasta la unidad de control de gases
    cableFlex(g, [[-30, 24, ZB + 1.5, P], [-30, 24.4, ZB + 3.2, P], [-30, 29, -25], [-30, 34.0, -18.8], [-30, 35.3, -18]], 0.22, M.ptfe, { seg: 40, radial: 8 });
    // N₂ de calentamiento y secado hasta el colector de la unidad de ionización
    [-9.8, -8, -6.2].forEach((ze, k) => { const xs = -32.5 + 2.5 * k;
      cableFlex(g, [[xs, 38.5, -14.1], [xs, 38.7, -12.6], [xs - 1.2 - 0.6 * k, 40.6 + 0.5 * k, ze - 1.6], [XT + 3.2, 44, ze, 'torre_fuente'], [XT + 1.9, 44, ze, 'torre_fuente']],
        0.15, M.ptfe, { seg: 40, radial: 8 }); });
    // Ar desde el panel trasero hasta el paso de la tapa sobre la celda de colisión (por delante de la fuente de alta tensión)
    const xa = ORIGEN.x + AX.Q2_0 + 2;
    cableFlex(g, [[-24, 24, ZB + 1.5, P], [-23.5, 24.6, ZB + 3.4, P], [-20, 28, -21.5], [-4, 33.5, -19.5], [4, 36.5, -7.5],
      [12.8, ORIGEN.y + 8.4, -3.5, C], [xa + 0.2, ORIGEN.y + 8.2, ORIGEN.z - 0.8, C], [xa, ORIGEN.y + 7.6, ORIGEN.z, C], [xa, ORIGEN.y + 6.8, ORIGEN.z, C]], 0.15, M.cobre, { seg: 64, radial: 8 });
  }

  /* ---------------- CROMATÓGRAFO DE LÍQUIDOS NEXERA (contexto) ---------------- */
  // Torre de dos módulos (bombas sobre el automuestreador) y horno de columnas alto junto a la unidad de ionización.
  // Frentes negros con pantalla y piloto verde, laterales gris claro y portabotellas de varilla cromada.
  {
    const g = makePart(root, 'lc', L1([-34, 0, 0], { shell: true, label: 'equipo' }));
    const D = 50, zc = ZF - D / 2, zf = ZF;
    const mod = (id, cx, W, y0, h, info, extra) => {
      const s = makePart(g, id, L1([0, 0, 0], { info, shell: true }));
      s.add(mesh(rbox(W, h - 0.3, D, 0.6), LATERAL_LC, [cx, y0 + h / 2, zc]));
      s.add(mesh(rbox(W - 0.3, h - 0.7, 1.0, 0.35), NEGRO, [cx, y0 + h / 2, zf + 0.35]));
      if (extra) extra(s, cx, W, y0, h);
      return s;
    };
    const pantalla = (s, x, y, filas, titulo) => {
      const sc = new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0xffffff, emissiveIntensity: 0.75,
        emissiveMap: screenTexture(filas, { title: titulo }) });
      s.add(mesh(new THREE.PlaneGeometry(6.4, 2.5), sc, [x, y, zf + 0.87]));
      s.add(mesh(box(0.35, 2.5, 0.2), M.ledVerde, [x - 4.0, y, zf + 0.9]));
    };
    const cxL = -93.5, WL = 26, cxH = -71, WH = 18;
    // automuestreador (abajo): puerta y cajón de racks; viales dentro
    mod('lc_inyector', cxL, WL, 0, 27, 'lc_inyector', (s, cx, W, y0, h) => {
      pantalla(s, cx - W / 2 + 6.2, y0 + h - 3.4, [['Vial', '12'], ['Iny.', '2 µL']], 'SIL-40C');
      s.add(mesh(rbox(W - 3, 13, 0.4, 0.3), NEGRO, [cx, y0 + 13.2, zf + 0.98]));
      s.add(mesh(rbox(0.7, 5, 0.7, 0.25), M.aceroOscuro, [cx + W / 2 - 2.4, y0 + 13.2, zf + 1.25]));
      s.add(mesh(rbox(W - 6, 4.2, 0.5, 0.3), NEGRO, [cx - 1.5, y0 + 3.6, zf + 1.0]));
      s.add(mesh(rbox(5, 0.6, 0.4, 0.2), M.aceroOscuro, [cx - 1.5, y0 + 3.6, zf + 1.35]));
      s.add(decal(nexeraTex('Nexera'), 4, 0.5, [cx + W / 2 - 3.2, y0 + 1.1, zf + 0.87]));
      for (let i = 0; i < 4; i++) for (let j = 0; j < 6; j++) s.add(mesh(cylY(0.6, 3.2, 16), M.vidrio, [cx - 7 + j * 2.8, y0 + 9, zf - 8 - i * 3]));
    });
    // bombas de alta presión (arriba): pantalla y puerta con tirador; cabezales de bomba tras la puerta
    mod('lc_bomba', cxL, WL, 27, 26, 'lc_bomba', (s, cx, W, y0, h) => {
      pantalla(s, cx - W / 2 + 6.2, y0 + h - 3.4, [['Flujo', '0,40 mL/min'], ['P', '42,5 MPa']], 'LC-40D');
      s.add(mesh(rbox(W - 13, h - 7.5, 0.4, 0.3), NEGRO, [cx + 5.0, y0 + (h - 7.5) / 2 + 1.2, zf + 0.98]));
      s.add(mesh(rbox(0.7, 7, 0.7, 0.25), M.aceroOscuro, [cx + W / 2 - 2.4, y0 + h / 2 - 1, zf + 1.25]));
      s.add(decal(nexeraTex('Nexera'), 4, 0.5, [cx - W / 2 + 3.2, y0 + 1.1, zf + 0.87]));
      for (const x of [cx - 6, cx + 6]) s.add(mesh(cylZ(1.4, 1.2, 24), M.aceroPulido, [x, y0 + 8, zf - 1.2]));
      // entradas de las líneas de disolvente en la tapa (bajo la bandeja)
      for (let i = 0; i < 4; i++) s.add(pasamuros(0.3, M.goma, [cx - 8.4 + i * 5.6, y0 + h - 0.15, zc - 19], 'y', 0.16));
    });
    // horno de columnas alto junto a la unidad MS: columna vertical y racor de salida en su cara derecha
    mod('lc_horno', cxH, WH, 0, 55, 'lc_horno', (s, cx, W, y0, h) => {
      pantalla(s, cx - W / 2 + 5.6, y0 + h - 3.4, [['Horno', '40 °C']], 'CTO-40C');
      s.add(mesh(rbox(0.7, 9, 0.7, 0.25), M.aceroOscuro, [cx + W / 2 - 1.8, y0 + 38, zf + 1.25]));
      s.add(mesh(rbox(5, 5, 0.35, 0.3), M.carcasaOsc, [cx + 2.5, y0 + 9, zf + 0.95]));
      s.add(decal(nexeraTex('Nexera'), 4, 0.5, [cx - W / 2 + 3.2, y0 + 1.1, zf + 0.87]));
      s.add(mesh(cylY(0.55, 14, 24), M.aceroPulido, [cx + 2, 33, zf - 6]));      // columna UHPLC
      for (const y of [26.4, 39.6]) s.add(mesh(cylY(0.85, 1.0, 6), M.aceroPulido, [cx + 2, y, zf - 6]));
      s.add(mesh(cylX(0.45, 0.9, 6), M.aceroPulido, [cx + W / 2 + 0.35, 40, 25]));
    });
    // bandeja de disolventes con botellas y portabotellas de varilla cromada sobre la torre
    const t = makePart(g, 'lc_botellas', L1([0, 12, 0], { info: 'lc_botellas' }));
    const zh = zc - 19, xs = [0, 1, 2, 3].map((i) => cxL - 8.4 + i * 5.6), yt = 53.65;
    t.add(placaPasos(WL, D - 6, 1.2, xs.map((x) => [x - cxL, zh - zc, 0.45]), M.grisClaro, [cxL, yt, zc], 'xz', 0.4));
    for (const x of [cxL - WL / 2 + 0.6, cxL + WL / 2 - 0.6]) for (const z of [zc - D / 2 + 3.6, zc + D / 2 - 3.6]) t.add(mesh(cylY(0.3, 9, 12), M.aceroPulido, [x, yt + 5.1, z]));
    for (const z of [zc - D / 2 + 3.6, zc + D / 2 - 3.6]) t.add(mesh(cylX(0.3, WL - 1.2, 12), M.aceroPulido, [cxL, yt + 9.6, z]));
    for (const x of [cxL - WL / 2 + 0.6, cxL + WL / 2 - 0.6]) t.add(mesh(cylZ(0.3, D - 7.2, 12), M.aceroPulido, [x, yt + 9.6, zc]));
    for (const x of xs) {
      t.add(mesh(cylY(2.4, 15, 32), M.vidrio, [x, yt + 8.1, zc + 4]));
      t.add(mesh(cylY(2.25, 9, 32), M.disolvente, [x, yt + 5.2, zc + 4]));
      t.add(mesh(cylY(1.2, 2.2, 24), M.peekBeige, [x, yt + 16.7, zc + 4]));
      t.add(pasamuros(0.42, M.goma, [x, yt + 0.65, zh], 'y', 0.16));
      // línea de disolvente: tapón → paso de la bandeja → entrada de la bomba
      cableFlex(t, [[x, yt + 17.6, zc + 4], [x, yt + 19.2, zc + 3], [x, yt + 18.1, zc - 1.5], [x, yt + 9, zh + 4], [x, yt + 2.5, zh + 0.3], [x, yt + 1.3, zh], [x, yt - 1.2, zh],
        [x, yt - 2.2, zh, 'lc_bomba']], 0.12, M.ptfe, { seg: 48, radial: 6 });
    }
  }
  {
    // Línea PEEK: salida del horno → válvula de desvío → por encima de la unidad de ionización → entrada del cabezal de la sonda ESI
    const g = makePart(root, 'tubo_peek', L1([0, 0, 0], { info: 'tubo_peek' }));
    const V = 'valvula_desvio', T = 'torre_fuente', S = 'sonda_esi', HO = 'lc_horno';
    const vx = -55.5 - 3.95, vy = 29.6, vz = 14, pr = 1.15;                // vía de la válvula de 6 vías (puertos 2 y 5)
    const p2 = [vy - pr * 0.5, vz + pr * 0.866], p5 = [vy + pr * 0.5, vz - pr * 0.866];
    cableFlex(g, [[-61.5, 40, 25, HO], [-60.9, 39.3, 24.3, HO], [-61.0, 33, 18.5, V], [vx - 1.3, p2[0], p2[1], V], [vx, p2[0], p2[1], V]],
      0.1, M.peekRojo, { seg: 48, radial: 8 });
    cableFlex(g, [[vx, p5[0], p5[1], V], [vx - 1.3, p5[0], p5[1], V], [-61.0, 35, 12.2, V], [-60.6, 46, 10, V], [-57.5, 55, 6, T],
      [-52.5, 58.6, 2.6, S], [PROBE.x - 1.9, 59.0, PROBE.z, S], [PROBE.x, 58.3, PROBE.z, S], [PROBE.x, 57.1, PROBE.z, S]], 0.1, M.peekRojo, { seg: 96, radial: 8 });
  }

  refs.analyzer = buildAnalizador(root);

  // los cables flexibles (cableFlex) se recalculan solos al desmontar
  refs.update = () => {};
  return refs;
}
