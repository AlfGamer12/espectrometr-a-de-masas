// Fichas técnicas del Shimadzu LCMS-8060NX (triple cuadrupolo LC-MS/MS).
// Fuentes: folletos y hojas de especificaciones de Shimadzu (LCMS-8060, 8060NX, 8040), folleto de consumibles LCMS (SSI, 2022),
// guía "Fundamental Guide to LCMS" y documentación de servicio pública. Valores típicos; "aprox." indica estimaciones.

export const CATEGORIAS = [
  'Cromatógrafo de líquidos (contexto)', 'Fuente de iones e interfaz', 'Óptica iónica', 'Analizadores de masas',
  'Detector', 'Sistema de vacío', 'Electrónica y gases', 'Estructura y carcasa',
];

export const INFO = {
  /* ============ CROMATÓGRAFO DE LÍQUIDOS ============ */
  lc: {
    nombre: 'Cromatógrafo de líquidos (UHPLC)', en: 'UHPLC system · Nexera', cat: 'Cromatógrafo de líquidos (contexto)',
    funcion: 'Separa los componentes de la muestra en una columna de fase reversa antes de su entrada en el espectrómetro. El LCMS-8060NX trabaja habitualmente acoplado a un sistema Nexera en torre, situado a la izquierda de la unidad MS.',
    detalles: [
      'Torre modular: bandeja de disolventes, controlador, bombas de alta presión, horno de columna y automuestreador. Cada módulo mide unos 260 mm de ancho.',
      'La fuente de iones está en el extremo izquierdo de la unidad MS para que la conexión desde la columna sea lo más corta posible.',
      'Representación simplificada: el objeto del modelo es el espectrómetro de masas.',
    ],
    specs: [['Caudal admisible en la fuente', 'Hasta 2 mL/min (ESI, APCI)'], ['Caudal habitual UHPLC', '0,2–0,6 mL/min']],
    une: ['lc_horno', 'tubo_peek', 'valvula_desvio'],
  },
  lc_botellas: {
    nombre: 'Bandeja de disolventes', en: 'Solvent reservoir tray', cat: 'Cromatógrafo de líquidos (contexto)',
    funcion: 'Contiene las fases móviles (por ejemplo, agua y acetonitrilo con ácido fórmico al 0,1 %) que aspiran las bombas.',
    detalles: ['En LC-MS se utilizan aditivos volátiles (ácido fórmico, acetato o formiato amónico). Las sales no volátiles, como los fosfatos, contaminan la fuente.'],
    specs: [['Aditivos compatibles', 'Ácido fórmico, acetato/formiato amónico']],
    une: ['lc_bomba'],
  },
  lc_bomba: {
    nombre: 'Bombas de alta presión', en: 'High-pressure pumps', cat: 'Cromatógrafo de líquidos (contexto)',
    funcion: 'Impulsan la fase móvil a caudal constante y forman el gradiente de composición mezclando dos disolventes.',
    detalles: ['Los sistemas UHPLC trabajan a presiones de varias decenas de MPa con columnas de partícula inferior a 2 µm.'],
    specs: [['Presión típica UHPLC', 'Decenas de MPa']],
    une: ['lc_botellas', 'lc_inyector'],
  },
  lc_inyector: {
    nombre: 'Automuestreador', en: 'Autosampler', cat: 'Cromatógrafo de líquidos (contexto)',
    funcion: 'Toma un volumen preciso de cada vial (habitualmente 1–10 µL) y lo introduce en el flujo de fase móvil.',
    detalles: ['Suele estar refrigerado para preservar las muestras biológicas durante las secuencias largas.'],
    specs: [['Volumen de inyección', '1–10 µL (típico)']],
    une: ['lc_bomba', 'lc_horno'],
  },
  lc_horno: {
    nombre: 'Horno de columna y columna UHPLC', en: 'Column oven · UHPLC column', cat: 'Cromatógrafo de líquidos (contexto)',
    funcion: 'Mantiene la columna a temperatura constante. En la columna, de fase reversa C18, se separan los analitos por polaridad.',
    detalles: ['Columna habitual: 50–100 mm × 2,1 mm d.i., partícula de 1,7–2,7 µm. La temperatura estable mejora la reproducibilidad del tiempo de retención.'],
    specs: [['Columna típica', 'C18, 2,1 × 50–100 mm'], ['Temperatura', '30–60 °C']],
    une: ['lc_inyector', 'tubo_peek'],
  },
  tubo_peek: {
    nombre: 'Línea de muestra PEEK', en: 'PEEK tubing', cat: 'Cromatógrafo de líquidos (contexto)',
    funcion: 'Conduce el eluyente de la columna a la válvula de desvío y a la sonda ESI.',
    detalles: ['Tubo PEEK rojo de 0,13 mm (0,005") de diámetro interno y 1/16" de diámetro externo. Su volumen muerto reducido evita el ensanchamiento de los picos.'],
    specs: [['Diámetro interno', '0,13 mm'], ['Diámetro externo', '1/16"']],
    une: ['lc_horno', 'valvula_desvio', 'sonda_esi'],
  },

  /* ============ FUENTE DE IONES E INTERFAZ ============ */
  torre_fuente: {
    nombre: 'Unidad de ionización', en: 'Ionization unit housing', cat: 'Fuente de iones e interfaz',
    funcion: 'Carcasa del extremo izquierdo de la unidad MS que aloja la cámara de ionización a presión atmosférica, la sonda y el bloque calefactor.',
    detalles: [
      'Sobresale por encima del cuerpo principal. La sonda entra verticalmente por la parte superior.',
      'La cámara de ionización tiene un desagüe inferior para los disolventes no evaporados.',
      'Los indicadores LED de estado del equipo están en su parte inferior frontal.',
    ],
    specs: [['Presión interior', 'Atmosférica'], ['Interfaces', 'ESI de serie; APCI y DUIS opcionales']],
    une: ['sonda_esi', 'bloque_calefactor', 'ventana_fuente', 'valvula_desvio'],
  },
  ventana_fuente: {
    nombre: 'Ventana de la fuente', en: 'Source window', cat: 'Fuente de iones e interfaz',
    funcion: 'Permite observar la sonda y la pulverización durante el funcionamiento, y da acceso a la entrada de la línea de desolvatación para su limpieza.',
    detalles: ['Para las paradas prolongadas, la entrada de la DL se tapa desde aquí con el tapón específico (DL plug).'],
    specs: [['Material', 'Vidrio con marco metálico']],
    une: ['torre_fuente', 'bloque_calefactor'],
  },
  valvula_desvio: {
    nombre: 'Válvula de desvío', en: 'Diverter valve', cat: 'Fuente de iones e interfaz',
    funcion: 'Válvula de 6 vías que envía a desecho la parte del eluyente sin interés (por ejemplo, el frente de sales del inicio del cromatograma) y dirige el resto a la sonda.',
    detalles: ['Reduce la contaminación de la fuente y de la línea de desolvatación. Su posición exacta en el 8060NX (integrada o externa) depende de la configuración.'],
    specs: [['Tipo', 'Válvula rotatoria de 6 vías']],
    une: ['tubo_peek', 'sonda_esi'],
  },
  sonda_esi: {
    nombre: 'Sonda ESI (unidad IonFocus)', en: 'Heated ESI probe · IonFocus unit', cat: 'Fuente de iones e interfaz',
    funcion: 'Pulveriza el eluyente en un aerosol de gotas cargadas aplicando alta tensión al capilar. Al evaporarse el disolvente, las gotas se fisionan hasta liberar iones en fase gaseosa (ionización por electrospray).',
    detalles: [
      'Capilar ESI central de acero inoxidable, rodeado por el gas nebulizador (N₂) coaxial y por el gas de calentamiento, que acelera la evaporación de la pluma.',
      'Pulverización ortogonal: la sonda pulveriza de arriba abajo y la entrada de la DL es horizontal, a unos 90°. Las gotas grandes y los neutros no entran directamente en el analizador.',
      'En el 8060NX, los electrodos de enfoque de la unidad IonFocus dirigen los iones hacia la entrada y apartan gotas y contaminantes, lo que permite alejar la sonda sin perder señal.',
      'Se monta sin herramientas, con una palanca de anclaje y sin cables ni tubos que desconectar.',
      'En ESI(+) se forman sobre todo iones [M+H]⁺ y aductos ([M+Na]⁺, [M+NH₄]⁺); en ESI(−), [M−H]⁻.',
    ],
    specs: [['Tensión de interfaz', '≈ 1–4 kV según polaridad y método'], ['Gas nebulizador (N₂)', '≈ 3 L/min'], ['Gas de calentamiento (N₂)', '10–25 L/min'],
      ['Temperatura de interfaz', '200–400 °C'], ['Caudal de LC', 'Hasta 2 mL/min']],
    tune: ['Interface Voltage', 'Focus Voltage', 'Interface Temperature', 'Nebulizing Gas Flow', 'Heating Gas Flow'],
    une: ['tubo_peek', 'torre_fuente', 'bloque_calefactor', 'linea_gases'],
  },
  bloque_calefactor: {
    nombre: 'Bloque calefactor', en: 'Heat block', cat: 'Fuente de iones e interfaz',
    funcion: 'Bloque metálico calefactado que forma la pared de entrada al vacío, rodea la entrada de la DL y emite el gas de secado a contracorriente.',
    detalles: [
      'El gas de secado (N₂) sale alrededor de la entrada de la DL hacia la pluma: completa la desolvatación e impide la entrada de gotas y neutros.',
      'Es la superficie que se ve a través de la ventana de la fuente. Su limpieza forma parte del mantenimiento rutinario.',
    ],
    specs: [['Temperatura', '300–500 °C'], ['Gas de secado (N₂)', '≈ 10 L/min']],
    tune: ['Heat Block Temperature', 'Drying Gas Flow'],
    une: ['sonda_esi', 'linea_desolvatacion', 'ventana_fuente'],
  },
  linea_desolvatacion: {
    nombre: 'Línea de desolvatación (DL)', en: 'Desolvation line', cat: 'Fuente de iones e interfaz',
    funcion: 'Capilar metálico calefactado que transfiere los iones desde la presión atmosférica a la primera cámara de vacío intermedio y completa la eliminación del disolvente.',
    detalles: [
      'Constituye la primera restricción del bombeo diferencial: su pequeño diámetro limita el caudal de gas que entra en el vacío.',
      'El 8060 utiliza la versión DL3, con un orificio de entrada mayor que en el 8050 para aumentar la transmisión de iones.',
      'Se fija con un perno terminal y juntas tóricas. En el 8060NX se sustituye sin romper el vacío.',
      'Es la principal pieza de mantenimiento: si el manómetro Pirani de la 1.ª cámara indica ≤ 50 Pa, la DL está obstruida. Se recomienda cambiarla cada seis meses aproximadamente.',
    ],
    specs: [['Temperatura', '150–250 °C (máx. 300 °C)'], ['Longitud', '≈ 10 cm (aprox.)'], ['Sustitución', 'Cada ≈ 6 meses']],
    tune: ['DL Temperature'],
    une: ['bloque_calefactor', 'uf_qarray', 'tabiques'],
  },

  /* ============ ÓPTICA IÓNICA ============ */
  uf_qarray: {
    nombre: 'Guía de iones UF-Qarray', en: 'UF-Qarray RF ion guide', cat: 'Óptica iónica',
    funcion: 'Guía de iones de radiofrecuencia en la primera cámara intermedia (≈10² Pa). Recoge el chorro de gas e iones que sale de la DL, enfoca los iones hacia el eje y deja que el gas neutro se evacúe.',
    detalles: [
      'Conjunto de electrodos multipolares cortos y segmentados en serie, con un gradiente de tensión continua que empuja los iones y una geometría convergente que actúa como un embudo.',
      'Su forma se optimizó mediante simulación del flujo de gas y de las trayectorias iónicas para trabajar con el mayor caudal que admite la DL3.',
      'En el 8060NX (UF-Qarray II) se desmonta sin herramientas. Su limpieza corresponde al servicio técnico.',
    ],
    specs: [['Presión', '≈ 10² Pa'], ['Tipo', 'Multipolo de RF segmentado y convergente']],
    une: ['linea_desolvatacion', 'skimmer', 'linea_vacio_previo'],
  },
  skimmer: {
    nombre: 'Skimmer', en: 'Skimmer', cat: 'Óptica iónica',
    funcion: 'Cono metálico con un pequeño orificio que separa la primera y la segunda cámara de vacío. Deja pasar el haz de iones enfocado y retiene la mayor parte del gas.',
    detalles: ['Es la segunda restricción del bombeo diferencial.'],
    specs: [['Forma', 'Cono con orificio central'], ['Material', 'Acero inoxidable']],
    une: ['uf_qarray', 'uf_lens', 'tabiques'],
  },
  uf_lens: {
    nombre: 'UF-Lens', en: 'UF-Lens transfer optics', cat: 'Óptica iónica',
    funcion: 'Óptica de transferencia multipolar (octapolo de RF) con lentes de entrada y salida, situada en la segunda cámara de vacío. Transporta y focaliza el haz hasta el primer cuadrupolo.',
    detalles: ['En el 8060NX (UF-Lens II) se desmonta sin herramientas.'],
    specs: [['Presión', '≈ 10⁻¹–10⁻² Pa'], ['Tipo', 'Octapolo de RF']],
    une: ['skimmer', 'prebarras', 'bomba_turbo'],
  },
  tabiques: {
    nombre: 'Tabiques de bombeo diferencial', en: 'Differential pumping walls', cat: 'Óptica iónica',
    funcion: 'Paredes con orificios que dividen el recorrido en cámaras de presión decreciente. Cada cámara se bombea por separado.',
    detalles: ['Secuencia: presión atmosférica → 1.ª cámara (≈10² Pa, rotatoria) → 2.ª cámara (≈10⁻¹–10⁻² Pa, turbo) → alto vacío (Q1, q2, Q3 y detector, turbo).'],
    specs: [['Etapas', '4 regiones de presión']],
    une: ['linea_desolvatacion', 'skimmer', 'camara_vacio'],
  },

  /* ============ ANALIZADORES ============ */
  analizador: {
    nombre: 'Conjunto analizador MS/MS', en: 'MS/MS analyzer assembly', cat: 'Analizadores de masas',
    funcion: 'Conjunto formado por la interfaz, la óptica iónica, los dos cuadrupolos de filtrado, la celda de colisión y el detector, alineados sobre un eje común dentro de la cámara de vacío.',
    detalles: ['Disposición QqQ: Q1 selecciona el ion precursor, q2 lo fragmenta por colisión con argón y Q3 selecciona el ion producto.'],
    specs: [['Configuración', 'Triple cuadrupolo (QqQ)'], ['Rango de masas', 'm/z 2–2000']],
    une: ['q1', 'celda_colision', 'q3', 'camara_vacio'],
  },
  prebarras: {
    nombre: 'Pre-barras de Q1 y Q3', en: 'Pre-rods', cat: 'Analizadores de masas',
    funcion: 'Barras cortas alimentadas solo con RF a la entrada de cada cuadrupolo. Suavizan la transición del campo (campos de borde) y mejoran la transmisión de iones hacia el filtro.',
    detalles: ['También protegen las barras principales de la contaminación, que se acumula preferentemente en las pre-barras.'],
    specs: [['Alimentación', 'Solo RF']],
    tune: ['Q1 Pre Bias', 'Q3 Pre Bias'],
    une: ['q1', 'q3', 'uf_lens', 'celda_colision'],
  },
  q1: {
    nombre: 'Primer cuadrupolo (Q1)', en: 'Q1 mass filter', cat: 'Analizadores de masas',
    funcion: 'Filtro de masas que selecciona el ion precursor. Con U y V fijos transmite una única m/z (modos MRM, SIM, iones producto) o barre U y V para obtener un espectro completo.',
    detalles: [
      'Cuatro barras de molibdeno de perfil hiperbólico. El perfil hiperbólico aproxima mejor el campo cuadrupolar ideal y mejora la transmisión y la forma de pico.',
      'Opera en alto vacío para que los iones no colisionen durante su recorrido.',
      'Resolución unitaria ajustable (Unit / High).',
    ],
    specs: [['Barras', 'Molibdeno, perfil hiperbólico'], ['Resolución', '< 0,7 u FWHM (ajustable a 0,5 u)'], ['Velocidad de barrido', 'Hasta 30 000 u/s'],
      ['Estabilidad de masa', '0,05 u en 12 h']],
    tune: ['Q1 Resolution', 'Q1 Pre Bias'],
    une: ['prebarras', 'celda_colision', 'generadores_rf'],
  },
  celda_colision: {
    nombre: 'Celda de colisión UFsweeper III', en: 'UFsweeper III collision cell', cat: 'Analizadores de masas',
    funcion: 'Fragmenta el ion precursor seleccionado por Q1 mediante disociación inducida por colisión (CID) con argón. Los iones producto pasan a Q3.',
    detalles: [
      'Multipolo estrechado dentro de una carcasa cerrada a la que llega el argón. La energía de colisión (CE) es la diferencia de potencial con la que el ion entra en la celda.',
      'La geometría estrechada crea una pseudo-superficie de potencial que barre los iones hacia la salida. La celda se vacía en muy poco tiempo, lo que evita la interferencia entre transiciones (crosstalk) con tiempos de permanencia de 0,8 ms.',
      'Una CE baja conserva el precursor; una CE alta produce fragmentos más pequeños. Cada transición MRM tiene su CE óptima.',
    ],
    specs: [['Gas de colisión', 'Argón > 99,99 %'], ['Presión de suministro', '≈ 230–300 kPa'], ['Crosstalk', '< 0,0005 %'], ['Ciclo MRM mínimo', 'Dwell 0,8 ms + pausa 1 ms']],
    tune: ['CE', 'CID Gas'],
    une: ['q1', 'q3', 'linea_gases'],
  },
  q3: {
    nombre: 'Tercer cuadrupolo (Q3)', en: 'Q3 mass filter', cat: 'Analizadores de masas',
    funcion: 'Segundo filtro de masas. Selecciona el ion producto (MRM) o barre su rango para obtener el espectro de fragmentos (barrido de iones producto).',
    detalles: ['Misma construcción que Q1: barras hiperbólicas de molibdeno con pre-barras. En los modos de barrido Q1 funciona solo con RF y transmite todos los iones.'],
    specs: [['Barras', 'Molibdeno, perfil hiperbólico'], ['Transiciones MRM', 'Hasta 555 por segundo']],
    tune: ['Q3 Resolution', 'Q3 Pre Bias'],
    une: ['celda_colision', 'prebarras', 'dinodo_conversion'],
  },

  /* ============ DETECTOR ============ */
  lente_salida: {
    nombre: 'Lente de salida', en: 'Exit lens', cat: 'Detector',
    funcion: 'Recoge los iones que abandonan Q3 y los dirige hacia el dínodo de conversión.',
    detalles: [], specs: [['Tipo', 'Lente electrostática']],
    une: ['q3', 'dinodo_conversion'],
  },
  dinodo_conversion: {
    nombre: 'Dínodo de conversión', en: 'Off-axis conversion dynode', cat: 'Detector',
    funcion: 'Electrodo de alta tensión situado fuera del eje. Atrae a los iones, que al impactar liberan electrones secundarios que se dirigen al multiplicador.',
    detalles: ['La posición fuera de eje impide que los fotones y las especies neutras alcancen el multiplicador, lo que reduce el ruido.'],
    specs: [['Potencial', '≈ ±10 kV (aprox.)'], ['Posición', 'Fuera de eje']],
    tune: ['Conversion Dynode'],
    une: ['q3', 'multiplicador', 'fuente_alta_tension'],
  },
  multiplicador: {
    nombre: 'Multiplicador de electrones secundarios', en: 'Secondary electron multiplier', cat: 'Detector',
    funcion: 'Amplifica en cascada los electrones procedentes del dínodo de conversión y genera un pulso medible por cada ion detectado.',
    detalles: ['Trabaja en modo de conteo de pulsos con un rango dinámico de 7 órdenes de magnitud. El autotune ajusta su tensión para compensar el envejecimiento.'],
    specs: [['Rango dinámico', '7 órdenes de magnitud'], ['Tensión', '≈ 1,5–2,5 kV (aprox.)']],
    tune: ['Detector Voltage'],
    une: ['dinodo_conversion', 'placa_principal'],
  },
  carcasa_detector: {
    nombre: 'Carcasa del detector', en: 'Detector housing', cat: 'Detector',
    funcion: 'Soporta el dínodo de conversión y el multiplicador, los apantalla y aísla sus conexiones de alta tensión.',
    detalles: [], specs: [['Material', 'Acero inoxidable']],
    une: ['dinodo_conversion', 'multiplicador'],
  },
  soportes: {
    nombre: 'Bancada del analizador', en: 'Analyzer rail', cat: 'Analizadores de masas',
    funcion: 'Mantiene alineados Q1, la celda de colisión y Q3 sobre un eje común.',
    detalles: [], specs: [['Material', 'Aluminio']],
    une: ['q1', 'celda_colision', 'q3'],
  },

  /* ============ VACÍO ============ */
  camara_vacio: {
    nombre: 'Cámara de vacío', en: 'Vacuum manifold', cat: 'Sistema de vacío',
    funcion: 'Recinto estanco que aloja la óptica iónica, los analizadores y el detector, dividido internamente en regiones de presión decreciente.',
    detalles: [
      'Incorpora el puerto de vacío previo de la 1.ª cámara, los tres puertos hacia la bomba turbomolecular y los medidores de vacío.',
      'LabSolutions muestra dos lecturas: "Lower Vacuum" (Pirani) y "Higher Vacuum" (medidor de ionización).',
    ],
    specs: [['Alto vacío', '≈ 10⁻³–10⁻⁴ Pa (aprox.)'], ['Medidores', 'Pirani + ionización']],
    tune: ['Lower Vacuum', 'Higher Vacuum'],
    une: ['bomba_turbo', 'linea_vacio_previo', 'tabiques', 'analizador'],
  },
  bomba_turbo: {
    nombre: 'Bomba turbomolecular de tres entradas', en: 'Triple-inlet split-flow turbomolecular pump', cat: 'Sistema de vacío',
    funcion: 'Una sola bomba de flujo dividido con tres puertos a distintas etapas del rotor: bombea a la vez la 2.ª cámara y las dos zonas de alto vacío.',
    detalles: ['Cada puerto conecta con una etapa intermedia del rotor, de modo que una única bomba mantiene presiones distintas en cada cámara. Su escape lo recoge la bomba rotatoria.'],
    specs: [['Velocidad de bombeo', '40 + 260 + 210 L/s'], ['Bomba previa', 'Rotatoria']],
    une: ['camara_vacio', 'linea_vacio_previo', 'uf_lens'],
  },
  bomba_rotatoria: {
    nombre: 'Bomba rotatoria', en: 'Rotary vane pump', cat: 'Sistema de vacío',
    funcion: 'Evacúa la 1.ª cámara intermedia (≈10² Pa) y actúa como bomba previa de la turbomolecular. Se instala bajo la mesa.',
    detalles: [
      'Bomba de paletas en baño de aceite (Leybold en el 8060/8060NX).',
      'Mantenimiento: cambio de aceite cada tres meses aproximadamente (2 L por cambio), purga con lastre de gas y sustitución periódica del filtro de escape.',
    ],
    specs: [['Tipo', 'Rotativa de paletas'], ['Aceite', 'LVO700 (2 L)'], ['Cambio de aceite', 'Cada ≈ 3 meses']],
    une: ['linea_vacio_previo'],
  },
  linea_vacio_previo: {
    nombre: 'Línea de vacío previo', en: 'Roughing line', cat: 'Sistema de vacío',
    funcion: 'Conducciones que unen la 1.ª cámara intermedia y el escape de la turbomolecular con la bomba rotatoria.',
    detalles: ['Tubo metálico corrugado con bridas KF. La entrada de aire por una conexión floja eleva la presión de la 1.ª cámara.'],
    specs: [['Conexiones', 'Bridas KF']],
    une: ['bomba_rotatoria', 'bomba_turbo', 'camara_vacio'],
  },

  /* ============ ELECTRÓNICA Y GASES ============ */
  generadores_rf: {
    nombre: 'Generadores de RF/DC de los cuadrupolos', en: 'Quadrupole RF/DC drivers', cat: 'Electrónica y gases',
    funcion: 'Suministran la radiofrecuencia y la tensión continua de Q1 y Q3, y la RF de las guías de iones y de la celda de colisión.',
    detalles: ['Permiten barridos de hasta 30 000 u/s y cambios de polaridad positiva/negativa en 5 ms.'],
    specs: [['Velocidad de barrido', 'Hasta 30 000 u/s'], ['Cambio de polaridad', '5 ms']],
    une: ['q1', 'q3', 'placa_principal'],
  },
  fuente_alta_tension: {
    nombre: 'Fuentes de alta tensión', en: 'High-voltage supplies', cat: 'Electrónica y gases',
    funcion: 'Generan las tensiones de la sonda ESI, los electrodos de enfoque, el dínodo de conversión y el multiplicador.',
    detalles: [], specs: [['Salidas', 'Sonda, Focus, dínodo, detector']],
    une: ['sonda_esi', 'dinodo_conversion', 'multiplicador'],
  },
  placa_principal: {
    nombre: 'Electrónica de control', en: 'Control electronics', cat: 'Electrónica y gases',
    funcion: 'Controla temperaturas, gases, vacío y tensiones, sincroniza las transiciones MRM con la adquisición y comunica con LabSolutions.',
    detalles: ['Captura datos con un ciclo de 1,5 ms en el 8060NX. Gestiona hasta 1000 eventos de adquisición con 32 canales cada uno.'],
    specs: [['Software', 'LabSolutions LCMS'], ['Eventos', 'Hasta 1000']],
    une: ['generadores_rf', 'multiplicador', 'linea_gases'],
  },
  linea_gases: {
    nombre: 'Gases: nitrógeno y argón', en: 'Gas supply', cat: 'Electrónica y gases',
    funcion: 'El nitrógeno alimenta el gas nebulizador, el de calentamiento y el de secado. El argón es el gas de colisión de la celda q2.',
    detalles: [
      'El N₂ procede normalmente de un generador de nitrógeno, con un consumo máximo del orden de 25 L/min.',
      'El argón entra por la válvula CID, que se abre y cierra desde la pantalla System Control.',
      'El 8060 y el 8060NX no necesitan aire comprimido.',
    ],
    specs: [['N₂', 'Pureza > 97 %'], ['Ar', 'Pureza > 99,99 %']],
    tune: ['Nebulizing Gas Flow', 'Heating Gas Flow', 'Drying Gas Flow', 'CID Gas'],
    une: ['sonda_esi', 'bloque_calefactor', 'celda_colision'],
  },

  /* ============ ESTRUCTURA ============ */
  carcasa: {
    nombre: 'Carcasa exterior', en: 'Covers', cat: 'Estructura y carcasa',
    funcion: 'Cubierta superior y paneles laterales en negro brillante que protegen el interior y canalizan la ventilación.',
    detalles: [], specs: [['Dimensiones de la unidad MS', '1180 × 540 × 610 mm'], ['Peso', '≈ 140 kg']],
    une: ['chasis', 'panel_frontal'],
  },
  panel_frontal: {
    nombre: 'Panel frontal', en: 'Front panel', cat: 'Estructura y carcasa',
    funcion: 'Panel bicolor, negro en la parte superior y plateado en la inferior, con la identificación del modelo.',
    detalles: [], specs: [],
    une: ['carcasa', 'torre_fuente'],
  },
  panel_trasero: {
    nombre: 'Panel trasero', en: 'Rear panel', cat: 'Estructura y carcasa',
    funcion: 'Agrupa las entradas de nitrógeno y argón, la alimentación eléctrica (230 V, 15 A), la conexión de red y la placa de características.',
    detalles: [], specs: [['Alimentación', 'Monofásica 230 V, 50/60 Hz, 15 A']],
    une: ['linea_gases', 'placa_principal'],
  },
  chasis: {
    nombre: 'Chasis', en: 'Chassis', cat: 'Estructura y carcasa',
    funcion: 'Bastidor sobre el que se montan la cámara de vacío, la bomba turbomolecular y la electrónica. Se apoya en patas niveladoras.',
    detalles: [], specs: [],
    une: ['camara_vacio', 'carcasa'],
  },
};
