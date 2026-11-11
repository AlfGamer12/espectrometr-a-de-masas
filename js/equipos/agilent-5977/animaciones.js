// Animaciones 2D «Cómo funciona» del equipo agilent-5977: id de componente → escena de js/anim2d/escenas y sus parámetros.
// Los componentes que no aparecen aquí no tienen animación propia.
const A1 = { anim: "dinodo-multiplicador", titulo: "Dínodo de alta energía y multiplicador", p: { tipo: "continuo", origen: "Cuadrupolo", vDinodo: "≈ −10 kV", vMult: "1000–3000 V", ganancia: "10⁵–10⁶" }};
const A2 = { anim: "bomba-turbo", titulo: "Bomba turbomolecular", p: { camara: "Cámara de vacío", previa: "bomba de vacío previo" }};
const A3 = { anim: "bomba-rotatoria", titulo: "Bomba rotatoria de paletas", p: { funcion: "Hace el vacío inicial desde la presión atmosférica y evacúa de forma continua el gas que descarga la bomba turbomolecular.", final: "≈ 10⁻²–10⁻³ Torr" }};
const A4 = { anim: "cromatografia-gc", titulo: "Separación por cromatografía de gases", p: { columna: "30 m × 0,25 mm d.i. × 0,25 µm, fase 5 % fenil-metilpolisiloxano", espesor: "0,25 µm", gas: "helio", caudal: "1 mL/min", inyector: "250–280 °C", interfaz: "Interfaz GC/MSD", destino: "Fuente EI" }};
const A5 = { anim: "cuadrupolo", titulo: "Filtro de masas cuadrupolar", p: { barras: "cuarzo-oro" }};
const A6 = { anim: "ionizacion-ei", titulo: "Ionización por impacto electrónico", p: { filamento: "renio", energia: 70, destino: "cuadrupolo" }};

export const ANIMACIONES = {
  lente_detector: A1,
  hed: A1,
  multiplicador: A1,
  bomba_turbo: A2,
  rotor_turbo: A2,
  bomba_previa: A3,
  columna: A4,
  gc: A4,
  gc_puerta: A4,
  cuadrupolo: A5,
  bobina_rf: A5,
  cuerpo_fuente: A6,
  filamento: A6,
  imanes: A6,
  repulsor: A6,
  extractor: A6,
  lente_enfoque: A6,
  lente_entrada: A6,
};
