// Válvula de inyección de 2 posiciones y 6 puertos del Vialsampler 1260 Infinity II (diseño de flujo continuo).
// Puerto 1: bomba · 2: dosificador → bucle → aguja · 5: asiento de la aguja · 6: columna · 4: residuos · 3: tapado.
// «Mainpass»: ranuras 1-2, 3-4 y 5-6 (la fase móvil pasa por el dosificador, el bucle y la aguja). «Bypass»: 6-1, 2-3 y 4-5.
// Secuencia (manual del Vialsampler): bypass → la aguja sube → la pinza pone el vial → la aguja baja y el dosificador aspira →
// la aguja sube (burbuja de aire), se lava por fuera y vuelve al asiento → mainpass: la fase móvil arrastra la muestra a la columna.
// Todo es función de t. Parámetros: p.volumen (texto, «5 µL»), p.bucle (texto, «100 µL»).
import { tramo, suave, lerp, clamp } from '../dibujo.js';
import { recorrido } from './util-servicios.js';

const CX = 190, CY = 175, R = 62;
const ang = (k) => (Math.PI / 2) - (k - 1) * (Math.PI / 3);
const puerto = (k, r = R) => [CX + Math.cos(ang(k)) * r, CY - Math.sin(ang(k)) * r];
const NX = 520, SEAT = 270;                         // eje de la aguja y altura del asiento
const T = { bypass: [3.5, 4.3], sube: [4.3, 5.2], vialEntra: [5.2, 6.1], baja: [6.1, 6.9], aspira: [6.9, 8.9], sube2: [8.9, 9.7],
  vialSale: [9.7, 10.5], asiento: [10.5, 11.4], mainpass: [11.4, 12.2] };

export default function crear(p = {}) {
  const vol = p.volumen || '5 µL', bucle = p.bucle || '100 µL';
  const arco = (a0, a1, r = R) => { const pts = []; for (let i = 0; i <= 16; i++) { const a = a0 + (a1 - a0) * (i / 16); pts.push([CX + Math.cos(a) * r, CY - Math.sin(a) * r]); } return pts; };
  // trayectos: A = bomba → 1 → 2 → dosificador → bucle → aguja (hasta la punta); B = asiento → 5 → 6 → columna; C = bypass 1 → 6 → columna
  const bucleP = [[372, 144], [392, 144], [404, 126], [418, 152], [432, 126], [446, 152], [460, 126], [474, 152], [488, 120], [500, 90]];
  const trayA = (dy) => recorrido([[CX, 22], puerto(1), ...arco(ang(1), ang(2)).slice(1), puerto(2), [300, 144], [330, 144], [340, 144], ...bucleP, [NX, 92 - dy], [NX, 118 - dy], [NX, SEAT + 4 - dy]], 300);
  const trayB = recorrido([[NX, SEAT + 12], [NX, 300], [NX, 306], [NX - 6, 312], [NX - 20, 312], [CX - 40, 312], [CX - 48, 312], [CX - 54, 306],
    [CX - 54, 296], [CX - 54, 222], [CX - 54, 212], puerto(5), ...arco(ang(5), ang(6)).slice(1), puerto(6), [24, 144]], 300);
  const trayC = recorrido([[CX, 22], puerto(1), ...arco(ang(1), ang(6) + Math.PI * 2).slice(1), puerto(6), [24, 144]], 200);

  return {
    titulo: 'Válvula de inyección de seis puertos',
    dur: 18,
    fases: [
      { t: 0, texto: 'Posición «mainpass»: la fase móvil entra por el puerto 1 y recorre el dosificador, el bucle y la aguja antes de salir por el 6 hacia la columna. Todo lo que toca la muestra queda lavado.' },
      { t: T.bypass[0], texto: 'Al empezar la inyección el rotor gira 60° a «bypass»: la bomba alimenta la columna directamente (1 → 6) y el circuito del dosificador queda aislado.' },
      { t: T.sube[1], texto: `La aguja sale del asiento, la pinza coloca el vial debajo y la aguja baja. El dosificador retrocede y aspira ${vol} de muestra hacia la aguja y el bucle (${bucle}).` },
      { t: T.sube2[0], texto: 'La aguja sube y toma una pequeña burbuja de aire que protege la muestra; su exterior se lava en el puerto de lavado y vuelve a apoyarse en el asiento.' },
      { t: T.mainpass[0], texto: 'El rotor vuelve a «mainpass»: la fase móvil empuja la muestra desde la aguja, a través del asiento y de los puertos 5 y 6, hasta la cabeza de la columna. Empieza el cromatograma.' },
    ],
    dibujar(g, t) {
      const C = g.C, cm = C.foton;
      const kRot = suave(tramo(t, ...T.bypass)) * (1 - suave(tramo(t, ...T.mainpass)));
      const theta = kRot * Math.PI / 3, bypass = kRot > 0.5;
      const dyN = 80 * (suave(tramo(t, ...T.sube)) - suave(tramo(t, ...T.baja)) * 0.525 + suave(tramo(t, ...T.sube2)) * 0.525 - suave(tramo(t, ...T.asiento)));
      const xV = lerp(600, NX, suave(tramo(t, ...T.vialEntra)) - suave(tramo(t, ...T.vialSale)));
      const kAsp = suave(tramo(t, ...T.aspira));
      const A = trayA(dyN);

      /* ---------- conexiones fijas ---------- */
      const lin = (pts, col = C.metalOsc, lw = 2.4, al = 1) => g.linea(pts, { color: col, lw, alpha: al });
      lin([[CX, 22], puerto(1)]);
      lin([puerto(6), [24, 144]]);
      g.flecha(60, 144, 22, 144, { color: C.texto2 }); g.texto('a la columna', 24, 128, { size: 10, color: C.texto2 });
      g.texto('de la bomba', CX + 8, 20, { size: 10, color: C.texto2 });
      lin([puerto(2), [300, 144]]);
      lin(bucleP.slice(1), C.metalOsc, 2.4); g.rotulo('Bucle', 446, 102, { size: 10 });
      lin([[500, 90], [NX - 4, 92 - dyN], [NX, 96 - dyN]]);
      lin([[NX, SEAT + 12], [NX, 312], [CX - 54, 312], puerto(5)]);
      lin([puerto(4), [CX, 268], [244, 268]]); g.texto('residuos', 248, 268, { size: 9.5, color: C.tenue });
      // dosificador (cabezal analítico con su pistón)
      g.rect(300, 128, 72, 32, { fill: C.panel, stroke: C.metalOsc, lw: 1.2, r: 4 });
      const pist = 160 + kAsp * 22 - suave(tramo(t, 14, 17.5)) * 22;
      g.rect(330, pist, 12, 210 - pist, { fill: C.frio, alpha: 0.35, stroke: C.frio, lw: 1 });
      g.rect(328, 206, 16, 8, { fill: C.metalOsc, r: 2 });
      g.rotulo('Dosificador', 336, 226, { size: 10 });
      // asiento de la aguja
      g.rect(NX - 16, SEAT, 32, 14, { fill: C.metal, stroke: C.metalOsc, lw: 1, r: 2 });
      g.rotulo('Asiento', NX + 50, SEAT + 7, { size: 10 });
      // vial (lo coloca la pinza entre la aguja levantada y el asiento)
      if (xV < 598) {
        g.rect(xV - 13, 200, 26, 50, { fill: C.panel, stroke: C.metalOsc, lw: 1.2, r: 3, alpha: 0.95 });
        g.rect(xV - 11, 226 + 4 * kAsp, 22, 22 - 4 * kAsp, { fill: cm, alpha: 0.6, r: 2 });
        g.rect(xV - 14, 194, 28, 8, { fill: C.acento, r: 2 });
        g.rect(xV + 13, 218, 40, 6, { fill: C.metalOsc, alpha: 0.8 });           // pinza
      } else g.texto('vial →', 598, 226, { size: 10, color: C.tenue, align: 'right' });
      // aguja
      g.rect(NX - 9, 96 - dyN, 18, 22, { fill: C.metalOsc, r: 3 });
      g.linea([[NX, 118 - dyN], [NX, SEAT + 4 - dyN]], { color: C.metal, lw: 3.4 });
      g.rotulo('Aguja', NX + 44, 150 - dyN * 0.5, { size: 10 });

      /* ---------- válvula ---------- */
      g.circulo(CX, CY, R + 16, { fill: C.panel, stroke: C.metalOsc, lw: 1.6 });
      // ranuras del rotor
      for (const a of [1, 3, 5]) {
        const a0 = ang(a) + theta, a1 = a0 - Math.PI / 3;
        g.linea(arco(a0, a1), { color: C.mal, lw: 6, alpha: 0.8 });
      }
      for (let k = 1; k <= 6; k++) {
        const [x, y] = puerto(k);
        g.circulo(x, y, 10, { fill: k === 3 ? C.texto2 : C.panel, stroke: C.metalOsc, lw: 1.4 });
        g.texto(String(k), x, y + 0.5, { size: 10, color: k === 3 ? '#fff' : C.texto, align: 'center', weight: 700 });
      }
      g.texto(bypass ? 'BYPASS' : 'MAINPASS', CX, CY + 1, { size: 12.5, color: bypass ? C.ion : C.ok, align: 'center', weight: 800 });

      /* ---------- flujo de fase móvil ---------- */
      const gotas = (f, n, vel, desde = 0) => { for (let i = 0; i < n; i++) { const s = ((t * vel + i / n) % 1); if (s < desde) continue; const q = f(s); g.circulo(q.x, q.y, 2.6, { fill: C.liquido }); } };
      if (!bypass) { gotas(A, 30, 0.12); gotas(trayB, 22, 0.14); } else gotas(trayC, 14, 0.25);

      /* ---------- muestra ---------- */
      const tramoMuestra = (f, s0, s1, al = 0.95) => { const pts = []; for (let i = 0; i <= 20; i++) { const q = f(lerp(s0, s1, i / 20)); pts.push([q.x, q.y]); } g.linea(pts, { color: cm, lw: 6, alpha: al }); };
      if (t >= T.aspira[0] && t < T.mainpass[0] + 0.3) {
        tramoMuestra(A, 1 - 0.1 * kAsp, 1);                                 // la muestra ocupa la punta de la aguja
      } else if (t >= T.mainpass[0] + 0.3) {
        const k = (t - T.mainpass[0] - 0.3) / 5.2;                          // la fase móvil la empuja: asiento → 5 → 6 → columna
        const s = clamp(k * 1.25, 0, 1.2);
        if (s < 0.1) tramoMuestra(A, 0.9 + s, 1);
        if (s > 0) tramoMuestra(trayB, Math.max(0, s - 0.1), Math.min(1, s), 0.95);
      }
      g.leyenda([[C.liquido, 'fase móvil'], [cm, 'muestra'], [C.mal, 'ranuras del rotor']], 330, 346, { size: 9.5 });
    },
  };
}
