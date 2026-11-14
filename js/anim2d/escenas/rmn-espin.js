// RMN: núcleos de ¹H en un campo magnético. Sin campo, los momentos magnéticos apuntan al azar; con B₀ se orientan a favor (α) o en
// contra (β) del campo y precesan alrededor de él a la frecuencia de Larmor ν₀ = γB₀/2π. La diferencia de energía hν₀ produce un
// exceso minúsculo de núcleos α (distribución de Boltzmann) que da una magnetización neta M₀ paralela a B₀.
// El exceso de α se exagera en el dibujo (9 frente a 7); el valor real se calcula y se muestra.
// Parámetros: p.B (T, 9,4) · p.T (K, 298).
import { tramo, suave, lerp, azar } from '../dibujo.js';
import { num } from './util-analizadores.js';

export default function crear(p = {}) {
  const B = p.B || 9.4, T = p.T || 298;
  const nu = 42.577 * B;                                     // MHz para ¹H
  const x = (6.62607e-34 * nu * 1e6) / (1.380649e-23 * T);   // hν/kT
  const exceso = Math.round(x * 1e6);                        // α por cada millón de β (Nα/Nβ = e^(hν/kT))
  const R = azar(7);
  const spins = Array.from({ length: 16 }, (_, i) => ({
    cx: 96 + (i % 4) * 60, cy: 92 + Math.floor(i / 4) * 62,
    a0: R() * 6.283, w: (R() - 0.5) * 1.6, ph: R() * 6.283,
    up: [0, 2, 3, 5, 6, 9, 10, 12, 15].includes(i) ? 1 : 0,          // 9 α y 7 β
  }));
  const TB = 3.6, TE = 8.2, TM = 12.2, TF = 15.6, dur = 19;

  return {
    titulo: 'Espines nucleares en un campo magnético',
    dur,
    fases: [
      { t: 0, texto: 'Cada núcleo de ¹H tiene espín ½ y un pequeño momento magnético. Sin campo externo, los momentos apuntan en todas las direcciones y se anulan entre sí.' },
      { t: TB, texto: `Al aplicar el campo B₀, cada momento solo puede tener dos orientaciones respecto a él: a favor (estado α) o en contra (β). No queda quieto: precesa alrededor de B₀ como una peonza, a la frecuencia de Larmor ν₀ = γB₀/2π, ${num(nu, 0)} MHz a ${num(B, 1)} T.` },
      { t: TE, texto: `Los dos estados difieren en energía ΔE = hν₀. A ${T} K esa diferencia es diminuta frente a la energía térmica: por cada millón de núcleos en β hay solo un millón ${num(exceso)} en α.` },
      { t: TM, texto: 'Las fases de precesión están al azar, así que las componentes horizontales se cancelan. Solo sobrevive el pequeño exceso en la dirección del campo: la magnetización neta M₀, paralela a B₀, que es lo que mide la RMN.' },
      { t: TF, texto: 'La frecuencia es proporcional al campo y depende del núcleo (de γ). Un campo más intenso separa más los niveles, aumenta el exceso de población y da más señal.' },
    ],
    dibujar(g, t) {
      const C = g.C;
      const kB = suave(tramo(t, TB, TB + 1.4));
      const kM = suave(tramo(t, TM, TM + 1.2));
      /* --- muestra --- */
      g.camara(20, 34, 300, 300, { titulo: 'Muestra' });
      // B₀
      g.flecha(42, 310, 42, 60, { color: C.acento, lw: 3, punta: 10, alpha: kB });
      g.texto('B₀', 50, 66, { size: 13, color: C.acento, weight: 700, alpha: kB });
      for (const s of spins) {
        const L = 22, fi = s.ph + t * 2.6;
        // sin campo: dirección al azar que cambia despacio; con campo: cono de precesión hacia arriba (α) o hacia abajo (β)
        const aLibre = s.a0 + s.w * t;
        const th = s.up ? 0.55 : Math.PI - 0.55;
        const tx = Math.sin(th) * Math.cos(fi), ty = Math.cos(th), tz = Math.sin(th) * Math.sin(fi);
        const dx = lerp(Math.cos(aLibre), tx, kB), dy = lerp(Math.sin(aLibre), -ty + tz * 0.25, kB);
        const n = Math.hypot(dx, dy) || 1;
        const al = 1 - 0.65 * kM;
        if (kB > 0.5) g.linea(Array.from({ length: 25 }, (_, k) => { const f = (k / 24) * 6.283; return [s.cx + Math.sin(th) * Math.cos(f) * L, s.cy - (Math.cos(th) - Math.sin(th) * Math.sin(f) * 0.25) * L]; }), { color: C.rejilla, lw: 1, alpha: al * (kB - 0.5) * 2 });
        g.circulo(s.cx, s.cy, 6, { fill: s.up && kB > 0.5 ? C.ion : kB > 0.5 ? C.anion : C.neutro, alpha: al });
        g.flecha(s.cx, s.cy, s.cx + (dx / n) * L, s.cy + (dy / n) * L, { color: s.up && kB > 0.5 ? C.ion : kB > 0.5 ? C.anion : C.texto2, lw: 1.6, punta: 5, alpha: al });
      }
      if (kB > 0.6 && t < TM) {
        g.leyenda([[C.ion, 'α (a favor de B₀)'], [C.anion, 'β (en contra)']], 60, 324, { size: 9.5 });
      }
      // magnetización neta
      if (kM > 0) {
        g.flecha(170, 270, 170, 270 - 150 * kM, { color: C.foton, lw: 5, punta: 14 });
        g.rotulo('M₀ ∥ B₀', 222, 270 - 150 * kM, { size: 11, color: C.foton });
      }
      /* --- panel derecho --- */
      const X0 = 340, W = 284;
      g.rect(X0, 34, W, 300, { fill: C.panel, stroke: C.linea, r: 8 });
      if (t < TB) {
        g.texto('Sin campo', X0 + 14, 54, { size: 12, weight: 700, color: C.texto2 });
        g.texto('Orientaciones al azar: momento total nulo', X0 + 14, 74, { size: 11, color: C.texto2 });
        g.circulo(X0 + W / 2, 200, 70, { stroke: C.linea, lw: 1.2 });
        for (let i = 0; i < 12; i++) { const a = (i / 12) * 6.283 + t * 0.3; g.flecha(X0 + W / 2, 200, X0 + W / 2 + Math.cos(a) * 62, 200 + Math.sin(a) * 62, { color: C.neutro, lw: 1.4, punta: 6 }); }
      } else if (t < TE) {
        // cono de precesión
        const cx = X0 + W / 2, cy = 222, L = 110, th = 0.5, fi = t * 2.4;
        const k = suave(tramo(t, TB, TB + 1));
        g.texto('Precesión de Larmor', X0 + 14, 54, { size: 12, weight: 700, color: C.texto2 });
        g.flecha(cx, cy + 20, cx, 64, { color: C.acento, lw: 2.5, punta: 9 });
        g.texto('B₀', cx + 8, 70, { size: 12, color: C.acento, weight: 700 });
        const ry = 0.28;
        g.linea(Array.from({ length: 41 }, (_, i) => { const f = (i / 40) * 6.283; return [cx + Math.sin(th) * L * Math.cos(f), cy - Math.cos(th) * L + Math.sin(th) * L * Math.sin(f) * ry]; }), { color: C.ion, lw: 1, dash: [4, 3], alpha: k });
        const tx = cx + Math.sin(th) * L * Math.cos(fi), ty = cy - Math.cos(th) * L + Math.sin(th) * L * Math.sin(fi) * ry;
        g.flecha(cx, cy, tx, ty, { color: C.ion, lw: 3, punta: 10, alpha: k });
        g.circulo(cx, cy, 7, { fill: C.ion });
        g.texto(`ν₀ = γB₀ / 2π = ${num(nu, 0)} MHz`, X0 + 14, 300, { size: 12, weight: 700, color: C.texto });
        g.texto(`γ/2π (¹H) = 42,577 MHz/T · B₀ = ${num(B, 1)} T`, X0 + 14, 318, { size: 10.5, color: C.texto2 });
      } else if (t < TF) {
        // niveles de energía y poblaciones
        const yA = 250, yBt = 110, xa = X0 + 40, xb = X0 + W - 90;
        const k = suave(tramo(t, TE, TE + 1));
        g.texto('Niveles de energía', X0 + 14, 54, { size: 12, weight: 700, color: C.texto2 });
        g.linea([[xa + 60, yBt], [xb, yBt]], { color: C.anion, lw: 3, alpha: k });
        g.linea([[xa + 60, yA], [xb, yA]], { color: C.ion, lw: 3, alpha: k });
        g.texto('β  (−½)', xb + 8, yBt, { size: 11, color: C.anion, weight: 700, alpha: k });
        g.texto('α  (+½)', xb + 8, yA, { size: 11, color: C.ion, weight: 700, alpha: k });
        for (let i = 0; i < 7; i++) g.circulo(xa + 70 + i * 10, yBt - 8, 3.8, { fill: C.anion, alpha: k });
        for (let i = 0; i < 9; i++) g.circulo(xa + 70 + i * 10, yA - 8, 3.8, { fill: C.ion, alpha: k });
        g.flecha(xa + 48, yA - 4, xa + 48, yBt + 4, { color: C.foton, lw: 1.6, punta: 7, alpha: k });
        g.flecha(xa + 48, yBt + 4, xa + 48, yA - 4, { color: C.foton, lw: 1.6, punta: 7, alpha: k });
        g.texto('ΔE = hν₀', xa + 40, (yA + yBt) / 2, { size: 11, color: C.foton, weight: 700, align: 'right', alpha: k });
        g.texto(`Nα / Nβ = e^(hν₀/kT) ≈ 1 + ${num(x * 1e5, 1)}·10⁻⁵`, X0 + 14, 286, { size: 11, color: C.texto, weight: 600, alpha: k });
        g.texto('(en el dibujo, 9 frente a 7: muy exagerado)', X0 + 14, 304, { size: 10, color: C.tenue, alpha: k });
        g.texto(`a ${num(nu, 0)} MHz y ${T} K`, X0 + 14, 320, { size: 10, color: C.tenue, alpha: k });
      } else {
        // tabla de frecuencias
        const k = suave(tramo(t, TF, TF + 0.8));
        g.texto('ν₀ = γB₀ / 2π', X0 + 14, 56, { size: 13, weight: 700, color: C.texto });
        const filas = [['¹H', '1,41 T', '60 MHz'], ['¹H', '9,40 T', '400 MHz'], ['¹H', '14,1 T', '600 MHz'], ['¹³C', '9,40 T', '100,6 MHz'], ['²H (lock)', '9,40 T', '61,4 MHz']];
        filas.forEach(([n, b, f], i) => {
          const y = 98 + i * 40, sel = b === '9,40 T';
          g.rect(X0 + 12, y - 15, W - 24, 30, { fill: sel ? C.campo : C.vacio, r: 5, alpha: k });
          g.texto(n, X0 + 24, y, { size: 12, weight: 700, color: C.texto, alpha: k });
          g.texto(b, X0 + 120, y, { size: 12, color: C.texto2, alpha: k });
          g.texto(f, X0 + W - 22, y, { size: 12, weight: 700, color: sel ? C.acento : C.texto, align: 'right', alpha: k });
        });
        g.texto('Más campo: más energía, más exceso α, más señal.', X0 + 14, 314, { size: 10.5, color: C.texto2, alpha: k });
      }
    },
  };
}
