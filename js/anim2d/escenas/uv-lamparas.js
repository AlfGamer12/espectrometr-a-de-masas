// Lámparas de un espectrofotómetro UV-Vis de doble lámpara (como el Shimadzu UV-1900i), vistas desde arriba: lámpara halógena de
// wolframio (visible e IR cercano), lámpara de deuterio (UV) y espejo conmutador que envía a la rendija de entrada la luz de una u otra.
// A la derecha, la energía relativa de cada lámpara (forma aproximada) y la longitud de onda que se está midiendo.
// Sin estado: todo es función de t. Parámetros: p.cambio (texto de la zona de cambio, por defecto «300–350 nm»).
import { tramo, suave, lerp } from '../dibujo.js';
import { colorNm, energiaD2, energiaWI } from './uv-util.js';

export default function crear(p = {}) {
  const zona = p.cambio || '300–350 nm';
  const LC = 340;                                         // cambio de lámpara en la animación
  const MX = 175, MY = 238, SY = 118;                      // espejo conmutador y rendija de entrada
  const WX = 62, DX = 292;                                // lámparas
  // longitud de onda de medida: barrido de 820 a 220 nm entre t = 7 y t = 15
  const lam = (t) => (t < 7 ? 600 : t < 15 ? lerp(820, 220, suave(tramo(t, 7, 15))) : 220);
  let tc = 15; for (let s = 7; s < 15; s += 0.01) if (lam(s) < LC) { tc = s; break; }   // instante del cambio de lámpara

  return {
    titulo: 'Lámparas y espejo conmutador',
    dur: 19,
    fases: [
      { t: 0, texto: 'La lámpara halógena de wolframio (WI) tiene un filamento caliente que emite un espectro continuo, del visible al infrarrojo cercano. En el ultravioleta su emisión cae casi a cero.' },
      { t: 3.5, texto: 'La lámpara de deuterio (D₂) es una descarga en arco dentro de deuterio a baja presión: da un continuo intenso en el ultravioleta, que se debilita hacia los 400 nm, y algunas líneas, como las de 486 y 656 nm.' },
      { t: 7, texto: `Un espejo giratorio entre las dos lámparas envía a la rendija de entrada la luz de la que conviene en cada longitud de onda. Al barrer hacia el UV, el espejo gira y cambia de lámpara en la zona de ${zona}, donde las dos dan una energía parecida.` },
      { t: 15.2, texto: 'En el UV-1900 la inclinación del espejo para cada lámpara se ajusta automáticamente al encender el equipo: al cambiar una lámpara no hay que alinearla a mano.' },
    ],
    dibujar(g, t) {
      const C = g.C, l = lam(t);
      const uv = l < LC;
      // ángulo del espejo: −45° envía hacia arriba la luz que llega desde la izquierda (WI), +45° la que llega desde la derecha (D₂)
      const objetivo = uv ? 1 : -1;
      const giro = t < tc ? -1 : lerp(-1, 1, suave(tramo(t, tc, tc + 0.7)));
      const ang = (-giro * Math.PI) / 4;
      const listo = Math.abs(giro - objetivo) < 0.05;

      /* --- casa de lámparas --- */
      g.camara(22, 154, 306, 170, {});
      g.texto('Casa de lámparas (vista desde arriba)', 30, 316, { size: 10, color: C.tenue, weight: 600 });
      g.rect(MX - 12, SY + 30, 24, 8, { fill: C.metalOsc });
      g.rect(MX - 2, SY + 30, 4, 8, { fill: C.fondo });
      g.rotulo('Rendija de entrada', MX + 92, SY + 20, { size: 10 });
      g.flecha(MX, SY + 26, MX, SY - 8, { color: C.tenue, lw: 1.2 });
      g.texto('Al monocromador', MX, SY - 18, { size: 10, color: C.tenue, align: 'center' });

      // lámpara WI: ampolla con filamento en espiral
      const bWI = !uv || t < 7 ? 1 : 0.55;
      g.circulo(WX, MY, 34, { fill: '#ffcf7a', alpha: 0.18 * bWI });
      g.circulo(WX, MY, 17, { fill: C.panel, stroke: C.texto2, lw: 1.4 });
      const fz = []; for (let i = 0; i <= 12; i++) fz.push([WX - 9 + i * 1.5, MY + (i % 2 ? -4 : 4)]);
      g.linea(fz, { color: '#ff9d2e', lw: 1.8, alpha: 0.6 + 0.4 * bWI });
      g.rect(WX - 8, MY + 17, 16, 20, { fill: C.metal, r: 2 });
      g.rotulo('Lámpara WI (halógena)', WX + 8, MY + 58, { size: 10 });
      // lámpara D₂: ampolla cilíndrica, electrodos y apertura hacia el espejo
      const bD2 = t > 3.5 ? 1 : 0.35;
      g.circulo(DX, MY, 36, { fill: '#a98bff', alpha: 0.18 * bD2 * (uv || t < 7 ? 1 : 0.6) });
      g.circulo(DX, MY, 20, { fill: C.panel, stroke: C.texto2, lw: 1.4 });
      g.rect(DX - 6, MY - 9, 12, 18, { fill: C.metalOsc, r: 2 });
      g.circulo(DX - 6, MY, 3.2, { fill: '#c9b8ff', alpha: 0.4 + 0.6 * bD2 * (0.8 + 0.2 * Math.sin(t * 30)) });
      g.rotulo('Lámpara D₂ (deuterio)', DX - 18, MY + 58, { size: 10 });

      // haces: lámpara activa → espejo → rendija
      const cWI = 'rgba(255, 214, 140, 0.9)', cD2 = 'rgba(168, 140, 255, 0.95)';
      const act = giro < 0 ? 'WI' : 'D2';
      if (listo || t < 7) {
        const col = act === 'WI' ? cWI : cD2, x0 = act === 'WI' ? WX + 18 : DX - 21;
        for (let k = -1; k <= 1; k++) g.linea([[x0, MY + k * 4], [MX + k * 3 * (act === 'WI' ? 1 : -1), MY + k * 4], [MX + k * 2, SY + 38]], { color: col, lw: 2, alpha: 0.75 });
        for (let i = 0; i < 4; i++) {
          const u = ((t * 1.3 + i / 4) % 1);
          const px = u < 0.5 ? lerp(x0, MX, u * 2) : MX, py = u < 0.5 ? MY : lerp(MY, SY + 38, (u - 0.5) * 2);
          g.circulo(px, py, 3, { fill: col });
        }
      }
      // espejo conmutador (segmento) y su eje
      const L = 26, ca = Math.cos(ang), sa = Math.sin(ang);
      g.linea([[MX - ca * L, MY + sa * L], [MX + ca * L, MY - sa * L]], { color: C.metalOsc, lw: 6 });
      g.linea([[MX - ca * L, MY + sa * L], [MX + ca * L, MY - sa * L]], { color: '#e8edf3', lw: 2.4 });
      g.circulo(MX, MY, 4, { fill: C.texto2 });
      g.rotulo('Espejo conmutador', MX, MY + 46, { size: 10 });
      if (!listo && t > 7) g.texto('girando…', MX + 34, MY - 30, { size: 10, color: C.acento, weight: 700 });

      /* --- energía de las lámparas --- */
      const gx = 352, gy = 44, gw = 270, gh = 252, l0 = 190, l1 = 1100;
      const X = (v) => gx + 8 + ((v - l0) / (l1 - l0)) * (gw - 16), Y = (e) => gy + gh - 22 - e * (gh - 52);
      g.rect(gx, gy, gw, gh, { fill: C.panel, stroke: C.linea, r: 6 });
      g.texto('Energía relativa (forma aproximada)', gx + 8, gy + 12, { size: 10, color: C.texto2, weight: 600 });
      // zona de cambio
      g.rect(X(300), gy + 24, X(350) - X(300), gh - 46, { fill: C.acento, alpha: 0.12 });
      g.texto('cambio', (X(300) + X(350)) / 2, gy + 30, { size: 9, color: C.acento, align: 'center', weight: 600 });
      // espectro visible de fondo en el eje
      for (let v = 380; v < 780; v += 4) g.rect(X(v), gy + gh - 20, X(v + 4) - X(v) + 0.5, 4, { fill: colorNm(v), alpha: 0.9 });
      const curva = (f, col, alpha) => { const pts = []; for (let v = l0; v <= l1; v += 3) pts.push([X(v), Y(f(v))]); g.linea(pts, { color: col, lw: 1.8, alpha }); };
      curva(energiaWI, '#e8a33a', 1);
      curva(energiaD2, '#8b6cf0', t > 3.5 ? 1 : 0.25);
      g.texto('WI', X(820), Y(energiaWI(820)) - 10, { size: 10, color: '#e8a33a', weight: 700 });
      g.texto('D₂', X(250) + 8, Y(energiaD2(250)) - 8, { size: 10, color: '#8b6cf0', weight: 700, alpha: t > 3.5 ? 1 : 0.3 });
      if (t > 3.5) { g.texto('486', X(486), Y(energiaD2(486)) - 8, { size: 8.5, color: C.tenue, align: 'center' }); g.texto('656', X(656), Y(energiaD2(656)) - 8, { size: 8.5, color: C.tenue, align: 'center' }); }
      for (const v of [200, 400, 600, 800, 1000]) g.texto(String(v), X(v), gy + gh - 7, { size: 9, color: C.tenue, align: 'center' });
      g.texto('λ (nm)', gx + gw - 8, gy + gh - 30, { size: 9, color: C.tenue, align: 'right' });
      // cursor de la longitud de onda medida
      if (t > 7) {
        g.linea([[X(l), gy + 22], [X(l), gy + gh - 22]], { color: colorNm(l), lw: 2, dash: [4, 3] });
        g.rotulo(`${Math.round(l)} nm · ${l < LC ? 'D₂' : 'WI'}`, Math.min(gx + gw - 40, Math.max(gx + 40, X(l))), gy + gh + 16, { size: 10, color: C.texto });
      }
    },
  };
}
