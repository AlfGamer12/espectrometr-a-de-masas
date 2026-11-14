// Guion del modo película del Agilent 7890B GC-FID (≈ 3 min). El texto de cada plano es a la vez subtítulo y guion de narración
// (audio opcional: audio/agilent-7890b/01.mp3, 02.mp3…).
const EXT = ['als_torre', 'als_torreta', 'tapa_superior', 'teclado', 'puerta_horno', 'frontal_izq', 'chasis'];
const ALS = ['als_torreta', 'als_jeringa', 'als_carro', 'als_guia', 'tuerca_septum'];
const INY = ['tuerca_septum', 'septum', 'inyector_cabeza', 'liner', 'inyector_bloque', 'inyector_base'];
const FID = ['fid_base', 'fid_bloque', 'fid_chorro', 'fid_colector', 'fid_castillo', 'fid_ignitor'];
const SIM = ['tuerca_septum', 'liner', 'inyector_bloque', 'columna', 'jaula_columna', 'fid_castillo', 'fid_base', 'electrometro'];

export const PELICULA = [
  {
    intro: true, tarjeta: 6, dur: 14, modo: 'equipo', e1: 0, xray: false, foco: EXT, dir: [0.42, 0.32, 1], pad: 1.05, trans: 0, orbita: -2.2, acercar: 0.06,
    texto: 'El Agilent 7890B es un cromatógrafo de gases. Separa los componentes volátiles de una mezcla en una columna capilar y los mide, uno tras otro, con un detector de ionización de llama.',
  },
  {
    cap: 'Gases', titulo: 'La instalación del laboratorio', dur: 16, modo: 'equipo', e1: 0, xray: false, foco: ['panel_gases', 'filtros_gas', 'lineas_gas'],
    dir: [0.5, 0.25, 1], pad: 1.05, orbita: 2, acercar: 0.04, resaltar: ['panel_gases', 'filtros_gas', 'lineas_gas'],
    texto: 'De la pared bajan cuatro líneas de cobre: helio como gas portador, hidrógeno y aire para la llama y nitrógeno como gas auxiliar. Antes de entrar en el equipo, cada gas atraviesa un filtro que retiene oxígeno, humedad e hidrocarburos.',
  },
  {
    cap: 'Inyección', titulo: 'El inyector automático 7693A', dur: 15, modo: 'analizador', e2: 0, xray: true, sim: true, ctl: { muestra: 'alcanos', prog: 'r10', portador: 'he35', split: '50', columna: 'c30' },
    foco: ALS, dir: [-0.35, 0.25, 1], pad: 0.95, orbita: 1.5, resaltar: [],
    texto: 'La torreta lleva el vial bajo la aguja. La jeringa aspira la muestra, la torreta deja libre el paso y la aguja atraviesa el septum: un microlitro llega al liner caliente en una fracción de segundo.',
  },
  {
    cap: 'Inyector', titulo: 'Split y splitless', dur: 17, modo: 'analizador', e2: 0.5, xray: false, sim: false, foco: INY, dir: [-0.45, 0.3, 1], pad: 1.3, trans: 2.6, orbita: -3, acercar: 0.05,
    resaltar: ['liner', 'inyector_cabeza', 'septum'],
    texto: 'En el liner, a unos doscientos cincuenta grados, la gota se vaporiza. En modo split casi todo el vapor sale por el venteo y solo una pequeña parte entra en la columna; en splitless el venteo se cierra durante la purga y entra casi toda la muestra.',
  },
  {
    cap: 'Neumática', titulo: 'Control electrónico de la presión', dur: 15, modo: 'analizador', e2: 0, xray: true, foco: ['inyector_bloque', 'inyector_cabeza', 'trampa_split', 'epc_inyector', 'epc_detector', 'lineas_neumaticas'],
    dir: [0.3, 0.7, -0.75], pad: 1.1, orbita: 2.5, resaltar: ['epc_inyector', 'epc_detector', 'trampa_split', 'lineas_neumaticas'],
    texto: 'Los módulos de control electrónico de la neumática regulan la presión en cabeza de columna, el venteo de split, la purga del septum y los gases del detector, sin reguladores manuales.',
  },
  {
    cap: 'Columna', titulo: 'Separación en la columna capilar', dur: 17, modo: 'analizador', e2: 0, xray: false, foco: ['columna', 'jaula_columna', 'ventilador_horno', 'calefactor_horno'],
    dir: [-0.15, 0.2, 1], pad: 1.15, orbita: -2.5, acercar: 0.05, resaltar: ['columna'],
    texto: 'Treinta metros de sílice fundida, enrollados en una jaula dentro del horno. Cada compuesto se reparte entre el gas y la fina película de fase estacionaria; cuanto más tiempo pasa retenido, más despacio avanza.',
  },
  {
    cap: 'Simulación', titulo: 'Programa de temperatura', dur: 32, modo: 'analizador', e2: 0, xray: true, sim: true, ctl: { muestra: 'alcanos', prog: 'iso150', portador: 'he35', split: '50', columna: 'c30' },
    foco: SIM, dir: [-0.22, 0.26, 1], pad: 0.7, resaltar: [], eventos: [{ t: 14.8, ctl: { prog: 'r10' } }],
    texto: 'A temperatura constante, los alcanos ligeros salen casi juntos y los pesados tardan y dan picos anchos. Con una rampa de diez grados por minuto, todos salen como picos estrechos y regularmente espaciados.',
  },
  {
    cap: 'Detector', titulo: 'Ionización de llama', dur: 18, modo: 'analizador', e2: 0.55, xray: false, sim: false, foco: FID, dir: [-0.35, 0.3, 1], pad: 1.3, trans: 2.8, orbita: 3, acercar: 0.05,
    resaltar: ['fid_chorro', 'fid_colector', 'fid_ignitor'],
    texto: 'El efluente de la columna arde en una llama de hidrógeno y aire. Los carbonos de cada molécula forman iones CHO más; el colector, polarizado, los recoge y la corriente resultante es proporcional al carbono que llega a la llama.',
  },
  {
    cap: 'Detector', titulo: 'Gases y encendido', dur: 14, modo: 'analizador', e2: 0, xray: true, foco: ['epc_detector', 'fid_base', 'fid_bloque', 'fid_castillo', 'fid_ignitor', 'electrometro'],
    dir: [0.55, 0.45, 0.8], pad: 1.15, orbita: -2, resaltar: ['epc_detector', 'fid_ignitor', 'electrometro'],
    texto: 'Hidrógeno, aire y nitrógeno auxiliar llegan al detector con caudales fijos. Un filamento incandescente enciende la llama, y el electrómetro convierte picoamperios en la señal del cromatograma.',
  },
  {
    cap: 'Simulación', titulo: 'Gas portador y van Deemter', dur: 35, modo: 'analizador', e2: 0, xray: true, sim: true, ctl: { muestra: 'alcanos', prog: 'r10', portador: 'n2_12', split: '50', columna: 'c30' },
    foco: SIM, dir: [-0.22, 0.26, 1], pad: 0.7, resaltar: [], eventos: [{ t: 18.6, ctl: { portador: 'h2_70' } }],
    texto: 'Con nitrógeno, el mínimo de la curva de van Deemter está a unos doce centímetros por segundo y el análisis es lento. El hidrógeno mantiene una altura de plato baja a velocidades mucho mayores: los mismos compuestos salen separados en bastante menos tiempo.',
  },
  {
    cap: 'Electrónica', titulo: 'Control y adquisición', dur: 14, modo: 'equipo', e1: 1, xray: false, sim: false, foco: ['electronica', 'teclado', 'fuente_alimentacion', 'electrometro'],
    dir: [0.6, 0.4, 0.8], pad: 1.1, trans: 3, orbita: 2.5, resaltar: ['electronica', 'teclado', 'fuente_alimentacion'],
    texto: 'La electrónica regula todas las zonas calefactadas, los módulos de presión y el inyector automático. El teclado muestra para cada zona el valor real y la consigna.',
  },
  {
    dur: 9, modo: 'equipo', e1: 0, xray: false, foco: EXT, dir: [0.42, 0.32, 1], pad: 1.05, trans: 3, orbita: -2, resaltar: [],
    texto: 'Vaporizar, separar y quemar: así mide el cromatógrafo cada compuesto de una mezcla volátil.',
  },
];
