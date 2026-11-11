// FT-ICR: atrapamiento, excitación por barrido de RF, corriente imagen, transitorio y transformada de Fourier.
// Corte de la celda visto a lo largo del campo (B hacia dentro del dibujo: los cationes giran en sentido antihorario) y, abajo, vista
// lateral con los electrodos de atrapamiento. Las frecuencias son las reales, f = zeB/(2πm) (≈ 1,535611·10⁷·B/(m/z) Hz), pero el giro
// se dibuja muchísimo más lento y el transitorio es un esquema con pocas oscilaciones. El radio final tras la excitación es el mismo
// para todas las m/z, como en una excitación de amplitud constante. Se dibuja la detección clásica a la frecuencia ciclotrónica (1ω).
// Todo es función de t; al final del ciclo los iones se expulsan y entra un nuevo paquete.
// Parámetros: p.B (T, 7) · p.masas ([400, 500, 800]) · p.celda (nombre, 'Celda ICR') · p.T (s de transitorio para el ejemplo de R, 1).
import { tramo, suave, lerp, azar } from '../dibujo.js';
import { num, panelSenal, gauss } from './util-analizadores.js';

export default function crear(p = {}) {
  const B = p.B || 7;
  const masas = (p.masas || [400, 500, 800]).slice(0, 3).sort((a, b) => a - b);
  const celda = p.celda || 'ICR';
  const Tej = p.T || 1;
  const f = masas.map((m) => (1.535611e7 * B) / m);          // Hz (z = 1)
  const f500 = (1.535611e7 * B) / 500;
  const Rej = (1.274e7 * B * Tej) / 500;
  const redondeo = (x) => { const e = Math.pow(10, Math.floor(Math.log10(x)) - 2); return Math.round(x / e) * e; };

  const CX = 160, CY = 152, RC = 84, RF = 56;                 // celda, radio de las placas y radio final de las órbitas
  const dur = 20, TE0 = 4.4, TE1 = 8.8, TD = 9.2, TF = 14.2;
  const FR0 = 320e3, FR1 = 100e3;                              // barrido de excitación (Hz)
  const fRF = (t) => lerp(FR0, FR1, tramo(t, TE0, TE1));
  const DF = 16e3;                                             // anchura de la resonancia en el barrido (esquema)
  const kExc = (i, t) => suave(tramo((FR0 - fRF(t)) - (FR0 - f[i] - DF), 0, 2 * DF));
  const omega = f.map((x) => (2 * Math.PI * x) / 150e3);       // rad/s de animación (150 kHz → 1 vuelta/s)
  const coher = (t) => (t < TD ? 1 : Math.exp((-1.5 * (t - TD)) / (TF - TD)));

  const R = azar(21);
  const N = 7;
  const ion = masas.map(() => Array.from({ length: N }, () => ({
    cx: (R() - 0.5) * 18, cy: (R() - 0.5) * 18, rho: 4 + R() * 7, ph: R() * 6.283, dph: (R() - 0.5) * 2.4, az: R() * 6.283, fz: 0.9 + R() * 0.5,
  })));
  const fase0 = [0.4, 2.6, 4.6];                               // fase de cada paquete al acabar la excitación

  // transitorio esquemático: nº de oscilaciones en la ventana ∝ f
  const nCic = f.map((x) => x / 20e3);
  const amp = [0.3, 0.38, 0.32];
  const transit = (u) => amp.reduce((s, a, i) => s + a * Math.cos(2 * Math.PI * nCic[i] * u + fase0[i]), 0) * Math.exp(-1.5 * u);

  return {
    titulo: 'FT-ICR: del giro de los iones al espectro',
    dur,
    fases: [
      { t: 0, texto: `En la celda ${celda}, dentro del imán de ${num(B)} T, los iones quedan atrapados: el campo magnético los hace girar en el plano (confinamiento radial) y los electrodos de atrapamiento les impiden escapar a lo largo del eje.` },
      { t: 2.4, texto: `Al principio cada ion gira en una órbita pequeña y con fase al azar, así que no hay señal neta. La frecuencia solo depende de m/z y del campo: f = zeB/(2πm). A ${num(B)} T, m/z 500 gira a unos ${num(f500 / 1e3, 0)} kHz.` },
      { t: TE0 - 0.2, texto: 'Un barrido de radiofrecuencia en las placas de excitación recorre las frecuencias. Cuando coincide con la de una m/z, esos iones absorben energía y pasan juntos, en fase, a una órbita amplia.' },
      { t: TD, texto: 'Cada paquete en fase induce en las placas de detección una corriente imagen a su propia frecuencia. La señal registrada, el transitorio, es la suma de todas y se amortigua a medida que los paquetes pierden la coherencia.' },
      { t: TF, texto: `La transformada de Fourier separa las frecuencias y cada una da una m/z. Cuanto más dura el transitorio, más estrechos son los picos: R ≈ 1,274·10⁷·zBT/m. Con ${num(Tej)} s, m/z 500 a ${num(B)} T da R ≈ ${num(redondeo(Rej))}.` },
    ],
    dibujar(g, t) {
      const C = g.C;
      const fin = 1 - tramo(t, dur - 0.6, dur);                // expulsión al final del ciclo
      const ini = tramo(t, 0, 0.6);

      /* --- celda: corte transversal --- */
      g.circulo(CX, CY, RC + 14, { fill: C.vacio, stroke: C.linea, lw: 1.2 });
      const exc = t > TE0 && t < TE1 + 0.2;
      const placa = (a0, a1, color, alpha = 1) => {
        const pts = [];
        for (let k = 0; k <= 20; k++) { const a = lerp(a0, a1, k / 20); pts.push([CX + Math.cos(a) * RC, CY - Math.sin(a) * RC]); }
        g.linea(pts, { color, lw: 7, alpha, cap: 'butt' });
      };
      const d = Math.PI / 180;
      // señal inducida instantánea (∝ coordenada vertical media de los paquetes)
      let sy = 0;
      masas.forEach((_, i) => { const k = kExc(i, t) * coher(t); sy += k * Math.sin(omega[i] * t + fase0[i]); });
      const kDet = Math.min(1, Math.abs(sy) / 1.5);
      placa(-40 * d, 40 * d, exc ? C.foton : C.metal);
      placa(140 * d, 220 * d, exc ? C.foton : C.metal);
      placa(50 * d, 130 * d, t > TD ? (sy > 0 ? C.e : C.metal) : C.metal, t > TD && sy > 0 ? 0.5 + 0.5 * kDet : 1);
      placa(230 * d, 310 * d, t > TD ? (sy < 0 ? C.e : C.metal) : C.metal, t > TD && sy < 0 ? 0.5 + 0.5 * kDet : 1);
      g.rotulo('Excitación', CX - RC - 8, CY - 80, { size: 10.5, color: exc ? C.foton : C.texto2 });
      g.rotulo('Excitación', CX + RC + 8, CY - 80, { size: 10.5, color: exc ? C.foton : C.texto2 });
      g.rotulo('Detección', CX, CY - RC - 22, { size: 10.5, color: t > TD ? C.e : C.texto2 });
      g.rotulo('Detección', CX, CY + RC + 22, { size: 10.5, color: t > TD ? C.e : C.texto2 });
      // campo magnético hacia dentro del dibujo
      g.circulo(26, 24, 8, { stroke: C.acento, lw: 1.4 });
      g.linea([[21, 19], [31, 29]], { color: C.acento, lw: 1.4 }); g.linea([[31, 19], [21, 29]], { color: C.acento, lw: 1.4 });
      g.texto(`B = ${num(B)} T`, 40, 24.5, { size: 11, color: C.acento, weight: 700 });
      g.texto(`Celda ${celda}`, 40, 40, { size: 10, color: C.tenue, weight: 600 });
      // ondas de RF entre las placas de excitación
      if (exc) {
        const a = tramo(t, TE0, TE0 + 0.3) * (1 - tramo(t, TE1, TE1 + 0.2));
        for (const sg of [-1, 1]) g.foton(CX + sg * (RC - 8), CY + 30, CX + sg * (RC - 28), CY + 30, { amp: 3, long: 6 + 8 * tramo(t, TE0, TE1), color: C.foton, alpha: a, lw: 1.4 });
        g.texto(`RF: ${num(fRF(t) / 1e3, 0)} kHz`, 16, CY + RC + 12, { size: 11, color: C.foton, weight: 700, alpha: a });
      }

      /* --- iones --- */
      masas.forEach((m, i) => {
        const col = C.m[i % C.m.length];
        const k = kExc(i, t), co = coher(t);
        const Rk = RF * k;
        if (k > 0.98 && t > TD) g.circulo(CX, CY, RF, { stroke: col, lw: 0.8, alpha: 0.25 * fin });
        for (const q of ion[i]) {
          const th = omega[i] * t;
          // órbita propia pequeña (fase al azar) + desplazamiento coherente común a todo el paquete
          const disp = q.dph * (1 - co);            // pérdida de coherencia: las fases se dispersan
          const x = CX + q.cx + q.rho * Math.cos(th + q.ph) + Rk * Math.cos(th + fase0[i] + disp);
          const y = CY + q.cy - q.rho * Math.sin(th + q.ph) - Rk * Math.sin(th + fase0[i] + disp);
          g.ion(x, y, { r: 4.2, color: col, signo: false, alpha: fin * ini });
        }
      });

      /* --- vista lateral: atrapamiento axial --- */
      const vy = 322;
      g.rect(46, vy - 20, 228, 40, { fill: C.vacio, stroke: C.linea, lw: 1.1, r: 4 });
      g.electrodo(34, vy - 22, 7, 44, { color: C.ion });
      g.electrodo(279, vy - 22, 7, 44, { color: C.ion });
      g.texto('+', 37.5, vy - 30, { size: 12, color: C.ion, weight: 800, align: 'center' });
      g.texto('+', 282.5, vy - 30, { size: 12, color: C.ion, weight: 800, align: 'center' });
      g.flecha(120, vy - 30, 200, vy - 30, { color: C.acento, lw: 1.3, punta: 6 });
      g.texto('B', 208, vy - 30, { size: 11, color: C.acento, weight: 700 });
      g.texto('Electrodos de atrapamiento', 160, vy + 31, { size: 10, color: C.texto2, align: 'center', weight: 600 });
      masas.forEach((m, i) => ion[i].forEach((q, j) => {
        if (j > 3) return;
        const x = 160 + 80 * Math.sin(t * 1.7 * q.fz + q.az), y = vy + (j - 1.5) * 7 + (i - 1) * 2;
        g.ion(x, y, { r: 3, color: C.m[i], signo: false, alpha: fin * ini });
      }));

      /* --- transitorio --- */
      const xr = 330, wr = 302;
      const uT = tramo(t, TD, TF);
      const P = panelSenal(g, xr, 14, wr, 150, { titulo: 'Transitorio (corriente imagen)', nota: 'tiempo →', picos: [], u1: 0 });
      const ym = (P.yb + P.yt) / 2, hA = (P.yb - P.yt) / 2;
      g.linea([[P.X(0), ym], [P.X(1), ym]], { color: C.rejilla, lw: 1 });
      if (uT > 0) {
        const pts = [];
        for (let k = 0; k <= 400; k++) { const u = (k / 400) * uT; pts.push([P.X(u), ym - transit(u) * hA * 0.95]); }
        g.linea(pts, { color: C.e, lw: 1.2, alpha: fin });
      }
      // ventana del transitorio usada en la FT (fase final)
      const wv = t < TF ? 1 : lerp(0.3, 1, suave(tramo(t, TF + 2.2, TF + 4)));
      if (t > TF) {
        g.rect(P.X(0), P.yt - 2, P.X(wv) - P.X(0), P.yb - P.yt + 2, { fill: C.acento, alpha: 0.1 * fin });
        g.texto(wv < 0.95 ? 'transitorio corto' : 'transitorio completo', P.X(wv) - 4, P.yt + 6, { size: 10, color: C.acento, weight: 600, align: 'right', alpha: fin });
      }
      // flecha de la corriente imagen desde la celda al panel
      g.flecha(CX + 70, CY - RC - 22, xr - 6, CY - RC - 22, { color: C.e, lw: 1.2, punta: 6, alpha: t > TD ? 1 : 0.35 });

      /* --- espectro (transformada de Fourier) --- */
      const mlo = 300, mhi = 900;
      const uM = (m) => (m - mlo) / (mhi - mlo);
      const ticks = [300, 500, 700, 900].map((m) => [uM(m), String(m)]);
      const kS = tramo(t, TF, TF + 0.8);
      const picos = masas.map((m, i) => ({ u: uM(m), s: (0.004 + 0.006 * ((m / 500) ** 2)) / wv, a: 0.75 * Math.min(1, wv * 1.6), color: C.m[i % C.m.length] }));
      g.flecha(xr + wr / 2, 166, xr + wr / 2, 184, { color: C.acento, lw: 1.4, punta: 6, alpha: kS });
      g.texto('transformada de Fourier', xr + wr / 2 + 10, 175, { size: 10, color: C.acento, weight: 600, alpha: kS });
      const S = panelSenal(g, xr, 190, wr, 156, { titulo: 'Espectro', nota: 'm/z', ticks, picos, u1: kS * fin, alpha: fin });
      if (kS > 0.9) masas.forEach((m, i) => g.texto(`${num(f[i] / 1e3, 0)} kHz`, S.X(uM(m)), S.Y(picos[i].a) - 9, { size: 10, color: C.m[i % C.m.length], weight: 700, align: 'center', alpha: fin }));
    },
  };
}
