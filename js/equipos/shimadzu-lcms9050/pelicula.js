// Guion del modo película del Shimadzu LCMS-9050 (≈ 2,5 min). El texto de cada plano es a la vez subtítulo y guion de narración
// (audio opcional: audio/shimadzu-lcms9050/01.mp3, 02.mp3…). El grupo del analizador está girado: su eje va hacia −z y el TOF cuelga hacia abajo.
const EXT = ['lc', 'panel_frontal', 'unidad_ionizacion', 'chasis', 'bomba_rotatoria'];

export const PELICULA = [
  {
    intro: true, tarjeta: 6, dur: 15, modo: 'equipo', e1: 0, xray: false, foco: EXT, dir: [0.75, 0.4, 1], pad: 1.05, trans: 0, orbita: -2.2, acercar: 0.06,
    texto: 'El Shimadzu LCMS-9050 es un Q-TOF: un cuadrupolo seguido de un analizador de tiempo de vuelo. Alcanza una resolución de cuarenta y cinco mil y un error de masa inferior a una parte por millón.',
  },
  {
    cap: 'Introducción de muestra', titulo: 'Nexera y unidad de ionización', dur: 14, modo: 'equipo', e1: 0, foco: ['lc', 'unidad_ionizacion', 'ventana_fuente'],
    dir: [0.5, 0.32, 1], pad: 1.05, orbita: 1.8, acercar: 0.05, resaltar: ['unidad_ionizacion'],
    texto: 'La torre Nexera separa la muestra por cromatografía de líquidos. El eluyente llega a la unidad de ionización, en lo alto del frontal, que admite electrospray, APCI o ambas a la vez.',
  },
  {
    cap: 'Arquitectura', titulo: 'Vista explosionada', dur: 13, modo: 'equipo', e1: 1, foco: ['camara_vacio', 'bombas_turbo', 'bomba_rotatoria', 'control_termico', 'electronica', 'chasis'],
    dir: [0.8, 0.55, 0.9], pad: 1.1, trans: 3.0, orbita: -3, resaltar: [],
    texto: 'Sin carcasa aparecen la cámara de vacío, las bombas turbomoleculares, la electrónica de alta tensión y el control térmico, que regula la temperatura del analizador.',
  },
  {
    cap: 'Fuente de iones', titulo: 'Sonda ESI y sub-interfaz', dur: 15, modo: 'analizador', e2: 0.3, xray: false, foco: ['sonda_esi', 'sub_interfaz', 'bloque_calefactor'],
    dir: [0.5, 0.45, 1], pad: 1.35, trans: 3.0, orbita: 4, acercar: 0.07, resaltar: ['sonda_esi', 'sub_interfaz'],
    texto: 'La sonda ESI calefactada pulveriza el eluyente y el bloque calefactor completa la desolvatación. Una sub-interfaz introduce yoduro sódico como calibrante sin tocar la línea de muestra.',
  },
  {
    cap: 'Óptica iónica', titulo: 'Herencia de los triple cuadrupolos', dur: 14, modo: 'analizador', e2: 0.4, xray: false, foco: ['linea_desolvatacion', 'uf_qarray', 'uf_lens'],
    dir: [1, 0.4, 0.25], pad: 1.35, orbita: -3.5, acercar: 0.06, resaltar: ['uf_qarray', 'uf_lens'],
    texto: 'La línea de desolvatación lleva los iones al vacío. La guía UF-Qarray y el UF-Lens, tomados de los triple cuadrupolos de Shimadzu, concentran el haz mientras la presión desciende.',
  },
  {
    cap: 'MS/MS', titulo: 'Q1 y UFsweeper', dur: 16, modo: 'analizador', e2: 0.4, xray: true, foco: ['q1', 'celda_colision'],
    dir: [1, 0.4, 0.25], pad: 1.25, orbita: 3.5, acercar: 0.06, resaltar: ['q1', 'celda_multipolo'],
    texto: 'El cuadrupolo transmite todo el rango o selecciona un precursor. En la celda UFsweeper el precursor choca con argón y se fragmenta. CE Spread aplica varias energías de colisión en un mismo espectro.',
  },
  {
    cap: 'Tiempo de vuelo', titulo: 'UFaccumulation y UFgrating', dur: 15, modo: 'analizador', e2: 0.4, xray: true, foco: ['uf_accumulation', 'acelerador'],
    dir: [1, 0.35, 0.3], pad: 1.6, orbita: -3, acercar: 0.06, resaltar: ['uf_accumulation', 'acelerador'],
    texto: 'UFaccumulation retiene los iones y los suelta en paquetes sincronizados con el acelerador. Su rejilla, la UFgrating, soporta varios kilovoltios sin deformarse y lanza los iones hacia el tubo.',
  },
  {
    cap: 'Tiempo de vuelo', titulo: 'UF-FlightTube e iRefTOF', dur: 21, modo: 'analizador', e2: 0.2, xray: true, foco: ['tubo_vuelo', 'acelerador', 'ireftof', 'detector_mcp'],
    dir: [1, 0.25, 0.7], pad: 1.05, trans: 3.0, orbita: 2.5, acercar: 0.05, resaltar: ['tubo_vuelo', 'ireftof'],
    eventos: [{ t: 10, resaltar: ['ireftof', 'detector_mcp'] }],
    texto: 'Los iones descienden por el tubo de vuelo, termostatizado: la exactitud se mantiene dentro de dos partes por millón durante setenta y dos horas. En el fondo, las placas apiladas del reflectrón iRefTOF crean un campo calculado como ideal y los devuelven hacia el detector.',
  },
  {
    cap: 'Polaridad', titulo: 'Cambio en seiscientos milisegundos', dur: 15, modo: 'analizador', e2: 0, xray: true, foco: ['sonda_esi', 'q1', 'celda_colision', 'acelerador'],
    dir: [1, 0.35, -0.3], pad: 0.9, orbita: 3, acercar: 0.05, resaltar: ['acelerador'],
    texto: 'Invertir varios kilovoltios deja una deriva en la alta tensión. La corrección UFstabilization la compensa, y el equipo pasa de iones positivos a negativos en seiscientos milisegundos.',
  },
  {
    cap: 'Simulación', titulo: 'Calibrante y DDA', dur: 21, modo: 'analizador', e2: 0, xray: true, sim: true, ctl: { modo: 'ms', lock: 'on', vel: '2' },
    foco: ['sonda_esi', 'q1', 'acelerador', 'tubo_vuelo', 'ireftof'], dir: [1, 0.3, 0.75], pad: 0.8, resaltar: [],
    eventos: [{ t: 7.5, ctl: { lock: 'off' } }, { t: 14, ctl: { lock: 'on', modo: 'msms' } }],
    texto: 'Con el calibrante, el error de masa queda por debajo de una parte por millón. Sin corrección aparece una deriva pequeña, porque el tubo está termostatizado. En modo DDA se aísla un precursor y aparecen sus fragmentos.',
  },
  {
    cap: 'Servicios', titulo: 'Vacío y control térmico', dur: 15, modo: 'equipo', e1: 1, sim: false, xray: false,
    foco: ['camara_vacio', 'bombas_turbo', 'bomba_rotatoria', 'control_termico'], dir: [0.75, 0.5, 1], pad: 1.2, trans: 3.2, orbita: -3,
    resaltar: ['camara_vacio', 'bombas_turbo', 'bomba_rotatoria', 'control_termico'],
    texto: 'Dos bombas turbomoleculares y una rotatoria mantienen el vacío. El control térmico sigue encendido aunque se ventee el equipo: el tubo tarda hasta tres días en recuperar el equilibrio.',
  },
  {
    dur: 9, modo: 'equipo', e1: 0, foco: EXT, dir: [0.75, 0.4, 1], pad: 1.05, trans: 3.0, orbita: -2, resaltar: [],
    texto: 'Temperatura estable, masa exacta y cambio rápido de polaridad: así trabaja el LCMS-9050.',
  },
];
