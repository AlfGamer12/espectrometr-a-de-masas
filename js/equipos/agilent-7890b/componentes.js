// Fichas técnicas de los componentes del Agilent 7890B GC con inyector automático 7693A, inyector split/splitless y FID.
// Datos según la documentación pública de Agilent (hoja de especificaciones del 7890B, artículos técnicos del portal de GC,
// especificaciones del 7693A) y bibliografía general de cromatografía de gases. Cuando el fabricante no publica un dato
// (dimensiones internas, disposición), se indica que es aproximado.

export const CATEGORIAS = [
  'Inyector automático 7693A', 'Inyector split/splitless', 'Horno y columna', 'Detector FID',
  'Neumática y gases', 'Electrónica y control', 'Estructura y carcasa', 'Instalación del laboratorio',
];

export const INFO = {
  /* ============ INYECTOR AUTOMÁTICO 7693A ============ */
  als_torre: {
    nombre: 'Torre de inyección 7693A', en: 'G4513A injector tower · 7693A ALS', cat: 'Inyector automático 7693A',
    funcion: 'Toma la muestra del vial con una microjeringa y la inyecta en el inyector del cromatógrafo siempre con la misma secuencia de lavado, llenado, inyección y velocidad, lo que hace reproducible el volumen inyectado.',
    detalles: [
      'Se monta sobre el GC, encima del inyector. Dentro de la carcasa están el carro de la jeringa, el émbolo motorizado y el pie de apoyo de la aguja.',
      'La puerta frontal tintada permite ver la jeringa. Los pilotos indican el estado del inyector.',
      'Con la torreta propia admite 16 viales de muestra; con la bandeja G4514A, 150.',
      'Un cable lo conecta a la trasera del GC, que gestiona la secuencia y comunica el inicio de cada análisis.',
    ],
    specs: [['Capacidad', '16 viales (torreta) · 150 con bandeja'], ['Jeringas', '1 a 100 µL con el carro estándar'], ['Volumen inyectado', '1–50 % del volumen de la jeringa'], ['Viales', '2 mL estándar, con inserto o sin cuello']],
    une: ['als_torreta', 'als_jeringa', 'als_carro', 'tuerca_septum', 'tapa_inyectores'],
  },
  als_torreta: {
    nombre: 'Torreta de viales', en: 'Sample turret', cat: 'Inyector automático 7693A',
    funcion: 'Lleva los viales de muestra y los frascos de disolvente de lavado y residuos, y gira para colocar cada uno bajo la aguja.',
    detalles: [
      'Los viales de muestra van en el anillo exterior. En el interior están los frascos de disolvente con los que se lava la jeringa antes y después de cada inyección, y los de residuos.',
      'Para inyectar, la torreta gira hasta dejar bajo la aguja el hueco libre, de modo que la aguja baja directamente hasta el septum del inyector.',
      'Los viales se cierran con cápsulas de septum perforable; el contenido no debe superar el nivel que permite a la aguja tomar muestra sin tocar el fondo.',
    ],
    specs: [['Posiciones de muestra', '16'], ['Viales', '2 mL']],
    une: ['als_torre', 'als_jeringa'],
  },
  als_jeringa: {
    nombre: 'Microjeringa', en: 'Syringe (10 µL typical)', cat: 'Inyector automático 7693A',
    funcion: 'Mide el volumen de muestra (típicamente 1 µL) y lo deposita en el inyector atravesando el septum.',
    detalles: [
      'Cilindro de vidrio graduado, émbolo metálico y aguja de acero. La jeringa de 10 µL es la más habitual en inyección split/splitless.',
      'Antes de tomar la muestra se lava con disolvente y se purga con la propia muestra varias veces; después de inyectar se vuelve a lavar.',
      'El 7693A bombea varias veces el émbolo dentro del vial para eliminar burbujas, que son la principal causa de mala repetibilidad.',
      'La inyección rápida reduce la discriminación por volatilidad dentro de la aguja caliente.',
    ],
    specs: [['Volumen habitual', '10 µL (se inyecta 1 µL)'], ['Material', 'Vidrio y acero inoxidable']],
    une: ['als_carro', 'als_guia', 'als_torreta', 'septum'],
  },
  als_carro: {
    nombre: 'Carro de la jeringa y émbolo', en: 'Syringe carriage · plunger carrier', cat: 'Inyector automático 7693A',
    funcion: 'Sube y baja la jeringa y mueve el émbolo con motores paso a paso, de forma que la aspiración, la inyección y el lavado se repiten siempre igual.',
    detalles: [
      'Un husillo vertical desplaza el carro; el portaémbolo, independiente, empuja o tira del émbolo.',
      'La velocidad de inyección y los tiempos de espera antes y después de inyectar se programan en el método.',
    ],
    specs: [['Accionamiento', 'Motores paso a paso'], ['Programable', 'Velocidad del émbolo, esperas, bombeos, lavados']],
    une: ['als_jeringa', 'als_guia', 'als_torre'],
  },
  als_guia: {
    nombre: 'Pie de apoyo de la aguja', en: 'Needle support foot', cat: 'Inyector automático 7693A',
    funcion: 'Guía la aguja en su extremo para que no se doble y se apoya sobre el vial o sobre la tuerca del septum mientras la aguja penetra.',
    detalles: ['Es la pieza que con más frecuencia se ajusta al cambiar de jeringa: la aguja debe deslizar libremente por su orificio.'],
    une: ['als_jeringa', 'tuerca_septum'],
  },

  /* ============ INYECTOR SPLIT/SPLITLESS ============ */
  tuerca_septum: {
    nombre: 'Tuerca del septum', en: 'Septum retainer nut', cat: 'Inyector split/splitless',
    funcion: 'Sujeta el septum sobre la cabeza del inyector y deja un orificio central por el que entra la aguja.',
    detalles: ['Se aprieta a mano; un apriete excesivo deforma el septum y favorece que se desprendan partículas al liner.'],
    une: ['septum', 'inyector_cabeza', 'als_guia'],
  },
  septum: {
    nombre: 'Septum', en: 'Inlet septum', cat: 'Inyector split/splitless',
    funcion: 'Disco de silicona que cierra el inyector y se vuelve a sellar tras cada pinchazo de la aguja.',
    detalles: [
      'Su cara inferior está barrida por la purga del septum, un pequeño caudal de portador (habitualmente 3 mL/min) que arrastra fuera los compuestos que desprende la silicona caliente y evita picos fantasma.',
      'Se cambia periódicamente: con el uso se forman fugas y fragmentos que pasan al liner.',
    ],
    specs: [['Purga del septum', '≈ 3 mL/min (habitual)'], ['Material', 'Silicona de bajo sangrado']],
    une: ['tuerca_septum', 'inyector_cabeza', 'epc_inyector'],
  },
  inyector_cabeza: {
    nombre: 'Cabeza del inyector', en: 'Inlet insert weldment', cat: 'Inyector split/splitless',
    funcion: 'Parte superior del inyector: recibe el gas portador y tiene las salidas de la purga del septum y del venteo de split.',
    detalles: [
      'El portador entra por arriba y baja por el exterior y el interior del liner hacia la columna.',
      'En modo split, una válvula del módulo EPC deja salir por el venteo la mayor parte del gas y del vapor de la muestra; solo una fracción entra en la columna.',
      'Se retira para cambiar el liner; la junta tórica del liner sella contra ella.',
    ],
    une: ['septum', 'liner', 'epc_inyector', 'trampa_split', 'lineas_neumaticas'],
  },
  liner: {
    nombre: 'Liner', en: 'Inlet liner (deactivated glass)', cat: 'Inyector split/splitless',
    funcion: 'Tubo de vidrio desactivado dentro del inyector caliente donde se vaporiza la muestra antes de pasar a la columna.',
    detalles: [
      'La muestra se convierte en vapor en milisegundos: 1 µL de disolvente ocupa varios cientos de microlitros de gas, así que el volumen del liner debe bastar para contener la nube sin que retroceda hacia las líneas.',
      'La lana de vidrio desactivada favorece la vaporización, retiene residuos no volátiles y fragmentos del septum.',
      'Una junta tórica en la parte superior obliga al gas a pasar por el interior del liner.',
      'Los liners para split/splitless de Agilent miden 78,5 mm de largo y 6,5 mm de diámetro exterior; el diámetro interno y la geometría (cono, lana) se eligen según el modo de inyección.',
      'Es un consumible: los residuos y la pérdida de desactivación producen colas, pérdida de respuesta de compuestos polares y descomposición térmica.',
    ],
    specs: [['Dimensiones', '78,5 mm × 6,5 mm d.e.'], ['Material', 'Vidrio borosilicato desactivado'], ['Temperatura habitual', '250–280 °C (inyector)']],
    une: ['inyector_cabeza', 'inyector_bloque', 'inyector_base', 'columna'],
  },
  inyector_bloque: {
    nombre: 'Cuerpo y bloque calefactado del inyector', en: 'S/SL inlet body · heater block', cat: 'Inyector split/splitless',
    funcion: 'Mantiene el liner a temperatura constante (habitualmente 250–280 °C) para vaporizar la muestra de forma rápida y completa.',
    detalles: [
      'Bloque de aluminio con un cartucho calefactor y un sensor de temperatura, rodeado de aislamiento térmico.',
      'Modo split: la relación de división (caudal de venteo / caudal de columna) suele estar entre 10:1 y 100:1 para muestras concentradas; produce bandas iniciales muy estrechas.',
      'Modo splitless: la válvula de split permanece cerrada durante el tiempo de purga (típicamente 0,5–1 min) y casi toda la muestra pasa a la columna; después se abre para barrer el disolvente residual. Se usa para trazas.',
      'En splitless, el horno empieza por debajo del punto de ebullición del disolvente: los analitos se reconcentran en la cabeza de la columna (efecto disolvente y atrapamiento en frío).',
    ],
    specs: [['Temperatura máxima', '400 °C'], ['Presión', '0–100 psi'], ['Relación de split', 'Hasta 7500:1'], ['Caudal total', 'Hasta 1250 mL/min (He, H₂); 200 mL/min (N₂)']],
    une: ['liner', 'inyector_base', 'epc_inyector', 'electronica'],
  },
  inyector_base: {
    nombre: 'Sello de oro y tuerca de la columna', en: 'Gold seal · reducing nut', cat: 'Inyector split/splitless',
    funcion: 'Cierra el fondo del inyector y fija el extremo de entrada de la columna dentro del horno.',
    detalles: [
      'El sello, de acero chapado en oro, es la superficie que ve la muestra al fondo del liner; se cambia si se contamina.',
      'La columna entra con una férula de grafito o de grafito/Vespel y debe sobresalir una distancia definida por encima de la férula para que su extremo quede en la zona correcta del liner.',
    ],
    une: ['inyector_bloque', 'columna', 'horno'],
  },

  /* ============ HORNO Y COLUMNA ============ */
  columna: {
    nombre: 'Columna capilar', en: 'Fused-silica capillary column', cat: 'Horno y columna',
    funcion: 'Separa los componentes de la mezcla: cada uno se reparte entre el gas portador y la película de fase estacionaria y avanza a una velocidad u/(1 + k), donde k es su factor de retención.',
    detalles: [
      'Tubo de sílice fundida con recubrimiento exterior de poliimida (color ámbar). La fase estacionaria es una película inmovilizada en la pared interna.',
      'Una configuración muy habitual es 30 m × 0,25 mm d.i. × 0,25 µm de fase 100 % dimetilpolisiloxano o 5 % fenil-metilpolisiloxano.',
      'k aumenta exponencialmente al bajar la temperatura y, en una serie homóloga, en un factor casi constante por cada CH₂: por eso los n-alcanos sirven de referencia para los índices de retención de Kovats.',
      'Una columna más larga aumenta el número de platos (la resolución crece con √L) a costa de más tiempo; un diámetro menor da más eficiencia; una película más gruesa retiene más los volátiles pero ensancha los picos.',
      'Por encima de su temperatura máxima la fase se degrada y aumenta el sangrado, que se ve como una subida de la línea de base.',
    ],
    specs: [['Ejemplo', '30 m × 0,25 mm × 0,25 µm'], ['Material', 'Sílice fundida + poliimida'], ['Fase', 'Polisiloxanos (según aplicación)']],
    une: ['inyector_base', 'fid_base', 'jaula_columna', 'horno'],
  },
  jaula_columna: {
    nombre: 'Jaula de la columna', en: 'Column cage · hanger', cat: 'Horno y columna',
    funcion: 'Soporta la bobina de columna en el centro del horno, donde la circulación de aire caliente es más homogénea.',
    detalles: ['Se cuelga de un soporte en la pared del horno. Los extremos de la columna salen de la bobina hacia el inyector y el detector sin tocar las paredes.'],
    une: ['columna', 'horno'],
  },
  horno: {
    nombre: 'Horno de columna', en: 'Column oven', cat: 'Horno y columna',
    funcion: 'Cámara aislada de aire forzado que mantiene la columna a una temperatura uniforme y la cambia según el programa del método.',
    detalles: [
      'Se programa desde unos grados por encima de la temperatura ambiente hasta 450 °C, con hasta 20 rampas y 21 mesetas.',
      'Programar la temperatura resuelve el «problema general de la elución»: los compuestos volátiles se separan a baja temperatura y los menos volátiles salen después en un tiempo razonable y como picos estrechos.',
      'Para enfriar, unas trampillas en la parte trasera dejan entrar aire del laboratorio y expulsan el caliente.',
      'La disposición interior del modelo (dimensiones de la cámara y posición de los pasos) es aproximada.',
    ],
    specs: [['Intervalo', 'Ambiente + 4 °C a 450 °C'], ['Programa', '20 rampas / 21 mesetas'], ['Velocidad máxima', '120 °C/min (alimentación de 240 V); 75 °C/min (120 V)']],
    une: ['ventilador_horno', 'calefactor_horno', 'columna', 'puerta_horno'],
  },
  ventilador_horno: {
    nombre: 'Ventilador del horno', en: 'Oven fan · motor', cat: 'Horno y columna',
    funcion: 'Hace circular el aire de la cámara a gran velocidad sobre la resistencia y alrededor de la columna, de modo que toda la columna está a la misma temperatura.',
    detalles: ['El motor queda fuera de la cámara, detrás de la pared trasera; solo el rodete y el eje están en el interior.'],
    une: ['horno', 'calefactor_horno'],
  },
  calefactor_horno: {
    nombre: 'Resistencia del horno', en: 'Oven heater coil', cat: 'Horno y columna',
    funcion: 'Calienta el aire que mueve el ventilador. Su potencia se regula en lazo cerrado con un sensor de temperatura para seguir la consigna y las rampas.',
    detalles: ['La velocidad máxima de calentamiento depende de la tensión de red: las configuraciones de 240 V permiten rampas más rápidas que las de 120 V.'],
    une: ['ventilador_horno', 'horno', 'electronica'],
  },

  /* ============ DETECTOR FID ============ */
  fid_base: {
    nombre: 'Base y bloque calefactado del FID', en: 'FID base weldment · heated block', cat: 'Detector FID',
    funcion: 'Recibe el extremo de la columna y los gases del detector y los conduce al chorro, todo a una temperatura superior a la del horno para que nada condense.',
    detalles: [
      'El gas auxiliar (make-up) se une al hidrógeno y ambos se mezclan con el efluente de la columna antes de salir por el chorro; el aire entra por la base del colector.',
      'Agilent recomienda trabajar a 300 °C o más y al menos 20 °C por encima de la temperatura máxima del horno; por debajo de 150 °C el equipo no intenta encender la llama.',
    ],
    specs: [['Temperatura de trabajo', '≥ 300 °C (recomendado)'], ['Encendido', 'Solo por encima de 150 °C']],
    une: ['columna', 'fid_chorro', 'epc_detector', 'lineas_neumaticas'],
  },
  fid_chorro: {
    nombre: 'Chorro (jet)', en: 'FID jet', cat: 'Detector FID',
    funcion: 'Boquilla por la que sale la mezcla de columna, hidrógeno y gas auxiliar; en su punta arde la llama de hidrógeno en aire.',
    detalles: [
      'Hay chorros específicos para columnas capilares y para columnas empaquetadas.',
      'Un chorro parcialmente obstruido reduce los caudales reales y hace que la llama se apague tras el pico del disolvente; se comprueba con una prueba de restricción.',
      'La columna se instala 1–2 mm por debajo de la punta interna: si entra demasiado puede obstruir el chorro.',
    ],
    une: ['fid_base', 'fid_colector', 'fid_ignitor'],
  },
  fid_colector: {
    nombre: 'Colector polarizado y aislantes', en: 'Collector · insulators', cat: 'Detector FID',
    funcion: 'Electrodo cilíndrico situado sobre la llama que recoge los iones formados en ella. Entre chorro y colector hay una tensión de polarización, y la corriente iónica resultante (picoamperios) es la señal.',
    detalles: [
      'En la llama, los fragmentos CH de cada átomo de carbono reaccionan con oxígeno: CH + O → CHO⁺ + e⁻ (quimioionización). Solo una pequeña fracción de los átomos de carbono, del orden de uno por cada cien mil, produce un ion.',
      'La corriente es proporcional al caudal másico de carbono que llega a la llama: el FID es un detector sensible a la masa y su respuesta molar crece con el número de átomos de carbono.',
      'Los carbonos unidos a oxígeno, nitrógeno o halógenos responden menos (número efectivo de carbonos). Agua, CO₂, CO, N₂, O₂ y los gases nobles prácticamente no dan señal, por eso no se ven el aire ni el agua de la muestra.',
      'Los aislantes de PTFE y cerámica separan el colector de masa: una fuga a masa da señales muy altas incluso con la llama apagada.',
    ],
    specs: [['Límite de detección', '< 1,4 pg C/s (tridecano)'], ['Rango lineal', '> 10⁷ (± 10 %)'], ['Velocidad de datos', 'Hasta 500 Hz'], ['Fondo normal', '≈ 5–20 pA']],
    une: ['fid_chorro', 'electrometro', 'fid_castillo'],
  },
  fid_castillo: {
    nombre: 'Cuerpo y chimenea del FID', en: 'FID castle · chimney', cat: 'Detector FID',
    funcion: 'Envuelve la llama y el colector; los gases de combustión (sobre todo vapor de agua) salen por la chimenea a través de la tapa superior.',
    detalles: ['Se desmonta para limpiar o cambiar el colector y el chorro. El agua formada en la llama es la razón de mantener el detector caliente.'],
    une: ['fid_colector', 'fid_ignitor', 'tapa_superior'],
  },
  fid_ignitor: {
    nombre: 'Encendedor (bujía incandescente)', en: 'Glow-plug ignitor', cat: 'Detector FID',
    funcion: 'Filamento que se pone incandescente durante la secuencia de encendido para prender la mezcla de hidrógeno y aire.',
    detalles: [
      'Si la señal cae por debajo del umbral de llama encendida (2,0 pA por defecto), el GC considera que la llama se ha apagado e intenta encenderla de nuevo.',
      'Durante el encendido se aumenta el caudal de hidrógeno; si el filamento no brilla o brilla débilmente hay que sustituirlo.',
    ],
    specs: [['Umbral de llama encendida', '2,0 pA (por defecto)']],
    une: ['fid_castillo', 'fid_chorro', 'electronica'],
  },
  electrometro: {
    nombre: 'Electrómetro', en: 'FID electrometer', cat: 'Detector FID',
    funcion: 'Amplificador de corriente que convierte la corriente del colector, de picoamperios a nanoamperios, en una señal digital.',
    detalles: [
      'Está apantallado y muy cerca del detector para minimizar el ruido. La señal se digitaliza y se envía al sistema de datos.',
      'Su rango lineal de más de siete órdenes de magnitud permite cuantificar desde trazas hasta componentes mayoritarios en el mismo cromatograma.',
    ],
    specs: [['Entrada', 'Corriente del colector (pA–nA)'], ['Velocidad de datos', 'Hasta 500 Hz']],
    une: ['fid_colector', 'electronica'],
  },

  /* ============ NEUMÁTICA Y GASES ============ */
  epc_inyector: {
    nombre: 'Módulo EPC del inyector', en: 'Inlet EPC module (S/SL)', cat: 'Neumática y gases',
    funcion: 'Control electrónico de la neumática: regula la presión en cabeza de columna, el caudal total que entra en el inyector y el de la purga del septum mediante válvulas proporcionales y sensores de presión y caudal.',
    detalles: [
      'Conociendo las dimensiones de la columna y la viscosidad del gas, el GC calcula la presión necesaria para un caudal o una velocidad lineal dados (modos de presión constante o de caudal constante).',
      'En caudal constante, la presión aumenta durante la rampa del horno para compensar el aumento de viscosidad del gas con la temperatura.',
      'La relación de split se fija regulando el caudal que sale por el venteo de split.',
      'El modo «ahorro de gas» reduce el caudal de split cuando la muestra ya está en la columna.',
    ],
    specs: [['Resolución de la consigna de presión', '0,001 psi'], ['Modos', 'Presión o caudal constantes, programados']],
    une: ['inyector_cabeza', 'trampa_split', 'lineas_gas', 'lineas_neumaticas'],
  },
  epc_detector: {
    nombre: 'Módulo EPC del FID', en: 'Detector EPC module (FID)', cat: 'Neumática y gases',
    funcion: 'Suministra al FID caudales estables de hidrógeno, aire y gas auxiliar, fijados por presión sobre restrictores calibrados.',
    detalles: [
      'Caudales por defecto según Agilent: hidrógeno 30 mL/min, aire 400 mL/min y gas auxiliar 25 mL/min; el hidrógeno debe estar entre el 8 y el 12 % del aire.',
      'El gas auxiliar (N₂ o He, configurable) completa el caudal que llega al chorro, porque una columna capilar aporta solo 1–2 mL/min.',
      'El nitrógeno del laboratorio se usa aquí como gas auxiliar.',
    ],
    specs: [['H₂', '30 mL/min'], ['Aire', '400 mL/min'], ['Auxiliar (N₂)', '25 mL/min']],
    une: ['fid_base', 'lineas_gas', 'lineas_neumaticas'],
  },
  trampa_split: {
    nombre: 'Trampa del venteo de split', en: 'Split vent trap', cat: 'Neumática y gases',
    funcion: 'Cartucho de carbón activo que retiene los compuestos orgánicos de la muestra que salen por el venteo de split antes de llegar a la válvula del EPC y al laboratorio.',
    detalles: ['Se sustituye periódicamente; si se satura, los compuestos pueden condensar en la línea y volver al inyector.'],
    une: ['inyector_cabeza', 'epc_inyector'],
  },
  lineas_neumaticas: {
    nombre: 'Líneas neumáticas internas', en: 'Internal pneumatic tubing', cat: 'Neumática y gases',
    funcion: 'Tubos de acero que llevan el portador al inyector, las salidas de purga y de split al módulo EPC, y el hidrógeno, el aire y el gas auxiliar al FID.',
    une: ['epc_inyector', 'epc_detector', 'inyector_cabeza', 'fid_base'],
  },
  lineas_gas: {
    nombre: 'Líneas de gas del laboratorio', en: 'Copper gas lines · bulkheads', cat: 'Neumática y gases',
    funcion: 'Tubos de cobre que conducen cada gas desde su regulador, a través de su filtro, hasta los pasamuros de la trasera del GC.',
    detalles: [
      'Agilent indica una presión de suministro en torno a 80 psi en la trasera del GC para los gases del FID.',
      'Se usan tubos de cobre o acero limpios para cromatografía; los tubos de plástico dejan pasar oxígeno y humedad.',
      'Pureza recomendada para portador y gases del detector: 99,9995 % o superior; aire de calidad «cero» (sin hidrocarburos).',
    ],
    specs: [['Presión de suministro', '≈ 80 psi (FID)'], ['Pureza', '≥ 99,9995 %']],
    une: ['panel_gases', 'filtros_gas', 'epc_inyector', 'epc_detector'],
  },

  /* ============ ELECTRÓNICA Y CONTROL ============ */
  teclado: {
    nombre: 'Teclado y pantalla', en: 'Keypad · VFD display', cat: 'Electrónica y control',
    funcion: 'Permite editar y vigilar el método en el propio equipo: temperaturas, caudales, programa del horno, encendido de la llama y estado de cada módulo.',
    detalles: [
      'La pantalla muestra en columnas el valor real («Actual») y la consigna («Setpoint»).',
      'El gráfico «Oven Ramp» indica en qué parte del programa se encuentra el horno; los pilotos señalan Not Ready, Run, Remote, Gas Saver o Service Due.',
      'Lo habitual es controlar el equipo desde el software de datos (OpenLab CDS), y el teclado sirve para comprobaciones y mantenimiento.',
    ],
    une: ['electronica', 'horno'],
  },
  electronica: {
    nombre: 'Electrónica principal', en: 'Main board', cat: 'Electrónica y control',
    funcion: 'Controla las zonas calefactadas, los módulos EPC, la secuencia del inyector automático, el encendido de la llama y la adquisición de la señal del detector.',
    detalles: ['Se comunica con el ordenador por red local (LAN). La disposición de las tarjetas del modelo es aproximada.'],
    une: ['teclado', 'fuente_alimentacion', 'electrometro', 'epc_inyector'],
  },
  fuente_alimentacion: {
    nombre: 'Fuente de alimentación', en: 'Power supply', cat: 'Electrónica y control',
    funcion: 'Suministra las tensiones de la electrónica y la potencia de las zonas calefactadas y del horno.',
    detalles: ['La tensión de red determina la velocidad máxima de calentamiento del horno. Su posición en el modelo es aproximada.'],
    une: ['electronica'],
  },

  /* ============ ESTRUCTURA Y CARCASA ============ */
  carcasa: {
    nombre: 'Carcasa', en: 'Covers · side and rear panels', cat: 'Estructura y carcasa',
    funcion: 'Paneles de chapa pintada que cierran el equipo, canalizan el aire de refrigeración y protegen de las superficies calientes.',
    detalles: [
      'En la trasera están los pasamuros de gases (portador y gases del detector), la toma de red, la conexión LAN y el conector del inyector automático.',
      'La tapa superior cubre las zonas de inyectores y detectores; por ella asoman las chimeneas del FID.',
      'Dimensiones del 7890: 50 cm de alto, 59 cm de ancho y 54 cm de fondo.',
    ],
    specs: [['Alto × ancho × fondo', '50 × 59 × 54 cm'], ['Inyectores / detectores', 'Hasta 2 / hasta 3']],
    une: ['chasis', 'puerta_horno', 'teclado', 'tapa_inyectores'],
  },
  tapa_inyectores: {
    nombre: 'Plataforma de los inyectores', en: 'Inlet deck', cat: 'Estructura y carcasa',
    funcion: 'Cubierta negra del módulo izquierdo bajo la que están los inyectores; por su orificio asoma la tuerca del septum y sobre ella se apoya la torre del 7693A.',
    une: ['als_torre', 'tuerca_septum', 'carcasa'],
  },
  puerta_horno: {
    nombre: 'Puerta del horno', en: 'Oven door', cat: 'Estructura y carcasa',
    funcion: 'Cierra la cámara del horno por delante y da acceso a la columna, la jaula y las conexiones del inyector y del detector.',
    detalles: ['Está aislada térmicamente; durante un análisis no debe abrirse porque el horno pierde la temperatura.'],
    une: ['horno', 'columna'],
  },
  chasis: {
    nombre: 'Zócalo', en: 'Base', cat: 'Estructura y carcasa',
    funcion: 'Base sobre la que se montan el horno, los módulos y la carcasa. En el frente, abajo a la izquierda, está el interruptor general.',
    une: ['carcasa', 'horno'],
  },

  /* ============ INSTALACIÓN DEL LABORATORIO ============ */
  panel_gases: {
    nombre: 'Panel de reguladores', en: 'Wall gas regulators', cat: 'Instalación del laboratorio',
    funcion: 'Reguladores de pared con manómetro para helio, aire, nitrógeno e hidrógeno, alimentados por bajantes desde la red de gases.',
    detalles: [
      'Es la instalación del laboratorio: el helio es el gas portador; el hidrógeno y el aire alimentan la llama del FID y el nitrógeno es el gas auxiliar.',
      'Por este conjunto de gases se deduce que el detector del equipo es un FID.',
    ],
    une: ['lineas_gas', 'filtros_gas'],
  },
  filtros_gas: {
    nombre: 'Filtros Gas Clean', en: 'Agilent Gas Clean filters', cat: 'Instalación del laboratorio',
    funcion: 'Cartuchos purificadores que retienen oxígeno, humedad e hidrocarburos de los gases antes de entrar en el GC.',
    detalles: [
      'El oxígeno y el agua degradan la fase estacionaria a alta temperatura; los hidrocarburos del hidrógeno o del aire elevan el fondo del FID.',
      'Algunos cartuchos tienen un indicador que cambia de color al saturarse.',
      'La asignación de cada cartucho a cada gas en el modelo es orientativa.',
    ],
    une: ['lineas_gas', 'panel_gases'],
  },
};
