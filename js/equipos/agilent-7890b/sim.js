// Simulación: separación de una mezcla homóloga en una columna capilar con detección por FID.
// Modelo termodinámico de retención (van 't Hoff + índices de Kovats) y ecuación de Golay (gc-modelo.js). La animación 3D muestra
// la inyección del 7693A, el vapor en el liner (y la parte que sale por el venteo de split), las bandas avanzando por la columna,
// la llama del FID y los iones que recoge el colector; el cromatograma se construye a la vez. El tiempo está acelerado.
import * as THREE from 'three';
import { PointPool, chartColors, setupCanvas } from '../../simcore.js';
import { cromatograma, senal, tempEn, alturaPlato, fondoFID, MEZCLAS, GASES, UTE } from '../../anim2d/escenas/gc-modelo.js';
import { FY } from './geometria.js';

export const PROGS = {
  iso60: { T0: 60 }, iso100: { T0: 100 }, iso150: { T0: 150 },
  r5: { T0: 40, t0: 1, rampa: 5, Tf: 250, tf: 2 }, r10: { T0: 40, t0: 1, rampa: 10, Tf: 250, tf: 2 }, r25: { T0: 40, t0: 1, rampa: 25, Tf: 250, tf: 2 },
};
const PORT = { he25: ['he', 25], he35: ['he', 35], he50: ['he', 50], h2_40: ['h2', 40], h2_70: ['h2', 70], n2_12: ['n2', 12], n2_30: ['n2', 30] };
const COLS = { c15: [15, 0.25, 0.25], c30: [30, 0.25, 0.25], c60: [60, 0.25, 0.25], c30g: [30, 0.25, 1.0], c32: [30, 0.32, 0.25] };
const T_INY = 2.26;      // instante de la inyección dentro del ciclo de la animación (s)

const fmt = (v, d = 1) => v.toLocaleString('es-ES', { minimumFractionDigits: d, maximumFractionDigits: d });
const ease = (k) => (k <= 0 ? 0 : k >= 1 ? 1 : k * k * (3 - 2 * k));
const tramo = (t, a, b) => ease((t - a) / (b - a));
function mulberry(a) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

export class Simulacion {
  constructor(eq, els) {
    this.eq = eq;
    this.els = { cro: els.canvases[0], vd: els.canvases[1], ...els.read };
    this.bandas = new PointPool(eq.root, 800, 0.32);
    this.vapor = new PointPool(eq.root, 260, 0.26);
    this.iones = new PointPool(eq.root, 120, 0.12);
    this.path = eq.recorridoColumna;
    this.splitPath = new THREE.CatmullRomCurve3(eq.lineaSplit.map((p) => new THREE.Vector3(p[0], p[1], p[2])), false, 'centripetal').getSpacedPoints(120);
    const R = mulberry(17);
    const gauss = () => Math.sqrt(-2 * Math.log(1 - R())) * Math.cos(2 * Math.PI * R());
    this.gof = Array.from({ length: 16 }, () => gauss());
    this.jit = Array.from({ length: 16 }, () => [R() - 0.5, R() - 0.5, R() - 0.5]);
    this.vap = Array.from({ length: 90 }, () => [R(), R() * Math.PI * 2, Math.sqrt(R())]);
    this.ruido = Float32Array.from({ length: 700 }, () => gauss());
    this.p = { muestra: 'alcanos', prog: 'r10', portador: 'he35', split: '50', columna: 'c30' };
    this.active = false; this.ciclo = 0; this.t = 0; this.frame = 0;
    this.calc();
    this.setVisible(false);
  }

  setVisible(v) { this.bandas.visible = v; this.vapor.visible = v; this.iones.visible = v; }
  setTheme(light) { for (const p of [this.bandas, this.vapor, this.iones]) p.setTheme(light); this.light = light; this.colores(); }
  colores() { this.colsCss = this.cols.map((c) => { const h = {}; c.getHSL(h); return `hsl(${Math.round(h.h * 360)} 80% ${this.light ? 38 : 62}%)`; }); }

  calc() {
    const p = this.p, [gas, u] = PORT[p.portador], [L, dMm, df] = COLS[p.columna];
    this.prog = PROGS[p.prog]; this.gas = gas; this.u = u; this.col = { L, dMm, df };
    this.res = cromatograma({ mezcla: p.muestra, prog: this.prog, gas, u, L, dMm, df, split: +p.split });
    const n = this.res.comps.length;
    this.cols = this.res.comps.map((_, i) => new THREE.Color().setHSL(0.07 + (i / Math.max(1, n - 1)) * 0.62, 0.85, 0.55));
    this.colores();
    const tE = this.res.tEnd;
    this.base0 = fondoFID(this.prog.T0, df);
    this.maxAlto = Math.max(1, ...this.res.eluidos.map((c) => c.alto));
    this.ymax = (fondoFID(tempEn(this.prog, tE / 60), df) + this.maxAlto) * 1.4;
    this.dur = Math.min(22, Math.max(9, 7 + (tE / 60) * 0.4));
    this.ciclo = 0;
  }

  start() { this.active = true; this.setVisible(true); this.ciclo = 0; }
  stop() {
    this.active = false; this.setVisible(false);
    const e = this.eq;
    for (const m of e.llama) m.opacity = 0;
    e.glowIgn.emissive.setHex(0); e.resistencia.emissive.setHex(0);
    for (const g of [e.carro, e.jeringa, e.embolo, e.porta, e.pie]) g.position.y = 0;
    e.torreta.rotation.y = 0; e.muestraJeringa.scale.y = 1; e.muestraJeringa.position.y = 61.7;
  }
  setControl(id, v) { this.p[id] = v; this.calc(); }
  options() { return null; }
  value() { return null; }
  keepGlow() { this.aplicarBrillos(); }

  /** Tiempo cromatográfico (s) correspondiente al instante actual del ciclo. */
  tCro() { return this.ciclo < T_INY ? -1 : Math.min(1, (this.ciclo - T_INY) / this.dur) * this.res.tEnd; }

  aplicarBrillos() {
    const e = this.eq, tc = this.tCro();
    const s = tc < 0 ? this.base0 : senal(this.res, tc, this.prog, this.col.df);
    const k = Math.min(1, Math.max(0, (s - this.base0) / this.maxAlto));
    e.llama[0].opacity = 0.16 + 0.55 * k; e.llama[1].opacity = 0.22 + 0.5 * k;
    const enc = this.t < 0.9 ? 1 - this.t / 0.9 : 0;              // encendido de la llama al arrancar
    e.glowIgn.emissive.setRGB(1.0 * enc, 0.45 * enc, 0.1 * enc); e.glowIgn.emissiveIntensity = 2;
    const T = tc < 0 ? this.prog.T0 : tempEn(this.prog, tc / 60);
    const subiendo = this.prog.rampa && tc > this.prog.t0 * 60 && T < this.prog.Tf;
    const ir = subiendo ? 0.75 : 0.12 + 0.3 * (T - 30) / 230;
    e.resistencia.emissive.setRGB(1.0 * ir, 0.32 * ir, 0.08 * ir); e.resistencia.emissiveIntensity = 1.4;
    this.senalAct = s; this.Tact = T; this.kSen = k;
  }

  update(dt) {
    if (!this.active) return;
    dt = Math.min(dt, 0.05);
    this.t += dt; this.ciclo += dt;
    if (this.ciclo > T_INY + this.dur + 3) this.ciclo = 0;
    const e = this.eq, c = this.ciclo;
    /* --- inyector automático: muestreo en el vial, giro de la torreta e inyección --- */
    const rot = tramo(c, 0, 0.35) - tramo(c, 1.4, 1.75);
    e.torreta.rotation.y = rot * (36 * Math.PI) / 180;
    const d = -3.2 * (tramo(c, 0.35, 0.75) - tramo(c, 1.05, 1.4)) - 9.7 * (tramo(c, 1.75, 2.2) - tramo(c, 2.32, 2.7));
    const tope = c < 1.5 ? -1.7 : -7.0;                           // el pie apoya en el vial o en la tuerca del septum
    e.carro.position.y = d; e.jeringa.position.y = d; e.pie.position.y = Math.max(d, tope);
    const pl = 1.0 * (tramo(c, 0.75, 1.05) - tramo(c, 2.2, 2.3));
    e.embolo.position.y = pl; e.porta.position.y = pl;
    const lleno = 0.25 + 0.75 * pl;
    e.muestraJeringa.scale.y = lleno; e.muestraJeringa.position.y = 61.1 + 0.6 * lleno;
    this.aplicarBrillos();

    const tc = this.tCro(), Lcm = this.col.L * 100, NP = this.path.length - 1;
    /* --- bandas en la columna --- */
    this.bandas.begin();
    if (tc >= 0) this.res.comps.forEach((cp, i) => {
      const f = tc / cp.dtTray, j = Math.min(cp.tray.length - 1, Math.floor(f)), r = f - j;
      const z = j + 1 < cp.tray.length ? cp.tray[j] + (cp.tray[j + 1] - cp.tray[j]) * r : cp.tray[cp.tray.length - 1];
      if (cp.tR != null && tc > cp.tR + 2 * cp.sigma) return;
      const sf = Math.max(0.004, (Math.sqrt(cp.H * Math.max(z, 0.002) * Lcm) / Lcm) * 3 + 0.003);
      for (let q = 0; q < 16; q++) {
        const s = z + sf * this.gof[q];
        if (s < 0 || s > 1) continue;
        const P = this.path[Math.round(s * NP)], J = this.jit[q];
        this.bandas.push({ x: P.x + J[0] * 0.18, y: P.y + J[1] * 0.18, z: P.z + J[2] * 0.18 }, this.cols[i], 1);
      }
    });
    this.bandas.end();
    /* --- vapor en el liner y salida por el venteo de split --- */
    this.vapor.begin();
    const sp = +this.p.split, tv = c - T_INY, vida = sp ? 0.8 : 2.6;
    if (tv > 0 && tv < vida + 1.2) {
      const L = this.eq.liner, nv = Math.round(70 * Math.max(0, 1 - tv / vida));
      for (let q = 0; q < nv; q++) {
        const [a, b, rr] = this.vap[q];
        const y = 45.6 - a * 6.6 * Math.min(1, tv * 3);
        this.vapor.push({ x: L.x + Math.cos(b) * rr * 0.17, y, z: L.z + Math.sin(b) * rr * 0.17 }, this.cols[q % this.cols.length], 0.85);
      }
      if (sp) for (let q = 0; q < 40; q++) {
        const ph = tv * 1.6 - q * 0.03;
        if (ph < 0 || ph > 1) continue;
        const P = this.splitPath[Math.round(ph * (this.splitPath.length - 1))];
        this.vapor.push(P, this.cols[q % this.cols.length], 0.7);
      }
    }
    this.vapor.end();
    /* --- iones CHO⁺ en el FID --- */
    this.iones.begin();
    const ni = Math.round(70 * this.kSen);
    const P0 = this.eq.punta, CI = new THREE.Color(this.light ? 0xd9480f : 0xffa424);
    for (let q = 0; q < ni; q++) {
      const ph = (this.t * 2.2 + q * 0.137) % 1, a = q * 2.399;
      const rr = 0.05 + 0.52 * ph;
      this.iones.push({ x: P0.x + Math.cos(a) * rr, y: P0.y + 0.25 + ph * 2.2, z: P0.z + Math.sin(a) * rr }, CI, 1);
    }
    this.iones.end();

    if (++this.frame % 2 === 0) this.dibujar();
  }

  /* -------------------- paneles 2D -------------------- */
  dibujar() {
    this.dibujarCromatograma();
    this.dibujarVanDeemter();
    const r = this.res, e = this.els;
    e.temp.textContent = `${fmt(this.Tact ?? this.prog.T0, 0)} °C`;
    e.tm.textContent = `${fmt(r.tM / 60, 2)} min`;
    e.flujo.textContent = `${fmt(r.neu.F, 2)} mL/min`;
    e.pres.textContent = `${fmt(r.neu.pKPa, 0)} kPa · ${fmt(r.neu.psi, 1)} psi`;
    e.rs.textContent = r.crit ? `${fmt(r.crit.Rs, r.crit.Rs < 10 ? 2 : 0)} (${r.crit.a.corto}/${r.crit.b.corto})` : '—';
    e.n.textContent = r.ref ? `${Math.round(r.ref.N / 1000).toLocaleString('es-ES')} 000` : '—';
  }

  dibujarCromatograma() {
    const [g, w, h] = setupCanvas(this.els.cro);
    const C = chartColors(), r = this.res, tE = r.tEnd;
    const L = 44, Rr = 46, T = 16, B = 26, pw = w - L - Rr, ph = h - T - B;
    const X = (t) => L + (t / tE) * pw, Y = (v) => T + ph - Math.min(1.02, v / this.ymax) * ph;
    g.font = '11px Segoe UI, sans-serif'; g.lineWidth = 1;
    g.strokeStyle = C.axis; g.beginPath(); g.moveTo(L, T); g.lineTo(L, T + ph); g.lineTo(L + pw, T + ph); g.lineTo(L + pw, T); g.stroke();
    // ejes: tiempo (min), señal (pA) y temperatura (°C)
    g.fillStyle = C.text; g.textAlign = 'center';
    const tm = tE / 60, paso = tm > 40 ? 10 : tm > 16 ? 4 : tm > 6 ? 2 : tm > 3 ? 1 : 0.5;
    for (let m = 0; m <= tm + 1e-6; m += paso) { g.fillText(fmt(m, paso < 1 ? 1 : 0), X(m * 60), T + ph + 13); }
    g.fillText('min', L + pw - 10, T + ph + 24);
    g.textAlign = 'right';
    const ys = this.ymax > 2000 ? 1000 : this.ymax > 400 ? 200 : this.ymax > 100 ? 50 : this.ymax > 40 ? 10 : 5;
    for (let v = 0; v <= this.ymax; v += ys) { const y = Y(v); g.fillText(v.toLocaleString('es-ES'), L - 4, y + 4); g.strokeStyle = C.grid; g.beginPath(); g.moveTo(L, y); g.lineTo(L + pw, y); g.stroke(); }
    g.save(); g.translate(11, T + ph / 2); g.rotate(-Math.PI / 2); g.textAlign = 'center'; g.fillText('señal FID (pA)', 0, 0); g.restore();
    g.textAlign = 'left';
    const YT = (Tc) => T + ph - (Tc / 300) * ph;
    for (const Tc of [0, 100, 200, 300]) g.fillText(`${Tc}`, L + pw + 4, YT(Tc) + 4);
    g.save(); g.translate(w - 8, T + ph / 2); g.rotate(-Math.PI / 2); g.textAlign = 'center'; g.fillStyle = C.cursor; g.fillText('T del horno (°C)', 0, 0); g.restore();
    // programa de temperatura
    g.strokeStyle = C.cursor; g.setLineDash([4, 4]); g.lineWidth = 1.2; g.beginPath();
    for (let i = 0; i <= 120; i++) { const t = (i / 120) * tE, y = YT(tempEn(this.prog, t / 60)); i ? g.lineTo(X(t), y) : g.moveTo(X(t), y); }
    g.stroke(); g.setLineDash([]);
    // señal hasta el instante actual: en cada columna de píxeles, el máximo de la señal en su intervalo de tiempo
    // (los picos capilares duran pocos segundos y no deben perderse al muestrear)
    const tc = this.tCro(), nPx = Math.max(2, Math.round(pw)), dtPx = tE / nPx;
    const iMax = tc < 0 ? -1 : Math.floor(tc / dtPx);
    if (iMax > 0) {
      const ys = [];
      for (let i = 0; i <= iMax; i++) {
        const a = i * dtPx, b = a + dtPx;
        let s = fondoFID(tempEn(this.prog, (a + b) / 120), this.col.df) + 0.12 * this.ruido[i % 700];
        for (const cp of r.eluidos) { const d = cp.tR < a ? a - cp.tR : cp.tR > b ? cp.tR - b : 0; if (d < 6 * cp.sigma) s += cp.alto * Math.exp(-0.5 * (d / cp.sigma) ** 2); }
        ys.push([X(a), Y(s)]);
      }
      const grd = g.createLinearGradient(0, T, 0, T + ph); grd.addColorStop(0, C.fill0); grd.addColorStop(1, C.fill1);
      g.beginPath(); g.moveTo(X(0), T + ph); for (const [x, y] of ys) g.lineTo(x, y);
      g.lineTo(ys[ys.length - 1][0], T + ph); g.closePath(); g.fillStyle = grd; g.fill();
      g.beginPath(); ys.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
      g.strokeStyle = C.line; g.lineWidth = 1.3; g.stroke(); g.lineWidth = 1;
    }
    // etiquetas de los picos ya registrados (nombre y tiempo de retención)
    g.textAlign = 'center';
    let xPrev = -99, fila = 0;
    r.eluidos.forEach((cp) => {
      if (tc < cp.tR + cp.sigma) return;
      const i = r.comps.indexOf(cp), x = X(cp.tR), y = Y(fondoFID(tempEn(this.prog, cp.tR / 60), this.col.df) + cp.alto);
      // picos muy próximos: el nombre sube una fila y se omite el tiempo; si aún no cabe, no se rotula
      const cerca = x - xPrev < 24;
      fila = cerca ? fila + 1 : 0;
      if (fila > 1) return;
      g.font = '600 10.5px Segoe UI, sans-serif'; g.fillStyle = this.colsCss[i];
      g.fillText(cp.corto, x, y - 15 - fila * 11);
      if (!cerca) { g.fillStyle = C.text; g.font = '9.5px Segoe UI, sans-serif'; g.fillText(fmt(cp.tR / 60, 2), x, y - 4); }
      xPrev = x;
    });
    // cursor y rótulos
    if (tc >= 0) { g.strokeStyle = C.cursor; g.beginPath(); g.moveTo(X(tc), T); g.lineTo(X(tc), T + ph); g.stroke(); }
    g.fillStyle = C.text; g.font = '11px Segoe UI, sans-serif'; g.textAlign = 'left';
    const sp = +this.p.split, { L: Lc, dMm, df } = this.col;
    const titulo = pw > 420 ? `${MEZCLAS[this.p.muestra].nombre.split(' (')[0]} · ${Lc} m × ${fmt(dMm, 2)} mm × ${fmt(df, 2)} µm · ${GASES[this.gas].nombre} ${this.u} cm/s · ${sp ? `split ${sp}:1` : 'splitless'}`
      : `${Lc} m × ${fmt(dMm, 2)} mm × ${fmt(df, 2)} µm · ${this.gas === 'he' ? 'He' : this.gas === 'h2' ? 'H₂' : 'N₂'} ${this.u} cm/s · ${sp ? `${sp}:1` : 'splitless'}`;
    g.fillText(titulo, L + 6, T + 2);
    const no = r.comps.filter((cp) => cp.tR == null);
    if (no.length) { g.textAlign = 'right'; g.fillStyle = C.bad; g.fillText(`No eluyen en ${Math.round(tE / 60)} min: ${no.map((cp) => cp.corto).join(', ')}`, L + pw - 6, T + 16); }
    if (r.crit && tc > r.crit.b.tR && !no.length) {
      g.textAlign = 'right'; g.fillStyle = r.crit.Rs < 1.5 ? C.bad : C.text;
      g.fillText(`Par crítico ${r.crit.a.corto}/${r.crit.b.corto}: Rs = ${fmt(r.crit.Rs, 2)}`, L + pw - 6, T + 16);
    }
  }

  dibujarVanDeemter() {
    const [g, w, h] = setupCanvas(this.els.vd);
    const C = chartColors();
    const L = 34, R = 8, T = 12, B = 26, pw = w - L - R, ph = h - T - B;
    const uMax = 80, hMax = 1.0;
    const X = (u) => L + (u / uMax) * pw, Y = (v) => T + ph - Math.min(1.05, v / hMax) * ph;
    g.font = '10px Segoe UI, sans-serif'; g.strokeStyle = C.axis;
    g.beginPath(); g.moveTo(L, T); g.lineTo(L, T + ph); g.lineTo(L + pw, T + ph); g.stroke();
    g.fillStyle = C.text; g.textAlign = 'center';
    for (let u = 0; u <= uMax; u += 20) g.fillText(u, X(u), T + ph + 12);
    g.fillText('ū (cm/s)', L + pw - 18, T + ph + 23);
    g.textAlign = 'right';
    for (let v = 0; v <= hMax + 1e-6; v += 0.25) { g.fillText(fmt(v, 2), L - 3, Y(v) + 3); g.strokeStyle = C.grid; g.beginPath(); g.moveTo(L, Y(v)); g.lineTo(L + pw, Y(v)); g.stroke(); }
    g.save(); g.translate(9, T + ph / 2); g.rotate(-Math.PI / 2); g.textAlign = 'center'; g.fillText('H (mm)', 0, 0); g.restore();
    // curvas de referencia (k = 3 a 100 °C) para comparar los tres gases en las mismas condiciones
    const k = 3, Tk = 373;
    const opt = { r: this.col.dMm / 20, df: this.col.df * 1e-4, T: Tk };
    const curvas = [['n2', 'N₂'], ['he', 'He'], ['h2', 'H₂']];
    for (const [gid, et] of curvas) {
      const act = gid === this.gas;
      g.beginPath(); let best = [0, 9];
      for (let i = 1; i <= 160; i++) {
        const u = (i / 160) * uMax, H = (alturaPlato(u, k, { ...opt, gas: gid }) / UTE) * 10;
        if (H < best[1]) best = [u, H];
        i > 1 ? g.lineTo(X(u), Y(H)) : g.moveTo(X(u), Y(H));
      }
      g.strokeStyle = act ? C.line : C.axis; g.lineWidth = act ? 2 : 1; g.globalAlpha = act ? 1 : 0.6; g.stroke(); g.globalAlpha = 1; g.lineWidth = 1;
      g.fillStyle = act ? C.line : C.text; g.textAlign = 'center'; g.fillText(et, X(best[0]), Y(best[1]) + 13);
    }
    const Hn = (alturaPlato(this.u, k, { ...opt, gas: this.gas }) / UTE) * 10;
    g.beginPath(); g.arc(X(this.u), Y(Hn), 4.5, 0, Math.PI * 2); g.fillStyle = C.peak; g.fill();
    g.fillStyle = C.text; g.textAlign = 'left';
    g.textAlign = 'right';
    g.fillText(`${fmt(this.col.dMm, 2)} mm × ${fmt(this.col.df, 2)} µm · k = 3 · 100 °C`, L + pw - 2, T + 6);
  }
}

/** Definición del panel de simulación que construye el visor. */
export const PANEL = {
  titulo: 'Simulación de la separación (GC-FID)',
  controles: [
    { id: 'muestra', label: 'Muestra', value: 'alcanos', opciones: [['alcanos', 'n-Alcanos C8–C16'], ['btex', 'BTEX']] },
    { id: 'prog', label: 'Horno', value: 'r10', opciones: [['iso60', 'Isotermo 60 °C'], ['iso100', 'Isotermo 100 °C'], ['iso150', 'Isotermo 150 °C'],
      ['r5', '40 °C → 5 °C/min → 250 °C'], ['r10', '40 °C → 10 °C/min → 250 °C'], ['r25', '40 °C → 25 °C/min → 250 °C']] },
    { id: 'portador', label: 'Gas portador', value: 'he35', opciones: [['he25', 'He · 25 cm/s'], ['he35', 'He · 35 cm/s'], ['he50', 'He · 50 cm/s'],
      ['h2_40', 'H₂ · 40 cm/s'], ['h2_70', 'H₂ · 70 cm/s'], ['n2_12', 'N₂ · 12 cm/s'], ['n2_30', 'N₂ · 30 cm/s']] },
    { id: 'split', label: 'Inyección', value: '50', opciones: [['0', 'Splitless (purga 0,75 min)'], ['10', 'Split 10:1'], ['50', 'Split 50:1'], ['100', 'Split 100:1']] },
    { id: 'columna', label: 'Columna', value: 'c30', opciones: [['c15', '15 m × 0,25 mm × 0,25 µm'], ['c30', '30 m × 0,25 mm × 0,25 µm'], ['c60', '60 m × 0,25 mm × 0,25 µm'],
      ['c30g', '30 m × 0,25 mm × 1,0 µm'], ['c32', '30 m × 0,32 mm × 0,25 µm']] },
  ],
  lecturas: [['temp', 'T del horno'], ['tm', 't<sub>M</sub> (tiempo muerto)'], ['flujo', 'Caudal de columna*'], ['pres', 'Presión en cabeza*'],
    ['rs', 'R<sub>s</sub> del par crítico'], ['n', 'N de la columna (ref.)']],
  nota: 'Modelo simplificado: fase de 100 % dimetilpolisiloxano, retención de van \'t Hoff con índices de Kovats aproximados y ensanchamiento según Golay. 1 nmol de cada compuesto; FID ≈ 0,015 C por gramo de carbono. Velocidad media del portador constante; sin pico del disolvente ni efecto disolvente. * A la temperatura inicial del horno, salida a presión atmosférica, caudal referido a 25 °C. Tiempo acelerado.',
  leyenda: [['#e8590c', 'bandas en la columna'], ['#4dabf7', 'vapor en el liner'], ['#f08c00', 'iones en el FID']],
  graficas: ['Cromatograma (FID)', 'Curva de van Deemter (Golay)'],
};
