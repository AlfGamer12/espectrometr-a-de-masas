// Sistema óptico del Shimadzu UV-1900i: lámparas de deuterio y halógena con espejo conmutador, monocromador Czerny-Turner
// (rendija de entrada, espejo colimador, red de difracción LO-RAY-LIGH, espejo de enfoque y rendija de salida), filtro de corte,
// espejos planos y divisor de haz (doble haz), compartimento de muestras con portacubetas y cubetas, y fotodiodos de silicio.
// Coordenadas del mundo (ver geometria.js). La disposición es aproximada: el fabricante no publica planos.
import * as THREE from 'three';
import { M } from '../../materials.js';
import { mesh, rbox, box, cylY, cylZ, cylX, helix, placaPasos, textTexture } from '../../geom.js';
import { makePart } from '../../parts.js';
import { P, BY, ZS, ZR, CM, MONO, LAMP } from './geometria.js';

const L2 = (offset, label = true, extra = {}) => ({ level: 2, offset, mode: 'analizador', label: label ? 'analizador' : null, ...extra });
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const YB = 5.0;                                   // cara superior del banco óptico

/** Normal de un espejo que lleva la luz de la dirección `din` a la dirección `dout`. */
const normalEspejo = (din, dout) => dout.clone().normalize().sub(din.clone().normalize()).normalize();
/** Orienta un grupo para que su eje +z local apunte según n (giro solo alrededor del eje vertical si n es horizontal). */
function orientar(g, n) { g.rotation.set(0, Math.atan2(n.x, n.z), 0); return g; }

/** Textura de la red de difracción: surcos finos con reflejos iridiscentes. */
function texRed() {
  const c = document.createElement('canvas'); c.width = 512; c.height = 512;
  const g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 512, 512);
  ['#6a3df0', '#2f7cf5', '#22c3c9', '#3cd26a', '#e3d93a', '#f08a2c', '#e0374a'].forEach((col, i, a) => gr.addColorStop(i / (a.length - 1), col));
  g.fillStyle = gr; g.globalAlpha = 0.55; g.fillRect(0, 0, 512, 512); g.globalAlpha = 1;
  for (let x = 0; x < 512; x += 3) { g.fillStyle = x % 6 ? 'rgba(255,255,255,0.25)' : 'rgba(20,24,30,0.35)'; g.fillRect(x, 0, 1.2, 512); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}

export function buildAnalizador(parent) {
  const refs = {};
  const A = makePart(parent, 'sistema_optico', { level: 1, offset: [0, 0, 0], mode: 'analizador', label: 'equipo' });
  const espejo = M.aceroPulido.clone(); espejo.color.setHex(0xeef1f4); espejo.roughness = 0.04; espejo.roughnessMap = null;
  const espejoC = espejo.clone(); espejoC.side = THREE.DoubleSide;     // casquete esférico de los espejos cóncavos
  const casquete = () => new THREE.SphereGeometry(6, 48, 8, 0, Math.PI * 2, 0, 0.21).rotateX(-Math.PI / 2).translate(0, 0, 6);
  const negroMate = M.plasticoNegro.clone(); negroMate.color.setHex(0x16181b);
  const fundicion = M.aluminio.clone(); fundicion.color.setHex(0xa9afb6);
  const anod = M.anodizado.clone(); anod.color.setHex(0x3c4148);

  /** Soporte cinemático de un espejo o de una pieza óptica: placa trasera, columna y pie sobre el banco. */
  function soporte(g, p, n, alto) {
    const h = orientar(new THREE.Group(), n); h.position.copy(p); g.add(h);
    h.add(mesh(rbox(2.6, 2.6, 0.5, 0.15), anod, [0, 0, -0.62]));
    for (const [x, y] of [[0.95, 0.95], [-0.95, 0.95], [0.95, -0.95]]) h.add(mesh(cylZ(0.13, 0.42, 12), M.tornillo, [x, y, -1.08]));
    const yb = p.y - 1.3;
    g.add(mesh(cylY(0.28, yb - YB - 0.6, 16), M.aceroPulido, [p.x, (yb + YB + 0.6) / 2, p.z]));
    g.add(mesh(rbox(1.6, 0.6, 1.6, 0.15), anod, [p.x, YB + 0.3, p.z]));
    return h;
  }

  /* ---------------- BANCO ÓPTICO ---------------- */
  {
    const g = makePart(A, 'banco_optico', L2([0, -7, 0], false));
    g.add(mesh(rbox(17.4, 0.6, 22.4, 0.2), fundicion, [-13.3, YB - 0.3, -2.6]));
    for (const [x, z] of [[-21.2, -13], [-5.4, -13], [-21.2, 7.8], [-5.4, 7.8]]) g.add(mesh(cylY(0.45, YB - 0.6 - 1.5, 16), M.aceroOscuro, [x, (YB - 0.6 + 1.5) / 2, z]));
  }

  /* ---------------- LÁMPARAS ---------------- */
  {
    // casa de lámparas: paredes de chapa negra; la trasera deja pasar los cables de alimentación y la delantera, la luz hacia S1
    const g = makePart(A, 'casa_lamparas', L2([-10, 0, -12], true, { shell: true }));
    const { X0, X1, Z0, Z1, Y0, Y1 } = LAMP, cx = (X0 + X1) / 2, cy = (Y0 + Y1) / 2;
    g.add(placaPasos(X1 - X0, Y1 - Y0, 0.4, [[P.D2.x - cx, 6.6 - cy, 0.45], [P.WI.x - cx, 6.6 - cy, 0.45]], negroMate, [cx, cy, Z0 + 0.2], 'xy', 0.2));
    g.add(placaPasos(X1 - X0, Y1 - Y0, 0.4, [[P.S1.x - cx, BY - cy, 0.7]], negroMate, [cx, cy, Z1 - 0.2], 'xy', 0.2));
    for (const x of [X0 + 0.2, X1 - 0.2]) g.add(mesh(box(0.4, Y1 - Y0, Z1 - Z0 - 0.8), negroMate, [x, cy, (Z0 + Z1) / 2]));
    const tapa = placaPasos(X1 - X0, Z1 - Z0, 0.4, [-7, -4.5, -2, 0.5, 3, 5.5].flatMap((x) => [[x, -1.2, 0.4], [x, 1.2, 0.4]]), negroMate, [cx, Y1 + 0.2, (Z0 + Z1) / 2], 'xz', 0.2);
    makePart(A, 'tapa_lamparas', L2([0, 18, -4], false, { info: 'casa_lamparas', shell: true })).add(tapa);
  }
  {
    // lámpara de deuterio: zócalo, ampolla de vidrio de sílice con la ventana hacia el espejo conmutador
    const g = makePart(A, 'lampara_d2', L2([3, 14, -3]));
    const x = P.D2.x, z = P.D2.z;
    g.add(mesh(rbox(2.6, 2.4, 2.6, 0.25), M.ceramica, [x, YB + 1.2, z]));
    g.add(mesh(cylY(1.0, 0.6, 32), M.aceroPulido, [x, YB + 2.7, z]));
    const vidrio = M.cuarzo.clone(); vidrio.opacity = 0.35;
    g.add(mesh(new THREE.CylinderGeometry(1.0, 1.0, 5.0, 40, 1, true), vidrio, [x, YB + 5.5, z]));
    g.add(mesh(new THREE.SphereGeometry(1.0, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2), vidrio, [x, YB + 8.0, z]));
    // electrodos y apertura (caja metálica interior con el orificio hacia −x)
    g.add(mesh(rbox(0.9, 1.6, 0.9, 0.1), M.aceroOscuro, [x + 0.15, BY, z]));
    g.add(mesh(cylX(0.18, 0.06, 16), M.plasticoNegro, [x - 0.33, BY, z]));
    g.add(mesh(cylY(0.06, 2.6, 8), M.aceroPulido, [x + 0.35, YB + 4.3, z + 0.3]));
    g.add(mesh(cylY(0.06, 2.6, 8), M.aceroPulido, [x + 0.35, YB + 4.3, z - 0.3]));
    const lab = new THREE.MeshStandardMaterial({ map: textTexture(['D₂'], { w: 128, h: 64, bg: '#f2eee4', fg: '#3a3f47', font: '700 40px Segoe UI' }), roughness: 0.6 });
    g.add(mesh(new THREE.PlaneGeometry(1.2, 0.6), lab, [x, YB + 1.3, z + 1.31]));
    // resplandor de la descarga (se enciende en la simulación)
    const glow = M.haz.clone(); glow.color.setHex(0xb59cff); glow.opacity = 0;
    const s = mesh(new THREE.SphereGeometry(0.55, 24, 16), glow, [x - 0.2, BY, z]); s.userData.noClone = true; s.castShadow = false; s.raycast = () => {};
    g.add(s); refs.glowD2 = s;
    refs.d2Pin = V(x, 6.6, z - 1.3);
  }
  {
    // lámpara halógena de wolframio: zócalo cerámico, cápsula de cuarzo con el filamento en espiral
    const g = makePart(A, 'lampara_wi', L2([-5, 14, -3]));
    const x = P.WI.x, z = P.WI.z;
    g.add(mesh(rbox(1.8, 2.4, 2.2, 0.2), M.ceramica, [x, YB + 1.2, z]));
    g.add(mesh(box(1.0, BY - 0.9 - YB - 2.4, 1.0), M.ceramica, [x, (YB + 2.4 + BY - 0.9) / 2, z]));
    const caps = M.cuarzo.clone(); caps.opacity = 0.4;
    g.add(mesh(new THREE.CylinderGeometry(0.42, 0.42, 1.5, 28, 1, true), caps, [x, BY, z]));
    g.add(mesh(new THREE.SphereGeometry(0.42, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2), caps, [x, BY + 0.75, z]));
    const fil = mesh(helix(0.12, 0.7, 7, 0.025, 120), M.tungsteno, [x, BY, z]); fil.rotation.x = Math.PI / 2; g.add(fil);
    for (const dz of [-0.2, 0.2]) g.add(mesh(cylY(0.03, 0.7, 6), M.aceroPulido, [x, BY - 0.65, z + dz]));
    const lab = new THREE.MeshStandardMaterial({ map: textTexture(['WI'], { w: 128, h: 64, bg: '#f2eee4', fg: '#3a3f47', font: '700 40px Segoe UI' }), roughness: 0.6 });
    g.add(mesh(new THREE.PlaneGeometry(1.0, 0.5), lab, [x, YB + 1.3, z + 1.11]));
    const glow = M.haz.clone(); glow.color.setHex(0xffd38a); glow.opacity = 0;
    const s = mesh(new THREE.SphereGeometry(0.7, 24, 16), glow, [x, BY, z]); s.userData.noClone = true; s.castShadow = false; s.raycast = () => {};
    g.add(s); refs.glowWI = s;
    refs.wiPin = V(x, 6.6, z - 1.1);
  }
  {
    // espejo conmutador: gira 90° para enviar a la rendija de entrada la luz de una u otra lámpara
    const g = makePart(A, 'espejo_conmutador', L2([0, 16, -1]));
    const p = P.M0;
    g.add(mesh(cylY(0.8, 2.2, 28), anod, [p.x, YB + 1.1, p.z]));
    g.add(mesh(cylY(0.12, BY - 1.25 - YB - 2.2, 12), M.aceroPulido, [p.x, (YB + 2.2 + BY - 1.25) / 2, p.z]));
    const rot = new THREE.Group(); rot.position.copy(p); g.add(rot);
    const pl = new THREE.Group(); rot.add(pl);
    pl.add(mesh(box(2.2, 2.4, 0.12), espejo, [0, 0, 0]));
    pl.add(mesh(box(2.3, 0.18, 0.3), anod, [0, -1.29, -0.05]));
    refs.conmutador = rot;
    refs.angConmutador = (lamp) => (lamp === 'D2' ? Math.atan2(1, 1) : Math.atan2(-1, 1));   // normal (±1, 0, 1)
    rot.rotation.y = refs.angConmutador('D2');
  }

  /* ---------------- MONOCROMADOR CZERNY-TURNER ---------------- */
  {
    const g = makePart(A, 'monocromador', L2([0, 22, 0], true, { shell: true }));
    const { X0, X1, Z0, Z1, Y0, Y1 } = MONO, cx = (X0 + X1) / 2, cy = (Y0 + Y1) / 2, cz = (Z0 + Z1) / 2;
    const fund = fundicion.clone(); fund.color.setHex(0x8f969e);
    g.add(placaPasos(X1 - X0, Y1 - Y0, 0.4, [[P.S1.x - cx, BY - cy, 0.55], [P.S2.x - cx, BY - cy, 0.55]], fund, [cx, cy, Z0 + 0.2], 'xy', 0.25));
    g.add(mesh(box(X1 - X0, Y1 - Y0, 0.4), fund, [cx, cy, Z1 - 0.2]));
    for (const x of [X0 + 0.2, X1 - 0.2]) g.add(mesh(box(0.4, Y1 - Y0, Z1 - Z0 - 0.8), fund, [x, cy, cz]));
    // tapa superior del monocromador (pieza aparte: se levanta al explosionar)
    const gt = makePart(A, 'tapa_monocromador', L2([0, 34, 0], false, { info: 'monocromador', shell: true }));
    gt.add(mesh(rbox(X1 - X0 + 0.4, 0.4, Z1 - Z0 + 0.4, 0.15), fund, [cx, Y1 + 0.2, cz]));
    for (const x of [X0 + 1, X1 - 1]) for (const z of [Z0 + 1, Z1 - 1]) gt.add(mesh(cylY(0.2, 0.15, 12), M.tornillo, [x, Y1 + 0.47, z]));
    const lab = new THREE.MeshStandardMaterial({ map: textTexture(['MONOCROMADOR'], { w: 512, h: 64, bg: '#8f969e', fg: '#f2f4f6', font: '600 34px Segoe UI' }), roughness: 0.5 });
    gt.add(mesh(new THREE.PlaneGeometry(6, 0.75), lab, [cx, Y1 + 0.41, cz + 4], [-Math.PI / 2, 0, 0]));
  }
  /** Rendija: dos cuchillas verticales sobre un marco, por la cara interior de la pared trasera del monocromador. */
  function rendija(id, p, off) {
    const g = makePart(A, id, L2(off));
    const z = -6.85;
    g.add(placaPasos(2.4, 3.2, 0.12, [[0, 0, 0.62]], anod, [p.x, BY, z + 0.06], 'xy', 0.2));
    for (const s of [-1, 1]) g.add(mesh(box(0.55, 2.0, 0.06), M.aceroPulido, [p.x + s * (0.03 + 0.275), BY, z + 0.15]));
    for (const [dx, dy] of [[-0.9, 1.2], [0.9, 1.2], [-0.9, -1.2], [0.9, -1.2]]) g.add(mesh(cylZ(0.11, 0.1, 10), M.tornillo, [p.x + dx, BY + dy, z + 0.17]));
    return g;
  }
  rendija('rendija_entrada', P.S1, [-2, 7, 4]);
  rendija('rendija_salida', P.S2, [2, 7, 4]);
  {
    const g = makePart(A, 'espejo_colimador', L2([-4, 9, 4]));
    const n = normalEspejo(V(0, 0, 1), P.G.clone().sub(P.M1));
    const h = soporte(g, P.M1, n);
    h.add(mesh(cylZ(1.25, 0.45, 48), M.vidrio.clone(), [0, 0, -0.23]));
    h.add(mesh(casquete(), espejoC, [0, 0, 0]));
    refs.nM1 = n;
  }
  {
    const g = makePart(A, 'espejo_focalizador', L2([4, 9, 4]));
    const n = normalEspejo(P.M2.clone().sub(P.G), P.S2.clone().sub(P.M2));
    const h = soporte(g, P.M2, n);
    h.add(mesh(cylZ(1.25, 0.45, 48), M.vidrio.clone(), [0, 0, -0.23]));
    h.add(mesh(casquete(), espejoC, [0, 0, 0]));
  }
  {
    // red de difracción holográfica sobre una platina giratoria: el motor la gira para elegir la longitud de onda
    const g = makePart(A, 'red_difraccion', L2([0, 12, -2]));
    const p = P.G;
    g.add(mesh(cylY(1.5, 0.8, 40), anod, [p.x, YB + 0.4, p.z]));
    g.add(mesh(rbox(2.2, 1.4, 1.6, 0.2), negroMate, [p.x + 2.4, YB + 0.7, p.z + 0.6]));                // motor paso a paso
    g.add(mesh(cylY(0.25, BY - 1.75 - YB - 0.8, 16), M.aceroPulido, [p.x, (YB + 0.8 + BY - 1.75) / 2, p.z]));
    const rot = new THREE.Group(); rot.position.copy(p); g.add(rot);
    rot.add(mesh(box(3.2, 0.3, 1.4), anod, [0, -1.6, -0.45]));
    rot.add(mesh(box(3.0, 2.8, 0.7), M.vidrio.clone(), [0, 0, -0.38]));
    const rm = new THREE.MeshStandardMaterial({ map: texRed(), metalness: 0.85, roughness: 0.18 });
    const cara = mesh(new THREE.PlaneGeometry(2.9, 2.7), rm, [0, 0, 0.0]); cara.userData.decal = true; rot.add(cara);
    refs.red = rot;
  }
  {
    // filtro de corte de órdenes superiores: rueda con varias ventanas, tras la rendija de salida
    const g = makePart(A, 'filtro', L2([3, 10, -3]));
    const c = V(P.F.x, BY - 1.25, P.F.z);
    const rueda = new THREE.Group(); rueda.position.copy(c); g.add(rueda);
    const sh = new THREE.Shape(); sh.absarc(0, 0, 1.85, 0, Math.PI * 2, false);
    const win = [];
    for (let k = 0; k < 5; k++) { const a = Math.PI / 2 + (k / 5) * Math.PI * 2; const h = new THREE.Path(); h.absarc(Math.cos(a) * 1.25, Math.sin(a) * 1.25, 0.42, 0, Math.PI * 2, true); sh.holes.push(h); win.push(a); }
    const geo = new THREE.ExtrudeGeometry(sh, { depth: 0.2, bevelEnabled: false, curveSegments: 40 }); geo.translate(0, 0, -0.1);
    rueda.add(mesh(geo, anod));
    const cols = [0xf0e9b8, 0xe9b46a, 0xd47a3c, 0xb3c9e8, 0xd7d0f0];
    win.forEach((a, k) => { const f = M.vidrio.clone(); f.color.setHex(cols[k]); f.opacity = 0.55; rueda.add(mesh(cylZ(0.43, 0.1, 24), f, [Math.cos(a) * 1.25, Math.sin(a) * 1.25, 0])); });
    g.add(mesh(cylZ(0.5, 0.9, 24), negroMate, [c.x, c.y, c.z - 0.6]));
    g.add(mesh(box(0.6, c.y - 0.5 - YB, 0.6), anod, [c.x, (c.y - 0.5 + YB) / 2, c.z - 0.6]));
    refs.ruedaFiltro = rueda;
  }

  /* ---------------- DOBLE HAZ ---------------- */
  {
    const g = makePart(A, 'espejos_planos', L2([0, 10, 0]));
    for (const [p, din, dout] of [[P.M3, V(0, 0, -1), V(1, 0, 0)], [P.M4, V(0, 0, 1), V(1, 0, 0)]]) {
      const h = soporte(g, p, normalEspejo(din, dout));
      h.add(mesh(rbox(2.0, 2.0, 0.3, 0.06), espejo, [0, 0, -0.15]));
    }
  }
  {
    // divisor de haz: lámina semirreflectante; el haz transmitido sigue hacia la cubeta de referencia y el reflejado va al haz de muestra
    const g = makePart(A, 'divisor_haz', L2([0, 13, -4]));
    const n = normalEspejo(V(1, 0, 0), V(0, 0, 1));
    const h = orientar(new THREE.Group(), n); h.position.copy(P.BS); g.add(h);
    const semi = M.vidrio.clone(); semi.color.setHex(0xc9d6e3); semi.opacity = 0.55; semi.metalness = 0.6;
    h.add(mesh(box(2.0, 2.0, 0.12), semi, [0, 0, 0]));
    const marco = new THREE.Shape(); marco.moveTo(-1.25, -1.25); marco.lineTo(1.25, -1.25); marco.lineTo(1.25, 1.25); marco.lineTo(-1.25, 1.25); marco.lineTo(-1.25, -1.25);
    const hueco = new THREE.Path(); hueco.moveTo(-1.0, -1.0); hueco.lineTo(-1.0, 1.0); hueco.lineTo(1.0, 1.0); hueco.lineTo(1.0, -1.0); hueco.lineTo(-1.0, -1.0); marco.holes.push(hueco);
    const mg = new THREE.ExtrudeGeometry(marco, { depth: 0.3, bevelEnabled: false }); mg.translate(0, 0, -0.15);
    h.add(mesh(mg, anod));
    g.add(mesh(cylY(0.28, BY - 1.25 - YB - 0.6, 16), M.aceroPulido, [P.BS.x, (BY - 1.25 + YB + 0.6) / 2, P.BS.z]));
    g.add(mesh(rbox(1.6, 0.6, 1.6, 0.15), anod, [P.BS.x, YB + 0.3, P.BS.z]));
  }

  /* ---------------- COMPARTIMENTO DE MUESTRAS ---------------- */
  {
    const g = makePart(A, 'compartimento', L2([0, -8, 0], true, { shell: true }));
    const { X0, X1, Z0, Z1, Y0, Y1 } = CM, cy = (Y0 + Y1) / 2, cz = (Z0 + Z1) / 2;
    const neg = M.carcasaOsc.clone(); neg.color.setHex(0x2b2f34);
    g.add(mesh(box(X1 - X0 + 0.8, 0.4, Z1 - Z0 + 0.8), neg, [(X0 + X1) / 2, Y0 - 0.2, (Z0 + Z1) / 2]));
    for (const [x, s] of [[X0 - 0.2, -1], [X1 + 0.2, 1]]) g.add(placaPasos(Z1 - Z0 + 0.8, Y1 - Y0, 0.4, [[ZS - cz, BY - cy, 0.75], [ZR - cz, BY - cy, 0.75]], neg, [x, cy, cz], 'zy', 0.2));
    for (const z of [Z0 - 0.2, Z1 + 0.2]) g.add(mesh(box(X1 - X0, Y1 - Y0, 0.4), neg, [(X0 + X1) / 2, cy, z]));
    // ventanas de cuarzo en los pasos de luz
    for (const x of [X0 - 0.2, X1 + 0.2]) for (const z of [ZS, ZR]) { const w = M.cuarzo.clone(); g.add(mesh(cylX(0.76, 0.06, 32), w, [x, BY, z])); }
    // rótulos S y R en el suelo, delante de cada portacubetas
    for (const [t, z] of [['S', ZS], ['R', ZR]]) {
      const m = new THREE.MeshStandardMaterial({ map: textTexture([t], { w: 64, h: 64, bg: '#2b2f34', fg: '#e8ebef', font: '700 44px Segoe UI' }), roughness: 0.6 });
      g.add(mesh(new THREE.PlaneGeometry(0.9, 0.9), m, [P.CX + 2.8, Y0 + 0.01, z + 2.2], [-Math.PI / 2, 0, 0]));
    }
  }
  {
    // portacubetas de 10 mm: pedestal, paredes con ventana a lo largo del haz y muelle lateral
    const g = makePart(A, 'portacubetas', L2([0, 4, 0]));
    const al = M.aluminio.clone(); al.color.setHex(0x9aa1a8);
    for (const z of [ZS, ZR]) {
      g.add(mesh(rbox(2.6, 9.4 - CM.Y0, 2.6, 0.2), al, [P.CX, (9.4 + CM.Y0) / 2, z]));
      for (const s of [-1, 1]) g.add(placaPasos(2.4, 3.4, 0.3, [[0, BY - 11.1, 0.42]], al, [P.CX + s * 0.83, 11.1, z], 'zy', 0.15));
      g.add(mesh(box(1.36, 3.4, 0.3), al, [P.CX, 11.1, z - 0.93]));
      g.add(mesh(box(1.0, 1.6, 0.2), M.aceroPulido, [P.CX, 11.6, z + 0.89]));
    }
  }
  {
    // cubetas de cuarzo de 10 mm de paso óptico: dos caras pulidas (paso de luz) y dos esmeriladas
    const crear = (id, z) => {
      const g = makePart(A, id, L2([0, 16, 0], false, { info: 'cubetas' }));
      const q = M.cuarzo.clone(); q.opacity = 0.3;
      const esm = M.vidrio.clone(); esm.color.setHex(0xf2f4f6); esm.opacity = 0.62; esm.roughness = 0.7;
      const y0 = 9.42, h = 4.5, y = y0 + h / 2;
      for (const s of [-1, 1]) g.add(mesh(box(0.125, h, 1.25), q, [P.CX + s * 0.5625, y, z]));
      for (const s of [-1, 1]) g.add(mesh(box(1.0, h, 0.125), esm, [P.CX, y, z + s * 0.5625]));
      g.add(mesh(box(1.0, 0.125, 1.0), q, [P.CX, y0 + 0.0625, z]));
      const liq = M.liquido.clone(); liq.color.setHex(0xe9f2fb); liq.opacity = 0.35; liq.depthWrite = false;
      const l = mesh(box(0.96, 3.0, 0.96), liq, [P.CX, y0 + 0.125 + 1.5, z]); l.userData.noSolid = true; g.add(l);
      g.add(mesh(rbox(1.3, 0.5, 1.3, 0.1), M.ptfe, [P.CX, y0 + h + 0.25, z]));
      return l;
    };
    refs.liqMuestra = crear('cubeta_muestra', ZS);
    refs.liqReferencia = crear('cubeta_referencia', ZR);
  }

  /* ---------------- DETECTORES ---------------- */
  {
    const g = makePart(A, 'detectores', L2([7, 6, 0]));
    g.add(mesh(rbox(2.4, 1.6, 15.4, 0.25), anod, [P.DX + 0.3, 7.5, (ZS + ZR) / 2]));
    for (const z of [-12, 2]) g.add(mesh(cylY(0.35, 6.7 - 1.5, 14), M.aceroOscuro, [P.DX + 0.3, (6.7 + 1.5) / 2, z]));
    for (const z of [ZS, ZR]) {
      g.add(mesh(rbox(2.4, 4.4, 2.6, 0.25), negroMate, [P.DX + 0.3, BY - 0.5, z]));
      g.add(mesh(cylX(0.7, 0.4, 32), M.aceroPulido, [P.DX - 1.1, BY, z]));
      const si = new THREE.MeshStandardMaterial({ color: 0x2c2f6a, metalness: 0.4, roughness: 0.25 });
      const d = mesh(new THREE.PlaneGeometry(0.62, 0.62), si, [P.DX - 1.31, BY, z], [0, -Math.PI / 2, 0]); d.userData.decal = true; g.add(d);
      g.add(mesh(rbox(0.25, 3.2, 2.2, 0.08), M.pcb, [P.DX + 1.62, BY - 0.6, z]));
      g.add(mesh(box(0.4, 0.8, 1.2), M.plasticoNegro, [P.DX + 1.94, BY + 0.6, z]));
    }
    refs.detPin = { S: V(P.DX + 2.14, BY + 0.6, ZS), R: V(P.DX + 2.14, BY + 0.6, ZR) };
    const glow = M.haz.clone(); glow.color.setHex(0x9ff0ff); glow.opacity = 0;
    refs.glowDet = [ZS, ZR].map((z) => { const s = mesh(new THREE.SphereGeometry(0.42, 20, 12), glow.clone(), [P.DX - 1.2, BY, z]); s.userData.noClone = true; s.castShadow = false; s.raycast = () => {}; g.add(s); return s; });
  }

  refs.group = A;
  return refs;
}
