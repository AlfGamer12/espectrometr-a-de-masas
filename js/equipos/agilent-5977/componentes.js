// Fichas técnicas de los componentes.
// Valores típicos según documentación pública del fabricante y bibliografía general de espectrometría de masas.
// Pueden variar según la configuración y la versión del equipo.

export const CATEGORIAS = [
  'Introducción de muestra', 'Fuente de iones', 'Analizador de masas', 'Detector',
  'Sistema de vacío', 'Electrónica', 'Estructura y carcasa', 'Cromatógrafo (contexto)',
];

export const INFO = {
  /* ============ INTRODUCCIÓN DE MUESTRA ============ */
  linea_transferencia: {
    nombre: 'Interfaz GC/MSD', en: 'GC/MSD interface · transfer line', cat: 'Introducción de muestra',
    funcion: 'Conduce la columna capilar desde el horno del cromatógrafo hasta la cámara de ionización y la mantiene a temperatura constante para evitar la condensación de los analitos.',
    detalles: [
      'Tubo metálico con calefactor eléctrico, sensor de temperatura y camisa de aislamiento térmico. La consigna se define en el método de adquisición.',
      'La columna atraviesa la interfaz y su extremo queda 1–2 mm dentro de la cámara de ionización. El sellado a vacío se realiza con tuerca y férula de grafito/Vespel.',
      'El extremo de salida de la columna trabaja en alto vacío, por lo que el caudal máximo de gas portador está limitado por la capacidad de bombeo del MSD.',
      'La temperatura de la interfaz debe ser igual o superior a la temperatura final del horno para evitar puntos fríos.',
    ],
    specs: [['Temperatura de trabajo', '250–300 °C'], ['Temperatura máxima', '≈ 350 °C'], ['Caudal de He habitual', '1,0–1,5 mL/min'],
      ['Caudal máximo', '≈ 2–4 mL/min (según bomba)']],
    une: ['columna', 'gc', 'camara_vacio', 'cuerpo_fuente'],
  },
  columna: {
    nombre: 'Columna capilar', en: 'Capillary GC column', cat: 'Introducción de muestra',
    funcion: 'Separa los componentes de la mezcla por tiempo de retención, de modo que llegan a la fuente de iones de forma secuencial.',
    detalles: [
      'Sílice fundida con recubrimiento exterior de poliimida, que le da flexibilidad y su color ámbar. La superficie interior está cubierta por una película de fase estacionaria.',
      'Configuración habitual en GC/MS: 30 m × 0,25 mm d.i. × 0,25 µm, fase 5 % fenil-metilpolisiloxano (tipo -5ms).',
      'Las columnas de grado MS tienen un sangrado reducido. Los siloxanos procedentes de la fase producen iones de fondo característicos (m/z 207, 281).',
      'El extremo se corta en ángulo recto antes de instalarlo en la interfaz.',
    ],
    specs: [['Longitud', '30 m'], ['Diámetro interno', '0,25 mm'], ['Espesor de fase', '0,25 µm'], ['Gas portador', 'He (o H₂)']],
    une: ['gc_inyector', 'linea_transferencia', 'cuerpo_fuente'],
  },
  valvula_calibracion: {
    nombre: 'Válvula de calibración y vial de PFTBA', en: 'Calibration valve · PFTBA vial', cat: 'Introducción de muestra',
    funcion: 'Introduce en la cámara de vacío vapor de perfluorotributilamina (PFTBA, C₁₂F₂₇N), compuesto de referencia para la calibración del eje de masas y el autotune.',
    detalles: [
      'Válvula de solenoide que comunica el vial con la cámara de vacío. El PFTBA es muy volátil y difunde hasta la fuente de iones.',
      'Iones de referencia: m/z 69 (CF₃⁺), 219 (C₄F₉⁺) y 502 (C₉F₂₀N⁺), que cubren los rangos bajo, medio y alto.',
      'El autotune ajusta los potenciales del repulsor y de las lentes, AMU Gain/Offset, anchura de pico y tensión del multiplicador hasta cumplir los criterios de abundancia y resolución.',
      'El informe de tune incluye relaciones isotópicas (70/69, 220/219, 503/502) e iones de aire y agua (m/z 18, 28, 32) para el diagnóstico de fugas.',
    ],
    specs: [['Compuesto', 'PFTBA (C₁₂F₂₇N)'], ['Iones de tune', 'm/z 69, 219, 502'], ['Uso', 'Autotune y calibración de masas']],
    tune: ['AMU Gain', 'AMU Offset', 'Wid219'],
    une: ['camara_vacio', 'cuerpo_fuente'],
  },

  /* ============ FUENTE DE IONES ============ */
  cuerpo_fuente: {
    nombre: 'Cuerpo de la fuente (cámara de ionización)', en: 'Ion source body · EI', cat: 'Fuente de iones',
    funcion: 'Volumen en el que el haz de electrones de 70 eV interacciona con las moléculas eluidas de la columna. Ionización por impacto electrónico: M + e⁻ → M•⁺ + 2 e⁻.',
    detalles: [
      'La energía de 70 eV supera ampliamente la energía de ionización de las moléculas orgánicas (≈ 8–12 eV). El exceso produce una fragmentación reproducible entre equipos, lo que permite la búsqueda en bibliotecas espectrales (NIST).',
      'Solo se ioniza una fracción pequeña de las moléculas. El resto se evacúa por el sistema de vacío.',
      'Se opera caliente para reducir la adsorción y la contaminación de las superficies.',
      'Variantes EI disponibles: acero inoxidable, inerte, Extractor y de alta eficiencia (HES), que difieren en el material y en la geometría de extracción. Existe además una fuente CI opcional.',
      'Es el componente con mayor necesidad de mantenimiento. Se limpia con abrasivo fino y disolventes.',
    ],
    specs: [['Energía electrónica', '70 eV (ajustable)'], ['Temperatura habitual', '230 °C'], ['Temperatura máxima', '≈ 350 °C'],
      ['Corriente de emisión', '≈ 35 µA (típica)']],
    tune: ['Emission', 'Electron Energy'],
    une: ['repulsor', 'filamento', 'imanes', 'calefactor_fuente', 'extractor', 'columna'],
  },
  repulsor: {
    nombre: 'Repulsor', en: 'Repeller', cat: 'Fuente de iones',
    funcion: 'Electrodo situado al fondo de la cámara de ionización con potencial positivo respecto al cuerpo de la fuente. Dirige los iones positivos hacia las lentes de extracción.',
    detalles: [
      'Aislado del cuerpo de la fuente mediante un aislante cerámico. El potencial llega a través de un vástago.',
      'El autotune optimiza su tensión. Un valor mayor suele aumentar la señal, aunque puede modificar la abundancia relativa de los iones de masa alta.',
      'La suciedad o un aislamiento deficiente reducen la sensibilidad y hacen que el tune sea inestable.',
    ],
    specs: [['Potencial', 'Unidades a decenas de V (+)'], ['Material', 'Acero inoxidable']],
    tune: ['Repeller'],
    une: ['cuerpo_fuente', 'aislantes'],
  },
  filamento: {
    nombre: 'Filamentos 1 y 2', en: 'Filaments', cat: 'Fuente de iones',
    funcion: 'Emiten electrones por efecto termoiónico al calentarse con corriente eléctrica. Los electrones se aceleran hasta 70 eV y atraviesan la cámara de ionización.',
    detalles: [
      'La fuente incorpora dos filamentos enfrentados. Se opera con uno y el otro queda de reserva; el cambio se realiza desde el software.',
      'La corriente de emisión se regula en lazo cerrado para mantener constante la ionización.',
      'Se dañan si se encienden con aire en la cámara. El software impide su encendido mientras el vacío no es suficiente.',
      'Los electrones entran por una ventana del cuerpo de la fuente y los que no colisionan se recogen en el lado opuesto.',
    ],
    specs: [['Material', 'Hilo de renio'], ['Principio', 'Emisión termoiónica'], ['Energía electrónica', '70 eV']],
    tune: ['Filament (1/2)', 'Emission'],
    une: ['cuerpo_fuente', 'imanes', 'placa_lateral_electronica'],
  },
  imanes: {
    nombre: 'Imanes de la fuente', en: 'Source magnets', cat: 'Fuente de iones',
    funcion: 'Generan un campo magnético paralelo al haz de electrones. Los electrones describen trayectorias helicoidales que estrechan el haz y aumentan la probabilidad de ionización.',
    detalles: [
      'Montados en el exterior de la cámara de ionización, alineados con los filamentos.',
      'La intensidad del campo no desvía de forma apreciable a los iones, mucho más pesados que los electrones.',
    ],
    specs: [['Tipo', 'Imanes permanentes'], ['Efecto', 'Colimación del haz electrónico']],
    une: ['filamento', 'cuerpo_fuente'],
  },
  calefactor_fuente: {
    nombre: 'Calefactor y sensor de la fuente', en: 'Source heater & sensor', cat: 'Fuente de iones',
    funcion: 'Mantiene la fuente de iones a la temperatura de consigna mediante resistencias de cartucho y un sensor conectado al lazo de control.',
    detalles: [
      'La temperatura influye en la fragmentación: a mayor temperatura, más fragmentación y menor adsorción.',
      'Una fuente por debajo de la temperatura de trabajo se contamina antes y produce picos con cola en compuestos polares.',
      'Tras ventilar y cerrar el equipo, la fuente y el cuadrupolo deben alcanzar el equilibrio térmico antes de realizar el tune.',
    ],
    specs: [['Rango', '150–350 °C'], ['Consigna habitual', '230 °C']],
    une: ['cuerpo_fuente', 'placa_principal'],
  },
  extractor: {
    nombre: 'Placa y lente extractora (drawout)', en: 'Drawout plate · extractor lens', cat: 'Fuente de iones',
    funcion: 'Constituye la salida de la cámara de ionización. Su campo eléctrico extrae los iones de la zona de ionización y los introduce en el sistema de lentes.',
    detalles: [
      'En la fuente Extractor esta lente dispone de un potencial propio ajustable, lo que mejora la eficiencia de extracción.',
      'El orificio central, de pocos milímetros, limita el paso de gas neutro y de electrones hacia el analizador.',
    ],
    specs: [['Material', 'Acero inoxidable'], ['Orificio', 'Pocos mm']],
    une: ['cuerpo_fuente', 'aislantes', 'lente_enfoque'],
  },
  lente_enfoque: {
    nombre: 'Lente de enfoque iónico', en: 'Ion focus lens', cat: 'Fuente de iones',
    funcion: 'Lente electrostática que hace converger el haz de iones sobre el eje óptico del analizador.',
    detalles: [
      'Junto con la lente extractora y la lente de entrada forma un sistema de tipo Einzel: electrodos de orificio a potenciales distintos.',
      'El autotune ajusta su tensión para maximizar la transmisión hacia el cuadrupolo.',
    ],
    specs: [['Tipo', 'Lente electrostática de orificio'], ['Potencial', 'Ajustado por autotune']],
    tune: ['Ion Focus'],
    une: ['extractor', 'aislantes', 'lente_entrada'],
  },
  lente_entrada: {
    nombre: 'Lente de entrada', en: 'Entrance lens', cat: 'Fuente de iones',
    funcion: 'Última lente antes del filtro de masas. Adapta la energía y la geometría del haz a la entrada del cuadrupolo, donde el campo de RF no es ideal (campos de borde).',
    detalles: [
      'Su potencial puede variar con la masa seleccionada para optimizar la transmisión de cada m/z. El tune define un offset y una ganancia.',
      'Está situada muy cerca de los electrodos del cuadrupolo, por lo que su alineación mecánica es crítica.',
    ],
    specs: [['Potencial', 'Offset + rampa con la masa']],
    tune: ['Ent Lens', 'Ent Offset'],
    une: ['lente_enfoque', 'cuadrupolo'],
  },
  aislantes: {
    nombre: 'Aislantes cerámicos', en: 'Lens insulators', cat: 'Fuente de iones',
    funcion: 'Aíslan eléctricamente las lentes entre sí y respecto al cuerpo de la fuente, y fijan su posición relativa.',
    detalles: [
      'Fabricados en alúmina (Al₂O₃): resistentes a alta temperatura y con desgasificación mínima en vacío.',
      'Los depósitos conductores sobre su superficie generan fugas de corriente entre lentes y desplazan los valores de tune.',
    ],
    specs: [['Material', 'Alúmina (Al₂O₃)']],
    une: ['extractor', 'lente_enfoque', 'lente_entrada', 'repulsor'],
  },

  /* ============ ANALIZADOR ============ */
  analizador: {
    nombre: 'Conjunto analizador', en: 'Analyzer assembly', cat: 'Analizador de masas',
    funcion: 'Conjunto formado por la fuente de iones, el filtro de masas cuadrupolar y el detector. Está montado sobre la placa lateral y se extrae con ella para el mantenimiento.',
    detalles: [
      'Opera en alto vacío dentro de la cámara de vacío.',
      'El recorrido de un ion desde la fuente hasta el detector es del orden de 30 cm y dura del orden de decenas de microsegundos.',
    ],
    specs: [['Tipo', 'Cuadrupolo simple'], ['Ionización', 'EI (CI opcional)']],
    une: ['placa_lateral', 'cuerpo_fuente', 'cuadrupolo', 'hed'],
  },
  cuadrupolo: {
    nombre: 'Filtro de masas cuadrupolar hiperbólico', en: 'Hyperbolic quartz quadrupole', cat: 'Analizador de masas',
    funcion: 'Transmite únicamente los iones de una relación m/z determinada. Los electrodos reciben ±(U + V·cos Ωt); para cada par de valores U y V solo una m/z tiene trayectoria estable, y el resto colisiona con los electrodos.',
    detalles: [
      'Pieza monolítica de cuarzo fundido con cuatro superficies de perfil hiperbólico recubiertas de oro. El perfil hiperbólico genera un campo cuadrupolar más próximo al ideal que el de barras cilíndricas, y la baja dilatación del cuarzo garantiza la estabilidad dimensional.',
      'Los electrodos opuestos están conectados entre sí: un par recibe +(U + V cos Ωt) y el otro −(U + V cos Ωt).',
      'El movimiento del ion se describe mediante las ecuaciones de Mathieu, con a = 8zeU/(mΩ²r₀²) y q = 4zeV/(mΩ²r₀²). El vértice de la región de estabilidad se sitúa en a ≈ 0,237 y q ≈ 0,706.',
      'En modo barrido (scan) U y V aumentan simultáneamente con relación U/V constante. En modo SIM el equipo alterna entre unas pocas m/z seleccionadas, con mayor sensibilidad.',
      'Se mantiene caliente para evitar depósitos. No requiere mantenimiento rutinario por parte del usuario.',
    ],
    specs: [['Rango de masas', '≈ 1,6–1050 u'], ['Resolución', 'Unitaria (≈ 0,6–0,7 u FWHM)'], ['Velocidad de barrido', 'Hasta 20 000 u/s (12 500 u/s con fuente de acero inoxidable)'],
      ['Temperatura habitual', '150 °C'], ['Material', 'Cuarzo con recubrimiento de oro']],
    tune: ['AMU Gain', 'AMU Offset', 'DC Polarity', 'Mass Filter temp'],
    une: ['lente_entrada', 'radiador', 'bobina_rf', 'lente_detector', 'soportes'],
  },
  radiador: {
    nombre: 'Radiador y calefactor del cuadrupolo', en: 'Mass filter radiator · heater', cat: 'Analizador de masas',
    funcion: 'Envolvente metálica del cuadrupolo que aloja su calefactor y su sensor de temperatura, y distribuye el calor de forma uniforme a lo largo del filtro.',
    detalles: [
      'La estabilidad térmica del cuadrupolo evita la deriva del eje de masas.',
      'Apantalla eléctricamente el filtro y lo protege mecánicamente.',
    ],
    specs: [['Rango de temperatura', '≈ 106–200 °C'], ['Material', 'Aluminio']],
    une: ['cuadrupolo', 'soportes', 'placa_principal'],
  },

  /* ============ DETECTOR ============ */
  lente_detector: {
    nombre: 'Lente de salida', en: 'Exit lens', cat: 'Detector',
    funcion: 'Recoge los iones que abandonan el cuadrupolo y los dirige hacia el dínodo de alta energía, situado fuera del eje.',
    detalles: ['Los iones se desvían hacia el HED, mientras que las especies neutras continúan en línea recta y no se detectan.'],
    specs: [['Tipo', 'Lente electrostática']],
    une: ['cuadrupolo', 'hed'],
  },
  hed: {
    nombre: 'Dínodo de alta energía (HED)', en: 'High-energy dynode', cat: 'Detector',
    funcion: 'Electrodo a ≈ −10 kV situado fuera del eje del cuadrupolo. Los iones positivos impactan sobre él con alta energía y generan partículas secundarias, principalmente electrones, que se dirigen al multiplicador.',
    detalles: [
      'La posición fuera de eje impide que los fotones y las especies neutras lleguen al multiplicador, lo que reduce el ruido de fondo.',
      'La alta energía de impacto iguala la eficiencia de detección entre iones ligeros y pesados.',
      'La disposición con tres ejes distintos (cuadrupolo, HED y multiplicador) da nombre al detector de triple eje (Triple-Axis Detector).',
    ],
    specs: [['Potencial', '≈ −10 kV (iones positivos)'], ['Posición', 'Fuera de eje']],
    une: ['lente_detector', 'multiplicador', 'carcasa_detector'],
  },
  multiplicador: {
    nombre: 'Multiplicador de electrones', en: 'Electron multiplier · continuous dynode', cat: 'Detector',
    funcion: 'Amplifica la señal. Cada electrón que entra en la bocina impacta en la pared, con recubrimiento resistivo de alta emisión secundaria, y libera 2–3 electrones. La cascada produce un pulso de 10⁵–10⁶ electrones.',
    detalles: [
      'Entre la entrada y la salida de la bocina se aplica una diferencia de potencial de 1000–3000 V.',
      'La corriente de salida se amplifica, se digitaliza en la electrónica principal y se convierte en la abundancia del espectro.',
      'La ganancia disminuye con el uso y el autotune compensa aumentando la tensión (EM Volts). Se sustituye cuando la tensión necesaria es excesiva.',
      'Existen versiones de larga duración con mayor superficie activa.',
    ],
    specs: [['Ganancia', '10⁵–10⁶'], ['Tensión', '≈ 1000–3000 V'], ['Tipo', 'Dínodo continuo (bocina)']],
    tune: ['EM Volts', 'Gain factor'],
    une: ['hed', 'carcasa_detector', 'placa_principal'],
  },
  carcasa_detector: {
    nombre: 'Carcasa del detector', en: 'Detector housing', cat: 'Detector',
    funcion: 'Soporta el HED y el multiplicador en su posición, los apantalla eléctricamente y aísla las conexiones de alta tensión.',
    detalles: ['Incorpora los pasamuros de alta tensión procedentes de la fuente de alimentación HV.'],
    specs: [['Material', 'Acero inoxidable']],
    une: ['hed', 'multiplicador', 'soportes'],
  },
  soportes: {
    nombre: 'Soportes y cableado del analizador', en: 'Analyzer mounts & wiring', cat: 'Analizador de masas',
    funcion: 'Fijan la fuente, el cuadrupolo y el detector a la placa lateral con la alineación correcta y conducen las tensiones hasta los pasamuros de vacío.',
    detalles: ['La alineación viene definida por el propio montaje mecánico, por lo que el analizador se desmonta y se monta sin necesidad de realinearlo.'],
    specs: [['Material', 'Aluminio / acero inoxidable']],
    une: ['placa_lateral', 'cuerpo_fuente', 'cuadrupolo', 'carcasa_detector'],
  },

  /* ============ VACÍO ============ */
  camara_vacio: {
    nombre: 'Cámara de vacío', en: 'Vacuum manifold', cat: 'Sistema de vacío',
    funcion: 'Recinto estanco de aluminio que aloja el analizador. Se mantiene en alto vacío para que los iones recorran la trayectoria de unos 30 cm sin colisionar con moléculas de gas.',
    detalles: [
      'A 10⁻⁵ Torr el recorrido libre medio es de varios metros, muy superior a la trayectoria del ion. A presión atmosférica es del orden de 70 nm.',
      'El vacío protege también los filamentos frente a la oxidación y evita descargas en el HED y el multiplicador.',
      'Las uniones se sellan con juntas tóricas. La placa lateral cierra la abertura principal y la presión atmosférica la mantiene apretada contra la junta.',
      'Conexiones: bomba turbomolecular (inferior), interfaz GC/MSD, válvula de calibración, medidor de vacío y válvula de venteo.',
    ],
    specs: [['Presión de trabajo', '≈ 10⁻⁶–10⁻⁵ Torr (1 mL/min de He)'], ['Material', 'Aluminio'], ['Sellado', 'Juntas tóricas']],
    une: ['placa_lateral', 'bomba_turbo', 'linea_transferencia', 'valvula_calibracion', 'medidor_vacio'],
  },
  placa_lateral: {
    nombre: 'Placa lateral', en: 'Side plate', cat: 'Sistema de vacío',
    funcion: 'Tapa de la cámara de vacío. En su cara interior lleva montado el analizador completo y en la exterior la electrónica de la fuente y el generador de RF.',
    detalles: [
      'Incorpora los pasamuros eléctricos de vacío para las tensiones y señales del analizador.',
      'Va articulada con bisagras y se fija con tornillos de apriete manual. Antes de abrirla es necesario ventilar la cámara y dejar enfriar la fuente y el cuadrupolo.',
    ],
    specs: [['Material', 'Aluminio'], ['Sellado', 'Junta tórica sobre la cámara']],
    une: ['camara_vacio', 'analizador', 'placa_lateral_electronica', 'bobina_rf'],
  },
  bomba_turbo: {
    nombre: 'Bomba turbomolecular', en: 'Turbomolecular pump', cat: 'Sistema de vacío',
    funcion: 'Genera el alto vacío. El rotor, con álabes inclinados, gira a decenas de miles de rpm y transfiere a las moléculas de gas una componente de velocidad hacia la salida, conectada a la bomba de vacío previo.',
    detalles: [
      'Opera en régimen molecular y no puede descargar directamente a la atmósfera; necesita una bomba de vacío previo.',
      'La velocidad periférica de los álabes es comparable a la velocidad térmica de las moléculas (cientos de m/s).',
      'Bombea los gases ligeros (H₂, He) con menor eficiencia que los pesados. Por ello limita el caudal máximo de gas portador.',
      'Existen configuraciones con bomba de difusión, de menor coste, menor caudal admisible y arranque más lento.',
      'El sistema no pasa a estado listo hasta que el rotor alcanza la velocidad nominal.',
    ],
    specs: [['Velocidad del rotor', 'Decenas de miles de rpm'], ['Presión de entrada', '≈ 10⁻⁶–10⁻⁵ Torr'], ['Requiere', 'Bomba de vacío previo']],
    une: ['camara_vacio', 'rotor_turbo', 'manguera_previa', 'fuente_alimentacion'],
  },
  rotor_turbo: {
    nombre: 'Rotor de la bomba turbomolecular', en: 'Turbo rotor stack', cat: 'Sistema de vacío',
    funcion: 'Conjunto de discos con álabes inclinados que gira a alta velocidad, intercalado con discos fijos (estátores) de inclinación opuesta. Cada par rotor–estátor constituye una etapa de compresión.',
    detalles: [
      'La compresión por etapa es moderada, pero el producto de varias etapas alcanza relaciones superiores a 10⁸ para gases pesados.',
      'Gira sobre rodamientos de alta precisión, cerámicos o magnéticos. Un golpe o una entrada brusca de aire a plena velocidad pueden destruirlo.',
    ],
    specs: [['Etapas', 'Varias (rotor + estátor)'], ['Material', 'Aleación de aluminio']],
    une: ['bomba_turbo'],
  },
  bomba_previa: {
    nombre: 'Bomba de vacío previo', en: 'Foreline pump', cat: 'Sistema de vacío',
    funcion: 'Realiza el vacío inicial desde presión atmosférica hasta ≈ 10⁻² Torr y evacúa de forma continua el gas descargado por la bomba turbomolecular.',
    detalles: [
      'Habitualmente rotativa de paletas en baño de aceite. Existen alternativas secas.',
      'Se instala en el suelo, junto al equipo, por su ruido y vibración.',
      'Mantenimiento: revisión del nivel y color del aceite por la mirilla, cambio periódico de aceite y purga con lastre de gas (gas ballast).',
      'El escape debe conducirse a una extracción, ya que arrastra niebla de aceite y restos de disolvente.',
    ],
    specs: [['Presión final', '≈ 10⁻²–10⁻³ Torr'], ['Tipo', 'Rotativa de paletas (o seca)']],
    une: ['manguera_previa', 'bomba_turbo'],
  },
  manguera_previa: {
    nombre: 'Línea de vacío previo', en: 'Foreline hose', cat: 'Sistema de vacío',
    funcion: 'Tubo flexible que conecta el escape de la bomba turbomolecular con la entrada de la bomba de vacío previo.',
    detalles: ['Conexiones mediante bridas KF con anillo de centrado y abrazadera. Una abrazadera floja provoca una fuga visible en el tune como exceso de m/z 28 (N₂) y 32 (O₂).'],
    specs: [['Conexiones', 'Bridas KF']],
    une: ['bomba_turbo', 'bomba_previa'],
  },
  medidor_vacio: {
    nombre: 'Medidor de alto vacío (opcional)', en: 'Ion gauge', cat: 'Sistema de vacío',
    funcion: 'Mide la presión en la cámara de vacío a partir de la corriente iónica generada al ionizar el gas residual, proporcional a la presión.',
    detalles: [
      'Se utiliza para el diagnóstico de fugas y para verificar el vacío antes de encender los filamentos.',
      'En su ausencia, el estado del vacío se deduce de la velocidad y la corriente de la bomba turbomolecular.',
    ],
    specs: [['Rango', '≈ 10⁻³–10⁻⁹ Torr'], ['Principio', 'Ionización (tipo Bayard–Alpert)']],
    une: ['camara_vacio', 'placa_principal'],
  },

  /* ============ ELECTRÓNICA ============ */
  placa_lateral_electronica: {
    nombre: 'Tarjeta electrónica lateral', en: 'Side board', cat: 'Electrónica',
    funcion: 'Genera y controla las tensiones de la fuente de iones: corriente de filamento y de emisión, energía electrónica, repulsor y lentes.',
    detalles: ['Montada sobre la placa lateral, junto al analizador, para reducir la longitud del cableado y el ruido.'],
    specs: [['Controla', 'Filamentos, repulsor y lentes']],
    une: ['placa_lateral', 'filamento', 'repulsor', 'placa_principal'],
  },
  bobina_rf: {
    nombre: 'Generador de RF del cuadrupolo', en: 'RF coil · quad driver', cat: 'Electrónica',
    funcion: 'Genera la componente de radiofrecuencia (V cos Ωt, de cientos a más de mil voltios) y la componente continua (U) que alimentan los electrodos del cuadrupolo.',
    detalles: [
      'Circuito resonante LC formado por la bobina y la capacidad de los electrodos del cuadrupolo. La resonancia permite alcanzar tensiones elevadas con poca potencia.',
      'Se monta junto a la placa lateral para minimizar la capacidad parásita del cableado, que desintonizaría el circuito.',
      'La amplitud de V determina la m/z transmitida. El barrido de V con U/V constante equivale al barrido del espectro.',
    ],
    specs: [['Salida', 'RF ± DC a los electrodos'], ['Amplitud', 'Proporcional a la m/z seleccionada']],
    une: ['cuadrupolo', 'placa_lateral', 'placa_principal'],
  },
  placa_principal: {
    nombre: 'Tarjeta principal y comunicaciones', en: 'Main board · LAN', cat: 'Electrónica',
    funcion: 'Controla temperaturas, vacío y barrido de masas, digitaliza la señal del detector y la transmite al ordenador de adquisición por red local.',
    detalles: [
      'Sincroniza la m/z seleccionada (U/V) con la lectura del detector: cada punto del espectro corresponde a la señal medida para una m/z.',
      'Ejecuta las secuencias de autotune, evacuación (pump-down) y venteo.',
    ],
    specs: [['Comunicación', 'Ethernet (LAN)'], ['Software', 'Adquisición y tratamiento de datos']],
    une: ['placa_lateral_electronica', 'bobina_rf', 'fuente_alimentacion', 'multiplicador'],
  },
  fuente_alimentacion: {
    nombre: 'Fuente de alimentación', en: 'Power supply', cat: 'Electrónica',
    funcion: 'Convierte la tensión de red en las tensiones continuas para la electrónica, los calefactores y el controlador de la bomba turbomolecular.',
    detalles: ['Las altas tensiones del detector (HED ≈ 10 kV, multiplicador hasta ≈ 3 kV) proceden de fuentes de alta tensión específicas.'],
    specs: [['Entrada', 'Red eléctrica (AC)'], ['Salidas', 'DC de baja tensión']],
    une: ['placa_principal', 'bomba_turbo'],
  },
  ventilador: {
    nombre: 'Ventilador', en: 'Cooling fan', cat: 'Electrónica',
    funcion: 'Genera el flujo de aire que refrigera la electrónica y la bomba turbomolecular.',
    detalles: ['Las rejillas de ventilación deben permanecer despejadas. Si la bomba turbomolecular se sobrecalienta, reduce su velocidad o se detiene.'],
    specs: [['Tipo', 'Axial']],
    une: ['bomba_turbo', 'placa_principal'],
  },

  /* ============ ESTRUCTURA ============ */
  carcasa: {
    nombre: 'Carcasa exterior', en: 'Covers', cat: 'Estructura y carcasa',
    funcion: 'Protege los componentes internos, canaliza el aire de refrigeración y aísla al usuario de superficies calientes y de alta tensión.',
    detalles: ['Paneles de chapa con pintura en polvo fijados al chasis mediante tornillería.'],
    specs: [['Material', 'Chapa de acero y plástico técnico']],
    une: ['chasis', 'panel_frontal'],
  },
  panel_frontal: {
    nombre: 'Panel frontal', en: 'Front panel · status display', cat: 'Estructura y carcasa',
    funcion: 'Muestra el estado del equipo mediante pantalla e indicadores LED: alimentación, vacío, estado listo, secuencia en curso y errores.',
    detalles: ['Un indicador ámbar o rojo señala vacío insuficiente, temperaturas fuera de consigna o un fallo que requiere atención.'],
    specs: [['Indicadores', 'Vacío, temperaturas, actividad']],
    une: ['carcasa', 'placa_principal'],
  },
  chasis: {
    nombre: 'Chasis', en: 'Chassis', cat: 'Estructura y carcasa',
    funcion: 'Estructura base sobre la que se montan la cámara de vacío, la bomba turbomolecular y la electrónica.',
    detalles: ['Apoyado sobre pies de goma que amortiguan las vibraciones.'],
    specs: [],
    une: ['bomba_turbo', 'carcasa'],
  },

  /* ============ CROMATÓGRAFO ============ */
  gc: {
    nombre: 'Cromatógrafo de gases', en: 'Gas chromatograph', cat: 'Cromatógrafo (contexto)',
    funcion: 'Vaporiza la muestra y separa sus componentes en la columna, dentro de un horno con programa de temperatura. El MSD actúa como detector del cromatógrafo.',
    detalles: [
      'Representación simplificada: el objeto del modelo es el espectrómetro de masas.',
      'La técnica GC/MS proporciona dos datos por compuesto: tiempo de retención y espectro de masas.',
    ],
    specs: [['Gas portador', 'Helio'], ['Horno', 'Programable hasta ≈ 450 °C']],
    une: ['gc_inyector', 'columna', 'linea_transferencia'],
  },
  gc_puerta: {
    nombre: 'Puerta del horno', en: 'GC oven door', cat: 'Cromatógrafo (contexto)',
    funcion: 'Cierra el horno que aloja la columna. Un ventilador interior homogeneiza la temperatura.',
    detalles: ['El programa de temperatura (por ejemplo, de 50 a 300 °C a 10 °C/min) controla la separación.'],
    specs: [],
    une: ['gc', 'columna'],
  },
  gc_inyector: {
    nombre: 'Inyector split/splitless', en: 'Split/splitless inlet', cat: 'Cromatógrafo (contexto)',
    funcion: 'Recibe la muestra líquida (≈ 1 µL) a través de un septum, la vaporiza en un liner caliente y la transfiere a la columna completa (splitless) o en fracción (split).',
    detalles: ['Temperatura habitual del inyector: 250–280 °C.'],
    specs: [['Volumen de inyección', '1 µL'], ['Temperatura', '250–280 °C']],
    une: ['gc', 'columna'],
  },
};
