// Reflexión total atenuada (ATR) con un prisma de diamante de una reflexión: entrada del haz, ángulo crítico, onda evanescente en la
// muestra, profundidad de penetración dp ∝ λ (bandas más intensas a número de onda bajo) y contacto con la abrazadera.
// Los valores numéricos se calculan con n(diamante), el ángulo y n(muestra) de los parámetros. Escena sin estado.
// Parámetros opcionales: p.n1 (2.4), p.n2 (1.5), p.angulo (45), p.prisma ('diamante'), p.accesorio ('QATR-S').
import { tramo, suave, lerp } from '../dibujo.js';

export default function crear(p = {}) {
  const n1 = p.n1 || 2.4, n2 = p.n2 || 1.5, th = ((p.angulo || 45) * Math.PI) / 180;
  const prisma = p.prisma || 'diamante', acc = p.accesorio ? ` del ${p.accesorio}` : '';
  const thc = (Math.asin(n2 / n1) * 180) / Math.PI;
  const dp = (s) => (1e4 / s) / (2 * Math.PI * n1 * Math.sqrt(Math.sin(th) ** 2 - (n2 / n1) ** 2));
  const f1 = (v, d = 1) => v.toFixed(d).replace('.', ',');
  // geometría del corte: trapecio invertido (cara superior ancha), caras laterales a 45°
  const YT = 150, YB = 228, XL = 112, XR = 328, XC = (XL + XR) / 2, H = YB - YT;
  const ent = [XC - 55, YT + 55], sal = [XC + 55, YT + 55];
  const ini = [ent[0] - 66, ent[1] + 66], fin = [sal[0] + 66, sal[1] + 66];
  const DP_PX = 15;                                       // px por cada dp en el dibujo (escala exagerada)

  return {
    titulo: 'Reflexión total atenuada (ATR)',
    dur: 23,
    fases: [
      { t: 0, texto: `El haz infrarrojo entra en el prisma de ${prisma} (n ≈ ${f1(n1)}) perpendicular a una cara inclinada y llega a la cara superior, en contacto con la muestra, con un ángulo de incidencia de ${Math.round((th * 180) / Math.PI)}°.` },
      { t: 4.2, texto: `Al pasar a un medio de índice menor existe un ángulo crítico, θc = arcsen(n₂/n₁). Para una muestra orgánica (n₂ ≈ ${f1(n2)}) vale unos ${Math.round(thc)}°: como ${Math.round((th * 180) / Math.PI)}° es mayor, toda la luz se refleja dentro del prisma.` },
      { t: 8.6, texto: 'Aun así, el campo eléctrico atraviesa la superficie y decae exponencialmente dentro de la muestra: es la onda evanescente. Donde la muestra absorbe, se lleva energía y el haz reflejado sale debilitado.' },
      { t: 13.2, texto: `La profundidad de penetración es dp = λ / (2π n₁ √(sen²θ − (n₂/n₁)²)): unas ${f1(dp(3000))} µm a 3000 cm⁻¹ y ${f1(dp(1000))} µm a 1000 cm⁻¹. Por eso, frente a la transmisión, las bandas de número de onda bajo salen más intensas.` },
      { t: 18, texto: `Como la luz solo explora las primeras micras, la muestra debe estar en contacto íntimo con el prisma. Un líquido basta con una gota; un sólido se aprieta con la abrazadera${acc} para eliminar las capas de aire.` },
    ],
    dibujar(g, t) {
      const C = g.C;
      const solido = t >= 18;
      const kPres = solido ? suave(tramo(t, 19, 21)) : 0;
      /* --- muestra --- */
      if (!solido) {
        g.rect(XL - 18, YT - 34, XR - XL + 36, 34, { fill: C.liquido, alpha: 0.35, r: 4 });
        g.rotulo(t < 8.6 ? `Muestra (n₂ ≈ ${f1(n2)})` : 'Muestra', XL + 40, YT - 46, { size: 9.5 });
      } else {
        // sólido rugoso: sin presión deja huecos de aire; la abrazadera lo aplasta contra el prisma
        const yb = lerp(YT - 9, YT, kPres), pts = [[XL - 10, YT - 40 + 9 * kPres]];
        for (let x = XL - 10; x <= XR + 10; x += 6) pts.push([x, yb + (1 - kPres) * 6 * Math.sin(x * 0.45) * Math.sin(x * 0.13)]);
        pts.push([XR + 10, YT - 40 + 9 * kPres]);
        g.linea(pts, { fill: C.neutro, alpha: 0.55, cerrar: true });
        g.rect(XC - 26, YT - 74 + 9 * kPres, 52, 32, { fill: C.metal, stroke: C.metalOsc, r: 3 });
        g.rect(XC - 5, YT - 112 + 9 * kPres, 10, 38, { fill: C.metalOsc });
        g.flecha(XC + 42, YT - 100, XC + 42, YT - 72 + 9 * kPres, { color: C.acento, lw: 1.6, alpha: 1 - kPres * 0.5 });
        g.rotulo(kPres < 0.5 ? 'Sólido: huecos de aire' : 'Contacto íntimo', XL + 34, YT - 58, { size: 9.5, color: kPres < 0.5 ? C.mal : C.ok });
        g.rotulo('Abrazadera', XC + 84, YT - 104, { size: 9.5 });
      }
      /* --- prisma --- */
      g.linea([[XL, YT], [XR, YT], [XR - H, YB], [XL + H, YB]], { fill: C.vacio, color: C.acento, lw: 1.6, cerrar: true, alpha: 0.95 });
      g.rotulo(`Prisma de ${prisma} (n₁ ≈ ${f1(n1)})`, XC, YB + 18, { size: 10 });
      /* --- haz --- */
      const k0 = tramo(t, 0.2, 2.4), k1 = tramo(t, 2.4, 3.6);
      const debil = t >= 8.6 ? 1 - 0.45 * tramo(t, 10, 11.5) * (solido ? kPres : 1) : 1;
      const P = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];
      g.foton(ini[0], ini[1], ...P(ini, [XC, YT], 1), { k: Math.min(1, k0 * 1.0), amp: 3.5, long: 12, lw: 1.8 });
      if (k1 > 0) g.foton(XC, YT, ...P([XC, YT], fin, 1), { k: k1, amp: 3.5 * debil, long: 12, lw: 1.8, alpha: 0.5 + 0.5 * debil });
      // normal y ángulos
      if (t >= 2 && t < 13.2) {
        const kA = tramo(t, 2, 3);
        g.linea([[XC, YT - 30], [XC, YT + 62]], { color: C.tenue, lw: 1, dash: [3, 3], alpha: kA });
        g.ctx.save(); g.ctx.globalAlpha = kA; g.ctx.strokeStyle = C.foton; g.ctx.lineWidth = 1.4;
        g.ctx.beginPath(); g.ctx.arc(XC, YT, 34, Math.PI / 2, Math.PI / 2 + th); g.ctx.stroke(); g.ctx.restore();
        g.texto(`${Math.round((th * 180) / Math.PI)}°`, XC - 22, YT + 44, { size: 11, color: C.foton, weight: 700, alpha: kA });
        if (t >= 4.2) {
          const kc = tramo(t, 4.2, 5), a = (thc * Math.PI) / 180;
          g.linea([[XC, YT], [XC - Math.sin(a) * 74, YT + Math.cos(a) * 74]], { color: C.mal, lw: 1.2, dash: [4, 3], alpha: kc });
          g.texto(`θc ≈ ${Math.round(thc)}°`, XC - Math.sin(a) * 74 + 10, YT + Math.cos(a) * 74 + 10, { size: 10.5, color: C.mal, weight: 700, alpha: kc });
        }
      }
      /* --- onda evanescente --- */
      if (t >= 8.6) {
        const kE = tramo(t, 8.6, 9.6) * (solido ? 0.25 + 0.75 * kPres : 1);
        const largo = t >= 13.2 ? (Math.sin(t * 0.9) > 0 ? dp(1000) : dp(3000)) : dp(1700);
        const alto = largo * DP_PX;
        for (let i = 0; i < 14; i++) {
          const z = (i / 14) * alto * 2.6;
          if (z + alto * 0.2 > 32) break;                    // sin salir de la capa de muestra
          g.rect(XC - 70, YT - z - alto * 0.2, 140, alto * 0.19, { fill: C.foton, alpha: 0.95 * kE * Math.exp(-(2 * z) / alto), r: 2 });
        }
        if (!solido) g.linea([[XC - 70, YT - alto], [XC + 70, YT - alto]], { color: C.foton, lw: 1, dash: [3, 3], alpha: kE });
        if (!solido) g.texto('dp', XC + 76, YT - alto + 3, { size: 10, color: C.foton, weight: 700, alpha: kE });
        if (t >= 13.2 && !solido) g.texto(Math.sin(t * 0.9) > 0 ? '1000 cm⁻¹' : '3000 cm⁻¹', XC - 76, YT - alto + 3, { size: 9.5, color: C.texto2, align: 'right', alpha: kE });
      }
      /* --- panel derecho --- */
      const G0 = 400, G1 = 628;
      g.rect(G0, 24, G1 - G0, 300, { fill: C.panel, stroke: C.linea, r: 6 });
      if (t < 13.2) {
        g.texto('Intensidad en la muestra', G0 + 10, 40, { size: 10, color: C.texto2, weight: 600 });
        const zmax = 4, xz = (z) => lerp(G0 + 20, G1 - 14, z / zmax), yI = (v) => lerp(280, 70, v);
        g.linea([[G0 + 20, 280], [G1 - 14, 280]], { color: C.tenue, lw: 0.8 }); g.linea([[G0 + 20, 280], [G0 + 20, 64]], { color: C.tenue, lw: 0.8 });
        g.texto('distancia a la superficie z (µm)', G1 - 14, 308, { size: 9, color: C.tenue, align: 'right' });
        for (let z = 0; z <= zmax; z++) g.texto(String(z), xz(z), 290, { size: 8.5, color: C.tenue, align: 'center' });
        const kE = tramo(t, 8.6, 10);
        if (kE > 0) {
          const d = dp(1700), q = [];
          for (let z = 0; z <= zmax * kE; z += 0.02) q.push([xz(z), yI(Math.exp((-2 * z) / d))]);
          g.linea(q, { color: C.foton, lw: 1.8 });
          g.texto(`1700 cm⁻¹: dp ≈ ${f1(d)} µm`, G0 + 32, 84, { size: 10, color: C.foton, weight: 600 });
          g.texto('I ∝ exp(−2z/dp)', G0 + 32, 102, { size: 10, color: C.texto2, italic: true });
        } else {
          g.texto(t < 4.2 ? 'Reflexión dentro del prisma' : 'θ > θc: reflexión total', (G0 + G1) / 2, 170, { size: 11, color: C.texto2, align: 'center', weight: 600 });
          g.texto(`n₁ = ${f1(n1)}  ·  n₂ = ${f1(n2)}`, (G0 + G1) / 2, 192, { size: 10.5, color: C.tenue, align: 'center' });
        }
      } else {
        g.texto('Penetración y espectro', G0 + 10, 40, { size: 10, color: C.texto2, weight: 600 });
        // dp frente al número de onda
        const xs = (s) => lerp(G0 + 22, G1 - 14, (4000 - s) / 3600), dmx = dp(400) * 1.05, y1 = (v) => lerp(150, 60, v / dmx);
        const q = []; for (let s = 4000; s >= 400; s -= 20) q.push([xs(s), y1(dp(s))]);
        g.linea(q, { color: C.foton, lw: 1.8 });
        g.texto('dp (µm)', G0 + 24, 58, { size: 9, color: C.tenue });
        for (const s of [3000, 1000]) { g.circulo(xs(s), y1(dp(s)), 2.6, { fill: C.foton }); g.texto(`${f1(dp(s))} µm`, xs(s) - 4, y1(dp(s)) - 8, { size: 9, color: C.texto2, align: 'right' }); }
        g.linea([[G0 + 22, 152], [G1 - 14, 152]], { color: C.tenue, lw: 0.8 });
        // misma muestra: transmisión frente a ATR
        const yA = (v) => lerp(300, 178, v);
        const B = [[2950, 30, 0.55], [1715, 18, 0.9], [1360, 16, 0.6], [1220, 18, 0.55], [530, 14, 0.4]];
        const tr = (s) => B.reduce((a, [c, w, h]) => a + h * Math.exp(-(((s - c) / w) ** 2)), 0);
        const mx = Math.max(...B.map(([c]) => tr(c) * dp(c)));
        const pt = [], pa = [];
        for (let s = 4000; s >= 400; s -= 4) { pt.push([xs(s), yA(tr(s) * 0.9)]); pa.push([xs(s), yA((tr(s) * dp(s) / mx) * 0.9)]); }
        const k3 = tramo(t, 14.2, 15.4);
        g.linea(pt, { color: C.tenue, lw: 1.2, dash: [4, 3], alpha: k3 });
        g.linea(pa, { color: C.ion, lw: 1.6, alpha: k3 });
        g.linea([[G0 + 22, 302], [G1 - 14, 302]], { color: C.tenue, lw: 0.8 });
        for (const s of [4000, 2000, 1000]) g.texto(String(s), xs(s), 314, { size: 8.5, color: C.tenue, align: 'center' });
        g.texto('- - transmisión', G1 - 14, 176, { size: 9, color: C.tenue, align: 'right', alpha: k3 });
        g.texto('ATR', G1 - 14, 190, { size: 9, color: C.ion, align: 'right', weight: 700, alpha: k3 });
      }
      g.leyenda([[C.foton, 'infrarrojo', 'foton'], [C.liquido, 'muestra']], 20, 344, { size: 9.5 });
    },
  };
}
