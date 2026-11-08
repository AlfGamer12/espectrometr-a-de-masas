// Equipo completo scimaX, según fotografías del equipo real: un único mueble largo y bajo en gris claro, con capó de
// aristas muy redondeadas que oculta el imán de 7 T; cabeza frontal azul Bruker con línea de luz que continúa como lomo
// azul a lo largo de la tapa; fuente ESI (cúpula azul) en un hueco abierto de la esquina frontal izquierda, sobre una
// bandeja de acero; puerta de la diana MALDI en el hombro derecho; caja azul del criorrefrigerador sobre el extremo
// trasero; compresor de helio en el suelo y puesto de control en una mesa aparte.
// Coordenadas de mundo en cm. Eje iónico = −X (el frente real del equipo mira a +X; el lateral rotulado, a +Z).
// Bruker no publica las dimensiones: el mueble (≈ 324 × 112 × 154 cm) se ha ajustado al analizador y a las proporciones de las fotos.
import * as THREE from 'three';
import { M } from '../../materials.js';
import { mesh, rbox, box, cylX, cylY, cylZ, tubeX, tubePath, placaPasos, grilleTexture, screenTexture, plateTexture, warningTexture } from '../../geom.js';
import { makePart, cableFlex } from '../../parts.js';
import { buildAnalizador } from './analizador.js';
import { ORIGEN, AX } from './geometria.js';

const L1 = (offset, extra = {}) => ({ level: 1, offset, mode: 'equipo', ...extra });
/** Mueble: x ∈ [XB, XF], z ∈ [−ZW, ZW]; capó a HH con aristas de radio RC; lomo y cabeza azules (|z| < ZS) hasta HS. */
const XB = -172, XF = 152, ZW = 56, HH = 148, RC = 14, ZS = 20, HS = 154;
/** Cabeza azul (x > XH) con el hueco de la fuente a su izquierda (+z), sobre la bandeja a YT. */
const XH = 112, YT = 84.2, XSEAM = -16;
/** Analizador girado 180°: x local → −x mundo, z local → −z. */
const wx = (x) => ORIGEN.x - x;
const MX = wx(AX.MAG_C), MR = AX.MAG_R, ML = AX.MAG_L;   // imán
/** Turbos de la consola (x mundo) y turbo UHV tras el imán. */
const TURBOS = [AX.F1_0 + 4, AX.Q_0 + 6, AX.TR_0 + 20].map(wx);
const XUHV = MX - ML / 2 - 6;
const XPRE = wx(AX.UHV_END + 1.5 + 3.6);
/** Bancada (y = 84) y paso de la fibra del láser [x, z, r]. */
const BANCO = { x0: 30, x1: 148, z: 18, y: 84 };
const PASO_FIBRA = [134, -1, 0.6];
/** Criorrefrigerador (centro de la cabeza fría) y compresor de helio. */
const XC = -125, CRIO = { x0: -149.8, x1: -105.2 };
const COMP = { x: -140, z: -100 };
/** Bomba de vacío previo (bajo la consola) y su colector. */
const BPV = { x: 60, y: 14, z: -30 };

/* ---------- utilidades de forma ---------- */
/** Extruye una forma. 'xy': espesor en z · 'zy': u = z, v = y, espesor en x · 'xz': u = x, v = −z, espesor en y. */
function placa(shape, t, mat, pos, plano = 'xy') {
  const g = new THREE.ExtrudeGeometry(shape, { depth: t, bevelEnabled: false, curveSegments: 18 });
  g.translate(0, 0, -t / 2);
  const rot = plano === 'zy' ? [0, -Math.PI / 2, 0] : plano === 'xz' ? [-Math.PI / 2, 0, 0] : [0, 0, 0];
  return mesh(g, mat, pos, rot);
}
const poly = (pts, P = THREE.Shape) => { const s = new P(); pts.forEach(([u, v], i) => (i ? s.lineTo(u, v) : s.moveTo(u, v))); s.lineTo(...pts[0]); return s; };
/** Sección (z, y) de medio capó: tapa plana desde z0 hasta la arista redondeada del lateral s·ZW. */
function capoSeccion(s) {
  const z0 = s * (ZS + 0.2), zc = s * (ZW - RC), yc = HH - RC, sh = new THREE.Shape();
  sh.moveTo(z0, HH); sh.lineTo(zc, HH);
  sh.absarc(zc, yc, RC, Math.PI / 2, s > 0 ? 0 : Math.PI, s > 0);
  sh.lineTo(s * (ZW - 1.2), yc); sh.absarc(zc, yc, RC - 1.2, s > 0 ? 0 : Math.PI, Math.PI / 2, s < 0);
  sh.lineTo(z0, HH - 1.2); sh.lineTo(z0, HH);
  return sh;
}
/** Tapa frontal de un hombro (plano zy): de z0 a z1 (|z1| < ZW), con la arista superior exterior del capó. */
function tapaHombro(z0, z1, y0) {
  const s = Math.sign(z1), zc = s * (ZW - RC), yc = HH - RC, dz = Math.abs(z1 - zc), a = Math.acos(dz / RC);
  const sh = new THREE.Shape();
  sh.moveTo(z0, y0); sh.lineTo(z1, y0); sh.lineTo(z1, yc + RC * Math.sin(a));
  sh.absarc(zc, yc, RC, s > 0 ? a : Math.PI - a, Math.PI / 2, s < 0);
  sh.lineTo(z0, HH); sh.lineTo(z0, y0);
  return sh;
}
/** Lomo azul (sección en U invertida, plano zy). */
function lomoSeccion() {
  const sh = new THREE.Shape();
  sh.moveTo(-ZS, HH - 1); sh.lineTo(-ZS, HS - 2.4); sh.quadraticCurveTo(-ZS, HS, -ZS + 2.4, HS); sh.lineTo(ZS - 2.4, HS); sh.quadraticCurveTo(ZS, HS, ZS, HS - 2.4);
  sh.lineTo(ZS, HH - 1); sh.lineTo(ZS - 1.2, HH - 1); sh.lineTo(ZS - 1.2, HS - 1.2); sh.lineTo(-ZS + 1.2, HS - 1.2); sh.lineTo(-ZS + 1.2, HH - 1); sh.lineTo(-ZS, HH - 1);
  return sh;
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
/** Rótulo "scimaX" del lateral (blanco con sombra suave, la X mayor e inclinada). */
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
  const gris = M.grisClaro.clone(); gris.color.setHex(0xd7dadd); gris.metalness = 0.1; gris.roughness = 0.42; gris.clearcoat = 0.35;
  const oscuro = M.carcasaOsc.clone(); oscuro.color.setHex(0x1b2230);
  const junta = new THREE.MeshStandardMaterial({ color: 0x6c737d, roughness: 0.7 });
  const led = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xdcefff, emissiveIntensity: 1.6, roughness: 0.3 });
  const rejilla = navy.clone(); rejilla.map = grilleTexture(30, 3); rejilla.color.setHex(0x8b97ab);
  const logoBlanco = rotulo(logoBruker('#e9eef5')), logoAzul = rotulo(logoBruker('#22385a'));

  /* ---------------- BASTIDOR ---------------- */
  {
    const g = makePart(root, 'chasis', L1([0, 0, 0]));
    g.add(mesh(rbox(XF - XB - 6, 3, 2 * ZW - 6, 0.5), oscuro, [(XB + XF) / 2, 2.5, 0]));                  // zócalo retranqueado
    for (const x of [XB + 10, XF - 10]) for (const z of [-ZW + 8, ZW - 8]) g.add(mesh(cylY(2.4, 1.0, 24), M.aceroOscuro, [x, 0.5, z]));
    for (const x of [-168, 108]) for (const z of [-52, 52]) g.add(mesh(box(3, 124, 3), M.aluminio, [x, 4 + 62, z]));
    // bancada óptica: aberturas para las turbos (cuelgan de la cámara) y paso de la fibra del láser; apoyada en cuatro columnas
    const xc = (BANCO.x0 + BANCO.x1) / 2;
    const huecos = [...TURBOS.filter((x) => x > BANCO.x0 && x < BANCO.x1).map((x) => [x - xc, 0, 5.2]), [PASO_FIBRA[0] - xc, PASO_FIBRA[1], PASO_FIBRA[2]]];
    g.add(placaPasos(BANCO.x1 - BANCO.x0, 2 * BANCO.z, 2, huecos, M.aluminio, [xc, BANCO.y, 0], 'xz', 0.3));
    g.add(mesh(tubeX(0.9, 0.6, 0.6, 20), M.goma, [PASO_FIBRA[0], BANCO.y + 1.2, PASO_FIBRA[1]], [0, 0, Math.PI / 2]));
    for (const x of [BANCO.x0 + 2, BANCO.x1 - 8]) for (const z of [-16, 16]) g.add(mesh(box(3, BANCO.y - 1 - 4, 3), M.aluminio, [x, (4 + BANCO.y - 1) / 2, z]));
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
    // frente: cabeza azul (frontal, remate curvo, tapa y costados), hombro derecho con la puerta MALDI y bloque bajo izquierdo con la bandeja
    const g = makePart(root, 'panel_frontal', L1([40, 0, 0], { shell: true, label: 'equipo' }));
    const zi = ZS - 1.2;
    g.add(mesh(box(1.2, 140, 2 * zi), navy, [XF - 0.6, 4 + 70, 0]));
    {
      const s = new THREE.Shape();
      s.moveTo(XF, 144); s.absarc(XF - 10, 144, 10, 0, Math.PI / 2, false); s.lineTo(XF - 10, HS - 1.2); s.absarc(XF - 10, 144, 8.8, Math.PI / 2, 0, true); s.lineTo(XF, 144);
      g.add(placa(s, 2 * zi, navy, [0, 0, 0]));
    }
    g.add(mesh(box(XF - 10 - XH, 1.2, 2 * zi), navy, [(XF - 10 + XH) / 2, HS - 0.6, 0]));
    // costados de la cabeza (el izquierdo con la abertura de la fuente)
    for (const s of [1, -1]) {
      const y0 = s > 0 ? YT + 1 : 4;
      const sh = new THREE.Shape(); sh.moveTo(XH, y0); sh.lineTo(XF, y0); sh.lineTo(XF, 144); sh.absarc(XF - 10, 144, 10, 0, Math.PI / 2, false); sh.lineTo(XH, HS); sh.lineTo(XH, y0);
      if (s > 0) sh.holes.push(poly([[119, 88], [150, 88], [150, 124], [119, 124]], THREE.Path));
      g.add(placa(sh, 1.2, navy, [0, 0, s * (ZS - 0.6)]));
    }
    // fondo azul del hueco de la fuente, con su placa de conexiones
    g.add(mesh(box(31, 36, 1.2), navy, [134.5, 106, 10]));
    const pl = lienzo(512, 256, (c) => { c.fillStyle = '#f1f3f5'; c.fillRect(0, 0, 512, 256); c.fillStyle = '#22385a'; c.font = '600 34px Segoe UI'; c.fillText('Dual ESI / MALDI', 24, 52);
      c.font = '24px Segoe UI'; ['HV', 'Gas', 'Nebulizer', 'Dry gas'].forEach((s, i) => { c.fillText(s, 24 + i * 120, 200); c.beginPath(); c.arc(50 + i * 120, 140, 18, 0, 7); c.stroke(); }); });
    g.add(mesh(new THREE.PlaneGeometry(12, 6), new THREE.MeshStandardMaterial({ map: pl, roughness: 0.5 }), [124.5, 116, 10.62]));
    // rejillas de ventilación y línea de luz de la cabeza
    for (const z of [-11, 11]) g.add(mesh(new THREE.PlaneGeometry(26, 7), rejilla, [XH + 15, HS + 0.02, z], [-Math.PI / 2, 0, 0]));
    g.add(mesh(rbox(0.3, 96, 1.0, 0.12), led, [XF + 0.15, 88, 0]));
    g.add(mesh(rbox(28, 0.3, 1.0, 0.12), led, [XH + 15, HS + 0.15, 0]));
    g.add(mesh(new THREE.PlaneGeometry(9, 4.5), logoBlanco, [XF + 0.03, 22, 0], [0, Math.PI / 2, 0]));
    // hombro derecho (−z): tapa con la arista del capó y puerta de la diana MALDI
    g.add(placa(tapaHombro(-ZS - 0.2, -ZW + 1.4, 4), 1.2, gris, [XF - 0.6, 0, 0], 'zy'));
    g.add(mesh(rbox(0.8, 28, 24, 0.4), gris, [XF + 0.4, 108, -38]));
    g.add(mesh(rbox(1.4, 6, 1.6, 0.6), M.aceroPulido, [XF + 1.5, 108, -28.5]));
    g.add(mesh(cylX(0.6, 0.5, 16), M.ledVerde, [XF + 0.25, 126, -46]));
    // bloque bajo izquierdo (+z) y bandeja de acero bajo la fuente
    g.add(mesh(box(1.2, YT - 1.4 - 4, ZW - 1.4 - ZS - 0.2), gris, [XF - 0.6, (4 + YT - 1.4) / 2, (ZW - 1.4 + ZS + 0.2) / 2]));
    g.add(mesh(rbox(38, 1.2, 34, 0.3), M.acero, [XH + 20, YT - 0.6, (ZS + ZW) / 2]));
    g.add(mesh(rbox(38, 2.6, 0.8, 0.3), M.acero, [XH + 20, YT + 0.7, ZW - 1.6]));
    g.add(mesh(rbox(0.8, 2.6, 33, 0.3), M.acero, [XF - 1.6, YT + 0.7, (ZS + ZW) / 2 - 0.4]));
  }
  {
    // capó: dos medias secciones a cada lado del lomo, divididas en tramo delantero (consola) y trasero (imán), y lomo azul
    const g = makePart(root, 'tapa_superior', L1([0, 40, 0], { info: 'carcasa', shell: true }));
    for (const s of [1, -1]) {
      const xf = s > 0 ? XH - 0.2 : XF - 1.2;
      for (const [a, b] of [[XB + 1.2, XSEAM - 0.3], [XSEAM + 0.3, xf]]) g.add(placa(capoSeccion(s), b - a, gris, [(a + b) / 2, 0, 0], 'zy'));
    }
    for (const [a, b] of [[XB + 1.2, CRIO.x0 - 0.2], [CRIO.x1 + 0.2, XH]]) g.add(placa(lomoSeccion(), b - a, navy, [(a + b) / 2, 0, 0], 'zy'));
    for (const x of [40, -40]) for (const z of [-11, 11]) g.add(mesh(new THREE.PlaneGeometry(34, 7), rejilla, [x, HS + 0.02, z], [-Math.PI / 2, 0, 0]));
    g.add(mesh(rbox(XH + 60, 0.3, 1.0, 0.12), led, [(XH - 60) / 2, HS + 0.15, 0]));            // línea de luz a lo largo del lomo
  }
  {
    // lateral izquierdo (+z), rotulado; deja libre el hueco de la fuente. Lleva también la pared del fondo del hueco.
    const g = makePart(root, 'panel_izq', L1([0, 0, 70], { info: 'carcasa', shell: true }));
    g.add(placa(poly([[XB + 1.2, 4], [XF, 4], [XF, YT - 1.4], [XH + 1, YT - 1.4], [XH + 1, HH - RC], [XB + 1.2, HH - RC]]), 1.2, gris, [0, 0, ZW - 0.6]));
    g.add(placa(tapaHombro(ZS + 0.2, ZW - 1.4, YT), 1.2, gris, [XH + 0.4, 0, 0], 'zy'));
    const zt = ZW + 0.02;
    // juntas entre paneles
    g.add(mesh(new THREE.PlaneGeometry(XH - XB - 2, 1.0), junta, [(XB + XH) / 2, 96, zt]));
    g.add(mesh(new THREE.PlaneGeometry(XF - XH - 1, 1.0), junta, [(XH + XF) / 2, 60, zt]));
    for (const x of [XSEAM, 40, -100]) g.add(mesh(new THREE.PlaneGeometry(0.8, x === XSEAM ? HH - RC - 5 : 90), junta, [x, x === XSEAM ? (HH - RC + 4) / 2 : 50, zt + 0.08]));
    // rótulos, rejilla y pulsador de emergencia
    g.add(mesh(new THREE.PlaneGeometry(44, 13.75), rotulo(rotuloScimax()), [62, 115, zt + 0.06]));
    const sub = lienzo(1024, 96, (c) => { c.fillStyle = '#3c4656'; c.font = 'italic 500 54px Segoe UI, Arial'; c.textBaseline = 'middle'; c.fillText('maxwell  MRMS technology inside', 8, 50); });
    g.add(mesh(new THREE.PlaneGeometry(38, 3.6), rotulo(sub), [78, 90, zt + 0.06]));
    const vg = gris.clone(); vg.map = grilleTexture(16, 10);
    g.add(mesh(new THREE.PlaneGeometry(22, 26), vg, [10, 40, zt]));
    g.add(mesh(rbox(5, 7, 0.8, 0.3), M.peekRojo, [-150, 70, ZW + 0.4]));
  }
  {
    const g = makePart(root, 'panel_der', L1([0, 0, -70], { info: 'carcasa', shell: true }));
    g.add(placa(poly([[XB + 1.2, 4], [XF, 4], [XF, HH - RC], [XB + 1.2, HH - RC]]), 1.2, gris, [0, 0, -ZW + 0.6]));
    const zt = -ZW - 0.02;
    g.add(mesh(new THREE.PlaneGeometry(XF - XB - 2, 1.0), junta, [(XB + XF) / 2, 96, zt], [0, Math.PI, 0]));
    for (const x of [XSEAM, 40, -100]) g.add(mesh(new THREE.PlaneGeometry(0.8, x === XSEAM ? HH - RC - 5 : 90), junta, [x, x === XSEAM ? (HH - RC + 4) / 2 : 50, zt - 0.08], [0, Math.PI, 0]));
    const vg = gris.clone(); vg.map = grilleTexture(16, 10);
    g.add(mesh(new THREE.PlaneGeometry(22, 26), vg, [10, 40, zt], [0, Math.PI, 0]));
  }
  {
    // trasera: tapa con la silueta del capó y del lomo
    const g = makePart(root, 'panel_trasero', L1([-40, 0, 0], { info: 'carcasa', shell: true }));
    const s = new THREE.Shape(), yc = HH - RC, zc = ZW - RC;
    s.moveTo(-ZW, 4); s.lineTo(ZW, 4); s.lineTo(ZW, yc); s.absarc(zc, yc, RC, 0, Math.PI / 2, false); s.lineTo(ZS, HH); s.lineTo(ZS, HS - 2); s.lineTo(ZS - 2, HS);
    s.lineTo(-ZS + 2, HS); s.lineTo(-ZS, HS - 2); s.lineTo(-ZS, HH); s.lineTo(-zc, HH); s.absarc(-zc, yc, RC, Math.PI / 2, Math.PI, false); s.lineTo(-ZW, 4);
    g.add(placa(s, 1.2, gris, [XB + 0.6, 0, 0], 'zy'));
    const plate = new THREE.MeshStandardMaterial({ map: plateTexture(['scimaX MRMS · 7 T', '230 V~ 50/60 Hz', 'Modelo didáctico', 'Explorador 3D']), metalness: 0.6, roughness: 0.4 });
    g.add(mesh(new THREE.PlaneGeometry(9, 4.5), plate, [XB - 0.03, 60, -30], [0, -Math.PI / 2, 0]));
    const vg = gris.clone(); vg.map = grilleTexture(24, 8);
    g.add(mesh(new THREE.PlaneGeometry(60, 20), vg, [XB - 0.03, 28, 10], [0, -Math.PI / 2, 0]));
    g.add(mesh(rbox(1.2, 3, 4, 0.3), M.plasticoNegro, [XB - 0.6, 16, 30]));
    g.add(mesh(tubePath([[XB - 1.2, 16, 30], [XB - 5, 16, 30], [XB - 10, 10, 32], [XB - 17, 0.7, 35], [XB - 35, 0.7, 44]], 0.45, 40, 10), M.cable));
  }
  {
    // cúpula azul de la fuente ESI: sobresale del costado izquierdo de la cabeza, en el hueco de la fuente
    const g = makePart(root, 'carcasa_fuente', L1([0, 0, 45], { shell: true, label: 'equipo' }));
    const c = new THREE.Vector3(136, ORIGEN.y, 17), r = 12.5;
    const dome = new THREE.SphereGeometry(r, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2); dome.rotateX(Math.PI / 2);
    const mt = navy.clone(); mt.side = THREE.DoubleSide;
    g.add(mesh(dome, mt, [c.x, c.y, c.z]));
    g.add(mesh(new THREE.TorusGeometry(r - 0.2, 0.5, 12, 64), M.aceroOscuro, [c.x, c.y, c.z + 0.5]));
    g.add(mesh(cylZ(3.2, 1.0, 32), M.negroBrillante, [c.x, c.y, c.z + r - 0.2]));                  // mirilla
    g.add(mesh(cylZ(2.2, 3.2, 24), M.acero, [c.x - 8.5, c.y - 2, c.z + 9.6], [0, -0.6, 0]));       // entrada del nebulizador
    const w = new THREE.MeshStandardMaterial({ map: warningTexture('ALTA TENSIÓN'), roughness: 0.45, side: THREE.DoubleSide });
    g.add(mesh(new THREE.PlaneGeometry(6, 2.25), w, [c.x + 3.5, c.y + 8.2, c.z + 9.05], [-0.75, 0.25, 0]));
    // soporte de la jeringa junto a la cúpula
    g.add(mesh(rbox(3, 26, 3, 0.4), M.plasticoNegro, [148, 106, ZS + 1.7]));
    g.add(mesh(cylY(0.8, 12, 20), M.vidrio, [148, 108, ZS + 4]));
  }
  {
    const g = makePart(root, 'laser_maldi', L1([25, 0, 0], { label: 'equipo' }));
    g.add(mesh(rbox(18, 12, 16, 0.6), M.anodizado, [135, 66, 6]));
    const lw = new THREE.MeshStandardMaterial({ map: warningTexture('RADIACIÓN LÁSER'), roughness: 0.45 });
    g.add(mesh(new THREE.PlaneGeometry(9, 3.4), lw, [135, 66, 14.05]));
    // fibra óptica: salida superior del láser → paso de la bancada → entrada del láser en la fuente
    const [fx, fz] = PASO_FIBRA, F = 'fuente_dual', yb = BANCO.y;
    g.add(mesh(cylY(0.6, 1.2, 16), M.aceroPulido, [135, 72.6, 6]));
    cableFlex(g, [[135, 73.2, 6], [134.6, 77, 2], [fx, yb - 1.6, fz, 'chasis'], [fx, yb + 1.6, fz, 'chasis'], [fx - 0.2, yb + 5.5, -2.5, F], [wx(2.5), ORIGEN.y - 12.1, -3, F]], 0.25, M.cable);
  }

  /* ---------------- IMÁN SUPERCONDUCTOR (dentro del capó trasero) ---------------- */
  {
    const g = makePart(root, 'iman', L1([0, 0, 0], { shell: true, label: 'equipo' }));
    const L = ML, R = MR, Rb = AX.BORE_R;
    const prof = [[Rb, -L / 2], [R - 4, -L / 2], [R, -L / 2 + 4], [R, L / 2 - 4], [R - 4, L / 2], [Rb, L / 2], [Rb, -L / 2]];
    const geo = new THREE.LatheGeometry(prof.map(([r, x]) => new THREE.Vector2(r, x)), 96); geo.rotateZ(-Math.PI / 2);
    g.add(mesh(geo, M.acero, [MX, ORIGEN.y, 0]));
    for (const s of [-1, 1]) g.add(mesh(new THREE.TorusGeometry(R + 0.3, 0.9, 12, 96), M.aceroPulido, [MX + s * (L / 2 - 8), ORIGEN.y, 0], [0, Math.PI / 2, 0]));
    // torreta de la cabeza fría
    g.add(mesh(cylY(9, 7.9, 48), M.acero, [XC, HH - 2.6 - 3.95, 0]));
    g.add(mesh(cylY(10, 1.2, 48), M.aceroPulido, [XC, HH - 1.5 - 0.6, 0]));
    const lab = new THREE.MeshStandardMaterial({ map: lienzo(256, 96, (c) => { c.fillStyle = '#22385a'; c.fillRect(0, 0, 256, 96); c.fillStyle = '#fff'; c.font = '600 52px Segoe UI'; c.textBaseline = 'middle'; c.fillText('7 T · cc', 30, 50); }) });
    g.add(mesh(new THREE.PlaneGeometry(10, 3.75), lab, [MX + 20, ORIGEN.y, R + 0.3]));
    const w = new THREE.MeshStandardMaterial({ map: warningTexture('CAMPO MAGNÉTICO INTENSO'), roughness: 0.45 });
    g.add(mesh(new THREE.PlaneGeometry(13, 4.8), w, [MX - 20, ORIGEN.y + 10, R - 1.0], [-0.26, 0, 0]));
  }
  {
    // cabeza fría + caja azul sobre el extremo trasero (sube al explosionar)
    const g = makePart(root, 'criorrefrigerador', L1([0, 60, 0], { label: 'equipo' }));
    g.add(mesh(cylY(6.5, 1.0, 40), M.aceroPulido, [XC, HH - 1.5 + 0.5, 0]));
    g.add(mesh(cylY(4.2, 11.5, 40), M.aluminio, [XC, HH - 0.5 + 5.75, 0]));
    const cx = (CRIO.x0 + CRIO.x1) / 2, h = 53;
    g.add(mesh(rbox(CRIO.x1 - CRIO.x0, h, 2 * ZS - 0.4, 6), navy, [cx, HH - 1 + h / 2, 0]));
    g.add(mesh(new THREE.PlaneGeometry(12, 6), logoBlanco, [CRIO.x1 + 0.03, HH + h - 12, 0], [0, Math.PI / 2, 0]));
    g.add(mesh(new THREE.PlaneGeometry(12, 6), logoBlanco, [cx, HH + h - 12, ZS - 0.17]));
    refs.cryoPorts = [];
    for (const x of [-118, -136]) {
      g.add(mesh(cylZ(1.1, 2.5, 20), M.aceroPulido, [x, 182, -ZS + 0.2 - 1.25]));
      refs.cryoPorts.push([x, 182, -ZS + 0.2 - 2.6]);
    }
  }
  {
    // compresor de helio en el suelo, junto al extremo trasero del lateral derecho
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
    // líneas flexibles de helio: salen del costado de la caja, pasan por encima del capó y bajan por fuera del lateral derecho
    const g = makePart(root, 'lineas_helio', L1([0, 0, 0], { info: 'compresor_helio' }));
    const C = 'criorrefrigerador', K = 'compresor_helio';
    const trenza = M.aceroPulido.clone(); trenza.roughness = 0.45; trenza.bumpMap = grilleTexture(60, 4); trenza.bumpScale = 0.3;
    refs.cryoPorts.forEach(([x, y, z], i) => {
      const [xk, yk, zk] = refs.compPorts[i];
      cableFlex(g, [[x, y, z, C], [x, y + 1, z - 8, C], [x - 4, 165, -66, K], [xk, 112, zk + 12, K], [xk, 80, zk, K], [xk, yk, zk, K]], 0.9, trenza, { seg: 90 });
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
    const a = wx(AX.F1_0) + 2, b = wx(AX.TR_0) - 2;
    g.add(mesh(rbox(a - b, 10, 10, 0.6), M.aluminio, [(a + b) / 2, ORIGEN.y, 0]));
    // tabiques de bombeo diferencial con orificio (más finos que el hueco entre electrodos: sin caras coplanares)
    for (const lx of [AX.F2_0 - 0.5, AX.Q_0 - 0.5, AX.C_1 + 0.5]) g.add(placaPasos(12, 12, 0.8, [[0, 0, 1.0]], M.aceroPulido, [wx(lx), ORIGEN.y, 0], 'zy', 0.3));
  }
  {
    const g = makePart(root, 'bomba_previa', L1([0, 0, -34], { label: 'equipo' }));
    g.add(mesh(rbox(26, 20, 24, 1), M.grisClaro, [BPV.x, BPV.y, BPV.z]));
    g.add(mesh(cylY(1.2, 3, 20), M.aceroPulido, [BPV.x, BPV.y + 11.5, BPV.z]));
    // colector de aspiración con una toma por turbo
    g.add(mesh(cylX(1.0, 16, 24), M.aceroPulido, [BPV.x, BPV.y + 14.8, BPV.z]));
    for (const x of [-6, -2, 2, 6]) g.add(mesh(cylY(0.75, 2, 16), M.aceroPulido, [BPV.x + x, BPV.y + 16.6, BPV.z]));
  }
  {
    const g = makePart(root, 'lineas_vacio', L1([0, 0, 0], { info: 'bomba_previa' }));
    const T = 'bombas_turbo', P = 'bomba_previa', yb = BPV.y + 17.8;
    const fin = (sx) => [[sx, yb + 5, BPV.z, P], [sx, yb, BPV.z, P]];
    // turbos de la consola: bajan por el centro, bajo la bancada, hasta el colector
    [[BPV.x + 6, [[112, 60, 4], [90, 40, -18]]], [BPV.x + 2, [[84, 48, -10]]], [BPV.x - 2, [[56, 44, -16]]]].forEach(([sx, mid], i) => {
      const [x, y, z] = salidas[i];
      cableFlex(g, [[x, y, z, T], [x + 2.4, y - 3.5, z + 1.5, T], ...mid, ...fin(sx)], 0.5, M.ptfe);
    });
    // turbo UHV: baja tras el imán y corre junto al suelo por el lado derecho, por fuera de las cunas
    const [x, y, z] = salidas[3];
    cableFlex(g, [[x, y, z, T], [x + 1.5, y - 4, z - 2, T], [x + 4, 50, -38], [x + 30, 12, -45], [20, 14, -46], [40, 30, -40], ...fin(BPV.x - 6)], 0.5, M.ptfe, { seg: 160 });
  }

  /* ---------------- ELECTRÓNICA ---------------- */
  {
    // tres bastidores bajo la bancada, junto al lateral izquierdo
    const g = makePart(root, 'electronica', L1([0, 0, 30], { label: 'equipo' }));
    for (const x of [24, 58, 92]) {
      g.add(mesh(rbox(28, 64, 30, 0.6), M.anodizado, [x, 36, 37]));
      for (let i = 0; i < 10; i++) g.add(mesh(box(24, 0.35, 0.6), M.aluminio, [x, 10 + i * 5.5, 21.7]));
    }
    const w = new THREE.MeshStandardMaterial({ map: warningTexture('ALTA TENSIÓN'), roughness: 0.45 });
    g.add(mesh(new THREE.PlaneGeometry(10, 3.8), w, [58, 62, 21.68], [0, Math.PI, 0]));
    // cable de señal al preamplificador: sube del bastidor, corre por el suelo junto al lateral izquierdo y sube al extremo del tubo UHV
    g.add(mesh(cylY(0.5, 1.0, 16), M.aceroPulido, [100, 68.5, 30]));
    const C = 'chasis', R = 'preamplificador', yp = ORIGEN.y - 3 - 1.1;
    cableFlex(g, [[100, 69.1, 30], [97, 72, 32], [70, 72, 40], [8, 72, 42], [5, 40, 46, C], [-20, 12, 46, C], [-150, 12, 46, C], [-158, 30, 22, C],
      [XPRE, 80, 2, R], [XPRE, yp - 2.4, 0, R], [XPRE, yp, 0, R]], 0.5, M.cable, { seg: 220 });
  }
  {
    // puesto de control en una mesa aparte, delante del hombro derecho (se aparta por delante del frontal al explosionar)
    const g = makePart(root, 'pc', L1([70, 0, -30], { label: 'equipo' }));
    const x = 215, z = -62, y = 75;
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
