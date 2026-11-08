// Simulación didáctica: trayectorias iónicas, barrido del cuadrupolo, espectro y diagrama de Mathieu.
// La escala temporal está ralentizada ~10⁶ veces respecto al equipo real.
import * as THREE from 'three';
import { AX } from './analizador.js';
import { PointPool, chartColors, setupCanvas } from '../../simcore.js';

// Espectros EI aproximados (abundancia relativa %). Valores orientativos con fines didácticos.
export const MUESTRAS = {
  pftba: {
    nombre: 'PFTBA (calibrante)', rango: [25, 520],
    picos: [[31, 4], [50, 3], [69, 100], [70, 1.1], [100, 12], [119, 8], [131, 28], [169, 4], [219, 45], [220, 2],
      [264, 10], [314, 2], [414, 3], [464, 1.5], [502, 3], [503, 0.3]],
  },
  tolueno: {
    nombre: 'Tolueno (C₇H₈, M = 92)', rango: [30, 100],
    picos: [[39, 8], [51, 4], [63, 5], [65, 10], [89, 4], [91, 100], [92, 65], [93, 4.5]],
  },
  cafeina: {
    nombre: 'Cafeína (C₈H₁₀N₄O₂, M = 194)', rango: [35, 205],
    picos: [[42, 10], [55, 22], [67, 28], [82, 22], [94, 8], [109, 50], [137, 7], [165, 4], [193, 9], [194, 100], [195, 11]],
  },
};

const APEX_Q = 0.706, APEX_A = 0.237;
const fBeta0 = (q) => q * q / 2 - 7 * q ** 4 / 128 + 29 * q ** 6 / 2304; // frontera βy = 0
const fBeta1 = (q) => 1 - q - q * q / 8 + q ** 3 / 64 - q ** 4 / 1536; // frontera βx = 1

const C_NEW = new THREE.Color(0xffd28a), C_OK = new THREE.Color(0xffa424), C_BAD = new THREE.Color(0xff3355),
  C_E = new THREE.Color(0x5fd8ff), C_FLASH = new THREE.Color(0xfff2c0);

export class Simulacion {
  constructor(eq, els) {
    this.refs = eq.analyzer;
    this.els = { spec: els.canvases[0], stab: els.canvases[1], ...els.read };
    const A = this.refs.group;
    this.ionPool = new PointPool(A, 2000, 0.32);
    this.ePool = new PointPool(A, 1200, 0.2);
    this.fPool = new PointPool(A, 300, 0.9);
    this.ions = []; this.electrons = []; this.flashes = [];
    this.active = false;
    this.muestra = 'pftba';
    this.modo = 'scan';     // 'scan' | 'sim'
    this.velocidad = 1;     // multiplicador
    this.simMass = 69;
    this.detectados = 0;
    this.t = 0;
    this.v = new THREE.Vector3();
    this.resetScan();
    this.setVisible(false);
  }

  setVisible(v) { this.ionPool.visible = v; this.ePool.visible = v; this.fPool.visible = v; }

  /** En tema claro la mezcla aditiva se pierde sobre fondo blanco: se usa mezcla normal. */
  setTheme(light) {
    for (const p of [this.ionPool, this.ePool, this.fPool]) p.setTheme(light);
    this.refs.beam.material.blending = light ? THREE.NormalBlending : THREE.AdditiveBlending;
    this.refs.beam.material.needsUpdate = true;
  }

  start() { this.active = true; this.setVisible(true); this.resetScan(); }
  stop() {
    this.active = false; this.setVisible(false);
    this.ions.length = 0; this.electrons.length = 0; this.flashes.length = 0;
    this.refs.beam.material.opacity = 0;
    this.refs.filamento1.material.emissive.setHex(0x000000);
  }

  /** Interfaz común con el visor. */
  setControl(id, v) {
    if (id === 'muestra') this.setMuestra(v);
    else if (id === 'modo') this.setModo(v);
    else if (id === 'ion') { this.simMass = +v; this.simTrace = []; }
    else if (id === 'velocidad') this.velocidad = +v;
  }
  options(id) { return id === 'ion' ? this.picosOrdenados().slice(0, 6).map(([m]) => [String(m), String(m)]) : null; }
  value(id) { return id === 'ion' ? String(this.simMass) : null; }
  keepGlow() { const m = this.refs.filamento1.material; m.emissive.setRGB(1, 0.45, 0.1); m.emissiveIntensity = 1.6; }

  setMuestra(k) { this.muestra = k; const pk = this.picosOrdenados(); this.simMass = pk[0][0]; this.resetScan(); }
  setModo(m) { this.modo = m; this.resetScan(); }
  picosOrdenados() { return [...MUESTRAS[this.muestra].picos].sort((a, b) => b[1] - a[1]); }

  resetScan() {
    const [lo, hi] = MUESTRAS[this.muestra].rango;
    this.lo = lo; this.hi = hi;
    this.mset = lo;
    this.step = 0.05;
    this.perfil = new Float32Array(Math.ceil((hi - lo) / this.step) + 1).fill(-1);
    this.simTrace = [];
    this.detectados = 0;
    this.scans = 0;
    const picos = MUESTRAS[this.muestra].picos;
    this.total = picos.reduce((s, p) => s + p[1], 0);
    this.cdf = []; let acc = 0;
    for (const [m, a] of picos) { acc += a / this.total; this.cdf.push([acc, m]); }
  }

  señal(m) {
    // perfil gaussiano de los picos (anchura ≈ 0,6 u FWHM)
    let s = 0;
    for (const [mm, a] of MUESTRAS[this.muestra].picos) {
      const d = m - mm; if (Math.abs(d) < 2) s += a * Math.exp(-(d * d) / (2 * 0.25 * 0.25));
    }
    return s;
  }

  randMass() {
    if (Math.random() < 0.15) return Math.round(this.lo + Math.random() * (this.hi - this.lo)); // fondo/ruido químico
    const r = Math.random();
    for (const [c, m] of this.cdf) if (r <= c) return m;
    return this.cdf[this.cdf.length - 1][1];
  }

  emit() {
    const m = this.randMass();
    const p0 = new THREE.Vector3(AX.SRC_X + (Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.8, (Math.random() - 0.5) * 0.8);
    this.ions.push({ m, ph: 0, t: 0, p0, pos: p0.clone(), stable: false });
  }

  update(dt) {
    if (!this.active) return;
    dt = Math.min(dt, 0.05);
    this.t += dt;
    // haz electrónico y filamento activo
    this.refs.beam.material.opacity = 0.45 + 0.25 * Math.sin(this.t * 30);
    this.refs.filamento1.material.emissive.setRGB(1.0, 0.45, 0.1);
    this.refs.filamento1.material.emissiveIntensity = 1.6;

    // barrido
    const uPorS = 20 * this.velocidad;
    if (this.modo === 'scan') {
      const prev = this.mset;
      this.mset += uPorS * dt;
      if (this.mset > this.hi) { this.mset = this.lo; this.perfil.fill(-1); this.scans++; }
      const i0 = Math.max(0, Math.floor((prev - this.lo) / this.step)), i1 = Math.floor((this.mset - this.lo) / this.step);
      for (let i = i0; i <= i1 && i < this.perfil.length; i++) {
        const m = this.lo + i * this.step;
        this.perfil[i] = this.señal(m) * (1 + (Math.random() - 0.5) * 0.08) + Math.random() * 0.4;
      }
    } else {
      this.mset = this.simMass;
      const s = this.señal(this.simMass) * (1 + (Math.random() - 0.5) * 0.1);
      this.simTrace.push(s); if (this.simTrace.length > 240) this.simTrace.shift();
    }

    // emisión de iones
    this.acc = (this.acc || 0) + dt * 600;
    while (this.acc >= 1) { this.emit(); this.acc -= 1; }

    const vQ = 40, tAcc = 0.22, tDet = 0.16;
    const qLen = AX.Q1 - AX.Q0;
    const entry = new THREE.Vector3(AX.Q0, 0, 0);
    const P0 = new THREE.Vector3(), C = new THREE.Vector3(28.0, 0, -0.3), P1 = AX.HED.clone().add(new THREE.Vector3(0, 0, -0.08));

    for (const ion of this.ions) {
      ion.t += dt;
      if (ion.ph === 0) { // aceleración y enfoque en las lentes
        const u = Math.min(1, ion.t / tAcc), e = u * u;
        ion.pos.lerpVectors(ion.p0, entry, e);
        ion.pos.y *= 1 - 0.75 * e; ion.pos.z *= 1 - 0.75 * e;
        if (u >= 1) {
          ion.ph = 1; ion.t = 0;
          ion.stable = Math.abs(ion.m - this.mset) <= 0.5;
          ion.y0 = ion.pos.y; ion.z0 = ion.pos.z;
          ion.w1 = 14 + Math.random() * 6; ion.w2 = 11 + Math.random() * 6;
          ion.f1 = Math.random() * 6.28; ion.f2 = Math.random() * 6.28;
          ion.A = 0.08 + Math.random() * 0.14;
          const d = Math.min(Math.abs(ion.m - this.mset), 40);
          ion.g = 3 + d * 0.35 + Math.random() * 3;
          ion.axis = Math.random() < 0.5 ? 'y' : 'z';
        }
      } else if (ion.ph === 1) { // dentro del cuadrupolo
        const x = AX.Q0 + vQ * ion.t;
        const micro = 1 + 0.18 * Math.sin(ion.t * 160);
        let ay = ion.A, az = ion.A * 0.8;
        if (!ion.stable) { const k = Math.exp(ion.g * ion.t); if (ion.axis === 'y') ay *= k; else az *= k; }
        ion.pos.set(x, ay * Math.sin(ion.w1 * ion.t + ion.f1) * micro, az * Math.sin(ion.w2 * ion.t + ion.f2) * micro);
        if (!ion.stable && Math.hypot(ion.pos.y, ion.pos.z) > AX.R0 * 0.95) {
          ion.ph = 9; this.flash(ion.pos, 0.5);
        } else if (x >= AX.Q1) { ion.ph = 2; ion.t = 0; ion.exit = ion.pos.clone(); }
      } else if (ion.ph === 2) { // curva hacia el HED (fuera de eje)
        const u = Math.min(1, ion.t / tDet);
        P0.copy(ion.exit);
        ion.pos.set(0, 0, 0)
          .addScaledVector(P0, (1 - u) ** 2).addScaledVector(C, 2 * u * (1 - u)).addScaledVector(P1, u * u);
        if (u >= 1) {
          ion.ph = 9; this.detectados++;
          this.flash(P1, 1.0);
          for (let k = 0; k < 4; k++) this.electrons.push({ t: 0, d: Math.random() * 0.05, j: new THREE.Vector3((Math.random() - 0.5) * 0.6, (Math.random() - 0.5) * 0.6, 0), pos: P1.clone() });
        }
      }
    }
    this.ions = this.ions.filter((i) => i.ph !== 9);

    // electrones secundarios HED -> EM -> cascada
    const E0 = AX.HED, E1 = AX.EM;
    for (const e of this.electrons) {
      e.t += dt;
      const u = (e.t - e.d) / 0.14;
      if (u < 0) { e.pos.copy(E0); continue; }
      if (u <= 1) {
        e.pos.lerpVectors(E0, E1, u).addScaledVector(e.j, Math.sin(u * Math.PI) * 0.5);
      } else {
        const w = Math.min(1, (u - 1) / 1.2);
        e.pos.set(E1.x + e.j.x * (1 - w) * 0.8 + Math.sin(e.t * 50) * 0.25 * (1 - w), e.j.y * (1 - w) * 0.8,
          E1.z - w * 2.5);
        if (w >= 1) e.dead = true;
      }
    }
    this.electrons = this.electrons.filter((e) => !e.dead);
    for (const f of this.flashes) f.t += dt;
    this.flashes = this.flashes.filter((f) => f.t < 0.25);

    // dibujar
    this.ionPool.begin();
    for (const i of this.ions) this.ionPool.push(i.pos, i.ph === 0 ? C_NEW : (i.stable ? C_OK : C_BAD), 1);
    this.ionPool.end();
    this.ePool.begin();
    for (const e of this.electrons) this.ePool.push(e.pos, C_E, 0.9);
    this.ePool.end();
    this.fPool.begin();
    for (const f of this.flashes) this.fPool.push(f.p, C_FLASH, f.k * (1 - f.t / 0.25));
    this.fPool.end();

    this.drawUI();
  }

  flash(p, k) { if (this.flashes.length < 280) this.flashes.push({ p: p.clone(), t: 0, k }); }

  /* -------------------- PANELES 2D -------------------- */
  drawUI() {
    this.frame = (this.frame || 0) + 1;
    if (this.frame % 2) return;
    this.drawSpectrum();
    this.drawStability();
    const V = 1.158 * this.mset, U = V * (APEX_A / (2 * APEX_Q));
    const e = this.els;
    e.mz.textContent = this.mset.toFixed(1);
    e.vrf.textContent = V.toFixed(0) + ' V';
    e.udc.textContent = U.toFixed(1) + ' V';
    e.det.textContent = this.detectados.toLocaleString('es-ES');
  }


  drawSpectrum() {
    const [g, w, h] = setupCanvas(this.els.spec);
    const L = 38, R = 10, T = 14, B = 26, pw = w - L - R, ph = h - T - B;
    const C = chartColors();
    g.font = '11px Segoe UI, sans-serif';
    g.strokeStyle = C.axis; g.fillStyle = C.text;
    g.beginPath(); g.moveTo(L, T); g.lineTo(L, T + ph); g.lineTo(L + pw, T + ph); g.stroke();
    g.textAlign = 'right';
    for (const v of [0, 50, 100]) { const y = T + ph - (v / 100) * ph; g.fillText(v + '%', L - 4, y + 4);
      g.strokeStyle = C.grid; g.beginPath(); g.moveTo(L, y); g.lineTo(L + pw, y); g.stroke(); }

    if (this.modo === 'sim') {
      g.textAlign = 'left'; g.fillText(`Modo SIM · m/z ${this.simMass} · abundancia frente al tiempo`, L + 6, T + 2);
      g.strokeStyle = C.line; g.lineWidth = 1.6; g.beginPath();
      this.simTrace.forEach((s, i) => { const x = L + (i / 240) * pw, y = T + ph - Math.min(1, s / 100) * ph;
        i ? g.lineTo(x, y) : g.moveTo(x, y); });
      g.stroke(); g.lineWidth = 1;
      g.textAlign = 'center'; g.fillText('tiempo →', L + pw / 2, T + ph + 18);
      return;
    }
    const X = (m) => L + ((m - this.lo) / (this.hi - this.lo)) * pw;
    const tick = this.hi - this.lo > 200 ? 50 : 10;
    g.textAlign = 'center';
    for (let m = Math.ceil(this.lo / tick) * tick; m <= this.hi; m += tick) g.fillText(m, X(m), T + ph + 14);
    g.fillText('m/z', L + pw - 8, T + ph + 24);
    // perfil
    g.beginPath(); let started = false;
    const grd = g.createLinearGradient(0, T, 0, T + ph);
    grd.addColorStop(0, C.fill0); grd.addColorStop(1, C.fill1);
    let lastX = L;
    for (let i = 0; i < this.perfil.length; i++) {
      const v = this.perfil[i]; if (v < 0) continue;
      const x = X(this.lo + i * this.step), y = T + ph - Math.min(1, v / 100) * ph;
      if (!started) { g.moveTo(x, T + ph); started = true; }
      g.lineTo(x, y); lastX = x;
    }
    if (started) {
      g.lineTo(lastX, T + ph); g.closePath(); g.fillStyle = grd; g.fill();
      g.strokeStyle = C.line; g.lineWidth = 1.3; g.stroke(); g.lineWidth = 1;
    }
    // etiquetas de picos ya barridos
    g.fillStyle = C.peak; g.font = '600 11px Segoe UI, sans-serif';
    for (const [m, a] of MUESTRAS[this.muestra].picos) {
      if (a < 4 || m > this.mset) continue;
      g.fillText(m, X(m), T + ph - Math.min(1, a / 100) * ph - 4);
    }
    // cursor de barrido
    g.strokeStyle = C.cursor; g.setLineDash([4, 3]);
    g.beginPath(); g.moveTo(X(this.mset), T); g.lineTo(X(this.mset), T + ph); g.stroke(); g.setLineDash([]);
    g.fillStyle = C.text; g.font = '11px Segoe UI, sans-serif'; g.textAlign = 'left';
    g.fillText(`${MUESTRAS[this.muestra].nombre} · barrido ${this.scans + 1}`, L + 6, T + 2);
  }

  drawStability() {
    const [g, w, h] = setupCanvas(this.els.stab);
    const L = 30, R = 8, T = 10, B = 24, pw = w - L - R, ph = h - T - B;
    const qMax = 1.0, aMax = 0.3;
    const X = (q) => L + (q / qMax) * pw, Y = (a) => T + ph - (a / aMax) * ph;
    const C = chartColors();
    g.font = '10px Segoe UI, sans-serif';
    g.strokeStyle = C.axis;
    g.beginPath(); g.moveTo(L, T); g.lineTo(L, T + ph); g.lineTo(L + pw, T + ph); g.stroke();
    g.fillStyle = C.text; g.textAlign = 'center';
    for (const q of [0, 0.2, 0.4, 0.6, 0.8, 1.0]) g.fillText(q.toFixed(1), X(q), T + ph + 12);
    g.fillText('q', L + pw - 4, T + ph + 22);
    g.textAlign = 'right';
    for (const a of [0, 0.1, 0.2, 0.3]) g.fillText(a.toFixed(1), L - 4, Y(a) + 3);
    g.save(); g.translate(10, T + ph / 2); g.rotate(-Math.PI / 2); g.textAlign = 'center'; g.fillText('a', 0, 0); g.restore();
    // región de estabilidad
    g.beginPath(); g.moveTo(X(0), Y(0));
    for (let q = 0; q <= APEX_Q; q += 0.01) g.lineTo(X(q), Y(fBeta0(q)));
    for (let q = APEX_Q; q <= 0.908; q += 0.005) g.lineTo(X(q), Y(Math.max(0, fBeta1(q))));
    g.lineTo(X(0.908), Y(0)); g.closePath();
    g.fillStyle = C.region; g.fill(); g.strokeStyle = C.regionLine; g.stroke();
    // línea de barrido (U/V constante)
    const k = APEX_A / APEX_Q * 0.985;
    g.strokeStyle = C.axis; g.setLineDash([5, 4]);
    g.beginPath(); g.moveTo(X(0), Y(0)); g.lineTo(X(qMax), Y(k * qMax)); g.stroke(); g.setLineDash([]);
    g.fillStyle = C.text; g.textAlign = 'left';
    g.fillText('línea de barrido  a/q = 2U/V', X(0.05), Y(0.27));
    // iones de la muestra sobre la línea: q = q_apex · m_sel / m
    for (const [m, ab] of MUESTRAS[this.muestra].picos) {
      if (ab < 2) continue;
      const q = APEX_Q * this.mset / m; if (q > qMax) continue;
      const ok = Math.abs(m - this.mset) <= 0.5;
      g.beginPath(); g.arc(X(q), Y(k * q), ok ? 5 : 3, 0, Math.PI * 2);
      g.fillStyle = ok ? C.line : C.bad; g.fill();
      if (ok || ab >= 25) { g.fillStyle = ok ? C.peak : C.text; g.fillText(m, X(q) + 5, Y(k * q) - 5); }
    }
  }
}

/** Definición del panel de simulación que construye el visor. */
export const PANEL = {
  titulo: 'Simulación del barrido del cuadrupolo',
  controles: [
    { id: 'muestra', label: 'Muestra', value: 'pftba', opciones: [['pftba', 'PFTBA (calibrante)'], ['tolueno', 'Tolueno'], ['cafeina', 'Cafeína']] },
    { id: 'modo', label: 'Modo de adquisición', value: 'scan', opciones: [['scan', 'Barrido (scan)'], ['sim', 'SIM']] },
    { id: 'ion', label: 'Ion SIM (m/z)', dinamico: true, visible: (v) => v.modo === 'sim' },
    { id: 'velocidad', label: 'Velocidad', value: '1', opciones: [['0.5', 'Lenta'], ['1', 'Normal'], ['2.5', 'Rápida']] },
  ],
  lecturas: [['mz', 'm/z'], ['vrf', 'V<sub>RF</sub> 0-p*'], ['udc', 'U<sub>DC</sub>*'], ['det', 'Cuentas']],
  nota: '* Valores ilustrativos para r₀ ≈ 4 mm y f ≈ 1 MHz, con U/V = 0,168. Escala de tiempo muy ralentizada (varios órdenes de magnitud).',
  leyenda: [['#f08c00', 'ion estable'], ['#e03150', 'ion inestable'], ['#2fa9d9', 'electrones']],
  graficas: ['Espectro de masas', 'Diagrama de estabilidad de Mathieu'],
};