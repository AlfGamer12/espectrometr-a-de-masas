// Equipo completo: carcasa del MSD, cámara de vacío, placa lateral, bombas, electrónica,
// interfaz GC/MSD y cromatógrafo de gases (contexto). Coordenadas de mundo en cm.
// Frente del MSD hacia +Z, GC a la izquierda (-X). Suelo en y = 0.
import * as THREE from 'three';
import { M, ribTexture } from '../../materials.js';
import { mesh, rbox, box, washerX, cylX, cylY, cylZ, tubeX, tubePath, helix, grilleTexture, textTexture,
  screws, screenTexture, warningTexture, plateTexture, placaPasos, pasamuros } from '../../geom.js';
import { makePart, parts, cableFlex } from '../../parts.js';
import { buildAnalizador } from './analizador.js';

const L1 = (offset, extra = {}) => ({ level: 1, offset, mode: 'equipo', ...extra });

function pcbChips(g, x0, y0, z0, w, h, nx, ny, normalAxis = 'z', sign = 1) {
  // Componentes sobre una PCB (plano perpendicular a normalAxis)
  const rnd = mulberry(7 + nx * 13 + ny);
  for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
    const u = x0 - w / 2 + (w * (i + 0.5)) / nx + (rnd() - 0.5) * 0.4;
    const v = y0 - h / 2 + (h * (j + 0.5)) / ny + (rnd() - 0.5) * 0.4;
    const kind = rnd();
    const sz = 0.6 + rnd() * 1.2;
    let geo, mat, t;
    if (kind < 0.55) { geo = box(sz, sz * 0.8, 0.25); mat = M.chip; t = 0.25; }
    else if (kind < 0.8) { geo = cylZ(0.3 + rnd() * 0.25, 0.9); mat = M.condensador; t = 0.9; }
    else { geo = box(sz * 1.3, 0.5, 0.6); mat = M.plasticoNegro; t = 0.6; }
    const m = mesh(geo, mat);
    if (normalAxis === 'z') m.position.set(u, v, z0 + sign * t / 2);
    else { m.rotation.y = Math.PI / 2; m.position.set(z0 + sign * t / 2, v, u); }
    g.add(m);
  }
}
function mulberry(a) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

export function buildEquipo(root) {
  const refs = {};
  const grille = grilleTexture(28, 10);
  const grilleMat = M.carcasa.clone(); grilleMat.map = grille;

  /* ---------------- ESTRUCTURA Y CARCASA ---------------- */
  {
    const g = makePart(root, 'chasis', L1([0, 0, 0], { label: null }));
    g.add(mesh(rbox(30, 1.2, 64, 0.3), M.carcasaOsc, [0, 0.6, 0]));
    for (const x of [-12, 12]) for (const z of [-28, 28]) g.add(mesh(cylY(1.2, 0.6), M.goma, [x, -0.1, z]));
  }
  {
    const g = makePart(root, 'carcasa_superior', L1([0, 30, 0], { info: 'carcasa', shell: true }));
    g.add(mesh(rbox(30.6, 1.0, 64.6, 0.45), M.carcasa, [0, 42.2, 0]));
    const vent = mesh(new THREE.PlaneGeometry(20, 12), grilleMat, [0, 42.72, -20], [-Math.PI / 2, 0, 0]);
    g.add(vent);
    screws(g, M.tornillo, M.tornilloNegro, 0.32, 'y', [[-13.6, 42.7, -30], [13.6, 42.7, -30], [-13.6, 42.7, 30], [13.6, 42.7, 30]]);
  }
  {
    // sale hacia −x, a lo largo de la línea de transferencia, que pasa por su pasamuros
    const g = makePart(root, 'panel_izq', L1([-24, 0, 0], { info: 'carcasa', shell: true }));
    g.add(placaPasos(64, 41, 1.0, [[12.6, 28 - 21.4, 2.3]], M.carcasa, [-15, 21.4, 0], 'zy', 0.35));
    g.add(pasamuros(2.3, M.goma, [-15, 28, 12.6], 'x', 0.4));
    g.add(mesh(box(0.2, 1.2, 62), M.acento, [-15.55, 6, 0]));
    screws(g, M.tornillo, M.tornilloNegro, 0.3, '-x', [[-15.5, 39, -30], [-15.5, 39, 30], [-15.5, 3, -30], [-15.5, 3, 30]]);
  }
  {
    const g = makePart(root, 'panel_der', L1([28, 0, -58], { info: 'carcasa', shell: true }));
    // paso de la manguera de vacío previo (detrás de la rejilla)
    g.add(placaPasos(64, 41, 1.0, [[-28, 9.2 - 21.4, 1.05]], M.carcasa, [15, 21.4, 0], 'zy', 0.35));
    g.add(pasamuros(1.05, M.goma, [15, 9.2, -28], 'x', 0.4));
    g.add(mesh(new THREE.PlaneGeometry(40, 14), grilleMat, [15.52, 14, -6], [0, Math.PI / 2, 0]));
    g.add(mesh(box(0.2, 1.2, 62), M.acento, [15.55, 6, 0]));
    screws(g, M.tornillo, M.tornilloNegro, 0.3, 'x', [[15.5, 39, -30], [15.5, 39, 30], [15.5, 3, -30], [15.5, 3, 30]]);
  }
  {
    const g = makePart(root, 'panel_frontal', L1([-22, 0, 34], { shell: true, label: 'equipo' }));
    g.add(mesh(rbox(30.6, 41, 1.2, 0.4), M.carcasa, [0, 21.4, 32.2]));
    g.add(mesh(rbox(30.4, 7, 1.2, 0.4), M.carcasaOsc, [0, 4.6, 32.35]));      // franja inferior (sin caras coplanares con el panel)
    g.add(mesh(rbox(14, 6, 0.4, 0.2), M.plasticoNegro, [0, 33, 32.85]));
    const scr = new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 0.12, metalness: 0.1 });
    scr.emissiveMap = screenTexture([['Vacío', 'OK'], ['Fuente', '230 °C'], ['Cuadrupolo', '150 °C']], { title: 'MSD  Listo' });
    scr.emissive = new THREE.Color(0xffffff); scr.emissiveIntensity = 0.85;
    g.add(mesh(new THREE.PlaneGeometry(12.6, 4.9), scr, [0, 33, 33.12]));
    const lab = new THREE.MeshStandardMaterial({ map: textTexture(['Mass Selective Detector'], { bg: '#3b4048', fg: '#d5d9de', font: '500 46px Segoe UI' }), roughness: 0.5 });
    g.add(mesh(new THREE.PlaneGeometry(10, 2.5), lab, [-7, 4.8, 32.97]));
    // ranuras de ventilación inferiores
    for (let i = 0; i < 10; i++) g.add(mesh(rbox(0.5, 3.4, 0.2, 0.08), M.plasticoNegro, [3 + i * 1.1, 4.6, 33.0]));
    [M.ledVerde, M.ledVerde, M.ledAmbar, M.ledVerde].forEach((mt, i) =>
      g.add(mesh(cylZ(0.3, 0.2), mt, [-4.5 + i * 3, 28.5, 32.85])));
  }
  {
    const g = makePart(root, 'panel_trasero', L1([0, 0, -24], { info: 'carcasa', shell: true }));
    g.add(mesh(rbox(30.6, 41, 1.0, 0.35), M.carcasa, [0, 21.4, -32.1]));
    // conectores traseros: alimentación, LAN, remoto
    g.add(mesh(rbox(3, 2, 0.6), M.plasticoNegro, [-9, 8, -32.8]));
    // cable de alimentación hasta el suelo
    g.add(mesh(tubePath([[-9, 8, -33.2], [-9, 8, -33.2 - 4], [-9 - 2, 2, -33.2 - 9], [-9 - 5, 0.7, -33.2 - 16], [-9 - 14, 0.7, -33.2 - 30]], 0.45, 40, 10), M.cable));
    for (const x of [-9.7, -9, -8.3]) g.add(mesh(box(0.25, 0.6, 0.1), M.tornillo, [x, 8, -33.12]));
    g.add(mesh(rbox(1.6, 1.4, 0.5), M.plasticoNegro, [-4, 8, -32.8]));
    g.add(mesh(box(1.1, 0.8, 0.1), M.tornillo, [-4, 8, -33.06]));
    g.add(mesh(rbox(3.2, 1.2, 0.5), M.plasticoNegro, [0, 8, -32.8]));
    const plate = new THREE.MeshStandardMaterial({ map: plateTexture(['MSD · Mass Selective Detector', '100–240 V~  50/60 Hz', 'Modelo didáctico', 'Explorador 3D']), metalness: 0.6, roughness: 0.4 });
    g.add(mesh(new THREE.PlaneGeometry(7, 3.5), plate, [7, 10, -32.62], [0, Math.PI, 0]));
    screws(g, M.tornillo, M.tornilloNegro, 0.3, '-z', [[-13.6, 39, -32.6], [13.6, 39, -32.6], [-13.6, 3, -32.6], [13.6, 3, -32.6]]);
  }
  {
    const g = makePart(root, 'ventilador', L1([0, 0, -14], { label: 'equipo' }));
    g.add(mesh(rbox(11, 11, 2.2, 0.4), M.plasticoNegro, [0, 30, -30.4]));
    for (const r of [1.8, 3.0, 4.2, 5.0]) g.add(mesh(new THREE.TorusGeometry(r, 0.07, 6, 48), M.aceroOscuro, [0, 30, -31.55]));
    for (let i = 0; i < 4; i++) g.add(mesh(box(10, 0.14, 0.14), M.aceroOscuro, [0, 30, -31.55], [0, 0, (i * Math.PI) / 4]));
    screws(g, M.tornillo, M.tornilloNegro, 0.25, '-z', [[-4.6, 25.4, -31.5], [4.6, 25.4, -31.5], [-4.6, 34.6, -31.5], [4.6, 34.6, -31.5]]);
    const spin = new THREE.Group(); spin.position.set(0, 30, -29.2); g.add(spin);
    spin.add(mesh(cylZ(1.6, 1.4), M.plasticoNegro));
    for (let i = 0; i < 7; i++) {
      const b = mesh(box(1.8, 4.2, 0.12), M.carcasaOsc, [0, 0, 0], [0, 0.45, 0]);
      const piv = new THREE.Group(); piv.rotation.z = (i * Math.PI * 2) / 7; b.position.y = 2.9;
      piv.add(b); spin.add(piv);
    }
    refs.fan = spin;
  }

  /* ---------------- CÁMARA DE VACÍO ---------------- */
  {
    const g = makePart(root, 'camara_vacio', L1([0, 0, 0], { shell: true, label: 'equipo' }));
    const W = 16, H = 16, D = 40, cx = -1, cy = 28, cz = -2, t = 0.8;
    // fondo y techo enteros; las paredes quedan entre ellos (solapan 0,1) para que no haya caras coplanares
    const hp = H - 2 * t + 0.2;
    g.add(mesh(rbox(W, t, D, 0.15), M.aluminio, [cx, cy - H / 2 + t / 2, cz]));
    g.add(mesh(rbox(W, t, D, 0.15), M.aluminio, [cx, cy + H / 2 - t / 2, cz]));
    g.add(mesh(rbox(t, hp, D, 0.15), M.aluminio, [cx - W / 2 + t / 2, cy, cz]));
    for (const s of [1, -1]) g.add(mesh(rbox(W - t + 0.1, hp, t, 0.15), M.aluminio, [cx + (t - 0.1) / 2, cy, cz + s * (D / 2 - t / 2)]));
    // brida de la boca lateral (asiento de la junta tórica), retranqueada 0,1 respecto a las paredes
    for (const s of [1, -1]) g.add(mesh(box(0.5, 1.0, D - 0.2), M.aluminio, [6.85, cy + s * (H / 2 - 0.6), cz]));
    for (const s of [1, -1]) g.add(mesh(box(0.5, H - 2.2, 1.0), M.aluminio, [6.85, cy, cz + s * (D / 2 - 0.6)]));
    // junta tórica
    const oring = mesh(new THREE.TorusGeometry(1, 0.12, 8, 64), M.goma);
    oring.scale.set(1, 7.2, 19.2); oring.rotation.y = Math.PI / 2; oring.position.set(7.05, cy, cz);
    g.add(oring);
  }
  /* ---------------- PLACA LATERAL (con analizador y electrónica de RF) ---------------- */
  {
    const g = makePart(root, 'placa_lateral', L1([20, 0, 0], { shell: true, label: 'equipo' }));
    g.add(mesh(rbox(1.2, 17.6, 41.6, 0.3), M.aluminio, [7.65, 28, -2]));
    g.add(mesh(new THREE.TorusGeometry(1.6, 0.25, 10, 24, Math.PI), M.aceroOscuro, [8.5, 28, 16], [0, Math.PI / 2, Math.PI / 2]));
    for (const y of [22, 34]) g.add(mesh(cylY(0.5, 2.4), M.aceroOscuro, [8.0, y, 19.4]));
    for (const [y, z] of [[33, -14], [33, -18], [23, -18]]) {
      g.add(mesh(cylX(0.8, 0.8), M.acero, [8.6, y, z]));
      g.add(mesh(cylX(0.55, 0.5, 6), M.aceroOscuro, [9.2, y, z]));
    }
    // tornillos de mano (knurled) delanteros y traseros
    for (const z of [17.5, -21.5]) for (const y of [24, 32]) {
      g.add(mesh(cylX(0.75, 1.0, 24), M.aceroPulido, [8.75, y, z]));
      for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2;
        g.add(mesh(box(1.0, 0.12, 0.12), M.aceroOscuro, [8.75, y + Math.cos(a) * 0.76, z + Math.sin(a) * 0.76])); }
    }
    screws(g, M.tornillo, M.tornilloNegro, 0.25, 'x', [[8.25, 36, 18], [8.25, 20, 18], [8.25, 36, -22], [8.25, 20, -22], [8.25, 36, -2], [8.25, 20, -2]]);
    const warn = new THREE.MeshStandardMaterial({ map: warningTexture('SUPERFICIE CALIENTE'), roughness: 0.45 });
    g.add(mesh(new THREE.PlaneGeometry(5.6, 2.1), warn, [8.27, 34.6, 4], [0, Math.PI / 2, 0]));
    refs.analyzer = buildAnalizador(g);
    // Placa electrónica lateral (side board)
    {
      const s = makePart(g, 'placa_lateral_electronica', L1([5, 0, 0], { label: 'equipo' }));
      s.add(mesh(rbox(0.25, 12, 12, 0.05), M.pcb, [8.55, 28, 9]));
      pcbChips(s, 9, 28, 8.68, 11, 11, 4, 4, 'x', 1);
    }
    // Bobina RF / driver del cuadrupolo
    {
      const s = makePart(g, 'bobina_rf', L1([5, 0, 0], { label: 'equipo', shell: true }));
      s.add(mesh(rbox(3.4, 9, 14, 0.3), M.aluminio, [10.1, 28, -8]));
      s.add(mesh(rbox(3.6, 0.3, 14.2, 0.1), M.aceroOscuro, [10.1, 32.6, -8]));
      const c = makePart(s, 'bobina_rf_coil', L1([0, 0, 0], { info: 'bobina_rf' }));
      c.add(mesh(helix(1.4, 9, 18, 0.12, 600), M.cobre, [10.1, 28, -8]));
      c.add(mesh(cylZ(1.1, 9.6), M.ceramica, [10.1, 28, -8]));
      for (const y of [26, 30]) c.add(mesh(cylX(0.1, 2.4), M.cobre, [8.6, y, -3]));
    }
  }

  /* ---------------- SISTEMA DE VACÍO ---------------- */
  {
    const g = makePart(root, 'bomba_turbo', L1([0, 0, 0], { shell: true, label: 'equipo' }));
    g.add(mesh(cylY(5.5, 11, 48), M.aluminio, [-1, 13.5, -4]));
    g.add(mesh(cylY(6.6, 1.0, 48), M.aluminio, [-1, 19.5, -4]));
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2 + 0.2;
      screws(g, M.tornillo, M.tornilloNegro, 0.3, '-y', [[-1 + Math.cos(a) * 6.05, 19.0, -4 + Math.sin(a) * 6.05]]); }
    // franjas de la carcasa de la turbo y conector del controlador
    for (const y of [9.2, 17.6]) g.add(mesh(cylY(5.62, 0.35, 48), M.aceroOscuro, [-1, y, -4]));
    g.add(mesh(rbox(1.8, 1.6, 1.4, 0.2), M.plasticoNegro, [-1, 12, 1.8]));
    // discos del estátor (fijos) intercalados con los del rotor
    for (let i = 0; i < 6; i++) {
      const st = mesh(new THREE.RingGeometry(1.2, 5.3, 40), M.aceroOscuro, [-1, 11 + i * 1.3 + 0.65, -4], [-Math.PI / 2, 0, 0]);
      st.material = st.material.clone(); st.material.side = THREE.DoubleSide;
      g.add(st);
    }
    g.add(mesh(cylX(0.9, 3.2), M.aluminio, [6.0, 9.5, -4]));
    g.add(mesh(washerX(1.5, 0.6, 0.4), M.acero, [7.6, 9.5, -4]));
    g.add(mesh(rbox(9, 2.6, 9, 0.3), M.anodizado, [-1, 6.7, -4]));
    for (const [x, z] of [[-5, -8], [3, -8], [-5, 0], [3, 0]]) g.add(mesh(cylY(0.35, 4.3), M.aceroOscuro, [x, 3.35, z]));
    refs.turboPort = new THREE.Vector3(7.8, 9.5, -4);
  }
  {
    const g = makePart(root, 'rotor_turbo', L1([-17, 0, 0], { label: 'equipo' }));
    const spin = new THREE.Group(); spin.position.set(-1, 13.5, -4); g.add(spin);
    spin.add(mesh(cylY(0.9, 10.5), M.aceroPulido));
    const blades = 16, stages = 6;
    const bg = box(3.6, 0.08, 0.75);
    bg.translate(3.0, 0, 0);
    const inst = new THREE.InstancedMesh(bg, M.aceroPulido.clone(), blades * stages);
    const d = new THREE.Object3D(); let k = 0;
    for (let s = 0; s < stages; s++) {
      const y = -4 + s * 1.3;
      spin.add(mesh(cylY(1.25, 0.35), M.aceroPulido, [0, y, 0]));
      for (let b = 0; b < blades; b++) {
        d.position.set(0, y, 0);
        d.rotation.set(0, (b / blades) * Math.PI * 2 + s * 0.2, 0);
        d.rotateX(0.55);
        d.updateMatrix(); inst.setMatrixAt(k++, d.matrix);
      }
    }
    inst.castShadow = true;
    spin.add(inst);
    refs.rotor = spin;
  }
  {
    // se aleja más deprisa que el panel derecho: nunca lo atraviesa
    const g = makePart(root, 'bomba_previa', L1([40, 0, -6], { label: 'equipo' }));
    const cx = 30, cz = -22;
    g.add(mesh(rbox(7, 9, 9, 0.5), M.anodizado, [cx + 3, 5.0, cz]));
    g.add(mesh(cylX(3.8, 9, 40), M.carcasaOsc, [cx - 5, 4.8, cz]));
    for (let i = 0; i < 8; i++) g.add(mesh(washerX(4.2, 3.7, 0.25), M.carcasaOsc, [cx - 8.8 + i * 1.1, 4.8, cz]));
    g.add(mesh(cylX(2.2, 0.8), M.plasticoNegro, [cx - 9.9, 4.8, cz]));
    g.add(mesh(cylY(0.8, 2.2), M.acero, [cx + 3, 10.6, cz]));
    g.add(mesh(cylY(1.3, 0.35), M.acero, [cx + 3, 11.75, cz]));
    g.add(mesh(cylZ(0.8, 0.2), M.ledAmbar, [cx + 4, 3.5, cz + 4.6]));
    // mirilla del aceite y tapón de llenado
    g.add(mesh(cylZ(1.1, 0.3), M.aceroOscuro, [cx - 3, 3.0, cz + 3.95]));     // caras escalonadas ≥ 0,08 (sin parpadeo)
    g.add(mesh(cylZ(0.8, 0.36), M.vidrio, [cx - 3, 3.0, cz + 4.1]));
    g.add(mesh(cylZ(0.75, 0.18), M.liquido, [cx - 3, 2.6, cz + 4.09]));
    g.add(mesh(cylY(0.9, 0.8, 6), M.plasticoNegro, [cx - 1, 9.0, cz + 2.5]));
    g.add(mesh(rbox(3.2, 2.2, 0.6, 0.2), M.plasticoNegro, [cx + 3, 7.5, cz + 4.7]));
    g.add(mesh(cylY(1.4, 5), M.aluminio, [cx + 5.5, 7.5, cz - 3]));
    g.add(mesh(new THREE.TorusGeometry(1.8, 0.3, 10, 20, Math.PI), M.plasticoNegro, [cx - 1, 9.4, cz], [0, 0, 0]));
    for (const x of [cx - 8, cx + 5.5]) for (const z of [cz - 3.5, cz + 3.5]) g.add(mesh(cylY(0.7, 0.6), M.goma, [x, 0.3, z]));
    refs.pumpInlet = new THREE.Vector3(cx + 3, 11.9, cz);
  }
  {
    const g = makePart(root, 'manguera_previa', L1([0, 0, 0]));
    const hoseMat = M.aceroOscuro.clone(); hoseMat.color.setHex(0xb3b8be); hoseMat.roughness = 0.32;
    hoseMat.roughnessMap = null; hoseMat.bumpMap = ribTexture(140); hoseMat.bumpScale = 3;
    // salida de la turbo → por dentro junto al panel derecho → pasamuros del panel derecho → entrada de la bomba
    const pd = 'panel_der', bp = 'bomba_previa', P0 = refs.turboPort, P1 = refs.pumpInlet;
    refs.hose = cableFlex(g, [[P0.x - 0.2, P0.y, P0.z, 'bomba_turbo'], [P0.x + 2.6, P0.y - 0.1, P0.z - 0.3, 'bomba_turbo'], [12.4, 9.3, -9], [12.6, 9.2, -22], [12.3, 9.2, -26.6],
      [13.6, 9.2, -28, pd], [16.4, 9.2, -28, pd], [19, 11, -27.6, bp], [26, 15, -24.5, bp], [P1.x, 15.6, P1.z, bp], [P1.x, P1.y + 0.1, P1.z, bp]], 0.7, hoseMat, { seg: 120, radial: 12 });
    refs.clamps = [0, 1].map(() => { const c = new THREE.Group();
      c.add(mesh(new THREE.TorusGeometry(1.05, 0.22, 10, 28), M.aceroPulido));
      c.add(mesh(cylZ(0.15, 1.6), M.acero, [1.3, 0, 0]));
      c.add(mesh(box(0.9, 0.5, 0.14), M.aceroPulido, [1.9, 0, 0.6]));
      g.add(c); return c; });
  }

  /* ---------------- ELECTRÓNICA ---------------- */
  {
    const g = makePart(root, 'placa_principal', L1([0, 0, -12], { label: 'equipo' }));
    g.add(mesh(rbox(24, 14, 0.25, 0.05), M.pcb, [0, 11, -29]));
    pcbChips(g, 0, 11, -28.87, 22, 12, 7, 4, 'z', 1);
    g.add(mesh(rbox(4, 3, 1.6, 0.1), M.aluminio, [6, 14, -28]));
    for (let i = 0; i < 8; i++) g.add(mesh(box(0.15, 3, 1.6), M.aluminio, [4.2 + i * 0.5, 14, -27.2]));
    screws(g, M.tornillo, M.tornilloNegro, 0.25, 'z', [[-11.4, 17.4, -28.87], [11.4, 17.4, -28.87], [-11.4, 4.6, -28.87], [11.4, 4.6, -28.87]]);
    // conectores de cinta y arnés hacia la placa lateral
    for (const x of [-8, -4]) g.add(mesh(rbox(3, 0.8, 0.9, 0.08), M.plasticoNegro, [x, 17.2, -28.4]));
    // arneses hasta los conectores pasantes de la placa lateral (por detrás de la cámara, junto al panel derecho)
    for (const [x, c, yc] of [[-8, M.cableGris, 23], [-4, M.cable, 33]]) {
      const dz = x === -8 ? 0 : 0.5;
      cableFlex(g, [[x, 17.4, -28.4], [x, 18.8, -27.4], [x + 3, 19.6, -26 + dz, 'chasis'], [9.5, 20.2, -25 + dz, 'placa_lateral'],
        [11.7 + dz, 21.5, -21.5, 'placa_lateral'], [11.7 + dz, yc - 1.2, -18.6, 'placa_lateral'], [10.4, yc, -18, 'placa_lateral'], [9.3, yc, -18, 'placa_lateral']], 0.18, c, { seg: 80, radial: 8 });
    }
  }
  {
    const g = makePart(root, 'fuente_alimentacion', L1([-6, 0, 14], { label: 'equipo' }));
    g.add(mesh(rbox(12, 10, 14, 0.3), M.anodizado, [-7, 6.2, 23]));
    const gm = M.carcasa.clone(); gm.map = grille;
    g.add(mesh(new THREE.PlaneGeometry(10, 7), gm, [-7, 6.2, 30.02]));
    g.add(mesh(rbox(2.2, 1.6, 0.6, 0.1), M.plasticoNegro, [-1.5, 9, 30.2]));
    screws(g, M.tornillo, M.tornilloNegro, 0.25, 'z', [[-12.4, 10.6, 30.0], [-1.6, 10.6, 30.0], [-12.4, 1.8, 30.0], [-1.6, 1.8, 30.0]]);
    // cable al conector del controlador de la turbo
    cableFlex(g, [[-1.8, 8, 16.4], [-1.4, 8.2, 15.2], [0, 9, 12], [0, 10, 6, 'bomba_turbo'], [-1, 11.9, 3.6, 'bomba_turbo'], [-1, 12, 2.2, 'bomba_turbo']], 0.3, M.cable, { seg: 48 });
  }

  /* ---------------- INTRODUCCIÓN DE MUESTRA ---------------- */
  {
    const g = makePart(root, 'linea_transferencia', L1([-8, 0, 0], { label: 'equipo' }));
    const y = 28, z = 12.6;
    g.add(mesh(cylX(1.5, 8.5), M.aislanteTerm, [-13.3, y, z]));
    for (const x of [-16.6, -9.4]) g.add(mesh(washerX(1.9, 0.3, 0.5), M.acero, [x, y, z]));     // separada 0,15 de la cara del GC
    g.add(mesh(cylX(0.35, 16), M.acero, [-17, y, z]));
    g.add(mesh(cylX(0.3, 5.8), M.acero, [-6.1, y, z]));
    g.add(mesh(cylX(0.06, 1.4), M.poliimida, [-2.6, y, z]));
    g.add(mesh(cylX(0.6, 0.8, 6), M.aceroOscuro, [-8.6, y, z]));
    // cable del calefactor/sensor: bajo la camisa, por el pasamuros del panel izquierdo, hasta el GC
    cableFlex(g, [[-12.8, y - 1.45, z], [-13.8, y - 1.75, z], [-14.6, y - 1.8, z, 'panel_izq'], [-15.4, y - 1.8, z, 'panel_izq'],
      [-16.3, y - 2.3, z + 0.1, 'gc'], [-17.4, y - 2.5, z + 0.2, 'gc']], 0.12, M.cobre, { seg: 40, radial: 8 });
  }
  {
    const g = makePart(root, 'valvula_calibracion', L1([0, 14, 0], { label: 'equipo' }));
    g.add(mesh(rbox(2.4, 2.0, 2.4, 0.2), M.acero, [-5, 37, 8]));
    g.add(mesh(cylY(0.95, 3.2), M.vidrio, [-5, 39.6, 8]));
    g.add(mesh(cylY(0.82, 1.4), M.liquido, [-5, 38.8, 8]));
    g.add(mesh(cylY(1.05, 0.5), M.acero, [-5, 38.1, 8]));
    g.add(mesh(cylZ(0.9, 1.6), M.plasticoNegro, [-5, 37, 10]));
  }
  {
    const g = makePart(root, 'medidor_vacio', L1([0, 12, 0], { label: 'equipo' }));
    g.add(mesh(cylY(1.1, 3.2), M.acero, [2, 37.6, -17]));
    g.add(mesh(rbox(2.8, 1.8, 2.8, 0.25), M.plasticoNegro, [2, 39.9, -17]));
  }

  /* ---------------- CROMATÓGRAFO DE GASES (contexto) ---------------- */
  {
    const g = makePart(root, 'gc', L1([-30, 0, 0], { shell: true, label: 'equipo' }));
    g.add(mesh(rbox(54, 46, 54, 0.7), M.carcasa, [-44, 23, 1]));
    g.add(mesh(rbox(54.2, 4, 54.2, 0.6), M.carcasaOsc, [-44, 2, 1]));
    g.add(mesh(rbox(11.6, 7.6, 0.4, 0.2), M.plasticoNegro, [-24, 38, 28.05]));
    const gcs = new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 0.12, metalness: 0.1, emissive: 0xffffff, emissiveIntensity: 0.85,
      emissiveMap: screenTexture([['Horno', '280 °C'], ['Inyector', '250 °C'], ['Flujo He', '1,0 mL/min'], ['Run', '12,48 min']], { h: 300, title: 'GC  En marcha' }) });
    g.add(mesh(new THREE.PlaneGeometry(10.6, 6.6), gcs, [-24, 38, 28.33]));
    for (let i = 0; i < 9; i++) g.add(mesh(rbox(1.6, 1.2, 0.4, 0.1), M.plasticoNegro,
      [-27.5 + (i % 3) * 3.4, 31 - Math.floor(i / 3) * 2, 28.15]));
    {
      const d = makePart(g, 'gc_puerta', L1([0, 0, 10], { info: 'gc_puerta' }));
      d.add(mesh(rbox(30, 30, 1.4, 0.5), M.carcasaOsc, [-48, 22, 28.7]));
      d.add(mesh(rbox(2, 10, 1.2, 0.4), M.aceroOscuro, [-35, 22, 29.8]));
    }
    {
      const s = makePart(g, 'gc_inyector', L1([0, 6, 0], { info: 'gc_inyector' }));
      s.add(mesh(cylY(1.8, 3), M.acero, [-40, 47, 12]));
      s.add(mesh(cylY(1.0, 1.0, 6), M.aceroOscuro, [-40, 49, 12]));
      s.add(mesh(rbox(6, 2, 6, 0.4), M.carcasaOsc, [-40, 46.2, 12]));
    }
    {
      const c = makePart(g, 'gc_columna_horno', L1([0, 0, 0], { info: 'columna' }));
      c.add(mesh(helix(9, 2.5, 22, 0.07, 1600), M.poliimida, [-48, 23, 14]));
      const cage = mesh(new THREE.TorusGeometry(9.2, 0.18, 8, 80), M.acero, [-48, 23, 14]);
      c.add(cage);
      for (let i = 0; i < 3; i++) c.add(mesh(box(0.25, 0.25, 3.5), M.acero,
        [-48 + Math.cos(i * 2.09) * 9.2, 23 + Math.sin(i * 2.09) * 9.2, 14]));
      c.add(mesh(tubePath([[-40, 44, 12], [-40, 36, 13], [-43, 31, 13.5], [-46, 31.5, 14]], 0.07), M.poliimida));
      c.add(mesh(tubePath([[-39, 23, 15], [-30, 26, 14], [-20, 28, 12.6], [-17, 28, 12.6]], 0.07), M.poliimida));
    }
  }

  refs.updateHose = () => {
    const turbo = parts.get('bomba_turbo').object.position;
    const pump = parts.get('bomba_previa').object.position;
    const a = refs.turboPort.clone().add(turbo);
    const b = refs.pumpInlet.clone().add(pump);
    // la manguera es un cableFlex (se recalcula sola); aquí sólo se colocan las abrazaderas
    refs.clamps[0].position.copy(a).add(new THREE.Vector3(0.6, 0, 0)); refs.clamps[0].rotation.set(0, Math.PI / 2, 0);
    refs.clamps[1].position.copy(b).add(new THREE.Vector3(0, 0.4, 0)); refs.clamps[1].rotation.set(Math.PI / 2, 0, 0);
  };
  return refs;
}
