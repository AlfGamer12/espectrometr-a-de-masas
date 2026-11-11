// Animaciones 2D «Cómo funciona» del equipo shimadzu-lcms8060: id de componente → escena de js/anim2d/escenas y sus parámetros.
// Los componentes que no aparecen aquí no tienen animación propia.
const A1 = { anim: "dinodo-multiplicador", titulo: "Dínodo de conversión y multiplicador", p: { tipo: "conversion", origen: "Q3", vDinodo: "≈ ±10 kV", modo: "pulsos", rango: "hasta 2 × 10⁷ cps" }};
const A2 = { anim: "bomba-turbo", titulo: "Turbo de tres entradas", p: { flujoDividido: true, entradas: [{ nombre: "Alto vacío" },{ nombre: "Alto vacío (2.ª zona)" },{ nombre: "2.ª cámara" }], previa: "bomba rotatoria" }};
const A3 = { anim: "bomba-rotatoria", titulo: "Bomba rotatoria de paletas", p: { funcion: "Evacúa la 1.ª cámara intermedia (≈ 10² Pa) y actúa como bomba previa de la turbomolecular.", dato: "velocidad de bombeo: 65 m³/h" }};
const A4 = { anim: "bombeo-diferencial", titulo: "Bombeo diferencial", p: { etapas: [{ nombre: "Fuente", sub: "presión atmosférica", p: 101325, txt: "1 atm" },{ nombre: "1.ª cámara", sub: "UF-Qarray", p: 100, txt: "≈ 10² Pa", bomba: "Rotatoria" },{ nombre: "2.ª cámara", sub: "UF-Lens", p: 0.03, txt: "≈ 10⁻¹–10⁻² Pa", bomba: "Turbo" },{ nombre: "Alto vacío", sub: "Q1, q2, Q3 y detector", p: 0.0003, txt: "≈ 10⁻³–10⁻⁴ Pa", bomba: "Turbo" }], bombas: "La bomba rotatoria evacúa la 1.ª cámara y recoge el escape de la turbo; una única turbomolecular de tres entradas bombea la 2.ª cámara y el alto vacío." }};
const A5 = { anim: "cromatografia-lc", titulo: "Separación por UHPLC", p: { sistema: "Nexera (UHPLC)" }};
const A6 = { anim: "guia-rf", titulo: "Guía de iones UF-Qarray", p: { tipo: "qarray", presion: "≈ 10² Pa", origen: "línea de desolvatación", destino: "el skimmer" }};
const A7 = { anim: "guia-rf", titulo: "UF-Lens: guía multipolar", p: { tipo: "multipolo", polos: "generico", nombre: "UF-Lens", presion: "≈ 10⁻¹–10⁻² Pa", origen: "skimmer", destino: "Q1" }};
const A8 = { anim: "cuadrupolo", titulo: "Filtro de masas cuadrupolar", p: { barras: "molibdeno", prebarras: true, destino: "A la celda q2" }};
const A9 = { anim: "cuadrupolo", titulo: "Filtro de masas cuadrupolar", p: { barras: "molibdeno", prebarras: true, destino: "Al detector" }};
const A10 = { anim: "celda-colision", titulo: "Celda de colisión UFsweeper III", p: { gas: "argón", salida: "barrido", nombre: "Celda UFsweeper III", origen: "Q1", destino: "Q3" }};
const A11 = { anim: "triple-cuadrupolo", titulo: "MRM en el triple cuadrupolo", p: { equipo: "LCMS-8060NX", dwell: 0.8, pausa: 1 }};
const A12 = { anim: "electrospray", titulo: "Ionización por electrospray", p: { variante: "esi", tension: "1–4 kV" }};

export const ANIMACIONES = {
  lente_salida: A1,
  dinodo_conversion: A1,
  multiplicador: A1,
  bomba_turbo: A2,
  bomba_rotatoria: A3,
  tabiques: A4,
  camara_vacio: A4,
  lc: A5,
  lc_bomba: A5,
  lc_horno: A5,
  uf_qarray: A6,
  uf_lens: A7,
  q1: A8,
  generadores_rf: A8,
  q3: A9,
  celda_colision: A10,
  analizador: A11,
  sonda_esi: A12,
  bloque_calefactor: A12,
};
