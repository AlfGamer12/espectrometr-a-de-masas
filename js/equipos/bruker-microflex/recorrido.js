// Recorrido guiado del microflex LRF.
export const RECORRIDO = [
  {
    titulo: 'Un MALDI-TOF de sobremesa',
    texto: 'El microflex es una torre de sobremesa que contiene, en un único volumen de alto vacío, la fuente MALDI, un tubo de vuelo vertical, el reflector y dos detectores. A la izquierda, el PC de adquisición controla el equipo y registra los espectros.',
    modo: 'equipo', e1: 0, xray: false, foco: ['panel_frontal', 'tapa_superior', 'pc', 'chasis'], resaltar: [],
  },
  {
    titulo: 'Preparación de la muestra',
    texto: 'La muestra se mezcla con una matriz que absorbe en el ultravioleta (HCCA para péptidos, ácido sinapínico para proteínas) y se deposita sobre la diana de 96 posiciones. Al secarse, matriz y analito cocristalizan.',
    modo: 'analizador', e2: 0.3, xray: false, foco: ['diana', 'mesa_xy'], dir: [0.6, 0.5, 1], pad: 1.6,
    resaltar: ['diana'],
  },
  {
    titulo: 'Carga de la diana por la esclusa',
    texto: 'La diana se coloca bajo la tapa superior. Al pulsar TARGET IN, la esclusa se bombea y la diana pasa a la fuente sin romper el alto vacío del tubo de vuelo. El equipo vuelve a estar listo en unos 2,5 minutos.',
    modo: 'equipo', e1: 0.6, xray: true, foco: ['tapa_carga', 'esclusa', 'camara_fuente'],
    resaltar: ['tapa_carga', 'esclusa', 'camara_fuente'],
  },
  {
    titulo: 'Láser y desorción/ionización',
    texto: 'Un láser de nitrógeno emite pulsos de 3 ns a 337 nm que llegan por fibra óptica hasta un cabezal que los enfoca sobre el spot. La matriz absorbe la energía, se vaporiza y arrastra al analito, que se ioniza principalmente como [M+H]⁺.',
    modo: 'equipo', e1: 0.6, xray: true, foco: ['laser', 'fibra_optica', 'camara_fuente'],
    resaltar: ['laser', 'fibra_optica', 'optica_laser'],
  },
  {
    titulo: 'Extracción retardada',
    texto: 'La diana está a 20 kV. Tras un retardo de unos 150 ns, la placa P2 se conmuta a 18 kV y crea el campo que acelera los iones. El retardo compensa la dispersión de velocidades iniciales y mejora la resolución. La lente focaliza el haz.',
    modo: 'analizador', e2: 0.5, xray: false, foco: ['diana', 'electrodos_fuente', 'lente', 'pcis'], dir: [0.6, 0.5, 1], pad: 1.4,
    resaltar: ['electrodos_fuente', 'lente', 'pcis'],
  },
  {
    titulo: 'Vuelo libre',
    texto: 'Todos los iones salen con la misma energía cinética, zeU = ½mv², de modo que su velocidad depende de la masa. En el tubo sin campo se separan: un ion de m/z 1000 recorre un metro en unos 16 µs y uno de m/z 10 000, en unos 51 µs.',
    modo: 'analizador', e2: 0, xray: true, foco: ['tubo_vuelo', 'electrodos_fuente', 'detector_lineal'], dir: [1, 0.25, 0.6], pad: 1.0,
    resaltar: ['tubo_vuelo'],
  },
  {
    titulo: 'Reflector',
    texto: 'En modo reflectrón, un espejo electrostático frena los iones y los devuelve hacia el detector de reflexión. Los iones más energéticos penetran más y recorren un camino más largo, lo que iguala los tiempos de llegada y eleva la resolución hasta unos 15 000.',
    modo: 'analizador', e2: 0.4, xray: true, foco: ['reflector', 'detector_lineal', 'detector_reflector', 'tubo_vuelo'], dir: [1, 0.25, 0.6], pad: 1.0,
    resaltar: ['reflector', 'detector_reflector'],
  },
  {
    titulo: 'Detectores de microcanales',
    texto: 'Cada detector está formado por dos placas de microcanales en serie. Un ion que impacta en un canal desencadena una cascada de electrones que produce un pulso de menos de un nanosegundo. El modo lineal usa el detector del fondo; el reflectrón, el situado junto a la fuente.',
    modo: 'analizador', e2: 0.5, xray: true, foco: ['detector_lineal', 'reflector'], dir: [1, 0.3, 0.8], pad: 1.6,
    resaltar: ['detector_lineal', 'detector_reflector'],
  },
  {
    titulo: 'Simulación del tiempo de vuelo',
    texto: 'Cada disparo genera un transitorio que el digitalizador registra frente al tiempo; la suma de cientos de disparos forma el espectro. Pueden compararse los modos lineal y reflectrón, el efecto de la extracción retardada y distintas muestras.',
    modo: 'analizador', e2: 0, xray: true, sim: true, foco: ['diana', 'tubo_vuelo', 'reflector', 'detector_lineal'], resaltar: [],
  },
  {
    titulo: 'Vacío y electrónica',
    texto: 'Una bomba turbomolecular de 70 L/s mantiene unos 2 × 10⁻⁶ mbar en la fuente y el tubo. Una bomba de membrana sin aceite evacúa la esclusa y recoge el escape de la turbo. Las fuentes de alta tensión y el generador de pulsos controlan la extracción.',
    modo: 'equipo', e1: 1, xray: false, sim: false, foco: ['bomba_turbo', 'bomba_membrana', 'fuentes_alta_tension', 'generador_pulsos'],
    resaltar: ['bomba_turbo', 'bomba_membrana', 'linea_vacio_previo', 'fuentes_alta_tension', 'generador_pulsos'],
  },
];
