// Simulación del IRSpirit: el espejo móvil barre el retardo, el láser de referencia marca dónde se toma cada punto del interferograma,
// la transformada de Fourier convierte el interferograma en el espectro de haz simple, el cociente muestra/fondo da la transmitancia y
// la absorbancia. Se puede comparar ATR (QATR-S, diamante a 45°) con transmisión, cambiar la resolución (retardo máximo), el número
// de barridos (S/N ∝ √N) y la apodización.
// Física: interferograma I(δ) = ∫ B(σ)·cos(2πσδ) dσ calculado por FFT a partir de un espectro fino (0,09 cm⁻¹); muestreo cada λ/2 del
// láser; truncado en ±δmax = ±1/Δσ, apodizado y transformado de nuevo. ATR: espesor efectivo de Harrick (luz no polarizada, absorción
// débil) con n(diamante) = 2,4; se desprecia la dispersión anómala. Posiciones de banda reales; intensidades relativas aproximadas.
// Fuente (cuerpo negro de 1350 K), divisor, detector, absorción del diamante y nivel de ruido: modelos orientativos.
import * as THREE from 'three';
import { PointPool, chartColors, setupCanvas } from '../../simcore.js';
import { parts, ownMeshes } from '../../parts.js';
import { FIS, CAMINO, T as DIR_T, QA, DET } from './geometria.js';

/* ======================= FFT radix-2 (in situ) ======================= */
function fft(re, im) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) { let t = re[i]; re[i] = re[j]; re[j] = t; t = im[i]; im[i] = im[j]; im[j] = t; }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len, wr = Math.cos(ang), wi = Math.sin(ang), h = len >> 1;
    for (let i = 0; i < n; i += len) {
      let cr = 1, ci = 0;
      for (let k = 0; k < h; k++) {
        const a = i + k, b = a + h;
        const xr = re[b] * cr - im[b] * ci, xi = re[b] * ci + im[b] * cr;
        re[b] = re[a] - xr; im[b] = im[a] - xi; re[a] += xr; im[a] += xi;
        const t = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = t;
      }
    }
  }
}

/* ======================= constantes del modelo ======================= */
const LAMBDA = FIS.laserNm * 1e-7;          // cm (láser de referencia)
const DD = LAMBDA / 2;                       // intervalo de muestreo en retardo: un punto por cada paso por cero del láser
const SMAX = 1 / (2 * DD);                   // número de onda de Nyquist (≈ 11 700 cm⁻¹)
const NF = 1 << 17;                          // espectro fino: 0 … SMAX en NF puntos (≈ 0,09 cm⁻¹)
const DS = SMAX / NF;
const RES = [16, 8, 4, 2, 0.9];
const SIGMA_I = 0.2;                         // ruido por punto del interferograma (unidades de la señal); orientativo
const SCAN_T = 2.4, RET_T = 0.45;            // duración visual de un barrido y del retorno (s)

/* ---------- muestras: [σ0 (cm⁻¹), anchura FWHM, absorbancia decádica por µm en el máximo, forma] ---------- */
const MUESTRAS = {
  acetona: {
    nombre: 'Acetona (líquido)', n: 1.36, b: 10, film: 'celda de líquidos de ≈ 10 µm',
    bandas: [[3412, 40, 0.003], [3004, 20, 0.004], [2967, 18, 0.006], [2924, 20, 0.004], [1715, 17, 0.13], [1420, 22, 0.025], [1361, 15, 0.07],
      [1222, 18, 0.06], [1093, 14, 0.012], [902, 10, 0.004], [787, 12, 0.004], [530, 14, 0.035]],
    marcas: [[1715, 'C=O'], [1361, 'δ CH₃'], [1222, 'C–C–C'], [2967, 'C–H'], [530, 'δ C–C=O']],
  },
  etanol: {
    nombre: 'Etanol (líquido)', n: 1.36, b: 10, film: 'celda de líquidos de ≈ 10 µm',
    bandas: [[3330, 260, 0.055, 'G'], [2973, 22, 0.06], [2928, 20, 0.025], [2884, 20, 0.025], [1454, 25, 0.02], [1380, 20, 0.018], [1328, 25, 0.012],
      [1275, 30, 0.008], [1088, 18, 0.05], [1046, 20, 0.11], [880, 15, 0.045], [660, 150, 0.02, 'G']],
    marcas: [[3330, 'O–H'], [2973, 'C–H'], [1046, 'C–O'], [880, 'C–C–O']],
  },
  poliestireno: {
    nombre: 'Poliestireno (película)', n: 1.59, b: 38, film: 'película de 38 µm',
    bandas: [[3082, 8, 0.45], [3060, 10, 0.7], [3026, 10, 0.9], [3001, 8, 0.3], [2923, 20, 1.3], [2850, 14, 0.7], [1944, 12, 0.25], [1871, 12, 0.2],
      [1801, 12, 0.15], [1745, 12, 0.08], [1601, 7, 0.5], [1583, 6, 0.25], [1493, 8, 1.4], [1452, 10, 1.3], [1370, 10, 0.12], [1181, 8, 0.1],
      [1155, 8, 0.12], [1069, 8, 0.25], [1028, 8, 0.45], [906, 8, 0.35], [842, 10, 0.1], [757, 10, 1.9], [698, 10, 2.6], [540, 14, 0.6]].map(([s, w, a]) => [s, w, a / 38]),
    marcas: [[3026, 'C–H ar.'], [2923, 'C–H al.'], [1601, '1601'], [1493, 'anillo'], [757, '757'], [698, 'δ C–H']],
  },
  blanco: { nombre: 'Sin muestra (línea del 100 %)', n: 1.5, b: 0, film: '', bandas: [], marcas: [] },
};

/** Espesor efectivo de Harrick (luz no polarizada) en µm para un prisma de índice n1, ángulo θ y muestra de índice n2. */
export function espesorEfectivo(sigma, n2, n1 = FIS.nDiamante, theta = (FIS.angATR * Math.PI) / 180) {
  const lam = 1e4 / sigma, l1 = lam / n1, n21 = n2 / n1, s2 = Math.sin(theta) ** 2, c = Math.cos(theta), q = Math.sqrt(s2 - n21 * n21);
  const ep = (l1 * n21 * c) / (Math.PI * (1 - n21 * n21) * q);
  const ea = ep * (2 * s2 - n21 * n21) / ((1 + n21 * n21) * s2 - n21 * n21);
  return (ep + ea) / 2;
}
/** Profundidad de penetración dp (µm). */
export function penetracion(sigma, n2, n1 = FIS.nDiamante, theta = (FIS.angATR * Math.PI) / 180) {
  return (1e4 / sigma) / (2 * Math.PI * n1 * Math.sqrt(Math.sin(theta) ** 2 - (n2 / n1) ** 2));
}

/* ---------- espectro de fondo (haz simple sin muestra) ---------- */
function fondo(tec) {
  const out = new Float64Array(NF);
  const c2 = 1.4388, Tf = 1350;
  const lineas = co2();
  let mx = 0;                                       // normalización común: máximo del haz sin accesorio (el ATR conserva su pérdida de energía)
  for (let j = 1; j < NF; j++) {
    const s = j * DS;
    if (s < 300 || s > 8200) continue;
    let v = (s ** 3) / Math.expm1((c2 * s) / Tf);                                        // emisión de la fuente cerámica (Planck)
    v *= 0.85 * Math.exp(-(((s - 2800) / 5200) ** 2));                                     // eficiencia del divisor KBr/Ge
    v *= 1 / (1 + Math.exp((360 - s) / 12)) / (1 + Math.exp((s - 7900) / 60));             // corte del KBr y límite superior
    v /= Math.sqrt(1 + (s / 3500) ** 2);                                                   // respuesta del DLATGS a frecuencias altas
    if (v > mx) mx = v;
    if (tec === 'atr') {
      let a = 0;                                                                           // absorción de dos fonones del diamante
      for (const [c, w, h] of [[1975, 35, 0.45], [2030, 45, 0.75], [2160, 45, 0.7], [2350, 60, 0.25], [2480, 50, 0.12]]) a += h * Math.exp(-(((s - c) / w) ** 2));
      v *= 0.35 * 10 ** -a;
    }
    out[j] = v;
  }
  // CO₂ del aire en el camino óptico (líneas rotacionales de ν3 y ν2)
  const A = new Float64Array(NF);
  for (const [c, a, g] of lineas) {
    const j0 = Math.max(1, Math.floor((c - 2) / DS)), j1 = Math.min(NF - 1, Math.ceil((c + 2) / DS));
    for (let j = j0; j <= j1; j++) { const x = (j * DS - c) / g; A[j] += a / (1 + x * x); }
  }
  for (let j = 0; j < NF; j++) out[j] = (out[j] * 10 ** -A[j]) / mx;
  return out;
}
/** Líneas de CO₂: [posición, absorbancia en el máximo, semianchura]. Bandas ν3 (2349 cm⁻¹) y ν2 (667 cm⁻¹); solo J par en el estado fundamental. */
function co2() {
  const L = [], B0 = 0.39022, kT = 1.4388 / 296;
  const banda = (nu0, B1, amax, rama) => {
    let pm = 0; const tmp = [];
    for (let J = 0; J <= 70; J += 2) {
      const pob = (2 * J + 1) * Math.exp(-B0 * J * (J + 1) * kT);
      const m = J + 1;                                                        // R(J)
      tmp.push([nu0 + (B1 + B0) * m + (B1 - B0) * m * m, pob]);
      if (J >= 2) tmp.push([nu0 - (B1 + B0) * J + (B1 - B0) * J * J, pob]);   // P(J)
      if (rama && J >= 2) tmp.push([nu0 + (B1 - B0) * J * (J + 1), pob * 0.9]);   // Q(J)
      pm = Math.max(pm, pob);
    }
    for (const [p, w] of tmp) L.push([p, (amax * w) / pm, 0.11]);
  };
  banda(2349.14, 0.38714, 2.4, false);
  banda(667.38, 0.39064, 0.5, true);
  return L;
}
/** Absorbancia de la muestra en el espectro fino. */
function absorbancia(m, tec) {
  const A = new Float64Array(NF), M = MUESTRAS[m];
  if (!M.bandas.length) return A;
  for (const [c, w, k, forma] of M.bandas) {
    const span = forma === 'G' ? w * 2 : w * 12;
    const j0 = Math.max(1, Math.floor((c - span) / DS)), j1 = Math.min(NF - 1, Math.ceil((c + span) / DS));
    for (let j = j0; j <= j1; j++) {
      const s = j * DS, x = (s - c) / w;
      const p = forma === 'G' ? Math.exp(-4 * Math.LN2 * x * x) : 1 / (1 + 4 * x * x);
      A[j] += k * p * (tec === 'atr' ? espesorEfectivo(s, M.n) : M.b);
    }
  }
  return A;
}
/** Interferograma (lado positivo, k = 0 … NF) de un espectro fino, por FFT de la extensión par. */
function interferograma(spec) {
  const N2 = 2 * NF, re = new Float64Array(N2), im = new Float64Array(N2);
  for (let j = 0; j < NF; j++) { re[j] = spec[j]; if (j) re[N2 - j] = spec[j]; }
  fft(re, im);
  const I = new Float64Array(NF);
  for (let k = 0; k < NF; k++) I[k] = re[k] * DS;
  return I;
}
const APOD = {
  box: () => 1,
  tri: (u) => 1 - u,
  hg: (u) => 0.54 + 0.46 * Math.cos(Math.PI * u),
};
/** Espectro recuperado del interferograma truncado en K puntos y apodizado. Devuelve {s: Float64Array, ds}. */
function transformar(I, K, apod) {
  let M = 1; while (M < 2 * K) M <<= 1;
  const N2 = 2 * M, re = new Float64Array(N2), im = new Float64Array(N2), w = APOD[apod];
  for (let k = 0; k <= K; k++) { const v = I[k] * w(k / K); re[k] = v; if (k) re[N2 - k] = v; }
  fft(re, im);
  const n = N2 / 2, s = new Float64Array(n);
  for (let m = 0; m < n; m++) s[m] = 2 * DD * re[m];
  let w2 = 0; for (let k = -K; k <= K; k++) w2 += w(Math.abs(k) / K) ** 2;
  return { s, ds: 1 / (N2 * DD), ruido: 2 * DD * SIGMA_I * Math.sqrt(w2 / 2) };
}
function gauss() { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }

const QATR = ['qatr_cuerpo', 'qatr_placa', 'prisma_diamante', 'optica_atr', 'abrazadera'];
const C_IR = new THREE.Color(0xff7a3d), C_MOD = new THREE.Color(0xff5030), C_LAS = new THREE.Color(0xe0203f), C_EVA = new THREE.Color(0xffd27a);

export class Simulacion {
  constructor(eq, els) {
    this.refs = eq.analyzer;
    this.els = { spec: els.canvases[0], ifg: els.canvases[1], ...els.read };
    const A = this.refs.group;
    this.pIR = new PointPool(A, 500, 0.42);
    this.pLas = new PointPool(A, 120, 0.22);
    this.pEva = new PointPool(A, 60, 0.3);
    this.muestra = 'acetona'; this.tecnica = 'atr'; this.res = 4; this.scans = 16; this.apod = 'hg'; this.vista = 'abs';
    this.cache = new Map();
    this.fotones = [];
    this.t = 0; this.fase = 0; this.n = 0; this.pausa = 0;
    this.setVisible(false);
  }
  setVisible(v) {
    for (const p of [this.pIR, this.pLas, this.pEva]) p.visible = v;
    for (const k of Object.keys(this.refs.haces)) for (const m of this.refs.haces[k]) m.visible = v;
  }
  setTheme(light) {
    this.light = light;
    for (const p of [this.pIR, this.pLas, this.pEva]) p.setTheme(light);
    for (const m of Object.values(this.refs.matHaz)) { m.blending = light ? THREE.NormalBlending : THREE.AdditiveBlending; m.needsUpdate = true; }
  }
  start() { this.active = true; this.setVisible(true); this.recalcular(); this.reiniciarMedida(); this.aplicarTecnica(); }
  stop() {
    this.active = false; this.setVisible(false);
    this.refs.portaTrans.visible = false;
    for (const id of QATR) { const p = parts.get(id); if (p) ownMeshes(p.object, (m) => { m.visible = true; }); }
    this.refs.carro.position.set(0, 0, 0);
    for (const m of Object.values(this.refs.matHaz)) m.opacity = 0;
  }
  setControl(id, v) {
    if (id === 'muestra') this.muestra = v;
    else if (id === 'tecnica') this.tecnica = v;
    else if (id === 'res') this.res = +v;
    else if (id === 'scans') this.scans = +v;
    else if (id === 'apod') this.apod = v;
    else if (id === 'vista') { this.vista = v; this.drawUI(); return; }
    this.recalcular();
    this.reiniciarMedida();
    if (this.active) this.aplicarTecnica();
  }
  options() { return null; }
  value() { return null; }

  /* ---------- cálculo espectral ---------- */
  interf(clave, f) { if (!this.cache.has(clave)) this.cache.set(clave, f()); return this.cache.get(clave); }
  recalcular() {
    const tec = this.tecnica, m = this.muestra;
    const Bf = this.interf('Bf' + tec, () => fondo(tec));
    const Ib = this.interf('Ib' + tec, () => interferograma(Bf));
    const Is = this.interf(`Is${tec}${m}`, () => {
      const A = absorbancia(m, tec), Sf = new Float64Array(NF);
      for (let j = 0; j < NF; j++) Sf[j] = Bf[j] * 10 ** -A[j];
      return interferograma(Sf);
    });
    this.Ib = Ib; this.Is = Is;
    this.dmax = 1 / this.res;                              // retardo máximo (cm)
    this.K = Math.ceil(this.dmax / DD);
    const b = transformar(Ib, this.K, this.apod), s = transformar(Is, this.K, this.apod);
    this.ds = b.ds; this.ruido = b.ruido;
    // rango representado 4000–400 cm⁻¹
    const i0 = Math.floor(400 / b.ds), i1 = Math.ceil(4000 / b.ds);
    this.i0 = i0; this.n0 = i1 - i0 + 1;
    this.B = b.s.slice(i0, i1 + 1); this.Sl = s.s.slice(i0, i1 + 1);
    // espectro de transmisión equivalente (sin ruido) para comparar con el ATR
    if (this.tecnica === 'atr' && MUESTRAS[m].bandas.length) {
      const A = absorbancia(m, 'trans'), out = new Float64Array(this.n0);
      for (let i = 0; i < this.n0; i++) { const j = Math.round(((i + i0) * b.ds) / DS); out[i] = A[Math.min(NF - 1, j)]; }
      this.Atrans = out;
    } else this.Atrans = null;
    this.I0 = Ib[0];
    // ruido del fondo: medido antes con el mismo número de barridos
    this.nB = Float64Array.from({ length: this.n0 }, () => (gauss() * this.ruido) / Math.sqrt(this.scans));
  }
  reiniciarMedida() {
    this.n = 0; this.fase = 0; this.pausa = 0;
    this.sumS = new Float64Array(this.n0);
    this.nS = new Float64Array(this.n0);
  }
  /** Añade un barrido al promedio de la muestra. */
  barrido() {
    this.n++;
    for (let i = 0; i < this.n0; i++) { this.sumS[i] += gauss() * this.ruido; this.nS[i] = this.sumS[i] / this.n; }
  }
  aplicarTecnica() {
    const trans = this.tecnica === 'trans';
    for (const id of QATR) { const p = parts.get(id); if (p) ownMeshes(p.object, (mm) => { mm.visible = !trans; }); }
    this.refs.portaTrans.visible = trans;
    for (const m of this.refs.haces.salida) m.visible = !trans;
    for (const m of this.refs.haces.transmision) m.visible = trans;
    this.camino = this.polilinea(trans ? CAMINO.transmision : CAMINO.salida);
  }
  polilinea(pts) {
    const seg = []; let L = 0;
    for (let i = 0; i < pts.length - 1; i++) { const l = pts[i].distanceTo(pts[i + 1]); seg.push([pts[i], pts[i + 1], L, l]); L += l; }
    return { seg, L, en(d) { for (const [a, b, s0, l] of seg) if (d <= s0 + l) return a.clone().lerp(b, (d - s0) / l); return pts[pts.length - 1].clone(); } };
  }
  /** Interferograma (sin componente continua) en el retardo δ (cm), normalizado al máximo. */
  ifgEn(delta, I = this.Is) {
    const k = Math.min(this.K, Math.abs(delta) / DD), k0 = Math.floor(k), f = k - k0;
    return (I[k0] * (1 - f) + I[Math.min(NF - 1, k0 + 1)] * f) / this.I0;
  }

  /* ---------- animación ---------- */
  update(dt) {
    if (!this.active) return;
    dt = Math.min(dt, 0.05); this.t += dt;
    if (this.n >= this.scans) {                                  // medida completa: pausa y nueva medida
      this.pausa += dt; if (this.pausa > 3) this.reiniciarMedida();
    } else {
      this.fase += dt;
      if (this.fase >= SCAN_T + RET_T) { this.fase = 0; this.barrido(); }
    }
    const barriendo = this.fase < SCAN_T && this.n < this.scans;
    const u = barriendo ? this.fase / SCAN_T : this.n >= this.scans ? 0.5 : 1 - (this.fase - SCAN_T) / RET_T;
    this.delta = (2 * u - 1) * this.dmax;
    this.barriendo = barriendo;
    // espejo móvil: desplazamiento mecánico = δ/2 (exagerado a bajas resoluciones para que se vea)
    const amp = Math.max(this.dmax / 2, 0.25);
    this.refs.carro.position.copy(DIR_T).multiplyScalar(((2 * u - 1) * amp));
    // a veces otra pieza vuelve a mostrar el QATR-S (cambio de modo): se impone la técnica elegida
    if ((this.frame = (this.frame || 0) + 1) % 20 === 0) this.aplicarTecnica();
    // haces
    const I = barriendo ? this.ifgEn(this.delta) : 0;
    const k = this.light ? 0.75 : 1;
    this.refs.matHaz.ir.opacity = 0.32 * k;
    this.refs.matHaz.mod.opacity = (0.12 + 0.22 * (1 + I)) * k;
    this.refs.matHaz.laser.opacity = 0.75;
    // fotones: entrada (fuente → divisor), brazos y salida modulada
    const ent = this.ent || (this.ent = this.polilinea(CAMINO.entrada));
    const bf = this.bf || (this.bf = this.polilinea(CAMINO.brazoFijo)), bm = this.bm || (this.bm = this.polilinea(CAMINO.brazoMovil));
    this.pIR.begin();
    const v = 9;
    for (let i = 0; i < 14; i++) { const d = ((this.t * v + (i * ent.L) / 14) % ent.L); this.pIR.push(ent.en(d), C_IR, 0.9); }
    for (const br of [bf, bm]) for (let i = 0; i < 6; i++) { const d = ((this.t * v + (i * br.L) / 6) % (2 * br.L)); this.pIR.push(br.en(d < br.L ? d : 2 * br.L - d), C_IR, 0.75); }
    const cam = this.camino;
    for (let i = 0; i < 46; i++) { const d = (this.t * v + (i * cam.L) / 46) % cam.L; this.pIR.push(cam.en(d), C_MOD, 0.45 + 0.5 * (1 + I) / 2); }
    this.pIR.end();
    this.pEva.begin();
    if (this.tecnica === 'atr') {
      const pr = QA.PR;
      for (let i = 0; i < 24; i++) {
        const a = (i / 24) * Math.PI * 2 + this.t * 0.7, r = 0.12 + 0.1 * Math.sin(i * 1.7);
        const h = (0.04 + 0.12 * ((i * 7) % 5) / 5) * (1 + 0.3 * Math.sin(this.t * 6 + i));
        this.pEva.push(new THREE.Vector3(pr.x + Math.cos(a) * r, pr.y + h, pr.z + Math.sin(a) * r * 1.6), C_EVA, 0.5 + 0.4 * (1 + I) / 2);
      }
    }
    this.pEva.end();
    this.pLas.begin();
    for (const m of this.refs.haces.laser) {
      const p = m.geometry.parameters, L = p.height, dir = new THREE.Vector3(0, 1, 0).applyQuaternion(m.quaternion);
      for (let i = 0; i < 4; i++) { const d = ((this.t * 6 + (i * L) / 4) % L) - L / 2; this.pLas.push(m.position.clone().addScaledVector(dir, d), C_LAS, 0.9); }
    }
    this.pLas.end();
    if (this.frame % 3 === 0) this.drawUI();
  }

  /* ---------- gráficas ---------- */
  drawUI() {
    if (!this.B) return;
    this.drawSpectrum(); this.drawIfg();
    const e = this.els;
    const d = this.delta || 0;
    e.opd.textContent = Math.abs(d) >= 0.1 ? `${(d * 10).toFixed(2).replace('.', ',')} mm` : `${(d * 1e4).toFixed(0)} µm`;
    e.franjas.textContent = this.barriendo ? `${Math.floor((d + this.dmax) / LAMBDA).toLocaleString('es-ES')}` : '—';
    e.scan.textContent = `${Math.min(this.n + (this.barriendo ? 1 : 0), this.scans)} / ${this.scans}`;
    const i = Math.round(2150 / this.ds) - this.i0, b = this.B[i];
    const nn = Math.max(1, this.n);
    const sigT = (this.ruido * Math.sqrt(1 / nn + 1 / this.scans)) / b;
    e.sn.textContent = `${Math.round(1 / sigT).toLocaleString('es-ES')} : 1`;
  }
  spectro() {
    // espectros con ruido: fondo (N barridos) y muestra (n barridos acumulados)
    const n0 = this.n0, Bn = new Float64Array(n0), Sn = new Float64Array(n0), any = this.n > 0;
    for (let i = 0; i < n0; i++) { Bn[i] = this.B[i] + this.nB[i]; Sn[i] = this.Sl[i] + (any ? this.nS[i] : 0); }
    return { Bn, Sn, any };
  }
  drawSpectrum() {
    const [g, w, h] = setupCanvas(this.els.spec);
    const C = chartColors(), L = 42, R = 10, Tp = 18, Bt = 30, pw = w - L - R, ph = h - Tp - Bt;
    const X = (s) => L + ((4000 - s) / 3600) * pw;
    const { Bn, Sn, any } = this.spectro();
    const M = MUESTRAS[this.muestra], vista = this.vista, n0 = this.n0, ds = this.ds, i0 = this.i0;
    g.font = '10px Segoe UI, sans-serif'; g.lineWidth = 1;
    // eje X
    g.strokeStyle = C.axis; g.beginPath(); g.moveTo(L, Tp); g.lineTo(L, Tp + ph); g.lineTo(L + pw, Tp + ph); g.stroke();
    g.fillStyle = C.text; g.textAlign = 'center';
    const pasoX = pw < 420 ? 1000 : 500;
    for (let s = 4000; s >= 500; s -= pasoX) { g.fillText(s, X(s), Tp + ph + 12); g.strokeStyle = C.grid; g.beginPath(); g.moveTo(X(s), Tp); g.lineTo(X(s), Tp + ph); g.stroke(); }
    g.fillText('número de onda (cm⁻¹)', L + pw / 2, Tp + ph + 24);
    // datos
    let y = null, lo = 0, hi = 1, eti = '', serie = null, ref = null;
    if (vista === 'haz') {
      // escala común: 1 = máximo del haz sin accesorio (así se ve la energía que se pierde en el ATR)
      const mx = 2;
      serie = Sn.map((v) => v / mx); ref = Bn.map((v) => v / mx); lo = 0; hi = 1.05; eti = 'señal (1 = haz vacío)';
    } else {
      const Tr = new Float64Array(n0);
      for (let i = 0; i < n0; i++) Tr[i] = Sn[i] / Math.max(1e-6, Bn[i]);
      if (vista === 'trans') { serie = Tr.map((v) => v * 100); lo = 0; hi = 105; eti = '%T'; for (const v of serie) lo = Math.min(lo, v); lo = Math.floor(Math.max(-10, lo)); }
      else {
        serie = Tr.map((v) => -Math.log10(Math.max(1e-3, v)));
        let mx = 0.1; for (let i = 0; i < n0; i++) { const s = (i + i0) * ds; if (s > 450 && s < 3900) mx = Math.max(mx, serie[i]); }
        hi = Math.min(3.2, mx * 1.15); lo = -0.05 * hi; eti = 'absorbancia';
      }
    }
    y = (v) => Tp + ph - ((v - lo) / (hi - lo)) * ph;
    // eje Y
    g.textAlign = 'right'; g.fillStyle = C.text;
    const paso = vista === 'trans' ? 25 : vista === 'haz' ? 0.25 : hi > 2 ? 0.5 : hi > 0.8 ? 0.2 : hi > 0.3 ? 0.1 : 0.05;
    for (let v = Math.ceil(lo / paso) * paso; v <= hi + 1e-9; v += paso) {
      g.fillText(vista === 'trans' ? v.toFixed(0) : v.toFixed(2).replace('.', ','), L - 4, y(v) + 3);
      g.strokeStyle = C.grid; g.beginPath(); g.moveTo(L, y(v)); g.lineTo(L + pw, y(v)); g.stroke();
    }
    g.save(); g.translate(10, Tp + ph / 2); g.rotate(-Math.PI / 2); g.textAlign = 'center'; g.fillText(eti, 0, 0); g.restore();
    const trazo = (arr, col, lw = 1.2, dash) => {
      g.save(); g.beginPath(); g.rect(L, Tp, pw, ph); g.clip();
      g.strokeStyle = col; g.lineWidth = lw; if (dash) g.setLineDash(dash); g.beginPath();
      // un punto por píxel (máximo y mínimo para no perder líneas finas)
      const ppx = Math.max(1, Math.floor(n0 / pw));
      let first = true;
      for (let i = n0 - 1; i >= 0; i -= ppx) {
        let a = arr[i], b = arr[i];
        for (let k = 1; k < ppx && i - k >= 0; k++) { a = Math.min(a, arr[i - k]); b = Math.max(b, arr[i - k]); }
        const xx = X((i + i0) * ds);
        if (first) { g.moveTo(xx, y(a)); first = false; } else g.lineTo(xx, y(a));
        if (b !== a) g.lineTo(xx, y(b));
      }
      g.stroke(); g.restore();
    };
    if (vista === 'haz') { trazo(ref, C.axis, 1.0); if (any) trazo(serie, C.line, 1.2); }
    else {
      if (vista === 'abs' && this.Atrans) {
        let ma = 0, mt = 0; for (let i = 0; i < n0; i++) { const s = (i + i0) * ds; if (s > 450 && s < 3900) { ma = Math.max(ma, this.B[i] > 0 ? -Math.log10(Math.max(1e-3, this.Sl[i] / this.B[i])) : 0); mt = Math.max(mt, this.Atrans[i]); } }
        if (mt > 0) trazo(this.Atrans.map((v) => (v * ma) / mt), C.axis, 1.0, [4, 3]);
      }
      if (any) trazo(serie, C.line, 1.25);
    }
    // marcas de bandas
    if (any && vista !== 'haz') {
      g.font = '9.5px Segoe UI, sans-serif'; g.textAlign = 'center'; g.fillStyle = C.text;
      const puestos = [];
      for (const [s, t] of M.marcas) {
        const i = Math.round(s / ds) - i0; if (i < 0 || i >= n0) continue;
        let v = serie[i]; for (let k = -3; k <= 3; k++) { const q = serie[Math.min(n0 - 1, Math.max(0, i + k))]; v = vista === 'trans' ? Math.min(v, q) : Math.max(v, q); }
        let yy = vista === 'trans' ? Math.min(Tp + ph - 4, y(v) + 12) : Math.max(Tp + 9, y(v) - 5);
        const w2 = g.measureText(t).width / 2 + 2, xx = X(s);
        // se separan en vertical los rótulos que se solaparían
        for (let n = 0; n < 4 && puestos.some((p) => Math.abs(p[0] - xx) < p[2] + w2 && Math.abs(p[1] - yy) < 11); n++) yy += vista === 'trans' ? 11 : -11;
        puestos.push([xx, yy, w2]);
        g.fillText(t, xx, yy);
      }
    }
    // cabecera
    g.textAlign = 'left'; g.font = '11px Segoe UI, sans-serif'; g.fillStyle = C.text;
    const tec = this.tecnica === 'atr' ? 'ATR diamante (QATR-S)' : `transmisión, ${M.film || 'haz vacío'}`;
    const res = `${String(this.res).replace('.', ',')} cm⁻¹ · ${this.n}/${this.scans} barridos`;
    const dcha = vista === 'abs' && this.Atrans ? '- - transmisión (escalada)' : vista === 'haz' ? 'fondo   muestra' : '';
    let cab = `${M.nombre} · ${tec} · ${res}`;
    const cabe = (t) => g.measureText(t).width + (dcha ? g.measureText(dcha).width + 16 : 0) < pw;
    if (!cabe(cab)) cab = `${M.nombre.split(' (')[0]} · ${this.tecnica === 'atr' ? 'ATR' : 'transmisión'} · ${res}`;
    const conDcha = cabe(cab);
    g.fillText(cab, L + 2, Tp - 6);
    if (conDcha && vista === 'abs' && this.Atrans) { g.textAlign = 'right'; g.fillStyle = C.axis; g.fillText(dcha, L + pw, Tp - 6); }
    if (conDcha && vista === 'haz') { g.textAlign = 'right'; g.fillStyle = C.axis; g.fillText('fondo', L + pw - 50, Tp - 6); g.fillStyle = C.line; g.fillText('muestra', L + pw, Tp - 6); }
  }
  drawIfg() {
    const [g, w, h] = setupCanvas(this.els.ifg);
    const C = chartColors(), L = 8, R = 8, pw = w - L - R;
    const h1 = Math.floor(h * 0.5), T1 = 14, T2 = h1 + 22, h2 = h - T2 - 16;
    g.font = '10px Segoe UI, sans-serif'; g.fillStyle = C.text; g.textAlign = 'left';
    // --- interferograma completo (±δmax)
    g.fillText(`Interferograma ±${(this.dmax * 10).toFixed(this.dmax < 0.1 ? 2 : 1).replace('.', ',')} mm${pw > 250 ? ' (amplitud comprimida)' : ' (comprimido)'}`, L, T1 - 3);
    const y1 = (v) => T1 + (h1 - T1) / 2 - Math.sign(v) * Math.abs(v) ** 0.5 * ((h1 - T1) / 2) * 0.95;
    g.strokeStyle = C.grid; g.beginPath(); g.moveTo(L, y1(0)); g.lineTo(L + pw, y1(0)); g.stroke();
    const xd = (d) => L + ((d + this.dmax) / (2 * this.dmax)) * pw;
    const cur = this.barriendo ? this.delta : this.n >= this.scans ? this.dmax : -this.dmax;
    for (const [col, d0, d1] of [[C.axis, -this.dmax, this.dmax], [C.line, -this.dmax, cur]]) {
      if (d1 <= d0) continue;
      g.strokeStyle = col; g.lineWidth = 1; g.beginPath();
      for (let px = Math.floor(xd(d0) - L); px <= Math.ceil(xd(d1) - L); px++) {
        const da = -this.dmax + (px / pw) * 2 * this.dmax, db = da + (2 * this.dmax) / pw;
        let a = Infinity, b = -Infinity;
        const ka = Math.floor(Math.abs(da) / DD), kb = Math.floor(Math.abs(db) / DD), kmin = Math.min(ka, kb), kmax = Math.max(ka, kb);
        const pasoK = Math.max(1, Math.floor((kmax - kmin) / 40));
        if (da < 0 && db > 0) { a = Math.min(a, 0); b = 1; }
        for (let k = kmin; k <= Math.min(this.K, kmax); k += pasoK) { const v = this.Is[k] / this.I0; a = Math.min(a, v); b = Math.max(b, v); }
        if (!isFinite(a)) continue;
        g.moveTo(L + px, y1(Math.max(-1, a))); g.lineTo(L + px, y1(Math.min(1, b)) - 0.5);
      }
      g.stroke();
    }
    if (this.barriendo) { g.strokeStyle = C.cursor; g.setLineDash([3, 3]); g.beginPath(); g.moveTo(xd(cur), T1); g.lineTo(xd(cur), h1); g.stroke(); g.setLineDash([]); }
    g.fillStyle = C.text; g.textAlign = 'left'; g.fillText('δ = 0', xd(0) + 4, T1 + 10);
    // --- detalle junto a δ = 0: láser de referencia y puntos de muestreo
    const Z = 6e-4;                                                     // ±6 µm
    g.textAlign = 'left'; g.fillText('Detalle ±6 µm: láser y muestreo', L, T2 - 6);
    const y2 = (v) => T2 + h2 / 2 - v * (h2 / 2) * 0.92, xz = (d) => L + ((d + Z) / (2 * Z)) * pw;
    g.strokeStyle = C.grid; g.beginPath(); g.moveTo(L, y2(0)); g.lineTo(L + pw, y2(0)); g.stroke();
    g.strokeStyle = '#d6334f'; g.globalAlpha = 0.65; g.lineWidth = 1; g.beginPath();
    for (let px = 0; px <= pw; px++) { const d = -Z + (px / pw) * 2 * Z; const v = Math.cos((2 * Math.PI * d) / LAMBDA) * 0.35; px ? g.lineTo(L + px, y2(v)) : g.moveTo(L + px, y2(v)); }
    g.stroke(); g.globalAlpha = 1;
    g.strokeStyle = C.line; g.lineWidth = 1.2; g.beginPath();
    for (let px = 0; px <= pw; px++) { const d = -Z + (px / pw) * 2 * Z; const v = this.ifgEn(d); px ? g.lineTo(L + px, y2(v)) : g.moveTo(L + px, y2(v)); }
    g.stroke();
    g.fillStyle = C.line;
    const kz = Math.floor(Z / DD);
    for (let k = -kz; k <= kz; k++) { const d = k * DD; g.beginPath(); g.arc(xz(d), y2(this.ifgEn(d)), 1.8, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = C.text; g.textAlign = 'right'; g.font = '9px Segoe UI, sans-serif';
    g.fillText(`un punto cada λ/2 = ${(LAMBDA * 1e7 / 2).toFixed(0)} nm`, L + pw, h - 4);
    g.textAlign = 'left'; g.fillStyle = '#d6334f'; g.fillText('láser', L, h - 4);
  }
}

/** Definición del panel de simulación que construye el visor. */
export const PANEL = {
  titulo: 'Simulación del FTIR',
  controles: [
    { id: 'muestra', label: 'Muestra', value: 'acetona', opciones: Object.entries(MUESTRAS).map(([k, v]) => [k, v.nombre]) },
    { id: 'tecnica', label: 'Técnica', value: 'atr', opciones: [['atr', 'ATR (QATR-S, diamante)'], ['trans', 'Transmisión']] },
    { id: 'res', label: 'Resolución', value: '4', opciones: RES.map((r) => [String(r), `${String(r).replace('.', ',')} cm⁻¹`]) },
    { id: 'scans', label: 'Barridos', value: '16', opciones: [1, 4, 16, 64].map((n) => [String(n), String(n)]) },
    { id: 'vista', label: 'Gráfica', value: 'abs', opciones: [['abs', 'Absorbancia'], ['trans', 'Transmitancia'], ['haz', 'Haz simple']] },
  ],
  lecturas: [['opd', 'Retardo δ'], ['franjas', 'Franjas del láser'], ['scan', 'Barrido'], ['sn', 'S/N a 2150 cm⁻¹']],
  nota: 'Resolución nominal = 1/δmax, con apodización de Happ-Genzel. El ruido baja con √N y sube al afinar la resolución. En ATR las bandas crecen hacia números de onda bajos (dp ∝ λ) y entre 2300 y 1900 cm⁻¹ el diamante absorbe. Posiciones de banda reales; intensidades, fuente y ruido orientativos. En 3D, el recorrido del espejo se exagera a bajas resoluciones.',
  leyenda: [['#ff7a3d', 'haz infrarrojo'], ['#ff5030', 'haz modulado'], ['#e0203f', 'láser de referencia'], ['#ffd27a', 'onda evanescente']],
  graficas: ['Espectro tras la transformada de Fourier', 'Interferograma y muestreo con el láser'],
};
