// Cromatografía de líquidos (HPLC/UHPLC o nano-LC) en fase reversa: bombas con gradiente, inyección, reparto de los analitos entre la
// fase móvil y las partículas C18 de la columna, elución en bandas hacia la fuente de iones y cromatograma.
// Las trayectorias se precalculan (reparto estocástico, _util-servicios.js); el gradiente se modela reduciendo k con el tiempo.
// Todo es función de t (sin estado). Parámetros:
//   p.nano (bool: nano-LC, p. ej. Bruker nanoElute), p.sistema (nombre del cromatógrafo), p.caudal, p.presion, p.columna (textos),
//   p.destino (nombre de la fuente), p.final (texto opcional añadido a la última fase).
import { tramo, suave, lerp, azar, clamp } from '../dibujo.js';
import { simularReparto } from './_util-servicios.js';

const TX0 = 40, TX1 = 600, TY0 = 132, TY1 = 214;
const FILAS = [148, 173, 198], RP = 10.5, PX = 26; // partículas de la vista ampliada
const CARRILES = [160.5, 185.5];
const T_INY = 2.4;

export default function crear(p = {}) {
  const nano = !!p.nano;
  const caudal = p.caudal || (nano ? '50–2000 nL/min' : '0,2–0,6 mL/min');
  const presion = p.presion || (nano ? '≈ 1000 bar' : 'decenas de MPa');
  const destino = p.destino || (nano ? 'el emisor nanoESI' : 'la fuente de electrospray');
  const comps = [0.9, 3.2, 10].map((k0) => ({ k: (t) => k0 * Math.exp(-Math.max(0, t - T_INY) / 4.6) }));
  const sim = simularReparto({ comps, n: 22, dur: 18, tIny: T_INY, x0: TX0 + 6, x1: TX1 - 2, u: 210, dwell: 0.14, ancho: 8, semilla: 21 });
  let max = 0;
  for (let i = 0; i <= 300; i++) max = Math.max(max, sim.senal(null, (i / 300) * 18));
  const tPico = [0, 1, 2].map((c) => { const ll = sim.mols.filter((m) => m.c === c && m.llegada != null).map((m) => m.llegada).sort((a, b) => a - b); return ll[Math.floor(ll.length / 2)] ?? 99; });
  const GT = 17;
  const offFila = (r) => (r % 2 ? PX / 2 : 0);

  const f1 = nano
    ? `Las bombas impulsan la fase móvil a caudales de nanolitros por minuto (${caudal}) y presiones de ${presion}, y mezclan dos disolventes, A (agua con ácido fórmico) y B (acetonitrilo), para formar un gradiente.`
    : `Las bombas de alta presión impulsan la fase móvil a caudal constante (${caudal}) y mezclan dos disolventes, A (agua con ácido fórmico al 0,1 %) y B (acetonitrilo), para formar un gradiente.`;

  return {
    titulo: nano ? 'Separación por nano-LC' : 'Separación por cromatografía de líquidos',
    dur: 18,
    fases: [
      { t: 0, texto: f1 },
      { t: 3, texto: 'El automuestreador toma un volumen preciso de muestra del vial y lo introduce en el flujo de fase móvil, que lo lleva hasta la cabeza de la columna.' },
      { t: 6.2, texto: `La columna${nano ? ', capilar,' : ''} está rellena de partículas de sílice de pocos micrómetros con cadenas C18 enlazadas (fase reversa, apolar). Los analitos se reparten entre la fase móvil y la superficie C18: los más polares apenas se retienen y salen antes.` },
      { t: 10, texto: `Al aumentar la proporción de acetonitrilo con el gradiente, la fase móvil arrastra mejor a los compuestos retenidos, que se despegan y salen uno tras otro. Las partículas pequeñas dan picos estrechos, pero exigen presiones altas (${presion}).` },
      { t: 14, texto: `Cada banda sale de la columna hacia ${destino}, donde se ioniza. La señal del espectrómetro frente al tiempo es el cromatograma: un pico por compuesto.${p.final ? ' ' + p.final : ''}` },
    ],
    dibujar(g, t) {
      const C = g.C, fase = C.foton;
      /* ---------- esquema superior ---------- */
      // botellas
      [['A', 14], ['B', 50]].forEach(([s, x], i) => {
        g.rect(x, 28, 28, 46, { fill: C.panel, stroke: C.metalOsc, lw: 1.2, r: 4 });
        g.rect(x + 2, 40 + i * 4, 24, 32 - i * 4, { fill: C.liquido, alpha: 0.35, r: 3 });
        g.texto(s, x + 14, 56, { size: 12, color: C.texto, align: 'center', weight: 800 });
        g.linea([[x + 14, 28], [x + 14, 18], [104, 18], [104, 40]], { color: C.metalOsc, lw: 1.2 });
      });
      g.texto('A: agua  ·  B: acetonitrilo', 12, 106, { size: 9.5, color: C.tenue });
      // bombas
      g.rect(96, 32, 68, 44, { fill: C.panel, stroke: C.metalOsc, lw: 1.2, r: 5 });
      for (let i = 0; i < 2; i++) { const d = 6 * Math.sin(t * (2 * Math.PI * 14 / 18) + i * Math.PI); g.rect(106 + i * 26, 44, 20, 20, { fill: C.vacio, stroke: C.metalOsc, lw: 0.8, r: 2 }); g.rect(112 + i * 26, 50 + d * 0.6, 8, 14, { fill: C.metal, r: 1 }); }
      g.rotulo('Bombas', 130, 90, { size: 10 });
      // mezclador e inyector
      g.linea([[164, 54], [214, 54]], { color: C.metalOsc, lw: 1.6 });
      g.circulo(182, 54, 6, { fill: C.panel, stroke: C.metalOsc, lw: 1.2 });
      g.rect(214, 32, 64, 44, { fill: C.panel, stroke: C.metalOsc, lw: 1.2, r: 5 });
      g.rect(226, 40, 12, 26, { fill: C.panel, stroke: C.metalOsc, lw: 0.8, r: 2 });
      g.rect(228, 50, 8, 14, { fill: C.m[2], alpha: 0.35 });
      const kN = tramo(t, 0.8, 1.6) * (1 - tramo(t, 1.8, 2.3));
      g.linea([[258, 36], [258, 44 + 14 * kN]], { color: C.metalOsc, lw: 1.6 });
      g.circulo(258, 66, 6, { fill: C.vacio, stroke: C.metalOsc, lw: 1.2 });
      g.rotulo('Automuestreador', 246, 90, { size: 10 });
      // columna (y horno)
      g.linea([[278, 66], [300, 66], [300, 56], [314, 56]], { color: C.metalOsc, lw: 1.6 });
      g.rect(306, 38, 140, 36, { fill: C.calor, alpha: 0.06, r: 5 });
      g.rect(306, 38, 140, 36, { stroke: C.linea, lw: 1, r: 5, dash: [3, 3] });
      g.rect(314, 48, 124, 16, { fill: C.panel, stroke: C.metalOsc, lw: 1.2, r: 3 });
      for (let i = 0; i < 20; i++) for (let j = 0; j < 2; j++) g.circulo(318 + i * 6 + j * 3, 53 + j * 6, 2.2, { fill: C.metal, alpha: 0.8 });
      g.rotulo(nano ? 'Columna capilar' : 'Columna (horno)', 376, 90, { size: 10 });
      // banda de muestra en el esquema
      if (t > 1.8 && t < T_INY + 0.4) { const k = tramo(t, 1.8, T_INY + 0.4); g.circulo(lerp(258, 318, k), lerp(66, 56, clamp(k * 1.5)), 4, { fill: C.m[2], alpha: 0.8 }); }
      // fuente
      g.linea([[438, 56], [480, 56]], { color: C.metalOsc, lw: 1.6 });
      g.linea([[480, 50], [494, 56], [480, 62]], { fill: C.metal, color: C.metalOsc, lw: 1, cerrar: true });
      for (let i = 0; i < 6; i++) { const RJ = azar(70 + i), k = ((t * (24 / 18) + RJ()) % 1); g.gota(496 + k * 30, 56 + (RJ() - 0.5) * 26 * k, 2 + RJ() * 1.5, { alpha: 1 - k }); }
      g.rotulo(nano ? 'nanoESI' : 'Fuente ESI', 500, 90, { size: 10 });
      // datos del sistema
      g.texto(p.sistema || (nano ? 'nano-LC' : 'UHPLC'), 632, 34, { size: 11, color: C.texto, align: 'right', weight: 700 });
      g.texto(`Caudal: ${caudal}`, 632, 52, { size: 9.5, color: C.texto2, align: 'right' });
      g.texto(`Presión: ${presion}`, 632, 68, { size: 9.5, color: C.texto2, align: 'right' });
      // indicador de detalle
      g.linea([[360, 64], [TX0, TY0 - 2]], { color: C.tenue, lw: 0.8, dash: [3, 3] });
      g.linea([[392, 64], [TX1, TY0 - 2]], { color: C.tenue, lw: 0.8, dash: [3, 3] });
      g.rect(360, 46, 32, 20, { stroke: C.tenue, lw: 1, r: 3 });

      /* ---------- lecho de partículas ampliado ---------- */
      g.rect(TX0, TY0, TX1 - TX0, TY1 - TY0, { fill: C.vacio });
      g.rect(TX0, TY0, TX1 - TX0, TY1 - TY0, { fill: C.liquido, alpha: 0.13 });
      g.rect(TX0, TY0, TX1 - TX0, 3, { fill: C.metalOsc }); g.rect(TX0, TY1 - 3, TX1 - TX0, 3, { fill: C.metalOsc });
      const ctx = g.ctx;
      ctx.save(); ctx.beginPath(); ctx.rect(TX0, TY0 + 3, TX1 - TX0, TY1 - TY0 - 6); ctx.clip();
      FILAS.forEach((y, r) => { for (let x = TX0 + 4 + offFila(r); x < TX1 + PX; x += PX) { g.circulo(x, y, RP, { fill: C.metal, alpha: 0.55 }); g.circulo(x, y, RP, { stroke: fase, lw: 2.2, alpha: 0.9 }); } });
      // flujo de fase móvil entre las partículas
      for (let i = 0; i < 8; i++) { const x = TX0 + 10 + ((t * ((TX1 - TX0 - 30) * 2 / 18) + i * 70) % (TX1 - TX0 - 30)); const cr = CARRILES[i % 2]; g.flecha(x, cr + Math.sin((x - TX0) * Math.PI / 13) * 2, x + 14, cr + Math.sin((x + 14 - TX0) * Math.PI / 13) * 2, { color: C.liquido, lw: 1.2, punta: 4.5, alpha: 0.8 }); }
      // analitos
      if (t >= T_INY) for (const m of sim.mols) {
        const { x, movil } = sim.pos(m, t);
        if (x > TX1 - 3) continue;
        const carril = m.sy < 0.5 ? 0 : 1, yc = CARRILES[carril];
        let px, py;
        if (movil) { px = x; py = yc + Math.sin((x - TX0) * Math.PI / 13 + m.sz * 6) * 3; }
        else {
          const r = m.lado < 0 ? carril : carril + 1, off = TX0 + 4 + offFila(r);
          const cx = off + Math.round((x - off) / PX) * PX, cy = FILAS[r];
          const ang = Math.atan2(yc - cy, (m.sz - 0.5) * 12);
          px = cx + Math.cos(ang) * (RP + 1); py = cy + Math.sin(ang) * (RP + 1);
        }
        g.circulo(px, py, 3, { fill: C.m[m.c] });
      }
      ctx.restore();
      g.rotulo('Partícula de sílice con fase C18', 160, TY1 + 13, { size: 10 });
      g.rotulo('Fase móvil →', 520, TY1 + 13, { size: 10, color: C.texto2 });
      g.texto('Detalle del relleno de la columna (no a escala)', TX1, TY0 - 8, { size: 9.5, color: C.tenue, align: 'right', italic: true });

      /* ---------- cromatograma y gradiente ---------- */
      const GX = TX0, GY = 238, GW = TX1 - TX0, GH = 98;
      g.rect(GX, GY, GW, GH, { fill: C.panel, stroke: C.linea, r: 4 });
      g.texto('Cromatograma', GX + 8, GY + 11, { size: 10, color: C.texto2, weight: 600 });
      g.texto('tiempo de retención →', GX + GW - 8, GY + GH - 6, { size: 9, color: C.tenue, align: 'right' });
      const base = GY + GH - 16, alto = GH - 36, xg = (tt) => GX + 8 + (tt / GT) * (GW - 16);
      g.linea([[GX + 8, base], [GX + GW - 8, base]], { color: C.tenue, lw: 0.8 });
      const tf = Math.min(t, GT);
      // gradiente %B
      const grad = (tt) => clamp((tt - T_INY) / (15 - T_INY));
      const gp = [];
      for (let i = 0; i <= 40; i++) { const tt = (i / 40) * tf; gp.push([xg(tt), base - (0.08 + 0.8 * grad(tt)) * alto]); }
      g.linea(gp, { color: C.anion, lw: 1.3, dash: [5, 4], alpha: 0.8 });
      if (t > T_INY + 1) g.texto('% B', xg(tf) + 4, base - (0.08 + 0.8 * grad(tf)) * alto - 6, { size: 9.5, color: C.anion, weight: 700 });
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
      g.leyenda([[C.m[0], 'A (más polar)'], [C.m[1], 'B'], [C.m[2], 'C (menos polar)'], [fase, 'fase C18']], TX0, 351, { size: 10 });
    },
  };
}
