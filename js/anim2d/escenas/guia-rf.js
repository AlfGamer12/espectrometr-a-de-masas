// Guías de iones de radiofrecuencia en las etapas de vacío intermedio: embudo de anillos apilados, UF-Qarray de Shimadzu o multipolo
// (hexapolo/octopolo). Vista lateral: los iones llegan con un chorro de gas, el pseudopotencial de RF los confina radialmente, los choques
// con el gas los enfrían y los concentran en el eje, el gas se escapa entre los electrodos hacia la bomba y el haz sale por la abertura.
// Abajo, la forma del pseudopotencial radial y un detalle propio de cada tipo. Todo es función periódica de t (bucle sin saltos).
// Parámetros:
//   p.tipo     'embudo' (anillos apilados, Bruker) | 'qarray' (Shimadzu UF-Qarray) | 'multipolo' (por defecto)
//   p.etapas   1 | 2  (solo embudo: dos embudos en serie separados por un skimmer, p. ej. Bruker scimaX)
//   p.polos    4 | 6 | 8 | 'generico'  (solo multipolo; por defecto 8 = octopolo; 'generico' si el fabricante no publica el número)
//   p.nombre   rótulo de la guía (por defecto según el tipo)
//   p.presion  texto de la presión de trabajo (por defecto 'unos pocos mbar' / '≈ 10² Pa' / 'vacío intermedio')
//   p.origen   de dónde llegan los iones (por defecto 'capilar')   ·   p.destino  adónde van (por defecto 'la siguiente etapa')
//   p.rf       texto opcional de la RF (p. ej. '5 MHz')
import { tramo, suave, lerp, clamp, azar } from '../dibujo.js';

export default function crear(p = {}) {
  const tipo = ['embudo', 'qarray', 'multipolo'].includes(p.tipo) ? p.tipo : 'multipolo';
  const etapas = tipo === 'embudo' && p.etapas === 2 ? 2 : 1;
  const generico = p.polos === 'generico';                // orden del multipolo no publicado: se dibuja un esquema de 8 varillas
  const polos = [4, 6, 8].includes(p.polos) ? p.polos : 8;
  const nomPolos = generico ? 'Multipolo' : { 4: 'Cuadrupolo', 6: 'Hexapolo', 8: 'Octopolo' }[polos];
  const nombre = p.nombre || { embudo: etapas === 2 ? 'Embudo de iones de dos etapas' : 'Embudo de iones', qarray: 'UF-Qarray', multipolo: `${nomPolos} de RF` }[tipo];
  const presion = p.presion || { embudo: 'unos pocos mbar', qarray: '≈ 10² Pa', multipolo: 'vacío intermedio' }[tipo];
  const origen = p.origen || 'capilar', destino = p.destino || 'la siguiente etapa';
  const alta = tipo !== 'multipolo' || !!p.altaPresion; // ¿muchos choques?

  const T1 = 3.4, T2 = 6.8, T3 = 10.2, T4 = 13.6, DUR = 17;
  const PER = DUR / 5; // periodo de tránsito de los iones (divisor de DUR: bucle continuo)

  /* --- geometría --- */
  const EJE = 132, XI = 96, XF = 532, ROUT = 86;
  const R = (x) => {
    if (tipo === 'embudo') {
      if (etapas === 2) return x < 316 ? lerp(62, 18, suave(tramo(x, 150, 300))) : lerp(40, 11, suave(tramo(x, 360, 520)));
      return lerp(64, 11, suave(tramo(x, 230, 520)));
    }
    if (tipo === 'qarray') return lerp(60, 16, tramo(x, XI, XF));
    return 44;
  };

  const fases = [
    { t: 0, texto: `Los iones salen del ${origen} junto con un chorro de gas y entran en la guía, a ${presion}. El gas, neutro, no siente los campos eléctricos y se expande; los iones, en cambio, quedan atrapados dentro de los electrodos.` },
    { t: T1, texto: tipo === 'embudo'
      ? 'Los anillos vecinos reciben RF de fase opuesta. Cerca de cada anillo eso crea un pseudopotencial repulsivo; en el interior el campo es débil y un gradiente de tensión continua, junto con el flujo de gas, empuja los iones hacia la salida.'
      : 'La radiofrecuencia de los electrodos crea un pseudopotencial: un pozo que crece hacia las paredes y devuelve los iones hacia el eje, tengan carga positiva o negativa. Los iones oscilan dentro del pozo sin tocar los electrodos.' },
    { t: T2, texto: alta
      ? 'A esta presión cada ion choca continuamente con el gas, y cada choque le quita un poco de energía cinética. La amplitud de sus oscilaciones disminuye y los iones se concentran en el eje: es el enfriamiento y enfoque por colisiones.'
      : 'Aquí la presión es mucho menor y los choques son más escasos, pero siguen restando energía a los iones: las oscilaciones se amortiguan poco a poco y el haz se estrecha mientras la RF lo conduce de una etapa de vacío a la siguiente.' },
    { t: T3, texto: tipo === 'embudo'
      ? 'Los anillos, cada vez más estrechos, comprimen la nube de iones hasta el diámetro de la abertura de salida. El gas escapa entre los anillos y la bomba lo retira, así que a la etapa siguiente pasan los iones y muy poco gas.'
      : tipo === 'qarray'
        ? 'Un gradiente de tensión continua entre los segmentos empuja los iones hacia delante y la geometría convergente los estrecha como un embudo. El gas escapa entre los electrodos hacia la bomba y por la abertura pasa sobre todo el haz de iones.'
        : 'El gas escapa entre las varillas y lo retiran las bombas, de modo que a la abertura de salida llega sobre todo el haz de iones, ya estrecho y con poca dispersión de energía.' },
  ];
  if (tipo === 'multipolo') fases.push({ t: T4, texto: 'Cuantos más polos, más plano es el fondo del pozo: crece con r² en un cuadrupolo, r⁴ en un hexapolo y r⁶ en un octopolo. Por eso un octopolo admite más iones y un intervalo de m/z más amplio, aunque concentra el haz menos que un cuadrupolo.' });
  else if (tipo === 'embudo') fases.push({ t: T4, texto: etapas === 2
    ? 'Con dos embudos en serie, separados por un skimmer, la presión baja por etapas y en cada una se elimina más gas sin perder iones: el haz llega enfocado al vacío más alto que sigue.'
    : 'El pseudopotencial de un embudo solo actúa a muy corta distancia de los anillos: el interior queda casi libre de campo y admite una nube amplia de iones, que se va estrechando junto con los anillos.' });
  else fases.push({ t: T4, texto: 'Así la guía admite el chorro de gas e iones que entrega la línea de desolvatación y lo transforma en un haz estrecho, que el skimmer deja pasar hacia la segunda cámara de vacío.' });

  /* --- partículas deterministas --- */
  const A = azar(23);
  const IONES = Array.from({ length: 14 }, (_, j) => ({ f: j / 14, a0: 0.45 + A() * 0.5, ph: A() * 6.28, lam: 46 + A() * 26, c: j % 3 }));
  const GAS = Array.from({ length: alta ? 70 : 30 }, () => ({ f: A(), ang: (A() - 0.5) * 2, n: 5 + Math.floor(A() * 4), s: A() })); // n vueltas por bucle (entero)

  return {
    titulo: tipo === 'embudo' ? 'Embudo de iones de RF' : tipo === 'qarray' ? 'Guía de iones UF-Qarray' : generico ? 'Guía de iones multipolar' : `Guía de iones multipolar (${nomPolos.toLowerCase()})`,
    dur: DUR,
    fases,
    dibujar(g, t) {
      const C = g.C;
      const rf = Math.cos((t * Math.PI * 2 * 15) / DUR);

      /* ===== cámara, entrada, salida y bombeo ===== */
      g.camara(70, 30, 500, 206, { titulo: `Presión: ${presion}` });
      // entrada: tubo (capilar / DL / skimmer)
      g.rect(10, EJE - 7, 70, 14, { fill: C.metal, stroke: C.metalOsc, lw: 0.8, r: 2 });
      g.rect(10, EJE - 2, 70, 4, { fill: C.vacio });
      g.rotulo(origen[0].toUpperCase() + origen.slice(1), 6, EJE + 26, { size: 10, align: 'left' });
      // abertura de salida
      g.electrodo(546, 40, 7, EJE - 9 - 40, { color: C.metalOsc }); g.electrodo(546, EJE + 9, 7, 226 - EJE - 9, { color: C.metalOsc });
      g.flecha(560, EJE, 632, EJE, { color: C.tenue, lw: 1.2, punta: 6 });
      g.texto(`Hacia ${destino}`, 632, 250, { size: 9.5, color: C.tenue, align: 'right' });
      g.linea([[600, 242], [600, EJE + 6]], { color: C.linea, lw: 0.8, dash: [2, 2] });
      // puerto de bombeo
      g.rect(290, 236, 60, 16, { fill: C.vacio, stroke: C.linea, lw: 1 });
      const kb = tramo(t, T3, T3 + 0.4);
      g.flecha(320, 238, 320, 258, { color: C.gas, lw: 2, punta: 7, alpha: 0.5 + 0.5 * kb });
      g.texto('gas a la bomba', 356, 250, { size: 9.5, color: kb > 0 ? C.gas : C.tenue, weight: 600 });

      /* ===== electrodos ===== */
      if (tipo === 'embudo') {
        const paso = 11;
        let i = 0;
        for (let x = XI + 4; x < XF; x += paso, i++) {
          if (etapas === 2 && x > 304 && x < 330) { i--; continue; }
          const r = R(x), sg = (i % 2 ? 1 : -1) * rf;
          for (const s of [-1, 1]) {
            const y0 = EJE + s * r, y1 = EJE + s * ROUT;
            g.rect(x - 1.6, Math.min(y0, y1), 3.2, Math.abs(y1 - y0), { fill: C.metal, r: 1 });
            g.rect(x - 1.6, Math.min(y0, y1), 3.2, Math.min(10, Math.abs(y1 - y0)) * 0 + Math.abs(y1 - y0), { fill: sg > 0 ? C.calor : C.acento, alpha: 0.22 * Math.abs(sg) });
          }
        }
        if (etapas === 2) { g.electrodo(312, EJE - ROUT, 8, ROUT - 8, { color: C.metalOsc }); g.electrodo(312, EJE + 8, 8, ROUT - 8, { color: C.metalOsc }); g.rotulo('Skimmer', 316, EJE - ROUT - 8, { size: 9.5 }); }
      } else if (tipo === 'qarray') {
        const nSeg = 8, w = (XF - XI) / nSeg;
        for (let k = 0; k < nSeg; k++) {
          const x0 = XI + k * w + 5, x1 = x0 + w - 10;
          for (const s of [-1, 1]) {
            const ya = EJE + s * R(x0), yb = EJE + s * R(x1);
            g.linea([[x0, ya], [x1, yb], [x1, yb + s * 12], [x0, ya + s * 12]], { fill: C.metal, color: C.metalOsc, lw: 0.8, cerrar: true });
            g.linea([[x0, ya], [x1, yb], [x1, yb + s * 12], [x0, ya + s * 12]], { fill: (s * rf > 0 ? C.calor : C.acento), alpha: 0.2 * Math.abs(rf), cerrar: true });
          }
        }
      } else {
        const rr = R(0), N = polos;
        for (let k = 0; k < N; k++) {
          const th = Math.PI / N + (2 * Math.PI * k) / N;
          const y = EJE + Math.sin(th) * rr, delante = Math.cos(th) > 0;
          if (Math.abs(Math.sin(th)) < 0.3 && N > 4) continue;
          const ext = Math.abs(Math.sin(th)) > 0.9;
          g.rect(XI, y - 4, XF - XI, 8, { fill: C.metal, stroke: C.metalOsc, lw: 0.6, r: 3, alpha: ext ? 0.95 : delante ? 0.3 : 0.18 });
        }
      }
      g.rotulo(nombre, 430, 46, { size: 10.5 });

      /* ===== gas: chorro que se expande y escapa ===== */
      for (const q of GAS) {
        const u = ((t / DUR) * q.n + q.f) % 1;
        const x = lerp(80, 560, u);
        void q.v;
        const spread = (x - 80) * (0.55 + 0.25 * q.s);
        let y = EJE + q.ang * Math.min(spread, 140);
        let al = 0.5;
        if (Math.abs(y - EJE) > 96) { y = EJE + Math.sign(y - EJE) * (96 + (Math.abs(y - EJE) - 96) * 0.3); al *= 1 - tramo(x, 200, 420); }
        if (x > 540 && Math.abs(y - EJE) > 9) continue;
        g.circulo(x + Math.sin((t * 2 * Math.PI * 20) / DUR + q.s * 30) * 1.5, y, 1.7, { fill: C.gas, alpha: al });
      }
      // flujo hacia la bomba
      if (kb > 0) for (let i = 0; i < 6; i++) { const u = ((t * 14) / DUR + i / 6) % 1; g.circulo(300 + i * 4, lerp(205, 250, u), 1.8, { fill: C.gas, alpha: kb * 0.7 * (1 - u) }); }

      /* ===== iones ===== */
      const Ld = alta ? 150 : 300;
      const iones = [];
      for (const io of IONES) {
        const u = ((t / PER) + io.f) % 1;
        const x = lerp(64, 640, u);
        let y;
        if (x < XI) y = EJE + (x - 64) * 0.12 * Math.cos(io.ph);
        else if (x < XF + 10) {
          const a = io.a0 * Math.exp(-(x - XI) / Ld) + 0.07;
          y = EJE + Math.min(R(x) * 0.82, 60) * a * Math.cos((2 * Math.PI * x) / io.lam + io.ph) * (tipo === 'embudo' ? 1 : 1);
        } else y = EJE + (EJE - EJE);
        iones.push([x, y, io]);
        g.ion(x, y, { r: 4.4, color: C.m[io.c], signo: true });
        // choques (destellos)
        const ch = ((t * (alta ? 34 : 17)) / DUR + io.f * 7.3) % 1;
        if (x > XI && x < XF && ch < 0.12) g.circulo(x - 4, y + 3, 3 + 18 * ch, { stroke: C.gas, lw: 1.2, alpha: (1 - ch / 0.12) * (t >= T2 && t < T3 ? 0.9 : 0.35) });
      }

      /* ===== rótulos por fase ===== */
      const f2 = tramo(t, T1, T1 + 0.4) * (1 - tramo(t, T2 - 0.3, T2));
      if (f2 > 0) {
        if (tipo === 'embudo') {
          for (const x of [200, 300, 420]) { g.flecha(x, EJE - R(x) + 2, x, EJE - R(x) + 14, { color: C.acento, lw: 1.5, punta: 5, alpha: f2 }); g.flecha(x, EJE + R(x) - 2, x, EJE + R(x) - 14, { color: C.acento, lw: 1.5, punta: 5, alpha: f2 }); }
          g.flecha(150, EJE + 50, 260, EJE + 50, { color: C.campo, lw: 1.4, punta: 6, alpha: f2 });
          g.texto('tensión continua + gas', 205, EJE + 40, { size: 9.5, color: C.acento, align: 'center', weight: 600, alpha: f2 });
        } else for (const x of [180, 300, 420]) {
          const r = R(x);
          g.flecha(x, EJE - r + 6, x, EJE - r * 0.45, { color: C.acento, lw: 1.5, punta: 5, alpha: f2 });
          g.flecha(x, EJE + r - 6, x, EJE + r * 0.45, { color: C.acento, lw: 1.5, punta: 5, alpha: f2 });
        }
        g.rotulo('pseudopotencial: empuja hacia el eje', 310, 214, { size: 10, color: C.acento, alpha: f2 });
      }
      const f3 = tramo(t, T2, T2 + 0.4) * (1 - tramo(t, T3 - 0.3, T3));
      if (f3 > 0) {
        g.rotulo('choques con el gas: los iones se enfrían', 310, 214, { size: 10, color: C.texto2, alpha: f3 });
        g.texto('haz ancho', 150, 224, { size: 9.5, color: C.tenue, align: 'center', alpha: f3 });
        g.texto('haz estrecho', 490, 224, { size: 9.5, color: C.tenue, align: 'center', alpha: f3 });
      }
      const f4 = tramo(t, T3, T3 + 0.4) * (1 - tramo(t, T4 - 0.3, T4));
      if (f4 > 0) {
        g.rotulo(tipo === 'multipolo' ? 'el gas escapa entre las varillas' : 'el gas escapa entre los electrodos', 310, 214, { size: 10, color: C.gas, alpha: f4 });
        if (tipo === 'qarray') for (let k = 0; k < 8; k++) g.texto(String(8 - k), XI + (k + 0.5) * ((XF - XI) / 8), EJE - R(XI + (k + 0.5) * ((XF - XI) / 8)) - 20, { size: 9, color: C.calor, align: 'center', weight: 700, alpha: f4 });
      }

      /* ===== paneles inferiores ===== */
      const BY = 264, BH = 82;
      // pseudopotencial radial
      g.rect(10, BY, 236, BH, { fill: C.panel, stroke: C.linea, r: 4 });
      g.texto('Pseudopotencial radial', 18, BY + 11, { size: 9.5, color: C.texto2, weight: 600 });
      const xa = 24, xb = 232, yb = BY + BH - 14, H = BH - 40;
      const xc = (xa + xb) / 2;
      g.linea([[xa, yb], [xb, yb]], { color: C.tenue, lw: 0.8 });
      g.linea([[xc, yb + 3], [xc, BY + 20]], { color: C.linea, lw: 0.8, dash: [2, 2] });
      g.texto('eje', xc, yb + 8, { size: 8.5, color: C.tenue, align: 'center' });
      g.texto('pared', xb - 4, yb + 8, { size: 8.5, color: C.tenue, align: 'right' });
      const curva = (fn, op) => { const pts = []; for (let i = 0; i <= 80; i++) { const r = -1 + (2 * i) / 80; pts.push([lerp(xa + 4, xb - 4, (r + 1) / 2), yb - clamp(fn(Math.abs(r))) * H]); } g.linea(pts, op); };
      if (tipo === 'embudo') {
        curva((r) => Math.exp((r - 1) / 0.08), { color: C.acento, lw: 1.8 });
        g.texto('solo cerca de los anillos', xc, BY + 24, { size: 9, color: C.acento, align: 'center' });
      } else if (tipo === 'qarray') {
        curva((r) => r ** 2, { color: C.acento, lw: 1.8 });
        g.texto('pozo hacia el eje', xc, BY + 24, { size: 9, color: C.acento, align: 'center' });
      } else if (generico) {
        curva((r) => r ** 2, { color: C.tenue, lw: 1.1, dash: [3, 3] });
        curva((r) => r ** 4, { color: C.acento, lw: 1.1, dash: [5, 2] });
        curva((r) => r ** 6, { color: C.acento, lw: 1.8 });
        g.texto('r²  ·  r⁴  ·  r⁶', xb - 8, BY + 27, { size: 9, color: C.acento, align: 'right', weight: 600 });
        g.texto('4, 6 y 8 polos', xa + 6, BY + 27, { size: 9, color: C.tenue });
      } else {
        const ex = polos - 2;
        if (polos !== 4) curva((r) => r ** 2, { color: C.tenue, lw: 1.1, dash: [3, 3] });
        curva((r) => r ** ex, { color: C.acento, lw: 1.8 });
        g.texto(`${nomPolos.toLowerCase()}: ∝ r${ex === 2 ? '²' : ex === 4 ? '⁴' : '⁶'}`, xb - 8, BY + 27, { size: 9, color: C.acento, align: 'right', weight: 600 });
        if (polos !== 4) g.texto('cuadrupolo: ∝ r²', xa + 6, BY + 27, { size: 9, color: C.tenue });
      }

      // detalle propio
      const DX = 256, DW = 374;
      g.rect(DX, BY, DW, BH, { fill: C.panel, stroke: C.linea, r: 4 });
      if (tipo === 'multipolo') {
        g.texto('Vista frontal', DX + 8, BY + 11, { size: 9.5, color: C.texto2, weight: 600 });
        const cx = DX + 70, cy = BY + 46, rr = 22;
        for (let k = 0; k < polos; k++) {
          const th = Math.PI / polos + (2 * Math.PI * k) / polos, s = (k % 2 ? 1 : -1) * rf;
          g.circulo(cx + Math.cos(th) * (rr + 6), cy + Math.sin(th) * (rr + 6), 5.5, { fill: C.metal, stroke: C.metalOsc });
          g.circulo(cx + Math.cos(th) * (rr + 6), cy + Math.sin(th) * (rr + 6), 5.5, { fill: s > 0 ? C.calor : C.acento, alpha: 0.6 * Math.abs(s) });
        }
        g.ion(cx + Math.cos((t * 2 * Math.PI * 8) / DUR) * 6, cy + Math.sin((t * 2 * Math.PI * 6) / DUR) * 5, { r: 3.5, signo: false });
        g.texto(generico ? 'Varillas vecinas con RF de fase opuesta (esquema)' : `${polos} varillas; las vecinas, con RF de fase opuesta`, DX + 130, BY + 36, { size: 9.5, color: C.texto2 });
        g.texto(p.rf ? `RF: ${p.rf}` : 'Solo RF, sin filtrar: guía un intervalo amplio de m/z', DX + 130, BY + 54, { size: 9.5, color: C.tenue });
      } else if (tipo === 'qarray') {
        g.texto('Tensión continua de cada segmento', DX + 8, BY + 11, { size: 9.5, color: C.texto2, weight: 600 });
        const x0 = DX + 20, w = DW - 40;
        const pts = [];
        for (let k = 0; k < 8; k++) { const y = BY + 26 + k * 5; pts.push([x0 + (k * w) / 8, y], [x0 + ((k + 1) * w) / 8, y]); }
        g.linea(pts, { color: C.calor, lw: 1.8 });
        g.ion(lerp(x0, x0 + w, ((t / PER) % 1)), BY + 22 + Math.floor(((t / PER) % 1) * 8) * 5, { r: 4, signo: false, color: C.m[1] });
        g.texto('el ion «desciende» de segmento en segmento hacia la salida', DX + DW / 2, BY + BH - 10, { size: 9, color: C.tenue, align: 'center' });
      } else {
        g.texto('Vista frontal de un anillo', DX + 8, BY + 11, { size: 9.5, color: C.texto2, weight: 600 });
        const cx = DX + 64, cy = BY + 46;
        g.circulo(cx, cy, 28, { stroke: C.metal, lw: 8 });
        g.circulo(cx, cy, 14, { stroke: C.linea, lw: 1, alpha: 0.8 });
        g.texto('el diámetro interior', DX + 118, BY + 32, { size: 9.5, color: C.texto2 });
        g.texto('disminuye hacia la salida', DX + 118, BY + 47, { size: 9.5, color: C.texto2 });
        g.texto('RF de fase alterna en anillos vecinos', DX + 118, BY + 64, { size: 9.5, color: C.tenue });
      }
      g.leyenda([[C.m[0], 'iones de distinta m/z'], [C.gas, 'gas']], 14, 354, { size: 9.5 });
      void iones;
    },
  };
}
