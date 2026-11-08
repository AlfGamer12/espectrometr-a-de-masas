// Recorrido guiado del scimaX MRMS.
export const RECORRIDO = [
  {
    titulo: 'Resonancia ciclotrónica de iones',
    texto: 'El FT-ICR determina la m/z midiendo la frecuencia con la que cada ion gira en un campo magnético intenso. Como las frecuencias se miden con enorme precisión, es la técnica de mayor resolución y exactitud de masa. El scimaX utiliza un imán de 7 T que no necesita criógenos líquidos.',
    modo: 'equipo', e1: 0, xray: false, foco: ['panel_frontal', 'iman', 'carcasa_fuente', 'chasis'], resaltar: [],
  },
  {
    titulo: 'Fuente dual ESI/MALDI',
    texto: 'Los iones se generan por electrospray o por desorción láser desde una diana MALDI, y se puede cambiar de una a otra desde el programa. El capilar los transfiere a la primera etapa de vacío.',
    modo: 'analizador', e2: 0.4, xray: false, foco: ['fuente_dual', 'capilar', 'embudos'], dir: [0.5, 0.45, 1], pad: 1.3,
    resaltar: ['fuente_dual', 'capilar'],
  },
  {
    titulo: 'Embudos, cuadrupolo y celda de colisión',
    texto: 'Un embudo de dos etapas enfoca el chorro de iones. El cuadrupolo puede aislar un precursor y la celda de colisión acumula los iones, los enfría con argón y, si se desea, los fragmenta antes de enviarlos a la celda ICR.',
    modo: 'analizador', e2: 0.4, xray: true, foco: ['embudos', 'multipolo', 'cuadrupolo', 'celda_colision'], dir: [0.4, 0.5, 1], pad: 1.2,
    resaltar: ['embudos', 'cuadrupolo', 'celda_colision', 'hexapolo'],
  },
  {
    titulo: 'Viaje al centro del imán',
    texto: 'Los iones se pulsan desde la celda de colisión a lo largo de la óptica de transferencia, que atraviesa el bore del imán durante aproximadamente un milisegundo. El tiempo de vuelo actúa como filtro: los iones ligeros llegan antes que los pesados.',
    modo: 'equipo', e1: 0.6, xray: true, foco: ['iman', 'camara_vacio', 'analizador'], dir: [0.35, 0.45, 1],
    resaltar: ['optica_transferencia', 'tubo_uhv'],
  },
  {
    titulo: 'Celda ParaCell',
    texto: 'En el centro del campo, los iones quedan atrapados: el campo magnético los confina radialmente y los electrodos de atrapamiento, en el eje. La celda está dividida en segmentos con bordes parabólicos que, en promedio, generan un potencial casi ideal en todo su volumen.',
    modo: 'analizador', e2: 0.4, xray: true, foco: ['paracell', 'preamplificador'], dir: [0.5, 0.5, 1], pad: 1.6,
    resaltar: ['paracell'],
  },
  {
    titulo: 'Excitación y corriente imagen',
    texto: 'Un barrido de radiofrecuencia excita a todos los iones a una órbita amplia y coherente. Cada paquete induce en los electrodos de detección una corriente oscilante a su frecuencia ciclotrónica, f = zeB/2πm: a 7 T, un ion de m/z 500 gira a unos 215 kHz. La detección no destruye los iones.',
    modo: 'analizador', e2: 0, xray: true, sim: true, foco: ['paracell', 'tubo_uhv', 'preamplificador'], dir: [0.5, 0.5, 1], pad: 1.5, resaltar: ['paracell'],
  },
  {
    titulo: 'Del transitorio al espectro',
    texto: 'La señal registrada durante segundos (el transitorio) es la suma de las oscilaciones de todos los iones. Su transformada de Fourier da las frecuencias y, por tanto, las m/z. Cuanto más dura el transitorio, más estrechos son los picos: R ≈ 1,274·10⁷·z·B·T/m.',
    modo: 'analizador', e2: 0, xray: true, sim: true, foco: ['paracell', 'tubo_uhv', 'preamplificador'], dir: [0.5, 0.5, 1], pad: 1.5, resaltar: [],
  },
  {
    titulo: 'Estructura isotópica fina',
    texto: 'Con resoluciones de cientos de miles se separan isotopólogos de la misma masa nominal. En el pico A+1 de la sustancia P, el ¹⁵N y el ¹³C difieren solo 6,3 mDa; en el A+2, el ³⁴S y el ¹³C₂ difieren 10,9 mDa. Su patrón revela directamente el número de átomos de N y de S.',
    modo: 'analizador', e2: 0, xray: true, sim: true, foco: ['paracell', 'tubo_uhv', 'preamplificador'], dir: [0.5, 0.5, 1], pad: 1.5, resaltar: [],
  },
  {
    titulo: 'Imán sin criógenos líquidos',
    texto: 'La bobina superconductora se enfría por conducción mediante un criorrefrigerador de circuito cerrado de helio, alimentado por un compresor. Así se evitan los llenados periódicos de helio líquido y la línea de quench de los FT-ICR convencionales.',
    modo: 'equipo', e1: 1, xray: false, sim: false, foco: ['iman', 'criorrefrigerador', 'compresor_helio'], dir: [0.45, 0.5, -0.9],
    resaltar: ['iman', 'criorrefrigerador', 'compresor_helio', 'lineas_helio'],
  },
  {
    titulo: 'Aplicaciones',
    texto: 'La resolución y la exactitud de masa del FT-ICR permiten asignar fórmulas moleculares exactas en mezclas con decenas de miles de componentes: crudos de petróleo, materia orgánica natural, metabolómica por inyección directa e imagen MALDI de tejidos.',
    modo: 'equipo', e1: 0, xray: false, foco: ['panel_frontal', 'iman', 'pc', 'chasis'], resaltar: [],
  },
];
