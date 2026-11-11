// Reflectrón: enfoque de energía en un analizador de tiempo de vuelo.
// Dos iones de la misma m/z salen a la vez con energías E(1 ± 4 %). Primero vuelan en línea recta (reflector apagado): el rápido
// llega antes y el pico se ensancha. Después el reflector los frena y los devuelve: el rápido penetra más, recorre más camino y
// ambos llegan juntos. Las trayectorias se integran con el campo real de cada diseño (1 etapa uniforme, 2 etapas o campo «ideal»
// de gradiente continuo); los campos se han calculado para esta geometría de modo que el tiempo total no dependa de la energía
// (1.er orden con una etapa, 2.º orden con dos etapas o con el campo continuo). Las velocidades transversales están exageradas.
// Parámetros: p.etapas (1 | 2, por defecto 2) · p.campo ('ideal' = placas apiladas con potencial calculado, como el iRefTOF)
//   p.nombre (texto: 'iRefTOF', 'espejo de dos etapas'…) · p.rejillas (true: dibuja rejillas en la entrada y entre etapas)
//   p.lineal (true: hay un detector lineal real detrás del reflector, como en el microflex) · p.detector (rótulo del detector).
import { tramo, suave, lerp } from '../dibujo.js';
import { gauss, panelSenal, destello, leyendaTrazos } from './_util-analizadores.js';

const TAN = 0.10, CS = Math.cos(Math.atan(TAN)), SN = Math.sin(Math.atan(TAN));
// Campos (deceleración en px/u², con v0 = 1 px/u) resueltos numéricamente para esta geometría: L = 596/cos θ.
const CAMPOS = {
  1: { a: () => 0.00332248, largo: 175 },
  2: { a: (x) => (x < 40 ? 0.00915863 : 0.00481949), largo: 96, corte: 40 },
  ideal: { a: (x) => 0.00501761 + (0.01091189 - 0.00501761) * 0.5 * (1 - Math.tanh((x - 30) / 14)), largo: 92 },
};

export default function crear(p = {}) {
  const ideal = p.campo === 'ideal';
  const etapas = p.etapas === 1 ? 1 : 2;
  const modo = ideal ? 'ideal' : etapas;
  const F = CAMPOS[modo];
  const nombre = p.nombre || (ideal ? 'reflectrón de campo calculado' : etapas === 1 ? 'reflectrón de una etapa' : 'reflectrón de dos etapas');
  const lineal = !!p.lineal;
  const nomDet = p.detector || 'Detector';

  // geometría (px)
  const SX = 64, SY = 62, XR = 360, XLIN = 575, XDET = 64;
  const LIN = (XR - SX) / CS;                       // tramo de ida hasta la entrada del reflector
  const KT = 175;                                   // unidades de tiempo de la integración por segundo de animación
  const T1 = 0.9, T2 = 7.0, dur = 19;
  const dE = 0.04;

  /** Integra la penetración en el campo: devuelve { prof: [x(τ)], dt, tr } para la componente vx. */
  function reflejo(vx) {
    const dt = 0.5, prof = [0];
    let x = 0, v = vx, tr = 0;
    const f = (x) => F.a(Math.max(0, x));
    for (let i = 0; i < 20000; i++) {
      const k1x = v, k1v = -f(x), k2x = v + k1v * dt / 2, k2v = -f(x + k1x * dt / 2);
      const k3x = v + k2v * dt / 2, k3v = -f(x + k2x * dt / 2), k4x = v + k3v * dt, k4v = -f(x + k3x * dt);
      const nx = x + (dt / 6) * (k1x + 2 * k2x + 2 * k3x + k4x), nv = v + (dt / 6) * (k1v + 2 * k2v + 2 * k3v + k4v);
      if (nx <= 0) { tr = i * dt + dt * (x / (x - nx)); prof.push(0); break; }
      x = nx; v = nv; prof.push(x);
    }
    return { prof, dt, tr, max: Math.max(...prof) };
  }
  /** Ion con energía relativa (1 + d): tiempos y posición en función de τ. */
  function hacerIon(d, y0 = SY) {
    const v = Math.sqrt(1 + d);
    const tIn = LIN / v, R = reflejo(v * CS), tOut = tIn + R.tr, tArr = tOut + LIN / v;
    const tLin = (XLIN - SX) / CS / v;
    return {
      v, tIn, tOut, tArr, tLin, prof: R.max,
      // con el reflector encendido
      pos(tau) {
        if (tau <= tIn) return [SX + v * CS * tau, y0 + v * SN * tau];
        if (tau <= tOut) {
          const s = (tau - tIn) / R.dt, i = Math.min(R.prof.length - 2, Math.floor(s));
          return [XR + lerp(R.prof[i], R.prof[i + 1], s - i), y0 + v * SN * tau];
        }
        return [XR - v * CS * (tau - tOut), y0 + v * SN * tau];
      },
      // en línea recta (reflector apagado)
      posLin(tau) { return [SX + v * CS * tau, y0 + v * SN * tau]; },
    };
  }
  const rap = hacerIon(dE, SY - 5), len = hacerIon(-dE, SY + 5), nom = hacerIon(0);
  const YDET = SY + SN * nom.tArr;                  // altura a la que llegan al detector de reflexión
  const YLIN = SY + SN * nom.tLin;
  // distribución de energías para los picos (−4 % … +4 %)
  const dist = Array.from({ length: 41 }, (_, i) => hacerIon(-dE * 1.25 + (2.5 * dE * i) / 40));
  const pesos = dist.map((I) => Math.exp(-0.5 * ((I.v * I.v - 1) / (dE * 0.6)) ** 2));
  const sumaP = pesos.reduce((a, b) => a + b, 0);
  const VENT = 0.03;                                // semiventana relativa de los paneles de señal
  const anchoMin = 0.0016;                          // anchura mínima de un pico (otras contribuciones, no simuladas)

  const llegaLin = T1 + Math.min(rap.tLin, len.tLin) / KT, llegaLin2 = T1 + Math.max(rap.tLin, len.tLin) / KT;
  const llegaRef = T2 + nom.tArr / KT;
  const tDentro = T2 + (rap.tIn + rap.tOut) / 2 / KT;

  const txtVar = ideal
    ? `En el ${nombre}, las placas apiladas reproducen una distribución de potencial calculada como ideal, que compensa la dispersión de energía sin perder resolución ni transmisión.`
    : etapas === 2
      ? `En el ${nombre}, una primera zona de campo intenso frena bruscamente los iones y una segunda, más suave, los devuelve. Compensa mejor la dispersión de energía (enfoque de segundo orden) en menos espacio.`
      : `En el ${nombre}, con un campo uniforme, la compensación es de primer orden y el reflector debe ser largo: los iones penetran una cuarta parte de su recorrido libre.`;

  return {
    titulo: 'Reflectrón: enfoque de energía',
    dur,
    fases: [
      { t: 0, texto: 'Dos iones con la misma m/z salen de la fuente a la vez, pero con energías cinéticas algo distintas, porque en la fuente nunca son exactamente iguales. El más energético es también el más rápido.' },
      { t: 2.2, texto: 'Sin reflector, en vuelo recto, el ion rápido llega antes que el lento. Los iones de una misma m/z se reparten en el tiempo, el pico se ensancha y la resolución empeora.' },
      { t: 6.0, texto: 'Con el reflector encendido, los electrodos apilados crean un campo que frena los iones y los devuelve hacia el detector. El ion rápido penetra más en el campo y recorre un camino más largo.' },
      { t: tDentro + 0.6, texto: 'Ese camino extra compensa su mayor velocidad: llega al detector a la vez que el lento. Todos los iones de esa m/z se juntan en un pico estrecho y la resolución aumenta.' },
      { t: llegaRef + 0.8, texto: txtVar },
    ],
    dibujar(g, t) {
      const C = g.C;
      const col = C.m[0];
      const fa = 1 - tramo(t, dur - 0.7, dur);
      const on = suave(tramo(t, 6.0, 6.8));        // reflector encendido
      const pasada = t < 6.0 ? 1 : 2;

      /* --- tubo, fuente y detectores --- */
      g.camara(40, 36, 580, 176, {});
      g.electrodo(SX - 18, SY - 16, 8, 32, { color: C.metalOsc });
      g.rotulo('Fuente', SX - 14, SY - 22, { size: 11 });
      g.electrodo(XDET - 18, YDET - 18, 9, 36, { color: C.metalOsc, alpha: 0.5 + 0.5 * on });
      g.rotulo(nomDet, XDET + 10, YDET + 30, { size: 11, align: 'left', alpha: 0.5 + 0.5 * on });
      // detector lineal (real o de comparación)
      if (lineal) g.electrodo(XLIN, YLIN - 20, 9, 40, { color: C.metalOsc });
      else g.rect(XLIN, YLIN - 20, 9, 40, { stroke: C.metalOsc, lw: 1.2, r: 2, alpha: 0.4 + 0.6 * (1 - on) });
      g.rotulo(lineal ? 'Detector lineal' : 'Vuelo recto (comparación)', lineal ? XLIN + 9 : XLIN + 9, YLIN + 34, { size: 10.5, align: 'right', alpha: 0.45 + 0.55 * (1 - on) });

      /* --- reflector: anillos apilados --- */
      const nAn = Math.round(F.largo / 11);
      for (let i = 0; i <= nAn; i++) {
        const x = XR + (i * F.largo) / nAn;
        // potencial relativo del anillo (0 en la entrada, 1 al fondo): se colorea al encenderse
        const k = potencial(x - XR);
        const fill = on > 0 ? mezcla(C.metal, C.ion, on * (0.25 + 0.75 * k)) : C.metal;
        g.electrodo(x - 2.5, 40, 5, 17, { color: fill });
        g.electrodo(x - 2.5, 191, 5, 17, { color: fill });
      }
      if (p.rejillas) {
        const xs = [XR - 3]; if (F.corte) xs.push(XR + F.corte);
        for (const x of xs) g.linea([[x, 57], [x, 191]], { color: C.metalOsc, lw: 1, dash: [2, 3], alpha: 0.8 });
      }
      // perfil de potencial sobre el reflector
      const xr1 = XR + F.largo;
      g.rotulo(cap(nombre), (XR + xr1) / 2 + 40, 222, { size: 11, color: on > 0.5 ? C.ion : C.texto2 });
      if (on > 0) {
        const pts = [];
        for (let x = XR - 24; x <= xr1; x += 2) pts.push([x, 28 - 22 * potencial(x - XR) * on]);
        g.linea(pts, { color: C.ion, lw: 1.6, alpha: on });
        g.texto('potencial', xr1 + 8, 8, { size: 10.5, color: C.ion, weight: 600, alpha: on });
        for (let y = 90; y <= 150; y += 30) g.flecha(xr1 - 8, y, xr1 - 38, y, { color: C.campo, lw: 1.1, punta: 5, alpha: 0.8 * on });
        if (F.corte && !ideal) {
          g.texto('1.ª etapa', XR + F.corte / 2, 66, { size: 9.5, color: C.texto2, align: 'center', weight: 600, alpha: on });
          g.texto('2.ª etapa', XR + (F.corte + F.largo) / 2, 66, { size: 9.5, color: C.texto2, align: 'center', weight: 600, alpha: on });
        }
      }
      // rótulo de la pasada
      const tag = pasada === 1 ? 'Sin reflector' : 'Con reflector';
      g.rotulo(tag, 92, 16, { size: 11.5, color: pasada === 1 ? C.texto2 : C.ion, alpha: pasada === 1 ? 1 - tramo(t, 5.4, 6) : tramo(t, 6, 6.6) });

      /* --- iones y estelas --- */
      const ionAt = (I, tau, refl) => (refl ? I.pos(tau) : I.posLin(tau));
      const dibujaIon = (I, rapido, T0, refl, tFin) => {
        const tau = (t - T0) * KT;
        if (tau < 0) return;
        const fin = refl ? I.tArr : I.tLin;
        const tt = Math.min(tau, fin);
        const pts = [];
        for (let k = 0; k <= 70; k++) pts.push(ionAt(I, (tt * k) / 70, refl));
        const aTr = (refl ? 1 : 1 - tramo(t, 5.4, 6.0)) * fa;
        g.linea(pts, { color: col, lw: rapido ? 2 : 1.6, dash: rapido ? null : [5, 4], alpha: 0.75 * aTr });
        if (tau < fin) {
          const [x, y] = ionAt(I, tau, refl);
          g.ion(x, y, { r: 6.5, color: col, brillo: rapido, alpha: fa });
        } else {
          const [x, y] = ionAt(I, fin, refl);
          destello(g, x + (refl ? -4 : 4), y, tramo(t, T0 + fin / KT, T0 + fin / KT + 0.5), { color: col });
        }
        if (refl && tau > I.tOut && t < tFin) {
          // marca de la profundidad alcanzada
          const xm = XR + I.prof;
          g.linea([[xm, 66 + 30], [xm, 66 + 34 + 70]], { color: col, lw: 1, dash: [2, 2], alpha: 0.6 * fa });
        }
      };
      if (pasada === 1) {
        if (t > 0.4 && t < T1) g.circulo(SX, SY, 6 + 8 * tramo(t, 0.4, T1), { fill: C.foton, alpha: 0.3 * (1 - tramo(t, 0.4, T1)) });
        dibujaIon(len, false, T1, false); dibujaIon(rap, true, T1, false);
      } else {
        dibujaIon(len, false, T2, true, dur); dibujaIon(rap, true, T2, true, dur);
      }
      // etiquetas de los dos iones al salir
      const tE = pasada === 1 ? T1 : T2;
      const kE = tramo(t, tE + 0.2, tE + 0.6) * (1 - tramo(t, tE + 2.4, tE + 2.9));
      if (kE > 0) {
        const tau = (t - tE) * KT;
        const [xr, yr] = pasada === 1 ? rap.posLin(tau) : rap.pos(tau);
        const [xl, yl] = pasada === 1 ? len.posLin(tau) : len.pos(tau);
        g.texto('E + ΔE', xr + 2, yr - 15, { size: 10.5, color: col, weight: 700, alpha: kE });
        g.texto('E − ΔE', xl - 4, yl + 17, { size: 10.5, color: C.texto2, weight: 700, alpha: kE, align: 'right' });
      }
      leyendaTrazos(g, [[col, 'más energía'], [col, 'menos energía', [5, 4]]], 152, 16, { size: 10.5 });

      /* --- paneles de señal --- */
      const picos = (refl) => dist.map((I, i) => {
        const tn = refl ? nom.tArr : nom.tLin, ti = refl ? I.tArr : I.tLin;
        return { u: 0.5 + (ti / tn - 1) / (2 * VENT), s: anchoMin / (2 * VENT), a: (0.95 * pesos[i]) / sumaP, color: col };
      });
      const k1 = tramo(t, llegaLin - 0.15, llegaLin2 + 0.15);
      const tk1 = t < T1 ? 0 : k1;
      const ticks = [[0.5 - 0.02 / (2 * VENT), '−2 %'], [0.5, 't₀'], [0.5 + 0.02 / (2 * VENT), '+2 %']];
      const P1 = panelSenal(g, 10, 236, 306, 116, { titulo: 'Sin reflector', nota: 'intensidad ×3', ticks, picos: picos(false), u1: tk1, cursor: false, alpha: fa, escala: 3 });
      const k2 = t < T2 ? 0 : tramo(t, llegaRef - 0.15, llegaRef + 0.15);
      const P2 = panelSenal(g, 324, 236, 306, 116, { titulo: 'Con reflector', nota: 'tiempo de llegada', ticks, picos: picos(true), u1: k2, cursor: false, alpha: fa, escala: 1 });
      // marcas de llegada de los dos iones destacados
      const marca = (P, I, refl, k) => {
        if (k <= 0) return;
        const tn = refl ? nom.tArr : nom.tLin, ti = refl ? I.tArr : I.tLin;
        const x = P.X(0.5 + (ti / tn - 1) / (2 * VENT));
        g.linea([[x, P.yb], [x, P.yb - 8]], { color: col, lw: 2, alpha: k * fa });
      };
      const k1b = t >= T1 && t < 6 + 13 ? 1 : 0;
      if (t >= llegaLin) marca(P1, rap, false, k1b * fa);
      if (t >= llegaLin2) marca(P1, len, false, k1b * fa);
      if (t >= llegaRef) { marca(P2, rap, true, fa); marca(P2, len, true, fa); }
      if (t >= llegaLin2 + 0.2) {
        const xa = P1.X(0.5 + (rap.tLin / nom.tLin - 1) / (2 * VENT)), xb = P1.X(0.5 + (len.tLin / nom.tLin - 1) / (2 * VENT));
        g.linea([[xa, P1.yt + 2], [xb, P1.yt + 2]], { color: C.mal, lw: 1.2, alpha: fa });
        g.texto('Δt', (xa + xb) / 2, P1.yt - 5, { size: 10.5, color: C.mal, weight: 700, align: 'center', alpha: fa });
      }
    },
  };

  /** Potencial relativo (0 en la entrada, 1 al fondo) del campo elegido: integral de a(x). */
  function potencial(x) {
    if (x <= 0) return 0;
    let s = 0, tot = 0;
    const n = 40;
    for (let i = 0; i < n; i++) { const xx = ((i + 0.5) / n) * F.largo; const a = F.a(xx); tot += a; if (xx < x) s += a; }
    return Math.min(1, s / tot);
  }
}

/** Mayúscula inicial salvo en nombres propios como «iRefTOF». */
function cap(s) { return /^[a-záéíóú]{2}/.test(s) ? s.charAt(0).toUpperCase() + s.slice(1) : s; }
/** Mezcla dos colores #rrggbb. */
function mezcla(a, b, k) {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const c = [16, 8, 0].map((s) => Math.round(((pa >> s) & 255) * (1 - k) + ((pb >> s) & 255) * k));
  return '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
}
