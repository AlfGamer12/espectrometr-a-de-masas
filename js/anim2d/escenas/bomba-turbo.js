// Bomba turbomolecular: corte de la bomba y vista desenrollada de las filas de álabes (rotor que se mueve, estátor fijo).
// Las moléculas vuelan sin chocar entre sí (flujo molecular); al entrar en una fila de álabes la atraviesan hacia abajo con más
// probabilidad que hacia arriba, porque el álabe en movimiento les da una componente de velocidad hacia el escape. El resultado es
// una densidad (presión) que crece de etapa en etapa. Escena con estado: reiniciar() siembra las moléculas y actualizar() las mueve.
// Parámetros:
//   p.flujoDividido (bool): turbo de flujo dividido con bocas intermedias.
//   p.entradas: [{ nombre, s? }] — cámaras que bombea cada boca, de la principal (arriba, alto vacío) a las intermedias (máx. 3);
//               s = velocidad de bombeo como texto (p. ej. '260 L/s'), solo si está documentada.
//   p.camara (texto de la cámara de la boca principal si no hay flujo dividido), p.previa (texto de la bomba de vacío previo).
import { tramo, azar, lerp, clamp } from '../dibujo.js';

const FX0 = 250, FX1 = 520, FY0 = 40, FY1 = 300; // ventana de la vista desenrollada
const FILAS = [[74, 98, true], [116, 140, false], [158, 182, true], [200, 224, false], [242, 266, true]].map(([y0, y1, rot]) => ({ y0, y1, rot }));
const HUECOS = [[FY0, 74], [98, 116], [140, 158], [182, 200], [224, 242], [266, FY1]];
const V = 150, U = 100, SA = Math.sin(0.7), CA = Math.cos(0.7); // velocidad molecular, del álabe (px/s) e inclinación ≈ 40°
const PASO_A = 38;            // separación entre álabes
const N = 72;
const PROB = { rotor: [0.62, 0.24], estator: [0.58, 0.26] }; // [atravesar hacia abajo, atravesar hacia arriba]

export default function crear(p = {}) {
  const dividido = !!p.flujoDividido;
  const entradas = (p.entradas && p.entradas.length ? p.entradas : [{ nombre: p.camara || 'Cámara de alto vacío' }]).slice(0, dividido ? 3 : 1);
  const previa = p.previa || 'bomba de vacío previo';
  const W = FX1 - FX0;
  let R, mols = [], prota = null, dens = HUECOS.map(() => 0);
  const medir = (k) => HUECOS.forEach(([a, b], i) => { const n = mols.filter((m) => !m.canal && m.y >= a && m.y < b).length / (b - a); dens[i] += (n - dens[i]) * k; });

  const envolver = (x) => FX0 + ((((x - FX0) % W) + W) % W);
  const hemi = (abajo) => { const a = (R() - 0.5) * Math.PI * 0.9; return [Math.sin(a) * V, (abajo ? 1 : -1) * Math.cos(a) * V]; };
  function nueva(y, abajo = true) { const [vx, vy] = hemi(abajo); return { x: FX0 + R() * W, y, vx, vy, canal: null }; }
  function reinyectar(m) {
    // el gas que retira la bomba previa se repone con el que entra por las bocas (la principal y, si las hay, las intermedias)
    const lat = dividido && entradas.length > 1 && R() < 0.45;
    const h = lat ? (entradas.length > 2 && R() < 0.5 ? HUECOS[4] : HUECOS[2]) : HUECOS[0];
    Object.assign(m, nueva(lerp(h[0] + 2, h[1] - 2, R()), true));
  }
  function paso(m, dt, forzado = false) {
    if (m.canal) {
      m.x = envolver(m.x + m.vx * dt); m.y += m.vy * dt;
      const f = m.canal;
      if (f.dir > 0 && m.y >= f.fila.y1) { m.y = f.fila.y1 + 0.2; m.canal = null; [m.vx, m.vy] = forzado ? [(R() - 0.5) * 80, 120] : hemi(true); if (f.fila.rot) m.vx += U * 0.6; }
      else if (f.dir < 0 && m.y <= f.fila.y0) { m.y = f.fila.y0 - 0.2; m.canal = null; [m.vx, m.vy] = hemi(false); if (f.fila.rot) m.vx += U * 0.6; }
      return;
    }
    const y0 = m.y;
    m.x = envolver(m.x + m.vx * dt); m.y += m.vy * dt;
    for (const fila of FILAS) {
      const [pAb, pAr] = fila.rot ? PROB.rotor : PROB.estator;
      if (y0 < fila.y0 && m.y >= fila.y0) {
        if (forzado || R() < pAb) { m.y = fila.y0 + 0.1; m.canal = { fila, dir: 1 }; [m.vx, m.vy] = fila.rot ? [U - V * SA, V * CA] : [V * SA, V * CA]; if (forzado) m.golpe = fila; }
        else { m.y = fila.y0 - 0.2; [m.vx, m.vy] = hemi(false); if (fila.rot) m.vx += U * 0.6; }
        return;
      }
      if (y0 > fila.y1 && m.y <= fila.y1) {
        if (!forzado && R() < pAr) { m.y = fila.y1 - 0.1; m.canal = { fila, dir: -1 }; [m.vx, m.vy] = fila.rot ? [U + V * SA, -V * CA] : [-V * SA, -V * CA]; }
        else { m.y = fila.y1 + 0.2; [m.vx, m.vy] = hemi(true); if (fila.rot) m.vx += U * 0.6; }
        return;
      }
    }
    if (m.y < FY0 + 2) { m.y = FY0 + 2; m.vy = Math.abs(m.vy); }
    if (m.y > FY1 - 2) {
      if (forzado) { m.fuera = true; return; }
      if (R() < 0.12) reinyectar(m); else { m.y = FY1 - 2; m.vy = -Math.abs(m.vy); }
    }
  }

  const fases = [
    { t: 0, texto: 'La bomba turbomolecular es una turbina de varios pisos: discos con álabes inclinados que giran (rotor), alternados con discos fijos (estátores) de inclinación opuesta. El rotor gira a decenas de miles de rpm y el borde de sus álabes se mueve a cientos de m/s.' },
    { t: 3.5, texto: 'Trabaja en flujo molecular: a estas presiones las moléculas chocan con los álabes y casi nunca entre sí. La que golpea un álabe en movimiento sale con una componente de velocidad hacia abajo, hacia el escape, porque el álabe se mueve casi tan rápido como ella.' },
    { t: 8, texto: 'El estátor, inclinado al revés, recoge las moléculas y las encamina al siguiente rotor. Cada pareja rotor–estátor es una etapa de compresión moderada, pero el producto de todas supera 10⁸ para los gases pesados. Los ligeros (H₂, He) se comprimen peor.' },
    { t: 12, texto: `Por eso la presión crece de etapa en etapa hacia el escape. La turbo no puede descargar a la atmósfera: con una presión de salida alta, el gas deja el régimen molecular y la compresión se pierde. Necesita una ${previa} que retire el gas comprimido.` },
  ];
  if (dividido) fases.push({ t: 15.2, texto: 'En una turbo de flujo dividido hay bocas intermedias. La boca superior, con todas las etapas por debajo, da el vacío más alto; las laterales entran a mitad del rotor y bombean cámaras a mayor presión. Una sola bomba mantiene así varias etapas de vacío.' });

  return {
    titulo: dividido ? 'Bomba turbomolecular de flujo dividido' : 'Bomba turbomolecular',
    dur: dividido ? 19 : 16,
    fases,
    reiniciar() {
      R = azar(7);
      mols = [];
      for (let i = 0; i < N; i++) { const h = HUECOS[Math.min(5, Math.floor((i / N) ** 0.6 * 6))]; mols.push(nueva(lerp(h[0] + 2, h[1] - 2, R()), R() < 0.5)); }
      dens = HUECOS.map(() => 0);
      for (let s = 0; s < 600; s++) { for (const m of mols) paso(m, 1 / 60); medir(s < 60 ? 0.2 : 0.01); } // estado estacionario de partida
      prota = null;
    },
    actualizar(t, dt) {
      for (const m of mols) paso(m, dt);
      medir(dt / 1.5);
      if (t < 3.5 && t + dt >= 3.5) prota = { x: FX0 + W * 0.42, y: FY0 + 4, vx: -20, vy: 115, canal: null, t0: t };
      if (prota && !prota.fuera) paso(prota, dt * 0.55, true); // la protagonista, a cámara lenta
    },
    dibujar(g, t) {
      const C = g.C;
      /* ---------- corte de la bomba ---------- */
      g.rect(110, 22, 120, 34, { fill: C.vacio, stroke: C.linea, r: 6 });
      g.texto(entradas[0].nombre, 170, 34, { size: 10, color: C.texto2, align: 'center', weight: 600 });
      if (entradas[0].s) g.texto(entradas[0].s, 170, 48, { size: 9.5, color: C.tenue, align: 'center' });
      g.rect(104, 56, 132, 8, { fill: C.metalOsc, r: 2 });
      g.rect(110, 64, 120, 230, { fill: C.panel, stroke: C.metalOsc, lw: 1.6, r: 4 });
      g.rect(166, 70, 8, 206, { fill: C.metalOsc, r: 2 });
      for (const f of FILAS) {
        const y = (f.y0 + f.y1) / 2;
        if (f.rot) {
          g.rect(118, y - 4, 104, 8, { fill: C.metal, stroke: C.metalOsc, lw: 0.6, r: 2 });
          for (let k = 0; k < 4; k++) { const x = 120 + ((t * 70 + k * 26) % 100); g.rect(x, y - 3, 3, 6, { fill: C.panel, alpha: 0.7 }); }
        } else {
          g.rect(112, y - 2.5, 48, 5, { fill: C.metalOsc, r: 1 }); g.rect(180, y - 2.5, 48, 5, { fill: C.metalOsc, r: 1 });
        }
      }
      g.rect(148, 274, 44, 18, { fill: C.metalOsc, r: 3 });
      g.texto('Motor', 170, 283.5, { size: 9, color: '#fff', align: 'center', weight: 700 });
      g.texto('rotor', 125, FILAS[0].y0 - 2, { size: 9, color: C.texto2 });
      g.texto('estátor', 125, FILAS[1].y0 - 2, { size: 9, color: C.texto2 });
      // escape
      g.linea([[214, 294], [214, 318], [240, 318]], { color: C.metalOsc, lw: 7, cap: 'butt' });
      g.flecha(244, 318, 266, 318, { color: C.tenue, lw: 1.3 });
      g.rotulo(`Escape → ${previa}`, 170, 340, { size: 10 });
      // bocas intermedias o ficha
      if (dividido && entradas.length > 1) {
        entradas.slice(1).forEach((e, i) => {
          const h = HUECOS[i === 0 ? 2 : 4], y = (h[0] + h[1]) / 2;
          g.rect(98, y - 6, 12, 12, { fill: C.metalOsc });
          g.rect(6, y - 24, 92, 48, { fill: C.vacio, stroke: C.linea, r: 6 });
          g.texto(e.nombre, 52, y - (e.s ? 8 : 0), { size: 10, color: C.texto2, align: 'center', weight: 600 });
          if (e.s) g.texto(e.s, 52, y + 9, { size: 9.5, color: C.tenue, align: 'center' });
          g.flecha(100, y, 116, y, { color: C.tenue, lw: 1.2, punta: 5 });
        });
        g.texto('Bocas', 52, 92, { size: 10, color: C.texto2, align: 'center', weight: 700 });
        g.texto('intermedias', 52, 106, { size: 10, color: C.texto2, align: 'center', weight: 700 });
      } else {
        const L = [['Rotor:', 600], ['decenas de miles', 500], ['de rpm', 500], ['', 0], ['Borde de los', 500], ['álabes: cientos', 500], ['de m/s', 500]];
        L.forEach(([s, w], i) => g.texto(s, 10, 120 + i * 15, { size: 10, color: i === 0 ? C.texto : C.texto2, weight: w || 500 }));
      }

      /* ---------- vista desenrollada ---------- */
      g.rect(FX0, FY0, W, FY1 - FY0, { fill: C.vacio, stroke: C.linea, r: 4 });
      g.texto('Vista desenrollada de los álabes (esquema)', (FX0 + FX1) / 2, 28, { size: 10, color: C.tenue, align: 'center', weight: 600 });
      const ctx = g.ctx;
      ctx.save(); ctx.beginPath(); ctx.rect(FX0, FY0, W, FY1 - FY0); ctx.clip();
      for (const f of FILAS) {
        const h = f.y1 - f.y0, dx = h * SA / CA, off = f.rot ? (t * U) % PASO_A : 0;
        if (f.rot) g.rect(FX0, f.y0, W, h, { fill: C.acento, alpha: 0.06 });
        for (let x = FX0 - PASO_A + off; x < FX1 + PASO_A; x += PASO_A) {
          if (f.rot) g.linea([[x + dx, f.y0], [x, f.y1]], { color: C.metalOsc, lw: 3.5 });
          else g.linea([[x, f.y0], [x + dx, f.y1]], { color: C.metal, lw: 3.5 });
        }
      }
      for (const m of mols) g.circulo(m.x, m.y, 2.6, { fill: C.gas });
      if (prota && !prota.fuera) {
        g.circulo(prota.x, prota.y, 8, { fill: C.ion, alpha: 0.2 });
        g.circulo(prota.x, prota.y, 3.6, { fill: C.ion });
        if (prota.canal && prota.canal.fila.rot) g.circulo(prota.x, prota.y, 11, { stroke: C.ion, lw: 1.4, alpha: 0.8 });
      }
      ctx.restore();
      // flecha del giro del rotor
      g.flecha(FX0 + 8, FILAS[0].y0 - 9, FX0 + 46, FILAS[0].y0 - 9, { color: C.acento, lw: 1.4, punta: 6 });
      g.texto('el rotor se mueve', FX0 + 52, FILAS[0].y0 - 9, { size: 9.5, color: C.acento, weight: 600 });
      if (prota && !prota.fuera && t < 8.2) {
        const lado = prota.x > (FX0 + FX1) / 2 ? -1 : 1;
        g.rotulo('una molécula', prota.x + lado * 46, prota.y - 4, { size: 9.5, color: C.ion, alpha: tramo(t, 3.6, 4) });
      }
      g.texto('↓ hacia el escape', (FX0 + FX1) / 2, FY1 + 12, { size: 10, color: C.tenue, align: 'center', weight: 600 });

      /* ---------- columna derecha: filas y densidad por hueco ---------- */
      g.texto('Densidad ∝ presión', 581, 28, { size: 10, color: C.texto2, align: 'center', weight: 700 });
      FILAS.forEach((f) => g.texto(f.rot ? 'rotor' : 'estátor', 530, (f.y0 + f.y1) / 2, { size: 9.5, color: f.rot ? C.acento : C.tenue, weight: 600 }));
      const cuenta = dens;
      const max = Math.max(...cuenta, 1e-6);
      HUECOS.forEach(([a, b], i) => {
        const y = (a + b) / 2;
        g.rect(530, y - 4, 4 + 92 * clamp(cuenta[i] / max), 8, { fill: C.gas, r: 3, alpha: 0.85 });
      });
      g.texto('baja', 630, HUECOS[0][0] + 10, { size: 9, color: C.tenue, align: 'right' });
      g.texto('alta', 630, FY1 - 6, { size: 9, color: C.tenue, align: 'right' });
    },
  };
}
