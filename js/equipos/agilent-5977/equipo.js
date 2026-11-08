// Equipo completo: MSD 5977B (≈ 30 × 42 × 54 cm), cámara de vacío, placa lateral, bombas, electrónica,
// interfaz GC/MSD y cromatógrafo de gases 8890 con torre de inyección 7693A (contexto). Coordenadas de mundo en cm.
// Frente hacia +Z. Como en el sistema real, el MSD queda a la IZQUIERDA del GC: la línea de transferencia sale de la
// pared izquierda del horno y entra por el lateral derecho del MSD. Suelo (mesa) en y = 0.
//
// El interior del MSD (cámara, analizador, placa lateral, bombas, electrónica) se construye en un grupo con
// escala x = −1: es la imagen especular de la disposición original, con la placa lateral hacia el lado izquierdo y la
// interfaz hacia el derecho. Las carcasas y el GC se construyen directamente en coordenadas de mundo.
import * as THREE from 'three';
import { M, ribTexture } from '../../materials.js';
import { mesh, rbox, box, washerX, cylX, cylY, cylZ, tubePath, helix, grilleTexture,
  screws, warningTexture, plateTexture, placaPasos, pasamuros } from '../../geom.js';
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

/* ---------------- Rótulos (texturas de canvas, fondo transparente) ---------------- */
const AZUL_AGILENT = '#0085d5';
function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}
function decal(tex, w, h, pos, rot = [0, 0, 0], extra = {}) {
  const m = new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: 0.45, metalness: 0, ...extra });
  const d = mesh(new THREE.PlaneGeometry(w, h), m, pos, rot); d.castShadow = false;
  return d;
}
/** Logotipo "chispa" de Agilent simplificado: puntos dispuestos en rayos que menguan hacia fuera. */
function spark(g, cx, cy, s, color) {
  g.fillStyle = color;
  g.beginPath(); g.arc(cx, cy, s * 0.13, 0, Math.PI * 2); g.fill();
  for (let k = 0; k < 12; k++) {
    const a = (k * Math.PI) / 6 + (k % 2) * 0.12, n = k % 2 ? 3 : 4;
    for (let i = 1; i <= n; i++) {
      const r = s * (0.12 + i * 0.21), d = s * (0.095 - i * 0.017);
      g.beginPath(); g.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r, Math.max(1.2, d), 0, Math.PI * 2); g.fill();
    }
  }
}
/** Placa de modelo: recuadro azul con la chispa y "Agilent" en blanco + modelo en gris. */
function badgeTex(modelo) {
  return canvasTex(1024, 128, (g) => {
    g.fillStyle = AZUL_AGILENT; g.beginPath(); g.roundRect(4, 14, 300, 100, 8); g.fill();
    spark(g, 62, 64, 46, '#ffffff');
    g.fillStyle = '#ffffff'; g.font = '600 54px Segoe UI, Arial'; g.textBaseline = 'middle'; g.fillText('Agilent', 120, 66);
    g.fillStyle = '#4b5158'; g.font = '500 50px Segoe UI, Arial'; g.fillText(modelo, 336, 66);
  });
}
function textoTex(text, { w = 512, h = 128, font = '600 60px Segoe UI, Arial', color = '#ffffff', align = 'center' } = {}) {
  return canvasTex(w, h, (g) => {
    g.fillStyle = color; g.font = font; g.textBaseline = 'middle'; g.textAlign = align;
    g.fillText(text, align === 'center' ? w / 2 : 8, h / 2 + 2);
  });
}
/** Pantalla táctil del 8890: interfaz clara con barra de título azul y mosaicos de estado. */
function touchTex() {
  return canvasTex(1024, 680, (g, w, h) => {
    g.fillStyle = '#e9edf1'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#0b5fa5'; g.fillRect(0, 0, w, 86);
    g.fillStyle = '#ffffff'; g.font = '600 40px Segoe UI, Arial'; g.textBaseline = 'middle'; g.fillText('8890 GC', 28, 44);
    g.font = '400 30px Segoe UI, Arial'; g.textAlign = 'right'; g.fillText('Run 12,48 min', w - 28, 44); g.textAlign = 'left';
    const T = [['Horno', '280 °C', '#e0663a'], ['Inyector delantero', '250 °C', '#e0663a'], ['Columna', '1,0 mL/min', '#2f8fd8'],
      ['MSD', 'Listo', '#3aa757'], ['ALS 7693A', 'Vial 4', '#7a5cc2'], ['Línea de transf.', '280 °C', '#e0663a']];
    T.forEach(([k, v, c], i) => {
      const x = 28 + (i % 3) * 330, y = 112 + Math.floor(i / 3) * 270;
      g.fillStyle = '#ffffff'; g.beginPath(); g.roundRect(x, y, 306, 246, 14); g.fill();
      g.fillStyle = c; g.fillRect(x, y + 12, 8, 222);
      g.fillStyle = '#56606a'; g.font = '500 30px Segoe UI, Arial'; g.fillText(k, x + 28, y + 52);
      g.fillStyle = '#1d2329'; g.font = '600 56px Segoe UI, Arial'; g.fillText(v, x + 28, y + 140);
      g.fillStyle = '#9aa4ad'; g.fillRect(x + 28, y + 196, 250, 6); g.fillStyle = c; g.fillRect(x + 28, y + 196, 170, 6);
    });
  });
}

/** Perfil en L con esquina redondeada (frente vertical de espesor tF + reborde superior de espesor tT),
 *  extruido a lo largo de X entre xa y xb. */
function perfilFrontal(xa, xb, zBack, zFront, yBot, yTop, R, tF, tT, mat) {
  const s = new THREE.Shape(), ri = Math.max(0.05, R - Math.max(tF, tT));
  s.moveTo(zBack, yTop);
  s.lineTo(zFront - R, yTop);
  s.absarc(zFront - R, yTop - R, R, Math.PI / 2, 0, true);
  s.lineTo(zFront, yBot);
  s.lineTo(zFront - tF, yBot);
  s.lineTo(zFront - tF, yTop - tT - ri);
  s.absarc(zFront - tF - ri, yTop - tT - ri, ri, 0, Math.PI / 2, false);
  s.lineTo(zBack, yTop - tT);
  s.lineTo(zBack, yTop);
  const g = new THREE.ExtrudeGeometry(s, { depth: xb - xa, bevelEnabled: false, curveSegments: 18 });
  g.rotateY(-Math.PI / 2);          // forma (z, y); la extrusión queda hacia −x
  g.computeVertexNormals();
  return mesh(g, mat, [xb, 0, 0]);
}

export function buildEquipo(root) {
  const refs = {};
  const grille = grilleTexture(28, 10);

  // Acabados del sistema Agilent: blanco cálido de pintura en polvo, frontal ahumado brillante y lamas grafito
  const BL = M.carcasa.clone(); BL.color.setHex(0xeef0f2);
  const BASE = M.grisClaro.clone(); BASE.color.setHex(0xcfd3d8);
  const HUMO = new THREE.MeshPhysicalMaterial({ color: 0x15171a, metalness: 0.1, roughness: 0.13, clearcoat: 1, clearcoatRoughness: 0.05 });
  const LAMA = new THREE.MeshPhysicalMaterial({ color: 0x2d3136, metalness: 0.25, roughness: 0.42, clearcoat: 0.35, clearcoatRoughness: 0.3 });

  // Interior del MSD: imagen especular (x → −x) de la disposición original
  const IN = new THREE.Group(); IN.name = 'msd_interior'; IN.scale.x = -1; root.add(IN);
  const grilleMat = M.carcasa.clone(); grilleMat.map = grille;

  /* ================= MSD 5977B · ESTRUCTURA Y CARCASA (mundo) ================= */
  // Envolvente: x ±15,5 · y 0–42,7 · z −27,4 (trasera) … +28,4 (frontal ahumado)
  {
    const g = makePart(root, 'chasis', L1([0, 0, 0], { label: null }));
    g.add(mesh(rbox(30, 1.2, 52.6, 0.3), BASE, [0, 0.6, 0]));
    for (const x of [-12, 12]) for (const z of [-23, 23]) g.add(mesh(cylY(1.2, 0.6), M.goma, [x, -0.1, z]));
  }
  {
    // tapa superior (el frente ahumado se curva sobre ella en la parte delantera)
    const g = makePart(root, 'carcasa_superior', L1([0, 30, 0], { info: 'carcasa', shell: true }));
    g.add(mesh(rbox(31, 1.0, 50.4, 0.45), BL, [0, 42.2, -2.2]));
  }
  {
    // lateral izquierdo: asa empotrada y paso de la manguera de vacío previo (la bomba queda a la izquierda del MSD)
    const g = makePart(root, 'panel_izq', L1([-28, 0, -58], { info: 'carcasa', shell: true }));
    g.add(placaPasos(52.8, 40.6, 1.0, [[-20, 9.2 - 21.5, 1.05]], BL, [-15, 21.5, 0], 'zy', 0.35));
    g.add(pasamuros(1.05, M.goma, [-15, 9.2, -20], 'x', 0.4));
    g.add(mesh(rbox(0.4, 3.2, 6.5, 0.15), M.plasticoNegro, [-15.6, 35.5, -6]));
    g.add(mesh(box(0.1, 0.2, 52.2), M.plasticoNegro, [-15.53, 22.3, 0]));
  }
  {
    // lateral derecho (hacia el GC): pasamuros de la línea de transferencia
    const g = makePart(root, 'panel_der', L1([24, 0, 0], { info: 'carcasa', shell: true }));
    g.add(placaPasos(52.8, 40.6, 1.0, [[12.6, 28 - 21.5, 2.3]], BL, [15, 21.5, 0], 'zy', 0.35));
    g.add(pasamuros(2.3, M.goma, [15, 28, 12.6], 'x', 0.4));
    g.add(mesh(box(0.1, 0.2, 52.2), M.plasticoNegro, [15.53, 22.3, 0]));
  }
  {
    // Frontal: mitad izquierda blanca (placa Agilent), mitad derecha con ventana ahumada y rejilla de lamas
    const g = makePart(root, 'panel_frontal', L1([-6, 0, 34], { shell: true, label: 'equipo' }));
    // tapa frontal superior blanca (borde redondeado) y ventana ahumada bajo su reborde
    g.add(perfilFrontal(-15.4, -3.02, 23.05, 28.4, 22.4, 42.7, 1.6, 2.0, 0.8, BL));
    g.add(perfilFrontal(-3.0, 15.4, 23.05, 28.4, 39.6, 42.7, 1.6, 2.0, 0.8, BL));
    g.add(mesh(rbox(12.5, 19.0, 1.2, 0.35), BL, [-9.25, 12.7, 27.0]));
    g.add(mesh(rbox(18.5, 16.8, 2.0, 0.7), HUMO, [6.25, 31.0, 27.4]));
    g.add(mesh(rbox(8, 0.8, 0.25, 0.1), M.plasticoNegro, [6.25, 37.9, 28.45]));            // asidero de la ventana
    g.add(decal(textoTex('Inert Plus', { font: 'italic 600 64px Segoe UI, Arial', color: '#e9ecef' }), 5.2, 1.3, [6.25, 34.8, 28.42]));
    g.add(decal(warningTexture('ALTA TENSIÓN'), 4.2, 1.6, [10.5, 42.71, 24.4], [-Math.PI / 2, 0, 0]));
    g.add(decal(badgeTex('5977B GC/MSD'), 8.4, 1.05, [-10.8, 38.4, 28.43]));
    // rejilla de lamas inclinadas (salida de aire de la fuente de alimentación)
    g.add(mesh(rbox(18.5, 19.0, 0.6, 0.1), M.plasticoNegro, [6.25, 12.7, 26.7]));
    for (const x of [-2.7, 15.2]) g.add(mesh(rbox(0.6, 19.0, 1.6, 0.15), LAMA, [x, 12.7, 27.4]));
    for (const y of [3.5, 21.9]) g.add(mesh(rbox(17.3, 0.6, 1.6, 0.15), LAMA, [6.25, y, 27.4]));
    for (let i = 0; i < 14; i++) g.add(mesh(box(17.2, 0.5, 1.3), LAMA, [6.25, 4.65 + i * 1.25, 27.4], [0.5, 0, 0]));
    // zócalo con interruptor y piloto de encendido
    g.add(mesh(rbox(31, 2.0, 1.0, 0.3), BASE, [0, 2.2, 26.9]));
    g.add(mesh(rbox(2.2, 1.1, 0.4, 0.15), BL, [-9, 2.2, 27.5]));
    g.add(mesh(cylZ(0.25, 0.3, 16), M.ledVerde, [-6.2, 2.2, 27.5]));
  }
  {
    const g = makePart(root, 'panel_trasero', L1([0, 0, -24], { info: 'carcasa', shell: true }));
    g.add(mesh(rbox(31, 40.6, 1.0, 0.35), BL, [0, 21.5, -26.9]));
    const rej = BL.clone(); rej.map = grilleTexture(12, 12);
    g.add(mesh(new THREE.PlaneGeometry(11, 11), rej, [0, 30, -27.42], [0, Math.PI, 0]));
    // conectores traseros: alimentación, LAN, remoto
    g.add(mesh(rbox(3, 2, 0.6), M.plasticoNegro, [-9, 8, -27.6]));
    g.add(mesh(tubePath([[-9, 8, -28.0], [-9, 8, -32.0], [-11, 2, -37], [-14, 0.7, -44], [-23, 0.7, -58]], 0.45, 40, 10), M.cable));
    for (const x of [-9.7, -9, -8.3]) g.add(mesh(box(0.25, 0.6, 0.1), M.tornillo, [x, 8, -27.92]));
    g.add(mesh(rbox(1.6, 1.4, 0.5), M.plasticoNegro, [-4, 8, -27.6]));
    g.add(mesh(box(1.1, 0.8, 0.1), M.tornillo, [-4, 8, -27.86]));
    g.add(mesh(rbox(3.2, 1.2, 0.5), M.plasticoNegro, [0, 8, -27.6]));
    const plate = new THREE.MeshStandardMaterial({ map: plateTexture(['5977B MSD · Mass Selective Detector', '100–240 V~  50/60 Hz', 'Modelo didáctico', 'Explorador 3D']), metalness: 0.6, roughness: 0.4 });
    g.add(mesh(new THREE.PlaneGeometry(7, 3.5), plate, [8, 12, -27.42], [0, Math.PI, 0]));
  }
  {
    const g = makePart(IN, 'ventilador', L1([0, 0, -14], { label: 'equipo' }));
    g.add(mesh(rbox(11, 11, 2.2, 0.4), M.plasticoNegro, [0, 30, -24.4]));
    for (const r of [1.8, 3.0, 4.2, 5.0]) g.add(mesh(new THREE.TorusGeometry(r, 0.07, 6, 48), M.aceroOscuro, [0, 30, -25.55]));
    for (let i = 0; i < 4; i++) g.add(mesh(box(10, 0.14, 0.14), M.aceroOscuro, [0, 30, -25.55], [0, 0, (i * Math.PI) / 4]));
    screws(g, M.tornillo, M.tornilloNegro, 0.25, '-z', [[-4.6, 25.4, -25.5], [4.6, 25.4, -25.5], [-4.6, 34.6, -25.5], [4.6, 34.6, -25.5]]);
    const spin = new THREE.Group(); spin.position.set(0, 30, -23.2); g.add(spin);
    spin.add(mesh(cylZ(1.6, 1.4), M.plasticoNegro));
    for (let i = 0; i < 7; i++) {
      const b = mesh(box(1.8, 4.2, 0.12), M.carcasaOsc, [0, 0, 0], [0, 0.45, 0]);
      const piv = new THREE.Group(); piv.rotation.z = (i * Math.PI * 2) / 7; b.position.y = 2.9;
      piv.add(b); spin.add(piv);
    }
    refs.fan = spin;
  }

  /* ================= CÁMARA DE VACÍO (interior especular) ================= */
  {
    const g = makePart(IN, 'camara_vacio', L1([0, 0, 0], { shell: true, label: 'equipo' }));
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
    const g = makePart(IN, 'placa_lateral', L1([20, 0, 0], { shell: true, label: 'equipo' }));
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
    // el grupo es especular: la textura se invierte en u para que el rótulo se lea bien
    const wt = warningTexture('SUPERFICIE CALIENTE'); wt.wrapS = THREE.RepeatWrapping; wt.repeat.x = -1; wt.offset.x = 1;
    const warn = new THREE.MeshStandardMaterial({ map: wt, roughness: 0.45 });
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
      // blindaje hueco, abierto hacia la placa lateral (la bobina queda dentro)
      s.add(mesh(box(0.25, 9, 14), M.aluminio, [11.675, 28, -8]));
      for (const y of [23.625, 32.375]) s.add(mesh(box(3.4, 0.25, 14), M.aluminio, [10.1, y, -8]));
      for (const z of [-1.125, -14.875]) s.add(mesh(box(3.4, 8.5, 0.25), M.aluminio, [10.1, 28, z]));
      s.add(mesh(rbox(3.6, 0.3, 14.2, 0.1), M.aceroOscuro, [10.1, 32.6, -8]));
      const c = makePart(s, 'bobina_rf_coil', L1([0, 0, 0], { info: 'bobina_rf' }));
      c.add(mesh(helix(1.4, 9, 18, 0.12, 600), M.cobre, [10.1, 28, -8]));
      c.add(mesh(cylZ(1.1, 9.6), M.ceramica, [10.1, 28, -8]));
      for (const y of [26, 30]) c.add(mesh(cylX(0.1, 2.4), M.cobre, [8.6, y, -3]));
    }
  }

  /* ---------------- SISTEMA DE VACÍO ---------------- */
  {
    const g = makePart(IN, 'bomba_turbo', L1([0, 0, 0], { shell: true, label: 'equipo' }));
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
    const g = makePart(IN, 'rotor_turbo', L1([-17, 0, 0], { label: 'equipo' }));
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
    // bomba de vacío previo sobre la mesa, a la izquierda del MSD; se aleja más deprisa que el panel izquierdo
    const g = makePart(IN, 'bomba_previa', L1([40, 0, -6], { label: 'equipo' }));
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
    const g = makePart(IN, 'manguera_previa', L1([0, 0, 0]));
    const hoseMat = M.aceroOscuro.clone(); hoseMat.color.setHex(0xb3b8be); hoseMat.roughness = 0.32;
    hoseMat.roughnessMap = null; hoseMat.bumpMap = ribTexture(140); hoseMat.bumpScale = 3;
    // salida de la turbo → por dentro junto al lateral → pasamuros del panel izquierdo (mundo) → entrada de la bomba
    const pd = 'panel_izq', bp = 'bomba_previa', P0 = refs.turboPort, P1 = refs.pumpInlet;
    refs.hose = cableFlex(g, [[P0.x - 0.2, P0.y, P0.z, 'bomba_turbo'], [P0.x + 2.6, P0.y - 0.1, P0.z - 0.3, 'bomba_turbo'], [12.4, 9.3, -9], [12.6, 9.2, -15],
      [12.4, 9.2, -18.6], [13.6, 9.2, -20, pd], [16.4, 9.2, -20, pd], [19, 11, -20.6, bp], [26, 15, -22, bp], [P1.x, 15.6, P1.z, bp], [P1.x, P1.y + 0.1, P1.z, bp]],
      0.7, hoseMat, { seg: 120, radial: 12 });
    refs.clamps = [0, 1].map(() => { const c = new THREE.Group();
      c.add(mesh(new THREE.TorusGeometry(1.05, 0.22, 10, 28), M.aceroPulido));
      c.add(mesh(cylZ(0.15, 1.6), M.acero, [1.3, 0, 0]));
      c.add(mesh(box(0.9, 0.5, 0.14), M.aceroPulido, [1.9, 0, 0.6]));
      g.add(c); return c; });
  }

  /* ---------------- ELECTRÓNICA ---------------- */
  {
    const g = makePart(IN, 'placa_principal', L1([0, 0, -12], { label: 'equipo' }));
    g.add(mesh(rbox(24, 14, 0.25, 0.05), M.pcb, [0, 11, -23.5]));
    pcbChips(g, 0, 11, -23.37, 22, 12, 7, 4, 'z', 1);
    g.add(mesh(rbox(4, 3, 1.6, 0.1), M.aluminio, [6, 14, -22.5]));
    for (let i = 0; i < 8; i++) g.add(mesh(box(0.15, 3, 1.6), M.aluminio, [4.2 + i * 0.5, 14, -21.7]));
    screws(g, M.tornillo, M.tornilloNegro, 0.25, 'z', [[-11.4, 17.4, -23.37], [11.4, 17.4, -23.37], [-11.4, 4.6, -23.37], [11.4, 4.6, -23.37]]);
    // conectores de cinta y arnés hacia la placa lateral
    for (const x of [-8, -4]) g.add(mesh(rbox(3, 0.8, 0.9, 0.08), M.plasticoNegro, [x, 17.2, -22.9]));
    // arneses: sobre el canto de la placa, por detrás de la cámara y de la placa lateral, hasta sus conectores pasantes
    for (const [x, c, yc] of [[-8, M.cableGris, 23], [-4, M.cable, 33]]) {
      const dz = x === -8 ? 0 : 0.5;
      cableFlex(g, [[x, 17.4, -22.9], [x, 18.8, -22.6], [x + 3, 19.6, -24.4 + dz, 'chasis'], [9.5, 20.2, -24.6 + dz, 'placa_lateral'],
        [11.7 + dz, 21.5, -22.6, 'placa_lateral'], [11.7 + dz, yc - 1.2, -19.2, 'placa_lateral'], [10.4, yc, -18, 'placa_lateral'], [9.3, yc, -18, 'placa_lateral']], 0.18, c, { seg: 80, radial: 8 });
    }
  }
  {
    // fuente de alimentación detrás de la rejilla de lamas del frontal
    const g = makePart(IN, 'fuente_alimentacion', L1([-6, 0, 14], { label: 'equipo' }));
    g.add(mesh(rbox(12, 10, 13, 0.3), M.anodizado, [-7, 6.2, 18.5]));
    const gm = M.carcasa.clone(); gm.map = grille;
    g.add(mesh(new THREE.PlaneGeometry(10, 7), gm, [-7, 6.2, 25.02]));
    g.add(mesh(rbox(2.2, 1.6, 0.6, 0.1), M.plasticoNegro, [-1.5, 9, 25.2]));
    screws(g, M.tornillo, M.tornilloNegro, 0.25, 'z', [[-12.4, 10.6, 25.0], [-1.6, 10.6, 25.0], [-12.4, 1.8, 25.0], [-1.6, 1.8, 25.0]]);
    // cable al conector del controlador de la turbo
    cableFlex(g, [[-1.8, 8, 12.4], [-1.4, 8.2, 11.2], [-0.4, 9, 8.5], [0, 10, 5.4, 'bomba_turbo'], [-1, 11.9, 3.6, 'bomba_turbo'], [-1, 12, 2.2, 'bomba_turbo']], 0.3, M.cable, { seg: 48 });
  }

  /* ---------------- INTRODUCCIÓN DE MUESTRA ---------------- */
  {
    // en el grupo especular: −x local = +x de mundo (hacia el GC)
    const g = makePart(IN, 'linea_transferencia', L1([-8, 0, 0], { label: 'equipo' }));
    const y = 28, z = 12.6;
    g.add(mesh(cylX(1.5, 8.5), M.aislanteTerm, [-13.3, y, z]));
    for (const x of [-16.6, -9.4]) g.add(mesh(washerX(1.9, 0.3, 0.5), M.acero, [x, y, z]));     // separada 0,15 de la cara del GC
    g.add(mesh(cylX(0.35, 16), M.acero, [-17, y, z]));
    g.add(mesh(cylX(0.3, 5.8), M.acero, [-6.1, y, z]));
    g.add(mesh(cylX(0.06, 1.4), M.poliimida, [-2.6, y, z]));
    g.add(mesh(cylX(0.6, 0.8, 6), M.aceroOscuro, [-8.6, y, z]));
    // cable del calefactor/sensor: bajo la camisa, por el pasamuros del panel derecho, hasta el GC
    cableFlex(g, [[-12.8, y - 1.45, z], [-13.8, y - 1.75, z], [-14.6, y - 1.8, z, 'panel_der'], [-15.4, y - 1.8, z, 'panel_der'],
      [-16.3, y - 2.3, z + 0.1, 'gc'], [-17.4, y - 2.5, z + 0.2, 'gc']], 0.12, M.cobre, { seg: 40, radial: 8 });
  }
  {
    const g = makePart(IN, 'valvula_calibracion', L1([0, 14, 0], { label: 'equipo' }));
    g.add(mesh(rbox(2.4, 2.0, 2.4, 0.2), M.acero, [-5, 37, 8]));
    g.add(mesh(cylY(0.95, 3.2), M.vidrio, [-5, 39.6, 8]));
    g.add(mesh(cylY(0.82, 1.4), M.liquido, [-5, 38.8, 8]));
    g.add(mesh(cylY(1.05, 0.5), M.acero, [-5, 38.1, 8]));
    g.add(mesh(cylZ(0.9, 1.6), M.plasticoNegro, [-5, 37, 10]));
  }
  {
    const g = makePart(IN, 'medidor_vacio', L1([0, 12, 0], { label: 'equipo' }));
    g.add(mesh(cylY(1.1, 3.2), M.acero, [2, 37.6, -17]));
    g.add(mesh(rbox(2.8, 1.8, 2.8, 0.25), M.plasticoNegro, [2, 39.9, -17]));
  }

  /* ================= CROMATÓGRAFO 8890 + TORRE 7693A (contexto, mundo) ================= */
  // 59 × 49 × 54 cm, a la derecha del MSD: x 17–76. Horno a la izquierda tras la puerta; columna derecha con
  // pantalla táctil y panel de puertos; tapa de inyectores y detectores encima.
  {
    const g = makePart(root, 'gc', L1([30, 0, 0], { shell: true, label: 'equipo' }));
    const x0 = 17, x1 = 76;
    // cuerpo hueco: el horno ocupa el hueco tras la puerta
    g.add(mesh(rbox(15.5, 38.4, 54, 0.8), BL, [68.25, 21.8, 0]));                                    // columna derecha
    g.add(placaPasos(54, 38.4, 1.6, [[12.6, 28 - 21.8, 1.6]], BL, [x0 + 0.8, 21.8, 0], 'zy', 0.8));   // pared izquierda (paso de la interfaz)
    g.add(mesh(rbox(42.2, 1.6, 54, 0.3), BL, [39.5, 40.2, 0]));                                      // techo del horno
    g.add(mesh(rbox(42.2, 1.6, 54, 0.3), BL, [39.5, 3.4, 0]));                                       // suelo del horno
    g.add(mesh(rbox(42.2, 35.4, 21.6, 0.3), BL, [39.5, 21.8, -16.2]));                               // bloque trasero (electrónica)
    g.add(mesh(rbox(58.6, 2.5, 53.6, 0.4), BASE, [(x0 + x1) / 2, 1.3, 0]));                          // zócalo
    // interior del horno: fondo de acero y ventilador
    g.add(mesh(box(41.6, 34.6, 0.2), M.acero, [39.5, 21.8, -5.3]));
    g.add(mesh(cylZ(6.5, 0.5, 48), M.aceroOscuro, [39.5, 21.8, -4.95]));
    for (const r of [2.5, 4.5, 6.3]) g.add(mesh(new THREE.TorusGeometry(r, 0.12, 6, 48), M.aceroPulido, [39.5, 21.8, -4.55]));
    // frente de la columna derecha: piloto verde, panel de puertos y placa inferior
    g.add(mesh(rbox(15.4, 38.0, 1.4, 0.4), BL, [68.3, 21.8, 27.7]));
    g.add(mesh(box(2.4, 0.35, 0.2), M.ledVerde, [72.6, 38.6, 28.5]));
    g.add(mesh(rbox(14.2, 10.6, 0.5, 0.25), M.plasticoNegro, [68.3, 30, 28.55]));
    for (let i = 0; i < 6; i++) {
      const px = 63.6 + (i % 3) * 4.7, py = 32.4 - Math.floor(i / 3) * 4.8;
      g.add(mesh(rbox(3.2, 3.2, 0.3, 0.5), BASE, [px, py, 28.85]));
      g.add(mesh(cylZ(0.55, 0.2, 20), M.plasticoNegro, [px, py, 29.02]));
    }
    // tapa superior: plataforma de inyectores (delante, izquierda), cubierta de detectores y tapa ventilada
    g.add(mesh(rbox(16, 3, 30, 0.6), BL, [25.3, 42.4, 12]));
    g.add(mesh(rbox(16, 4.5, 23.6, 0.6), BL, [25.3, 43.1, -15.2]));
    g.add(mesh(rbox(27.5, 9.5, 48, 0.8), BL, [46.9, 45.6, -2.5]));
    const vent = BL.clone(); vent.map = grille;
    g.add(mesh(new THREE.PlaneGeometry(22, 14), vent, [46.9, 50.37, -6], [-Math.PI / 2, 0, 0]));
    // pantalla táctil inclinada en la esquina superior derecha
    g.add(mesh(rbox(12, 5, 7.2, 0.6), M.negroBrillante, [66.4, 43.5, 20.4]));
    const ts = new THREE.Group(); ts.position.set(66.4, 48.0, 24.9); ts.rotation.x = -0.3; g.add(ts);
    ts.add(mesh(rbox(19.2, 13.4, 1.4, 0.5), M.negroBrillante));
    const scr = new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 0.15, metalness: 0.1, emissive: 0xffffff, emissiveIntensity: 0.85, emissiveMap: touchTex() });
    ts.add(mesh(new THREE.PlaneGeometry(17.4, 11.5), scr, [0, 0.1, 0.72]));
    {
      const d = makePart(g, 'gc_puerta', L1([0, 0, 10], { info: 'gc_puerta', shell: true }));
      d.add(mesh(rbox(42.9, 37.8, 1.4, 0.5), BL, [38.85, 21.7, 27.72]));
      d.add(mesh(cylZ(1.3, 0.4, 32, 1.1), M.plasticoNegro, [55, 3.6, 28.5], [0, 0, 0]));            // tirador inferior
      d.add(decal(badgeTex('8890 GC System'), 8.6, 1.08, [23.0, 38.2, 28.43]));
    }
    {
      const s = makePart(g, 'gc_inyector', L1([0, 6, 0], { info: 'gc_inyector' }));
      s.add(mesh(rbox(5, 0.8, 5, 0.25), M.carcasaOsc, [24, 44.25, 13]));
      s.add(mesh(cylY(1.3, 1.4, 32), M.acero, [24, 45.2, 13]));
      s.add(mesh(cylY(0.8, 0.6, 6), M.aceroOscuro, [24, 46.1, 13]));
    }
    {
      // torre de inyección 7693A con torreta de 16 viales, sobre el inyector delantero
      const a = makePart(g, 'gc_automuestreador', L1([0, 26, 0], { info: 'gc_automuestreador' }));
      const cx = 24, cz = 13;
      a.add(mesh(cylY(8, 2.6, 48), M.carcasaOsc, [cx, 48.6, cz]));
      a.add(mesh(cylY(2.2, 3.6, 32), M.plasticoNegro, [cx, 51.7, cz]));
      const ambar = new THREE.MeshPhysicalMaterial({ color: 0x8a5526, roughness: 0.12, transparent: true, opacity: 0.82, clearcoat: 1 });
      for (let i = 0; i < 16; i++) {
        const t = (i / 16) * Math.PI * 2, vx = cx + Math.cos(t) * 6.2, vz = cz + Math.sin(t) * 6.2;
        a.add(mesh(cylY(0.62, 3.0, 20), ambar, [vx, 51.4, vz]));
        a.add(mesh(cylY(0.66, 0.6, 20), i % 4 ? M.plasticoNegro : M.acento, [vx, 53.2, vz]));
      }
      a.add(mesh(rbox(6.5, 10, 7.5, 0.8), BL, [cx + 0.5, 58.5, cz - 1]));
      a.add(mesh(rbox(11.5, 28, 13, 1.0), BL, [cx - 0.5, 77.5, cz - 1]));
      a.add(mesh(rbox(3.4, 34, 11.4, 0.6), M.negroBrillante, [cx + 5.6, 74, cz - 1]));
      [M.ledVerde, M.ledVerde, M.ledAmbar].forEach((mt, i) => a.add(mesh(cylZ(0.22, 0.2, 12), mt, [cx - 3, 72.5 - i * 1.0, cz + 5.55])));
      a.add(decal(badgeTex('7693A'), 7.2, 0.9, [cx - 0.9, 88.6, cz + 5.53]));
    }
    {
      // columna capilar: inyector → espiral en la jaula del horno → extremo de la línea de transferencia
      const c = makePart(g, 'gc_columna_horno', L1([0, 0, 0], { info: 'columna' }));
      const hx = 39, hy = 22, hz = 13;
      c.add(mesh(helix(9, 2.5, 22, 0.07, 1600), M.poliimida, [hx, hy, hz]));
      c.add(mesh(new THREE.TorusGeometry(9.2, 0.18, 8, 80), M.acero, [hx, hy, hz]));
      for (let i = 0; i < 3; i++) c.add(mesh(box(0.25, 0.25, 3.5), M.acero, [hx + Math.cos(i * 2.09) * 9.2, hy + Math.sin(i * 2.09) * 9.2, hz]));
      // los extremos de la espiral quedan junto a la varilla de la jaula a 0° (x = hx + 9)
      c.add(mesh(tubePath([[24, 41.2, 13], [24, 36.5, 13.1], [27, 33.6, 11.2], [38, 33.4, 10.9], [46.4, 29.6, 11.0], [48.1, 24, 11.4], [48, 22, 11.75]], 0.07, 96), M.poliimida));
      // tramo final: entra por el eje del paso de la pared izquierda en el tubo de la línea de transferencia y la sigue al desmontar
      cableFlex(c, [[48, 22, 14.25], [47.5, 23.5, 14.9], [40, 29.5, 15.0], [30, 29.5, 14.4], [26.5, 28.3, 13.0], [25.6, 28, 12.6],
        [24.6, 28, 12.6, 'linea_transferencia']], 0.07, M.poliimida, { seg: 96, radial: 6 });
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
