// Geometría local del LCMS-9050 (cm). Eje iónico = +X local (en el mundo, del frente hacia el fondo, en la parte alta del mueble);
// el TOF ortogonal desciende por −Y local: el tubo de vuelo ocupa la altura del mueble y el reflectrón iRefTOF queda abajo.
import * as THREE from 'three';

export const AX = {
  SPRAY: new THREE.Vector3(-2.6, 3.4, 0),    // sonda ESI calefactada (pulverización ortogonal)
  CAP0: 0, DL1: 9,                           // línea de desolvatación (DL)
  QA_0: 9.6, QA_1: 16.8, SKIM: 17.6,          // UF-Qarray y skimmer
  UL_0: 18.8, UL_1: 27,                      // UF-Lens
  Q_0: 29, Q1P: 31, Q_1: 49,                 // Q1 con pre-barras
  C_0: 50.5, C_1: 62,                        // celda de colisión UFsweeper III
  GATE: 62.8,                                // UFaccumulation (salida pulsada de la celda)
  TR_0: 63.6, TR_1: 68,                      // óptica de transferencia al TOF
  PUSH: new THREE.Vector3(71, 0, 0),         // acelerador ortogonal con UFgrating
  REFL: new THREE.Vector3(77.5, -86, 0),     // punto de giro en el reflectrón iRefTOF
  REF0: -94, REF1: -74,                      // reflectrón (y)
  DET: new THREE.Vector3(84, -3.5, 0),       // detector MCP
  TOF_X0: 67, TOF_X1: 89, TOF_Y0: -96, TOF_Y1: -5,
  R0: 0.45,
};
export const ORIGEN = new THREE.Vector3(-12, 116, 50);
