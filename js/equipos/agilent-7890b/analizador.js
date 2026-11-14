// Modo «Inyector, columna y FID»: mecanismo del inyector automático 7693A (torreta, jeringa, carro), inyector split/splitless
// (tuerca, septum, cabeza, liner, bloque, base), módulos EPC con sus líneas, columna capilar en su jaula con el ventilador y la
// resistencia del horno, y detector de ionización de llama (base, chorro, colector, cuerpo, encendedor, electrómetro).
// Todas las piezas cuelgan del grupo raíz en coordenadas de mundo (cm), a escala real; se ven también en el equipo completo.
import * as THREE from 'three';
import { M } from '../../materials.js';
import { mesh, rbox, box, cylX, cylY, cylZ, helix, washerX, screws } from '../../geom.js';
import { makePart, cableFlex } from '../../parts.js';
import { INY, DET, COL, FAN, IY, FY, ALS, V } from './geometria.js';

const L2 = (offset, label = true, extra = {}) => ({ level: 2, offset, mode: 'analizador', label: label ? 'analizador' : null, ...extra });

/** Tubo hueco de eje Y entre y0 e y1 (torneado). */
function tuboY(rIn, rOut, y0, y1, seg = 40, phi0 = 0, phiL = Math.PI * 2) {
  const p = [[rIn, y0], [rOut, y0], [rOut, y1], [rIn, y1], [rIn, y0]].map(([r, y]) => new THREE.Vector2(r, y));
  return new THREE.LatheGeometry(p, seg, phi0, phiL);
}
/** Arandela de eje Y (extrusión con agujero). */
const arandelaY = (rOut, rIn, t) => { const g = washerX(rOut, rIn, t); g.rotateZ(Math.PI / 2); return g; };
/** Disco horizontal (plano XZ) de radio R y espesor t, con agujeros [x, z, r] y, opcionalmente, una muesca centrada en +X. */
function disco(R, t, agujeros, muesca) {
  const s = new THREE.Shape();
  if (muesca) {
    const [h, ri] = muesca;
    s.absarc(0, 0, R, h, Math.PI * 2 - h, false);
    s.lineTo(ri * Math.cos(-h), ri * Math.sin(-h));
    s.absarc(0, 0, ri, -h, h, false);
    s.lineTo(R * Math.cos(h), R * Math.sin(h));
  } else s.absarc(0, 0, R, 0, Math.PI * 2, false);
  for (const [x, z, r] of agujeros) { const p = new THREE.Path(); p.absarc(x, -z, r, 0, Math.PI * 2, true); s.holes.push(p); }
  const g = new THREE.ExtrudeGeometry(s, { depth: t, bevelEnabled: false, curveSegments: 40 }); g.translate(0, 0, -t / 2);
  return g;
}
const eficaz = (mat, extra = {}) => Object.assign(mat.clone(), extra);

export function buildAnalizador(root) {
  const refs = {};
  const NEGRO = M.plasticoNegro;
  const VERDE = M.peekBeige.clone(); VERDE.color.setHex(0x6f9a63);                // septum
  const ORO = M.oro;
  const PTFE = M.ptfe;
  const AISL = M.aislanteTerm;
  const ix = INY.x, iz = INY.z, dx = DET.x, dz = DET.z;

  /* =================== INYECTOR AUTOMÁTICO 7693A (mecanismo) =================== */
  {
    // Torreta de 16 viales: disco inferior y portaviales con una muesca por la que baja la aguja hacia el inyector
    const g = makePart(root, 'als_torreta', L2([-14, 0, 4], true, { info: 'als_torreta' }));
    g.position.set(ALS.tx, 0, ALS.tz);
    const gir = new THREE.Group(); g.add(gir); refs.torreta = gir;
    const H = (24 * Math.PI) / 180, RI = 3.6;
    const ang = Array.from({ length: 16 }, (_, k) => ((36 + k * 18.67) * Math.PI) / 180);
    const vial = ang.map((a) => [Math.cos(a) * ALS.rVial, Math.sin(a) * ALS.rVial]);
    const bot = [45, 135, 225, 315].map((d) => [Math.cos((d * Math.PI) / 180) * 2.6, Math.sin((d * Math.PI) / 180) * 2.6]);
    const NT = M.carcasaOsc.clone(); NT.color.setHex(0x2b2e33);
    gir.add(mesh(disco(ALS.tR, 1.0, [], [H, RI]), NT, [0, ALS.t0 + 0.5, 0], [-Math.PI / 2, 0, 0]));
    gir.add(mesh(disco(ALS.tR - 0.2, 0.5, [...vial.map(([x, z]) => [x, z, 0.66]), ...bot.map(([x, z]) => [x, z, 0.95])], [H, RI]), NT, [0, 51.35, 0], [-Math.PI / 2, 0, 0]));
    const aro = NT.clone(); aro.side = THREE.DoubleSide;
    gir.add(mesh(tuboY(ALS.tR - 0.35, ALS.tR, 49.4, 51.0, 64, Math.PI / 2 + H, Math.PI * 2 - 2 * H), aro));
    const AZUL = M.acento.clone(); AZUL.color.setHex(0x2f6fb0);
    vial.forEach(([x, z], k) => {
      gir.add(mesh(cylY(0.6, 3.2, 20), M.vidrio, [x, 51.0, z]));
      gir.add(mesh(cylY(0.5, 1.3, 16), M.liquido, [x, 50.25, z]));
      gir.add(mesh(cylY(0.62, 0.6, 20), k % 4 ? NEGRO : AZUL, [x, 52.9, z]));
    });
    bot.forEach(([x, z]) => {
      gir.add(mesh(cylY(0.9, 4.0, 24), M.vidrio, [x, 51.4, z]));
      gir.add(mesh(cylY(0.8, 2.6, 20), M.disolvente, [x, 50.9, z]));
      gir.add(mesh(cylY(0.92, 0.6, 24), M.ptfe, [x, 53.7, z]));
    });
    // eje (fijo) y brazo hasta el pie de la torre
    g.add(mesh(cylY(1.4, 6.1, 32), NEGRO, [0, 51.55, 0]));
    g.add(mesh(rbox(2.4, 0.8, 8.2, 0.2), NEGRO, [0.8, 54.9, 8.4 - ALS.tz]));
  }
  {
    // Carro de la jeringa: placa de sujeción con pinzas, portaémbolo, husillo, guías y motor
    const g = makePart(root, 'als_carro', L2([0, 27, 0], true));
    const mov = new THREE.Group(); g.add(mov); refs.carro = mov;
    mov.add(mesh(rbox(2.4, 15, 0.6, 0.15), M.aluminio, [ix, 66.5, 10.6]));
    for (const y of [61.8, 65.6]) for (const s of [-1, 1]) mov.add(mesh(box(0.45, 0.9, 1.7), NEGRO, [ix + s * 0.68, y, 11.75]));
    const porta = new THREE.Group(); mov.add(porta); refs.porta = porta;
    porta.add(mesh(rbox(4.6, 1.0, 2.0, 0.15), NEGRO, [ix - 1.0, 71.4, 11.6]));
    g.add(mesh(cylY(0.25, 24, 16), M.aceroPulido, [ix - 2.8, 70, 11.2]));          // husillo
    g.add(mesh(cylY(0.2, 24, 16), M.aceroPulido, [ix + 2.2, 70, 10.6]));           // guía
    g.add(mesh(rbox(4.2, 3.6, 3.6, 0.3), NEGRO, [ix - 1.6, 83.8, 10.8]));          // motor paso a paso
    g.add(mesh(rbox(7.0, 26, 0.5, 0.2), M.aluminio, [ix, 70.5, 9.7]));             // placa de montaje
  }
  {
    // Jeringa de 10 µL: aguja, cono, cilindro de vidrio graduado, aletas y émbolo (que se mueve en la simulación)
    const g = makePart(root, 'als_jeringa', L2([0, 21, 0], true));
    const mov = new THREE.Group(); g.add(mov); refs.jeringa = mov;
    mov.add(mesh(cylY(0.036, ALS.aguja1 - ALS.aguja0, 8), M.aceroPulido, [ix, (ALS.aguja0 + ALS.aguja1) / 2, iz]));
    mov.add(mesh(cylY(0.28, 0.6, 16), M.aceroPulido, [ix, 60.8, iz]));
    mov.add(mesh(cylY(0.33, 5.4, 24), M.vidrio, [ix, 63.8, iz]));
    const muestra = mesh(cylY(0.14, 1.2, 12), M.liquido, [ix, 61.7, iz]); mov.add(muestra);
    refs.muestraJeringa = muestra;
    mov.add(mesh(rbox(1.8, 0.3, 0.9, 0.08), M.ptfe, [ix, 66.65, iz]));
    const emb = new THREE.Group(); mov.add(emb); refs.embolo = emb;
    emb.add(mesh(cylY(0.07, 6.4, 8), M.aceroPulido, [ix, 67.2, iz]));
    emb.add(mesh(cylY(0.32, 0.3, 20), M.ptfe, [ix, 70.55, iz]));
  }
  {
    // Pie de apoyo de la aguja: guía la aguja y apoya sobre la tuerca del septum durante la inyección
    const g = makePart(root, 'als_guia', L2([0, 15, 0], true));
    const mov = new THREE.Group(); g.add(mov); refs.pie = mov;
    mov.add(mesh(rbox(1.6, 1.2, 2.4, 0.2), NEGRO, [ix, 55.6, 11.4]));
    mov.add(mesh(cylY(0.15, 3.4, 10), M.aceroPulido, [ix, 57.9, 10.6]));
  }

  /* =================== INYECTOR SPLIT/SPLITLESS =================== */
  {
    const g = makePart(root, 'tuerca_septum', L2([0, 15.5, 0], true));
    g.add(mesh(cylY(1.0, IY.tuerca1 - IY.tuerca0, 32), M.acero, [ix, (IY.tuerca0 + IY.tuerca1) / 2, iz]));
    for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; g.add(mesh(box(0.12, 1.0, 0.12), M.aceroOscuro, [ix + Math.cos(a) * 1.0, 47.3, iz + Math.sin(a) * 1.0])); }
    g.add(mesh(cylY(0.25, 0.06, 16), NEGRO, [ix, IY.tuerca1 + 0.03, iz]));
  }
  {
    const g = makePart(root, 'septum', L2([0, 13, 0], true));
    g.add(mesh(cylY(0.55, IY.septum1 - IY.septum0, 24), VERDE, [ix, (IY.septum0 + IY.septum1) / 2, iz]));
  }
  {
    // Cabeza (inserto superior): entrada del portador y salidas de la purga del septum y del venteo de split
    const g = makePart(root, 'inyector_cabeza', L2([0, 11, 0], true));
    g.add(mesh(cylY(1.1, IY.cabeza1 - IY.cabeza0, 32), M.acero, [ix, (IY.cabeza0 + IY.cabeza1) / 2, iz]));
    for (const [x, y] of [[ix - 0.7, 45.55], [ix, 45.85], [ix + 0.7, 46.15]]) g.add(mesh(cylZ(0.2, 1.0, 12), M.aceroPulido, [x, y, iz - 1.4]));
  }
  {
    // Liner de vidrio desactivado (78,5 × 6,5 mm) con tapón de lana de vidrio y junta tórica
    const g = makePart(root, 'liner', L2([0, 9.5, 0], true));
    const vid = M.cuarzo.clone(); vid.opacity = 0.42;
    g.add(mesh(tuboY(0.2, 0.325, IY.liner0, IY.liner1, 28), vid, [ix, 0, iz]));
    g.add(mesh(cylY(0.19, 0.6, 16), M.ptfe, [ix, 41.8, iz]));
    g.add(mesh(new THREE.TorusGeometry(0.33, 0.06, 8, 24), NEGRO, [ix, 45.35, iz], [Math.PI / 2, 0, 0]));
    refs.liner = V(ix, 43.2, iz);
  }
  {
    // Bloque calefactado de aluminio, cuerpo del inyector y aislamiento
    const g = makePart(root, 'inyector_bloque', L2([0, 0, 0], true, { shell: true }));
    g.add(mesh(rbox(4.4, IY.bloque1 - IY.bloque0, 4.4, 0.3), M.aluminio, [ix, (IY.bloque0 + IY.bloque1) / 2, iz]));
    const cuerpo = M.aceroPulido.clone(); cuerpo.side = THREE.DoubleSide;
    g.add(mesh(tuboY(0.34, 0.55, IY.cuerpo0, IY.cuerpo1, 28), cuerpo, [ix, 0, iz]));
    g.add(mesh(cylX(0.3, 5.6, 16), M.aceroOscuro, [ix, 41.7, iz + 0.9]));      // cartucho calefactor
    g.add(mesh(cylX(0.15, 5.2, 12), M.aceroPulido, [ix, 41.7, iz - 1.2]));     // sensor de temperatura
    const ais = AISL.clone(); ais.transparent = true; ais.opacity = 0.55; ais.depthWrite = false;
    const cup = mesh(rbox(6.8, 4.6, 6.8, 0.6), ais, [ix, 42.85, iz]); cup.userData.noSolid = true; g.add(cup);
  }
  {
    const g = makePart(root, 'inyector_base', L2([0, -4, 0], true));
    g.add(mesh(cylY(0.75, IY.baseNut1 - IY.baseNut0, 6), M.acero, [ix, (IY.baseNut0 + IY.baseNut1) / 2, iz]));
    g.add(mesh(cylY(0.42, 0.12, 24), ORO, [ix, 37.92, iz]));
  }

  /* =================== NEUMÁTICA (EPC) =================== */
  const EPCMAT = M.carcasaOsc.clone(); EPCMAT.color.setHex(0x4a5059);
  const etiqueta = (s) => {
    const c = document.createElement('canvas'); c.width = 256; c.height = 64; const x = c.getContext('2d');
    x.fillStyle = '#d7dadd'; x.fillRect(0, 0, 256, 64); x.fillStyle = '#20252b'; x.font = '600 30px "Segoe UI", Arial'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(s, 128, 34);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return new THREE.MeshStandardMaterial({ map: t, roughness: 0.5 });
  };
  {
    const g = makePart(root, 'epc_inyector', L2([-4, 4, -10], true));
    g.add(mesh(rbox(9, 6, 11, 0.3), EPCMAT, [-19.5, 43.4, -18.5]));
    g.add(mesh(cylX(0.9, 1.4, 24), M.aluminio, [-14.3, 43.6, -21]));            // válvula proporcional
    g.add(mesh(cylX(0.6, 1.0, 20), M.aceroPulido, [-14.5, 42.0, -16.5]));       // sensor de presión
    g.add(mesh(rbox(2.0, 1.2, 0.6, 0.1), NEGRO, [-21, 42, -12.7]));              // conector
    g.add(mesh(new THREE.PlaneGeometry(4.2, 1.05), etiqueta('EPC · S/SL'), [-17.4, 41.5, -12.98]));
  }
  {
    const g = makePart(root, 'epc_detector', L2([4, 4, -10], true));
    g.add(mesh(rbox(9, 5, 11, 0.3), EPCMAT, [4.5, 43.1, -18.5]));
    for (const x of [2, 4.5, 7]) g.add(mesh(cylY(0.45, 1.0, 16), M.aceroPulido, [x, 46.1, -20]));   // restrictores (fritas)
    g.add(mesh(new THREE.PlaneGeometry(4.2, 1.05), etiqueta('EPC · FID'), [4.5, 44.6, -12.98]));
  }
  {
    const g = makePart(root, 'trampa_split', L2([-6, 0, 3], true));
    g.add(mesh(cylZ(0.9, 6, 24), M.aceroPulido, [-21, 44.6, -8]));
    for (const z of [-4.95, -11.05]) g.add(mesh(cylZ(1.05, 0.5, 6), M.acero, [-21, 44.6, z]));
  }

  /* =================== HORNO: COLUMNA, JAULA, VENTILADOR Y RESISTENCIA =================== */
  {
    const g = makePart(root, 'jaula_columna', L2([0, 0, 0], true));
    for (const z of [COL.z - 1.4, COL.z + 1.4]) g.add(mesh(new THREE.TorusGeometry(COL.R - 0.3, 0.1, 6, 96), M.aceroPulido, [COL.x, COL.y, z]));
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3, r = COL.R - 0.3;
      g.add(mesh(box(0.2, 0.2, 3.2), M.aceroPulido, [COL.x + Math.cos(a) * r, COL.y + Math.sin(a) * r, COL.z]));
    }
    // colgador: por detrás de la bobina, desde el aro trasero hasta la pared del horno
    g.add(mesh(box(1.0, 4.8, 0.5), M.aceroPulido, [COL.x, COL.y + COL.R + 2.0, COL.z - 1.8]));
    g.add(mesh(box(1.0, 0.3, 13.35), M.aceroPulido, [COL.x, COL.y + COL.R + 4.55, 0.775]));
  }
  // Recorrido de la columna (en reposo): inyector → espiral (de su extremo delantero al trasero) → FID
  const cx = COL.x, cy = COL.y, cz = COL.z, R = COL.R, Lh = COL.L;
  const tramoIny = [[ix, 37.2, iz, 'inyector_base'], [ix, 36.2, iz], [ix + 0.8, 33.6, iz - 0.2], [-8, 31.6, 11.6], [0, 31.0, 11.2], [6.5, 29.6, 10.9], [10.0, 25.6, 10.6], [9.9, 22.4, 10.4], [cx + R + 0.8, cy + 0.15, cz + Lh / 2 + 0.02], [cx + R, cy, cz + Lh / 2]];
  const tramoDet = [[cx + R, cy, cz - Lh / 2], [cx + R + 0.8, cy + 0.2, cz - Lh / 2 - 0.05], [9.9, 22.6, 7.75], [11.0, 27, 8.6], [10.0, 32.4, 10.8], [7.6, 35.6, 12.6], [dx, 36.8, dz], [dx, 37.8, dz, 'fid_base']];
  {
    const g = makePart(root, 'columna', L2([0, 0, 0], true));
    g.add(mesh(helix(R, Lh, COL.vueltas, 0.07, 1800), M.poliimida, [cx, cy, cz]));
    cableFlex(g, tramoIny, 0.07, M.poliimida, { seg: 120, radial: 6 });
    cableFlex(g, tramoDet, 0.07, M.poliimida, { seg: 100, radial: 6 });
  }
  {
    // trayecto del gas por la columna, muestreado a paso constante (para la simulación)
    const pts = [...tramoIny.map((p) => V(p[0], p[1], p[2]))];
    const N = COL.vueltas * 40;
    for (let i = N - 1; i >= 1; i--) { const t = i / N, a = t * COL.vueltas * Math.PI * 2; pts.push(V(cx + Math.cos(a) * R, cy + Math.sin(a) * R, cz + (t - 0.5) * Lh)); }
    pts.push(...tramoDet.map((p) => V(p[0], p[1], p[2])));
    const curva = new THREE.CatmullRomCurve3(pts, false, 'centripetal'); curva.arcLengthDivisions = 8000;
    refs.recorridoColumna = curva.getSpacedPoints(1600);
  }
  {
    const g = makePart(root, 'ventilador_horno', L2([0, 0, -9], true));
    const rot = new THREE.Group(); rot.position.set(FAN.x, FAN.y, FAN.z); g.add(rot); refs.fan = rot;
    rot.add(mesh(cylZ(1.4, 1.2, 24), M.aceroOscuro, [0, 0, 0.2]));
    for (let i = 0; i < 8; i++) {
      const piv = new THREE.Group(); piv.rotation.z = (i * Math.PI) / 4; rot.add(piv);
      piv.add(mesh(box(4.4, 0.15, 1.4), M.acero, [3.6, 0, 0]));
    }
    g.add(mesh(cylZ(0.3, 6.0, 12), M.aceroPulido, [FAN.x, FAN.y, FAN.z - 3.0]));
    g.add(mesh(cylZ(3.0, 5.2, 32), M.anodizado, [FAN.x, FAN.y, -13.0]));          // motor (detrás de la pared)
  }
  {
    const g = makePart(root, 'calefactor_horno', L2([0, 0, 4], true));
    const res = M.aceroOscuro.clone(); res.color.setHex(0x8a7d72); res.emissive = new THREE.Color(0);
    const anillo = mesh(new THREE.TorusGeometry(7.0, 0.32, 10, 120), res, [FAN.x, FAN.y, -5.0]);
    anillo.userData.noClone = true; g.add(anillo); refs.resistencia = res;
    for (let i = 0; i < 4; i++) { const a = Math.PI / 4 + (i * Math.PI) / 2; g.add(mesh(box(0.9, 0.9, 0.7), M.ceramica, [FAN.x + Math.cos(a) * 7.0, FAN.y + Math.sin(a) * 7.0, -5.45])); }
  }

  /* =================== DETECTOR DE IONIZACIÓN DE LLAMA =================== */
  {
    const g = makePart(root, 'fid_base', L2([0, 0, 0], true));
    g.add(mesh(cylY(1.0, FY.base1 - FY.base0, 32), M.acero, [dx, (FY.base0 + FY.base1) / 2, dz]));
    g.add(mesh(cylY(0.7, FY.nut1 - FY.nut0, 6), M.acero, [dx, (FY.nut0 + FY.nut1) / 2, dz]));
  }
  {
    const g = makePart(root, 'fid_bloque', L2([0, 0, 0], false, { info: 'fid_base', shell: true }));
    g.add(mesh(rbox(4.8, FY.bloque1 - FY.bloque0, 4.8, 0.3), M.aluminio, [dx, (FY.bloque0 + FY.bloque1) / 2, dz]));
    g.add(mesh(cylX(0.3, 5.8, 16), M.aceroOscuro, [dx, 41.4, dz + 1.4]));
  }
  {
    const g = makePart(root, 'fid_chorro', L2([0, 4.5, 0], true));
    g.add(mesh(cylY(0.24, 2.6, 16), M.aceroPulido, [dx, 42.3, dz]));
    g.add(mesh(cylY(0.42, 0.35, 6), M.acero, [dx, 43.775, dz]));
    g.add(mesh(new THREE.CylinderGeometry(0.11, 0.2, 0.25, 16), M.aceroPulido, [dx, 44.075, dz]));
    // llama de hidrógeno (casi invisible; la simulación la hace visible)
    const llama = [];
    for (const [r, h, c] of [[0.34, 1.5, 0x5b8cff], [0.17, 0.7, 0xa8c8ff]]) {
      const m = new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
      const f = mesh(new THREE.CylinderGeometry(0.02, r, h, 20, 1, true), m, [dx, FY.chorro1 + h / 2 + 0.02, dz]);
      f.userData.noClone = true; f.userData.noSolid = true; f.castShadow = false; f.raycast = () => {};
      g.add(f); llama.push(m);
    }
    refs.llama = llama;
    refs.punta = V(dx, FY.chorro1, dz);
  }
  {
    const g = makePart(root, 'fid_colector', L2([0, 9, 0], true));
    g.add(mesh(arandelaY(1.4, 0.45, FY.aisl1 - FY.aisl0), PTFE, [dx, (FY.aisl0 + FY.aisl1) / 2, dz]));
    g.add(mesh(arandelaY(1.2, 0.6, 0.3), M.aceroPulido, [dx, 44.45, dz]));
    const col = M.aceroPulido.clone(); col.side = THREE.DoubleSide;
    g.add(mesh(tuboY(0.6, 0.85, FY.col0, FY.col1, 32), col, [dx, 0, dz]));
    g.add(mesh(arandelaY(1.4, 0.5, 0.5), PTFE, [dx, 47.25, dz]));
    g.add(mesh(cylX(0.1, 1.3, 10), M.aceroPulido, [dx - 1.5, 45.8, dz]));           // contacto de señal
    refs.colector = { y0: FY.col0, y1: FY.col1, r: 0.6 };
  }
  {
    const g = makePart(root, 'fid_castillo', L2([0, 13, 0], true, { shell: true }));
    const cas = M.acero.clone(); cas.side = THREE.DoubleSide;
    g.add(mesh(tuboY(1.6, 1.95, FY.cast0, FY.cast1, 40), cas, [dx, 0, dz]));
    g.add(mesh(arandelaY(1.95, 0.9, 0.4), M.acero, [dx, FY.cast1 + 0.2, dz]));
    g.add(mesh(tuboY(0.7, 0.9, FY.cast1 + 0.4, FY.chim1, 24), cas, [dx, 0, dz]));
    g.add(mesh(cylX(0.55, 0.6, 20), M.acero, [dx + 2.15, FY.ign, dz]));               // asiento del encendedor
  }
  {
    const g = makePart(root, 'fid_ignitor', L2([6, 0, 0], true));
    g.add(mesh(cylX(0.4, 2.4, 16), M.ceramica, [dx + 3.65, FY.ign, dz]));
    g.add(mesh(cylX(0.55, 0.5, 6), M.acero, [dx + 2.7, FY.ign, dz]));
    g.add(mesh(cylX(0.15, 0.8, 10), M.tungsteno, [dx + 1.7, FY.ign, dz]));
    const brillo = new THREE.MeshStandardMaterial({ color: 0x8a8a8a, emissive: 0x000000, roughness: 0.4 });
    const p = mesh(new THREE.SphereGeometry(0.17, 12, 8), brillo, [dx + 1.3, FY.ign, dz]); p.userData.noClone = true; g.add(p);
    refs.glowIgn = brillo;
  }
  {
    const g = makePart(root, 'electrometro', L2([-5, 0, 0], true));
    g.add(mesh(rbox(5, 5.4, 7, 0.3), M.aluminio, [-1.5, 43.5, dz]));
    g.add(mesh(cylX(0.35, 0.6, 16), M.oro, [1.25, 45.8, dz]));
    screws(g, M.tornillo, M.tornilloNegro, 0.18, 'y', [[-3.4, 46.2, dz - 2.8], [0.4, 46.2, dz - 2.8], [-3.4, 46.2, dz + 2.8], [0.4, 46.2, dz + 2.8]]);
    // cable apantallado colector → electrómetro
    cableFlex(g, [[dx - 1.9, 45.8, dz, 'fid_colector'], [dx - 2.4, 45.8, dz, 'fid_colector'], [3.3, 45.95, dz], [1.9, 45.85, dz], [1.3, 45.8, dz]], 0.12, M.cable, { seg: 30, radial: 8 });
  }

  /* =================== LÍNEAS NEUMÁTICAS INTERNAS =================== */
  {
    const g = makePart(root, 'lineas_neumaticas', L2([0, 0, 0], false));
    const t = (pts, r = 0.12, mat = M.aceroPulido) => cableFlex(g, pts, r, mat, { seg: 70, radial: 8 });
    const E = 'epc_inyector', C = 'inyector_cabeza', T = 'trampa_split', D = 'epc_detector', B = 'fid_bloque';
    // portador (He) del módulo EPC a la cabeza del inyector
    t([[-17, 45.85, -13.5, E], [-17, 45.85, -12, E], [-16.6, 45.85, 0], [-15.4, 45.85, 8.4], [ix, 45.85, iz - 2.4, C], [ix, 45.85, iz - 1.6, C]]);
    // venteo de split: cabeza → trampa de carbón → válvula del módulo EPC
    refs.lineaSplit = [[ix - 0.7, 45.55, iz - 1.6, C], [ix - 0.7, 45.55, iz - 2.6, C], [-18.2, 45.4, 2], [-21, 44.7, -3.4], [-21, 44.6, -5.0, T]];
    t(refs.lineaSplit);
    t([[-21, 44.6, -10.9, T], [-21, 44.6, -12.1], [-21, 44.6, -13.5, E]]);
    // purga del septum
    t([[ix + 0.7, 46.15, iz - 1.6, C], [ix + 0.7, 46.2, iz - 2.6, C], [-14.6, 46.3, 6], [-15.8, 46.3, -3], [-18.4, 46.3, -11.5, E], [-18.6, 46.0, -13.5, E]], 0.1);
    // gases del FID: hidrógeno, auxiliar (N₂) y aire, del módulo EPC al bloque del detector
    for (const [x, y] of [[4.6, 41.5], [6.0, 42.2], [7.4, 42.9]]) t([[x, y, -13.5, D], [x, y, -12, D], [x, y, 9.6, B], [x, y, 11.0, B]], 0.11);
  }
  return refs;
}
