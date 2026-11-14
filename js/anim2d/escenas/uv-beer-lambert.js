// Ley de Beer-Lambert en la cubeta: fotones que entran, moléculas que absorben algunos de ellos y caída exponencial de la intensidad
// a lo largo del paso óptico. Después se duplica la concentración: la absorbancia se duplica y la transmitancia no.
// Sin estado: cada fotón es una función determinista de t (semilla por fotón).
import { tramo, lerp, azar } from '../dibujo.js';
import { colorNm, coma } from './uv-util.js';

export default function crear() {
  const X0 = 150, X1 = 390, Y0 = 92, Y1 = 236, b = X1 - X0;          // cubeta (b = paso óptico)
  const XE = 30, XF = 600, V = 170, DT = 0.07;                         // entrada, salida, velocidad y ritmo de los fotones
  const TC = 9.5;                                                      // instante en que se duplica la concentración
  const Ade = (s) => (s < TC ? 0.5 : 1.0);
  const col = colorNm(526);
  const R0 = azar(5), mol1 = Array.from({ length: 34 }, () => [X0 + 8 + R0() * (b - 16), Y0 + 14 + R0() * (Y1 - Y0 - 22)]);
  const mol2 = Array.from({ length: 34 }, () => [X0 + 8 + R0() * (b - 16), Y0 + 14 + R0() * (Y1 - Y0 - 22)]);

  /** Fotón k: nace en s = k·DT; si U < 1 − T se absorbe a la profundidad x = −ln(U')/μ dentro de la cubeta. */
  function foton(k) {
    const R = azar(k * 7 + 3), s = k * DT, y = Y0 + 20 + R() * (Y1 - Y0 - 34);
    const mu = (Ade(s) * Math.LN10) / b;                                 // coeficiente de atenuación (por píxel)
    const xa = -Math.log(1 - R()) / mu;                                  // profundidad de absorción (distribución exponencial)
    return { s, y, abs: xa < b ? X0 + xa : null };
  }

  return {
    titulo: 'Absorción en la cubeta: ley de Beer-Lambert',
    dur: 19,
    fases: [
      { t: 0, texto: 'Un haz de 526 nm (verde) entra en la cubeta. Las moléculas de permanganato absorben fotones de esa energía y pasan a un estado excitado; la energía se disipa como calor.' },
      { t: 4.5, texto: 'Cada capa de disolución absorbe la misma fracción de la luz que le llega, así que la intensidad cae de forma exponencial a lo largo del paso óptico b. La transmitancia es T = I/I₀.' },
      { t: TC, texto: 'Al duplicar la concentración hay el doble de moléculas en el camino: la absorbancia se duplica, de 0,50 a 1,00, pero la transmitancia no se reduce a la mitad: pasa de 0,32 a 0,10.' },
      { t: 14, texto: 'A = −log T = ε·b·c: la absorbancia es proporcional a la concentración y al paso óptico, y ε es la absortividad molar de la especie a esa longitud de onda. Por eso se cuantifica con la absorbancia.' },
    ],
    dibujar(g, t) {
      const C = g.C, A = Ade(t), T = 10 ** -A;
      // cubeta y disolución
      const tinte = A > 0.75 ? 0.75 : 0.45;
      g.rect(X0, Y0, b, Y1 - Y0, { fill: 'rgba(150, 40, 160, 1)', alpha: tinte * 0.35, r: 4 });
      g.rect(X0 - 5, Y0 - 12, b + 10, Y1 - Y0 + 17, { stroke: C.texto2, lw: 2, r: 5 });
      g.linea([[X0 - 5, Y0], [X1 + 5, Y0]], { color: C.liquido, lw: 1, alpha: 0.6 });
      for (const [x, y] of mol1) g.molecula(x, y, { r: 2.3, n: 3, rot: x * 0.1 + t * 0.4, semilla: Math.round(x), color: '#9c36b5', alpha: 0.7 });
      if (t > TC) { const a = tramo(t, TC, TC + 0.8); for (const [x, y] of mol2) g.molecula(x, y, { r: 2.3, n: 3, rot: y * 0.1 - t * 0.4, semilla: Math.round(y), color: '#9c36b5', alpha: 0.7 * a }); }
      // cota del paso óptico
      g.flecha(X0 + b / 2, Y1 + 15, X0, Y1 + 15, { color: C.texto2, lw: 1.2, punta: 6 }); g.flecha(X0 + b / 2, Y1 + 15, X1, Y1 + 15, { color: C.texto2, lw: 1.2, punta: 6 });
      g.rotulo('b (paso óptico)', X0 + b / 2, Y1 + 15, { size: 10 });

      // fotones
      const k0 = Math.max(0, Math.floor((t - (XF - XE) / V) / DT)), k1 = Math.floor(t / DT);
      for (let k = k0; k <= k1; k++) {
        const f = foton(k), x = XE + (t - f.s) * V;
        if (f.abs != null && x >= f.abs) {
          const ta = (f.abs - XE) / V + f.s, d = t - ta;               // destello de absorción durante 0,45 s
          if (d < 0.45) { g.circulo(f.abs, f.y, 3 + d * 18, { stroke: '#e64980', lw: 1.4, alpha: 1 - d / 0.45 }); g.molecula(f.abs + 2, f.y, { r: 2.8, n: 3, rot: t * 4, semilla: k, color: '#e64980', alpha: 1 - d / 0.45 }); }
          continue;
        }
        if (x > XF) continue;
        g.foton(x - 12, f.y, x, f.y, { amp: 2.6, long: 6, color: C.texto, lw: 3.2, alpha: 0.25 }); g.foton(x - 12, f.y, x, f.y, { amp: 2.6, long: 6, color: col, lw: 1.8 });
      }
      g.texto('I₀', XE + 4, 140, { size: 14, color: C.texto, weight: 700 });
      g.texto('I', XF - 14, 140, { size: 14, color: C.texto, weight: 700 });

      // perfil de intensidad a lo largo de la cubeta
      const py0 = 328, ph = 46;
      g.rect(X0 - 20, py0 - ph - 6, b + 40, ph + 24, { fill: C.panel, stroke: C.linea, r: 5 });
      g.texto('I(x)/I₀', X0 - 14, py0 - ph + 4, { size: 9.5, color: C.texto2, weight: 600 });
      const pts = []; for (let i = 0; i <= 40; i++) { const u = i / 40; pts.push([X0 + u * b, py0 - ph * 0.85 * 10 ** (-A * u)]); }
      g.linea([[X0 - 14, py0 - ph * 0.85], [X0, py0 - ph * 0.85], ...pts, [X1 + 14, py0 - ph * 0.85 * T]], { color: col, lw: 2 });
      g.linea([[X0, py0], [X1, py0]], { color: C.tenue, lw: 0.8 });
      g.texto(`T = ${coma(T, 2)}`, X1 - 2, py0 - ph * 0.85 * T - 9, { size: 10, color: C.texto, weight: 700, align: 'right' });

      // lecturas y gráficas
      const px = 420, pw = 210;
      if (t > 4.5) {
        const a = tramo(t, 4.5, 5.2);
        g.rect(px, 270, pw, 74, { fill: C.panel, stroke: C.linea, r: 6, alpha: a });
        g.texto(`Concentración: ${t < TC ? 'c' : '2c'}`, px + 10, 286, { size: 10.5, color: C.texto2, weight: 600, alpha: a });
        g.texto(`T = I/I₀ = ${coma(T, 2)}`, px + 10, 306, { size: 12, color: C.texto, weight: 600, alpha: a });
        g.texto(`A = −log T = ${coma(A, 2)}`, px + 10, 328, { size: 12, color: C.texto, weight: 600, alpha: a });
      }
      if (t > 14) {
        const a = tramo(t, 14, 14.7);
        g.grafico(px, 14, 102, 92, (u) => u / 1.05, { color: '#1971c2', titulo: 'A frente a c', ejeX: 'c', alpha: a, n: 20, marcas: [[0.47, '1'], [0.95, '2']] });
        g.grafico(px + 108, 14, 102, 92, (u) => 10 ** (-u * 1.05), { color: '#e8590c', titulo: 'T frente a c', ejeX: 'c', alpha: a, n: 40, marcas: [[0.47, '1'], [0.95, '2']] });
        g.texto('A = ε·b·c', px + pw / 2, 126, { size: 15, color: C.texto, align: 'center', weight: 700, italic: true, alpha: a });
      }
      g.leyenda([[col, 'fotón (526 nm)', 'foton'], ['#9c36b5', 'molécula'], ['#e64980', 'absorción']], 136, 354, { size: 9.5 });
    },
  };
}
