// Recorrido guiado del timsTOF Pro.
export const RECORRIDO = [
  {
    titulo: 'Proteómica en cuatro dimensiones',
    texto: 'El timsTOF combina un cromatógrafo nano-LC, una separación por movilidad iónica atrapada (TIMS), un cuadrupolo y un analizador de tiempo de vuelo. Cada ion queda descrito por cuatro magnitudes: tiempo de retención, movilidad, m/z e intensidad.',
    modo: 'equipo', e1: 0, xray: false, foco: ['panel_frontal', 'torre_tof', 'nanolc', 'chasis'], resaltar: [],
  },
  {
    titulo: 'Fuente CaptiveSpray',
    texto: 'Los péptidos que eluyen de la nano-LC, a unos cientos de nanolitros por minuto, se ionizan por electrospray en el emisor CaptiveSpray. El capilar de vidrio los transfiere al vacío y una placa los desvía 90°, de modo que las gotas y las moléculas neutras no continúan.',
    modo: 'analizador', e2: 0.4, xray: false, foco: ['captivespray', 'capilar', 'deflector', 'embudo_entrada'], dir: [0.5, 0.45, 1], pad: 1.4,
    resaltar: ['captivespray', 'capilar', 'deflector'],
  },
  {
    titulo: 'Movilidad iónica atrapada',
    texto: 'En el túnel TIMS el gas empuja a los iones y un gradiente de campo eléctrico los frena. Cada ion se detiene donde ambas fuerzas se equilibran: los grandes, que sienten más arrastre, necesitan más campo. Al bajar el campo eluyen de mayor a menor 1/K₀.',
    modo: 'analizador', e2: 0.4, xray: true, foco: ['tims_acumulacion', 'tims_analisis', 'embudo_entrada', 'embudo_salida'], dir: [0.5, 0.5, 1], pad: 1.3,
    resaltar: ['tims_acumulacion', 'tims_analisis'],
  },
  {
    titulo: 'Acumulación en paralelo',
    texto: 'El túnel tiene dos secciones: mientras la primera acumula los iones que llegan, la segunda analiza los del ciclo anterior. Así casi ningún ion se pierde y el ciclo de trabajo se acerca al 100 %. Una rampa típica dura 100 ms.',
    modo: 'analizador', e2: 0.6, xray: true, foco: ['tims_acumulacion', 'tims_analisis'], dir: [0.6, 0.6, 1], pad: 1.4,
    resaltar: ['tims_acumulacion'],
  },
  {
    titulo: 'Cuadrupolo sincronizado: PASEF',
    texto: 'Como cada precursor eluye del TIMS durante uno o dos milisegundos, el cuadrupolo puede saltar de uno a otro siguiendo la rampa. En una sola rampa se fragmentan unos diez precursores, lo que multiplica la velocidad de secuenciación por diez.',
    modo: 'analizador', e2: 0.4, xray: true, foco: ['cuadrupolo', 'celda_colision', 'guia_transferencia'], dir: [0.4, 0.5, 1], pad: 1.2,
    resaltar: ['cuadrupolo', 'celda_colision', 'celda_multipolo'],
  },
  {
    titulo: 'Acelerador ortogonal',
    texto: 'Los iones (o sus fragmentos) llegan al acelerador ortogonal, que los empuja hacia el tubo de vuelo con pulsos a unos 10 kHz. Cada pulso produce un espectro completo, lo bastante rápido para seguir la elución por movilidad.',
    modo: 'analizador', e2: 0.4, xray: true, foco: ['pusher', 'optica_transferencia', 'tubo_tof'], dir: [1, 0.4, 0.6], pad: 1.0,
    resaltar: ['pusher', 'optica_transferencia'],
  },
  {
    titulo: 'Tiempo de vuelo con reflectrón',
    texto: 'En la torre posterior, los iones suben hasta el reflectrón de dos etapas y vuelven hacia el detector de microcanales: una trayectoria en V. El digitalizador registra la señal a 5 GS/s. La resolución supera 35 000 con exactitudes de masa inferiores a 2 ppm.',
    modo: 'analizador', e2: 0.3, xray: true, foco: ['tubo_tof', 'reflectron', 'detector_mcp', 'pusher'], dir: [1, 0.3, 0.6], pad: 1.0,
    resaltar: ['tubo_tof', 'reflectron', 'detector_mcp'],
  },
  {
    titulo: 'Simulación: mapa m/z – movilidad',
    texto: 'El mapa muestra cada ion según su m/z y su 1/K₀. Los péptidos con dos y tres cargas forman bandas distintas, y los contaminantes con una carga aparecen separados, lo que permite excluirlos. Los rectángulos indican los precursores que el cuadrupolo selecciona en cada rampa.',
    modo: 'analizador', e2: 0, xray: true, sim: true, foco: ['captivespray', 'tims_analisis', 'cuadrupolo', 'tubo_tof'], resaltar: [],
  },
  {
    titulo: 'Sección eficaz de colisión',
    texto: 'La movilidad se convierte en sección eficaz de colisión (CCS) con la ecuación de Mason–Schamp. La CCS es una propiedad del ion, como su masa, y se usa como dato adicional de identificación. El calibrante de m/z 922,0098 tiene 1/K₀ = 1,1986 V·s/cm², que equivalen a unos 243,6 Å² en nitrógeno.',
    modo: 'analizador', e2: 0, xray: true, sim: true, foco: ['captivespray', 'tims_analisis', 'cuadrupolo', 'tubo_tof'], resaltar: ['tims_analisis'],
  },
  {
    titulo: 'Vacío, gases y electrónica',
    texto: 'La región de los embudos y del TIMS trabaja a unos 2–3 mbar; el resto del analizador, en alto vacío, mantenido por bombas turbomoleculares y una bomba de vacío previo. La electrónica sincroniza en tiempo real la rampa del TIMS, el cuadrupolo y el acelerador ortogonal.',
    modo: 'equipo', e1: 1, xray: false, sim: false, foco: ['camara_vacio', 'bombas_turbo', 'bomba_rotatoria', 'electronica'], dir: [0.75, 0.5, 0.65], pad: 1.15,
    resaltar: ['camara_vacio', 'bombas_turbo', 'bomba_rotatoria', 'electronica', 'digitalizador'],
  },
];
