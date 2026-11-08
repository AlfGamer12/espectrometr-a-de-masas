// Equipo completo Agilent 6546 LC/Q-TOF, según las fotografías de producto de Agilent: cuerpo de sobremesa blanco de
// 122 × 76 × 51 cm con el frontal izquierdo en grafito (placa azul de Agilent, ventana del calibrante con dos botellas),
// fuente Dual Agilent Jet Stream redonda en el lateral izquierdo, junta horizontal con el LED de estado en la parte blanca
// y torre cilíndrica blanca del tubo de vuelo sobre un collar negro (193 cm de altura total). A la izquierda, la pila
// 1290 Infinity II (bomba, Multisampler, compartimento de columnas, detector y bandeja de disolventes).
import * as THREE from 'three';
import { M, ribTexture } from '../../materials.js';
import { mesh, rbox, rrShape, box, cylX, cylY, cylZ, washerX, tubePath, placaPasos, pasamuros, grilleTexture, textTexture, screws, plateTexture } from '../../geom.js';
import { makePart, cableFlex } from '../../parts.js';
import { buildAnalizador } from './analizador.js';
import { ORIGEN, AX } from './geometria.js';

const L1 = (offset, extra = {}) => ({ level: 1, offset, mode: 'equipo', ...extra });
const X0 = -61, X1 = 61, ZB = -38, ZF = 38, HB = 49.6, HC = 50.8, HT = 193;   // HB: borde de los paneles; HC: cara superior de la cubierta
const XD = -11;                                          // fin del frontal grafito (≈ 41 % de la anchura, como en las fotos)
const wx = (x) => ORIGEN.x + x;
const TCX = wx((AX.TOF_X0 + AX.TOF_X1) / 2), TCZ = ORIGEN.z;   // eje de la torre = centro del tubo de vuelo
const RT = 14;                                           // radio exterior de la torre (≈ 28 cm de diámetro)
const PH = HB - 2.4, PY = (HB + 2.4) / 2;                // paneles de 2,4 a 49,6 cm
const HX = [36, 42, 48], HY = 12;                        // pasos de las mangueras de vacío en el panel trasero
const PX = [74, 78, 82];                                 // entradas del colector de la bomba primaria
const SY = ORIGEN.y + 2, SZ = ORIGEN.z, SR = 13.3, Sr = 12.5;    // carcasa redonda de la fuente (eje = cámara de spray)
const SX1 = X0 - 0.8, SX0 = X0 - 15;                     // de la placa de montaje hacia fuera
const GZ = 28, GYg = 46;                                 // pasamuros de la línea de gas del nebulizador (lateral izquierdo)

/** Anillo extruido en vertical (radio exterior R, interior r, altura h), centrado. */
function anilloY(R, r, h, seg = 72) {
  const s = new THREE.Shape(); s.absarc(0, 0, R, 0, Math.PI * 2, false);
  const hl = new THREE.Path(); hl.absarc(0, 0, r, 0, Math.PI * 2, true); s.holes.push(hl);
  const g = new THREE.ExtrudeGeometry(s, { depth: h, bevelEnabled: false, curveSegments: seg }); g.translate(0, 0, -h / 2);
  return g;
}
/** Placa rectangular con una ventana rectangular (para el frontal grafito y su ventana del calibrante). */
function placaVentana(w, h, t, [hx0, hy0, hx1, hy1], r = 0.6) {
  const s = rrShape(w, h, r), hl = new THREE.Path();
  hl.moveTo(hx0, hy0); hl.lineTo(hx0, hy1); hl.lineTo(hx1, hy1); hl.lineTo(hx1, hy0); hl.lineTo(hx0, hy0); s.holes.push(hl);
  const g = new THREE.ExtrudeGeometry(s, { depth: t, bevelEnabled: false, curveSegments: 6 }); g.translate(0, 0, -t / 2);
  return g;
}
/**
 * Placa lateral (plano z-y, espesor en x) con una abertura en «ojo de cerradura»: círculo (zc, yc, R) abierto hacia el borde
 * superior entre z1 y z2, para que la placa se retire hacia la izquierda sin tocar los nebulizadores que sobresalen.
 * Coordenadas relativas al centro de la placa; huecos extra [z, y, r]. Malla orientada con rot [0, π/2, 0] (x local → −z).
 */
function placaOjo(w, h, t, [zc, yc, R], [z1, z2], extra, mat, pos) {
  const P = (z, y) => new THREE.Vector2(-z, y), pts = [];
  const H = h / 2, Wd = w / 2, a2 = Math.atan2(Math.sqrt(R * R - (z2 - zc) ** 2), z2 - zc), a1 = Math.atan2(Math.sqrt(R * R - (z1 - zc) ** 2), z1 - zc);
  pts.push(P(-Wd, -H), P(Wd, -H), P(Wd, H), P(z2, H));
  for (let i = 0; i <= 40; i++) { const a = a2 - (i / 40) * (a2 - (a1 - Math.PI * 2)); pts.push(P(zc + Math.cos(a) * R, yc + Math.sin(a) * R)); }
  pts.push(P(z1, H), P(-Wd, H));
  const s = new THREE.Shape(pts);
  for (const [z, y, r] of extra) { const hl = new THREE.Path(); hl.absarc(-z, y, r, 0, Math.PI * 2, true); s.holes.push(hl); }
  const g = new THREE.ExtrudeGeometry(s, { depth: t, bevelEnabled: false, curveSegments: 24 }); g.translate(0, 0, -t / 2);
  return mesh(g, mat, pos, [0, Math.PI / 2, 0]);
}
/** Placa de Agilent: rectángulo azul con el emblema (chispa de puntos) y el nombre en blanco, recreados. */
function agilentBadge() {
  const c = document.createElement('canvas'); c.width = 512; c.height = 160; const g = c.getContext('2d');
  g.fillStyle = '#0a7fcf'; g.fillRect(0, 0, 512, 160);
  g.fillStyle = '#ffffff';
  const cx = 92, cy = 80;
  for (let k = 0; k < 16; k++) { const a = (k / 16) * Math.PI * 2;
    for (let j = 1; j <= 3; j++) { const rr = 12 + j * 13, s = (k % 2 ? 3.4 : 5) - j * 0.6;
      g.beginPath(); g.arc(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, Math.max(1.6, s), 0, Math.PI * 2); g.fill(); } }
  g.beginPath(); g.arc(cx, cy, 7, 0, Math.PI * 2); g.fill();
  g.font = '600 66px Segoe UI, Arial'; g.textBaseline = 'middle'; g.fillText('Agilent', 168, 84);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
/** Botella con hombros redondeados (perfil de revolución). */
function botella(r, h, cuello = 0.42) {
  const p = [[0, 0], [r * 0.92, 0], [r, r * 0.12], [r, h * 0.72], [r * 0.82, h * 0.86], [r * cuello * 1.25, h * 0.96], [r * cuello, h], [r * cuello, h * 1.06], [0, h * 1.06]];
  return new THREE.LatheGeometry(p.map(([a, b]) => new THREE.Vector2(a, b)), 40);
}

export function buildEquipo(root) {
  const refs = {};
  const grille = grilleTexture(26, 8);
  const blanco = M.carcasa.clone(); blanco.color.setHex(0xf1f2f4); blanco.roughness = 0.42;
  const grafito = M.carcasaOsc.clone(); grafito.color.setHex(0x34373b); grafito.roughness = 0.55;
  const junta = new THREE.MeshStandardMaterial({ color: 0x1b1d20, roughness: 0.7 });
  const juntaClara = new THREE.MeshStandardMaterial({ color: 0xb9bdc2, roughness: 0.6 });
  const gl = M.vidrio.clone(); gl.opacity = 0.25;

  /* ---------------- ESTRUCTURA ---------------- */
  {
    const g = makePart(root, 'chasis', L1([0, 0, 0]));
    g.add(mesh(rbox(X1 - X0 - 2, 1.8, ZF - ZB - 2, 0.4), grafito, [0, 1.5, 0]));                  // zócalo oscuro, retranqueado 1 cm
    for (const x of [X0 + 6, X1 - 6]) for (const z of [ZB + 6, ZF - 6]) g.add(mesh(cylY(2, 0.6, 24), M.goma, [x, 0.3, z]));
    for (const x of [X0 + 3, X1 - 3]) for (const z of [ZB + 3, ZF - 3]) g.add(mesh(box(3, 47, 3), M.aluminio, [x, 26, z]));
  }
  {
    const g = makePart(root, 'panel_frontal', L1([0, 0, 44], { shell: true, label: 'equipo' }));
    // parte blanca (derecha) con la junta horizontal y el LED de estado en su extremo derecho
    g.add(mesh(rbox(X1 - XD - 0.2, PH, 1.2, 0.5), blanco, [(XD + X1) / 2 + 0.1, PY, ZF - 0.6]));
    g.add(mesh(new THREE.PlaneGeometry(X1 - XD - 0.8, 0.22), juntaClara, [(XD + X1) / 2, 35, ZF + 0.03]));
    g.add(mesh(box(2.6, 0.32, 0.3), M.ledVerde, [X1 - 3.2, 35, ZF + 0.12]));
    // frontal grafito, algo saliente, con la ventana del compartimento del calibrante abajo a la izquierda
    const fx = (X0 + XD) / 2, fy = PY, fw = XD - X0, wn = [-58.6 - fx, 5 - fy, -36 - fx, 24 - fy];
    g.add(mesh(placaVentana(fw, PH, 2.6, wn), grafito, [fx, fy, ZF + 0.2]));
    g.add(mesh(rbox(-36 + 58.6, 19, 0.3, 0.1), gl, [(-58.6 - 36) / 2, 14.5, ZF + 0.6]));
    const fz = ZF + 1.53;
    g.add(mesh(new THREE.PlaneGeometry(fw - 0.8, 0.22), junta, [fx, 25.2, fz]));                  // junta entre panel superior y puertas
    g.add(mesh(new THREE.PlaneGeometry(0.22, 22), junta, [-34.4, 13.9, fz]));                   // puerta inferior derecha
    const badge = new THREE.MeshStandardMaterial({ map: agilentBadge(), roughness: 0.35 });
    g.add(mesh(new THREE.PlaneGeometry(9.2, 2.9), badge, [X0 + 5.4, 34.5, fz]));
    const lab = new THREE.MeshStandardMaterial({ map: textTexture(['6546 LC/Q-TOF'], { w: 512, h: 64, bg: '#34373b', fg: '#e4e6e9', font: '600 40px Segoe UI' }), roughness: 0.5 });
    g.add(mesh(new THREE.PlaneGeometry(9.5, 1.2), lab, [X0 + 15.4, 34.5, fz]));
    // interruptor de encendido (abajo a la izquierda) y rótulo inferior derecho
    g.add(mesh(rbox(2.2, 1.6, 0.5, 0.2), M.grisClaro, [X0 + 2.8, 3.8, ZF + 1.75]));
    const lab2 = new THREE.MeshStandardMaterial({ map: textTexture(['Agilent'], { w: 256, h: 64, bg: '#f1f2f4', fg: '#9aa0a7', font: '600 38px Segoe UI' }), roughness: 0.5 });
    g.add(mesh(new THREE.PlaneGeometry(4.4, 1.1), lab2, [X1 - 5, 4.2, ZF + 0.03]));
  }
  {
    // cubierta superior: un hueco redondo para el tubo de vuelo bajo el collar de la torre
    const g = makePart(root, 'cubierta', L1([0, 36, 0], { info: 'carcasa', shell: true }));
    g.add(placaPasos(X1 - X0 - 0.4, ZF - ZB - 0.4, 1.2, [[TCX, TCZ, RT - 0.6]], blanco, [0, HB + 0.6, 0], 'xz', 0.6));
  }
  for (const [id, s, x] of [['panel_izq', -1, X0], ['panel_der', 1, X1]]) {
    const g = makePart(root, id, L1([s * 30, 0, 0], { info: 'carcasa', shell: true }));
    if (s < 0) {
      // lateral izquierdo: abertura de la interfaz (abierta hacia arriba para no tocar los nebulizadores al retirarse),
      // placa de montaje de la fuente y pasamuros del gas del nebulizador
      g.add(placaOjo(ZF - ZB - 2.4, PH, 1.0, [SZ, SY - PY, 7.6], [12.6, 19.8], [[GZ, GYg - PY, 0.5]], blanco, [x + 0.5, PY, 0]));
      g.add(pasamuros(0.5, M.goma, [x - 0.02, GYg, GZ], 'x', 0.3));
      g.add(placaOjo(24, 24, 0.8, [0, 0.5, 7.6], [12.6 - SZ, 19.8 - SZ], [], M.grisClaro, [x - 0.4, SY - 0.5, SZ]));
    } else g.add(mesh(rbox(1.0, PH, ZF - ZB - 2.4, 0.4), blanco, [x - 0.5, PY, 0]));
    const gm = blanco.clone(); gm.map = grille; gm.color.setHex(0xc2c6cb);
    g.add(mesh(new THREE.PlaneGeometry(30, 8), gm, [x + s * 0.03, 9, -20], [0, s * Math.PI / 2, 0]));
    g.add(mesh(new THREE.PlaneGeometry(ZF - ZB - 3, 0.22), juntaClara, [x + s * 0.03, 35, 0], [0, s * Math.PI / 2, 0]));
    screws(g, M.tornillo, M.tornilloNegro, 0.3, s > 0 ? 'x' : '-x', [[x + s * 0.02, HB - 4, ZB + 4], [x + s * 0.02, 6, ZB + 4]]);
  }
  {
    const g = makePart(root, 'panel_trasero', L1([0, 0, -40], { info: 'carcasa', shell: true }));
    g.add(placaPasos(X1 - X0 - 0.4, PH, 1.0, HX.map((x) => [x, HY - PY, 1.5]), blanco, [0, PY, ZB + 0.5], 'xy', 0.4));
    for (const x of HX) g.add(pasamuros(1.5, M.goma, [x, HY, ZB - 0.02], 'z'));
    const plate = new THREE.MeshStandardMaterial({ map: plateTexture(['6546 LC/Q-TOF', '200–240 V~ 50/60 Hz 2850 VA', 'Modelo didáctico', 'Explorador 3D']), metalness: 0.6, roughness: 0.4 });
    g.add(mesh(new THREE.PlaneGeometry(9, 4.5), plate, [24, 36, ZB - 0.03], [0, Math.PI, 0]));
    const gm = blanco.clone(); gm.map = grille; gm.color.setHex(0xc2c6cb);
    g.add(mesh(new THREE.PlaneGeometry(40, 10), gm, [-12, 40, ZB - 0.03], [0, Math.PI, 0]));
    for (const x of [-54, -48]) { g.add(mesh(rbox(4, 3, 1.2, 0.3), M.plasticoNegro, [x, 16, ZB - 0.6]));
      g.add(mesh(tubePath([[x, 16, ZB - 1.2], [x, 16, ZB - 5], [x - 2, 10, ZB - 10], [x - 5, 0.7, ZB - 16], [x - 12, 0.7, ZB - 34]], 0.45, 40, 10), M.cable)); }
    g.add(mesh(cylZ(0.7, 2.4, 24), M.aceroPulido, [-40, 40, ZB - 1.2]));                 // entrada de N₂ (pasamuros)
    g.add(mesh(cylZ(0.6, 1.0, 6), M.aceroPulido, [-40, 40, ZB + 1.5]));                  // tuerca interior
    g.add(mesh(rbox(2, 1.4, 0.8, 0.2), M.plasticoNegro, [-10, 24, ZB - 0.4]));           // LAN
  }
  {
    // torre cilíndrica blanca sobre un collar negro; sube en vertical y deja dentro el tubo de vuelo
    const g = makePart(root, 'torre_tof', L1([0, 40, 0], { shell: true, label: 'equipo' }));
    const up = [-Math.PI / 2, 0, 0], y0 = HC + 2.5, y1 = HT - 1;
    g.add(mesh(anilloY(RT + 0.8, RT - 0.7, 2.5), M.negroBrillante, [TCX, HC + 1.25, TCZ], up));
    g.add(mesh(anilloY(RT, RT - 0.8, y1 - y0), blanco, [TCX, (y0 + y1) / 2, TCZ], up));
    g.add(mesh(cylY(RT, 0.6, 72), blanco, [TCX, y1 + 0.3, TCZ]));
    g.add(mesh(new THREE.TorusGeometry(RT - 0.45, 0.45, 12, 72), blanco, [TCX, y1 + 0.6, TCZ], [Math.PI / 2, 0, 0]));
    g.add(mesh(cylY(RT - 0.45, 0.45, 72), blanco, [TCX, y1 + 0.825, TCZ]));
  }

  /* ---------------- FUENTE Y CALIBRANTE ---------------- */
  {
    // carcasa redonda de la Jet Stream en el lateral izquierdo: tambor abierto arriba (rendija del nebulizador) y tapa exterior
    // con el asa negra; se retira hacia la izquierda deslizando la rendija a lo largo del nebulizador
    const g = makePart(root, 'carcasa_fuente', L1([-33, 0, 0], { shell: true, label: 'equipo' }));
    // perfil en C trazado con segmentos rectos cada 5° (rendija de ±10° arriba): la herramienta de inspección lo reconoce como forma
    const arco = [];
    for (let d = 100; d <= 440; d += 5) arco.push((d * Math.PI) / 180);
    const s = new THREE.Shape(); arco.forEach((a, i) => (i ? s.lineTo(Math.cos(a) * SR, Math.sin(a) * SR) : s.moveTo(Math.cos(a) * SR, Math.sin(a) * SR)));
    for (const a of [...arco].reverse()) s.lineTo(Math.cos(a) * Sr, Math.sin(a) * Sr);
    const L = SX1 - (SX0 + 1);
    const dg = new THREE.ExtrudeGeometry(s, { depth: L, bevelEnabled: false, curveSegments: 48 }); dg.translate(0, 0, -L / 2);
    const tapa = M.grisClaro.clone(); tapa.color.setHex(0xe9ebee);
    g.add(mesh(dg, tapa, [(SX1 + SX0 + 1) / 2, SY, SZ], [0, Math.PI / 2, 0]));
    g.add(mesh(cylX(SR, 1.0, 64), tapa, [SX0 + 0.5, SY, SZ]));
    // asa negra a lo largo del borde delantero de la tapa
    const ag = new THREE.TorusGeometry(SR - 0.7, 0.75, 12, 48, Math.PI * 0.95); ag.rotateZ(Math.PI / 2 + 0.08);
    g.add(mesh(ag, M.plasticoNegro, [SX0 - 0.4, SY, SZ], [0, Math.PI / 2, 0]));
    for (let i = 0; i < 7; i++) { const a = Math.PI / 2 + 0.5 + i * 0.32;
      g.add(mesh(box(0.5, 0.9, 1.8), M.plasticoNegro, [SX0 - 1.1, SY + Math.sin(a) * (SR - 0.7), SZ - Math.cos(a) * (SR - 0.7)], [a - Math.PI / 2, 0, 0])); }
    // mirilla ovalada en la parte delantera-superior del tambor y pestillo inferior
    const mir = mesh(cylY(2.6, 0.3, 40), M.negroBrillante, [SX0 + 7, SY + Math.sin(0.7) * (SR + 0.1), SZ + Math.cos(0.7) * (SR + 0.1)], [Math.PI / 2 - 0.7, 0, 0]);
    mir.scale.set(1.25, 1, 0.75); g.add(mir);
    g.add(mesh(rbox(3.2, 1.4, 1.6, 0.4), M.aceroPulido, [SX0 + 8, SY - Math.sin(0.5) * SR, SZ + Math.cos(0.5) * SR + 0.3], [0.5, 0, 0]));
    // drenaje de la cámara de spray
    g.add(mesh(cylY(0.9, 1.6, 24), M.plasticoNegro, [SX0 + 9, SY - SR - 0.4, SZ + 2]));
    g.add(mesh(tubePath([[SX0 + 9, SY - SR - 1.2, SZ + 2], [SX0 + 9, SY - SR - 6, SZ + 2.5], [SX0 + 10.5, 6, SZ + 6], [SX0 + 12, 0.7, SZ + 10], [SX0 + 12, 0.7, SZ + 16]], 0.5, 48, 10), M.cable));
  }
  {
    const g = makePart(root, 'cds', L1([0, 0, 24], { label: 'equipo' }));
    // compartimento tras la ventana inferior izquierda: fondo oscuro, bandeja, dos botellas y la válvula selectora encima
    g.add(mesh(rbox(18.1, 19.5, 0.6, 0.2), M.plasticoNegro, [-47.25, 14.75, 27.5]));
    g.add(mesh(rbox(17, 1.2, 7.6, 0.3), M.plasticoNegro, [-47.5, 4.6, 32.5]));                  // bandeja (libre del montante del bastidor)
    const tint = M.vidrio.clone(); tint.color.setHex(0xaab4d8); tint.opacity = 0.42;
    for (const [x, c, s] of [[-52, 0xcfe0ff, 1], [-43, 0xe6eed2, -1]]) {
      g.add(mesh(botella(2.9, 11.2), tint, [x, 5.2, 32.5]));
      const liq = M.disolvente.clone(); liq.color.setHex(c);
      g.add(mesh(cylY(2.7, 6.5, 32), liq, [x, 8.6, 32.5]));
      g.add(mesh(cylY(1.5, 1.6, 24), M.plasticoNegro, [x, 17.9, 32.5]));
      g.add(mesh(tubePath([[x, 18.75, 32.5], [x, 20.5, 32.4], [x + s * 1.2, 23.4, 31.6], [-50 - s * 1.8, 25.95, 31]], 0.1, 32, 6), M.ptfe));
    }
    g.add(mesh(rbox(8, 5, 5, 0.4), M.anodizado, [-50, 28.5, 31]));                         // válvula selectora
    // salida de la válvula → abertura de la interfaz → nebulizador de referencia (dentro de la carcasa de la fuente)
    const ax = new THREE.Vector3(0, Math.cos(0.35), Math.sin(0.35)), ref = new THREE.Vector3(wx(AX.SPRAY.x + 0.4), ORIGEN.y + AX.SPRAY.y + 5, ORIGEN.z + 3.6);
    const e1 = ref.clone().addScaledVector(ax, 4.35);
    cableFlex(g, [[-54.05, 28.5, 31], [-57, 30.5, 27], [-59.6, 34, 20.5, 'panel_izq'], [-61.6, 36.4, 18.2, 'panel_izq'], [-64.5, 43.5, 21, 'nebulizador_referencia'],
      [-65.9, 47.2, 21, 'nebulizador_referencia'], [e1.x, e1.y - 0.6, e1.z + 0.9, 'nebulizador_referencia'], [e1.x, e1.y, e1.z, 'nebulizador_referencia']], 0.1, M.ptfe, { seg: 70, radial: 6 });
  }

  /* ---------------- VACÍO ---------------- */
  {
    const g = makePart(root, 'camara_vacio', L1([0, 0, 0], { shell: true, label: 'equipo' }));
    const x0 = wx(AX.SKIM - 1.5), x1 = wx(AX.TOF_X1 + 1), y = ORIGEN.y, z = ORIGEN.z;
    g.add(mesh(rbox(wx(AX.SL_1 + 1) - x0, 11, 11, 0.6), M.aluminio, [(x0 + wx(AX.SL_1 + 1)) / 2, y, z]));
    g.add(mesh(rbox(x1 - wx(AX.TOF_X0 - 1), 12, 12, 0.6), M.aluminio, [(wx(AX.TOF_X0 - 1) + x1) / 2, y, z]));       // carcasa del pulsador
    for (const lx of [AX.OCT_0 - 0.5, AX.Q_0 - 0.5, AX.C_1 + 0.6]) g.add(mesh(rbox(1, 13, 13, 0.3), M.aceroPulido, [wx(lx), y, z]));
    g.add(mesh(cylY(1.4, 4, 32), M.aceroPulido, [wx(AX.SKIM + 1), y - 7.5, z]));              // puerto de vacío primario
    g.add(mesh(cylY(0.45, 1.6, 16), M.aceroPulido, [wx(AX.C_0 + 2), y + 6.2, z]));         // racor de N₂ de la celda
    g.add(mesh(cylZ(0.7, 1.2, 20), M.aceroPulido, [wx(AX.DET.x), y - 2, z - 6.6]));        // pasamuros de señal del detector
  }
  {
    // bajo la cámara; al despiezar salen hacia delante (por debajo de la óptica no hay sitio hacia abajo)
    const g = makePart(root, 'bombas_turbo', L1([0, 0, 34], { label: 'equipo' }));
    for (const lx of [AX.OCT_1 - 4, AX.C_0 + 4]) {
      const x = wx(lx), y = ORIGEN.y - 7, z = ORIGEN.z;
      g.add(mesh(cylY(2.6, 4.95, 32), M.aceroPulido, [x, y - 1.025, z]));                  // brida de entrada, enrasada con la cámara
      g.add(mesh(cylY(5, 14, 40), M.aluminio, [x, y - 10.5, z]));
      for (const dy of [-6, -12]) g.add(mesh(cylY(3.2, 2, 32), M.aceroPulido, [x + 4.5, y + dy, z]).rotateZ(Math.PI / 2));
      g.add(mesh(rbox(9, 3.4, 9, 0.4), M.anodizado, [x, y - 19, z]));
    }
  }
  {
    const g = makePart(root, 'bomba_primaria', L1([24, 0, 0], { label: 'equipo' }));
    const cx = 82, cz = -20;
    g.add(mesh(rbox(29.7, 22.8, 41.8, 1), M.anodizado, [cx, 11.4, cz]));
    g.add(mesh(cylZ(8, 14, 48), grafito, [cx, 11, cz + 22]));
    for (let i = 0; i < 8; i++) g.add(mesh(washerX(8.6, 7.8, 0.3), grafito, [cx, 11, cz + 16.4 + i * 1.6]).rotateY(Math.PI / 2));
    g.add(mesh(cylY(1.4, 3, 24), M.aceroPulido, [cx - 4, 24.3, cz - 8]));
    g.add(mesh(cylX(1.2, PX[2] - PX[0] + 2.4, 32), M.aceroPulido, [cx - 4, 27, cz - 8]));      // colector de las tres mangueras
    for (const x of PX) g.add(mesh(cylY(1.0, 1.2, 24), M.aceroPulido, [x, 28.2, cz - 8]));
    g.add(mesh(cylZ(1.6, 0.4, 32), M.vidrio, [cx + 8, 7, cz + 20.95]));
  }
  {
    // mangueras de vacío: cámara/turbos → por el fondo, a ras del zócalo → pasos del panel trasero → colector de la bomba
    const g = makePart(root, 'linea_vacio', L1([0, 0, 0], { info: 'bomba_primaria' }));
    const mat = M.aceroOscuro.clone(); mat.color.setHex(0xb3b8be); mat.roughness = 0.32; mat.roughnessMap = null; mat.bumpMap = ribTexture(160); mat.bumpScale = 3;
    const t1 = wx(AX.OCT_1 - 4) + 5.6, t2 = wx(AX.C_0 + 4) + 5.6, rx = wx(AX.SKIM + 1), z = ORIGEN.z, yt = ORIGEN.y - 19;
    const C = 'chasis', T = 'bombas_turbo';
    const INI = [
      [[rx, ORIGEN.y - 9.6, z, 'camara_vacio'], [rx, 22, z, C], [rx, 15.5, z - 3, C], [rx + 2, 13.2, 0, C], [-40, 13, -22, C], [-34, 13, -28, C], [30, 13, -28, C], [HX[0], 12.6, -31.5, C]],
      [[t1, yt, z, T], [t1 + 3.4, yt - 1, z, T], [t1 + 6.4, yt - 7, z - 4, T], [-18, 12, -10, C], [-14, 13, -24, C], [39, 13, -24, C], [HX[1], 12.6, -28.5, C]],
      [[t2, yt, z, T], [t2 + 3.4, yt - 1, z, T], [t2 + 6.4, yt - 7, z - 4, T], [16, 12, -8, C], [19, 13, -20, C], [45, 13, -20, C], [HX[2], 12.6, -25, C]],
    ];
    INI.forEach((ini, i) => {
      // por fuera: escalonadas en z, por detrás de la bomba y por encima de ella hasta su colector, sin cruzarse
      const hx = HX[i], px = PX[2 - i], zr = ZB - 4 - (2 - i) * 2.2;
      cableFlex(g, [...ini, [hx, HY, ZB + 3.5, C], [hx, HY, ZB + 1.7, 'panel_trasero'], [hx, HY, ZB - 0.8, 'panel_trasero'], [hx + 2, HY, zr, 'panel_trasero'],
        [60, HY, zr, 'panel_trasero'], [66, 20, zr, 'bomba_primaria'], [px - 3, 27, zr, 'bomba_primaria'], [px, 29.8, zr + 3, 'bomba_primaria'], [px, 30, -31, 'bomba_primaria'], [px, 28.85, -28, 'bomba_primaria']], 0.8, mat, { seg: 200, radial: 12 });
    });
  }

  /* ---------------- ELECTRÓNICA Y GASES ---------------- */
  {
    const g = makePart(root, 'electronica', L1([0, 0, -26], { label: 'equipo' }));
    g.add(mesh(rbox(60, 34, 0.3, 0.06), M.pcb, [0, 27, ZB + 4]));
    const rnd = (() => { let a = 7; return () => ((a = (a * 16807) % 2147483647) / 2147483647); })();
    const usados = [];                                                                     // componentes sin solaparse (evita caras coplanares)
    for (let i = 0; i < 60; i++) { const x = -28 + rnd() * 56, y = 12 + rnd() * 30, chip = rnd() < 0.65;
      const w = chip ? 1 + rnd() * 1.5 : 0.8, h = chip ? 1 + rnd() : 0.8;
      if (usados.some((u) => Math.abs(u[0] - x) < (u[2] + w) / 2 + 0.1 && Math.abs(u[1] - y) < (u[3] + h) / 2 + 0.1)) continue;
      usados.push([x, y, w, h]);
      if (chip) g.add(mesh(box(w, h, 0.3), M.chip, [x, y, ZB + 4.3])); else g.add(mesh(cylZ(0.4, 1, 16), M.condensador, [x, y, ZB + 4.7])); }
    screws(g, M.tornillo, M.tornilloNegro, 0.3, 'z', [[-29, 43, ZB + 4.2], [29, 43, ZB + 4.2], [-29, 11, ZB + 4.2], [29, 11, ZB + 4.2]]);
    g.add(mesh(rbox(22, 14, 18, 0.5), M.aluminio, [46, 13, 20]));                           // fuente de alimentación (bajo la torre, delante)
  }
  {
    const g = makePart(root, 'adc', L1([0, 30, 0], { label: 'equipo' }));
    // placa ADC dentro de la torre, detrás del tubo de vuelo
    const zb = TCZ - 10;
    g.add(mesh(rbox(12, 22, 0.3, 0.06), M.pcb, [TCX, 130, zb]));
    for (let i = 0; i < 2; i++) g.add(mesh(rbox(6, 6, 1.4, 0.3), M.aluminio, [TCX, 126 + i * 8, zb + 0.85]));
    g.add(mesh(box(2, 1, 1), M.plasticoNegro, [TCX + 4, 118.6, zb + 0.4]));               // conector de señal
    // cable de señal: baja por detrás del tubo de vuelo, cruza el hueco de la cubierta y llega al pasamuros del detector
    const dx = wx(AX.DET.x), dz = ORIGEN.z - 7.25;
    cableFlex(g, [[TCX + 4, 118.05, zb + 0.4], [TCX + 4, 110, zb + 0.4], [TCX + 5, 80, zb + 0.8], [dx - 0.5, 52, zb + 1.2], [dx, 40, dz - 1.4, 'camara_vacio'],
      [dx, ORIGEN.y - 1.6, dz - 0.6, 'camara_vacio'], [dx, ORIGEN.y - 2, dz - 0.05, 'camara_vacio']], 0.2, M.cable, { seg: 90, radial: 8 });
  }
  {
    const g = makePart(root, 'linea_gases', L1([0, 14, 0], { label: 'equipo' }));
    g.add(mesh(rbox(10, 8, 8, 0.4), M.grisClaro, [-40, 38, -24]));
    // N₂ desde el pasamuros del panel trasero hasta el distribuidor
    cableFlex(g, [[-40, 40, ZB + 1.95, 'panel_trasero'], [-40, 40, ZB + 4.5, 'panel_trasero'], [-40.3, 41.5, -31], [-40.5, 43.6, -26.5], [-40.5, 42.05, -24]], 0.25, M.ptfe, { seg: 60, radial: 8 });
    // gas del nebulizador: sale por el pasamuros del lateral izquierdo y sube por fuera hasta el racor lateral del nebulizador
    const p = AX.SPRAY, N = 'nebulizador_ajs', PI = 'panel_izq', yn = ORIGEN.y + p.y + 18, zn = ORIGEN.z + 2.5;
    cableFlex(g, [[-43, 42.05, -22], [-44, 44.5, -16], [-52, 46, 6], [-57.5, 46, 24], [-59.8, GYg, GZ, PI], [-62.2, GYg, GZ, PI], [-63.6, 48.5, 27, PI],
      [-62.6, 52.5, 21.5, N], [-61.15, 56.2, 17.8, N], [-61.25, yn - 0.4, zn + 0.6, N], [wx(p.x + 5.65), yn, zn, N]], 0.25, M.ptfe, { seg: 110, radial: 8 });
    // gas de colisión (cobre) hasta el racor de la celda en la cámara
    const cx = wx(AX.C_0 + 2);
    cableFlex(g, [[-34.95, 38, -24], [-28, 40, -15], [cx - 9, 45, 5, 'camara_vacio'], [cx, 45.5, ORIGEN.z - 0.4, 'camara_vacio'], [cx, 43.05, ORIGEN.z, 'camara_vacio']], 0.15, M.cobre, { seg: 60, radial: 8 });
  }

  /* ---------------- LC 1290 INFINITY II (contexto) ---------------- */
  {
    const g = makePart(root, 'lc', L1([-30, 0, 0], { shell: true, label: 'equipo' }));
    const cx = -111, W = 40, D = 47, cz = ZF - D / 2, zf = cz + D / 2;
    const ahumado = M.negroBrillante.clone(); ahumado.color.setHex(0x2a2e33);
    const azul = new THREE.MeshStandardMaterial({ map: textTexture(['Agilent'], { w: 256, h: 64, bg: '#0a7fcf', fg: '#ffffff', font: '600 40px Segoe UI' }), roughness: 0.4 });
    const mod = (y0, h, extra) => {
      g.add(mesh(rbox(W, h - 0.4, D, 0.8), blanco, [cx, y0 + h / 2, cz]));
      g.add(mesh(new THREE.PlaneGeometry(3.6, 0.9), azul, [cx - W / 2 + 3.4, y0 + h - 1.9, zf + 0.03]));
      g.add(mesh(box(1.8, 0.35, 0.2), M.ledVerde, [cx + W / 2 - 3.2, y0 + h - 1.9, zf + 0.1]));
      if (extra) extra(y0, h);
    };
    // bomba binaria de alta velocidad (abajo) y Multisampler, con frentes oscuros ahumados
    mod(0, 21, (y0, h) => g.add(mesh(rbox(W - 6, h - 6.5, 0.6, 0.4), ahumado, [cx, y0 + h / 2 - 0.9, zf + 0.25])));
    mod(21, 34, (y0, h) => { g.add(mesh(rbox(W - 6, h - 7, 0.6, 0.4), ahumado, [cx, y0 + h / 2 - 1, zf + 0.25]));
      for (let i = 0; i < 6; i++) g.add(mesh(cylZ(0.6, 0.3, 20), M.grisClaro, [cx - W / 2 + 5.4, y0 + 5 + i * 3.8, zf + 0.7])); });
    // compartimento multicolumna: banda negra y puerta blanca; salida de la columna por el lateral derecho
    mod(55, 15, (y0, h) => { g.add(mesh(rbox(W - 3, 3, 0.5, 0.2), M.plasticoNegro, [cx, y0 + h - 5.2, zf + 0.2])); g.add(mesh(cylX(0.55, 12, 24), M.aceroPulido, [cx, y0 + h / 2, zf - 6])); });
    mod(70, 12, (y0, h) => { g.add(mesh(rbox(W - 4, h - 5, 0.6, 0.4), blanco, [cx, y0 + h / 2 - 0.8, zf + 0.25])); g.add(mesh(rbox(10, 0.6, 0.4, 0.15), M.plasticoNegro, [cx + 6, y0 + 3, zf + 0.6])); });
    g.add(mesh(rbox(W, 3, D - 4, 0.6), blanco, [cx, 83.6, cz]));                                // bandeja de disolventes
    for (let i = 0; i < 4; i++) { const x = cx - 13.5 + i * 9;
      g.add(mesh(cylY(3.6, 16, 32), M.vidrio, [x, 93.1, cz + 2])); g.add(mesh(cylY(3.45, 10, 32), M.disolvente, [x, 90.25, cz + 2]));
      g.add(mesh(cylY(1.6, 2.4, 24), M.plasticoNegro, [x, 102.3, cz + 2])); }
    g.add(mesh(cylX(0.45, 0.9, 20), M.aceroPulido, [cx + W / 2 + 0.45, 62, zf - 8]));        // salida de la columna
  }
  {
    // capilar PEEK: del lateral del compartimento de columnas, por encima del hueco, hasta la entrada del nebulizador
    const g = makePart(root, 'tubo_muestra', L1([0, 0, 0], { info: 'lc' }));
    const p = AX.SPRAY, yn = ORIGEN.y + p.y + 18.4, zn = ORIGEN.z + 1.5, N = 'nebulizador_ajs';
    cableFlex(g, [[-90.05, 62, ZF - 8, 'lc'], [-89.4, 62.3, ZF - 8, 'lc'], [-85, 63.5, 27.5, 'lc'], [-79, 62.5, 22], [-74, 60, 17],
      [wx(p.x - 4.6), yn + 0.15, zn + 0.1, N], [wx(p.x - 3.35), yn, zn, N]], 0.1, M.peekRojo, { seg: 100, radial: 8 });
  }

  refs.analyzer = buildAnalizador(root);

  // los cables y mangueras son cableFlex: siguen a sus piezas sin reconstrucción manual
  refs.update = () => {};
  return refs;
}
