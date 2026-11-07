// Geometría local del analizador MALDI-TOF (cm). Eje iónico = +X local, desde la diana hacia el final del tubo de vuelo.
// En el mundo el eje local +X apunta hacia abajo (-Y): fuente arriba y tubo de vuelo vertical (disposición aproximada).
import * as THREE from 'three';

export const AX = {
  TARGET: new THREE.Vector3(0, 0, 0),        // superficie de la diana MALDI (P1, potencial IS1)
  P2: 0.6,                                   // placa de extracción P2 (IS2)
  GND: 1.4,                                  // electrodo de aceleración a tierra
  EXTR: new THREE.Vector3(1.6, 0, 0),        // fin de la zona de aceleración
  LENS: 3.0,                                 // lente electrostática
  PCIS0: 5.0, PCIS1: 6.6,                    // selector de precursores / deflector
  TUBE0: 4.0, TUBE1: 92.0,                   // tubo de vuelo (región sin campo)
  REF0: new THREE.Vector3(78, 0, 0),         // entrada del reflector
  REF1: new THREE.Vector3(91, 0, 0),         // fondo del reflector
  REF_ANG: 0.028,                            // ligera inclinación del haz hacia el reflector
  DET_L: new THREE.Vector3(95, 0, 0),        // detector lineal (tras el reflector)
  DET_R: new THREE.Vector3(10, 4.4, 0),      // detector de reflexión (junto a la fuente, fuera de eje)
  TUBE_R: 3.2,
  LASER_HEAD: new THREE.Vector3(7.2, -6.2, 0),
  CAM: new THREE.Vector3(6.4, 5.4, 3.4),
};
export const ORIGEN = new THREE.Vector3(0, 101, 6);
// Parámetros físicos usados en el cálculo del tiempo de vuelo (longitudes aproximadas).
export const FIS = { U: 20000, L_LIN: 1.0, L_REF: 1.9 };
