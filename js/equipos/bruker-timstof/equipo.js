// Equipo completo timsTOF Pro, según fotografías del equipo real: cuerpo de suelo en gris claro con la arista trasera
// superior muy redondeada, columna frontal azul Bruker con ventana iluminada (bomba de jeringa) y una banda gris horizontal
// que sostiene la fuente CaptiveSpray, torre del TOF azul con línea de luz blanca, nanoElute sobre su carro a la izquierda
// y bomba de vacío previo en el suelo, conectada por una manguera corrugada.
// Coordenadas de mundo en cm. Frente hacia +Z. Planta ≈ 82 × 140 cm; altura con la torre ≈ 257 cm (cuerpo 158 cm).
import * as THREE from 'three';
import { M, ribTexture } from '../../materials.js';
import { mesh, rbox, box, cylX, cylY, cylZ, tubeX, tubePath, placaPasos, pasamuros, grilleTexture, plateTexture, warningTexture } from '../../geom.js';
import { makePart, cableFlex } from '../../parts.js';
import { buildAnalizador } from './analizador.js';
import { ORIGEN, AX } from './geometria.js';

const L1 = (offset, extra = {}) => ({ level: 1, offset, mode: 'equipo', ...extra });
/** Cuerpo: x ∈ [XL, XR], z ∈ [ZB, ZF], altura H. Columna azul del frontal entre NX0 y NX1. */
const XL = -41, XR = 41, ZF = 70, ZB = -70, H = 158, NX0 = -29, NX1 = 27, RT = 25;
/** Banda gris del frontal (sostiene la fuente). */
const BY0 = 68, BY1 = 106, BZ0 = 70.1, BZ1 = 77;
/** Torre del TOF. */
const TX0 = -23, TX1 = 21, TZ0 = -44, TZ1 = 18, TH = 257;
/** Punto local del analizador → mundo (rotación de 90° en Y: x local → −z, z local → +x). */
const W = (x, y, z = 0) => new THREE.Vector3(ORIGEN.x + z, ORIGEN.y + y, ORIGEN.z - x);
const SX = ORIGEN.x, SY = ORIGEN.y + AX.SPRAY.y;      // eje de la fuente
const TRAY = ORIGEN.y - 26;                           // bandeja de las turbos (cara superior a TRAY + 1)
/** Pasos de la bandeja [x, z, r]: manguera de la toma de la fuente, salidas de las dos turbos y cable del detector. */
const PASOS = [[-15, 47.5, 1.0], [-9, 25.5, 1.0], [-9, -5.5, 1.0], [0, -39, 0.5]];
/** Colector de vacío previo (sobre el zócalo) y paso de la manguera corrugada en el panel derecho. */
const COL = { x: 24, y: 12, z: -58 };
/** Bomba de vacío previo externa (en el suelo, a la derecha). */
const BP = { x: 67, z: -54 };

/* ---------- utilidades de forma ---------- */
/** Extruye una forma. 'xy': espesor en z · 'zy': u = z, v = y, espesor en x · 'xz': u = x, v = −z, espesor en y. */
function placa(shape, t, mat, pos, plano = 'xy') {
  const g = new THREE.ExtrudeGeometry(shape, { depth: t, bevelEnabled: false, curveSegments: 16 });
  g.translate(0, 0, -t / 2);
  const rot = plano === 'zy' ? [0, -Math.PI / 2, 0] : plano === 'xz' ? [-Math.PI / 2, 0, 0] : [0, 0, 0];
  return mesh(g, mat, pos, rot);
}
/** Rectángulo (u0..u1, v0..v1) como forma o como agujero. */
function rect(u0, v0, u1, v1, P = THREE.Shape) {
  const s = new P(); s.moveTo(u0, v0); s.lineTo(u1, v0); s.lineTo(u1, v1); s.lineTo(u0, v1); s.lineTo(u0, v0); return s;
}
/** Banda con aristas redondeadas y agujeros circulares [[x, y, r]] (relativos al centro). */
function bandaRedondeada(w, h, t, r, b, huecos, mat, pos) {
  const s = new THREE.Shape(); const x = -w / 2 + b, y = -h / 2 + b, ww = w - 2 * b, hh = h - 2 * b;
  s.moveTo(x + r, y); s.lineTo(x + ww - r, y); s.quadraticCurveTo(x + ww, y, x + ww, y + r); s.lineTo(x + ww, y + hh - r);
  s.quadraticCurveTo(x + ww, y + hh, x + ww - r, y + hh); s.lineTo(x + r, y + hh); s.quadraticCurveTo(x, y + hh, x, y + hh - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  for (const [u, v, rr] of huecos) { const p = new THREE.Path(); p.absarc(u, v, rr + b, 0, Math.PI * 2, true); s.holes.push(p); }
  const g = new THREE.ExtrudeGeometry(s, { depth: t - 2 * b, bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: 4, curveSegments: 24 });
  g.translate(0, 0, -(t - 2 * b) / 2);
  return mesh(g, mat, pos);
}
/** Lateral (plano zy) con la arista trasera superior redondeada (radio RT) y agujeros [[z, y, r]]. */
function lateral(x, mat, huecos = []) {
  const z0 = ZB + 0.2, z1 = ZF - 0.2, y0 = 4, y1 = H;
  const s = new THREE.Shape();
  s.moveTo(z1, y0); s.lineTo(z1, y1); s.lineTo(z0 + RT, y1); s.absarc(z0 + RT, y1 - RT, RT, Math.PI / 2, Math.PI, false); s.lineTo(z0, y0); s.lineTo(z1, y0);
  for (const [u, v, r] of huecos) { const p = new THREE.Path(); p.absarc(u, v, r, 0, Math.PI * 2, true); s.holes.push(p); }
  return placa(s, 1.2, mat, [x, 0, 0], 'zy');
}
/** Textura de lienzo con fondo transparente. */
function lienzo(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
const rotulo = (tex, opts = {}) => new THREE.MeshStandardMaterial({ map: tex, transparent: true, alphaTest: 0.05, roughness: 0.5, ...opts });
/** Logotipo de Bruker recreado (órbitas + palabra), en azul. */
function logoBruker(color = '#22385a') {
  return lienzo(512, 256, (g) => {
    g.strokeStyle = color; g.lineWidth = 7;
    for (const a of [0, Math.PI / 3, -Math.PI / 3]) { g.save(); g.translate(256, 92); g.rotate(a); g.beginPath(); g.ellipse(0, 0, 88, 30, 0, 0, Math.PI * 2); g.stroke(); g.restore(); }
    g.fillStyle = color; g.beginPath(); g.arc(256, 92, 11, 0, Math.PI * 2); g.fill();
    g.font = '800 74px Arial, Segoe UI'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('BRUKER', 256, 206);
  });
}
/** Rótulo vertical "timsTOF Pro" (se lee de abajo arriba). */
function rotuloTims() {
  return lienzo(256, 1280, (g, w, h) => {
    g.translate(w / 2 + 52, h - 30); g.rotate(-Math.PI / 2); g.textBaseline = 'alphabetic';
    g.fillStyle = '#4f5f78'; g.font = '600 150px Segoe UI, Arial'; g.fillText('timsTOF', 0, 0);
    const wt = g.measureText('timsTOF ').width;
    g.fillStyle = '#2f7fd6'; g.font = 'italic 800 156px Segoe UI, Arial'; g.fillText('Pro', wt, 0);
  });
}

export function buildEquipo(root) {
  const refs = {};
  const navy = M.azulBruker.clone(); navy.color.setHex(0x253b5c); navy.roughness = 0.42; navy.clearcoat = 0.35;
  const gris = M.grisClaro.clone(); gris.color.setHex(0xd6d9dd); gris.metalness = 0.12; gris.roughness = 0.42; gris.clearcoat = 0.35;
  const grisCanal = gris.clone(); grisCanal.color.setHex(0xc8ccd1);
  const led = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xe6f3ff, emissiveIntensity: 1.6, roughness: 0.3 });
  const oscuro = M.carcasaOsc.clone(); oscuro.color.setHex(0x1b2230);
  const logo = rotulo(logoBruker());

  /* ---------------- CUERPO ---------------- */
  {
    const g = makePart(root, 'chasis', L1([0, 0, 0]));
    // zócalo oscuro retranqueado bajo los paneles
    g.add(mesh(rbox(78, 3.5, 136, 0.5), oscuro, [0, 2.75, 0]));
    for (const x of [XL + 6, XR - 6]) for (const z of [ZB + 8, ZF - 8]) g.add(mesh(cylY(2.2, 1.0, 24), M.goma, [x, 0.5, z]));
    for (const x of [-37, 37]) for (const z of [-66, 66]) g.add(mesh(box(3, 133.5, 3), M.aluminio, [x, 4.5 + 133.5 / 2, z]));
    // bandeja de las turbos con pasos para las mangueras de vacío previo y el cable del detector
    g.add(placaPasos(70, 126, 2, PASOS, M.aluminio, [0, TRAY, 0], 'xz', 0.3));
    for (const [x, z, r] of PASOS) g.add(pasamuros(r, M.goma, [x, TRAY + 1, z], 'y', r < 0.8 ? 0.3 : 0.5));
    // colector de vacío previo: tres tomas arriba y salida lateral hacia la manguera corrugada
    g.add(mesh(cylX(1.2, 12, 24), M.aceroPulido, [COL.x, COL.y, COL.z]));
    for (const x of [COL.x - 4, COL.x, COL.x + 4]) g.add(mesh(cylY(0.75, 2, 16), M.aceroPulido, [x, COL.y + 2.2, COL.z]));
    g.add(mesh(cylX(1.9, 3, 24), M.aceroPulido, [COL.x + 7.5, COL.y, COL.z]));
    g.add(mesh(rbox(6, 6.3, 6, 0.4), M.anodizado, [COL.x, 7.65, COL.z]));      // soporte sobre el zócalo
  }
  {
    // frontal: columna azul (paneles inferior y superior con ventana, remate curvo que continúa por la tapa)
    // y banda gris horizontal con la abertura de la fuente
    const g = makePart(root, 'panel_frontal', L1([0, 0, 60], { shell: true, label: 'equipo' }));
    const nc = (NX0 + NX1) / 2, nw = NX1 - NX0;
    g.add(mesh(rbox(nw, BY0 - 4, 1.2, 0.3), navy, [nc, (4 + BY0) / 2, ZF - 0.6]));
    const up = rect(-nw / 2, -20, nw / 2, 20);
    up.holes.push(rect(-16 - nc, 114 - 126, 20 - nc, 130 - 126, THREE.Path));
    g.add(placa(up, 1.2, navy, [nc, 126, ZF - 0.6]));
    {
      // remate superior: cuarto de cilindro que dobla hacia atrás y franja azul sobre la tapa hasta la torre
      const s = new THREE.Shape(), zc = 57.6, yc = 146;
      s.moveTo(ZF, yc); s.absarc(zc, yc, 12.4, 0, Math.PI / 2, false); s.lineTo(TZ1, yc + 12.4); s.lineTo(TZ1, yc + 11.2); s.lineTo(zc, yc + 11.2);
      s.absarc(zc, yc, 11.2, Math.PI / 2, 0, true); s.lineTo(ZF, yc);
      g.add(placa(s, nw, navy, [nc, 0, 0], 'zy'));
    }
    // ventana iluminada con la bomba de jeringa integrada
    {
      const x0 = -16, x1 = 20, y0 = 114, y1 = 130, xc = (x0 + x1) / 2, yc = (y0 + y1) / 2;
      const int = M.plasticoNegro.clone(); int.color.setHex(0x20252c);
      g.add(mesh(box(x1 - x0, y1 - y0, 0.6), int, [xc, yc, 61.3]));
      for (const y of [y0 + 0.3, y1 - 0.3]) g.add(mesh(box(x1 - x0 - 0.2, 0.6, 7.2), int, [xc, y, 65.2]));
      for (const x of [x0 + 0.3, x1 - 0.3]) g.add(mesh(box(0.6, y1 - y0 - 1.4, 7.2), int, [x, yc, 65.2]));
      g.add(mesh(box(30, 0.4, 0.5), led, [xc, y1 - 1.0, 67.6]));
      g.add(mesh(rbox(12, 7, 4.6, 0.5), M.ceramica, [x0 + 9, y0 + 4.6, 64]));                    // bomba de jeringa
      g.add(mesh(rbox(2.2, 3, 4.6, 0.3), M.anodizado, [x0 + 16, y0 + 4.6, 64]));
      g.add(mesh(cylX(0.9, 9, 24), M.vidrio, [x0 + 21.8, y0 + 6.2, 64]));                       // jeringa
      g.add(mesh(cylX(0.25, 4, 12), M.aceroPulido, [x0 + 28.3, y0 + 6.2, 64]));
      g.add(mesh(new THREE.PlaneGeometry(x1 - x0 - 0.4, y1 - y0 - 0.4), M.vidrio, [xc, yc, ZF - 0.5]));
    }
    // banda gris (sobresale 7 cm) con la abertura de la fuente, asa rasgada y línea de luz
    g.add(bandaRedondeada(XR - XL - 0.4, BY1 - BY0, BZ1 - BZ0, 3, 1.6, [[SX, SY - (BY0 + BY1) / 2, 8.8]], gris, [0, (BY0 + BY1) / 2, (BZ0 + BZ1) / 2]));
    g.add(mesh(rbox(38, 3.2, 1.6, 0.7), gris, [17, 80, BZ1 + 0.8]));
    g.add(mesh(rbox(36, 0.5, 0.5, 0.2), led, [17, 77.6, BZ1 + 0.25]));
    // pilotos de estado junto a la fuente
    [M.ledVerde, M.ledVerde, M.ledAmbar].forEach((mt, i) => g.add(mesh(cylZ(0.35, 0.3, 16), mt, [-2 + i * 2, 101, BZ1 + 0.15])));
  }
  for (const [id, s] of [['panel_izq', -1], ['panel_der', 1]]) {
    const g = makePart(root, id, L1([s * 70, 0, 0], { info: 'carcasa', shell: true }));
    const x = s > 0 ? XR - 0.6 : XL + 0.6;
    g.add(lateral(x, gris, s > 0 ? [[COL.z, COL.y, 2.4]] : []));
    // marco gris del frontal a cada lado de la columna azul
    const fx0 = s > 0 ? NX1 + 0.2 : XL + 1.3, fx1 = s > 0 ? XR - 1.3 : NX0 - 0.2;
    g.add(mesh(box(fx1 - fx0, H - 1.3 - 4, 1.2), gris, [(fx0 + fx1) / 2, (4 + H - 1.3) / 2, ZF - 0.6]));
    // canal vertical con el rótulo del modelo y logotipo
    const xs = x + s * 0.62, rot = [0, s * Math.PI / 2, 0];
    g.add(mesh(new THREE.PlaneGeometry(15, 76), grisCanal, [xs, 111, -12], rot));
    const lab = mesh(new THREE.PlaneGeometry(12.5, 62), rotulo(rotuloTims()), [xs + s * 0.08, 108, -12], rot);
    lab.userData.decal = true; g.add(lab);
    g.add(mesh(new THREE.PlaneGeometry(10, 5), logo, [xs + s * 0.08, 144, -12], rot));
    if (s > 0) g.add(mesh(tubeX(2.9, 2.0, 0.8, 32), M.goma, [x + 0.2, COL.y, COL.z]));      // pasamuros de la manguera corrugada
  }
  {
    // tapa gris: deja libres la franja azul del frontal y la torre del TOF (que la atraviesan al explosionar)
    const g = makePart(root, 'tapa_superior', L1([0, 40, 0], { info: 'carcasa', shell: true }));
    const a = XL + 1.2, b = XR - 1.2, zr = ZB + 0.2 + RT, zf = ZF - 0.2;
    const s = new THREE.Shape();
    [[a, zr], [b, zr], [b, zf], [NX1 + 0.2, zf], [NX1 + 0.2, TZ1 + 0.2], [TX1 + 0.2, TZ1 + 0.2], [TX1 + 0.2, TZ0 - 0.2], [TX0 - 0.2, TZ0 - 0.2],
      [TX0 - 0.2, TZ1 + 0.2], [NX0 - 0.2, TZ1 + 0.2], [NX0 - 0.2, zf], [a, zf]].forEach(([x, z], i) => (i ? s.lineTo(x, -z) : s.moveTo(x, -z)));
    s.lineTo(a, -zr);
    g.add(placa(s, 1.2, gris, [0, H - 0.6, 0], 'xz'));
    const vg = gris.clone(); vg.map = grilleTexture(18, 4);
    g.add(mesh(new THREE.PlaneGeometry(14, 30), vg, [32, H + 0.01, -10], [-Math.PI / 2, 0, 0]));
  }
  {
    // trasera: panel plano y arista superior curva (radio RT)
    const g = makePart(root, 'panel_trasero', L1([0, 0, -40], { info: 'carcasa', shell: true }));
    const a = XL + 1.2, b = XR - 1.2, zc = ZB + 0.2 + RT, yc = H - RT;
    const s = new THREE.Shape();
    s.moveTo(zc, H); s.absarc(zc, yc, RT, Math.PI / 2, Math.PI, false); s.lineTo(ZB + 1.4, yc); s.absarc(zc, yc, RT - 1.2, Math.PI, Math.PI / 2, true); s.lineTo(zc, H);
    g.add(placa(s, b - a, gris, [0, 0, 0], 'zy'));
    g.add(placaPasos(b - a, yc - 4, 1.2, [[-33, 100 - (yc + 4) / 2, 0.55]], gris, [0, (yc + 4) / 2, ZB + 0.8], 'xy', 0.4));
    const vg = gris.clone(); vg.map = grilleTexture(26, 6);
    g.add(mesh(new THREE.PlaneGeometry(56, 16), vg, [0, 24, ZB + 0.17], [0, Math.PI, 0]));
    const plate = new THREE.MeshStandardMaterial({ map: plateTexture(['timsTOF Pro', '200–240 V~ 50/60 Hz', 'Modelo didáctico', 'Explorador 3D']), metalness: 0.6, roughness: 0.4 });
    g.add(mesh(new THREE.PlaneGeometry(9, 4.5), plate, [22, 60, ZB + 0.17], [0, Math.PI, 0]));
    g.add(mesh(rbox(4, 3, 1.2, 0.3), M.plasticoNegro, [-28, 16, ZB - 0.4]));
    g.add(mesh(tubePath([[-28, 16, ZB - 1], [-28, 16, ZB - 5], [-30, 10, ZB - 10], [-33, 0.7, ZB - 17], [-42, 0.7, ZB - 35]], 0.45, 40, 10), M.cable));
    // pasamuros de la entrada de nitrógeno
    g.add(mesh(cylZ(0.5, 3.0, 16), M.aceroPulido, [-33, 100, ZB + 0.8]));
    g.add(mesh(cylZ(0.9, 0.5, 6), M.aceroPulido, [-33, 100, ZB - 0.15]));
  }
  {
    // torre del TOF: tubo azul de sección redondeada con tapa y líneas de luz blanca (frontal y lateral)
    const g = makePart(root, 'torre_tof', L1([0, 66, -8], { shell: true, label: 'equipo' }));
    const cx = (TX0 + TX1) / 2, cz = (TZ0 + TZ1) / 2, w = TX1 - TX0, d = TZ1 - TZ0, h = TH - 2.4 - H;
    const s = new THREE.Shape(), r = 4;
    const rr = (P, hw, hd, rad) => { P.moveTo(-hw + rad, -hd); P.lineTo(hw - rad, -hd); P.quadraticCurveTo(hw, -hd, hw, -hd + rad); P.lineTo(hw, hd - rad);
      P.quadraticCurveTo(hw, hd, hw - rad, hd); P.lineTo(-hw + rad, hd); P.quadraticCurveTo(-hw, hd, -hw, hd - rad); P.lineTo(-hw, -hd + rad); P.quadraticCurveTo(-hw, -hd, -hw + rad, -hd); };
    rr(s, w / 2, d / 2, r); const hole = new THREE.Path(); rr(hole, w / 2 - 1.2, d / 2 - 1.2, r - 1.2); s.holes.push(hole);
    g.add(placa(s, h, navy, [cx, H + h / 2, cz], 'xz'));
    g.add(mesh(rbox(w, 2.4, d, 1.1), navy, [cx, TH - 1.2, cz]));
    g.add(mesh(rbox(0.9, 78, 0.3, 0.12), led, [cx, 210, TZ1 + 0.15]));
    g.add(mesh(rbox(0.3, 78, 0.9, 0.12), led, [TX0 - 0.15, 210, TZ1 - 10]));
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
    const p0 = refs.ports[0];
    g.add(mesh(cylY(0.8, 3, 20), M.aceroPulido, [p0.x, p0.y - 1.5, p0.z]));            // reductor de la toma de vacío previo de la fuente
    // alojamiento circular de la fuente: atraviesa la banda gris (fondo con pasos del capilar y del gas)
    g.add(placaPasos(16.4, 16.4, 0.6, [[0, 0, 0.7], [-3.6, 2.4, 0.5]], M.aceroOscuro, [SX, SY, 65.7], 'xy', 0.5));
    g.add(pasamuros(0.5, M.goma, [SX - 3.6, SY + 2.4, 66.0], 'z', 0.3));
    g.add(mesh(tubeX(8.4, 7.9, 14, 64), M.plata, [SX, SY, 73], [0, Math.PI / 2, 0]));
    g.add(mesh(new THREE.TorusGeometry(8.15, 0.45, 12, 64), M.aceroPulido, [SX, SY, 80]));
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
    // bomba de vacío previo en el suelo, a la derecha del equipo (se aleja más que el panel lateral al explosionar)
    const g = makePart(root, 'bomba_rotatoria', L1([100, 0, -10], { label: 'equipo' }));
    const caja = M.carcasaOsc.clone(); caja.color.setHex(0x2c3038);
    g.add(mesh(rbox(30, 30, 36, 2), caja, [BP.x, 16, BP.z]));
    for (const x of [BP.x - 12, BP.x + 12]) for (const z of [BP.z - 15, BP.z + 15]) g.add(mesh(cylY(1.6, 1, 16), M.goma, [x, 0.5, z]));
    const vg = caja.clone(); vg.map = grilleTexture(14, 6); vg.color.setHex(0x8a919b);
    g.add(mesh(new THREE.PlaneGeometry(22, 14), vg, [BP.x + 15.02, 15, BP.z], [0, Math.PI / 2, 0]));
    g.add(mesh(rbox(10, 1.4, 3, 0.6), M.plasticoNegro, [BP.x, 31.7, BP.z + 12]));       // asa
    g.add(mesh(cylY(1.9, 4, 24), M.aceroPulido, [BP.x, 33, BP.z]));                     // toma de aspiración
  }
  {
    const g = makePart(root, 'lineas_vacio', L1([0, 0, 0], { info: 'bomba_rotatoria' }));
    const yt = TRAY + 1, C = 'chasis';
    // cada manguera: toma → paso de la bandeja (anclado al chasis) → colector sobre el zócalo
    const baja = (hx, hz, sx) => [[hx, yt + 1.3, hz, C], [hx, yt - 3.3, hz, C], [hx, 48, hz - 2, C], [hx + 2, 30, -50, C], [sx, 20, COL.z, C], [sx, COL.y + 3.3, COL.z, C]];
    const p0 = refs.ports[0];
    cableFlex(g, [[p0.x, p0.y - 3, p0.z, 'camara_vacio'], [p0.x, p0.y - 5.5, p0.z - 1, 'camara_vacio'], ...baja(PASOS[0][0], PASOS[0][1], COL.x - 4)], 0.5, M.ptfe, { seg: 120 });
    refs.ports.slice(1).forEach((p, i) => {
      const [hx, hz] = PASOS[i + 1];
      cableFlex(g, [[p.x + 4.3, p.y - 8, p.z, 'bombas_turbo'], [p.x + 5.6, p.y - 8.6, p.z, 'bombas_turbo'], [hx, yt + 2.6, hz, C], ...baja(hx, hz, COL.x + i * 4)], 0.5, M.ptfe, { seg: 120 });
    });
    // manguera corrugada: colector → pasamuros del panel derecho → aspiración de la bomba externa
    const corr = M.aceroPulido.clone(); corr.bumpMap = ribTexture(160); corr.bumpScale = 0.6;
    cableFlex(g, [[COL.x + 9, COL.y, COL.z, C], [COL.x + 12, COL.y, COL.z, C], [XR - 1.2, COL.y, COL.z, 'panel_der'], [XR + 1.6, COL.y, COL.z, 'panel_der'],
      [XR + 5, 26, COL.z + 1, 'bomba_rotatoria'], [BP.x - 11, 44, BP.z - 1, 'bomba_rotatoria'], [BP.x, 42, BP.z, 'bomba_rotatoria'], [BP.x, 35.1, BP.z, 'bomba_rotatoria']], 1.5, corr, { seg: 120, radial: 14 });
  }

  /* ---------------- ELECTRÓNICA Y GASES ---------------- */
  {
    const g = makePart(root, 'electronica', L1([30, 0, 0], { label: 'equipo' }));
    for (const [y, h] of [[17, 22], [43, 24]]) {
      g.add(mesh(rbox(30, h, 56, 0.5), M.anodizado, [23, y, -8]));
      for (let i = 0; i < 8; i++) g.add(mesh(box(0.6, 0.35, 52), M.aluminio, [7.7, y - h / 2 + 3 + i * (h - 6) / 7, -8]));
    }
    g.add(mesh(rbox(0.3, 18, 30, 0.06), M.pcb, [38.3, 43, -8]));
    const w = new THREE.MeshStandardMaterial({ map: warningTexture('ALTA TENSIÓN'), roughness: 0.45 });
    g.add(mesh(new THREE.PlaneGeometry(10, 3.8), w, [23, 43, 20.03]));
    // coaxial de señal del detector MCP: baja por su paso de la bandeja hasta el conector del módulo superior
    g.add(mesh(cylY(0.45, 1.0, 16), M.aceroPulido, [16, 55.5, -30]));
    const d = W(AX.DET.x, AX.DET.y - 2.9), yt = TRAY + 1;
    cableFlex(g, [[d.x, d.y, d.z, 'detector_mcp'], [d.x, d.y - 2.4, d.z - 0.3, 'detector_mcp'], [-8, 76, -40, 'chasis'], [0, yt + 1.3, -39, 'chasis'],
      [0, yt - 3.3, -39, 'chasis'], [8, 58.4, -35], [16, 57.8, -30], [16, 56.1, -30]], 0.15, M.cable);
  }
  {
    // digitalizador: tarjeta vertical en la bahía izquierda, bajo la bandeja
    const g = makePart(root, 'digitalizador', L1([-30, 0, 0], { label: 'equipo' }));
    g.add(mesh(rbox(0.3, 22, 32, 0.06), M.pcb, [-31, 32, -20]));
    for (let i = 0; i < 10; i++) g.add(mesh(box(0.3, 1.6, 2), M.chip, [-30.7, 32 + (i % 2) * 5 - 2.5, -32 + i * 2.6]));
    g.add(mesh(rbox(0.6, 6, 6, 0.2), M.aluminio, [-30.55, 39, -10]));
    g.add(mesh(rbox(4, 26, 36, 0.5), M.anodizado, [-35.4, 32, -20]));                // bastidor
  }
  {
    const g = makePart(root, 'linea_gas', L1([0, 12, 0], { label: 'equipo' }));
    g.add(mesh(rbox(10, 6, 8, 0.4), M.grisClaro, [-33, 101, 30]));
    // gas de la fuente: entra en el alojamiento por su paso del fondo y llega al racor superior del CaptiveSpray
    const zf = 66.0, zc = ORIGEN.z + 8.2;
    cableFlex(g, [[-33, 97.9, 30], [-32, 95.5, 40], [-24, 94.6, 58, 'camara_vacio'], [SX - 3.6, SY + 2.4, zf - 1.6, 'camara_vacio'], [SX - 3.6, SY + 2.4, zf + 0.6, 'camara_vacio'],
      [SX - 2.6, SY + 3.3, zc - 7, 'captivespray'], [SX - 0.8, SY + 3.6, zc - 2.4, 'captivespray'], [SX - 0.8, SY + 2.35, zc, 'captivespray']], 0.25, M.ptfe, { seg: 96 });
    // suministro de nitrógeno desde el pasamuros del panel trasero
    cableFlex(g, [[-33, 104.1, 30], [-33.5, 106.5, 18], [-33, 106.5, -30], [-33, 104, -60], [-33, 101.6, ZB + 4.6, 'panel_trasero'], [-33, 100, ZB + 2.4, 'panel_trasero']], 0.25, M.ptfe);
  }

  /* ---------------- NANOELUTE (contexto) ---------------- */
  {
    // nanoElute sobre su carro, a la izquierda del equipo, y horno de columna junto a la fuente.
    // Al explosionar se aleja a la izquierda y hacia delante, siempre por delante de la banda y fuera del panel izquierdo.
    const g = makePart(root, 'nanolc', L1([-95, 0, 70], { label: 'equipo' }));
    const cx = -92, cz = 46;
    // carro: ruedas, base, columna telescópica y bandeja
    for (const x of [cx - 18, cx + 18]) for (const z of [cz - 23, cz + 23]) {
      g.add(mesh(cylX(2.6, 1.8, 24), M.goma, [x, 2.6, z]));
      g.add(mesh(box(2.6, 2.4, 1.6), M.aceroOscuro, [x, 6.4, z]));
    }
    g.add(mesh(rbox(44, 2.6, 54, 0.8), gris, [cx, 8.9, cz]));
    g.add(mesh(rbox(14, 40, 14, 1), gris, [cx, 30.2, cz]));
    g.add(mesh(rbox(11, 19.3, 11, 0.8), M.plata, [cx, 59.85, cz]));
    g.add(mesh(rbox(50, 2.6, 62, 0.9), gris, [cx, 70.8, cz]));
    // cuerpo del nanoElute: gris claro con lateral azul rotulado
    const y0 = 72.1, h = 40, x0 = cx - 18.9, x1 = cx + 19;
    g.add(mesh(rbox(x1 - x0, h, 56, 1.2), gris, [(x0 + x1) / 2, y0 + h / 2, cz - 1]));
    g.add(mesh(rbox(1.4, h + 0.6, 57, 0.5), navy, [x0 - 0.9, y0 + h / 2 + 0.3, cz - 1]));
    const tn = lienzo(256, 1024, (c, w, hh) => { c.translate(w / 2 + 30, hh - 60); c.rotate(-Math.PI / 2); c.fillStyle = '#ffffff'; c.font = '600 120px Segoe UI, Arial'; c.fillText('nanoElute', 0, 0); });
    g.add(mesh(new THREE.PlaneGeometry(9, 34), rotulo(tn), [x0 - 1.62, y0 + 22, cz + 6], [0, -Math.PI / 2, 0]));
    const zf = cz - 1 + 28;
    g.add(mesh(rbox(30, 16, 0.4, 0.15), M.negroBrillante, [cx + 1, y0 + 29, zf + 0.2]));          // puerta del automuestreador
    g.add(mesh(rbox(34, 0.5, 0.3, 0.1), oscuro, [cx, y0 + 18, zf + 0.15]));                      // junta de los cajones de las bombas
    g.add(mesh(rbox(34, 0.5, 0.3, 0.1), oscuro, [cx, y0 + 8, zf + 0.15]));
    g.add(mesh(new THREE.PlaneGeometry(7, 3.5), logo, [cx - 12, y0 + 13, zf + 0.02]));
    g.add(mesh(cylZ(0.35, 0.3, 16), M.ledVerde, [cx + 14, y0 + 13, zf + 0.15]));
    // automuestreador: columna del brazo Z, brazo y aguja; bandeja de disolventes
    g.add(mesh(rbox(8, 34, 8, 1), gris, [cx + 13, y0 + h + 17, cz - 14]));
    g.add(mesh(rbox(24, 4, 4, 0.8), gris, [cx + 3, y0 + h + 30, cz - 14]));
    g.add(mesh(cylY(0.2, 7, 8), M.aceroPulido, [cx - 7, y0 + h + 24.5, cz - 14]));
    g.add(mesh(rbox(18, 1, 10, 0.3), M.anodizado, [cx - 9, y0 + h + 0.5, cz - 14]));
    for (const x of [cx - 13.5, cx - 4.5]) {
      g.add(mesh(cylY(3.2, 14, 28), M.disolvente, [x, y0 + h + 8, cz - 14]));
      g.add(mesh(cylY(1.8, 2, 20), M.acento, [x, y0 + h + 16, cz - 14]));
    }
    // salida de la línea de muestra en el lateral derecho
    g.add(mesh(cylX(0.5, 1.2, 16), M.aceroPulido, [x1 + 0.6, y0 + 28, zf - 6]));
    // horno de columna sobre la banda, a la izquierda de la fuente
    g.add(mesh(rbox(14, 8, 6, 1), gris, [-33, 96, BZ1 + 3.05]));
    g.add(mesh(rbox(10, 0.4, 0.3, 0.1), led, [-33, 93.4, BZ1 + 6.2]));
    refs.lc = { x1, yo: y0 + 28, zo: zf - 6, yb: y0 + h };
    // tubos de disolvente: tapones → entrada superior del cuerpo
    for (const x of [cx - 13.5, cx - 4.5]) cableFlex(g, [[x, y0 + h + 17, cz - 14], [x + 1, y0 + h + 20, cz - 8], [x + 3, y0 + h + 6, cz - 2], [x + 3, y0 + h + 0.1, cz - 1]], 0.15, M.ptfe);
  }
  {
    // línea PEEK: nanoElute → horno de columna → tuerca del CaptiveSpray (los puntos junto a la banda la siguen al explosionar)
    const g = makePart(root, 'tubo_muestra', L1([0, 0, 0], { info: 'nanolc' }));
    const { x1, yo, zo } = refs.lc, N = 'nanolc', F = 'panel_frontal';
    cableFlex(g, [[x1 + 1.2, yo, zo, N], [x1 + 5, yo - 0.5, zo + 6, N], [-45, 97, BZ1 + 4, N], [-40.05, 96, BZ1 + 3.05, N]], 0.12, M.peekRojo, { seg: 60 });
    const zn = ORIGEN.z - (AX.SPRAY.x - 7.7) + 0.3;
    cableFlex(g, [[-25.95, 96, BZ1 + 3.05, N], [-22, 95, BZ1 + 6.5, F], [-16.8, 92.2, zn + 2.3, F], [-15.3, 91.1, zn + 1.0], [SX, SY, zn + 0.05, 'captivespray']], 0.12, M.peekRojo, { seg: 80 });
  }

  refs.analyzer = buildAnalizador(root);

  // los cables y mangueras son cableFlex: siguen solos a sus piezas al explosionar
  refs.update = () => {};
  return refs;
}
