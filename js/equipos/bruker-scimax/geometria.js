// Geometría local del scimaX (cm). Eje iónico = +X local = +X mundo: fuente dual → embudos → cuadrupolo → celda de colisión
// → óptica de transferencia por el interior del imán → celda ParaCell en el centro del campo de 7 T. Dimensiones aproximadas.
import * as THREE from 'three';

export const AX = {
  SPRAY: new THREE.Vector3(-3.5, 0, 0),
  CAP0: -1, CAP1: 16,                 // capilar de transferencia
  F1_0: 17, F1_1: 26,                 // embudo de 1.ª etapa
  F2_0: 27, F2_1: 34,                 // embudo de 2.ª etapa
  MP_0: 35, MP_1: 43,                 // multipolo de transporte
  Q_0: 44, Q_1: 62,                   // cuadrupolo analítico (CASI)
  C_0: 63, C_1: 72,                   // celda de colisión (hexapolo)
  // óptica de transferencia ("time of flight"): acortada respecto al equipo real (≈ 1 m) para que el conjunto quepa en el mueble
  TR_0: 73, TR_1: 136,
  CELL_0: 137.5, CELL_1: 152.5,       // ParaCell (≈ 15 cm de longitud; radio 2,8 cm)
  CELL_R: 2.8,
  MAG_C: 145, MAG_L: 116, MAG_R: 40, BORE_R: 7.5,   // imán superconductor: centro, longitud, radio exterior del criostato, bore
  UHV_END: 221,                       // extremo del tubo UHV, fuera del imán (turbo UHV y preamplificador)
};
// el analizador se monta girado 180° (equipo.js): la fuente queda en el extremo +X (frente real del equipo) y el imán hacia −X
export const ORIGEN = new THREE.Vector3(120, 120, 0);
export const FIS = { B: 7.0 };
