// Movilidad iónica atrapada (TIMS) doble, como la del Bruker timsTOF Pro. El gas fluye hacia la salida y arrastra a los iones; un gradiente
// de campo eléctrico los frena. Cada ion se detiene donde su velocidad de deriva K·E iguala la del gas (E = v_gas/K): los de menor
// movilidad K (más voluminosos, 1/K₀ alto) necesitan más campo y quedan más cerca de la salida. Al bajar el campo eluyen en orden de 1/K₀
// decreciente. La sección 1 acumula mientras la 2 analiza; al final, PASEF (el cuadrupolo salta a cada precursor según eluye).
// Las posiciones salen de E(x)·s(t) = v_gas/K con una rampa lineal de s(t): todo es función de t y el bucle cierra sin saltos.
// Parámetros: p.rampa ('100 ms'), p.presion ('≈ 2–3 mbar'), p.pasef (true), p.destino ('el cuadrupolo').
import { tramo, suave, easeOut, lerp, clamp, azar } from '../dibujo.js';

export default function crear(p = {}) {
  const rampa = p.rampa || '100 ms';
  const presion = p.presion || '≈ 2–3 mbar';
  const pasef = p.pasef !== false;
  const destino = p.destino || 'el cuadrupolo';

  const T1 = 3.6, T2 = 7.4, T3 = 11.2, T4 = 15, DUR = pasef ? 19.6 : 15;
  const fases = [
    { t: 0, texto: `El túnel TIMS es un tubo de electrodos apilados con gas a ${presion}. El gas fluye hacia la salida y arrastra a los iones, mientras la radiofrecuencia los mantiene en el eje. Aquí, tres poblaciones de iones de distinto tamaño.` },
    { t: T1, texto: 'Un gradiente de campo eléctrico se opone al flujo. Cada ion se detiene donde la fuerza del campo iguala el arrastre del gas, es decir, donde K·E = v_gas. Los iones voluminosos, de movilidad K baja, necesitan más campo y quedan más cerca de la salida.' },
    { t: T2, texto: `Después el campo se reduce poco a poco. Los iones avanzan y, cuando ni la meseta del campo basta para frenarlos, salen del túnel: primero los de menor movilidad (1/K₀ alto) y al final los más compactos. Una rampa típica dura ${rampa}.` },
    { t: T3, texto: 'Mientras la segunda sección analiza, la primera acumula los iones que siguen llegando. Al acabar la rampa se los transfiere, así que casi ningún ion se pierde y el ciclo de trabajo se acerca al 100 %.' },
  ];
  if (pasef) fases.push({ t: T4, texto: 'PASEF: cada precursor sale del TIMS en uno o dos milisegundos, así que el cuadrupolo salta de uno a otro siguiendo la rampa, en menos de 1 ms, y los aísla por turno para fragmentarlos. En una rampa se fragmentan unos diez precursores.' });

  /* --- geometría del túnel --- */
  const EJE = 92, RT = 20;
  const S1 = [96, 252], S2 = [268, 560];
  const X1A = 118, X1B = 226, X2A = 292, X2B = 470; // tramos de gradiente creciente (después, meseta)
  const SMIN = 0.3;
  const ESP = [ // c = v_gas/(K·E_max): fracción de la meseta que necesita cada ion para quedar frenado
    { c: 0.9, r: 7.5, nom: '1/K₀ alto (voluminoso)' },
    { c: 0.64, r: 5.6, nom: '1/K₀ medio' },
    { c: 0.4, r: 4.2, nom: '1/K₀ bajo (compacto)' },
  ];
  // ciclos: [inicio de acumulación, transferencia a la sección 2, inicio de rampa, duración de rampa]
  const CIC = [
    { a: -6, b: 0, r: T2 + 0.3, d: 3.1 },
    { a: 0, b: T3 + 0.2, r: T3 + 1.3, d: 2.3 },
    { a: T3 + 0.2, b: pasef ? T4 + 0.1 : DUR, r: T4 + 1.1, d: 3.3 },
    { a: pasef ? T4 + 0.1 : DUR, b: DUR + 1e3, r: 1e9, d: 1 },
  ];
  const R = azar(17);
  const IONES = [];
  CIC.forEach((c, k) => {
    for (let j = 0; j < 12; j++) {
      const s = j % 3;
      IONES.push({ k, s, f: (j + R() * 0.8) / 12, dx: (R() - 0.5) * 7, dy: (R() - 0.5) * 2 * (RT - ESP[s].r - 3), ph: R() * 6.28 });
    }
  });
  const sDe = (c, t) => (t < c.r ? 1 : t < c.r + c.d ? lerp(1, SMIN, (t - c.r) / c.d) : 1);
  const tRel = (c, s) => c.r + (c.d * (1 - ESP[s].c)) / (1 - SMIN);
  const cicloAnalisis = (t) => { let k = 0; for (let i = 0; i < CIC.length; i++) if (t >= CIC[i].b) k = i; return k; };

  function posicion(io, t) {
    const c = CIC[io.k], e = ESP[io.s];
    const x1 = X1A + (X1B - X1A) * e.c + io.dx;
    const llegada = lerp(c.a, Math.min(c.b, c.a + 4.8) - 0.3, io.f);
    if (t < llegada) return null;
    if (t < c.b) {
      // entra con el gas y frena hasta su posición en la sección 1
      const k = easeOut(clamp((t - llegada) / 0.9));
      return { x: lerp(40, x1, k), y: EJE + io.dy * k, al: 1 };
    }
    const x2 = (s) => X2A + (X2B - X2A) * (e.c / s) + io.dx;
    if (t < c.b + 0.9) { const k = suave((t - c.b) / 0.9); return { x: lerp(x1, x2(1), k), y: EJE + io.dy, al: 1 }; }
    const tr = tRel(c, io.s);
    if (t < tr) return { x: x2(sDe(c, t)), y: EJE + io.dy * (1 - 0.3 * tramo(t, c.r, tr)), al: 1 };
    const x = X2B + io.dx + 240 * (t - tr);
    if (x > 650) return null;
    return { x, y: EJE + io.dy * 0.7 * Math.max(0, 1 - (x - 560) / 40), al: 1 };
  }

  return {
    titulo: 'Movilidad iónica atrapada (TIMS)',
    dur: DUR,
    fases,
    dibujar(g, t) {
      const C = g.C;
      const COL = [C.m[2], C.m[3], C.m[1]];
      const kA = cicloAnalisis(t), cA = CIC[kA];
      const s2 = sDe(cA, t);

      /* ===== túnel ===== */
      // embudo de entrada
      for (let i = 0; i < 6; i++) { const x = 34 + i * 10, r = lerp(40, RT + 2, i / 5); g.rect(x - 1.5, EJE - r - 10, 3, 10, { fill: C.metal }); g.rect(x - 1.5, EJE + r, 3, 10, { fill: C.metal }); }
      g.rotulo('Embudo', 52, EJE + 64, { size: 9.5 });
      for (const [a, b, nom, act] of [[S1[0], S1[1], 'Sección 1 · acumulación', true], [S2[0], S2[1], 'Sección 2 · análisis', true]]) {
        for (let x = a; x <= b; x += 7) { g.rect(x - 1.5, EJE - RT - 12, 3, 12, { fill: C.metal }); g.rect(x - 1.5, EJE + RT, 3, 12, { fill: C.metal }); }
        g.rotulo(nom, (a + b) / 2, 30, { size: 10, color: act ? C.texto2 : C.tenue });
      }
      g.flecha(572, EJE, 632, EJE, { color: C.tenue, lw: 1.2, punta: 6 });
      g.texto(`Hacia ${destino}`, 632, EJE + 26, { size: 9.5, color: C.tenue, align: 'right' });
      // gas
      const Rg = azar(5);
      for (let i = 0; i < 46; i++) {
        const u = (Rg() + (t * (6 + Math.floor(Rg() * 3))) / DUR) % 1, y = EJE + (Rg() - 0.5) * 2 * (RT - 2);
        g.circulo(lerp(30, 640, u), y, 1.5, { fill: C.gas, alpha: 0.55 });
      }
      g.flecha(120, 54, 230, 54, { color: C.gas, lw: 1.8, punta: 7 });
      g.texto('flujo de gas', 236, 54, { size: 9.5, color: C.gas, weight: 600 });
      // campo opuesto (sobre la sección 2)
      if (t >= T1 - 0.2) {
        const a = tramo(t, T1 - 0.2, T1 + 0.3);
        g.flecha(470, 54, 330, 54, { color: C.acento, lw: 1.8, punta: 7, alpha: a });
        g.texto('fuerza del campo sobre los cationes', 476, 54, { size: 9.5, color: C.acento, weight: 600, alpha: a });
      }

      /* ===== iones ===== */
      for (const io of IONES) {
        const P = posicion(io, t);
        if (!P) continue;
        g.ion(P.x, P.y, { r: ESP[io.s].r, color: COL[io.s], signo: ESP[io.s].r > 5, alpha: P.al });
      }
      // fuerzas en equilibrio sobre un ion de cada población (fase 2)
      const f2 = tramo(t, T1, T1 + 0.4) * (1 - tramo(t, T2 - 0.2, T2 + 0.2));
      if (f2 > 0) {
        for (let s = 0; s < 3; s++) {
          const x = X2A + (X2B - X2A) * ESP[s].c, y = EJE + RT + 22;
          g.flecha(x, y, x + 20, y, { color: C.gas, lw: 1.6, punta: 5, alpha: f2 });
          g.flecha(x, y, x - 20, y, { color: C.acento, lw: 1.6, punta: 5, alpha: f2 });
          g.linea([[x, EJE + RT + 13], [x, y - 3]], { color: COL[s], lw: 1, dash: [2, 2], alpha: f2 });
        }
        g.texto('arrastre = fuerza eléctrica', X2B + 34, EJE + RT + 23, { size: 9.5, color: C.texto2, alpha: f2 });
      }

      /* ===== campo eléctrico a lo largo del túnel ===== */
      const GY = 152, GH = 66, eY = (E) => GY + GH - 12 - E * (GH - 24);
      g.rect(10, GY, 620, GH, { fill: C.panel, stroke: C.linea, r: 4 });
      g.texto('Campo eléctrico E(x)', 18, GY + 10, { size: 9.5, color: C.texto2, weight: 600 });
      const perfil = (x0, xa, xb, x1, s) => [[x0, eY(0.08 * s)], [xa, eY(0.08 * s)], [xb, eY(s)], [x1, eY(s)], [x1, eY(0)]];
      g.linea(perfil(S1[0], X1A, X1B, S1[1], 1), { color: C.acento, lw: 1.6 });
      g.linea(perfil(S2[0], X2A, X2B, S2[1], s2), { color: C.acento, lw: 2 });
      g.linea([[S1[0], eY(0)], [S2[1], eY(0)]], { color: C.tenue, lw: 0.8 });
      if (t >= T1 - 0.2) {
        const a = tramo(t, T1 - 0.2, T1 + 0.3);
        for (let s = 0; s < 3; s++) {
          g.linea([[X2A - 10, eY(ESP[s].c)], [S2[1], eY(ESP[s].c)]], { color: COL[s], lw: 1, dash: [4, 3], alpha: a * 0.9 });
        }
        g.texto('E = v_gas / K', S2[1] + 4, eY(0.9), { size: 9, color: C.texto2, alpha: a });
        g.texto('meseta', (X2B + S2[1]) / 2, eY(s2) - 7, { size: 9, color: C.acento, align: 'center', alpha: a });
      }
      if (t >= cA.r && t < cA.r + cA.d + 0.4) g.texto('rampa: el campo baja', (X2A + X2B) / 2 - 40, GY + 10, { size: 9.5, color: C.calor, weight: 600 });

      /* ===== señal a la salida del TIMS ===== */
      const BY = 226, BH = 118;
      g.rect(10, BY, 300, BH, { fill: C.panel, stroke: C.linea, r: 4 });
      g.texto('Iones que salen del TIMS durante la rampa', 18, BY + 10, { size: 9.5, color: C.texto2, weight: 600 });
      const xa = 22, xb = 298, yb = BY + BH - 22;
      g.linea([[xa, yb], [xb, yb]], { color: C.tenue, lw: 0.8 });
      g.texto(`0 → ${rampa}`, xb, yb + 10, { size: 8.5, color: C.tenue, align: 'right' });
      g.texto('1/K₀ alto  →  1/K₀ bajo', xa, yb + 10, { size: 8.5, color: C.tenue });
      if (t >= CIC[0].r) {
        const prog = clamp((t - cA.r) / cA.d);
        if (t >= cA.r) {
          const pts = [];
          for (let i = 0; i <= 150 * prog; i++) {
            const u = i / 150;
            let v = 0;
            for (let s = 0; s < 3; s++) v += Math.exp(-(((u - (1 - ESP[s].c) / (1 - SMIN)) / 0.035) ** 2)) * (0.9 - s * 0.12);
            pts.push([lerp(xa, xb, u), yb - v * (BH - 46)]);
          }
          g.linea(pts, { color: C.texto2, lw: 1.5 });
          for (let s = 0; s < 3; s++) {
            const u = (1 - ESP[s].c) / (1 - SMIN);
            if (u <= prog) g.circulo(lerp(xa, xb, u), yb - (0.9 - s * 0.12) * (BH - 46) - 8, ESP[s].r * 0.7, { fill: COL[s] });
          }
          if (prog < 1) g.linea([[lerp(xa, xb, prog), BY + 18], [lerp(xa, xb, prog), yb]], { color: C.calor, lw: 1, dash: [3, 2] });
        }
      }

      /* ===== ciclo dual / PASEF ===== */
      const PX = 320, PW = 310;
      g.rect(PX, BY, PW, BH, { fill: C.panel, stroke: C.linea, r: 4 });
      if (!pasef || t < T4) {
        g.texto('Ciclo del TIMS doble (cámara lenta)', PX + 8, BY + 10, { size: 9.5, color: C.texto2, weight: 600 });
        const t0 = 0, t1 = DUR, xs = (tt) => lerp(PX + 74, PX + PW - 10, (tt - t0) / (t1 - t0));
        const filas = [['Sección 1', BY + 40], ['Sección 2', BY + 74]];
        for (const [nom, y] of filas) g.texto(nom, PX + 10, y, { size: 9.5, color: C.texto2 });
        for (const c of CIC) {
          const a0 = Math.max(c.a, 0), a1 = Math.min(c.b, DUR);
          if (a1 > a0) { g.rect(xs(a0) + 1, BY + 32, xs(a1) - xs(a0) - 2, 16, { fill: C.gas, alpha: 0.5, r: 2 }); if (a1 - a0 > 3) g.texto('acumula', (xs(a0) + xs(a1)) / 2, BY + 40.5, { size: 9, color: C.texto, align: 'center' }); }
          if (c.r < DUR) { g.rect(xs(c.r), BY + 66, xs(c.r + c.d) - xs(c.r), 16, { fill: C.acento, alpha: 0.6, r: 2 }); g.texto('rampa', (xs(c.r) + xs(c.r + c.d)) / 2, BY + 74.5, { size: 9, color: '#fff', align: 'center', weight: 600 }); }
          if (c.b > 0 && c.b < DUR) g.flecha(xs(c.b), BY + 50, xs(c.b) + 6, BY + 64, { color: C.texto2, lw: 1, punta: 4 });
        }
        g.linea([[xs(t), BY + 26], [xs(t), BY + 88]], { color: C.calor, lw: 1.4 });
        g.texto('la sección 1 acumula mientras la 2 analiza', PX + PW / 2, BY + BH - 12, { size: 9, color: C.tenue, align: 'center' });
      } else {
        g.texto('PASEF: precursores aislados en una rampa', PX + 8, BY + 10, { size: 9.5, color: C.texto2, weight: 600 });
        const xa2 = PX + 30, xb2 = PX + PW - 12, ya = BY + BH - 22, yt = BY + 40;
        g.linea([[xa2, ya], [xb2, ya]], { color: C.tenue, lw: 0.8 }); g.linea([[xa2, ya], [xa2, yt]], { color: C.tenue, lw: 0.8 });
        g.texto('m/z', xa2 - 4, yt + 4, { size: 8.5, color: C.tenue, align: 'right' });
        g.texto(`tiempo de rampa (1/K₀ ↓) · ${rampa}`, xb2, ya + 10, { size: 8.5, color: C.tenue, align: 'right' });
        const prog = clamp((t - cA.r) / cA.d);
        const Rp = azar(8);
        for (let i = 0; i < 10; i++) {
          const u = 0.06 + i * 0.094, m = clamp(0.85 - u * 0.75 + (Rp() - 0.5) * 0.25, 0.08, 0.95);
          const x = lerp(xa2, xb2, u), y = lerp(ya, yt, m);
          const act = Math.abs(prog - u) < 0.047;
          const hecho = prog > u + 0.047;
          g.rect(x - 9, y - 5, 18, 10, { fill: act ? C.calor : hecho ? C.ok : C.rejilla, stroke: act ? C.calor : C.linea, lw: 1, r: 2, alpha: act ? 0.9 : 0.8 });
        }
        if (prog > 0 && prog < 1) g.linea([[lerp(xa2, xb2, prog), yt], [lerp(xa2, xb2, prog), ya]], { color: C.calor, lw: 1, dash: [3, 2] });
        g.leyenda([[C.calor, 'aislado ahora'], [C.ok, 'ya fragmentado'], [C.rejilla, 'en espera']], PX + 14, BY + 26, { size: 9 });
      }

      g.leyenda(ESP.map((e, s) => [COL[s], e.nom]), 14, 354, { size: 9.5 });
      void suave;
    },
  };
}
