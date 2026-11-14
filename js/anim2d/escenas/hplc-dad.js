// Detector de diodos (DAD) frente a un detector de longitud de onda variable con monocromador de barrido.
// DAD («óptica inversa»): la luz blanca de las lámparas de deuterio y wolframio atraviesa la celda y después se dispersa en una red fija
// sobre la matriz de fotodiodos: cada lectura contiene el espectro entero. Monocromador de barrido: la red dispersa ANTES de la celda,
// una rendija de salida deja pasar una sola longitud de onda y, para obtener un espectro, hay que girar la red y medir punto a punto.
// Todo es función de t. Parámetros: p.diodos (1024), p.rango (texto, «190–950 nm»).
import { tramo, suave, lerp, clamp } from '../dibujo.js';

/** Color aproximado de una longitud de onda (el UV se dibuja violeta tenue). */
function colorNm(nm) {
  let r = 0, g = 0, b = 0;
  if (nm < 380) { r = 0.45; g = 0.2; b = 0.85; }
  else if (nm < 440) { r = (440 - nm) / 60; b = 1; }
  else if (nm < 490) { g = (nm - 440) / 50; b = 1; }
  else if (nm < 510) { g = 1; b = (510 - nm) / 20; }
  else if (nm < 580) { r = (nm - 510) / 70; g = 1; }
  else if (nm < 645) { r = 1; g = (645 - nm) / 65; }
  else r = 1;
  return `rgb(${Math.round(r * 235)},${Math.round(g * 215)},${Math.round(b * 235)})`;
}
// espectro de absorción del analito que pasa por la celda (cafeína: máximos a 205 y 273 nm), sin escala absoluta
const absorb = (nm) => 1.0 * Math.exp(-((nm - 273) ** 2) / (2 * 13 * 13)) + 1.9 * Math.exp(-((nm - 206) ** 2) / (2 * 9 * 9));
const L0 = 190, L1 = 400;

export default function crear(p = {}) {
  const n = p.diodos || 1024, rango = p.rango || '190–950 nm';
  // presencia del pico en la celda (el compuesto pasa por la celda entre t = 4 y t = 9 y de nuevo en la parte de barrido)
  const pico = (t) => Math.exp(-((t - 6.5) ** 2) / (2 * 0.9 * 0.9)) + Math.exp(-((t - 14.5) ** 2) / (2 * 1.1 * 1.1));

  return {
    titulo: 'Detector de diodos',
    dur: 20,
    fases: [
      { t: 0, texto: 'La lámpara de deuterio emite en el ultravioleta y la de wolframio, situada detrás, en el visible y el infrarrojo cercano. Ambas comparten eje: la luz del wolframio atraviesa la abertura de la de deuterio.' },
      { t: 3.2, texto: 'El acromático concentra la luz blanca en la celda de flujo, por la que pasa el eluyente. Cada compuesto absorbe ciertas longitudes de onda según la ley de Lambert-Beer.' },
      { t: 6.5, texto: `Solo después de la celda la luz se dispersa: la rendija y una red holográfica fija reparten el espectro sobre ${n} fotodiodos. Todas las longitudes de onda se miden a la vez, hasta 120 veces por segundo.` },
      { t: 10.5, texto: 'En un detector de longitud de onda variable la red dispersa antes de la celda y una rendija de salida deja pasar una sola longitud de onda. Para registrar un espectro hay que girar la red y medir punto a punto.' },
      { t: 14.5, texto: `Si el pico sale durante el barrido, el espectro queda deformado. El DAD registra el espectro completo (${rango}) en cada lectura: permite comprobar la pureza de un pico e identificarlo por su espectro.` },
    ],
    dibujar(g, t) {
      const C = g.C, ctx = g.ctx;
      const enDAD = t < 10.5;
      const kp = pico(t);
      /* ===================== DAD (arriba) ===================== */
      const Y = 92;
      g.camara(8, 22, 624, 150, { titulo: 'Detector de diodos (DAD): la luz atraviesa la celda y después se dispersa', alpha: enDAD ? 1 : 0.55 });
      const al = enDAD ? 1 : 0.5;
      // lámparas
      g.circulo(40, Y, 11, { fill: C.foton, alpha: 0.25 * al }); g.circulo(40, Y, 6, { fill: C.foton, alpha: al });
      g.texto('W', 40, Y + 22, { size: 9.5, color: C.texto2, align: 'center', alpha: al });
      g.rect(62, Y - 18, 22, 36, { fill: C.panel, stroke: C.anion, lw: 1.4, r: 8, alpha: al });
      g.circulo(73, Y, 3, { fill: C.panel, stroke: C.anion, lw: 1, alpha: al });
      g.texto('D₂', 73, Y + 28, { size: 9.5, color: C.texto2, align: 'center', alpha: al });
      // haz blanco hasta la celda
      const kH = enDAD ? tramo(t, 0.4, 3.4) : 1;
      g.linea([[46, Y], [lerp(46, 210, kH), Y]], { color: C.foton, lw: 5, alpha: 0.55 * al });
      // acromático
      ctx.save(); ctx.globalAlpha = al; ctx.beginPath(); ctx.ellipse(120, Y, 5, 20, 0, 0, Math.PI * 2); ctx.fillStyle = C.frio; ctx.globalAlpha = 0.35 * al; ctx.fill(); ctx.restore();
      g.texto('acromático', 120, Y + 32, { size: 9.5, color: C.texto2, align: 'center', alpha: al });
      // celda de flujo con el compuesto
      g.rect(166, Y - 13, 46, 26, { fill: C.vacio, stroke: C.metalOsc, lw: 1.4, r: 3, alpha: al });
      g.rect(168, Y - 6, 42, 12, { fill: C.m[2], alpha: (0.12 + 0.5 * kp) * al });
      g.linea([[176, Y - 26], [176, Y - 13]], { color: C.metalOsc, lw: 2, alpha: al }); g.linea([[202, Y + 13], [202, Y + 26]], { color: C.metalOsc, lw: 2, alpha: al });
      g.texto('celda de flujo', 189, Y + 38, { size: 9.5, color: C.texto2, align: 'center', alpha: al });
      // luz transmitida → rendija → red
      const kT = enDAD ? tramo(t, 3.6, 6.4) : 1;
      if (kT > 0) {
        g.linea([[212, Y], [lerp(212, 330, kT), Y]], { color: C.foton, lw: 4, alpha: 0.5 * al });
        g.rect(258, Y - 16, 5, 13, { fill: C.metalOsc, alpha: al }); g.rect(258, Y + 3, 5, 13, { fill: C.metalOsc, alpha: al });
        g.texto('rendija', 260, Y + 30, { size: 9.5, color: C.texto2, align: 'center', alpha: al });
      }
      // red holográfica cóncava y abanico sobre la matriz
      ctx.save(); ctx.globalAlpha = al; ctx.strokeStyle = C.metalOsc; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(390, Y, 60, Math.PI - 0.32, Math.PI + 0.32); ctx.stroke(); ctx.restore();
      g.texto('red', 336, Y + 30, { size: 9.5, color: C.texto2, align: 'center', alpha: al });
      const kF = enDAD ? tramo(t, 6.3, 7.6) : 1;
      const AX = 470, AY0 = 40, AY1 = 150;                       // matriz de diodos (vertical)
      if (kF > 0) {
        for (let i = 0; i <= 30; i++) {
          const nm = 190 + (i / 30) * 760, y = lerp(AY1, AY0, i / 30);                  // la matriz cubre 190–950 nm
          const tr = Math.pow(10, -absorb(nm) * 0.9 * kp);
          g.linea([[332, Y], [lerp(332, AX, kF), lerp(Y, y, kF)]], { color: colorNm(nm), lw: 1.4, alpha: 0.65 * tr * al });
        }
      }
      // matriz
      g.rect(AX, AY0 - 4, 10, AY1 - AY0 + 8, { fill: C.texto2, r: 2, alpha: al });
      for (let i = 0; i < 28; i++) g.rect(AX + 1.5, AY0 + i * ((AY1 - AY0) / 28), 7, 2.4, { fill: C.panel, alpha: 0.5 * al });
      g.texto(`${n} fotodiodos · 190–950 nm`, AX + 5, AY1 + 16, { size: 9.5, color: C.texto2, align: 'center', alpha: al });
      // espectro instantáneo leído por la matriz
      const GX = 500, GW = 122, GY = 44, GH = 100;
      g.rect(GX, GY, GW, GH, { fill: C.panel, stroke: C.linea, r: 4, alpha: al });
      if (kF > 0.5) {
        const pts = []; for (let i = 0; i <= 60; i++) { const nm = L0 + (i / 60) * (L1 - L0); pts.push([GX + 6 + (i / 60) * (GW - 12), GY + GH - 14 - clamp(absorb(nm) * kp / 2) * (GH - 30)]); }
        g.linea(pts, { color: C.acento, lw: 1.6, alpha: al });
      }
      g.texto('espectro en cada lectura', GX + 6, GY + 10, { size: 9, color: C.texto2, weight: 600, alpha: al });
      g.texto('190 nm', GX + 6, GY + GH - 4, { size: 8.5, color: C.tenue, alpha: al }); g.texto('400 nm', GX + GW - 6, GY + GH - 4, { size: 8.5, color: C.tenue, align: 'right', alpha: al });

      /* ===================== monocromador de barrido (abajo) ===================== */
      const Y2 = 262, alB = enDAD ? 0.5 : 1;
      g.camara(8, 182, 624, 150, { titulo: 'Longitud de onda variable: la red dispersa antes de la celda y se barre', alpha: alB });
      g.circulo(40, Y2, 6, { fill: C.foton, alpha: alB });
      g.linea([[46, Y2], [128, Y2]], { color: C.foton, lw: 5, alpha: 0.5 * alB });
      // red giratoria
      const kS = clamp((t - 11) / 7.5), nmS = L0 + kS * (L1 - L0);
      const giro = -0.35 + kS * 0.7;
      ctx.save(); ctx.globalAlpha = alB; ctx.translate(140, Y2); ctx.rotate(giro); ctx.fillStyle = C.metalOsc; ctx.fillRect(-3, -22, 6, 44); ctx.restore();
      g.texto('red (gira)', 140, Y2 + 40, { size: 9.5, color: C.texto2, align: 'center', alpha: alB });
      for (let i = 0; i <= 12; i++) { const nm = 190 + (i / 12) * 760; g.linea([[143, Y2], [228, Y2 - 40 + (i / 12) * 80]], { color: colorNm(nm), lw: 1.2, alpha: 0.4 * alB }); }
      // rendija de salida: pasa una sola λ
      g.rect(228, Y2 - 40, 5, 36, { fill: C.metalOsc, alpha: alB }); g.rect(228, Y2 + 4, 5, 36, { fill: C.metalOsc, alpha: alB });
      g.linea([[233, Y2], [300, Y2]], { color: colorNm(nmS), lw: 4, alpha: 0.85 * alB });
      g.rect(300, Y2 - 13, 46, 26, { fill: C.vacio, stroke: C.metalOsc, lw: 1.4, r: 3, alpha: alB });
      g.rect(302, Y2 - 6, 42, 12, { fill: C.m[2], alpha: (0.12 + 0.5 * kp) * alB });
      g.linea([[346, Y2], [392, Y2]], { color: colorNm(nmS), lw: 3, alpha: 0.6 * alB * Math.pow(10, -absorb(nmS) * 0.9 * kp) });
      g.rect(392, Y2 - 12, 10, 24, { fill: C.texto2, r: 2, alpha: alB });
      g.texto('celda', 323, Y2 + 30, { size: 9.5, color: C.texto2, align: 'center', alpha: alB });
      g.texto('1 fotodiodo', 397, Y2 + 30, { size: 9.5, color: C.texto2, align: 'center', alpha: alB });
      g.texto(`${Math.round(nmS)} nm`, 268, Y2 - 14, { size: 10, color: C.texto, align: 'center', weight: 700, alpha: alB });
      // espectro construido punto a punto durante el barrido (deformado si el pico cambia mientras se barre)
      const HX = 440, HW = 182, HY = 204, HH = 116;
      g.rect(HX, HY, HW, HH, { fill: C.panel, stroke: C.linea, r: 4, alpha: alB });
      g.texto('espectro por barrido', HX + 6, HY + 10, { size: 9, color: C.texto2, weight: 600, alpha: alB });
      const Xs = (nm) => HX + 6 + ((nm - L0) / (L1 - L0)) * (HW - 12), Ys = (a) => HY + HH - 14 - clamp(a / 2) * (HH - 30);
      // espectro verdadero (referencia, discontinua)
      const ref = []; for (let i = 0; i <= 60; i++) { const nm = L0 + (i / 60) * (L1 - L0); ref.push([Xs(nm), Ys(absorb(nm))]); }
      g.linea(ref, { color: C.tenue, lw: 1, dash: [3, 3], alpha: alB });
      if (!enDAD) {
        const med = []; const n2 = Math.round(kS * 60);
        for (let i = 0; i <= n2; i++) { const kk = i / 60, nm = L0 + kk * (L1 - L0), tt = 11 + kk * 7.5; med.push([Xs(nm), Ys(absorb(nm) * pico(tt))]); }
        if (med.length > 1) g.linea(med, { color: C.ion, lw: 1.6 });
        g.texto('medido', HX + HW - 6, HY + 10, { size: 9, color: C.ion, align: 'right', weight: 600 });
        g.texto('real', HX + HW - 6, HY + 22, { size: 9, color: C.tenue, align: 'right' });
      }
      g.texto('190 nm', HX + 6, HY + HH - 4, { size: 8.5, color: C.tenue, alpha: alB }); g.texto('400 nm', HX + HW - 6, HY + HH - 4, { size: 8.5, color: C.tenue, align: 'right', alpha: alB });
      // indicador del pico que pasa por la celda
      g.medidor(170, 336, 120, kp / 1.05, { etiqueta: 'compuesto en la celda', color: C.m[2] });
    },
  };
}
