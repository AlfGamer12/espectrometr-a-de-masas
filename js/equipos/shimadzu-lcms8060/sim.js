// Simulación didáctica de un triple cuadrupolo: ESI → línea de desolvatación → guías Qarray → Q1 → celda de colisión → Q3 → detector.
// Modos: MRM, barrido de iones producto y barrido Q1. Escala temporal ralentizada para que las trayectorias sean visibles.
import * as THREE from 'three';
import { AX } from './geometria.js';
import { PointPool, chartColors, setupCanvas, axes, COL } from '../../simcore.js';

// Compuestos de ejemplo con transiciones MRM habituales en ESI(+). m/z de [M+H]⁺ y fragmentos (valores nominales de referencia).
// "frag": [m/z, abundancia relativa a CE media, sensibilidad a la CE (energía óptima en V)]
export const COMPUESTOS = {
  cafeina:   { nombre: 'Cafeína', mz: 195.1, tr: 14, frag: [[138.1, 100, 22], [110.1, 35, 30], [83.1, 12, 38], [42.1, 8, 45]] },
  verapamilo:{ nombre: 'Verapamilo', mz: 455.3, tr: 30, frag: [[165.1, 100, 30], [303.2, 55, 24], [150.1, 20, 40]] },
  reserpina: { nombre: 'Reserpina', mz: 609.3, tr: 44, frag: [[195.1, 100, 40], [397.2, 60, 32], [448.2, 25, 28], [174.1, 15, 50]] },
};
const ORDEN = ['cafeina', 'verapamilo', 'reserpina'];
const TRANS_COL = ['#1d63c9', '#d9773e', '#3a9a6a'];
const CICLO = 60;   // s simulados por "inyección" (cromatograma en bucle)
const ANCHO = 2.2;  // anchura de pico cromatográfico (s, sigma)

function cePerfil(ce, opt) { return Math.exp(-((ce - opt) ** 2) / (2 * 9 ** 2)); }

export class Simulacion {
  constructor(eq, els) {
    this.refs = eq.analyzer;
    this.els = { c1: els.canvases[0], c2: els.canvases[1], ...els.read };
    const A = this.refs.group;
    this.ionPool = new PointPool(A, 2600, 0.22);
    this.gasPool = new PointPool(A, 400, 0.12);
    this.fPool = new PointPool(A, 200, 0.6);
    this.ions = []; this.flashes = []; this.gas = [];
    for (let i = 0; i < 160; i++) this.gas.push({ x: AX.Q2_0 + Math.random() * (AX.Q2_1 - AX.Q2_0), a: Math.random() * 6.28, r: Math.random() * AX.R0 * 1.4, w: (Math.random() - 0.5) * 6 });
    this.modo = 'mrm'; this.compuesto = 'reserpina'; this.ce = 35; this.velocidad = 1;
    this.t = 0; this.cuentas = 0;
    this.trazas = ORDEN.map(() => []);
    this.resetScan();
    this.setVisible(false);
  }
  setVisible(v) { this.ionPool.visible = v; this.gasPool.visible = v; this.fPool.visible = v; }
  setTheme(light) { for (const p of [this.ionPool, this.gasPool, this.fPool]) p.setTheme(light); }
  start() { this.active = true; this.setVisible(true); this.resetScan(); this.t = 0; this.trazas = ORDEN.map(() => []); }
  stop() { this.active = false; this.setVisible(false); this.ions.length = 0; this.flashes.length = 0; if (this.refs.spray) this.refs.spray.material.opacity = 0; }

  setControl(id, v) {
    if (id === 'modo') { this.modo = v; this.resetScan(); }
    else if (id === 'compuesto') { this.compuesto = v; this.resetScan(); }
    else if (id === 'ce') this.ce = +v;
    else if (id === 'velocidad') this.velocidad = +v;
  }
  options() { return null; }
  value() { return null; }

  /** Transición mayoritaria de cada compuesto (cuantificador). */
  trans(k) { const c = COMPUESTOS[k]; return [c.mz, c.frag[0][0]]; }

  resetScan() {
    this.lo = 50; this.hi = 650; this.step = 0.25;
    if (this.modo === 'producto') { this.lo = 40; this.hi = COMPUESTOS[this.compuesto].mz + 20; }
    this.mset = this.lo;
    this.perfil = new Float32Array(Math.ceil((this.hi - this.lo) / this.step) + 1).fill(-1);
    this.barridos = 0;
  }

  /** Concentración de cada compuesto en la fuente según el tiempo de retención (bucle de inyección). */
  elucion(k, t = this.t) {
    const c = COMPUESTOS[k], tt = t % CICLO;
    return Math.exp(-((tt - c.tr) ** 2) / (2 * ANCHO ** 2)) + 0.004;
  }
  /** Abundancia relativa de un fragmento a la CE actual. */
  fragAb(k, mz) {
    const f = COMPUESTOS[k].frag.find((x) => Math.abs(x[0] - mz) < 0.3);
    return f ? f[1] * cePerfil(this.ce, f[2]) : 0;
  }
  supervivencia(k) { // fracción de precursor sin fragmentar
    return Math.max(0.03, 1 - this.ce / 45);
  }

  /** Ajustes de Q1 / Q3 según el modo. null = solo RF (transmite todo). */
  filtros() {
    const c = COMPUESTOS[this.compuesto];
    if (this.modo === 'mrm') {
      // ciclo de transiciones: cada una ~ 0,4 s simulados (tiempo de permanencia ilustrativo)
      const i = Math.floor(this.t / 0.4) % ORDEN.length;
      this.dwell = i;
      const [p, q] = this.trans(ORDEN[i]);
      return { q1: p, q3: q, cid: true };
    }
    if (this.modo === 'producto') return { q1: c.mz, q3: this.mset, cid: true };
    return { q1: this.mset, q3: null, cid: false }; // barrido Q1
  }

  emit() {
    // composición del haz iónico: los tres compuestos según su elución + iones de fondo del disolvente
    const r = Math.random();
    let k = null, s = 0;
    const w = ORDEN.map((kk) => this.elucion(kk) * (kk === 'reserpina' ? 0.9 : 1));
    const tot = w.reduce((a, b) => a + b, 0) + 0.35;
    let acc = 0;
    for (let i = 0; i < ORDEN.length; i++) { acc += w[i] / tot; if (r < acc) { k = ORDEN[i]; break; } }
    const m = k ? COMPUESTOS[k].mz : 60 + Math.random() * 500;
    const p0 = AX.SPRAY.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 0.4));
    this.ions.push({ k, m, ph: 0, t: 0, p0, pos: p0.clone() });
  }

  update(dt) {
    if (!this.active) return;
    dt = Math.min(dt, 0.05) * this.velocidad;
    this.t += dt;
    if (this.refs.spray) this.refs.spray.material.opacity = 0.35 + 0.12 * Math.sin(this.t * 40);

    // barridos
    if (this.modo !== 'mrm') {
      const prev = this.mset;
      this.mset += 120 * dt;
      if (this.mset > this.hi) { this.mset = this.lo; this.perfil.fill(-1); this.barridos++; }
      const i0 = Math.max(0, Math.floor((prev - this.lo) / this.step)), i1 = Math.floor((this.mset - this.lo) / this.step);
      for (let i = i0; i <= i1 && i < this.perfil.length; i++) this.perfil[i] = this.señalBarrido(this.lo + i * this.step);
    }
    // trazas MRM (una por transición, muestreo cada ~0,1 s)
    this.acT = (this.acT || 0) + dt;
    if (this.acT > 0.1) {
      this.acT = 0;
      ORDEN.forEach((k, i) => {
        const [, q] = this.trans(k);
        const v = this.elucion(k) * this.fragAb(k, q) * (1 + (Math.random() - 0.5) * 0.06);
        this.trazas[i].push(v); if (this.trazas[i].length > 300) this.trazas[i].shift();
      });
    }

    const F = this.filtros();
    this.acc = (this.acc || 0) + dt * 700;
    while (this.acc >= 1) { this.emit(); this.acc -= 1; }

    const v = 34; // cm/s (velocidad visual en el eje)
    for (const ion of this.ions) {
      ion.t += dt;
      if (ion.ph === 0) { // gota → ion: de la punta de la sonda a la entrada de la DL
        const u = Math.min(1, ion.t / 0.35), e = u * u;
        ion.pos.lerpVectors(ion.p0, AX.DL_IN, e);
        ion.pos.y += Math.sin(u * Math.PI) * 0.4 * (ion.p0.z > AX.SPRAY.z ? 1 : -1) * 0.3;
        if (u >= 1) { ion.ph = 1; ion.x = AX.DL_IN.x; ion.y = 0; ion.z = 0; }
      } else if (ion.ph === 1) { // DL y guías Qarray: el haz converge al eje
        ion.x += v * dt * 1.4;
        const jitter = Math.max(0, 1 - (ion.x - AX.DL_IN.x) / (AX.Q1_0 - AX.DL_IN.x));
        ion.pos.set(ion.x, Math.sin(ion.t * 90 + ion.m) * 0.25 * jitter, Math.cos(ion.t * 77 + ion.m) * 0.25 * jitter);
        if (ion.x >= AX.Q1_0) {
          ion.ph = 2; ion.t = 0;
          ion.ok = F.q1 == null || Math.abs(ion.m - F.q1) <= 0.6;
          ion.g = 4 + Math.random() * 4; ion.ax = Math.random() < 0.5; ion.f = Math.random() * 6.28;
        }
      } else if (ion.ph === 2) { // Q1
        ion.x += v * dt;
        let a = 0.06 + 0.04 * Math.sin(ion.f);
        if (!ion.ok) a *= Math.exp(ion.g * ion.t);
        const s = Math.sin(ion.t * 26 + ion.f) * (1 + 0.15 * Math.sin(ion.t * 200));
        ion.pos.set(ion.x, ion.ax ? a * s : a * 0.5 * s, ion.ax ? a * 0.5 * s : a * s);
        if (!ion.ok && Math.hypot(ion.pos.y, ion.pos.z) > AX.R0) { ion.ph = 9; this.flash(ion.pos, 0.35); }
        else if (ion.x >= AX.Q1_1) { ion.ph = 3; ion.t = 0; }
      } else if (ion.ph === 3) { // celda de colisión (q2): fragmentación por CID
        ion.x += v * dt * 0.75;
        ion.pos.set(ion.x, Math.sin(ion.t * 30 + ion.f) * 0.07, Math.cos(ion.t * 23 + ion.f) * 0.07);
        if (F.cid && !ion.frag && ion.x > (AX.Q2_0 + AX.Q2_1) / 2 && ion.k) {
          ion.frag = true;
          if (Math.random() > this.supervivencia(ion.k)) {
            // elige un fragmento según la distribución a la CE actual
            const fr = COMPUESTOS[ion.k].frag.map(([m]) => [m, this.fragAb(ion.k, m)]);
            const tot = fr.reduce((s, f) => s + f[1], 0);
            let r = Math.random() * tot;
            for (const [m, a] of fr) { r -= a; if (r <= 0) { ion.m = m; break; } }
            ion.isFrag = true;
            this.flash(ion.pos, 0.25);
          }
        }
        if (ion.x >= AX.Q2_1) {
          ion.ph = 4; ion.t = 0;
          ion.ok = F.q3 == null || Math.abs(ion.m - F.q3) <= 0.6;
          ion.g = 4 + Math.random() * 4;
        }
      } else if (ion.ph === 4) { // Q3
        ion.x += v * dt;
        let a = 0.05 + 0.03 * Math.sin(ion.f);
        if (!ion.ok) a *= Math.exp(ion.g * ion.t);
        const s = Math.sin(ion.t * 26 + ion.f);
        ion.pos.set(ion.x, a * s, a * 0.6 * Math.cos(ion.t * 21 + ion.f));
        if (!ion.ok && Math.hypot(ion.pos.y, ion.pos.z) > AX.R0) { ion.ph = 9; this.flash(ion.pos, 0.35); }
        else if (ion.x >= AX.Q3_1) { ion.ph = 5; ion.t = 0; ion.e = ion.pos.clone(); }
      } else if (ion.ph === 5) { // hacia el dínodo de conversión (fuera de eje)
        const u = Math.min(1, ion.t / 0.18);
        ion.pos.lerpVectors(ion.e, AX.DYN, u * u);
        if (u >= 1) { ion.ph = 9; this.cuentas++; this.flash(AX.DYN, 0.9); this.flash(AX.EM, 0.6); }
      }
    }
    this.ions = this.ions.filter((i) => i.ph !== 9);
    for (const f of this.flashes) f.t += dt;
    this.flashes = this.flashes.filter((f) => f.t < 0.25);

    // dibujar
    this.ionPool.begin();
    for (const i of this.ions) {
      const c = i.ph === 0 ? COL.gota : i.isFrag ? COL.frag : (i.ph >= 2 && i.ok === false ? COL.bad : COL.ok);
      this.ionPool.push(i.pos, c, 1);
    }
    this.ionPool.end();
    this.gasPool.begin();
    if (F.cid) for (const g of this.gas) {
      g.a += g.w * dt; const r = g.r;
      this.gasPool.push({ x: g.x + Math.sin(g.a * 0.7) * 0.2, y: Math.cos(g.a) * r, z: Math.sin(g.a) * r }, COL.gas, 0.8);
    }
    this.gasPool.end();
    this.fPool.begin();
    for (const f of this.flashes) this.fPool.push(f.p, COL.flash, f.k * (1 - f.t / 0.25));
    this.fPool.end();
    this.drawUI(F);
  }
  flash(p, k) { if (this.flashes.length < 180) this.flashes.push({ p: p.clone ? p.clone() : p, t: 0, k }); }

  señalBarrido(m) {
    let s = Math.random() * 0.5;
    const g = (d) => Math.exp(-(d * d) / (2 * 0.22 * 0.22));
    if (this.modo === 'q1') {
      for (const k of ORDEN) { const c = COMPUESTOS[k]; const d = m - c.mz; if (Math.abs(d) < 2) s += 100 * this.elucion(k) * g(d); }
      for (const [bm, ba] of [[59.0, 6], [102.1, 4], [149.0, 5], [279.2, 3], [391.3, 6]]) { const d = m - bm; if (Math.abs(d) < 2) s += ba * g(d); }
    } else {
      const k = this.compuesto, c = COMPUESTOS[k];
      for (const [fm] of c.frag) { const d = m - fm; if (Math.abs(d) < 2) s += this.fragAb(k, fm) * g(d); }
      const d = m - c.mz; if (Math.abs(d) < 2) s += 100 * this.supervivencia(k) * g(d);
    }
    return s;
  }

  /* -------------------- PANELES 2D -------------------- */
  drawUI(F) {
    this.frame = (this.frame || 0) + 1;
    if (this.frame % 2) return;
    if (this.modo === 'mrm') this.drawMRM(); else this.drawScan();
    this.drawProducto();
    const e = this.els;
    e.q1.textContent = F.q1 == null ? 'RF' : F.q1.toFixed(1);
    e.q3.textContent = F.q3 == null ? 'RF' : F.q3.toFixed(1);
    e.ce.textContent = F.cid ? this.ce + ' V' : '—';
    e.det.textContent = this.cuentas.toLocaleString('es-ES');
  }

  drawMRM() {
    const [g, w, h] = setupCanvas(this.els.c1);
    const C = chartColors();
    const L = 38, R = 10, T = 16, B = 24, pw = w - L - R, ph = h - T - B;
    axes(g, C, L, T, pw, ph);
    const max = 100;
    ORDEN.forEach((k, i) => {
      const tr = this.trazas[i];
      g.strokeStyle = TRANS_COL[i]; g.lineWidth = 1.5; g.beginPath();
      tr.forEach((v, j) => { const x = L + (j / 300) * pw, y = T + ph - Math.min(1, v / max) * ph; j ? g.lineTo(x, y) : g.moveTo(x, y); });
      g.stroke();
    });
    g.lineWidth = 1;
    g.font = '11px Segoe UI, sans-serif'; g.textAlign = 'left';
    let x = L + 6;
    ORDEN.forEach((k, i) => {
      const [p, q] = this.trans(k);
      const txt = `${COMPUESTOS[k].nombre} ${p.toFixed(1)}>${q.toFixed(1)}`;
      g.fillStyle = TRANS_COL[i]; g.fillRect(x, T - 9, 8, 3);
      g.fillStyle = i === this.dwell ? C.peak : C.text; g.fillText(txt, x + 11, T - 4);
      x += g.measureText(txt).width + 26;
    });
    g.fillStyle = C.text; g.textAlign = 'center'; g.fillText('tiempo de retención →', L + pw / 2, T + ph + 17);
  }

  drawScan() {
    const [g, w, h] = setupCanvas(this.els.c1);
    const C = chartColors();
    const L = 38, R = 10, T = 16, B = 26, pw = w - L - R, ph = h - T - B;
    axes(g, C, L, T, pw, ph);
    const X = (m) => L + ((m - this.lo) / (this.hi - this.lo)) * pw;
    g.textAlign = 'center'; g.fillStyle = C.text;
    const tick = this.hi - this.lo > 300 ? 100 : 50;
    for (let m = Math.ceil(this.lo / tick) * tick; m <= this.hi; m += tick) g.fillText(m, X(m), T + ph + 14);
    g.fillText('m/z', L + pw - 8, T + ph + 24);
    const mx = Math.max(10, ...Array.from(this.perfil).filter((v) => v > 0)) * 1.05;
    g.beginPath(); let started = false, lastX = L;
    for (let i = 0; i < this.perfil.length; i++) {
      const v = this.perfil[i]; if (v < 0) continue;
      const x = X(this.lo + i * this.step), y = T + ph - Math.min(1, v / mx) * ph;
      if (!started) { g.moveTo(x, T + ph); started = true; } g.lineTo(x, y); lastX = x;
    }
    if (started) {
      g.lineTo(lastX, T + ph); g.closePath();
      const grd = g.createLinearGradient(0, T, 0, T + ph); grd.addColorStop(0, C.fill0); grd.addColorStop(1, C.fill1);
      g.fillStyle = grd; g.fill(); g.strokeStyle = C.line; g.lineWidth = 1.3; g.stroke(); g.lineWidth = 1;
    }
    g.strokeStyle = C.cursor; g.setLineDash([4, 3]);
    g.beginPath(); g.moveTo(X(this.mset), T); g.lineTo(X(this.mset), T + ph); g.stroke(); g.setLineDash([]);
    g.fillStyle = C.text; g.textAlign = 'left';
    g.fillText(this.modo === 'q1' ? `Barrido Q1 · iones precursores · barrido ${this.barridos + 1}`
      : `Iones producto de ${COMPUESTOS[this.compuesto].nombre} (m/z ${COMPUESTOS[this.compuesto].mz}) · CE ${this.ce} V`, L + 6, T - 4);
  }

  /** Espectro de iones producto del compuesto seleccionado a la CE actual, con la ventana de Q3. */
  drawProducto() {
    const [g, w, h] = setupCanvas(this.els.c2);
    const C = chartColors();
    const k = this.modo === 'mrm' ? ORDEN[this.dwell || 0] : this.compuesto, c = COMPUESTOS[k];
    const L = 30, R = 8, T = 16, B = 24, pw = w - L - R, ph = h - T - B;
    axes(g, C, L, T, pw, ph, false);
    const lo = 30, hi = c.mz + 30;
    const X = (m) => L + ((m - lo) / (hi - lo)) * pw;
    const bars = [...c.frag.map(([m]) => [m, this.fragAb(k, m), false]), [c.mz, 100 * this.supervivencia(k), true]];
    const mx = Math.max(...bars.map((b) => b[1]), 1);
    const q3 = this.modo === 'mrm' ? this.trans(k)[1] : this.modo === 'producto' ? this.mset : null;
    for (const [m, a, prec] of bars) {
      const x = X(m), y = T + ph - (a / mx) * ph;
      const sel = q3 != null && Math.abs(m - q3) < 0.6;
      g.fillStyle = prec ? C.axis : sel ? C.cursor : C.line;
      g.fillRect(x - 2, y, 4, T + ph - y);
      g.fillStyle = sel ? C.cursor : C.text; g.font = '10px Segoe UI, sans-serif'; g.textAlign = 'center';
      if (a / mx > 0.05) g.fillText(m.toFixed(1), x, y - 4);
    }
    g.fillStyle = C.text; g.textAlign = 'left'; g.font = '10px Segoe UI, sans-serif';
    g.fillText(`${c.nombre} [M+H]⁺ ${c.mz} · CE ${this.ce} V`, L + 4, T - 5);
    g.textAlign = 'center'; g.fillText('m/z', L + pw - 8, T + ph + 16);
  }
}

export const PANEL = {
  titulo: 'Simulación del triple cuadrupolo',
  controles: [
    { id: 'modo', label: 'Modo de adquisición', value: 'mrm', opciones: [['mrm', 'MRM'], ['producto', 'Barrido de iones producto'], ['q1', 'Barrido Q1']] },
    { id: 'compuesto', label: 'Precursor', value: 'reserpina', opciones: ORDEN.map((k) => [k, `${COMPUESTOS[k].nombre} (${COMPUESTOS[k].mz})`]), visible: (v) => v.modo === 'producto' },
    { id: 'ce', label: 'Energía de colisión', value: '35', opciones: [['10', '10 V'], ['20', '20 V'], ['35', '35 V'], ['50', '50 V']] },
    { id: 'velocidad', label: 'Velocidad', value: '1', opciones: [['0.5', 'Lenta'], ['1', 'Normal'], ['2', 'Rápida']] },
  ],
  lecturas: [['q1', 'Q1 (m/z)'], ['q3', 'Q3 (m/z)'], ['ce', 'CE'], ['det', 'Cuentas']],
  nota: 'Transiciones ESI(+) de referencia. Abundancias y tiempos de retención ilustrativos. Escala de tiempo ralentizada.',
  leyenda: [['#8fd3ff', 'gotas / iones de la fuente'], ['#f08c00', 'ion transmitido'], ['#7be495', 'fragmento'], ['#e03150', 'ion rechazado'], ['#9fb3c8', 'argón (CID)']],
  graficas: ['Cromatograma MRM / espectro', 'Espectro de iones producto'],
};
