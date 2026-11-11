// Interfaz de un ICP-MS: cono de muestreo y cono de separación (skimmer). Corte esquemático, no a escala.
// El gas del plasma entra por el orificio del cono de muestreo, se expande en un chorro supersónico en la región de interfaz
// (bombeada por la rotatoria), el skimmer toma su parte central dentro de la zona de silencio y, en la cámara de lentes, las
// lentes de extracción se llevan los cationes mientras el gas neutro se bombea. Todo es función de t y periódico en `dur`.
// La posición del disco de Mach se estima con x_M ≈ 0,67·D·√(p₀/p₁) (Ashkenas y Sherman): con D = 1 mm y p₁ de unos cientos
// de Pa resulta del orden de 1 cm, más lejos que el skimmer.
//
// Parámetros (p): orificioMuestreo ('1,0 mm') · orificioSkimmer ('0,45 mm') · pInterfaz ('unos cientos de Pa')
//                 pLentes ('≈ 10⁻² Pa') · pAnalizador ('≈ 10⁻⁴ Pa') · siguiente (destino del haz, p. ej. 'la lente Omega')
import { tramo, lerp, azar, clamp } from '../dibujo.js';
import { frac, flujo, rotuloGuia } from './_util-fuentes.js';

function rgba(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

export default function crear(p = {}) {
  const dur = 16;
  const o1 = p.orificioMuestreo || '≈ 1 mm';
  const o2 = p.orificioSkimmer;
  const pI = p.pInterfaz || 'unos cientos de Pa';
  const pL = p.pLentes || '≈ 10⁻² Pa';
  const pA = p.pAnalizador || '≈ 10⁻⁴ Pa';
  const sig = p.siguiente || 'la óptica iónica';
  const AY = 146;
  const XM = 140, XS = 212, XB = 316, XL = 410;      // punta del cono de muestreo, punta del skimmer, base del skimmer, lente
  const rIn = (x) => 6 + (XM - x) * 0.72;           // embudo de entrada al orificio
  const rOut = (x) => 6 + (x - XM) * 0.62;          // expansión libre tras el orificio
  const rSk = (x) => 3.5 + (x - XS) * 0.98;         // pared interior del skimmer

  const R = azar(41);
  const tipo = () => { const r = R(); return r < 0.66 ? 'ar' : r < 0.84 ? 'ion' : 'e'; };
  const lateral = Array.from({ length: 64 }, (_, i) => ({ k: 2 + (i % 2), f: i / 64 + R() * 0.02, l: (R() < 0.5 ? -1 : 1) * (0.12 + R() * 0.88), tp: tipo(), w: R() }));
  const central = Array.from({ length: 20 }, (_, i) => ({ k: 2 + (i % 2), f: i / 20 + R() * 0.03, l: (R() - 0.5) * 0.11, tp: ['ar', 'ion', 'ar', 'ion', 'e'][i % 5], w: R() }));
  // posición sobre el eje en función de la fase u: lenta antes del orificio, supersónica después
  const xDe = (u) => (u < 0.5 ? (u / 0.5) * XM : XM + ((u - 0.5) / 0.5) * 520);

  return {
    titulo: 'Interfaz: conos de muestreo y de separación',
    dur,
    fases: [
      { t: 0, texto: `El centro del plasma, a presión atmosférica y a miles de kelvin, llega al cono de muestreo. Por su orificio, de ${o1}, el gas pasa a la región de interfaz, que la bomba rotatoria mantiene a ${pI}.` },
      { t: 3.4, texto: 'La gran diferencia de presión acelera el gas por encima de la velocidad del sonido: se forma un chorro supersónico que se expande y se enfría muy deprisa. La composición de iones queda prácticamente «congelada» tal como salió del plasma.' },
      { t: 6.8, texto: `El cono de separación, más agudo y con un orificio ${o2 ? 'de ' + o2 : 'menor'}, se coloca dentro de la zona de silencio del chorro, antes del disco de Mach. Solo deja pasar la parte central del chorro; el resto del gas lo evacúa la bomba.` },
      { t: 10.2, texto: `En la cámara de lentes, a ${pL}, las lentes de extracción atraen los iones positivos y los aceleran hacia ${sig}. Los electrones, mucho más ligeros, se separan del haz, y el gas neutro lo evacúa la bomba turbomolecular.` },
      { t: 13.2, texto: `En pocos centímetros la presión baja de la atmosférica a ${pL}, en etapas separadas por orificios y bombeadas cada una por su bomba. Así los iones pueden llegar al analizador, a ${pA}, casi sin chocar con el gas.` },
    ],
    dibujar(g, t) {
      const C = g.C, ctx = g.ctx;

      /* ===== regiones de presión ===== */
      g.linea([[XM + 16, AY - 6], [234, AY - 112], [234, 4], [640, 4], [640, 268], [234, 268], [234, AY + 112], [XM + 16, AY + 6]], { fill: C.vacio, cerrar: true });
      g.rect(316, 4, 324, 264, { fill: C.vacio, r: 6 });
      // plasma a la izquierda
      const gr = ctx.createLinearGradient(0, 0, XM, 0);
      gr.addColorStop(0, rgba(C.calor, 0.35)); gr.addColorStop(0.7, rgba(C.foton, 0.3)); gr.addColorStop(1, rgba(C.foton, 0.05));
      ctx.save(); ctx.fillStyle = gr; ctx.beginPath(); ctx.ellipse(10, AY, 150, 118, 0, -Math.PI / 2, Math.PI / 2); ctx.fill(); ctx.restore();
      g.texto('Presión atmosférica', 8, 14, { size: 11, color: C.texto2, weight: 600 });
      g.texto('Plasma', 12, AY + 118, { size: 11, color: C.calor, weight: 600 });
      g.texto('Interfaz', 268, 14, { size: 11, color: C.texto2, weight: 600, align: 'center' });
      g.texto('Cámara de lentes', 470, 14, { size: 11, color: C.texto2, weight: 600, align: 'center' });
      g.texto(pL, 470, 28, { size: 9.5, color: C.tenue, align: 'center' });

      /* ===== chorro supersónico: zona de silencio y onda de choque en barril ===== */
      const aJ = 0.5 + 0.5 * tramo(t, 3.4, 3.9);
      const barril = (s) => [[XM + 8, AY + s * 6], [XM + 40, AY + s * 34], [XM + 80, AY + s * 50], [XM + 125, AY + s * 54], [XM + 150, AY + s * 50]];
      g.linea([...barril(-1), ...barril(1).reverse()], { fill: C.gas, alpha: 0.1 * aJ, cerrar: true });
      for (const s of [-1, 1]) g.curva(barril(s), { color: C.gas, lw: 1.3, dash: [4, 3], alpha: 0.8 * aJ });

      /* ===== flujos de bombeo ===== */
      flujo(g, [[262, AY + 60], [266, 232], [266, 292]], t, { color: C.tenue, n: 3, vel: 0.4, largo: 0.2, lw: 1.3 });
      flujo(g, [[500, AY + 40], [500, 232], [500, 292]], t + 0.3, { color: C.tenue, n: 3, vel: 0.4, largo: 0.2, lw: 1.3 });
      g.rect(244, 266, 44, 8, { fill: C.fondo }); g.rect(478, 266, 44, 8, { fill: C.fondo });
      g.texto('Bomba rotatoria', 266, 284, { size: 10.5, color: C.texto2, align: 'center', weight: 600 });
      g.texto('Bomba turbomolecular', 500, 284, { size: 10.5, color: C.texto2, align: 'center', weight: 600 });

      /* ===== partículas ===== */
      const dibuja = (q, x, y, a) => {
        if (q.tp === 'ar') g.circulo(x, y, 2.4, { fill: C.gas, alpha: a });
        else if (q.tp === 'ion') g.ion(x, y, { r: 4.6, alpha: a });
        else g.electron(x, y, { r: 1.9, alpha: a });
      };
      for (const q of lateral) {
        const u = frac((t * q.k) / dur + q.f);
        const x = xDe(u);
        if (x < XM) { dibuja(q, x, AY + q.l * rIn(x), Math.min(1, u * 12)); continue; }
        // fuera del eje: se expanden y los evacúa la bomba rotatoria antes de llegar al skimmer
        const xe = Math.min(x, XM + 70 + q.w * 80);
        const desv = Math.max(0, x - xe);
        const y = AY + q.l * rOut(xe) + Math.sign(q.l || 1) * 0 + (desv > 0 ? desv * 0.5 : 0);
        const xx = xe + desv * 0.3;
        const a = 1 - clamp(desv / 70);
        if (a > 0.02 && xx < XB - 10) dibuja(q, xx, y, a);
      }
      for (const q of central) {
        const u = frac((t * q.k) / dur + q.f);
        const x = xDe(u);
        let y, a = Math.min(1, u * 12);
        if (x < XM) y = AY + q.l * rIn(x) * 6;
        else if (x < XB) y = AY + clamp(q.l * rOut(x), -rSk(Math.max(x, XS)) + 2, rSk(Math.max(x, XS)) - 2);
        else {
          const y0 = AY + clamp(q.l * rOut(XB), -rSk(XB) + 2, rSk(XB) - 2);
          const d = x - XB;
          if (q.tp === 'ion') y = AY + (y0 - AY) * Math.exp(-d / 50);
          else if (q.tp === 'e') { y = y0 + (q.w < 0.5 ? -1 : 1) * d * 0.9; a *= 1 - clamp(d / 110); }
          else { y = y0 + (y0 - AY) * d * 0.03 + (q.w - 0.5) * d * 0.5; a *= 1 - clamp((x - 440) / 80); }
        }
        if (x > 636 || a <= 0.02) continue;
        dibuja(q, x, y, a);
      }

      /* ===== conos y lentes ===== */
      for (const s of [-1, 1]) {
        g.linea([[XM, AY + s * 6], [214, AY + s * 112], [234, AY + s * 112], [XM + 16, AY + s * 6]], { fill: C.metal, color: C.metalOsc, lw: 0.8, cerrar: true });
        g.linea([[XS, AY + s * 3.5], [300, AY + s * 90], [312, AY + s * 90], [XS + 11, AY + s * 3.5]], { fill: C.metal, color: C.metalOsc, lw: 0.8, cerrar: true });
      }
      g.rect(214, 4, 22, AY - 112 - 4 + 1, { fill: C.metalOsc }); g.rect(214, AY + 112, 22, 268 - AY - 112, { fill: C.metalOsc });
      g.rect(300, 4, 16, AY - 90 - 4 + 1, { fill: C.metalOsc }); g.rect(300, AY + 90, 16, 268 - AY - 90, { fill: C.metalOsc });
      const aL = 0.75 + 0.25 * tramo(t, 10.2, 10.7);
      g.electrodo(XL, 40, 8, AY - 14 - 40, { color: t > 10.2 ? C.acento : C.metal, alpha: aL });
      g.electrodo(XL, AY + 14, 8, 236 - AY - 14, { color: t > 10.2 ? C.acento : C.metal, alpha: aL });
      g.electrodo(XL + 30, 52, 8, AY - 12 - 52, {}); g.electrodo(XL + 30, AY + 12, 8, 226 - AY - 12, {});
      g.flecha(560, AY, 632, AY, { color: C.tenue, lw: 1.3 });
      g.texto(`Hacia ${sig}`, 632, AY - 14, { size: 10.5, color: C.tenue, align: 'right' });

      /* ===== rótulos ===== */
      rotuloGuia(g, 'Cono de muestreo', 96, 236, 176, AY + 56, { size: 11 });
      rotuloGuia(g, 'Cono de separación (skimmer)', 360, 250, 262, AY + 52, { size: 11 });
      rotuloGuia(g, 'Lentes de extracción', 520, 60, XL + 6, 64, { size: 11 });
      g.texto(`Ø ${o1.replace('≈ ', '')}`, XM - 4, AY - 16, { size: 9.5, color: C.texto2, align: 'right', weight: 600 });
      if (o2) g.texto(`Ø ${o2}`, XS + 2, AY + 20, { size: 9.5, color: C.texto2, weight: 600 });
      const aS = tramo(t, 3.5, 4) * (1 - tramo(t, 9.9, 10.3));
      if (aS > 0) rotuloGuia(g, 'Chorro supersónico (zona de silencio)', 116, 58, XM + 46, AY - 22, { size: 11, alpha: aS });
      const aC = tramo(t, 7, 7.5) * (1 - tramo(t, 9.9, 10.3));
      if (aC > 0) rotuloGuia(g, 'Solo pasa el centro del chorro', 420, AY - 52, XS + 4, AY - 6, { size: 11, color: C.ok, alpha: aC });
      const aE = tramo(t, 10.4, 10.9) * (1 - tramo(t, 13, 13.4));
      if (aE > 0) g.rotulo('Iones M⁺ hacia las lentes', 540, AY + 34, { size: 11, color: C.ion, alpha: aE });

      /* ===== perfil de presión (escala logarítmica) ===== */
      const aP = 0.55 + 0.45 * tramo(t, 13.2, 13.7);
      const nivel = (u) => (u < XM / 640 + 0.02 ? 1 : u < XB / 640 ? 0.72 : u < 0.86 ? 0.22 : 0.02);
      g.grafico(14, 294, 372, 62, nivel, { color: C.acento, titulo: 'Presión (escala log.)', n: 320, alpha: aP, marcas: [[0.1, '10⁵ Pa'], [0.38, '~10² Pa'], [0.66, pL.replace('≈ ', '~')], [0.95, 'analizador']] });

      g.leyenda([[C.gas, 'argón'], [C.ion, 'ion M⁺'], [C.e, 'electrón', 'e']], 404, 336, { size: 9.5 });
    },
  };
}
