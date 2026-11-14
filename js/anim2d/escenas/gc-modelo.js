// Modelo de retención y ensanchamiento para cromatografía de gases capilar (no es una escena: no exporta crear()).
// Lo usan la simulación del Agilent 7890B y las escenas gc-*.js.
//
// Retención: para los n-alcanos, ln k = (H₀ + n·h)/T + S₀ + n·s + ln(250/β): ln k crece linealmente con el número de carbonos y
// disminuye con la temperatura (van 't Hoff). Constantes ajustadas para una fase de 100 % dimetilpolisiloxano (β = 250 en una
// columna de 0,25 mm × 0,25 µm), de modo que k(n-C10, 100 °C) ≈ 2 y cada CH₂ multiplica k por ≈ 2 a 100 °C y por ≈ 1,6 a 150 °C.
// Los demás compuestos se sitúan con su índice de retención de Kovats (supuesto independiente de la temperatura).
// Ensanchamiento: ecuación de Golay para columnas abiertas, H = 2D/ū + C_m·ū + C_s·ū, con D ∝ T^1,75.
// Los valores son aproximados y tienen fines didácticos.

export const R_ALC = { H0: -970, h: 650, S0: -3.54, s: -1.05 };

/** Compuestos: índice de retención en fase apolar (aprox.) y número efectivo de carbonos (respuesta del FID). */
export const COMPUESTOS = {
  C8: { nombre: 'n-octano', corto: 'C8', I: 800, ecn: 8 },
  C9: { nombre: 'n-nonano', corto: 'C9', I: 900, ecn: 9 },
  C10: { nombre: 'n-decano', corto: 'C10', I: 1000, ecn: 10 },
  C11: { nombre: 'n-undecano', corto: 'C11', I: 1100, ecn: 11 },
  C12: { nombre: 'n-dodecano', corto: 'C12', I: 1200, ecn: 12 },
  C13: { nombre: 'n-tridecano', corto: 'C13', I: 1300, ecn: 13 },
  C14: { nombre: 'n-tetradecano', corto: 'C14', I: 1400, ecn: 14 },
  C15: { nombre: 'n-pentadecano', corto: 'C15', I: 1500, ecn: 15 },
  C16: { nombre: 'n-hexadecano', corto: 'C16', I: 1600, ecn: 16 },
  benceno: { nombre: 'benceno', corto: 'B', I: 655, ecn: 6 },
  tolueno: { nombre: 'tolueno', corto: 'T', I: 760, ecn: 7 },
  etilbenceno: { nombre: 'etilbenceno', corto: 'EB', I: 853, ecn: 8 },
  mxileno: { nombre: 'm-xileno', corto: 'm', I: 864, ecn: 8 },
  pxileno: { nombre: 'p-xileno', corto: 'p', I: 865, ecn: 8 },
  oxileno: { nombre: 'o-xileno', corto: 'o', I: 886, ecn: 8 },
};
export const MEZCLAS = {
  alcanos: { nombre: 'n-alcanos C8–C16', comps: ['C8', 'C9', 'C10', 'C11', 'C12', 'C13', 'C14', 'C15', 'C16'], ref: 'C12' },
  btex: { nombre: 'BTEX (benceno, tolueno, etilbenceno, xilenos)', comps: ['benceno', 'tolueno', 'etilbenceno', 'mxileno', 'pxileno', 'oxileno'], ref: 'tolueno' },
};

/** Gases portadores: coeficiente de difusión de un soluto típico a 100 °C y a la presión media de la columna (cm²/s, aprox.)
 *  y viscosidad a 300 K (Pa·s) con su exponente de temperatura. */
export const GASES = {
  he: { nombre: 'Helio', D: 0.14, eta: 1.99e-5, ex: 0.69 },
  h2: { nombre: 'Hidrógeno', D: 0.19, eta: 0.89e-5, ex: 0.68 },
  n2: { nombre: 'Nitrógeno', D: 0.06, eta: 1.79e-5, ex: 0.7 },
};
const DS = 5e-6;   // difusión en la fase estacionaria (cm²/s, orden de magnitud)
export const UTE = 0.7;  // fracción de la eficiencia teórica que alcanza una columna real (recubrimiento no ideal)

export function lnkAlcano(n, T, beta = 250) {
  const { H0, h, S0, s } = R_ALC;
  return (H0 + n * h) / T + S0 + n * s + Math.log(250 / beta);
}
/** ln k de un compuesto con índice I a la temperatura T (K). */
export function lnk(I, T, beta = 250) {
  const n = Math.floor(I / 100), f = I / 100 - n;
  const a = lnkAlcano(n, T, beta), b = lnkAlcano(n + 1, T, beta);
  return a + f * (b - a);
}
export const kDe = (I, T, beta) => Math.exp(lnk(I, T, beta));

/** Altura de plato (cm) según Golay. u en cm/s, r y df en cm, T en K. */
export function alturaPlato(u, k, { r, df, gas = 'he', T = 373 }) {
  const D = GASES[gas].D * (T / 373) ** 1.75;
  const fm = (1 + 6 * k + 11 * k * k) / (24 * (1 + k) ** 2);
  const B = 2 * D, Cm = (fm * r * r) / D, Cs = ((2 * k) / (3 * (1 + k) ** 2)) * (df * df) / DS;
  return B / u + (Cm + Cs) * u;
}

/** Presión en cabeza y caudal (flujo compresible de Poiseuille) para una velocidad lineal media dada. */
export function neumatica({ u, L, dMm, gas = 'he', T }) {
  const r = dMm / 2000, po = 101325, g = GASES[gas], eta = g.eta * (T / 300) ** g.ex;
  const K = (r * r * po) / (16 * eta * L);
  const ubar = (P) => (1.5 * (P * P - 1) / (P ** 3 - 1)) * K * (P * P - 1);
  let a = 1.0001, b = 30;
  for (let i = 0; i < 60; i++) { const m = (a + b) / 2; if (ubar(m) < u / 100) a = m; else b = m; }
  const P = (a + b) / 2, uo = K * (P * P - 1);
  const F = Math.PI * r * r * uo * (298 / T) * 6e7;     // mL/min a 25 °C y 1 atm
  return { P, pKPa: (P - 1) * po / 1000, psi: (P - 1) * 14.696, F };
}

/** Programa del horno: { T0 (°C), t0 (min), rampa (°C/min), Tf (°C), tf (min) }; rampa 0 = isotermo. */
export function tempEn(prog, tMin) {
  const { T0, t0 = 0, rampa = 0, Tf = T0 } = prog;
  if (!rampa || tMin <= t0) return T0;
  return Math.min(Tf, T0 + rampa * (tMin - t0));
}

/**
 * Cromatograma completo. p: { mezcla, prog, gas, u (cm/s), L (m), dMm (mm), df (µm), split (relación; 0 = splitless) }.
 * Devuelve tiempos de retención, anchuras, áreas y alturas (FID), resolución del par crítico y datos de la neumática.
 */
export function cromatograma(p) {
  const { mezcla, prog, gas, u, L, dMm, df, split } = p;
  const r = dMm / 20, dfc = df * 1e-4, beta = (dMm * 1000 / 2) / (2 * df);
  const Lcm = L * 100, tM = Lcm / u;                                      // s
  const T0K = prog.T0 + 273.15;
  const neu = neumatica({ u, L, dMm, gas, T: T0K });
  const tMax = prog.rampa ? ((prog.Tf - prog.T0) / prog.rampa + prog.t0 + (prog.tf || 0)) * 60 + 600 : 3600;
  // inyección: volumen interno del liner (4 mm d.i. × 78,5 mm) ≈ 1 mL; vapor barrido a la presión y temperatura del inyector
  const Vl = Math.PI * 0.2 * 0.2 * 7.85;
  const Fin = (neu.F * (523 / 298)) / neu.P / 60;                      // mL/s de portador por la columna, en el inyector
  let sInj, frac;
  if (split > 0) { sInj = Vl / (Fin * (1 + split)) / 2; frac = 1 / (1 + split); }
  else { const tp = 45; sInj = Math.min(Vl / Fin, tp) / Math.sqrt(12); frac = Math.min(1, (tp * Fin) / Vl) * 0.95; }
  const comps = [];
  for (const id of MEZCLAS[mezcla].comps) {
    const c = COMPUESTOS[id];
    let z = 0, t = 0, k = 0;
    const dt = 0.25, tray = [0];
    const k0 = kDe(c.I, T0K, beta);
    while (z < 1 && t < tMax) {
      const T = tempEn(prog, t / 60) + 273.15;
      k = kDe(c.I, T, beta);
      z += (u * dt) / (1 + k) / Lcm; t += dt;
      if (Math.round(t / dt) % 8 === 0) tray.push(Math.min(1, z));
    }
    const eluye = z >= 1;
    const Te = tempEn(prog, t / 60) + 273.15;
    const H = alturaPlato(u, k, { r, df: dfc, gas, T: Te }) / UTE;
    const N = Lcm / H;
    const sCol = (tM * (1 + k)) / Math.sqrt(N);
    const sFoc = (sInj * (1 + k)) / (1 + k0);
    const sigma = Math.sqrt(sCol * sCol + sFoc * sFoc + 0.12 * 0.12);
    // FID: ≈ 0,015 C por gramo de carbono (valor típico); 1 nmol inyectado de cada compuesto
    const area = 1e-9 * c.ecn * 12.011 * 0.015 * frac;                 // C = A·s
    const alto = (area / (sigma * Math.sqrt(2 * Math.PI))) * 1e12;     // pA
    comps.push({ id, ...c, tR: eluye ? t : null, sigma, k, N, H, area, alto, tray, dtTray: dt * 8, Te });
  }
  const el = comps.filter((c) => c.tR != null).sort((a, b) => a.tR - b.tR);
  let crit = null;
  for (let i = 0; i + 1 < el.length; i++) {
    const a = el[i], b = el[i + 1], Rs = (b.tR - a.tR) / (2 * (a.sigma + b.sigma));
    if (!crit || Rs < crit.Rs) crit = { a, b, Rs };
  }
  const ult = el.length ? el[el.length - 1] : null;
  let tEnd = ult && el.length === comps.length ? ult.tR * 1.08 + 4 * ult.sigma + 20 : tMax;
  tEnd = Math.min(tEnd, tMax);
  const ref = comps.find((c) => c.id === MEZCLAS[mezcla].ref);
  return { comps, eluidos: el, crit, tM, tEnd, neu, beta, frac, sInj, ref };
}

/** Línea de base del FID (pA): fondo + sangrado de la columna, que crece con la temperatura y con el espesor de fase. */
export const fondoFID = (TC, df = 0.25) => 4.5 + 0.5 * (df / 0.25) * Math.exp((TC - 220) / 32);

/** Señal del FID (pA) en el instante t (s). */
export function senal(res, t, prog, df) {
  let s = fondoFID(tempEn(prog, t / 60), df);
  for (const c of res.eluidos) { const d = (t - c.tR) / c.sigma; if (d > -6 && d < 6) s += c.alto * Math.exp(-0.5 * d * d); }
  return s;
}
