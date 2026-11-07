// Recorrido guiado: cada paso fija modo, explosionado, transparencia, piezas resaltadas y encuadre.
export const RECORRIDO = [
  {
    titulo: 'Configuración del sistema GC/MSD',
    texto: 'A la izquierda, el cromatógrafo de gases separa los componentes de la muestra. A la derecha, el detector selectivo de masas (MSD) los ioniza, filtra los iones por su relación m/z y los detecta. Cada compuesto queda caracterizado por su tiempo de retención y su espectro de masas.',
    modo: 'equipo', e1: 0, xray: false, foco: ['gc', 'panel_frontal', 'carcasa_superior'], resaltar: [],
  },
  {
    titulo: 'Interfaz GC/MSD',
    texto: 'La columna capilar sale del horno, atraviesa la interfaz calefactada (≈ 280 °C) y termina dentro de la cámara de ionización. Como su extremo trabaja en alto vacío, el propio MSD aspira el gas portador, con un caudal habitual de 1 mL/min de helio.',
    modo: 'equipo', e1: 0, xray: true, foco: ['linea_transferencia', 'gc_columna_horno', 'analizador'],
    resaltar: ['linea_transferencia', 'gc_columna_horno', 'gc_inyector'],
  },
  {
    titulo: 'Sistema de vacío',
    texto: 'La bomba turbomolecular, situada bajo la cámara, mantiene una presión de ≈ 10⁻⁵ Torr. La bomba de vacío previo evacúa su escape a través de la línea de vacío. A esta presión el recorrido libre medio de las moléculas es de varios metros, muy superior a la trayectoria del ion.',
    modo: 'equipo', e1: 0.55, xray: true, foco: ['camara_vacio', 'bomba_turbo', 'bomba_previa'],
    resaltar: ['camara_vacio', 'bomba_turbo', 'rotor_turbo', 'bomba_previa', 'manguera_previa'],
  },
  {
    titulo: 'Placa lateral y acceso al analizador',
    texto: 'El analizador (fuente, cuadrupolo y detector) está montado sobre la placa lateral. Tras ventilar el equipo, la placa se abre y el conjunto sale de la cámara de vacío. La tarjeta de control de la fuente y el generador de RF van fijados en su cara exterior.',
    modo: 'equipo', e1: 1, xray: false, foco: ['placa_lateral', 'analizador'],
    resaltar: ['placa_lateral', 'analizador', 'bobina_rf', 'placa_lateral_electronica'],
  },
  {
    titulo: 'Fuente de iones por impacto electrónico',
    texto: 'El filamento emite electrones que se aceleran hasta 70 eV y cruzan la cámara de ionización, colimados por los imanes. El impacto arranca un electrón a la molécula (M•⁺) y produce una fragmentación reproducible. El repulsor dirige los iones hacia la salida.',
    modo: 'analizador', e2: 0.55, xray: false, foco: ['cuerpo_fuente', 'filamento1', 'filamento2', 'repulsor', 'calefactor_fuente'],
    resaltar: ['cuerpo_fuente', 'filamento1', 'filamento2', 'iman1', 'iman2', 'repulsor'],
  },
  {
    titulo: 'Extracción y enfoque',
    texto: 'La placa extractora, la lente de enfoque y la lente de entrada forman un sistema de lentes electrostáticas que extrae los iones, los acelera y concentra el haz sobre el eje del cuadrupolo. Los aislantes cerámicos permiten aplicar a cada lente un potencial independiente.',
    modo: 'analizador', e2: 0.55, xray: false, foco: ['extractor', 'lente_enfoque', 'lente_entrada'],
    resaltar: ['extractor', 'lente_enfoque', 'lente_entrada', 'aislante1', 'aislante2'],
  },
  {
    titulo: 'Filtro de masas cuadrupolar',
    texto: 'Los cuatro electrodos hiperbólicos de cuarzo recubierto de oro reciben ±(U + V cos Ωt). Para cada par de valores U y V solo los iones de una m/z mantienen una trayectoria estable; el resto colisiona con los electrodos. El espectro se obtiene barriendo U y V con relación U/V constante.',
    modo: 'analizador', e2: 0.55, xray: false, foco: ['cuadrupolo', 'radiador_sup', 'radiador_inf'],
    resaltar: ['cuadrupolo', 'radiador_sup', 'radiador_inf'],
  },
  {
    titulo: 'Detector de triple eje',
    texto: 'Los iones transmitidos se desvían hacia el dínodo de alta energía (≈ −10 kV), situado fuera del eje. El impacto genera electrones secundarios que entran en el multiplicador de dínodo continuo, donde la cascada amplifica la señal entre 10⁵ y 10⁶ veces. Las especies neutras y los fotones no alcanzan el detector.',
    modo: 'analizador', e2: 0.55, xray: false, foco: ['hed', 'multiplicador', 'carcasa_detector', 'lente_detector'],
    resaltar: ['hed', 'multiplicador', 'lente_detector'],
  },
  {
    titulo: 'Simulación del barrido',
    texto: 'El panel inferior muestra el espectro, que se construye a medida que el cuadrupolo barre las m/z, y la posición de cada ion en el diagrama de estabilidad de Mathieu. Los iones estables llegan al detector; los inestables colisionan con los electrodos. Pueden probarse el modo SIM y otras muestras.',
    modo: 'analizador', e2: 0, xray: true, sim: true, foco: ['cuerpo_fuente', 'cuadrupolo', 'hed', 'multiplicador'], resaltar: [],
  },
  {
    titulo: 'Electrónica y adquisición de datos',
    texto: 'La tarjeta lateral alimenta la fuente de iones, el generador de RF suministra U y V al cuadrupolo y la tarjeta principal sincroniza el barrido con la señal del detector, la digitaliza y la envía al ordenador. El sistema registra varios espectros por segundo a lo largo del cromatograma.',
    modo: 'equipo', e1: 1, xray: false, sim: false, foco: ['placa_principal', 'bobina_rf', 'placa_lateral_electronica', 'fuente_alimentacion'],
    resaltar: ['placa_principal', 'bobina_rf', 'placa_lateral_electronica', 'fuente_alimentacion'],
  },
];
