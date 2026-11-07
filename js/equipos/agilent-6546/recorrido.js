// Recorrido guiado del Agilent 6546 LC/Q-TOF.
export const RECORRIDO = [
  {
    titulo: 'Un Q-TOF de alta resolución',
    texto: 'El 6546 combina un cuadrupolo con un analizador de tiempo de vuelo. Su torre vertical aloja el tubo de vuelo, que mide las masas con una exactitud inferior a 1 ppm. A la izquierda, el cromatógrafo 1290 Infinity II separa la muestra.',
    modo: 'equipo', e1: 0, xray: false, foco: ['lc', 'panel_frontal', 'torre_tof', 'chasis'], resaltar: [],
  },
  {
    titulo: 'Fuente Agilent Jet Stream',
    texto: 'El electrospray se rodea de un gas envolvente de nitrógeno a unos 350 °C que confina térmicamente el spray y acelera la desolvatación. Un segundo nebulizador introduce de forma continua las masas de referencia.',
    modo: 'analizador', e2: 0.3, xray: true, foco: ['nebulizador_ajs', 'nebulizador_referencia', 'capilar'], dir: [0.3, 0.45, 1], pad: 1.3,
    resaltar: ['nebulizador_ajs', 'nebulizador_referencia'],
  },
  {
    titulo: 'Capilar, fragmentor y skimmer',
    texto: 'Un capilar dieléctrico transfiere los iones al vacío y permite cambiar de polaridad al instante. A su salida, el fragmentor y el skimmer separan los iones del gas, que se bombea en la primera etapa.',
    modo: 'analizador', e2: 0.4, xray: false, foco: ['capilar', 'skimmer', 'octopolo'], dir: [0.3, 0.45, 1], pad: 1.3,
    resaltar: ['capilar', 'skimmer'],
  },
  {
    titulo: 'Octopolo y cuadrupolo',
    texto: 'El octopolo conduce los iones a través de las etapas de vacío. En modo MS el cuadrupolo deja pasar todas las masas; en MS/MS aísla un precursor con una ventana de unos 1,3 m/z.',
    modo: 'analizador', e2: 0.4, xray: false, foco: ['octopolo', 'cuadrupolo'], dir: [0.3, 0.45, 1], pad: 1.2,
    resaltar: ['octopolo', 'cuadrupolo'],
  },
  {
    titulo: 'Celda de colisión y slicer',
    texto: 'En la celda hexapolar los precursores se fragmentan por colisión con nitrógeno. Después, una lente aplana el haz y el slicer elimina los iones con velocidad vertical excesiva, lo que mejora la resolución.',
    modo: 'analizador', e2: 0.4, xray: true, foco: ['celda_colision', 'lente_enfoque', 'slicer'], dir: [0.3, 0.45, 1], pad: 1.3,
    resaltar: ['celda_colision', 'hexapolo', 'slicer'],
  },
  {
    titulo: 'Pulsador ortogonal',
    texto: 'El pulsador lanza los iones perpendicularmente hacia la torre unas 14 000 veces por segundo. Cada espectro almacenado es la suma de miles de pulsos, por lo que la resolución no disminuye al aumentar la velocidad de adquisición.',
    modo: 'analizador', e2: 0.3, xray: true, foco: ['pulsador', 'slicer', 'tubo_vuelo'], dir: [1, 0.35, 0.7], pad: 1.0,
    resaltar: ['pulsador'],
  },
  {
    titulo: 'Tubo de vuelo y espejo de iones',
    texto: 'Los iones suben por el tubo de vuelo, se reflejan en el espejo de dos etapas y vuelven al detector. El tubo, de una aleación de muy baja dilatación, limita la deriva térmica a menos de 1 ppm por cada 3 °C.',
    modo: 'analizador', e2: 0.2, xray: true, foco: ['tubo_vuelo', 'espejo_iones', 'detector', 'pulsador'], dir: [1, 0.3, 0.7], pad: 1.0,
    resaltar: ['tubo_vuelo', 'espejo_iones'],
  },
  {
    titulo: 'Detección con rango dinámico ampliado',
    texto: 'El detector convierte los iones en electrones y estos en luz, que mide un fotomultiplicador. Dos digitalizadores de 10 GHz, de ganancia alta y baja, se combinan como en una fotografía HDR para cubrir cinco órdenes de magnitud.',
    modo: 'analizador', e2: 0.4, xray: true, foco: ['detector', 'pulsador'], dir: [1, 0.4, 0.8], pad: 1.8,
    resaltar: ['detector'],
  },
  {
    titulo: 'Simulación: masa exacta',
    texto: 'El panel muestra el espectro con masas exactas y el error de masa del pico ampliado. Con la masa de referencia activa el error queda por debajo de 1 ppm; sin ella aparece la deriva del eje de masas. Pueden probarse los modos Auto MS/MS y All Ions.',
    modo: 'analizador', e2: 0, xray: true, sim: true, foco: ['nebulizador_ajs', 'cuadrupolo', 'tubo_vuelo'], dir: [0.9, 0.4, 0.8], resaltar: [],
  },
  {
    titulo: 'Vacío y servicios',
    texto: 'Cinco etapas de vacío, mantenidas por dos bombas turbomoleculares y una bomba primaria, llevan la presión hasta unos 10⁻⁷ Torr en el TOF. El equipo necesita nitrógeno para la fuente y para la celda de colisión.',
    modo: 'equipo', e1: 1, xray: false, sim: false, foco: ['camara_vacio', 'bombas_turbo', 'bomba_primaria', 'electronica'],
    resaltar: ['camara_vacio', 'bombas_turbo', 'bomba_primaria', 'linea_vacio', 'linea_gases'],
  },
];
