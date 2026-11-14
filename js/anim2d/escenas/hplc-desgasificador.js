// Desgasificador de vacío en línea de un HPLC: el disolvente circula por un tubo de membrana permeable a los gases dentro de una
// cámara en la que una bomba mantiene el vacío. Por la ley de Henry el gas disuelto tiende al equilibrio con su presión parcial, que
// fuera del tubo es muy baja: el O₂ y el N₂ difunden a través de la pared y la bomba los evacua. El líquido no atraviesa la membrana.
// Todo es función de t. Parámetros: p.canales (4), p.volumen (texto, «1,5 mL por canal»).
import { tramo, lerp, azar, clamp, suave } from '../dibujo.js';

const YT = 150, RT = 13;                  // eje y radio del tubo de membrana
const CX0 = 130, CX1 = 470;               // cámara de vacío (x)
const V = 34;                             // velocidad del líquido (px/s)

export default function crear(p = {}) {
  const canales = p.canales || 4, volumen = p.volumen || '1,5 mL por canal';
  const R = azar(19);
  const gas = Array.from({ length: 46 }, () => ({ off: R() * 600, dy: (R() - 0.5) * 2 * (RT - 4), xe: lerp(CX0 + 30, CX1 - 20, R()), sale: R() < 0.85, lado: R() < 0.5 ? -1 : 1, s: R() }));
  return {
    titulo: 'Desgasificador de vacío',
    dur: 16,
    fases: [
      { t: 0, texto: 'El disolvente de la botella lleva aire disuelto (O₂ y N₂) en equilibrio con la atmósfera.' },
      { t: 3.5, texto: 'En la cámara del desgasificador el disolvente recorre un tubo de membrana. Fuera del tubo una bomba mantiene el vacío: según la ley de Henry, el gas disuelto tiende a equilibrarse con esa presión parcial casi nula y difunde a través de la pared.' },
      { t: 8, texto: `La membrana, de un copolímero fluorado (TFE/PDD), deja pasar los gases pero no el líquido. El disolvente sale con mucho menos gas disuelto. La G7111B tiene ${canales} canales independientes de ${volumen}.` },
      { t: 12, texto: 'Sin desgasificar, al mezclar agua y acetonitrilo, que juntos disuelven menos aire que por separado, se formarían burbujas en las válvulas de la bomba o en la celda del detector: caudal irregular, ruido y picos falsos.' },
    ],
    dibujar(g, t) {
      const C = g.C;
      // botella y llegada
      g.rect(14, 92, 54, 92, { fill: C.panel, stroke: C.metalOsc, lw: 1.2, r: 6 });
      g.rect(17, 122, 48, 59, { fill: C.liquido, alpha: 0.3, r: 4 });
      g.texto('Botella', 41, 196, { size: 10, color: C.texto2, align: 'center' });
      // cámara de vacío
      g.camara(CX0, 60, CX1 - CX0, 186, { titulo: 'Cámara de vacío' });
      const vac = suave(tramo(t, 1.5, 3.5));
      g.rect(CX0 + 1, 61, CX1 - CX0 - 2, 184, { fill: C.vacio, alpha: 0.6 });
      // bomba de vacío
      g.linea([[CX1 - 30, 60], [CX1 - 30, 36], [560, 36]], { color: C.metalOsc, lw: 4 });
      g.rect(560, 18, 60, 36, { fill: C.panel, stroke: C.metalOsc, lw: 1.2, r: 5 });
      g.texto('bomba de', 590, 31, { size: 9.5, color: C.texto2, align: 'center' }); g.texto('vacío', 590, 43, { size: 9.5, color: C.texto2, align: 'center' });
      g.medidor(CX0 + 14, 228, 110, 0.15 + 0.8 * vac, { etiqueta: 'vacío en la cámara', color: C.acento });
      // tubo de membrana (dentro de la cámara) y conducciones
      const liq = (x0, x1) => g.rect(x0, YT - RT, x1 - x0, 2 * RT, { fill: C.liquido, alpha: 0.32 });
      liq(41, CX0); liq(CX0, CX1); liq(CX1, 600);
      g.linea([[41, 122], [41, YT - RT], [CX0, YT - RT]], { color: C.metalOsc, lw: 2 });
      g.linea([[68, YT + RT], [CX0, YT + RT]], { color: C.metalOsc, lw: 2 });
      g.linea([[CX0, YT - RT], [CX1, YT - RT]], { color: C.anion, lw: 2.4, dash: [7, 4] });
      g.linea([[CX0, YT + RT], [CX1, YT + RT]], { color: C.anion, lw: 2.4, dash: [7, 4] });
      g.linea([[CX1, YT - RT], [600, YT - RT]], { color: C.metalOsc, lw: 2 }); g.linea([[CX1, YT + RT], [600, YT + RT]], { color: C.metalOsc, lw: 2 });
      g.flecha(600, YT, 632, YT, { color: C.texto2 }); g.texto('a la MCGV', 632, YT - 22, { size: 10, color: C.texto2, align: 'right' });
      g.rotulo('Tubo de membrana (permeable a los gases)', (CX0 + CX1) / 2, YT + RT + 22, { size: 10 });
      // flechas del líquido
      for (let i = 0; i < 6; i++) { const x = 60 + ((t * V + i * 95) % 540); g.flecha(x, YT + 6, x + 12, YT + 6, { color: C.liquido, lw: 1.2, punta: 4, alpha: 0.9 }); }
      // moléculas de gas disuelto
      let dentroIni = 0, dentroFin = 0;
      for (const m of gas) {
        const x = 46 + ((t * V + m.off) % 560);
        const yl = YT + m.dy;
        if (!m.sale || x < m.xe || vac < 0.5) {
          g.circulo(x, yl, 2.6, { fill: C.ion });
          if (x < CX0) dentroIni++; else if (x > CX1) dentroFin++;
          continue;
        }
        // atraviesa la pared y la bomba la evacua
        const tau = (x - m.xe) / V;
        if (tau < 0.9) {
          const k = tau / 0.9, y = lerp(yl, YT + m.lado * (RT + 22), suave(k));
          g.circulo(m.xe + tau * 6, y, 2.6, { fill: C.ion });
        } else if (tau < 4.2) {
          const k = (tau - 0.9) / 3.3, x0 = m.xe + 5.4, y0 = YT + m.lado * (RT + 22);
          const px = lerp(x0, CX1 - 30, suave(k)), py = lerp(y0, 62, suave(k)) + Math.sin(tau * 7 + m.s * 9) * 4 * (1 - k);
          g.circulo(px, py, 2.4, { fill: C.ion, alpha: 1 - k * 0.3 });
        } else if (tau < 5) {
          const k = (tau - 4.2) / 0.8; g.circulo(lerp(CX1 - 30, 560, k), lerp(46, 36, Math.min(1, k * 3)), 2.2, { fill: C.ion, alpha: 0.7 });
        }
      }
      g.texto(`gas disuelto a la entrada: ${'●'.repeat(Math.min(8, dentroIni))}`, 14, 280, { size: 10, color: C.texto2 });
      g.texto(`a la salida: ${'●'.repeat(Math.min(8, Math.round(dentroFin * (vac > 0.5 ? 1 : 1))))}`, 14, 298, { size: 10, color: C.texto2 });
      // recuadro: mezcla sin desgasificar
      const kB = tramo(t, 12, 12.6);
      if (kB > 0) {
        g.rect(370, 262, 262, 82, { fill: C.panel, stroke: C.linea, r: 6, alpha: kB });
        g.texto('Sin desgasificar: A + B en la MCGV', 380, 276, { size: 10, color: C.texto2, weight: 600, alpha: kB });
        g.linea([[384, 300], [470, 300], [520, 318], [624, 318]], { color: C.m[2], lw: 6, alpha: 0.4 * kB });
        g.linea([[384, 336], [470, 336], [520, 318]], { color: C.m[5], lw: 6, alpha: 0.4 * kB });
        for (let i = 0; i < 7; i++) { const k = ((t - 12) * 0.35 + i / 7) % 1; g.circulo(lerp(526, 620, k), 318 + Math.sin(i * 2.1) * 2, 2 + k * 3, { stroke: C.texto2, lw: 1, alpha: kB }); }
        g.texto('burbujas', 600, 300, { size: 9.5, color: C.mal, align: 'right', alpha: kB });
      }
      g.leyenda([[C.ion, 'O₂ / N₂ disuelto'], [C.liquido, 'disolvente'], [C.anion, 'membrana']], 14, 346, { size: 9.5 });
    },
  };
}
