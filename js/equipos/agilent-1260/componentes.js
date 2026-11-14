// Fichas técnicas del Agilent 1260 Infinity II (pila del laboratorio: G7111B + G7129A/C con ICC G7130A + DAD + bandeja de disolventes).
// Fuentes: 1260 Infinity II Quaternary System – Manual and Quick Guide (G7111-90300); 1260 Infinity II Isocratic and Quaternary
// Pumps User Manual; InfinityLab Vialsamplers User Manual (G7129A/B/C, edición Infinity III); DAD WR and MWD User Manual (SD-29000218,
// edición 2024, aplicable a 1260 Infinity II) y páginas de producto de Agilent. El detector del laboratorio no está confirmado: se
// representa el DAD WR G7115A.

export const CATEGORIAS = [
  'Módulos del sistema', 'Suministro de disolvente', 'Bomba de pistones en serie', 'Inyección', 'Separación', 'Detector de diodos', 'Circuito y servicios',
];

export const INFO = {
  /* ---------- módulos (equipo completo) ---------- */
  bandeja: {
    nombre: 'Bandeja de disolventes', en: 'Solvent cabinet', cat: 'Módulos del sistema',
    funcion: 'Bandeja que corona la pila y aloja las botellas de fase móvil, de modo que un derrame queda recogido y no cae sobre los módulos.',
    detalles: [
      'Está pensada para un máximo de 8 L de disolvente en total y de 2 L por botella.',
      'En las fotografías del laboratorio lleva dos botellas de 1 L y, colgados del lateral izquierdo, dos cabezales de botella de repuesto.',
    ],
    specs: [['Capacidad', '≤ 8 L en total, ≤ 2 L por botella']],
    une: ['botellas', 'bomba'],
  },
  botellas: {
    nombre: 'Botellas de fase móvil y líneas de disolvente', en: 'Solvent bottles · solvent lines', cat: 'Módulos del sistema',
    funcion: 'Contienen los disolventes que la bomba aspira. De cada tapón sale una línea de PTFE con un filtro en el extremo sumergido.',
    detalles: [
      'Una de las botellas del laboratorio está rotulada «ACN : Agua 70:30»: una fase móvil premezclada para trabajo isocrático.',
      'La bomba cuaternaria admite hasta cuatro canales (A–D); el laboratorio tiene dos en uso.',
      'Disposición aproximada: las líneas bajan por el lateral izquierdo hasta el desgasificador de la bomba.',
    ],
    specs: [['Canales', 'A, B, C y D (dos en uso)']],
    une: ['bandeja', 'bomba'],
  },
  bomba: {
    nombre: 'Bomba cuaternaria G7111B', en: '1260 Infinity II Quaternary Pump', cat: 'Módulos del sistema',
    funcion: 'Impulsa la fase móvil a caudal constante y forma la composición deseada mezclando hasta cuatro disolventes en el lado de baja presión.',
    detalles: [
      'Bomba de dos pistones en serie con accionamiento servocontrolado de carrera variable; desgasificador de vacío de cuatro canales integrado.',
      'La válvula de gradiente multicanal (MCGV) reparte cada carrera de aspiración entre los canales.',
      'Detrás de la puerta: desgasificador, MCGV, cabezal de bombeo y válvula de purga. Disposición interna aproximada.',
    ],
    specs: [['Presión máxima', '600 bar hasta 5 mL/min; 200 bar hasta 10 mL/min'], ['Caudal', '0,001–10 mL/min (recomendado 0,2–10)'],
      ['Precisión del caudal', '≤ 0,07 % RSD o ≤ 0,02 min DE'], ['Exactitud del caudal', '± 1 % o 10 µL/min'], ['Pulsación', '< 2 % (típica < 1,3 %)'],
      ['Composición', '0–100 % (recomendado 5–95 %); precisión < 0,2 % RSD'], ['Volumen de retardo', '600–900 µL, según la presión'],
      ['Desgasificador', '4 canales, 1,5 mL por canal'], ['Dimensiones (al × an × fo)', '180 × 396 × 436 mm'], ['Peso', '14,5 kg']],
    une: ['botellas', 'muestreador'],
  },
  muestreador: {
    nombre: 'Muestreador automático Vialsampler (G7129A/C)', en: '1260 Infinity II Vialsampler', cat: 'Módulos del sistema',
    funcion: 'Toma un volumen preciso de cada vial y lo introduce en el flujo de fase móvil mediante una válvula de inyección de seis puertos.',
    detalles: [
      'Un brazo con pinza, movido por cuatro motores paso a paso, lleva el vial bajo la aguja; el dosificador aspira la muestra hacia el bucle.',
      'Diseño de flujo continuo: durante el análisis la fase móvil recorre el dosificador, el bucle y la aguja, que quedan lavados.',
      'El G7129A trabaja hasta 600 bar y el G7129C hasta 800 bar; por fuera son iguales, por eso las fotos no permiten distinguirlos.',
    ],
    specs: [['Volumen de inyección', '0,1–100 µL (cabezal de 100 µL); hasta 1800 µL con kit'], ['Precisión', '< 0,25 % RSD del área (5–100 µL)'],
      ['Arrastre', '< 0,004 % con lavado de aguja'], ['Capacidad', '132 viales de 2 mL (dos cajones) o 36 de 6 mL'], ['Ciclo de inyección', '18 s (1 µL)'],
      ['Dimensiones (al × an × fo)', '320 × 396 × 468 mm'], ['Peso', '19 kg sin termostato']],
    une: ['bomba', 'icc'],
  },
  icc: {
    nombre: 'Compartimento de columna integrado (G7130A)', en: 'Integrated Column Compartment (ICC)', cat: 'Módulos del sistema',
    funcion: 'Termostata la columna dentro del propio muestreador, sin un horno de columnas independiente en la pila.',
    detalles: [
      'Se instala en la parte inferior del Vialsampler; una tapa abatible con pestillo da acceso al intercambiador de calor y a las columnas.',
      'En las fotos, bajo las puertas del muestreador hay un panel blanco con un pestillo redondo; se interpreta como la tapa del compartimento (la pila no tiene horno de columnas aparte).',
      'Admite dos columnas de hasta 30 cm; intercambiador de calor de 3 µL o de 6 µL.',
    ],
    specs: [['Temperatura', 'Desde 5 °C sobre la ambiente hasta 80 °C'], ['Estabilidad', '± 0,10 °C'], ['Exactitud', '± 0,8 K (± 0,5 K calibrado)'],
      ['Columnas', '2, de hasta 30 cm'], ['Dimensiones', '86,5 × 396 × 106,5 mm']],
    une: ['muestreador', 'dad'],
  },
  dad: {
    nombre: 'Detector de diodos DAD WR (G7115A)', en: '1260 Infinity II Diode Array Detector WR', cat: 'Módulos del sistema',
    funcion: 'Mide la absorbancia del eluyente en todo el espectro ultravioleta-visible a la vez, hasta 120 veces por segundo.',
    detalles: [
      'Supuesto: el laboratorio no indicó el modelo de detector. El módulo de las fotos es compatible con un DAD WR de 140 mm de altura.',
      'Lámparas de deuterio y de wolframio en un eje común, celda de flujo en cartucho con acceso frontal y espectrógrafo cerámico con 1024 fotodiodos.',
      'Control electrónico de la temperatura de toda la unidad óptica para reducir la deriva de la línea base.',
    ],
    specs: [['Intervalo', '190–950 nm'], ['Detector', '1024 fotodiodos'], ['Rendija', '1, 2, 4, 8 o 16 nm'], ['Velocidad', '120 Hz'],
      ['Ruido', '< ± 0,7·10⁻⁵ UA a 254 y 750 nm'], ['Deriva', '< 0,9·10⁻³ UA/h'], ['Linealidad', '> 2 UA (5 %) a 265 nm'],
      ['Exactitud de λ', '± 1 nm'], ['Dimensiones (al × an × fo)', '140 × 396 × 436 mm'], ['Peso', '12 kg']],
    une: ['icc', 'residuos'],
  },
  capilares: {
    nombre: 'Capilares de la pila', en: 'Capillary connections', cat: 'Módulos del sistema',
    funcion: 'Unen los módulos en el orden del flujo: bomba → válvula de inyección → intercambiador de calor y columna → celda del detector → residuos.',
    detalles: [
      'Los capilares de alta presión son de acero inoxidable; después de la celda la presión es casi nula y basta un tubo de plástico.',
      'Agilent prescribe el orden de la pila para que los capilares sean cortos y el volumen de retardo, mínimo. Recorridos dibujados de forma aproximada.',
    ],
    specs: [], une: ['bomba', 'muestreador', 'dad'],
  },
  residuos: {
    nombre: 'Línea y botella de residuos', en: 'Waste line · waste bottle', cat: 'Módulos del sistema',
    funcion: 'Recoge el eluyente que sale de la celda del detector y el líquido de la purga, del lavado de la aguja y de las bandejas de fugas.',
    detalles: [
      'Los tubos de residuos bajan por un canal en el lado derecho de la pila, para dejar libre el frente.',
      'En el laboratorio se usa una botella de 500 mL con tapón azul; Agilent recomienda un bidón de 6 L con tapón de seguridad.',
    ],
    specs: [], une: ['dad'],
  },
  pc: {
    nombre: 'Ordenador de control', en: 'Control PC · CDS', cat: 'Módulos del sistema',
    funcion: 'Controla los módulos por red local, adquiere las señales del detector y procesa los cromatogramas con el programa de datos cromatográficos.',
    detalles: ['El programa del laboratorio no se ha confirmado; en la pantalla se representa OpenLab CDS, el habitual con estos equipos.'],
    specs: [['Comunicación', 'LAN; los módulos se enlazan entre sí por CAN']], une: ['bomba'],
  },

  /* ---------- circuito de flujo ---------- */
  circuito: {
    nombre: 'Circuito de flujo (esquema)', en: 'Flow path overview', cat: 'Circuito y servicios',
    funcion: 'Vista ampliada y no a escala de lo que recorre la fase móvil, de la botella a la celda, y de lo que recorre la luz en el detector.',
    detalles: ['Las plataformas agrupan los componentes de cada módulo: bomba, muestreador, compartimento de columna y detector.'],
    specs: [], une: ['deposito', 'columna', 'celda'],
  },
  deposito: {
    nombre: 'Botellas A y B con filtros de entrada', en: 'Solvent reservoirs · inlet filters', cat: 'Suministro de disolvente',
    funcion: 'La fase acuosa (A) y el disolvente orgánico (B) se aspiran a través de filtros de acero sinterizado que retienen partículas.',
    detalles: ['En la simulación, A es agua acidificada con ácido fosfórico y B, acetonitrilo, una combinación habitual en fase reversa con detección UV.'],
    specs: [], une: ['desgasificador_vac'],
  },
  desgasificador_vac: {
    nombre: 'Desgasificador de vacío', en: 'Vacuum degasser', cat: 'Suministro de disolvente',
    funcion: 'Elimina el aire disuelto: cada disolvente circula por un tubo de membrana dentro de una cámara en vacío y los gases difunden a través de la pared.',
    detalles: [
      'Sin desgasificar, al mezclar agua y acetonitrilo se forman burbujas que alteran el caudal y dan ruido en el detector.',
      'Cámara de copolímero TFE/PDD; cuatro canales independientes.',
      'Tras un tiempo apagado hay que cebarlo bombeando a 3–5 mL/min.',
    ],
    specs: [['Canales', '4'], ['Volumen interno', '1,5 mL por canal']],
    une: ['deposito', 'mcgv'],
  },
  mcgv: {
    nombre: 'Válvula de gradiente multicanal (MCGV)', en: 'Multi-channel gradient valve', cat: 'Suministro de disolvente',
    funcion: 'Forma la composición de la fase móvil en el lado de baja presión: durante cada carrera de aspiración abre sucesivamente cada canal el tiempo que le corresponde.',
    detalles: [
      'Al 30 % de B, el 70 % de la carrera de aspiración entra por A y el 30 % por B; la mezcla se completa en el cabezal y el amortiguador.',
      'Se recomienda usar los canales inferiores (A y D) para los tampones y enjuagar todos los canales con agua para evitar depósitos de sales.',
    ],
    specs: [['Intervalo recomendado', '5–95 % por canal']],
    une: ['desgasificador_vac', 'valvula_entrada'],
  },
  valvula_entrada: {
    nombre: 'Válvula de entrada pasiva', en: 'Passive inlet valve (PIV)', cat: 'Bomba de pistones en serie',
    funcion: 'Válvula antirretorno de bola: deja entrar el disolvente en la primera cámara cuando el pistón retrocede y se cierra cuando avanza.',
    detalles: [
      'Es la válvula estándar de la G7111B; para tampones concentrados existe como opción una válvula de entrada activa (AIV).',
      'Materiales: acero inoxidable, oro, zafiro, rubí, cerámica y PTFE.',
    ],
    specs: [], une: ['mcgv', 'cabezal'],
  },
  cabezal: {
    nombre: 'Cabezal de bombeo: dos pistones en serie', en: 'Pump head · dual pistons in series', cat: 'Bomba de pistones en serie',
    funcion: 'Dos cámaras con pistones de zafiro. El primero aspira y comprime; el segundo recibe la mitad de lo que entrega el primero y lo impulsa mientras el primero vuelve a llenarse.',
    detalles: [
      'Mientras el pistón 1 avanza, la mitad de su volumen pasa al sistema y la otra mitad llena la cámara 2; durante la aspiración del pistón 1, el pistón 2 entrega el resto. Así el caudal es casi continuo.',
      'La carrera del pistón 1 varía de 20 a 100 µL según el caudal: carreras cortas dan menos pulsación.',
      'La compensación de la compresibilidad añade a cada carrera el volumen que se pierde al comprimir el disolvente hasta la presión de trabajo.',
    ],
    specs: [['Pistones', 'Zafiro'], ['Juntas', 'PTFE'], ['Carrera del pistón 1', '20–100 µL']],
    une: ['valvula_entrada', 'valvula_salida', 'accionamiento'],
  },
  accionamiento: {
    nombre: 'Accionamiento de los pistones', en: 'Servo drive · ball screws', cat: 'Bomba de pistones en serie',
    funcion: 'Un motor de reluctancia variable servocontrolado mueve dos husillos de bolas en sentidos opuestos.',
    detalles: ['Los engranajes de los husillos tienen una relación 2:1: el primer pistón se mueve al doble de velocidad que el segundo.'],
    specs: [['Relación de engranajes', '2 : 1']],
    une: ['cabezal'],
  },
  valvula_salida: {
    nombre: 'Válvula de salida', en: 'Outlet valve', cat: 'Bomba de pistones en serie',
    funcion: 'Válvula de bola a la salida de la primera cámara: se abre cuando el pistón 1 impulsa y se cierra cuando aspira, para que el líquido no retroceda.',
    detalles: ['Materiales: acero inoxidable, oro, rubí, cerámica de óxido de circonio y tántalo.'],
    specs: [], une: ['cabezal', 'amortiguador'],
  },
  amortiguador: {
    nombre: 'Amortiguador', en: 'Damping unit', cat: 'Bomba de pistones en serie',
    funcion: 'Volumen elástico entre las dos cámaras que suaviza las pulsaciones de presión que quedan tras el bombeo.',
    detalles: [], specs: [], une: ['valvula_salida', 'cabezal'],
  },
  valvula_purga: {
    nombre: 'Válvula de purga', en: 'Purge valve', cat: 'Bomba de pistones en serie',
    funcion: 'A la salida de la bomba. Abierta, envía el flujo a residuos para cebar el cabezal o cambiar de disolvente sin pasar por la columna.',
    detalles: ['Incluye una frita de PTFE que retiene las partículas de desgaste de las juntas.'],
    specs: [], une: ['cabezal', 'valvula_iny'],
  },
  valvula_iny: {
    nombre: 'Válvula de inyección de 2 posiciones y 6 puertos', en: '2-position/6-port injection valve', cat: 'Inyección',
    funcion: 'En «mainpass» la fase móvil pasa por el dosificador, el bucle y la aguja antes de ir a la columna; en «bypass» va directa a la columna mientras se carga la muestra.',
    detalles: [
      'Puerto 1: bomba; puerto 6: columna; puerto 4: residuos. El rotor tiene tres ranuras: en «mainpass» unen 1-2, 3-4 y 5-6; al girar 60° pasan a 6-1, 2-3 y 4-5.',
      'Secuencia: bypass → la pinza lleva el vial → la aguja baja y el dosificador aspira → lavado exterior de la aguja → la aguja vuelve al asiento → mainpass: la muestra entra en la columna.',
      'Puede programarse para volver a «bypass» tras la inyección y reducir así el volumen de retardo del gradiente.',
    ],
    specs: [['Presión', '600 bar (G7129A) · 800 bar (G7129C)'], ['Accionamiento', 'Motor paso a paso híbrido']],
    une: ['valvula_purga', 'dosificador', 'aguja', 'intercambiador'],
  },
  dosificador: {
    nombre: 'Dosificador (cabezal analítico)', en: 'Metering device · analytical head', cat: 'Inyección',
    funcion: 'Jeringa de pistón que aspira el volumen exacto de muestra hacia el bucle a través de la aguja.',
    detalles: ['Después de aspirar, toma una burbuja de aire de 0,7 µL en la punta de la aguja para no perder muestra durante el lavado.'],
    specs: [['Cabezal estándar', '100 µL (opcional 900 µL, hasta 400 bar)']],
    une: ['valvula_iny', 'aguja'],
  },
  aguja: {
    nombre: 'Aguja, asiento y vial', en: 'Needle · needle seat · vial', cat: 'Inyección',
    funcion: 'La aguja baja al vial para aspirar y después se apoya en el asiento, que la une a presión con la válvula de inyección.',
    detalles: ['El exterior de la aguja se lava en el puerto de lavado con un chorro de disolvente; el arrastre queda por debajo de 0,004 %.'],
    specs: [['Viales', '2 mL (132 posiciones) o 6 mL (36)']],
    une: ['dosificador', 'valvula_iny'],
  },
  intercambiador: {
    nombre: 'Intercambiador de calor', en: 'Heat exchanger (ICC)', cat: 'Separación',
    funcion: 'Bloque calefactado que lleva la fase móvil a la temperatura de la columna antes de entrar en ella, para evitar gradientes radiales de temperatura.',
    detalles: ['Versiones de 3 µL y 6 µL de volumen interno.'],
    specs: [['Temperatura', 'Hasta 80 °C']], une: ['valvula_iny', 'columna'],
  },
  columna: {
    nombre: 'Columna de fase reversa C18', en: 'Reversed-phase C18 column', cat: 'Separación',
    funcion: 'Tubo relleno de partículas de sílice con cadenas C18. Los compuestos se reparten entre la fase móvil polar y la fase estacionaria apolar; cuanto menos polares, más tarde salen.',
    detalles: [
      'Se supone una columna de 150 × 4,6 mm y 5 µm, típica para este equipo; la del laboratorio no está identificada.',
      'Partículas más pequeñas dan picos más estrechos, pero la presión crece con 1/dp²: por eso la bomba admite hasta 600 bar.',
      'Al subir la temperatura baja la viscosidad (menos presión) y los compuestos se retienen menos.',
    ],
    specs: [['Dimensiones supuestas', '150 × 4,6 mm, 5 µm'], ['Fase estacionaria', 'Octadecilsilano (C18)']],
    une: ['intercambiador', 'celda'],
  },
  lampara_d2: {
    nombre: 'Lámpara de deuterio', en: 'Deuterium lamp', cat: 'Detector de diodos',
    funcion: 'Lámpara de arco en deuterio a baja presión que emite el continuo ultravioleta, de 190 nm a unos 800 nm.',
    detalles: ['Tiene una abertura de paso («shine-through»): la luz de la lámpara de wolframio, situada detrás, la atraviesa y ambas salen por el mismo eje.',
      'Lleva una etiqueta RFID que registra sus horas de uso.'],
    specs: [['Emisión', '190 – ≈ 800 nm']], une: ['lampara_w', 'acromatico'],
  },
  lampara_w: {
    nombre: 'Lámpara de wolframio', en: 'Tungsten lamp', cat: 'Detector de diodos',
    funcion: 'Lámpara incandescente de bajo ruido que cubre el visible y el infrarrojo cercano de onda corta.',
    detalles: ['La imagen de su filamento se enfoca sobre la abertura de la lámpara de deuterio.'],
    specs: [['Emisión', '470–950 nm']], une: ['lampara_d2'],
  },
  acromatico: {
    nombre: 'Acromático (lente de la fuente)', en: 'Achromat · source lens', cat: 'Detector de diodos',
    funcion: 'Recoge la luz de las dos lámparas y la concentra en un haz que atraviesa la celda de flujo.',
    detalles: ['Es acromático para enfocar igual el ultravioleta y el visible.'], specs: [], une: ['lampara_d2', 'filtro_holmio'],
  },
  filtro_holmio: {
    nombre: 'Filtro de óxido de holmio', en: 'Holmium oxide filter', cat: 'Detector de diodos',
    funcion: 'Patrón de longitud de onda integrado. Un mecanismo lo interpone en el haz durante la prueba de holmio para comprobar la exactitud del eje de longitudes de onda.',
    detalles: ['El calibrado propio del detector usa las líneas de emisión del deuterio; el holmio sirve de verificación independiente.'],
    specs: [['Exactitud de λ', '± 1 nm']], une: ['acromatico', 'celda'],
  },
  celda: {
    nombre: 'Celda de flujo', en: 'Flow cell', cat: 'Detector de diodos',
    funcion: 'Canal con ventanas de cuarzo por el que circula el eluyente; la luz lo recorre a lo largo y cada compuesto absorbe según la ley de Lambert-Beer, A = ε·b·c.',
    detalles: ['Cartucho con etiqueta RFID y montaje rápido. Además de la estándar hay celdas semimicro, micro, nano, de alta presión y preparativas.'],
    specs: [['Celda estándar', '13 µL, 10 mm, 120 bar'], ['Semimicro', '5 µL, 6 mm'], ['Micro', '2 µL, 3 mm']],
    une: ['columna', 'lente_espectro'],
  },
  lente_espectro: {
    nombre: 'Lente del espectrógrafo', en: 'Spectrograph lens', cat: 'Detector de diodos',
    funcion: 'Vuelve a enfocar la luz que sale de la celda sobre la rendija de entrada del espectrógrafo.',
    detalles: ['El espectrógrafo es de cerámica para reducir al mínimo los efectos térmicos.'], specs: [], une: ['celda', 'rendija'],
  },
  rendija: {
    nombre: 'Rendija programable', en: 'Programmable micro-slit', cat: 'Detector de diodos',
    funcion: 'Rendija de silicio micromecanizado que hace también de obturador. Su anchura se elige en el método.',
    detalles: ['Estrecha: mejor resolución espectral (1 nm). Ancha: más luz y menos ruido, a costa de ensanchar las bandas del espectro (16 nm).'],
    specs: [['Anchuras', '1, 2, 4, 8 y 16 nm']], une: ['lente_espectro', 'red'],
  },
  red: {
    nombre: 'Red holográfica cóncava', en: 'Concave holographic grating', cat: 'Detector de diodos',
    funcion: 'Dispersa la luz en sus longitudes de onda y, por ser cóncava, forma a la vez la imagen del espectro sobre la matriz de diodos.',
    detalles: ['A diferencia de un monocromador de barrido, la red está fija: todas las longitudes de onda llegan a la vez a la matriz.'],
    specs: [], une: ['rendija', 'matriz'],
  },
  matriz: {
    nombre: 'Matriz de fotodiodos', en: 'Photodiode array', cat: 'Detector de diodos',
    funcion: 'Fila de 1024 fotodiodos sobre un soporte cerámico: cada uno mide la intensidad de una franja de unos 0,8–1 nm del espectro.',
    detalles: [
      'Se registra el espectro completo en cada lectura, hasta 120 por segundo: permite comprobar la pureza de los picos e identificarlos por su espectro.',
      'Cada espectrógrafo se calibra individualmente y guarda los datos en su propia memoria (EEPROM).',
    ],
    specs: [['Diodos', '1024'], ['Intervalo', '190–950 nm'], ['Agrupación', '1–400 nm, en pasos de 1 nm'], ['Señales simultáneas', '8']],
    une: ['red'],
  },
  c_residuo: {
    nombre: 'Salida a residuos', en: 'Waste', cat: 'Circuito y servicios',
    funcion: 'El eluyente que sale de la celda, ya analizado, va a la botella de residuos.',
    detalles: [], specs: [], une: ['celda'],
  },
};
