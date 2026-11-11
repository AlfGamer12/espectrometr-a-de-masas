// Desorción/ionización láser asistida por matriz (MALDI). Corte lateral esquemático, no a escala, sobre la diana de acero:
// cristales de matriz con el analito incluido, pulso láser UV, absorción por la matriz, pluma de desorción, transferencia de protón
// y extracción de los cationes, mientras los neutros siguen dispersándose. Todo se dibuja como función de t (sin estado).
// La extracción retardada se explica con detalle en su propia escena (extraccion-retardada.js).
//
// Parámetros (p):
//   laser     rótulo del láser ('Láser N₂ · 337 nm', 'Láser smartbeam-II · 355 nm'…)
//   laserTxt  el láser en el texto ('de nitrógeno (337 nm, pulsos de unos 3 ns)')
//   matriz    matriz del ejemplo para el texto ('HCCA o ácido sinapínico'); sin valor no se nombra
//   diana     rótulo de la diana ('Diana de acero')
//   destino   'tof' (placas de extracción hacia un tubo de vuelo) | 'optica' (extracción hacia la óptica iónica, p. ej. FT-ICR)
//   is1       potencial de la diana para el rótulo y el texto ('20 kV'); retardo  true si la extracción es retardada (solo 'tof')
import { tramo, suave, easeOut, easeIn, lerp, azar } from '../dibujo.js';
import { rotuloGuia, calor } from './_util-fuentes.js';

export default function crear(p = {}) {
  const laser = p.laser || 'Láser N₂ · 337 nm';
  const laserTxt = p.laserTxt || 'de nitrógeno (337 nm, pulsos de unos 3 ns)';
  const diana = p.diana || 'Diana de acero';
  const tof = (p.destino || 'tof') === 'tof';
  const dur = 16;
  const SX = 300, SY = 292;            // centro del spot, superficie de la diana
  const L0 = tof ? [196, -6] : [252, -6];                // el haz entra desde arriba a la izquierda y pasa por el hueco de las placas
  const T = { pulso: 3.6, llega: 4.4, pluma: 4.6, prot: 9.4, ext: 12.6 };

  /* ---------- cristales del spot (fijos) ---------- */
  const R = azar(5);
  const cristales = [];
  for (let x = 222; x < 380;) {
    const w = 10 + R() * 16, h = 8 + R() * 14;
    cristales.push({ x, w, h, inc: (R() - 0.5) * 6 });
    x += w * 0.8;
  }
  /* ---------- pluma: velocidades y direcciones (fijas) ---------- */
  const pluma = Array.from({ length: 70 }, () => {
    const th = (R() - 0.5) * 1.7 * (0.4 + 0.6 * R());
    return { th, v: 8 + R() * 16, x0: (R() - 0.5) * 50, rot: R() * 6, mat: R() < 0.9 };
  });
  const ionesMat = Array.from({ length: 6 }, (_, i) => ({ th: (i / 5 - 0.5) * 0.7, v: 7 + R() * 4, x0: (R() - 0.5) * 30 }));
  const analito = [
    { th: -0.22, v: 7, x0: -6, prot: true, sem: 7 },
    { th: 0.2, v: 8, x0: 8, prot: true, sem: 9, td: 0.5 },
    { th: -0.75, v: 8.5, x0: -20, sem: 11 },
    { th: 0.7, v: 9, x0: 18, sem: 13 },
    { th: 0.02, v: 6, x0: 2, sem: 15 },
  ];
  // posición de una partícula de la pluma (vuelo libre en vacío: velocidad constante, aquí a cámara muy lenta)
  const pos = (q, t) => {
    const dt = Math.max(0, t - T.pluma);
    return [SX + q.x0 * 0.6 + Math.sin(q.th) * q.v * dt, SY - 4 - Math.cos(q.th) * q.v * dt];
  };
  // los cationes, además, se aceleran hacia arriba cuando hay campo
  const posIon = (q, t) => {
    const [x, y] = pos(q, t);
    const da = Math.max(0, t - T.ext);
    const ky = 26 * da * da;                    // aceleración uniforme del campo
    const kx = Math.min(1, da * 0.9);           // el campo, además, los lleva hacia el eje del orificio
    return [lerp(x, SX + (x - SX) * 0.25, kx), y - ky];
  };

  const textos = [
    { t: 0, texto: `La muestra se mezcla con un gran exceso de matriz${p.matriz ? ` (${p.matriz})` : ''} y se deja secar sobre la diana. Al cristalizar, la matriz incluye las moléculas del analito en sus cristales: es la cocristalización.` },
    { t: 3.4, texto: `Un pulso del láser ${laserTxt} incide sobre la muestra. La matriz absorbe intensamente a esa longitud de onda y el analito apenas lo hace, de modo que casi toda la energía la recibe la matriz.` },
    { t: 5.4, texto: 'La energía depositada en pocos nanosegundos vaporiza de golpe la capa superficial: se forma una pluma de matriz y analito que se expande hacia el vacío. La matriz protege al analito, que pasa a la fase gaseosa sin apenas fragmentarse.' },
    { t: 9, texto: 'En la pluma, moléculas de matriz excitadas e ionizadas ceden protones al analito. Solo una pequeña fracción de las moléculas se ioniza, y casi siempre con una sola carga: predomina [M+H]⁺, junto a aductos como [M+Na]⁺ o [M+K]⁺.' },
    {
      t: 12.4, texto: tof
        ? `El campo eléctrico entre la diana${p.is1 ? `, a ${p.is1},` : ''} y las placas de extracción acelera los cationes hacia el tubo de vuelo${p.retardo ? ', tras un breve retardo (extracción retardada)' : ''}. Las moléculas neutras no sienten el campo y siguen dispersándose.`
        : 'Un campo eléctrico extrae los cationes de la pluma hacia la óptica iónica y el analizador. Las moléculas neutras no sienten el campo y las retira el sistema de vacío.',
    },
  ];

  return {
    titulo: 'Desorción/ionización MALDI',
    dur,
    fases: textos,
    dibujar(g, t) {
      const C = g.C;
      const fin = 1 - tramo(t, 15.3, 15.9);       // reinicio limpio: la pluma se desvanece antes de volver a empezar
      const MAT = C.frio;

      /* ===== placas de extracción o embudo ===== */
      const kCampo = tramo(t, T.ext - 0.2, T.ext + 0.3) * (1 - tramo(t, 15.3, 15.9));
      if (tof) {
        g.electrodo(150, 196, 95, 8, { color: kCampo > 0.5 ? C.acento : C.metal, alpha: 0.75 + 0.25 * kCampo });
        g.electrodo(355, 196, 95, 8, { color: kCampo > 0.5 ? C.acento : C.metal, alpha: 0.75 + 0.25 * kCampo });
        g.electrodo(150, 136, 85, 8, {}); g.electrodo(365, 136, 85, 8, {});
        g.rotulo('Placa de extracción', 80, 200, { size: 11 });
        g.rotulo('Tierra', 112, 140, { size: 11 });
        g.flecha(SX, 118, SX, 26, { color: C.tenue, lw: 1.2 });
        g.texto('Hacia el tubo de vuelo', SX + 12, 40, { size: 11, color: C.tenue });
      } else {
        for (let i = 0; i < 4; i++) {
          const y = 206 - i * 30, gap = 62 - i * 6;
          g.electrodo(SX - gap - 80 + i * 12, y, 80 - i * 12, 7, {});
          g.electrodo(SX + gap, y, 80 - i * 12, 7, {});
        }
        g.rotulo('Óptica iónica', 112, 160, { size: 11 });
        g.flecha(SX, 100, SX, 26, { color: C.tenue, lw: 1.2 });
        g.texto('Hacia el analizador', SX + 12, 40, { size: 11, color: C.tenue });
      }
      if (kCampo > 0) for (let i = -1; i <= 1; i++) g.flecha(SX + i * 34, 282, SX + i * 34, tof ? 214 : 222, { color: C.campo, lw: 1.1, punta: 6, alpha: kCampo * fin });

      /* ===== diana y cristales ===== */
      g.rect(24, SY + 4, 592, 30, { fill: C.metal, stroke: C.metalOsc, lw: 0.8, r: 3 });
      g.texto(p.is1 ? `${diana} · ${p.is1}` : diana, 40, SY + 19, { size: 11, color: '#fff', weight: 700 });
      const crater = tramo(t, T.llega, T.pluma + 0.4) * fin;
      for (const c of cristales) {
        const dC = Math.abs(c.x + c.w / 2 - SX);
        const h = c.h * (dC < 44 ? 1 - 0.55 * crater * (1 - dC / 44) : 1);
        const pts = [[c.x, SY + 4], [c.x + c.inc, SY + 4 - h], [c.x + c.w * 0.5, SY + 4 - h - 4], [c.x + c.w + c.inc, SY + 4 - h], [c.x + c.w, SY + 4]];
        g.linea(pts, { fill: MAT, alpha: 0.22, cerrar: true });
        g.linea(pts, { color: MAT, lw: 1, alpha: 0.7, cerrar: true });
      }
      // calentamiento instantáneo de la superficie
      const kFl = tramo(t, T.llega, T.llega + 0.25) * (1 - tramo(t, T.llega + 0.3, T.pluma + 0.9));
      if (kFl > 0) { g.circulo(SX, SY - 2, 14 + 26 * kFl, { fill: C.foton, alpha: 0.35 * kFl }); g.circulo(SX, SY - 2, 8, { fill: C.calor, alpha: 0.45 * kFl }); }
      g.rotulo('Cristales de matriz + analito', 140, 262, { size: 11, alpha: 1 - tramo(t, 5.2, 5.8) });
      if (t < 5.8) g.linea([[204, 268], [228, 284]], { color: C.tenue, lw: 0.8, alpha: 1 - tramo(t, 5.2, 5.8) });

      /* ===== ampliación de un cristal (fase 1) ===== */
      const aZ = tramo(t, 0.3, 0.9) * (1 - tramo(t, 3.2, 3.8));
      if (aZ > 0) {
        const ZX = 532, ZY = 98, ZR = 62;
        g.linea([[SX + 30, SY - 14], [ZX - ZR * 0.7, ZY + ZR * 0.72]], { color: C.tenue, lw: 0.8, alpha: aZ, dash: [3, 3] });
        g.circulo(ZX, ZY, ZR, { fill: C.panel, stroke: C.linea, lw: 1.2, alpha: aZ });
        g.ctx.save(); g.ctx.beginPath(); g.ctx.arc(ZX, ZY, ZR - 2, 0, Math.PI * 2); g.ctx.clip();
        const huecos = [[-22, -14], [18, 10], [-6, 30]];
        for (let i = -6; i <= 6; i++) for (let j = -6; j <= 6; j++) {
          const x = ZX + i * 10 + (j % 2 ? 5 : 0), y = ZY + j * 9;
          if (huecos.some(([hx, hy]) => Math.hypot(x - ZX - hx, y - ZY - hy) < 13)) continue;
          g.circulo(x, y, 2.6, { fill: MAT, alpha: 0.75 * aZ });
        }
        huecos.forEach(([hx, hy], i) => g.molecula(ZX + hx, ZY + hy, { r: 3.4, n: 5, rot: i * 1.3, semilla: 7 + i * 2, alpha: aZ }));
        g.ctx.restore();
        g.rotulo('Analito incluido en la matriz', ZX, ZY + ZR + 14, { size: 11, alpha: aZ });
      }

      /* ===== pulso láser ===== */
      const P1 = L0, P2 = [SX, SY - 4];
      g.linea([P1, P2], { color: C.foton, lw: 1, alpha: 0.25, dash: [5, 5] });
      const kL = tramo(t, T.pulso, T.llega);
      if (kL > 0 && kL < 1) {
        const a = Math.max(0, kL - 0.22);
        g.foton(lerp(P1[0], P2[0], a), lerp(P1[1], P2[1], a), lerp(P1[0], P2[0], kL), lerp(P1[1], P2[1], kL), { amp: 4, long: 9, lw: 2.2 });
      }
      g.rotulo(laser, 128, 22, { size: 12, color: C.texto });

      /* ===== pluma de desorción ===== */
      if (t > T.pluma && fin > 0) {
        const aPl = tramo(t, T.pluma, T.pluma + 0.3) * fin;
        for (const q of pluma) {
          const [x, y] = pos(q, t);
          if (y < 8 || x < 4 || x > 636) continue;
          if (y < 210 && Math.abs(x - SX) > (tof ? 55 : 62)) continue;   // las que llegan a las placas quedan retenidas
          if (q.mat) g.circulo(x, y, 2.2, { fill: MAT, alpha: 0.75 * aPl });
          else g.molecula(x, y, { r: 1.8, n: 2, rot: q.rot + t, color: MAT, alpha: 0.7 * aPl });
        }
        // iones de matriz (pequeños): uno cede su protón al analito protagonista
        ionesMat.forEach((q, i) => {
          const cede = i === 2;
          if (cede && t > T.prot + 0.5) { const [x, y] = pos(q, t); g.circulo(x, y, 2.6, { fill: MAT, alpha: aPl }); return; }
          const [x, y] = posIon(q, t);
          if (y < 10) return;
          g.circulo(x, y, 3, { fill: C.ion, alpha: aPl });
        });
        // analito: neutros y protagonistas que se protonan
        for (const q of analito) {
          const prot = q.prot && t > T.prot + 0.5 + (q.td || 0);
          const [x, y] = prot ? posIon(q, t) : pos(q, t);
          if (y < 10) continue;
          g.molecula(x, y, { r: 3.4, n: 5, rot: t * 0.4 + q.sem, semilla: q.sem, color: prot ? C.ion : C.neutro, alpha: aPl });
          if (prot) g.ion(x + 12, y - 10, { r: 5.5, alpha: aPl });
        }
        // transferencia de protón (H⁺) del ion de matriz al analito
        const qm = ionesMat[2], qa = analito[0];
        const kH = tramo(t, T.prot, T.prot + 0.5);
        if (kH > 0 && kH < 1) {
          const [mx, my] = pos(qm, t), [ax, ay] = pos(qa, t);
          const hx = lerp(mx, ax + 12, suave(kH)), hy = lerp(my, ay - 10, suave(kH));
          g.ion(hx, hy, { r: 4.5, brillo: true });
          g.texto('H⁺', hx + 8, hy - 8, { size: 11, color: C.ion, weight: 700 });
        }
        const [ax, ay] = t > T.prot + 0.5 ? posIon(qa, t) : pos(qa, t);
        const aMH = tramo(t, T.prot + 0.4, T.prot + 0.8) * (1 - tramo(t, T.ext + 0.6, T.ext + 1));
        if (aMH > 0) rotuloGuia(g, '[M+H]⁺', ax - 70, ay - 22, ax - 6, ay - 4, { size: 11, color: C.ion, alpha: aMH });
        const aPluma = tramo(t, 5.6, 6.1) * (1 - tramo(t, 8.8, 9.2));
        if (aPluma > 0) g.rotulo('Pluma de desorción', 452, 250, { size: 11, alpha: aPluma });
        const aNeu = tramo(t, 13.2, 13.6) * fin;
        if (aNeu > 0) g.rotulo('Los neutros no sienten el campo', 470, 252, { size: 11, alpha: aNeu });
        const aEx = tramo(t, 13, 13.4) * fin;
        if (aEx > 0 && tof) g.rotulo('Cationes acelerados', 160, 166, { size: 11, color: C.ion, alpha: aEx });
      }
      // absorción por la matriz (fase 2)
      const aAbs = tramo(t, 4.3, 4.6) * (1 - tramo(t, 5.4, 5.9));
      if (aAbs > 0) g.rotulo('La matriz absorbe el UV', 452, 250, { size: 11, color: C.texto, alpha: aAbs });

      g.leyenda([[MAT, 'matriz'], [C.neutro, 'analito'], [C.ion, 'catión'], [C.foton, 'láser', 'foton']], 300, 349, { size: 9.5 });
    },
  };
}
