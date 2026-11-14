// Modo «Imán y sonda»: criostato en corte (cámara de vacío, pantallas, depósitos de nitrógeno y de helio, solenoide de NbTi y
// bobina de apantallamiento activo), bore a temperatura ambiente con el sistema de shim, la sonda introducida desde abajo con su
// bobina de RF en silla de montar y el circuito de sintonía, la muestra y su spinner en el centro magnético, el elevador neumático,
// el preamplificador HPPR/2 junto al imán y los módulos de la consola con todo el cableado de RF, shim, temperatura y aire.
// Coordenadas de mundo (cm). Las capas interiores tienen retirado el cuarto que mira a +x, +z.
import * as THREE from 'three';
import { M } from '../../materials.js';
import { mesh, rbox, box, cylX, cylY, cylZ } from '../../geom.js';
import { makePart, cableFlex } from '../../parts.js';
import { MAG, CAPAS, NIVEL, BOBINA, APANT, CUELLOS_HE, CUELLOS_N2, SHIM, SONDA, BOB_RF, TUBO, SPINNER, ELEV, HPPR, CONS, MODULOS,
  PC_RED, XC, torno, tapas, vaso, anillo, lienzo } from './geometria.js';

const L2 = (offset, label = true, extra = {}) => ({ level: 2, offset, mode: 'analizador', label: label ? 'analizador' : null, ...extra });
const dbl = (m, extra = {}) => { const c = m.clone(); c.side = THREE.DoubleSide; Object.assign(c, extra); return c; };
const corte = (hex, extra = {}) => new THREE.MeshStandardMaterial({ color: hex, roughness: 0.6, metalness: 0.2, side: THREE.DoubleSide, ...extra });

/** Bobina en silla de montar: dos espiras rectangulares curvadas sobre un cilindro de radio r, de 120° cada una. */
function silla(r, h, rw, rot = 0) {
  const pts = [], a = (60 * Math.PI) / 180, y0 = -h / 2, y1 = h / 2;
  for (const c of [0, Math.PI]) {
    const lado = [];
    for (let i = 0; i <= 16; i++) { const t = c - a + (2 * a * i) / 16; lado.push([t, y1]); }
    for (let i = 1; i < 8; i++) lado.push([c + a, y1 - (h * i) / 8]);
    for (let i = 0; i <= 16; i++) { const t = c + a - (2 * a * i) / 16; lado.push([t, y0]); }
    for (let i = 1; i < 8; i++) lado.push([c - a, y0 + (h * i) / 8]);
    pts.push(...lado.map(([t, y]) => new THREE.Vector3(r * Math.sin(t + rot), y, r * Math.cos(t + rot))));
  }
  // las dos espiras se recorren como un único circuito cerrado (la unión entre ambas queda en la vertical común)
  const tube = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true, 'catmullrom', 0.1), 360, rw, 6, true);
  const g = new THREE.BufferGeometry(); g.copy(tube); return g;   // tipo genérico: no es un cable para el inspector
}

export function buildAnalizador(root) {
  const refs = { root };
  const Y = MAG.YC;

  /* ================= CRIOSTATO EN CORTE ================= */
  {
    const g = makePart(root, 'camara_vacio', L2([0, 0, 0], true, { shell: true, onlyAnalyzer: true }));
    vaso(g, CAPAS.ovc, dbl(M.acero), corte(0x8d949c), { seg: 96 });
  }
  {
    const g = makePart(root, 'escudo_n2', L2([0, 0, 0], false, { info: 'escudos', shell: true }));
    const mt = dbl(M.aluminio); mt.color.setHex(0xc9b48a);           // pantalla térmica envuelta en superaislante aluminizado
    vaso(g, CAPAS.escudoN2, mt, corte(0xb59a6a));
  }
  {
    const g = makePart(root, 'deposito_n2', L2([0, 0, 0], true, { shell: true }));
    vaso(g, CAPAS.depositoN2, dbl(M.acero), corte(0x7f8790));
    const [ri, ro, y0, , t] = CAPAS.depositoN2;
    const n2 = new THREE.MeshStandardMaterial({ color: 0xb9c6ff, roughness: 0.1, transparent: true, opacity: 0.38, depthWrite: false, side: THREE.DoubleSide });
    anillo(g, ri + t + 0.05, ro - t - 0.05, y0 + t + 0.05, NIVEL.N2, n2, n2);
  }
  {
    const g = makePart(root, 'escudo_he', L2([0, 0, 0], false, { info: 'escudos', shell: true }));
    const mt = dbl(M.aluminio); mt.color.setHex(0xd6d9de);
    vaso(g, CAPAS.escudoHe, mt, corte(0xaab0b8));
  }
  {
    const g = makePart(root, 'deposito_he', L2([0, 0, 0], true, { shell: true }));
    vaso(g, CAPAS.depositoHe, dbl(M.acero), corte(0x6f7882));
    const [ri, ro, y0, , t] = CAPAS.depositoHe;
    const he = new THREE.MeshStandardMaterial({ color: 0x9fe3ff, roughness: 0.1, transparent: true, opacity: 0.3, depthWrite: false, side: THREE.DoubleSide });
    // el líquido rodea las bobinas: se dibuja en anillos que dejan libre su volumen (y el de sus bridas)
    const ya = BOBINA.y0 - 1.2, yb = BOBINA.y1 + 1.2;
    anillo(g, ri + t + 0.05, ro - t - 0.05, y0 + t + 0.05, ya, he, he);
    anillo(g, ri + t + 0.05, ro - t - 0.05, yb, NIVEL.He, he, he);
    anillo(g, BOBINA.ro + 0.8, APANT.ri - 0.5, ya, yb, he, he);
    anillo(g, APANT.ro + 0.6, ro - t - 0.05, ya, yb, he, he);
    // sensor de nivel de helio (hilo superconductor vertical bajo un cuello)
    const [x, z] = CUELLOS_HE[1];
    g.add(mesh(cylY(0.18, 80, 12), M.aceroOscuro, [x, 70.6 + 40, z]));
  }
  {
    const g = makePart(root, 'bobina', L2([0, 0, 0]));
    // solenoide de varias secciones: hilo de NbTi en matriz de cobre (vueltas como textura)
    const vueltas = lienzo(64, 512, (c, w, h) => { c.fillStyle = '#b26b3a'; c.fillRect(0, 0, w, h);
      for (let i = 0; i < h; i += 4) { c.fillStyle = i % 8 ? '#8f522a' : '#d08a55'; c.fillRect(0, i, w, 1.6); } });
    vueltas.wrapS = vueltas.wrapT = THREE.RepeatWrapping; vueltas.repeat.set(1, 6);
    const cu = dbl(M.cobre, { map: vueltas, roughness: 0.45 });
    const capas = lienzo(256, 256, (c, w, h) => { c.fillStyle = '#9a5a2e'; c.fillRect(0, 0, w, h);
      for (let i = 0; i < w; i += 6) { c.fillStyle = '#c27c48'; c.fillRect(i, 0, 3, h); } c.fillStyle = '#3d3226'; for (const x of [84, 170]) c.fillRect(x, 0, 5, h); });
    const sec = corte(0xb87342, { map: capas });
    anillo(g, BOBINA.ri, BOBINA.ro, BOBINA.y0, BOBINA.y1, cu, sec);
    // carrete (mandril) de soporte y bridas
    const fm = dbl(M.aceroOscuro);
    g.add(new THREE.Mesh(torno([[BOBINA.ri - 0.35, BOBINA.y0 - 1], [BOBINA.ri - 0.35, BOBINA.y1 + 1]]), fm));
    for (const y of [BOBINA.y0 - 1, BOBINA.y1]) anillo(g, BOBINA.ri - 0.35, BOBINA.ro + 0.6, y, y + 1, fm, corte(0x5c636c));
  }
  {
    const g = makePart(root, 'bobina_apant', L2([0, 0, 0]));
    const cu = dbl(M.cobre); cu.color.setHex(0xa8683c);
    anillo(g, APANT.ri, APANT.ro, APANT.y0, APANT.y1, cu, corte(0x9a5a2e));
    for (const y of [APANT.y0 - 0.8, APANT.y1]) anillo(g, APANT.ri - 0.3, APANT.ro + 0.4, y, y + 0.8, dbl(M.aceroOscuro), corte(0x5c636c));
  }
  {
    // interruptor superconductor de modo persistente, sobre la brida superior de la bobina
    const g = makePart(root, 'interruptor', L2([0, 0, 0], false));
    const x = -6.5, z = -6.5, y = BOBINA.y1 + 1 + 1.3;
    g.add(mesh(rbox(3.2, 2.6, 2.2, 0.3), M.aceroOscuro, [x, y, z], [0, Math.PI / 4, 0]));
    g.add(mesh(rbox(2.2, 0.6, 1.4, 0.2), M.cobre, [x, y + 1.6, z], [0, Math.PI / 4, 0]));
  }
  {
    // cuellos: del depósito de helio y del de nitrógeno a las torretas de la tapa
    const g = makePart(root, 'cuellos', L2([0, 0, 0], true));
    const yHe = CAPAS.depositoHe[3], yN2 = CAPAS.depositoN2[3];
    for (const [x, z] of CUELLOS_HE) g.add(new THREE.Mesh(torno([[1.2, yHe], [1.2, MAG.Y1]], { phi0: 0, phiL: Math.PI * 2, seg: 32 }).translate(x, 0, z), dbl(M.aceroPulido)));
    for (const [x, z] of CUELLOS_N2) g.add(new THREE.Mesh(torno([[0.9, yN2], [0.9, MAG.Y1]], { phi0: 0, phiL: Math.PI * 2, seg: 32 }).translate(x, 0, z), dbl(M.aceroPulido)));
  }

  /* ================= INSERCIONES DEL BORE ================= */
  {
    // sistema de shim: tubo de bobinas de corrección a temperatura ambiente, introducido desde abajo, con brida y conector
    const g = makePart(root, 'shims', L2([0, -15, 0]));
    const pat = lienzo(512, 512, (c, w, h) => {
      c.fillStyle = '#c9c19a'; c.fillRect(0, 0, w, h);
      c.strokeStyle = '#b06a32'; c.lineWidth = 5;
      for (let k = 0; k < 6; k++) { const y = 70 + k * 64; c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); }
      c.lineWidth = 4;
      for (let k = 0; k < 4; k++) { const x0 = k * 128 + 14; c.strokeRect(x0, 120, 100, 110); c.strokeRect(x0 + 10, 300, 80, 120); }
    });
    const tubo = dbl(M.ptfe, { map: pat, roughness: 0.55 });
    const loop = [[SHIM.ri, SHIM.y0], [SHIM.ro, SHIM.y0], [SHIM.ro, SHIM.y1], [SHIM.ri, SHIM.y1], [SHIM.ri, SHIM.y0]];
    g.add(new THREE.Mesh(torno(loop), tubo));
    for (const m of tapas(loop, [], corte(0xb7ad84))) g.add(m);
    const [rb, b0, b1] = SHIM.brida;
    const s = new THREE.Shape(); s.absarc(0, 0, rb, 0, Math.PI * 2, false);
    const h = new THREE.Path(); h.absarc(0, 0, SHIM.ri, 0, Math.PI * 2, true); s.holes.push(h);
    const fg = new THREE.ExtrudeGeometry(s, { depth: b1 - b0, bevelEnabled: false, curveSegments: 48 });
    g.add(mesh(fg, M.aluminio, [0, b0, 0], [-Math.PI / 2, 0, 0]));
    g.add(mesh(cylY(1.2, 2.4, 24), M.plasticoNegro, [-7.2, b0 - 1.2, 0]));        // conector del cable de shim
    refs.shimConector = [-7.2, b0 - 2.4, 0];
  }
  {
    // elevador neumático: tubo superior con la turbina del spinner abajo y el collar de entrada de la muestra arriba
    const g = makePart(root, 'elevador', L2([0, 25, 0]));
    const loop = [[ELEV.ri, ELEV.y0], [ELEV.ro, ELEV.y0], [ELEV.ro, ELEV.collar[1]], [ELEV.ri, ELEV.collar[1]], [ELEV.ri, ELEV.y0]];
    g.add(new THREE.Mesh(torno(loop), dbl(M.aluminio)));
    for (const m of tapas(loop, [], corte(0x9aa1aa))) g.add(m);
    const [rt0, t0, t1] = ELEV.turbina;
    anillo(g, rt0, ELEV.ro, t0, t1, dbl(M.peekBeige), corte(0xb49a72));
    // collar fuera del imán (vuelta completa) y boquilla del aire de elevación y giro
    const [rc, c0, c1] = ELEV.collar;
    anillo(g, ELEV.ri, rc, c0, c1, dbl(M.anodizado), null, { phi0: 0, phiL: Math.PI * 2 });
    anillo(g, MAG.BORE + 0.05, 5, MAG.Y1 + 0.05, MAG.Y1 + 1, dbl(M.aceroPulido), null, { phi0: 0, phiL: Math.PI * 2 });
    g.add(new THREE.Mesh(torno([[ELEV.ro, MAG.Y1 + 1], [ELEV.ro, c0]], { phi0: 0, phiL: Math.PI * 2 }), dbl(M.aluminio)));
    g.add(mesh(cylX(0.55, 2.2, 16), M.aceroPulido, [rc + 1.0, 165, 0]));
    refs.boquilla = [rc + 2.1, 165, 0];
  }
  {
    // sonda de 5 mm a temperatura ambiente: cabeza en corte, tubo y base con conectores bajo el imán
    const g = makePart(root, 'sonda', L2([0, -45, 0], true, { shell: false }));
    const r = SONDA.r, ri = r - 0.2, y0 = SONDA.yCab, y1 = SONDA.y1;
    const loop = [[ri, y0], [r, y0], [r, y1], [0.3, y1], [0.3, y1 - 0.25], [ri, y1 - 0.25], [ri, y0]];
    const cab = new THREE.Mesh(torno(loop), dbl(M.aceroPulido)); g.add(cab);
    for (const m of tapas(loop, [], corte(0x9aa1aa))) g.add(m);
    refs.cabezaSonda = cab;
    g.add(mesh(cylY(r, y0 - SONDA.y0, 48), M.aceroPulido, [0, (SONDA.y0 + y0) / 2, 0]));
    const B = SONDA.base, yb = B.y0 + B.h / 2;
    g.add(mesh(rbox(B.w, B.h, B.w, 1.2), M.anodizado, [0, yb, 0]));
    // conectores de RF (¹H, X, ²H) hacia el preamplificador, en la cara +x
    refs.conSonda = [];
    [50, 45.5, 41].forEach((y) => { g.add(mesh(cylX(0.7, 1.8, 20), M.aceroPulido, [B.w / 2 + 0.9, y, 0])); refs.conSonda.push([B.w / 2 + 1.8, y, 0]); });
    const et = new THREE.MeshStandardMaterial({ map: lienzo(256, 512, (c, w, h) => { c.fillStyle = '#2a2f36'; c.fillRect(0, 0, w, h); c.fillStyle = '#e8edf2';
      c.font = '700 44px Segoe UI'; c.textAlign = 'center'; [['¹H', 74], ['X', 232], ['²H', 390]].forEach(([s, y]) => c.fillText(s, 128, y)); }), roughness: 0.5 });
    g.add(mesh(new THREE.PlaneGeometry(2.4, 12), et, [B.w / 2 + 0.02, 45.5, 2.4], [0, Math.PI / 2, 0]));
    // calefactor y termopar (cara −z) y entrada del gas de temperatura variable (abajo)
    g.add(mesh(cylZ(0.6, 1.6, 16), M.plasticoNegro, [0, 46, -B.w / 2 - 0.8]));
    refs.conTermopar = [0, 46, -B.w / 2 - 1.6];
    g.add(mesh(cylY(0.8, 2.4, 20), M.aceroPulido, [0, B.y0 - 1.2, 2.5]));
    refs.entradaVT = [0, B.y0 - 2.4, 2.5];
    // varillas de sintonía y adaptación (T, M) que salen por la base
    for (const [x, z, col] of [[-3, -2.5, M.peekRojo], [-3, 1, M.peekRojo], [3, -2.5, M.condensador], [3, 1, M.condensador]]) g.add(mesh(cylY(0.45, 1.6, 16), col, [x, B.y0 - 0.8, z]));
    const pl = new THREE.MeshStandardMaterial({ map: lienzo(512, 256, (c) => { c.fillStyle = '#d8dce1'; c.fillRect(0, 0, 512, 256); c.fillStyle = '#1d2a3c'; c.font = '700 54px Segoe UI'; c.fillText('BBO 400 MHz', 26, 90);
      c.font = '40px Segoe UI'; c.fillText('5 mm · ¹H / BB / ²H', 26, 160); c.fillText('Z-GRD', 26, 220); }), roughness: 0.5 });
    g.add(mesh(new THREE.PlaneGeometry(8, 4), pl, [0, yb + 4, B.w / 2 + 0.02]));
  }
  {
    // bobinas de RF en silla de montar (dos coaxiales, giradas 90°) y soporte de vidrio
    const g = makePart(root, 'bobina_rf', L2([0, -45, 0]));
    const cu = M.cobre.clone(); cu.emissive = new THREE.Color(0x000000); cu.emissiveIntensity = 0;
    const cu2 = cu.clone(); cu2.color.setHex(0xd9a066);
    const b1 = mesh(silla(BOB_RF.r1, BOB_RF.h1, 0.045), cu, [0, Y, 0]);
    const b2 = mesh(silla(BOB_RF.r2, BOB_RF.h2, 0.05, Math.PI / 2), cu2, [0, Y, 0]);
    g.add(b1, b2);
    refs.bobinasRF = [b1, b2];
    const q = dbl(M.cuarzo); q.opacity = 0.25;
    g.add(new THREE.Mesh(torno([[0.295, 98], [0.295, SONDA.y1 - 0.3]], { phi0: 0, phiL: Math.PI * 2, seg: 40 }), q));
    g.add(new THREE.Mesh(torno([[0.65, 99.5], [0.65, 108.4 - 1.5]], { phi0: 0, phiL: Math.PI * 2, seg: 40 }), q));
  }
  {
    // circuito de sintonía y adaptación: condensadores en la parte baja de la cabeza de la sonda
    const g = makePart(root, 'sintonia', L2([0, -45, 0]));
    g.add(mesh(box(2.2, 0.25, 2.2), M.pcb, [0, 90, 0]));
    for (const [x, z] of [[-0.75, -0.75], [0.75, -0.75], [-0.75, 0.75]]) {
      g.add(mesh(cylY(0.3, 2.4, 20), M.ceramica, [x, 91.5, z]));
      g.add(mesh(cylY(0.32, 0.4, 20), M.aceroPulido, [x, 92.9, z]));
    }
    for (const x of [-0.45, 0.45]) g.add(mesh(cylY(0.05, 9.6, 8), M.cobre, [x, 98.0, 0]));
  }
  {
    // tubo de 5 mm con 4 cm de disolución centrada en la bobina
    const g = makePart(root, 'muestra', L2([0, 62, 0]));
    const vid = dbl(M.vidrio); vid.opacity = 0.42;
    const prof = [[0.01, TUBO.y0], [0.15, TUBO.y0 + 0.03], [TUBO.r, TUBO.y0 + 0.22], [TUBO.r, TUBO.y1]];
    g.add(mesh(new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), 32), vid));
    const liq = new THREE.MeshPhysicalMaterial({ color: 0xfff4d6, roughness: 0.05, transparent: true, opacity: 0.6, depthWrite: false });
    const [l0, l1] = TUBO.liq;
    g.add(mesh(new THREE.LatheGeometry([[0.01, l0], [0.12, l0 + 0.03], [TUBO.ri, l0 + 0.2], [TUBO.ri, l1], [0.01, l1 - 0.06]].map(([r, y]) => new THREE.Vector2(r, y)), 32), liq));
    g.add(mesh(cylY(TUBO.r + 0.03, 1.1, 24), M.peekBeige, [0, TUBO.y1 - 0.4, 0]));      // tapón
    refs.muestraY = (l0 + l1) / 2;
  }
  {
    // spinner (rotor) que sostiene el tubo en la turbina; se coloca a la profundidad fijada con el medidor
    const g = makePart(root, 'spinner', L2([0, 45, 0]));
    const { r, y0, y1 } = SPINNER;
    const prof = [[TUBO.r + 0.02, y0], [r - 0.15, y0], [r, y0 + 0.4], [r, y1 - 0.3], [r - 0.1, y1], [TUBO.r + 0.02, y1]];
    const az = new THREE.MeshPhysicalMaterial({ color: 0x2f5fa8, roughness: 0.35, clearcoat: 0.4 });
    const bl = new THREE.MeshPhysicalMaterial({ color: 0xeeeeea, roughness: 0.4 });
    g.add(mesh(new THREE.LatheGeometry(prof.slice(0, 4).map(([a, b]) => new THREE.Vector2(a, b)), 40), bl));
    g.add(mesh(new THREE.LatheGeometry(prof.slice(3).map(([a, b]) => new THREE.Vector2(a, b)), 40), az));
    g.add(mesh(new THREE.TorusGeometry(r - 0.05, 0.07, 8, 40), M.goma, [0, y0 + 1.4, 0], [Math.PI / 2, 0, 0]));
  }

  /* ================= PREAMPLIFICADOR HPPR/2 ================= */
  {
    const g = makePart(root, 'hppr', L2([28, 0, 18], true, { info: 'preamplificador' }));
    const { x0, x1, z0, z1 } = HPPR, xc = (x0 + x1) / 2, zc = (z0 + z1) / 2;
    const blanco = M.grisClaro.clone(); blanco.color.setHex(0xe9ebee);
    const mods = [[6.3, 14.3, '²H · lock'], [14.6, 22.6, 'X-BB'], [22.9, 30.9, '¹H / ¹⁹F'], [31.2, 40, 'HPPR/2']];
    refs.conHpprF = []; refs.conHpprB = [];
    mods.forEach(([a, b, nom], i) => {
      g.add(mesh(rbox(x1 - x0, b - a, z1 - z0, 0.6), i === 3 ? blanco : M.carcasa, [xc, (a + b) / 2, zc]));
      const tx = lienzo(512, 160, (c) => { c.fillStyle = i === 3 ? '#1f3e6e' : '#dfe3e8'; c.fillRect(0, 0, 512, 160); c.fillStyle = i === 3 ? '#fff' : '#22344f';
        c.font = '700 42px Segoe UI'; c.textBaseline = 'middle'; c.fillText(nom, 26, 82); if (i === 3) { c.fillStyle = '#5be07f'; for (let k = 0; k < 4; k++) { c.beginPath(); c.arc(360 + k * 34, 82, 9, 0, 7); c.fill(); } } });
      g.add(mesh(new THREE.PlaneGeometry(x1 - x0 - 2, b - a - 2), new THREE.MeshStandardMaterial({ map: tx, roughness: 0.5 }), [xc, (a + b) / 2, z1 + 0.02]));
      if (i < 3) {
        const y = (a + b) / 2;
        g.add(mesh(cylZ(0.8, 1.8, 20), M.aceroPulido, [x1 - 3.5, y, z1 + 0.9])); refs.conHpprF.push([x1 - 3.5, y, z1 + 1.8]);
      }
      const y = (a + b) / 2;
      g.add(mesh(cylZ(0.8, 1.8, 20), M.aceroPulido, [x0 + 5 + i * 4, y, z0 - 0.9])); refs.conHpprB.push([x0 + 5 + i * 4, y, z0 - 1.8]);
    });
    for (const x of [x0 + 2, x1 - 2]) for (const z of [z0 + 2, z1 - 2]) g.add(mesh(cylY(0.9, 6.3, 16), M.plasticoNegro, [x, 3.15, z]));
  }

  /* ================= CONSOLA: MÓDULOS ================= */
  const { mx0, mx1, mz0, mz1 } = CONS, mzc = (mz0 + mz1) / 2;
  {
    // bastidor interior (cuatro postes y carriles)
    const g = makePart(root, 'bastidor', L2([0, 0, 0], false, { info: 'consola' }));
    for (const x of [mx0 - 1.2, mx1 + 1.2]) for (const z of [mz0 - 1.2, mz1 + 1.2]) g.add(mesh(box(2, 130, 2), M.aluminio, [x, CONS.y0 + 65, z]));
    for (const a of new Set(Object.values(MODULOS).map((m) => m[0]))) for (const x of [mx0 - 0.4, mx1 + 0.4]) g.add(mesh(box(0.6, 0.8, mz1 - mz0 - 1), M.aceroOscuro, [x, a - 0.6, mzc]));
  }
  const frente = (nom, sub, color, leds = 0, ancho = mx1 - mx0) => lienzo(1024, 256, (c) => {
    c.fillStyle = color; c.fillRect(0, 0, 1024, 256); c.fillStyle = '#ffffff'; c.globalAlpha = 0.9;
    c.font = '700 60px Segoe UI'; c.textBaseline = 'middle'; c.fillText(nom, 40, 90); c.font = '40px Segoe UI'; c.globalAlpha = 0.7; c.fillText(sub, 40, 170); c.globalAlpha = 1;
    for (let k = 0; k < leds; k++) { c.fillStyle = k % 3 === 2 ? '#ffb21a' : '#5be07f'; c.beginPath(); c.arc(1024 - 60 - k * 38, 90, 10, 0, 7); c.fill(); }
    void ancho;
  });
  const modulo = (id, x0, x1, [a, b], nom, sub, color, dz, leds = 3, extra = {}) => {
    const g = makePart(root, id, L2([0, 0, dz], true, extra));
    const xc = (x0 + x1) / 2, yc = (a + b) / 2;
    g.add(mesh(rbox(x1 - x0, b - a, mz1 - mz0, 0.5), M.anodizado, [xc, yc, mzc]));
    g.add(mesh(new THREE.PlaneGeometry(x1 - x0 - 1.4, b - a - 1.4), new THREE.MeshStandardMaterial({ map: frente(nom, sub, color, leds), roughness: 0.45 }), [xc, yc, mz1 + 0.02]));
    return g;
  };
  const conTras = (g, x0, y) => { const x = XC(x0); g.add(mesh(cylZ(0.7, 1.6, 16), M.aceroPulido, [x, y, mz0 - 0.8])); return [x, y, mz0 - 1.6]; };
  refs.con = {};
  modulo('fuente', mx0, mx1, MODULOS.fuente, 'Alimentación', 'distribución y fuentes de los módulos', '#3a4350', 20, 2);
  {
    const g = modulo('amplificadores', mx0, mx1, MODULOS.amplificadores, 'Amplificadores de RF', 'lineales · canal ¹H/¹⁹F y canal X (banda ancha)', '#22385a', 35, 4);
    refs.con.ampH = conTras(g, 204, 50); refs.con.ampX = conTras(g, 210, 44); refs.con.ampIn = conTras(g, 226, 52);
  }
  {
    const g = makePart(root, 'transceptores', L2([0, 0, 50]));
    const [a, b] = MODULOS.transceptores, xc = (mx0 + mx1) / 2, yc = (a + b) / 2;
    g.add(mesh(rbox(mx1 - mx0, b - a, mz1 - mz0, 0.5), M.anodizado, [xc, yc, mzc]));
    // tres tarjetas TRX (una por canal) vistas de frente
    const ancho = (mx1 - mx0 - 4) / 3;
    ['TRX 1 · ¹H', 'TRX 2 · X', 'TRX 3'].forEach((nom, i) => {
      const tx = lienzo(256, 512, (c) => { c.fillStyle = '#1d3f73'; c.fillRect(0, 0, 256, 512); c.fillStyle = '#fff'; c.font = '700 34px Segoe UI'; c.fillText('TRX1200', 22, 60);
        c.font = '28px Segoe UI'; c.fillText(nom.replace('TRX ', 'Canal '), 22, 104); c.fillStyle = '#5be07f'; for (let k = 0; k < 3; k++) { c.beginPath(); c.arc(40 + k * 34, 160, 9, 0, 7); c.fill(); }
        c.fillStyle = '#c8ced6'; for (const y of [250, 330, 410]) { c.beginPath(); c.arc(128, y, 22, 0, 7); c.fill(); } });
      g.add(mesh(new THREE.PlaneGeometry(ancho - 0.6, b - a - 2), new THREE.MeshStandardMaterial({ map: tx, roughness: 0.45 }), [mx0 + 2 + ancho * (i + 0.5), yc, mz1 + 0.02]));
    });
    refs.con.trxRx = conTras(g, 216, 72); refs.con.trxOut = conTras(g, 226, 62);
  }
  {
    const g = modulo('bsms', mx0, XC(230), MODULOS.bsms, 'BSMS/2', 'corrientes de shim · neumática', '#2b3440', 35, 3);
    refs.con.shim = conTras(g, 200, 92); refs.con.aire = conTras(g, 222, 100);
  }
  {
    const g = modulo('lock', XC(231), mx1, MODULOS.lock, 'Lock ²H', '', '#1d3f73', 35, 2);
    refs.con.lock = conTras(g, 238, 97);
  }
  {
    const g = modulo('vtu', mx0, mx1, MODULOS.vtu, 'Unidad de temperatura', 'gas de la sonda · calefactor · termopar', '#3a4350', 25, 2);
    refs.con.vt = conTras(g, 228, 114); refs.con.termopar = conTras(g, 234, 111);
  }
  {
    const g = modulo('servidor', mx0, mx1, MODULOS.servidor, 'Servidor de adquisición', 'integrado · red con la estación de trabajo', '#22385a', 15, 3);
    refs.con.red = conTras(g, 242, 128); refs.con.sc = conTras(g, 236, 131);
  }

  /* ================= CABLEADO ================= */
  {
    const g = makePart(root, 'cableado', L2([0, 0, 0], false));
    const coax = M.cable.clone(); coax.color.setHex(0x30343a);
    const azul = M.cable.clone(); azul.color.setHex(0x2f5d9a);
    const S = 'sonda', H = 'hppr', SH = 'shims', E = 'elevador';
    /** Tramo final dentro de la consola: entra por debajo, sube por detrás de los módulos y llega al conector trasero. */
    const enConsola = ([x, y, z], mod) => [[x, 0.9, -48], [x, 2.6, -78], [x, 5, -89], [x, y - 5, -89], [x, y, -88.4, mod], [x, y, z, mod]];
    // preamplificador → sonda (¹H, X, ²H)
    refs.cableRF = [];
    refs.conHpprF.forEach(([x, y, z], i) => {
      const [xs, ys, zs] = refs.conSonda[2 - i];
      refs.cableRF.push(cableFlex(g, [[x, y, z, H], [x, y, z + 3.5, H], [44, 24 + i * 2, 44 + i], [24, 34 + i * 4, 15 - i], [xs + 5, ys, zs + (i - 1) * 0.5, S], [xs + 1.5, ys, zs, S], [xs, ys, zs, S]], 0.32, coax, { seg: 120 }));
    });
    // preamplificador → consola: transmisión ¹H y X desde los amplificadores, señal recibida al transceptor, lock
    const dest = [[refs.con.lock, 'lock'], [refs.con.ampX, 'amplificadores'], [refs.con.ampH, 'amplificadores'], [refs.con.trxRx, 'transceptores']];
    refs.cableConsola = [];
    refs.conHpprB.forEach(([x, y, z], i) => {
      const [p, mod] = dest[i];
      refs.cableConsola.push(cableFlex(g, [[x, y, z, H], [x, y, z - 3, H], [x + 1, 6, 6, H], [x + 3, 0.9, 2], [120, 0.9, -24 - i * 2.5], ...enConsola(p, mod)], 0.4, coax, { seg: 200 }));
    });
    // conexiones internas de la consola: transceptor → amplificadores
    cableFlex(g, [[...refs.con.trxOut, 'transceptores'], [XC(226), 62, -88.6], [XC(227.5), 57, -90], [XC(226), 52, -88.6], [...refs.con.ampIn, 'amplificadores']], 0.35, coax);
    // cable de shim: conector de la brida → suelo → BSMS
    {
      const [x, y, z] = refs.shimConector;
      cableFlex(g, [[x, y, z, SH], [x, y - 3, z, SH], [x - 3, 30, z + 2], [-12, 0.8, 0], [-6, 0.8, -40], [100, 0.8, -60], ...enConsola(refs.con.shim, 'bsms')], 0.5, M.cableGris, { seg: 220 });
    }
    // gas de temperatura variable (sonda) y cable del calefactor y el termopar
    {
      const [x, y, z] = refs.entradaVT;
      cableFlex(g, [[x, y, z, S], [x, y - 3, z, S], [2, 14, 6, S], [10, 0.9, -24], [100, 0.9, -57], ...enConsola(refs.con.vt, 'vtu')], 0.6, M.ptfe, { seg: 220 });
      const [a, b, c] = refs.conTermopar;
      cableFlex(g, [[a, b, c, S], [a, b - 1, c - 3, S], [6, 20, -22], [16, 0.6, -40], [100, 0.6, -64], ...enConsola(refs.con.termopar, 'vtu')], 0.3, M.cable, { seg: 220 });
    }
    // aire de elevación y giro: BSMS → suelo → sube por el costado del imán → collar del elevador
    {
      const [bx, by, bz] = refs.boquilla;
      const p = [[bx, by, bz, E], [bx + 2.5, by - 0.3, bz - 0.4, E], [9, 162.6, -2], [16, 161.5, -6.5], [28, 161.5, -12.6], [33.4, 160.9, -14.4], [35.4, 158.5, -15.3],
        [32.6, 130, -15.2], [32.6, 70, -15.2], [33.5, 40, -16], [36, 4, -18], [42, 0.7, -21], [100, 0.7, -50], ...enConsola(refs.con.aire, 'bsms').slice(0)];
      refs.manguera = cableFlex(g, p, 0.4, azul, { seg: 320 });
    }
  }
  refs.enConsola = ([x, y, z], mod) => [[x, 0.9, -48, mod], [x, 2.6, -78, mod], [x, 5, -89, mod], [x, y - 5, -89, mod], [x, y, -88.4, mod], [x, y, z, mod]];

  return refs;
}
