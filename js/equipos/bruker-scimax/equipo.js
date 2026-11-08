// Equipo completo scimaX, según el render oficial de Bruker y fotografías del equipo real: un cuerpo compacto y alto en
// gris claro, con esquinas verticales y aristas superiores de gran radio, que oculta el imán de 7 T; cabeza azul Bruker en el
// extremo frontal (de suelo a techo, con línea de luz) que continúa como banda azul sobre la tapa hasta la caja alta del
// criorrefrigerador; la fuente ESI (cúpula azul) en un hueco azul de esquinas redondeadas del lateral, con una repisa blanca
// debajo; puerta de la diana MALDI en el hombro derecho del frontal; compresor de helio en el suelo y puesto de control aparte.
// Coordenadas de mundo en cm. Eje iónico = −X (el frente real mira a +X; el lateral rotulado, a +Z).
// Bruker no publica las dimensiones: el cuerpo (≈ 249 × 104 × 171 cm; 222 cm con la caja del criorrefrigerador) sigue las
// proporciones del render y de las fotos, con la óptica de transferencia acortada para que el analizador quepa.
import * as THREE from 'three';
import { M } from '../../materials.js';
import { mesh, rbox, box, cylX, cylY, cylZ, tubeX, tubePath, placaPasos, grilleTexture, screenTexture, plateTexture, warningTexture } from '../../geom.js';
import { makePart, cableFlex } from '../../parts.js';
import { buildAnalizador } from './analizador.js';
import { ORIGEN, AX } from './geometria.js';

const L1 = (offset, extra = {}) => ({ level: 1, offset, mode: 'equipo', ...extra });
/** Cuerpo: x ∈ [XB, XF], z ∈ [−ZW, ZW], tapa a HH; esquinas y aristas de radio R (centros en XB + R, ±Z1, YE). */
const XB = -113, XF = 136, ZW = 52, HH = 168, R = 13, X1 = XB + R, Z1 = ZW - R, YE = HH - R, T = 1.2;
/** Cabeza azul: x ≥ XH, z ∈ [ZH, ZW], hasta HT; esquina frontal izquierda de radio RH. Hombro gris: z < ZH. */
const XH = 90, ZH = -10, HT = 171, RH = 8, XS = XF - R;
/** Hueco de la fuente en el costado de la cabeza y repisa blanca. */
const HU = { x0: 96, x1: 126, y0: 104, y1: 146, zf: 17 };
/** Banda azul sobre la tapa (z ∈ [ZH, 38]) desde la caja del criorrefrigerador hasta la cabeza. */
const BANDA = { z0: ZH, z1: 30, x0: -50 };
/** Analizador girado 180°: x local → −x mundo, z local → −z. */
const wx = (x) => ORIGEN.x - x;
const MX = wx(AX.MAG_C), MR = AX.MAG_R, ML = AX.MAG_L;
/** Turbos de la consola (x mundo; la tercera cuelga del tubo UHV, delante del imán) y turbo UHV tras el imán. */
const TURBOS = [AX.F1_0 + 4, AX.Q_0 + 6, AX.TR_0 + 8].map(wx);
const XUHV = MX - ML / 2 - 6;
const XPRE = wx(AX.UHV_END + 1.5 + 3.6);
/** Bancada óptica y paso de la fibra del láser [x, z, r]. */
const BANCO = { x0: 46, x1: 132, z: 18, y: ORIGEN.y - 20 };
const PASO_FIBRA = [118, -4, 0.6];
/** Criorrefrigerador (cabeza fría en XC, ZC) y compresor de helio. */
const CRIO = { x0: -90, x1: -56, z0: -6, z1: 34 }, XC = -73, ZC = 14;
const COMP = { x: -80, z: -100 };
const BPV = { x: 60, y: 14, z: -30 };

/* ---------- utilidades de forma ---------- */
/** Extruye una forma. 'xy': espesor en z · 'zy': u = z, v = y, espesor en x · 'xz': u = x, v = −z, espesor en y. */
function placa(shape, t, mat, pos, plano = 'xy') {
  const g = new THREE.ExtrudeGeometry(shape, { depth: t, bevelEnabled: false, curveSegments: 20 });
  g.translate(0, 0, -t / 2);
  const rot = plano === 'zy' ? [0, -Math.PI / 2, 0] : plano === 'xz' ? [-Math.PI / 2, 0, 0] : [0, 0, 0];
  return mesh(g, mat, pos, rot);
}
const poly = (pts, P = THREE.Shape) => { const s = new P(); pts.forEach(([u, v], i) => (i ? s.lineTo(u, v) : s.moveTo(u, v))); s.lineTo(...pts[0]); return s; };
/** Cáscara de cuarto de cilindro: arco de radio r (exterior) y r − T entre los ángulos a0 y a1, centrado en (cu, cv). */
function arco(cu, cv, r, a0, a1) {
  const s = new THREE.Shape();
  s.moveTo(cu + r * Math.cos(a0), cv + r * Math.sin(a0)); s.absarc(cu, cv, r, a0, a1, a1 < a0);
  s.lineTo(cu + (r - T) * Math.cos(a1), cv + (r - T) * Math.sin(a1)); s.absarc(cu, cv, r - T, a1, a0, a1 > a0);
  s.lineTo(cu + r * Math.cos(a0), cv + r * Math.sin(a0));
  return s;
}
/** Octante de esfera (esquina superior redondeada): sx, sz = signos de la esquina. */
function octante(mat, c, sx, sz) {
  const phi = sx < 0 ? (sz > 0 ? 0 : -Math.PI / 2) : (sz > 0 ? Math.PI / 2 : Math.PI);
  const m = mesh(new THREE.SphereGeometry(R - T / 2, 32, 12, phi, Math.PI / 2, 0, Math.PI / 2), mat, c);
  return m;
}
/** Rectángulo de esquinas redondeadas como agujero. */
function huecoRedondeado(x0, y0, x1, y1, r) {
  const p = new THREE.Path();
  p.moveTo(x0 + r, y0); p.lineTo(x1 - r, y0); p.quadraticCurveTo(x1, y0, x1, y0 + r); p.lineTo(x1, y1 - r); p.quadraticCurveTo(x1, y1, x1 - r, y1);
  p.lineTo(x0 + r, y1); p.quadraticCurveTo(x0, y1, x0, y1 - r); p.lineTo(x0, y0 + r); p.quadraticCurveTo(x0, y0, x0 + r, y0);
  return p;
}
function lienzo(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
const rotulo = (tex, opts = {}) => new THREE.MeshStandardMaterial({ map: tex, transparent: true, alphaTest: 0.05, roughness: 0.5, ...opts });
/** Logotipo de Bruker recreado (órbitas + palabra). */
function logoBruker(color) {
  return lienzo(512, 256, (g) => {
    g.strokeStyle = color; g.lineWidth = 7;
    for (const a of [0, Math.PI / 3, -Math.PI / 3]) { g.save(); g.translate(256, 92); g.rotate(a); g.beginPath(); g.ellipse(0, 0, 88, 30, 0, 0, Math.PI * 2); g.stroke(); g.restore(); }
    g.fillStyle = color; g.beginPath(); g.arc(256, 92, 11, 0, Math.PI * 2); g.fill();
    g.font = '800 74px Arial, Segoe UI'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('BRUKER', 256, 206);
  });
}
/** Rótulo "scimaX" del lateral (blanco con contorno y sombra suaves; la X mayor e inclinada). */
function rotuloScimax() {
  return lienzo(1024, 320, (g) => {
    const txt = (f) => { g.font = '600 190px Segoe UI, Arial'; f('scima', 20, 230); const w = g.measureText('scima').width; g.font = 'italic 700 270px Segoe UI, Arial'; f('X', 20 + w + 6, 250); };
    g.textBaseline = 'alphabetic'; g.shadowColor = 'rgba(30,45,70,0.6)'; g.shadowBlur = 12; g.shadowOffsetX = 4; g.shadowOffsetY = 5;
    g.strokeStyle = '#8d98a8'; g.lineWidth = 5; txt((s, x, y) => g.strokeText(s, x, y));
    g.shadowColor = 'transparent'; g.fillStyle = '#ffffff'; txt((s, x, y) => g.fillText(s, x, y));
  });
}

export function buildEquipo(root) {
  const refs = {};
  const navy = M.azulBruker.clone(); navy.color.setHex(0x253b5c); navy.roughness = 0.42; navy.clearcoat = 0.35;
  const navyHueco = navy.clone(); navyHueco.color.setHex(0x1a2a44);
  const gris = M.grisClaro.clone(); gris.color.setHex(0xdcdfe2); gris.metalness = 0.08; gris.roughness = 0.42; gris.clearcoat = 0.35;
  const grisD = gris.clone(); grisD.side = THREE.DoubleSide;
  const oscuro = M.carcasaOsc.clone(); oscuro.color.setHex(0x1b2230);
  const junta = new THREE.MeshStandardMaterial({ color: 0x8a919b, roughness: 0.7 });
  const linea = new THREE.MeshStandardMaterial({ color: 0x4a5260, roughness: 0.6 });
  const led = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xdcefff, emissiveIntensity: 1.6, roughness: 0.3 });
  const rejilla = navy.clone(); rejilla.map = grilleTexture(30, 3); rejilla.color.setHex(0x8b97ab);
  const logoBlanco = rotulo(logoBruker('#e9eef5'));

  /* ---------------- BASTIDOR ---------------- */
  {
    const g = makePart(root, 'chasis', L1([0, 0, 0]));
    g.add(mesh(rbox(XF - XB - 6, 3, 2 * ZW - 6, 0.5), oscuro, [(XB + XF) / 2, 2.5, 0]));                  // zócalo retranqueado
    for (const x of [XB + 12, XF - 12]) for (const z of [-ZW + 8, ZW - 8]) g.add(mesh(cylY(2.4, 1.0, 24), M.aceroOscuro, [x, 0.5, z]));
    for (const [x, z] of [[-101, -47], [-101, 47], [86, -46]]) g.add(mesh(box(3, 146, 3), M.aluminio, [x, 4.1 + 73, z]));
    // bancada óptica: aberturas para las turbos que la atraviesan y paso de la fibra del láser; cuatro columnas
    const xc = (BANCO.x0 + BANCO.x1) / 2;
    const huecos = [...TURBOS.filter((x) => x > BANCO.x0 + 6 && x < BANCO.x1 - 6).map((x) => [x - xc, 0, 5.2]), [PASO_FIBRA[0] - xc, PASO_FIBRA[1], PASO_FIBRA[2]]];
    g.add(placaPasos(BANCO.x1 - BANCO.x0, 2 * BANCO.z, 2, huecos, M.aluminio, [xc, BANCO.y, 0], 'xz', 0.3));
    g.add(mesh(tubeX(0.9, 0.6, 0.6, 20), M.goma, [PASO_FIBRA[0], BANCO.y + 1.2, PASO_FIBRA[1]], [0, 0, Math.PI / 2]));
    for (const x of [58, 130]) for (const z of [-12, 12]) g.add(mesh(box(3, BANCO.y - 1 - 4.1, 3), M.aluminio, [x, (4.1 + BANCO.y - 1) / 2, z]));
  }
  {
    // cunas del imán (no se mueven: el imán tampoco, el tubo UHV pasa por su interior)
    const g = makePart(root, 'soporte_iman', L1([0, 0, 0], { info: 'iman' }));
    const yb = ORIGEN.y - MR;
    for (const x of [MX - 40, MX + 40]) {
      g.add(mesh(rbox(12, yb + 1.5 - 5.2, 56, 0.6), M.carcasaOsc, [x, (5.2 + yb + 1.5) / 2, 0]));
      g.add(mesh(rbox(16, 1.2, 64, 0.4), M.aceroOscuro, [x, 4.6, 0]));
    }
  }

  /* ---------------- CARCASA ---------------- */
  {
    // cabeza azul del extremo frontal: frontal con esquina redondeada, costado con el hueco de la fuente, tapa y remates
    const g = makePart(root, 'panel_frontal', L1([40, 0, 70], { shell: true, label: 'equipo' }));
    {
      const s = new THREE.Shape(), ci = -(ZW - RH);
      s.moveTo(XF, -ZH); s.lineTo(XF, ci); s.absarc(XF - RH, ci, RH, 0, -Math.PI / 2, true); s.lineTo(XF - RH, -ZW + T);
      s.absarc(XF - RH, ci, RH - T, -Math.PI / 2, 0, false); s.lineTo(XF - T, -ZH); s.lineTo(XF, -ZH);
      g.add(placa(s, HT - T - 4, navy, [0, (4 + HT - T) / 2, 0], 'xz'));
      const top = new THREE.Shape();
      top.moveTo(XH, -ZH); top.lineTo(XF, -ZH); top.lineTo(XF, ci); top.absarc(XF - RH, ci, RH, 0, -Math.PI / 2, true); top.lineTo(XH, -ZW); top.lineTo(XH, -ZH);
      g.add(placa(top, T, navy, [0, HT - T / 2, 0], 'xz'));
    }
    // costado (+z): parte azul con la abertura redondeada del hueco de la fuente
    {
      const s = poly([[XH, 102.8], [XF - RH, 102.8], [XF - RH, HT - T], [XH, HT - T]]);
      s.holes.push(huecoRedondeado(HU.x0, HU.y0, HU.x1, HU.y1, 5));
      g.add(placa(s, T, navy, [0, 0, ZW - 0.5]));
    }
    // hueco: fondo, costados y techo azul oscuro; repisa blanca que sobresale del lateral
    const xc = (HU.x0 + HU.x1) / 2, yc = (HU.y0 + HU.y1) / 2, zc = (HU.zf + ZW - T + 0.1) / 2, d = ZW - T + 0.1 - HU.zf;
    g.add(mesh(box(HU.x1 - HU.x0, HU.y1 - HU.y0, T), navyHueco, [xc, yc, HU.zf - T / 2]));
    for (const x of [HU.x0 - T / 2, HU.x1 + T / 2]) g.add(mesh(box(T, HU.y1 - HU.y0, d), navyHueco, [x, yc, zc]));
    g.add(mesh(box(HU.x1 - HU.x0 + 2 * T, T, d), navyHueco, [xc, HU.y1 + T / 2, zc]));
    g.add(mesh(rbox(36, 2.4, 41, 0.6), gris, [xc, HU.y0 + 0.1, HU.zf + 20.6]));
    const pl = lienzo(512, 256, (c) => { c.fillStyle = '#f1f3f5'; c.fillRect(0, 0, 512, 256); c.fillStyle = '#22385a'; c.font = '600 34px Segoe UI'; c.fillText('Dual ESI / MALDI', 24, 52);
      c.font = '24px Segoe UI'; ['HV', 'Gas', 'Nebulizer', 'Dry gas'].forEach((s, i) => { c.fillText(s, 24 + i * 120, 200); c.beginPath(); c.arc(50 + i * 120, 140, 18, 0, 7); c.stroke(); }); });
    g.add(mesh(new THREE.PlaneGeometry(9, 4.5), new THREE.MeshStandardMaterial({ map: pl, roughness: 0.5 }), [HU.x0 + 6, HU.y1 - 6, HU.zf + 0.02]));
    // remates: trasera de la cabeza sobre el capó y franja sobre el hombro
    g.add(placa(poly([[ZH + 0.1, HH + 0.2], [BANDA.z1, HH + 0.2], [BANDA.z1, YE - 5], [ZW - 0.1, YE - 5], [ZW - 0.1, HT - T - 0.1], [ZH + 0.1, HT - T - 0.1]]), T, navy, [XH + T / 2 + 0.1, 0, 0], 'zy'));
    g.add(mesh(box(XF - T - XH - T - 0.2, HT - T - HH - 0.3, T), navy, [(XH + T + XF - T) / 2, (HH + 0.2 + HT - T - 0.1) / 2, ZH + T / 2 + 0.1]));
    // línea de luz (frontal y tapa), rejillas y logotipo
    g.add(mesh(rbox(0.3, 112, 1.0, 0.12), led, [XF + 0.15, 106, ZC]));
    g.add(mesh(rbox(XF - XH - 2.4, 0.3, 1.0, 0.12), led, [(XF + XH) / 2 - 1, HT + 0.15, ZC]));
    for (const z of [ZC - 13, ZC + 13]) g.add(mesh(new THREE.PlaneGeometry(30, 7), rejilla, [XH + 20, HT + 0.02, z], [-Math.PI / 2, 0, 0]));
    g.add(mesh(new THREE.PlaneGeometry(9, 4.5), logoBlanco, [XF + 0.03, 24, ZC], [0, Math.PI / 2, 0]));
  }
  {
    // tapa: superficie plana con aristas de gran radio a lo largo de los laterales, remate frontal del hombro y banda azul
    const g = makePart(root, 'tapa_superior', L1([0, 40, 0], { info: 'carcasa', shell: true }));
    const s = poly([[X1, Z1], [XS, Z1], [XS, -ZH + 0.2], [XH - 0.2, -ZH + 0.2], [XH - 0.2, -Z1], [X1, -Z1]]);
    const h = new THREE.Path(); h.absarc(XC, -ZC, 7.5, 0, Math.PI * 2, true); s.holes.push(h);
    g.add(placa(s, T, gris, [0, HH - T / 2, 0], 'xz'));
    g.add(placa(arco(Z1, YE, R, 0, Math.PI / 2), XH - 0.2 - X1, gris, [(X1 + XH - 0.2) / 2, 0, 0], 'zy'));
    g.add(placa(arco(-Z1, YE, R, Math.PI / 2, Math.PI), XS - X1, gris, [(X1 + XS) / 2, 0, 0], 'zy'));
    g.add(placa(arco(XS, YE, R, 0, Math.PI / 2), Z1 + ZH - 0.2, gris, [0, 0, (-Z1 + ZH - 0.2) / 2]));
    g.add(octante(grisD, [XS, YE, -Z1], 1, -1));
    // banda azul con línea de luz: se estrecha en diagonal desde la anchura de la cabeza hasta la caja del criorrefrigerador
    g.add(placa(poly([[XH, -BANDA.z0], [XH, -(ZW - RH)], [BANDA.x0, -BANDA.z1], [BANDA.x0, -BANDA.z0]]), HT - HH, navy, [0, (HH + HT) / 2, 0], 'xz'));
    g.add(mesh(rbox(XH - BANDA.x0 - 4, 0.3, 1.0, 0.12), led, [(XH + BANDA.x0) / 2, HT + 0.15, ZC]));
    for (const x of [0, 50]) for (const z of [ZC - 13, ZC + 13]) g.add(mesh(new THREE.PlaneGeometry(30, 7), rejilla, [x, HT + 0.02, z], [-Math.PI / 2, 0, 0]));
  }
  {
    // lateral izquierdo (+z), rotulado: incluye la parte blanca bajo la repisa de la fuente
    const g = makePart(root, 'panel_izq', L1([0, 0, 70], { info: 'carcasa', shell: true }));
    g.add(placa(poly([[X1, 4], [XF - RH - 0.1, 4], [XF - RH - 0.1, 102.8], [XH, 102.8], [XH, YE], [X1, YE]]), T, gris, [0, 0, ZW - T / 2]));
    const zt = ZW + 0.02;
    g.add(mesh(new THREE.PlaneGeometry(XF - RH - X1, 1.2), linea, [(X1 + XF - RH) / 2, 101, zt]));
    for (const x of [-25, 35]) g.add(mesh(new THREE.PlaneGeometry(0.7, YE - 6), junta, [x, (YE + 4) / 2, zt + 0.07]));
    g.add(mesh(new THREE.PlaneGeometry(60, 18.75), rotulo(rotuloScimax()), [-62, 131, zt + 0.12]));
    const sub = lienzo(1024, 96, (c) => { c.fillStyle = '#3c4656'; c.font = 'italic 500 54px Segoe UI, Arial'; c.textBaseline = 'middle'; c.fillText('maxwell  MRMS technology inside', 8, 50); });
    g.add(mesh(new THREE.PlaneGeometry(34, 3.2), rotulo(sub), [110, 94, zt + 0.12]));
    const vg = gris.clone(); vg.map = grilleTexture(16, 10);
    g.add(mesh(new THREE.PlaneGeometry(20, 24), vg, [0, 40, zt]));
    g.add(mesh(rbox(5, 7, 0.8, 0.3), M.peekRojo, [-86, 62, ZW + 0.4]));
  }
  {
    // lateral derecho (−z) y frontal del hombro derecho, con su esquina redondeada y la puerta de la diana MALDI
    const g = makePart(root, 'panel_der', L1([0, 0, -70], { info: 'carcasa', shell: true }));
    g.add(placa(poly([[X1, 4], [XS, 4], [XS, YE], [X1, YE]]), T, gris, [0, 0, -ZW + T / 2]));
    g.add(placa(arco(XS, Z1, R, 0, Math.PI / 2), YE - 4, gris, [0, (4 + YE) / 2, 0], 'xz'));
    g.add(mesh(box(T, YE - 4, Z1 + ZH - 0.2), gris, [XF - T / 2, (4 + YE) / 2, (-Z1 + ZH - 0.2) / 2]));
    const zt = -ZW - 0.02;
    g.add(mesh(new THREE.PlaneGeometry(XS - X1, 1.2), linea, [(X1 + XS) / 2, 101, zt], [0, Math.PI, 0]));
    for (const x of [-25, 35]) g.add(mesh(new THREE.PlaneGeometry(0.7, YE - 6), junta, [x, (YE + 4) / 2, zt - 0.07], [0, Math.PI, 0]));
    g.add(mesh(new THREE.PlaneGeometry(Z1 + ZH - 0.6, 1.2), linea, [XF + 0.02, 101, (-Z1 + ZH) / 2], [0, Math.PI / 2, 0]));
    g.add(mesh(rbox(0.8, 28, 22, 0.4), gris, [XF + 0.4, 124, -25]));
    g.add(mesh(rbox(1.4, 6, 1.6, 0.6), M.aceroPulido, [XF + 1.5, 124, -16]));
    g.add(mesh(cylX(0.6, 0.5, 16), M.ledVerde, [XF + 0.25, 144, -33]));
  }
  {
    // trasera: panel plano, esquinas verticales y arista superior redondeadas
    const g = makePart(root, 'panel_trasero', L1([-40, 0, 0], { info: 'carcasa', shell: true }));
    g.add(mesh(box(T, YE - 4, 2 * Z1), gris, [XB + T / 2, (4 + YE) / 2, 0]));
    g.add(placa(arco(X1, -Z1, R, Math.PI, 1.5 * Math.PI), YE - 4, gris, [0, (4 + YE) / 2, 0], 'xz'));
    g.add(placa(arco(X1, Z1, R, Math.PI / 2, Math.PI), YE - 4, gris, [0, (4 + YE) / 2, 0], 'xz'));
    g.add(placa(arco(X1, YE, R, Math.PI / 2, Math.PI), 2 * Z1, gris, [0, 0, 0]));
    g.add(octante(grisD, [X1, YE, Z1], -1, 1));
    g.add(octante(grisD, [X1, YE, -Z1], -1, -1));
    const plate = new THREE.MeshStandardMaterial({ map: plateTexture(['scimaX MRMS · 7 T', '230 V~ 50/60 Hz', 'Modelo didáctico', 'Explorador 3D']), metalness: 0.6, roughness: 0.4 });
    g.add(mesh(new THREE.PlaneGeometry(9, 4.5), plate, [XB - 0.03, 60, -20], [0, -Math.PI / 2, 0]));
    const vg = gris.clone(); vg.map = grilleTexture(24, 8);
    g.add(mesh(new THREE.PlaneGeometry(50, 20), vg, [XB - 0.03, 28, 8], [0, -Math.PI / 2, 0]));
    g.add(mesh(rbox(1.2, 3, 4, 0.3), M.plasticoNegro, [XB - 0.6, 16, 28]));
    g.add(mesh(tubePath([[XB - 1.2, 16, 28], [XB - 5, 16, 28], [XB - 10, 10, 30], [XB - 17, 0.7, 33], [XB - 35, 0.7, 42]], 0.45, 40, 10), M.cable));
  }
  {
    // cúpula azul de la fuente ESI en el fondo del hueco (al explosionar acompaña a la cabeza y sale del hueco por su abertura)
    const g = makePart(root, 'carcasa_fuente', L1([40, 0, 85], { shell: true, label: 'equipo' }));
    const c = new THREE.Vector3(112, ORIGEN.y, HU.zf), r = 11;
    const dome = new THREE.SphereGeometry(r, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2); dome.rotateX(Math.PI / 2);
    const mt = navy.clone(); mt.side = THREE.DoubleSide;
    g.add(mesh(dome, mt, [c.x, c.y, c.z]));
    g.add(mesh(new THREE.TorusGeometry(r - 0.2, 0.5, 12, 64), M.aceroOscuro, [c.x, c.y, c.z + 0.5]));
    g.add(mesh(cylZ(2.8, 1.0, 32), M.negroBrillante, [c.x, c.y, c.z + r - 0.2]));                   // mirilla
    g.add(mesh(cylZ(2.0, 3.0, 24), M.acero, [c.x - 7.5, c.y - 2, c.z + 8.4], [0, -0.6, 0]));        // entrada del nebulizador
    const w = new THREE.MeshStandardMaterial({ map: warningTexture('ALTA TENSIÓN'), roughness: 0.45, side: THREE.DoubleSide });
    g.add(mesh(new THREE.PlaneGeometry(5.4, 2.0), w, [c.x + 3, c.y + 7.2, c.z + 7.9], [-0.75, 0.25, 0]));
    // soporte de la jeringa junto a la cúpula
    g.add(mesh(rbox(2.6, 26, 2.6, 0.4), M.plasticoNegro, [HU.x1 - 2.4, 125, HU.zf + 1.3]));
    g.add(mesh(cylY(0.8, 12, 20), M.vidrio, [HU.x1 - 2.4, 128, HU.zf + 3.4]));
  }
  {
    const g = makePart(root, 'laser_maldi', L1([0, -40, 0], { label: 'equipo' }));
    g.add(mesh(rbox(18, 12, 16, 0.6), M.anodizado, [117, 88, -12]));
    const lw = new THREE.MeshStandardMaterial({ map: warningTexture('RADIACIÓN LÁSER'), roughness: 0.45 });
    g.add(mesh(new THREE.PlaneGeometry(9, 3.4), lw, [117, 88, -20.05], [0, Math.PI, 0]));
    // fibra óptica: salida superior del láser → paso de la bancada → entrada del láser en la fuente
    const [fx, fz] = PASO_FIBRA, F = 'fuente_dual', yb = BANCO.y;
    g.add(mesh(cylY(0.6, 1.2, 16), M.aceroPulido, [117, 94.6, -12]));
    cableFlex(g, [[117, 95.2, -12], [117.5, 97, -7], [fx, yb - 1.6, fz, 'chasis'], [fx, yb + 1.6, fz, 'chasis'], [fx - 0.2, yb + 5, -3.5, F], [wx(2.5), ORIGEN.y - 12.1, -3, F]], 0.25, M.cable);
  }

  /* ---------------- IMÁN SUPERCONDUCTOR (dentro del cuerpo) ---------------- */
  {
    const g = makePart(root, 'iman', L1([0, 0, 0], { shell: true, label: 'equipo' }));
    const L = ML, Rm = MR, Rb = AX.BORE_R;
    const prof = [[Rb, -L / 2], [Rm - 4, -L / 2], [Rm, -L / 2 + 4], [Rm, L / 2 - 4], [Rm - 4, L / 2], [Rb, L / 2], [Rb, -L / 2]];
    const geo = new THREE.LatheGeometry(prof.map(([rr, x]) => new THREE.Vector2(rr, x)), 96); geo.rotateZ(-Math.PI / 2);
    g.add(mesh(geo, M.acero, [MX, ORIGEN.y, 0]));
    for (const s of [-1, 1]) g.add(mesh(new THREE.TorusGeometry(Rm + 0.3, 0.9, 12, 96), M.aceroPulido, [MX + s * (L / 2 - 8), ORIGEN.y, 0], [0, Math.PI / 2, 0]));
    // torreta de la cabeza fría
    g.add(mesh(cylY(8, 8.9, 48), M.acero, [XC, HH - 2.6 - 4.45, ZC]));
    g.add(mesh(cylY(9, 1.2, 48), M.aceroPulido, [XC, HH - 2.1, ZC]));
    const lab = new THREE.MeshStandardMaterial({ map: lienzo(256, 96, (c) => { c.fillStyle = '#22385a'; c.fillRect(0, 0, 256, 96); c.fillStyle = '#fff'; c.font = '600 52px Segoe UI'; c.textBaseline = 'middle'; c.fillText('7 T · cc', 30, 50); }) });
    g.add(mesh(new THREE.PlaneGeometry(10, 3.75), lab, [MX + 20, ORIGEN.y, Rm + 0.3]));
    const w = new THREE.MeshStandardMaterial({ map: warningTexture('CAMPO MAGNÉTICO INTENSO'), roughness: 0.45 });
    g.add(mesh(new THREE.PlaneGeometry(13, 4.8), w, [MX - 20, ORIGEN.y + 10, Rm - 1.0], [-0.26, 0, 0]));
  }
  {
    // cabeza fría + caja alta azul sobre la parte trasera de la tapa (sube al explosionar)
    const g = makePart(root, 'criorrefrigerador', L1([0, 60, 0], { label: 'equipo' }));
    g.add(mesh(cylY(6.5, 1.0, 40), M.aceroPulido, [XC, HH - 1, ZC]));
    g.add(mesh(cylY(4.2, 11, 40), M.aluminio, [XC, HH + 5, ZC]));
    const cx = (CRIO.x0 + CRIO.x1) / 2, cz = (CRIO.z0 + CRIO.z1) / 2, h = 64;
    g.add(mesh(rbox(CRIO.x1 - CRIO.x0, h, CRIO.z1 - CRIO.z0, 5), navy, [cx, HH + h / 2, cz]));
    g.add(mesh(new THREE.PlaneGeometry(13, 6.5), logoBlanco, [CRIO.x1 + 0.03, HH + h - 11, cz], [0, Math.PI / 2, 0]));
    g.add(mesh(new THREE.PlaneGeometry(13, 6.5), logoBlanco, [cx, HH + h - 11, CRIO.z1 + 0.03]));
    refs.cryoPorts = [];
    for (const x of [-63, -83]) {
      g.add(mesh(cylZ(1.1, 2.5, 20), M.aceroPulido, [x, 205, CRIO.z0 - 1.25]));
      refs.cryoPorts.push([x, 205, CRIO.z0 - 2.6]);
    }
  }
  {
    // compresor de helio en el suelo, junto a la parte trasera del lateral derecho
    const g = makePart(root, 'compresor_helio', L1([0, 0, -80], { label: 'equipo' }));
    const c = M.grisClaro.clone(); c.color.setHex(0xe4e6e8);
    g.add(mesh(rbox(50, 60, 50, 1.2), c, [COMP.x, 31, COMP.z]));
    const vg = c.clone(); vg.map = grilleTexture(20, 10);
    g.add(mesh(new THREE.PlaneGeometry(38, 30), vg, [COMP.x, 30, COMP.z + 25.02]));
    const sc = new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0xffffff, emissiveIntensity: 0.8, emissiveMap: screenTexture([['He', '2,1 MPa'], ['Agua', '18 °C']], { title: 'Compresor' }) });
    g.add(mesh(new THREE.PlaneGeometry(10, 4), sc, [COMP.x + 25.02, 52, COMP.z], [0, Math.PI / 2, 0]));
    g.add(mesh(rbox(1.0, 5, 3.4, 0.3), M.plasticoNegro, [COMP.x + 25.4, 42, COMP.z + 10]));
    refs.compPorts = [];
    for (const x of [COMP.x + 8, COMP.x - 8]) { g.add(mesh(cylY(1.2, 2, 20), M.aceroPulido, [x, 62, COMP.z + 10])); refs.compPorts.push([x, 63.1, COMP.z + 10]); }
  }
  {
    // líneas flexibles de helio: salen del costado de la caja, pasan por encima de la tapa y bajan por fuera del lateral derecho
    const g = makePart(root, 'lineas_helio', L1([0, 0, 0], { info: 'compresor_helio' }));
    const C = 'criorrefrigerador', K = 'compresor_helio';
    const trenza = M.aceroPulido.clone(); trenza.roughness = 0.45; trenza.bumpMap = grilleTexture(60, 4); trenza.bumpScale = 0.3;
    refs.cryoPorts.forEach(([x, y, z], i) => {
      const [xk, yk, zk] = refs.compPorts[i];
      cableFlex(g, [[x, y, z, C], [x, y + 1, z - 8, C], [x - 4, 182, -66, K], [xk, 120, zk + 12, K], [xk, 80, zk, K], [xk, yk, zk, K]], 0.9, trenza, { seg: 90 });
    });
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
    const x = XUHV, yt = ORIGEN.y - AX.BORE_R + 1.6, y0 = ORIGEN.y - 14;
    g.add(mesh(cylY(3, yt - y0, 32), M.aceroPulido, [x, (yt + y0) / 2, 0]));
    g.add(mesh(cylY(4.6, 16, 40), M.aluminio, [x, y0 - 8, 0]));
    g.add(mesh(cylY(4.7, 0.4, 40), M.aceroOscuro, [x, y0 - 5, 0]));
    g.add(mesh(rbox(8, 3, 8, 0.4), M.anodizado, [x, y0 - 17.5, 0]));
    g.add(mesh(cylX(0.6, 1.4, 16), M.aceroPulido, [x - 5.3, y0 - 12, 0]));          // salida hacia atrás (delante está el imán)
    salidas.push([x - 6, y0 - 12, 0]);
  }
  {
    const g = makePart(root, 'camara_vacio', L1([0, 0, 0], { shell: true, label: 'equipo' }));
    const a = wx(AX.F1_0) + 2, b = wx(AX.TR_0) - 2;
    g.add(mesh(rbox(a - b, 10, 10, 0.6), M.aluminio, [(a + b) / 2, ORIGEN.y, 0]));
    // tabiques de bombeo diferencial con orificio (más finos que el hueco entre electrodos: sin caras coplanares)
    for (const lx of [AX.F2_0 - 0.5, AX.Q_0 - 0.5, AX.C_1 + 0.5]) g.add(placaPasos(12, 12, 0.8, [[0, 0, 1.0]], M.aceroPulido, [wx(lx), ORIGEN.y, 0], 'zy', 0.3));
  }
  {
    const g = makePart(root, 'bomba_previa', L1([0, 0, -34], { label: 'equipo' }));
    g.add(mesh(rbox(26, 20, 24, 1), M.grisClaro, [BPV.x, BPV.y, BPV.z]));
    g.add(mesh(cylY(1.2, 3, 20), M.aceroPulido, [BPV.x, BPV.y + 11.5, BPV.z]));
    g.add(mesh(cylX(1.0, 16, 24), M.aceroPulido, [BPV.x, BPV.y + 14.8, BPV.z]));
    for (const x of [-6, -2, 2, 6]) g.add(mesh(cylY(0.75, 2, 16), M.aceroPulido, [BPV.x + x, BPV.y + 16.6, BPV.z]));
  }
  {
    const g = makePart(root, 'lineas_vacio', L1([0, 0, 0], { info: 'bomba_previa' }));
    const Tb = 'bombas_turbo', P = 'bomba_previa', yb = BPV.y + 17.8;
    const fin = (sx) => [[sx, yb + 5, BPV.z, P], [sx, yb, BPV.z, P]];
    // turbos de la consola: bajan bajo la bancada hasta el colector
    [[BPV.x + 6, [[100, 70, 4], [85, 45, -18]]], [BPV.x + 2, [[70, 55, -8]]], [BPV.x - 2, [[50, 52, -16]]]].forEach(([sx, mid], i) => {
      const [x, y, z] = salidas[i];
      cableFlex(g, [[x, y, z, Tb], [x + 2.4, y - 3.5, z + 1.5, Tb], ...mid, ...fin(sx)], 0.5, M.ptfe);
    });
    // turbo UHV: baja tras el imán y corre junto al suelo por el lado derecho, por fuera de las cunas
    const [x, y, z] = salidas[3];
    cableFlex(g, [[x, y, z, Tb], [x - 1.5, y - 4, z - 2, Tb], [x, 60, -44], [x + 35, 12, -46], [20, 14, -46], [40, 30, -40], ...fin(BPV.x - 6)], 0.5, M.ptfe, { seg: 160 });
  }

  /* ---------------- ELECTRÓNICA ---------------- */
  {
    // dos bastidores bajo la bancada, junto al lateral izquierdo
    const g = makePart(root, 'electronica', L1([0, 0, 30], { label: 'equipo' }));
    for (const x of [54, 88]) {
      g.add(mesh(rbox(28, 76, 26, 0.6), M.anodizado, [x, 42, 35]));
      for (let i = 0; i < 12; i++) g.add(mesh(box(24, 0.35, 0.6), M.aluminio, [x, 10 + i * 5.5, 21.7]));
    }
    const w = new THREE.MeshStandardMaterial({ map: warningTexture('ALTA TENSIÓN'), roughness: 0.45 });
    g.add(mesh(new THREE.PlaneGeometry(10, 3.8), w, [88, 76.5, 21.68], [0, Math.PI, 0]));
    // cable de señal al preamplificador: sube del bastidor, corre por el suelo junto al lateral izquierdo y sube al extremo del tubo UHV
    g.add(mesh(cylY(0.5, 1.0, 16), M.aceroPulido, [96, 80.5, 30]));
    const C = 'chasis', Rp = 'preamplificador', yp = ORIGEN.y - 3 - 1.1;
    cableFlex(g, [[96, 81.1, 30], [93, 84, 32], [70, 84, 40], [36, 84, 42], [30, 40, 46, C], [-20, 12, 46, C], [-90, 12, 46, C], [-100, 40, 22, C],
      [XPRE, 96, 2, Rp], [XPRE, yp - 2.4, 0, Rp], [XPRE, yp, 0, Rp]], 0.5, M.cable, { seg: 220 });
  }
  {
    // puesto de control en una mesa aparte, delante del hombro derecho (se aparta por delante del frontal al explosionar)
    const g = makePart(root, 'pc', L1([70, 0, -30], { label: 'equipo' }));
    const x = 205, z = -62, y = 75;
    g.add(mesh(rbox(90, 3, 50, 0.6), M.grisClaro, [x, y - 1.5, z]));
    for (const dx of [-42, 42]) for (const dz of [-21, 21]) g.add(mesh(box(3, y - 3, 3), M.aluminio, [x + dx, (y - 3) / 2, z + dz]));
    g.add(mesh(rbox(20, 44, 44, 1), M.plasticoNegro, [x + 28, 23, z - 1]));                 // PC
    g.add(mesh(rbox(14, 1.2, 12, 0.4), M.carcasaOsc, [x - 6, y + 0.6, z - 12]));
    g.add(mesh(rbox(4, 18, 2.4, 0.6), M.carcasaOsc, [x - 6, y + 10.2, z - 15]));
    g.add(mesh(rbox(60, 36, 2, 0.6), M.plasticoNegro, [x - 6, y + 34, z - 13.4]));
    const c = document.createElement('canvas'); c.width = 1024; c.height = 600;
    const cg = c.getContext('2d'); cg.fillStyle = '#eef1f4'; cg.fillRect(0, 0, 1024, 600);
    cg.fillStyle = '#2b3a4e'; cg.fillRect(0, 0, 1024, 40); cg.fillStyle = '#fff'; cg.font = '600 20px Segoe UI'; cg.fillText('ftmsControl · transitorio y espectro', 16, 27);
    cg.strokeStyle = '#1d63c9'; cg.lineWidth = 1.2; cg.beginPath();
    for (let i = 0; i < 980; i++) { const t = i / 980; const v = Math.sin(i * 0.9) * Math.exp(-t * 2.2) * (0.6 + 0.4 * Math.cos(t * 30)); i ? cg.lineTo(20 + i, 190 - v * 110) : cg.moveTo(20, 190); }
    cg.stroke();
    cg.beginPath(); for (let i = 0; i < 980; i++) { const m = i / 980; let v = 0; for (const [p, a] of [[0.3, 0.1], [0.42, 1], [0.47, 0.06], [0.62, 0.35]]) v += a / (1 + ((m - p) / 0.004) ** 2); i ? cg.lineTo(20 + i, 560 - v * 210) : cg.moveTo(20, 560); }
    cg.stroke();
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    g.add(mesh(new THREE.PlaneGeometry(57, 33.4), new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0xffffff, emissiveIntensity: 0.75, emissiveMap: t }), [x - 6, y + 34, z - 12.38]));
    g.add(mesh(rbox(44, 1.2, 14, 0.4), M.carcasaOsc, [x - 6, y + 0.6, z + 8]));
    g.add(mesh(rbox(6, 1.2, 9, 0.6), M.carcasaOsc, [x + 24, y + 0.6, z + 8]));
  }

  refs.analyzer = buildAnalizador(root);
  refs.analyzer.group.rotation.y = Math.PI;   // fuente hacia el frente real (+X), imán hacia −X

  // todos los cables y mangueras son cableFlex: siguen solos a sus piezas al explosionar
  refs.update = () => {};
  return refs;
}
