// Fichas técnicas del espectrómetro de sector magnético de doble enfoque (modelo didáctico basado en el Thermo Scientific DFS).
// Fuentes: página de producto y folleto del Thermo DFS, tutorial de JEOL sobre sectores magnéticos, EPA 1613B y 8290A,
// IUPAC Gold Book y bibliografía de espectrometría de masas. "aprox." indica estimaciones.

export const CATEGORIAS = [
  'Introducción de muestra', 'Fuente de iones', 'Óptica de entrada', 'Analizador magnético', 'Analizador electrostático',
  'Detector', 'Sistema de vacío', 'Electrónica y servicios', 'Estructura y carcasa',
];

export const INFO = {
  /* ============ MUESTRA ============ */
  gc: {
    nombre: 'Cromatógrafo de gases', en: 'Gas chromatograph', cat: 'Introducción de muestra',
    funcion: 'Separa los componentes de la muestra en una columna capilar antes de su entrada en la fuente. En el análisis de dioxinas se emplean columnas de 60 m (fase 5 % fenilo) que separan la 2,3,7,8-TCDD de los demás isómeros; la 2,3,7,8-TCDF se confirma en una segunda columna más polar.',
    detalles: ['Va adosado a un lateral de la consola; existe una configuración con dos cromatógrafos, uno a cada lado.', 'Representación simplificada.'],
    specs: [['Columna típica', '60 m, fase 5 % fenilo'], ['Gas portador', 'Helio']],
    une: ['linea_transferencia'],
  },
  linea_transferencia: {
    nombre: 'Línea de transferencia', en: 'GC transfer line', cat: 'Introducción de muestra',
    funcion: 'Conduce el extremo de la columna desde el horno del cromatógrafo hasta el volumen de ionización, calefactada para evitar la condensación de los analitos.',
    detalles: [], specs: [['Temperatura', '≈ 280–300 °C (aprox.)']],
    une: ['gc', 'fuente_ei'],
  },
  entrada_referencia: {
    nombre: 'Entrada de referencia (PFK)', en: 'Reference inlet · PFK', cat: 'Introducción de muestra',
    funcion: 'Introduce de forma continua y regulada perfluoroqueroseno (PFK), cuyos iones de masa exacta conocida sirven para calibrar la escala de masas y corregir su deriva durante el análisis.',
    detalles: [
      'En la detección de iones seleccionados (MID), uno de los iones del PFK actúa como masa de bloqueo (lock mass) y otro como masa de control de la sensibilidad.',
      'El método EPA 1613B exige que la señal de la masa de bloqueo no varíe más del ±20 % durante el análisis.',
    ],
    specs: [['Compuesto', 'Perfluoroqueroseno (PFK)'], ['Ejemplos de iones', 'm/z 292,9825 · 330,9792']],
    une: ['fuente_ei'],
  },

  /* ============ FUENTE ============ */
  fuente_ei: {
    nombre: 'Fuente de iones EI/CI', en: 'EI/CI ion source', cat: 'Fuente de iones',
    funcion: 'Ioniza las moléculas eluidas del cromatógrafo por impacto electrónico y forma un haz de iones que se acelera hasta la energía de trabajo del analizador.',
    detalles: [
      'Filamento, volumen de ionización calefactado, repulsor e imanes colimadores del haz de electrones, como en una fuente EI convencional.',
      'Toda la fuente flota a la tensión de aceleración (5 kV en el Thermo DFS; hasta 10 kV en otros equipos), de modo que cada ion sale con una energía cinética zeV ≈ 5 keV.',
      'El volumen de ionización y el filamento se sustituyen sin romper el vacío mediante un sistema de esclusa (interlock).',
      'Admite ionización química (metano, isobutano o amoníaco) y técnicas de campo (FD/FI).',
    ],
    specs: [['Energía electrónica', '70 eV (ajustable; 28–40 eV en EPA 1613)'], ['Tensión de aceleración', '5 kV'], ['Modos', 'EI, CI, FD/FI']],
    tune: ['Electron Energy', 'Emission', 'Source Temperature', 'Acceleration Voltage'],
    une: ['linea_transferencia', 'entrada_referencia', 'lentes_enfoque'],
  },

  /* ============ ÓPTICA DE ENTRADA ============ */
  lentes_enfoque: {
    nombre: 'Lentes de extracción y enfoque', en: 'Extraction & focusing lenses', cat: 'Óptica de entrada',
    funcion: 'Extraen los iones de la fuente, los aceleran y dan forma al haz: deflectores Y y Z para centrarlo y lentes cuadrupolares para adaptar su sección a la entrada del imán.',
    detalles: ['Una rendija alfa limita la apertura angular del haz, lo que reduce las aberraciones a cambio de transmisión.'],
    specs: [['Elementos', 'Lente de extracción, Y-focus, Z-focus, lentes cuadrupolares']],
    tune: ['Y-Focus', 'Z-Focus', 'Y-Deflection'],
    une: ['fuente_ei', 'rendija_entrada'],
  },
  rendija_entrada: {
    nombre: 'Rendija de entrada', en: 'Entrance slit', cat: 'Óptica de entrada',
    funcion: 'Define el objeto de la óptica iónica. Su anchura, junto con la de la rendija de salida, fija el poder de resolución del instrumento.',
    detalles: [
      'Fabricada en tántalo, con anchura variable motorizada y controlada desde el sistema de datos.',
      'Estrechar las rendijas aumenta la resolución pero reduce la transmisión de iones y, por tanto, la sensibilidad.',
    ],
    specs: [['Material', 'Tántalo'], ['Anchura', 'Variable, controlada por software']],
    tune: ['Entrance Slit'],
    une: ['lentes_enfoque', 'iman'],
  },

  /* ============ MAGNÉTICO ============ */
  analizador: {
    nombre: 'Analizador de doble enfoque', en: 'Double-focusing analyzer', cat: 'Analizador magnético',
    funcion: 'Combinación de un sector magnético y un sector eléctrico que enfoca en un mismo punto los iones de igual m/z aunque partan con direcciones y energías ligeramente distintas.',
    detalles: [
      'Geometría Nier–Johnson inversa (BE): primero el imán, después el sector eléctrico.',
      'El imán enfoca en dirección pero dispersa en energía; el sector eléctrico tiene una dispersión en energía igual y opuesta. Con la geometría adecuada ambas se compensan en la rendija de salida (doble enfoque).',
      'La geometría Nier–Johnson clásica (1953) usa un sector eléctrico de 90° y un imán de 60°; la geometría Mattauch–Herzog (1934) enfoca a lo largo de un plano y se usaba con placa fotográfica.',
    ],
    specs: [['Geometría', 'Nier–Johnson inversa (BE)'], ['Resolución', '> 60 000 (10 % valle); > 30 000 estática garantizada en la instalación'], ['Exactitud', '< 2 ppm (barrido de tensión); < 5 ppm (barrido magnético)']],
    une: ['iman', 'esa', 'tubo_vuelo'],
  },
  iman: {
    nombre: 'Sector magnético', en: 'Laminated magnetic sector', cat: 'Analizador magnético',
    funcion: 'Electroimán que curva la trayectoria de los iones según su cantidad de movimiento por unidad de carga. Para un campo B y una tensión V dados, solo los iones de una m/z siguen el radio central y continúan hacia el sector eléctrico.',
    detalles: [
      'Relación fundamental: r = mv/(zeB), y con zeV = ½mv² resulta m/z = B²r²e/(2V). El espectro se obtiene barriendo B (barrido magnético) o V (barrido eléctrico).',
      'Con r = 0,35 m y V = 5 kV, un ion de m/z 322 requiere unos 0,52 T y uno de m/z 1200, del orden de 1 T: de ahí el límite de 1200 u a tensión completa.',
      'Culata laminada de baja histéresis: reduce las corrientes inducidas y permite barridos rápidos y saltos de masa reproducibles.',
      'Piezas polares de entrada con perfil de Rogowski. Una sonda Hall mide el campo para regularlo en lazo cerrado.',
    ],
    specs: [['Radio de deflexión', '350 mm'], ['Ángulo de deflexión', '65°'], ['Campo máximo', '≈ 1 T'], ['Barrido', '0,1–10 000 s/década']],
    tune: ['Magnet Field', 'Scan Rate'],
    une: ['rendija_entrada', 'tubo_vuelo', 'rendija_intermedia', 'fuente_iman'],
  },
  rendija_intermedia: {
    nombre: 'Rendija intermedia', en: 'Intermediate (β) slit', cat: 'Analizador magnético',
    funcion: 'Situada en la región libre de campo entre el imán y el sector eléctrico. Recorta los bordes del haz y reduce los iones dispersados que llegarían al sector eléctrico (función aproximada en este modelo).',
    detalles: ['En equipos con barridos enlazados, en esta región se sitúa la cámara de colisión para el estudio de iones metaestables o tras CID.'],
    specs: [],
    une: ['iman', 'esa'],
  },
  tubo_vuelo: {
    nombre: 'Tubo de vuelo', en: 'Flight tube', cat: 'Analizador magnético',
    funcion: 'Conducto de alto vacío que recorre el haz desde la fuente hasta el detector, con una cámara plana dentro del entrehierro del imán.',
    detalles: ['Todos los elementos de enfoque y detección se encuentran en una única cámara de vacío monobloque.', 'Recorrido total del orden de 2 m: un ion de m/z 322 a 5 kV lo recorre en unos 40 µs.'],
    specs: [['Presión', '≈ 10⁻⁵–10⁻⁶ Pa (aprox.)']],
    une: ['iman', 'esa', 'bombas_turbo'],
  },

  /* ============ ELECTROSTÁTICO ============ */
  esa: {
    nombre: 'Analizador electrostático (ESA)', en: 'Toroidal electrostatic analyzer', cat: 'Analizador electrostático',
    funcion: 'Dos placas curvas a potenciales +V y −V que seleccionan los iones por su energía cinética por unidad de carga, con independencia de su masa.',
    detalles: [
      'Radio de la trayectoria: r_e = 2V/E. Por ejemplo, con r_e = 0,2 m, 20 mm entre placas y 5 kV, el campo es de 50 kV/m y las placas están a unos ±500 V.',
      'Diseño toroidal: la curvatura en dos planos enfoca también en la dirección del entrehierro.',
      'Compensa la dispersión en energía del imán, lo que permite alcanzar resoluciones de decenas de miles.',
    ],
    specs: [['Tipo', 'Toroidal'], ['Potencial de las placas', '≈ ±500 V a 5 kV (aprox.)'], ['Ángulo', '≈ 90° (valor didáctico)']],
    tune: ['ESA Voltage'],
    une: ['rendija_intermedia', 'rendija_salida', 'fuente_alta_tension'],
  },
  rendija_salida: {
    nombre: 'Rendija de salida', en: 'Exit slit', cat: 'Analizador electrostático',
    funcion: 'Punto de doble enfoque. Solo pasan al detector los iones que han seguido la trayectoria central en ambos sectores.',
    detalles: ['Para R = 10 000 las rendijas se ajustan a anchuras del orden de decenas de micrómetros (aprox.).'],
    specs: [['Material', 'Tántalo'], ['Anchura', 'Variable']],
    tune: ['Exit Slit'],
    une: ['esa', 'dinodo_conversion'],
  },

  /* ============ DETECTOR ============ */
  dinodo_conversion: {
    nombre: 'Dínodo de conversión', en: 'Conversion dynode', cat: 'Detector',
    funcion: 'Electrodo de post-aceleración a alta tensión. Los iones que lo golpean liberan partículas secundarias que se dirigen al multiplicador.',
    detalles: ['La alta energía de impacto iguala la respuesta para iones de distinta masa.'],
    specs: [['Tensión', 'Hasta ±20 kV']],
    une: ['rendija_salida', 'multiplicador'],
  },
  multiplicador: {
    nombre: 'Multiplicador de electrones secundarios', en: 'Off-axis SEM', cat: 'Detector',
    funcion: 'Amplifica en cascada la señal procedente del dínodo de conversión.',
    detalles: ['Fuera de eje y montado en una brida propia de cambio rápido.', 'Rango dinámico lineal superior a cinco órdenes de magnitud.'],
    specs: [['Ganancia', '≈ 10⁶ (aprox.)'], ['Rango dinámico', '> 10⁵']],
    tune: ['Multiplier Voltage'],
    une: ['dinodo_conversion', 'electronica_control'],
  },
  carcasa_detector: {
    nombre: 'Cámara del detector', en: 'Detector housing', cat: 'Detector',
    funcion: 'Aloja el dínodo de conversión y el multiplicador, montados en una brida propia, dentro de la cámara de vacío del analizador.',
    detalles: [], specs: [],
    une: ['dinodo_conversion', 'multiplicador', 'bombas_turbo'],
  },

  /* ============ VACÍO ============ */
  bombas_turbo: {
    nombre: 'Bombas turbomoleculares (×3)', en: 'Turbomolecular pumps', cat: 'Sistema de vacío',
    funcion: 'Tres bombas sin aceite acopladas directamente en un sistema de bombeo diferencial que mantiene el alto vacío de la fuente y del analizador (el reparto exacto entre zonas es aproximado en este modelo).',
    detalles: ['Una esclusa de vacío (vacuum interlock) de accionamiento neumático permite cambiar el volumen de ionización y el filamento sin ventear el equipo.'],
    specs: [['Número', '3'], ['Presión en el analizador', '≈ 10⁻⁵–10⁻⁶ Pa (aprox.)']],
    une: ['tubo_vuelo', 'bombas_rotatorias'],
  },
  bombas_rotatorias: {
    nombre: 'Bombas rotatorias', en: 'Rotary backing pumps', cat: 'Sistema de vacío',
    funcion: 'Bombas de vacío previo de las turbomoleculares, alojadas dentro del mueble de la consola.',
    detalles: [], specs: [['Ubicación', 'Interior de la consola']],
    une: ['bombas_turbo'],
  },

  /* ============ ELECTRÓNICA ============ */
  fuente_iman: {
    nombre: 'Fuente de alimentación del imán', en: 'Magnet power supply', cat: 'Electrónica y servicios',
    funcion: 'Suministra la corriente de las bobinas del imán con alta estabilidad. El campo se regula a partir de la medida de la sonda Hall.',
    detalles: ['La calibración de masa se realiza por medida del campo y es independiente del modo de barrido, la polaridad y la ionización.'],
    specs: [['Regulación', 'Lazo cerrado con sonda Hall']],
    une: ['iman', 'electronica_control'],
  },
  fuente_alta_tension: {
    nombre: 'Fuentes de alta tensión', en: 'High-voltage supplies', cat: 'Electrónica y servicios',
    funcion: 'Generan la tensión de aceleración (5 kV), las tensiones del sector eléctrico y las del detector.',
    detalles: ['En el modo MID, los saltos entre masas se realizan sobre todo variando la tensión de aceleración y la del ESA con el campo fijo, lo que da exactitudes inferiores a 2 ppm.'],
    specs: [['Aceleración', '5 kV'], ['Estabilidad', 'Del orden de ppm']],
    une: ['fuente_ei', 'esa', 'dinodo_conversion'],
  },
  electronica_control: {
    nombre: 'Electrónica de control y adquisición', en: 'Control electronics', cat: 'Electrónica y servicios',
    funcion: 'Controla rendijas, barridos, temperaturas y vacío, y registra la señal del detector.',
    detalles: ['Modos de adquisición: barrido magnético, barrido de tensión, MID (equivalente al SIM) y comparación de picos (peak matching).'],
    specs: [['Modos', 'Barrido B, barrido V, MID, peak matching']],
    une: ['multiplicador', 'fuente_iman', 'fuente_alta_tension'],
  },
  enfriador: {
    nombre: 'Enfriador de agua', en: 'Chiller', cat: 'Electrónica y servicios',
    funcion: 'Enfriador recirculante opcional que suministra el agua de refrigeración de diversas partes del instrumento y de las sondas de introducción directa cuando el laboratorio no dispone de agua de refrigeración.',
    detalles: ['La fuente de alimentación del imán, en el armario de electrónica, se refrigera por un flujo de aire optimizado.'], specs: [['Caudal', '≈ 13 L/min'], ['Temperatura', '20–25 °C'], ['Consumo', '≈ 1,6 kW']],
    une: ['fuente_iman', 'consola'],
  },

  /* ============ ESTRUCTURA ============ */
  consola: {
    nombre: 'Consola', en: 'Instrument console', cat: 'Estructura y carcasa',
    funcion: 'Mueble que aloja el analizador, las bombas y la electrónica. El analizador descansa sobre una plataforma con amortiguación antichoque.',
    detalles: [], specs: [['Dimensiones', '≈ 161 × 157 × 141 cm (con un GC)'], ['Peso', '≈ 900 kg']],
    une: ['chasis', 'tapa_analizador'],
  },
  tapa_analizador: {
    nombre: 'Cubierta del analizador', en: 'Analyzer cover', cat: 'Estructura y carcasa',
    funcion: 'Cubierta superior que protege el analizador y aísla las zonas de alta tensión y de campo magnético.',
    detalles: [], specs: [],
    une: ['consola', 'analizador'],
  },
  panel_frontal: {
    nombre: 'Panel frontal', en: 'Front panels', cat: 'Estructura y carcasa',
    funcion: 'Puertas de acceso a las bombas y a la electrónica de la consola.',
    detalles: [], specs: [],
    une: ['consola'],
  },
  chasis: {
    nombre: 'Bastidor y plataforma antivibratoria', en: 'Frame · shock-absorbing platform', cat: 'Estructura y carcasa',
    funcion: 'Estructura de la consola y plataforma sobre amortiguadores en la que se apoya el analizador.',
    detalles: [], specs: [],
    une: ['consola', 'analizador'],
  },
};
