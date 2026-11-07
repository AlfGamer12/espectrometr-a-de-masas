// Simulación didáctica de un sector magnético de doble enfoque.
// Las trayectorias se integran en el plano X–Z: en el imán la curvatura es 1/r con r = (1/B)·√(2mV/z);
// en el sector eléctrico r = 2V/E (depende solo de la energía). El espectro se obtiene barriendo el campo B.
import * as THREE from 'three';
import { AX, FIS } from './geometria.js';
import { PointPool, chartColors, setupCanvas, axes, COL } from '../../simcore.js';

// Masas exactas (u) de iones de referencia. Abundancias ilustrativas.
export const MUESTRAS = {
  gases: {
    nombre: 'Gases residuales (doblete a m/z 28)', rango: [26.5, 33.5], zoom: [27.97, 28.05],
    picos: [[27.9949, 35, 'CO⁺'], [28.0061, 100, 'N₂⁺'], [28.0313, 18, 'C₂H₄⁺'], [31.9898, 28, 'O₂⁺'], [29.0027, 3, '¹⁵N¹⁴N⁺'], [32.0262, 4, 'CH₃OH⁺']],
  },
  dioxina: {
    nombre: '2,3,7,8-TCDD con patrón ¹³C₁₂ y PFK', rango: [317.5, 335.5], zoom: [318.9, 320.0],
    picos: [[319.8965, 77, 'TCDD'], [321.8936, 100, 'TCDD'], [331.9368, 60, '¹³C₁₂-TCDD'], [333.9339, 78, '¹³C₁₂-TCDD'],
      [318.9792, 45, 'PFK'], [330.9792, 55, 'PFK (QC)'], [319.9200, 8, 'interferencia (ilustrativa)']],
  },
};
const RESOL = { ancha: 1000, media: 10000, estrecha: 40000 };

export class Simulacion {
  constructor(eq, els) {
    this.refs = eq.analyzer;
    this.els = { c1: els.canvases[0], c2: els.canvases[1], ...els.read };
    const A = this.refs.group;
    this.ionPool = new PointPool(A, 2400, 0.35);
    this.fPool = new PointPool(A, 200, 1.0);
    this.ions = []; this.flashes = [];
    this.muestra = 'gases'; this.rendija = 'media'; this.velocidad = 1;
    this.reset();
    this.setVisible(false);
  }
  setVisible(v) { this.ionPool.visible = v; this.fPool.visible = v; }
  setTheme(light) { this.ionPool.setTheme(light); this.fPool.setTheme(light); }
  start() { this.active = true; this.setVisible(true); this.reset(); }
  stop() { this.active = false; this.setVisible(false); this.ions.length = 0; this.flashes.length = 0; }
  setControl(id, v) {
    if (id === 'muestra') { this.muestra = v; this.reset(); }
    else if (id === 'rendija') { this.rendija = v; this.reset(); }
    else if (id === 'velocidad') this.velocidad = +v;
  }
  options() { return null; }
  value() { return null; }
  get R() { return RESOL[this.rendija]; }

  reset() {
    const M = MUESTRAS[this.muestra];
    [this.lo, this.hi] = M.rango;
    this.nbin = 1600;
    this.perfil = new Float32Array(this.nbin).fill(-1);
    this.mset = this.lo; this.barridos = 0; this.cuentas = 0;
  }
  /** Señal (perfil de pico) a la masa m con la resolución de las rendijas actuales. */
  señal(m) {
    let s = 0.15 * Math.random();
    for (const [mm, a] of MUESTRAS[this.muestra].picos) {
      const sig = mm / this.R / 2.355; const d = (m - mm) / sig;
      if (Math.abs(d) < 6) s += a * Math.exp(-0.5 * d * d);
    }
    return s;
  }
  /** Campo magnético necesario para que la m/z seleccionada siga la trayectoria central (radio FIS.R_M). */
  campo(m) { return Math.sqrt((2 * m * 1.66054e-27 * FIS.V) / 1.602177e-19) / FIS.R_M; }

  emit() {
    // composición del haz: picos de la muestra según su abundancia
    const P = MUESTRAS[this.muestra].picos;
    const tot = P.reduce((s, p) => s + p[1], 0);
    let r = Math.random() * tot, m = P[0][0];
    for (const [mm, a] of P) { r -= a; if (r <= 0) { m = mm; break; } }
    // en la escala de la animación se exagera la diferencia de masa para que el efecto del imán sea visible
    const k = 1 + (m - this.mset) / (this.mset * 0.02);
    const ion = { m, k: Math.max(0.3, k), p: AX.SRC.clone(), d: new THREE.Vector3(1, 0, 0), y0: (Math.random() - 0.5) * 0.5,
      dE: (Math.random() - 0.5) * 0.04, z0: (Math.random() - 0.5) * 0.4, ph: 0 };
    ion.p.z += ion.z0; ion.d.z = (Math.random() - 0.5) * 0.02; ion.d.normalize();
    this.ions.push(ion);
  }

  update(dt) {
    if (!this.active) return;
    dt = Math.min(dt, 0.05);
    const ts = dt * this.velocidad;
    // barrido del campo magnético: la m/z seleccionada recorre el rango
    const prev = this.mset;
    this.mset += (this.hi - this.lo) / 9 * ts;
    if (this.mset > this.hi) { this.mset = this.lo; this.perfil.fill(-1); this.barridos++; }
    const db = (this.hi - this.lo) / this.nbin;
    const i0 = Math.max(0, Math.floor((prev - this.lo) / db)), i1 = Math.min(this.nbin - 1, Math.floor((this.mset - this.lo) / db));
    for (let i = i0; i <= i1; i++) this.perfil[i] = this.señal(this.lo + i * db);

    this.acc = (this.acc || 0) + ts * 260;
    while (this.acc >= 1) { this.emit(); this.acc -= 1; }

    const v = 55; // cm/s visual
    const step = v * ts;
    const n = Math.max(1, Math.ceil(step / 0.4)), h = step / n;
    for (const ion of this.ions) {
      for (let s = 0; s < n && ion.ph !== 9; s++) this.paso(ion, h);
    }
    this.ions = this.ions.filter((i) => i.ph !== 9);
    for (const f of this.flashes) f.t += dt;
    this.flashes = this.flashes.filter((f) => f.t < 0.3);

    this.ionPool.begin();
    const tmp = new THREE.Vector3();
    for (const i of this.ions) {
      tmp.copy(i.p); tmp.y = i.y0 * 0.6;
      this.ionPool.push(tmp, i.bad ? COL.bad : Math.abs(i.m - this.mset) < this.mset / this.R ? COL.ok : COL.nuevo, 1);
    }
    this.ionPool.end();
    this.fPool.begin();
    for (const f of this.flashes) this.fPool.push(f.p, COL.flash, f.k * (1 - f.t / 0.3));
    this.fPool.end();
    this.drawUI();
  }

  /** Un paso de integración de la trayectoria en el plano X–Z. */
  paso(ion, h) {
    const p = ion.p, d = ion.d;
    let k = 0;
    const inSector = (c, a0, a1) => { const a = Math.atan2(p.z - c.z, p.x - c.x); return a >= a0 - 1e-3 && a <= a1 + 1e-3; };
    // sector magnético: curvatura 1/r, con r proporcional a √m (V y B fijos)
    const inMag = ion.ph === 0 && inSector(AX.CM, AX.AM0, AX.AM1);
    if (ion.ph === 0 && !inMag && ion.enteredMag) ion.ph = 1;          // ha salido del imán
    if (inMag) {
      ion.enteredMag = true;
      k = 1 / (AX.RM * ion.k);
      const rm = Math.hypot(p.x - AX.CM.x, p.z - AX.CM.z);
      if (Math.abs(rm - AX.RM) > AX.GAP * 2.4) { this.choque(ion); return; }
    }
    // sector eléctrico: curvatura 1/r_e con r_e = 2V/E (solo depende de la energía)
    const inEsa = ion.ph >= 1 && inSector(AX.CE, AX.AE0, AX.AE1);
    if (inEsa) {
      ion.ph = 2;
      k = 1 / (AX.RE * (1 + ion.dE));
      const re = Math.hypot(p.x - AX.CE.x, p.z - AX.CE.z);
      if (Math.abs(re - AX.RE) > AX.GAP) { this.choque(ion); return; }
    } else if (ion.ph === 2) ion.ph = 3;                               // ha salido del ESA
    if (k) { const nx = -d.z, nz = d.x; d.x += nx * k * h; d.z += nz * k * h; d.normalize(); }
    p.addScaledVector(d, h);
    // rendija de salida: plano perpendicular al rumbo final, a L3 de la salida del ESA
    if (ion.ph === 3) {
      const rel = p.clone().sub(AX.SLIT);
      if (rel.dot(AX.H2) >= 0) {
        const off = Math.abs(rel.dot(AX.left(AX.H2)));
        if (off < 0.7) { ion.ph = 9; this.cuentas++; this.flash(AX.DYN, 0.9); this.flash(AX.EM, 0.6); }
        else this.choque(ion);
        return;
      }
    }
    if (p.length() > 300) ion.ph = 9;
  }  choque(ion) { ion.ph = 9; this.flash(ion.p, 0.4); }
  flash(p, k) { if (this.flashes.length < 180) this.flashes.push({ p: p.clone(), t: 0, k }); }

  /* -------------------- PANELES 2D -------------------- */
  drawUI() {
    this.frame = (this.frame || 0) + 1;
    if (this.frame % 2) return;
    this.drawSpectrum(); this.drawZoom();
    const e = this.els;
    e.mz.textContent = this.mset.toFixed(4);
    e.b.textContent = this.campo(this.mset).toFixed(4) + ' T';
    e.r.textContent = this.R.toLocaleString('es-ES');
    e.det.textContent = this.cuentas.toLocaleString('es-ES');
  }
  drawSpectrum() {
    const [g, w, h] = setupCanvas(this.els.c1);
    const C = chartColors();
    const L = 38, R = 10, T = 16, B = 26, pw = w - L - R, ph = h - T - B;
    axes(g, C, L, T, pw, ph);
    const X = (m) => L + ((m - this.lo) / (this.hi - this.lo)) * pw;
    g.textAlign = 'center'; g.fillStyle = C.text;
    for (let m = Math.ceil(this.lo); m <= this.hi; m += (this.hi - this.lo) > 10 ? 2 : 1) g.fillText(m, X(m), T + ph + 14);
    g.fillText('m/z', L + pw - 8, T + ph + 24);
    g.beginPath(); let started = false, lastX = L;
    for (let i = 0; i < this.nbin; i++) {
      const v = this.perfil[i]; if (v < 0) continue;
      const x = L + (i / (this.nbin - 1)) * pw, y = T + ph - Math.min(1, v / 105) * ph;
      if (!started) { g.moveTo(x, T + ph); started = true; } g.lineTo(x, y); lastX = x;
    }
    if (started) {
      g.lineTo(lastX, T + ph); g.closePath();
      const grd = g.createLinearGradient(0, T, 0, T + ph); grd.addColorStop(0, C.fill0); grd.addColorStop(1, C.fill1);
      g.fillStyle = grd; g.fill(); g.strokeStyle = C.line; g.lineWidth = 1.2; g.stroke(); g.lineWidth = 1;
    }
    g.strokeStyle = C.cursor; g.setLineDash([4, 3]); g.beginPath(); g.moveTo(X(this.mset), T); g.lineTo(X(this.mset), T + ph); g.stroke(); g.setLineDash([]);
    g.fillStyle = C.text; g.textAlign = 'left'; g.font = '11px Segoe UI, sans-serif';
    g.fillText(`${MUESTRAS[this.muestra].nombre} · barrido magnético ${this.barridos + 1} · R = ${this.R.toLocaleString('es-ES')}`, L + 6, T - 4);
  }
  /** Ventana ampliada del doblete con la resolución actual (criterio del 10 % de valle). */
  drawZoom() {
    const [g, w, h] = setupCanvas(this.els.c2);
    const C = chartColors();
    const M = MUESTRAS[this.muestra];
    const [lo, hi] = M.zoom;
    const L = 30, R = 8, T = 16, B = 24, pw = w - L - R, ph = h - T - B;
    axes(g, C, L, T, pw, ph, false);
    const X = (m) => L + ((m - lo) / (hi - lo)) * pw;
    const N = 400; let mx = 1; const vals = [];
    for (let i = 0; i <= N; i++) {
      const m = lo + (i / N) * (hi - lo); let s = 0;
      for (const [mm, a] of M.picos) { const sig = mm / this.R / 2.355, d = (m - mm) / sig; if (Math.abs(d) < 8) s += a * Math.exp(-0.5 * d * d); }
      vals.push(s); mx = Math.max(mx, s);
    }
    g.beginPath(); vals.forEach((v, i) => { const x = L + (i / N) * pw, y = T + ph - (v / mx) * ph * 0.92; i ? g.lineTo(x, y) : g.moveTo(x, y); });
    g.strokeStyle = C.line; g.lineWidth = 1.5; g.stroke(); g.lineWidth = 1;
    g.font = '10px Segoe UI, sans-serif'; g.textAlign = 'center';
    let li = 0;
    for (const [mm, , nom] of M.picos) {
      if (mm < lo || mm > hi) continue;
      g.fillStyle = C.peak; g.fillText(mm.toFixed(4), X(mm), T + 8 + (li++ % 2) * 11);
      g.fillStyle = C.text; g.fillText(nom, X(mm), T + ph + 12);
    }
    g.textAlign = 'left'; g.fillStyle = C.text;
    g.fillText(`Ventana ampliada · R = m/Δm = ${this.R.toLocaleString('es-ES')}`, L + 4, T - 5);
  }
}

export const PANEL = {
  titulo: 'Simulación del barrido magnético',
  controles: [
    { id: 'muestra', label: 'Muestra', value: 'gases', opciones: Object.entries(MUESTRAS).map(([k, m]) => [k, m.nombre]) },
    { id: 'rendija', label: 'Rendijas', value: 'media', opciones: [['ancha', 'Anchas (R ≈ 1000)'], ['media', 'Medias (R ≈ 10 000)'], ['estrecha', 'Estrechas (R ≈ 40 000)']] },
    { id: 'velocidad', label: 'Velocidad', value: '1', opciones: [['0.5', 'Lenta'], ['1', 'Normal'], ['2', 'Rápida']] },
  ],
  lecturas: [['mz', 'm/z seleccionada'], ['b', 'Campo B*'], ['r', 'Resolución'], ['det', 'Cuentas']],
  nota: '* B = √(2mV/ze)/r para V = 5 kV y r = 0,35 m (Thermo DFS). En la animación se exagera la diferencia de radio entre masas para que sea visible.',
  leyenda: [['#f08c00', 'm/z seleccionada'], ['#ffd28a', 'otras m/z'], ['#e03150', 'ion desviado']],
  graficas: ['Espectro (barrido del campo magnético)', 'Ventana ampliada · doblete'],
};
