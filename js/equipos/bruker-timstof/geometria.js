// Geometría local del timsTOF (cm). Eje iónico = +X local (en el mundo, del frente hacia el fondo); el TOF ortogonal sube por +Y.
import * as THREE from 'three';

export const AX = {
  SPRAY: new THREE.Vector3(-3.2, 3.0, 0),     // emisor CaptiveSpray
  CAP0: -1.0, CAP1: 12.0, CAP_Y: 3.0,         // capilar de vidrio (eje elevado)
  DEFL: new THREE.Vector3(13.2, 3.0, 0),      // placa de deflexión (90°)
  F1_0: 14.5, F1_1: 23.0,                     // embudo de entrada
  T_0: 24.0, T_MID: 28.8, T_1: 33.6,          // túnel TIMS (≈ 96 mm): acumulación | análisis
  F2_0: 34.6, F2_1: 40.5,                     // embudo de salida
  MP_0: 41.5, MP_1: 51.5,                     // guía de iones de transferencia
  Q_0: 52.5, Q_1: 69.5,                       // cuadrupolo
  C_0: 70.5, C_1: 84.0,                       // celda de colisión
  TR_0: 85.0, TR_1: 91.5,                     // óptica de transferencia
  PUSH: new THREE.Vector3(95.0, 0, 0),        // acelerador ortogonal (pusher)
  REFL: new THREE.Vector3(101.5, 76.0, 0),    // punto de giro en el reflectrón
  REF0: 66, REF1: 82,                         // reflectrón (y)
  DET: new THREE.Vector3(108.0, 3.0, 0),      // detector MCP
  TOF_X0: 91.0, TOF_X1: 112.0, TOF_Y0: 4.0, TOF_Y1: 84.0,
  TIMS_R: 0.4,
};
// eje iónico a 88 cm (fuente CaptiveSpray a ≈ 91 cm, sobre la banda gris del frontal); el TOF queda bajo la torre
export const ORIGEN = new THREE.Vector3(-15, 88, 71);
