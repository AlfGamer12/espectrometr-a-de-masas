// RMN: acoplamiento espín-espín (J) en el grupo etilo. Los protones del CH₂ «ven» los tres protones del CH₃ vecino, cuyos espines
// pueden estar en 2³ = 8 combinaciones con 4 valores de la componente total (↑↑↑, ↑↑↓ ×3, ↑↓↓ ×3, ↓↓↓): la señal del CH₂ se desdobla
// en un cuadruplete 1:3:3:1 separado por J. El CH₃, con dos vecinos, da un triplete 1:2:1. Regla n + 1 y triángulo de Pascal.
// Los protones equivalentes entre sí no desdoblan sus propias señales. J (Hz) no depende del campo.
// Parámetros: p.J (Hz, 7,1) · p.mhz (400).
import { tramo, suave } from '../dibujo.js';
import { num } from './util-analizadores.js';

export default function crear(p = {}) {
  const J = p.J || 7.1, mhz = p.mhz || 400;
  const TQ = 0, TT = 9.5, TR = 15, dur = 21;
  const comb = (n) => { let r = [1]; for (let i = 0; i < n; i++) r = [...r, 0].map((v, k) => v + (r[k - 1] || 0)); return r; };

  /** Árbol de desdoblamiento: n vecinos, origen (x, y), separación s (px) y altura total h; dibuja hasta el nivel k (0…n). */
  function arbol(g, x, y, n, s, h, k, color, alpha) {
    const C = g.C, dy = h / (n + 1);
    let lineas = [[x, 1]];
    g.linea([[x, y], [x, y + dy * 0.7]], { color, lw: 2, alpha });
    for (let i = 1; i <= Math.min(n, Math.floor(k)); i++) {
      const fr = Math.min(1, k - i + 1), nuevas = new Map();
      for (const [lx, w] of lineas) for (const sg of [-1, 1]) {
        const nx = lx + (sg * s) / 2;
        g.linea([[lx, y + dy * (i - 0.3)], [lx + ((nx - lx) * fr), y + dy * (i - 0.3) + dy * 0.6 * fr]], { color, lw: 1.5, alpha });
        nuevas.set(nx.toFixed(2), (nuevas.get(nx.toFixed(2)) || 0) + w);
      }
      lineas = [...nuevas].map(([kx, w]) => [+kx, w]);
      if (fr >= 1) for (const [lx] of lineas) g.linea([[lx, y + dy * (i + 0.3)], [lx, y + dy * (i + 0.7)]], { color, lw: 1.5, alpha });
    }
    void C;
    return lineas;
  }
  function multiplete(g, x, yb, n, s, hmax, color, alpha, etiquetas) {
    const c = comb(n), mx = Math.max(...c);
    c.forEach((v, i) => {
      const lx = x + (i - n / 2) * s, h = (v / mx) * hmax;
      g.linea([[lx, yb], [lx, yb - h]], { color, lw: 3, alpha });
      g.texto(String(v), lx, yb - h - 9, { size: 10.5, color, weight: 700, align: 'center', alpha });
      if (etiquetas) g.texto(etiquetas[i], lx, yb + 14, { size: 10, color: g.C.texto2, align: 'center', alpha });
    });
  }

  return {
    titulo: 'Acoplamiento espín-espín y regla n + 1',
    dur,
    fases: [
      { t: TQ, texto: 'En el grupo etilo del acetato de etilo, los dos protones del CH₂ tienen tres protones vecinos en el CH₃, a tres enlaces. Cada uno de ellos puede estar en el estado α (↑) o β (↓) y modifica un poco el campo que sienten los del CH₂.' },
      { t: 3.2, texto: 'Los tres vecinos pueden combinarse de 8 maneras, pero solo importan cuántos están ↑: todos (1 manera), dos (3), uno (3) o ninguno (1). La señal del CH₂ se desdobla en cuatro líneas de intensidades 1:3:3:1, separadas por la constante de acoplamiento J.' },
      { t: TT, texto: 'Los protones del CH₃, con dos vecinos en el CH₂, dan un triplete 1:2:1 con la misma J: dos grupos acoplados comparten su constante. Los protones equivalentes entre sí no desdoblan sus propias señales.' },
      { t: TR, texto: `Regla n + 1: n protones vecinos equivalentes dan n + 1 líneas con las intensidades del triángulo de Pascal. J se mide en hercios y no depende del campo: ${num(J, 1)} Hz son ${num(J / mhz, 4)} ppm a ${num(mhz)} MHz, pero ${num(J / 60, 3)} ppm a 60 MHz.` },
    ],
    dibujar(g, t) {
      const C = g.C, cq = C.m[0], ct = C.m[2];
      /* --- molécula --- */
      g.rect(14, 10, 200, 340, { fill: C.panel, stroke: C.linea, r: 8 });
      g.texto('CH₃–C(=O)–O–CH₂–CH₃', 114, 30, { size: 11, color: C.texto2, weight: 600, align: 'center' });
      const cx1 = 80, cx2 = 150, cy = 120;
      g.linea([[30, cy], [cx1, cy]], { color: C.metalOsc, lw: 3 }); g.linea([[cx1, cy], [cx2, cy]], { color: C.metalOsc, lw: 3 });
      g.circulo(30, cy, 11, { fill: C.mal }); g.texto('O', 30, cy + 0.5, { size: 11, color: '#fff', weight: 700, align: 'center' });
      g.circulo(cx1, cy, 13, { fill: C.metalOsc }); g.texto('C', cx1, cy + 0.5, { size: 11, color: '#fff', weight: 700, align: 'center' });
      g.circulo(cx2, cy, 13, { fill: C.metalOsc }); g.texto('C', cx2, cy + 0.5, { size: 11, color: '#fff', weight: 700, align: 'center' });
      const hA = [[cx1 - 16, cy - 40], [cx1 + 6, cy + 42]], hB = [[cx2 + 4, cy - 44], [cx2 + 44, cy + 6], [cx2 + 2, cy + 44]];
      const enfA = t < TT, enfB = t >= TT && t < TR;
      for (const [x, y] of hA) { g.linea([[cx1, cy], [x, y]], { color: C.metalOsc, lw: 2 }); g.circulo(x, y, 9, { fill: cq, alpha: enfA || t >= TR ? 1 : 0.45 }); g.texto('H', x, y + 0.5, { size: 9.5, color: '#fff', weight: 700, align: 'center' }); }
      // espines de los vecinos (animados según la combinación mostrada)
      const combos = ['↑↑↑', '↑↑↓', '↑↓↑', '↓↑↑', '↑↓↓', '↓↑↓', '↓↓↑', '↓↓↓'];
      const ci = Math.floor((t * 1.1) % 8), cs = combos[ci];
      hB.forEach(([x, y], i) => {
        g.linea([[cx2, cy], [x, y]], { color: C.metalOsc, lw: 2 });
        g.circulo(x, y, 9, { fill: ct, alpha: enfB || t >= TR ? 1 : 0.45 });
        g.texto('H', x, y + 0.5, { size: 9.5, color: '#fff', weight: 700, align: 'center' });
        if (t > 1.5 && t < TT) g.texto(cs[i], x + 15, y - 6, { size: 14, color: cs[i] === '↑' ? C.ion : C.anion, weight: 800 });
      });
      if (t > 1.5 && t < TT) {
        const ups = [...cs].filter((c) => c === '↑').length;
        g.texto(`vecinos: ${cs}  →  línea ${4 - ups} del cuadruplete`, 114, 220, { size: 10.5, color: C.texto, weight: 600, align: 'center' });
      }
      g.texto('J ≈ 7 Hz (³J, a tres enlaces)', 114, 196, { size: 10, color: C.texto2, align: 'center' });
      // tabla n + 1
      const kR = suave(tramo(t, TR, TR + 1));
      if (kR > 0) {
        [['0', 's', '1'], ['1', 'd', '1 1'], ['2', 't', '1 2 1'], ['3', 'q', '1 3 3 1'], ['4', 'quint.', '1 4 6 4 1'], ['5', 'sext.', '1 5 10 10 5 1']].forEach(([n, m, pas], i) => {
          const y = 244 + i * 17;
          g.texto(`n = ${n}`, 26, y, { size: 10, color: C.texto2, alpha: kR });
          g.texto(m, 82, y, { size: 10, color: C.acento, weight: 700, alpha: kR });
          g.texto(pas, 200, y, { size: 10, color: C.texto, align: 'right', mono: true, alpha: kR });
        });
      }

      /* --- árbol del CH₂ y cuadruplete --- */
      const kQ = suave(tramo(t, 3.2, 4.2));
      g.rect(224, 10, 200, 340, { fill: C.panel, stroke: C.linea, r: 8 });
      g.texto('Señal del CH₂ (4,12 ppm)', 324, 26, { size: 11, color: cq, weight: 700, align: 'center' });
      const s = 36, k = tramo(t, 4.2, 8.2) * 3;
      arbol(g, 324, 50, 3, s, 160, k, cq, kQ);
      if (k >= 2.98) multiplete(g, 324, 300, 3, s, 70, cq, suave(tramo(t, 8.2, 8.8)), ['↑↑↑', '↑↑↓', '↑↓↓', '↓↓↓']);
      if (t > 8.4) {
        g.linea([[324 - s * 1.5, 323], [324 - s * 0.5, 323]], { color: C.texto2, lw: 1 });
        g.texto('J', 324 - s * 1.5 - 8, 323, { size: 10.5, color: C.texto2, weight: 700, align: 'center' });
        g.texto('cuadruplete 1:3:3:1', 324, 342, { size: 10.5, color: C.texto, weight: 600, align: 'center' });
      }

      /* --- árbol del CH₃ y triplete --- */
      const kT = suave(tramo(t, TT, TT + 1));
      g.rect(434, 10, 192, 340, { fill: C.panel, stroke: C.linea, r: 8, alpha: Math.max(0.3, kT) });
      g.texto('Señal del CH₃ (1,26 ppm)', 530, 26, { size: 11, color: ct, weight: 700, align: 'center', alpha: kT });
      const k2 = tramo(t, TT + 0.8, TT + 3.8) * 2;
      if (kT > 0) arbol(g, 530, 50, 2, s, 160, k2, ct, kT);
      if (k2 >= 1.98) multiplete(g, 530, 300, 2, s, 70, ct, suave(tramo(t, TT + 3.8, TT + 4.4)), ['↑↑', '↑↓', '↓↓']);
      if (t > TT + 4) g.texto('triplete 1:2:1', 530, 342, { size: 10.5, color: C.texto, weight: 600, align: 'center' });
    },
  };
}
