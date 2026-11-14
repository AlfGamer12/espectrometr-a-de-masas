// Geometría común del Shimadzu IRSpirit con QATR-S (cm). Coordenadas del mundo: X a la derecha, Y hacia arriba, Z hacia el frontal.
// Cuerpo: 390 × 250 × 210 mm (folleto). La disposición interna es aproximada: Shimadzu no publica planos; se ha deducido de las
// fotografías (compartimento central, bloque derecho elevado, ventana de mantenimiento trasera junto al interferómetro).
// El banco óptico se construye en coordenadas del mundo (grupo del analizador en el origen, sin giro).
import * as THREE from 'three';

/** Envolvente exterior. */
export const CAJA = {
  X0: -19.5, X1: 19.5, ZB: -12.5, ZF: 12.5,
  YP: 0.5,       // patas de goma
  YZ: 3.2,       // techo del zócalo negro / arranque de los paneles blancos
  YC: 18.2,      // arranque de la cubierta superior negra
  YT: 19.6,      // cara superior de la cubierta negra
  YR: 21.0,      // techo del bloque derecho (altura total 210 mm)
  XL: -12.0,     // límite sección izquierda / compartimento
  XR: 10.5,      // límite compartimento / bloque derecho
  RC: 3.0,       // radio de la esquina delantera izquierda (planta)
  E: 0.35,       // espesor de los paneles
};

/** Compartimento de muestras (interior) y paredes. */
export const COMP = {
  x0: -11.6, x1: 9.3, z0: -4.6, z1: 12.0, y0: 5.4, yPlaca: 18.6,
  paredI: [-12.0, -11.6], paredD: [9.3, 9.7], paredT: [-5.0, -4.6], suelo: [5.0, 5.4],
};

/** Eje del haz en el compartimento y alturas del banco óptico. */
export const Y0 = 12.5;          // altura del haz infrarrojo
export const ZH = 3.5;           // posición en Z del haz a través del compartimento
export const YL = 1.0;           // el láser de referencia viaja paralelo al haz IR, 1 cm por encima

/* ---------- interferómetro de Michelson con incidencia de 30° (en el plano XZ, a la altura Y0) ---------- */
const v2 = (x, z) => new THREE.Vector3(x, Y0, z);
/** dirección del haz colimado que llega al divisor (y del brazo transmitido, hacia el espejo móvil) */
export const T = new THREE.Vector3(Math.cos(Math.PI / 6), 0, Math.sin(Math.PI / 6));
/** brazo reflejado (hacia el espejo fijo): forma 120° con T, es decir, incidencia de 30° sobre el divisor */
export const R = new THREE.Vector3(0, 0, -1);
/** normal del divisor de haz (bisectriz de R − T): forma 30° con el haz incidente */
export const NBS = R.clone().sub(T).normalize();
export const B = v2(14.3, -5.0);                                   // centro del divisor de haz
export const MF = B.clone().addScaledVector(R, 3.4);               // espejo fijo
export const MM = B.clone().addScaledVector(T, 2.6);               // espejo móvil (posición central)
export const P = B.clone().addScaledVector(T, -3.2);               // espejo colimador (paraboloide fuera de eje)
export const S = P.clone().add(new THREE.Vector3(-5, 0, 0));       // fuente cerámica (en el foco del paraboloide)
export const FM = v2(14.3, ZH);                                    // espejo plano de transferencia
/** carcasa sellada del interferómetro (paredes) */
export const INT = { x0: 9.8, x1: 19.0, z0: -9.9, z1: -1.4, y0: 9.9, y1: 15.4, e: 0.3, base: [9.6, 9.9] };

/* ---------- QATR-S: placa superior, prisma y espejos (plano XY, a z = ZH) ---------- */
export const XC = (COMP.x0 + COMP.x1) / 2;                         // centro del compartimento (-1,15)
export const YPR = 19.78;                                          // cara superior del prisma (sobresale 0,08 de la platina)
export const DQ = 3.6;                                             // separación de los espejos del ATR
export const QA = {
  M1: v2(XC + DQ, ZH), M2: new THREE.Vector3(XC + DQ, YPR - DQ, ZH),
  PR: new THREE.Vector3(XC, YPR, ZH),
  M3: new THREE.Vector3(XC - DQ, YPR - DQ, ZH), M4: v2(XC - DQ, ZH),
  caja: { x0: XC - 6, x1: XC + 6, z0: ZH - 5.5, z1: ZH + 5.5, y0: COMP.y0, y1: COMP.yPlaca },
};

/* ---------- óptica del detector (sección izquierda) ---------- */
export const EM = v2(-15.6, ZH);                                   // espejo elipsoidal
export const DET = v2(-15.6, -1.0);                                // ventana del detector DLATGS

/** Recorrido del haz infrarrojo (para la simulación): fuente → interferómetro → QATR-S → detector. */
export const CAMINO = {
  entrada: [S, P, B],
  brazoFijo: [B, MF],
  brazoMovil: [B, MM],
  salida: [B, FM, v2(COMP.paredD[1], ZH), QA.M1, QA.M2, QA.PR, QA.M3, QA.M4, v2(COMP.paredI[0], ZH), EM, DET],
  transmision: [B, FM, v2(COMP.paredD[1], ZH), v2(COMP.paredI[0], ZH), EM, DET],
};

/** Constantes físicas usadas en la simulación y en las fichas. */
export const FIS = {
  laserNm: 853.88,            // longitud de onda del láser de referencia mostrada en la pantalla de autodiagnóstico del IRSpirit
  nDiamante: 2.4, angATR: 45, nMuestra: 1.5,
};
