// Separación en fase reversa en una columna C18 termostatizada con detección UV (HPLC-DAD), en gradiente de agua-acetonitrilo.
// Las trayectorias de las moléculas se precalculan con el reparto estocástico de util-servicios.js (la banda avanza a u/(1 + k));
// el gradiente se modela reduciendo k con el tiempo. Compuestos ilustrativos: paracetamol, cafeína y ácido acetilsalicílico.
// Todo es función de t. Parámetros: p.columna (texto), p.temp (texto).
import { tramo, lerp, azar, clamp } from '../dibujo.js';
import { simularReparto } from './util-servicios.js';

const TX0 = 40, TX1 = 600, TY0 = 128, TY1 = 210;
const FILAS = [144, 169, 194], RP = 10.5, PX = 26;
const CARRILES = [156.5, 181.5];
const T_INY = 2.2, GT = 17;
const NOMBRES = ['paracetamol', 'cafeína', 'AAS'];

export default function crear(p = {}) {
  const columna = p.columna || 'C18, 150 × 4,6 mm, 5 µm';
  const temp = p.temp || '30 °C';
  const comps = [0.8, 2.6, 9].map((k0) => ({ k: (t) => k0 * Math.exp(-Math.max(0, t - T_INY - 1) / 4.2) }));
  const sim = simularReparto({ comps, n: 22, dur: 18, tIny: T_INY, x0: TX0 + 6, x1: TX1 - 2, u: 210, dwell: 0.14, ancho: 8, semilla: 33 });
  let max = 0;
  for (let i = 0; i <= 300; i++) max = Math.max(max, sim.senal(null, (i / 300) * 18));
  const tPico = [0, 1, 2].map((c) => { const ll = sim.mols.filter((m) => m.c === c && m.llegada != null).map((m) => m.llegada).sort((a, b) => a - b); return ll[Math.floor(ll.length / 2)] ?? 99; });
  const offFila = (r) => (r % 2 ? PX / 2 : 0);
  const grad = (tt) => clamp((tt - T_INY) / (15 - T_INY));

  return {
    titulo: 'Separación en fase reversa',
    dur: 18,
    fases: [
      { t: 0, texto: `La bomba impulsa la fase móvil: agua acidificada (A) y acetonitrilo (B). El intercambiador de calor la lleva a la temperatura de la columna (${temp}) antes de entrar.` },
      { t: T_INY, texto: 'El inyector introduce la muestra en la cabeza de la columna como una banda estrecha.' },
      { t: 5, texto: 'Las partículas de sílice llevan cadenas C18 apolares. Cada molécula alterna entre la fase móvil, en la que avanza, y la superficie C18, en la que queda retenida: cuanto menos polar, más tiempo pasa retenida y más despacio avanza.' },
      { t: 9.5, texto: 'Al aumentar el porcentaje de acetonitrilo, la fase móvil compite mejor por los compuestos retenidos y estos se despegan: el gradiente acorta el análisis y estrecha los últimos picos.' },
      { t: 13.5, texto: 'Cada banda atraviesa la celda del detector y absorbe luz ultravioleta: aparece un pico. La resolución entre dos picos es Rs = 2·Δt / (w₁ + w₂); con Rs ≥ 1,5 están separados hasta la línea base.' },
    ],
    dibujar(g, t) {
      const C = g.C, fase = C.foton;
      /* ---------- esquema superior ---------- */
      [['A', 14, C.m[2]], ['B', 46, C.m[5]]].forEach(([s, x, col]) => {
        g.rect(x, 26, 26, 42, { fill: C.panel, stroke: C.metalOsc, lw: 1.2, r: 4 });
        g.rect(x + 2, 40, 22, 26, { fill: col, alpha: 0.3, r: 3 });
        g.texto(s, x + 13, 52, { size: 12, color: C.texto, align: 'center', weight: 800 });
        g.linea([[x + 13, 26], [x + 13, 18], [96, 18], [96, 36]], { color: C.metalOsc, lw: 1.2 });
      });
      g.rect(88, 32, 56, 40, { fill: C.panel, stroke: C.metalOsc, lw: 1.2, r: 5 }); g.rotulo('Bomba', 116, 86, { size: 10 });
      g.linea([[144, 52], [176, 52]], { color: C.metalOsc, lw: 1.6 });
      g.circulo(194, 52, 16, { fill: C.panel, stroke: C.metalOsc, lw: 1.2 }); g.rotulo('Inyector', 194, 86, { size: 10 });
      for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3 + Math.PI / 2; g.circulo(194 + Math.cos(a) * 9, 52 - Math.sin(a) * 9, 2, { fill: C.metalOsc }); }
      // compartimento de columna: intercambiador de calor y columna
      g.rect(226, 30, 236, 44, { fill: C.calor, alpha: 0.07, r: 6 }); g.rect(226, 30, 236, 44, { stroke: C.linea, lw: 1, r: 6, dash: [3, 3] });
      g.linea([[210, 52], [234, 52]], { color: C.metalOsc, lw: 1.6 });
      g.rect(234, 42, 22, 20, { fill: C.calor, alpha: 0.35, stroke: C.metalOsc, lw: 1, r: 3 });
      g.linea([[256, 52], [266, 52]], { color: C.metalOsc, lw: 1.6 });
      g.rect(266, 44, 186, 16, { fill: C.panel, stroke: C.metalOsc, lw: 1.2, r: 3 });
      for (let i = 0; i < 30; i++) for (let j = 0; j < 2; j++) g.circulo(270 + i * 6 + j * 3, 49 + j * 6, 2.2, { fill: C.metal, alpha: 0.8 });
      g.rotulo(`Columna ${columna} · ${temp}`, 344, 86, { size: 10 });
      // banda de muestra en el esquema
      if (t > 1.6 && t < T_INY + 0.5) { const k = tramo(t, 1.6, T_INY + 0.5); g.circulo(lerp(194, 272, k), 52, 4, { fill: C.m[1], alpha: 0.85 }); }
      // detector de diodos: celda con el haz de luz
      g.linea([[452, 52], [520, 52]], { color: C.metalOsc, lw: 1.6 });
      g.rect(520, 42, 30, 20, { fill: C.vacio, stroke: C.metalOsc, lw: 1.2, r: 3 });
      const sTot = sim.senal(null, t) / max;
      g.rect(522, 46, 26, 12, { fill: C.m[2], alpha: clamp(sTot) * 0.6 });
      g.linea([[535, 22], [535, 42]], { color: fase, lw: 4, alpha: 0.6 }); g.linea([[535, 62], [535, 76]], { color: fase, lw: 4, alpha: 0.6 * (1 - clamp(sTot) * 0.6) });
      g.rect(527, 76, 16, 6, { fill: C.texto2, r: 1 });
      g.rotulo('Celda del DAD', 535, 96, { size: 10 });
      // indicador del detalle ampliado
      g.linea([[330, 60], [TX0, TY0 - 2]], { color: C.tenue, lw: 0.8, dash: [3, 3] });
      g.linea([[362, 60], [TX1, TY0 - 2]], { color: C.tenue, lw: 0.8, dash: [3, 3] });
      g.rect(330, 42, 32, 20, { stroke: C.tenue, lw: 1, r: 3 });

      /* ---------- lecho de partículas ampliado ---------- */
      g.rect(TX0, TY0, TX1 - TX0, TY1 - TY0, { fill: C.vacio });
      g.rect(TX0, TY0, TX1 - TX0, TY1 - TY0, { fill: C.liquido, alpha: 0.13 });
      g.rect(TX0, TY0, TX1 - TX0, 3, { fill: C.metalOsc }); g.rect(TX0, TY1 - 3, TX1 - TX0, 3, { fill: C.metalOsc });
      const ctx = g.ctx;
      ctx.save(); ctx.beginPath(); ctx.rect(TX0, TY0 + 3, TX1 - TX0, TY1 - TY0 - 6); ctx.clip();
      FILAS.forEach((y, r) => { for (let x = TX0 + 4 + offFila(r); x < TX1 + PX; x += PX) {
        g.circulo(x, y, RP, { fill: C.metal, alpha: 0.55 });
        for (let k = 0; k < 10; k++) { const a = k * Math.PI / 5; g.linea([[x + Math.cos(a) * RP, y + Math.sin(a) * RP], [x + Math.cos(a) * (RP + 3), y + Math.sin(a) * (RP + 3)]], { color: fase, lw: 1.2, alpha: 0.75 }); }
      } });
      for (let i = 0; i < 8; i++) { const x = TX0 + 10 + ((t * ((TX1 - TX0 - 30) * 2 / 18) + i * 70) % (TX1 - TX0 - 30)); const cr = CARRILES[i % 2];
        g.flecha(x, cr, x + 14, cr, { color: C.liquido, lw: 1.2, punta: 4.5, alpha: 0.8 }); }
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
          px = cx + Math.cos(ang) * (RP + 2); py = cy + Math.sin(ang) * (RP + 2);
        }
        g.circulo(px, py, 3, { fill: C.m[m.c] });
      }
      ctx.restore();
      g.rotulo('Partícula de sílice con cadenas C18', 170, TY1 + 13, { size: 10 });
      g.rotulo('Fase móvil →', 520, TY1 + 13, { size: 10, color: C.texto2 });
      g.texto('Detalle del relleno (no a escala)', TX1, TY0 - 8, { size: 9.5, color: C.tenue, align: 'right', italic: true });

      /* ---------- cromatograma y gradiente ---------- */
      const GX = TX0, GY = 236, GW = TX1 - TX0, GH = 98;
      g.rect(GX, GY, GW, GH, { fill: C.panel, stroke: C.linea, r: 4 });
      g.texto('Cromatograma (absorbancia a 254 nm)', GX + 8, GY + 11, { size: 10, color: C.texto2, weight: 600 });
      g.texto(`Gradiente: ${Math.round(10 + 50 * grad(Math.min(t, GT)))} % B`, TX1 - 8, 247, { size: 10.5, color: C.anion, align: 'right', weight: 700 });
      g.texto('tiempo →', GX + GW - 8, GY + GH - 6, { size: 9, color: C.tenue, align: 'right' });
      const base = GY + GH - 16, alto = GH - 36, xg = (tt) => GX + 8 + (tt / GT) * (GW - 16);
      g.linea([[GX + 8, base], [GX + GW - 8, base]], { color: C.tenue, lw: 0.8 });
      const tf = Math.min(t, GT);
      const gp = []; for (let i = 0; i <= 40; i++) { const tt = (i / 40) * tf; gp.push([xg(tt), base - (0.08 + 0.8 * grad(tt)) * alto]); }
      g.linea(gp, { color: C.anion, lw: 1.3, dash: [5, 4], alpha: 0.8 });
      if (t > T_INY + 1) g.texto('% B', xg(tf) + 4, base - (0.08 + 0.8 * grad(tf)) * alto - 6, { size: 9.5, color: C.anion, weight: 700 });
      for (let c = 0; c < 3; c++) {
        const pts = [[xg(0), base]];
        for (let i = 0; i <= 160; i++) { const tt = (i / 160) * tf; pts.push([xg(tt), base - (sim.senal(c, tt) / max) * alto * 0.92]); }
        pts.push([xg(tf), base]);
        g.linea(pts, { fill: C.m[c], alpha: 0.25, cerrar: true });
      }
      const tot = []; for (let i = 0; i <= 200; i++) { const tt = (i / 200) * tf; tot.push([xg(tt), base - (sim.senal(null, tt) / max) * alto * 0.92]); }
      g.linea(tot, { color: C.texto2, lw: 1.4 });
      if (t >= T_INY) g.texto('inyección', xg(T_INY), base + 9, { size: 8.5, color: C.tenue, align: 'center' });
      NOMBRES.forEach((s, c) => { if (t > tPico[c] + 0.3 && tPico[c] < GT) g.texto(s, xg(tPico[c]), GY + 22, { size: 10, color: C.m[c], align: 'center', weight: 700 }); });
      g.leyenda([[C.m[0], 'paracetamol (menos retenido)'], [C.m[1], 'cafeína'], [C.m[2], 'AAS (más retenido)'], [fase, 'cadenas C18']], TX0, 350, { size: 10 });
    },
  };
}
