// Equipo completo de doble enfoque (tipo Thermo DFS): consola de ≈ 161 × 157 × 141 cm con GC adosado, plataforma antivibratoria,
// analizador con imán laminado, tres bombas turbomoleculares, bombas rotatorias, fuentes del imán y de alta tensión, enfriador.
// Coordenadas de mundo en cm. Frente hacia +Z; GC a la izquierda (-X).
import * as THREE from 'three';
import { M } from '../../materials.js';
import { mesh, rbox, box, washerX, cylX, cylY, cylZ, tubePath, grilleTexture, textTexture, screws, screenTexture, plateTexture, warningTexture, placaPasos, pasamuros } from '../../geom.js';
import { makePart, cableFlex } from '../../parts.js';
import { buildAnalizador, BORNE_IMAN, PASO_AT } from './analizador.js';
import { ORIGEN, AX } from './geometria.js';

const L1 = (offset, extra = {}) => ({ level: 1, offset, mode: 'equipo', ...extra });
const X0 = -54, X1 = 78, ZB = -78, ZF = 78, HB = 82, HT = 141;
/** Punto local del analizador → mundo (el grupo está girado 180° en X). */
const W = (p, off = new THREE.Vector3()) => new THREE.Vector3(ORIGEN.x + p.x, ORIGEN.y - p.y, ORIGEN.z - p.z).add(off);

// Puertos de las turbos (mundo), pasos de la plataforma (x, z, r) y cotas de los cables
const PUERTOS = [AX.M_IN.clone().add(new THREE.Vector3(-8, 0, 0)), AX.BETA_SLIT, AX.SLIT.clone().addScaledVector(AX.H2, -6)].map((p) => W(p));
const YT = ORIGEN.y - 7.5;                     // brida superior de las turbos
const BI = W(BORNE_IMAN), PA = W(PASO_AT);     // borne del imán y pasamuros de AT de la fuente
const DY0 = HB, DY1 = HB + 2.4;                // plataforma: caras inferior y superior
const ZN = 34, YN = 100, RN = 1.6;             // ranura de la tapa para la línea de transferencia
const PASOS = [...PUERTOS.map((w) => [w.x + 9, w.z, 1.2]), [BI.x, BI.z, 1.3], [PA.x, PA.z, 1.5]];

export function buildEquipo(root) {
  const refs = {};
  const grille = grilleTexture(30, 8);

  /* ---------------- CONSOLA ---------------- */
  {
    const g = makePart(root, 'chasis', L1([0, 0, 0]));
    g.add(mesh(rbox(X1 - X0, 6, ZF - ZB, 0.4), M.carcasaOsc, [(X0 + X1) / 2, 3, 0]));
    for (const x of [X0 + 6, X1 - 6]) for (const z of [ZB + 6, ZF - 6]) g.add(mesh(cylY(2.4, 1.2, 24), M.goma, [x, 0.6, z]));
    // plataforma del analizador con amortiguadores y pasos de mangueras/cables con pasamuros
    const xc = (X0 + X1) / 2;
    g.add(placaPasos(X1 - X0 - 6, ZF - ZB - 6, 2.4, PASOS.map(([x, z, r]) => [x - xc, z, r]), M.aluminio, [xc, HB + 1.2, 0], 'xz', 0.4));
    for (const [x, z, r] of PASOS) for (const y of [DY0, DY1]) g.add(pasamuros(r, M.goma, [x, y, z], 'y', 0.45));
    for (const x of [X0 + 12, X1 - 12]) for (const z of [ZB + 12, ZF - 12]) {
      g.add(mesh(cylY(2.6, 3, 24), M.goma, [x, HB - 1.5, z]));
      g.add(mesh(cylY(1.4, 3.4, 24), M.aceroPulido, [x, HB - 4.6, z]));
    }
    for (const x of [X0 + 3, X1 - 3]) for (const z of [ZB + 3, ZF - 3]) g.add(mesh(box(3, HB - 6, 3), M.aluminio, [x, (HB + 6) / 2, z]));
  }
  {
    const g = makePart(root, 'panel_frontal', L1([0, 0, 52], { shell: true, label: 'equipo' }));
    g.add(mesh(rbox(X1 - X0 - 0.4, HB - 7, 1.2, 0.5), M.grisClaro, [(X0 + X1) / 2, (HB + 6) / 2, ZF - 0.6]));
    for (const x of [X0 + 33, X0 + 66, X0 + 99]) g.add(mesh(box(0.25, HB - 10, 0.2), M.carcasaOsc, [x, (HB + 6) / 2, ZF + 0.02]));
    for (const x of [X0 + 30, X0 + 63, X0 + 96]) g.add(mesh(rbox(1.2, 10, 1.2, 0.4), M.aceroOscuro, [x, 48, ZF + 0.7]));
    const gm = M.grisClaro.clone(); gm.map = grille;
    g.add(mesh(new THREE.PlaneGeometry(X1 - X0 - 12, 9), gm, [(X0 + X1) / 2, 14, ZF + 0.03]));
    const lab = new THREE.MeshStandardMaterial({ map: textTexture(['Double Focusing Sector  ·  GC-HRMS'], { bg: '#d9dcdf', fg: '#2a3440', font: '600 40px Segoe UI' }), roughness: 0.45 });
    g.add(mesh(new THREE.PlaneGeometry(30, 3.8), lab, [X0 + 22, 72, ZF + 0.03]));
    [M.ledVerde, M.ledVerde, M.ledVerde, M.ledAmbar].forEach((mt, i) => g.add(mesh(cylZ(0.4, 0.3, 16), mt, [X1 - 22 + i * 3.2, 72, ZF + 0.15])));
  }
  {
    const g = makePart(root, 'tapa_analizador', L1([0, 64, 0], { shell: true, label: 'equipo' }));
    // cubierta hueca: techo, cuatro paredes y marco inferior (las mangueras y cables quedan dentro, sin atravesar sólidos)
    const y0 = HB + 3, hw = HT - 0.4 - y0, yc = y0 + hw / 2, xc = (X0 + X1) / 2;
    g.add(mesh(rbox(X1 - X0 + 0.2, 1.2, ZF - ZB + 0.2, 0.4), M.grisClaro, [xc, HT - 0.6, 0]));
    g.add(mesh(rbox(1.2, hw, ZF - ZB, 0.4), M.grisClaro, [X1 - 0.6, yc, 0]));
    for (const z of [ZF - 0.6, ZB + 0.6]) g.add(mesh(rbox(X1 - X0 - 2, hw, 1.2, 0.4), M.grisClaro, [xc, yc, z]));
    {
      // pared izquierda con ranura abierta por abajo: al levantar la tapa la línea de transferencia sale libre
      const xw = X0 + 0.6, yr = YN + RN, yt = y0 + hw;
      for (const [za, zb] of [[ZB, ZN - RN], [ZN + RN, ZF]]) g.add(mesh(box(1.2, hw, zb - za), M.grisClaro, [xw, yc, (za + zb) / 2]));
      g.add(mesh(box(1.2, yt - yr, 2 * RN), M.grisClaro, [xw, (yr + yt) / 2, ZN]));
      // perfil de goma en los bordes de la ranura
      for (const s2 of [-1, 1]) g.add(mesh(cylY(0.2, yr - y0, 8), M.goma, [xw, (y0 + yr) / 2, ZN + s2 * RN]));
      g.add(mesh(cylZ(0.2, 2 * RN, 8), M.goma, [xw, yr, ZN]));
    }
    // marco inferior azul (con el mismo hueco que la pared izquierda)
    const azul = M.azulBruker.clone(); azul.color.setHex(0x2f4a63);
    const yb = HB + 3.6, ba = 1.6, Xa = X0 - 0.1, Xb = X1 + 0.1, Za = ZB - 0.1, Zb = ZF + 0.1;
    for (const z of [Za + ba / 2, Zb - ba / 2]) g.add(mesh(rbox(Xb - Xa, 1.6, ba, 0.3), azul, [xc, yb, z]));
    g.add(mesh(rbox(ba, 1.6, Zb - Za - 2 * ba, 0.3), azul, [Xb - ba / 2, yb, 0]));
    for (const [z0, z1] of [[Za + ba, ZN - RN - 0.1], [ZN + RN + 0.1, Zb - ba]]) g.add(mesh(rbox(ba, 1.6, z1 - z0, 0.3), azul, [Xa + ba / 2, yb, (z0 + z1) / 2]));
    const gm = M.grisClaro.clone(); gm.map = grille; gm.color.setHex(0x9aa0a8);
    g.add(mesh(new THREE.PlaneGeometry(50, 16), gm, [20, HT + 0.03, -40], [-Math.PI / 2, 0, 0]));
    const w = new THREE.MeshStandardMaterial({ map: warningTexture('CAMPO MAGNÉTICO · ALTA TENSIÓN'), roughness: 0.45 });
    g.add(mesh(new THREE.PlaneGeometry(14, 5.2), w, [X1 - 22, HB + 30, ZF + 0.05]));
  }
  {
    const g = makePart(root, 'panel_trasero', L1([0, 0, -50], { info: 'consola', shell: true }));
    g.add(mesh(rbox(X1 - X0 - 0.4, HB - 7, 1.0, 0.4), M.grisClaro, [(X0 + X1) / 2, (HB + 6) / 2, ZB + 0.5]));
    const plate = new THREE.MeshStandardMaterial({ map: plateTexture(['GC-HRMS · Doble enfoque', '230/400 V 3~ 25 A', 'Modelo didáctico', 'Explorador 3D']), metalness: 0.6, roughness: 0.4 });
    g.add(mesh(new THREE.PlaneGeometry(10, 5), plate, [40, 60, ZB - 0.03], [0, Math.PI, 0]));
    for (const x of [0, 6]) g.add(mesh(cylZ(0.9, 3, 24), M.aceroPulido, [x, 20, ZB - 1.5]));     // agua de refrigeración
    g.add(mesh(rbox(5, 4, 1.2, 0.3), M.plasticoNegro, [-30, 16, ZB - 0.6]));
    // cable de alimentación hasta el suelo
    g.add(mesh(tubePath([[-30, 16, (ZB - 1.2)], [-30, 16, (ZB - 1.2) - 4], [-30 - 2, 10, (ZB - 1.2) - 9], [-30 - 5, 0.7, (ZB - 1.2) - 16], [-30 - 14, 0.7, (ZB - 1.2) - 36]], 0.45, 40, 10), M.cable));
  }
  {
    const g = makePart(root, 'panel_der', L1([34, 0, 0], { info: 'consola', shell: true }));
    g.add(mesh(rbox(1.0, HB - 7, ZF - ZB - 2.4, 0.4), M.grisClaro, [X1 - 0.5, (HB + 6) / 2, 0]));
    const gm = M.grisClaro.clone(); gm.map = grille;
    g.add(mesh(new THREE.PlaneGeometry(60, 16), gm, [X1 + 0.03, 30, 0], [0, Math.PI / 2, 0]));
  }

  {
    // se aparta menos que el GC (−30): queda entre ambos y no se mete en él
    const g = makePart(root, 'panel_izq', L1([-20, 0, 0], { info: 'consola', shell: true }));
    g.add(mesh(rbox(1.0, HB - 7, ZF - ZB - 2.4, 0.4), M.grisClaro, [X0 + 0.5, (HB + 6) / 2, 0]));
    const gm = M.grisClaro.clone(); gm.map = grille;
    g.add(mesh(new THREE.PlaneGeometry(50, 14), gm, [X0 - 0.03, 30, -40], [0, -Math.PI / 2, 0]));
    screws(g, M.tornillo, M.tornilloNegro, 0.3, '-x', [[X0 - 0.02, HB - 4, ZB + 4], [X0 - 0.02, HB - 4, ZF - 4], [X0 - 0.02, 10, ZB + 4], [X0 - 0.02, 10, ZF - 4]]);
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
  // entradas de las bombas rotatorias: una en la de x = −30 y dos en la de x = −4
  const ENTRADAS = [[-30, 30], [-4, 30], [-1, 24]];
  {
    const g = makePart(root, 'bombas_rotatorias', L1([0, 0, 40], { label: 'equipo' }));
    for (const x of [-30, -4]) {
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
    g.add(mesh(rbox(26, 44, 30, 0.6), M.anodizado, [52, 30, 22]));
    for (let i = 0; i < 12; i++) g.add(mesh(box(22, 0.4, 1.4), M.aluminio, [52, 12 + i * 3, 37.4]));
    g.add(mesh(cylY(1.4, 2.4, 24), M.plasticoNegro, [52, 53.2, 22]));                        // conector de salida
    // cable de las bobinas: conector → bajo la plataforma → paso → borne del imán
    cableFlex(g, [[52, 54.0, 22], [52, 60, 22], [46, 70, 30, 'chasis'], [28, 78, 48, 'chasis'], [BI.x, DY0 - 1.6, BI.z, 'chasis'], [BI.x, DY1 + 1.6, BI.z, 'chasis'],
      [BI.x, BI.y - 6, BI.z, 'iman'], [BI.x, BI.y, BI.z, 'iman']], 0.7, M.cable, { seg: 96 });
  }
  {
    const g = makePart(root, 'fuente_alta_tension', L1([0, 0, -30], { label: 'equipo' }));
    g.add(mesh(rbox(26, 30, 24, 0.6), M.anodizado, [52, 22, -40]));
    const w = new THREE.MeshStandardMaterial({ map: warningTexture('ALTA TENSIÓN 5 kV'), roughness: 0.45 });
    g.add(mesh(new THREE.PlaneGeometry(10, 3.8), w, [65.05, 28, -40], [0, Math.PI / 2, 0]));
    // tres cables de AT: bornes cerámicos → bajo la plataforma → paso → pasamuros de la fuente de iones
    for (let i = 0; i < 3; i++) {
      const zi = -44 + i * 4, dz = (i - 1) * 0.7;
      g.add(mesh(cylY(0.8, 2.4, 20), M.ceramica, [46, 38.2, zi]));
      cableFlex(g, [[46, 39.0, zi], [46, 46, zi], [40, 64, zi + 8, 'chasis'], [0, 77, 8 + dz * 2, 'chasis'], [-38, 79.4, 42 + dz, 'chasis'],
        [PA.x, DY0 - 1.6, PA.z + dz, 'chasis'], [PA.x, DY1 + 1.6, PA.z + dz, 'chasis'], [PA.x, PA.y - 6, PA.z + dz, 'fuente_ei'], [PA.x, PA.y, PA.z + dz, 'fuente_ei']], 0.3, M.ptfe, { seg: 120, radial: 8 });
    }
  }
  {
    const g = makePart(root, 'electronica_control', L1([0, 0, -30], { label: 'equipo' }));
    g.add(mesh(rbox(44, 40, 0.25, 0.05), M.pcb, [-20, 36, ZB + 4]));
    const rnd = (() => { let a = 3; return () => ((a = (a * 16807) % 2147483647) / 2147483647); })();
    for (let i = 0; i < 50; i++) {
      const x = -40 + rnd() * 40, y = 18 + rnd() * 36;
      if (rnd() < 0.65) g.add(mesh(box(1 + rnd(), 1 + rnd(), 0.25), M.chip, [x, y, ZB + 4.25])); else g.add(mesh(cylZ(0.4, 1, 16), M.condensador, [x, y, ZB + 4.6]));
    }
    screws(g, M.tornillo, M.tornilloNegro, 0.3, 'z', [[-41, 55, ZB + 4.15], [1, 55, ZB + 4.15], [-41, 17, ZB + 4.15], [1, 17, ZB + 4.15]]);
  }
  {
    // al explosionar se aleja hacia la derecha y atrás (el panel derecho no lo alcanza)
    const g = makePart(root, 'enfriador', L1([40, 0, -24], { label: 'equipo' }));
    g.add(mesh(rbox(30, 52, 44, 0.8), M.grisClaro, [102, 26, -40]));
    const gm = M.grisClaro.clone(); gm.map = grille;
    g.add(mesh(new THREE.PlaneGeometry(24, 28), gm, [102, 29, -17.95]));
    const sc = new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0xffffff, emissiveIntensity: 0.8, emissiveMap: screenTexture([['Agua', '20,0 °C'], ['Caudal', '13 L/min']], { title: 'Chiller' }) });
    g.add(mesh(new THREE.PlaneGeometry(10, 4), sc, [102, 46, -17.9]));
    // mangueras de agua: racor del enfriador → hueco entre equipos → por detrás de la consola → racor del panel trasero
    for (const [y, c, xc] of [[20, M.acento, 6], [24, M.etiquetaAmarilla, 0]]) {
      g.add(mesh(cylX(0.9, 2.2, 20), M.aceroPulido, [86, y, -40]));
      const pt = 'panel_trasero';
      cableFlex(g, [[85.4, y, -40], [83.6, y, -42.5], [83.4, y, -60], [83.2, y, -74],
        [81.5, y, ZB - 6, pt], [76, y, ZB - 7.5, pt], [xc + 8, y, ZB - 7.5, pt], [xc + 2.5, y - (y - 20) * 0.1, ZB - 7, pt],
        [xc, 20 + (y - 20) * 0.25, ZB - 5.5, pt], [xc, 20, ZB - 4.2, pt], [xc, 20, ZB - 2.6, pt]], 0.7, c, { seg: 140 });
    }
  }

  /* ---------------- CROMATÓGRAFO Y ENTRADAS ---------------- */
  {
    const g = makePart(root, 'gc', L1([-30, 0, 0], { shell: true, label: 'equipo' }));
    g.add(mesh(rbox(34, 70, 60, 0.6), M.carcasaOsc, [-72, 35, 20]));                         // mesa lateral
    g.add(mesh(rbox(34, 48, 58, 0.8), M.grisClaro, [-72, 94, 20]));
    g.add(mesh(rbox(26, 30, 1.2, 0.5), M.carcasaOsc, [-74, 92, 49.6]));                       // puerta del horno
    const sc = new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0xffffff, emissiveIntensity: 0.8, emissiveMap: screenTexture([['Horno', '310 °C'], ['Inyector', '280 °C']], { title: 'GC' }) });
    g.add(mesh(rbox(10, 6, 0.4, 0.2), M.plasticoNegro, [-64, 112, 49.2]));
    g.add(mesh(new THREE.PlaneGeometry(9.2, 5.2), sc, [-64, 112, 49.5]));
    g.add(mesh(cylY(2, 4, 24), M.acero, [-78, 120, 30]));                                     // inyector
    g.add(mesh(rbox(8, 2.4, 8, 0.4), M.carcasaOsc, [-78, 118.6, 30]));
  }
  {
    const g = makePart(root, 'linea_transferencia', L1([-12, 0, 0], { label: 'equipo' }));
    // salida del GC → ranura de la tapa (tramo recto y horizontal) → capilar de la fuente
    const c = W(new THREE.Vector3(-2.2, 0, 5.6));
    cableFlex(g, [[-55.6, YN, ZN, 'gc'], [X0 + 0.6, YN, ZN], [X0 + 3, YN + 0.2, ZN + 0.2], [-47, 103.8, 37.8],
      [c.x - 1.4, c.y - 1.1, c.z - 3.2, 'fuente_ei'], [c.x, c.y, c.z - 1.2, 'fuente_ei'], [c.x, c.y, c.z + 0.4, 'fuente_ei']], 1.1, M.aislanteTerm, { seg: 96, radial: 14 });
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
