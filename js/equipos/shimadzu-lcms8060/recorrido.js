// Recorrido guiado del LCMS-8060NX.
export const RECORRIDO = [
  {
    titulo: 'Configuración del sistema LC-MS/MS',
    texto: 'A la izquierda, la torre del cromatógrafo de líquidos separa los componentes de la muestra. A la derecha, la unidad MS de triple cuadrupolo los ioniza a presión atmosférica, selecciona un ion precursor, lo fragmenta y detecta un ion producto característico. Esta combinación permite cuantificar trazas en matrices complejas.',
    modo: 'equipo', e1: 0, xray: false, foco: ['lc', 'torre_fuente', 'carcasa_superior', 'panel_frontal'], resaltar: [],
  },
  {
    titulo: 'Del cromatógrafo a la sonda',
    texto: 'El eluyente sale de la columna por un tubo PEEK de 0,13 mm de diámetro interno, pasa por la válvula de desvío, que envía a desecho el frente de sales, y llega a la sonda ESI, que entra verticalmente en la unidad de ionización.',
    modo: 'equipo', e1: 0, xray: true, foco: ['lc_horno', 'valvula_desvio', 'torre_fuente'],
    resaltar: ['lc_horno', 'tubo_peek', 'valvula_desvio', 'sonda_esi'],
  },
  {
    titulo: 'Ionización por electrospray',
    texto: 'Una alta tensión aplicada al capilar de la sonda forma un aerosol de gotas cargadas. El gas nebulizador (N₂) y el gas de calentamiento (aire seco) evaporan el disolvente; las gotas se fisionan hasta liberar iones como [M+H]⁺. La pulverización es ortogonal a la entrada, de modo que las gotas grandes no penetran en el vacío.',
    modo: 'analizador', e2: 0, xray: false, foco: ['sonda_esi', 'bloque_calefactor', 'linea_desolvatacion'], dir: [0.45, 0.35, 1], pad: 1.25,
    resaltar: ['sonda_esi'],
  },
  {
    titulo: 'Interfaz: bloque calefactor y línea de desolvatación',
    texto: 'Los iones entran en el vacío a través de la línea de desolvatación, un capilar calefactado que completa la evaporación del disolvente. El bloque calefactor que la rodea emite gas de secado a contracorriente. La DL es la pieza de mantenimiento más frecuente del equipo.',
    modo: 'analizador', e2: 0.5, xray: false, foco: ['bloque_calefactor', 'linea_desolvatacion', 'sonda_esi'], dir: [0.5, 0.4, 1],
    resaltar: ['bloque_calefactor', 'linea_desolvatacion'],
  },
  {
    titulo: 'Bombeo diferencial y guías de iones',
    texto: 'La presión desciende en etapas: unos 10² Pa en la primera cámara, donde la guía UF-Qarray enfoca los iones y deja escapar el gas; un skimmer da paso a la segunda cámara, donde la guía multipolar UF-Lens transporta el haz hasta el alto vacío de los cuadrupolos.',
    modo: 'analizador', e2: 0.5, xray: false, foco: ['uf_qarray', 'skimmer', 'uf_lens', 'tabiques'], dir: [0.4, 0.45, 1],
    resaltar: ['uf_qarray', 'skimmer', 'uf_lens', 'tabiques'],
  },
  {
    titulo: 'Q1: selección del ion precursor',
    texto: 'El primer cuadrupolo, de barras hiperbólicas de molibdeno, transmite únicamente la m/z del ion precursor elegido. Las pre-barras, alimentadas solo con RF, suavizan el campo de entrada y protegen el filtro de la contaminación.',
    modo: 'analizador', e2: 0.5, xray: false, foco: ['q1_prebarras', 'q1'], dir: [0.3, 0.5, 1],
    resaltar: ['q1_prebarras', 'q1'],
  },
  {
    titulo: 'Celda de colisión: fragmentación por CID',
    texto: 'En la celda UFsweeper III el precursor colisiona con átomos de argón y se fragmenta. La energía de colisión determina qué fragmentos se forman. La geometría estrechada de la celda la vacía con gran rapidez (pausas de solo 1 ms entre transiciones), lo que permite alternar transiciones sin interferencias.',
    modo: 'analizador', e2: 0.5, xray: false, foco: ['celda_carcasa', 'celda_multipolo'], dir: [0.3, 0.5, 1],
    resaltar: ['celda_carcasa', 'celda_multipolo'],
  },
  {
    titulo: 'Q3 y detector',
    texto: 'El tercer cuadrupolo selecciona un ion producto. Los iones transmitidos se desvían hacia el dínodo de conversión, situado fuera del eje, y los electrones secundarios se amplifican en el multiplicador. La pareja precursor → producto define una transición MRM.',
    modo: 'analizador', e2: 0.5, xray: false, foco: ['q3', 'dinodo_conversion', 'multiplicador', 'carcasa_detector'], dir: [0.4, 0.45, 1],
    resaltar: ['q3_prebarras', 'q3', 'dinodo_conversion', 'multiplicador'],
  },
  {
    titulo: 'Simulación: MRM',
    texto: 'En modo MRM el equipo alterna entre transiciones cada pocos milisegundos. El panel muestra el cromatograma de cada transición a medida que eluyen los compuestos y el espectro de iones producto a la energía de colisión elegida. Pueden probarse el barrido de iones producto y el barrido Q1.',
    modo: 'analizador', e2: 0, xray: true, sim: true, foco: ['sonda_esi', 'q1', 'celda_multipolo', 'q3', 'multiplicador'], resaltar: [],
  },
  {
    titulo: 'Vacío, gases y electrónica',
    texto: 'Una única bomba turbomolecular de tres entradas (40, 260 y 210 L/s) bombea la segunda cámara y el alto vacío, mientras la bomba rotatoria evacúa la primera cámara y recoge el escape de la turbo. El nitrógeno y el aire seco alimentan la fuente, y el argón, la celda de colisión.',
    modo: 'equipo', e1: 1, xray: false, sim: false, foco: ['bomba_turbo', 'bomba_rotatoria', 'camara_vacio', 'linea_gases'],
    resaltar: ['bomba_turbo', 'bomba_rotatoria', 'linea_vacio_previo', 'linea_gases', 'generadores_rf'],
  },
];
