// Guion del modo película del espectrómetro de sector magnético de doble enfoque (modelo didáctico tipo Thermo DFS, ≈ 2,5 min).
// El texto de cada plano es a la vez subtítulo y guion de narración.
const EXT = ['gc', 'panel_frontal', 'tapa_analizador', 'chasis', 'enfriador', 'linea_transferencia'];
const SIMF = ['fuente_ei', 'iman', 'esa', 'multiplicador'];

export const PELICULA = [
  {
    intro: true, tarjeta: 6, dur: 17, modo: 'equipo', e1: 0, xray: false, foco: EXT, dir: [0.6, 0.45, 1], pad: 1.05, trans: 0, orbita: -2.2, acercar: 0.06,
    texto: 'Este modelo didáctico reproduce un espectrómetro de masas de sector magnético de doble enfoque acoplado a cromatografía de gases, con el Thermo DFS como referencia. Es el método de referencia para dioxinas.',
  },
  {
    cap: 'Introducción de muestra', titulo: 'Cromatógrafo y línea de transferencia', dur: 18, modo: 'equipo', e1: 0, xray: false,
    foco: ['gc', 'linea_transferencia'], dir: [-1, 0.45, 0.7], pad: 1.3, orbita: 1.8, acercar: 0.05, resaltar: ['gc', 'linea_transferencia'],
    texto: 'El cromatógrafo separa los componentes de la muestra en una columna capilar, y una línea calefactada la lleva hasta la fuente. Una entrada de referencia añade perfluoroqueroseno, cuyos iones de masa exacta calibran la escala.',
  },
  {
    cap: 'Arquitectura', titulo: 'Consola y analizador', dur: 16, modo: 'equipo', e1: 1, xray: true, foco: ['analizador', 'chasis', 'bombas_turbo'],
    dir: [0.7, 0.75, 0.85], pad: 1.3, trans: 3.0, orbita: -3, resaltar: [],
    texto: 'Sin paneles, el analizador queda a la vista sobre una plataforma antivibratoria. Las bombas, las fuentes de alimentación y la electrónica ocupan el mueble inferior. El conjunto pesa unos novecientos kilos.',
  },
  {
    cap: 'Fuente de iones', titulo: 'Impacto electrónico y aceleración', dur: 18, modo: 'analizador', e2: 0.4, xray: false,
    foco: ['fuente_ei', 'lentes_enfoque', 'rendija_entrada'], dir: [0.5, 0.7, 0.8], pad: 1.25, trans: 3.0, orbita: 3.5, acercar: 0.06,
    resaltar: ['fuente_ei', 'lentes_enfoque'],
    texto: 'Electrones de setenta electronvoltios ionizan las moléculas que llegan del cromatógrafo. Toda la fuente flota a cinco kilovoltios, así que los iones salen con cinco kiloelectronvoltios de energía. Las lentes centran el haz.',
  },
  {
    cap: 'Óptica de entrada', titulo: 'Rendija de entrada', dur: 14, modo: 'analizador', e2: 0.4, xray: false,
    foco: ['rendija_entrada', 'lentes_enfoque'], dir: [0.4, 0.8, 0.7], pad: 1.8, orbita: -3, acercar: 0.05, resaltar: ['rendija_entrada'],
    texto: 'La rendija de entrada, de tántalo y anchura motorizada, define el objeto de la óptica. Con la de salida fija la resolución: más estrecha, más resolución y menos transmisión.',
  },
  {
    cap: 'Analizador magnético', titulo: 'Sector magnético', dur: 20, modo: 'analizador', e2: 0.3, xray: true, foco: ['iman', 'tubo_vuelo'],
    dir: [0.3, 1, 0.5], pad: 1.0, orbita: 3, acercar: 0.05, resaltar: ['iman'],
    texto: 'En el imán, de sesenta y cinco grados y trescientos cincuenta milímetros de radio, cada ion describe un arco que depende de su masa y su carga. Para un campo dado, solo una masa sigue la trayectoria central. El imán laminado barre el campo con rapidez.',
  },
  {
    cap: 'Analizador electrostático', titulo: 'El doble enfoque', dur: 17, modo: 'analizador', e2: 0.3, xray: true,
    foco: ['esa', 'rendija_intermedia', 'rendija_salida'], dir: [0.3, 1, 0.5], pad: 1.35, orbita: -3, acercar: 0.05,
    resaltar: ['esa', 'carcasa_esa', 'carcasa_esa_inf'],
    texto: 'Tras el imán, el sector eléctrico selecciona por energía, sin depender de la masa. Su dispersión en energía es igual y opuesta a la del imán, y ambas se compensan: los iones de igual masa convergen en la rendija de salida.',
  },
  {
    cap: 'Detector', titulo: 'Dínodo de conversión y multiplicador', dur: 15, modo: 'analizador', e2: 0.5, xray: true,
    foco: ['dinodo_conversion', 'multiplicador', 'rendija_salida'], dir: [0.4, 0.9, 0.6], pad: 1.5, orbita: 4, acercar: 0.06,
    resaltar: ['dinodo_conversion', 'multiplicador'],
    texto: 'Tras la rendija de salida, los iones golpean un dínodo de conversión a alta tensión. Las partículas secundarias se amplifican en un multiplicador de electrones situado fuera del eje.',
  },
  {
    cap: 'Simulación', titulo: 'Resolución y dobletes de masa', dur: 22, modo: 'analizador', e2: 0, xray: true, sim: true,
    ctl: { muestra: 'gases', rendija: 'ancha', velocidad: '1' }, foco: SIMF, dir: [0.3, 1, 0.55], pad: 1.0, resaltar: [],
    eventos: [{ t: 11, ctl: { rendija: 'media' } }],
    texto: 'A masa veintiocho coinciden el monóxido de carbono, el nitrógeno y el etileno. Con rendijas anchas, resolución mil, forman un solo pico. Al estrecharlas hasta resolución diez mil, el doblete se separa. Es el mínimo que exige el método de la EPA para dioxinas.',
  },
  {
    cap: 'Servicios', titulo: 'Vacío y refrigeración', dur: 14, modo: 'equipo', e1: 1, sim: false, xray: true,
    foco: ['bombas_turbo', 'bombas_rotatorias', 'fuente_iman', 'enfriador'], dir: [0.6, 0.55, 1], pad: 1.1, trans: 3.2, orbita: -3,
    resaltar: ['bombas_turbo', 'bombas_rotatorias', 'lineas_vacio', 'fuente_iman', 'enfriador'],
    texto: 'Tres bombas turbomoleculares y sus bombas rotatorias mantienen el vacío de la fuente, el analizador y el detector. El agua de la red o de un enfriador opcional refrigera varias partes del instrumento.',
  },
  {
    dur: 11, modo: 'equipo', e1: 0, foco: EXT, dir: [0.6, 0.45, 1], pad: 1.05, trans: 3.0, orbita: -2, resaltar: [],
    texto: 'Un campo magnético y uno eléctrico en serie: así separa un sector de doble enfoque iones que difieren en centésimas de unidad de masa.',
  },
];
