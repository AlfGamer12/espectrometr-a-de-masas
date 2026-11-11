// Óptica iónica fuera de eje: una lente electrostática desvía los iones, mientras que los fotones, las especies neutras y las gotas siguen
// en línea recta y no alcanzan la óptica ni el detector. Dos variantes:
//   p.tipo 'omega'       lente Omega del Agilent 7900 ICP-MS: tras las lentes de extracción desplaza el haz fuera del eje hasta la celda;
//                        fotones del plasma y neutros chocan con la pared.
//   p.tipo 'deflector90' placa de deflexión de 90° del Bruker timsTOF Pro tras el capilar de vidrio: los iones giran hacia el embudo de
//                        entrada; gotas y neutros siguen recto hacia el bombeo.
// Otros parámetros: p.destino (rótulo de lo que sigue: 'Celda ORS⁴' / 'Embudo de entrada'), p.siguiente (texto final: 'el túnel TIMS').
// Todo es función periódica de t.
import { tramo, suave, lerp, clamp, azar } from '../dibujo.js';
import { gasRect } from './util-guiado.js';

export default function crear(p = {}) {
  const tipo = p.tipo === 'deflector90' ? 'deflector90' : 'omega';
  return tipo === 'omega' ? omega(p) : deflector(p);
}

function omega(p) {
  const destino = p.destino || 'Celda ORS⁴';
  const T1 = 3.4, T2 = 7, T3 = 10.6, DUR = 14.4, PER = DUR / 6;
  const EJE = 168, YOFF = 112, XW = 440; // eje del plasma, eje desplazado, pared de la celda
  const fases = [
    { t: 0, texto: 'Del cono de separación sale un chorro en el que viajan juntos los iones positivos, los fotones emitidos por el plasma y átomos y moléculas neutras. Las lentes de extracción solo aceleran a los iones, que son las únicas partículas con carga.' },
    { t: T1, texto: 'La lente Omega curva la trayectoria de los iones con campos electrostáticos: primero los aparta del eje y después los devuelve a una dirección paralela, desplazada, que coincide con la entrada de la celda.' },
    { t: T2, texto: 'Los fotones y las especies neutras no tienen carga: no sienten el campo, siguen en línea recta y chocan con la pared, sin llegar a la celda ni al detector. Por eso el fondo de la señal se mantiene muy bajo.' },
    { t: T3, texto: 'En un campo electrostático la trayectoria depende de la energía y de la carga del ion, no de su masa, así que la lente guía a la vez iones de todas las masas. No hace falta colocar un tope de fotones sobre el eje.' },
  ];
  const yIon = (x) => (x < 170 ? EJE : x > 380 ? YOFF : lerp(EJE, YOFF, suave(tramo(x, 170, 380))));
  const R = azar(41);
  const PART = Array.from({ length: 42 }, (_, i) => ({ f: i / 42, tipo: i % 3, dy: (R() - 0.5) * 10, c: Math.floor(R() * 3), s: R() }));
  return {
    titulo: 'Lente Omega fuera de eje',
    dur: DUR,
    fases,
    dibujar(g, t) {
      const C = g.C;
      g.ctx.save(); g.ctx.translate(0, 22);
      // cono de separación, lentes de extracción, lente Omega, pared y celda
      g.linea([[10, EJE - 70], [54, EJE - 6], [54, EJE - 4]], { color: C.metalOsc, lw: 4 });
      g.linea([[10, EJE + 70], [54, EJE + 6], [54, EJE + 4]], { color: C.metalOsc, lw: 4 });
      g.rotulo('Cono de separación', 4, EJE + 90, { size: 9.5, align: 'left' });
      for (const x of [82, 108]) { g.electrodo(x, EJE - 60, 6, 50, {}); g.electrodo(x, EJE + 10, 6, 50, {}); }
      g.rotulo('Lentes de extracción', 98, EJE - 76, { size: 9.5 });
      const kL = tramo(t, T1 - 0.2, T1 + 0.3);
      // electrodos de la lente Omega: dos pares que curvan el haz (primero hacia arriba, luego de vuelta)
      const colP = kL > 0 ? C.ion : C.metal;
      g.linea([[176, EJE + 30], [262, EJE + 2], [262, EJE + 10], [176, EJE + 38]], { fill: colP, alpha: 0.75, cerrar: true });
      g.linea([[176, EJE - 40], [262, EJE - 76], [262, EJE - 68], [176, EJE - 32]], { fill: C.metal, cerrar: true });
      g.linea([[288, YOFF + 34], [376, YOFF + 22], [376, YOFF + 30], [288, YOFF + 42]], { fill: C.metal, cerrar: true });
      g.linea([[288, YOFF - 14], [376, YOFF - 30], [376, YOFF - 22], [288, YOFF - 6]], { fill: colP, alpha: 0.75, cerrar: true });
      if (kL > 0) { g.texto('+', 214, EJE + 52, { size: 13, color: C.ion, align: 'center', weight: 800, alpha: kL }); g.texto('+', 330, YOFF - 36, { size: 13, color: C.ion, align: 'center', weight: 800, alpha: kL }); }
      g.rotulo('Lente Omega', 276, 40, { size: 10.5 });
      g.rect(XW, 30, 10, YOFF - 10 - 30, { fill: C.metalOsc, r: 2 });
      g.rect(XW, YOFF + 10, 10, 250 - YOFF - 10, { fill: C.metalOsc, r: 2 });
      g.camara(462, 60, 170, 104, { titulo: destino });
      for (const sg of [-1, 1]) g.electrodo(476, YOFF + sg * 18 - 3, 150, 6, {});
      g.flecha(470, YOFF, 632, YOFF, { color: C.campo, lw: 1, punta: 5 });
      g.linea([[60, EJE], [XW, EJE]], { color: C.linea, lw: 0.8, dash: [4, 4] });
      g.texto('eje del plasma', 300, EJE + 12, { size: 9, color: C.tenue });
      // desplazamiento
      if (t >= T1) {
        const a = tramo(t, T1, T1 + 0.4);
        g.flecha(410, EJE, 410, YOFF + 4, { color: C.texto2, lw: 1.1, punta: 5, alpha: a });
        g.flecha(410, YOFF, 410, EJE - 4, { color: C.texto2, lw: 1.1, punta: 5, alpha: a });
        g.texto('fuera de eje', 416, (EJE + YOFF) / 2, { size: 9, color: C.texto2, alpha: a });
      }
      // partículas
      for (const q of PART) {
        const u = ((t / PER) + q.f) % 1;
        const x = lerp(56, 640, u);
        if (q.tipo === 0) {
          // ion
          const y = yIon(x) + q.dy * (x < 120 ? 1 : Math.max(0.2, 1 - (x - 120) / 200));
          if (x < 632) g.ion(x, y, { r: 4.6, color: C.m[q.c] });
        } else if (q.tipo === 1) {
          // fotón: tramo de onda que avanza recto hasta la pared
          const x2 = Math.min(x, XW);
          if (x < XW + 24) g.foton(Math.max(56, x2 - 26), EJE + q.dy * 0.5, x2, EJE + q.dy * 0.5, { amp: 3, long: 8, alpha: 1 - tramo(x, XW, XW + 24) });
          if (x > XW && x < XW + 24) g.circulo(XW - 2, EJE + q.dy * 0.5, 3 + 10 * tramo(x, XW, XW + 24), { stroke: C.foton, lw: 1.4, alpha: 1 - tramo(x, XW, XW + 24) });
        } else {
          const xx = Math.min(x, XW - 3);
          if (x < XW + 30) g.circulo(xx, EJE + q.dy, 3.2, { fill: C.neutro, alpha: 1 - tramo(x, XW, XW + 30) });
        }
      }
      if (t >= T2) {
        const a = tramo(t, T2, T2 + 0.4) * (1 - tramo(t, T3 - 0.3, T3));
        g.rotulo('fotones y neutros: chocan con la pared', 470, 218, { size: 9.5, alpha: a });
      }
      if (t >= T3) {
        const a = tramo(t, T3, T3 + 0.4);
        g.rotulo('iones de todas las masas', 548, 186, { size: 9.5, color: C.ion, alpha: a });
      }
      g.ctx.restore();
      g.leyenda([[C.ion, 'iones (distintas m/z)'], [C.foton, 'fotones', 'foton'], [C.neutro, 'neutros']], 14, 350, { size: 10 });
    },
  };
}

function deflector(p) {
  const destino = p.destino || 'Embudo de entrada';
  const siguiente = p.siguiente || 'el túnel TIMS';
  const T1 = 3.4, T2 = 7, T3 = 10.6, DUR = 14.4, PER = DUR / 6;
  const EJE = 262, X0 = 190, XG = 300, RG = 110; // eje del capilar, salida, eje del embudo, radio del giro
  const fases = [
    { t: 0, texto: 'Del capilar de vidrio sale un chorro de gas que se expande en la primera etapa de vacío. Junto con los iones arrastra gotas que aún no se han evaporado del todo y moléculas neutras.' },
    { t: T1, texto: 'La placa de deflexión tiene un potencial del mismo signo que los iones: los repele y los obliga a girar 90° hacia la entrada del embudo de iones, que los recoge.' },
    { t: T2, texto: 'Las gotas, mucho más pesadas en relación con su carga, apenas se desvían, y las moléculas neutras no sienten el campo: siguen en línea recta y la bomba las retira. Así la óptica que sigue se ensucia mucho menos.' },
    { t: T3, texto: `El embudo, con sus anillos de RF cada vez más estrechos, concentra los iones desviados en un haz fino y los conduce hacia ${siguiente}.` },
  ];
  // trayectoria de los iones: recta hasta X0, cuarto de circunferencia hasta el eje del embudo y subida
  const L1 = X0 - 30, L2 = (Math.PI / 2) * RG, L3 = EJE - RG - 10;
  const posIon = (s) => {
    if (s < L1) return [30 + s, EJE];
    if (s < L1 + L2) { const a = (s - L1) / RG; return [X0 + Math.sin(a) * RG, EJE - RG + Math.cos(a) * RG]; }
    return [X0 + RG, EJE - RG - (s - L1 - L2)];
  };
  const LTOT = L1 + L2 + L3;
  const R = azar(43);
  const PART = Array.from({ length: 36 }, (_, i) => ({ f: i / 36, tipo: i % 3, dy: (R() - 0.5) * 8, c: Math.floor(R() * 3), s: R() }));
  return {
    titulo: 'Deflexión de 90° a la entrada',
    dur: DUR,
    fases,
    dibujar(g, t) {
      const C = g.C;
      g.ctx.save(); g.ctx.translate(0, 14);
      // capilar
      g.rect(0, EJE - 9, X0 - 20, 18, { fill: C.vacio, stroke: C.linea, lw: 1, r: 3 });
      g.rect(X0 - 32, EJE - 10, 12, 20, { fill: C.metal, stroke: C.metalOsc, lw: 0.8, r: 2 });
      g.rotulo('Capilar de vidrio', 80, EJE + 30, { size: 10 });
      // placa de deflexión bajo el giro
      const kP = tramo(t, T1 - 0.2, T1 + 0.3);
      g.electrodo(X0 - 6, EJE + 24, 150, 9, { color: kP > 0 ? C.ion : C.metal, alpha: 0.8 + 0.2 * kP });
      if (kP > 0) for (let i = 0; i < 4; i++) g.texto('+', X0 + 14 + i * 36, EJE + 44, { size: 12, color: C.ion, align: 'center', weight: 800, alpha: kP });
      g.rotulo('Placa de deflexión', X0 + 152, EJE + 29, { size: 10, align: 'left' });
      // embudo (anillos horizontales, cada vez más estrechos hacia arriba)
      const xg = X0 + RG;
      for (let i = 0; i < 11; i++) {
        const y = EJE - RG - 18 - i * 10.5, r = lerp(46, 10, i / 10);
        g.rect(xg - 60, y - 1.5, 60 - r, 3, { fill: C.metal, r: 1 });
        g.rect(xg + r, y - 1.5, 60 - r, 3, { fill: C.metal, r: 1 });
      }
      g.rotulo(destino, xg + 104, EJE - RG - 70, { size: 10 });
      g.flecha(xg, 26, xg, 6, { color: C.tenue, lw: 1.2, punta: 6 });
      g.texto(`Hacia ${siguiente}`, xg + 12, 12, { size: 9.5, color: C.tenue });
      // bombeo
      g.rect(560, EJE - 30, 70, 60, { fill: C.vacio, stroke: C.linea, lw: 1, r: 4 });
      g.texto('a la bomba', 595, EJE, { size: 9.5, color: C.tenue, align: 'center', weight: 600 });
      // gas
      gasRect(g, X0, EJE - 40, 360, 80, t, { n: 36, semilla: 4, alpha: 0.35, r: 1.6, deriva: 120 });
      // campo de la placa
      if (t >= T1 && t < T2) {
        const a = tramo(t, T1, T1 + 0.4) * (1 - tramo(t, T2 - 0.3, T2));
        for (const x of [X0 + 40, X0 + 80]) g.flecha(x, EJE + 20, x, EJE - 24, { color: C.campo, lw: 1.3, punta: 6, alpha: a });
      }
      // partículas
      for (const q of PART) {
        const u = ((t / PER) + q.f) % 1;
        if (q.tipo === 0) {
          const s = u * (LTOT + 30);
          if (s > LTOT) continue;
          const [x, y] = posIon(s);
          const foc = s > L1 + L2 ? Math.max(0.15, 1 - (s - L1 - L2) / 120) : 1;
          const off = q.dy * foc;
          g.ion(s < L1 ? x : s < L1 + L2 ? x : x + off, s < L1 ? y + off : y, { r: 4.6, color: C.m[q.c] });
        } else {
          const x = lerp(30, 590, u), y = EJE + q.dy;
          if (x > 566) continue;
          if (q.tipo === 1) g.gota(x, y + (x - 30) * 0.004, 5.2, { carga: 2 });
          else g.molecula(x, y, { r: 2.6, n: 3, rot: u * 9 + q.s * 5, semilla: 5 + q.c });
        }
      }
      if (t >= T2) {
        const a = tramo(t, T2, T2 + 0.4) * (1 - tramo(t, T3 - 0.3, T3));
        g.rotulo('gotas y neutros: siguen recto', 470, EJE - 50, { size: 9.5, alpha: a });
      }
      if (t >= T3) g.rotulo('iones enfocados', xg + 70, 40, { size: 9.5, color: C.ion, alpha: tramo(t, T3, T3 + 0.4) });
      g.ctx.restore();
      g.leyenda([[C.ion, 'iones (distintas m/z)'], [C.liquido, 'gotas'], [C.neutro, 'neutros'], [C.gas, 'gas']], 14, 350, { size: 10 });
      void clamp;
    },
  };
}
