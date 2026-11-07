// Geometría local del Agilent 6546 (cm). Eje iónico = +X local = +X mundo (de la fuente, a la izquierda, hacia la torre del TOF);
// el TOF ortogonal sube por +Y dentro de la torre. Proporciones aproximadas dentro de 122 × 76 × 193 cm.
import * as THREE from 'three';

export const AX = {
  SPRAY: new THREE.Vector3(-3.0, 3.6, 0),    // nebulizador Jet Stream (ortogonal al capilar)
  CAP0: 0, CAP1: 18,                         // capilar dieléctrico
  SKIM: 19.2,                                // skimmer (el fragmentor es la salida del capilar)
  OCT_0: 20.5, OCT_1: 36,                    // octopolo 1
  LENS: [37, 38.4],                          // lentes 1 y 2
  Q_0: 40, Q_1: 61,                          // cuadrupolo (varillas de 8")
  C_0: 63, C_1: 79,                          // celda de colisión (hexapolo)
  FOC_0: 80.5, FOC_1: 85,                    // lente de enfoque + guía cuadrupolar corta
  SL_0: 86, SL_1: 88.5,                      // slicer
  PUSH: new THREE.Vector3(92, 0, 0),         // pulsador
  REFL: new THREE.Vector3(99, 112, 0),       // espejo de iones (punto de giro)
  MIR0: 98, MIR1: 120,                       // espejo de dos etapas (y)
  DET: new THREE.Vector3(106, 3, 0),         // detector (MCP + centelleador + PMT)
  TOF_X0: 88, TOF_X1: 110, TOF_Y0: 4, TOF_Y1: 122,
  R0: 0.445,
};
export const ORIGEN = new THREE.Vector3(-52, 66, 14);
