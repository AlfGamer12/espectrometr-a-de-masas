// Simulación didáctica de un MALDI-TOF: pulso láser → desorción/ionización → extracción → vuelo libre → detector lineal o reflectrón.
// Los tiempos de vuelo se calculan con t = L·√(m / 2zeU) y se muestran ralentizados (~10⁶ veces).
import * as THREE from 'three';
import { AX, FIS } from './geometria.js';
import { PointPool, chartColors, setupCanvas, axes, COL } from '../../simcore.js';

// m/z de [M+H]⁺ (monoisotópicas para péptidos, medias para proteínas). Abundancias ilustrativas.
export const MUESTRAS = {
  peptidos: {
    nombre: 'Patrón de calibración de péptidos', rango: [700, 3300], iso: true,
    picos: [[757.40, 55, 'Bradiquinina 1-7'], [1046.54, 100, 'Angiotensina II'], [1296.68, 85, 'Angiotensina I'], [1347.74, 60, 'Sustancia P'],
      [1619.82, 70, 'Bombesina'], [1758.93, 45, 'Sustrato de renina'], [2093.09, 65, 'ACTH 1-17'], [2465.20, 55, 'ACTH 18-39'], [3147.47, 35, 'Somatostatina 28']],
  },
  proteinas: {
    nombre: 'Patrón de calibración de proteínas', rango: [2500, 18000], iso: false,
    picos: [[5734.5, 70, 'Insulina'], [8565.8, 100, 'Ubiquitina'], [12361.0, 60, 'Citocromo c'], [16952.3, 45, 'Mioglobina'],
      [6181.0, 20, 'Citocromo c [M+2H]²⁺'], [8476.7, 15, 'Mioglobina [M+2H]²⁺'], [4283.4, 12, 'Ubiquitina [M+2H]²⁺']],
  },
  bts: {
    nombre: 'Patrón bacteriano (extracto de E. coli)', rango: [3000, 18000], iso: false,
    picos: [[3637.8, 30, 'RL29 [M+2H]²⁺'], [4365.3, 60, 'RL36'], [5096.8, 45, 'RS32'], [5381.4, 75, 'RS34'], [6255.4, 55, 'RS33meth'],
      [7274.5, 65, 'RL29'], [9536, 35, ''], [10300.1, 45, 'RS19'], [13683.2, 30, 'RNasa A'], [16952.3, 25, 'Mioglobina']],
  },
};

const DAL = 1.66054e-27, QE = 1.602177e-19;
/** Tiempo de vuelo real (s) en el tramo libre de longitud L (m) tras aceleración a U (V). */
export const tof = (m, L, U) => L * Math.sqrt((m * DAL) / (2 * QE * U));

export class Simulacion {
  constructor(eq, els) {
    this.refs = eq.analyzer;
    this.els = { c1: els.canvases[0], c2: els.canvases[1], ...els.read };
    const A = this.refs.group;
    this.ionPool = new PointPool(A, 3000, 0.35);
    this.fPool = new PointPool(A, 300, 1.1);
    this.ions = []; this.flashes = [];
    this.muestra = 'peptidos'; this.modo = 'reflector'; this.de = true; this.velocidad = 1;
    this.reset();
    this.setVisible(false);
  }
  setVisible(v) { this.ionPool.visible = v; this.fPool.visible = v; }
  setTheme(light) { this.ionPool.setTheme(light); this.fPool.setTheme(light); }
  start() { this.active = true; this.setVisible(true); this.reset(); }
  stop() { this.active = false; this.setVisible(false); this.ions.length = 0; this.flashes.length = 0; if (this.refs.laser) this.refs.laser.material.opacity = 0; }
  setControl(id, v) {
    if (id === 'muestra') this.muestra = v;
    else if (id === 'modo') this.modo = v;
    else if (id === 'de') this.de = v === 'on';
    else if (id === 'velocidad') this.velocidad = +v;
    this.reset();
  }
  options() { return null; }
  value() { return null; }

  reset() {
    const [lo, hi] = MUESTRAS[this.muestra].rango;
    this.lo = lo; this.hi = hi;
    this.nbin = 1400;
    this.suma = new Float32Array(this.nbin);
    this.disparos = 0; this.tShot = 1.55; this.lastShot = null; this.lastTof = 0;
  }
  /** Poder de resolución (m/Δm) típico según modo y extracción retardada. */
  resolucion() { return this.modo === 'reflector' ? (this.de ? 9000 : 1500) : (this.de ? 900 : 250); }
  /** Longitud de vuelo efectiva (m) y tensión de aceleración (V). */
  geometria() { return { L: this.modo === 'reflector' ? FIS.L_REF : FIS.L_LIN, U: FIS.U }; }

  /** Un disparo del láser: genera iones visibles y suma su contribución al espectro. */
  disparo() {
    this.disparos++;
    const M = MUESTRAS[this.muestra];
    const R = this.resolucion();
    const { L, U } = this.geometria();
    const shot = [];
    for (const [m, a] of M.picos) {
      const n = a * (0.6 + Math.random() * 0.8);
      // patrón isotópico aproximado (Poisson, λ ≈ m/1800) visible cuando la resolución lo permite
      const lam = m / 1800;
      const iso = M.iso && R > m / 0.8 ? [0, 1, 2, 3, 4].map((k) => [m + k * 1.00336, Math.exp(-lam) * lam ** k / [1, 1, 2, 6, 24][k]]) : [[m, 1]];
      const isoMax = Math.max(...iso.map((x) => x[1]));
      for (const [mi, pi] of iso) {
        const amp = n * pi / isoMax;
        const sigma = mi / R / 2.355;
        this.addPeak(mi, amp, sigma);
        shot.push([mi, amp, tof(mi, L, U)]);
      }
      // iones visibles en 3D (uno por pico mayoritario)
      if (this.ions.length < 2500) for (let k = 0; k < 4; k++) this.ions.push(this.nuevoIon(m, a));
    }
    // fondo químico de la matriz a m/z bajas (suprimido por el deflector por encima de ~m/z 500)
    for (let i = 0; i < 6; i++) this.addPeak(this.lo + Math.random() * (this.hi - this.lo), 1.5 * Math.random(), (this.hi - this.lo) / 400);
    this.lastShot = shot;
    this.lastTof = tof(M.picos[0][0], L, U);
    this.flash(AX.TARGET, 1.2);
  }
  addPeak(m, amp, sigma) {
    const { lo, hi, nbin } = this;
    const db = (hi - lo) / nbin;
    const i0 = Math.max(0, Math.floor((m - 4 * sigma - lo) / db)), i1 = Math.min(nbin - 1, Math.ceil((m + 4 * sigma - lo) / db));
    for (let i = i0; i <= i1; i++) {
      const x = lo + i * db, d = (x - m) / Math.max(sigma, db * 0.6);
      this.suma[i] += amp * Math.exp(-0.5 * d * d);
    }
  }
  nuevoIon(m, a) {
    const p0 = AX.TARGET.clone().add(new THREE.Vector3(0.05, (Math.random() - 0.5) * 0.25, (Math.random() - 0.5) * 0.25));
    // dispersión inicial de energía: con extracción retardada se compensa (ions llegan juntos)
    const dE = (Math.random() - 0.5) * (this.de ? 0.01 : 0.06);
    return { m, t: 0, pos: p0.clone(), p0, dE, y0: p0.y, z0: p0.z, ph: 0 };
  }

  update(dt) {
    if (!this.active) return;
    dt = Math.min(dt, 0.05);
    const ts = dt * this.velocidad;
    this.tShot += ts;
    if (this.tShot > 1.6) { this.tShot = 0; this.disparo(); }
    if (this.refs.laser) this.refs.laser.material.opacity = this.tShot < 0.08 ? 0.85 : 0;

    const refl = this.modo === 'reflector';
    const L = AX.DET_L.x - AX.EXTR.x;            // longitud visual del tubo
    for (const ion of this.ions) {
      ion.t += ts;
      // tiempo visual: proporcional a √m (escala: m/z 1000 → 1,4 s en el tramo libre)
      const k = Math.sqrt(ion.m / 1000) * (1 - ion.dE);
      const tAcc = 0.12 * k, tFree = 1.4 * k;
      if (ion.ph === 0) { // aceleración entre la diana y los electrodos de extracción
        const u = Math.min(1, ion.t / tAcc);
        ion.pos.x = AX.TARGET.x + (AX.EXTR.x - AX.TARGET.x) * u * u;
        if (u >= 1) { ion.ph = 1; ion.t = 0; }
      } else if (ion.ph === 1) { // vuelo libre
        const u = ion.t / tFree;
        if (!refl) {
          ion.pos.set(AX.EXTR.x + L * u, ion.y0 * (1 - u) * 0.5, ion.z0 * (1 - u) * 0.5);
          if (u >= 1) { ion.ph = 9; this.flash(AX.DET_L, 0.8); }
        } else {
          const xr = AX.REF0.x;
          const u1 = (xr - AX.EXTR.x) / L;
          if (u < u1) ion.pos.set(AX.EXTR.x + L * u, AX.REF_ANG * (L * u), 0);
          else { ion.ph = 2; ion.t = 0; ion.ent = ion.pos.clone(); }
        }
      } else if (ion.ph === 2) { // reflectrón: frena, invierte el sentido y sale hacia el detector de reflexión
        const depth = (AX.REF1.x - AX.REF0.x) * (0.55 + ion.dE * 4);
        const tr = 0.35 * k;
        const u = Math.min(1, ion.t / tr);
        ion.pos.set(ion.ent.x + depth * Math.sin(u * Math.PI), ion.ent.y + (AX.DET_R.y - ion.ent.y) * 0.08 * u, 0);
        if (u >= 1) { ion.ph = 3; ion.t = 0; ion.sal = ion.pos.clone(); }
      } else if (ion.ph === 3) { // vuelta hasta el detector de reflexión
        const tback = 1.1 * k;
        const u = Math.min(1, ion.t / tback);
        ion.pos.lerpVectors(ion.sal, AX.DET_R, u);
        if (u >= 1) { ion.ph = 9; this.flash(AX.DET_R, 0.8); }
      }
    }
    this.ions = this.ions.filter((i) => i.ph !== 9);
    for (const f of this.flashes) f.t += dt;
    this.flashes = this.flashes.filter((f) => f.t < 0.3);

    this.ionPool.begin();
    for (const i of this.ions) this.ionPool.push(i.pos, i.ph === 0 ? COL.nuevo : i.ph >= 2 ? COL.frag : COL.ok, 1);
    this.ionPool.end();
    this.fPool.begin();
    for (const f of this.flashes) this.fPool.push(f.p, COL.flash, f.k * (1 - f.t / 0.3));
    this.fPool.end();
    this.drawUI();
  }
  flash(p, k) { if (this.flashes.length < 280) this.flashes.push({ p: p.clone(), t: 0, k }); }

  /* -------------------- PANELES 2D -------------------- */
  drawUI() {
    this.frame = (this.frame || 0) + 1;
    if (this.frame % 3) return;
    this.drawSpectrum();
    this.drawTransitorio();
    const e = this.els;
    const { L, U } = this.geometria();
    e.modo.textContent = this.modo === 'reflector' ? 'Reflectrón' : 'Lineal';
    e.res.textContent = '≈ ' + this.resolucion().toLocaleString('es-ES');
    e.tof.textContent = this.lastShot ? (this.lastTof * 1e6).toFixed(1) + ' µs' : '–';
    e.n.textContent = this.disparos.toLocaleString('es-ES');
  }

  drawSpectrum() {
    const [g, w, h] = setupCanvas(this.els.c1);
    const C = chartColors();
    const L = 38, R = 10, T = 16, B = 26, pw = w - L - R, ph = h - T - B;
    axes(g, C, L, T, pw, ph);
    const X = (m) => L + ((m - this.lo) / (this.hi - this.lo)) * pw;
    g.textAlign = 'center'; g.fillStyle = C.text;
    const span = this.hi - this.lo, tick = span > 8000 ? 2000 : span > 2000 ? 500 : 250;
    for (let m = Math.ceil(this.lo / tick) * tick; m <= this.hi; m += tick) g.fillText(m.toLocaleString('es-ES'), X(m), T + ph + 14);
    g.fillText('m/z', L + pw - 8, T + ph + 24);
    let mx = 1; for (const v of this.suma) if (v > mx) mx = v;
    g.beginPath(); g.moveTo(L, T + ph);
    for (let i = 0; i < this.nbin; i++) g.lineTo(L + (i / (this.nbin - 1)) * pw, T + ph - (this.suma[i] / mx) * ph);
    g.lineTo(L + pw, T + ph); g.closePath();
    const grd = g.createLinearGradient(0, T, 0, T + ph); grd.addColorStop(0, C.fill0); grd.addColorStop(1, C.fill1);
    g.fillStyle = grd; g.fill(); g.strokeStyle = C.line; g.lineWidth = 1.2; g.stroke(); g.lineWidth = 1;
    // rótulos de picos
    if (this.disparos > 0) {
      g.font = '600 10px Segoe UI, sans-serif'; g.fillStyle = C.peak; g.textAlign = 'center';
      const db = (this.hi - this.lo) / this.nbin;
      for (const [m, , nom] of MUESTRAS[this.muestra].picos) {
        const i = Math.round((m - this.lo) / db); if (i < 0 || i >= this.nbin) continue;
        let v = 0; for (let j = Math.max(0, i - 3); j < Math.min(this.nbin, i + 4); j++) v = Math.max(v, this.suma[j]);
        if (v / mx < 0.12) continue;
        g.fillText(m >= 3000 ? Math.round(m).toString() : m.toFixed(1), X(m), T + ph - (v / mx) * ph - 4);
      }
    }
    g.fillStyle = C.text; g.textAlign = 'left'; g.font = '11px Segoe UI, sans-serif';
    g.fillText(`${MUESTRAS[this.muestra].nombre} · suma de ${this.disparos} disparos · ${this.modo === 'reflector' ? 'reflectrón' : 'lineal'}`, L + 6, T - 4);
  }

  /** Señal del detector frente al tiempo de vuelo para el último disparo. */
  drawTransitorio() {
    const [g, w, h] = setupCanvas(this.els.c2);
    const C = chartColors();
    const L = 30, R = 8, T = 16, B = 24, pw = w - L - R, ph = h - T - B;
    axes(g, C, L, T, pw, ph, false);
    const { L: Lf, U } = this.geometria();
    const t0 = tof(this.lo * 0.9, Lf, U) * 1e6, t1 = tof(this.hi * 1.05, Lf, U) * 1e6;
    const X = (t) => L + ((t - t0) / (t1 - t0)) * pw;
    g.fillStyle = C.text; g.textAlign = 'center'; g.font = '10px Segoe UI, sans-serif';
    const step = (t1 - t0) > 60 ? 20 : (t1 - t0) > 20 ? 5 : 2;
    for (let t = Math.ceil(t0 / step) * step; t <= t1; t += step) g.fillText(t.toFixed(0), X(t), T + ph + 12);
    g.fillText('t (µs)', L + pw - 10, T + ph + 22);
    if (this.lastShot) {
      const mx = Math.max(...this.lastShot.map((s) => s[1]));
      g.strokeStyle = C.line; g.lineWidth = 1.2;
      for (const [m, a, t] of this.lastShot) {
        const x = X(t * 1e6), y = T + ph - (a / mx) * ph * 0.95;
        g.beginPath(); g.moveTo(x, T + ph); g.lineTo(x, y); g.stroke();
      }
      g.lineWidth = 1;
    }
    g.textAlign = 'left'; g.fillStyle = C.text;
    g.fillText(`t = L·√(m/2zeU) · L = ${Lf.toFixed(2)} m · U = ${(U / 1000).toFixed(0)} kV`, L + 4, T - 5);
  }
}

export const PANEL = {
  titulo: 'Simulación del tiempo de vuelo',
  controles: [
    { id: 'muestra', label: 'Muestra', value: 'peptidos', opciones: Object.entries(MUESTRAS).map(([k, m]) => [k, m.nombre]) },
    { id: 'modo', label: 'Modo del analizador', value: 'reflector', opciones: [['reflector', 'Reflectrón'], ['lineal', 'Lineal']] },
    { id: 'de', label: 'Extracción retardada', value: 'on', opciones: [['on', 'Activada'], ['off', 'Desactivada']] },
    { id: 'velocidad', label: 'Velocidad', value: '1', opciones: [['0.5', 'Lenta'], ['1', 'Normal'], ['2', 'Rápida']] },
  ],
  lecturas: [['modo', 'Modo'], ['res', 'Resolución m/Δm'], ['tof', 't de vuelo (pico 1)'], ['n', 'Disparos']],
  nota: 'Tiempos de vuelo calculados con t = L·√(m/2zeU). Resoluciones y abundancias típicas, con fines ilustrativos. Animación ralentizada unas 10⁶ veces.',
  leyenda: [['#ffd28a', 'ion en extracción'], ['#f08c00', 'vuelo libre'], ['#7be495', 'en el reflectrón']],
  graficas: ['Espectro de masas (acumulado)', 'Señal del detector · último disparo'],
};
