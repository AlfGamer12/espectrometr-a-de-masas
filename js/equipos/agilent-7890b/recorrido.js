// Recorrido guiado del Agilent 7890B GC-FID: cada paso fija modo, explosionado, transparencia, piezas resaltadas y encuadre.
const INY = ['tuerca_septum', 'septum', 'inyector_cabeza', 'liner', 'inyector_bloque', 'inyector_base'];
const FID = ['fid_base', 'fid_bloque', 'fid_chorro', 'fid_colector', 'fid_castillo', 'fid_ignitor'];

export const RECORRIDO = [
  {
    titulo: 'Cromatógrafo de gases con FID',
    texto: 'El inyector automático toma la muestra del vial y la deposita en el inyector caliente, donde se vaporiza. El gas portador la lleva a la columna capilar, dentro del horno, y allí se separan sus componentes. A la salida, el detector de ionización de llama genera una corriente proporcional al carbono que llega a la llama.',
    modo: 'equipo', e1: 0, xray: false, foco: ['als_torre', 'als_torreta', 'tapa_superior', 'teclado', 'puerta_horno', 'frontal_izq', 'chasis'], resaltar: [],
  },
  {
    titulo: 'Gases del laboratorio',
    texto: 'Desde los reguladores de la pared bajan cuatro líneas de cobre: helio como gas portador, hidrógeno y aire para la llama y nitrógeno como gas auxiliar. Cada una pasa por un filtro que retiene oxígeno, humedad e hidrocarburos antes de entrar por los pasamuros de la trasera. Este conjunto de gases es el que necesita un FID.',
    modo: 'equipo', e1: 0, xray: false, foco: ['panel_gases', 'filtros_gas', 'lineas_gas'], dir: [0.5, 0.25, 1], pad: 1.05,
    resaltar: ['panel_gases', 'filtros_gas', 'lineas_gas'],
  },
  {
    titulo: 'Inyector automático 7693A',
    texto: 'La torreta gira hasta poner un vial bajo la aguja. La jeringa baja, aspira y bombea varias veces para eliminar burbujas, y sube. La torreta deja libre el paso y la aguja atraviesa el septum: el émbolo descarga 1 µL en el liner en una fracción de segundo. Después la jeringa se lava con disolvente.',
    modo: 'analizador', e2: 0, xray: false, foco: ['als_torreta', 'als_jeringa', 'als_carro', 'als_guia', 'tuerca_septum'], dir: [-0.35, 0.25, 1], pad: 1.25,
    resaltar: ['als_torreta', 'als_jeringa', 'als_carro', 'als_guia'],
  },
  {
    titulo: 'Inyector split/splitless',
    texto: 'Debajo del septum, el bloque calefactado mantiene el liner a unos 250–280 °C. La gota se vaporiza en milisegundos y forma una nube de varios cientos de microlitros que el portador arrastra hacia la columna. El liner es de vidrio desactivado para que los analitos no se adsorban ni se descompongan.',
    modo: 'analizador', e2: 0.5, xray: false, foco: INY, dir: [-0.45, 0.3, 1], pad: 1.3,
    resaltar: ['liner', 'inyector_cabeza', 'septum', 'inyector_bloque'],
  },
  {
    titulo: 'Split o splitless',
    texto: 'En modo split, la válvula del venteo está abierta y la mayor parte del vapor sale por ella, a través de la trampa de carbón: con una relación 50:1, solo una parte de cada 51 entra en la columna. En splitless la válvula permanece cerrada durante el tiempo de purga, casi toda la muestra pasa a la columna y se gana sensibilidad para trazas.',
    modo: 'analizador', e2: 0, xray: true, foco: ['inyector_bloque', 'inyector_cabeza', 'trampa_split', 'epc_inyector'], dir: [-0.9, 0.3, -0.5], pad: 1.15,
    resaltar: ['inyector_cabeza', 'trampa_split', 'epc_inyector', 'lineas_neumaticas'], anim: 'liner',
  },
  {
    titulo: 'Control electrónico de la neumática',
    texto: 'Los módulos EPC miden la presión y el caudal y actúan sobre válvulas proporcionales. Conociendo las dimensiones de la columna y la viscosidad del gas, el equipo calcula la presión en cabeza para mantener el caudal elegido; durante la rampa del horno la aumenta, porque el gas caliente es más viscoso.',
    modo: 'analizador', e2: 0.35, xray: false, foco: ['epc_inyector', 'epc_detector', 'trampa_split', 'lineas_neumaticas'], dir: [0.3, 0.7, -0.75], pad: 1.1,
    resaltar: ['epc_inyector', 'epc_detector'],
  },
  {
    titulo: 'La columna capilar',
    texto: 'Treinta metros de sílice fundida enrollados en una jaula, con una película de fase estacionaria en la pared interna. Cada molécula pasa una y otra vez del gas a la película; cuanto más tiempo pasa retenida, más despacio avanza. Así, compuestos distintos llegan al detector en tiempos distintos.',
    modo: 'analizador', e2: 0, xray: false, foco: ['columna', 'jaula_columna', 'ventilador_horno', 'calefactor_horno'], dir: [-0.15, 0.2, 1], pad: 1.15,
    resaltar: ['columna', 'jaula_columna'],
  },
  {
    titulo: 'Horno y programa de temperatura',
    texto: 'El ventilador hace circular aire sobre la resistencia y alrededor de la columna. En isotermo, los compuestos ligeros salen juntos y los pesados tardan mucho y dan picos anchos. Con una rampa, por ejemplo de 10 °C/min, cada compuesto sale cuando la temperatura reduce lo suficiente su retención: picos estrechos y regularmente espaciados.',
    modo: 'equipo', e1: 0, xray: true, foco: ['horno', 'puerta_horno'], dir: [-0.4, 0.25, 1], pad: 1.1,
    resaltar: ['ventilador_horno', 'calefactor_horno', 'columna'], anim: 'horno',
  },
  {
    titulo: 'Detector de ionización de llama',
    texto: 'El efluente de la columna, mezclado con hidrógeno y gas auxiliar, sale por el chorro y arde en aire. Los fragmentos CH de cada carbono reaccionan con oxígeno y forman iones CHO⁺ y electrones. El colector, polarizado respecto al chorro, recoge los iones: la corriente es proporcional al carbono que llega a la llama.',
    modo: 'analizador', e2: 0.55, xray: false, foco: FID, dir: [-0.35, 0.3, 1], pad: 1.3,
    resaltar: ['fid_chorro', 'fid_colector', 'fid_ignitor'],
  },
  {
    titulo: 'Gases y encendido de la llama',
    texto: 'El módulo EPC del detector suministra hidrógeno (30 mL/min), aire (400 mL/min) y nitrógeno auxiliar (25 mL/min), los valores por defecto de Agilent. Para encender, el filamento del encendedor se pone incandescente; si la corriente cae por debajo de 2 pA, el equipo da la llama por apagada y la vuelve a encender.',
    modo: 'analizador', e2: 0, xray: true, foco: ['epc_detector', 'fid_base', 'fid_bloque', 'fid_castillo', 'fid_ignitor'], dir: [0.8, 0.45, 0.45], pad: 1.0,
    resaltar: ['epc_detector', 'lineas_neumaticas', 'fid_ignitor'],
  },
  {
    titulo: 'Simulación de la separación',
    texto: 'Compara un programa de temperatura con un isotermo, cambia el gas portador y su velocidad sobre la curva de van Deemter, pasa de split a splitless o alarga la columna. El cromatograma muestra los tiempos de retención y la resolución del par crítico, y las áreas crecen con el número de carbonos.',
    modo: 'analizador', e2: 0, xray: true, sim: true, foco: ['tuerca_septum', 'liner', 'inyector_bloque', 'columna', 'jaula_columna', 'fid_castillo', 'fid_base', 'electrometro'], dir: [-0.22, 0.26, 1], resaltar: [],
  },
  {
    titulo: 'Electrónica y control',
    texto: 'El electrómetro, junto al detector, convierte picoamperios en una señal digital con un rango lineal de más de siete órdenes de magnitud. La electrónica principal regula las zonas calefactadas, los módulos EPC y la secuencia del inyector automático. El teclado muestra para cada zona el valor real y la consigna.',
    modo: 'equipo', e1: 1, xray: false, sim: false, foco: ['electronica', 'teclado', 'fuente_alimentacion', 'electrometro'], dir: [0.6, 0.4, 0.8], pad: 1.1,
    resaltar: ['electronica', 'teclado', 'electrometro', 'fuente_alimentacion'],
  },
];
