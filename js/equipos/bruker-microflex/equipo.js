// Equipo completo microflex LRF: torre de sobremesa (≈ 510 × 680 × 1090 mm), puerto de carga con esclusa, cámara de la fuente,
// láser de nitrógeno con fibra óptica, tubo de vuelo vertical, bomba turbomolecular, bomba de membrana, electrónica y PC.
// Coordenadas de mundo en cm. Frente hacia +Z. Mesa en y = 0.
import * as THREE from 'three';
import { M } from '../../materials.js';
import { mesh, rbox, rrShape, box, washerX, cylX, cylY, cylZ, tubePath, grilleTexture, textTexture, screws, warningTexture, plateTexture } from '../../geom.js';
import { makePart, cableFlex } from '../../parts.js';
import { buildAnalizador } from './analizador.js';
import { ORIGEN, AX } from './geometria.js';

const L1 = (offset, extra = {}) => ({ level: 1, offset, mode: 'equipo', ...extra });
const XW = 25.5, ZF = 34, ZB = -34, HT = 109;
const PH = HT - 2.1, PY = 2 + PH / 2;                  // paneles hasta la tapa superior (sin rendija)
const YC = 97, CW = 18;                                 // cámara de la fuente: centro y anchura

/** Pantalla del PC con una vista simplificada del programa de adquisición (espectro y lista de spots). */
function pcScreen() {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 640;
  const g = c.getContext('2d');
  g.fillStyle = '#eef1f4'; g.fillRect(0, 0, 1024, 640);
  g.fillStyle = '#2b3a4e'; g.fillRect(0, 0, 1024, 40);
  g.fillStyle = '#ffffff'; g.font = '600 20px Segoe UI, Arial'; g.fillText('Adquisición MALDI-TOF · modo reflectrón', 16, 27);
  g.fillStyle = '#ffffff'; g.fillRect(16, 56, 700, 400); g.strokeStyle = '#c6ccd3'; g.strokeRect(16, 56, 700, 400);
  g.strokeStyle = '#1d63c9'; g.lineWidth = 2; g.beginPath(); g.moveTo(30, 440);
  const peaks = [[0.08, 0.55], [0.2, 1], [0.3, 0.85], [0.33, 0.6], [0.46, 0.7], [0.52, 0.45], [0.66, 0.65], [0.8, 0.55], [0.96, 0.35]];
  for (let i = 0; i <= 680; i++) {
    const u = i / 680; let v = 0.02 * Math.random();
    for (const [p, a] of peaks) v += a * Math.exp(-((u - p) ** 2) / (2 * 0.0025 ** 2));
    g.lineTo(30 + i, 440 - v * 360);
  }
  g.stroke();
  g.fillStyle = '#ffffff'; g.fillRect(732, 56, 276, 400); g.strokeStyle = '#c6ccd3'; g.strokeRect(732, 56, 276, 400);
  for (let r = 0; r < 8; r++) for (let col = 0; col < 12; col++) {
    g.fillStyle = (r * 12 + col) % 7 < 3 ? '#3a9a6a' : '#d4d9df';
    g.beginPath(); g.arc(752 + col * 21, 90 + r * 24, 7, 0, Math.PI * 2); g.fill();
  }
  g.fillStyle = '#2b3a4e'; g.font = '16px Segoe UI, Arial';
  ['Láser: 45 %', 'Disparos: 500', 'IS1 20,00 kV  ·  IS2 18,15 kV', 'PIE: 150 ns', 'Estado: listo'].forEach((t, i) => g.fillText(t, 740, 310 + i * 26));
  g.fillStyle = '#dfe4ea'; g.fillRect(16, 472, 992, 150);
  g.fillStyle = '#4a5562'; g.font = '15px Consolas, monospace';
  ['m/z 1046.542  Angiotensina II', 'm/z 1296.685  Angiotensina I', 'm/z 1619.822  Bombesina', 'm/z 2093.086  ACTH 1-17'].forEach((t, i) => g.fillText(t, 30, 500 + i * 28));
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}

export function buildEquipo(root) {
  const refs = {};
  const grille = grilleTexture(24, 6);

  /* ---------------- ESTRUCTURA Y CARCASA ---------------- */
  {
    const g = makePart(root, 'chasis', L1([0, 0, 0]));
    g.add(mesh(rbox(XW * 2 - 0.3, 2.2, ZF - ZB - 0.3, 0.4), M.carcasaOsc, [0, 1.6, 0]));          // 0,15 cm por dentro de los paneles
    for (const x of [-XW + 4, XW - 4]) for (const z of [ZB + 4, ZF - 4]) g.add(mesh(cylY(1.8, 0.8, 24), M.goma, [x, 0.4, z]));
    // bastidor interior
    for (const x of [-XW + 2, XW - 2]) for (const z of [ZB + 2, ZF - 3]) g.add(mesh(box(1.6, HT - 6, 1.6), M.aluminio, [x, HT / 2, z]));
  }
  {
    const g = makePart(root, 'panel_frontal', L1([-58, 0, 46], { shell: true, label: 'equipo' }));
    g.add(mesh(rbox(XW * 2 - 0.4, PH, 1.2, 0.6), M.grisClaro, [0, PY, ZF - 0.6]));
    // banda de acento y panel de estado
    g.add(mesh(rbox(XW * 2 - 0.3, 1.4, 1.3, 0.3), M.azulBruker, [0, 80, ZF - 0.45]));
    g.add(mesh(rbox(36, 13, 0.8, 0.5), M.carcasaOsc, [0, 92, ZF + 0.3]));
    const LED = [[M.ledVerde, 'Mains'], [M.ledVerde, 'Ready'], [M.ledVerde, 'Access'], [M.ledAmbar, 'AutoXecute'], [M.carcasaOsc, 'System Error'], [M.carcasaOsc, 'Target Error']];
    LED.forEach(([mt, lb], i) => {
      const x = -14 + i * 4.2;
      g.add(mesh(cylZ(0.38, 0.3, 16), mt, [x, 95, ZF + 0.85]));
      const t = new THREE.MeshStandardMaterial({ map: textTexture([lb], { w: 256, h: 64, bg: '#3b4048', fg: '#cfd4da', font: '500 30px Segoe UI' }) });
      g.add(mesh(new THREE.PlaneGeometry(4, 1), t, [x, 93, ZF + 0.72]));
    });
    // interruptor de llave y pulsador TARGET IN/OUT
    g.add(mesh(cylZ(1.1, 0.6, 32), M.aceroPulido, [-10, 88.5, ZF + 0.9]));
    g.add(mesh(box(0.25, 1.5, 0.3), M.aceroOscuro, [-10, 88.5, ZF + 1.35]));
    g.add(mesh(rbox(5, 2, 0.6, 0.3), M.azulBruker, [8, 88.5, ZF + 0.95]));
    const tb = new THREE.MeshStandardMaterial({ map: textTexture(['TARGET IN/OUT'], { w: 320, h: 80, bg: '#1d3f73', fg: '#ffffff', font: '600 34px Segoe UI' }) });
    g.add(mesh(new THREE.PlaneGeometry(4.6, 1.15), tb, [8, 88.5, ZF + 1.27]));
    const lab = new THREE.MeshStandardMaterial({ map: textTexture(['microflex'], { bg: '#d9dcdf', fg: '#1d3f73', font: '600 70px Segoe UI' }), roughness: 0.45 });
    g.add(mesh(new THREE.PlaneGeometry(14, 3.5), lab, [-12, 72, ZF + 0.02]));
    const lab2 = new THREE.MeshStandardMaterial({ map: textTexture(['MALDI-TOF'], { bg: '#d9dcdf', fg: '#5b6470', font: '500 54px Segoe UI' }), roughness: 0.45 });
    g.add(mesh(new THREE.PlaneGeometry(10, 2.5), lab2, [14, 72.4, ZF + 0.02]));
    const gm = M.grisClaro.clone(); gm.map = grille;
    g.add(mesh(new THREE.PlaneGeometry(34, 10), gm, [0, 12, ZF + 0.03]));
  }
  {
    const g = makePart(root, 'panel_izq', L1([-34, 0, 0], { info: 'carcasa', shell: true }));
    g.add(mesh(rbox(1.0, PH, ZF - ZB - 1, 0.4), M.grisClaro, [-XW + 0.5, PY, 0]));
    g.add(mesh(box(0.2, 1.4, ZF - ZB - 2), M.azulBruker, [-XW - 0.02, 80, 0]));
  }
  {
    const g = makePart(root, 'panel_der', L1([34, 0, 0], { info: 'carcasa', shell: true }));
    g.add(mesh(rbox(1.0, PH, ZF - ZB - 1, 0.4), M.grisClaro, [XW - 0.5, PY, 0]));
    g.add(mesh(box(0.2, 1.4, ZF - ZB - 2), M.azulBruker, [XW + 0.02, 80, 0]));
    const warn = new THREE.MeshStandardMaterial({ map: warningTexture('ALTA TENSIÓN · LÁSER'), roughness: 0.45 });
    g.add(mesh(new THREE.PlaneGeometry(9, 3.4), warn, [XW + 0.03, 96, 10], [0, Math.PI / 2, 0]));
  }
  {
    const g = makePart(root, 'panel_trasero', L1([0, 0, -40], { shell: true, label: 'equipo' }));
    g.add(mesh(rbox(XW * 2 - 0.4, PH, 1.0, 0.4), M.grisClaro, [0, PY, ZB + 0.5]));
    g.add(mesh(rbox(3.6, 2.2, 1.0, 0.3), M.etiquetaAmarilla, [-14, 10, ZB - 0.5]));            // interruptor general
    g.add(mesh(rbox(2.4, 1.6, 0.8, 0.2), M.plasticoNegro, [-8, 10, ZB - 0.4]));                  // entrada IEC
    // cable de alimentación hasta el suelo
    g.add(mesh(tubePath([[-8, 10, (ZB - 0.9)], [-8, 10, (ZB - 0.9) - 4], [-8 - 2, 4, (ZB - 0.9) - 9], [-8 - 5, 0.7, (ZB - 0.9) - 16], [-8 - 14, 0.7, (ZB - 0.9) - 30]], 0.45, 40, 10), M.cable));
    g.add(mesh(cylZ(0.6, 3, 24), M.ptfe, [8, 8, ZB - 1.5]));                                     // escape de la bomba
    for (const x of [-4, 0]) g.add(mesh(rbox(2.6, 1.4, 0.6, 0.2), M.plasticoNegro, [x, 20, ZB - 0.3]));
    const plate = new THREE.MeshStandardMaterial({ map: plateTexture(['MALDI-TOF MS', '100–230 V~ 50/60 Hz', 'Modelo didáctico', 'Explorador 3D']), metalness: 0.6, roughness: 0.4 });
    g.add(mesh(new THREE.PlaneGeometry(8, 4), plate, [12, 30, ZB - 0.02], [0, Math.PI, 0]));
  }
  {
    const g = makePart(root, 'filtro_aire', L1([0, 0, -22], { label: 'equipo' }));
    g.add(mesh(rbox(24, 14, 1.4, 0.3), M.carcasaOsc, [0, 52, ZB - 1.2]));
    const gm = M.carcasaOsc.clone(); gm.map = grille; gm.color.setHex(0x9aa0a8);
    g.add(mesh(new THREE.PlaneGeometry(22, 12), gm, [0, 52, ZB - 1.95], [0, Math.PI, 0]));
  }
  {
    const g = makePart(root, 'tapa_superior', L1([0, 30, 0], { info: 'carcasa', shell: true }));
    // tapa con la abertura del puerto de carga (la cubre la tapa de carga; deja pasar la esclusa al despiezar)
    const s = rrShape(XW * 2 + 0.2, ZF - ZB + 0.2, 0.5), h = new THREE.Path(), z0 = ORIGEN.z + 2;
    h.moveTo(-9, -(z0 - 7)); h.lineTo(-9, -(z0 + 7)); h.lineTo(9, -(z0 + 7)); h.lineTo(9, -(z0 - 7)); h.lineTo(-9, -(z0 - 7)); s.holes.push(h);
    const tg = new THREE.ExtrudeGeometry(s, { depth: 1.2, bevelEnabled: false, curveSegments: 6 }); tg.translate(0, 0, -0.6);
    g.add(mesh(tg, M.grisClaro, [0, HT + 0.5, 0], [-Math.PI / 2, 0, 0]));
    const gm = M.grisClaro.clone(); gm.map = grille; gm.color.setHex(0x8e959d);
    g.add(mesh(new THREE.PlaneGeometry(36, 12), gm, [0, HT + 1.13, -20], [-Math.PI / 2, 0, 0]));
  }
  {
    // apoyada sobre la tapa superior (sin interpenetrarla)
    const g = makePart(root, 'tapa_carga', L1([0, 44, 8], { label: 'equipo' }));
    g.add(mesh(rbox(20, 1.4, 16, 0.6), M.carcasaOsc, [0, HT + 1.8, ORIGEN.z + 2]));
    g.add(mesh(rbox(6, 0.6, 1.6, 0.3), M.aceroPulido, [0, HT + 2.7, ORIGEN.z + 9]));
    for (const x of [-8, 8]) g.add(mesh(cylX(0.5, 3, 16), M.aceroOscuro, [x, HT + 1.6, ORIGEN.z - 6]));
  }

  /* ---------------- ESCLUSA Y CÁMARA DE LA FUENTE ---------------- */
  {
    const g = makePart(root, 'esclusa', L1([0, 18, 0], { label: 'equipo' }));
    // apoyada sobre la tapa de la cámara (no la atraviesa); el puerto de bombeo sale por el lateral, por encima de la cámara
    g.add(mesh(rbox(16, 2.6, 12.7, 0.4), M.acero, [0, HT - 1.75, ORIGEN.z + 2]));
    const oring = mesh(new THREE.TorusGeometry(5.2, 0.18, 10, 64), M.goma, [0, HT - 0.4, ORIGEN.z + 2], [Math.PI / 2, 0, 0]);
    oring.scale.set(1.2, 1, 1); g.add(oring);
    g.add(mesh(rbox(9, 0.5, 6, 0.15), M.aceroPulido, [0, HT - 0.2, ORIGEN.z + 2]));        // plataforma de la diana
    g.add(mesh(cylX(0.6, 2.4, 24), M.acero, [CW / 2 + 0.2, HT - 1.75, ORIGEN.z - 2]));    // válvula de la esclusa
  }
  {
    const g = makePart(root, 'camara_fuente', L1([0, 0, 0], { shell: true, label: 'equipo' }));
    const yc = YC, h = 17, w = CW, d = 16;
    g.add(mesh(cylX(0.5, 0.8, 20), M.aceroPulido, [-w / 2 - 0.85, 93.4, ORIGEN.z]));       // conector SMA de la fibra óptica
    g.add(mesh(cylX(0.45, 0.9, 16), M.aceroPulido, [-w / 2 - 0.9, yc - 1, ORIGEN.z - 4.8])); // pasamuros del pulso de extracción
    for (const s of [-1, 1]) {
      g.add(mesh(rbox(w, h, 0.9, 0.2), M.acero, [0, yc, ORIGEN.z + s * d / 2]));
      g.add(mesh(rbox(0.9, h, d, 0.2), M.acero, [s * w / 2, yc, ORIGEN.z]));
    }
    g.add(mesh(rbox(w, 0.9, d, 0.2), M.acero, [0, yc + h / 2, ORIGEN.z]));
    // pasamuros de alta tensión y mirilla
    for (const z of [ORIGEN.z - 4, ORIGEN.z, ORIGEN.z + 4]) {
      g.add(mesh(cylX(0.9, 2.2, 24), M.ceramica, [w / 2 + 1.1, yc + 3, z]));
      g.add(mesh(cylX(0.5, 1.2, 16), M.aceroPulido, [w / 2 + 2.6, yc + 3, z]));
    }
    g.add(mesh(cylZ(1.6, 0.6, 32), M.aceroPulido, [-4, yc - 2, ORIGEN.z + d / 2 + 0.4]));
    g.add(mesh(cylZ(1.2, 0.65, 32), M.vidrio, [-4, yc - 2, ORIGEN.z + d / 2 + 0.5]));
    screws(g, M.tornillo, M.tornilloNegro, 0.3, 'z', [[-8, yc + 7.5, ORIGEN.z + d / 2 + 0.45], [8, yc + 7.5, ORIGEN.z + d / 2 + 0.45], [-8, yc - 7.5, ORIGEN.z + d / 2 + 0.45], [8, yc - 7.5, ORIGEN.z + d / 2 + 0.45]]);
  }

  /* ---------------- LÁSER ---------------- */
  {
    const g = makePart(root, 'laser', L1([28, 0, 0], { label: 'equipo' }));
    g.add(mesh(rbox(9, 18, 22, 0.5), M.anodizado, [15, 72, 4]));
    g.add(mesh(rbox(9.2, 2, 22.2, 0.3), M.azulBruker, [15, 79.9, 4]));                  // 0,1 cm bajo la tapa del láser (sin parpadeo)
    const lw = new THREE.MeshStandardMaterial({ map: warningTexture('RADIACIÓN LÁSER'), roughness: 0.45 });
    g.add(mesh(new THREE.PlaneGeometry(8, 3), lw, [15, 72, 15.03]));
    g.add(mesh(rbox(5, 5, 6, 0.4), M.aceroOscuro, [15, 85, 8]));                         // atenuador variable
    g.add(mesh(cylX(0.9, 2, 24), M.aceroPulido, [11.4, 85, 8]));
  }
  {
    // fibra: atenuador → por debajo de la cámara y por delante del tubo de vuelo → conector SMA del lateral izquierdo
    const g = makePart(root, 'fibra_optica', L1([0, 0, 0], { label: null }));
    cableFlex(g, [[10.35, 85, 8, 'laser'], [8, 85, 8.5, 'laser'], [4.5, 85.6, 10.6, 'camara_fuente'], [-4.5, 86.4, 10.6, 'camara_fuente'], [-10.5, 87.5, 9, 'camara_fuente'],
      [-12.6, 91, 6.8, 'camara_fuente'], [-12, 93.4, ORIGEN.z, 'camara_fuente'], [-CW / 2 - 1.3, 93.4, ORIGEN.z, 'camara_fuente']], 0.22, M.cable, { seg: 90, radial: 10 });
  }

  /* ---------------- SISTEMA DE VACÍO ---------------- */
  {
    const g = makePart(root, 'bomba_turbo', L1([0, 0, 22], { label: 'equipo' }));
    const y = ORIGEN.y - 30, z0 = ORIGEN.z + AX.TUBE_R + 3.3;
    g.add(mesh(cylZ(4.4, 1.0, 48), M.aceroPulido, [0, y, z0 + 0.5]));
    g.add(mesh(cylZ(4.0, 10, 48), M.aluminio, [0, y, z0 + 6]));
    for (const dz of [3, 8]) g.add(mesh(cylZ(4.08, 0.4, 48), M.aceroOscuro, [0, y, z0 + dz]));
    g.add(mesh(rbox(7, 5, 3, 0.4), M.anodizado, [0, y - 1, z0 + 12.4]));
    for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2;
      screws(g, M.tornillo, M.tornilloNegro, 0.25, 'z', [[Math.cos(a) * 3.7, y + Math.sin(a) * 3.7, z0 + 1.0]]); }
    g.add(mesh(cylX(0.7, 2.4, 24), M.aceroPulido, [4.8, y - 2, z0 + 9]));
  }
  {
    const g = makePart(root, 'bomba_membrana', L1([24, 0, 0], { label: 'equipo' }));
    g.add(mesh(rbox(14, 10, 16, 0.6), M.carcasaOsc, [12, 8, -14]));
    for (const z of [-19, -9]) { g.add(mesh(cylY(3.4, 2.2, 40), M.aluminio, [12, 14.1, z])); g.add(mesh(cylY(3.0, 0.6, 40), M.aceroOscuro, [12, 15.5, z])); }
    g.add(mesh(cylZ(3.6, 6, 40), M.anodizado, [12, 7, -2.6]));
    for (const x of [6, 18]) for (const z of [-21, -7]) g.add(mesh(cylY(0.8, 1.4, 16), M.goma, [x, 2.7, z]));
    g.add(mesh(cylY(0.7, 3, 20), M.aceroPulido, [12, 14.5, -14]));                      // tubuladura de aspiración
  }
  {
    // T sobre la aspiración de la bomba (se desplaza con ella) y las dos mangueras: escape de la turbo y bombeo de la esclusa
    const g = makePart(root, 'linea_vacio_previo', L1([24, 0, 0]));
    g.add(mesh(rbox(2.2, 2.2, 2.2, 0.4), M.aceroPulido, [12, 17.1, -14]));
    g.add(mesh(rbox(1.4, 2.0, 1.6, 0.3), M.plasticoNegro, [13.8, 17.1, -14]));          // válvula controlada (rama de la esclusa)
    const t = ORIGEN.y - 32, tz = ORIGEN.z + AX.TUBE_R + 12.3;
    cableFlex(g, [[6.05, t, tz, 'bomba_turbo'], [8.6, t - 0.4, tz, 'bomba_turbo'], [11.5, t - 6.5, tz - 3, 'bomba_turbo'], [12, 40, 2], [12, 24, -14], [12, 20.5, -14], [12, 18.25, -14]], 0.4, M.ptfe, { seg: 90, radial: 10 });
    cableFlex(g, [[CW / 2 + 1.45, HT - 1.75, ORIGEN.z - 2, 'esclusa'], [12.8, HT - 2, ORIGEN.z - 3.5, 'esclusa'], [16.5, 103, -3, 'camara_fuente'], [17.5, 90, -9.5, 'camara_fuente'],
      [17.5, 60, -10.5, 'camara_fuente'], [17.5, 26, -14], [17, 18.5, -14], [14.55, 17.1, -14]], 0.32, M.ptfe, { seg: 110, radial: 10 });
  }

  /* ---------------- ELECTRÓNICA ---------------- */
  {
    const g = makePart(root, 'fuentes_alta_tension', L1([-24, 0, 0], { label: 'equipo' }));
    g.add(mesh(rbox(10, 30, 26, 0.6), M.anodizado, [-17, 52, -8]));
    for (let i = 0; i < 4; i++) g.add(mesh(cylX(0.7, 1.4, 24), M.ceramica, [-11.4, 62, 1 - i * 3]));      // conectores de AT en fila (z)
    const w = new THREE.MeshStandardMaterial({ map: warningTexture('ALTA TENSIÓN 20 kV'), roughness: 0.45 });
    g.add(mesh(new THREE.PlaneGeometry(8, 3), w, [-11.9, 46, -8], [0, Math.PI / 2, 0]));
    // cables de AT: por detrás del tubo de vuelo, por debajo de la cámara y por fuera hasta los pasamuros del lateral derecho
    // (en paralelo, separados 3 cm en z y ordenados para no cruzarse)
    for (let i = 0; i < 3; i++) {
      const s = 1 - i * 3, zf = ORIGEN.z + 4 - i * 4, yf = YC + 3;
      cableFlex(g, [[-10.65, 62, s], [-8.8, 62.3, s], [-5, 72, s, 'camara_fuente'], [5, 84, s, 'camara_fuente'], [11.2, 88.4, s, 'camara_fuente'],
        [14.8, yf - 2.5, zf, 'camara_fuente'], [14.4, yf, zf, 'camara_fuente'], [CW / 2 + 3.25, yf, zf, 'camara_fuente']], 0.28, M.ptfe, { seg: 100, radial: 8 });
    }
  }
  {
    // detrás del conector de la fibra (z ≤ 0) para dejarle paso
    const g = makePart(root, 'generador_pulsos', L1([-22, 10, 0], { label: 'equipo' }));
    g.add(mesh(rbox(9, 9, 12, 0.5), M.aluminio, [-15, 94, -6]));
    for (let i = 0; i < 7; i++) g.add(mesh(box(8.6, 0.25, 11.4), M.aluminio, [-15, 90.4 + i * 1.2, -6]));
    cableFlex(g, [[-12.5, YC - 1, 0.05], [-12.4, YC - 1, ORIGEN.z - 4.8], [-11.2, YC - 1, ORIGEN.z - 4.8, 'camara_fuente'], [-CW / 2 - 1.4, YC - 1, ORIGEN.z - 4.8, 'camara_fuente']], 0.14, M.cable, { seg: 30, radial: 8 });
  }
  {
    const g = makePart(root, 'placa_control', L1([0, 0, -26], { label: 'equipo' }));
    g.add(mesh(rbox(34, 26, 0.25, 0.05), M.pcb, [0, 30, ZB + 3.5]));
    const rnd = (() => { let a = 5; return () => ((a = (a * 16807) % 2147483647) / 2147483647); })();
    for (let i = 0; i < 38; i++) {
      const x = -15 + rnd() * 30, y = 19 + rnd() * 22;
      if (rnd() < 0.65) g.add(mesh(box(0.8 + rnd(), 0.8 + rnd(), 0.25), M.chip, [x, y, ZB + 3.75]));
      else g.add(mesh(cylZ(0.35, 0.9, 16), M.condensador, [x, y, ZB + 4.1]));
    }
    screws(g, M.tornillo, M.tornilloNegro, 0.25, 'z', [[-16, 42, ZB + 3.65], [16, 42, ZB + 3.65], [-16, 18, ZB + 3.65], [16, 18, ZB + 3.65]]);
    g.add(mesh(rbox(18, 8, 14, 0.4), M.anodizado, [-8, 7, -14]));          // fuente de alimentación de baja tensión
  }

  /* ---------------- PC DE ADQUISICIÓN (contexto) ---------------- */
  {
    const g = makePart(root, 'pc', L1([-24, 0, 0], { label: 'equipo' }));
    const x = -64;
    g.add(mesh(rbox(20, 1.2, 14, 0.5), M.carcasaOsc, [x, 0.6, 4]));
    g.add(mesh(rbox(3.4, 26, 2.4, 0.6), M.carcasaOsc, [x, 13, 0]));
    g.add(mesh(rbox(54, 34, 2.2, 0.6), M.plasticoNegro, [x, 36, 1.5]));
    const sc = new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0xffffff, emissiveIntensity: 0.75, emissiveMap: pcScreen(), roughness: 0.25 });
    g.add(mesh(new THREE.PlaneGeometry(51, 31.8), sc, [x, 36.4, 2.72]));
    g.add(mesh(rbox(44, 1.2, 14, 0.4), M.carcasaOsc, [x, 0.6, 22]));
    g.add(mesh(rbox(6, 1.4, 9, 0.6), M.carcasaOsc, [x + 30, 0.7, 22]));
    g.add(mesh(rbox(18, 40, 40, 0.6), M.carcasaOsc, [x - 40, 20, -2]));         // torre del PC (digitalizador)
    g.add(mesh(cylZ(0.6, 0.2, 16), M.ledVerde, [x - 40, 34, 18.1]));
  }

  refs.analyzer = buildAnalizador(root);

  // fibra, mangueras y cables son cableFlex: siguen a sus piezas al despiezar
  refs.update = () => {};
  return refs;
}
