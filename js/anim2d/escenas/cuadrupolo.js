// Filtro de masas cuadrupolar. Vista frontal (sección de las cuatro barras, con el campo oscilante) y vista lateral en los dos planos
// (plano de las barras + y plano de las barras −). Las trayectorias NO son dibujos a mano: se integran las ecuaciones de Mathieu
// (_util-guiado.js) para la m/z seleccionada y para una más ligera y otra más pesada sobre la misma recta U/V; luego el diagrama de
// estabilidad (a–q) con la recta de barrido, el barrido (scan) y el modo SIM (o salto de picos en ICP-MS).
// Parámetros:
//   p.barras    'cuarzo-oro' (monolito de cuarzo con superficies hiperbólicas de oro, Agilent 5977) | 'molibdeno' (barras hiperbólicas de
//               Mo, Shimadzu LCMS-8060NX) | 'hiperbolicas' (genérico) | 'cilindricas'
//   p.prebarras true → pre-barras cortas solo con RF a la entrada (Shimadzu)
//   p.mz        [ligera, seleccionada, pesada]: m/z de ejemplo (por defecto 80, 100, 120)
//   p.alturas   intensidades relativas de esas tres m/z en el espectro esquemático (por defecto 0,55 · 1 · 0,35)
//   p.saltos    'sim' (por defecto) | 'isotopos' (texto de salto de picos de ICP-MS)
//   p.destino   texto de la salida (por defecto 'Al detector')
//   p.uso       'filtro' (por defecto: barrido + SIM) | 'aislamiento' (Q-TOF, TIMS-QTOF, FT-ICR: modo solo RF + aislamiento del precursor)
//   p.ventana   texto de la ventana de aislamiento (solo con p.uso 'aislamiento'), p. ej. '≈ 1,3 m/z'
import { tramo, suave, lerp, clamp } from '../dibujo.js';
import { mathieu, enXi, aMax, fronteraA0, fronteraB1, barraHiperbolica, oro, esOscuro } from './_util-guiado.js';

const K = 0.31;      // pendiente de la recta de barrido a/q = 2U/V (U/V = 0,155): ventana estable q ≈ 0,647–0,718
const Q0 = 0.683;    // q de la m/z seleccionada (centro de la ventana)
const XI_L = 60;     // longitud del filtro en ξ = Ωt/2 (≈ 19 ciclos de RF; esquemático, en un filtro real son muchos más)

export default function crear(p = {}) {
  const barras = p.barras || 'hiperbolicas';
  const pre = !!p.prebarras;
  const MZ = p.mz || [80, 100, 120];
  const ALT = p.alturas || [0.55, 1, 0.35];
  const destino = p.destino || 'Al detector';
  const isot = p.saltos === 'isotopos';
  const aisl = p.uso === 'aislamiento'; // Q-TOF, TIMS-QTOF, FT-ICR: modo solo RF + aislamiento del precursor en lugar de barrido + SIM

  // trayectorias para la m/z seleccionada (índice 1) y las vecinas, todas con la misma recta U/V
  const tr = MZ.map((m) => { const q = (Q0 * MZ[1]) / m; return mathieu(K * q, q, { xiMax: XI_L }); });

  /* --- geometría --- */
  const EC = { x: 112, y: 140 }, R0 = 40;           // vista frontal
  const X0 = 252, X1 = 598, XM = pre ? X0 + 36 : X0;  // vista lateral: inicio, fin, inicio de las barras principales
  const PL = [{ yc: 82, eje: 1, nom: 'Plano de las barras +' }, { yc: 190, eje: 2, nom: 'Plano de las barras −' }];
  const HA = 30;                                     // r₀ en la vista lateral (px)

  const nomBarras = {
    'cuarzo-oro': 'Las cuatro superficies hiperbólicas, de oro sobre un monolito de cuarzo,',
    molibdeno: 'Las cuatro barras de molibdeno, de perfil hiperbólico,',
    hiperbolicas: 'Las cuatro barras, de perfil hiperbólico,',
    cilindricas: 'Las cuatro barras cilíndricas',
  }[barras] || 'Las cuatro barras';

  const T1 = 3.6, T2 = 7.6, T3 = 11.2, T4 = 14.2, T5 = 17.4, DUR = 20.4;
  const fases = [
    { t: 0, texto: `${nomBarras} forman dos pares de electrodos opuestos: uno recibe +(U + V cos Ωt) y el otro −(U + V cos Ωt), es decir, una tensión continua U más una radiofrecuencia de amplitud V.` },
    { t: T1, texto: `El ion de la m/z seleccionada oscila al ritmo de la radiofrecuencia, pero su amplitud no crece: la trayectoria es estable en los dos planos y recorre todo el filtro.${pre ? ' Las pre-barras, solo con RF, suavizan el campo de entrada.' : ''}` },
    { t: T2, texto: 'Un ion más ligero responde con más fuerza a la RF: su oscilación crece en el plano de las barras positivas hasta chocar con ellas. En uno más pesado la RF ya no compensa el desenfoque de la tensión continua y acaba en las barras negativas.' },
    { t: T3, texto: 'Las ecuaciones de Mathieu resumen el movimiento en dos parámetros, a ∝ U/(m/z) y q ∝ V/(m/z). Solo atraviesan el filtro los iones cuyo punto (q, a) cae dentro de la región estable. Con U/V fijo, todas las m/z quedan sobre una misma recta.' },
    aisl
      ? { t: T4, texto: 'Modo solo RF: con U = 0 todos los puntos caen sobre el eje q y son estables mientras q < 0,908. El cuadrupolo deja pasar entonces un intervalo amplio de m/z; así trabaja cuando el analizador posterior debe registrar el espectro completo.' }
      : { t: T4, texto: 'Barrido (scan): U y V aumentan juntos, con U/V constante. Las m/z cruzan una tras otra la punta de la región estable, de las ligeras a las pesadas, y se registra el espectro. Cuanto más cerca del vértice pasa la recta, más estrecha es la ventana.' },
    { t: T5, texto: aisl
      ? `Aislamiento (MS/MS): se fijan U y V para que solo la m/z del precursor quede dentro de la región estable. El cuadrupolo deja pasar una ventana estrecha${p.ventana ? ` (${p.ventana})` : ''} hacia la celda de colisión.`
      : isot
        ? 'Salto de picos: U y V saltan de un isótopo a otro en microsegundos y el detector cuenta cada uno durante un tiempo fijo. Solo se miden las masas de interés, con la máxima sensibilidad.'
        : 'Modo SIM: U y V saltan entre unos pocos valores fijos y el filtro solo transmite las m/z elegidas. Como se dedica más tiempo a cada ion, la sensibilidad es mucho mayor que en barrido.' },
  ];

  /* --- m/z seleccionada en cada instante (barrido y SIM) --- */
  const mMin = MZ[0] - (MZ[1] - MZ[0]) * 0.5, mMax = MZ[2] + (MZ[2] - MZ[1]) * 0.5;
  const soloRF = (t) => aisl && t >= T4 && t < T5;
  function mSel(t) {
    if (aisl || t < T4 + 0.3) return MZ[1];
    if (t < T5 - 0.2) { const s = tramo(t, T4 + 0.6, T5 - 0.4); return t < T4 + 0.6 ? lerp(MZ[1], mMin, tramo(t, T4 + 0.3, T4 + 0.6)) : lerp(mMin, mMax, s); }
    const k = Math.floor((t - T5) / 0.75) % 3;
    return MZ[k];
  }
  const transm = (i, ms, rf) => {
    const q = (Q0 * ms) / MZ[i];
    if (rf) return q < 0.9 ? 1 : 0;
    return suave(clamp((aMax(q) - K * q) / 0.012));
  };

  return {
    titulo: 'Filtro de masas cuadrupolar',
    dur: DUR,
    fases,
    dibujar(g, t) {
      const C = g.C;
      const fRF = t < T1 ? 1 : 1 - tramo(t, T1, T1 + 0.6);           // visibilidad del campo oscilante
      const phi = 0.155 + Math.cos(t * Math.PI * 2 * 0.55);              // (U + V cos Ωt)/V, ralentizado para verlo
      const kPhi = phi / 1.155;

      /* ===== vista frontal ===== */
      g.texto('Vista frontal', 16, 16, { size: 10.5, color: C.tenue, weight: 600 });
      if (barras === 'cuarzo-oro') g.circulo(EC.x, EC.y, 88, { fill: esOscuro(g) ? '#3a4552' : '#dfe8ef', stroke: C.linea, lw: 1 });
      // equipotenciales x² − y² = c·r0² (signo según el par)
      if (fRF > 0) {
        for (const c of [-0.75, -0.4, 0.4, 0.75]) {
          const col = c * kPhi > 0 ? C.calor : C.acento, al = 0.55 * fRF * Math.abs(kPhi);
          for (const sg of [1, -1]) {
            const pts = [];
            for (let s = -1.4; s <= 1.4; s += 0.05) {
              const A = R0 * Math.sqrt(Math.abs(c));
              let x = sg * A * Math.cosh(s), y = A * Math.sinh(s);
              if (c < 0) [x, y] = [y, x];
              if (x * x + y * y < (R0 * 0.98) ** 2) pts.push([EC.x + x, EC.y - y]);
            }
            g.linea(pts, { color: col, lw: 1.1, alpha: al, dash: [3, 3] });
          }
        }
      }
      for (let i = 0; i < 4; i++) {
        const ang = (i * Math.PI) / 2, parX = i % 2 === 0;
        const v = parX ? kPhi : -kPhi;
        const base = barras === 'cuarzo-oro' ? (esOscuro(g) ? '#4a5664' : '#cfdbe5') : C.metal;
        if (barras === 'cilindricas') g.circulo(EC.x + Math.cos(ang) * (R0 * 1.15 + 20), EC.y - Math.sin(ang) * (R0 * 1.15 + 20), R0 * 1.15 * 0.95 - 4, { fill: base, stroke: C.metalOsc });
        else barraHiperbolica(g, EC.x, EC.y, R0, -ang, { ancho: 38, fondo: barras === 'cuarzo-oro' ? 40 : 26, fill: base, stroke: C.metalOsc, lw: 0.8,
          cara: barras === 'cuarzo-oro' ? oro(g) : barras === 'molibdeno' ? C.metalOsc : null });
        // tinte de polaridad instantánea
        const cx = EC.x + Math.cos(ang) * (R0 + 22), cy = EC.y - Math.sin(ang) * (R0 + 22);
        if (fRF > 0) g.circulo(cx, cy, 15, { fill: v > 0 ? C.calor : C.acento, alpha: 0.5 * fRF * Math.abs(v) });
        g.texto(parX ? '+' : '−', cx, cy + 0.5, { size: 15, color: parX ? C.calor : C.acento, align: 'center', weight: 800 });
      }
      g.rotulo('−(U + V cos Ωt)', EC.x, 40, { size: 10, color: C.acento });
      g.rotulo('+(U + V cos Ωt)', 222, EC.y + 44, { size: 10, color: C.calor, align: 'right' });
      if (barras === 'cuarzo-oro' && t < T1) {
        g.rotulo('Cuarzo', EC.x + 70, EC.y + 74, { size: 9.5 });
        g.rotulo('Oro', EC.x + 52, EC.y - 34, { size: 9.5, color: oro(g) });
      } else if (barras === 'molibdeno' && t < T1) g.rotulo('Molibdeno', EC.x + 66, EC.y + 70, { size: 9.5 });

      /* ===== vista lateral (dos planos) ===== */
      g.texto('Vista lateral', X0, 16, { size: 10.5, color: C.tenue, weight: 600 });
      for (const pl of PL) {
        const positivo = pl.eje === 1;
        g.texto(pl.nom, X0, pl.yc - HA - 17, { size: 9.5, color: positivo ? C.calor : C.acento, weight: 600 });
        for (const sg of [-1, 1]) {
          const y = pl.yc + sg * (HA + 4.5) - 4.5;
          if (pre) g.electrodo(X0, y, 30, 9, { color: C.metal });
          g.electrodo(XM, y, X1 - XM, 9, { color: C.metal });
          g.rect(XM, y, X1 - XM, 9, { fill: positivo ? C.calor : C.acento, alpha: 0.18, r: 2 });
        }
        g.linea([[X0 - 16, pl.yc], [X1 + 8, pl.yc]], { color: C.linea, lw: 0.8, dash: [4, 4] });
      }
      if (pre) { g.rotulo('Pre-barras (solo RF)', X0 - 4, 243, { size: 9.5, align: 'left' }); g.linea([[X0 + 15, 234], [X0 + 15, 226]], { color: C.tenue, lw: 1 }); }
      g.texto(destino, 604, 16, { size: 10, color: C.tenue, align: 'right' });
      g.flecha(608, 16, 632, 16, { color: C.tenue, lw: 1.2, punta: 6 });

      /* ===== pasadas de iones (fases 2 y 3) ===== */
      const pasadas = [];
      if (t >= T1 && t < T3 + 0.5) pasadas.push({ i: 1, t0: T1 + 0.3, dur: 3.2, al: t < T2 ? 1 : 0.35 });
      if (t >= T2) pasadas.push({ i: 0, t0: T2 + 0.3, dur: 3.2, al: 1 - tramo(t, T3, T3 + 0.5) }, { i: 2, t0: T2 + 0.3, dur: 3.2, al: 1 - tramo(t, T3, T3 + 0.5) });
      if (t >= T2 && t < T3 + 0.5) pasadas.push({ i: 1, t0: T2 + 0.3, dur: 3.2, al: 1 - tramo(t, T3, T3 + 0.5) });
      for (const ps of pasadas) {
        if (ps.al <= 0.01) continue;
        const col = C.m[ps.i], T = tr[ps.i];
        const xiAct = (XI_L * (t - ps.t0)) / ps.dur;
        const zXi = (xi) => XM + (xi / XI_L) * (X1 - XM);
        // entrada recta hasta las barras principales
        if (xiAct < 0) {
          const k = tramo(t, ps.t0 - 0.45, ps.t0);
          if (k <= 0) continue;
          const z = lerp(X0 - 18, XM, k);
          for (const pl of PL) g.ion(z, pl.yc - T.pts[0][pl.eje] * HA, { r: 4.6, color: col, alpha: ps.al });
          continue;
        }
        const xiV = Math.min(xiAct, T.xiFin);
        for (const pl of PL) {
          const pts = [[X0 - 18, pl.yc - T.pts[0][pl.eje] * HA], [XM, pl.yc - T.pts[0][pl.eje] * HA]];
          for (const q of T.pts) { if (q[0] > xiV) break; pts.push([zXi(q[0]), pl.yc - clamp(q[pl.eje], -1.25, 1.25) * HA]); }
          g.linea(pts, { color: col, lw: 1.4, alpha: 0.8 * ps.al });
        }
        const pos = enXi(T, xiV) || [T.pts[T.pts.length - 1][1], T.pts[T.pts.length - 1][2]];
        const choco = T.choque && xiAct >= T.xiFin;
        const salio = !T.choque && xiAct >= XI_L;
        if (!choco && !salio) for (const pl of PL) g.ion(zXi(xiV), pl.yc - pos[pl.eje - 1] * HA, { r: 4.6, color: col, alpha: ps.al });
        if (salio) {
          const k = tramo(xiAct, XI_L, XI_L * 1.25);
          if (k < 1) for (const pl of PL) g.ion(lerp(X1, 640, k), pl.yc - pos[pl.eje - 1] * HA * (1 - k), { r: 4.6, color: col, alpha: ps.al });
        }
        // vista frontal: posición y estela
        const est = [];
        for (const q of T.pts) { if (q[0] > xiV) break; if (q[0] > xiV - 7) est.push([EC.x + q[1] * R0, EC.y - q[2] * R0]); }
        g.linea(est, { color: col, lw: 1.3, alpha: 0.7 * ps.al });
        if (!salio || tramo(xiAct, XI_L, XI_L * 1.25) < 1) g.ion(EC.x + pos[0] * R0, EC.y - pos[1] * R0, { r: 4.6, color: col, alpha: choco ? ps.al * (1 - tramo(xiAct, T.xiFin, T.xiFin + 8)) : ps.al });
        if (choco) {
          const k = tramo(xiAct, T.xiFin, T.xiFin + 10);
          if (k < 1) {
            g.circulo(EC.x + pos[0] * R0, EC.y - pos[1] * R0, 4 + 14 * k, { stroke: col, lw: 1.6, alpha: (1 - k) * ps.al });
            const pl = PL[T.choque === 'x' ? 0 : 1];
            g.circulo(zXi(T.xiFin), pl.yc - Math.sign(pos[pl.eje - 1]) * HA, 4 + 14 * k, { stroke: col, lw: 1.6, alpha: (1 - k) * ps.al });
          }
          if (t < T3) {
            const lig = T.choque === 'x';
            g.rotulo(lig ? 'Más ligero: choca con las barras +' : 'Más pesado: choca con las barras −', 470, lig ? 133 : 242,
              { size: 9.5, color: col, alpha: tramo(xiAct, T.xiFin, T.xiFin + 4) * ps.al });
          }
        }
        if (salio && ps.i === 1 && t < T2) g.rotulo('Estable: atraviesa el filtro', 470, 136, { size: 9.5, color: col, alpha: tramo(xiAct, XI_L, XI_L * 1.05) });
      }

      /* ===== haz transmitido durante el barrido y el SIM ===== */
      const ms = mSel(t), rf = soloRF(t);
      if (t >= T3 + 0.3) {
        for (let i = 0; i < 3; i++) {
          const T = transm(i, ms, rf) * tramo(t, T3 + 0.3, T3 + 0.8);
          if (T < 0.05) continue;
          for (let j = 0; j < 7; j++) {
            const u = ((t * 0.9 + j / 7 + i / 21) % 1);
            const z = lerp(X0 - 18, 636, u);
            for (const pl of PL) g.ion(z, pl.yc + Math.sin(u * 40 + j + pl.eje) * 6 * T, { r: 3.6, color: C.m[i], alpha: T * 0.9, signo: false });
          }
        }
      }

      /* ===== panel inferior izquierdo: tensión de un par / diagrama de estabilidad ===== */
      const BX = 14, BY = 256, BW = 222, BH = 90;
      g.rect(BX, BY, BW, BH, { fill: C.panel, stroke: C.linea, r: 4 });
      if (t < T3) {
        // Φ(t) = U + V cos Ωt
        const al = t < T3 - 0.4 ? 1 : 1 - tramo(t, T3 - 0.4, T3);
        const y0 = BY + 58, A = 26, xa = BX + 10, xb = BX + BW - 10;
        g.texto('Tensión de un par: U + V cos Ωt', BX + 8, BY + 10, { size: 9.5, color: C.texto2, weight: 600, alpha: al });
        g.linea([[xa, y0], [xb, y0]], { color: C.tenue, lw: 0.8, alpha: al });
        g.texto('0', xa - 2, y0, { size: 8.5, color: C.tenue, align: 'right', alpha: al });
        const yU = y0 - 0.155 * A;
        g.linea([[xa, yU], [xb, yU]], { color: C.calor, lw: 1, dash: [4, 3], alpha: al });
        g.texto('U', xb - 2, yU - 7, { size: 9, color: C.calor, align: 'right', weight: 700, alpha: al });
        const pts = [];
        for (let i = 0; i <= 120; i++) { const u = i / 120; pts.push([lerp(xa, xb, u), y0 - (0.155 + Math.cos((u * 3 - t * 0.55) * Math.PI * 2)) * A / 1.155]); }
        g.linea(pts, { color: C.acento, lw: 1.5, alpha: al });
        g.texto('V', xa + 8, BY + 22, { size: 9, color: C.acento, weight: 700, alpha: al });
        if (t < T1) g.circulo(lerp(xa, xb, 0), y0 - kPhi * A, 0, {});
      } else {
        const al = tramo(t, T3, T3 + 0.5);
        const qx = (q) => BX + 20 + q * (BW - 32), ay = (a) => BY + BH - 14 - (a / 0.27) * (BH - 26);
        g.texto('Diagrama de estabilidad', BX + 8, BY + 10, { size: 9.5, color: C.texto2, weight: 600, alpha: al });
        const reg = [];
        for (let q = 0; q <= 0.908; q += 0.01) reg.push([qx(q), ay(aMax(q))]);
        reg.push([qx(0.908), ay(0)]);
        g.linea([[qx(0), ay(0)], ...reg], { fill: C.ok + '33', color: C.ok, lw: 1.2, alpha: al, cerrar: true });
        g.linea([[qx(0), ay(0)], [qx(1), ay(0)]], { color: C.tenue, lw: 0.8, alpha: al });
        g.linea([[qx(0), ay(0)], [qx(0), ay(0.3)]], { color: C.tenue, lw: 0.8, alpha: al });
        g.texto('q', qx(1), ay(0) + 8, { size: 9.5, color: C.tenue, align: 'right', italic: true, alpha: al });
        g.texto('a', qx(0) - 8, ay(0.2), { size: 9.5, color: C.tenue, align: 'center', italic: true, alpha: al });
        g.texto('estable', qx(0.47), ay(0.035), { size: 9, color: C.ok, align: 'center', weight: 600, alpha: al });
        const kRec = rf ? 0 : K;
        if (rf) {
          g.linea([[qx(0), ay(0)], [qx(0.98), ay(0)]], { color: C.texto2, lw: 2, alpha: al });
          g.texto('U = 0 (solo RF)', qx(0.2), ay(0.12), { size: 9, color: C.texto2, align: 'center', alpha: al });
          g.linea([[qx(0.908), ay(0) - 2], [qx(0.908), ay(0.06)]], { color: C.calor, lw: 1, alpha: al });
          g.texto('0,908', qx(0.908), ay(0.09), { size: 8.5, color: C.calor, align: 'center', alpha: al });
        } else {
          g.linea([[qx(0), ay(0)], [qx(0.96), ay(K * 0.96)]], { color: C.texto2, lw: 1, dash: [4, 3], alpha: al });
          g.texto('U/V constante', qx(0.28), ay(0.15), { size: 9, color: C.texto2, align: 'center', alpha: al });
        }
        for (let i = 0; i < 3; i++) {
          const q = (Q0 * ms) / MZ[i];
          if (q > 1.02) continue;
          const T = transm(i, ms, rf);
          g.ion(qx(q), ay(kRec * q), { r: 3.6 + 1.2 * T, color: C.m[i], alpha: al, signo: false, brillo: T > 0.5 });
        }
        void fronteraA0; void fronteraB1;
      }

      /* ===== panel inferior derecho: espectro ===== */
      if (t >= T4) {
        const al = tramo(t, T4, T4 + 0.4);
        const SX = 252, SY = 256, SW = 360, SH = 90;
        const um = (m) => (m - mMin) / (mMax - mMin);
        const marcas = MZ.map((m) => [um(m), String(m)]);
        if (aisl) {
          g.grafico(SX, SY, SW, SH, () => 0, { titulo: rf ? 'Iones transmitidos (solo RF)' : 'Iones transmitidos (aislamiento)', ejeX: 'm/z', marcas, alpha: al });
          for (let i = 0; i < 3; i++) {
            const T = transm(i, ms, rf);
            const x = SX + 6 + um(MZ[i]) * (SW - 12), h = ALT[i] * (SH - 30) * 0.92 * T;
            if (h > 0.5) g.rect(x - 5, SY + SH - 14 - h, 10, h, { fill: C.m[i], alpha: 0.85 * al, r: 1.5 });
          }
        } else if (t < T5) {
          const hecho = um(ms);
          const f = (u) => {
            if (u > hecho) return 0;
            const m = lerp(mMin, mMax, u);
            let s = 0;
            for (let i = 0; i < 3; i++) s += ALT[i] * transm(i, m);
            return s * 0.92;
          };
          g.grafico(SX, SY, SW, SH, f, { titulo: 'Señal en el detector (barrido)', ejeX: 'm/z', marcas, alpha: al, n: 220 });
          const xc = SX + 6 + hecho * (SW - 12);
          g.linea([[xc, SY + 16], [xc, SY + SH - 14]], { color: C.texto2, lw: 1, dash: [3, 3], alpha: al });
        } else {
          g.grafico(SX, SY, SW, SH, () => 0, { titulo: isot ? 'Cuentas por isótopo (salto de picos)' : 'Señal en el detector (SIM)', ejeX: 'm/z', marcas, alpha: al });
          const nVis = Math.floor((t - T5) / 0.75);
          for (let i = 0; i < 3; i++) {
            const lleno = nVis > i ? 1 : nVis === i ? tramo(t, T5 + i * 0.75, T5 + (i + 1) * 0.75) : 0;
            const x = SX + 6 + um(MZ[i]) * (SW - 12), h = ALT[i] * (SH - 30) * 0.92 * lleno;
            g.rect(x - 5, SY + SH - 14 - h, 10, h, { fill: C.m[i], alpha: 0.85, r: 1.5 });
          }
        }
      }

      /* ===== leyenda ===== */
      if (t >= T1) g.leyenda(MZ.map((m, i) => [C.m[i], `m/z ${m}${i === 1 && t < T4 ? ' (seleccionada)' : ''}`]), 252, 352, { size: 9.5 });
      void suave;
    },
  };
}
