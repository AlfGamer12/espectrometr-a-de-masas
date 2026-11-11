// Animaciones 2D «Cómo funciona» del equipo agilent-7900: id de componente → escena de js/anim2d/escenas y sus parámetros.
// Los componentes que no aparecen aquí no tienen animación propia.
const A1 = { anim: "dinodo-multiplicador", titulo: "Multiplicador de dínodos discretos", p: { tipo: "discreto", origen: "Cuadrupolo", rango: "11 órdenes de magnitud (0,1 cps – 10 Gcps)" }};
const A2 = { anim: "bomba-turbo", titulo: "Turbo de flujo dividido", p: { flujoDividido: true, entradas: [{ nombre: "Analizador" },{ nombre: "Cámara de lentes" }], previa: "bomba rotatoria" }};
const A3 = { anim: "bomba-rotatoria", titulo: "Bomba rotatoria de paletas", p: { funcion: "Evacúa la región de interfaz, entre los dos conos, y respalda la bomba turbomolecular.", dato: "modelo típico: MS40+ (MS40-S en equipos recientes)" }};
const A4 = { anim: "bombeo-diferencial", titulo: "Etapas de vacío", p: { guias: false, etapas: [{ nombre: "Plasma", sub: "presión atmosférica", p: 101325, txt: "1 atm" },{ nombre: "Interfaz", sub: "entre los conos", p: 100, txt: "≈ 10² Pa", bomba: "Rotatoria" },{ nombre: "Cámara de lentes", sub: "lentes", p: 0.01, txt: "≈ 10⁻² Pa", bomba: "Turbo (boca lateral)" },{ nombre: "Analizador", sub: "cuadrupolo y detector", p: 0.0001, txt: "≈ 10⁻⁴ Pa", bomba: "Turbo (boca principal)" }], bombas: "La interfaz se evacúa con la bomba rotatoria; la cámara de lentes y el analizador, con una sola turbo de flujo dividido, cuyo escape recoge también la rotatoria." }};
const A5 = { anim: "interfaz-conos", titulo: "Interfaz: conos de muestreo y de separación", p: { orificioMuestreo: "1,0 mm", orificioSkimmer: "0,45 mm", pInterfaz: "unos cientos de Pa", pLentes: "≈ 10⁻² Pa", pAnalizador: "≈ 10⁻⁴ Pa", siguiente: "la lente Omega" }};
const A6 = { anim: "lente-desvio", titulo: "Lente Omega fuera de eje", p: { tipo: "omega", destino: "Celda ORS⁴" }};
const A7 = { anim: "celda-ked", titulo: "Modo He con discriminación por energía", p: { }};
const A8 = { anim: "cuadrupolo", titulo: "Filtro de masas cuadrupolar", p: { barras: "hiperbolicas", mz: [56,75,111], alturas: [0.7,0.4,0.9], saltos: "isotopos" }};
const A9 = { anim: "nebulizador-icp", titulo: "Nebulizador y cámara de pulverización", p: { rodillos: 10, nebulizador: "MicroMist", temp: "2 °C", camara: "Cámara de Scott de doble paso" }};
const A10 = { anim: "plasma-icp", titulo: "Antorcha y plasma ICP", p: { frecuencia: "27 MHz", temperatura: "6000–10 000 K", gasPlasma: "≈ 15 L/min", shieldtorch: true }};

export const ANIMACIONES = {
  detector: A1,
  bomba_turbo: A2,
  bomba_rotatoria: A3,
  camara_vacio: A4,
  lentes_extraccion: A5,
  cono_muestreo: A5,
  cono_separador: A5,
  interfaz: A5,
  lente_omega: A6,
  celda_ors: A7,
  lente_kd: A7,
  cuadrupolo: A8,
  bomba_peristaltica: A9,
  nebulizador: A9,
  camara_nebulizacion: A9,
  peltier: A9,
  antorcha: A10,
  bobina: A10,
  plasma: A10,
  escudo_antorcha: A10,
};
