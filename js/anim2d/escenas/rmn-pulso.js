// RMN: pulso de radiofrecuencia visto en el sistema de referencia rotatorio. M₀ parte de +z (paralela a B₀); un campo B₁ a lo largo de x′,
// que gira a la frecuencia de Larmor, la hace girar un ángulo θ = γB₁τ (convenio habitual: un pulso de 90° sobre x lleva M a −y).
// Tras el pulso, M precesa en el plano horizontal e induce la señal en la bobina; las isocromatas se desfasan (T₂*) y Mz se recupera (T₁).
// Parámetros: p.p90 (µs, 10) · p.mhz (400).
import { tramo, suave, clamp } from '../dibujo.js';
import { num } from './util-analizadores.js';

export default function crear(p = {}) {
  const p90 = p.p90 || 10, mhz = p.mhz || 400;
  const nu1 = 1e3 / (4 * p90);                                  // kHz: γB₁/2π para que τ₉₀ = p90
  const TP0 = 3, TP1 = 7.5, TD = 10, TF = 15, dur = 21;
  const O = [168, 218];
  const ex = [-0.62, 0.36], ey = [1, 0], ez = [0, -1], S = 118;
  const P = (x, y, z) => [O[0] + S * (x * ex[0] + y * ey[0] + z * ez[0]), O[1] + S * (x * ex[1] + y * ey[1] + z * ez[1])];
  const iso = [-3, -2, -1, 0, 1, 2, 3].map((k) => k * 0.33);   // desplazamientos relativos de las isocromatas
  const theta = (t) => (Math.PI / 2) * tramo(t, TP0, TP1);
  const T2 = 2.2, T1 = 9;

  return {
    titulo: 'Pulso de 90° y señal de inducción libre',
    dur,
    fases: [
      { t: 0, texto: 'En equilibrio, la magnetización M₀ apunta a lo largo de B₀ (eje z). Si se observa desde un sistema de ejes que gira a la frecuencia de Larmor, la precesión desaparece y M queda inmóvil.' },
      { t: TP0, texto: `Un pulso de radiofrecuencia a ${mhz} MHz crea en la bobina un campo B₁ horizontal que, en el sistema rotatorio, es fijo a lo largo de x′. M gira alrededor de B₁ un ángulo θ = γB₁τ: con γB₁/2π = ${num(nu1, 0)} kHz, un pulso de ${num(p90)} µs la tumba 90°, hasta −y′.` },
      { t: TP1 + 0.2, texto: 'Al terminar el pulso, M está en el plano horizontal y vuelve a precesar alrededor de B₀ a casi 400 millones de vueltas por segundo. Ese imán giratorio induce una pequeña tensión alterna en la misma bobina.' },
      { t: TD, texto: 'Cada zona de la muestra siente un campo ligeramente distinto: sus magnetizaciones se desfasan, la componente horizontal se reduce (T₂*) y, más despacio, Mz vuelve al equilibrio (T₁).' },
      { t: TF, texto: 'La señal registrada es una oscilación amortiguada: el FID (free induction decay). Su amplitud es proporcional a sen θ: máxima con 90°, la mitad con 30° y nula con 180°, que solo invierte M.' },
    ],
    dibujar(g, t) {
      const C = g.C;
      /* --- ejes del sistema rotatorio --- */
      g.camara(14, 30, 316, 318, { titulo: 'Sistema de referencia rotatorio' });
      const circ = Array.from({ length: 49 }, (_, i) => { const a = (i / 48) * 6.283; return P(Math.cos(a), Math.sin(a), 0); });
      g.linea(circ, { color: C.rejilla, lw: 1, fill: C.vacio, cerrar: true });
      for (const [v, lab] of [[[1.25, 0, 0], 'x′'], [[0, 1.25, 0], 'y′'], [[0, 0, 1.2], 'z']]) {
        const [a, b] = P(-v[0] * 0.0, 0, 0), [c, d] = P(...v);
        g.flecha(a, b, c, d, { color: C.tenue, lw: 1.2, punta: 6 });
        g.texto(lab, c + (lab === 'x′' ? -14 : 6), d + (lab === 'z' ? -4 : 6), { size: 11, color: C.texto2, weight: 600 });
      }
      g.linea([P(0, -1.2, 0), P(0, 0, 0)], { color: C.tenue, lw: 1, dash: [3, 3] });
      g.linea([P(-1.2, 0, 0), P(0, 0, 0)], { color: C.tenue, lw: 1, dash: [3, 3] });
      const [bzx, bzy] = P(0, 0, 1.2);
      g.texto('B₀', bzx - 26, bzy + 6, { size: 12, color: C.acento, weight: 700 });
      // B₁ durante el pulso
      const enPulso = t >= TP0 && t < TP1;
      if (enPulso) {
        const k = 0.7 + 0.3 * Math.sin(t * 20);
        const [a, b] = P(0, 0, 0), [c, d] = P(0.95, 0, 0);
        g.flecha(a, b, c, d, { color: C.foton, lw: 4, punta: 11, alpha: k });
        g.texto('B₁', c - 20, d + 16, { size: 12, color: C.foton, weight: 700 });
      }
      // magnetización: rotación alrededor de x′ (hacia −y′); después, isocromatas que se desfasan y recuperación de Mz
      const th = theta(t);
      const td = Math.max(0, t - TP1), fan = tramo(t, TD - 0.5, TF) * 1.0;
      const mz = t < TP1 ? Math.cos(th) : 1 - (1 - Math.cos(th)) * Math.exp(-Math.max(0, t - TD) / T1);
      if (t >= TP1) {
        // isocromatas (abanico)
        for (const d of iso) {
          const a = -Math.PI / 2 + d * fan * 2.6 + 0.35 * td;
          const r = Math.exp(-Math.max(0, t - TD) / (T2 * 4));
          const [a1, b1] = P(0, 0, 0), [c1, d1] = P(Math.cos(a) * 0.85 * r, Math.sin(a) * 0.85 * r, mz * 0.85);
          g.flecha(a1, b1, c1, d1, { color: C.ion, lw: 1.2, punta: 5, alpha: 0.35 + 0.4 * fan });
        }
      }
      // vector suma
      let mx = 0, my = -Math.sin(th);
      if (t >= TP1) {
        const a0 = -Math.PI / 2 + 0.35 * td;
        let sx = 0, sy = 0; for (const d of iso) { const a = a0 + d * fan * 2.6; sx += Math.cos(a); sy += Math.sin(a); }
        const r = Math.exp(-Math.max(0, t - TD) / (T2 * 4));
        mx = (sx / iso.length) * r; my = (sy / iso.length) * r;
      }
      const [o1, o2] = P(0, 0, 0), [m1, m2] = P(mx, my, mz);
      g.flecha(o1, o2, m1, m2, { color: C.ion, lw: 4, punta: 12 });
      g.rotulo('M', m1 + (m1 < o1 ? -14 : 14), m2 - 12, { size: 11, color: C.ion });
      g.texto(`θ = ${num((th * 180) / Math.PI, 0)}°`, 26, 330, { size: 12, weight: 700, color: C.foton });

      /* --- panel derecho: pulso, bobina y FID --- */
      const X0 = 344, W = 282;
      g.rect(X0, 30, W, 318, { fill: C.panel, stroke: C.linea, r: 8 });
      // envolvente del pulso con la portadora
      g.texto('Pulso de RF', X0 + 12, 46, { size: 11, color: C.texto2, weight: 700 });
      const px0 = X0 + 16, pw = W - 32, py = 84;
      g.linea([[px0, py], [px0 + pw, py]], { color: C.rejilla, lw: 1 });
      const ancho = pw * 0.36, xa = px0 + pw * 0.2;
      const kP = tramo(t, TP0, TP1);
      const pts = [];
      for (let i = 0; i <= 160; i++) { const u = i / 160, x = xa + u * ancho; pts.push([x, py - 22 * Math.sin(u * 60) * (u <= kP || t >= TP1 ? 1 : 0)]); }
      g.linea([[px0, py], [xa, py]], { color: C.foton, lw: 1.3 });
      g.linea(pts, { color: C.foton, lw: 1.1, alpha: t >= TP0 ? 1 : 0.25 });
      g.linea([[xa + ancho, py], [px0 + pw, py]], { color: C.foton, lw: 1.3 });
      g.texto(`τ = ${num(p90 * clamp(kP), 1)} µs`, xa + ancho + 10, py - 14, { size: 11, color: C.foton, weight: 700, alpha: t >= TP0 ? 1 : 0.4 });
      // bobina y tensión inducida
      const by = 150;
      g.texto('Bobina de la sonda', X0 + 12, by - 22, { size: 11, color: C.texto2, weight: 700 });
      for (let i = 0; i < 6; i++) g.circulo(X0 + 40 + i * 12, by + 6, 9, { stroke: enPulso ? C.foton : t >= TP1 ? C.e : C.metal, lw: 2.2 });
      const ind = t >= TP1 ? Math.hypot(mx, my) : 0;
      const v = ind * Math.sin(t * 9);
      g.texto(enPulso ? 'transmite' : t >= TP1 ? 'recibe' : 'en reposo', X0 + 40, by + 32, { size: 10.5, color: enPulso ? C.foton : t >= TP1 ? C.e : C.tenue, weight: 600 });
      g.rect(X0 + 150, by - 10, 110, 32, { fill: C.vacio, stroke: C.linea, r: 4 });
      g.linea([[X0 + 205, by + 6], [X0 + 205 + v * 44 * Math.cos(-0.9 + v), by + 6 - Math.abs(v) * 12 - 6]], { color: C.e, lw: 2 });
      g.texto('tensión inducida', X0 + 205, by + 34, { size: 9.5, color: C.tenue, align: 'center' });
      // FID
      const fy0 = 214, fh = 112;
      g.rect(X0 + 12, fy0, W - 24, fh, { fill: C.vacio, stroke: C.linea, r: 4 });
      g.texto('FID', X0 + 20, fy0 + 12, { size: 11, color: C.texto2, weight: 700 });
      const uF = tramo(t, TP1, dur - 1);
      const yc = fy0 + fh / 2 + 6, fx0 = X0 + 20, fw = W - 40;
      g.linea([[fx0, yc], [fx0 + fw, yc]], { color: C.rejilla, lw: 1 });
      if (uF > 0) {
        const q = [];
        for (let i = 0; i <= 300 * uF; i++) { const u = i / 300; q.push([fx0 + u * fw, yc - 40 * Math.exp(-u * 3.2) * Math.cos(u * 70)]); }
        g.linea(q, { color: C.e, lw: 1.3 });
        g.linea(Array.from({ length: 41 }, (_, i) => { const u = (i / 40) * uF; return [fx0 + u * fw, yc - 40 * Math.exp(-u * 3.2)]; }), { color: C.tenue, lw: 1, dash: [3, 3] });
        g.texto('e^(−t/T₂*)', fx0 + fw * 0.3, yc - 30, { size: 10, color: C.tenue, alpha: suave(tramo(t, TD, TD + 1)) });
      }
      g.texto('t →', fx0 + fw, yc + 46, { size: 9.5, color: C.tenue, align: 'right' });
      // dependencia con el ángulo
      if (t > TF + 1.2) {
        const k = suave(tramo(t, TF + 1.2, TF + 2));
        g.rect(X0 + 150, fy0 + 4, 116, 46, { fill: C.panel, stroke: C.linea, r: 4, alpha: k });
        [[30, 0.5], [90, 1], [180, 0]].forEach(([a, s], i) => {
          const x = X0 + 166 + i * 36;
          g.rect(x, fy0 + 40 - 26 * s, 14, 26 * s + 0.5, { fill: C.e, alpha: k });
          g.texto(`${a}°`, x + 7, fy0 + 47, { size: 9, color: C.texto2, align: 'center', alpha: k });
        });
        g.texto('señal ∝ sen θ', X0 + 208, fy0 + 10, { size: 9, color: C.tenue, align: 'center', alpha: k });
      }
    },
  };
}
