// Tiempo de vuelo lineal (como el modo lineal del Bruker microflex LRF).
// Iones de varias m/z se forman a la vez, el mismo potencial U les da la misma energía cinética (zeU = ½mv²) y en el tubo sin campo
// se separan por su velocidad. La cinemática es exacta en la escala del dibujo: cada ion se acelera de forma uniforme en la fuente y
// vuela a velocidad constante, con v ∝ 1/√m, de modo que llega al detector en t = L·√(m/2zeU) (calculado con p.U y p.L).
// Todo es función de t (sin estado).
// Parámetros: p.U (kV, 20) · p.L (m, 1) · p.masas ([1000, 2500, 5000, 10000]) · p.fuente ('maldi' | otra cosa: fuente genérica)
//             p.detector (rótulo del detector, 'Detector lineal').
import { tramo, suave, easeOut, lerp } from '../dibujo.js';
import { FIS, num, panelSenal, destello } from './_util-analizadores.js';

export default function crear(p = {}) {
  const U = p.U || 20;                       // kV
  const L = p.L || 1;                        // m
  const masas = (p.masas || [1000, 2500, 5000, 10000]).slice(0, 5).sort((a, b) => a - b);
  const maldi = (p.fuente || 'maldi') === 'maldi';
  const nomDet = p.detector || 'Detector lineal';
  // tiempo de vuelo real (µs) por el tubo de longitud L
  const tv = (m) => L * Math.sqrt((m * FIS.u) / (2 * FIS.e * U * 1e3)) * 1e6;
  const T = masas.map(tv);
  const tMax = Math.ceil((T[T.length - 1] * 1.12) / 10) * 10;      // fondo de escala del eje de tiempos (µs)
  const paso = tMax > 80 ? 20 : 10;

  // geometría (px)
  const XD = 50, XS = XD + 3, XG = 88, XDET = 566, Y0 = 108;
  const g2 = XG - XS, D = XDET - XG;
  const LANZA = 2.0;                          // instante del pulso de extracción (s de animación)
  const K = (T[T.length - 1]) / 10.4;         // µs de vuelo por segundo de animación (el más pesado tarda ~10 s)
  const llegada = T.map((ti) => LANZA + ti / K);
  const dur = 18;

  /** Posición del ion i en el instante t (s de animación), o null si aún no ha salido. */
  function pos(i, t) {
    const tau = (t - LANZA) * K;             // µs reales
    if (tau < 0) return { x: XS, v: 0, fase: 0 };
    const v = (2 * g2 + D) / T[i];           // px/µs: cumple x(T) = detector con aceleración uniforme en la fuente
    const tg = (2 * g2) / v;
    if (tau < tg) return { x: XS + (0.5 * v * v / (2 * g2)) * tau * tau, v: (v * tau) / tg, fase: 1 };
    const x = XG + v * (tau - tg);
    return { x: Math.min(x, XDET), v, fase: x >= XDET ? 3 : 2 };
  }

  const tx1 = `${num(T[0], 0)} µs`, txN = `${num(T[T.length - 1], 0)} µs`;
  const fuenteTxt = maldi
    ? `El pulso láser forma todos los iones a la vez sobre la diana. La diferencia de ${num(U)} kV entre la diana y el electrodo de tierra los acelera y todos reciben la misma energía cinética: zeU = ½mv².`
    : `Todos los iones parten a la vez de la fuente. La diferencia de potencial de ${num(U)} kV los acelera y todos reciben la misma energía cinética: zeU = ½mv².`;

  return {
    titulo: 'Tiempo de vuelo lineal',
    dur,
    fases: [
      { t: 0, texto: fuenteTxt },
      { t: 3.4, texto: 'Con la misma energía, la velocidad depende de la masa: v = √(2zeU/m). En el tubo de vuelo no hay campo, así que cada ion conserva su velocidad: los ligeros se adelantan y los pesados se quedan atrás.' },
      { t: llegada[0] - 0.4, texto: 'Los iones ligeros llegan antes al detector. Cada llegada produce un pico en la señal, que se registra frente al tiempo transcurrido desde el disparo.' },
      { t: llegada[llegada.length - 1] + 0.3, texto: `El tiempo de vuelo crece con la raíz de m/z: t = L·√(m/2zeU). Con ${num(U)} kV y ${num(L, L % 1 ? 1 : 0)} m, m/z ${num(masas[0])} tarda unos ${tx1} y m/z ${num(masas[masas.length - 1])}, unos ${txN}. El eje se calibra con patrones de masa conocida.` },
    ],
    dibujar(g, t) {
      const C = g.C;
      const fa = 1 - tramo(t, dur - 0.7, dur);         // desvanecido final antes de reiniciar
      const kAcel = tramo(t, LANZA - 0.5, LANZA);

      /* --- fuente --- */
      g.electrodo(XD - 8, Y0 - 56, 8, 112, { color: kAcel > 0 ? C.ion : C.metal, alpha: 0.55 + 0.45 * kAcel });
      g.electrodo(XG - 4, Y0 - 56, 6, 46, {}); g.electrodo(XG - 4, Y0 + 10, 6, 46, {});
      g.rotulo(maldi ? `Diana · ${num(U)} kV` : `Fuente · ${num(U)} kV`, XD + 34, Y0 - 72, { size: 11 });
      g.rotulo('0 V', XG - 1, Y0 + 70, { size: 11 });
      if (kAcel > 0) for (const dy of [-26, 26]) g.flecha(XD + 4, Y0 + dy, XG - 8, Y0 + dy, { color: C.campo, lw: 1.2, punta: 5, alpha: kAcel });
      if (maldi) {
        const kl = tramo(t, 0.4, 1.3);
        if (kl > 0 && kl < 1) g.foton(16, 34, XS, Y0 - 2, { k: Math.min(1, kl * 1.7), color: C.foton, amp: 3, long: 8, alpha: 1 - tramo(kl, 0.75, 1) });
        if (t < 1.4) g.texto('láser', 20, 24, { size: 10.5, color: C.foton, weight: 700, alpha: tramo(t, 0.1, 0.5) * (1 - tramo(t, 1.1, 1.4)) });
        if (t > 0.95 && t < 2.0) g.circulo(XS, Y0, 6 + 10 * tramo(t, 0.95, 1.6), { fill: C.foton, alpha: 0.4 * (1 - tramo(t, 0.95, 2.0)) });
      }

      /* --- tubo y detector --- */
      g.camara(XG + 6, Y0 - 40, XDET - XG - 10, 80, {});
      g.texto(`Tubo de vuelo sin campo · L ≈ ${num(L, L % 1 ? 1 : 0)} m`, (XG + XDET) / 2, Y0 - 52, { size: 11.5, color: C.texto2, align: 'center', weight: 600 });
      g.electrodo(XDET, Y0 - 40, 10, 80, { color: C.metalOsc });
      g.rotulo(nomDet, XDET + 10, Y0 + 56, { size: 11, align: 'right' });

      /* --- iones --- */
      const n = masas.length;
      for (let i = 0; i < n; i++) {
        const q = pos(i, t);
        const y = Y0 + (i - (n - 1) / 2) * 15;
        const col = C.m[i % C.m.length];
        const r = 5 + i * 0.7;
        if (q.fase === 3) {
          destello(g, XDET - 1, y, tramo(t, llegada[i], llegada[i] + 0.5), { color: col });
          continue;
        }
        if (q.fase === 0) {
          // antes del pulso de extracción: los iones recién formados sobre la diana
          const a = maldi ? tramo(t, 1.1, 1.6) : 1;
          if (a <= 0) continue;
          g.ion(XS, lerp(Y0, y, suave(a)), { r, color: col, alpha: a * fa });
          continue;
        }
        const yy = y;
        g.ion(q.x, yy, { r, color: col, alpha: fa });
        // flecha de velocidad (∝ v) en el tubo
        const lv = q.v * 2;                                   // longitud ∝ v (se oculta al llegar al detector)
        const punta = q.x + r + 2 + lv;
        if (q.fase === 2 && t > 3.2 && punta < XDET - 4) {
          g.flecha(q.x + r + 2, yy, punta, yy, { color: col, lw: 1.3, punta: 4.5, alpha: 0.85 * tramo(t, 3.2, 3.8) * fa * (1 - tramo(punta, XDET - 40, XDET - 4)) });
        }
      }
      if (t > 3.2 && t < llegada[0] - 0.2) g.texto('v ∝ 1/√(m/z)', (XG + XDET) / 2, Y0 + 54, { size: 11.5, color: C.texto2, align: 'center', weight: 600, alpha: tramo(t, 3.4, 4) * (1 - tramo(t, llegada[0] - 0.8, llegada[0] - 0.2)) });

      /* --- tabla de especies (leyenda) --- */
      const bx = 12, by = 200;
      g.rect(bx, by, 214, 148, { fill: C.panel, stroke: C.linea, r: 5 });
      g.texto('Misma energía:  zeU = ½mv²', bx + 10, by + 16, { size: 11.5, color: C.texto, weight: 600 });
      g.texto('t = L · √(m / 2zeU)', bx + 10, by + 36, { size: 11.5, color: C.texto2, weight: 600, italic: true });
      g.texto('m/z', bx + 26, by + 57, { size: 10, color: C.tenue, weight: 600 });
      g.texto('llegada', bx + 200, by + 57, { size: 10, color: C.tenue, weight: 600, align: 'right' });
      for (let i = 0; i < n; i++) {
        const yy = by + 76 + i * 18;
        const col = C.m[i % C.m.length];
        g.circulo(bx + 16, yy, 4.5, { fill: col });
        g.texto(num(masas[i]), bx + 26, yy + 0.5, { size: 11.5, color: C.texto2, weight: 600 });
        const ya = t >= llegada[i];
        g.texto(ya ? `≈ ${num(T[i], T[i] < 10 ? 1 : 0)} µs` : '…', bx + 200, yy + 0.5, { size: 11.5, color: ya ? col : C.tenue, weight: 700, align: 'right', alpha: ya ? fa : 1 });
      }

      /* --- señal del detector --- */
      const tau = Math.max(0, (t - LANZA) * K);
      const ticks = [];
      for (let v = 0; v <= tMax + 1e-6; v += paso) ticks.push([v / tMax, num(v)]);
      panelSenal(g, 236, 200, 394, 148, {
        titulo: 'Señal del detector', nota: 'tiempo de vuelo (µs)', ticks, cursor: t > LANZA && fa > 0.99, alpha: fa,
        u1: t < LANZA ? 0 : (fa < 1 ? 1 : tau / tMax),
        picos: T.map((ti, i) => ({ u: ti / tMax, s: (ti * 0.012) / tMax + 0.004, a: 0.9 - i * 0.1, color: C.m[i % C.m.length] })),
      });
      // durante el desvanecido la traza completa se mantiene y se atenúa
    },
  };
}
