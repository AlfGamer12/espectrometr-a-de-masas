// «Circuito de flujo» del 1260 Infinity II: esquema 3D ampliado (no a escala) del recorrido de la fase móvil y de la luz.
// Fila delantera (bomba G7111B): botellas A y B con filtros, desgasificador de vacío de cuatro canales, válvula de gradiente
// multicanal (MCGV), válvula de entrada pasiva, dos cámaras con pistones de zafiro en serie y su accionamiento, válvula de salida,
// amortiguador y válvula de purga. A la derecha, el Vialsampler: válvula de inyección de 2 posiciones y 6 puertos, dosificador,
// bucle, aguja con su asiento y vial. Fila trasera: intercambiador de calor y columna del compartimento integrado, y el detector de
// diodos (lámparas de wolframio y deuterio, acromático, filtro de holmio, celda, lente del espectrógrafo, rendija, red holográfica
// cóncava y matriz de 1024 fotodiodos). Coordenadas locales (cm) del grupo, colocado en CIRC.
import * as THREE from 'three';
import { M } from '../../materials.js';
import { mesh, rbox, box, cylX, cylY, cylZ, helix, textTexture, placaPasos } from '../../geom.js';
import { makePart, cableFlex } from '../../parts.js';
import { C, CIRC, OPT, PLAT, FR, BR, YB } from './geometria.js';

// el circuito ocupa su propio espacio: solo se ve en el modo «Circuito de flujo» (onlyAnalyzer)
const L2 = (offset, label = true, extra = {}) => ({ level: 2, offset, mode: 'analizador', onlyAnalyzer: true, label: label ? 'analizador' : null, ...extra });

function botella(r, h, cuello = 0.45) {
  const p = [[0, 0], [r * 0.93, 0], [r, r * 0.12], [r, h * 0.74], [r * 0.84, h * 0.87], [r * cuello * 1.25, h * 0.96], [r * cuello, h], [r * cuello, h * 1.06], [0, h * 1.06]];
  return new THREE.LatheGeometry(p.map(([a, b]) => new THREE.Vector2(a, b)), 40);
}
/** Haz de luz: tronco de cono abierto a lo largo de z entre z0 (radio r0) y z1 (radio r1). Lo enciende la simulación. */
function haz(x, y, z0, z1, r0, r1, color = 0xfff4d6) {
  const L = Math.abs(z1 - z0), g = new THREE.CylinderGeometry(r1, r0, L, 32, 1, true); g.rotateX(z1 < z0 ? -Math.PI / 2 : Math.PI / 2);
  const m = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  const h = new THREE.Mesh(g, m); h.position.set(x, y, (z0 + z1) / 2); h.userData.noClone = true; h.castShadow = false; h.raycast = () => {};
  return h;
}
/** Rótulo plano sobre el frente de una plataforma. */
function letrero(txt, w, color = '#e9edf2') {
  const tex = textTexture([txt], { w: 1024, h: 96, bg: '#2a2f36', fg: color, font: '600 46px Segoe UI' });
  return new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 });
}
/** Válvula de bola (cartucho): carcasa de acero arriba y abajo, cuerpo transparente con bola de rubí y su asiento. */
function valvulaBola(g, x, y, z, h = 3.2, rubi) {
  g.add(mesh(cylY(0.95, 0.7, 24), M.acero, [x, y - h / 2 + 0.35, z]));
  g.add(mesh(cylY(0.95, 0.7, 24), M.acero, [x, y + h / 2 - 0.35, z]));
  const gl = M.vidrio.clone(); gl.opacity = 0.35; g.add(mesh(cylY(0.85, h - 1.4, 24), gl, [x, y, z]));
  g.add(mesh(new THREE.TorusGeometry(0.42, 0.12, 10, 24), M.aceroPulido, [x, y - 0.35, z], [Math.PI / 2, 0, 0]));
  const b = mesh(new THREE.SphereGeometry(0.42, 20, 14), rubi, [x, y + 0.05, z]); g.add(b);
  return b;
}

export function buildCircuito(parent) {
  const refs = { haces: [], rutas: {} };
  const A = makePart(parent, 'circuito', { level: 1, offset: [0, 0, 0], mode: 'analizador', onlyAnalyzer: true });
  A.position.copy(CIRC);
  const grafito = M.carcasaOsc.clone(); grafito.color.setHex(0x30353c);
  const rubi = new THREE.MeshPhysicalMaterial({ color: 0xc0122c, roughness: 0.15, clearcoat: 1, transmission: 0, metalness: 0 });
  const zafiro = new THREE.MeshPhysicalMaterial({ color: 0xd8e6f2, roughness: 0.08, metalness: 0, clearcoat: 1, transparent: true, opacity: 0.85 });
  const ptfe = M.ptfe, cap = M.aceroPulido, peek = M.peekBeige;
  const fit = (g, p, eje = 'y', r = 0.45, L = 0.9, mat = M.acero) => g.add(mesh(eje === 'x' ? cylX(r, L, 6) : eje === 'z' ? cylZ(r, L, 6) : cylY(r, L, 6), mat, p));

  /* ---------------- PLATAFORMAS Y RÓTULOS ---------------- */
  {
    const g = makePart(A, 'plataformas', L2([0, 0, 0], false, { info: 'circuito' }));
    const rot = { bomba: 'BOMBA CUATERNARIA G7111B', muestreador: 'VIALSAMPLER G7129', columna: 'COMPARTIMENTO DE COLUMNA', detector: 'DETECTOR DE DIODOS G7115A' };
    for (const [k, [x0, x1, z0, z1, yt]] of Object.entries(PLAT)) {
      const h = yt + 1.2, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
      g.add(mesh(rbox(x1 - x0, h, z1 - z0, 0.4), grafito, [cx, yt - h / 2, cz]));
      const w = Math.min(x1 - x0 - 2, 22);
      g.add(mesh(new THREE.PlaneGeometry(w, w * 96 / 1024), letrero(rot[k], w), [cx, yt - h / 2, z1 + 0.01]));
    }
  }

  /* ---------------- BOTELLAS Y FILTROS ---------------- */
  {
    const g = makePart(A, 'deposito', L2([-8, 0, 6]));
    const vb = M.vidrio.clone(); vb.opacity = 0.3;
    for (const [p, col, et] of [[C.botA, 0xbfe0ff, 'A · agua (pH 2,5)'], [C.botB, 0xffe7c2, 'B · acetonitrilo']]) {
      g.add(mesh(botella(3.4, 13), vb, [p.x, 0.02, p.z]));
      const liq = M.disolvente.clone(); liq.color.setHex(col); liq.opacity = 0.45;
      g.add(mesh(cylY(3.2, 7.5, 32), liq, [p.x, 3.9, p.z]));
      g.add(placaPasos(3.9, 3.9, 1.5, [[0, 0, 0.3]], M.grisClaro, [p.x, 13.9, p.z], 'xz', 1.95));   // tapón con paso para la línea
      g.add(mesh(cylY(0.75, 1.4, 20), M.acero, [p.x, 0.95, p.z]));                         // filtro de entrada (acero sinterizado)
      const e = new THREE.MeshStandardMaterial({ map: textTexture([et], { w: 512, h: 96, bg: '#fbfbf8', fg: '#20252c', font: '600 40px Segoe UI' }), roughness: 0.6 });
      const pl = mesh(new THREE.CylinderGeometry(3.43, 3.43, 1.6, 32, 1, true, -0.9, 1.8), e, [p.x, 9.6, p.z]); pl.userData.decal = true; g.add(pl);
    }
  }

  /* ---------------- DESGASIFICADOR DE VACÍO ---------------- */
  const d = C.desg;
  {
    const g = makePart(A, 'desgasificador', L2([-4, 7, 7], true, { info: 'desgasificador_vac' }));
    const acr = M.vidrio.clone(); acr.opacity = 0.18; acr.color.setHex(0xdfe8f0);
    g.add(mesh(box(12, 9, 11), acr, [d.x, 4.5, d.z]));
    g.add(mesh(rbox(12.6, 0.8, 11.6, 0.2), M.aluminio, [d.x, 0.4, d.z]));
    g.add(mesh(rbox(12.6, 0.8, 11.6, 0.2), M.aluminio, [d.x, 9.4, d.z]));
    // cuatro tubos de membrana (copolímero TFE/PDD) enrollados; A y B en uso, C y D sin conectar
    const mem = new THREE.MeshPhysicalMaterial({ color: 0xf2f0e6, roughness: 0.3, transparent: true, opacity: 0.9 });
    [10.4, 12.8, 15.2, 17.6].forEach((z, i) => {
      g.add(mesh(helix(1.0, 10.8, 9, 0.16, 320), mem, [d.x, 3.2 + (i % 2) * 2.6, z], [0, Math.PI / 2, 0]));
      fit(g, [d.x - 6.4, 3.2 + (i % 2) * 2.6, z], 'x', 0.38, 0.8, peek); fit(g, [d.x + 6.4, 3.2 + (i % 2) * 2.6, z], 'x', 0.38, 0.8, peek);
    });
    // bomba de vacío y su conducción
    g.add(mesh(rbox(5, 4, 4, 0.4), M.anodizado, [d.x - 8, 2, 6.2]));
    g.add(mesh(cylX(1.2, 2.4, 24), grafito, [d.x - 5, 2.4, 6.2]));
    cableFlex(g, [[d.x - 7, 4.05, 6.6], [d.x - 6.6, 6.4, 7.0], [d.x - 5, 7.4, 8.0], [d.x - 4, 7.4, 8.9]], 0.25, M.cable, { seg: 30, radial: 8 });
    g.add(mesh(cylZ(0.45, 0.8, 16), M.acero, [d.x - 4, 7.4, 8.8]));
  }
  // líneas de las botellas al desgasificador (canales A y B)
  {
    const g = makePart(A, 'lineas', L2([0, 0, 0], false, { info: 'deposito' }));
    const ent = [
      [C.botA, 10.4, 3.2, [[-53, 18.4, 15.6, 'deposito'], [-47, 18.8, 15.6, 'deposito'], [-44, 15.6, 13.6, 'desgasificador']]],
      [C.botB, 12.8, 5.8, [[-45, 17.2, 11.6, 'deposito']]],
    ];
    ent.forEach(([p, z, y, via], i) => {
      const pts = [[p.x, 1.7, p.z, 'deposito'], [p.x, 9, p.z, 'deposito'], [p.x, 14.9, p.z, 'deposito'], [p.x, 16.6, p.z, 'deposito'], ...via,
        [d.x - 9.5, y + 2.5, z, 'desgasificador'], [d.x - 8.2, y + 0.3, z, 'desgasificador'], [d.x - 6.8, y, z, 'desgasificador']];
      cableFlex(g, pts, 0.17, ptfe, { seg: 90, radial: 8 });
      refs.rutas['bot' + 'AB'[i]] = pts.map((q) => new THREE.Vector3(q[0], q[1], q[2]));
    });
  }

  /* ---------------- MCGV ---------------- */
  const m = C.mcgv;
  {
    const g = makePart(A, 'mcgv', L2([-1, 8, 7]));
    g.add(mesh(rbox(6, 3.2, 8.4, 0.3), M.aluminio, [m.x, 1.6, m.z]));
    const sol = [];
    for (let i = 0; i < 4; i++) {
      const x = m.x - 1.5 + (i % 2) * 3, z = m.z - 2 + Math.floor(i / 2) * 4;
      g.add(mesh(cylY(1.0, 3.6, 24), M.plasticoNegro, [x, 5.0, z]));
      const led = mesh(cylY(0.32, 0.3, 12), M.ledAmbar.clone(), [x, 6.95, z]); led.material.emissiveIntensity = 0; g.add(led); sol.push(led);
      fit(g, [m.x - 3.4, 1.6, m.z - 3 + i * 2], 'x', 0.38, 0.8, peek);
    }
    refs.mcgvLed = sol;
    const tx = new THREE.MeshStandardMaterial({ map: textTexture(['A  B  C  D'], { w: 256, h: 48, bg: '#b9bec5', fg: '#20252c', font: '700 30px Segoe UI' }), roughness: 0.5 });
    g.add(mesh(new THREE.PlaneGeometry(2.6, 0.5), tx, [m.x - 3.01, 2.8, m.z], [0, -Math.PI / 2, 0]));
    fit(g, [m.x + 3.4, 1.6, m.z], 'x', 0.38, 0.8, M.acero);
  }
  // desgasificador → MCGV (A y B) y MCGV → válvula de entrada
  {
    const g = makePart(A, 'lineas_mcgv', L2([0, 0, 0], false, { info: 'mcgv' }));
    [[10.4, 3.2, 0], [12.8, 5.8, 1]].forEach(([z, y, i]) => {
      const pts = [[d.x + 6.8, y, z, 'desgasificador'], [d.x + 7.8, y, z, 'desgasificador'], [m.x - 4.9, 2 + i, (z + m.z - 3 + i * 2) / 2, 'mcgv'], [m.x - 3.9, 1.6, m.z - 3 + i * 2, 'mcgv'], [m.x - 3.0, 1.6, m.z - 3 + i * 2, 'mcgv']];
      cableFlex(g, pts, 0.15, ptfe, { seg: 50, radial: 8 });
      refs.rutas['mcgv' + 'AB'[i]] = pts.map((q) => new THREE.Vector3(q[0], q[1], q[2]));
    });
  }

  /* ---------------- CABEZAL DE BOMBEO ---------------- */
  const c1 = C.cam1, c2 = C.cam2;
  {
    const g = makePart(A, 'cabezal', L2([0, 4, 9], true, { shell: true }));
    for (const c of [c1, c2]) {
      g.add(mesh(rbox(6, 7, 8, 0.5), M.acero, [c.x, c.y, c.z + 1]));
      g.add(mesh(new THREE.TorusGeometry(0.62, 0.22, 12, 28), M.plasticoNegro, [c.x, c.y, c.z - 2.95]));   // junta del pistón (PTFE)
    }
  }
  {
    const g = makePart(A, 'cavidades', L2([0, 4, 9], false, { info: 'cabezal' }));
    for (const c of [c1, c2]) {
      const liq = M.disolvente.clone(); liq.opacity = 0.35;
      g.add(mesh(cylZ(0.95, 6, 32, 0.95), liq, [c.x, c.y, c.z + 1.5]));
    }
  }
  {
    // pistones de zafiro (los mueve la simulación) y accionamiento: motor, engranajes 2:1 y husillos de bolas
    const g = makePart(A, 'accionamiento', L2([0, 0, -2]));
    g.add(mesh(rbox(20, 7, 5.6, 0.4), M.anodizado, [-1.5, 7, 6.8]));
    g.add(mesh(cylX(2.0, 6, 32), grafito, [-1.5, 12.6, 6.8]));
    g.add(mesh(cylZ(2.4, 0.6, 32), M.aceroOscuro, [c1.x, 7, 3.2]));
    g.add(mesh(cylZ(1.2, 0.6, 24), M.aceroOscuro, [c2.x, 7, 3.2]));
    const pist = [];
    for (const c of [c1, c2]) {
      g.add(mesh(cylZ(0.42, 4.4, 16), M.acero, [c.x, c.y, 7.4]));                            // husillo
      const p = new THREE.Group(); p.position.set(c.x, c.y, 0);
      p.add(mesh(cylZ(0.55, 6.4, 24), zafiro, [0, 0, 12.4]));
      p.add(mesh(cylZ(0.9, 1.2, 24), M.aceroPulido, [0, 0, 9.6]));
      g.add(p); pist.push(p);
    }
    refs.pistones = pist;
    const tx = new THREE.MeshStandardMaterial({ map: textTexture(['relación 2 : 1'], { w: 256, h: 48, bg: '#646b74', fg: '#f2f4f6', font: '600 28px Segoe UI' }), roughness: 0.5 });
    g.add(mesh(new THREE.PlaneGeometry(4, 0.75), tx, [-1.5, 7.6, 9.62]));
  }
  {
    const g = makePart(A, 'valvula_entrada', L2([0, 0, 15]));
    refs.bolaEntrada = valvulaBola(g, c1.x, 1.9, c1.z + 2, 3.2, rubi);
  }
  {
    const g = makePart(A, 'valvula_salida', L2([0, 7, 15]));
    refs.bolaSalida = valvulaBola(g, c1.x, 12.1, c1.z + 2, 3.2, rubi);
  }
  const am = C.amort;
  {
    const g = makePart(A, 'amortiguador', L2([0, 0, 12]));
    g.add(mesh(cylY(3, 1.6, 48), M.acero, [am.x, am.y, am.z]));
    g.add(mesh(cylY(2.2, 0.3, 40), M.aceroPulido, [am.x, am.y + 0.95, am.z]));
    fit(g, [am.x - 3.3, am.y, am.z], 'x', 0.4, 0.8); fit(g, [am.x + 3.3, am.y, am.z], 'x', 0.4, 0.8);
  }
  const pu = C.purga;
  {
    const g = makePart(A, 'valvula_purga', L2([6, 0, 10]));
    g.add(mesh(rbox(4, 5, 5, 0.4), M.acero, [pu.x, pu.y, pu.z]));
    g.add(mesh(cylZ(1.5, 1.4, 32), M.plasticoNegro, [pu.x, pu.y, pu.z + 3.2]));
    g.add(mesh(cylZ(0.8, 0.2, 24), M.ptfe, [pu.x, pu.y, pu.z + 2.6]));                       // frita de PTFE (visible por la ventana)
    fit(g, [pu.x - 2.4, pu.y, pu.z], 'x'); fit(g, [pu.x + 2.4, pu.y, pu.z], 'x'); fit(g, [pu.x, pu.y - 2.9, pu.z], 'y');
    g.add(mesh(cylY(1.1, 1.0, 24), M.plasticoNegro, [pu.x, 0.5, pu.z + 0.2]));               // drenaje de purga
  }
  // conexiones del cabezal: MCGV → entrada → cámara 1 → salida → amortiguador → cámara 2 → purga
  {
    const g = makePart(A, 'capilares_bomba', L2([0, 0, 0], false, { info: 'cabezal' }));
    const r = refs.rutas;
    r.mcgvPIV = [[m.x + 3.8, 1.6, m.z, 'mcgv'], [m.x + 5.5, 1.4, m.z + 0.6, 'mcgv'], [c1.x - 2.2, 0.9, c1.z + 2, 'valvula_entrada'], [c1.x - 1.2, 0.6, c1.z + 2, 'valvula_entrada'], [c1.x, 0.55, c1.z + 2, 'valvula_entrada']];
    r.salAmort = [[c1.x, 13.5, c1.z + 2, 'valvula_salida'], [c1.x, 14.6, c1.z + 2.2, 'valvula_salida'], [c1.x + 2, 14.4, c1.z + 6.2, 'valvula_salida'], [am.x - 4.6, 6, am.z - 0.2, 'amortiguador'], [am.x - 4.2, am.y, am.z, 'amortiguador'], [am.x - 3.5, am.y, am.z, 'amortiguador']];
    r.amortC2 = [[am.x + 3.5, am.y, am.z, 'amortiguador'], [am.x + 4.4, am.y, am.z, 'amortiguador'], [c2.x - 0.6, 1.2, c2.z + 5.6, 'amortiguador'], [c2.x, 2.4, c2.z + 3.2, 'cabezal'], [c2.x, 3.3, c2.z + 2, 'cabezal']];
    r.c2Purga = [[c2.x, 10.7, c2.z + 2, 'cabezal'], [c2.x, 12.4, c2.z + 2, 'cabezal'], [c2.x + 3, 12.6, c2.z + 1.5, 'cabezal'], [pu.x - 4.4, pu.y + 0.4, pu.z, 'valvula_purga'], [pu.x - 2.8, pu.y, pu.z, 'valvula_purga']];
    for (const k of ['mcgvPIV', 'salAmort', 'amortC2', 'c2Purga']) cableFlex(g, r[k], 0.13, cap, { seg: 70, radial: 8 });
    g.add(mesh(cylY(0.5, 0.8, 16), M.acero, [c2.x, 3.1, c2.z + 2]));
    g.add(mesh(cylY(0.5, 0.8, 16), M.acero, [c2.x, 10.9, c2.z + 2]));
    cableFlex(g, [[pu.x, pu.y - 3.3, pu.z, 'valvula_purga'], [pu.x, 2.2, pu.z + 0.1, 'valvula_purga'], [pu.x, 1.0, pu.z + 0.2, 'valvula_purga']], 0.15, ptfe, { seg: 20, radial: 8 });
    for (const k of ['mcgvPIV', 'salAmort', 'amortC2', 'c2Purga']) r[k] = r[k].map((q) => new THREE.Vector3(q[0], q[1], q[2]));
  }

  /* ---------------- VIALSAMPLER ---------------- */
  const v = C.valv;
  const puerto = (k) => { const a = Math.PI / 2 - (k - 1) * Math.PI / 3; return new THREE.Vector3(v.x + Math.cos(a) * 2.2, v.y + Math.sin(a) * 2.2, v.z + 1.8); };
  {
    const g = makePart(A, 'valvula_iny', L2([4, 6, 8]));
    g.add(mesh(rbox(7, v.y - YB - 1, 5.4, 0.4), M.anodizado, [v.x, YB + (v.y - YB - 1) / 2, v.z - 3.6]));
    g.add(mesh(cylZ(3.6, 1.6, 48), M.anodizado, [v.x, v.y, v.z - 1.0]));
    const est = M.vidrio.clone(); est.opacity = 0.32;
    g.add(mesh(cylZ(3.3, 1.0, 48), est, [v.x, v.y, v.z + 0.8]));                           // estátor (transparente para ver el rotor)
    // rotor con tres ranuras: en «mainpass» unen 1-2, 3-4 y 5-6; al girar 60° pasan a 6-1, 2-3 y 4-5 (bypass)
    const rotor = new THREE.Group(); rotor.position.set(v.x, v.y, v.z);
    rotor.add(mesh(cylZ(3.0, 0.16, 48), M.ceramica, [0, 0, 0]));
    const ran = new THREE.MeshStandardMaterial({ color: 0xc8352f, roughness: 0.4, emissive: 0x401010 });
    for (let k = 0; k < 3; k++) { const t = new THREE.TorusGeometry(2.2, 0.17, 8, 24, Math.PI / 3); const r = mesh(t, ran, [0, 0, 0.1], [0, 0, Math.PI / 2 - Math.PI / 3 - k * (2 * Math.PI / 3)]); r.userData.decal = true; rotor.add(r); }
    g.add(rotor); refs.rotor = rotor;
    for (let k = 1; k <= 6; k++) { const p = puerto(k); g.add(mesh(cylZ(0.5, 1.0, 6), k === 3 ? M.plasticoNegro : M.acero, [p.x, p.y, p.z])); }
    g.add(mesh(cylY(0.9, 1.0, 20), M.plasticoNegro, [v.x + 0.6, YB + 0.5, v.z + 3.4]));          // drenaje del puerto 4 (residuos)
    const num = new THREE.MeshStandardMaterial({ map: textTexture(['1 · bomba   6 · columna'], { w: 512, h: 64, bg: '#646b74', fg: '#f2f4f6', font: '600 30px Segoe UI' }), roughness: 0.5 });
    g.add(mesh(new THREE.PlaneGeometry(6.4, 0.8), num, [v.x, YB + 1.6, v.z - 0.88]));
  }
  {
    const g = makePart(A, 'dosificador', L2([8, 0, 2]));
    g.add(mesh(rbox(4.2, 3.6, 4, 0.3), M.acero, [37, YB + 2.6, 5]));
    g.add(mesh(rbox(4.6, 3, 3.2, 0.3), M.anodizado, [41.6, YB + 2.4, 5]));
    const gl = M.vidrio.clone(); gl.opacity = 0.3; g.add(mesh(cylX(0.8, 3.6, 24), gl, [37, YB + 2.6, 7.6]));
    const pm = new THREE.Group(); pm.position.set(37, YB + 2.6, 7.6); pm.add(mesh(cylX(0.5, 3.2, 20), zafiro, [1.2, 0, 0])); g.add(pm); refs.dosif = pm;
    fit(g, [34.6, YB + 2.6, 5], 'x'); fit(g, [37, YB + 4.8, 5], 'y');
  }
  const ag = C.aguja;
  {
    const g = makePart(A, 'aguja', L2([6, 8, -6]));
    g.add(mesh(rbox(2.6, 2.6, 2.6, 0.3), M.anodizado, [ag.x, YB + 15.8, ag.z]));
    const nd = new THREE.Group(); nd.position.set(ag.x, 0, ag.z);
    nd.add(mesh(cylY(0.12, 9.6, 12), M.aceroPulido, [0, YB + 9.7, 0]));
    nd.add(mesh(cylY(0.5, 1.2, 16), M.acero, [0, YB + 14.4, 0]));
    g.add(nd); refs.aguja = nd;
    g.add(mesh(rbox(3, 2.4, 3, 0.3), M.aceroPulido, [ag.x, YB + 3.6, ag.z]));                 // asiento de la aguja
    g.add(mesh(rbox(4, 2.4, 4, 0.3), M.aluminio, [ag.x, YB + 1.2, ag.z]));
    g.add(mesh(box(1, 14, 1), M.aluminio, [ag.x + 2.2, YB + 7, ag.z - 1.5]));
    g.add(mesh(box(1.6, 1, 3.6), M.aluminio, [ag.x + 1.6, YB + 14.2, ag.z - 0.5]));
  }
  {
    const g = makePart(A, 'vial', L2([8, 0, -8], false, { info: 'aguja' }));
    g.add(mesh(rbox(5, 1, 5, 0.3), M.plasticoNegro, [31, YB + 0.5, -9]));
    const vg = M.vidrio.clone(); vg.opacity = 0.4;
    g.add(mesh(cylY(0.9, 3.4, 24), vg, [31, YB + 2.7, -9]));
    const mu = M.disolvente.clone(); mu.color.setHex(0xffd27a); mu.opacity = 0.7; g.add(mesh(cylY(0.8, 1.6, 20), mu, [31, YB + 1.85, -9]));
    const tp = M.plasticoNegro.clone(); tp.color.setHex(0x2f5d9b); g.add(mesh(cylY(0.95, 0.8, 20), tp, [31, YB + 4.8, -9]));
  }
  // conexiones del muestreador
  {
    const g = makePart(A, 'capilares_muestreador', L2([0, 0, 0], false, { info: 'valvula_iny' }));
    const r = refs.rutas, P = (k) => puerto(k), V = 'valvula_iny', DO = 'dosificador', AG = 'aguja';
    const p1 = P(1), p2 = P(2), p4 = P(4), p5 = P(5), p6 = P(6);
    r.purgaV = [[pu.x + 2.8, pu.y, pu.z, 'valvula_purga'], [pu.x + 4.5, pu.y + 0.3, pu.z, 'valvula_purga'], [24, 14, 12], [28.6, 21.6, 10.2, V], [p1.x, p1.y + 0.4, p1.z + 1.4, V], [p1.x, p1.y, p1.z + 0.5, V]];
    r.vDosif = [[p2.x, p2.y, p2.z + 0.5, V], [p2.x + 0.2, p2.y, p2.z + 1.6, V], [33.6, 15.6, 9.2, DO], [34.2, YB + 2.6, 6.2, DO], [34.4, YB + 2.6, 5, DO], [34.9, YB + 2.6, 5, DO]];
    r.bucle = [[37, YB + 5.2, 5, DO], [37, YB + 7.4, 5, DO], [37.4, YB + 10.5, 3.2, DO], [36.2, YB + 13.8, 1.2], [37.6, YB + 17.2, 0.2, AG], [ag.x, YB + 18.6, ag.z + 2, AG], [ag.x, YB + 18.4, ag.z + 0.6, AG], [ag.x, YB + 17.0, ag.z, AG]];
    r.asientoV = [[ag.x - 1.4, YB + 3.6, ag.z, AG], [ag.x - 2.6, YB + 3.8, ag.z - 0.2, AG], [32, YB + 5.2, -1.8, V], [26.6, YB + 6, -1.4, V], [25.2, YB + 6.6, 3, V], [25.6, YB + 7.4, 8.6, V],
      [p5.x, p5.y - 0.3, p5.z + 1.6, V], [p5.x, p5.y, p5.z + 0.5, V]];
    r.vCol = [[p6.x, p6.y, p6.z + 0.5, V], [p6.x, p6.y + 0.2, p6.z + 1.6, V], [26.4, 21.6, 6.4, V], [24.2, 19.6, -6, 'intercambiador'], [C.ic.x, C.ic.y + 4.2, BR, 'intercambiador'], [C.ic.x, C.ic.y + 2.3, BR, 'intercambiador']];
    for (const k of ['purgaV', 'vDosif', 'bucle', 'asientoV', 'vCol']) cableFlex(g, r[k], 0.13, k === 'vCol' ? cap : cap, { seg: 90, radial: 8 });
    // salida a residuos del puerto 4
    cableFlex(g, [[p4.x, p4.y, p4.z + 0.5, V], [p4.x, p4.y - 0.2, p4.z + 1.6, V], [v.x + 0.4, YB + 4, v.z + 3, V], [v.x + 0.6, YB + 1.2, v.z + 3.4, V]], 0.15, ptfe, { seg: 30, radial: 8 });
    for (const k of ['purgaV', 'vDosif', 'bucle', 'asientoV', 'vCol']) r[k] = r[k].map((q) => new THREE.Vector3(q[0], q[1], q[2]));
  }

  /* ---------------- COMPARTIMENTO DE COLUMNA ---------------- */
  const ic = C.ic, yc = YB + 6;
  {
    const g = makePart(A, 'intercambiador', L2([4, 6, -6]));
    g.add(mesh(rbox(4, 4, 4, 0.3), M.aluminio, [ic.x, ic.y, BR]));
    for (let i = 0; i < 5; i++) g.add(mesh(box(4.4, 0.25, 4.4), M.aluminio, [ic.x, ic.y - 1.6 + i * 0.8, BR]));
    const cal = new THREE.MeshStandardMaterial({ color: 0xd9481e, emissive: 0xd9481e, emissiveIntensity: 0.25, roughness: 0.6 });
    const calef = mesh(rbox(4, 1.2, 4.4, 0.2), cal, [ic.x, YB + 0.6, BR]); g.add(calef);       // calefactor
    g.add(mesh(box(2, ic.y - 2 - YB - 1.2, 2), M.aluminio, [ic.x, YB + 1.2 + (ic.y - 2 - YB - 1.2) / 2, BR]));
    fit(g, [ic.x, ic.y + 2.3, BR], 'y'); fit(g, [ic.x - 2.3, yc, BR], 'x');
    refs.calefactor = calef;
  }
  {
    const g = makePart(A, 'columna', L2([0, 8, -8], true, { shell: true }));
    const L = C.col0 - C.col1 - 2;
    g.add(mesh(cylX(1.0, L, 40), M.aceroPulido, [(C.col0 + C.col1) / 2, yc, BR]));
    for (const x of [C.col0 - 0.5, C.col1 + 0.5]) g.add(mesh(cylX(1.35, 1.0, 6), M.acero, [x, yc, BR]));
    const et = new THREE.MeshStandardMaterial({ map: textTexture(['C18 · 150 × 4,6 mm · 5 µm'], { w: 512, h: 64, bg: '#e9edf2', fg: '#1d3f73', font: '600 30px Segoe UI' }), roughness: 0.5 });
    const e = mesh(new THREE.CylinderGeometry(1.03, 1.03, 8, 40, 1, true, -Math.PI * 0.4, Math.PI * 0.8), et, [(C.col0 + C.col1) / 2, yc, BR], [0, 0, Math.PI / 2]);
    e.userData.decal = true; g.add(e);
    for (const x of [C.col1 + 2.5, C.col0 - 2.5]) g.add(mesh(box(0.6, yc - 1 - YB, 1.6), M.plasticoNegro, [x, YB + (yc - 1 - YB) / 2, BR]));   // soportes
  }
  {
    const g = makePart(A, 'relleno', L2([0, 8, -8], false, { info: 'columna' }));
    const fase = new THREE.MeshStandardMaterial({ color: 0xe9dcc0, roughness: 0.9, transparent: true, opacity: 0.32, depthWrite: false });
    g.add(mesh(cylX(0.86, C.col0 - C.col1 - 2.2, 32), fase, [(C.col0 + C.col1) / 2, yc, BR]));
  }

  /* ---------------- DETECTOR DE DIODOS ---------------- */
  const X = C.dadX, ce = C.celda;
  const caja = (mat) => { const k = mat.clone(); k.opacity = 0.14; k.transparent = true; k.depthWrite = false; return k; };
  {
    const g = makePart(A, 'lampara_w', L2([-6, 4, 6]));
    g.add(mesh(rbox(3.4, 4.6, 3, 0.3), M.aluminio, [X, YB + 2.3, OPT.w + 0.6]));
    g.add(mesh(cylZ(0.9, 1.6, 24), M.ceramica, [X, yc, OPT.w + 1.1]));
    const bulb = new THREE.MeshPhysicalMaterial({ color: 0xfff1c9, emissive: 0xffc566, emissiveIntensity: 0.6, transparent: true, opacity: 0.75, roughness: 0.1 });
    g.add(mesh(new THREE.SphereGeometry(0.85, 24, 16), bulb, [X, yc, OPT.w - 0.4]));
    refs.bombillaW = g.children[g.children.length - 1];
  }
  {
    const g = makePart(A, 'lampara_d2', L2([-6, 6, 2]));
    g.add(mesh(rbox(3.6, 2, 3.2, 0.3), M.aluminio, [X, YB + 1, OPT.d2]));
    const env = new THREE.MeshPhysicalMaterial({ color: 0xe9f2ff, transparent: true, opacity: 0.45, roughness: 0.05, emissive: 0x6f7dff, emissiveIntensity: 0.25 });
    g.add(mesh(cylY(1.5, 6.2, 32), env, [X, YB + 5.1, OPT.d2]));
    g.add(placaPasos(1.8, 1.8, 0.2, [[0, 0, 0.32]], M.aceroPulido, [X, yc, OPT.d2], 'xy', 0.2));   // abertura de paso (shine-through)
    g.add(mesh(cylY(1.55, 0.9, 32), M.ceramica, [X, YB + 8.6, OPT.d2]));
    refs.envD2 = g.children[1];
  }
  {
    const g = makePart(A, 'acromatico', L2([-6, 6, 0]));
    g.add(placaPasos(4, 4, 0.6, [[0, 0, 1.45]], M.anodizado, [X, yc, OPT.acro], 'xy', 0.3));
    const lente = M.cuarzo.clone(); lente.opacity = 0.5; g.add(mesh(cylZ(1.45, 0.7, 40), lente, [X, yc, OPT.acro]));
    g.add(mesh(box(1, yc - 2 - YB, 1), M.anodizado, [X, YB + (yc - 2 - YB) / 2, OPT.acro]));
  }
  {
    const g = makePart(A, 'filtro_holmio', L2([-6, 8, 0]));
    // fuera del haz (posición de trabajo); durante la prueba de longitud de onda gira y se interpone
    g.add(mesh(box(0.4, 3, 0.4), M.anodizado, [X + 2.6, YB + 1.5 + 2.6, OPT.holmio]));
    const ho = new THREE.MeshPhysicalMaterial({ color: 0xf0c7a8, roughness: 0.1, transparent: true, opacity: 0.6 });
    g.add(mesh(box(2, 2, 0.3), ho, [X + 2.6, yc + 2.4, OPT.holmio]));
    g.add(mesh(box(2.8, 0.6, 1.2), M.anodizado, [X + 2.6, YB + 0.3, OPT.holmio]));
  }
  {
    const g = makePart(A, 'celda', L2([-4, 8, 0], true, { shell: true }));
    g.add(mesh(rbox(4, 4, 4.4, 0.3), M.acero, [ce.x, ce.y, ce.z]));
    g.add(mesh(box(2.4, yc - 2 - YB, 2.4), M.anodizado, [ce.x, YB + (yc - 2 - YB) / 2, ce.z]));
    for (const z of [ce.z + 2.3, ce.z - 2.3]) g.add(mesh(cylZ(0.8, 0.3, 24), M.cuarzo, [ce.x, ce.y, z]));
    fit(g, [ce.x + 2.3, ce.y + 1.2, ce.z + 1.2], 'x'); fit(g, [ce.x - 2.3, ce.y + 1.2, ce.z - 1.2], 'x');
  }
  {
    const g = makePart(A, 'canal_celda', L2([-4, 8, 0], false, { info: 'celda' }));
    const liq = new THREE.MeshStandardMaterial({ color: 0xbfe0ff, roughness: 0.2, transparent: true, opacity: 0.5, emissive: 0x000000 });
    g.add(mesh(cylZ(0.42, 4.4, 24), liq, [ce.x, ce.y, ce.z])); refs.canal = g.children[0];
  }
  {
    const g = makePart(A, 'lente_espectro', L2([-6, 6, -2]));
    g.add(placaPasos(4, 4, 0.6, [[0, 0, 1.3]], M.anodizado, [X, yc, OPT.lente], 'xy', 0.3));
    const lente = M.cuarzo.clone(); lente.opacity = 0.5; g.add(mesh(cylZ(1.3, 0.6, 40), lente, [X, yc, OPT.lente]));
    g.add(mesh(box(1, yc - 2 - YB, 1), M.anodizado, [X, YB + (yc - 2 - YB) / 2, OPT.lente]));
  }
  {
    const g = makePart(A, 'rendija', L2([-6, 8, -4]));
    const s = new THREE.Shape(); s.moveTo(-1.6, -1.6); s.lineTo(1.6, -1.6); s.lineTo(1.6, 1.6); s.lineTo(-1.6, 1.6); s.lineTo(-1.6, -1.6);
    const h = new THREE.Path(); h.moveTo(-0.09, -0.9); h.lineTo(-0.09, 0.9); h.lineTo(0.09, 0.9); h.lineTo(0.09, -0.9); h.lineTo(-0.09, -0.9); s.holes.push(h);
    g.add(mesh(new THREE.ExtrudeGeometry(s, { depth: 0.2, bevelEnabled: false }), M.ceramica, [X, yc, OPT.rendija - 0.1]));
    g.add(mesh(box(1, yc - 1.6 - YB, 1), M.anodizado, [X, YB + (yc - 1.6 - YB) / 2, OPT.rendija]));
  }
  // red holográfica cóncava, orientada para enviar el espectro a la matriz (en +x)
  const red = new THREE.Vector3(X, yc, OPT.red), mz = OPT.matriz;
  const sal = mz.clone().sub(red).normalize(), nor = sal.clone().add(new THREE.Vector3(0, 0, 1)).normalize();
  {
    const g = makePart(A, 'red', L2([-6, 6, -8]));
    const holo = new THREE.MeshPhysicalMaterial({ color: 0xd7dbe0, metalness: 1, roughness: 0.12, iridescence: 1, iridescenceIOR: 1.6, iridescenceThicknessRange: [200, 600] });
    const cap = new THREE.SphereGeometry(9, 40, 16, 0, Math.PI * 2, 0, 0.22); cap.rotateX(-Math.PI / 2); cap.translate(0, 0, 9);
    const sp = mesh(cap, holo, [red.x, red.y, red.z]); sp.rotation.y = Math.atan2(nor.x, nor.z); sp.material.side = THREE.DoubleSide; g.add(sp);
    const base = mesh(rbox(3.4, 3.4, 1.0, 0.2), M.ceramica, [red.x, red.y, red.z]); base.rotation.y = Math.atan2(nor.x, nor.z);
    base.position.addScaledVector(nor, -0.9); g.add(base);
    g.add(mesh(box(1.2, yc - 1.8 - YB, 1.2), M.anodizado, [red.x - nor.x * 0.9, YB + (yc - 1.8 - YB) / 2, red.z - nor.z * 0.9]));
  }
  {
    const g = makePart(A, 'matriz', L2([2, 6, -6]));
    const tex = (() => { const c = document.createElement('canvas'); c.width = 1024; c.height = 64; const x = c.getContext('2d');
      x.fillStyle = '#20242a'; x.fillRect(0, 0, 1024, 64); for (let i = 0; i < 256; i++) { x.fillStyle = i % 2 ? '#5f6e86' : '#7d8db0'; x.fillRect(i * 4, 16, 3, 32); }
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
    const ang = Math.atan2(-sal.x, -sal.z);
    const b = mesh(rbox(6.2, 2.6, 0.8, 0.2), M.ceramica, [mz.x, mz.y, mz.z]); b.rotation.y = ang; g.add(b);
    const s = mesh(new THREE.PlaneGeometry(5.6, 0.7), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.3, metalness: 0.4 }), [mz.x, mz.y, mz.z]);
    s.rotation.y = ang; s.position.addScaledVector(sal, -0.42); g.add(s);
    const pcb = mesh(rbox(7, 4, 0.3, 0.05), M.pcb, [mz.x, mz.y - 0.4, mz.z]); pcb.rotation.y = ang; pcb.position.addScaledVector(sal, 0.6); g.add(pcb);
    g.add(mesh(box(1.2, mz.y - 2 - YB, 1.2), M.anodizado, [mz.x + sal.x * 0.6, YB + (mz.y - 2 - YB) / 2, mz.z + sal.z * 0.6]));
    refs.matrizEje = new THREE.Vector3(-sal.z, 0, sal.x);                                    // dirección de la tira de diodos
  }
  {
    // carcasas translúcidas: alojamiento de lámparas y espectrógrafo cerámico
    const g = makePart(A, 'carcasas_dad', L2([0, 14, 0], false, { info: 'circuito', shell: true }));
    g.add(mesh(box(8, 9, 10), caja(M.aluminio), [X, YB + 4.5, (OPT.w + OPT.d2) / 2 - 0.4]));
    g.add(mesh(box(16, 9, 15.8), caja(M.ceramica), [X + 5.5, YB + 4.5, -31.4]));
  }
  // columna → celda → residuos
  {
    const g = makePart(A, 'capilares_detector', L2([0, 0, 0], false, { info: 'celda' }));
    const r = refs.rutas;
    r.icCol = [[ic.x - 2.75, yc, BR, 'intercambiador'], [C.col0 + 0.05, yc, BR, 'columna']];
    r.colCelda = [[C.col1 + 0.1, yc, BR, 'columna'], [C.col1 - 1.4, yc, BR, 'columna'], [-12, yc + 1.4, -16.2], [ce.x + 4.2, ce.y + 1.6, ce.z + 1.2, 'celda'], [ce.x + 2.6, ce.y + 1.2, ce.z + 1.2, 'celda']];
    r.celdaRes = [[ce.x - 2.6, ce.y + 1.2, ce.z - 1.2, 'celda'], [ce.x - 4.6, ce.y + 1.6, ce.z - 1.4, 'celda'], [C.residuo.x + 1, YB + 9.6, C.residuo.z, 'c_residuo'], [C.residuo.x, YB + 8.6, C.residuo.z, 'c_residuo'], [C.residuo.x, YB + 7.6, C.residuo.z, 'c_residuo']];
    cableFlex(g, r.colCelda, 0.12, peek, { seg: 80, radial: 8 });
    cableFlex(g, r.celdaRes, 0.13, ptfe, { seg: 60, radial: 8 });
    for (const k of ['icCol', 'colCelda', 'celdaRes']) r[k] = r[k].map((q) => new THREE.Vector3(q[0], q[1], q[2]));
  }
  {
    const g = makePart(A, 'c_residuo', L2([-6, 0, -6]));
    const vb = M.vidrio.clone(); vb.opacity = 0.3; const p = C.residuo;
    g.add(mesh(botella(2.6, 6.6, 0.6), vb, [p.x, YB + 0.02, p.z]));
    const liq = M.disolvente.clone(); liq.opacity = 0.3; g.add(mesh(cylY(2.4, 1.6, 24), liq, [p.x, YB + 0.9, p.z]));
    const az = M.plasticoNegro.clone(); az.color.setHex(0x1f56c7); g.add(mesh(cylY(1.8, 1.4, 24), az, [p.x, YB + 7.3, p.z]));
  }

  /* ---------------- HACES DE LUZ (los enciende la simulación) ---------------- */
  {
    const H = (z0, z1, r0, r1, c) => { const h = haz(X, yc, z0, z1, r0, r1, c); A.add(h); refs.haces.push(h); return h; };
    H(OPT.w - 1.2, OPT.acro, 0.35, 1.3);
    H(OPT.acro, ce.z + 2.2, 1.3, 0.35);
    H(ce.z - 2.2, OPT.lente, 0.35, 1.1);
    H(OPT.lente, OPT.rendija, 1.1, 0.09);
    H(OPT.rendija, OPT.red + 0.9, 0.09, 1.6);
    // abanico del espectro: de la red a la matriz, de 190 nm (violeta) a 950 nm (infrarrojo cercano)
    const n = 24, pos = [], col = [], eje = new THREE.Vector3(-sal.z, 0, sal.x), half = 2.7;
    const c0 = red.clone().addScaledVector(sal, 0.2), end = mz.clone().addScaledVector(sal, -0.5);
    for (let i = 0; i < n; i++) {
      const u0 = i / n, u1 = (i + 1) / n, ca = espectroColor(u0), cb = espectroColor(u1);
      const p0 = end.clone().addScaledVector(eje, (u0 - 0.5) * 2 * half), p1 = end.clone().addScaledVector(eje, (u1 - 0.5) * 2 * half);
      for (const q of [c0, p0, p1]) pos.push(q.x, q.y, q.z);
      col.push(1, 1, 1, ca.r, ca.g, ca.b, cb.r, cb.g, cb.b);
    }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    const fan = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }));
    fan.userData.noClone = true; fan.castShadow = false; fan.raycast = () => {}; A.add(fan); refs.haces.push(fan); refs.abanico = { c0, end, eje, half };
  }

  refs.group = A;
  refs.puerto = puerto;
  return refs;
}

/** Color aproximado de la luz en la fracción u del intervalo 190–950 nm (UV en violeta tenue, NIR en rojo oscuro). */
export function espectroColor(u) {
  const nm = 190 + u * 760;
  let r = 0, g = 0, b = 0;
  if (nm < 380) { const k = (nm - 190) / 190; r = 0.35 * k; g = 0; b = 0.55 + 0.3 * k; }
  else if (nm < 440) { r = (440 - nm) / 60 * 0.8; b = 1; }
  else if (nm < 490) { g = (nm - 440) / 50; b = 1; }
  else if (nm < 510) { g = 1; b = (510 - nm) / 20; }
  else if (nm < 580) { r = (nm - 510) / 70; g = 1; }
  else if (nm < 645) { r = 1; g = (645 - nm) / 65; }
  else if (nm < 780) { r = 1; }
  else { r = 0.6 * (1 - (nm - 780) / 170) + 0.15; }
  return new THREE.Color(r, g, b);
}
