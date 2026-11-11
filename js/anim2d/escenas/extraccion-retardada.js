// Extracción retardada (pulsada) de una fuente MALDI-TOF lineal: tres iones de la misma m/z con velocidades iniciales distintas.
// La cinemática es real (unidades SI, movimiento uniformemente acelerado por tramos) para una geometría ilustrativa:
// diana P1 → P2 a 4 mm, P2 → tierra 8 mm más allá y tubo sin campo hasta el plano de foco, que se calcula. Con 20 kV / 18 kV,
// 150 ns, m/z 1000 y v₀ = 300, 600 y 900 m/s el foco cae a ≈ 1 m, como en el microflex. Los desplazamientos durante el retardo
// (decenas de µm) no se ven a la escala del dibujo, por eso se muestran en una ampliación; la ventaja de cada ion sobre el lento
// se representa en un gráfico frente a la distancia recorrida. Todo es función de t (sin estado).
//
// Parámetros (p): U1 (V, diana, 20000) · U2 (V, P2 tras el pulso, 18000) · retardo (ns, 150) · mz (1000) · longitud (rótulo, '≈ 1 m')
//                 nombre (cómo llama el fabricante al método, p. ej. 'PIE')
import { tramo, suave, lerp, clamp } from '../dibujo.js';

const E = 1.602177e-19, U = 1.660539e-27;
const D1 = 4e-3, D2 = 8e-3;            // geometría ilustrativa de la fuente (m)
const V0 = [300, 600, 900];             // velocidades iniciales (m/s): lento, medio, rápido

/** Trayectoria x(s) de un ion que parte de la diana con v0; el campo aparece a los tau segundos. */
function trayectoria(v0, tau, a1, a2) {
  const seg = [{ t0: 0, x0: 0, v0, a: 0 }];
  let t = tau, x = v0 * tau, v = v0;
  if (x < D1) { seg.push({ t0: t, x0: x, v0: v, a: a1 }); const vv = Math.sqrt(v * v + 2 * a1 * (D1 - x)); t += (vv - v) / a1; v = vv; x = D1; }
  seg.push({ t0: t, x0: x, v0: v, a: a2 });
  { const vv = Math.sqrt(v * v + 2 * a2 * (D1 + D2 - x)); t += (vv - v) / a2; v = vv; x = D1 + D2; }
  seg.push({ t0: t, x0: x, v0: v, a: 0 });
  return (s) => { let q = seg[0]; for (const z of seg) if (s >= z.t0) q = z; const d = s - q.t0; return q.x0 + q.v0 * d + 0.5 * q.a * d * d; };
}
/** Instante en que la trayectoria f alcanza la posición L (bisección; f es monótona). */
function llegada(f, L) { let lo = 0, hi = 2e-4; for (let i = 0; i < 70; i++) { const m = (lo + hi) / 2; if (f(m) < L) lo = m; else hi = m; } return hi; }

const kV = (v) => (v / 1000).toLocaleString('es-ES', { maximumFractionDigits: 1 }) + ' kV';

export default function crear(p = {}) {
  const U1 = p.U1 || 20000, U2 = p.U2 || 18000, tau = (p.retardo || 150) * 1e-9, mz = p.mz || 1000;
  const M = mz * U, a1 = (E * (U1 - U2)) / D1 / M, a2 = (E * U2) / D2 / M;
  const con = V0.map((v) => trayectoria(v, tau, a1, a2));
  const sin = V0.map((v) => trayectoria(v, 0, a1, a2));
  // plano de foco: distancia a la que los tiempos de llegada con retardo coinciden mejor
  let L = 1, mejor = Infinity;
  for (let l = 0.1; l < 3; l += 0.0025) {
    const ts = con.map((f) => llegada(f, l)), sp = Math.max(...ts) - Math.min(...ts);
    if (sp < mejor) { mejor = sp; L = l; }
  }
  const tLleg = con.map((f) => llegada(f, L));
  const Tfin = Math.max(...tLleg);
  // curvas de ventaja sobre el ion lento frente a la distancia recorrida por este
  const curva = (tr) => {
    const out = [];
    const T = llegada(tr[0], L);
    for (let i = 0; i <= 240; i++) {
      const s = T * Math.pow(i / 240, 1.6);     // más muestras al principio, donde cambia todo
      out.push([tr[0](s), tr[1](s) - tr[0](s), tr[2](s) - tr[0](s)]);
    }
    return out;
  };
  const cCon = curva(con), cSin = curva(sin);
  const dMax = Math.max(...cCon.map((c) => c[2]), ...cSin.map((c) => c[2])) * 1.1;

  // tiempo de la animación → tiempo físico (s)
  const dur = 18;
  const fis = (t) => {
    if (t < 1.5) return 0;
    if (t < 6.5) return tau * tramo(t, 1.5, 6.5);
    if (t < 7.8) return tau;
    if (t < 10.4) return lerp(tau, 1e-6, tramo(t, 7.8, 10.4));
    return lerp(1e-6, Tfin, tramo(t, 10.4, 15.2));
  };
  const nombre = p.nombre ? ` (${p.nombre})` : '';
  const ns = Math.round(tau * 1e9);

  return {
    titulo: 'Extracción retardada',
    dur,
    fases: [
      { t: 0, texto: 'Cada disparo del láser libera iones con velocidades iniciales distintas, de cientos de metros por segundo. Si el campo se aplicara de inmediato, iones de la misma m/z llegarían al detector en instantes algo distintos y el pico se ensancharía.' },
      { t: 1.6, texto: `Durante el retardo${nombre}, de unos ${ns} ns, la diana P1 y la placa P2 están al mismo potencial, ${kV(U1)}: no hay campo. Los iones vuelan libremente y los más rápidos se alejan algo más de la diana, unas decenas de micrómetros.` },
      { t: 6.5, texto: `Al terminar el retardo, P2 pasa a ${kV(U2)} y aparece el campo. El potencial disminuye al alejarse de la diana: el ion rápido, que está más lejos, parte de un potencial menor y recibirá menos energía que el lento.` },
      { t: 9, texto: 'Los iones lentos salen de la fuente con algo más de energía y, en el tubo sin campo, van recortando la ventaja de los rápidos. Con el retardo adecuado, todos los de igual m/z alcanzan a la vez el plano del detector: es el foco temporal.' },
      { t: 14.6, texto: 'Sin retardo (línea discontinua), el ion rápido llegaría antes y el pico sería más ancho. El retardo óptimo depende de la m/z, por eso se ajusta en el método para el intervalo de masas que interesa.' },
    ],
    dibujar(g, t) {
      const C = g.C;
      const s = fis(t);
      const campo = s >= tau && t >= 6.9;
      const aFin = 1 - tramo(t, 17.4, 17.95);

      /* ===== panel superior: fuente y tubo de vuelo (fuente ampliada respecto al tubo) ===== */
      const X0 = 66, XS = 171, XD = 590, AY = 115;
      const mapa = (x) => (x <= D1 + D2 ? X0 + (x / (D1 + D2)) * (XS - X0) : XS + ((x - D1 - D2) / (L - D1 - D2)) * (XD - XS));
      g.linea([[XS + 4, 62], [XD, 62]], { color: C.linea, lw: 1.2 });
      g.linea([[XS + 4, 168], [XD, 168]], { color: C.linea, lw: 1.2 });
      g.rect(XS + 4, 63, XD - XS - 4, 104, { fill: C.vacio, alpha: 0.6 });
      // corte del tubo (no a escala)
      for (const y of [62, 168]) g.linea([[372, y - 6], [378, y + 6], [384, y - 6], [390, y + 6]], { color: C.tenue, lw: 1.2 });
      g.texto(`Tubo de vuelo sin campo (${p.longitud || '≈ 1 m'})`, 400, 76, { size: 11, color: C.tenue });
      g.electrodo(56, 52, 10, 126, {});
      const cP2 = campo ? C.acento : C.metal;
      g.electrodo(98, 52, 6, 53, { color: cP2 }); g.electrodo(98, 125, 6, 53, { color: cP2 });
      g.electrodo(168, 52, 6, 53, {}); g.electrodo(168, 125, 6, 53, {});
      g.rect(XD, 70, 10, 90, { fill: C.metalOsc, r: 2 });
      g.rotulo('Diana P1', 50, 36, { size: 11 });
      g.rotulo('P2', 101, 36, { size: 11 });
      g.rotulo('Tierra', 171, 36, { size: 11 });
      g.rotulo('Detector (foco)', 566, 36, { size: 11 });
      g.texto(kV(U1), 61, 188, { size: 10.5, color: C.texto2, align: 'center', weight: 700 });
      g.texto(campo ? kV(U2) : kV(U1), 101, 188, { size: 10.5, color: campo ? C.acento : C.texto2, align: 'center', weight: 700 });
      g.texto('0 V', 171, 188, { size: 10.5, color: C.texto2, align: 'center', weight: 700 });
      if (campo) for (const y of [84, 146]) g.flecha(70, y, 160, y, { color: C.campo, lw: 1, punta: 5, alpha: tramo(t, 6.9, 7.3) * (1 - tramo(t, 10.4, 11)) });
      // reloj
      const reloj = s < 1e-6 ? `${Math.round(s * 1e9)} ns` : `${(s * 1e6).toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} µs`;
      g.texto(t < 1.2 ? 'Esperando el disparo…' : `t = ${reloj} tras el disparo`, 400, 20, { size: 11.5, color: C.texto, weight: 600 });
      // destello del láser
      const kFl = tramo(t, 1.1, 1.35) * (1 - tramo(t, 1.45, 2));
      if (kFl > 0) g.circulo(68, AY, 10 + 10 * kFl, { fill: C.foton, alpha: 0.5 * kFl });
      // iones (carriles separados solo para verlos)
      const carril = [AY + 18, AY, AY - 18];
      const nombres = ['lento', 'medio', 'rápido'];
      if (t > 1.3) {
        con.forEach((f, i) => {
          const x = Math.min(f(s), L);
          const px = mapa(x);
          const llego = s >= tLleg[i] - 1e-12;
          g.ion(Math.min(px + 7, XD - 6), carril[i], { r: 6, alpha: aFin * tramo(t, 1.3, 1.6), brillo: llego });
          g.texto(['v₀ baja', 'v₀ media', 'v₀ alta'][i], 50, carril[i] + 0.5, { size: 9.5, color: C.texto2, align: 'right', alpha: aFin * tramo(t, 1.6, 2) });
        });
        if (s >= Tfin - 1e-12) g.rotulo('Llegan a la vez', 520, 190, { size: 11, color: C.ok, alpha: tramo(t, 15.2, 15.6) * aFin });
      }

      /* ===== panel inferior izquierdo: cerca de la diana, ampliado ===== */
      const PX = 14, PY = 208, PW = 296, PH = 138;
      g.rect(PX, PY, PW, PH, { fill: C.panel, stroke: C.linea, r: 6 });
      g.texto('Primeros 0,2 mm desde la diana (ampliado)', PX + 8, PY + 12, { size: 10.5, color: C.texto2, weight: 600 });
      const xm = 0.2e-3, gx0 = PX + 40, gx1 = PX + PW - 12, gy0 = PY + 52, gy1 = PY + PH - 24;
      const Umin = U1 - (U1 - U2) * (xm / D1) * 1.15;
      const gxP = (x) => gx0 + (x / xm) * (gx1 - gx0);
      const gyU = (u) => gy0 + ((U1 - u) / (U1 - Umin)) * (gy1 - gy0);
      g.linea([[gx0, gy0 - 6], [gx0, gy1 + 4]], { color: C.metalOsc, lw: 3 });
      g.texto('P1', gx0 - 6, gy1 + 4, { size: 9.5, color: C.tenue, align: 'right' });
      g.linea([[gx0, gy1 + 8], [gx1, gy1 + 8]], { color: C.tenue, lw: 0.8 });
      g.texto('0', gx0, gy1 + 17, { size: 9, color: C.tenue, align: 'center' });
      g.texto('0,1 mm', gxP(0.1e-3), gy1 + 17, { size: 9, color: C.tenue, align: 'center' });
      g.texto('0,2 mm', gxP(0.2e-3), gy1 + 17, { size: 9, color: C.tenue, align: 'center' });
      g.texto('potencial', gx0 - 6, gy0 - 2, { size: 9, color: C.tenue, align: 'right' });
      g.texto(kV(U1), gx0 - 6, gy0 + 10, { size: 9, color: C.tenue, align: 'right' });
      // perfil de potencial: plano durante el retardo, en pendiente con el campo
      const pend = campo ? tramo(t, 6.9, 7.4) : 0;
      const uEn = (x) => U1 - pend * (U1 - U2) * (x / D1);
      g.linea([[gx0, gyU(uEn(0))], [gx1, gyU(uEn(xm))]], { color: campo ? C.acento : C.tenue, lw: 1.6 });
      g.texto(campo ? `con campo (P2 a ${kV(U2)})` : 'sin campo: P1 = P2', gx1, campo ? gyU(uEn(xm)) + 12 : gy0 - 8, { size: 9.5, color: campo ? C.acento : C.texto2, align: 'right' });
      if (t > 1.3) {
        con.forEach((f, i) => {
          const x = f(s);
          if (x > xm * 1.02) return;
          const px = gxP(x), py = gyU(uEn(x));
          g.ion(px, py - 9, { r: 5.5, alpha: tramo(t, 1.3, 1.6) });
          g.texto(nombres[i], px, py - 22, { size: 9, color: C.texto2, align: 'center', alpha: tramo(t, 4, 4.5) });
        });
        // diferencia de potencial de partida entre el lento y el rápido
        const aDU = pend * (1 - tramo(t, 7.9, 8.3));
        if (aDU > 0) {
          const x0 = con[0](s), x2 = con[2](s);
          const xb = gxP(x2) + 14;
          g.linea([[gxP(x0), gyU(uEn(x0))], [xb, gyU(uEn(x0))]], { color: C.mal, lw: 1, dash: [3, 3], alpha: aDU });
          g.flecha(xb, gyU(uEn(x0)), xb, gyU(uEn(x2)), { color: C.mal, lw: 1.3, punta: 5, alpha: aDU });
          g.texto('menos energía', xb + 6, (gyU(uEn(x0)) + gyU(uEn(x2))) / 2, { size: 9.5, color: C.mal, alpha: aDU });
        }
      }

      /* ===== panel inferior derecho: ventaja sobre el ion lento ===== */
      const QX = 322, QY = 208, QW = 304, QH = 138;
      g.rect(QX, QY, QW, QH, { fill: C.panel, stroke: C.linea, r: 6 });
      g.texto('Ventaja sobre el ion lento', QX + 8, QY + 12, { size: 10.5, color: C.texto2, weight: 600 });
      const hx0 = QX + 30, hx1 = QX + QW - 14, hy0 = QY + 28, hy1 = QY + QH - 26;
      const hX = (d) => hx0 + (d / L) * (hx1 - hx0);
      const hY = (v) => hy1 - (v / dMax) * (hy1 - hy0);
      g.linea([[hx0, hy0], [hx0, hy1]], { color: C.tenue, lw: 0.8 });
      g.linea([[hx0, hy1], [hx1, hy1]], { color: C.tenue, lw: 1 });
      g.texto('0', hx0 - 5, hy1, { size: 9, color: C.tenue, align: 'right' });
      g.texto('1 mm', hx0 - 4, hY(1e-3), { size: 9, color: C.tenue, align: 'right', alpha: dMax > 1e-3 ? 1 : 0 });
      if (dMax > 1e-3) g.linea([[hx0, hY(1e-3)], [hx0 + 4, hY(1e-3)]], { color: C.tenue, lw: 0.8 });
      g.texto('distancia recorrida →', hx1, hy1 + 12, { size: 9, color: C.tenue, align: 'right' });
      g.texto('detector', hx1, hy0 - 8, { size: 9, color: C.tenue, align: 'right' });
      g.linea([[hx1, hy0 - 2], [hx1, hy1]], { color: C.metalOsc, lw: 1, dash: [2, 3] });
      const dAct = con[0](s);
      const trazar = (c, idx, op) => {
        const pts = [];
        for (const fila of c) { if (fila[0] > dAct + 1e-9) break; pts.push([hX(fila[0]), hY(fila[idx])]); }
        if (pts.length > 1) g.linea(pts, op);
      };
      if (t > 1.5) {
        const aSin = tramo(t, 14.6, 15.2);
        if (aSin > 0) for (const idx of [1, 2]) {
          const pts = cSin.map((f) => [hX(f[0]), hY(f[idx])]);
          g.linea(pts, { color: C.tenue, lw: 1.4, dash: [4, 4], alpha: aSin * aFin });
        }
        trazar(cCon, 1, { color: C.ion, lw: 1.4, alpha: 0.6 * aFin });
        trazar(cCon, 2, { color: C.ion, lw: 2, alpha: aFin });
        if (aSin > 0) {
          g.texto('sin retardo', hx1 - 4, Math.max(hy0 + 12, hY(cSin[cSin.length - 1][2]) - 9), { size: 9.5, color: C.texto2, align: 'right', alpha: aSin * aFin });
          g.texto('con retardo', hx1 - 4, hy1 - 9, { size: 9.5, color: C.ion, align: 'right', alpha: aSin * aFin });
        }
        if (t > 8 && t < 14.6) g.texto('rápido', hX(cCon[60][0]) + 4, hY(cCon[60][2]) - 8, { size: 9.5, color: C.ion, alpha: tramo(t, 9, 9.5) });
      }
    },
  };
}
