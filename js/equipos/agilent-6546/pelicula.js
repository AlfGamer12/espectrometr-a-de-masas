// Guion del modo película del Agilent 6546 LC/Q-TOF (≈ 2,5 min). El texto de cada plano es a la vez subtítulo y guion de narración
// (audio opcional: audio/agilent-6546/01.mp3, 02.mp3…).
const EXT = ['lc', 'panel_frontal', 'torre_tof', 'chasis', 'bomba_primaria'];

export const PELICULA = [
  {
    intro: true, tarjeta: 6, dur: 15, modo: 'equipo', e1: 0, xray: false, foco: EXT, dir: [0.6, 0.38, 1], pad: 1.05, trans: 0, orbita: -2.2, acercar: 0.06,
    texto: 'El Agilent 6546 es un espectrómetro cuadrupolo-tiempo de vuelo, un Q-TOF. Mide la masa de cada ion con un error inferior a una parte por millón, suficiente para proponer fórmulas moleculares.',
  },
  {
    cap: 'Cromatografía', titulo: 'El 1290 Infinity II', dur: 13, modo: 'equipo', e1: 0, foco: ['lc', 'carcasa_fuente'],
    dir: [0.3, 0.3, 1], pad: 1.45, orbita: 1.8, acercar: 0.05, resaltar: ['lc'],
    texto: 'A la izquierda, el cromatógrafo 1290 Infinity II separa la muestra a alta presión. El eluyente entra en la fuente con un caudal de hasta dos mililitros por minuto.',
  },
  {
    cap: 'Arquitectura', titulo: 'Vista explosionada', dur: 14, modo: 'equipo', e1: 1, foco: ['camara_vacio', 'bombas_turbo', 'torre_tof', 'electronica', 'adc', 'bomba_primaria', 'chasis'],
    dir: [0.75, 0.6, 0.85], pad: 1.1, trans: 3.0, orbita: -3, resaltar: [],
    texto: 'Sin paneles aparece la cámara de vacío, con la fuente en un extremo y las bombas turbomoleculares debajo. Encima, la torre del tubo de vuelo da al equipo casi dos metros de altura.',
  },
  {
    cap: 'Fuente de iones', titulo: 'Agilent Jet Stream', dur: 17, modo: 'analizador', e2: 0.3, xray: false, foco: ['nebulizador_ajs', 'nebulizador_referencia', 'camara_spray', 'capilar'],
    dir: [0.3, 0.45, 1], pad: 1.35, trans: 3.0, orbita: 4, acercar: 0.07, resaltar: ['nebulizador_ajs', 'nebulizador_referencia'],
    texto: 'El electrospray se rodea de nitrógeno a unos trescientos cincuenta grados. Este gas envolvente confina el chorro y acelera la desolvatación. Un segundo nebulizador pulveriza sin pausa los compuestos de masa de referencia.',
  },
  {
    cap: 'Entrada al vacío', titulo: 'Capilar dieléctrico y skimmer', dur: 15, modo: 'analizador', e2: 0.4, xray: false, foco: ['capilar', 'skimmer', 'octopolo'],
    dir: [0.35, 0.45, 1], pad: 1.35, orbita: -3.5, acercar: 0.06, resaltar: ['capilar', 'skimmer'],
    texto: 'El capilar dieléctrico conduce los iones al vacío y permite invertir la polaridad casi al instante. El skimmer los separa del gas, y el octopolo los guía a través de las etapas de vacío.',
  },
  {
    cap: 'MS/MS', titulo: 'Cuadrupolo y celda hexapolar', dur: 16, modo: 'analizador', e2: 0.4, xray: true, foco: ['cuadrupolo', 'celda_colision'],
    dir: [0.35, 0.45, 1], pad: 1.25, orbita: 3.5, acercar: 0.06, resaltar: ['cuadrupolo', 'hexapolo'],
    texto: 'En modo MS el cuadrupolo deja pasar todas las masas. En MS/MS aísla un precursor, que se fragmenta en la celda hexapolar al chocar con nitrógeno. Un campo axial vacía la celda entre espectro y espectro.',
  },
  {
    cap: 'Tiempo de vuelo', titulo: 'Slicer y pulsador', dur: 15, modo: 'analizador', e2: 0.3, xray: true, foco: ['lente_enfoque', 'slicer', 'pulsador'],
    dir: [0.6, 0.4, 1], pad: 1.4, orbita: -3, acercar: 0.06, resaltar: ['slicer', 'pulsador'],
    texto: 'Una lente aplana el haz y el slicer, una serie de rendijas, elimina los iones con demasiada velocidad vertical. El pulsador los lanza hacia la torre unas catorce mil veces por segundo.',
  },
  {
    cap: 'Tiempo de vuelo', titulo: 'Un tubo que no se dilata', dur: 16, modo: 'analizador', e2: 0.2, xray: true, foco: ['tubo_vuelo', 'espejo_iones', 'pulsador', 'detector'],
    dir: [1, 0.2, 0.6], pad: 1.25, trans: 3.0, orbita: 2.5, acercar: 0.05, resaltar: ['tubo_vuelo', 'espejo_iones'],
    texto: 'Los iones suben por el tubo, se reflejan en el espejo de dos etapas y regresan; los más ligeros llegan antes. Su aleación apenas se dilata: tres grados mueven la masa menos de una parte por millón.',
  },
  {
    cap: 'Detección', titulo: 'Digitalizador de doble ganancia', dur: 15, modo: 'analizador', e2: 0.4, xray: true, foco: ['detector', 'pulsador'],
    dir: [1, 0.4, 0.8], pad: 1.7, orbita: -3.5, acercar: 0.06, resaltar: ['detector'],
    texto: 'El detector convierte cada ion en electrones y luego en luz, que mide un fotomultiplicador. Dos digitalizadores, de ganancia alta y baja, se combinan para cubrir cinco órdenes de magnitud.',
  },
  {
    cap: 'Simulación', titulo: 'Masa de referencia y Auto MS/MS', dur: 21, modo: 'analizador', e2: 0, xray: true, sim: true, ctl: { modo: 'ms', lock: 'on', vel: '2' },
    foco: ['nebulizador_ajs', 'cuadrupolo', 'pulsador', 'tubo_vuelo', 'espejo_iones'], dir: [0.9, 0.4, 0.8], pad: 0.9, resaltar: [],
    eventos: [{ t: 7.5, ctl: { lock: 'off' } }, { t: 14, ctl: { lock: 'on', modo: 'msms' } }],
    texto: 'Con la masa de referencia activa, el error queda por debajo de una parte por millón. Sin corrección, el eje de masas deriva. En Auto MS/MS, el cuadrupolo aísla un precursor y aparecen sus fragmentos.',
  },
  {
    cap: 'Servicios', titulo: 'Cinco etapas de vacío', dur: 15, modo: 'equipo', e1: 1, sim: false, xray: false,
    foco: ['camara_vacio', 'bombas_turbo', 'bomba_primaria', 'electronica'], dir: [0.6, 0.75, -0.8], pad: 1.3, trans: 3.2, orbita: -3,
    resaltar: ['camara_vacio', 'bombas_turbo', 'bomba_primaria', 'linea_vacio', 'linea_gases'],
    texto: 'Dos bombas turbomoleculares y una primaria mantienen cinco etapas de vacío, hasta una diezmillonésima de torr en el tiempo de vuelo. El nitrógeno alimenta la fuente y la celda de colisión.',
  },
  {
    dur: 9, modo: 'equipo', e1: 0, foco: EXT, dir: [0.6, 0.38, 1], pad: 1.05, trans: 3.0, orbita: -2, resaltar: [],
    texto: 'Separar, seleccionar, fragmentar y medir la masa exacta: así identifica un Q-TOF las moléculas de una muestra.',
  },
];
