// Guion del modo película del Bruker timsTOF Pro (≈ 2,5 min). El texto de cada plano es a la vez subtítulo y guion de narración
// (audio opcional: audio/bruker-timstof/01.mp3, 02.mp3…).
const EXT = ['panel_frontal', 'torre_tof', 'nanolc', 'chasis'];

export const PELICULA = [
  {
    intro: true, tarjeta: 6, dur: 19, modo: 'equipo', e1: 0, xray: false, foco: EXT, dir: [0.75, 0.4, 1], pad: 1.05, trans: 0, orbita: -2.2, acercar: 0.06,
    texto: 'El timsTOF Pro de Bruker es un espectrómetro de masas para proteómica. Combina una separación por movilidad iónica atrapada, el TIMS, con un cuadrupolo y un tiempo de vuelo. Cada ion queda descrito por cuatro magnitudes: tiempo de retención, movilidad, masa e intensidad.',
  },
  {
    cap: 'Cromatografía', titulo: 'Del nanoElute a la fuente', dur: 14, modo: 'equipo', e1: 0, foco: ['nanolc', 'panel_frontal', 'captivespray'],
    dir: [0.25, 0.3, 1], pad: 1.2, orbita: 1.8, acercar: 0.05, resaltar: ['nanolc'],
    texto: 'El cromatógrafo nanoElute separa los péptidos a caudales de nanolitros por minuto, con presiones de unos mil bares. La columna desemboca en la fuente, a media altura en el frontal.',
  },
  {
    cap: 'Arquitectura', titulo: 'Vista explosionada', dur: 15, modo: 'equipo', e1: 1, foco: ['camara_vacio', 'bombas_turbo', 'bomba_rotatoria', 'electronica', 'digitalizador', 'torre_tof', 'chasis'],
    dir: [0.8, 0.6, 0.85], pad: 1.1, trans: 3.0, orbita: -3, resaltar: [],
    texto: 'Sin los paneles aparece la cámara de vacío en el centro, con las bombas turbomoleculares a un lado y la electrónica de radiofrecuencia al otro. La torre posterior aloja el tubo de vuelo.',
  },
  {
    cap: 'Fuente', titulo: 'CaptiveSpray y deflexión', dur: 18, modo: 'analizador', e2: 0.4, xray: false, foco: ['captivespray', 'capilar', 'deflector'],
    dir: [1, 0.45, 0.45], pad: 1.15, trans: 3.0, orbita: 3.5, acercar: 0.07, resaltar: ['captivespray', 'capilar', 'deflector'],
    texto: 'En el emisor CaptiveSpray, un electrospray a unos mil seiscientos voltios ioniza los péptidos. El capilar de vidrio lleva los iones al vacío y una placa los desvía noventa grados: las gotas y las moléculas neutras siguen rectas.',
  },
  {
    cap: 'Movilidad iónica', titulo: 'El túnel TIMS', dur: 17, modo: 'analizador', e2: 0.4, xray: true, foco: ['tims_acumulacion', 'tims_analisis', 'embudo_entrada', 'embudo_salida'],
    dir: [1, 0.5, 0.3], pad: 1.15, orbita: -3.5, acercar: 0.06, resaltar: ['tims_acumulacion', 'tims_analisis'],
    texto: 'En el túnel TIMS, el gas empuja a los iones hacia la salida y un campo eléctrico los frena. Cada ion se detiene donde ambas fuerzas se igualan. Al bajar el campo eluyen primero los más voluminosos, los de menor movilidad.',
  },
  {
    cap: 'Movilidad iónica', titulo: 'Acumulación en paralelo', dur: 16, modo: 'analizador', e2: 0.6, xray: true, foco: ['tims_acumulacion', 'tims_analisis'],
    dir: [1, 0.6, -0.2], pad: 1.4, orbita: 3, acercar: 0.05, resaltar: ['tims_acumulacion'],
    eventos: [{ t: 7, resaltar: ['tims_analisis'] }],
    texto: 'El túnel tiene dos secciones en serie. Mientras la primera acumula los iones que llegan, la segunda analiza los del ciclo anterior. Casi ningún ion se pierde, y una rampa típica dura cien milisegundos.',
  },
  {
    cap: 'PASEF', titulo: 'Cuadrupolo y celda de colisión', dur: 16, modo: 'analizador', e2: 0.4, xray: true, foco: ['guia_transferencia', 'cuadrupolo', 'celda_colision'],
    dir: [1, 0.5, 0.3], pad: 1.05, orbita: -3, acercar: 0.06, resaltar: ['cuadrupolo', 'celda_multipolo'],
    texto: 'Cada precursor sale del TIMS en uno o dos milisegundos. El cuadrupolo salta de uno a otro en menos de un milisegundo y la celda de colisión los fragmenta. Así se secuencian unos diez precursores por rampa.',
  },
  {
    cap: 'Tiempo de vuelo', titulo: 'Acelerador ortogonal y reflectrón', dur: 18, modo: 'analizador', e2: 0.3, xray: true, foco: ['pusher', 'tubo_tof', 'reflectron', 'detector_mcp'],
    dir: [1, 0.3, 0.6], pad: 1.2, orbita: 2.5, acercar: 0.05, resaltar: ['pusher', 'reflectron', 'detector_mcp'],
    texto: 'El acelerador ortogonal empuja los iones hacia la torre con pulsos a unos diez kilohercios. Suben al reflectrón de dos etapas y vuelven al detector de microcanales: una trayectoria en uve. La resolución supera treinta y cinco mil.',
  },
  {
    cap: 'Simulación', titulo: 'Mapa de masa y movilidad', dur: 22, modo: 'analizador', e2: 0, xray: true, sim: true, ctl: { muestra: 'peptidos', modo: 'ms1', rampa: '100', velocidad: '1' },
    foco: ['captivespray', 'tims_analisis', 'cuadrupolo', 'tubo_tof', 'reflectron'], dir: [1, 0.35, 0.3], pad: 1.0, resaltar: [],
    eventos: [{ t: 13, ctl: { modo: 'pasef' } }],
    texto: 'En el mapa de masa frente a movilidad, los péptidos con dos y tres cargas forman bandas separadas, y los contaminantes con una carga quedan aparte. Con PASEF activo, los rectángulos marcan los precursores que el cuadrupolo selecciona en cada rampa.',
  },
  {
    cap: 'Servicios', titulo: 'Vacío y electrónica', dur: 14, modo: 'equipo', e1: 1, sim: false, xray: true,
    foco: ['camara_vacio', 'bombas_turbo', 'bomba_rotatoria', 'electronica'], dir: [0.75, 0.5, 0.65], pad: 1.2, trans: 3.2, orbita: -3,
    resaltar: ['camara_vacio', 'bombas_turbo', 'bomba_rotatoria', 'electronica'],
    texto: 'Los embudos y el TIMS trabajan a dos o tres milibares, y el resto del analizador en alto vacío. La electrónica sincroniza en tiempo real la rampa del TIMS, el cuadrupolo y el acelerador ortogonal.',
  },
  {
    dur: 9, modo: 'equipo', e1: 0, foco: EXT, dir: [0.75, 0.4, 1], pad: 1.05, trans: 3.0, orbita: -2, resaltar: [],
    texto: 'Movilidad, masa y fragmentos en una sola rampa: así describe el timsTOF cada péptido de una muestra compleja.',
  },
];
