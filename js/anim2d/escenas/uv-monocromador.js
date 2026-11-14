// Monocromador Czerny-Turner visto desde arriba (como el del Shimadzu UV-1900i): rendija de entrada, espejo colimador, red de difracción,
// espejo de enfoque y rendija de salida. La red dispersa la luz; el espejo de enfoque forma el espectro sobre el plano de la rendija de
// salida y solo pasa una banda estrecha. Al girar la red, cambia la longitud de onda que sale. Al final: ancho de banda y orden 2.
// Sin estado: todo es función de t. Parámetros: p.banda (ancho de banda espectral en nm, 1).
import { tramo, suave, lerp } from '../dibujo.js';
import { colorNm } from './uv-util.js';

export default function crear(p = {}) {
  const BW = p.banda || 1;
  const S1 = [108, 300], M1 = [108, 74], G = [258, 286], M2 = [408, 74], S2 = [408, 300];
  const K = 0.62;                                              // px por nm en el plano de la rendija de salida (esquemático)
  const lsel = (t) => (t < 13 ? 550 : t < 16.5 ? lerp(550, 430, suave(tramo(t, 13, 16.5))) : 430);
  const lamb = [];
  for (let l = 390; l <= 710; l += 40) lamb.push(l);

  return {
    titulo: 'Monocromador Czerny-Turner',
    dur: 23,
    fases: [
      { t: 0, texto: 'La luz de la lámpara entra por una rendija estrecha. A partir de ahí diverge hacia el primer espejo.' },
      { t: 3, texto: 'El espejo colimador, cóncavo, está a su distancia focal de la rendija: convierte la luz divergente en un haz paralelo que ilumina toda la red de difracción.' },
      { t: 6.5, texto: 'Las redes de los espectrofotómetros tienen de 500 a 2000 surcos por milímetro. Cada longitud de onda sale con un ángulo distinto, según la ecuación de la red: mλ = d (sen i + sen θ).' },
      { t: 10, texto: 'El espejo de enfoque forma sobre el plano de la rendija de salida un «arco iris» de imágenes de la rendija de entrada. Solo la banda que cae en la abertura sale del monocromador.' },
      { t: 13, texto: 'Un motor gira la red: el arco iris se desplaza sobre la rendija de salida y cambia la longitud de onda que sale. Así se barre el espectro.' },
      { t: 17, texto: `La anchura de la rendija fija el ancho de banda espectral: ${BW} nm a media altura en el UV-1900i. La red también envía en la misma dirección luz de orden 2 de longitud de onda mitad; un filtro tras la rendija la elimina.` },
    ],
    dibujar(g, t) {
      const C = g.C, ls = lsel(t);
      const giro = (ls - 550) * 0.0016;                          // giro de la red (esquemático)
      g.camara(40, 40, 420, 286, {});
      g.texto('Monocromador (vista desde arriba)', 258, 52, { size: 10, color: C.tenue, weight: 600, align: 'center' });
      // rendija de entrada y salida en la pared inferior
      g.rect(S1[0] - 34, S1[1] + 2, 30, 8, { fill: C.metalOsc }); g.rect(S1[0] + 4, S1[1] + 2, 30, 8, { fill: C.metalOsc });
      const ab = Math.max(3, BW * K * 2.4);
      g.rect(S2[0] - 40, S2[1] + 2, 40 - ab / 2, 8, { fill: C.metalOsc }); g.rect(S2[0] + ab / 2, S2[1] + 2, 40 - ab / 2, 8, { fill: C.metalOsc });
      g.rotulo('Rendija de entrada', S1[0], S1[1] + 26, { size: 10 });
      g.rotulo('Rendija de salida', S2[0] - 56, S2[1] + 26, { size: 10 });
      g.flecha(S1[0], 352, S1[0], S1[1] + 12, { color: C.tenue, lw: 1.2 });
      // espejos cóncavos
      const espejo = (c, et) => {
        const pts = []; for (let a = -0.42; a <= 0.42; a += 0.06) pts.push([c[0] + Math.sin(a) * 150, c[1] - 6 + (1 - Math.cos(a)) * 150 * 0.12]);
        g.linea(pts, { color: C.metalOsc, lw: 6 }); g.linea(pts, { color: '#dfe6ee', lw: 2.4 });
        g.rotulo(et, c[0], c[1] - 22, { size: 10 });
      };
      espejo(M1, 'Espejo colimador'); espejo(M2, 'Espejo de enfoque');
      // red de difracción (rectángulo girado con surcos)
      const gr = (x, y) => { const c = Math.cos(giro), s = Math.sin(giro); return [G[0] + x * c - y * s, G[1] + x * s + y * c]; };
      g.linea([gr(-44, 0), gr(44, 0), gr(44, 10), gr(-44, 10)], { fill: C.metalOsc, cerrar: true });
      for (let x = -42; x <= 42; x += 4) g.linea([gr(x, -1), gr(x + 2, 2)], { color: '#c8d3df', lw: 1 });
      g.rotulo('Red de difracción', G[0] + 2, G[1] + 30, { size: 10 });
      if (t > 13 && t < 17.5) g.texto('↻ gira', G[0] + 60, G[1] + 2, { size: 10.5, color: C.acento, weight: 700 });

      const k1 = tramo(t, 0.3, 3), k2 = tramo(t, 3, 6.3), k3 = tramo(t, 6.5, 9.5), k4 = tramo(t, 10, 12.5);
      const blanco = 'rgba(255, 236, 200, 0.85)';
      // 1) divergente: rendija → espejo colimador
      if (k1 > 0) for (const dx of [-36, -12, 12, 36]) { const e = [M1[0] + dx, M1[1] + 2]; g.linea([S1, [lerp(S1[0], e[0], k1), lerp(S1[1], e[1], k1)]], { color: blanco, lw: 1.6 }); }
      // 2) paralelo: espejo colimador → red
      if (k2 > 0) for (const dx of [-36, -12, 12, 36]) { const a = [M1[0] + dx, M1[1] + 2], b = [G[0] + dx * 0.95, G[1] - 2]; g.linea([a, [lerp(a[0], b[0], k2), lerp(a[1], b[1], k2)]], { color: blanco, lw: 1.6 }); }
      // 3) dispersado: red → espejo de enfoque (cada color con su ángulo)
      const enM2 = (l) => M2[0] + (l - ls) * 0.16, enS2 = (l) => S2[0] + (l - ls) * K;
      const llega = (l) => Math.abs(enM2(l) - M2[0]) < 44 && enS2(l) > 54 && enS2(l) < 452;   // los colores que no caen en el espejo se pierden
      if (k3 > 0) for (const l of lamb) {
        if (!llega(l)) continue;
        const col = colorNm(l, 0.75);
        for (const dx of [-30, 30]) { const a = [G[0] + dx, G[1] - 3], b = [enM2(l) + dx * 0.9, M2[1] + 3]; g.linea([a, [lerp(a[0], b[0], k3), lerp(a[1], b[1], k3)]], { color: col, lw: 1.2 }); }
      }
      // 4) enfocado: espejo de enfoque → plano de la rendija de salida
      if (k4 > 0) {
        for (const l of lamb) {
          if (!llega(l)) continue;
          const col = colorNm(l, 0.7), dst = [enS2(l), S2[1]];
          for (const dx of [-28, 28]) { const a = [enM2(l) + dx * 0.9, M2[1] + 3]; g.linea([a, [lerp(a[0], dst[0], k4), lerp(a[1], dst[1], k4)]], { color: col, lw: 1.1 }); }
        }
        // espectro proyectado sobre la pared y banda que atraviesa la abertura
        for (let l = 380; l <= 720; l += 2) { const x = enS2(l); if (x > 52 && x < 450 && Math.abs(enM2(l) - M2[0]) < 44) g.rect(x, S2[1] - 4, K * 2 + 0.6, 4, { fill: colorNm(l), alpha: k4 }); }
        if (k4 >= 1) {
          for (let i = 0; i < 5; i++) { const y = S2[1] + 12 + ((t * 60 + i * 9) % 45); g.circulo(S2[0], y, 2.6, { fill: colorNm(ls) }); }
          g.linea([[S2[0], S2[1] + 10], [S2[0], 352]], { color: colorNm(ls, 0.85), lw: 3 });
          g.rotulo(`${Math.round(ls)} nm`, S2[0] + 38, 340, { size: 10.5, color: C.texto });
        }
      }

      /* --- panel derecho: ecuación, ancho de banda y orden 2 --- */
      const px = 474, pw = 156;
      if (t > 6.5) {
        g.rect(px, 44, pw, 70, { fill: C.panel, stroke: C.linea, r: 6, alpha: tramo(t, 6.5, 7.2) });
        g.texto('Ecuación de la red', px + 8, 58, { size: 10, color: C.texto2, weight: 600 });
        g.texto('mλ = d (sen i + sen θ)', px + pw / 2, 80, { size: 12.5, color: C.texto, align: 'center', weight: 600, italic: true });
        g.texto('d: paso de los surcos · m: orden', px + pw / 2, 101, { size: 9, color: C.tenue, align: 'center' });
      }
      if (t > 17) {
        const a = tramo(t, 17, 17.6);
        g.rect(px, 124, pw, 112, { fill: C.panel, stroke: C.linea, r: 6, alpha: a });
        g.texto('Banda que sale', px + 8, 138, { size: 10, color: C.texto2, weight: 600, alpha: a });
        // función de rendija triangular: anchura a media altura = BW
        const cx = px + pw / 2, base = 220, h = 62, sx = 26;
        g.linea([[px + 12, base], [px + pw - 12, base]], { color: C.tenue, lw: 0.8, alpha: a });
        g.linea([[cx - 2 * sx, base], [cx, base - h], [cx + 2 * sx, base]], { color: colorNm(ls), lw: 2, fill: colorNm(ls, 0.25), alpha: a });
        g.linea([[cx - sx, base - h / 2], [cx + sx, base - h / 2]], { color: C.texto2, lw: 1, dash: [3, 2], alpha: a });
        g.texto(`${BW} nm`, cx, base - h / 2 - 8, { size: 10, color: C.texto, align: 'center', weight: 700, alpha: a });
        g.texto(`${Math.round(ls) - BW}`, cx - 2 * sx, base + 10, { size: 9, color: C.tenue, align: 'center', alpha: a });
        g.texto(`${Math.round(ls) + BW}`, cx + 2 * sx, base + 10, { size: 9, color: C.tenue, align: 'center', alpha: a });
        // orden 2: λ/2 sale en la misma dirección y el filtro la absorbe
        const b = tramo(t, 19, 19.8);
        if (b > 0) {
          g.rect(px, 246, pw, 74, { fill: C.panel, stroke: C.linea, r: 6, alpha: b });
          g.texto(`Orden 2: ${Math.round(ls / 2)} nm`, px + 8, 260, { size: 10, color: C.texto2, weight: 600, alpha: b });
          g.texto('2 × λ/2 = 1 × λ: mismo ángulo', px + 8, 276, { size: 9.5, color: C.tenue, alpha: b });
          g.rect(px + 18, 290, 120, 14, { fill: C.metal, r: 3, alpha: b });
          g.texto('filtro de corte', px + 78, 297.5, { size: 9.5, color: '#fff', align: 'center', weight: 700, alpha: b });
          // rayo de orden 2 (UV, discontinuo) que atraviesa la rendija y muere en el filtro
          g.linea([[S2[0] + 3, S2[1] + 10], [S2[0] + 3, 330]], { color: colorNm(ls / 2, 0.9), lw: 2, dash: [4, 3], alpha: b });
          g.rect(S2[0] - 20, 330, 40, 8, { fill: C.metal, r: 2, alpha: b });
          g.texto('×', S2[0] + 3, 326, { size: 12, color: C.mal, align: 'center', weight: 800, alpha: b });
        }
      }
    },
  };
}
