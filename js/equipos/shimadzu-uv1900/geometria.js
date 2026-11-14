// Geometría común del Shimadzu UV-1900i (cm). Coordenadas del MUNDO: X hacia la derecha, Y hacia arriba, Z hacia el usuario.
// El sistema óptico no está desplazado: sus coordenadas locales coinciden con las del mundo.
// Recorrido de la luz (vista en planta, todo a la altura BY):
//   lámpara D₂ (→ −x) o lámpara W (→ +x) → espejo conmutador M0 (→ +z) → rendija de entrada S1 → espejo colimador M1 →
//   red de difracción G → espejo de enfoque M2 → rendija de salida S2 (→ −z) → filtro → espejo plano M3 (→ +x) →
//   divisor de haz: el haz transmitido es el de referencia (z = ZR) y el reflejado, tras el espejo M4, el de muestra (z = ZS).
// La disposición interna es aproximada: Shimadzu no publica planos del equipo.
import * as THREE from 'three';

/** Mueble: proporciones tomadas de las fotografías (aprox.). */
export const CAB = {
  X0: -22.5, X1: 22.5, ZB: -24, ZF: 23, H: 27, YB: 1.5, YW: 24.6,   // YW: arranque de la cubierta negra superior
  XL: -4.5, XR: 9.6, XP: 18.5,                                        // límites: cuerpo blanco izq. | centro (muestras) | bloque de mando | lateral blanco der.
  ZT: 13,                                                             // borde delantero de la cubierta superior sobre los cuerpos blancos
};

export const BY = 11;                       // altura de los haces
export const ZS = 1, ZR = -11;              // haz de muestra (delante) y de referencia (detrás)

export const P = {
  WI: new THREE.Vector3(-20.4, BY, -10),    // lámpara halógena de wolframio (emite hacia +x)
  D2: new THREE.Vector3(-13.9, BY, -10),    // lámpara de deuterio (ventana hacia −x)
  M0: new THREE.Vector3(-17.5, BY, -10),    // espejo conmutador
  S1: new THREE.Vector3(-17.5, BY, -7.05),  // rendija de entrada
  M1: new THREE.Vector3(-17.5, BY, 6.4),    // espejo colimador (cóncavo)
  G: new THREE.Vector3(-13.5, BY, -4.4),    // red de difracción
  M2: new THREE.Vector3(-9.5, BY, 6.4),     // espejo de enfoque (cóncavo)
  S2: new THREE.Vector3(-9.5, BY, -7.05),   // rendija de salida
  F: new THREE.Vector3(-9.5, BY, -8.6),     // filtro de corte de órdenes superiores
  M3: new THREE.Vector3(-9.5, BY, ZR),      // espejo plano
  BS: new THREE.Vector3(-5.6, BY, ZR),      // divisor de haz
  M4: new THREE.Vector3(-5.6, BY, ZS),      // espejo plano del haz de muestra
  CX: 2.6,                                  // eje de las cubetas
  DX: 10.9,                                 // fotodiodos
};

/** Compartimento de muestras (interior). */
export const CM = { X0: -3.8, X1: 9.0, Z0: -14.6, Z1: 5.2, Y0: 4.6, Y1: 24.2 };
/** Carcasa del monocromador y casa de lámparas. */
export const MONO = { X0: -20.4, X1: -7.6, Z0: -7.3, Z1: 8.2, Y0: 5.0, Y1: 16.6 };
export const LAMP = { X0: -22.0, X1: -11.6, Z0: -13.4, Z1: -7.9, Y0: 5.0, Y1: 17.6 };
