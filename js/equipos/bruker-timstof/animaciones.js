// Animaciones 2D «Cómo funciona» del equipo bruker-timstof: id de componente → escena de js/anim2d/escenas y sus parámetros.
// Los componentes que no aparecen aquí no tienen animación propia.
const A1 = { anim: "mcp", titulo: "Detector de microcanales", p: { salida: "anodo", inicio: "el pulso del acelerador ortogonal", muestreo: "5 GS/s, 10 bits", origen: "Desde el reflectrón" }};
const A2 = { anim: "cromatografia-lc", titulo: "Separación por nano-LC", p: { nano: true, sistema: "nanoElute", caudal: "50–2000 nL/min", presion: "≈ 1000 bar", destino: "el emisor CaptiveSpray" }};
const A3 = { anim: "bombeo-diferencial", titulo: "Etapas de vacío", p: { etapas: [{ nombre: "Fuente", sub: "presión atmosférica", p: 101325, txt: "1 atm" },{ nombre: "Embudos y TIMS", p: 250, txt: "≈ 2–3 mbar", bomba: "Vacío previo" },{ nombre: "Cuadrupolo y celda", p: 0.001, txt: "≈ 10⁻⁵ mbar", bomba: "Turbo" },{ nombre: "TOF", p: 0.00001, txt: "≈ 10⁻⁷ mbar", bomba: "Turbo" }] }};
const A4 = { anim: "bomba-turbo", titulo: "Bomba turbomolecular", p: { previa: "bomba de vacío previo" }};
const A5 = { anim: "lente-desvio", titulo: "Deflexión de 90°", p: { tipo: "deflector90" }};
const A6 = { anim: "guia-rf", titulo: "Embudo de iones", p: { tipo: "embudo", presion: "≈ 2–3 mbar", origen: "capilar", destino: "el túnel TIMS", nombre: "Embudo de entrada" }};
const A7 = { anim: "guia-rf", titulo: "Embudo de iones", p: { tipo: "embudo", presion: "≈ 2 mbar", origen: "túnel TIMS", destino: "la guía de transferencia", nombre: "Embudo de salida" }};
const A8 = { anim: "tims", titulo: "TIMS doble y PASEF", p: { rampa: "100 ms", presion: "≈ 2–3 mbar", pasef: true }};
const A9 = { anim: "cuadrupolo", titulo: "Cuadrupolo", p: { barras: "generico", uso: "aislamiento", ventana: "2–3 Th" }};
const A10 = { anim: "celda-colision", titulo: "Celda de colisión", p: { gas: "generico", destino: "TOF", origen: "Cuadrupolo" }};
const A11 = { anim: "electrospray", titulo: "Nanoelectrospray CaptiveSpray", p: { variante: "nano", tension: "1,5–1,7 kV", temp: "180–200 °C", caudal: "cientos de nL/min", deflexion: true }};
const A12 = { anim: "tof-ortogonal", titulo: "Acelerador ortogonal y tiempo de vuelo", p: { frecuencia: 10, origen: "Óptica de transferencia", pulsador: "Acelerador ortogonal", reflector: "Reflectrón de dos etapas", detector: "Detector de microcanales" }};
const A13 = { anim: "reflectron", titulo: "Reflectrón de dos etapas", p: { etapas: 2, nombre: "reflectrón de dos etapas", detector: "Detector de microcanales" }};

export const ANIMACIONES = {
  detector_mcp: A1,
  digitalizador: A1,
  nanolc: A2,
  camara_vacio: A3,
  bombas_turbo: A4,
  deflector: A5,
  embudo_entrada: A6,
  embudo_salida: A7,
  tims: A8,
  cuadrupolo: A9,
  celda_colision: A10,
  captivespray: A11,
  pusher: A12,
  tubo_tof: A12,
  reflectron: A13,
};
