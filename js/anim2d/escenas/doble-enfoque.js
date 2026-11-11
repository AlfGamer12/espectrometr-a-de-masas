// Doble enfoque en geometría Nier–Johnson inversa (BE): imán y después sector eléctrico, con las dos deflexiones en el mismo sentido.
// Las trayectorias son rayos de óptica de primer orden (matrices de transferencia de un imán homogéneo de entrada normal y de un
// sector eléctrico cilíndrico). Con el imán de 65° del modelo del sitio, un sector eléctrico de 90° y las distancias elegidas aquí,
// la dispersión en energía del imán y la del sector eléctrico se anulan en la rendija de salida, y también el término angular:
// (x|δE) = (x|α) = 0, mientras que la dispersión en masa (x|δm) se conserva. Las desviaciones se dibujan muy exageradas.
// Después, el ejemplo de m/z 28 (CO, N₂, C₂H₄): anchura de rendijas ↔ resolución y transmisión.
// Parámetros: p.U (kV, 5, solo para el texto) · p.R (resoluciones [ancha, estrecha], [1000, 10000]).
import { tramo, suave, lerp } from '../dibujo.js';
import { num, panelSenal, leyendaTrazos } from './_util-analizadores.js';

const D2R = Math.PI / 180;
// geometría (cm, didáctica salvo el imán: r = 35 cm y 65°, como el modelo del Thermo DFS)
const L1 = 60, RM = 35, AM = 65 * D2R, L2 = 52, RE = 40, AE = 90 * D2R, K2 = Math.SQRT2;
const mul = (A, B) => A.map((r) => B[0].map((_, j) => r.reduce((s, a, k) => s + a * B[k][j], 0)));
const deriva = (L) => [[1, L, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]];
// estado (x, α, δE, δm); en el imán δp = (δE + δm)/2; el sector eléctrico solo depende de la energía
const iman = (f) => { const c = Math.cos(f), s = Math.sin(f); return [[c, RM * s, (RM * (1 - c)) / 2, (RM * (1 - c)) / 2], [-s / RM, c, s / 2, s / 2], [0, 0, 1, 0], [0, 0, 0, 1]]; };
const esa = (f) => { const c = Math.cos(K2 * f), s = Math.sin(K2 * f); return [[c, (RE / K2) * s, (RE / 2) * (1 - c), 0], [(-K2 / RE) * s, c, s / K2, 0], [0, 0, 1, 0], [0, 0, 0, 1]]; };

/** Distancia ESA → rendija que anula (x|α) y comprobación de (x|δE). */
function diseño() {
  const M = mul(esa(AE), mul(deriva(L2), mul(iman(AM), deriva(L1))));
  const L3 = -M[0][1] / M[1][1];
  const T = mul(deriva(L3), M);
  return { L3, xm: T[0][3], xx: T[0][0], xe: T[0][2] };
}
const DIS = diseño();
const L3 = DIS.L3;

/** Muestras de la trayectoria central con su matriz acumulada: { p:[x,y], h: rumbo (rad), M }. */
function muestras() {
  const out = [];
  let M = [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]], p = [0, 0], h = 0;
  const push = () => out.push({ p: p.slice(), h, M });
  const recto = (L, n) => { const p0 = p.slice(), M0 = M; for (let k = 1; k <= n; k++) { const s = (L * k) / n; p = [p0[0] + Math.cos(h) * s, p0[1] + Math.sin(h) * s]; M = mul(deriva(s), M0); push(); } };
  const arco = (R, A, mat, n) => {
    const c = [p[0] - Math.sin(h) * R, p[1] + Math.cos(h) * R], h0 = h, M0 = M;
    for (let k = 1; k <= n; k++) { const a = (A * k) / n; h = h0 + a; p = [c[0] + Math.sin(h) * R, c[1] - Math.cos(h) * R]; M = mul(mat(a), M0); push(); }
    return c;
  };
  push();
  recto(L1, 20);
  const cM = arco(RM, AM, iman, 30); const iM = out.length - 1;
  recto(L2, 18);
  const iE0 = out.length - 1;
  const cE = arco(RE, AE, esa, 36); const iE = out.length - 1;
  recto(L3, 12);
  return { out, cM, cE, iM, iE0, iE };
}
const TR = muestras();

export default function crear(p = {}) {
  const U = p.U || 5;
  const [RA, RB] = p.R || [1000, 10000];
  const SC = 2.1, OX = 40, OY = 318;
  const X = (q) => [OX + SC * q[0], OY - SC * q[1]];
  const S = TR.out;
  // longitud acumulada (cm) de cada muestra
  const sAc = [0];
  for (let i = 1; i < S.length; i++) sAc.push(sAc[i - 1] + Math.hypot(S[i].p[0] - S[i - 1].p[0], S[i].p[1] - S[i - 1].p[1]));
  const LT = sAc[sAc.length - 1];
  /** Puntos en pantalla de un rayo (x0, α, δE) hasta la longitud sMax; la desviación se dibuja a escala real del esquema. */
  function rayo(v, sMax = LT) {
    const pts = [];
    for (let i = 0; i < S.length; i++) {
      if (sAc[i] > sMax) { pts.push(punto(v, i - 1, (sMax - sAc[i - 1]) / (sAc[i] - sAc[i - 1]), i)); break; }
      pts.push(punto(v, i));
    }
    return pts;
  }
  function punto(v, i, k = 0, j = i) {
    const A = S[i], B = S[j];
    const xa = A.M[0][0] * v[0] + A.M[0][1] * v[1] + A.M[0][2] * v[2], xb = B.M[0][0] * v[0] + B.M[0][1] * v[1] + B.M[0][2] * v[2];
    const x = lerp(xa, xb, k), h = lerp(A.h, B.h, k), c = [lerp(A.p[0], B.p[0], k), lerp(A.p[1], B.p[1], k)];
    // x > 0 hacia fuera de la curva (a la derecha del rumbo)
    return X([c[0] + Math.sin(h) * x, c[1] - Math.cos(h) * x]);
  }
  const DE = 0.12, DA = 0.05;                     // dispersiones exageradas para el dibujo
  const RAYOS_E = [[0, 0, -DE], [0, 0, 0], [0, 0, DE]];
  const RAYOS_A = [[0, -DA, 0], [0, DA, 0]];
  const ESTILO = [[2, 3], null, [7, 4]];

  // ejemplo de m/z 28 (masas exactas y abundancias ilustrativas del simulador del sitio)
  const DOB = [[27.9949, 35, 'CO⁺'], [28.0061, 100, 'N₂⁺'], [28.0313, 18, 'C₂H₄⁺']];
  const MLO = 27.975, MHI = 28.05;
  const T0 = 9, TA = [9.6, 13.6], TB = [14.6, 18.6], dur = 20;
  // Imagen de perfil gaussiano (σ) barrida sobre una rendija de semianchura σ: el pico resultante tiene FWHM ≈ 2,78σ = m/R
  // (la misma convención que el simulador del sitio, FWHM = m/R).
  const semi = (R) => 28 / R / 2.78;
  const erf = (x) => { const s = Math.sign(x); x = Math.abs(x); const k = 1 / (1 + 0.3275911 * x); return s * (1 - (((((1.061405429 * k - 1.453152027) * k) + 1.421413741) * k - 0.284496736) * k + 0.254829592) * k * Math.exp(-x * x)); };
  const Phi = (z) => 0.5 * (1 + erf(z / Math.SQRT2));
  const senal = (ms, R) => { const w = semi(R); return DOB.reduce((acc, [m, a]) => acc + a * (Phi((w - (m - ms)) / w) - Phi((-w - (m - ms)) / w)), 0) / (100 * 0.6827); };
  const maxCache = {};
  const maxSenal = (R) => maxCache[R] || (maxCache[R] = Math.max(...Array.from({ length: 301 }, (_, k) => senal(lerp(MLO, MHI, k / 300), R))));
  const modo = (t) => (t < TB[0] - 0.5 ? 0 : 1);

  const vel = 75;                                  // cm/s de animación
  return {
    titulo: 'Doble enfoque (geometría BE)',
    dur,
    fases: [
      { t: 0, texto: `Los iones de una misma m/z salen de la fuente con energías algo distintas alrededor de ${num(U)} keV. En el imán, el radio r = √(2mE)/(zeB) crece con la energía: los más energéticos se abren hacia fuera y el haz se dispersa.` },
      { t: 4.2, texto: 'El sector eléctrico selecciona por energía (r = 2E/zeℰ, sin depender de la masa) y su dispersión es igual y opuesta a la del imán. Los iones de igual m/z vuelven a converger en la rendija de salida.' },
      { t: 6.6, texto: 'También convergen los que salieron con direcciones algo distintas: el instrumento enfoca a la vez en dirección y en energía, de ahí el nombre de doble enfoque. Lo que no se compensa es la dispersión en masa.' },
      { t: T0, texto: `A m/z 28 llegan CO⁺, N₂⁺ y C₂H₄⁺, con la misma masa nominal. Con rendijas anchas (R ≈ ${num(RA)}) sus imágenes se solapan en la rendija de salida y el barrido da un único pico.` },
      { t: TB[0] - 0.4, texto: `Con rendijas estrechas (R ≈ ${num(RB)}) cada imagen cruza la rendija por separado y aparecen tres picos. El precio es la transmisión: pasan muchos menos iones y la señal cae.` },
    ],
    dibujar(g, t) {
      const C = g.C;
      const col = C.m[1];
      const k3 = tramo(t, T0 - 0.6, T0);            // paso al ejemplo de m/z 28
      const R = modo(t) ? RB : RA;
      const kRend = t < T0 - 0.6 ? 0.5 : modo(t) ? 0.12 : 1;   // apertura visual de las rendijas

      /* --- imán y sector eléctrico --- */
      const anillo = (c, r0, r1, a0, a1, op) => {
        const pts = [];
        for (let k = 0; k <= 30; k++) { const a = lerp(a0, a1, k / 30); pts.push(X([c[0] + Math.sin(a) * r1, c[1] - Math.cos(a) * r1])); }
        for (let k = 30; k >= 0; k--) { const a = lerp(a0, a1, k / 30); pts.push(X([c[0] + Math.sin(a) * r0, c[1] - Math.cos(a) * r0])); }
        g.linea(pts, { ...op, cerrar: true });
      };
      anillo(TR.cM, RM - 12, RM + 12, 0, AM, { fill: C.acento, alpha: 0.13 });
      anillo(TR.cM, RM - 12, RM + 12, 0, AM, { color: C.acento, lw: 1.1, alpha: 0.5 });
      anillo(TR.cE, RE + 6, RE + 8, AM, AM + AE, { fill: C.metal });
      anillo(TR.cE, RE - 8, RE - 6, AM, AM + AE, { fill: C.metal });
      const [cex, cey] = X(TR.cE);
      const [imx, imy] = X([TR.cM[0] + Math.sin(AM * 0.8) * (RM + 20), TR.cM[1] - Math.cos(AM * 0.8) * (RM + 20)]);
      g.rotulo('Imán', imx + 16, imy + 6, { size: 11, color: C.acento });
      g.rotulo('Sector eléctrico', cex + 6, cey - 2, { size: 11 });
      g.texto('+', ...X([TR.cE[0] + Math.sin(AM + AE / 2) * (RE + 12), TR.cE[1] - Math.cos(AM + AE / 2) * (RE + 12)]), { size: 13, color: C.ion, weight: 800, align: 'center' });
      g.texto('−', ...X([TR.cE[0] + Math.sin(AM + AE / 2) * (RE - 12), TR.cE[1] - Math.cos(AM + AE / 2) * (RE - 12)]), { size: 13, color: C.anion, weight: 800, align: 'center' });
      // fuente, rendijas y detector
      const [sx, sy] = X([0, 0]);
      g.rect(sx - 26, sy - 14, 24, 28, { fill: C.panel, stroke: C.metalOsc, lw: 1.2, r: 4 });
      g.rotulo('Fuente', sx - 12, sy + 26, { size: 11 });
      const rendija = (i, lado) => {
        const q = S[i], [x0, y0] = X(q.p), nx = Math.sin(q.h), ny = Math.cos(q.h);   // normal en pantalla
        const ab = 2 + 6 * kRend;
        for (const sg of [-1, 1]) g.linea([[x0 + nx * sg * ab, y0 + ny * sg * ab], [x0 + nx * sg * (ab + 16), y0 + ny * sg * (ab + 16)]], { color: C.metalOsc, lw: 4, cap: 'butt' });
        return [x0, y0, lado];
      };
      const iEnt = 4;
      rendija(iEnt);
      const [ex, ey] = X(S[iEnt].p);
      g.rotulo('Rendija de entrada', ex + 30, ey - 26, { size: 10.5 });
      const iSal = S.length - 1;
      rendija(iSal);
      const [rx, ry] = X(S[iSal].p);
      g.rotulo('Rendija de salida', rx - 66, ry + 16, { size: 10.5 });
      const hf = S[iSal].h, dx = Math.cos(hf), dy = -Math.sin(hf);
      g.linea([[rx + dx * 16 - dy * 14, ry + dy * 16 + dx * 14], [rx + dx * 16 + dy * 14, ry + dy * 16 - dx * 14]], { color: C.metalOsc, lw: 7, cap: 'butt' });
      g.rotulo('Detector', rx + dx * 16 + 44, ry + dy * 16 - 8, { size: 10.5 });

      /* --- rayos --- */
      const frente = Math.max(0, (t - 0.5) * vel);
      const aR = 1 - 0.55 * k3;
      RAYOS_A.forEach((v) => { if (t > 6.4) g.linea(rayo(v), { color: col, lw: 1, alpha: 0.45 * tramo(t, 6.4, 7.2) * aR }); });
      RAYOS_E.forEach((v, i) => g.linea(rayo(v, frente), { color: col, lw: i === 1 ? 2 : 1.6, dash: ESTILO[i], alpha: 0.85 * aR }));
      // iones que recorren los rayos de energía (v ∝ √E)
      for (let i = 0; i < 3; i++) {
        const v = RAYOS_E[i], vv = vel * Math.sqrt(1 + v[2]);
        for (let k = 0; k < 4; k++) {
          const s = ((t - 0.5) * vv - k * 62);
          if (s < 0 || s > LT) continue;
          if (t > 5.2 && s < (t - 5.2) * vv - 300) continue;
          const pts = rayo(v, s), [x, y] = pts[pts.length - 1];
          g.ion(x, y, { r: 4.4, color: col, signo: false, alpha: aR });
        }
        // corriente continua tras la primera pasada
        if (t > 5.2) for (let k = 0; k < 8; k++) {
          const s = (((t - 5.2) * vv + k * (LT / 8)) % LT);
          const [x, y] = rayo(v, s).pop();
          g.ion(x, y, { r: 3.8, color: col, signo: false, alpha: 0.9 * tramo(t, 5.2, 5.8) * aR });
        }
      }
      // etiquetas de energía entre imán y sector eléctrico
      if (t > 2.4 && k3 < 1) {
        const a = tramo(t, 2.4, 3.0) * (1 - k3);
        const i0 = TR.iE0 - 4;
        const pa = punto(RAYOS_E[2], i0), pb = punto(RAYOS_E[0], i0);
        g.texto('E + ΔE', pa[0] + 10, pa[1] + 6, { size: 10.5, color: col, weight: 700, alpha: a });
        g.texto('E − ΔE', pb[0] - 10, pb[1] - 6, { size: 10.5, color: col, weight: 700, alpha: a, align: 'right' });
      }

      /* --- panel derecho: principio (fases 1–3) --- */
      const xr = 336, wr = 296;
      if (k3 < 1) {
        const a = 1 - k3;
        g.rect(xr, 18, wr, 128, { fill: C.panel, stroke: C.linea, r: 5, alpha: a });
        g.texto('Dispersión en energía', xr + 12, 34, { size: 12.5, color: C.texto, weight: 600, alpha: a });
        g.texto('Imán:  r = √(2mE) / zeB', xr + 12, 58, { size: 12, color: C.texto2, alpha: a });
        g.texto('Sector eléctrico:  r = 2E / zeℰ', xr + 12, 78, { size: 12, color: C.texto2, alpha: a });
        g.texto('Se compensan en la rendija de salida', xr + 12, 100, { size: 12, color: C.ok, weight: 600, alpha: a * tramo(t, 4.2, 4.8) });
        leyendaTrazos(g, [[col, 'E − ΔE', [2, 3]], [col, 'E'], [col, 'E + ΔE', [7, 4]]], xr + 12, 126, { size: 10.5 });
        g.rect(xr, 160, wr, 186, { fill: C.panel, stroke: C.linea, r: 5, alpha: a });
        g.texto('Una sola m/z: se enfocan', xr + 12, 178, { size: 12.5, color: C.texto, weight: 600, alpha: a });
        g.texto('• energías distintas (ΔE)', xr + 12, 202, { size: 12, color: C.texto2, alpha: a * tramo(t, 4.2, 4.8) });
        g.texto('• direcciones distintas (Δα)', xr + 12, 222, { size: 12, color: C.texto2, alpha: a * tramo(t, 6.6, 7.2) });
        g.texto('Distinta m/z → distinto punto', xr + 12, 252, { size: 12, color: C.texto2, alpha: a * tramo(t, 7.2, 7.8) });
        g.texto('de la rendija: así se separan', xr + 12, 270, { size: 12, color: C.texto2, alpha: a * tramo(t, 7.2, 7.8) });
        g.texto('las masas al barrer el campo.', xr + 12, 288, { size: 12, color: C.texto2, alpha: a * tramo(t, 7.2, 7.8) });
      }

      /* --- panel derecho: ejemplo de m/z 28 --- */
      if (k3 > 0) {
        const a = k3;
        const seg = modo(t) ? TB : TA;
        const kb = tramo(t, seg[0], seg[1]);
        const ms = lerp(MLO, MHI, kb);
        const w = semi(R);
        // plano de la rendija (ampliado): imágenes de las tres especies y mordazas
        const y0 = 18, h0 = 128, cx = xr + wr / 2, pxDa = (wr - 30) / (MHI - MLO);
        g.rect(xr, y0, wr, h0, { fill: C.panel, stroke: C.linea, r: 5, alpha: a });
        g.texto('Rendija de salida (ampliada)', xr + 10, y0 + 12, { size: 11, color: C.texto2, weight: 600, alpha: a });
        g.texto(`R ≈ ${num(R)}`, xr + wr - 10, y0 + 12, { size: 11, color: C.acento, weight: 700, align: 'right', alpha: a });
        g.ctx.save(); g.ctx.beginPath(); g.ctx.rect(xr + 6, y0 + 20, wr - 12, h0 - 26); g.ctx.clip();
        DOB.forEach(([m, ab, nom], i) => {
          // imagen de perfil gaussiano: núcleo de ±σ y halo de ±2σ
          const c = cx + (ms - m) * pxDa, ww = Math.max(1.5, w * pxDa), k = a * (0.3 + 0.6 * (ab / 100));
          g.rect(c - 2 * ww, y0 + 40, 4 * ww, 62, { fill: C.m[i], alpha: 0.35 * k });
          g.rect(c - ww, y0 + 40, 2 * ww, 62, { fill: C.m[i], alpha: 0.75 * k });
          if (c > xr + 24 && c < xr + wr - 24) g.texto(nom, c, y0 + 32, { size: 10, color: C.m[i], weight: 700, align: 'center', alpha: a });
        });
        g.ctx.restore();
        const sw = Math.max(2, 2 * w * pxDa);
        g.rect(xr + 6, y0 + 36, cx - sw / 2 - xr - 6, 70, { fill: C.metalOsc, alpha: 0.8 * a });
        g.rect(cx + sw / 2, y0 + 36, xr + wr - 6 - cx - sw / 2, 70, { fill: C.metalOsc, alpha: 0.8 * a });
        g.texto('las imágenes se desplazan al barrer B', cx, y0 + 117, { size: 10, color: C.tenue, align: 'center', alpha: a });
        // espectro
        const ticks = [[(27.99 - MLO) / (MHI - MLO), '27,99'], [(28.01 - MLO) / (MHI - MLO), '28,01'], [(28.03 - MLO) / (MHI - MLO), '28,03']];
        const P = panelSenal(g, xr, 160, wr, 186, { titulo: 'Señal al barrer el campo', nota: modo(t) ? 'escala muy ampliada' : 'm/z', ticks, picos: [], u1: 0, alpha: a });
        const tr = [];
        const smax = maxSenal(R), alto = (m) => (0.92 * senal(m, R)) / smax;
        for (let k = 0; k <= 300; k++) { const uu = (k / 300) * kb; const m = lerp(MLO, MHI, uu); tr.push([P.X(uu), P.Y(alto(m))]); }
        if (kb > 0) {
          g.linea([[P.X(0), P.yb], ...tr, [tr[tr.length - 1][0], P.yb]], { fill: C.acento, alpha: 0.12 * a, cerrar: true });
          g.linea(tr, { color: C.texto2, lw: 1.4, alpha: a });
        }
        if (kb > 0 && kb < 1) g.linea([[P.X(kb), P.yt - 4], [P.X(kb), P.yb]], { color: C.acento, lw: 1, dash: [3, 3], alpha: a });
        if (modo(t) && kb > 0) DOB.forEach(([m, , nom], i) => { const uu = (m - MLO) / (MHI - MLO); if (uu < kb) g.texto(nom, P.X(uu), P.Y(alto(m)) - 9, { size: 10.5, color: C.m[i], weight: 700, align: 'center', alpha: a }); });
        if (!modo(t) && kb > 0.75) g.texto('un solo pico', P.X((28.006 - MLO) / (MHI - MLO)), P.Y(0.92) - 9, { size: 10.5, color: C.texto2, weight: 600, align: 'center', alpha: a });
      }
    },
  };
}
