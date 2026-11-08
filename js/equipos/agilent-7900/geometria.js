// Geometría común del Agilent 7900 ICP-MS (cm).
// Coordenadas LOCALES del analizador: eje iónico = +X, origen en la punta del cono de muestreo.
// El grupo del analizador no está girado: local = mundo − ORIGEN.
import * as THREE from 'three';

/** Posición del origen del analizador en el mundo (eje a 48 cm de altura, tras la puerta negra; 6 cm hacia el frontal). */
export const ORIGEN = new THREE.Vector3(-6, 48, 6);

/** Mueble principal: 730 × 600 × 595 mm (sin bomba peristáltica ni chimenea). */
export const CAB = { X0: -36.5, X1: 36.5, ZB: -30, ZF: 30, H: 59.5, DECK: 36 };

export const AX = {
  // introducción de muestra (cámara de Scott orientada de delante a atrás, a la izquierda de la antorcha)
  SC_X: -25, SC_Y: -3.5, SC_Z0: -2, SC_Z1: 11, SC_R: 1.8,     // cámara de pulverización
  NEB_Z0: 11, NEB_Z1: 17.5,                                    // nebulizador MicroMist
  // antorcha y plasma
  T_0: -14, T_1: -3.2, T_R: 1.0,
  COIL_0: -5.2, COIL_1: -3.4, COIL_R: 1.45,
  // interfaz
  SAMP: 0, SAMP_F: 1.4, IF_0: 1.8, IF_1: 3.0,
  SKIM: 0.9, SKIM_F: 3.0,
  // óptica y celda
  EXT1: 4.6, EXT2: 5.4,
  OM_0: 6.2, OM_1: 10.2, Y2: 1.3,                               // lente Omega: desplaza el eje 1,3 cm
  C_0: 11, C_1: 18.5,                                           // celda ORS4
  PB: 19.2,                                                     // lente de polarización (KED)
  Q_0: 20, Q_1: 33, R0: 0.42,                                   // cuadrupolo hiperbólico
  DEF: 34.2, EM: new THREE.Vector3(36.6, 1.3 - 3.2, 0),         // detector ortogonal
  CH_0: 3.9, CH_1: 39.5,                                        // cámara de vacío principal
};

/** Punto local del analizador → mundo. */
export const W = (x, y = 0, z = 0) => new THREE.Vector3(ORIGEN.x + x, ORIGEN.y + y, ORIGEN.z + z);
