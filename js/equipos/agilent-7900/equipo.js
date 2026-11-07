// Equipo completo Agilent 7900 ICP-MS (730 × 600 × 595 mm): mueble de sobremesa con compartimento de introducción de muestra
// tras una puerta, caja de la antorcha con chimenea de extracción, cámara de vacío con turbo de flujo dividido, bomba rotatoria
// externa, control de gases, generador de RF de 27 MHz, electrónica, bomba peristáltica, automuestreador SPS 4 y enfriador (contexto).
// Todos los cables y mangueras son flexibles (cableFlex) y siguen a las piezas que conectan al explosionar.
import * as THREE from 'three';
import { M } from '../../materials.js';
import { mesh, rbox, box, cylX, cylY, cylZ, grilleTexture, textTexture, screws, plateTexture, warningTexture, placaPasos, pasamuros } from '../../geom.js';
import { makePart, cableFlex } from '../../parts.js';
import { buildAnalizador } from './analizador.js';
import { ORIGEN, AX, CAB, W } from './geometria.js';

const L1 = (offset, extra = {}) => ({ level: 1, offset, mode: 'equipo', ...extra });
const { X0, X1, ZB, ZF, H } = CAB;
const DY = 21.8;                         // altura del entrepaño (centro); cara superior 22,3
const PT = 59.4;                         // centro de la tapa superior (58,8–60,0)
const PH0 = 0.5, PH1 = 58.6;             // altura de los paneles

export function buildEquipo(root) {
  const refs = {};
  const blanco = M.carcasa.clone(); blanco.color.setHex(0xeceef0);
  const gris = M.carcasaOsc.clone(); gris.color.setHex(0x4a5059);
  const grisMedio = M.carcasa.clone(); grisMedio.color.setHex(0xb9bec4);
  const grille = grilleTexture(26, 8);
  const rejilla = (w, h) => { const m = blanco.clone(); m.map = grille; m.color.setHex(0xa6abb2); return new THREE.PlaneGeometry(w, h); };
  const rejMat = () => { const m = blanco.clone(); m.map = grille; m.color.setHex(0xa6abb2); return m; };
  const tubo = (c) => { const m = M.ptfe.clone(); m.color.setHex(c); return m; };
  const metalTubo = M.aceroPulido;

  /* ---------------- BASTIDOR Y ENTREPAÑO ---------------- */
  // pasos del entrepaño [x, z, r] en el mundo
  const PASOS = { drenaje: [-31, 4.8, 0.75], neb: [-27.5, 12, 0.5], bob1: [-11.1, 6, 0.6], bob2: [-9.5, 6, 0.6], plasma: [-18, -14, 0.5], aux: [-19.2, -14, 0.5], vacio: [-3.6, 6, 1.4] };
  {
    const g = makePart(root, 'chasis', L1([0, 0, 0]));
    g.add(mesh(rbox(X1 - X0 - 2.4, 1.0, ZF - ZB - 2.4, 0.3), gris, [0, 1.0, 0]));
    for (const x of [X0 + 5, X1 - 5]) for (const z of [ZB + 5, ZF - 5]) g.add(mesh(cylY(1.8, 0.5, 24), M.goma, [x, 0.25, z]));
    for (const x of [-34, 34]) for (const z of [-28, 28]) g.add(mesh(box(2, PH1 - 1.5, 2), M.aluminio, [x, 1.5 + (PH1 - 1.5) / 2, z]));
    const dx0 = -32.9, dx1 = -1.5, dz0 = -27, dz1 = 28.9, cx = (dx0 + dx1) / 2, cz = (dz0 + dz1) / 2;
    g.add(placaPasos(dx1 - dx0, dz1 - dz0, 1.0, Object.values(PASOS).map(([x, z, r]) => [x - cx, z - cz, r]), M.aluminio, [cx, DY, cz], 'xz', 0.3));
    for (const [x, z, r] of Object.values(PASOS)) for (const y of [DY + 0.5, DY - 0.5]) g.add(pasamuros(r, M.goma, [x, y, z], 'y', 0.3));
    // escuadras del entrepaño
    for (const z of [-26, 27.9]) g.add(mesh(box(1.6, 1.4, 1.0), M.aluminio, [dx1 - 0.8, DY - 1.2, z]));
  }

  /* ---------------- CARCASA ---------------- */
  {
    const g = makePart(root, 'panel_frontal', L1([0, 0, 30], { shell: true, label: 'equipo' }));
    const z = ZF - 0.5;
    // panel derecho (frontal principal)
    g.add(mesh(rbox(48.1, PH1 - PH0, 1.0, 0.4), blanco, [11.45, (PH0 + PH1) / 2, z]));
    g.add(mesh(rbox(48.1 - 0.6, 8.2, 0.5, 0.2), grisMedio, [11.45, 5.0, ZF + 0.25]));
    // panel inferior izquierdo, con los pasos del tubo de muestra y del drenaje
    const lx = (X0 + 1 + -12.6) / 2, lw = -12.6 - (X0 + 1), ly = (PH0 + 24.8) / 2, lh = 24.8 - PH0;
    g.add(placaPasos(lw, lh, 1.0, [[-22 - lx, 23.6 - ly, 0.45], [-16 - lx, 19.5 - ly, 0.45]], blanco, [lx, ly, z], 'xy', 0.4));
    for (const [x, y] of [[-22, 23.6], [-16, 19.5]]) g.add(pasamuros(0.45, M.goma, [x, y, ZF + 0.02], 'z', 0.25));
    // travesaño sobre la puerta
    g.add(mesh(rbox(lw, 2.0, 1.0, 0.3), blanco, [lx, 57.6, z]));
    // rótulos y estado
    const logo = new THREE.MeshStandardMaterial({ map: textTexture(['Agilent'], { bg: '#eceef0', fg: '#0a6fb8', font: '700 66px Segoe UI' }), roughness: 0.45 });
    g.add(mesh(new THREE.PlaneGeometry(13, 3.6), logo, [27, 53.5, ZF + 0.03]));
    const mod = new THREE.MeshStandardMaterial({ map: textTexture(['7900 ICP-MS'], { bg: '#eceef0', fg: '#3a4048', font: '600 56px Segoe UI' }), roughness: 0.45 });
    g.add(mesh(new THREE.PlaneGeometry(13, 3.0), mod, [27, 49.6, ZF + 0.03]));
    const est = new THREE.MeshStandardMaterial({ map: textTexture(['PLASMA   VACÍO   LISTO'], { bg: '#4a5059', fg: '#e8ebef', font: '600 34px Segoe UI', w: 512, h: 64 }), roughness: 0.5 });
    g.add(mesh(rbox(17, 2.6, 0.3, 0.12), gris, [-2, 53.5, ZF + 0.15]));
    g.add(mesh(new THREE.PlaneGeometry(13.5, 1.7), est, [-1.0, 53.5, ZF + 0.32]));
    [M.ledVerde, M.ledVerde, M.ledVerde].forEach((mt, i) => g.add(mesh(cylZ(0.3, 0.2, 16), mt, [-5.9 + i * 4.8, 55.6, ZF + 0.1])));
    g.add(mesh(rejilla(40, 4.4), rejMat(), [11.45, 5.0, ZF + 0.53]));
  }
  {
    const g = makePart(root, 'puerta_muestras', L1([0, 0, 38], { shell: true, label: 'equipo' }));
    // puerta del compartimento de introducción de muestra: marco y vidrio ahumado
    const x0 = X0 + 1.2, x1 = -12.8, y0 = 25.0, y1 = 56.4, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, w = x1 - x0, h = y1 - y0;
    g.add(mesh(rbox(w, 1.6, 1.0, 0.3), gris, [cx, y0 + 0.8, ZF + 0.5]));
    g.add(mesh(rbox(w, 1.6, 1.0, 0.3), gris, [cx, y1 - 0.8, ZF + 0.5]));
    for (const x of [x0 + 0.8, x1 - 0.8]) g.add(mesh(rbox(1.6, h - 3.2, 1.0, 0.3), gris, [x, cy, ZF + 0.5]));
    const vid = M.vidrio.clone(); vid.color.setHex(0x8a98a6); vid.opacity = 0.42;
    g.add(mesh(box(w - 3.0, h - 3.0, 0.2), vid, [cx, cy, ZF + 0.45]));
    g.add(mesh(rbox(0.9, 7, 1.2, 0.35), M.aceroOscuro, [x1 - 0.8, cy, ZF + 1.6]));
    for (const y of [y0 + 4, y1 - 4]) g.add(mesh(cylY(0.35, 2.4, 16), M.aceroOscuro, [x0 - 0.1, y, ZF + 0.6]));
  }
  for (const [id, s] of [['panel_izq', -1], ['panel_der', 1]]) {
    const g = makePart(root, id, L1([s * 26, 0, 0], { info: 'carcasa', shell: true }));
    const x = s > 0 ? X1 - 0.5 : X0 + 0.5;
    g.add(mesh(rbox(1.0, PH1 - PH0, ZF - ZB, 0.4), blanco, [x, (PH0 + PH1) / 2, 0]));
    const gm = rejMat();
    g.add(mesh(new THREE.PlaneGeometry(36, 12), gm, [x + s * 0.53, 36, -6], [0, s * Math.PI / 2, 0]));
    g.add(mesh(rbox(0.4, 3.2, 12, 0.15), grisMedio, [x + s * 0.65, 16, -6]));
    screws(g, M.tornillo, M.tornilloNegro, 0.3, s > 0 ? 'x' : '-x', [[x + s * 0.52, PH1 - 3, ZB + 3], [x + s * 0.52, PH1 - 3, ZF - 3], [x + s * 0.52, 4, ZB + 3], [x + s * 0.52, 4, ZF - 3]]);
  }
  const RP = {                                   // pasos del panel trasero [x, y, r]
    ar: [-23, 14, 0.6], he: [6.5, 46, 0.5], agua1: [-3.6, 31, 0.7], agua2: [-3.6, 38, 0.7], vacio: [13, 9, 1.6],
  };
  {
    const g = makePart(root, 'panel_trasero', L1([0, 0, -30], { info: 'carcasa', shell: true }));
    const cy = (PH0 + PH1) / 2, z = ZB + 0.5;
    g.add(placaPasos(X1 - X0 - 2, PH1 - PH0, 1.0, Object.values(RP).map(([x, y, r]) => [x, y - cy, r]), blanco, [0, cy, z], 'xy', 0.4));
    for (const [k, [x, y, r]] of Object.entries(RP)) {
      g.add(pasamuros(r + 0.1, k === 'vacio' ? M.goma : M.aceroPulido, [x, y, ZB - 0.05], 'z', k === 'vacio' ? 0.4 : 0.3));
      g.add(pasamuros(r + 0.1, k === 'vacio' ? M.goma : M.aceroPulido, [x, y, ZB + 1.05], 'z', k === 'vacio' ? 0.4 : 0.3));
    }
    const plate = new THREE.MeshStandardMaterial({ map: plateTexture(['7900 ICP-MS', '200–240 V~ 50/60 Hz 30 A', 'Modelo didáctico', 'Explorador 3D']), metalness: 0.6, roughness: 0.4 });
    g.add(mesh(new THREE.PlaneGeometry(9, 4.5), plate, [22, 40, ZB - 0.03], [0, Math.PI, 0]));
    const et = (t, x, y) => { const m = new THREE.MeshStandardMaterial({ map: textTexture([t], { w: 256, h: 64, bg: '#eceef0', fg: '#2a3038', font: '600 34px Segoe UI' }) }); g.add(mesh(new THREE.PlaneGeometry(3.6, 0.9), m, [x, y, ZB - 0.03], [0, Math.PI, 0])); };
    et('Ar', -23, 11.8); et('He', 6.5, 43.8); et('AGUA', -3.6, 28.8); et('VACÍO', 13, 5.8);
    g.add(mesh(rbox(4.4, 3.2, 1.2, 0.3), M.plasticoNegro, [28, 12, ZB - 0.6]));             // toma de red
    g.add(mesh(rbox(1.8, 1.4, 0.6, 0.15), M.plasticoNegro, [20, 18, ZB - 0.3]));            // LAN
    g.add(mesh(new THREE.PlaneGeometry(24, 10), rejMat(), [24, 28, ZB - 0.03], [0, Math.PI, 0]));
  }
  {
    const g = makePart(root, 'tapa_superior', L1([0, 30, 0], { info: 'carcasa', shell: true }));
    g.add(placaPasos(X1 - X0, ZF - ZB, 1.2, [[-15, 6.5, 5.6]], blanco, [0, PT, 0], 'xz', 0.5));
    g.add(pasamuros(5.3, M.goma, [-15, PT + 0.62, 6.5], 'y', 0.6));
  }

  /* ---------------- CAJA DE LA ANTORCHA Y EXTRACCIÓN ---------------- */
  {
    const g = makePart(root, 'caja_antorcha', L1([0, 0, 0], { shell: true, label: 'equipo' }));
    const xl = -24, xr = -6.2, y0 = 25, y1 = 43, z0 = -2, z1 = 15, cx = (xl + xr) / 2, cy = (y0 + y1) / 2, cz = (z0 + z1) / 2;
    const ac = M.acero.clone(); ac.color.setHex(0xaeb3ba);
    // frontal (con mirilla) y trasera (pasos de los gases del plasma)
    g.add(placaPasos(xr - xl, y1 - y0, 0.4, [[-12 - cx, 34 - cy, 4.0]], ac, [cx, cy, z1 - 0.2], 'xy', 0.3));
    g.add(placaPasos(xr - xl, y1 - y0, 0.4, [[-18 - cx, 37.5 - cy, 0.5], [-19.2 - cx, 37.5 - cy, 0.5]], ac, [cx, cy, z0 + 0.2], 'xy', 0.3));
    // laterales: paso del conector (izquierda) y ventana de la interfaz (derecha)
    g.add(placaPasos(z1 - z0 - 0.8, y1 - y0, 0.4, [[6.2 - cz, 34 - cy, 1.0]], ac, [xl + 0.2, cy, cz], 'zy', 0.3));
    g.add(placaPasos(z1 - z0 - 0.8, y1 - y0, 0.4, [[6 - cz, 34 - cy, 3.0]], ac, [xr - 0.2, cy, cz], 'zy', 0.3));
    // suelo (pasos de la bobina) y techo (chimenea)
    g.add(placaPasos(xr - xl - 0.8, z1 - z0 - 0.8, 0.4, [[-11.1 - cx, 6 - cz, 0.5], [-9.5 - cx, 6 - cz, 0.5]], ac, [cx, y0 + 0.2, cz], 'xz', 0.3));
    g.add(placaPasos(xr - xl - 0.8, z1 - z0 - 0.8, 0.4, [[-15 - cx, 6.5 - cz, 4.5]], ac, [cx, y1 - 0.2, cz], 'xz', 0.3));
    // mirilla de vidrio de protección UV
    const uv = M.vidrio.clone(); uv.color.setHex(0x5a4a7a); uv.opacity = 0.5;
    g.add(mesh(cylZ(4.0, 0.2, 48), uv, [-12, 34, z1 - 0.2]));
    g.add(pasamuros(4.15, M.aceroOscuro, [-12, 34, z1 + 0.05], 'z', 0.3));
    g.add(pasamuros(1.0, M.goma, [xl - 0.02, 34, 6.2], 'x', 0.25));
    // soporte de la antorcha (posicionador motorizado)
    g.add(mesh(new THREE.CylinderGeometry(1.6, 1.6, 1.0, 48, 1, true).rotateZ(Math.PI / 2), M.aluminio, [ORIGEN.x + AX.T_0 - 0.2, ORIGEN.y, ORIGEN.z]));
    g.add(mesh(box(1.2, 6.8, 1.2), M.aluminio, [ORIGEN.x + AX.T_0 - 0.2, y0 + 0.6 + 3.4, ORIGEN.z]));
    g.add(mesh(rbox(3.4, 1.6, 3.4, 0.2), M.anodizado, [ORIGEN.x + AX.T_0 - 0.2, y0 + 1.2, ORIGEN.z]));
    // chimenea de extracción
    g.add(mesh(cylY(4.6, 27, 48), M.aluminio, [-15, y1 + 13.5, 6.5]));
    g.add(mesh(cylY(5.3, 0.8, 48), M.aceroPulido, [-15, y1 + 27.4, 6.5]));
    const w = new THREE.MeshStandardMaterial({ map: warningTexture('UV · ALTA TEMPERATURA'), roughness: 0.45 });
    g.add(mesh(new THREE.PlaneGeometry(8, 3), w, [-12, 40.2, z1 + 0.03]));
  }

  /* ---------------- VACÍO ---------------- */
  {
    const g = makePart(root, 'camara_vacio', L1([0, 0, 0], { shell: true, label: 'equipo' }));
    const xa = W(AX.CH_0).x, xb = W(AX.CH_1).x, yb = 27.5, yt = 39.3, z0 = 0, z1 = 12;
    // pared de la base del cono de separación (separa la región de interfaz de la cámara intermedia)
    g.add(placaPasos(z1 - z0, 40.5 - yb, 0.6, [[0, 34 - (40.5 + yb) / 2, 1.2]], M.aluminio, [xa - 0.3, (40.5 + yb) / 2, 6], 'zy', 0.3));
    // fondo con las bocas de la turbo y el paso del detector
    const fx = (xa + xb) / 2;
    g.add(placaPasos(xb - xa, z1 - z0, 0.5, [[14 - fx, 0, 2.45], [1.5 - fx, 0, 1.3], [W(AX.EM.x).x - fx, 0, 0.55]], M.aluminio, [fx, yb + 0.25, 6], 'xz', 0.2));
    g.add(mesh(rbox(0.5, yt - yb - 0.5, z1 - z0, 0.15), M.aluminio, [xb - 0.25, (yt + yb + 0.5) / 2, 6]));
    for (const z of [z0 + 0.25, z1 - 0.25]) g.add(mesh(rbox(xb - 0.5 - xa, yt - yb - 0.5, 0.5, 0.15), M.aluminio, [(xa + xb - 0.5) / 2, (yt + yb + 0.5) / 2, z]));
    // pasos de RF del cuadrupolo y manómetros
    g.add(mesh(cylZ(0.5, 1.2, 24), M.ceramica, [21, 34, -0.6]));
    g.add(mesh(cylZ(0.8, 0.3, 24), M.aceroPulido, [21, 34, -0.15]));
    for (const x of [4, 26]) { g.add(mesh(cylZ(0.9, 2.2, 32), M.aceroPulido, [x, 37, z1 + 1.1])); g.add(mesh(rbox(2.4, 2.4, 1.6, 0.3), M.plasticoNegro, [x, 37, z1 + 3.0])); }
    refs.quadFeed = new THREE.Vector3(21, 34, -1.15);
  }
  {
    const g = makePart(root, 'tapa_vacio', L1([0, 18, 0], { info: 'camara_vacio' }));
    const xa = W(AX.CH_0).x, xb = W(AX.CH_1).x;
    g.add(mesh(rbox(xb - xa, 1.2, 12, 0.3), M.aluminio, [(xa + xb) / 2, 39.9, 6]));
    g.add(mesh(cylY(0.45, 1.1, 20), M.aceroPulido, [6.5, 41.05, 6]));
    g.add(mesh(cylY(0.6, 0.4, 6), M.aceroPulido, [6.5, 40.75, 6]));
    const pts = []; for (let i = 0; i < 8; i++) pts.push([xa + 1.5 + i * (xb - xa - 3) / 7, 40.52, 1.2], [xa + 1.5 + i * (xb - xa - 3) / 7, 40.52, 10.8]);
    screws(g, M.tornillo, M.tornilloNegro, 0.28, 'y', pts);
  }
  {
    const g = makePart(root, 'bomba_turbo', L1([0, -6, 0], { label: 'equipo' }));
    // turbo de flujo dividido: boca principal (analizador) y boca lateral (cámara intermedia)
    g.add(mesh(cylY(5.0, 11.9, 56), M.aluminio, [14, 20.25, 6]));
    g.add(mesh(cylY(3.4, 0.4, 48), M.aceroPulido, [14, 26.4, 6]));
    g.add(mesh(cylY(2.3, 1.6, 40), M.aceroPulido, [14, 27.4, 6]));
    for (let i = 1; i < 12; i++) { if (i === 9) continue; const a = (i / 12) * Math.PI * 2; g.add(mesh(box(0.25, 8, 0.6), M.aluminio, [14 + Math.cos(a) * 5.05, 18.5, 6 + Math.sin(a) * 5.05], [0, -a, 0])); }
    g.add(mesh(cylX(1.15, 7.7, 32), M.aceroPulido, [5.35, 24.2, 6]));
    g.add(mesh(new THREE.SphereGeometry(1.15, 24, 16), M.aceroPulido, [1.5, 24.2, 6]));
    g.add(mesh(cylY(1.15, 4.9, 32), M.aceroPulido, [1.5, 25.65, 6]));
    g.add(mesh(cylZ(0.8, 1.6, 24), M.aceroPulido, [14, 16, 0.4]));
    g.add(mesh(rbox(1.2, 1.6, 1.6, 0.2), M.plasticoNegro, [19.4, 16, 6]));
    g.add(mesh(cylY(5.1, 0.6, 56), M.anodizado, [14, 14.3, 6]));
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
    const lab = new THREE.MeshStandardMaterial({ map: textTexture(['MS40+'], { w: 256, h: 64, bg: '#eceef0', fg: '#3a4048', font: '600 40px Segoe UI' }) });
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
    cableFlex(g, [[i.x, i.y + 0.1, i.z, 'interfaz'], [i.x, i.y - 1.6, i.z], [-3.6, DY, 6, 'chasis'], [-3.6, DY - 2, 6], [-1, 13, -6], [6, 9.4, -17], [9.4, 9, -21.4], [10.35, 9, -22]], 0.75, mat, { seg: 90, radial: 12 });
    cableFlex(g, [[14, 16, -0.3, 'bomba_turbo'], [14, 15.3, -3, 'bomba_turbo'], [13.6, 11.5, -11], [13, 9.2, -16], [13, 9, -18.45]], 0.75, mat, { seg: 60, radial: 12 });
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
      cableFlex(g, [[x, 21.05, -14, 'control_gases'], [x, DY, -14, 'chasis'], [x, 30, -9.5], [x, 37.5, -4.2], [x, 37.5, -2.4, 'caja_antorcha'], [x, 37.5, -1.4, 'caja_antorcha'],
        [x, 37.1, 2.6], [e.x, e.y + 0.6, e.z - 0.7, 'antorcha'], [e.x, e.y - 0.05, e.z, 'antorcha']], 0.17, ar, { seg: 90, radial: 8 });
    }
    // gas del nebulizador: bajo el entrepaño y sube junto a la cámara de pulverización
    const nb = W(AX.SC_X + 2.3, AX.SC_Y, AX.NEB_Z1 - 2);
    cableFlex(g, [[-27.5, 21.05, -14, 'control_gases'], [-27.5, 20.85, -11], [-27.5, 20.85, 8], [-27.5, DY, 12, 'chasis'], [-27.6, 25.6, 15], [-27.9, 29.0, 19.6, 'nebulizador'],
      [nb.x + 0.3, nb.y, nb.z, 'nebulizador'], [nb.x - 0.05, nb.y, nb.z, 'nebulizador']], 0.17, ar, { seg: 90, radial: 8 });
    // helio de la celda ORS4: toma trasera → paso de la tapa de la cámara
    cableFlex(g, [[6.5, 46, ZB - 0.9, 'panel_trasero'], [6.5, 46, ZB + 0.6, 'panel_trasero'], [6.5, 46, ZB + 2.4], [6.5, 45, -12], [6.5, 43.3, 1.6, 'tapa_vacio'], [6.5, 42.0, 5.0, 'tapa_vacio'], [6.5, 41.55, 6, 'tapa_vacio']], 0.12, he, { seg: 70, radial: 8 });
    cableFlex(g, [[6.5, 46, ZB - 0.9, 'panel_trasero'], [6.5, 40, ZB - 4, 'panel_trasero'], [7.5, 10, -42, 'panel_trasero'], [8.5, 0.4, -47, 'panel_trasero']], 0.12, he, { seg: 50, radial: 8 });
  }

  /* ---------------- REFRIGERACIÓN ---------------- */
  {
    const g = makePart(root, 'enfriador', L1([0, 0, -30], { label: 'equipo' }));
    g.add(mesh(rbox(30, 46, 36, 0.8), blanco, [-15, 23.4, -68]));
    g.add(mesh(new THREE.PlaneGeometry(24, 12), rejMat(), [-15, 12, -49.97]));
    g.add(mesh(rbox(9, 4, 0.4, 0.2), M.pantalla, [-21, 38, -49.9]));
    for (const y of [30, 36]) g.add(mesh(cylZ(0.6, 1.2, 20), M.aceroPulido, [-6, y, -49.6]));
    const lab = new THREE.MeshStandardMaterial({ map: textTexture(['G3292A'], { w: 256, h: 64, bg: '#eceef0', fg: '#3a4048', font: '600 40px Segoe UI' }) });
    g.add(mesh(new THREE.PlaneGeometry(5, 1.25), lab, [-10, 42, -49.97]));
  }
  {
    const g = makePart(root, 'linea_agua', L1([0, 0, 0], { info: 'enfriador' }));
    const mat = M.cableGris;
    for (const [k, [ya, yb]] of [[0, [31, 30]], [1, [38, 36]]]) {
      const s = W(2.4, k ? 4 : -3, -8.2);
      cableFlex(g, [[s.x, s.y, s.z + 0.05, 'interfaz'], [s.x, s.y, s.z - 3], [-3.6, ya, ZB + 2.4], [-3.6, ya, ZB + 0.6, 'panel_trasero'], [-3.6, ya, ZB - 0.9, 'panel_trasero'],
        [-3.8, ya - 1.5, -38, 'panel_trasero'], [-6, yb, -48.3, 'enfriador'], [-6, yb, -48.95, 'enfriador']], 0.32, mat, { seg: 90, radial: 10 });
    }
  }

  /* ---------------- RF Y ELECTRÓNICA ---------------- */
  {
    const g = makePart(root, 'generador_rf', L1([0, 0, 0], { label: 'equipo' }));
    g.add(mesh(rbox(17, 18, 22, 0.5), M.anodizado, [-16.5, 11.5, 11]));
    for (let i = 0; i < 10; i++) g.add(mesh(box(0.5, 15, 1.0), M.aluminio, [-7.75, 11.5, 1.5 + i * 2.1]));
    for (const x of [-11.1, -9.5]) g.add(mesh(cylY(0.6, 0.6, 20), M.ceramica, [x, 20.8, 6]));
    const lab = new THREE.MeshStandardMaterial({ map: textTexture(['RF 27 MHz'], { w: 256, h: 64, bg: '#646b74', fg: '#e8ebef', font: '600 36px Segoe UI' }) });
    g.add(mesh(new THREE.PlaneGeometry(5, 1.25), lab, [-16.5, 15, 22.03]));
    const w = new THREE.MeshStandardMaterial({ map: warningTexture('ALTA TENSIÓN · RF'), roughness: 0.45 });
    g.add(mesh(new THREE.PlaneGeometry(7, 2.6), w, [-16.5, 9, 22.03]));
    // conductores de la bobina de carga (tubo de cobre plateado)
    for (const x of [-11.1, -9.5]) cableFlex(g, [[x, 20.9, 6, 'generador_rf'], [x, DY, 6, 'chasis'], [x, 25.2, 6, 'caja_antorcha'], [x, 29.4, 6], [x, 30.75, 6, 'bobina']], 0.25, M.cobre, { seg: 40, radial: 10 });
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
    cableFlex(g, [[d.x, d.y + 0.05, d.z, 'detector'], [d.x, d.y - 0.8, d.z - 1.4], [d.x, 24.2, -1.0], [d.x, 26.45, -4.0], [d.x, 26.45, -4.65]], 0.2, M.cable, { seg: 50, radial: 8 });
    const q = refs.quadFeed;
    cableFlex(g, [[q.x, q.y, q.z, 'camara_vacio'], [q.x, q.y - 1.5, -2.2], [23.5, 29.2, -5.5], [26, 26.8, -8.6], [26, 26.45, -9.1]], 0.3, M.cable, { seg: 50, radial: 8 });
    cableFlex(g, [[21.95, 12, -6, 'electronica'], [20.8, 13, -2.5], [20.6, 15.2, 3.0], [20.05, 16, 6, 'bomba_turbo']], 0.2, M.cable, { seg: 40, radial: 8 });
    cableFlex(g, [[28, 12, ZB + 0.6, 'panel_trasero'], [28, 12, ZB + 1.6], [28, 12, -27.05]], 0.3, M.cable, { seg: 16, radial: 8 });
    cableFlex(g, [[28, 12, ZB - 1.15, 'panel_trasero'], [28, 10, ZB - 3.5, 'panel_trasero'], [29, 3, -40, 'panel_trasero'], [30, 0.4, -47, 'panel_trasero']], 0.35, M.cable, { seg: 40, radial: 8 });
  }

  /* ---------------- BOMBA PERISTÁLTICA ---------------- */
  const PZ = [35.3, 36.3, 37.3];          // canales: muestra, patrón interno, drenaje
  const PC = new THREE.Vector3(-26, 13.5, 0), PR = 3.35;
  {
    const g = makePart(root, 'bomba_peristaltica', L1([0, 0, 40], { label: 'equipo' }));
    g.add(mesh(rbox(14, 11, 4.6, 0.6), gris, [PC.x, PC.y, ZF + 2.3]));
    const rotor = new THREE.Group(); rotor.position.set(PC.x, PC.y, 36.3); g.add(rotor);
    rotor.add(mesh(cylZ(2.6, 3.4, 48), M.aceroPulido, [0, 0, 0]));
    for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; rotor.add(mesh(cylZ(0.35, 3.2, 20), M.aceroPulido, [Math.cos(a) * 2.75, Math.sin(a) * 2.75, 0])); }
    rotor.add(mesh(cylZ(1.0, 0.4, 32), M.aceroOscuro, [0, 0, 1.85]));
    refs.rotor = rotor;
    // abrazaderas de los cartuchos y palancas
    for (const z of PZ) {
      g.add(mesh(rbox(7.2, 0.9, 0.8, 0.2), M.plasticoNegro, [PC.x, PC.y + PR + 0.72, z]));
      g.add(mesh(rbox(0.9, 4.2, 0.8, 0.2), M.plasticoNegro, [PC.x - 8.4, PC.y + PR - 0.9, z]));
    }
    g.add(mesh(cylZ(0.25, 3.0, 12), M.aceroOscuro, [PC.x + 3.6, PC.y + PR + 0.72, 36.3]));
    // tubos de bomba (cada canal un color) sobre el rodillo y conectores inferiores
    const cols = [0xe07b22, 0x2b2e33, 0xd8c03a];
    PZ.forEach((z, k) => {
      const pts = [[-33.4, 11.8, z], [-33.0, 13.6, z], [-31.4, 15.0, z]];
      for (let i = 0; i <= 10; i++) { const a = Math.PI * (0.84 - 0.68 * (i / 10)); pts.push([PC.x + Math.cos(a) * PR, PC.y + Math.sin(a) * PR, z]); }
      pts.push([-20.6, 15.0, z], [-19.0, 13.6, z], [-18.6, 11.8, z]);
      cableFlex(g, pts, 0.2, tubo(cols[k]), { seg: 90, radial: 10 });
      for (const x of [-33.4, -18.6]) g.add(mesh(cylY(0.3, 0.8, 16), M.ptfe, [x, 11.4, z]));
    });
    const lab = new THREE.MeshStandardMaterial({ map: textTexture(['Bomba peristáltica · 10 rodillos'], { w: 512, h: 64, bg: '#4a5059', fg: '#e8ebef', font: '500 30px Segoe UI' }) });
    g.add(mesh(new THREE.PlaneGeometry(9, 1.1), lab, [PC.x, 9.2, ZF + 4.63]));
  }
  {
    const g = makePart(root, 'residuos', L1([0, 0, 40], { info: 'bomba_peristaltica' }));
    const pe = M.ptfe.clone(); pe.color.setHex(0xe9ecef); pe.transparent = true; pe.opacity = 0.85;
    g.add(mesh(cylY(5, 15, 40), pe, [-44, 7.5, 36]));
    g.add(mesh(cylY(1.6, 1.4, 24), M.plasticoNegro, [-44, 15.7, 36]));
    const lab = new THREE.MeshStandardMaterial({ map: textTexture(['RESIDUOS'], { w: 256, h: 64, bg: '#f2c230', fg: '#1d1f23', font: '700 40px Segoe UI' }) });
    g.add(mesh(new THREE.PlaneGeometry(4, 1.0), lab, [-44, 9, 41.03]));
  }

  /* ---------------- AUTOMUESTREADOR SPS 4 (contexto) ---------------- */
  const PROBE = new THREE.Vector3(-61, 0, 24.6);
  {
    const g = makePart(root, 'automuestreador', L1([-26, 0, 0], { label: 'equipo' }));
    g.add(mesh(rbox(30, 8, 30, 0.8), blanco, [-62, 4.4, 21]));
    g.add(mesh(rbox(26, 0.8, 22, 0.3), grisMedio, [-63.5, 8.8, 23]));
    const tubMat = M.vidrio.clone(); tubMat.opacity = 0.45;
    for (let i = 0; i < 6; i++) for (let j = 0; j < 6; j++) {
      const x = -73 + i * 2.4, z = 15 + j * 2.4;
      g.add(mesh(cylY(0.8, 5.5, 20), tubMat, [x, 9.2 + 2.75, z]));
      g.add(mesh(cylY(0.72, 2.6 + ((i + j) % 3) * 0.6, 20), M.liquido, [x, 9.4 + (2.6 + ((i + j) % 3) * 0.6) / 2, z]));
    }
    g.add(mesh(rbox(5, 3, 5, 0.3), M.anodizado, [-52, 10.7, 17]));
    g.add(mesh(rbox(4, 54, 5, 0.4), blanco, [-75, 35.4, 9]));
    g.add(mesh(rbox(16, 2.6, 2.6, 0.3), gris, [-65, 60, 9]));
    g.add(mesh(rbox(3, 2.4, 16.2, 0.3), gris, [PROBE.x, 60, 18.4]));
    g.add(mesh(rbox(2.4, 5.6, 2.4, 0.3), blanco, [PROBE.x, 55.9, PROBE.z]));
    g.add(mesh(cylY(0.12, 40, 12), M.aceroPulido, [PROBE.x, 33.0, PROBE.z]));
    const lab = new THREE.MeshStandardMaterial({ map: textTexture(['SPS 4'], { w: 256, h: 64, bg: '#eceef0', fg: '#0a6fb8', font: '700 44px Segoe UI' }) });
    g.add(mesh(new THREE.PlaneGeometry(4.4, 1.1), lab, [-55, 4.4, 36.03]));
  }

  /* ---------------- TUBOS DE MUESTRA, DRENAJE Y RESIDUOS ---------------- */
  {
    const g = makePart(root, 'tubos_muestra', L1([0, 0, 0], { info: 'bomba_peristaltica' }));
    const ptfe = tubo(0xf4f4f0);
    // captación: sonda del automuestreador → canal 1
    cableFlex(g, [[PROBE.x + 1.25, 56.4, PROBE.z, 'automuestreador'], [PROBE.x + 3.4, 57.4, 26.5, 'automuestreador'], [-50, 52, 33], [-40, 30, 35.6],
      [-35.6, 14, 35.6, 'bomba_peristaltica'], [-34.6, 10.0, 35.4, 'bomba_peristaltica'], [-33.4, 10.3, 35.3, 'bomba_peristaltica'], [-33.4, 11.05, 35.3, 'bomba_peristaltica']], 0.12, ptfe, { seg: 140, radial: 8 });
    // canal 1 → paso del frontal → nebulizador
    const n = W(AX.SC_X, AX.SC_Y, AX.NEB_Z1 + 0.8);
    cableFlex(g, [[-18.6, 11.05, 35.3, 'bomba_peristaltica'], [-18.6, 10.2, 35.4, 'bomba_peristaltica'], [-17.4, 12.6, 35.1, 'bomba_peristaltica'], [-17.4, 19.6, 33.4, 'panel_frontal'],
      [-20.0, 23.2, 31.8, 'panel_frontal'], [-22, 23.6, ZF + 0.8, 'panel_frontal'], [-22, 23.6, ZF - 1.2, 'panel_frontal'], [-25, 25.6, 27.6], [-29.4, 29.4, 25.6, 'nebulizador'],
      [n.x, n.y, n.z + 0.4, 'nebulizador'], [n.x, n.y, n.z - 0.05, 'nebulizador']], 0.1, ptfe, { seg: 140, radial: 8 });
    // drenaje: cámara → entrepaño → paso del frontal → canal 3
    const d = W(AX.SC_X, AX.SC_Y - AX.SC_R - 1.3, AX.SC_Z0 + 0.8);
    cableFlex(g, [[d.x, d.y + 0.05, d.z, 'camara_nebulizacion'], [d.x, d.y - 1.5, d.z, 'camara_nebulizacion'], [-31, DY, 4.8, 'chasis'], [-31, 20.2, 7], [-30.2, 19.9, 23.4], [-22, 19.6, 27.6],
      [-16.2, 19.5, ZF - 2.6, 'panel_frontal'], [-16, 19.5, ZF - 1.2, 'panel_frontal'], [-16, 19.5, ZF + 0.8, 'panel_frontal'], [-15.6, 17, 33.8, 'bomba_peristaltica'], [-16.2, 11.2, 37.8, 'bomba_peristaltica'],
      [-17.8, 9.7, 37.5, 'bomba_peristaltica'], [-18.6, 10.3, 37.3, 'bomba_peristaltica'], [-18.6, 11.05, 37.3, 'bomba_peristaltica']], 0.15, ptfe, { seg: 160, radial: 8 });
    // canal 3 → bidón de residuos
    cableFlex(g, [[-33.4, 11.05, 37.3, 'bomba_peristaltica'], [-33.6, 9.8, 37.6, 'bomba_peristaltica'], [-36.6, 11.2, 38.6, 'bomba_peristaltica'], [-41.4, 17.6, 37.6, 'residuos'],
      [-44, 17.8, 36.4, 'residuos'], [-44, 16.3, 36, 'residuos']], 0.15, ptfe, { seg: 80, radial: 8 });
  }

  refs.analyzer = buildAnalizador(root);
  refs.update = () => {};
  return refs;
}
