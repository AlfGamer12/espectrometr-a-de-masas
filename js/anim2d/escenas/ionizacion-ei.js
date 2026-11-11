// Ionización por impacto electrónico (EI) en una fuente de cámara cerrada, como la del Agilent 5977 o la del sector de doble enfoque.
// Corte esquemático: haz de electrones vertical (filamento → trampa), moléculas que llegan de la columna, repulsor detrás y
// lentes de extracción hacia el analizador. Todo se dibuja como función de t (sin estado), así que se puede saltar a cualquier fase.
// Parámetros: p.filamento ('renio' | 'wolframio'…), p.energia (eV, 70), p.destino ('cuadrupolo' | 'sector'), p.potencial (texto opcional de la fuente).
import { tramo, suave, easeOut, lerp, azar } from '../dibujo.js';

export default function crear(p = {}) {
  const E = p.energia || 70;
  const fil = p.filamento ? `Filamento de ${p.filamento}` : 'Filamento';
  const destino = p.destino === 'sector' ? 'Hacia el analizador' : 'Hacia el cuadrupolo';
  const BX = 300; // eje del haz de electrones
  const HY = 182; // eje de extracción de iones
  const fondo = azar(11);
  const mols = Array.from({ length: 9 }, (_, i) => ({ y: 120 + fondo() * 130, v: 26 + fondo() * 16, f: fondo() * 20, s: 20 + i }));

  return {
    titulo: 'Ionización por impacto electrónico',
    dur: 17,
    fases: [
      { t: 0, texto: `${fil} caliente emite electrones. Una diferencia de potencial los acelera hasta ${E} eV y un pequeño imán los mantiene en un haz estrecho que cruza la cámara hasta la trampa.` },
      { t: 3.2, texto: 'Las moléculas neutras salen de la columna capilar y atraviesan la cámara. La mayoría cruza el haz sin interactuar y la bomba de vacío las retira.' },
      { t: 6, texto: `Cuando un electrón de ${E} eV pasa muy cerca de una molécula, le transfiere energía y le arranca un electrón: se forma el ion molecular M•⁺, un catión radical.` },
      { t: 8.6, texto: 'La energía sobrante queda en la molécula como vibración y rompe sus enlaces más débiles: aparece un ion fragmento y un radical neutro. Este patrón es reproducible y permite comparar con bibliotecas de espectros.' },
      { t: 11.6, texto: 'El repulsor, con potencial positivo, empuja los cationes hacia la salida. Las lentes de extracción y de enfoque los aceleran y concentran el haz. El radical neutro no siente el campo y se pierde.' },
    ],
    dibujar(g, t) {
      const C = g.C;
      /* --- cámara y piezas --- */
      g.camara(120, 70, 300, 224, { titulo: 'Cámara de ionización' });
      // filamento (zigzag) y trampa de electrones
      const brillo = 0.55 + 0.45 * Math.sin(t * 9) ** 2;
      g.circulo(BX, 44, 16, { fill: C.calor, alpha: 0.12 * brillo });
      const zz = [];
      for (let i = 0; i <= 8; i++) zz.push([BX - 16 + i * 4, 44 + (i % 2 ? -4 : 4)]);
      g.linea(zz, { color: C.calor, lw: 2.2 });
      g.rotulo(fil, BX + 74, 36, { size: 10 });
      g.electrodo(BX - 18, 318, 36, 9, {});
      g.rotulo('Trampa de electrones', BX + 92, 322, { size: 10 });
      // imán (polos N/S) a ambos lados del filamento y la trampa
      g.rect(BX - 46, 30, 14, 26, { fill: C.mal, r: 2, alpha: 0.75 }); g.texto('N', BX - 39, 43, { size: 9, color: '#fff', align: 'center', weight: 700 });
      g.rect(BX - 46, 308, 14, 26, { fill: C.acento, r: 2, alpha: 0.75 }); g.texto('S', BX - 39, 321, { size: 9, color: '#fff', align: 'center', weight: 700 });
      // repulsor y lentes
      const kRep = tramo(t, 11.6, 12.4);
      g.electrodo(140, HY - 60, 9, 120, { color: kRep > 0 ? C.ion : C.metal, alpha: 0.6 + 0.4 * kRep });
      g.texto('+', 144.5, HY - 70, { size: 13, color: C.ion, align: 'center', weight: 800, alpha: kRep });
      g.rotulo('Repulsor', 144, HY + 76, { size: 10 });
      const lentes = [[436, 'Extractora'], [466, 'Enfoque'], [496, 'Entrada']];
      for (const [x, nom] of lentes) {
        g.electrodo(x, HY - 66, 7, 54, {}); g.electrodo(x, HY + 12, 7, 54, {});
      }
      g.rotulo('Lentes', 470, HY + 82, { size: 10 });
      g.flecha(540, HY, 610, HY, { color: C.tenue, lw: 1.2 });
      g.texto(destino, 612, HY - 14, { size: 10, color: C.tenue, align: 'right' });
      // columna capilar
      g.linea([[196, 358], [240, 262]], { color: C.metalOsc, lw: 5 });
      g.linea([[196, 358], [240, 262]], { color: C.metal, lw: 2.5 });
      g.rotulo('Columna capilar', 150, 316, { size: 10 });

      /* --- electrones del haz: corriente continua de arriba abajo, con leve giro por el imán --- */
      const vel = 210;
      for (let i = 0; i < 14; i++) {
        const y = 60 + ((t * vel + i * 19) % 256);
        const x = BX + Math.sin((y + i * 7) * 0.12) * 3;
        g.electron(x, y, { estela: [0, 9] });
      }
      g.texto(`e⁻  ${E} eV`, BX + 12, 84, { size: 10.5, color: C.e, weight: 700 });

      /* --- moléculas de fondo que cruzan sin ionizarse --- */
      for (const m of mols) {
        const u = ((t + m.f) * m.v) % 360;
        const x = 150 + u, y = m.y + Math.sin(u * 0.03 + m.s) * 6;
        if (x > 420) continue;
        if (Math.abs(x - 300) < 30 && Math.abs(y - HY) < 26 && t > 5 && t < 12) continue; // no tapar la molécula protagonista
        g.molecula(x, y, { r: 2.6, n: 4, rot: u * 0.02 + m.s, semilla: m.s, alpha: 0.45 });
      }

      /* --- molécula protagonista --- */
      const kLlega = suave(tramo(t, 3.2, 6));
      const mx0 = 240, my0 = 262;
      let mx = lerp(mx0, BX - 6, kLlega), my = lerp(my0, HY, kLlega);
      const vibra = t > 7 ? Math.sin(t * 40) * Math.min(1, (t - 7) * 0.8) * 1.6 : 0;
      const kRot = tramo(t, 9.4, 10.6);            // ruptura
      const kSale = easeOut(tramo(t, 12.2, 16.2)); // extracción
      if (t > 3.2 && t < 9.4) {
        g.molecula(mx + vibra, my, { r: 5, n: 5, rot: t * 0.5, semilla: 7 });
        if (t > 6.5) g.ion(mx + 16, my - 16, { r: 6, q: 1, alpha: tramo(t, 6.5, 7) });
      }
      // colisión: un electrón del haz se desvía y otro sale despedido de la molécula
      if (t > 5.6 && t < 8.2) {
        const k = tramo(t, 5.6, 6.4), k2 = tramo(t, 6.4, 8.2);
        if (k < 1) g.electron(BX + 2, lerp(120, HY - 8, k), { r: 3.2, estela: [0, 12] });
        else {
          g.electron(lerp(BX + 2, BX + 40, k2), lerp(HY - 8, 300, k2), { r: 3.2 });
          g.electron(lerp(BX - 6, BX - 80, k2), lerp(HY, 96, k2), { r: 3.2 });
          g.texto('2 e⁻', lerp(BX - 6, BX - 80, k2) - 10, lerp(HY, 96, k2) - 10, { size: 10, color: C.e, weight: 700, align: 'right', alpha: 1 - k2 * 0.5 });
        }
        if (k > 0.9) g.circulo(BX - 4, HY - 2, 10 + 20 * tramo(t, 6.3, 6.9), { stroke: C.e, lw: 1.5, alpha: 1 - tramo(t, 6.3, 6.9) });
      }
      if (t > 6.8 && t < 9.4) g.rotulo('M•⁺  ion molecular', mx, my - 38, { size: 10.5, color: C.ion, alpha: tramo(t, 6.8, 7.3) });
      if (t >= 9.4) {
        // fragmentos: ion (sigue el campo) y radical neutro (sigue en línea recta)
        const sep = easeOut(kRot) * 18;
        const fx = mx + sep + kSale * (600 - mx), fy = lerp(my - sep * 0.4, HY, kSale);
        const nx = mx - sep * 0.6 + kSale * 90, ny = my + sep * 1.2 + kSale * 120;
        if (fx < 560) {
          g.molecula(fx, fy, { r: 5, n: 3, rot: t * 0.8, semilla: 4, color: C.ion });
          g.ion(fx + 13, fy - 13, { r: 6, q: 1 });
        }
        if (ny < 300) g.molecula(nx, ny, { r: 5, n: 2, rot: -t * 0.6, semilla: 9, alpha: 1 - kSale * 0.4 });
        if (t < 12.4) {
          g.rotulo('Ion fragmento', fx + 8, fy - 36, { size: 10, color: C.ion, alpha: tramo(t, 9.6, 10) });
          g.rotulo('Radical neutro', nx - 8, ny + 26, { size: 10, alpha: tramo(t, 9.6, 10) });
        }
        if (kSale > 0) {
          // líneas de campo entre repulsor y extractora
          for (let i = -2; i <= 2; i++) g.flecha(160, HY + i * 22, 420, HY + i * 22, { color: C.campo, lw: 1, punta: 5, alpha: 0.7 * tramo(t, 11.6, 12.2) });
        }
      }
      g.leyenda([[C.e, 'electrón', 'e'], [C.neutro, 'molécula neutra'], [C.ion, 'catión']], 400, 348, { size: 9.5 });
    },
  };
}
