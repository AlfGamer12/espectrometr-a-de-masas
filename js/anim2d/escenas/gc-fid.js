// Detector de ionización de llama (FID) en corte: hidrógeno y gas auxiliar salen por el chorro junto con el efluente de la
// columna y arden en aire; los carbonos de cada molécula orgánica forman radicales CH que reaccionan con oxígeno
// (CH + O → CHO⁺ + e⁻); el colector, polarizado respecto al chorro, recoge los iones y el electrómetro mide la corriente.
// Se comparan un n-alcano corto, uno largo y especies sin enlaces C–H. Escena sin estado (función de t).
// Parámetros: p.h2, p.aire, p.aux (textos de caudal), p.auxGas ('N₂').
import { tramo, suave, lerp, azar, clamp, easeOut } from '../dibujo.js';

const JX = 216;               // eje del chorro
const TIP = 236;              // punta del chorro
const CY0 = 92, CY1 = 182;    // colector
const T_ON = 2.4;             // encendido de la llama
const MOL = [                 // llegadas: [instante, n.º de carbonos, etiqueta]
  [7.4, 8, 'n-octano (8 C)'], [12.6, 16, 'n-hexadecano (16 C)'],
];
const T_AGUA = 17.6;

export default function crear(p = {}) {
  const h2 = p.h2 || '30 mL/min', aire = p.aire || '400 mL/min', aux = p.aux || '25 mL/min', auxGas = p.auxGas || 'N₂';
  const R = azar(21);
  const iones = MOL.map(([t0, n]) => Array.from({ length: n * 3 }, (_, i) => ({ ts: t0 + 1.0 + (i / (n * 3)) * 1.6 + R() * 0.2, lado: R() < 0.5 ? -1 : 1, y: R(), x: R() })));
  const pico = (tt) => MOL.reduce((s, [t0, n]) => s + n * Math.exp(-0.5 * ((tt - (t0 + 1.9)) / 0.45) ** 2), 0);
  const pmax = 16;

  return {
    titulo: 'Detector de ionización de llama',
    dur: 22,
    fases: [
      { t: 0, texto: `Por el chorro salen el efluente de la columna, el hidrógeno (${h2}) y el gas auxiliar (${auxGas}, ${aux}). El aire (${aire}) entra alrededor. El encendedor se pone incandescente y prende la llama de hidrógeno.` },
      { t: 3.6, texto: 'Con solo portador, hidrógeno y aire apenas se forman iones: la corriente de fondo es de unos pocos picoamperios. Entre el chorro y el colector hay una tensión de polarización que arrastra los iones que se formen.' },
      { t: MOL[0][0], texto: 'Llega un compuesto orgánico. En la zona más caliente de la llama se rompe en fragmentos de un carbono; los radicales CH reaccionan con átomos de oxígeno: CH + O → CHO⁺ + e⁻. Solo una pequeña fracción de los carbonos (del orden de uno por cada cien mil) acaba como ion.' },
      { t: MOL[0][0] + 2.3, texto: 'Los cationes van al colector y los electrones al chorro. El electrómetro convierte esa corriente, de picoamperios a nanoamperios, en la señal del cromatograma.' },
      { t: MOL[1][0], texto: 'Una molécula con el doble de carbonos produce el doble de iones: con igual número de moles, el área del pico es proporcional al número de carbonos. Por eso el FID es un detector sensible a la masa de carbono, con más de siete órdenes de magnitud de respuesta lineal.' },
      { t: T_AGUA, texto: 'El agua, el CO₂, el nitrógeno o el oxígeno no tienen enlaces C–H y no producen iones: el FID no los ve. Los carbonos unidos a oxígeno o a halógenos responden menos (número efectivo de carbonos).' },
    ],
    dibujar(g, t) {
      const C = g.C;
      const encendida = t >= T_ON;
      /* ---------- cuerpo, colector, aislantes y chimenea ---------- */
      g.rect(136, 64, 160, 252, { fill: C.vacio, stroke: C.metalOsc, lw: 1.6, r: 6 });
      g.rect(196, 50, 40, 16, { fill: C.vacio, stroke: C.metalOsc, lw: 1.4 });
      for (let i = 0; i < 4; i++) g.circulo(206 + i * 7, 40 - ((t * 30 + i * 9) % 30), 2.2, { fill: C.gas, alpha: encendida ? 0.35 : 0 });
      g.texto('gases de combustión (H₂O)', 244, 40, { size: 9, color: C.tenue });
      g.rect(166, CY0, 12, CY1 - CY0, { fill: C.metal, stroke: C.metalOsc, lw: 1, r: 2 });
      g.rect(254, CY0, 12, CY1 - CY0, { fill: C.metal, stroke: C.metalOsc, lw: 1, r: 2 });
      for (const x of [156, 248]) {                // aislantes anulares (corte): uno bajo y otro sobre el colector
        g.rect(x, CY1 + 4, 28, 8, { fill: C.panel, stroke: C.linea, r: 2 });
        g.rect(x, CY0 - 12, 28, 8, { fill: C.panel, stroke: C.linea, r: 2 });
      }
      g.rotulo('Colector', 312, CY0 + 8, { size: 10, align: 'left' });
      g.rotulo('Aislantes (PTFE)', 312, CY1 + 8, { size: 9.5, align: 'left' });
      // base, chorro y entradas de gas
      g.rect(150, 262, 132, 54, { fill: C.metal, alpha: 0.35, stroke: C.metalOsc, lw: 1, r: 3 });
      g.rect(JX - 7, TIP, 14, 80, { fill: C.metal, stroke: C.metalOsc, lw: 1 });
      g.rect(JX - 2.5, TIP, 5, 80, { fill: C.vacio });
      g.rect(JX - 1.5, 316, 3, 44, { fill: '#c8902e' });
      g.rotulo('Chorro', 120, TIP + 14, { size: 10 });
      g.rotulo('Columna', 268, 346, { size: 10 });
      g.linea([[30, 300], [150, 300]], { color: C.metalOsc, lw: 7 }); g.linea([[30, 300], [150, 300]], { color: C.vacio, lw: 4 });
      g.texto(`H₂ + ${auxGas}`, 30, 286, { size: 10, color: C.texto2, weight: 600 });
      g.linea([[282, 276], [400, 276]], { color: C.metalOsc, lw: 7 }); g.linea([[282, 276], [400, 276]], { color: C.vacio, lw: 4 });
      g.texto('Aire', 372, 262, { size: 10, color: C.texto2, weight: 600 });
      for (let i = 0; i < 6; i++) { const k = (t * 0.5 + i / 6) % 1; g.circulo(lerp(32, 148, k), 300, 2, { fill: C.foton, alpha: 0.8 }); g.circulo(lerp(398, 284, k), 276, 2, { fill: C.gas, alpha: 0.8 }); }
      for (let i = 0; i < 8; i++) { const k = (t * 0.6 + i / 8) % 1, lado = i % 2 ? -1 : 1; g.circulo(JX + lado * (24 + k * 6), lerp(258, 200, k), 1.8, { fill: C.gas, alpha: 0.6 * (1 - k) }); }
      // encendedor
      const glow = tramo(t, 1.0, 1.5) * (1 - tramo(t, T_ON + 0.4, T_ON + 1.2));
      g.rect(296, 208, 70, 12, { fill: C.panel, stroke: C.linea, r: 3 });
      g.rect(258 + 8, 211, 30, 6, { fill: C.metalOsc });
      g.circulo(264, 214, 5 + glow * 3, { fill: C.calor, alpha: 0.2 + glow * 0.8 });
      g.rotulo('Encendedor', 330, 232, { size: 9.5 });

      /* ---------- llama ---------- */
      if (encendida) {
        const pop = easeOut(tramo(t, T_ON, T_ON + 0.4)), s = MOL.reduce((a, [t0, n]) => a + (n / 16) * Math.exp(-0.5 * ((t - (t0 + 1.9)) / 0.6) ** 2), 0);
        const fl = 1 + 0.04 * Math.sin(t * 23);
        g.linea([[JX - 9 * pop, TIP], [JX - 6 * pop, TIP - 30 * pop * fl], [JX, TIP - 52 * pop * fl], [JX + 6 * pop, TIP - 30 * pop * fl], [JX + 9 * pop, TIP]], { fill: '#5b8cff', alpha: 0.28 + 0.25 * s, cerrar: true });
        g.linea([[JX - 4 * pop, TIP], [JX, TIP - 24 * pop * fl], [JX + 4 * pop, TIP]], { fill: '#a8c8ff', alpha: 0.55, cerrar: true });
        if (t < T_ON + 0.6) g.circulo(JX, TIP - 20, 26 * (1 - tramo(t, T_ON, T_ON + 0.6)) + 4, { stroke: C.foton, lw: 2, alpha: 1 - tramo(t, T_ON, T_ON + 0.6) });
      }

      /* ---------- moléculas que llegan ---------- */
      for (const [t0, n, nom] of MOL) {
        const k = tramo(t, t0, t0 + 1.0);
        if (t < t0 || t > t0 + 2.6) continue;
        const y = lerp(360, TIP - 18, k), rot = (t - t0) * 1.4;
        const roto = tramo(t, t0 + 0.9, t0 + 1.4), alpha = 1 - tramo(t, t0 + 1.3, t0 + 1.8);
        if (k < 1 || alpha > 0) g.molecula(JX, y, { r: 3.2, n: Math.min(n, 10), rot, semilla: n, alpha, roto });
        if (k >= 1) for (let i = 0; i < n; i++) {
          // fragmentos CH que se dispersan en la llama
          const a = (i / n) * Math.PI * 2 + 0.3, d = 8 + 18 * tramo(t, t0 + 1.0, t0 + 1.8);
          g.circulo(JX + Math.cos(a) * d * 0.8, TIP - 26 + Math.sin(a) * d * 0.9, 2.4, { fill: C.texto2, alpha: alpha * 0.9 });
        }
        g.rotulo(nom, 404, 170, { size: 10, color: C.texto, alpha: tramo(t, t0, t0 + 0.3) * (1 - tramo(t, t0 + 2.2, t0 + 2.6)) });
      }
      if (t > MOL[0][0] + 1.2 && t < MOL[1][0] + 3) g.rotulo('CH + O → CHO⁺ + e⁻', 404, 140, { size: 11, color: C.ion });
      // iones hacia el colector y electrones hacia el chorro
      for (const L of iones) for (const q of L) {
        const u = (t - q.ts) / 0.55;
        if (u < 0 || u > 1) continue;
        const x0 = JX + (q.x - 0.5) * 10, y0 = TIP - 24 - q.y * 18;
        const xi = lerp(x0, JX + q.lado * 40, easeOut(u)), yi = lerp(y0, CY0 + 22 + q.y * 60, u);
        g.ion(xi, yi, { r: 4.2, q: 1, signo: false });
        const ue = Math.min(1, u * 1.6);
        if (ue < 1) g.electron(lerp(x0, JX + (q.x - 0.5) * 4, ue), lerp(y0, TIP + 2, ue), { r: 2 });
      }
      // especies sin C–H: pasan sin ionizarse
      if (t > T_AGUA && t < T_AGUA + 3.6) {
        const k = tramo(t, T_AGUA, T_AGUA + 3.2);
        const y = lerp(350, 60, k);
        g.molecula(JX - 6, y, { r: 3, n: 3, semilla: 2, color: C.liquido });
        g.molecula(JX + 8, y + 26, { r: 3, n: 3, semilla: 8, color: C.neutro });
        g.rotulo('H₂O, CO₂: sin señal', 404, 170, { size: 10, color: C.texto2, alpha: tramo(t, T_AGUA, T_AGUA + 0.3) });
      }

      /* ---------- circuito: polarización y electrómetro ---------- */
      g.linea([[266, 132], [440, 132], [440, 98]], { color: C.texto2, lw: 1.2 });
      g.linea([[440, 98], [474, 80], [440, 62], [440, 98]], { fill: C.panel, color: C.texto2, lw: 1.2 });
      g.texto('Electrómetro', 482, 62, { size: 10, color: C.texto2, weight: 600 });
      const corr = t >= T_ON ? 0.04 + pico(t) / pmax : 0;
      g.medidor(482, 82, 120, corr, { color: C.ion });
      g.linea([[150, 296], [110, 296], [110, 330]], { color: C.texto2, lw: 1.2 });
      g.linea([[98, 330], [122, 330]], { color: C.texto2, lw: 2 }); g.linea([[103, 336], [117, 336]], { color: C.texto2, lw: 2 });
      g.texto('Tensión de polarización', 62, 350, { size: 9.5, color: C.tenue });

      /* ---------- cromatograma ---------- */
      const GX = 440, GY = 196, GW = 190, GH = 120;
      g.rect(GX, GY, GW, GH, { fill: C.panel, stroke: C.linea, r: 4 });
      g.texto('Señal (pA)', GX + 8, GY + 11, { size: 9.5, color: C.texto2, weight: 600 });
      const base = GY + GH - 14, alto = GH - 36, xg = (tt) => GX + 8 + (tt / 22) * (GW - 16);
      g.linea([[GX + 8, base], [GX + GW - 8, base]], { color: C.tenue, lw: 0.8 });
      const pts = [];
      for (let i = 0; i <= 200; i++) { const tt = (i / 200) * Math.min(t, 22); pts.push([xg(tt), base - (tt >= T_ON ? 0.04 + pico(tt) / pmax : 0) * alto]); }
      g.linea(pts, { color: C.ion, lw: 1.5 });
      if (t > MOL[0][0] + 2.6) g.texto('8 C', xg(MOL[0][0] + 1.9), base - (8 / pmax) * alto - 7, { size: 9, color: C.texto2, align: 'center', weight: 700 });
      if (t > MOL[1][0] + 2.6) g.texto('16 C', xg(MOL[1][0] + 1.9), base - alto - 7, { size: 9, color: C.texto2, align: 'center', weight: 700 });
      if (t > T_AGUA + 1.6) g.texto('H₂O', xg(T_AGUA + 1.6), base - 8, { size: 9, color: C.tenue, align: 'center' });
      g.leyenda([[C.ion, 'CHO⁺'], [C.e, 'electrón', 'e'], [C.foton, 'H₂'], [C.gas, 'aire']], 30, 18, { size: 10 });
    },
  };
}
