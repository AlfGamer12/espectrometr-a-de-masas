// Equipo completo de doble enfoque (tipo Thermo DFS), con la disposición del equipo real: consola blanca (≈ 86 × 128 × 141 cm) con franja
// de rejillas oscuras bajo el techo, tira de losetas azules en el borde derecho del frente y rótulo "DFS"; a su izquierda, la columna
// cilíndrica gris grafito que aloja la fuente, y delante de ella la mesa oscura en voladizo con el cromatógrafo de gases sobre un
// mueble blanco. Dentro: analizador sobre plataforma antivibratoria, tres turbos, bombas rotatorias, fuentes del imán y de alta tensión,
// electrónica y enfriador opcional a la derecha.
// Coordenadas de mundo en cm. Frente hacia +Z; GC a la izquierda (-X).
import * as THREE from 'three';
import { M } from '../../materials.js';
import { mesh, rbox, box, cylX, cylY, cylZ, tubePath, grilleTexture, textTexture, screws, screenTexture, plateTexture, warningTexture, pasamuros } from '../../geom.js';
import { makePart, cableFlex } from '../../parts.js';
import { buildAnalizador, BORNE_IMAN, PASO_AT } from './analizador.js';
import { ORIGEN, AX } from './geometria.js';

const L1 = (offset, extra = {}) => ({ level: 1, offset, mode: 'equipo', ...extra });
const X0 = -20, X1 = 66, ZB = -86, ZF = 41.8, HB = 82, HT = 141;   // consola
const YW = HB + 0.3, YL = 124, YR = 135;                           // tapa: paredes desde YW, franja de rejillas YL–YR, techo YR–HT
const CX = -38, CZ = 22, CR = 26, CH = 146;                        // columna de la fuente: centro, radio y altura
const YJ = 86;                                                     // junta entre la columna fija (abajo) y la parte que se levanta con la tapa
/** Punto local del analizador → mundo (el grupo está girado 180° en X). */
const W = (p, off = new THREE.Vector3()) => new THREE.Vector3(ORIGEN.x + p.x, ORIGEN.y - p.y, ORIGEN.z - p.z).add(off);

// Puertos de las turbos (mundo), pasos de la plataforma (x, z, r) y cotas de los cables
const PUERTOS = [AX.M_IN.clone().add(new THREE.Vector3(-8, 0, 0)), AX.BETA_SLIT, AX.SLIT.clone().addScaledVector(AX.H2, -6)].map((p) => W(p));
const YT = ORIGEN.y - 7.5;                     // brida superior de las turbos
const BI = W(BORNE_IMAN), PA = W(PASO_AT);     // borne del imán y pasamuros de AT de la fuente
const DY0 = HB, DY1 = HB + 2.4;                // plataforma: caras inferior y superior
const PASOS = [...PUERTOS.map((w) => [w.x + 9, w.z, 1.2]), [BI.x, BI.z, 1.3], [PA.x, PA.z, 1.5]];
// paso de la línea de transferencia por la columna (ranura abierta por abajo en la parte que se levanta)
const AS = (131 * Math.PI) / 180, YN = 88, RN = 1.6;
const SL = new THREE.Vector3(CX + CR * Math.cos(AS), YN, CZ + CR * Math.sin(AS));

/** Ángulo θ de CylinderGeometry (x = r sin θ, z = r cos θ) para un ángulo φ medido desde +X hacia +Z. */
const TH = (phi) => Math.PI / 2 - phi;
/** Piel cilíndrica de la columna entre los ángulos φ0 → φ1 (φ creciente), de y0 a y1. */
function piel(phi0, phi1, y0, y1, r = CR, seg = 64) {
  const g = new THREE.CylinderGeometry(r, r, y1 - y0, seg, 1, true, TH(phi1), phi1 - phi0);
  g.translate(CX, (y0 + y1) / 2, CZ);
  return g;
}
// la columna se omite dentro de la consola (x > X0): φ ∈ (−φc, φc)
const PHC = Math.acos((X0 - CX) / CR);

/* ---------------- Texturas ---------------- */
function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; }
function tex(c) { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }
/** Lamas horizontales oscuras (franja bajo el techo y rejillas laterales). */
function lamas(rows = 6, bg = '#40454c', fg = '#1f2226') {
  const [c, g] = canvas(512, 128); g.fillStyle = bg; g.fillRect(0, 0, 512, 128);
  g.fillStyle = fg; for (let i = 0; i < rows; i++) g.fillRect(0, (128 / rows) * i + 3, 512, (128 / rows) * 0.5);
  const t = tex(c); t.wrapS = THREE.RepeatWrapping; return t;
}
/** Rótulo del frente: "DFS" en azul cursiva y subtítulo. */
function rotuloDFS() {
  const [c, g] = canvas(1024, 256); g.fillStyle = '#e8eaec'; g.fillRect(0, 0, 1024, 256);
  g.fillStyle = '#2f73b8'; g.font = 'italic 800 150px Arial, Helvetica, sans-serif'; g.textAlign = 'right'; g.textBaseline = 'alphabetic';
  g.fillText('DFS', 1000, 150);
  g.fillStyle = '#6b737c'; g.font = '500 40px Arial, Helvetica, sans-serif'; g.fillText('High Resolution Magnetic Sector GC-MS', 1000, 215);
  return tex(c);
}
/** Placa roja con el nombre del fabricante (texto). */
function placaRoja(t1 = 'Thermo', t2 = 'SCIENTIFIC') {
  const [c, g] = canvas(512, 160); g.fillStyle = '#d0202a'; g.beginPath(); g.roundRect(0, 0, 512, 160, 18); g.fill();
  g.fillStyle = '#ffffff'; g.font = '700 82px Georgia, "Times New Roman", serif'; g.textAlign = 'center'; g.fillText(t1, 256, 92);
  g.font = '600 30px Arial'; g.fillText(t2, 256, 138);
  return tex(c);
}

export function buildEquipo(root) {
  const refs = {};
  const BLANCO = M.carcasa.clone(); BLANCO.color.setHex(0xe8eaec);
  const GRAF = new THREE.MeshPhysicalMaterial({ color: 0x3c4148, metalness: 0.1, roughness: 0.48, clearcoat: 0.3, clearcoatRoughness: 0.4, side: THREE.DoubleSide });
  const AZUL = new THREE.MeshPhysicalMaterial({ color: 0x4f93d3, metalness: 0.05, roughness: 0.35, clearcoat: 0.6, clearcoatRoughness: 0.25 });
  const BANDA = new THREE.MeshStandardMaterial({ color: 0xffffff, map: lamas(7), roughness: 0.55, metalness: 0.2 });
  const xc = (X0 + X1) / 2;

  /* ---------------- BASTIDOR Y PLATAFORMA ---------------- */
  {
    const g = makePart(root, 'chasis', L1([0, 0, 0]));
    g.add(mesh(rbox(X1 - X0, 6, ZF - ZB, 0.4), M.carcasaOsc, [xc, 3, (ZF + ZB) / 2]));
    g.add(mesh(cylY(CR + 0.4, 5.6, 64), M.carcasaOsc, [CX, 2.8, CZ]));                       // zócalo de la columna
    for (const x of [X0 + 6, X1 - 6]) for (const z of [ZB + 6, ZF - 6]) g.add(mesh(cylY(2.4, 0.6, 24), M.goma, [x, -0.3 + 0.6, z]));
    // plataforma: rectángulo de la consola más el círculo de la columna, con pasos de mangueras y cables
    const s = new THREE.Shape(), xa = X0 + 3, xb = X1 - 3, za = ZB + 3, zb = ZF - 3, rp = CR - 2;
    const dzc = Math.sqrt(rp * rp - (xa - CX) ** 2), a0 = Math.atan2(dzc, xa - CX);
    s.moveTo(xa, -za); s.lineTo(xb, -za); s.lineTo(xb, -zb); s.lineTo(xa, -zb); s.lineTo(xa, -(CZ + dzc));
    // arco por el lado izquierdo de la columna (en el plano de la forma y = −z, el sentido se invierte)
    s.absarc(CX, -CZ, rp, -a0, -(2 * Math.PI - a0), true);
    s.lineTo(xa, -za);
    for (const [x, z, r] of PASOS) { const h = new THREE.Path(); h.absarc(x, -z, r, 0, Math.PI * 2, true); s.holes.push(h); }
    const pg = new THREE.ExtrudeGeometry(s, { depth: 2.4, bevelEnabled: false, curveSegments: 32 }); pg.translate(0, 0, -1.2);
    g.add(mesh(pg, M.aluminio, [0, HB + 1.2, 0], [-Math.PI / 2, 0, 0]));
    for (const [x, z, r] of PASOS) for (const y of [DY0, DY1]) g.add(pasamuros(r, M.goma, [x, y, z], 'y', 0.45));
    for (const [x, z] of [[X0 + 12, ZB + 12], [X1 - 12, ZB + 12], [X0 + 12, ZF - 12], [X1 - 12, ZF - 12], [CX - 14, CZ - 16]]) {
      g.add(mesh(cylY(2.6, 3, 24), M.goma, [x, HB - 1.5, z]));
      g.add(mesh(cylY(1.4, 3.4, 24), M.aceroPulido, [x, HB - 4.6, z]));
    }
    for (const x of [X0 + 3, X1 - 3]) for (const z of [ZB + 3, ZF - 3]) g.add(mesh(box(3, HB - 6, 3), M.aluminio, [x, (HB + 6) / 2, z]));
  }
  {
    // parte fija de la columna (hasta la junta): piel gris grafito, rejillas de ventilación, junta de la puerta y cierre lateral
    const g = makePart(root, 'columna', L1([0, 0, 0], { info: 'consola', shell: true }));
    g.add(mesh(piel(PHC, 2 * Math.PI - PHC, 5.6, YJ), GRAF));
    const rej = new THREE.MeshStandardMaterial({ map: lamas(9, '#3c4148', '#15171a'), roughness: 0.6, transparent: false });
    g.add(mesh(piel(1.55, 2.25, 12, 34, CR + 0.06, 24), rej));
    g.add(mesh(piel(3.6, 4.3, 12, 34, CR + 0.06, 24), rej));
    const seam = mesh(box(0.25, YJ - 8, 0.3), M.plasticoNegro, [CX + (CR + 0.02) * Math.cos(1.95), (YJ + 8) / 2, CZ + (CR + 0.02) * Math.sin(1.95)]);
    seam.rotation.y = -1.95; g.add(seam);
    g.add(mesh(rbox(1.0, YW - 0.1 - 6, 9.2, 0.3), BLANCO, [X0 + 0.5, (YW - 0.1 + 6) / 2, -5 + 4.6]));       // cierre entre la columna y el lateral de la consola
  }

  /* ---------------- CONSOLA ---------------- */
  // losetas azules del borde derecho del frente (más anchas abajo); la junta entre puerta y tapa cae en un hueco
  const loseta = (g, i) => {
    const y0 = 6.95 + i * 5.8, yc = y0 + 2.6, u = (yc - 6) / 122, w = 5 + 7.5 * (1 - u) ** 1.3;
    g.add(mesh(rbox(w, 5.2, 0.5, 0.2), AZUL, [X1 - 0.8 - w / 2 - 1.6 * u * u, yc, ZF + 0.25]));
  };
  {
    const g = makePart(root, 'panel_frontal', L1([0, 0, 52], { shell: true, label: 'equipo' }));
    g.add(mesh(rbox(X1 - X0 + 0.2, HB - 6, 1.2, 0.5), BLANCO, [xc - 0.1, (HB + 6) / 2, ZF - 0.6]));
    for (let i = 0; i <= 12; i++) loseta(g, i);
    // cerradura de la puerta y pequeñas etiquetas
    g.add(mesh(rbox(1.4, 3.4, 0.6, 0.3), M.plasticoNegro, [X0 + 6, 46, ZF + 0.2]));
    const lab = new THREE.MeshStandardMaterial({ map: textTexture(['GC-HRMS · Doble enfoque'], { w: 512, h: 96, bg: '#dfe2e5', fg: '#5a626b', font: '500 40px Arial' }), roughness: 0.5 });
    g.add(mesh(new THREE.PlaneGeometry(14, 2.6), lab, [X0 + 12, 14, ZF + 0.02]));
  }
  {
    const g = makePart(root, 'tapa_analizador', L1([0, 64, 0], { shell: true, label: 'equipo' }));
    const hw = YL - YW, yc = (YW + YL) / 2, hb = YR - YL, yb = (YL + YR) / 2;
    // frente, lateral derecho, fondo y lateral izquierdo (solo detrás de la columna); franja de rejillas oscura encima
    g.add(mesh(rbox(X1 - X0 + 0.2, hw, 1.2, 0.4), BLANCO, [xc - 0.1, yc, ZF - 0.6]));
    g.add(mesh(rbox(1.2, hw, ZF - ZB - 2.4, 0.4), BLANCO, [X1 - 0.6, yc, (ZF + ZB) / 2]));
    g.add(mesh(rbox(X1 - X0, hw, 1.2, 0.4), BLANCO, [xc, yc, ZB + 0.6]));
    const zl = CZ - Math.sqrt(CR * CR - (X0 - CX) ** 2) + 0.4;
    g.add(mesh(rbox(1.2, hw, zl - ZB - 1.2, 0.4), BLANCO, [X0 + 0.6, yc, (zl + ZB + 1.2) / 2]));
    g.add(mesh(rbox(X1 - X0 + 0.2, hb, 1.2, 0.3), M.carcasaOsc, [xc - 0.1, yb, ZF - 0.6]));
    g.add(mesh(rbox(1.2, hb, ZF - ZB - 2.4, 0.3), M.carcasaOsc, [X1 - 0.6, yb, (ZF + ZB) / 2]));
    g.add(mesh(rbox(X1 - X0, hb, 1.2, 0.3), M.carcasaOsc, [xc, yb, ZB + 0.6]));
    g.add(mesh(rbox(1.2, hb, zl - ZB - 1.2, 0.3), M.carcasaOsc, [X0 + 0.6, yb, (zl + ZB + 1.2) / 2]));
    g.add(mesh(new THREE.PlaneGeometry(X1 - X0 - 1.4, hb - 1.2), BANDA, [xc, yb, ZF + 0.02]));
    g.add(mesh(new THREE.PlaneGeometry(ZF - ZB - 3.6, hb - 1.2), BANDA, [X1 + 0.02, yb, (ZF + ZB) / 2], [0, Math.PI / 2, 0]));
    // techo con escotadura curva donde sube la columna (bisel suave)
    {
      const s = new THREE.Shape(), xa = X0 - 0.2, xb = X1 + 0.2, za = ZB - 0.2, zb = ZF + 0.2, rn = CR + 1.0;
      // la escotadura corta el borde frontal (xf) y el lateral izquierdo (xa); el arco pasa por el lado de la consola
      const xf = CX + Math.sqrt(rn * rn - (zb - CZ) ** 2), aF = Math.atan2(-(zb - CZ), xf - CX);
      const dz = Math.sqrt(rn * rn - (xa - CX) ** 2), aL = Math.atan2(dz, xa - CX);
      s.moveTo(xa, -za); s.lineTo(xb, -za); s.lineTo(xb, -zb); s.lineTo(xf, -zb);
      s.absarc(CX, -CZ, rn, aF, aL, false);
      s.lineTo(xa, -za);
      const tg = new THREE.ExtrudeGeometry(s, { depth: HT - YR - 1.6, bevelEnabled: true, bevelSize: 0.8, bevelThickness: 0.8, bevelSegments: 3, curveSegments: 40 });
      tg.translate(0, 0, -(HT - YR - 1.6) / 2);
      g.add(mesh(tg, BLANCO, [0, (YR + HT) / 2, 0], [-Math.PI / 2, 0, 0]));
      const gm = BLANCO.clone(); gm.map = grilleTexture(30, 8); gm.color.setHex(0x9aa0a8);
      g.add(mesh(new THREE.PlaneGeometry(50, 16), gm, [22, HT + 0.03, -50], [-Math.PI / 2, 0, 0]));
    }
    for (let i = 13; i <= 19; i++) loseta(g, i);
    const rm = new THREE.MeshPhysicalMaterial({ map: rotuloDFS(), roughness: 0.45, clearcoat: 0.2 });
    g.add(mesh(new THREE.PlaneGeometry(30, 7.5), rm, [X1 - 25, YL - 6.5, ZF + 0.02]));
    // parte de la columna que se levanta con la tapa: banda inferior con la ranura, tramo medio y remate completo con tapa
    const dA = RN / CR + 0.004;
    g.add(mesh(piel(PHC, AS - dA, YJ, YN + RN + 0.8), GRAF));
    g.add(mesh(piel(AS + dA, 2 * Math.PI - PHC, YJ, YN + RN + 0.8), GRAF));
    g.add(mesh(piel(PHC, 2 * Math.PI - PHC, YN + RN + 0.8, YR - 1), GRAF));
    g.add(mesh(piel(0, 2 * Math.PI, YR - 1, CH, CR, 96), GRAF));
    g.add(mesh(cylY(CR - 0.05, 0.8, 96), GRAF, [CX, CH - 0.65, CZ]));
    g.add(mesh(new THREE.TorusGeometry(CR - 0.5, 0.5, 10, 96), GRAF, [CX, CH - 0.2, CZ], [Math.PI / 2, 0, 0]));
    // perfil de goma en los bordes de la ranura
    for (const s2 of [-1, 1]) { const a = AS + s2 * dA;
      g.add(mesh(cylY(0.2, YN + RN + 0.8 - YJ, 8), M.goma, [CX + CR * Math.cos(a), (YJ + YN + RN + 0.8) / 2, CZ + CR * Math.sin(a)])); }
    // placa roja del fabricante en lo alto de la columna
    const pb = 1.95, pr = new THREE.MeshPhysicalMaterial({ map: placaRoja(), roughness: 0.35, clearcoat: 0.6 });
    const pm = mesh(new THREE.PlaneGeometry(9, 2.8), pr, [CX + (CR + 0.15) * Math.cos(pb), CH - 4.5, CZ + (CR + 0.15) * Math.sin(pb)]);
    pm.rotation.y = Math.PI / 2 - pb; g.add(pm);
  }
  {
    const g = makePart(root, 'panel_trasero', L1([0, 0, -50], { info: 'consola', shell: true }));
    g.add(mesh(rbox(X1 - X0, HB - 6, 1.0, 0.4), BLANCO, [xc, (HB + 6) / 2, ZB + 0.5]));
    const plate = new THREE.MeshStandardMaterial({ map: plateTexture(['GC-HRMS · Doble enfoque', '230/400 V 3~ 25 A', 'Modelo didáctico', 'Explorador 3D']), metalness: 0.6, roughness: 0.4 });
    g.add(mesh(new THREE.PlaneGeometry(10, 5), plate, [40, 60, ZB - 0.03], [0, Math.PI, 0]));
    for (const x of [0, 6]) g.add(mesh(cylZ(0.9, 3, 24), M.aceroPulido, [x, 20, ZB - 1.5]));     // agua de refrigeración
    g.add(mesh(rbox(5, 4, 1.2, 0.3), M.plasticoNegro, [-10, 16, ZB - 0.6]));
    const gm = BLANCO.clone(); gm.map = grilleTexture(30, 8);
    g.add(mesh(new THREE.PlaneGeometry(60, 14), gm, [25, 40, ZB - 0.03], [0, Math.PI, 0]));
    // cable de alimentación hasta el suelo
    g.add(mesh(tubePath([[-10, 16, (ZB - 1.2)], [-10, 16, (ZB - 1.2) - 4], [-10 - 2, 10, (ZB - 1.2) - 9], [-10 - 5, 0.7, (ZB - 1.2) - 16], [-10 - 14, 0.7, (ZB - 1.2) - 36]], 0.45, 40, 10), M.cable));
  }
  {
    const g = makePart(root, 'panel_der', L1([34, 0, 0], { info: 'consola', shell: true }));
    g.add(mesh(rbox(1.0, HB - 6, ZF - ZB - 2.4, 0.4), BLANCO, [X1 - 0.5, (HB + 6) / 2, (ZF + ZB) / 2]));
    const lm = new THREE.MeshStandardMaterial({ map: lamas(10, '#d4d7db', '#5d646c'), roughness: 0.6 });
    g.add(mesh(new THREE.PlaneGeometry(26, 12), lm, [X1 + 0.03, 16, -50], [0, Math.PI / 2, 0]));
    g.add(mesh(new THREE.PlaneGeometry(26, 12), lm, [X1 + 0.03, 66, -50], [0, Math.PI / 2, 0]));
    g.add(mesh(rbox(0.5, 12, 3.2, 0.2), M.plasticoNegro, [X1 + 0.2, 52, 22]));                // asa empotrada
    const w = new THREE.MeshStandardMaterial({ map: warningTexture('CAMPO MAGNÉTICO · ALTA TENSIÓN'), roughness: 0.45 });
    g.add(mesh(new THREE.PlaneGeometry(14, 5.2), w, [X1 + 0.03, 40, 22], [0, Math.PI / 2, 0]));
  }
  {
    // lateral izquierdo de la consola, detrás de la columna
    const g = makePart(root, 'panel_izq', L1([-20, 0, 0], { info: 'consola', shell: true }));
    g.add(mesh(rbox(1.0, HB - 6, -5 - ZB - 1.2, 0.4), BLANCO, [X0 + 0.5, (HB + 6) / 2, (-5 + ZB + 1.2) / 2]));
    const gm = BLANCO.clone(); gm.map = grilleTexture(30, 8);
    g.add(mesh(new THREE.PlaneGeometry(50, 14), gm, [X0 - 0.03, 30, -48], [0, -Math.PI / 2, 0]));
    screws(g, M.tornillo, M.tornilloNegro, 0.3, '-x', [[X0 - 0.02, HB - 4, ZB + 4], [X0 - 0.02, HB - 4, -9], [X0 - 0.02, 10, ZB + 4], [X0 - 0.02, 10, -9]]);
  }

  /* ---------------- VACÍO ---------------- */
  {
    // al explosionar suben (el analizador sube más): no atraviesan la plataforma
    const g = makePart(root, 'bombas_turbo', L1([0, 10, 0], { label: 'equipo' }));
    PUERTOS.forEach((w) => {
      const y = YT;
      g.add(mesh(cylY(4.6, 0.8, 40), M.aceroPulido, [w.x, y - 0.4, w.z]));
      g.add(mesh(cylY(4.2, 11, 40), M.aluminio, [w.x, y - 6.3, w.z]));
      g.add(mesh(cylY(4.3, 0.4, 40), M.aceroOscuro, [w.x, y - 4, w.z]));
      g.add(mesh(rbox(7, 3.4, 7, 0.4), M.anodizado, [w.x, y - 13.5, w.z]));
      g.add(mesh(cylX(0.8, 3, 20), M.aceroPulido, [w.x + 5, y - 10, w.z]));
    });
  }
  // entradas de las bombas rotatorias: dos en la de x = −4 y una en la de x = 20
  const ENTRADAS = [[-4, 30], [20, 30], [-1, 24]];
  {
    const g = makePart(root, 'bombas_rotatorias', L1([0, 0, 40], { label: 'equipo' }));
    for (const x of [-4, 20]) {
      g.add(mesh(rbox(12, 13, 20, 0.6), M.anodizado, [x, 12.5, 30]));
      g.add(mesh(cylZ(5.5, 12, 40), M.carcasaOsc, [x, 12, 16]));
    }
    for (const [x, z] of ENTRADAS) g.add(mesh(cylY(1.0, 3, 20), M.aceroPulido, [x, 20.5, z]));
  }
  {
    // mangueras de vacío previo: salida de la turbo → paso de la plataforma → entrada de la rotatoria
    const g = makePart(root, 'lineas_vacio', L1([0, 0, 0], { info: 'bombas_rotatorias' }));
    PUERTOS.forEach((w, i) => {
      const yE = YT - 10, hx = w.x + 9, [bx, bz] = ENTRADAS[i];
      cableFlex(g, [
        [w.x + 6.2, yE, w.z, 'bombas_turbo'], [w.x + 8.2, yE - 0.3, w.z, 'bombas_turbo'], [hx, yE - 2.2, w.z, 'bombas_turbo'],
        [hx, DY1 + 1.6, w.z, 'chasis'], [hx, DY0 - 1.6, w.z, 'chasis'], [hx, DY0 - 7, w.z],
        [(hx + bx) / 2, 50, (w.z + bz) / 2], [bx, 28, bz, 'bombas_rotatorias'], [bx, 21.6, bz, 'bombas_rotatorias'],
      ], 0.6, M.ptfe, { seg: 96 });
    });
  }

  /* ---------------- ELECTRÓNICA ---------------- */
  {
    const g = makePart(root, 'fuente_iman', L1([0, 0, 30], { label: 'equipo' }));
    g.add(mesh(rbox(24, 44, 30, 0.6), M.anodizado, [49, 30, 22]));
    for (let i = 0; i < 12; i++) g.add(mesh(box(20, 0.4, 1.4), M.aluminio, [49, 12 + i * 3, 37.4]));
    g.add(mesh(cylY(1.4, 2.4, 24), M.plasticoNegro, [49, 53.2, 22]));                        // conector de salida
    // cable de las bobinas: conector → bajo la plataforma → paso → borne del imán
    cableFlex(g, [[49, 54.0, 22], [49, 60, 22], [44, 70, 28, 'chasis'], [28, 78, 30, 'chasis'], [BI.x, DY0 - 1.6, BI.z, 'chasis'], [BI.x, DY1 + 1.6, BI.z, 'chasis'],
      [BI.x, BI.y - 6, BI.z, 'iman'], [BI.x, BI.y, BI.z, 'iman']], 0.7, M.cable, { seg: 96 });
  }
  {
    const g = makePart(root, 'fuente_alta_tension', L1([0, 0, -30], { label: 'equipo' }));
    g.add(mesh(rbox(24, 30, 24, 0.6), M.anodizado, [49, 22, -40]));
    const w = new THREE.MeshStandardMaterial({ map: warningTexture('ALTA TENSIÓN 5 kV'), roughness: 0.45 });
    g.add(mesh(new THREE.PlaneGeometry(10, 3.8), w, [61.05, 28, -40], [0, Math.PI / 2, 0]));
    // tres cables de AT: bornes cerámicos → bajo la plataforma → paso → pasamuros de la fuente de iones (dentro de la columna)
    for (let i = 0; i < 3; i++) {
      const zi = -44 + i * 4, dz = (i - 1) * 0.7;
      g.add(mesh(cylY(0.8, 2.4, 20), M.ceramica, [44, 38.2, zi]));
      cableFlex(g, [[44, 39.0, zi], [44, 46, zi], [38, 64, zi + 8, 'chasis'], [0, 76, 4 + dz * 2, 'chasis'], [-38, 79.4, 18 + dz, 'chasis'],
        [PA.x, DY0 - 1.6, PA.z + dz, 'chasis'], [PA.x, DY1 + 1.6, PA.z + dz, 'chasis'], [PA.x, PA.y - 6, PA.z + dz, 'fuente_ei'], [PA.x, PA.y, PA.z + dz, 'fuente_ei']], 0.3, M.ptfe, { seg: 120, radial: 8 });
    }
  }
  {
    const g = makePart(root, 'electronica_control', L1([0, 0, -30], { label: 'equipo' }));
    g.add(mesh(rbox(44, 40, 0.25, 0.05), M.pcb, [20, 36, ZB + 4]));
    const rnd = (() => { let a = 3; return () => ((a = (a * 16807) % 2147483647) / 2147483647); })();
    for (let i = 0; i < 50; i++) {
      const x = 0 + rnd() * 40, y = 18 + rnd() * 36;
      if (rnd() < 0.65) g.add(mesh(box(1 + rnd(), 1 + rnd(), 0.25), M.chip, [x, y, ZB + 4.25])); else g.add(mesh(cylZ(0.4, 1, 16), M.condensador, [x, y, ZB + 4.6]));
    }
    screws(g, M.tornillo, M.tornilloNegro, 0.3, 'z', [[-1, 55, ZB + 4.15], [41, 55, ZB + 4.15], [-1, 17, ZB + 4.15], [41, 17, ZB + 4.15]]);
  }
  {
    // enfriador opcional a la derecha de la consola; al explosionar se aleja hacia la derecha y atrás
    const g = makePart(root, 'enfriador', L1([40, 0, -24], { label: 'equipo' }));
    const ex = 88;
    g.add(mesh(rbox(30, 52, 44, 0.8), BLANCO, [ex, 26, -40]));
    const gm = BLANCO.clone(); gm.map = grilleTexture(24, 8);
    g.add(mesh(new THREE.PlaneGeometry(24, 28), gm, [ex, 29, -17.95]));
    const sc = new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0xffffff, emissiveIntensity: 0.8, emissiveMap: screenTexture([['Agua', '20,0 °C'], ['Caudal', '13 L/min']], { title: 'Chiller' }) });
    g.add(mesh(new THREE.PlaneGeometry(10, 4), sc, [ex, 46, -17.9]));
    // mangueras de agua: racor del enfriador → hueco entre equipos → por detrás de la consola → racor del panel trasero
    for (const [y, c, xr] of [[20, M.acento, 6], [24, M.etiquetaAmarilla, 0]]) {
      g.add(mesh(cylX(0.9, 2.2, 20), M.aceroPulido, [ex - 15.6, y, -40]));
      const pt = 'panel_trasero';
      cableFlex(g, [[ex - 16.6, y, -40], [ex - 18.2, y, -42.5], [ex - 18.4, y, -60], [ex - 18.4, y, -78],
        [ex - 20, y, ZB - 6, pt], [X1 - 4, y, ZB - 7.5, pt], [xr + 8, y, ZB - 7.5, pt], [xr + 2.5, y - (y - 20) * 0.1, ZB - 7, pt],
        [xr, 20 + (y - 20) * 0.25, ZB - 5.5, pt], [xr, 20, ZB - 4.2, pt], [xr, 20, ZB - 2.6, pt]], 0.7, c, { seg: 140 });
    }
  }

  /* ---------------- CROMATÓGRAFO, MESA Y ENTRADAS ---------------- */
  const GX0 = -130, GX1 = -86, GZ0 = 52, GZ1 = 98, GY0 = 75, GY1 = 121;
  {
    const g = makePart(root, 'gc', L1([-30, 0, 0], { shell: true, label: 'equipo' }));
    // mesa oscura en voladizo delante de la columna, mueble blanco bajo el GC, pata y escuadra de apoyo
    g.add(mesh(rbox(114, 3, 52, 1.2), M.carcasaOsc, [-79, GY0 - 1.5, 75]));
    g.add(mesh(rbox(30, GY0 - 3, 42, 0.6), BLANCO, [-104, (GY0 - 3) / 2, 77]));
    const rib = new THREE.MeshStandardMaterial({ color: 0xc4c8cd, roughness: 0.6 });
    for (let i = 1; i < 12; i++) g.add(mesh(new THREE.PlaneGeometry(29, 0.25), rib, [-104, i * 6, 98.02]));
    g.add(mesh(cylY(1.2, GY0 - 3, 24), M.aceroPulido, [-131, (GY0 - 3) / 2, 94]));
    g.add(mesh(rbox(28, 6, 8, 0.6), M.carcasaOsc, [-42, GY0 - 6, 53]));
    // cromatógrafo (tipo TRACE 1310): cuerpo blanco, costado azul con rejilla, puerta del horno, pantalla táctil, inyector y automuestreador
    const gw = GX1 - GX0, gd = GZ1 - GZ0, gh = GY1 - GY0, gxc = (GX0 + GX1) / 2, gzc = (GZ0 + GZ1) / 2, gyc = (GY0 + GY1) / 2;
    g.add(mesh(rbox(gw, gh, gd, 0.8), BLANCO, [gxc, gyc, gzc]));
    g.add(mesh(rbox(1.2, gh - 1, gd - 1, 0.4), AZUL, [GX1 + 0.1, gyc, gzc]));
    const gr = AZUL.clone(); gr.map = grilleTexture(20, 10); gr.color.setHex(0xbcd6ee);
    g.add(mesh(new THREE.PlaneGeometry(gd - 14, gh - 16), gr, [GX1 + 0.72, gyc - 2, gzc], [0, Math.PI / 2, 0]));
    g.add(mesh(rbox(29, 31, 1.0, 0.5), M.grisClaro, [GX0 + 16, GY0 + 18, GZ1 + 0.3]));          // puerta del horno
    g.add(mesh(rbox(1.0, 16, 1.2, 0.4), M.carcasaOsc, [GX0 + 29.4, GY0 + 18, GZ1 + 1.0]));
    const tr = new THREE.MeshPhysicalMaterial({ map: placaRoja(), roughness: 0.35, clearcoat: 0.6 });
    g.add(mesh(new THREE.PlaneGeometry(6, 1.9), tr, [GX0 + 6.5, GY1 - 4, GZ1 + 0.02]));
    g.add(mesh(rbox(11, 8, 0.6, 0.3), M.negroBrillante, [GX1 - 7.5, GY1 - 11, GZ1 + 0.2]));
    const sc = new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0xffffff, emissiveIntensity: 0.8, emissiveMap: screenTexture([['Horno', '310 °C'], ['Inyector', '280 °C'], ['Línea', '300 °C']], { title: 'TRACE · GC' }) });
    g.add(mesh(new THREE.PlaneGeometry(10, 6.8), sc, [GX1 - 7.5, GY1 - 11, GZ1 + 0.52]));
    g.add(mesh(rbox(10, 2.4, 10, 0.4), M.carcasaOsc, [GX0 + 12, GY1 + 1.2, GZ0 + 16]));          // módulo del inyector
    g.add(mesh(cylY(1.2, 2.6, 24), M.acero, [GX0 + 12, GY1 + 3.7, GZ0 + 16]));
    g.add(mesh(rbox(10, 3, 10, 0.4), M.carcasaOsc, [GX0 + 30, GY1 + 1.5, GZ0 + 16]));          // módulo del detector auxiliar
    // automuestreador
    g.add(mesh(rbox(8, 26, 8, 0.6), BLANCO, [GX0 + 12, GY1 + 13, GZ0 + 6]));
    g.add(mesh(rbox(8.2, 3, 8.2, 0.6), AZUL, [GX0 + 12, GY1 + 27.5, GZ0 + 6]));
    g.add(mesh(rbox(3, 2, 10, 0.4), M.carcasaOsc, [GX0 + 12, GY1 + 22, GZ0 + 13]));
    g.add(mesh(cylY(7, 1.6, 48), M.plata, [GX0 + 26, GY1 + 12, GZ0 + 8]));
    g.add(mesh(cylY(1.0, 11, 16), M.aceroPulido, [GX0 + 26, GY1 + 5.7, GZ0 + 8]));
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2;
      g.add(mesh(cylY(0.6, 1.4, 12), i % 3 ? M.cableGris : M.peekRojo, [GX0 + 26 + Math.cos(a) * 5.4, GY1 + 13.5, GZ0 + 8 + Math.sin(a) * 5.4])); }
    // salida de la línea de transferencia en el costado derecho
    g.add(mesh(cylX(1.5, 2.4, 24), M.aceroPulido, [GX1 + 1.9, 92, 66]));
  }
  {
    const g = makePart(root, 'linea_transferencia', L1([-12, 0, 0], { label: 'equipo' }));
    // costado del GC → ranura de la columna (a la altura de la junta) → por detrás de la fuente hasta el capilar
    const c = W(new THREE.Vector3(-2.2, 0, 5.6)), n = new THREE.Vector3(Math.cos(AS), 0, Math.sin(AS));
    cableFlex(g, [[GX1 + 3.15, 92, 66, 'gc'], [GX1 + 6, 91.4, 64.5], [SL.x + n.x * 9, YN + 0.6, SL.z + n.z * 9], [SL.x + n.x * 2.5, YN, SL.z + n.z * 2.5],
      [SL.x - n.x * 2.5, YN, SL.z - n.z * 2.5], [-55, 92, 32], [-56.5, 99, 20], [-53.5, 104, 12, 'fuente_ei'],
      [c.x - 1.4, c.y - 1.1, c.z - 3.2, 'fuente_ei'], [c.x, c.y, c.z - 1.2, 'fuente_ei'], [c.x, c.y, c.z + 0.4, 'fuente_ei']], 1.1, M.aislanteTerm, { seg: 110, radial: 14 });
  }
  {
    // sube algo menos que el analizador: el tubo hasta la fuente queda casi horizontal
    const g = makePart(root, 'entrada_referencia', L1([0, 22, 0], { label: 'equipo' }));
    const p = W(new THREE.Vector3(-2.2, 0.9, -6));
    g.add(mesh(rbox(4, 4, 4, 0.4), M.acero, [p.x - 3, p.y + 5, p.z + 3]));
    g.add(mesh(cylY(1.2, 4, 24), M.vidrio, [p.x - 3, p.y + 9, p.z + 3]));
    g.add(mesh(cylY(1.05, 2, 24), M.liquido, [p.x - 3, p.y + 8.2, p.z + 3]));
    // del frente del depósito a la toma de referencia de la fuente (cylZ local z −4,9…−1,9)
    cableFlex(g, [[p.x - 3, p.y + 4.2, p.z + 1.2], [p.x - 2.4, p.y + 3.3, p.z], [p.x - 0.4, p.y + 0.5, p.z - 0.4, 'fuente_ei'], [p.x, p.y, p.z - 1.4, 'fuente_ei']], 0.2, M.aceroPulido, { seg: 40, radial: 8 });
  }

  refs.analyzer = buildAnalizador(root);

  // todos los cables son cableFlex: se recalculan solos al explosionar
  refs.update = () => {};
  return refs;
}
