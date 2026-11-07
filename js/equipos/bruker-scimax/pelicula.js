// Guion del modo película del Bruker scimaX MRMS (≈ 2,5 min). El texto de cada plano es a la vez subtítulo y guion de narración
// (audio opcional: audio/bruker-scimax/01.mp3, 02.mp3…).
const EXT = ['panel_frontal', 'iman', 'carcasa_fuente', 'chasis', 'compresor_helio'];
// La simulación ilumina los electrodos de excitación; al salir de ella se apagan.
const apagarExc = (app) => { const e = app.eq.analyzer && app.eq.analyzer.exc; if (e && !app.S.simOn) e.material.emissiveIntensity = 0; };

export const PELICULA = [
  {
    intro: true, tarjeta: 6, dur: 17, modo: 'equipo', e1: 0, xray: false, foco: EXT, dir: [0.5, 0.45, 1], pad: 1.0, trans: 0, orbita: -2.2, acercar: 0.06,
    texto: 'El scimaX de Bruker es un espectrómetro de resonancia ciclotrónica de iones con transformada de Fourier. Mide la relación masa carga a partir de la frecuencia con la que cada ion gira en un campo magnético de siete teslas.',
  },
  {
    cap: 'Fuente de iones', titulo: 'Electrospray y MALDI', dur: 16, modo: 'analizador', e2: 0.4, xray: false, foco: ['fuente_dual', 'capilar', 'embudos'],
    dir: [0.5, 0.45, 1], pad: 1.3, trans: 3.0, orbita: 3, acercar: 0.07, resaltar: ['fuente_dual', 'capilar'],
    texto: 'La fuente dual genera iones por electrospray o por desorción láser desde una diana MALDI, y se cambia de una a otra desde el programa. El capilar de vidrio los transfiere a la primera etapa de vacío.',
  },
  {
    cap: 'Arquitectura', titulo: 'Vista explosionada', dur: 15, modo: 'equipo', e1: 1, xray: false, foco: ['carcasa_fuente', 'camara_vacio', 'bombas_turbo', 'electronica', 'iman', 'criorrefrigerador', 'chasis'],
    dir: [0.75, 0.6, 0.8], pad: 1.0, trans: 3.0, orbita: -3, resaltar: [],
    texto: 'La consola aloja la fuente, el banco de óptica iónica, las bombas y la electrónica. Detrás, alineado con el eje de los iones, está el imán superconductor, con el criorrefrigerador encima.',
  },
  {
    cap: 'Óptica iónica', titulo: 'Embudos, cuadrupolo y celda de colisión', dur: 16, modo: 'analizador', e2: 0.4, xray: true, foco: ['embudos', 'multipolo', 'cuadrupolo', 'celda_colision'],
    dir: [0.4, 0.5, 1], pad: 1.2, trans: 3.0, orbita: -3.5, acercar: 0.06, resaltar: ['embudos', 'cuadrupolo', 'hexapolo'],
    texto: 'Un embudo de dos etapas enfoca el chorro de iones. El cuadrupolo aísla un precursor o enriquece una ventana de masas, y la celda de colisión acumula los iones, los enfría con argón y puede fragmentarlos.',
  },
  {
    cap: 'Transferencia', titulo: 'Viaje al centro del imán', dur: 16, modo: 'analizador', e2: 0, xray: true, foco: ['celda_colision', 'optica_transferencia', 'tubo_uhv', 'paracell'],
    dir: [0.3, 0.42, 1], pad: 1.1, trans: 3.0, orbita: 2.5, acercar: 0.05, resaltar: ['optica_transferencia', 'tubo_uhv'],
    texto: 'Desde la celda de colisión, los iones se pulsan por la óptica de transferencia a lo largo del bore del imán. El viaje dura alrededor de un milisegundo y actúa como filtro: los iones ligeros llegan antes.',
  },
  {
    cap: 'Celda ICR', titulo: 'La ParaCell', dur: 17, modo: 'analizador', e2: 0.4, xray: true, foco: ['paracell', 'preamplificador'],
    dir: [0.5, 0.5, 1], pad: 1.6, trans: 3.0, orbita: 3.5, acercar: 0.07, resaltar: ['paracell'],
    texto: 'En el centro del campo, la ParaCell atrapa los iones: el imán los confina radialmente y los electrodos de atrapamiento, en el eje. Sus segmentos de bordes parabólicos crean un potencial casi ideal en todo el volumen.',
  },
  {
    cap: 'Detección', titulo: 'Excitación y corriente imagen', dur: 20, modo: 'analizador', e2: 0, xray: true, foco: ['paracell', 'tubo_uhv', 'preamplificador'],
    dir: [0.5, 0.5, 1], pad: 1.5, orbita: -3, acercar: 0.05, resaltar: ['paracell', 'preamplificador'],
    texto: 'Un barrido de radiofrecuencia lleva a los iones a una órbita amplia y coherente. Cada paquete induce en los electrodos una corriente imagen a su frecuencia ciclotrónica: a siete teslas, un ion de masa quinientos gira a unos doscientos quince kilohercios.',
  },
  {
    cap: 'Simulación', titulo: 'Estructura isotópica fina', dur: 22, modo: 'analizador', e2: 0, xray: true, sim: true,
    ctl: { muestra: 'spA1', T: '0.5', det: '1', proc: 'mag', velocidad: '1' },
    foco: ['paracell', 'preamplificador'], dir: [0.5, 0.5, 1], pad: 1.3, resaltar: [],
    eventos: [{ t: 13, ctl: { T: '4', det: '2', proc: 'abs' } }],
    texto: 'La transformada de Fourier convierte el transitorio en espectro. Con medio segundo de señal, los isotopólogos del pico A más uno de la sustancia P se confunden. Con cuatro segundos se separan el nitrógeno quince y el carbono trece, a solo seis milidaltons.',
  },
  {
    cap: 'Imán', titulo: 'Sin criógenos líquidos', dur: 16, modo: 'equipo', e1: 1, sim: false, xray: false, foco: ['iman', 'criorrefrigerador', 'compresor_helio'],
    dir: [0.6, 0.5, 0.9], pad: 1.1, trans: 3.2, orbita: -3, accion: apagarExc, resaltar: ['iman', 'criorrefrigerador', 'compresor_helio', 'lineas_helio'],
    texto: 'La bobina superconductora se enfría por conducción, con un criorrefrigerador de helio gas en circuito cerrado alimentado por un compresor. No hay llenados de helio ni de nitrógeno líquido, ni línea de quench.',
  },
  {
    cap: 'Servicios', titulo: 'Ultra alto vacío', dur: 13, modo: 'equipo', e1: 1, xray: true, foco: ['camara_vacio', 'bombas_turbo', 'bomba_previa', 'electronica'],
    dir: [-0.6, 0.55, 0.9], pad: 1.1, orbita: 3, accion: apagarExc, resaltar: ['camara_vacio', 'bombas_turbo', 'bomba_previa'],
    texto: 'Las bombas turbomoleculares hacen un bombeo diferencial hasta la celda ICR, en ultra alto vacío. Así los iones giran durante segundos sin chocar con el gas.',
  },
  {
    dur: 11, modo: 'equipo', e1: 0, foco: EXT, dir: [0.5, 0.45, 1], pad: 1.0, trans: 3.0, orbita: -2, accion: apagarExc, resaltar: [],
    texto: 'Frecuencias medidas durante segundos y resoluciones de más de veinte millones: así asigna el FT-ICR fórmulas moleculares exactas.',
  },
];
