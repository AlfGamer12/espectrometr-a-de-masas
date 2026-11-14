// Isotermo frente a programa de temperatura: la misma mezcla de n-alcanos (C8–C16) en la misma columna, con el horno a
// temperatura constante y con una rampa. Los cromatogramas se calculan con el modelo de retención de gc-modelo.js
// (van 't Hoff + Golay, valores orientativos) y se dibujan a medida que avanza el tiempo; a la derecha, el pico del
// n-hexadecano ampliado en los dos casos. Escena sin estado.
// Parámetros: p.iso (°C, 150), p.T0 (°C, 40), p.rampa (°C/min, 10), p.Tf (°C, 250), p.columna (texto).
import { tramo, clamp } from '../dibujo.js';
import { cromatograma, tempEn, fondoFID } from './gc-modelo.js';

const X0 = 52, X1 = 470, TMAX = 24 * 60;   // eje de tiempo común: 0–24 min
const num = (v, d = 1) => v.toLocaleString('es-ES', { minimumFractionDigits: d, maximumFractionDigits: d });

export default function crear(p = {}) {
  const iso = { T0: p.iso || 150 };
  const prog = { T0: p.T0 || 40, t0: 1, rampa: p.rampa || 10, Tf: p.Tf || 250, tf: 2 };
  const base = { mezcla: 'alcanos', gas: 'he', u: 35, L: 30, dMm: 0.25, df: 0.25, split: 50 };
  const A = cromatograma({ ...base, prog: iso }), B = cromatograma({ ...base, prog });
  const ymax = Math.max(...A.eluidos.map((c) => c.alto), ...B.eluidos.map((c) => c.alto)) * 1.25;
  const c16 = (r) => r.comps.find((x) => x.id === 'C16');
  const wA = c16(A).tR ? c16(A).sigma * 2.355 : null, wB = c16(B).tR ? c16(B).sigma * 2.355 : null;
  const paneles = [
    { r: A, pr: iso, y: 14, tit: `Isotermo ${iso.T0} °C` },
    { r: B, pr: prog, y: 180, tit: `Programa: ${prog.T0} °C (1 min) → ${prog.rampa} °C/min → ${prog.Tf} °C` },
  ];
  /** Señal (pA sobre el fondo) máxima en el intervalo [a, b] (s). */
  const tramoMax = (r, a, b) => {
    let s = 0;
    for (const c of r.eluidos) { const d = c.tR < a ? a - c.tR : c.tR > b ? c.tR - b : 0; if (d < 6 * c.sigma) s += c.alto * Math.exp(-0.5 * (d / c.sigma) ** 2); }
    return s;
  };

  return {
    titulo: 'Programa de temperatura del horno',
    dur: 22,
    fases: [
      { t: 0, texto: `La misma mezcla de n-alcanos en la misma columna${p.columna ? ` (${p.columna})` : ''}. A temperatura constante, cada CH₂ más multiplica el factor de retención por un número casi constante (entre 1,5 y 2 según la temperatura), así que los tiempos de retención crecen de forma casi exponencial.` },
      { t: 6, texto: `En isotermo a ${iso.T0} °C los alcanos ligeros salen casi juntos al principio y los pesados tardan mucho y salen como picos anchos y bajos: la misma área repartida en más tiempo. Es el «problema general de la elución».` },
      { t: 11, texto: 'Con la rampa, cada compuesto queda casi inmóvil en la cabeza de la columna hasta que la temperatura sube lo suficiente; entonces avanza deprisa y sale. Los picos quedan casi equidistantes y con anchuras parecidas.' },
      { t: 16, texto: `Anchura a media altura del n-hexadecano: ${wA ? num(wA, 1) : '—'} s en isotermo y ${wB ? num(wB, 1) : '—'} s con la rampa. Con la misma área, el pico estrecho es más alto, lo que mejora el límite de detección. Al acabar, el horno se enfría hasta la temperatura inicial.` },
    ],
    dibujar(g, t) {
      const C = g.C;
      const tc = clamp((t - 0.6) / 13) * TMAX;
      const X = (s) => X0 + (s / TMAX) * (X1 - X0);
      for (const [n, P] of paneles.entries()) {
        const y0 = P.y, H = 152, base0 = y0 + H - 18, alto = H - 44;
        const Y = (v) => base0 - Math.min(1.05, v / ymax) * alto;
        const YT = (Tc) => base0 - (Tc / 300) * alto;
        g.rect(X0 - 8, y0, X1 - X0 + 44, H, { fill: C.panel, stroke: C.linea, r: 6 });
        g.texto(P.tit, X0, y0 + 13, { size: 11, color: n ? C.acento : C.texto2, weight: 700 });
        g.linea([[X0, base0], [X1, base0]], { color: C.tenue, lw: 0.8 });
        for (let m = 0; m <= 24; m += 4) g.texto(`${m}`, X(m * 60), base0 + 10, { size: 8.5, color: C.tenue, align: 'center' });
        g.texto('min', X1 + 6, base0 + 10, { size: 8.5, color: C.tenue });
        for (const Tc of [100, 200, 300]) g.texto(`${Tc} °C`, X1 + 4, YT(Tc), { size: 8, color: C.calor, alpha: 0.8 });
        const pts = [];
        for (let i = 0; i <= 96; i++) { const s = (i / 96) * TMAX; pts.push([X(s), YT(tempEn(P.pr, s / 60))]); }
        g.linea(pts, { color: C.calor, lw: 1.2, dash: [4, 4], alpha: 0.7 });
        // señal hasta el cursor: máximo por columna de píxeles, para no perder los picos estrechos
        const nPx = Math.round(X1 - X0), dt = TMAX / nPx, iMax = Math.floor(tc / dt), sp = [[X(0), base0]];
        for (let i = 0; i <= iMax; i++) sp.push([X(i * dt), Y(tramoMax(P.r, i * dt, (i + 1) * dt) + fondoFID(tempEn(P.pr, (i * dt) / 60)) - 4.5)]);
        sp.push([X(iMax * dt), base0]);
        g.linea(sp, { fill: C.campo, cerrar: true, alpha: 0.9 });
        g.linea(sp.slice(1, -1), { color: C.acento, lw: 1.2 });
        g.linea([[X(tc), y0 + 20], [X(tc), base0]], { color: C.tenue, lw: 0.8, dash: [2, 3] });
        let xp = -99;
        for (const c of P.r.eluidos) {
          if (tc < c.tR) continue;
          const x = X(c.tR);
          if (x - xp > 13) g.texto(c.corto, x, Y(c.alto) - 7, { size: 8.5, color: C.texto2, align: 'center', weight: 700 });
          xp = x;
        }
        // pico del n-hexadecano ampliado (±25 s alrededor de su máximo)
        const c = c16(P.r), IX = 528, IW = 100;
        g.rect(IX - 8, y0, IW + 16, H, { fill: C.panel, stroke: C.linea, r: 6 });
        g.texto('C16 ampliado', IX, y0 + 13, { size: 9.5, color: C.texto2, weight: 700 });
        g.texto('± 25 s', IX + IW, y0 + 13, { size: 8.5, color: C.tenue, align: 'right' });
        g.linea([[IX, base0], [IX + IW, base0]], { color: C.tenue, lw: 0.8 });
        if (c.tR && tc > c.tR) {
          const q = [];
          for (let i = 0; i <= 80; i++) { const d = ((i / 80) * 50 - 25); q.push([IX + (i / 80) * IW, Y(c.alto * Math.exp(-0.5 * (d / c.sigma) ** 2))]); }
          g.linea([[IX, base0], ...q, [IX + IW, base0]], { fill: C.campo, cerrar: true });
          g.linea(q, { color: C.acento, lw: 1.5 });
          g.texto(`${num(c.sigma * 2.355, 1)} s`, IX + IW / 2, base0 + 11, { size: 9, color: C.texto, align: 'center', weight: 700 });
        }
      }
      // anotaciones
      const kA = tramo(t, 6.2, 7), kB = tramo(t, 11.2, 12);
      if (kA > 0) {
        const a = A.eluidos, y = 46;
        const xa = X(a[0].tR), xb = X(a[2].tR);
        g.linea([[xa - 4, y + 6], [xa - 4, y], [xb + 4, y], [xb + 4, y + 6]], { color: C.mal, lw: 1.4, alpha: kA });
        g.texto('amontonados', xb + 8, y + 2, { size: 9.5, color: C.mal, weight: 700, alpha: kA });
        const late = a[a.length - 1];
        g.flecha(X(late.tR) + 46, 96, X(late.tR) + 6, 136, { color: C.mal, alpha: kA });
        g.texto('anchos y bajos', X(late.tR) + 48, 92, { size: 9.5, color: C.mal, weight: 700, alpha: kA });
      }
      if (kB > 0) {
        const b = B.eluidos, x0 = X(b[0].tR), x1 = X(b[b.length - 1].tR);
        g.linea([[x0, 216], [x1, 216]], { color: C.ok, lw: 1.4, alpha: kB });
        g.texto('espaciado regular, anchuras parecidas', x1, 209, { size: 9.5, color: C.ok, weight: 700, alpha: kB, align: 'right' });
      }
      g.texto('n-alcanos C8–C16 · 30 m × 0,25 mm × 0,25 µm · He 35 cm/s · cálculo aproximado', X0 - 8, 348, { size: 9, color: C.tenue, italic: true });
    },
  };
}
