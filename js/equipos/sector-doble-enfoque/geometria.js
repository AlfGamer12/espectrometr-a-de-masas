// Geometría local del analizador de doble enfoque (cm), en el plano horizontal X–Z (Y = dirección del entrehierro del imán).
// Geometría Nier–Johnson inversa (BE), como el Thermo DFS: fuente → imán de 65° (r = 350 mm) → ESA toroidal (90°, valor didáctico)
// → rendija de salida → detector. Todas las deflexiones giran en el mismo sentido.
import * as THREE from 'three';

const D2R = Math.PI / 180;
const RM = 35;            // radio del imán (350 mm, Thermo DFS)
const AM = 65 * D2R;      // ángulo de deflexión del imán (65°, Thermo DFS)
const RE = 30;            // radio del ESA (valor didáctico, sin confirmar)
const AE = 90 * D2R;      // ángulo del ESA (valor didáctico)
const L1 = 30, L2 = 32, L3 = 20;

const dirAt = (a) => new THREE.Vector3(Math.cos(a), 0, Math.sin(a));     // rumbo con ángulo a respecto a +X
const left = (h) => new THREE.Vector3(-h.z, 0, h.x);                       // normal a la izquierda

const H0 = dirAt(0);
const M_IN = H0.clone().multiplyScalar(L1);
const CM = M_IN.clone().addScaledVector(left(H0), RM);
const H1 = dirAt(AM);
const M_OUT = CM.clone().addScaledVector(left(H1), -RM);
const E_IN = M_OUT.clone().addScaledVector(H1, L2);
const CE = E_IN.clone().addScaledVector(left(H1), RE);
const H2 = dirAt(AM + AE);
const E_OUT = CE.clone().addScaledVector(left(H2), -RE);
const SLIT = E_OUT.clone().addScaledVector(H2, L3);
const ang = (p, c) => Math.atan2(p.z - c.z, p.x - c.x);

export const AX = {
  RM, AM, RE, AE, L1, L2, L3, H0, H1, H2, M_IN, CM, M_OUT, E_IN, CE, E_OUT, SLIT,
  AM0: ang(M_IN, CM), AM1: ang(M_OUT, CM),        // intervalo angular del imán respecto a su centro
  AE0: ang(E_IN, CE), AE1: ang(E_OUT, CE),        // intervalo angular del ESA respecto a su centro
  SRC: new THREE.Vector3(0, 0, 0),
  ENT_SLIT: 6.0, BETA_SLIT: M_OUT.clone().addScaledVector(H1, L2 * 0.5),
  GAP: 1.4,
  DYN: SLIT.clone().addScaledVector(H2, 4).add(new THREE.Vector3(0, 2.6, 0)),
  EM: SLIT.clone().addScaledVector(H2, 4).add(new THREE.Vector3(0, -3.0, 0)),
  dirAt, left,
};
// Origen local en el mundo: como en el DFS, la fuente queda dentro de la columna oscura de la izquierda, junto al GC,
// y el imán y el sector eléctrico dentro de la consola blanca.
// El grupo del analizador se gira 180° alrededor de X: la trayectoria avanza desde el frente (fuente) hacia el fondo (detector).
export const ORIGEN = new THREE.Vector3(-44, 108, 22);
// Valores físicos de referencia para las lecturas: 5 kV de aceleración y r = 0,35 m
export const FIS = { V: 5000, R_M: 0.35 };
