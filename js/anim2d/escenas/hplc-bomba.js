// Bomba de HPLC de dos pistones en serie con válvula de gradiente multicanal (MCGV), como la cuaternaria 1260 Infinity II (G7111B).
// Un mismo motor mueve los dos pistones en sentidos opuestos con engranajes 2:1: el pistón 1 va al doble de velocidad que el 2.
//  · aspiración (pistón 1 retrocede): se abre la válvula de entrada; la MCGV deja pasar A y luego B según la composición; el pistón 2
//    avanza y entrega él solo el caudal al sistema;
//  · impulsión (pistón 1 avanza): se abre la válvula de salida; la mitad del volumen llena la cámara 2 (el pistón 2 retrocede) y la
//    otra mitad sale al sistema. El caudal total es constante.
// Todo es función de t. Parámetros: p.presion (texto, «600 bar»), p.relacion (texto, «2 : 1»).
import { tramo, lerp, clamp } from '../dibujo.js';

const T1 = 12, P = 3;                // un primer ciclo lento (0–12 s) y después ciclos de 3 s
const FB = 0.3;                      // fracción de B de la mezcla dibujada
const X1 = 250, X2 = 420, YC = 66, HC = 110, WC = 44;   // cámaras (eje x, techo y, alto, ancho)
const S1 = 60;                       // carrera del pistón 1 (px); la del 2 es la mitad

export default function crear(p = {}) {
  const pres = p.presion || '600 bar', rel = p.relacion || '2 : 1';
  // fase del ciclo: u ∈ [0, 0,5) aspiración del pistón 1; [0,5, 1) impulsión
  const fase = (t) => (t < T1 ? t / T1 : ((t - T1) % P) / P);
  const pos1 = (t) => { const u = fase(t); return u < 0.5 ? (u / 0.5) * S1 : (1 - (u - 0.5) / 0.5) * S1; };   // retroceso (px) desde el punto muerto superior
  const pos2 = (t) => (S1 / 2) - pos1(t) / 2;                                                               // opuesto, la mitad
  const aspira = (t) => fase(t) < 0.5;

  return {
    titulo: 'Bomba de dos pistones en serie',
    dur: 20,
    fases: [
      { t: 0, texto: `Aspiración: el pistón 1 retrocede y la válvula de entrada se abre. La MCGV abre primero el canal A y después el B, cada uno una fracción de la carrera: aquí, 70 % de A y 30 % de B.` },
      { t: 3, texto: 'Mientras tanto el pistón 2 avanza y es el único que envía fase móvil al sistema. La válvula de salida, cerrada, impide que el líquido vuelva a la cámara 1.' },
      { t: 6, texto: `Impulsión: el pistón 1 avanza al doble de velocidad que retrocede el 2 (engranajes ${rel}). La mitad de lo que desplaza llena la cámara 2; la otra mitad sale hacia el inyector y la columna.` },
      { t: 12, texto: 'Las dos contribuciones se relevan sin pausa: el caudal hacia la columna es constante en todo el ciclo. El amortiguador suaviza la pequeña pulsación que deja la compresión del disolvente.' },
      { t: 17, texto: `La compensación de la compresibilidad añade a cada carrera el volumen perdido al comprimir el disolvente hasta la presión de trabajo, de hasta ${pres}.` },
    ],
    dibujar(g, t) {
      const C = g.C, cA = C.m[2], cB = C.m[5];
      const u = fase(t), asp = aspira(t), d1 = pos1(t), d2 = pos2(t);
      /* ---------- MCGV y canales ---------- */
      const mx = 70, my = 196;
      g.rect(mx - 34, my - 64, 68, 92, { fill: C.panel, stroke: C.metalOsc, lw: 1.2, r: 6 });
      g.texto('MCGV', mx, my - 72, { size: 10.5, color: C.texto2, align: 'center', weight: 700 });
      // la apertura de A ocupa el 70 % de la aspiración y la de B el 30 %
      const abreA = asp && u / 0.5 < 1 - FB, abreB = asp && !abreA;
      [['A', cA, abreA], ['B', cB, abreB], ['C', C.tenue, false], ['D', C.tenue, false]].forEach(([s, col, on], i) => {
        const y = my - 50 + i * 21;
        g.linea([[10, y], [mx - 22, y]], { color: col, lw: 3, alpha: s === 'C' || s === 'D' ? 0.35 : 0.9 });
        g.rect(mx - 22, y - 8, 30, 16, { fill: on ? col : C.vacio, stroke: C.metalOsc, lw: 1, r: 3, alpha: on ? 0.9 : 1 });
        g.texto(s, mx - 7, y + 0.5, { size: 10, color: on ? '#fff' : C.texto2, align: 'center', weight: 700 });
      });
      g.texto('de las botellas', 10, my + 44, { size: 9.5, color: C.tenue });
      // salida de la MCGV a la válvula de entrada
      const yIn = YC + HC - 14;
      g.linea([[mx + 34, my - 10], [X1 - 60, my - 10], [X1 - 60, yIn], [X1 - WC / 2 - 12, yIn]], { color: asp ? (abreA ? cA : cB) : C.metalOsc, lw: 3, alpha: asp ? 0.9 : 0.5 });

      /* ---------- cámaras y pistones ---------- */
      const camara = (x, d, liq, tit) => {
        g.rect(x - WC / 2 - 6, YC - 6, WC + 12, HC + 12, { fill: C.metal, alpha: 0.35, r: 6 });
        g.rect(x - WC / 2, YC, WC, HC, { fill: C.vacio, stroke: C.metalOsc, lw: 1.2, r: 3 });
        liq();
        // pistón de zafiro (entra desde abajo); d = retroceso desde el punto muerto superior
        const top = YC + 18 + d;
        g.rect(x - 10, top, 20, YC + HC + 70 - top, { fill: C.frio, alpha: 0.35, stroke: C.frio, lw: 1 });
        g.rect(x - 14, YC + HC + 70, 28, 14, { fill: C.metalOsc, r: 2 });
        g.rect(x - 16, YC + HC - 6, 32, 6, { fill: C.texto2, r: 2, alpha: 0.8 });     // junta
        const izq = x < 300; g.texto(tit, x + (izq ? -1 : 1) * (WC / 2 + 10), YC + 20, { size: 10.5, color: C.texto, align: izq ? 'right' : 'left', weight: 700 });
      };
      // capas de líquido en la cámara 1: entra A y después B durante la aspiración
      camara(X1, d1, () => {
        const vol = YC + 18 + d1 - (YC + 2);              // altura libre sobre el pistón
        const ha = Math.min(vol, S1 * (1 - FB));
        g.rect(X1 - WC / 2 + 2, YC + 2, WC - 4, Math.max(0, vol), { fill: C.liquido, alpha: 0.25 });
        if (d1 > 1) {
          const base = YC + 18 + d1;
          const hA = Math.min(d1, S1 * (1 - FB)), hB = Math.max(0, d1 - S1 * (1 - FB));
          g.rect(X1 - WC / 2 + 2, base - hA, WC - 4, hA, { fill: cA, alpha: 0.45 });
          if (hB > 0) g.rect(X1 - WC / 2 + 2, base - hA - hB, WC - 4, hB, { fill: cB, alpha: 0.45 });
        }
        void ha;
      }, 'Cámara 1');
      camara(X2, d2, () => g.rect(X2 - WC / 2 + 2, YC + 2, WC - 4, 16 + d2, { fill: C.liquido, alpha: 0.4 }), 'Cámara 2');
      g.rotulo('Pistón 1', X1, YC + HC + 96, { size: 10 });
      g.rotulo('Pistón 2', X2, YC + HC + 96, { size: 10 });
      // velocidades
      const fl1 = asp ? '↓' : '↑', fl2 = asp ? '↑' : '↓';
      g.texto(`${fl1} 2v`, X1 + 34, YC + HC + 40, { size: 11, color: C.acento, weight: 700 });
      g.texto(`${fl2} v`, X2 + 34, YC + HC + 40, { size: 11, color: C.acento, weight: 700 });
      // motor y engranajes 2:1
      g.circulo((X1 + X2) / 2, YC + HC + 77, 15, { fill: C.metalOsc, alpha: 0.7 });
      g.texto('M', (X1 + X2) / 2, YC + HC + 77.5, { size: 11, color: '#fff', align: 'center', weight: 700 });
      g.texto(`engranajes ${rel}`, (X1 + X2) / 2, YC + HC + 104, { size: 9.5, color: C.texto2, align: 'center' });
      g.linea([[X1 + 14, YC + HC + 77], [(X1 + X2) / 2 - 15, YC + HC + 77]], { color: C.metalOsc, lw: 2 });
      g.linea([[(X1 + X2) / 2 + 15, YC + HC + 77], [X2 - 14, YC + HC + 77]], { color: C.metalOsc, lw: 2 });

      /* ---------- válvulas de bola ---------- */
      const bola = (x, y, abierta, rot) => {
        g.rect(x - 10, y - 13, 20, 26, { fill: C.panel, stroke: C.metalOsc, lw: 1, r: 3 });
        g.linea([[x - 7, y + 4], [x + 7, y + 4]], { color: C.metalOsc, lw: 2 });
        g.circulo(x, y + (abierta ? -4 : 0), 5, { fill: C.mal });
        g.rotulo(rot, x, y + 24, { size: 9 });
      };
      bola(X1 - WC / 2 - 22, yIn, asp, 'Entrada');
      g.linea([[X1 - WC / 2 - 12, yIn], [X1 - WC / 2, yIn]], { color: C.metalOsc, lw: 3 });
      const yOut = YC - 2;
      bola(X1, yOut - 22, !asp, 'Salida');
      // salida → amortiguador → cámara 2
      const ax = (X1 + X2) / 2, ay = 30;
      g.linea([[X1, yOut - 35], [X1, ay], [ax - 16, ay]], { color: !asp ? C.liquido : C.metalOsc, lw: 3, alpha: 0.85 });
      g.circulo(ax, ay, 16, { fill: C.panel, stroke: C.metalOsc, lw: 1.4 });
      g.texto('amort.', ax, ay + 0.5, { size: 8.5, color: C.texto2, align: 'center' });
      g.linea([[ax + 16, ay], [X2 - 30, ay], [X2 - 30, YC + HC - 14], [X2 - WC / 2, YC + HC - 14]], { color: !asp ? C.liquido : C.metalOsc, lw: 3, alpha: 0.85 });
      // salida de la cámara 2 → válvula de purga → sistema
      g.linea([[X2, YC], [X2, ay], [560, ay]], { color: C.liquido, lw: 3 });
      g.rect(500, ay - 11, 26, 22, { fill: C.panel, stroke: C.metalOsc, lw: 1, r: 3 });
      g.texto('purga', 513, ay + 22, { size: 9, color: C.tenue, align: 'center' });
      g.flecha(560, ay, 628, ay, { color: C.texto2 });
      g.texto('al inyector', 628, ay - 10, { size: 9.5, color: C.texto2, align: 'right' });
      // gotas que recorren la línea de salida a velocidad constante
      for (let i = 0; i < 7; i++) { const k = ((t * 0.5 + i / 7) % 1); g.circulo(lerp(X2 + 8, 600, k), ay, 2.6, { fill: C.liquido }); }
      // gotas por la conexión cámara 1 → 2 solo durante la impulsión
      if (!asp) for (let i = 0; i < 4; i++) { const k = ((t * 0.9 + i / 4) % 1); g.circulo(lerp(X1 + 10, X2 - 40, k), ay, 2.4, { fill: C.liquido, alpha: 0.9 }); }

      /* ---------- gráfica de caudales ---------- */
      const GX = 470, GY = 128, GW = 160, GH = 118;
      g.rect(GX, GY, GW, GH, { fill: C.panel, stroke: C.linea, r: 4 });
      g.texto('Caudal hacia la columna', GX + 6, GY + 10, { size: 9.5, color: C.texto2, weight: 600 });
      const base = GY + GH - 16, alto = 30, X = (s) => GX + 8 + (s / 2) * (GW - 16);         // dos ciclos
      g.linea([[GX + 8, base], [GX + GW - 8, base]], { color: C.tenue, lw: 0.8 });
      const tt = (t < T1 ? 0 : Math.floor((t - T1) / P) % 2) + u;
      const curva = (f, col, dy = 0) => { const pts = []; for (let i = 0; i <= 80; i++) { const s = (i / 80) * 2; pts.push([X(s), base - f(s) * alto - dy]); } g.linea(pts, { color: col, lw: 1.6 }); };
      const de1 = (s) => (s % 1 < 0.5 ? 0 : 1), de2 = (s) => (s % 1 < 0.5 ? 1 : 0);
      curva(de1, C.m[0], 0); curva(de2, C.m[1], 0); curva(() => 1, C.texto, 40);
      g.linea([[X(tt), GY + 16], [X(tt), base]], { color: C.acento, lw: 1, dash: [3, 3] });
      g.texto('total (constante)', GX + 8, base - 40 - alto - 6, { size: 9, color: C.texto });
      g.texto('pistón 1', GX + 8, base + 9, { size: 9, color: C.m[0] });
      g.texto('pistón 2', GX + 60, base + 9, { size: 9, color: C.m[1] });
      g.texto(asp ? 'ASPIRACIÓN del pistón 1' : 'IMPULSIÓN del pistón 1', 550, 346, { size: 11, color: asp ? C.m[2] : C.ion, align: 'center', weight: 700 });
      g.leyenda([[cA, 'canal A (agua)'], [cB, 'canal B (acetonitrilo)']], 12, 346, { size: 9.5 });
    },
  };
}
