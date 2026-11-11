// Detector de placas de microcanales (MCP) en montaje chevron, con salida a ánodo o a centelleador + fotomultiplicador.
// Corte ampliado y no a escala (los canales reales miden 5–10 µm y su inclinación es menor): el ion golpea la pared de un canal,
// la cascada de electrones crece a lo largo del canal, pasa a la segunda placa y llega a la salida como un pulso de menos de 1 ns.
// Al final llegan varios iones de distinta m/z y el digitalizador construye el transitorio (señal frente a tiempo de vuelo).
// Todo es función de t (sin estado).
// Parámetros:
//   p.salida: 'anodo' (Bruker microflex, timsTOF, Shimadzu 9050) | 'centelleador' (Agilent 6546: MCP → centelleador → fotomultiplicador)
//   p.origen (texto: de dónde llegan los iones), p.vPlaca (texto opcional, tensión por placa), p.vMcp (texto opcional, potencial del MCP),
//   p.inicio (texto: qué marca t = 0, p. ej. 'el disparo del láser'), p.muestreo (texto opcional, p. ej. '2 GS/s'),
//   p.ganancia (texto, ganancia del par chevron; por defecto '10⁶–10⁷', valor habitual de la bibliografía).
import { tramo, suave, easeOut, lerp, azar, clamp } from '../dibujo.js';

const P1 = [200, 300], P2 = [306, 406], PY = [40, 306]; // placas (x0, x1) y altura
const PEN = 0.21;                // pendiente de los canales (exagerada para que se vea)
const MEDIO = 4.5;               // semianchura de un canal
const c1 = (j) => 54 + j * 22;   // centro de entrada del canal j de la placa 1
const c2 = (j) => 63 + j * 22;   // centro de entrada del canal j de la placa 2
const SAL = 446;                 // ánodo / centelleador
const J = 5;                     // canal protagonista

export default function crear(p = {}) {
  const centelleo = p.salida === 'centelleador';
  const origen = p.origen || 'Desde el tubo de vuelo';
  const gan = p.ganancia || '10⁶–10⁷';
  const inicio = p.inicio || 'el pulso de aceleración';

  // llegadas rápidas de la última fase: [instante, grupo m/z, canal]
  const R = azar(17);
  const grupos = [[0, 3], [1, 5], [2, 2]];
  const llegadas = [];
  let tt = 13.6;
  for (const [gI, n] of grupos) { for (let i = 0; i < n; i++) { llegadas.push({ t: tt, g: gI, j: 1 + Math.floor(R() * 9), dy: (R() - 0.5) * 6 }); tt += 0.22 + R() * 0.12; } tt += 0.55; }
  const posPico = [0.27, 0.52, 0.76]; // posición en el eje de tiempo de vuelo (t ∝ √(m/z))
  const colG = (C, gI) => C.m[[0, 2, 3][gI]];

  const fase2 = p.vPlaca
    ? `Por la inclinación, el ion no atraviesa el canal: choca contra su pared, semiconductora y de alta emisión secundaria, y arranca algunos electrones. Una tensión de ${p.vPlaca} entre las caras de la placa los acelera a lo largo del canal.`
    : 'Por la inclinación, el ion no atraviesa el canal: choca contra su pared, semiconductora y de alta emisión secundaria, y arranca algunos electrones. La diferencia de potencial entre las dos caras de la placa los acelera a lo largo del canal.';
  const fase4 = centelleo
    ? `Los electrones que salen del MCP se aceleran hacia un centelleador, que convierte su energía en un destello de luz. La luz llega a un fotomultiplicador a potencial de tierra: así la salida del MCP${p.vMcp ? `, a ${p.vMcp},` : ''} queda aislada de la electrónica de medida.`
    : 'La nube de electrones llega al ánodo como un pulso de corriente con un tiempo de subida inferior a 1 ns. Un pulso tan estrecho permite separar en el tiempo iones de masa muy próxima.';
  const fase5 = centelleo
    ? `El fotomultiplicador da un pulso eléctrico. Dos canales del digitalizador${p.muestreo ? ` de ${p.muestreo}` : ''}, de ganancia alta y baja, registran la misma señal: el de alta mide los picos débiles; el de baja, los intensos que saturan al primero. Juntos cubren cinco órdenes de magnitud.`
    : `El digitalizador${p.muestreo ? ` (${p.muestreo})` : ''} registra la señal del ánodo frente al tiempo transcurrido desde ${inicio}. Como t ∝ √(m/z), cada tiempo de llegada corresponde a una m/z; la suma de muchos transitorios forma el espectro.`;

  /* --- geometría de los canales --- */
  const yCanal1 = (j, x) => c1(j) + PEN * (x - P1[0]);
  const yCanal2 = (j, x) => c2(j) - PEN * (x - P2[0]);

  /** Electrones en zigzag dentro de un canal, de x0 a x1, progreso q, con n electrones visibles. */
  function zigzag(g, yc, x0, x1, q, nRebotes, n, semilla, r = 2.5) {
    // estela: la parte del canal que ya ha recorrido la cascada
    const xq = lerp(x0, x1, q);
    if (q > 0.02) g.linea([[x0, yc(x0)], [xq, yc(xq)]], { color: g.C.e, lw: 2 + 5 * q, alpha: 0.22 });
    for (let k = 0; k < n; k++) {
      const RJ = azar(semilla + k * 7);
      const qk = clamp(q - RJ() * 0.32 * Math.min(1, n / 8));
      const x = lerp(x0, x1, qk);
      const f = qk * nRebotes, i = Math.floor(f), fr = f - i;
      const lado = lerp(i % 2 ? 1 : -1, i % 2 ? -1 : 1, fr) * (MEDIO - 1.2) + (RJ() - 0.5) * 1.5;
      g.electron(x, yc(x) + lado, { r });
    }
  }

  function dibujarPlaca(g, x0, x1, yc) {
    const C = g.C;
    g.rect(x0, PY[0], x1 - x0, PY[1] - PY[0], { fill: C.metal, stroke: C.metalOsc, lw: 0.8, r: 2, alpha: 0.85 });
    for (let j = -1; j < 12; j++) {
      const a = yc(j, x0), b = yc(j, x1);
      if (Math.max(a, b) + MEDIO > PY[1] - 2 || Math.min(a, b) - MEDIO < PY[0] + 2) continue;
      g.linea([[x0, a - MEDIO], [x1, b - MEDIO], [x1, b + MEDIO], [x0, a + MEDIO]], { fill: C.vacio, cerrar: true });
    }
  }

  return {
    titulo: centelleo ? 'Detector MCP con centelleador' : 'Detector de placas de microcanales',
    dur: 18,
    fases: [
      { t: 0, texto: 'Los iones llegan al detector tras el tubo de vuelo. Una placa de microcanales (MCP) es una lámina con millones de canales paralelos de 5–10 µm, ligeramente inclinados respecto a la perpendicular de la placa. Aquí se montan dos placas en serie.' },
      { t: 3, texto: fase2 },
      { t: 6.4, texto: `Cada choque con la pared libera más electrones y la nube crece en cascada. Al salir pasa a varios canales de la segunda placa, inclinados al revés (montaje chevron): la ganancia total ronda ${gan} y los iones formados en los canales no vuelven a la entrada.` },
      { t: 11.6, texto: fase4 },
      { t: 13.6, texto: fase5 },
    ],
    dibujar(g, t) {
      const C = g.C;
      g.camara(6, 28, 628, 326, {});
      /* --- placas --- */
      dibujarPlaca(g, P1[0], P1[1], (j, x) => yCanal1(j, x));
      dibujarPlaca(g, P2[0], P2[1], (j, x) => yCanal2(j, x));
      g.rotulo('MCP 1', 250, 322, { size: 11 }); g.rotulo('MCP 2', 356, 322, { size: 11 });
      g.texto('−', P1[0] - 8, PY[0] + 8, { size: 13, color: C.texto2, align: 'center', weight: 700 });
      g.texto('+', P2[1] + 9, PY[0] + 8, { size: 13, color: C.texto2, align: 'center', weight: 700 });
      g.texto(p.vPlaca ? `${p.vPlaca} por placa` : p.vMcp ? `MCP ${p.vMcp}` : 'potencial creciente →', 303, 342, { size: 10, color: C.texto2, align: 'center', weight: 600 });
      g.texto('Esquema ampliado, no a escala', 550, 17, { size: 9.5, color: C.tenue, align: 'center', italic: true });

      /* --- salida: ánodo o centelleador + fotomultiplicador --- */
      const kPulso = tramo(t, 11.6, 11.9) * (1 - tramo(t, 12.2, 13));
      let brilloRapido = 0;
      for (const l of llegadas) { const d = t - l.t - 0.42; if (d > 0 && d < 0.25) brilloRapido = Math.max(brilloRapido, 1 - d / 0.25); }
      const kSal = Math.max(kPulso, brilloRapido);
      if (centelleo) {
        g.rect(SAL, 60, 12, 226, { fill: C.foton, stroke: C.metalOsc, lw: 0.8, r: 2, alpha: 0.45 + 0.5 * kSal });
        if (kSal > 0) g.circulo(SAL + 6, 172, 30, { fill: C.foton, alpha: 0.25 * kSal });
        g.rotulo('Centelleador', SAL + 4, 322, { size: 10.5 });
        // fotomultiplicador
        g.rect(500, 212, 104, 54, { fill: C.panel, stroke: C.metalOsc, lw: 1.2, r: 6 });
        g.linea([[506, 218], [506, 260]], { color: C.foton, lw: 3 });
        for (let i = 0; i < 4; i++) g.linea([[522 + i * 18, i % 2 ? 252 : 226], [534 + i * 18, i % 2 ? 252 : 226]], { color: C.metal, lw: 3 });
        g.rotulo('Fotomultiplicador', 552, 284, { size: 10.5 });
        g.texto('a tierra', 552, 302, { size: 9.5, color: C.tenue, align: 'center' });
        // luz entre centelleador y fotomultiplicador
        if (kSal > 0.05) for (let i = 0; i < 3; i++) g.foton(SAL + 14, 150 + i * 22, 504, 226 + i * 14, { k: clamp(kSal * 1.4), amp: 3, long: 8, lw: 1.3 });
      } else {
        g.electrodo(SAL, 60, 8, 226, {});
        if (kSal > 0) g.circulo(SAL + 4, 172, 26, { fill: C.e, alpha: 0.18 * kSal });
        g.rotulo('Ánodo', SAL + 4, 322, { size: 10.5 });
        g.linea([[SAL + 8, 240], [520, 240], [520, 252]], { color: C.metalOsc, lw: 2 });
        g.rect(472, 252, 142, 32, { fill: C.panel, stroke: C.metalOsc, lw: 1.2, r: 5 });
        g.texto(p.muestreo ? `Digitalizador · ${p.muestreo}` : 'Digitalizador', 543, 268.5, { size: 10.5, color: C.texto, align: 'center', weight: 600 });
      }

      /* --- ion protagonista --- */
      const yIon = c1(J) - 2.2, xHit = P1[0] + (MEDIO - 2.2) / PEN;
      if (t < 3.6) {
        const x = lerp(12, xHit, easeOut(tramo(t, 0.4, 3.6)) * 0.25 + tramo(t, 0.4, 3.6) * 0.75);
        g.ion(x, yIon, { r: 6.5, brillo: true, color: colG(C, 0) });
      }
      if (t < 3.2) g.rotulo(origen, 92, yIon - 30, { size: 10.5 });
      if (t >= 3.6 && t < 4.4) { const k = tramo(t, 3.6, 4.4); g.circulo(xHit, yIon - 2, 5 + 16 * k, { stroke: colG(C, 0), lw: 1.6, alpha: 1 - k }); }
      if (t >= 3.4 && t < 5.4) g.rotulo('choque con la pared', xHit - 6, yIon - 34, { size: 10, color: C.texto2, alpha: tramo(t, 3.5, 3.9) * (1 - tramo(t, 5, 5.4)) });
      // cascada en la placa 1
      if (t >= 3.8 && t < 8.6) {
        const q = tramo(t, 3.8, 8.4), n = Math.min(22, Math.round(2 * 2 ** (q * 4.6)));
        zigzag(g, (x) => yCanal1(J, x), xHit, P1[1], q, 5, n, 50);
      }
      // hueco entre placas y cascada en la placa 2 (tres canales)
      const destinos = [J - 1, J, J + 1];
      if (t >= 8.4 && t < 9.2) {
        const k = tramo(t, 8.4, 9.2), ys = yCanal1(J, P1[1]);
        for (let i = 0; i < 18; i++) { const RJ = azar(900 + i), d = destinos[i % 3]; g.electron(lerp(P1[1], P2[0] + 4, k), lerp(ys + (RJ() - 0.5) * 6, c2(d) + (RJ() - 0.5) * 4, k), { r: 2 }); }
      }
      if (t >= 9.2 && t < 11.7) {
        const q = tramo(t, 9.2, 11.5);
        destinos.forEach((d, i) => zigzag(g, (x) => yCanal2(d, x), P2[0], P2[1], q, 5, Math.min(i === 1 ? 18 : 12, Math.round(5 * 1.7 ** (q * 4))), 200 + i * 40, 2.2));
      }
      // nube hacia la salida
      if (t >= 11.3 && t < 12.1) {
        const k = easeOut(tramo(t, 11.3, 12.1));
        for (let i = 0; i < 46; i++) {
          const RJ = azar(1200 + i), d = destinos[i % 3], y0 = yCanal2(d, P2[1]);
          g.electron(lerp(P2[1], SAL - 2, k), lerp(y0 + (RJ() - 0.5) * 6, y0 + (RJ() - 0.5) * 40 * k, k), { r: 1.8, alpha: 1 - 0.5 * tramo(t, 11.9, 12.1) });
        }
      }
      if (t >= 6.4 && t < 11.6) g.rotulo('cascada de electrones', 353, yCanal2(J, 356) - 52, { size: 10, color: C.e, alpha: tramo(t, 6.5, 7) });

      /* --- llegadas rápidas de la última fase --- */
      for (const l of llegadas) {
        const d = t - l.t;
        if (d > -0.9 && d < 0) g.ion(lerp(12, P1[0], 1 + d / 0.9), c1(l.j) - 2 + l.dy * 0.2, { r: 5, color: colG(C, l.g) });
        if (d >= 0 && d < 0.45) {
          // versión rápida de la cascada: la nube recorre el canal de la placa 1, el de la placa 2 y llega a la salida
          const k = d / 0.45, x = lerp(P1[0] + 12, SAL - 4, k);
          const y = x < P1[1] ? yCanal1(l.j, x) : x < P2[0] ? yCanal1(l.j, P1[1]) : x < P2[1] ? yCanal2(l.j + 1, x) : yCanal2(l.j + 1, P2[1]);
          const n = 3 + Math.round(k * 14);
          for (let i = 0; i < n; i++) { const RJ = azar(2000 + i); g.electron(x - RJ() * 14 * k, y + (RJ() - 0.5) * (3 + 18 * k * k), { r: 1.9 }); }
        }
      }

      /* --- transitorio / canales del digitalizador --- */
      const picos = [];
      if (t >= 11.6) picos.push({ u: posPico[0], a: 1, t0: 11.6 });
      for (const l of llegadas) if (t >= l.t + 0.45) picos.push({ u: posPico[l.g] + l.dy * 0.0012, a: 1, t0: l.t + 0.45 });
      const señal = (u) => { let s = 0; for (const pk of picos) { const d = (u - pk.u) / 0.012; s += pk.a * Math.exp(-0.5 * d * d); } return s; };
      if (centelleo) {
        const gr = [['Canal de ganancia alta', 0.55, 30], ['Canal de ganancia baja', 0.14, 112]];
        for (const [tit, esc, y] of gr) {
          g.grafico(468, y, 164, 74, (u) => Math.min(1, señal(u) * esc), { titulo: tit, color: C.e, ejeX: 'tiempo →', n: 220 });
          if (esc > 0.3 && picos.some((pk) => pk.u > 0.5 && pk.u < 0.54) && t > 14.8) g.texto('saturado', 622, y + 24, { size: 9, color: C.mal, align: 'right', weight: 700 });
        }
      } else {
        g.grafico(468, 30, 164, 130, (u) => Math.min(1, señal(u) * 0.2), { titulo: 'Señal frente al tiempo', color: C.e, ejeX: 'tiempo de vuelo →', n: 220 });
        if (t > 14) {
          g.texto('m/z baja', 474 + posPico[0] * 152, 58, { size: 9, color: colG(C, 0), align: 'center', weight: 700 });
          g.texto('m/z alta', 474 + posPico[2] * 152, 58, { size: 9, color: colG(C, 2), align: 'center', weight: 700, alpha: tramo(t, 16.2, 16.6) });
        }
      }

      g.leyenda([[colG(C, 0), 'ion ligero'], [colG(C, 1), 'intermedio'], [colG(C, 2), 'pesado'], [C.e, 'electrón', 'e']], 14, 16, { size: 10 });
    },
  };
}
