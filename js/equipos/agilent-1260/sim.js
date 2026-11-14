// Simulación didáctica del HPLC 1260 Infinity II: separación en fase reversa de un analgésico combinado (paracetamol, cafeína y
// ácido acetilsalicílico) con su producto de degradación, el ácido salicílico, en una columna C18 con agua acidificada (A) y
// acetonitrilo (B), en modo isocrático o en gradiente, con detección por diodos (DAD).
// Modelos (valores orientativos, no de un método validado):
//  · retención: fuerza del disolvente lineal, log k = a − S·φ + b·(1/T − 1/303 K); en gradiente se integra el avance de la banda
//    viendo la composición que le llega con el retraso del volumen muerto del sistema (≈ 0,8 mL) y de su propia posición en la columna;
//  · eficacia: ecuación de Knox, h = A·ν^⅓ + B/ν + C·ν, con D_m ∝ T/η;
//  · presión: ley de Darcy, ΔP = Φ·η·L·u/dp², con la viscosidad de las mezclas agua-acetonitrilo y su variación con la temperatura;
//  · absorbancia: Lambert-Beer en el ápice (celda de 10 mm) con espectros aproximados (bandas gaussianas en los máximos de la bibliografía).
import * as THREE from 'three';
import { PointPool, chartColors, setupCanvas } from '../../simcore.js';
import { C, OPT } from './geometria.js';

/* ---------- compuestos ---------- */
export const COMP = [
  { id: 'para', nombre: 'Paracetamol', corto: 'paracet.', mw: 151.16, c: 0.05, a: 0.80, S: 3.3, b: 650, col: '#2f9e44', bandas: [[243, 10100, 16], [200, 9000, 9]] },
  { id: 'caf', nombre: 'Cafeína', corto: 'cafeína', mw: 194.19, c: 0.02, a: 1.20, S: 3.7, b: 750, col: '#1971c2', bandas: [[273, 9700, 13], [206, 24000, 9]] },
  { id: 'asa', nombre: 'Ácido acetilsalicílico', corto: 'AAS', mw: 180.16, c: 0.05, a: 2.05, S: 4.6, b: 850, col: '#e8590c', bandas: [[228, 8500, 12], [277, 1100, 11], [200, 20000, 8]] },
  { id: 'sal', nombre: 'Ácido salicílico', corto: 'salicílico', mw: 138.12, c: 0.005, a: 2.45, S: 4.9, b: 950, col: '#ae3ec9', bandas: [[236, 8000, 12], [303, 3600, 15], [205, 20000, 8]] },
];
const eps = (cp, l) => cp.bandas.reduce((s, [l0, e, w]) => s + e * Math.exp(-((l - l0) ** 2) / (2 * w * w)), 0);

/* ---------- columnas ---------- */
const COLUMNAS = {
  c150: { nombre: 'C18 150 × 4,6 mm, 5 µm', L: 15, dc: 0.46, dp: 5e-4, et: 0.66, phi: 1300, knox: [1.0, 2.0, 0.05], kf: 1 },
  c100: { nombre: 'C18 100 × 3,0 mm, 2,7 µm (superficialmente porosa)', L: 10, dc: 0.30, dp: 2.7e-4, et: 0.55, phi: 1300, knox: [0.65, 1.6, 0.06], kf: 0.75 },
};
const GRADIENTES = {
  g1: { nombre: '10 → 60 % B en 10 min', p: [[0, 10], [10, 60], [13, 60]] },
  g2: { nombre: '5 → 95 % B en 15 min', p: [[0, 5], [15, 95], [17, 95]] },
  g3: { nombre: '20 → 50 % B en 6 min', p: [[0, 20], [6, 50], [9, 50]] },
};
const VD = 0.8;                         // volumen de retardo del sistema (mL), aproximado: bomba 0,6–0,9 mL según la presión
const VINJ = 5;                         // µL inyectados
const PMAX = 600;                       // bar, límite de la bomba G7111B (hasta 5 mL/min)

/** Viscosidad (mPa·s) de agua-acetonitrilo con fracción φ de ACN a T (K): mezcla logarítmica con término de exceso y Arrhenius. */
function visc(phi, T) {
  const l = phi * Math.log(0.34) + (1 - phi) * Math.log(0.89) + 1.93 * phi * (1 - phi);
  return Math.exp(l) * Math.exp(1800 * (1 / T - 1 / 298.15));
}

export class Simulacion {
  constructor(eq, els) {
    this.r = eq.circuito;
    this.els = { cro: els.canvases[0], dad: els.canvases[1], ...els.read };
    const A = this.r.group;
    this.pool = new PointPool(A, 1600, 0.75);
    this.bandPool = new PointPool(A, 900, 0.95);
    this.ctl = { modo: 'grad', org: '30', grad: 'g1', caudal: '1', temp: '30', col: 'c150', lambda: '254', vista: 'esp:1' };
    this.light = true;
    this.construirRutas();
    this.calcular();
    this.setVisible(false);
  }

  /* ---------- interfaz con el visor ---------- */
  setVisible(v) { this.pool.visible = v; this.bandPool.visible = v; for (const h of this.r.haces) h.visible = v; }
  setTheme(light) {
    this.light = light;
    this.pool.setTheme(light); this.bandPool.setTheme(light);
    for (const h of this.r.haces) { h.material.blending = light ? THREE.NormalBlending : THREE.AdditiveBlending; h.material.needsUpdate = true; }
    if (this.active) this.drawUI();
  }
  start() { this.active = true; this.setVisible(true); this.reiniciarCorrida(); }
  stop() {
    this.active = false; this.setVisible(false);
    for (const h of this.r.haces) h.material.opacity = 0;
    this.r.rotor.rotation.z = 0; for (const p of this.r.pistones) p.position.z = 0;
    this.r.canal.material.color.setHex(0xbfe0ff); this.r.canal.material.emissive.setHex(0);
    for (const l of this.r.mcgvLed) l.material.emissiveIntensity = 0;
  }
  setControl(id, v) { this.ctl[id] = v; this.calcular(); this.reiniciarCorrida(); }
  options() { return null; }
  value() { return null; }

  /* ---------- modelo cromatográfico ---------- */
  phiProg(t) {                                    // fracción de B que sale de la bomba en el instante t (min)
    if (this.ctl.modo === 'iso') return +this.ctl.org / 100;
    const p = GRADIENTES[this.ctl.grad].p;
    if (t <= p[0][0]) return p[0][1] / 100;
    for (let i = 1; i < p.length; i++) if (t <= p[i][0]) { const [t0, b0] = p[i - 1], [t1, b1] = p[i]; return (b0 + (b1 - b0) * (t - t0) / (t1 - t0)) / 100; }
    return p[p.length - 1][1] / 100;
  }
  logk(cp, phi) { const T = this.T; return cp.a + Math.log10(this.col.kf) - cp.S * phi + cp.b * (1 / T - 1 / 303.15); }
  calcular() {
    const col = (this.col = COLUMNAS[this.ctl.col]);
    const F = (this.F = +this.ctl.caudal), T = (this.T = +this.ctl.temp + 273.15);
    const V0 = col.et * Math.PI * (col.dc / 2) ** 2 * col.L;                 // mL
    const t0 = (this.t0 = V0 / F), tD = (this.tD = VD / F);
    // eficacia (Knox) con la viscosidad media de la corrida
    const phiMed = this.ctl.modo === 'iso' ? +this.ctl.org / 100 : 0.5 * (this.phiProg(0) + this.phiProg(12));
    const eta = visc(phiMed, T), Dm = 1.0e-5 * (T / 303.15) * (0.85 / eta);  // cm²/s
    const u = col.L / (t0 * 60), nu = (u * col.dp) / Dm, [kA, kB, kC] = col.knox;
    const h = kA * nu ** (1 / 3) + kB / nu + kC * nu;
    this.N = col.L / (h * col.dp); this.nu = nu;
    // presión (columna + sistema) a lo largo de la corrida
    const uS = (F / 60 * 1e-6) / (Math.PI * (col.dc / 200) ** 2);           // velocidad superficial (m/s)
    this.dP = (phi) => { const e = visc(phi, T); return (col.phi * e * 1e-3 * (col.L / 100) * uS) / (col.dp / 100) ** 2 / 1e5 + 4 * F * e / 0.9; };
    // trayectorias y tiempos de retención
    const dt = t0 / 300, tMax = 60;
    this.picos = COMP.map((cp) => {
      let x = 0, t = 0, ke = 0; const tray = [[0, 0]];
      while (x < 1 && t < tMax) {
        const phi = this.phiProg(t - tD - x * t0);
        ke = 10 ** this.logk(cp, phi);
        x += dt / (t0 * (1 + ke)); t += dt;
        if (tray.length < 2000 && (tray.length % 1 === 0)) tray.push([t, Math.min(1, x)]);
      }
      const tR = x >= 1 ? t : Infinity, sig = (t0 * (1 + ke)) / Math.sqrt(this.N);
      const sigV = (sig * F) / 1000;                                         // L
      const nmol = (cp.c * VINJ * 1e-3) / cp.mw * 1e-3;                      // mol inyectados
      const cmax = nmol / (Math.sqrt(2 * Math.PI) * sigV);                   // mol/L en el ápice
      return { cp, tR, sig, ke, tray, cmax, A: (l) => eps(cp, l) * 1.0 * cmax * 1000 };   // mAU con b = 1 cm
    });
    const tRs = this.picos.filter((p) => isFinite(p.tR));
    const ultimo = tRs.reduce((m, p) => Math.max(m, p.tR + 4 * p.sig), 0);
    const finProg = this.ctl.modo === 'iso' ? 0 : GRADIENTES[this.ctl.grad].p.at(-1)[0] + tD;
    this.tRun = Math.min(40, Math.max(4, ultimo + 0.4, finProg));
    // presión máxima: φ medio en la columna en cada instante
    let pm = 0; this.pres = [];
    for (let i = 0; i <= 120; i++) { const t = (i / 120) * this.tRun, p = this.dP(this.phiProg(t - tD - 0.5 * t0)); this.pres.push(p); pm = Math.max(pm, p); }
    this.pMax = pm; this.sobre = pm > PMAX;
    // resolución entre picos consecutivos
    const ord = [...this.picos].filter((p) => isFinite(p.tR)).sort((a, b) => a.tR - b.tR);
    this.rs = [];
    for (let i = 1; i < ord.length; i++) this.rs.push({ a: ord[i - 1], b: ord[i], v: (ord[i].tR - ord[i - 1].tR) / (2 * (ord[i].sig + ord[i - 1].sig)) });
    this.rsMin = this.rs.reduce((m, r) => (!m || r.v < m.v ? r : m), null);
    this.mapa = null;
  }
  senal(t, l) {
    let s = 0;
    for (const p of this.picos) if (isFinite(p.tR)) s += p.A(l) * Math.exp(-((t - p.tR) ** 2) / (2 * p.sig * p.sig));
    if (this.ctl.modo === 'grad') s += 0.6 * Math.pow(220 / l, 6) * this.phiProg(t - this.tD - this.t0);   // deriva de la línea base en gradiente
    return s;
  }

  /* ---------- recorrido de las partículas (coordenadas locales del circuito) ---------- */
  construirRutas() {
    const R = this.r.rutas, V = (x, y, z) => new THREE.Vector3(x, y, z);
    const cr = (pts) => new THREE.CatmullRomCurve3(pts, false, 'centripetal');
    const ln = (a, b) => new THREE.LineCurve3(a.clone(), b.clone());
    const c1 = C.cam1, c2 = C.cam2, pu = C.purga, P = this.r.puerto, am = C.amort, ce = C.celda;
    const camino = (lst) => { const cp = new THREE.CurvePath(); for (const c of lst) cp.add(c); return cp; };
    this.canalA = camino([cr(R.botA), ln(R.botA.at(-1), R.mcgvA[0]), cr(R.mcgvA)]);
    this.canalB = camino([cr(R.botB), ln(R.botB.at(-1), R.mcgvB[0]), cr(R.mcgvB)]);
    const segs = [
      cr(R.mcgvPIV), ln(V(c1.x, 0.55, c1.z + 2), V(c1.x, 7, c1.z + 2)), ln(V(c1.x, 7, c1.z + 2), V(c1.x, 13.5, c1.z + 2)),
      cr(R.salAmort), ln(V(am.x - 3.5, am.y, am.z), V(am.x + 3.5, am.y, am.z)), cr(R.amortC2),
      ln(V(c2.x, 3.3, c2.z + 2), V(c2.x, 10.7, c2.z + 2)), cr(R.c2Purga), ln(V(pu.x - 2.8, pu.y, pu.z), V(pu.x + 2.8, pu.y, pu.z)),
      cr(R.purgaV), ln(P(1), P(2)), cr(R.vDosif), ln(R.vDosif.at(-1), R.bucle[0]), cr(R.bucle), ln(R.bucle.at(-1), R.asientoV[0]), cr(R.asientoV),
      ln(P(5), P(6)), cr(R.vCol), ln(R.vCol.at(-1), R.icCol[0]),
    ];
    this.colA = V(C.col0, C.ic.y, C.ic.z); this.colB = V(C.col1, C.ic.y, C.ic.z); this.lCol = this.colA.distanceTo(this.colB);
    segs.push(ln(R.icCol[0], this.colA));
    const colSeg = ln(this.colA, this.colB);
    const pre = camino(segs); this.lPre = pre.getLength();
    this.post = camino([cr(R.colCelda), ln(V(ce.x + 2.6, ce.y + 1.2, ce.z + 1.2), V(ce.x - 2.6, ce.y + 1.2, ce.z - 1.2)), cr(R.celdaRes)]);
    this.lPost = this.post.getLength();
    this.principal = camino([...segs, colSeg, ...this.post.curves]);
    this.lTot = this.principal.getLength();
    this.uCol0 = this.lPre / this.lTot; this.uCol1 = (this.lPre + this.lCol) / this.lTot;
  }

  /* ---------- corrida ---------- */
  reiniciarCorrida() { this.tc = -0.0001; this.fase = 'muestreo'; this.tf = 0; this.ciclo = 0; this.frame = 0; this.listo = false; }
  update(dt) {
    if (!this.active) return;
    dt = Math.min(dt, 0.05);
    this.frame++;
    const r = this.r;
    // inyección: la válvula pasa a «bypass», el dosificador aspira la muestra y vuelve a «mainpass» (≈ 2,5 s de animación)
    if (this.fase === 'muestreo') {
      this.tf += dt;
      const k = this.tf / 2.4;
      r.rotor.rotation.z = -Math.PI / 3 * Math.min(1, Math.min(k * 5, (1 - k) * 5));
      r.dosif.position.x = 37 + 1.6 * Math.sin(Math.min(1, k) * Math.PI);
      r.aguja.position.y = 1.4 * Math.sin(Math.min(1, k) * Math.PI);
      if (k >= 1) { this.fase = this.sobre ? 'parada' : 'corrida'; this.tc = 0; r.rotor.rotation.z = 0; r.dosif.position.x = 37; r.aguja.position.y = 0; }
    } else if (this.fase === 'corrida') {
      this.tc += dt * (this.tRun / 28);                                     // cada corrida dura ≈ 28 s
      if (this.tc >= this.tRun) { this.fase = 'fin'; this.tf = 0; this.tc = this.tRun; }
    } else if (this.fase === 'fin') { this.tf += dt; if (this.tf > 3) { this.fase = 'muestreo'; this.tf = 0; } }
    const bombea = this.fase !== 'parada';
    // pistones: el primero avanza el doble que el segundo y en sentido contrario (engranajes 2:1)
    if (bombea) this.ciclo += dt * (0.45 + 0.35 * this.F);
    const s = Math.sin(this.ciclo * 2 * Math.PI);
    r.pistones[0].position.z = 1.4 * (s - 1) * 0.5 - 0.0;
    r.pistones[1].position.z = -0.7 * (s + 1) * 0.5;
    const aspira = Math.cos(this.ciclo * 2 * Math.PI) < 0;                // el pistón 1 retrocede: carrera de aspiración
    r.bolaEntrada.position.y = 1.9 + 0.05 + (aspira && bombea ? 0.35 : 0);
    r.bolaSalida.position.y = 12.1 + 0.05 + (!aspira && bombea ? 0.35 : 0);
    // MCGV: durante la aspiración se abre primero A y luego B en proporción a la composición
    const phiB = this.phiProg(Math.max(0, this.tc)), fr = (this.ciclo % 1 + 1) % 1;
    const enA = aspira && bombea && (fr - 0.25 + 1) % 1 < (1 - phiB) * 0.5, enB = aspira && bombea && !enA;
    r.mcgvLed[0].material.emissiveIntensity = enA ? 1.6 : 0; r.mcgvLed[1].material.emissiveIntensity = enB ? 1.6 : 0;
    r.calefactor.material.emissiveIntensity = 0.15 + 0.85 * Math.min(1, (this.T - 298) / 40);
    for (const h of r.haces) h.material.opacity = this.light ? 0.28 : 0.42;
    r.haces.at(-1).material.opacity = this.light ? 0.55 : 0.7;
    this.particulas(dt, bombea);
    if (this.frame % 3 === 0) this.drawUI();
  }
  phiEn(u) {                                          // composición de la fase móvil en la fracción u del recorrido principal
    const t = Math.max(0, this.tc);
    if (u < this.uCol0) return this.phiProg(t - this.tD * (u / this.uCol0));
    return this.phiProg(t - this.tD - this.t0 * Math.min(1, (u - this.uCol0) / (this.uCol1 - this.uCol0)));
  }
  particulas(dt, bombea) {
    const P = this.pool, cA = new THREE.Color(0x3d8bfd), cB = new THREE.Color(0xff9f43), tmp = new THREE.Color(), v = new THREE.Vector3();
    this.mov = (this.mov || 0) + (bombea ? dt * (4 + 6 * this.F) : 0);
    P.begin();
    const phiB = this.phiProg(Math.max(0, this.tc));
    // canales A y B antes de la MCGV: densidad proporcional a su fracción
    for (const [cam, col, fr] of [[this.canalA, cA, 1 - phiB], [this.canalB, cB, phiB]]) {
      const L = cam.getLength(), n = Math.round(L / 1.6);
      for (let i = 0; i < n; i++) { const u = ((i * 1.6 + this.mov) % L) / L; if ((i * 0.618) % 1 > fr) continue; P.push(cam.getPointAt(u, v), col, 0.9); }
    }
    // recorrido principal (mezcla): el color muestra la composición que avanza con el retraso del sistema
    const L = this.lTot, n = Math.round(L / 1.4);
    for (let i = 0; i < n; i++) {
      const u = ((i * 1.4 + this.mov) % L) / L;
      const enCol = u > this.uCol0 && u < this.uCol1;
      tmp.copy(cA).lerp(cB, this.phiEn(u));
      P.push(this.principal.getPointAt(u, v), tmp, enCol ? 0.35 : 0.85);
    }
    P.end();
    // bandas de los compuestos: en la columna (según su trayectoria) y después hacia la celda
    const B = this.bandPool; B.begin();
    const canal = this.r.canal; let sumaCol = new THREE.Color(0, 0, 0), aCel = 0;
    if (this.fase === 'corrida' || this.fase === 'fin') {
      const t = this.tc;
      for (const p of this.picos) {
        const col = new THREE.Color(p.cp.col);
        let x = null;
        if (t < p.tR) { for (let i = p.tray.length - 1; i >= 0; i--) if (p.tray[i][0] <= t) { x = p.tray[i][1]; break; } }
        if (x != null) {
          const sx = Math.max(0.012, (Math.sqrt(Math.max(x, 0.02)) / Math.sqrt(this.N)) * 3.2);
          for (let k = 0; k < 34; k++) {
            const g = gauss(k * 7.13 + p.cp.mw), q = Math.min(1, Math.max(0, x + g * sx));
            v.copy(this.colA).lerp(this.colB, q); v.y += Math.sin(k * 2.39) * 0.5; v.z += Math.cos(k * 1.71) * 0.5;
            B.push(v, col, 1);
          }
        } else if (isFinite(p.tR) && t >= p.tR && t < p.tR + 6 * p.sig + 0.15 * this.tRun / 28 * 6) {
          const k0 = Math.min(1, (t - p.tR) / (0.15 * this.tRun / 28 * 4 + 1e-6));
          for (let k = 0; k < 14; k++) B.push(this.post.getPointAt(Math.min(0.999, k0 * 0.5 + k * 0.012), v), col, 1);
        }
        const a = p.A(+this.ctl.lambda) * Math.exp(-((t - p.tR) ** 2) / (2 * p.sig * p.sig));
        if (a > 1) { sumaCol.add(col.clone().multiplyScalar(Math.min(1, a / 150))); aCel = Math.max(aCel, a); }
      }
    }
    B.end();
    canal.material.color.setHex(0xbfe0ff); canal.material.emissive.setHex(0);
    if (aCel > 1) {
      const k = Math.min(1, aCel / 150), m = Math.max(sumaCol.r, sumaCol.g, sumaCol.b, 1e-3);
      canal.material.color.lerp(sumaCol.multiplyScalar(1 / m), k); canal.material.emissive.copy(canal.material.color).multiplyScalar(0.5 * k);
    }
  }

  /* ---------- paneles 2D ---------- */
  drawUI() {
    this.drawCromatograma();
    const e = this.els;
    if (e.dad.clientWidth > 0) this.drawDAD(e.dad, false);
    e.pres.textContent = this.sobre ? `${fmt(this.pMax, 0)} bar · ¡límite!` : `${fmt(this.pMax, 0)} bar (máx.)`;
    const rm = this.rsMin;
    e.rs.textContent = rm ? `${fmt(rm.v, 2)} (${rm.a.cp.corto}/${rm.b.cp.corto})` : '—';
    const ult = this.picos.filter((p) => isFinite(p.tR)).reduce((m, p) => Math.max(m, p.tR), 0);
    e.tr.textContent = ult ? `${fmt(ult, 1)} min` : '—';
    e.n.textContent = `${fmt(Math.round(this.N / 100) * 100, 0)}`;
  }
  drawCromatograma() {
    const [g, w, h] = setupCanvas(this.els.cro);
    const Cc = chartColors(), L = 42, R = 34, T = 16, B = 26, pw = w - L - R, ph = h - T - B;
    if (pw < 120 || ph < 60) return;                                       // panel demasiado estrecho para dibujar la gráfica
    const lam = +this.ctl.lambda, tR = this.tRun;
    const inset = this.els.dad.clientWidth === 0 && pw > 300;              // sin el segundo panel: espectro en un recuadro arriba a la izquierda
    let ymax = 5;
    for (let i = 0; i <= 400; i++) ymax = Math.max(ymax, this.senal((i / 400) * tR, lam));
    ymax = niceMax(ymax * (inset ? 1.7 : 1.08));
    const X = (t) => L + (t / tR) * pw, Y = (a) => T + ph - (a / ymax) * ph;
    g.font = '10px Segoe UI, sans-serif'; g.lineWidth = 1;
    g.strokeStyle = Cc.grid; g.fillStyle = Cc.text; g.textAlign = 'right';
    for (let k = 0; k <= 4; k++) { const a = (ymax * k) / 4, y = Y(a); g.beginPath(); g.moveTo(L, y); g.lineTo(L + pw, y); g.stroke(); g.fillText(fmt(a, a < 10 ? 1 : 0), L - 4, y + 3); }
    g.strokeStyle = Cc.axis; g.beginPath(); g.moveTo(L, T); g.lineTo(L, T + ph); g.lineTo(L + pw, T + ph); g.stroke();
    g.textAlign = 'center';
    const paso = tR > 24 ? 5 : tR > 10 ? 2 : 1;
    for (let t = 0; t <= tR + 1e-6; t += paso) g.fillText(fmt(t, 0), X(t), T + ph + 12);
    g.fillText('min', L + pw - 8, T + ph + 23);
    g.save(); g.translate(10, T + ph / 2); g.rotate(-Math.PI / 2); g.fillText('mAU', 0, 0); g.restore();
    // programa de %B (eje derecho) a la salida de la bomba
    g.strokeStyle = Cc.cursor; g.setLineDash([4, 3]); g.beginPath();
    for (let i = 0; i <= 100; i++) { const t = (i / 100) * tR, y = T + ph - this.phiProg(t) * ph; i ? g.lineTo(X(t), y) : g.moveTo(X(t), y); }
    g.stroke(); g.setLineDash([]);
    g.textAlign = 'left'; g.fillStyle = Cc.text;
    for (const b of [0, 50, 100]) g.fillText(`${b}`, L + pw + 3, T + ph - (b / 100) * ph + 3);
    g.fillText('%B', L + pw + 3, T - 4);
    if (this.sobre) {
      g.fillStyle = Cc.bad; g.textAlign = 'center'; g.font = '600 12px Segoe UI, sans-serif';
      g.fillText(`La bomba se detiene: ${fmt(this.pMax, 0)} bar supera el límite de ${PMAX} bar`, L + pw / 2, T + ph / 2);
      g.font = '10.5px Segoe UI, sans-serif'; g.fillText('Reduzca el caudal, suba la temperatura o use la columna de 150 × 4,6 mm', L + pw / 2, T + ph / 2 + 16);
      return;
    }
    // cromatograma (traza completa en tenue y la adquirida hasta el instante actual)
    const tc = this.fase === 'muestreo' ? 0 : Math.max(0, this.tc);
    g.strokeStyle = Cc.grid; g.lineWidth = 1; g.beginPath();
    for (let i = 0; i <= 500; i++) { const t = (i / 500) * tR, y = Y(this.senal(t, lam)); i ? g.lineTo(X(t), y) : g.moveTo(X(t), y); }
    g.stroke();
    g.strokeStyle = Cc.line; g.lineWidth = 1.5; g.beginPath();
    const n = Math.max(2, Math.round((tc / tR) * 600));
    for (let i = 0; i <= n; i++) { const t = (i / n) * tc, y = Y(this.senal(t, lam) + ruido(t)); i ? g.lineTo(X(t), y) : g.moveTo(X(t), y); }
    g.stroke();
    if (tc > 0) { g.strokeStyle = Cc.cursor; g.beginPath(); g.moveTo(X(tc), T); g.lineTo(X(tc), T + ph); g.stroke(); }
    // rótulos de los picos ya registrados
    g.font = '600 10px Segoe UI, sans-serif'; g.textAlign = 'center';
    this.picos.forEach((p, i) => {
      if (!isFinite(p.tR) || p.tR > tc) return;
      const a = this.senal(p.tR, lam); g.fillStyle = p.cp.col;
      g.fillText(`${i + 1}`, X(p.tR), Math.max(T + 8, Y(a) - 4));
    });
    g.textAlign = 'left'; g.font = '10.5px Segoe UI, sans-serif'; g.fillStyle = Cc.text;
    const modo = this.ctl.modo === 'iso' ? `isocrático ${this.ctl.org} % B` : `gradiente ${GRADIENTES[this.ctl.grad].nombre}`;
    g.fillText(`DAD ${lam} nm · ${modo} · ${fmt(this.F, 1)} mL/min · ${this.ctl.temp} °C`, L + 4, T - 4);
    const lg = this.picos.map((p, i) => [p.cp.col, `${i + 1} ${p.cp.nombre}${isFinite(p.tR) ? '' : ' (no eluye)'}`]);
    let yy = T + 12; g.textAlign = 'right';
    for (const [c, t] of lg) { g.fillStyle = c; g.fillText(t, L + pw - 4, yy); yy += 12; }
    // sin el segundo panel (pantallas medianas), el espectro se dibuja en un recuadro
    if (inset) {
      const bw = Math.min(170, pw * 0.34), bh = Math.min(84, ph * 0.4);
      this.drawDAD(this.els.cro, true, { g, x: L + 6, y: T + 4, w: bw, h: bh });
    }
  }
  /** Panel del DAD: espectro en el ápice del compuesto elegido o mapa de isoabsorbancia (tiempo × longitud de onda). */
  drawDAD(cv, inset, box) {
    let g, x0, y0, w, h;
    if (inset) ({ g, x: x0, y: y0, w, h } = box); else { [g, w, h] = setupCanvas(cv); x0 = 0; y0 = 0; }
    const Cc = chartColors(), lam = +this.ctl.lambda;
    if (inset) { g.fillStyle = this.light ? 'rgba(255,255,255,0.88)' : 'rgba(30,34,40,0.88)'; g.fillRect(x0, y0, w, h); g.strokeStyle = Cc.grid; g.strokeRect(x0, y0, w, h); }
    const L = x0 + (inset ? 26 : 38), R = 8, T = y0 + (inset ? 14 : 18), B = inset ? 16 : 24, pw = w - (L - x0) - R, ph = h - (T - y0) - B;
    if (pw < 80 || ph < 40) return;
    const l0 = 200, l1 = 400, X = (l) => L + ((l - l0) / (l1 - l0)) * pw;
    g.font = '10px Segoe UI, sans-serif'; g.lineWidth = 1;
    const vista = this.ctl.vista;
    if (vista === 'mapa' && !inset) {
      if (this.sobre) { g.fillStyle = Cc.text; g.textAlign = 'center'; g.fillText('Sin flujo: presión por encima del límite', x0 + w / 2, y0 + h / 2); return; }
      // mapa de isoabsorbancia: x = tiempo, y = longitud de onda
      const nx = 150, ny = 50, tR = this.tRun, tc = this.fase === 'muestreo' ? 0 : Math.max(0, this.tc);
      if (!this.mapa) {
        const v = []; let mx = 1;
        for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const a = this.senal((i / (nx - 1)) * tR, l0 + (j / (ny - 1)) * (l1 - l0)); v.push(a); mx = Math.max(mx, a); }
        this.mapa = { v, mx };
      }
      const cw = pw / nx, chh = ph / ny;
      for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
        const t = (i / (nx - 1)) * tR; if (t > tc) continue;
        const a = this.mapa.v[j * nx + i] / this.mapa.mx, k = Math.log10(1 + 99 * Math.max(0, a)) / 2;
        g.fillStyle = mapaColor(k); g.fillRect(L + i * cw, T + ph - (j + 1) * chh, cw + 0.6, chh + 0.6);
      }
      g.strokeStyle = Cc.axis; g.strokeRect(L, T, pw, ph);
      g.fillStyle = Cc.text; g.textAlign = 'right';
      for (const l of [200, 250, 300, 350, 400]) { const y = T + ph - ((l - l0) / (l1 - l0)) * ph; g.fillText(l, L - 3, y + 3); }
      g.textAlign = 'center'; g.fillText('tiempo →', L + pw / 2, T + ph + 14);
      g.textAlign = 'left'; g.fillText('nm', x0 + 4, T - 6);
      const yl = T + ph - ((lam - l0) / (l1 - l0)) * ph; g.strokeStyle = Cc.cursor; g.setLineDash([4, 3]); g.beginPath(); g.moveTo(L, yl); g.lineTo(L + pw, yl); g.stroke(); g.setLineDash([]);
      g.fillText('Mapa de isoabsorbancia', L, T - 6);
      return;
    }
    // espectro en el ápice
    const idx = vista === 'mapa' ? 1 : +vista.split(':')[1], p = this.picos[idx];
    let ymax = 1; for (let l = l0; l <= l1; l += 2) ymax = Math.max(ymax, p.A(l));
    ymax = niceMax(ymax * 1.1);
    const Y = (a) => T + ph - (a / ymax) * ph;
    g.strokeStyle = Cc.axis; g.beginPath(); g.moveTo(L, T); g.lineTo(L, T + ph); g.lineTo(L + pw, T + ph); g.stroke();
    g.fillStyle = Cc.text; g.textAlign = 'center';
    for (const l of [200, 250, 300, 350, 400]) g.fillText(l, X(l), T + ph + 11);
    if (!inset) { g.textAlign = 'right'; for (let k = 0; k <= 2; k++) g.fillText(fmt((ymax * k) / 2, 0), L - 3, Y((ymax * k) / 2) + 3); }
    // espectros de los demás compuestos, normalizados y tenues
    for (const q of this.picos) {
      if (q === p || inset) continue;
      let m = 1; for (let l = l0; l <= l1; l += 4) m = Math.max(m, q.A(l));
      g.strokeStyle = q.cp.col; g.globalAlpha = 0.28; g.beginPath();
      for (let l = l0; l <= l1; l += 2) { const y = Y((q.A(l) / m) * ymax * 0.9); l === l0 ? g.moveTo(X(l), y) : g.lineTo(X(l), y); }
      g.stroke(); g.globalAlpha = 1;
    }
    g.strokeStyle = p.cp.col; g.lineWidth = 1.8; g.beginPath();
    for (let l = l0; l <= l1; l += 1) { const y = Y(p.A(l)); l === l0 ? g.moveTo(X(l), y) : g.lineTo(X(l), y); }
    g.stroke(); g.lineWidth = 1;
    g.strokeStyle = Cc.cursor; g.setLineDash([4, 3]); g.beginPath(); g.moveTo(X(lam), T); g.lineTo(X(lam), T + ph); g.stroke(); g.setLineDash([]);
    g.textAlign = 'left'; g.fillStyle = Cc.text; g.font = inset ? '9.5px Segoe UI, sans-serif' : '10.5px Segoe UI, sans-serif';
    g.fillText(inset ? `${p.cp.nombre} (ápice)` : `${p.cp.nombre} · espectro en el ápice${isFinite(p.tR) ? ` (${fmt(p.tR, 2)} min)` : ''}`, L, T - 5);
    if (!inset) {
      const max = p.cp.bandas.filter(([l]) => l > 215).map(([l]) => l);
      g.fillStyle = p.cp.col; g.textAlign = 'center';
      for (const l of max) g.fillText(`${l}`, X(l), Math.max(T + 9, Y(p.A(l)) - 4));
      g.fillStyle = Cc.text; g.textAlign = 'right'; g.fillText(`${fmt(p.A(lam), 0)} mAU a ${lam} nm`, L + pw, T + 10);
      g.textAlign = 'left'; g.fillText('nm', L + pw - 14, T + ph + 21);
    }
  }
}

/* ---------- utilidades ---------- */
function gauss(s) { const a = Math.sin(s * 12.9898) * 43758.5453, b = Math.sin(s * 78.233) * 12345.678; const u = Math.max(1e-6, a - Math.floor(a)), v = b - Math.floor(b); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
function ruido(t) { return 0.06 * (Math.sin(t * 517.3) * 0.6 + Math.sin(t * 1291.7) * 0.4); }
function niceMax(v) { const e = 10 ** Math.floor(Math.log10(v)), m = v / e; return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10) * e; }
const fmt = (v, d) => (isFinite(v) ? v.toFixed(d).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : '—');
function mapaColor(k) {
  const st = [[0, [22, 30, 60]], [0.25, [32, 90, 170]], [0.5, [40, 170, 150]], [0.75, [235, 200, 60]], [1, [230, 60, 40]]];
  for (let i = 1; i < st.length; i++) if (k <= st[i][0]) { const [a, ca] = st[i - 1], [b, cb] = st[i], u = (k - a) / (b - a); return `rgb(${ca.map((c, j) => Math.round(c + (cb[j] - c) * u)).join(',')})`; }
  return 'rgb(230,60,40)';
}

/** Definición del panel de simulación que construye el visor. */
export const PANEL = {
  titulo: 'Simulación del HPLC-DAD',
  controles: [
    { id: 'modo', label: 'Elución', value: 'grad', opciones: [['grad', 'Gradiente'], ['iso', 'Isocrática']] },
    { id: 'grad', label: 'Programa', value: 'g1', opciones: Object.entries(GRADIENTES).map(([k, v]) => [k, v.nombre]), visible: (s) => s.modo !== 'iso' },
    { id: 'org', label: '% B (ACN)', value: '30', opciones: [15, 20, 25, 30, 35, 40, 50, 60].map((v) => [String(v), `${v} %`]), visible: (s) => s.modo === 'iso' },
    { id: 'caudal', label: 'Caudal', value: '1', opciones: [['0.5', '0,5 mL/min'], ['1', '1,0 mL/min'], ['1.5', '1,5 mL/min'], ['2', '2,0 mL/min']] },
    { id: 'temp', label: 'Columna', value: '30', opciones: [30, 35, 40, 50, 60].map((v) => [String(v), `${v} °C`]) },
    { id: 'col', label: 'Tipo de columna', value: 'c150', opciones: [['c150', '150 × 4,6 mm, 5 µm'], ['c100', '100 × 3,0 mm, 2,7 µm']] },
    { id: 'lambda', label: 'λ del cromatograma', value: '254', opciones: [230, 254, 275, 300].map((v) => [String(v), `${v} nm`]) },
    { id: 'vista', label: 'Panel DAD', value: 'esp:1', opciones: [...COMP.map((c, i) => [`esp:${i}`, `Espectro: ${c.nombre}`]), ['mapa', 'Mapa de isoabsorbancia']] },
  ],
  lecturas: [['pres', 'Presión'], ['rs', 'Rs mínima'], ['tr', 'Último pico'], ['n', 'Platos (N)']],
  nota: 'Columna C18; A: agua acidificada con ácido fosfórico, B: acetonitrilo; 5 µL de un patrón de paracetamol, cafeína, ácido acetilsalicílico y ácido salicílico. Retención, presión y espectros son aproximados (valores orientativos).',
  leyenda: [['#3d8bfd', 'canal A (agua)'], ['#ff9f43', 'canal B (ACN)'], ['#2f9e44', 'paracetamol'], ['#1971c2', 'cafeína'], ['#e8590c', 'AAS'], ['#ae3ec9', 'salicílico']],
  graficas: ['Cromatograma', 'Detector de diodos (DAD)'],
};
