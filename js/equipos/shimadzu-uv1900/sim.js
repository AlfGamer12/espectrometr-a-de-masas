// Simulación didáctica del UV-1900i: barrido de un espectro de absorción con la luz recorriendo el sistema óptico (lámpara activa,
// giro de la red, rendija de salida, doble haz, absorción en la cubeta de muestra) y curva de calibrado a la longitud de onda del máximo.
// Física: A = ε·b·c (Beer-Lambert) para la absorbancia verdadera; la transmitancia medida es la media de T(λ) ponderada por la función
// de rendija triangular (anchura a media altura = ancho de banda espectral) y la luz parásita s se suma a la luz transmitida:
// T_medida = (T + s)/(1 + s). El ruido fotométrico es ilustrativo. La escala de tiempo está muy ralentizada.
import * as THREE from 'three';
import { PointPool, chartColors, setupCanvas } from '../../simcore.js';
import { P, BY, ZS, ZR } from './geometria.js';

/* ---------- espectros de absorción ---------- */
const g = (x, mu, s) => Math.exp(-0.5 * ((x - mu) / s) ** 2);
/** Interpolación cúbica monótona (Fritsch-Carlson) entre nodos [[x, y]…]. */
function monotona(nodos) {
  const n = nodos.length, x = nodos.map((p) => p[0]), y = nodos.map((p) => p[1]);
  const d = [], m = new Array(n);
  for (let i = 0; i < n - 1; i++) d.push((y[i + 1] - y[i]) / (x[i + 1] - x[i]));
  m[0] = d[0]; m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) { m[i] = m[i + 1] = 0; continue; }
    const a = m[i] / d[i], b = m[i + 1] / d[i], h = a * a + b * b;
    if (h > 9) { const t = 3 / Math.sqrt(h); m[i] = t * a * d[i]; m[i + 1] = t * b * d[i]; }
  }
  return (xx) => {
    if (xx <= x[0]) return y[0]; if (xx >= x[n - 1]) return y[n - 1];
    let i = 0; while (xx > x[i + 1]) i++;
    const h = x[i + 1] - x[i], t = (xx - x[i]) / h, t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * y[i] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * y[i + 1] + (t3 - t2) * h * m[i + 1];
  };
}
// KMnO₄: banda visible con estructura vibrónica (507, 526, 546, 566 nm); ε ≈ 2,4 × 10³ L mol⁻¹ cm⁻¹ en el máximo (forma aproximada)
const kmnoForma = (l) => 0.5 * g(l, 507, 7.5) + 1.0 * g(l, 526, 8) + 0.94 * g(l, 546, 8) + 0.5 * g(l, 566, 9) + 0.1 * g(l, 588, 13) + 0.16 * g(l, 524, 28);
let kmnoMax = 0; for (let l = 480; l <= 600; l += 0.5) kmnoMax = Math.max(kmnoMax, kmnoForma(l));
// K₂Cr₂O₇ en H₂SO₄ 0,005 mol/L: absorbancia específica A(1 %, 1 cm) tabulada por la Ph. Eur. en 235 (mín.), 257 (máx.), 313 (mín.),
// 350 (máx.) y 430 nm; entre esos puntos la curva es una interpolación aproximada
const dicro = monotona([[225, 140], [235, 124.5], [246, 133], [257, 144.5], [270, 128], [290, 74], [313, 48.6], [330, 76], [350, 107.3], [370, 86], [395, 38], [430, 15.9], [460, 6], [480, 2]]);

export const MUESTRAS = {
  kmno4: {
    nombre: 'KMnO₄ en agua', corto: 'KMnO₄', unidad: 'mmol/L', concs: [0.05, 0.1, 0.2, 0.4, 0.8], c0: 0.2, rango: [400, 700], lmax: 526,
    a1: (l) => (2400 * kmnoForma(l)) / kmnoMax / 1000, color: [0.62, 0.18, 0.68], visible: true,
    nota: 'ε ≈ 2,4 × 10³ L mol⁻¹ cm⁻¹',
  },
  dicromato: {
    nombre: 'K₂Cr₂O₇ en H₂SO₄ 0,005 mol/L', corto: 'K₂Cr₂O₇', unidad: 'mg/L', concs: [20, 40, 60, 100, 200], c0: 60, rango: [225, 480], lmax: 350,
    a1: (l) => dicro(l) / 1e4, color: [0.95, 0.68, 0.12], visible: true,
    nota: 'A(1 %, 1 cm) = 107,3 a 350 nm (Ph. Eur.)',
  },
  cafeina: {
    nombre: 'Cafeína en agua', corto: 'Cafeína', unidad: 'mg/L', concs: [2, 5, 10, 20, 40], c0: 10, rango: [235, 330], lmax: 273,
    a1: (l) => 0.0528 * (g(l, 273, 12.5) + 0.62 * Math.exp(-(l - 235) / 9)), color: [0.92, 0.95, 0.98], visible: false,
    nota: '0,0528 Abs por mg/L a 273 nm (recta de Shimadzu)',
  },
};
const fmt = (v, d = 3) => (Number.isFinite(v) ? v.toFixed(d).replace('.', ',').replace('-', '−') : '—');
const fmtC = (c) => (c < 1 ? c.toFixed(2) : c.toFixed(0)).replace('.', ',');

/** Color aproximado de una longitud de onda (los UV e IR cercano se pintan con un color simbólico). */
function colorLambda(l) {
  let r = 0, gg = 0, b = 0;
  if (l < 380) return new THREE.Color(0.62, 0.48, 1.0);
  if (l > 780) return new THREE.Color(0.55, 0.12, 0.12);
  if (l < 440) { r = -(l - 440) / 60; b = 1; } else if (l < 490) { gg = (l - 440) / 50; b = 1; } else if (l < 510) { gg = 1; b = -(l - 510) / 20; }
  else if (l < 580) { r = (l - 510) / 70; gg = 1; } else if (l < 645) { r = 1; gg = -(l - 645) / 65; } else r = 1;
  const k = l < 420 ? 0.4 + 0.6 * (l - 380) / 40 : l > 700 ? 0.4 + 0.6 * (780 - l) / 80 : 1;
  return new THREE.Color(r * k, gg * k, b * k);
}
const LAMBDA_CAMBIO = 340;   // cambio de lámpara en el modelo (Shimadzu: zona de 300–350 nm)
const W = new THREE.Color(1, 0.97, 0.9), UVC = new THREE.Color(0.62, 0.48, 1.0), ROJO = new THREE.Color(1, 0.36, 0.36);

export class Simulacion {
  constructor(eq, els) {
    this.refs = eq.analyzer;
    this.els = { spec: els.canvases[0], cal: els.canvases[1], ...els.read };
    const A = this.refs.group;
    this.pool = new PointPool(A, 1600, 0.5);
    this.fPool = new PointPool(A, 200, 1.4);
    this.fot = []; this.flashes = [];
    this.muestra = 'kmno4'; this.c = MUESTRAS.kmno4.c0; this.b = 1; this.sbw = 1; this.s = 0.0005; this.vista = 'abs';
    this.lamp = 'WI'; this.angSw = this.refs.angConmutador('WI');
    // haces: segmentos de cilindro abierto (no son cables ni sólidos)
    const V = (x, z) => new THREE.Vector3(x, BY, z);
    const cxIn = P.CX - 0.56, cxOut = P.CX + 0.56;
    this.cad = {
      fuente: [P.M0, P.S1, P.M1, P.G],
      salida: [P.S2, P.F, P.M3, P.BS],
      ref: [P.BS, V(cxIn, ZR), V(cxOut, ZR), V(P.DX - 1.3, ZR)],
      mue: [P.BS, P.M4, V(cxIn, ZS), V(cxOut, ZS), V(P.DX - 1.3, ZS)],
    };
    this.haces = [];
    const tramo = (a, b, r) => {
      const d = b.clone().sub(a), L = d.length();
      const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
      const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, L, 10, 1, true), mat);
      m.position.copy(a).addScaledVector(d, 0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
      m.raycast = () => {}; m.castShadow = false; m.userData.noClone = true; m.renderOrder = 9; A.add(m); this.haces.push(m); return m;
    };
    const cadena = (pts, r) => pts.slice(1).map((p, i) => tramo(pts[i], p, r));
    this.h = {
      lamp: tramo(P.WI, P.M0, 0.16), lampL0: P.WI.distanceTo(P.M0), fuente: cadena(this.cad.fuente, 0.16), abanico: [], salida: cadena(this.cad.salida, 0.12),
      ref: cadena(this.cad.ref, 0.12), mue: cadena(this.cad.mue, 0.12),
    };
    // abanico dispersado: cinco longitudes de onda alrededor de la elegida; solo la central atraviesa la rendija de salida
    this.offs = [-2, -1, 0, 1, 2];
    for (const k of this.offs) {
      const s2 = P.S2.clone().add(new THREE.Vector3(k * 0.45, 0, 0.12)), m2 = P.M2.clone().add(new THREE.Vector3(k * 0.32, 0, 0));
      this.h.abanico.push([tramo(P.G, m2, 0.09), tramo(m2, s2, 0.09)]);
    }
    this.vacio = []; this.lambda = 0; this.t = 0; this.pausa = 0;
    this.calcular(); this.reiniciarBarrido();
    this.setVisible(false);
  }

  /* ---------- interfaz con el visor ---------- */
  setVisible(v) { this.pool.visible = v; this.fPool.visible = v; for (const m of this.haces) m.visible = v; }
  setTheme(light) {
    this.light = light;
    for (const p of [this.pool, this.fPool]) p.setTheme(light);
    for (const m of [...this.haces, this.refs.glowD2, this.refs.glowWI, ...this.refs.glowDet]) { m.material.blending = light ? THREE.NormalBlending : THREE.AdditiveBlending; m.material.needsUpdate = true; }
  }
  start() { this.active = true; this.setVisible(true); this.reiniciarBarrido(); this.colorear(); }
  stop() {
    this.active = false; this.setVisible(false); this.fot.length = 0; this.flashes.length = 0;
    for (const m of this.haces) m.material.opacity = 0;      // el visor vuelve a hacer visibles las mallas de la pieza al cambiar de modo
    for (const m of [this.refs.glowD2, this.refs.glowWI, ...this.refs.glowDet]) m.material.opacity = 0;
    this.refs.liqMuestra.material.color.setHex(0xe9f2fb); this.refs.liqMuestra.material.opacity = 0.35;
  }
  setControl(id, v) {
    if (id === 'muestra') { this.muestra = v; this.c = MUESTRAS[v].c0; this.reiniciarBarrido(); }
    else if (id === 'conc') this.c = +v;
    else if (id === 'paso') this.b = +v;
    else if (id === 'rendija') this.sbw = +v;
    else if (id === 'parasita') this.s = +v;
    else if (id === 'vista') this.vista = v;
    this.calcular();
    if (id !== 'vista') this.reiniciarBarrido();
    this.colorear();
  }
  options(id) { return id === 'conc' ? MUESTRAS[this.muestra].concs.map((c) => [String(c), `${fmtC(c)} ${MUESTRAS[this.muestra].unidad}`]) : null; }
  value(id) { return id === 'conc' ? String(this.c) : null; }

  /* ---------- modelo fotométrico ---------- */
  /** Absorbancia verdadera de una disolución de concentración c en una cubeta de paso b (cm). */
  aVerdadera(l, c = this.c, b = this.b) { return MUESTRAS[this.muestra].a1(l) * c * b; }
  /** Transmitancia que mide el equipo: media sobre la función de rendija triangular más la luz parásita. */
  tMedida(l, c = this.c, b = this.b) {
    let sw = 0, st = 0;
    const N = 12;
    for (let i = -N; i <= N; i++) { const d = (i / N) * this.sbw, w = 1 - Math.abs(i) / N; if (w <= 0) continue; sw += w; st += w * 10 ** -this.aVerdadera(l + d, c, b); }
    const T = st / sw;
    return (T + this.s) / (1 + this.s);
  }
  aMedida(l, c, b) { return -Math.log10(this.tMedida(l, c, b)); }
  calcular() {
    const S = MUESTRAS[this.muestra];
    // curva de calibrado a λmáx con los patrones, en las condiciones actuales
    this.cal = S.concs.map((c) => ({ c, real: this.aVerdadera(S.lmax, c), med: this.aMedida(S.lmax, c, this.b) }));
    const ok = this.cal.filter((p) => p.med <= 4);
    const sxy = ok.reduce((a, p) => a + p.c * p.med, 0), sxx = ok.reduce((a, p) => a + p.c * p.c, 0);
    this.pend = sxx ? sxy / sxx : 0;                                        // recta por el origen (mínimos cuadrados)
    const my = ok.reduce((a, p) => a + p.med, 0) / Math.max(1, ok.length);
    const ssr = ok.reduce((a, p) => a + (p.med - this.pend * p.c) ** 2, 0), sst = ok.reduce((a, p) => a + (p.med - my) ** 2, 0);
    this.r2 = sst > 0 ? 1 - ssr / sst : 1;
  }
  reiniciarBarrido() {
    const [lo, hi] = MUESTRAS[this.muestra].rango;
    this.lo = lo; this.hi = hi; this.lambda = hi; this.pausa = 0;
    this.med = new Float32Array(Math.round((hi - lo) / 0.5) + 1).fill(NaN);
  }
  /** Color del líquido de la cubeta de muestra según la concentración y el paso óptico. */
  colorear() {
    const S = MUESTRAS[this.muestra], m = this.refs.liqMuestra.material;
    const a = S.visible ? Math.min(1, this.aVerdadera(S.lmax) * 0.9) : 0;
    m.color.setRGB(...S.color.map((v) => 0.92 + (v - 0.92) * Math.max(0.15, a))); m.opacity = 0.32 + 0.5 * a;
  }

  /* ---------- animación ---------- */
  update(dt) {
    if (!this.active) return;
    dt = Math.min(dt, 0.05); this.t += dt;
    // barrido de longitud de onda (de largas a cortas, como en el equipo)
    const vel = (this.hi - this.lo) / 9;                   // nm por segundo en la simulación
    if (this.pausa > 0) { this.pausa -= dt; if (this.pausa <= 0) this.reiniciarBarrido(); }
    else {
      const l0 = this.lambda; this.lambda = Math.max(this.lo, this.lambda - vel * dt);
      for (let l = Math.ceil(this.lambda * 2) / 2; l <= l0 + 1e-6; l += 0.5) {
        const i = Math.round((l - this.lo) / 0.5);
        if (i >= 0 && i < this.med.length && Number.isNaN(this.med[i])) {
          const T = this.tMedida(l), ruido = 0.434 * 3e-5 / Math.max(T, 1e-6) * (Math.random() + Math.random() + Math.random() - 1.5);
          this.med[i] = -Math.log10(T) + ruido;
        }
      }
      if (this.lambda <= this.lo) this.pausa = 2.2;
    }
    const l = this.lambda;
    // lámpara activa y espejo conmutador
    this.lamp = l < LAMBDA_CAMBIO ? 'D2' : 'WI';
    const objetivo = this.refs.angConmutador(this.lamp);
    this.angSw += (objetivo - this.angSw) * Math.min(1, dt * 6);
    this.refs.conmutador.rotation.y = this.angSw;
    const listo = Math.abs(objetivo - this.angSw) < 0.05;
    const pulso = 0.85 + 0.15 * Math.sin(this.t * 23);
    this.refs.glowD2.material.opacity = this.lamp === 'D2' ? 0.8 * pulso : 0.12;   // las dos lámparas siguen encendidas; solo una se usa
    this.refs.glowWI.material.opacity = this.lamp === 'WI' ? 0.85 * pulso : 0.15;
    // giro de la red (ecuación de la red en montaje de desviación constante; paso ilustrativo de 1200 surcos/mm)
    const K = Math.atan2(4, 10.8), phi = Math.asin(Math.min(0.99, (l * 1e-6 * 1200) / (2 * Math.cos(K))));
    this.refs.red.rotation.y = -phi;
    // rueda de filtros: ventana según la región (ilustrativo)
    const ventana = l < 340 ? 0 : l < 480 ? 1 : l < 650 ? 2 : l < 900 ? 3 : 4;
    const ang = -(ventana / 5) * Math.PI * 2;
    this.refs.ruedaFiltro.rotation.z += (ang - this.refs.ruedaFiltro.rotation.z) * Math.min(1, dt * 5);

    // haces: brillo y color
    const cl = colorLambda(l), fuenteCol = this.lamp === 'D2' ? UVC : W;
    const T = this.tMedida(l);
    const set = (m, col, op) => { m.material.color.copy(col); m.material.opacity = this.light ? op * 0.9 : op * 0.55; };
    this.h.lamp.position.copy(this.lamp === 'D2' ? P.D2 : P.WI).add(P.M0).multiplyScalar(0.5);
    this.h.lamp.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(1, 0, 0));
    this.h.lamp.scale.y = (this.lamp === 'D2' ? P.D2 : P.WI).distanceTo(P.M0) / this.h.lampL0;
    set(this.h.lamp, fuenteCol, listo ? 0.5 : 0.15);
    for (const m of this.h.fuente) set(m, fuenteCol, listo ? 0.45 : 0.1);
    this.offs.forEach((k, i) => { const c = colorLambda(l + k * 25); for (const m of this.h.abanico[i]) set(m, c, listo ? (k ? 0.3 : 0.6) : 0.05); });
    for (const m of this.h.salida) set(m, cl, 0.6);
    for (const m of this.h.ref) set(m, cl, 0.45);
    this.h.mue.forEach((m, i) => set(m, cl, i < 3 ? 0.45 : 0.45 * Math.max(0.03, T)));

    // fotones: nacen en la lámpara activa y siguen el camino de la luz
    this.acc = (this.acc || 0) + dt * 140;
    while (this.acc >= 1) { this.acc -= 1; if (listo) this.fot.push({ seg: 'fuente', u: 0, k: this.offs[(Math.random() * 5) | 0], ruta: Math.random() < 0.5 ? 'ref' : 'mue', vivo: true }); }
    const v = 28;   // cm/s en la simulación
    for (const f of this.fot) {
      f.u += v * dt;
      const cad = f.seg === 'fuente' ? [this.lamp === 'D2' ? P.D2 : P.WI, ...this.cad.fuente]
        : f.seg === 'abanico' ? [P.G, P.M2.clone().add(new THREE.Vector3(f.k * 0.32, 0, 0)), P.S2.clone().add(new THREE.Vector3(f.k * 0.45, 0, 0.12))]
          : f.seg === 'salida' ? this.cad.salida : this.cad[f.ruta];
      const r = recorrer(cad, f.u);
      f.pos = r.p;
      if (f.seg === 'mue' && !f.decidido && r.i >= 3) {             // dentro de la cubeta de muestra: absorción con probabilidad 1 − T
        f.decidido = true;
        if (Math.random() > T) { f.vivo = false; this.flash(f.pos, 0.6, ROJO); }
      }
      if (r.fin) {
        if (f.seg === 'fuente') { f.seg = 'abanico'; f.u = 0; }
        else if (f.seg === 'abanico') { if (f.k) { f.vivo = false; this.flash(f.pos, 0.25, colorLambda(l + f.k * 25)); } else { f.seg = 'salida'; f.u = 0; } }
        else if (f.seg === 'salida') { f.seg = f.ruta; f.u = 0; }
        else { f.vivo = false; this.flash(f.pos, 0.8, cl); (f.ruta === 'mue' ? (this.hitS = 1) : (this.hitR = 1)); }
      }
      f.col = f.seg === 'fuente' ? fuenteCol : f.seg === 'abanico' ? colorLambda(l + f.k * 25) : cl;
    }
    this.fot = this.fot.filter((f) => f.vivo);
    for (const fl of this.flashes) fl.t += dt;
    this.flashes = this.flashes.filter((fl) => fl.t < 0.3);
    this.hitS = Math.max(0, (this.hitS || 0) - dt * 4); this.hitR = Math.max(0, (this.hitR || 0) - dt * 4);
    this.refs.glowDet[0].material.opacity = 0.15 + 0.5 * this.hitS; this.refs.glowDet[1].material.opacity = 0.15 + 0.5 * this.hitR;
    this.refs.glowDet[0].material.color.copy(cl); this.refs.glowDet[1].material.color.copy(cl);

    this.pool.begin(); for (const f of this.fot) this.pool.push(f.pos, f.col, 1); this.pool.end();
    this.fPool.begin(); for (const fl of this.flashes) this.fPool.push(fl.p, fl.c, fl.k * (1 - fl.t / 0.3)); this.fPool.end();

    this.frame = (this.frame || 0) + 1;
    if (this.frame % 3 === 0) this.drawUI();
  }
  flash(p, k, c) { if (this.flashes.length < 190) this.flashes.push({ p: p.clone(), t: 0, k, c }); }

  /* ---------- paneles 2D ---------- */
  drawUI() {
    const S = MUESTRAS[this.muestra], l = this.lambda, e = this.els;
    const T = this.tMedida(l), A = -Math.log10(T);
    e.lambda.textContent = `${fmt(l, 1)} nm`;
    e.lamp.textContent = this.lamp === 'D2' ? 'Deuterio (UV)' : 'Halógena W (Vis)';
    e.abs.textContent = A > 4 ? '> 4 Abs' : `${fmt(A, 3)} Abs`;
    e.trans.textContent = `${fmt(T * 100, T < 0.01 ? 3 : 1)} %`;
    this.drawSpectrum(S); this.drawCal(S);
  }
  drawSpectrum(S) {
    const [g2, w, h] = setupCanvas(this.els.spec);
    const C = chartColors(), L = 42, R = 10, T0 = 18, B = 28, pw = w - L - R, ph = h - T0 - B;
    const abs = this.vista === 'abs';
    let amax = 0; for (let l = this.lo; l <= this.hi; l += 1) amax = Math.max(amax, this.aVerdadera(l));
    const ytop = abs ? Math.min(4.2, Math.max(0.25, Math.ceil(amax * 1.15 * 4) / 4)) : 100;
    const X = (l) => L + ((l - this.lo) / (this.hi - this.lo)) * pw, Y = (v) => T0 + ph - (Math.max(0, Math.min(v, ytop * 1.04)) / ytop) * ph;
    g2.font = '10px Segoe UI, sans-serif'; g2.strokeStyle = C.axis; g2.fillStyle = C.text; g2.lineWidth = 1;
    g2.beginPath(); g2.moveTo(L, T0); g2.lineTo(L, T0 + ph); g2.lineTo(L + pw, T0 + ph); g2.stroke();
    g2.textAlign = 'right';
    const paso = abs ? (ytop > 2 ? 1 : ytop > 1 ? 0.5 : ytop > 0.5 ? 0.25 : 0.1) : 25;
    for (let v = 0; v <= ytop + 1e-6; v += paso) { const y = Y(v); g2.fillText(abs ? fmt(v, paso < 0.25 ? 1 : 2) : `${v}`, L - 4, y + 3); g2.strokeStyle = C.grid; g2.beginPath(); g2.moveTo(L, y); g2.lineTo(L + pw, y); g2.stroke(); }
    g2.textAlign = 'center';
    const tk = this.hi - this.lo > 200 ? 50 : 20;
    for (let l = Math.ceil(this.lo / tk) * tk; l <= this.hi; l += tk) g2.fillText(l, X(l), T0 + ph + 12);
    g2.fillText('λ (nm)', L + pw - 16, T0 + ph + 24);
    g2.save(); g2.translate(11, T0 + ph / 2); g2.rotate(-Math.PI / 2); g2.fillText(abs ? 'Absorbancia' : 'Transmitancia (%)', 0, 0); g2.restore();
    const conv = (a) => (abs ? a : 100 * 10 ** -a);
    // espectro verdadero (Beer-Lambert, sin efectos instrumentales)
    g2.strokeStyle = C.axis; g2.setLineDash([3, 3]); g2.beginPath();
    for (let l = this.lo, k = 0; l <= this.hi; l += 0.5, k++) { const y = Y(conv(this.aVerdadera(l))); k ? g2.lineTo(X(l), y) : g2.moveTo(X(l), y); }
    g2.stroke(); g2.setLineDash([]);
    // espectro medido hasta la longitud de onda actual
    g2.strokeStyle = C.line; g2.lineWidth = 1.6; g2.beginPath(); let on = false;
    for (let i = this.med.length - 1; i >= 0; i--) { const a = this.med[i]; if (Number.isNaN(a)) { on = false; continue; } const x = X(this.lo + i * 0.5), y = Y(conv(Math.min(a, 4))); on ? g2.lineTo(x, y) : g2.moveTo(x, y); on = true; }
    g2.stroke(); g2.lineWidth = 1;
    // cambio de lámpara y cursor
    if (LAMBDA_CAMBIO > this.lo && LAMBDA_CAMBIO < this.hi) {
      g2.strokeStyle = C.grid; g2.beginPath(); g2.moveTo(X(LAMBDA_CAMBIO), T0); g2.lineTo(X(LAMBDA_CAMBIO), T0 + ph); g2.stroke();
      g2.fillStyle = C.text; g2.textAlign = 'left'; g2.fillText('D₂ ← → WI', X(LAMBDA_CAMBIO) - 26, T0 + 10);
    }
    g2.strokeStyle = C.cursor; g2.setLineDash([4, 3]); g2.beginPath(); g2.moveTo(X(this.lambda), T0); g2.lineTo(X(this.lambda), T0 + ph); g2.stroke(); g2.setLineDash([]);
    g2.fillStyle = C.text; g2.textAlign = 'left'; g2.font = '11px Segoe UI, sans-serif';
    g2.fillText(`${S.corto} ${fmtC(this.c)} ${S.unidad} · b = ${fmtC(this.b * 10)} mm · ancho de banda ${this.sbw} nm`, L + 4, T0 - 6);
    g2.textAlign = 'right'; g2.font = '10px Segoe UI, sans-serif';
    g2.fillStyle = C.line; g2.fillText('— medido', L + pw - 4, T0 + 10); g2.fillStyle = C.axis; g2.fillText('- - - Beer-Lambert', L + pw - 4, T0 + 22);
  }
  drawCal(S) {
    const [g2, w, h] = setupCanvas(this.els.cal);
    const C = chartColors(), L = 42, R = 12, T0 = 18, B = 28, pw = w - L - R, ph = h - T0 - B;
    const cmax = S.concs[S.concs.length - 1] * 1.08;
    const amax = Math.min(4.2, Math.max(0.3, Math.ceil(Math.max(...this.cal.map((p) => p.real)) * 1.1 * 2) / 2));
    const X = (c) => L + (c / cmax) * pw, Y = (a) => T0 + ph - (Math.max(0, Math.min(a, amax * 1.04)) / amax) * ph;
    g2.font = '10px Segoe UI, sans-serif'; g2.strokeStyle = C.axis; g2.fillStyle = C.text; g2.lineWidth = 1;
    g2.beginPath(); g2.moveTo(L, T0); g2.lineTo(L, T0 + ph); g2.lineTo(L + pw, T0 + ph); g2.stroke();
    g2.textAlign = 'right';
    const paso = amax > 2 ? 1 : amax > 1 ? 0.5 : 0.25;
    for (let v = 0; v <= amax + 1e-6; v += paso) { const y = Y(v); g2.fillText(fmt(v, 2), L - 4, y + 3); g2.strokeStyle = C.grid; g2.beginPath(); g2.moveTo(L, y); g2.lineTo(L + pw, y); g2.stroke(); }
    g2.textAlign = 'center';
    let xu = -1e9; for (const c of S.concs) { if (X(c) - xu < 26) continue; g2.fillText(fmtC(c), X(c), T0 + ph + 12); xu = X(c); }
    g2.fillText(S.unidad, L + pw - 16, T0 + ph + 24);
    // ley de Beer-Lambert (recta ideal) y recta ajustada a los patrones medidos
    g2.strokeStyle = C.axis; g2.setLineDash([3, 3]); g2.beginPath(); g2.moveTo(X(0), Y(0)); g2.lineTo(X(cmax), Y(S.a1(S.lmax) * this.b * cmax)); g2.stroke(); g2.setLineDash([]);
    g2.strokeStyle = C.line; g2.beginPath(); g2.moveTo(X(0), Y(0)); g2.lineTo(X(cmax), Y(this.pend * cmax)); g2.stroke();
    for (const p of this.cal) {
      const fuera = p.med > 4, sel = Math.abs(p.c - this.c) < 1e-9, desv = Math.abs(p.med - p.real) / Math.max(1e-6, p.real) > 0.02;
      g2.beginPath(); g2.arc(X(p.c), Y(Math.min(p.med, 4)), sel ? 5.5 : 4, 0, Math.PI * 2);
      g2.fillStyle = fuera || desv ? C.bad : C.line; g2.fill();
      if (sel) { g2.strokeStyle = C.cursor; g2.lineWidth = 1.5; g2.stroke(); g2.lineWidth = 1; }
    }
    g2.fillStyle = C.text; g2.textAlign = 'left'; g2.font = '11px Segoe UI, sans-serif';
    g2.fillText(`A a ${S.lmax} nm · pendiente ${fmt(this.pend, 4)} · R² ${fmt(this.r2, 4)}`, L + 4, T0 - 6);
    const p = this.cal.find((q) => Math.abs(q.c - this.c) < 1e-9);
    if (p) {
      const err = (p.med / p.real - 1) * 100;
      g2.textAlign = 'right'; g2.fillStyle = Math.abs(err) > 2 ? C.bad : C.text;
      g2.fillText(`muestra: ${p.med > 4 ? '> 4' : fmt(p.med, 3)} Abs (Beer-Lambert ${fmt(p.real, 3)}; ${err >= 0 ? '+' : '−'}${fmt(Math.abs(err), 1)} %)`, L + pw, T0 + 12);
    }
  }
}

/** Posición a la distancia u a lo largo de una poligonal; i = índice del tramo, fin = recorrida entera. */
function recorrer(pts, u) {
  for (let i = 0; i < pts.length - 1; i++) {
    const L = pts[i].distanceTo(pts[i + 1]);
    if (u <= L) return { p: pts[i].clone().lerp(pts[i + 1], u / L), i: i + 1, fin: false };
    u -= L;
  }
  return { p: pts[pts.length - 1].clone(), i: pts.length - 1, fin: true };
}

/** Definición del panel de simulación que construye el visor. */
export const PANEL = {
  titulo: 'Simulación: espectro y ley de Beer-Lambert',
  controles: [
    { id: 'muestra', label: 'Muestra', value: 'kmno4', opciones: Object.entries(MUESTRAS).map(([k, v]) => [k, v.nombre]) },
    { id: 'conc', label: 'Concentración', dinamico: true },
    { id: 'paso', label: 'Paso óptico (b)', value: '1', opciones: [['0.1', '1 mm'], ['0.2', '2 mm'], ['0.5', '5 mm'], ['1', '10 mm (estándar)'], ['2', '20 mm'], ['5', '50 mm']] },
    { id: 'rendija', label: 'Ancho de banda espectral', value: '1', opciones: [['1', '1 nm (UV-1900i)'], ['5', '5 nm (comparación)'], ['10', '10 nm (comparación)']] },
    { id: 'parasita', label: 'Luz parásita', value: '0.0005', opciones: [['0', '0 % (ideal)'], ['0.0005', '0,05 %'], ['0.005', '0,5 % (máx. especificado a 198 nm)'], ['0.02', '2 % (óptica degradada)']] },
    { id: 'vista', label: 'Ordenada', value: 'abs', opciones: [['abs', 'Absorbancia'], ['trans', 'Transmitancia (%)']] },
  ],
  lecturas: [['lambda', 'Longitud de onda'], ['lamp', 'Lámpara en uso'], ['abs', 'Absorbancia'], ['trans', 'Transmitancia']],
  nota: 'A = −log T = ε·b·c. Con un ancho de banda comparable a la anchura de la banda, los picos se ensanchan y pierden altura; la luz parásita limita la absorbancia máxima medible (≈ −log s) y curva la recta de calibrado a absorbancias altas. KMnO₄: forma de banda aproximada. K₂Cr₂O₇: valores de la Ph. Eur. a 235, 257, 313, 350 y 430 nm, interpolados entre ellos. Cafeína: 0,0528 Abs por mg/L a 273 nm (Shimadzu), forma aproximada. Ruido ilustrativo.',
  leyenda: [['#f2ead0', 'luz blanca (lámpara W)'], ['#9e7aff', 'UV (color simbólico)'], ['#3fb950', 'luz monocromática'], ['#ff6b6b', 'fotón absorbido']],
  graficas: ['Espectro de absorción (barrido de largas a cortas)', 'Curva de calibrado a λmáx'],
};
