// Fichas técnicas del Bruker scimaX MRMS (FT-ICR con imán de 7 T refrigerado por conducción).
// Fuentes: página de producto y nota de lanzamiento de Bruker (2018), folleto "scimaX Ion Path", patente US9659761 (ParaCell),
// Tiquet et al. 2022 (Anal. Chem.), Marshall, Hendrickson y Jackson 1998 (Mass Spectrom. Rev.). "aprox." = estimación.

export const CATEGORIAS = [
  'Fuente de iones', 'Óptica iónica', 'Cuadrupolo y celda de colisión', 'Celda ICR y detección', 'Imán superconductor',
  'Sistema de vacío', 'Electrónica', 'Estructura y carcasa',
];

export const INFO = {
  /* ============ FUENTE ============ */
  fuente_dual: {
    nombre: 'Fuente dual ESI/MALDI', en: 'Dual ESI/MALDI ion source', cat: 'Fuente de iones',
    funcion: 'Genera iones por electrospray a presión atmosférica o por desorción láser (MALDI) desde una diana en vacío intermedio. Se cambia de una a otra desde el programa, sin modificar el hardware.',
    detalles: [
      'Admite fuentes opcionales APPI, APCI y GC-APCI.',
      'El modo MALDI permite la imagen molecular de cortes de tejido con resoluciones superiores a 800 000 a m/z 400 (detección 2xR).',
    ],
    specs: [['Modos', 'ESI, MALDI, ESI/MALDI simultáneo'], ['Láser MALDI', 'smartbeam-II']],
    une: ['capilar', 'laser_maldi', 'carcasa_fuente'],
  },
  laser_maldi: {
    nombre: 'Láser MALDI', en: 'smartbeam-II laser', cat: 'Fuente de iones',
    funcion: 'Láser de estado sólido que desorbe e ioniza la muestra depositada sobre la diana MALDI, con varios diámetros de foco.',
    detalles: [], specs: [['Tipo', 'smartbeam-II']],
    une: ['fuente_dual'],
  },
  carcasa_fuente: {
    nombre: 'Carcasa de la fuente', en: 'Source housing', cat: 'Fuente de iones',
    funcion: 'Cierra la cámara de pulverización, con ventana de observación y acceso al emisor.',
    detalles: [], specs: [],
    une: ['fuente_dual'],
  },
  capilar: {
    nombre: 'Capilar de transferencia', en: 'Glass transfer capillary', cat: 'Fuente de iones',
    funcion: 'Transfiere los iones desde la presión atmosférica a la primera etapa de vacío, de unos pocos milibares.',
    detalles: [], specs: [['Material', 'Vidrio con extremos metalizados']],
    une: ['fuente_dual', 'embudos'],
  },

  /* ============ ÓPTICA ============ */
  embudos: {
    nombre: 'Embudo de iones de dos etapas', en: 'Dual stage ion funnel', cat: 'Óptica iónica',
    funcion: 'Dos embudos de radiofrecuencia en serie, separados por un skimmer, que enfocan el chorro de iones mientras la presión desciende.',
    detalles: [], specs: [['Presión', '≈ 1–10 mbar → 10⁻² mbar (aprox.)']],
    une: ['capilar', 'multipolo'],
  },
  multipolo: {
    nombre: 'Multipolo de transporte', en: 'Transfer multipole', cat: 'Óptica iónica',
    funcion: 'Guía de iones de radiofrecuencia que conduce el haz hasta el cuadrupolo.',
    detalles: [], specs: [],
    une: ['embudos', 'cuadrupolo'],
  },
  optica_transferencia: {
    nombre: 'Óptica de transferencia', en: 'Ion transfer optics', cat: 'Óptica iónica',
    funcion: 'Conjunto de lentes que conduce los paquetes de iones desde la celda de colisión, a lo largo del bore del imán, hasta la celda ICR.',
    detalles: [
      'Los iones se pulsan desde la celda de colisión. El tiempo de vuelo hasta la celda (≈ 0,7–1,2 ms) actúa como filtro de m/z: los ligeros llegan antes.',
      'Recorre una distancia del orden de un metro dentro del gradiente del campo magnético.',
    ],
    specs: [['Time of flight', '≈ 0,7–1,2 ms'], ['Longitud', '≈ 1 m o más (aprox.)']],
    tune: ['Time of flight'],
    une: ['celda_colision', 'paracell', 'tubo_uhv'],
  },

  /* ============ CUADRUPOLO Y CELDA ============ */
  cuadrupolo: {
    nombre: 'Cuadrupolo analítico (CASI)', en: 'Analytical quadrupole · CASI', cat: 'Cuadrupolo y celda de colisión',
    funcion: 'Aísla un ion precursor para MS/MS o enriquece una ventana de m/z (acumulación continua de iones seleccionados).',
    detalles: [], specs: [['Aislamiento', 'Hasta m/z ≈ 6000 (aprox.)']],
    une: ['multipolo', 'celda_colision'],
  },
  celda_colision: {
    nombre: 'Celda de colisión', en: 'Hexapole collision cell', cat: 'Cuadrupolo y celda de colisión',
    funcion: 'Acumula los iones durante milisegundos o segundos, los enfría con argón y puede fragmentarlos (CID) o hacerlos reaccionar con aniones (ETD) antes de enviarlos a la celda ICR.',
    detalles: ['El número de iones acumulados se controla para limitar los efectos de carga espacial, que desplazan las frecuencias medidas.'],
    specs: [['Fragmentación', 'CID, (n)ETD'], ['Gas', 'Argón']],
    tune: ['Ion Accumulation Time', 'Collision Voltage'],
    une: ['cuadrupolo', 'optica_transferencia'],
  },

  /* ============ CELDA ICR ============ */
  analizador: {
    nombre: 'Analizador FT-ICR', en: 'FT-ICR analyzer', cat: 'Celda ICR y detección',
    funcion: 'Mide la m/z a través de la frecuencia con la que cada ion gira en el campo magnético. La frecuencia puede medirse con enorme precisión, de ahí la resolución y la exactitud de masa de la técnica.',
    detalles: [
      'Frecuencia ciclotrónica: f = zeB/(2πm), es decir, f [Hz] ≈ 1,535611·10⁷·B[T]/(m/z). A 7 T, un ion de m/z 500 gira a unos 215 kHz.',
      'Poder de resolución en modo magnitud: R ≈ 1,274·10⁷·z·B·T/m, con T la duración del transitorio. Crece con el campo y con el tiempo de medida, y disminuye con la masa.',
    ],
    specs: [['Resolución', '> 20 000 000'], ['Exactitud de masa', '600 ppb (calibración interna)'], ['Campo', '7 T']],
    une: ['paracell', 'iman'],
  },
  paracell: {
    nombre: 'Celda ICR ParaCell', en: 'ParaCell · dynamically harmonized ICR cell', cat: 'Celda ICR y detección',
    funcion: 'Trampa de iones en el centro del imán. Los iones quedan confinados radialmente por el campo magnético y axialmente por los electrodos de atrapamiento. Un pulso de radiofrecuencia los excita a órbitas coherentes y los electrodos de detección registran la corriente imagen que inducen.',
    detalles: [
      'Cilindro dividido en segmentos con bordes de forma parabólica (α = 2πn/N ± b(1 − (z/a)²)). Promediado sobre la órbita, el potencial que siente el ion es un cuadrupolo hiperbólico casi ideal en todo el volumen, lo que mantiene la coherencia durante transitorios de decenas de segundos.',
      'Excitación por barrido de frecuencia (chirp) o SWIFT para aislar iones.',
      'Detección 2ω (2xR): las placas de excitación también detectan y la señal aparece al doble de la frecuencia, lo que duplica la resolución para el mismo tiempo.',
      'La detección no es destructiva: el mismo paquete de iones se mide durante todo el transitorio.',
      'Admite fragmentación dentro de la celda: ECD, EDD y SORI-CID.',
    ],
    specs: [['Detección', '2ω (2xR)'], ['Dimensiones', '≈ 56 × 150 mm (aprox., según patente)'], ['Presión', '≈ 2,5 × 10⁻¹⁰ mbar']],
    tune: ['Front/Back Trap Plate', 'Sweep Excitation Power', 'Side Kick', 'Data Size'],
    une: ['optica_transferencia', 'preamplificador', 'iman'],
  },
  preamplificador: {
    nombre: 'Preamplificador y digitalizador', en: 'Preamplifier · digitizer', cat: 'Celda ICR y detección',
    funcion: 'Amplifica la débil corriente imagen junto a la brida de la celda y la digitaliza. El transitorio se transforma por Fourier para obtener el espectro.',
    detalles: [
      'El número de puntos (data size, de 1M a 16M) fija la duración del transitorio: por ejemplo, 16M equivalen a unos 12 s con detección 2ω.',
      'El procesado en modo absorción, con corrección de fase, mejora la resolución hasta el doble frente al modo magnitud y permite resolver la estructura isotópica fina de forma rutinaria.',
    ],
    specs: [['Data size', '1M–16M puntos'], ['Procesado', 'Magnitud o absorción']],
    tune: ['Data Size', 'Detection (1ω/2ω)'],
    une: ['paracell', 'electronica'],
  },
  tubo_uhv: {
    nombre: 'Tubo de ultra alto vacío', en: 'UHV bore tube', cat: 'Sistema de vacío',
    funcion: 'Tubo de vacío que atraviesa el bore del imán y aloja la óptica de transferencia y la celda ICR.',
    detalles: [], specs: [['Presión en la celda', '≈ 2,5 × 10⁻¹⁰ mbar']],
    une: ['paracell', 'optica_transferencia', 'bombas_turbo'],
  },

  /* ============ IMÁN ============ */
  iman: {
    nombre: 'Imán superconductor de 7 T', en: '7 T conduction-cooled magnet', cat: 'Imán superconductor',
    funcion: 'Genera el campo magnético intenso y homogéneo en el que giran los iones. En el scimaX se refrigera por conducción: no necesita llenados de helio ni de nitrógeno líquido, ni línea de quench.',
    detalles: [
      'Los equipos FT-ICR clásicos (solariX de 7; 9,4; 12 o 15 T) utilizan imanes en baño de helio líquido.',
      'El bore, el campo de dispersión y el peso del imán del scimaX no están publicados.',
    ],
    specs: [['Campo', '7 T'], ['Refrigeración', 'Por conducción (sin criógenos líquidos)'], ['Línea de quench', 'No necesaria']],
    une: ['criorrefrigerador', 'paracell'],
  },
  criorrefrigerador: {
    nombre: 'Criorrefrigerador', en: 'Cryocooler cold head', cat: 'Imán superconductor',
    funcion: 'Cabeza fría de dos etapas que mantiene la bobina superconductora a temperatura criogénica por conducción, en un circuito cerrado de helio gas.',
    detalles: ['El modelo exacto de criorrefrigerador del scimaX no está publicado.'],
    specs: [['Circuito', 'Helio gas en circuito cerrado']],
    une: ['iman', 'compresor_helio'],
  },
  compresor_helio: {
    nombre: 'Compresor de helio', en: 'Helium compressor', cat: 'Imán superconductor',
    funcion: 'Comprime el helio gas que alimenta el criorrefrigerador a través de dos líneas flexibles.',
    detalles: [], specs: [['Refrigeración', 'Agua o aire (aprox.)']],
    une: ['criorrefrigerador'],
  },

  /* ============ VACÍO ============ */
  camara_vacio: {
    nombre: 'Cámara de vacío del banco óptico', en: 'Front-end vacuum housing', cat: 'Sistema de vacío',
    funcion: 'Aloja embudos, multipolo, cuadrupolo y celda de colisión en etapas de presión decreciente.',
    detalles: [], specs: [['Presiones', 'mbar → 10⁻⁵ mbar (aprox.)']],
    une: ['bombas_turbo', 'tubo_uhv'],
  },
  bombas_turbo: {
    nombre: 'Bombas turbomoleculares', en: 'Turbomolecular pumps', cat: 'Sistema de vacío',
    funcion: 'Bombeo diferencial desde la fuente hasta la celda ICR, que requiere ultra alto vacío para que los iones giren sin colisionar durante segundos.',
    detalles: ['Un FT-ICR suele emplear tres o cuatro bombas turbomoleculares; el número exacto en el scimaX no está publicado.'],
    specs: [['Número', '3–4 (aprox.)']],
    une: ['camara_vacio', 'tubo_uhv', 'bomba_previa'],
  },
  bomba_previa: {
    nombre: 'Bomba de vacío previo', en: 'Backing pump', cat: 'Sistema de vacío',
    funcion: 'Evacúa la primera etapa de la fuente y recoge el escape de las bombas turbomoleculares.',
    detalles: [], specs: [['Tipo', 'Rotatoria o scroll']],
    une: ['bombas_turbo'],
  },

  /* ============ ELECTRÓNICA ============ */
  electronica: {
    nombre: 'Electrónica de excitación y detección', en: 'Excitation & detection electronics', cat: 'Electrónica',
    funcion: 'Genera los barridos de excitación, las tensiones de atrapamiento y las radiofrecuencias de la óptica, y adquiere el transitorio.',
    detalles: [], specs: [['Programa', 'ftmsControl']],
    une: ['preamplificador', 'paracell'],
  },
  pc: {
    nombre: 'PC de adquisición', en: 'Acquisition PC', cat: 'Electrónica',
    funcion: 'Controla el equipo y procesa los datos: transformada de Fourier, calibración y asignación de fórmulas moleculares.',
    detalles: ['Flujos de trabajo de inyección directa con hasta unas 200 muestras al día.'],
    specs: [['Programas', 'ftmsControl, DataAnalysis, MetaboScape']],
    une: ['electronica'],
  },

  /* ============ ESTRUCTURA ============ */
  carcasa: {
    nombre: 'Carcasa de la consola', en: 'Console covers', cat: 'Estructura y carcasa',
    funcion: 'Mueble único en gris claro, con capó de aristas muy redondeadas, que cubre la consola (fuente, banco de óptica iónica, bombas y electrónica) y el imán. El lomo azul con línea de luz recorre la tapa hasta la caja del criorrefrigerador.',
    detalles: ['Bruker indica una huella reducida que cabe en un laboratorio estándar; las dimensiones no están publicadas.'],
    specs: [['Dimensiones', 'No publicadas (modelo: ≈ 3,2 × 1,1 × 1,5 m; 2 m con la caja del criorrefrigerador)']],
    une: ['chasis', 'panel_frontal'],
  },
  panel_frontal: {
    nombre: 'Panel frontal', en: 'Front panel', cat: 'Estructura y carcasa',
    funcion: 'Cabeza frontal azul con línea de luz; a su izquierda, el hueco abierto de la fuente ESI sobre una bandeja de acero, y a su derecha, el hombro con la puerta de carga de la diana MALDI.',
    detalles: [], specs: [],
    une: ['carcasa'],
  },
  chasis: {
    nombre: 'Bastidor y soporte del imán', en: 'Frame · magnet stand', cat: 'Estructura y carcasa',
    funcion: 'Estructura de la consola y soportes que alinean el imán con el eje de la óptica iónica.',
    detalles: [], specs: [],
    une: ['carcasa', 'iman'],
  },
};
