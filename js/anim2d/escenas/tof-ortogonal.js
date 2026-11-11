// TOF de aceleración ortogonal (oa-TOF): pulsador, tubo de vuelo con reflectrón y trayectoria en V.
// Un haz continuo (o en paquetes) entra en el pulsador. Cada pulso de alta tensión empuja hacia el tubo los iones que hay entre las
// placas; como conservan su velocidad a lo largo del haz, avanzan en diagonal. Las dos componentes de la velocidad son ∝ 1/√m, de
// modo que el ángulo es el mismo para todas las m/z y todas llegan al mismo detector, los ligeros antes. Mientras el paquete vuela,
// el haz vuelve a llenar el pulsador: los iones que lo cruzan entre pulsos se pierden (ciclo de trabajo).
// Todo es función de t; los iones del haz se repiten con el periodo de la escena, así que el bucle no tiene saltos.
// La componente a lo largo del haz está muy exagerada (en un equipo real el ángulo es de pocos grados).
// Parámetros: p.frecuencia (kHz de los pulsos; null = sin cifra) · p.variante (null | 'slicer' | 'acumulacion')
//   p.origen (rótulo del haz de entrada) · p.pulsador (rótulo) · p.reflector (rótulo) · p.detector (rótulo)
//   p.invertir (true: el tubo hacia abajo, como en el Shimadzu LCMS-9050).
import { tramo, suave, lerp, azar } from '../dibujo.js';
import { num, panelSenal, destello } from './_util-analizadores.js';

export default function crear(p = {}) {
  const fk = p.frecuencia || null;
  const variante = p.variante || null;
  const inv = !!p.invertir;
  const nomPul = p.pulsador || 'Pulsador';
  const nomRef = p.reflector || 'Reflectrón';
  const nomDet = p.detector || 'Detector';
  const origen = p.origen || (variante === 'acumulacion' ? 'Celda de colisión' : 'Haz continuo de iones');

  const dur = 18, P = 6, P0 = 2.0;                       // tres pulsos por ciclo: 2, 8 y 14 s
  const YB = 312, YA = YB - 40, YR = 95, YD = 292, DR = 50;
  const PX0 = 120, PX1 = 250, XSTOP = 290, XIN = variante === 'acumulacion' ? 92 : 6;
  const RAZON = 0.306;                                   // vx/vy: desplazamiento a lo largo del haz durante el vuelo
  const D = RAZON * (80 + (YA - YR) + 4 * DR + (YD - YR));
  const VY = [272, 192, 136];                            // px/s para m/z baja, media y alta (∝ 1/√m: masas 1 : 2 : 4)
  const VX = VY.map((v) => v * RAZON);
  const TF = VY.map((v) => (80 + (YA - YR) + 4 * DR + (YD - YR)) / v);
  const Y = (y) => (inv ? 360 - y : y);

  const DT = 0.12, N = Math.round(dur / DT);             // un ion nuevo cada 0,12 s; patrón periódico de N iones
  const R = azar(5);
  const tipo = Array.from({ length: N }, () => Math.floor(R() * 3));
  const jit = Array.from({ length: N }, () => R() - 0.5);
  const jit2 = Array.from({ length: N }, () => R() - 0.5);
  const pulsoAntes = (t) => Math.floor((t - P0) / P) * P + P0;   // último pulso ≤ t

  /** Vuelo de un ion empujado: posición vertical (mundo) a τ s del pulso. */
  function vuelo(tau, vy) {
    const t1 = 80 / vy, t2 = t1 + (YA - YR) / vy, t3 = t2 + (4 * DR) / vy;
    if (tau < t1) return YB - 0.5 * (vy * vy / 80) * tau * tau;
    if (tau < t2) return YA - vy * (tau - t1);
    if (tau < t3) { const s = tau - t2; return YR - (vy * s - 0.5 * (vy * vy / (2 * DR)) * s * s); }
    return YR + vy * (tau - t3);
  }

  /** Iones presentes en el instante t: lista de { x, y, i, est } (est: 'haz' | 'vuelo' | 'llega' | 'pierde'). */
  function iones(t) {
    const out = [];
    const tP = pulsoAntes(t);
    if (variante === 'acumulacion') {
      // paquetes liberados 2 s antes de cada pulso, durante 0,3 s
      for (const tk of [tP - P, tP, tP + P]) {
        const tr = tk - 2.0;
        for (let j = 0; j < 18; j++) {
          const i = j % 3, ts = tr + (0.3 * j) / 18;
          if (t < ts) continue;
          const xk = XIN + VX[i] * (tk - ts);
          const yy = YB + jit[j] * 6;
          if (t < tk) { out.push({ x: XIN + VX[i] * (t - ts), y: yy, i, est: 'haz' }); continue; }
          const tau = t - tk;
          if (tau < TF[i]) out.push({ x: xk + VX[i] * tau, y: vuelo(tau, VY[i]) + (yy - YB), i, est: 'vuelo', tk });
          else if (tau < TF[i] + 0.45) out.push({ x: xk + D, y: YD, i, est: 'llega', k: (tau - TF[i]) / 0.45, tk });
        }
      }
      return out;
    }
    const j0 = Math.floor((t - 14) / DT), j1 = Math.floor(t / DT);
    for (let j = j0; j <= j1; j++) {
      const m = ((j % N) + N) % N, i = tipo[m], s = j * DT;
      let x = XIN + VX[i] * (t - s);
      // ¿lo alcanza algún pulso dentro del pulsador?
      const tEnt = s + (PX0 - XIN) / VX[i], tSal = s + (PX1 - XIN) / VX[i];
      let tk = Math.ceil((tEnt - P0) / P) * P + P0;
      const empujado = tk <= tSal && tk <= t;
      let yy = YB + jit[m] * 5;
      if (variante === 'slicer') {
        // antes de la lente y del slicer el haz es más ancho y algunos iones llevan velocidad transversal
        const pend = jit2[m] * 0.5, y0 = jit[m] * 10, malo = Math.abs(jit2[m]) > 0.28;
        const ySin = YB + y0 + pend * (Math.min(x, 70) - XIN);
        if (malo && x >= 70) {
          const tc = s + (70 - XIN) / VX[i];
          if (t - tc < 0.4) out.push({ x: 70, y: ySin, i, est: 'pierde', k: (t - tc) / 0.4 });
          continue;
        }
        if (x < 78) yy = lerp(ySin, yy, tramo(x, 34, 74));
      }
      if (!empujado) {
        if (x < XSTOP) out.push({ x, y: yy, i, est: 'haz' });
        else if (t - (s + (XSTOP - XIN) / VX[i]) < 0.4) out.push({ x: XSTOP, y: yy, i, est: 'pierde', k: (t - (s + (XSTOP - XIN) / VX[i])) / 0.4 });
        continue;
      }
      const xk = XIN + VX[i] * (tk - s), tau = t - tk;
      if (tau < TF[i]) out.push({ x: xk + VX[i] * tau, y: vuelo(tau, VY[i]) + (yy - YB), i, est: 'vuelo', tk });
      else if (tau < TF[i] + 0.45) out.push({ x: xk + D, y: YD, i, est: 'llega', k: (tau - TF[i]) / 0.45, tk });
    }
    return out;
  }

  const periodo = fk ? 1000 / fk : null;                 // µs
  const txtFrec = fk ? ` A unos ${num(fk)} kHz hay un espectro completo cada ${num(periodo, 0)} µs; cada espectro guardado suma miles.` : ' Cada espectro guardado suma miles de pulsos.';
  const fases = variante === 'acumulacion'
    ? [
      { t: 0, texto: 'Los iones se acumulan en la celda de colisión y salen hacia el acelerador ortogonal en paquetes cortos, a lo largo de un eje perpendicular al tubo de vuelo.' },
      { t: P0 - 0.2, texto: 'Cuando el paquete está entre las placas, un pulso de alta tensión lo empuja hacia el tubo. Los iones conservan su velocidad a lo largo del eje, por eso avanzan en diagonal.' },
      { t: P0 + 2.2, texto: 'El reflectrón los devuelve y llegan al detector: primero los ligeros, después los pesados. Todas las m/z siguen el mismo ángulo y caen en el mismo detector.' },
      { t: P0 + P - 2.2, texto: 'Mientras tanto la celda reúne el paquete siguiente y lo libera justo a tiempo para el próximo pulso: casi ningún ion cruza el acelerador sin ser aprovechado.' + txtFrec },
    ]
    : [
      { t: 0, texto: `Un haz continuo de iones entra en el ${nomPul.toLowerCase()}, perpendicular al tubo de vuelo. Todos llevan una energía pequeña y parecida a lo largo del haz.` },
      { t: P0 - 0.2, texto: 'Un pulso de alta tensión empuja hacia el tubo la porción de haz que hay entre las placas. Los iones conservan su velocidad a lo largo del haz, por eso avanzan en diagonal.' },
      { t: P0 + 2.2, texto: 'El reflectrón los devuelve y llegan al detector: primero los ligeros, después los pesados. Todas las m/z siguen el mismo ángulo y caen en el mismo detector.' },
      { t: P0 + P - 1.2, texto: 'Mientras el paquete vuela, el pulsador se vuelve a llenar. El siguiente pulso llega cuando ha aterrizado el ion más pesado; los iones que cruzan entretanto se pierden.' + txtFrec },
      ...(variante === 'slicer' ? [{ t: P0 + 2 * P - 1, texto: 'Antes del pulsador, una lente aplana el haz y el slicer, una serie de rendijas horizontales, elimina los iones con demasiada velocidad transversal. Así el paquete sale más uniforme y mejoran la resolución y la exactitud.' }] : []),
    ];

  return {
    titulo: 'TOF de aceleración ortogonal',
    dur,
    fases,
    dibujar(g, t) {
      const C = g.C;
      const tP = pulsoAntes(t), kP = 1 - tramo(t - tP, 0, 0.45);   // brillo del pulso

      /* --- tubo de vuelo y reflectrón --- */
      const yT0 = Math.min(Y(100), Y(286)), yT1 = Math.max(Y(100), Y(286));
      g.camara(96, Math.min(Y(28), Y(300)), 368, 272, {});
      for (let k = 0; k < 6; k++) {
        const y = Y(36 + k * 11);
        g.electrodo(100, y - 2, 14, 4, { color: C.metal });
        g.electrodo(446, y - 2, 14, 4, { color: C.metal });
      }
      g.rotulo(nomRef, 280, Y(14), { size: 11 });
      g.texto('Tubo', 48, Y(184), { size: 11, color: C.tenue, align: 'center', weight: 600 });
      g.texto('de vuelo', 48, Y(184) + 14, { size: 11, color: C.tenue, align: 'center', weight: 600 });
      // trayectoria en V (la misma para todas las m/z): guía discontinua desde el centro del pulsador
      const guia = [];
      for (let k = 0; k <= 80; k++) { const tau = (TF[1] * k) / 80; guia.push([(PX0 + PX1) / 2 + VX[1] * tau, Y(vuelo(tau, VY[1]))]); }
      g.linea(guia, { color: C.tenue, lw: 1, dash: [4, 4], alpha: 0.7 });
      // detector
      g.electrodo(PX0 + D - 6, Y(YD) - (inv ? 0 : 8), PX1 - PX0 + 12, 8, { color: C.metalOsc });
      g.rotulo(nomDet, PX0 + D + (PX1 - PX0) / 2, Y(330), { size: 11 });

      /* --- haz y pulsador --- */
      const yPl = Y(YB + 13), yRe = Y(YB - 13), yAc = Y(YA);
      g.electrodo(PX0, yPl - 3, PX1 - PX0, 6, { color: kP > 0.02 ? mezcla(C.metal, C.ion, kP) : C.metal });
      g.linea([[PX0, yRe], [PX1, yRe]], { color: C.metalOsc, lw: 1.2, dash: [3, 2] });
      g.linea([[PX0, yAc], [PX1, yAc]], { color: C.metalOsc, lw: 1.2, dash: [3, 2] });
      g.rotulo(nomPul, (PX0 + PX1) / 2 + 12, Y(344), { size: 11 });
      if (kP > 0.02) {
        g.texto('+ kV', PX1 + 8, yPl, { size: 10.5, color: C.ion, weight: 700, alpha: kP });
        for (const x of [PX0 + 25, (PX0 + PX1) / 2, PX1 - 25]) g.flecha(x, yPl + (inv ? 4 : -4), x, yAc + (inv ? -6 : 6), { color: C.campo, lw: 1.2, punta: 5, alpha: kP });
      }
      g.electrodo(XSTOP + 2, Y(YB) - 12, 5, 24, { color: C.metalOsc });
      // entrada: variantes
      if (variante === 'slicer') {
        g.electrodo(30, Y(YB) - 26, 5, 16, {}); g.electrodo(30, Y(YB) + 10, 5, 16, {});
        for (let k = -3; k <= 3; k++) if (k) g.electrodo(68, Y(YB) + k * 6 - 1.5, 14, 3, { color: C.metalOsc });
        g.rotulo('Slicer', 77, Y(YB) + (inv ? 36 : -36), { size: 10.5 });
        g.rotulo('Lente', 28, Y(YB) + (inv ? 36 : -36), { size: 10.5 });
      } else if (variante === 'acumulacion') {
        g.rect(4, Y(YB) - 20, 78, 40, { fill: C.vacio, stroke: C.linea, lw: 1.2, r: 6 });
        const tr = pulsoAntes(t + 2.0) - 2.0;            // última apertura de la celda
        const abierta = t - tr < 0.35;
        g.electrodo(84, Y(YB) - 20, 5, 40, { color: abierta ? C.ok : C.metalOsc });
        g.rotulo(origen, 4, Y(YB) + (inv ? -34 : 34), { size: 10.5, align: 'left' });
        // iones acumulándose dentro de la celda (se vacía al abrirse)
        const n = t - tr < 0.3 ? 18 - Math.floor((18 * (t - tr)) / 0.3) : Math.floor(18 * tramo(t, tr + 0.3, tr + P));
        const Rr = azar(9);
        for (let j = 0; j < 18; j++) {
          const x = 14 + Rr() * 62 + Math.sin(t * 3 + j) * 3, y = Y(YB) + (Rr() - 0.5) * 26 + Math.cos(t * 2.6 + j * 2) * 2;
          if (j < n) g.ion(x, y, { r: 3.6, color: C.m[j % 3], signo: false });
        }
      }
      if (variante !== 'acumulacion') g.rotulo(origen, 4, Y(YB) + (inv ? -36 : 36), { size: 10.5, align: 'left' });

      /* --- iones --- */
      const lista = iones(t);
      for (const q of lista) {
        const col = C.m[q.i];
        if (q.est === 'pierde') { if (q.k > 0 && q.k < 1) g.circulo(q.x, Y(q.y), 2 + 6 * q.k, { stroke: C.mal, lw: 1.2, alpha: 1 - q.k }); continue; }
        if (q.est === 'llega') { destello(g, q.x, Y(q.y), q.k, { color: col, r: 9 }); continue; }
        g.ion(q.x, Y(q.y), { r: 4.6, color: col, signo: false, alpha: tramo(q.x, XIN, XIN + 14) });
      }
      // altura de los picos: iones de cada m/z que empujó el último pulso
      const llegados = contarPaquete(tP);

      /* --- señal del último pulso --- */
      const tau = t - tP;
      const picos = TF.map((tf, i) => ({ u: tf / P, s: 0.012, a: Math.min(1, 0.12 * llegados[i]), color: C.m[i] }));
      const ticks = [[0, '0']];
      if (periodo) ticks.push([1, `${num(periodo, 0)} µs`]);
      panelSenal(g, 474, 104, 158, 132, { titulo: 'Señal tras el pulso', picos, u1: tau / P, cursor: true, ticks });
      g.texto(fk ? `Pulsos ≈ ${num(fk)} kHz` : 'Un pulso tras otro', 553, 254, { size: 11, color: C.texto2, align: 'center', weight: 600 });
      if (periodo) g.texto(`uno cada ${num(periodo, 0)} µs`, 553, 270, { size: 10.5, color: C.tenue, align: 'center' });
      ['m/z baja', 'm/z media', 'm/z alta'].forEach((txt, i) => { g.circulo(484, 26 + i * 18, 4.5, { fill: C.m[i] }); g.texto(txt, 494, 26.5 + i * 18, { size: 10.5, color: C.texto2 }); });
    },
  };

  /** Número de iones de cada m/z que empujó el pulso tk (para la altura de los picos). */
  function contarPaquete(tk) {
    const c = [0, 0, 0];
    if (variante === 'acumulacion') { for (let j = 0; j < 18; j++) c[j % 3]++; return c; }
    const j0 = Math.floor((tk - 14) / DT), j1 = Math.floor(tk / DT);
    for (let j = j0; j <= j1; j++) {
      const m = ((j % N) + N) % N, i = tipo[m], s = j * DT;
      if (variante === 'slicer' && Math.abs(jit2[m]) > 0.28) continue;
      const x = XIN + VX[i] * (tk - s);
      if (x >= PX0 && x <= PX1) c[i]++;
    }
    return c;
  }
}

function mezcla(a, b, k) {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const c = [16, 8, 0].map((s) => Math.round(((pa >> s) & 255) * (1 - k) + ((pb >> s) & 255) * k));
  return '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
}
