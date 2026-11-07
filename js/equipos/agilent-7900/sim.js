// Simulación didáctica del ICP-MS: aerosol, plasma, iones a través de conos, lente Omega y celda ORS4 (modo sin gas / helio-KED),
// salto de masas del cuadrupolo, espectro con interferencias poliatómicas y concentración medida frente a la real.
// Valores orientativos con fines didácticos (escala de tiempo muy ralentizada).
import * as THREE from 'three';
import { AX } from './geometria.js';
import { PointPool, chartColors, setupCanvas, COL } from '../../simcore.js';

// isótopos de los analitos: [masa, elemento, abundancia %]
const ISO = [
  [51, 'V', 99.75], [52, 'Cr', 83.79], [53, 'Cr', 9.50], [55, 'Mn', 100], [56, 'Fe', 91.75], [57, 'Fe', 2.12], [59, 'Co', 100],
  [58, 'Ni', 68.08], [60, 'Ni', 26.22], [63, 'Cu', 69.15], [65, 'Cu', 30.85], [64, 'Zn', 49.17], [66, 'Zn', 27.73], [68, 'Zn', 18.45],
  [75, 'As', 100], [77, 'Se', 7.63], [78, 'Se', 23.77], [80, 'Se', 49.61], [82, 'Se', 8.73],
];
// isótopo de cuantificación de cada elemento (sin gas se mediría igual; se elige el más abundante)
const CUANT = [[51, 'V'], [52, 'Cr'], [55, 'Mn'], [56, 'Fe'], [59, 'Co'], [60, 'Ni'], [63, 'Cu'], [66, 'Zn'], [75, 'As'], [78, 'Se']];
const CUANT_M = new Set(CUANT.map((c) => c[0]));

// interferencias poliatómicas: [masa, especie, cps sin gas, origen ('plasma' | componente de la matriz), factor de reducción en He]
const POLI = [
  [52, '⁴⁰Ar¹²C⁺', 1.5e5, 'plasma', 2e-4], [54, '⁴⁰Ar¹⁴N⁺', 5e5, 'plasma', 2e-4], [56, '⁴⁰Ar¹⁶O⁺', 2e7, 'plasma', 1e-4], [57, '⁴⁰Ar¹⁶O¹H⁺', 1.5e6, 'plasma', 1e-4],
  [76, '³⁶Ar⁴⁰Ar⁺', 3e5, 'plasma', 1e-5], [78, '³⁸Ar⁴⁰Ar⁺', 6e4, 'plasma', 1e-5], [80, '⁴⁰Ar₂⁺', 3e7, 'plasma', 1e-5], [81, '⁴⁰Ar₂¹H⁺', 1e5, 'plasma', 1e-5],
  [51, '³⁵Cl¹⁶O⁺', 20, 'Cl', 5e-4], [53, '³⁷Cl¹⁶O⁺', 6, 'Cl', 5e-4], [75, '⁴⁰Ar³⁵Cl⁺', 20, 'Cl', 7e-4], [77, '⁴⁰Ar³⁷Cl⁺', 6, 'Cl', 7e-4],
  [56, '⁴⁰Ca¹⁶O⁺', 400, 'Ca', 5e-4], [57, '⁴⁰Ca¹⁶O¹H⁺', 120, 'Ca', 5e-4], [59, '⁴³Ca¹⁶O⁺', 10, 'Ca', 5e-4], [60, '⁴⁴Ca¹⁶O⁺', 50, 'Ca', 5e-4],
  [63, '⁴⁰Ar²³Na⁺', 60, 'Na', 5e-4], [64, '³²S¹⁶O₂⁺', 150, 'S', 5e-4], [66, '³⁴S¹⁶O₂⁺', 8, 'S', 5e-4],
];
// muestras: analitos (µg/L) y matriz (mg/L)
export const MUESTRAS = {
  agua: { nombre: 'Agua potable (HNO₃ 1 %)', conc: { V: 1, Cr: 1, Mn: 2, Fe: 20, Co: 0.5, Ni: 2, Cu: 5, Zn: 10, As: 1, Se: 1 }, matriz: { Cl: 25, Ca: 40, Na: 20, S: 15 } },
  hcl: { nombre: 'Digestión en HCl 1 %', conc: { V: 1, Cr: 1, Mn: 2, Fe: 20, Co: 0.5, Ni: 2, Cu: 5, Zn: 10, As: 1, Se: 1 }, matriz: { Cl: 10000, Ca: 40, Na: 20, S: 15 } },
  mar: { nombre: 'Agua de mar (dilución 1:10)', conc: { V: 0.2, Cr: 0.3, Mn: 0.5, Fe: 2, Co: 0.1, Ni: 0.5, Cu: 0.5, Zn: 1, As: 0.2, Se: 0.1 }, matriz: { Cl: 1900, Ca: 40, Na: 1050, S: 90 } },
};
const SENS = { nogas: 1.0e5, he: 3.0e4 }; // cps por µg/L para 100 % de abundancia
const sensHe = (m) => SENS.he * (0.65 + 0.5 * (m - 51) / 30);

const C_DROP = COL.gota, C_ION = new THREE.Color(0xffc46b), C_POLI = new THREE.Color(0xd34bff), C_BAD = COL.bad, C_HE = COL.gas,
  C_FLASH = COL.flash, C_NEU = new THREE.Color(0xbfe6ff);

export class Simulacion {
  constructor(eq, els) {
    this.refs = eq.analyzer;
    this.els = { spec: els.canvases[0], rec: els.canvases[1], ...els.read };
    const A = this.refs.group;
    // el conjunto mide ~70 cm y se ve de lejos: puntos algo mayores que en los demás analizadores
    this.dPool = new PointPool(A, 900, 0.9);
    this.ionPool = new PointPool(A, 1400, 1.1);
    this.hPool = new PointPool(A, 220, 0.5);
    this.fPool = new PointPool(A, 300, 2.6);
    this.drops = []; this.ions = []; this.flashes = []; this.he = [];
    for (let i = 0; i < 160; i++) this.he.push({ x: AX.C_0 + 0.3 + Math.random() * (AX.C_1 - AX.C_0 - 0.6), a: Math.random() * 6.28, r: Math.random() * 0.5, v: (Math.random() - 0.5) * 4 });
    this.muestra = 'hcl'; this.celda = 'nogas'; this.velocidad = 1;
    this.t = 0; this.hop = 0; this.mi = 0; this.cuentas = 0;
    this.calcular();
    this.setVisible(false);
  }

  setVisible(v) { for (const p of [this.dPool, this.ionPool, this.hPool, this.fPool]) p.visible = v; }
  setTheme(light) {
    for (const p of [this.dPool, this.ionPool, this.hPool, this.fPool]) p.setTheme(light);
    for (const m of this.refs.plasma) { m.material.blending = light ? THREE.NormalBlending : THREE.AdditiveBlending; m.material.needsUpdate = true; }
  }
  start() { this.active = true; this.setVisible(true); }
  stop() {
    this.active = false; this.setVisible(false);
    this.drops.length = 0; this.ions.length = 0; this.flashes.length = 0;
    for (const m of this.refs.plasma) m.material.opacity = 0;
  }
  setControl(id, v) {
    if (id === 'muestra') this.muestra = v;
    else if (id === 'celda') this.celda = v;
    else if (id === 'velocidad') this.velocidad = +v;
    this.calcular();
  }
  options() { return null; }
  value() { return null; }

  /* ---------- modelo de señales ---------- */
  calcular() {
    const S = MUESTRAS[this.muestra], he = this.celda === 'he';
    const sens = (m) => (he ? sensHe(m) : SENS.nogas);
    const sig = new Map(); // m -> {ana, poli, polMatriz, polPlasma, especies[]}
    const get = (m) => sig.get(m) || sig.set(m, { ana: 0, poli: 0, mat: 0, pla: 0, esp: [], el: null }).get(m);
    for (const [m, el, ab] of ISO) { const s = get(m); s.ana += (S.conc[el] || 0) * (ab / 100) * sens(m); s.el = s.el || el; }
    for (const [m, nom, c, ori, f] of POLI) {
      const k = he ? f : 1;
      const v = (ori === 'plasma' ? c : c * (S.matriz[ori] || 0)) * k;
      const s = get(m); s.poli += v; s.esp.push([nom, v]);
      if (ori === 'plasma') s.pla += v; else s.mat += v;
    }
    this.sig = sig;
    // concentración medida: el blanco de calibración (ácido limpio) contiene las interferencias del plasma, no las de la matriz
    this.res = CUANT.map(([m, el]) => {
      const s = sig.get(m), ab = ISO.find((i) => i[0] === m)[2] / 100, k = sens(m) * ab;
      const real = S.conc[el];
      const bec = (s.pla + s.mat) / k;
      return { m, el, real, k, mat: s.mat, pla: s.pla, bec, medida: real + s.mat / k };
    });
    this.lista = CUANT.map(([m]) => m);
    // composición de los iones que se dibujan (peso ∝ cps^0,3 para que se vean todos)
    const esp = [];
    for (const [m, s] of sig) {
      if (s.ana > 0) esp.push({ m, poli: false, w: s.ana ** 0.3 });
      for (const [, v] of s.esp) if (v > 0.5) esp.push({ m, poli: true, w: (v / (he ? 1 : 1)) ** 0.3 });
    }
    const tot = esp.reduce((a, e) => a + e.w, 0); let acc = 0;
    this.cdf = esp.map((e) => { acc += e.w / tot; return [acc, e]; });
  }
  sorteo() { const r = Math.random(); for (const [c, e] of this.cdf) if (r <= c) return e; return this.cdf[this.cdf.length - 1][1]; }

  /* ---------- trayectorias (coordenadas locales del analizador) ---------- */
  update(dt) {
    if (!this.active) return;
    dt = Math.min(dt, 0.05) * this.velocidad; this.t += dt;
    for (const m of this.refs.plasma) m.material.opacity = 0.78 + 0.12 * Math.sin(this.t * 37) * Math.sin(this.t * 11);
    // salto de masas del cuadrupolo
    this.hop += dt; if (this.hop > 0.9) { this.hop = 0; this.mi = (this.mi + 1) % this.lista.length; }
    this.mset = this.lista[this.mi];

    const conn = this.refs.conector.geometry.parameters.path;
    const n0 = this.refs.nebTip;
    // gotas: nebulizador → tubo interior (−z) → retorno por el exterior → salida → conector → inyector
    this.accD = (this.accD || 0) + dt * 120;
    while (this.accD >= 1) { this.accD -= 1; this.drops.push({ ph: 0, t: 0, j: new THREE.Vector3((Math.random() - 0.5) * 1.2, (Math.random() - 0.5) * 1.2, 0), grande: Math.random() < 0.85, pos: n0.clone() }); }
    const x = AX.SC_X, y = AX.SC_Y;
    for (const d of this.drops) {
      d.t += dt;
      if (d.ph === 0) { const u = d.t / 0.9; d.pos.set(x + d.j.x * 0.5 * u, y + d.j.y * 0.5 * u, AX.NEB_Z0 - 0.6 - u * 10); if (u >= 1) { d.ph = d.grande ? 9 : 1; d.t = 0; } }
      else if (d.ph === 9) { const u = d.t / 0.7; d.pos.set(x + d.j.x * 0.9, y - u * 1.6, AX.SC_Z0 + 0.6 + d.j.y * 0.3); if (u >= 1) d.dead = true; }  // al drenaje
      else if (d.ph === 1) { const u = d.t / 0.7; const a = d.j.x * 2.1; d.pos.set(x + Math.cos(a) * 1.35, y + Math.sin(a) * 1.35, AX.SC_Z0 + 0.6 + u * 8.8); if (u >= 1) { d.ph = 2; d.t = 0; } }
      else if (d.ph === 2) { const u = d.t / 0.6; d.pos.copy(conn.getPointAt(Math.min(1, u))); if (u >= 1) { d.ph = 3; d.t = 0; } }
      else if (d.ph === 3) { const u = Math.min(1, d.t / 0.35); d.pos.set(AX.T_0 - 0.65 + u * (-5.4 - AX.T_0 + 0.65), 0, 0);
        if (u >= 1) { d.dead = true; this.flash(new THREE.Vector3(-5.2, 0, 0), 0.6); this.ionizar(); } }
    }
    this.drops = this.drops.filter((d) => !d.dead);

    // iones
    const he = this.celda === 'he';
    for (const i of this.ions) {
      i.t += dt;
      if (i.ph === 0) {                                     // plasma → conos → extracción
        const u = i.t / 0.45, xx = -5 + u * 11.2;
        i.pos.set(xx, i.y0 * (1 - Math.min(1, u * 1.3)) , i.z0 * (1 - Math.min(1, u * 1.3)));
        if (i.neutro && xx > 3) { i.ph = 5; i.t = 0; }
        else if (u >= 1) { i.ph = 1; i.t = 0; }
      } else if (i.ph === 5) {                              // neutros/fotones: siguen recto y chocan con la salida de la lente Omega
        const xx = 3 + (i.t / 0.3) * 7.0; i.pos.set(Math.min(xx, AX.OM_1 - 0.2), 0, 0);
        if (xx >= AX.OM_1 - 0.2) { i.dead = true; this.flash(i.pos, 0.3); }
      } else if (i.ph === 1) {                              // lente Omega: desplazamiento fuera de eje
        const u = Math.min(1, i.t / 0.32), xx = 6.2 + u * 4.8, s = Math.min(1, Math.max(0, (xx - 6.6) / 3.4));
        i.pos.set(xx, AX.Y2 * s * s * (3 - 2 * s), 0);
        if (u >= 1) { i.ph = 2; i.t = 0; i.x = AX.C_0; i.v = 16; i.yy = 0; i.zz = 0; }
      } else if (i.ph === 2) {                              // celda ORS4
        if (he) {
          i.v *= Math.exp(-dt * (i.poli ? 2.2 : 0.45));
          if (Math.random() < dt * 25) { i.yy = (Math.random() - 0.5) * 0.7; i.zz = (Math.random() - 0.5) * 0.7; }
        }
        i.x += Math.max(i.v, 1.2) * dt;
        i.pos.set(i.x, AX.Y2 + i.yy * 0.6, i.zz * 0.6);
        if (i.x >= AX.C_1) {
          if (he && i.v < 6) { i.dead = true; this.flash(i.pos, 0.55, true); }   // rechazado por la barrera KED
          else { i.ph = 3; i.t = 0; i.stable = Math.abs(i.m - this.mset) < 0.5; i.w = 12 + Math.random() * 6; i.f = Math.random() * 6.28; i.A = 0.08 + Math.random() * 0.12; i.g = 3 + Math.random() * 3; }
        }
      } else if (i.ph === 3) {                              // cuadrupolo
        const xx = AX.PB + i.t * 30;
        let a = i.A; if (!i.stable) a *= Math.exp(i.g * i.t * 4);
        i.pos.set(xx, AX.Y2 + a * Math.sin(i.w * i.t * 6 + i.f), a * 0.8 * Math.cos(i.w * i.t * 5));
        if (!i.stable && a > AX.R0 * 0.95) { i.dead = true; this.flash(i.pos, 0.45); }
        else if (xx >= AX.Q_1 + 0.6) { i.ph = 4; i.t = 0; i.p0 = i.pos.clone(); }
      } else if (i.ph === 4) {                              // detector ortogonal
        const u = Math.min(1, i.t / 0.18), P1 = AX.EM, C = new THREE.Vector3(36.4, AX.Y2 + 0.3, 0);
        i.pos.set(0, 0, 0).addScaledVector(i.p0, (1 - u) ** 2).addScaledVector(C, 2 * u * (1 - u)).addScaledVector(P1, u * u);
        if (u >= 1) { i.dead = true; this.cuentas++; this.flash(P1, 1.0); }
      }
    }
    this.ions = this.ions.filter((i) => !i.dead);
    for (const f of this.flashes) f.t += dt;
    this.flashes = this.flashes.filter((f) => f.t < 0.25);

    // dibujo
    this.dPool.begin(); for (const d of this.drops) this.dPool.push(d.pos, C_DROP, 0.85); this.dPool.end();
    this.ionPool.begin();
    for (const i of this.ions) this.ionPool.push(i.pos, i.neutro ? C_NEU : i.poli ? C_POLI : (i.ph === 3 && !i.stable ? C_BAD : C_ION), i.neutro ? 0.6 : 1);
    this.ionPool.end();
    this.hPool.begin();
    if (he) for (const h of this.he) { h.x += h.v * dt; if (h.x < AX.C_0 + 0.3 || h.x > AX.C_1 - 0.3) h.v *= -1; h.a += dt * 3;
      this.hPool.push(new THREE.Vector3(h.x, AX.Y2 + Math.cos(h.a) * h.r, Math.sin(h.a) * h.r), C_HE, 0.8); }
    this.hPool.end();
    this.fPool.begin(); for (const f of this.flashes) this.fPool.push(f.p, f.poli ? C_POLI : C_FLASH, f.k * (1 - f.t / 0.25)); this.fPool.end();

    this.frame = (this.frame || 0) + 1;
    if (this.frame % 3 === 0) this.drawUI();
  }
  ionizar() {
    for (let k = 0; k < 2; k++) {
      const neutro = Math.random() < 0.18, e = this.sorteo();
      this.ions.push({ ph: 0, t: 0, m: e.m, poli: e.poli, neutro, y0: (Math.random() - 0.5) * 0.6, z0: (Math.random() - 0.5) * 0.6, pos: new THREE.Vector3(-5, 0, 0) });
    }
  }
  flash(p, k, poli = false) { if (this.flashes.length < 280) this.flashes.push({ p: p.clone(), t: 0, k, poli }); }

  /* ---------- paneles 2D ---------- */
  drawUI() {
    this.drawSpectrum(); this.drawRecovery();
    const s = this.sig.get(this.mset), r = this.res.find((q) => q.m === this.mset);
    const e = this.els;
    e.mz.textContent = `${this.mset} ${r ? r.el : ''}`;
    e.cps.textContent = fmtCps((s.ana + s.poli) * (1 + (Math.random() - 0.5) * 0.04));
    const as = this.res.find((q) => q.el === 'As');
    e.as.textContent = `${fmtC(as.medida)} µg/L (real ${fmtC(as.real)})`;
    e.bec.textContent = r ? `${fmtC(r.bec)} µg/L` : '—';
  }
  drawSpectrum() {
    const [g, w, h] = setupCanvas(this.els.spec);
    const C = chartColors(), L = 40, R = 8, T = 16, B = 30, pw = w - L - R, ph = h - T - B, lo = 49.5, hi = 82.5;
    const X = (m) => L + ((m - lo) / (hi - lo)) * pw, Y = (v) => T + ph - (Math.log10(Math.max(1, v)) / 9) * ph;
    g.font = '10px Segoe UI, sans-serif'; g.strokeStyle = C.axis; g.fillStyle = C.text; g.lineWidth = 1;
    g.beginPath(); g.moveTo(L, T); g.lineTo(L, T + ph); g.lineTo(L + pw, T + ph); g.stroke();
    g.textAlign = 'right';
    for (let k = 0; k <= 9; k += 3) { const y = Y(10 ** k); g.fillText(`10${'⁰¹²³⁴⁵⁶⁷⁸⁹'[k]}`, L - 4, y + 3); g.strokeStyle = C.grid; g.beginPath(); g.moveTo(L, y); g.lineTo(L + pw, y); g.stroke(); }
    g.textAlign = 'center';
    for (let m = 50; m <= 82; m += 5) g.fillText(m, X(m), T + ph + 12);
    g.fillText('m/z', L + pw - 10, T + ph + 24);
    const bw = Math.max(3, pw / (hi - lo) * 0.55);
    for (const [m, s] of this.sig) {
      if (m < lo || m > hi) continue;
      const tot = s.ana + s.poli;
      const xx = X(m) - bw / 2;
      g.fillStyle = C.bad; if (s.poli > 1) g.fillRect(xx, Y(tot), bw, T + ph - Y(tot));
      g.fillStyle = C.line; if (s.ana > 1) g.fillRect(xx + bw * 0.18, Y(s.ana), bw * 0.64, T + ph - Y(s.ana));
      if (s.el && s.ana > 1 && CUANT_M.has(m)) { g.fillStyle = C.text; g.font = '9px Segoe UI, sans-serif'; g.fillText(s.el, X(m), T + ph + 22); }
    }
    // cursor del cuadrupolo
    g.strokeStyle = C.cursor; g.setLineDash([4, 3]); g.beginPath(); g.moveTo(X(this.mset), T); g.lineTo(X(this.mset), T + ph); g.stroke(); g.setLineDash([]);
    // especie dominante en la masa medida
    const s = this.sig.get(this.mset); const dom = s.esp.sort((a, b) => b[1] - a[1])[0];
    g.textAlign = 'left'; g.font = '11px Segoe UI, sans-serif'; g.fillStyle = C.text;
    const modo = this.celda === 'he' ? 'modo He (KED)' : 'sin gas';
    g.fillText(`${MUESTRAS[this.muestra].nombre} · ${modo}`, L + 4, T - 4);
    if (dom && dom[1] > s.ana * 0.1) { g.fillStyle = C.bad; g.textAlign = 'center'; g.fillText(dom[0], Math.min(L + pw - 30, Math.max(L + 30, X(this.mset))), Math.max(T + 10, Y(s.ana + s.poli) - 6)); }
    g.textAlign = 'right'; g.font = '10px Segoe UI, sans-serif';
    g.fillStyle = C.line; g.fillText('■ analito', L + pw, T - 4); g.fillStyle = C.bad; g.fillText('■ poliatómico   ', L + pw - 50, T - 4);
  }
  drawRecovery() {
    const [g, w, h] = setupCanvas(this.els.rec);
    const C = chartColors(), L = 44, R = 66, T = 14, B = 22, pw = w - L - R, ph = h - T - B, n = this.res.length, rh = ph / n;
    const X = (p) => L + (Math.min(p, 300) / 300) * pw;
    g.font = '10px Segoe UI, sans-serif'; g.strokeStyle = C.axis; g.lineWidth = 1;
    g.beginPath(); g.moveTo(L, T); g.lineTo(L, T + ph); g.lineTo(L + pw, T + ph); g.stroke();
    g.fillStyle = C.text; g.textAlign = 'center';
    for (const p of [0, 100, 200, 300]) { g.fillText(p + ' %', X(p), T + ph + 13); }
    g.strokeStyle = C.cursor; g.setLineDash([4, 3]); g.beginPath(); g.moveTo(X(100), T); g.lineTo(X(100), T + ph); g.stroke(); g.setLineDash([]);
    this.res.forEach((r, k) => {
      const y = T + k * rh + rh * 0.18, hh = rh * 0.64, p = (r.medida / r.real) * 100;
      const bad = Math.abs(p - 100) > 15;
      g.fillStyle = bad ? C.bad : C.line; g.fillRect(L + 1, y, X(p) - L - 1, hh);
      if (p > 300) { g.beginPath(); g.moveTo(X(300) + 1, y); g.lineTo(X(300) + 7, y + hh / 2); g.lineTo(X(300) + 1, y + hh); g.fill(); }
      g.fillStyle = C.text; g.textAlign = 'right'; g.fillText(`${r.m}${r.el}`, L - 6, y + hh * 0.75);
      g.textAlign = 'left'; g.fillText(`${fmtC(r.medida)} µg/L`, L + pw + 6, y + hh * 0.75);
      if (r.m === this.mset) { g.strokeStyle = C.cursor; g.strokeRect(L - 42, y - 1, pw + R + 40, hh + 2); }
    });
    g.fillStyle = C.text; g.textAlign = 'left'; g.font = '10px Segoe UI, sans-serif';
    g.fillText('Recuperación = medida / real', L, T - 3);
  }
}

const fmtC = (v) => (v >= 100 ? v.toFixed(0) : v >= 10 ? v.toFixed(1) : v >= 1 ? v.toFixed(2) : v.toFixed(3)).replace('.', ',');
function fmtCps(v) { if (v >= 1e6) return (v / 1e6).toFixed(1).replace('.', ',') + ' Mcps'; if (v >= 1e3) return (v / 1e3).toFixed(1).replace('.', ',') + ' kcps'; return v.toFixed(0) + ' cps'; }

/** Definición del panel de simulación que construye el visor. */
export const PANEL = {
  titulo: 'Simulación del ICP-MS',
  controles: [
    { id: 'muestra', label: 'Muestra', value: 'hcl', opciones: Object.entries(MUESTRAS).map(([k, v]) => [k, v.nombre]) },
    { id: 'celda', label: 'Celda ORS⁴', value: 'nogas', opciones: [['nogas', 'Sin gas'], ['he', 'Helio (KED)']] },
    { id: 'velocidad', label: 'Velocidad', value: '1', opciones: [['0.5', 'Lenta'], ['1', 'Normal'], ['2', 'Rápida']] },
  ],
  lecturas: [['mz', 'm/z (cuadrupolo)'], ['cps', 'Señal'], ['bec', 'BEC'], ['as', '⁷⁵As medido']],
  nota: 'El blanco de calibración (ácido limpio) descuenta las interferencias del plasma, pero no las de la matriz (Cl, Ca, Na, S): sin gas producen resultados por exceso. BEC = concentración equivalente al fondo. Valores orientativos.',
  leyenda: [['#f2a33a', 'ion del analito'], ['#c24bef', 'ion poliatómico'], ['#9fb3c8', 'helio'], ['#5fb8e8', 'aerosol']],
  graficas: ['Espectro m/z 50–82 (escala logarítmica)', 'Concentración medida frente a la real'],
};
