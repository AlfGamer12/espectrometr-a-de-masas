// Detector piroeléctrico (DLATGS): el infrarrojo modulado calienta el cristal, la polarización espontánea cambia con la temperatura y
// circula una corriente i = p·A·dT/dt; con luz constante no hay señal; control de temperatura lejos del punto de Curie.
// Escena sin estado. Parámetros opcionales: p.material ('DLATGS'), p.control (true si va termostatizado).
import { tramo, suave, lerp } from '../dibujo.js';

export default function crear(p = {}) {
  const mat = p.material || 'DLATGS';
  const control = p.control !== false;
  const CX = 210, CY = 176, W = 150, Hc = 70;            // cristal
  // modulación de la luz: senoidal; entre 8,6 y 12,4 s la luz es constante
  const luz = (t) => (t >= 8.6 && t < 12.4 ? 0.7 : 0.5 + 0.45 * Math.sin(t * 4.2));
  const temp = (t) => (t >= 8.6 && t < 12.4 ? 0.7 : 0.5 + 0.45 * Math.sin(t * 4.2 - 0.9));   // la temperatura sigue a la luz con retraso
  const corr = (t) => (t >= 8.6 && t < 12.4 ? 0 : Math.cos(t * 4.2 - 0.9));                 // i ∝ dT/dt

  return {
    titulo: 'Detector piroeléctrico DLATGS',
    dur: 18,
    fases: [
      { t: 0, texto: `El interferómetro modula la intensidad del infrarrojo. Una capa negra sobre el cristal de ${mat} absorbe la radiación y su temperatura oscila unas milésimas de grado.` },
      { t: 4.2, texto: 'El cristal tiene polarización espontánea, que disminuye al calentarse. Al cambiar la polarización cambian las cargas en las caras y por el circuito circula una corriente proporcional a la velocidad de cambio de la temperatura: i = p·A·dT/dt.' },
      { t: 8.6, texto: 'Si la luz es constante, la temperatura deja de variar y la corriente se anula: un detector piroeléctrico solo ve cambios. Por eso necesita el haz modulado que produce el interferómetro.' },
      { t: 12.4, texto: control
        ? 'Por encima de la temperatura de Curie (unos 60 °C en el TGS deuterado) la polarización desaparece. El cristal se mantiene a temperatura controlada, lejos de ese punto, y el dopado con L-alanina estabiliza la polarización.'
        : 'Por encima de la temperatura de Curie la polarización desaparece. El dopado con L-alanina estabiliza la polarización del cristal.' },
    ],
    dibujar(g, t) {
      const C = g.C;
      const L = luz(t), T = temp(t), I = corr(t);
      /* --- haz incidente --- */
      for (let i = 0; i < 4; i++) g.foton(CX - 60 + i * 40, 22, CX - 60 + i * 40, CY - Hc / 2 - 12, { amp: 3 + 3 * L, long: 11, lw: 1.4 + 1.6 * L, alpha: 0.35 + 0.6 * L });
      g.rotulo(t >= 8.6 && t < 12.4 ? 'IR constante' : 'IR modulado', CX + 96, 40, { size: 10, color: C.foton });
      /* --- cristal con electrodos --- */
      g.rect(CX - W / 2, CY - Hc / 2 - 9, W, 9, { fill: '#121315', stroke: C.metal, lw: 1 });
      g.texto('electrodo negro (absorbente)', CX + W / 2 + 6, CY - Hc / 2 - 20, { size: 9.5, color: C.texto2 });
      const calor = C.calor;
      g.rect(CX - W / 2, CY - Hc / 2, W, Hc, { fill: calor, alpha: 0.1 + 0.35 * T });
      g.rect(CX - W / 2, CY - Hc / 2, W, Hc, { stroke: C.linea, lw: 1.2 });
      g.rect(CX - W / 2, CY + Hc / 2, W, 7, { fill: C.metal });
      g.texto(`cristal ${mat}`, CX - W / 2 - 8, CY, { size: 10, color: C.texto2, align: 'right', weight: 600 });
      // dipolos: su longitud disminuye al calentarse
      const len = 22 * (1 - 0.35 * T);
      for (let i = 0; i < 5; i++) for (let j = 0; j < 2; j++) {
        const x = CX - W / 2 + 18 + i * 28, y = CY - 16 + j * 32;
        g.flecha(x, y + len / 2, x, y - len / 2, { color: C.acento, lw: 1.5, punta: 5 });
      }
      // cargas superficiales
      const nq = Math.round(3 + 4 * (1 - T));
      for (let i = 0; i < nq; i++) {
        g.texto('+', CX - W / 2 + 12 + (i * (W - 24)) / Math.max(1, nq - 1), CY - Hc / 2 + 9, { size: 10, color: C.ion, align: 'center', weight: 800 });
        g.texto('−', CX - W / 2 + 12 + (i * (W - 24)) / Math.max(1, nq - 1), CY + Hc / 2 - 8, { size: 11, color: C.anion, align: 'center', weight: 800 });
      }
      /* --- circuito y preamplificador --- */
      const xr = CX + W / 2 + 40;
      g.linea([[CX + W / 2, CY - Hc / 2 - 4], [xr, CY - Hc / 2 - 4], [xr, CY - 14]], { color: C.texto2, lw: 1.4 });
      g.linea([[CX + W / 2, CY + Hc / 2 + 4], [xr, CY + Hc / 2 + 4], [xr, CY + 14]], { color: C.texto2, lw: 1.4 });
      g.linea([[xr - 10, CY - 14], [xr - 10, CY + 14], [xr + 18, CY]], { color: C.texto2, lw: 1.4, cerrar: true, fill: C.panel });
      g.texto('preamplificador', xr + 22, CY - 22, { size: 9.5, color: C.tenue, align: 'left' });
      // electrones que circulan según el signo de la corriente
      if (Math.abs(I) > 0.05) {
        for (let k = 0; k < 4; k++) {
          const u = ((t * 1.6 * Math.sign(I) + k / 4) % 1 + 1) % 1;
          const pts = [[CX + W / 2, CY + Hc / 2 + 4], [xr, CY + Hc / 2 + 4], [xr, CY - Hc / 2 - 4], [CX + W / 2, CY - Hc / 2 - 4]];
          const seg = u * 3, i = Math.min(2, Math.floor(seg)), f = seg - i;
          g.electron(lerp(pts[i][0], pts[i + 1][0], f), lerp(pts[i][1], pts[i + 1][1], f), { alpha: Math.min(1, Math.abs(I) * 1.5) });
        }
      }
      // módulo Peltier
      if (control) {
        g.rect(CX - W / 2 - 6, CY + Hc / 2 + 14, W + 12, 14, { fill: C.frio, alpha: 0.75, r: 3 });
        g.texto('control de temperatura', CX, CY + Hc / 2 + 21.5, { size: 9.5, color: '#fff', align: 'center', weight: 700 });
      }
      /* --- gráficas --- */
      const G0 = 430, G1 = 628;
      if (t < 12.4) {
        const graf = (y0, tit, f, col) => {
          g.rect(G0, y0, G1 - G0, 92, { fill: C.panel, stroke: C.linea, r: 6 });
          g.texto(tit, G0 + 8, y0 + 12, { size: 9.5, color: C.texto2, weight: 600 });
          const q = [];
          for (let k = 0; k <= 120; k++) { const tt = t - 3 + (3 * k) / 120; q.push([G0 + 8 + (k / 120) * (G1 - G0 - 16), y0 + 54 - f(Math.max(0, tt)) * 26]); }
          g.linea([[G0 + 8, y0 + 54], [G1 - 8, y0 + 54]], { color: C.rejilla, lw: 1 });
          g.linea(q, { color: col, lw: 1.6 });
        };
        graf(28, 'Intensidad del IR', (x) => (luz(x) - 0.5) * 2, C.foton);
        graf(130, 'Temperatura del cristal', (x) => (temp(x) - 0.5) * 2, C.calor);
        graf(232, 'Corriente  i ∝ dT/dt', (x) => corr(x) * 0.9, C.e);
      } else {
        g.rect(G0, 28, G1 - G0, 296, { fill: C.panel, stroke: C.linea, r: 6 });
        g.texto('Polarización frente a temperatura', G0 + 8, 42, { size: 9.5, color: C.texto2, weight: 600 });
        const xT = (v) => lerp(G0 + 20, G1 - 16, v / 80), yP = (v) => lerp(290, 80, v);
        const Tc = 60, q = [];
        for (let v = 0; v <= 80; v += 0.5) q.push([xT(v), yP(v < Tc ? Math.sqrt(1 - v / Tc) : 0)]);
        g.linea([[G0 + 20, 290], [G1 - 16, 290]], { color: C.tenue, lw: 0.8 });
        g.linea(q, { color: C.acento, lw: 1.8 });
        for (const v of [0, 20, 40, 60, 80]) g.texto(`${v}`, xT(v), 303, { size: 8.5, color: C.tenue, align: 'center' });
        g.texto('°C', G1 - 16, 316, { size: 8.5, color: C.tenue, align: 'right' });
        g.linea([[xT(Tc), 70], [xT(Tc), 290]], { color: C.mal, lw: 1, dash: [3, 3] });
        g.texto('Curie ≈ 60 °C', xT(Tc) - 4, 66, { size: 9.5, color: C.mal, align: 'right', weight: 700 });
        const k = suave(tramo(t, 13.2, 14.2));
        if (control && k > 0) {
          g.rect(xT(24), 82, xT(34) - xT(24), 208, { fill: C.frio, alpha: 0.18 * k });
          g.texto('zona de trabajo', xT(29), 98, { size: 9, color: C.frio, align: 'center', weight: 700, alpha: k });
          g.texto('(ilustrativa)', xT(29), 110, { size: 8.5, color: C.tenue, align: 'center', alpha: k });
        }
        g.texto('la pendiente dP/dT es el coeficiente', G0 + 10, 132, { size: 9, color: C.texto2 });
        g.texto('piroeléctrico p', G0 + 10, 144, { size: 9, color: C.texto2 });
      }
      g.leyenda([[C.foton, 'infrarrojo', 'foton'], [C.acento, 'dipolos'], [C.e, 'electrón', 'e']], 20, 344, { size: 9.5 });
    },
  };
}
