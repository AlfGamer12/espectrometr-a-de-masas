// Fichas técnicas del Agilent 7900 ICP-MS.
// Fuentes: folleto 5991-3719ES, especificaciones típicas 5991-6397EN, lista de preparación del sitio G8400-90020,
// folleto del modo He 5994-1171EN, guía de conos 5994-0860EN, índice de mantenimiento de Agilent y bibliografía de ICP-MS.
// "aprox." = valor típico de la plataforma o estimación.

export const CATEGORIAS = [
  'Introducción de muestra', 'Plasma (fuente de iones)', 'Interfaz y óptica iónica', 'Celda de colisión/reacción', 'Analizador y detector',
  'Sistema de vacío', 'Gases, RF y electrónica', 'Estructura y carcasa',
];

export const INFO = {
  automuestreador: {
    nombre: 'Automuestreador SPS 4', en: 'SPS 4 autosampler', cat: 'Introducción de muestra',
    funcion: 'Lleva la sonda a cada tubo de muestra, de patrón o de lavado y la sumerge; la bomba peristáltica aspira la disolución por el capilar.',
    detalles: ['Entre muestras la sonda pasa por la estación de lavado para evitar el arrastre de una muestra a la siguiente.'],
    specs: [], une: ['bomba_peristaltica'],
  },
  bomba_peristaltica: {
    nombre: 'Bomba peristáltica', en: 'Peristaltic pump', cat: 'Introducción de muestra',
    funcion: 'Impulsa la muestra hacia el nebulizador y extrae el drenaje de la cámara de pulverización con caudal constante, independiente de la viscosidad de la muestra.',
    detalles: ['Diez rodillos y tres canales: muestra, patrón interno (opcional) y drenaje.', 'Los tubos de bomba se desgastan y se sustituyen periódicamente.'],
    specs: [['Rodillos', '10'], ['Canales', '3'], ['Caudal de muestra', '≈ 0,1–0,4 mL/min (aprox.)']],
    une: ['automuestreador', 'nebulizador', 'camara_nebulizacion'],
  },
  nebulizador: {
    nombre: 'Nebulizador concéntrico MicroMist', en: 'MicroMist concentric nebulizer', cat: 'Introducción de muestra',
    funcion: 'Convierte la disolución en un aerosol fino: el argón sale a gran velocidad por el anillo que rodea al capilar de muestra y rompe el líquido en gotas.',
    detalles: ['Es de vidrio. El gas entra por el brazo lateral y la muestra por el extremo trasero.'],
    specs: [['Gas', 'Argón, ≈ 1 L/min (aprox.)']], tune: ['Nebulizer Gas'],
    une: ['bomba_peristaltica', 'camara_nebulizacion', 'control_gases'],
  },
  camara_nebulizacion: {
    nombre: 'Cámara de pulverización de Scott', en: 'Scott double-pass spray chamber', cat: 'Introducción de muestra',
    funcion: 'Deja pasar solo las gotas más finas. El aerosol recorre el tubo interior, invierte el sentido por el exterior y sale hacia la antorcha; las gotas grandes chocan con las paredes y se van por el drenaje.',
    detalles: ['Solo llega al plasma una pequeña fracción de la muestra aspirada; el resto se pierde por el drenaje.', 'Es de cuarzo.'],
    specs: [['Tipo', 'Doble paso'], ['Temperatura', '2 °C (ajustable de −5 a +20 °C)']],
    une: ['nebulizador', 'peltier', 'antorcha'],
  },
  peltier: {
    nombre: 'Refrigeración Peltier', en: 'Peltier cooler', cat: 'Introducción de muestra',
    funcion: 'Mantiene la cámara de pulverización a temperatura constante. Al enfriarla condensa parte del vapor de disolvente, con lo que entra menos agua en el plasma y se forman menos óxidos.',
    detalles: [], specs: [['Temperatura', '2 °C']], une: ['camara_nebulizacion'],
  },
  antorcha: {
    nombre: 'Antorcha de cuarzo', en: 'Quartz torch', cat: 'Plasma (fuente de iones)',
    funcion: 'Tres tubos concéntricos: por el exterior circula el gas de plasma, por el intermedio el gas auxiliar y por el inyector central entra el aerosol, que atraviesa el centro del plasma.',
    detalles: ['De una pieza. Un motor paso a paso la posiciona para ajustar la profundidad de muestreo.', 'El conector de cuarzo une la salida de la cámara con el inyector.'],
    specs: [['Inyector', '2,5 mm'], ['Gas de plasma', '≈ 15 L/min'], ['Gas auxiliar', '≈ 0,9 L/min'], ['Profundidad de muestreo', '≈ 8–10 mm (aprox.; ajustable 3–28 mm)']],
    tune: ['Plasma Gas', 'Auxiliary Gas', 'Sampling Depth'], une: ['camara_nebulizacion', 'bobina', 'cono_muestreo'],
  },
  escudo_antorcha: {
    nombre: 'ShieldTorch', en: 'ShieldTorch System', cat: 'Plasma (fuente de iones)',
    funcion: 'Lámina de platino conectada a tierra entre la bobina y la antorcha. Elimina el acoplamiento capacitivo de la bobina con el plasma y, con ello, la descarga secundaria en la interfaz.',
    detalles: ['Reduce la dispersión de energía de los iones, lo que favorece la discriminación por energía en la celda.'],
    specs: [['Material', 'Platino']], une: ['antorcha', 'bobina'],
  },
  bobina: {
    nombre: 'Bobina de carga', en: 'RF load coil', cat: 'Plasma (fuente de iones)',
    funcion: 'Conduce la corriente de RF del generador. Su campo magnético oscilante induce corrientes en el argón ionizado que mantienen el plasma.',
    detalles: ['Tubo de cobre plateado. El número de espiras del modelo es aproximado.'],
    specs: [['Frecuencia', '27 MHz'], ['Potencia', '500–1600 W (≈ 1550 W típico)']], tune: ['RF Power'],
    une: ['generador_rf', 'antorcha'],
  },
  plasma: {
    nombre: 'Plasma de argón acoplado inductivamente', en: 'Inductively coupled plasma', cat: 'Plasma (fuente de iones)',
    funcion: 'Gas ionizado a 6000–10 000 K. En el canal central el aerosol se seca, se vaporiza, se atomiza y se ioniza: casi todos los elementos forman iones M⁺.',
    detalles: ['El argón tiene un potencial de ionización alto (15,76 eV), por eso ioniza con eficiencia la mayoría de los elementos.',
      'También forma iones poliatómicos del propio plasma y de la matriz (ArO⁺, Ar₂⁺, ArCl⁺, ClO⁺…), que se solapan con analitos de la misma masa nominal.'],
    specs: [['Temperatura', '6000–10 000 K'], ['CeO⁺/Ce⁺', '< 1,5 % (especificación de fábrica)'], ['Ce²⁺/Ce⁺', '< 3 % (especificación de fábrica)']], une: ['antorcha', 'cono_muestreo'],
  },
  cono_muestreo: {
    nombre: 'Cono de muestreo', en: 'Sampler cone', cat: 'Interfaz y óptica iónica',
    funcion: 'Extrae el centro del plasma por un orificio de alrededor de 1 mm hacia la región de interfaz, evacuada por la bomba rotatoria.',
    detalles: ['Punta de níquel sobre base de cobre; también los hay con punta de platino para matrices agresivas.', 'Es la pieza que más se ensucia: se limpia y se sustituye periódicamente.'],
    specs: [['Material', 'Punta de Ni, base de Cu (punta de Pt opcional)'], ['Orificio', '1,0 mm']], une: ['interfaz', 'plasma'],
  },
  interfaz: {
    nombre: 'Placa de interfaz', en: 'Water-cooled interface', cat: 'Interfaz y óptica iónica',
    funcion: 'Soporta el cono de muestreo y disipa el calor del plasma mediante circulación de agua del enfriador.',
    detalles: ['La región entre los dos conos está a unos cientos de pascales y se bombea con la rotatoria.'],
    specs: [['Presión', '≈ 10² Pa (aprox.)'], ['Refrigeración', 'Agua, ≥ 5 L/min']], une: ['cono_muestreo', 'cono_separador', 'enfriador', 'bomba_rotatoria'],
  },
  cono_separador: {
    nombre: 'Cono de separación (skimmer)', en: 'Skimmer cone', cat: 'Interfaz y óptica iónica',
    funcion: 'Segundo cono, más agudo y de orificio menor, que toma la parte central del chorro supersónico y la deja pasar a la cámara de lentes.',
    detalles: [], specs: [['Material', 'Ni (punta de Pt opcional)'], ['Orificio', '0,45 mm']], une: ['interfaz', 'lentes_extraccion'],
  },
  lentes_extraccion: {
    nombre: 'Lentes de extracción', en: 'Extraction lenses', cat: 'Interfaz y óptica iónica',
    funcion: 'Extraen los iones positivos del chorro que sale del cono de separación y los aceleran hacia la lente Omega.',
    detalles: ['Lente de extracción doble y cónica; forman parte de la configuración estándar x-lens del 7900 (la s-lens es la opción de alta sensibilidad para semiconductores).'], specs: [], tune: ['Extract 1', 'Extract 2'], une: ['cono_separador', 'lente_omega'],
  },
  lente_omega: {
    nombre: 'Lente Omega', en: 'Off-axis Omega lens', cat: 'Interfaz y óptica iónica',
    funcion: 'Desvía el haz de iones fuera del eje. Los fotones y las partículas neutras siguen recto y no llegan al analizador, lo que mantiene el fondo muy bajo.',
    detalles: ['No necesita tope de fotones.'], specs: [['Desplazamiento del haz', '≈ 1 cm (modelo)']], tune: ['Omega Lens', 'Omega Bias'],
    une: ['lentes_extraccion', 'celda_ors'],
  },
  celda_ors: {
    nombre: 'Celda ORS⁴ (octopolo)', en: 'Octopole Reaction System', cat: 'Celda de colisión/reacción',
    funcion: 'Octopolo de RF dentro de una celda presurizada con helio. Los iones poliatómicos, más voluminosos, chocan más veces con el helio y pierden más energía que los iones atómicos de la misma masa.',
    detalles: ['Discriminación por energía cinética (KED): una barrera de potencial a la salida deja pasar los iones atómicos y rechaza los poliatómicos, ya frenados.',
      'Unas mismas condiciones sirven para casi todas las interferencias poliatómicas. Para Se, Fe o Ca puede usarse H₂ como gas de reacción.',
      'No elimina interferencias isobáricas ni iones doblemente cargados (por ejemplo, REE²⁺ sobre As o Se).'],
    specs: [['Gas', 'He (H₂ opcional)'], ['Caudal de He', '≈ 4–5 mL/min (típico, aprox.)'], ['Cambio de gas', '< 3 s']], tune: ['He Flow', 'OctP Bias', 'Energy Discrimination'],
    une: ['lente_omega', 'lente_kd', 'control_gases'],
  },
  lente_kd: {
    nombre: 'Lente de polarización (barrera KED)', en: 'Plate bias lens', cat: 'Celda de colisión/reacción',
    funcion: 'Lente a la salida de la celda. La barrera KED se fija haciendo el sesgo del cuadrupolo unos voltios más positivo que el del octopolo, de modo que solo pasan los iones que conservan suficiente energía.',
    detalles: [], specs: [], une: ['celda_ors', 'cuadrupolo'],
  },
  cuadrupolo: {
    nombre: 'Cuadrupolo hiperbólico', en: 'Hyperbolic quadrupole', cat: 'Analizador y detector',
    funcion: 'Filtro de masas: con una combinación de tensión continua y RF solo transmite una relación m/z. Salta de una masa a otra en microsegundos para medir cada isótopo.',
    detalles: ['Las barras de perfil hiperbólico dan un campo más ideal y mejor sensibilidad de abundancia.'],
    specs: [['Frecuencia', '3 MHz'], ['Rango', '2–260 u'], ['Resolución', '0,3–1,0 u (ajustable)'], ['Sensibilidad de abundancia (Cs)', '≤ 5 × 10⁻⁷ lado de masa baja; ≤ 1 × 10⁻⁷ lado de masa alta']],
    une: ['lente_kd', 'detector'],
  },
  detector: {
    nombre: 'Detector ortogonal', en: 'Orthogonal detector system', cat: 'Analizador y detector',
    funcion: 'Multiplicador de electrones de dínodos discretos situado fuera del eje: cada ion que llega libera electrones que se multiplican en cascada.',
    detalles: ['Combina un modo de recuento de pulsos (señales bajas) con un modo analógico (señales altas).', 'Admite adquisición rápida de 0,1 ms por punto para el análisis de nanopartículas individuales.'],
    specs: [['Rango dinámico', '11 órdenes (0,1 cps – 10 Gcps)'], ['Tiempo de integración mínimo', '0,1 ms']],
    une: ['cuadrupolo', 'electronica'],
  },
  analizador: {
    nombre: 'Conjunto ICP-MS', en: 'ICP-MS ion path', cat: 'Analizador y detector',
    funcion: 'Del nebulizador al detector: la muestra se nebuliza, se ioniza en el plasma, pasa por los conos y las lentes, se limpia de interferencias en la celda y se separa por masa en el cuadrupolo.',
    detalles: [], specs: [['Sensibilidad (Y)', '≈ 600 Mcps/ppm (típica)'], ['Fondo (m/z 9)', '< 0,3 cps'], ['LD (Be)', '< 0,05 ppt']],
    une: ['plasma', 'cuadrupolo'],
  },
  camara_vacio: {
    nombre: 'Cámara de vacío', en: 'Vacuum manifold', cat: 'Sistema de vacío',
    funcion: 'Tres etapas de presión: interfaz (≈ 10² Pa, bomba rotatoria), cámara intermedia de lentes (≈ 10⁻² Pa, aprox.) y analizador (≈ 10⁻⁴ Pa).',
    detalles: ['Medidores de presión vigilan la interfaz y el analizador. La tapa superior da acceso a la óptica y a la celda.'],
    specs: [['Analizador', '≈ 10⁻⁴ Pa (aprox.)']], une: ['bomba_turbo', 'bomba_rotatoria', 'interfaz'],
  },
  bomba_turbo: {
    nombre: 'Turbo de flujo dividido', en: 'Split-flow turbomolecular pump', cat: 'Sistema de vacío',
    funcion: 'Una sola bomba turbomolecular con dos bocas: la principal evacúa el analizador y la lateral, a una etapa intermedia del rotor, la cámara de lentes.',
    detalles: [], specs: [], une: ['camara_vacio', 'bomba_rotatoria'],
  },
  bomba_rotatoria: {
    nombre: 'Bomba rotatoria', en: 'Rotary vane pump', cat: 'Sistema de vacío',
    funcion: 'Bomba de paletas en baño de aceite, externa. Evacúa la región de interfaz y respalda la turbo.',
    detalles: ['Se coloca en el suelo o bajo la mesa, con una manguera de 1,5 m.'], specs: [['Modelo típico', 'MS40+ (o MS40-S en equipos recientes)']], une: ['bomba_turbo', 'interfaz'],
  },
  control_gases: {
    nombre: 'Control de gases', en: 'Mass flow controllers', cat: 'Gases, RF y electrónica',
    funcion: 'Controladores de caudal másico para los gases de plasma, auxiliar y nebulizador, el gas de dilución y el helio de la celda.',
    detalles: ['La dilución en aerosol (UHMI) reduce el gas del nebulizador y añade argón entre la cámara y la antorcha; así admite muestras de hasta ≈ 25 % de sólidos disueltos.'],
    specs: [['Gases', 'Ar (≥ 99,99 %); He (≥ 99,999 %) para la celda'], ['Controladores de Ar', '4: plasma, auxiliar, portador, dilución']], une: ['antorcha', 'nebulizador', 'celda_ors'],
  },
  generador_rf: {
    nombre: 'Generador de RF', en: 'Solid-state RF generator', cat: 'Gases, RF y electrónica',
    funcion: 'Generador de estado sólido que alimenta la bobina de carga. Ajusta su frecuencia para seguir los cambios de carga cuando entra muestra o disolvente en el plasma.',
    detalles: [], specs: [['Frecuencia', '27 MHz'], ['Potencia', '500–1600 W']], une: ['bobina'],
  },
  electronica: {
    nombre: 'Electrónica', en: 'Control electronics', cat: 'Gases, RF y electrónica',
    funcion: 'Fuente de RF y continua del cuadrupolo, alta tensión del detector, control de la turbo y comunicación con el software MassHunter.',
    detalles: [], specs: [['Alimentación', 'Monofásica 200–240 V, 50/60 Hz, 30 A']], une: ['cuadrupolo', 'detector', 'bomba_turbo'],
  },
  enfriador: {
    nombre: 'Enfriador de recirculación', en: 'Recirculating chiller', cat: 'Gases, RF y electrónica',
    funcion: 'Hace circular agua por la placa de interfaz para evacuar el calor que recibe del plasma.',
    detalles: [], specs: [['Agua', '15–40 °C, ≥ 5 L/min'], ['Modelo', 'G3292A']], une: ['interfaz'],
  },
  caja_antorcha: {
    nombre: 'Caja de la antorcha', en: 'Torch box', cat: 'Estructura y carcasa',
    funcion: 'Recinto metálico que encierra el plasma: apantalla la radiación de RF y la luz ultravioleta y conduce el calor a la chimenea de extracción.',
    detalles: ['La extracción del laboratorio debe evacuar unos 5–7 m³/min.'], specs: [['Extracción', '5–7 m³/min']], une: ['antorcha', 'bobina', 'interfaz'],
  },
  puerta_muestras: {
    nombre: 'Puerta del compartimento de muestra', en: 'Sample introduction door', cat: 'Estructura y carcasa',
    funcion: 'Da acceso al nebulizador, la cámara de pulverización y la antorcha para su montaje y limpieza.',
    detalles: [], specs: [], une: ['panel_frontal'],
  },
  panel_frontal: {
    nombre: 'Panel frontal', en: 'Front panel', cat: 'Estructura y carcasa',
    funcion: 'Lleva los indicadores de estado (plasma, vacío, listo) y los pasos de los tubos de muestra y de drenaje.',
    detalles: [], specs: [], une: ['carcasa', 'bomba_peristaltica'],
  },
  carcasa: {
    nombre: 'Carcasa', en: 'Covers', cat: 'Estructura y carcasa',
    funcion: 'Mueble de sobremesa. Los paneles se desmontan para el mantenimiento.',
    detalles: [], specs: [['Dimensiones (an × fo × al)', '730 × 600 × 595 mm'], ['Peso', '100 kg']], une: ['panel_frontal', 'chasis'],
  },
  chasis: {
    nombre: 'Bastidor', en: 'Frame', cat: 'Estructura y carcasa',
    funcion: 'Estructura con un entrepaño que separa el compartimento de muestra y la antorcha de los módulos de gases y de RF.',
    detalles: [], specs: [], une: ['carcasa'],
  },
};
