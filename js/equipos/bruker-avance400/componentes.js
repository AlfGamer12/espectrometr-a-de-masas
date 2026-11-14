// Fichas técnicas del Bruker AVANCE NEO 400 (RMN de 400 MHz con imán Ascend 400 de bore estándar).
// Fuentes: páginas de Bruker de los imanes Ascend, de la consola AVANCE NEO y del SampleCase; nota de lanzamiento de la AVANCE NEO
// (2017); fichas de equipos AVANCE NEO 400 de laboratorios universitarios (Iowa State, Toronto, Oslo). Las frecuencias se calculan
// con las razones giromagnéticas y las relaciones de frecuencia IUPAC (Ξ). «aprox.» = estimación o valor típico no publicado.

export const CATEGORIAS = [
  'Imán superconductor', 'Criostato', 'Bore y sonda', 'Muestra', 'Electrónica de RF', 'Control y servicios', 'Instalación',
];

export const INFO = {
  /* ============ IMÁN ============ */
  iman: {
    nombre: 'Imán superconductor Ascend 400', en: 'Ascend 400 superconducting magnet (54 mm standard bore)', cat: 'Imán superconductor',
    funcion: 'Crea el campo B₀ de 9,4 T, vertical y extraordinariamente homogéneo y estable, en el que los núcleos de ¹H precesan a 400 MHz. Por fuera es un criostato cilíndrico: la bobina trabaja sumergida en helio líquido y rodeada de pantallas térmicas y de vacío.',
    detalles: [
      'Frecuencia de Larmor: ν = γB₀/2π. Para el ¹H, γ/2π = 42,577 MHz/T, de modo que 400,1 MHz corresponden a B₀ ≈ 9,40 T. En el mismo imán, el ¹³C resuena a 100,6 MHz, el ²H a 61,4 MHz, el ¹⁹F a 376,5 MHz y el ³¹P a 162,0 MHz.',
      'Bore estándar (SB) de 54 mm: es el hueco a temperatura ambiente por el que entran desde abajo el sistema de shim y la sonda, y desde arriba la muestra.',
      'Es un imán con apantallamiento activo: una segunda bobina con corriente opuesta confina el campo de dispersión cerca del equipo y facilita la instalación.',
      'Funciona en modo persistente, sin fuente de alimentación conectada. Según Bruker, el campo tardaría cientos de años en disminuir un 1 %; la pequeña deriva restante la compensa el lock.',
      'Alrededor del imán se marca la línea de 5 G (0,5 mT): dentro de ella no deben entrar personas con marcapasos ni objetos ferromagnéticos sueltos.',
    ],
    specs: [['Campo', '9,4 T (¹H 400 MHz)'], ['Bore', '54 mm (standard bore)'], ['Apantallamiento', 'Activo'], ['Dimensiones', 'No publicadas en las fichas; modelo ≈ 66 cm de diámetro (aprox.)']],
    une: ['bobina', 'torretas', 'soporte', 'camara_vacio'],
  },
  bobina: {
    nombre: 'Solenoide superconductor de NbTi', en: 'Main superconducting coil (NbTi)', cat: 'Imán superconductor',
    funcion: 'Solenoide de varias secciones devanado con hilo de niobio-titanio en matriz de cobre. Por debajo de su temperatura crítica (≈ 9 K) el NbTi no tiene resistencia eléctrica: la corriente circula indefinidamente sin disipar calor y genera el campo de 9,4 T.',
    detalles: [
      'Trabaja a 4,2 K, la temperatura de ebullición del helio a presión atmosférica, con margen frente a los límites de corriente y de campo del NbTi.',
      'Los imanes de campos más altos usan secciones de Nb₃Sn o de superconductores de alta temperatura (REBCO) en la parte interna; a 9,4 T basta el NbTi.',
      'El devanado está impregnado y sujeto para que las fuerzas magnéticas no lo muevan: un desplazamiento mínimo puede calentar un punto del hilo y provocar un quench.',
      'Quench: si una zona deja de ser superconductora, la energía almacenada se disipa en segundos, el helio se evapora de golpe y sale por las válvulas de sobrepresión. La sala necesita ventilación y detector de oxígeno.',
    ],
    specs: [['Conductor', 'NbTi en matriz de cobre'], ['Temperatura', '4,2 K (baño de helio a presión atmosférica)'], ['Corriente y energía', 'No publicadas']],
    une: ['bobina_apant', 'interruptor', 'deposito_he'],
  },
  bobina_apant: {
    nombre: 'Bobina de apantallamiento activo', en: 'Active shielding coil', cat: 'Imán superconductor',
    funcion: 'Bobina superconductora exterior conectada en serie con el solenoide principal y con la corriente en sentido contrario. Cancela casi todo el campo fuera del imán y apenas reduce el del centro.',
    detalles: ['Sin apantallamiento, la línea de 5 G de un imán de 9,4 T estaría a varios metros; con él queda cerca del criostato y el equipo cabe en un laboratorio normal.'],
    specs: [['Tipo', 'Superconductora, en serie con la bobina principal']],
    une: ['bobina', 'iman'],
  },
  interruptor: {
    nombre: 'Interruptor de modo persistente', en: 'Persistent-mode superconducting switch', cat: 'Imán superconductor',
    funcion: 'Tramo de hilo superconductor que cierra el circuito de la bobina sobre sí misma. Durante la carga se calienta con una pequeña resistencia para que deje de ser superconductor y la fuente externa pueda introducir la corriente; al enfriarlo, el bucle queda cerrado y la fuente se desconecta.',
    detalles: ['Las uniones entre hilos también son superconductoras; de su calidad depende la deriva del campo.'],
    specs: [],
    une: ['bobina'],
  },

  /* ============ CRIOSTATO ============ */
  deposito_he: {
    nombre: 'Depósito de helio líquido', en: 'Liquid helium vessel (4.2 K)', cat: 'Criostato',
    funcion: 'Recipiente anular de acero inoxidable que contiene la bobina sumergida en helio líquido a 4,2 K. El helio que se evapora sale por los cuellos y enfría de paso la pantalla de radiación.',
    detalles: [
      'Un sensor de nivel (un hilo superconductor vertical) indica cuánto helio queda; el llenado se hace con una línea de trasvase desde un dewar por una de las torretas.',
      'Bruker destaca intervalos de llenado excepcionalmente largos en los Ascend; el intervalo real depende del criostato y de las condiciones de la sala.',
      'Si el nivel baja demasiado y la bobina queda al descubierto, se calienta y se produce un quench.',
    ],
    specs: [['Temperatura', '4,2 K'], ['Volumen y consumo', 'Según el criostato (no se indica en el modelo)']],
    une: ['bobina', 'escudos', 'cuellos', 'torretas'],
  },
  escudos: {
    nombre: 'Pantallas de radiación', en: 'Radiation shields', cat: 'Criostato',
    funcion: 'Cilindros metálicos intermedios envueltos en superaislante (capas de lámina aluminizada) que interceptan el calor radiado desde las paredes a temperatura ambiente. La exterior está unida al depósito de nitrógeno (77 K); la interior se enfría con el vapor frío del helio.',
    detalles: ['La potencia radiada crece con T⁴: interponer una superficie a 77 K reduce muchísimo el calor que llega al helio a 4,2 K.'],
    specs: [['Temperaturas', '77 K (exterior) y intermedia, entre 4,2 y 77 K (interior)']],
    une: ['deposito_n2', 'deposito_he', 'camara_vacio'],
  },
  deposito_n2: {
    nombre: 'Depósito de nitrógeno líquido', en: 'Liquid nitrogen vessel (77 K)', cat: 'Criostato',
    funcion: 'Depósito anular con nitrógeno líquido a 77 K que mantiene fría la pantalla exterior. Reduce la carga térmica sobre el helio, mucho más caro y escaso.',
    detalles: [
      'Se rellena más a menudo que el helio, por las torretas de nitrógeno.',
      'Bruker ofrece licuadores que recondensan el nitrógeno evaporado y pueden eliminar casi por completo su consumo.',
    ],
    specs: [['Temperatura', '77 K'], ['Torretas', '3 en el modelo (aprox.)']],
    une: ['escudos', 'torretas', 'cuellos'],
  },
  camara_vacio: {
    nombre: 'Cámara de vacío (vaso exterior)', en: 'Outer vacuum chamber', cat: 'Criostato',
    funcion: 'Envolvente exterior estanca. El alto vacío entre ella y los depósitos elimina la conducción y la convección del aire; solo queda la radiación, que frenan las pantallas.',
    detalles: ['Su pared interior es el tubo del bore, a temperatura ambiente, que atraviesa el imán de arriba abajo.'],
    specs: [['Bore a temperatura ambiente', '54 mm']],
    une: ['escudos', 'iman', 'shims'],
  },
  cuellos: {
    nombre: 'Cuellos del criostato', en: 'Cryostat necks', cat: 'Criostato',
    funcion: 'Tubos largos de pared fina que unen los depósitos con las torretas de la tapa. Por ellos se llena y sale el gas evaporado, y su escasa sección limita el calor que entra por conducción.',
    detalles: ['Por los cuellos de helio pasan también los hilos del sensor de nivel y, durante la carga del imán, las barras de corriente.'],
    specs: [['Cuellos', '2 de helio y 3 de nitrógeno en el modelo (aprox.)']],
    une: ['deposito_he', 'deposito_n2', 'torretas'],
  },
  torretas: {
    nombre: 'Torretas de helio y de nitrógeno', en: 'Helium and nitrogen turrets', cat: 'Criostato',
    funcion: 'Prolongaciones de los cuellos sobre la tapa del imán: puertos de llenado, salidas del gas evaporado, válvulas antirretorno y válvulas de sobrepresión para un quench.',
    detalles: ['Las salidas de gas deben permanecer abiertas a través de sus válvulas: si se taponan, el hielo de aire o de agua puede bloquear un cuello.'],
    specs: [],
    une: ['cuellos', 'deposito_he', 'deposito_n2'],
  },

  /* ============ BORE Y SONDA ============ */
  shims: {
    nombre: 'Sistema de shim a temperatura ambiente', en: 'Room-temperature shim system', cat: 'Bore y sonda',
    funcion: 'Tubo con decenas de bobinas de corrección (Z, Z², X, Y, XZ…) que se introduce en el bore desde abajo. Sus corrientes, ajustadas para cada muestra, compensan las pequeñas inhomogeneidades del campo en el volumen de la muestra.',
    detalles: [
      'Para obtener líneas de 0,4 Hz a 400 MHz, el campo debe variar menos de una parte en 10⁹ dentro de la muestra.',
      'Dentro del criostato hay además shims superconductores, que se ajustan una vez al instalar el imán.',
      'El shimado automático por gradientes (TopShim) mide el mapa de campo a lo largo del tubo y corrige las funciones en pocos segundos.',
      'Un shim deficiente ensancha y deforma las líneas, mezcla multipletes y reduce la altura de los picos.',
    ],
    specs: [['Control', 'Corrientes desde la unidad BSMS'], ['Procedimiento', 'Manual o automático (TopShim)']],
    une: ['bsms', 'sonda', 'elevador'],
  },
  elevador: {
    nombre: 'Elevador neumático y turbina del spinner', en: 'Sample lift and spinner turbine (upper stack)', cat: 'Bore y sonda',
    funcion: 'Tubo superior por el que viaja la muestra. Con aire comprimido se sube la muestra hasta la boca del imán y se baja sobre un colchón de aire hasta la turbina, donde queda asentada justo encima de la sonda.',
    detalles: ['La turbina puede hacer girar el spinner (típicamente a unos 20 Hz) para promediar la inhomogeneidad transversal; hoy muchos espectros de ¹H se registran sin giro para evitar las bandas laterales de rotación.'],
    specs: [['Accionamiento', 'Aire comprimido seco (BSMS)']],
    une: ['spinner', 'muestra', 'samplecase', 'bsms'],
  },
  sonda: {
    nombre: 'Sonda de 5 mm a temperatura ambiente', en: 'Room-temperature 5 mm probe (BBO type)', cat: 'Bore y sonda',
    funcion: 'Se introduce en el bore desde abajo, dentro del tubo de shims, y sitúa sus bobinas de RF en el centro magnético. Emite los pulsos de radiofrecuencia sobre la muestra y recoge la débil señal inducida por la magnetización que precesa.',
    detalles: [
      'Una sonda de banda ancha (BBO) tiene un canal de ¹H, un canal X sintonizable para heteronúcleos (aproximadamente del ¹⁵N al ³¹P) y el canal de ²H para el lock.',
      'Lleva una bobina de gradiente de campo en z (para TopShim, supresión de disolvente y experimentos 2D con gradientes), un calefactor y un termopar junto a la muestra.',
      'Con una sonda de temperatura ambiente, el pulso de 90° de ¹H dura del orden de 10 µs. Las criosondas enfrían bobinas y preamplificador para reducir el ruido térmico.',
    ],
    specs: [['Tubo', '5 mm'], ['Canales', '¹H/¹⁹F, X (banda ancha), ²H (lock)'], ['Pulso de 90° (¹H)', '≈ 10 µs (aprox.)']],
    tune: ['P1 (pulso de 90°)', 'PLW1 (potencia)', 'wobb / atma (sintonía)'],
    une: ['bobina_rf', 'sintonia', 'shims', 'preamplificador', 'vtu'],
  },
  bobina_rf: {
    nombre: 'Bobinas de RF en silla de montar', en: 'Saddle (Helmholtz-type) RF coils', cat: 'Bore y sonda',
    funcion: 'Dos bobinas coaxiales en forma de silla de montar, giradas 90°, que rodean la zona central del tubo. Con el imán vertical, su campo de RF (B₁) es horizontal, perpendicular a B₀, como exige la excitación.',
    detalles: [
      'La misma bobina actúa de antena emisora durante el pulso y de receptora después: la magnetización transversal que precesa induce en ella una f.e.m. de microvoltios.',
      'La bobina más próxima a la muestra, con mejor factor de llenado, se optimiza para el núcleo que se observa con más sensibilidad.',
      'Un pulso de duración τ gira la magnetización un ángulo θ = γB₁τ: con γB₁/2π = 25 kHz, un pulso de 10 µs es de 90°.',
    ],
    specs: [['Altura activa', '≈ 2 cm (aprox.)'], ['Orientación de B₁', 'Horizontal, ⊥ B₀']],
    une: ['sonda', 'sintonia', 'muestra'],
  },
  sintonia: {
    nombre: 'Circuito de sintonía y adaptación', en: 'Tuning and matching circuit', cat: 'Bore y sonda',
    funcion: 'Condensadores que forman con la bobina un circuito resonante a la frecuencia de Larmor (sintonía) y lo adaptan a la impedancia de 50 Ω de los cables (adaptación), para que la potencia llegue a la bobina y la señal vuelva sin reflejarse.',
    detalles: ['Cada disolvente y cada concentración salina desplazan algo la resonancia: se resintoniza con la curva de «wobble» o automáticamente (ATMA).'],
    specs: [['Impedancia', '50 Ω'], ['Ajuste', 'Manual (varillas T y M) o automático (ATMA)']],
    tune: ['wobb', 'atma'],
    une: ['bobina_rf', 'sonda', 'preamplificador'],
  },

  /* ============ MUESTRA ============ */
  muestra: {
    nombre: 'Tubo de RMN de 5 mm', en: '5 mm NMR tube', cat: 'Muestra',
    funcion: 'Tubo de vidrio de 5 mm de diámetro exterior con unos 0,6 mL de disolución, que llena unos 4 cm de altura centrados en la bobina de RF.',
    detalles: [
      'El disolvente deuterado (CDCl₃, D₂O, DMSO-d₆…) aporta la señal de ²H del lock y evita una señal de ¹H gigantesca.',
      'El tetrametilsilano (TMS) define el cero de la escala de ppm; también puede usarse la señal residual del disolvente (CHCl₃ a 7,26 ppm).',
      'Partículas en suspensión o una altura de líquido insuficiente estropean la homogeneidad y no se corrigen con el shim.',
    ],
    specs: [['Diámetro', '5 mm'], ['Volumen típico', '≈ 0,6 mL (≈ 4 cm de altura)']],
    une: ['spinner', 'bobina_rf', 'lock'],
  },
  spinner: {
    nombre: 'Spinner', en: 'Spinner (sample rotor)', cat: 'Muestra',
    funcion: 'Rotor de plástico en el que se encaja el tubo. Se asienta en la turbina del elevador y fija la altura de la muestra respecto a la bobina.',
    detalles: ['La profundidad del tubo se ajusta con un medidor de profundidad para que la disolución quede centrada en la bobina.'],
    specs: [],
    une: ['muestra', 'elevador'],
  },

  /* ============ ELECTRÓNICA DE RF ============ */
  preamplificador: {
    nombre: 'Preamplificador HPPR/2', en: 'HPPR/2 preamplifier', cat: 'Electrónica de RF',
    funcion: 'Módulos de preamplificación, uno por canal (¹H/¹⁹F, X de banda ancha y ²H del lock), colocados junto al imán. Dejan pasar los pulsos de potencia hacia la sonda y, en cuanto terminan, conmutan para amplificar con muy poco ruido la señal recibida.',
    detalles: [
      'La señal de la muestra es de microvoltios; amplificarla cerca de la sonda evita que el ruido y las pérdidas de un cable largo degraden la relación señal/ruido.',
      'El conmutador de transmisión/recepción protege el preamplificador de los pulsos de decenas de vatios.',
      'Tras el pulso hay un breve tiempo muerto mientras la bobina «suena» y el receptor se recupera.',
    ],
    specs: [['Módulos', '¹H/¹⁹F, X-BB, ²H + módulo de control'], ['Posición', 'Junto al imán, conectado a la sonda']],
    une: ['sonda', 'amplificadores', 'transceptores', 'lock'],
  },
  amplificadores: {
    nombre: 'Amplificadores de RF', en: 'Linear RF power amplifiers', cat: 'Electrónica de RF',
    funcion: 'Amplifican linealmente los pulsos generados por los transceptores hasta la potencia que necesita la sonda (decenas de vatios para el ¹H), conservando su forma, fase y duración.',
    detalles: ['Suele haber una vía para ¹H/¹⁹F y otra de banda ancha para los núcleos X.'],
    specs: [['Tipo', 'Lineales, por canal']],
    une: ['transceptores', 'preamplificador'],
  },
  transceptores: {
    nombre: 'Transceptores TRX', en: 'TRX transceivers (frequency generation, receiver, digitizer)', cat: 'Electrónica de RF',
    funcion: 'Una tarjeta por canal reúne la generación de la frecuencia, la modulación de los pulsos (fase, amplitud y forma), el receptor y la digitalización. Cada canal funciona como un espectrómetro completo y todos pueden recibir a la vez.',
    detalles: [
      'Generación: osciladores numéricos (NCO) derivados de una referencia común fijan la frecuencia y la fase de cada pulso con resolución digital.',
      'Recepción: la señal preamplificada se convierte a una frecuencia intermedia, se digitaliza y se demodula en cuadratura respecto a la portadora. Resultan dos componentes (real e imaginaria) que distinguen frecuencias por encima y por debajo de ella.',
      'El filtrado digital con sobremuestreo limita la banda a la anchura espectral elegida (SW) y deja fuera el ruido de fuera de banda.',
      'Bruker denomina TRX1200 a este transceptor y cita una frecuencia intermedia superior a 1,8 GHz, que sirve también para los espectrómetros de más de 1,2 GHz.',
    ],
    specs: [['Arquitectura', 'Un transceptor por canal'], ['Salida', 'FID complejo (detección en cuadratura)']],
    tune: ['SFO1 (frecuencia)', 'SW (anchura espectral)', 'TD (puntos)', 'RG (ganancia del receptor)'],
    une: ['amplificadores', 'preamplificador', 'servidor'],
  },
  lock: {
    nombre: 'Lock de deuterio', en: '²H lock channel', cat: 'Electrónica de RF',
    funcion: 'Canal independiente que observa continuamente la resonancia del ²H del disolvente, a 61,4 MHz. Cuando el campo deriva, corrige una pequeña corriente de campo (Z0) para mantener esa resonancia fija: la frecuencia de ¹H de la muestra queda así estabilizada.',
    detalles: [
      'Al cambiar de disolvente se ajusta el lock (comando lock + disolvente); el nivel de la señal de lock sirve además para valorar el shim.',
      'Sin lock, la deriva del campo durante un experimento largo ensancharía las líneas acumuladas.',
    ],
    specs: [['Núcleo', '²H (61,4 MHz a 9,4 T)'], ['Acción', 'Realimentación sobre el campo (Z0)']],
    une: ['bsms', 'preamplificador', 'muestra'],
  },

  /* ============ CONTROL Y SERVICIOS ============ */
  bsms: {
    nombre: 'Unidad BSMS/2', en: 'BSMS/2 (shim, lift and spin control)', cat: 'Control y servicios',
    funcion: 'Suministra las corrientes estabilizadas a cada bobina de shim, controla el aire de elevación y de giro de la muestra y aloja el canal del lock.',
    detalles: ['Desde TopSpin (o desde un teclado de control) se manejan el elevador, el giro, el lock y los shims.'],
    specs: [],
    une: ['shims', 'lock', 'elevador'],
  },
  vtu: {
    nombre: 'Unidad de temperatura variable', en: 'Variable temperature unit', cat: 'Control y servicios',
    funcion: 'Regula la temperatura de la muestra con un flujo de gas que pasa por un calefactor en la sonda y sube alrededor del tubo; un termopar cerca de la muestra cierra el lazo.',
    detalles: ['Para trabajar por debajo de la temperatura ambiente se añade un enfriador del gas (en Iowa State, un BCU-I para el intervalo de −20 a +80 °C).'],
    specs: [['Gas', 'Aire seco o nitrógeno']],
    une: ['sonda'],
  },
  servidor: {
    nombre: 'Servidor de adquisición', en: 'Embedded acquisition server', cat: 'Control y servicios',
    funcion: 'Ordenador integrado en la consola que ejecuta en tiempo real los programas de pulsos, acumula los transitorios y entrega los datos a la estación de trabajo por la red.',
    detalles: ['La AVANCE NEO usa una arquitectura cliente-servidor: el espectrómetro funciona con independencia del ordenador cliente.'],
    specs: [['Conexión', 'Red Ethernet con la estación de trabajo']],
    une: ['transceptores', 'estacion'],
  },
  fuente: {
    nombre: 'Alimentación y distribución', en: 'Power supply and distribution', cat: 'Control y servicios',
    funcion: 'Fuentes de alimentación y distribución eléctrica de los módulos de la consola.',
    detalles: [], specs: [],
    une: ['consola'],
  },
  cableado: {
    nombre: 'Cableado y conducciones', en: 'RF cables, shim cable, VT gas and lift air', cat: 'Control y servicios',
    funcion: 'Cables coaxiales de RF entre consola, preamplificador y sonda; cable de shim; manguera del gas de temperatura variable y cable del calefactor y el termopar; manguera de aire del elevador; red con la estación de trabajo.',
    detalles: ['Todo lo que se acerca al imán debe ser amagnético: los conectores y herramientas de acero se atraen con fuerza cerca del bore.'],
    specs: [['Servicios externos', 'Aire comprimido seco, alimentación eléctrica, helio y nitrógeno líquidos']],
    une: ['preamplificador', 'sonda', 'shims', 'consola'],
  },

  /* ============ INSTALACIÓN ============ */
  consola: {
    nombre: 'Consola AVANCE NEO', en: 'AVANCE NEO console cabinet', cat: 'Instalación',
    funcion: 'Armario con la electrónica del espectrómetro: transceptores, amplificadores de RF, unidad BSMS con el lock, regulación de temperatura, servidor de adquisición y alimentación.',
    detalles: [
      'Bruker presentó la AVANCE NEO en 2017; se fabrica en armarios de distintos tamaños (Onebay, Twobay, Nanobay) según el número de canales y accesorios.',
      'En el modelo se ha representado un armario de una bahía; tamaño y disposición de los módulos son aproximados.',
    ],
    specs: [['Software', 'TopSpin'], ['Dimensiones', 'Según configuración (no publicadas en la ficha)']],
    une: ['transceptores', 'amplificadores', 'bsms', 'servidor'],
  },
  soporte: {
    nombre: 'Soporte del imán', en: 'Magnet stand', cat: 'Instalación',
    funcion: 'Anillo y tres patas que elevan el imán lo suficiente para introducir la sonda desde abajo. Bruker ofrece soportes de distintas alturas según la altura del techo y las sondas que se usen.',
    detalles: [], specs: [['Patas', '3']],
    une: ['amortiguadores', 'iman', 'sonda'],
  },
  amortiguadores: {
    nombre: 'Amortiguadores antivibración', en: 'Vibration damping posts', cat: 'Instalación',
    funcion: 'Apoyos amortiguados en la base de las patas que aíslan el imán de las vibraciones del suelo. Las vibraciones moverían la muestra en el campo y aparecerían como bandas laterales junto a las líneas.',
    detalles: ['El tipo de amortiguación (elastomérica o neumática) depende del lugar de instalación; en el modelo su forma es aproximada.'],
    specs: [],
    une: ['soporte'],
  },
  samplecase: {
    nombre: 'Cambiador de muestras SampleCase', en: 'SampleCase sample changer (24 positions)', cat: 'Instalación',
    funcion: 'Carrusel de 24 posiciones montado sobre el imán que deja las muestras en la boca del elevador y las recoge al terminar, para medir colas de muestras sin intervención.',
    detalles: [
      'Bruker lo ofrece con 24 o 60 posiciones, a temperatura ambiente o con el carrusel calefactado o refrigerado, para los imanes apantallados de bore estándar.',
      'Se integra con TopSpin; las colas de muestras se gestionan con programas de automatización como IconNMR.',
    ],
    specs: [['Posiciones', '24 (60 en SampleCase Plus)'], ['Tubos', 'De 1 a 10 mm, todas las longitudes']],
    une: ['elevador', 'iman', 'estacion'],
  },
  estacion: {
    nombre: 'Estación de trabajo', en: 'TopSpin workstation', cat: 'Instalación',
    funcion: 'Ordenador con TopSpin desde el que se prepara el experimento, se manejan lock, shim y sintonía, se lanza la adquisición y se procesa el FID: transformada de Fourier, fase, línea base, referencia e integración.',
    detalles: ['Un experimento de ¹H rutinario usa pulsos de 30°, 16 transitorios y 1 s de espera entre ellos.'],
    specs: [['Programa', 'TopSpin (adquisición y procesado)']],
    une: ['servidor', 'consola'],
  },
};
