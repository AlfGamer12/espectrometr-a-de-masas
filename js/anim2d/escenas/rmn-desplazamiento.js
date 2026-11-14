// RMN: apantallamiento electrónico y desplazamiento químico. B₀ induce en la nube electrónica una circulación que crea un campo
// opuesto, σB₀: el núcleo siente B_ef = B₀(1 − σ). Un átomo electronegativo cercano retira densidad electrónica (desapantalla) y la
// señal aparece a mayor frecuencia. La escala δ (ppm) respecto al TMS no depende del campo; en Hz, 1 ppm = ν₀/10⁶.
// Parámetros: p.mhz (400).
import { tramo, suave } from '../dibujo.js';
import { num } from './util-analizadores.js';

export default function crear(p = {}) {
  const mhz = p.mhz || 400;
  const T1 = 3.2, T2 = 7.4, T3 = 11.4, T4 = 15, dur = 19;
  const marcas = [[0, 'TMS', 'Si(CH₃)₄'], [1.26, 'CH₃', 'alquilo'], [2.05, 'CH₃CO', 'junto a C=O'], [4.12, 'OCH₂', 'junto a O'], [7.26, 'CHCl₃', 'aromático, CHCl₃'], [9.7, 'CHO', 'aldehído']];

  return {
    titulo: 'Apantallamiento y desplazamiento químico',
    dur,
    fases: [
      { t: 0, texto: 'Si todos los protones sintieran el mismo campo, todos resonarían a la misma frecuencia y la RMN no distinguiría unos de otros.' },
      { t: T1, texto: 'El campo B₀ hace circular a los electrones que rodean el núcleo. Esa corriente crea en el núcleo un pequeño campo opuesto, proporcional a B₀: el núcleo queda apantallado y siente B_ef = B₀(1 − σ).' },
      { t: T2, texto: 'Un átomo electronegativo, como el oxígeno, retira densidad electrónica de los protones vecinos. Quedan menos apantallados, sienten más campo y resuenan a mayor frecuencia: el OCH₂ del acetato de etilo aparece a 4,12 ppm y el CH₃ terminal a 1,26.' },
      { t: T3, texto: 'Las frecuencias se expresan respecto a la del TMS: δ = (ν − ν_TMS)/ν_TMS · 10⁶, en partes por millón. Así el desplazamiento químico no depende del imán.' },
      { t: T4, texto: `En hercios, 1 ppm vale ν₀/10⁶: ${num(mhz)} Hz a ${num(mhz)} MHz y 60 Hz a 60 MHz. Las señales quedan más separadas en un imán más intenso, aunque su posición en ppm sea la misma.` },
    ],
    dibujar(g, t) {
      const C = g.C;
      const kI = suave(tramo(t, T1, T1 + 1.5)), kC = suave(tramo(t, T2, T2 + 1.2));
      /* --- núcleos con su nube electrónica --- */
      g.rect(14, 10, 300, 230, { fill: C.panel, stroke: C.linea, r: 8 });
      g.flecha(34, 222, 34, 34, { color: C.acento, lw: 3, punta: 10 });
      g.texto('B₀', 42, 40, { size: 13, color: C.acento, weight: 700 });
      const nucleo = (cx, cy, rn, lab, sub) => {
        const ctx = g.ctx, gr = ctx.createRadialGradient(cx, cy, 4, cx, cy, rn);
        gr.addColorStop(0, C.e + 'aa'); gr.addColorStop(1, C.e + '00');
        ctx.save(); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(cx, cy, rn, 0, 7); ctx.fill(); ctx.restore();
        // circulación inducida
        if (kI > 0) {
          const ry = rn * 0.32, fi = t * 3;
          g.linea(Array.from({ length: 41 }, (_, i) => { const a = (i / 40) * 6.283; return [cx + rn * 0.72 * Math.cos(a), cy - 18 + ry * Math.sin(a)]; }), { color: C.e, lw: 1.2, alpha: kI * 0.8 });
          g.electron(cx + rn * 0.72 * Math.cos(fi), cy - 18 + ry * Math.sin(fi), { alpha: kI });
          g.electron(cx + rn * 0.72 * Math.cos(fi + 3.14), cy - 18 + ry * Math.sin(fi + 3.14), { alpha: kI });
          const lb = 14 + rn * 0.35;
          g.flecha(cx, cy - 8, cx, cy - 8 + lb, { color: C.mal, lw: 2.5, punta: 8, alpha: kI });
          g.texto('B_ind', cx + 8, cy + lb - 6, { size: 10, color: C.mal, weight: 700, alpha: kI });
        }
        g.circulo(cx, cy, 6, { fill: C.ion });
        g.texto(lab, cx, cy + rn * 0.9 + 14, { size: 11.5, color: C.texto, weight: 700, align: 'center' });
        if (sub) g.texto(sub, cx, cy + rn * 0.9 + 30, { size: 10, color: C.texto2, align: 'center' });
      };
      if (t < T2) nucleo(170, 120, 72, 'H', '');
      else {
        nucleo(110, 118, 62, 'H del CH₃', 'más apantallado');
        nucleo(240, 118, 38 + 6 * (1 - kC), 'H del OCH₂', 'desapantallado por el O');
        g.circulo(278, 70, 12, { fill: C.mal, alpha: kC }); g.texto('O', 278, 70.5, { size: 11, color: '#fff', weight: 700, align: 'center', alpha: kC });
        g.flecha(262, 84, 270, 76, { color: C.mal, lw: 1.4, punta: 6, alpha: kC });
      }
      g.texto('B_ef = B₀ (1 − σ)', 300, 30, { size: 12, color: C.texto, weight: 700, align: 'right', alpha: kI });

      /* --- escala de desplazamientos --- */
      const x0 = 340, x1 = 616, yb = 210;
      g.rect(326, 10, 300, 230, { fill: C.panel, stroke: C.linea, r: 8 });
      g.texto('Desplazamiento químico δ', 338, 26, { size: 11, color: C.texto2, weight: 700 });
      const X = (d) => x1 - (d / 10) * (x1 - x0);
      g.linea([[x0, yb], [x1, yb]], { color: C.tenue, lw: 1.2 });
      for (let d = 0; d <= 10; d++) { g.linea([[X(d), yb], [X(d), yb + 4]], { color: C.tenue, lw: 1 }); g.texto(String(d), X(d), yb + 13, { size: 9.5, color: C.tenue, align: 'center' }); }
      g.texto('δ (ppm)', x1, yb + 25, { size: 9.5, color: C.tenue, align: 'right' });
      g.texto('← menos apantallado', x0, 46, { size: 9.5, color: C.tenue });
      g.texto('más apantallado →', x1, 46, { size: 9.5, color: C.tenue, align: 'right' });
      marcas.forEach(([d, lab, sub], i) => {
        const k = suave(tramo(t, T2 + 0.4 + i * 0.35, T2 + 1 + i * 0.35));
        const h = 34 + (i % 2) * 50;
        g.linea([[X(d), yb], [X(d), yb - h]], { color: i === 0 ? C.tenue : C.m[(i - 1) % 6], lw: 2.4, alpha: k });
        g.texto(lab, X(d), yb - h - 18, { size: 10, color: C.texto, weight: 700, align: 'center', alpha: k });
        g.texto(num(d, d % 1 ? 2 : 0), X(d), yb - h - 6, { size: 9, color: C.texto2, align: 'center', alpha: k });
      });

      /* --- definición y equivalencia en Hz --- */
      const kD = suave(tramo(t, T3, T3 + 1));
      g.rect(14, 252, 612, 98, { fill: C.panel, stroke: C.linea, r: 8, alpha: Math.max(0.3, kD) });
      g.texto('δ = (ν − ν_TMS) / ν_TMS · 10⁶', 30, 276, { size: 14, color: C.texto, weight: 700, alpha: kD });
      g.texto('Diferencia relativa: no cambia con el campo.', 30, 298, { size: 11, color: C.texto2, alpha: kD });
      const kH = suave(tramo(t, T4, T4 + 1));
      // 1 ppm en Hz a dos campos
      [[mhz, 0], [60, 1]].forEach(([f, i]) => {
        const y = 272 + i * 40, ancho = Math.max(4, (f / Math.max(mhz, 60)) * 270);
        g.texto(`${num(f)} MHz:  1 ppm = ${num(f)} Hz`, 340, y, { size: 11, color: C.texto, weight: 600, alpha: kH });
        g.rect(340, y + 9, ancho, 10, { fill: i ? C.foton : C.acento, r: 3, alpha: kH * 0.85 });
      });
      g.texto(`acetato de etilo: 4,12 − 1,26 ppm = ${num(2.86 * mhz, 0)} Hz a ${num(mhz)} MHz`, 30, 330, { size: 10.5, color: C.texto2, alpha: kH });
    },
  };
}
