// Fichas técnicas del Bruker microflex LRF (MALDI-TOF de sobremesa, lineal y reflectrón).
// Fuentes: microflex User Manual v1.2 (Bruker Daltonik, 2008), página y folleto del microflex LRF (2017), flexControl 3.4 User Manual,
// Bruker Guide to MALDI Sample Preparation y MALDI Biotyper Troubleshooting & Maintenance Guide (2020). "aprox." indica estimaciones.

export const CATEGORIAS = [
  'Preparación e introducción de muestra', 'Láser y óptica', 'Fuente de iones', 'Analizador de tiempo de vuelo', 'Detectores',
  'Sistema de vacío', 'Electrónica y control', 'Estructura y carcasa',
];

export const INFO = {
  /* ============ MUESTRA ============ */
  diana: {
    nombre: 'Diana MALDI MSP 96', en: 'MSP 96 target', cat: 'Preparación e introducción de muestra',
    funcion: 'Placa de acero inoxidable con 96 posiciones sobre las que se depositan las muestras cocristalizadas con la matriz. Dentro del equipo actúa como primer electrodo de la fuente (P1), a potencial IS1.',
    detalles: [
      'Formato de 54 × 36 mm, con la proporción de un cuarto de placa de microtitulación para facilitar la transferencia con pipetas multicanal.',
      'Superficies: acero esmerilado (ground steel), con microestructura adecuada para la gota seca; acero pulido, para capa fina; AnchorChip, con zonas hidrófilas que concentran la muestra y aumentan la sensibilidad entre 10 y 100 veces.',
      'Preparación por gota seca: mezcla 1:1 de matriz y muestra, depósito de 0,5–1 µL y secado al aire hasta su cocristalización.',
      'Limpieza: 2-propanol, agua y baños de ultrasonidos, sin frotar la superficie para no rayarla.',
    ],
    specs: [['Formato', '96 posiciones · 54 × 36 mm'], ['Material', 'Acero inoxidable'], ['Potencial', 'IS1 ≈ 20 kV']],
    une: ['mesa_xy', 'esclusa', 'electrodos_fuente'],
  },
  mesa_xy: {
    nombre: 'Portadiana y mesa XY', en: 'Target carrier · XY stage', cat: 'Preparación e introducción de muestra',
    funcion: 'Sostiene la diana dentro de la fuente y la desplaza en dos ejes para situar bajo el láser la posición elegida en el programa de adquisición.',
    detalles: [
      'Motores paso a paso sobre guías lineales, en alto vacío.',
      'Permite el barrido automático de cada spot (AutoXecute) para promediar zonas con distinta cristalización.',
      'Para transportar el equipo la mesa debe quedar en posición "OUT".',
    ],
    specs: [['Movimiento', 'Dos ejes motorizados']],
    une: ['diana', 'camara_fuente'],
  },
  esclusa: {
    nombre: 'Esclusa de vacío y puerto de carga', en: 'Vacuum lock · load port', cat: 'Preparación e introducción de muestra',
    funcion: 'Introduce la diana desde la atmósfera hasta el alto vacío sin ventear la fuente ni el tubo de vuelo. Solo se ventea y se bombea el volumen de la esclusa.',
    detalles: [
      'Se acciona con el pulsador TARGET IN/OUT. El equipo vuelve a estar listo en menos de 5 minutos, típicamente en 2,5 minutos.',
      'La junta tórica del puerto debe mantenerse libre de polvo y restos. Se limpia con la yema del dedo, nunca con etanol.',
      'Los enclavamientos impiden abrir la tapa con el láser en funcionamiento.',
    ],
    specs: [['Tiempo de cambio', '< 5 min (típ. 2,5 min)'], ['Sellado', 'Junta tórica']],
    une: ['tapa_carga', 'diana', 'linea_vacio_previo'],
  },
  tapa_carga: {
    nombre: 'Tapa del puerto de carga', en: 'Load port lid', cat: 'Preparación e introducción de muestra',
    funcion: 'Tapa abatible de la parte superior frontal bajo la que se encuentra la plataforma de la diana.',
    detalles: ['Con las tapas cerradas el equipo es un producto láser de clase 1. Abierto, el láser interno es de clase 3B.'],
    specs: [['Seguridad', 'Enclavada con el láser']],
    une: ['esclusa'],
  },

  /* ============ LÁSER ============ */
  laser: {
    nombre: 'Láser de nitrógeno', en: 'Nitrogen laser · 337 nm', cat: 'Láser y óptica',
    funcion: 'Emite pulsos ultravioleta de pocos nanosegundos que la matriz absorbe. La energía absorbida provoca la desorción de la matriz y del analito y su ionización (MALDI).',
    detalles: [
      'Cartucho de N₂ de 337 nm con frecuencia de repetición de hasta 60 Hz en el microflex LRF; el modelo de 2008 trabajaba a 20 Hz.',
      'Un atenuador variable ajusta finamente la fluencia sobre la muestra; en el programa se expresa como potencia del láser en %.',
      'Una fluencia ligeramente superior al umbral de ionización da la mejor resolución; un exceso fragmenta y ensancha los picos.',
      'Los modelos MALDI Biotyper smart y sirius utilizan un láser de estado sólido smartbeam de 200 Hz.',
    ],
    specs: [['Longitud de onda', '337 nm'], ['Energía por pulso', '≈ 150 µJ'], ['Anchura de pulso', '≈ 3 ns'], ['Frecuencia', 'Hasta 60 Hz']],
    tune: ['Laser Power (%)', 'Laser Frequency'],
    une: ['fibra_optica', 'optica_laser'],
  },
  fibra_optica: {
    nombre: 'Fibra óptica', en: 'Optical fibre', cat: 'Láser y óptica',
    funcion: 'Conduce el haz láser desde el atenuador hasta el cabezal óptico de la fuente.',
    detalles: ['La entrega por fibra homogeneiza el perfil del haz sobre la muestra.'],
    specs: [],
    une: ['laser', 'optica_laser'],
  },
  optica_laser: {
    nombre: 'Cabezal óptico del láser', en: 'Laser focusing optics', cat: 'Láser y óptica',
    funcion: 'Sistema de espejos y lente que dirige el haz hacia la diana y lo enfoca en un punto de decenas de micrómetros sobre el spot.',
    detalles: ['El haz incide oblicuamente sobre la diana a través de la zona de extracción. El ángulo exacto y el tamaño del punto dependen de la configuración (aprox. 50–100 µm).'],
    specs: [['Diámetro del punto', '≈ 50–100 µm (aprox.)']],
    une: ['fibra_optica', 'diana', 'camara_ccd'],
  },
  camara_ccd: {
    nombre: 'Cámara de vídeo', en: 'CCD camera', cat: 'Láser y óptica',
    funcion: 'Muestra en el programa de adquisición la imagen del spot, para elegir la zona de disparo y observar la cristalización de la matriz.',
    detalles: ['Incluye iluminación propia de la diana.'],
    specs: [['Tipo', 'CCD con iluminación']],
    une: ['optica_laser', 'diana'],
  },

  /* ============ FUENTE ============ */
  camara_fuente: {
    nombre: 'Cámara de la fuente', en: 'Ion source chamber', cat: 'Fuente de iones',
    funcion: 'Recinto de acero inoxidable en alto vacío que aloja la diana, la mesa XY, los electrodos de extracción y la entrada del láser.',
    detalles: ['Comparte volumen de alto vacío con el tubo de vuelo. Los pasamuros cerámicos llevan las tensiones de hasta 20 kV.'],
    specs: [['Presión', '≈ 2 × 10⁻⁶ mbar'], ['Tensiones', 'Hasta 20 kV']],
    une: ['esclusa', 'electrodos_fuente', 'fuentes_alta_tension'],
  },
  electrodos_fuente: {
    nombre: 'Electrodos de extracción (P2 y tierra)', en: 'Extraction electrodes', cat: 'Fuente de iones',
    funcion: 'Crean el campo eléctrico que acelera los iones desde la diana. La diana (P1) está a IS1; la placa P2, a pocos milímetros, a IS2; el último electrodo, a tierra.',
    detalles: [
      'Extracción pulsada (PIE): durante el disparo P1 y P2 están al mismo potencial y no hay campo. Tras un retardo de 100–260 ns, P2 se conmuta a IS2 y se establece el campo de extracción.',
      'Durante el retardo los iones rápidos se alejan más de la diana y quedan en una zona de menor potencial. Al aplicar el pulso reciben menos energía que los lentos, que los alcanzan en el detector: es el foco temporal que mejora la resolución.',
    ],
    specs: [['IS1 (diana)', '≈ 20 kV'], ['IS2 (P2)', '≈ 18,15 kV'], ['Retardo PIE', '100–260 ns']],
    tune: ['Ion Source 1', 'Ion Source 2', 'Pulsed Ion Extraction'],
    une: ['diana', 'lente', 'generador_pulsos'],
  },
  lente: {
    nombre: 'Lente electrostática', en: 'Einzel lens', cat: 'Fuente de iones',
    funcion: 'Focaliza el haz de iones acelerado para que llegue concentrado al detector o al reflector.',
    detalles: [],
    specs: [['Potencial', '≈ 6–8,5 kV']],
    tune: ['Lens'],
    une: ['electrodos_fuente', 'pcis', 'tubo_vuelo'],
  },
  pcis: {
    nombre: 'Selector de iones (PCIS) y supresión de matriz', en: 'Precursor ion selector · deflection', cat: 'Fuente de iones',
    funcion: 'Placas deflectoras de polaridad alterna que, mediante un pulso sincronizado, desvían los iones de masa baja (principalmente de la matriz) para que no saturen el detector. También permiten seleccionar un precursor para el análisis PSD.',
    detalles: [
      'En el programa se ajusta como "Suppress up to" (Da). En identificación microbiana suele suprimirse hasta unos 1500–2000 Da (aprox.).',
      'En modo lineal existe además la supresión por gating en el propio detector.',
    ],
    specs: [['Tipo', 'Rejilla de Bradbury–Nielsen']],
    tune: ['Matrix Suppression (Deflection)'],
    une: ['lente', 'tubo_vuelo'],
  },

  /* ============ ANALIZADOR TOF ============ */
  analizador: {
    nombre: 'Conjunto analizador TOF', en: 'TOF analyzer assembly', cat: 'Analizador de tiempo de vuelo',
    funcion: 'Fuente MALDI, tubo de vuelo, reflector y detectores alineados sobre un eje vertical en un único volumen de alto vacío.',
    detalles: ['Disposición vertical de la torre de sobremesa; la orientación exacta de la fuente y el tubo es aproximada.'],
    specs: [['Modos', 'Lineal y reflectrón'], ['Polaridad', 'Positiva y negativa']],
    une: ['tubo_vuelo', 'reflector', 'detector_lineal'],
  },
  tubo_vuelo: {
    nombre: 'Tubo de vuelo', en: 'Field-free flight tube', cat: 'Analizador de tiempo de vuelo',
    funcion: 'Región sin campo eléctrico en la que los iones, todos con la misma energía cinética zeU, se separan por su velocidad: los ligeros llegan antes que los pesados.',
    detalles: [
      'Tiempo de vuelo: t = L·√(m / 2zeU). Con U = 20 kV y L ≈ 1 m, un ion de m/z 1000 tarda unos 16 µs y uno de m/z 10 000, unos 51 µs.',
      'El espectro se calibra con la relación t = a·√(m/z) + b, ajustada con patrones de masa conocida.',
      'Está a potencial de tierra y en alto vacío para que los iones no colisionen durante el vuelo.',
    ],
    specs: [['Longitud lineal', '≈ 1 m (aprox.)'], ['Presión', '≈ 2 × 10⁻⁶ mbar']],
    une: ['lente', 'reflector', 'bomba_turbo'],
  },
  reflector: {
    nombre: 'Reflector (reflectrón)', en: 'Gridless two-stage reflector', cat: 'Analizador de tiempo de vuelo',
    funcion: 'Espejo electrostático que frena los iones y los devuelve hacia el detector de reflexión. Compensa la dispersión de energía cinética y aumenta la resolución.',
    detalles: [
      'Los iones con más energía penetran más en el campo retardador y recorren un camino más largo, lo que compensa su mayor velocidad: llegan al mismo tiempo que los de igual m/z y menor energía.',
      'Diseño sin rejillas y de dos etapas, con una primera etapa de campo intenso. Trabaja unos 2 kV por encima de la tensión de aceleración.',
      'En modo lineal se desactiva y los iones lo atraviesan hasta el detector lineal.',
      'Separa además los fragmentos metaestables formados durante el vuelo (PSD), que en modo lineal llegan junto con su precursor.',
    ],
    specs: [['Resolución', 'Hasta 15 000'], ['Tensión', '≈ U + 2 kV'], ['Tipo', 'Sin rejillas, dos etapas']],
    tune: ['Reflector'],
    une: ['tubo_vuelo', 'detector_reflector', 'detector_lineal'],
  },

  /* ============ DETECTORES ============ */
  detector_lineal: {
    nombre: 'Detector lineal', en: 'Linear detector · MCP', cat: 'Detectores',
    funcion: 'Registra los iones al final del tubo en modo lineal, que es el adecuado para proteínas y masas elevadas.',
    detalles: [
      'Dos placas de microcanales (MCP) en serie, en configuración chevron. Cada canal, de 5–10 µm de diámetro, multiplica los electrones por emisión secundaria.',
      'Tiempo de subida inferior a 1 ns, necesario para separar en el tiempo iones de masa próxima.',
      'Admite supresión de iones de masa baja por gating.',
    ],
    specs: [['Tipo', 'MCP doble (chevron)'], ['Tiempo de subida', '< 1 ns'], ['Polarización', 'Hasta ≈ 1000 V por placa']],
    tune: ['Detector Gain'],
    une: ['reflector', 'placa_control'],
  },
  detector_reflector: {
    nombre: 'Detector de reflexión', en: 'Reflector detector · MCP', cat: 'Detectores',
    funcion: 'Registra los iones devueltos por el reflector en modo reflectrón, el modo de alta resolución para péptidos y moléculas pequeñas.',
    detalles: ['Situado cerca de la fuente y fuera del eje para que los iones reflejados no vuelvan a la zona de extracción.'],
    specs: [['Tipo', 'MCP doble (chevron)']],
    tune: ['Detector Gain'],
    une: ['reflector', 'placa_control'],
  },

  /* ============ VACÍO ============ */
  bomba_turbo: {
    nombre: 'Bomba turbomolecular', en: 'Turbomolecular pump', cat: 'Sistema de vacío',
    funcion: 'Mantiene el alto vacío común de la fuente y el tubo de vuelo.',
    detalles: ['Tras un arranque en frío pueden pasar hasta 12 horas antes de que el equipo indique que está listo.'],
    specs: [['Velocidad de bombeo', '70 L/s'], ['Presión', '≈ 2 × 10⁻⁶ mbar']],
    une: ['tubo_vuelo', 'linea_vacio_previo'],
  },
  bomba_membrana: {
    nombre: 'Bomba de membrana', en: 'Diaphragm backing pump', cat: 'Sistema de vacío',
    funcion: 'Bomba previa sin aceite: evacúa la esclusa en cada cambio de diana y recoge el escape de la bomba turbomolecular.',
    detalles: ['Todo el sistema de vacío está libre de aceite, lo que evita la contaminación de la fuente.'],
    specs: [['Vacío previo', '≈ 2 mbar'], ['Tipo', 'Membrana, sin aceite']],
    une: ['linea_vacio_previo'],
  },
  linea_vacio_previo: {
    nombre: 'Línea de vacío previo', en: 'Backing line', cat: 'Sistema de vacío',
    funcion: 'Conducciones que unen la esclusa y la salida de la turbomolecular, a través de una T con válvulas controladas por ordenador, con la bomba de membrana.',
    detalles: [], specs: [],
    une: ['esclusa', 'bomba_turbo', 'bomba_membrana'],
  },

  /* ============ ELECTRÓNICA ============ */
  fuentes_alta_tension: {
    nombre: 'Fuentes de alta tensión', en: 'High-voltage supplies', cat: 'Electrónica y control',
    funcion: 'Suministran IS1, IS2, la tensión de la lente y la del reflector. El programa muestra el valor medido de cada una para el diagnóstico.',
    detalles: [], specs: [['Tensión máxima', '≈ 20 kV']],
    tune: ['Ion Source 1', 'Ion Source 2', 'Lens', 'Reflector'],
    une: ['electrodos_fuente', 'reflector', 'camara_fuente'],
  },
  generador_pulsos: {
    nombre: 'Generador de pulsos', en: 'Pulse generator', cat: 'Electrónica y control',
    funcion: 'Conmuta la placa P2 con el retardo de extracción programado (PIE) y genera los pulsos de supresión de matriz.',
    detalles: ['El disparo del láser actúa como señal de inicio para el digitalizador.'],
    specs: [['Retardo', '100–260 ns (típico)']],
    tune: ['Pulsed Ion Extraction'],
    une: ['electrodos_fuente', 'pcis', 'placa_control'],
  },
  placa_control: {
    nombre: 'Electrónica de control', en: 'Control electronics', cat: 'Electrónica y control',
    funcion: 'Gestiona el vacío, la mesa XY, el láser y los enclavamientos, y comunica con el PC de adquisición.',
    detalles: [], specs: [['Comunicación', 'Serie con el PC']],
    une: ['pc', 'generador_pulsos', 'detector_lineal'],
  },
  pc: {
    nombre: 'PC de adquisición y digitalizador', en: 'Acquisition PC · digitizer', cat: 'Electrónica y control',
    funcion: 'Ejecuta el programa de adquisición y tratamiento. Su tarjeta digitalizadora registra la señal del detector frente al tiempo desde cada disparo.',
    detalles: [
      'Digitalizador de hasta 2 GS/s. Aumentar la frecuencia de muestreo mejora la resolución pero reduce el rango de masas registrable.',
      'En microbiología el espectro se compara con una biblioteca de huellas proteicas para identificar el microorganismo.',
    ],
    specs: [['Digitalizador', 'Hasta 2 GS/s'], ['Programas', 'flexControl, flexAnalysis']],
    une: ['placa_control', 'detector_lineal', 'detector_reflector'],
  },

  /* ============ ESTRUCTURA ============ */
  carcasa: {
    nombre: 'Carcasa exterior', en: 'Covers', cat: 'Estructura y carcasa',
    funcion: 'Paneles que cierran la torre, protegen de la alta tensión y la radiación láser, y canalizan la ventilación (el aire caliente sale por la parte superior).',
    detalles: [], specs: [['Dimensiones', '≈ 510 × 680 × 1090 mm (aprox.)']],
    une: ['chasis', 'panel_frontal'],
  },
  panel_frontal: {
    nombre: 'Panel frontal', en: 'Front panel', cat: 'Estructura y carcasa',
    funcion: 'Agrupa el interruptor de llave, el pulsador TARGET IN/OUT y los indicadores de estado.',
    detalles: [
      'Indicadores: Mains, Ready, Access, AutoXecute, System Error y Target Error. Con el equipo listo, Mains, Ready y Access se encienden en verde fijo.',
      'Poner la llave en OFF ventea el equipo.',
    ],
    specs: [['Indicadores', '6 LED de estado']],
    une: ['carcasa', 'esclusa'],
  },
  panel_trasero: {
    nombre: 'Panel trasero', en: 'Rear panel', cat: 'Estructura y carcasa',
    funcion: 'Interruptor general, entrada de alimentación, escape de la bomba, conexiones con el PC y placa de características.',
    detalles: ['Deben dejarse unos 20 cm libres detrás del equipo para la ventilación y el acceso al interruptor general.'],
    specs: [['Alimentación', '100–230 V, 50–60 Hz']],
    une: ['filtro_aire', 'placa_control'],
  },
  filtro_aire: {
    nombre: 'Filtro de aire', en: 'Air filter', cat: 'Estructura y carcasa',
    funcion: 'Filtra el aire de refrigeración que entra por la parte trasera.',
    detalles: ['Se revisa cada tres meses y se sustituye si está obstruido.'],
    specs: [['Revisión', 'Cada 3 meses']],
    une: ['panel_trasero'],
  },
  chasis: {
    nombre: 'Chasis', en: 'Chassis', cat: 'Estructura y carcasa',
    funcion: 'Bastidor de la torre sobre el que se montan el analizador, las bombas y la electrónica.',
    detalles: ['El equipo pesa del orden de 85–125 kg según la versión; su traslado requiere varias personas.'],
    specs: [['Peso', '≈ 85–125 kg según versión']],
    une: ['carcasa', 'analizador'],
  },
};
