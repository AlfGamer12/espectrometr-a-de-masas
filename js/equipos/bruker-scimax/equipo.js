// Equipo completo scimaX: consola con la fuente dual y el banco de óptica iónica, imán superconductor de 7 T refrigerado por
// conducción (sin criógenos líquidos) con su criorrefrigerador y compresor de helio, bombas, electrónica y PC.
// Coordenadas de mundo en cm. Frente hacia +Z. Las dimensiones globales no están publicadas: son estimaciones.
import * as THREE from 'three';
import { M } from '../../materials.js';
import { mesh, rbox, box, washerX, cylX, cylY, cylZ, tubeX, tubePath, placaPasos, pasamuros, grilleTexture, textTexture, screws, screenTexture, plateTexture, warningTexture } from '../../geom.js';
import { makePart, parts, cableFlex } from '../../parts.js';
import { buildAnalizador } from './analizador.js';
import { ORIGEN, AX } from './geometria.js';

const L1 = (offset, extra = {}) => ({ level: 1, offset, mode: 'equipo', ...extra });
const CX0 = -156, CX1 = 14, ZF = 42, ZB = -42, H = 120;
const MX = ORIGEN.x + AX.MAG_C;           // centro del imán en el mundo
const wx = (x) => ORIGEN.x + x;
/** Turbos de la consola (x mundo) y turbo UHV al final del tubo, fuera del imán. */
const TURBOS = [AX.F1_0 + 4, AX.Q_0 + 6, AX.TR_0 + 20].map(wx);
const XUHV = MX + AX.MAG_L / 2 + 6;
const XPRE = wx(AX.UHV_END + 1.5 + 3.6);  // caja del preamplificador
/** Pasos del panel derecho [z, y, r]: tubo UHV, cable del preamplificador y manguera de la turbo UHV. */
const PASOS_DER = [[0, ORIGEN.y, 6.8], [26, 10, 0.8], [34, 8, 0.9]];
/** Paso de la fibra del láser MALDI en la bancada [x, z, r]. */
const PASO_FIBRA = [-138, 3, 0.6];
/** Abertura del panel izquierdo para la carcasa de la fuente (z ±, y desde abajo). */
const NOTCH = { z: 13.3, y0: ORIGEN.y - 13.3 };

/** Panel lateral (plano zy) con una escotadura superior rectangular, para que la carcasa de la fuente lo atraviese. */
function panelEscotado(w, d, t, mat, pos, nz, ny0) {
  const b = 0.2, yc = pos[1], A = w / 2 - b, Bh = d / 2 - b, n = nz + b, y0 = ny0 - yc - b;
  const s = new THREE.Shape();
  s.moveTo(-A, -Bh); s.lineTo(A, -Bh); s.lineTo(A, Bh); s.lineTo(n, Bh); s.lineTo(n, y0); s.lineTo(-n, y0); s.lineTo(-n, Bh); s.lineTo(-A, Bh); s.lineTo(-A, -Bh);
  const g = new THREE.ExtrudeGeometry(s, { depth: t - 2 * b, bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: 2, curveSegments: 4 });
  g.translate(0, 0, -(t - 2 * b) / 2);
  return mesh(g, mat, pos, [0, Math.PI / 2, 0]);
}

export function buildEquipo(root) {
  const refs = {};
  const grille = grilleTexture(26, 8);
  const navy = M.azulBruker.clone(); navy.color.setHex(0x1c2b44);

  /* ---------------- CONSOLA ---------------- */
  {
    const g = makePart(root, 'chasis', L1([0, 0, 0]));
    // zócalo algo más estrecho que la carcasa: sus caras no coinciden con las de los paneles
    g.add(mesh(rbox(CX1 - CX0 - 0.8, 5, ZF - ZB - 0.8, 0.5), M.carcasaOsc, [(CX0 + CX1) / 2, 2.5, 0]));
    for (const x of [CX0 + 6, CX1 - 6]) for (const z of [ZB + 6, ZF - 6]) g.add(mesh(cylY(2.2, 1.2, 24), M.goma, [x, 0.6, z]));
    for (const x of [CX0 + 3, CX1 - 3]) for (const z of [ZB + 3, ZF - 3]) g.add(mesh(box(3, H - 6, 3), M.aluminio, [x, H / 2, z]));
    // bancada óptica: aberturas para las turbos (cuelgan de la cámara) y paso de la fibra del láser
    const xc = (CX0 + CX1) / 2;
    const huecos = [...TURBOS.map((x) => [x - xc, 0, 5.2]), [PASO_FIBRA[0] - xc, PASO_FIBRA[1], PASO_FIBRA[2]]];
    g.add(placaPasos(CX1 - CX0 - 6, ZF - ZB - 6, 2, huecos, M.aluminio, [xc, 84, 0], 'xz', 0.3));
    g.add(pasamuros(PASO_FIBRA[2], M.goma, [PASO_FIBRA[0], 85, PASO_FIBRA[1]], 'y', 0.3));
  }
  {
    // soporte del imán: se retira junto con el imán (no lo atraviesa al explosionar)
    const g = makePart(root, 'soporte_iman', L1([0, 0, -95], { info: 'iman' }));
    for (const x of [MX - 38, MX + 38]) {
      g.add(mesh(rbox(10, ORIGEN.y - AX.MAG_R + 8, 70, 0.6), M.carcasaOsc, [x, (ORIGEN.y - AX.MAG_R + 8) / 2, 0]));
      g.add(mesh(rbox(14, 3, 80, 0.5), M.aceroOscuro, [x, 1.5, 0]));
    }
  }
  {
    const g = makePart(root, 'panel_frontal', L1([0, 0, 40], { shell: true, label: 'equipo' }));
    g.add(mesh(rbox(CX1 - CX0 - 0.4, H - 6, 1.2, 0.6), M.grisClaro, [(CX0 + CX1) / 2, H / 2 + 0.5, ZF - 0.6]));
    g.add(mesh(rbox(CX1 - CX0, 6, 1.4, 0.5), navy, [(CX0 + CX1) / 2, H - 6, ZF - 0.4]));        // franja algo adelantada: sin caras coplanares
    const lab = new THREE.MeshStandardMaterial({ map: textTexture(['scimaX  ·  MRMS'], { bg: '#1c2b44', fg: '#e8ecf1', font: '600 56px Segoe UI' }), roughness: 0.4 });
    g.add(mesh(new THREE.PlaneGeometry(20, 5), lab, [CX1 - 24, H - 6, ZF + 0.35]));
    const gm = M.grisClaro.clone(); gm.map = grille;
    g.add(mesh(new THREE.PlaneGeometry(120, 12), gm, [(CX0 + CX1) / 2, 14, ZF + 0.05]));
    [M.ledVerde, M.ledVerde, M.ledVerde].forEach((mt, i) => g.add(mesh(cylZ(0.4, 0.3, 16), mt, [CX0 + 20 + i * 3, H - 6, ZF + 0.4])));
  }
  {
    const g = makePart(root, 'tapa_superior', L1([0, 36, 0], { info: 'carcasa', shell: true }));
    g.add(mesh(rbox(CX1 - CX0 + 0.2, 1.4, ZF - ZB + 0.2, 0.6), navy, [(CX0 + CX1) / 2, H + 0.2, 0]));
  }
  {
    const g = makePart(root, 'panel_trasero', L1([0, 0, -36], { info: 'carcasa', shell: true }));
    g.add(mesh(rbox(CX1 - CX0 - 0.4, H - 6, 1.2, 0.5), M.grisClaro, [(CX0 + CX1) / 2, H / 2 + 0.5, ZB + 0.6]));
    const plate = new THREE.MeshStandardMaterial({ map: plateTexture(['FT-ICR MRMS · 7 T', '230 V~ 50/60 Hz', 'Modelo didáctico', 'Explorador 3D']), metalness: 0.6, roughness: 0.4 });
    g.add(mesh(new THREE.PlaneGeometry(9, 4.5), plate, [-40, 60, ZB - 0.03], [0, Math.PI, 0]));
    g.add(mesh(rbox(4, 3, 1.2, 0.3), M.plasticoNegro, [-110, 16, ZB - 0.6]));
    // cable de alimentación hasta el suelo
    g.add(mesh(tubePath([[-110, 16, (ZB - 1.2)], [-110, 16, (ZB - 1.2) - 4], [-110 - 2, 10, (ZB - 1.2) - 9], [-110 - 5, 0.7, (ZB - 1.2) - 16], [-110 - 14, 0.7, (ZB - 1.2) - 34]], 0.45, 40, 10), M.cable));
  }
  {
    // panel izquierdo con escotadura para la carcasa de la fuente
    const g = makePart(root, 'panel_izq', L1([-26, 0, 0], { info: 'carcasa', shell: true }));
    g.add(panelEscotado(ZF - ZB - 2.4, H - 6, 1.0, M.grisClaro.clone(), [CX0 + 0.5, H / 2 + 0.5, 0], NOTCH.z, NOTCH.y0));
  }
  {
    // panel derecho: paso del tubo UHV hacia el imán y pasamuros de cable y manguera. Se separa poco: el imán está al lado.
    const g = makePart(root, 'panel_der', L1([2.5, 0, 0], { info: 'carcasa', shell: true }));
    const yc = H / 2 + 0.5;
    g.add(placaPasos(ZF - ZB - 2.4, H - 6, 1.0, PASOS_DER.map(([z, y, r]) => [z, y - yc, r]), M.grisClaro.clone(), [CX1 - 0.5, yc, 0], 'zy', 0.4));
    for (const [z, y, r] of PASOS_DER) g.add(pasamuros(r, M.goma, [CX1, y, z], 'x', r > 2 ? 0.5 : 0.3));
    const gg = M.grisClaro.clone(); gg.map = grille;
    g.add(mesh(new THREE.PlaneGeometry(50, 16), gg, [CX1 + 0.03, 30, 0], [0, Math.PI / 2, 0]));
  }
  {
    const g = makePart(root, 'carcasa_fuente', L1([-24, 0, 0], { shell: true, label: 'equipo' }));
    g.add(mesh(rbox(16, 26, 26, 1.2), navy, [CX0 - 6, ORIGEN.y, 0]));
    g.add(mesh(rbox(0.6, 12, 12, 0.3), M.vidrio, [CX0 - 14.1, ORIGEN.y + 3, 0]));
    g.add(mesh(rbox(1.4, 4, 2, 0.5), M.aceroPulido, [CX0 - 14.5, ORIGEN.y - 7, 8]));
  }
  {
    const g = makePart(root, 'laser_maldi', L1([-20, -16, 0], { label: 'equipo' }));
    g.add(mesh(rbox(20, 12, 18, 0.6), M.anodizado, [CX0 + 14, 66, 10]));
    const lw = new THREE.MeshStandardMaterial({ map: warningTexture('RADIACIÓN LÁSER'), roughness: 0.45 });
    g.add(mesh(new THREE.PlaneGeometry(9, 3.4), lw, [CX0 + 14, 66, 19.05]));
    // fibra óptica: salida superior del láser → paso de la bancada → entrada del láser en la fuente
    const [fx, fz] = PASO_FIBRA;
    g.add(mesh(cylY(0.6, 1.2, 16), M.aceroPulido, [fx, 72.6, 6]));
    cableFlex(g, [[fx, 73.1, 6], [fx, 76, 5.2], [fx, 82.4, fz, 'chasis'], [fx, 85.6, fz, 'chasis'], [fx + 0.3, 89.5, fz, 'fuente_dual'], [wx(2.5), ORIGEN.y - 12.1, 3, 'fuente_dual']], 0.25, M.cable);
  }

  /* ---------------- IMÁN SUPERCONDUCTOR ---------------- */
  {
    const g = makePart(root, 'iman', L1([0, 0, -95], { shell: true, label: 'equipo' }));
    const L = AX.MAG_L, R = AX.MAG_R, Rb = AX.BORE_R;
    // cuerpo exterior: perfil torneado con extremos redondeados y bore pasante
    const prof = [[Rb, -L / 2], [R - 4, -L / 2], [R, -L / 2 + 4], [R, L / 2 - 4], [R - 4, L / 2], [Rb, L / 2], [Rb, -L / 2]];
    const geo = new THREE.LatheGeometry(prof.map(([r, x]) => new THREE.Vector2(r, x)), 96);
    geo.rotateZ(-Math.PI / 2);
    const white = M.carcasa.clone(); white.color.setHex(0xeceef0);
    g.add(mesh(geo, white, [MX, ORIGEN.y, 0]));
    for (const s of [-1, 1]) g.add(mesh(new THREE.TorusGeometry(R - 1.5, 1.2, 12, 96), navy, [MX + s * (L / 2 - 6), ORIGEN.y, 0], [0, Math.PI / 2, 0]));
    // banda central (anillo: deja libre el bore)
    g.add(mesh(tubeX(R + 0.2, Rb + 0.4, 10, 96), navy, [MX, ORIGEN.y, 0]));
    const lab = new THREE.MeshStandardMaterial({ map: textTexture(['7 T · cc'], { w: 256, h: 96, bg: '#1c2b44', fg: '#ffffff', font: '600 52px Segoe UI' }) });
    g.add(mesh(new THREE.PlaneGeometry(10, 3.75), lab, [MX, ORIGEN.y, R + 0.3]));
    const w = new THREE.MeshStandardMaterial({ map: warningTexture('CAMPO MAGNÉTICO INTENSO'), roughness: 0.45 });
    g.add(mesh(new THREE.PlaneGeometry(13, 4.8), w, [MX + 30, ORIGEN.y + 10, R - 2.2], [-0.2, 0, 0]));
  }
  {
    const g = makePart(root, 'criorrefrigerador', L1([0, 34, -95], { label: 'equipo' }));
    const x = MX + 18;
    g.add(mesh(cylY(7, 4, 48), M.aceroPulido, [x, ORIGEN.y + AX.MAG_R + 1, 0]));
    g.add(mesh(cylY(4.5, 16, 40), M.aluminio, [x, ORIGEN.y + AX.MAG_R + 11, 0]));
    g.add(mesh(rbox(11, 8, 11, 0.6), M.carcasaOsc, [x, ORIGEN.y + AX.MAG_R + 23, 0]));
    refs.cryoPorts = [new THREE.Vector3(x + 5.5, ORIGEN.y + AX.MAG_R + 24, 2), new THREE.Vector3(x + 5.5, ORIGEN.y + AX.MAG_R + 21, -2)];
  }
  {
    const g = makePart(root, 'compresor_helio', L1([30, 0, 0], { label: 'equipo' }));
    g.add(mesh(rbox(44, 60, 50, 1), M.grisClaro, [MX + 110, 30, -40]));
    const gm = M.grisClaro.clone(); gm.map = grille;
    g.add(mesh(new THREE.PlaneGeometry(36, 30), gm, [MX + 110, 34, -14.95]));
    const sc = new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0xffffff, emissiveIntensity: 0.8, emissiveMap: screenTexture([['He', '2,1 MPa'], ['Agua', '18 °C']], { title: 'Compresor' }) });
    g.add(mesh(new THREE.PlaneGeometry(10, 4), sc, [MX + 110, 54, -14.9]));
    refs.compPorts = [new THREE.Vector3(MX + 88, 50, -36), new THREE.Vector3(MX + 88, 46, -44)];
  }
  {
    const g = makePart(root, 'lineas_helio', L1([0, 0, 0], { info: 'compresor_helio' }));
    refs.he = [0, 1].map(() => { const m = mesh(new THREE.BufferGeometry(), M.aceroPulido.clone()); g.add(m); return m; });
  }

  /* ---------------- VACÍO ---------------- */
  const salidas = [];
  {
    const g = makePart(root, 'bombas_turbo', L1([0, -18, 0], { label: 'equipo' }));
    TURBOS.forEach((x, i) => {
      // cuelgan de la cámara (o del tubo UHV) y atraviesan la bancada por su abertura
      const y = ORIGEN.y - 8, top = i === 2 ? ORIGEN.y - AX.BORE_R + 1.6 : ORIGEN.y - 4.8;
      g.add(mesh(cylY(2.2, top - (y - 6), 32), M.aceroPulido, [x, (top + y - 6) / 2, 0]));
      g.add(mesh(cylY(4.2, 12, 40), M.aluminio, [x, y - 12, 0]));
      g.add(mesh(cylY(4.3, 0.4, 40), M.aceroOscuro, [x, y - 9, 0]));
      g.add(mesh(rbox(7, 3, 7, 0.4), M.anodizado, [x, y - 19.5, 0]));
      g.add(mesh(cylX(0.6, 1.4, 16), M.aceroPulido, [x + 4.9, y - 16, 0]));            // salida de vacío previo
      salidas.push([x + 5.6, y - 16, 0]);
    });
    // turbo UHV: cuelga del tubo UHV entre el imán y el preamplificador
    const x = XUHV, yt = ORIGEN.y - AX.BORE_R + 1.6;
    g.add(mesh(cylY(3, yt - 90, 32), M.aceroPulido, [x, (yt + 90) / 2, 0]));
    g.add(mesh(cylY(4.6, 16, 40), M.aluminio, [x, 82, 0]));
    g.add(mesh(cylY(4.7, 0.4, 40), M.aceroOscuro, [x, 85, 0]));
    g.add(mesh(rbox(8, 3, 8, 0.4), M.anodizado, [x, 72.5, 0]));
    g.add(mesh(cylX(0.6, 1.4, 16), M.aceroPulido, [x + 5.3, 78, 0]));
    salidas.push([x + 6, 78, 0]);
  }
  {
    const g = makePart(root, 'camara_vacio', L1([0, 0, 0], { shell: true, label: 'equipo' }));
    g.add(mesh(rbox(wx(AX.TR_0) - wx(AX.F1_0) + 4, 10, 10, 0.6), M.aluminio, [(wx(AX.F1_0) + wx(AX.TR_0)) / 2, ORIGEN.y, 0]));
    // tabiques de bombeo diferencial con orificio (más finos que el hueco entre electrodos: sin caras coplanares)
    for (const lx of [AX.F2_0 - 0.5, AX.Q_0 - 0.5, AX.C_1 + 0.5]) g.add(placaPasos(12, 12, 0.8, [[0, 0, 1.0]], M.aceroPulido, [wx(lx), ORIGEN.y, 0], 'zy', 0.3));
  }
  {
    const g = makePart(root, 'bomba_previa', L1([0, 0, 34], { label: 'equipo' }));
    g.add(mesh(rbox(26, 20, 24, 1), M.grisClaro, [-70, 11, 18]));
    g.add(mesh(cylY(1.2, 3, 20), M.aceroPulido, [-70, 22.5, 18]));
    // colector de aspiración con una toma por turbo
    g.add(mesh(cylX(1.0, 16, 24), M.aceroPulido, [-70, 25.8, 18]));
    for (const x of [-76, -72, -68, -64]) g.add(mesh(cylY(0.75, 2, 16), M.aceroPulido, [x, 27.6, 18]));
  }
  {
    const g = makePart(root, 'lineas_vacio', L1([0, 0, 0], { info: 'bomba_previa' }));
    const T = 'bombas_turbo', P = 'bomba_previa';
    const fin = (sx) => [[sx, 34, 18, P], [sx, 28.8, 18, P]];
    // turbos de la consola: bajan por delante de los armarios de electrónica
    [[-76, -82], [-72, -74], [-68, -62]].forEach(([sx, mx], i) => {
      const [x, y, z] = salidas[i];
      cableFlex(g, [[x, y, z, T], [x + 2.4, y - 3.5, z + 1.5, T], [mx, 42, 13], ...fin(sx)], 0.5, M.ptfe);
    });
    // turbo UHV: baja al suelo, recorre el frente del soporte del imán y entra por el panel derecho
    const [x, y, z] = salidas[3], [hz, hy] = PASOS_DER[2].slice(0, 2);
    cableFlex(g, [[x, y, z, T], [x + 1.5, y - 4, z + 2, T], [x + 1, 40, 30], [x - 4, 3, 46], [x - 16, 0.6, 47.5], [30, 0.6, 47.5], [20, 2, 44],
      [CX1 + 1.6, hy, hz, 'panel_der'], [CX1 - 1.6, hy, hz, 'panel_der'], [4, 9, hz - 1], [-40, 16, 32], [-58, 38, 22], ...fin(-64)], 0.5, M.ptfe, { seg: 160 });
  }

  /* ---------------- ELECTRÓNICA ---------------- */
  {
    const g = makePart(root, 'electronica', L1([0, 0, -30], { label: 'equipo' }));
    for (const x of [-120, -88, -56]) {
      g.add(mesh(rbox(28, 60, 30, 0.6), M.anodizado, [x, 34, -18]));
      for (let i = 0; i < 10; i++) g.add(mesh(box(24, 0.35, 0.6), M.aluminio, [x, 10 + i * 5, -2.7]));
    }
    const w = new THREE.MeshStandardMaterial({ map: warningTexture('ALTA TENSIÓN'), roughness: 0.45 });
    g.add(mesh(new THREE.PlaneGeometry(10, 3.8), w, [-88, 58, -2.9]));
    // cable de señal al preamplificador: sale por el panel derecho, va por el suelo delante del imán y sube al extremo del tubo UHV
    g.add(mesh(cylY(0.5, 1.0, 16), M.aceroPulido, [-50, 64.5, -12]));
    const [hz, hy] = PASOS_DER[1].slice(0, 2), C = 'chasis', yp = ORIGEN.y - 3 - 1.1;
    cableFlex(g, [[-50, 65.1, -12], [-48, 68, -12], [-36, 64, -10], [-12, 30, 12], [4, 12, hz - 3],
      [CX1 - 1.6, hy, hz, 'panel_der'], [CX1 + 1.6, hy, hz, 'panel_der'], [20, 4, 38, 'panel_der'], [28, 0.6, 44, C], [60, 0.6, 44, C], [140, 0.6, 44, C],
      [XPRE - 2, 4, 37, 'preamplificador'], [XPRE, 40, 10, 'preamplificador'], [XPRE, 90, 0.5, 'preamplificador'], [XPRE, yp - 2.4, 0, 'preamplificador'], [XPRE, yp, 0, 'preamplificador']], 0.5, M.cable, { seg: 200 });
  }
  {
    const g = makePart(root, 'pc', L1([0, 0, 30], { label: 'equipo' }));
    const x = -40, y = H + 1, z = 20;
    g.add(mesh(rbox(3, 18, 2.4, 0.6), M.carcasaOsc, [x, y + 9, z - 6]));
    g.add(mesh(rbox(44, 28, 2, 0.6), M.plasticoNegro, [x, y + 26, z - 5]));
    const c = document.createElement('canvas'); c.width = 1024; c.height = 640;
    const cg = c.getContext('2d'); cg.fillStyle = '#eef1f4'; cg.fillRect(0, 0, 1024, 640);
    cg.fillStyle = '#2b3a4e'; cg.fillRect(0, 0, 1024, 40); cg.fillStyle = '#fff'; cg.font = '600 20px Segoe UI'; cg.fillText('ftmsControl · transitorio y espectro', 16, 27);
    cg.strokeStyle = '#1d63c9'; cg.lineWidth = 1.2; cg.beginPath();
    for (let i = 0; i < 980; i++) { const t = i / 980; const v = Math.sin(i * 0.9) * Math.exp(-t * 2.2) * (0.6 + 0.4 * Math.cos(t * 30)); i ? cg.lineTo(20 + i, 200 - v * 120) : cg.moveTo(20, 200); }
    cg.stroke();
    cg.beginPath(); for (let i = 0; i < 980; i++) { const m = i / 980; let v = 0; for (const [p, a] of [[0.3, 0.1], [0.42, 1], [0.47, 0.06], [0.62, 0.35]]) v += a / (1 + ((m - p) / 0.004) ** 2); i ? cg.lineTo(20 + i, 600 - v * 220) : cg.moveTo(20, 600); }
    cg.stroke();
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    g.add(mesh(new THREE.PlaneGeometry(41, 25.6), new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0xffffff, emissiveIntensity: 0.75, emissiveMap: t }), [x, y + 26, z - 3.9]));
    g.add(mesh(rbox(36, 1, 12, 0.4), M.carcasaOsc, [x, y + 0.5, z + 6]));
  }

  refs.analyzer = buildAnalizador(root);

  // mangueras y cables de la consola son cableFlex; aquí solo se rehacen las líneas de helio
  refs.update = () => {
    const P = (id) => parts.get(id).object.position;
    const tube = (m, pts, r) => { m.geometry.dispose(); m.geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 60, r, 10, false); };
    const cp = P('criorrefrigerador'), kp = P('compresor_helio');
    refs.cryoPorts.forEach((c, i) => {
      const a = c.clone().add(cp), b = refs.compPorts[i].clone().add(kp);
      // por detrás del imán: sube, va hacia el fondo, recorre X por detrás y baja hasta el compresor
      const zr = -AX.MAG_R - 14 - i * 3.5;
      tube(refs.he[i], [a, a.clone().add(new THREE.Vector3(4, 5, 0)), new THREE.Vector3(a.x + 6, a.y + 4, zr * 0.6), new THREE.Vector3(a.x + 10, a.y - 6, zr),
        new THREE.Vector3(b.x - 14, b.y + 30, zr), new THREE.Vector3(b.x - 10, b.y + 4, b.z), b], 0.9);
    });
  };
  return refs;
}
