// Equipo completo Shimadzu UV-1900i, según las fotografías del equipo del laboratorio y las del fabricante: cuerpo blanco de frente
// barrido (curva suave de abajo hacia atrás) a la izquierda y en el lateral derecho, cubierta superior negra, tapa negra del
// compartimento de muestras en el centro y bloque de mando negro a la derecha con la pantalla táctil inclinada hacia el usuario,
// el rótulo del modelo y el lápiz táctil en el frontal. Dentro: sistema óptico (analizador.js), fuente de alimentación y placa
// principal. Los cables (cableFlex) siguen a las piezas al explosionar. Medidas tomadas de las fotografías: aproximadas.
import * as THREE from 'three';
import { M } from '../../materials.js';
import { mesh, rbox, box, cylY, cylZ, grilleTexture, textTexture, plateTexture, warningTexture, screws } from '../../geom.js';
import { makePart, cableFlex } from '../../parts.js';
import { buildAnalizador } from './analizador.js';
import { CAB, BY, ZS, ZR } from './geometria.js';

const L1 = (offset, extra = {}) => ({ level: 1, offset, mode: 'equipo', ...extra });
const { YB } = CAB;

/* ---------- formas ---------- */
const extr = (shape, L, opts = {}) => new THREE.ExtrudeGeometry(shape, { depth: L, bevelEnabled: false, curveSegments: 28, ...opts });
/** Forma del plano (z, y) extruida a lo largo de X entre x0 y x1 (la orientación va en la malla para la herramienta de inspección). */
const lagoX = (shape, x0, x1, mat) => mesh(extr(shape, x1 - x0), mat, [x1, 0, 0], [0, -Math.PI / 2, 0]);
/** Perfil de chapa del frente barrido: pared vertical en z = zf hasta ys y cuarto de elipse hasta (zt, yt); espesor T. */
function barrido({ zf, y0, ys, zt, yt, T = 0.5, techo = null }) {
  const s = new THREE.Shape();
  s.moveTo(zf, y0); s.lineTo(zf, ys);
  s.absellipse(zt, ys, zf - zt, yt - ys, 0, Math.PI / 2, false);
  if (techo != null) { s.lineTo(techo, yt); s.lineTo(techo, yt - T); }
  s.lineTo(zt, yt - T);
  s.absellipse(zt, ys, zf - zt - T, yt - ys - T, Math.PI / 2, 0, true);
  s.lineTo(zf - T, y0); s.lineTo(zf, y0);
  return s;
}
/** Contorno macizo del mismo perfil (tapas laterales), cerrado por detrás en z = zb. */
function lado({ zf, y0, ys, zt, yt }, zb) {
  const s = new THREE.Shape();
  s.moveTo(zb, y0); s.lineTo(zf, y0); s.lineTo(zf, ys);
  s.absellipse(zt, ys, zf - zt, yt - ys, 0, Math.PI / 2, false);
  s.lineTo(zb, yt); s.lineTo(zb, y0);
  return s;
}
/** Bloque de mando: frente vertical hasta yq y plano inclinado (pantalla) hasta (zt, yt). */
function rampa({ zf, y0, yq, zt, yt, T = 0.5 }, macizo = false) {
  const s = new THREE.Shape();
  if (macizo) { s.moveTo(zt, y0); s.lineTo(zf, y0); s.lineTo(zf, yq); s.lineTo(zt, yt); s.lineTo(zt, y0); return s; }
  const L = Math.hypot(zf - zt, yt - yq), nz = (yt - yq) / L, ny = (zf - zt) / L, k = (yt - yq) / (zf - zt);   // normal exterior del plano inclinado
  const yIn = (z) => yq - T * ny + (zf - T * nz - z) * k;                                                      // cara interior del plano inclinado
  s.moveTo(zf, y0); s.lineTo(zf, yq); s.lineTo(zt, yt); s.lineTo(zt, yIn(zt));
  s.lineTo(zf - T, yIn(zf - T)); s.lineTo(zf - T, y0); s.lineTo(zf, y0);
  return s;
}
const decal = (tex, extra = {}) => new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: 0.45, metalness: 0, ...extra });
function lienzo(w, h, dibujo) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; dibujo(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}

/** Pantalla táctil: interfaz de iconos grandes sobre fondo negro (menú de los seis modos de medida, en español). */
function texPantalla() {
  return lienzo(1024, 680, (g, W, H) => {
    g.fillStyle = '#050608'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#16191e'; g.fillRect(0, 0, W, 70);
    g.fillStyle = '#e9edf2'; g.font = '600 34px "Segoe UI", Arial'; g.textBaseline = 'middle'; g.fillText('Menú de modos', 28, 36);
    g.fillStyle = '#7fd7ff'; g.textAlign = 'right'; g.fillText('500,0 nm   0,000 Abs', W - 28, 36); g.textAlign = 'left';
    const modos = ['Fotométrico', 'Espectro', 'Cuantificación', 'Cinética', 'Curso temporal', 'Biométodo'];
    const cols = ['#2f9fd6', '#3ab37a', '#e0a030', '#d6604a', '#8a6fd8', '#3cb8b0'];
    modos.forEach((m, i) => {
      const cx = 30 + (i % 3) * 330, cy = 100 + Math.floor(i / 3) * 280;
      g.fillStyle = '#1b1f25'; g.beginPath(); g.roundRect(cx, cy, 300, 250, 22); g.fill();
      g.strokeStyle = cols[i]; g.lineWidth = 9; g.lineCap = 'round'; g.lineJoin = 'round';
      const ox = cx + 150, oy = cy + 100;
      g.beginPath();
      if (i === 0) { g.font = '700 74px "Segoe UI", Arial'; g.fillStyle = cols[i]; g.textAlign = 'center'; g.fillText('Abs', ox, oy); g.textAlign = 'left'; }
      else if (i === 1) { for (let k = 0; k <= 40; k++) { const u = k / 40, y = oy + 40 - 80 * Math.exp(-((u - 0.45) ** 2) / 0.02) - 20 * Math.exp(-((u - 0.75) ** 2) / 0.01); k ? g.lineTo(ox - 90 + u * 180, y) : g.moveTo(ox - 90, y); } }
      else if (i === 2) { g.moveTo(ox - 80, oy + 50); g.lineTo(ox + 80, oy - 50); g.stroke(); g.beginPath(); for (let k = 0; k < 4; k++) { g.moveTo(ox - 60 + k * 40 + 10, oy + 38 - k * 25); g.arc(ox - 60 + k * 40, oy + 38 - k * 25, 10, 0, Math.PI * 2); } g.fillStyle = cols[i]; g.fill(); g.beginPath(); }
      else if (i === 3) { for (let k = 0; k <= 30; k++) { const u = k / 30; k ? g.lineTo(ox - 90 + u * 180, oy + 50 - 100 * (1 - Math.exp(-u * 3))) : g.moveTo(ox - 90, oy + 50); } }
      else if (i === 4) { for (let k = 0; k <= 30; k++) { const u = k / 30; k ? g.lineTo(ox - 90 + u * 180, oy + 10 * Math.sin(u * 9) - 20 * u) : g.moveTo(ox - 90, oy); } }
      else { for (let k = 0; k <= 40; k++) { const u = k / 40; k ? g.lineTo(ox - 90 + u * 180, oy + 40 * Math.sin(u * 12)) : g.moveTo(ox - 90, oy); } g.stroke(); g.beginPath(); for (let k = 0; k <= 40; k++) { const u = k / 40; k ? g.lineTo(ox - 90 + u * 180, oy - 40 * Math.sin(u * 12)) : g.moveTo(ox - 90, oy); } }
      g.stroke();
      g.fillStyle = '#e9edf2'; g.font = '600 32px "Segoe UI", Arial'; g.textAlign = 'center'; g.fillText(m, cx + 150, cy + 205); g.textAlign = 'left';
    });
  });
}

export function buildEquipo(root) {
  const refs = {};
  const blanco = M.carcasa.clone(); blanco.color.setHex(0xeef0f1); blanco.clearcoat = 0.35;
  const negro = M.carcasaOsc.clone(); negro.color.setHex(0x24272b); negro.roughness = 0.62;
  const negroBr = M.negroBrillante.clone(); negroBr.color.setHex(0x101215);
  const zocalo = M.carcasaOsc.clone(); zocalo.color.setHex(0x3a3e44);
  const grisPanel = M.carcasa.clone(); grisPanel.color.setHex(0xdfe2e5);
  const rejilla = (c, r) => { const m = blanco.clone(); m.map = grilleTexture(c, r); m.color.setHex(0xb8bdc4); return m; };

  // perfiles del frente (z, y)
  const BW = { zf: CAB.ZF, y0: YB, ys: 7.6, zt: CAB.ZT, yt: CAB.YW, T: 0.5 };         // cuerpos blancos
  const BC = { zf: 22.6, y0: YB, ys: 9, zt: 10.5, yt: CAB.H, T: 0.5 };               // frente del compartimento de muestras
  const BP = { zf: 23.2, y0: YB, yq: 21, zt: 10.4, yt: CAB.H, T: 0.5 };              // bloque de mando

  /* ---------------- ZÓCALO ---------------- */
  {
    const g = makePart(root, 'base', L1([0, 0, 0], { info: 'carcasa' }));
    g.add(mesh(rbox(44.4, 1.1, 46.6, 0.3), zocalo, [0, 0.95, -0.5]));
    for (const x of [-18.5, 18.5]) for (const z of [-20, 19]) g.add(mesh(cylY(1.4, 0.4, 24), M.goma, [x, 0.2, z]));
  }

  /* ---------------- CUERPOS BLANCOS ---------------- */
  {
    const g = makePart(root, 'carcasa_izq', L1([-28, 0, 0], { info: 'carcasa', shell: true, label: 'equipo' }));
    g.add(lagoX(barrido(BW), -22.0, CAB.XL + 0.1, blanco));
    g.add(lagoX(lado(BW, CAB.ZB), CAB.X0, -22.0, blanco));
    // rejilla de ventilación en el lateral izquierdo, hacia atrás
    g.add(mesh(new THREE.PlaneGeometry(14, 7), rejilla(22, 7), [CAB.X0 - 0.02, 14.5, -15], [0, -Math.PI / 2, 0]));
  }
  {
    const g = makePart(root, 'carcasa_der', L1([26, 0, 0], { info: 'carcasa', shell: true }));
    g.add(lagoX(barrido(BW), CAB.XP + 0.05, 22.0, blanco));
    g.add(lagoX(lado(BW, CAB.ZB), 22.0, CAB.X1, blanco));
    g.add(mesh(new THREE.PlaneGeometry(12, 6), rejilla(18, 6), [CAB.X1 + 0.02, 12, -14], [0, Math.PI / 2, 0]));
  }
  {
    // panel trasero: toma de red, interruptor, USB y LAN (disposición aproximada), placa de características y rejilla
    const g = makePart(root, 'panel_trasero', L1([0, 0, -26], { info: 'carcasa', shell: true }));
    g.add(mesh(box(44, CAB.YW - YB, 0.5), grisPanel, [0, (YB + CAB.YW) / 2, CAB.ZB + 0.25]));
    const zf = CAB.ZB - 0.02;
    g.add(mesh(rbox(3.2, 2.6, 0.9, 0.2), M.plasticoNegro, [16.5, 6, CAB.ZB - 0.45]));
    g.add(mesh(rbox(2.0, 1.4, 0.5, 0.15), M.plasticoNegro, [12.6, 6, CAB.ZB - 0.25]));
    for (const x of [5.5, 7.2]) g.add(mesh(box(1.3, 0.55, 0.3), M.aceroPulido, [x, 7, CAB.ZB - 0.15]));
    g.add(mesh(box(1.6, 1.4, 0.3), M.plasticoNegro, [2.4, 7, CAB.ZB - 0.15]));
    const plate = new THREE.MeshStandardMaterial({ map: plateTexture(['UV-1900i', 'UV-VIS SPECTROPHOTOMETER', 'Modelo didáctico', 'Explorador 3D']), metalness: 0.5, roughness: 0.4 });
    g.add(mesh(new THREE.PlaneGeometry(8, 4), plate, [-8, 8, zf], [0, Math.PI, 0]));
    g.add(mesh(new THREE.PlaneGeometry(20, 7), rejilla(26, 7), [8, 17, zf], [0, Math.PI, 0]));
    const et = (t, x, y) => { const m = new THREE.MeshStandardMaterial({ map: textTexture([t], { w: 256, h: 64, bg: '#dfe2e5', fg: '#2a3038', font: '600 32px Segoe UI' }) }); g.add(mesh(new THREE.PlaneGeometry(2.8, 0.7), m, [x, y, zf], [0, Math.PI, 0])); };
    et('AC IN', 16.5, 3.9); et('POWER', 12.6, 4.4); et('USB', 6.35, 8.2); et('LAN', 2.4, 8.6);
  }

  /* ---------------- CUBIERTA SUPERIOR NEGRA ---------------- */
  {
    const g = makePart(root, 'tapa_superior', L1([0, 24, 0], { info: 'carcasa', shell: true }));
    const b = 0.15, t = CAB.H - 0.1 - CAB.YW;                 // 1 mm por debajo de la tapa y de los frentes
    const pts = [[-22.35, -23.85], [22.35, -23.85], [22.35, 12.85], [18.65, 12.85], [18.65, 9.85], [9.75, 9.85], [9.75, -15.85], [-4.65, -15.85], [-4.65, 12.85], [-22.35, 12.85]];
    const s = new THREE.Shape(); pts.forEach(([x, z], i) => (i ? s.lineTo(x, -z) : s.moveTo(x, -z)));
    const geo = new THREE.ExtrudeGeometry(s, { depth: t - 2 * b, bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: 3, curveSegments: 8 });
    geo.translate(0, 0, -(t - 2 * b) / 2);
    g.add(mesh(geo, negro, [0, CAB.YW + t / 2, 0], [-Math.PI / 2, 0, 0]));
    // panel trasero superior, ligeramente realzado (línea de junta)
    const tr = new THREE.Shape(); [[-20.5, -23.2], [-1.5, -23.2], [-4.5, -17.4], [-17.5, -17.4]].forEach(([x, z], i) => (i ? tr.lineTo(x, -z) : tr.moveTo(x, -z)));
    const tg = new THREE.ExtrudeGeometry(tr, { depth: 0.2, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.06, bevelSegments: 2 }); tg.translate(0, 0, -0.1);
    g.add(mesh(tg, negro, [0, CAB.H - 0.1 + 0.16, 0], [-Math.PI / 2, 0, 0]));
  }

  /* ---------------- COMPARTIMENTO DE MUESTRAS: FRENTE Y TAPA ---------------- */
  {
    const g = makePart(root, 'frontal', L1([0, 0, 26], { info: 'carcasa', shell: true }));
    g.add(lagoX(barrido({ ...BC, techo: 8.5 }), -4.0, 9.1, negro));
    const sl = new THREE.Shape(); sl.moveTo(8.5, YB); sl.lineTo(BC.zf, YB); sl.lineTo(BC.zf, BC.ys);
    sl.absellipse(BC.zt, BC.ys, BC.zf - BC.zt, BC.yt - BC.ys, 0, Math.PI / 2, false); sl.lineTo(8.5, BC.yt); sl.lineTo(8.5, YB);
    g.add(lagoX(sl, -4.3, -4.0, negro));
    g.add(lagoX(sl, 9.1, 9.4, negro));
    // ranura de agarre para levantar la tapa
    const ran = M.plasticoNegro.clone(); ran.color.setHex(0x0c0d0f);
    g.add(mesh(new THREE.PlaneGeometry(9, 0.35), ran, [2.55, 9.6, BC.zf + 0.02]));
  }
  {
    const g = makePart(root, 'tapa_muestras', L1([0, 36, 6], { label: 'equipo' }));
    g.add(mesh(rbox(13.6, CAB.H - 24.7, 24.2, 0.3), negro, [2.55, (24.7 + CAB.H) / 2, -3.7]));
    const ch = M.goma.clone();
    for (const x of [-2.5, 7.6]) g.add(mesh(box(1.6, 0.3, 1.2), ch, [x, 24.55, -14.6]));
  }

  /* ---------------- BLOQUE DE MANDO Y PANTALLA TÁCTIL ---------------- */
  const gp = makePart(root, 'panel_control', L1([0, 6, 30], { shell: false, label: 'equipo' }));
  {
    gp.add(lagoX(rampa(BP), 9.8, 18.15, negro));
    gp.add(lagoX(rampa(BP, true), 9.5, 9.8, negro));
    gp.add(lagoX(rampa(BP, true), 18.15, 18.45, negro));
    // rótulo del modelo en el frontal (arriba a la izquierda) y etiqueta blanca
    const rot = lienzo(1024, 256, (c) => {
      c.fillStyle = '#eef1f4'; c.textBaseline = 'middle';
      c.font = '700 120px "Segoe UI", Arial'; c.fillText('UV-1900i', 10, 92);
      c.font = '600 46px "Segoe UI", Arial'; c.fillText('UV-VIS SPECTROPHOTOMETER', 14, 200);
    });
    gp.add(mesh(new THREE.PlaneGeometry(5.6, 1.4), decal(rot), [13.2, 19.0, BP.zf + 0.02]));
    const et = lienzo(512, 128, (c) => {
      c.fillStyle = '#f4f5f6'; c.fillRect(0, 0, 512, 128); c.fillStyle = '#1e2227'; c.textBaseline = 'middle';
      c.font = '600 30px Arial'; c.fillText('SHIMADZU CORP.', 20, 40); c.font = '700 44px Arial'; c.fillText('Modelo 3D', 20, 90);
    });
    gp.add(mesh(new THREE.PlaneGeometry(3.8, 0.95), new THREE.MeshStandardMaterial({ map: et, roughness: 0.5 }), [12.4, 16.9, BP.zf + 0.02]));
    // lápiz táctil en su soporte, en el lado derecho del frontal
    for (const y of [9.5, 15.5]) gp.add(mesh(rbox(1.0, 0.7, 0.6, 0.15), negroBr, [17.3, y, BP.zf + 0.3]));
    gp.add(mesh(cylY(0.25, 8.0, 20), M.plasticoNegro, [17.3, 12.5, BP.zf + 0.86]));
    gp.add(mesh(cylY(0.12, 0.5, 12, 0.02), M.aceroOscuro, [17.3, 8.25, BP.zf + 0.86]));
  }
  {
    // pantalla: bisel negro brillante apoyado en el plano inclinado, LCD en color y logotipo detrás
    const g = makePart(gp, 'pantalla', L1([0, 0, 0], { label: 'equipo' }));
    const L = Math.hypot(BP.zf - BP.zt, BP.yt - BP.yq), u = [(BP.zt - BP.zf) / L, (BP.yt - BP.yq) / L], n = [(BP.yt - BP.yq) / L, (BP.zf - BP.zt) / L];
    const k = 0.55 * L, pz = BP.zf + u[0] * k, py = BP.yq + u[1] * k;
    const a = -Math.atan2(-u[0], u[1]);
    const h = new THREE.Group(); h.position.set(14.1, py + n[1] * 0.25, pz + n[0] * 0.25); h.rotation.x = a; g.add(h);
    h.add(mesh(rbox(8.2, 6.4, 0.5, 0.2), negroBr, [0, 0, 0]));
    const tx = texPantalla();
    const lcd = new THREE.MeshStandardMaterial({ map: tx, emissiveMap: tx, emissive: 0xffffff, emissiveIntensity: 0.85, roughness: 0.15, metalness: 0 });
    h.add(mesh(new THREE.PlaneGeometry(6.8, 4.5), lcd, [0, -0.35, 0.26]));
    const logo = lienzo(512, 96, (c) => { c.fillStyle = '#d7dbe0'; c.textBaseline = 'middle'; c.font = '700 64px Arial'; c.fillText('SHIMADZU', 8, 50); });
    h.add(mesh(new THREE.PlaneGeometry(2.6, 0.48), decal(logo), [-2.2, 2.55, 0.26]));
    refs.pantallaAtras = new THREE.Vector3(14.1, py, pz);
  }

  /* ---------------- ELECTRÓNICA Y ALIMENTACIÓN ---------------- */
  {
    const g = makePart(root, 'electronica', L1([22, 0, 0], { label: 'equipo' }));
    const x0 = 13.0, x1 = 18.0, z0 = -14.5, z1 = 19.5, y = 2.78;
    g.add(mesh(box(x1 - x0, 0.16, z1 - z0), M.pcb, [(x0 + x1) / 2, y, (z0 + z1) / 2]));
    for (const [x, z] of [[x0 + 0.6, z0 + 0.6], [x1 - 0.6, z0 + 0.6], [x0 + 0.6, z1 - 0.6], [x1 - 0.6, z1 - 0.6], [x0 + 0.6, 2.5], [x1 - 0.6, 2.5]])
      g.add(mesh(cylY(0.22, y - 0.08 - YB, 10), M.aceroPulido, [x, (YB + y - 0.08) / 2, z]));
    const chips = [[15.8, -9, 2.2, 2.2], [15.6, -3, 1.6, 3.0], [16.4, 6, 2.4, 2.4], [15.2, 11.5, 1.2, 2.0], [16.6, -12.5, 1.2, 1.6], [16.2, 15.5, 1.8, 1.4]];
    for (const [x, z, w, d] of chips) g.add(mesh(box(w, 0.3, d), M.chip, [x, y + 0.23, z]));
    for (let i = 0; i < 6; i++) g.add(mesh(cylY(0.32, 1.0, 16), M.condensador, [17.4, y + 0.58, -6 + i * 1.0]));
    for (const z of [ZS, ZR]) g.add(mesh(box(0.8, 0.6, 1.4), M.plasticoNegro, [13.7, y + 0.38, z]));
    g.add(mesh(box(1.6, 0.6, 0.9), M.plasticoNegro, [16.5, y + 0.38, 17]));
    const lab = new THREE.MeshStandardMaterial({ map: textTexture(['CPU / CONTROL'], { w: 512, h: 64, bg: '#1f5e3a', fg: '#e8ebef', font: '600 34px Segoe UI' }) });
    g.add(mesh(new THREE.PlaneGeometry(3.6, 0.45), lab, [15.5, y + 0.081, 0], [-Math.PI / 2, 0, -Math.PI / 2]));
  }
  {
    const g = makePart(root, 'fuente_alimentacion', L1([14, 0, -20], { label: 'equipo' }));
    g.add(mesh(rbox(10, 8, 6.5, 0.3), M.anodizado, [16, 5.9, -19.75]));
    for (const [x, z] of [[11.8, -22.4], [20.2, -22.4], [11.8, -17.1], [20.2, -17.1]]) g.add(mesh(cylY(0.3, 0.4, 10), M.aceroOscuro, [x, 1.7, z]));
    const rj = M.anodizado.clone(); rj.map = grilleTexture(18, 6); rj.color.setHex(0x8d949c);
    g.add(mesh(new THREE.PlaneGeometry(8, 5), rj, [16, 6.3, -16.48]));
    const w = new THREE.MeshStandardMaterial({ map: warningTexture('ALTA TENSIÓN'), roughness: 0.45 });
    g.add(mesh(new THREE.PlaneGeometry(5.4, 2.0), w, [16, 9.92, -19.75], [-Math.PI / 2, 0, 0]));
    for (const [y, z] of [[6.6, -18.5], [5.4, -20.5]]) g.add(mesh(box(0.5, 0.9, 1.2), M.plasticoNegro, [10.75, y, z]));
  }

  refs.analyzer = buildAnalizador(root);

  /* ---------------- CABLES ---------------- */
  {
    // alimentación de las lámparas: de la fuente, por detrás del compartimento, hasta los pasos de la casa de lámparas
    const g = makePart(root, 'cables_lamparas', L1([0, 0, 0], { info: 'fuente_alimentacion' }));
    const A = refs.analyzer;
    for (const [y, z, pin, id, r] of [[6.6, -18.5, A.d2Pin, 'lampara_d2', 0.2], [5.4, -20.5, A.wiPin, 'lampara_wi', 0.16]]) {
      cableFlex(g, [[10.5, y, z, 'fuente_alimentacion'], [9.6, y, z], [2, y + 0.4, z + 0.6], [pin.x + 3, pin.y, -16.4], [pin.x, pin.y, -15.2], [pin.x, pin.y, -13.2, 'casa_lamparas'],
        [pin.x, pin.y, pin.z - 0.6, id], [pin.x, pin.y, pin.z, id]], r, M.cable, { seg: 140, radial: 8 });
    }
  }
  {
    // señal de los fotodiodos hasta la placa principal
    const g = makePart(root, 'cables_detector', L1([0, 0, 0], { info: 'detectores' }));
    for (const [k, z] of [['S', ZS], ['R', ZR]]) {
      const p = refs.analyzer.detPin[k];
      cableFlex(g, [[p.x, p.y, p.z, 'detectores'], [p.x + 0.4, p.y, p.z], [13.7, 8.5, z], [13.7, 4.5, z], [13.7, 3.46, z, 'electronica']], 0.14, M.cableGris, { seg: 50, radial: 8 });
    }
    // cable plano de la pantalla
    const s = refs.pantallaAtras;
    cableFlex(g, [[16.5, 3.46, 17, 'electronica'], [16.5, 6, 17], [15.2, 15, 17.8], [14.3, 21.2, 17.5], [s.x, s.y - 1.2, s.z + 0.55, 'pantalla'], [s.x, s.y + 0.1, s.z, 'pantalla']], 0.16, M.cable, { seg: 80, radial: 8 });
  }
  {
    // cable de red: de la toma trasera al suelo
    const g = makePart(root, 'cable_red', L1([0, 0, -26], { info: 'fuente_alimentacion' }));
    cableFlex(g, [[16.5, 6, CAB.ZB - 0.88, 'panel_trasero'], [16.5, 6, CAB.ZB - 2.4], [17.2, 3.4, -30], [19, 0.5, -37], [24, 0.45, -45]], 0.35, M.cable, { seg: 80, radial: 10 });
  }

  refs.update = () => {};
  return refs;
}
