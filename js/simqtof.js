// Simulación común de un Q-TOF (cuadrupolo + celda de colisión + TOF ortogonal con reflectrón).
// Cada equipo aporta su geometría (AX) y sus parámetros (P). Modos: MS (TOF), MS/MS automático (DDA) y All Ions (sin aislamiento).
import * as THREE from 'three';
import { PointPool, chartColors, setupCanvas, axes, COL } from './simcore.js';

// Mezcla de compuestos de ejemplo: [M+H]⁺ monoisotópicos (u) y fragmentos característicos.
export const MEZCLA = [
  { nombre: 'Cafeína', mz: 195.08765, ab: 80, frag: [[138.06619, 100], [110.07127, 25]] },
  { nombre: 'Carbamazepina', mz: 237.10224, ab: 65, frag: [[194.09643, 100], [192.08078, 15]] },
  { nombre: 'Verapamilo', mz: 455.29043, ab: 70, frag: [[165.09101, 100], [303.20671, 45]] },
  { nombre: 'Reserpina', mz: 609.28066, ab: 55, frag: [[195.06519, 100], [397.21218, 60], [448.19659, 20]] },
];
export const REF_POS = [121.050873, 922.009798];   // masas de referencia típicas (purina y HP-0921)

export function crearSimQTOF(AX, P) {
  return class SimQTOF {
    constructor(eq, els) {
      this.refs = eq.analyzer;
      this.els = { c1: els.canvases[0], c2: els.canvases[1], ...els.read };
      const A = this.refs.group;
      this.ionPool = new PointPool(A, 2600, 0.26);
      this.fPool = new PointPool(A, 200, 0.8);
      this.ions = []; this.flashes = [];
      this.modo = 'ms'; this.vel = 2; this.lock = true; this.velocidad = 1;
      this.reset(); this.setVisible(false);
    }
    setVisible(v) { this.ionPool.visible = v; this.fPool.visible = v; }
    setTheme(light) { this.ionPool.setTheme(light); this.fPool.setTheme(light); }
    start() { this.active = true; this.setVisible(true); this.reset(); }
    stop() { this.active = false; this.setVisible(false); this.ions.length = 0; this.flashes.length = 0; if (this.refs.spray) this.refs.spray.material.opacity = 0; }
    setControl(id, v) {
      if (id === 'modo') this.modo = v; else if (id === 'vel') this.vel = +v; else if (id === 'lock') this.lock = v === 'on';
      else if (id === 'velocidad') this.velocidad = +v;
      this.reset();
    }
    options() { return null; }
    value() { return null; }

    reset() {
      this.lo = P.lo || 100; this.hi = P.hi || 1000; this.nbin = 2400;
      this.suma = new Float32Array(this.nbin); this.espectros = 0; this.tEsp = 0; this.t = 0;
      this.deriva = (Math.random() - 0.5) * 2 * (P.deriva || 6);   // ppm de deriva sin corrección con masa de referencia
      this.prec = null; this.cicloMSMS = 0;
    }
    /** Error de masa (ppm) aplicado: con masa de referencia queda por debajo de la especificación. */
    ppm() { return this.lock ? (Math.random() - 0.5) * 2 * (P.ppm || 0.8) : this.deriva + (Math.random() - 0.5) * 1.5; }
    R(m) { return P.R(m); }
    /** Lista de iones presentes en el espectro según el modo. */
    iones() {
      const L = [];
      for (const r of (P.refs || REF_POS)) if (r >= this.lo && r <= this.hi) L.push([r, 18, 'ref']);
      if (this.modo === 'ms') for (const c of MEZCLA) { L.push([c.mz, c.ab, c.nombre]); L.push([c.mz + 1.00336, c.ab * c.mz / 1800, '']); }
      else if (this.modo === 'msms') {
        const c = this.prec || MEZCLA[0];
        L.push([c.mz, 12, c.nombre]); for (const [m, a] of c.frag) L.push([m, a * 0.9, '']);
      } else for (const c of MEZCLA) { L.push([c.mz, c.ab * 0.25, c.nombre]); for (const [m, a] of c.frag) L.push([m, a * c.ab / 110, '']); }
      return L;
    }
    addSpectrum() {
      const I = this.iones();
      const ruido = 3.5 / Math.sqrt(Math.max(1, P.pulsos / this.vel / 1000));    // más espectros/s → menos transitorios sumados → más ruido
      const out = new Float32Array(this.nbin);
      const db = (this.hi - this.lo) / this.nbin;
      const meas = [];
      for (const [m0, a] of I) {
        const m = m0 * (1 + this.ppm() * 1e-6);
        meas.push([m0, m, a]);
        const sg = m / this.R(m) / 2.355;
        const i0 = Math.max(0, Math.floor((m - 5 * sg - this.lo) / db)), i1 = Math.min(this.nbin - 1, Math.ceil((m + 5 * sg - this.lo) / db));
        for (let i = i0; i <= i1; i++) { const d = (this.lo + i * db - m) / Math.max(sg, db * 0.5); out[i] += a * Math.exp(-0.5 * d * d); }
      }
      for (let i = 0; i < this.nbin; i++) out[i] += Math.random() * ruido;
      this.ultimo = { out, I, meas, ruido };
      for (let i = 0; i < this.nbin; i++) this.suma[i] = this.suma[i] * 0.85 + out[i] * 0.15;
      this.espectros++;
    }

    update(dt) {
      if (!this.active) return;
      dt = Math.min(dt, 0.05) * this.velocidad;
      this.t += dt;
      if (this.refs.spray) this.refs.spray.material.opacity = 0.35 + 0.1 * Math.sin(this.t * 40);
      // un "espectro" cada cierto tiempo visual; en MS/MS se alterna el precursor (DDA)
      this.tEsp += dt;
      if (this.tEsp > 0.5) {
        this.tEsp = 0;
        if (this.modo === 'msms') { this.cicloMSMS = (this.cicloMSMS + 1) % MEZCLA.length; this.prec = MEZCLA[this.cicloMSMS]; }
        this.addSpectrum();
      }
      // iones visibles
      this.acc = (this.acc || 0) + dt * 260;
      while (this.acc >= 1) {
        const c = MEZCLA[(Math.random() * MEZCLA.length) | 0];
        this.ions.push({ c, t: 0, ph: 0, x: AX.SPRAY.x, f: Math.random() * 6.28, pos: AX.SPRAY.clone() });
        this.acc -= 1;
      }
      const v = 36;
      for (const ion of this.ions) {
        ion.t += dt;
        if (ion.ph === 0) {                     // spray → capilar
          const u = Math.min(1, ion.t / 0.3);
          ion.pos.lerpVectors(AX.SPRAY, new THREE.Vector3(AX.CAP0, 0, 0), u * u);
          if (u >= 1) { ion.ph = 1; ion.x = AX.CAP0; }
        } else if (ion.ph === 1) {              // capilar, óptica, cuadrupolo y celda
          ion.x += v * dt * (ion.x < AX.Q_0 ? 1.5 : 1);
          const conv = ion.x < AX.Q_0 ? 0.25 : 0.1;
          ion.pos.set(ion.x, Math.sin(ion.t * 40 + ion.f) * conv, Math.cos(ion.t * 33 + ion.f) * conv);
          if (ion.x > AX.Q_0 + 2 && ion.ok === undefined) ion.ok = this.modo !== 'msms' || ion.c === this.prec;
          if (ion.ok === false && ion.x > AX.Q_0 + 3) { const a = Math.exp((ion.x - AX.Q_0 - 3) * 0.45) * 0.1; ion.pos.y += a; if (a > 0.6) { ion.ph = 9; this.flash(ion.pos, 0.3); } }
          if (this.modo !== 'ms' && ion.x > (AX.C_0 + AX.C_1) / 2 && !ion.frag) { ion.frag = true; this.flash(ion.pos, 0.25); }
          if (ion.x >= AX.PUSH.x) { ion.ph = 2; ion.t = 0; ion.s = ion.pos.clone(); }
        } else if (ion.ph === 2) {              // TOF ortogonal en V: pulsador → espejo → detector
          const m = ion.frag ? ion.c.frag[0][0] : ion.c.mz;
          const tt = 0.6 * Math.sqrt(m / 500), u = Math.min(1, ion.t / tt);
          if (u < 0.5) ion.pos.lerpVectors(ion.s, AX.REFL, u * 2); else ion.pos.lerpVectors(AX.REFL, AX.DET, (u - 0.5) * 2);
          if (u >= 1) { ion.ph = 9; this.flash(AX.DET, 0.7); }
        }
      }
      this.ions = this.ions.filter((i) => i.ph !== 9);
      if (this.ions.length > 2400) this.ions.splice(0, this.ions.length - 2400);
      for (const f of this.flashes) f.t += dt;
      this.flashes = this.flashes.filter((f) => f.t < 0.25);
      this.ionPool.begin();
      for (const i of this.ions) this.ionPool.push(i.pos, i.ph === 0 ? COL.gota : i.frag ? COL.frag : i.ok === false ? COL.bad : COL.ok, 1);
      this.ionPool.end();
      this.fPool.begin();
      for (const f of this.flashes) this.fPool.push(f.p, COL.flash, f.k * (1 - f.t / 0.25));
      this.fPool.end();
      this.drawUI();
    }
    flash(p, k) { if (this.flashes.length < 180) this.flashes.push({ p: p.clone(), t: 0, k }); }

    /* -------------------- PANELES 2D -------------------- */
    drawUI() {
      this.frame = (this.frame || 0) + 1;
      if (this.frame % 3) return;
      this.drawSpectrum(); this.drawZoom();
      const e = this.els;
      e.modo.textContent = { ms: 'MS', msms: 'Auto MS/MS', allions: 'All Ions' }[this.modo];
      e.prec.textContent = this.modo === 'msms' && this.prec ? this.prec.mz.toFixed(4) : '—';
      e.err.textContent = this.ultimoErr != null ? (this.ultimoErr >= 0 ? '+' : '') + this.ultimoErr.toFixed(2) + ' ppm' : '–';
      e.n.textContent = this.espectros.toLocaleString('es-ES');
    }
    drawSpectrum() {
      const [g, w, h] = setupCanvas(this.els.c1);
      const C = chartColors();
      const L = 38, R = 10, T = 16, B = 26, pw = w - L - R, ph = h - T - B;
      axes(g, C, L, T, pw, ph);
      const X = (m) => L + ((m - this.lo) / (this.hi - this.lo)) * pw;
      g.textAlign = 'center'; g.fillStyle = C.text;
      for (let m = 200; m <= this.hi; m += 200) g.fillText(m, X(m), T + ph + 14);
      g.fillText('m/z', L + pw - 8, T + ph + 24);
      let mx = 5; for (const v of this.suma) if (v > mx) mx = v;
      g.beginPath(); g.moveTo(L, T + ph);
      for (let i = 0; i < this.nbin; i++) g.lineTo(L + (i / (this.nbin - 1)) * pw, T + ph - Math.min(1, this.suma[i] / mx) * ph);
      g.lineTo(L + pw, T + ph); g.strokeStyle = C.line; g.lineWidth = 1.1; g.stroke(); g.lineWidth = 1;
      if (this.ultimo) {
        g.font = '600 10px Segoe UI, sans-serif'; g.textAlign = 'center';
        // etiquetas ordenadas por m/z; si chocan con una ya colocada se bajan una línea
        const etq = this.ultimo.I.filter((p) => p[2]).map(([m, a, nom]) => {
          const txt = nom === 'ref' ? `ref ${m.toFixed(4)}` : m.toFixed(4);
          return { m, nom, txt, x: X(m), w: g.measureText(txt).width + 6, y: Math.max(T + 8, T + ph - Math.min(1, a / mx) * ph - 4) };
        }).sort((p, q) => p.x - q.x);
        const puestas = [];
        for (const e of etq) {
          for (let k = 0; k < 6 && puestas.some((p) => Math.abs(p.x - e.x) < (p.w + e.w) / 2 && Math.abs(p.y - e.y) < 11); k++) e.y += 11;
          puestas.push(e);
          g.fillStyle = e.nom === 'ref' ? C.cursor : C.peak;
          g.fillText(e.txt, e.x, e.y);
        }
      }
      g.fillStyle = C.text; g.textAlign = 'left'; g.font = '11px Segoe UI, sans-serif';
      const t = this.modo === 'msms' && this.prec ? `MS/MS de ${this.prec.nombre} (m/z ${this.prec.mz.toFixed(4)})` : this.modo === 'allions' ? 'All Ions: todos los iones fragmentados' : 'MS: espectro completo';
      g.fillText(`${t} · ${this.vel} espectros/s · ${this.lock ? 'con' : 'sin'} masa de referencia`, L + 6, T - 4);
    }
    /** Pico ampliado: perfil calculado con resolución fina a partir de la masa medida; error en ppm. */
    drawZoom() {
      const [g, w, h] = setupCanvas(this.els.c2);
      const C = chartColors();
      const L = 30, R = 8, T = 16, B = 24, pw = w - L - R, ph = h - T - B;
      axes(g, C, L, T, pw, ph, false);
      if (!this.ultimo) return;
      const m0 = this.modo === 'msms' && this.prec ? this.prec.frag[0][0] : MEZCLA[2].mz;
      const hit = this.ultimo.meas.reduce((b, x) => (Math.abs(x[0] - m0) < Math.abs(b[0] - m0) ? x : b), this.ultimo.meas[0]);
      const mc = hit[1], sg = m0 / this.R(m0) / 2.355, win = sg * 6, lo = m0 - win, hi = m0 + win;
      const X = (m) => L + ((m - lo) / (hi - lo)) * pw;
      this.ultimoErr = (mc - m0) / m0 * 1e6;
      const N = 240, nz = 0.015 * (this.ultimo.ruido / 3.5);
      g.beginPath();
      for (let i = 0; i <= N; i++) {
        const m = lo + (i / N) * (hi - lo), d = (m - mc) / sg;
        const v = Math.exp(-0.5 * d * d) + (Math.random() - 0.5) * nz;
        const x = X(m), y = T + ph - Math.max(0, v) * ph * 0.88;
        i ? g.lineTo(x, y) : g.moveTo(x, y);
      }
      g.strokeStyle = C.line; g.lineWidth = 1.5; g.stroke(); g.lineWidth = 1;
      g.strokeStyle = C.cursor; g.setLineDash([4, 3]); g.beginPath(); g.moveTo(X(m0), T); g.lineTo(X(m0), T + ph); g.stroke(); g.setLineDash([]);
      g.font = '10px Segoe UI, sans-serif'; g.fillStyle = C.text; g.textAlign = 'left';
      g.fillText(`Teórica ${m0.toFixed(5)} · medida ${mc.toFixed(5)} · ${(this.ultimoErr >= 0 ? '+' : '') + this.ultimoErr.toFixed(2)} ppm`, L + 4, T - 5);
      g.textAlign = 'center';
      g.fillText(`FWHM ${(m0 / this.R(m0) * 1000).toFixed(1)} mDa · R ≈ ${Math.round(this.R(m0)).toLocaleString('es-ES')}`, L + pw / 2, T + ph + 14);
    }  };
}

/** Panel de controles común (las etiquetas de modo siguen la nomenclatura de cada fabricante). */
export function panelQTOF(nombres) {
  return {
    titulo: 'Simulación del Q-TOF',
    controles: [
      { id: 'modo', label: 'Modo de adquisición', value: 'ms', opciones: [['ms', nombres.ms], ['msms', nombres.msms], ['allions', nombres.allions]] },
      { id: 'vel', label: 'Espectros por segundo', value: '2', opciones: [['2', '2 /s'], ['10', '10 /s'], ['30', '30 /s']] },
      { id: 'lock', label: 'Masa de referencia', value: 'on', opciones: [['on', 'Corrección activa'], ['off', 'Sin corrección']] },
      { id: 'velocidad', label: 'Velocidad', value: '1', opciones: [['0.5', 'Lenta'], ['1', 'Normal'], ['2', 'Rápida']] },
    ],
    lecturas: [['modo', 'Modo'], ['prec', 'Precursor (m/z)'], ['err', 'Error de masa'], ['n', 'Espectros']],
    nota: 'Masas exactas [M+H]⁺ de referencia. La resolución no depende de la velocidad de adquisición; al subirla se suman menos pulsos por espectro y aumenta el ruido. Sin masa de referencia aparece la deriva térmica del eje de masas.',
    leyenda: [['#8fd3ff', 'spray'], ['#f08c00', 'ion transmitido'], ['#7be495', 'fragmento'], ['#e03150', 'descartado por el cuadrupolo']],
    graficas: ['Espectro de masas exactas', 'Pico ampliado · error de masa'],
  };
}
