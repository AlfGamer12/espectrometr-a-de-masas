// Vibraciones moleculares y absorción de infrarrojo. Modelo de muelle (σ = (1/2πc)·√(k/μ)), tensión del C=O, tensión C–H,
// flexión (tijera) del CH₂ y los dos modos de tensión del CO₂ (simétrico, inactivo en IR; asimétrico, activo). A la derecha se
// marcan en un espectro de transmitancia las bandas que va absorbiendo cada vibración. Escena sin estado (función de t).
// Parámetros opcionales: p.equipo (texto del pie).
import { tramo, suave, lerp } from '../dibujo.js';

export default function crear(p = {}) {
  const MX = 170, MY = 168;                        // centro de la molécula
  const S0 = 350, S1 = 624, SY0 = 58, SY1 = 268;   // panel del espectro
  const sx = (s) => S0 + 14 + ((4000 - s) / 3600) * (S1 - S0 - 28);
  const bandas = [
    { s: 1715, w: 22, d: 0.75, t: 6.6, txt: 'C=O' },
    { s: 2925, w: 30, d: 0.5, t: 10.6, txt: 'C–H' }, { s: 2855, w: 24, d: 0.35, t: 10.6 },
    { s: 1465, w: 22, d: 0.4, t: 14.6, txt: 'δ CH₂' },
    { s: 2349, w: 26, d: 0.6, t: 20.6, txt: 'CO₂' },
  ];
  const atomo = (g, x, y, r, col, txt, borde) => {
    g.circulo(x, y, r, { fill: col, stroke: borde, lw: 1 });
    if (txt) g.texto(txt, x, y + 0.5, { size: Math.max(9, r * 0.9), color: col === '#ffffff' || col === '#f1f3f5' ? '#333' : '#fff', align: 'center', weight: 700 });
  };
  const enlace = (g, a, b, n = 1, col) => {
    const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L;
    for (let i = 0; i < n; i++) { const o = (i - (n - 1) / 2) * 4.5; g.linea([[a[0] + nx * o, a[1] + ny * o], [b[0] + nx * o, b[1] + ny * o]], { color: col, lw: 2.6 }); }
  };
  const muelle = (g, x0, x1, y, col) => {
    const pts = [[x0, y]], n = 12;
    for (let i = 1; i < n; i++) pts.push([lerp(x0, x1, i / n), y + (i % 2 ? -7 : 7)]);
    pts.push([x1, y]); g.linea(pts, { color: col, lw: 1.8 });
  };

  return {
    titulo: 'Vibraciones moleculares y absorción infrarroja',
    dur: 22,
    fases: [
      { t: 0, texto: 'Dos átomos unidos por un enlace se comportan como masas unidas por un muelle. Su frecuencia de vibración, en número de onda, es σ = (1/2πc)·√(k/μ): más alta cuanto más fuerte es el enlace (k) y más ligeros los átomos (μ, masa reducida).' },
      { t: 4.5, texto: 'Si llega radiación infrarroja de la misma frecuencia que una vibración y esa vibración cambia el momento dipolar, la molécula absorbe el fotón y vibra con más amplitud. El C=O, muy polar, absorbe con fuerza hacia 1715 cm⁻¹.' },
      { t: 9.5, texto: 'El hidrógeno es muy ligero, así que la tensión C–H tiene una frecuencia alta: 2850–3000 cm⁻¹. Por el mismo motivo, el O–H aparece hacia 3200–3600 cm⁻¹, ancho cuando hay enlaces de hidrógeno.' },
      { t: 13.5, texto: 'Doblar un ángulo cuesta menos que estirar un enlace: las flexiones tienen frecuencias más bajas. La tijera del CH₂ absorbe hacia 1465 cm⁻¹. Por debajo de 1500 cm⁻¹ se acumulan muchas bandas: es la región de la huella dactilar.' },
      { t: 17.5, texto: 'Solo absorben las vibraciones que hacen cambiar el dipolo. En el CO₂ la tensión simétrica lo mantiene nulo y es inactiva en infrarrojo; la asimétrica sí lo cambia y absorbe a 2349 cm⁻¹, la banda doble que aparece en los fondos por el CO₂ del aire.' },
    ],
    dibujar(g, t) {
      const C = g.C;
      const colC = C.metalOsc, colO = C.mal, colH = '#f1f3f5';
      /* --- panel izquierdo --- */
      g.camara(14, 30, 320, 262, { titulo: 'Molécula' });
      // onda infrarroja incidente y transmitida
      const fase = t < 4.5 ? 0 : t < 9.5 ? 1 : t < 13.5 ? 2 : t < 17.5 ? 3 : 4;
      const abs = fase === 1 ? tramo(t, 6.2, 7.0) : fase === 2 ? tramo(t, 10.2, 11) : fase === 3 ? tramo(t, 14.2, 15) : fase === 4 ? tramo(t, 20.2, 21) : 0;
      if (fase > 0) {
        const long = fase === 1 ? 26 : fase === 2 ? 16 : fase === 3 ? 30 : 19;
        const kIn = tramo(t, [4.5, 9.5, 13.5, 17.5][fase - 1], [4.5, 9.5, 13.5, 17.5][fase - 1] + 1.2);
        g.foton(26, 252, 26 + 120 * kIn, 252, { amp: 7, long, lw: 1.8 });
        const inactiva = fase === 4 && t < 19.8;
        const ampOut = inactiva ? 7 : 7 * (1 - 0.65 * abs);
        if (kIn >= 1) g.foton(206, 252, 322, 252, { amp: ampOut, long, lw: 1.8, alpha: 0.9 });
        g.rotulo(inactiva ? 'no se absorbe' : abs > 0.5 ? 'parte absorbida' : 'IR', 264, 228, { size: 9.5, color: C.foton });
      }
      if (fase === 0) {
        const x = 7 * Math.sin(t * 5);
        const a = [MX - 60 - x * 0.55, MY], b = [MX + 60 + x * 0.45, MY];
        muelle(g, a[0] + 22, b[0] - 16, MY, C.texto2);
        atomo(g, a[0], a[1], 22, C.metalOsc, 'm₁'); atomo(g, b[0], b[1], 16, C.acento, 'm₂');
        g.texto('σ = (1/2πc)·√(k/μ)', MX, 92, { size: 15, align: 'center', weight: 700, italic: true });
        g.texto('k: rigidez del enlace', MX, 222, { size: 10.5, color: C.texto2, align: 'center' });
        g.texto('μ = m₁m₂ / (m₁ + m₂)', MX, 240, { size: 10.5, color: C.texto2, align: 'center' });
      } else if (fase === 1) {
        // C=O: el oxígeno, más pesado y electronegativo, con δ−; el dipolo oscila
        const A = 3 + 6 * suave(abs), x = A * Math.sin(t * 9);
        const c = [MX - 32 - x * 0.57, MY], o = [MX + 32 + x * 0.43, MY];
        enlace(g, [c[0] - 30, MY - 22], c, 1, C.texto2); enlace(g, [c[0] - 30, MY + 22], c, 1, C.texto2);
        g.texto('R', c[0] - 40, MY - 28, { size: 11, color: C.tenue, align: 'center' }); g.texto('R', c[0] - 40, MY + 30, { size: 11, color: C.tenue, align: 'center' });
        enlace(g, c, o, 2, C.texto2);
        atomo(g, c[0], c[1], 15, colC, 'C'); atomo(g, o[0], o[1], 17, colO, 'O');
        g.texto('δ+', c[0], MY - 26, { size: 10, color: C.acento, align: 'center', weight: 700 }); g.texto('δ−', o[0], MY - 28, { size: 10, color: colO, align: 'center', weight: 700 });
        g.flecha(MX - 26, MY + 34, MX + 26 + x * 2, MY + 34, { color: C.acento, lw: 1.4, punta: 6 });
        g.texto('dipolo', MX, MY + 48, { size: 9.5, color: C.acento, align: 'center' });
        g.rotulo('tensión C=O  ≈ 1715 cm⁻¹', MX, 64, { size: 10.5 });
      } else if (fase === 2) {
        const x = (2.5 + 4 * suave(abs)) * Math.sin(t * 16);
        const c = [MX - 10, MY];
        enlace(g, [c[0] - 46, MY], c, 1, C.texto2);
        g.texto('R', c[0] - 56, MY + 1, { size: 11, color: C.tenue, align: 'center' });
        const hs = [[1, -1], [1, 1]].map(([dx, dy]) => [c[0] + dx * (36 + x) * 0.8, c[1] + dy * (36 + x) * 0.6]);
        for (const h of hs) enlace(g, c, h, 1, C.texto2);
        atomo(g, c[0], c[1], 15, colC, 'C');
        for (const h of hs) atomo(g, h[0], h[1], 9, colH, 'H', C.linea);
        g.rotulo('tensión C–H  2850–3000 cm⁻¹', MX, 64, { size: 10.5 });
      } else if (fase === 3) {
        const a = (0.62 + (0.1 + 0.12 * suave(abs)) * Math.sin(t * 7));
        const c = [MX - 10, MY];
        enlace(g, [c[0] - 46, MY], c, 1, C.texto2);
        g.texto('R', c[0] - 56, MY + 1, { size: 11, color: C.tenue, align: 'center' });
        const hs = [-1, 1].map((s) => [c[0] + Math.cos(a * s) * 40, c[1] + Math.sin(a * s) * 40]);
        for (const h of hs) enlace(g, c, h, 1, C.texto2);
        atomo(g, c[0], c[1], 15, colC, 'C');
        for (const h of hs) atomo(g, h[0], h[1], 9, colH, 'H', C.linea);
        g.linea([[c[0] + 22, c[1] - 14], [c[0] + 28, c[1]], [c[0] + 22, c[1] + 14]], { color: C.acento, lw: 1.2, dash: [3, 3] });
        g.rotulo('flexión (tijera) CH₂  ≈ 1465 cm⁻¹', MX, 64, { size: 10.5 });
      } else {
        const sim = t < 19.8, k = sim ? 1 : suave(abs);
        const x = 5 * Math.sin(t * (sim ? 8 : 11)) * (sim ? 1 : 0.6 + 0.6 * k);
        // simétrica: los dos O se alejan a la vez y el C queda quieto; asimétrica: los O van en un sentido y el C, más ligero, en el contrario
        const c = [sim ? MX : MX - x * 0.8, MY];
        const o1 = [sim ? MX - 52 - x : MX - 52 + x * 0.4, MY], o2 = [sim ? MX + 52 + x : MX + 52 + x * 0.4, MY];
        enlace(g, o1, c, 2, C.texto2); enlace(g, c, o2, 2, C.texto2);
        atomo(g, c[0], c[1], 14, colC, 'C'); atomo(g, o1[0], o1[1], 16, colO, 'O'); atomo(g, o2[0], o2[1], 16, colO, 'O');
        g.rotulo(sim ? 'tensión simétrica: dipolo nulo → inactiva' : 'tensión asimétrica: 2349 cm⁻¹, activa', MX, 64, { size: 10.5, color: sim ? C.texto2 : C.ion });
        if (!sim) g.flecha(MX - 18, MY + 34, MX + 18 + x * 3, MY + 34, { color: C.acento, lw: 1.4, punta: 6 });
      }

      /* --- espectro de transmitancia --- */
      g.rect(S0, SY0 - 26, S1 - S0, SY1 - SY0 + 62, { fill: C.panel, stroke: C.linea, r: 6 });
      g.texto('Dónde absorbe cada vibración', S0 + 10, SY0 - 13, { size: 10.5, color: C.texto2, weight: 600 });
      const yT = (v) => SY0 + 12 + (1 - v) * (SY1 - SY0 - 30);
      g.rect(sx(1500), SY0 + 4, sx(400) - sx(1500), SY1 - SY0 - 18, { fill: C.rejilla, alpha: 0.7 });
      g.texto('huella dactilar', (sx(1500) + sx(400)) / 2, SY0 + 12, { size: 9, color: C.tenue, align: 'center' });
      g.texto('grupos funcionales', (sx(4000) + sx(1500)) / 2, SY0 + 12, { size: 9, color: C.tenue, align: 'center' });
      const pts = [];
      for (let i = 0; i <= 260; i++) {
        const s = 4000 - (3600 * i) / 260;
        let v = 0.97;
        for (const b of bandas) { const k = tramo(t, b.t, b.t + 0.8); if (k > 0) v -= b.d * k * Math.exp(-(((s - b.s) / b.w) ** 2)); }
        pts.push([sx(s), yT(v)]);
      }
      g.linea(pts, { color: C.acento, lw: 1.6 });
      g.linea([[S0 + 14, SY1 - 6], [S1 - 14, SY1 - 6]], { color: C.tenue, lw: 0.8 });
      for (const s of [4000, 3000, 2000, 1000]) g.texto(String(s), sx(s), SY1 + 6, { size: 9, color: C.tenue, align: 'center' });
      g.texto('número de onda (cm⁻¹)', (S0 + S1) / 2, SY1 + 20, { size: 9, color: C.tenue, align: 'center' });
      g.texto('%T', S0 + 6, SY0 + 26, { size: 9, color: C.tenue });
      for (const b of bandas) {
        if (!b.txt) continue;
        const k = tramo(t, b.t, b.t + 0.8); if (!k) continue;
        g.texto(b.txt, sx(b.s), yT(0.97 - b.d) + 12, { size: 9.5, color: C.ion, align: 'center', weight: 700, alpha: k });
      }
      if (p.equipo) g.texto(p.equipo, 626, 336, { size: 9.5, color: C.tenue, align: 'right' });
      g.leyenda([[C.metalOsc, 'C'], [C.mal, 'O'], [C.foton, 'infrarrojo', 'foton']], 22, 314, { size: 9.5 });
    },
  };
}
