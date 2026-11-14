// RMN: el imán superconductor. Corte del criostato (vacío, nitrógeno a 77 K, pantalla, helio a 4,2 K, bobina de NbTi y bore a temperatura
// ambiente); resistencia del NbTi frente a la temperatura (cero por debajo de Tc ≈ 9 K); carga del imán con el interruptor
// superconductor abierto (calefactor encendido) y paso al modo persistente; apantallamiento activo del campo de dispersión.
// Parámetros: p.B (T, 9,4).
import { tramo, suave, lerp } from '../dibujo.js';
import { num } from './util-analizadores.js';

export default function crear(p = {}) {
  const B = p.B || 9.4;
  const TR = 4.6, TC = 9, TP = 13.4, TA = 17.2, dur = 22;

  return {
    titulo: 'El imán superconductor',
    dur,
    fases: [
      { t: 0, texto: `El campo de ${num(B, 1)} T lo crea un solenoide de hilo de niobio-titanio. Está sumergido en helio líquido a 4,2 K, dentro de un depósito rodeado por una pantalla térmica, un depósito de nitrógeno líquido a 77 K y una cámara de vacío.` },
      { t: TR, texto: 'Por debajo de su temperatura crítica, unos 9 K, el NbTi pierde toda resistencia eléctrica: la corriente circula sin disipar calor. A 4,2 K hay margen de sobra frente a ese límite.' },
      { t: TC, texto: 'Para cargar el imán se calienta un tramo del circuito, el interruptor superconductor, que pasa a tener resistencia: así la fuente externa puede subir la corriente por la bobina poco a poco.' },
      { t: TP, texto: 'Al apagar el calefactor, el interruptor vuelve a ser superconductor y cierra la bobina sobre sí misma. Se retira la fuente y la corriente sigue circulando: es el modo persistente. Según Bruker, el campo tardaría cientos de años en perder un 1 %.' },
      { t: TA, texto: 'Una segunda bobina exterior, con la corriente en sentido contrario, cancela casi todo el campo fuera del imán y acerca la línea de 5 G. Si una zona del hilo dejara de ser superconductora (quench), la energía se disiparía y el helio se evaporaría de golpe.' },
    ],
    dibujar(g, t) {
      const C = g.C;
      /* --- corte del criostato (mitad izquierda del eje) --- */
      const ax = 164, y0 = 40, y1 = 306;
      g.rect(14, 10, 300, 340, { fill: C.panel, stroke: C.linea, r: 8 });
      g.texto('Corte del criostato', 26, 26, { size: 11, color: C.texto2, weight: 700 });
      const capa = (r0, r1, a, b, fill, stroke, alpha = 1) => {
        g.rect(ax - r1, a, r1 - r0, b - a, { fill, stroke, r: 4, alpha });
        g.rect(ax + r0, a, r1 - r0, b - a, { fill, stroke, r: 4, alpha });
      };
      const N2 = '#b9c6ff', HE = '#9fe3ff', CU = '#b87342';
      capa(8, 140, y0, y1, C.vacio, C.metalOsc);                  // cámara de vacío
      capa(13, 124, y0 + 10, y1 - 9, C.panel, C.linea);          // pantalla a 77 K
      capa(114, 123, y0 + 12, y0 + 120, N2, C.metalOsc, 0.9);    // depósito de nitrógeno
      capa(16, 106, y0 + 19, y1 - 16, C.panel, C.linea);         // pantalla enfriada por el vapor de helio
      capa(19, 98, y0 + 26, y1 - 23, HE, C.metalOsc, 0.75);      // helio líquido
      // bobina principal y de apantallamiento
      const brillo = t > TP ? 0.25 + 0.15 * Math.sin(t * 4) : 0;
      capa(24, 42, 140, 250, CU, '#8f522a');
      capa(70, 77, 154, 236, '#a8683c', '#8f522a', 0.95);
      if (brillo) capa(24, 42, 140, 250, C.foton, C.foton, brillo * 0.5);
      // bore
      g.rect(ax - 8, y0 - 6, 16, y1 - y0 + 12, { fill: C.fondo, stroke: C.metalOsc, r: 2 });
      g.rect(ax - 2.5, 172, 5, 46, { fill: C.liquido, r: 2, alpha: 0.8 });
      g.flecha(ax, y1 - 4, ax, y0 + 4, { color: C.acento, lw: 2, punta: 7, alpha: 0.6 });
      g.texto('B₀', ax + 12, y0 + 8, { size: 11, color: C.acento, weight: 700 });
      g.texto('bore a temperatura ambiente', ax, y1 + 16, { size: 9.5, color: C.tenue, align: 'center' });
      g.leyenda([[C.metalOsc, 'vacío 300 K'], [N2, 'N₂ 77 K'], [HE, 'He 4,2 K'], [CU, 'NbTi']], 26, 338, { size: 9.5 });

      /* --- resistencia frente a temperatura --- */
      const X0 = 326, W = 300;
      const kR = suave(tramo(t, TR, TR + 1));
      if (t < TC) {
        g.rect(X0, 10, W, 340, { fill: C.panel, stroke: C.linea, r: 8, alpha: Math.max(0.35, kR) });
        g.texto('Resistencia del NbTi', X0 + 12, 26, { size: 11, color: C.texto2, weight: 700, alpha: kR });
        const gx = X0 + 40, gw = W - 70, gy = 280, gh = 200, Tm = 20;
        const X = (T) => gx + (T / Tm) * gw, Y = (r) => gy - r * gh;
        g.linea([[gx, gy - gh - 10], [gx, gy], [gx + gw + 10, gy]], { color: C.tenue, lw: 1.2, alpha: kR });
        const pts = [];
        for (let T = 0; T <= Tm; T += 0.05) pts.push([X(T), Y(T < 9.2 ? 0 : 0.55 + 0.012 * (T - 9.2))]);
        g.linea(pts, { color: C.acento, lw: 2.2, alpha: kR });
        g.linea([[X(9.2), Y(0)], [X(9.2), Y(0.55)]], { color: C.acento, lw: 2.2, alpha: kR });
        for (const T of [0, 5, 10, 15, 20]) g.texto(String(T), X(T), gy + 13, { size: 10, color: C.tenue, align: 'center', alpha: kR });
        g.texto('T (K)', gx + gw, gy + 28, { size: 10, color: C.tenue, align: 'right', alpha: kR });
        g.texto('R', gx - 14, gy - gh, { size: 11, color: C.tenue, alpha: kR });
        g.linea([[X(4.2), gy], [X(4.2), gy - gh]], { color: C.frio, lw: 1.2, dash: [4, 3], alpha: kR });
        g.texto('4,2 K: helio líquido', X(4.2) + 4, gy - gh + 8, { size: 10, color: C.frio, weight: 700, alpha: kR });
        g.texto('Tc ≈ 9 K', X(9.2) + 6, Y(0.3), { size: 10.5, color: C.acento, weight: 700, alpha: kR });
        g.texto('R = 0', X(1.5), gy - 10, { size: 11, color: C.ok, weight: 700, alpha: kR });
        return;
      }
      /* --- carga y modo persistente --- */
      if (t < TA) {
        g.rect(X0, 10, W, 340, { fill: C.panel, stroke: C.linea, r: 8 });
        g.texto(t < TP ? 'Carga del imán' : 'Modo persistente', X0 + 12, 26, { size: 11, color: C.texto2, weight: 700 });
        // bobina a la izquierda; interruptor y fuente en paralelo con ella, a la derecha
        const cy = 168, xb = X0 + 52, xs = X0 + 150, xf = X0 + 236, yt = cy - 100, yd = cy + 100;
        for (let i = 0; i < 7; i++) g.circulo(xb, cy - 60 + i * 20, 14, { stroke: '#b87342', lw: 3 });
        const enc = t < TP;                                      // calefactor encendido durante la carga
        const kI = t < TP ? suave(tramo(t, TC + 0.6, TP - 0.6)) : 1;
        const kF = 1 - suave(tramo(t, TP + 0.4, TP + 1.8));       // la fuente se retira en modo persistente
        g.linea([[xb, cy - 74], [xb, yt], [xs, yt], [xs, cy - 30]], { color: C.metalOsc, lw: 2.5 });
        g.linea([[xb, cy + 74], [xb, yd], [xs, yd], [xs, cy + 30]], { color: C.metalOsc, lw: 2.5 });
        g.linea([[xs, yt], [xf, yt], [xf, cy - 26]], { color: C.metalOsc, lw: 2.5, alpha: kF });
        g.linea([[xs, yd], [xf, yd], [xf, cy + 26]], { color: C.metalOsc, lw: 2.5, alpha: kF });
        g.rect(xs - 12, cy - 30, 24, 60, { fill: enc ? C.calor : C.frio, r: 4, alpha: 0.8 });
        g.rect(xf - 24, cy - 26, 48, 52, { fill: C.vacio, stroke: C.linea, r: 5, alpha: kF });
        g.texto('fuente', xf, cy + 1, { size: 10.5, color: C.texto2, weight: 600, align: 'center', alpha: kF });
        g.texto('bobina', xb, yd + 16, { size: 10, color: '#8f522a', weight: 700, align: 'center' });
        g.texto('interruptor', xs, yd + 16, { size: 10, color: C.texto2, weight: 600, align: 'center' });
        g.texto(enc ? 'calefactor encendido: R > 0' : 'superconductor: R = 0', xs, yd + 30, { size: 9.5, color: enc ? C.calor : C.frio, weight: 700, align: 'center' });
        // corriente: durante la carga circula por la fuente; en modo persistente, por el interruptor
        const xr = enc ? xf : xs, L = [[xb, yd], [xb, yt], [xr, yt], [xr, yd]];
        const per = [yd - yt, xr - xb, yd - yt, xr - xb], tot = per.reduce((a, b) => a + b, 0);
        const nPts = 18, vel = 0.1 + 0.2 * kI;
        for (let i = 0; i < nPts; i++) {
          let d = ((i / nPts + t * vel) % 1) * tot, k = 0;
          while (d > per[k]) { d -= per[k]; k = (k + 1) % 4; }
          const a = L[k], b = L[(k + 1) % 4], f = d / per[k];
          g.circulo(lerp(a[0], b[0], f), lerp(a[1], b[1], f), 3, { fill: C.e, alpha: 0.25 + 0.75 * kI });
        }
        g.texto(`I ${t < TP ? 'subiendo' : 'constante, sin fuente'}`, X0 + 12, 330, { size: 11, color: C.e, weight: 700 });
        g.medidor(X0 + 150, 326, 130, kI, { etiqueta: 'corriente', color: C.e });
        return;
      }
      /* --- apantallamiento activo --- */
      g.rect(X0, 10, W, 340, { fill: C.panel, stroke: C.linea, r: 8 });
      g.texto('Apantallamiento activo', X0 + 12, 26, { size: 11, color: C.texto2, weight: 700 });
      const k = suave(tramo(t, TA + 1, TA + 3));
      const cx = X0 + W / 2, cy = 190;
      // contorno de 5 G sin y con apantallamiento (esquema)
      const elip = (rx, ry, col, dash, alpha) => g.linea(Array.from({ length: 61 }, (_, i) => { const a = (i / 60) * 6.283; return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)]; }), { color: col, lw: 1.6, dash, alpha });
      elip(130, 150, C.mal, [5, 4], 1 - 0.6 * k);
      elip(lerp(130, 62, k), lerp(150, 80, k), C.ok, null, k);
      g.texto('5 G sin apantallar', cx + 20, cy - 150, { size: 9.5, color: C.mal, weight: 700, alpha: 1 - 0.6 * k });
      g.texto('5 G con bobina de apantallamiento', cx, cy + 96, { size: 9.5, color: C.ok, weight: 700, align: 'center', alpha: k });
      // bobinas en corte: ⊙ / ⊗
      const marca = (x, y, sale, col) => { g.circulo(x, y, 7, { stroke: col, lw: 1.6, fill: C.panel }); if (sale) g.circulo(x, y, 2, { fill: col }); else { g.linea([[x - 4, y - 4], [x + 4, y + 4]], { color: col, lw: 1.4 }); g.linea([[x + 4, y - 4], [x - 4, y + 4]], { color: col, lw: 1.4 }); } };
      for (let i = 0; i < 4; i++) { marca(cx - 16, cy - 30 + i * 20, true, '#b87342'); marca(cx + 16, cy - 30 + i * 20, false, '#b87342'); }
      for (let i = 0; i < 3; i++) { marca(cx - 44, cy - 20 + i * 20, false, C.anion); marca(cx + 44, cy - 20 + i * 20, true, C.anion); }
      g.texto('principal', cx, cy - 46, { size: 9.5, color: '#8f522a', weight: 700, align: 'center' });
      g.texto('apantallamiento (corriente opuesta)', cx, cy + 58, { size: 9.5, color: C.anion, weight: 700, align: 'center' });
    },
  };
}
