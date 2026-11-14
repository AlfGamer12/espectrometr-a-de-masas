// Recorrido guiado del Shimadzu UV-1900i.
export const RECORRIDO = [
  {
    titulo: 'Espectrofotometría UV-Vis',
    texto: 'El UV-1900i mide cuánta luz ultravioleta o visible absorbe una disolución a cada longitud de onda, de 190 a 1100 nm. Con la ley de Beer-Lambert, la absorbancia da la concentración. Se maneja desde la pantalla táctil o con el programa LabSolutions UV-Vis.',
    modo: 'equipo', e1: 0, xray: false, foco: ['base', 'carcasa_izq', 'carcasa_der', 'tapa_superior', 'panel_control', 'frontal'], resaltar: [],
  },
  {
    titulo: 'Compartimento de muestras y pantalla',
    texto: 'En el centro, bajo la tapa negra, está el compartimento de muestras; a la derecha, la pantalla táctil inclinada hacia el usuario y el lápiz. Los dos quedan del lado del operador. La tapa cerrada deja el compartimento a oscuras.',
    modo: 'equipo', e1: 0, xray: false, foco: ['tapa_muestras', 'panel_control', 'frontal'], dir: [-0.2, 0.75, 1], pad: 1.1,
    resaltar: ['tapa_muestras', 'panel_control'],
  },
  {
    titulo: 'Dos lámparas y un espejo conmutador',
    texto: 'La lámpara de deuterio cubre el ultravioleta y la halógena de wolframio, el visible y el infrarrojo cercano. Un espejo giratorio entre ambas envía a la rendija de entrada la luz de una u otra; el cambio se hace en la zona de 300–350 nm.',
    modo: 'analizador', e2: 0.15, xray: true, foco: ['casa_lamparas', 'lampara_d2', 'lampara_wi', 'espejo_conmutador'], dir: [-0.35, 0.9, 0.8], pad: 1.5,
    resaltar: ['lampara_d2', 'lampara_wi', 'espejo_conmutador'],
  },
  {
    titulo: 'Monocromador Czerny-Turner',
    texto: 'La luz entra por una rendija estrecha, un espejo cóncavo la vuelve paralela y la red de difracción la separa en colores. Un segundo espejo enfoca ese abanico sobre la rendija de salida. Al girar la red cambia la longitud de onda que sale.',
    modo: 'analizador', e2: 0, xray: true, foco: ['rendija_entrada', 'espejo_colimador', 'red_difraccion', 'espejo_focalizador', 'rendija_salida'], dir: [0.1, 1.1, 0.55], pad: 1.25,
    resaltar: ['rendija_entrada', 'espejo_colimador', 'red_difraccion', 'espejo_focalizador', 'rendija_salida'],
  },
  {
    titulo: 'Ancho de banda de 1 nm',
    texto: 'La anchura de la rendija de salida fija el ancho de banda espectral: 1 nm en el UV-1900i. La red LO-RAY-LIGH dispersa muy poca luz fuera de su dirección, de modo que la luz parásita no supera el 0,5 % a 198 nm. Tras la rendija, un filtro elimina los órdenes superiores de la red.',
    modo: 'analizador', e2: 0.35, xray: true, foco: ['red_difraccion', 'rendija_salida', 'filtro'], dir: [0.4, 0.8, 0.9], pad: 1.5,
    resaltar: ['red_difraccion', 'rendija_salida', 'filtro'],
  },
  {
    titulo: 'Doble haz',
    texto: 'La luz monocromática se divide en dos haces: uno atraviesa la cubeta de muestra y el otro la de referencia, con el disolvente puro. Al medir los dos a la vez, las fluctuaciones de la lámpara afectan por igual a ambos y se cancelan en el cociente I/I₀.',
    modo: 'analizador', e2: 0, xray: true, foco: ['espejos_planos', 'divisor_haz', 'portacubetas', 'cubetas'], dir: [0.1, 1.0, 0.75], pad: 1.25,
    resaltar: ['espejos_planos', 'divisor_haz', 'cubeta_muestra', 'cubeta_referencia'],
  },
  {
    titulo: 'Cubetas y fotodiodos',
    texto: 'Las cubetas de cuarzo tienen 10 mm de paso óptico y transmiten también el ultravioleta. Tras ellas, un fotodiodo de silicio por haz convierte la luz en corriente. El cociente de las dos señales es la transmitancia T, y A = −log T.',
    modo: 'analizador', e2: 0.3, xray: true, foco: ['portacubetas', 'cubetas', 'detectores'], dir: [0.45, 0.75, 1], pad: 1.4,
    resaltar: ['cubeta_muestra', 'cubeta_referencia', 'detectores'],
  },
  {
    titulo: 'Simulación: espectro y Beer-Lambert',
    texto: 'Barre el espectro de una disolución y observa la lámpara, la red y los dos haces. Cambia la concentración y el paso óptico: la absorbancia es proporcional a ambos. Aumenta el ancho de banda o la luz parásita para ver cómo se deforman el espectro y la recta de calibrado.',
    modo: 'analizador', e2: 0, xray: true, sim: true, foco: ['casa_lamparas', 'monocromador', 'divisor_haz', 'portacubetas', 'detectores'], dir: [0.05, 1.2, 0.5], pad: 1.0, resaltar: [],
  },
  {
    titulo: 'Electrónica y alimentación',
    texto: 'La fuente de alimentación da servicio a las lámparas y a la electrónica; la placa principal digitaliza las señales de los fotodiodos, mueve los motores de la red y del espejo conmutador y gobierna la pantalla táctil.',
    modo: 'equipo', e1: 1, xray: false, sim: false, foco: ['electronica', 'fuente_alimentacion', 'panel_control', 'sistema_optico'], dir: [0.6, 0.7, 0.9], pad: 1.05,
    resaltar: ['electronica', 'fuente_alimentacion', 'pantalla'],
  },
];
