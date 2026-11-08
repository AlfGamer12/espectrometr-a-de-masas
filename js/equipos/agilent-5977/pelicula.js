// Guion del modo película del Agilent 5977 GC/MSD (≈ 2,5 min). El texto de cada plano es a la vez subtítulo y guion de narración
// (audio opcional: audio/agilent-5977/01.mp3, 02.mp3…).
const EXT = ['gc', 'gc_automuestreador', 'carcasa_superior', 'chasis', 'bomba_previa', 'panel_frontal'];
const FUENTE = ['cuerpo_fuente', 'filamento1', 'filamento2', 'repulsor', 'calefactor_fuente'];

export const PELICULA = [
  {
    intro: true, tarjeta: 6, dur: 15, modo: 'equipo', e1: 0, xray: false, foco: EXT, dir: [-0.62, 0.42, 0.78], pad: 1.05, trans: 0, orbita: -2.2, acercar: 0.06,
    texto: 'El Agilent 5977 es un detector selectivo de masas acoplado a un cromatógrafo de gases. El cromatógrafo separa los compuestos; el espectrómetro los ioniza, los filtra por su masa y los detecta.',
  },
  {
    cap: 'Introducción de muestra', titulo: 'La interfaz GC/MSD', dur: 16, modo: 'equipo', e1: 0, xray: true, foco: ['linea_transferencia', 'gc_columna_horno', 'analizador'],
    dir: [-0.55, 0.45, 0.85], pad: 1.4, orbita: 1.8, acercar: 0.05, resaltar: ['linea_transferencia', 'gc_columna_horno', 'gc_inyector'],
    texto: 'La columna capilar atraviesa la interfaz calefactada, a unos doscientos ochenta grados, y termina dentro de la cámara de ionización. El alto vacío aspira el helio portador, en torno a un mililitro por minuto.',
  },
  {
    cap: 'Arquitectura', titulo: 'Vista explosionada', dur: 16, modo: 'equipo', e1: 1, xray: false,
    foco: ['placa_lateral', 'analizador', 'camara_vacio', 'bomba_turbo', 'placa_principal', 'fuente_alimentacion'],
    dir: [-0.8, 0.6, 0.75], pad: 1.15, trans: 3.0, orbita: -3, resaltar: [],
    texto: 'Sin la carcasa aparecen la cámara de vacío, la bomba turbomolecular y la electrónica. El analizador va montado sobre la placa lateral: tras ventilar el equipo, la placa se abre y el conjunto sale con ella.',
  },
  {
    cap: 'Fuente de iones', titulo: 'Impacto electrónico', dur: 19, modo: 'analizador', e2: 0.55, xray: false, foco: FUENTE,
    dir: [-0.8, 0.38, 0.5], pad: 1.15, trans: 3.0, orbita: 3.5, acercar: 0.07, resaltar: ['filamento1', 'filamento2', 'iman1', 'iman2'],
    texto: 'Un filamento de renio emite electrones que se aceleran hasta setenta electronvoltios, y los imanes los concentran en un haz estrecho. El impacto ioniza las moléculas y produce una fragmentación reproducible, comparable con bibliotecas espectrales.',
  },
  {
    cap: 'Óptica iónica', titulo: 'Extracción y enfoque', dur: 15, modo: 'analizador', e2: 0.55, xray: false, foco: ['repulsor', 'extractor', 'lente_enfoque', 'lente_entrada'],
    dir: [-1, 0.42, 0.1], pad: 1.3, orbita: -3, acercar: 0.06, resaltar: ['extractor', 'lente_enfoque', 'lente_entrada'],
    texto: 'El repulsor empuja los iones hacia la salida de la fuente. La placa extractora, la lente de enfoque y la lente de entrada los aceleran y concentran el haz sobre el eje del cuadrupolo.',
  },
  {
    cap: 'Analizador', titulo: 'Cuadrupolo hiperbólico', dur: 19, modo: 'analizador', e2: 0.55, xray: false, foco: ['cuadrupolo', 'radiador_sup', 'radiador_inf'],
    dir: [-0.7, 0.5, 0.8], pad: 1.2, orbita: 3, acercar: 0.05, resaltar: [],
    texto: 'El filtro de masas es una pieza de cuarzo con cuatro superficies hiperbólicas recubiertas de oro. Con una tensión continua y otra de radiofrecuencia, solo los iones de una masa tienen trayectoria estable; el resto choca con los electrodos.',
  },
  {
    cap: 'Detector', titulo: 'Detector de triple eje', dur: 19, modo: 'analizador', e2: 0.55, xray: false, foco: ['hed', 'multiplicador', 'lente_detector'],
    dir: [-0.75, 0.45, 0.6], pad: 1.2, orbita: -3.5, acercar: 0.06, resaltar: ['hed', 'multiplicador', 'lente_detector'],
    texto: 'Los iones transmitidos se desvían hacia el dínodo de alta energía, situado fuera del eje. Sus electrones secundarios entran en el multiplicador, que amplifica la señal hasta un millón de veces. Los fotones y las partículas neutras siguen de largo.',
  },
  {
    cap: 'Simulación', titulo: 'Barrido y modo SIM', dur: 22, modo: 'analizador', e2: 0, xray: true, sim: true,
    ctl: { muestra: 'pftba', modo: 'scan', velocidad: '2.5' },
    foco: ['repulsor', 'cuadrupolo', 'multiplicador', 'hed', 'filamento1', 'filamento2', 'calefactor_fuente', 'columna_extremo', 'carcasa_detector'],
    dir: [-1, 0.45, 0.25], pad: 0.62, resaltar: [],
    eventos: [{ t: 13.5, ctl: { modo: 'sim' } }],
    texto: 'Con el calibrante PFTBA, el cuadrupolo barre todo el rango y el espectro se construye pico a pico: sesenta y nueve, doscientos diecinueve, quinientos dos. En modo SIM el filtro permanece sobre la masa sesenta y nueve y la sensibilidad aumenta.',
  },
  {
    cap: 'Sistema de vacío', titulo: 'Turbomolecular y vacío previo', dur: 16, modo: 'equipo', e1: 0.55, xray: true, sim: false,
    foco: ['camara_vacio', 'bomba_turbo', 'bomba_previa'], dir: [-0.78, 0.45, 0.62], pad: 1.15, trans: 3.2, orbita: -2.5,
    resaltar: ['camara_vacio', 'bomba_turbo', 'rotor_turbo', 'bomba_previa', 'manguera_previa'],
    texto: 'La bomba turbomolecular mantiene la cámara a una cienmilésima de torr. A esa presión una molécula recorre metros sin chocar, mucho más que el trayecto del ion. La bomba de vacío previo recoge su escape.',
  },
  {
    cap: 'Electrónica', titulo: 'Control y adquisición', dur: 15, modo: 'equipo', e1: 1, xray: false,
    foco: ['placa_principal', 'bobina_rf', 'placa_lateral_electronica', 'fuente_alimentacion'], dir: [-0.7, 0.55, 0.7], pad: 1.1, orbita: 2.5,
    resaltar: ['placa_principal', 'bobina_rf', 'placa_lateral_electronica'],
    texto: 'La tarjeta lateral alimenta filamentos y lentes, y el generador de radiofrecuencia, el cuadrupolo. La tarjeta principal sincroniza el barrido con el detector y envía los datos al ordenador.',
  },
  {
    dur: 9, modo: 'equipo', e1: 0, xray: false, foco: EXT, dir: [-0.62, 0.42, 0.78], pad: 1.05, trans: 3.0, orbita: -2, resaltar: [],
    texto: 'Separación, ionización, filtrado y detección: así identifica el equipo cada compuesto de una mezcla compleja.',
  },
];
