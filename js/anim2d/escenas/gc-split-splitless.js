// Inyector split/splitless en corte (geometría de Agilent): el portador entra por la cabeza, baja por el interior del liner y,
// en el fondo, una parte entra en la columna y el resto sube por el espacio entre el liner y el cuerpo hasta la salida del venteo
// de split. La purga barre la cara inferior del septum. Se muestran una inyección en split y otra en splitless con su purga,
// junto a un balance de caudales. Escena sin estado: todo se calcula como función de t.
// Parámetros: p.ratio (relación de split, 50), p.columna (caudal de columna en mL/min, 1,2), p.temp (texto, '250 °C'),
// p.purga (texto del tiempo de purga, '0,75 min'), p.gas ('helio').
import { tramo, suave, lerp, azar, clamp } from '../dibujo.js';
import { recorrido } from './util-servicios.js';

const CX = 200;                 // eje del inyector
const BX0 = 125, BX1 = 275;     // cuerpo
const BY0 = 70, BY1 = 300;
const LX0 = 172, LX1 = 228;     // liner (exterior)
const AX = 251;                 // eje del espacio anular (derecha)
const T_SPLIT = 3.2, T_SL = 11.4, T_ABRE = 16.6;
const num = (v, d = 1) => v.toLocaleString('es-ES', { minimumFractionDigits: d, maximumFractionDigits: d });

export default function crear(p = {}) {
  const ratio = p.ratio || 50, Fc = p.columna || 1.2, temp = p.temp || '250 °C', purga = p.purga || '0,75 min', gas = p.gas || 'helio';
  const R = azar(5);
  const pBajada = recorrido([[CX, 74], [CX, 150], [CX, 290]]);
  const pColumna = recorrido([[CX, 290], [CX, 312], [CX, 352]]);
  const pAnular = recorrido([[CX, 292], [222, 300], [AX, 288], [AX, 180], [AX, 104], [AX + 16, 92], [300, 92], [384, 92]]);
  const pPortador = recorrido([[20, 62], [100, 62], [160, 62], [CX - 6, 66], [CX, 74]]);
  const pPurga = recorrido([[CX + 18, 54], [300, 54], [384, 54]]);
  const vap = Array.from({ length: 76 }, (_, i) => ({ c: i % 5 === 4 ? -1 : i % 3, u: R(), v: R(), w: R(), col: R() < 0.09 }));

  return {
    titulo: 'Inyección split y splitless',
    dur: 21,
    fases: [
      { t: 0, texto: `El portador (${gas}) entra por la cabeza del inyector, a ${temp}, y baja por el interior del liner. En el fondo una parte entra en la columna y el resto sube por fuera del liner hasta el venteo de split. Un caudal pequeño barre la cara inferior del septum (purga).` },
      { t: T_SPLIT, texto: 'La aguja atraviesa el septum y deposita 1 µL de muestra. En el liner caliente la gota se vaporiza en milisegundos y forma una nube de vapor de varios cientos de microlitros.' },
      { t: 6.4, texto: `Modo split: la válvula del venteo está abierta. Con una relación ${ratio}:1, de cada ${ratio + 1} partes de vapor solo una entra en la columna; el resto sale por el venteo. La banda inicial es muy estrecha: adecuado para muestras concentradas.` },
      { t: T_SL, texto: `Modo splitless: la válvula del venteo se cierra antes de inyectar. Durante el tiempo de purga (${purga}) el vapor solo puede salir hacia la columna, y casi toda la muestra entra en ella: se gana sensibilidad para trazas.` },
      { t: 14.2, texto: 'Con el horno por debajo del punto de ebullición del disolvente, los analitos que llegan poco a poco quedan retenidos en la cabeza de la columna, fría, y se reconcentran en una banda estrecha.' },
      { t: T_ABRE, texto: 'Al terminar el tiempo de purga se abre el venteo: el vapor que queda en el liner, casi todo disolvente, sale por él. Después el programa de temperatura del horno inicia la separación.' },
    ],
    dibujar(g, t) {
      const C = g.C;
      const splitAbierto = t < T_SL - 0.6 || t > T_ABRE;
      const modoSL = t >= T_SL - 0.6;
      /* --- bloque calefactado, cuerpo y liner --- */
      g.rect(BX0 - 22, 80, BX1 - BX0 + 44, 222, { fill: C.calor, alpha: 0.09, r: 6 });
      g.rect(BX0, BY0, BX1 - BX0, BY1 - BY0, { fill: C.vacio, stroke: C.metalOsc, lw: 1.6, r: 3 });
      g.rect(LX0, 78, LX1 - LX0, 218, { fill: C.panel, alpha: 0.35 });
      g.rect(LX0, 78, 7, 218, { fill: C.gas, alpha: 0.35 }); g.rect(LX1 - 7, 78, 7, 218, { fill: C.gas, alpha: 0.35 });
      g.rect(LX0, 78, LX1 - LX0, 218, { stroke: C.gas, lw: 1.2, alpha: 0.8 });
      for (let i = 0; i < 16; i++) { const y = 196 + (i % 8) * 3, x = LX0 + 9 + ((i * 37) % 36); g.linea([[x, y], [x + 9, y + 4]], { color: C.tenue, lw: 0.9, alpha: 0.7 }); }
      g.circulo(LX0 - 3, 86, 4, { fill: C.metalOsc }); g.circulo(LX1 + 3, 86, 4, { fill: C.metalOsc });
      g.rect(CX - 18, BY1 - 4, 36, 6, { fill: '#d4a63a', r: 2 });
      g.rect(CX - 3, BY1 + 2, 6, 58, { fill: '#c8902e' }); g.rect(CX - 1.2, BY1 + 2, 2.4, 58, { fill: C.vacio });
      g.texto(`Bloque calefactado · ${temp}`, CX - 10, 314, { size: 9.5, color: C.calor, weight: 600, align: 'right' });
      g.rotulo('Columna', CX + 40, 344, { size: 10 });
      g.rotulo('Liner', BX0 - 46, 160, { size: 10 });
      g.rotulo('Lana de vidrio', BX0 - 46, 206, { size: 9.5 });
      g.rotulo('Sello de oro', BX0 - 46, 296, { size: 9.5 });
      // septum y tuerca
      g.rect(CX - 28, 30, 56, 12, { fill: C.metal, stroke: C.metalOsc, lw: 1, r: 2 });
      g.rect(CX - 22, 42, 44, 10, { fill: C.ok, alpha: 0.75, r: 2 });
      g.rotulo('Septum', CX + 64, 36, { size: 10 });
      // conductos: portador, purga y venteo
      g.linea([[20, 62], [BX0, 62]], { color: C.metalOsc, lw: 7 }); g.linea([[20, 62], [BX0, 62]], { color: C.vacio, lw: 4 });
      g.texto(`Portador (${gas})`, 20, 48, { size: 10, color: C.texto2, weight: 600 });
      g.linea([[BX1, 54], [384, 54]], { color: C.metalOsc, lw: 6 }); g.linea([[BX1, 54], [384, 54]], { color: C.vacio, lw: 3 });
      g.texto('Purga del septum', 392, 54, { size: 10, color: C.texto2, weight: 600 });
      g.linea([[BX1, 92], [384, 92]], { color: C.metalOsc, lw: 7 }); g.linea([[BX1, 92], [384, 92]], { color: C.vacio, lw: 4 });
      const vx = 404;
      g.linea([[384, 92], [vx - 12, 92]], { color: C.metalOsc, lw: 4 });
      g.circulo(vx, 92, 12, { fill: C.panel, stroke: splitAbierto ? C.ok : C.mal, lw: 2 });
      if (splitAbierto) g.linea([[vx - 7, 92], [vx + 7, 92]], { color: C.ok, lw: 3 }); else g.linea([[vx, 85], [vx, 99]], { color: C.mal, lw: 3 });
      g.linea([[vx + 12, 92], [432, 92]], { color: C.metalOsc, lw: 4 });
      g.rect(432, 82, 56, 20, { fill: C.texto2, alpha: 0.6, r: 6 });
      g.texto('Trampa', 460, 92.5, { size: 9.5, color: '#fff', align: 'center', weight: 700 });
      g.texto('→ EPC', 494, 92.5, { size: 10, color: C.tenue, weight: 700 });
      g.texto(splitAbierto ? 'Venteo de split abierto' : 'Venteo de split cerrado', 300, 112, { size: 10, color: splitAbierto ? C.ok : C.mal, weight: 700 });

      /* --- flujo del portador --- */
      for (let i = 0; i < 9; i++) { const P = pPortador((t * 0.32 + i / 9) % 1); g.circulo(P.x, P.y, 2, { fill: C.gas, alpha: 0.8 }); }
      for (let i = 0; i < 8; i++) { const P = pBajada((t * 0.22 + i / 8) % 1); g.circulo(P.x + Math.sin(i * 2.1) * 15, P.y, 2, { fill: C.gas, alpha: 0.55 }); }
      for (let i = 0; i < 6; i++) { const P = pPurga((t * 0.25 + i / 6) % 1); g.circulo(P.x, P.y, 1.8, { fill: C.gas, alpha: 0.7 }); }
      if (splitAbierto) for (let i = 0; i < 10; i++) { const P = pAnular((t * 0.3 + i / 10) % 1); g.circulo(P.x, P.y, 2, { fill: C.gas, alpha: 0.7 }); }
      for (let i = 0; i < 3; i++) { const P = pColumna((t * 0.35 + i / 3) % 1); g.circulo(P.x, P.y, 1.6, { fill: C.gas, alpha: 0.8 }); }

      /* --- inyecciones: aguja y nube de vapor --- */
      for (const [ti, modo] of [[T_SPLIT, 'split'], [T_SL, 'sl']]) {
        const kA = tramo(t, ti, ti + 0.8) - tramo(t, ti + 1.4, ti + 2.0);
        if (kA > 0) {
          const yp = lerp(4, 128, suave(kA));
          g.linea([[CX, -10], [CX, yp]], { color: C.metalOsc, lw: 2 });
          g.rect(CX - 7, yp - 74, 14, 30, { fill: C.metal, stroke: C.metalOsc, lw: 0.8, r: 2 });
        }
        const tv = t - (ti + 0.8);
        if (tv <= 0 || (modo === 'split' && t > T_SL - 0.8)) continue;
        if (tv < 0.4) for (let i = 0; i < 4; i++) g.circulo(CX + (i - 1.5) * 4, 134 + tv * 30, 2.4, { fill: C.liquido });
        for (const q of vap) {
          const exp = clamp(tv / 1.2);
          let x = CX + (q.u - 0.5) * 42 * (0.2 + 0.8 * exp), y = 134 + (q.v - 0.3) * 140 * exp;
          const col = q.c < 0 ? C.neutro : C.m[q.c];
          if (modo === 'split') {
            const s = (tv - 1.6 - q.w * 2.2) * 0.45;
            if (s > 0) {
              if (q.col && q.c >= 0) { if (s * 1.4 > 1) continue; const P = pColumna(clamp(s * 1.4)); x = P.x; y = P.y; }
              else { if (s > 1) continue; const P = pAnular(clamp(s)); x = P.x; y = P.y; }
            }
          } else {
            const dn = clamp((tv - 1.0) / 3.0) * (q.c < 0 ? q.w * 0.8 + 0.2 : 1);
            y = lerp(y, 286, dn);
            if (q.c >= 0 && dn > 0.75 * (q.w * 0.8 + 0.2)) {
              const k = clamp((dn - 0.6) * 3);
              x = lerp(x, CX + (q.u - 0.5) * 2, k); y = lerp(y, 316 + q.v * 14, k);
            }
            if (q.c < 0 && t > T_ABRE) { const s = (t - T_ABRE) * 0.35 - q.w * 0.3; if (s > 1) continue; if (s > 0) { const P = pAnular(s); x = P.x; y = P.y; } }
          }
          g.circulo(x, y, 2.6, { fill: col, alpha: 0.9 });
        }
      }
      if (t > 14.4) g.rotulo('Analitos reconcentrados', CX + 76, 320, { size: 10, color: C.ion });

      /* --- balance de caudales --- */
      const PX = 470, PY = 140, PW = 156;
      g.rect(PX, PY, PW, 206, { fill: C.panel, stroke: C.linea, r: 6 });
      g.texto(modoSL ? 'Splitless' : `Split ${ratio}:1`, PX + 10, PY + 16, { size: 12, color: C.acento, weight: 700 });
      g.texto('caudales, mL/min', PX + PW - 8, PY + 16, { size: 9, color: C.tenue, align: 'right' });
      const vent = modoSL ? (t > T_ABRE ? 50 : 0) : Fc * ratio;
      const filas = [['Columna', Fc, C.acento], ['Venteo de split', vent, C.ok], ['Purga del septum', 3, C.gas]];
      const tot = filas.reduce((a, f) => a + f[1], 0);
      filas.push(['Entrada total', tot, C.texto2]);
      filas.forEach(([n, v, col], i) => {
        const y = PY + 40 + i * 30;
        g.texto(n, PX + 10, y, { size: 10, color: C.texto2 });
        g.texto(num(v, v < 10 ? 1 : 0), PX + PW - 10, y, { size: 10.5, color: C.texto, align: 'right', weight: 700, mono: true });
        g.medidor(PX + 10, y + 8, PW - 20, Math.min(1, v / 70), { color: col });
      });
      const fr = modoSL ? 'casi toda' : `1 de cada ${ratio + 1}`;
      g.texto('Muestra que entra en la columna:', PX + 10, PY + 166, { size: 9.5, color: C.texto2 });
      g.texto(fr, PX + 10, PY + 182, { size: 11, color: C.ion, weight: 700 });
      if (modoSL && t > T_SL) {
        const k = clamp((t - T_SL - 0.8) / (T_ABRE - T_SL - 0.8));
        g.medidor(300, 150, 150, k, { etiqueta: `Tiempo de purga (${purga})`, color: C.mal });
        if (t > T_ABRE) g.texto('caudal de venteo tras la purga: ejemplo', PX + 10, PY + 198, { size: 8.5, color: C.tenue, italic: true });
      }
      g.leyenda([[C.gas, 'portador'], [C.m[0], 'analitos'], [C.neutro, 'disolvente']], 290, 352, { size: 10 });
    },
  };
}
