// Equipo completo Agilent 6546 LC/Q-TOF: cuerpo de 122 × 76 cm con torre vertical del tubo de vuelo (193 cm de altura total),
// fuente Dual AJS en el extremo izquierdo, sistema de calibrante (CDS), cámara de vacío de cinco etapas, dos turbos de flujo
// dividido, bomba primaria en el suelo, electrónica con ADC de doble ganancia y cromatógrafo 1290 Infinity II (contexto).
import * as THREE from 'three';
import { M, ribTexture } from '../../materials.js';
import { mesh, rbox, rrShape, box, cylX, cylY, cylZ, washerX, tubePath, placaPasos, pasamuros, grilleTexture, textTexture, screws, screenTexture, plateTexture, warningTexture } from '../../geom.js';
import { makePart, cableFlex } from '../../parts.js';
import { buildAnalizador } from './analizador.js';
import { ORIGEN, AX } from './geometria.js';

const L1 = (offset, extra = {}) => ({ level: 1, offset, mode: 'equipo', ...extra });
const X0 = -61, X1 = 61, ZB = -38, ZF = 38, HB = 92, HT = 193;
const TX0 = 30, TX1 = 60, TZ0 = -8, TZ1 = 34;          // torre del tubo de vuelo
const wx = (x) => ORIGEN.x + x;
const PH = HB - 4, PY = HB / 2 + 1.5;                // paneles hasta la cubierta (sin rendija superior)
const HX = [36, 42, 48], HY = 28;                       // pasos de las mangueras en el panel trasero
const PX = [74, 78, 82];                                 // entradas del colector de la bomba primaria

export function buildEquipo(root) {
  const refs = {};
  const grille = grilleTexture(26, 8);
  const blanco = M.carcasa.clone(); blanco.color.setHex(0xf0f1f3);
  const grafito = M.carcasaOsc.clone(); grafito.color.setHex(0x2c3036);

  /* ---------------- ESTRUCTURA ---------------- */
  {
    const g = makePart(root, 'chasis', L1([0, 0, 0]));
    g.add(mesh(rbox(X1 - X0 - 0.3, 5, ZF - ZB - 0.3, 0.5), grafito, [0, 2.5, 0]));          // 0,15 cm por dentro de los paneles (sin parpadeo)
    for (const x of [X0 + 6, X1 - 6]) for (const z of [ZB + 6, ZF - 6]) g.add(mesh(cylY(2, 1.2, 24), M.goma, [x, 0.6, z]));
    for (const x of [X0 + 3, X1 - 3]) for (const z of [ZB + 3, ZF - 3]) g.add(mesh(box(3, HB - 6, 3), M.aluminio, [x, HB / 2, z]));
    // bandeja intermedia con pasos para las turbos y la línea de vacío primario
    const PASOS = [[wx(AX.OCT_1 - 4), ORIGEN.z, 7], [wx(AX.C_0 + 4), ORIGEN.z, 7], [wx(AX.SKIM + 1), ORIGEN.z, 1.4]];
    g.add(placaPasos(X1 - X0 - 6, ZF - ZB - 6, 2, PASOS, M.aluminio, [0, 50, 0], 'xz', 0.3));
    for (const y of [49, 51]) g.add(pasamuros(1.4, M.goma, [wx(AX.SKIM + 1), y, ORIGEN.z], 'y'));
  }
  {
    const g = makePart(root, 'panel_frontal', L1([0, 0, 44], { shell: true, label: 'equipo' }));
    g.add(mesh(rbox(X1 - X0 - 0.4, PH, 1.2, 0.6), blanco, [0, PY, ZF - 0.6]));
    g.add(mesh(rbox(54, HB - 14, 1.0, 0.6), grafito, [26, HB / 2 + 1, ZF + 0.1]));          // panel oscuro derecho
    g.add(mesh(rbox(1.2, 30, 0.4, 0.2), M.acento, [3.5, 62, ZF + 0.7]));                     // franja de estado
    const lab = new THREE.MeshStandardMaterial({ map: textTexture(['6546 LC/Q-TOF'], { bg: '#2c3036', fg: '#e8eaec', font: '600 58px Segoe UI' }), roughness: 0.4 });
    g.add(mesh(new THREE.PlaneGeometry(18, 4.5), lab, [36, 80, ZF + 0.65]));
    const gm = grafito.clone(); gm.map = grille; gm.color.setHex(0x6a7078);
    g.add(mesh(new THREE.PlaneGeometry(46, 14), gm, [26, 18, ZF + 0.65]));
    // indicador de estado, interruptor y número de serie
    g.add(mesh(rbox(5, 1.4, 0.4, 0.3), M.plasticoNegro, [-48, 84, ZF + 0.4])); g.add(mesh(box(4, 0.5, 0.2), M.ledAmbar, [-48, 84, ZF + 0.65]));
    g.add(mesh(cylZ(1.4, 0.6, 32), M.plasticoNegro, [-54, 10, ZF + 0.3])); g.add(mesh(cylZ(0.5, 0.7, 20), M.ledVerde, [-54, 10, ZF + 0.5]));
    // sistema de calibrante (CDS): botellas tras una ventana
    g.add(mesh(rbox(24, 20, 0.6, 0.4), M.plasticoNegro, [-36, 66, ZF + 0.3]));
    const gl = M.vidrio.clone(); gl.opacity = 0.25;
    g.add(mesh(rbox(22, 18, 0.3, 0.3), gl, [-36, 66, ZF + 0.7]));
  }
  {
    const g = makePart(root, 'cubierta', L1([0, 36, 0], { info: 'carcasa', shell: true }));
    g.add(mesh(rbox(TX0 - X0, 1.4, ZF - ZB + 0.2, 0.6), blanco, [(X0 + TX0) / 2, HB + 0.2, 0]));
    g.add(mesh(rbox(X1 - TX0, 1.4, TZ0 - ZB, 0.6), blanco, [(TX0 + X1) / 2, HB + 0.2, (ZB + TZ0) / 2]));
    g.add(mesh(rbox(X1 - TX0, 1.4, ZF - TZ1, 0.6), blanco, [(TX0 + X1) / 2, HB + 0.2, (TZ1 + ZF) / 2]));
  }
  for (const [id, s, x] of [['panel_izq', -1, X0], ['panel_der', 1, X1]]) {
    const g = makePart(root, id, L1([s * 30, 0, 0], { info: 'carcasa', shell: true }));
    if (s < 0) {
      // lateral izquierdo: abertura de la interfaz de la fuente y paso del capilar PEEK de muestra
      g.add(placaPasos(ZF - ZB - 2.4, PH, 1.0, [[ORIGEN.z, ORIGEN.y + 2 - (PY), 7.6], [15.5, 88 - (PY), 0.5]], blanco, [x - s * 0.5, PY, 0], 'zy', 0.4));
      g.add(pasamuros(0.5, M.goma, [x - 0.02, 88, 15.5], 'x', 0.3));
    } else g.add(mesh(rbox(1.0, PH, ZF - ZB - 2.4, 0.4), blanco, [x - s * 0.5, PY, 0]));
    const gm = blanco.clone(); gm.map = grille; gm.color.setHex(0xb8bdc3);
    g.add(mesh(new THREE.PlaneGeometry(40, 14), gm, [x + s * 0.03, 24, -6], [0, s * Math.PI / 2, 0]));
    screws(g, M.tornillo, M.tornilloNegro, 0.3, s > 0 ? 'x' : '-x', [[x + s * 0.02, HB - 5, ZB + 4], [x + s * 0.02, HB - 5, ZF - 4], [x + s * 0.02, 8, ZB + 4], [x + s * 0.02, 8, ZF - 4]]);
  }
  {
    const g = makePart(root, 'panel_trasero', L1([0, 0, -40], { info: 'carcasa', shell: true }));
    // panel trasero con tres pasos de las mangueras de vacío primario
    g.add(placaPasos(X1 - X0 - 0.4, PH, 1.0, HX.map((x) => [x, HY - (PY), 1.5]), blanco, [0, PY, ZB + 0.5], 'xy', 0.4));
    for (const x of HX) g.add(pasamuros(1.5, M.goma, [x, HY, ZB - 0.02], 'z'));
    const plate = new THREE.MeshStandardMaterial({ map: plateTexture(['LC/Q-TOF', '200–240 V~ 50/60 Hz 2850 VA', 'Modelo didáctico', 'Explorador 3D']), metalness: 0.6, roughness: 0.4 });
    g.add(mesh(new THREE.PlaneGeometry(9, 4.5), plate, [30, 60, ZB - 0.03], [0, Math.PI, 0]));
    for (const x of [-40, -34]) { g.add(mesh(rbox(4, 3, 1.2, 0.3), M.plasticoNegro, [x, 16, ZB - 0.6]));
      g.add(mesh(tubePath([[x, 16, ZB - 1.2], [x, 16, ZB - 5], [x - 2, 10, ZB - 10], [x - 5, 0.7, ZB - 16], [x - 12, 0.7, ZB - 34]], 0.45, 40, 10), M.cable)); }
    g.add(mesh(cylZ(0.7, 2.4, 24), M.aceroPulido, [-20, 56, ZB - 1.2]));                 // entrada de N₂ (pasamuros)
    g.add(mesh(cylZ(0.6, 1.0, 6), M.aceroPulido, [-20, 56, ZB + 1.5]));                  // tuerca interior
    g.add(mesh(rbox(2, 1.4, 0.8, 0.2), M.plasticoNegro, [-10, 30, ZB - 0.4]));           // LAN
  }
  {
    // sube en vertical (sin desplazamiento en z) para no cruzarse con la cubierta superior
    const g = makePart(root, 'torre_tof', L1([0, 40, 0], { shell: true, label: 'equipo' }));
    g.add(mesh(rbox(TX1 - TX0, HT - HB, TZ1 - TZ0, 1.2), blanco, [(TX0 + TX1) / 2, (HB + HT) / 2, (TZ0 + TZ1) / 2]));
    // moldura inferior: marco hueco (deja pasar el tubo de vuelo y el cable del ADC)
    const fr = rrShape(TX1 - TX0 + 0.2, TZ1 - TZ0 + 0.2, 0.5), hl = new THREE.Path();
    const iw = (TX1 - TX0) / 2 - 1, id = (TZ1 - TZ0) / 2 - 1;
    hl.moveTo(-iw, -id); hl.lineTo(-iw, id); hl.lineTo(iw, id); hl.lineTo(iw, -id); hl.lineTo(-iw, -id); fr.holes.push(hl);
    const fg = new THREE.ExtrudeGeometry(fr, { depth: 1.4, bevelEnabled: false, curveSegments: 6 }); fg.translate(0, 0, -0.7);
    g.add(mesh(fg, grafito, [(TX0 + TX1) / 2, HB + 2, (TZ0 + TZ1) / 2], [-Math.PI / 2, 0, 0]));
    const gm = blanco.clone(); gm.map = grille; gm.color.setHex(0xaab0b7);
    g.add(mesh(new THREE.PlaneGeometry(22, 12), gm, [(TX0 + TX1) / 2, HT + 0.03, (TZ0 + TZ1) / 2], [-Math.PI / 2, 0, 0]));
  }

  /* ---------------- FUENTE Y CALIBRANTE ---------------- */
  {
    // se separa entre el panel izquierdo (−30) y el LC (−30 desde más lejos): nunca los atraviesa
    const g = makePart(root, 'carcasa_fuente', L1([-33, 0, 0], { shell: true, label: 'equipo' }));
    const y = ORIGEN.y + 2, z = ORIGEN.z;
    g.add(mesh(rbox(13.9, 28, 24, 1.2), grafito, [X0 - 7.05, y, z]));                    // apoyada contra el panel, sin penetrarlo
    const gl = M.vidrio.clone(); gl.opacity = 0.25;
    g.add(mesh(cylZ(5, 0.6, 40), gl, [X0 - 6, y, z + 12.2]));                             // mirilla de la cámara de spray
    g.add(mesh(new THREE.TorusGeometry(5.2, 0.5, 12, 48), M.aceroPulido, [X0 - 6, y, z + 12.2]));
    g.add(mesh(rbox(1.6, 6, 2.4, 0.6), M.aceroPulido, [X0 - 14.5, y - 6, z + 6]));          // pestillo
    const w = new THREE.MeshStandardMaterial({ map: warningTexture('SUPERFICIE CALIENTE'), roughness: 0.45 });
    g.add(mesh(new THREE.PlaneGeometry(9, 3.4), w, [X0 - 6, y + 10, z + 12.05]));
  }
  {
    const g = makePart(root, 'cds', L1([0, 0, 24], { label: 'equipo' }));
    for (const [x, c, s] of [[-42, 0xcfe6ff, 1], [-30, 0xe8f0d0, -1]]) {
      g.add(mesh(cylY(3.2, 12, 32), M.vidrio, [x, 66, ZF - 5]));
      const liq = M.disolvente.clone(); liq.color.setHex(c);
      g.add(mesh(cylY(3.05, 7, 32), liq, [x, 63.6, ZF - 5]));
      g.add(mesh(cylY(1.6, 2.4, 24), M.peekBeige, [x, 73, ZF - 5]));
      // de cada botella a la válvula selectora, por detrás de la botella
      g.add(mesh(tubePath([[x, 74.2, ZF - 5], [x, 75.6, ZF - 5.6], [x + s, 74, ZF - 8.6], [x + s * 2.5, 64, ZF - 9], [x + s * 3.5, 59.1, ZF - 7.5]], 0.1, 40, 6), M.ptfe));
    }
    g.add(mesh(rbox(8, 6, 6, 0.4), M.anodizado, [-36, 56, ZF - 6]));                       // válvula selectora
    // salida de la válvula al nebulizador de referencia (sigue al nebulizador al despiezar)
    const ax = new THREE.Vector3(0, Math.cos(0.35), Math.sin(0.35)), ref = new THREE.Vector3(wx(AX.SPRAY.x + 0.4), ORIGEN.y + AX.SPRAY.y + 5, ORIGEN.z + 3.6);
    const e1 = ref.clone().addScaledVector(ax, 4.35), e2 = ref.clone().addScaledVector(ax, 6.2);
    cableFlex(g, [[-40.05, 56, ZF - 6], [-44, 57, ZF - 7], [-52, 70, 24.5, 'nebulizador_referencia'], [e2.x, e2.y, e2.z, 'nebulizador_referencia'], [e1.x, e1.y, e1.z, 'nebulizador_referencia']], 0.1, M.ptfe, { seg: 60, radial: 6 });
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
    const g = makePart(root, 'bombas_turbo', L1([0, -20, 0], { label: 'equipo' }));
    for (const lx of [AX.OCT_1 - 4, AX.C_0 + 4]) {
      const x = wx(lx), y = ORIGEN.y - 7, z = ORIGEN.z;
      g.add(mesh(cylY(2.6, 5.2, 32), M.aceroPulido, [x, y - 0.9, z]));                     // brida de entrada, apoyada en la cámara
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
    // mangueras de vacío: cámara/turbos → bandeja → pasos del panel trasero → colector de la bomba
    const g = makePart(root, 'linea_vacio', L1([0, 0, 0], { info: 'bomba_primaria' }));
    const mat = M.aceroOscuro.clone(); mat.color.setHex(0xb3b8be); mat.roughness = 0.32; mat.roughnessMap = null; mat.bumpMap = ribTexture(160); mat.bumpScale = 3;
    const t1 = wx(AX.OCT_1 - 4) + 5.6, t2 = wx(AX.C_0 + 4) + 5.6, rx = wx(AX.SKIM + 1), z = ORIGEN.z, yt = ORIGEN.y - 19;
    const INI = [
      [[rx, ORIGEN.y - 9.6, z, 'camara_vacio'], [rx, 51.8, z, 'chasis'], [rx, 48.2, z, 'chasis'], [rx + 0.3, 40, z - 3, 'chasis'], [-26, 31, 0, 'chasis'], [10, 29.5, -20, 'chasis']],
      [[t1, yt, z, 'bombas_turbo'], [t1 + 3.4, yt - 1, z, 'bombas_turbo'], [t1 + 6.4, yt - 7, z - 4, 'bombas_turbo'], [5, 32, -6, 'chasis']],
      [[t2, yt, z, 'bombas_turbo'], [t2 + 3.4, yt - 1, z, 'bombas_turbo'], [t2 + 6.4, yt - 7, z - 4, 'bombas_turbo'], [HX[2], 31, -20, 'chasis']],
    ];
    INI.forEach((ini, i) => {
      // por fuera: escalonadas en z y hacia la derecha hasta rebasar el borde del panel, sin cruzarse entre sí
      const hx = HX[i], px = PX[2 - i], zr = ZB - 4 - (2 - i) * 2.2;
      cableFlex(g, [...ini, [hx, HY + 1, -31, 'chasis'], [hx, HY, ZB + 1.7, 'panel_trasero'], [hx, HY, ZB - 0.8, 'panel_trasero'], [hx + 2, HY, zr, 'panel_trasero'],
        [62, HY, zr, 'panel_trasero'], [px - 4, HY + 2, zr, 'bomba_primaria'], [px, HY + 4, zr + 4, 'bomba_primaria'], [px, HY + 3, -31, 'bomba_primaria'], [px, 28.85, -28, 'bomba_primaria']], 0.8, mat, { seg: 180, radial: 12 });
    });
  }

  /* ---------------- ELECTRÓNICA Y GASES ---------------- */
  {
    const g = makePart(root, 'electronica', L1([0, 0, -26], { label: 'equipo' }));
    g.add(mesh(rbox(60, 34, 0.3, 0.06), M.pcb, [0, 30, ZB + 4]));
    const rnd = (() => { let a = 7; return () => ((a = (a * 16807) % 2147483647) / 2147483647); })();
    const usados = [];                                                                     // componentes sin solaparse (evita caras coplanares)
    for (let i = 0; i < 60; i++) { const x = -28 + rnd() * 56, y = 15 + rnd() * 30, chip = rnd() < 0.65;
      const w = chip ? 1 + rnd() * 1.5 : 0.8, h = chip ? 1 + rnd() : 0.8;
      if (usados.some((u) => Math.abs(u[0] - x) < (u[2] + w) / 2 + 0.1 && Math.abs(u[1] - y) < (u[3] + h) / 2 + 0.1)) continue;
      usados.push([x, y, w, h]);
      if (chip) g.add(mesh(box(w, h, 0.3), M.chip, [x, y, ZB + 4.3])); else g.add(mesh(cylZ(0.4, 1, 16), M.condensador, [x, y, ZB + 4.7])); }
    screws(g, M.tornillo, M.tornilloNegro, 0.3, 'z', [[-29, 46, ZB + 4.2], [29, 46, ZB + 4.2], [-29, 14, ZB + 4.2], [29, 14, ZB + 4.2]]);
    g.add(mesh(rbox(22, 14, 18, 0.5), M.aluminio, [45, 14, -12]));                          // fuente de alimentación
  }
  {
    const g = makePart(root, 'adc', L1([0, 30, 0], { label: 'equipo' }));
    // placa ADC en la cara trasera de la torre, fuera del tubo de vuelo
    const zb = TZ0 + 4;
    g.add(mesh(rbox(22, 22, 0.3, 0.06), M.pcb, [(TX0 + TX1) / 2 + 2, 130, zb]));
    for (let i = 0; i < 2; i++) g.add(mesh(rbox(6, 6, 1.4, 0.3), M.aluminio, [(TX0 + TX1) / 2 + 2, 126 + i * 8, zb + 0.85]));
    g.add(mesh(box(2, 1, 1), M.plasticoNegro, [50, 118.6, zb + 0.4]));                    // conector de señal
    // cable de señal: baja por detrás del tubo de vuelo hasta el pasamuros de la carcasa del TOF
    const dx = wx(AX.DET.x), dz = ORIGEN.z - 7.25;
    cableFlex(g, [[50, 118.05, zb + 0.4], [50, 110, zb + 0.4], [51, 90, zb + 1], [53, 74, dz - 7, 'camara_vacio'], [dx, ORIGEN.y - 1.6, dz - 2.6, 'camara_vacio'], [dx, ORIGEN.y - 2, dz - 0.05, 'camara_vacio']], 0.2, M.cable, { seg: 80, radial: 8 });
  }
  {
    const g = makePart(root, 'linea_gases', L1([0, 14, 0], { label: 'equipo' }));
    g.add(mesh(rbox(10, 8, 8, 0.4), M.grisClaro, [-22, 82, -24]));
    // N₂ desde el pasamuros del panel trasero (por encima de la bandeja y de la electrónica)
    cableFlex(g, [[-20, 56, ZB + 1.95, 'panel_trasero'], [-20, 56, ZB + 4.5, 'panel_trasero'], [-20.5, 66, -29], [-21.5, 76, -25], [-22, 78.05, -24]], 0.25, M.ptfe, { seg: 60, radial: 8 });
    // gas del nebulizador hasta su racor
    const p = AX.SPRAY;
    cableFlex(g, [[-27.05, 84, -22], [-31, 85.5, -16], [-42, 87.6, 6, 'nebulizador_ajs'], [wx(p.x + 7.9), ORIGEN.y + p.y + 18, ORIGEN.z + 2.3, 'nebulizador_ajs'], [wx(p.x + 5.65), ORIGEN.y + p.y + 18, ORIGEN.z + 2.5, 'nebulizador_ajs']], 0.25, M.ptfe, { seg: 70, radial: 8 });
    // gas de colisión (cobre) hasta el racor de la celda en la cámara
    const cx = wx(AX.C_0 + 2);
    cableFlex(g, [[-16.95, 84, -22], [-8, 84, -10], [cx - 5, 80, ORIGEN.z - 6, 'camara_vacio'], [cx, 75.5, ORIGEN.z - 0.4, 'camara_vacio'], [cx, 73.05, ORIGEN.z, 'camara_vacio']], 0.15, M.cobre, { seg: 60, radial: 8 });
  }

  /* ---------------- LC 1290 (contexto) ---------------- */
  {
    const g = makePart(root, 'lc', L1([-30, 0, 0], { shell: true, label: 'equipo' }));
    const cx = -98, W = 34, D = 46;
    const mod = (y0, h, extra) => {
      g.add(mesh(rbox(W, h - 0.4, D, 0.8), blanco, [cx, y0 + h / 2, 0]));
      g.add(mesh(rbox(W - 2, 1.4, 0.6, 0.3), M.acento, [cx, y0 + h - 2, D / 2 + 0.1]));
      g.add(mesh(box(1.8, 0.4, 0.2), M.ledVerde, [cx + W / 2 - 4, y0 + h - 4, D / 2 + 0.3]));
      if (extra) extra(y0, h);
    };
    mod(0, 40, (y0, h) => { g.add(mesh(rbox(W - 4, h - 10, 0.6, 0.6), grafito, [cx, y0 + h / 2 - 2, D / 2 + 0.2])); });
    mod(40, 22, (y0, h) => { g.add(mesh(rbox(W - 4, h - 7, 0.8, 0.5), blanco, [cx, y0 + h / 2 - 1, D / 2 + 0.3])); g.add(mesh(rbox(1.4, 7, 1, 0.4), M.aceroOscuro, [cx + 13, y0 + h / 2 - 1, D / 2 + 1]));
      g.add(mesh(cylX(0.55, 12, 24), M.aceroPulido, [cx, y0 + h / 2, D / 2 - 6])); });
    mod(62, 18, (y0, h) => { for (const x of [cx - 8, cx + 8]) g.add(mesh(cylZ(1.6, 1.2, 24), M.aceroPulido, [x, y0 + h / 2 - 1, D / 2 + 0.4])); });
    g.add(mesh(rbox(W, 1.2, D - 6, 0.4), blanco, [cx, 80.6, 0]));
    for (let i = 0; i < 4; i++) { const x = cx - 12 + i * 8;
      g.add(mesh(cylY(3, 18, 32), M.vidrio, [x, 90.2, 4])); g.add(mesh(cylY(2.85, 12, 32), M.disolvente, [x, 87.35, 4])); g.add(mesh(cylY(1.4, 2.4, 24), M.peekBeige, [x, 100.4, 4])); }
    g.add(mesh(cylX(0.45, 0.9, 20), M.aceroPulido, [cx + W / 2 + 0.45, 51, D / 2 - 6]));    // salida de la columna (lateral derecho)
  }
  {
    // capilar PEEK: sube entre el LC y la carcasa de la fuente, pasa por encima y entra por el lateral hasta el nebulizador
    const g = makePart(root, 'tubo_muestra', L1([0, 0, 0], { info: 'lc' }));
    const p = AX.SPRAY, yn = ORIGEN.y + p.y + 18.4, zn = ORIGEN.z + 1.5;
    cableFlex(g, [[-80.15, 51, 17, 'lc'], [-79.6, 51.5, 17, 'lc'], [-79.6, 60, 17, 'lc'], [-79.6, 83, 17, 'lc'], [-72, 87.4, 16, 'carcasa_fuente'],
      [-63, yn, zn, 'panel_izq'], [X0 - 0.5, yn, zn, 'panel_izq'], [X0 + 1.5, yn, zn, 'panel_izq'], [wx(p.x - 3.35), yn, zn, 'nebulizador_ajs']], 0.1, M.peekRojo, { seg: 120, radial: 8 });
  }

  refs.analyzer = buildAnalizador(root);

  // los cables y mangueras son cableFlex: siguen a sus piezas sin reconstrucción manual
  refs.update = () => {};
  return refs;
}
