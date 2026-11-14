// Geometría común del Agilent 7890B con inyector automático 7693A, inyector split/splitless y FID (cm, coordenadas de mundo).
// Frente hacia +Z, suelo (mesa) en y = 0. Medidas exteriores del 7890: 59 × 50 × 54 cm (ancho × alto × fondo).
// La disposición interior es aproximada: no se han usado planos del fabricante.
import * as THREE from 'three';

/** Cuerpo del cromatógrafo. */
export const GC = {
  XL: -29.5, XR: 29.5,     // laterales
  XA: -14.5,               // límite entre el módulo izquierdo (inyectores) y la puerta del horno
  XC: -13.4,               // arranque de la tapa blanca superior
  XD: 14.5,                // límite entre la puerta y la columna del teclado
  ZB: -27, ZF: 27,         // trasera y frente
  YP: 4.4,                 // altura del zócalo
  YDOOR: 40.8,             // borde superior de la puerta del horno
  YDECK: 47.5,             // cara superior de la plataforma negra de los inyectores
  YTOP: 49,                // cara superior de la tapa blanca
};

/** Cámara del horno (interior). ≈ 28 × 32 × 28 cm. */
export const OV = { x0: -16, x1: 12.5, y0: 6, y1: 38.4, z0: -6, z1: 22, roof: 40.4, back: -10 };

/** Eje del inyector split/splitless delantero y de la aguja del 7693A. */
export const INY = { x: -15, z: 12 };
/** Eje del FID delantero. */
export const DET = { x: 6, z: 13 };
/** Jaula de la columna: centro y radio de la espiral (eje Z). */
export const COL = { x: -1.5, y: 21, z: 9, R: 9, L: 2.5, vueltas: 22 };
/** Ventilador del horno (en la pared trasera). */
export const FAN = { x: -1.5, y: 21, z: -4.6 };

/** Alturas del inyector (y, cm). */
export const IY = {
  baseNut0: 36.9, baseNut1: 37.8,      // tuerca de la columna (dentro del horno)
  cuerpo0: 38.0, cuerpo1: 45.2,        // cuerpo del inyector
  bloque0: 40.8, bloque1: 45.0,        // bloque calefactado
  liner0: 38.2, liner1: 46.05,         // liner de 78,5 mm
  cabeza0: 45.2, cabeza1: 46.35,       // cabeza (inserto superior) con salidas de purga y split
  septum0: 46.4, septum1: 46.7,
  tuerca0: 46.7, tuerca1: 47.9,
};
/** Torreta y torre del 7693A. */
export const ALS = {
  tx: INY.x - 5.2, tz: INY.z, tR: 6.6, rVial: 5.2,  // centro de la torreta; la fila de viales pasa por el eje de la aguja
  t0: 48.4, t1: 53.6,                               // altura de la torreta
  guia0: 55.0, guia1: 56.2,                         // soporte de la aguja
  aguja0: 55.5, aguja1: 60.5, barril1: 66.5, embolo1: 70.7,
  caja: { x0: -21, x1: -9, y0: 57.4, y1: 93, z0: -1.6, z1: 19.6 },
};
/** Alturas del FID. */
export const FY = {
  nut0: 37.4, nut1: 38.3,              // tuerca de la columna
  base0: 38.3, base1: 41.8,            // cuerpo de la base (atraviesa el techo del horno)
  bloque0: 40.6, bloque1: 43.6,        // bloque calefactado
  chorro0: 41.0, chorro1: 44.2,        // chorro (jet); su punta, en 44,2
  aisl0: 43.7, aisl1: 44.3,            // aislante inferior
  col0: 44.6, col1: 47.0,              // colector
  cast0: 43.7, cast1: 47.7, chim1: 48.8,
  ign: 45.0,                           // altura del encendedor (glow plug)
};

/** Instalación de gases del laboratorio (contexto): reguladores en la pared y filtros sobre la mesa, a la derecha del GC. */
export const LAB = {
  regX: [42, 54, 66, 78], regY: 100, paredZ: -45,
  gases: ['Helio', 'Aire', 'Nitrógeno', 'Hidrógeno'],
  filX: [41.5, 50.5, 59.5, 68.5], filZ: -35,
  // pasamuros de la trasera del GC: portador (He) a la izquierda; gases del detector detrás del módulo EPC del FID
  bulk: { Helio: [-20, 43], Aire: [4, 43], 'Nitrógeno': [7, 43], 'Hidrógeno': [1, 43] },
};

export const V = (x, y, z) => new THREE.Vector3(x, y, z);
