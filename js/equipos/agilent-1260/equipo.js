// Equipo completo Agilent 1260 Infinity II en una sola pila, según las fotografías del equipo del laboratorio: bandeja de disolventes
// con dos botellas arriba; Vialsampler (G7129A/C) con dos puertas ahumadas y, debajo, la tapa abatible del compartimento de columna
// integrado (G7130A) con su pestillo redondo; detector de diodos (G7115A, supuesto) y bomba cuaternaria G7111B abajo. Cada módulo
// tiene la banda superior retranqueada con el rótulo «1260 Infinity II» y el embudo de fugas beis. A la derecha baja la línea de
// residuos hasta la botella del banco; a la izquierda, el ordenador de control. Las carcasas son chapas huecas: dentro están el
// desgasificador, la MCGV, el cabezal de bombeo, la válvula de purga, la unidad óptica con la celda, las bandejas de viales, la aguja,
// la válvula de inyección y la columna. Los capilares (cableFlex) pasan por los pasos de las chapas y siguen a las piezas al explosionar.
import * as THREE from 'three';
import { M } from '../../materials.js';
import { mesh, rbox, box, cylX, cylY, cylZ, placaPasos, pasamuros, grilleTexture, textTexture, plateTexture, helix } from '../../geom.js';
import { makePart, cableFlex } from '../../parts.js';
import { buildCircuito } from './analizador.js';
import { W, X0, X1, ZF, T, MOD, BANDA, ICC, PASO_C1, PASO_C3, RP } from './geometria.js';

const L1 = (offset, extra = {}) => ({ level: 1, offset, mode: 'equipo', ...extra });
const SUBE = (k, dz = 0, extra = 0) => [0, MOD[k].sube + extra, dz];

/* ---------- texturas propias ---------- */
function lienzo(w, h, dibujo) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; dibujo(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
/** Emblema de Agilent (chispa de rayos alternos), dibujado. */
function chispa(g, x, y, r, col) {
  g.strokeStyle = col; g.lineCap = 'round'; g.lineWidth = r * 0.13;
  for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2, l = i % 2 ? r * 0.62 : r;
    g.beginPath(); g.moveTo(x + Math.cos(a) * r * 0.25, y + Math.sin(a) * r * 0.25); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }
}
const texRotulo = () => lienzo(1024, 128, (g, w, h) => {
  g.fillStyle = '#f4f5f6'; g.fillRect(0, 0, w, h);
  chispa(g, 60, 64, 34, '#2c6fb5');
  g.fillStyle = '#4a5058'; g.font = '600 46px Segoe UI, Arial'; g.textBaseline = 'middle'; g.fillText('Agilent Technologies', 112, 66);
  g.fillStyle = '#7b828b'; g.font = '500 40px Segoe UI, Arial'; g.fillText('1260 Infinity II', 640, 66);
});
const texLogoBandeja = () => lienzo(1024, 160, (g, w, h) => {
  g.fillStyle = '#eef0f2'; g.fillRect(0, 0, w, h);
  chispa(g, 80, 80, 44, '#2c6fb5');
  g.fillStyle = '#3d434b'; g.font = '600 62px Segoe UI, Arial'; g.textBaseline = 'middle'; g.fillText('Agilent Technologies', 150, 84);
});
const texEtiquetaSerie = () => lienzo(512, 128, (g, w, h) => {
  g.fillStyle = '#f7f7f5'; g.fillRect(0, 0, w, h); g.fillStyle = '#30343a'; g.font = '600 26px Arial'; g.fillText('Serial No.', 18, 40);
  g.font = '22px Arial'; g.fillText('DE·········', 18, 80); for (let i = 0; i < 40; i++) if ((i * 7) % 3) g.fillRect(260 + i * 5, 26, (i % 3) + 1, 72);
});
/** Pantalla del ordenador: cromatograma de OpenLab CDS (esquemático). */
const texPantalla = () => lienzo(1024, 640, (g, w, h) => {
  g.fillStyle = '#f2f4f7'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#1f5fa8'; g.fillRect(0, 0, w, 44); g.fillStyle = '#fff'; g.font = '600 24px Segoe UI'; g.fillText('OpenLab CDS · Data Analysis', 18, 30);
  g.fillStyle = '#fff'; g.fillRect(30, 80, w - 60, h - 120); g.strokeStyle = '#9aa3ad'; g.strokeRect(30, 80, w - 60, h - 120);
  g.strokeStyle = '#1d63c9'; g.lineWidth = 3; g.beginPath();
  const pk = [[0.18, 0.75, 0.012], [0.27, 0.42, 0.014], [0.55, 0.62, 0.02], [0.78, 0.18, 0.026]];
  for (let i = 0; i <= 600; i++) { const u = i / 600; let v = 0.03; for (const [c, a, s] of pk) v += a * Math.exp(-((u - c) ** 2) / (2 * s * s));
    const x = 40 + u * (w - 80), y = h - 50 - v * (h - 160); i ? g.lineTo(x, y) : g.moveTo(x, y); }
  g.stroke(); g.fillStyle = '#5b6470'; g.font = '20px Segoe UI'; g.fillText('DAD1 A, Sig=254,4 Ref=360,100', 46, 112);
});

/* ---------- utilidades de forma ---------- */
/** Rectángulo de esquinas redondeadas en coordenadas absolutas (para marcos con ventana). */
function rect(x0, x1, y0, y1, r, s = new THREE.Shape()) {
  s.moveTo(x0 + r, y0); s.lineTo(x1 - r, y0); s.quadraticCurveTo(x1, y0, x1, y0 + r); s.lineTo(x1, y1 - r); s.quadraticCurveTo(x1, y1, x1 - r, y1);
  s.lineTo(x0 + r, y1); s.quadraticCurveTo(x0, y1, x0, y1 - r); s.lineTo(x0, y0 + r); s.quadraticCurveTo(x0, y0, x0 + r, y0);
  return s;
}
/** Marco de puerta con ventana: placa de x0…x1, y0…y1 (espesor 1,2 hacia +z desde z0) y hueco con márgenes [arriba, abajo, lados]. */
function marco(x0, x1, y0, y1, [mt, mb, ml], mat, z0) {
  const s = rect(x0, x1, y0, y1, 0.35);
  const h = new THREE.Path(); h.moveTo(x0 + ml, y0 + mb); h.lineTo(x0 + ml, y1 - mt); h.lineTo(x1 - ml, y1 - mt); h.lineTo(x1 - ml, y0 + mb); h.lineTo(x0 + ml, y0 + mb);
  s.holes.push(h);
  return mesh(new THREE.ExtrudeGeometry(s, { depth: 1.2, bevelEnabled: false, curveSegments: 4 }), mat, [0, 0, z0]);
}
/** Botella con hombros redondeados (perfil de revolución). */
function botella(r, h, cuello = 0.45) {
  const p = [[0, 0], [r * 0.93, 0], [r, r * 0.12], [r, h * 0.74], [r * 0.84, h * 0.87], [r * cuello * 1.25, h * 0.96], [r * cuello, h], [r * cuello, h * 1.06], [0, h * 1.06]];
  return new THREE.LatheGeometry(p.map(([a, b]) => new THREE.Vector2(a, b)), 48);
}
/** Une geometrías ya colocadas en una sola (gradillas de viales). */
function fusion(geos) {
  const gs = geos.map((g) => (g.index ? g.toNonIndexed() : g));
  const n = gs.reduce((a, g) => a + g.attributes.position.count, 0);
  const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3); let o = 0;
  for (const g of gs) { pos.set(g.attributes.position.array, o * 3); nor.set(g.attributes.normal.array, o * 3); o += g.attributes.position.count; }
  const r = new THREE.BufferGeometry(); r.setAttribute('position', new THREE.BufferAttribute(pos, 3)); r.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  r.computeBoundingBox(); r.computeBoundingSphere(); return r;
}

export function buildEquipo(root) {
  const refs = {};
  const blanco = M.carcasa.clone(); blanco.color.setHex(0xf1f2f3); blanco.roughness = 0.4;
  const fascia = M.carcasa.clone(); fascia.color.setHex(0xdfe2e5);
  const interiorGris = M.carcasa.clone(); interiorGris.color.setHex(0xc9cdd2);
  const ahumado = new THREE.MeshPhysicalMaterial({ color: 0x0e1114, metalness: 0.15, roughness: 0.05, clearcoat: 1, clearcoatRoughness: 0.04, transparent: true, opacity: 0.92 });
  const beis = M.grisClaro.clone(); beis.color.setHex(0xd9cfae);
  const rotulo = new THREE.MeshStandardMaterial({ map: texRotulo(), roughness: 0.5 });
  const serie = new THREE.MeshStandardMaterial({ map: texEtiquetaSerie(), roughness: 0.6 });
  const grille = grilleTexture(18, 10);
  const rejilla = () => { const m = blanco.clone(); m.map = grille; m.color.setHex(0xb9bec4); return m; };
  const peek = M.peekBeige.clone();                                          // capilares y tubos: acero inoxidable, PEEK y PTFE
  const capAcero = M.aceroPulido;

  /* ---------------- CARCASAS DE LOS MÓDULOS ---------------- */
  /**
   * Carcasa hueca de un módulo: chapa inferior, laterales, fondo y franja frontal retranqueada (pieza `id`), y chapa superior
   * aparte (pieza `${id}_tapa`, sube algo más al explosionar para dejar ver el interior). huecos: { inf, sup: [x, z, r], izq, der: [z, y, r] }.
   */
  function carcasa(key, id, info, huecos = {}) {
    const m = MOD[key], y0 = m.y0, h = m.h, zb = ZF - m.d, zf = ZF - 1.4, cz = (zb + zf) / 2, dz = zf - zb;
    const g = makePart(root, id, L1(SUBE(key), { info, shell: true, label: 'equipo' }));
    g.add(placaPasos(W, dz, T, (huecos.inf || []).map(([x, z, r]) => [x, z - cz, r]), blanco, [0, y0 + T / 2, cz], 'xz', 0.3));
    const cy = y0 + h / 2, hy = h - 2 * T;
    for (const [s, x, hs] of [[-1, X0 + T / 2, huecos.izq], [1, X1 - T / 2, huecos.der]])
      g.add(placaPasos(dz, hy, T, (hs || []).map(([z, y, r]) => [z - cz, y - cy, r]), blanco, [x, cy, cz], 'zy', 0.2));
    g.add(mesh(rbox(W - 2 * T, hy, T, 0.15), blanco, [0, cy, zb + T / 2]));
    // franja superior retranqueada con el rótulo, el embudo de fugas y la etiqueta de serie
    const yb = y0 + h - BANDA, ym = (yb + y0 + h - T) / 2, hb = y0 + h - T - yb;
    g.add(mesh(rbox(W - 2 * T, hb, 0.8, 0.1), fascia, [0, ym, ZF - 2.2]));
    g.add(mesh(new THREE.PlaneGeometry(10.5, 1.3), rotulo, [-12.6, ym, ZF - 1.79]));
    g.add(mesh(rbox(7.5, Math.min(1.6, hb - 0.3), 1.0, 0.25), beis, [6.5, ym, ZF - 1.3]));
    g.add(mesh(box(2.6, Math.min(1.2, hb - 0.5), 0.6), M.plasticoNegro, [1.4, ym, ZF - 1.5]));
    g.add(mesh(new THREE.PlaneGeometry(5.2, 1.2), serie, [14.6, ym, ZF - 1.79]));
    // rejilla de ventilación en el lateral derecho (zona trasera) y placa de características en el fondo
    g.add(mesh(new THREE.PlaneGeometry(dz * 0.45, Math.min(hy - 2, 10)), rejilla(), [X1 + 0.02, cy, zb + dz * 0.3], [0, Math.PI / 2, 0]));
    const placa = new THREE.MeshStandardMaterial({ map: plateTexture([`Agilent ${info === 'bomba' ? 'G7111B' : info === 'dad' ? 'G7115A' : 'G7129A'}`, '100–240 V~ 50/60 Hz', 'Modelo didáctico', 'Explorador 3D']), metalness: 0.5, roughness: 0.45 });
    g.add(mesh(new THREE.PlaneGeometry(7, 3.5), placa, [-10, cy, zb - 0.02], [0, Math.PI, 0]));
    const t = makePart(root, `${id}_tapa`, L1(SUBE(key, 0, key === 'vs' ? 8 : 7), { info, shell: true }));
    t.add(placaPasos(W, dz, T, (huecos.sup || []).map(([x, z, r]) => [x, z - cz, r]), blanco, [0, y0 + h - T / 2, cz], 'xz', 0.3));
    return g;
  }
  /** Dos puertas ahumadas (izquierda más estrecha, como en las fotos) entre ya y yb. */
  function puertas(key, id, info, ya, yb, xs, margen, interruptor = true) {
    const g = makePart(root, id, L1(SUBE(key, 26), { info, shell: true }));
    const z0 = ZF - 1.3;
    for (const [a, b] of [[X0 + 0.15, xs - 0.15], [xs + 0.15, X1 - 0.15]]) {
      g.add(marco(a, b, ya, yb, margen, blanco, z0));
      g.add(mesh(box(b - a - 2 * margen[2], yb - ya - margen[0] - margen[1], 0.5), ahumado, [(a + b) / 2, (ya + margen[1] + yb - margen[0]) / 2, ZF - 0.75]));
    }
    // indicador de estado (franja verde) y, abajo a la izquierda, el interruptor
    g.add(mesh(box(3.2, 0.3, 0.2), M.ledVerde, [X1 - 3.4, yb - margen[0] / 2, ZF]));
    if (interruptor) g.add(mesh(rbox(1.6, 1.2, 0.5, 0.2), M.grisClaro, [X0 + 2, ya + Math.max(0.9, margen[1] / 2), ZF + 0.05]));
    return g;
  }

  const pc1 = PASO_C1, pc3 = PASO_C3;
  carcasa('bomba', 'bomba_carcasa', 'bomba', { sup: [[pc1[0], pc1[1], RP]], izq: [[2, 9.2, 0.35], [5, 9.2, 0.35]] });
  puertas('bomba', 'bomba_puerta', 'bomba', 0.25, 18 - BANDA - 0.1, -4.4, [1.4, 2.4, 0.7]);
  carcasa('dad', 'dad_carcasa', 'dad', { inf: [[pc1[0], pc1[1], RP]], sup: [[pc1[0], pc1[1], RP], [pc3[0], pc3[1], RP]], der: [[13, 21.5, 0.3]] });
  puertas('dad', 'dad_puerta', 'dad', 18.25, 32 - BANDA - 0.1, -4.4, [1.3, 2.1, 0.7]);
  carcasa('vs', 'vs_carcasa', 'muestreador', { inf: [[pc1[0], pc1[1], RP], [pc3[0], pc3[1], RP]] });
  puertas('vs', 'vs_puerta', 'muestreador', ICC.y1 + 0.2, 64 - BANDA - 0.1, -3.6, [1.8, 0.8, 0.6], false);

  /* ---------------- BOMBA CUATERNARIA G7111B ---------------- */
  {
    const g = makePart(root, 'bomba_interior', L1(SUBE('bomba'), { info: 'bomba' }));
    // desgasificador de vacío de cuatro canales (izquierda), con las entradas de disolvente en su cara izquierda
    g.add(mesh(rbox(12, 9.8, 24, 0.4), interiorGris, [-11, T + 4.9, 4]));
    for (const z of [2, 5, 8, 11]) g.add(mesh(cylX(0.35, 0.8, 16), M.ptfe, [-17.4, 9.2, z]));
    // MCGV: bloque con cuatro electroválvulas
    g.add(mesh(rbox(5, 4.6, 7, 0.3), M.aluminio, [-1, T + 2.3, 13.5]));
    for (let i = 0; i < 4; i++) g.add(mesh(cylY(0.7, 3.2, 20), M.plasticoNegro, [-2.4 + (i % 2) * 2.8, T + 4.6 + 1.6, 11.6 + Math.floor(i / 2) * 3.8]));
    // accionamiento (motor y husillos) y cabezal de bombeo con las dos cámaras
    g.add(mesh(rbox(10, 12.8, 27.8, 0.4), M.anodizado, [7, T + 6.4, -2]));
    g.add(mesh(rbox(8, 10, 7.6, 0.3), M.acero, [7, 8, 15.9]));
    for (const x of [5, 9]) g.add(mesh(cylZ(1.1, 0.8, 24), M.aceroPulido, [x, 8.2, 20.1]));
    g.add(mesh(cylY(0.7, 2.25, 20), M.aceroPulido, [5, T + 1.12, 16]));                       // válvula de entrada (pasiva)
    g.add(mesh(cylY(0.65, 1.8, 20), M.aceroPulido, [5, 13.9, 16]));                           // válvula de salida
    // válvula de purga con su mando
    g.add(mesh(rbox(3.6, 4, 4.4, 0.3), M.acero, [14.2, 10, 17.2]));
    g.add(mesh(cylZ(1.1, 1.0, 24), M.plasticoNegro, [14.2, 10, 19.9]));
    // electrónica al fondo
    g.add(mesh(rbox(30, 12, 0.3, 0.05), M.pcb, [-3, 9, -19.6]));
    // tubos internos: desgasificador → MCGV (canales A y B) y MCGV → válvula de entrada
    cableFlex(g, [[-5.2, 4.2, 12.4], [-4.4, 3.4, 12.6], [-3.3, 2.6, 12.8]], 0.12, M.ptfe, { seg: 20, radial: 6 });
    cableFlex(g, [[-5.2, 6.4, 14.6], [-4.4, 5.6, 14.8], [-3.3, 4.6, 15.0]], 0.12, M.ptfe, { seg: 20, radial: 6 });
    cableFlex(g, [[1.3, 2.4, 15.2], [2.6, 2.0, 15.8], [3.8, 1.8, 16], [4.6, 1.8, 16]], 0.1, M.ptfe, { seg: 24, radial: 6 });
  }

  /* ---------------- DETECTOR DE DIODOS ---------------- */
  {
    const g = makePart(root, 'dad_interior', L1(SUBE('dad'), { info: 'dad' }));
    const y0 = 18 + T;
    g.add(mesh(rbox(28, 9.4, 26, 0.5), M.aluminio, [-2, y0 + 4.9, -3]));                 // unidad óptica (espectrógrafo cerámico dentro)
    g.add(mesh(rbox(6, 7.6, 5.6, 0.3), M.anodizado, [-13, y0 + 4.6, 13.2]));             // alojamiento de las lámparas (acceso frontal)
    g.add(mesh(cylZ(1.2, 0.4, 24), M.vidrio, [-13, y0 + 5.2, 16.2]));
    // cartucho de la celda de flujo (frontal) con su etiqueta RFID
    g.add(mesh(rbox(6, 5, 6.6, 0.3), M.grisClaro, [-5, 24, 13.9]));
    g.add(mesh(rbox(2.2, 2.2, 0.4, 0.1), M.plasticoNegro, [-5, 24, 17.3]));
    g.add(mesh(rbox(28, 8, 0.3, 0.05), M.pcb, [-2, 25, -19.4]));
    refs.celdaDad = g;
  }

  /* ---------------- VIALSAMPLER ---------------- */
  {
    const g = makePart(root, 'vs_interior', L1(SUBE('vs'), { info: 'muestreador' }));
    // dos cajones de viales (66 × 2 mL cada uno) a la izquierda
    const vg = [], tg = [];
    for (const [xa] of [[-17.6], [-8.0]]) {
      g.add(mesh(rbox(9.2, 1.0, 16.4, 0.25), M.plasticoNegro, [xa + 4.3, 42.5, 10]));
      for (let i = 0; i < 6; i++) for (let j = 0; j < 11; j++) {
        const x = xa + 0.8 + i * 1.4, z = 2.8 + j * 1.42;
        const v = new THREE.CylinderGeometry(0.58, 0.58, 2.6, 12); v.translate(x, 44.3, z); vg.push(v);
        const t = new THREE.CylinderGeometry(0.6, 0.6, 0.5, 12); t.translate(x, 45.85, z); tg.push(t);
      }
    }
    const vidrioV = M.vidrio.clone(); vidrioV.opacity = 0.55;
    g.add(mesh(fusion(vg), vidrioV)); const tap = M.plasticoNegro.clone(); tap.color.setHex(0x2f5d9b); g.add(mesh(fusion(tg), tap));
    // brazo de pinza cartesiano: carril superior, carro y pinza
    g.add(mesh(rbox(34, 1.2, 2, 0.3), M.aluminio, [-1, 59.8, 2]));
    g.add(mesh(rbox(3.6, 3, 3.4, 0.3), M.anodizado, [-4, 58, 4.4]));
    g.add(mesh(box(1.2, 6, 1.2), M.acero, [-4, 53.5, 5.6]));
    for (const dz of [-0.55, 0.55]) g.add(mesh(box(0.25, 1.6, 0.4), M.plasticoNegro, [-4, 49.9, 5.6 + dz]));
    // estación de la aguja: soporte, aguja y asiento
    g.add(mesh(rbox(3, 3.4, 3, 0.3), M.anodizado, [6, 54.5, 10]));
    g.add(mesh(cylY(0.09, 8, 10), M.aceroPulido, [6, 48.8, 12]));
    g.add(mesh(box(0.6, 2.4, 2), M.aceroPulido, [6, 51.6, 10.9]));
    g.add(mesh(rbox(2.2, 1.6, 2.2, 0.2), M.aceroPulido, [6, 44.3, 12]));
    g.add(mesh(rbox(5, 1.2, 4, 0.2), M.aluminio, [6, 42.9, 12]));
    // válvula de inyección de 6 puertos (estátor hacia el frente) y su motor
    const vc = new THREE.Vector3(14, 50, 0);
    g.add(mesh(cylZ(2.2, 3.4, 40), M.aceroPulido, [vc.x, vc.y, 14.9]));
    g.add(mesh(rbox(5.2, 5, 4.2, 0.3), M.anodizado, [vc.x, vc.y, 11.1]));
    const puerto = (k) => { const a = Math.PI / 2 - (k - 1) * Math.PI / 3; return [vc.x + Math.cos(a) * 1.3, vc.y + Math.sin(a) * 1.3]; };
    for (let k = 1; k <= 6; k++) { const [x, y] = puerto(k); g.add(mesh(cylZ(0.42, 0.9, 6), M.acero, [x, y, 17.05])); }
    // dosificador (cabezal analítico de 100 µL) bajo la válvula
    g.add(mesh(rbox(4.4, 3, 6, 0.3), M.acero, [13.5, 44.5, 13]));
    g.add(mesh(cylZ(0.7, 2.4, 20), M.aceroPulido, [13.5, 44.5, 9.1]));
    // conexiones internas: puerto 2 → dosificador, dosificador → bucle → aguja, asiento → puerto 5
    const p2 = puerto(2), p5 = puerto(5);
    cableFlex(g, [[p2[0], p2[1], 17.4], [p2[0] + 0.2, p2[1], 18.6], [16.4, 47.5, 18.6], [15.6, 45.4, 16.4], [14.6, 44.6, 16.1]], 0.08, capAcero, { seg: 40, radial: 6 });
    g.add(mesh(helix(0.9, 1.4, 5, 0.07, 160), M.aceroPulido, [10, 47.2, 16.8], [0, Math.PI / 2, 0]));    // bucle de muestra
    for (const x of [9.05, 10.95]) g.add(mesh(cylX(0.22, 0.5, 12), M.acero, [x, 47.2, 16.4]));
    cableFlex(g, [[12.4, 44.6, 15.6], [11.4, 45.6, 16.6], [10.8, 47.2, 16.8]], 0.07, capAcero, { seg: 24, radial: 6 });
    cableFlex(g, [[9.2, 47.2, 16.8], [7.8, 50, 15], [6.8, 51.6, 13], [6.1, 52.2, 11.6]], 0.07, capAcero, { seg: 40, radial: 6 });
    cableFlex(g, [[7.05, 44.3, 12], [8.4, 44.0, 14.6], [9.8, 44.4, 18.0], [11.6, 46.6, 18.6], [p5[0] - 0.4, p5[1], 18.4], [p5[0], p5[1], 17.4]], 0.08, capAcero, { seg: 56, radial: 6 });
    refs.puerto = puerto;
  }

  /* ---------------- COMPARTIMENTO DE COLUMNA INTEGRADO (G7130A) ---------------- */
  {
    const g = makePart(root, 'icc', L1(SUBE('vs'), { info: 'icc', label: 'equipo' }));
    const { y0, y1, z0, z1 } = ICC, cz = (z0 + z1) / 2, dz = z1 - z0;
    g.add(placaPasos(W - 2 * T - 0.2, dz, 0.6, [[pc3[0], pc3[1] - cz, RP]], interiorGris, [0, y0 + 0.3, cz], 'xz', 0.2));
    g.add(placaPasos(W - 2 * T - 0.2, dz, 0.6, [[12, 14 - cz, RP]], interiorGris, [0, y1 - 0.3, cz], 'xz', 0.2));
    g.add(mesh(rbox(W - 2 * T - 0.2, y1 - y0 - 1.2, 0.6, 0.1), interiorGris, [0, (y0 + y1) / 2, z0 + 0.3]));
    for (const x of [X0 + T + 0.4, X1 - T - 0.4]) g.add(mesh(rbox(0.6, y1 - y0 - 1.2, dz - 0.6, 0.1), interiorGris, [x, (y0 + y1) / 2, cz + 0.3]));
    // intercambiador de calor (bloque calefactado) y columna de 150 × 4,6 mm con sus conectores
    g.add(mesh(rbox(4, 3.8, 6, 0.3), M.aluminio, [12, 37.5, 15]));
    g.add(mesh(cylX(0.48, 15, 32), M.aceroPulido, [1.6, 37.5, 16]));
    for (const x of [9.6, -6.4]) g.add(mesh(cylX(0.68, 1.2, 6), M.acero, [x, 37.5, 16]));
    const et = new THREE.MeshStandardMaterial({ map: textTexture(['C18 · 150 × 4,6 mm · 5 µm'], { w: 512, h: 64, bg: '#e9edf2', fg: '#1d3f73', font: '600 30px Segoe UI' }), roughness: 0.5 });
    const etq = mesh(new THREE.CylinderGeometry(0.5, 0.5, 6, 32, 1, true, -Math.PI * 0.35, Math.PI * 0.7), et, [1.6, 37.5, 16], [0, 0, Math.PI / 2]);
    etq.userData.decal = true; g.add(etq);
    // tapa abatible con el pestillo redondo (el panel inferior de las fotos)
    const f = makePart(g, 'icc_tapa', L1([0, 0, 26], { info: 'icc', shell: true }));
    f.add(mesh(rbox(W - 0.3, y1 - y0 + 0.4, 1.2, 0.35), blanco, [0, (y0 + y1) / 2 - 0.2, ZF - 0.7]));
    f.add(mesh(cylZ(1.75, 0.3, 48), M.grisClaro, [0, (y0 + y1) / 2, ZF + 0.02]));
    f.add(mesh(new THREE.TorusGeometry(1.75, 0.28, 12, 48), M.anodizado, [0, (y0 + y1) / 2, ZF + 0.05]));
    f.add(mesh(cylZ(1.25, 0.5, 40), blanco, [0, (y0 + y1) / 2, ZF + 0.32]));
  }

  /* ---------------- BANDEJA DE DISOLVENTES Y BOTELLAS ---------------- */
  const YS = 68;                                       // fondo del pozo de la bandeja
  {
    const g = makePart(root, 'bandeja', L1(SUBE('bandeja'), { shell: true, label: 'equipo' }));
    const m = MOD.bandeja, zb = ZF - m.d, cz = (zb + ZF) / 2, d = m.d;
    g.add(mesh(rbox(W, YS - m.y0, d - 1.2, 0.4), blanco, [0, (m.y0 + YS) / 2, cz - 0.6]));
    g.add(mesh(rbox(W, m.h + 0.4, 1.2, 0.4), blanco, [0, m.y0 + (m.h + 0.4) / 2, ZF - 0.6]));
    for (const x of [X0 + 0.5, X1 - 0.5]) g.add(mesh(rbox(1.0, 75 - YS, d - 1.2, 0.3), blanco, [x, (YS + 75) / 2, cz - 0.6]));
    g.add(mesh(rbox(W - 2, 75 - YS, 1.0, 0.3), blanco, [0, (YS + 75) / 2, zb + 0.5]));
    const logo = new THREE.MeshStandardMaterial({ map: texLogoBandeja(), roughness: 0.5 });
    g.add(mesh(new THREE.PlaneGeometry(16, 2.5), logo, [-9.5, 71.2, ZF + 0.01]));
    // dos cabezales de botella de repuesto colgados del lateral izquierdo (fotos)
    const rib = M.ptfe.clone(); rib.color.setHex(0xe7e4dc);
    for (const [y, z] of [[71.5, 15.5], [67.6, 12]]) {
      g.add(mesh(new THREE.TorusGeometry(2.4, 0.55, 14, 40), rib, [X0 - 0.6, y, z], [0, Math.PI / 2, 0]));
      g.add(mesh(new THREE.TorusGeometry(1.75, 0.2, 10, 36), rib, [X0 - 0.6, y, z], [0, Math.PI / 2, 0]));
    }
  }
  const BOT = [[-8, -2, 'ACN : Agua 70:30'], [5.5, 1.5, null]];
  {
    const g = makePart(root, 'botellas', L1(SUBE('bandeja', 0, 12), { label: 'equipo' }));
    const vb = M.vidrio.clone(); vb.opacity = 0.42; vb.color.setHex(0xeef6f8);
    for (const [x, z, txt] of BOT) {
      g.add(mesh(botella(5.0, 21.4), vb, [x, YS + 0.05, z]));
      const liq = M.disolvente.clone(); liq.opacity = 0.42;
      g.add(mesh(cylY(4.8, 11, 40), liq, [x, YS + 5.7, z]));
      const tapa = M.grisClaro.clone(); tapa.color.setHex(0x8e959d);
      g.add(mesh(cylY(2.9, 2.4, 32), tapa, [x, YS + 22.7, z]));
      g.add(mesh(cylY(1.1, 0.8, 20), M.ptfe, [x, YS + 24.3, z]));
      if (txt) {
        const et = new THREE.MeshStandardMaterial({ map: textTexture([txt], { w: 512, h: 128, bg: '#fbfbf8', fg: '#2a2e35', font: 'italic 600 46px Segoe Print, Comic Sans MS, sans-serif' }), roughness: 0.6 });
        const e = mesh(new THREE.CylinderGeometry(5.03, 5.03, 3.2, 40, 1, true, -0.85, 1.7), et, [x, YS + 14, z]); e.userData.decal = true; g.add(e);
      }
    }
    // líneas de disolvente: suben de cada tapón, pasan por encima del borde izquierdo y bajan por fuera hasta el desgasificador
    BOT.forEach(([x, z], i) => {
      const zh = [2, 5][i], zo = [-10.5, -8][i], xo = [-21.3, -21.9][i];
      cableFlex(g, [[x, YS + 24.6, z], [x, YS + 27.5, z], [x - 4, YS + 29.5, z - 2.5], [-17.5, YS + 27, zo + 1], [xo, YS + 20, zo, 'bandeja'], [xo, 62, zo, 'vs_carcasa'],
        [xo, 40, zo, 'vs_carcasa'], [xo, 28, zo + 2, 'dad_carcasa'], [xo, 15, zo + 6, 'bomba_carcasa'], [xo + 0.6, 10.2, zh - 1.5, 'bomba_carcasa'],
        [X0 - 0.4, 9.2, zh, 'bomba_carcasa'], [X0 + 1, 9.2, zh, 'bomba_interior'], [-17.6, 9.2, zh, 'bomba_interior']], 0.16, M.ptfe, { seg: 160, radial: 8 });
    });
  }

  /* ---------------- CAPILARES DE LA PILA ---------------- */
  {
    const g = makePart(root, 'capilares', L1([0, 0, 0], { label: 'equipo' }));
    const [cx, czz] = pc1, B = 'bomba_interior', BT = 'bomba_carcasa_tapa', DC = 'dad_carcasa', DT = 'dad_carcasa_tapa', VC = 'vs_carcasa', VI = 'vs_interior', IC = 'icc', DI = 'dad_interior';
    const p1 = refs.puerto(1), p6 = refs.puerto(6);
    // C1: válvula de purga → pasos verticales (bomba, detector) → válvula de inyección (puerto 1)
    cableFlex(g, [[16, 10, 17.6, B], [17.2, 10.6, 16], [17.4, 12.5, 11], [cx, 15.5, czz, B], [cx, 17.6, czz, BT], [cx, 18.4, czz, DC], [cx, 25, czz, DC],
      [cx, 31.6, czz, DT], [cx, 32.4, czz, VC], [cx, 40, czz, VI], [cx, 46, czz + 0.4, VI], [17.7, 50, 11.5, VI], [17.5, 53.3, 15.4, VI],
      [15.6, 53.1, 18.6, VI], [p1[0], p1[1] + 0.2, 18.8, VI], [p1[0], p1[1], 17.4, VI]], 0.09, capAcero, { seg: 220, radial: 6 });
    // C2: puerto 6 → paso de la tapa del compartimento → entrada del intercambiador de calor
    cableFlex(g, [[p6[0], p6[1], 17.4, VI], [p6[0], p6[1] + 0.1, 18.8, VI], [12.2, 48.6, 19.4, VI], [11.6, 44.4, 18.8, VI], [11.0, 42.3, 17.4, VI], [12, 41.9, 14.6, IC], [12, 41.1, 14, IC],
      [12, 39.8, 14, IC], [12, 39.25, 14, IC]], 0.09, capAcero, { seg: 90, radial: 6 });
    // C3: salida de la columna → pasos (compartimento, muestreador, detector) → celda de flujo
    const [x3, z3] = pc3;
    cableFlex(g, [[-7.0, 37.5, 16, IC], [-9.6, 37.3, 16, IC], [-12.2, 36.2, 15.4, IC], [x3, 34.6, z3, IC], [x3, 33.1, z3, IC], [x3, 32.4, z3, VC], [x3, 31.6, z3, DT],
      [x3, 30, z3, DI], [-11.4, 27.8, 14.8, DI], [-7.6, 27.2, 14.4, DI], [-5.6, 26.9, 14.2, DI], [-5.2, 26.3, 14.2, DI]], 0.09, peek, { seg: 120, radial: 6 });
    // C4: salida de la celda → paso del lateral derecho → conector de la línea de residuos
    cableFlex(g, [[-2.2, 23, 14.2, DI], [0, 22.4, 14, DI], [6, 21.6, 13.2, DI], [14, 21.5, 13, DI], [X1 - 1.2, 21.5, 13, DC], [X1 + 0.6, 21.5, 13, DC], [21.2, 21.5, 15],
      [21.2, 21.5, 18.4, 'residuos'], [21.2, 21.5, 18.9, 'residuos']], 0.1, peek, { seg: 90, radial: 6 });
  }

  /* ---------------- RESIDUOS ---------------- */
  {
    const g = makePart(root, 'residuos', L1([0, 0, 0], { label: 'equipo' }));
    const tubo = M.ptfe.clone(); tubo.color.setHex(0xf3f3ef);
    const zc = 19.4, xc = 21.2;
    g.add(mesh(cylY(0.5, 1.4, 20), tubo, [xc, 21.5, zc]));                                       // unión en T
    cableFlex(g, [[xc - 0.6, 61.6, zc], [xc + 0.2, 60.4, zc], [xc, 50, zc], [xc, 35, zc], [xc, 22.3, zc]], 0.3, tubo, { seg: 80, radial: 10 });
    for (const y of [56, 44, 28]) g.add(mesh(new THREE.TorusGeometry(0.42, 0.14, 8, 20), M.plasticoNegro, [xc, y, zc], [Math.PI / 2, 0, 0]));
    // botella de residuos de 500 mL con tapón azul en el banco
    const bx = 31, bz = 12, vb = M.vidrio.clone(); vb.opacity = 0.3;
    g.add(mesh(botella(4.3, 16.6, 0.62), vb, [bx, 0.02, bz]));
    const liq = M.disolvente.clone(); liq.opacity = 0.28; g.add(mesh(cylY(4.1, 4.5, 36), liq, [bx, 2.4, bz]));
    const azul = M.plasticoNegro.clone(); azul.color.setHex(0x1f56c7);
    g.add(mesh(cylY(2.95, 2.6, 32), azul, [bx, 18.6, bz]));
    cableFlex(g, [[xc, 20.7, zc], [xc, 19.6, zc - 0.2], [23.5, 21.5, 16.5], [28, 23, 13.2], [bx, 21.6, bz], [bx, 19.9, bz]], 0.3, tubo, { seg: 60, radial: 10 });
    // tubo de residuos que sale de la botella hacia la derecha por el banco
    cableFlex(g, [[bx + 0.9, 19.9, bz], [bx + 1.4, 21.8, bz], [bx + 5, 20, bz + 1], [bx + 8, 6, bz + 3], [bx + 10, 0.4, bz + 5], [bx + 22, 0.4, bz + 12]], 0.3, tubo, { seg: 60, radial: 10 });
  }

  /* ---------------- ORDENADOR DE CONTROL ---------------- */
  {
    const g = makePart(root, 'pc', L1([-12, 0, 0], { label: 'equipo' }));
    const negro = M.carcasaOsc.clone(); negro.color.setHex(0x1e2125);
    const cx = -50, cz = 6;
    g.add(mesh(rbox(29, 9.4, 29, 0.5), negro, [cx, 4.7, cz]));                                   // equipo compacto (sobremesa)
    g.add(mesh(new THREE.PlaneGeometry(6, 0.8), M.plasticoNegro, [cx - 8, 6.5, cz + 14.52]));
    g.add(mesh(cylZ(0.35, 0.2, 16), M.ledVerde, [cx + 11, 7.4, cz + 14.6]));
    // monitor sobre el ordenador
    g.add(mesh(rbox(18, 0.9, 13, 0.3), M.plasticoNegro, [cx, 9.85, cz - 2]));
    g.add(mesh(rbox(4, 14, 2, 0.4), M.plasticoNegro, [cx, 17, cz - 4]));
    g.add(mesh(rbox(51, 31.5, 2.4, 0.6), M.plasticoNegro, [cx, 36, cz - 1.8]));
    const scr = new THREE.MeshStandardMaterial({ map: texPantalla(), emissive: 0xffffff, emissiveMap: texPantalla(), emissiveIntensity: 0.55, roughness: 0.3 });
    g.add(mesh(new THREE.PlaneGeometry(48.5, 28.6), scr, [cx, 36.4, cz - 0.58]));
    // teclado delante
    g.add(mesh(rbox(40, 1.6, 13.5, 0.4), M.plasticoNegro, [cx + 4, 0.8, cz + 24]));
    const teclas = M.carcasaOsc.clone(); teclas.color.setHex(0x2c3036);
    g.add(mesh(new THREE.PlaneGeometry(37, 11), teclas, [cx + 4, 1.61, cz + 24], [-Math.PI / 2, 0, 0]));
  }

  refs.circuito = buildCircuito(root);
  refs.update = () => {};
  return refs;
}
