// Simulación didáctica del timsTOF: acumulación en la 1.ª sección del TIMS, elución por movilidad en la 2.ª al bajar el campo,
// selección sincronizada del cuadrupolo (PASEF), fragmentación y registro en el TOF ortogonal.
import * as THREE from 'three';
import { AX } from './geometria.js';
import { PointPool, chartColors, setupCanvas, axes, COL } from '../../simcore.js';

// Generador pseudoaleatorio reproducible
function rng(seed) { let a = seed; return () => { a = (a * 16807) % 2147483647; return a / 2147483647; }; }

/** Nube de péptidos trípticos ilustrativa: 1/K0 crece con m/z y disminuye con la carga (tendencias publicadas). */
function nubePeptidos() {
  const r = rng(11), P = [];
  for (let i = 0; i < 70; i++) {
    const z = r() < 0.69 ? 2 : r() < 0.85 ? 3 : 1;
    const mz = z === 1 ? 300 + r() * 450 : z === 2 ? 380 + r() * 820 : 380 + r() * 520;
    const k = z === 1 ? 0.62 + 0.00078 * mz : z === 2 ? 0.52 + 0.00058 * mz : 0.50 + 0.00052 * mz;
    P.push({ mz, z, k: k + (r() - 0.5) * 0.06, ab: 15 + r() * 85, nombre: z === 1 ? 'contaminante 1+' : `péptido ${z}+` });
  }
  return P;
}
export const MUESTRAS = {
  peptidos: { nombre: 'Digerido tríptico (ilustrativo)', iones: nubePeptidos() },
  calibrante: {
    nombre: 'Calibrante ESI-L (Agilent)', iones: [
      { mz: 622.0290, z: 1, k: 0.9915, ab: 100, nombre: 'm/z 622,0290' },
      { mz: 922.0098, z: 1, k: 1.1986, ab: 85, nombre: 'm/z 922,0098' },
      { mz: 1221.9906, z: 1, k: 1.3934, ab: 55, nombre: 'm/z 1221,9906' },
    ],
  },
};
const K_HI = 1.6, K_LO = 0.6;           // rango de 1/K0 de la rampa (V·s/cm²)
const ZCOL = { 1: '#8a94a0', 2: '#1d63c9', 3: '#d9773e' };

export class Simulacion {
  constructor(eq, els) {
    this.refs = eq.analyzer;
    this.els = { c1: els.canvases[0], c2: els.canvases[1], ...els.read };
    const A = this.refs.group;
    this.ionPool = new PointPool(A, 3200, 0.28);
    this.fPool = new PointPool(A, 200, 0.8);
    this.ions = []; this.flashes = [];
    this.muestra = 'peptidos'; this.modo = 'pasef'; this.rampa = 100; this.velocidad = 1;
    this.reset();
    this.setVisible(false);
  }
  setVisible(v) { this.ionPool.visible = v; this.fPool.visible = v; }
  setTheme(light) { this.ionPool.setTheme(light); this.fPool.setTheme(light); }
  start() { this.active = true; this.setVisible(true); this.reset(); }
  stop() { this.active = false; this.setVisible(false); this.ions.length = 0; this.flashes.length = 0; if (this.refs.spray) this.refs.spray.material.opacity = 0; }
  setControl(id, v) {
    if (id === 'muestra') this.muestra = v; else if (id === 'modo') this.modo = v;
    else if (id === 'rampa') this.rampa = +v; else if (id === 'velocidad') this.velocidad = +v;
    this.reset();
  }
  options() { return null; }
  value() { return null; }
  /** Resolución de movilidad (K/ΔK) según la duración de la rampa (valores típicos 40–100). */
  get Rk() { return { 50: 45, 100: 60, 200: 85 }[this.rampa] || 60; }

  reset() {
    this.mapa = [];                 // puntos (m/z, 1/K0, z, intensidad) del mapa acumulado
    this.movil = new Float32Array(200);
    this.t = 0; this.fase = 0; this.rampas = 0; this.msms = 0;
    this.ultimoMSMS = null; this.pasef = [];
    this.planPASEF();
  }
  /** Selección de precursores para la rampa: los más intensos de carga ≥ 2, separados en movilidad. */
  planPASEF() {
    const I = MUESTRAS[this.muestra].iones.filter((p) => p.z >= 2 || this.muestra === 'calibrante')
      .sort((a, b) => b.ab - a.ab);
    const sel = [];
    for (const p of I) { if (sel.length >= 10) break; if (sel.every((q) => Math.abs(q.k - p.k) > 0.035)) sel.push(p); }
    this.pasef = sel.sort((a, b) => b.k - a.k);
  }
  /** 1/K0 que está eluyendo ahora (la rampa baja el campo: primero salen los de 1/K0 alto). */
  kActual() { return K_HI - (K_HI - K_LO) * Math.min(1, this.t / this.T); }
  get T() { return 1.6 * (this.rampa / 100) + 1.2; }   // duración visual de una rampa (s)

  update(dt) {
    if (!this.active) return;
    dt = Math.min(dt, 0.05) * this.velocidad;
    this.t += dt;
    if (this.refs.spray) this.refs.spray.material.opacity = 0.35 + 0.1 * Math.sin(this.t * 40);
    if (this.t > this.T) { this.t = 0; this.rampas++; this.movil.fill(0); this.planPASEF(); }
    const k = this.kActual(), dk = k / this.Rk;
    const M = MUESTRAS[this.muestra].iones;

    // iones que eluyen en este instante (perfil gaussiano en 1/K0)
    for (const p of M) {
      const w = Math.exp(-0.5 * ((p.k - k) / (dk / 2.355)) ** 2);
      if (w < 0.02) continue;
      const amp = p.ab * w;
      if (Math.random() < 0.6) this.mapa.push([p.mz + (Math.random() - 0.5) * 0.3, p.k + (Math.random() - 0.5) * dk * 0.6, p.z, amp]);
      const bin = Math.round((p.k - K_LO) / (K_HI - K_LO) * 199); if (bin >= 0 && bin < 200) this.movil[bin] = Math.max(this.movil[bin], amp);
      if (Math.random() < w * 0.5) this.ions.push(this.nuevoIon(p, 2));
    }
    if (this.mapa.length > 5000) this.mapa.splice(0, this.mapa.length - 5000);
    // PASEF: el cuadrupolo se sitúa en el precursor que está eluyendo
    this.qSel = null;
    if (this.modo === 'pasef') for (const p of this.pasef) if (Math.abs(p.k - k) < dk * 0.8) { this.qSel = p; break; }
    if (this.qSel && this.qSel !== this.qPrev) { this.msms++; this.ultimoMSMS = { p: this.qSel, frag: this.fragmentos(this.qSel) }; }
    this.qPrev = this.qSel;

    // iones que llegan desde la fuente y se acumulan en la 1.ª sección
    this.acc = (this.acc || 0) + dt * 300;
    while (this.acc >= 1) { this.ions.push(this.nuevoIon(M[(Math.random() * M.length) | 0], 0)); this.acc -= 1; }

    const v = 30;
    for (const ion of this.ions) {
      ion.t += dt;
      if (ion.ph === 0) { // spray → capilar → deflexión → embudo → sección de acumulación
        const path = [AX.SPRAY, new THREE.Vector3(AX.CAP1, AX.CAP_Y, 0), AX.DEFL, new THREE.Vector3(AX.F1_0 + 1, 0, 0), new THREE.Vector3(AX.T_0 + 1 + Math.random() * 3.5, 0, 0)];
        ion.path = ion.path || path;
        const u = Math.min(1, ion.t / 0.9), seg = Math.min(3, Math.floor(u * 4)), f = u * 4 - seg;
        ion.pos.lerpVectors(ion.path[seg], ion.path[seg + 1], f);
        const conv = seg >= 2 ? (1 - f * 0.7) : 1;
        ion.pos.y += Math.sin(ion.t * 60 + ion.ph0) * 0.35 * conv * (seg < 3 ? 1 : 0.3);
        ion.pos.z += Math.cos(ion.t * 50 + ion.ph0) * 0.35 * conv * (seg < 3 ? 1 : 0.3);
        if (u >= 1) ion.ph = 1;
      } else if (ion.ph === 1) { // retenido en la acumulación
        ion.pos.set(AX.T_0 + 0.6 + ((ion.ph0 * 13) % 4), Math.sin(ion.t * 30 + ion.ph0) * 0.22, Math.cos(ion.t * 27 + ion.ph0) * 0.22);
        if (ion.t > 1.6 + Math.random() * 2) ion.ph = 9;
      } else if (ion.ph === 2) { // atrapado en la sección de análisis en una posición que depende de su movilidad; eluye
        const x0 = AX.T_MID + (AX.T_1 - AX.T_MID) * (1 - (ion.p.k - K_LO) / (K_HI - K_LO));
        if (ion.t < 0.15) ion.pos.set(x0, Math.sin(ion.t * 40 + ion.ph0) * 0.18, Math.cos(ion.t * 33 + ion.ph0) * 0.18);
        else { ion.ph = 3; ion.x = x0; }
      } else if (ion.ph === 3) { // embudo de salida, guía y cuadrupolo
        ion.x += v * dt;
        ion.pos.set(ion.x, Math.sin(ion.t * 50 + ion.ph0) * 0.1, Math.cos(ion.t * 41 + ion.ph0) * 0.1);
        if (ion.x >= AX.Q_0 && ion.ok === undefined) ion.ok = this.modo !== 'pasef' || (this.qSel && this.qSel === ion.p);
        if (ion.x > AX.Q_0 + 3 && !ion.ok) { const a = Math.exp((ion.x - AX.Q_0 - 3) * 0.5) * 0.1; ion.pos.y += a; if (a > 0.6) { ion.ph = 9; this.flash(ion.pos, 0.3); } }
        if (ion.x >= AX.C_0 + 6 && this.modo === 'pasef' && !ion.frag) { ion.frag = true; this.flash(ion.pos, 0.25); }
        if (ion.x >= AX.PUSH.x) { ion.ph = 4; ion.t = 0; ion.s = ion.pos.clone(); }
      } else if (ion.ph === 4) { // TOF ortogonal en V: pusher → reflectrón → detector
        const tt = 0.55 * Math.sqrt(ion.p.mz / 800), u = Math.min(1, ion.t / tt);
        if (u < 0.5) ion.pos.lerpVectors(ion.s, AX.REFL, u * 2); else ion.pos.lerpVectors(AX.REFL, AX.DET, (u - 0.5) * 2);
        if (u >= 1) { ion.ph = 9; this.flash(AX.DET, 0.7); }
      }
    }
    this.ions = this.ions.filter((i) => i.ph !== 9);
    if (this.ions.length > 3000) this.ions.splice(0, this.ions.length - 3000);
    for (const f of this.flashes) f.t += dt;
    this.flashes = this.flashes.filter((f) => f.t < 0.25);

    this.ionPool.begin();
    for (const i of this.ions) this.ionPool.push(i.pos, i.ph <= 1 ? COL.gota : i.frag ? COL.frag : i.ok === false ? COL.bad : COL.ok, 1);
    this.ionPool.end();
    this.fPool.begin();
    for (const f of this.flashes) this.fPool.push(f.p, COL.flash, f.k * (1 - f.t / 0.25));
    this.fPool.end();
    this.drawUI(k);
  }
  nuevoIon(p, ph) { const ion = { p, ph, t: 0, pos: AX.SPRAY.clone(), ph0: Math.random() * 6.28 }; return ion; }
  flash(p, k) { if (this.flashes.length < 180) this.flashes.push({ p: p.clone(), t: 0, k }); }

  /** Espectro de fragmentos ilustrativo (series b/y) de un precursor. */
  fragmentos(p) {
    const r = rng(Math.round(p.mz * 1000)), M = p.mz * p.z - (p.z - 1) * 1.007;
    const f = [];
    let b = 72 + r() * 60;
    while (b < M - 100) { f.push([b, 15 + r() * 70]); f.push([M - b + 18, 20 + r() * 80]); b += 57 + r() * 129; }
    return f.filter(([m]) => m > 100 && m < 1700);
  }

  /* -------------------- PANELES 2D -------------------- */
  drawUI(k) {
    this.frame = (this.frame || 0) + 1;
    if (this.frame % 3) return;
    this.drawMapa(k); this.drawSegundo(k);
    const e = this.els;
    e.k.textContent = k.toFixed(3);
    e.t.textContent = (this.rampa * Math.min(1, this.t / this.T)).toFixed(0) + ' ms';
    e.q.textContent = this.qSel ? this.qSel.mz.toFixed(2) : (this.modo === 'pasef' ? '—' : 'RF');
    e.n.textContent = this.modo === 'pasef' ? this.msms.toLocaleString('es-ES') : this.rampas.toLocaleString('es-ES');
  }
  /** Mapa m/z frente a 1/K0 (la representación característica de la proteómica 4D). */
  drawMapa(k) {
    const [g, w, h] = setupCanvas(this.els.c1);
    const C = chartColors();
    const L = 42, R = 10, T = 16, B = 26, pw = w - L - R, ph = h - T - B;
    axes(g, C, L, T, pw, ph, false);
    const lo = 250, hi = 1300;
    const X = (m) => L + ((m - lo) / (hi - lo)) * pw, Y = (kk) => T + ph - ((kk - K_LO) / (K_HI - K_LO)) * ph;
    g.fillStyle = C.text; g.font = '10px Segoe UI, sans-serif'; g.textAlign = 'center';
    for (let m = 300; m <= hi; m += 200) g.fillText(m, X(m), T + ph + 13);
    g.fillText('m/z', L + pw - 8, T + ph + 23);
    g.textAlign = 'right';
    for (const kk of [0.6, 0.8, 1.0, 1.2, 1.4, 1.6]) { g.fillText(kk.toFixed(1), L - 4, Y(kk) + 3); g.strokeStyle = C.grid; g.beginPath(); g.moveTo(L, Y(kk)); g.lineTo(L + pw, Y(kk)); g.stroke(); }
    g.save(); g.translate(11, T + ph / 2); g.rotate(-Math.PI / 2); g.textAlign = 'center'; g.fillText('1/K₀ (V·s/cm²)', 0, 0); g.restore();
    for (const [m, kk, z, a] of this.mapa) {
      g.globalAlpha = Math.min(0.9, 0.15 + a / 140);
      g.fillStyle = ZCOL[z]; g.fillRect(X(m) - 1.2, Y(kk) - 1.2, 2.4, 2.4);
    }
    g.globalAlpha = 1;
    // ventanas PASEF de la rampa
    if (this.modo === 'pasef') for (const p of this.pasef) {
      g.strokeStyle = p === this.qSel ? C.cursor : C.axis; g.lineWidth = p === this.qSel ? 1.6 : 0.8;
      g.strokeRect(X(p.mz - 12), Y(p.k + 0.025), X(p.mz + 12) - X(p.mz - 12), Y(p.k - 0.025) - Y(p.k + 0.025));
    }
    g.lineWidth = 1;
    g.strokeStyle = C.cursor; g.setLineDash([4, 3]); g.beginPath(); g.moveTo(L, Y(k)); g.lineTo(L + pw, Y(k)); g.stroke(); g.setLineDash([]);
    g.textAlign = 'left'; g.fillStyle = C.text; g.font = '11px Segoe UI, sans-serif';
    g.fillText(`${MUESTRAS[this.muestra].nombre} · rampa ${this.rampa} ms · K/ΔK ≈ ${this.Rk}`, L + 6, T - 4);
    let x = L + pw - 150; for (const z of [1, 2, 3]) { g.fillStyle = ZCOL[z]; g.fillRect(x, T - 10, 7, 7); g.fillStyle = C.text; g.fillText(`${z}+`, x + 10, T - 3); x += 40; }
  }
  /** MS1: movilograma de la rampa en curso. PASEF: último espectro MS/MS. */
  drawSegundo(k) {
    const [g, w, h] = setupCanvas(this.els.c2);
    const C = chartColors();
    const L = 30, R = 8, T = 16, B = 24, pw = w - L - R, ph = h - T - B;
    axes(g, C, L, T, pw, ph, false);
    g.font = '10px Segoe UI, sans-serif'; g.fillStyle = C.text;
    if (this.modo !== 'pasef' || !this.ultimoMSMS) {
      const X = (kk) => L + ((K_HI - kk) / (K_HI - K_LO)) * pw;
      let mx = 1; for (const v of this.movil) mx = Math.max(mx, v);
      g.beginPath(); for (let i = 0; i < 200; i++) { const kk = K_LO + (i / 199) * (K_HI - K_LO); const x = X(kk), y = T + ph - (this.movil[i] / mx) * ph; i ? g.lineTo(x, y) : g.moveTo(x, y); }
      g.strokeStyle = C.line; g.lineWidth = 1.4; g.stroke(); g.lineWidth = 1;
      g.textAlign = 'center'; for (const kk of [1.6, 1.2, 0.8]) g.fillText(kk.toFixed(1), X(kk), T + ph + 12);
      g.fillText('1/K₀ (orden de elución →)', L + pw / 2, T + ph + 22);
      g.textAlign = 'left'; g.fillText('Movilograma de la rampa en curso', L + 4, T - 5);
      return;
    }
    const { p, frag } = this.ultimoMSMS;
    const lo = 100, hi = 1700, X = (m) => L + ((m - lo) / (hi - lo)) * pw;
    const mx = Math.max(...frag.map((f) => f[1]), 1);
    g.fillStyle = C.frag || '#3a9a6a';
    for (const [m, a] of frag) { const x = X(m), y = T + ph - (a / mx) * ph; g.fillStyle = C.line; g.fillRect(x - 1, y, 2, T + ph - y); }
    g.fillStyle = C.text; g.textAlign = 'center';
    for (let m = 200; m <= 1600; m += 400) g.fillText(m, X(m), T + ph + 12);
    g.textAlign = 'left';
    g.fillText(`MS/MS de m/z ${p.mz.toFixed(2)} (${p.z}+) · 1/K₀ ${p.k.toFixed(3)} · n.º ${this.msms}`, L + 4, T - 5);
  }
}

export const PANEL = {
  titulo: 'Simulación TIMS · PASEF',
  controles: [
    { id: 'muestra', label: 'Muestra', value: 'peptidos', opciones: [['peptidos', 'Digerido tríptico'], ['calibrante', 'Calibrante ESI-L']] },
    { id: 'modo', label: 'Modo', value: 'pasef', opciones: [['pasef', 'PASEF (MS/MS)'], ['ms1', 'TIMS-MS (MS1)']] },
    { id: 'rampa', label: 'Tiempo de rampa', value: '100', opciones: [['50', '50 ms'], ['100', '100 ms'], ['200', '200 ms']] },
    { id: 'velocidad', label: 'Velocidad', value: '1', opciones: [['0.5', 'Lenta'], ['1', 'Normal'], ['2', 'Rápida']] },
  ],
  lecturas: [['k', '1/K₀ eluyendo'], ['t', 'Tiempo de rampa'], ['q', 'Cuadrupolo (m/z)'], ['n', 'Espectros MS/MS']],
  nota: 'Rampa de 1/K₀ = 1,6 → 0,6 V·s/cm². Calibrantes con valores publicados; la nube de péptidos es ilustrativa y reproduce las tendencias por carga. Animación ralentizada.',
  leyenda: [['#8fd3ff', 'acumulación'], ['#f08c00', 'ion transmitido'], ['#7be495', 'fragmento'], ['#e03150', 'descartado por el cuadrupolo']],
  graficas: ['Mapa m/z – movilidad (1/K₀)', 'Movilograma / espectro MS/MS'],
};
