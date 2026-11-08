// Equipo completo scimaX, según el render oficial de Bruker y fotografías del equipo real (vistas 3/4 del lateral largo):
// · cuerpo blanco partido por una junta oscura horizontal a media altura: arriba, dos grandes carcasas "almohadilladas" de
//   aristas muy redondeadas (R ≈ 20 cm) que vuelan un poco sobre la parte baja; abajo, puertas planas separadas por juntas;
// · el 45 % derecho de la tapa es azul Bruker en todo el fondo, con rejillas y una línea de luz que sigue la arista y baja por
//   la arista frontal del extremo derecho, azul de suelo a techo;
// · hueco grande de la fuente en la parte alta derecha del lateral: fondo azul oscuro con conexiones, cúpula ESI azul y
//   bandeja de acero que sobresale;
// · caja alta azul del criorrefrigerador sobre el extremo izquierdo; mangueras negras trenzadas que bajan por ese extremo hasta
//   el compresor de helio, en el suelo detrás del equipo; puesto de control en una mesa aparte.
// Coordenadas de mundo en cm. Eje iónico = −X (el extremo azul mira a +X; el lateral rotulado, a +Z).
// Bruker no publica las dimensiones: el cuerpo (≈ 272 × 144 × 172 cm; 240 cm con la caja del criorrefrigerador) sigue las
// proporciones de las fotos, con la óptica de transferencia acortada para que el analizador quepa.
import * as THREE from 'three';
import { M } from '../../materials.js';
import { mesh, rbox, box, cylX, cylY, cylZ, tubeX, tubePath, placaPasos, grilleTexture, screenTexture, plateTexture, warningTexture } from '../../geom.js';
import { makePart, cableFlex } from '../../parts.js';
import { buildAnalizador } from './analizador.js';
import { ORIGEN, AX } from './geometria.js';

const L1 = (offset, extra = {}) => ({ level: 1, offset, mode: 'equipo', ...extra });
const T = 1.2;
/** Parte baja (puertas): x ∈ [XB, …], |z| ≤ ZL, esquinas verticales de radio RL. Junta oscura entre YJ0 y YJ1. */
const XB = -134, ZL = 70, RL = 13, YJ0 = 82, YJ1 = 87;
/** Parte alta (carcasas): |z| ≤ ZU, desde XU; aristas de radio RU (centros en ±ZC1, YA); tapa a HH. Extremo derecho en XF. */
const XU = -136, ZU = 72, RU = 20, ZC1 = ZU - RU, HH = 172, YA = HH - RU, XF = 136, XC0 = XU + RU, XC9 = XF - RU;
/** Junta entre las dos carcasas blancas; tramo azul (tapa) desde XA0; hueco de la fuente entre XA0 y XA1; columna azul desde XA1. */
const XSEAM = -62, XA0 = 14.5, XA1 = 108, ZFONDO = 42;
/** Tramo azul: aristas de radio RN (borde delgado sobre el hueco), centros en ±ZN y YN; esquina frontal en XN. */
const RN = 12, ZN = ZU - RN, YN = HH - RN, XN = XF - RN;
/** El tramo azul baja hacia el extremo derecho: pendiente K desde XA0 (en el extremo, ≈ 82 % de la altura de las carcasas blancas). */
const K = 0.255;
const yTop = (x) => HH - Math.max(0, x - XA0) * K;      // cara superior del tramo azul
const yE = (x) => yTop(x) - RN;                        // arranque de su arista redondeada (remate de las paredes)
/** Recorta en pendiente la cara superior de una pieza vertical: los vértices más altos pasan a yE(x). */
function aPendiente(m, dy = 0) {
  m.updateMatrix(); const g = m.geometry.clone(); g.applyMatrix4(m.matrix);
  const p = g.attributes.position; let ymax = -Infinity;
  for (let i = 0; i < p.count; i++) ymax = Math.max(ymax, p.getY(i));
  for (let i = 0; i < p.count; i++) if (p.getY(i) > ymax - 0.01) p.setY(i, yE(p.getX(i)) - dy);
  p.needsUpdate = true; g.computeBoundingBox(); g.computeBoundingSphere();
  m.geometry = g; m.position.set(0, 0, 0); m.rotation.set(0, 0, 0); return m;
}
/** Grupo con cizalla vertical: lo que se construye a la altura HH queda sobre la pendiente (las verticales siguen verticales). */
function cuna(parent) {
  const s = new THREE.Group(); s.matrixAutoUpdate = false;
  s.matrix.set(1, 0, 0, 0, -K, 1, 0, K * XA0, 0, 0, 1, 0, 0, 0, 0, 1); s.matrixWorldNeedsUpdate = true;
  parent.add(s); return s;
}
const ZA = ORIGEN.z;
/** Analizador girado 180°: x local → −x mundo, z local → −z. */
const wx = (x) => ORIGEN.x - x;
const MX = wx(AX.MAG_C), MR = AX.MAG_R, ML = AX.MAG_L;
/** Turbos de la consola (la tercera cuelga del tubo UHV, delante del imán) y turbo UHV tras el imán. */
const TURBOS = [AX.F1_0 + 4, AX.Q_0 + 6, AX.TR_0 + 8].map(wx);
const XUHV = MX - ML / 2 - 6;
const XPRE = wx(AX.UHV_END + 1.5 + 3.6);
/** Bancada óptica y paso de la fibra del láser [x, z, r]. */
const BANCO = { x0: 25, x1: 111, z: 16, y: ORIGEN.y - 20 };
const PASO_FIBRA = [97, ZA - 4, 0.6];
/** Criorrefrigerador (cabeza fría en XC, ZC) y compresor de helio. */
const CRIO = { x0: -122, x1: -68, z0: 3, z1: 47, h: 68 }, XC = -95, ZC = ZA;
const COMP = { x0: 60, x1: 135, z0: -125, z1: -80, h: 60 };
const BPV = { x: 33, y: 14, z: -5 };

/* ---------- utilidades de forma ---------- */
/** Extruye una forma. 'xy': espesor en z · 'zy': u = z, v = y, espesor en x · 'xz': u = x, v = −z, espesor en y. */
function placa(shape, t, mat, pos, plano = 'xy') {
  const g = new THREE.ExtrudeGeometry(shape, { depth: t, bevelEnabled: false, curveSegments: 24 });
  g.translate(0, 0, -t / 2);
  const rot = plano === 'zy' ? [0, -Math.PI / 2, 0] : plano === 'xz' ? [-Math.PI / 2, 0, 0] : [0, 0, 0];
  return mesh(g, mat, pos, rot);
}
/** Cáscara de cuarto de cilindro: arco de radio r (exterior) y r − T entre los ángulos a0 y a1, centrado en (cu, cv). */
function arco(cu, cv, r, a0, a1) {
  const s = new THREE.Shape();
  s.moveTo(cu + r * Math.cos(a0), cv + r * Math.sin(a0)); s.absarc(cu, cv, r, a0, a1, a1 < a0);
  s.lineTo(cu + (r - T) * Math.cos(a1), cv + (r - T) * Math.sin(a1)); s.absarc(cu, cv, r - T, a1, a0, a1 > a0);
  s.lineTo(cu + r * Math.cos(a0), cv + r * Math.sin(a0));
  return s;
}
/** Franja de pared (plano xz, extruida en altura) que sigue un tramo recto, una esquina redondeada y otro tramo recto. */
function franja(p0, c, r, a0, a1, p1) {
  const s = new THREE.Shape(), q = (a, rr) => [c[0] + rr * Math.cos(a), c[1] + rr * Math.sin(a)];
  s.moveTo(...p0); s.lineTo(...q(a0, r)); s.absarc(c[0], c[1], r, a0, a1, a1 < a0); s.lineTo(...p1);
  // vuelta por el interior (desplazada T hacia el centro de la esquina)
  const off = (p, a) => [p[0] - T * Math.cos(a), p[1] - T * Math.sin(a)];
  s.lineTo(...off(p1, a1)); s.lineTo(...q(a1, r - T)); s.absarc(c[0], c[1], r - T, a1, a0, a1 > a0); s.lineTo(...off(p0, a0)); s.lineTo(...p0);
  return s;
}
/** Octante de esfera (esquina superior redondeada): sx, sz = signos de la esquina. */
function octante(mat, c, sx, sz, r = RU) {
  const phi = sx < 0 ? (sz > 0 ? 0 : -Math.PI / 2) : (sz > 0 ? Math.PI / 2 : Math.PI);
  return mesh(new THREE.SphereGeometry(r - T / 2, 40, 14, phi, Math.PI / 2, 0, Math.PI / 2), mat, c);
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
/** Rótulo "scimaX" (blanco con contorno y sombra grises suaves; la X mayor e inclinada). */
function rotuloScimax() {
  return lienzo(1024, 320, (g) => {
    const txt = (f) => { g.font = '600 190px Segoe UI, Arial'; f('scima', 20, 230); const w = g.measureText('scima').width; g.font = 'italic 700 280px Segoe UI, Arial'; f('X', 20 + w + 6, 254); };
    g.textBaseline = 'alphabetic'; g.shadowColor = 'rgba(30,45,70,0.55)'; g.shadowBlur = 14; g.shadowOffsetX = 4; g.shadowOffsetY = 6;
    g.strokeStyle = '#9aa4b2'; g.lineWidth = 6; txt((s, x, y) => g.strokeText(s, x, y));
    g.shadowColor = 'transparent'; g.fillStyle = '#ffffff'; txt((s, x, y) => g.fillText(s, x, y));
  });
}

export function buildEquipo(root) {
  const refs = {};
  const navy = M.azulBruker.clone(); navy.color.setHex(0x253b5c); navy.roughness = 0.42; navy.clearcoat = 0.35;
  const navyD = navy.clone(); navyD.side = THREE.DoubleSide;
  const navyHueco = navy.clone(); navyHueco.color.setHex(0x172640);
  const gris = M.grisClaro.clone(); gris.color.setHex(0xe1e4e7); gris.metalness = 0.06; gris.roughness = 0.4; gris.clearcoat = 0.4;
  const grisD = gris.clone(); grisD.side = THREE.DoubleSide;
  const grisPuerta = gris.clone(); grisPuerta.color.setHex(0xd9dce0);
  const oscuro = M.carcasaOsc.clone(); oscuro.color.setHex(0x22262d);
  const led = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xdcefff, emissiveIntensity: 1.6, roughness: 0.3 });
  const rejilla = navy.clone(); rejilla.map = grilleTexture(30, 3); rejilla.color.setHex(0x7d899c);
  const logoBlanco = rotulo(logoBruker('#e9eef5'));
  const vuelo = ZU - T / 2, bajo = ZL - T / 2;

  /* ---------------- BASTIDOR ---------------- */
  {
    const g = makePart(root, 'chasis', L1([0, 0, 0]));
    // patas negras pequeñas (sin zócalo visible)
    for (const x of [XB + RL, 0, XF - RU]) for (const z of [-ZL + RL, ZL - RL]) g.add(mesh(cylY(3, 4, 24), M.plasticoNegro, [x, 2, z]));
    for (const [x, z, h] of [[-118, -50, 146], [-118, 50, 146], [120, -60, 118]]) g.add(mesh(box(3, h, 3), M.aluminio, [x, 4.1 + h / 2, z]));
    // fondo oscuro de la junta horizontal (se ve entre las puertas y las carcasas altas)
    g.add(mesh(box(XA0 - XB - RL, YJ1 - YJ0 + 2, T), oscuro, [(XB + RL + XA0) / 2, (YJ0 + YJ1) / 2, ZL - 2.8]));
    g.add(mesh(box(XA1 - XB - RL, YJ1 - YJ0 + 2, T), oscuro, [(XB + RL + XA1) / 2, (YJ0 + YJ1) / 2, -ZL + 2.8]));
    g.add(mesh(box(T, YJ1 - YJ0 + 2, 2 * (ZL - RL)), oscuro, [XB + 2.8, (YJ0 + YJ1) / 2, 0]));
    // bancada óptica: aberturas para las turbos que la atraviesan y paso de la fibra del láser; cuatro columnas
    const xc = (BANCO.x0 + BANCO.x1) / 2;
    const huecos = [...TURBOS.filter((x) => x > BANCO.x0 + 6 && x < BANCO.x1 - 6).map((x) => [x - xc, 0, 5.2]), [PASO_FIBRA[0] - xc, PASO_FIBRA[1] - ZA, PASO_FIBRA[2]]];
    g.add(placaPasos(BANCO.x1 - BANCO.x0, 2 * BANCO.z, 2, huecos, M.aluminio, [xc, BANCO.y, ZA], 'xz', 0.3));
    g.add(mesh(tubeX(0.9, 0.6, 0.6, 20), M.goma, [PASO_FIBRA[0], BANCO.y + 1.2, PASO_FIBRA[1]], [0, 0, Math.PI / 2]));
    for (const x of [37, 109]) for (const z of [-12, 12]) g.add(mesh(box(3, BANCO.y - 1 - 4.1, 3), M.aluminio, [x, (4.1 + BANCO.y - 1) / 2, ZA + z]));
  }
  {
    // cunas del imán (no se mueven: el imán tampoco, el tubo UHV pasa por su interior)
    const g = makePart(root, 'soporte_iman', L1([0, 0, 0], { info: 'iman' }));
    const yb = ORIGEN.y - MR;
    for (const x of [MX - 40, MX + 40]) {
      g.add(mesh(rbox(12, yb + 1.5 - 5.2, 56, 0.6), M.carcasaOsc, [x, (5.2 + yb + 1.5) / 2, ZA]));
      g.add(mesh(rbox(16, 1.2, 64, 0.4), M.aceroOscuro, [x, 4.6, ZA]));
    }
  }

  /* ---------------- CARCASA ---------------- */
  {
    // extremo derecho azul (de suelo a techo, esquina de gran radio) y hueco de la fuente: fondo, costado, techo y bandeja de acero
    const g = makePart(root, 'panel_frontal', L1([40, 0, 70], { shell: true, label: 'equipo' }));
    // franja: frente (+x) desde z = −19.8 hasta la esquina y lateral (+z) hasta el hueco de la fuente; en plano xz v = −z
    g.add(aPendiente(placa(franja([XF, 19.8], [XN, -ZN], RN, 0, -Math.PI / 2, [XA1, -ZU]), YN - 4, navy, [0, (4 + YN) / 2, 0], 'xz')));
    // hueco: fondo, costado y techo siguen la pendiente del borde azul
    const xc = (XA0 + XA1) / 2, zh = (ZFONDO + ZU - T - 0.2) / 2, dz = ZU - T - ZFONDO - 0.2, xr = XA1 + 0.7;
    const fondo = new THREE.Shape(); [[XA0, YJ1], [XA1, YJ1], [XA1, yE(XA1) - 1.3], [XA0, yE(XA0) - 1.3]].forEach(([u, v], i) => (i ? fondo.lineTo(u, v) : fondo.moveTo(u, v)));
    g.add(placa(fondo, T, navyHueco, [0, 0, ZFONDO - T / 2]));
    g.add(mesh(box(T, yE(xr) - 1.3 - YJ1, dz), navyHueco, [xr, (YJ1 + yE(xr) - 1.3) / 2, zh]));
    const ang = Math.atan(K), lt = (XA1 - XA0 - 0.2) / Math.cos(ang);
    g.add(mesh(box(lt, T, dz), navyHueco, [xc, yE(xc) - T / 2 - 0.1, zh], [0, 0, -ang]));
    // panel de conexiones del fondo
    const pl = lienzo(512, 256, (c) => { c.fillStyle = '#e9edf1'; c.fillRect(0, 0, 512, 256); c.fillStyle = '#22385a'; c.font = '600 34px Segoe UI'; c.fillText('Dual ESI / MALDI', 24, 52);
      c.font = '24px Segoe UI'; ['HV', 'Gas', 'Nebulizer', 'Dry gas'].forEach((s, i) => { c.fillText(s, 24 + i * 120, 220); }); });
    g.add(mesh(new THREE.PlaneGeometry(22, 11), new THREE.MeshStandardMaterial({ map: pl, roughness: 0.5 }), [XA0 + 16, YN - 18, ZFONDO + 0.02]));
    refs.conectores = [];
    for (let i = 0; i < 4; i++) { const p = [XA0 + 9.5 + i * 4.8, YN - 19.5, ZFONDO + 0.6]; g.add(mesh(cylZ(0.9, 1.2, 16), M.aceroPulido, p)); refs.conectores.push(p); }
    // bandeja de acero inoxidable que sobresale del lateral, con reborde
    const zt0 = ZFONDO, zt1 = ZU + 13;
    g.add(mesh(rbox(XA1 - XA0 - 1, 2, zt1 - zt0, 0.4), M.aceroPulido, [xc, YJ1 - 1, (zt0 + zt1) / 2]));
    g.add(mesh(rbox(XA1 - XA0 - 1, 3.2, 1, 0.4), M.aceroPulido, [xc, YJ1 + 0.6, zt1 - 0.6]));
    for (const x of [XA0 + 1.2, XA1 - 1.2]) g.add(mesh(rbox(1, 3.2, zt1 - zt0 - 1, 0.4), M.aceroPulido, [x, YJ1 + 0.6, (zt0 + zt1 - 1) / 2]));
    // línea de luz que baja por la arista frontal y logotipo
    g.add(mesh(rbox(0.3, yE(XF) - 24, 1.0, 0.12), led, [XF + 0.15, (24 + yE(XF)) / 2, ZN - 2]));
    g.add(mesh(new THREE.PlaneGeometry(10, 5), logoBlanco, [XF + 0.03, 26, 16], [0, Math.PI / 2, 0]));
  }
  {
    // tapa: carcasas altas (arista de gran radio a cada lado) en blanco a la izquierda y en azul en el 45 % derecho
    const g = makePart(root, 'tapa_superior', L1([0, 40, 0], { info: 'carcasa', shell: true }));
    const cu = cuna(g);
    const tramos = [[XC0, XA0 - 0.3, gris, ZC1, YA, RU], [XA0 + 0.3, XN, navy, ZN, YN, RN]];
    tramos.forEach(([a, b, mt, zc, yc, r], i) => {
      const s = new THREE.Shape(); s.moveTo(a, zc); s.lineTo(b, zc); s.lineTo(b, -zc); s.lineTo(a, -zc); s.lineTo(a, zc);
      if (i === 0) { const h = new THREE.Path(); h.absarc(XC, -ZC, 7.5, 0, Math.PI * 2, true); s.holes.push(h); }
      const q = i ? cu : g;                      // el tramo azul se construye a nivel y se inclina con la cizalla
      q.add(placa(s, T, mt, [0, HH - T / 2, 0], 'xz'));
      q.add(placa(arco(zc, yc, r, 0, Math.PI / 2), b - a, mt, [(a + b) / 2, 0, 0], 'zy'));
      q.add(placa(arco(-zc, yc, r, Math.PI / 2, Math.PI), b - a, mt, [(a + b) / 2, 0, 0], 'zy'));
    });
    // remate frontal del tramo azul y esquinas (borde delgado, radio RN)
    cu.add(placa(arco(XN, YN, RN, 0, Math.PI / 2), 2 * ZN, navy, [0, 0, 0]));
    cu.add(octante(navyD, [XN, YN, ZN], 1, 1, RN));
    cu.add(octante(navyD, [XN, YN, -ZN], 1, -1, RN));
    // rejillas oscuras y línea de luz a lo largo de la arista inclinada, que dobla por la esquina frontal
    for (const x of [35, 72]) for (const z of [-20, 20]) cu.add(mesh(new THREE.PlaneGeometry(26, 9), rejilla, [x, HH + 0.02, z], [-Math.PI / 2, 0, 0]));
    cu.add(mesh(rbox(XN - XA0 - 2, 0.3, 1.0, 0.12), led, [(XA0 + XN) / 2 + 1, HH + 0.15, ZN - 2]));
    cu.add(mesh(new THREE.TorusGeometry(RN + 0.15, 0.4, 8, 32, Math.PI / 2), led, [XN, YN, ZN - 2]));
  }
  {
    // lateral izquierdo (+z): puertas bajas separadas por juntas, paredes de las dos carcasas altas (vuelan 2 cm) y pared izquierda del hueco
    const g = makePart(root, 'panel_izq', L1([0, 0, 70], { info: 'carcasa', shell: true }));
    const puertas = [[XB + RL, XSEAM - 0.3], [XSEAM + 0.3, XA0 - 0.3], [XA0 + 0.3, XA1 - 0.2]];
    for (const [a, b] of puertas) g.add(mesh(rbox(b - a, YJ0 - 4, T, 0.4), grisPuerta, [(a + b) / 2, (4 + YJ0) / 2, bajo]));
    for (const [a, b] of [[XC0, XSEAM - 0.3], [XSEAM + 0.3, XA0 - 0.3]]) g.add(mesh(box(b - a, YA - YJ1, T), gris, [(a + b) / 2, (YJ1 + YA) / 2, vuelo]));
    {
      // pared izquierda del hueco: tapa también el final de la arista blanca (radio RU) frente a la azul (radio RN)
      const s = new THREE.Shape(); s.moveTo(ZFONDO, YJ1); s.lineTo(ZU - T, YJ1); s.lineTo(ZU - T, YA); s.absarc(ZC1, YA, RU - T, 0, Math.PI / 2, false); s.lineTo(ZFONDO, HH - T); s.lineTo(ZFONDO, YJ1);
      g.add(placa(s, T, gris, [XA0 - 1.0, 0, 0], 'zy'));
    }
    const zt = ZU + 0.02, zb = ZL + 0.02;
    // rótulos
    g.add(mesh(new THREE.PlaneGeometry(64, 20), rotulo(rotuloScimax()), [-26, 124, zt + 0.06]));
    const sub = lienzo(1024, 96, (c) => { c.fillStyle = '#3c4656'; c.font = 'italic 500 54px Segoe UI, Arial'; c.textBaseline = 'middle'; c.fillText('maxwell  MRMS technology inside', 8, 50); });
    g.add(mesh(new THREE.PlaneGeometry(34, 3.2), rotulo(sub), [-24, YJ0 - 7, zb]));
    // puerta izquierda: tirador empotrado y pulsador de emergencia
    g.add(mesh(rbox(7, 7, 0.4, 0.15), oscuro, [-92, 44, ZL + 0.2]));
    g.add(mesh(rbox(5, 7, 0.8, 0.3), M.peekRojo, [-116, 64, ZL + 0.4]));
    // puerta central: rejilla vertical estrecha y rejilla cuadrada pequeña
    const vg = grisPuerta.clone(); vg.map = grilleTexture(4, 30);
    g.add(mesh(new THREE.PlaneGeometry(6, 42), vg, [4, 40, zb]));
    const vq = grisPuerta.clone(); vq.map = grilleTexture(10, 10);
    g.add(mesh(new THREE.PlaneGeometry(12, 12), vq, [-44, 16, zb]));
    // panel bajo el hueco: tornillo
    g.add(mesh(cylZ(0.6, 0.4, 16), M.aceroPulido, [55, YJ0 - 4, ZL + 0.2]));
  }
  {
    // lateral derecho (−z): parte baja, paredes altas (blanca y azul) y hombro gris del extremo con la puerta de la diana MALDI
    const g = makePart(root, 'panel_der', L1([0, 0, -70], { info: 'carcasa', shell: true }));
    g.add(mesh(rbox(XA1 - 0.2 - XB - RL, YJ0 - 4, T, 0.4), grisPuerta, [(XB + RL + XA1 - 0.2) / 2, (4 + YJ0) / 2, -bajo]));
    g.add(mesh(box(XA0 - 0.3 - XC0, YA - YJ1, T), gris, [(XC0 + XA0 - 0.3) / 2, (YJ1 + YA) / 2, -vuelo]));
    { const s = new THREE.Shape(), a = XA0 + 0.3, b = XA1 - 0.3; [[a, YJ1], [b, YJ1], [b, yE(b)], [a, yE(a)]].forEach(([u, v], i) => (i ? s.lineTo(u, v) : s.moveTo(u, v))); g.add(placa(s, T, navy, [0, 0, -vuelo])); }
    g.add(aPendiente(placa(franja([XA1, ZU], [XN, ZN], RN, Math.PI / 2, 0, [XF, 20.2]), YN - 4, gris, [0, (4 + YN) / 2, 0], 'xz')));
    g.add(mesh(rbox(0.8, 24, 22, 0.4), gris, [XF + 0.4, 106, -36]));
    g.add(mesh(rbox(1.4, 6, 1.6, 0.6), M.aceroPulido, [XF + 1.5, 106, -27]));
    g.add(mesh(cylX(0.6, 0.5, 16), M.ledVerde, [XF + 0.25, 123, -44]));
  }
  {
    // extremo izquierdo: parte baja con esquinas de radio RL y parte alta con esquinas y arista de radio RU
    const g = makePart(root, 'panel_trasero', L1([-40, 0, 0], { info: 'carcasa', shell: true }));
    const zl = ZL - RL, yl = (4 + YJ0) / 2;
    g.add(mesh(box(T, YJ0 - 4, 2 * zl), gris, [XB + T / 2, yl, 0]));
    g.add(placa(arco(XB + RL, -zl, RL, Math.PI, 1.5 * Math.PI), YJ0 - 4, gris, [0, yl, 0], 'xz'));
    g.add(placa(arco(XB + RL, zl, RL, Math.PI / 2, Math.PI), YJ0 - 4, gris, [0, yl, 0], 'xz'));
    const yu = (YJ1 + YA) / 2;
    g.add(mesh(box(T, YA - YJ1, 2 * ZC1), gris, [XU + T / 2, yu, 0]));
    g.add(placa(arco(XC0, -ZC1, RU, Math.PI, 1.5 * Math.PI), YA - YJ1, gris, [0, yu, 0], 'xz'));
    g.add(placa(arco(XC0, ZC1, RU, Math.PI / 2, Math.PI), YA - YJ1, gris, [0, yu, 0], 'xz'));
    g.add(placa(arco(XC0, YA, RU, Math.PI / 2, Math.PI), 2 * ZC1, gris, [0, 0, 0]));
    g.add(octante(grisD, [XC0, YA, ZC1], -1, 1));
    g.add(octante(grisD, [XC0, YA, -ZC1], -1, -1));
    const plate = new THREE.MeshStandardMaterial({ map: plateTexture(['scimaX MRMS · 7 T', '230 V~ 50/60 Hz', 'Modelo didáctico', 'Explorador 3D']), metalness: 0.6, roughness: 0.4 });
    g.add(mesh(new THREE.PlaneGeometry(9, 4.5), plate, [XB - 0.03, 60, -20], [0, -Math.PI / 2, 0]));
    const vg = gris.clone(); vg.map = grilleTexture(24, 8);
    g.add(mesh(new THREE.PlaneGeometry(50, 20), vg, [XB - 0.03, 30, 6], [0, -Math.PI / 2, 0]));
    g.add(mesh(rbox(1.2, 3, 4, 0.3), M.plasticoNegro, [XB - 0.6, 16, 40]));
    g.add(mesh(tubePath([[XB - 1.2, 16, 40], [XB - 5, 16, 40], [XB - 10, 10, 42], [XB - 17, 0.7, 45], [XB - 35, 0.7, 54]], 0.45, 40, 10), M.cable));
  }
  {
    // cúpula azul de la fuente ESI en el fondo del hueco (al explosionar acompaña al extremo azul y sale del hueco)
    const g = makePart(root, 'carcasa_fuente', L1([40, 0, 85], { shell: true, label: 'equipo' }));
    const c = new THREE.Vector3(88, ORIGEN.y, ZFONDO), r = 12.5;
    const dome = new THREE.SphereGeometry(r, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2); dome.rotateX(Math.PI / 2);
    const mt = navy.clone(); mt.color.setHex(0x2c4a7c); mt.side = THREE.DoubleSide;
    g.add(mesh(dome, mt, [c.x, c.y, c.z]));
    g.add(mesh(new THREE.TorusGeometry(r - 0.2, 0.5, 12, 64), M.aceroOscuro, [c.x, c.y, c.z + 0.5]));
    g.add(mesh(cylZ(3, 1.0, 32), M.negroBrillante, [c.x, c.y, c.z + r - 0.2]));                    // mirilla
    const neb = [c.x - 8, c.y + 2.5, c.z + 9.2];
    g.add(mesh(cylZ(2.0, 3.0, 24), M.acero, neb, [0, -0.6, 0]));                                     // entrada del nebulizador
    const w = new THREE.MeshStandardMaterial({ map: warningTexture('ALTA TENSIÓN'), roughness: 0.45, side: THREE.DoubleSide });
    g.add(mesh(new THREE.PlaneGeometry(5.6, 2.1), w, [c.x + 3.5, c.y + 8, c.z + 9.05], [-0.75, 0.25, 0]));
    // soporte de la jeringa
    g.add(mesh(rbox(2.6, 24, 2.6, 0.4), M.plasticoNegro, [XA1 - 2, 120, ZFONDO + 1.3]));
    g.add(mesh(cylY(0.8, 12, 20), M.vidrio, [XA1 - 2, 124, ZFONDO + 3.4]));
    // líneas PEEK rojas: nebulizador → conexiones del fondo
    const [x1, y1, z1] = refs.conectores[2], [x2, y2, z2] = refs.conectores[3];
    cableFlex(g, [[neb[0] - 1.2, neb[1] + 0.6, neb[2] + 1.6], [neb[0] - 6, neb[1] + 6, neb[2] + 4], [x1 + 2, y1 - 2, z1 + 8], [x1, y1, z1 + 0.65, 'panel_frontal']], 0.18, M.peekRojo);
    cableFlex(g, [[XA1 - 2, 132.4, ZFONDO + 1.3], [XA1 - 5, 134, ZFONDO + 6], [x2 + 2, y2 + 1, z2 + 6], [x2, y2, z2 + 0.65, 'panel_frontal']], 0.18, M.peekRojo);
  }
  {
    const g = makePart(root, 'laser_maldi', L1([0, -40, 0], { label: 'equipo' }));
    const lx = 96, ly = 88, lz = ZA - 12;
    g.add(mesh(rbox(18, 12, 16, 0.6), M.anodizado, [lx, ly, lz]));
    const lw = new THREE.MeshStandardMaterial({ map: warningTexture('RADIACIÓN LÁSER'), roughness: 0.45 });
    g.add(mesh(new THREE.PlaneGeometry(9, 3.4), lw, [lx, ly, lz - 8.05], [0, Math.PI, 0]));
    // fibra óptica: salida superior del láser → paso de la bancada → entrada del láser en la fuente
    const [fx, fz] = PASO_FIBRA, F = 'fuente_dual', yb = BANCO.y;
    g.add(mesh(cylY(0.6, 1.2, 16), M.aceroPulido, [lx, ly + 6.6, lz]));
    cableFlex(g, [[lx, ly + 7.2, lz], [lx + 0.5, ly + 9, lz + 5], [fx, yb - 1.6, fz, 'chasis'], [fx, yb + 1.6, fz, 'chasis'], [fx - 0.2, yb + 5, ZA - 3.5, F], [wx(2.5), ORIGEN.y - 12.1, ZA - 3, F]], 0.25, M.cable);
  }

  /* ---------------- IMÁN SUPERCONDUCTOR (dentro del cuerpo) ---------------- */
  {
    const g = makePart(root, 'iman', L1([0, 0, 0], { shell: true, label: 'equipo' }));
    const L = ML, Rm = MR, Rb = AX.BORE_R;
    const prof = [[Rb, -L / 2], [Rm - 4, -L / 2], [Rm, -L / 2 + 4], [Rm, L / 2 - 4], [Rm - 4, L / 2], [Rb, L / 2], [Rb, -L / 2]];
    const geo = new THREE.LatheGeometry(prof.map(([rr, x]) => new THREE.Vector2(rr, x)), 96); geo.rotateZ(-Math.PI / 2);
    g.add(mesh(geo, M.acero, [MX, ORIGEN.y, ZA]));
    for (const s of [-1, 1]) g.add(mesh(new THREE.TorusGeometry(Rm + 0.3, 0.9, 12, 96), M.aceroPulido, [MX + s * (L / 2 - 8), ORIGEN.y, ZA], [0, Math.PI / 2, 0]));
    // torreta de la cabeza fría
    g.add(mesh(cylY(8, HH - 2.6 - 152, 48), M.acero, [XC, (HH - 2.6 + 152) / 2, ZC]));
    g.add(mesh(cylY(9, 1.2, 48), M.aceroPulido, [XC, HH - 2.1, ZC]));
    const lab = new THREE.MeshStandardMaterial({ map: lienzo(256, 96, (c) => { c.fillStyle = '#22385a'; c.fillRect(0, 0, 256, 96); c.fillStyle = '#fff'; c.font = '600 52px Segoe UI'; c.textBaseline = 'middle'; c.fillText('7 T · cc', 30, 50); }) });
    g.add(mesh(new THREE.PlaneGeometry(10, 3.75), lab, [MX + 20, ORIGEN.y, ZA + Rm + 0.3]));
    const w = new THREE.MeshStandardMaterial({ map: warningTexture('CAMPO MAGNÉTICO INTENSO'), roughness: 0.45 });
    g.add(mesh(new THREE.PlaneGeometry(13, 4.8), w, [MX - 20, ORIGEN.y + 10, ZA + Rm - 1.0], [-0.26, 0, 0]));
  }
  {
    // cabeza fría + caja alta azul sobre el extremo izquierdo de la tapa (sube al explosionar)
    const g = makePart(root, 'criorrefrigerador', L1([0, 60, 0], { label: 'equipo' }));
    g.add(mesh(cylY(6.5, 1.0, 40), M.aceroPulido, [XC, HH - 1, ZC]));
    g.add(mesh(cylY(4.2, 11, 40), M.aluminio, [XC, HH + 5, ZC]));
    const cx = (CRIO.x0 + CRIO.x1) / 2, cz = (CRIO.z0 + CRIO.z1) / 2;
    g.add(mesh(rbox(CRIO.x1 - CRIO.x0, CRIO.h, CRIO.z1 - CRIO.z0, 7), navy, [cx, HH + CRIO.h / 2, cz]));
    g.add(mesh(new THREE.PlaneGeometry(18, 9), logoBlanco, [cx, HH + CRIO.h - 12, CRIO.z1 + 0.03]));
    g.add(mesh(new THREE.PlaneGeometry(14, 7), logoBlanco, [CRIO.x1 + 0.03, HH + CRIO.h - 12, cz], [0, Math.PI / 2, 0]));
    refs.cryoPorts = [];
    for (const [y, z] of [[HH + 44, cz - 6], [HH + 36, cz + 6]]) {
      g.add(mesh(cylX(1.6, 2.5, 20), M.aceroPulido, [CRIO.x0 - 1.25, y, z]));
      refs.cryoPorts.push([CRIO.x0 - 2.6, y, z]);
    }
  }
  {
    // compresor de helio: caja blanca con gran rejilla frontal, en el suelo detrás del equipo
    const g = makePart(root, 'compresor_helio', L1([0, 0, -80], { label: 'equipo' }));
    const c = M.grisClaro.clone(); c.color.setHex(0xeceef0);
    const cx = (COMP.x0 + COMP.x1) / 2, cz = (COMP.z0 + COMP.z1) / 2;
    g.add(mesh(rbox(COMP.x1 - COMP.x0, COMP.h, COMP.z1 - COMP.z0, 1.5), c, [cx, 1 + COMP.h / 2, cz]));
    for (const x of [COMP.x0 + 6, COMP.x1 - 6]) for (const z of [COMP.z0 + 6, COMP.z1 - 6]) g.add(mesh(cylY(2, 1, 16), M.plasticoNegro, [x, 0.5, z]));
    const vg = c.clone(); vg.map = grilleTexture(26, 12);
    g.add(mesh(new THREE.PlaneGeometry(60, 38), vg, [cx, 30, COMP.z1 + 0.02]));
    const sc = new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0xffffff, emissiveIntensity: 0.8, emissiveMap: screenTexture([['He', '2,1 MPa'], ['Agua', '18 °C']], { title: 'Compresor' }) });
    g.add(mesh(new THREE.PlaneGeometry(10, 4), sc, [COMP.x1 + 0.02, 50, cz], [0, Math.PI / 2, 0]));
    refs.compPorts = [];
    for (const z of [cz + 8, cz - 8]) { g.add(mesh(cylX(1.6, 2.5, 20), M.aceroPulido, [COMP.x0 - 1.25, 40, z])); refs.compPorts.push([COMP.x0 - 2.6, 40, z]); }
  }
  {
    // mangueras negras trenzadas: salen de la caja hacia la izquierda, bajan por el extremo izquierdo y van por el suelo al compresor
    const g = makePart(root, 'lineas_helio', L1([0, 0, 0], { info: 'compresor_helio' }));
    const C = 'criorrefrigerador', P = 'panel_trasero', K = 'compresor_helio';
    const trenza = M.cable.clone(); trenza.color.setHex(0x16181b); trenza.roughness = 0.6; trenza.bumpMap = grilleTexture(80, 6); trenza.bumpScale = 0.4;
    refs.cryoPorts.forEach(([x, y, z], i) => {
      const [xk, yk, zk] = refs.compPorts[i], d = i * 4;
      cableFlex(g, [[x, y, z, C], [x - 7, y + 2, z, C], [XU - 9 - d, y - 22, z, P], [XU - 9 - d, 90, z - 10, P], [XU - 8 - d, 2.0, z - 30, P], [XU - 6 - d, 2.0, -ZU - 10 - d, P],
        [-100, 2.0, -ZU - 16 - d, K], [COMP.x0 - 30, 2.0, zk + 2, K], [xk - 8, 22, zk, K], [xk, yk, zk, K]], 1.4, trenza, { seg: 160, radial: 12 });
    });
  }

  /* ---------------- VACÍO ---------------- */
  const salidas = [];
  {
    const g = makePart(root, 'bombas_turbo', L1([0, -18, 0], { label: 'equipo' }));
    TURBOS.forEach((x, i) => {
      // cuelgan de la cámara (o del tubo UHV) y atraviesan la bancada por su abertura
      const y = ORIGEN.y - 8, top = i === 2 ? ORIGEN.y - AX.BORE_R + 1.6 : ORIGEN.y - 4.8;
      g.add(mesh(cylY(2.2, top - (y - 6), 32), M.aceroPulido, [x, (top + y - 6) / 2, ZA]));
      g.add(mesh(cylY(4.2, 12, 40), M.aluminio, [x, y - 12, ZA]));
      g.add(mesh(cylY(4.3, 0.4, 40), M.aceroOscuro, [x, y - 9, ZA]));
      g.add(mesh(rbox(7, 3, 7, 0.4), M.anodizado, [x, y - 19.5, ZA]));
      g.add(mesh(cylX(0.6, 1.4, 16), M.aceroPulido, [x + 4.9, y - 16, ZA]));            // salida de vacío previo
      salidas.push([x + 5.6, y - 16, ZA]);
    });
    // turbo UHV: cuelga del tubo UHV entre el imán y el preamplificador
    const x = XUHV, yt = ORIGEN.y - AX.BORE_R + 1.6, y0 = ORIGEN.y - 14;
    g.add(mesh(cylY(3, yt - y0, 32), M.aceroPulido, [x, (yt + y0) / 2, ZA]));
    g.add(mesh(cylY(4.6, 16, 40), M.aluminio, [x, y0 - 8, ZA]));
    g.add(mesh(cylY(4.7, 0.4, 40), M.aceroOscuro, [x, y0 - 5, ZA]));
    g.add(mesh(rbox(8, 3, 8, 0.4), M.anodizado, [x, y0 - 17.5, ZA]));
    g.add(mesh(cylX(0.6, 1.4, 16), M.aceroPulido, [x - 5.3, y0 - 12, ZA]));          // salida hacia atrás (delante está el imán)
    salidas.push([x - 6, y0 - 12, ZA]);
  }
  {
    const g = makePart(root, 'camara_vacio', L1([0, 0, 0], { shell: true, label: 'equipo' }));
    const a = wx(AX.F1_0) + 2, b = wx(AX.TR_0) - 2;
    g.add(mesh(rbox(a - b, 10, 10, 0.6), M.aluminio, [(a + b) / 2, ORIGEN.y, ZA]));
    // tabiques de bombeo diferencial con orificio (más finos que el hueco entre electrodos: sin caras coplanares)
    for (const lx of [AX.F2_0 - 0.5, AX.Q_0 - 0.5, AX.C_1 + 0.5]) g.add(placaPasos(12, 12, 0.8, [[0, 0, 1.0]], M.aceroPulido, [wx(lx), ORIGEN.y, ZA], 'zy', 0.3));
  }
  {
    const g = makePart(root, 'bomba_previa', L1([0, 0, -30], { label: 'equipo' }));
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
    [[BPV.x + 6, [[79, 70, ZA + 4], [64, 45, ZA - 18]]], [BPV.x + 2, [[49, 55, ZA - 8]]], [BPV.x - 2, [[29, 52, ZA - 16]]]].forEach(([sx, mid], i) => {
      const [x, y, z] = salidas[i];
      cableFlex(g, [[x, y, z, Tb], [x + 2.4, y - 3.5, z + 1.5, Tb], ...mid, ...fin(sx)], 0.5, M.ptfe);
    });
    // turbo UHV: baja tras el imán y corre junto al suelo por fuera de las cunas
    const [x, y, z] = salidas[3];
    cableFlex(g, [[x, y, z, Tb], [x - 1.5, y - 4, z - 2, Tb], [x, 60, ZA - 44], [x + 35, 12, ZA - 46], [-1, 14, ZA - 46], [19, 30, ZA - 40], ...fin(BPV.x - 6)], 0.5, M.ptfe, { seg: 160 });
  }

  /* ---------------- ELECTRÓNICA ---------------- */
  {
    // dos bastidores bajo la bancada, junto al lateral derecho (−z)
    const g = makePart(root, 'electronica', L1([0, 0, -30], { label: 'equipo' }));
    for (const x of [64, 98]) {
      g.add(mesh(rbox(28, 76, 26, 0.6), M.anodizado, [x, 42.1, -37]));
      for (let i = 0; i < 12; i++) g.add(mesh(box(24, 0.35, 0.6), M.aluminio, [x, 10 + i * 5.5, -23.7]));
    }
    const w = new THREE.MeshStandardMaterial({ map: warningTexture('ALTA TENSIÓN'), roughness: 0.45 });
    g.add(mesh(new THREE.PlaneGeometry(10, 3.8), w, [98, 76.5, -23.68]));
    // cable de señal al preamplificador: sube del bastidor, corre por el suelo junto al lateral derecho y sube al extremo del tubo UHV
    g.add(mesh(cylY(0.5, 1.0, 16), M.aceroPulido, [104, 80.5, -40]));
    const C = 'chasis', Rp = 'preamplificador', yp = ORIGEN.y - 3 - 1.1;
    cableFlex(g, [[104, 81.1, -40], [102, 85, -34, C], [80, 86, -28, C], [45, 86, -30, C], [40, 50, -30, C], [-30, 40, -30, C], [-100, 40, -30, C], [-112, 44, -10, C],
      [XPRE, 96, ZA - 2, Rp], [XPRE, yp - 2.4, ZA, Rp], [XPRE, yp, ZA, Rp]], 0.5, M.cable, { seg: 220 });
  }
  {
    // puesto de control en una mesa aparte, delante del extremo azul (se aparta al explosionar)
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
  refs.analyzer.group.rotation.y = Math.PI;   // fuente hacia el extremo azul (+X), imán hacia −X

  // todos los cables y mangueras son cableFlex: siguen solos a sus piezas al explosionar
  refs.update = () => {};
  return refs;
}
