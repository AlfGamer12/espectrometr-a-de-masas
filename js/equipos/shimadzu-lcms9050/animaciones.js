// Animaciones 2D «Cómo funciona» del equipo shimadzu-lcms9050: id de componente → escena de js/anim2d/escenas y sus parámetros.
// Los componentes que no aparecen aquí no tienen animación propia.
const A1 = { anim: "mcp", titulo: "Detector de microcanales", p: { salida: "anodo", inicio: "el pulso del acelerador ortogonal", origen: "Desde el reflectrón" }};
const A2 = { anim: "bomba-turbo", titulo: "Turbo de flujo dividido", p: { flujoDividido: true, entradas: [{ nombre: "Cuadrupolo y celda" },{ nombre: "Guías de iones" }], previa: "bomba rotatoria" }};
const A3 = { anim: "bomba-rotatoria", titulo: "Bomba rotatoria de paletas", p: { funcion: "Evacúa la primera etapa y respalda las bombas turbomoleculares." }};
const A4 = { anim: "bombeo-diferencial", titulo: "Etapas de vacío", p: { etapas: [{ nombre: "Fuente", sub: "presión atmosférica", p: 101325, txt: "1 atm" },{ nombre: "Región del Qarray", p: 100, txt: "≈ 10² Pa", bomba: "Rotatoria" },{ nombre: "Cuadrupolo y celda", p: 0.001, txt: "≈ 10⁻³ Pa", bomba: "Turbo" },{ nombre: "TOF", p: 0.0003, txt: "≤ 3·10⁻⁴ Pa", bomba: "Turbo" }], bombas: "La bomba rotatoria evacúa la primera etapa y respalda a las turbomoleculares: una de tres entradas para las guías, el cuadrupolo y la celda, y otra para el TOF." }};
const A5 = { anim: "cromatografia-lc", titulo: "Separación por UHPLC", p: { sistema: "Nexera (UHPLC)" }};
const A6 = { anim: "guia-rf", titulo: "Guía de iones UF-Qarray", p: { tipo: "qarray", presion: "≈ 10² Pa", origen: "línea de desolvatación", destino: "la siguiente etapa" }};
const A7 = { anim: "guia-rf", titulo: "UF-Lens: guía multipolar", p: { tipo: "multipolo", polos: "generico", nombre: "UF-Lens", presion: "vacío intermedio", origen: "skimmer", destino: "el cuadrupolo" }};
const A8 = { anim: "cuadrupolo", titulo: "Cuadrupolo", p: { barras: "hiperbolicas", prebarras: true, uso: "aislamiento", destino: "A la celda" }};
const A9 = { anim: "celda-colision", titulo: "Celda de colisión UFsweeper III", p: { gas: "argón", salida: "barrido", nombre: "Celda UFsweeper III", destino: "TOF" }};
const A10 = { anim: "tof-ortogonal", titulo: "UFaccumulation y aceleración ortogonal", p: { variante: "acumulacion", invertir: true, origen: "UFaccumulation", pulsador: "Acelerador ortogonal", reflector: "Reflectrón iRefTOF", detector: "Detector MCP" }};
const A11 = { anim: "electrospray", titulo: "Ionización por electrospray", p: { variante: "esi", tension: "4–4,5 kV" }};
const A12 = { anim: "reflectron", titulo: "Reflectrón iRefTOF", p: { campo: "ideal", nombre: "iRefTOF", detector: "Detector MCP" }};

export const ANIMACIONES = {
  detector_mcp: A1,
  bombas_turbo: A2,
  bomba_rotatoria: A3,
  camara_vacio: A4,
  lc: A5,
  uf_qarray: A6,
  uf_lens: A7,
  q1: A8,
  celda_colision: A9,
  uf_accumulation: A10,
  acelerador: A10,
  tubo_vuelo: A10,
  sonda_esi: A11,
  bloque_calefactor: A11,
  ireftof: A12,
};
