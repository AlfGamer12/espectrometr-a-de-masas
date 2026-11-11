// Animaciones 2D «Cómo funciona» del equipo sector-doble-enfoque: id de componente → escena de js/anim2d/escenas y sus parámetros.
// Los componentes que no aparecen aquí no tienen animación propia.
const A1 = { anim: "dinodo-multiplicador", titulo: "Dínodo de conversión y multiplicador", p: { tipo: "conversion", origen: "Rendija de salida", dibujoOrigen: "rendija", lente: false, vDinodo: "hasta ±20 kV", ganancia: "10⁶", rango: "lineal en más de cinco órdenes de magnitud" }};
const A2 = { anim: "bomba-turbo", titulo: "Bomba turbomolecular", p: { previa: "bomba rotatoria" }};
const A3 = { anim: "bomba-rotatoria", titulo: "Bomba rotatoria de paletas", p: { funcion: "Son las bombas de vacío previo de las tres turbomoleculares y van alojadas dentro de la consola." }};
const A4 = { anim: "cromatografia-gc", titulo: "Separación por cromatografía de gases", p: { columna: "60 m, fase 5 % fenilo", gas: "helio", interfaz: "Línea de transferencia", destino: "Fuente EI", final: "Para dioxinas se usan columnas de 60 m de fase 5 % fenilo, que separan la 2,3,7,8-TCDD de los demás isómeros; la 2,3,7,8-TCDF se confirma en una segunda columna más polar." }};
const A5 = { anim: "ionizacion-ei", titulo: "Ionización por impacto electrónico", p: { energia: 70, destino: "sector" }};
const A6 = { anim: "sector-magnetico", titulo: "Sector magnético", p: { U: 5, r: 0.35, angulo: 65 }};
const A7 = { anim: "doble-enfoque", titulo: "Doble enfoque", p: { U: 5, R: [1000,10000] }};

export const ANIMACIONES = {
  dinodo_conversion: A1,
  multiplicador: A1,
  bombas_turbo: A2,
  bombas_rotatorias: A3,
  gc: A4,
  fuente_ei: A5,
  lentes_enfoque: A5,
  iman: A6,
  analizador: A7,
  esa: A7,
  rendija_entrada: A7,
  rendija_salida: A7,
};
