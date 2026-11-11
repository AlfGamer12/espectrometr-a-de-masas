// Cromatografía de gases en columna capilar: inyección, reparto de cada compuesto entre el helio y la película de fase estacionaria,
// separación en bandas y llegada a la fuente de iones mientras se dibuja el cromatograma.
// Las trayectorias se precalculan (reparto estocástico entre fases, _util-servicios.js) y la escena se dibuja como función pura de t.
// El programa de temperatura se modela reduciendo k con el tiempo. Parámetros:
//   p.columna (texto de la columna), p.espesor (texto del espesor de película, p. ej. '0,25 µm'), p.gas ('helio'), p.caudal (texto),
//   p.inyector (texto de la temperatura del inyector), p.interfaz (nombre), p.destino (nombre),
//   p.final (texto de la última fase; si falta se construye con p.columna y p.caudal).
import { tramo, suave, lerp, azar, clamp } from '../dibujo.js';
import { simularReparto } from './_util-servicios.js';

const TX0 = 40, TX1 = 600, TY0 = 132, TY1 = 214; // tubo ampliado
const FILM = 8;
const T_INY = 2.6;

export default function crear(p = {}) {
  const gas = p.gas || 'helio';
  const interfaz = p.interfaz || 'Interfaz calefactada';
  const destino = p.destino || 'Fuente de iones';
  const comps = [0.7, 2.4, 7].map((k0) => ({ k: (t) => k0 * Math.exp(-Math.max(0, t - T_INY) / 7) }));
  const sim = simularReparto({ comps, n: 22, dur: 18, tIny: T_INY, x0: TX0 + 6, x1: TX1 - 2, u: 230, dwell: 0.12, ancho: 8, semilla: 9 });
  // escala del cromatograma y tiempos de los picos
  let max = 0;
  for (let i = 0; i <= 300; i++) max = Math.max(max, sim.senal(null, (i / 300) * 18));
  const tPico = [0, 1, 2].map((c) => { const ll = sim.mols.filter((m) => m.c === c && m.llegada != null).map((m) => m.llegada).sort((a, b) => a - b); return ll[Math.floor(ll.length / 2)] ?? 99; });
  const GT = 17; // segundos representados en el eje del cromatograma

  const final = p.final || `${p.columna ? `Columna: ${p.columna}` : 'Columna capilar de sílice fundida'}${p.caudal ? `, con ${p.caudal} de ${gas}` : ''}. Cada compuesto queda caracterizado por dos datos: su tiempo de retención y su espectro de masas.`;

  return {
    titulo: 'Separación por cromatografía de gases',
    dur: 18,
    fases: [
      { t: 0, texto: `La muestra líquida se inyecta en el inyector caliente${p.inyector ? ` (${p.inyector})` : ''}, donde se vaporiza. El gas portador, ${gas}, arrastra el vapor hacia la columna capilar, enrollada dentro del horno.` },
      { t: 2.8, texto: `La pared interna de la columna está cubierta por una película de fase estacionaria${p.espesor ? ` de ${p.espesor}` : ''}. Cada molécula pasa una y otra vez del gas a la película y vuelve; solo avanza mientras está en el gas.` },
      { t: 6.2, texto: `Cuanto más afín es un compuesto a la fase estacionaria y menos volátil es, más tiempo pasa retenido y más despacio avanza: la mezcla se separa en bandas. La rampa de temperatura del horno acelera la salida de los más retenidos.` },
      { t: 10.4, texto: `Las bandas salen de la columna por la ${interfaz.toLowerCase()} y llegan de una en una a la fuente de iones. La señal del espectrómetro frente al tiempo es el cromatograma: un pico por compuesto.` },
      { t: 14.6, texto: final },
    ],
    dibujar(g, t) {
      const C = g.C, fase = C.foton;
      /* ---------- esquema superior ---------- */
      // inyector
      g.rect(30, 44, 44, 62, { fill: C.calor, alpha: 0.12, r: 4 });
      g.rect(30, 44, 44, 62, { stroke: C.metalOsc, lw: 1.2, r: 4 });
      g.rect(46, 50, 12, 50, { fill: C.vacio, stroke: C.metalOsc, lw: 0.8 }); // liner
      g.rect(42, 40, 20, 6, { fill: C.metalOsc, r: 2 });                       // septum
      const kJ = tramo(t, 0.3, 1.6), sale = tramo(t, 1.8, 2.4);
      // jeringa del inyector automático: la aguja atraviesa el septum, descarga y sale
      const baja = kJ * (1 - sale) * 18;
      g.linea([[52, 20 + baja], [52, 40 + baja]], { color: C.metalOsc, lw: 1.6 });
      g.rect(45, 2 + baja, 14, 18, { fill: C.metal, stroke: C.metalOsc, lw: 0.8, r: 2, alpha: 0.9 });
      g.rect(48, 4 + baja, 8, 14 * (1 - kJ), { fill: C.liquido, alpha: 0.6 });
      if (t > 1.2 && t < 3) { const k = tramo(t, 1.2, 3); for (let i = 0; i < 6; i++) { const RJ = azar(60 + i); g.circulo(48 + RJ() * 8, 70 + RJ() * 24 + k * 6, 2.2, { fill: C.m[i % 3], alpha: 1 - k }); } }
      g.rotulo('Inyector', 52, 120, { size: 10 });
      // horno con la columna enrollada
      g.rect(100, 24, 200, 86, { fill: C.calor, alpha: 0.06 + 0.1 * tramo(t, T_INY, 15), r: 6 });
      g.rect(100, 24, 200, 86, { stroke: C.linea, lw: 1.2, r: 6 });
      g.texto('Horno', 108, 34, { size: 10, color: C.tenue, weight: 600 });
      for (let i = 0; i < 4; i++) g.circulo(200, 67, 18 + i * 5, { stroke: '#c8902e', lw: 1.6, alpha: 0.9 });
      g.linea([[74, 98], [100, 98], [182, 74]], { color: '#c8902e', lw: 1.6 });
      g.linea([[223, 70], [300, 70], [340, 70]], { color: '#c8902e', lw: 1.6 });
      g.medidor(238, 96, 54, tramo(t, T_INY, 15), { color: C.calor });
      g.texto('T', 232, 99, { size: 9.5, color: C.calor, align: 'right', weight: 700 });
      // interfaz y fuente
      g.rect(340, 60, 90, 20, { fill: C.calor, alpha: 0.14, r: 3 });
      g.rect(340, 60, 90, 20, { stroke: C.metalOsc, lw: 1, r: 3 });
      g.linea([[340, 70], [446, 70]], { color: '#c8902e', lw: 1.6 });
      g.rotulo(interfaz, 385, 44, { size: 10 });
      g.rect(446, 46, 70, 48, { fill: C.vacio, stroke: C.linea, lw: 1.2, r: 6 });
      g.texto(destino, 481, 104, { size: 10, color: C.texto2, align: 'center', weight: 600 });
      g.texto('MS', 481, 70, { size: 12, color: C.tenue, align: 'center', weight: 700 });
      // indicador de detalle
      g.linea([[190, 86], [TX0, TY0 - 2]], { color: C.tenue, lw: 0.8, dash: [3, 3] });
      g.linea([[210, 86], [TX1, TY0 - 2]], { color: C.tenue, lw: 0.8, dash: [3, 3] });
      g.circulo(200, 86, 5, { stroke: C.tenue, lw: 1 });

      /* ---------- tubo ampliado ---------- */
      g.rect(TX0, TY0, TX1 - TX0, TY1 - TY0, { fill: C.vacio });
      g.rect(TX0, TY0, TX1 - TX0, 4, { fill: C.metalOsc }); g.rect(TX0, TY1 - 4, TX1 - TX0, 4, { fill: C.metalOsc });
      g.rect(TX0, TY0 + 4, TX1 - TX0, FILM, { fill: fase, alpha: 0.38 }); g.rect(TX0, TY1 - 4 - FILM, TX1 - TX0, FILM, { fill: fase, alpha: 0.38 });
      // flujo del gas portador
      for (let i = 0; i < 7; i++) { const x = TX0 + 20 + ((t * ((TX1 - TX0 - 40) * 2 / 18) + i * 80) % (TX1 - TX0 - 40)); g.flecha(x, TY0 + 41, x + 16, TY0 + 41, { color: C.gas, lw: 1.2, punta: 5, alpha: 0.55 }); }
      // moléculas
      const gy0 = TY0 + 4 + FILM + 5, gy1 = TY1 - 4 - FILM - 5;
      if (t >= T_INY) for (const m of sim.mols) {
        const { x, movil } = sim.pos(m, t);
        if (x > TX1 - 3) continue;
        const y = movil ? lerp(gy0, gy1, m.sy) + Math.sin(t * 7 + m.sz * 20) * 1.5 : (m.lado < 0 ? TY0 + 4 + FILM / 2 : TY1 - 4 - FILM / 2);
        g.circulo(x, y, 3, { fill: C.m[m.c], alpha: movil ? 1 : 0.85 });
      }
      g.rotulo(`Fase estacionaria${p.espesor ? ` (${p.espesor})` : ''}`, 150, TY1 + 13, { size: 10 });
      g.rotulo(`${gas[0].toUpperCase() + gas.slice(1)}, gas portador →`, 470, TY1 + 13, { size: 10, color: C.texto2 });
      g.texto('Detalle de la columna (corte, no a escala)', TX1, TY0 - 8, { size: 9.5, color: C.tenue, align: 'right', italic: true });

      /* ---------- cromatograma ---------- */
      const GX = TX0, GY = 238, GW = TX1 - TX0, GH = 98;
      g.rect(GX, GY, GW, GH, { fill: C.panel, stroke: C.linea, r: 4 });
      g.texto('Cromatograma', GX + 8, GY + 11, { size: 10, color: C.texto2, weight: 600 });
      g.texto('tiempo de retención →', GX + GW - 8, GY + GH - 6, { size: 9, color: C.tenue, align: 'right' });
      const base = GY + GH - 16, alto = GH - 36, xg = (tt) => GX + 8 + (tt / GT) * (GW - 16);
      g.linea([[GX + 8, base], [GX + GW - 8, base]], { color: C.tenue, lw: 0.8 });
      const tf = Math.min(t, GT);
      for (let c = 0; c < 3; c++) {
        const pts = [[xg(0), base]];
        for (let i = 0; i <= 160; i++) { const tt = (i / 160) * tf; pts.push([xg(tt), base - (sim.senal(c, tt) / max) * alto * 0.92]); }
        pts.push([xg(tf), base]);
        g.linea(pts, { fill: C.m[c], alpha: 0.25, cerrar: true });
      }
      const tot = [];
      for (let i = 0; i <= 200; i++) { const tt = (i / 200) * tf; tot.push([xg(tt), base - (sim.senal(null, tt) / max) * alto * 0.92]); }
      g.linea(tot, { color: C.texto2, lw: 1.4 });
      if (t >= T_INY) g.texto('inyección', xg(T_INY), base + 9, { size: 8.5, color: C.tenue, align: 'center' });
      ['A', 'B', 'C'].forEach((s, c) => { if (t > tPico[c] + 0.3 && tPico[c] < GT) g.texto(s, xg(tPico[c]), GY + 20, { size: 11, color: C.m[c], align: 'center', weight: 800 }); });
      g.leyenda([[C.m[0], 'compuesto A'], [C.m[1], 'B'], [C.m[2], 'C (más retenido)'], [fase, 'fase estacionaria']], TX0, 351, { size: 10 });
    },
  };
}
