// Introducción de muestra en ICP-MS: bomba peristáltica → nebulizador concéntrico → cámara de pulverización de doble paso (Scott)
// refrigerada. Corte esquemático, no a escala (las gotas están muy ampliadas). Las gotas grandes impactan en las paredes y se van
// por el drenaje; las finas siguen al argón por el doble recorrido y salen hacia la antorcha. Todo es función de t y periódico en
// `dur`, de modo que el bucle no salta.
//
// Parámetros (p): rodillos (nº de rodillos de la bomba, p. ej. 10) · nebulizador (nombre, p. ej. 'MicroMist')
//                 temp (temperatura de la cámara, '2 °C') · camara (rótulo de la cámara)
import { tramo, lerp, azar } from '../dibujo.js';
import { frac, puntoEn, flujo } from './util-fuentes.js';

export default function crear(p = {}) {
  const dur = 16;
  const nRod = p.rodillos || 10;
  const temp = p.temp || '2 °C';
  const neb = p.nebulizador ? `Nebulizador ${p.nebulizador}` : 'Nebulizador concéntrico';
  const PX = 110, PY = 132;                // bomba
  const TIPX = 288, TIPY = 190;           // punta del nebulizador
  // cámara: tubo exterior y tubo interior abierto por el fondo
  const CH = { x0: 290, x1: 604, y0: 118, y1: 262, ix1: 522, iy0: 156, iy1: 224, sx: 330 };
  const rutaFina = (o) => [[TIPX, TIPY + o * 0.3], [CH.ix1 - 10, TIPY + o], [CH.ix1 + 40, TIPY + o * 0.6], [CH.x1 - 30, 150 + o * 0.15], [CH.x1 - 52, 137 + o * 0.15],
    [CH.sx + 26, 137 + o * 0.2], [CH.sx + 4 * Math.sign(o || 1), 112], [CH.sx + o * 0.4, 12]];

  const R = azar(17);
  const finas = Array.from({ length: 46 }, (_, i) => ({ k: 2 + (i % 2), f: i / 46 + R() * 0.02, o: (R() - 0.5) * 22, r: 1.5 + R() * 1.1 }));
  const grandes = Array.from({ length: 12 }, (_, i) => ({ k: 4 + (i % 3), f: R(), o: (R() - 0.5) * 16, r: 3 + R() * 2.6, lejos: i % 4 === 0, v: 110 + R() * 50 }));
  const goteo = Array.from({ length: 7 }, (_, i) => ({ k: 3, f: i / 7 }));

  return {
    titulo: 'Nebulizador y cámara de pulverización',
    dur,
    fases: [
      { t: 0, texto: `La bomba peristáltica aspira la muestra: sus ${p.rodillos ? nRod + ' ' : ''}rodillos aprietan el tubo flexible y empujan el líquido a caudal constante, sea cual sea su viscosidad. Otro canal de la misma bomba extrae el drenaje de la cámara.` },
      { t: 3.4, texto: `En el ${neb.charAt(0).toLowerCase() + neb.slice(1)}, de tipo concéntrico, el argón sale a gran velocidad por el anillo que rodea al capilar de muestra y rompe el líquido en un aerosol de gotas de tamaños muy distintos.` },
      { t: 6.8, texto: 'El aerosol entra en la cámara de pulverización de doble paso. Las gotas grandes no pueden seguir los cambios de dirección del gas: chocan con las paredes, forman una película de líquido y se van por el drenaje.' },
      { t: 10.2, texto: 'Las gotas finas siguen al gas: recorren el tubo interior, giran al fondo y vuelven por el espacio exterior hasta la salida. Solo una pequeña fracción de la muestra aspirada llega al plasma.' },
      { t: 13.2, texto: `La cámara se mantiene a ${temp} con un elemento Peltier. El frío condensa parte del vapor de disolvente: entra menos agua en el plasma, que trabaja de forma más estable y forma menos óxidos.` },
    ],
    dibujar(g, t) {
      const C = g.C, ctx = g.ctx;
      const vidrio = { fill: C.panel, stroke: C.tenue, lw: 1.2 };

      /* ===== muestra y bomba peristáltica ===== */
      g.rect(22, 250, 40, 80, { ...vidrio, r: 4 });
      g.rect(24, 272, 36, 56, { fill: C.liquido, alpha: 0.45, r: 3 });
      g.rotulo('Muestra', 42, 344, { size: 11 });
      g.linea([[42, 300], [42, PY + 6], [PX - 38, PY + 6]], { color: C.linea, lw: 5 });
      g.linea([[42, 300], [42, PY + 6], [PX - 38, PY + 6]], { color: C.liquido, lw: 2.2, alpha: 0.9 });
      // lecho de oclusión, tubo y rotor
      ctx.save(); ctx.lineCap = 'round';
      ctx.strokeStyle = C.metalOsc; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(PX, PY, 46, Math.PI * 0.95, Math.PI * 2.05); ctx.stroke();
      ctx.strokeStyle = C.linea; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(PX, PY, 39, Math.PI, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = C.liquido; ctx.lineWidth = 3; ctx.globalAlpha = 0.9; ctx.beginPath(); ctx.arc(PX, PY, 39, Math.PI, Math.PI * 2); ctx.stroke();
      ctx.restore();
      g.circulo(PX, PY, 30, { fill: C.metal, stroke: C.metalOsc, lw: 1 });
      const giro = (t / dur) * Math.PI * 2 * (Math.max(1, Math.round(0.8 * nRod)) / nRod);   // gira un nº entero de rodillos por ciclo: el bucle no salta
      for (let i = 0; i < nRod; i++) {
        const a = giro + (i / nRod) * Math.PI * 2;
        const x = PX + Math.cos(a) * 30, y = PY + Math.sin(a) * 30;
        const enTubo = Math.sin(a) < -0.05;                  // rodillo bajo el tubo: lo estrangula
        g.circulo(x, y, 6.5, { fill: C.metalOsc, stroke: C.metal, lw: 1 });
        if (enTubo) g.circulo(PX + Math.cos(a) * 39, PY + Math.sin(a) * 39, 3.4, { fill: C.linea });
      }
      g.circulo(PX, PY, 6, { fill: C.metalOsc });
      g.flecha(PX - 12, PY - 58, PX + 12, PY - 58, { color: C.tenue, lw: 1.2, punta: 6 });
      g.rotulo('Bomba peristáltica', PX, PY - 76, { size: 12 });
      // del tubo de bomba al nebulizador
      const tN = [[PX + 39, PY + 2], [172, PY + 2], [172, TIPY], [200, TIPY]];
      g.linea(tN, { color: C.linea, lw: 5 }); g.linea(tN, { color: C.liquido, lw: 2.2, alpha: 0.9 });

      /* ===== nebulizador concéntrico ===== */
      g.linea([[200, TIPY - 11], [268, TIPY - 11], [TIPX, TIPY - 4], [TIPX, TIPY + 4], [268, TIPY + 11], [200, TIPY + 11]], { ...vidrio, color: C.tenue, cerrar: true });
      g.linea([[200, TIPY], [TIPX, TIPY]], { color: C.liquido, lw: 2.2 });
      g.rect(216, TIPY + 11, 12, 36, { ...vidrio });
      g.texto('Ar', 210, TIPY + 42, { size: 11, color: C.gas, align: 'right', weight: 700 });
      flujo(g, [[222, TIPY + 46], [222, TIPY + 9], [240, TIPY + 7], [TIPX - 2, TIPY + 3]], t, { color: C.gas, n: 4, vel: 0.9, largo: 0.12, lw: 1.3 });
      flujo(g, [[222, TIPY + 46], [222, TIPY + 9], [240, TIPY - 7], [TIPX - 2, TIPY - 3]], t + 0.4, { color: C.gas, n: 3, vel: 0.9, largo: 0.12, lw: 1.3 });
      g.rotulo(neb, 196, 268, { size: 12 });

      /* ===== cámara de doble paso con camisa Peltier ===== */
      g.rect(CH.x0 - 8, CH.y0 - 8, CH.x1 - CH.x0 + 16, CH.y1 - CH.y0 + 16, { stroke: C.frio, lw: 2.2, r: 14, alpha: 0.85, fill: C.frio });
      g.rect(CH.x0 - 8, CH.y0 - 8, CH.x1 - CH.x0 + 16, CH.y1 - CH.y0 + 16, { fill: C.fondo, r: 14, alpha: 0.82 });
      g.rect(CH.x0, CH.y0, CH.x1 - CH.x0, CH.y1 - CH.y0, { fill: C.panel, stroke: C.tenue, lw: 1.4, r: 30 });
      // salida hacia la antorcha y drenaje
      g.rect(CH.sx - 12, 8, 24, CH.y0 - 6, { fill: C.panel, stroke: C.tenue, lw: 1.2 });
      g.rect(CH.sx - 11, CH.y0 - 3, 22, 6, { fill: C.panel });
      g.rect(CH.sx - 7, CH.y1 - 3, 14, 56, { fill: C.panel, stroke: C.tenue, lw: 1.2 });
      g.rect(CH.sx - 6, CH.y1 - 4, 12, 6, { fill: C.panel });
      g.linea([[CH.x0 + 10, CH.iy0], [CH.ix1, CH.iy0]], { color: C.tenue, lw: 1.4 });
      g.linea([[CH.x0 + 10, CH.iy1], [CH.ix1, CH.iy1]], { color: C.tenue, lw: 1.4 });
      g.linea([[CH.x0 + 10, CH.iy0], [CH.x0 + 10, CH.iy1]], { color: C.tenue, lw: 1.4 });
      // corriente de argón en la cámara
      flujo(g, rutaFina(0), t, { color: C.gas, n: 7, vel: 0.11, largo: 0.035, lw: 1.1, alpha: 0.55 });
      // película de líquido y drenaje
      const aFilm = 0.55;
      g.linea([[384, CH.iy1 - 1.5], [CH.ix1, CH.iy1 - 1.5]], { color: C.liquido, lw: 2.4, alpha: aFilm });
      g.linea([[CH.sx - 4, CH.y1 - 2], [CH.x1 - 26, CH.y1 - 2]], { color: C.liquido, lw: 3, alpha: aFilm });
      g.linea([[CH.x1 - 6, 190], [CH.x1 - 4, 236]], { color: C.liquido, lw: 2.2, alpha: aFilm * 0.8 });
      for (const d of goteo) {
        const u = frac((t * d.k) / dur + d.f);
        if (u < 0.3) { const k = u / 0.3; g.circulo(CH.ix1 + 1, lerp(CH.iy1, CH.y1 - 4, k * k), 2.2, { fill: C.liquido, alpha: 0.7 }); }
        else { const k = (u - 0.3) / 0.7; g.circulo(lerp(CH.ix1, CH.sx, k), CH.y1 - 3 + (k > 0.92 ? (k - 0.92) * 300 : 0), 2.4, { fill: C.liquido, alpha: 0.75 }); }
      }
      g.linea([[CH.sx, CH.y1 + 52], [CH.sx, 322], [176, 322]], { color: C.liquido, lw: 2.2, alpha: 0.6, dash: [5, 4] });
      g.flecha(200, 322, 168, 322, { color: C.liquido, lw: 1.6, punta: 6 });
      g.rotulo('Drenaje → bomba', 252, 338, { size: 11 });
      g.flecha(CH.sx, 30, CH.sx, 8, { color: C.tenue, lw: 1.3, punta: 6 });
      g.rotulo('Hacia la antorcha', CH.sx + 82, 26, { size: 12 });
      g.rotulo(`Peltier · ${temp}`, 560, 98, { size: 12, color: C.frio });
      g.rotulo(p.camara || 'Cámara de pulverización de doble paso', 466, 286, { size: 12 });

      /* ===== aerosol ===== */
      // cono de pulverización a la salida del nebulizador
      g.linea([[TIPX, TIPY - 2], [TIPX + 46, TIPY - 15], [TIPX + 46, TIPY + 15], [TIPX, TIPY + 2]], { fill: C.liquido, alpha: 0.12, cerrar: true });
      for (const d of finas) {
        const u = frac((t * d.k) / dur + d.f);
        const [x, y] = puntoEn(rutaFina(d.o), u);
        if (y < 10) continue;
        g.circulo(x, y, d.r, { fill: C.liquido, alpha: 0.85 * Math.min(1, u * 10, (1 - u) * 12) });
      }
      for (const d of grandes) {
        const u = frac((t * d.k) / dur + d.f);
        const tau = u * 2.2;                                     // tiempo propio de vuelo (s)
        let x = TIPX + d.v * tau, y = TIPY + d.o * (0.4 + tau) + 22 * tau * tau;
        const yMax = CH.iy1 - d.r, xMax = CH.x1 - 6 - d.r;
        let choca = false;
        if (!d.lejos && y >= yMax && x < CH.ix1) { y = yMax; choca = true; }
        if (d.lejos) { y = TIPY + d.o * (0.3 + tau * 0.3) + 4 * tau * tau; if (x >= xMax) { x = xMax; choca = true; } }
        else if (x > CH.ix1 + 10) { x = CH.ix1 + 10; choca = true; }
        // al chocar, la gota se aplasta y se incorpora a la película
        const tImp = choca ? 1 : 0;
        const al = Math.min(1, u * 14) * (choca ? Math.max(0, 1 - (u - impacto(d)) * 5) : 1);
        if (al <= 0.02) continue;
        if (tImp) { ctx.save(); ctx.globalAlpha = al * 0.7; ctx.fillStyle = C.liquido; ctx.beginPath(); ctx.ellipse(x, y + (d.lejos ? 0 : d.r * 0.5), d.lejos ? d.r * 0.5 : d.r * 1.5, d.lejos ? d.r * 1.4 : d.r * 0.5, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
        else g.gota(x, y, d.r, { alpha: al });
      }

      /* ===== rótulos de fase ===== */
      const aG = tramo(t, 7, 7.5) * (1 - tramo(t, 9.9, 10.3));
      if (aG > 0) g.rotulo('Gotas grandes: chocan y van al drenaje', 466, 312, { size: 11, color: C.mal, alpha: aG });
      const aF = tramo(t, 10.4, 10.9) * (1 - tramo(t, 13, 13.4));
      if (aF > 0) g.rotulo('Gotas finas: siguen al gas', 446, 98, { size: 11, color: C.ok, alpha: aF });
      const aA = tramo(t, 3.6, 4.1) * (1 - tramo(t, 6.6, 7));
      if (aA > 0) g.rotulo('Aerosol', TIPX + 30, TIPY - 40, { size: 11, alpha: aA });

      g.leyenda([[C.liquido, 'gotas de muestra'], [C.gas, 'flujo de argón']], 460, 350, { size: 9.5 });

      // fracción de su ciclo en la que una gota grande llega a la pared (para desvanecerla después)
      function impacto(d) {
        for (let k = 0; k <= 1; k += 0.01) {
          const tau = k * 2.2, x = TIPX + d.v * tau;
          const y = d.lejos ? 0 : TIPY + d.o * (0.4 + tau) + 22 * tau * tau;
          if (d.lejos ? x >= CH.x1 - 6 - d.r : (y >= CH.iy1 - d.r || x > CH.ix1 + 10)) return k;
        }
        return 1;
      }
    },
  };
}
