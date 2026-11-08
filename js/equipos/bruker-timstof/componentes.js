// Fichas técnicas del Bruker timsTOF Pro (TIMS-QTOF).
// Fuentes: páginas de producto de Bruker (timsTOF Pro, Pro 2, HT, Ultra); Meier et al. 2015 (J. Proteome Res.), 2018 (Mol. Cell. Proteomics)
// y 2021 (Nat. Commun.); Fernandez-Lima et al. 2011; Castellanos et al. 2014; Liu et al. 2022; Panczyk et al. 2024. "aprox." = estimación.

export const CATEGORIAS = [
  'Cromatografía (contexto)', 'Fuente e interfaz', 'Movilidad iónica (TIMS)', 'Óptica iónica', 'Cuadrupolo y celda de colisión',
  'Tiempo de vuelo (TOF)', 'Sistema de vacío', 'Electrónica y gases', 'Estructura y carcasa',
];

export const INFO = {
  /* ============ LC ============ */
  nanolc: {
    nombre: 'Cromatógrafo nano-LC', en: 'nanoElute', cat: 'Cromatografía (contexto)',
    funcion: 'Separa los péptidos a caudales de nanolitros por minuto en columnas capilares de fase reversa, acoplado directamente al emisor CaptiveSpray.',
    detalles: ['Caudales de 50–2000 nL/min y presiones del orden de 1000 bar. También se acopla a sistemas como Evosep One.', 'Representación simplificada.'],
    specs: [['Caudal', '50–2000 nL/min'], ['Presión', '≈ 1000 bar']],
    une: ['captivespray'],
  },

  /* ============ FUENTE ============ */
  captivespray: {
    nombre: 'Fuente CaptiveSpray (nanoESI)', en: 'CaptiveSpray nanoESI source', cat: 'Fuente e interfaz',
    funcion: 'Ioniza los péptidos que eluyen de la nano-LC mediante electrospray a presión atmosférica. Un flujo de gas en vórtice estabiliza la pulverización sin necesidad de ajustar la posición del emisor.',
    detalles: [
      'Para caudales analíticos se utilizan las fuentes Apollo II ESI o VIP-HESI.',
      'El gas de secado (N₂) a unos 200 °C completa la desolvatación de las gotas.',
    ],
    specs: [['Tensión del capilar', '1500–1700 V'], ['Gas de secado', '3,0 L/min'], ['Temperatura', '180–200 °C']],
    tune: ['Capillary', 'Dry Gas', 'Dry Temp'],
    une: ['nanolc', 'capilar', 'linea_gas'],
  },
  capilar: {
    nombre: 'Capilar de transferencia', en: 'Glass transfer capillary', cat: 'Fuente e interfaz',
    funcion: 'Tubo de vidrio que transfiere los iones desde la presión atmosférica a la primera etapa de vacío.',
    detalles: ['Sus extremos metalizados permiten aplicar las tensiones de entrada y de salida.'],
    specs: [['Material', 'Vidrio con extremos metalizados']],
    une: ['captivespray', 'deflector'],
  },
  deflector: {
    nombre: 'Placa de deflexión (90°)', en: 'Deflection transfer', cat: 'Fuente e interfaz',
    funcion: 'Desvía los iones 90° hacia el embudo de entrada. Las gotas y las moléculas neutras siguen en línea recta y se eliminan, lo que reduce la contaminación de la óptica.',
    detalles: [], specs: [['Deflection Delta', '≈ 70 V']],
    tune: ['Deflection Delta'],
    une: ['capilar', 'embudo_entrada'],
  },
  embudo_entrada: {
    nombre: 'Embudo de iones de entrada', en: 'Entrance ion funnel', cat: 'Fuente e interfaz',
    funcion: 'Embudo electrodinámico de anillos apilados con radiofrecuencia: recoge la nube de iones y la enfoca hacia el túnel TIMS.',
    detalles: [], specs: [['RF', '≈ 320 Vpp'], ['Presión', '≈ 2–3 mbar']],
    tune: ['Funnel 1 RF'],
    une: ['deflector', 'tims'],
  },

  /* ============ TIMS ============ */
  tims: {
    nombre: 'Túnel TIMS doble', en: 'Dual trapped ion mobility spectrometry tunnel', cat: 'Movilidad iónica (TIMS)',
    funcion: 'Separa los iones por su movilidad, es decir, por su tamaño y forma (sección eficaz de colisión). El gas empuja a los iones hacia la salida y un gradiente de campo eléctrico los frena: cada ion queda atrapado donde ambas fuerzas se igualan. Al bajar el campo, eluyen primero los de menor movilidad (1/K₀ alto).',
    detalles: [
      'Dos secciones en serie: mientras la primera acumula iones, la segunda los analiza. Así el ciclo de trabajo es cercano al 100 %.',
      'Electrodos de circuito impreso apilados, con un diámetro interior de 8 mm y una longitud total de unos 96–100 mm. La radiofrecuencia confina los iones en el eje.',
      'Movilidad: K = v_g/E. La movilidad reducida K₀ se expresa como 1/K₀ (V·s/cm²) y se convierte en sección eficaz de colisión (CCS) mediante la ecuación de Mason–Schamp.',
      'Resolución de movilidad típica K/ΔK ≈ 60, que aumenta con rampas más lentas o rangos más estrechos.',
      'El gas del túnel es aire del laboratorio, a unos 2–3 mbar y con una velocidad de 120–150 m/s.',
    ],
    specs: [['Longitud', '≈ 96 mm'], ['Diámetro interior', '8 mm'], ['Rampa típica', '100 ms'], ['Rango de 1/K₀', '0,6–1,6 V·s/cm²'], ['Resolución', 'K/ΔK ≈ 60']],
    tune: ['1/K0 Start', '1/K0 End', 'Ramp Time', 'Accumulation Time', 'Duty Cycle'],
    une: ['embudo_entrada', 'embudo_salida'],
  },

  /* ============ ÓPTICA ============ */
  embudo_salida: {
    nombre: 'Embudo de iones de salida', en: 'Exit ion funnel', cat: 'Óptica iónica',
    funcion: 'Recoge los iones que eluyen del TIMS mientras la presión desciende desde unos 2 mbar hasta alto vacío.',
    detalles: [], specs: [['RF', '≈ 400 Vpp']],
    tune: ['Funnel 2 RF'],
    une: ['tims', 'guia_transferencia'],
  },
  guia_transferencia: {
    nombre: 'Guía de iones de transferencia', en: 'Ion transfer multipole', cat: 'Óptica iónica',
    funcion: 'Transporta los iones hasta el cuadrupolo conservando la separación por movilidad.',
    detalles: [], specs: [['RF', '≈ 400–500 Vpp']],
    tune: ['Multipole RF'],
    une: ['embudo_salida', 'cuadrupolo'],
  },

  /* ============ CUADRUPOLO Y CELDA ============ */
  cuadrupolo: {
    nombre: 'Cuadrupolo', en: 'Quadrupole mass filter', cat: 'Cuadrupolo y celda de colisión',
    funcion: 'Aísla el ion precursor. En el modo PASEF salta de un precursor al siguiente en menos de 1 ms, sincronizado con el instante en que cada uno eluye del TIMS.',
    detalles: [
      'PASEF (Parallel Accumulation–Serial Fragmentation): en una sola rampa de 100 ms se fragmentan sucesivamente unos diez precursores, lo que multiplica por diez la velocidad de secuenciación (más de 100 espectros MS/MS por segundo).',
      'En diaPASEF, las ventanas de aislamiento se escalonan siguiendo la diagonal de la nube de péptidos en el plano m/z–1/K₀.',
    ],
    specs: [['Ventana de aislamiento', '2 Th (< m/z 700) · 3 Th (> m/z 700)'], ['Cambio de masa', '< 1 ms'], ['Límite de selección', '≈ m/z 3000 (aprox.)']],
    tune: ['Isolation Width', 'Ion Energy'],
    une: ['guia_transferencia', 'celda_colision'],
  },
  celda_colision: {
    nombre: 'Celda de colisión', en: 'Collision cell', cat: 'Cuadrupolo y celda de colisión',
    funcion: 'Fragmenta los precursores por colisión con gas (CID). La energía de colisión se ajusta en función de la movilidad del ion.',
    detalles: ['Rampa típica de energía de colisión: de unos 20 eV a 1/K₀ = 0,6 hasta unos 59 eV a 1/K₀ = 1,6.'],
    specs: [['Energía de colisión', '≈ 20–60 eV'], ['RF', '≈ 3000–4000 Vpp (aprox., según método)']],
    tune: ['Collision Energy', 'Collision RF'],
    une: ['cuadrupolo', 'optica_transferencia'],
  },
  optica_transferencia: {
    nombre: 'Óptica de transferencia al TOF', en: 'Pre-TOF transfer optics', cat: 'Cuadrupolo y celda de colisión',
    funcion: 'Almacena brevemente los iones y los focaliza hacia el acelerador ortogonal.',
    detalles: [], specs: [['Transfer time', '≈ 60 µs'], ['Pre-pulse storage', '≈ 10 µs']],
    tune: ['Transfer Time', 'Pre Pulse Storage'],
    une: ['celda_colision', 'pusher'],
  },

  /* ============ TOF ============ */
  pusher: {
    nombre: 'Acelerador ortogonal (pusher)', en: 'Orthogonal accelerator', cat: 'Tiempo de vuelo (TOF)',
    funcion: 'Aplica un pulso de alta tensión que empuja cada paquete de iones perpendicularmente al haz, hacia el tubo de vuelo.',
    detalles: ['Trabaja a unos 10 kHz: registra un espectro completo cada 100 µs aproximadamente, lo que permite seguir la elución por movilidad, que dura milisegundos.'],
    specs: [['Frecuencia', '≈ 10 kHz']],
    une: ['optica_transferencia', 'tubo_tof'],
  },
  tubo_tof: {
    nombre: 'Tubo de vuelo', en: 'Flight tube', cat: 'Tiempo de vuelo (TOF)',
    funcion: 'Región sin campo en la que los iones se separan por su velocidad, que depende de la m/z.',
    detalles: ['Trayectoria en V: del acelerador al reflectrón y de vuelta al detector, alojada en la torre posterior del equipo.'],
    specs: [['Trayectoria', 'V (un reflectrón)'], ['Longitud de vuelo', 'No publicada']],
    une: ['pusher', 'reflectron', 'detector_mcp'],
  },
  reflectron: {
    nombre: 'Reflectrón de dos etapas', en: 'Two-stage reflectron', cat: 'Tiempo de vuelo (TOF)',
    funcion: 'Invierte la trayectoria de los iones y compensa su dispersión de energía para que los de igual m/z lleguen a la vez al detector.',
    detalles: [], specs: [['Etapas', '2']],
    une: ['tubo_tof', 'detector_mcp'],
  },
  detector_mcp: {
    nombre: 'Detector de microcanales', en: 'MCP detector', cat: 'Tiempo de vuelo (TOF)',
    funcion: 'Convierte el impacto de los iones en pulsos eléctricos que registra el digitalizador.',
    detalles: [], specs: [['Tipo', 'Placas de microcanales']],
    une: ['reflectron', 'digitalizador'],
  },
  analizador: {
    nombre: 'Conjunto analizador TIMS-QTOF', en: 'TIMS-QTOF analyzer', cat: 'Tiempo de vuelo (TOF)',
    funcion: 'Separa cada ion en cuatro dimensiones: tiempo de retención, movilidad (1/K₀), m/z e intensidad.',
    detalles: [], specs: [['Resolución TOF', '> 35 000 (Pro) · 60 000 FSR a m/z 1200 (Pro 2)'], ['Exactitud', '< 2 ppm RMS (cal. externa) · < 0,8 ppm (cal. interna), Pro 2'], ['Rango m/z', '20–40 000']],
    une: ['tims', 'cuadrupolo', 'tubo_tof'],
  },

  /* ============ VACÍO ============ */
  camara_vacio: {
    nombre: 'Cámara de vacío', en: 'Vacuum manifold', cat: 'Sistema de vacío',
    funcion: 'Recinto que aloja embudos, TIMS, guías, cuadrupolo y celda de colisión, dividido en etapas de presión decreciente.',
    detalles: ['La región de los embudos y del TIMS trabaja a unos 1–3 mbar; tras el embudo de salida la presión desciende a unos 10⁻⁵ mbar.'],
    specs: [['Región TIMS', '≈ 2–3 mbar'], ['Tras el embudo de salida', '≈ 10⁻⁵ mbar']],
    une: ['bombas_turbo', 'bomba_rotatoria'],
  },
  bombas_turbo: {
    nombre: 'Bombas turbomoleculares', en: 'Turbomolecular pumps', cat: 'Sistema de vacío',
    funcion: 'Mantienen el alto vacío de la zona del cuadrupolo, la celda de colisión y el tubo de vuelo.',
    detalles: ['La configuración exacta de bombas no está publicada; se representa un esquema plausible de bombeo diferencial.'],
    specs: [['TOF', '≈ 10⁻⁷ mbar (aprox.)']],
    une: ['camara_vacio', 'bomba_rotatoria'],
  },
  bomba_rotatoria: {
    nombre: 'Bomba de vacío previo', en: 'Backing pump', cat: 'Sistema de vacío',
    funcion: 'Evacúa la región de los embudos y del TIMS y recoge el escape de las turbomoleculares.',
    detalles: [], specs: [],
    une: ['camara_vacio', 'bombas_turbo'],
  },

  /* ============ ELECTRÓNICA ============ */
  electronica: {
    nombre: 'Electrónica de RF y alta tensión', en: 'RF & HV electronics', cat: 'Electrónica y gases',
    funcion: 'Genera las radiofrecuencias de embudos, TIMS, guías, cuadrupolo y celda, y las tensiones de la fuente y del TOF. Un control en tiempo real sincroniza el cuadrupolo con la elución del TIMS.',
    detalles: [], specs: [['TIMS RF', '≈ 350 Vpp (frecuencia ≈ 1 MHz, aprox.)']],
    une: ['tims', 'cuadrupolo', 'pusher'],
  },
  digitalizador: {
    nombre: 'Digitalizador', en: 'Digitizer', cat: 'Electrónica y gases',
    funcion: 'Convierte la señal del detector en datos digitales a muy alta velocidad.',
    detalles: ['10 bits a 5 GS/s en el timsTOF Pro; 14 bits en el timsTOF HT.'],
    specs: [['Muestreo', '5 GS/s · 10 bits']],
    une: ['detector_mcp'],
  },
  linea_gas: {
    nombre: 'Gases', en: 'Gas supply', cat: 'Electrónica y gases',
    funcion: 'Nitrógeno para el gas de secado de la fuente. El túnel TIMS utiliza aire del laboratorio.',
    detalles: [], specs: [['Gas de secado', 'N₂, 3 L/min']],
    une: ['captivespray', 'tims'],
  },

  /* ============ ESTRUCTURA ============ */
  carcasa: {
    nombre: 'Carcasa', en: 'Covers', cat: 'Estructura y carcasa',
    funcion: 'Paneles laterales y cubierta superior en azul oscuro; frontal en gris claro.',
    detalles: [], specs: [['Dimensiones', 'Mueble de suelo (aprox. 98 × 141 cm de planta)'], ['Peso', '≈ 350 kg (aprox.)']],
    une: ['chasis', 'panel_frontal'],
  },
  panel_frontal: {
    nombre: 'Panel frontal', en: 'Front panel', cat: 'Estructura y carcasa',
    funcion: 'Aloja la fuente de iones a media altura y una repisa a su derecha, junto al rótulo vertical del modelo.',
    detalles: [], specs: [],
    une: ['captivespray', 'carcasa'],
  },
  torre_tof: {
    nombre: 'Torre del TOF', en: 'TOF tower', cat: 'Estructura y carcasa',
    funcion: 'Volumen posterior elevado que aloja el tubo de vuelo vertical y el reflectrón.',
    detalles: [], specs: [],
    une: ['tubo_tof', 'carcasa'],
  },
  chasis: {
    nombre: 'Bastidor', en: 'Frame', cat: 'Estructura y carcasa',
    funcion: 'Estructura del mueble sobre la que se montan el analizador, las bombas y la electrónica.',
    detalles: [], specs: [],
    une: ['carcasa', 'camara_vacio'],
  },
};
