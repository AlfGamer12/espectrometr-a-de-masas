// Simulación didáctica de un FT-ICR: acumulación, transferencia a la celda, excitación (chirp), detección de la corriente imagen
// (transitorio) y transformada de Fourier. La resolución depende de la duración del transitorio: R ≈ 1,274·10⁷·z·B·T/m (modo magnitud, 1ω).
import * as THREE from 'three';
import { AX, FIS } from './geometria.js';
import { PointPool, chartColors, setupCanvas, axes, COL } from '../../simcore.js';

// Isotopólogos [m/z, abundancia relativa, etiqueta] (masas calculadas con masas atómicas IUPAC)
export const MUESTRAS = {
  spA1: {
    nombre: 'Sustancia P [M+H]⁺ · pico A+1', z: 1, ventana: [1348.728, 1348.746],
    iso: [[1348.73246, 6.6, '¹⁵N'], [1348.73481, 0.76, '³³S'], [1348.73878, 68.1, '¹³C'], [1348.73964, 0.49, '¹⁷O'], [1348.74170, 1.1, '²H']],
  },
  spA2: {
    nombre: 'Sustancia P [M+H]⁺ · pico A+2', z: 1, ventana: [1349.726, 1349.746],
    iso: [[1349.73122, 4.4, '³⁴S'], [1349.73967, 2.7, '¹⁸O'], [1349.74213, 22.9, '¹³C₂']],
  },
  met: {
    nombre: 'Metionina [M+H]⁺ · pico A+2', z: 1, ventana: [152.050, 152.070],
    iso: [[152.05412, 4.4, '³⁴S'], [152.06257, 0.41, '¹⁸O'], [152.06504, 0.12, '¹³C₂']],
  },
};
/** Frecuencia ciclotrónica (Hz): f = zeB/(2πm) ≈ 1,535611·10⁷·B/(m/z). */
export const freq = (mz, B = FIS.B) => (1.535611e7 * B) / mz;

export class Simulacion {
  constructor(eq, els) {
    this.refs = eq.analyzer;
    this.els = { c1: els.canvases[0], c2: els.canvases[1], ...els.read };
    const A = this.refs.group;
    this.ionPool = new PointPool(A, 2400, 0.3);
    this.fPool = new PointPool(A, 120, 1.0);
    this.ions = []; this.flashes = [];
    this.muestra = 'spA1'; this.T = 4; this.det = 2; this.abs = true; this.velocidad = 1;
    this.reset();
    this.setVisible(false);
  }
  setVisible(v) { this.ionPool.visible = v; this.fPool.visible = v; }
  setTheme(light) { this.ionPool.setTheme(light); this.fPool.setTheme(light); }
  start() { this.active = true; this.setVisible(true); this.reset(); }
  stop() { this.active = false; this.setVisible(false); this.ions.length = 0; this.flashes.length = 0; }
  setControl(id, v) {
    if (id === 'muestra') this.muestra = v;
    else if (id === 'T') this.T = +v; else if (id === 'det') this.det = +v; else if (id === 'proc') this.abs = v === 'abs';
    else if (id === 'velocidad') this.velocidad = +v;
    this.reset();
  }
  options() { return null; }
  value() { return null; }
  /** Poder de resolución FWHM para la duración de transitorio y el modo de detección/procesado elegidos. */
  R(mz) { return 1.274e7 * MUESTRAS[this.muestra].z * FIS.B * this.T / mz * this.det * (this.abs ? 2 : 1); }

  reset() { this.fase = 0; this.tf = 0; this.ciclos = 0; this.ions.length = 0; this.mostrado = false; }

  update(dt) {
    if (!this.active) return;
    dt = Math.min(dt, 0.05) * this.velocidad;
    this.tf += dt;
    // fases: 0 acumulación · 1 transferencia · 2 excitación · 3 detección · 4 expulsión
    const DUR = [1.2, 0.8, 0.5, 3.0, 0.4];
    if (this.tf > DUR[this.fase]) {
      this.tf = 0; this.fase = (this.fase + 1) % 5;
      if (this.fase === 3) this.mostrado = true;
      if (this.fase === 0) { this.ciclos++; this.ions.length = 0; }
      if (this.fase === 4) for (const i of this.ions) this.flash(i.pos, 0.3);
    }
    const u = this.tf / DUR[this.fase];
    // generar iones durante la acumulación
    if (this.fase === 0) {
      this.acc = (this.acc || 0) + dt * 220;
      while (this.acc >= 1 && this.ions.length < 1600) {
        const I = MUESTRAS[this.muestra].iso; const tot = I.reduce((s, x) => s + x[1], 0);
        let r = Math.random() * tot, k = 0; for (let j = 0; j < I.length; j++) { r -= I[j][1]; if (r <= 0) { k = j; break; } }
        this.ions.push({ k, t: 0, ph: Math.random() * 6.28, pos: AX.SPRAY.clone(), x: AX.SPRAY.x, rr: Math.random() });
        this.acc -= 1;
      }
    }
    const cx = (AX.CELL_0 + AX.CELL_1) / 2;
    for (const ion of this.ions) {
      ion.t += dt;
      if (this.fase === 0) {           // de la fuente a la celda de colisión, donde se acumulan
        ion.x = Math.min(AX.C_0 + 1 + ion.rr * 7, ion.x + 45 * dt);
        const conv = ion.x < AX.F1_1 ? 0.6 : 0.15;
        ion.pos.set(ion.x, Math.sin(ion.t * 40 + ion.ph) * conv, Math.cos(ion.t * 33 + ion.ph) * conv);
      } else if (this.fase === 1) {    // pulso hacia la celda ICR por la óptica de transferencia
        const x0 = AX.C_0 + 1 + ion.rr * 7, x1 = AX.CELL_0 + 2 + ion.rr * 11;
        ion.x = x0 + (x1 - x0) * Math.min(1, u * (1.1 + ion.k * 0.02));
        ion.pos.set(ion.x, Math.sin(ion.t * 30 + ion.ph) * 0.12, Math.cos(ion.t * 26 + ion.ph) * 0.12);
      } else {                          // atrapado en la celda: movimiento ciclotrónico
        const f = freq(MUESTRAS[this.muestra].iso[ion.k][0]);
        const w = 6 + (f - freq(MUESTRAS[this.muestra].iso[0][0])) * 0.02; // frecuencia visual (diferencias exageradas)
        let rad = 0.25 * ion.rr;
        if (this.fase === 2) rad = 0.25 + u * 1.6;                     // excitación por barrido de RF
        if (this.fase === 3) rad = 1.85 * Math.exp(-this.tf * 0.08);
        if (this.fase === 4) rad = 1.85 + u * 2;
        const ph = this.fase >= 2 ? w * this.tf * 6.28 * 0.25 + ion.rr * 0.25 : ion.ph + ion.t * 8;
        ion.pos.set(AX.CELL_0 + 2 + ion.rr * 11 + Math.sin(ion.t * 3 + ion.ph) * 0.5, Math.cos(ph) * rad, Math.sin(ph) * rad);
      }
    }
    for (const f of this.flashes) f.t += dt;
    this.flashes = this.flashes.filter((f) => f.t < 0.3);

    this.ionPool.begin();
    const cols = [COL.ok, COL.frag, COL.e, COL.nuevo, COL.bad];
    for (const i of this.ions) this.ionPool.push(i.pos, this.fase >= 2 ? cols[i.k % cols.length] : COL.gota, 1);
    this.ionPool.end();
    this.fPool.begin();
    for (const f of this.flashes) this.fPool.push(f.p, COL.flash, f.k * (1 - f.t / 0.3));
    this.fPool.end();
    if (this.refs.exc) { const m = this.refs.exc.material; m.emissive.setHex(0x4a8cff); m.emissiveIntensity = this.fase === 2 ? 1.2 : this.fase === 3 ? 0.35 : 0; }
    this.drawUI();
  }
  flash(p, k) { if (this.flashes.length < 110) this.flashes.push({ p: p.clone(), t: 0, k }); }

  /* -------------------- PANELES 2D -------------------- */
  drawUI() {
    this.frame = (this.frame || 0) + 1;
    if (this.frame % 3) return;
    this.drawTransitorio(); this.drawEspectro();
    const S = MUESTRAS[this.muestra], m0 = S.iso[0][0];
    const e = this.els;
    e.f.textContent = (freq(m0) / 1000).toFixed(3) + ' kHz';
    e.T.textContent = this.T.toFixed(1) + ' s';
    e.R.textContent = Math.round(this.R(m0)).toLocaleString('es-ES');
    e.fase.textContent = ['Acumulación', 'Transferencia', 'Excitación', 'Detección', 'Expulsión'][this.fase];
  }
  /** Corriente imagen: suma de cosenos amortiguados. Se dibuja la envolvente de batido entre isotopólogos y una portadora reducida. */
  drawTransitorio() {
    const [g, w, h] = setupCanvas(this.els.c1);
    const C = chartColors();
    const L = 38, R = 10, T = 16, B = 24, pw = w - L - R, ph = h - T - B;
    axes(g, C, L, T, pw, ph, false);
    const yc = T + ph / 2;
    g.strokeStyle = C.grid; g.beginPath(); g.moveTo(L, yc); g.lineTo(L + pw, yc); g.stroke();
    const S = MUESTRAS[this.muestra], f0 = freq(S.iso[0][0]);
    const visto = this.fase === 3 ? Math.min(1, this.tf / 3) : this.mostrado ? 1 : 0;
    const N = Math.floor(pw * visto);
    const tot = S.iso.reduce((s, x) => s + x[1], 0);
    g.strokeStyle = C.line; g.lineWidth = 1; g.beginPath();
    for (let i = 0; i <= N; i++) {
      const t = (i / pw) * this.T;
      let re = 0, im = 0;
      for (const [mz, a] of S.iso) { const df = freq(mz) - f0; re += a * Math.cos(2 * Math.PI * df * t); im += a * Math.sin(2 * Math.PI * df * t); }
      const env = Math.exp(-t / (this.T * 0.8));
      const v = (re * Math.cos(i * 0.9) - im * Math.sin(i * 0.9)) / tot * env;
      const y = yc - v * ph * 0.45;
      i ? g.lineTo(L + i, y) : g.moveTo(L + i, y);
    }
    g.stroke();
    g.fillStyle = C.text; g.font = '10px Segoe UI, sans-serif'; g.textAlign = 'center';
    for (let k = 0; k <= 4; k++) g.fillText((this.T * k / 4).toFixed(1), L + (pw * k) / 4, T + ph + 12);
    g.fillText('t (s)', L + pw - 8, T + ph + 22);
    g.textAlign = 'left'; g.font = '11px Segoe UI, sans-serif';
    g.fillText(`Transitorio · ${this.det === 2 ? '2ω' : '1ω'} · f(${S.iso[0][0].toFixed(3)}) = ${(f0 / 1000).toFixed(3)} kHz · batido entre isotopólogos`, L + 6, T - 4);
  }
  /** Espectro tras la transformada de Fourier: estructura isotópica fina en la ventana del pico. */
  drawEspectro() {
    const [g, w, h] = setupCanvas(this.els.c2);
    const C = chartColors();
    const S = MUESTRAS[this.muestra];
    const [lo, hi] = S.ventana;
    const L = 30, R = 8, T = 16, B = 24, pw = w - L - R, ph = h - T - B;
    axes(g, C, L, T, pw, ph, false);
    const X = (m) => L + ((m - lo) / (hi - lo)) * pw;
    if (!this.mostrado) { g.fillStyle = C.text; g.font = '11px Segoe UI, sans-serif'; g.fillText('Esperando el primer transitorio…', L + 8, T + ph / 2); return; }
    const Np = 400, vals = []; let mx = 1e-9;
    for (let i = 0; i <= Np; i++) {
      const m = lo + (i / Np) * (hi - lo); let s = 0;
      for (const [mz, a] of S.iso) { const hw = mz / this.R(mz) / 2; const d = (m - mz) / hw; s += a / (1 + d * d); }
      vals.push(s); mx = Math.max(mx, s);
    }
    g.beginPath(); vals.forEach((v, i) => { const x = L + (i / Np) * pw, y = T + ph - (v / mx) * ph * 0.9; i ? g.lineTo(x, y) : g.moveTo(x, y); });
    g.strokeStyle = C.line; g.lineWidth = 1.4; g.stroke(); g.lineWidth = 1;
    g.font = '10px Segoe UI, sans-serif'; g.textAlign = 'center';
    let li = 0;
    for (const [mz, a, lab] of S.iso) {
      const y = T + ph - Math.min(0.9, (a / mx) * 0.9) * ph;
      g.fillStyle = C.peak; g.fillText(lab, X(mz), Math.max(T + 9, y - 4 - (li++ % 2) * 10));
    }
    g.fillStyle = C.text;
    g.fillText(lo.toFixed(3), L + 14, T + ph + 12); g.fillText(hi.toFixed(3), L + pw - 14, T + ph + 12);
    g.textAlign = 'left';
    g.fillText(`${S.nombre} · R ≈ ${Math.round(this.R(S.iso[0][0])).toLocaleString('es-ES')}`, L + 4, T - 5);
  }
}

export const PANEL = {
  titulo: 'Simulación FT-ICR',
  controles: [
    { id: 'muestra', label: 'Ion / ventana', value: 'spA1', opciones: Object.entries(MUESTRAS).map(([k, m]) => [k, m.nombre]) },
    { id: 'T', label: 'Duración del transitorio', value: '4', opciones: [['0.5', '0,5 s (1M)'], ['2', '2 s (4M)'], ['4', '4 s (8M)'], ['12', '12 s (16M)']] },
    { id: 'det', label: 'Detección', value: '2', opciones: [['1', '1ω (dipolar)'], ['2', '2ω (ParaCell 2xR)']] },
    { id: 'proc', label: 'Procesado', value: 'abs', opciones: [['abs', 'Modo absorción'], ['mag', 'Modo magnitud']] },
    { id: 'velocidad', label: 'Velocidad', value: '1', opciones: [['0.5', 'Lenta'], ['1', 'Normal'], ['2', 'Rápida']] },
  ],
  lecturas: [['f', 'Frecuencia ciclotrónica'], ['R', 'Resolución (FWHM)'], ['T', 'Transitorio'], ['fase', 'Fase']],
  nota: 'f = zeB/2πm con B = 7 T. R ≈ 1,274·10⁷·z·B·T/m en modo magnitud y 1ω; 2ω y el modo absorción la duplican cada uno (aprox.). Masas de isotopólogos calculadas; abundancias aproximadas.',
  leyenda: [['#8fd3ff', 'acumulación y transferencia'], ['#f08c00', 'isotopólogos en órbita ciclotrónica']],
  graficas: ['Transitorio (corriente imagen)', 'Espectro · estructura isotópica fina'],
};
