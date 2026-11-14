// Fotodiodo de silicio (detector del Shimadzu UV-1900i): corte de la unión p-n, creación de un par electrón-hueco por cada fotón absorbido
// en la zona de agotamiento, separación por el campo interno, corriente hacia un amplificador de transimpedancia y conversión digital.
// Límite del lado largo: un fotón con menos energía que la banda prohibida del silicio (≈ 1,12 eV, λ ≈ 1100 nm) no se absorbe.
// Sin estado: todo es función de t.
import { tramo, lerp, azar } from '../dibujo.js';
import { colorNm, coma } from './uv-util.js';

export default function crear() {
  const X0 = 70, X1 = 320, YP = 92, YD = 116, YN = 176, YB = 252;      // capa p, zona de agotamiento, capa n y fondo
  const T1 = 3, T2 = 11, VF = 190;                                      // primeros fotones, fotón de 1300 nm, velocidad
  const fot = [];
  { const R = azar(17); for (let s = T1; s < 15.5; s += s < 7 ? 0.7 : 0.22) fot.push({ s, x: X0 + 30 + R() * (X1 - X0 - 60), ya: YD + 8 + R() * (YN - YD - 16) }); }
  const ev = (l) => 1239.84 / l;                                         // energía del fotón en eV (λ en nm)

  return {
    titulo: 'Fotodiodo de silicio',
    dur: 18,
    fases: [
      { t: 0, texto: 'Un fotodiodo de silicio es una unión p-n. Entre la capa p y la capa n queda una zona de agotamiento, sin portadores libres y con un campo eléctrico interno.' },
      { t: T1, texto: 'Un fotón con energía mayor que la banda prohibida del silicio se absorbe y crea un par electrón-hueco. El campo los separa: el electrón va a la capa n y el hueco a la capa p.' },
      { t: 7, texto: 'Cada fotón absorbido aporta una carga al circuito: la corriente es proporcional a la intensidad de la luz. Un amplificador de transimpedancia la convierte en tensión y un convertidor la digitaliza.' },
      { t: T2, texto: 'Un fotón de 1300 nm lleva 0,95 eV, menos que los ≈ 1,12 eV de la banda prohibida: atraviesa el silicio sin crear pares. Por eso el rango del detector, y el del equipo, termina hacia los 1100 nm.' },
      { t: 14.5, texto: 'El UV-1900i tiene un fotodiodo para cada haz. El cociente entre la señal de la muestra y la de la referencia da la transmitancia, T = I/I₀.' },
    ],
    dibujar(g, t) {
      const C = g.C;
      /* --- corte del fotodiodo --- */
      g.rect(X0, YP, X1 - X0, YD - YP, { fill: '#f08c00', alpha: 0.22 });
      g.rect(X0, YD, X1 - X0, YN - YD, { fill: C.campo, alpha: 0.6 });
      g.rect(X0, YN, X1 - X0, YB - YN, { fill: '#1c7ed6', alpha: 0.16 });
      g.rect(X0, YP, X1 - X0, YB - YP, { stroke: C.texto2, lw: 1.4 });
      g.rect(X0, YP - 6, 30, 6, { fill: C.metal }); g.rect(X1 - 30, YP - 6, 30, 6, { fill: C.metal });
      g.rect(X0, YB, X1 - X0, 7, { fill: C.metal });
      g.texto('p', X1 + 10, (YP + YD) / 2, { size: 13, color: '#e8590c', weight: 700 });
      g.texto('zona de agotamiento', X1 + 10, (YD + YN) / 2, { size: 10, color: C.acento, weight: 600 });
      g.texto('n', X1 + 10, (YN + YB) / 2, { size: 13, color: '#1971c2', weight: 700 });
      for (let x = X0 + 26; x < X1; x += 48) g.flecha(x, YN - 6, x, YD + 6, { color: C.campo, lw: 1, punta: 5 });
      g.texto('campo interno', X0 + 4, YD + 10, { size: 9, color: C.tenue });
      g.texto('Luz', (X0 + X1) / 2, 18, { size: 11, color: C.texto2, align: 'center', weight: 600 });

      /* --- fotones visibles: absorción y par electrón-hueco --- */
      const col = colorNm(500);
      let pares = 0;
      for (const f of fot) {
        if (t < f.s) continue;
        const d = t - f.s, yf = 28 + d * VF;
        if (yf < f.ya) { g.foton(f.x, yf - 14, f.x, yf, { amp: 2.4, long: 5, color: col, lw: 1.5 }); continue; }
        const ta = d - (f.ya - 28) / VF;                                  // tiempo desde la absorción
        if (ta < 0.25) g.circulo(f.x, f.ya, 3 + ta * 40, { stroke: col, lw: 1.4, alpha: 1 - ta / 0.25 });
        const ye = Math.min(YB - 4, f.ya + ta * 70), yh = Math.max(YP + 6, f.ya - ta * 60);
        if (ye < YB - 4) g.electron(f.x + 4, ye, { r: 3.2 }); else pares++;
        if (yh > YP + 6) g.ion(f.x - 4, yh, { r: 4.6, q: 1, color: '#e8590c' });
      }
      // fotón de 1300 nm que atraviesa el silicio sin absorberse
      if (t > T2) {
        const y = 28 + (t - T2) * 120, x = X0 + 150;
        if (y < 340) g.foton(x, y - 18, x, y, { amp: 3.2, long: 9, color: colorNm(1300), lw: 1.8 });
        g.rotulo('1300 nm: 0,95 eV < 1,12 eV', x + 4, Math.min(300, Math.max(60, y)) + 2, { size: 10, color: C.mal, alpha: tramo(t, T2, T2 + 0.5) });
      }

      /* --- circuito: amplificador de transimpedancia y conversión digital --- */
      const ax = 470, ay = 150;
      g.linea([[X1 - 15, YP - 6], [X1 - 15, 60], [ax - 34, 60], [ax - 34, ay - 10], [ax - 22, ay - 10]], { color: C.texto2, lw: 1.6 });
      const tierra = (x, y) => { g.linea([[x, y - 12], [x, y]], { color: C.texto2, lw: 1.6 }); for (let i = 0; i < 3; i++) g.linea([[x - 9 + i * 3, y + i * 4], [x + 9 - i * 3, y + i * 4]], { color: C.texto2, lw: 1.4 }); };
      tierra(X0 + (X1 - X0) / 2, YB + 19);
      g.linea([[ax - 22, ay + 10], [ax - 27, ay + 10], [ax - 27, ay + 30]], { color: C.texto2, lw: 1.6 }); tierra(ax - 27, ay + 42);
      g.linea([[ax - 22, ay - 26], [ax - 22, ay + 26], [ax + 20, ay]], { color: C.texto, lw: 1.6, cerrar: true, fill: C.panel });
      g.texto('−', ax - 16, ay - 10, { size: 11, color: C.texto, weight: 700 }); g.texto('+', ax - 16, ay + 11, { size: 10, color: C.texto, weight: 700 });
      g.linea([[ax - 34, 60], [ax - 34, 40], [ax + 34, 40], [ax + 34, ay]], { color: C.texto2, lw: 1.4 });
      g.rect(ax - 8, 34, 22, 12, { fill: C.panel, stroke: C.texto2, lw: 1.2, r: 2 });
      g.texto('R', ax + 3, 40.5, { size: 9, color: C.texto2, align: 'center', weight: 700 });
      g.linea([[ax + 20, ay], [ax + 56, ay]], { color: C.texto2, lw: 1.6 });
      g.rect(ax + 56, ay - 18, 50, 36, { fill: C.panel, stroke: C.texto2, lw: 1.2, r: 4 });
      g.texto('A/D', ax + 81, ay + 0.5, { size: 11, color: C.texto, align: 'center', weight: 700 });
      g.texto('V = −I·R', ax + 30, ay + 42, { size: 10.5, color: C.texto2, align: 'center', italic: true });
      // corriente: cargas que recorren el circuito, más deprisa cuantos más fotones llegan
      const flujo = t < T1 + 0.6 ? 0 : t < 7 ? 0.4 : 1;
      if (flujo > 0) {
        const camino = [[X1 - 15, YP - 6], [X1 - 15, 60], [ax - 34, 60], [ax - 34, ay - 10]];
        const L = camino.slice(1).reduce((a, p, i) => a + Math.hypot(p[0] - camino[i][0], p[1] - camino[i][1]), 0);
        for (let i = 0; i < 8; i++) {
          let u = ((t * 60 * flujo + i * L / 8) % L);
          for (let j = 1; j < camino.length; j++) {
            const a = camino[j - 1], b = camino[j], l = Math.hypot(b[0] - a[0], b[1] - a[1]);
            if (u <= l) { g.circulo(lerp(a[0], b[0], u / l), lerp(a[1], b[1], u / l), 2.4, { fill: C.e, alpha: 0.8 }); break; }
            u -= l;
          }
        }
        const I = flujo * (0.8 + 0.05 * Math.sin(t * 9));
        g.medidor(ax + 40, 238, 120, I, { etiqueta: `Señal digital: ${coma(I, 2)}` });
      }

      /* --- energía del fotón frente a la banda prohibida --- */
      if (t > T2 - 0.5) {
        const a = tramo(t, T2 - 0.5, T2);
        g.rect(420, 258, 210, 96, { fill: C.panel, stroke: C.linea, r: 6, alpha: a });
        g.texto('E = hc/λ ≈ 1240 eV·nm / λ', 430, 274, { size: 10.5, color: C.texto2, weight: 600, alpha: a });
        [[250, true], [500, true], [1100, null], [1300, false]].forEach(([l, ok], i) => {
          const y = 294 + i * 15;
          g.texto(`${l} nm → ${coma(ev(l), 2)} eV`, 432, y, { size: 10, color: C.texto, alpha: a });
          g.texto(ok === true ? 'se absorbe' : ok === false ? 'no se absorbe' : 'límite', 618, y, { size: 10, color: ok === false ? C.mal : ok ? C.ok : C.acento, align: 'right', weight: 600, alpha: a });
        });
      }
      if (t > 14.5) {
        const a = tramo(t, 14.5, 15.1);
        g.rotulo('T = I (muestra) / I₀ (referencia)', 540, 207, { size: 10.5, color: C.texto, alpha: a });
      }
      g.leyenda([[col, 'fotón', 'foton'], [C.e, 'electrón', 'e'], ['#e8590c', 'hueco']], 70, 340, { size: 9.5 });
      void pares;
    },
  };
}
