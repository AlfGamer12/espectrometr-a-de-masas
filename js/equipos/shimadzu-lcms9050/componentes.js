// Fichas técnicas del Shimadzu LCMS-9050 (Q-TOF).
// Fuentes: folletos C146-E462B (LCMS-9050) y C146-E365D (LCMS-9030), informe técnico C146-E470, páginas de producto de Shimadzu,
// procedimiento de vacío para Q-TOF de SSI y notas de aplicación. "aprox." = estimación.

export const CATEGORIAS = [
  'Cromatografía (contexto)', 'Fuente de iones e interfaz', 'Óptica iónica', 'Cuadrupolo y celda de colisión', 'Tiempo de vuelo (TOF)',
  'Sistema de vacío', 'Electrónica y gases', 'Estructura y carcasa',
];

export const INFO = {
  lc: {
    nombre: 'Cromatógrafo Nexera', en: 'Nexera UHPLC', cat: 'Cromatografía (contexto)',
    funcion: 'Torre UHPLC que separa la muestra antes de su ionización, situada junto al mueble del espectrómetro.',
    detalles: ['Otras opciones de introducción: microflujo (Nexera Mikros), SFC, preparación automática de muestras (CLAM), ionización directa (DPiMS) e imagen MALDI (iMScope QT).'],
    specs: [], une: ['sonda_esi'],
  },
  unidad_ionizacion: {
    nombre: 'Unidad de ionización', en: 'Ionization unit', cat: 'Fuente de iones e interfaz',
    funcion: 'Carcasa de la cámara a presión atmosférica, en la parte alta del frontal, que aloja la sonda principal, la sub-interfaz de calibrante y el bloque calefactor.',
    detalles: ['ESI de serie; APCI y DUIS (ESI y APCI simultáneas) opcionales.'],
    specs: [['Interfaces', 'ESI · APCI · DUIS']], une: ['sonda_esi', 'sub_interfaz', 'ventana_fuente'],
  },
  ventana_fuente: {
    nombre: 'Ventana de la fuente', en: 'Source window', cat: 'Fuente de iones e interfaz',
    funcion: 'Permite observar la pulverización y acceder a la entrada de la línea de desolvatación.',
    detalles: [], specs: [], une: ['unidad_ionizacion'],
  },
  sonda_esi: {
    nombre: 'Sonda ESI calefactada', en: 'Heated ESI probe', cat: 'Fuente de iones e interfaz',
    funcion: 'Forma un aerosol de gotas cargadas por electrospray, rodeado de gas de calentamiento que acelera la evaporación del disolvente.',
    detalles: ['Pulverización ortogonal a la entrada de la DL.', 'El capilar ESI se sustituye sin romper el vacío.'],
    specs: [['Tensión de interfaz', '+4 a +4,5 kV · −3 kV'], ['Gas nebulizador', '2–3 L/min'], ['Gas de calentamiento', '≈ 10 L/min (aire)'], ['Temperatura de interfaz', '200–350 °C']],
    tune: ['Interface Voltage', 'Interface Temperature', 'Nebulizing Gas Flow', 'Heating Gas Flow'],
    une: ['lc', 'bloque_calefactor', 'unidad_ionizacion'],
  },
  sub_interfaz: {
    nombre: 'Sub-interfaz de calibrante', en: 'Sub-interface · calibrant delivery', cat: 'Fuente de iones e interfaz',
    funcion: 'Segunda sonda que introduce el calibrante sin pasar por la línea de muestra, de forma continua o entre análisis, para corregir el eje de masas.',
    detalles: ['Calibrante habitual: yoduro sódico, que forma agrupaciones [(NaI)ₙNa]⁺ como m/z 622,5662 o 922,3547.'],
    specs: [['Calibrante', 'NaI']], une: ['sonda_esi'],
  },
  bloque_calefactor: {
    nombre: 'Bloque calefactor', en: 'Heat block', cat: 'Fuente de iones e interfaz',
    funcion: 'Bloque caliente en la entrada de la DL que completa la desolvatación y emite el gas de secado a contracorriente.',
    detalles: [], specs: [['Temperatura', '300–400 °C'], ['Gas de secado', '≈ 10 L/min (N₂)']],
    tune: ['Heat Block Temperature', 'Drying Gas Flow'],
    une: ['sonda_esi', 'linea_desolvatacion'],
  },
  linea_desolvatacion: {
    nombre: 'Línea de desolvatación (DL)', en: 'Desolvation line', cat: 'Fuente de iones e interfaz',
    funcion: 'Capilar calefactado que conecta la presión atmosférica con la primera etapa de vacío.',
    detalles: ['Se sustituye sin romper el vacío. Durante el arranque se tapa con un tapón específico.'],
    specs: [['Temperatura', '150–250 °C']], tune: ['DL Temperature'],
    une: ['bloque_calefactor', 'uf_qarray'],
  },
  uf_qarray: {
    nombre: 'UF-Qarray y skimmer', en: 'UF-Qarray ion guide', cat: 'Óptica iónica',
    funcion: 'Guía de iones de radiofrecuencia en la región de presión intermedia que converge el haz y reduce las pérdidas; el skimmer da paso a la siguiente etapa.',
    detalles: ['Heredada de la serie de triple cuadrupolos LCMS-80xx.'],
    specs: [['Presión', '≈ 10² Pa']], une: ['linea_desolvatacion', 'uf_lens'],
  },
  uf_lens: {
    nombre: 'UF-Lens', en: 'UF-Lens', cat: 'Óptica iónica',
    funcion: 'Óptica multipolar que enfoca y transfiere el haz hacia el cuadrupolo.',
    detalles: [], specs: [], une: ['uf_qarray', 'q1'],
  },
  q1: {
    nombre: 'Cuadrupolo Q1', en: 'Quadrupole', cat: 'Cuadrupolo y celda de colisión',
    funcion: 'En modo MS transmite todo el rango; en MS/MS selecciona el ion precursor.',
    detalles: ['Barras de perfil hiperbólico con pre-barras.'],
    specs: [['Rango', 'm/z 10–2000 (aprox.)']], une: ['uf_lens', 'celda_colision'],
  },
  celda_colision: {
    nombre: 'Celda de colisión UFsweeper III', en: 'UFsweeper III collision cell', cat: 'Cuadrupolo y celda de colisión',
    funcion: 'Fragmenta los precursores por colisión con argón. Su pseudopotencial barre los iones rápidamente hacia la salida y evita la interferencia entre espectros.',
    detalles: ['CE Spread: aplica automáticamente un intervalo de energías de colisión (por ejemplo, de 20 a 50 V) para obtener fragmentos variados en un solo espectro.'],
    specs: [['Gas', 'Argón > 99,99 %']], tune: ['CE', 'CE Spread'],
    une: ['q1', 'uf_accumulation', 'linea_gases'],
  },
  uf_accumulation: {
    nombre: 'UFaccumulation y óptica de transferencia', en: 'UFaccumulation', cat: 'Cuadrupolo y celda de colisión',
    funcion: 'Acumula los iones en la celda de colisión y los libera en paquetes sincronizados con los pulsos del acelerador, de modo que apenas se pierden iones entre pulsos.',
    detalles: [], specs: [], une: ['celda_colision', 'acelerador'],
  },
  acelerador: {
    nombre: 'Acelerador ortogonal con UFgrating', en: 'Orthogonal accelerator · UFgrating', cat: 'Tiempo de vuelo (TOF)',
    funcion: 'Pulsa los iones perpendicularmente hacia el tubo de vuelo. Su electrodo es una rejilla de alta resistencia mecánica (UFgrating) que soporta tensiones de varios kilovoltios y permite pulsos muy rápidos.',
    detalles: ['Una malla convencional se deformaría con tensiones tan altas.'],
    specs: [['Tensión', 'Varios kV']], une: ['uf_accumulation', 'tubo_vuelo'],
  },
  tubo_vuelo: {
    nombre: 'UF-FlightTube', en: 'Temperature-controlled flight tube', cat: 'Tiempo de vuelo (TOF)',
    funcion: 'Tubo de vuelo con control activo de temperatura. Una variación de pocos grados dilata las piezas metálicas decenas de micrómetros y desplaza la masa medida; el control térmico la mantiene estable durante días.',
    detalles: [
      'En el LCMS-9050 se optimizaron la disposición de calefactores y sensores y también se controla la temperatura de la electrónica de alta tensión.',
      'Tras un apagado completo, la estabilización térmica del TOF tarda 48–72 h (procedimiento de vacío del LCMS-9030); por eso se recomienda mantener el control de temperatura aunque se ventee el equipo.',
    ],
    specs: [['Estabilidad', '±2 ppm en 72 h sin recalibrar'], ['Longitud', 'No publicada']],
    une: ['acelerador', 'ireftof', 'control_termico'],
  },
  ireftof: {
    nombre: 'Reflectrón iRefTOF', en: 'Ideal reflectron (iRefTOF)', cat: 'Tiempo de vuelo (TOF)',
    funcion: 'Reflectrón de placas apiladas fabricadas con precisión que reproducen una distribución de potencial calculada como ideal: compensa la dispersión de energía sin perder resolución ni transmisión.',
    detalles: ['A diferencia de un reflectrón de campo lineal, también evita la divergencia de las trayectorias durante la reflexión.'],
    specs: [['Diseño', 'Placas apiladas de campo calculado']], une: ['tubo_vuelo', 'detector_mcp'],
  },
  detector_mcp: {
    nombre: 'Detector MCP', en: 'Microchannel plate detector', cat: 'Tiempo de vuelo (TOF)',
    funcion: 'Placas de microcanales que convierten la llegada de los iones en pulsos eléctricos.',
    detalles: ['En el LCMS-9030 Shimadzu describe un MCP de entrada en embudo (Funnel MCP) que reduce las pérdidas de iones.'], specs: [], une: ['ireftof', 'electronica'],
  },
  analizador: {
    nombre: 'Conjunto analizador Q-TOF', en: 'Q-TOF analyzer', cat: 'Tiempo de vuelo (TOF)',
    funcion: 'Cuadrupolo, celda de colisión y TOF ortogonal con reflectrón: espectros completos de masa exacta y fragmentación selectiva.',
    detalles: ['Cambio de polaridad en 600 ms con errores inferiores a 1 ppm en positivo y a 3 ppm en negativo, gracias a la corrección UFstabilization de la deriva de la alta tensión.'],
    specs: [['Resolución', '45 000 FWHM'], ['Exactitud', '< 1 ppm (m/z 622,5662)'], ['Rango TOF', 'm/z 10–40 000'], ['Velocidad', '100 Hz']],
    une: ['q1', 'tubo_vuelo'],
  },
  camara_vacio: {
    nombre: 'Cámara de vacío', en: 'Vacuum manifold', cat: 'Sistema de vacío',
    funcion: 'Etapas de presión decreciente: región del Qarray (≈ 10² Pa), cuadrupolo y celda (≈ 10⁻³ Pa) y TOF (≈ 10⁻⁴ Pa).',
    detalles: ['Lecturas de referencia (procedimiento del LCMS-9030): Pirani 100–300 Pa, medidor de ionización ≤ 6 × 10⁻³ Pa y medidor BA del TOF ≤ 3 × 10⁻⁴ Pa.'],
    specs: [['TOF', '≤ 3 × 10⁻⁴ Pa']], une: ['bombas_turbo', 'bomba_rotatoria'],
  },
  bombas_turbo: {
    nombre: 'Bombas turbomoleculares', en: 'Turbomolecular pumps', cat: 'Sistema de vacío',
    funcion: 'Una bomba de tres entradas para guías, cuadrupolo y celda, y una bomba simple para la región del TOF.',
    detalles: ['Asignación de entradas aproximada.'], specs: [['Número', '2']],
    une: ['camara_vacio', 'bomba_rotatoria'],
  },
  bomba_rotatoria: {
    nombre: 'Bomba rotatoria', en: 'Rotary pump', cat: 'Sistema de vacío',
    funcion: 'Evacúa la primera etapa y respalda las turbomoleculares.',
    detalles: ['Tras el arranque, el sistema puede necesitar 6 h o más hasta que todos los indicadores están en verde (procedimiento del LCMS-9030).'],
    specs: [['Caudal', '≈ 65 m³/h (aprox.)']], une: ['bombas_turbo'],
  },
  control_termico: {
    nombre: 'Control de temperatura del TOF', en: 'TOF temperature control', cat: 'Electrónica y gases',
    funcion: 'Regula los calefactores del tubo de vuelo y de la electrónica de alta tensión a partir de varios sensores.',
    detalles: [], specs: [], une: ['tubo_vuelo'],
  },
  electronica: {
    nombre: 'Electrónica y alta tensión', en: 'Electronics', cat: 'Electrónica y gases',
    funcion: 'Fuentes de radiofrecuencia y alta tensión, digitalización de la señal y comunicación con LabSolutions.',
    detalles: [], specs: [['Alimentación', '230 V, 15 A (aprox.)']], une: ['detector_mcp', 'acelerador'],
  },
  linea_gases: {
    nombre: 'Gases', en: 'Gas supply', cat: 'Electrónica y gases',
    funcion: 'Nitrógeno para nebulización y secado, aire seco para el gas de calentamiento y argón para la celda de colisión.',
    detalles: [], specs: [['N₂', 'Hasta ≈ 23 L/min (aprox.)'], ['Aire', 'Hasta ≈ 23 L/min (aprox.)'], ['Ar', '> 99,99 %']],
    une: ['sonda_esi', 'celda_colision'],
  },
  carcasa: {
    nombre: 'Carcasa', en: 'Covers', cat: 'Estructura y carcasa',
    funcion: 'Mueble de pie esbelto que ocupa poco espacio de laboratorio.',
    detalles: [], specs: [['Dimensiones', '≈ 670 × 1250 × 1450 mm (aprox., sin confirmar)']],
    une: ['panel_frontal', 'chasis'],
  },
  panel_frontal: {
    nombre: 'Panel frontal', en: 'Front panel', cat: 'Estructura y carcasa',
    funcion: 'Panel con los indicadores de estado y la identificación del modelo.',
    detalles: [], specs: [], une: ['carcasa', 'unidad_ionizacion'],
  },
  chasis: {
    nombre: 'Bastidor', en: 'Frame', cat: 'Estructura y carcasa',
    funcion: 'Estructura sobre la que se montan la cámara de vacío, el tubo de vuelo, las bombas y la electrónica.',
    detalles: [], specs: [], une: ['carcasa'],
  },
};
