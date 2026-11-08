// Guion del modo película del Shimadzu LCMS-8060NX (≈ 3 min). El texto de cada plano es a la vez subtítulo y guion de narración
// (audio opcional: audio/shimadzu-lcms8060/01.mp3, 02.mp3…).
const EXT = ['lc', 'torre_fuente', 'carcasa_superior', 'chasis', 'bomba_rotatoria', 'panel_frontal'];
const EJE = ['sonda_esi', 'q1', 'celda_multipolo', 'q3', 'multiplicador'];
// El cromatograma simulado empieza a los 12 s para que los tres picos (cafeína, verapamilo, reserpina) eluyan dentro del plano.
const inicioMRM = (app) => { const s = app.sim; s.t = 12; s.trazas = s.trazas.map(() => []); };

export const PELICULA = [
  {
    intro: true, tarjeta: 6, dur: 17, modo: 'equipo', e1: 0, xray: false, foco: EXT, dir: [0.55, 0.42, 0.9], pad: 1.1, trans: 0, orbita: -2.2, acercar: 0.06,
    texto: 'El Shimadzu LCMS-8060NX es un triple cuadrupolo acoplado a cromatografía de líquidos. Ioniza los compuestos a presión atmosférica, selecciona un precursor, lo fragmenta y detecta un ion producto.',
  },
  {
    cap: 'Introducción de muestra', titulo: 'Del cromatógrafo a la sonda', dur: 16, modo: 'equipo', e1: 0, xray: true, foco: ['lc_horno', 'valvula_desvio', 'torre_fuente'],
    dir: [0.4, 0.4, 1], pad: 1.2, orbita: 1.8, acercar: 0.05, resaltar: ['lc_horno', 'tubo_peek', 'valvula_desvio', 'sonda_esi'],
    texto: 'El eluyente sale de la columna por un fino tubo de PEEK. La válvula de desvío envía a desecho el frente de sales, y el resto llega a la sonda, que entra verticalmente en la unidad de ionización.',
  },
  {
    cap: 'Arquitectura', titulo: 'Vista explosionada', dur: 14, modo: 'equipo', e1: 1, xray: false,
    foco: ['torre_fuente', 'camara_vacio', 'bomba_turbo', 'generadores_rf', 'placa_principal', 'chasis'],
    dir: [0.35, 0.95, 0.75], pad: 1.1, trans: 3.0, orbita: -3, resaltar: [],
    texto: 'Sin los paneles aparece el interior: la unidad de ionización a la izquierda, la cámara de vacío con el analizador, la bomba turbomolecular y la electrónica de los cuadrupolos.',
  },
  {
    cap: 'Fuente de iones', titulo: 'Electrospray y desolvatación', dur: 19, modo: 'analizador', e2: 0, xray: false, foco: ['sonda_esi', 'bloque_calefactor', 'linea_desolvatacion'],
    dir: [0.45, 0.35, 1], pad: 1.4, trans: 3.0, orbita: 3.5, acercar: 0.07, resaltar: ['sonda_esi', 'linea_desolvatacion'],
    texto: 'Una alta tensión en el capilar de la sonda forma un aerosol de gotas cargadas. Los gases calientes evaporan el disolvente y liberan los iones. La pulverización es ortogonal: solo los iones entran en el capilar calefactado que lleva al vacío.',
  },
  {
    cap: 'Óptica iónica', titulo: 'Bombeo diferencial y guías de iones', dur: 15, modo: 'analizador', e2: 0.5, xray: false, foco: ['uf_qarray', 'skimmer', 'uf_lens', 'tabiques'],
    dir: [0.4, 0.45, 1], pad: 1.2, orbita: -3, acercar: 0.06, resaltar: ['uf_qarray', 'skimmer', 'uf_lens'],
    texto: 'La presión baja por etapas. En la primera cámara, a unos cien pascales, la guía UF Qarray enfoca los iones y deja escapar el gas. Tras el skimmer, la guía multipolar UF Lens lleva el haz al alto vacío.',
  },
  {
    cap: 'Analizador', titulo: 'Q1: el ion precursor', dur: 16, modo: 'analizador', e2: 0.5, xray: false, foco: ['q1_prebarras', 'q1'],
    dir: [0.3, 0.5, 1], pad: 1.3, orbita: 3, acercar: 0.05, resaltar: ['q1_prebarras', 'q1'],
    texto: 'El primer cuadrupolo, de barras hiperbólicas de molibdeno, deja pasar solo el ion precursor. Las pre-barras, solo con radiofrecuencia, suavizan el campo de entrada y retienen la contaminación.',
  },
  {
    cap: 'Celda de colisión', titulo: 'Fragmentación con argón', dur: 16, modo: 'analizador', e2: 0.5, xray: false, foco: ['celda_carcasa', 'celda_multipolo'],
    dir: [0.3, 0.5, 1], pad: 1.35, orbita: -3, acercar: 0.05, resaltar: ['celda_carcasa', 'celda_multipolo'],
    texto: 'En la celda de colisión, el precursor choca con átomos de argón y se fragmenta. Su geometría estrechada la vacía con gran rapidez, y así el equipo alterna transiciones sin interferencias.',
  },
  {
    cap: 'Detector', titulo: 'Q3 y dínodo de conversión', dur: 17, modo: 'analizador', e2: 0.5, xray: true, foco: ['q3', 'dinodo_conversion', 'multiplicador'],
    dir: [0.4, 0.45, 1], pad: 1.2, orbita: 3, acercar: 0.05, resaltar: ['q3_prebarras', 'q3', 'dinodo_conversion', 'multiplicador'],
    texto: 'El tercer cuadrupolo selecciona un ion producto, que se desvía hacia el dínodo de conversión, fuera del eje. El multiplicador amplifica los electrones secundarios. Precursor y producto definen una transición MRM.',
  },
  {
    cap: 'Simulación', titulo: 'Tres transiciones MRM', dur: 18, modo: 'analizador', e2: 0, xray: true, sim: true, ctl: { modo: 'mrm', ce: '35', velocidad: '2' },
    foco: EJE, dir: [0.3, 0.5, 1], pad: 0.55, resaltar: [], accion: inicioMRM,
    texto: 'En modo MRM el equipo alterna entre tres transiciones cada pocos milisegundos. Cafeína, verapamilo y reserpina dibujan cada una su propio cromatograma a medida que eluyen.',
  },
  {
    cap: 'Simulación', titulo: 'Energía de colisión', dur: 22, modo: 'analizador', e2: 0, xray: true, sim: true, ctl: { modo: 'producto', compuesto: 'reserpina', ce: '20', velocidad: '1' },
    foco: EJE, dir: [0.3, 0.5, 1], pad: 0.55, trans: 1.5, resaltar: [],
    eventos: [{ t: 15.5, ctl: { ce: '50' } }],
    texto: 'En el barrido de iones producto, Q1 fija la reserpina y Q3 recorre sus fragmentos. A veinte voltios de energía de colisión domina el precursor intacto; a cincuenta casi desaparece y dominan los fragmentos.',
  },
  {
    cap: 'Servicios', titulo: 'Vacío y gases', dur: 15, modo: 'equipo', e1: 1, xray: true, sim: false,
    foco: ['bomba_turbo', 'bomba_rotatoria', 'camara_vacio', 'linea_gases'], dir: [0.55, 0.5, 0.9], pad: 1.1, trans: 3.2, orbita: -2.5,
    resaltar: ['bomba_turbo', 'bomba_rotatoria', 'linea_vacio_previo', 'linea_gases'],
    texto: 'Una única bomba turbomolecular de tres entradas bombea la segunda cámara y el alto vacío; la rotatoria evacúa la primera y recoge el escape. El nitrógeno y el aire alimentan la fuente, y el argón, la celda.',
  },
  {
    dur: 10, modo: 'equipo', e1: 0, xray: false, foco: EXT, dir: [0.55, 0.42, 0.9], pad: 1.1, trans: 3.0, orbita: -2, resaltar: [],
    texto: 'Separar, seleccionar, fragmentar y volver a seleccionar: así cuantifica un triple cuadrupolo compuestos a nivel de traza.',
  },
];
