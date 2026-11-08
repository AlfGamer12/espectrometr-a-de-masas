// Equipo completo Agilent 7900 ICP-MS (730 × 600 × 595 mm), según las fotografías del fabricante: mueble gris claro con una
// tapa blanca de canto redondeado, puerta negra brillante en la parte superior izquierda (compartimento de introducción de
// muestra y antorcha) que envuelve la esquina, franja gris con el indicador de estado, zócalo, chimenea blanca corta sobre la
// tapa y, en el lateral izquierdo, la bomba peristáltica con su bandeja. Dentro: caja de la antorcha, cámara de vacío con turbo
// de flujo dividido, control de gases, generador de RF de 27 MHz y electrónica. Fuera: bomba rotatoria, enfriador y el
// automuestreador SPS 4 a la izquierda (contexto). Cables y mangueras flexibles (cableFlex) siguen a las piezas al explosionar.
import * as THREE from 'three';
import { M } from '../../materials.js';
import { mesh, rbox, box, cylX, cylY, cylZ, grilleTexture, textTexture, screws, plateTexture, warningTexture, placaPasos, pasamuros } from '../../geom.js';
import { makePart, cableFlex } from '../../parts.js';
import { buildAnalizador } from './analizador.js';
import { AX, CAB, W } from './geometria.js';

const L1 = (offset, extra = {}) => ({ level: 1, offset, mode: 'equipo', ...extra });
const { X0, X1, ZB, ZF } = CAB;
const DY = 35.8;                         // entrepaño (centro); cara superior 36,3
const PH0 = 2.8, PH1 = 40.9;             // paneles inferiores: sobre el zócalo y bajo la sección superior
const YF = 38.6;                         // borde superior del panel frontal inferior; encima, la franja hasta 41
const YS = 41;                           // arranque de la sección superior (puerta negra y tapa)
const YT = 59.5;                         // techo de la tapa
const TP = 0.9;                          // espesor de la tapa y de la puerta
const CHX = -19.5, CHZ = 6.5;            // eje de la chimenea

/* ---------- utilidades de forma ---------- */
/** Perfil de carcasa en el plano (u hacia fuera, y): pared vertical u∈[S−T, S] desde y0, canto superior redondeado de radio R y techo hasta u = uIn. */
function perfil(S, T, y0, yt, R, uIn) {
  const s = new THREE.Shape();
  s.moveTo(S, y0); s.lineTo(S, yt - R);
  s.absarc(S - R, yt - R, R, 0, Math.PI / 2, false);
  s.lineTo(uIn, yt); s.lineTo(uIn, yt - T); s.lineTo(S - R, yt - T);
  s.absarc(S - R, yt - R, R - T, Math.PI / 2, 0, true);
  s.lineTo(S - T, y0); s.lineTo(S, y0);
  return s;
}
/** Rectángulo redondeado en coordenadas absolutas del plano (u, v). */
function rr(u0, u1, v0, v1, r, s = new THREE.Shape()) {
  s.moveTo(u0 + r, v0); s.lineTo(u1 - r, v0); s.quadraticCurveTo(u1, v0, u1, v0 + r); s.lineTo(u1, v1 - r);
  s.quadraticCurveTo(u1, v1, u1 - r, v1); s.lineTo(u0 + r, v1); s.quadraticCurveTo(u0, v1, u0, v1 - r); s.lineTo(u0, v0 + r);
  s.quadraticCurveTo(u0, v0, u0 + r, v0);
  return s;
}
const extr = (shape, L) => new THREE.ExtrudeGeometry(shape, { depth: L, bevelEnabled: false, curveSegments: 20 });
/** Forma del plano (z, y) extruida a lo largo de X entre x0 y x1 (la orientación va en la malla para la herramienta de inspección). */
const lagoX = (shape, x0, x1, mat) => mesh(extr(shape, x1 - x0), mat, [x1, 0, 0], [0, -Math.PI / 2, 0]);
/** Forma del plano (u, y) extruida a lo largo de Z entre z0 y z1; u = x en el lado derecho (s = 1) y −x en el izquierdo (s = −1). */
const lagoZ = (shape, z0, z1, mat, s = 1) => (s > 0 ? mesh(extr(shape, z1 - z0), mat, [0, 0, z0]) : mesh(extr(shape, z1 - z0), mat, [0, 0, z1], [0, Math.PI, 0]));
/** Esquina redondeada: el perfil (r, y) gira un cuarto de vuelta alrededor del eje vertical (cx, cz), hacia (sx, sz). */
function esquina(shape, cx, cz, sx, sz, mat) {
  const phi0 = sx > 0 ? (sz > 0 ? 0 : Math.PI / 2) : (sz > 0 ? -Math.PI / 2 : Math.PI);
  const m = mat.clone(); m.side = THREE.DoubleSide;
  return mesh(new THREE.LatheGeometry(shape.getPoints(20), 28, phi0, Math.PI / 2), m, [cx, 0, cz]);
}
/** Placa horizontal de contorno libre [[x, z]…] con agujeros [x, z, r], centrada en la altura y. */
function planta(pts, holes, t, y, mat) {
  const s = new THREE.Shape(); pts.forEach(([x, z], i) => (i ? s.lineTo(x, -z) : s.moveTo(x, -z)));
  for (const [x, z, r] of holes) { const h = new THREE.Path(); h.absarc(x, -z, r, 0, Math.PI * 2, true); s.holes.push(h); }
  const g = new THREE.ExtrudeGeometry(s, { depth: t, bevelEnabled: false, curveSegments: 40 }); g.translate(0, 0, -t / 2);
  return mesh(g, mat, [0, y, 0], [-Math.PI / 2, 0, 0]);
}
/** Une geometrías ya colocadas en una sola (piezas repetidas: tubos de las gradillas). */
function fusion(geos) {
  const gs = geos.map((g) => (g.index ? g.toNonIndexed() : g));
  const n = gs.reduce((a, g) => a + g.attributes.position.count, 0);
  const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3); let o = 0;
  for (const g of gs) { pos.set(g.attributes.position.array, o * 3); nor.set(g.attributes.normal.array, o * 3); o += g.attributes.position.count; }
  const r = new THREE.BufferGeometry(); r.setAttribute('position', new THREE.BufferAttribute(pos, 3)); r.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  r.computeBoundingBox(); r.computeBoundingSphere(); return r;
}
/* ---------- rótulos (texturas de texto propias; fondo transparente) ---------- */
function rotulo(dibujo, w, h) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; dibujo(c.getContext('2d'));
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
/** Símbolo de chispa (estrella de rayos alternos). */
function chispa(g, x, y, r, col) {
  g.strokeStyle = col; g.lineCap = 'round'; g.lineWidth = r * 0.12;
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2, l = i % 2 ? r * 0.6 : r;
    g.beginPath(); g.moveTo(x + Math.cos(a) * r * 0.24, y + Math.sin(a) * r * 0.24); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
  }
}
const decal = (tex, extra = {}) => new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: 0.4, metalness: 0, ...extra });

export function buildEquipo(root) {
  const refs = {};
  const blanco = M.carcasa.clone(); blanco.color.setHex(0xeef0f2);             // tapa
  const grisPanel = M.carcasa.clone(); grisPanel.color.setHex(0xd7dadd);       // paneles inferiores
  const faja = M.carcasa.clone(); faja.color.setHex(0xc3c7cc);                 // franja bajo la tapa
  const zocalo = M.carcasa.clone(); zocalo.color.setHex(0xc8ccd1);
  const bahia = M.carcasaOsc.clone(); bahia.color.setHex(0x2d3136);            // lateral izquierdo delantero (bomba)
  const negro = M.negroBrillante.clone(); negro.color.setHex(0x131518);        // puerta del compartimento de muestra
  const plata = M.plata.clone(); plata.color.setHex(0xb4b9bf);
  const gris = M.carcasaOsc.clone(); gris.color.setHex(0x4a5059);
  const grisMarco = M.carcasa.clone(); grisMarco.color.setHex(0xd2d6da);       // marcos del SPS 4
  const grille = grilleTexture(26, 8);
  const rejMat = () => { const m = blanco.clone(); m.map = grille; m.color.setHex(0xa6abb2); return m; };
  const tubo = (c) => { const m = M.ptfe.clone(); m.color.setHex(c); return m; };
  const metalTubo = M.aceroPulido;

  /* ---------------- BASTIDOR, ENTREPAÑO Y ZÓCALO ---------------- */
  // pasos del entrepaño [x, z, r] en el mundo
  const PASOS = { drenaje: [-31, 4.8, 0.75], neb: [-27.5, 12, 0.5], bob1: [-11.1, 6, 0.6], bob2: [-9.5, 6, 0.6], plasma: [-18, -14, 0.5], aux: [-19.2, -14, 0.5], vacio: [-3.6, 6, 1.4] };
  {
    const g = makePart(root, 'chasis', L1([0, 0, 0]));
    g.add(mesh(rbox(70, 1.0, 56.8, 0.3), gris, [0, 1.0, 0]));
    for (const x of [X0 + 5, X1 - 5]) for (const z of [ZB + 5, ZF - 5]) g.add(mesh(cylY(1.8, 0.5, 24), M.goma, [x, 0.25, z]));
    for (const x of [-33.7, 33.7]) for (const z of [-28, 27.4]) g.add(mesh(box(2, 57, 2), M.aluminio, [x, 30, z]));
    const dx0 = -32.7, dx1 = -1.5, dz0 = -27, dz1 = 28.9, cx = (dx0 + dx1) / 2, cz = (dz0 + dz1) / 2;
    g.add(placaPasos(dx1 - dx0, dz1 - dz0, 1.0, Object.values(PASOS).map(([x, z, r]) => [x - cx, z - cz, r]), M.aluminio, [cx, DY, cz], 'xz', 0.3));
    for (const [x, z, r] of Object.values(PASOS)) for (const y of [DY + 0.5, DY - 0.5]) g.add(pasamuros(r, M.goma, [x, y, z], 'y', 0.3));
    for (const z of [-26, 27.9]) g.add(mesh(box(1.6, 1.4, 1.0), M.aluminio, [dx1 - 0.8, DY - 1.2, z]));
  }

  /* ---------------- CARCASA ---------------- */
  {
    // panel frontal inferior, franja con el tirador y la ventana de estado
    const g = makePart(root, 'panel_frontal', L1([0, 0, 30], { shell: true, label: 'equipo' }));
    g.add(mesh(rbox(73, YF - PH0, 1.0, 0.35), grisPanel, [0, (PH0 + YF) / 2, ZF - 0.5]));
    g.add(mesh(rbox(71, YS - YF, 1.0, 0.2), faja, [0, (YF + YS) / 2, 28.9]));
    const tir = faja.clone(); tir.color.setHex(0xaeb3b9);
    g.add(mesh(new THREE.PlaneGeometry(8.6, 1.5), tir, [11.4, 39.8, 29.42]));
    g.add(mesh(rbox(3.4, 1.2, 0.4, 0.15), M.plasticoNegro, [32.4, 39.8, 29.6]));
    for (let i = 0; i < 3; i++) g.add(mesh(new THREE.PlaneGeometry(0.5, 0.24), M.ledVerde, [31.4 + i * 1.0, 39.8, 29.81]));
    // zócalo delantero (los laterales y el trasero van con su panel), algo retranqueado
    g.add(mesh(rbox(72.6, 2.4, 1.0, 0.25), zocalo, [0, 1.6, 29.1]));
    const ranura = M.plasticoNegro.clone(); ranura.color.setHex(0x34383e);
    g.add(mesh(new THREE.PlaneGeometry(6, 0.9), ranura, [-8, 1.7, 29.62]));
    const reb = zocalo.clone(); reb.color.setHex(0xa9aeb4);
    g.add(mesh(new THREE.PlaneGeometry(31, 1.1), reb, [11.5, 1.05, 29.62]));
  }
  {
    // puerta negra del compartimento de introducción de muestra: frontal, canto superior y lateral izquierdo redondeados
    const g = makePart(root, 'puerta_muestras', L1([0, 0, 38], { shell: true, label: 'equipo' }));
    const SF = 30.9, SL = 36.9, RC = 3.5, RT = 2.5, YH = 59.0, cx = -(SL - RC), cz = SF - RC;
    g.add(lagoX(perfil(SF, TP, YS, YH, RT, 16), cx, -13.5, negro));
    g.add(lagoZ(perfil(SL, TP, YS, YH, RT, SL - RC), 16, cz, negro, -1));
    g.add(esquina(perfil(RC, TP, YS, YH, RT, 0), cx, cz, -1, 1, negro));
    // tirador inclinado bajo la puerta
    const lab = new THREE.Shape(); lab.moveTo(29.5, 39.6); lab.lineTo(31.1, 40.25); lab.lineTo(31.1, 40.95); lab.lineTo(29.5, 40.95); lab.lineTo(29.5, 39.6);
    g.add(lagoX(lab, -27.6, -14.0, plata));
    // rótulo: chispa, «Agilent Technologies» y «7900 ICP-MS»
    const tex = rotulo((c) => {
      chispa(c, 58, 70, 42, '#eef1f4');
      c.fillStyle = '#eef1f4'; c.textBaseline = 'middle';
      c.font = '600 70px "Segoe UI", Arial'; c.fillText('Agilent Technologies', 118, 74);
      c.font = '700 80px "Segoe UI", Arial'; c.fillText('7900', 118, 184);
      const w = c.measureText('7900').width; c.font = '600 42px "Segoe UI", Arial'; c.fillText('ICP-MS', 118 + w + 22, 192);
    }, 1024, 256);
    g.add(mesh(new THREE.PlaneGeometry(12.4, 3.1), decal(tex), [-26.9, 53.9, SF + 0.03]));
  }
  for (const [id, s] of [['panel_izq', -1], ['panel_der', 1]]) {
    const g = makePart(root, id, L1([s * 26, 0, 0], { info: 'carcasa', shell: true }));
    const x = s * (X1 - 0.5), z1 = s > 0 ? 29 : 14;
    g.add(mesh(rbox(1.0, PH1 - PH0, z1 - ZB, 0.35), grisPanel, [x, (PH0 + PH1) / 2, (ZB + z1) / 2]));
    g.add(mesh(rbox(1.0, 2.4, 57.2, 0.25), zocalo, [s * 35.8, 1.6, 0]));
    screws(g, M.tornillo, M.tornilloNegro, 0.3, s > 0 ? 'x' : '-x', [[x + s * 0.52, PH1 - 3, ZB + 3], [x + s * 0.52, PH1 - 3, z1 - 3], [x + s * 0.52, PH0 + 2.5, ZB + 3], [x + s * 0.52, PH0 + 2.5, z1 - 3]]);
    if (s < 0) {
      // zona delantera del lateral izquierdo (gris oscuro, retranqueada): soporta la bomba y deja pasar los tubos
      const cy = (PH0 + PH1) / 2, czb = 21.2;
      g.add(placaPasos(14.4, PH1 - PH0, 1.0, [[17 - czb, 21.5 - cy, 0.45], [21 - czb, 39.2 - cy, 0.45]], bahia, [-35.3, cy, czb], 'zy', 0.3));
      for (const [y, z] of [[21.5, 17], [39.2, 21]]) g.add(pasamuros(0.45, M.goma, [-35.82, y, z], 'x', 0.25));
    }
  }
  const RP = {                                   // pasos del panel trasero [x, y, r]
    ar: [-23, 14, 0.6], he: [6.5, 55, 0.5], agua1: [-3.6, 45, 0.7], agua2: [-3.6, 52, 0.7], vacio: [13, 9, 1.6],
  };
  {
    const g = makePart(root, 'panel_trasero', L1([0, 0, -30], { info: 'carcasa', shell: true }));
    const RH1 = 58.4, cy = (PH0 + RH1) / 2, z = ZB + 0.5;
    g.add(mesh(rbox(72.6, 2.4, 1.0, 0.25), zocalo, [0, 1.6, -29.1]));
    g.add(placaPasos(X1 - X0 - 2, RH1 - PH0, 1.0, Object.values(RP).map(([x, y, r]) => [x, y - cy, r]), grisPanel, [0, cy, z], 'xy', 0.4));
    for (const [k, [x, y, r]] of Object.entries(RP)) {
      g.add(pasamuros(r + 0.1, k === 'vacio' ? M.goma : M.aceroPulido, [x, y, ZB - 0.05], 'z', k === 'vacio' ? 0.4 : 0.3));
      g.add(pasamuros(r + 0.1, k === 'vacio' ? M.goma : M.aceroPulido, [x, y, ZB + 1.05], 'z', k === 'vacio' ? 0.4 : 0.3));
    }
    const plate = new THREE.MeshStandardMaterial({ map: plateTexture(['7900 ICP-MS', '200–240 V~ 50/60 Hz 30 A', 'Modelo didáctico', 'Explorador 3D']), metalness: 0.6, roughness: 0.4 });
    g.add(mesh(new THREE.PlaneGeometry(9, 4.5), plate, [22, 40, ZB - 0.03], [0, Math.PI, 0]));
    const et = (t, x, y) => { const m = new THREE.MeshStandardMaterial({ map: textTexture([t], { w: 256, h: 64, bg: '#d7dadd', fg: '#2a3038', font: '600 34px Segoe UI' }) }); g.add(mesh(new THREE.PlaneGeometry(3.6, 0.9), m, [x, y, ZB - 0.03], [0, Math.PI, 0])); };
    et('Ar', -23, 11.8); et('He', 6.5, 52.8); et('AGUA', -3.6, 42.8); et('VACÍO', 13, 5.8);
    g.add(mesh(rbox(4.4, 3.2, 1.2, 0.3), M.plasticoNegro, [28, 12, ZB - 0.6]));             // toma de red
    g.add(mesh(rbox(1.8, 1.4, 0.6, 0.15), M.plasticoNegro, [20, 18, ZB - 0.3]));            // LAN
    g.add(mesh(new THREE.PlaneGeometry(24, 10), rejMat(), [24, 28, ZB - 0.03], [0, Math.PI, 0]));
  }
  {
    // tapa blanca: techo, frontal superior derecho y bandas laterales, con cantos redondeados; chimenea corta encima
    const g = makePart(root, 'tapa_superior', L1([0, 46, 0], { info: 'carcasa', shell: true }));
    const SF = 30.4, SR = 36.8, RC = 4, RT = 3, cx = SR - RC, cz = SF - RC;
    g.add(lagoX(perfil(SF, TP, YS, YT, RT, cz), -13.5, cx, blanco));
    g.add(lagoZ(perfil(SR, TP, YS, YT, RT, cx), ZB - 0.1, cz, blanco, 1));
    g.add(esquina(perfil(RC, TP, YS, YT, RT, 0), cx, cz, 1, 1, blanco));
    g.add(lagoZ(perfil(SR, TP, YS, YT, RT, 33.2), ZB - 0.1, 16, blanco, -1));
    g.add(planta([[-33.2, ZB - 0.1], [cx, ZB - 0.1], [cx, cz], [-13.5, cz], [-13.5, 16], [-33.2, 16]], [[CHX, CHZ, 5.6]], TP, YT - TP / 2, blanco));
    g.add(pasamuros(5.3, M.goma, [CHX, YT + 0.02, CHZ], 'y', 0.6));
    const col = blanco.clone(); col.side = THREE.DoubleSide;
    const perf = [[5.9, 0], [6.5, 0], [6.5, 4.6], [6.3, 5.0], [5.9, 5.0], [5.9, 0]].map(([r, y]) => new THREE.Vector2(r, y));
    g.add(mesh(new THREE.LatheGeometry(perf, 64), col, [CHX, YT, CHZ]));
  }

  /* ---------------- CAJA DE LA ANTORCHA Y EXTRACCIÓN ---------------- */
  {
    const g = makePart(root, 'caja_antorcha', L1([0, 0, 0], { shell: true, label: 'equipo' }));
    const OY = 48;                                     // altura del eje de la antorcha
    const xl = -25, xr = -6.2, y0 = 39, y1 = 57, z0 = -2, z1 = 15, cx = (xl + xr) / 2, cy = (y0 + y1) / 2, cz = (z0 + z1) / 2;
    const ac = M.acero.clone(); ac.color.setHex(0xaeb3ba);
    // frontal (con mirilla) y trasera (pasos de los gases del plasma)
    g.add(placaPasos(xr - xl, y1 - y0, 0.4, [[-12 - cx, OY - cy, 4.0]], ac, [cx, cy, z1 - 0.2], 'xy', 0.3));
    g.add(placaPasos(xr - xl, y1 - y0, 0.4, [[-18 - cx, OY + 3.5 - cy, 0.5], [-19.2 - cx, OY + 3.5 - cy, 0.5]], ac, [cx, cy, z0 + 0.2], 'xy', 0.3));
    // laterales: paso del conector (izquierda) y ventana de la interfaz (derecha)
    g.add(placaPasos(z1 - z0 - 0.8, y1 - y0, 0.4, [[6.5 - cz, OY - cy, 1.0]], ac, [xl + 0.2, cy, cz], 'zy', 0.3));
    g.add(placaPasos(z1 - z0 - 0.8, y1 - y0, 0.4, [[6 - cz, OY - cy, 3.0]], ac, [xr - 0.2, cy, cz], 'zy', 0.3));
    // suelo (pasos de la bobina) y techo (chimenea)
    g.add(placaPasos(xr - xl - 0.8, z1 - z0 - 0.8, 0.4, [[-11.1 - cx, 6 - cz, 0.5], [-9.5 - cx, 6 - cz, 0.5]], ac, [cx, y0 + 0.2, cz], 'xz', 0.3));
    g.add(placaPasos(xr - xl - 0.8, z1 - z0 - 0.8, 0.4, [[CHX - cx, CHZ - cz, 4.5]], ac, [cx, y1 - 0.2, cz], 'xz', 0.3));
    // mirilla de vidrio de protección UV
    const uv = M.vidrio.clone(); uv.color.setHex(0x5a4a7a); uv.opacity = 0.5;
    g.add(mesh(cylZ(4.0, 0.2, 48), uv, [-12, OY, z1 - 0.2]));
    g.add(pasamuros(4.15, M.aceroOscuro, [-12, OY, z1 + 0.05], 'z', 0.3));
    g.add(pasamuros(1.0, M.goma, [xl - 0.02, OY, 6.5], 'x', 0.25));
    // soporte de la antorcha (posicionador motorizado)
    const tx = W(AX.T_0 - 0.2);
    g.add(mesh(new THREE.CylinderGeometry(1.6, 1.6, 1.0, 48, 1, true).rotateZ(Math.PI / 2), M.aluminio, [tx.x, tx.y, tx.z]));
    g.add(mesh(box(1.2, 6.8, 1.2), M.aluminio, [tx.x, y0 + 0.6 + 3.4, tx.z]));
    g.add(mesh(rbox(3.4, 1.6, 3.4, 0.2), M.anodizado, [tx.x, y0 + 1.2, tx.z]));
    // conducto de extracción hasta la chimenea de la tapa
    const duc = M.aluminio.clone(); duc.side = THREE.DoubleSide;
    g.add(mesh(new THREE.CylinderGeometry(4.6, 4.6, 7.4, 48, 1, true), duc, [CHX, y1 + 3.7, CHZ]));
    const w = new THREE.MeshStandardMaterial({ map: warningTexture('UV · ALTA TEMPERATURA'), roughness: 0.45 });
    g.add(mesh(new THREE.PlaneGeometry(8, 3), w, [-12, 54.2, z1 + 0.03]));
  }

  /* ---------------- VACÍO ---------------- */
  {
    const g = makePart(root, 'camara_vacio', L1([0, 0, 0], { shell: true, label: 'equipo' }));
    const xa = W(AX.CH_0).x, xb = W(AX.CH_1).x, yb = 41.5, yt = 53.3, z0 = 0, z1 = 12;
    // pared de la base del cono de separación (separa la región de interfaz de la cámara intermedia)
    g.add(placaPasos(z1 - z0, 54.5 - yb, 0.6, [[0, 48 - (54.5 + yb) / 2, 1.2]], M.aluminio, [xa - 0.3, (54.5 + yb) / 2, 6], 'zy', 0.3));
    // fondo con las bocas de la turbo y el paso del detector
    const fx = (xa + xb) / 2;
    g.add(placaPasos(xb - xa, z1 - z0, 0.5, [[14 - fx, 0, 2.45], [1.5 - fx, 0, 1.3], [W(AX.EM.x).x - fx, 0, 0.55]], M.aluminio, [fx, yb + 0.25, 6], 'xz', 0.2));
    g.add(mesh(rbox(0.5, yt - yb - 0.5, z1 - z0, 0.15), M.aluminio, [xb - 0.25, (yt + yb + 0.5) / 2, 6]));
    for (const z of [z0 + 0.25, z1 - 0.25]) g.add(mesh(rbox(xb - 0.5 - xa, yt - yb - 0.5, 0.5, 0.15), M.aluminio, [(xa + xb - 0.5) / 2, (yt + yb + 0.5) / 2, z]));
    // pasos de RF del cuadrupolo y manómetros
    g.add(mesh(cylZ(0.5, 1.2, 24), M.ceramica, [21, 48, -0.6]));
    g.add(mesh(cylZ(0.8, 0.3, 24), M.aceroPulido, [21, 48, -0.15]));
    for (const x of [4, 26]) { g.add(mesh(cylZ(0.9, 2.2, 32), M.aceroPulido, [x, 51, z1 + 1.1])); g.add(mesh(rbox(2.4, 2.4, 1.6, 0.3), M.plasticoNegro, [x, 51, z1 + 3.0])); }
    refs.quadFeed = new THREE.Vector3(21, 48, -1.15);
  }
  {
    const g = makePart(root, 'tapa_vacio', L1([0, 18, 0], { info: 'camara_vacio' }));
    const xa = W(AX.CH_0).x, xb = W(AX.CH_1).x;
    g.add(mesh(rbox(xb - xa, 1.2, 12, 0.3), M.aluminio, [(xa + xb) / 2, 53.9, 6]));
    g.add(mesh(cylY(0.45, 1.1, 20), M.aceroPulido, [6.5, 55.05, 6]));
    g.add(mesh(cylY(0.6, 0.4, 6), M.aceroPulido, [6.5, 54.75, 6]));
    const pts = []; for (let i = 0; i < 8; i++) pts.push([xa + 1.5 + i * (xb - xa - 3) / 7, 54.52, 1.2], [xa + 1.5 + i * (xb - xa - 3) / 7, 54.52, 10.8]);
    screws(g, M.tornillo, M.tornilloNegro, 0.28, 'y', pts);
  }
  {
    const g = makePart(root, 'bomba_turbo', L1([0, -6, 0], { label: 'equipo' }));
    // turbo de flujo dividido: boca principal (analizador) y boca lateral (cámara intermedia)
    g.add(mesh(cylY(5.0, 11.9, 56), M.aluminio, [14, 34.25, 6]));
    g.add(mesh(cylY(3.4, 0.4, 48), M.aceroPulido, [14, 40.4, 6]));
    g.add(mesh(cylY(2.3, 1.6, 40), M.aceroPulido, [14, 41.4, 6]));
    for (let i = 1; i < 12; i++) { if (i === 9) continue; const a = (i / 12) * Math.PI * 2; g.add(mesh(box(0.25, 8, 0.6), M.aluminio, [14 + Math.cos(a) * 5.05, 32.5, 6 + Math.sin(a) * 5.05], [0, -a, 0])); }
    g.add(mesh(cylX(1.15, 7.7, 32), M.aceroPulido, [5.35, 38.2, 6]));
    g.add(mesh(new THREE.SphereGeometry(1.15, 24, 16), M.aceroPulido, [1.5, 38.2, 6]));
    g.add(mesh(cylY(1.15, 4.9, 32), M.aceroPulido, [1.5, 39.65, 6]));
    g.add(mesh(cylZ(0.8, 1.6, 24), M.aceroPulido, [14, 30, 0.4]));
    g.add(mesh(rbox(1.2, 1.6, 1.6, 0.2), M.plasticoNegro, [19.4, 30, 6]));
    g.add(mesh(cylY(5.1, 0.6, 56), M.anodizado, [14, 28.3, 6]));
  }
  {
    const g = makePart(root, 'bomba_rotatoria', L1([18, 0, 0], { label: 'equipo' }));
    const cx = 70, cz = -15;
    g.add(mesh(rbox(14, 16, 18, 0.8), blanco, [cx + 3, 8.5, cz]));
    g.add(mesh(cylX(7.5, 16, 48), M.anodizado, [cx - 12, 8.5, cz]));
    for (let i = 0; i < 9; i++) g.add(mesh(new THREE.TorusGeometry(7.6, 0.3, 8, 48).rotateY(Math.PI / 2), M.anodizado, [cx - 19 + i * 1.75, 8.5, cz]));
    g.add(mesh(cylY(1.5, 3.4, 32), M.aceroPulido, [cx, 18.2, cz]));
    g.add(mesh(cylY(2.0, 0.5, 32), M.aceroPulido, [cx, 19.75, cz]));
    for (const x of [cx - 14, cx + 6]) for (const z of [cz - 7, cz + 7]) g.add(mesh(cylY(1.0, 0.5, 16), M.goma, [x, 0.25, z]));
    const vis = M.vidrio.clone(); vis.color.setHex(0xd9b85c); vis.opacity = 0.6;
    g.add(mesh(cylZ(1.2, 0.3, 24), vis, [cx + 3, 6, cz + 9.15]));
    const lab = new THREE.MeshStandardMaterial({ map: textTexture(['MS40+'], { w: 256, h: 64, bg: '#eef0f2', fg: '#3a4048', font: '600 40px Segoe UI' }) });
    g.add(mesh(new THREE.PlaneGeometry(4.4, 1.1), lab, [cx + 3, 12.5, cz + 9.03]));
    refs.pumpIn = new THREE.Vector3(cx, 19.85, cz);
  }
  {
    const g = makePart(root, 'linea_vacio', L1([0, 0, 0], { info: 'bomba_rotatoria' }));
    const mat = M.aceroOscuro.clone(); mat.color.setHex(0xb9bec4); mat.roughness = 0.35;
    // T de KF que reúne el vacío previo de la interfaz y el escape de la turbo
    g.add(mesh(cylZ(1.1, 7, 32), M.aceroPulido, [13, 9, -22]));
    g.add(mesh(cylX(1.1, 2.6, 32), M.aceroPulido, [11.7, 9, -22]));
    for (const z of [-25.4, -18.6]) g.add(mesh(cylZ(1.45, 0.4, 32), M.aceroPulido, [13, 9, z]));
    g.add(mesh(cylX(1.45, 0.4, 32), M.aceroPulido, [10.5, 9, -22]));
    const i = W(2.4, -8.45, 0);
    cableFlex(g, [[i.x, i.y + 0.1, i.z, 'interfaz'], [i.x, i.y - 1.6, i.z], [-3.6, DY, 6, 'chasis'], [-3.6, DY - 2, 6], [-1.6, 22, -4], [5, 11, -16], [9.4, 9, -21.4], [10.35, 9, -22]], 0.75, mat, { seg: 110, radial: 12 });
    cableFlex(g, [[14, 30, -0.3, 'bomba_turbo'], [14, 29.3, -3, 'bomba_turbo'], [13.6, 20, -10.5], [13, 11, -16], [13, 9, -18.45]], 0.75, mat, { seg: 70, radial: 12 });
    const p = refs.pumpIn;
    cableFlex(g, [[13, 9, -25.5], [13, 9, ZB + 1.8, 'panel_trasero'], [13, 9, ZB - 0.8, 'panel_trasero'], [13, 8, -36, 'panel_trasero'], [40, 6, -37, 'panel_trasero'],
      [p.x, 9, -34, 'bomba_rotatoria'], [p.x, 19, -27, 'bomba_rotatoria'], [p.x, 23.5, -18.5, 'bomba_rotatoria'], [p.x, p.y + 0.1, p.z, 'bomba_rotatoria']], 0.85, mat, { seg: 160, radial: 12 });
  }

  /* ---------------- GASES ---------------- */
  {
    const g = makePart(root, 'control_gases', L1([0, 0, 0], { label: 'equipo' }));
    // módulo de controladores de caudal másico (plasma, auxiliar, nebulizador, dilución)
    g.add(mesh(rbox(14, 12, 16, 0.4), M.anodizado, [-24, 14.5, -18]));
    for (let i = 0; i < 4; i++) g.add(mesh(rbox(2.6, 0.9, 7, 0.2), M.aluminio, [-29 + i * 3.2, 20.9, -20.5]));
    for (const x of [-18, -19.2, -27.5]) g.add(mesh(cylY(0.4, 0.6, 16), M.aceroPulido, [x, 20.75, -14]));
    g.add(mesh(cylZ(0.45, 0.6, 16), M.aceroPulido, [-23, 14, -26.25]));
    const lab = new THREE.MeshStandardMaterial({ map: textTexture(['MFC  Ar'], { w: 256, h: 64, bg: '#646b74', fg: '#e8ebef', font: '600 34px Segoe UI' }) });
    g.add(mesh(new THREE.PlaneGeometry(5, 1.25), lab, [-24, 14.5, -9.97]));
  }
  {
    const g = makePart(root, 'linea_gases', L1([0, 0, 0], { info: 'control_gases' }));
    const ar = M.ptfe, he = M.aceroPulido;
    // argón: toma trasera → módulo de caudal
    cableFlex(g, [[-23, 14, ZB - 0.9, 'panel_trasero'], [-23, 14, ZB + 0.6, 'panel_trasero'], [-23, 14, ZB + 2.2], [-23, 14, -26.5]], 0.22, metalTubo, { seg: 20, radial: 8 });
    cableFlex(g, [[-23, 14, ZB - 0.9, 'panel_trasero'], [-23, 13, ZB - 3, 'panel_trasero'], [-22, 4, -40, 'panel_trasero'], [-21, 0.4, -46, 'panel_trasero']], 0.22, metalTubo, { seg: 40, radial: 8 });
    // gas de plasma y auxiliar → brazos de la antorcha
    const ins = [W(AX.T_0 + 2.0, AX.T_R + 0.93, 0), W(AX.T_0 + 0.8, AX.T_R + 0.93, 0)];
    for (const [k, x] of [[0, -18], [1, -19.2]]) {
      const e = ins[k];
      cableFlex(g, [[x, 21.05, -14, 'control_gases'], [x, 28, -14], [x, DY, -14, 'chasis'], [x, 44, -9.5], [x, 51.5, -4.2], [x, 51.5, -2.4, 'caja_antorcha'], [x, 51.5, -1.4, 'caja_antorcha'],
        [x, 51.1, 2.6], [e.x, e.y + 0.6, e.z - 0.7, 'antorcha'], [e.x, e.y - 0.05, e.z, 'antorcha']], 0.17, ar, { seg: 110, radial: 8 });
    }
    // gas del nebulizador: sube por el paso del entrepaño junto a la cámara de pulverización
    const nb = W(AX.SC_X + 2.3, AX.SC_Y, AX.NEB_Z1 - 2);
    cableFlex(g, [[-27.5, 21.05, -14, 'control_gases'], [-27.5, 22.5, -10], [-27.5, 30, 4], [-27.5, DY, 12, 'chasis'], [-27.6, 39.6, 15], [-27.9, 43.0, 19.6, 'nebulizador'],
      [nb.x + 0.3, nb.y, nb.z, 'nebulizador'], [nb.x - 0.05, nb.y, nb.z, 'nebulizador']], 0.17, ar, { seg: 100, radial: 8 });
    // helio de la celda ORS4: toma trasera → paso de la tapa de la cámara
    cableFlex(g, [[6.5, 55, ZB - 0.9, 'panel_trasero'], [6.5, 55, ZB + 0.6, 'panel_trasero'], [6.5, 55, ZB + 2.4], [6.5, 56.5, -12], [6.5, 57.2, 1.6, 'tapa_vacio'], [6.5, 56.0, 5.0, 'tapa_vacio'], [6.5, 55.55, 6, 'tapa_vacio']], 0.12, he, { seg: 70, radial: 8 });
    cableFlex(g, [[6.5, 55, ZB - 0.9, 'panel_trasero'], [6.5, 49, ZB - 4, 'panel_trasero'], [7.5, 10, -42, 'panel_trasero'], [8.5, 0.4, -47, 'panel_trasero']], 0.12, he, { seg: 60, radial: 8 });
  }

  /* ---------------- REFRIGERACIÓN ---------------- */
  {
    const g = makePart(root, 'enfriador', L1([0, 0, -30], { label: 'equipo' }));
    g.add(mesh(rbox(30, 46, 36, 0.8), blanco, [-15, 23.4, -68]));
    g.add(mesh(new THREE.PlaneGeometry(24, 12), rejMat(), [-15, 12, -49.97]));
    g.add(mesh(rbox(9, 4, 0.4, 0.2), M.pantalla, [-21, 38, -49.9]));
    for (const y of [30, 36]) g.add(mesh(cylZ(0.6, 1.2, 20), M.aceroPulido, [-6, y, -49.6]));
    const lab = new THREE.MeshStandardMaterial({ map: textTexture(['G3292A'], { w: 256, h: 64, bg: '#eef0f2', fg: '#3a4048', font: '600 40px Segoe UI' }) });
    g.add(mesh(new THREE.PlaneGeometry(5, 1.25), lab, [-10, 42, -49.97]));
  }
  {
    const g = makePart(root, 'linea_agua', L1([0, 0, 0], { info: 'enfriador' }));
    const mat = M.cableGris;
    for (const [k, [ya, yb]] of [[0, [45, 30]], [1, [52, 36]]]) {
      const s = W(2.4, k ? 4 : -3, -8.2);
      cableFlex(g, [[s.x, s.y, s.z + 0.05, 'interfaz'], [s.x, s.y, s.z - 3], [-3.6, ya, ZB + 2.4], [-3.6, ya, ZB + 0.6, 'panel_trasero'], [-3.6, ya, ZB - 0.9, 'panel_trasero'],
        [-3.8, ya - 2.5, -38, 'panel_trasero'], [-6, yb, -48.3, 'enfriador'], [-6, yb, -48.95, 'enfriador']], 0.32, mat, { seg: 90, radial: 10 });
    }
  }

  /* ---------------- RF Y ELECTRÓNICA ---------------- */
  {
    const g = makePart(root, 'generador_rf', L1([0, 0, 0], { label: 'equipo' }));
    g.add(mesh(rbox(17, 32, 22, 0.5), M.anodizado, [-16.5, 18.5, 11]));
    for (let i = 0; i < 10; i++) g.add(mesh(box(0.5, 28, 1.0), M.aluminio, [-7.75, 18.5, 1.5 + i * 2.1]));
    for (const x of [-11.1, -9.5]) g.add(mesh(cylY(0.6, 0.6, 20), M.ceramica, [x, 34.8, 6]));
    const lab = new THREE.MeshStandardMaterial({ map: textTexture(['RF 27 MHz'], { w: 256, h: 64, bg: '#646b74', fg: '#e8ebef', font: '600 36px Segoe UI' }) });
    g.add(mesh(new THREE.PlaneGeometry(5, 1.25), lab, [-16.5, 24, 22.03]));
    const w = new THREE.MeshStandardMaterial({ map: warningTexture('ALTA TENSIÓN · RF'), roughness: 0.45 });
    g.add(mesh(new THREE.PlaneGeometry(7, 2.6), w, [-16.5, 18, 22.03]));
    // conductores de la bobina de carga (tubo de cobre plateado)
    for (const x of [-11.1, -9.5]) cableFlex(g, [[x, 34.9, 6, 'generador_rf'], [x, DY, 6, 'chasis'], [x, 39.2, 6, 'caja_antorcha'], [x, 43.4, 6], [x, 44.75, 6, 'bobina']], 0.25, M.cobre, { seg: 40, radial: 10 });
  }
  {
    const g = makePart(root, 'electronica', L1([16, 0, 0], { label: 'equipo' }));
    g.add(mesh(rbox(13, 24.5, 23, 0.4), M.anodizado, [28.5, 13.75, -15.5]));
    g.add(mesh(rbox(0.3, 18, 19, 0.06), M.pcb, [21.85, 13.5, -15.5]));
    for (let i = 0; i < 7; i++) g.add(mesh(box(0.35, 1.0 + (i % 3) * 0.4, 1.4), M.chip, [21.55, 8 + i * 1.9, -20 + (i % 2) * 6]));
    g.add(mesh(new THREE.PlaneGeometry(18, 8), rejMat(), [28.5, 13, -3.97]));
    const w = new THREE.MeshStandardMaterial({ map: warningTexture('ALTA TENSIÓN'), roughness: 0.45 });
    g.add(mesh(new THREE.PlaneGeometry(7, 2.6), w, [28.5, 21.5, -3.97]));
    for (const [x, z] of [[26, -9], [30.6, -4.6]]) g.add(mesh(rbox(1.4, 0.6, 1.4, 0.15), M.plasticoNegro, [x, 26.3, z - 0.1]));
    // alta tensión del detector, RF del cuadrupolo, controlador de la turbo y alimentación
    const d = W(AX.EM.x, AX.EM.y - 6.95, 0);
    cableFlex(g, [[d.x, d.y + 0.05, d.z, 'detector'], [d.x, d.y - 0.8, d.z - 1.4], [d.x, 31, -1.0], [d.x, 26.9, -4.0], [d.x, 26.45, -4.65]], 0.2, M.cable, { seg: 60, radial: 8 });
    const q = refs.quadFeed;
    cableFlex(g, [[q.x, q.y, q.z, 'camara_vacio'], [q.x, q.y - 1.5, -2.2], [23.5, 37, -5.5], [26, 29, -8.6], [26, 26.45, -9.1]], 0.3, M.cable, { seg: 60, radial: 8 });
    cableFlex(g, [[21.95, 12, -6, 'electronica'], [20.8, 17, -2.5], [20.6, 27, 3.0], [20.05, 30, 6, 'bomba_turbo']], 0.2, M.cable, { seg: 50, radial: 8 });
    cableFlex(g, [[28, 12, ZB + 0.6, 'panel_trasero'], [28, 12, ZB + 1.6], [28, 12, -27.05]], 0.3, M.cable, { seg: 16, radial: 8 });
    cableFlex(g, [[28, 12, ZB - 1.15, 'panel_trasero'], [28, 10, ZB - 3.5, 'panel_trasero'], [29, 3, -40, 'panel_trasero'], [30, 0.4, -47, 'panel_trasero']], 0.35, M.cable, { seg: 40, radial: 8 });
  }

  /* ---------------- BOMBA PERISTÁLTICA (lateral izquierdo) ---------------- */
  // Grupo local de la bomba: origen en el eje del rodillo; +z local = hacia fuera (−X del mundo), +x local = hacia el frontal (+Z).
  const P0 = new THREE.Vector3(-35.8, 29.5, 21.5);
  const PZ = [5.3, 6.3, 7.3];                      // canales (distancia al lateral): muestra, patrón interno, drenaje
  const PR = 3.35;
  const PW = (a, b, c) => [P0.x - c, P0.y + b, P0.z + a];   // local de la bomba → mundo
  {
    const g = makePart(root, 'bomba_peristaltica', L1([-40, 0, 0], { label: 'equipo' }));
    const pg = new THREE.Group(); pg.position.copy(P0); pg.rotation.y = -Math.PI / 2; g.add(pg);
    pg.add(mesh(rbox(14, 11, 4.6, 0.6), M.plasticoNegro, [0, 0, 2.3]));
    const rotor = new THREE.Group(); rotor.position.set(0, 0, 6.3); pg.add(rotor);
    rotor.add(mesh(cylZ(2.6, 3.4, 48), M.aceroPulido, [0, 0, 0]));
    for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; rotor.add(mesh(cylZ(0.35, 3.2, 20), M.aceroPulido, [Math.cos(a) * 2.75, Math.sin(a) * 2.75, 0])); }
    rotor.add(mesh(cylZ(1.0, 0.4, 32), M.aceroOscuro, [0, 0, 1.85]));
    refs.rotor = rotor;
    // abrazaderas de los cartuchos y palancas
    for (const c of PZ) {
      pg.add(mesh(rbox(7.2, 0.9, 0.8, 0.2), gris, [0, PR + 0.72, c]));
      pg.add(mesh(rbox(0.9, 4.2, 0.8, 0.2), gris, [-8.4, PR - 0.9, c]));
    }
    pg.add(mesh(cylZ(0.25, 3.0, 12), M.aceroOscuro, [3.6, PR + 0.72, 6.3]));
    // tubos de bomba (cada canal un color) sobre el rodillo y conectores inferiores
    const cols = [0xe07b22, 0x2b2e33, 0xd8c03a];
    PZ.forEach((c, k) => {
      const pts = [[-7.4, -1.7, c], [-7.0, 0.1, c], [-5.4, 1.5, c]];
      for (let i = 0; i <= 10; i++) { const a = Math.PI * (0.84 - 0.68 * (i / 10)); pts.push([Math.cos(a) * PR, Math.sin(a) * PR, c]); }
      pts.push([5.4, 1.5, c], [7.0, 0.1, c], [7.4, -1.7, c]);
      cableFlex(pg, pts, 0.2, tubo(cols[k]), { seg: 90, radial: 10 });
      for (const a of [-7.4, 7.4]) pg.add(mesh(cylY(0.3, 0.8, 16), M.ptfe, [a, -2.1, c]));
    });
    const lab = new THREE.MeshStandardMaterial({ map: textTexture(['Bomba peristáltica · 10 rodillos'], { w: 512, h: 64, bg: '#1d1f23', fg: '#e8ebef', font: '500 30px Segoe UI' }), roughness: 0.5 });
    pg.add(mesh(new THREE.PlaneGeometry(9, 1.1), lab, [0, -4.3, 4.63]));
    // bloque de conexión de la muestra (negro, con racor blanco) sobre la bomba y su escuadra
    g.add(mesh(rbox(6.6, 7, 8, 0.6), M.plasticoNegro, [-40.7, 41, 23.5]));
    g.add(mesh(rbox(1.6, 3.4, 4, 0.2), M.plasticoNegro, [-36.6, 39.0, 25.6]));
    g.add(mesh(cylX(1.8, 3.4, 40), M.ptfe, [-45.7, 41.6, 23.2]));
    g.add(mesh(cylX(1.9, 0.5, 40), tubo(0xf7f7f4), [-47.65, 41.6, 23.2]));
    g.add(mesh(cylY(0.4, 0.8, 16), M.ptfe, [-41.6, 37.1, 25.8]));
    // bandeja de goteo
    const bd = M.plasticoNegro.clone(); bd.color.setHex(0x2a2d31);
    g.add(mesh(rbox(13.8, 0.6, 22, 0.15), bd, [-43.6, 17.3, 19]));
    g.add(mesh(rbox(0.5, 3.1, 22, 0.15), bd, [-50.25, 18.85, 19]));
    for (const z of [8.25, 29.75]) g.add(mesh(rbox(13.8, 3.1, 0.5, 0.15), bd, [-43.6, 18.85, z]));
    g.add(mesh(rbox(0.8, 5, 10, 0.15), bd, [-36.3, 17.1, 21]));
  }
  {
    const g = makePart(root, 'residuos', L1([-40, 0, 0], { info: 'bomba_peristaltica' }));
    const pe = M.ptfe.clone(); pe.color.setHex(0xe9ecef); pe.transparent = true; pe.opacity = 0.85;
    g.add(mesh(cylY(4.2, 11, 40), pe, [-44.5, 5.5, 19]));
    g.add(mesh(cylY(1.6, 1.2, 24), M.plasticoNegro, [-44.5, 11.6, 19]));
    const lab = new THREE.MeshStandardMaterial({ map: textTexture(['RESIDUOS'], { w: 256, h: 64, bg: '#f2c230', fg: '#1d1f23', font: '700 40px Segoe UI' }) });
    g.add(mesh(new THREE.PlaneGeometry(4, 1.0), lab, [-44.5, 6.5, 23.23]));
  }

  /* ---------------- AUTOMUESTREADOR SPS 4 (contexto, a la izquierda) ---------------- */
  const SX0 = -108, SX1 = -54, SZ0 = -15, SZ1 = 30, SXC = (SX0 + SX1) / 2;
  const PROBE = new THREE.Vector3(-90.5, 0, 15.4);
  {
    const g = makePart(root, 'automuestreador', L1([-45, 0, 0], { label: 'equipo' }));
    g.add(mesh(rbox(SX1 - SX0, 3.2, SZ1 - SZ0, 0.6), grisMarco, [SXC, 1.9, (SZ0 + SZ1) / 2]));
    for (const x of [SX0 + 3, SX1 - 3]) for (const z of [SZ0 + 3, SZ1 - 3]) g.add(mesh(cylY(1.4, 0.3, 16), M.goma, [x, 0.15, z]));
    // marcos laterales con ventana
    for (const x0 of [SX0, SX1 - 2.4]) {
      const s = rr(SZ0, SZ1, 3.5, 37.6, 2.4); s.holes.push(rr(SZ0 + 4, SZ1 - 4, 8, 33, 1.6, new THREE.Path()));
      g.add(lagoX(s, x0, x0 + 2.4, grisMarco));
    }
    // cubierta blanca superior (pórtico), moldura y frente transparente
    const t = new THREE.Shape(); t.moveTo(SZ0, 37.6); t.lineTo(SZ1, 37.6); t.lineTo(SZ1, 43); t.absarc(SZ1 - 5, 43, 5, 0, Math.PI / 2, false);
    t.lineTo(SZ0 + 2, 48); t.absarc(SZ0 + 2, 46, 2, Math.PI / 2, Math.PI, false); t.lineTo(SZ0, 37.6);
    g.add(lagoX(t, SX0, SX1, blanco));
    g.add(mesh(rbox(SX1 - SX0 - 4.8, 1.4, 1.0, 0.2), grisMarco, [SXC, 36.9, 29.4]));
    const acr = M.vidrio.clone(); acr.opacity = 0.2;
    g.add(mesh(box(SX1 - SX0 - 4.8, 32.6, 0.4), acr, [SXC, 19.9, 29.6]));
    const stex = rotulo((c) => {
      chispa(c, 30, 40, 20, '#4a5058'); c.fillStyle = '#3c424a'; c.textBaseline = 'middle';
      c.font = '600 30px "Segoe UI", Arial'; c.fillText('Agilent Technologies', 62, 40);
      c.font = '700 34px "Segoe UI", Arial'; c.fillText('SPS 4', 62, 94);
      const w = c.measureText('SPS 4').width; c.font = '500 24px "Segoe UI", Arial'; c.fillText('Autosampler', 62 + w + 14, 97);
    }, 512, 128);
    g.add(mesh(new THREE.PlaneGeometry(9, 2.25), decal(stex), [SX0 + 9, 43.2, SZ1 + 0.03]));
    for (let i = 0; i < 4; i++) g.add(mesh(new THREE.PlaneGeometry(0.8, 0.3), M.ledVerde, [SX1 - 9 + i * 1.1, 43.2, SZ1 + 0.03]));
    // brazo: carril X, brazo Y y carro Z con la sonda
    g.add(mesh(rbox(SX1 - SX0 - 5, 2.2, 3, 0.3), blanco, [SXC, 36.3, -9]));
    g.add(mesh(rbox(3.4, 2, 28.3, 0.3), blanco, [PROBE.x, 34.2, (-10.5 + PROBE.z + 2.4) / 2]));
    g.add(mesh(rbox(3.6, 9.5, 4.6, 0.4), blanco, [PROBE.x, 28.45, PROBE.z]));
    g.add(mesh(cylY(0.13, 12.7, 12), M.aceroPulido, [PROBE.x, 17.35, PROBE.z]));
    // gradillas con tubos y estación de lavado
    const rack = M.ptfe.clone(); rack.color.setHex(0xf4f5f6);
    const tubos = [];
    for (const rx of [-100.5, -90.5, -71.5, -61.5]) {
      g.add(mesh(rbox(9, 6, 24, 0.5), rack, [rx, 6.5, 14]));
      for (let i = 0; i < 3; i++) for (let j = 0; j < 8; j++) tubos.push(new THREE.CylinderGeometry(0.8, 0.8, 10, 16, 1, true).translate(rx + (i - 1) * 2.6, 9.5, 14 + (j - 3.5) * 2.75));
    }
    const tm = M.ptfe.clone(); tm.color.setHex(0xf1f4f7); tm.transparent = true; tm.opacity = 0.7; tm.side = THREE.DoubleSide;
    const tg = new THREE.Mesh(fusion(tubos), tm); tg.castShadow = true; g.add(tg);
    g.add(mesh(rbox(6, 11, 8, 0.6), rack, [-81, 9, 14]));
    for (const z of [12, 16]) g.add(mesh(cylY(1.2, 0.1, 24), M.plasticoNegro, [-81, 14.55, z]));
    g.add(mesh(cylX(1.3, 2.5, 24), M.plasticoNegro, [SX0 - 1.25, 5.6, 0]));
  }

  /* ---------------- TUBOS DE MUESTRA, DRENAJE Y RESIDUOS ---------------- */
  {
    const g = makePart(root, 'tubos_muestra', L1([0, 0, 0], { info: 'bomba_peristaltica' }));
    const ptfe = tubo(0xf4f4f0);
    const fin = (a, c) => [[...PW(a, -3.3, c), 'bomba_peristaltica'], [...PW(a, -2.45, c), 'bomba_peristaltica']];
    // captación: sonda del automuestreador → ventana del marco derecho → canal 1 (entrada trasera)
    const A = 'automuestreador', B = 'bomba_peristaltica';
    cableFlex(g, [[PROBE.x + 1.85, 31.5, PROBE.z, A], [-86, 31.8, 16, A], [-70, 32, 17.5, A], [-55.2, 31, 18, A], [-51, 30, 17.4, A], [-46.5, 29.5, 14.6, B],
      [-42.6, 25.6, 13.5, B], ...fin(-7.4, PZ[0])], 0.12, ptfe, { seg: 160, radial: 8 });
    // canal 1 (salida delantera) → bloque de conexión
    cableFlex(g, [...fin(7.4, PZ[0]).reverse(), [-41.6, 25.6, 30.4, B], [-43.2, 29.5, 31.4, B], [-43.4, 34.5, 29.6, B], [-41.6, 36.0, 26.4, B], [-41.6, 36.95, 25.8, B]],
      0.12, ptfe, { seg: 100, radial: 8 });
    // bloque → paso del lateral → nebulizador
    const n = W(AX.SC_X, AX.SC_Y, AX.NEB_Z1 + 0.8);
    cableFlex(g, [[-37.45, 39.2, 21, B], [-36.6, 39.2, 21, 'panel_izq'], [-35.3, 39.2, 21, 'panel_izq'], [-34.2, 39.3, 21.2], [-33, 41.0, 22.6], [-31.8, 43.4, 25.4],
      [n.x, n.y, n.z + 0.4, 'nebulizador'], [n.x, n.y, n.z - 0.05, 'nebulizador']], 0.1, ptfe, { seg: 100, radial: 8 });
    // drenaje: cámara → entrepaño → paso del lateral → canal 3 (entrada trasera)
    const d = W(AX.SC_X, AX.SC_Y - AX.SC_R - 1.3, AX.SC_Z0 + 0.8);
    cableFlex(g, [[d.x, d.y + 0.05, d.z, 'camara_nebulizacion'], [d.x, d.y - 1.5, d.z, 'camara_nebulizacion'], [-31, DY, 4.8, 'chasis'], [-31.6, 32, 7.5], [-33.2, 26, 15.5], [-34.3, 21.6, 16.9, 'panel_izq'],
      [-35.3, 21.5, 17, 'panel_izq'], [-36.4, 21.5, 17, 'panel_izq'], [-38.6, 22.2, 15.6, B], [-42.4, 24.4, 13.6, B], ...fin(-7.4, PZ[2])], 0.15, ptfe, { seg: 180, radial: 8 });
    // canal 3 (salida delantera) → bidón de residuos bajo la bandeja
    cableFlex(g, [...fin(7.4, PZ[2]).reverse(), [-44.2, 25.2, 30.6, B], [-47.5, 22, 31.6, B], [-51.6, 16, 31, B], [-51.6, 13.4, 25.5, B], [-47.5, 13.3, 20.2, 'residuos'], [-44.5, 13.2, 19, 'residuos'],
      [-44.5, 11.9, 19, 'residuos']], 0.15, ptfe, { seg: 120, radial: 8 });
  }

  refs.analyzer = buildAnalizador(root);
  refs.update = () => {};
  return refs;
}
