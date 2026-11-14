// Simulación de RMN de ¹H: pulso de RF, FID y transformada de Fourier.
// · El espectro se calcula exactamente: para cada sistema de espines acoplados se diagonaliza el hamiltoniano
//   H = Σ νᵢ Izᵢ + Σ Jᵢⱼ Iᵢ·Iⱼ (en Hz) por bloques de Mz y se obtienen frecuencias e intensidades de todas las transiciones
//   (|⟨b|F⁻|a⟩|²). A 400 MHz los multipletes siguen la regla n + 1; a 60 MHz aparecen los efectos de segundo orden (efecto tejado).
// · El FID es la suma de esas líneas como exponenciales complejas amortiguadas (detección en cuadratura), con T₂* = 1/(π·Δν½) fijado
//   por la calidad del shim. Cada transitorio añade ruido gaussiano; se promedian y se transforman con una FFT de radix 2.
// · Señal por transitorio ∝ sen θ (relajación completa entre pulsos) y ∝ B₀^{3/2}; ruido por punto ∝ √SW. Valores orientativos.
import * as THREE from 'three';
import { chartColors, setupCanvas } from '../../simcore.js';
import { MAG } from './geometria.js';

/* ---------------- muestras (CDCl₃, valores de bibliografía redondeados) ---------------- */
// grupos: [δ ppm, nº de H, etiqueta, multiplicidad a primer orden]; J: [grupo a, grupo b, Hz]
export const MUESTRAS = {
  acetato: {
    nombre: 'Acetato de etilo', formula: 'CH₃COOCH₂CH₃',
    sistemas: [
      { grupos: [[4.12, 2, 'OCH₂', 'q'], [1.26, 3, 'CH₂CH₃', 't']], J: [[0, 1, 7.1]] },
      { grupos: [[2.05, 3, 'CH₃CO', 's']], J: [] },
    ],
  },
  bromopropano: {
    nombre: '1-Bromopropano', formula: 'BrCH₂CH₂CH₃',
    sistemas: [{ grupos: [[3.40, 2, 'CH₂Br', 't'], [1.88, 2, 'CH₂', 'sext.'], [1.03, 3, 'CH₃', 't']], J: [[0, 1, 6.8], [1, 2, 7.3]] }],
  },
  tricloroetano: {
    nombre: '1,1,2-Tricloroetano', formula: 'Cl₂CH–CH₂Cl',
    sistemas: [{ grupos: [[5.77, 1, 'CHCl₂', 't'], [3.96, 2, 'CH₂Cl', 'd']], J: [[0, 1, 6.0]] }],
  },
};
const REFERENCIAS = [[0.0, 0.12, 'TMS'], [7.26, 0.05, 'CHCl₃']];       // TMS y CHCl₃ residual (amplitudes relativas)
const GAMMA_H = 42.577478;                                               // MHz/T
const CAMPOS = { 400: 400.13, 60: 60.0 };
const PPM_C = 3.75, SW_PPM = 10;                                         // portadora y anchura espectral
const VENTANA = [8.0, -0.5];                                             // ppm mostrados
const SN_REF = 25;                                                       // S/R de un singlete de 1 H (400 MHz, 90°, 1 transitorio, 0,3 Hz)

/* ---------------- álgebra ---------------- */
/** Autovalores y autovectores de una matriz simétrica (Jacobi cíclico). a: n×n (se modifica). Devuelve { w, V } (columnas). */
function jacobi(a) {
  const n = a.length, V = a.map((_, i) => a.map((__, j) => (i === j ? 1 : 0)));
  for (let sweep = 0; sweep < 60; sweep++) {
    let off = 0;
    for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) off += a[p][q] * a[p][q];
    if (off < 1e-18) break;
    for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) {
      if (Math.abs(a[p][q]) < 1e-14) continue;
      const th = (a[q][q] - a[p][p]) / (2 * a[p][q]);
      const t = Math.sign(th || 1) / (Math.abs(th) + Math.sqrt(th * th + 1)), c = 1 / Math.sqrt(t * t + 1), s = t * c;
      for (let k = 0; k < n; k++) { const akp = a[k][p], akq = a[k][q]; a[k][p] = c * akp - s * akq; a[k][q] = s * akp + c * akq; }
      for (let k = 0; k < n; k++) { const apk = a[p][k], aqk = a[q][k]; a[p][k] = c * apk - s * aqk; a[q][k] = s * apk + c * aqk; }
      for (let k = 0; k < n; k++) { const vkp = V[k][p], vkq = V[k][q]; V[k][p] = c * vkp - s * vkq; V[k][q] = s * vkp + c * vkq; }
    }
  }
  return { w: a.map((r, i) => r[i]), V };
}
const bits = (x) => { let c = 0; while (x) { c += x & 1; x >>= 1; } return c; };

/** Líneas [Hz respecto a 0 ppm, intensidad (1 = un protón), grupo] de un sistema de espines a la frecuencia SF (MHz). */
export function lineasSistema(sis, SF) {
  const nu = [], gr = [];
  sis.grupos.forEach(([d, n], g) => { for (let k = 0; k < n; k++) { nu.push(d * SF); gr.push(g); } });
  const n = nu.length;
  const J = nu.map(() => nu.map(() => 0));
  for (const [a, b, j] of sis.J) for (let p = 0; p < n; p++) for (let q = 0; q < n; q++) if (gr[p] === a && gr[q] === b) { J[p][q] = j; J[q][p] = j; }
  // bloques por número de espines α (bit = 1)
  const bloques = Array.from({ length: n + 1 }, () => []);
  for (let s = 0; s < 1 << n; s++) bloques[bits(s)].push(s);
  const eig = bloques.map((st) => {
    const idx = new Map(st.map((s, i) => [s, i]));
    const H = st.map(() => st.map(() => 0));
    st.forEach((s, i) => {
      let d = 0;
      for (let p = 0; p < n; p++) { const mp = (s >> p) & 1 ? 0.5 : -0.5; d += nu[p] * mp; for (let q = p + 1; q < n; q++) d += J[p][q] * mp * ((s >> q) & 1 ? 0.5 : -0.5); }
      H[i][i] = d;
      for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) {
        if (!J[p][q] || ((s >> p) & 1) === ((s >> q) & 1)) continue;
        const t = s ^ (1 << p) ^ (1 << q); H[i][idx.get(t)] += J[p][q] / 2;
      }
    });
    return { st, idx, ...jacobi(H) };
  });
  const out = [], norm = 2 ** (n - 1);
  for (let m = n; m >= 1; m--) {
    const A = eig[m], B = eig[m - 1];
    for (let i = 0; i < A.st.length; i++) {
      // w = F⁻ |a_i⟩ en la base del bloque inferior
      const w = new Float64Array(B.st.length);
      A.st.forEach((s, k) => { const c = A.V[k][i]; if (!c) return; for (let p = 0; p < n; p++) if ((s >> p) & 1) w[B.idx.get(s ^ (1 << p))] += c; });
      for (let j = 0; j < B.st.length; j++) {
        let amp = 0; for (let k = 0; k < B.st.length; k++) amp += B.V[k][j] * w[k];
        const I = (amp * amp) / norm;
        if (I < 1e-5) continue;
        const f = A.w[i] - B.w[j];
        // grupo al que se asigna la línea: el de desplazamiento más próximo
        let g = 0, best = Infinity; sis.grupos.forEach(([d], k) => { const e = Math.abs(d * SF - f); if (e < best) { best = e; g = k; } });
        out.push([f, I, g]);
      }
    }
  }
  // fusión de líneas degeneradas
  out.sort((a, b) => a[0] - b[0]);
  const m = [];
  for (const l of out) { const u = m[m.length - 1]; if (u && Math.abs(u[0] - l[0]) < 1e-3 && u[2] === l[2]) u[1] += l[1]; else m.push([...l]); }
  return m;
}

/** FFT compleja en el sitio (radix 2). */
function fft(re, im) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1; for (; j & bit; bit >>= 1) j ^= bit; j ^= bit;
    if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const a = (-2 * Math.PI) / len, wr = Math.cos(a), wi = Math.sin(a);
    for (let i = 0; i < n; i += len) {
      let cr = 1, ci = 0;
      for (let k = 0; k < len / 2; k++) {
        const p = i + k, q = p + len / 2, tr = re[q] * cr - im[q] * ci, ti = re[q] * ci + im[q] * cr;
        re[q] = re[p] - tr; im[q] = im[p] - ti; re[p] += tr; im[p] += ti;
        const t = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = t;
      }
    }
  }
}
function gauss() { let u = 0; while (!u) u = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * Math.random()); }
const fmt = (x, d = 0) => x.toFixed(d).replace('.', ',');

export class Simulacion {
  constructor(eq, els) {
    this.refs = eq;
    this.els = { c1: els.canvases[0], c2: els.canvases[1], ...els.read };
    this.muestra = 'acetato'; this.campo = 400; this.angulo = 90; this.ns = 16; this.lw = 0.3;
    // vector de magnetización en la muestra (se dibuja por encima de todo)
    const g = new THREE.Group(); g.visible = false; g.renderOrder = 20;
    const mat = new THREE.MeshBasicMaterial({ color: 0xff8a1f, depthTest: false, transparent: true });
    const ejeM = new THREE.MeshBasicMaterial({ color: 0x5da0f5, depthTest: false, transparent: true, opacity: 0.55 });
    const tallo = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.8, 12).translate(0, 0.4, 0), mat);
    const punta = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.2, 16).translate(0, 0.9, 0), mat);
    this.flecha = new THREE.Group(); this.flecha.add(tallo, punta);
    const b0 = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 5, 8), ejeM);
    for (const m of [tallo, punta, b0]) { m.renderOrder = 20; m.raycast = () => {}; m.userData.noSolid = true; }
    g.add(this.flecha, b0);
    g.position.set(0, MAG.YC, 0);
    (eq.root || eq.bobinasRF[0].parent).add(g);
    this.vis = g;
    this.calcular();
  }
  setTheme() { this.dirty = true; }
  start() { this.active = true; this.vis.visible = true; this.reiniciar(); }
  stop() { this.active = false; this.vis.visible = false; this.brillo(0, 0); }
  setControl(id, v) {
    if (id === 'muestra') this.muestra = v;
    else if (id === 'campo') this.campo = +v;
    else if (id === 'angulo') this.angulo = +v;
    else if (id === 'ns') this.ns = +v;
    else if (id === 'shim') this.lw = +v;
    this.calcular(); this.reiniciar();
  }
  options() { return null; }
  value() { return null; }
  keepGlow() { this.brillo(this.glow || 0, this.glowC || 0); }

  /* ---------- física ---------- */
  calcular() {
    const SF = CAMPOS[this.campo], S = MUESTRAS[this.muestra];
    this.SF = SF; this.B0 = SF / GAMMA_H;
    this.SW = SW_PPM * SF;
    this.N = this.campo === 400 ? 16384 : 2048;
    this.AQ = this.N / this.SW;
    // líneas: sistemas acoplados + referencias
    const L = [];
    S.sistemas.forEach((sis, si) => { for (const [f, I, g] of lineasSistema(sis, SF)) L.push({ f, I, g: si * 10 + g }); });
    for (const [d, a] of REFERENCIAS) L.push({ f: d * SF, I: a, g: -1 });
    this.lineas = L;
    this.grupos = [];
    S.sistemas.forEach((sis, si) => sis.grupos.forEach(([d, n, lab, mult], g) => {
      const ls = L.filter((l) => l.g === si * 10 + g);
      const J = sis.J.filter(([a, b]) => a === g || b === g).map((x) => x[2]);
      this.grupos.push({ id: si * 10 + g, d, n, lab, mult, J, f0: Math.min(...ls.map((l) => l.f)), f1: Math.max(...ls.map((l) => l.f)) });
    }));
    this.nH = this.grupos.reduce((s, g) => s + g.n, 0);
    // FID ideal (amplitud por protón = 1 a 400 MHz y 90°)
    const N = this.N, dt = 1 / this.SW, R2 = Math.PI * this.lw;
    const re = new Float64Array(N), im = new Float64Array(N);
    const sens = (SF / CAMPOS[400]) ** 1.5;
    for (const l of L) {
      const w = 2 * Math.PI * (l.f - PPM_C * SF) * dt, dec = Math.exp(-R2 * dt);
      const cr = Math.cos(w) * dec, ci = Math.sin(w) * dec;
      let pr = l.I * sens, pi = 0;
      for (let k = 0; k < N; k++) { re[k] += pr; im[k] += pi; const t = pr * cr - pi * ci; pi = pr * ci + pi * cr; pr = t; }
    }
    this.fid0 = [re, im];
    // ruido por punto: ∝ √SW; calibrado para que un singlete de 1 H dé S/R = SN_REF en las condiciones de referencia
    const H1 = 1 / (1 - Math.exp(-Math.PI * 0.3 / (SW_PPM * CAMPOS[400]))) - 0.5;
    const sigma0 = H1 / (SN_REF * Math.sqrt(16384));
    this.sigma = sigma0 * Math.sqrt(this.SW / (SW_PPM * CAMPOS[400]));
    // escala vertical: espectro sin ruido para 90° con el shim y el campo actuales
    const sp = this.transformar(re, im, 1, 0);
    let mx = 0; for (let k = 0; k < sp.length; k++) { const p = this.ppm(k); if (p > 0.3 && p < 7.1 && sp[k] > mx) mx = sp[k]; }
    this.escala = mx || 1;
    this.dirty = true;
  }
  /** Espectro (parte real) de un FID escalado por k, con ruido de desviación s por componente. Índice 0 = frecuencia más negativa. */
  transformar(re0, im0, k, s) {
    const N = this.N, re = new Float64Array(N), im = new Float64Array(N);
    for (let i = 0; i < N; i++) { re[i] = re0[i] * k + (s ? s * gauss() : 0); im[i] = im0[i] * k + (s ? s * gauss() : 0); }
    re[0] *= 0.5; im[0] *= 0.5;
    this.ultimoFID = [re.slice(), im.slice()];
    fft(re, im);
    const out = new Float64Array(N);
    for (let i = 0; i < N; i++) out[i] = re[(i + N / 2) % N];
    return out;
  }
  ppm(i) { return PPM_C + ((i - this.N / 2) * this.SW) / this.N / this.SF; }
  idx(p) { return Math.round(((p - PPM_C) * this.SF * this.N) / this.SW + this.N / 2); }

  reiniciar() { this.scan = 0; this.tf = 0; this.fase = 0; this.espectro = null; this.fidMostrado = null; this.tUlt = 0; this.dirty = true; }
  /** Duraciones visuales del primer transitorio (pulso + FID) y de cada uno de los siguientes. */
  dur() { const d1 = 2.8, resto = this.ns > 1 ? Math.min(7, 0.45 * (this.ns - 1)) / (this.ns - 1) : 0; return { d1, dn: Math.max(0.004, resto) }; }
  acumular() {
    // n transitorios promediados: la señal se mantiene y el ruido baja como 1/√n
    const n = this.scan, k = Math.sin((this.angulo * Math.PI) / 180);
    this.espectro = this.transformar(this.fid0[0], this.fid0[1], k, this.sigma / Math.sqrt(n));
    this.fidMostrado = this.ultimoFID;
    // S/R: pico mayor / ruido rms en una zona sin señales
    const a = this.idx(-1.2), b = this.idx(-0.6); let s2 = 0, c = 0;
    for (let i = a; i < b; i++) { s2 += this.espectro[i] ** 2; c++; }
    const rms = Math.sqrt(s2 / c);
    let mx = 0;
    for (let i = 0; i < this.N; i++) { const p = this.ppm(i); if (p > 0.3 && p < 7.1 && this.espectro[i] > mx) mx = this.espectro[i]; }
    this.sn = mx / rms;
  }

  update(dt) {
    if (!this.active) return;
    dt = Math.min(dt, 0.05);
    this.tf += dt;
    const { d1, dn } = this.dur(), TP = 0.35;
    const th = (this.angulo * Math.PI) / 180;
    // fases: 0 primer pulso + FID · 1 resto de transitorios · 2 espectro final
    let u = 0;
    if (this.fase === 0) {
      u = this.tf / d1;
      if (this.tf >= d1) { this.scan = 1; this.acumular(); this.tf = 0; this.fase = this.ns > 1 ? 1 : 2; this.dirty = true; }
    } else if (this.fase === 1) {
      const n = 1 + Math.floor(this.tf / dn);
      if (n > this.scan) { this.scan = Math.min(this.ns, n); if (this.tf - this.tUlt > 0.12 || this.scan === this.ns) { this.acumular(); this.tUlt = this.tf; this.dirty = true; } }
      if (this.scan >= this.ns) { this.acumular(); this.fase = 2; this.tf = 0; this.dirty = true; }
    } else if (this.tf > 5) this.reiniciar();
    // vector de magnetización: pulso (giro θ alrededor de x′), precesión alrededor de B₀ con amortiguamiento y recuperación
    let tl = 0, pul = 0;
    if (this.fase === 0) { tl = this.tf; } else if (this.fase === 1) { tl = (this.tf % dn) * (d1 / Math.max(dn, 1e-3)); } else tl = d1 + this.tf;
    if (tl < TP) pul = tl / TP;
    const ang = pul > 0 && pul < 1 ? th * pul : th;
    const tp = Math.max(0, tl - TP), T2v = 0.7, T1v = 1.6;
    const mt = Math.sin(ang) * (pul > 0 && pul < 1 ? 1 : Math.exp(-tp / T2v));
    const mz = pul > 0 && pul < 1 ? Math.cos(ang) : 1 - (1 - Math.cos(th)) * Math.exp(-tp / T1v);
    const fi = -tp * 2 * Math.PI * 0.9;
    const v = new THREE.Vector3(mt * Math.sin(fi), mz, mt * Math.cos(fi));
    const L = 2.4 * Math.max(0.04, v.length());
    if (v.lengthSq() > 1e-6) this.flecha.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v.clone().normalize());
    this.flecha.scale.set(1.6, L, 1.6);
    // bobinas de RF: naranja durante el pulso, azul tenue mientras se recibe
    const enPulso = tl < TP && this.fase < 2, recibe = !enPulso && this.fase < 2;
    this.brillo(enPulso ? 1.4 : recibe ? 0.5 : 0, enPulso ? 0xff8a1f : 0x4a8cff);
    this.faseTxt = this.fase === 2 ? 'Espectro (FT)' : enPulso ? 'Pulso de RF' : this.fase === 0 ? 'Adquisición del FID' : 'Acumulando transitorios';
    this.uFID = this.fase === 0 ? Math.max(0, (u * d1 - TP) / (d1 - TP)) : 1;
    this.frame = (this.frame || 0) + 1;
    if (this.dirty || this.frame % 3 === 0) { this.drawUI(); this.dirty = false; }
  }
  brillo(k, col) {
    this.glow = k; this.glowC = col;
    for (const m of this.refs.bobinasRF || []) { m.material.emissive.setHex(col || 0); m.material.emissiveIntensity = k; }
  }

  /* ---------- paneles ---------- */
  drawUI() {
    this.drawEspectro(); this.drawFID();
    const e = this.els;
    e.nu.textContent = `${fmt(this.SF, 2)} MHz`;
    e.B.textContent = `${fmt(this.B0, 2)} T`;
    e.ns.textContent = `${this.scan} / ${this.ns}`;
    e.sn.textContent = this.espectro ? (this.sn < 1.5 ? '< 2' : fmt(this.sn, this.sn < 10 ? 1 : 0)) : '–';
    e.lw.textContent = `${fmt(this.lw, 1)} Hz · ${fmt(this.lw / this.SF, 4)} ppm`;
    e.fase.textContent = this.faseTxt || '–';
  }
  drawFID() {
    const cv = this.els.c2; if (!cv.clientWidth) return;
    const [g, w, h] = setupCanvas(cv), C = chartColors();
    const L = 8, R = 8, T = 18, B = 22, pw = w - L - R, ph = h - T - B, yc = T + ph / 2;
    g.strokeStyle = C.grid; g.lineWidth = 1; g.beginPath(); g.moveTo(L, yc); g.lineTo(L + pw, yc); g.stroke();
    g.strokeStyle = C.axis; g.beginPath(); g.moveTo(L, T + ph); g.lineTo(L + pw, T + ph); g.stroke();
    g.fillStyle = C.text; g.font = '10px Segoe UI, sans-serif'; g.textAlign = 'center';
    for (let s = 0; s <= Math.floor(this.AQ); s++) g.fillText(String(s), L + (s / this.AQ) * pw, T + ph + 12);
    g.textAlign = 'right'; g.fillText('t (s)', L + pw, T + ph + 21);
    g.textAlign = 'left'; g.font = '11px Segoe UI, sans-serif';
    // durante el primer transitorio se dibuja la señal ideal según se adquiere; después, el promedio con ruido
    const src = this.fidMostrado || this.fid0, k = this.fidMostrado ? 1 : Math.sin((this.angulo * Math.PI) / 180);
    const uMax = this.fidMostrado ? 1 : this.uFID || 0;
    const N = this.N, amp = Math.max(1e-9, this.fid0[0][0] * 1.05);
    const re = src[0];
    g.fillStyle = C.line; g.globalAlpha = 0.85;
    const cols = Math.floor(pw * uMax);
    for (let x = 0; x < cols; x++) {
      const a = Math.floor((x / pw) * N), b = Math.max(a + 1, Math.floor(((x + 1) / pw) * N));
      let lo = Infinity, hi = -Infinity; for (let i = a; i < b; i++) { const v = re[i] * k; if (v < lo) lo = v; if (v > hi) hi = v; }
      const y0 = yc - (hi / amp) * ph * 0.48, y1 = yc - (lo / amp) * ph * 0.48;
      g.fillRect(L + x, Math.max(T, y0), 1, Math.max(1, Math.min(T + ph, y1) - Math.max(T, y0)));
    }
    g.globalAlpha = 1;
    g.fillStyle = C.text;
    g.fillText(this.scan > 1 ? `Promedio de ${this.scan} FID (Re)` : this.scan === 1 ? '1 transitorio (Re)' : 'Adquiriendo…', L + 2, T - 6);
    g.textAlign = 'right'; g.fillStyle = C.text; g.fillText(`AQ ${fmt(this.AQ, 2)} s`, L + pw, T - 6);
  }
  drawEspectro() {
    const [g, w, h] = setupCanvas(this.els.c1), C = chartColors();
    const L = 10, R = 10, T = 82, B = 30, pw = w - L - R, ph = h - T - B, yb = T + ph;
    const [p0, p1] = VENTANA, X = (p) => L + ((p0 - p) / (p0 - p1)) * pw;
    g.strokeStyle = C.axis; g.lineWidth = 1; g.beginPath(); g.moveTo(L, yb); g.lineTo(L + pw, yb); g.stroke();
    g.fillStyle = C.text; g.font = '10px Segoe UI, sans-serif'; g.textAlign = 'center';
    for (let p = Math.ceil(p1); p <= p0; p++) { g.fillText(String(p), X(p), yb + 12); g.beginPath(); g.moveTo(X(p), yb); g.lineTo(X(p), yb + 3); g.stroke(); }
    g.textAlign = 'right'; g.fillText('δ (ppm)', L + pw, yb + 24);
    const S = MUESTRAS[this.muestra];
    g.textAlign = 'left'; g.font = '11px Segoe UI, sans-serif';
    g.fillText(w > 540 ? `¹H · ${S.nombre} (${S.formula}) en CDCl₃ · ${fmt(this.SF, this.campo === 400 ? 2 : 0)} MHz · pulso de ${this.angulo}°`
      : `¹H · ${S.nombre} · ${fmt(this.SF, 0)} MHz · ${this.angulo}°`, L, 12);
    if (!this.espectro) { g.fillStyle = C.text; g.fillText('El espectro aparece al terminar el primer transitorio y su transformada de Fourier…', L + 6, T + ph / 2); return; }
    const sp = this.espectro, Y = (v) => yb - (v / this.escala) * ph * 0.86;
    // envolvente por píxel (máximo y mínimo) para no perder picos estrechos
    g.strokeStyle = C.line; g.lineWidth = 1.1; g.beginPath();
    let first = true;
    for (let x = 0; x <= pw; x++) {
      const pa = p0 - (x / pw) * (p0 - p1), pb = p0 - ((x + 1) / pw) * (p0 - p1);
      let a = this.idx(pb), b = this.idx(pa); if (a > b) [a, b] = [b, a]; a = Math.max(0, a); b = Math.min(this.N - 1, Math.max(a, b));
      let lo = Infinity, hi = -Infinity; for (let i = a; i <= b; i++) { if (sp[i] < lo) lo = sp[i]; if (sp[i] > hi) hi = sp[i]; }
      const yh = Math.max(T - 4, Y(hi)), yl = Math.min(yb + 6, Y(lo));
      if (first) { g.moveTo(L + x, yh); first = false; } else g.lineTo(L + x, yh);
      if (yl - yh > 1) g.lineTo(L + x, yl);
    }
    g.stroke();
    // referencias
    g.font = '9.5px Segoe UI, sans-serif'; g.fillStyle = C.text; g.textAlign = 'center';
    for (const [d, , lab] of REFERENCIAS) g.fillText(lab, X(d), yb - 6);
    if (Math.sin((this.angulo * Math.PI) / 180) < 0.01) {
      g.fillStyle = C.bad || C.text; g.font = '600 11px Segoe UI, sans-serif';
      g.fillText('Un pulso de 180° invierte M sin crear magnetización transversal: no hay FID, solo ruido.', L + pw / 2, T + ph * 0.35);
      return;
    }
    // integrales (curva escalonada y valor normalizado al número total de H)
    const df = this.SW / this.N;
    const ints = this.grupos.map((G) => {
      const m = 3 * this.lw + 2.5, a = this.idx((G.f0 - m) / this.SF), b = this.idx((G.f1 + m) / this.SF);
      let s = 0; const acc = []; for (let i = a; i <= b; i++) { s += sp[i] * df; acc.push(s); } return { G, a, b, s, acc };
    });
    const tot = ints.reduce((q, x) => q + x.s, 0);
    const kmax = Math.max(...ints.map((x) => x.s), 1e-9);
    g.strokeStyle = C.peak; g.lineWidth = 1.2;
    if (this.sn >= 5 && tot > 0) for (const it of ints) {
      g.beginPath();
      it.acc.forEach((v, j) => { const x = X(this.ppm(it.a + j)), y = yb - 8 - (v / kmax) * ph * 0.42; j ? g.lineTo(x, y) : g.moveTo(x, y); });
      g.stroke();
      g.fillStyle = C.peak; g.font = '600 10px Segoe UI, sans-serif'; g.textAlign = 'center';
      g.fillText(fmt((it.s / tot) * this.nH, 2), X(it.G.d), yb + 24);
    }
    // ampliaciones de los multipletes (en Hz) con su asignación
    const cajas = this.grupos.map((G) => ({ G, x: X(G.d) })).sort((a, b) => a.x - b.x);
    const n = cajas.length, wc = Math.min(120, (pw - 8 * (n - 1)) / n), hc = 38;
    let prev = L - 8;
    cajas.forEach((c, i) => { c.x0 = Math.max(prev + 8, Math.min(c.x - wc / 2, L + pw - (n - i) * (wc + 8) + 8)); prev = c.x0 + wc; });
    for (const c of cajas) {
      const G = c.G, m = Math.max(4 * this.lw + 3, 6), fa = G.f0 - m, fb = G.f1 + m, ya = 38, yz = ya + hc;
      g.strokeStyle = C.grid; g.lineWidth = 1; g.strokeRect(c.x0, ya, wc, hc);
      g.beginPath(); g.moveTo(c.x0 + wc / 2, yz); g.lineTo(c.x, Math.max(yz + 2, T - 2)); g.stroke();
      const ia = this.idx(fa / this.SF), ib = this.idx(fb / this.SF);
      let mx = 1e-9; for (let i = ia; i <= ib; i++) mx = Math.max(mx, sp[i]);
      const ref = Math.max(mx, this.escala * 0.08);
      g.save(); g.beginPath(); g.rect(c.x0, ya, wc, hc); g.clip();
      g.strokeStyle = C.line; g.lineWidth = 1; g.beginPath();
      for (let i = ia; i <= ib; i++) { const f = this.ppm(i) * this.SF, x = c.x0 + wc - ((f - fa) / (fb - fa)) * wc, y = yz - 2 - (sp[i] / ref) * (hc - 15); i === ia ? g.moveTo(x, y) : g.lineTo(x, y); }
      g.stroke(); g.restore();
      // rótulos encima de la caja: δ y grupo; multiplicidad y J
      g.fillStyle = C.text; g.font = '600 9.5px Segoe UI, sans-serif'; g.textAlign = 'left';
      g.fillText(`${fmt(G.d, 2)} ${G.lab}`, c.x0 + 1, ya - 9);
      g.fillStyle = C.peak; g.font = '9px Segoe UI, sans-serif';
      g.fillText(`${G.mult}${G.J.length ? ` · J ${G.J.map((j) => fmt(j, 1)).join('/')}` : ''}`, c.x0 + 1, ya - 0.5);
      // barra de 10 Hz dentro de la caja, abajo a la izquierda
      const w10 = (10 / (fb - fa)) * wc;
      if (w10 < wc * 0.6) { g.strokeStyle = C.text; g.lineWidth = 1.4; g.beginPath(); g.moveTo(c.x0 + 3, yz - 3); g.lineTo(c.x0 + 3 + w10, yz - 3); g.stroke(); g.lineWidth = 1;
        g.fillStyle = C.text; g.textAlign = 'left'; g.font = '8.5px Segoe UI'; g.fillText('10 Hz', c.x0 + 5 + w10, yz - 1); }
    }
  }
}

export const PANEL = {
  titulo: 'Simulación RMN ¹H',
  controles: [
    { id: 'muestra', label: 'Muestra', value: 'acetato', opciones: Object.entries(MUESTRAS).map(([k, m]) => [k, m.nombre]) },
    { id: 'campo', label: 'Campo', value: '400', opciones: [['400', '400 MHz · 9,4 T'], ['60', '60 MHz · 1,4 T']] },
    { id: 'angulo', label: 'Ángulo de pulso', value: '90', opciones: [['30', '30°'], ['90', '90°'], ['180', '180°']] },
    { id: 'ns', label: 'Transitorios (NS)', value: '16', opciones: [['1', '1'], ['4', '4'], ['16', '16'], ['64', '64'], ['256', '256'], ['1024', '1024']] },
    { id: 'shim', label: 'Shim (anchura de línea)', value: '0.3', opciones: [['0.3', 'Bueno · 0,3 Hz'], ['1', 'Regular · 1 Hz'], ['4', 'Deficiente · 4 Hz']] },
  ],
  lecturas: [['nu', 'Frecuencia ¹H'], ['B', 'Campo B₀'], ['ns', 'Transitorios'], ['sn', 'S/R (pico mayor)'], ['lw', 'Anchura de línea'], ['fase', 'Fase']],
  nota: 'Espectro exacto del hamiltoniano de espín (δ y J de bibliografía, redondeados). Señal ∝ sen θ con relajación completa entre pulsos; S/R ∝ √NS y ∝ B₀^{3/2}. S/R orientativa (muestra diluida).',
  leyenda: [['#ff8a1f', 'magnetización M y pulso de RF'], ['#4a8cff', 'recepción · eje de B₀']],
  graficas: ['Espectro de ¹H tras la transformada de Fourier', 'FID (señal de inducción libre)'],
};
