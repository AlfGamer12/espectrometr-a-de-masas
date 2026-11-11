// Bombeo diferencial: cámaras en serie separadas por orificios pequeños, cada una con su bomba. La presión cae por etapas desde la
// fuente hasta el analizador y el recorrido libre medio crece en proporción inversa; los iones pasan de chocar continuamente con el gas
// a viajar sin colisiones. Todo es función de t (sin estado).
// Parámetros:
//   p.etapas: [{ nombre, sub?, p (Pa, número para la escala y λ), txt (presión tal como la da el equipo), bomba? }] de la fuente al analizador
//             (máx. 5; la primera suele ser la fuente a presión atmosférica, sin bomba).
//   p.guias (bool, por defecto true): las primeras etapas tienen guías de RF. p.colisiones (texto opcional que sustituye a la fase 4).
//   p.bombas (texto opcional de la fase 5). Sin p.etapas se usa un esquema LC-MS orientativo.
import { tramo, suave, lerp, azar, clamp } from '../dibujo.js';
import { lambdaN2, fmtLong } from './_util-servicios.js';

const Y0 = 46, Y1 = 206, AXY = 128;

export default function crear(p = {}) {
  const orientativo = !p.etapas;
  const E = (p.etapas || [
    { nombre: 'Fuente', sub: 'presión atmosférica', p: 101325, txt: '1 atm' },
    { nombre: '1.ª etapa', sub: 'guía de RF', p: 100, txt: '≈ 10² Pa', bomba: 'Rotatoria' },
    { nombre: '2.ª etapa', sub: 'guía de RF', p: 0.1, txt: '≈ 10⁻¹ Pa', bomba: 'Turbo' },
    { nombre: 'Analizador', sub: '', p: 1e-4, txt: '≈ 10⁻⁴ Pa', bomba: 'Turbo' },
  ]).slice(0, 5);
  const n = E.length, X0 = 10, X1 = 630, W = (X1 - X0) / n;
  const lp = E.map((e) => Math.log10(e.p)), lmax = Math.max(...lp), lmin = Math.min(...lp);
  const nivel = (i) => (lmax === lmin ? 0 : (lp[i] - lmin) / (lmax - lmin)); // 1 = presión más alta
  const choque = (i) => clamp((lp[i] + 2) / 7);                                 // frecuencia de colisión relativa (∝ log p, esquemático)
  const velo = E.map((_, i) => lerp(230, 55, choque(i)));
  const tCruce = velo.map((v) => W / v);
  const lam = E.map((e) => fmtLong(lambdaN2(e.p)));
  const ordenes = Math.round(lmax - lmin);
  const prim = E[0], ult = E[n - 1];
  const sinAprox = (s) => s.replace(/^≈\s*/, '');

  // moléculas de fondo: número creciente con log p
  const R = azar(23);
  const gas = E.map((_, i) => Array.from({ length: Math.round(2 + 30 * nivel(i)) }, () => ({ fx: R(), fy: R(), vx: (Math.floor(R() * 4) + 1) * (R() < 0.5 ? -1 : 1) / 9, vy: (Math.floor(R() * 4) + 1) * (R() < 0.5 ? -1 : 1) / 9 })));
  const tri = (u) => { const f = ((u % 2) + 2) % 2; return f < 1 ? f : 2 - f; };

  /** Posición de un ion lanzado hace tau segundos (avanza cámara a cámara con la velocidad y la dispersión de cada una). */
  function ion(tau, sem) {
    let x = X0 + 8, resto = tau;
    for (let i = 0; i < n; i++) {
      const xi = X0 + i * W, xf = xi + W, ini = i === 0 ? x : xi;
      const tt = (xf - ini) / velo[i];
      if (resto <= tt) {
        x = ini + resto * velo[i];
        const A = 17 * choque(i), RJ = azar(sem + i * 31);
        const ph = RJ() * 6, fr = 2.2 + RJ() * 1.5;
        // zigzag por choques: onda triangular que se anula en los orificios
        const env = Math.sin(Math.PI * clamp((x - xi) / W));
        const y = AXY + A * env * (tri((x - xi) / (W / (fr * 2)) + ph) * 2 - 1);
        return { x, y, i, A };
      }
      resto -= tt;
    }
    return null;
  }

  const fases = [
    { t: 0, texto: 'Entre la fuente y el analizador hay varias cámaras separadas por orificios pequeños. Cada orificio deja pasar el haz de iones pero solo una pequeña fracción del gas, y cada cámara tiene su propia bomba: es el bombeo diferencial.' },
    { t: 3.6, texto: `La presión cae así por etapas: de ${prim.txt} (${prim.nombre.toLowerCase()}) a ${ult.txt} (${ult.nombre.toLowerCase()}), unos ${ordenes} órdenes de magnitud. Con una sola cámara, el gas que entra sin cesar por la abertura haría imposible mantener el alto vacío.` },
    { t: 7.4, texto: `El recorrido libre medio λ, la distancia media que recorre una molécula entre dos choques, es inversamente proporcional a la presión: ≈ ${lam[0]} a ${sinAprox(prim.txt)} y ≈ ${lam[n - 1]} a ${sinAprox(ult.txt)}.` },
    { t: 11, texto: p.colisiones || (p.guias === false
      ? 'En las primeras cámaras los iones chocan continuamente con el gas. En el analizador, en cambio, λ es mucho mayor que el recorrido de los iones, que lo atraviesan sin colisiones.'
      : 'En las primeras cámaras los iones chocan continuamente con el gas, que los frena y los dispersa; por eso allí se conducen con guías de radiofrecuencia. En el analizador λ es mucho mayor que el recorrido de los iones, que lo atraviesan sin colisiones.') },
    { t: 14.6, texto: p.bombas || 'La cámara de presión más alta se evacúa con la bomba rotatoria, que además recoge el escape de las turbomoleculares que mantienen las etapas de alto vacío.' },
  ];

  return {
    titulo: 'Bombeo diferencial',
    dur: 18,
    fases,
    dibujar(g, t) {
      const C = g.C;
      const kP = tramo(t, 3.6, 4.4), kL = tramo(t, 7.4, 8.2);
      /* --- cámaras --- */
      for (let i = 0; i < n; i++) {
        const x = X0 + i * W, e = E[i];
        g.rect(x, Y0, W, Y1 - Y0, { fill: i === 0 && !e.bomba ? C.panel : C.vacio, stroke: C.linea, lw: 1 });
        g.rotulo(e.nombre, x + W / 2, Y0 + 14, { size: 10.5 });
        if (e.sub) g.texto(e.sub, x + W / 2, Y1 - 12, { size: 9.5, color: C.tenue, align: 'center' });
        // moléculas de gas
        for (const m of gas[i]) {
          const gx = x + 6 + tri(m.fx * 2 + m.vx * t) * (W - 12), gy = Y0 + 26 + tri(m.fy * 2 + m.vy * t) * (Y1 - Y0 - 46);
          g.circulo(gx, gy, 2.3, { fill: C.gas, alpha: 0.8 });
        }
        // bomba
        if (e.bomba) {
          g.rect(x + W / 2 - 9, Y1, 18, 10, { fill: C.metalOsc });
          g.flecha(x + W / 2, Y1 + 10, x + W / 2, Y1 + 22, { color: C.tenue, lw: 1.2, punta: 5 });
          g.rotulo(e.bomba, x + W / 2, Y1 + 32, { size: 10 });
          for (let k = 0; k < 2; k++) { const yy = Y1 - 14 + ((t * (22 * 15 / 18) + k * 9) % 22); g.circulo(x + W / 2 + (k ? 4 : -4), yy, 2, { fill: C.gas, alpha: 0.7 }); }
        }
      }
      // tabiques con orificio
      for (let i = 1; i < n; i++) {
        const x = X0 + i * W;
        g.rect(x - 3, Y0, 6, AXY - 7 - Y0, { fill: C.metal, stroke: C.metalOsc, lw: 0.6 });
        g.rect(x - 3, AXY + 7, 6, Y1 - AXY - 7, { fill: C.metal, stroke: C.metalOsc, lw: 0.6 });
        // fuga de gas por el orificio hacia la cámara siguiente (más intensa cuanto mayor es la presión de la anterior)
        const k = nivel(i - 1);
        for (let j = 0; j < Math.round(1 + 3 * k); j++) { const f = ((t * (16 / 18) + j * 0.31) % 1); g.circulo(x + f * 26, AXY + (j - 1.5) * 4 * f, 2.1, { fill: C.gas, alpha: (1 - f) * 0.9 }); }
      }
      /* --- iones --- */
      for (let s = 0; s < 20; s++) {
        const t0 = s * 0.9;
        const tau = ((t - t0) % 18 + 18) % 18;
        const q = ion(tau, 100 + s * 17);
        if (!q) continue;
        g.ion(q.x, q.y, { r: 4.6 });
        // destello de choque en cámaras de presión alta
        if (q.A > 4 && Math.abs(q.y - AXY) > q.A * 0.85) g.circulo(q.x, q.y, 7, { stroke: C.ion, lw: 1, alpha: 0.5 });
      }

      /* --- gráfica: presión (escala logarítmica) y recorrido libre medio --- */
      const GY0 = 258, GY1 = 314;
      g.texto('presión (escala log)', X0, GY0 - 10, { size: 9.5, color: C.tenue, weight: 600 });
      const yP = (i) => lerp(GY1, GY0, nivel(i));
      const esc = [];
      for (let i = 0; i < n; i++) { esc.push([X0 + i * W + 6, yP(i)]); esc.push([X0 + (i + 1) * W - 6, yP(i)]); }
      g.linea(esc, { color: C.acento, lw: 2, alpha: 0.5 + 0.5 * kP });
      for (let i = 0; i < n; i++) {
        const cx = X0 + i * W + W / 2;
        g.texto(E[i].txt, cx, yP(i) + (nivel(i) > 0.5 ? 11 : -9), { size: 10.5, color: C.texto, align: 'center', weight: 700, alpha: 0.6 + 0.4 * kP });
        g.texto(`λ ≈ ${lam[i]}`, cx, 336, { size: 10.5, color: C.e, align: 'center', weight: 700, alpha: 0.35 + 0.65 * kL });
      }
      g.texto(`λ: recorrido libre medio de las moléculas (aire, 20 °C)${orientativo ? ' · presiones orientativas' : ''}`, (X0 + X1) / 2, 352, { size: 9.5, color: C.tenue, align: 'center' });
      g.leyenda([[C.ion, 'ion'], [C.gas, 'molécula de gas']], X1 - 190, 22, { size: 10 });
      g.texto('Bombeo diferencial (esquema)', X0, 22, { size: 10.5, color: C.texto2, weight: 700 });
    },
  };
}
