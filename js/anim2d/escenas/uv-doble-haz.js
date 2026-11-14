// Doble haz: la luz monocromática se divide en un haz de referencia (cubeta con disolvente → I₀) y un haz de muestra (cubeta con la
// disolución → I). Si la lámpara fluctúa, las dos señales varían a la vez y el cociente T = I/I₀ no cambia. Comparación con un equipo
// de haz simple, que mide I₀ y después I. Sin estado: todo es función de t.
import { tramo, lerp } from '../dibujo.js';
import { colorNm, cubeta, coma } from './uv-util.js';

export default function crear() {
  const L = 526, col = colorNm(L), T = 10 ** -0.5;                 // A = 0,50 a 526 nm (permanganato, por ejemplo)
  const lampara = (s) => (s < 7.5 ? 1 : 1 + 0.22 * Math.sin((s - 7.5) * 1.25) + 0.08 * Math.sin((s - 7.5) * 3.9));
  const yR = 108, yS = 236, xBS = 112;

  return {
    titulo: 'Doble haz: muestra y referencia',
    dur: 19,
    fases: [
      { t: 0, texto: 'La luz monocromática que sale del monocromador llega a un divisor de haz, que la reparte en dos haces de la misma longitud de onda.' },
      { t: 3.5, texto: 'El haz de referencia atraviesa una cubeta con el disolvente puro: su detector mide I₀. El haz de muestra atraviesa la disolución: su detector mide I, menor porque la muestra absorbe.' },
      { t: 7.5, texto: 'La intensidad de la lámpara nunca es perfectamente constante. Como los dos haces vienen de la misma lámpara, las dos señales suben y bajan a la vez.' },
      { t: 11.5, texto: 'El cociente T = I/I₀ no cambia: el doble haz compensa las fluctuaciones de la lámpara y la deriva de la electrónica. A = −log T.' },
      { t: 15, texto: 'Un equipo de haz simple mide primero el blanco (I₀) y después la muestra (I): lo que varíe la lámpara entre las dos medidas se convierte en error.' },
    ],
    dibujar(g, t) {
      const C = g.C, Lt = lampara(t), pulso = (y0, x0, x1, k, n = 5) => {
        for (let i = 0; i < n; i++) { const u = (t * 0.9 + i / n) % 1; if (u < k) g.circulo(lerp(x0, x1, u), y0, 2.6, { fill: col }); }
      };
      // haz de entrada
      g.texto('Del monocromador', 16, yR - 30, { size: 10, color: C.tenue });
      g.linea([[16, yR], [xBS, yR]], { color: col, lw: 3 * Lt, alpha: 0.85 });
      pulso(yR, 16, xBS, 1, 3);
      // divisor de haz (lámina a 45°) y espejo del haz de muestra
      g.linea([[xBS - 16, yR - 16], [xBS + 16, yR + 16]], { color: '#a9c3dc', lw: 4 });
      g.rotulo('Divisor de haz', xBS + 30, yR - 34, { size: 10 });
      g.linea([[xBS - 16, yS + 16], [xBS + 16, yS - 16]], { color: C.metalOsc, lw: 5 }); g.linea([[xBS - 16, yS + 16], [xBS + 16, yS - 16]], { color: '#e8edf3', lw: 2 });
      g.rotulo('Espejo', xBS - 4, yS + 34, { size: 10 });
      const k = tramo(t, 0.6, 3.2);
      // haz de referencia (transmitido) y de muestra (reflejado)
      g.linea([[xBS, yR], [lerp(xBS, 236, k), yR]], { color: col, lw: 2.2 * Lt, alpha: 0.8 });
      g.linea([[xBS, yR], [xBS, lerp(yR, yS, k)]], { color: col, lw: 2.2 * Lt, alpha: 0.8 });
      if (k >= 1) g.linea([[xBS, yS], [236, yS]], { color: col, lw: 2.2 * Lt, alpha: 0.8 });
      const k2 = tramo(t, 3.5, 5);
      if (k2 > 0) {
        g.linea([[270, yR], [lerp(270, 372, k2), yR]], { color: col, lw: 2.2 * Lt, alpha: 0.8 });
        g.linea([[270, yS], [lerp(270, 372, k2), yS]], { color: col, lw: 2.2 * Lt * T, alpha: 0.35 + 0.5 * T });
        if (k2 >= 1) { pulso(yR, 270, 372, 1, 5); pulso(yS, 270, 372, 1, 2); }
      }
      if (k >= 1) { pulso(yR, xBS, 236, 1, 4); pulso(yS, xBS + 2, 236, 1, 4); }
      // cubetas
      cubeta(g, 236, yR - 30, 34, 58, { liquido: C.liquido, etiqueta: 'Referencia: disolvente' });
      cubeta(g, 236, yS - 30, 34, 58, { liquido: 'rgba(160, 60, 170, 0.9)', etiqueta: 'Muestra' });
      // detectores
      for (const [y, et] of [[yR, 'R'], [yS, 'S']]) {
        g.rect(372, y - 18, 22, 36, { fill: C.metalOsc, r: 3 });
        g.rect(370, y - 8, 4, 16, { fill: '#2c2f6a' });
        g.texto(et, 383, y + 0.5, { size: 11, color: '#fff', align: 'center', weight: 700 });
      }
      g.texto('Detectores', 383, yS + 34, { size: 10, color: C.texto2, align: 'center', weight: 600 });
      if (t > 3.5) {
        g.rotulo(`I₀ = ${coma(Lt, 2)}`, 383, yR - 34, { size: 10.5, color: C.texto, alpha: tramo(t, 3.5, 4.2) });
        g.rotulo(`I = ${coma(Lt * T, 3)}`, 383, yS - 34, { size: 10.5, color: C.texto, alpha: tramo(t, 3.5, 4.2) });
      }

      /* --- señales frente al tiempo --- */
      const x0 = 418, w = 214, ventana = 8;
      const hist = (f) => (u) => { const s = t - ventana + u * ventana; return s < 3.5 ? -1 : f(s); };
      if (t > 3.5) {
        const a = tramo(t, 3.5, 4.2);
        g.grafico(x0, 22, w, 112, hist((s) => lampara(s) / 1.35), { color: '#2f9fd6', titulo: 'I₀ (referencia)', ejeX: 'tiempo', alpha: a, n: 120 });
        g.grafico(x0, 140, w, 92, hist((s) => (lampara(s) * T) / 0.45), { color: '#c2255c', titulo: 'I (muestra)', ejeX: 'tiempo', alpha: a, n: 120 });
      }
      if (t > 11.5) {
        const a = tramo(t, 11.5, 12.2);
        g.grafico(x0, 238, w, 96, hist(() => T / 0.45), { color: C.ok, titulo: `T = I/I₀ = ${coma(T, 3)}   →   A = ${coma(0.5, 2)}`, ejeX: 'tiempo', alpha: a, n: 60 });
      }
      if (t > 15) {
        const a = tramo(t, 15, 15.6);
        g.rect(16, 286, 380, 56, { fill: C.panel, stroke: C.linea, r: 6, alpha: a });
        g.texto('Haz simple: I₀ medido antes, con el blanco', 26, 302, { size: 10.5, color: C.texto2, weight: 600, alpha: a });
        const I0antes = 1, Iahora = lampara(t) * T;
        g.texto(`I/I₀ = ${coma(Iahora / I0antes, 3)} (real ${coma(T, 3)})  →  error de ${coma(Math.abs(Iahora / I0antes / T - 1) * 100, 0)} %`, 26, 324, { size: 10.5, color: Math.abs(Iahora / T - 1) > 0.02 ? C.mal : C.texto, alpha: a });
      }
    },
  };
}
