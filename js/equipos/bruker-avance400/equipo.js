// Instalación completa de un Bruker AVANCE NEO 400: imán Ascend 400 (bore estándar de 54 mm) sobre su soporte con tres patas y
// amortiguadores, torretas de helio y de nitrógeno en la tapa, cambiador SampleCase sobre el imán, preamplificador HPPR/2 junto al
// soporte, armario de la consola AVANCE NEO y puesto de control con TopSpin. Coordenadas de mundo en cm; eje del imán en x = z = 0.
// Bruker no publica las dimensiones exteriores del criostato ni del armario: tamaños y posiciones relativas son aproximados.
import * as THREE from 'three';
import { M } from '../../materials.js';
import { mesh, rbox, box, cylX, cylY, cylZ, grilleTexture, screenTexture, plateTexture, warningTexture } from '../../geom.js';
import { makePart, cableFlex } from '../../parts.js';
import { buildAnalizador } from './analizador.js';
import { MAG, CUELLOS_HE, CUELLOS_N2, SOPORTE, pataXZ, CONS, MESA, PC, PC_RED, lienzo, logoBruker } from './geometria.js';

const L1 = (offset, extra = {}) => ({ level: 1, offset, mode: 'equipo', ...extra });
const rotulo = (tex, opts = {}) => new THREE.MeshStandardMaterial({ map: tex, transparent: true, alphaTest: 0.05, roughness: 0.5, ...opts });
/** Franja curva pegada al cilindro del criostato (rótulos): radio r, alturas y0–y1, ángulos a0–a1 en grados (desde +z hacia +x). */
function franjaCurva(r, y0, y1, a0, a1, mat) {
  const g = new THREE.LatheGeometry([new THREE.Vector2(r, y0), new THREE.Vector2(r, y1)], 48, (a0 * Math.PI) / 180, ((a1 - a0) * Math.PI) / 180);
  const m = new THREE.Mesh(g, mat); m.userData.decal = true; m.receiveShadow = true; return m;
}
const arco = (cr, cy, r, a0, a1, n = 10) => Array.from({ length: n + 1 }, (_, i) => { const a = a0 + ((a1 - a0) * i) / n; return [cr + r * Math.cos(a), cy + r * Math.sin(a)]; });

export function buildEquipo(root) {
  const refs = buildAnalizador(root);
  const R = MAG.R, Y0 = MAG.Y0, Y1 = MAG.Y1, RC = 2.5;
  const pintura = M.carcasa.clone(); pintura.color.setHex(0xe7e9ec); pintura.roughness = 0.42; pintura.clearcoat = 0.45;
  const azul = M.azulBruker.clone(); azul.color.setHex(0x1f4277);
  const blanco = M.grisClaro.clone(); blanco.color.setHex(0xeef0f2); blanco.roughness = 0.42; blanco.clearcoat = 0.35;

  /* ---------------- IMÁN (vaso exterior del criostato) ---------------- */
  {
    const g = makePart(root, 'iman', L1([0, 0, 0], { shell: true, label: 'equipo' }));
    const perfil = [[MAG.BORE + 0.05, Y0], [R - RC, Y0], ...arco(R - RC, Y0 + RC, RC, -Math.PI / 2, 0).slice(1), ...arco(R - RC, Y1 - RC, RC, 0, Math.PI / 2).slice(1)];
    g.add(mesh(new THREE.LatheGeometry(perfil.map(([r, y]) => new THREE.Vector2(r, y)), 128), pintura));
    const tapa = M.acero.clone(); tapa.side = THREE.DoubleSide;
    g.add(mesh(new THREE.LatheGeometry([new THREE.Vector2(R - RC, Y1), new THREE.Vector2(MAG.BORE, Y1)], 128), tapa));
    const bore = M.aceroOscuro.clone(); bore.side = THREE.DoubleSide;
    g.add(mesh(new THREE.LatheGeometry([new THREE.Vector2(MAG.BORE, Y1), new THREE.Vector2(MAG.BORE, Y0)], 48), bore));
    // franja azul y rótulos de la cara visible
    g.add(franjaCurva(R + 0.04, 146, 151.5, 0, 360, new THREE.MeshStandardMaterial({ color: 0x1f4277, roughness: 0.45 })));
    const marca = lienzo(1024, 640, (c) => {
      const lg = logoBruker('#1f4277'); c.drawImage(lg.image, 312, 0, 400, 200);
      c.fillStyle = '#1f4277'; c.font = '300 150px Segoe UI, Arial'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('Ascend', 512, 330);
      c.font = '600 110px Segoe UI, Arial'; c.fillStyle = '#4b5b70'; c.fillText('400', 512, 480);
    });
    g.add(franjaCurva(R + 0.05, 108, 136, 12, 52, rotulo(marca)));
    const aviso = lienzo(512, 256, (c) => { c.fillStyle = '#f2c230'; c.fillRect(0, 0, 512, 256); c.strokeStyle = '#111'; c.lineWidth = 8; c.strokeRect(6, 6, 500, 244);
      c.fillStyle = '#111'; c.beginPath(); c.moveTo(80, 40); c.lineTo(150, 170); c.lineTo(10, 170); c.closePath(); c.fill(); c.fillStyle = '#f2c230'; c.beginPath(); c.moveTo(80, 64); c.lineTo(132, 160); c.lineTo(28, 160); c.closePath(); c.fill();
      c.fillStyle = '#111'; c.font = 'bold 54px Arial'; c.fillText('U', 62, 146); c.font = 'bold 40px Arial'; c.fillText('CAMPO MAGNÉTICO', 172, 84); c.font = '32px Arial'; c.fillText('INTENSO · no acercar', 172, 136); c.fillText('marcapasos ni hierro', 172, 180); });
    g.add(franjaCurva(R + 0.05, 88, 98, 62, 84, rotulo(aviso)));
    const placa = new THREE.MeshStandardMaterial({ map: plateTexture(['Ascend 400 · 9,4 T', 'bore 54 mm (SB)', 'Modelo didáctico', 'Explorador 3D']), metalness: 0.5, roughness: 0.4 });
    g.add(franjaCurva(R + 0.05, 70, 76, 150, 165, placa));
  }
  {
    // torretas de la tapa: dos de helio (llenado, salida de gas y válvulas de sobrepresión) y tres de nitrógeno
    const g = makePart(root, 'torretas', L1([0, 0, 0], { shell: true, label: 'equipo' }));
    CUELLOS_HE.forEach(([x, z], i) => {
      g.add(mesh(cylY(3.6, 1, 40), M.aceroPulido, [x, Y1 + 0.5, z]));
      g.add(mesh(cylY(2.2, 20, 40), M.acero, [x, Y1 + 11, z]));
      g.add(mesh(cylY(3.0, 1.2, 40), M.aceroPulido, [x, Y1 + 21.6, z]));
      if (i === 0) {
        g.add(mesh(cylY(1.6, 2.8, 32), M.negroBrillante, [x, Y1 + 23.6, z]));                 // puerto de llenado de helio, tapado
        g.add(mesh(cylX(0.6, 2.4, 16), M.aceroPulido, [x - 3.4, Y1 + 18, z]));               // salida de gas
        g.add(mesh(cylX(0.9, 1.2, 16), M.peekRojo, [x - 5.2, Y1 + 18, z]));
      } else {
        g.add(mesh(rbox(3.4, 2.6, 3.4, 0.4), M.aceroPulido, [x, Y1 + 23.5, z]));            // bloque de válvulas
        g.add(mesh(cylY(0.9, 2.2, 20), M.ledAmbar.clone(), [x, Y1 + 25.9, z]));               // válvula de sobrepresión (quench)
        g.add(mesh(cylX(0.6, 2.4, 16), M.aceroPulido, [x - 3.4, Y1 + 16, z]));
      }
    });
    for (const [x, z] of CUELLOS_N2) {
      g.add(mesh(cylY(2.8, 0.8, 32), M.aceroPulido, [x, Y1 + 0.4, z]));
      g.add(mesh(cylY(1.5, 13.2, 32), M.acero, [x, Y1 + 7.4, z]));
      g.add(mesh(cylY(1.9, 2.5, 32), M.plasticoNegro, [x, Y1 + 15.25, z]));
      g.add(mesh(cylY(1.2, 0.5, 32), M.ptfe, [x, Y1 + 16.75, z]));
      const ux = -x / Math.hypot(x, z), uz = -z / Math.hypot(x, z);                           // válvula antirretorno hacia el centro
      const v = mesh(cylY(0.5, 2.2, 16), M.aceroPulido, [x + ux * 2.4, Y1 + 11, z + uz * 2.4]);
      v.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(ux, 0, uz)); g.add(v);
    }
    const et = lienzo(512, 128, (c) => { c.fillStyle = '#1f4277'; c.fillRect(0, 0, 512, 128); c.fillStyle = '#fff'; c.font = '700 70px Segoe UI'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('He', 256, 66); });
    const en = lienzo(512, 128, (c) => { c.fillStyle = '#eef0f2'; c.fillRect(0, 0, 512, 128); c.fillStyle = '#1f4277'; c.font = '700 70px Segoe UI'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('N₂', 256, 66); });
    CUELLOS_HE.forEach(([x, z]) => g.add(mesh(new THREE.PlaneGeometry(3.2, 0.8), new THREE.MeshStandardMaterial({ map: et }), [x, Y1 + 8, z + 2.22])));
    for (const [x, z] of CUELLOS_N2) g.add(mesh(new THREE.PlaneGeometry(2.4, 0.6), new THREE.MeshStandardMaterial({ map: en }), [x, Y1 + 6, z + 1.52]));
  }

  /* ---------------- SOPORTE Y AMORTIGUADORES ---------------- */
  {
    const g = makePart(root, 'soporte', L1([0, 0, 0], { label: 'equipo' }));
    const prof = [[SOPORTE.ri, SOPORTE.y0], [SOPORTE.ro, SOPORTE.y0], [SOPORTE.ro, Y0 - 0.02], [SOPORTE.ri, Y0 - 0.02], [SOPORTE.ri, SOPORTE.y0]];
    const an = M.anodizado.clone(); an.color.setHex(0x4a5260); an.side = THREE.DoubleSide;
    g.add(mesh(new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), 96), an));
    for (const a of SOPORTE.ang) {
      const [x, z] = pataXZ(a);
      g.add(mesh(cylY(3, SOPORTE.y0 - 1.2 - 13, 32), M.aluminio, [x, (13 + SOPORTE.y0 - 1.2) / 2, z]));
      g.add(mesh(cylY(4.2, 1.2, 32), M.aceroOscuro, [x, SOPORTE.y0 - 0.6, z]));
    }
  }
  {
    const g = makePart(root, 'amortiguadores', L1([0, 0, 0], { label: 'equipo' }));
    for (const a of SOPORTE.ang) {
      const [x, z] = pataXZ(a);
      g.add(mesh(cylY(7.5, 1.5, 40), M.aceroOscuro, [x, 0.75, z]));
      g.add(mesh(cylY(6, 9.5, 40), M.carcasaOsc, [x, 1.5 + 4.75, z]));
      g.add(mesh(cylY(5.2, 2, 40), M.goma, [x, 12, z]));
    }
  }

  /* ---------------- CAMBIADOR DE MUESTRAS SampleCase ---------------- */
  {
    const g = makePart(root, 'samplecase', L1([0, 45, 0], { label: 'equipo' }));
    const yb = 169;
    for (const [x, z] of [[6, 14], [6, -14], [30, 12]]) g.add(mesh(cylY(0.8, yb - Y1, 16), M.aceroPulido, [x, (Y1 + yb) / 2, z]));
    g.add(mesh(rbox(39, 1.5, 36, 0.4), M.aluminio, [14.5, yb + 0.75, 0]));
    const gris = blanco.clone(); gris.color.setHex(0xd7dbe0);
    g.add(mesh(rbox(34, 14, 34, 2.2), gris, [17, yb + 1.8 + 7, 0]));
    // carrusel de 24 posiciones bajo una tapa transparente
    const yc = yb + 1.8 + 14;
    g.add(mesh(cylY(15.5, 0.6, 64), M.plasticoNegro, [17, yc + 0.3, 0]));
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2, x = 17 + 12.5 * Math.cos(a), z = 12.5 * Math.sin(a);
      if (i % 5 === 3) continue;                                                   // posiciones vacías
      g.add(mesh(cylY(1.2, 1.8, 16), i % 4 ? M.ptfe : M.condensador, [x, yc + 1.5, z]));
      g.add(mesh(cylY(0.25, 4, 10), M.vidrio, [x, yc + 4.4, z]));
    }
    const tapa = M.vidrio.clone(); tapa.opacity = 0.18;
    g.add(mesh(new THREE.SphereGeometry(16, 48, 12, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 0.5, 1), tapa, [17, yc + 0.6, 0]));
    // torre de la pinza sobre el bore
    g.add(mesh(rbox(7.8, 24, 6, 1.2), azul, [-4.1, yb + 1.8 + 12, 0]));
    g.add(mesh(new THREE.PlaneGeometry(6, 3), rotulo(logoBruker('#ffffff')), [-8.03, yb + 18, 0], [0, -Math.PI / 2, 0]));
    const et = lienzo(512, 96, (c) => { c.fillStyle = '#22385a'; c.font = '600 60px Segoe UI'; c.textBaseline = 'middle'; c.fillText('SampleCase', 18, 50); });
    g.add(mesh(new THREE.PlaneGeometry(14, 2.6), rotulo(et), [21, yb + 8, 17.03]));
    // cable de control hacia la consola: baja por el costado del imán
    g.add(mesh(cylY(0.7, 1.2, 16), M.plasticoNegro, [30, yb - 0.6, -15.5]));
    // (pieza aparte para que la etiqueta del cambiador quede sobre él)
    const I = 'iman', K = 'consola_base', SC = 'samplecase';
    const gc = makePart(root, 'cable_samplecase', L1([0, 0, 0], { info: 'cableado' }));
    cableFlex(gc, [[30, yb - 1.2, -15.5, SC], [30.4, yb - 3.5, -17.5, SC], [29.8, 158.5, -20.8, I], [29.5, 120, -20.6, I], [29.5, 66, -20.8, I], [31, 20, -22.5, I], [33, 3, -24.5, I],
      [44, 0.6, -27, I], [100, 0.6, -53, K], ...refs.enConsola(refs.con.sc, 'servidor')], 0.3, M.cable, { seg: 360 });
  }

  /* ---------------- CONSOLA AVANCE NEO (armario) ---------------- */
  const { x0, x1, z0, z1, y0 } = CONS, yTop = 139, xc = (x0 + x1) / 2, zc = (z0 + z1) / 2, hP = yTop - y0;
  {
    const g = makePart(root, 'consola_base', L1([0, 0, 0], { info: 'consola' }));
    for (const z of [z0 + 3, z1 - 3]) g.add(mesh(box(x1 - x0 - 1, 1.6, 1.5), M.aceroOscuro, [xc, y0 - 0.8, z]));
    for (const x of [x0 + 4, x1 - 4]) for (const z of [z0 + 6, z1 - 6]) {
      g.add(mesh(cylZ(2.4, 1.8, 24), M.plasticoNegro, [x, 2.4, z]));
      g.add(mesh(box(3, 1.4, 3), M.aceroOscuro, [x, 4.5, z]));
    }
  }
  {
    // puerta frontal: blanca, con franja azul vertical, logotipo, nombre y línea de luz
    const g = makePart(root, 'consola_frente', L1([0, 0, 45], { info: 'consola', shell: true, label: 'equipo' }));
    g.add(mesh(rbox(x1 - x0 - 0.4, hP, 1.2, 0.4), blanco, [xc, y0 + hP / 2, z1 - 0.6]));
    const fr = lienzo(256, 1024, (c) => {
      c.fillStyle = '#1f4277'; c.fillRect(0, 0, 256, 1024);
      c.drawImage(logoBruker('#ffffff').image, 18, 40, 220, 110);
      c.save(); c.translate(150, 980); c.rotate(-Math.PI / 2); c.fillStyle = '#ffffff'; c.font = '300 84px Segoe UI, Arial'; c.textBaseline = 'middle'; c.fillText('AVANCE', 0, 0);
      c.font = '700 84px Segoe UI, Arial'; c.fillText('NEO', 330, 0); c.restore();
    });
    g.add(mesh(new THREE.PlaneGeometry(15, hP - 2), new THREE.MeshStandardMaterial({ map: fr, roughness: 0.45 }), [x0 + 8.4, y0 + hP / 2, z1 + 0.02]));
    const led = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xbfe3ff, emissiveIntensity: 1.4, roughness: 0.3 });
    g.add(mesh(box(0.5, hP - 16, 0.3), led, [x0 + 16.6, y0 + hP / 2, z1 + 0.15]));
    g.add(mesh(rbox(1.6, 18, 1.4, 0.5), M.aceroPulido, [x1 - 5, y0 + hP / 2, z1 + 0.7]));                     // tirador
  }
  {
    const g = makePart(root, 'consola_izq', L1([-35, 0, 0], { info: 'consola', shell: true }));
    g.add(mesh(rbox(1.2, hP, z1 - z0 - 2.6, 0.4), blanco, [x0 + 0.6, y0 + hP / 2, zc]));
    const vg = blanco.clone(); vg.map = grilleTexture(6, 24);
    g.add(mesh(new THREE.PlaneGeometry(30, 70), vg, [x0 - 0.02, y0 + 60, zc], [0, -Math.PI / 2, 0]));
  }
  {
    const g = makePart(root, 'consola_der', L1([35, 0, 0], { info: 'consola', shell: true }));
    g.add(mesh(rbox(1.2, hP, z1 - z0 - 2.6, 0.4), blanco, [x1 - 0.6, y0 + hP / 2, zc]));
    const vg = blanco.clone(); vg.map = grilleTexture(6, 24);
    g.add(mesh(new THREE.PlaneGeometry(30, 70), vg, [x1 + 0.02, y0 + 60, zc], [0, Math.PI / 2, 0]));
    const pl = new THREE.MeshStandardMaterial({ map: plateTexture(['AVANCE NEO · 400 MHz', '230 V~ 50/60 Hz', 'Modelo didáctico', 'Explorador 3D']), metalness: 0.5, roughness: 0.4 });
    g.add(mesh(new THREE.PlaneGeometry(9, 4.5), pl, [x1 + 0.02, y0 + 112, z1 - 14], [0, Math.PI / 2, 0]));
  }
  {
    const g = makePart(root, 'consola_trasera', L1([0, 0, -35], { info: 'consola', shell: true }));
    g.add(mesh(rbox(x1 - x0 - 0.4, hP, 1.2, 0.4), blanco, [xc, y0 + hP / 2, z0 + 0.6]));
  }
  {
    const g = makePart(root, 'consola_techo', L1([0, 35, 0], { info: 'consola', shell: true }));
    g.add(mesh(rbox(x1 - x0, 1.4, z1 - z0, 0.4), blanco, [xc, yTop + 0.7, zc]));
    const vg = blanco.clone(); vg.map = grilleTexture(24, 6);
    g.add(mesh(new THREE.PlaneGeometry(44, 30), vg, [xc, yTop + 1.42, zc], [-Math.PI / 2, 0, 0]));
  }

  /* ---------------- PUESTO DE CONTROL ---------------- */
  {
    const g = makePart(root, 'estacion', L1([-25, 0, 30], { label: 'equipo' }));
    const { x0: a, x1: b, z0: c, z1: d, y } = MESA, mx = (a + b) / 2, mz = (c + d) / 2;
    g.add(mesh(rbox(b - a, 3, d - c, 0.6), M.grisClaro, [mx, y - 1.5, mz]));
    for (const x of [a + 3, b - 3]) for (const z of [c + 3, d - 3]) g.add(mesh(box(3, y - 3, 3), M.aluminio, [x, (y - 3) / 2, z]));
    // ordenador bajo la mesa con su conector de red detrás
    g.add(mesh(rbox(PC.w, PC.h, PC.d, 1), M.plasticoNegro, [PC.x, PC.y, PC.z]));
    g.add(mesh(cylZ(0.6, 1.2, 16), M.aceroPulido, [PC_RED[0], PC_RED[1], PC_RED[2] + 0.6]));
    // monitor con TopSpin: espectro de ¹H del acetato de etilo
    const xm = mx + 10, zm = c + 12;
    g.add(mesh(rbox(16, 1.2, 12, 0.4), M.carcasaOsc, [xm, y + 0.6, zm]));
    g.add(mesh(rbox(4, 20, 2.4, 0.6), M.carcasaOsc, [xm, y + 11, zm - 2]));
    g.add(mesh(rbox(64, 38, 2, 0.6), M.plasticoNegro, [xm, y + 34, zm - 0.6]));
    const pant = lienzo(1024, 600, (k) => {
      k.fillStyle = '#f3f5f8'; k.fillRect(0, 0, 1024, 600); k.fillStyle = '#26405f'; k.fillRect(0, 0, 1024, 40);
      k.fillStyle = '#fff'; k.font = '600 20px Segoe UI'; k.fillText('TopSpin · PROTON · acetato de etilo en CDCl₃', 16, 27);
      k.fillStyle = '#e3e8ee'; k.fillRect(0, 40, 200, 560); k.fillStyle = '#26405f'; k.font = '16px Segoe UI';
      ['Acquire', 'Process', 'Analyse', 'Lock: CDCl3', 'Shim: TopShim', 'NS = 16', 'D1 = 1 s'].forEach((s, i) => k.fillText(s, 16, 80 + i * 32));
      const X = (ppm) => 220 + ((8.5 - ppm) / 9) * 780;
      k.strokeStyle = '#1d4fa0'; k.lineWidth = 1.4; k.beginPath(); k.moveTo(220, 540);
      const picos = [[4.12, 0.33, 4, 7.1], [2.05, 1, 1, 0], [1.26, 0.6, 3, 7.1], [0, 0.12, 1, 0], [7.26, 0.05, 1, 0]];
      for (let i = 0; i <= 780; i++) {
        const ppm = 8.5 - (i / 780) * 9; let v = 0;
        for (const [d0, hh, n, J] of picos) { const co = [[1], [1, 1], [1, 2, 1], [1, 3, 3, 1], [1, 4, 6, 4, 1]][n]; co.forEach((w, j) => { const dd = d0 + ((j - (co.length - 1) / 2) * J) / 400; v += (hh * w / Math.max(...co)) / (1 + ((ppm - dd) / 0.004) ** 2); }); }
        k.lineTo(220 + i, 540 - v * 420);
      }
      k.stroke(); k.fillStyle = '#4a5566'; k.font = '15px Segoe UI'; for (let p = 0; p <= 8; p++) k.fillText(String(p), X(p) - 4, 568);
    });
    g.add(mesh(new THREE.PlaneGeometry(61, 35), new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0xffffff, emissiveIntensity: 0.75, emissiveMap: pant }), [xm, y + 34, zm + 0.42]));
    g.add(mesh(rbox(44, 1.2, 14, 0.4), M.carcasaOsc, [xm, y + 0.6, zm + 20]));
    g.add(mesh(rbox(6, 1.2, 9, 0.6), M.carcasaOsc, [xm + 30, y + 0.6, zm + 20]));
    // red: ordenador → servidor de adquisición de la consola
    const [px, py, pz] = PC_RED, K = 'consola_base', E = 'estacion';
    const gr = makePart(root, 'cable_red', L1([0, 0, 0], { info: 'cableado' }));
    cableFlex(gr, [[px, py, pz, E], [px, py, pz - 3, E], [px + 2, 4, pz - 7, E], [-70, 0.5, 10, K], [-55, 0.5, -70, K], [100, 0.5, -82, K], ...refs.enConsola(refs.con.red, 'servidor')],
      0.25, M.cableGris, { seg: 260 });
  }

  refs.update = () => {};
  return refs;
}
