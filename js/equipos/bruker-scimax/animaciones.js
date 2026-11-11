// Animaciones 2D «Cómo funciona» del equipo bruker-scimax: id de componente → escena de js/anim2d/escenas y sus parámetros.
// Los componentes que no aparecen aquí no tienen animación propia.
const A1 = { anim: "bombeo-diferencial", titulo: "Bombeo diferencial hasta la celda ICR", p: { etapas: [{ nombre: "Fuente ESI", sub: "presión atmosférica", p: 101325, txt: "1 atm" },{ nombre: "1.er embudo", p: 300, txt: "≈ 1–10 mbar", bomba: "Vacío previo" },{ nombre: "2.º embudo", p: 1, txt: "≈ 10⁻² mbar", bomba: "Turbo" },{ nombre: "Cuadrupolo y celda", p: 0.001, txt: "≈ 10⁻⁵ mbar", bomba: "Turbo" },{ nombre: "Celda ICR", p: 2.5e-8, txt: "≈ 2,5·10⁻¹⁰ mbar", bomba: "Turbo" }], bombas: "La primera etapa se evacúa con la bomba de vacío previo, que también recoge el escape de las turbomoleculares; estas mantienen las etapas siguientes hasta el ultra alto vacío de la celda ICR." }};
const A2 = { anim: "bomba-turbo", titulo: "Bomba turbomolecular", p: { previa: "bomba de vacío previo" }};
const A3 = { anim: "guia-rf", titulo: "Embudo de iones doble", p: { tipo: "embudo", etapas: 2, presion: "≈ 1–10 mbar", origen: "capilar", destino: "el multipolo" }};
const A4 = { anim: "guia-rf", titulo: "Guía multipolar", p: { tipo: "multipolo", polos: "generico", origen: "embudo", destino: "el cuadrupolo" }};
const A5 = { anim: "cuadrupolo", titulo: "Cuadrupolo", p: { barras: "generico", uso: "aislamiento", destino: "A la celda" }};
const A6 = { anim: "celda-colision", titulo: "Celda de colisión", p: { gas: "argón", salida: "pulsos", multipolo: "Hexapolo", origen: "Cuadrupolo", destino: "la celda ICR" }};
const A7 = { anim: "electrospray", titulo: "Ionización por electrospray", p: { variante: "esi-capilar" }};
const A8 = { anim: "maldi", titulo: "Desorción/ionización MALDI", p: { destino: "optica", laser: "Láser smartbeam-II · 355 nm", laserTxt: "smartbeam-II (Nd:YAG, 355 nm)" }};
const A9 = { anim: "icr", titulo: "FT-ICR: del giro de los iones al espectro", p: { B: 7, celda: "ParaCell" }};

export const ANIMACIONES = {
  camara_vacio: A1,
  tubo_uhv: A1,
  bombas_turbo: A2,
  embudos: A3,
  multipolo: A4,
  cuadrupolo: A5,
  celda_colision: A6,
  fuente_dual: A7,
  laser_maldi: A8,
  paracell: A9,
  analizador: A9,
  preamplificador: A9,
  electronica: A9,
};
