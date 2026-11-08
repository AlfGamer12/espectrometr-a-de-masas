// Geometría local del analizador del triple cuadrupolo (cm). Eje iónico = +X, desde la entrada de la DL hacia el detector.
// Proporciones aproximadas dentro de una unidad MS de 1180 × 540 × 610 mm.
import * as THREE from 'three';

export const AX = {
  SPRAY: new THREE.Vector3(-2.6, 3.4, 0),    // punta de la sonda ESI (pulverización ortogonal, de arriba abajo)
  DL_IN: new THREE.Vector3(0, 0, 0),         // entrada de la línea de desolvatación (DL)
  DL1: 9.0,                                  // salida de la DL a la 1.ª cámara intermedia
  QA_0: 9.6, QA_1: 16.8,                     // UF-Qarray (1.ª cámara, ≈10² Pa)
  SKIM: 17.6,                                // skimmer (paso a la 2.ª cámara)
  UL_0: 18.8, UL_1: 27.0,                    // UF-Lens (2.ª cámara)
  WALL: [9.3, 17.6, 28.0],                   // tabiques de bombeo diferencial
  Q1_0: 29.0, Q1P: 31.0, Q1_1: 51.0,         // Q1: pre-barras 29–31, barras 31–51
  Q2_0: 52.4, Q2_1: 64.0,                    // celda de colisión UFsweeper
  Q3_0: 65.0, Q3P: 67.0, Q3_1: 87.0,         // Q3: pre-barras 65–67, barras 67–87
  DYN: new THREE.Vector3(90.0, 3.0, 0),      // dínodo de conversión (fuera de eje)
  EM: new THREE.Vector3(90.0, -3.4, 0),      // multiplicador de electrones secundarios
  R0: 0.45,
};
// Posición del origen local en el mundo (entrada de la DL). Unidad MS de 1180 × 540 × 610 mm (an × al × fondo): el eje
// iónico queda a 31 cm del suelo, a la altura de la ventana de la unidad de ionización.
export const ORIGEN = new THREE.Vector3(-44, 31, 2);
