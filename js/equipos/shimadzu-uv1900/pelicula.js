// Guion del modo película del Shimadzu UV-1900i (≈ 2 min 40 s). El texto de cada plano es a la vez subtítulo y guion de narración
// (audio opcional: audio/shimadzu-uv1900/01.mp3, 02.mp3…).
const EXT = ['base', 'carcasa_izq', 'carcasa_der', 'tapa_superior', 'panel_control', 'frontal'];
const OPT = ['casa_lamparas', 'monocromador', 'divisor_haz', 'portacubetas', 'detectores'];

export const PELICULA = [
  {
    intro: true, tarjeta: 6, dur: 12, modo: 'equipo', e1: 0, xray: false, foco: EXT, dir: [-0.7, 0.5, 1], pad: 1.05, trans: 0, orbita: 2.2, acercar: 0.05,
    texto: 'El Shimadzu UV-1900i es un espectrofotómetro ultravioleta-visible de doble haz. Mide cuánta luz absorbe una disolución a cada longitud de onda, de 190 a 1100 nanómetros.',
  },
  {
    cap: 'El equipo', titulo: 'Muestras y pantalla táctil', dur: 12, modo: 'equipo', e1: 0, xray: false, foco: ['tapa_muestras', 'panel_control', 'frontal'],
    dir: [-0.15, 0.8, 1], pad: 1.15, orbita: -1.6, acercar: 0.05, resaltar: ['tapa_muestras', 'panel_control'],
    texto: 'Bajo la tapa central está el compartimento de muestras. A la derecha, la pantalla táctil permite trabajar sin ordenador, con el dedo o con el lápiz del frontal.',
  },
  {
    cap: 'Arquitectura', titulo: 'Vista explosionada', dur: 13, modo: 'equipo', e1: 1, foco: ['sistema_optico', 'electronica', 'fuente_alimentacion', 'tapa_superior'],
    dir: [-0.6, 0.75, 0.85], pad: 1.2, trans: 3.0, orbita: 3, resaltar: [],
    texto: 'Sin la carcasa aparece el sistema óptico: a la izquierda, las lámparas y el monocromador; en el centro, el compartimento de muestras; a la derecha, los detectores y la electrónica.',
  },
  {
    cap: 'Fuentes de luz', titulo: 'Deuterio y wolframio', dur: 14, modo: 'analizador', e2: 0.15, xray: true, foco: ['casa_lamparas', 'lampara_d2', 'lampara_wi', 'espejo_conmutador'],
    dir: [-0.35, 0.9, 0.8], pad: 1.35, trans: 3.0, orbita: 3, acercar: 0.06, resaltar: ['lampara_d2', 'lampara_wi', 'espejo_conmutador'],
    texto: 'La lámpara de deuterio emite en el ultravioleta y la halógena de wolframio en el visible. Un espejo giratorio elige cuál de las dos entra en el monocromador.',
  },
  {
    cap: 'Monocromador', titulo: 'Czerny-Turner', dur: 16, modo: 'analizador', e2: 0, xray: true,
    foco: ['rendija_entrada', 'espejo_colimador', 'red_difraccion', 'espejo_focalizador', 'rendija_salida'], dir: [0.1, 1.1, 0.55], pad: 1.25, orbita: -2.5, acercar: 0.05,
    resaltar: ['rendija_entrada', 'espejo_colimador', 'red_difraccion', 'espejo_focalizador', 'rendija_salida'],
    texto: 'Un espejo cóncavo vuelve paralela la luz de la rendija de entrada, la red de difracción la separa en colores y otro espejo enfoca el abanico sobre la rendija de salida. Girando la red se elige la longitud de onda.',
  },
  {
    cap: 'Doble haz', titulo: 'Muestra y referencia', dur: 14, modo: 'analizador', e2: 0, xray: true, foco: ['espejos_planos', 'divisor_haz', 'portacubetas', 'cubetas', 'detectores'],
    dir: [0.2, 1.0, 0.8], pad: 1.25, orbita: 2.5, acercar: 0.05, resaltar: ['divisor_haz', 'cubeta_muestra', 'cubeta_referencia', 'detectores'],
    texto: 'La luz monocromática se divide en dos haces. Uno atraviesa la muestra y el otro el disolvente puro. Un fotodiodo de silicio mide cada haz, y su cociente da la transmitancia.',
  },
  {
    cap: 'Simulación', titulo: 'Espectro del permanganato', dur: 20, modo: 'analizador', e2: 0, sim: true, ctl: { muestra: 'kmno4', conc: '0.2', paso: '1', rendija: '1', parasita: '0.0005' },
    foco: OPT, dir: [0.05, 1.2, 0.5], pad: 1.0, resaltar: [],
    eventos: [{ t: 12, ctl: { conc: '0.4' } }],
    texto: 'Al barrer el espectro, la red gira y cambia el color de la luz. El permanganato absorbe en el verde, con máximos a 526 y 546 nanómetros. Al duplicar la concentración, la absorbancia se duplica: es la ley de Beer-Lambert.',
  },
  {
    cap: 'Simulación', titulo: 'Ancho de banda y luz parásita', dur: 20, modo: 'analizador', e2: 0, sim: true, ctl: { muestra: 'kmno4', conc: '0.8', paso: '1', rendija: '10', parasita: '0.0005' },
    foco: OPT, dir: [0.05, 1.2, 0.5], pad: 1.0, resaltar: [],
    eventos: [{ t: 10, ctl: { rendija: '1', parasita: '0.02' } }],
    texto: 'Con diez nanómetros de ancho de banda los picos se funden y pierden altura; con uno, el espectro se parece al real. Si la luz parásita aumenta, las absorbancias altas quedan por debajo de su valor y la recta de calibrado se curva.',
  },
  {
    cap: 'Electrónica', titulo: 'Fuente y placa principal', dur: 12, modo: 'equipo', e1: 1, sim: false, xray: false,
    foco: ['electronica', 'fuente_alimentacion', 'panel_control', 'sistema_optico'], dir: [0.6, 0.7, 0.9], pad: 1.05, trans: 3.2, orbita: -3,
    resaltar: ['electronica', 'fuente_alimentacion', 'pantalla'],
    texto: 'La fuente alimenta las lámparas y la electrónica. La placa principal digitaliza las señales de los detectores y mueve la red y el espejo conmutador.',
  },
  {
    dur: 9, modo: 'equipo', e1: 0, foco: EXT, dir: [-0.7, 0.5, 1], pad: 1.05, trans: 3.0, orbita: -2, resaltar: [],
    texto: 'Luz, una red de difracción y dos haces: así convierte un espectrofotómetro la absorción de luz en una concentración.',
  },
];
