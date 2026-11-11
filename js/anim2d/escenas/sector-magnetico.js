// Sector magnético: los iones de igual energía cinética describen arcos de radio r = mv/(zeB) = √(2mV/ze)/B.
// Esquema de un sector simple con la geometría del modelo del sitio (imán de 65°, radio central = r de p.r): fuente → rendija de
// entrada → imán → rendija → detector. Las trayectorias se calculan con el radio real de cada m/z para el campo de cada instante
// (r_i = r·√(m_i/m_sel)); los iones que no siguen el radio central chocan con el tubo o con la rendija. Se barre B y las masas
// pasan una tras otra. Iones del PFK (CF₃⁺, C₂F₄⁺, C₃F₅⁺) como ejemplo; las intensidades son ilustrativas.
// Todo es función de t; las velocidades se eligen para que el bucle cierre sin saltos.
// Parámetros: p.U (kV, 5; tensión de aceleración, V en los textos) · p.r (m, 0.35) · p.angulo (grados, 65) · p.iones ([[m, 'nombre', intensidad], …]).
import { tramo, suave, lerp } from '../dibujo.js';
import { FIS, num, panelSenal, destello } from './_util-analizadores.js';

export default function crear(p = {}) {
  const U = p.U || 5;                  // kV
  const rM = p.r || 0.35;              // m
  const ANG = ((p.angulo || 65) * Math.PI) / 180;
  const IONES = p.iones || [[68.9952, 'CF₃⁺', 1], [99.9936, 'C₂F₄⁺', 0.55], [130.992, 'C₃F₅⁺', 0.75]];
  const campo = (m) => Math.sqrt((2 * m * FIS.u * U * 1e3) / FIS.e) / rM;   // T, para z = 1

  // geometría (px)
  const SX = 34, SY = 296, XM = 120, R = 185, CX = XM, CY = SY - R, W = 22, HS = 5, LS = 80;
  const PE = [CX + R * Math.sin(ANG), CY + R * Math.cos(ANG)];            // salida del imán (trayectoria central)
  const HE = [Math.cos(ANG), -Math.sin(ANG)];                              // rumbo tras el imán
  const NE = [-HE[1], HE[0]];                                              // normal (hacia fuera de la curva)
  const RS = [PE[0] + HE[0] * LS, PE[1] + HE[1] * LS];                     // rendija
  const DET = [RS[0] + HE[0] * 26, RS[1] + HE[1] * 26];

  /** Trayectoria de un ion con radio relativo ρ = r/R (y desplazamiento lateral inicial dy). Devuelve puntos, longitud y destino. */
  function trayectoria(rho, dy = 0) {
    const r = R * rho, pts = [[SX, SY + dy], [XM, SY + dy]];
    const cx = XM, cy = SY + dy - r;
    let fin = 'pared', psi = 0;
    const paso = 0.6 / r;
    for (psi = paso; psi < Math.PI; psi += paso) {
      const x = cx + r * Math.sin(psi), y = cy + r * Math.cos(psi);
      const th = Math.atan2(x - CX, y - CY), d = Math.hypot(x - CX, y - CY);
      if (Math.abs(d - R) > W) { pts.push([x, y]); return { pts, fin }; }
      if (th >= ANG) break;
      pts.push([x, y]);
    }
    // tramo recto hasta el plano de la rendija
    const [x0, y0] = pts[pts.length - 1], h = [Math.cos(psi), -Math.sin(psi)];
    for (let s = 1; s < 260; s += 1) {
      const x = x0 + h[0] * s, y = y0 + h[1] * s;
      const rel = [x - PE[0], y - PE[1]], a = rel[0] * HE[0] + rel[1] * HE[1], off = rel[0] * NE[0] + rel[1] * NE[1];
      if (Math.abs(off) > W) { pts.push([x, y]); return { pts, fin: 'pared' }; }
      if (a >= LS) {
        pts.push([x, y]);
        if (Math.abs(off) <= HS) { pts.push([x + h[0] * 26, y + h[1] * 26]); return { pts, fin: 'detector', off }; }
        return { pts, fin: 'rendija', off };
      }
      if (s % 6 === 0) pts.push([x, y]);
    }
    return { pts, fin };
  }
  const largo = (pts) => { let L = 0; for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); return L; };
  const enLinea = (pts, s) => {
    for (let i = 1; i < pts.length; i++) {
      const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
      if (s <= l) return [lerp(pts[i - 1][0], pts[i][0], s / l), lerp(pts[i - 1][1], pts[i][1], s / l)];
      s -= l;
    }
    return pts[pts.length - 1];
  };
  // desplazamiento en la rendija en función de ρ (tabla para el espectro)
  const TAB = [];
  for (let k = 0; k <= 240; k++) { const rho = 0.85 + (0.3 * k) / 240; const tr = trayectoria(rho); TAB.push(tr.off != null ? tr.off : (rho < 1 ? 99 : -99)); }
  const offDe = (rho) => { const u = ((rho - 0.85) / 0.3) * 240; if (u < 0 || u > 240) return 99; const i = Math.min(239, Math.floor(u)); return lerp(TAB[i], TAB[i + 1], u - i); };
  // transmisión: haz de semianchura HB sobre la rendija de semianchura HS
  const HB = 3.5;
  const trans = (off) => Math.max(0, Math.min(off + HB, HS) - Math.max(off - HB, -HS)) / (2 * HB);

  // barrido: m/z seleccionada en función de t
  const dur = 20, M0 = 100, MA = 55, MB = 145, TS0 = 8, TS1 = 16;
  function mSel(t) {
    if (t < 7) return M0;
    if (t < TS0) return lerp(M0, MA, suave(tramo(t, 7, TS0)));
    if (t < TS1) return lerp(MA, MB, tramo(t, TS0, TS1));
    if (t < 19) return MB;
    return lerp(MB, M0, suave(tramo(t, 19, 20)));
  }
  const senal = (ms) => IONES.reduce((s, [m, , a]) => s + a * trans(offDe(Math.sqrt(m / ms))), 0);
  // velocidades: ∝ 1/√m y múltiplos de la separación entre iones para que el bucle cierre
  const SEP = 38, LMAX = 16 * SEP;
  const VEL = IONES.map(([m]) => (Math.round((120 * Math.sqrt(100 / m) * dur) / SEP) * SEP) / dur);

  const B100 = campo(M0);
  return {
    titulo: 'Sector magnético',
    dur,
    fases: [
      { t: 0, texto: `Los iones salen de la fuente acelerados por ${num(U)} kV: todos llevan la misma energía cinética zeV. En el imán, el campo B, perpendicular al plano del dibujo, los obliga a describir arcos de circunferencia.` },
      { t: 3.5, texto: 'El radio depende de la m/z: r = mv/(zeB) = √(2mV/ze)/B. Los iones ligeros se curvan más y los pesados menos; solo la m/z cuyo radio coincide con el central atraviesa la rendija y llega al detector.' },
      { t: 7.2, texto: 'Para registrar el espectro se barre el campo. Al aumentar B, la m/z que sigue el radio central es cada vez mayor (m/z = B²r²e/2V) y las masas llegan una tras otra al detector.' },
      { t: TS1 + 0.2, texto: `La culata laminada del imán reduce la histéresis y las corrientes inducidas, de modo que el campo se barre deprisa y salta entre masas de forma reproducible. Con r = ${num(rM * 1000)} mm y ${num(U)} kV, m/z 100 necesita unos ${num(B100, 2)} T.` },
    ],
    dibujar(g, t) {
      const C = g.C;
      const ms = mSel(t);
      const B = campo(ms);

      /* --- imán (piezas polares) y tubo --- */
      const sec = [];
      for (let k = 0; k <= 30; k++) { const a = (ANG * k) / 30; sec.push([CX + (R + 50) * Math.sin(a), CY + (R + 50) * Math.cos(a)]); }
      for (let k = 30; k >= 0; k--) { const a = (ANG * k) / 30; sec.push([CX + (R - 50) * Math.sin(a), CY + (R - 50) * Math.cos(a)]); }
      g.linea(sec, { fill: C.acento, alpha: 0.13, cerrar: true });
      g.linea(sec, { color: C.acento, lw: 1.2, alpha: 0.55, cerrar: true });
      const am = ANG * 0.5;
      g.rotulo(`Imán · B = ${num(B, 3)} T`, CX + (R + 50) * Math.sin(am) + 62, CY + (R + 50) * Math.cos(am) + 16, { size: 11, color: C.acento });
      for (const [a, rr] of [[0.22, R - 36], [0.5, R + 36], [0.8, R - 36]]) {
        const x = CX + rr * Math.sin(ANG * a), y = CY + rr * Math.cos(ANG * a);
        g.circulo(x, y, 5, { stroke: C.acento, lw: 1.1, alpha: 0.7 }); g.circulo(x, y, 1.4, { fill: C.acento, alpha: 0.7 });
      }
      // paredes del tubo
      const pared = (o) => {
        const pts = [[SX + 30, SY + o], [XM, SY + o]];
        for (let k = 1; k <= 30; k++) { const a = (ANG * k) / 30; pts.push([CX + (R - o) * Math.sin(a), CY + (R - o) * Math.cos(a)]); }
        const pe = pts[pts.length - 1]; pts.push([pe[0] + HE[0] * (LS - 2), pe[1] + HE[1] * (LS - 2)]);
        g.linea(pts, { color: C.metalOsc, lw: 1.2, alpha: 0.7 });
      };
      pared(-W); pared(W);
      // fuente y rendija de entrada
      g.rect(SX - 26, SY - 18, 26, 36, { fill: C.panel, stroke: C.metalOsc, lw: 1.2, r: 4 });
      g.ion(SX - 13, SY, { r: 5 });
      g.rotulo(`Fuente · ${num(U)} kV`, SX + 12, SY + 38, { size: 11 });
      g.electrodo(SX + 30, SY - 22, 4, 18, { color: C.metalOsc }); g.electrodo(SX + 30, SY + 4, 4, 18, { color: C.metalOsc });
      // rendija de salida y detector
      const jaw = (s0, s1) => g.linea([[RS[0] + NE[0] * s0, RS[1] + NE[1] * s0], [RS[0] + NE[0] * s1, RS[1] + NE[1] * s1]], { color: C.metalOsc, lw: 4, cap: 'butt' });
      jaw(HS, HS + 20); jaw(-HS, -HS - 20);
      g.rotulo('Rendija', RS[0] - 70, RS[1] + 2, { size: 11 });
      const d0 = [DET[0] - NE[0] * 16, DET[1] - NE[1] * 16], d1 = [DET[0] + NE[0] * 16, DET[1] + NE[1] * 16];
      g.linea([d0, d1], { color: C.metalOsc, lw: 7, cap: 'butt' });
      g.rotulo('Detector', DET[0] + 18, DET[1] - 22, { size: 11 });

      /* --- iones --- */
      IONES.forEach(([m], i) => {
        const col = C.m[i % C.m.length];
        const rho = Math.sqrt(m / ms);
        const tr = trayectoria(rho);
        const L = largo(tr.pts);
        g.linea(tr.pts, { color: col, lw: 1.3, alpha: 0.35 });
        const fin = tr.fin === 'detector' ? L - 26 : L;
        for (let k = 0; k < 16; k++) {
          const s = (((t * VEL[i] + k * SEP) % LMAX) + LMAX) % LMAX;
          if (s < fin) { const [x, y] = enLinea(tr.pts, s); g.ion(x, y, { r: 4.6, color: col, signo: false }); }
          else if (s - fin < VEL[i] * 0.35) {
            const [x, y] = enLinea(tr.pts, fin);
            if (tr.fin === 'detector') destello(g, x + HE[0] * 24, y + HE[1] * 24, (s - fin) / (VEL[i] * 0.35), { color: col, r: 9 });
            else g.circulo(x, y, 2 + 6 * ((s - fin) / (VEL[i] * 0.35)), { stroke: C.mal, lw: 1.2, alpha: 1 - (s - fin) / (VEL[i] * 0.35) });
          }
        }
      });

      /* --- lectura del campo y leyenda --- */
      g.rect(392, 16, 238, 112, { fill: C.panel, stroke: C.linea, r: 5 });
      g.texto('r = mv/(zeB) = √(2mV/ze) / B', 404, 35, { size: 12.5, color: C.texto, weight: 600 });
      g.texto(`Pasa la m/z ${num(ms, 0)}`, 404, 58, { size: 12, color: C.texto, weight: 600 });
      IONES.forEach(([m, nom], i) => {
        const y = 80 + i * 16;
        g.circulo(410, y, 4.5, { fill: C.m[i % C.m.length] });
        g.texto(`m/z ${num(m, 0)}  ${nom}`, 420, y + 0.5, { size: 11.5, color: C.texto2 });
      });
      g.texto('iones del PFK', 618, 80, { size: 10.5, color: C.tenue, align: 'right' });

      /* --- espectro: señal frente a m/z durante el barrido --- */
      const u = (m) => (m - MA) / (MB - MA);
      const tb = t < TS0 ? -1 : t < TS1 ? u(ms) : 1;
      const fade = 1 - tramo(t, 19, 20);
      const ticks = [60, 80, 100, 120, 140].map((m) => [u(m), String(m)]);
      const P = panelSenal(g, 392, 196, 238, 150, { titulo: 'Barrido del campo', nota: 'm/z →', ticks, picos: [], u1: 0 });
      // traza registrada (perfil real de transmisión por la rendija)
      if (tb > 0) {
        const pts = [];
        for (let k = 0; k <= 240; k++) { const uu = (k / 240) * Math.min(1, tb); const m = MA + uu * (MB - MA); pts.push([P.X(uu), P.Y(senal(m) * 0.9)]); }
        g.linea([[P.X(0), P.yb], ...pts, [pts[pts.length - 1][0], P.yb]], { fill: C.acento, alpha: 0.12 * fade, cerrar: true });
        g.linea(pts, { color: C.texto2, lw: 1.4, alpha: fade });
        IONES.forEach(([m], i) => { if (u(m) < tb) g.texto(num(m, 0), P.X(u(m)), P.Y(IONES[i][2] * 0.9) - 9, { size: 10, color: C.m[i % C.m.length], weight: 700, align: 'center', alpha: fade }); });
      }
      // cursor: m/z que pasa ahora y señal instantánea
      const uc = u(ms);
      g.linea([[P.X(uc), P.yt - 4], [P.X(uc), P.yb]], { color: C.acento, lw: 1, dash: [3, 3] });
      g.circulo(P.X(uc), P.Y(senal(ms) * 0.9), 3.2, { fill: C.acento });
    },
  };
}
