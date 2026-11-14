// Control electrónico de la neumática (EPC): lazo cerrado de presión en el inyector (válvula proporcional + sensor), modos de
// caudal constante y de presión constante durante una rampa del horno (la viscosidad del gas crece con la temperatura) y
// caudales fijos de los gases del detector mediante restrictores calibrados. Valores calculados con la ecuación de Poiseuille
// para gas compresible (gc-modelo.js). Escena sin estado. Parámetros: p.caudal (mL/min, 1,2), p.gas ('he'), p.L (m, 30), p.d (mm, 0,25).
import { tramo, lerp, clamp } from '../dibujo.js';
import { GASES } from './gc-modelo.js';

const num = (v, d = 1) => v.toLocaleString('es-ES', { minimumFractionDigits: d, maximumFractionDigits: d });

export default function crear(p = {}) {
  const F0 = p.caudal || 1.2, gas = p.gas || 'he', L = p.L || 30, dMm = p.d || 0.25;
  const r = dMm / 2000, po = 101325, G = GASES[gas];
  const K = (T) => (r * r * po) / (16 * G.eta * (T / 300) ** G.ex * L);
  const Fde = (P, T) => Math.PI * r * r * K(T) * (P * P - 1) * (298 / T) * 6e7;           // mL/min a 25 °C
  const Pde = (F, T) => Math.sqrt(1 + F / (Math.PI * r * r * K(T) * (298 / T) * 6e7));
  const Tde = (m) => 40 + 10 * m;                                                       // rampa 40 → 250 °C a 10 °C/min
  const psi = (P) => (P - 1) * 14.696;
  const P40 = Pde(F0, 313.15), P250 = Pde(F0, 523.15), Fcp = Fde(P40, 523.15);

  return {
    titulo: 'Control electrónico de la neumática (EPC)',
    dur: 20,
    fases: [
      { t: 0, texto: 'El módulo EPC del inyector mide continuamente la presión del portador y abre o cierra una válvula proporcional hasta igualarla con la consigna: es un lazo de control cerrado, sin reguladores manuales.' },
      { t: 4.4, texto: `Para mantener ${num(F0, 1)} mL/min en una columna de ${L} m × ${num(dMm, 2)} mm, el equipo calcula la presión necesaria con la ecuación de flujo de Poiseuille. Al calentar el horno el gas se vuelve más viscoso: en modo de caudal constante la presión en cabeza sube de ${num(psi(P40), 1)} a ${num(psi(P250), 1)} psi entre 40 y 250 °C.` },
      { t: 9.6, texto: `En modo de presión constante, la misma rampa reduciría el caudal de ${num(F0, 1)} a unos ${num(Fcp, 2)} mL/min, y los compuestos tardíos saldrían más tarde y más anchos.` },
      { t: 13.6, texto: 'Los gases del FID se controlan por presión sobre restrictores calibrados (fritas): a una presión dada, cada restrictor deja pasar un caudal fijo de hidrógeno, aire o gas auxiliar.' },
    ],
    dibujar(g, t) {
      const C = g.C;
      /* ---------- lazo de presión ---------- */
      g.rect(18, 22, 330, 168, { fill: C.panel, stroke: C.linea, r: 6 });
      g.texto('Módulo EPC del inyector', 28, 36, { size: 10.5, color: C.texto2, weight: 700 });
      // botella → válvula → sensor → inyector → columna
      g.rect(30, 92, 34, 64, { fill: C.metal, stroke: C.metalOsc, r: 10 });
      g.texto(G.nombre, 47, 166, { size: 9.5, color: C.texto2, align: 'center' });
      g.linea([[64, 112], [300, 112]], { color: C.metalOsc, lw: 6 }); g.linea([[64, 112], [300, 112]], { color: C.vacio, lw: 3 });
      const ap = 0.45 + 0.25 * Math.sin(t * 1.3) * (1 - tramo(t, 4, 5)) + 0.25 * tramo(t, 5.5, 9.5);
      const vx = 116;
      g.linea([[vx - 14, 100], [vx + 14, 124], [vx + 14, 100], [vx - 14, 124]], { fill: C.acento, alpha: 0.25, cerrar: true, color: C.acento, lw: 1.4 });
      g.rect(vx - 6, 76, 12, 14, { fill: C.acento, alpha: 0.6, r: 2 });
      g.linea([[vx, 90], [vx, 100]], { color: C.acento, lw: 2 });
      g.texto('Válvula proporcional', vx, 140, { size: 9.5, color: C.texto2, align: 'center' });
      g.medidor(vx - 22, 152, 44, ap, { color: C.acento });
      const sx = 196;
      g.circulo(sx, 112, 13, { fill: C.panel, stroke: C.texto2, lw: 1.4 });
      g.texto('P', sx, 112.5, { size: 11, color: C.texto2, align: 'center', weight: 700 });
      g.texto('Sensor', sx, 140, { size: 9.5, color: C.texto2, align: 'center' });
      g.rect(262, 92, 34, 40, { fill: C.calor, alpha: 0.15, stroke: C.metalOsc, r: 3 });
      g.texto('Inyector', 279, 146, { size: 9.5, color: C.texto2, align: 'center' });
      g.linea([[279, 132], [279, 176], [330, 176]], { color: '#c8902e', lw: 1.6 });
      g.texto('columna', 334, 176, { size: 9, color: C.tenue });
      for (let i = 0; i < 8; i++) { const k = (t * 0.45 + i / 8) % 1; g.circulo(lerp(66, 260, k), 112, 2, { fill: C.gas, alpha: 0.8 }); }
      // controlador
      g.rect(120, 44, 120, 26, { fill: C.vacio, stroke: C.linea, r: 4 });
      g.texto('Control: consigna − medida', 180, 57.5, { size: 9.5, color: C.texto2, align: 'center', weight: 600 });
      g.flecha(sx, 98, sx, 72, { color: C.ok, lw: 1.4 });
      g.flecha(130, 70, vx + 2, 78, { color: C.ok, lw: 1.4 });
      g.texto('lazo cerrado', 226, 86, { size: 9, color: C.ok, weight: 600 });

      /* ---------- gráficas: caudal constante y presión constante ---------- */
      const tm = clamp((t - 4.6) / 8) * 21;
      const graf = (y0, tit, f, ymin, ymax, unidad, col, et0, et1) => {
        const X0 = 380, W = 240, H = 74;
        g.rect(X0 - 10, y0, W + 22, H + 26, { fill: C.panel, stroke: C.linea, r: 6 });
        g.texto(tit, X0, y0 + 12, { size: 10, color: C.texto2, weight: 700 });
        const X = (m) => X0 + (m / 21) * W, Y = (v) => y0 + H + 10 - ((v - ymin) / (ymax - ymin)) * (H - 18);
        g.linea([[X0, y0 + H + 10], [X0 + W, y0 + H + 10]], { color: C.tenue, lw: 0.8 });
        const Tp = [];
        for (let i = 0; i <= 42; i++) { const m = (i / 42) * 21; Tp.push([X(m), y0 + H + 10 - ((Tde(m) - 0) / 300) * (H - 18)]); }
        g.linea(Tp, { color: C.calor, lw: 1, dash: [3, 3], alpha: 0.6 });
        const pts = [];
        for (let i = 0; i <= 84; i++) { const m = (i / 84) * tm; pts.push([X(m), Y(f(m))]); }
        g.linea(pts, { color: col, lw: 2 });
        if (tm > 0) g.texto(`${num(f(tm), unidad === 'psi' ? 1 : 2)} ${unidad}`, Math.min(X(tm) + 4, X0 + W - 62), Y(f(tm)) + (unidad === 'psi' ? -8 : 10), { size: 9.5, color: col, weight: 700, mono: true });
        g.texto(et0, X0, y0 + H + 21, { size: 8.5, color: C.tenue });
        g.texto(et1, X0 + W, y0 + H + 21, { size: 8.5, color: C.tenue, align: 'right' });
      };
      graf(22, 'Caudal constante: presión en cabeza', (m) => psi(Pde(F0, Tde(m) + 273.15)), psi(P40) - 2, psi(P250) + 2, 'psi', C.acento, '40 °C', '250 °C (10 °C/min)');
      if (t > 9.4) graf(130, 'Presión constante: caudal de columna', (m) => Fde(P40, Tde(m) + 273.15), Fcp - 0.1, F0 + 0.1, 'mL/min', C.mal, '40 °C', '250 °C');

      /* ---------- EPC del detector: restrictores ---------- */
      const kD = 0.35 + 0.65 * tramo(t, 13.4, 14.2);
      {
        g.rect(18, 206, 330, 128, { fill: C.panel, stroke: C.linea, r: 6, alpha: kD });
        g.texto('Módulo EPC del FID', 28, 220, { size: 10.5, color: C.texto2, weight: 700, alpha: kD });
        [['H₂', '30 mL/min', C.foton], ['Aire', '400 mL/min', C.gas], ['N₂ auxiliar', '25 mL/min', C.neutro]].forEach(([n, f, col], i) => {
          const y = 246 + i * 30;
          g.texto(n, 30, y, { size: 10, color: C.texto2, weight: 600, alpha: kD });
          g.linea([[96, y], [270, y]], { color: C.metalOsc, lw: 5, alpha: kD }); g.linea([[96, y], [270, y]], { color: C.vacio, lw: 2.4, alpha: kD });
          g.circulo(130, y, 9, { fill: C.panel, stroke: C.texto2, lw: 1.2, alpha: kD }); g.texto('P', 130, y + 0.5, { size: 9, align: 'center', weight: 700, color: C.texto2, alpha: kD });
          g.rect(176, y - 7, 26, 14, { fill: C.tenue, alpha: 0.6 * kD, r: 2 });
          for (let k = 0; k < 6; k++) g.circulo(179 + k * 4, y - 3 + (k % 2) * 6, 1.2, { fill: C.panel, alpha: kD });
          for (let k = 0; k < 4; k++) { const u = (t * 0.6 + k / 4 + i * 0.2) % 1; g.circulo(lerp(100, 266, u), y, 1.8, { fill: col, alpha: kD }); }
          g.texto(f, 340, y, { size: 10, color: C.texto, weight: 700, align: 'right', mono: true, alpha: kD });
        });
        g.texto('restrictor (frita)', 189, 326, { size: 9, color: C.tenue, align: 'center', alpha: kD });
        g.texto('Valores por defecto de Agilent para el FID', 380, 300, { size: 9.5, color: C.tenue, italic: true, alpha: kD });
      }
    },
  };
}
