// Animaciones 2D «Cómo funciona» del equipo bruker-microflex: id de componente → escena de js/anim2d/escenas y sus parámetros.
// Los componentes que no aparecen aquí no tienen animación propia.
const A1 = { anim: "mcp", titulo: "Detector de microcanales", p: { salida: "anodo", vPlaca: "hasta ≈ 1000 V", inicio: "el disparo del láser", muestreo: "hasta 2 GS/s", origen: "Desde el tubo de vuelo" }};
const A2 = { anim: "mcp", titulo: "Detector de microcanales", p: { salida: "anodo", vPlaca: "hasta ≈ 1000 V", inicio: "el disparo del láser", muestreo: "hasta 2 GS/s", origen: "Desde el reflector" }};
const A3 = { anim: "bomba-turbo", titulo: "Bomba turbomolecular", p: { camara: "Fuente y tubo de vuelo", previa: "bomba de membrana" }};
const A4 = { anim: "bomba-rotatoria", titulo: "Bomba de membrana", p: { tipo: "membrana", funcion: "Evacúa la esclusa en cada cambio de diana y recoge el escape de la bomba turbomolecular.", dato: "en el microflex mantiene un vacío previo de unos 2 mbar" }};
const A5 = { anim: "maldi", titulo: "Desorción/ionización MALDI", p: { laser: "Láser N₂ · 337 nm", laserTxt: "de nitrógeno (337 nm, pulsos de unos 3 ns)", matriz: "HCCA o ácido sinapínico", diana: "Diana MSP 96", is1: "20 kV", retardo: true }};
const A6 = { anim: "extraccion-retardada", titulo: "Extracción retardada (PIE)", p: { U1: 20000, U2: 18000, retardo: 150, nombre: "PIE", longitud: "≈ 1 m" }};
const A7 = { anim: "tof-lineal", titulo: "Tiempo de vuelo lineal", p: { U: 20, L: 1, fuente: "maldi", detector: "Detector lineal" }};
const A8 = { anim: "reflectron", titulo: "Reflector: enfoque de energía", p: { etapas: 2, nombre: "reflector de dos etapas sin rejillas", lineal: true, detector: "Detector de reflexión" }};

export const ANIMACIONES = {
  detector_lineal: A1,
  detector_reflector: A2,
  bomba_turbo: A3,
  bomba_membrana: A4,
  laser: A5,
  diana: A5,
  electrodos_fuente: A6,
  generador_pulsos: A6,
  tubo_vuelo: A7,
  analizador: A7,
  reflector: A8,
};
