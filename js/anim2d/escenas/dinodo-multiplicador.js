// Detector de dínodo de conversión fuera de eje + multiplicador de electrones.
// Corte esquemático: el haz sale del analizador; el campo del dínodo (fuera del eje) atrae a los iones, mientras fotones y neutros siguen
// recto. Cada impacto libera partículas secundarias que entran en el multiplicador, donde la avalancha produce un pulso medible.
// Todo es función de t (sin estado).
// Parámetros:
//   p.tipo: 'continuo' (bocina de dínodo continuo, Agilent 5977) · 'discreto' (dínodos discretos, el ion golpea el 1.er dínodo; Agilent 7900)
//           · 'conversion' (dínodo de conversión + multiplicador de electrones secundarios sin tipo especificado; Shimadzu 8060NX, sector).
//   p.origen (texto del analizador de procedencia), p.dibujoOrigen ('barras' | 'rendija'), p.lente (bool: dibuja la lente de salida),
//   p.vDinodo (texto, p. ej. '≈ −10 kV'), p.nombreDinodo, p.vMult (texto, tensión del multiplicador), p.ganancia (texto, p. ej. '10⁵–10⁶'),
//   p.dual (bool: recuento de pulsos + modo analógico), p.rango (texto del rango dinámico), p.modo ('pulsos' | 'corriente'),
//   p.final (texto opcional de la última fase).
import { tramo, suave, easeOut, lerp, azar, clamp } from '../dibujo.js';
import { bez, recorrido } from './_util-servicios.js';

const AX = 136;            // eje del analizador
const D = [238, 300];      // punto de impacto en el dínodo de conversión / primer dínodo
const MB = [322, 290];     // boca del multiplicador continuo

export default function crear(p = {}) {
  const tipo = ['continuo', 'discreto', 'conversion'].includes(p.tipo) ? p.tipo : 'continuo';
  const origen = p.origen || 'Cuadrupolo';
  const rendija = p.dibujoOrigen === 'rendija';
  const lente = p.lente ?? tipo !== 'discreto';
  const vD = p.vDinodo ?? (tipo === 'continuo' ? '≈ −10 kV' : null);
  const nomD = p.nombreDinodo || (tipo === 'continuo' ? 'HED' : tipo === 'discreto' ? '1.er dínodo' : 'Dínodo de conversión');
  const vM = p.vMult ?? (tipo === 'continuo' ? '1000–3000 V' : null);
  const gan = p.ganancia ?? (tipo === 'continuo' ? '10⁵–10⁶' : null);
  const dual = p.dual ?? tipo === 'discreto';
  const modo = p.modo || 'corriente';
  const R = azar(31);
  const altura = Array.from({ length: 8 }, () => 0.55 + R() * 0.45); // dispersión de altura de los pulsos

  /* --- geometría del multiplicador --- */
  const horn = recorrido([[MB[0], MB[1]], [372, 292], [420, 292], [466, 287], [506, 274], [536, 256], [556, 234], [566, 212]]);
  const anchoH = (s) => (s < 0.16 ? lerp(30, 9, suave(s / 0.16)) : 9);
  const din = Array.from({ length: 8 }, (_, i) => [300 + i * 36, i % 2 ? 318 : 262]); // dínodos 2…9 (o 1…8 del multiplicador)
  const ANODO = [598, 290];
  const MID = 3; // dínodo intermedio de la salida analógica

  /* --- textos --- */
  const desv = tipo === 'discreto'
    ? `Los iones que salen del ${origen.toLowerCase()} se desvían hacia el detector, situado fuera del eje. Los fotones y las partículas neutras siguen en línea recta y no generan señal, lo que mantiene el fondo muy bajo.`
    : `Los iones que salen del ${origen === 'Q3' ? 'tercer cuadrupolo (Q3)' : origen.toLowerCase()} llegan acompañados de fotones y de especies neutras. El campo del dínodo, situado fuera del eje, atrae a los iones; fotones y neutros siguen en línea recta y no alcanzan el multiplicador.`;
  const impacto = tipo === 'continuo'
    ? `Acelerados por la alta tensión del dínodo${vD ? ` (${vD})` : ''}, los iones positivos lo golpean con energías de varios keV y arrancan partículas secundarias, sobre todo electrones. La alta energía de impacto iguala la eficiencia de detección de iones ligeros y pesados.`
    : tipo === 'discreto'
      ? 'Cada ion choca contra el primer dínodo, a alta tensión negativa, y arranca varios electrones secundarios de su superficie. Estos se aceleran hacia el dínodo siguiente.'
      : `El dínodo está a alta tensión de signo contrario al del ion${vD ? ` (${vD})` : ''}. Un ion positivo lo golpea con mucha energía y libera electrones secundarios, que van al multiplicador. Para iones negativos se invierte la polaridad y se liberan iones positivos.`;
  const cascada = tipo === 'continuo'
    ? `La bocina está recubierta de un material resistivo de alta emisión secundaria y entre su entrada y su salida hay ${vM ? vM : 'una diferencia de potencial'}. Cada electrón que golpea la pared libera 2–3 electrones, que el campo acelera hasta el siguiente choque: la cascada crece exponencialmente.`
    : 'Los dínodos están a potenciales cada vez más positivos. Los electrones se aceleran de uno a otro y en cada choque se multiplican, porque cada uno arranca varios electrones nuevos: la cascada crece exponencialmente.';
  const pulso = tipo === 'discreto'
    ? 'Al ánodo llega un pulso breve por cada ion. Con señales bajas los pulsos se cuentan uno a uno (modo de pulsos). Con señales altas el recuento se saturaría, y se mide la corriente en un dínodo intermedio (modo analógico).'
    : `Al final de la cascada llegan ${gan ? `del orden de ${gan} electrones` : 'muchos electrones'} en un intervalo muy corto: un pulso de corriente por cada ion. ${modo === 'pulsos' ? 'La electrónica cuenta los pulsos (conteo de pulsos).' : 'La electrónica amplifica y digitaliza la señal, que da la abundancia de cada m/z.'}`;
  const final = p.final || (tipo === 'continuo'
    ? 'Con el uso la superficie emisora se desgasta y la ganancia baja. El autotune lo compensa subiendo la tensión del multiplicador (EM Volts); cuando la tensión necesaria es excesiva, el multiplicador se sustituye.'
    : tipo === 'discreto'
      ? `El equipo calibra un modo frente al otro y los combina en una sola escala de cuentas por segundo${p.rango ? `: ${p.rango}` : ''}.`
      : `${p.rango ? `Rango dinámico: ${p.rango}. ` : ''}La ganancia disminuye con el uso; el autotune ajusta la tensión del multiplicador para compensar el envejecimiento.`);

  /* --- tiempos del ion protagonista (lento) y de los siguientes (rápidos) --- */
  // escala: [ion: 0.3→3.6] [secundarias: 4.0→6.4] [cascada: 6.6→11.2] [pulso: 11.2]
  const LENTO = { i0: 0.3, i1: 3.6, e0: 4.0, e1: 6.4, c0: 6.6, c1: 11.2 };
  const rapidos = [0, 1, 2, 3, 4].map((k) => {
    const s = 11.9 + k * 1.15;
    return { i0: s, i1: s + 0.45, e0: s + 0.5, e1: s + 0.7, c0: s + 0.72, c1: s + 1.25 };
  });
  const todos = [LENTO, ...rapidos];
  const pulsos = todos.map((ev, i) => ({ t: ev.c1, a: i === 0 ? 1 : altura[i] }));

  function posIon(k) {
    if (k < 0.42) return [lerp(14, 152, k / 0.42), AX];
    return bez([152, AX], [228, AX + 4], [D[0] - 4, D[1] - 6], (k - 0.42) / 0.58);
  }

  function dibujarEvento(g, t, ev, lento) {
    const C = g.C;
    // ion
    if (t >= ev.i0 && t < ev.i1) {
      const k = tramo(t, ev.i0, ev.i1), [x, y] = posIon(easeOut(k) * 0.3 + k * 0.7);
      g.ion(x, y, { r: lento ? 6.5 : 5, brillo: lento });
    }
    // destello del impacto
    if (t >= ev.i1 && t < ev.i1 + (lento ? 0.5 : 0.25)) {
      const k = tramo(t, ev.i1, ev.i1 + (lento ? 0.5 : 0.25));
      g.circulo(D[0] - 4, D[1] - 6, 6 + 18 * k, { stroke: C.ion, lw: 1.6, alpha: 1 - k });
    }
    // partículas secundarias hacia el multiplicador
    if (t >= ev.e0 - (lento ? 0.35 : 0.05) && t < ev.e1) {
      const k = suave(tramo(t, ev.e0 - (lento ? 0.35 : 0.05), ev.e1));
      const dest = tipo === 'continuo' ? MB : din[0];
      const ctrl = tipo === 'continuo' ? [282, 324] : [262, 252];
      for (let j = 0; j < 3; j++) {
        const [x, y] = bez([D[0] - 4 + j * 3, D[1] - 8], [ctrl[0] + (j - 1) * 6, ctrl[1] + (j - 1) * 4], [dest[0] - 2, dest[1] + (j - 1) * 5 + (tipo === 'continuo' ? 0 : 6)], k);
        g.electron(x, y, { r: lento ? 3 : 2.4 });
      }
      if (lento && k > 0.1 && k < 0.95) g.texto('e⁻ secundarios', 262, tipo === 'continuo' ? 250 : 236, { size: 10.5, color: C.e, weight: 700, align: 'center', alpha: suave(tramo(k, 0.1, 0.25)) });
    }
    // cascada
    if (t >= ev.c0 && t < ev.c1 + 0.05) {
      const q = tramo(t, ev.c0, ev.c1);
      if (tipo === 'continuo') cascadaBocina(g, q, lento);
      else cascadaDinodos(g, q, lento);
    }
    // llegada al colector / ánodo
    if (t >= ev.c1 && t < ev.c1 + 0.4) {
      const k = tramo(t, ev.c1, ev.c1 + 0.4), A = tipo === 'continuo' ? [566, 200] : ANODO;
      g.circulo(A[0], A[1], 6 + 14 * k, { fill: C.e, alpha: 0.35 * (1 - k) });
    }
  }

  function cascadaBocina(g, q, lento) {
    const C = g.C, hits = 9, s0 = 0.05, ds = 0.1;
    const s = lerp(0.0, 0.98, q);
    const kk = clamp(Math.floor((s - s0) / ds), -1, hits - 1);
    const nE = Math.round(2.5 ** Math.max(0, kk + 1));
    const nDib = Math.min(lento ? 22 : 12, nE);
    for (let j = 0; j < nDib; j++) {
      const RJ = azar(100 + j);
      const sj = clamp(s - (RJ() * 0.04 * Math.min(1, nDib / 6)), 0, 0.99);
      const kj = Math.floor((sj - s0) / ds);
      const f = kj < 0 ? sj / s0 : ((sj - s0) % ds) / ds;
      const lado0 = kj < 0 ? 0 : (kj % 2 ? 1 : -1), lado1 = kj < 0 ? -1 : -lado0;
      const P = horn(sj), w = anchoH(sj) * 0.82;
      const lat = lerp(lado0, lado1, f) * w + (RJ() - 0.5) * 3;
      g.electron(P.x + P.nx * lat, P.y + P.ny * lat, { r: lento ? 2.4 : 2 });
    }
    if (lento) {
      const P = horn(s), sube = P.y < 240;
      const txt = nE < 1000 ? `${nE} e⁻` : nE < 1e5 ? `≈ ${Math.round(nE / 1000)}·10³ e⁻` : (gan ? `≈ ${gan} e⁻` : 'muchos e⁻');
      g.texto(txt, P.x + (sube ? -22 : 0), P.y + (sube ? 0 : 26), { size: 10.5, color: C.e, weight: 700, align: sube ? 'right' : 'center' });
    }
  }

  function cascadaDinodos(g, q, lento) {
    const C = g.C, nSalt = din.length; // saltos: din[0]→din[1] … din[7]→ánodo
    const f = q * nSalt, i = Math.min(nSalt - 1, Math.floor(f)), r = f - i;
    const a = din[i], b = i + 1 < din.length ? din[i + 1] : ANODO;
    const nE = Math.round(3 * 2.6 ** i);
    const nDib = Math.min(lento ? 20 : 12, nE);
    for (let j = 0; j < nDib; j++) {
      const RJ = azar(300 + j);
      const rr = clamp(r - RJ() * 0.18 * Math.min(1, nDib / 8));
      const off = (RJ() - 0.5) * Math.min(16, 3 + nDib);
      const ya = a[1] + (a[1] > 290 ? -5 : 5), yb = b === ANODO ? b[1] : b[1] + (b[1] > 290 ? -5 : 5);
      g.electron(lerp(a[0], b[0], rr) + off * 0.4, lerp(ya, yb, rr) + off, { r: lento ? 2.3 : 1.9 });
    }
    if (lento) g.texto(nE < 1000 ? `${nE} e⁻` : 'muchos e⁻', lerp(a[0], b[0], r), 290, { size: 10.5, color: C.e, weight: 700, align: 'center' });
  }

  return {
    titulo: tipo === 'continuo' ? 'Dínodo de alta energía y multiplicador' : tipo === 'discreto' ? 'Multiplicador de dínodos discretos' : 'Dínodo de conversión y multiplicador',
    dur: 18,
    fases: [
      { t: 0, texto: desv },
      { t: 3.4, texto: impacto },
      { t: 6.6, texto: cascada },
      { t: 11.2, texto: pulso },
      { t: 15, texto: final },
    ],
    dibujar(g, t) {
      const C = g.C;
      /* --- cámara --- */
      g.camara(6, 28, 628, 326, {});
      /* --- analizador de procedencia --- */
      if (rendija) {
        g.electrodo(96, AX - 46, 10, 40, {}); g.electrodo(96, AX + 6, 10, 40, {});
      } else {
        g.rect(14, AX - 26, 92, 12, { fill: C.metal, stroke: C.metalOsc, lw: 0.8, r: 6 });
        g.rect(14, AX + 14, 92, 12, { fill: C.metal, stroke: C.metalOsc, lw: 0.8, r: 6 });
      }
      g.rotulo(origen, 60, AX - 44, { size: 11 });
      if (lente) {
        g.electrodo(124, AX - 32, 7, 24, {}); g.electrodo(124, AX + 8, 7, 24, {});
        g.rotulo('Lente de salida', 128, AX + 50, { size: 10 });
      }

      /* --- dínodo de conversión / primer dínodo --- */
      const brD = tramo(t, 3.4, 4) * (1 - tramo(t, 6, 7));
      g.linea([[D[0] - 34, D[1] + 4], [D[0] + 30, D[1] - 6], [D[0] + 32, D[1] + 4], [D[0] - 32, D[1] + 13]], { fill: C.metal, color: C.metalOsc, lw: 0.8, cerrar: true });
      if (brD > 0) g.circulo(D[0], D[1], 22, { fill: C.anion, alpha: 0.07 * brD });
      g.rotulo(nomD, D[0], D[1] + 30, { size: 11 });
      if (vD) g.texto(vD, D[0], D[1] + 47, { size: 10.5, color: C.texto2, align: 'center', weight: 600 });
      // líneas de campo que sacan a los iones del eje
      const kCampo = tramo(t, 0.6, 1.6) * (1 - tramo(t, 6, 7)) * 0.8 + 0.2;
      for (let i = 0; i < 3; i++) {
        g.curva([[150 + i * 16, AX + 12], [196 + i * 10, AX + 40 + i * 8], [D[0] - 14 + i * 12, D[1] - 22]], { color: C.campo, lw: 1, dash: [4, 4], alpha: kCampo });
      }

      /* --- multiplicador --- */
      if (tipo === 'continuo') {
        const N = 60, ext = [], int = [], ext2 = [], int2 = [];
        for (let i = 0; i <= N; i++) {
          const s = i / N, P = horn(s), w = anchoH(s);
          int.push([P.x + P.nx * w, P.y + P.ny * w]); int2.push([P.x - P.nx * w, P.y - P.ny * w]);
          ext.push([P.x + P.nx * (w + 6), P.y + P.ny * (w + 6)]); ext2.push([P.x - P.nx * (w + 6), P.y - P.ny * (w + 6)]);
        }
        g.linea([...ext, ...int.slice().reverse()], { fill: C.metal, color: C.metalOsc, lw: 0.7, cerrar: true, alpha: 0.9 });
        g.linea([...ext2, ...int2.slice().reverse()], { fill: C.metal, color: C.metalOsc, lw: 0.7, cerrar: true, alpha: 0.9 });
        // colector
        g.electrodo(556, 194, 20, 7, {});
        g.rotulo('Colector', 566, 174, { size: 10 });
        g.rotulo(`Multiplicador (bocina)${vM ? ' · ' + vM : ''}`, 430, 244, { size: 10.5 });
      } else {
        for (let i = 0; i < din.length; i++) {
          const [x, y] = din[i], arr = y < 290;
          const pts = [];
          for (let k = 0; k <= 8; k++) { const a = Math.PI * (0.15 + 0.7 * k / 8); pts.push([x + Math.cos(a) * 15 * (arr ? -1 : 1), y + Math.sin(a) * 7 * (arr ? -1 : 1) + (arr ? -2 : 2)]); }
          g.linea(pts, { color: C.metalOsc, lw: 4.5 });
          g.linea(pts, { color: C.metal, lw: 2.5 });
        }
        g.electrodo(ANODO[0] - 3, ANODO[1] - 22, 7, 44, {});
        g.rotulo(dual ? 'Ánodo · pulsos' : 'Ánodo', 594, 330, { size: 10 });
        g.rotulo(tipo === 'conversion' ? 'Multiplicador (esquema)' : 'Dínodos', 430, 224, { size: 10.5 });
        g.texto('potencial cada vez más positivo →', 430, 242, { size: 9.5, color: C.tenue, align: 'center' });
        if (dual) {
          const [x, y] = din[MID];
          g.linea([[x, y + 8], [x, y + 20], [x + 34, y + 20]], { color: C.acento, lw: 1.4 });
          g.rotulo('Salida analógica', x + 82, y + 20, { size: 10, color: C.acento });
        }
      }

      /* --- fotones y neutros: siguen recto --- */
      for (let i = 0; i < 3; i++) {
        const x = 110 + ((t * (560 * 8 / 18) + i * 190) % 560); // periodos enteros en 18 s: bucle sin saltos
        if (x < 610) g.foton(x, AX, Math.min(632, x + 26), AX, { amp: 3, long: 7, lw: 1.4, alpha: 0.85 });
        const xn = 110 + ((t * (540 * 3 / 18) + i * 180 + 60) % 540);
        if (xn < 624) g.molecula(xn, AX + (i - 1) * 3, { r: 2.6, n: 3, rot: t + i, semilla: 40 + i, alpha: 0.6 });
      }
      g.rotulo('Fotones y neutros: siguen recto', 296, AX - 24, { size: 10 });

      /* --- iones, secundarias y cascada --- */
      for (let i = 0; i < todos.length; i++) dibujarEvento(g, t, todos[i], i === 0);

      /* --- señal de salida --- */
      const GX = 392, GY = 34, GW = 238, GH = 72, ven = 4; // ventana de 4 s que se desplaza
      g.rect(GX, GY, GW, GH, { fill: C.panel, stroke: C.linea, r: 4 });
      g.texto('Señal de salida', GX + 8, GY + 10, { size: 10, color: C.texto2, weight: 600 });
      g.linea([[GX + 6, GY + GH - 12], [GX + GW - 6, GY + GH - 12]], { color: C.tenue, lw: 0.8 });
      g.texto('tiempo →', GX + GW - 8, GY + GH - 4, { size: 8.5, color: C.tenue, align: 'right' });
      const pts = [], t0 = Math.max(0, t - ven);
      for (let i = 0; i <= 140; i++) {
        const tt = t0 + (i / 140) * ven; let y = 0;
        if (tt <= t) for (const pu of pulsos) { const d = tt - pu.t; if (d >= 0 && d < 0.12) y = Math.max(y, pu.a * Math.exp(-d / 0.025) * (1 - Math.exp(-d / 0.004))); }
        pts.push([GX + 8 + (i / 140) * (GW - 16), GY + GH - 13 - clamp(y * 1.6) * (GH - 30)]);
      }
      g.linea(pts, { color: C.e, lw: 1.4 });
      if (t > 11.2 && t < 13) g.texto('un pulso por ion', GX + 10, GY + 28, { size: 9.5, color: C.e, align: 'left', weight: 600, alpha: tramo(t, 11.2, 11.6) });

      g.leyenda([[C.ion, 'ion'], [C.e, 'electrón', 'e'], [C.foton, 'fotón', 'foton'], [C.neutro, 'neutro']], 14, 16, { size: 10 });
    },
  };
}
