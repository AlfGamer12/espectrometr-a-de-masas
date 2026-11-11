// Animaciones 2D «Cómo funciona» del equipo agilent-6546: id de componente → escena de js/anim2d/escenas y sus parámetros.
// Los componentes que no aparecen aquí no tienen animación propia.
const A1 = { anim: "mcp", titulo: "Detector MCP con centelleador", p: { salida: "centelleador", vMcp: "≈ −6 kV", muestreo: "10 GHz", origen: "Desde el espejo de iones" }};
const A2 = { anim: "bomba-turbo", titulo: "Turbo de flujo dividido", p: { flujoDividido: true, entradas: [{ nombre: "Etapa de alto vacío" },{ nombre: "Etapa intermedia" }], previa: "bomba primaria" }};
const A3 = { anim: "bomba-rotatoria", titulo: "Bomba primaria", p: { funcion: "Evacúa la primera etapa y respalda las bombas turbomoleculares.", dato: "en el 6546 puede ser la bomba de aceite MS40+ o una bomba seca" }};
const A4 = { anim: "cromatografia-lc", titulo: "Separación por UHPLC", p: { sistema: "1290 Infinity II" }};
const A5 = { anim: "guia-rf", titulo: "Octopolo de RF", p: { tipo: "multipolo", polos: 8, rf: "5 MHz", origen: "skimmer", destino: "el cuadrupolo" }};
const A6 = { anim: "cuadrupolo", titulo: "Cuadrupolo", p: { barras: "hiperbolicas", uso: "aislamiento", ventana: "≈ 1,3 m/z", destino: "A la celda" }};
const A7 = { anim: "celda-colision", titulo: "Celda de colisión hexapolar", p: { gas: "nitrógeno", salida: "campo-axial", origen: "Cuadrupolo", destino: "TOF" }};
const A8 = { anim: "electrospray", titulo: "Electrospray Agilent Jet Stream", p: { variante: "jetstream", tension: "2–4 kV", temp: "≈ 350 °C", entrada: "Capilar dieléctrico" }};
const A9 = { anim: "tof-ortogonal", titulo: "Pulsador ortogonal y tiempo de vuelo", p: { frecuencia: 14, variante: "slicer", origen: "Desde la celda de colisión", pulsador: "Pulsador", reflector: "Espejo de iones de dos etapas", detector: "Detector" }};
const A10 = { anim: "reflectron", titulo: "Espejo de iones: enfoque de energía", p: { etapas: 2, rejillas: true, nombre: "espejo de iones de dos etapas", detector: "Detector" }};

export const ANIMACIONES = {
  detector: A1,
  adc: A1,
  bombas_turbo: A2,
  bomba_primaria: A3,
  lc: A4,
  octopolo: A5,
  cuadrupolo: A6,
  celda_colision: A7,
  nebulizador_ajs: A8,
  camara_spray: A8,
  pulsador: A9,
  slicer: A9,
  lente_enfoque: A9,
  tubo_vuelo: A9,
  espejo_iones: A10,
};
