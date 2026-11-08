// Equipo completo LCMS-9050, según las fotografías de producto de Shimadzu: mueble de pie negro sobre ruedas (≈ 670 × 1250 ×
// 1460 mm, dato del LCMS-9030) con el pilar blanco curvo del frontal izquierdo, el gran panel blanco convexo de la derecha
// ribeteado por una franja cobriza que continúa por los laterales, la unidad de ionización con ventana ahumada arriba en el
// centro, el panel de LED de estado a su derecha y el logotipo SHIMADZU con el rótulo LCMS-9050 debajo. Dentro: cámara de vacío,
// tubo de vuelo vertical termostatizado, turbos, electrónica; fuera, la bomba rotatoria y la pila Nexera sobre su pedestal blanco.
import * as THREE from 'three';
import { M, ribTexture } from '../../materials.js';
import { mesh, rbox, rrShape, box, cylX, cylY, cylZ, washerX, tubePath, grilleTexture, textTexture, screws, plateTexture, placaPasos } from '../../geom.js';
import { makePart, cableFlex } from '../../parts.js';
import { buildAnalizador } from './analizador.js';
import { ORIGEN, AX } from './geometria.js';

const L1 = (offset, extra = {}) => ({ level: 1, offset, mode: 'equipo', ...extra });
const XW = 33.5, ZF = 62.5, ZB = -62.5, H = 145, HT = 146.2, BOT = 10;   // H: borde de paneles; HT: cara superior; BOT: sobre el zócalo
const ZP = 61.3;                                         // cara trasera de la placa frontal negra
/** Punto local del analizador → mundo (giro de 90° en Y: x local → −z mundo, z local → +x mundo). */
const W = (x, y, z = 0) => new THREE.Vector3(ORIGEN.x + z, ORIGEN.y + y, ORIGEN.z - x);
const KF = [4, 9.5, 15], KY = 18;                    // pasos KF de vacío previo en el panel trasero (x) y su altura
const UX0 = -8.8, UX1 = 15.7, UY0 = 122, UZ0 = 47.5, UZF = 65.5, UT = 146.4;   // unidad de ionización (caja; asoma 2 mm sobre la tapa)
const UXC = (UX0 + UX1) / 2;
const YH = ORIGEN.y + AX.SPRAY.y + 15.95 - 0.4;     // cara superior del soporte de la sonda (bajo su brida)

/** Forma extruida en z (frente), con bisel opcional; la cara trasera queda en z = 0. */
function frente(shape, t, b = 0) {
  const g = new THREE.ExtrudeGeometry(shape, b ? { depth: t - 2 * b, bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: 3, curveSegments: 32 }
    : { depth: t, bevelEnabled: false, curveSegments: 32 });
  g.translate(0, 0, b); return g;
}
/** Logotipo SHIMADZU (emblema del círculo con cruz dentro de un cuadrado y letras espaciadas), recreado como textura. */
function shimadzuLogo(fg = '#e9eaec', bg = '#1f2023') {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 160; const g = c.getContext('2d');
  g.fillStyle = bg; g.fillRect(0, 0, 1024, 160);
  g.strokeStyle = fg; g.fillStyle = fg; g.lineWidth = 9;
  g.strokeRect(24, 26, 108, 108); g.beginPath(); g.arc(78, 80, 34, 0, Math.PI * 2); g.stroke();
  g.fillRect(74, 46, 8, 68); g.fillRect(44, 76, 68, 8);
  g.font = '700 104px Arial, Segoe UI'; g.textBaseline = 'middle';
  let x = 170; for (const ch of 'SHIMADZU') { g.fillText(ch, x, 86); x += g.measureText(ch).width + 16; }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
function rotulo(lines, w, h, fonts, bg, fg, align = 'left') {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
  g.fillStyle = bg; g.fillRect(0, 0, w, h); g.fillStyle = fg; g.textBaseline = 'middle'; g.textAlign = align;
  lines.forEach((l, i) => { g.font = fonts[i] || fonts[fonts.length - 1]; g.fillText(l, align === 'left' ? 8 : w - 8, (h / lines.length) * (i + 0.5)); });
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}

export function buildEquipo(root) {
  const refs = {};
  const grille = grilleTexture(24, 8);
  const negro = M.carcasaOsc.clone(); negro.color.setHex(0x1f2023); negro.roughness = 0.45; negro.clearcoat = 0.35;
  const negroU = M.carcasaOsc.clone(); negroU.color.setHex(0x26272a); negroU.roughness = 0.6;           // unidad de ionización (texturado)
  const blanco = M.carcasa.clone(); blanco.color.setHex(0xf3f4f5); blanco.roughness = 0.3; blanco.clearcoat = 0.6; blanco.clearcoatRoughness = 0.2;
  const cobre = new THREE.MeshPhysicalMaterial({ color: 0xd49c86, metalness: 0.85, roughness: 0.3, clearcoat: 0.4 });
  const grisTr = M.carcasaOsc.clone(); grisTr.color.setHex(0x2d2f33);

  /* ---------------- MUEBLE ---------------- */
  {
    const g = makePart(root, 'chasis', L1([0, 0, 0]));
    g.add(mesh(rbox(XW * 2 - 4, 3, ZF - ZB - 4, 0.5), negro, [0, 8.5, 0]));                       // zócalo negro, retranqueado
    for (const x of [-XW + 7.5, XW - 7.5]) for (const z of [ZB + 10, ZF - 10]) {
      // rueda giratoria y, junto a ella, la pata niveladora
      g.add(mesh(cylX(2.8, 2.2, 28), M.goma, [x, 2.8, z]));
      g.add(mesh(cylX(1.0, 2.6, 16), M.aceroPulido, [x, 2.8, z]));
      for (const s of [-1, 1]) g.add(mesh(box(0.4, 3.2, 3.2), M.plasticoNegro, [x + s * 1.4, 4.4, z]));
      g.add(mesh(rbox(3.4, 1.4, 4.4, 0.3), M.plasticoNegro, [x, 6.3, z]));
      g.add(mesh(cylY(0.6, 6, 16), M.aceroPulido, [x, 4, z + (z > 0 ? -7 : 7)]));
      g.add(mesh(cylY(2, 1, 24), M.goma, [x, 0.5, z + (z > 0 ? -7 : 7)]));
    }
    for (const x of [-XW + 2.5, XW - 2.5]) for (const z of [ZB + 6, ZF - 6]) g.add(mesh(box(3, H - BOT - 0.4, 3), M.aluminio, [x, (H + BOT) / 2, z]));
  }
  {
    const g = makePart(root, 'panel_frontal', L1([0, 0, 40], { shell: true, label: 'equipo' }));
    // placa negra del frontal (en L: deja libre la unidad de ionización y el panel de LED)
    const p1 = new THREE.Shape([[-XW, BOT], [XW, BOT], [XW, 103], [16.2, 103], [16.2, UY0], [-XW, UY0]].map(([x, y]) => new THREE.Vector2(x, y)));
    g.add(mesh(frente(p1, ZF - ZP), negro, [0, 0, ZP]));
    // bloque superior izquierdo, algo más bajo que la unidad, con su contrahuella hasta la tapa
    g.add(mesh(rbox(UX0 - 0.4 + XW, 19.5, 4, 0.5), negro, [(UX0 - 0.4 - XW) / 2, UY0 + 9.75, ZF - 2]));
    g.add(mesh(box(UX0 - 0.4 + XW, H - 141.5, 0.8), negro, [(UX0 - 0.4 - XW) / 2, (H + 141.5) / 2, 58.9]));
    // pilar blanco del borde izquierdo, con el remate superior redondeado
    const b = 0.8, pl = new THREE.Shape();
    pl.moveTo(-XW + b, BOT + b); pl.lineTo(-22 - b, BOT + b); pl.lineTo(-22 - b, 106); pl.quadraticCurveTo(-22 - b, 118.5 - b, -XW + b, 118.5 - b); pl.lineTo(-XW + b, BOT + b);
    g.add(mesh(frente(pl, 3.5, b), blanco, [0, 0, ZF]));
    // gran panel blanco de la derecha: borde superior en curva que baja hasta vertical; franja cobriza por fuera de ese borde
    const borde = new THREE.CurvePath();
    borde.add(new THREE.LineCurve(new THREE.Vector2(XW, 101), new THREE.Vector2(8, 97)));
    borde.add(new THREE.CubicBezierCurve(new THREE.Vector2(8, 97), new THREE.Vector2(-4, 95.4), new THREE.Vector2(-9.5, 87), new THREE.Vector2(-9.5, 68)));
    borde.add(new THREE.LineCurve(new THREE.Vector2(-9.5, 68), new THREE.Vector2(-9.5, BOT)));
    const pts = borde.getSpacedPoints(90);
    const nrm = pts.map((p, i) => { const a = pts[Math.max(0, i - 1)], c = pts[Math.min(pts.length - 1, i + 1)]; const t = c.clone().sub(a).normalize(); return new THREE.Vector2(t.y, -t.x); });
    const ins = pts.map((p, i) => p.clone().addScaledVector(nrm[i], -b));
    const rp = new THREE.Shape([new THREE.Vector2(XW - b, BOT + b), new THREE.Vector2(XW - b, ins[0].y), ...ins.slice(1, -1), new THREE.Vector2(ins[ins.length - 1].x, BOT + b)]);
    g.add(mesh(frente(rp, 3.5, b), blanco, [0, 0, ZF]));
    const fo = pts.map((p, i) => p.clone().addScaledVector(nrm[i], 1.4));
    const cs = new THREE.Shape([...pts.map((p) => p.clone()), ...fo.reverse()]);
    g.add(mesh(frente(cs, 3.2), cobre, [-0.15, 0.15, ZF + 0.12]));                                // separada 1 mm: sin caras coplanares
    // logotipo y rótulo bajo la unidad de ionización
    const zl = ZF + 0.03;
    g.add(mesh(new THREE.PlaneGeometry(11, 1.72), new THREE.MeshStandardMaterial({ map: shimadzuLogo(), roughness: 0.5 }), [0.9, 117.3, zl]));
    g.add(mesh(new THREE.PlaneGeometry(11, 2.6), new THREE.MeshStandardMaterial({ map: rotulo(['LCMS-9050', 'LIQUID CHROMATOGRAPH MASS SPECTROMETER'], 1024, 240, ['700 112px Arial', '500 46px Arial'], '#1f2023', '#e9eaec'), roughness: 0.5 }), [1.3, 111.6, zl]));
    // panel de LED de estado (puerta saliente a la derecha de la unidad)
    g.add(mesh(rbox(XW - 0.2 - 16.2, HT - 103, 3.2, 0.6), negro, [(16.2 + XW - 0.2) / 2, (103 + HT) / 2, ZP + 1.7]));
    const LED = ['POWER', 'VACUUM', 'TEMP', 'READY', 'RUN', 'ERROR'];
    LED.forEach((_, i) => g.add(mesh(box(0.9, 0.26, 0.2), i < 5 ? M.ledVerde : M.plasticoNegro, [31.6, 136 - i * 1.5, ZP + 3.35])));
    g.add(mesh(new THREE.PlaneGeometry(3.6, 9), new THREE.MeshStandardMaterial({ map: rotulo(LED, 128, 320, ['600 22px Arial'], '#1f2023', '#c9ccd0', 'right'), roughness: 0.5 }), [29.2, 132.25, ZP + 3.33]));
  }
  for (const [id, s] of [['panel_izq', -1], ['panel_der', 1]]) {
    // laterales: blanco abajo, franja cobriza y negro arriba (la banda superior negra rodea el mueble)
    const g = makePart(root, id, L1([s * 28, 0, 0], { info: 'carcasa', shell: true }));
    const x = s * (XW - 0.6), L = ZP * 2;
    g.add(mesh(rbox(1.2, 98.8 - BOT, L, 0.4), blanco, [x, (98.8 + BOT) / 2, 0]));
    g.add(mesh(box(1.0, 1.5, L - 0.4), cobre, [s * (XW - 0.5), 99.55, 0]));
    if (s > 0) g.add(mesh(rbox(1.2, H - 100.3, L, 0.4), negro, [x, (H + 100.3) / 2, 0]));
    else {                                                   // a la izquierda, el tramo alto termina detrás del bloque superior izquierdo
      g.add(mesh(rbox(1.2, UY0 - 100.3, L, 0.4), negro, [x, (UY0 + 100.3) / 2, 0]));
      g.add(mesh(rbox(1.2, H - UY0, ZP + 58.3, 0.4), negro, [x, (H + UY0) / 2, (58.3 - ZP) / 2]));
    }
    const gm = blanco.clone(); gm.map = grille; gm.color.setHex(0xffffff); gm.transparent = true; gm.opacity = 0.35;   // rejilla discreta
    g.add(mesh(new THREE.PlaneGeometry(30, 9), gm, [s * (XW + 0.03), 62, -34], [0, s * Math.PI / 2, 0]));
    if (s > 0) g.add(mesh(rbox(0.6, 3.2, 1.8, 0.2), M.plasticoNegro, [XW + 0.3, 30, ZP - 8]));             // interruptor
    screws(g, M.tornillo, M.tornilloNegro, 0.3, s > 0 ? 'x' : '-x', [[s * (XW + 0.02), H - 6, ZB + 5], [s * (XW + 0.02), BOT + 4, ZB + 5]]);
  }
  {
    // tapa superior: escotadura para la unidad de ionización (que sube al despiezar) y para el bloque izquierdo más bajo
    const g = makePart(root, 'tapa_superior', L1([0, 70, 0], { info: 'carcasa', shell: true }));   // sube alto: deja ver el interior desde arriba
    const o = [[-XW - 0.2, ZB - 0.2], [XW + 0.2, ZB - 0.2], [XW + 0.2, ZP - 0.2], [16, ZP - 0.2], [16, UZ0 - 0.2], [UX0 - 0.2, UZ0 - 0.2], [UX0 - 0.2, 58.3], [-XW - 0.2, 58.3]];
    const tg = frente(new THREE.Shape(o.map(([x, z]) => new THREE.Vector2(x, -z))), HT - H);
    g.add(mesh(tg, negro, [0, H, 0], [-Math.PI / 2, 0, 0]));
  }
  {
    const g = makePart(root, 'panel_trasero', L1([0, 0, -40], { info: 'carcasa', shell: true }));
    // panel con tres pasos KF (vacío previo de la 1.ª cámara y de las dos turbos)
    const PY = (H + BOT) / 2;
    g.add(placaPasos(XW * 2 - 2.4, H - BOT, 1.0, KF.map((x) => [x, KY - PY, 1.4]), grisTr, [0, PY, ZB + 0.5], 'xy', 0.4));
    const kf = new THREE.LatheGeometry([[1.0, -1.2], [2.2, -1.2], [2.2, -0.45], [1.35, -0.45], [1.35, 0.45], [2.0, 0.45], [2.0, 1.0], [1.0, 1.0], [1.0, -1.2]]
      .map(([r, y]) => new THREE.Vector2(r, y)), 40);
    kf.rotateX(Math.PI / 2);
    for (const x of KF) {
      g.add(mesh(kf, M.aceroPulido, [x, KY, ZB + 0.5]));
      g.add(mesh(cylZ(0.9, 3.5, 28), M.aceroPulido, [x, KY, ZB - 1.15]));          // manguito pasante hasta el colector
      g.add(mesh(new THREE.TorusGeometry(1.0, 0.24, 8, 24), M.aceroPulido, [x, KY, ZB - 2.2]));
    }
    // colector exterior: une los tres pasos y sale hacia la bomba rotatoria
    g.add(mesh(cylX(1.25, KF[2] - KF[0] + 3.3, 32), M.aceroPulido, [(KF[0] + KF[2]) / 2 + 0.05, KY, ZB - 4]));
    g.add(mesh(new THREE.TorusGeometry(1.35, 0.26, 8, 24), M.aceroPulido, [KF[2] + 1.5, KY, ZB - 4], [0, Math.PI / 2, 0]));
    const plate = new THREE.MeshStandardMaterial({ map: plateTexture(['LCMS-9050', '230 V~ 50/60 Hz 15 A', 'Modelo didáctico', 'Explorador 3D']), metalness: 0.6, roughness: 0.4 });
    g.add(mesh(new THREE.PlaneGeometry(9, 4.5), plate, [10, 70, ZB - 0.03], [0, Math.PI, 0]));
    const gm = grisTr.clone(); gm.map = grille; gm.color.setHex(0x8a8f96);
    g.add(mesh(new THREE.PlaneGeometry(44, 14), gm, [0, 112, ZB - 0.03], [0, Math.PI, 0]));
    g.add(mesh(rbox(4, 3, 1.2, 0.3), M.plasticoNegro, [-16, 26, ZB - 0.6]));
    g.add(mesh(tubePath([[-16, 26, ZB - 1.2], [-16, 26, ZB - 5], [-18, 18, ZB - 10], [-21, 0.7, ZB - 16], [-30, 0.7, ZB - 34]], 0.45, 40, 10), M.cable));
    for (const [x, lbl] of [[0, 'N2'], [6, 'Air'], [12, 'Ar']]) {
      g.add(mesh(cylZ(0.7, 2.4, 24), M.aceroPulido, [x, 40, ZB - 1.2]));
      g.add(mesh(cylZ(0.6, 0.6, 6), M.aceroPulido, [x, 40, ZB + 1.3]));            // tuerca interior
      const t = new THREE.MeshStandardMaterial({ map: textTexture([lbl], { w: 128, h: 64, bg: '#2d2f33', fg: '#e6e8eb', font: '600 40px Segoe UI' }) });
      g.add(mesh(new THREE.PlaneGeometry(2.4, 1.2), t, [x, 37.6, ZB - 0.03], [0, Math.PI, 0]));
    }
  }

  /* ---------------- UNIDAD DE IONIZACIÓN ---------------- */
  {
    // caja negra saliente arriba en el centro del frontal: paredes, techo con paso del PEEK, soporte de la sonda, marco de la
    // ventana y bandeja inferior. Al despiezar sube en vertical: nada del analizador queda por encima de sus placas.
    const g = makePart(root, 'unidad_ionizacion', L1([0, 30, 0], { shell: true, label: 'equipo' }));
    const zc = (UZ0 + UZF - 1) / 2, d = UZF - 1 - UZ0, sp = W(AX.SPRAY.x, 0);
    for (const x of [UX0 + 0.5, UX1 - 0.5]) g.add(mesh(rbox(1, UT - UY0, d, 0.2), negroU, [x, (UT + UY0) / 2, zc]));
    g.add(mesh(rbox(UX1 - UX0 - 2, H - UY0, 1, 0.2), negroU, [UXC, (H + UY0) / 2, UZ0 + 0.5]));
    g.add(placaPasos(UX1 - UX0 - 2, d, UT - H - 0.1, [[sp.x - UXC, sp.z - zc, 0.7]], negroU, [UXC, (H + 0.1 + UT) / 2, zc], 'xz', 0.3));
    g.add(placaPasos(11, 8.5, 1.0, [[sp.x - 1.5, sp.z - 52.75, 3.3]], M.aceroOscuro, [1.5, YH - 0.5, 52.75], 'xz', 0.3));
    g.add(mesh(rbox(UX1 - UX0 - 2, 1, 7.5, 0.2), negroU, [UXC, UY0 + 0.5, UZF - 1 - 3.75]));
    const fr = rrShape(UX1 - UX0, UT - UY0, 0.6), hl = new THREE.Path();
    hl.moveTo(-9.75, -9.6); hl.lineTo(-9.75, 9.6); hl.lineTo(9.75, 9.6); hl.lineTo(9.75, -9.6); hl.lineTo(-9.75, -9.6); fr.holes.push(hl);
    const fg = new THREE.ExtrudeGeometry(fr, { depth: 1, bevelEnabled: false }); fg.translate(0, 0, -0.5);
    g.add(mesh(fg, negroU, [UXC, (UT + UY0) / 2, UZF - 0.5]));
    // colector de entrada de N₂ (nebulizador, calentamiento y secado) en la cara posterior
    g.add(mesh(rbox(4, 3.6, 1.2, 0.2), M.aceroPulido, [-5, 128, UZ0 - 0.6]));
    g.add(mesh(cylZ(0.4, 0.6, 6), M.aceroPulido, [-5, 128, UZ0 - 1.5]));
  }
  {
    const g = makePart(root, 'ventana_fuente', L1([0, 0, 16], { shell: true, label: 'equipo' }));
    const gl = M.vidrio.clone(); gl.color.setHex(0x14171b); gl.opacity = 0.48;                // cristal ahumado
    g.add(mesh(rbox(19.4, 19.1, 0.5, 0.2), gl, [UXC, (UT + UY0) / 2, UZF + 0.25]));
    g.add(mesh(cylZ(1.9, 0.9, 40), M.negroBrillante, [UXC, 140.4, UZF + 0.95]));
    g.add(mesh(new THREE.TorusGeometry(1.9, 0.22, 10, 40), M.aceroOscuro, [UXC, 140.4, UZF + 1.4]));
  }

  /* ---------------- VACÍO ---------------- */
  {
    const g = makePart(root, 'camara_vacio', L1([0, 0, 0], { shell: true, label: 'equipo' }));
    const a = W(AX.CAP0 + 9, 0), b = W(AX.TR_1 + 2, 0);
    g.add(mesh(rbox(12, 12, a.z - b.z, 0.6), M.aluminio, [ORIGEN.x, ORIGEN.y, (a.z + b.z) / 2]));
    const t0 = W(AX.TOF_X0 - 1, 0), t1 = W(AX.TOF_X1 + 1, 0);
    // cámara del TOF algo más estrecha y baja que la principal (sin caras coplanares en el solape)
    g.add(mesh(rbox(11.6, 9.6, t0.z - t1.z, 0.6), M.aluminio, [ORIGEN.x, ORIGEN.y + 0.8, (t0.z + t1.z) / 2]));
    const rp = W(AX.QA_0 + 3, -7.5);
    g.add(mesh(cylY(1.3, 3.4, 32), M.aceroPulido, [rp.x, rp.y + 1.5, rp.z]));
    // paso del gas de colisión (Ar) en la tapa, sobre la entrada de la celda
    const pa = W(AX.C_0 + 2, 6);
    g.add(mesh(cylY(0.5, 1.0, 6), M.aceroPulido, [pa.x, pa.y + 0.4, pa.z]));
  }
  {
    const g = makePart(root, 'bombas_turbo', L1([24, 0, 0], { label: 'equipo' }));
    // turbo de tres entradas bajo la óptica y turbo simple junto al tubo de vuelo
    const y = ORIGEN.y - 17, za = W(AX.UL_0, 0).z, zb = W(AX.C_1, 0).z;
    g.add(mesh(cylZ(5.4, za - zb, 48), M.aluminio, [ORIGEN.x, y, (za + zb) / 2]));
    // entradas: del techo de la turbo hasta la base de la cámara (ligeramente embutidas en ambas)
    for (const lx of [AX.UL_0 + 4, AX.Q_0 + 8, AX.C_0 + 4]) { const p = W(lx, 0); g.add(mesh(cylY(2.2, 7.7, 32), M.aceroPulido, [p.x, ORIGEN.y - 9.75, p.z])); }
    g.add(mesh(rbox(8, 6, 10, 0.5), M.anodizado, [ORIGEN.x, y - 8.3, 4]));            // controlador, bajo la turbo
    g.add(mesh(cylY(1.2, 3.0, 28), M.aceroPulido, [ORIGEN.x, y - 6.7, za - 4.2]));      // salida de vacío previo
    // turbo del TOF: embridada en el costado del tubo de vuelo
    const tz = W(AX.TOF_X1 - 3, 0).z;
    g.add(mesh(cylX(4.2, 12, 40), M.aluminio, [ORIGEN.x + 12, ORIGEN.y - 8, tz]));
    g.add(mesh(cylX(4.6, 1.4, 40), M.aceroOscuro, [ORIGEN.x + 5.1, ORIGEN.y - 8, tz]));
    g.add(mesh(cylX(1.0, 2.5, 28), M.aceroPulido, [ORIGEN.x + 19.2, ORIGEN.y - 9.5, tz]));   // salida de vacío previo
  }
  {
    const g = makePart(root, 'bomba_rotatoria', L1([14, 0, -10], { label: 'equipo' }));
    const cx = 56, cz = -78;
    g.add(mesh(rbox(16, 18, 20, 0.8), M.grisClaro, [cx + 4, 10, cz]));
    g.add(mesh(cylX(9, 20, 48), M.anodizado, [cx - 11, 11, cz]));
    for (let i = 0; i < 10; i++) g.add(mesh(washerX(9.6, 8.8, 0.35), M.anodizado, [cx - 20 + i * 2, 11, cz]));
    g.add(mesh(cylY(1.6, 3.4, 32), M.aceroPulido, [cx + 4, 20.6, cz]));
    for (const x of [cx - 16, cx + 9]) for (const z of [cz - 8, cz + 8]) g.add(mesh(cylY(1.0, 1.0, 16), M.goma, [x, 0.5, z]));
    g.add(mesh(cylY(2.4, 0.6, 32), M.aceroPulido, [cx + 4, 22.4, cz]));               // brida KF de entrada
  }
  {
    // Mangueras KF: 1.ª cámara y salidas de las dos turbos → bajan hasta el zócalo → por el fondo hasta los pasos del panel
    // trasero → colector exterior → bomba rotatoria. Cada tramo sigue a la pieza a la que va unido al desmontar.
    const g = makePart(root, 'linea_vacio', L1([0, 0, 0], { info: 'bomba_rotatoria' }));
    const mat = M.aceroOscuro.clone(); mat.color.setHex(0xb3b8be); mat.roughness = 0.32; mat.roughnessMap = null; mat.bumpMap = ribTexture(160); mat.bumpScale = 3;
    const T = 'bombas_turbo', P = 'panel_trasero', R = 'bomba_rotatoria', C = 'chasis', o = { seg: 160, radial: 12 };
    const rp = W(AX.QA_0 + 3, -7.5), ex = ORIGEN.y - 17 - 8.2, ez = W(AX.UL_0, 0).z - 4.2, tz = W(AX.TOF_X1 - 3, 0).z;
    const fin = (x) => [[x, KY, -50, C], [x, KY, ZB + 2.5, P], [x, KY, ZB + 0.3, P]];
    cableFlex(g, [[rp.x, rp.y - 0.3, rp.z, 'camara_vacio'], [rp.x, rp.y - 4, rp.z], [KF[0], 90, rp.z + 1, C], [KF[0], 40, rp.z, C], [KF[0], KY + 1, rp.z - 6, C], [KF[0], KY, 10, C], ...fin(KF[0])], 0.8, mat, o);
    cableFlex(g, [[ORIGEN.x, ex - 0.05, ez, T], [ORIGEN.x, ex - 4, ez, T], [KF[1], 70, ez + 1, C], [KF[1], 30, ez, C], [KF[1], KY + 1, ez - 6, C], [KF[1], KY, 4, C], ...fin(KF[1])], 0.8, mat, o);
    cableFlex(g, [[ORIGEN.x + 20.5, ORIGEN.y - 9.5, tz, T], [ORIGEN.x + 23, ORIGEN.y - 11, tz - 3, T], [24, 100, -44.5, C], [17, 60, -46, C], [15, 26, -49, C], [KF[2], KY, -54, C], [KF[2], KY, ZB + 2.5, P], [KF[2], KY, ZB + 0.3, P]], 0.8, mat, o);
    cableFlex(g, [[KF[2] + 1.6, KY, ZB - 4, P], [KF[2] + 4.5, KY, ZB - 4, P], [28, 20, ZB - 4.5, P], [40, 27, ZB - 5, P], [50, 31, -71, R], [57, 28.5, -75, R], [60, 26.5, -77.2, R], [60, 22.75, -78, R]], 0.9, mat, o);
  }

  /* ---------------- ELECTRÓNICA ---------------- */
  {
    const g = makePart(root, 'control_termico', L1([30, 0, 0], { label: 'equipo' }));
    g.add(mesh(rbox(12, 26, 18, 0.5), M.anodizado, [20, 60, -30]));
    for (let i = 0; i < 8; i++) g.add(mesh(box(0.6, 0.35, 16), M.aluminio, [26.3, 50 + i * 2.6, -30]));
    // cables a los sensores de temperatura de la camisa del UF-FlightTube (siguen al tubo de vuelo)
    const sx = W(AX.TOF_X1 + 1.2, 0, 3).x + 0.55, sz = W(AX.TOF_X1 + 1.2, 0).z;
    [[50, AX.TOF_Y0 + 18], [60, AX.TOF_Y0 + 45], [70, AX.TOF_Y0 + 72]].forEach(([y0, ly]) => { const yy = ORIGEN.y + ly;
      cableFlex(g, [[13.95, y0, -30], [11, y0 - 0.5, -31.5], [8.5, (y0 + yy) / 2, -37.5], [sx + 0.9, yy, sz - 0.2, 'tubo_vuelo'], [sx - 0.1, yy, sz, 'tubo_vuelo']], 0.18, M.cable, { seg: 48, radial: 8 }); });
  }
  {
    const g = makePart(root, 'electronica', L1([-28, 0, 0], { label: 'equipo' }));
    g.add(mesh(rbox(10, 50, 40, 0.5), M.anodizado, [-23.5, 40, -30]));
    const w = new THREE.MeshStandardMaterial({ map: (() => { const c = document.createElement('canvas'); c.width = 512; c.height = 192; const x = c.getContext('2d');
      x.fillStyle = '#f2c230'; x.fillRect(0, 0, 512, 192); x.fillStyle = '#111'; x.font = 'bold 40px Arial'; x.fillText('PRECAUCIÓN', 40, 80); x.font = '30px Arial'; x.fillText('ALTA TENSIÓN', 40, 140);
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })(), roughness: 0.45 });
    g.add(mesh(new THREE.PlaneGeometry(9, 3.4), w, [-18.45, 52, -30], [0, Math.PI / 2, 0]));
    g.add(mesh(rbox(0.3, 30, 34, 0.06), M.pcb, [-18.3, 30, -30]));
  }
  {
    const g = makePart(root, 'linea_gases', L1([0, 14, 0], { label: 'equipo' }));
    const P = 'panel_trasero', U = 'unidad_ionizacion', C = 'camara_vacio', pa = W(AX.C_0 + 2, 6);
    // N₂: sube por detrás (entre la electrónica y el tubo de vuelo), avanza por encima de la cámara y entra en el colector de la unidad
    cableFlex(g, [[0, 40, ZB + 1.6, P], [0, 40.5, ZB + 3.2, P], [-10, 70, -57], [-12, 120, -54], [-12, 132, -40], [-12, 132, 30], [-9, 130.5, 41, U],
      [-5.5, 128.3, UZ0 - 2.6, U], [-5, 128, UZ0 - 1.85, U]], 0.25, M.ptfe, { seg: 90, radial: 8 });
    // Ar: hasta el paso de la tapa de la cámara, encima de la entrada de la celda de colisión
    cableFlex(g, [[12, 40, ZB + 1.6, P], [12, 40.5, ZB + 3.2, P], [12, 70, -57], [12, 110, -52], [8, 128.5, -40], [3, 129.5, pa.z - 3.5, C],
      [pa.x + 0.4, 128.4, pa.z, C], [pa.x, 127.5, pa.z, C], [pa.x, pa.y + 0.95, pa.z, C]], 0.15, M.cobre, { seg: 90, radial: 8 });
  }

  /* ---------------- NEXERA (contexto) ---------------- */
  {
    // pila Nexera negra sobre su pedestal blanco, a la izquierda del espectrómetro (como en las fotos de producto)
    const g = makePart(root, 'lc', L1([-30, 0, 0], { shell: true, label: 'equipo' }));
    const pc = -68.5, pw = 62, ph = 85, pd = 58;
    g.add(mesh(rbox(pw, ph, pd, 1.2), blanco, [pc, ph / 2, ZF - pd / 2]));
    const nx = M.negroBrillante.clone(); nx.color.setHex(0x1a1b1d);
    const puerta = M.carcasaOsc.clone(); puerta.color.setHex(0x26282c); puerta.roughness = 0.35;
    const D = 50, zc = ZF - D / 2, zf = ZF;
    const pant = (txt, w, h) => new THREE.MeshStandardMaterial({ map: rotulo(txt, 256, Math.round(256 * h / w), ['600 30px Consolas, monospace'], '#0b0d0e', '#d8f3e6'), emissive: 0x223a30, emissiveIntensity: 0.4, roughness: 0.3 });
    const logo = new THREE.MeshStandardMaterial({ map: shimadzuLogo('#b9bcc0', '#26282c'), roughness: 0.5 });
    const L0 = -91, L1x = -63, R0 = -62.6, R1 = -47.6, y0 = ph;
    // columna izquierda: bomba (abajo) y automuestreador (arriba)
    for (const [ya, yb, nm] of [[y0, y0 + 24, 'LC-40D'], [y0 + 24, y0 + 52, 'SIL-40']]) {
      const cx = (L0 + L1x) / 2;
      g.add(mesh(rbox(L1x - L0, yb - ya - 0.4, D, 0.6), nx, [cx, (ya + yb) / 2, zc]));
      g.add(mesh(rbox(L1x - L0 - 2, yb - ya - 2.4, 0.6, 0.3), puerta, [cx, (ya + yb) / 2, zf + 0.25]));
      g.add(mesh(new THREE.PlaneGeometry(6, 2.2), pant([nm, '  0.0 MPa'], 6, 2.2), [L0 + 5, yb - 3.4, zf + 0.58]));
      g.add(mesh(box(0.35, 3, 0.2), M.ledVerde, [L0 + 1.6, yb - 4.4, zf + 0.62]));
      g.add(mesh(new THREE.PlaneGeometry(4.2, 0.66), logo, [L1x - 3.8, ya + 1.9, zf + 0.58]));
    }
    // horno de columnas, estrecho y alto, con su pantalla arriba
    {
      const cx = (R0 + R1) / 2;
      g.add(mesh(rbox(R1 - R0, 51.6, D, 0.6), nx, [cx, y0 + 26, zc]));
      g.add(mesh(rbox(R1 - R0 - 2, 36, 0.6, 0.3), puerta, [cx, y0 + 20, zf + 0.25]));
      g.add(mesh(new THREE.PlaneGeometry(10, 3.6), pant(['SET ACTUAL T.MAX', '40.0  40.0  85'], 10, 3.6), [cx + 0.6, y0 + 46.5, zf + 0.03]));
      g.add(mesh(box(0.35, 4.5, 0.2), M.ledVerde, [R0 + 1.3, y0 + 46, zf + 0.1]));
      g.add(mesh(new THREE.PlaneGeometry(4.2, 0.66), logo, [cx + 2.5, y0 + 1.9, zf + 0.58]));
      g.add(mesh(cylX(0.45, 0.9, 20), M.aceroPulido, [R1 + 0.45, 100, 55]));             // salida de la columna (lateral derecho)
    }
    // bandeja de disolventes con su asa de alambre
    const tcx = (L0 + R1) / 2, tw = R1 - L0;
    g.add(mesh(rbox(tw, 2.4, D - 4, 0.5), nx, [tcx, y0 + 53.2, zc]));
    for (let i = 0; i < 4; i++) { const x = L0 + 6 + i * 10.4;
      g.add(mesh(cylY(3.2, 14, 32), M.vidrio, [x, y0 + 61.4, zc + 2])); g.add(mesh(cylY(3.05, 9, 32), M.disolvente, [x, y0 + 59.05, zc + 2]));
      g.add(mesh(cylY(1.4, 2, 24), M.plasticoNegro, [x, y0 + 69.4, zc + 2])); }
    for (const x of [L0 + 1, R1 - 1]) for (const z of [zc - 20, zc + 20]) g.add(mesh(cylY(0.35, 16, 12), M.aceroPulido, [x, y0 + 62.4, z]));
    for (const z of [zc - 20, zc + 20]) g.add(mesh(cylX(0.35, tw - 2, 12), M.aceroPulido, [tcx, y0 + 70.4, z]));
    for (const x of [L0 + 1, R1 - 1]) g.add(mesh(cylZ(0.35, 40, 12), M.aceroPulido, [x, y0 + 70.4, zc]));
  }
  {
    // PEEK: lateral del horno → por el hueco entre la Nexera y el espectrómetro → por encima del bloque izquierdo → baja por el
    // paso del techo de la unidad de ionización hasta la entrada del cabezal de la sonda
    const g = makePart(root, 'tubo_muestra', L1([0, 0, 0], { info: 'lc' }));
    const U = 'unidad_ionizacion', S = 'sonda_esi', p = W(AX.SPRAY.x, 0), yt = ORIGEN.y + AX.SPRAY.y + 15.95 + 3.4 + 0.55;
    cableFlex(g, [[-46.65, 100, 55, 'lc'], [-46, 100.4, 55, 'lc'], [-43, 106, 60, 'lc'], [-39, 126, 63.4], [-36.5, 144, 63], [-34.5, 147.6, 61.2],
      [-30, 148.2, 60, U], [-15, 148.6, 59.7, U], [-7.5, 148.4, 59.3, U], [-3, 148, 56, U], [p.x - 1, 147.4, p.z + 0.6, U], [p.x, 146.6, p.z, U], [p.x, 145.2, p.z, U], [p.x, yt, p.z, S]], 0.12, M.peekRojo, { seg: 170, radial: 8 });
  }

  refs.analyzer = buildAnalizador(root);

  // los cables flexibles (cableFlex) se recalculan solos al desmontar
  refs.update = () => {};
  return refs;
}
