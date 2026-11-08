// Recorrido guiado del Agilent 7900 ICP-MS.
export const RECORRIDO = [
  {
    titulo: 'Espectrometría de masas elemental',
    texto: 'El ICP-MS no mide moléculas sino elementos: un plasma de argón descompone la muestra en átomos y los ioniza. Un cuadrupolo cuenta después los iones de cada isótopo. Se usa para metales y trazas en aguas, alimentos, suelos, fluidos biológicos y semiconductores.',
    modo: 'equipo', e1: 0, xray: false, foco: ['automuestreador', 'bomba_peristaltica', 'panel_frontal', 'chasis'], resaltar: [],
  },
  {
    titulo: 'De la muestra al aerosol',
    texto: 'La bomba peristáltica aspira la disolución desde el automuestreador. El nebulizador MicroMist la rompe en gotas con un chorro de argón, y la cámara de Scott, refrigerada a 2 °C, deja pasar solo las más finas. El resto se va por el drenaje.',
    modo: 'analizador', e2: 0.25, xray: false, foco: ['nebulizador', 'camara_nebulizacion', 'peltier'], dir: [-0.4, 0.5, 1], pad: 1.3,
    resaltar: ['nebulizador', 'camara_nebulizacion', 'peltier'],
  },
  {
    titulo: 'La antorcha y el plasma',
    texto: 'El aerosol entra por el inyector central de la antorcha de cuarzo. La bobina, alimentada a 27 MHz, mantiene un plasma de argón de 6000–10 000 K. En el canal central la muestra se seca, se vaporiza, se atomiza y se ioniza.',
    modo: 'analizador', e2: 0.2, xray: false, sim: false, foco: ['antorcha', 'bobina', 'escudo_antorcha'], dir: [0.2, 0.45, 1], pad: 1.4,
    resaltar: ['antorcha', 'bobina', 'escudo_antorcha'],
  },
  {
    titulo: 'ShieldTorch',
    texto: 'Entre la bobina y la antorcha hay una lámina de platino conectada a tierra. Elimina la descarga secundaria en la interfaz y estrecha la distribución de energía de los iones, condición necesaria para que funcione la discriminación por energía en la celda.',
    modo: 'analizador', e2: 0.5, xray: false, foco: ['escudo_antorcha', 'bobina', 'antorcha'], dir: [0.3, 0.4, 1], pad: 1.5, resaltar: ['escudo_antorcha'],
  },
  {
    titulo: 'Conos de muestreo y de separación',
    texto: 'El cono de muestreo toma el centro del plasma por un orificio de alrededor de 1 mm y lo lleva a la región de interfaz, a unos cientos de pascales. El cono de separación, más agudo, deja pasar la parte central del chorro hacia la cámara de lentes.',
    modo: 'analizador', e2: 0.45, xray: false, foco: ['cono_muestreo', 'interfaz', 'cono_separador'], dir: [-0.5, 0.35, 1], pad: 1.4,
    resaltar: ['cono_muestreo', 'cono_separador', 'interfaz'],
  },
  {
    titulo: 'Lente Omega fuera de eje',
    texto: 'Las lentes de extracción aceleran los iones positivos y la lente Omega los desvía fuera del eje. Los fotones del plasma y las partículas neutras siguen recto y no llegan al analizador, lo que mantiene un fondo inferior a 1 cuenta por segundo.',
    modo: 'analizador', e2: 0, xray: false, foco: ['lentes_extraccion', 'lente_omega'], dir: [0.3, 0.35, 1], pad: 1.5,
    resaltar: ['lentes_extraccion', 'lente_omega'],
  },
  {
    titulo: 'Celda ORS⁴ en modo helio',
    texto: 'El plasma y la matriz forman iones poliatómicos (ArO⁺ sobre ⁵⁶Fe, ArCl⁺ sobre ⁷⁵As, Ar₂⁺ sobre ⁸⁰Se) con la misma masa nominal que los analitos. En la celda, los poliatómicos, más grandes, chocan más con el helio y pierden más energía; la barrera de salida los rechaza.',
    modo: 'analizador', e2: 0, xray: true, foco: ['celda_ors', 'lente_kd'], dir: [0.3, 0.35, 1], pad: 1.4, resaltar: ['celda_ors', 'octopolo', 'lente_kd'],
  },
  {
    titulo: 'Cuadrupolo y detector',
    texto: 'El cuadrupolo hiperbólico salta de una masa a otra en microsegundos y transmite un solo isótopo cada vez. El detector ortogonal, de dínodos discretos, cuenta los iones en modo de pulsos o analógico: once órdenes de magnitud de rango dinámico.',
    modo: 'analizador', e2: 0.15, xray: true, foco: ['cuadrupolo', 'detector'], dir: [0.4, 0.4, 1], pad: 1.3, resaltar: ['cuadrupolo', 'detector'],
  },
  {
    titulo: 'Simulación: interferencias',
    texto: 'Compara el espectro sin gas y en modo helio. Sin gas, el ArO⁺, el ArCl⁺ o el Ar₂⁺ hacen aparecer concentraciones falsas de Fe, As o Se. En modo helio las barras rojas desaparecen y la concentración medida coincide con la real.',
    modo: 'analizador', e2: 0, xray: true, sim: true, foco: ['antorcha', 'cono_muestreo', 'celda_ors', 'cuadrupolo', 'detector'], dir: [0.15, 0.45, 1], resaltar: [],
  },
  {
    titulo: 'Vacío, gases y servicios',
    texto: 'Una turbo de flujo dividido evacúa la cámara de lentes y el analizador, y la bomba rotatoria la interfaz. El equipo necesita argón, helio para la celda, agua de refrigeración para la interfaz y una extracción sobre la chimenea de la antorcha.',
    modo: 'equipo', e1: 1, xray: false, sim: false, foco: ['camara_vacio', 'bomba_turbo', 'bomba_rotatoria', 'control_gases', 'enfriador'],
    resaltar: ['camara_vacio', 'tapa_vacio', 'bomba_turbo', 'bomba_rotatoria', 'linea_vacio', 'control_gases', 'enfriador'],
  },
];
