// Fichas técnicas del Shimadzu UV-1900i.
// Fuentes: páginas del UV-1900i Plus en shimadzu.com y shimadzu.eu (características y prestaciones), página de diseño del UV-1900i
// (Shimadzu Design), nota de lanzamiento del UV-1900 (SSI, 2018) y la serie «Basics of UV-Vis-NIR Spectroscopy» de Shimadzu
// (estructura del espectrofotómetro, fuentes de luz, monocromadores y detectores).
// La disposición interna y las medidas de las piezas son aproximadas: Shimadzu no publica planos del equipo.

export const CATEGORIAS = ['Fuentes de luz', 'Monocromador', 'Doble haz y muestra', 'Detección y electrónica', 'Estructura y carcasa'];

export const INFO = {
  /* ---------- fuentes de luz ---------- */
  lampara_d2: {
    nombre: 'Lámpara de deuterio (D₂)', en: 'Deuterium lamp', cat: 'Fuentes de luz',
    funcion: 'Fuente del ultravioleta. Una descarga en arco dentro de deuterio a unos cientos de pascales emite un espectro continuo, estable en el UV, que sale por una ventana lateral hacia el espejo conmutador.',
    detalles: ['El cátodo caliente necesita unos 10 s de precalentamiento antes de iniciar la descarga.',
      'Su emisión útil termina hacia los 400 nm; el límite del lado corto lo pone el material de la ventana (sílice sintética o vidrio UV).',
      'Por encima de 400 nm emite líneas brillantes; las de 486,0 nm y 656,1 nm sirven para comprobar la exactitud de la longitud de onda.'],
    specs: [['Región útil', 'UV, hasta ≈ 400 nm'], ['Líneas de calibración', '486,0 y 656,1 nm']],
    une: ['espejo_conmutador', 'fuente_alimentacion', 'casa_lamparas'],
  },
  lampara_wi: {
    nombre: 'Lámpara halógena de wolframio (WI)', en: 'Tungsten-halogen lamp', cat: 'Fuentes de luz',
    funcion: 'Fuente del visible y del infrarrojo cercano. El filamento de wolframio, calentado por la corriente, emite un espectro continuo parecido al de un cuerpo negro de unos 3000 K.',
    detalles: ['El halógeno de la ampolla devuelve al filamento el wolframio evaporado (ciclo del halógeno): la ampolla no se ennegrece y la lámpara dura más.',
      'Es estable, barata y dura del orden de 2000 h (dato general de Shimadzu para este tipo de lámpara).'],
    specs: [['Región útil', 'Visible e IR cercano (≈ 350 nm en adelante)']],
    une: ['espejo_conmutador', 'fuente_alimentacion', 'casa_lamparas'],
  },
  espejo_conmutador: {
    nombre: 'Espejo conmutador de lámparas', en: 'Light-source switching mirror', cat: 'Fuentes de luz',
    funcion: 'Espejo giratorio situado entre las dos lámparas. Al cambiar su inclinación envía hacia la rendija de entrada la luz del deuterio (UV) o la de la lámpara halógena (visible), según la longitud de onda de medida.',
    detalles: ['El cambio se hace en la zona de 300–350 nm, donde las dos lámparas emiten con intensidad parecida.',
      'En el UV-1900 la inclinación óptima para cada lámpara se ajusta automáticamente al encender el equipo, de modo que al sustituir una lámpara no hay que alinearla a mano.',
      'Usar dos lámparas, cada una en su región, también reduce la luz que entra de más en el monocromador y, con ella, la luz parásita.'],
    specs: [['Cambio de lámpara', 'Zona de 300–350 nm']],
    une: ['lampara_d2', 'lampara_wi', 'rendija_entrada'],
  },
  casa_lamparas: {
    nombre: 'Casa de lámparas', en: 'Lamp house', cat: 'Fuentes de luz',
    funcion: 'Recinto metálico que aloja las dos lámparas y el espejo conmutador: impide que la luz y el calor de las lámparas lleguen al resto del sistema óptico y deja salir el haz solo hacia la rendija de entrada.',
    detalles: [], specs: [], une: ['lampara_d2', 'lampara_wi', 'rendija_entrada'],
  },

  /* ---------- monocromador ---------- */
  monocromador: {
    nombre: 'Monocromador Czerny-Turner', en: 'Czerny-Turner monochromator', cat: 'Monocromador',
    funcion: 'Separa la luz blanca en sus longitudes de onda y deja salir solo una banda estrecha. Tiene cinco elementos: rendija de entrada, espejo colimador, red de difracción, espejo de enfoque y rendija de salida.',
    detalles: ['En el montaje Czerny-Turner dos espejos esféricos dispuestos simétricamente hacen de colimador y de espejo de enfoque.',
      'El espejo de enfoque forma la imagen de la rendija de entrada sobre la rendija de salida para la longitud de onda elegida; las demás caen fuera de la rendija.',
      'Shimadzu destaca que el sistema es compacto y luminoso y alcanza 1 nm de resolución, suficiente para lo que exigen la USP y la Ph. Eur.'],
    specs: [['Montaje', 'Czerny-Turner'], ['Ancho de banda espectral', '1 nm'], ['Barrido', 'hasta 29 000 nm/min']],
    une: ['rendija_entrada', 'espejo_colimador', 'red_difraccion', 'espejo_focalizador', 'rendija_salida'],
  },
  rendija_entrada: {
    nombre: 'Rendija de entrada', en: 'Entrance slit', cat: 'Monocromador',
    funcion: 'Rendija vertical estrecha que convierte la lámpara en una fuente lineal bien definida. Su imagen es la que el monocromador proyecta, ya dispersada, sobre la rendija de salida.',
    detalles: ['Una rendija de entrada más ancha agranda la imagen en la salida y deja pasar longitudes de onda vecinas: empeora la resolución.'],
    specs: [], une: ['espejo_conmutador', 'espejo_colimador'],
  },
  espejo_colimador: {
    nombre: 'Espejo colimador', en: 'Collimating mirror', cat: 'Monocromador',
    funcion: 'Espejo cóncavo situado a su distancia focal de la rendija de entrada: convierte el haz divergente en un haz paralelo que ilumina toda la red de difracción.',
    detalles: ['Los espejos no tienen aberración cromática: todas las longitudes de onda, del UV al IR cercano, se enfocan igual.'],
    specs: [['Tipo', 'Espejo esférico con recubrimiento metálico']], une: ['rendija_entrada', 'red_difraccion'],
  },
  red_difraccion: {
    nombre: 'Red de difracción LO-RAY-LIGH', en: 'LO-RAY-LIGH diffraction grating', cat: 'Monocromador',
    funcion: 'Elemento dispersivo: sus surcos, muy finos y equidistantes, difractan cada longitud de onda en una dirección distinta. Un motor gira la red para que la longitud de onda elegida llegue a la rendija de salida.',
    detalles: ['Obedece la ecuación de la red, mλ = d (sen i + sen θ): con el paso d y el ángulo de incidencia i fijos, cada λ sale con un ángulo θ.',
      'Las redes de reflexión de los espectrofotómetros tienen de 500 a 2000 surcos por milímetro; son réplicas de una red maestra recubiertas de aluminio.',
      'LO-RAY-LIGH es la tecnología de Shimadzu de redes de baja luz parásita: superficies muy lisas que dispersan poca luz fuera de la dirección de difracción.'],
    specs: [['Tecnología', 'LO-RAY-LIGH (baja luz parásita)'], ['Luz parásita del equipo', '≤ 0,5 % a 198 nm']],
    une: ['espejo_colimador', 'espejo_focalizador'],
  },
  espejo_focalizador: {
    nombre: 'Espejo de enfoque', en: 'Camera (focusing) mirror', cat: 'Monocromador',
    funcion: 'Segundo espejo cóncavo: recoge la luz dispersada por la red y enfoca sobre la rendija de salida el «arco iris» de imágenes de la rendija de entrada, una por longitud de onda.',
    detalles: [], specs: [['Tipo', 'Espejo esférico con recubrimiento metálico']], une: ['red_difraccion', 'rendija_salida'],
  },
  rendija_salida: {
    nombre: 'Rendija de salida', en: 'Exit slit', cat: 'Monocromador',
    funcion: 'Deja pasar solo la porción del espectro que cae sobre ella. Su anchura fija el ancho de banda espectral: en el UV-1900i, 1 nm a media altura (por ejemplo, de 539,5 a 540,5 nm si se mide a 540 nm).',
    detalles: ['Para reproducir bien la forma de una banda, el ancho de banda debe ser de 1/8 a 1/10 de su anchura a media altura; entonces el pico medido conserva al menos el 99 % de su altura.',
      'Para medidas cuantitativas de disoluciones basta con 1–2 nm.'],
    specs: [['Ancho de banda espectral', '1 nm']], une: ['espejo_focalizador', 'filtro'],
  },
  filtro: {
    nombre: 'Filtro de corte de órdenes superiores', en: 'Higher-order cut filter', cat: 'Monocromador',
    funcion: 'La red también difracta en la misma dirección luz de orden 2, 3… de longitud de onda la mitad, un tercio… de la elegida. Tras la rendija de salida, un filtro de corte de longitudes de onda cortas elimina esa luz.',
    detalles: ['En el modelo es una rueda con varios filtros que se cambia según la longitud de onda; la disposición real es aproximada.'],
    specs: [], une: ['rendija_salida', 'espejos_planos'],
  },
  banco_optico: {
    nombre: 'Banco óptico', en: 'Optical base plate', cat: 'Monocromador',
    funcion: 'Placa rígida de fundición sobre la que se montan las lámparas, el monocromador y los espejos: mantiene la alineación óptica frente a vibraciones y cambios de temperatura.',
    detalles: [], specs: [], une: ['monocromador', 'casa_lamparas'],
  },

  /* ---------- doble haz y muestra ---------- */
  espejos_planos: {
    nombre: 'Espejos planos de transferencia', en: 'Plane transfer mirrors', cat: 'Doble haz y muestra',
    funcion: 'Llevan la luz monocromática del monocromador al divisor de haz y, después de dividirla, dirigen el haz de muestra hacia su cubeta.',
    detalles: ['Número y posición aproximados.'], specs: [], une: ['filtro', 'divisor_haz'],
  },
  divisor_haz: {
    nombre: 'Divisor de haz (doble haz)', en: 'Beam splitter', cat: 'Doble haz y muestra',
    funcion: 'Divide la luz monocromática en dos haces antes del compartimento: uno atraviesa la cubeta de muestra y el otro la de referencia. Así el equipo mide a la vez I (muestra) e I₀ (referencia).',
    detalles: ['Como las dos señales se miden simultáneamente, las variaciones de intensidad de la lámpara y la deriva de la electrónica afectan por igual a ambas y se cancelan en el cociente.',
      'En el modelo el divisor es una lámina semirreflectante; el elemento exacto y su posición en el UV-1900i no se han podido confirmar.'],
    specs: [['Sistema', 'Doble haz']], une: ['espejos_planos', 'portacubetas', 'detectores'],
  },
  compartimento: {
    nombre: 'Compartimento de muestras', en: 'Sample compartment', cat: 'Doble haz y muestra',
    funcion: 'Cámara cerrada y oscura por la que cruzan los dos haces. En la configuración estándar lleva dos portacubetas para cubetas cuadradas de 10 mm, uno en cada haz: el de la muestra (S) y el de la referencia (R).',
    detalles: ['Los portacubetas se sustituyen por accesorios: cambiador de cubetas, portacubetas termostatizado, portatubos, soporte de películas…'],
    specs: [], une: ['portacubetas', 'cubetas', 'tapa_muestras'],
  },
  portacubetas: {
    nombre: 'Portacubetas', en: 'Cell holders', cat: 'Doble haz y muestra',
    funcion: 'Sujetan las cubetas siempre en la misma posición, con sus caras pulidas perpendiculares al haz, y un muelle las aprieta contra el tope.',
    detalles: [], specs: [['Cubetas', 'Cuadradas de 10 mm de paso óptico']], une: ['cubetas', 'compartimento'],
  },
  cubetas: {
    nombre: 'Cubetas de cuarzo', en: 'Quartz cuvettes', cat: 'Doble haz y muestra',
    funcion: 'Contienen la disolución (muestra) y el disolvente puro (referencia). La luz atraviesa 10 mm de líquido: el paso óptico b de la ley de Beer-Lambert.',
    detalles: ['Dos caras pulidas para el paso de la luz y dos esmeriladas para cogerla.',
      'El cuarzo transmite en el UV; el vidrio y los plásticos corrientes absorben por debajo de unos 300–340 nm y solo sirven en el visible.',
      'Medir frente al disolvente elimina el efecto de la reflexión en las caras de la cubeta y de la absorción del propio disolvente.'],
    specs: [['Paso óptico', '10 mm'], ['Material', 'Cuarzo (UV-Vis)']], une: ['portacubetas', 'detectores'],
  },

  /* ---------- detección y electrónica ---------- */
  detectores: {
    nombre: 'Detectores: fotodiodos de silicio', en: 'Silicon photodiodes', cat: 'Detección y electrónica',
    funcion: 'Un fotodiodo para cada haz convierte la luz en corriente eléctrica. El cociente entre la señal del haz de muestra y la del de referencia da la transmitancia, T = I/I₀, y de ella la absorbancia, A = −log T.',
    detalles: ['Efecto fotoeléctrico interno: el fotón crea un par electrón-hueco en la unión p-n y el campo de la zona de agotamiento los separa.',
      'La banda prohibida del silicio (≈ 1,12 eV) fija el límite del lado largo en unos 1100 nm, el extremo del rango del equipo.',
      'Frente a un fotomultiplicador son baratos, de sensibilidad uniforme en su superficie y sin fuente de alta tensión; con luz suficiente dan datos igual de buenos.'],
    specs: [['Tipo', 'Fotodiodo de silicio'], ['Límite superior', '≈ 1100 nm']], une: ['cubetas', 'electronica'],
  },
  electronica: {
    nombre: 'Placa principal', en: 'Main control board', cat: 'Detección y electrónica',
    funcion: 'Amplifica y digitaliza las corrientes de los fotodiodos, calcula T y A, mueve los motores de la red, del espejo conmutador y del filtro, gobierna la pantalla táctil y se comunica con el PC.',
    detalles: ['Funciona sola (pantalla táctil) o controlada desde LabSolutions UV-Vis.'], specs: [], une: ['detectores', 'pantalla', 'fuente_alimentacion'],
  },
  fuente_alimentacion: {
    nombre: 'Fuente de alimentación', en: 'Power supply', cat: 'Detección y electrónica',
    funcion: 'Alimenta la electrónica y las lámparas. La de deuterio necesita una fuente propia más compleja: precalentamiento del cátodo, tensión de encendido del arco y corriente estabilizada.',
    detalles: ['En el UV-1900i Plus, el modo de suspensión (Shutdown) limita el consumo de las lámparas y los motores cuando el equipo no se usa, y el de activación (Wakeup) lo enciende a una hora programada para que esté estable al empezar.'],
    specs: [], une: ['lampara_d2', 'lampara_wi', 'electronica'],
  },
  pantalla: {
    nombre: 'Pantalla táctil en color', en: 'Color touch panel', cat: 'Detección y electrónica',
    funcion: 'Permite trabajar sin ordenador: iconos grandes sobre fondo negro, seis modos de medida (fotométrico, espectro, cuantificación, cinética, curso temporal y biométodo) y la interfaz puede ponerse en español.',
    detalles: ['Se maneja con el dedo o con el lápiz que se guarda en el frontal.', 'Incluye las comprobaciones de validación de la JP, la USP y la Ph. Eur.', 'Admite lector de códigos de barras y teclado por USB.'],
    specs: [['Modos de medida', '6'], ['Idiomas (UV-1900i Plus)', '8, entre ellos el español']], une: ['panel_control', 'electronica'],
  },
  panel_control: {
    nombre: 'Bloque de mando', en: 'Control unit', cat: 'Estructura y carcasa',
    funcion: 'Bloque negro a la derecha del frontal con la pantalla inclinada hacia el usuario, el rótulo del modelo y el soporte del lápiz táctil.',
    detalles: ['La pantalla está orientada para verse y manejarse bien en cualquier postura (Shimadzu Design).'], specs: [], une: ['pantalla', 'carcasa'],
  },
  tapa_muestras: {
    nombre: 'Tapa del compartimento de muestras', en: 'Sample compartment lid', cat: 'Estructura y carcasa',
    funcion: 'Tapa negra del centro de la cubierta. Se levanta para colocar las cubetas y, cerrada, deja el compartimento a oscuras: la luz ambiente que llegara a los detectores falsearía la medida.',
    detalles: [], specs: [], une: ['compartimento', 'carcasa'],
  },
  carcasa: {
    nombre: 'Carcasa', en: 'Covers', cat: 'Estructura y carcasa',
    funcion: 'Cuerpo blanco de curvas suaves con cubierta superior negra. El compartimento de muestras y la pantalla quedan del lado del usuario.',
    detalles: ['Diseño premiado con el Red Dot 2019 (Product Design). Shimadzu buscó formas redondeadas y sin salientes, fáciles de limpiar.',
      'Medidas del modelo tomadas de fotografías: aproximadas.'],
    specs: [], une: ['tapa_muestras', 'panel_control'],
  },
  sistema_optico: {
    nombre: 'Sistema óptico', en: 'Optical system', cat: 'Estructura y carcasa',
    funcion: 'Lámparas, monocromador, divisor de haz, compartimento de muestras y detectores: el camino completo de la luz, de la fuente a la medida de la absorbancia.',
    detalles: [], specs: [['Rango', '190–1100 nm'], ['Intervalo fotométrico', '−4 a 4 Abs'], ['Repetibilidad fotométrica', '0,0002 Abs máx. (a 0,5 y 1,0 Abs)']],
    une: ['monocromador', 'divisor_haz', 'detectores'],
  },
};
