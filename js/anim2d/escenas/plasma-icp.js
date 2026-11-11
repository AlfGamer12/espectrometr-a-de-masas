// Antorcha ICP: tubos concéntricos de cuarzo, bobina de carga de RF, plasma de argón y transformación del aerosol en el canal
// central (desolvatación → vaporización → atomización → ionización, M → M⁺ + e⁻). Corte esquemático, no a escala.
// Todo se dibuja como función de t; la corriente de partículas de fondo es periódica en `dur`.
//
// Parámetros (p): frecuencia ('27 MHz') · temperatura ('6000–10 000 K') · gasPlasma (caudal para el texto, p. ej. '≈ 15 L/min')
//                 shieldtorch (true: muestra y explica la placa ShieldTorch de platino conectada a tierra) · cono (rótulo del cono)
import { tramo, suave, lerp, azar } from '../dibujo.js';
import { frac, flujo, rotuloGuia } from './_util-fuentes.js';

/** Color hexadecimal (#rrggbb) con opacidad, para degradados que se desvanecen sin oscurecerse. */
function rgba(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

export default function crear(p = {}) {
  const dur = 18;
  const frec = p.frecuencia || '27 MHz';
  const temp = p.temperatura || '6000–10 000 K';
  const AY = 178;                                     // eje de la antorcha
  const XT = 372;                                     // boca de la antorcha
  const XI = 236;                                     // punta del inyector
  const COIL = [284, 308, 332];
  const ZONAS = [[250, 320, 'Desolvatación'], [320, 390, 'Vaporización'], [390, 460, 'Atomización'], [460, 540, 'Ionización']];
  const R = azar(23);
  const fondo = Array.from({ length: 16 }, (_, i) => ({ k: 3 + (i % 3), f: i / 16 + R() * 0.03, l: (R() - 0.5) * 8, s: 30 + i }));

  // posición de la partícula protagonista sobre el eje
  const xProt = (t) => {
    if (t < 5.4) return -20;
    if (t < 7) return lerp(110, XI, tramo(t, 5.4, 7));
    if (t < 10.5) return lerp(XI, 390, tramo(t, 7, 10.5));
    if (t < 14) return lerp(390, 538, tramo(t, 10.5, 14));
    return lerp(538, 600, suave(tramo(t, 14.2, 17.4)));
  };

  const textos = [
    { t: 0, texto: `La antorcha tiene tres tubos concéntricos de cuarzo. Por el exterior circula el gas de plasma${p.gasPlasma ? ` (${p.gasPlasma})` : ''}, por el intermedio el gas auxiliar y por el inyector central entra el aerosol, arrastrado por el argón del nebulizador.` },
    { t: 3.5, texto: `La bobina de carga conduce una corriente de radiofrecuencia de ${frec}. Su campo magnético oscilante induce corrientes circulares en el argón ionizado, que lo calientan y mantienen un plasma a ${temp}.` },
    { t: 7, texto: 'El plasma tiene forma de anillo y el aerosol atraviesa su canal central, algo más frío. En pocos milisegundos cada gota pierde el disolvente (desolvatación) y la partícula sólida que queda se vaporiza.' },
    { t: 10.5, texto: 'Las moléculas se disocian en átomos (atomización) y los átomos pierden un electrón (ionización): M → M⁺ + e⁻. El potencial de ionización del argón, 15,76 eV, supera el primero de casi todos los elementos, que se ionizan en gran proporción.' },
    {
      t: 14.2, texto: p.shieldtorch
        ? 'La placa ShieldTorch, de platino y conectada a tierra, separa la bobina de la antorcha y elimina el acoplamiento capacitivo con el plasma. Así se evita la descarga secundaria en la interfaz y se estrecha la distribución de energía de los iones.'
        : 'Los iones M⁺ llegan al cono de muestreo junto con mucho argón, electrones e iones poliatómicos formados con el plasma y la matriz (ArO⁺, ArCl⁺…). El cono toma el centro del plasma hacia la interfaz de vacío.',
    },
  ];

  return {
    titulo: 'Antorcha y plasma ICP',
    dur,
    fases: textos,
    dibujar(g, t) {
      const C = g.C, ctx = g.ctx;
      const vid = { color: C.tenue, lw: 1.4 };
      const rf = Math.sin(t * Math.PI);              // la RF real oscila a 27 MHz; aquí, a cámara lentísima (0,5 Hz)
      const sg = rf >= 0 ? 1 : -1;

      /* ===== plasma ===== */
      const flick = 1 + 0.025 * Math.sin(t * 13) + 0.015 * Math.sin(t * 7.3);
      ctx.save();
      ctx.beginPath(); ctx.rect(250, AY - 61, XT - 250, 122); ctx.rect(XT, AY - 90, 200, 180); ctx.clip();
      const glow = (cx, cy, rx, ry, col, a0) => {
        ctx.save(); ctx.translate(cx, cy); ctx.scale(1, ry / rx);
        const gr = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
        gr.addColorStop(0, rgba(col, a0)); gr.addColorStop(0.55, rgba(col, a0 * 0.55)); gr.addColorStop(1, rgba(col, 0));
        ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(0, 0, rx, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      };
      glow(392, AY, 168 * flick, 66, C.calor, 0.42);
      glow(330, AY - 30, 74 * flick, 26, C.foton, 0.75);
      glow(330, AY + 30, 74 * flick, 26, C.foton, 0.75);
      glow(470, AY, 90 * flick, 34, C.foton, 0.35);
      ctx.restore();
      // canal central, algo más frío
      g.linea([[XI + 6, AY - 5], [XT, AY - 9], [540, AY - 7], [540, AY + 7], [XT, AY + 9], [XI + 6, AY + 5]], { fill: C.fondo, alpha: 0.38, cerrar: true });

      /* ===== antorcha de cuarzo ===== */
      g.linea([[40, AY - 62], [XT, AY - 62]], vid); g.linea([[40, AY + 62], [XT, AY + 62]], vid);
      g.linea([[40, AY - 44], [262, AY - 44]], vid); g.linea([[40, AY + 44], [262, AY + 44]], vid);
      g.linea([[0, AY - 7], [XI - 14, AY - 7], [XI, AY - 3.5]], vid); g.linea([[0, AY + 7], [XI - 14, AY + 7], [XI, AY + 3.5]], vid);
      g.linea([[40, AY - 62], [40, AY - 7]], vid); g.linea([[40, AY + 7], [40, AY + 62]], vid);
      // entradas de gas
      g.rect(64, AY - 92, 12, 30, { fill: C.panel, stroke: C.tenue, lw: 1.2 });
      g.rect(116, AY + 62, 12, 30, { fill: C.panel, stroke: C.tenue, lw: 1.2 });
      g.linea([[116.5, AY + 44], [116.5, AY + 62]], vid); g.linea([[127.5, AY + 44], [127.5, AY + 62]], vid);
      // flujos: gas de plasma (tangencial, en espiral), auxiliar y aerosol
      flujo(g, [[70, AY - 90], [70, AY - 54], [100, AY - 52], [XT - 20, AY - 53]], t, { color: C.gas, n: 5, vel: 0.35, largo: 0.06 });
      flujo(g, [[70, AY - 90], [70, AY + 54], [100, AY + 52], [XT - 20, AY + 53]], t + 0.5, { color: C.gas, n: 5, vel: 0.3, largo: 0.05, alpha: 0.45 });
      flujo(g, [[122, AY + 90], [122, AY + 30], [150, AY + 28], [250, AY + 26]], t, { color: C.gas, n: 3, vel: 0.4, largo: 0.1 });
      flujo(g, [[190, AY - 26], [252, AY - 26]], t + 0.2, { color: C.gas, n: 2, vel: 0.4, largo: 0.25 });
      g.rotulo('Gas de plasma (Ar)', 70, AY - 104, { size: 11 });
      g.rotulo('Gas auxiliar (Ar)', 122, AY + 104, { size: 11 });
      g.rotulo('Aerosol + Ar portador', 120, AY - 22, { size: 11 });

      /* ===== bobina de carga ===== */
      for (const x of COIL) {
        for (const y of [AY - 76, AY + 76]) {
          g.circulo(x, y, 7.5, { fill: C.metal, stroke: C.metalOsc, lw: 1 });
          const sale = (y < AY ? 1 : -1) * sg > 0;    // ⊙ sale del plano, ⊗ entra
          if (sale) g.circulo(x, y, 2, { fill: C.texto }); else g.texto('×', x, y + 0.5, { size: 11, color: C.texto, align: 'center', weight: 700 });
        }
      }
      g.rotulo(`Bobina de carga · ${frec}`, 308, AY - 100, { size: 11 });
      // campo magnético y corrientes inducidas (fase 2)
      const aB = tramo(t, 3.6, 4.1) * (1 - tramo(t, 6.8, 7.2));
      if (aB > 0) {
        for (const dy of [-18, 18]) {
          const [x1, x2] = sg > 0 ? [272, 346] : [346, 272];
          g.flecha(x1, AY + dy, x2, AY + dy, { color: C.acento, lw: 1.3, punta: 6, alpha: aB });
        }
        g.texto('B', 350, AY - 26, { size: 11, color: C.acento, weight: 700, alpha: aB });
        for (const [y, s2] of [[AY - 34, -sg], [AY + 34, sg]]) {
          g.circulo(308, y, 6, { stroke: C.calor, lw: 1.3, alpha: aB, fill: C.panel });
          if (s2 > 0) g.circulo(308, y, 1.8, { fill: C.calor, alpha: aB }); else g.texto('×', 308, y + 0.5, { size: 10, color: C.calor, align: 'center', weight: 700, alpha: aB });
        }
        g.rotulo('Corriente inducida en el plasma', 470, AY + 48, { size: 11, color: C.calor, alpha: aB });
      }

      /* ===== ShieldTorch ===== */
      if (p.shieldtorch) {
        const aS = 0.75 + 0.25 * tramo(t, 14.2, 14.7);
        const brillo = tramo(t, 14.2, 14.7) * (1 - tramo(t, 17.4, 17.9));
        for (const y of [AY - 67, AY + 64]) {
          if (brillo > 0) g.rect(266, y - 2, 84, 7, { fill: C.acento, alpha: 0.25 * brillo, r: 2 });
          g.rect(268, y, 80, 3, { fill: C.metalOsc, alpha: aS });
        }
        // conexión a tierra
        g.linea([[348, AY + 65.5], [362, AY + 65.5], [362, AY + 84]], { color: C.metalOsc, lw: 1.2 });
        g.linea([[355, AY + 84], [369, AY + 84]], { color: C.metalOsc, lw: 1.4 });
        g.linea([[358, AY + 88], [366, AY + 88]], { color: C.metalOsc, lw: 1.2 });
        rotuloGuia(g, 'ShieldTorch (Pt, a tierra)', 186, AY - 80, 270, AY - 66, { size: 11, color: brillo > 0.5 ? C.acento : C.texto2 });
      }

      /* ===== cono de muestreo ===== */
      g.linea([[562, AY - 5], [616, AY - 96], [632, AY - 96], [574, AY - 5]], { fill: C.metal, color: C.metalOsc, lw: 0.8, cerrar: true });
      g.linea([[562, AY + 5], [616, AY + 96], [632, AY + 96], [574, AY + 5]], { fill: C.metal, color: C.metalOsc, lw: 0.8, cerrar: true });
      g.rotulo(p.cono || 'Cono de muestreo', 588, AY + 122, { size: 11 });
      g.rotulo(temp, 476, AY - 96, { size: 11, color: C.calor });

      /* ===== zonas del canal central ===== */
      const aZ = tramo(t, 7, 7.5) * (1 - tramo(t, 17.4, 17.9));
      ZONAS.forEach(([x1, x2, nom], i) => {
        const col = [C.liquido, C.neutro, C.neutro, C.ion][i];
        g.linea([[x1 + 2, AY + 112], [x2 - 2, AY + 112]], { color: col, lw: 4, alpha: 0.8 * aZ });
        g.rotulo(nom, (x1 + x2) / 2, AY + (i % 2 ? 148 : 128), { size: 11, alpha: aZ });
      });

      /* ===== partículas del canal central ===== */
      for (const q of fondo) {
        const u = frac((t * q.k) / dur + q.f);
        const x = lerp(-10, 590, u);
        if (x > 568) continue;
        estado(g, x, AY + q.l * (x > XI ? 0.7 : 0.35), 0.62, 0.45, q.s, (u * 37 + q.s) % 1);
      }
      const xp = xProt(t);
      if (xp > 0 && t < 17.4) {
        const aP = 1 - tramo(t, 16.9, 17.4);
        g.circulo(xp, AY, 15, { stroke: C.texto2, lw: 1, alpha: 0.5 * aP * (xp < 560 ? 1 : 0) });
        estado(g, xp, AY, 1.3, aP, 3, 0.3, true);
      }
      const aIon = tramo(t, 12, 12.4) * (1 - tramo(t, 14.2, 14.6));
      if (aIon > 0) g.rotulo('M⁺ + e⁻', xp - 4, AY - 30, { size: 11, color: C.ion, alpha: aIon });

      g.leyenda([[C.liquido, 'gota'], [C.neutro, 'sólido, moléculas y átomos'], [C.ion, 'ion M⁺'], [C.e, 'electrón', 'e']], 18, 350, { size: 9.5 });

      /** Dibuja la muestra según dónde esté en el canal: gota, partícula seca, moléculas, átomos o ion + electrón. */
      function estado(g, x, y, k, alpha, sem, fase, prota = false) {
        if (x < 250) { g.gota(x, y, 5 * k, { alpha }); return; }
        if (x < 320) {
          const u = (x - 250) / 70;
          g.gota(x, y, lerp(5, 1.2, u) * k, { alpha: alpha * (1 - u * 0.6) });
          if (u > 0.4) g.rect(x - 2.2 * k, y - 2.2 * k, 4.4 * k, 4.4 * k, { fill: C.neutro, alpha: alpha * tramo(u, 0.4, 0.8) });
          if (prota) for (let i = 0; i < 3; i++) { const a = i * 2.1 + x * 0.05; g.circulo(x + Math.cos(a) * (8 + u * 10), y + Math.sin(a) * (8 + u * 10), 1.6, { fill: C.liquido, alpha: alpha * (1 - u) }); }
          return;
        }
        if (x < 390) {
          const u = (x - 320) / 70;
          if (u < 0.45) { for (let i = 0; i < 4; i++) g.rect(x - 4 * k + (i % 2) * 4 * k, y - 4 * k + Math.floor(i / 2) * 4 * k, 3.6 * k, 3.6 * k, { fill: C.neutro, alpha }); return; }
          const sep = (u - 0.45) * 14 * k;
          g.molecula(x - sep, y - sep * 0.5, { r: 2.6 * k, n: 2, rot: x * 0.05, semilla: sem, alpha });
          g.molecula(x + sep, y + sep * 0.5, { r: 2.6 * k, n: 2, rot: -x * 0.05, semilla: sem + 1, alpha });
          return;
        }
        if (x < 460) {
          const u = (x - 390) / 70;
          g.circulo(x - u * 5 * k, y, 4 * k, { fill: C.neutro, alpha });
          g.circulo(x + 6 * k + u * 8 * k, y + 2 * k + u * 6 * k, 2.8 * k, { fill: C.neutro, alpha: alpha * (1 - u * 0.6) });
          return;
        }
        const u = Math.min(1, (x - 460) / 30);
        g.ion(x, y, { r: (prota ? 6 : 4.2), alpha, signo: prota });
        const ea = fase * Math.PI * 2;
        g.electron(x + Math.cos(ea - 1) * (4 + u * 22) * k, y - Math.abs(Math.sin(ea)) * (4 + u * 18) * k - 2, { alpha: alpha * (1 - Math.max(0, u - 0.8) * 4) });
      }
    },
  };
}
