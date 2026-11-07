// Guion del modo película del Bruker microflex LRF (≈ 2,5 min). El texto de cada plano es a la vez subtítulo y guion de narración.
// El haz láser del analizador lo gobierna la simulación; aquí se enciende en el plano de la desorción y cineReset lo apaga.
const haz = (on) => (app) => { const b = app.eq.analyzer && app.eq.analyzer.laser; if (b && !app.S.simOn) b.material.opacity = on ? 0.85 : 0; };
const EXT = ['panel_frontal', 'tapa_superior', 'tapa_carga', 'chasis', 'pc'];
const SIMF = ['diana', 'tubo_vuelo', 'reflector', 'detector_lineal', 'detector_reflector'];

export const PELICULA = [
  {
    intro: true, tarjeta: 6, dur: 16, modo: 'equipo', e1: 0, xray: false, foco: EXT, dir: [0.7, 0.35, 1], pad: 1.05, trans: 0, orbita: -2.2, acercar: 0.06,
    accion: haz(false),
    texto: 'El Bruker microflex LRF es un espectrómetro MALDI de tiempo de vuelo de sobremesa. Una sola torre reúne la fuente, un tubo de vuelo vertical, el reflector y dos detectores. Un PC controla la adquisición.',
  },
  {
    cap: 'Muestra', titulo: 'Matriz y diana', dur: 17, modo: 'analizador', e2: 0.3, xray: false, foco: ['diana', 'mesa_xy'], dir: [0.6, -0.4, 1], pad: 1.5,
    trans: 3.0, orbita: 3, acercar: 0.06, accion: haz(false), resaltar: ['diana'],
    texto: 'La muestra se mezcla con una matriz que absorbe en el ultravioleta, como el ácido sinapínico para proteínas, y se deposita en una diana de acero de noventa y seis posiciones. Al secarse, matriz y analito cocristalizan.',
  },
  {
    cap: 'Introducción de muestra', titulo: 'La esclusa de vacío', dur: 16, modo: 'equipo', e1: 0.6, xray: true, foco: ['tapa_carga', 'esclusa', 'camara_fuente'],
    dir: [0.7, 0.5, 1], pad: 1.3, trans: 3.0, orbita: -3, acercar: 0.05, accion: haz(false), resaltar: ['tapa_carga', 'esclusa', 'camara_fuente'],
    texto: 'La diana entra bajo la tapa superior. Al pulsar TARGET IN solo se bombea la esclusa, y la diana pasa a la fuente sin romper el alto vacío del tubo de vuelo. En unos dos minutos y medio el equipo está listo.',
  },
  {
    cap: 'Láser', titulo: 'Láser de nitrógeno y fibra óptica', dur: 13, modo: 'equipo', e1: 1, xray: true, foco: ['laser', 'fibra_optica', 'camara_fuente'],
    dir: [0.8, 0.5, 1], pad: 1.3, trans: 3.0, orbita: 3, acercar: 0.05, accion: haz(false), resaltar: ['laser', 'fibra_optica'],
    texto: 'Sin la carcasa aparece el láser de nitrógeno. Emite pulsos de tres nanosegundos a trescientos treinta y siete nanómetros, que una fibra óptica lleva hasta la fuente.',
  },
  {
    cap: 'Fuente MALDI', titulo: 'Desorción e ionización', dur: 13, modo: 'analizador', e2: 0.15, xray: true, foco: ['optica_laser', 'diana', 'electrodos_fuente'],
    dir: [0.6, 0.45, 1], pad: 1.25, trans: 3.0, orbita: -3, acercar: 0.06, accion: haz(true), resaltar: ['optica_laser'],
    texto: 'Un cabezal de espejos enfoca el haz sobre el spot. La matriz absorbe la energía, se vaporiza y arrastra al analito, que se ioniza sobre todo por protonación.',
  },
  {
    cap: 'Fuente MALDI', titulo: 'Extracción retardada', dur: 18, modo: 'analizador', e2: 0.5, xray: false, foco: ['diana', 'electrodos_fuente', 'lente', 'pcis'],
    dir: [0.6, 0.5, 1], pad: 1.55, orbita: 3, acercar: 0.05, accion: haz(false), resaltar: ['electrodos_fuente', 'lente', 'pcis'],
    texto: 'La diana está a veinte kilovoltios. Tras un retardo de unos ciento cincuenta nanosegundos, la placa P dos se conmuta y crea el campo que acelera los iones. El retardo compensa la dispersión de velocidades. La lente focaliza el haz.',
  },
  {
    cap: 'Tiempo de vuelo', titulo: 'Vuelo libre', dur: 18, modo: 'analizador', e2: 0, xray: true, foco: ['tubo_vuelo', 'electrodos_fuente', 'detector_lineal'],
    dir: [1, 0.25, 0.6], pad: 1.1, trans: 3.0, orbita: -2.5, acercar: 0.05, resaltar: ['tubo_vuelo'],
    texto: 'Todos los iones salen con la misma energía cinética, así que su velocidad depende de la masa. En el tubo se separan: un ion de masa mil recorre un metro en unos dieciséis microsegundos; uno de diez mil, en unos cincuenta y uno.',
  },
  {
    cap: 'Tiempo de vuelo', titulo: 'Reflector y detectores', dur: 19, modo: 'analizador', e2: 0.4, xray: true,
    foco: ['reflector', 'detector_lineal'], dir: [1, 0.35, 0.8], pad: 1.5, orbita: 3, acercar: 0.05,
    resaltar: ['reflector', 'detector_lineal'],
    texto: 'El reflector frena los iones y los devuelve. Los más energéticos penetran más y recorren más camino, y llegan a la vez que los lentos. Dos placas de microcanales en cada detector convierten cada impacto en un pulso de menos de un nanosegundo.',
  },
  {
    cap: 'Simulación', titulo: 'Lineal frente a reflectrón', dur: 22, modo: 'analizador', e2: 0, xray: true, sim: true,
    ctl: { muestra: 'peptidos', modo: 'lineal', de: 'on', velocidad: '1' }, foco: SIMF, dir: [1, 0.2, 0.55], pad: 1.1, resaltar: [],
    eventos: [{ t: 11, ctl: { modo: 'reflector' } }],
    texto: 'La suma de cientos de disparos forma el espectro. En modo lineal, los picos de los péptidos de calibración son anchos. En modo reflectrón se estrechan y aparece el patrón isotópico de cada péptido.',
  },
  {
    cap: 'Servicios', titulo: 'Vacío y alta tensión', dur: 18, modo: 'equipo', e1: 1, sim: false, xray: true,
    foco: ['bomba_turbo', 'bomba_membrana', 'fuentes_alta_tension', 'generador_pulsos'], dir: [0.8, 0.5, 1], pad: 1.15, trans: 3.2, orbita: -3, accion: haz(false),
    resaltar: ['bomba_turbo', 'bomba_membrana', 'linea_vacio_previo', 'fuentes_alta_tension', 'generador_pulsos'],
    texto: 'Una bomba turbomolecular de setenta litros por segundo mantiene el alto vacío de la fuente y el tubo. Una bomba de membrana sin aceite evacúa la esclusa. Las fuentes de alta tensión y el generador de pulsos gobiernan la extracción.',
  },
  {
    dur: 11, modo: 'equipo', e1: 0, foco: EXT, dir: [0.7, 0.35, 1], pad: 1.05, trans: 3.0, orbita: -2, resaltar: [],
    texto: 'Un disparo láser, unas decenas de microsegundos de vuelo y un espectro: así mide masas moleculares un MALDI de tiempo de vuelo.',
  },
];
