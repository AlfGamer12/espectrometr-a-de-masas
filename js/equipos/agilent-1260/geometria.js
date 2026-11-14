// Geometría del Agilent 1260 Infinity II (cm). Pila única como la del laboratorio: bomba cuaternaria G7111B abajo, detector de
// diodos encima, Vialsampler con compartimento de columna integrado y bandeja de disolventes arriba. Todos los módulos miden
// 39,6 cm de ancho (dimensiones de los manuales); los frontales quedan alineados en z = ZF.
// El «Circuito de flujo» (modo 2) es un esquema ampliado del recorrido hidráulico y óptico, colocado en su propio espacio.
import * as THREE from 'three';

export const W = 39.6, X0 = -W / 2, X1 = W / 2;
export const ZF = 22;                                     // plano frontal de las puertas
export const T = 0.8;                                     // espesor de las chapas de la carcasa
/** Módulos: base y0, altura h, fondo d (manuales: bomba 180 × 396 × 436 mm, DAD 140 × 396 × 436, Vialsampler 320 × 396 × 468). */
export const MOD = {
  bomba: { y0: 0, h: 18, d: 43.6, sube: 0 },
  dad: { y0: 18, h: 14, d: 43.6, sube: 14 },
  vs: { y0: 32, h: 32, d: 46.8, sube: 30 },
  bandeja: { y0: 64, h: 11, d: 43.6, sube: 46 },
};
export const BANDA = 3;                                   // banda superior retranqueada (rótulo y embudo de fugas)
export const ICC = { y0: 32.8, y1: 41.4, z0: ZF - 1.4 - 10.65, z1: ZF - 1.4 };   // compartimento de columna integrado (86,5 × 396 × 106,5 mm)

// pasos de capilares por las chapas horizontales [x, z] (mismos en la chapa superior de un módulo y la inferior del siguiente)
export const PASO_C1 = [17, 8];                           // bomba → muestreador
export const PASO_C3 = [-13, 15];                         // columna → detector
export const RP = 0.45;                                   // radio de los pasos

/* ---------- circuito de flujo (coordenadas locales del grupo; el grupo se coloca en CIRC) ---------- */
export const CIRC = new THREE.Vector3(0, 20, 0);
export const FR = 14;                                     // fila delantera (bomba) en z
export const BR = -14;                                    // fila trasera (columna y detector) en z
export const YB = 8;                                      // la fila trasera va sobre una plataforma elevada
export const C = {
  botA: new THREE.Vector3(-56, 0, FR + 2), botB: new THREE.Vector3(-47, 0, FR - 2),
  desg: new THREE.Vector3(-33, 0, FR),                      // cámara del desgasificador (base)
  mcgv: new THREE.Vector3(-20, 0, FR),
  cam1: new THREE.Vector3(-8, 7, FR), cam2: new THREE.Vector3(5, 7, FR),     // cámaras de bombeo (centro)
  amort: new THREE.Vector3(-1.5, 2.2, FR + 7),
  purga: new THREE.Vector3(16, 7, FR),
  valv: new THREE.Vector3(30, YB + 9, 6),                   // válvula de inyección (cara hacia +z)
  aguja: new THREE.Vector3(38, YB, -2),                     // eje de la aguja (x, z); asiento a y = YB + 3
  dosif: new THREE.Vector3(30, YB + 3.2, -6),               // dosificador (eje x)
  ic: new THREE.Vector3(21, YB + 6, BR),                    // intercambiador de calor
  col0: 18.4, col1: -4.5,                                  // columna (x de entrada y salida), a y = YB + 6, z = BR
  celda: new THREE.Vector3(-28, YB + 6, -20),               // celda de flujo; eje óptico paralelo a z
  dadX: -28,
  residuo: new THREE.Vector3(-42, YB, -22),
};
/** Eje óptico del DAD (z de cada elemento, en x = C.dadX, y = YB + 6). La red refleja el haz hacia la matriz, en +x. */
export const OPT = { w: -2.5, d2: -7, acro: -12, holmio: -15, celda: -20, lente: -25, rendija: -28, red: -36, matriz: new THREE.Vector3(-18.5, YB + 6, -30.5) };
/** Plataformas del esquema: [x0, x1, z0, z1, y de la cara superior]. */
export const PLAT = { bomba: [-62, 22, 2, 24, 0], muestreador: [24, 44, -16, 12, YB], columna: [-6, 23.8, -20, -8, YB], detector: [-50, -10, -42, 0, YB] };
