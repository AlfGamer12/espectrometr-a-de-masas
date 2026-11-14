// Interferómetro de Michelson con incidencia de 30° sobre el divisor (geometría del IRSpirit): división del haz, interferencia
// constructiva y destructiva según el retardo δ, interferograma de una línea, de dos líneas y de una fuente continua (pico central),
// y muestreo en los pasos por cero del láser de referencia, con la alineación dinámica del espejo fijo. Escena sin estado.
// Parámetros opcionales: p.laser (texto de la longitud de onda del láser), p.angulo (30 por defecto).
import { tramo, suave, lerp } from '../dibujo.js';

export default function crear(p = {}) {
  const ang = p.angulo || 30;
  const laserTxt = p.laser || 'láser de referencia';
  const BS = [188, 198];
  const a = (ang * Math.PI) / 180;
  const din = [Math.cos(a), -Math.sin(a)];                         // haz incidente (y de la pantalla hacia abajo)
  const r = [0, 1], out = [0, -1];                                  // brazo reflejado (espejo fijo) y salida (detector)
  const SRC = [BS[0] - 140 * din[0], BS[1] - 140 * din[1]];
  const MM0 = [BS[0] + 108 * din[0], BS[1] + 108 * din[1]];
  const MF = [BS[0], BS[1] + 92], DET = [BS[0], BS[1] - 128];
  const PX = 7;                                                     // px de desplazamiento del espejo por cada λ₀ de retardo (exagerado)
  // retardo δ (en unidades de λ₀) a lo largo de la escena
  const delta = (t) => (t < 4 ? 0 : t < 10 ? 2.5 * suave(tramo(t, 4.3, 9.6)) : t < 15 ? lerp(-3, 3, tramo(t, 10.3, 14.7)) : t < 20 ? lerp(-3, 3, tramo(t, 15.3, 19.7)) : lerp(-3, 3, tramo(t, 20.6, 25.4)));
  const modo = (t) => (t < 10 ? 'mono' : t < 15 ? 'dos' : 'ancho');
  // espectro continuo: números de onda relativos (1/λ₀) con pesos gaussianos
  const SIG = Array.from({ length: 41 }, (_, i) => 0.55 + i * 0.026), W = SIG.map((s) => Math.exp(-(((s - 1.0) / 0.28) ** 2))), WT = W.reduce((x, y) => x + y, 0);
  const F = (d, m) => (m === 'mono' ? Math.cos(2 * Math.PI * d) : m === 'dos' ? (Math.cos(2 * Math.PI * d) + Math.cos(2 * Math.PI * 1.32 * d)) / 2
    : SIG.reduce((acc, s, i) => acc + W[i] * Math.cos(2 * Math.PI * s * d), 0) / WT);
  const LAMBDA_L = 0.5;                                              // λ del láser en unidades de λ₀ (más corta que la mínima del IR)
  const onda = (g, A, B, { amp = 4, long = 12, fase = 0, color, alpha = 1, lw = 1.5 }) => {
    const L = Math.hypot(B[0] - A[0], B[1] - A[1]), ux = (B[0] - A[0]) / L, uy = (B[1] - A[1]) / L, pts = [];
    for (let d = 0; d <= L; d += 1.5) { const w = Math.sin((d / long) * Math.PI * 2 - fase) * amp; pts.push([A[0] + ux * d - uy * w, A[1] + uy * d + ux * w]); }
    g.linea(pts, { color, lw, alpha });
  };
  const espejo = (g, c, n, w, C) => {
    const tx = -n[1], ty = n[0];
    g.linea([[c[0] - tx * w, c[1] - ty * w], [c[0] + tx * w, c[1] + ty * w]], { color: C.metalOsc, lw: 6, cap: 'butt' });
    g.linea([[c[0] - tx * w + n[0] * 2.5, c[1] - ty * w + n[1] * 2.5], [c[0] + tx * w + n[0] * 2.5, c[1] + ty * w + n[1] * 2.5]], { color: C.metal, lw: 2, cap: 'butt' });
  };

  return {
    titulo: 'Interferómetro de Michelson',
    dur: 26,
    fases: [
      { t: 0, texto: `El divisor de haz refleja la mitad de la luz hacia el espejo fijo y deja pasar la otra mitad hacia el espejo móvil. En este interferómetro el haz incide a ${ang}° sobre el divisor, de modo que los dos brazos forman ${180 - 2 * ang}°.` },
      { t: 4, texto: 'Al volver, los dos haces se recombinan hacia el detector. Si el espejo móvil avanza x, el retardo es δ = 2x. Con δ = 0, λ, 2λ… las ondas llegan en fase (máximo); con δ = λ/2, 3λ/2… se anulan.' },
      { t: 10, texto: 'Con luz de una sola longitud de onda la señal es una cosenoide de periodo λ en δ, es decir, de frecuencia igual al número de onda σ. Con dos líneas, la señal es la suma de dos cosenoides y aparecen batidos.' },
      { t: 15, texto: 'La fuente infrarroja emite todos los números de onda a la vez. Solo en δ = 0 están todos en fase: allí aparece el pico central del interferograma, que se amortigua rápidamente a ambos lados.' },
      { t: 20, texto: `Un ${laserTxt} recorre el mismo camino. Su señal es una cosenoide perfecta: en cada paso por cero, cada λ/2 de retardo, se toma un punto del interferograma. Los piezoeléctricos del espejo fijo corrigen su inclinación (alineación dinámica).` },
    ],
    dibujar(g, t) {
      const C = g.C;
      const m = modo(t), d = delta(t), I = (1 + F(d, m)) / 2;
      const MM = [MM0[0] + din[0] * (d / 2) * PX, MM0[1] + din[1] * (d / 2) * PX];
      const colIR = C.foton;
      g.camara(12, 22, 342, 312, { titulo: 'Vista superior' });
      /* --- haces --- */
      const amp = 3.2, long = 13, fase = t * 9;
      onda(g, SRC, BS, { amp, long, fase, color: colIR, alpha: 0.9 });
      onda(g, BS, MF, { amp, long, fase, color: colIR, alpha: 0.75 });
      onda(g, BS, MM, { amp, long, fase, color: colIR, alpha: 0.75 });
      // salida: amplitud según la interferencia
      const k = t < 4 ? tramo(t, 2, 3.5) : 1;
      if (k > 0) onda(g, BS, [lerp(BS[0], DET[0], k), lerp(BS[1], DET[1], k) + 14 * k], { amp: 0.4 + 4.2 * I, long, fase, color: colIR, alpha: 0.35 + 0.6 * I, lw: 1.8 });
      /* --- piezas --- */
      g.circulo(SRC[0], SRC[1], 13, { fill: C.calor, alpha: 0.18 }); g.circulo(SRC[0], SRC[1], 6, { fill: C.calor });
      g.rotulo('Fuente + colimador', SRC[0] + 6, SRC[1] + 26, { size: 9.5 });
      espejo(g, MF, [0, -1], 24, C);
      espejo(g, MM, [-din[0], -din[1]], 24, C);
      // accionamiento del espejo móvil (detrás)
      const bk = [MM[0] + din[0] * 10, MM[1] + din[1] * 10];
      g.linea([bk, [MM0[0] + din[0] * 36, MM0[1] + din[1] * 36]], { color: C.metalOsc, lw: 3 });
      g.rect(MM0[0] + din[0] * 30 - 10, MM0[1] + din[1] * 30 - 9, 20, 18, { fill: C.metalOsc, r: 3, alpha: 0.85 });
      g.rotulo('Espejo móvil', MM0[0] + 4, MM0[1] - 34, { size: 9.5 });
      g.rotulo('Espejo fijo', MF[0] + 66, MF[1] + 4, { size: 9.5 });
      // piezoeléctricos del espejo fijo (alineación dinámica)
      const piezo = t > 20 ? Math.sin(t * 40) * 0.8 : 0;
      for (const dx of [-14, 0, 14]) g.rect(MF[0] + dx - 3, MF[1] + 6 + piezo * (dx / 14), 6, 9, { fill: C.foton, alpha: t > 20 ? 0.9 : 0.35, r: 1 });
      if (t > 20) g.texto('piezoeléctricos: 5000 correcciones/s', MF[0], MF[1] + 27, { size: 9, color: C.texto2, align: 'center' });
      // divisor de haz y su normal (ángulo de incidencia)
      const nb = [-(r[0] - din[0]), -(r[1] - din[1])], nl = Math.hypot(nb[0], nb[1]), n = [nb[0] / nl, nb[1] / nl];
      const pl = [-n[1], n[0]];
      g.linea([[BS[0] - pl[0] * 30, BS[1] - pl[1] * 30], [BS[0] + pl[0] * 30, BS[1] + pl[1] * 30]], { color: C.acento, lw: 4, cap: 'butt', alpha: 0.85 });
      if (t < 10) {
        g.linea([[BS[0] - n[0] * 38, BS[1] - n[1] * 38], [BS[0] + n[0] * 26, BS[1] + n[1] * 26]], { color: C.tenue, lw: 1, dash: [3, 3] });
        g.texto(`${ang}°`, BS[0] - 44, BS[1] + 26, { size: 11, color: C.acento, weight: 700 });
        g.texto(`${180 - 2 * ang}°`, BS[0] + 18, BS[1] + 24, { size: 11, color: C.texto2, weight: 700 });
      }
      g.rotulo('Divisor KBr/Ge', BS[0] - 72, BS[1] - 24, { size: 9.5, color: C.acento });
      // detector: brillo según la intensidad recombinada
      g.circulo(DET[0], DET[1], 16, { fill: colIR, alpha: 0.1 + 0.55 * I * k });
      g.rect(DET[0] - 12, DET[1] - 8, 24, 10, { fill: C.metalOsc, r: 2 });
      g.rotulo('Detector', DET[0] + 52, DET[1] - 4, { size: 9.5 });
      // superposición de las dos ondas (luz monocromática)
      if (t >= 4 && t < 10) {
        const x0 = 30, x1 = 118, ph = 2 * Math.PI * d;
        g.texto('brazo fijo', x0, 52, { size: 8.5, color: C.tenue });
        onda(g, [x0, 62], [x1, 62], { amp: 5, long: 22, fase: t * 6, color: colIR, lw: 1.2 });
        g.texto('brazo móvil', x0, 80, { size: 8.5, color: C.tenue });
        onda(g, [x0, 90], [x1, 90], { amp: 5, long: 22, fase: t * 6 + ph, color: colIR, lw: 1.2 });
        g.texto('suma', x0, 108, { size: 8.5, color: C.tenue });
        onda(g, [x0, 118], [x1, 118], { amp: 10 * Math.abs(Math.cos(ph / 2)), long: 22, fase: t * 6 + ph / 2, color: colIR, lw: 1.8 });
        g.texto(`δ = ${d.toFixed(2).replace('.', ',')} λ`, x0, 140, { size: 10, weight: 700, color: C.texto });
      }
      /* --- gráfica de la señal frente a δ --- */
      const G0 = 370, G1 = 628, Y0 = 34, Y1 = 196;
      g.rect(G0, Y0 - 12, G1 - G0, Y1 - Y0 + 34, { fill: C.panel, stroke: C.linea, r: 6 });
      g.texto(m === 'mono' ? 'Señal: una longitud de onda' : m === 'dos' ? 'Señal: dos longitudes de onda' : 'Interferograma (fuente continua)', G0 + 8, Y0 - 1, { size: 9.5, color: C.texto2, weight: 600 });
      const X = (dd) => G0 + 12 + ((dd + 3) / 6) * (G1 - G0 - 24), Yv = (v) => lerp(Y1 - 6, Y0 + 14, (1 + v) / 2);
      g.linea([[G0 + 12, Yv(0)], [G1 - 12, Yv(0)]], { color: C.rejilla, lw: 1 });
      g.linea([[X(0), Y0 + 10], [X(0), Y1 - 2]], { color: C.rejilla, lw: 1 });
      g.texto('δ = 0', X(0), Y1 + 10, { size: 9, color: C.tenue, align: 'center' });
      g.texto('retardo δ →', G1 - 12, Y1 + 10, { size: 9, color: C.tenue, align: 'right' });
      const dIni = t < 10 ? 0 : -3, dFin = t < 4 ? 0 : t >= 20 ? 3 : d;
      if (dFin > dIni) {
        const pts = [];
        for (let dd = dIni; dd <= dFin + 1e-6; dd += 0.01) pts.push([X(dd), Yv(F(dd, m) * 0.95)]);
        g.linea(pts, { color: colIR, lw: 1.5 });
      }
      if (t >= 4) { g.linea([[X(d), Y0 + 10], [X(d), Y1 - 2]], { color: C.acento, lw: 1, dash: [3, 3] }); g.circulo(X(d), Yv(F(d, m) * 0.95), 3.2, { fill: C.acento }); }
      /* --- láser de referencia y muestreo --- */
      if (t >= 20) {
        const L0 = 228, L1 = 318, kL = tramo(t, 20, 21);
        g.rect(G0, L0 - 10, G1 - G0, L1 - L0 + 18, { fill: C.panel, stroke: C.linea, r: 6, alpha: kL });
        g.texto('Láser: un punto cada λ/2', G0 + 8, L0 + 2, { size: 9.5, color: C.mal, weight: 600, alpha: kL });
        const yl = (v) => lerp(L1 - 8, L0 + 14, (1 + v) / 2), pts = [];
        for (let dd = -3; dd <= Math.min(3, d) + 1e-6; dd += 0.005) pts.push([X(dd), yl(Math.cos((2 * Math.PI * dd) / LAMBDA_L))]);
        if (pts.length > 1) g.linea(pts, { color: C.mal, lw: 1.2, alpha: kL });
        for (let j = Math.ceil(-3 / (LAMBDA_L / 2)); j * (LAMBDA_L / 2) <= Math.min(3, d); j++) {
          const dd = (j + 0.5) * (LAMBDA_L / 2);
          if (dd > Math.min(3, d) || dd < -3) continue;
          g.linea([[X(dd), yl(0) - 4], [X(dd), Yv(F(dd, m) * 0.95)]], { color: C.mal, lw: 0.6, alpha: 0.35 * kL, dash: [2, 3] });
          g.circulo(X(dd), Yv(F(dd, m) * 0.95), 2.6, { fill: C.mal, alpha: kL });
          g.circulo(X(dd), yl(0), 2, { fill: C.mal, alpha: kL });
        }
      }
      g.leyenda([[colIR, m === 'ancho' ? 'infrarrojo (continuo)' : 'luz monocromática', 'foton'], ...(t >= 20 ? [[C.mal, 'láser y puntos de muestreo']] : [])], 22, 346, { size: 9.5 });
    },
  };
}
